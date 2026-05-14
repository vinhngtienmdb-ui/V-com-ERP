import { describe, it, expect, vi } from 'vitest';

/**
 * Logic deliverOrder (rút gọn từ src/services/repositories/orders.ts):
 *   1. Đơn phải ở status='shipped' (không thể bỏ qua shipping)
 *   2. Set status='delivered'
 *   3. Tạo /transactions/{orderId}_revenue type='income' = order.total
 *   4. KHÔNG đụng vào stock (đã trừ ở shipOrder)
 *
 * Pure test với fake transaction (mirror of Firestore runTransaction).
 */

type FakeOrder = { status: string; total: number; customerName: string };

function makeFakeTx(order: FakeOrder | null) {
  const writes: any[] = [];
  return {
    writes,
    get: vi.fn(async (ref: any) => ({
      exists: () => ref.kind === 'order' && order !== null,
      data: () => order as any,
    })),
    update: vi.fn((ref: any, patch: any) => writes.push({ op: 'update', ref, patch })),
    set: vi.fn((ref: any, data: any) => writes.push({ op: 'set', ref, data })),
  };
}

async function deliverOrderLogic(
  orderId: string,
  staffUid: string,
  tx: ReturnType<typeof makeFakeTx>,
) {
  const orderRef = { kind: 'order', id: orderId };
  const snap = await tx.get(orderRef);
  if (!snap.exists()) throw new Error(`Order ${orderId} không tồn tại`);
  const order = snap.data() as FakeOrder;

  if (order.status !== 'shipped') {
    throw new Error(`Đơn ${orderId} phải ở trạng thái 'shipped' (hiện: ${order.status})`);
  }

  tx.update(orderRef, { status: 'delivered' });
  tx.set({ kind: 'transaction', id: `${orderId}_revenue` }, {
    description: `Doanh thu đơn #${orderId} - ${order.customerName}`,
    amount: order.total,
    type: 'income',
    category: 'Sales',
    orderId,
    staffId: staffUid,
  });
}

describe('deliverOrder transaction', () => {
  const validOrder: FakeOrder = {
    status: 'shipped',
    total: 2500000,
    customerName: 'Nguyễn Văn A',
  };

  it('thành công khi đơn ở status=shipped', async () => {
    const tx = makeFakeTx(validOrder);
    await deliverOrderLogic('ORD1', 'staff1', tx);

    // 1 update order + 1 set transaction = 2 writes
    expect(tx.writes).toHaveLength(2);

    const updateOp = tx.writes.find((w) => w.op === 'update');
    expect(updateOp.patch.status).toBe('delivered');

    const setOp = tx.writes.find((w) => w.op === 'set');
    expect(setOp.data.type).toBe('income');
    expect(setOp.data.amount).toBe(2500000);
    expect(setOp.data.orderId).toBe('ORD1');
    expect(setOp.ref.id).toBe('ORD1_revenue');
  });

  it('reject khi đơn không tồn tại', async () => {
    const tx = makeFakeTx(null);
    await expect(deliverOrderLogic('ORD_X', 'staff1', tx)).rejects.toThrow(/không tồn tại/);
    expect(tx.writes).toHaveLength(0);
  });

  it('reject khi đơn pending (không thể skip ship)', async () => {
    const tx = makeFakeTx({ ...validOrder, status: 'pending' });
    await expect(deliverOrderLogic('ORD1', 'staff1', tx)).rejects.toThrow(/phải ở trạng thái 'shipped'/);
    expect(tx.writes).toHaveLength(0);
  });

  it('reject khi đơn processing', async () => {
    const tx = makeFakeTx({ ...validOrder, status: 'processing' });
    await expect(deliverOrderLogic('ORD1', 'staff1', tx)).rejects.toThrow(/phải ở trạng thái 'shipped'/);
  });

  it('reject khi đơn đã delivered (idempotent)', async () => {
    const tx = makeFakeTx({ ...validOrder, status: 'delivered' });
    await expect(deliverOrderLogic('ORD1', 'staff1', tx)).rejects.toThrow(/phải ở trạng thái 'shipped'/);
  });

  it('transaction ID format đúng {orderId}_revenue (idempotent)', async () => {
    const tx = makeFakeTx(validOrder);
    await deliverOrderLogic('ORD_2026_001', 'staff1', tx);
    const setOp = tx.writes.find((w) => w.op === 'set');
    expect(setOp.ref.id).toBe('ORD_2026_001_revenue');
  });

  it('không trừ stock (chỉ shipOrder mới trừ)', async () => {
    const tx = makeFakeTx(validOrder);
    await deliverOrderLogic('ORD1', 'staff1', tx);
    const productWrites = tx.writes.filter((w) => w.ref.kind === 'product');
    expect(productWrites).toHaveLength(0);
  });
});
