import { describe, it, expect } from 'vitest';
import {
  DongChungTuReport,
  SoDuDauKyItem,
  lapBangCanDoiPhatSinh,
  xuatSoNhatKyChung,
  xuatSoCai,
  lapBaoCaoTinhHinhTaiChinh,
  lapBaoCaoKetQuaKinhDoanh
} from './financialReports';

describe('FinancialReports - Phase 7 TT99 Sổ kế toán & Báo cáo tài chính', () => {
  const mockSoDuDauKy: SoDuDauKyItem[] = [
    { maTk: '111', tenTk: 'Tiền mặt', duNoDauKy: 50000000, duCoDauKy: 0 },
    { maTk: '112', tenTk: 'Tiền gửi ngân hàng', duNoDauKy: 200000000, duCoDauKy: 0 },
    { maTk: '156', tenTk: 'Hàng hóa', duNoDauKy: 100000000, duCoDauKy: 0 },
    { maTk: '211', tenTk: 'Tài sản cố định hữu hình', duNoDauKy: 300000000, duCoDauKy: 0 },
    { maTk: '331', tenTk: 'Phải trả người bán', duNoDauKy: 0, duCoDauKy: 150000000 },
    { maTk: '411', tenTk: 'Vốn đầu tư của chủ sở hữu', duNoDauKy: 0, duCoDauKy: 500000000 }
  ];

  const mockChungTuList: DongChungTuReport[] = [
    {
      id: 'CT-01',
      soChungTu: 'PKT-001',
      ngayChungTu: '2026-01-10',
      ngayHachToan: '2026-01-10',
      loaiChungTu: 'PKT',
      dienGiai: 'Bán hàng thu tiền gửi ngân hàng',
      dongHachToan: [
        { tkNo: '112', tkCo: '511', soTien: 60000000, dienGiai: 'Doanh thu bán hàng' },
        { tkNo: '112', tkCo: '3331', soTien: 6000000, dienGiai: 'Thuế GTGT đầu ra' }
      ],
      trangThai: 'DA_GHI_SO'
    },
    {
      id: 'CT-02',
      soChungTu: 'XK-001',
      ngayChungTu: '2026-01-10',
      ngayHachToan: '2026-01-10',
      loaiChungTu: 'XK',
      dienGiai: 'Xuất kho hàng bán - giá vốn',
      dongHachToan: [
        { tkNo: '632', tkCo: '156', soTien: 40000000, dienGiai: 'Giá vốn xuất kho' }
      ],
      trangThai: 'DA_GHI_SO'
    },
    {
      id: 'CT-03',
      soChungTu: 'PC-001',
      ngayChungTu: '2026-01-15',
      ngayHachToan: '2026-01-15',
      loaiChungTu: 'PC',
      dienGiai: 'Chi phí tiếp khách và văn phòng phẩm',
      dongHachToan: [
        { tkNo: '642', tkCo: '111', soTien: 5000000, dienGiai: 'Chi phí QLDN' }
      ],
      trangThai: 'DA_GHI_SO'
    },
    {
      id: 'CT-04',
      soChungTu: 'CT-CANCELLED',
      ngayChungTu: '2026-01-16',
      ngayHachToan: '2026-01-16',
      loaiChungTu: 'PKT',
      dienGiai: 'Chứng từ bỏ ghi sổ không được tính',
      dongHachToan: [
        { tkNo: '111', tkCo: '511', soTien: 999999999 }
      ],
      trangThai: 'BO_GHI_SO'
    }
  ];

  it('lập Bảng cân đối số phát sinh (F01-DN) chính xác và đảm bảo 3 cặp cân đối', () => {
    const res = lapBangCanDoiPhatSinh('2026-01-01', '2026-01-31', mockSoDuDauKy, mockChungTuList);

    // 1. Kiểm tra cân đối đầu kỳ
    expect(res.canDoiDauKy).toBe(true);
    expect(res.tongDuNoDauKy).toBe(650000000);
    expect(res.tongDuCoDauKy).toBe(650000000);

    // 2. Kiểm tra cân đối phát sinh: 60m + 6m + 40m + 5m = 111m
    expect(res.canDoiPhatSinh).toBe(true);
    expect(res.tongPhatSinhNo).toBe(111000000);
    expect(res.tongPhatSinhCo).toBe(111000000);

    // 3. Chứng từ bỏ ghi sổ bị loại bỏ
    const tk511 = res.danhSachTk.find(t => t.maTk === '511');
    expect(tk511?.phatSinhCo).toBe(60000000);
  });

  it('xuất Sổ Nhật ký chung (S03-DN) chuẩn mẫu TT99', () => {
    const res = xuatSoNhatKyChung('2026-01-01', '2026-01-31', mockChungTuList);

    // 4 dòng bút toán hợp lệ -> 8 dòng ghi Nợ/Có tách biệt trên NKC
    expect(res.danhSachDong.length).toBe(8);
    expect(res.tongPhatSinhNo).toBe(111000000);
    expect(res.tongPhatSinhCo).toBe(111000000);

    // Kiểm tra dòng đầu tiên
    expect(res.danhSachDong[0].soChungTu).toBe('PKT-001');
    expect(res.danhSachDong[0].soPhatSinhNo).toBe(60000000);
  });

  it('xuất Sổ Cái (S04-DN) tính đúng số dư lũy kế từng chứng từ', () => {
    // Sổ Cái TK 112: Dư đầu 200tr, phát sinh tăng 60tr + 6tr = 266tr
    const res = xuatSoCai('112', '2026-01-01', '2026-01-31', 200000000, mockChungTuList);

    expect(res.maTk).toBe('112');
    expect(res.soDuDauKy).toBe(200000000);
    expect(res.tongPhatSinhNo).toBe(66000000);
    expect(res.tongPhatSinhCo).toBe(0);
    expect(res.soDuCuoiKy).toBe(266000000);
    expect(res.danhSachDong.length).toBe(2);
  });

  it('lập Báo cáo Kết quả hoạt động kinh doanh (B02-DN)', () => {
    const res = lapBaoCaoKetQuaKinhDoanh('2026-01-01', '2026-01-31', mockChungTuList);

    // Doanh thu: 60tr, Giảm trừ: 0 -> Doanh thu thuần (Mã 10) = 60tr
    expect(res.doanhThuThuan).toBe(60000000);
    // Giá vốn: 40tr -> Lợi nhuận gộp (Mã 20) = 20tr
    expect(res.loiNhuanGop).toBe(20000000);
    // Chi phí QLDN: 5tr -> Lợi nhuận thuần (Mã 30) = 20tr - 5tr = 15tr
    expect(res.loiNhuanThuan).toBe(15000000);
    // Lợi nhuận trước thuế = 15tr
    expect(res.loiNhuanTruocThue).toBe(15000000);
  });

  it('lập Báo cáo Tình hình tài chính (B01-DN) có mã 280 chuẩn TT99', () => {
    const trialBalance = lapBangCanDoiPhatSinh('2026-01-01', '2026-01-31', mockSoDuDauKy, mockChungTuList);
    const res = lapBaoCaoTinhHinhTaiChinh(trialBalance);

    // Tổng tài sản mã 280
    const chiTieu280 = res.danhSachChiTieu.find(c => c.maSo === '280');
    expect(chiTieu280).toBeDefined();
    expect(res.tongTaiSan).toBeGreaterThan(0);
  });
});
