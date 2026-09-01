/**
 * Tạo admin user bằng email THẬT (vinh.ngtienmdb@gmail.com — có trong whitelist
 * AuthContext bootstrap) vì Supabase signUp từ chối domain không có MX (v-erp.com).
 * Chạy: npx tsx scripts/create_admin_user_v2.ts
 */
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const URL = process.env.VITE_SUPABASE_URL!;
const ANON = process.env.VITE_SUPABASE_ANON_KEY!;

const ADMIN_EMAILS: Array<{ email: string; username: string; name: string }> = [
  { email: 'vinh.ngtienmdb@gmail.com', username: 'admin', name: 'Vinh NT (Super Admin)' }
];

async function main() {
  const sb = createClient(URL, ANON);
  console.log('=== Tạo admin user (email thật) ===\n');

  for (const acc of ADMIN_EMAILS) {
    console.log('Đăng ký:', acc.email);
    const { data: su, error: se } = await sb.auth.signUp({
      email: acc.email,
      password: 'admin@1234',
      options: { data: { full_name: acc.name, role: 'super_admin' } }
    });

    let uid: string | undefined;

    if (se) {
      console.log('  signUp:', se.message);
      if (se.message.includes('already') || se.message.includes('registered')) {
        const { data: si, error: lie } = await sb.auth.signInWithPassword({ email: acc.email, password: 'admin@1234' });
        if (lie) {
          console.log('  → đã tồn tại, sai pass. Reset trong Dashboard → Authentication.');
          continue;
        }
        uid = si.user?.id;
        console.log('  → tồn tại, login OK:', uid);
      } else {
        continue;
      }
    } else {
      uid = su.user?.id;
      const confirmed = !!su.user?.email_confirmed_at;
      console.log('  → tạo OK. uid:', uid, '| confirmed:', confirmed, '| session:', !!su.session);
      if (!confirmed && !su.session) {
        console.log('  ⚠ Confirm email đang BẬT — cần click link trong Gmail, hoặc tắt trong Dashboard → Auth → Providers → Email → Confirm email');
      }
    }

    if (!uid) continue;

    // Gán role super_admin trong public.users + staff qua pg
    const { Client } = await import('pg');
    const pg = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
    await pg.connect();
    await pg.query(
      `INSERT INTO public.users (id, tenant_id, email, role, is_active, mfa_enabled)
       VALUES ($1, 'tenant-vcomm-prod-01', $2, 'super_admin', true, false)
       ON CONFLICT (id) DO UPDATE SET role = 'super_admin', is_active = true`,
      [uid, acc.email]
    );
    await pg.query(
      `INSERT INTO public.staff (id, tenant_id, name, username, role, email)
       VALUES ($1, 'tenant-vcomm-prod-01', $2, $3, 'super_admin', $4)
       ON CONFLICT (username) DO UPDATE SET role = 'super_admin'`,
      [uid, acc.name, acc.username, acc.email]
    );
    await pg.end();
    console.log('  → gán super_admin trong users + staff OK');
  }

  console.log('\n=== HOÀN TẤT — login app bằng: admin / admin@1234 ===');
  console.log('(AuthContext map username "admin" → whitelist vinh.ngtienmdb@gmail.com? KHÔNG —');
  console.log(' username không có @ sẽ gán @v-erp.com. Đăng nhập bằng EMAIL đầy đủ trong app)');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
