/**
 * XÁC THỰC WEBHOOK SePay — GĐ 2.4 (bảo mật)
 * =============================================================================
 * Tách riêng khỏi `server.ts` để logic CHỐT TIỀN này có unit test. Trước đây
 * nó nằm inline trong server.ts, không test được — và có 3 lỗ hổng:
 *
 *  1. **Bỏ qua xác thực khi chưa cấu hình secret.** Bản cũ:
 *         if (webhookSecret && webhookSecret.trim() !== '') { ...kiểm tra... }
 *     Khi `SEPAY_WEBHOOK_SECRET` trống (đang trống trong .env) → KHÔNG KIỂM TRA
 *     GÌ CẢ. Ai cũng có thể:
 *         curl -X POST /api/sepay/webhook -d '{"content":"VCOMM_ORD_123"}'
 *     → đơn 123 thành "đã thanh toán". Nhận hàng miễn phí.
 *     → Nay: FAIL-CLOSED. Thiếu secret = TỪ CHỐI (503).
 *
 *  2. **Cửa hậu hardcode** `authHeader === 'Apikey mock_secret'` — vượt qua xác
 *     thực NGAY CẢ KHI secret thật đã được cấu hình. Ai đọc được mã nguồn là có
 *     quyền này. → ĐÃ XÓA, và có test khóa chặt để nó không mọc lại.
 *
 *  3. So sánh bằng `===` → lộ thông tin qua thời gian so sánh. → Dùng
 *     `timingSafeEqual`.
 *
 * TẠI SAO LẠI FAIL-CLOSED DÙ BIẾT SẼ GÃY LUỒNG THANH TOÁN?
 * -----------------------------------------------------------------------------
 * Vì rủi ro ngược lại lớn hơn: để lộ = ai cũng tự đánh dấu đơn đã thanh toán.
 * Fail-closed biến lỗi cấu hình thành lỗi NHÌN THẤY NGAY (webhook 503, log cảnh
 * báo khi khởi động) thay vì thành lỗ hổng âm thầm. Cần bỏ qua khi dev thì phải
 * CHỦ ĐỘNG đặt `SEPAY_WEBHOOK_ALLOW_INSECURE=1`.
 * =============================================================================
 */

import { timingSafeEqual } from 'crypto';

/** Chưa cấu hình secret → từ chối phục vụ (không phải lỗi của client). */
export const SEPAY_NOT_CONFIGURED = 503;
/** Có cấu hình nhưng sai chữ ký. */
export const SEPAY_UNAUTHORIZED = 401;

export interface SePayAuthInput {
  /** Header `Authorization` (SePay gửi dạng `Apikey <secret>`). */
  authorization?: unknown;
  /** Header `x-sepay-signature`. */
  signature?: unknown;
}

export interface SePayAuthOptions {
  /** Chỉ để dev: bỏ qua xác thực. Mỗi lần gọi đều phát cảnh báo. */
  allowInsecure?: boolean;
  /** Nhận cảnh báo/lỗi để caller đưa vào logger. */
  log?: (level: 'warn' | 'error', message: string) => void;
}

/**
 * ⚠️ `strict: false` → TS KHÔNG narrow discriminated union bằng literal boolean.
 * Dùng MỘT interface với field optional, không dùng union (quy ước chung của repo).
 */
export interface SePayAuthResult {
  ok: boolean;
  /** `true` khi đang chạy chế độ bỏ qua xác thực (dev). */
  insecure?: boolean;
  /** HTTP status khi `ok === false`. */
  status?: number;
  /** Mã máy đọc được, để log/metrics. */
  code?: 'not_configured' | 'unauthorized' | 'ok' | 'insecure';
  /** Thông báo gửi cho client. */
  message?: string;
}

/**
 * So sánh hai chuỗi trong thời gian cố định (chống timing attack).
 *
 * ⚠️ `timingSafeEqual` NÉM nếu hai buffer khác độ dài → phải so độ dài TRƯỚC.
 * Việc lộ độ dài chuỗi là chấp nhận được với secret kiểu này.
 */
export function safeSecretEquals(a: unknown, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length === 0 || b.length === 0) return false;
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

const OK: SePayAuthResult = { ok: true, code: 'ok' };

/**
 * Xác thực một request webhook SePay.
 *
 * Chấp nhận secret ở 3 vị trí (để tương thích các phiên bản cấu hình SePay):
 *   · header `Authorization: Apikey <secret>`
 *   · header `Authorization: <secret>`
 *   · header `x-sepay-signature: <secret>`
 */
export function verifySePayWebhook(
  input: SePayAuthInput,
  secretRaw: string | null | undefined,
  opts: SePayAuthOptions = {}
): SePayAuthResult {
  if (opts.allowInsecure) {
    opts.log?.(
      'warn',
      'SEPAY_WEBHOOK_ALLOW_INSECURE=1: webhook ngân hàng đang MỞ — ai cũng có thể ' +
        'giả mạo "đã thanh toán". TUYỆT ĐỐI KHÔNG bật trên production.'
    );
    return { ok: true, insecure: true, code: 'insecure' };
  }

  const secret = (secretRaw ?? '').trim();
  if (!secret) {
    opts.log?.(
      'error',
      'Thiếu SEPAY_WEBHOOK_SECRET → TỪ CHỐI webhook (fail-closed). ' +
        'Hãy đặt biến môi trường này; nếu chỉ dev, đặt SEPAY_WEBHOOK_ALLOW_INSECURE=1.'
    );
    return {
      ok: false,
      status: SEPAY_NOT_CONFIGURED,
      code: 'not_configured',
      message: 'Webhook chưa được cấu hình (thiếu secret).',
    };
  }

  const authorized =
    safeSecretEquals(input.authorization, `Apikey ${secret}`) ||
    safeSecretEquals(input.authorization, secret) ||
    safeSecretEquals(input.signature, secret);

  if (!authorized) {
    return {
      ok: false,
      status: SEPAY_UNAUTHORIZED,
      code: 'unauthorized',
      message: 'Unauthorized',
    };
  }

  return OK;
}
