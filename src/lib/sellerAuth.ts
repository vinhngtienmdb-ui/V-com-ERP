/**
 * GĐ 2.4 / M1 (audit, 2026-09-09) — Xác thực phiên người bán (seller-session).
 *
 * Bối cảnh: toàn bộ không gian `/api/seller/*` (server.ts:3307–3878) KHÔNG có guard
 * và mang lỗ hổng IDOR — login không cấp token, frontend truyền `sellerId` thô trong
 * body/param → bất kỳ ai cũng đọc/sửa được dữ liệu người bán khác.
 *
 * Cách sửa: login cấp một token HMAC (ký bằng `crypto`, không dùng jsonwebtoken vì
 * project chưa có thư viện đó). Mọi route `/api/seller/*` (trừ register/login) bắt
 * buộc token. Middleware `requireSellerAuth` (định nghĩa ở server.ts, dùng module này)
 * KHÔNG tin `sellerId` từ client — nó ghi đè `req.body.sellerId` / `req.params.sellerId`
 * và `req.params.ownerId` bằng sellerId lấy từ token → triệt tiêu IDOR.
 *
 * Tách logic thuần ra module này để unit-test (server.ts là bundle Node, không test
 * trực tiếp được — theo đúng tinh thần bearerAuth.ts).
 *
 * Fail-closed: thiếu `SELLER_TOKEN_SECRET` ở Production → ném lỗi (không ký/hợp lệ).
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const DEV_FALLBACK_SECRET = 'dev-only-seller-token-secret-DO-NOT-USE-IN-PROD';

export class SellerAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SellerAuthError';
  }
}

export function getSellerSecret(): string {
  const env = process.env.SELLER_TOKEN_SECRET;
  if (env && env.length > 0) return env;
  const isDemo = (process.env.VITE_DEMO_MODE ?? 'true') !== 'false';
  if (isDemo) {
    // Chỉ dùng ở local/dev. Production (VITE_DEMO_MODE=false) THIẾU khoá → ném lỗi.
    return DEV_FALLBACK_SECRET;
  }
  throw new SellerAuthError(
    '[sellerAuth] SELLER_TOKEN_SECRET chưa cấu hình (bắt buộc ở Production).',
  );
}

function b64url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlJson(obj: unknown): string {
  return b64url(Buffer.from(JSON.stringify(obj), 'utf-8'));
}

function b64urlDecode(str: string): Buffer {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

const DEFAULT_TTL_SECONDS = 60 * 60 * 12; // 12 giờ

export interface SellerTokenPayload {
  /** sellerId — chủ thể của phiên. */
  sid: string;
  /** epoch seconds. */
  iat: number;
  /** epoch seconds. */
  exp: number;
}

export function issueSellerToken(
  sellerId: string,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): string {
  if (!sellerId || sellerId.length === 0) {
    throw new SellerAuthError('sellerId không được rỗng.');
  }
  const secret = getSellerSecret();
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + ttlSeconds;
  const payload: SellerTokenPayload = { sid: sellerId, iat, exp };
  const p = b64urlJson(payload);
  const sig = b64url(createHmac('sha256', secret).update(p).digest());
  return `${p}.${sig}`;
}

export function verifySellerToken(token: string): { sellerId: string } {
  if (!token || token.length === 0) {
    throw new SellerAuthError('Token rỗng.');
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    throw new SellerAuthError('Token sai định dạng.');
  }
  const [p, sig] = parts;
  const secret = getSellerSecret();
  const expected = b64url(createHmac('sha256', secret).update(p).digest());
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  // Độ dài khác nhau → sai ngay (tránh lộ độ dài qua early-return).
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new SellerAuthError('Chữ ký token không hợp lệ.');
  }
  let payload: SellerTokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(p).toString('utf-8')) as SellerTokenPayload;
  } catch {
    throw new SellerAuthError('Payload token không hợp lệ.');
  }
  if (!payload || typeof payload.sid !== 'string' || payload.sid.length === 0) {
    throw new SellerAuthError('Payload token thiếu sellerId.');
  }
  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== 'number' || payload.exp <= now) {
    throw new SellerAuthError('Token người bán đã hết hạn.');
  }
  return { sellerId: payload.sid };
}

/** Tách token khỏi header `Authorization: Bearer <token>`. Trả null nếu thiếu/sai định dạng. */
export function parseBearerToken(header: unknown): string | null {
  if (typeof header !== 'string' || header.length === 0) return null;
  const h = header.trim();
  if (!h.startsWith('Bearer ')) return null;
  const token = h.slice(7).trim();
  return token.length > 0 ? token : null;
}
