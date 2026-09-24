import { describe, it, expect } from 'vitest';
import { kiemTraChungTu } from './validate';
import { ChungTuNhatKyChung } from './types';

describe('kiemTraChungTu - Kiểm tra tính cân đối và hợp lệ chứng từ TT99', () => {
  const baseChungTu: ChungTuNhatKyChung = {
    tenantId: 'tenant-vcomm-prod-01',
    loaiCt: 'THU',
    soCt: 'PT-2026-0001',
    ngayCt: '2026-01-15',
    ngayHachToan: '2026-01-15',
    kyKeToan: '2026-01',
    dienGiai: 'Thu tiền bán hàng khách lẻ',
    nguoiLapId: 'user-01',
    trangThai: 'CHUA_GHI_SO',
    thongTuApDung: 'TT99',
    dinhKhoan: []
  };

  it('TC-01: Chứng từ cân đối hợp lệ (Nợ 112 = Có 511 + 3331)', () => {
    const ct: ChungTuNhatKyChung = {
      ...baseChungTu,
      dinhKhoan: [
        {
          soDong: 1,
          dienGiai: 'Doanh thu bán hàng',
          tkNo: '112',
          tkCo: '511',
          soTien: 100000000,
          loaiTien: 'VND',
          tyGia: 1,
          soTienQuyDoi: 100000000
        },
        {
          soDong: 2,
          dienGiai: 'Thuế GTGT đầu ra',
          tkNo: '112',
          tkCo: '3331',
          soTien: 10000000,
          loaiTien: 'VND',
          tyGia: 1,
          soTienQuyDoi: 10000000
        }
      ]
    };

    const res = kiemTraChungTu(ct);
    expect(res.canDoi).toBe(true);
    expect(res.chenhLech).toBe(0);
    expect(res.tongNo).toBe(110000000);
    expect(res.tongCo).toBe(110000000);
    expect(res.loi.length).toBe(0);
  });

  it('TC-02: Bắt lỗi khi số tiền Nợ và Có bị lệch (Không cân)', () => {
    const ct: ChungTuNhatKyChung = {
      ...baseChungTu,
      dinhKhoan: [
        {
          soDong: 1,
          dienGiai: 'Trả tiền NCC',
          tkNo: '331',
          tkCo: '112',
          soTien: 80000000,
          loaiTien: 'VND',
          tyGia: 1,
          soTienQuyDoi: 80000000
        }
      ]
    };
    // Trong định khoản 1-1 đơn giản này, tkNo có 80tr và tkCo có 80tr thì cân.
    // Thử trường hợp cố tình làm lệch bằng cách thiếu 1 vế:
    const ctLech: ChungTuNhatKyChung = {
      ...baseChungTu,
      dinhKhoan: [
        {
          soDong: 1,
          dienGiai: 'Lệch tiền',
          tkNo: '331',
          tkCo: '',
          soTien: 80000000,
          loaiTien: 'VND',
          tyGia: 1,
          soTienQuyDoi: 80000000
        }
      ]
    };

    const res = kiemTraChungTu(ctLech);
    expect(res.canDoi).toBe(false);
    expect(res.chenhLech).toBe(80000000);
    expect(res.loi.some(l => l.truong === 'tkCo')).toBe(true);
  });

  it('TC-03: Bắt lỗi khi TK Nợ và TK Có trùng nhau (BR-02)', () => {
    const ct: ChungTuNhatKyChung = {
      ...baseChungTu,
      dinhKhoan: [
        {
          soDong: 1,
          dienGiai: 'Giao dịch sai',
          tkNo: '111',
          tkCo: '111',
          soTien: 5000000,
          loaiTien: 'VND',
          tyGia: 1,
          soTienQuyDoi: 5000000
        }
      ]
    };

    const res = kiemTraChungTu(ct);
    expect(res.canDoi).toBe(false);
    expect(res.loi.some(l => l.thongDiep.includes('không được trùng nhau'))).toBe(true);
  });

  it('TC-04: Bắt lỗi khi số tiền <= 0', () => {
    const ct: ChungTuNhatKyChung = {
      ...baseChungTu,
      dinhKhoan: [
        {
          soDong: 1,
          dienGiai: 'Số tiền bằng 0',
          tkNo: '112',
          tkCo: '511',
          soTien: 0,
          loaiTien: 'VND',
          tyGia: 1,
          soTienQuyDoi: 0
        }
      ]
    };

    const res = kiemTraChungTu(ct);
    expect(res.canDoi).toBe(false);
    expect(res.loi.some(l => l.truong === 'soTien')).toBe(true);
  });

  it('TC-05: Bắt lỗi khi ngoại tệ thiếu tỷ giá', () => {
    const ct: ChungTuNhatKyChung = {
      ...baseChungTu,
      dinhKhoan: [
        {
          soDong: 1,
          dienGiai: 'Thu ngoại tệ USD',
          tkNo: '112',
          tkCo: '131',
          soTien: 1000,
          loaiTien: 'USD',
          tyGia: 0,
          soTienQuyDoi: 0
        }
      ]
    };

    const res = kiemTraChungTu(ct);
    expect(res.canDoi).toBe(false);
    expect(res.loi.some(l => l.truong === 'tyGia')).toBe(true);
  });

  it('TC-06: Tránh lỗi làm tròn số thực trong Javascript (0.1 + 0.2)', () => {
    const ct: ChungTuNhatKyChung = {
      ...baseChungTu,
      dinhKhoan: [
        {
          soDong: 1,
          dienGiai: 'Phần tử 1',
          tkNo: '112',
          tkCo: '511',
          soTien: 0.1,
          loaiTien: 'VND',
          tyGia: 1,
          soTienQuyDoi: 0.1
        },
        {
          soDong: 2,
          dienGiai: 'Phần tử 2',
          tkNo: '112',
          tkCo: '511',
          soTien: 0.2,
          loaiTien: 'VND',
          tyGia: 1,
          soTienQuyDoi: 0.2
        }
      ]
    };

    const res = kiemTraChungTu(ct);
    expect(res.canDoi).toBe(true);
    expect(res.tongNo).toBe(0.3);
    expect(res.tongCo).toBe(0.3);
    expect(res.chenhLech).toBe(0);
  });
});
