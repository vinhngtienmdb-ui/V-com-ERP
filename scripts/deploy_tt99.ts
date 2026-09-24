import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

async function run() {
  console.log('=============================================================');
  console.log('  VCOMM ERP — MIGRATION RUNNER TT99/2025 & NĐ 174/2016');
  console.log('=============================================================');

  let connectionString = process.env.DATABASE_URL;

  // Check if connection string has password placeholder or needs password input
  if (!connectionString || connectionString.includes('sb_publishable')) {
    console.log('\n[Cấu hình kết nối CSDL Supabase PostgreSQL]');
    const dbHost = process.env.DB_HOST || 'db.wivioicznwyhmpbeqoib.supabase.co';
    const dbUser = process.env.DB_USER || 'postgres';
    const dbPort = process.env.DB_PORT || '5432';
    const dbName = process.env.DB_NAME || 'postgres';

    console.log(`Host: ${dbHost}:${dbPort} (Database: ${dbName})`);
    const password = await askQuestion('Nhập mật khẩu Database Supabase: ');
    if (!password) {
      console.error('Mật khẩu không được để trống.');
      process.exit(1);
    }
    connectionString = `postgresql://${dbUser}:${encodeURIComponent(password)}@${dbHost}:${dbPort}/${dbName}`;
  }

  rl.close();

  console.log('\nĐang kết nối PostgreSQL...');
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Kết nối thành công!\n');

    const scripts = [
      { name: '1. tt99_00_schema.sql (Lõi kế toán dm_*, ct_*, ht_*, so_*)', file: path.join(__dirname, 'tt99_00_schema.sql') },
      { name: '2. tt99_01_schema_tich_hop.sql (Cột truy vết, outbox, Điều 28)', file: path.join(__dirname, 'tt99_01_schema_tich_hop.sql') },
      { name: '3. tt99_02_seed_tai_khoan.sql (172 tài khoản TT99 chuẩn)', file: path.join(__dirname, 'tt99_02_seed_tai_khoan.sql') },
      { name: '4. tt99_03_seed_bieu_mau.sql (42 sổ, 15 BCTC, 33 chứng từ, B01-DN)', file: path.join(__dirname, 'tt99_03_seed_bieu_mau.sql') },
      { name: '5. tt99_15_ho_so_luu_tru.sql (8 bảng hs_*, 388 mã loại, hàm trích xuất 6 mức)', file: path.join(__dirname, 'tt99_15_ho_so_luu_tru.sql') }
    ];

    for (const s of scripts) {
      console.log(`▶ Đang chạy: ${s.name}...`);
      if (!fs.existsSync(s.file)) {
        throw new Error(`File không tồn tại: ${s.file}`);
      }
      const sql = fs.readFileSync(s.file, 'utf-8');
      await client.query(sql);
      console.log(`  ✓ Thành công: ${s.name}\n`);
    }

    console.log('=============================================================');
    console.log('  NGHIỆM THU ĐỊNH LƯỢNG SAU KHI NẠP DỮ LIỆU CHUẨN');
    console.log('=============================================================');

    await client.query('SET search_path TO acc, public;');

    const qTk = await client.query('SELECT COUNT(*) as count FROM dm_tai_khoan;');
    console.log(`- dm_tai_khoan: ${qTk.rows[0].count} / 172 tài khoản`);

    const qTkLeaf = await client.query('SELECT COUNT(*) as count FROM dm_tai_khoan WHERE la_tk_chi_tiet = TRUE;');
    console.log(`- dm_tai_khoan (TK lá): ${qTkLeaf.rows[0].count} / 148 tài khoản`);

    const qSo = await client.query('SELECT COUNT(*) as count FROM dm_bieu_mau_so;');
    console.log(`- dm_bieu_mau_so: ${qSo.rows[0].count} / 42 biểu mẫu sổ`);

    const qBctc = await client.query('SELECT COUNT(*) as count FROM dm_bieu_mau_bctc;');
    console.log(`- dm_bieu_mau_bctc: ${qBctc.rows[0].count} / 15 mẫu BCTC`);

    const qCt = await client.query('SELECT COUNT(*) as count FROM dm_cong_ty;');
    console.log(`- dm_cong_ty: ${qCt.rows[0].count} / 1 singleton`);

    const qLhs = await client.query('SELECT COUNT(*) as count FROM dm_loai_ho_so;');
    console.log(`- dm_loai_ho_so: ${qLhs.rows[0].count} mã loại hồ sơ (kỳ vọng >= 180 / 388)`);

    const qMau = await client.query('SELECT COUNT(*) as count FROM dm_bo_ho_so_mau;');
    console.log(`- dm_bo_ho_so_mau: ${qMau.rows[0].count} / 6 mẫu bộ hồ sơ`);

    // Test T1: Bất biến trục thời gian NĐ 174
    try {
      const qT1 = await client.query(`
        SELECT 
          (SELECT COALESCE(SUM(so_thanh_phan), 0) FROM fn_trich_xuat_ho_so('NGAY', p_nam => 2026)) = 
          (SELECT COALESCE(SUM(so_thanh_phan), 0) FROM fn_trich_xuat_ho_so('NAM',  p_nam => 2026)) AS t1_pass;
      `);
      console.log(`- Test T1 (Tổng thành phần Ngày == Tổng thành phần Năm): ${qT1.rows[0].t1_pass ? 'PASS ✅' : 'FAIL ❌'}`);
    } catch (e: any) {
      console.log(`- Test T1 kiểm tra hàm: ${e.message}`);
    }

    console.log('\n🎉 TOÀN BỘ SCHEMA & DỮ LIỆU NỀN TẢNG TT99 & HỒ SƠ LƯU TRỮ ĐÃ SẴN SÀNG!');
  } catch (err: any) {
    console.error('\n❌ Lỗi thực thi migration:', err.message);
  } finally {
    await client.end();
  }
}

run();
