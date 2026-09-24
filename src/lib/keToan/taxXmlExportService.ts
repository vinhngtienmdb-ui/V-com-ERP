/**
 * DỊCH VỤ XUẤT BÁO CÁO TÀI CHÍNH VÀ SỔ KẾ TOÁN SANG ĐỊNH DẠNG XML CHUẨN TỔNG CỤC THUẾ
 * Tương thích hệ thống Khai thuế qua mạng (thuedientu.gdt.gov.vn / iHTKK / eTax)
 * và ứng dụng đọc tờ khai chuẩn iTaxViewer.
 * 
 * Căn cứ kỹ thuật:
 * - Kiến trúc hồ sơ thuế điện tử HSoThueDTu theo Thông tư 80/2021/TT-BTC & Thông tư 99/2025/TT-BTC
 * - Bộ mã tờ khai BCTC doanh nghiệp
 */

import { formatDateVN } from './dateUtils';
import { ThietLapCongTy } from '../../components/accounting/ThietLapCongTyModal';

export interface TaxXmlExportOptions {
  reportType: 'ALL_BCTC' | 'F01' | 'S03' | 'S04' | 'B01' | 'B02';
  companyInfo?: Partial<ThietLapCongTy>;
  fromDate: string; // YYYY-MM-DD
  toDate: string;   // YYYY-MM-DD
  selectedAccount?: string;
  trialBalance?: any;
  nhatKyChung?: any;
  soCai?: any;
  b01?: any;
  b02?: any;
  loaiKy?: 'Y' | 'Q' | 'M'; // Năm, Quý, Tháng
  kyKhaiThue?: string;      // ví dụ: "2026", "Q1/2026", "03/2026"
}

/**
 * Thoát các ký tự đặc biệt trong XML để tránh lỗi cú pháp XSD
 */
export function escapeXml(unsafe: string | number | undefined | null): string {
  if (unsafe === undefined || unsafe === null) return '';
  const str = String(unsafe);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Sinh tên tệp XML chuẩn Tổng cục Thuế (không dấu tiếng Việt, không khoảng trắng)
 */
export function generateTaxXmlFileName(
  mst: string,
  ky: string,
  reportType: 'ALL_BCTC' | 'F01' | 'S03' | 'S04' | 'B01' | 'B02'
): string {
  const cleanMst = mst.replace(/[^a-zA-Z0-9]/g, '') || '0109888888';
  const cleanKy = ky.replace(/[^a-zA-Z0-9]/g, '_') || '2026';
  
  if (reportType === 'ALL_BCTC') {
    return `BCTC_${cleanMst}_${cleanKy}_TT99.xml`;
  }
  return `BCTC_${reportType}_${cleanMst}_${cleanKy}.xml`;
}

/**
 * Xây dựng toàn bộ tài liệu XML chuẩn HSoThueDTu của Tổng cục Thuế
 */
export function buildTaxXmlDocument(options: TaxXmlExportOptions): string {
  const {
    reportType,
    companyInfo,
    fromDate,
    toDate,
    selectedAccount = '112',
    trialBalance,
    nhatKyChung,
    soCai,
    b01,
    b02,
    loaiKy = 'Y',
    kyKhaiThue
  } = options;

  const today = new Date();
  const ngayHienTaiStr = formatDateVN(today.toISOString().split('T')[0]);
  const namBaoCao = toDate ? toDate.substring(0, 4) : '2026';
  const displayKy = kyKhaiThue || namBaoCao;

  const tenCongTy = companyInfo?.tenCongTy || 'CÔNG TY CỔ PHẦN TẬP ĐOÀN VCOMM VIỆT NAM';
  const mst = companyInfo?.maSoThue || '0109888888';
  const diaChi = companyInfo?.diaChi || 'Tầng 18, Tòa nhà VComm Center, Cầu Giấy, Hà Nội';
  const cqt = companyInfo?.coQuanThue || 'Cục Thuế TP. Hà Nội';
  const nguoiKy = companyInfo?.nguoiDaiDien || 'Nguyễn Tiến Vinh';
  const keToanTruong = companyInfo?.keToanTruong || 'Trần Thị Thu Hương';

  // Xác định mã và tên tờ khai
  let maTKhai = '104'; // Mặc định mã BCTC
  let tenTKhai = 'BÁO CÁO TÀI CHÍNH';
  let moTaBMau = 'Thông tư số 99/2025/TT-BTC của Bộ Tài chính áp dụng từ 01/01/2026';

  if (reportType === 'B01') {
    maTKhai = 'B01-DN';
    tenTKhai = 'BÁO CÁO TÌNH HÌNH TÀI CHÍNH (B01-DN)';
  } else if (reportType === 'B02') {
    maTKhai = 'B02-DN';
    tenTKhai = 'BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH (B02-DN)';
  } else if (reportType === 'F01') {
    maTKhai = 'F01-DN';
    tenTKhai = 'BẢNG CÂN ĐỐI SỐ PHÁT SINH TÀI KHOẢN (F01-DN)';
  } else if (reportType === 'S03') {
    maTKhai = 'S03-DN';
    tenTKhai = 'SỔ NHẬT KÝ CHUNG (S03-DN)';
  } else if (reportType === 'S04') {
    maTKhai = `S04-DN_${selectedAccount}`;
    tenTKhai = `SỔ CÁI TÀI KHOẢN ${selectedAccount} (S04-DN)`;
  } else {
    maTKhai = 'BCTC_TT99';
    tenTKhai = 'BỘ BÁO CÁO TÀI CHÍNH ĐẦY ĐỦ (TT99/2025/TT-BTC)';
  }

  // XML Header & Root
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<HSoThueDTu xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://kekhaithue.gdt.gov.vn/TKhaiThue">
  <HSoKhaiThue id="HSoKhaiThue_${Date.now()}">
    <TTinChung>
      <TTinDVu>
        <maDVu>VCOMM_ERP</maDVu>
        <tenDVu>Hệ thống Quản trị Kế toán Doanh nghiệp VComm ERP</tenDVu>
        <pbanDVu>2026.1.0</pbanDVu>
        <ttinNhaCCapDVu>CÔNG TY CỔ PHẦN TẬP ĐOÀN VCOMM VIỆT NAM</ttinNhaCCapDVu>
      </TTinDVu>
      <TTinTKhaiThue>
        <TKhaiThue>
          <maTKhai>${escapeXml(maTKhai)}</maTKhai>
          <tenTKhai>${escapeXml(tenTKhai)}</tenTKhai>
          <moTaBMau>${escapeXml(moTaBMau)}</moTaBMau>
          <pbanTKhaiXML>2.1.0</pbanTKhaiXML>
          <loaiTKhai>C</loaiTKhai>
          <soLan>0</soLan>
          <KyKKhaiThue>
            <kieuKy>${escapeXml(loaiKy)}</kieuKy>
            <kyKKhai>${escapeXml(displayKy)}</kyKKhai>
            <kyKKhaiTuNgay>${escapeXml(formatDateVN(fromDate))}</kyKKhaiTuNgay>
            <kyKKhaiDenNgay>${escapeXml(formatDateVN(toDate))}</kyKKhaiDenNgay>
            <ngayLapTKhai>${escapeXml(ngayHienTaiStr)}</ngayLapTKhai>
          </KyKKhaiThue>
          <maCQTNoiNop>0100</maCQTNoiNop>
          <tenCQTNoiNop>${escapeXml(cqt)}</tenCQTNoiNop>
          <ngayKy>${escapeXml(ngayHienTaiStr)}</ngayKy>
          <nguoiKy>${escapeXml(nguoiKy)}</nguoiKy>
          <keToanTruong>${escapeXml(keToanTruong)}</keToanTruong>
        </TKhaiThue>
        <NNT>
          <mst>${escapeXml(mst)}</mst>
          <tenNNT>${escapeXml(tenCongTy)}</tenNNT>
          <dchiNNT>${escapeXml(diaChi)}</dchiNNT>
          <dthoai>024 3999 8888</dthoai>
          <email>taichinh@vcomm.vn</email>
          <nganhNgheKD>Thương mại điện tử, Bán lẻ công nghệ cao và Dịch vụ số</nganhNgheKD>
        </NNT>
      </TTinTKhaiThue>
    </TTinChung>
    <CTietTKhaiThue>
      <BaoCaoTaiChinh>`;

  // 1. Phân hệ B01-DN (Bảng Tình hình tài chính)
  if ((reportType === 'ALL_BCTC' || reportType === 'B01') && b01) {
    xml += `
        <BangTinhHinhTaiChinh mauSo="B01-DN">
          <TieuDe>BÁO CÁO TÌNH HÌNH TÀI CHÍNH</TieuDe>
          <TaiNgay>${escapeXml(formatDateVN(toDate))}</TaiNgay>
          <DonViTinh>VND</DonViTinh>
          <TongTaiSan>${escapeXml(b01.tongTaiSan || 0)}</TongTaiSan>
          <TongNguonVon>${escapeXml(b01.tongNguonVon || 0)}</TongNguonVon>
          <CanDoi>${b01.canDoi ? 'true' : 'false'}</CanDoi>
          <DanhSachChiTieu>`;

    const chiTietB01 = b01.danhSachChiTieu || [
      ...(b01.taiSan?.chiTiet || []),
      ...(b01.nguonVon?.chiTiet || [])
    ];

    chiTietB01.forEach((ct: any) => {
      xml += `
            <ChiTieu>
              <maSo>${escapeXml(ct.maSo)}</maSo>
              <tenChiTieu>${escapeXml(ct.tenChiTieu || ct.chiTieu)}</tenChiTieu>
              <thuyetMinh>${escapeXml(ct.thuyetMinh || '')}</thuyetMinh>
              <soDauNam>${escapeXml(ct.soDauKy !== undefined ? ct.soDauKy : (ct.soDauNam || 0))}</soDauNam>
              <soCuoiKy>${escapeXml(ct.soCuoiKy || 0)}</soCuoiKy>
              <isHeader>${ct.isHeader ? 'true' : 'false'}</isHeader>
            </ChiTieu>`;
    });

    xml += `
          </DanhSachChiTieu>
        </BangTinhHinhTaiChinh>`;
  }

  // 2. Phân hệ B02-DN (Báo cáo Kết quả hoạt động kinh doanh)
  if ((reportType === 'ALL_BCTC' || reportType === 'B02') && b02) {
    xml += `
        <BangKetQuaKD mauSo="B02-DN">
          <TieuDe>BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH</TieuDe>
          <TuNgay>${escapeXml(formatDateVN(fromDate))}</TuNgay>
          <DenNgay>${escapeXml(formatDateVN(toDate))}</DenNgay>
          <DonViTinh>VND</DonViTinh>
          <DoanhThuThuan>${escapeXml(b02.doanhThuThuan || 0)}</DoanhThuThuan>
          <LoiNhuanGop>${escapeXml(b02.loiNhuanGop || 0)}</LoiNhuanGop>
          <LoiNhuanThuan>${escapeXml(b02.loiNhuanThuan || 0)}</LoiNhuanThuan>
          <LoiNhuanTruocThue>${escapeXml(b02.loiNhuanTruocThue || 0)}</LoiNhuanTruocThue>
          <LoiNhuanSauThue>${escapeXml(b02.loiNhuanSauThue || 0)}</LoiNhuanSauThue>
          <DanhSachChiTieu>`;

    const chiTietB02 = b02.danhSachChiTieu || b02.chiTiet || [];

    chiTietB02.forEach((ct: any) => {
      xml += `
            <ChiTieu>
              <maSo>${escapeXml(ct.maSo)}</maSo>
              <tenChiTieu>${escapeXml(ct.tenChiTieu || ct.chiTieu)}</tenChiTieu>
              <thuyetMinh>${escapeXml(ct.thuyetMinh || '')}</thuyetMinh>
              <kyNay>${escapeXml(ct.kyNay || 0)}</kyNay>
              <kyTruoc>${escapeXml(ct.kyTruoc || 0)}</kyTruoc>
              <isHeader>${ct.isHeader ? 'true' : 'false'}</isHeader>
            </ChiTieu>`;
    });

    xml += `
          </DanhSachChiTieu>
        </BangKetQuaKD>`;
  }

  // 3. Phân hệ F01-DN (Bảng cân đối số phát sinh tài khoản)
  if ((reportType === 'ALL_BCTC' || reportType === 'F01') && trialBalance) {
    xml += `
        <BangCanDoiSoPhatSinh mauSo="F01-DN">
          <TieuDe>BẢNG CÂN ĐỐI SỐ PHÁT SINH TÀI KHOẢN</TieuDe>
          <TuNgay>${escapeXml(formatDateVN(fromDate))}</TuNgay>
          <DenNgay>${escapeXml(formatDateVN(toDate))}</DenNgay>
          <DonViTinh>VND</DonViTinh>
          <TongDuNoDauKy>${escapeXml(trialBalance.tongDuNoDauKy || 0)}</TongDuNoDauKy>
          <TongDuCoDauKy>${escapeXml(trialBalance.tongDuCoDauKy || 0)}</TongDuCoDauKy>
          <TongPhatSinhNo>${escapeXml(trialBalance.tongPhatSinhNo || 0)}</TongPhatSinhNo>
          <TongPhatSinhCo>${escapeXml(trialBalance.tongPhatSinhCo || 0)}</TongPhatSinhCo>
          <TongDuNoCuoiKy>${escapeXml(trialBalance.tongDuNoCuoiKy || 0)}</TongDuNoCuoiKy>
          <TongDuCoCuoiKy>${escapeXml(trialBalance.tongDuCoCuoiKy || 0)}</TongDuCoCuoiKy>
          <CanDoiDauKy>${trialBalance.canDoiDauKy ? 'true' : 'false'}</CanDoiDauKy>
          <CanDoiPhatSinh>${trialBalance.canDoiPhatSinh ? 'true' : 'false'}</CanDoiPhatSinh>
          <CanDoiCuoiKy>${trialBalance.canDoiCuoiKy ? 'true' : 'false'}</CanDoiCuoiKy>
          <DanhSachTaiKhoan>`;

    const danhSachTk = trialBalance.danhSachTk || trialBalance.chiTiet || [];

    danhSachTk.forEach((tk: any) => {
      xml += `
            <TaiKhoan>
              <maTK>${escapeXml(tk.maTk)}</maTK>
              <tenTK>${escapeXml(tk.tenTk)}</tenTK>
              <duNoDauKy>${escapeXml(tk.duNoDauKy || 0)}</duNoDauKy>
              <duCoDauKy>${escapeXml(tk.duCoDauKy || 0)}</duCoDauKy>
              <phatSinhNo>${escapeXml(tk.phatSinhNo || 0)}</phatSinhNo>
              <phatSinhCo>${escapeXml(tk.phatSinhCo || 0)}</phatSinhCo>
              <duNoCuoiKy>${escapeXml(tk.duNoCuoiKy || 0)}</duNoCuoiKy>
              <duCoCuoiKy>${escapeXml(tk.duCoCuoiKy || 0)}</duCoCuoiKy>
            </TaiKhoan>`;
    });

    xml += `
          </DanhSachTaiKhoan>
        </BangCanDoiSoPhatSinh>`;
  }

  // 4. Phân hệ S03-DN (Sổ Nhật ký chung)
  if (reportType === 'S03' && nhatKyChung) {
    xml += `
        <SoNhatKyChung mauSo="S03-DN">
          <TieuDe>SỔ NHẬT KÝ CHUNG</TieuDe>
          <TuNgay>${escapeXml(formatDateVN(fromDate))}</TuNgay>
          <DenNgay>${escapeXml(formatDateVN(toDate))}</DenNgay>
          <DonViTinh>VND</DonViTinh>
          <TongPhatSinhNo>${escapeXml(nhatKyChung.tongPhatSinhNo || 0)}</TongPhatSinhNo>
          <TongPhatSinhCo>${escapeXml(nhatKyChung.tongPhatSinhCo || 0)}</TongPhatSinhCo>
          <DanhSachDongSo>`;

    (nhatKyChung.danhSachDong || []).forEach((d: any) => {
      xml += `
            <DongSo>
              <stt>${escapeXml(d.stt)}</stt>
              <ngayGhiSo>${escapeXml(formatDateVN(d.ngayGhiSo))}</ngayGhiSo>
              <soChungTu>${escapeXml(d.soChungTu)}</soChungTu>
              <ngayChungTu>${escapeXml(formatDateVN(d.ngayChungTu))}</ngayChungTu>
              <dienGiai>${escapeXml(d.dienGiai)}</dienGiai>
              <tkDoiUng>${escapeXml(d.tkDoiUng)}</tkDoiUng>
              <soPhatSinhNo>${escapeXml(d.soPhatSinhNo || 0)}</soPhatSinhNo>
              <soPhatSinhCo>${escapeXml(d.soPhatSinhCo || 0)}</soPhatSinhCo>
            </DongSo>`;
    });

    xml += `
          </DanhSachDongSo>
        </SoNhatKyChung>`;
  }

  // 5. Phân hệ S04-DN (Sổ Cái tài khoản)
  if (reportType === 'S04' && soCai) {
    xml += `
        <SoCai mauSo="S04-DN" taiKhoan="${escapeXml(selectedAccount)}">
          <TieuDe>SỔ CÁI TÀI KHOẢN ${escapeXml(selectedAccount)}</TieuDe>
          <TuNgay>${escapeXml(formatDateVN(fromDate))}</TuNgay>
          <DenNgay>${escapeXml(formatDateVN(toDate))}</DenNgay>
          <DonViTinh>VND</DonViTinh>
          <SoDuDauKy>${escapeXml(soCai.soDuDauKy || 0)}</SoDuDauKy>
          <TongPhatSinhNo>${escapeXml(soCai.tongPhatSinhNo || 0)}</TongPhatSinhNo>
          <TongPhatSinhCo>${escapeXml(soCai.tongPhatSinhCo || 0)}</TongPhatSinhCo>
          <SoDuCuoiKy>${escapeXml(soCai.soDuCuoiKy || 0)}</SoDuCuoiKy>
          <DanhSachDongSo>`;

    (soCai.danhSachDong || []).forEach((d: any) => {
      xml += `
            <DongSo>
              <ngayGhiSo>${escapeXml(formatDateVN(d.ngayGhiSo))}</ngayGhiSo>
              <soChungTu>${escapeXml(d.soChungTu)}</soChungTu>
              <ngayChungTu>${escapeXml(formatDateVN(d.ngayChungTu))}</ngayChungTu>
              <dienGiai>${escapeXml(d.dienGiai)}</dienGiai>
              <tkDoiUng>${escapeXml(d.tkDoiUng)}</tkDoiUng>
              <soPhatSinhNo>${escapeXml(d.soPhatSinhNo || 0)}</soPhatSinhNo>
              <soPhatSinhCo>${escapeXml(d.soPhatSinhCo || 0)}</soPhatSinhCo>
              <soDu>${escapeXml(d.soDu || 0)}</soDu>
            </DongSo>`;
    });

    xml += `
          </DanhSachDongSo>
        </SoCai>`;
  }

  xml += `
      </BaoCaoTaiChinh>
    </CTietTKhaiThue>
  </HSoKhaiThue>
</HSoThueDTu>`;

  return xml;
}

/**
 * Kiểm tra tính hợp lệ cú pháp của tài liệu XML (Well-formed check & schema check)
 */
export function validateTaxXmlContent(xmlString: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!xmlString || typeof xmlString !== 'string') {
    return { isValid: false, errors: ['Nội dung XML trống hoặc không hợp lệ'] };
  }

  // 1. Kiểm tra các thẻ gốc bắt buộc
  if (!xmlString.includes('<HSoThueDTu')) {
    errors.push('Thiếu thẻ gốc <HSoThueDTu> theo quy chuẩn Tổng cục Thuế.');
  }
  if (!xmlString.includes('<HSoKhaiThue')) {
    errors.push('Thiếu thẻ phân cấp <HSoKhaiThue>.');
  }
  if (!xmlString.includes('<TTinChung>')) {
    errors.push('Thiếu cụm thông tin chung <TTinChung>.');
  }
  if (!xmlString.includes('<mst>')) {
    errors.push('Thiếu mã số thuế người nộp thuế <mst>.');
  }
  if (!xmlString.includes('<tenNNT>')) {
    errors.push('Thiếu tên người nộp thuế <tenNNT>.');
  }
  if (!xmlString.includes('<pbanTKhaiXML>')) {
    errors.push('Thiếu phiên bản định dạng XML <pbanTKhaiXML>.');
  }

  // 2. Thử parse bằng DOMParser nếu đang ở môi trường trình duyệt
  if (typeof window !== 'undefined' && window.DOMParser) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'application/xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        errors.push(`Lỗi cú pháp XML parser: ${parserError.textContent?.slice(0, 150)}`);
      }
    } catch (err: any) {
      errors.push(`Ngoại lệ khi phân tích XML: ${err.message}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Tải file XML xuống máy tính người dùng chuẩn mã hóa UTF-8 (không có BOM)
 */
export function exportTaxXmlFile(xmlString: string, fileName: string): boolean {
  try {
    const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Lỗi kết xuất tệp XML:', error);
    return false;
  }
}
