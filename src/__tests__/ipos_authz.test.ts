import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Quét mã nguồn server.ts để chứng minh các endpoint iPOS nhạy cảm ĐÃ được khoá,
// và register KHÔNG còn cho caller tự truyền role (chặn leo quyền).
// Đây là test khoá wiring: nếu ai gỡ middleware hoặc trả lại `ipos_role: role`,
// test sẽ đỏ (không cần chạy server).
const serverSrc = readFileSync(resolve(__dirname, '../../server.ts'), 'utf-8').replace(/\r/g, '');

describe('GĐ 2.4 — iPOS account endpoints BẮT BUỘC có requireIposAdmin', () => {
  it('GET /api/ipos/accounts (xem PII) gắn requireIposAdmin', () => {
    expect(serverSrc).toContain("app.get('/api/ipos/accounts', requireIposAdmin,");
  });

  it('POST /api/ipos/accounts/approve gắn requireIposAdmin', () => {
    expect(serverSrc).toContain("app.post('/api/ipos/accounts/approve', requireIposAdmin,");
  });

  it('POST /api/ipos/accounts/reject gắn requireIposAdmin', () => {
    expect(serverSrc).toContain("app.post('/api/ipos/accounts/reject', requireIposAdmin,");
  });

  it('GET /api/ipos/licenses (lộ apiToken) gắn requireIposAdmin', () => {
    expect(serverSrc).toContain("app.get('/api/ipos/licenses', requireIposAdmin,");
  });

  it('POST /api/ipos/licenses (ghi bản quyền) gắn requireIposAdmin', () => {
    expect(serverSrc).toContain("app.post('/api/ipos/licenses', requireIposAdmin,");
  });
});

describe('GĐ 2.4 — iPOS register KHÔNG cho caller tự phong quyền', () => {
  it('ipos_role được cố định là cashier', () => {
    expect(serverSrc).toContain("ipos_role: 'cashier'");
  });

  it('🔴 KHÔNG được lấy ipos_role từ req.body (pattern leo quyền admin)', () => {
    // Nếu ai viết lại `ipos_role: role || 'cashier'` → test đỏ.
    expect(serverSrc).not.toContain('ipos_role: role');
  });

  it('role cũng cố định là cashier (không đọc từ body)', () => {
    expect(serverSrc).toContain("role: 'cashier',");
  });
});

describe('GĐ 2.4 — /metrics có khoá tuỳ chọn METRICS_TOKEN', () => {
  it('handler /metrics kiểm verifyBearerToken với METRICS_TOKEN', () => {
    expect(serverSrc).toContain('verifyBearerToken(req.headers[\'authorization\'], METRICS_TOKEN)');
  });

  it('có khai báo METRICS_TOKEN từ env', () => {
    expect(serverSrc).toContain('const METRICS_TOKEN = (process.env.METRICS_TOKEN ||');
  });
});
