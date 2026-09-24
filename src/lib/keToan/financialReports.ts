/**
 * HỆ THỐNG SỔ KẾ TOÁN & BÁO CÁO TÀI CHÍNH THEO THÔNG TƯ 99/2025/TT-BTC (PHASE 7)
 * Căn cứ:
 * - Phụ lục III: Danh mục 42 biểu mẫu Sổ kế toán (S03-DN, S04-DN, S05-DN...)
 * - Phụ lục IV: Biểu mẫu Báo cáo tài chính (B01-DN, B02-DN, B03-DN)
 * - Điều 17 & Điều 18 Thông tư 99/2025/TT-BTC
 */

export interface DongChungTuReport {
  id: string;
  soChungTu: string;
  ngayChungTu: string;
  ngayHachToan: string;
  loaiChungTu: string;
  dienGiai: string;
  dongHachToan: {
    tkNo: string;
    tkCo: string;
    soTien: number;
    dienGiai?: string;
    doiTuongId?: string;
    khoId?: string;
  }[];
  trangThai: 'DA_GHI_SO' | 'BO_GHI_SO';
}

export interface SoDuDauKyItem {
  maTk: string;
  tenTk: string;
  duNoDauKy: number;
  duCoDauKy: number;
}

// =============================================================================
// 1. BẢNG CÂN ĐỐI SỐ PHÁT SINH (TRIAL BALANCE - F01-DN)
// =============================================================================

export interface DongBangCanDoiPhatSinh {
  maTk: string;
  tenTk: string;
  duNoDauKy: number;
  duCoDauKy: number;
  phatSinhNo: number;
  phatSinhCo: number;
  duNoCuoiKy: number;
  duCoCuoiKy: number;
}

export interface KetQuaBangCanDoiPhatSinh {
  tuNgay: string;
  denNgay: string;
  danhSachTk: DongBangCanDoiPhatSinh[];
  tongDuNoDauKy: number;
  tongDuCoDauKy: number;
  tongPhatSinhNo: number;
  tongPhatSinhCo: number;
  tongDuNoCuoiKy: number;
  tongDuCoCuoiKy: number;
  canDoiDauKy: boolean;
  canDoiPhatSinh: boolean;
  canDoiCuoiKy: boolean;
}

export function lapBangCanDoiPhatSinh(
  tuNgay: string,
  denNgay: string,
  soDuDauKy: SoDuDauKyItem[],
  chungTuList: DongChungTuReport[]
): KetQuaBangCanDoiPhatSinh {
  const mapTk = new Map<string, DongBangCanDoiPhatSinh>();

  // Nạp số dư đầu kỳ
  for (const sd of soDuDauKy) {
    mapTk.set(sd.maTk, {
      maTk: sd.maTk,
      tenTk: sd.tenTk,
      duNoDauKy: sd.duNoDauKy,
      duCoDauKy: sd.duCoDauKy,
      phatSinhNo: 0,
      phatSinhCo: 0,
      duNoCuoiKy: 0,
      duCoCuoiKy: 0
    });
  }

  // Tính phát sinh từ các chứng từ đã ghi sổ trong khoảng thời gian
  const validVouchers = chungTuList.filter(
    ct => ct.trangThai === 'DA_GHI_SO' && ct.ngayHachToan >= tuNgay && ct.ngayHachToan <= denNgay
  );

  for (const ct of validVouchers) {
    for (const d of ct.dongHachToan) {
      // Bên Nợ
      if (!mapTk.has(d.tkNo)) {
        mapTk.set(d.tkNo, {
          maTk: d.tkNo,
          tenTk: `Tài khoản ${d.tkNo}`,
          duNoDauKy: 0,
          duCoDauKy: 0,
          phatSinhNo: 0,
          phatSinhCo: 0,
          duNoCuoiKy: 0,
          duCoCuoiKy: 0
        });
      }
      mapTk.get(d.tkNo)!.phatSinhNo += d.soTien;

      // Bên Có
      if (!mapTk.has(d.tkCo)) {
        mapTk.set(d.tkCo, {
          maTk: d.tkCo,
          tenTk: `Tài khoản ${d.tkCo}`,
          duNoDauKy: 0,
          duCoDauKy: 0,
          phatSinhNo: 0,
          phatSinhCo: 0,
          duNoCuoiKy: 0,
          duCoCuoiKy: 0
        });
      }
      mapTk.get(d.tkCo)!.phatSinhCo += d.soTien;
    }
  }

  let tongDuNoDauKy = 0;
  let tongDuCoDauKy = 0;
  let tongPhatSinhNo = 0;
  let tongPhatSinhCo = 0;
  let tongDuNoCuoiKy = 0;
  let tongDuCoCuoiKy = 0;

  const danhSachTk: DongBangCanDoiPhatSinh[] = Array.from(mapTk.values()).sort((a, b) =>
    a.maTk.localeCompare(b.maTk)
  );

  for (const item of danhSachTk) {
    // Tính số dư cuối kỳ theo tính chất tài khoản
    // Nhóm 1, 2, 6, 8 thường dư Nợ; Nhóm 3, 4, 5, 7 thường dư Có
    const netDauKy = item.duNoDauKy - item.duCoDauKy;
    const netPhatSinh = item.phatSinhNo - item.phatSinhCo;
    const netCuoiKy = netDauKy + netPhatSinh;

    if (netCuoiKy >= 0) {
      item.duNoCuoiKy = Math.round(netCuoiKy * 100) / 100;
      item.duCoCuoiKy = 0;
    } else {
      item.duNoCuoiKy = 0;
      item.duCoCuoiKy = Math.round(Math.abs(netCuoiKy) * 100) / 100;
    }

    tongDuNoDauKy += item.duNoDauKy;
    tongDuCoDauKy += item.duCoDauKy;
    tongPhatSinhNo += item.phatSinhNo;
    tongPhatSinhCo += item.phatSinhCo;
    tongDuNoCuoiKy += item.duNoCuoiKy;
    tongDuCoCuoiKy += item.duCoCuoiKy;
  }

  return {
    tuNgay,
    denNgay,
    danhSachTk,
    tongDuNoDauKy: Math.round(tongDuNoDauKy * 100) / 100,
    tongDuCoDauKy: Math.round(tongDuCoDauKy * 100) / 100,
    tongPhatSinhNo: Math.round(tongPhatSinhNo * 100) / 100,
    tongPhatSinhCo: Math.round(tongPhatSinhCo * 100) / 100,
    tongDuNoCuoiKy: Math.round(tongDuNoCuoiKy * 100) / 100,
    tongDuCoCuoiKy: Math.round(tongDuCoCuoiKy * 100) / 100,
    canDoiDauKy: Math.abs(tongDuNoDauKy - tongDuCoDauKy) < 0.01,
    canDoiPhatSinh: Math.abs(tongPhatSinhNo - tongPhatSinhCo) < 0.01,
    canDoiCuoiKy: Math.abs(tongDuNoCuoiKy - tongDuCoCuoiKy) < 0.01
  };
}

// =============================================================================
// 2. SỔ NHẬT KÝ CHUNG (MẪU S03-DN THEO TT99)
// =============================================================================

export interface DongSoNhatKyChung {
  stt: number;
  ngayGhiSo: string;
  soChungTu: string;
  ngayChungTu: string;
  dienGiai: string;
  tkDoiUng: string;
  soPhatSinhNo: number;
  soPhatSinhCo: number;
}

export function xuatSoNhatKyChung(
  tuNgay: string,
  denNgay: string,
  chungTuList: DongChungTuReport[]
): {
  danhSachDong: DongSoNhatKyChung[];
  tongPhatSinhNo: number;
  tongPhatSinhCo: number;
} {
  const filtered = chungTuList
    .filter(ct => ct.trangThai === 'DA_GHI_SO' && ct.ngayHachToan >= tuNgay && ct.ngayHachToan <= denNgay)
    .sort((a, b) => a.ngayHachToan.localeCompare(b.ngayHachToan) || a.soChungTu.localeCompare(b.soChungTu));

  const danhSachDong: DongSoNhatKyChung[] = [];
  let stt = 1;
  let tongPhatSinhNo = 0;
  let tongPhatSinhCo = 0;

  for (const ct of filtered) {
    for (const d of ct.dongHachToan) {
      // Dòng ghi Nợ
      danhSachDong.push({
        stt: stt++,
        ngayGhiSo: ct.ngayHachToan,
        soChungTu: ct.soChungTu,
        ngayChungTu: ct.ngayChungTu,
        dienGiai: d.dienGiai || ct.dienGiai,
        tkDoiUng: `${d.tkNo} / ${d.tkCo}`,
        soPhatSinhNo: d.soTien,
        soPhatSinhCo: 0
      });

      // Dòng ghi Có
      danhSachDong.push({
        stt: stt++,
        ngayGhiSo: ct.ngayHachToan,
        soChungTu: ct.soChungTu,
        ngayChungTu: ct.ngayChungTu,
        dienGiai: d.dienGiai || ct.dienGiai,
        tkDoiUng: `${d.tkCo} / ${d.tkNo}`,
        soPhatSinhNo: 0,
        soPhatSinhCo: d.soTien
      });

      tongPhatSinhNo += d.soTien;
      tongPhatSinhCo += d.soTien;
    }
  }

  return {
    danhSachDong,
    tongPhatSinhNo: Math.round(tongPhatSinhNo * 100) / 100,
    tongPhatSinhCo: Math.round(tongPhatSinhCo * 100) / 100
  };
}

// =============================================================================
// 3. SỔ CÁI (MẪU S04-DN THEO TT99)
// =============================================================================

export interface DongSoCai {
  ngayGhiSo: string;
  soChungTu: string;
  ngayChungTu: string;
  dienGiai: string;
  tkDoiUng: string;
  soPhatSinhNo: number;
  soPhatSinhCo: number;
  soDu: number;
}

export function xuatSoCai(
  maTk: string,
  tuNgay: string,
  denNgay: string,
  soDuDauKy: number,
  chungTuList: DongChungTuReport[]
): {
  maTk: string;
  soDuDauKy: number;
  danhSachDong: DongSoCai[];
  tongPhatSinhNo: number;
  tongPhatSinhCo: number;
  soDuCuoiKy: number;
} {
  const filtered = chungTuList
    .filter(ct => ct.trangThai === 'DA_GHI_SO' && ct.ngayHachToan >= tuNgay && ct.ngayHachToan <= denNgay)
    .sort((a, b) => a.ngayHachToan.localeCompare(b.ngayHachToan) || a.soChungTu.localeCompare(b.soChungTu));

  const danhSachDong: DongSoCai[] = [];
  let currentBalance = soDuDauKy;
  let tongPhatSinhNo = 0;
  let tongPhatSinhCo = 0;

  for (const ct of filtered) {
    for (const d of ct.dongHachToan) {
      if (d.tkNo === maTk) {
        currentBalance += d.soTien;
        tongPhatSinhNo += d.soTien;
        danhSachDong.push({
          ngayGhiSo: ct.ngayHachToan,
          soChungTu: ct.soChungTu,
          ngayChungTu: ct.ngayChungTu,
          dienGiai: d.dienGiai || ct.dienGiai,
          tkDoiUng: d.tkCo,
          soPhatSinhNo: d.soTien,
          soPhatSinhCo: 0,
          soDu: currentBalance
        });
      } else if (d.tkCo === maTk) {
        currentBalance -= d.soTien;
        tongPhatSinhCo += d.soTien;
        danhSachDong.push({
          ngayGhiSo: ct.ngayHachToan,
          soChungTu: ct.soChungTu,
          ngayChungTu: ct.ngayChungTu,
          dienGiai: d.dienGiai || ct.dienGiai,
          tkDoiUng: d.tkNo,
          soPhatSinhNo: 0,
          soPhatSinhCo: d.soTien,
          soDu: currentBalance
        });
      }
    }
  }

  return {
    maTk,
    soDuDauKy,
    danhSachDong,
    tongPhatSinhNo: Math.round(tongPhatSinhNo * 100) / 100,
    tongPhatSinhCo: Math.round(tongPhatSinhCo * 100) / 100,
    soDuCuoiKy: Math.round(currentBalance * 100) / 100
  };
}

// =============================================================================
// 4. BÁO CÁO TÌNH HÌNH TÀI CHÍNH (B01-DN THEO TT99)
// =============================================================================

export interface ChiTieuB01 {
  maSo: string;
  chiTieu: string;
  thuyetMinh?: string;
  soCuoiKy: number;
  soDauKy: number;
  isHeader?: boolean;
}

export function lapBaoCaoTinhHinhTaiChinh(
  bangCanDoi: KetQuaBangCanDoiPhatSinh
): {
  danhSachChiTieu: ChiTieuB01[];
  tongTaiSan: number;
  tongNguonVon: number;
  canDoi: boolean;
} {
  const getSoDuTk = (prefix: string): number => {
    return bangCanDoi.danhSachTk
      .filter(t => t.maTk.startsWith(prefix))
      .reduce((sum, t) => sum + (t.duNoCuoiKy - t.duCoCuoiKy), 0);
  };

  const getDuNoTk = (prefix: string): number => {
    return bangCanDoi.danhSachTk
      .filter(t => t.maTk.startsWith(prefix))
      .reduce((sum, t) => sum + t.duNoCuoiKy, 0);
  };

  const getDuCoTk = (prefix: string): number => {
    return bangCanDoi.danhSachTk
      .filter(t => t.maTk.startsWith(prefix))
      .reduce((sum, t) => sum + t.duCoCuoiKy, 0);
  };

  // A - TÀI SẢN NGẮN HẠN (Mã 100)
  const tien = getDuNoTk('111') + getDuNoTk('112') + getDuNoTk('113');
  const dauTuNganHan = getDuNoTk('121') + getDuNoTk('128');
  const phaiThuNganHan = getDuNoTk('131') + getDuNoTk('136') + getDuNoTk('138');
  const hangTonKho = getDuNoTk('151') + getDuNoTk('152') + getDuNoTk('153') + getDuNoTk('155') + getDuNoTk('156') + getDuNoTk('157') + getDuNoTk('158');
  const taiSanNganHanKhac = getDuNoTk('133') + getDuNoTk('242'); // chi phí trả trước ngắn hạn
  const ma100 = tien + dauTuNganHan + phaiThuNganHan + hangTonKho + taiSanNganHanKhac;

  // B - TÀI SẢN DÀI HẠN (Mã 200)
  const nguyenGiaTscd = getDuNoTk('211') + getDuNoTk('213');
  const haoMonTscd = getDuCoTk('214'); // giá trị âm
  const giaTriConLaiTscd = nguyenGiaTscd - haoMonTscd;
  const xdcbdangDo = getDuNoTk('241');
  const dauTuDaiHan = getDuNoTk('221') + getDuNoTk('222') + getDuNoTk('228');
  const ma200 = giaTriConLaiTscd + xdcbdangDo + dauTuDaiHan;

  // TỔNG CỘNG TÀI SẢN (Mã 280 theo TT99)
  const ma280 = ma100 + ma200;

  // C - NỢ PHẢI TRẢ (Mã 300)
  const phaiTraNguoiBan = getDuCoTk('331');
  const thuePhaiNop = getDuCoTk('333');
  const phaiTraNguoiLaoDong = getDuCoTk('334');
  const phaiTraCoTuc = getDuCoTk('332'); // TT99 tài khoản mới 332
  const vayVaNo = getDuCoTk('341');
  const ma300 = phaiTraNguoiBan + thuePhaiNop + phaiTraNguoiLaoDong + phaiTraCoTuc + vayVaNo;

  // D - VỐN CHỦ SỞ HỮU (Mã 400)
  const vonGop = getDuCoTk('411');
  const loiNhuanChuaPhanPhoi = getDuCoTk('421') - getDuNoTk('421');
  const ma400 = vonGop + loiNhuanChuaPhanPhoi;

  const tongNguonVon = ma300 + ma400;

  const danhSachChiTieu: ChiTieuB01[] = [
    { maSo: '100', chiTieu: 'A. TÀI SẢN NGẮN HẠN', soCuoiKy: ma100, soDauKy: 0, isHeader: true },
    { maSo: '110', chiTieu: 'I. Tiền và các khoản tương đương tiền', soCuoiKy: tien, soDauKy: 0 },
    { maSo: '120', chiTieu: 'II. Đầu tư tài chính ngắn hạn', soCuoiKy: dauTuNganHan, soDauKy: 0 },
    { maSo: '130', chiTieu: 'III. Các khoản phải thu ngắn hạn', soCuoiKy: phaiThuNganHan, soDauKy: 0 },
    { maSo: '140', chiTieu: 'IV. Hàng tồn kho', soCuoiKy: hangTonKho, soDauKy: 0 },
    { maSo: '150', chiTieu: 'V. Tài sản ngắn hạn khác', soCuoiKy: taiSanNganHanKhac, soDauKy: 0 },
    { maSo: '200', chiTieu: 'B. TÀI SẢN DÀI HẠN', soCuoiKy: ma200, soDauKy: 0, isHeader: true },
    { maSo: '220', chiTieu: 'I. Tài sản cố định', soCuoiKy: giaTriConLaiTscd, soDauKy: 0 },
    { maSo: '250', chiTieu: 'II. Tài sản dở dang dài hạn', soCuoiKy: xdcbdangDo, soDauKy: 0 },
    { maSo: '260', chiTieu: 'III. Đầu tư tài chính dài hạn', soCuoiKy: dauTuDaiHan, soDauKy: 0 },
    { maSo: '280', chiTieu: 'TỔNG CỘNG TÀI SẢN (280 = 100 + 200)', soCuoiKy: ma280, soDauKy: 0, isHeader: true },
    { maSo: '300', chiTieu: 'C. NỢ PHẢI TRẢ', soCuoiKy: ma300, soDauKy: 0, isHeader: true },
    { maSo: '311', chiTieu: '1. Phải trả người bán ngắn hạn', soCuoiKy: phaiTraNguoiBan, soDauKy: 0 },
    { maSo: '313', chiTieu: '2. Phải trả cổ tức, lợi nhuận (TK 332)', soCuoiKy: phaiTraCoTuc, soDauKy: 0 },
    { maSo: '314', chiTieu: '3. Thuế và các khoản phải nộp Nhà nước', soCuoiKy: thuePhaiNop, soDauKy: 0 },
    { maSo: '315', chiTieu: '4. Phải trả người lao động', soCuoiKy: phaiTraNguoiLaoDong, soDauKy: 0 },
    { maSo: '320', chiTieu: '5. Vay và nợ thuê tài chính', soCuoiKy: vayVaNo, soDauKy: 0 },
    { maSo: '400', chiTieu: 'D. VỐN CHỦ SỞ HỮU', soCuoiKy: ma400, soDauKy: 0, isHeader: true },
    { maSo: '411', chiTieu: '1. Vốn góp của chủ sở hữu', soCuoiKy: vonGop, soDauKy: 0 },
    { maSo: '421', chiTieu: '2. Lợi nhuận sau thuế chưa phân phối', soCuoiKy: loiNhuanChuaPhanPhoi, soDauKy: 0 },
    { maSo: '440', chiTieu: 'TỔNG CỘNG NGUỒN VỐN (440 = 300 + 400)', soCuoiKy: tongNguonVon, soDauKy: 0, isHeader: true }
  ];

  return {
    danhSachChiTieu,
    tongTaiSan: ma280,
    tongNguonVon,
    canDoi: Math.abs(ma280 - tongNguonVon) < 0.01
  };
}

// =============================================================================
// 5. BÁO CÁO KẾT QUẢ KINH DOANH (B02-DN THEO TT99)
// =============================================================================

export interface ChiTieuB02 {
  maSo: string;
  chiTieu: string;
  thuyetMinh?: string;
  kyNay: number;
  kyTruoc: number;
  isHeader?: boolean;
}

export function lapBaoCaoKetQuaKinhDoanh(
  tuNgay: string,
  denNgay: string,
  chungTuList: DongChungTuReport[]
): {
  danhSachChiTieu: ChiTieuB02[];
  doanhThuThuan: number;
  loiNhuanGop: number;
  loiNhuanThuan: number;
  loiNhuanTruocThue: number;
  loiNhuanSauThue: number;
} {
  const filtered = chungTuList.filter(
    ct => ct.trangThai === 'DA_GHI_SO' && ct.ngayHachToan >= tuNgay && ct.ngayHachToan <= denNgay
  );

  let doanhThuBanHang = 0; // Có TK 511
  let giamTruDoanhThu = 0; // Nợ TK 521
  let giaVonHangBan = 0; // Nợ TK 632
  let doanhThuTaiChinh = 0; // Có TK 515
  let chiPhiTaiChinh = 0; // Nợ TK 635
  let chiPhiBanHang = 0; // Nợ TK 641
  let chiPhiQuanLy = 0; // Nợ TK 642
  let thuNhapKhac = 0; // Có TK 711
  let chiPhiKhac = 0; // Nợ TK 811
  let chiPhiThueTndnHienHanh = 0; // Nợ TK 8211 (TT99 tách 8211/8212)

  for (const ct of filtered) {
    for (const d of ct.dongHachToan) {
      if (d.tkCo.startsWith('511')) doanhThuBanHang += d.soTien;
      if (d.tkNo.startsWith('521')) giamTruDoanhThu += d.soTien;
      if (d.tkNo.startsWith('632')) giaVonHangBan += d.soTien;
      if (d.tkCo.startsWith('515')) doanhThuTaiChinh += d.soTien;
      if (d.tkNo.startsWith('635')) chiPhiTaiChinh += d.soTien;
      if (d.tkNo.startsWith('641')) chiPhiBanHang += d.soTien;
      if (d.tkNo.startsWith('642')) chiPhiQuanLy += d.soTien;
      if (d.tkCo.startsWith('711')) thuNhapKhac += d.soTien;
      if (d.tkNo.startsWith('811')) chiPhiKhac += d.soTien;
      if (d.tkNo === '8211' || d.tkNo === '821') chiPhiThueTndnHienHanh += d.soTien;
    }
  }

  const doanhThuThuan = doanhThuBanHang - giamTruDoanhThu; // Mã 10 = 01 - 02
  const loiNhuanGop = doanhThuThuan - giaVonHangBan; // Mã 20 = 10 - 11
  const loiNhuanThuan = loiNhuanGop + doanhThuTaiChinh - chiPhiTaiChinh - chiPhiBanHang - chiPhiQuanLy; // Mã 30
  const loiNhuanKhac = thuNhapKhac - chiPhiKhac; // Mã 40 = 31 - 32
  const loiNhuanTruocThue = loiNhuanThuan + loiNhuanKhac; // Mã 50 = 30 + 40
  const loiNhuanSauThue = loiNhuanTruocThue - chiPhiThueTndnHienHanh; // Mã 60 = 50 - 51

  const danhSachChiTieu: ChiTieuB02[] = [
    { maSo: '01', chiTieu: '1. Doanh thu bán hàng và cung cấp dịch vụ', kyNay: doanhThuBanHang, kyTruoc: 0 },
    { maSo: '02', chiTieu: '2. Các khoản giảm trừ doanh thu', kyNay: giamTruDoanhThu, kyTruoc: 0 },
    { maSo: '10', chiTieu: '3. Doanh thu thuần về bán hàng và CCDV (10 = 01 - 02)', kyNay: doanhThuThuan, kyTruoc: 0, isHeader: true },
    { maSo: '11', chiTieu: '4. Giá vốn hàng bán', kyNay: giaVonHangBan, kyTruoc: 0 },
    { maSo: '20', chiTieu: '5. Lợi nhuận gộp về bán hàng và CCDV (20 = 10 - 11)', kyNay: loiNhuanGop, kyTruoc: 0, isHeader: true },
    { maSo: '21', chiTieu: '6. Doanh thu hoạt động tài chính', kyNay: doanhThuTaiChinh, kyTruoc: 0 },
    { maSo: '22', chiTieu: '7. Chi phí tài chính', kyNay: chiPhiTaiChinh, kyTruoc: 0 },
    { maSo: '25', chiTieu: '8. Chi phí bán hàng', kyNay: chiPhiBanHang, kyTruoc: 0 },
    { maSo: '26', chiTieu: '9. Chi phí quản lý doanh nghiệp', kyNay: chiPhiQuanLy, kyTruoc: 0 },
    { maSo: '30', chiTieu: '10. Lợi nhuận thuần từ HĐKD [30 = 20 + (21 - 22) - (25 + 26)]', kyNay: loiNhuanThuan, kyTruoc: 0, isHeader: true },
    { maSo: '31', chiTieu: '11. Thu nhập khác', kyNay: thuNhapKhac, kyTruoc: 0 },
    { maSo: '32', chiTieu: '12. Chi phí khác', kyNay: chiPhiKhac, kyTruoc: 0 },
    { maSo: '40', chiTieu: '13. Lợi nhuận khác (40 = 31 - 32)', kyNay: loiNhuanKhac, kyTruoc: 0 },
    { maSo: '50', chiTieu: '14. Tổng lợi nhuận kế toán trước thuế (50 = 30 + 40)', kyNay: loiNhuanTruocThue, kyTruoc: 0, isHeader: true },
    { maSo: '51', chiTieu: '15. Chi phí thuế TNDN hiện hành (TK 8211)', kyNay: chiPhiThueTndnHienHanh, kyTruoc: 0 },
    { maSo: '60', chiTieu: '16. Lợi nhuận sau thuế thu nhập doanh nghiệp (60 = 50 - 51)', kyNay: loiNhuanSauThue, kyTruoc: 0, isHeader: true }
  ];

  return {
    danhSachChiTieu,
    doanhThuThuan: Math.round(doanhThuThuan * 100) / 100,
    loiNhuanGop: Math.round(loiNhuanGop * 100) / 100,
    loiNhuanThuan: Math.round(loiNhuanThuan * 100) / 100,
    loiNhuanTruocThue: Math.round(loiNhuanTruocThue * 100) / 100,
    loiNhuanSauThue: Math.round(loiNhuanSauThue * 100) / 100
  };
}
