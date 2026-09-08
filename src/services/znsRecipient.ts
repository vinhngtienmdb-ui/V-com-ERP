/**
 * Chốt an toàn cho việc CHỌN SỐ NHẬN ZNS (dùng chung mọi phân hệ).
 *
 * ⭐ BUG GỐC (AUDIT_PATTERNS #71 lặp lại — đã sửa ở Orders `884a518`, nhưng còn
 *   sót hai chỗ khác):
 *     - `RequestHub.tsx`    : `sendZnsNotification('0912345678', 'ZNS_TICKET_CLOSED', …)`
 *     - `CustomerService.tsx`: `sendZnsNotification('0912345678', 'ZNS_TICKET_REPLIED', …)`
 *       và một tin 'ZNS_TICKET_CLOSED' thứ hai. Cả hai mang Tên khách + Mã phiếu
 *       + (CSKH) cả NỘI DUNG PHẢN HỒI, nhưng đi về MỘT SỐ CỐ ĐỊNH ghi trong mã
 *       nguồn. Tệ hơn Orders: `CustomerService` còn xướng thẳng trong toast
 *       "Đã gửi thông báo ZNS tự động cho khách hàng <tên>" — khẳng định sai sự
 *       thật, trong khi khách thật không nhận được gì.
 *   Cả hai đối tượng (đề xuất nội bộ, phiếu hỗ trợ) đều KHÔNG CÓ trường SĐT,
 *   nên sửa đúng không phải là "đổi số" mà là **KHÔNG GỬI khi không giải được
 *   số người nhận**, và nói rõ lý do.
 *
 *  Nguyên tắc: fail-closed. Trả `ok:false` → tuyệt đối không gọi `sendZns*`.
 */

import { normalizeVnPhone } from './orderStatusNotification';

/** Các số MẪU từng bị ghi cứng trong mã nguồn — gặp lại là chặn ngay. */
export const ZNS_SAMPLE_PHONES: readonly string[] = ['0981234567', '0912345678'];

export type ZnsRecipientCode = 'NO_PHONE' | 'INVALID_PHONE' | 'SAMPLE_PHONE';

export interface ZnsRecipientInput {
  /** Ngữ cảnh để đưa vào thông báo, vd. `đóng phiếu hỗ trợ TKT-1042`. */
  purpose?: unknown;
  /** SĐT người nhận đọc từ hồ sơ (chuỗi hoặc số đều được). */
  phone?: unknown;
}

export type ZnsRecipientResult =
  | { ok: true; code: null; message: ''; phone: string }
  | { ok: false; code: ZnsRecipientCode; message: string; phone: null };

const isBlank = (v: unknown): boolean =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

export function planZnsRecipient(input: ZnsRecipientInput): ZnsRecipientResult {
  const purpose = isBlank(input?.purpose) ? 'thông báo ZNS' : String(input?.purpose).trim();

  // ⚠️ `Number(null)`/`Number('')` = 0 (#63) → phải chặn rỗng TRƯỚC khi ép kiểu.
  if (isBlank(input?.phone)) {
    return {
      ok: false,
      code: 'NO_PHONE',
      message:
        `Không có số điện thoại của người nhận trong hồ sơ (${purpose}) — ` +
        `KHÔNG gửi ZNS (không gửi đại sang số khác).`,
      phone: null,
    };
  }

  const raw = String(input?.phone).trim();
  const phone = normalizeVnPhone(raw);
  if (!phone) {
    return {
      ok: false,
      code: 'INVALID_PHONE',
      message: `Số điện thoại nhận ZNS không hợp lệ ("${raw}", ${purpose}) — KHÔNG gửi ZNS.`,
      phone: null,
    };
  }

  if (ZNS_SAMPLE_PHONES.includes(phone)) {
    return {
      ok: false,
      code: 'SAMPLE_PHONE',
      message:
        `Số điện thoại nhận ZNS là SỐ MẪU ghi cứng trong mã nguồn (${phone}) — ` +
        `KHÔNG gửi ZNS, vì tin sẽ đi sai người và làm lộ thông tin khách hàng.`,
      phone: null,
    };
  }

  return { ok: true, code: null, message: '', phone };
}
