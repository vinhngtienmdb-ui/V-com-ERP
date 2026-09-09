import { describe, it, expect } from 'vitest';
import { closingCanonical, hashLedgerClosing } from '../services/ledgerClosing';

describe('GĐ 2.4 — ledgerClosing canonical + SHA-256 (pattern #75)', () => {
  const base = {
    year: 2026,
    month: 9,
    endOfMonthISO: '2026-09-30T00:00:00.000Z',
    totalRevenue: 500,
    totalExpenses: 400,
    entries: [] as Array<{ accountId: string; debit: number; credit: number }>,
  };

  it('closingCanonical GIỮ DẤU: lãi 100 và lỗ -100 RA KHÁC NHAU', () => {
    const profit = closingCanonical({ ...base, netProfit: 100 });
    const loss = closingCanonical({ ...base, netProfit: -100 });
    expect(profit).not.toBe(loss);
    expect(profit).toContain('netProfit=100.00');
    expect(loss).toContain('netProfit=-100.00');
  });

  it('closingCanonical gắn kỳ + ngày chốt', () => {
    const c = closingCanonical({ ...base, netProfit: 0 });
    expect(c).toContain('VCOMM-CLOSING-v1');
    expect(c).toContain('period=2026-09');
    expect(c).toContain('endOfMonth=2026-09-30');
  });

  it('hashLedgerClosing trả SHA-256 64 ký tự hex, xác định', async () => {
    const h1 = await hashLedgerClosing(closingCanonical({ ...base, netProfit: 100 }));
    const h2 = await hashLedgerClosing(closingCanonical({ ...base, netProfit: 100 }));
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(h1).toBe(h2);
  });

  it('🔴 lãi và lỗ cho RA 2 hash KHÁC (phát hiện sửa sổ sau khóa)', async () => {
    const hProfit = await hashLedgerClosing(closingCanonical({ ...base, netProfit: 100 }));
    const hLoss = await hashLedgerClosing(closingCanonical({ ...base, netProfit: -100 }));
    expect(hProfit).not.toBe(hLoss);
  });

  it('hashLedgerClosing NÉM khi thiếu Web Crypto (không trả chuỗi giả)', async () => {
    // Node gắn globalThis.crypto là getter chỉ-đọc → không gán undefined được;
    // truyền cryptoObj thiếu subtle qua tham số. (Lưu ý: truyền `undefined` sẽ
    // kích hoạt default = globalThis.crypto → vẫn băm được, nên dùng {}.)
    await expect(hashLedgerClosing('x', {})).rejects.toThrow();
  });
});
