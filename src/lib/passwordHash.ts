/**
 * GĐ 2.4 — Băm mật khẩu iPOS / Seller Centre (đóng lỗ hổng plaintext, pattern #87).
 *
 * Trước đây `/api/ipos/auth/*` và `/api/seller/auth/*` lưu `users.data.password`
 * dưới dạng PLAINTEXT và login so sánh bằng `.eq('data->>password', password)`
 * trên DB. Lộ DB = lộ toàn bộ mật khẩu. Giờ dùng bcrypt.
 *
 * Tương thích ngược (quan trọng — không làm gãy login user cũ):
 *  - `verifyPassword` NHẬN DIỆN được bản ghi cũ (plaintext, không có tiền tố $2) và
 *    vẫn so khánh đúng, đồng thời đánh dấu `needsUpgrade: true` để login handler
 *    băm lại và ghi đè (nâng cấp trong suốt, fail-safe).
 *  - Bản ghi mới (register) lưu bcrypt hash thuần.
 *
 * Tách logic thuần ra module này để unit-test (server.ts không test trực tiếp).
 */
import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'node:crypto';

const BCRYPT_ROUNDS = 10;
const BCRYPT_HASH_PREFIX = /^\$2[aby]\$/;

export interface PasswordVerifyResult {
  /** mật khẩu khớp hay không */
  ok: boolean;
  /** bản ghi cũ (plaintext) cần nâng cấp lên bcrypt */
  needsUpgrade: boolean;
}

/** Băm mật khẩu bằng bcrypt. Ném nếu đầu vào rỗng (fail-closed). */
export async function hashPassword(plain: string): Promise<string> {
  if (typeof plain !== 'string' || plain.length === 0) {
    throw new Error('Mật khẩu không hợp lệ');
  }
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Xác thực mật khẩu với giá trị đã lưu.
 * - đã băm bcrypt → `bcrypt.compare` (an toàn).
 * - plaintext cũ → so sánh không đổi thời gian, `needsUpgrade: true` nếu khớp.
 * - thiếu/rỗng → `{ ok: false, needsUpgrade: false }`.
 */
export async function verifyPassword(
  plain: string,
  stored: string | undefined | null,
): Promise<PasswordVerifyResult> {
  if (typeof plain !== 'string' || plain.length === 0) {
    return { ok: false, needsUpgrade: false };
  }
  if (typeof stored !== 'string' || stored.length === 0) {
    return { ok: false, needsUpgrade: false };
  }

  if (BCRYPT_HASH_PREFIX.test(stored)) {
    const ok = await bcrypt.compare(plain, stored);
    return { ok, needsUpgrade: false };
  }

  // Legacy plaintext: so sánh độ dài + nội dung không đổi thời gian.
  const a = Buffer.from(plain);
  const b = Buffer.from(stored);
  let ok = false;
  try {
    ok = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    ok = false;
  }
  return { ok, needsUpgrade: ok };
}

/**
 * Chỉ ra `stored` có phải mật khẩu PLAINTEXT cần nâng cấp hay không
 * (dùng cho script backfill quét DB, KHÔNG cần biết plaintext).
 * - bcrypt hash (`$2a$`/`$2b$`/`$2y$`) → false (đã an toàn).
 * - rỗng / không phải chuỗi → false.
 * - chuỗi thường → true (cần băm lại).
 */
export function isPlaintextPassword(stored: string | undefined | null): boolean {
  return typeof stored === 'string' && stored.length > 0 && !BCRYPT_HASH_PREFIX.test(stored);
}
