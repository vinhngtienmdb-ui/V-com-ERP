/**
 * BỘ PHÂN TÍCH CÚ PHÁP HÓA ĐƠN ĐIỆN TỬ XML (INVOICE XML PARSER)
 * Căn cứ:
 * - Nghị định 123/2020/NĐ-CP & Thông tư 78/2021/TT-BTC
 * - Quyết định số 1450/QĐ-TCT & Quyết định số 1510/QĐ-TCT của Tổng cục Thuế
 * Hỗ trợ hóa đơn có mã CQT, không mã CQT từ Cổng hoadondientu.gdt.gov.vn
 * và các nhà cung cấp (VNPT, Viettel, MISA, BKAV, v.v.)
 */

export interface EInvoiceLineItem {
  stt: number;
  tenHangHoa: string;
  donViTinh: string;
  soLuong: number;
  donGia: number;
  thanhTien: number;
  thueSuat: string; // "10%", "8%", "5%", "0%", "KCT"
  tienThue: number;
}

export interface EInvoiceData {
  id: string;
  mauSoHDon: string;     // ví dụ "1"
  kyHieuHDon: string;    // ví dụ "1C26TBB", "C26TAA"
  soHDon: string;        // ví dụ "00000123" hoặc "123"
  ngayLap: string;       // YYYY-MM-DD
  loaiTien: string;      // "VND"
  tyGia: number;         // 1
  hinhThucTT: string;    // "TM/CK", "CK", "TM"
  
  // Người bán (Nhà cung cấp)
  nguoiBan: {
    ten: string;
    mst: string;
    diaChi: string;
    sdt?: string;
    stk?: string;
    nganHang?: string;
  };

  // Người mua (Doanh nghiệp)
  nguoiMua: {
    ten: string;
    mst: string;
    diaChi: string;
  };

  // Chi tiết từng dòng hàng hóa / dịch vụ
  danhSachHangHoa: EInvoiceLineItem[];

  // Tổng thanh toán
  tongTienChuaThue: number;
  tongTienThue: number;
  tongTienThanhToan: number;
  tongTienBangChu: string;

  // Thuộc tính pháp lý & CQT
  maCQT?: string;        // Mã cơ quan thuế cấp
  ngayKy?: string;
  trangThaiChuKy: 'HOP_LE' | 'KHONG_HOP_LE' | 'CHUA_KY';
  nguonHoaDon: 'GDT_PORTAL' | 'EMAIL' | 'FILE_UPLOAD';
  rawXml?: string;
}

/**
 * Trợ giúp trích xuất nội dung văn bản từ một thẻ XML
 */
function getTagText(element: Element | Document, tagName: string, defaultValue = ''): string {
  const el = element.getElementsByTagName(tagName)[0];
  return el ? (el.textContent || '').trim() : defaultValue;
}

/**
 * Trợ giúp chuyển đổi số từ XML (hỗ trợ số thập phân dấu phẩy hoặc chấm)
 */
function parseXmlNumber(val: string | null | undefined): number {
  if (!val) return 0;
  // Bỏ dấu phẩy ngăn cách hàng nghìn nếu có
  const clean = val.replace(/\s+/g, '').replace(/,/g, '.');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

/**
 * Chuẩn hóa chuỗi ngày sang định dạng ISO YYYY-MM-DD
 */
function normalizeDateStr(dateStr: string): string {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  const trimmed = dateStr.trim();

  // Định dạng DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('/');
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${y}-${m}-${d}`;
  }

  // Định dạng ISO YYYY-MM-DD...
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return trimmed.substring(0, 10);
  }

  return trimmed;
}

/**
 * Phân tích tệp XML Hóa đơn điện tử thành đối tượng EInvoiceData
 */
export function parseInvoiceXml(
  xmlContent: string,
  source: 'GDT_PORTAL' | 'EMAIL' | 'FILE_UPLOAD' = 'FILE_UPLOAD'
): EInvoiceData {
  if (!xmlContent || typeof xmlContent !== 'string') {
    throw new Error('Nội dung XML rỗng hoặc không đúng định dạng');
  }

  // Khởi tạo DOMParser (hoạt động tốt trong Browser và JSDOM)
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlContent, 'application/xml');

  // Kiểm tra lỗi parser
  const parserError = xmlDoc.querySelector('parsererror');
  if (parserError) {
    throw new Error(`Lỗi cú pháp XML: ${parserError.textContent?.slice(0, 150)}`);
  }

  // 1. Thông tin chung hóa đơn (TTChung)
  const ttChung = xmlDoc.getElementsByTagName('TTChung')[0] || xmlDoc;
  const mauSoHDon = getTagText(ttChung, 'KHMSHDon', '1');
  const kyHieuHDon = getTagText(ttChung, 'KHHDon', '1C26TBB');
  let soHDon = getTagText(ttChung, 'SHDon', '');
  if (!soHDon) {
    soHDon = getTagText(xmlDoc, 'SHDon', '00000001');
  }
  // Bổ sung số 0 phía trước nếu số hóa đơn ngắn
  const soHDonNormalized = soHDon.length <= 8 && !isNaN(Number(soHDon)) 
    ? soHDon.padStart(8, '0') 
    : soHDon;

  const ngayLapRaw = getTagText(ttChung, 'NLap', '');
  const ngayLap = normalizeDateStr(ngayLapRaw);
  const loaiTien = getTagText(ttChung, 'DVTTe', 'VND');
  const tyGia = parseXmlNumber(getTagText(ttChung, 'TGia', '1')) || 1;
  const hinhThucTT = getTagText(ttChung, 'HTTToan', 'TM/CK');

  // 2. Thông tin Người Bán (NBan)
  const nBanEl = xmlDoc.getElementsByTagName('NBan')[0] || xmlDoc;
  const nBan = {
    ten: getTagText(nBanEl, 'Ten', 'Nhà cung cấp chưa xác định'),
    mst: getTagText(nBanEl, 'MST', '').replace(/[^a-zA-Z0-9-]/g, ''),
    diaChi: getTagText(nBanEl, 'DChi', ''),
    sdt: getTagText(nBanEl, 'SDThoai', ''),
    stk: getTagText(nBanEl, 'STKNHang', ''),
    nganHang: getTagText(nBanEl, 'TNHang', '')
  };

  // 3. Thông tin Người Mua (NMua)
  const nMuaEl = xmlDoc.getElementsByTagName('NMua')[0] || xmlDoc;
  const nMua = {
    ten: getTagText(nMuaEl, 'Ten', ''),
    mst: getTagText(nMuaEl, 'MST', '').replace(/[^a-zA-Z0-9-]/g, ''),
    diaChi: getTagText(nMuaEl, 'DChi', '')
  };

  // 4. Danh sách Hàng hóa, Dịch vụ (DSHHDVu -> HHDVu)
  const hhdVuList = xmlDoc.getElementsByTagName('HHDVu');
  const danhSachHangHoa: EInvoiceLineItem[] = [];

  for (let i = 0; i < hhdVuList.length; i++) {
    const itemEl = hhdVuList[i];
    const stt = parseInt(getTagText(itemEl, 'STT', String(i + 1)), 10) || (i + 1);
    const tenHangHoa = getTagText(itemEl, 'THHDVu', `Hàng hóa / Dịch vụ ${i + 1}`);
    const donViTinh = getTagText(itemEl, 'DVTinh', 'Cái');
    const soLuong = parseXmlNumber(getTagText(itemEl, 'SLuong', '1')) || 1;
    const donGia = parseXmlNumber(getTagText(itemEl, 'DGia', '0'));
    let thanhTien = parseXmlNumber(getTagText(itemEl, 'ThTien', '0'));
    if (!thanhTien && soLuong && donGia) {
      thanhTien = soLuong * donGia;
    }
    const thueSuat = getTagText(itemEl, 'TSuat', '10%');
    let tienThue = parseXmlNumber(getTagText(itemEl, 'TThue', '0'));
    if (!tienThue && thueSuat.includes('%')) {
      const rate = parseFloat(thueSuat) / 100;
      tienThue = Math.round(thanhTien * rate);
    }

    danhSachHangHoa.push({
      stt,
      tenHangHoa,
      donViTinh,
      soLuong,
      donGia,
      thanhTien,
      thueSuat,
      tienThue
    });
  }

  // 5. Tổng thanh toán (TToan)
  const tToanEl = xmlDoc.getElementsByTagName('TToan')[0] || xmlDoc;
  let tongTienChuaThue = parseXmlNumber(getTagText(tToanEl, 'TgTCThue', '0'));
  let tongTienThue = parseXmlNumber(getTagText(tToanEl, 'TgTThue', '0'));
  let tongTienThanhToan = parseXmlNumber(getTagText(tToanEl, 'TgTTTBSo', '0'));
  const tongTienBangChu = getTagText(tToanEl, 'TgTTTBChu', '');

  // Nếu trong thẻ TToan không có, tính từ danh sách hàng hóa
  if (!tongTienChuaThue && danhSachHangHoa.length > 0) {
    tongTienChuaThue = danhSachHangHoa.reduce((sum, item) => sum + item.thanhTien, 0);
  }
  if (!tongTienThue && danhSachHangHoa.length > 0) {
    tongTienThue = danhSachHangHoa.reduce((sum, item) => sum + item.tienThue, 0);
  }
  if (!tongTienThanhToan) {
    tongTienThanhToan = tongTienChuaThue + tongTienThue;
  }

  // 6. Mã cơ quan thuế & Chữ ký số
  const maCQT = getTagText(xmlDoc, 'MCCQT', '') || undefined;
  const signatureNodes = xmlDoc.getElementsByTagName('Signature');
  const trangThaiChuKy: 'HOP_LE' | 'KHONG_HOP_LE' | 'CHUA_KY' = 
    signatureNodes.length > 0 ? 'HOP_LE' : 'CHUA_KY';

  const invoiceId = `INV-${nBan.mst}-${kyHieuHDon}-${soHDonNormalized}`.replace(/\s+/g, '');

  return {
    id: invoiceId,
    mauSoHDon,
    kyHieuHDon,
    soHDon: soHDonNormalized,
    ngayLap,
    loaiTien,
    tyGia,
    hinhThucTT,
    nguoiBan: nBan,
    nguoiMua: nMua,
    danhSachHangHoa,
    tongTienChuaThue,
    tongTienThue,
    tongTienThanhToan,
    tongTienBangChu,
    maCQT,
    trangThaiChuKy,
    nguonHoaDon: source,
    rawXml: xmlContent
  };
}

/**
 * Kiểm tra tính hợp lệ cơ bản của hóa đơn đối với công ty tiếp nhận
 */
export function validateInvoiceWithCompany(
  invoice: EInvoiceData,
  companyTaxCode: string
): { isValid: boolean; warning?: string } {
  if (!invoice.nguoiBan.mst) {
    return { isValid: false, warning: 'Hóa đơn thiếu Mã số thuế Người bán.' };
  }
  if (!invoice.soHDon) {
    return { isValid: false, warning: 'Hóa đơn thiếu Số hóa đơn.' };
  }
  if (companyTaxCode && invoice.nguoiMua.mst && invoice.nguoiMua.mst !== companyTaxCode) {
    return {
      isValid: false,
      warning: `Mã số thuế Người mua (${invoice.nguoiMua.mst}) không khớp với MST Công ty (${companyTaxCode}). Cần lưu ý khi kê khai thuế GTGT!`
    };
  }
  return { isValid: true };
}
