import { describe, it, expect, beforeEach, vi } from 'vitest';
import { calculateRfmScores, addLoyaltyPoints, createSupportTicket } from '../services/crmService';
import { db, doc, getDoc, updateDoc, addDoc, getDocs, collection } from '../services/dbService';

// Mock dbService to avoid hitting live database
vi.mock('../services/dbService', async () => {
  const original = await vi.importActual('../services/dbService') as any;
  const store: Record<string, Record<string, any>> = {
    customers: {
      'CUST-001': { id: 'CUST-001', name: 'Nguyễn Văn A', points: 100, tier: 'Bronze' }
    },
    orders: {
      'ORD-001': { id: 'ORD-001', customerId: 'CUST-001', total: 500000, status: 'completed', date: '2026-07-01T10:00:00Z' },
      'ORD-002': { id: 'ORD-002', customerId: 'CUST-001', total: 600000, status: 'completed', date: '2026-07-04T12:00:00Z' }
    },
    loyalty_points_ledger: {},
    support_tickets: {}
  };

  return {
    ...original,
    db: {},
    collection: vi.fn((_db, name) => name),
    doc: vi.fn((_db, name, id) => ({ tableName: name, id })),
    getDoc: vi.fn(async (docRef) => {
      const row = store[docRef.tableName]?.[docRef.id];
      return {
        exists: () => !!row,
        data: () => row
      };
    }),
    updateDoc: vi.fn(async (docRef, payload) => {
      if (!store[docRef.tableName]) store[docRef.tableName] = {};
      if (!store[docRef.tableName][docRef.id]) store[docRef.tableName][docRef.id] = {};
      store[docRef.tableName][docRef.id] = { ...store[docRef.tableName][docRef.id], ...payload };
    }),
    addDoc: vi.fn(async (tableName, payload) => {
      if (!store[tableName]) store[tableName] = {};
      const id = `${tableName.toUpperCase()}-${Math.random().toString(36).substr(2, 9)}`;
      store[tableName][id] = { id, ...payload };
      return { id };
    }),
    getDocs: vi.fn(async (queryObj) => {
      let docs = Object.values(store[queryObj] || {}).map(data => ({
        id: data.id,
        data: () => data
      }));
      return { docs };
    }),
    query: vi.fn((coll) => coll),
    where: vi.fn()
  };
});

describe('CRM, CSKH & Điểm Loyalty Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateRfmScores()', () => {
    it('should calculate RFM score and update customer tier correctly', async () => {
      const rfmResult = await calculateRfmScores('CUST-001');

      expect(rfmResult).toBeDefined();
      expect(rfmResult.orderCount).toBe(2);
      expect(rfmResult.totalSpent).toBe(1100000); // 500k + 600k
      expect(rfmResult.tier).toBe('Silver'); // Silver is between 1M and 5M
      expect(rfmResult.rfmScore.monetary).toBe(1100000);
      expect(rfmResult.rfmScore.frequency).toBe(2);
      expect(rfmResult.rfmScore.recency).toBeGreaterThan(0);
    });
  });

  describe('addLoyaltyPoints()', () => {
    it('should add points to customer balance and log points ledger transaction', async () => {
      const newBalance = await addLoyaltyPoints('CUST-001', 50, 'earn', 'Tích điểm đơn hàng');
      
      expect(newBalance).toBe(150); // Original 100 + 50
      
      const customerDoc = await getDoc(doc(db, 'customers', 'CUST-001'));
      expect(customerDoc.data().points).toBe(150);
    });
  });

  describe('createSupportTicket()', () => {
    it('GĐ 4.6: SLA tính theo GIỜ HÀNH CHÍNH (không còn cộng giờ thực)', async () => {
      // ⚠️ TRƯỚC ĐÂY test này khẳng định `deadline − createdAt ≈ 1h GIỜ THỰC`.
      // Hành vi đó SAI: ticket tạo lúc 16:00 Thứ Sáu ra hạn 20:00 Thứ Sáu —
      // ngoài giờ làm việc, KPI SLA của tổng đài không bao giờ đúng.
      // Giờ deadline được tính trên lịch làm việc (T2–T6, 08:00–17:00).
      const { computeSlaDeadline } = await import('../services/crmTicketService');

      const urgent = await createSupportTicket('CUST-001', 'Giao sai màu sản phẩm', 'urgent', 'complaint');
      expect(urgent).toBeDefined();
      expect(urgent.priority).toBe('urgent');
      const createdAt = new Date(urgent.createdAt);
      expect(new Date(urgent.slaDeadline).getTime())
        .toBe(computeSlaDeadline(createdAt, 'urgent').getTime());

      const high = await createSupportTicket('CUST-001', 'Không áp dụng được voucher', 'high', 'complaint');
      expect(new Date(high.slaDeadline).getTime())
        .toBe(computeSlaDeadline(new Date(high.createdAt), 'high').getTime());

      const low = await createSupportTicket('CUST-001', 'Hỏi thủ tục đăng ký nhà bán', 'low', 'inquiry');
      expect(new Date(low.slaDeadline).getTime())
        .toBe(computeSlaDeadline(new Date(low.createdAt), 'low').getTime());

      // Thứ tự ưu tiên nghiêm ngặt: urgent xử lý trước high, high trước low
      expect(computeSlaDeadline(createdAt, 'urgent').getTime())
        .toBeLessThan(computeSlaDeadline(createdAt, 'high').getTime());
      expect(computeSlaDeadline(createdAt, 'high').getTime())
        .toBeLessThan(computeSlaDeadline(createdAt, 'low').getTime());
    });
  });
});
