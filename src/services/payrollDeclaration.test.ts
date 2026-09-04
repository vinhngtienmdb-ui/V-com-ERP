import { describe, it, expect } from 'vitest';
import {
  getDeclarationFrequencyForDate,
  getDeclarationPeriodForDate,
  getDeclarationPeriodRange,
  parseDeclarationPeriod,
  formatDeclarationPeriod,
  declarationPeriodToAccPeriodNo,
  aggregatePayrollByPeriod,
  type PayrollInputRow,
} from './payrollDeclaration';

// Helper: tạo Date UTC để không lệch múi giờ.
const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe('S4 — chu kỳ khai TNCN (TT 89/2026 Điều 22)', () => {
  it('trước 01/7/2026 vẫn khai tháng (giữ tương thích lịch sử)', () => {
    expect(getDeclarationFrequencyForDate(d('2026-06-30'))).toBe('month');
  });

  it('từ 01/7/2026 trở đi áp dụng chu kỳ mặc định (quý)', () => {
    expect(getDeclarationFrequencyForDate(d('2026-07-01'))).toBe('quarter');
    expect(getDeclarationFrequencyForDate(d('2026-09-15'))).toBe('quarter');
    expect(getDeclarationFrequencyForDate(d('2027-01-10'))).toBe('quarter');
  });

  it('getDeclarationPeriodForDate sinh khóa quý đúng (sau 01/7/2026)', () => {
    // 2026-04-30 nằm TRƯỚC hiệu lực Điều 22 → vẫn khai tháng (tương thích lịch sử)
    expect(getDeclarationPeriodForDate(d('2026-04-30'))).toBe('2026-M04');
    expect(getDeclarationPeriodForDate(d('2026-08-15'))).toBe('2026-Q3');
    expect(getDeclarationPeriodForDate(d('2027-04-30'))).toBe('2027-Q2');
    expect(getDeclarationPeriodForDate(d('2027-02-01'))).toBe('2027-Q1');
  });

  it('getDeclarationPeriodRange trả đúng khoảng ngày của quý', () => {
    expect(getDeclarationPeriodRange('2026-Q1')).toEqual({ start: '2026-01-01', end: '2026-03-31' });
    expect(getDeclarationPeriodRange('2026-Q4')).toEqual({ start: '2026-10-01', end: '2026-12-31' });
    expect(getDeclarationPeriodRange('2026-Y')).toEqual({ start: '2026-01-01', end: '2026-12-31' });
    expect(getDeclarationPeriodRange('2026-M03')).toEqual({ start: '2026-03-01', end: '2026-03-31' });
  });

  it('parseDeclarationPeriod round-trip', () => {
    expect(parseDeclarationPeriod('2026-Q2')).toEqual({ freq: 'quarter', year: 2026, quarter: 2 });
    expect(parseDeclarationPeriod('2026-Y')).toEqual({ freq: 'year', year: 2026 });
    expect(parseDeclarationPeriod('2026-M11')).toEqual({ freq: 'month', year: 2026, month: 11 });
    expect(() => parseDeclarationPeriod('2026-X9')).toThrow();
  });

  it('formatDeclarationPeriod tiếng Việt', () => {
    expect(formatDeclarationPeriod('2026-Q3')).toBe('Quý 3/2026');
    expect(formatDeclarationPeriod('2026-Y')).toBe('Năm 2026');
    expect(formatDeclarationPeriod('2026-M03')).toBe('Tháng 03/2026');
  });

  it('declarationPeriodToAccPeriodNo ánh đúng period_no TT99', () => {
    expect(declarationPeriodToAccPeriodNo('2026-Q1')).toBe(21);
    expect(declarationPeriodToAccPeriodNo('2026-Q4')).toBe(24);
    expect(declarationPeriodToAccPeriodNo('2026-Y')).toBeNull();
    expect(declarationPeriodToAccPeriodNo('2026-M05')).toBe(5);
  });

  it('aggregatePayrollByPeriod gộp 3 tháng vào quý (không lọt tháng ngoài kỳ)', () => {
    const rows: PayrollInputRow[] = [
      { employeeId: 'E1', baseSalary: 10_000_000, pitAmount: 500_000, monthIso: '2026-01' },
      { employeeId: 'E1', baseSalary: 10_000_000, pitAmount: 500_000, monthIso: '2026-02' },
      { employeeId: 'E1', baseSalary: 10_000_000, pitAmount: 500_000, monthIso: '2026-03' },
      { employeeId: 'E1', baseSalary: 10_000_000, pitAmount: 500_000, monthIso: '2026-04' }, // lọt sang Q2
    ];
    const agg = aggregatePayrollByPeriod(rows, '2026-Q1');
    expect(agg.headcount).toBe(3);
    expect(agg.totalBaseSalary).toBe(30_000_000);
    expect(agg.totalPit).toBe(1_500_000);
    expect(agg.freq).toBe('quarter');
  });

  it('aggregatePayrollByPeriod tính net đúng (có BH + giảm trừ)', () => {
    const rows: PayrollInputRow[] = [
      {
        employeeId: 'E2',
        employeeName: 'Nguyễn A',
        baseSalary: 20_000_000,
        allowance: 1_000_000,
        bonus: 500_000,
        deduction: 200_000,
        pitAmount: 1_200_000,
        insuranceAmount: 2_000_000,
        monthIso: '2026-07',
      },
    ];
    const agg = aggregatePayrollByPeriod(rows, '2026-Q3');
    expect(agg.employees[0].netSalary).toBe(20_000_000 + 1_000_000 + 500_000 - 200_000 - 1_200_000 - 2_000_000);
    expect(agg.totalNet).toBe(agg.employees[0].netSalary);
  });
});
