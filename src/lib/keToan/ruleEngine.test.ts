import { describe, it, expect } from 'vitest';
import { 
  kiemTraTaiKhoanHopLe, 
  thucThiQuyTacHachToan, 
  tinhKetChuyenCuoiKy, 
  SEED_QUY_TAC_HACH_TOAN 
} from './ruleEngine';

describe('Bộ máy Quy tắc Hạch toán Kế toán TT99 (Rule Engine)', () => {

  describe('1. Kiểm tra tài khoản hợp lệ (BR-21, BR-02, IR-13, IR-15)', () => {
    it('Chặn các tài khoản đã bị bãi bỏ hoặc ngừng sử dụng trong TT99 (BR-21)', () => {
      // 1111, 1121 đã bị bãi bỏ cấp con trong TT99
      expect(kiemTraTaiKhoanHopLe('1121').hopLe).toBe(false);
      expect(kiemTraTaiKhoanHopLe('1111').hopLe).toBe(false);
      expect(kiemTraTaiKhoanHopLe('161').hopLe).toBe(false);
      expect(kiemTraTaiKhoanHopLe('441').hopLe).toBe(false);
      expect(kiemTraTaiKhoanHopLe('611').hopLe).toBe(false);
    });

    it('Chấp nhận các tài khoản lá hợp lệ của TT99', () => {
      expect(kiemTraTaiKhoanHopLe('112').hopLe).toBe(true);
      expect(kiemTraTaiKhoanHopLe('511').hopLe).toBe(true);
      expect(kiemTraTaiKhoanHopLe('3331').hopLe).toBe(true);
      expect(kiemTraTaiKhoanHopLe('156').hopLe).toBe(true);
      expect(kiemTraTaiKhoanHopLe('632').hopLe).toBe(true);
      expect(kiemTraTaiKhoanHopLe('332').hopLe).toBe(true);
      expect(kiemTraTaiKhoanHopLe('337').hopLe).toBe(true);
      expect(kiemTraTaiKhoanHopLe('2414').hopLe).toBe(true);
    });

    it('Chặn tài khoản mẹ/tổng hợp không phải lá (BR-02)', () => {
      // 133, 214, 333, 642 là tài khoản mẹ
      expect(kiemTraTaiKhoanHopLe('333').hopLe).toBe(false);
      expect(kiemTraTaiKhoanHopLe('133').hopLe).toBe(false);
    });
  });

  describe('2. Thực thi quy tắc hạch toán tự động từ sự kiện ERP (U2, I4, I5)', () => {
    it('Sinh bút toán bán hàng thu tiền ngay (ORDER_PAID) chuẩn Nợ 112 / Có 511, 3331', () => {
      const bien = {
        thanhTienTruocThue: 10000000,
        tienThue: 1000000,
        doiTuongId: 'KH-001',
        soChungTuNguon: 'ORD-2026-001'
      };

      const kq = thucThiQuyTacHachToan('ORDER_PAID', bien);
      expect(kq.thanhCong).toBe(true);
      expect(kq.canDoi).toBe(true);
      expect(kq.tongNo).toBe(11000000);
      expect(kq.tongCo).toBe(11000000);
      expect(kq.dongHachToan.length).toBe(2);

      // Dòng 1: Nợ 112 / Có 511: 10.000.000
      expect(kq.dongHachToan[0].tkNo).toBe('112');
      expect(kq.dongHachToan[0].tkCo).toBe('511');
      expect(kq.dongHachToan[0].soTien).toBe(10000000);

      // Dòng 2: Nợ 112 / Có 3331: 1.000.000
      expect(kq.dongHachToan[1].tkNo).toBe('112');
      expect(kq.dongHachToan[1].tkCo).toBe('3331');
      expect(kq.dongHachToan[1].soTien).toBe(1000000);
    });

    it('Sinh bút toán xuất kho bán hàng (GOODS_ISSUED) Nợ 632 / Có 156 kèm bắt buộc mã kho (BR-05)', () => {
      // TH thiếu mã kho -> báo lỗi
      const bienThieuKho = {
        giaVon: 7500000,
        soChungTuNguon: 'PXK-001'
      };
      const kqLoi = thucThiQuyTacHachToan('GOODS_ISSUED', bienThieuKho);
      expect(kqLoi.thanhCong).toBe(false);
      expect(kqLoi.loi?.some(l => l.includes('bắt buộc phải có mã kho'))).toBe(true);

      // TH đủ mã kho -> thành công
      const bienHopLe = {
        giaVon: 7500000,
        khoId: 'KHO-TONG',
        soChungTuNguon: 'PXK-001'
      };
      const kqOk = thucThiQuyTacHachToan('GOODS_ISSUED', bienHopLe);
      expect(kqOk.thanhCong).toBe(true);
      expect(kqOk.dongHachToan[0].tkNo).toBe('632');
      expect(kqOk.dongHachToan[0].tkCo).toBe('156');
      expect(kqOk.dongHachToan[0].soTien).toBe(7500000);
    });

    it('Bắt buộc có đối tượng với tài khoản công nợ (BR-04)', () => {
      const bienThieuDoiTuong = {
        thanhTienTruocThue: 5000000,
        tienThue: 500000,
        khoId: 'KHO-01'
        // Không có doiTuongId
      };
      const kq = thucThiQuyTacHachToan('PO_RECEIVED', bienThieuDoiTuong);
      expect(kq.thanhCong).toBe(false);
      expect(kq.loi?.some(l => l.includes('bắt buộc phải có đối tượng'))).toBe(true);
    });

    it('Thực thi nghiệp vụ mới TT99: Trả cổ tức TK 332 và Tiến độ XD TK 337', () => {
      // 1. Trả cổ tức Nợ 4212 / Có 332
      const kqCoTuc = thucThiQuyTacHachToan('DIVIDEND_PAYOUT', {
        tongCong: 500000000,
        doiTuongId: 'CD-VINH',
        soChungTuNguon: 'NQ-HDQT-01'
      });
      expect(kqCoTuc.thanhCong).toBe(true);
      expect(kqCoTuc.dongHachToan[0].tkNo).toBe('4212');
      expect(kqCoTuc.dongHachToan[0].tkCo).toBe('332');

      // 2. Tiến độ HĐXD Nợ 131 / Có 337
      const kqXD = thucThiQuyTacHachToan('CONSTRUCTION_BILLING', {
        tongCong: 250000000,
        doiTuongId: 'CD-NAM-A',
        soChungTuNguon: 'NT-DOT-02'
      });
      expect(kqXD.thanhCong).toBe(true);
      expect(kqXD.dongHachToan[0].tkNo).toBe('131');
      expect(kqXD.dongHachToan[0].tkCo).toBe('337');
    });
  });

  describe('3. Kết chuyển cuối kỳ xác định KQKD (BR-19)', () => {
    it('Kết chuyển doanh thu và chi phí sang 911, sau đó kết chuyển lãi sang 4212', () => {
      const soDu = {
        '511': 100000000, // Doanh thu bán hàng: 100tr
        '515': 5000000,   // Doanh thu tài chính: 5tr
        '632': 60000000,  // Giá vốn: 60tr
        '6421': 15000000, // Chi phí bán hàng: 15tr
        '6422': 10000000, // Chi phí QLDN: 10tr
        '8211': 4000000   // Thuế TNDN hiện hành: 4tr
      };

      const kq = tinhKetChuyenCuoiKy(soDu);

      // Tổng doanh thu = 105tr
      // Tổng chi phí = 60 + 15 + 10 + 4 = 89tr
      // Lãi ròng = 105 - 89 = 16tr
      expect(kq.loiNhuanRong).toBe(16000000);

      // Dòng kết chuyển lãi: Nợ 911 / Có 4212: 16.000.000
      const dongLai = kq.dongKetChuyen.find(d => d.tkNo === '911' && d.tkCo === '4212');
      expect(dongLai).toBeDefined();
      expect(dongLai?.soTien).toBe(16000000);
    });

    it('Kết chuyển lỗ kinh doanh sang Nợ 4212 / Có 911', () => {
      const soDu = {
        '511': 50000000,  // Doanh thu: 50tr
        '632': 70000000,  // Giá vốn: 70tr
        '6422': 10000000  // CP QLDN: 10tr
      };

      const kq = tinhKetChuyenCuoiKy(soDu);

      // Doanh thu = 50tr, Chi phí = 80tr -> Lỗ = -30tr
      expect(kq.loiNhuanRong).toBe(-30000000);

      // Dòng kết chuyển lỗ: Nợ 4212 / Có 911: 30.000.000
      const dongLo = kq.dongKetChuyen.find(d => d.tkNo === '4212' && d.tkCo === '911');
      expect(dongLo).toBeDefined();
      expect(dongLo?.soTien).toBe(30000000);
    });
  });

});
