import { describe, it, expect } from 'vitest';
import { runMonthlyDepreciation, consolidateDepreciationEntries } from './depreciationRunService';
import type { FixedAsset } from './fixedAssetService';

function asset(over: Partial<FixedAsset> = {}): FixedAsset {
  return {
    id: 'FA1',
    tenantId: 'tenant-vcomm-prod-01',
    name: 'Máy POS',
    assetAccount: '211',
    putIntoUseDate: '2026-01-15', // trích từ 2026-02
    cost: 12_000_000,
    assetClass: 'MM.POS', // 60 tháng
    usage: 'admin',
    status: 'in_use',
    ...over,
  };
}

describe('GĐ 2.1 — chạy khấu hao hàng loạt cuối tháng', () => {
  it('chạy nhiều tài sản → tổng = tổng các chứng từ', () => {
    const assets = [
      asset({ id: 'A', cost: 12_000_000, assetClass: 'MM.POS', usage: 'admin' }), // 200k/tháng
      asset({ id: 'B', cost: 24_000_000, assetClass: 'MM.POS', usage: 'sales' }), // 400k/tháng
    ];
    const r = runMonthlyDepreciation(assets, '2026-02');
    expect(r.entries.length).toBe(2);
    expect(r.assetCount).toBe(2);
    expect(r.totalAmount).toBe(600_000);
  });

  it('bỏ qua tài sản CHƯA đến hạn (trích từ tháng kế tiếp)', () => {
    const r = runMonthlyDepreciation([asset()], '2026-01'); // tháng đưa vào SD
    expect(r.entries.length).toBe(0);
    expect(r.totalAmount).toBe(0);
  });

  it('bỏ qua tài sản ĐÃ THANH LÝ (status disposed)', () => {
    const r = runMonthlyDepreciation(
      [asset({ status: 'disposed', disposedDate: '2026-03-31' })],
      '2026-04',
    );
    expect(r.entries.length).toBe(0);
    expect(r.skipped[0].reason).toMatch(/disposed/);
  });

  it('tài sản thiếu cấu hình → vào skipped, KHÔNG fail cả kỳ', () => {
    const good = asset({ id: 'GOOD' });
    const bad = asset({ id: 'BAD' });
    delete (bad as any).assetClass;
    const r = runMonthlyDepreciation([bad, good], '2026-02');
    expect(r.entries.length).toBe(1);
    expect(r.entries[0].id).toBe('KH-GOOD-2026-02');
    expect(r.skipped.some(s => s.assetId === 'BAD')).toBe(true);
  });

  it('idempotent: chạy lại cùng kỳ cho cùng id chứng từ', () => {
    const a = asset({ id: 'X' });
    const r1 = runMonthlyDepreciation([a], '2026-02');
    const r2 = runMonthlyDepreciation([a], '2026-02');
    expect(r1.entries[0].id).toBe('KH-X-2026-02');
    expect(r2.entries[0].id).toBe(r1.entries[0].id);
  });

  it('kỳ sai định dạng → ném', () => {
    expect(() => runMonthlyDepreciation([asset()], '2026-13')).toThrow(/yyyy-mm/);
    expect(() => runMonthlyDepreciation([asset()], '26-02')).toThrow(/yyyy-mm/);
  });

  it('cảnh báo khi không sinh được chứng từ nào nhưng có tài sản lỗi', () => {
    const bad = asset({ id: 'BAD' });
    delete (bad as any).assetClass;
    const r = runMonthlyDepreciation([bad], '2026-02');
    expect(r.warnings.some(w => w.includes('KHÔNG sinh được chứng từ'))).toBe(true);
  });
});

describe('GĐ 2.1 — gộp chứng từ khấu hao', () => {
  it('gộp theo tài khoản Nợ, giữ cân bằng Nợ/Có (Điều 12)', () => {
    const assets = [
      asset({ id: 'A', cost: 12_000_000, usage: 'admin' }), // 200k → 642
      asset({ id: 'B', cost: 24_000_000, usage: 'sales' }), // 400k → 641
      asset({ id: 'C', cost: 12_000_000, usage: 'admin' }), // 200k → 642
    ];
    const run = runMonthlyDepreciation(assets, '2026-02');
    const merged = consolidateDepreciationEntries(run, {
      tenantId: 'tenant-vcomm-prod-01',
      date: '2026-02-28',
    });
    const debit = merged.lines.filter(l => l.debit > 0);
    const credit = merged.lines.filter(l => l.credit > 0);
    expect(debit.length).toBe(2); // 642 (400k) + 641 (400k)
    expect(credit.length).toBe(1); // 214 (800k)
    const totalDebit = merged.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = merged.lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDebit).toBe(totalCredit);
    expect(totalDebit).toBe(800_000);
    expect(merged.id).toBe('KH-TONG-2026-02'); // idempotent
  });

  it('không có chứng từ → ném', () => {
    const run = runMonthlyDepreciation([asset()], '2026-01');
    expect(() => consolidateDepreciationEntries(run)).toThrow();
  });
});
