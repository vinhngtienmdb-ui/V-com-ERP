/**
 * ============================================================================
 *  payrollDeclaration.ts — Chu kỳ khai thuế TNCN tiền lương, tiền công
 * ============================================================================
 *
 *  TT 89/2026/TT-BTC **Điều 22** (hiệu lực 01/7/2026) BÃI BỎ kê khai TNCN
 *  theo THÁNG đối với tiền lương, tiền công. Từ 01/7/2026 chỉ còn:
 *    - khai theo QUÝ (+ quyết toán năm), và
 *    - quyết toán thuế thay cho người lao động ủy quyền.
 *
 *  Hệ quả code: module lương (HR / EasyHRM / MISA sync) đang sinh tờ khai
 *  THÁNG là SAI chu kỳ. Module này là single source of truth cho chu kỳ khai,
 *  để mọi nơi gọi `getDeclarationPeriodForDate()` thay vì hardcode 'tháng'.
 *
 *  ⚠️ Quy tắc an toàn: nếu ngày nằm TRƯỚC 01/7/2026 (ngày hiệu lực Điều 22),
 *  hàm vẫn trả về 'month' để không phá dữ liệu lịch sử đã khai. Từ 01/7/2026
 *  trở đi mới áp dụng chu kỳ mặc định (quý).
 * ============================================================================
 */

import { getBasis } from '../config/legalBasis';

/** Chu kỳ khai TNCN được phép. */
export type DeclarationFrequency = 'month' | 'quarter' | 'year';

/** Khóa kỳ khai: '2026-Q1' | '2026-M03' | '2026-Y'. */
export type DeclarationPeriodKey = string;

export const TNCN_DECLARATION_FREQ: DeclarationFrequency =
  (process.env.VCOMM_PAYROLL_DECLARATION_FREQ as DeclarationFrequency) || 'quarter';

/** Ngày TT 89/2026 Điều 22 có hiệu lực — bản ghi legalBasis. */
const TT89_EFFECTIVE_FROM = getBasis('platformTaxCircular').effectiveFrom; // '2026-07-01'

/** period_no trong acc_periods (TT99): 1..12 = tháng, 21..24 = quý, NULL = năm. */
export function declarationFrequencyToPeriodNo(freq: DeclarationFrequency): number | null {
  // Hàm này ánh xạ tần suất → period_no CỤ THỂ cho một kỳ; vì period_no quý
  // phụ thuộc vào quý thứ mấy, ta chỉ trả về khung: tháng=1, quý=21, năm=null.
  // Người gọi cộng chỉ số quý (Q1→21, Q2→22...) khi tạo kỳ kế toán.
  switch (freq) {
    case 'month':
      return 1;
    case 'quarter':
      return 21;
    case 'year':
      return null;
  }
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/**
 * Trả về chu kỳ khai áp dụng TẠI `at` (mặc định: hiện tại).
 * Trước 01/7/2026 → 'month' (giữ tương thích lịch sử). Từ đó → chu kỳ cấu hình.
 */
export function getDeclarationFrequencyForDate(at: Date = new Date()): DeclarationFrequency {
  if (at < new Date(TT89_EFFECTIVE_FROM)) return 'month';
  return TNCN_DECLARATION_FREQ;
}

/** Tính quý (1..4) từ tháng (1..12). */
function quarterOfMonth(month: number): number {
  return Math.floor((month - 1) / 3) + 1;
}

/**
 * Trả về khóa kỳ khai cho một ngày bất kỳ.
 * Ví dụ: 2026-08-15 → '2026-Q3' (với chu kỳ quý, sau 01/7/2026).
 */
export function getDeclarationPeriodForDate(
  at: Date = new Date(),
): DeclarationPeriodKey {
  const freq = getDeclarationFrequencyForDate(at);
  const y = at.getUTCFullYear();
  const m = at.getUTCMonth() + 1;
  if (freq === 'year') return `${y}-Y`;
  if (freq === 'quarter') return `${y}-Q${quarterOfMonth(m)}`;
  return `${y}-M${pad2(m)}`;
}

/** Parse khóa kỳ khai → { freq, year, month?, quarter? }. Ném lỗi nếu sai định dạng. */
export function parseDeclarationPeriod(
  key: DeclarationPeriodKey,
): { freq: DeclarationFrequency; year: number; month?: number; quarter?: number } {
  const m = key.match(/^(\d{4})-(Y|Q([1-4])|M(0[1-9]|1[0-2]))$/);
  if (!m) throw new Error(`Khóa kỳ khai không hợp lệ: "${key}". Định dạng: 2026-Y | 2026-Q1 | 2026-M03.`);
  const year = Number(m[1]);
  if (m[2] === 'Y') return { freq: 'year', year };
  if (m[3]) return { freq: 'quarter', year, quarter: Number(m[3]) };
  return { freq: 'month', year, month: Number(m[4]) };
}

/** Khoảng ngày (ISO yyyy-mm-dd) của một kỳ khai — dùng làm tham số truy vấn DB. */
export function getDeclarationPeriodRange(
  key: DeclarationPeriodKey,
): { start: string; end: string } {
  const p = parseDeclarationPeriod(key);
  const y = p.year;
  if (p.freq === 'year') return { start: `${y}-01-01`, end: `${y}-12-31` };
  if (p.freq === 'quarter') {
    const q = p.quarter!;
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    return {
      start: `${y}-${pad2(startMonth)}-01`,
      end: `${y}-${pad2(endMonth)}-${lastDayOfMonth(y, endMonth)}`,
    };
  }
  const mm = p.month!;
  return { start: `${y}-${pad2(mm)}-01`, end: `${y}-${pad2(mm)}-${lastDayOfMonth(y, mm)}` };
}

/** Nhãn hiển thị tiếng Việt. */
export function formatDeclarationPeriod(key: DeclarationPeriodKey): string {
  const p = parseDeclarationPeriod(key);
  if (p.freq === 'year') return `Năm ${p.year}`;
  if (p.freq === 'quarter') return `Quý ${p.quarter}/${p.year}`;
  return `Tháng ${pad2(p.month!)}/${p.year}`;
}

/** period_no acc_periods tương ứng (quý cộng chỉ số: Q1→21..Q4→24). */
export function declarationPeriodToAccPeriodNo(key: DeclarationPeriodKey): number | null {
  const p = parseDeclarationPeriod(key);
  if (p.freq === 'year') return null;
  if (p.freq === 'quarter') return 20 + p.quarter!;
  return p.month!;
}

/** Một dòng lương đầu vào (chuẩn hóa từ cả HR mock & EasyHRM). */
export interface PayrollInputRow {
  employeeId: string;
  employeeName?: string;
  baseSalary: number;
  allowance?: number;
  bonus?: number;
  deduction?: number;
  pitAmount: number;
  insuranceAmount?: number;
  /** Tháng ISO của dòng (yyyy-mm) — dùng để lọc vào đúng kỳ. */
  monthIso: string;
}

export interface AggregatedPayroll {
  periodKey: DeclarationPeriodKey;
  freq: DeclarationFrequency;
  headcount: number;
  totalBaseSalary: number;
  totalAllowance: number;
  totalBonus: number;
  totalDeduction: number;
  totalPit: number;
  totalInsurance: number;
  totalNet: number;
  employees: Array<{
    employeeId: string;
    employeeName?: string;
    baseSalary: number;
    allowance: number;
    bonus: number;
    deduction: number;
    pitAmount: number;
    insuranceAmount: number;
    netSalary: number;
  }>;
}

function monthIsoInRange(monthIso: string, range: { start: string; end: string }): boolean {
  // monthIso dạng 'yyyy-mm'; so sánh theo ngày đầu/tháng cuối.
  const start = range.start.slice(0, 7);
  const end = range.end.slice(0, 7);
  return monthIso >= start && monthIso <= end;
}

/**
 * Gộp các dòng lương (tháng) vào một kỳ khai (quý/năm/tháng).
 * Đây là hàm thuần — dễ test, không chạm DB.
 */
export function aggregatePayrollByPeriod(
  rows: PayrollInputRow[],
  periodKey: DeclarationPeriodKey,
): AggregatedPayroll {
  const freq = parseDeclarationPeriod(periodKey).freq;
  const range = getDeclarationPeriodRange(periodKey);
  const included = rows.filter((r) => monthIsoInRange(r.monthIso, range));

  const employees = included.map((r) => {
    const base = r.baseSalary || 0;
    const allowance = r.allowance || 0;
    const bonus = r.bonus || 0;
    const deduction = r.deduction || 0;
    const pit = r.pitAmount || 0;
    const insurance = r.insuranceAmount || 0;
    const net = base + allowance + bonus - deduction - pit - insurance;
    return {
      employeeId: r.employeeId,
      employeeName: r.employeeName,
      baseSalary: base,
      allowance,
      bonus,
      deduction,
      pitAmount: pit,
      insuranceAmount: insurance,
      netSalary: net,
    };
  });

  const sum = (sel: (e: (typeof employees)[number]) => number) =>
    employees.reduce((acc, e) => acc + sel(e), 0);

  return {
    periodKey,
    freq,
    headcount: employees.length,
    totalBaseSalary: sum((e) => e.baseSalary),
    totalAllowance: sum((e) => e.allowance),
    totalBonus: sum((e) => e.bonus),
    totalDeduction: sum((e) => e.deduction),
    totalPit: sum((e) => e.pitAmount),
    totalInsurance: sum((e) => e.insuranceAmount),
    totalNet: sum((e) => e.netSalary),
    employees,
  };
}

/**
 * Chu kỳ khai TNCN hiện hành (dùng ở UI). Trả về khóa kỳ khai của ngày hiện tại.
 * Thay thế mọi chỗ hardcode 'tháng' trong module lương.
 */
export function currentTncDeclarationPeriod(): DeclarationPeriodKey {
  return getDeclarationPeriodForDate(new Date());
}
