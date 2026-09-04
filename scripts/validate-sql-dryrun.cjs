// Dry-run validation: chạy toàn bộ migration trong MỘT transaction rồi ROLLBACK.
// Không thay đổi gì trên database — chỉ để Postgres kiểm tra cú pháp & ràng buộc.
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const env = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const m = env.match(/^DATABASE_URL=(.*)$/m);
if (!m) { console.error('Không tìm thấy DATABASE_URL trong .env'); process.exit(1); }
const url = m[1].trim();

const files = process.argv.slice(2);
if (!files.length) { console.error('Cần truyền danh sách file .sql'); process.exit(1); }

(async () => {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  await client.connect();
  let failed = false;
  try {
    await client.query('BEGIN');
    for (const f of files) {
      const sql = fs.readFileSync(f, 'utf8');
      try {
        await client.query(sql);
        console.log('OK    ' + path.basename(f));
      } catch (e) {
        failed = true;
        console.log('FAIL  ' + path.basename(f));
        console.log('  ' + e.message);
        if (e.position) {
          const pos = parseInt(e.position, 10);
          console.log('  --- ngữ cảnh ---');
          console.log(sql.slice(Math.max(0, pos - 300), pos + 200));
          console.log('  ----------------');
        }
        break;
      }
    }
  } catch (e) {
    failed = true;
    console.log('LỖI KẾT NỐI/GIAO DỊCH: ' + e.message);
  } finally {
    try { await client.query('ROLLBACK'); } catch (_) {}
    console.log(failed
      ? '\n>>> ĐÃ ROLLBACK — database KHÔNG thay đổi. Cần sửa lỗi ở trên.'
      : '\n>>> TẤT CẢ HỢP LỆ — đã ROLLBACK, database KHÔNG thay đổi.');
    await client.end();
  }
  process.exit(failed ? 1 : 0);
})();
