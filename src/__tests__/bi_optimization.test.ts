import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock dbService to test real functions
vi.unmock('../services/dbService');

import { toRelationalPayload, fromRelationalRow, query, collection, range, orderBy, where, db } from '../services/dbService';

describe('BI & Index Optimization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Channel Field Mapping (T001/DDL mapping)', () => {
    it('nên map chính xác trường channel từ JS sang Relational DB payload cho bảng orders', () => {
      const jsOrder = {
        customerId: 'cust-123',
        total: 1500000,
        status: 'completed',
        channel: 'Shopee',
        paymentMethod: 'bank_transfer'
      };

      const payload = toRelationalPayload('orders', 'ord-123', 'tenant-123', jsOrder);

      expect(payload.channel).toBe('Shopee');
      expect(payload.payment_method).toBe('bank_transfer');
      expect(payload.total).toBe(1500000);
      expect(payload.tenant_id).toBe('tenant-123');
    });

    it('nên map chính xác trường channel từ Relational DB row sang JS object', () => {
      const dbRow = {
        id: 'ord-999',
        tenant_id: 'tenant-123',
        customer_id: 'cust-123',
        total: 2400000,
        status: 'delivered',
        channel: 'TikTok Shop',
        payment_method: 'cod'
      };

      const jsData = fromRelationalRow('orders', dbRow);

      expect(jsData.channel).toBe('TikTok Shop');
      expect(jsData.paymentMethod).toBe('cod');
      expect(jsData.total).toBe(2400000);
      expect(jsData.tenantId).toBe('tenant-123');
    });
  });

  describe('Query Constraints & Pagination Support (T002/T003)', () => {
    it('nên tạo ra query constraints với đầy đủ range (phục vụ phân trang) và orderBy', () => {
      const q = query(
        collection(db, 'products'),
        orderBy('created_at', 'desc'),
        range(10, 19),
        where('status', '==', 'in_stock')
      );

      expect(q.constraints).toContainEqual(expect.objectContaining({ type: 'orderBy', field: 'created_at', direction: 'desc' }));
      expect(q.constraints).toContainEqual(expect.objectContaining({ type: 'range', field: '10', value: 19 }));
      expect(q.constraints).toContainEqual(expect.objectContaining({ type: 'where', field: 'status', op: '==', value: 'in_stock' }));
    });
  });
});
