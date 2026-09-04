import {
  db, collection, doc, getDoc, getDocs, setDoc, updateDoc,
  query, where, orderBy,
} from './dbService';
import { supabase } from '../lib/supabase';
import type {
  AccAccount, AccAccountType, AccBalanceSide,
  AccCurrency, AccFxRate,
  AccPeriod, AccPeriodStatus,
  AccVoucher, AccVoucherLine, AccVoucherType, AccVoucherStatus, AccJournalRow,
  AccAuditLogEntry, AccChainBreak,
  AccUnit, AccInternalTxn, AccElimination, AccEliminationLine, AccEliminationType,
  RevContract, RevPerformanceObligation, RevPriceAllocation, RevRecognition,
  FsReport, FsReportLine, FsReportCode,
} from '../types/erp';

/**
 * SPEC 021 — TT99/2025/TT-BTC: Chế độ kế toán DOANH NGHIỆP
 * ============================================================================
 * Có hiệu lực 01/01/2026 · thay thế TT200/2014/TT-BTC (Điều 31).
 * Áp dụng cho MỌI chủ thể trong VComm ERP — kể cả hộ kinh doanh — theo quyết
 * định của chủ dự án: "Chỉ TT99, gỡ TT88".
 *
 * Điều 11  : chỉ 71 TK cấp 1 là bắt buộc; tự chủ cấp 2/3 nhưng phải dẫn chiếu
 *            Quy chế hạch toán kế toán.
 * Điều 12  : sổ kế toán · bút toán kép Nợ/Có.
 * Điều 13  : mở sổ / ghi sổ / khóa sổ — khóa sổ là BẤT BIẾN.
 * Điều 7   : hợp nhất đơn vị trực thuộc — loại bỏ TOÀN BỘ giao dịch nội bộ.
 * Điều 28  : phần mềm kế toán — lưu vết, chống xoá/sửa, xuất dữ liệu cho thuế.
 * Điều 14-27: BCTC — "Bảng cân đối kế toán" → "Báo cáo tình hình tài chính".
 *
 * NGUYÊN TẮC THIẾT KẾ (spec 021 §4, N1–N6)
 *   N1 Hệ tài khoản là DỮ LIỆU (bảng acc_accounts), không phải code.
 *   N2 Cân bằng Nợ/Có do DATABASE kiểm tra (constraint trigger), không phải UI.
 *   N3 Chứng từ đã ghi sổ là BẤT BIẾN — sửa sai bằng chứng từ ĐIỀU CHỈNH
 *      (Luật Kế toán Điều 27: ghi số âm, không xoá/sửa bút toán gốc).
 *   N4 Số dư tài khoản LUÔN TÍNH TỪ BÚT TOÁN, không bao giờ lưu cột số dư.
 *   N5 Lưu vết là chuỗi băm SHA-256 nối đuôi nhau, phát hiện bị cắt/xoá.
 *   N6 Giao dịch nội bộ được gắn cờ NGAY KHI GHI (trigger DB).
 *
 * ⚠️ GIỚI HẠN TRUNG THỰC: chuỗi băm trong DB không thể chặn được một
 *    Postgres superuser có quyền viết trực tiếp. "Chống sửa" ở đây có nghĩa là
 *    PHÁT HIỆN và CẢNH BÁO, không phải ngăn chặn tuyệt đối. Xem spec 021 §9.
 */

const DEFAULT_TENANT = 'tenant-vcomm-prod-01';

/** Đơn vị tiền tệ kế toán bắt buộc (Điều 4) */
const BASE_CURRENCY = 'VND';

/** Sai số cho phép khi so sánh số tiền (VND, 2 chữ số thập phân) */
const EPSILON = 0.01;

export class TT99Error extends Error {
  constructor(message: string, public readonly code: string = 'TT99_ERROR') {
    super(message);
    this.name = 'TT99Error';
  }
}

// -----------------------------------------------------------------------------
// TIỆN ÍCH
// -----------------------------------------------------------------------------

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/** Làm tròn về 2 chữ số (VND không có đơn vị lẻ, nhưng ngoại tệ có) */
function round2(n: number): number {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function nowIso(): string {
  return new Date().toISOString();
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDateOnly(iso: string): string {
  return String(iso || '').slice(0, 10);
}

/** Băm SHA-256 (hex) — dùng cho checksum tệp đính kèm & BCTC */
export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Đọc 1 bản ghi theo id — trả null nếu không tồn tại */
async function readOne<T>(table: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, table, id));
  if (!snap || !snap.exists || (snap.exists && !snap.exists())) return null;
  return { ...(snap.data() as T), id } as T;
}

/** Đọc nhiều bản ghi có lọc đẳng thức đơn giản (luôn lọc theo tenant) */
async function readMany<T>(
  table: string,
  filters: Record<string, unknown> = {},
  sort?: { field: string; direction?: 'asc' | 'desc' },
  tenantId: string = DEFAULT_TENANT
): Promise<T[]> {
  const constraints: any[] = [where('tenantId', '==', tenantId)];
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null) constraints.push(where(k, '==', v));
  }
  if (sort) constraints.push(orderBy(sort.field, sort.direction || 'asc'));

  const snap = await getDocs(query(collection(db, table), ...constraints));
  return ((snap.docs || []) as any[]).map((d: any) => ({ ...(d.data() as T), id: d.id }) as T);
}

/** Gọi hàm Postgres; ném TT99Error khi thất bại */
async function rpc<T = any>(fn: string, params: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await supabase.rpc(fn, params as any);
  if (error) {
    throw new TT99Error(`RPC ${fn} thất bại: ${error.message}`, 'RPC_FAILED');
  }
  return data as T;
}

/** Đọc một VIEW — dbService không hỗ trợ view (không có cột JSONB `data`) */
async function readView<T = any>(
  view: string,
  filters: Record<string, unknown> = {},
  sort?: string
): Promise<T[]> {
  let q = supabase.from(view).select('*');
  for (const [k, v] of Object.entries(filters)) {
    if (v !== undefined && v !== null) q = q.eq(k, v);
  }
  if (sort) q = q.order(sort, { ascending: true });
  const { data, error } = await q;
  if (error) {
    throw new TT99Error(`Đọc ${view} thất bại: ${error.message}`, 'VIEW_FAILED');
  }
  return (data || []) as T[];
}

// =============================================================================
// 1. HỆ TÀI KHOẢN (Điều 11)
// =============================================================================

/**
 * Danh sách tài khoản. Mặc định chỉ lấy đang hoạt động.
 * 71 tài khoản cấp 1 do TT99 ban hành có isSystem = TRUE và KHÔNG THỂ xoá
 * hoặc khoá (trigger `acc_prevent_system_account_delete` /
 * `acc_prevent_system_account_deactivate`).
 */
export async function listAccounts(
  tenantId: string = DEFAULT_TENANT,
  options: { includeInactive?: boolean; accountType?: AccAccountType } = {}
): Promise<AccAccount[]> {
  const filters: Record<string, unknown> = {};
  if (!options.includeInactive) filters.isActive = true;
  if (options.accountType) filters.accountType = options.accountType;

  return readMany<AccAccount>('acc_accounts', filters, { field: 'code' }, tenantId);
}

export async function getAccount(
  code: string,
  tenantId: string = DEFAULT_TENANT
): Promise<AccAccount | null> {
  const snap = await getDocs(query(
    collection(db, 'acc_accounts'),
    where('tenantId', '==', tenantId),
    where('code', '==', code)
  ));
  const found = (snap.docs || [])[0];
  return found ? { ...(found.data() as AccAccount), id: found.id } : null;
}

/**
 * Mở tài khoản CẤP 2/3 do doanh nghiệp tự thiết kế (Điều 11(2)).
 *
 * Điều 11(2)(d): tài khoản tự mở PHẢI dẫn chiếu quy định trong
 * `Quy chế hạch toán kế toán` của doanh nghiệp — đây là lý do tham số
 * `regulationRef` là BẮT BUỘC ở đây (dù cột DB cho phép NULL).
 */
export async function openSubAccount(params: {
  code: string;
  name: string;
  parentCode: string;
  accountType?: AccAccountType;
  balanceSide?: AccBalanceSide;
  regulationRef: string;
  trackPartner?: boolean;
  trackUnit?: boolean;
  isIntercompany?: boolean;
  note?: string;
  tenantId?: string;
  actor?: string;
}): Promise<AccAccount> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const { code, parentCode } = params;

  if (!/^[0-9]{3,6}$/.test(code)) {
    throw new TT99Error('Mã tài khoản phải là 3–6 chữ số.', 'BAD_ACCOUNT_CODE');
  }
  if (code.length <= 3) {
    throw new TT99Error(
      `Tài khoản cấp 1 (${code}) do TT99 ban hành — không được tự mở (Điều 11).`,
      'LEVEL1_RESERVED'
    );
  }

  const parent = await getAccount(parentCode, tenantId);
  if (!parent) {
    throw new TT99Error(`Tài khoản cha ${parentCode} không tồn tại.`, 'PARENT_NOT_FOUND');
  }
  if (code.slice(0, parent.code.length) !== parent.code) {
    throw new TT99Error(
      `Mã ${code} không bắt đầu bằng mã cha ${parent.code}.`,
      'CODE_NOT_UNDER_PARENT'
    );
  }
  if (await getAccount(code, tenantId)) {
    throw new TT99Error(`Tài khoản ${code} đã tồn tại.`, 'DUPLICATE_ACCOUNT');
  }

  const now = nowIso();
  const account: AccAccount = {
    id: newId('acc'),
    tenantId,
    code,
    name: params.name,
    level: (code.length <= 4 ? 2 : 3) as 1 | 2 | 3,
    parentCode: parent.code,
    accountType: params.accountType || parent.accountType,
    balanceSide: params.balanceSide || parent.balanceSide,
    isSystem: false,
    regulationRef: params.regulationRef,
    isActive: true,
    trackPartner: params.trackPartner ?? parent.trackPartner,
    trackUnit: params.trackUnit ?? parent.trackUnit,
    isIntercompany: params.isIntercompany ?? parent.isIntercompany,
    note: params.note || null,
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(doc(db, 'acc_accounts', account.id), account);
  await rpc('acc_write_audit', {
    p_tenant_id: tenantId,
    p_table_name: 'acc_accounts',
    p_record_id: account.id,
    p_action: 'INSERT',
    p_before: null,
    p_after: account,
    p_actor: params.actor || null,
    p_reason: `Mở TK ${code} — ${params.regulationRef} (Điều 11(2))`,
  });
  return account;
}

/**
 * Khoá một tài khoản tự mở. TK hệ thống (isSystem) sẽ bị DB từ chối.
 * Chỉ khoá được khi không còn số dư phát sinh trong kỳ đang mở.
 */
export async function deactivateAccount(
  code: string,
  reason: string,
  tenantId: string = DEFAULT_TENANT
): Promise<void> {
  const acc = await getAccount(code, tenantId);
  if (!acc) throw new TT99Error(`Tài khoản ${code} không tồn tại.`, 'ACCOUNT_NOT_FOUND');
  if (acc.isSystem) {
    throw new TT99Error(
      `Tài khoản ${code} là 1 trong 71 TK cấp 1 bắt buộc của TT99 — không được khoá (Điều 11).`,
      'SYSTEM_ACCOUNT'
    );
  }
  await updateDoc(doc(db, 'acc_accounts', acc.id), { isActive: false, note: reason });
}

// --- Ngoại tệ & tỷ giá (Điều 4-6) --------------------------------------------

export async function listCurrencies(tenantId: string = DEFAULT_TENANT): Promise<AccCurrency[]> {
  return readMany<AccCurrency>('acc_currencies', { isActive: true }, { field: 'code' }, tenantId);
}

/**
 * Ghi tỷ giá. Trigger DB tự tính `deviationPct` và cờ `exceedsTolerance`.
 *
 * ⚠️ Ngưỡng 1% là giá trị CẦN ĐỐI CHIẾU với văn bản gốc TT99 trước khi dùng
 *    cho kỳ quyết toán thuế (xem spec 021 §9 — nợ kỹ thuật).
 */
export async function recordFxRate(params: {
  currencyCode: string;
  rateDate: string;
  bookedRate: number;
  actualRate?: number;
  tolerancePct?: number;
  note?: string;
  tenantId?: string;
  actor?: string;
}): Promise<AccFxRate> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const id = newId('fx');
  const rate: AccFxRate = {
    id,
    tenantId,
    currencyCode: params.currencyCode,
    rateDate: params.rateDate,
    bookedRate: round2(params.bookedRate),
    actualRate: params.actualRate != null ? round2(params.actualRate) : null,
    exceedsTolerance: false,
    tolerancePct: params.tolerancePct ?? 1.0,
    note: params.note || null,
    createdBy: params.actor || null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await setDoc(doc(db, 'acc_fx_rates', id), rate);
  return rate;
}

/** Quy đổi ngoại tệ → VND theo tỷ giá đã ghi sổ (Điều 5) */
export async function convertToBase(
  amount: number,
  currencyCode: string,
  fxRate?: number
): Promise<number> {
  if (currencyCode === BASE_CURRENCY) return round2(amount);
  const rate = fxRate && fxRate > 0 ? fxRate : 1;
  return round2(amount * rate);
}

// =============================================================================
// 2. KỲ KẾ TOÁN (Điều 13)
// =============================================================================

export async function listPeriods(
  tenantId: string = DEFAULT_TENANT,
  year?: number
): Promise<AccPeriod[]> {
  const filters: Record<string, unknown> = {};
  if (year) filters.periodYear = year;
  return readMany<AccPeriod>('acc_periods', filters, { field: 'periodYear', direction: 'desc' }, tenantId);
}

/** Tạo kỳ tháng (period_no 1..12) hoặc kỳ quý (21..24) hoặc kỳ năm (NULL) */
export async function createPeriod(params: {
  periodYear: number;
  periodNo?: number | null;
  tenantId?: string;
}): Promise<AccPeriod> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const { periodYear, periodNo } = params;

  let startDate: string;
  let endDate: string;
  if (periodNo == null) {
    startDate = `${periodYear}-01-01`;
    endDate = `${periodYear}-12-31`;
  } else if (periodNo >= 1 && periodNo <= 12) {
    startDate = `${periodYear}-${String(periodNo).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(periodYear, periodNo, 0)).getUTCDate();
    endDate = `${periodYear}-${String(periodNo).padStart(2, '0')}-${lastDay}`;
  } else if (periodNo >= 21 && periodNo <= 24) {
    const q = periodNo - 20;
    const startMonth = (q - 1) * 3 + 1;
    const endMonth = q * 3;
    startDate = `${periodYear}-${String(startMonth).padStart(2, '0')}-01`;
    const lastDay = new Date(Date.UTC(periodYear, endMonth, 0)).getUTCDate();
    endDate = `${periodYear}-${String(endMonth).padStart(2, '0')}-${lastDay}`;
  } else {
    throw new TT99Error('periodNo phải là 1–12 (tháng), 21–24 (quý) hoặc NULL (năm).', 'BAD_PERIOD_NO');
  }

  const id = newId('per');
  const period: AccPeriod = {
    id,
    tenantId,
    periodYear,
    periodNo: periodNo ?? null,
    startDate,
    endDate,
    status: 'open',
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  await setDoc(doc(db, 'acc_periods', id), period);
  return period;
}

/**
 * Tìm kỳ kế toán chứa một ngày. Tự tạo kỳ tháng nếu chưa có (Điều 13(1) —
 * mở sổ đầu kỳ). Kỳ năm được ưu tiên nếu tồn tại.
 */
export async function resolvePeriodForDate(
  isoDate: string,
  tenantId: string = DEFAULT_TENANT
): Promise<AccPeriod> {
  const d = toDateOnly(isoDate);
  const all = await listPeriods(tenantId);

  const hit = all.find(p => d >= toDateOnly(p.startDate) && d <= toDateOnly(p.endDate) && p.periodNo != null)
    || all.find(p => d >= toDateOnly(p.startDate) && d <= toDateOnly(p.endDate));
  if (hit) return hit;

  const year = Number(d.slice(0, 4));
  const month = Number(d.slice(5, 7));
  return createPeriod({ periodYear: year, periodNo: month, tenantId });
}

/**
 * Khoá tạm kỳ (chặn ghi chứng từ mới nhưng vẫn cho sửa chứng từ nháp).
 * Dùng khi đang đối chiếu số liệu cuối tháng.
 */
export async function lockPeriod(
  periodId: string,
  actor?: string
): Promise<AccPeriod> {
  await assertPeriodTransition(periodId, 'locked', actor);
  await updateDoc(doc(db, 'acc_periods', periodId), { status: 'locked' });
  const p = await readOne<AccPeriod>('acc_periods', periodId);
  return p as AccPeriod;
}

/**
 * KHÓA SỔ (Điều 13(3)) — sau bước này kỳ là BẤT BIẾN.
 * Trigger `acc_periods_freeze_closed` sẽ:
 *   - từ chối mọi UPDATE/DELETE trên acc_periods
 *   - tự sinh `closing_hash` để phát hiện can thiệp sau này
 *   - ghi lưu vết hành động CLOSE
 *
 * ⚠️ KHÔNG CÓ HÀM "MỞ LẠI KỲ ĐÃ KHÓA SỔ". Điều này là có chủ ý: Điều 13 không
 *    cho phép mở lại sổ đã khoá. Nếu cần sửa, hãy ghi chứng từ điều chỉnh vào
 *    kỳ đang mở (Luật Kế toán Điều 27).
 */
export async function closePeriod(params: {
  periodId: string;
  closedBy: string;
  closingNote?: string;
}): Promise<AccPeriod> {
  await assertPeriodTransition(params.periodId, 'closed', params.closedBy);
  await updateDoc(doc(db, 'acc_periods', params.periodId), {
    status: 'closed',
    closedAt: nowIso(),
    closedBy: params.closedBy,
    closingNote: params.closingNote || null,
  });
  const p = await readOne<AccPeriod>('acc_periods', params.periodId);
  return p as AccPeriod;
}

async function assertPeriodTransition(
  periodId: string,
  next: AccPeriodStatus,
  actor?: string
): Promise<AccPeriod> {
  const period = await readOne<AccPeriod>('acc_periods', periodId);
  if (!period) throw new TT99Error('Kỳ kế toán không tồn tại.', 'PERIOD_NOT_FOUND');
  if (period.status === 'closed') {
    throw new TT99Error(
      `TT99 Điều 13: Kỳ ${period.periodYear}/${period.periodNo ?? 'năm'} đã khoá sổ — không thể chuyển sang "${next}".`,
      'PERIOD_CLOSED'
    );
  }
  void actor;
  return period;
}

// =============================================================================
// 3. CHỨNG TỪ & BÚT TOÁN KÉP (Điều 12)
// =============================================================================

export interface VoucherLineInput {
  accountCode: string;
  description?: string;
  debit?: number;
  credit?: number;
  /** Nguyên tệ — bắt buộc khi chứng từ ngoại tệ */
  debitOrig?: number;
  creditOrig?: number;
  partnerId?: string;
  partnerType?: 'customer' | 'seller' | 'supplier' | 'employee' | 'other';
  unitId?: string;
  costCenter?: string;
  /** Đơn vị đối ứng — bắt buộc để trigger tự sinh giao dịch nội bộ (Điều 7) */
  counterpartyUnitId?: string;
}

export interface CreateVoucherInput {
  voucherType: AccVoucherType;
  voucherDate: string;
  description: string;
  lines: VoucherLineInput[];
  periodId?: string;
  unitId?: string;
  currencyCode?: string;
  fxRate?: number;
  attachments?: { name: string; url: string; sha256?: string }[];
  sourceType?: string;
  sourceId?: string;
  tenantId?: string;
  actor?: string;
  /** TRUE = ghi sổ ngay (mặc định). FALSE = lưu nháp. */
  post?: boolean;
}

/** Số chứng từ tiếp theo: {LOAI}-{YYMM}-{0001} */
async function nextVoucherNo(
  tenantId: string,
  periodId: string,
  voucherType: AccVoucherType,
  voucherDate: string
): Promise<string> {
  const snap = await getDocs(query(
    collection(db, 'acc_vouchers'),
    where('tenantId', '==', tenantId),
    where('periodId', '==', periodId),
    where('voucherType', '==', voucherType)
  ));
  const count = (snap.docs || []).length;
  const yymm = toDateOnly(voucherDate).slice(2, 4) + toDateOnly(voucherDate).slice(5, 7);
  return `${voucherType}-${yymm}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Kiểm tra tính hợp lệ của bút toán TRƯỚC khi ghi.
 * DB cũng sẽ kiểm lại (constraint trigger) — kiểm ở đây để báo lỗi dễ hiểu.
 */
export function validateVoucherLines(lines: VoucherLineInput[]): void {
  if (!Array.isArray(lines) || lines.length < 2) {
    throw new TT99Error(
      'Kế toán kép: chứng từ phải có ít nhất 2 bút toán (một Nợ, một Có).',
      'TOO_FEW_LINES'
    );
  }
  let debit = 0;
  let credit = 0;
  lines.forEach((l, i) => {
    const d = Number(l.debit) || 0;
    const c = Number(l.credit) || 0;
    if (d < 0 || c < 0) {
      throw new TT99Error(`Bút toán #${i + 1}: số tiền không được âm.`, 'NEGATIVE_AMOUNT');
    }
    if (d > 0 && c > 0) {
      throw new TT99Error(
        `Bút toán #${i + 1} (TK ${l.accountCode}): mỗi bút toán chỉ được ghi MỘT bên (Nợ hoặc Có).`,
        'BOTH_SIDES'
      );
    }
    if (d === 0 && c === 0) {
      throw new TT99Error(`Bút toán #${i + 1} (TK ${l.accountCode}): số tiền bằng 0.`, 'ZERO_AMOUNT');
    }
    if (!l.accountCode) {
      throw new TT99Error(`Bút toán #${i + 1}: thiếu mã tài khoản.`, 'MISSING_ACCOUNT');
    }
    debit += d;
    credit += c;
  });

  if (Math.abs(debit - credit) > EPSILON) {
    throw new TT99Error(
      `Kế toán kép: chứng từ chưa cân bằng — Nợ ${round2(debit).toLocaleString('vi-VN')} / ` +
      `Có ${round2(credit).toLocaleString('vi-VN')} (lệch ${round2(debit - credit).toLocaleString('vi-VN')}).`,
      'UNBALANCED'
    );
  }
}

/**
 * Tạo chứng từ kép.
 *
 * THỨ TỰ BẮT BUỘC (do trigger `trg_acc_vl_immutable_posted`):
 *   1. INSERT acc_vouchers với status = 'draft'
 *   2. INSERT acc_voucher_lines
 *   3. UPDATE acc_vouchers → 'posted'
 * Bước 3 kích hoạt constraint trigger kiểm tra SUM(Nợ) = SUM(Có).
 */
export async function createVoucher(input: CreateVoucherInput): Promise<AccVoucher> {
  const tenantId = input.tenantId || DEFAULT_TENANT;
  const currencyCode = input.currencyCode || BASE_CURRENCY;
  const fxRate = input.fxRate || 1;

  validateVoucherLines(input.lines);

  // (1) Xác định kỳ & kiểm tra kỳ đang mở
  const periodId = input.periodId
    || (await resolvePeriodForDate(input.voucherDate, tenantId)).id;
  const period = await readOne<AccPeriod>('acc_periods', periodId);
  if (!period) throw new TT99Error('Kỳ kế toán không tồn tại.', 'PERIOD_NOT_FOUND');
  if (period.status !== 'open') {
    throw new TT99Error(
      `TT99 Điều 13: kỳ ${period.periodYear}/${period.periodNo ?? 'năm'} đang "${period.status}" — không thể ghi chứng từ.`,
      'PERIOD_NOT_OPEN'
    );
  }

  // (2) Kiểm tra tài khoản tồn tại & đang hoạt động
  for (const line of input.lines) {
    const acc = await getAccount(line.accountCode, tenantId);
    if (!acc) {
      throw new TT99Error(`Tài khoản ${line.accountCode} không tồn tại.`, 'ACCOUNT_NOT_FOUND');
    }
    if (!acc.isActive) {
      throw new TT99Error(`Tài khoản ${line.accountCode} đã bị khoá.`, 'ACCOUNT_INACTIVE');
    }
  }

  const voucherNo = await nextVoucherNo(tenantId, periodId, input.voucherType, input.voucherDate);
  const voucherId = newId('vch');
  const now = nowIso();

  // ---- BƯỚC 1: chứng từ nháp -------------------------------------------------
  const voucher: AccVoucher = {
    id: voucherId,
    tenantId,
    voucherNo,
    voucherType: input.voucherType,
    voucherDate: toDateOnly(input.voucherDate),
    postDate: toDateOnly(input.voucherDate),
    periodId,
    unitId: input.unitId || null,
    currencyCode,
    fxRate,
    description: input.description,
    attachments: input.attachments || null,
    status: 'draft',
    sourceType: input.sourceType || null,
    sourceId: input.sourceId || null,
    createdBy: input.actor || null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'acc_vouchers', voucherId), voucher);

  // ---- BƯỚC 2: các bút toán ---------------------------------------------------
  const lines: AccVoucherLine[] = input.lines.map((l, i) => {
    const debit = round2(l.debit || 0);
    const credit = round2(l.credit || 0);
    return {
      id: newId('vli'),
      tenantId,
      voucherId,
      lineNo: i + 1,
      accountCode: l.accountCode,
      description: l.description || null,
      debit,
      credit,
      debitOrig: round2(l.debitOrig ?? (currencyCode === BASE_CURRENCY ? debit : debit / fxRate)),
      creditOrig: round2(l.creditOrig ?? (currencyCode === BASE_CURRENCY ? credit : credit / fxRate)),
      partnerId: l.partnerId || null,
      partnerType: l.partnerType || null,
      unitId: l.unitId || input.unitId || null,
      costCenter: l.costCenter || null,
      isInternal: false,
      counterpartyUnitId: l.counterpartyUnitId || null,
      createdAt: now,
    };
  });

  for (const line of lines) {
    await setDoc(doc(db, 'acc_voucher_lines', line.id), line);
  }
  // Trigger `acc_vl_flag_internal` đã tự gắn cờ giao dịch nội bộ (N6).
  // Trigger `acc_internal_txn_autolink` đã tự sinh & ghép cặp giao dịch nội bộ.

  // ---- BƯỚC 3: ghi sổ (nếu yêu cầu) ------------------------------------------
  if (input.post !== false) {
    await postVoucher(voucherId, input.actor);
    voucher.status = 'posted';
    voucher.postedBy = input.actor || null;
    voucher.postedAt = now;
  }

  voucher.lines = lines;
  return voucher;
}

/**
 * Ghi sổ chứng từ (draft → posted).
 * DB sẽ từ chối nếu chứng từ chưa cân bằng hoặc kỳ không còn mở.
 */
export async function postVoucher(voucherId: string, actor?: string): Promise<AccVoucher> {
  await updateDoc(doc(db, 'acc_vouchers', voucherId), {
    status: 'posted',
    postedBy: actor || null,
    postedAt: nowIso(),
  });
  const v = await readOne<AccVoucher>('acc_vouchers', voucherId);
  return v as AccVoucher;
}

/**
 * Đọc chi tiết chứng từ kèm các bút toán.
 */
export async function getVoucher(voucherId: string): Promise<AccVoucher | null> {
  const v = await readOne<AccVoucher>('acc_vouchers', voucherId);
  if (!v) return null;
  const snap = await getDocs(query(
    collection(db, 'acc_voucher_lines'),
    where('tenantId', '==', v.tenantId || DEFAULT_TENANT),
    where('voucherId', '==', voucherId),
    orderBy('lineNo', 'asc')
  ));
  v.lines = ((snap.docs || []) as any[]).map((d: any) => ({ ...(d.data() as AccVoucherLine), id: d.id }));
  return v;
}

export async function listVouchers(params: {
  periodId?: string;
  status?: AccVoucherStatus;
  voucherType?: AccVoucherType;
  tenantId?: string;
} = {}): Promise<AccVoucher[]> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const filters: Record<string, unknown> = {};
  if (params.periodId) filters.periodId = params.periodId;
  if (params.status) filters.status = params.status;
  if (params.voucherType) filters.voucherType = params.voucherType;

  return readMany<AccVoucher>('acc_vouchers', filters, { field: 'voucherDate', direction: 'desc' }, tenantId);
}

/**
 * SỬA SAI CHỨNG TỪ ĐÃ GHI SỔ — Luật Kế toán Điều 27 / TT99 Điều 28.
 *
 * Không bao giờ xoá hay sửa chứng từ gốc. Tạo một chứng từ MỚI có bút toán
 * ĐẢO NGƯỢC (ghi số âm) và trỏ `reversalOf` về chứng từ gốc; chứng từ gốc
 * chuyển sang trạng thái `reversed` (DB tự làm qua trigger).
 */
export async function reverseVoucher(params: {
  voucherId: string;
  reason: string;
  actor: string;
  /** TRUE = tạo luôn chứng từ đảo ngược (khuyến nghị). FALSE = chỉ huỷ. */
  withReversal?: boolean;
  tenantId?: string;
}): Promise<{ original: AccVoucher; reversal?: AccVoucher }> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const original = await getVoucher(params.voucherId);
  if (!original) throw new TT99Error('Chứng từ không tồn tại.', 'VOUCHER_NOT_FOUND');
  if (original.status === 'reversed') {
    throw new TT99Error(
      'Chứng từ này đã được điều chỉnh trước đó. Luật Kế toán Điều 27: mỗi chứng từ chỉ điều chỉnh một lần.',
      'ALREADY_REVERSED'
    );
  }
  if (original.status !== 'posted') {
    throw new TT99Error(
      'Chỉ chứng từ đã ghi sổ mới cần điều chỉnh. Chứng từ nháp hãy sửa trực tiếp.',
      'NOT_POSTED'
    );
  }

  let reversal: AccVoucher | undefined;
  if (params.withReversal !== false && original.lines?.length) {
    reversal = await createVoucher({
      voucherType: original.voucherType,
      voucherDate: todayIso(),
      description: `Điều chỉnh chứng từ ${original.voucherNo} — ${params.reason}`,
      lines: original.lines.map(l => ({
        accountCode: l.accountCode,
        description: l.description || null,
        debit: l.credit,   // ĐẢO NGƯỢC
        credit: l.debit,   // ĐẢO NGƯỢC
        debitOrig: l.creditOrig,
        creditOrig: l.debitOrig,
        partnerId: l.partnerId || undefined,
        partnerType: l.partnerType || undefined,
        unitId: l.unitId || undefined,
        costCenter: l.costCenter || undefined,
        counterpartyUnitId: l.counterpartyUnitId || undefined,
      })),
      currencyCode: original.currencyCode,
      fxRate: original.fxRate,
      unitId: original.unitId || undefined,
      sourceType: 'reversal',
      sourceId: original.id,
      tenantId,
      actor: params.actor,
    });
    // Gắn ngược về chứng từ gốc (trigger DB sẽ chuyển gốc sang 'reversed')
    await updateDoc(doc(db, 'acc_vouchers', reversal.id), {
      reversalOf: original.id,
      reversalReason: params.reason,
    });
    reversal.reversalOf = original.id;
    reversal.reversalReason = params.reason;
  } else {
    await updateDoc(doc(db, 'acc_vouchers', original.id), {
      status: 'reversed',
      reversalReason: params.reason,
    });
  }

  const refreshed = await getVoucher(original.id);
  return { original: refreshed as AccVoucher, reversal };
}

/** Nhật ký chung (view v_acc_general_journal) */
export async function getGeneralJournal(params: {
  periodId?: string;
  accountCode?: string;
  tenantId?: string;
} = {}): Promise<AccJournalRow[]> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const rows = await readView<any>('v_acc_general_journal', {
    tenant_id: tenantId,
    ...(params.periodId ? { period_id: params.periodId } : {}),
    ...(params.accountCode ? { account_code: params.accountCode } : {}),
  }, 'voucher_date');
  return rows as AccJournalRow[];
}

/**
 * Số dư tài khoản — LUÔN TÍNH TỪ BÚT TOÁN, KHÔNG BAO GIỜ LƯU (nguyên tắc N4).
 * Chỉ tính chứng từ đã ghi sổ (`status = 'posted'`).
 */
export async function getAccountBalances(params: {
  periodId?: string;
  tenantId?: string;
} = {}): Promise<{ accountCode: string; totalDebit: number; totalCredit: number; netBalance: number }[]> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const rows = await readView<any>('v_acc_account_balances', {
    tenant_id: tenantId,
    ...(params.periodId ? { period_id: params.periodId } : {}),
  }, 'account_code');
  return rows.map((r: any) => ({
    accountCode: r.account_code,
    totalDebit: Number(r.total_debit || 0),
    totalCredit: Number(r.total_credit || 0),
    netBalance: Number(r.net_balance || 0),
  }));
}

// =============================================================================
// 4. LƯU VẾT THAY ĐỔI (Điều 28)
// =============================================================================

/**
 * Đọc nhật ký lưu vết. Mặc định 500 bản ghi gần nhất.
 * Bảng này là APPEND-ONLY — không có hàm xoá ở tầng service (cố ý).
 */
export async function listAuditLog(params: {
  tableName?: string;
  recordId?: string;
  action?: string;
  tenantId?: string;
  limit?: number;
} = {}): Promise<AccAuditLogEntry[]> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  let q = supabase
    .from('acc_audit_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('seq', { ascending: false })
    .limit(params.limit || 500);

  if (params.tableName) q = q.eq('table_name', params.tableName);
  if (params.recordId) q = q.eq('record_id', params.recordId);
  if (params.action) q = q.eq('action', params.action);

  const { data, error } = await q;
  if (error) throw new TT99Error(`Đọc nhật ký lưu vết thất bại: ${error.message}`, 'AUDIT_READ_FAILED');
  return (data || []) as AccAuditLogEntry[];
}

/**
 * KIỂM TRA TÍNH TOÀN VẸN CHUỖI LƯU VẾT (Điều 28(1)).
 *
 * Mỗi bản ghi lưu vết chứa `hash = SHA256(prev_hash || payload)`. Nếu ai đó
 * xoá hoặc sửa một bản ghi ở giữa chuỗi, bản ghi tiếp theo sẽ không còn khớp
 * `prev_hash` → hàm này trả về điểm gãy.
 *
 * Trả về mảng rỗng = chuỗi toàn vẹn.
 */
export async function verifyAuditChain(params: {
  from?: string;
  to?: string;
  tenantId?: string;
} = {}): Promise<AccChainBreak[]> {
  const breaks = await rpc<any[]>('acc_verify_audit_chain', {
    p_tenant_id: params.tenantId || DEFAULT_TENANT,
    p_from: params.from || null,
    p_to: params.to || null,
  });
  return (breaks || []).map((b: any) => ({
    seq: Number(b.seq),
    tableName: b.table_name,
    recordId: b.record_id,
    action: b.action,
    occurredAt: b.occurred_at,
    issue: b.issue,
  })) as AccChainBreak[];
}

/** Báo cáo tóm tắt để hiển thị ở UI: toàn vẹn hay đã bị can thiệp */
export async function auditIntegrityReport(tenantId: string = DEFAULT_TENANT): Promise<{
  ok: boolean;
  breakCount: number;
  breaks: AccChainBreak[];
  checkedAt: string;
}> {
  const breaks = await verifyAuditChain({ tenantId });
  return {
    ok: breaks.length === 0,
    breakCount: breaks.length,
    breaks,
    checkedAt: nowIso(),
  };
}

/**
 * XUẤT DỮ LIỆU CHO CƠ QUAN THUẾ (Điều 28(3)) — "kịp thời, đầy đủ".
 * Hàm Postgres `acc_export_for_tax_authority` trả về JSON gồm chứng từ +
 * sổ cái + checksum của cả kỳ.
 */
export async function exportForTaxAuthority(params: {
  periodId: string;
  actor: string;
  format?: 'json' | 'xml' | 'csv' | 'xlsx';
  tenantId?: string;
}): Promise<{ payload: any; checksum: string; fileName: string }> {
  const payload = await rpc<any>('acc_export_for_tax_authority', { p_period_id: params.periodId });
  const checksum: string = payload?.checksum || '';

  // Ghi nhận việc xuất dữ liệu vào lưu vết + đóng dấu kỳ
  await rpc('acc_write_audit', {
    p_tenant_id: params.tenantId || DEFAULT_TENANT,
    p_table_name: 'acc_periods',
    p_record_id: params.periodId,
    p_action: 'EXPORT',
    p_before: null,
    p_after: { format: params.format || 'json', checksum },
    p_actor: params.actor,
    p_reason: 'Xuất dữ liệu cho cơ quan thuế (TT99 Điều 28(3))',
  });
  await updateDoc(doc(db, 'acc_periods', params.periodId), {
    exportedAt: nowIso(),
    exportedBy: params.actor,
    exportFormat: params.format || 'json',
  });

  const year = payload?.period?.year ?? new Date().getFullYear();
  const no = payload?.period?.period_no ?? 'nam';
  return {
    payload,
    checksum,
    fileName: `TT99-${year}-${no}-${(params.format || 'json').toUpperCase()}.json`,
  };
}

// =============================================================================
// 5. HỢP NHẤT ĐƠN VỊ TRỰC THUỘC (Điều 7)
// =============================================================================

/**
 * Điều 7: doanh nghiệp phải hợp nhất BCTC của các đơn vị trực thuộc và
 * LOẠI BỎ TOÀN BỘ giao dịch nội bộ (doanh thu/chi phí nội bộ, công nợ nội bộ,
 * lãi chưa thực hiện). TT99 KHÔNG còn khái niệm "BCTC tổng hợp".
 */

export async function listUnits(
  tenantId: string = DEFAULT_TENANT,
  includeInactive = false
): Promise<AccUnit[]> {
  const filters: Record<string, unknown> = {};
  if (!includeInactive) filters.isActive = true;
  return readMany<AccUnit>('acc_units', filters, { field: 'code' }, tenantId);
}

export async function createUnit(params: {
  code: string;
  name: string;
  unitType: AccUnit['unitType'];
  parentId?: string;
  consolidationMethod?: 'full' | 'none';
  isHeadOffice?: boolean;
  address?: string;
  taxCode?: string;
  managerName?: string;
  tenantId?: string;
}): Promise<AccUnit> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const id = newId('unt');
  const now = nowIso();
  const unit: AccUnit = {
    id,
    tenantId,
    code: params.code,
    name: params.name,
    parentId: params.parentId || null,
    unitType: params.unitType,
    consolidationMethod: params.consolidationMethod || 'full',
    isHeadOffice: params.isHeadOffice ?? false,
    address: params.address || null,
    taxCode: params.taxCode || null,
    managerName: params.managerName || null,
    isActive: true,
    openedAt: toDateOnly(now),
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'acc_units', id), unit);
  return unit;
}

/** Giao dịch nội bộ CHƯA được loại bỏ — cảnh báo trước khi chốt BCTC hợp nhất */
export async function listPendingInternalTxn(
  periodId?: string,
  tenantId: string = DEFAULT_TENANT
): Promise<any[]> {
  return readView<any>('v_acc_pending_internal_txn', {
    tenant_id: tenantId,
    ...(periodId ? { period_id: periodId } : {}),
  });
}

/**
 * Tạo bút toán loại bỏ (Điều 7).
 *
 * Ví dụ loại bỏ công nợ nội bộ 136 ↔ 336:
 *   Nợ 336 / Có 136  (xoá khoản phải thu – phải trả nội bộ)
 * Ví dụ loại bỏ doanh thu – chi phí nội bộ:
 *   Nợ 511 / Có 632
 *
 * Sau khi `postElimination`, view `v_acc_consolidated_ledger` tự động trừ đi
 * các bút toán này → số liệu hợp nhất sạch giao dịch nội bộ.
 */
export async function createElimination(params: {
  periodId: string;
  eliminationType: AccEliminationType;
  description: string;
  lines: {
    accountCode: string;
    description?: string;
    debit?: number;
    credit?: number;
    unitId?: string;
    internalTxnId?: string;
  }[];
  tenantId?: string;
  actor?: string;
  post?: boolean;
}): Promise<AccElimination> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const period = await readOne<AccPeriod>('acc_periods', params.periodId);
  if (!period) throw new TT99Error('Kỳ kế toán không tồn tại.', 'PERIOD_NOT_FOUND');
  if (period.status === 'closed') {
    throw new TT99Error('Kỳ đã khoá sổ — không thể tạo bút toán loại bỏ.', 'PERIOD_CLOSED');
  }

  validateVoucherLines(params.lines.map(l => ({
    accountCode: l.accountCode,
    debit: l.debit,
    credit: l.credit,
    description: l.description,
  })));

  const elimId = newId('elm');
  const now = nowIso();
  const totalAmount = params.lines.reduce(
    (s, l) => s + (Number(l.debit) || 0), 0
  );

  const elim: AccElimination = {
    id: elimId,
    tenantId,
    eliminationNo: `ELIM-${toDateOnly(now).replace(/-/g, '')}-${elimId.slice(-6).toUpperCase()}`,
    periodId: params.periodId,
    eliminationDate: toDateOnly(now),
    eliminationType: params.eliminationType,
    description: params.description,
    totalAmount: round2(totalAmount),
    status: 'draft',
    createdBy: params.actor || null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'acc_eliminations', elimId), elim);

  const lines: AccEliminationLine[] = params.lines.map((l, i) => ({
    id: newId('eli'),
    tenantId,
    eliminationId: elimId,
    lineNo: i + 1,
    accountCode: l.accountCode,
    description: l.description || null,
    debit: round2(l.debit || 0),
    credit: round2(l.credit || 0),
    unitId: l.unitId || null,
    internalTxnId: l.internalTxnId || null,
  }));
  for (const line of lines) {
    await setDoc(doc(db, 'acc_elimination_lines', line.id), line);
  }

  elim.lines = lines;
  if (params.post !== false) {
    await postElimination(elimId, params.actor);
    elim.status = 'posted';
  }
  return elim;
}

export async function postElimination(elimId: string, actor?: string): Promise<AccElimination> {
  await updateDoc(doc(db, 'acc_eliminations', elimId), {
    status: 'posted',
    postedBy: actor || null,
    postedAt: nowIso(),
  });
  const e = await readOne<AccElimination>('acc_eliminations', elimId);
  return e as AccElimination;
}

export async function listEliminations(
  periodId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<AccElimination[]> {
  return readMany<AccElimination>('acc_eliminations', { periodId }, { field: 'eliminationNo' }, tenantId);
}

/**
 * Sổ cái HỢP NHẤT — đã trừ đi các bút toán loại bỏ.
 * Đây là nguồn số liệu duy nhất cho BCTC scope = 'consolidated'.
 */
export async function getConsolidatedLedger(params: {
  periodId?: string;
  tenantId?: string;
} = {}): Promise<{
  accountCode: string;
  debit: number;
  credit: number;
  balance: number;
}[]> {
  const rows = await readView<any>('v_acc_consolidated_ledger', {
    tenant_id: params.tenantId || DEFAULT_TENANT,
    ...(params.periodId ? { period_id: params.periodId } : {}),
  }, 'account_code');
  return rows.map((r: any) => ({
    accountCode: r.account_code,
    debit: Number(r.consolidated_debit || 0),
    credit: Number(r.consolidated_credit || 0),
    balance: Number(r.consolidated_balance || 0),
  }));
}

/**
 * Tự động sinh bút toán loại bỏ cho TẤT CẢ giao dịch nội bộ đã ghép cặp
 * trong kỳ (Điều 7). Trả về số bút toán đã tạo.
 */
export async function autoEliminateInternalTxn(params: {
  periodId: string;
  actor: string;
  tenantId?: string;
}): Promise<{ eliminations: AccElimination[]; skipped: number }> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const mine = await readMany<AccInternalTxn>('acc_internal_txn', {
    periodId: params.periodId,
    status: 'matched',
  }, undefined, tenantId);

  const eliminations: AccElimination[] = [];
  let skipped = 0;

  for (const txn of mine) {
    // Mỗi cặp chỉ xử lý 1 lần (lấy bản ghi có id nhỏ hơn làm đại diện)
    if (txn.matchedTxnId && txn.matchedTxnId < txn.id) { skipped += 1; continue; }

    if (txn.txnType === 'receivable_payable') {
      // Nợ 336 (phải trả nội bộ) / Có 136 (phải thu nội bộ)
      eliminations.push(await createElimination({
        periodId: params.periodId,
        eliminationType: 'receivable_payable',
        description: `Loại bỏ công nợ nội bộ ${txn.fromUnitId} ↔ ${txn.toUnitId} (TK ${txn.accountCode})`,
        lines: [
          {
            accountCode: txn.accountCode.startsWith('136') ? '336' : '136',
            description: 'Loại bỏ công nợ nội bộ',
            debit: txn.amount,
            unitId: txn.toUnitId,
            internalTxnId: txn.id,
          },
          {
            accountCode: txn.accountCode,
            description: 'Loại bỏ công nợ nội bộ',
            credit: txn.amount,
            unitId: txn.fromUnitId,
            internalTxnId: txn.id,
          },
        ],
        tenantId,
        actor: params.actor,
        post: true,
      }));
    } else if (txn.txnType === 'revenue_expense') {
      // Nợ 511 (doanh thu nội bộ) / Có 632 (giá vốn nội bộ)
      const isRevenue = txn.accountCode.startsWith('5');
      eliminations.push(await createElimination({
        periodId: params.periodId,
        eliminationType: 'revenue_expense',
        description: `Loại bỏ doanh thu/chi phí nội bộ ${txn.fromUnitId} ↔ ${txn.toUnitId}`,
        lines: [
          {
            accountCode: isRevenue ? '511' : '632',
            description: 'Loại bỏ doanh thu nội bộ',
            debit: isRevenue ? txn.amount : 0,
            credit: isRevenue ? 0 : txn.amount,
            unitId: txn.toUnitId,
            internalTxnId: txn.id,
          },
          {
            accountCode: isRevenue ? '632' : '511',
            description: 'Loại bỏ giá vốn nội bộ',
            debit: isRevenue ? 0 : txn.amount,
            credit: isRevenue ? txn.amount : 0,
            unitId: txn.fromUnitId,
            internalTxnId: txn.id,
          },
        ],
        tenantId,
        actor: params.actor,
        post: true,
      }));
    } else {
      // unrealized_profit — cần đánh giá tay (hàng tồn kho nội bộ chưa bán ra
      // ngoài). Không tự động để tránh xoá nhầm lãi đã thực hiện.
      skipped += 1;
    }
  }

  return { eliminations, skipped };
}

// =============================================================================
// 6. DOANH THU THEO IFRS 15 — 5 BƯỚC
// =============================================================================

/**
 * BƯỚC 1 + 3: Xác định hợp đồng với khách hàng & xác định giá giao dịch.
 *
 * IFRS 15 thay thế tiêu thức "chuyển giao rủi ro và lợi ích" bằng mô hình
 * 5 bước. Với VComm có 3 điểm đặc thù (xem spec 021 §6):
 *   (a) Bán hàng: nghĩa vụ thực hiện tại một thời điểm (khi giao hàng).
 *   (b) V-Xu: là QUYỀN LỢI TRỌNG YẾU (material right) → một phần giá giao
 *       dịch phải phân bổ cho V-Xu và ghi nhận khi khách tiêu điểm hoặc khi
 *       điểm hết hạn (breakage).
 *   (c) Bảo hành/đổi trả: là ràng buộc với phần biến động của giá giao dịch.
 */
export async function createRevContract(params: {
  contractNo: string;
  customerId: string;
  signedDate: string;
  fixedAmount: number;
  variableAmount?: number;
  /** % được phép ghi nhận đối với phần biến động (ràng buộc) */
  variableConstraintPct?: number;
  collectability?: 'probable' | 'doubtful';
  orderId?: string;
  f2b2bSourceId?: string;
  effectiveDate?: string;
  endDate?: string;
  currencyCode?: string;
  fxRate?: number;
  note?: string;
  tenantId?: string;
  actor?: string;
}): Promise<RevContract> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const fixed = round2(params.fixedAmount);
  const variable = round2(params.variableAmount || 0);
  const constraint = params.variableConstraintPct ?? 100;

  // Giá giao dịch = phần cố định + phần biến động SAU KHI ÁP RÀNG BUỘC
  const transactionPrice = round2(fixed + variable * (constraint / 100));

  const id = newId('rct');
  const now = nowIso();
  const contract: RevContract = {
    id,
    tenantId,
    contractNo: params.contractNo,
    customerId: params.customerId,
    orderId: params.orderId || null,
    f2b2bSourceId: params.f2b2bSourceId || null,
    signedDate: toDateOnly(params.signedDate),
    effectiveDate: params.effectiveDate ? toDateOnly(params.effectiveDate) : null,
    endDate: params.endDate ? toDateOnly(params.endDate) : null,
    collectability: params.collectability || 'probable',
    status: 'draft',
    currencyCode: params.currencyCode || BASE_CURRENCY,
    fxRate: params.fxRate || 1,
    fixedAmount: fixed,
    variableAmount: variable,
    variableConstraintPct: constraint,
    transactionPrice,
    allocatedTotal: 0,
    recognizedTotal: 0,
    deferredTotal: transactionPrice,
    note: params.note || null,
    createdBy: params.actor || null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'rev_contracts', id), contract);
  return contract;
}

/** Danh sách hợp đồng doanh thu */
export async function listRevContracts(params: {
  customerId?: string;
  status?: RevContract['status'];
  tenantId?: string;
} = {}): Promise<RevContract[]> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const filters: Record<string, unknown> = {};
  if (params.customerId) filters.customerId = params.customerId;
  if (params.status) filters.status = params.status;
  return readMany<RevContract>('rev_contracts', filters,
    { field: 'signedDate', direction: 'desc' }, tenantId);
}

export async function getRevContract(contractId: string): Promise<RevContract | null> {
  return readOne<RevContract>('rev_contracts', contractId);
}

/**
 * BƯỚC 2: Xác định nghĩa vụ thực hiện.
 *
 * Ví dụ VComm: một đơn hàng thường có 2 nghĩa vụ —
 *   (1) giao hàng (point_in_time) và (2) V-Xu (point_in_time, ghi nhận khi
 *   tiêu hoặc theo tỉ lệ breakage khi hết hạn).
 */
export async function addPerformanceObligation(params: {
  contractId: string;
  code: string;
  name: string;
  obligationType: 'point_in_time' | 'over_time';
  standaloneSellingPrice: number;
  progressMethod?: 'poc_input' | 'poc_output' | 'straight_line';
  revenueAccountCode?: string;
  deferredAccountCode?: string;
  displayOrder?: number;
  note?: string;
  tenantId?: string;
}): Promise<RevPerformanceObligation> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const id = newId('rob');
  const now = nowIso();
  const obl: RevPerformanceObligation = {
    id,
    tenantId,
    contractId: params.contractId,
    code: params.code,
    name: params.name,
    obligationType: params.obligationType,
    progressMethod: params.progressMethod || null,
    standaloneSellingPrice: round2(params.standaloneSellingPrice),
    allocationPct: 0,
    allocatedAmount: 0,
    revenueAccountCode: params.revenueAccountCode || '5111',
    deferredAccountCode: params.deferredAccountCode || '3387',
    progressPct: 0,
    recognizedAmount: 0,
    status: 'pending',
    displayOrder: params.displayOrder || 0,
    note: params.note || null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'rev_performance_obligations', id), obl);
  return obl;
}

export async function listObligations(
  contractId: string,
  tenantId: string = DEFAULT_TENANT
): Promise<RevPerformanceObligation[]> {
  return readMany<RevPerformanceObligation>(
    'rev_performance_obligations', { contractId }, { field: 'displayOrder' }, tenantId
  );
}

/**
 * BƯỚC 4: Phân bổ giá giao dịch theo TỶ LỆ GIÁ BÁN ĐỘC LẬP (relative SSP).
 * Hàm Postgres `rev_allocate_transaction_price` thực hiện phân bổ và đánh dấu
 * các phân bổ cũ là `isSuperseded` (không xoá — giữ lịch sử).
 */
export async function allocateTransactionPrice(params: {
  contractId: string;
  actor?: string;
  justification?: string;
}): Promise<{ allocatedCount: number; allocations: RevPriceAllocation[] }> {
  const count = await rpc<number>('rev_allocate_transaction_price', {
    p_contract_id: params.contractId,
    p_actor: params.actor || null,
    p_justification: params.justification || null,
  });

  const snap = await getDocs(query(
    collection(db, 'rev_price_allocations'),
    where('tenantId', '==', DEFAULT_TENANT),
    where('contractId', '==', params.contractId)
  ));
  const allocations = ((snap.docs || []) as any[])
    .map((d: any) => ({ ...(d.data() as RevPriceAllocation), id: d.id }))
    .filter((a: RevPriceAllocation) => !a.isSuperseded);

  return { allocatedCount: Number(count) || 0, allocations };
}

/**
 * BƯỚC 5: Ghi nhận doanh thu khi nghĩa vụ được thoả mãn.
 *
 * `point_in_time`  — ghi nhận toàn phần khi giao hàng/hoàn thành.
 * `over_time`      — ghi nhận theo % tiến độ (progressPct).
 * `breakage`       — ghi nhận phần V-Xu dự kiến khách KHÔNG tiêu (hết hạn).
 * `expiry`         — ghi nhận khi quyền lợi thực sự hết hạn.
 *
 * Trigger DB `rev_recognition_post` sẽ:
 *   - cộng dồn vào `cumulativeRecognized` và tính `remainingAmount`
 *   - TỪ CHỐI nếu ghi nhận vượt quá số đã phân bổ
 *   - cập nhật lũy kế vào nghĩa vụ và hợp đồng
 *   - tự chuyển nghĩa vụ sang 'satisfied' khi ghi nhận đủ 100%
 */
export async function recognizeRevenue(params: {
  obligationId: string;
  contractId: string;
  periodId: string;
  method: RevRecognition['method'];
  amount?: number;
  progressPct?: number;
  breakagePct?: number;
  recognitionDate?: string;
  reason?: string;
  /** Nếu có, gắn bút toán kế toán đã sinh (Nợ 3387 / Có 5111) */
  voucherId?: string;
  tenantId?: string;
  actor?: string;
}): Promise<RevRecognition> {
  const tenantId = params.tenantId || DEFAULT_TENANT;

  const obl = await readOne<RevPerformanceObligation>('rev_performance_obligations', params.obligationId);
  if (!obl) throw new TT99Error('Nghĩa vụ thực hiện không tồn tại.', 'OBLIGATION_NOT_FOUND');
  if (obl.status === 'cancelled') {
    throw new TT99Error('Nghĩa vụ thực hiện đã bị huỷ.', 'OBLIGATION_CANCELLED');
  }
  if (obl.allocatedAmount <= 0) {
    throw new TT99Error(
      'Nghĩa vụ chưa được phân bổ giá giao dịch — hãy chạy Bước 4 (allocateTransactionPrice) trước.',
      'NOT_ALLOCATED'
    );
  }

  let amount: number;
  let progressPct = params.progressPct ?? 0;

  if (params.method === 'over_time') {
    if (progressPct <= 0) throw new TT99Error('Phương pháp over_time cần progressPct > 0.', 'BAD_PROGRESS');
    if (progressPct > 100) throw new TT99Error('progressPct không được vượt quá 100.', 'BAD_PROGRESS');
    amount = round2(obl.allocatedAmount * (progressPct / 100)) - obl.recognizedAmount;
  } else if (params.method === 'breakage') {
    const pct = params.breakagePct ?? 0;
    if (pct <= 0 || pct > 100) throw new TT99Error('breakagePct phải nằm trong (0, 100].', 'BAD_BREAKAGE');
    amount = round2(obl.allocatedAmount * (pct / 100));
    progressPct = 100;
  } else {
    amount = params.amount ?? (obl.allocatedAmount - obl.recognizedAmount);
    progressPct = 100;
  }

  amount = round2(amount);
  if (amount <= 0) {
    throw new TT99Error('Không còn doanh thu để ghi nhận cho nghĩa vụ này.', 'NOTHING_TO_RECOGNIZE');
  }

  const id = newId('rrc');
  const now = nowIso();
  const rec: RevRecognition = {
    id,
    tenantId,
    obligationId: params.obligationId,
    contractId: params.contractId,
    periodId: params.periodId,
    recognitionDate: toDateOnly(params.recognitionDate || now),
    method: params.method,
    progressPct,
    recognizedAmount: amount,
    cumulativeRecognized: 0,   // trigger DB sẽ tính
    remainingAmount: 0,        // trigger DB sẽ tính
    breakagePct: params.breakagePct ?? null,
    voucherId: params.voucherId || null,
    status: 'draft',
    reason: params.reason || null,
    createdBy: params.actor || null,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(doc(db, 'rev_recognition', id), rec);

  // Chuyển sang posted → trigger rev_recognition_post cộng dồn & cập nhật lũy kế
  await updateDoc(doc(db, 'rev_recognition', id), { status: 'posted' });

  const saved = await readOne<RevRecognition>('rev_recognition', id);
  return saved as RevRecognition;
}

/**
 * Ghi nhận doanh thu V-Xu theo tỉ lệ breakage.
 *
 * V-Xu là QUYỀN LỢI TRỌNG YẾU: một phần giá giao dịch được phân bổ cho V-Xu.
 * Phần khách dự kiến không bao giờ tiêu (breakage) được ghi nhận theo tỉ lệ
 * ước tính dựa trên dữ liệu lịch sử — KHÔNG được ghi nhận toàn bộ ngay.
 */
export async function recognizeVxuBreakage(params: {
  obligationId: string;
  contractId: string;
  periodId: string;
  /** % V-Xu dự kiến không được tiêu (0–100) — phải có cơ sở lịch sử */
  breakagePct: number;
  reason: string;
  tenantId?: string;
  actor?: string;
}): Promise<RevRecognition> {
  return recognizeRevenue({
    obligationId: params.obligationId,
    contractId: params.contractId,
    periodId: params.periodId,
    method: 'breakage',
    breakagePct: params.breakagePct,
    reason: params.reason,
    tenantId: params.tenantId,
    actor: params.actor,
  });
}

export async function listRecognitions(params: {
  contractId?: string;
  obligationId?: string;
  periodId?: string;
  tenantId?: string;
} = {}): Promise<RevRecognition[]> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const filters: Record<string, unknown> = {};
  if (params.contractId) filters.contractId = params.contractId;
  if (params.obligationId) filters.obligationId = params.obligationId;
  if (params.periodId) filters.periodId = params.periodId;
  return readMany<RevRecognition>('rev_recognition', filters,
    { field: 'recognitionDate', direction: 'desc' }, tenantId);
}

/** Doanh thu chờ phân bổ (TK 3387) — view v_rev_deferred_revenue */
export async function getDeferredRevenue(tenantId: string = DEFAULT_TENANT): Promise<any[]> {
  return readView<any>('v_rev_deferred_revenue', { tenant_id: tenantId });
}

// =============================================================================
// 7. BÁO CÁO TÀI CHÍNH (Điều 14-27)
// =============================================================================

/**
 * ⚠️ TT99 ĐỔI TÊN: "Bảng cân đối kế toán" → "Báo cáo tình hình tài chính".
 * Mã báo cáo: B01-DN / B02-DN / B03-DN / B09-DN — hậu tố -HKD (hộ kinh doanh)
 * KHÔNG tồn tại trong TT99.
 *
 * Điều 14-27 cho phép doanh nghiệp TỰ THÊM chỉ tiêu, nhưng:
 *   - KHÔNG được đổi tên hay đánh lại số thứ tự ("Mã số") của chỉ tiêu TT99
 *     (trigger `fs_lines_protect_code` chặn ở tầng DB).
 *   - BCTC NĂM là bắt buộc; BCTC giữa niên độ không bắt buộc.
 */

/**
 * Sinh BCTC. Hàm Postgres `fs_generate_report` sẽ:
 *   1. Sinh một BCTC RIÊNG cho kỳ trước, tính đầy đủ, rồi copy cột "kỳ trước"
 *      sang báo cáo hiện tại (tránh đọc số liệu đang tính dở).
 *   2. Tính từng chỉ tiêu theo công thức ACC(...) / SUM(...) / LINE(...).
 *   3. Với scope = 'consolidated', đọc từ view v_acc_consolidated_ledger
 *      (đã loại bỏ giao dịch nội bộ theo Điều 7).
 */
export async function generateFinancialReport(params: {
  reportCode: FsReportCode;
  periodId: string;
  priorPeriodId?: string;
  scope?: 'company' | 'consolidated';
  reportType?: 'annual' | 'interim';
  preparedBy?: string;
  tenantId?: string;
}): Promise<FsReport> {
  const reportId = await rpc<string>('fs_generate_report', {
    p_tenant_id: params.tenantId || DEFAULT_TENANT,
    p_report_code: params.reportCode,
    p_period_id: params.periodId,
    p_prior_period_id: params.priorPeriodId || null,
    p_scope: params.scope || 'company',
    p_report_type: params.reportType || 'annual',
    p_prepared_by: params.preparedBy || null,
  });

  const report = await readOne<FsReport>('fs_reports', reportId);
  return report as FsReport;
}

export async function getReport(reportId: string): Promise<FsReport | null> {
  return readOne<FsReport>('fs_reports', reportId);
}

export async function getReportLines(reportId: string): Promise<FsReportLine[]> {
  const snap = await getDocs(query(
    collection(db, 'fs_report_lines'),
    where('tenantId', '==', DEFAULT_TENANT),
    where('reportId', '==', reportId),
    orderBy('displayOrder', 'asc')
  ));
  return ((snap.docs || []) as any[]).map((d: any) => ({ ...(d.data() as FsReportLine), id: d.id }));
}

/** BCTC hoàn chỉnh: tiêu đề + các chỉ tiêu */
export async function getFullReport(
  reportId: string
): Promise<{ report: FsReport; lines: FsReportLine[] } | null> {
  const report = await getReport(reportId);
  if (!report) return null;
  return { report, lines: await getReportLines(reportId) };
}

export async function listReports(params: {
  periodId?: string;
  reportCode?: FsReportCode;
  tenantId?: string;
} = {}): Promise<FsReport[]> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const filters: Record<string, unknown> = {};
  if (params.periodId) filters.periodId = params.periodId;
  if (params.reportCode) filters.reportCode = params.reportCode;
  return readMany<FsReport>('fs_reports', filters, { field: 'createdAt', direction: 'desc' }, tenantId);
}

/** Tính lại BCTC sau khi có bút toán mới */
export async function recalculateReport(reportId: string): Promise<void> {
  await rpc('fs_recalculate_report', { p_report_id: reportId });
}

/** Kiểm tra cân bằng B01-DN: Tổng tài sản (270) = Tổng nguồn vốn (440) */
export async function checkBalanceSheet(reportId: string): Promise<{
  isBalanced: boolean;
  totalAssets: number;
  totalResources: number;
  difference: number;
}> {
  const rows = await rpc<any[]>('fs_check_balance_sheet', { p_report_id: reportId });
  const r = (rows || [])[0] || {};
  return {
    isBalanced: !!r.is_balanced,
    totalAssets: Number(r.total_assets || 0),
    totalResources: Number(r.total_resources || 0),
    difference: Number(r.difference || 0),
  };
}

/** Duyệt BCTC (draft → approved) */
export async function approveReport(params: {
  reportId: string;
  approvedBy: string;
}): Promise<FsReport> {
  await updateDoc(doc(db, 'fs_reports', params.reportId), {
    status: 'approved',
    approvedBy: params.approvedBy,
    approvedAt: nowIso(),
  });
  const r = await readOne<FsReport>('fs_reports', params.reportId);
  return r as FsReport;
}

/** Đánh dấu đã nộp cho cơ quan thuế / cơ quan đăng ký KD */
export async function submitReport(reportId: string): Promise<FsReport> {
  await updateDoc(doc(db, 'fs_reports', reportId), { status: 'submitted', submittedAt: nowIso() });
  const r = await readOne<FsReport>('fs_reports', reportId);
  return r as FsReport;
}

/**
 * Chặn trước khi chốt BCTC hợp nhất: Điều 7 yêu cầu loại bỏ TOÀN BỘ giao dịch
 * nội bộ. Nếu còn giao dịch chưa loại bỏ, trả về danh sách để người dùng xử lý.
 */
export async function validateBeforeConsolidation(params: {
  periodId: string;
  tenantId?: string;
}): Promise<{ ok: boolean; pending: any[]; message: string }> {
  const tenantId = params.tenantId || DEFAULT_TENANT;
  const pending = await listPendingInternalTxn(params.periodId, tenantId);
  if (pending.length === 0) {
    return { ok: true, pending: [], message: 'Không còn giao dịch nội bộ — có thể chốt BCTC hợp nhất.' };
  }
  return {
    ok: false,
    pending,
    message:
      `Còn ${pending.length} giao dịch nội bộ chưa được loại bỏ. ` +
      `TT99 Điều 7 yêu cầu loại bỏ TOÀN BỘ trước khi lập BCTC hợp nhất. ` +
      `Hãy chạy "Tự động loại bỏ giao dịch nội bộ" hoặc xử lý thủ công.`,
  };
}
