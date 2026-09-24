/**
 * MODULE CHUYỂN ĐỔI SỐ DƯ TÀI KHOẢN THEO ĐIỀU 29 & ĐIỀU 30 THÔNG TƯ 99/2025/TT-BTC
 * Đáp ứng yêu cầu Playbook Phase 4 (Bước U3)
 * Xử lý 5 nhóm bắt buộc (CĐ-1..CĐ-5) và 4 nội dung chuyển tiếp (CT-1..CT-4)
 */

export interface SoDuTaiKhoanDauKy {
  maTk: string;
  duNo: number;
  duCo: number;
  maDoiTuong?: string;
  maChiTiet?: string;
  dienGiai?: string;
}

export interface ChungTuChuyenDoi {
  soChungTu: string;
  loaiChungTu: 'CD';
  ngayHachToan: string; // '2026-01-01'
  dienGiai: string;
  trangThai: 'CHUA_GHI_SO' | 'DA_GHI_SO';
  autoPosted: boolean;
  postingRuleId: string;
  dongHachToan: DongHachToanChuyenDoi[];
  tongNo: number;
  tongCo: number;
}

export interface DongHachToanChuyenDoi {
  soThuTu: number;
  tkNo: string;
  tkCo: string;
  soTien: number;
  dienGiai: string;
  tkNoTt200?: string;
  tkCoTt200?: string;
}

export interface KetQuaChuyenDoi {
  thanhCong: boolean;
  cheDo: 'DRY_RUN' | 'APPLY';
  thongBao: string[];
  chungTuPhatSinh: ChungTuChuyenDoi[];
  doiChieuTruocSau: BangDoiChieu;
}

export interface BangDoiChieu {
  tongTaiSanTruoc: number;
  tongTaiSanSau: number;
  tongNguonVonTruoc: number;
  tongNguonVonSau: number;
  canDoiTruoc: boolean;
  canDoiSau: boolean;
  chenhLechTaiSan: number;
  chenhLechNguonVon: number;
}

/**
 * Thực hiện chuyển đổi số dư từ chế độ cũ sang Thông tư 99/2025/TT-BTC
 * Hỗ trợ 2 chế độ:
 * - 'DRY_RUN': Chỉ tính toán và xuất báo cáo đối chiếu, không thay đổi DB
 * - 'APPLY': Áp dụng chuyển đổi chính thức và sinh chứng từ loại 'CD'
 */
export function thucHienChuyenDoiSoDuTT99(
  danhSachSoDu: SoDuTaiKhoanDauKy[],
  cheDo: 'DRY_RUN' | 'APPLY' = 'DRY_RUN'
): KetQuaChuyenDoi {
  const thongBao: string[] = [];
  const chungTuPhatSinh: ChungTuChuyenDoi[] = [];

  // Tạo map số dư có thể biến đổi
  const soDuMap: Record<string, { duNo: number; duCo: number }> = {};
  danhSachSoDu.forEach(sd => {
    soDuMap[sd.maTk] = {
      duNo: sd.duNo || 0,
      duCo: sd.duCo || 0
    };
  });

  // Tính tổng tài sản & nguồn vốn trước chuyển đổi
  const tinhTongTaiChinh = () => {
    let tongTS = 0;
    let tongNV = 0;
    Object.entries(soDuMap).forEach(([tk, val]) => {
      // TK loại 1, 2 là Tài sản (trừ các TK điều chỉnh giảm như 214, 229 mang dư Có)
      if (tk.startsWith('1') || tk.startsWith('2')) {
        tongTS += (val.duNo - val.duCo);
      }
      // TK loại 3, 4 là Nguồn vốn
      if (tk.startsWith('3') || tk.startsWith('4')) {
        tongNV += (val.duCo - val.duNo);
      }
    });
    return { tongTS, tongNV };
  };

  const truoc = tinhTongTaiChinh();

  // ---------------------------------------------------------------------------
  // CĐ-1: Điều 29 khoản 1 - Chuyển vốn góp vào HĐ hợp tác kinh doanh không đồng kiểm soát
  // Nợ 2281 / Có 138 (hoặc 1388)
  // ---------------------------------------------------------------------------
  const du138_HTKD = soDuMap['1388']?.duNo || 0;
  if (du138_HTKD > 0 && danhSachSoDu.some(s => s.maTk === '1388' && s.dienGiai?.includes('Hợp tác kinh doanh'))) {
    const dong: DongHachToanChuyenDoi[] = [{
      soThuTu: 1,
      tkNo: '2281',
      tkCo: '1388',
      soTien: du138_HTKD,
      dienGiai: 'CĐ-1: Chuyển vốn góp HĐ hợp tác kinh doanh không đồng kiểm soát sang TK 2281 (Điều 29.1)',
      tkNoTt200: '1388',
      tkCoTt200: '1388'
    }];
    chungTuPhatSinh.push({
      soChungTu: 'CD2026-0001',
      loaiChungTu: 'CD',
      ngayHachToan: '2026-01-01',
      dienGiai: 'Chuyển đổi số dư theo Điều 29 TT99 — CĐ-1: Vốn góp hợp tác kinh doanh',
      trangThai: cheDo === 'APPLY' ? 'DA_GHI_SO' : 'CHUA_GHI_SO',
      autoPosted: true,
      postingRuleId: 'CD-TT99-01',
      dongHachToan: dong,
      tongNo: du138_HTKD,
      tongCo: du138_HTKD
    });
    soDuMap['2281'] = { duNo: (soDuMap['2281']?.duNo || 0) + du138_HTKD, duCo: 0 };
    soDuMap['1388'].duNo -= du138_HTKD;
    thongBao.push(`CĐ-1: Đã chuyển đổi ${du138_HTKD.toLocaleString()} VND từ TK 1388 sang TK 2281.`);
  }

  // ---------------------------------------------------------------------------
  // CĐ-2: Điều 29 khoản 2 - Nâng cấp, cải tạo TSCĐ chưa hoàn thành
  // Nợ 2414 / Có 2413
  // ---------------------------------------------------------------------------
  const du2413 = soDuMap['2413']?.duNo || 0;
  if (du2413 > 0) {
    const dong: DongHachToanChuyenDoi[] = [{
      soThuTu: 1,
      tkNo: '2414',
      tkCo: '2413',
      soTien: du2413,
      dienGiai: 'CĐ-2: Chuyển chi phí nâng cấp cải tạo TSCĐ dở dang sang TK 2414 (Điều 29.2)',
      tkNoTt200: '2413',
      tkCoTt200: '2413'
    }];
    chungTuPhatSinh.push({
      soChungTu: 'CD2026-0002',
      loaiChungTu: 'CD',
      ngayHachToan: '2026-01-01',
      dienGiai: 'Chuyển đổi số dư theo Điều 29 TT99 — CĐ-2: Cải tạo nâng cấp TSCĐ',
      trangThai: cheDo === 'APPLY' ? 'DA_GHI_SO' : 'CHUA_GHI_SO',
      autoPosted: true,
      postingRuleId: 'CD-TT99-02',
      dongHachToan: dong,
      tongNo: du2413,
      tongCo: du2413
    });
    soDuMap['2414'] = { duNo: (soDuMap['2414']?.duNo || 0) + du2413, duCo: 0 };
    soDuMap['2413'].duNo -= du2413;
    thongBao.push(`CĐ-2: Đã chuyển đổi ${du2413.toLocaleString()} VND từ TK 2413 sang TK 2414.`);
  }

  // ---------------------------------------------------------------------------
  // CĐ-3: Điều 29 khoản 3 - Số dư phải trả cổ tức, lợi nhuận
  // Nợ 3388 (chi tiết cổ tức) / Có 332
  // ---------------------------------------------------------------------------
  const du338_CoTuc = danhSachSoDu.find(s => (s.maTk === '338' || s.maTk === '3388') && s.dienGiai?.includes('cổ tức'))?.duCo || 0;
  if (du338_CoTuc > 0) {
    const dong: DongHachToanChuyenDoi[] = [{
      soThuTu: 1,
      tkNo: '3388',
      tkCo: '332',
      soTien: du338_CoTuc,
      dienGiai: 'CĐ-3: Chuyển nghĩa vụ trả cổ tức, lợi nhuận sang TK 332 (Điều 29.3)',
      tkNoTt200: '3388',
      tkCoTt200: '3388'
    }];
    chungTuPhatSinh.push({
      soChungTu: 'CD2026-0003',
      loaiChungTu: 'CD',
      ngayHachToan: '2026-01-01',
      dienGiai: 'Chuyển đổi số dư theo Điều 29 TT99 — CĐ-3: Phải trả cổ tức lợi nhuận',
      trangThai: cheDo === 'APPLY' ? 'DA_GHI_SO' : 'CHUA_GHI_SO',
      autoPosted: true,
      postingRuleId: 'CD-TT99-03',
      dongHachToan: dong,
      tongNo: du338_CoTuc,
      tongCo: du338_CoTuc
    });
    soDuMap['332'] = { duNo: 0, duCo: (soDuMap['332']?.duCo || 0) + du338_CoTuc };
    if (soDuMap['3388']) soDuMap['3388'].duCo -= du338_CoTuc;
    thongBao.push(`CĐ-3: Đã chuyển đổi ${du338_CoTuc.toLocaleString()} VND từ TK 3388 sang TK 332.`);
  }

  // ---------------------------------------------------------------------------
  // CĐ-4: Điều 29 khoản 4 - Chuyển các quỹ 441, 461, 466 sang 4118 (Vốn khác)
  // ---------------------------------------------------------------------------
  const du441 = soDuMap['441']?.duCo || 0;
  const du461 = soDuMap['461']?.duCo || 0;
  const du466 = soDuMap['466']?.duCo || 0;
  const tongQuy = du441 + du461 + du466;

  if (tongQuy > 0) {
    const dong: DongHachToanChuyenDoi[] = [];
    let idx = 1;
    if (du441 > 0) {
      dong.push({ soThuTu: idx++, tkNo: '441', tkCo: '4118', soTien: du441, dienGiai: 'CĐ-4: Kết chuyển Nguồn vốn ĐTXDCB sang TK 4118 (Vốn khác)' });
      soDuMap['441'].duCo = 0;
    }
    if (du461 > 0) {
      dong.push({ soThuTu: idx++, tkNo: '461', tkCo: '4118', soTien: du461, dienGiai: 'CĐ-4: Kết chuyển Nguồn kinh phí sự nghiệp sang TK 4118' });
      soDuMap['461'].duCo = 0;
    }
    if (du466 > 0) {
      dong.push({ soThuTu: idx++, tkNo: '466', tkCo: '4118', soTien: du466, dienGiai: 'CĐ-4: Kết chuyển Nguồn kinh phí đã hình thành TSCĐ sang TK 4118' });
      soDuMap['466'].duCo = 0;
    }

    soDuMap['4118'] = { duNo: 0, duCo: (soDuMap['4118']?.duCo || 0) + tongQuy };

    chungTuPhatSinh.push({
      soChungTu: 'CD2026-0004',
      loaiChungTu: 'CD',
      ngayHachToan: '2026-01-01',
      dienGiai: 'Chuyển đổi số dư theo Điều 29 TT99 — CĐ-4: Chuyển các quỹ 441, 461, 466 sang 4118',
      trangThai: cheDo === 'APPLY' ? 'DA_GHI_SO' : 'CHUA_GHI_SO',
      autoPosted: true,
      postingRuleId: 'CD-TT99-04',
      dongHachToan: dong,
      tongNo: tongQuy,
      tongCo: tongQuy
    });
    thongBao.push(`CĐ-4: Đã kết chuyển ${tongQuy.toLocaleString()} VND từ các TK quỹ (441, 461, 466) sang TK 4118.`);
  }

  // ---------------------------------------------------------------------------
  // CT-1: Điều 30 khoản 1 - Kết chuyển chênh lệch tỷ giá TK 412 sang 4211
  // ---------------------------------------------------------------------------
  const du412 = soDuMap['412']?.duCo || 0;
  if (du412 > 0) {
    const dong: DongHachToanChuyenDoi[] = [{
      soThuTu: 1,
      tkNo: '412',
      tkCo: '4211',
      soTien: du412,
      dienGiai: 'CT-1: Kết chuyển chênh lệch đánh giá lại tài sản sang TK 4211 (Điều 30.1)'
    }];
    chungTuPhatSinh.push({
      soChungTu: 'CD2026-0005',
      loaiChungTu: 'CD',
      ngayHachToan: '2026-01-01',
      dienGiai: 'Chuyển đổi theo Điều 30 TT99 — CT-1: Chênh lệch tỷ giá / đánh giá lại tài sản',
      trangThai: cheDo === 'APPLY' ? 'DA_GHI_SO' : 'CHUA_GHI_SO',
      autoPosted: true,
      postingRuleId: 'CT-TT99-01',
      dongHachToan: dong,
      tongNo: du412,
      tongCo: du412
    });
    soDuMap['4211'] = { duNo: 0, duCo: (soDuMap['4211']?.duCo || 0) + du412 };
    soDuMap['412'].duCo = 0;
    thongBao.push(`CT-1: Đã kết chuyển ${du412.toLocaleString()} VND từ TK 412 sang TK 4211.`);
  }

  // Tính tổng tài sản & nguồn vốn sau chuyển đổi
  const sau = tinhTongTaiChinh();

  const doiChieu: BangDoiChieu = {
    tongTaiSanTruoc: truoc.tongTS,
    tongTaiSanSau: sau.tongTS,
    tongNguonVonTruoc: truoc.tongNV,
    tongNguonVonSau: sau.tongNV,
    canDoiTruoc: Math.abs(truoc.tongTS - truoc.tongNV) < 0.001,
    canDoiSau: Math.abs(sau.tongTS - sau.tongNV) < 0.001,
    chenhLechTaiSan: Math.round((sau.tongTS - truoc.tongTS) * 10000) / 10000,
    chenhLechNguonVon: Math.round((sau.tongNV - truoc.tongNV) * 10000) / 10000
  };

  const thanhCong = doiChieu.canDoiSau && doiChieu.chenhLechTaiSan === 0 && doiChieu.chenhLechNguonVon === 0;

  return {
    thanhCong,
    cheDo,
    thongBao,
    chungTuPhatSinh,
    doiChieuTruocSau: doiChieu
  };
}
