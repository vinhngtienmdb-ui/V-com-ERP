import { describe, it, expect } from 'vitest';
import { 
  thucHienChuyenDoiSoDuTT99, 
  SoDuTaiKhoanDauKy 
} from './balanceConversion';

describe('Chuyển đổi số dư theo Điều 29 & Điều 30 Thông tư 99/2025/TT-BTC (Phase 4 U3)', () => {

  const duLieuSoDuGoc: SoDuTaiKhoanDauKy[] = [
    // Tài sản: 1.000.000.000
    { maTk: '112', duNo: 500000000, duCo: 0 },
    { maTk: '156', duNo: 300000000, duCo: 0 },
    { maTk: '1388', duNo: 100000000, duCo: 0, dienGiai: 'Vốn góp Hợp tác kinh doanh không đồng kiểm soát' },
    { maTk: '2413', duNo: 100000000, duCo: 0, dienGiai: 'Chi phí nâng cấp văn phòng dở dang' },

    // Nguồn vốn: 1.000.000.000
    { maTk: '4111', duNo: 0, duCo: 600000000 },
    { maTk: '3388', duNo: 0, duCo: 150000000, dienGiai: 'Nghĩa vụ trả cổ tức đợt 2 cho cổ đông' },
    { maTk: '441', duNo: 0, duCo: 100000000, dienGiai: 'Nguồn vốn đầu tư XDCB cũ' },
    { maTk: '466', duNo: 0, duCo: 50000000, dienGiai: 'Nguồn kinh phí đã hình thành TSCĐ cũ' },
    { maTk: '412', duNo: 0, duCo: 100000000, dienGiai: 'Chênh lệch đánh giá lại tài sản chuyển đổi' }
  ];

  it('Thực thi chế độ DRY_RUN: Tính toán đối chiếu trước/sau, sinh chứng từ CD nhưng chưa ghi sổ', () => {
    const ketQua = thucHienChuyenDoiSoDuTT99(duLieuSoDuGoc, 'DRY_RUN');

    expect(ketQua.thanhCong).toBe(true);
    expect(ketQua.cheDo).toBe('DRY_RUN');
    expect(ketQua.chungTuPhatSinh.length).toBeGreaterThanOrEqual(4);

    // Mọi chứng từ sinh ra ở chế độ DRY_RUN phải ở trạng thái CHUA_GHI_SO
    ketQua.chungTuPhatSinh.forEach(ct => {
      expect(ct.loaiChungTu).toBe('CD');
      expect(ct.trangThai).toBe('CHUA_GHI_SO');
      expect(ct.autoPosted).toBe(true);
    });

    // Bảng đối chiếu trước/sau phải cân đối tuyệt đối
    expect(ketQua.doiChieuTruocSau.canDoiTruoc).toBe(true);
    expect(ketQua.doiChieuTruocSau.canDoiSau).toBe(true);
    expect(ketQua.doiChieuTruocSau.chenhLechTaiSan).toBe(0);
    expect(ketQua.doiChieuTruocSau.chenhLechNguonVon).toBe(0);
  });

  it('Thực thi CĐ-1: Chuyển vốn góp hợp tác kinh doanh sang TK 2281 (Điều 29.1)', () => {
    const ketQua = thucHienChuyenDoiSoDuTT99(duLieuSoDuGoc, 'APPLY');
    const ctCD1 = ketQua.chungTuPhatSinh.find(c => c.postingRuleId === 'CD-TT99-01');

    expect(ctCD1).toBeDefined();
    expect(ctCD1?.dongHachToan[0].tkNo).toBe('2281');
    expect(ctCD1?.dongHachToan[0].tkCo).toBe('1388');
    expect(ctCD1?.dongHachToan[0].soTien).toBe(100000000);
    expect(ctCD1?.trangThai).toBe('DA_GHI_SO');
  });

  it('Thực thi CĐ-2: Chuyển cải tạo nâng cấp TSCĐ dở dang sang TK 2414 (Điều 29.2)', () => {
    const ketQua = thucHienChuyenDoiSoDuTT99(duLieuSoDuGoc, 'APPLY');
    const ctCD2 = ketQua.chungTuPhatSinh.find(c => c.postingRuleId === 'CD-TT99-02');

    expect(ctCD2).toBeDefined();
    expect(ctCD2?.dongHachToan[0].tkNo).toBe('2414');
    expect(ctCD2?.dongHachToan[0].tkCo).toBe('2413');
    expect(ctCD2?.dongHachToan[0].soTien).toBe(100000000);
  });

  it('Thực thi CĐ-3: Chuyển cổ tức phải trả sang TK 332 (Điều 29.3)', () => {
    const ketQua = thucHienChuyenDoiSoDuTT99(duLieuSoDuGoc, 'APPLY');
    const ctCD3 = ketQua.chungTuPhatSinh.find(c => c.postingRuleId === 'CD-TT99-03');

    expect(ctCD3).toBeDefined();
    expect(ctCD3?.dongHachToan[0].tkNo).toBe('3388');
    expect(ctCD3?.dongHachToan[0].tkCo).toBe('332');
    expect(ctCD3?.dongHachToan[0].soTien).toBe(150000000);
  });

  it('Thực thi CĐ-4: Kết chuyển các quỹ 441, 466 sang TK 4118 (Điều 29.4)', () => {
    const ketQua = thucHienChuyenDoiSoDuTT99(duLieuSoDuGoc, 'APPLY');
    const ctCD4 = ketQua.chungTuPhatSinh.find(c => c.postingRuleId === 'CD-TT99-04');

    expect(ctCD4).toBeDefined();
    // Tổng quỹ 441 (100tr) + 466 (50tr) = 150tr
    expect(ctCD4?.tongNo).toBe(150000000);
    expect(ctCD4?.tongCo).toBe(150000000);
    expect(ctCD4?.dongHachToan.some(d => d.tkNo === '441' && d.tkCo === '4118')).toBe(true);
    expect(ctCD4?.dongHachToan.some(d => d.tkNo === '466' && d.tkCo === '4118')).toBe(true);
  });

  it('Thực thi CT-1: Kết chuyển chênh lệch đánh giá lại tài sản 412 sang 4211 (Điều 30.1)', () => {
    const ketQua = thucHienChuyenDoiSoDuTT99(duLieuSoDuGoc, 'APPLY');
    const ctCT1 = ketQua.chungTuPhatSinh.find(c => c.postingRuleId === 'CT-TT99-01');

    expect(ctCT1).toBeDefined();
    expect(ctCT1?.dongHachToan[0].tkNo).toBe('412');
    expect(ctCT1?.dongHachToan[0].tkCo).toBe('4211');
    expect(ctCT1?.dongHachToan[0].soTien).toBe(100000000);
  });

});
