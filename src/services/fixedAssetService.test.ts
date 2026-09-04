import { describe, it, expect } from 'vitest';
import {
  resolveDepreciation,
  computeMonthlyDepreciation,
  generateDepreciationSchedule,
  buildDepreciationJournalEntry,
  accumulatedDepreciationTo,
  type FixedAsset,
} from './fixedAssetService';

const base: FixedAsset = {
  id: 'FA1',
  tenantId: 'tenant-vcomm-prod-01',
  name: 'Máy POS Hub Q1',
  assetAccount: '211',
  putIntoUseDate: '2026-01-15', // trích từ 2026-02
  cost: 12_000_000,
  residualValue: 0,
  assetClass: 'MM.POS', // 60 tháng
  usage: 'admin',
};

describe('GĐ 2.1 — fixedAssetService (TT99 + TT45/2013)', () => {
  it('resolveDepreciation: đường thẳng, MM.POS = 60 tháng', () => {
    const r = resolveDepreciation(base);
    expect(r.method).toBe('straight_line');
    expect(r.usefulLifeMonths).toBe(60);
    expect(r.baseCost).toBe(12_000_000);
    expect(r.monthlyAmount).toBe(200_000); // 12tr / 60
  });

  it('computeMonthlyDepreciation: kỳ trước đưa vào SD = 0 (trích từ tháng kế tiếp)', () => {
    expect(computeMonthlyDepreciation(base, '2026-01')).toBe(0);
    expect(computeMonthlyDepreciation(base, '2026-02')).toBe(200_000);
  });

  it('generateDepreciationSchedule: lũy kế đúng nguyên giá (không thừa/thiếu do làm tròn)', () => {
    const lines = generateDepreciationSchedule(base);
    expect(lines.length).toBe(60);
    expect(lines[0].period).toBe('2026-02');
    expect(lines[59].period).toBe('2031-01');
    expect(lines[59].accumulated).toBe(12_000_000); // tổng = baseCost
    expect(lines[59].remainingBookValue).toBe(0);
  });

  it('residualValue: chỉ khấu hao trên (cost - residual)', () => {
    const a: FixedAsset = { ...base, residualValue: 2_000_000 };
    const r = resolveDepreciation(a);
    expect(r.baseCost).toBe(10_000_000);
    expect(r.monthlyAmount).toBe(round2(10_000_000 / 60));
  });

  it('usefulLifeMonths truyền trực tiếp ghi đè assetClass', () => {
    const a: FixedAsset = { ...base, assetClass: undefined, usefulLifeMonths: 36 };
    const r = resolveDepreciation(a);
    expect(r.usefulLifeMonths).toBe(36);
    expect(r.monthlyAmount).toBe(round2(12_000_000 / 36));
  });

  it('thiếu cả assetClass và usefulLifeMonths → ném', () => {
    const a: FixedAsset = { ...base, assetClass: undefined };
    delete (a as any).usefulLifeMonths;
    expect(() => resolveDepreciation(a)).toThrow(/usefulLifeMonths|assetClass/);
  });

  it('disposedDate: ngừng trích sau tháng thanh lý', () => {
    const a: FixedAsset = { ...base, disposedDate: '2026-06-30' }; // trích đến 2026-06
    expect(computeMonthlyDepreciation(a, '2026-06')).toBe(200_000);
    expect(computeMonthlyDepreciation(a, '2026-07')).toBe(0);
    const lines = generateDepreciationSchedule(a);
    expect(lines.length).toBe(5); // 02..06
    expect(lines[4].accumulated).toBe(1_000_000);
  });

  it('buildDepreciationJournalEntry: Nợ 642 / Có 214, cân bằng, idempotent id', () => {
    const je = buildDepreciationJournalEntry(base, '2026-02');
    expect(je.id).toBe('KH-FA1-2026-02');
    expect(je.lines[0]).toMatchObject({ accountId: '642', debit: 200_000, credit: 0 });
    expect(je.lines[1]).toMatchObject({ accountId: '214', debit: 0, credit: 200_000 });
    const totalDebit = je.lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = je.lines.reduce((s, l) => s + l.credit, 0);
    expect(totalDebit).toBe(totalCredit); // cân bằng Điều 12
  });

  it('usage=production → Nợ 627', () => {
    const a: FixedAsset = { ...base, usage: 'production' };
    const je = buildDepreciationJournalEntry(a, '2026-02');
    expect(je.lines[0].accountId).toBe('627');
  });

  it('accumulatedDepreciationTo: lũy kế đúng tại kỳ bất kỳ', () => {
    expect(accumulatedDepreciationTo(base, '2026-04')).toBe(600_000); // 3 kỳ × 200k
    expect(accumulatedDepreciationTo(base, '2026-01')).toBe(0);
  });

  it('declining_balance: số kỳ đầu > đường thẳng, không vượt nguyên giá', () => {
    const a: FixedAsset = { ...base, method: 'declining_balance', assetClass: 'MM.MAYTINH' };
    const first = computeMonthlyDepreciation(a, '2026-02');
    expect(first).toBeGreaterThan(200_000);
    const lines = generateDepreciationSchedule(a);
    expect(lines[lines.length - 1].accumulated).toBeLessThanOrEqual(12_000_000);
    expect(lines[lines.length - 1].remainingBookValue).toBeGreaterThanOrEqual(0);
  });
});

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
