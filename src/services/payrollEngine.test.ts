import { describe, it, expect } from 'vitest';
import {
  computePit,
  computeSalary,
  pitPolicyAt,
  insurancePolicyAt,
} from './payrollEngine';

const AFTER = new Date('2026-08-01T00:00:00Z'); // sau 01/7/2026 → biểu 5 bậc + giảm trừ 15,5tr
const BEFORE = new Date('2026-05-01T00:00:00Z'); // trước 01/7/2026 → biểu 7 bậc + giảm trừ 11tr

describe('GĐ 2.5 — payrollEngine (Luật 109/2025 + NQ 110/2025)', () => {
  it('chọn đúng chính sách theo ngày (điểm đổi luật 01/7/2026)', () => {
    expect(pitPolicyAt(AFTER).brackets.length).toBe(5);
    expect(pitPolicyAt(AFTER).selfDeduction).toBe(15_500_000);
    expect(pitPolicyAt(BEFORE).brackets.length).toBe(7);
    expect(pitPolicyAt(BEFORE).selfDeduction).toBe(11_000_000);
  });

  it('PROGRESSIVE: dưới mức giảm trừ → 0 thuế', () => {
    const r = computePit(
      { grossIncome: 15_000_000, method: 'PROGRESSIVE', dependents: 0 },
      AFTER,
    );
    expect(r.taxableIncome).toBe(0); // 15tr − 15,5tr < 0
    expect(r.tax).toBe(0);
  });

  it('PROGRESSIVE: thu nhập tính thuế 20tr → bậc 10% − 0,5tr = 1,5tr', () => {
    // gross 40tr − BH 10,5%(40tr=4,2tr) − 15,5tr = 20,3tr
    const r = computePit(
      { grossIncome: 40_000_000, method: 'PROGRESSIVE', dependents: 0, insuranceDeduction: 4_200_000 },
      AFTER,
    );
    expect(r.taxableIncome).toBe(20_300_000);
    // 20,3 × 10% − 0,5tr = 2,03tr − 0,5tr = 1,53tr
    expect(r.tax).toBe(1_530_000);
    expect(r.appliedRate).toBe(0.1);
  });

  it('PROGRESSIVE: có người phụ thuộc giảm thu nhập tính thuế', () => {
    const base = { grossIncome: 40_000_000, method: 'PROGRESSIVE' as const, insuranceDeduction: 4_200_000 };
    const noDep = computePit({ ...base, dependents: 0 }, AFTER);
    const twoDep = computePit({ ...base, dependents: 2 }, AFTER);
    expect(twoDep.taxableIncome).toBe(noDep.taxableIncome - 12_400_000); // 2 × 6,2tr
    expect(twoDep.tax).toBeLessThan(noDep.tax);
  });

  it('cùng thu nhập: biểu 5 bậc (sau 1/7) ≤ biểu 7 bậc (trước 1/7) — giảm trừ cao hơn', () => {
    const later = computePit({ grossIncome: 30_000_000, method: 'PROGRESSIVE' }, AFTER);
    const earlier = computePit({ grossIncome: 30_000_000, method: 'PROGRESSIVE' }, BEFORE);
    // giảm trừ 15,5tr vs 11tr → thu nhập tính thuế nhỏ hơn sau 1/7
    expect(later.taxableIncome).toBeLessThan(earlier.taxableIncome);
  });

  it('FLAT_ON_GROSS: ≥ 5tr → khấu trừ 10% trên TỔNG (không giảm trừ, không trừ BH)', () => {
    const r = computePit({ grossIncome: 10_000_000, method: 'FLAT_ON_GROSS' }, AFTER);
    expect(r.tax).toBe(1_000_000);
    expect(r.taxableIncome).toBe(10_000_000); // không trừ gì
  });

  it('FLAT_ON_GROSS: < 5tr → KHÔNG khấu trừ (ngưỡng Điều 50.2)', () => {
    const r = computePit({ grossIncome: 4_000_000, method: 'FLAT_ON_GROSS' }, AFTER);
    expect(r.tax).toBe(0);
  });

  it('FLAT_ON_GROSS: flatRate là tham số (không hardcode 10%)', () => {
    const r = computePit({ grossIncome: 10_000_000, method: 'FLAT_ON_GROSS', flatRate: 0.05 }, AFTER);
    expect(r.tax).toBe(500_000);
  });

  it('NON_RESIDENT: tỷ lệ × tổng, không áp ngưỡng', () => {
    const r = computePit({ grossIncome: 3_000_000, method: 'NON_RESIDENT' }, AFTER);
    expect(r.tax).toBe(300_000); // 10% dù dưới 5tr
  });

  it('computeSalary: net = gross − BH(10,5%) − PIT; employer cost = gross + 21,5%', () => {
    const r = computeSalary(
      { grossSalary: 40_000_000, method: 'PROGRESSIVE', dependents: 0, withInsurance: true },
      AFTER,
    );
    expect(r.insuranceEmployee).toBe(4_200_000); // 40tr × 10,5%
    expect(r.insuranceEmployer).toBe(8_600_000); // 40tr × 21,5%
    expect(r.taxableIncome).toBe(20_300_000);
    expect(r.pit).toBe(1_530_000);
    expect(r.netSalary).toBe(40_000_000 - 4_200_000 - 1_530_000);
    expect(r.totalEmployerCost).toBe(48_600_000);
  });

  it('computeSalary: vượt trần BH (20 × lương cơ sở) → cảnh báo + BH tính trên trần', () => {
    const r = computeSalary(
      { grossSalary: 80_000_000, method: 'PROGRESSIVE', withInsurance: true },
      AFTER,
    );
    const cap = insurancePolicyAt(AFTER).baseSalary * 20; // 50,6tr
    expect(r.insuranceEmployee).toBe(Math.round(cap * 0.105));
    expect(r.warnings.some(w => w.includes('trần đóng BH'))).toBe(true);
  });

  it('computeSalary: CTV (FLAT_ON_GROSS, không BH) → net = gross − PIT', () => {
    const r = computeSalary(
      { grossSalary: 20_000_000, method: 'FLAT_ON_GROSS', withInsurance: false },
      AFTER,
    );
    expect(r.insuranceEmployee).toBe(0);
    expect(r.pit).toBe(2_000_000); // 10% × 20tr
    expect(r.netSalary).toBe(18_000_000);
  });

  it('computeSalary: gross ≤ 0 không ném, net không âm', () => {
    const r = computeSalary({ grossSalary: 0, method: 'PROGRESSIVE', withInsurance: true }, AFTER);
    expect(r.netSalary).toBe(0);
    expect(r.pit).toBe(0);
  });
});
