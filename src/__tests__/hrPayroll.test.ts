import { describe, it, expect } from 'vitest';
import { calcNetPay } from '../components/hr/HRPayroll';

describe('HR Payroll — calcNetPay', () => {
  it('tính đúng net pay cơ bản (không có OT/bonus/deductions)', () => {
    const net = calcNetPay({ baseSalary: 10_000_000, insurance: 1_000_000, tax: 500_000 });
    expect(net).toBe(8_500_000);
  });

  it('cộng overtime và bonus vào net pay', () => {
    const net = calcNetPay({
      baseSalary: 10_000_000,
      overtime: 500_000,
      bonus: 1_000_000,
    });
    expect(net).toBe(11_500_000);
  });

  it('trừ deductions khỏi net pay', () => {
    const net = calcNetPay({ baseSalary: 10_000_000, deductions: 200_000 });
    expect(net).toBe(9_800_000);
  });

  it('tính đầy đủ: baseSalary + overtime + bonus - deductions - insurance - tax', () => {
    const net = calcNetPay({
      baseSalary: 15_000_000,
      overtime: 300_000,
      bonus: 1_000_000,
      deductions: 500_000,
      insurance: 1_500_000,
      tax: 450_000,
    });
    // 15_000_000 + 300_000 + 1_000_000 - 500_000 - 1_500_000 - 450_000 = 13_850_000
    expect(net).toBe(13_850_000);
  });

  it('net pay = 0 khi tất cả khấu trừ bằng tổng thu nhập', () => {
    const net = calcNetPay({
      baseSalary: 5_000_000,
      insurance: 2_500_000,
      tax: 2_500_000,
    });
    expect(net).toBe(0);
  });

  it('net pay có thể âm khi khấu trừ vượt thu nhập', () => {
    const net = calcNetPay({
      baseSalary: 5_000_000,
      deductions: 6_000_000,
    });
    expect(net).toBe(-1_000_000);
  });

  it('default parameters = 0 hoạt động đúng', () => {
    const net = calcNetPay({ baseSalary: 8_000_000 });
    expect(net).toBe(8_000_000);
  });
});

// ── Pure function: tính KPI bonus ───────────────────────────────────────────
function calcKpiBonus(current: number, target: number, baseBonus = 3_000_000): number {
  if (target <= 0) return 0;
  const ratio = current / target;
  if (ratio >= 1.2) return baseBonus * 1.5;
  if (ratio >= 1.0) return baseBonus;
  if (ratio >= 0.8) return 0;
  return -baseBonus * 0.5; // dưới 80%: trừ
}

describe('HR KPI — calcKpiBonus', () => {
  it('đạt >= 120% mục tiêu → thưởng 1.5x', () => {
    expect(calcKpiBonus(120, 100)).toBe(4_500_000);
  });

  it('đạt 100-119% mục tiêu → thưởng chuẩn', () => {
    expect(calcKpiBonus(100, 100)).toBe(3_000_000);
    expect(calcKpiBonus(115, 100)).toBe(3_000_000);
  });

  it('đạt 80-99% mục tiêu → không thưởng, không phạt', () => {
    expect(calcKpiBonus(85, 100)).toBe(0);
  });

  it('dưới 80% mục tiêu → trừ 0.5x', () => {
    expect(calcKpiBonus(70, 100)).toBe(-1_500_000);
  });

  it('target = 0 → trả về 0 (tránh chia cho 0)', () => {
    expect(calcKpiBonus(100, 0)).toBe(0);
  });
});

// ── Attendance late fee ──────────────────────────────────────────────────────
function calcLateFee(lateMinutes: number, feePerMinute = 10_000): number {
  return lateMinutes > 0 ? lateMinutes * feePerMinute : 0;
}

describe('HR Attendance — calcLateFee', () => {
  it('đi trễ 10 phút → phạt 100,000', () => {
    expect(calcLateFee(10)).toBe(100_000);
  });

  it('đúng giờ (lateMinutes = 0) → không phạt', () => {
    expect(calcLateFee(0)).toBe(0);
  });

  it('không nhận số âm', () => {
    expect(calcLateFee(-5)).toBe(0);
  });
});
