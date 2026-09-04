/**
 * legalBasis.ts — Single source of truth cho mọi căn cứ pháp lý của VComm ERP.
 *
 * ⚠️ LỊCH SỬ: dự án này đã 5 lần viện dẫn văn bản HẾT HIỆU LỰC (TT 78/2021 → TT 32/2025
 * → TT 91/2026; NĐ 123/2020 → NĐ 254/2026; NĐ 72/2025 bị nhầm thành căn cứ giảm thuế
 * dù thực chất là nghị định về giá bán lẻ điện). Gốc rễ không phải lười cập nhật, mà là
 * KHÔNG CÓ CƠ CHẾ KIỂM TRA. File này + legalBasis.test.ts là cơ chế đó.
 *
 * QUY TẮC:
 * 1. Mọi module PHẢI import citation từ đây thay vì hardcode chuỗi "TT xx/yyyy" trong code.
 * 2. Khi một văn bản hết hiệu lực, cập nhật `effectiveTo` hoặc chuyển vào `replaced`.
 * 3. Test (legalBasis.test.ts) tự động FAIL khi:
 *    - một văn bản đang dùng đã qua ngày effectiveTo (không còn hiệu lực)
 *    - một văn bản bị thay thế (nằm trong `replaced`) vẫn được dùng làm bản hiện hành
 *    - code viện dẫn NĐ 72/2025 làm căn cứ giảm thuế GTGT (sai văn bản)
 *
 * Cập nhật lần cuối: 2026-09-02 (đợt hiệu lực 01/7/2026: TT 91/2026, NĐ 254/2026, NĐ 252/2026,
 * TT 89/2026, TT 69/2025, TT 99/2025). Xem specs/029 + specs/030.
 */

export interface LegalBasisEntry {
  code: string;
  name: string;
  effectiveFrom: string; // ISO date
  effectiveTo?: string; // ISO date – undefined = vô hạn
  replaced?: string[]; // văn bản đã bị văn bản này thay thế
  notes?: string;
  rate?: number; // chỉ cho giảm thuế (vatReduction)
}

export const LEGAL_BASIS: Record<string, LegalBasisEntry> = {
  /** Hóa đơn điện tử — văn bản thi hành hiện hành */
  einvoice: {
    code: 'TT 91/2026/TT-BTC',
    name: 'Hóa đơn điện tử, chứng từ điện tử (thay TT 32/2025, TT 78/2021)',
    effectiveFrom: '2026-07-01',
    replaced: ['TT 32/2025/TT-BTC', 'TT 78/2021/TT-BTC'],
    notes: 'Phụ lục I: ký tự thứ 4 có 10 chữ [T D L M N B G H X F]; ký hiệu mẫu 7 = HĐ TMĐT.',
  },
  /** Nghị định gốc về HĐĐT / chứng từ điện tử */
  einvoiceDecree: {
    code: 'NĐ 254/2026/NĐ-CP',
    name: 'Hướng dẫn Luật QLT 2025 + HĐĐT, chứng từ điện tử (thay NĐ 123/2020)',
    effectiveFrom: '2026-07-01',
    replaced: ['NĐ 123/2020/NĐ-CP'],
    notes: 'Điều 6.1.c bắt buộc HĐĐT máy tính tiền nhưng có khoảng trừ; Điều 14 xử lý sự cố.',
  },
  /** Giảm 2% thuế GTGT (10% → 8%) — căn cứ ĐÚNG là NĐ 174/2025, KHÔNG phải NĐ 72/2025 */
  vatReduction: {
    code: 'NĐ 174/2025/NĐ-CP',
    name: 'Giảm 2% thuế GTGT (8% thay vì 10%) đến 31/12/2026',
    effectiveFrom: '2025-07-01',
    effectiveTo: '2026-12-31',
    rate: 0.08,
    notes: 'KHÔNG dùng NĐ 72/2025 (đó là nghị định về giá bán lẻ điện). Theo NQ 204/2025/QH15 17/6/2025.',
  },
  /** Nghĩa vụ sàn TMĐT / quản lý thuế — văn bản gốc */
  platformTax: {
    code: 'NĐ 252/2026/NĐ-CP',
    name: 'Quản lý thuế (thay NĐ 126/2020, 91/2022, 49/2025, 117/2025, 373/2025)',
    effectiveFrom: '2026-07-01',
    replaced: ['NĐ 126/2020/NĐ-CP', 'NĐ 91/2022/NĐ-CP', 'NĐ 49/2025/NĐ-CP', 'NĐ 117/2025/NĐ-CP', 'NĐ 373/2025/NĐ-CP'],
    notes: 'Điều 10 hạn nộp: tháng ngày 20; quý cuối tháng đầu quý sau; Điều 43.4 chống khấu trừ 2 lần.',
  },
  /** Thông tư quản lý thuế */
  platformTaxCircular: {
    code: 'TT 89/2026/TT-BTC',
    name: 'Quản lý thuế (thay TT 80/2021)',
    effectiveFrom: '2026-07-01',
    replaced: ['TT 80/2021/TT-BTC'],
    notes: 'Điều 22 bãi bỏ kê khai TNCN theo tháng cho tiền lương → quý + quyết toán năm.',
  },
  /** Chế độ kế toán doanh nghiệp */
  accounting: {
    code: 'TT 99/2025/TT-BTC',
    name: 'Chế độ kế toán doanh nghiệp (thay TT 200/2014)',
    effectiveFrom: '2026-01-01',
    replaced: ['TT 200/2014/TT-BTC'],
  },
  /** Hướng dẫn Luật Thuế GTGT */
  vatLaw: {
    code: 'TT 69/2025/TT-BTC',
    name: 'Hướng dẫn Luật Thuế GTGT (thay TT 219/2013)',
    effectiveFrom: '2025-07-01',
    replaced: ['TT 219/2013/TT-BTC'],
  },
};

export type LegalBasisKey = keyof typeof LEGAL_BASIS;

/** Trả về true nếu văn bản còn hiệu lực tại thời điểm `at` (mặc định: hiện tại). */
export function isBasisInForce(key: LegalBasisKey, at: Date = new Date()): boolean {
  const b = LEGAL_BASIS[key];
  if (at < new Date(b.effectiveFrom)) return false;
  if (b.effectiveTo && at > new Date(b.effectiveTo)) return false;
  return true;
}

/**
 * Ném lỗi nếu văn bản không còn hiệu lực tại `at`. Dùng ở bootstrap (server.ts) để hệ thống
 * từ chối khởi động trên căn cứ hết hạn — thay vì chạy sai âm thầm.
 */
export function assertBasisInForce(key: LegalBasisKey, at: Date = new Date()): void {
  if (!isBasisInForce(key, at)) {
    const b = LEGAL_BASIS[key];
    const until = b.effectiveTo ? ` (hiệu lực đến ${b.effectiveTo})` : '';
    throw new Error(
      `[legalBasis] ${b.code} không còn hiệu lực tại ${at.toISOString().slice(0, 10)}${until}. ` +
        `Cập nhật LEGAL_BASIS trong src/config/legalBasis.ts trước khi chạy.`,
    );
  }
}

/** Trả về bản ghi đầy đủ cho một domain. */
export function getBasis(key: LegalBasisKey): LegalBasisEntry {
  return LEGAL_BASIS[key];
}
