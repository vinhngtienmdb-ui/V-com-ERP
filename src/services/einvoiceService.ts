import { requireReadyProvider, getIntegrationConfig, onIntegrationConfigChanged } from './integrationConfigService';
import { resolveProvider } from './einvoiceProviders';
import { MemoryCache } from '../lib/cache'; // GĐ 3.3

/**
 * GĐ 3.1 — Đọc id nhà cung cấp HĐĐT từ cấu hình tích hợp.
 *
 *  Hiện tại `integration_configs` dùng một key duy nhất 'einvoice'; nếu bản ghi có
 *  field `providerId` (vd 'viettel'/'vnpt'/'misa') thì dùng provider đó. Không có →
 *  trả null để registry chọn mặc định 'generic' (giữ hành vi cũ).
 *
 *  Fail-soft: lỗi đọc cấu hình (RLS/offline) → trả null, KHÔNG chặn phát hành.
 */
/**
 * Cache riêng cho cấu hình nhà cung cấp HĐĐT (GĐ 3.3).
 *
 * Tại sao cache ở đây: `configuredEInvoiceProviderId()` bị gọi ở MỖI lần phát
 * hành và MỖI lần xử lý sai sót → mỗi lần là 1 query Supabase lặp lại cho một
 * giá trị hầu như không đổi.
 *
 * ⚠️ Rủi ro đã cân nhắc: đổi nhà cung cấp HĐĐT là QUYẾT ĐỊNH PHÁP LÝ (phát hành
 * sai provider = sai mẫu đã đăng ký với CQT). Vì vậy:
 *   · TTL chỉ **30 giây** (đủ gom burst, không đủ để "quên" thay đổi lâu)
 *   · Có hàm `invalidateEInvoiceProviderCache()` để gọi NGAY sau khi admin lưu cấu hình
 */
const providerIdCache = new MemoryCache<string | null>({ ttlMs: 30_000, maxEntries: 8 });
const PROVIDER_ID_CACHE_KEY = 'einvoice.providerId';

/** Xoá cache cấu hình provider — BẮT BUỘC gọi sau khi admin đổi nhà cung cấp. */
export function invalidateEInvoiceProviderCache(): void {
  providerIdCache.delete(PROVIDER_ID_CACHE_KEY);
}

async function loadProviderId(): Promise<string | null> {
  try {
    const cfg: any = await getIntegrationConfig('einvoice');
    return (cfg?.config?.providerId as string) || null;
  } catch {
    return null;
  }
}

export function configuredEInvoiceProviderId(): Promise<string | null> {
  // MemoryCache phân biệt được `null` (đã lưu) với `undefined` (chưa có) →
  // cả trường hợp "chưa cấu hình provider" cũng được cache, nhưng vẫn tự hết hạn.
  return providerIdCache.remember(PROVIDER_ID_CACHE_KEY, loadProviderId);
}

// Admin lưu/đổi cấu hình 'einvoice' → xoá cache NGAY (không chờ 30s TTL),
// tránh phát hành HĐ bằng nhà cung cấp CŨ. Đăng ký qua listener để không tạo
// import vòng với integrationConfigService.
onIntegrationConfigChanged((provider) => {
  if (provider === 'einvoice') invalidateEInvoiceProviderCache();
});
import { computeOrderTax, getTaxRules, LineItemTax } from './taxService';
import { db, doc, getDoc, updateDoc, collection, addDoc, getDocs, query, where, serverTimestamp } from './dbService';
import { assertSellerTaxMethodForIssue, type TaxMethod } from './einvoiceTax';

/**
 * E-Invoice Adapter — TT 91/2026/TT-BTC
 * Nhà cung cấp được CQT cấp phép qua config: MISA / VNPT / FPT.
 *
 * Luồng phát hành chuẩn TT 91/2026:
 * 1. Tạo hóa đơn_draft (mẫu BC22 đã đăng ký) từ order
 * 2. Ký số bằng chứng thư của DN (provider lo phần ký)
 * 3. Gửi CQT mã hóa đơn (provider tự truyền tải)
 * 4. Nhận mã tra cứu + ngày ký → lưu vào order
 *
 * Khi chưa add key → throw 'not configured' rõ ràng, UI hiển thị hướng dẫn.
 */

export interface EInvoiceDraft {
  invoiceTemplate: string;
  invoiceSeries: string;
  invoiceNumber: string;
  issueDate: string;
  sellerInfo: { name: string; taxCode: string; address: string };
  buyerInfo: { name: string; taxCode?: string; email?: string; phone?: string };
  items: Array<{ name: string; quantity: number; unitPrice: number; vatRate: number; vatAmount: number }>;
  subtotal: number;
  vatAmount: number;
  totalWithVat: number;
  currency: 'VND';
  paymentMethod: string;
  orderRef: string;
}

export interface EInvoiceResult {
  success: boolean;
  invoiceNumber?: string;
  lookupCode?: string;      // mã tra cứu CQT
  signedAt?: string;
  xmlBlob?: string;          // XML gốc từ provider (tải về in)
  providerMessage?: string;
}

/**
 * ND 254/2026 Điều 10: người mua là cá nhân không cung cấp thông tin
 * thì ghi "Bán cho người tiêu dùng" (không để trống, không ghi "Khách lẻ").
 */
function resolveBuyerName(order: any): string {
  const name = (order?.customerName ?? '').toString().trim();
  return name || 'Bán cho người tiêu dùng';
}

/** Tạo payload hóa đơn chuẩn từ order — độc lập provider */
export function buildEInvoiceDraft(order: any, items: LineItemTax[], legalInfo: {
  companyName: string; taxCode: string; address: string;
}): EInvoiceDraft {
  const tax = computeOrderTax(items);
  const now = new Date();
  return {
    invoiceTemplate: '7',
    invoiceSeries: '7K26XYY',
    invoiceNumber: `HD-${now.getFullYear()}-${Date.now().toString().slice(-8)}`,
    issueDate: now.toISOString(),
    sellerInfo: {
      name: legalInfo.companyName,
      taxCode: legalInfo.taxCode,
      address: legalInfo.address
    },
    buyerInfo: {
      name: resolveBuyerName(order),
      taxCode: order.buyerTaxCode || undefined,
      email: order.customerEmail || undefined,
      phone: order.customerPhone || undefined
    },
    items: tax.lines.map(l => ({
      name: l.name,
      quantity: l.qty,
      unitPrice: l.price,
      vatRate: l.vatRate ?? 0,
      vatAmount: l.lineVat
    })),
    subtotal: tax.subtotal,
    vatAmount: tax.vatAmount,
    totalWithVat: tax.subtotal + tax.vatAmount,
    currency: 'VND',
    paymentMethod: order.paymentMethod || 'cod',
    orderRef: order.id
  };
}

/** Kiểm tra sẵn sàng (không throw) — UI dùng để disable nút phát hành */
export async function isEInvoiceReady(): Promise<boolean> {
  try {
    const cfg = await getIntegrationConfig('einvoice');
    return !!(cfg?.is_enabled && cfg.config.endpoint && cfg.config.api_key);
  } catch {
    return false;
  }
}

/**
 * Phát hành hóa đơn điện tử qua provider đã cấu hình.
 * Gọi server proxy /api/einvoice/issue — key nằm ở server, client chỉ gửi draft.
 */
export async function issueEInvoice(orderId: string, order: any, items: LineItemTax[], legalInfo: {
  companyName: string; taxCode: string; address: string;
}): Promise<EInvoiceResult> {
  // Gate: bắt lỗi friendly khi chưa add key
  await requireReadyProvider('einvoice');

  // Nạp luật thuế thật từ DB/cache TRƯỚC khi build draft. `buildEInvoiceDraft`
  // là hàm đồng bộ (đọc snapshot) — nếu bỏ qua bước này mà snapshot chưa được
  // prime, hóa đơn sẽ mang thuế suất hardcode. Sai thuế trên HĐ = lỗi pháp lý.
  await getTaxRules();

  const draft = buildEInvoiceDraft(order, items, legalInfo);

  // GĐ 3.1 — đi qua provider registry thay vì fetch cứng một endpoint.
  // Provider mặc định (GenericHttpProvider) giữ nguyên POST /api/einvoice/issue → không hồi quy.
  const data = await resolveProvider(await configuredEInvoiceProviderId()).call({
    action: 'issue',
    refId: orderId,
    payload: { orderId, draft },
  });
  // resolveProvider() ném lỗi nếu cấu hình chỉ định adapter chưa đăng ký —
  // không âm thầm rơi về mặc định, tránh phát hành nhầm nhà cung cấp.

  // Lưu kết quả vào order (giữ schema hiện tại Orders.tsx: einvoiceStatus/Xml/LookupCode/SignedAt)
  const orderRef = { path: `orders/${orderId}`, tableName: 'orders', id: orderId } as any;
  await updateDoc(orderRef, {
    einvoiceStatus: 'issued',
    einvoiceXml: data.xmlBlob || null,
    einvoiceLookupCode: data.lookupCode || null,
    einvoiceSignedAt: data.signedAt || new Date().toISOString()
  });

  return {
    success: true,
    invoiceNumber: data.invoiceNumber,
    lookupCode: data.lookupCode,
    signedAt: data.signedAt,
    xmlBlob: data.xmlBlob,
    providerMessage: data.message
  };
}

/**
 * XỬ LÝ HÓA ĐƠN SAI SÓT — TT 91/2026/TT-BTC Điều 10.
 *
 * TT 91/2026 Điều 10 định nghĩa 4 luồng xử lý và KHÔNG có khái niệm "hủy":
 *  1. announce_adjust     — Sai sót TÊN/ĐỊA CHỈ người mua (MST & chỉ tiêu thuế đúng):
 *                           thông báo CQT theo Mẫu 04/SS-HĐĐT rồi lập HĐ ĐIỀU CHỈNH.
 *  2. replace             — Sai sót HÀNG HÓA/SỐ LƯỢNG/ĐƠN GIÁ/THUẾ (ảnh hưởng số thuế):
 *                           lập HĐ THAY THẾ, HĐ cũ chuyển sang trạng thái 'replaced'.
 *  3. (ràng buộc)         — HĐ khởi tạo từ MÁY TÍNH TIỀN (kênh hub_pos / POS) CHỈ được thay thế
 *                           (TT 91/2026 Điều 10.1.c) — không được điều chỉnh.
 *                           (HĐ TMĐT nền tảng mẫu 7 vẫn được điều chỉnh bình thường.)
 *  4. monthly_consolidate — Gộp tháng các HĐ máy tính tiền theo Mẫu 01/BK-ĐCTT.
 */

export type InvoiceErrorFlow = 'announce_adjust' | 'replace' | 'monthly_consolidate';

export interface InvoiceErrorParams {
  orderId: string;
  flow: InvoiceErrorFlow;
  reason: string;
  /** Kênh phát hành: 'platform' = TMĐT nền tảng (được điều chỉnh); 'hub_pos' = máy tính tiền/POS (chỉ thay thế) */
  channel?: 'platform' | 'hub_pos';
  /** Mẫu hóa đơn (1/2/6/7) — thông tin, không quyết định ràng buộc thay thế */
  formNo?: string;
  /** announce_adjust: liệt kê trường được điều chỉnh (tên/địa chỉ) */
  adjustFields?: string[];
  /** replace: số HĐ gốc bị thay thế */
  originalInvoiceNo?: string;
  /** monthly_consolidate: kỳ YYYY-MM */
  period?: string;
}

export interface EInvoiceErrorResult {
  success: boolean;
  flow: InvoiceErrorFlow;
  status: 'adjusted' | 'replaced' | 'consolidated';
  consolidationRef?: string;
  providerMessage?: string;
}

/**
 * Hàm thuần (không mạng) — kiểm tra tính hợp lệ của luồng xử lý theo TT 91 Điều 10.
 * Throw Error rõ ràng khi vi phạm; test gọi trực tiếp hàm này (deterministic).
 */
export function validateInvoiceErrorFlow(p: InvoiceErrorParams): void {
  const reason = (p.reason || '').trim();
  if (!reason) {
    throw new Error('Lý do xử lý hóa đơn là bắt buộc theo TT 91/2026 Điều 10.');
  }
  // TT 91/2026 Điều 10.1.c — chỉ HĐ từ máy tính tiền/POS (hub_pos) mới bị ràng buộc thay thế
  const isCashRegister = p.channel === 'hub_pos';
  switch (p.flow) {
    case 'announce_adjust': {
      // TT 91/2026 Điều 10.1.c — HĐ máy tính tiền chỉ được thay thế, không điều chỉnh
      if (isCashRegister) {
        throw new Error(
          'Hóa đơn khởi tạo từ máy tính tiền (mẫu 7) chỉ được lập hóa đơn THAY THẾ, ' +
          'không được điều chỉnh (TT 91/2026/TT-BTC Điều 10.1.c).'
        );
      }
      if (!p.adjustFields || p.adjustFields.length === 0) {
        throw new Error('Luồng "điều chỉnh" yêu cầu liệt kê trường được điều chỉnh (tên/địa chỉ).');
      }
      break;
    }
    case 'replace': {
      if (!p.originalInvoiceNo || !p.originalInvoiceNo.trim()) {
        throw new Error('Luồng "thay thế" yêu cầu số hóa đơn gốc bị thay thế.');
      }
      break;
    }
    case 'monthly_consolidate': {
      if (!p.period || !/^\d{4}-(0[1-9]|1[0-2])$/.test(p.period)) {
        throw new Error('Luồng "gộp tháng" yêu cầu kỳ theo định dạng YYYY-MM.');
      }
      break;
    }
  }
}

/**
 * Xử lý hóa đơn sai sót theo 1 trong 4 luồng TT 91/2026 Điều 10.
 * Thay thế hoàn toàn hàm cancelEInvoice cũ (khái niệm "hủy" không tồn tại).
 */
export async function handleInvoiceError(p: InvoiceErrorParams): Promise<EInvoiceErrorResult> {
  await requireReadyProvider('einvoice');
  validateInvoiceErrorFlow(p);

  // GĐ 3.1 — đi qua provider registry (giữ nguyên POST /api/einvoice/handle-error
  // nhờ GenericHttpProvider map 3 luồng sai sót về cùng path cũ → không hồi quy).
  const data: any = await resolveProvider(await configuredEInvoiceProviderId()).call({
    action: p.flow,
    refId: p.orderId,
    payload: { ...(p as unknown as Record<string, unknown>) },
  });
  if (data.status !== 'success') {
    throw new Error(data.message || 'Xử lý hóa đơn sai sót thất bại.');
  }

  const now = new Date().toISOString();
  const patch: Record<string, any> = {
    einvoiceStatus: data.invoiceStatus,
    einvoiceErrorFlow: p.flow,
    einvoiceErrorReason: p.reason.trim(),
    einvoiceErrorHandledAt: now
  };
  if (p.flow === 'replace') patch.einvoiceReplacesInvoiceNo = p.originalInvoiceNo;
  if (p.flow === 'announce_adjust') patch.einvoiceAdjustedAt = now;
  if (p.flow === 'monthly_consolidate') patch.einvoiceConsolidationRef = data.consolidationRef;

  const orderRef = { path: `orders/${p.orderId}`, tableName: 'orders', id: p.orderId } as any;
  await updateDoc(orderRef, patch);

  return {
    success: true,
    flow: p.flow,
    status: data.invoiceStatus,
    consolidationRef: data.consolidationRef,
    providerMessage: data.message
  };
}

/**
 * ỦY NHIỆM PHÁT HÀNH HĐĐT (TT 91/2026 Điều 9) — S3.
 * VComm được Seller ủy nhiệm phát hành HĐĐT thay Seller.
 * Nghĩa vụ nền tảng: 9.1.đ (thông báo gian hàng) + 9.3.c (thông báo CQT Mẫu 01/ĐKTĐ-HĐĐT).
 */

export type DelegationStatus = 'pending' | 'active' | 'suspended' | 'revoked';
export type InvoiceForm = '1' | '2' | '7';

export interface DelegationRecord {
  id?: string;
  sellerId: string;
  delegatorName: string;
  delegatorTaxCode: string;
  status: DelegationStatus;
  delegatedFrom: string;
  delegatedTo?: string;
  authDocRef?: string;
  invoiceForm: InvoiceForm;
  invoiceSymbol: string;
  templateCode?: string;
  noticePublishedAt?: string;
  noticeUrl?: string;
  cqtNotifiedAt?: string;
  cqtNoticeRef?: string;
  /** Phương pháp tính thuế đang hiệu lực của Seller (đọc từ sellers.tax_method). */
  sellerTaxMethod?: TaxMethod;
}

export interface CreateDelegationParams {
  sellerId: string;
  delegatorName: string;
  delegatorTaxCode: string;
  delegatedFrom: string;
  delegatedTo?: string;
  authDocRef?: string;
  invoiceForm?: InvoiceForm;
  invoiceSymbol?: string;
  templateCode?: string;
}

const DEFAULT_SYMBOLS: Record<InvoiceForm, string> = {
  '1': '1K26TYY', '2': '2K26TYY', '7': '7K26XYY'
};

/** Tạo ủy nhiệm (lưu Firestore). Ban đầu status='pending' — chưa được phát hành. */
export async function createDelegation(p: CreateDelegationParams): Promise<DelegationRecord> {
  const form = p.invoiceForm || '7';
  const ref = await addDoc(collection(db, 'einvoice_delegations'), {
    seller_id: p.sellerId,
    delegator_name: p.delegatorName,
    delegator_tax_code: p.delegatorTaxCode,
    status: 'pending',
    delegated_from: p.delegatedFrom,
    delegated_to: p.delegatedTo || null,
    auth_doc_ref: p.authDocRef || null,
    invoice_form: form,
    invoice_symbol: p.invoiceSymbol || DEFAULT_SYMBOLS[form],
    template_code: p.templateCode || null,
    notice_published_at: null,
    notice_url: null,
    cqt_notified_at: null,
    cqt_notice_ref: null,
    legal_basis: 'TT 91/2026/TT-BTC Điều 9',
    created_at: serverTimestamp()
  });
  return {
    id: ref.id, ...p, status: 'pending',
    invoiceForm: form, invoiceSymbol: p.invoiceSymbol || DEFAULT_SYMBOLS[form]
  };
}

/** Đăng thông báo ủy nhiệm trên gian hàng (Điều 9.1.đ) — điều kiện phát hành. */
export async function publishDelegationNotice(id: string, noticeUrl?: string): Promise<void> {
  const ref = doc(db, 'einvoice_delegations', id);
  await updateDoc(ref, { notice_published_at: new Date().toISOString(), notice_url: noticeUrl || null });
}

/**
 * Kích hoạt ủy nhiệm: gọi server báo CQT (Mẫu 01/ĐKTĐ-HĐĐT — Điều 9.3.c),
 * rồi cập nhật status='active' + lưu cqt_notice_ref.
 */
export async function activateDelegation(id: string): Promise<DelegationRecord> {
  // #21 (TT 91 Điều 9.1.h): chặn kích hoạt nếu Seller chưa khai báo tax_method.
  const existing = (await getDelegations()).find(d => d.id === id);
  if (existing) {
    const tm = await getSellerLiveTaxMethod(existing.sellerId);
    // tm === null nghĩa là Seller chưa có phương pháp tính thuế → từ chối kích hoạt.
    assertSellerTaxMethodForIssue(existing, tm);
    validateDelegationForIssue(existing, tm ?? undefined);
  }
  const res = await fetch(`/api/einvoice/delegations/${id}/activate`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok || data.status !== 'success') {
    throw new Error(data.message || 'Kích hoạt ủy nhiệm thất bại (CQT chưa nhận thông báo).');
  }
  const ref = doc(db, 'einvoice_delegations', id);
  await updateDoc(ref, {
    status: 'active',
    cqt_notified_at: data.cqtNotifiedAt || new Date().toISOString(),
    cqt_notice_ref: data.cqtNoticeRef || null,
    updated_at: new Date().toISOString()
  });
  return data.delegation;
}

export async function getDelegations(sellerId?: string): Promise<DelegationRecord[]> {
  const q = sellerId
    ? query(collection(db, 'einvoice_delegations'), where('seller_id', '==', sellerId))
    : query(collection(db, 'einvoice_delegations'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const v = d.data() as any;
    return {
      id: d.id,
      sellerId: v.seller_id, delegatorName: v.delegator_name, delegatorTaxCode: v.delegator_tax_code,
      status: v.status, delegatedFrom: v.delegated_from, delegatedTo: v.delegated_to,
      authDocRef: v.auth_doc_ref, invoiceForm: v.invoice_form, invoiceSymbol: v.invoice_symbol,
      templateCode: v.template_code, noticePublishedAt: v.notice_published_at, noticeUrl: v.notice_url,
      cqtNotifiedAt: v.cqt_notified_at, cqtNoticeRef: v.cqt_notice_ref
    } as DelegationRecord;
  });
}

export async function getActiveDelegation(sellerId: string): Promise<DelegationRecord | null> {
  const list = (await getDelegations(sellerId)).filter(d => d.status === 'active');
  return list[0] || null;
}

export function isDelegationActive(d?: DelegationRecord | null): boolean {
  return !!d && d.status === 'active';
}

/**
 * TT 91 Điều 9.1.đ — Gate phát hành ủy nhiệm: phải có thông báo trên gian hàng
 * (notice_published_at not null) TRƯỚC KHI khách đặt hàng / phát hành HĐ thay Seller.
 *
 * #21 (Điều 9.1.h): nếu `sellerTaxMethod` được truyền, BẮT BUỘC Seller đã khai báo
 * phương pháp tính thuế — nếu không phát hành HĐ ủy nhiệm sẽ sai bản chất. Truyền
 * `sellerTaxMethod` khi đã sẵn sàng đọc từ sellers (sau khi apply migration 022).
 */
export function validateDelegationForIssue(d: DelegationRecord, sellerTaxMethod?: TaxMethod): void {
  if (d.status !== 'active') {
    throw new Error('Ủy nhiệm chưa active — không được phát hành HĐ thay Seller (TT 91/2026 Điều 9).');
  }
  if (!d.noticePublishedAt) {
    throw new Error(
      'Thiếu thông báo ủy nhiệm trên gian hàng (TT 91/2026 Điều 9.1.đ) — ' +
      'không được phát hành trước khi khách đặt hàng.'
    );
  }
  if (sellerTaxMethod) {
    assertSellerTaxMethodForIssue(d, sellerTaxMethod);
  }
}

/**
 * Đọc phương pháp tính thuế đang hiệu lực của Seller (cột sellers.tax_method,
 * mirror từ bảng lịch sử seller_tax_methods). Trả về null nếu Seller chưa khai báo.
 */
export async function getSellerLiveTaxMethod(sellerId: string): Promise<TaxMethod | null> {
  try {
    const ref = doc(db, 'sellers', sellerId);
    const snap = await getDoc(ref);
    const v = snap?.data ? snap.data() : null;
    const m = v?.tax_method as TaxMethod | undefined;
    return m === 'declaration' || m === 'presumptive' ? m : null;
  } catch {
    return null;
  }
}

/** Tóm tắt thông báo ủy nhiệm (Điều 9.1.đ) cho banner storefront */
export function summarizeDelegationNotice(d: DelegationRecord): string {
  return `VComm được ủy nhiệm phát hành hóa đơn điện tử thay ${d.delegatorName} (MST ${d.delegatorTaxCode}) theo TT 91/2026 Điều 9.`;
}
