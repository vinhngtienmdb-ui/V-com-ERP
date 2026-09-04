/**
 * ============================================================================
 *  fixedAssetService.ts — GĐ 2.1: engine trích khấu hao TSCĐ (TT99/2025 + TT45/2013)
 * ============================================================================
 *
 *  🔴 BỔ SUNG LỖ HỔNG NGHIỆP VỤ (phát hiện 02/09/2026, spec 021/024): VComm ĐÃ seed
 *  TK 211/212/213/214/241 theo TT99 NHƯNG CHƯA CÓ engine trích khấu hao. Ảnh hưởng
 *  trực tiếp VComm Hub (thiết bị POS, kệ) và DeviceLeasing → BCTC và khấu trừ thuế
 *  TNDN sai. Module này tính khấu hao THUẦN (không chạm DB) để dễ test và tái dùng.
 *
 *  Căn cứ luật (tham số NIÊN HẠN — xem note cuối file):
 *   - TT99/2025/TT-BTC Điều 28 (lưu vết) + hệ thống TK 211/214.
 *   - Thông tư 45/2013/TT-BTC (hướng dẫn khấu hao TSCĐ) — vẫn hiệu lực 2026 trừ khi
 *     có văn bản thay thế. Phương pháp chủ đạo = đường thẳng (straight-line);
 *     quyền chọn số dư giảm dần có giới hạn cho một số ngành.
 *   - Định mức thời gian sử dụng (useful life) theo Phụ lục 1 TT45/2013 — bảng dưới
 *     là TRÍCH YẾU các nhóm VComm dùng nhiều; CẦN rà lại nguyên văn trước khi áp dụng
 *     chính thức (như mọi tham số luật: có effectiveFrom, hàm nhận atDate).
 *
 *  Nguyên tắc ghi sổ (Điều 12 TT99, ghi kép):
 *    Nợ TK chi phí theo công dụng (627 SX chung / 642 QLDN / 641 bán hàng)
 *    Có 214  Hao mòn TSCĐ
 *  → Mỗi kỳ sinh 1 JournalEntryDraft khớp shape của accountingService (accountId/debit/credit).
 * ============================================================================
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type DepreciationMethod = 'straight_line' | 'declining_balance';
export type AssetUsage = 'admin' | 'production' | 'sales';

export interface FixedAsset {
  id: string;
  tenantId: string;
  name: string;
  /** Mã tài khoản nguyên giá: 211 (hữu hình) / 212 (thuê TC) / 213 (vô hình). */
  assetAccount: '211' | '212' | '213';
  /** Ngày đưa vào sử dụng (ISO yyyy-mm-dd). Bắt đầu trích từ tháng kế tiếp. */
  putIntoUseDate: string;
  /** Nguyên giá (VND). */
  cost: number;
  /** Giá trị còn lại dự kiến khi hết hạn (VND). Mặc định 0 (khấu hao hết). */
  residualValue?: number;
  /** Thời gian sử dụng (tháng). Nếu truyền → ghi đè usefulLifeMonths tính bởi loại. */
  usefulLifeMonths?: number;
  /** Phân loại để tra bản useful life (nếu không truyền usefulLifeMonths). */
  assetClass?: AssetClassCode;
  method?: DepreciationMethod;
  /** Công dụng → chọn TK Nợ chi phí. */
  usage?: AssetUsage;
  /** Ngày ngừng trích (ISO) — thanh lý/nhiều hóa. null = đang trích. */
  disposedDate?: string | null;
  /** Trạng thái (khớp cột `status` trong migration 001_fixed_assets.sql). */
  status?: 'in_use' | 'disposed' | 'idle';
}

export interface DepreciationLine {
  period: string; // yyyy-mm
  amount: number; // số khấu hao kỳ
  accumulated: number; // lũy kế đến hết kỳ
  remainingBookValue: number; // nguyên giá - lũy kế
}

export interface JournalEntryDraft {
  id: string;
  tenantId: string;
  date: string; // ngày cuối tháng trích
  ref: string;
  description: string;
  lines: Array<{ accountId: string; debit: number; credit: number; description?: string }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Tham số luật (NIÊN HẠN — rà lại hàng năm)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 🔴 Định mức thời gian sử dụng (tháng) — TRÍCH YẾU Phụ lục 1 TT45/2013.
 * Không đầy đủ; chỉ các nhóm VComm Hub / DeviceLeasing hay dùng. Trước khi áp dụng
 * chính thức phải đối chiếu nguyên văn Phụ lục 1 (có thể có nhóm con cấp 2/3).
 * Nếu assetClass không có trong bảng → ném (bắt buộc khai rõ, không đoán).
 */
export const TSCĐ_USEFUL_LIFE_MONTHS: Record<string, number> = {
  // Nhóm 1: Nhà cửa, vật kiến trúc (trích theo tỷ lệ % trên nguyên giá)
  'NC.VP': 360, // nhà làm việc (tối thiểu 4% /năm → 25 năm)
  'NC.KHO': 240, // kho, bến bãi (tối thiểu 6% /năm → ~16,7 năm)
  // Nhóm 2: Máy móc, thiết bị
  'MM.POS': 60, // thiết bị POS, máy tính tiền (máy tính 3–5 năm → 36–60)
  'MM.MAYTINH': 48, // máy tính, server
  'MM.TBKHO': 120, // thiết bị kho (băng chuyền, fork)
  // Nhóm 3: Phương tiện vận tải, truyền dẫn
  'VT.XE': 96, // ô tô tải/van (8 năm)
  'VT.XEMAY': 60, // xe máy (5 năm)
  // Nhóm 4: Thiết bị, dụng cụ quản lý
  'TB.KE': 60, // kệ hàng, giá để hàng (5 năm)
  'TB.DUNGCU': 48, // dụng cụ đo, quản lý
  // Nhóm 5: TSCĐ vô hình
  'TS.PHANMEM': 60, // phần mềm (5 năm)
  'TS.BANGSANGCHE': 120, // quyền sở hữu trí tuệ (10 năm)
  // Nhóm 6: Cây lâu năm, súc vật làm việc/nuôi lấy sản phẩm → không áp dụng KH (đất, vô hình khác)
};

export type AssetClassCode = keyof typeof TSCĐ_USEFUL_LIFE_MONTHS;

/** TK Nợ chi phí theo công dụng (Điều 12 TT99). */
const USAGE_EXPENSE_ACCOUNT: Record<AssetUsage, string> = {
  production: '627', // Chi phí sản xuất chung
  admin: '642', // Chi phí quản lý doanh nghiệp
  sales: '641', // Chi phí bán hàng
};

const DEPRECIATION_ACCOUNT = '214'; // Hao mòn TSCĐ

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Parse yyyy-mm-dd → Date (UTC để không lệch múi giờ). */
function parseDate(iso: string): Date {
  const d = new Date(iso + 'T00:00:00Z');
  if (Number.isNaN(d.getTime())) throw new Error(`Ngày không hợp lệ: ${iso}`);
  return d;
}

/** yyyy-mm của tháng kế tiếp tháng đưa vào sử dụng. */
function firstDepreciationMonth(putIntoUseDate: string): { year: number; month: number } {
  const d = parseDate(putIntoUseDate);
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1; // 1–12
  return m === 12 ? { year: y + 1, month: 1 } : { year: y, month: m + 1 };
}

function monthDiff(a: { year: number; month: number }, b: { year: number; month: number }): number {
  return (b.year - a.year) * 12 + (b.month - a.month);
}

function fmtMonth(y: number, m: number): string {
  return `${y}-${String(m).padStart(2, '0')}`;
}

function endOfMonth(y: number, m: number): string {
  // ngày cuối tháng (không cần chính xác tới ngày, chỉ làm ref/date chứng từ)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core
// ─────────────────────────────────────────────────────────────────────────────

export interface ResolvedDepreciation {
  method: DepreciationMethod;
  baseCost: number; // cost - residual
  usefulLifeMonths: number;
  monthlyAmount: number; // đã làm tròn, nguyên tắc đường thẳng
  ratePerYear?: number; // declining_balance
}

/** Xác định tham số trích khấu hao (thời gian SD, phương pháp, số tiền/tháng). */
export function resolveDepreciation(asset: FixedAsset): ResolvedDepreciation {
  const residual = asset.residualValue ?? 0;
  const baseCost = round2(Math.max(0, asset.cost - residual));
  if (baseCost <= 0) {
    throw new Error(`TSCĐ ${asset.id}: nguyên giá phải lớn hơn giá trị còn lại.`);
  }

  let usefulLifeMonths = asset.usefulLifeMonths;
  if (!usefulLifeMonths) {
    if (!asset.assetClass) {
      throw new Error(
        `TSCĐ ${asset.id}: thiếu usefulLifeMonths và assetClass. Phải khai một trong hai ` +
        `(tra TSCĐ_USEFUL_LIFE_MONTHS hoặc truyền số tháng trực tiếp).`,
      );
    }
    const life = TSCĐ_USEFUL_LIFE_MONTHS[asset.assetClass];
    if (!life) {
      throw new Error(
        `TSCĐ ${asset.id}: assetClass '${asset.assetClass}' chưa có trong bảng định mức ` +
        `TSCĐ_USEFUL_LIFE_MONTHS. Bổ sung hoặc truyền usefulLifeMonths.`,
      );
    }
    usefulLifeMonths = life;
  }
  if (usefulLifeMonths <= 0) throw new Error(`TSCĐ ${asset.id}: thời gian sử dụng phải > 0.`);

  const method = asset.method ?? 'straight_line';
  if (method === 'straight_line') {
    // Làm tròn đến đồng; số dư cuối kỳ dồn vào kỳ cuối (xem generateSchedule).
    return { method, baseCost, usefulLifeMonths, monthlyAmount: round2(baseCost / usefulLifeMonths) };
  }
  // declining_balance: tỷ lệ 1.5–2.5× tỷ lệ đường thẳng (TT45 giới hạn). Mặc định 2×.
  const straightRate = 1 / usefulLifeMonths;
  const ratePerYear = (asset as any).decliningRatePerYear ?? 2 * straightRate * 12; // /năm
  // Số tiền/tháng ước tính (dùng cho dự toán; số thực tính từng kỳ trong schedule.
  return {
    method,
    baseCost,
    usefulLifeMonths,
    monthlyAmount: round2((baseCost * ratePerYear) / 12),
    ratePerYear,
  };
}

/**
 * Tính số khấu hao của MỘT kỳ (tháng) tại ngày `asOf` (yyyy-mm).
 * - Nếu trước tháng trích đầu → 0.
 * - Nếu sau tháng thanh lý (disposedDate) → 0.
 * - Đường thẳng: chia đều; số dư lẻ dồn vào kỳ cuối.
 * - Số dư giảm dần: tính trên giá trị còn lại đầu kỳ × tỷ lệ.
 */
export function computeMonthlyDepreciation(asset: FixedAsset, asOf: string): number {
  const { year: y, month: m } = { year: +asOf.slice(0, 4), month: +asOf.slice(5, 7) };
  const start = firstDepreciationMonth(asset.putIntoUseDate);
  const startIdx = monthDiff({ year: start.year, month: start.month }, { year: start.year, month: start.month }); // 0
  const asOfIdx = monthDiff(start, { year: y, month: m });
  if (asOfIdx < 0) return 0; // chưa đến kỳ trích đầu

  if (asset.disposedDate) {
    const dis = parseDate(asset.disposedDate);
    const disIdx = monthDiff(start, { year: dis.getUTCFullYear(), month: dis.getUTCMonth() + 1 });
    // Trích đến HẾT tháng thanh lý; ngừng từ tháng kế tiếp (quy ước VN: tháng phát sinh
    // thanh lý vẫn tính KH, tháng sau mới dừng).
    if (asOfIdx > disIdx) return 0;
  }

  const res = resolveDepreciation(asset);
  if (res.method === 'declining_balance') {
    // giá trị còn lại đầu kỳ = baseCost - (đã trích các kỳ trước)
    let book = res.baseCost;
    for (let i = 0; i < asOfIdx; i++) {
      const prev = monthlyDeclining(book, res);
      book = round2(book - prev);
    }
    return monthlyDeclining(book, res);
  }

  // straight_line: tổng = baseCost, mỗi kỳ monthlyAmount, kỳ cuối nhận phần dư.
  const totalPeriods = res.usefulLifeMonths;
  if (asOfIdx >= totalPeriods - 1) {
    // kỳ cuối (hoặc sau — phòng trường hợp dôi) → phần còn lại để về đúng baseCost
    const already = res.monthlyAmount * Math.min(asOfIdx, totalPeriods - 1);
    return round2(Math.max(0, res.baseCost - already));
  }
  return res.monthlyAmount;
}

function monthlyDeclining(bookValue: number, res: ResolvedDepreciation): number {
  const ratePerYear = res.ratePerYear ?? 2 * (1 / res.usefulLifeMonths) * 12;
  const amt = round2((bookValue * ratePerYear) / 12);
  return Math.min(amt, bookValue); // không vượt giá trị còn lại
}

/**
 * Sinh toàn bộ lịch trích khấu hao từ tháng đầu đến hết thời gian sử dụng
 * (hoặc đến tháng thanh lý). Đảm bảo lũy kế = baseCost (không thừa/thiếu do làm tròn).
 */
export function generateDepreciationSchedule(asset: FixedAsset): DepreciationLine[] {
  const res = resolveDepreciation(asset);
  const start = firstDepreciationMonth(asset.putIntoUseDate);
  const endIdx = asset.disposedDate
    ? Math.min(
        res.usefulLifeMonths,
        monthDiff(start, (() => {
          const d = parseDate(asset.disposedDate!);
          return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
        })()) + 1, // bao gồm cả tháng thanh lý
      )
    : res.usefulLifeMonths;

  const lines: DepreciationLine[] = [];
  let accumulated = 0;
  // Chỉ gom phần dư vào kỳ cuối khi trích ĐỦ tuổi thọ (không thanh lý sớm).
  const isFullLife = !asset.disposedDate || endIdx >= res.usefulLifeMonths;
  for (let i = 0; i < endIdx; i++) {
    const cur = { year: start.year, month: start.month };
    // tiến tháng
    cur.month += i;
    while (cur.month > 12) { cur.month -= 12; cur.year += 1; }
    const period = fmtMonth(cur.year, cur.month);
    let amount: number;
    if (res.method === 'declining_balance') {
      const book = round2(res.baseCost - accumulated);
      amount = monthlyDeclining(book, res);
    } else {
      // đường thẳng: kỳ cuối (và chỉ khi trích đủ tuổi thọ) gom phần dư làm tròn
      amount = isFullLife && i === endIdx - 1 ? round2(res.baseCost - accumulated) : res.monthlyAmount;
    }
    accumulated = round2(accumulated + amount);
    lines.push({
      period,
      amount,
      accumulated,
      remainingBookValue: round2(res.baseCost - accumulated),
    });
  }
  return lines;
}

/**
 * Sinh chứng từ ghi khấu hao MỘT kỳ (Điều 12 TT99):
 *   Nợ <TK chi phí theo usage> / Có 214 Hao mòn TSCĐ
 * Trả về JournalEntryDraft khớp shape của accountingService (accountId/debit/credit).
 * id cố định (không Date.now) → idempotent khi ghi lại (xem MEMORY: idempotency).
 */
export function buildDepreciationJournalEntry(
  asset: FixedAsset,
  asOf: string,
  tenantId?: string,
): JournalEntryDraft {
  const amount = computeMonthlyDepreciation(asset, asOf);
  if (amount <= 0) {
    throw new Error(`TSCĐ ${asset.id}: kỳ ${asOf} không có số khấu hao (chưa đến hạn hoặc đã thanh lý).`);
  }
  const usage = asset.usage ?? 'admin';
  const expenseAccount = USAGE_EXPENSE_ACCOUNT[usage];
  const y = +asOf.slice(0, 4);
  const m = +asOf.slice(5, 7);
  const date = endOfMonth(y, m);
  const id = `KH-${asset.id}-${asOf}`; // idempotent key
  const desc = `Trích khấu hao ${asset.name} kỳ ${asOf} (${usage})`;
  return {
    id,
    tenantId: tenantId ?? asset.tenantId,
    date,
    ref: id,
    description: desc,
    lines: [
      { accountId: expenseAccount, debit: amount, credit: 0, description: desc },
      { accountId: DEPRECIATION_ACCOUNT, debit: 0, credit: amount, description: `Hao mòn ${asset.name}` },
    ],
  };
}

/** Tổng khấu hao lũy kế đến hết kỳ `asOf` (dùng đối soát, không ghi sổ). */
export function accumulatedDepreciationTo(asset: FixedAsset, asOf: string): number {
  let acc = 0;
  const { year: y, month: m } = { year: +asOf.slice(0, 4), month: +asOf.slice(5, 7) };
  const start = firstDepreciationMonth(asset.putIntoUseDate);
  const periods = monthDiff(start, { year: y, month: m }) + 1;
  for (let i = 0; i < periods; i++) {
    acc = round2(acc + computeMonthlyDepreciation(asset, adjMonth(start, i)));
  }
  return acc;
}

function adjMonth(start: { year: number; month: number }, i: number): string {
  let yy = start.year;
  let mm = start.month + i;
  while (mm > 12) { mm -= 12; yy += 1; }
  return fmtMonth(yy, mm);
}
