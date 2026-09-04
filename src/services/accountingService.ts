/**
 * ============================================================================
 *  accountingService.ts — Hạch toán tự động theo TT99/2025/TT-BTC
 * ============================================================================
 *
 *  TT99/2025/TT-BTC ban hành 27/10/2025, có hiệu lực 01/01/2026, thay thế
 *  TT200/2014 (Điều 31 TT99). Áp dụng cho MỌI đối tượng kế toán — kể cả hộ
 *  kinh doanh — nên không còn chế độ kế toán riêng theo TT88/2021.
 *
 *  Các Điều của TT99 chi phối trực tiếp file này:
 *
 *   - Điều 11  Hệ thống tài khoản kế toán.
 *              Chỉ 71 tài khoản CẤP 1 là bắt buộc. Doanh nghiệp được TỰ XÂY
 *              DỰNG tài khoản cấp 2, cấp 3 nhưng PHẢI quy định rõ trong
 *              "Quy chế hạch toán kế toán" (Điều 11(2)(d)).
 *              → Bản quy chế thu gọn nằm ở TT99_ACCOUNTS bên dưới.
 *
 *   - Điều 12  Chứng từ kế toán. Ghi theo phương pháp kép: mỗi nghiệp vụ phải
 *              ghi ít nhất một Nợ và một Có, tổng Nợ = tổng Có.
 *              → assertBalanced()
 *
 *   - Điều 13  Mở sổ / ghi sổ / khóa sổ. Kỳ kế toán đã khóa KHÔNG được ghi
 *              tiếp. Việc khóa sổ là không thể đảo ngược.
 *              → Đang được chặn ở tầng SupabaseAdapter qua
 *                `tenant_settings.closingLockDate` (xem accounting_closing.test.ts).
 *                Khi bật TT99_BRIDGE_ENABLED sẽ chặn thêm bằng acc_periods.
 *
 *   - Điều 28  Phần mềm kế toán phải có lưu vết thay đổi không thể tắt, ngăn
 *              việc xóa/sửa trái phép, và xuất dữ liệu cho cơ quan thuế.
 *              → Khi bật TT99_BRIDGE_ENABLED, mỗi bút toán tự động sinh chứng
 *                từ trong acc_vouchers / acc_voucher_lines và được đưa vào
 *                chuỗi băm acc_audit_log.
 *
 *  ---------------------------------------------------------------------------
 *  - GĐ 4.3  Rollout: TT99 bridge bật THEO TENANT qua feature flag
 *              (`isTt99BridgeEnabled`), không còn là hằng số biên dịch.
 *
 *  LƯU Ý VỀ ĐƯỜNG GHI DỮ LIỆU (đọc trước khi sửa)
 *  ---------------------------------------------------------------------------
 *  `journal_entries` / `journal_items` là sổ cái ĐANG HOẠT ĐỘNG, đang được
 *  đọc bởi Finance.tsx, useSepayListener.ts, codReconciliationService.ts và
 *  misaService.ts. Bảng `acc_*` của TT99 mới chỉ được KIỂM CHỨNG bằng cách
 *  chạy migration trong một transaction rồi ROLLBACK — CHƯA áp dụng lên
 *  Supabase thật.
 *
 *  Vì vậy mặc định TT99_BRIDGE_ENABLED = false và file này tiếp tục ghi
 *  journal_entries. Chỉ bật cầu nối SAU khi đã chạy 5 file migration trong
 *  specs/021-tt99-ke-toan-doanh-nghiep/migrations/ lên cơ sở dữ liệu.
 */

import { db, doc, setDoc, getDoc } from './dbService';
import { Order } from '../types/erp';
import * as tt99 from './tt99Service';
import { logger } from '../lib/logger';
import { isFeatureEnabled, FEATURE_FLAGS } from './featureFlagService';

const DEFAULT_TENANT = 'tenant-vcomm-prod-01';

/** Sai số cho phép khi so sánh Nợ/Có (Điều 12 ghi kép). */
const EPSILON = 0.01;

/**
 * Tỷ lệ thuế GTGT mặc định.
 * Trước đây con số 10% bị hard-code thành phép chia `total / 1.1`. Nay được
 * tách thành hằng số có tên và có thể ghi đè theo từng đơn hàng, vì trên sàn
 * có cả hàng hóa 0%, 5% và dịch vụ chịu thuế khác.
 */
export const DEFAULT_VAT_RATE = 0.1;

/**
 * Tỷ lệ ước tính giá vốn khi sản phẩm KHÔNG có giá vốn thật trong PIM.
 *
 * Điều 12 đòi hỏi chứng từ phản ánh đúng nội dung kinh tế của nghiệp vụ.
 * Việc ước lượng là BẮT BUỘC PHẢI CÔNG KHAI: mỗi bút toán ước tính được gắn
 * cờ `costBasis: 'estimated'` và ghi rõ vào diễn giải của chứng từ, để kiểm
 * toán viên và cơ quan thuế nhìn thấy ngay con số này không phải số liệu thật.
 */
export const ESTIMATED_COGS_RATIO = 0.6;

/**
 * Bật cầu nối TT99 — ghi song song vào acc_vouchers / acc_voucher_lines để
 * hưởng lưu vết Điều 28.
 *
 * Điều kiện để bật: đã chạy xong 5 migration TT99
 * (specs/012-vn-legal-compliance/migrations/017–021_tt99_*.sql, copy từ
 * specs/021-tt99-ke-toan-doanh-nghiep/migrations/) lên Supabase. GĐ2 (2026-09-02):
 * 5 file này đã được chép vào thư mục migration đang hoạt động và apply lên DB
 * trước khi bật cờ. Nếu môi trường nào chưa chạy migration, bridge vẫn fail-soft
 * (try/catch) để không kẹt nghiệp vụ hoàn tất đơn / duyệt chi.
 *
 * ⚠️ GĐ2 — cờ này đã được BẬT (true) sau khi apply 5 migration TT99.
 *
 * 🔄 GĐ 4.3 — ĐÃ CHUYỂN SANG FEATURE FLAG: dùng `isTt99BridgeEnabled(tenantId)` để
 *    quyết định TỪNG TENANT (rollout %, không cần deploy lại). Hằng số dưới đây được
 *    GIỮ LẠI để không phá các import cũ, nhưng KHÔNG còn dùng trong logic bridge.
 *    Đặt `VCOMM_FLAG_TT99_BRIDGE=25` để bật cho 25% tenant rồi tăng dần.
 * @deprecated dùng isTt99BridgeEnabled(tenantId) thay cho hằng số này.
 */
export const TT99_BRIDGE_ENABLED = true;

export class AccountingError extends Error {
  code: string;
  constructor(message: string, code = 'ACCOUNTING_ERROR') {
    super(message);
    this.name = 'AccountingError';
    this.code = code;
  }
}

/**
 * ---------------------------------------------------------------------------
 *  QUY CHẾ HẠCH TOÁN KẾ TOÁN (trích) — theo Điều 11(2)(d) TT99
 * ---------------------------------------------------------------------------
 *  VComm tự xây dựng các tài khoản cấp 2 / cấp 3 dưới đây. Khác với TT200,
 *  TT99 KHÔNG yêu cầu xin phép Bộ Tài chính, nhưng bắt buộc phải quy định rõ
 *  trong quy chế để giải trình khi thanh tra.
 *
 *  Mã      Tên                                  Cơ sở
 *  ------  -----------------------------------  ------------------------------
 *  1121    Tiền gửi không kỳ hạn — VND          Cấp 2 của 112. LƯU Ý: TT99 đổi
 *                                               tên 112 từ "Tiền gửi ngân
 *                                               hàng" thành "Tiền gửi không kỳ
 *                                               hạn"; 1121 theo đó là tiền gửi
 *                                               thanh toán VND.
 *  1311    Phải thu khách hàng — sàn TMĐT       Cấp 2 của 131.
 *  33311   Thuế GTGT đầu ra                     Cấp 3 của 333.
 *  3388    Phải trả, phải nộp khác              Cấp 2 của 338.
 *  33881   Phải trả người bán trên sàn          Cấp 3 của 338.
 *  5111    Doanh thu bán hàng hóa               Cấp 2 của 511.
 *  5118    Doanh thu V-Xu tiêu hao              Cấp 2 của 511.
 *
 *  Tài khoản cấp 1 dùng trực tiếp (bắt buộc theo Phụ lục II):
 *  131 Phải thu của khách hàng · 156 Hàng hóa · 632 Giá vốn hàng bán ·
 *  642 Chi phí quản lý doanh nghiệp.
 *
 *  Các tài khoản TT200 đã BỊ BÃI BỎ trong TT99, tuyệt đối không dùng:
 *  161 · 417 · 441 · 461 · 466 · 611 · 631
 *  (631 Chi phí sản xuất chung đã gộp vào 154; 461 Nguồn vốn kinh doanh đã
 *   gộp vào 411.)
 */
export const TT99_ACCOUNTS = {
  /** 131 — Phải thu của khách hàng (cấp 1, bắt buộc). */
  AR_CUSTOMER: '131',
  /** 1121 — Tiền gửi không kỳ hạn — VND (cấp 2 tự xây dựng). */
  CASH_IN_BANK: '1121',
  /** 33311 — Thuế GTGT đầu ra (cấp 3 tự xây dựng). */
  VAT_OUTPUT: '33311',
  /** 5111 — Doanh thu bán hàng hóa (cấp 2 tự xây dựng). */
  REVENUE_GOODS: '5111',
  /** 632 — Giá vốn hàng bán (cấp 1, bắt buộc). */
  COGS: '632',
  /** 156 — Hàng hóa (cấp 1, bắt buộc). */
  INVENTORY: '156',
  /** 642 — Chi phí quản lý doanh nghiệp (cấp 1, bắt buộc). */
  ADMIN_EXPENSE: '642',
  /** 3388 — Phải trả, phải nộp khác (cấp 2 tự xây dựng). */
  OTHER_PAYABLE: '3388',
  /** 3335 — Thuế TNCN khấu trừ, nộp thay (cấp 2 tự xây dựng). Dùng GĐ 2.6a khấu trừ hoa hồng CTV. */
  TAX_WITHHELD_PAYABLE: '3335'
} as const;

export interface PostOrderOptions {
  /** Tỷ lệ thuế GTGT. Mặc định DEFAULT_VAT_RATE (10%). */
  vatRate?: number;
}

/**
 * Đảm bảo bút toán cân bằng Nợ/Có trước khi ghi sổ (Điều 12 TT99).
 * Ném lỗi thay vì ghi một chứng từ lệch — tránh để sổ cái nhiễm sai ngay từ đầu.
 */
function assertBalanced(items: Array<{ debit: number; credit: number }>, context: string): void {
  const totalDebit = items.reduce((s, i) => s + (Number(i.debit) || 0), 0);
  const totalCredit = items.reduce((s, i) => s + (Number(i.credit) || 0), 0);
  const diff = Math.abs(totalDebit - totalCredit);
  if (diff > EPSILON) {
    throw new AccountingError(
      `Bút toán mất cân đối Nợ/Có (${context}): Nợ ${totalDebit.toLocaleString('vi-VN')} ` +
      `≠ Có ${totalCredit.toLocaleString('vi-VN')} (lệch ${diff.toLocaleString('vi-VN')}). ` +
      `Điều 12 TT99/2025/TT-BTC yêu cầu tổng Nợ bằng tổng Có. Không thể ghi sổ!`,
      'UNBALANCED_VOUCHER'
    );
  }
}

/** Làm tròn về số nguyên đồng; VND không có đơn vị lẻ nhỏ hơn 1 đồng. */
function roundVnd(n: number): number {
  return Math.round(Number(n) || 0);
}

/** Ngày hiện tại dạng YYYY-MM-DD (giờ địa phương), dùng cho chứng từ TT99. */
function isoDate(d: Date = new Date()): string {
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Gửi một bản sao bút toán sang sổ cái TT99 (acc_vouchers) để được đưa vào
 * chuỗi băm lưu vết Điều 28. Fail-soft: lỗi ở đây KHÔNG được phép làm kẹt
 * nghiệp vụ đang chạy, nhưng phải kêu to ra để không ai tưởng là đã lưu vết.
 */
async function bridgeToTt99(params: {
  tenantId: string;
  description: string;
  ref: string;
  lines: Array<{ accountId: string; debit: number; credit: number; description?: string }>;
}): Promise<void> {
  // GĐ 3.2 — quyết định THEO TENANT, 2 lớp:
  //   ① bảng `feature_flags` (đổi không cần deploy, có canary % + allow/deny)
  //   ② `src/config/featureFlags.ts` (env + override + mặc định) khi ① không có hàng
  // Hành vi khi chưa chạy migration 003: y hệt trước đây (② quyết định).
  if (!(await isFeatureEnabled(FEATURE_FLAGS.TT99_BRIDGE, { tenantId: params.tenantId }))) return;
  try {
    const voucherDate = isoDate();
    const period = await tt99.resolvePeriodForDate(voucherDate, params.tenantId);
    await tt99.createVoucher({
      tenantId: params.tenantId,
      periodId: period.id,
      // PKT = "Chứng từ phân bổ / khác" — loại phù hợp cho bút toán tự động
      // sinh ra từ module khác (đơn hàng, đối soát), không có chứng từ gốc.
      voucherType: 'PKT',
      voucherDate,
      description: params.description,
      sourceType: 'auto_post',
      sourceId: params.ref,
      lines: params.lines.map(l => ({
        accountCode: l.accountId,
        debit: l.debit,
        credit: l.credit,
        description: l.description || params.description
      }))
    });
  } catch (err: any) {
    logger.error('[TT99] không ghi được lưu vết Điều 28 (bridge fail-soft)', {
      ref: params.ref,
      error: err?.message || String(err),
    });
  }
}

/**
 * Tự động hạch toán doanh thu, giá vốn và hoa hồng khi đơn hàng hoàn tất.
 *
 * Bút toán (Điều 12 — ghi kép):
 *   Nợ 131   / Có 5111   : doanh thu bán hàng (chưa thuế)
 *   Nợ 131   / Có 33311  : thuế GTGT đầu ra
 *   Nợ 632   / Có 156    : giá vốn hàng bán
 *   Nợ 642   / Có 3388   : chi phí hoa hồng sàn phải trả
 */
export async function postOrderJournalEntries(order: Order, opts: PostOrderOptions = {}): Promise<string> {
  const tenantId = order.tenantId || DEFAULT_TENANT;
  const orderTotal = roundVnd(order.total);
  const commission = roundVnd(order.commissionFee);

  if (!(orderTotal > 0)) {
    throw new AccountingError(
      `Đơn hàng ${order.id} có tổng tiền không hợp lệ (${orderTotal}). Không thể hạch toán.`,
      'INVALID_TOTAL'
    );
  }

  // Định danh CỐ ĐỊNH theo mã đơn. Trước đây ID có kèm Date.now() nên mỗi lần
  // gọi lại sinh ra MỘT CHỨNG TỪ MỚI cho cùng một nghiệp vụ → trùng bút toán.
  // Với ID cố định, SupabaseAdapter.upsert cộng với việc xóa rồi chèn lại
  // journal_items theo entry_id khiến lần gọi lặp THAY THẾ chứng từ cũ thay vì
  // tạo thêm. Idempotent mà không cần đọc trước.
  const journalEntryId = `je-order-complete-${order.id}`;

  // 1. Tính giá vốn (COGS)
  let totalCogs = 0;
  let estimatedCost = false;
  if (Array.isArray(order.items)) {
    for (const item of order.items) {
      let costPrice = 0;
      try {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await getDoc(prodRef);
        if (prodSnap && typeof prodSnap.exists === 'function' && prodSnap.exists()) {
          costPrice = Number(prodSnap.data()?.costPrice || 0);
        }
      } catch (err) {
        console.warn(`[Accounting] Không đọc được giá vốn của ${item.productId}`, err);
      }

      const qty = Number(item.quantity || 0);
      if (costPrice > 0) {
        totalCogs += costPrice * qty;
      } else {
        // PIM thiếu giá vốn. Ước lượng và ĐÁNH DẤU rõ ràng thay vì giả vờ đây
        // là số liệu thật (Điều 12).
        estimatedCost = true;
        totalCogs += Number(item.price || 0) * ESTIMATED_COGS_RATIO * qty;
        console.warn(
          `[Accounting] Sản phẩm ${item.productId} không có giá vốn. ` +
          `Ước tính ${ESTIMATED_COGS_RATIO * 100}% giá bán — CẦN CẬP NHẬT GIÁ VỐN THẬT.`
        );
      }
    }
  }

  // 2. Tách doanh thu và thuế GTGT
  //    Không còn hard-code 1.1: tỷ lệ được truyền vào, mặc định 10%.
  const vatRate = typeof opts.vatRate === 'number' && opts.vatRate >= 0 && opts.vatRate < 1
    ? opts.vatRate
    : DEFAULT_VAT_RATE;
  const netRevenue = roundVnd(orderTotal / (1 + vatRate));
  const vat = orderTotal - netRevenue;

  const items: any[] = [
    { accountId: TT99_ACCOUNTS.AR_CUSTOMER, debit: orderTotal, credit: 0, partnerId: order.customerId || null },
    { accountId: TT99_ACCOUNTS.REVENUE_GOODS, debit: 0, credit: netRevenue },
    { accountId: TT99_ACCOUNTS.VAT_OUTPUT, debit: 0, credit: vat }
  ];

  if (totalCogs > 0) {
    const cogs = roundVnd(totalCogs);
    items.push(
      { accountId: TT99_ACCOUNTS.COGS, debit: cogs, credit: 0 },
      { accountId: TT99_ACCOUNTS.INVENTORY, debit: 0, credit: cogs }
    );
  }

  if (commission > 0) {
    items.push(
      { accountId: TT99_ACCOUNTS.ADMIN_EXPENSE, debit: commission, credit: 0 },
      { accountId: TT99_ACCOUNTS.OTHER_PAYABLE, debit: 0, credit: commission, partnerId: order.sellerId || null }
    );
  }

  assertBalanced(items, `đơn hàng ${order.id}`);

  // Diễn giải phải tự mang theo các cảnh báo, vì adapter chỉ lưu
  // id / tenant_id / date / ref / description — mọi trường khác bị bỏ qua.
  const warnings: string[] = [];
  if (estimatedCost) {
    warnings.push(`Giá vốn ước tính ${ESTIMATED_COGS_RATIO * 100}% giá bán (thiếu giá vốn thật trong PIM)`);
  }
  if (vatRate === DEFAULT_VAT_RATE) {
    warnings.push(`Thuế GTGT suất mặc định ${vatRate * 100}% (chưa có tỷ lệ riêng cho đơn này)`);
  }
  const warningNote = warnings.length ? ` [Lưu ý: ${warnings.join('; ')}]` : '';

  const journalEntry: any = {
    id: journalEntryId,
    date: new Date().toISOString(),
    ref: order.id,
    description: `Hạch toán hoàn tất đơn hàng ${order.id}${warningNote}`,
    tenantId,
    items
  };

  const docRef = doc(db, 'journal_entries', journalEntryId);
  await setDoc(docRef, journalEntry);
  console.log(`[Accounting] Auto-posted completed order ${order.id}: JE ID ${journalEntryId}`);

  await bridgeToTt99({
    tenantId,
    description: journalEntry.description,
    ref: order.id,
    lines: items.map(i => ({
      accountId: i.accountId,
      debit: i.debit,
      credit: i.credit,
      description: journalEntry.description
    }))
  });

  return journalEntryId;
}

/**
 * Tự động hạch toán khi duyệt chi rút tiền (thanh toán cho người bán / CTV).
 *
 * Bút toán (Điều 12 — ghi kép):
 *   Nợ 3388  / Có 1121 : giảm nghĩa vụ phải trả, chi tiền từ ngân hàng
 */
export async function postWithdrawalJournalEntries(withdrawal: {
  id: string;
  userId: string;
  userType: string;
  amount: number;
  tenantId?: string;
}): Promise<string> {
  const tenantId = withdrawal.tenantId || DEFAULT_TENANT;
  const amount = roundVnd(withdrawal.amount);

  if (!(amount > 0)) {
    throw new AccountingError(
      `Lệnh rút tiền ${withdrawal.id} có số tiền không hợp lệ (${amount}). Không thể hạch toán.`,
      'INVALID_AMOUNT'
    );
  }

  const journalEntryId = `je-withdrawal-${withdrawal.id}`;

  const items: any[] = [
    { accountId: TT99_ACCOUNTS.OTHER_PAYABLE, debit: amount, credit: 0, partnerId: withdrawal.userId },
    { accountId: TT99_ACCOUNTS.CASH_IN_BANK, debit: 0, credit: amount }
  ];

  assertBalanced(items, `lệnh rút tiền ${withdrawal.id}`);

  const journalEntry: any = {
    id: journalEntryId,
    date: new Date().toISOString(),
    ref: withdrawal.id,
    description: `Hạch toán duyệt chi rút tiền ${withdrawal.id} (${withdrawal.userType})`,
    tenantId,
    items
  };

  const docRef = doc(db, 'journal_entries', journalEntryId);
  await setDoc(docRef, journalEntry);
  console.log(`[Accounting] Auto-posted withdrawal ${withdrawal.id}: JE ID ${journalEntryId}`);

  await bridgeToTt99({
    tenantId,
    description: journalEntry.description,
    ref: withdrawal.id,
    lines: items.map(i => ({
      accountId: i.accountId,
      debit: i.debit,
      credit: i.credit,
      description: journalEntry.description
    }))
  });

  return journalEntryId;
}

/**
 * GĐ 2.6a (A): hạch toán khấu trừ thuế TNCN hoa hồng CTV vào sổ cái.
 *
 *  Bút toán (Điều 12 TT99): Nợ 3388 / Có 3335 — tách phần thuế khỏi nghĩa vụ phải trả CTV.
 *  Lấp lỗ hổng: postOrderJournalEntries ghi Nợ 642 / Có 3388 cho hoa hồng nhưng KHÔNG khấu trừ.
 *
 *  ⚠️ Chỉ gọi khi ĐÃ xác định partnerType='individual' từ seller KYC (NĐ 252/2026 Điều 44:
 *  sàn có thanh toán BẮT BUỘC khấu trừ/nộp thay TNCN hộ CNKD). Pháp nhân → KHÔNG gọi.
 *  Dùng buildCommissionWithholding() để tính trước, truyền `result.journal` vào đây.
 *  id của journal là cố định (KH-<refId>) → idempotent khi ghi lại.
 */
export async function postCommissionWithholding(journal: {
  id: string;
  tenantId: string;
  date: string;
  ref: string;
  description: string;
  lines: Array<{ accountId: string; debit: number; credit: number; description?: string }>;
}): Promise<string> {
  assertBalanced(journal.lines, `khấu trừ TNCN ${journal.ref}`);

  const docRef = doc(db, 'journal_entries', journal.id);
  await setDoc(docRef, {
    id: journal.id,
    date: journal.date,
    ref: journal.ref,
    description: journal.description,
    tenantId: journal.tenantId,
    items: journal.lines,
  });
  console.log(`[Accounting] Auto-posted TNCN withholding ${journal.ref}: JE ID ${journal.id}`);

  await bridgeToTt99({
    tenantId: journal.tenantId,
    description: journal.description,
    ref: journal.ref,
    lines: journal.lines.map(i => ({
      accountId: i.accountId,
      debit: i.debit,
      credit: i.credit,
      description: i.description || journal.description,
    })),
  });

  return journal.id;
}
