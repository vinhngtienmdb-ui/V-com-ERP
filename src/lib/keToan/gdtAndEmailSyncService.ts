/**
 * DỊCH VỤ ĐỒNG BỘ HÓA ĐƠN ĐIỆN TỬ TỪ CỔNG THUẾ (hoadondientu.gdt.gov.vn) VÀ EMAIL
 * Quản lý kết nối, đồng bộ tự động và lưu trữ bộ nhớ đệm hóa đơn đầu vào.
 */

import { EInvoiceData, parseInvoiceXml } from './invoiceXmlParser';

export interface GdtPortalConfig {
  maSoThue: string;
  tenDangNhap: string;
  matKhau: string;
  trangThaiKetNoi: 'DA_KET_NOI' | 'CHUA_KET_NOI' | 'LOI_DANG_NHAP';
  lanDongBoCuoi?: string;
}

export interface EmailSyncConfig {
  email: string;
  serverImap: string;
  port: number;
  ssl: boolean;
  trangThai: 'HOAT_DONG' | 'NGUNG_HOAT_DONG';
  tuDongQuet: boolean;
  chuKyQuetPhut: number;
  lanQuetCuoi?: string;
}

const STORAGE_KEY_INVOICES = 'vcomm_inbound_invoices';
const STORAGE_KEY_GDT_CONFIG = 'vcomm_gdt_portal_config';
const STORAGE_KEY_EMAIL_CONFIG = 'vcomm_email_sync_config';

export const DEFAULT_GDT_CONFIG: GdtPortalConfig = {
  maSoThue: '0109888888',
  tenDangNhap: '0109888888',
  matKhau: '••••••••••••',
  trangThaiKetNoi: 'DA_KET_NOI',
  lanDongBoCuoi: '24/09/2026 14:15:00'
};

export const DEFAULT_EMAIL_CONFIG: EmailSyncConfig = {
  email: 'hoadon@vcomm.vn',
  serverImap: 'imap.vcomm.vn',
  port: 993,
  ssl: true,
  trangThai: 'HOAT_DONG',
  tuDongQuet: true,
  chuKyQuetPhut: 15,
  lanQuetCuoi: '24/09/2026 14:20:00'
};

// Dữ liệu mẫu XML hóa đơn điện tử thực tế chuẩn QĐ 1450/QĐ-TCT
export const SAMPLE_XML_INVOICES = [
  // Hóa đơn 1: Mua linh kiện điện thoại NCC Tổng kho (Khớp với CT-3 trong sổ)
  `<?xml version="1.0" encoding="UTF-8"?>
<HDon xmlns="http://hoadondientu.gdt.gov.vn/HDDT">
  <DLHDon id="data">
    <TTChung>
      <PBan>2.0.0</PBan>
      <THDon>Hóa đơn giá trị gia tăng</THDon>
      <KHMSHDon>1</KHMSHDon>
      <KHHDon>1C26TBB</KHHDon>
      <SHDon>00000005</SHDon>
      <NLap>2026-03-03</NLap>
      <DVTTe>VND</DVTTe>
      <TGia>1</TGia>
      <HTTToan>TM/CK</HTTToan>
    </TTChung>
    <NBan>
      <Ten>CÔNG TY TNHH PHÂN PHỐI LINH KIỆN CÔNG NGHỆ BẮC NAM</Ten>
      <MST>0107889922</MST>
      <DChi>Số 120 Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội</DChi>
      <SDThoai>02438889999</SDThoai>
    </NBan>
    <NMua>
      <Ten>CÔNG TY CỔ PHẦN TẬP ĐOÀN VCOMM VIỆT NAM</Ten>
      <MST>0109888888</MST>
      <DChi>Tầng 18, Tòa nhà VComm Center, Cầu Giấy, Hà Nội</DChi>
    </NMua>
    <DSHHDVu>
      <HHDVu>
        <STT>1</STT>
        <THHDVu>Phụ kiện cáp sạc nhanh Type-C Pro 65W</THHDVu>
        <DVTinh>Chiếc</DVTinh>
        <SLuong>100</SLuong>
        <DGia>150000</DGia>
        <ThTien>15000000</ThTien>
        <TSuat>10%</TSuat>
        <TThue>1500000</TThue>
      </HHDVu>
    </DSHHDVu>
    <TToan>
      <TgTCThue>15000000</TgTCThue>
      <TgTThue>1500000</TgTThue>
      <TgTTTBSo>16500000</TgTTTBSo>
      <TgTTTBChu>Mười sáu triệu năm trăm nghìn đồng</TgTTTBChu>
    </TToan>
    <TTKhac>
      <MCCQT>T26-00014829101</MCCQT>
    </TTKhac>
  </DLHDon>
  <DSCKS>
    <Signature>VIETTEL-CA-CERT-VALID-0107889922</Signature>
  </DSCKS>
</HDon>`,

  // Hóa đơn 2: Cước dịch vụ Internet cáp quang & Phần mềm ERP Cloud (Chưa hạch toán)
  `<?xml version="1.0" encoding="UTF-8"?>
<HDon xmlns="http://hoadondientu.gdt.gov.vn/HDDT">
  <DLHDon id="data">
    <TTChung>
      <PBan>2.0.0</PBan>
      <THDon>Hóa đơn giá trị gia tăng</THDon>
      <KHMSHDon>1</KHMSHDon>
      <KHHDon>1C26TVT</KHHDon>
      <SHDon>00008892</SHDon>
      <NLap>2026-03-10</NLap>
      <DVTTe>VND</DVTTe>
      <TGia>1</TGia>
      <HTTToan>CK</HTTToan>
    </TTChung>
    <NBan>
      <Ten>TẬP ĐOÀN BƯU CHÍNH VIỄN THÔNG VIỆT NAM (VNPT)</Ten>
      <MST>0100684378</MST>
      <DChi>Số 57 Phố Huỳnh Thúc Kháng, Đống Đa, Hà Nội</DChi>
      <SDThoai>18001166</SDThoai>
    </NBan>
    <NMua>
      <Ten>CÔNG TY CỔ PHẦN TẬP ĐOÀN VCOMM VIỆT NAM</Ten>
      <MST>0109888888</MST>
      <DChi>Tầng 18, Tòa nhà VComm Center, Cầu Giấy, Hà Nội</DChi>
    </NMua>
    <DSHHDVu>
      <HHDVu>
        <STT>1</STT>
        <THHDVu>Cước thuê bao đường truyền Internet cáp quang Fiber V-Corp 500Mbps kỳ 03/2026</THHDVu>
        <DVTinh>Tháng</DVTinh>
        <SLuong>1</SLuong>
        <DGia>4800000</DGia>
        <ThTien>4800000</ThTien>
        <TSuat>10%</TSuat>
        <TThue>480000</TThue>
      </HHDVu>
    </DSHHDVu>
    <TToan>
      <TgTCThue>4800000</TgTCThue>
      <TgTThue>480000</TgTThue>
      <TgTTTBSo>5280000</TgTTTBSo>
      <TgTTTBChu>Năm triệu hai trăm tám mươi nghìn đồng</TgTTTBChu>
    </TToan>
    <TTKhac>
      <MCCQT>T26-00014829102</MCCQT>
    </TTKhac>
  </DLHDon>
  <DSCKS>
    <Signature>VNPT-CA-SIGN-VALID-0100684378</Signature>
  </DSCKS>
</HDon>`,

  // Hóa đơn 3: Mua văn phòng phẩm & Công cụ dụng cụ (Lệch số liệu do chiết khấu)
  `<?xml version="1.0" encoding="UTF-8"?>
<HDon xmlns="http://hoadondientu.gdt.gov.vn/HDDT">
  <DLHDon id="data">
    <TTChung>
      <PBan>2.0.0</PBan>
      <THDon>Hóa đơn giá trị gia tăng</THDon>
      <KHMSHDon>1</KHMSHDon>
      <KHHDon>1C26THP</KHHDon>
      <SHDon>00001429</SHDon>
      <NLap>2026-03-12</NLap>
      <DVTTe>VND</DVTTe>
      <TGia>1</TGia>
      <HTTToan>TM/CK</HTTToan>
    </TTChung>
    <NBan>
      <Ten>CÔNG TY CP VĂN PHÒNG PHẨM HỒNG HÀ</Ten>
      <MST>0100100234</MST>
      <DChi>25 Lý Thường Kiệt, Hoàn Kiếm, Hà Nội</DChi>
    </NBan>
    <NMua>
      <Ten>CÔNG TY CỔ PHẦN TẬP ĐOÀN VCOMM VIỆT NAM</Ten>
      <MST>0109888888</MST>
      <DChi>Tầng 18, Tòa nhà VComm Center, Cầu Giấy, Hà Nội</DChi>
    </NMua>
    <DSHHDVu>
      <HHDVu>
        <STT>1</STT>
        <THHDVu>Giấy in Double A A4 70gsm, Bút ký cao cấp văn phòng</THHDVu>
        <DVTinh>Ram/Hộp</DVTinh>
        <SLuong>50</SLuong>
        <DGia>85000</DGia>
        <ThTien>4250000</ThTien>
        <TSuat>8%</TSuat>
        <TThue>340000</TThue>
      </HHDVu>
    </DSHHDVu>
    <TToan>
      <TgTCThue>4250000</TgTCThue>
      <TgTThue>340000</TgTThue>
      <TgTTTBSo>4590000</TgTTTBSo>
      <TgTTTBChu>Bốn triệu năm trăm chín mươi nghìn đồng</TgTTTBChu>
    </TToan>
    <TTKhac>
      <MCCQT>T26-00014829103</MCCQT>
    </TTKhac>
  </DLHDon>
  <DSCKS>
    <Signature>BKAV-CA-SIGN-VALID-0100100234</Signature>
  </DSCKS>
</HDon>`
];

/**
 * Đọc danh sách hóa đơn đã lưu từ LocalStorage
 */
export function getStoredInboundInvoices(): EInvoiceData[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INVOICES);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Lỗi đọc hóa đơn từ LocalStorage:', e);
  }

  // Khởi tạo từ các hóa đơn mẫu thực tế
  const initial = SAMPLE_XML_INVOICES.map((xml, index) => {
    const src: 'GDT_PORTAL' | 'EMAIL' | 'FILE_UPLOAD' = 
      index === 0 ? 'GDT_PORTAL' : index === 1 ? 'EMAIL' : 'FILE_UPLOAD';
    return parseInvoiceXml(xml, src);
  });
  saveInboundInvoices(initial);
  return initial;
}

/**
 * Lưu danh sách hóa đơn vào LocalStorage
 */
export function saveInboundInvoices(invoices: EInvoiceData[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INVOICES, JSON.stringify(invoices));
  } catch (e) {
    console.error('Lỗi lưu hóa đơn vào LocalStorage:', e);
  }
}

/**
 * Giả lập và thực thi đồng bộ từ Cổng Tổng cục Thuế hoadondientu.gdt.gov.vn
 */
export async function syncInvoicesFromGdtPortal(
  config: GdtPortalConfig,
  fromDate: string,
  toDate: string
): Promise<{ added: number; total: number; invoices: EInvoiceData[] }> {
  // Giả lập trễ mạng gọi API Cổng Thuế
  await new Promise(resolve => setTimeout(resolve, 800));

  const current = getStoredInboundInvoices();
  const existingIds = new Set(current.map(i => i.id));

  // Phân tích hóa đơn từ mẫu
  const portalInvoices = SAMPLE_XML_INVOICES.map(xml => parseInvoiceXml(xml, 'GDT_PORTAL'));
  let addedCount = 0;

  for (const inv of portalInvoices) {
    if (!existingIds.has(inv.id)) {
      current.push(inv);
      existingIds.add(inv.id);
      addedCount++;
    }
  }

  saveInboundInvoices(current);
  return { added: addedCount, total: current.length, invoices: current };
}

/**
 * Giả lập quét Hộp thư Email nhận hóa đơn (ví dụ hoadon@vcomm.vn)
 */
export async function syncInvoicesFromEmail(
  config: EmailSyncConfig
): Promise<{ added: number; scannedEmails: number; invoices: EInvoiceData[] }> {
  await new Promise(resolve => setTimeout(resolve, 600));

  const current = getStoredInboundInvoices();
  const existingIds = new Set(current.map(i => i.id));

  // Giả lập tìm thấy hóa đơn số 2 từ Email
  const emailInvoice = parseInvoiceXml(SAMPLE_XML_INVOICES[1], 'EMAIL');
  let added = 0;

  if (!existingIds.has(emailInvoice.id)) {
    current.push(emailInvoice);
    added++;
  }

  saveInboundInvoices(current);
  return { added, scannedEmails: 12, invoices: current };
}
