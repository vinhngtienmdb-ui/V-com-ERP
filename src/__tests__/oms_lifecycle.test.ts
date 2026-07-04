import { describe, it, expect, beforeAll } from 'vitest';
import { vi } from 'vitest';

// Unmock the firebase module to test the actual database mapper implementation
vi.unmock('../services/dbService');

import { toRelationalPayload, fromRelationalRow, updateDoc, getDoc, doc, db, deleteDoc } from '../services/dbService';
import { supabase } from '../lib/supabase';

describe('OMS Order Lifecycle & Payment Ledger Tests', () => {
  const sampleOrder = {
    id: 'test-oms-order-' + Date.now(),
    customerName: 'Khách hàng Test OMS',
    total: 350000,
    paymentMethod: 'vietqr',
    transactionId: 'TX-OMS-' + Date.now(),
    status: 'pending',
    paymentStatus: 'unpaid'
  };

  it('toRelationalPayload should correctly map JS properties to payments table db columns', () => {
    const paymentData = {
      orderId: 'ORD-123',
      amount: 150000,
      paymentMethod: 'vietqr',
      transactionId: 'TX-PAY-01',
      paymentGateway: 'sepay',
      status: 'success',
      createdAt: '2026-07-04T12:00:00Z'
    };

    const payload = toRelationalPayload('payments', 'pm-123', 'tenant-vcomm-prod-01', paymentData);

    expect(payload.id).toBe('pm-123');
    expect(payload.order_id).toBe('ORD-123');
    expect(payload.amount).toBe(150000);
    expect(payload.payment_method).toBe('vietqr');
    expect(payload.transaction_id).toBe('TX-PAY-01');
    expect(payload.payment_gateway).toBe('sepay');
    expect(payload.status).toBe('success');
    expect(payload.created_at).toBe('2026-07-04T12:00:00Z');
  });

  it('fromRelationalRow should correctly map payments table db columns to JS properties', () => {
    const row = {
      id: 'pm-123',
      tenant_id: 'tenant-vcomm-prod-01',
      order_id: 'ORD-123',
      amount: 150000,
      payment_method: 'vietqr',
      transaction_id: 'TX-PAY-01',
      payment_gateway: 'sepay',
      status: 'success',
      created_at: '2026-07-04T12:00:00Z'
    };

    const jsData = fromRelationalRow('payments', row);

    expect(jsData.id).toBe('pm-123');
    expect(jsData.orderId).toBe('ORD-123');
    expect(jsData.amount).toBe(150000);
    expect(jsData.paymentMethod).toBe('vietqr');
    expect(jsData.transactionId).toBe('TX-PAY-01');
    expect(jsData.paymentGateway).toBe('sepay');
    expect(jsData.status).toBe('success');
    expect(jsData.createdAt).toBe('2026-07-04T12:00:00Z');
  });

  it('should automatically write a payment record when order is updated to paid', async () => {
    const orderRef = doc(db, 'orders', sampleOrder.id);

    // 1. Create order in pending status
    await updateDoc(orderRef, sampleOrder);

    // 2. Fetch order to verify created
    const snapBefore = await getDoc(orderRef);
    expect(snapBefore.exists()).toBe(true);

    // 3. Verify no payment exists yet
    const { data: existingBefore } = await supabase
      .from('payments')
      .select('id')
      .eq('order_id', sampleOrder.id);
    expect(existingBefore?.length || 0).toBe(0);

    // 4. Update status to paid
    await updateDoc(orderRef, { ...sampleOrder, status: 'paid' });

    // 5. Verify payment entry was automatically created
    const { data: existingAfter } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', sampleOrder.id);
    expect(existingAfter?.length).toBe(1);
    expect(Number(existingAfter![0].amount)).toBe(sampleOrder.total);
    expect(existingAfter![0].payment_method).toBe(sampleOrder.paymentMethod);
    expect(existingAfter![0].transaction_id).toBe(sampleOrder.transactionId);

    // 6. Test Idempotency: Trigger another update and verify no duplicates are created
    await updateDoc(orderRef, { ...sampleOrder, status: 'paid', paymentStatus: 'paid' });
    const { data: existingIdempotent } = await supabase
      .from('payments')
      .select('*')
      .eq('order_id', sampleOrder.id);
    expect(existingIdempotent?.length).toBe(1);

    // Clean up
    await deleteDoc(orderRef);
    await supabase.from('payments').delete().eq('order_id', sampleOrder.id);
  });
});
