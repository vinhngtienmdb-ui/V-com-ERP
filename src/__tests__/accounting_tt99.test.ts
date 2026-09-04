import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Dùng dbService và accountingService THẬT để test đúng logic ghi sổ.
vi.unmock('../services/dbService');
vi.unmock('../services/accountingService');

import {
  postOrderJournalEntries,
  postWithdrawalJournalEntries,
  TT99_ACCOUNTS,
  DEFAULT_VAT_RATE,
  ESTIMATED_COGS_RATIO
} from '../services/accountingService';
import { supabase } from '../lib/supabase';
import * as path from 'node:path';
import * as fs from 'node:fs';

/**
 * Mock supabase.from() theo từng bảng.
 * Quan trọng: mock ban đầu trong accounting_closing.test.ts trả về dữ liệu sản
 * phẩm cho MỌI bảng, nên phải tách riêng tenant_settings / products / còn lại.
 */
function mockSupabase(opts: { closingLockDate?: string | null; product?: any } = {}) {
  const upsertMock = vi.fn().mockResolvedValue({ error: null });
  const insertMock = vi.fn().mockResolvedValue({ error: null });
  // Table-aware capture: bridgeToTt99 (TT99_BRIDGE_ENABLED) also upserts acc_*
  // tables via the SAME supabase.from spy, so counting upsertMock alone mixes
  // journal_entries with acc_vouchers. Record the table alongside each call.
  const upsertCalls: Array<{ table: string; payload: any }> = [];
  const insertCalls: Array<{ table: string; payload: any }> = [];

  const fromSpy = vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
    const mockObj = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(() => {
        if (table === 'tenant_settings') {
          return Promise.resolve({ data: { data: { closingLockDate: opts.closingLockDate ?? null } } });
        }
        if (table === 'products' && opts.product) {
          return Promise.resolve({ data: opts.product });
        }
        return Promise.resolve({ data: null });
      }),
      upsert: (payload: any) => { upsertCalls.push({ table, payload }); return upsertMock(payload); },
      insert: (payload: any) => { insertCalls.push({ table, payload }); return insertMock(payload); },
      delete: vi.fn().mockReturnThis()
    };
    return mockObj as any;
  });

  return { fromSpy, upsertMock, insertMock, upsertCalls, insertCalls };
}

function makeOrder(overrides: any = {}): any {
  return {
    id: 'ORD-TT99-001',
    tenantId: 'tenant-vcomm-prod-01',
    customerId: 'CUST-001',
    sellerId: 'SEL-001',
    total: 110000,
    commissionFee: 5000,
    items: [{ productId: 'prod-1', productName: 'Bàn phím cơ', quantity: 1, price: 100000 }],
    ...overrides
  };
}

describe('accountingService — tuân thủ TT99/2025/TT-BTC', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  // -------------------------------------------------------------------------
  // Điều 11 — hệ thống tài khoản
  // -------------------------------------------------------------------------
  describe('Điều 11 — mã tài khoản phải tồn tại trong Phụ lục II TT99', () => {
    const sqlPath = path.resolve(process.cwd(), 'specs/021-tt99-ke-toan-doanh-nghiep/migrations/001_coa.sql');
    let seeded: Set<string>;

    try {
      const sql = fs.readFileSync(sqlPath, 'utf8');
      seeded = new Set(
        [...sql.matchAll(/^\('tenant-vcomm-prod-01','(\d{3,6})',/gm)].map(m => m[1])
      );
    } catch {
      throw new Error(
        `Không đọc được ${sqlPath}. Hãy chạy vitest từ thư mục V-com-ERP.`
      );
    }

    it('mọi mã tài khoản accountingService dùng đều có trong hệ thống tài khoản TT99', () => {
      for (const [key, code] of Object.entries(TT99_ACCOUNTS)) {
        expect(seeded.has(code), `${key} = ${code} không có trong 001_coa.sql`).toBe(true);
      }
    });

    it('không dùng bất kỳ tài khoản nào đã bị TT99 bãi bỏ', () => {
      // Điều 31 TT99 bãi bỏ 7 tài khoản so với TT200/2014.
      const abolished = ['161', '417', '441', '461', '466', '611', '631'];
      for (const code of Object.values(TT99_ACCOUNTS)) {
        expect(abolished).not.toContain(code);
      }
    });

    it('vẫn dùng đúng các tài khoản cấp 1 bắt buộc cho bán hàng', () => {
      expect(TT99_ACCOUNTS.AR_CUSTOMER).toBe('131');
      expect(TT99_ACCOUNTS.COGS).toBe('632');
      expect(TT99_ACCOUNTS.INVENTORY).toBe('156');
      expect(TT99_ACCOUNTS.ADMIN_EXPENSE).toBe('642');
    });
  });

  // -------------------------------------------------------------------------
  // Điều 12 — chứng từ ghi kép
  // -------------------------------------------------------------------------
  describe('Điều 12 — chứng từ kế toán ghi kép', () => {
    it('bút toán đơn hàng luôn cân bằng Nợ = Có', async () => {
      const { insertMock } = mockSupabase({ product: { id: 'prod-1', cost_price: 50000, price: 100000 } });

      await postOrderJournalEntries(makeOrder());

      const rows: any[] = insertMock.mock.calls[0][0];
      const debit = rows.reduce((s, r) => s + r.debit, 0);
      const credit = rows.reduce((s, r) => s + r.credit, 0);

      expect(debit).toBe(credit);
      expect(debit).toBe(110000 + 50000 + 5000); // tiền hàng + giá vốn + hoa hồng
    });

    it('ghi đủ 3 cặp bút toán: doanh thu/VAT, giá vốn, hoa hồng', async () => {
      const { insertMock } = mockSupabase({ product: { id: 'prod-1', cost_price: 50000, price: 100000 } });

      await postOrderJournalEntries(makeOrder());

      expect(insertMock).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ account_id: '131', debit: 110000, credit: 0 }),
        expect.objectContaining({ account_id: '5111', debit: 0, credit: 100000 }),
        expect.objectContaining({ account_id: '33311', debit: 0, credit: 10000 }),
        expect.objectContaining({ account_id: '632', debit: 50000, credit: 0 }),
        expect.objectContaining({ account_id: '156', debit: 0, credit: 50000 }),
        expect.objectContaining({ account_id: '642', debit: 5000, credit: 0 }),
        expect.objectContaining({ account_id: '3388', debit: 0, credit: 5000 })
      ]));
    });

    it('từ chối hạch toán khi tổng tiền đơn hàng không hợp lệ', async () => {
      mockSupabase();
      await expect(postOrderJournalEntries(makeOrder({ total: 0 })))
        .rejects.toThrow(/tổng tiền không hợp lệ/);
    });

    it('từ chối hạch toán rút tiền khi số tiền không hợp lệ', async () => {
      mockSupabase();
      await expect(postWithdrawalJournalEntries({
        id: 'WDR-1', userId: 'U1', userType: 'seller', amount: 0
      })).rejects.toThrow(/số tiền không hợp lệ/);
    });

    it('hạch toán rút tiền: Nợ 3388 / Có 1121', async () => {
      const { insertMock } = mockSupabase();
      await postWithdrawalJournalEntries({
        id: 'WDR-1', userId: 'U1', userType: 'seller', amount: 15000000
      });
      expect(insertMock).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ account_id: '3388', debit: 15000000, credit: 0 }),
        expect.objectContaining({ account_id: '1121', debit: 0, credit: 15000000 })
      ]));
    });
  });

  // -------------------------------------------------------------------------
  // Idempotency — chống ghi trùng
  // -------------------------------------------------------------------------
  describe('Chống ghi trùng bút toán', () => {
    it('ID chứng từ cố định theo mã đơn, không còn dính Date.now()', async () => {
      mockSupabase({ product: { id: 'prod-1', cost_price: 50000, price: 100000 } });
      const id = await postOrderJournalEntries(makeOrder());
      expect(id).toBe('je-order-complete-ORD-TT99-001');
      expect(id).not.toMatch(/-\d{10,}$/);
    });

    it('gọi lặp 2 lần trả về cùng một ID → upsert thay thế, không sinh chứng từ thứ hai', async () => {
      const { upsertCalls } = mockSupabase({ product: { id: 'prod-1', cost_price: 50000, price: 100000 } });
      const id1 = await postOrderJournalEntries(makeOrder());
      const id2 = await postOrderJournalEntries(makeOrder());

      expect(id1).toBe(id2);
      // Chỉ đếm upsert vào bảng journal_entries — bridge TT99 ghi thêm acc_* (fail-soft).
      const jeIds = upsertCalls.filter(c => c.table === 'journal_entries').map(c => c.payload.id);
      expect(new Set(jeIds).size).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Thuế GTGT — không còn hard-code 1.1
  // -------------------------------------------------------------------------
  describe('Thuế GTGT đầu ra — tỷ lệ tham số hoá', () => {
    it('mặc định 10%: 110.000 → doanh thu 100.000, thuế 10.000', async () => {
      const { insertMock } = mockSupabase({ product: { id: 'prod-1', cost_price: 50000, price: 100000 } });
      await postOrderJournalEntries(makeOrder({ total: 110000 }));
      expect(insertMock).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ account_id: '5111', credit: 100000 }),
        expect.objectContaining({ account_id: '33311', credit: 10000 })
      ]));
      expect(DEFAULT_VAT_RATE).toBe(0.1);
    });

    it('suất 5% được truyền vào sẽ được tôn trọng (hàng hóa 5%)', async () => {
      const { insertMock } = mockSupabase({ product: { id: 'prod-1', cost_price: 50000, price: 100000 } });
      await postOrderJournalEntries(makeOrder({ total: 105000 }), { vatRate: 0.05 });
      expect(insertMock).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ account_id: '5111', credit: 100000 }),
        expect.objectContaining({ account_id: '33311', credit: 5000 })
      ]));
    });

    it('suất 0% (hàng không chịu thuế) không sinh bút toán thuế', async () => {
      const { insertMock } = mockSupabase({ product: { id: 'prod-1', cost_price: 50000, price: 100000 } });
      await postOrderJournalEntries(makeOrder({ total: 100000 }), { vatRate: 0 });
      expect(insertMock).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ account_id: '5111', credit: 100000 }),
        expect.objectContaining({ account_id: '33311', credit: 0 })
      ]));
    });
  });

  // -------------------------------------------------------------------------
  // Điều 12 — trung thực số liệu: giá vốn ước tính phải bị lộ ra
  // -------------------------------------------------------------------------
  describe('Minh bạch giá vốn ước tính', () => {
    it('khi PIM thiếu giá vốn, diễn giải chứng từ phải ghi rõ là ước tính', async () => {
      const { upsertMock } = mockSupabase(); // không có product → giá vốn = 0
      await postOrderJournalEntries(makeOrder());

      expect(upsertMock).toHaveBeenCalledWith(
        expect.objectContaining({ description: expect.stringMatching(/ước tính/i) })
      );
    });

    it('ước tính đúng tỷ lệ đã công bố', async () => {
      const { insertMock } = mockSupabase();
      await postOrderJournalEntries(makeOrder()); // giá bán 100.000 × 60% = 60.000
      expect(insertMock).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({ account_id: '632', debit: Math.round(100000 * ESTIMATED_COGS_RATIO) }),
        expect.objectContaining({ account_id: '156', credit: Math.round(100000 * ESTIMATED_COGS_RATIO) })
      ]));
    });

    it('khi có giá vốn thật thì diễn giải KHÔNG ghi ước tính', async () => {
      const { upsertMock } = mockSupabase({ product: { id: 'prod-1', cost_price: 50000, price: 100000 } });
      await postOrderJournalEntries(makeOrder());
      const payload = upsertMock.mock.calls[0][0];
      expect(payload.description).not.toMatch(/ước tính/i);
    });
  });

  // -------------------------------------------------------------------------
  // Điều 13 — kỳ đã khóa sổ không được ghi tiếp
  // -------------------------------------------------------------------------
  describe('Điều 13 — chặn ghi sổ vào kỳ đã khóa', () => {
    it('đẩy lỗi khóa sổ từ SupabaseAdapter lên người gọi', async () => {
      mockSupabase({ closingLockDate: '2026-07-01' });

      const withdrawal = {
        id: 'WDR-LOCK', userId: 'SEL-9', userType: 'seller',
        amount: 15000000, tenantId: 'tenant-vcomm-prod-01'
      };

      // Ép ngày chứng từ rơi vào trong kỳ đã khóa (trước 01/07/2026).
      const OriginalDate = global.Date;
      const frozen = new OriginalDate('2026-06-15T00:00:00Z');
      global.Date = class extends OriginalDate {
        constructor(...args: any[]) {
          // @ts-ignore
          if (args.length > 0) { super(...args); return; }
          super();
          return frozen;
        }
      } as any;

      try {
        await expect(postWithdrawalJournalEntries(withdrawal))
          .rejects.toThrow(/Kỳ kế toán đã khóa sổ/);
      } finally {
        global.Date = OriginalDate;
      }
    });

    it('không chặn khi ngày chứng từ nằm SAU ngày khóa sổ', async () => {
      mockSupabase({ closingLockDate: '2026-01-01' });
      // Hôm nay (sau 01/01/2026) phải ghi được bình thường.
      const id = await postWithdrawalJournalEntries({
        id: 'WDR-OK', userId: 'SEL-9', userType: 'seller',
        amount: 100000, tenantId: 'tenant-vcomm-prod-01'
      });
      expect(id).toBe('je-withdrawal-WDR-OK');
    });
  });
});
