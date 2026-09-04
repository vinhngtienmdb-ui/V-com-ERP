/**
 * ============================================================================
 *  commissionWithholdingService.ts — GĐ 2.6a (phần A): khấu trừ thuế TNCN hoa hồng CTV
 * ============================================================================
 *
 *  🔴 LỖ HỔNG ĐANG CHẠY (memory): `postOrderJournalEntries` ghi Nợ 642 / Có 3388 cho
 *  hoa hồng NHƯNG KHÔNG khấu trừ thuế TNCN → thiếu Có 3335. VComm là sàn có chức năng
 *  thanh toán (NĐ 252/2026 Điều 43.1) → BẮT BUỘC khấu trừ/nộp thay TNCN hộ CNKD (CTV)
 *  từng giao dịch (Điều 44). Thiếu bút toán này = kê khai thuế sai + rủi ro phạt.
 *
 *  Căn cứ luật (tham số NIÊN HẠN — xem buildCommissionWithholding):
 *   - NĐ 252/2026 Điều 43.1 + 44: sàn có đặt hàng online + thanh toán → khấu trừ GTGT+TNCN
 *     hộ CNKD. CTV (AGENT×INDIV) → WITHHOLD 10% (theo ma trận nghĩa vụ sàn).
 *   - NĐ 253/2026/NĐ-CP Điều 50.2: nhóm FLAT_ON_GROSS khấu trừ 10% khi chi trả ≥ 5.000.000
 *     đ/lần, KHÔNG giảm trừ. Dưới ngưỡng chỉ khấu trừ khi NLĐ yêu cầu; có cam kết → cuối năm
 *     vẫn tổng hợp nộp.
 *   - flat_rate = CẤU HÌNH (hr_pit_policies.flat_rate), KHÔNG hardcode (MEMORY: anh từng nói 5%,
 *     văn bản ghi 10% → phải là tham số).
 *
 *  Module THUẦN (không chạm DB/live ledger). Sinh JournalEntryDraft khớp shape accountingService;
 *  việc post vào sổ cái do caller quyết định (để user duyệt trước khi ghi live).
 * ============================================================================
 */

import { TT99_ACCOUNTS } from './accountingService';

export interface CommissionWithholdingInput {
  /** id giao dịch gốc (đơn hàng / lệnh chi). Dùng làm prefix idempotent. */
  refId: string;
  tenantId: string;
  /** id CTV / cá nhân nhận hoa hồng. */
  partnerId: string;
  /** Tổng hoa hồng gộp trước thuế (VND). */
  grossCommission: number;
  /** Loại người nhận. Chỉ 'individual' (CNKD/CTV) mới khấu trừ. 'legal' → OFF. */
  partnerType: 'individual' | 'legal';
  /** Tỷ lệ khấu trừ TNCN (config). Mặc định 0,1 (10% theo NĐ 253 Điều 50.2). */
  flatRate?: number;
  /** Ngưỡng chi trả buộc khấu trừ (VND/lần). Mặc định 5_000_000. */
  thresholdPerPayment?: number;
  /** NLĐ có cam kết không khấu trừ (Điều 50.2)? Nếu true và dưới ngưỡng → 0. */
  hasCommitment?: boolean;
  /** Ngày lập (ISO). */
  date: string;
}

export interface CommissionWithholdingResult {
  /** true = có khấu trừ; false = không (legal / dưới ngưỡng / có cam kết). */
  withheld: boolean;
  grossCommission: number;
  taxWithheld: number; // thuế TNCN khấu trừ (VND)
  netPayable: number; // hoa hồng thực trả CTV = gross − tax
  reason: string; // giải thích tại sao khấu trừ / không
  /** Bút toán điều chỉnh (nếu withheld). Khớp shape accountingService. */
  journal?: {
    id: string;
    tenantId: string;
    date: string;
    ref: string;
    description: string;
    lines: Array<{ accountId: string; debit: number; credit: number; description?: string }>;
  };
}

/** Làm tròn đến đồng. */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Tính & dựng bút toán khấu trừ thuế TNCN hoa hồng CTV.
 *  - legal (doanh nghiệp) → KHÔNG khấu trừ (OFF), net = gross.
 *  - individual + gross ≥ ngưỡng → khấu trừ gross × flatRate (mặc định 10%).
 *  - individual + gross < ngưỡng → 0, TRỪ KHI không có cam kết (vẫn khấu trừ để an toàn
 *    kê khai). Có cam kết → 0 (cuối năm tổng hợp nộp).
 */
export function buildCommissionWithholding(input: CommissionWithholdingInput): CommissionWithholdingResult {
  const gross = round2(input.grossCommission);
  if (!(gross > 0)) {
    throw new Error(`Hoa hồng ${input.refId} phải > 0.`);
  }
  const flatRate = input.flatRate ?? 0.1; // 10% (NĐ 253 Điều 50.2)
  const threshold = input.thresholdPerPayment ?? 5_000_000;

  // Doanh nghiệp: không khấu trừ TNCN (OFF)
  if (input.partnerType === 'legal') {
    return {
      withheld: false,
      grossCommission: gross,
      taxWithheld: 0,
      netPayable: gross,
      reason: 'Người nhận là pháp nhân (doanh nghiệp) → không khấu trừ TNCN (OFF).',
    };
  }

  const belowThreshold = gross < threshold;
  // Dưới ngưỡng + có cam kết → không khấu trừ (Điều 50.2)
  if (belowThreshold && input.hasCommitment) {
    return {
      withheld: false,
      grossCommission: gross,
      taxWithheld: 0,
      netPayable: gross,
      reason: `Cá nhân, hoa hồng ${gross} < ngưỡng ${threshold}, CÓ cam kết → không khấu trừ (tổng hợp cuối năm).`,
    };
  }

  // Khấu trừ: FLAT_ON_GROSS × tỷ lệ trên tổng hoa hồn (KHÔNG giảm trừ)
  const tax = round2(gross * flatRate);
  const net = round2(gross - tax);
  const desc = `Khấu trừ TNCN hoa hồng CTV ${input.partnerId} (${input.refId})`;
  const je = {
    id: `KHTNCN-${input.refId}`, // idempotent
    tenantId: input.tenantId,
    date: input.date,
    ref: input.refId,
    description: desc,
    // Nợ 3388 (giảm phải trả CTV) / Có 3335 (thuế TNCN khấu trừ)
    lines: [
      { accountId: TT99_ACCOUNTS.OTHER_PAYABLE, debit: tax, credit: 0, description: desc },
      { accountId: TT99_ACCOUNTS.TAX_WITHHELD_PAYABLE, debit: 0, credit: tax, description: `Thuế TNCN khấu trừ HĐ ${input.refId}` },
    ],
  };

  return {
    withheld: true,
    grossCommission: gross,
    taxWithheld: tax,
    netPayable: net,
    reason: `Cá nhân, hoa hồng ${gross} ${belowThreshold ? '< ngưỡng (KHÔNG cam kết)' : '≥ ngưỡng'} → khấu trừ ${flatRate * 100}% = ${tax}.`,
    journal: je,
  };
}
