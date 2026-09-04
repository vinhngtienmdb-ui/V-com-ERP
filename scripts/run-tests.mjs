#!/usr/bin/env node
/**
 * run-tests.mjs — Chạy unit test TỪNG FILE MỘT.
 * ==============================================
 *
 * VÌ SAO KHÔNG DÙNG `vitest run` (chạy tất cả cùng lúc)?
 *
 *   Đã đo thực tế trên máy dev (6 nhân / 17 GB): `npx vitest run src/__tests__`
 *   chạy XONG 37/37 file, 311/311 test, rồi **process KHÔNG chịu thoát** — bị
 *   treo cho đến khi bị kill (thử 250s và 400s đều treo). Hiện tượng lặp lại
 *   được, không phụ thuộc cache Vite, và KHÔNG do một file cụ thể: chia nhóm
 *   (1–10, 11–19, nửa đầu services, nửa sau services) thì nhóm nào cũng thoát
 *   bình thường trong 20–35s. Nghĩa là càng gom nhiều file thì càng kẹt ở khâu
 *   dọn dẹp, chứ test không hề fail.
 *
 *   Chạy TỪNG FILE thì luôn thoát sạch: 65 file, mỗi file ~12–15s (chủ yếu là
 *   khởi động Node), không file nào quá 40s.
 *
 *   Hậu quả nếu cứ dùng `vitest run`: CI báo ĐỎ dù test xanh hết, chỉ vì job
 *   vượt quá thời gian cho phép. Script này chạy tuần tự từng file nên kết quả
 *   phản ánh đúng chất lượng code.
 *
 * CÁCH DÙNG:
 *   node scripts/run-tests.mjs              # unit test (bỏ 2 test tích hợp)
 *   RUN_INTEGRATION_TESTS=1 node scripts/run-tests.mjs   # gồm cả tích hợp
 *
 * GHI CHÚ: danh sách loại trừ bên dưới PHẢI KHỚP với `exclude` trong
 * `vitest.config.ts`. Nếu sửa một chỗ thì sửa cả hai.
 */

import { spawnSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();

/**
 * Hai file này mở kết nối Postgres THẬT (`pg.Client`). Nếu DATABASE_URL trỏ
 * tới instance không với tới được, chúng treo vô hạn — nên mặc định bỏ qua.
 */
const INTEGRATION_TESTS = [
  'src/__tests__/ai_vector_search_claims.test.ts',
  'src/__tests__/digital_signatures.test.ts',
];

/** Quét đệ quy, đường dẫn dùng `/` để khớp với danh sách loại trừ. */
function findTestFiles(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of entries) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('dist_bak')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      out.push(...findTestFiles(full));
    } else if (/\.test\.tsx?$/.test(name)) {
      out.push(full.split('\\').join('/'));
    }
  }
  return out;
}

const includeIntegration = process.env.RUN_INTEGRATION_TESTS === '1';
const skip = includeIntegration ? [] : new Set(INTEGRATION_TESTS);

const files = findTestFiles('src')
  .filter((f) => !skip.has(f.replace(/^\.\//, '')))
  .sort();

if (files.length === 0) {
  console.error('[run-tests] Không tìm thấy file test nào trong src/');
  process.exit(1);
}

console.log(
  `[run-tests] Chạy ${files.length} file, mỗi file một tiến trình riêng` +
    (includeIntegration ? ' (GỒM CẢ test tích hợp)' : ' (bỏ 2 test tích hợp cần Postgres)')
);

const started = Date.now();
const failed = [];
const slow = [];

for (const file of files) {
  const t0 = Date.now();
  // `shell: true` để Windows tìm được npx.cmd; CI (Linux/macOS) cũng chạy được.
  const res = spawnSync('npx', ['vitest', 'run', file], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const seconds = ((Date.now() - t0) / 1000).toFixed(1);

  if (res.status === 0) {
    console.log(`[run-tests] OK   ${seconds}s  ${relative(ROOT, file)}`);
    if (Date.now() - t0 > 60_000) slow.push(`${file} (${seconds}s)`);
  } else {
    console.error(`[run-tests] FAIL ${seconds}s  ${relative(ROOT, file)} (mã thoát ${res.status})`);
    failed.push(file);
  }
}

const total = ((Date.now() - started) / 1000).toFixed(1);
console.log('\n' + '='.repeat(60));
console.log(`[run-tests] Tổng: ${files.length - failed.length}/${files.length} file xanh trong ${total}s`);

if (slow.length) {
  console.log(`[run-tests] File chậm (>60s), nên xem lại: \n  - ${slow.join('\n  - ')}`);
}

if (failed.length) {
  console.error(`[run-tests] FILE THẤT BẠI (${failed.length}):`);
  for (const f of failed) console.error(`  - ${f}`);
  process.exit(1);
}

console.log('[run-tests] Tất cả test đã qua.');
