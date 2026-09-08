/**
 * Chốt an toàn cho ZNS thông báo trạng thái đơn hàng (Orders → handleUpdateStatus).
 *
 * ⭐ BUG GỐC (AUDIT_PATTERNS #71 — SĐT người nhận bị hardcode):
 *   `sendZnsNotification('0981234567', templateCode, variables, …)`
 *   Mọi đơn, mọi trạng thái đều gửi về MỘT SỐ CỐ ĐỊNH, trong khi biến `variables`
 *   chứa Tên khách, Mã đơn, Tổng tiền, Đơn vị vận chuyển, Mã vận đơn → PII của
 *   khách bay về một thuê bao lạ, còn khách thật KHÔNG NHẬN ĐƯỢC GÌ. Toast lại
 *   xưng "…tới SĐT 0981234567 thành công!" nên operator tin là đã gửi.
 *
 *  Nguyên tắc: SĐT PHẢI lấy từ hồ sơ khách hàng. Không giải được → KHÔNG GỬI và
 *  nói rõ lý do (tuyệt đối không "gửi đại" rồi báo thành công).
 */

export type OrderZnsCode =
  | 'NO_CUSTOMER_ID'
  | 'CUSTOMER_NOT_FOUND'
  | 'INVALID_PHONE';

export interface OrderZnsInput {
  /** `Order.customerId` — mock order KHÔNG có trường này. */
  customerId?: unknown;
  customerName?: unknown;
  /** Trạng thái mới, dùng để chọn mẫu tin. */
  newStatus?: unknown;
  /** Bản ghi khách đọc từ DB (`customers`). `null` = tra cứu thất bại. */
  customer?: { phone?: unknown } | null;
}

export type OrderZnsResult =
  | {
      ok: true;
      code: null;
      reason: '';
      phone: string;
      templateCode: string;
    }
  | {
      ok: false;
      code: OrderZnsCode;
      reason: string;
      phone: null;
      templateCode: null;
    };

export const ZNS_ORDER_CONFIRMED = 'ZNS_ORDER_CONFIRMED';
export const ZNS_ORDER_SHIPPED = 'ZNS_ORDER_SHIPPED';
export const ZNS_ORDER_DELIVERED = 'ZNS_ORDER_DELIVERED';

export function znsTemplateForStatus(status: unknown): string {
  if (status === 'shipped') return ZNS_ORDER_SHIPPED;
  if (status === 'delivered') return ZNS_ORDER_DELIVERED;
  return ZNS_ORDER_CONFIRMED;
}

/**
 * SĐT người nhận mặc định đã từng bị hardcode trong component. Giữ lại để chặn
 * tái diễn: nếu SĐT của khách trùng đúng số mẫu này thì coi là dữ liệu giả.
 */
export const SAMPLE_PHONE_NUMBERS: readonly string[] = ['0981234567'];

/**
 * Chuẩn hoá SĐT Việt Nam: bỏ khoảng trắng/chấm/gạch/ngoặc, `+84…` và `84…` → `0…`.
 * Trả `null` khi không phải SĐT hợp lệ (rỗng, rác, sai độ dài, toàn một chữ số).
 */
export function normalizeVnPhone(raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw)) return null;
    raw = String(Math.trunc(raw));
  }
  if (typeof raw !== 'string') return null;

  let s = raw.trim().replace(/[\s.\-()]/g, '');
  if (s === '') return null;
  if (s.startsWith('+84')) s = '0' + s.slice(3);
  else if (/^84\d{9,10}$/.test(s)) s = '0' + s.slice(2);
  // SĐT lưu dưới dạng NUMBER bị mất số 0 đầu (901234567) → bù lại.
  else if (/^\d{9}$/.test(s)) s = '0' + s;

  if (!/^0\d{9,10}$/.test(s)) return null;
  // Số rác: toàn cùng một chữ số (0000000000, 1111111111…)
  if (/^(\d)\1+$/.test(s)) return null;
  return s;
}

export function planOrderStatusNotification(input: OrderZnsInput): OrderZnsResult {
  const customerId = typeof input?.customerId === 'string' ? input.customerId.trim() : '';
  const customerName =
    typeof input?.customerName === 'string' && input.customerName.trim() !== ''
      ? input.customerName.trim()
      : 'khách hàng';

  // ① Đơn không gắn mã khách (đơn MOCK / đơn khách vãng lai) → không có ai để tra SĐT.
  if (!customerId) {
    return {
      ok: false,
      code: 'NO_CUSTOMER_ID',
      reason: `Đơn không có mã khách hàng nên không xác định được SĐT nhận tin — không gửi ZNS. Trạng thái đã được cập nhật.`,
      phone: null,
      templateCode: null,
    };
  }

  // ② Có mã nhưng đọc hồ sơ thất bại → không đoán SĐT.
  if (!input?.customer) {
    return {
      ok: false,
      code: 'CUSTOMER_NOT_FOUND',
      reason: `Không đọc được hồ sơ khách hàng ${customerId} — không gửi ZNS. Trạng thái đã được cập nhật.`,
      phone: null,
      templateCode: null,
    };
  }

  // ③ Hồ sơ có nhưng SĐT trống/sai định dạng → vẫn không gửi.
  const phone = normalizeVnPhone(input.customer.phone);
  if (!phone || SAMPLE_PHONE_NUMBERS.indexOf(phone) !== -1) {
    return {
      ok: false,
      code: 'INVALID_PHONE',
      reason: `Khách hàng ${customerName} chưa có SĐT hợp lệ trong hồ sơ — không gửi ZNS. Trạng thái đã được cập nhật.`,
      phone: null,
      templateCode: null,
    };
  }

  return {
    ok: true,
    code: null,
    reason: '',
    phone,
    templateCode: znsTemplateForStatus(input?.newStatus),
  };
}
