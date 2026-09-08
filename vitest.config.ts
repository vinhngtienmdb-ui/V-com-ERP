import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],

    /**
     * ⚠️ VÌ SAO CẤU HÌNH NÀY KHÔNG PHẢI MẶC ĐỊNH — đừng "dọn" lại thành mặc định.
     *
     * 1. `pool: 'forks'` + `maxWorkers: 3`
     *    Với pool mặc định (`threads`), `npx vitest run src/services` (20 file)
     *    chạy XONG toàn bộ test nhưng **process không bao giờ thoát** — bị treo
     *    đến khi bị kill (đã đo: test xong ở ~40s, process sống >400s). Chạy
     *    từng file riêng thì không sao (~14s/file, chủ yếu là khởi động Node),
     *    nên không phải do một file rò rỉ handle mà do cơ chế worker. Dùng
     *    `forks` (tiến trình con) thì vitest kết thúc được process.
     *    `maxWorkers: 3` trên máy 6 nhân: 65 file × jsdom rất tốn RAM, và chính
     *    sự tranh chấp tài nguyên này làm test render React (`requests_multi_
     *    level`, cần ~2,9s khi chạy riêng) vượt quá 15s khi chạy đồng loạt.
     *
     * 2. `testTimeout: 30_000`
     *    Ở mức 15s, test render component lớn vẫn fail ngẫu nhiên khi chạy
     *    toàn bộ suite dù chạy riêng thì xanh.
     *
     * 3. `teardownTimeout: 20_000`
     *    Chặn luôn trường hợp teardown kẹt thay vì treo vô hạn.
     */
    pool: 'forks',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    teardownTimeout: 20_000,

    // Integration tests below open a LIVE Postgres connection (pg.Client) and
    // will hang forever if DATABASE_URL points at an unreachable instance.
    // They are excluded from the default `vitest run` (unit gate) and must be
    // run explicitly with RUN_INTEGRATION_TESTS=1 against a reachable DB.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/__tests__/ai_vector_search_claims.test.ts',
      'src/__tests__/digital_signatures.test.ts',
    ],
  },
});
