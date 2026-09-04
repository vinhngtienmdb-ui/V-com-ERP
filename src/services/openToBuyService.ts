/**
 * ============================================================================
 *  openToBuyService.ts — GĐ 4.4: Open-to-Buy (kế hoạch mua hàng) cho VComm Hub
 * ============================================================================
 *
 *  Nguồn gốc: spec 023 §4 — đối chiếu `tannhdev/viet-erp`, kết luận
 *  "Open-to-Buy là thứ duy nhất đáng học" từ repo đó (14 file mua hàng của họ
 *  chủ yếu phục vụ MRP/sản xuất — VComm KHÔNG sản xuất nên bỏ MRP).
 *
 *  Open-to-Buy (OTB) là gì?
 *    Ngân sách MUA HÀNG còn lại cho một kỳ, tính NGƯỢC từ kế hoạch bán:
 *
 *      OTB = Bán kế hoạch + Giảm giá kế hoạch + Hao hụt kế hoạch
 *            + Tồn cuối kỳ mục tiêu − Tồn đầu kỳ − Hàng đã đặt (đang về)
 *
 *    Nói cách khác: "cần có bao nhiêu hàng" trừ đi "đang có / đang về bao nhiêu"
 *    = "được phép mua thêm bao nhiêu". Không có OTB, người mua hàng mua theo cảm
 *    tính → tồn kho phình (chôn vốn) hoặc gãy hàng (mất doanh thu).
 *
 *  🔴 ĐẶC THÙ VComm — 3 điểm khác với OTB may mặc cổ điển:
 *   1. **Ràng buộc TIỀN MẶT.** VComm là sàn + chuỗi trạm, vốn lưu động hạn hẹp.
 *      OTB "lý thuyết" vô nghĩa nếu không đủ tiền mua → có `applyCashLimit()`
 *      phân bổ tiền theo thứ tự kỳ (kỳ gần được ưu tiên).
 *   2. **Hàng DỄ HỎNG.** Nông sản/thực phẩm → số tuần cung ứng (weeks of supply)
 *      phải THẤP, tồn nhiều = hỏng = ghi nhận hao hụt. Có cảnh báo riêng.
 *   3. **Hàng đã cam kết từ F2B2B.** Lệnh gom (pool order) đã chốt với nông dân/
 *      nhà cung cấp tính vào `onOrder` — nếu không trừ đi sẽ mua TRÙNG.
 *
 *  Đơn vị: OTB tính theo GIÁ BÁN (retail) cho dễ đối chiếu với kế hoạch bán,
 *  rồi quy ra GIÁ VỐN (cost) bằng `plannedMarkupRate` để đối chiếu ngân sách tiền.
 *  Toàn bộ module THUẦN (pure), không đụng DB → test được, chạy lại được lịch sử.
 * ============================================================================
 */

export class OpenToBuyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenToBuyError';
  }
}

/** Số tuần trung bình trong 1 tháng (52 tuần / 12 tháng) — dùng khi không truyền weeksInPeriod. */
export const WEEKS_PER_MONTH = 52 / 12;

/** Ngưỡng cảnh báo số tuần cung ứng cho hàng tươi sống (nông sản/thực phẩm). */
export const PERISHABLE_MAX_WEEKS_OF_SUPPLY = 3;

/** Ngưỡng cảnh báo chung: tồn kho dự kiến vượt quá bao nhiêu tuần bán. */
export const DEFAULT_MAX_WEEKS_OF_SUPPLY = 8;

export interface OpenToBuyPeriodInput {
  /** Kỳ kế hoạch, dạng 'YYYY-MM' (hoặc 'YYYY-Wnn' — chỉ dùng để hiển thị/gắn id). */
  period: string;
  /** Doanh thu kế hoạch của kỳ (theo GIÁ BÁN). Bắt buộc, ≥ 0. */
  forecastSales: number;
  /** Giảm giá/khuyến mãi kế hoạch (giá bán). Mặc định 0. */
  plannedMarkdown?: number;
  /** Hao hụt/mất mát/hỏng kế hoạch (giá bán). Mặc định 0. Với hàng tươi: bắt buộc ước tính. */
  plannedShrinkage?: number;
  /** Hàng ĐÃ ĐẶT / đang về, quy đổi theo giá bán. Bắt buộc phải truyền để tránh mua trùng. */
  onOrderRetail?: number;
  /** Tồn cuối kỳ mục tiêu (giá bán). Nếu bỏ trống → tự tính từ targetWeeksOfSupply. */
  targetEndingInventoryRetail?: number;
  /** Số tuần cung ứng mục tiêu. Dùng khi không truyền targetEndingInventoryRetail. */
  targetWeeksOfSupply?: number;
  /** Số tuần thực tế trong kỳ (tháng = 4.345). Mặc định WEEKS_PER_MONTH. */
  weeksInPeriod?: number;
  /** true = hàng dễ hỏng → áp ngưỡng cảnh báo tồn kho thấp hơn. */
  perishable?: boolean;
}

export interface OpenToBuyPlanInput {
  /** Tồn đầu kỳ của kỳ ĐẦU TIÊN (giá bán). Các kỳ sau lấy tồn cuối kỳ trước. */
  openingInventoryRetail: number;
  /**
   * Tỷ lệ lãi gộp kế hoạch trên GIÁ BÁN (0..1). Dùng để quy OTB từ giá bán sang giá vốn:
   * `otbCost = otbRetail × (1 − markupRate)`.
   * Ví dụ markup 30% → mỗi 100đ hàng bán ra cần bỏ 70đ tiền mua.
   */
  plannedMarkupRate?: number;
  periods: OpenToBuyPeriodInput[];
  /** Tiền MẶT tối đa có thể dùng để mua hàng trong toàn kế hoạch (giá vốn). */
  cashLimit?: number;
}

export interface OpenToBuyLine {
  period: string;
  /** Tồn đầu kỳ (kỳ sau = tồn cuối kỳ trước, đã tự động nối). */
  beginningInventoryRetail: number;
  forecastSales: number;
  plannedMarkdown: number;
  plannedShrinkage: number;
  onOrderRetail: number;
  /** Tồn cuối kỳ mục tiêu (đã quy ra số tiền nếu chỉ truyền weeks of supply). */
  targetEndingInventoryRetail: number;
  /** Tổng nhu cầu hàng trong kỳ (bán + giảm giá + hao hụt). */
  totalRequirementRetail: number;
  /** ⭐ OTB = nhu cầu + tồn mục tiêu − tồn đầu − hàng đã đặt (giá bán). Có thể ÂM. */
  otbRetail: number;
  /** OTB quy ra GIÁ VỐN tiền phải trả. */
  otbCost: number;
  /** Số tuần cung ứng của tồn cuối kỳ mục tiêu. */
  weeksOfSupply: number;
  /** OTB thực tế sau khi bị giới hạn bởi tiền mặt (chỉ có khi truyền cashLimit). */
  affordableOtbCost?: number;
  /** Phần OTB bị hoãn vì thiếu tiền (0 = đủ tiền). */
  deferredOtbCost?: number;
  warnings: string[];
}

export interface OpenToBuyPlan {
  lines: OpenToBuyLine[];
  totals: {
    forecastSales: number;
    plannedMarkdown: number;
    plannedShrinkage: number;
    otbRetail: number;
    otbCost: number;
    /** Tổng OTB THỰC TẾ sau khi áp giới hạn tiền mặt (nếu có). */
    affordableOtbCost: number;
    deferredOtbCost: number;
  };
  warnings: string[];
}

/* -------------------------------------------------------------------------- */
/*  Hàm thuần                                                                  */
/* -------------------------------------------------------------------------- */

/** Làm tròn về đồng (VND không có lẻ). */
export function roundVnd(value: number): number {
  return Math.round(value);
}

function assertFinite(name: string, value: number): void {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new OpenToBuyError(`${name} phải là số hữu hạn, nhận được: ${String(value)}`);
  }
}

/** Tồn cuối kỳ mục tiêu từ số tuần cung ứng: bán 1 tuần × số tuần muốn dự trữ. */
export function endingInventoryFromWeeks(
  forecastSales: number,
  targetWeeksOfSupply: number,
  weeksInPeriod: number
): number {
  if (weeksInPeriod <= 0) {
    throw new OpenToBuyError('weeksInPeriod phải > 0');
  }
  const salesPerWeek = forecastSales / weeksInPeriod;
  return roundVnd(salesPerWeek * targetWeeksOfSupply);
}

/** Số tuần cung ứng = tồn cuối / (doanh thu 1 tuần). Trả Infinity nếu không bán được gì. */
export function weeksOfSupply(
  endingInventoryRetail: number,
  forecastSales: number,
  weeksInPeriod: number
): number {
  if (forecastSales <= 0) return endingInventoryRetail > 0 ? Infinity : 0;
  const salesPerWeek = forecastSales / weeksInPeriod;
  return salesPerWeek > 0 ? endingInventoryRetail / salesPerWeek : Infinity;
}

/**
 * Tính OTB cho MỘT kỳ.
 *
 * Công thức: `OTB = bán + giảm giá + hao hụt + tồn cuối mục tiêu − tồn đầu − hàng đã đặt`
 *
 * OTB ÂM là hợp lệ và mang ý nghĩa: đã cam kết/mua VƯỢT kế hoạch → phải dừng mua,
 * đẩy hàng đi, hoặc tăng kế hoạch bán. Hàm KHÔNG tự kẹp về 0 (che giấu vấn đề).
 */
export function computeOpenToBuyPeriod(
  input: OpenToBuyPeriodInput,
  beginningInventoryRetail: number,
  markupRate = 0
): OpenToBuyLine {
  const {
    period,
    plannedMarkdown = 0,
    plannedShrinkage = 0,
    onOrderRetail = 0,
    weeksInPeriod = WEEKS_PER_MONTH,
    perishable = false,
  } = input;

  if (!period) throw new OpenToBuyError('period là bắt buộc');
  assertFinite('forecastSales', input.forecastSales);
  assertFinite('plannedMarkdown', plannedMarkdown);
  assertFinite('plannedShrinkage', plannedShrinkage);
  assertFinite('onOrderRetail', onOrderRetail);
  assertFinite('beginningInventoryRetail', beginningInventoryRetail);
  if (input.forecastSales < 0) throw new OpenToBuyError(`forecastSales không được âm (kỳ ${period})`);
  if (beginningInventoryRetail < 0) throw new OpenToBuyError(`Tồn đầu kỳ không được âm (kỳ ${period})`);
  if (weeksInPeriod <= 0) throw new OpenToBuyError(`weeksInPeriod phải > 0 (kỳ ${period})`);
  if (markupRate < 0 || markupRate >= 1) {
    throw new OpenToBuyError('plannedMarkupRate phải nằm trong [0, 1)');
  }

  // Tồn cuối kỳ mục tiêu: ưu tiên số tiền tường minh, nếu không thì suy từ số tuần cung ứng.
  let targetEnding: number;
  if (input.targetEndingInventoryRetail != null) {
    assertFinite('targetEndingInventoryRetail', input.targetEndingInventoryRetail);
    if (input.targetEndingInventoryRetail < 0) {
      throw new OpenToBuyError(`Tồn cuối kỳ mục tiêu không được âm (kỳ ${period})`);
    }
    targetEnding = roundVnd(input.targetEndingInventoryRetail);
  } else {
    const targetWeeks = input.targetWeeksOfSupply ?? 0;
    if (targetWeeks < 0) throw new OpenToBuyError(`targetWeeksOfSupply không được âm (kỳ ${period})`);
    targetEnding = endingInventoryFromWeeks(input.forecastSales, targetWeeks, weeksInPeriod);
  }

  const totalRequirement = roundVnd(input.forecastSales + plannedMarkdown + plannedShrinkage);
  const otbRetail = roundVnd(
    totalRequirement + targetEnding - roundVnd(beginningInventoryRetail) - roundVnd(onOrderRetail)
  );
  const otbCost = roundVnd(otbRetail * (1 - markupRate));

  const wos = weeksOfSupply(targetEnding, input.forecastSales, weeksInPeriod);
  const warnings: string[] = [];

  if (otbRetail < 0) {
    warnings.push(
      `OTB ÂM (${otbRetail.toLocaleString('vi-VN')}đ): đã cam kết/mua VƯỢT kế hoạch bán. ` +
        `Cần dừng mua mới, đẩy hàng tồn, hoặc tăng kế hoạch bán.`
    );
  }
  const maxWos = perishable ? PERISHABLE_MAX_WEEKS_OF_SUPPLY : DEFAULT_MAX_WEEKS_OF_SUPPLY;
  if (Number.isFinite(wos) && wos > maxWos) {
    warnings.push(
      `Tồn kho mục tiêu = ${wos.toFixed(1)} tuần cung ứng, vượt ngưỡng ${maxWos} tuần` +
        (perishable ? ' (hàng dễ hỏng — nguy cơ hư hỏng, phải ghi hao hụt)' : '') +
        '.'
    );
  }
  if (input.forecastSales > 0 && wos === 0) {
    warnings.push('Tồn cuối kỳ mục tiêu = 0 trong khi vẫn có kế hoạch bán → nguy cơ GÃY HÀNG.');
  }
  if (perishable && plannedShrinkage === 0 && input.forecastSales > 0) {
    warnings.push('Hàng dễ hỏng nhưng chưa tính hao hụt kế hoạch → kế hoạch mua sẽ THIẾU.');
  }

  return {
    period,
    beginningInventoryRetail: roundVnd(beginningInventoryRetail),
    forecastSales: roundVnd(input.forecastSales),
    plannedMarkdown: roundVnd(plannedMarkdown),
    plannedShrinkage: roundVnd(plannedShrinkage),
    onOrderRetail: roundVnd(onOrderRetail),
    targetEndingInventoryRetail: targetEnding,
    totalRequirementRetail: totalRequirement,
    otbRetail,
    otbCost,
    weeksOfSupply: wos,
    warnings,
  };
}

/**
 * 🔑 Ràng buộc TIỀN MẶT (đặc thù VComm): phân bổ ngân sách theo THỨ TỰ KỲ.
 *
 * Kỳ gần được ưu tiên lấy tiền trước (bán được hàng mới có tiền cho kỳ sau).
 * Phần không đủ tiền được ghi nhận là HOÃN (`deferredOtbCost`) chứ không cắt mất,
 * để người mua hàng thấy rõ "thiếu bao nhiêu, ở kỳ nào" mà quyết định.
 *
 * Chỉ xét các kỳ CẦN MUA (otbCost > 0). OTB âm/không mua không chiếm ngân sách.
 */
export function applyCashLimit(lines: OpenToBuyLine[], cashLimit: number): OpenToBuyLine[] {
  assertFinite('cashLimit', cashLimit);
  if (cashLimit < 0) throw new OpenToBuyError('cashLimit không được âm');

  let remaining = roundVnd(cashLimit);
  return lines.map((line) => {
    const need = Math.max(0, line.otbCost);
    const granted = Math.min(need, Math.max(0, remaining));
    remaining = roundVnd(remaining - granted);
    return {
      ...line,
      affordableOtbCost: granted,
      deferredOtbCost: roundVnd(need - granted),
    };
  });
}

/**
 * Dựng kế hoạch OTB nhiều kỳ. Tồn cuối kỳ trước TỰ ĐỘNG trở thành tồn đầu kỳ sau
 * (đây là điểm hay của OTB: kế hoạch mua tháng này quyết định tồn đầu tháng sau).
 */
export function buildOpenToBuyPlan(input: OpenToBuyPlanInput): OpenToBuyPlan {
  if (!Array.isArray(input.periods) || input.periods.length === 0) {
    throw new OpenToBuyError('Kế hoạch phải có ít nhất 1 kỳ');
  }
  assertFinite('openingInventoryRetail', input.openingInventoryRetail);
  if (input.openingInventoryRetail < 0) throw new OpenToBuyError('Tồn đầu kỳ không được âm');

  const markupRate = input.plannedMarkupRate ?? 0;
  const warnings: string[] = [];

  let opening = roundVnd(input.openingInventoryRetail);
  const lines: OpenToBuyLine[] = input.periods.map((p) => {
    const line = computeOpenToBuyPeriod(p, opening, markupRate);
    opening = line.targetEndingInventoryRetail; // nối sang kỳ sau
    return line;
  });

  if (input.cashLimit != null) {
    lines.splice(0, lines.length, ...applyCashLimit(lines, input.cashLimit));
    const deferred = lines.reduce((s, l) => s + (l.deferredOtbCost ?? 0), 0);
    if (deferred > 0) {
      warnings.push(
        `Thiếu ${deferred.toLocaleString('vi-VN')}đ tiền mặt để thực hiện trọn kế hoạch mua. ` +
          `Phần thiếu đã bị HOÃN (xem cột deferredOtbCost) — ưu tiên kỳ gần nhất.`
      );
    }
  }

  const uniqueWarnings = new Set<string>();
  lines.forEach((l) => l.warnings.forEach((w) => uniqueWarnings.add(`[${l.period}] ${w}`)));
  const dates = lines.map((l) => l.period);
  if (new Set(dates).size !== dates.length) {
    warnings.push('Kế hoạch có kỳ BỊ TRÙNG — kiểm tra lại dữ liệu đầu vào.');
  }

  return {
    lines,
    totals: {
      forecastSales: lines.reduce((s, l) => s + l.forecastSales, 0),
      plannedMarkdown: lines.reduce((s, l) => s + l.plannedMarkdown, 0),
      plannedShrinkage: lines.reduce((s, l) => s + l.plannedShrinkage, 0),
      otbRetail: lines.reduce((s, l) => s + l.otbRetail, 0),
      otbCost: lines.reduce((s, l) => s + l.otbCost, 0),
      affordableOtbCost: input.cashLimit == null
        ? lines.reduce((s, l) => s + l.otbCost, 0)
        : lines.reduce((s, l) => s + (l.affordableOtbCost ?? 0), 0),
      deferredOtbCost: lines.reduce((s, l) => s + (l.deferredOtbCost ?? 0), 0),
    },
    warnings: [...warnings, ...uniqueWarnings],
  };
}
