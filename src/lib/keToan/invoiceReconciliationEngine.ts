/**
 * BỘ MÁY ĐỐI CHIẾU HÓA ĐƠN ĐIỆN TỬ VỚI SỔ KẾ TOÁN (INVOICE RECONCILIATION ENGINE)
 * Đối chiếu chéo 2 chiều giữa Hóa đơn XML đầu vào và Chứng từ Sổ Nhật ký chung (TT99)
 * Tự động phát hiện chênh lệch và hỗ trợ sinh bút toán tự động (Auto-posting).
 */

import { EInvoiceData } from './invoiceXmlParser';
import { ChungTuNhatKyChung, DinhKhoan } from './types';

export type ReconciliationStatus = 
  | 'KHOP_HOAN_TOAN'  // Khớp 100% Số HĐ + MST + Tiền hàng + Tiền thuế
  | 'LECH_SO_LIEU'    // Trùng số HĐ hoặc MST nhưng lệch tiền/ngày/thuế
  | 'CHUA_HACH_TOAN'  // Có HĐĐT nhưng sổ kế toán chưa có bút toán
  | 'CHUA_CO_HOA_DON'; // Sổ kế toán có bút toán nhưng chưa có HĐĐT đối ứng

export interface ReconciliationItem {
  id: string;
  invoice: EInvoiceData;
  matchedVoucher?: ChungTuNhatKyChung;
  status: ReconciliationStatus;
  chenhLechTien: number;      // invoice.tongTienThanhToan - voucherAmount
  chenhLechThue: number;      // invoice.tongTienThue - voucherTax
  chenhLechNgay: number;      // Số ngày lệch giữa ngày HĐ và ngày hạch toán
  ghiChuDoiChieu: string;
  autoPostingSuggestion?: {
    tkNo: string;
    tkCo: string;
    tkThue: string;
    dienGiai: string;
  };
}

export interface UnmatchedVoucherItem {
  voucher: ChungTuNhatKyChung;
  status: 'CHUA_CO_HOA_DON';
  ghiChu: string;
}

export interface ReconciliationSummary {
  tongHoaDon: number;
  khopHoanToan: number;
  lechSoLieu: number;
  chuaHachToan: number;
  chuaCoHoaDon: number;
  tongTienHoaDon: number;
  tongThueDauVao: number;
}

export interface ReconciliationReport {
  items: ReconciliationItem[];
  unmatchedVouchers: UnmatchedVoucherItem[];
  summary: ReconciliationSummary;
}

/**
 * Tính số ngày chênh lệch giữa 2 ngày YYYY-MM-DD
 */
function getDayDiff(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 0;
  const d1 = new Date(dateStr1).getTime();
  const d2 = new Date(dateStr2).getTime();
  if (isNaN(d1) || isNaN(d2)) return 0;
  return Math.round(Math.abs(d1 - d2) / (1000 * 60 * 60 * 24));
}

/**
 * Tính tổng số tiền phát sinh liên quan đến nhà cung cấp / mua hàng của một chứng từ
 */
function getVoucherPayableAmount(voucher: ChungTuNhatKyChung): { totalAmount: number; taxAmount: number } {
  let totalAmount = 0;
  let taxAmount = 0;

  for (const d of voucher.dinhKhoan) {
    // Tiền thuế đầu vào (TK 133, 1331)
    if (d.tkNo.startsWith('133')) {
      taxAmount += d.soTien;
    }
    // Tiền phải trả hoặc tiền chi ra (Có 331, Có 111, Có 112)
    if (d.tkCo.startsWith('331') || d.tkCo.startsWith('111') || d.tkCo.startsWith('112')) {
      totalAmount += d.soTien;
    }
  }

  // Nếu không ghi nhận theo luồng Có 331/111/112, tính tổng Nợ chi phí/kho + Nợ thuế
  if (totalAmount === 0) {
    for (const d of voucher.dinhKhoan) {
      if (d.tkNo.startsWith('156') || d.tkNo.startsWith('152') || d.tkNo.startsWith('642') || d.tkNo.startsWith('133')) {
        totalAmount += d.soTien;
      }
    }
  }

  return { totalAmount, taxAmount };
}

/**
 * Gợi ý tài khoản kế toán thông minh theo Thông tư 99 dựa trên nội dung hóa đơn
 */
export function getSmartAccountSuggestion(invoice: EInvoiceData): {
  tkNo: string;
  tenTkNo: string;
  tkCo: string;
  tenTkCo: string;
  tkThue: string;
  tenTkThue: string;
  dienGiai: string;
} {
  const lineTexts = invoice.danhSachHangHoa.map(h => h.tenHangHoa.toLowerCase()).join(' ');

  let tkNo = '156';
  let tenTkNo = 'Hàng hóa';

  if (lineTexts.includes('phần mềm') || lineTexts.includes('quản lý') || lineTexts.includes('dịch vụ') || lineTexts.includes('văn phòng') || lineTexts.includes('cước') || lineTexts.includes('internet')) {
    tkNo = '642';
    tenTkNo = 'Chi phí quản lý doanh nghiệp';
  } else if (lineTexts.includes('nguyên vật liệu') || lineTexts.includes('vật tư') || lineTexts.includes('linh kiện thô')) {
    tkNo = '152';
    tenTkNo = 'Nguyên liệu, vật liệu';
  } else if (lineTexts.includes('quảng cáo') || lineTexts.includes('tiếp thị') || lineTexts.includes('marketing') || lineTexts.includes('bao bì')) {
    tkNo = '641';
    tenTkNo = 'Chi phí bán hàng';
  } else if (lineTexts.includes('máy tính văn phòng') || lineTexts.includes('bàn ghế') || lineTexts.includes('công cụ')) {
    tkNo = '242';
    tenTkNo = 'Chi phí trả trước';
  }

  return {
    tkNo,
    tenTkNo,
    tkCo: '331',
    tenTkCo: 'Phải trả cho người bán',
    tkThue: '1331',
    tenTkThue: 'Thuế GTGT được khấu trừ của HHDV',
    dienGiai: `Mua hàng/DV theo HĐĐT số ${invoice.soHDon} từ ${invoice.nguoiBan.ten}`
  };
}

/**
 * Thực hiện đối chiếu tự động 2 chiều giữa Hóa đơn XML và Danh sách chứng từ
 */
export function reconcileInvoicesWithVouchers(
  invoices: EInvoiceData[],
  vouchers: ChungTuNhatKyChung[]
): ReconciliationReport {
  const matchedVoucherIds = new Set<string>();
  const items: ReconciliationItem[] = [];

  for (const inv of invoices) {
    const invSoHDon = inv.soHDon.replace(/^0+/, ''); // bỏ các số 0 thừa
    const invMst = inv.nguoiBan.mst.replace(/[^a-zA-Z0-9]/g, '');

    // 1. Tìm chứng từ khớp chính xác nhất
    let matched: ChungTuNhatKyChung | undefined = undefined;

    // Ưu tiên 1: Khớp Số hóa đơn ghi nhận trong dòng định khoản
    matched = vouchers.find(v => 
      v.dinhKhoan.some(d => d.hoaDonSo && d.hoaDonSo.replace(/^0+/, '') === invSoHDon)
    );

    // Ưu tiên 2: Khớp Số hóa đơn nằm trong số chứng từ hoặc diễn giải kèm MST người bán
    if (!matched) {
      matched = vouchers.find(v => {
        const containsSoHDon = v.soCt.includes(invSoHDon) || v.dienGiai.includes(invSoHDon);
        const matchesMst = v.dinhKhoan.some(d => d.maDoiTuong && d.maDoiTuong.replace(/[^a-zA-Z0-9]/g, '') === invMst);
        return containsSoHDon || (matchesMst && v.loaiCt === 'MUA');
      });
    }

    // Ưu tiên 3: Khớp Số tiền mua hàng và trong cùng khoảng thời gian (+- 5 ngày)
    if (!matched) {
      matched = vouchers.find(v => {
        if (v.loaiCt !== 'MUA' && v.loaiCt !== 'CHI') return false;
        const { totalAmount } = getVoucherPayableAmount(v);
        const isSameAmount = Math.abs(totalAmount - inv.tongTienThanhToan) < 100;
        const dayDiff = getDayDiff(inv.ngayLap, v.ngayHachToan);
        return isSameAmount && dayDiff <= 7;
      });
    }

    if (matched) {
      matchedVoucherIds.add(matched.id || matched.soCt);
      const { totalAmount, taxAmount } = getVoucherPayableAmount(matched);
      const chenhLechTien = Math.round((inv.tongTienThanhToan - totalAmount) * 100) / 100;
      const chenhLechThue = Math.round((inv.tongTienThue - taxAmount) * 100) / 100;
      const chenhLechNgay = getDayDiff(inv.ngayLap, matched.ngayHachToan);

      let status: ReconciliationStatus = 'KHOP_HOAN_TOAN';
      let ghiChuDoiChieu = 'Khớp hoàn toàn 100% với chứng từ sổ sách.';

      if (Math.abs(chenhLechTien) >= 1) {
        status = 'LECH_SO_LIEU';
        ghiChuDoiChieu = `Lệch tổng tiền: HĐ ${inv.tongTienThanhToan.toLocaleString('vi-VN')} đ vs Sổ ${totalAmount.toLocaleString('vi-VN')} đ (Lệch: ${chenhLechTien.toLocaleString('vi-VN')} đ).`;
      } else if (Math.abs(chenhLechThue) >= 1) {
        status = 'LECH_SO_LIEU';
        ghiChuDoiChieu = `Lệch tiền thuế GTGT: HĐ ${inv.tongTienThue.toLocaleString('vi-VN')} đ vs Sổ ${taxAmount.toLocaleString('vi-VN')} đ.`;
      } else if (chenhLechNgay > 10) {
        status = 'LECH_SO_LIEU';
        ghiChuDoiChieu = `Số tiền khớp nhưng ngày lập HĐ (${inv.ngayLap}) lệch ${chenhLechNgay} ngày so với ngày hạch toán (${matched.ngayHachToan}).`;
      }

      items.push({
        id: `recon-${inv.id}`,
        invoice: inv,
        matchedVoucher: matched,
        status,
        chenhLechTien,
        chenhLechThue,
        chenhLechNgay,
        ghiChuDoiChieu
      });
    } else {
      // Hóa đơn chưa được hạch toán trong sổ kế toán
      const suggestion = getSmartAccountSuggestion(inv);
      items.push({
        id: `recon-${inv.id}`,
        invoice: inv,
        status: 'CHUA_HACH_TOAN',
        chenhLechTien: inv.tongTienThanhToan,
        chenhLechThue: inv.tongTienThue,
        chenhLechNgay: 0,
        ghiChuDoiChieu: 'Hóa đơn hợp lệ từ CQT/Email nhưng chưa được ghi sổ kế toán.',
        autoPostingSuggestion: {
          tkNo: suggestion.tkNo,
          tkCo: suggestion.tkCo,
          tkThue: suggestion.tkThue,
          dienGiai: suggestion.dienGiai
        }
      });
    }
  }

  // 2. Tìm các chứng từ mua hàng/chi phí trong sổ chưa có hóa đơn điện tử
  const unmatchedVouchers: UnmatchedVoucherItem[] = [];
  for (const v of vouchers) {
    if ((v.loaiCt === 'MUA' || v.loaiCt === 'CHI') && !matchedVoucherIds.has(v.id || v.soCt)) {
      unmatchedVouchers.push({
        voucher: v,
        status: 'CHUA_CO_HOA_DON',
        ghiChu: `Chứng từ ${v.soCt} (${v.dienGiai}) chưa đối chiếu được hóa đơn điện tử đầu vào tương ứng.`
      });
    }
  }

  // 3. Thống kê tổng hợp
  const summary: ReconciliationSummary = {
    tongHoaDon: invoices.length,
    khopHoanToan: items.filter(i => i.status === 'KHOP_HOAN_TOAN').length,
    lechSoLieu: items.filter(i => i.status === 'LECH_SO_LIEU').length,
    chuaHachToan: items.filter(i => i.status === 'CHUA_HACH_TOAN').length,
    chuaCoHoaDon: unmatchedVouchers.length,
    tongTienHoaDon: invoices.reduce((sum, inv) => sum + inv.tongTienThanhToan, 0),
    tongThueDauVao: invoices.reduce((sum, inv) => sum + inv.tongTienThue, 0)
  };

  return { items, unmatchedVouchers, summary };
}

/**
 * Tự động sinh chứng từ kế toán Nhật ký chung chuẩn TT99 từ Hóa đơn điện tử
 */
export function generateVoucherFromInvoice(
  invoice: EInvoiceData,
  currentUserId = 'user-auto-post',
  tenantId = 'tenant-vcomm-prod-01'
): ChungTuNhatKyChung {
  const suggestion = getSmartAccountSuggestion(invoice);
  const dinhKhoan: DinhKhoan[] = [];
  let soDong = 1;

  // Dòng 1: Ghi Nợ tài khoản hàng hóa / chi phí
  dinhKhoan.push({
    soDong: soDong++,
    dienGiai: invoice.danhSachHangHoa[0]?.tenHangHoa 
      ? `Mua ${invoice.danhSachHangHoa[0].tenHangHoa} (HĐ: ${invoice.soHDon})`
      : suggestion.dienGiai,
    tkNo: suggestion.tkNo,
    tenTkNo: suggestion.tenTkNo,
    tkCo: suggestion.tkCo,
    tenTkCo: suggestion.tenTkCo,
    soTien: invoice.tongTienChuaThue,
    loaiTien: invoice.loaiTien || 'VND',
    tyGia: invoice.tyGia || 1,
    soTienQuyDoi: invoice.tongTienChuaThue,
    maDoiTuong: invoice.nguoiBan.mst,
    tenDoiTuong: invoice.nguoiBan.ten,
    hoaDonSo: invoice.soHDon,
    hoaDonNgay: invoice.ngayLap,
    thueSuat: parseFloat(invoice.danhSachHangHoa[0]?.thueSuat || '10') || 10
  });

  // Dòng 2: Ghi Nợ tài khoản Thuế GTGT đầu vào (nếu có thuế)
  if (invoice.tongTienThue > 0) {
    dinhKhoan.push({
      soDong: soDong++,
      dienGiai: `Thuế GTGT đầu vào khấu trừ theo HĐĐT số ${invoice.soHDon}`,
      tkNo: suggestion.tkThue,
      tenTkNo: suggestion.tenTkThue,
      tkCo: suggestion.tkCo,
      tenTkCo: suggestion.tenTkCo,
      soTien: invoice.tongTienThue,
      loaiTien: invoice.loaiTien || 'VND',
      tyGia: invoice.tyGia || 1,
      soTienQuyDoi: invoice.tongTienThue,
      maDoiTuong: invoice.nguoiBan.mst,
      tenDoiTuong: invoice.nguoiBan.ten,
      hoaDonSo: invoice.soHDon,
      hoaDonNgay: invoice.ngayLap,
      thueSuat: parseFloat(invoice.danhSachHangHoa[0]?.thueSuat || '10') || 10
    });
  }

  const kyKeToan = invoice.ngayLap ? invoice.ngayLap.substring(0, 7) : '2026-03';
  const soCt = `HDM-${invoice.ngayLap.replace(/-/g, '').substring(2, 6)}-${invoice.soHDon.slice(-4)}`;

  return {
    id: `ct-auto-${Date.now()}-${invoice.soHDon}`,
    tenantId,
    loaiCt: 'MUA',
    soCt,
    ngayCt: invoice.ngayLap,
    ngayHachToan: invoice.ngayLap,
    kyKeToan,
    dienGiai: suggestion.dienGiai,
    nguoiLapId: currentUserId,
    trangThai: 'DA_GHI_SO',
    thongTuApDung: 'TT99',
    dinhKhoan,
    sourceSystem: 'ERP_PURCHASE'
  };
}
