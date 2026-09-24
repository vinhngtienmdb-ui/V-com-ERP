import * as XLSX from 'xlsx';

/**
 * Tạo binary ArrayBuffer cho file Excel mẫu chuẩn kế toán gồm nhiều sheet
 */
export function generateSampleExcelBuffer(title: string = 'Báo Cáo Tài Chính & Bảng Kê'): ArrayBuffer {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Bảng cân đối phát sinh
  const ws1Data = [
    ['CÔNG TY CỔ PHẦN THƯƠNG MẠI DỊCH VỤ VCOMM', '', '', '', ''],
    ['BẢNG TỔNG HỢP CÂN ĐỐI PHÁT SINH TÀI KHOẢN (TT 99/2025/TT-BTC)', '', '', '', ''],
    ['Kỳ kế toán: Quý 3/2026 - Đơn vị tính: VNĐ', '', '', '', ''],
    [''],
    ['Mã TK', 'Tên Tài Khoản', 'Dư đầu kỳ (Nợ)', 'Phát sinh (Nợ)', 'Phát sinh (Có)', 'Dư cuối kỳ (Nợ)'],
    ['1111', 'Tiền mặt Việt Nam đồng', 150000000, 420000000, 310000000, 260000000],
    ['1121', 'Tiền gửi ngân hàng Vietcombank', 1250000000, 8900000000, 7200000000, 2950000000],
    ['131', 'Phải thu của khách hàng (CRM Deals)', 480000000, 1560000000, 1400000000, 640000000],
    ['1561', 'Hàng hóa kho tổng VComm FBL', 3200000000, 5400000000, 4800000000, 3800000000],
    ['331', 'Phải trả người bán (Suppliers)', 0, 3200000000, 3900000000, 700000000],
    ['33311', 'Thuế GTGT đầu ra phải nộp', 0, 540000000, 680000000, 140000000],
    ['5111', 'Doanh thu bán hàng hóa POS/O2O', 0, 0, 6800000000, 6800000000],
    ['641', 'Chi phí bán hàng & Logistics', 0, 480000000, 0, 480000000],
    ['642', 'Chi phí quản lý doanh nghiệp', 0, 350000000, 0, 350000000],
    ['TỔNG CỘNG', 'Tổng số dư và phát sinh cân đối', 5080000000, 20490000000, 20490000000, 8320000000]
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'Tổng Hợp Cân Đối');

  // Sheet 2: Danh sách chi tiết công nợ đối tác
  const ws2Data = [
    ['DANH SÁCH THEO DÕI CÔNG NỢ ĐỐI TÁC & NHÀ CUNG CẤP', '', '', '', ''],
    ['Ngày lập: 24/09/2026', '', '', '', ''],
    [''],
    ['Mã ĐT', 'Tên Đối Tác / Khách Hàng', 'Hạn mức tín dụng', 'Dư nợ thực tế', 'Trạng thái', 'Hạn thanh toán'],
    ['KH-001', 'Tập đoàn TH True Milk', 500000000, 156600000, 'Trong hạn', '16/10/2026'],
    ['KH-002', 'Vinpearl Nha Trang Resort', 800000000, 291600000, 'Trong hạn', '20/10/2026'],
    ['KH-003', 'Tập đoàn Kangaroo Việt Nam', 300000000, 129600000, 'Chờ đối soát', '31/12/2026'],
    ['NCC-01', 'Công ty Cổ phần MDB Service', 1000000000, 450000000, 'Đã xác nhận', '05/10/2026'],
    ['NCC-02', 'Đơn vị Vận chuyển GHN Logistics', 200000000, 85000000, 'Trong hạn', '15/10/2026']
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'Chi Tiết Công Nợ');

  // Sheet 3: Bảng kê hóa đơn chứng từ
  const ws3Data = [
    ['BẢNG KÊ HÓA ĐƠN CHỨNG TỪ ĐÍNH KÈM THÁNG 09/2026', '', '', '', ''],
    [''],
    ['STT', 'Ký hiệu HĐ', 'Số hóa đơn', 'Ngày lập', 'Tổng tiền trước thuế', 'Thuế GTGT', 'Tổng tiền thanh toán'],
    [1, '1C26TBB', '00001234', '15/09/2026', 150000000, 12000000, 162000000],
    [2, '1C26TBB', '00001235', '16/09/2026', 85000000, 6800000, 91800000],
    [3, '2C26TMM', '00004567', '18/09/2026', 45000000, 3600000, 48600000],
    [4, '1C26TBB', '00001236', '20/09/2026', 220000000, 17600000, 237600000]
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(ws3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'Bảng Kê Hóa Đơn');

  const excelOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return excelOut;
}

/**
 * XML mẫu hóa đơn điện tử Thông tư 78/2021/TT-BTC
 */
export const SAMPLE_EINVOICE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<HDon>
  <DLHDon Id="HD00001234">
    <TTChung>
      <PBan>2.0.0</PBan>
      <THDon>Hóa đơn giá trị gia tăng</THDon>
      <KHMSHDon>1</KHMSHDon>
      <KHHDon>C26TBB</KHHDon>
      <SHDon>00001234</SHDon>
      <NLap>2026-09-20</NLap>
      <DVTTe>VND</DVTTe>
      <TGia>1</TGia>
      <HTTToan>Chuyển khoản</HTTToan>
      <MSTTCGP>0101234567-999</MSTTCGP>
    </TTChung>
    <NDHDon>
      <NBan>
        <Ten>CÔNG TY CỔ PHẦN THƯƠNG MẠI DỊCH VỤ VCOMM</Ten>
        <MST>0108999888</MST>
        <DChi>Tầng 12, Tòa nhà VComm Center, Cầu Giấy, Hà Nội</DChi>
        <SDThoai>1900 6868</SDThoai>
        <DCTDTu>contact@vcomm.vn</DCTDTu>
        <STKNHang>19036888888019 tại Techcombank CN Hà Nội</STKNHang>
      </NBan>
      <NMua>
        <Ten>TẬP ĐOÀN TH TRUE MILK - CHI NHÁNH MIỀN BẮC</Ten>
        <MST>0102345678</MST>
        <DChi>Số 9 Đào Tấn, Ba Đình, TP. Hà Nội</DChi>
        <MKHang>KH-TH-01</MKHang>
      </NMua>
      <DSHHDVu>
        <HHDVu>
          <STT>1</STT>
          <THHDVu>Máy POS cảm ứng VComm SmartTouch Pro</THHDVu>
          <DVTinh>Bộ</DVTinh>
          <SLuong>50</SLuong>
          <DGia>2500000</DGia>
          <Tien>125000000</Tien>
          <TSuat>8%</TSuat>
        </HHDVu>
        <HHDVu>
          <STT>2</STT>
          <THHDVu>Gói phần mềm thanh toán Napas 247 &amp; E-Menu (12 tháng)</THHDVu>
          <DVTinh>Gói</DVTinh>
          <SLuong>1</SLuong>
          <DGia>25000000</DGia>
          <Tien>25000000</Tien>
          <TSuat>8%</TSuat>
        </HHDVu>
      </DSHHDVu>
      <TToan>
        <TgTCThue>150000000</TgTCThue>
        <TgTThue>12000000</TgTThue>
        <TgTTTBSo>162000000</TgTTTBSo>
        <TgTTTBChu>Một trăm sáu mươi hai triệu đồng chẵn</TgTTTBChu>
      </TToan>
    </NDHDon>
    <TTKhac>
      <ThongTin>
        <TTruong>ChungTuLienQuan</TTruong>
        <KDLieu>string</KDLieu>
        <DLieu>BG-2026-001 / HDMB-001</DLieu>
      </ThongTin>
    </TTKhac>
  </DLHDon>
  <DSCKS>
    <NBan>
      <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
        <SignedInfo>
          <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315" />
          <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256" />
        </SignedInfo>
        <SignatureValue>MEQCIDvCommSignedHashValidByCloudHSMFIPS140_2Level3CertAuthorityViettelCA==</SignatureValue>
        <KeyInfo>
          <X509Data>
            <X509SubjectName>CN=CÔNG TY CỔ PHẦN THƯƠNG MẠI DỊCH VỤ VCOMM, OID.0.9.2342.19200300.100.1.1=MST:0108999888</X509SubjectName>
          </X509Data>
        </KeyInfo>
      </Signature>
    </NBan>
  </DSCKS>
</HDon>`;

/**
 * Nội dung mẫu văn bản hợp đồng / công văn phục vụ xem trước
 */
export const SAMPLE_CONTRACT_DOC = {
  title: 'HỢP ĐỒNG CUNG CẤP THIẾT BỊ VÀ GIẢI PHÁP CHUYỂN ĐỔI SỐ O2O',
  code: 'HĐMB-2026/VCOMM-TH',
  date: '20 tháng 09 năm 2026',
  parties: [
    {
      role: 'BÊN A (BÊN BÁN / CUNG CẤP DỊCH VỤ)',
      name: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI DỊCH VỤ VCOMM',
      rep: 'Ông Nguyễn Văn A - Chức vụ: Tổng Giám Đốc',
      tax: '0108999888',
      addr: 'Tầng 12, Tòa nhà VComm Center, Q. Cầu Giấy, TP. Hà Nội'
    },
    {
      role: 'BÊN B (BÊN MUA / KHÁCH HÀNG)',
      name: 'TẬP ĐOÀN TH TRUE MILK',
      rep: 'Bà Phạm Thu Hương - Chức vụ: Giám đốc Chuỗi Cung Ứng',
      tax: '0102345678',
      addr: 'Số 9 Đào Tấn, P. Ngọc Khánh, Q. Ba Đình, TP. Hà Nội'
    }
  ],
  sections: [
    {
      heading: 'ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG',
      content: 'Bên A đồng ý cung ứng và bàn giao cho Bên B gói giải pháp hệ thống thiết bị phần cứng VComm SmartTouch Pro và bản quyền phần mềm quản lý bán hàng đa kênh, kết nối thanh toán tự động Napas 247 theo Báo giá số BG-2026-001.'
    },
    {
      heading: 'ĐIỀU 2: GIÁ TRỊ HỢP ĐỒNG VÀ PHƯƠNG THỨC THANH TOÁN',
      content: 'Tổng giá trị hợp đồng trước thuế: 150.000.000 VNĐ. Thuế GTGT (8%): 12.000.000 VNĐ. Tổng giá trị thanh toán đã bao gồm thuế: 162.000.000 VNĐ (Bằng chữ: Một trăm sáu mươi hai triệu đồng chẵn). Thanh toán bằng hình thức chuyển khoản vào tài khoản ngân hàng của Bên A.'
    },
    {
      heading: 'ĐIỀU 3: BẢO HÀNH VÀ CAM KẾT DỊCH VỤ (SLA)',
      content: 'Bên A cam kết hỗ trợ kỹ thuật 24/7, tỷ lệ sẵn sàng của hệ thống đạt 99.9%. Thiết bị phần cứng bảo hành 1 đổi 1 trong vòng 24 tháng kể từ ngày ký biên bản nghiệm thu bàn giao.'
    },
    {
      heading: 'ĐIỀU 4: HIỆU LỰC HỢP ĐỒNG VÀ CHỮ KÝ ĐIỆN TỬ',
      content: 'Hợp đồng này được lập thành văn bản điện tử có giá trị pháp lý tương đương văn bản giấy theo Luật Giao dịch Điện tử số 20/2023/QH15. Các bên thực hiện ký số thông qua chứng chỉ số an toàn HSM tiêu chuẩn FIPS 140-2 Level 3.'
    }
  ]
};
