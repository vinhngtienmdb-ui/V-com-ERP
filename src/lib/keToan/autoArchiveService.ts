/**
 * Dịch vụ Tự động Lưu trữ Chứng từ Kế toán vào Hồ sơ Lưu trữ
 * Tuân thủ Nghị định 174/2016/NĐ-CP & Điều 28 Thông tư 99/2025/TT-BTC
 */

import { ChungTuNhatKyChung } from './types';
import { BoHoSoItem, ThanhPhanHoSoItem, DANH_MUC_18_PHAN, SAMPLE_BO_HO_SO } from '../../data/danhMucHoSoData';

export const HO_SO_STORAGE_KEY = 'vcomm_ho_so_archive_list';
export const HO_SO_SYNC_EVENT = 'vcomm_ho_so_archive_updated';

/**
 * Ánh xạ loại chứng từ kế toán S03-DN sang 18 Phần Hồ sơ NĐ 174
 */
export function layPhanLoaiHoSo(loaiCt: ChungTuNhatKyChung['loaiCt']): { maLoai: string; tenPhan: string; thoiHan: 'NAM_5' | 'NAM_10' | 'VINH_VIEN' } {
  switch (loaiCt) {
    case 'BAN':
      return {
        maLoai: '05',
        tenPhan: '05 Hóa đơn đầu ra (Bán hàng)',
        thoiHan: 'NAM_10'
      };
    case 'MUA':
      return {
        maLoai: '04',
        tenPhan: '04 Hóa đơn đầu vào (Mua hàng)',
        thoiHan: 'NAM_10'
      };
    case 'THU':
    case 'CHI':
      return {
        maLoai: '03',
        tenPhan: '03 Tiền mặt & Ngân hàng',
        thoiHan: 'NAM_5'
      };
    case 'KHO':
      return {
        maLoai: '04',
        tenPhan: '04 Hóa đơn đầu vào (Kho vận & Luân chuyển)',
        thoiHan: 'NAM_5'
      };
    case 'LUONG':
      return {
        maLoai: '06',
        tenPhan: '06 Tiền lương & Bảo hiểm',
        thoiHan: 'NAM_5'
      };
    case 'KET_CHUYEN':
    case 'KHAC':
    default:
      return {
        maLoai: '02',
        tenPhan: '02 Sổ sách kế toán & BCTC',
        thoiHan: 'NAM_10'
      };
  }
}

/**
 * Chuyển đổi một Chứng từ kế toán S03-DN thành một Bộ Hồ sơ Lưu trữ hoàn chỉnh
 */
export function chuyenChungTuSangHoSo(ct: ChungTuNhatKyChung): BoHoSoItem {
  const { maLoai, tenPhan, thoiHan } = layPhanLoaiHoSo(ct.loaiCt);
  const nam = ct.ngayHachToan ? parseInt(ct.ngayHachToan.substring(0, 4), 10) : new Date().getFullYear();
  const thang = ct.ngayHachToan ? parseInt(ct.ngayHachToan.substring(5, 7), 10) : new Date().getMonth() + 1;
  const tongTien = (ct.dinhKhoan || []).reduce((sum, d) => sum + (d.soTien || 0), 0);

  const doiTuongTen = ct.dinhKhoan?.[0]?.tenDoiTuong || 
                      (ct.loaiCt === 'BAN' ? 'Khách hàng bán lẻ VComm' : 
                       ct.loaiCt === 'MUA' ? 'Nhà cung cấp đối tác' : 'Nghiệp vụ nội bộ');

  const thanhPhan: ThanhPhanHoSoItem[] = [
    {
      id: `tp-1-${ct.id || Date.now()}`,
      maLoaiHoSo: maLoai,
      tenThanhPhan: `Chứng từ kế toán gốc (${ct.soCt})`,
      batBuoc: true,
      nguon: 'KE_TOAN',
      soHieu: ct.soCt,
      tenTaiLieu: `ChungTu_${ct.soCt}.pdf`,
      daCo: true,
      ngayDinhKem: ct.ngayHachToan
    },
    {
      id: `tp-2-${ct.id || Date.now()}`,
      maLoaiHoSo: maLoai,
      tenThanhPhan: 'Bảng kê định khoản chi tiết kép (S03-DN)',
      batBuoc: true,
      nguon: 'KE_TOAN',
      soHieu: `S03-${ct.soCt}`,
      tenTaiLieu: `DinhKhoan_S03_${ct.soCt}.xlsx`,
      daCo: true,
      ngayDinhKem: ct.ngayHachToan
    },
    {
      id: `tp-3-${ct.id || Date.now()}`,
      maLoaiHoSo: maLoai,
      tenThanhPhan: ct.loaiCt === 'BAN' || ct.loaiCt === 'MUA' ? 'Hóa đơn điện tử XML/PDF' : 'Biên bản đối soát / Giấy báo UNC',
      batBuoc: false,
      nguon: 'ERP',
      soHieu: ct.soCt,
      tenTaiLieu: `HoaDonDienTu_${ct.soCt}.xml`,
      daCo: ct.trangThai === 'DA_GHI_SO',
      ngayDinhKem: ct.trangThai === 'DA_GHI_SO' ? ct.ngayHachToan : undefined
    }
  ];

  const daCoCount = thanhPhan.filter(t => t.daCo).length;
  const tyLeDayDu = Math.round((daCoCount / thanhPhan.length) * 100);

  return {
    id: `hs-auto-${ct.id || ct.soCt}`,
    soHoSo: `HS-${nam}-${String(thang).padStart(2, '0')}-${ct.soCt}`,
    tenHoSo: `Hồ sơ ${ct.soCt} • ${ct.dienGiai || 'Chứng từ phát sinh'}`,
    maLoaiHoSo: maLoai,
    phanLoai: tenPhan,
    kyKeToan: ct.kyKeToan || `${nam}-${String(thang).padStart(2, '0')}`,
    thang,
    nam,
    ngayPhatSinh: ct.ngayHachToan || new Date().toISOString().substring(0, 10),
    hanDuaVaoLuuTru: `${nam + (thoiHan === 'NAM_5' ? 5 : 10)}-12-31`,
    doiTuongTen,
    hopDongSo: ct.soCt.startsWith('HD') ? ct.soCt : undefined,
    hinhThucLuuTru: 'DIEN_TU',
    viTriTen: 'Kho lưu trữ Cloud HSM VComm (Bất biến)',
    thoiHanLuuTru: thoiHan,
    tyLeDayDu,
    trangThai: ct.trangThai === 'DA_GHI_SO' ? 'DA_LUU_TRU' : 'DANG_MO',
    tongGiaTri: tongTien,
    ghiChu: `Tự động đưa vào hồ sơ từ phân hệ Nhật ký chung S03-DN (${ct.trangThai === 'DA_GHI_SO' ? 'Đã ghi sổ chính thức' : 'Bản nháp'}).`,
    thanhPhan,
    lichSu: [
      {
        id: `ls-${Date.now()}`,
        thoiDiem: new Date().toISOString().replace('T', ' ').substring(0, 19),
        hanhDong: 'TAO',
        nguoiThucHien: 'Hệ thống Kế toán VComm (Tự động)',
        vaiTro: 'Auto Archive Engine',
        moTa: `Tự động trích lập hồ sơ lưu trữ từ chứng từ ${ct.soCt}`,
        chiTiet: `Định khoản ${ct.dinhKhoan?.length || 0} dòng, giá trị ${tongTien.toLocaleString('vi-VN')} đ`
      }
    ]
  };
}

/**
 * Lấy danh sách Hồ sơ Lưu trữ hiện tại (ưu tiên từ localStorage)
 */
export function layDanhSachHoSoLuuTru(): BoHoSoItem[] {
  if (typeof window === 'undefined') return SAMPLE_BO_HO_SO;
  try {
    const raw = localStorage.getItem(HO_SO_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Lỗi khi đọc danh sách hồ sơ lưu trữ từ localStorage:', err);
  }
  return SAMPLE_BO_HO_SO;
}

/**
 * Lưu danh sách Hồ sơ Lưu trữ vào localStorage và phát event đồng bộ
 */
export function luuDanhSachHoSoLuuTru(list: BoHoSoItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HO_SO_STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(HO_SO_SYNC_EVENT, { detail: { count: list.length } }));
  } catch (err) {
    console.error('Lỗi khi ghi danh sách hồ sơ lưu trữ vào localStorage:', err);
  }
}

/**
 * Tự động đưa 1 chứng từ vào Hồ sơ lưu trữ
 */
export function tuDongLuuTruMotChungTu(ct: ChungTuNhatKyChung): { boHoSo: BoHoSoItem; isNew: boolean } {
  const currentList = layDanhSachHoSoLuuTru();
  const converted = chuyenChungTuSangHoSo(ct);

  const existingIdx = currentList.findIndex(
    item => item.id === converted.id || item.soHoSo.includes(ct.soCt)
  );

  let updatedList: BoHoSoItem[];
  let isNew = false;

  if (existingIdx >= 0) {
    updatedList = [...currentList];
    updatedList[existingIdx] = {
      ...currentList[existingIdx],
      tenHoSo: converted.tenHoSo,
      tongGiaTri: converted.tongGiaTri,
      trangThai: converted.trangThai,
      tyLeDayDu: converted.tyLeDayDu,
      thanhPhan: converted.thanhPhan
    };
  } else {
    updatedList = [converted, ...currentList];
    isNew = true;
  }

  luuDanhSachHoSoLuuTru(updatedList);
  return { boHoSo: converted, isNew };
}

/**
 * Đồng bộ toàn bộ danh sách chứng từ kế toán vào Hồ sơ lưu trữ
 */
export function dongBoTatCaChungTuVaoHoSo(chungTuList: ChungTuNhatKyChung[]): {
  addedCount: number;
  updatedCount: number;
  totalCount: number;
} {
  const currentList = layDanhSachHoSoLuuTru();
  let addedCount = 0;
  let updatedCount = 0;
  let workingList = [...currentList];

  chungTuList.forEach(ct => {
    const converted = chuyenChungTuSangHoSo(ct);
    const existingIdx = workingList.findIndex(
      item => item.id === converted.id || item.soHoSo.includes(ct.soCt)
    );

    if (existingIdx >= 0) {
      workingList[existingIdx] = {
        ...workingList[existingIdx],
        tenHoSo: converted.tenHoSo,
        tongGiaTri: converted.tongGiaTri,
        trangThai: converted.trangThai,
        tyLeDayDu: converted.tyLeDayDu,
        thanhPhan: converted.thanhPhan
      };
      updatedCount++;
    } else {
      workingList.unshift(converted);
      addedCount++;
    }
  });

  luuDanhSachHoSoLuuTru(workingList);
  return {
    addedCount,
    updatedCount,
    totalCount: workingList.length
  };
}
