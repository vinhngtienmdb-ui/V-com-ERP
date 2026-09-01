/**
 * Deploy toàn bộ schema lên project Supabase MỚI (<PROJECT-REF>)
 * Chạy: npx tsx deploy_full_schema.ts (DATABASE_URL trong .env hoặc nhập tay)
 *
 * Thứ tự:
 * 1. normalize_relational_schema.sql — core: products/customers/orders/warehouse_stock (DROP + CREATE)
 * 2. create_sellers_table.sql — sellers (KYC FK target)
 * 3. create_settlements_table.sql — settlements
 * 4. setup_unified_tables.sql — IPOS/eCom phụ
 * 5. upgrade_orders_table.sql — cột orders bổ sung
 * 6. setup_accounting.sql — kế toán double-entry
 * 7. setup_tenant_settings.sql — tenant
 * 8. setup_digital_signatures.sql — chữ ký số
 * 9. setup_cross_module_triggers.sql — trigger liên module
 * 10. specs/012-vn-legal-compliance/migrations/001..005 — escrow, KYC, consent, tax, relational modules
 * 11. specs/012_bi_indices.sql + 013_zalo_crm_tables.sql
 */
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q: string) => new Promise<string>(res => rl.question(q, res));

const SCRIPTS = [
  'scripts/normalize_relational_schema.sql',
  'scripts/create_sellers_table.sql',
  'scripts/create_settlements_table.sql',
  'scripts/setup_unified_tables.sql',
  'scripts/upgrade_orders_table.sql',
  'scripts/setup_accounting.sql',
  'scripts/setup_tenant_settings.sql',
  'scripts/setup_digital_signatures.sql',
  'scripts/setup_cross_module_triggers.sql',
  'specs/012-vn-legal-compliance/migrations/001_escrows.sql',
  'specs/012-vn-legal-compliance/migrations/002_seller_kyc.sql',
  'specs/012-vn-legal-compliance/migrations/003_consent_dsar.sql',
  'specs/012-vn-legal-compliance/migrations/004_tax_engine.sql',
  'specs/012-vn-legal-compliance/migrations/005_relational_modules.sql',
  'specs/012_bi_indices.sql',
  'specs/013_zalo_crm_tables.sql',
];

async function run() {
  console.log('=== V-comm ERP FULL SCHEMA DEPLOY (Supabase mới) ===\n');

  let conn = process.env.DATABASE_URL;
  const HOST = 'db.<PROJECT-REF>.supabase.co';
  if (!conn || conn.includes('[YOUR-PASSWORD]')) {
    console.log('DATABASE_URL chưa set (hoặc còn placeholder) trong .env');
    const pw = await ask(`Nhập database password cho postgres@${HOST}: `);
    if (!pw) { console.error('Password rỗng.'); process.exit(1); }
    conn = `postgresql://postgres:${encodeURIComponent(pw)}@${HOST}:5432/postgres`;
  }
  rl.close();

  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected.');

  let ok = 0, fail = 0;
  for (const s of SCRIPTS) {
    const file = path.join(__dirname, s);
    process.stdout.write(`- ${s} ... `);
    try {
      const sql = fs.readFileSync(file, 'utf8');
      await client.query(sql);
      console.log('OK');
      ok++;
    } catch (err: any) {
      console.log('FAIL: ' + (err.message || err).split('\n')[0]);
      fail++;
    }
  }

  console.log(`\n=== Hoàn tất: ${ok} OK, ${fail} FAIL ===`);

  // Verify: liệt kê bảng đã tạo
  const res = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename"
  );
  console.log(`\nBảng trong public (${res.rows.length}):`);
  console.log(res.rows.map((r: any) => '  ' + r.tablename).join('\n'));

  await client.end();
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
