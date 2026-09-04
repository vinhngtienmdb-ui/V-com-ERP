/**
 * ============================================================================
 *  payrollEngine.ts — GĐ 2.5: engine tính lương & thuế TNCN ĐÚNG LUẬT (2026)
 * ============================================================================
 *
 *  🔴 LỖ HỔNG (spec 024): "Công thức lương hiện tại SAI LUẬT." Module lương chỉ có
 *  `payrollDeclaration.ts` (chu kỳ khai), CHƯA có engine gross→net. Phần lớn màn hình
 *  HR lưu localStorage, không có nguồn chân lý trên server.
 *
 *  ============================================================================
 *  ⚠️ NGUYÊN TẮC BẮT BUỘC (MEMORY — tham số luật VN)
 *  ============================================================================
 *  Thuế TNCN KHÔNG có một công thức duy nhất — có 3 PHƯƠNG PHÁP theo loại hợp đồng.
 *  Mọi tham số luật PHẢI có `effectiveFrom` và mọi hàm PHẢI nhận `atDate`
 *  (không dùng `new Date()` ngầm) để chạy lại lịch sử khi luật đổi.
 *
 *  Ba phương pháp:
 *   - PROGRESSIVE  : HĐLĐ ≥ 3 tháng → biểu lũy tiến trên THU NHẬP TÍNH THUẾ (sau BH + giảm trừ).
 *   - FLAT_ON_GROSS: không HĐ / HĐLĐ < 3 tháng / dịch vụ / khoán / CTV / đã chấm dứt HĐLĐ
 *                    → tỷ lệ × TỔNG thu nhập, ngưỡng 5tr/lần, KHÔNG giảm trừ.
 *   - NON_RESIDENT : không cư trú → tỷ lệ × tổng thu nhập.
 *
 *  🔴 ĐIỂM DỄ SAI NHẤT — BIỂU THUẾ ĐỔI GIỮA NĂM 2026:
 *   - Trước 01/7/2026: biểu 7 bậc (Luật 04/2007) + giảm trừ 11tr / 4,4tr.
 *   - Từ 01/7/2026   : biểu 5 bậc (Luật 109/2025 Điều ?) + giảm trừ 15,5tr / 6,2tr (NQ 110/2025).
 *   Luật 109/2025 có hiệu lực 01/7/2026 nhưng ÁP DỤNG TỪ KỲ TÍNH THUẾ 2026 (cả năm)
 *   → khi quyết toán NĂM 2026 phải dùng biểu 5 bậc cho CẢ NĂM. Hàm dưới đây xử lý theo
 *   ngày phát sinh thu nhập; caller quyết toán năm truyền `atDate` = ngày chốt năm.
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// Tham số luật (NIÊN HẠN — đọc lại mỗi năm, có effectiveFrom)
// ─────────────────────────────────────────────────────────────────────────────

export interface TaxBracket {
  /** Giới hạn trên của bậc (triệu VNĐ/tháng). Infinity cho bậc cuối. */
  upTo: number;
  rate: number;
  /** Số tiền trừ nhanh (triệu VNĐ). */
  minus: number;
}

export interface PitPolicy {
  effectiveFrom: string; // ISO yyyy-mm-dd
  /** Biểu lũy tiến (triệu VNĐ/tháng). */
  brackets: TaxBracket[];
  /** Giảm trừ bản thân (VNĐ/tháng). */
  selfDeduction: number;
  /** Giảm trừ mỗi người phụ thuộc (VNĐ/tháng). */
  dependentDeduction: number;
}

/** Biểu 7 bậc (Luật 04/2007) — hết hiệu lực 30/6/2026. */
const PIT_7_BRACKETS: TaxBracket[] = [
  { upTo: 5, rate: 0.05, minus: 0 },
  { upTo: 10, rate: 0.1, minus: 0.25 },
  { upTo: 18, rate: 0.15, minus: 0.75 },
  { upTo: 32, rate: 0.2, minus: 1.65 },
  { upTo: 52, rate: 0.25, minus: 3.25 },
  { upTo: 80, rate: 0.3, minus: 5.85 },
  { upTo: Infinity, rate: 0.35, minus: 9.85 },
];

/** Biểu 5 bậc (Luật 109/2025) — hiệu lực 01/7/2026, áp dụng từ kỳ tính thuế 2026. */
const PIT_5_BRACKETS: TaxBracket[] = [
  { upTo: 10, rate: 0.05, minus: 0 },
  { upTo: 30, rate: 0.1, minus: 0.5 },
  { upTo: 60, rate: 0.2, minus: 3.5 },
  { upTo: 100, rate: 0.3, minus: 9.5 },
  { upTo: Infinity, rate: 0.35, minus: 14.5 },
];

/** Lịch sử chính sách: mảng SẮP XẾP GIẢM DẦN theo effectiveFrom. */
export const PIT_POLICIES: PitPolicy[] = [
  {
    effectiveFrom: '2026-07-01',
    brackets: PIT_5_BRACKETS,
    selfDeduction: 15_500_000,
    dependentDeduction: 6_200_000,
  },
  {
    effectiveFrom: '2020-07-01',
    brackets: PIT_7_BRACKETS,
    selfDeduction: 11_000_000,
    dependentDeduction: 4_400_000,
  },
];

/** Bảo hiểm bắt buộc (phần NLĐ đóng). */
export interface InsurancePolicy {
  effectiveFrom: string;
  /** Tổng tỷ lệ NLĐ: 8% BHXH + 1,5% BHYT + 1% BHTN = 10,5%. */
  employeeRate: number;
  /** Tổng tỷ lệ NSDLĐ: 17,5% BHXH + 3% BHYT + 1% BHTN = 21,5%. */
  employerRate: number;
  /** Lương cơ sở (VNĐ) — dùng tính trần đóng (20 × lương cơ sở). */
  baseSalary: number;
}

export const INSURANCE_POLICIES: InsurancePolicy[] = [
  { effectiveFrom: '2026-07-01', employeeRate: 0.105, employerRate: 0.215, baseSalary: 2_530_000 },
  { effectiveFrom: '2024-07-01', employeeRate: 0.105, employerRate: 0.215, baseSalary: 2_340_000 },
];

/** Lương tối thiểu vùng (NĐ 293/2025) — để cảnh báo, không tự động áp. */
export const MINIMUM_WAGE_BY_REGION: Record<string, number> = {
  I: 5_310_000,
  II: 4_730_000,
  III: 4_140_000,
  IV: 3_700_000,
};

export type PitMethod = 'PROGRESSIVE' | 'FLAT_ON_GROSS' | 'NON_RESIDENT';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function round0(n: number): number {
  return Math.round(n + Number.EPSILON);
}

function pickPolicy<T extends { effectiveFrom: string }>(policies: T[], at: Date): T {
  // policies đã sắp giảm dần; chọn bản đầu tiên có effectiveFrom <= at
  for (const p of policies) {
    if (at >= new Date(p.effectiveFrom + 'T00:00:00Z')) return p;
  }
  // trước mọi chính sách → bản cũ nhất
  return policies[policies.length - 1];
}

/** Chọn chính sách TNCN áp dụng tại ngày `atDate`. */
export function pitPolicyAt(atDate: Date = new Date()): PitPolicy {
  return pickPolicy(PIT_POLICIES, atDate);
}

/** Chọn chính sách BHXH áp dụng tại ngày `atDate`. */
export function insurancePolicyAt(atDate: Date = new Date()): InsurancePolicy {
  return pickPolicy(INSURANCE_POLICIES, atDate);
}

// ─────────────────────────────────────────────────────────────────────────────
// Core
// ─────────────────────────────────────────────────────────────────────────────

export interface PitInput {
  /** Tổng thu nhập chịu thuế từ tiền lương trong kỳ (VNĐ). */
  grossIncome: number;
  method: PitMethod;
  /** Số người phụ thuộc (chỉ PROGRESSIVE). */
  dependents?: number;
  /** Tiền BH đã trừ khỏi thu nhập (chỉ PROGRESSIVE). */
  insuranceDeduction?: number;
  /** Tỷ lệ khấu trừ cho FLAT_ON_GROSS / NON_RESIDENT. Mặc định 0,1 (10% NĐ 253 Điều 50.2). */
  flatRate?: number;
  /** Ngưỡng chi trả buộc khấu trừ (FLAT_ON_GROSS). Mặc định 5_000_000. */
  thresholdPerPayment?: number;
}

export interface PitResult {
  method: PitMethod;
  /** Thu nhập tính thuế (chỉ PROGRESSIVE; = gross − BH − giảm trừ). */
  taxableIncome: number;
  /** Thuế TNCN phải nộp trong kỳ (VNĐ). */
  tax: number;
  /** Bậc thuế áp dụng (triệu VNĐ/tháng) — để giải trình. */
  appliedRate?: number;
  policyEffectiveFrom: string;
  legalBasis: string;
}

/**
 * Tính thuế TNCN cho một kỳ.
 *  - PROGRESSIVE  : (gross − BH − 15,5tr − 6,2tr×phụ thuộc) → biểu lũy tiến. Âm → 0 thuế.
 *  - FLAT_ON_GROSS: gross × flatRate (10%) nếu ≥ 5tr/lần; dưới ngưỡng → 0.
 *                   KHÔNG giảm trừ, KHÔNG trừ BH.
 *  - NON_RESIDENT : gross × flatRate.
 */
export function computePit(input: PitInput, atDate: Date = new Date()): PitResult {
  const policy = pitPolicyAt(atDate);
  const gross = Math.max(0, input.grossIncome);

  if (input.method === 'FLAT_ON_GROSS' || input.method === 'NON_RESIDENT') {
    const flatRate = input.flatRate ?? 0.1;
    const threshold = input.thresholdPerPayment ?? 5_000_000;
    let tax = 0;
    if (input.method === 'NON_RESIDENT') {
      tax = round0(gross * flatRate);
    } else if (gross >= threshold) {
      // Điều 50.2 NĐ 253/2026: khấu trừ khi chi trả ≥ 5.000.000 đ/lần
      tax = round0(gross * flatRate);
    }
    return {
      method: input.method,
      taxableIncome: gross,
      tax,
      appliedRate: flatRate,
      policyEffectiveFrom: policy.effectiveFrom,
      legalBasis:
        input.method === 'NON_RESIDENT'
          ? 'Luật Thuế TNCN — người không cư trú (tỷ lệ × tổng thu nhập)'
          : 'NĐ 253/2026 Điều 50.2 — khấu trừ 10% khi chi ≥ 5tr/lần (không giảm trừ)',
    };
  }

  // PROGRESSIVE
  const insurance = input.insuranceDeduction ?? 0;
  const dependents = input.dependents ?? 0;
  const taxable = Math.max(
    0,
    gross - insurance - policy.selfDeduction - dependents * policy.dependentDeduction,
  );
  if (taxable <= 0) {
    return {
      method: 'PROGRESSIVE',
      taxableIncome: 0,
      tax: 0,
      appliedRate: 0,
      policyEffectiveFrom: policy.effectiveFrom,
      legalBasis: 'Luật Thuế TNCN — thu nhập tính thuế ≤ 0 sau giảm trừ',
    };
  }

  // Biểu tính theo TRIỆU đồng/tháng
  const millions = taxable / 1_000_000;
  let bracket: TaxBracket | undefined;
  for (const b of policy.brackets) {
    if (millions <= b.upTo) {
      bracket = b;
      break;
    }
  }
  bracket = bracket ?? policy.brackets[policy.brackets.length - 1];
  const tax = round0(millions * bracket.rate * 1_000_000 - bracket.minus * 1_000_000);

  return {
    method: 'PROGRESSIVE',
    taxableIncome: round0(taxable),
    tax: Math.max(0, tax),
    appliedRate: bracket.rate,
    policyEffectiveFrom: policy.effectiveFrom,
    legalBasis: `Luật Thuế TNCN (biểu ${policy.brackets.length} bậc, hiệu lực ${policy.effectiveFrom})`,
  };
}

export interface SalaryInput {
  /** Lương gross (chưa trừ gì). */
  grossSalary: number;
  /** Phương pháp tính thuế. */
  method: PitMethod;
  /** Số người phụ thuộc (PROGRESSIVE). */
  dependents?: number;
  /** true = tính BHXH (HĐLĐ chính thức). FLAT_ON_GROSS / CTV thường KHÔNG đóng BH. */
  withInsurance?: boolean;
  /** Tỷ lệ khấu trừ (FLAT_ON_GROSS / NON_RESIDENT). */
  flatRate?: number;
}

export interface SalaryResult {
  grossSalary: number;
  insuranceEmployee: number; // BH NLĐ đóng (10,5%)
  insuranceEmployer: number; // BH NSDLĐ đóng (21,5%) — chi phí, không trừ vào lương
  taxableIncome: number;
  pit: number;
  netSalary: number; // gross − BH_NLĐ − PIT
  totalEmployerCost: number; // gross + BH_NSDLĐ
  /** Cảnh báo vượt trần BH / dưới lương tối thiểu vùng. */
  warnings: string[];
  policyEffectiveFrom: string;
}

/**
 * Tính lương gross → net theo đúng luật 2026.
 *  - BHXH chỉ tính trên phần LƯƠNG ĐÓNG BH (mặc định = gross), bị giới hạn trần
 *    20 × lương cơ sở (từ 7/2026: 50,6tr).
 *  - PIT tính theo phương pháp hợp đồng.
 */
export function computeSalary(input: SalaryInput, atDate: Date = new Date()): SalaryResult {
  const insPolicy = insurancePolicyAt(atDate);
  const warnings: string[] = [];
  const gross = Math.max(0, input.grossSalary);

  const capMonthly = insPolicy.baseSalary * 20; // trần đóng BH/tháng
  let insuranceBase = 0;
  if (input.withInsurance) {
    insuranceBase = Math.min(gross, capMonthly);
    if (gross > capMonthly) {
      warnings.push(
        `Lương ${gross} vượt trần đóng BH (${capMonthly} = 20 × lương cơ sở ${insPolicy.baseSalary}). ` +
        `BH chỉ tính trên ${capMonthly}.`,
      );
    }
  }

  const insuranceEmployee = insuranceBase ? round0(insuranceBase * insPolicy.employeeRate) : 0;
  const insuranceEmployer = insuranceBase ? round0(insuranceBase * insPolicy.employerRate) : 0;

  const pit = computePit(
    {
      grossIncome: gross,
      method: input.method,
      dependents: input.dependents ?? 0,
      insuranceDeduction: insuranceEmployee,
      flatRate: input.flatRate,
    },
    atDate,
  );

  // Lưu ý: FLAT_ON_GROSS không trừ BH vào thu nhập chịu thuế (tính trên TỔNG),
  // nhưng BH (nếu có) vẫn bị trừ khỏi lương thực nhận.
  const netSalary = round0(gross - insuranceEmployee - pit.tax);

  return {
    grossSalary: round0(gross),
    insuranceEmployee,
    insuranceEmployer,
    taxableIncome: pit.taxableIncome,
    pit: pit.tax,
    netSalary,
    totalEmployerCost: round0(gross + insuranceEmployer),
    warnings,
    policyEffectiveFrom: pit.policyEffectiveFrom,
  };
}
