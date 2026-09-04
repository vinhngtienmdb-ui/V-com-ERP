/**
 * ============================================================================
 *  depreciationRunService.ts — GĐ 2.1: chạy trích khấu hao HÀNG LOẠT cuối tháng
 * ============================================================================
 *
 *  `fixedAssetService.ts` tính cho MỘT tài sản. Thực tế kế toán cần chạy
 *  CHO TẤT CẢ tài sản đang sử dụng vào cuối mỗi tháng, rồi sinh một loạt
 *  chứng từ (mỗi tài sản một bút toán Nợ 627/642/641 / Có 214).
 *
 *  Nguyên tắc thiết kế:
 *   - **Không fail-fast**: một tài sản thiếu cấu hình (assetClass/usefulLifeMonths)
 *     KHÔNG được chặn cả kỳ của những tài sản khác → đưa vào `skipped` kèm lý do.
 *     (Thực tế: 1 tài sản lỗi không nên làm đình trệ BCTC của 50 tài sản tốt.)
 *   - **Idempotent**: id chứng từ `KH-<assetId>-<period>` → chạy lại kỳ cũ sẽ GHI ĐÈ,
 *     không sinh chứng từ thứ hai (xem MEMORY: id cố định = idempotency miễn phí).
 *   - **Không chạm DB**: trả về danh sách chứng từ; caller quyết định ghi sổ.
 *
 *  Căn cứ: TT99/2025 Điều 12 (ghi kép) + Điều 28 (lưu vết qua bridge TT99).
 * ============================================================================
 */

import {
  computeMonthlyDepreciation,
  buildDepreciationJournalEntry,
  type FixedAsset,
  type JournalEntryDraft,
} from './fixedAssetService';

export interface DepreciationRunResult {
  /** Kỳ chạy (yyyy-mm). */
  period: string;
  /** Các chứng từ khấu hao cần ghi sổ. */
  entries: JournalEntryDraft[];
  /** Tổng số tiền khấu hao trong kỳ (VND). */
  totalAmount: number;
  /** Số tài sản được trích. */
  assetCount: number;
  /** Tài sản BỊ BỎ QUA + lý do (để kế toán xử lý, không làm fail cả kỳ). */
  skipped: Array<{ assetId: string; name: string; reason: string }>;
  /** Cảnh báo không chặn (vd tài sản sắp hết khấu hao). */
  warnings: string[];
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Định dạng kỳ hợp lệ: yyyy-mm. */
function assertPeriod(period: string): void {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new Error(`Kỳ khấu hao không hợp lệ: '${period}'. Định dạng bắt buộc yyyy-mm.`);
  }
}

/**
 * Chạy trích khấu hao cho một kỳ.
 *
 *  Với mỗi tài sản:
 *   - số khấu hao > 0 → sinh chứng từ (Nợ TK chi phí theo usage / Có 214)
 *   - số = 0          → bỏ qua (chưa đến hạn, đã thanh lý, hoặc đã khấu hao hết)
 *   - lỗi cấu hình    → đưa vào `skipped` cùng lý do
 *
 * @param assets  danh sách tài sản (đã lọc theo tenant ở caller)
 * @param period  kỳ cần trích, dạng 'yyyy-mm'
 * @param tenantId ghi đè tenant cho chứng từ (mặc định lấy từ từng tài sản)
 */
export function runMonthlyDepreciation(
  assets: FixedAsset[],
  period: string,
  tenantId?: string,
): DepreciationRunResult {
  assertPeriod(period);

  const entries: JournalEntryDraft[] = [];
  const skipped: DepreciationRunResult['skipped'] = [];
  const warnings: string[] = [];
  let totalAmount = 0;

  for (const asset of assets) {
    // Tài sản đã ngừng sử dụng → KHÔNG trích (dù disposedDate có thể null)
    if (asset.status && asset.status !== 'in_use') {
      skipped.push({
        assetId: asset.id,
        name: asset.name,
        reason: `Trạng thái '${asset.status}' (không phải in_use) → không trích.`,
      });
      continue;
    }

    try {
      const amount = computeMonthlyDepreciation(asset, period);
      if (amount <= 0) {
        // Hợp lệ nhưng không phát sinh trong kỳ (chưa đến hạn / đã thanh lý / đã trích hết)
        continue;
      }
      const je = buildDepreciationJournalEntry(asset, period, tenantId);
      entries.push(je);
      totalAmount = round2(totalAmount + amount);
    } catch (err: any) {
      skipped.push({
        assetId: asset.id,
        name: asset.name,
        reason: err?.message || String(err),
      });
    }
  }

  if (entries.length === 0 && skipped.length > 0) {
    warnings.push(`Kỳ ${period} KHÔNG sinh được chứng từ nào — kiểm tra ngay danh sách bị bỏ qua.`);
  }

  return {
    period,
    entries,
    totalAmount: round2(totalAmount),
    assetCount: entries.length,
    skipped,
    warnings,
  };
}

/**
 * Gộp các chứng từ cùng kỳ thành MỘT chứng từ tổng hợp (tuỳ chọn).
 *  Doanh nghiệp thường muốn một bút toán tổng thay vì N bút toán nhỏ.
 *  Giữ nguyên tổng Nợ/Có, chỉ gộp theo từng tài khoản Nợ chi phí.
 */
export function consolidateDepreciationEntries(
  result: DepreciationRunResult,
  opts: { tenantId: string; date: string } = { tenantId: '', date: '' },
): JournalEntryDraft {
  if (result.entries.length === 0) {
    throw new Error(`Không có chứng từ nào để gộp cho kỳ ${result.period}.`);
  }

  // Gom theo tài khoản Nợ (627/641/642) — mỗi TK một dòng Nợ tổng
  const byDebitAccount = new Map<string, number>();
  let totalCredit = 0;
  for (const je of result.entries) {
    for (const line of je.lines) {
      if (line.debit > 0) {
        byDebitAccount.set(line.accountId, round2((byDebitAccount.get(line.accountId) ?? 0) + line.debit));
      } else {
        totalCredit = round2(totalCredit + line.credit);
      }
    }
  }

  const lines = [
    ...[...byDebitAccount.entries()].map(([accountId, debit]) => ({
      accountId,
      debit,
      credit: 0,
      description: `Khấu hao TSCĐ tháng ${result.period}`,
    })),
    {
      accountId: '214',
      debit: 0,
      credit: totalCredit,
      description: `Hao mòn TSCĐ tháng ${result.period}`,
    },
  ];

  const totalDebit = round2([...byDebitAccount.values()].reduce((a, b) => a + b, 0));
  if (totalDebit !== totalCredit) {
    throw new Error(
      `Chứng từ gộp mất cân bằng (Nợ ${totalDebit} ≠ Có ${totalCredit}) — Điều 12 TT99.`,
    );
  }

  return {
    id: `KH-TONG-${result.period}`, // idempotent
    tenantId: opts.tenantId || result.entries[0].tenantId,
    date: opts.date || result.entries[0].date,
    ref: `KH-TONG-${result.period}`,
    description: `Trích khấu hao TSCĐ tháng ${result.period} (${result.entries.length} tài sản)`,
    lines,
  };
}
