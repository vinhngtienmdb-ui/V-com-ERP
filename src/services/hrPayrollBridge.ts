/**
 * ============================================================================
 *  hrPayrollBridge.ts — GĐ 2.5: nối payrollEngine vào UI Lương (HR.tsx)
 * ============================================================================
 *
 *  🔴 LỖ HỔNG (MEMORY mục 8: "UI lương"):
 *  Tab "Lương & Payslip" của HR.tsx đang dùng `autoCalculatePayroll` — công thức
 *  MOCK SAI LUẬT:
 *    - PIT = 5% phẳng × mọi thu nhập (sai cả 3 phương pháp)
 *    - BHXH = 10% lương (đúng là 10,5% NLĐ, có trần 20× lương cơ sở)
 *    - Không phân biệt HĐLĐ ≥3 tháng (PROGRESSIVE) vs CTV/khoán (FLAT_ON_GROSS)
 *    - Lương cơ bản hardcoded 15.000.000 cho MỌI nhân viên
 *
 *  Module này là cầu nối THUẦN (không DB) giữa dữ liệu nhân sự UI và
 *  payrollEngine, để có thể test độc lập:
 *    - `pickPitMethodFromEmployee`: Employee → PitMethod đúng luật
 *    - `resolveEmployeeGross`: chọn lương gross theo thứ tự ưu tiên
 *    - `buildPayrollRowFromEmployee`: Employee → 1 dòng Payroll (đúng luật)
 *    - `buildPayrollBatchFromEmployees`: chạy batch toàn công ty
 *
 *  ⚠️ NGUỒN LƯƠNG: `easyhrm_employees` (localStorage của module EasyHRM) là
 *  nơi duy nhất có salaryReal/salaryBase/salaryInsurance đầy đủ. HR.tsx đọc
 *  chung qua resolveEmployeeGross — nếu không có thì fallback baseSalary của
 *  salaryHistory, cuối cùng là 0 (KHÔNG bịa số 15tr như cũ).
 * ============================================================================
 */

import {
  computeSalary,
  type PitMethod,
  type SalaryResult,
} from './payrollEngine';

// ─────────────────────────────────────────────────────────────────────────────
// Đầu vào — hình dạng Employee mà HR.tsx/EasyHRM đang dùng (giữ lỏng, cấu trúc
// thật nằm ở src/types/erp.ts; bridge chỉ cần các trường liên quan lương).
// ─────────────────────────────────────────────────────────────────────────────

export interface PayrollEmployeeInput {
  id: string;
  fullName?: string;
  joinDate?: string; // 'dd/MM/yyyy' | ISO
  employeeType?: 'full_time' | 'part_time' | 'contract';
  status?: string;
  /** Danh sách hợp đồng — chỉ cần `type` + `signDate` để suy ra thời hạn. */
  contracts?: { type?: string; signDate?: string; expiryDate?: string }[];
  /** Lương gần nhất — salaryHistory của EasyHRM (mới nhất ở CUỐI mảng). */
  salaryHistory?: { salaryReal?: number; salaryBase?: number; changeDate?: string }[];
}

/** Kết quả 1 dòng payroll cho UI + journal Finance (hrm_payroll). */
export interface PayrollRow {
  employeeId: string;
  employeeName: string;
  /** Tháng lương dạng 'MM/YYYY'. */
  month: string;
  method: PitMethod;
  baseSalary: number;
  allowance: number;
  bonus: number;
  deduction: number;
  /**
   * Số người phụ thuộc đã dùng để tính PIT.
   * ⚠️ BẮT BUỘC phải mang theo: nếu không, khi người dùng SỬA một trường trong
   * modal lương, `recomputePayrollDraft` không còn biết số phụ thuộc và sẽ tính
   * lại PIT như người độc thân → tăng thuế oan.
   */
  dependents: number;
  pitAmount: number;
  insuranceAmount: number;
  netSalary: number;
  status: 'pending' | 'paid';
  /** Chi phí tổng NSDLĐ (gross + BH 21,5%) — để P&L đúng. */
  employerCost: number;
  warnings: string[];
  legalBasis: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Phương pháp tính thuế — luật 2026 (3 phương pháp)
//  - PROGRESSIVE  : HĐLĐ ≥ 3 tháng → biểu lũy tiến sau BH + giảm trừ
//  - FLAT_ON_GROSS: CTV/khoán/thời vụ/< 3 tháng/no HĐLĐ → 10% × TỔNG (≥5tr/lần)
//  - NON_RESIDENT : không cư trú → tỷ lệ × tổng (bridge không tự gán — cần
//                   KYC cư trú, để caller quyết định; mặc định FLAT_ON_GROSS
//                   là an toàn về nghĩa vụ khấu trừ).
// ─────────────────────────────────────────────────────────────────────────────

/** Chuẩn hoá ngày 'dd/MM/yyyy' → Date (đọc từ mock EasyHRM/HR). */
function parseDate(s?: string): Date | null {
  if (!s) return null;
  const dmy = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const iso = new Date(s);
  return Number.isNaN(iso.getTime()) ? null : iso;
}

/** Số tiền không âm và PHẢI hữu hạn — chặn NaN lọt vào gross (Math.max(0,NaN)=NaN). */
function nonNegative(value: number | undefined, field: string): number {
  if (value === undefined || value === null) return 0;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} phải là số hữu hạn (nhận ${String(value)}).`);
  }
  return Math.max(0, value);
}

/** Ngày giao HĐ gần nhất (mới nhất) — để đo thời hạn đã làm việc. */
export function latestContractStartDate(contracts?: { signDate?: string }[]): Date | null {
  if (!contracts?.length) return null;
  let latest: Date | null = null;
  for (const c of contracts) {
    const d = parseDate(c?.signDate);
    if (d && (!latest || d > latest)) latest = d;
  }
  return latest;
}

/**
 * Chọn phương pháp TNCN theo Employee:
 *  - HĐLĐ chính thức (full_time) + đã ký ≥ 3 tháng so với atDate → PROGRESSIVE
 *  - part_time / contract (thời vụ, khoán, CTV) → FLAT_ON_GROSS
 *  - Không có hợp đồng → FLAT_ON_GROSS (không được "tặng" giảm trừ)
 *  - NON_RESIDENT: bridge KHÔNG tự gán — cần xác định cư trú thật, caller override.
 */
export function pickPitMethodFromEmployee(
  emp: PayrollEmployeeInput,
  atDate: Date = new Date(),
): PitMethod {
  const isOfficialContract =
    emp.employeeType === 'full_time' &&
    (emp.contracts?.some(c => (c.type || '').includes('Hợp đồng lao động')) || false);
  if (!isOfficialContract) return 'FLAT_ON_GROSS';

  const start = latestContractStartDate(emp.contracts);
  if (!start) return 'FLAT_ON_GROSS'; // không rõ ngày ký → an toàn: khoán

  // ≥ 3 tháng kể từ ngày ký HĐLĐ → PROGRESSIVE
  const threeMonthsLater = new Date(start);
  threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
  return atDate >= threeMonthsLater ? 'PROGRESSIVE' : 'FLAT_ON_GROSS';
}

// ─────────────────────────────────────────────────────────────────────────────
// Lương gross — thứ tự ưu tiên
// ─────────────────────────────────────────────────────────────────────────────

export interface GrossResolveResult {
  gross: number;
  source: 'salary_history' | 'hardcoded_zero' | 'missing';
  warnings: string[];
}

/**
 * Chọn lương gross của nhân viên. Thứ tự:
 *  1. salaryHistory (EasyHRM) — phần tử CUỐI (mới nhất) có salaryReal/salaryBase > 0
 *  2. Không có → gross 0 + cảnh báo (KHÔNG bịa 15tr — làm ảo tổng quỹ lương)
 */
export function resolveEmployeeGross(emp: PayrollEmployeeInput): GrossResolveResult {
  const hist = emp.salaryHistory ?? [];
  for (let i = hist.length - 1; i >= 0; i--) {
    const row = hist[i];
    const v = Number(row?.salaryReal ?? row?.salaryBase ?? 0);
    if (Number.isFinite(v) && v > 0) {
      return {
        gross: v,
        source: 'salary_history',
        warnings: [],
      };
    }
  }
  return {
    gross: 0,
    source: 'missing',
    warnings: [
      `Nhân viên ${emp.id}${emp.fullName ? ` (${emp.fullName})` : ''} chưa có lương khai báo (salaryHistory trống) — gross = 0.`,
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Dòng payroll — Employee → PayrollRow
// ─────────────────────────────────────────────────────────────────────────────

export interface BuildRowOptions {
  /** Tháng lương 'MM/YYYY'. Mặc định lấy từ atDate. */
  monthLabel?: string;
  /** Phụ cấp (không chịu… vẫn chịu thuế — phụ cấp CỘNG vào gross thu nhập). */
  allowance?: number;
  /** Thưởng KPI/OT kỳ này. */
  bonus?: number;
  /** Khấu trừ kỷ luật (trừ thẳng khỏi gross). */
  deduction?: number;
  /** Người phụ thuộc (PROGRESSIVE). */
  dependents?: number;
  /** Số người phụ thuộc tự khai ở nơi khác (vd EasyHRM familyMembers). */
  flatRate?: number;
  /** Chọn NON_RESIDENT nếu đã KYC. */
  methodOverride?: PitMethod;
  atDate?: Date;
}

/** 'MM/YYYY' từ atDate. */
function monthLabelOf(at: Date): string {
  const m = String(at.getMonth() + 1).padStart(2, '0');
  return `${m}/${at.getFullYear()}`;
}

/**
 * Tính 1 dòng payroll đúng luật cho một nhân viên.
 *
 * Gross chịu thuế = lương + phụ cấp + thưởng − khấu trừ kỷ luật.
 * withInsurance: chỉ PROGRESSIVE (HĐLĐ ≥3 tháng) mới đóng BH — CTV/khoán không.
 */
export function buildPayrollRowFromEmployee(
  emp: PayrollEmployeeInput,
  opts: BuildRowOptions = {},
): PayrollRow {
  const at = opts.atDate ?? new Date();
  const method = opts.methodOverride ?? pickPitMethodFromEmployee(emp, at);
  const { gross: baseGross, warnings } = resolveEmployeeGross(emp);
  // ⚠️ `Math.max(0, x)` KHÔNG chặn được NaN (`Math.max(0, NaN) === NaN`) — một
  // phụ cấp NaN (form trống parse ra NaN) sẽ kéo gross → NaN và sinh ra dòng
  // lương `netSalary: NaN` mà không có cảnh báo nào. Ném để
  // `buildPayrollBatchFromEmployees` bắt và hiện thành cảnh báo.
  const allowance = nonNegative(opts.allowance, 'allowance');
  const bonus = nonNegative(opts.bonus, 'bonus');
  const deduction = nonNegative(opts.deduction, 'deduction');
  const dependents = nonNegative(opts.dependents, 'dependents');

  const gross = Math.max(0, baseGross + allowance + bonus - deduction);

  const salary: SalaryResult = computeSalary(
    {
      grossSalary: gross,
      method,
      dependents,
      withInsurance: method === 'PROGRESSIVE',
      flatRate: opts.flatRate,
    },
    at,
  );

  return {
    employeeId: emp.id,
    employeeName: emp.fullName ?? emp.id,
    month: opts.monthLabel ?? monthLabelOf(at),
    method,
    baseSalary: baseGross,
    allowance,
    bonus,
    deduction,
    dependents,
    pitAmount: salary.pit,
    insuranceAmount: salary.insuranceEmployee,
    netSalary: salary.netSalary,
    status: 'pending',
    employerCost: salary.totalEmployerCost,
    warnings: [...warnings, ...salary.warnings],
    legalBasis: salary.policyEffectiveFrom,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tính LẠI dòng lương đang bị SỬA tay (modal "Sửa bảng lương")
// ─────────────────────────────────────────────────────────────────────────────

export interface PayrollDraft {
  baseSalary?: number;
  allowance?: number;
  bonus?: number;
  deduction?: number;
  /**
   * Phương pháp đã chốt lúc build row.
   * Thiếu (dòng MOCK_PAYROLL cũ) → FLAT_ON_GROSS + cảnh báo: đây là lựa chọn an
   * toàn về nghĩa vụ khấu trừ, không "tặng" giảm trừ cho đối tượng chưa xác minh.
   */
  method?: PitMethod;
  /** Số người phụ thuộc — phải được mang theo từ dòng gốc. */
  dependents?: number;
}

export interface PayrollDraftResult {
  pitAmount: number;
  insuranceAmount: number;
  netSalary: number;
  employerCost: number;
  warnings: string[];
}

/**
 * Tính lại thuế/BH/net cho một dòng lương đang được sửa TAY.
 *
 * 🔴 Tại sao cần hàm này: modal sửa lương trong HR.tsx từng tự tính lại bằng
 * công thức MOCK `pitAmount = gross × 5%` và `insuranceAmount = base × 10%`.
 * Nghĩa là chỉ cần người dùng gõ lại Lương cơ bản (hoặc phụ cấp / thưởng /
 * phạt), mọi kết quả ĐÚNG LUẬT do `buildPayrollRowFromEmployee` vừa tạo sẽ bị
 * GHI ĐÈ bằng công thức sai:
 *   - 5% phẳng bất chấp HĐLĐ hay CTV (CTV phải chịu 10% × tổng khi ≥5tr);
 *   - 10% BH thay vì 10,5%, và KHÔNG có trần 20 × lương cơ sở;
 *   - không hề có giảm trừ 15,5tr/6,2tr (PROGRESSIVE).
 * Hàm này là đường duy nhất để modal đó đi qua engine.
 *
 * Công thức GHÉP ĐÔI với `buildPayrollRowFromEmployee` (gross =
 * base + phụ cấp + thưởng − phạt) để số liệu không đổi khi không sửa gì.
 */
export function recomputePayrollDraft(
  draft: PayrollDraft,
  atDate: Date = new Date(),
): PayrollDraftResult {
  const warnings: string[] = [];

  const baseSalary = nonNegative(draft.baseSalary, 'baseSalary');
  const allowance = nonNegative(draft.allowance, 'allowance');
  const bonus = nonNegative(draft.bonus, 'bonus');
  const deduction = nonNegative(draft.deduction, 'deduction');
  const dependents = nonNegative(draft.dependents, 'dependents');

  let method: PitMethod = draft.method ?? 'FLAT_ON_GROSS';
  if (!draft.method) {
    warnings.push(
      'Dòng lương chưa có phương pháp TNCN (method) — tạm tính FLAT_ON_GROSS (khấu trừ 10% khi ≥5tr/lần). ' +
      'Hãy chạy lại "Tính lương AI (Batch)" để chốt đúng luật.',
    );
  } else if (!['PROGRESSIVE', 'FLAT_ON_GROSS', 'NON_RESIDENT'].includes(method)) {
    warnings.push(`method không hợp lệ ("${String(draft.method)}") — dùng FLAT_ON_GROSS.`);
    method = 'FLAT_ON_GROSS';
  }

  const gross = Math.max(0, baseSalary + allowance + bonus - deduction);

  const salary = computeSalary(
    {
      grossSalary: gross,
      method,
      dependents,
      withInsurance: method === 'PROGRESSIVE',
    },
    atDate,
  );

  return {
    pitAmount: salary.pit,
    insuranceAmount: salary.insuranceEmployee,
    netSalary: salary.netSalary,
    employerCost: salary.totalEmployerCost,
    warnings: [...warnings, ...salary.warnings],
  };
}

/** Chạy batch toàn bộ nhân viên — trả kèm cảnh báo gộp (không fail-fast). */
export function buildPayrollBatchFromEmployees(
  employees: PayrollEmployeeInput[],
  opts: BuildRowOptions = {},
): { rows: PayrollRow[]; warnings: string[] } {
  const rows: PayrollRow[] = [];
  const warnings: string[] = [];
  for (const emp of employees) {
    try {
      const row = buildPayrollRowFromEmployee(emp, opts);
      rows.push(row);
      warnings.push(...row.warnings);
    } catch (e) {
      // 1 nhân viên lỗi không chặn cả kỳ (nguyên tắc depreciationRunService)
      warnings.push(`Không tính được lương cho ${emp.id}${emp.fullName ? ` (${emp.fullName})` : ''}: ${(e as Error).message}`);
    }
  }
  return { rows, warnings };
}
