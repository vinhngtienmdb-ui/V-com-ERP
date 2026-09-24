import React, { useRef, useState, useMemo } from 'react';
import { Printer, Download, FileText, FileSpreadsheet, X, Eye, CheckCircle2, Code2, Copy, Check, ChevronDown, Sparkles, AlertCircle, FileCode } from 'lucide-react';
import * as XLSX from 'xlsx';
import { formatCurrency, cn } from '../../lib/utils';
import { formatDateVN } from '../../lib/keToan/dateUtils';
import { ThietLapCongTy } from './ThietLapCongTyModal';
import { buildTaxXmlDocument, exportTaxXmlFile, generateTaxXmlFileName, validateTaxXmlContent } from '../../lib/keToan/taxXmlExportService';

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

  const [previewMode, setPreviewMode] = useState<'A4' | 'XML'>('A4');
  const [xmlExportType, setXmlExportType] = useState<'ALL_BCTC' | 'CURRENT'>('ALL_BCTC');
  const [copiedXml, setCopiedXml] = useState(false);
  const [showXmlDropdown, setShowXmlDropdown] = useState(false);

  const xmlContent = useMemo(() => {
    return buildTaxXmlDocument({
      reportType: xmlExportType === 'ALL_BCTC' ? 'ALL_BCTC' : reportType,
      companyInfo: defaultCompany,
      fromDate,
      toDate,
      selectedAccount,
      trialBalance,
      nhatKyChung,
      soCai,
      b01,
      b02
    });
  }, [xmlExportType, reportType, defaultCompany, fromDate, toDate, selectedAccount, trialBalance, nhatKyChung, soCai, b01, b02]);

  const xmlValidation = useMemo(() => {
    return validateTaxXmlContent(xmlContent);
  }, [xmlContent]);

  const handleExportXml = (type: 'ALL_BCTC' | 'CURRENT' = 'ALL_BCTC') => {
    const xml = buildTaxXmlDocument({
      reportType: type === 'ALL_BCTC' ? 'ALL_BCTC' : reportType,
      companyInfo: defaultCompany,
      fromDate,
      toDate,
      selectedAccount,
      trialBalance,
      nhatKyChung,
      soCai,
      b01,
      b02
    });
    const fileName = generateTaxXmlFileName(
      defaultCompany.maSoThue,
      toDate ? toDate.substring(0, 4) : '2026',
      type === 'ALL_BCTC' ? 'ALL_BCTC' : reportType
    );
    exportTaxXmlFile(xml, fileName);
    setShowXmlDropdown(false);
  };

  const handleCopyXml = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
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
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="In trực tiếp ra máy in hoặc Lưu dưới dạng PDF (Ctrl+P)"
            >
              <Printer className="w-4 h-4" />
              <span>In / PDF</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Xuất bảng tính Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Excel (.xlsx)</span>
            </button>

            <button
              onClick={handleExportWord}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
              title="Xuất văn bản Microsoft Word (.doc)"
            >
              <FileText className="w-4 h-4" />
              <span>Word (.doc)</span>
            </button>

            {/* Nút Xuất XML nộp Thuế Điện Tử */}
            <div className="relative">
              <div className="inline-flex rounded-lg shadow-2xs">
                <button
                  onClick={() => handleExportXml('ALL_BCTC')}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-l-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border-r border-amber-600"
                  title="Xuất trọn bộ Báo cáo tài chính XML nộp thuedientu.gdt.gov.vn"
                >
                  <FileCode className="w-4 h-4 text-slate-950" />
                  <span>Xuất XML (eTax)</span>
                </button>
                <button
                  onClick={() => setShowXmlDropdown(!showXmlDropdown)}
                  className="px-1.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-r-lg transition-all cursor-pointer"
                  title="Tùy chọn kết xuất XML"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {showXmlDropdown && (
                <div className="absolute right-0 mt-1 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 text-xs">
                  <button
                    onClick={() => {
                      setXmlExportType('ALL_BCTC');
                      handleExportXml('ALL_BCTC');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-amber-50 dark:hover:bg-slate-700 flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Trọn Bộ BCTC XML nộp Thuế
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Gồm B01-DN, B02-DN, F01-DN (chuẩn eTax)
                    </span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                  <button
                    onClick={() => {
                      setXmlExportType('CURRENT');
                      handleExportXml('CURRENT');
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex flex-col gap-0.5 cursor-pointer"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      Chỉ xuất riêng {meta.code} XML
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Phục vụ lưu trữ & giải trình thanh tra
                    </span>
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                  <button
                    onClick={() => {
                      setPreviewMode('XML');
                      setShowXmlDropdown(false);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-blue-600 font-semibold cursor-pointer"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Xem trước mã nguồn XML</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors ml-1 cursor-pointer"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Switcher Tabs */}
        <div className="px-6 py-2 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-200/80 dark:bg-slate-900 p-1 rounded-lg">
            <button
              onClick={() => setPreviewMode('A4')}
              className={cn(
                "px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                previewMode === 'A4'
                  ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Văn bản in ấn (Mẫu A4)</span>
            </button>

            <button
              onClick={() => setPreviewMode('XML')}
              className={cn(
                "px-3 py-1.5 rounded-md font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                previewMode === 'XML'
                  ? "bg-slate-900 text-amber-300 shadow-2xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              )}
            >
              <Code2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Cấu trúc XML nộp Thuế (eTax Schema)</span>
              <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-100 text-amber-800 font-extrabold ml-1">
                GDT
              </span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-[11px]">
            {previewMode === 'A4' ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Chuẩn hóa Thông tư 99/2025/TT-BTC
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Tương thích thuedientu.gdt.gov.vn & iTaxViewer
              </span>
            )}
          </div>
        </div>

        {/* Content Container (XML Schema Preview vs A4 Printable Document) */}
        {previewMode === 'XML' ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-900 text-slate-100 flex flex-col gap-4 custom-scrollbar">
            {/* Top XML Action Ribbon */}
            <div className="bg-slate-800/90 border border-slate-700 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-md shrink-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Phạm vi XML:</span>
                  <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-700 text-xs">
                    <button
                      onClick={() => setXmlExportType('ALL_BCTC')}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                        xmlExportType === 'ALL_BCTC'
                          ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      Trọn bộ BCTC (B01+B02+F01)
                    </button>
                    <button
                      onClick={() => setXmlExportType('CURRENT')}
                      className={cn(
                        "px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer",
                        xmlExportType === 'CURRENT'
                          ? "bg-amber-500 text-slate-950 font-bold shadow-xs"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      Chỉ riêng {meta.code}
                    </button>
                  </div>
                </div>

                <div className="h-4 w-px bg-slate-700 hidden sm:block" />

                <div className="flex items-center gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-mono">
                    MST: {defaultCompany.maSoThue}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-700/60 text-slate-300 font-mono">
                    Kỳ: {toDate ? toDate.substring(0, 4) : '2026'}
                  </span>
                  {xmlValidation.isValid ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold flex items-center gap-1 border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Chuẩn XSD Hợp lệ
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold flex items-center gap-1 border border-rose-500/30">
                      <AlertCircle className="w-3.5 h-3.5" /> Cảnh báo định dạng
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyXml}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 active:scale-95 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-600"
                >
                  {copiedXml ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedXml ? 'Đã sao chép XML' : 'Sao chép XML'}</span>
                </button>

                <button
                  onClick={() => handleExportXml(xmlExportType)}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải tệp .xml nộp Thuế</span>
                </button>
              </div>
            </div>

            {/* XML Code Container */}
            <div className="flex-1 min-h-[360px] bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-auto custom-scrollbar font-mono text-xs text-amber-200/90 leading-relaxed shadow-inner select-text">
              <pre className="whitespace-pre">{xmlContent}</pre>
            </div>

            {/* Tax Filing 5-step Guidance */}
            <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3.5 text-xs text-slate-300 space-y-2 shrink-0">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <Sparkles className="w-4 h-4" />
                <span>Quy trình 5 bước nộp Báo cáo tài chính XML trên cổng thuedientu.gdt.gov.vn:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                <li>Nhấn <strong>"Tải tệp .xml nộp Thuế"</strong> để lưu tệp tin <code>BCTC_{defaultCompany.maSoThue}_*.xml</code> về máy tính (không đổi tên tệp).</li>
                <li>(Khuyên dùng) Mở tệp XML bằng ứng dụng <strong>iTaxViewer</strong> chính thức của Tổng cục Thuế để rà soát mẫu biểu trước khi nộp.</li>
                <li>Đăng nhập cổng thuế <a href="https://thuedientu.gdt.gov.vn" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">thuedientu.gdt.gov.vn</a> bằng tài khoản Doanh nghiệp (MST-QL).</li>
                <li>Vào menu <strong>Khai thuế</strong> &rarr; Chọn chức năng <strong>Nộp tờ khai XML</strong> &rarr; Bấm <strong>Chọn tệp tờ khai</strong> và chọn file vừa tải.</li>
                <li>Cắm <strong>USB Token chữ ký số</strong> (hoặc chọn Ký số HSM/SmartCA), nhấn <strong>Ký điện tử</strong>, nhập mã PIN và bấm <strong>Nộp tờ khai</strong>.</li>
              </ol>
              <p className="text-[11px] text-slate-400 italic pt-0.5">
                * Ghi chú: Nếu cơ quan thuế yêu cầu bản Thuyết minh BCTC (B09-DN), bạn chỉ cần chọn tab "Văn bản in ấn (Mẫu A4)" phía trên &rarr; bấm "Xuất Word (.doc)" hoặc "Xuất Excel (.xlsx)" để đính kèm phụ lục theo quy định.
              </p>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};
