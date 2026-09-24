const fs = require('fs');
const path = require('path');

const csvPath = 'd:/VComm/thiet-ke-erp-ke-toan/07_danh_muc_tai_khoan_tt99.csv';
const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.trim().split('\n');

const accounts = [];

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Custom CSV parser handling quotes
  const parts = [];
  let inQuotes = false;
  let current = '';
  
  for (let c = 0; c < line.length; c++) {
    const char = line[c];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  parts.push(current);

  accounts.push({
    maTk: parts[0] || '',
    tenTk: parts[1] || '',
    tkMe: parts[2] || undefined,
    cap: parseInt(parts[3] || '1', 10),
    loaiTk: parts[4] || '',
    tinhChat: parts[5] || '',
    laChiTiet: parts[6] === 'TRUE',
    laCongNo: parts[7] === 'TRUE',
    laKho: parts[8] === 'TRUE',
    laNgoaiTe: parts[9] === 'TRUE',
    laThue: parts[10] === 'TRUE'
  });
}

const outDir = 'd:/VComm/vcomm-erp-tt99/src/data';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const tsContent = `// =============================================================================
// DANH MỤC 172 TÀI KHOẢN KẾ TOÁN THÔNG TƯ 99/2025/TT-BTC (PHỤ LỤC II)
// =============================================================================

export interface TaiKhoanTt99 {
  maTk: string;
  tenTk: string;
  tkMe?: string;
  cap: number;
  loaiTk: string;
  tinhChat: string;
  laChiTiet: boolean;
  laCongNo: boolean;
  laKho: boolean;
  laNgoaiTe: boolean;
  laThue: boolean;
}

export const DANH_MUC_TAI_KHOAN_TT99: TaiKhoanTt99[] = ${JSON.stringify(accounts, null, 2)};
`;

fs.writeFileSync(path.join(outDir, 'danhMucTaiKhoanTt99.ts'), tsContent, 'utf8');
console.log(`Đã xuất thành công ${accounts.length} tài khoản TT99 vào danhMucTaiKhoanTt99.ts`);
