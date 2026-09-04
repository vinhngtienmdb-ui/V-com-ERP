/**
 * ============================================================================
 *  einvoiceProviders.ts — GĐ 3.1: registry + adapter nhà cung cấp HĐĐT
 * ============================================================================
 *
 *  Vấn đề trước đây: `einvoiceService.ts` gắn CỨNG một endpoint `/api/einvoice/issue`
 *  → đổi nhà cung cấp (Viettel / VNPT / MISA / FPT / ...) phải sửa code. Kế hoạch đã
 *  chốt: "HĐĐT ĐỘNG + provider registry/adapter".
 *
 *  Thiết kế:
 *   - `EInvoiceProviderAdapter`: hợp đồng mọi provider phải tuân theo (một phương thức `call`).
 *   - Registry: đăng ký / tra cứu / liệt kê provider. Chọn provider theo cấu hình
 *     (`integrationConfigService`), không hardcode.
 *   - `GenericHttpProvider`: adapter mặc định gọi server proxy `/api/einvoice/...`.
 *     Giữ NGUYÊN hành vi của code cũ → không hồi quy.
 *
 *  ⚠️ Bảo mật: khóa API của provider nằm ở SERVER (proxy), client chỉ gửi draft.
 *     Adapter KHÔNG được chứa secret.
 *
 *  ⚠️ TT 91/2026 Điều 10: KHÔNG có khái niệm "hủy" hóa đơn — chỉ 4 luồng
 *     (announce_adjust / replace / monthly_consolidate / + tra cứu). Mọi provider
 *     phải hỗ trợ 4 luồng này qua `action`.
 * ============================================================================
 */

/** Các hành động HĐĐT — ánh xạ trực tiếp TT 91/2026 Điều 10. */
export type EInvoiceAction =
  | 'issue' // phát hành HĐ mới
  | 'announce_adjust' // sai tên/địa chỉ người mua → thông báo + HĐ điều chỉnh
  | 'replace' // sai hàng hóa/số lượng/đơn giá/thuế → HĐ thay thế
  | 'monthly_consolidate' // gộp cuối tháng (máy tính tiền)
  | 'lookup'; // tra cứu trạng thái HĐ

export interface ProviderRequest {
  action: EInvoiceAction;
  /** Payload đã chuẩn hóa (draft / params). */
  payload: Record<string, unknown>;
  /** id đơn hàng hoặc ref để đối soát. */
  refId?: string;
}

export interface ProviderResponse {
  status: 'success' | 'error';
  invoiceNumber?: string;
  lookupCode?: string;
  signedAt?: string;
  xmlBlob?: string;
  message?: string;
}

/** Hợp đồng mọi adapter phải tuân theo. */
export interface EInvoiceProviderAdapter {
  id: string;
  label: string;
  call(req: ProviderRequest): Promise<ProviderResponse>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

const registry = new Map<string, EInvoiceProviderAdapter>();

/** id provider mặc định — giữ hành vi cũ (server proxy hiện tại). */
export const DEFAULT_PROVIDER_ID = 'generic';

/** Đăng ký provider. Ghi đè nếu id đã tồn tại (hữu ích khi test/mock). */
export function registerProvider(adapter: EInvoiceProviderAdapter): void {
  registry.set(adapter.id, adapter);
}

/** Gỡ provider (chủ yếu cho test). */
export function unregisterProvider(id: string): boolean {
  return registry.delete(id);
}

/** Lấy adapter đã đăng ký. Ném lỗi rõ ràng nếu chưa đăng ký. */
export function getProvider(id: string = DEFAULT_PROVIDER_ID): EInvoiceProviderAdapter {
  const p = registry.get(id);
  if (!p) {
    throw new Error(
      `Chưa đăng ký nhà cung cấp HĐĐT '${id}'. Đã đăng ký: [${listProviders().map(x => x.id).join(', ')}]. ` +
      `Gọi registerProvider() khi khởi tạo ứng dụng.`,
    );
  }
  return p;
}

/** Có provider này không (dùng để kiểm tra trước khi gọi). */
export function hasProvider(id: string): boolean {
  return registry.has(id);
}

/** Liệt kê provider đã đăng ký. */
export function listProviders(): EInvoiceProviderAdapter[] {
  return [...registry.values()];
}

/**
 * Chọn provider theo cấu hình (chưa có cấu hình → mặc định 'generic').
 * Tách biệt với integrationConfigService để module này thuần, dễ test.
 */
export function resolveProvider(
  configuredId?: string | null,
): EInvoiceProviderAdapter {
  if (configuredId && hasProvider(configuredId)) return getProvider(configuredId);
  if (configuredId) {
    // Đã cấu hình nhưng chưa đăng ký adapter → báo rõ thay vì âm thầm dùng mặc định
    throw new Error(
      `Cấu hình chỉ định nhà cung cấp HĐĐT '${configuredId}' nhưng chưa đăng ký adapter. ` +
      `Kiểm tra registerProvider('${configuredId}') ở khởi tạo ứng dụng.`,
    );
  }
  return getProvider(DEFAULT_PROVIDER_ID);
}

// ─────────────────────────────────────────────────────────────────────────────
// Adapter mặc định: gọi server proxy
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Ánh xạ action → đường dẫn proxy. Giữ NGUYÊN path của code cũ để KHÔNG hồi quy:
 *  - issue    → /issue           (như einvoiceService.issueEInvoice trước đây)
 *  - 3 luồng sai sót TT 91 Điều 10 → /handle-error (như handleInvoiceError trước đây)
 *  - lookup   → /lookup
 */
const ACTION_PATH: Record<EInvoiceAction, string> = {
  issue: '/issue',
  announce_adjust: '/handle-error',
  replace: '/handle-error',
  monthly_consolidate: '/handle-error',
  lookup: '/lookup',
};

export interface GenericHttpProviderOptions {
  /** Tiền tố API. Mặc định '/api/einvoice'. */
  baseUrl?: string;
  /** Hàm fetch (để test inject). Mặc định global fetch. */
  fetchFn?: typeof fetch;
}

/**
 * Adapter mặc định: ủy quyền cho server proxy. Khóa provider nằm ở server.
 * Response trả về nguyên dạng `ProviderResponse` để các luồng cũ không đổi.
 */
export class GenericHttpProvider implements EInvoiceProviderAdapter {
  readonly id = DEFAULT_PROVIDER_ID;
  readonly label = 'Server proxy (mặc định)';
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(opts: GenericHttpProviderOptions = {}) {
    this.baseUrl = opts.baseUrl ?? '/api/einvoice';
    this.fetchFn = opts.fetchFn ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  }

  async call(req: ProviderRequest): Promise<ProviderResponse> {
    const path = ACTION_PATH[req.action];
    if (!path) throw new Error(`Hành động HĐĐT không được hỗ trợ: ${req.action}`);

    const res = await this.fetchFn(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Gửi kèm action để server proxy phân luồng đúng (TT 91 Điều 10).
      body: JSON.stringify({ ...req.payload, action: req.action, refId: req.refId }),
    });
    const data = await res.json();
    if (!res.ok || data.status !== 'success') {
      throw new Error(data.message || `Provider từ chối (${req.action}).`);
    }
    return data as ProviderResponse;
  }
}

/** Đăng ký sẵn adapter mặc định để mọi luồng hiện tại chạy ngay. */
registerProvider(new GenericHttpProvider());
