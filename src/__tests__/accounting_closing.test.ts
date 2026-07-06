import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock dbService and accountingService to test real logic
vi.unmock('../services/dbService');
vi.unmock('../services/accountingService');

import { postOrderJournalEntries, postWithdrawalJournalEntries } from '../services/accountingService';
import { supabase } from '../lib/supabase';

describe('Accounting Period Closing & Auto-Posting Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('nên tự động hạch toán doanh thu, giá vốn, hoa hồng khi hoàn tất đơn hàng', async () => {
    // 1. Mock product fetch to return cost_price matching db mapping
    const singleProductMock = vi.fn().mockResolvedValue({
      data: { id: 'prod-123', cost_price: 50000, price: 100000 },
      error: null
    });

    const insertMock = vi.fn().mockResolvedValue({ error: null });
    const upsertMock = vi.fn().mockResolvedValue({ error: null });

    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      const mockObj = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === 'tenant_settings') {
            return Promise.resolve({ data: { data: { closingLockDate: null } } }); // Not locked
          }
          return singleProductMock();
        }),
        upsert: upsertMock,
        insert: insertMock,
        delete: vi.fn().mockReturnThis()
      };
      return mockObj as any;
    });

    const order: any = {
      id: 'ORD-TEST-888',
      tenantId: 'tenant-vcomm-prod-01',
      customerId: 'CUST-888',
      customerName: 'Nguyen Van A',
      total: 110000, // 100k net + 10k VAT
      commissionFee: 5000,
      sellerId: 'SEL-888',
      items: [
        { productId: 'prod-123', productName: 'Bàn phím cơ', quantity: 1, price: 100000 }
      ]
    };

    const jeId = await postOrderJournalEntries(order);
    expect(jeId).toBeDefined();

    // Verify revenue, COGS and commission lines
    expect(fromSpy).toHaveBeenCalledWith('journal_entries');
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringContaining('je-order-complete-ORD-TEST-888')
      })
    );

    expect(fromSpy).toHaveBeenCalledWith('journal_items');
    expect(insertMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        // Debit 131: 110k
        expect.objectContaining({ account_id: '131', debit: 110000, credit: 0 }),
        // Credit 5111: 100k
        expect.objectContaining({ account_id: '5111', debit: 0, credit: 100000 }),
        // Credit 33311: 10k
        expect.objectContaining({ account_id: '33311', debit: 0, credit: 10000 }),
        // Debit 632 (COGS): 50k
        expect.objectContaining({ account_id: '632', debit: 50000, credit: 0 }),
        // Credit 156: 50k
        expect.objectContaining({ account_id: '156', debit: 0, credit: 50000 }),
        // Debit 642 (Commission): 5k
        expect.objectContaining({ account_id: '642', debit: 5000, credit: 0 }),
        // Credit 3388: 5k
        expect.objectContaining({ account_id: '3388', debit: 0, credit: 5000 })
      ])
    );
  });

  it('nên chặn ghi sổ chứng từ khi ngày chứng từ trước hoặc bằng ngày khóa sổ kế toán', async () => {
    // Mock settings lock date: 2026-07-01
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
      const mockObj = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockImplementation(() => {
          if (table === 'tenant_settings') {
            return Promise.resolve({ data: { data: { closingLockDate: '2026-07-01' } } });
          }
          return Promise.resolve({ data: null });
        }),
        upsert: upsertMock,
        insert: vi.fn().mockResolvedValue({ error: null }),
        delete: vi.fn().mockReturnThis()
      };
      return mockObj as any;
    });

    const withdrawal = {
      id: 'WDR-TEST-999',
      userId: 'SEL-999',
      userType: 'seller',
      amount: 15000000,
      tenantId: 'tenant-vcomm-prod-01'
    };

    // Force date to fall inside locked period
    const originalDate = Date;
    const mockDate = new Date('2026-06-15');
    global.Date = class extends originalDate {
      constructor(...args: any[]) {
        if (args.length > 0) {
          // @ts-ignore
          super(...args);
          return;
        }
        super();
        return mockDate;
      }
    } as any;

    await expect(postWithdrawalJournalEntries(withdrawal)).rejects.toThrow(
      'Kỳ kế toán đã khóa sổ (Ngày khóa sổ: 1/7/2026). Không thể ghi nhận chứng từ vào ngày 15/6/2026!'
    );

    // Restore original Date class
    global.Date = originalDate;
  });
});
