import { describe, it, expect } from 'vitest';
import { parseInvoiceXml, validateInvoiceWithCompany } from './invoiceXmlParser';
import {
  reconcileInvoicesWithVouchers,
  generateVoucherFromInvoice,
  getSmartAccountSuggestion
} from './invoiceReconciliationEngine';
import { SAMPLE_XML_INVOICES } from './gdtAndEmailSyncService';
import { ChungTuNhatKyChung } from './types';

describe('Hóa đơn điện tử XML & Đối chiếu Bút toán Kế toán', () => {
  describe('invoiceXmlParser', () => {
    it('phân tích chính xác tệp XML hóa đơn điện tử chuẩn QĐ 1450/TT78', () => {
      const invoice = parseInvoiceXml(SAMPLE_XML_INVOICES[0], 'GDT_PORTAL');

      expect(invoice.mauSoHDon).toBe('1');
      expect(invoice.kyHieuHDon).toBe('1C26TBB');
      expect(invoice.soHDon).toBe('00000005');
      expect(invoice.ngayLap).toBe('2026-03-03');
      expect(invoice.nguoiBan.mst).toBe('0107889922');
      expect(invoice.nguoiBan.ten).toContain('BẮC NAM');
      expect(invoice.nguoiMua.mst).toBe('0109888888');

      expect(invoice.danhSachHangHoa).toHaveLength(1);
      expect(invoice.danhSachHangHoa[0].tenHangHoa).toContain('Type-C Pro');
      expect(invoice.danhSachHangHoa[0].soLuong).toBe(100);
      expect(invoice.danhSachHangHoa[0].thanhTien).toBe(15000000);
      expect(invoice.danhSachHangHoa[0].tienThue).toBe(1500000);

      expect(invoice.tongTienChuaThue).toBe(15000000);
      expect(invoice.tongTienThue).toBe(1500000);
      expect(invoice.tongTienThanhToan).toBe(16500000);
      expect(invoice.maCQT).toBe('T26-00014829101');
      expect(invoice.trangThaiChuKy).toBe('HOP_LE');
    });

    it('kiểm tra hợp lệ MST người mua với MST công ty', () => {
      const invoice = parseInvoiceXml(SAMPLE_XML_INVOICES[0]);
      const validCheck = validateInvoiceWithCompany(invoice, '0109888888');
      expect(validCheck.isValid).toBe(true);

      const invalidCheck = validateInvoiceWithCompany(invoice, '0399999999');
      expect(invalidCheck.isValid).toBe(false);
      expect(invalidCheck.warning).toContain('không khớp');
    });
  });

  describe('invoiceReconciliationEngine', () => {
    const mockVouchers: ChungTuNhatKyChung[] = [
      {
        id: 'ct-matched',
        tenantId: 'tenant-vcomm-prod-01',
        loaiCt: 'MUA',
        soCt: 'HDM-2026-03-005',
        ngayCt: '2026-03-03',
        ngayHachToan: '2026-03-03',
        kyKeToan: '2026-03',
        dienGiai: 'Mua phụ kiện điện thoại NCC Tổng kho',
        nguoiLapId: 'user-01',
        trangThai: 'DA_GHI_SO',
        thongTuApDung: 'TT99',
        dinhKhoan: [
          {
            soDong: 1,
            dienGiai: 'Mua hàng',
            tkNo: '156',
            tkCo: '331',
            soTien: 15000000,
            loaiTien: 'VND',
            tyGia: 1,
            soTienQuyDoi: 15000000,
            maDoiTuong: '0107889922',
            hoaDonSo: '00000005',
            hoaDonNgay: '2026-03-03'
          },
          {
            soDong: 2,
            dienGiai: 'Thuế GTGT',
            tkNo: '1331',
            tkCo: '331',
            soTien: 1500000,
            loaiTien: 'VND',
            tyGia: 1,
            soTienQuyDoi: 1500000,
            maDoiTuong: '0107889922',
            hoaDonSo: '00000005',
            hoaDonNgay: '2026-03-03'
          }
        ]
      },
      {
        id: 'ct-unmatched-voucher',
        tenantId: 'tenant-vcomm-prod-01',
        loaiCt: 'MUA',
        soCt: 'HDM-2026-03-999',
        ngayCt: '2026-03-20',
        ngayHachToan: '2026-03-20',
        kyKeToan: '2026-03',
        dienGiai: 'Mua hàng chưa có hóa đơn',
        nguoiLapId: 'user-01',
        trangThai: 'DA_GHI_SO',
        thongTuApDung: 'TT99',
        dinhKhoan: [
          {
            soDong: 1,
            dienGiai: 'Mua hàng',
            tkNo: '156',
            tkCo: '331',
            soTien: 30000000,
            loaiTien: 'VND',
            tyGia: 1,
            soTienQuyDoi: 30000000
          }
        ]
      }
    ];

    it('đối chiếu chính xác trạng thái KHOP_HOAN_TOAN và CHUA_HACH_TOAN', () => {
      const invoices = SAMPLE_XML_INVOICES.map(xml => parseInvoiceXml(xml));
      const report = reconcileInvoicesWithVouchers(invoices, mockVouchers);

      // Hóa đơn 1 (SHDon: 00000005) phải khớp hoàn toàn
      const item1 = report.items.find(i => i.invoice.soHDon === '00000005');
      expect(item1).toBeDefined();
      expect(item1?.status).toBe('KHOP_HOAN_TOAN');
      expect(item1?.chenhLechTien).toBe(0);
      expect(item1?.matchedVoucher?.soCt).toBe('HDM-2026-03-005');

      // Hóa đơn 2 (SHDon: 00008892 - VNPT) chưa được hạch toán
      const item2 = report.items.find(i => i.invoice.soHDon === '00008892');
      expect(item2).toBeDefined();
      expect(item2?.status).toBe('CHUA_HACH_TOAN');
      expect(item2?.autoPostingSuggestion?.tkNo).toBe('642'); // Tự động gợi ý TK 642 cho viễn thông/internet

      // Bút toán thiếu hóa đơn
      expect(report.unmatchedVouchers).toHaveLength(1);
      expect(report.unmatchedVouchers[0].voucher.soCt).toBe('HDM-2026-03-999');

      // Thống kê
      expect(report.summary.tongHoaDon).toBe(3);
      expect(report.summary.khopHoanToan).toBe(1);
      expect(report.summary.chuaHachToan).toBe(2);
      expect(report.summary.chuaCoHoaDon).toBe(1);
    });

    it('tự động sinh chứng từ kế toán cân đối Nợ - Có chuẩn Thông tư 99', () => {
      const invoiceVNPT = parseInvoiceXml(SAMPLE_XML_INVOICES[1]);
      const voucher = generateVoucherFromInvoice(invoiceVNPT);

      expect(voucher.loaiCt).toBe('MUA');
      expect(voucher.soCt).toContain('HDM-');
      expect(voucher.ngayHachToan).toBe('2026-03-10');
      expect(voucher.dinhKhoan).toHaveLength(2); // Dòng Nợ 642 + Dòng Nợ 1331

      const dong1 = voucher.dinhKhoan[0];
      const dong2 = voucher.dinhKhoan[1];

      expect(dong1.tkNo).toBe('642');
      expect(dong1.tkCo).toBe('331');
      expect(dong1.soTien).toBe(4800000);
      expect(dong1.hoaDonSo).toBe('00008892');

      expect(dong2.tkNo).toBe('1331');
      expect(dong2.tkCo).toBe('331');
      expect(dong2.soTien).toBe(480000);

      const tongNo = dong1.soTien + dong2.soTien;
      expect(tongNo).toBe(invoiceVNPT.tongTienThanhToan);
    });
  });
});
