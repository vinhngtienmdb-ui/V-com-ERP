import { ChungTuNhatKyChung, KetQuaCanDoi } from './types';

/**
 * Kiểm tra tính hợp lệ và cân đối của chứng từ Nhật ký chung
 * Tuân thủ quy tắc nghiệp vụ BR-01..BR-20 và Thông tư 99/2025/TT-BTC
 * Căn cứ: 12_THIET_KE_GIAO_DIEN_NHAT_KY_CHUNG.md §5
 */
export function kiemTraChungTu(ct: ChungTuNhatKyChung): KetQuaCanDoi {
  const loi: KetQuaCanDoi['loi'] = [];
  let tongNo = 0;
  let tongCo = 0;

  if (!ct.dinhKhoan || ct.dinhKhoan.length === 0) {
    loi.push({
      dong: 0,
      truong: 'dinhKhoan',
      thongDiep: 'Chứng từ phải có ít nhất một dòng định khoản'
    });
    return {
      tongNo: 0,
      tongCo: 0,
      chenhLech: 0,
      soDong: 0,
      canDoi: false,
      loi
    };
  }

  ct.dinhKhoan.forEach((d, i) => {
    const dong = i + 1;

    // BR: Bắt buộc đủ 2 vế Nợ / Có
    if (!d.tkNo) {
      loi.push({ dong, truong: 'tkNo', thongDiep: 'Thiếu tài khoản Nợ' });
    }
    if (!d.tkCo) {
      loi.push({ dong, truong: 'tkCo', thongDiep: 'Thiếu tài khoản Có' });
    }

    // BR: Không cùng một tài khoản ở cả 2 vế Nợ và Có
    if (d.tkNo && d.tkCo && d.tkNo.trim() === d.tkCo.trim()) {
      loi.push({
        dong,
        truong: 'tkNo',
        thongDiep: `Tài khoản Nợ (${d.tkNo}) và tài khoản Có không được trùng nhau`
      });
    }

    // BR: Số tiền phải > 0
    if (!(d.soTien > 0)) {
      loi.push({ dong, truong: 'soTien', thongDiep: 'Số tiền định khoản phải lớn hơn 0' });
    }

    // BR: Ngoại tệ bắt buộc tỷ giá > 0
    if (d.loaiTien && d.loaiTien !== 'VND' && !(d.tyGia > 0)) {
      loi.push({
        dong,
        truong: 'tyGia',
        thongDiep: 'Giao dịch ngoại tệ bắt buộc phải nhập tỷ giá quy đổi lớn hơn 0'
      });
    }

    const tienQuyDoi = (d.tyGia && d.tyGia > 0) ? d.soTien * d.tyGia : d.soTien;

    if (d.tkNo) tongNo += tienQuyDoi;
    if (d.tkCo) tongCo += tienQuyDoi;
  });

  // Làm tròn số thập phân (4 chữ số thập phân) để tránh lỗi số học dấu phẩy động JavaScript
  const chenhLech = Math.round((tongNo - tongCo) * 10000) / 10000;

  return {
    tongNo: Math.round(tongNo * 10000) / 10000,
    tongCo: Math.round(tongCo * 10000) / 10000,
    chenhLech,
    soDong: ct.dinhKhoan.length,
    canDoi: chenhLech === 0 && loi.length === 0,
    loi
  };
}
