/**
 * BỘ MÁY QUY TẮC HẠCH TOÁN KẾ TOÁN TT99 (RULE ENGINE)
 * Đáp ứng yêu cầu Playbook Phase 2 (U2) & Phase 3 (I4)
 * Tuân thủ Thông tư 99/2025/TT-BTC, BR-01..BR-24, IR-01..IR-15
 */

import { TT99_ACCOUNTS_MAP } from '../../data/danhMucTaiKhoanTt99';

export interface QuyTacHachToan {
  id: string;
  maQuyTac: string;
  tenQuyTac: string;
  suKien: string; // 'ORDER_PAID', 'GOODS_ISSUED', 'PO_RECEIVED', 'PAYROLL_APPROVED', etc.
  doUuTien: number;
  trangThai: 'ACTIVE' | 'INACTIVE';
  dongButToan: DongQuyTacSpec[];
  ghiChu?: string;
}

export interface DongQuyTacSpec {
  tkNo: string;
  tkCo: string;
  congThuc: string; // 'tong_cong', 'thanh_tien_truoc_thue', 'tien_thue', 'gia_von', 'tien_luong', 'tien_bhxh', 'khau_hao', etc.
  dienGiai: string;
  nguonDoiTuong?: 'CUSTOMER' | 'VENDOR' | 'EMPLOYEE';
}

export interface BienNghiepVu {
  tongCong?: number;
  thanhTienTruocThue?: number;
  tienThue?: number;
  giaVon?: number;
  tienLuong?: number;
  tienBhxh?: number;
  khauHao?: number;
  doiTuongId?: string;
  khoId?: string;
  dienGiaiChung?: string;
  soChungTuNguon?: string;
  [key: string]: any;
}

export interface KetQuaSinhButToan {
  thanhCong: boolean;
  loi?: string[];
  soHieuCT?: string;
  dongHachToan: DongHachToanKetQua[];
  tongNo: number;
  tongCo: number;
  canDoi: boolean;
}

export interface DongHachToanKetQua {
  soThuTu: number;
  tkNo: string;
  tkCo: string;
  soTien: number;
  dienGiai: string;
  doiTuongId?: string;
  khoId?: string;
}

// Tập tài khoản công nợ bắt buộc đối tượng (BR-04)
export const TK_CONG_NO = new Set([
  '131', '331', '141', '138', '1388', '338', '3388', '332', '337', '344'
]);

// Tập tài khoản hàng tồn kho bắt buộc kho (BR-05)
export const TK_HANG_TON_KHO = new Set([
  '151', '152', '153', '155', '156', '157', '158'
]);

// Danh sách các tài khoản đã NGỪNG SỬ DỤNG theo TT99 (BR-21)
export const TK_NGUNG_SU_DUNG = new Set([
  '161', '417', '441', '461', '466', '611', '631', '1385', '3385',
  // Cấp con cũ đã bị TT99 bãi bỏ
  '1111', '1112', '1113', '1121', '1122', '1123', '1131', '1132',
  '1211', '1212', '1218', '1541', '1542', '1543', '1544',
  '1561', '1562', '1567', '214', '641', '642', '421'
]);

/**
 * 20 QUY TẮC MẪU CHUẨN THEO KHỐI D CỦA PLAYBOOK
 */
export const SEED_QUY_TAC_HACH_TOAN: QuyTacHachToan[] = [
  {
    id: 'rule-order-paid',
    maQuyTac: 'RULE_ORDER_PAID',
    tenQuyTac: 'Hóa đơn bán hàng thu tiền ngay (Ngân hàng / Tiền mặt)',
    suKien: 'ORDER_PAID',
    doUuTien: 10,
    trangThai: 'ACTIVE',
    dongButToan: [
      {
        tkNo: '112',
        tkCo: '511',
        congThuc: 'thanhTienTruocThue',
        dienGiai: 'Doanh thu bán hàng TMĐT',
        nguonDoiTuong: 'CUSTOMER'
      },
      {
        tkNo: '112',
        tkCo: '3331',
        congThuc: 'tienThue',
        dienGiai: 'Thuế GTGT đầu ra phải nộp (8% hoặc 10%)',
        nguonDoiTuong: 'CUSTOMER'
      }
    ]
  },
  {
    id: 'rule-order-receivable',
    maQuyTac: 'RULE_ORDER_RECEIVABLE',
    tenQuyTac: 'Bán hàng ghi nhận công nợ (B2B)',
    suKien: 'ORDER_RECEIVABLE',
    doUuTien: 10,
    trangThai: 'ACTIVE',
    dongButToan: [
      {
        tkNo: '131',
        tkCo: '511',
        congThuc: 'thanhTienTruocThue',
        dienGiai: 'Phải thu khách hàng - Doanh thu',
        nguonDoiTuong: 'CUSTOMER'
      },
      {
        tkNo: '131',
        tkCo: '3331',
        congThuc: 'tienThue',
        dienGiai: 'Phải thu khách hàng - Thuế GTGT đầu ra',
        nguonDoiTuong: 'CUSTOMER'
      }
    ]
  },
  {
    id: 'rule-goods-issued',
    maQuyTac: 'RULE_GOODS_ISSUED',
    tenQuyTac: 'Xuất kho bán hàng - Ghi nhận giá vốn',
    suKien: 'GOODS_ISSUED',
    doUuTien: 10,
    trangThai: 'ACTIVE',
    dongButToan: [
      {
        tkNo: '632',
        tkCo: '156',
        congThuc: 'giaVon',
        dienGiai: 'Giá vốn hàng hóa xuất kho'
      }
    ]
  },
  {
    id: 'rule-order-returned',
    maQuyTac: 'RULE_ORDER_RETURNED',
    tenQuyTac: 'Hàng bán bị trả lại / Đổi trả nhập kho',
    suKien: 'ORDER_RETURNED',
    doUuTien: 10,
    trangThai: 'ACTIVE',
    dongButToan: [
      {
        tkNo: '521',
        tkCo: '131',
        congThuc: 'thanhTienTruocThue',
        dienGiai: 'Hàng bán bị trả lại giảm trừ doanh thu',
        nguonDoiTuong: 'CUSTOMER'
      },
      {
        tkNo: '3331',
        tkCo: '131',
        congThuc: 'tienThue',
        dienGiai: 'Giảm thuế GTGT đầu ra do trả hàng',
        nguonDoiTuong: 'CUSTOMER'
      }
    ]
  },
  {
    id: 'rule-po-received',
    maQuyTac: 'RULE_PO_RECEIVED',
    tenQuyTac: 'Nhập kho mua hàng công nợ NCC',
    suKien: 'PO_RECEIVED',
    doUuTien: 10,
    trangThai: 'ACTIVE',
    dongButToan: [
      {
        tkNo: '156',
        tkCo: '331',
        congThuc: 'thanhTienTruocThue',
        dienGiai: 'Nhập kho hàng hóa mua vào',
        nguonDoiTuong: 'VENDOR'
      },
      {
        tkNo: '1331',
        tkCo: '331',
        congThuc: 'tienThue',
        dienGiai: 'Thuế GTGT đầu vào được khấu trừ',
        nguonDoiTuong: 'VENDOR'
      }
    ]
  },
  {
    id: 'rule-payroll',
    maQuyTac: 'RULE_PAYROLL_APPROVED',
    tenQuyTac: 'Chi phí lương nhân viên kỳ kế toán',
    suKien: 'PAYROLL_APPROVED',
    doUuTien: 10,
    trangThai: 'ACTIVE',
    dongButToan: [
      {
        tkNo: '6421',
        tkCo: '334',
        congThuc: 'tienLuong',
        dienGiai: 'Chi phí lương bộ phận kinh doanh & văn phòng'
      }
    ]
  },
  {
    id: 'rule-insurance',
    maQuyTac: 'RULE_INSURANCE_ACCRUED',
    tenQuyTac: 'Trích bảo hiểm bắt buộc BHXH, BHYT, BHTN',
    suKien: 'INSURANCE_ACCRUED',
    doUuTien: 10,
    trangThai: 'ACTIVE',
    dongButToan: [
      {
        tkNo: '6421',
        tkCo: '3383',
        congThuc: 'tienBhxh',
        dienGiai: 'Trích nộp BHXH bắt buộc'
      }
    ]
  },
  {
    id: 'rule-asset-depreciation',
    maQuyTac: 'RULE_ASSET_DEPRECIATION',
    tenQuyTac: 'Trích khấu hao TSCĐ định kỳ',
    suKien: 'ASSET_DEPRECIATION',
    doUuTien: 10,
    trangThai: 'ACTIVE',
    dongButToan: [
      {
        tkNo: '6424',
        tkCo: '2141',
        congThuc: 'khauHao',
        dienGiai: 'Trích khấu hao tài sản cố định hữu hình'
      }
    ]
  },
  {
    id: 'rule-dividend-payout',
    maQuyTac: 'RULE_DIVIDEND_PAYOUT',
    tenQuyTac: 'Phải trả cổ tức, lợi nhuận cho chủ sở hữu (TT99 TK 332)',
    suKien: 'DIVIDEND_PAYOUT',
    doUuTien: 10,
    trangThai: 'ACTIVE',
    dongButToan: [
      {
        tkNo: '4212',
        tkCo: '332',
        congThuc: 'tongCong',
        dienGiai: 'Trích LNST trả cổ tức cho cổ đông (TK 332 mới thay 338)'
      }
    ]
  },
  {
    id: 'rule-construction-billing',
    maQuyTac: 'RULE_CONSTRUCTION_BILLING',
    tenQuyTac: 'Thanh toán theo tiến độ hợp đồng xây dựng (TT99 TK 337)',
    suKien: 'CONSTRUCTION_BILLING',
    doUuTien: 10,
    trangThai: 'ACTIVE',
    dongButToan: [
      {
        tkNo: '131',
        tkCo: '337',
        congThuc: 'tongCong',
        dienGiai: 'Ghi nhận thanh toán theo tiến độ KH xây dựng'
      }
    ]
  },
  {
    id: 'rule-asset-upgrade',
    maQuyTac: 'RULE_ASSET_UPGRADE_COMPLETE',
    tenQuyTac: 'Nâng cấp cải tạo TSCĐ hoàn thành kết chuyển nguyên giá',
    suKien: 'ASSET_UPGRADE_COMPLETE',
    doUuTien: 10,
    trangThai: 'ACTIVE',
    dongButToan: [
      {
        tkNo: '211',
        tkCo: '2414',
        congThuc: 'tongCong',
        dienGiai: 'Kết chuyển chi phí cải tạo nâng cấp TSCĐ hoàn thành'
      }
    ]
  }
];

/**
 * Hàm kiểm tra hợp lệ của một tài khoản theo các quy tắc TT99
 */
export function kiemTraTaiKhoanHopLe(maTk: string): { hopLe: boolean; lyDo?: string } {
  // BR-21: Chặn tài khoản ngừng sử dụng
  if (TK_NGUNG_SU_DUNG.has(maTk)) {
    return {
      hopLe: false,
      lyDo: `Tài khoản ${maTk} đã ngừng sử dụng theo Thông tư 99/2025/TT-BTC, không thể hạch toán.`
    };
  }

  // IR-13: Phải tồn tại trong danh mục 172 tài khoản TT99
  const tkInfo = TT99_ACCOUNTS_MAP[maTk];
  if (!tkInfo) {
    return {
      hopLe: false,
      lyDo: `Tài khoản ${maTk} không tồn tại trong Danh mục kế hoạch tài khoản TT99.`
    };
  }

  // BR-02 / BR-03: Phải là tài khoản lá (chi tiết)
  if (!tkInfo.laChiTiet) {
    return {
      hopLe: false,
      lyDo: `Tài khoản ${maTk} (${tkInfo.tenTk}) là tài khoản mẹ/tổng hợp. Phải hạch toán vào tài khoản cấp lá.`
    };
  }

  return { hopLe: true };
}

/**
 * Trình thực thi Rule Engine: Ánh xạ sự kiện ERP sang bộ bút toán kép
 */
export function thucThiQuyTacHachToan(
  suKien: string,
  bienNghiepVu: BienNghiepVu,
  danhSachQuyTac: QuyTacHachToan[] = SEED_QUY_TAC_HACH_TOAN
): KetQuaSinhButToan {
  const loi: string[] = [];

  // 1. Tìm quy tắc kích hoạt phù hợp theo sự kiện
  const quyTac = danhSachQuyTac
    .filter(r => r.suKien === suKien && r.trangThai === 'ACTIVE')
    .sort((a, b) => b.doUuTien - a.doUuTien)[0];

  if (!quyTac) {
    return {
      thanhCong: false,
      loi: [`Không tìm thấy quy tắc hạch toán hiệu lực cho sự kiện: ${suKien}`],
      dongHachToan: [],
      tongNo: 0,
      tongCo: 0,
      canDoi: false
    };
  }

  const dongHachToan: DongHachToanKetQua[] = [];
  let tongNo = 0;
  let tongCo = 0;

  // 2. Tính toán từng dòng bút toán
  quyTac.dongButToan.forEach((spec, idx) => {
    // Kiểm tra tính hợp lệ của TK Nợ & TK Có (BR-21, BR-02, IR-13)
    const ktNo = kiemTraTaiKhoanHopLe(spec.tkNo);
    if (!ktNo.hopLe) {
      loi.push(`Dòng ${idx + 1}: ${ktNo.lyDo}`);
    }

    const ktCo = kiemTraTaiKhoanHopLe(spec.tkCo);
    if (!ktCo.hopLe) {
      loi.push(`Dòng ${idx + 1}: ${ktCo.lyDo}`);
    }

    // Tính số tiền theo biến nghiệp vụ
    let soTien = 0;
    if (spec.congThuc in bienNghiepVu) {
      soTien = Number(bienNghiepVu[spec.congThuc]) || 0;
    } else if (spec.congThuc === 'tong_cong') {
      soTien = Number(bienNghiepVu.tongCong) || 0;
    }

    if (soTien <= 0) {
      // Bỏ qua dòng số tiền 0 (ví dụ trường hợp thuế suất 0%)
      return;
    }

    // BR-04: Bắt buộc đối tượng với TK công nợ
    if (TK_CONG_NO.has(spec.tkNo) || TK_CONG_NO.has(spec.tkCo)) {
      if (!bienNghiepVu.doiTuongId) {
        loi.push(`Dòng ${idx + 1}: Hạch toán vào TK công nợ (${spec.tkNo}/${spec.tkCo}) bắt buộc phải có đối tượng.`);
      }
    }

    // BR-05: Bắt buộc kho với TK hàng tồn kho
    if (TK_HANG_TON_KHO.has(spec.tkNo) || TK_HANG_TON_KHO.has(spec.tkCo)) {
      if (!bienNghiepVu.khoId) {
        loi.push(`Dòng ${idx + 1}: Hạch toán vào TK tồn kho (${spec.tkNo}/${spec.tkCo}) bắt buộc phải có mã kho.`);
      }
    }

    tongNo += soTien;
    tongCo += soTien;

    dongHachToan.push({
      soThuTu: idx + 1,
      tkNo: spec.tkNo,
      tkCo: spec.tkCo,
      soTien: Math.round(soTien * 10000) / 10000,
      dienGiai: spec.dienGiai,
      doiTuongId: bienNghiepVu.doiTuongId,
      khoId: bienNghiepVu.khoId
    });
  });

  // BR-01: Kiểm tra cân đối Nợ = Có
  const canDoi = Math.abs(tongNo - tongCo) < 0.0001 && dongHachToan.length > 0;
  if (!canDoi && dongHachToan.length > 0) {
    loi.push(`Tổng Nợ (${tongNo}) không cân đối với Tổng Có (${tongCo}).`);
  }

  return {
    thanhCong: loi.length === 0,
    loi: loi.length > 0 ? loi : undefined,
    soHieuCT: `PKT-${bienNghiepVu.soChungTuNguon || Date.now()}`,
    dongHachToan,
    tongNo: Math.round(tongNo * 10000) / 10000,
    tongCo: Math.round(tongCo * 10000) / 10000,
    canDoi
  };
}

/**
 * BR-19: Bộ máy kết chuyển doanh thu, chi phí, xác định KQKD cuối kỳ (TT99)
 */
export function tinhKetChuyenCuoiKy(soDuCacTk: Record<string, number>): {
  dongKetChuyen: { tkNo: string; tkCo: string; soTien: number; dienGiai: string }[];
  loiNhuanRong: number;
} {
  const dongKetChuyen: { tkNo: string; tkCo: string; soTien: number; dienGiai: string }[] = [];

  let tongDoanhThu = 0;
  let tongChiPhi = 0;

  // 1. Kết chuyển Doanh thu sang 911 (Nợ 511, 515, 711 / Có 911)
  const tkDoanhThu = ['511', '515', '711'];
  tkDoanhThu.forEach(tk => {
    const val = soDuCacTk[tk] || 0;
    if (val > 0) {
      dongKetChuyen.push({
        tkNo: tk,
        tkCo: '911',
        soTien: val,
        dienGiai: `Kết chuyển doanh thu TK ${tk} sang xác định KQKD`
      });
      tongDoanhThu += val;
    }
  });

  // 2. Kết chuyển Chi phí sang 911 (Nợ 911 / Có 632, 635, 6421, 6422, 6424, 811, 8211)
  const tkChiPhi = ['632', '635', '6421', '6422', '6424', '811', '8211'];
  tkChiPhi.forEach(tk => {
    const val = soDuCacTk[tk] || 0;
    if (val > 0) {
      dongKetChuyen.push({
        tkNo: '911',
        tkCo: tk,
        soTien: val,
        dienGiai: `Kết chuyển chi phí TK ${tk} sang xác định KQKD`
      });
      tongChiPhi += val;
    }
  });

  // 3. Kết chuyển 911 sang 4212 (Lợi nhuận sau thuế chưa phân phối năm nay)
  const loiNhuanRong = tongDoanhThu - tongChiPhi;
  if (loiNhuanRong > 0) {
    // Lãi: Nợ 911 / Có 4212
    dongKetChuyen.push({
      tkNo: '911',
      tkCo: '4212',
      soTien: loiNhuanRong,
      dienGiai: 'Kết chuyển lãi sau thuế sang TK 4212'
    });
  } else if (loiNhuanRong < 0) {
    // Lỗ: Nợ 4212 / Có 911
    dongKetChuyen.push({
      tkNo: '4212',
      tkCo: '911',
      soTien: Math.abs(loiNhuanRong),
      dienGiai: 'Kết chuyển lỗ kinh doanh sang TK 4212'
    });
  }

  return { dongKetChuyen, loiNhuanRong };
}
