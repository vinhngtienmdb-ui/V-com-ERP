import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Quét server.ts chứng minh mật khẩu iPOS + Seller ĐÃ băm (không còn plaintext):
// register lưu hashPassword(...), login KHÔNG còn lọc `.eq('data->>password', ...)`
// trên DB mà verify trong code. Test khoá wiring — gỡ hash là đỏ.
const serverSrc = readFileSync(resolve(__dirname, '../../server.ts'), 'utf-8').replace(/\r/g, '');

describe('GĐ 2.4 — mật khẩu iPOS/Seller KHÔNG còn plaintext (pattern #87)', () => {
  it('server.ts import module băm mật khẩu', () => {
    expect(serverSrc).toContain("import { hashPassword, verifyPassword } from './src/lib/passwordHash';");
  });

  it('🔴 KHÔNG còn so sánh plaintext trên DB ở bất kỳ login nào', () => {
    // Cả seller lẫn ipos login trước đây đều `.eq('data->>password', password)`.
    expect(serverSrc).not.toContain("eq('data->>password', password)");
  });

  it('register (seller + ipos) lưu hashPassword(password), không lưu raw', () => {
    // await hashPassword(password) xuất hiện ở cả 2 register endpoint.
    const count = (serverSrc.match(/await hashPassword\(password\)/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('login gọi verifyPassword(password, ...) để kiểm tra trong code', () => {
    const count = (serverSrc.match(/verifyPassword\(password,/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(2);
  });

  it('seller register không còn lưu `password` nguyên bản vào data', () => {
    // Trước: `data: { email, password, role: 'seller', ... }` → giờ là hashPassword.
    expect(serverSrc).not.toContain("email, password, role: 'seller'");
  });
});
