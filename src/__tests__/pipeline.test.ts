import { describe, it, expect, vi, beforeEach } from 'vitest';

// Pipeline logic tách ra để test độc lập — không phụ thuộc Firebase
type PipelineDeps = {
  updateDoc: (ref: any, data: any) => Promise<void>;
  addDoc: (col: any, data: any) => Promise<{ id: string }>;
  incrementFn: (n: number) => number;
};

async function handleStatusChange(
  orderId: string,
  newStatus: string,
  order: { id: string; total: number; customerName: string; items?: { productId?: string; quantity?: number }[] },
  isMockOrder: boolean,
  deps: PipelineDeps,
) {
  if (!isMockOrder) {
    await deps.updateDoc(`orders/${orderId}`, { status: newStatus });
  }

  if (newStatus === 'delivered') {
    await deps.addDoc('finance_transactions', {
      description: `Thu hộ đơn hàng #${orderId} - ${order.customerName}`,
      amount: order.total,
      type: 'income',
      category: 'Sales',
      orderId,
    });
  }

  if (newStatus === 'shipped' && order.items) {
    for (const item of order.items) {
      if (item.productId) {
        await deps.updateDoc(`products/${item.productId}`, {
          stock: deps.incrementFn(-(item.quantity || 1)),
        });
      }
    }
  }
}

describe('Orders → Finance pipeline', () => {
  let mockUpdateDoc: ReturnType<typeof vi.fn>;
  let mockAddDoc: ReturnType<typeof vi.fn>;
  let mockIncrement: ReturnType<typeof vi.fn>;
  let deps: PipelineDeps;

  beforeEach(() => {
    mockUpdateDoc = vi.fn().mockResolvedValue(undefined);
    mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-id' });
    mockIncrement = vi.fn((n) => n);
    deps = {
      updateDoc: mockUpdateDoc as unknown as PipelineDeps['updateDoc'],
      addDoc: mockAddDoc as unknown as PipelineDeps['addDoc'],
      incrementFn: mockIncrement as unknown as PipelineDeps['incrementFn'],
    };
  });

  it('tạo finance_transaction khi đơn chuyển sang delivered', async () => {
    const order = { id: 'ORD-001', total: 2500000, customerName: 'Nguyễn Văn A', items: [] };
    await handleStatusChange('ORD-001', 'delivered', order, false, deps);

    expect(mockAddDoc).toHaveBeenCalledOnce();
    const callArg = mockAddDoc.mock.calls[0][1];
    expect(callArg.type).toBe('income');
    expect(callArg.amount).toBe(2500000);
    expect(callArg.orderId).toBe('ORD-001');
  });

  it('không tạo finance_transaction khi trạng thái khác delivered', async () => {
    const order = { id: 'ORD-002', total: 1000000, customerName: 'Trần Thị B', items: [] };
    await handleStatusChange('ORD-002', 'shipped', order, false, deps);
    expect(mockAddDoc).not.toHaveBeenCalled();
  });

  it('trừ tồn kho khi đơn chuyển sang shipped', async () => {
    const order = {
      id: 'ORD-003',
      total: 500000,
      customerName: 'Lê Văn C',
      items: [{ productId: 'PROD-001', quantity: 2 }],
    };
    await handleStatusChange('ORD-003', 'shipped', order, false, deps);

    // updateDoc gọi 2 lần: 1 cập nhật đơn, 1 trừ stock
    expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    expect(mockIncrement).toHaveBeenCalledWith(-2);
  });

  it('không gọi updateDoc(orders) cho mock orders', async () => {
    const order = { id: 'ORD-MOCK', total: 300000, customerName: 'Mock User', items: [] };
    await handleStatusChange('ORD-MOCK', 'delivered', order, true, deps);

    // isMockOrder = true → không updateDoc order
    const orderUpdateCalls = mockUpdateDoc.mock.calls.filter(c => String(c[0]).startsWith('orders/'));
    expect(orderUpdateCalls).toHaveLength(0);
    // nhưng addDoc finance vẫn được gọi
    expect(mockAddDoc).toHaveBeenCalledOnce();
  });

  it('bỏ qua item không có productId khi shipped', async () => {
    const order = {
      id: 'ORD-004',
      total: 200000,
      customerName: 'Phạm Thị D',
      items: [{ quantity: 1 }], // không có productId
    };
    await handleStatusChange('ORD-004', 'shipped', order, false, deps);

    // chỉ 1 lần updateDoc cho đơn hàng, không có lần nào cho stock
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockIncrement).not.toHaveBeenCalled();
  });
});
