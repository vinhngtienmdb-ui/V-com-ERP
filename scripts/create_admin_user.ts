/**
 * Tạo admin user thật cho Supabase Auth
 * - Email: admin@v-erp.com (username 'admin' trong app)
 * - Password: admin@1234 (chuẩn bootstrap AuthContext)
 * - Ghi users table (AuthContext đọc khi login) + staff
 * Chạy: npx tsx scripts/create_admin_user.ts
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const URL = process.env.VITE_SUPABASE_URL!;
const ANON = process.env.VITE_SUPABASE_ANON_KEY!;
const DATABASE_URL = process.env.DATABASE_URL!;

async function main() {
  console.log('=== Tạo admin user Supabase Auth ===\n');

  // 1. Tạo auth user qua anon signUp (email confirm tắt mặc định Supabase mới? cần kiểm tra)
  const sb = createClient(URL, ANON);
  const email = 'admin@v-erp.com';
  const password = 'admin@1234';

  console.log('Đăng ký auth user:', email);
  const { data: su, error: se } = await sb.auth.signUp({ email, password });
  if (se) {
    console.log('signUp:', se.message);
    // Có thể đã tồn tại → thử đăng nhập để lấy uid
    const { data: si, error: lie } = await sb.auth.signInWithPassword({ email, password });
    if (lie) {
      console.error('User đã tồn tại nhưng sai password:', lie.message);
      console.log('→ Vào Supabase Dashboard → Authentication → Users → reset password nếu cần');
      process.exit(1);
    }
    console.log('User đã tồn tại — đăng nhập OK:', si.user?.id);
    await finish(si.user!.id);
  } else {
    const uid = su.user?.id;
    if (!uid) {
      console.error('Không nhận được user id từ signUp:', su);
      process.exit(1);
    }
    const confirmed = !!su.user?.email_confirmed_at;
    console.log('Tạo mới thành công. UID:', uid, '| email_confirmed:', confirmed);
    if (!confirmed) {
      console.log('(Lưu ý: nếu Confirm email đang bật, user phải click link trong email trước khi login)');
    }
    await finish(uid);
  }
}

async function finish(uid: string) {
  // 2. Ghi users table + staff qua pg (bỏ qua RLS — dùng DATABASE_URL postgres)
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const email = 'admin@v-erp.com';
  await client.query(
    `INSERT INTO public.users (id, tenant_id, email, role, is_active, mfa_enabled)
     VALUES ($1, 'tenant-vcomm-prod-01', $2, 'super_admin', true, false)
     ON CONFLICT (id) DO UPDATE SET role = 'super_admin', is_active = true`,
    [uid, email]
  );
  console.log('users table: super_admin OK');

  await client.query(
    `INSERT INTO public.staff (id, tenant_id, name, username, role, email)
     VALUES ($1, 'tenant-vcomm-prod-01', 'System Admin', 'admin', 'super_admin', $2)
     ON CONFLICT (username) DO UPDATE SET role = 'super_admin'`,
    [uid, email]
  );
  console.log('staff table: OK');

  const check = await client.query('SELECT id, email, role FROM public.users WHERE id = $1', [uid]);
  console.log('\nVerify:', JSON.stringify(check.rows[0]));
  await client.end();
  console.log('\n=== HOÀN TẤT — đăng nhập: admin / admin@1234 ===');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
