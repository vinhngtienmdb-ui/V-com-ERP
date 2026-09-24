import { describe, it, expect } from 'vitest';
import {
  escapeXml,
  generateTaxXmlFileName,
  buildTaxXmlDocument,
  validateTaxXmlContent
} from './taxXmlExportService';

describe('taxXmlExportService (Xuất XML Thuế điện tử TT99)', () => {
  describe('escapeXml', () => {
    it('thoát đúng các ký tự đặc biệt theo chuẩn XML', () => {
      expect(escapeXml('Công ty T&T <Hà Nội> "Việt Nam" \'VComm\'')).toBe(
        'Công ty T&amp;T &lt;Hà Nội&gt; &quot;Việt Nam&quot; &apos;VComm&apos;'
      );
      expect(escapeXml(12345)).toBe('12345');
      expect(escapeXml(null)).toBe('');
      expect(escapeXml(undefined)).toBe('');
    });
  });

  describe('generateTaxXmlFileName', () => {
    it('sinh tên file chuẩn quy ước Tổng cục Thuế không dấu cách', () => {
      const fileNameAll = generateTaxXmlFileName('0109 888 888', '2026', 'ALL_BCTC');
      expect(fileNameAll).toBe('BCTC_0109888888_2026_TT99.xml');

      const fileNameB01 = generateTaxXmlFileName('0109888888', '03/2026', 'B01');
      expect(fileNameB01).toBe('BCTC_B01_0109888888_03_2026.xml');
    });
  });

  describe('buildTaxXmlDocument & validateTaxXmlContent', () => {
    const mockCompany = {
      tenCongTy: 'CÔNG TY CỔ PHẦN TẬP ĐOÀN VCOMM VIỆT NAM',
      maSoThue: '0109888888',
      coQuanThue: 'Cục Thuế TP. Hà Nội',
      diaChi: 'Tầng 18, Tòa nhà VComm Center, Cầu Giấy, Hà Nội',
      nguoiDaiDien: 'Nguyễn Tiến Vinh',
      keToanTruong: 'Trần Thị Thu Hương'
    };

    const mockB01 = {
      tongTaiSan: 1500000000,
      tongNguonVon: 1500000000,
      canDoi: true,
      danhSachChiTieu: [
        { maSo: '100', chiTieu: 'A. TÀI SẢN NGẮN HẠN', soCuoiKy: 800000000, soDauKy: 500000000, isHeader: true },
        { maSo: '110', chiTieu: 'I. Tiền và các khoản tương đương tiền', soCuoiKy: 350000000, soDauKy: 200000000 }
      ]
    };

    const mockB02 = {
      doanhThuThuan: 500000000,
      loiNhuanGop: 150000000,
      loiNhuanThuan: 90000000,
      loiNhuanTruocThue: 90000000,
      loiNhuanSauThue: 72000000,
      danhSachChiTieu: [
        { maSo: '01', chiTieu: '1. Doanh thu bán hàng và CCDV', kyNay: 500000000, kyTruoc: 400000000 },
        { maSo: '60', chiTieu: '16. Lợi nhuận sau thuế TNDN', kyNay: 72000000, kyTruoc: 60000000, isHeader: true }
      ]
    };

    const mockTrialBalance = {
      tongDuNoDauKy: 1000000000,
      tongDuCoDauKy: 1000000000,
      tongPhatSinhNo: 650000000,
      tongPhatSinhCo: 650000000,
      tongDuNoCuoiKy: 1650000000,
      tongDuCoCuoiKy: 1650000000,
      canDoiDauKy: true,
      canDoiPhatSinh: true,
      canDoiCuoiKy: true,
      danhSachTk: [
        { maTk: '111', tenTk: 'Tiền mặt', duNoDauKy: 50000000, duCoDauKy: 0, phatSinhNo: 20000000, phatSinhCo: 10000000, duNoCuoiKy: 60000000, duCoCuoiKy: 0 }
      ]
    };

    it('tạo đúng cấu trúc XML trọn bộ BCTC (ALL_BCTC) chuẩn Tổng cục Thuế', () => {
      const xml = buildTaxXmlDocument({
        reportType: 'ALL_BCTC',
        companyInfo: mockCompany,
        fromDate: '2026-01-01',
        toDate: '2026-12-31',
        b01: mockB01,
        b02: mockB02,
        trialBalance: mockTrialBalance
      });

      // Kiểm tra thẻ gốc & namespace
      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<HSoThueDTu xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue">');
      
      // Kiểm tra thông tin chung & người nộp thuế
      expect(xml).toContain('<mst>0109888888</mst>');
      expect(xml).toContain('<tenNNT>CÔNG TY CỔ PHẦN TẬP ĐOÀN VCOMM VIỆT NAM</tenNNT>');
      expect(xml).toContain('<tenCQTNoiNop>Cục Thuế TP. Hà Nội</tenCQTNoiNop>');
      expect(xml).toContain('<pbanTKhaiXML>2.1.0</pbanTKhaiXML>');
      expect(xml).toContain('<kyKKhai>2026</kyKKhai>');

      // Kiểm tra cả 3 phân hệ xuất hiện trong BCTC
      expect(xml).toContain('<BangTinhHinhTaiChinh mauSo="B01-DN">');
      expect(xml).toContain('<maSo>100</maSo>');
      expect(xml).toContain('<BangKetQuaKD mauSo="B02-DN">');
      expect(xml).toContain('<maSo>01</maSo>');
      expect(xml).toContain('<BangCanDoiSoPhatSinh mauSo="F01-DN">');
      expect(xml).toContain('<maTK>111</maTK>');

      // Kiểm tra hợp lệ cấu trúc
      const validation = validateTaxXmlContent(xml);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('tạo XML báo cáo đơn lẻ (B01-DN) chính xác', () => {
      const xml = buildTaxXmlDocument({
        reportType: 'B01',
        companyInfo: mockCompany,
        fromDate: '2026-01-01',
        toDate: '2026-03-31',
        b01: mockB01
      });

      expect(xml).toContain('<maTKhai>B01-DN</maTKhai>');
      expect(xml).toContain('<BangTinhHinhTaiChinh mauSo="B01-DN">');
      expect(xml).not.toContain('<BangKetQuaKD');
      expect(xml).not.toContain('<BangCanDoiSoPhatSinh');

      const validation = validateTaxXmlContent(xml);
      expect(validation.isValid).toBe(true);
    });

    it('phát hiện tệp XML không hợp lệ nếu thiếu các thẻ bắt buộc', () => {
      const invalidXml = '<SomeRandomXml><data>test</data></SomeRandomXml>';
      const validation = validateTaxXmlContent(invalidXml);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });
});
