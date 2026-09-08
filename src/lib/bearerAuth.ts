/**
 * GĐ 2.4 — Xác thực Bearer tĩnh cho các endpoint nội bộ (quản trị iPOS, /metrics).
 *
 * Tách logic thuần ra đây để unit-test được. `server.ts` là bundle API chạy dưới
 * Node, không test trực tiếp được; mọi chốt bảo mật phải nằm ở module thuần có test.
 *
 * Thiết kế FAIL-CLOSED:
 *  - `verifyBearerToken` trả `false` khi khoá kỳ vọng rỗng/chưa cấu hình → endpoint
 *    phải TỪ CHỐI request (503/401), không được lặng lẽ cho qua.
 *  - So sánh dùng `crypto.timingSafeEqual` để tránh timing attack.
 */
import { timingSafeEqual } from 'node:crypto';

/** Tách token khỏi header `Authorization: Bearer <token>`. Trả null nếu thiếu/sai định dạng. */
export function parseBearerToken(header: unknown): string | null {
  if (typeof header !== 'string' || header.length === 0) return null;
  const h = header.trim();
  if (!h.startsWith('Bearer ')) return null;
  const token = h.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Xác thực header Bearer so với khoá kỳ vọng.
 * @returns true chỉ khi khoá đã cấu hình VÀ token khớp chính xác (độ dài + nội dung).
 *          false khi: chưa cấu hình khoá, thiếu header, sai định dạng, hoặc không khớp.
 */
export function verifyBearerToken(
  header: unknown,
  expectedKey: string | undefined | null,
): boolean {
  // Fail-closed: chưa cấu hình khoá → KHÔNG bao giờ hợp lệ.
  if (!expectedKey || expectedKey.length === 0) return false;

  const token = parseBearerToken(header);
  if (!token) return false;

  const a = Buffer.from(token);
  const b = Buffer.from(expectedKey);
  // Độ dài khác nhau → sai ngay (tránh lộ độ dài qua early-return).
  if (a.length !== b.length) return false;

  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
