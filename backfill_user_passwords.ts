/**
 * GĐ 2.4 — Backfill băm mật khẩu cũ (đóng nốt hậu quả pattern #87).
 *
 * Sau deploy commit `69cf0a3`, user ĐÃ có bản ghi plaintext chỉ được nâng cấp lên
 * bcrypt khi họ login lần đầu. Script này quét TOÀN BỘ bảng `users`, tìm bản ghi
 * còn lưu `data.password` plaintext (không tiền tố $2) và băm lại bằng bcrypt.
 *
 * Đặc điểm an toàn:
 *  - Dùng SERVICE ROLE KEY để bypass RLS (đọc/sửa mọi user). BẮT BUỘC có key.
 *  - Idempotent: bản ghi đã là bcrypt → bỏ qua (`isPlaintextPassword` false).
 *  - Phân trang, fail-safe: lỗi 1 dòng không dừng cả lượt, báo cuối.
 *  - `--dry-run`: chỉ đếm, KHÔNG ghi. Chạy thử trước khi ghi thật.
 *
 * Chạy:
 *   npx tsx backfill_user_passwords.ts --dry-run
 *   npx tsx backfill_user_passwords.ts
 */
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { hashPassword, isPlaintextPassword } from './src/lib/passwordHash';

dotenv.config();

const DRY_RUN = process.argv.includes('--dry-run');
const PAGE = 500;

async function run(): Promise<void> {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      '[backfill] THIẾU VITE_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY. ' +
        'Phải dùng service role key để bypass RLS và đọc mọi user.',
    );
    process.exit(2);
    return;
  }

  const client = createClient(url, key, { auth: { persistSession: false } });

  let start = 0;
  let scanned = 0;
  let upgraded = 0;
  let skipped = 0;
  let errors = 0;
  const errorIds: string[] = [];

  console.log(`[backfill] bắt đầu${DRY_RUN ? ' (DRY-RUN, không ghi)' : ''}...`);

  for (;;) {
    const { data: rows, error } = await client
      .from('users')
      .select('id, data')
      .order('id')
      .range(start, start + PAGE - 1);

    if (error) {
      console.error('[backfill] lỗi truy vấn users:', error.message);
      process.exit(3);
      return;
    }
    if (!rows || rows.length === 0) break;

    for (const row of rows as Array<{ id: string; data: Record<string, any> | null }>) {
      scanned++;
      const data = (row.data || {}) as Record<string, any>;
      const pw = data.password;

      if (!isPlaintextPassword(pw)) {
        skipped++; // đã là bcrypt hoặc không có password → bỏ qua
        continue;
      }

      if (DRY_RUN) {
        upgraded++;
        continue;
      }

      const hashed = await hashPassword(pw);
      const { error: updErr } = await client
        .from('users')
        .update({ data: { ...data, password: hashed } })
        .eq('id', row.id);

      if (updErr) {
        errors++;
        errorIds.push(row.id);
        console.error(`[backfill] lỗi update ${row.id}:`, updErr.message);
      } else {
        upgraded++;
      }
    }

    if (rows.length < PAGE) break;
    start += PAGE;
  }

  console.log(
    `[backfill] ${DRY_RUN ? 'DRY-RUN ' : ''}scanned=${scanned} upgraded=${upgraded} ` +
      `skipped=${skipped} errors=${errors}`,
  );
  if (errorIds.length) console.log('[backfill] error ids:', errorIds.join(','));
  process.exit(errors > 0 ? 1 : 0);
}

void run();
