/**
 * M1 (audit, 2026-09-09) — Revert-proof test cho 11 guard `requireSellerAuth`
 * trong `server.ts`.
 *
 * Mục đích: đảm bảo việc sửa IDOR `/api/seller/*` thực sự SHIP vào file nguồn.
 * Nếu ai đó revert server.ts về HEAD (chưa có guard), test này ĐỎ vì số lượng
 * guard sẽ về 0. Đây là cùng tinh thần với `domainEventsRls.test.ts` (kiểm tra
 * migration SQL thay vì chạy DB thật).
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function loadServerTs(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  // src/services -> repo root
  const candidates = [
    resolve(here, '..', '..', 'server.ts'),
    resolve(process.cwd(), 'server.ts'),
  ];
  for (const p of candidates) {
    try {
      return readFileSync(p, 'utf-8');
    } catch {
      // thử path tiếp theo
    }
  }
  throw new Error('Không tìm thấy server.ts để kiểm tra guard.');
}

describe('M1 — /api/seller/* guard requireSellerAuth (revert-proof)', () => {
  const src = loadServerTs();

  it('server.ts tồn tại và có thể đọc', () => {
    expect(src.length).toBeGreaterThan(1000);
  });

  it('có đúng 11 route /api/seller/* được bảo vệ bởi requireSellerAuth', () => {
    // format đúng: app.<method>('/api/seller/...', requireSellerAuth, async
    const guardRe =
      /app\.(?:get|post|put|delete)\(\s*'(?:\/api\/seller\/(?!auth\/register|auth\/login)[^']*)'\s*,\s*requireSellerAuth,\s*async/g;
    const guards = src.match(guardRe) || [];
    expect(guards.length).toBe(11);
  });

  it('route register và login KHÔNG bị guard (public)', () => {
    expect(src).toMatch(/app\.post\(\s*'\/api\/seller\/auth\/register'/);
    expect(src).toMatch(/app\.post\(\s*'\/api\/seller\/auth\/login'/);
  });

  it('có module sellerAuth + middleware + cấp token ở login', () => {
    // import module
    expect(src).toMatch(/from ['"]\.\/src\/lib\/sellerAuth['"]/);
    // định nghĩa middleware requireSellerAuth
    expect(src).toMatch(/const requireSellerAuth = \(/);
    // login cấp token
    expect(src).toMatch(/token:\s*issueSellerToken\(/);
  });

  it('middleware ghi đè sellerId/ownerId từ token (IDOR fix)', () => {
    // phải ghi đè cả body.sellerId và params.ownerId để triệt IDOR
    expect(src).toMatch(/req\.body\.sellerId = sellerId/);
    expect(src).toMatch(/req\.params\.ownerId = sellerId/);
  });
});
