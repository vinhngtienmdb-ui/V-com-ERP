/**
 * MODULE KIỂM SOÁT TUÂN THỦ ĐIỀU 28 THÔNG TƯ 99/2025/TT-BTC (PHASE 9)
 * 
 * Các yêu cầu pháp lý bắt buộc:
 * 1. Điều 28.1.a & Điều 13.3: Khóa sổ kỳ kế toán — Chặn ghi sổ, sửa, xóa chứng từ vào kỳ đã khóa
 * 2. Điều 28.1.b: Đánh số chứng từ liên tục không ngắt quãng (Gap/Duplicate detection) & Vết kiểm toán (Audit Trail)
 * 3. Điều 28.1.c: Bảo đảm an toàn số liệu đã ghi sổ, phát hiện can thiệp trái phép bằng chuỗi mã băm SHA-256
 */

// Hàm tạo mã băm SHA-256 đơn giản, chạy cả trên Node.js/Vitest và Browser
export function sha256Sync(str: string): string {
  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  const utf8 = unescape(encodeURIComponent(str));
  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  const bitLen = utf8.length * 8;
  words[bitLen >> 5] |= 0x80 << (24 - (bitLen % 32));
  words[(((bitLen + 64) >> 9) << 4) + 15] = bitLen;

  const w = new Array(64);
  for (let i = 0; i < words.length; i += 16) {
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let j = 0; j < 64; j++) {
      if (j < 16) {
        w[j] = words[i + j] | 0;
      } else {
        const gamma0 = ((w[j - 15] >>> 7) | (w[j - 15] << 25)) ^ ((w[j - 15] >>> 18) | (w[j - 15] << 14)) ^ (w[j - 15] >>> 3);
        const gamma1 = ((w[j - 2] >>> 17) | (w[j - 2] << 15)) ^ ((w[j - 2] >>> 19) | (w[j - 2] << 13)) ^ (w[j - 2] >>> 10);
        w[j] = (w[j - 16] + gamma0 + w[j - 7] + gamma1) | 0;
      }
      const ch = (e & f) ^ (~e & g);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const sigma0 = ((a >>> 2) | (a << 30)) ^ ((a >>> 13) | (a << 19)) ^ ((a >>> 22) | (a << 10));
      const sigma1 = ((e >>> 6) | (e << 26)) ^ ((e >>> 11) | (e << 21)) ^ ((e >>> 25) | (e << 7));
      const t1 = (h + sigma1 + ch + k[j] + w[j]) | 0;
      const t2 = (sigma0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + t1) | 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) | 0;
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  const toHex = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
  return `${toHex(h0)}${toHex(h1)}${toHex(h2)}${toHex(h3)}${toHex(h4)}${toHex(h5)}${toHex(h6)}${toHex(h7)}`;
}

// =============================================================================
// 1. QUẢN LÝ KỲ KẾ TOÁN & KHÓA SỔ (ĐIỀU 13.3 & ĐIỀU 28.1.a)
// =============================================================================

export interface KyKeToan {
  thang: number;
  nam: number;
  trangThai: 'MO' | 'DA_KHOA_SO';
  ngayKhoa?: string;
  nguoiKhoa?: string;
  checksumKy?: string;
  soChungTuTrongKy?: number;
}

export function kiemTraKhoaSoKhiGhiSo(
  ngayHachToan: string,
  danhSachKy: KyKeToan[]
): { hopLe: boolean; lyDo?: string } {
  const [namStr, thangStr] = ngayHachToan.split('-');
  const nam = parseInt(namStr, 10);
  const thang = parseInt(thangStr, 10);

  const ky = danhSachKy.find(k => k.nam === nam && k.thang === thang);
  if (ky && ky.trangThai === 'DA_KHOA_SO') {
    return {
      hopLe: false,
      lyDo: `Kỳ kế toán tháng ${thang}/${nam} đã bị khóa sổ bởi ${ky.nguoiKhoa || 'Kế toán trưởng'} vào ngày ${ky.ngayKhoa}. Không được phép thêm, sửa hoặc xóa chứng từ theo Điều 13 và Điều 28 Thông tư 99/2025/TT-BTC.`
    };
  }

  return { hopLe: true };
}

// =============================================================================
// 2. TÍNH TOÀN VẸN CHỨNG TỪ & MERKLE / BLOCK CHAINING HASH (ĐIỀU 28.1.c)
// =============================================================================

export interface ChungTuHashable {
  id: string;
  soChungTu: string;
  ngayHachToan: string;
  tongTien: number;
  dongHachToan: {
    tkNo: string;
    tkCo: string;
    soTien: number;
  }[];
  prevHash?: string;
  currentHash?: string;
}

/**
 * Tính toán mã băm SHA-256 chuỗi khối cho 1 chứng từ
 */
export function tinhHashChungTu(ct: ChungTuHashable, prevHash: string = 'GENESIS_BLOCK'): string {
  const content = `${ct.soChungTu}|${ct.ngayHachToan}|${ct.tongTien}|${prevHash}|${JSON.stringify(ct.dongHachToan)}`;
  return sha256Sync(content);
}

/**
 * Tính toán chuỗi mã băm cho toàn bộ danh sách chứng từ và trả về Checksum kỳ
 */
export function taoChuoiHashChungTu(danhSach: ChungTuHashable[]): {
  danhSachWithHash: ChungTuHashable[];
  checksumKy: string;
} {
  let prevHash = 'GENESIS_BLOCK';
  const result: ChungTuHashable[] = [];

  for (const ct of danhSach) {
    const currentHash = tinhHashChungTu(ct, prevHash);
    const itemWithHash: ChungTuHashable = {
      ...ct,
      prevHash,
      currentHash
    };
    result.push(itemWithHash);
    prevHash = currentHash;
  }

  return {
    danhSachWithHash: result,
    checksumKy: prevHash
  };
}

/**
 * Quét phát hiện can thiệp dữ liệu trái phép (Tamper Detection)
 */
export function kiemTraToanVenChuoiChungTu(danhSach: ChungTuHashable[]): {
  toanVen: boolean;
  viTriBiLoi?: number;
  soChungTuBiLoi?: string;
  thongBao: string;
} {
  let prevHash = 'GENESIS_BLOCK';

  for (let i = 0; i < danhSach.length; i++) {
    const ct = danhSach[i];
    
    // 1. Kiểm tra prevHash khớp với block trước
    if (ct.prevHash !== prevHash) {
      return {
        toanVen: false,
        viTriBiLoi: i + 1,
        soChungTuBiLoi: ct.soChungTu,
        thongBao: `CẢNH BÁO VI PHẠM ĐIỀU 28 TT99: Phát hiện sai lệch liên kết chuỗi khối tại chứng từ ${ct.soChungTu}. Dữ liệu trước đó có thể đã bị sửa đổi trái phép!`
      };
    }

    // 2. Tính lại hash của chứng từ hiện tại
    const recalculatedHash = tinhHashChungTu(ct, prevHash);
    if (recalculatedHash !== ct.currentHash) {
      return {
        toanVen: false,
        viTriBiLoi: i + 1,
        soChungTuBiLoi: ct.soChungTu,
        thongBao: `CẢNH BÁO VI PHẠM ĐIỀU 28 TT99: Phát hiện can thiệp số liệu tại chứng từ ${ct.soChungTu}! Mã băm lưu trữ không khớp với dữ liệu thực tế.`
      };
    }

    prevHash = ct.currentHash;
  }

  return {
    toanVen: true,
    thongBao: 'Hệ thống đã xác minh tính toàn vẹn 100%: Toàn bộ chứng từ khớp chuỗi mã băm SHA-256 bất biến.'
  };
}

// =============================================================================
// 3. ĐÁNH SỐ CHỨNG TỪ LIÊN TỤC & PHÁT HIỆN ĐỨT ĐOẠN (ĐIỀU 28.1.b)
// =============================================================================

export interface KetQuaKiemTraSoChungTu {
  hopLe: boolean;
  tongSo: number;
  danhSachTrungLap: string[];
  danhSachKhoangTrong: number[]; // Các số thứ tự bị thiếu
}

/**
 * Kiểm tra tính liên tục không ngắt quãng và không trùng lặp của số chứng từ
 * Định dạng chuẩn: TIEN_TO-YYYY-STT (ví dụ: PKT-2026-0001, PT-2026-0005)
 */
export function kiemTraDanhSoLienTuc(danhSachSo: string[]): KetQuaKiemTraSoChungTu {
  const countMap = new Map<string, number>();
  const duplicateList: string[] = [];

  for (const s of danhSachSo) {
    countMap.set(s, (countMap.get(s) || 0) + 1);
  }

  for (const [k, v] of countMap.entries()) {
    if (v > 1) duplicateList.push(k);
  }

  // Tách số thứ tự cuối cùng
  const numbers: number[] = [];
  for (const s of danhSachSo) {
    const parts = s.split('-');
    const lastPart = parts[parts.length - 1];
    const num = parseInt(lastPart, 10);
    if (!isNaN(num)) {
      numbers.push(num);
    }
  }

  numbers.sort((a, b) => a - b);
  const gaps: number[] = [];

  if (numbers.length > 0) {
    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    const numSet = new Set(numbers);

    for (let i = min; i <= max; i++) {
      if (!numSet.has(i)) {
        gaps.push(i);
      }
    }
  }

  return {
    hopLe: duplicateList.length === 0 && gaps.length === 0,
    tongSo: danhSachSo.length,
    danhSachTrungLap: duplicateList,
    danhSachKhoangTrong: gaps
  };
}

// =============================================================================
// 4. VẾT KIỂM TOÁN BẤT BIẾN THEO TRÌNH TỰ THỜI GIAN (ĐIỀU 28.1.b)
// =============================================================================

export interface NhatKyKiemToan {
  sequenceNo: number;
  recordedAt: string;
  userId: string;
  userName: string;
  hanhDong: 'TAO_MOI' | 'GHI_SO' | 'BO_GHI_SO' | 'KHOA_SO' | 'MO_KHOA_SO' | 'DAO_CHUNG_TU';
  loaiDoiTuong: 'CHUNG_TU' | 'KY_KE_TOAN' | 'DANH_MUC';
  doiTuongId: string;
  duLieuCu?: string;
  duLieuMoi?: string;
  checksumHanhDong: string;
}

export class AuditTrailManager {
  private logs: NhatKyKiemToan[] = [];
  private currentSeq = 0;

  public ghiLog(
    userId: string,
    userName: string,
    hanhDong: NhatKyKiemToan['hanhDong'],
    loaiDoiTuong: NhatKyKiemToan['loaiDoiTuong'],
    doiTuongId: string,
    duLieuCu?: any,
    duLieuMoi?: any
  ): NhatKyKiemToan {
    this.currentSeq += 1;
    const now = new Date().toISOString();
    const oldStr = duLieuCu ? JSON.stringify(duLieuCu) : '';
    const newStr = duLieuMoi ? JSON.stringify(duLieuMoi) : '';

    const prevLogHash = this.logs.length > 0 ? this.logs[this.logs.length - 1].checksumHanhDong : 'AUDIT_INIT';
    const checksum = sha256Sync(`${this.currentSeq}|${now}|${userId}|${hanhDong}|${doiTuongId}|${oldStr}|${newStr}|${prevLogHash}`);

    const entry: NhatKyKiemToan = {
      sequenceNo: this.currentSeq,
      recordedAt: now,
      userId,
      userName,
      hanhDong,
      loaiDoiTuong,
      doiTuongId,
      duLieuCu: oldStr,
      duLieuMoi: newStr,
      checksumHanhDong: checksum
    };

    // Append-only
    this.logs.push(entry);
    return entry;
  }

  public getLogs(): NhatKyKiemToan[] {
    return [...this.logs];
  }

  public xacMinhTinhToanVenLog(): boolean {
    let prevHash = 'AUDIT_INIT';
    for (const log of this.logs) {
      const expected = sha256Sync(
        `${log.sequenceNo}|${log.recordedAt}|${log.userId}|${log.hanhDong}|${log.doiTuongId}|${log.duLieuCu || ''}|${log.duLieuMoi || ''}|${prevHash}`
      );
      if (expected !== log.checksumHanhDong) {
        return false;
      }
      prevHash = log.checksumHanhDong;
    }
    return true;
  }
}
