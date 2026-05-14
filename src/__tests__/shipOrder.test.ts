import { describe, it, expect, vi } from 'vitest';

/**
 * Unit test cho logic shipOrder — chạy trên fake transaction.
 * Logic copy từ src/services/repositories/orders.ts đã đơn giản hóa
 * (không dùng Firestore SDK thật, chỉ test invariants).
 */

interface FakeDoc<T = any> {
  exists(): boolean;
  data(): T;
}

type Item = { productId: string; productName: string; quantity: number; price: number };
type FakeOrder = { status: string; items: Item[]; total: number; customerName: string };
type FakeProduct = { stock: number };

function makeFakeTx(
  order: FakeOrder | null,
  products: Record<string, FakeProduct>,
) {
  const writes: any[] = [];
  return {
    writes,
    get: vi.fn(async (ref: any) => {
      const doc: FakeDoc = {
        exists: () => false,
        data: () => ({}),
      };
      if (ref.kind === 'order') {
        doc.exists = () => order !== null;
        doc.data = () => order as any;
      } else if (ref.kind === 'product') {
        const p = products[ref.id];
        doc.exists = () => !!p;
        doc.data = () => p as any;
      }
      return doc;
    }),
    update: vi.fn((ref: any, patch: any) => {
      writes.push({ op: 'update', ref, patch });
    }),
    set: vi.fn((ref: any, data: any) => {
      writes.push({ op: 'set', ref, data });
    }),
  };
}

// Logic rút gọn (matching orders.ts shipOrder)
async function shipOrderLogic(
  orderId: string,
  staffUid: string,
  tx: ReturnType<typeof makeFakeTx>,
) {
  const orderRef = { kind: 'order', id: orderId };
  const orderSnap = await tx.get(orderRef);
  if (!orderSnap.exists()) throw new Error(`Order ${orderId} không tồn tại`);
  const order = orderSnap.data() as FakeOrder;

  if (order.status === 'shipped' || order.status === 'delivered') {
    throw new Error(`Đơn ${orderId} đã ${order.status} — không thể ship lại`);
  }

  const productSnaps = await Promise.all(
    order.items.map((it) => tx.get({ kind: 'product', id: it.productId })),
  );

  for (let i = 0; i < order.items.length; i++) {
    const item = order.items[i];
    const ps = productSnaps[i];
    if (!ps.exists()) throw new Error(`Product ${item.productId} không tồn tại`);
    const stock = ps.data().stock ?? 0;
    if (stock < item.quantity) throw new Error(`Product ${item.productId} chỉ còn ${stock}, cần ${item.quantity}`);
  }

  tx.update(orderRef, { status: 'shipped' });
  for (const item of order.items) {
    tx.update({ kind: 'product', id: item.productId }, { stock: { __decrement: item.quantity } });
    tx.set({ kind: 'inventory_movement', id: `${orderId}_${item.productId}` }, {
      productId: item.productId,
      type: 'stock_out',
      quantity: -item.quantity,
      refOrderId: orderId,
      staffId: staffUid,
    });
  }
}

describe('shipOrder transaction', () => {
  const validOrder: FakeOrder = {
    status: 'processing',
    customerName: 'Nguyễn Văn A',
    total: 1500000,
    items: [
      { productId: 'P1', productName: 'SP1', quantity: 2, price: 500000 },
      { productId: 'P2', productName: 'SP2', quantity: 1, price: 500000 },
    ],
  };

  it('ship thành công khi đủ stock', async () => {
    const tx = makeFakeTx(validOrder, { P1: { stock: 10 }, P2: { stock: 5 } });
    await shipOrderLogic('ORD1', 'staff1', tx);

    // 1 update cho order, 2 update stock, 2 set movement = 5 writes
    expect(tx.writes).toHaveLength(5);
    expect(tx.writes[0]).toMatchObject({ op: 'update', patch: { status: 'shipped' } });
    expect(tx.writes.filter((w) => w.op === 'set')).toHaveLength(2);
  });

  it('reject khi đơn không tồn tại', async () => {
    const tx = makeFakeTx(null, {});
    await expect(shipOrderLogic('ORD_X', 'staff1', tx)).rejects.toThrow(/không tồn tại/);
  });

  it('reject khi đơn đã shipped (idempotent)', async () => {
    const shipped = { ...validOrder, status: 'shipped' };
    const tx = makeFakeTx(shipped, { P1: { stock: 10 }, P2: { stock: 5 } });
    await expect(shipOrderLogic('ORD1', 'staff1', tx)).rejects.toThrow(/đã shipped/);
  });

  it('reject khi product không tồn tại', async () => {
    const tx = makeFakeTx(validOrder, { P1: { stock: 10 } }); // thiếu P2
    await expect(shipOrderLogic('ORD1', 'staff1', tx)).rejects.toThrow(/P2 không tồn tại/);
  });

  it('reject khi stock không đủ — không có write nào được commit', async () => {
    const tx = makeFakeTx(validOrder, { P1: { stock: 1 }, P2: { stock: 5 } }); // P1 thiếu
    await expect(shipOrderLogic('ORD1', 'staff1', tx)).rejects.toThrow(/chỉ còn 1, cần 2/);
    expect(tx.writes).toHaveLength(0); // atomicity: validate trước khi write
  });
});
