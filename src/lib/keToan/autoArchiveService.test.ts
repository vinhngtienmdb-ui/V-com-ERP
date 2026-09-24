import { describe, it, expect, beforeEach } from 'vitest';
import { 
  chuyenChungTuSangHoSo, 
  layPhanLoaiHoSo, 
  tuDongLuuTruMotChungTu, 
  dongBoTatCaChungTuVaoHoSo,
  layDanhSachHoSoLuuTru,
  HO_SO_STORAGE_KEY
} from './autoArchiveService';
import { ChungTuNhatKyChung } from './types';

describe('autoArchiveService - Lưu trữ tự động chứng từ NĐ 174', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockChungTuBan: ChungTuNhatKyChung = {
    id: 'ct-test-ban-01',
    tenantId: 'tenant-test',
    loaiCt: 'BAN',
    soCt: 'HD-2026-TEST-001',
    ngayCt: '2026-03-10',
    ngayHachToan: '2026-03-10',
    kyKeToan: '2026-03',
    dienGiai: 'Bán hàng cho công ty Techcom',
    nguoiLapId: 'user-01',
    trangThai: 'DA_GHI_SO',
    thongTuApDung: 'TT99',
    dinhKhoan: [
      {
        soDong: 1,
        dienGiai: 'Phải thu khách hàng',
        tkNo: '131',
        tkCo: '511',
        soTien: 50000000,
        loaiTien: 'VND',
        tyGia: 1,
        soTienQuyDoi: 50000000,
        tenDoiTuong: 'Công ty Techcom'
      }
    ]
  };

  const mockChungTuChi: ChungTuNhatKyChung = {
    id: 'ct-test-chi-02',
    tenantId: 'tenant-test',
    loaiCt: 'CHI',
    soCt: 'PC-2026-TEST-002',
    ngayCt: '2026-03-11',
    ngayHachToan: '2026-03-11',
    kyKeToan: '2026-03',
    dienGiai: 'Chi tiền tạm ứng công tác',
    nguoiLapId: 'user-02',
    trangThai: 'CHUA_GHI_SO',
    thongTuApDung: 'TT99',
    dinhKhoan: [
      {
        soDong: 1,
        dienGiai: 'Tạm ứng',
        tkNo: '141',
        tkCo: '111',
        soTien: 5000000,
        loaiTien: 'VND',
        tyGia: 1,
        soTienQuyDoi: 5000000,
        tenDoiTuong: 'Nguyễn Văn A'
      }
    ]
  };

  it('Ánh xạ chính xác loại chứng từ sang 18 Phần NĐ 174', () => {
    expect(layPhanLoaiHoSo('BAN').maLoai).toBe('05');
    expect(layPhanLoaiHoSo('BAN').thoiHan).toBe('NAM_10');

    expect(layPhanLoaiHoSo('MUA').maLoai).toBe('04');
    expect(layPhanLoaiHoSo('MUA').thoiHan).toBe('NAM_10');

    expect(layPhanLoaiHoSo('THU').maLoai).toBe('03');
    expect(layPhanLoaiHoSo('THU').thoiHan).toBe('NAM_5');

    expect(layPhanLoaiHoSo('CHI').maLoai).toBe('03');
    expect(layPhanLoaiHoSo('LUONG').maLoai).toBe('06');
    expect(layPhanLoaiHoSo('KET_CHUYEN').maLoai).toBe('02');
  });

  it('Chuyển đổi chứng từ bán hàng thành hồ sơ lưu trữ hoàn chỉnh', () => {
    const hoSo = chuyenChungTuSangHoSo(mockChungTuBan);
    expect(hoSo.maLoaiHoSo).toBe('05');
    expect(hoSo.soHoSo).toContain('HD-2026-TEST-001');
    expect(hoSo.tongGiaTri).toBe(50000000);
    expect(hoSo.thoiHanLuuTru).toBe('NAM_10');
    expect(hoSo.trangThai).toBe('DA_LUU_TRU');
    expect(hoSo.thanhPhan.length).toBeGreaterThanOrEqual(2);
    expect(hoSo.doiTuongTen).toBe('Công ty Techcom');
  });

  it('Tự động lưu trữ một chứng từ vào vault và lưu vào storage', () => {
    const res = tuDongLuuTruMotChungTu(mockChungTuBan);
    expect(res.isNew).toBe(true);

    const vault = layDanhSachHoSoLuuTru();
    const found = vault.find(h => h.id === res.boHoSo.id);
    expect(found).toBeDefined();
    expect(found?.tongGiaTri).toBe(50000000);
  });

  it('Đồng bộ hàng loạt chứng từ kế toán vào Hồ sơ lưu trữ', () => {
    const res = dongBoTatCaChungTuVaoHoSo([mockChungTuBan, mockChungTuChi]);
    expect(res.addedCount).toBeGreaterThan(0);

    const vault = layDanhSachHoSoLuuTru();
    expect(vault.some(h => h.soHoSo.includes('HD-2026-TEST-001'))).toBe(true);
    expect(vault.some(h => h.soHoSo.includes('PC-2026-TEST-002'))).toBe(true);
  });
});
