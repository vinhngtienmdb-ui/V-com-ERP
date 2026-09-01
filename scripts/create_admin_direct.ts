/**
 * Tạo admin user trực tiếp trong auth.users schema bằng pg (bypass email validation)
 * Chạy: npx tsx scripts/create_admin_direct.ts
 */
import 'dotenv/config';
import crypto from 'crypto';

async function main() {
  const { Client } = await import('pg');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected.');

  const email = 'admin@v-erp.com';
  const password = 'admin@1234';

  // bcrypt hash — Supabase auth.users dùng bcrypt cost 10
  const { default: bcrypt } = await import('bcryptjs');
  const hash = await bcrypt.hash(password, 10);

  const uid = crypto.randomUUID();
  const now = new Date().toISOString();

  // auth.users không có unique(email) constraint phía DB — check thủ công
  const existing = await client.query('SELECT id FROM auth.users WHERE email = $1', [email]);
  let finalUid: string;
  if (existing.rows.length > 0) {
    finalUid = existing.rows[0].id;
    await client.query(
      `UPDATE auth.users SET encrypted_password = $1, email_confirmed_at = $2, updated_at = $2 WHERE id = $3`,
      [hash, now, finalUid]
    );
    console.log('User tồn tại — reset password OK, uid:', finalUid);
  } else {
    const r = await client.query(
      `INSERT INTO auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, last_sign_in_at)
       VALUES ($1, 'authenticated', 'authenticated', $2, $3, $4, $4, $4, '{}', '{}', $4)
       RETURNING id`,
      [uid, email, hash, now]
    );
    finalUid = r.rows[0].id;
    console.log('Tạo mới auth user OK — uid:', finalUid);
  }

  await client.query(
    `INSERT INTO public.users (id, tenant_id, email, role, is_active, mfa_enabled)
     VALUES ($1, 'tenant-vcomm-prod-01', $2, 'super_admin', true, false)
     ON CONFLICT (id) DO UPDATE SET role = 'super_admin', is_active = true`,
    [finalUid, email]
  );
  console.log('public.users OK (super_admin)');

  await client.query(
    `INSERT INTO public.staff (id, tenant_id, name, username, role, email)
     VALUES ($1, 'tenant-vcomm-prod-01', 'System Admin', 'admin', 'super_admin', $2)
     ON CONFLICT (username) DO UPDATE SET role = 'super_admin'`,
    [finalUid, email]
  );
  console.log('staff OK');

  await client.end();
  console.log('\n=== HOÀN TẤT: admin / admin@1234 ===');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
