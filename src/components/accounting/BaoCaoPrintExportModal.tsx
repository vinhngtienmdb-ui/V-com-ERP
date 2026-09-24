import React, { useRef } from 'react';
import { Printer, Download, FileText, FileSpreadsheet, X, Eye, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency, cn } from '../../lib/utils';
import { formatDateVN } from '../../lib/keToan/dateUtils';
import { ThietLapCongTy } from './ThietLapCongTyModal';

interface BaoCaoPrintExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: 'F01' | 'S03' | 'S04' | 'B01' | 'B02';
  fromDate: string;
  toDate: string;
  selectedAccount?: string;
  trialBalance: any;
  nhatKyChung: any;
  soCai: any;
  b01: any;
  b02: any;
  companyInfo?: ThietLapCongTy;
}

export const BaoCaoPrintExportModal: React.FC<BaoCaoPrintExportModalProps> = ({
  isOpen,
  onClose,
  reportType,
  fromDate,
  toDate,
  selectedAccount = '112',
  trialBalance,
  nhatKyChung,
  soCai,
  b01,
  b02,
  companyInfo
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const defaultCompany: ThietLapCongTy = companyInfo || {
    tenCongTy: 'CÔNG TY CỔ PHẦN TẬP ĐOÀN VCOMM VIỆT NAM',
    maSoThue: '0109888888',
    coQuanThue: 'Cục Thuế TP. Hà Nội',
    diaChi: 'Tầng 18, Tòa nhà VComm Center, Cầu Giấy, Hà Nội',
    nguoiDaiDien: 'Nguyễn Tiến Vinh',
    keToanTruong: 'Trần Thị Thu Hương',
    thongTuApDung: 'TT99_2025',
    namTaiChinh: 2026,
    kyKeToan: 'THANG',
    phuongPhapKk: 'KKTX',
    linhVucKinhDoanh: ['E_COMMERCE', 'RETAIL', 'SERVICE']
  };

  const getReportMeta = () => {
    switch (reportType) {
      case 'F01':
        return {
          code: 'Mẫu số F01-DN',
          title: 'BẢNG CÂN ĐỐI SỐ PHÁT SINH TÀI KHOẢN',
          sub: `Từ ngày ${formatDateVN(fromDate)} đến ngày ${formatDateVN(toDate)}`,
          fileBaseName: `BangCanDoiSoPhatSinh_F01_${fromDate}_${toDate}`
        };
      case 'S03':
        return {
          code: 'Mẫu số S03-DN',
          title: 'SỔ NHẬT KÝ CHUNG',
          sub: `Từ ngày ${formatDateVN(fromDate)} đến ngày ${formatDateVN(toDate)}`,
          fileBaseName: `SoNhatKyChung_S03_${fromDate}_${toDate}`
        };
      case 'S04':
        return {
          code: 'Mẫu số S04-DN',
          title: `SỔ CÁI TÀI KHOẢN ${selectedAccount}`,
          sub: `Từ ngày ${formatDateVN(fromDate)} đến ngày ${formatDateVN(toDate)}`,
          fileBaseName: `SoCai_TK${selectedAccount}_S04_${fromDate}_${toDate}`
        };
      case 'B01':
        return {
          code: 'Mẫu số B01-DN',
          title: 'BÁO CÁO TÌNH HÌNH TÀI CHÍNH',
          sub: `Tại ngày ${formatDateVN(toDate)}`,
          fileBaseName: `BaoCaoTinhHinhTaiChinh_B01_${toDate}`
        };
      case 'B02':
        return {
          code: 'Mẫu số B02-DN',
          title: 'BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH',
          sub: `Kỳ từ ngày ${formatDateVN(fromDate)} đến ngày ${formatDateVN(toDate)}`,
          fileBaseName: `BaoCaoKetQuaKinhDoanh_B02_${fromDate}_${toDate}`
        };
      default:
        return {
          code: 'TT99-BTC',
          title: 'BÁO CÁO TÀI CHÍNH TT99',
          sub: '',
          fileBaseName: 'BaoCaoTaiChinh'
        };
    }
  };

  const meta = getReportMeta();

  // In trực tiếp
  const handlePrint = () => {
    window.print();
  };

  // Xuất Excel
  const handleExportExcel = () => {
    let rows: any[] = [];

    if (reportType === 'F01') {
      rows = trialBalance.chiTiet.map((item: any) => ({
        'Mã TK': item.maTk,
        'Tên tài khoản': item.tenTk,
        'Dư Nợ đầu kỳ': item.duNoDauKy,
        'Dư Có đầu kỳ': item.duCoDauKy,
        'Phát sinh Nợ': item.phatSinhNo,
        'Phát sinh Có': item.phatSinhCo,
        'Dư Nợ cuối kỳ': item.duNoCuoiKy,
        'Dư Có cuối kỳ': item.duCoCuoiKy
      }));
      rows.push({
        'Mã TK': 'TỔNG CỘNG',
        'Tên tài khoản': '',
        'Dư Nợ đầu kỳ': trialBalance.tongDuNoDauKy,
        'Dư Có đầu kỳ': trialBalance.tongDuCoDauKy,
        'Phát sinh Nợ': trialBalance.tongPhatSinhNo,
        'Phát sinh Có': trialBalance.tongPhatSinhCo,
        'Dư Nợ cuối kỳ': trialBalance.tongDuNoCuoiKy,
        'Dư Có cuối kỳ': trialBalance.tongDuCoCuoiKy
      });
    } else if (reportType === 'S03') {
      rows = nhatKyChung.danhSachDong.map((d: any) => ({
        'STT': d.stt,
        'Ngày ghi sổ': formatDateVN(d.ngayGhiSo),
        'Số chứng từ': d.soChungTu,
        'Ngày chứng từ': formatDateVN(d.ngayChungTu),
        'Diễn giải': d.dienGiai,
        'TK Nợ': d.tkNo,
        'TK Có': d.tkCo,
        'TK Đối ứng': d.tkDoiUng,
        'Phát sinh Nợ': d.soPhatSinhNo,
        'Phát sinh Có': d.soPhatSinhCo
      }));
    } else if (reportType === 'S04') {
      rows = soCai.danhSachDong.map((d: any) => ({
        'Ngày ghi sổ': formatDateVN(d.ngayGhiSo),
        'Số chứng từ': d.soChungTu,
        'Ngày chứng từ': formatDateVN(d.ngayChungTu),
        'Diễn giải': d.dienGiai,
        'TK Đối ứng': d.tkDoiUng,
        'Phát sinh Nợ': d.soPhatSinhNo,
        'Phát sinh Có': d.soPhatSinhCo,
        'Số dư': d.soDu
      }));
    } else if (reportType === 'B01') {
      rows = [
        ...b01.taiSan.chiTiet.map((c: any) => ({ 'Chỉ tiêu': c.tenChiTieu, 'Mã số': c.maSo, 'Thuyết minh': c.thuyetMinh || '', 'Số cuối kỳ': c.soCuoiKy, 'Số đầu năm': c.soDauNam || 0 })),
        ...b01.nguonVon.chiTiet.map((c: any) => ({ 'Chỉ tiêu': c.tenChiTieu, 'Mã số': c.maSo, 'Thuyết minh': c.thuyetMinh || '', 'Số cuối kỳ': c.soCuoiKy, 'Số đầu năm': c.soDauNam || 0 }))
      ];
    } else if (reportType === 'B02') {
      rows = b02.chiTiet.map((c: any) => ({
        'Chỉ tiêu': c.tenChiTieu,
        'Mã số': c.maSo,
        'Thuyết minh': c.thuyetMinh || '',
        'Kỳ này': c.kyNay,
        'Kỳ trước': c.kyTruoc || 0
      }));
    }

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reportType);
    XLSX.writeFile(wb, `${meta.fileBaseName}.xlsx`);
  };

  // Xuất Word (.doc)
  const handleExportWord = () => {
    const reportHtml = printAreaRef.current?.innerHTML || '';
    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${meta.title}</title>
        <style>
          body { font-family: 'Times New Roman', serif; font-size: 11pt; color: #000; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #000; padding: 6px 8px; font-size: 10pt; }
          th { background-color: #f2f2f2; font-weight: bold; text-align: center; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: bold; }
          .signature-box { margin-top: 30px; width: 100%; }
        </style>
      </head>
      <body>
        ${reportHtml}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', wordContent], {
      type: 'application/msword;charset=utf-8'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meta.fileBaseName}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const today = new Date();
  const ngayLapStr = `Ngày ${String(today.getDate()).padStart(2, '0')} tháng ${String(today.getMonth() + 1).padStart(2, '0')} năm ${today.getFullYear()}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden text-slate-900">
        
        {/* Modal Action Header */}
        <div className="p-3.5 px-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span>Xem trước Báo cáo & Trung tâm In ấn TT99</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  {meta.code}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Định dạng chuẩn A4 • Gom nhóm: In trực tiếp, Xuất Excel, Xuất Word, Xuất PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="In trực tiếp ra máy in hoặc Lưu dưới dạng PDF (Ctrl+P)"
            >
              <Printer className="w-4 h-4" />
              <span>In trực tiếp / PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Xuất bảng tính Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportWord}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Xuất văn bản Microsoft Word (.doc)"
            >
              <FileText className="w-4 h-4" />
              <span>Xuất Word (.doc)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors ml-2 cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Preview Document Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-200/50 flex justify-center custom-scrollbar">
          <div 
            ref={printAreaRef}
            className="w-full max-w-[800px] bg-white p-8 md:p-12 shadow-md border border-slate-200/90 rounded-xl font-sans text-slate-900 printable-report-sheet"
          >
            {/* 1. Header Đơn vị & Mẫu số */}
            <div className="flex justify-between items-start text-xs border-b pb-4 mb-6">
              <div className="space-y-0.5 max-w-[450px]">
                <p className="font-bold text-slate-900 uppercase">{defaultCompany.tenCongTy}</p>
                <p className="text-slate-600">Địa chỉ: {defaultCompany.diaChi}</p>
                <p className="text-slate-600">Mã số thuế: <strong className="tabular-nums font-bold text-slate-800">{defaultCompany.maSoThue}</strong></p>
              </div>
              <div className="text-right space-y-0.5 shrink-0">
                <p className="font-bold text-slate-900">{meta.code}</p>
                <p className="text-[11px] text-slate-500 italic max-w-[260px]">
                  (Ban hành theo Thông tư số 99/2025/TT-BTC ngày 27/11/2025 của Bộ Tài chính)
                </p>
              </div>
            </div>

            {/* 2. Tiêu đề Báo cáo */}
            <div className="text-center my-6 space-y-1">
              <h1 className="text-lg font-black tracking-wide uppercase text-slate-950">
                {meta.title}
              </h1>
              <p className="text-xs text-slate-600 italic">
                {meta.sub}
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Đơn vị tính: Đồng Việt Nam (VND)
              </p>
            </div>

            {/* 3. Bảng số liệu chi tiết theo từng loại báo cáo */}
            <div className="my-6 overflow-x-auto text-xs">
              
              {/* F01-DN */}
              {reportType === 'F01' && (
                <table className="w-full border-collapse border border-slate-300">
                  <thead className="bg-slate-50 font-bold text-center">
                    <tr>
                      <th rowSpan={2} className="border border-slate-300 p-2 w-16">Mã TK</th>
                      <th rowSpan={2} className="border border-slate-300 p-2 text-left">Tên tài khoản</th>
                      <th colSpan={2} className="border border-slate-300 p-1.5">Số dư đầu kỳ</th>
                      <th colSpan={2} className="border border-slate-300 p-1.5">Số phát sinh trong kỳ</th>
                      <th colSpan={2} className="border border-slate-300 p-1.5">Số dư cuối kỳ</th>
                    </tr>
                    <tr>
                      <th className="border border-slate-300 p-1.5 text-right w-24">Nợ</th>
                      <th className="border border-slate-300 p-1.5 text-right w-24">Có</th>
                      <th className="border border-slate-300 p-1.5 text-right w-24">Nợ</th>
                      <th className="border border-slate-300 p-1.5 text-right w-24">Có</th>
                      <th className="border border-slate-300 p-1.5 text-right w-24">Nợ</th>
                      <th className="border border-slate-300 p-1.5 text-right w-24">Có</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {trialBalance.chiTiet.map((item: any) => (
                      <tr key={item.maTk}>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-600 tabular-nums">{item.maTk}</td>
                        <td className="border border-slate-300 p-1.5">{item.tenTk}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums">{item.duNoDauKy > 0 ? formatCurrency(item.duNoDauKy) : '-'}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums">{item.duCoDauKy > 0 ? formatCurrency(item.duCoDauKy) : '-'}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums font-semibold text-blue-600">{item.phatSinhNo > 0 ? formatCurrency(item.phatSinhNo) : '-'}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums font-semibold text-blue-600">{item.phatSinhCo > 0 ? formatCurrency(item.phatSinhCo) : '-'}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums font-bold text-emerald-600">{item.duNoCuoiKy > 0 ? formatCurrency(item.duNoCuoiKy) : '-'}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums font-bold text-emerald-600">{item.duCoCuoiKy > 0 ? formatCurrency(item.duCoCuoiKy) : '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={2} className="border border-slate-300 p-2 text-center uppercase">Tổng cộng</td>
                      <td className="border border-slate-300 p-1.5 text-right tabular-nums">{formatCurrency(trialBalance.tongDuNoDauKy)}</td>
                      <td className="border border-slate-300 p-1.5 text-right tabular-nums">{formatCurrency(trialBalance.tongDuCoDauKy)}</td>
                      <td className="border border-slate-300 p-1.5 text-right tabular-nums text-blue-600">{formatCurrency(trialBalance.tongPhatSinhNo)}</td>
                      <td className="border border-slate-300 p-1.5 text-right tabular-nums text-blue-600">{formatCurrency(trialBalance.tongPhatSinhCo)}</td>
                      <td className="border border-slate-300 p-1.5 text-right tabular-nums text-emerald-600">{formatCurrency(trialBalance.tongDuNoCuoiKy)}</td>
                      <td className="border border-slate-300 p-1.5 text-right tabular-nums text-emerald-600">{formatCurrency(trialBalance.tongDuCoCuoiKy)}</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* S03-DN */}
              {reportType === 'S03' && (
                <table className="w-full border-collapse border border-slate-300">
                  <thead className="bg-slate-50 font-bold text-center">
                    <tr>
                      <th className="border border-slate-300 p-2 w-12">STT</th>
                      <th className="border border-slate-300 p-2 w-20">Ngày ghi sổ</th>
                      <th className="border border-slate-300 p-2 w-24">Số CT</th>
                      <th className="border border-slate-300 p-2 w-20">Ngày CT</th>
                      <th className="border border-slate-300 p-2 text-left">Diễn giải</th>
                      <th className="border border-slate-300 p-2 w-16">TK ĐƯ</th>
                      <th className="border border-slate-300 p-2 text-right w-28">Số phát sinh Nợ</th>
                      <th className="border border-slate-300 p-2 text-right w-28">Số phát sinh Có</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {nhatKyChung.danhSachDong.map((d: any) => (
                      <tr key={d.stt}>
                        <td className="border border-slate-300 p-1.5 text-center tabular-nums">{d.stt}</td>
                        <td className="border border-slate-300 p-1.5 text-center tabular-nums">{formatDateVN(d.ngayGhiSo)}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-600 tabular-nums">{d.soChungTu}</td>
                        <td className="border border-slate-300 p-1.5 text-center tabular-nums">{formatDateVN(d.ngayChungTu)}</td>
                        <td className="border border-slate-300 p-1.5">{d.dienGiai}</td>
                        <td className="border border-slate-300 p-1.5 text-center tabular-nums font-semibold">{d.tkDoiUng}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums font-medium">{d.soPhatSinhNo > 0 ? formatCurrency(d.soPhatSinhNo) : '-'}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums font-medium">{d.soPhatSinhCo > 0 ? formatCurrency(d.soPhatSinhCo) : '-'}</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={6} className="border border-slate-300 p-2 text-center uppercase">Tổng cộng phát sinh</td>
                      <td className="border border-slate-300 p-2 text-right tabular-nums text-blue-600">{formatCurrency(nhatKyChung.tongPhatSinhNo)}</td>
                      <td className="border border-slate-300 p-2 text-right tabular-nums text-blue-600">{formatCurrency(nhatKyChung.tongPhatSinhCo)}</td>
                    </tr>
                  </tbody>
                </table>
              )}

              {/* S04-DN */}
              {reportType === 'S04' && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-slate-700">
                    Số dư đầu kỳ: <strong className="tabular-nums font-bold text-slate-900">{formatCurrency(soCai.soDuDauKy)}</strong>
                  </p>
                  <table className="w-full border-collapse border border-slate-300">
                    <thead className="bg-slate-50 font-bold text-center">
                      <tr>
                        <th className="border border-slate-300 p-2 w-24">Ngày ghi sổ</th>
                        <th className="border border-slate-300 p-2 w-28">Số CT</th>
                        <th className="border border-slate-300 p-2 text-left">Diễn giải</th>
                        <th className="border border-slate-300 p-2 w-16">TK ĐƯ</th>
                        <th className="border border-slate-300 p-2 text-right w-28">Phát sinh Nợ</th>
                        <th className="border border-slate-300 p-2 text-right w-28">Phát sinh Có</th>
                        <th className="border border-slate-300 p-2 text-right w-28">Số dư</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {soCai.danhSachDong.map((d: any, idx: number) => (
                        <tr key={idx}>
                          <td className="border border-slate-300 p-1.5 text-center tabular-nums">{formatDateVN(d.ngayGhiSo)}</td>
                          <td className="border border-slate-300 p-1.5 text-center font-bold text-blue-600 tabular-nums">{d.soChungTu}</td>
                          <td className="border border-slate-300 p-1.5">{d.dienGiai}</td>
                          <td className="border border-slate-300 p-1.5 text-center tabular-nums font-semibold">{d.tkDoiUng}</td>
                          <td className="border border-slate-300 p-1.5 text-right tabular-nums">{d.soPhatSinhNo > 0 ? formatCurrency(d.soPhatSinhNo) : '-'}</td>
                          <td className="border border-slate-300 p-1.5 text-right tabular-nums">{d.soPhatSinhCo > 0 ? formatCurrency(d.soPhatSinhCo) : '-'}</td>
                          <td className="border border-slate-300 p-1.5 text-right tabular-nums font-bold text-emerald-600">{formatCurrency(d.soDu)}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold">
                        <td colSpan={4} className="border border-slate-300 p-2 text-center uppercase">Tổng cộng phát sinh / Dư cuối kỳ</td>
                        <td className="border border-slate-300 p-2 text-right tabular-nums text-blue-600">{formatCurrency(soCai.tongPhatSinhNo)}</td>
                        <td className="border border-slate-300 p-2 text-right tabular-nums text-blue-600">{formatCurrency(soCai.tongPhatSinhCo)}</td>
                        <td className="border border-slate-300 p-2 text-right tabular-nums text-emerald-600 font-bold">{formatCurrency(soCai.soDuCuoiKy)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* B01-DN */}
              {reportType === 'B01' && (
                <table className="w-full border-collapse border border-slate-300">
                  <thead className="bg-slate-50 font-bold text-center">
                    <tr>
                      <th className="border border-slate-300 p-2 text-left">Chỉ tiêu</th>
                      <th className="border border-slate-300 p-2 w-16">Mã số</th>
                      <th className="border border-slate-300 p-2 w-20">Thuyết minh</th>
                      <th className="border border-slate-300 p-2 text-right w-32">Số cuối kỳ</th>
                      <th className="border border-slate-300 p-2 text-right w-32">Số đầu năm</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={5} className="border border-slate-300 p-1.5 uppercase">A. TÀI SẢN NGẮN HẠN VÀ DÀI HẠN</td>
                    </tr>
                    {b01.taiSan.chiTiet.map((c: any) => (
                      <tr key={c.maSo} className={c.laChiTieuTong ? "font-bold bg-slate-50/70" : ""}>
                        <td className="border border-slate-300 p-1.5 pl-3">{c.tenChiTieu}</td>
                        <td className="border border-slate-300 p-1.5 text-center tabular-nums">{c.maSo}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{c.thuyetMinh || ''}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums font-semibold">{formatCurrency(c.soCuoiKy)}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums text-slate-400">-</td>
                      </tr>
                    ))}
                    <tr className="bg-slate-100 font-bold">
                      <td colSpan={5} className="border border-slate-300 p-1.5 uppercase">B. NỢ PHẢI TRẢ VÀ VỐN CHỦ SỞ HỮU</td>
                    </tr>
                    {b01.nguonVon.chiTiet.map((c: any) => (
                      <tr key={c.maSo} className={c.laChiTieuTong ? "font-bold bg-slate-50/70" : ""}>
                        <td className="border border-slate-300 p-1.5 pl-3">{c.tenChiTieu}</td>
                        <td className="border border-slate-300 p-1.5 text-center tabular-nums">{c.maSo}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{c.thuyetMinh || ''}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums font-semibold">{formatCurrency(c.soCuoiKy)}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums text-slate-400">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* B02-DN */}
              {reportType === 'B02' && (
                <table className="w-full border-collapse border border-slate-300">
                  <thead className="bg-slate-50 font-bold text-center">
                    <tr>
                      <th className="border border-slate-300 p-2 text-left">Chỉ tiêu</th>
                      <th className="border border-slate-300 p-2 w-16">Mã số</th>
                      <th className="border border-slate-300 p-2 w-20">Thuyết minh</th>
                      <th className="border border-slate-300 p-2 text-right w-32">Năm nay</th>
                      <th className="border border-slate-300 p-2 text-right w-32">Năm trước</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {b02.chiTiet.map((c: any) => (
                      <tr key={c.maSo} className={c.laChiTieuTong ? "font-bold bg-slate-50/70" : ""}>
                        <td className="border border-slate-300 p-1.5">{c.tenChiTieu}</td>
                        <td className="border border-slate-300 p-1.5 text-center tabular-nums">{c.maSo}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{c.thuyetMinh || ''}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums font-semibold">{formatCurrency(c.kyNay)}</td>
                        <td className="border border-slate-300 p-1.5 text-right tabular-nums text-slate-400">-</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

            </div>

            {/* 4. Footer & 3 Chữ ký chuẩn kế toán */}
            <div className="mt-12 pt-6 border-t border-slate-200 space-y-6">
              <div className="flex justify-end text-xs italic text-slate-700">
                <p>{ngayLapStr}</p>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-xs">
                <div>
                  <p className="font-bold text-slate-900 uppercase">NGƯỜI LẬP BIỂU</p>
                  <p className="text-[11px] text-slate-500 italic">(Ký, họ tên)</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-800">Trần Thị Thu Hương</p>
                </div>

                <div>
                  <p className="font-bold text-slate-900 uppercase">KẾ TOÁN TRƯỞNG</p>
                  <p className="text-[11px] text-slate-500 italic">(Ký, họ tên)</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-800">{defaultCompany.keToanTruong}</p>
                </div>

                <div>
                  <p className="font-bold text-slate-900 uppercase">NGƯỜI ĐẠI DIỆN PHÁP LUẬT</p>
                  <p className="text-[11px] text-slate-500 italic">(Ký, đóng dấu, họ tên)</p>
                  <div className="h-16" />
                  <p className="font-bold text-slate-800">{defaultCompany.nguoiDaiDien}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
