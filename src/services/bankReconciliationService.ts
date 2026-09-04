/**
 * ============================================================================
 *  bankReconciliationService.ts — GĐ 2.2: Đối chiếu ngân hàng (N–M)
 * ============================================================================
 *
 *  Lỗ hổng (spec 023 §4): VComm có `codReconciliationService` (đối soát COD theo
 *  mã vận đơn, 1–1) nhưng **KHÔNG có đối chiếu ngân hàng**. Hậu quả:
 *    · Tiền vào tài khoản (Sepay/QR) không ai so với sổ cái → không biết khoản
 *      nào đã thu, khoản nào còn treo, khoản nào thu thừa/thiếu
 *    · Không phát hiện được bút toán ghi sổ mà TIỀN CHƯA VỀ (rủi ro gian lận)
 *    · Không phát hiện được tiền vào mà SỔ CHƯA GHI (bỏ sót doanh thu)
 *
 *  Khác gì đối soát COD?
 *    COD: 1 mã vận đơn ↔ 1 đơn hàng, khớp chính xác.
 *    Ngân hàng: **N–M**. Một lần chuyển khoản có thể gộp nhiều đơn
 *    (`allowManyToOne`), một đơn có thể bị trừ phí chuyển khoản (`tolerance`).
 *
 *  Thuật toán — 3 lượt, ưu tiên độ tin cậy GIẢM DẦN, kết quả ỔN ĐỊNH
 *  (cùng đầu vào luôn ra cùng kết quả, không phụ thuộc thứ tự mảng):
 *    ① **exact_ref**  — mã tham chiếu trong nội dung CK khớp chứng từ sổ cái
 *    ② **amount_date**— cùng số tiền (sai số ≤ tolerance) và lệch ngày ≤ maxDateSkewDays
 *    ③ **grouped**    — gộp nhiều dòng sổ cái = 1 dòng sao kê (hạn chế maxGroupSize)
 *
 *  ⚠️ NGUYÊN TẮC: module THUẦN, không đụng DB, không tự động ghi sổ.
 *     Nó chỉ ĐỀ XUẤT cặp khớp kèm độ tin cậy; kế toán DUYỆT rồi mới hạch toán
 *     (TT99 Điều 12 ghi kép + Điều 28 lưu vết). Khớp `grouped` luôn phải soát tay.
 * ============================================================================
 */

export class BankReconciliationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BankReconciliationError';
  }
}

/** Quy ước DẤU cho cả 2 phía: dương = TIỀN VÀO, âm = TIỀN RA. */
export interface BankStatementLine {
  id: string;
  /** Ngày giao dịch (ISO date/date-time). */
  date: string;
  /** Dương = tiền vào, âm = tiền ra. */
  amount: number;
  /** Mã tham chiếu / nội dung chuyển khoản (VD: "VCM ORD-2026-001"). */
  refCode?: string | null;
  description?: string | null;
}

export interface LedgerLine {
  id: string;
  date: string;
  /** Cùng quy ước dấu với sao kê. */
  amount: number;
  refCode?: string | null;
  description?: string | null;
}

export interface ReconciliationOptions {
  /** Sai số cho phép (đ) — để hấp thụ PHÍ CHUYỂN KHOẢN. Mặc định 0. */
  tolerance?: number;
  /** Lệch ngày tối đa giữa sao kê và sổ cái. Mặc định 3 ngày. */
  maxDateSkewDays?: number;
  /** Cho phép ghép NHIỀU dòng sổ cái vào 1 dòng sao kê. Mặc định true. */
  allowManyToOne?: boolean;
  /** Số dòng tối đa khi gộp (chống nổ tổ hợp). Mặc định 20. */
  maxGroupSize?: number;
}

export type MatchConfidence = 'exact_ref' | 'amount_date' | 'grouped';

export interface ReconciliationMatch {
  bankLineIds: string[];
  ledgerLineIds: string[];
  bankAmount: number;
  ledgerAmount: number;
  /** bankAmount − ledgerAmount. Trong tolerance = chấp nhận (thường là phí CK). */
  difference: number;
  confidence: MatchConfidence;
  /** Giải thích vì sao khớp — để kế toán soát (TT99 Điều 28 lưu vết). */
  note: string;
}

export interface ReconciliationResult {
  matches: ReconciliationMatch[];
  /** ⚠️ Tiền vào/ra trên sao kê mà KHÔNG tìm thấy chứng từ → cần điều tra ngay. */
  unmatchedBank: BankStatementLine[];
  /** ⚠️ Đã ghi sổ nhưng CHƯA THẤY TIỀN → rủi ro gian lận / thu hồi. */
  unmatchedLedger: LedgerLine[];
  summary: {
    bankLineCount: number;
    ledgerLineCount: number;
    matchedBankCount: number;
    matchedLedgerCount: number;
    unmatchedBankCount: number;
    unmatchedLedgerCount: number;
    bankTotal: number;
    ledgerTotal: number;
    /** Tổng sai lệch của CÁC CẶP ĐÃ KHỚP (thường = tổng phí chuyển khoản). */
    matchedDifference: number;
    /** Chênh lệch chung = bankTotal − ledgerTotal. Khác 0 → còn việc phải làm. */
    netDifference: number;
  };
  warnings: string[];
}

/* -------------------------------------------------------------------------- */
/*  Hàm thuần                                                                  */
/* -------------------------------------------------------------------------- */

/** Làm tròn về đồng. */
function roundVnd(v: number): number {
  return Math.round(v);
}

function parseTime(date: string): number {
  const t = new Date(date).getTime();
  if (Number.isNaN(t)) throw new BankReconciliationError(`Ngày không hợp lệ: ${String(date)}`);
  return t;
}

function dayDiff(a: string, b: string): number {
  return Math.abs(parseTime(a) - parseTime(b)) / 86_400_000;
}

/**
 * Chuẩn hoá mã tham chiếu: VIẾT HOA, bỏ ký tự không phải chữ/số.
 * "vcm ord-2026-001" → "VCMORD2026001"
 */
export function normalizeRef(value: string | null | undefined): string {
  return (value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Tách token từ nội dung chuyển khoản, giữ token có ít nhất `minLength` ký tự.
 * Dùng để tìm mã đơn hàng nằm LẪN trong nội dung (VD "THANH TOAN ORD-2026-001").
 *
 * ⚠️ CHỈ tách theo KHOẢNG TRẮNG / dấu phân cách, rồi mới bỏ dấu câu BÊN TRONG
 *    token. Nếu tách luôn theo dấu gạch ngang thì "ORD-2026-001" vỡ thành
 *    "ORD" (3) · "2026" (4) · "001" (3) → hai mảnh bị lọc mất, còn lại toàn
 *    rác → **mất luôn mã đơn**, cái mà hàm này sinh ra để tìm.
 *    Giữ nguyên token → "ORD2026001" (10 ký tự) sống sót qua bộ lọc.
 */
export function extractRefTokens(value: string | null | undefined, minLength = 4): string[] {
  return (value ?? '')
    .toUpperCase()
    .split(/[\s\u00A0,;|]+/)
    .map((t) => t.replace(/[^A-Z0-9]/g, ''))
    .filter((t) => t.length >= minLength);
}

/**
 * Độ dài tối thiểu của "kim" khi soi chuỗi. Mã 1–3 ký tự (VD "1", "AB") sẽ khớp
 * gần như mọi nội dung → sinh vô số CẶP KHỚP GIẢ. Thà bỏ qua, để lượt ②
 * (số tiền + ngày) xử lý còn hơn đối chiếu sai.
 */
const MIN_REF_LENGTH = 4;

/**
 * ⭐ Tìm mã chứng từ của sổ cái nằm TRONG nội dung sao kê.
 *   Sổ cái: `ORD-2026-001`  ·  Sao kê: "THANH TOAN DON HANG ORD2026001 SEPAY"
 *   → "ORD2026001" xuất hiện ở cả hai → khớp.
 *
 * ⚠️ Xét CẢ HAI CHIỀU, độc lập với nhau:
 *   ① mã chứng từ sổ cái nằm trong nội dung sao kê (thường gặp)
 *   ② mã giao dịch ngân hàng nằm trong mô tả sổ cái — kế toán gõ tay
 *      "chuyển khoản FT26091XYZ" vào diễn giải, còn `refCode` sổ cái để trống.
 *   Không được `return false` sớm khi một chiều thiếu dữ liệu: chiều kia vẫn
 *   có thể đủ. (Lỗi cũ: guard `if (!ledgerRef) return false` đứng đầu làm
 *   nhánh ② không bao giờ chạy được.)
 */
export function refMatches(
  bankLine: Pick<BankStatementLine, 'refCode' | 'description'>,
  ledgerLine: Pick<LedgerLine, 'refCode' | 'description'>
): boolean {
  const bankRef = normalizeRef(bankLine.refCode);
  const ledgerRef = normalizeRef(ledgerLine.refCode);

  const bankText = bankRef + normalizeRef(bankLine.description);
  const ledgerText = ledgerRef + normalizeRef(ledgerLine.description);

  // Chẳng có gì để soi ở cả hai phía → không phải "khớp", chỉ là thiếu dữ liệu.
  if (!bankText || !ledgerText) return false;

  // ① mã chứng từ sổ cái nằm trong nội dung sao kê
  if (ledgerRef.length >= MIN_REF_LENGTH && bankText.includes(ledgerRef)) return true;

  // ② mã giao dịch ngân hàng nằm trong nội dung sổ cái (chiều ngược)
  if (bankRef.length >= MIN_REF_LENGTH && ledgerText.includes(bankRef)) return true;

  return false;
}

/**
 * Tìm một TỔ HỢP dòng sổ cái có tổng xấp xỉ `target`.
 * DFS có giới hạn độ sâu + sắp xếp theo |amount| giảm dần để ưu tiên ghép ít dòng
 * nhất trước (gộp 2 dòng luôn "đẹp" hơn gộp 7 dòng).
 *
 * @returns mảng dòng tìm được, hoặc null nếu không có tổ hợp nào.
 */
export function findAmountGroup(
  target: number,
  candidates: LedgerLine[],
  maxGroupSize: number,
  tolerance: number
): LedgerLine[] | null {
  if (candidates.length === 0) return null;

  // Chỉ ghép các dòng CÙNG DẤU với target — trái dấu thì triệt tiêu nhau, vô nghĩa.
  const signed = candidates
    .filter((c) => (target >= 0 ? c.amount > 0 : c.amount < 0))
    .slice()
    .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount) || (a.id < b.id ? -1 : 1));

  const sizeCap = Math.min(maxGroupSize, signed.length);
  const chosen: LedgerLine[] = [];

  const dfs = (startIdx: number, sum: number): boolean => {
    if (Math.abs(sum - target) <= tolerance) return true;
    // Cắt tỉa: đã vượt quá target + tolerance thì không thêm được nữa (cùng dấu)
    if (Math.abs(sum) > Math.abs(target) + tolerance) return false;
    if (chosen.length >= sizeCap) return false;

    for (let i = startIdx; i < signed.length; i++) {
      chosen.push(signed[i]);
      if (dfs(i + 1, roundVnd(sum + signed[i].amount))) return true;
      chosen.pop();
    }
    return false;
  };

  return dfs(0, 0) ? [...chosen] : null;
}

/* -------------------------------------------------------------------------- */
/*  Engine chính                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Đối chiếu sao kê ngân hàng với sổ cái.
 *
 * @throws BankReconciliationError nếu dữ liệu đầu vào rác (thiếu id, ngày sai, amount NaN).
 */
export function reconcileBankStatement(
  bankLines: BankStatementLine[],
  ledgerLines: LedgerLine[],
  opts: ReconciliationOptions = {}
): ReconciliationResult {
  const tolerance = Math.max(0, opts.tolerance ?? 0);
  const maxDateSkewDays = Math.max(0, opts.maxDateSkewDays ?? 3);
  const allowManyToOne = opts.allowManyToOne ?? true;
  const maxGroupSize = Math.max(1, opts.maxGroupSize ?? 20);

  // --- Validate (fail loud, không để dữ liệu rác sinh kết quả sai) ---
  [...bankLines, ...ledgerLines].forEach((l) => {
    if (!l?.id) throw new BankReconciliationError('Mọi dòng phải có id');
    if (!Number.isFinite(l.amount)) {
      throw new BankReconciliationError(`amount không hợp lệ ở dòng ${String(l?.id)}: ${String(l?.amount)}`);
    }
    parseTime(l.date); // ném nếu ngày rác
  });

  // Sắp xếp ổn định theo id → kết quả không phụ thuộc thứ tự truyền vào.
  const bank = [...bankLines].sort((a, b) => (a.id < b.id ? -1 : 1));
  const ledger = [...ledgerLines].sort((a, b) => (a.id < b.id ? -1 : 1));

  const usedBank = new Set<string>();
  const usedLedger = new Set<string>();
  const matches: ReconciliationMatch[] = [];

  const freeLedger = () => ledger.filter((l) => !usedLedger.has(l.id));

  /* Lượt ① — khớp theo MÃ THAM CHIẾU (tin cậy nhất) */
  for (const b of bank) {
    if (usedBank.has(b.id)) continue;
    const candidates = freeLedger()
      .filter((l) => refMatches(b, l) && Math.abs(l.amount - b.amount) <= tolerance)
      // Ưu tiên lệch ngày nhỏ nhất, rồi lệch tiền nhỏ nhất, rồi id (ổn định)
      .sort(
        (x, y) =>
          dayDiff(b.date, x.date) - dayDiff(b.date, y.date) ||
          Math.abs(x.amount - b.amount) - Math.abs(y.amount - b.amount) ||
          (x.id < y.id ? -1 : 1)
      );

    const pick = candidates[0];
    if (!pick) continue;

    usedBank.add(b.id);
    usedLedger.add(pick.id);
    matches.push({
      bankLineIds: [b.id],
      ledgerLineIds: [pick.id],
      bankAmount: roundVnd(b.amount),
      ledgerAmount: roundVnd(pick.amount),
      difference: roundVnd(b.amount - pick.amount),
      confidence: 'exact_ref',
      note: `Khớp mã tham chiếu "${normalizeRef(pick.refCode)}" trong nội dung sao kê.`,
    });
  }

  /* Lượt ② — khớp theo SỐ TIỀN + CỬA SỔ NGÀY */
  for (const b of bank) {
    if (usedBank.has(b.id)) continue;
    const candidates = freeLedger()
      .filter((l) => Math.abs(l.amount - b.amount) <= tolerance && dayDiff(b.date, l.date) <= maxDateSkewDays)
      .sort(
        (x, y) =>
          dayDiff(b.date, x.date) - dayDiff(b.date, y.date) ||
          Math.abs(x.amount - b.amount) - Math.abs(y.amount - b.amount) ||
          (x.id < y.id ? -1 : 1)
      );

    const pick = candidates[0];
    if (!pick) continue;

    usedBank.add(b.id);
    usedLedger.add(pick.id);
    const diff = roundVnd(b.amount - pick.amount);
    matches.push({
      bankLineIds: [b.id],
      ledgerLineIds: [pick.id],
      bankAmount: roundVnd(b.amount),
      ledgerAmount: roundVnd(pick.amount),
      difference: diff,
      confidence: 'amount_date',
      note:
        diff === 0
          ? `Khớp số tiền và ngày (lệch ${dayDiff(b.date, pick.date).toFixed(1)} ngày).`
          : `Khớp số tiền lệch ${Math.abs(diff).toLocaleString('vi-VN')}đ (có thể là PHÍ CHUYỂN KHOẢN) — cần soát.`,
    });
  }

  /* Lượt ③ — GỘP NHIỀU dòng sổ cái vào 1 dòng sao kê (khách gộp nhiều đơn) */
  if (allowManyToOne) {
    for (const b of bank) {
      if (usedBank.has(b.id)) continue;
      const group = findAmountGroup(b.amount, freeLedger(), maxGroupSize, tolerance);
      if (!group || group.length < 2) continue; // <2 thì lượt ② đã xử lý

      group.forEach((g) => usedLedger.add(g.id));
      usedBank.add(b.id);
      const ledgerSum = group.reduce((s, g) => s + g.amount, 0);
      matches.push({
        bankLineIds: [b.id],
        ledgerLineIds: group.map((g) => g.id),
        bankAmount: roundVnd(b.amount),
        ledgerAmount: roundVnd(ledgerSum),
        difference: roundVnd(b.amount - ledgerSum),
        confidence: 'grouped',
        note: `Gộp ${group.length} chứng từ thành 1 lần chuyển khoản — ⚠️ BẮT BUỘC SOÁT TAY trước khi ghi sổ.`,
      });
    }
  }

  const unmatchedBank = bank.filter((b) => !usedBank.has(b.id));
  const unmatchedLedger = ledger.filter((l) => !usedLedger.has(l.id));

  // --- Cảnh báo ---
  const warnings: string[] = [];

  if (unmatchedLedger.length > 0) {
    const total = unmatchedLedger.reduce((s, l) => s + l.amount, 0);
    warnings.push(
      `${unmatchedLedger.length} bút toán ĐÃ GHI SỔ nhưng CHƯA THẤY TIỀN (${total.toLocaleString('vi-VN')}đ). ` +
        `Rủi ro: ghi nhận doanh thu khống / tiền chưa về / đối tác chưa chuyển.`
    );
  }
  if (unmatchedBank.length > 0) {
    const total = unmatchedBank.reduce((s, b) => s + b.amount, 0);
    warnings.push(
      `${unmatchedBank.length} giao dịch trên SAO KÊ chưa có chứng từ (${total.toLocaleString('vi-VN')}đ). ` +
        `Rủi ro: bỏ sót doanh thu / chuyển nhầm / cần tạo chứng từ.`
    );
  }

  // Giao dịch TRÙNG trên sao kê (cùng số tiền + cùng ngày, khác id) → nghi bị double-count
  const dupKeys = new Map<string, string[]>();
  bank.forEach((b) => {
    const key = `${b.date.slice(0, 10)}|${roundVnd(b.amount)}|${normalizeRef(b.refCode)}`;
    dupKeys.set(key, [...(dupKeys.get(key) ?? []), b.id]);
  });
  dupKeys.forEach((ids, key) => {
    if (ids.length > 1) {
      warnings.push(`Nghi TRÙNG giao dịch trên sao kê (${key}): ${ids.join(', ')}.`);
    }
  });

  const groupedCount = matches.filter((m) => m.confidence === 'grouped').length;
  if (groupedCount > 0) {
    warnings.push(`${groupedCount} cặp khớp dạng GỘP — tự động suy luận, phải kế toán duyệt từng cái.`);
  }

  const bankTotal = bank.reduce((s, b) => s + b.amount, 0);
  const ledgerTotal = ledger.reduce((s, l) => s + l.amount, 0);

  return {
    matches: matches.sort((a, b) => (a.ledgerLineIds[0] < b.ledgerLineIds[0] ? -1 : 1)),
    unmatchedBank,
    unmatchedLedger,
    summary: {
      bankLineCount: bank.length,
      ledgerLineCount: ledger.length,
      matchedBankCount: usedBank.size,
      matchedLedgerCount: usedLedger.size,
      unmatchedBankCount: unmatchedBank.length,
      unmatchedLedgerCount: unmatchedLedger.length,
      bankTotal: roundVnd(bankTotal),
      ledgerTotal: roundVnd(ledgerTotal),
      matchedDifference: roundVnd(matches.reduce((s, m) => s + m.difference, 0)),
      netDifference: roundVnd(bankTotal - ledgerTotal),
    },
    warnings,
  };
}
