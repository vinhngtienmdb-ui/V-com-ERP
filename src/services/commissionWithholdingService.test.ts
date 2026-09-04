import { describe, it, expect } from 'vitest';
import { buildCommissionWithholding } from './commissionWithholdingService';

const base = {
  refId: 'ORD-1',
  tenantId: 'tenant-vcomm-prod-01',
  partnerId: 'CTV-9',
  grossCommission: 10_000_000,
  partnerType: 'individual' as const,
  date: '2026-08-01',
};

describe('GĐ 2.6a (A) — khấu trừ thuế TNCN hoa hồng CTV (NĐ 252/2026 Điều 44 + NĐ 253 Điều 50.2)', () => {
  it('cá nhân, ≥ ngưỡng → khấu trừ 10%', () => {
    const r = buildCommissionWithholding(base);
    expect(r.withheld).toBe(true);
    expect(r.taxWithheld).toBe(1_000_000); // 10% × 10tr
    expect(r.netPayable).toBe(9_000_000);
    expect(r.journal?.lines[0]).toMatchObject({ accountId: '3388', debit: 1_000_000, credit: 0 });
    expect(r.journal?.lines[1]).toMatchObject({ accountId: '3335', debit: 0, credit: 1_000_000 });
  });

  it('pháp nhân → KHÔNG khấu trừ (OFF)', () => {
    const r = buildCommissionWithholding({ ...base, partnerType: 'legal' });
    expect(r.withheld).toBe(false);
    expect(r.taxWithheld).toBe(0);
    expect(r.netPayable).toBe(10_000_000);
    expect(r.journal).toBeUndefined();
  });

  it('cá nhân < ngưỡng + CÓ cam kết → không khấu trừ', () => {
    const r = buildCommissionWithholding({ ...base, grossCommission: 3_000_000, hasCommitment: true });
    expect(r.withheld).toBe(false);
    expect(r.taxWithheld).toBe(0);
  });

  it('cá nhân < ngưỡng + KHÔNG cam kết → vẫn khấu trừ (an toàn kê khai)', () => {
    const r = buildCommissionWithholding({ ...base, grossCommission: 3_000_000 });
    expect(r.withheld).toBe(true);
    expect(r.taxWithheld).toBe(300_000); // 10% × 3tr
  });

  it('flatRate là tham số (không hardcode 10%)', () => {
    const r = buildCommissionWithholding({ ...base, flatRate: 0.05 });
    expect(r.taxWithheld).toBe(500_000); // 5% (trường hợp CQT duyệt 5%)
  });

  it('idempotent id: KH-<refId>', () => {
    const r = buildCommissionWithholding(base);
    expect(r.journal?.id).toBe('KHTNCN-ORD-1');
    const r2 = buildCommissionWithholding(base);
    expect(r2.journal?.id).toBe(r.journal?.id);
  });

  it('bút toán cân bằng Nợ/Có', () => {
    const r = buildCommissionWithholding(base);
    const d = r.journal!.lines.reduce((s, l) => s + l.debit, 0);
    const c = r.journal!.lines.reduce((s, l) => s + l.credit, 0);
    expect(d).toBe(c);
  });

  it('hoa hồng ≤ 0 → ném', () => {
    expect(() => buildCommissionWithholding({ ...base, grossCommission: 0 })).toThrow();
  });
});
