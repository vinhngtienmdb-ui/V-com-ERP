import { describe, it, expect } from 'vitest';
import {
  KyKeToan,
  kiemTraKhoaSoKhiGhiSo,
  ChungTuHashable,
  taoChuoiHashChungTu,
  kiemTraToanVenChuoiChungTu,
  kiemTraDanhSoLienTuc,
  AuditTrailManager
} from './dieu28Compliance';

describe('Dieu28Compliance - Phase 9 Tuân thủ Điều 28 Thông tư 99/2025/TT-BTC', () => {
  describe('1. Khóa sổ kỳ kế toán (Điều 13.3 & Điều 28.1.a)', () => {
    const danhSachKy: KyKeToan[] = [
      {
        thang: 1,
        nam: 2026,
        trangThai: 'DA_KHOA_SO',
        ngayKhoa: '2026-02-05',
        nguoiKhoa: 'Trần Văn Kế Toán Trưởng'
      },
      {
        thang: 2,
        nam: 2026,
        trangThai: 'MO'
      }
    ];

    it('chặn thêm/sửa chứng từ vào kỳ đã khóa sổ', () => {
      const res = kiemTraKhoaSoKhiGhiSo('2026-01-15', danhSachKy);
      expect(res.hopLe).toBe(false);
      expect(res.lyDo).toContain('đã bị khóa sổ bởi Trần Văn Kế Toán Trưởng');
    });

    it('cho phép thêm/sửa chứng từ vào kỳ đang mở', () => {
      const res = kiemTraKhoaSoKhiGhiSo('2026-02-10', danhSachKy);
      expect(res.hopLe).toBe(true);
    });
  });

  describe('2. Tính toàn vẹn dữ liệu & Chống can thiệp lén (Điều 28.1.c)', () => {
    const rawVouchers: ChungTuHashable[] = [
      {
        id: 'CT-1',
        soChungTu: 'PKT-2026-0001',
        ngayHachToan: '2026-01-02',
        tongTien: 10000000,
        dongHachToan: [{ tkNo: '112', tkCo: '511', soTien: 10000000 }]
      },
      {
        id: 'CT-2',
        soChungTu: 'PKT-2026-0002',
        ngayHachToan: '2026-01-05',
        tongTien: 5000000,
        dongHachToan: [{ tkNo: '642', tkCo: '111', soTien: 5000000 }]
      },
      {
        id: 'CT-3',
        soChungTu: 'PKT-2026-0003',
        ngayHachToan: '2026-01-08',
        tongTien: 20000000,
        dongHachToan: [{ tkNo: '156', tkCo: '331', soTien: 20000000 }]
      }
    ];

    it('tạo chuỗi mã băm SHA-256 liên kết và xác minh toàn vẹn thành công', () => {
      const { danhSachWithHash, checksumKy } = taoChuoiHashChungTu(rawVouchers);
      expect(danhSachWithHash.length).toBe(3);
      expect(checksumKy).toBeDefined();

      const verification = kiemTraToanVenChuoiChungTu(danhSachWithHash);
      expect(verification.toanVen).toBe(true);
    });

    it('phát hiện can thiệp dữ liệu khi số tiền bị sửa đổi lén trong database', () => {
      const { danhSachWithHash } = taoChuoiHashChungTu(rawVouchers);

      // Kẻ gian sửa lén số tiền của chứng từ số 2 trực tiếp trong DB
      const tamperedList = JSON.parse(JSON.stringify(danhSachWithHash));
      tamperedList[1].tongTien = 999999999;

      const verification = kiemTraToanVenChuoiChungTu(tamperedList);
      expect(verification.toanVen).toBe(false);
      expect(verification.viTriBiLoi).toBe(2);
      expect(verification.soChungTuBiLoi).toBe('PKT-2026-0002');
      expect(verification.thongBao).toContain('CẢNH BÁO VI PHẠM ĐIỀU 28 TT99: Phát hiện can thiệp số liệu');
    });

    it('phát hiện can thiệp khi một chứng từ ở giữa bị xóa mất khỏi chuỗi', () => {
      const { danhSachWithHash } = taoChuoiHashChungTu(rawVouchers);

      // Xóa chứng từ số 2 -> làm đứt chuỗi liên kết hash
      const brokenChain = [danhSachWithHash[0], danhSachWithHash[2]];

      const verification = kiemTraToanVenChuoiChungTu(brokenChain);
      expect(verification.toanVen).toBe(false);
      expect(verification.soChungTuBiLoi).toBe('PKT-2026-0003');
      expect(verification.thongBao).toContain('sai lệch liên kết chuỗi khối');
    });
  });

  describe('3. Đánh số chứng từ liên tục không ngắt quãng (Điều 28.1.b)', () => {
    it('hợp lệ khi số chứng từ liên tục và không trùng lặp', () => {
      const numbers = ['PKT-2026-0001', 'PKT-2026-0002', 'PKT-2026-0003', 'PKT-2026-0004'];
      const res = kiemTraDanhSoLienTuc(numbers);
      expect(res.hopLe).toBe(true);
      expect(res.danhSachTrungLap.length).toBe(0);
      expect(res.danhSachKhoangTrong.length).toBe(0);
    });

    it('phát hiện trùng lặp số chứng từ', () => {
      const numbers = ['PKT-2026-0001', 'PKT-2026-0002', 'PKT-2026-0002', 'PKT-2026-0003'];
      const res = kiemTraDanhSoLienTuc(numbers);
      expect(res.hopLe).toBe(false);
      expect(res.danhSachTrungLap).toContain('PKT-2026-0002');
    });

    it('phát hiện đứt đoạn (gaps) số chứng từ bị thiếu', () => {
      // Thiếu số 2 và số 4
      const numbers = ['PKT-2026-0001', 'PKT-2026-0003', 'PKT-2026-0005'];
      const res = kiemTraDanhSoLienTuc(numbers);
      expect(res.hopLe).toBe(false);
      expect(res.danhSachKhoangTrong).toEqual([2, 4]);
    });
  });

  describe('4. Nhật ký kiểm toán bất biến (Audit Trail - Điều 28.1.b)', () => {
    it('ghi log theo trình tự thời gian với sequence đơn điệu và mã hóa kiểm tra', () => {
      const audit = new AuditTrailManager();

      audit.ghiLog('USR-01', 'Nguyễn Kế Toán', 'TAO_MOI', 'CHUNG_TU', 'PKT-001', null, { tien: 1000 });
      audit.ghiLog('USR-01', 'Nguyễn Kế Toán', 'GHI_SO', 'CHUNG_TU', 'PKT-001', { trangThai: 'NHAP' }, { trangThai: 'DA_GHI_SO' });
      audit.ghiLog('USR-KTT', 'Trần KTT', 'KHOA_SO', 'KY_KE_TOAN', 'KY-2026-01', null, { trangThai: 'DA_KHOA_SO' });

      const logs = audit.getLogs();
      expect(logs.length).toBe(3);
      expect(logs[0].sequenceNo).toBe(1);
      expect(logs[1].sequenceNo).toBe(2);
      expect(logs[2].sequenceNo).toBe(3);

      expect(audit.xacMinhTinhToanVenLog()).toBe(true);
    });
  });
});
