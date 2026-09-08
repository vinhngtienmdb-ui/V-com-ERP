import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Quét server.ts chứng minh các endpoint iPOS satellite (checkout / o2o-cart / products)
// ĐÃ gắn middleware `authenticateOpenApi` (Bearer licence) — trước đây MỞ, ai cũng tạo
// đơn / trừ kho / tạo khách CRM. Test khoá wiring — gỡ middleware là đỏ.
const serverSrc = readFileSync(resolve(__dirname, '../../server.ts'), 'utf-8').replace(/\r/g, '');

describe('GĐ 2.4 — iPOS satellite endpoints BẮT BUỘC có authenticateOpenApi (đóng #5)', () => {
  it('POST /api/ipos/checkout (tạo đơn + trừ kho + tạo khách) gắn authenticateOpenApi', () => {
    expect(serverSrc).toContain("app.post('/api/ipos/checkout', authenticateOpenApi,");
  });

  it('GET /api/ipos/o2o-cart gắn authenticateOpenApi', () => {
    expect(serverSrc).toContain("app.get('/api/ipos/o2o-cart', authenticateOpenApi,");
  });

  it('GET /api/ipos/products gắn authenticateOpenApi', () => {
    expect(serverSrc).toContain("app.get('/api/ipos/products', authenticateOpenApi,");
  });

  it('🔴 KHÔNG còn checkout/o2o-cart mở (không middleware nào)', () => {
    // Sau khi sửa, mọi route satellite đều có authenticateOpenApi. Nếu ai gỡ thì
    // chuỗi dưới sẽ xuất hiện lại → test đỏ.
    expect(serverSrc).not.toContain("app.post('/api/ipos/checkout', async (");
    expect(serverSrc).not.toContain("app.get('/api/ipos/o2o-cart', async (");
  });
});
