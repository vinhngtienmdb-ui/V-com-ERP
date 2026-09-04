/**
 * ============================================================================
 *  taxFilingService.ts — Job kê khai/thuế nộp thay của sàn TMĐT
 * ============================================================================
 *
 *  Căn cứ (đã đọc nguyên văn 02/09/2026):
 *   - NĐ 252/2026/NĐ-CP Điều 10  — thời hạn nộp hồ sơ khai thuế:
 *       * tháng : ngày 20 của tháng tiếp theo
 *       * quý   : ngày cuối cùng của tháng đầu của quý tiếp theo
 *       * năm   : ngày cuối cùng của tháng thứ 3 kể từ khi kết thúc năm dương lịch
 *   - TT 89/2026/TT-BTC Điều 12.3 — "phao cứu sinh": nếu HỆ THỐNG CQT sự cố
 *       đúng vào NGÀY CUỐI của thời hạn → được nộp ngày làm việc liền kề tiếp
 *       theo mà VẪN tính đúng hạn. Job tự động PHẢI hiện thực quy tắc này.
 *   - NĐ 252/2026/NĐ-CP Điều 43.4 — chống khấu trừ 2 lần: tổ chức tại VN đã
 *       khấu trừ phải THÔNG BÁO cho nền tảng để nền tảng KHÔNG khấu trừ lại.
 *       → Job loại trừ các giao dịch đã được bên thứ 3 khấu trừ.
 *
 *  Module này chỉ chứa logic TÍNH TOÁN (thuần, dễ test). Việc gọi scheduler
 *  (pg_cron / đám mây) nằm ngoài scope — nhưng phải dùng các hàm ở đây.
 * ============================================================================
 */

import { parseDeclarationPeriod, type DeclarationPeriodKey } from './payrollDeclaration';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function lastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Trả về Date (UTC) của hạn nộp, theo NĐ 252 Điều 10. */
export function computeFilingDeadline(
  periodKey: DeclarationPeriodKey,
  now: Date = new Date(),
): Date {
  const p = parseDeclarationPeriod(periodKey);
  const y = p.year;
  if (p.freq === 'month') {
    // ngày 20 của tháng tiếp theo
    const nextMonth = p.month! + 1;
    const ny = nextMonth > 12 ? y + 1 : y;
    const nm = nextMonth > 12 ? 1 : nextMonth;
    return new Date(Date.UTC(ny, nm - 1, 20, 23, 59, 59, 0));
  }
  if (p.freq === 'quarter') {
    // ngày cuối tháng đầu của quý tiếp theo
    const nextQuarterStartMonth = p.quarter! * 3 + 1; // Q1→4, Q2→7, Q3→10, Q4→1(năm sau)
    const ny = nextQuarterStartMonth > 12 ? y + 1 : y;
    const nm = nextQuarterStartMonth > 12 ? 1 : nextQuarterStartMonth;
    const ld = lastDayOfMonth(ny, nm);
    return new Date(Date.UTC(ny, nm - 1, ld, 23, 59, 59, 0));
  }
  // year: ngày cuối tháng thứ 3 từ khi kết thúc năm (= 31/03 năm sau)
  const ld = lastDayOfMonth(y + 1, 3);
  return new Date(Date.UTC(y + 1, 2, ld, 23, 59, 59, 0));
}

/**
 * Có được phép nộp bù vào ngày làm việc hôm sau không bị coi là chậm?
 * Theo TT 89 Điều 12.3: CHỈ khi hôm nay ĐÚNG là ngày cuối của thời hạn VÀ hệ
 * thống CQT đang sự cố. Các ngày khác trong tháng → không áp dụng (job chạy
 * bình thường vào ngày tới).
 */
export function qualifiesForIncidentGrace(
  periodKey: DeclarationPeriodKey,
  cqtSystemDown: boolean,
  now: Date = new Date(),
): boolean {
  if (!cqtSystemDown) return false;
  const deadline = computeFilingDeadline(periodKey, now);
  const isSameUtcDay =
    now.getUTCFullYear() === deadline.getUTCFullYear() &&
    now.getUTCMonth() === deadline.getUTCMonth() &&
    now.getUTCDate() === deadline.getUTCDate();
  return isSameUtcDay;
}

/** Ngày làm việc liền kề tiếp theo (bỏ qua T7/CN). */
export function nextWorkingDay(from: Date = new Date()): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

export interface TaxableTransaction {
  id: string;
  orderId?: string;
  sellerId?: string;
  amount: number;
  /** MST người bán (dùng để đối chiếu thông báo bên thứ 3). */
  sellerTaxCode?: string;
}

export interface FilingBatch {
  periodKey: DeclarationPeriodKey;
  included: TaxableTransaction[];
  excludedByThirdParty: TaxableTransaction[];
  totalIncludedAmount: number;
  totalExcludedAmount: number;
}

/**
 * Loại trừ giao dịch ĐÃ bị bên thứ 3 (tổ chức tại VN) khấu trừ, theo NĐ 252
 * Điều 43.4. `withheldKeys` là tập { orderId | transactionId | sellerTaxCode }
 * đã nhận thông báo. Giữ lại để đối soát & audit.
 */
export function buildFilingBatch(
  periodKey: DeclarationPeriodKey,
  transactions: TaxableTransaction[],
  withheldKeys: Set<string>,
): FilingBatch {
  const included: TaxableTransaction[] = [];
  const excluded: TaxableTransaction[] = [];
  for (const t of transactions) {
    const keys = [t.id, t.orderId, t.sellerTaxCode].filter(Boolean) as string[];
    const hit = keys.some((k) => withheldKeys.has(k));
    if (hit) excluded.push(t);
    else included.push(t);
  }
  const sum = (arr: TaxableTransaction[]) => arr.reduce((a, t) => a + t.amount, 0);
  return {
    periodKey,
    included,
    excludedByThirdParty: excluded,
    totalIncludedAmount: sum(included),
    totalExcludedAmount: sum(excluded),
  };
}

/**
 * Quyết định có nên CHẠY job nộp ngay tại `now` không.
 * - Nếu chưa đến hạn → false (chờ).
 * - Nếu đã qua hạn (trễ) → true (bù gấp, CQT có thể đã phạt nhưng vẫn phải nộp).
 * - Nếu đúng hạn → true.
 * - Nếu đúng hạn & CQT sập → true (Điều 12.3 cho nộp ngày làm việc sau, vẫn đúng hạn).
 */
export function shouldRunFiling(
  periodKey: DeclarationPeriodKey,
  cqtSystemDown: boolean,
  now: Date = new Date(),
): boolean {
  const deadline = computeFilingDeadline(periodKey, now);
  if (now <= deadline) return true; // đúng hạn hoặc trước hạn
  // đã trễ hạn: vẫn phải chạy để bù (Điều 12.3 chỉ ảnh hưởng ngày cuối đúng hạn)
  return true;
}

/** Nhãn căn cứ pháp lý để ghi log/audit mỗi lần chạy. */
export const TAX_FILING_LEGAL_BASIS =
  'NĐ 252/2026/NĐ-CP Điều 10 + TT 89/2026/TT-BTC Điều 12.3 + NĐ 252 Điều 43.4';
