import React, { useState } from 'react';
import {
  FileText,
  FileBarChart,
  Printer,
  Download,
  Calendar,
  CheckCircle2,
  Search,
  BookOpen,
  PieChart,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import {
  lapBangCanDoiPhatSinh,
  xuatSoNhatKyChung,
  xuatSoCai,
  lapBaoCaoTinhHinhTaiChinh,
  lapBaoCaoKetQuaKinhDoanh,
  DongChungTuReport,
  SoDuDauKyItem
} from '../../lib/keToan/financialReports';
import { formatDateVN, formatMonthVN } from '../../lib/keToan/dateUtils';
import { BaoCaoPrintExportModal } from './BaoCaoPrintExportModal';
import { ThietLapCongTy } from './ThietLapCongTyModal';

// Mẫu dữ liệu chứng từ khởi tạo phục vụ tra cứu báo cáo
const MOCK_SO_DU_DAU_KY: SoDuDauKyItem[] = [
  { maTk: '111', tenTk: 'Tiền mặt', duNoDauKy: 150000000, duCoDauKy: 0 },
  { maTk: '112', tenTk: 'Tiền gửi ngân hàng', duNoDauKy: 850000000, duCoDauKy: 0 },
  { maTk: '131', tenTk: 'Phải thu của khách hàng', duNoDauKy: 320000000, duCoDauKy: 0 },
  { maTk: '156', tenTk: 'Hàng hóa tồn kho', duNoDauKy: 640000000, duCoDauKy: 0 },
  { maTk: '211', tenTk: 'Tài sản cố định hữu hình', duNoDauKy: 1200000000, duCoDauKy: 0 },
  { maTk: '214', tenTk: 'Hao mòn tài sản cố định', duNoDauKy: 0, duCoDauKy: 160000000 },
  { maTk: '331', tenTk: 'Phải trả người bán', duNoDauKy: 0, duCoDauKy: 450000000 },
  { maTk: '332', tenTk: 'Phải trả cổ tức, lợi nhuận (TT99)', duNoDauKy: 0, duCoDauKy: 50000000 },
  { maTk: '411', tenTk: 'Vốn góp chủ sở hữu', duNoDauKy: 0, duCoDauKy: 2500000000 }
];

const MOCK_CHUNG_TU_LIST: DongChungTuReport[] = [
  {
    id: 'CT-001',
    soChungTu: 'PKT-2026-0001',
    ngayChungTu: '2026-01-05',
    ngayHachToan: '2026-01-05',
    loaiChungTu: 'PKT',
    dienGiai: 'Doanh thu bán hàng TMĐT thu tiền ngay',
    dongHachToan: [
      { tkNo: '112', tkCo: '511', soTien: 120000000, dienGiai: 'Doanh thu TMĐT' },
      { tkNo: '112', tkCo: '3331', soTien: 12000000, dienGiai: 'Thuế GTGT 10%' }
    ],
    trangThai: 'DA_GHI_SO'
  },
  {
    id: 'CT-002',
    soChungTu: 'XK-2026-0001',
    ngayChungTu: '2026-01-05',
    ngayHachToan: '2026-01-05',
    loaiChungTu: 'XK',
    dienGiai: 'Xuất kho bán hàng - giá vốn',
    dongHachToan: [
      { tkNo: '632', tkCo: '156', soTien: 75000000, dienGiai: 'Giá vốn lô hàng ORD-8891' }
    ],
    trangThai: 'DA_GHI_SO'
  },
  {
    id: 'CT-003',
    soChungTu: 'PC-2026-0001',
    ngayChungTu: '2026-01-12',
    ngayHachToan: '2026-01-12',
    loaiChungTu: 'PC',
    dienGiai: 'Chi phí tiếp thị trực tuyến và marketing TikTok Shop',
    dongHachToan: [
      { tkNo: '641', tkCo: '112', soTien: 15000000, dienGiai: 'Chi phí ads' }
    ],
    trangThai: 'DA_GHI_SO'
  },
  {
    id: 'CT-004',
    soChungTu: 'PC-2026-0002',
    ngayChungTu: '2026-01-20',
    ngayHachToan: '2026-01-20',
    loaiChungTu: 'PC',
    dienGiai: 'Chi phí quản lý doanh nghiệp, phần mềm ERP',
    dongHachToan: [
      { tkNo: '642', tkCo: '112', soTien: 8000000, dienGiai: 'Chi phí QLDN' }
    ],
    trangThai: 'DA_GHI_SO'
  }
];

export function BaoCaoTt99Page({ companyInfo }: { companyInfo?: ThietLapCongTy } = {}) {
  const [reportType, setReportType] = useState<'F01' | 'S03' | 'S04' | 'B01' | 'B02'>('F01');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-01-31');
  const [selectedAccount, setSelectedAccount] = useState('112');
  const [searchFilter, setSearchFilter] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  
  // Interactive Drill-Down Drawer State
  const [drillDownAccount, setDrillDownAccount] = useState<string | null>(null);

  // Tính toán các báo cáo
  const trialBalance = lapBangCanDoiPhatSinh(fromDate, toDate, MOCK_SO_DU_DAU_KY, MOCK_CHUNG_TU_LIST);
  const nhatKyChung = xuatSoNhatKyChung(fromDate, toDate, MOCK_CHUNG_TU_LIST);
  const soCai = xuatSoCai(selectedAccount, fromDate, toDate, 850000000, MOCK_CHUNG_TU_LIST);
  const drillDownSoCai = drillDownAccount ? xuatSoCai(drillDownAccount, fromDate, toDate, 0, MOCK_CHUNG_TU_LIST) : null;
  const b01 = lapBaoCaoTinhHinhTaiChinh(trialBalance);
  const b02 = lapBaoCaoKetQuaKinhDoanh(fromDate, toDate, MOCK_CHUNG_TU_LIST);

  const applyPeriodPreset = (preset: 'T01' | 'T02' | 'T03' | 'Q1' | 'YEAR') => {
    if (preset === 'T01') { setFromDate('2026-01-01'); setToDate('2026-01-31'); }
    if (preset === 'T02') { setFromDate('2026-02-01'); setToDate('2026-02-28'); }
    if (preset === 'T03') { setFromDate('2026-03-01'); setToDate('2026-03-31'); }
    if (preset === 'Q1') { setFromDate('2026-01-01'); setToDate('2026-03-31'); }
    if (preset === 'YEAR') { setFromDate('2026-01-01'); setToDate('2026-12-31'); }
  };

  return (
    <div className="space-y-4">
      {/* Header & Report selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs transition-colors">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            Hệ thống Báo cáo Tài chính & Sổ kế toán TT99/2025/TT-BTC
          </h2>
          <p className="text-xs text-slate-500">
            Hỗ trợ Drill-down chi tiết • Biểu mẫu chuẩn Phụ lục III & IV áp dụng từ 01/01/2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsPrintModalOpen(true)}
            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" /> In & Xuất Báo cáo
          </button>
        </div>
      </div>

      {/* Navigation tabs for reports */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 pt-2 rounded-t-xl overflow-x-auto transition-colors">
        {[
          { id: 'F01', label: 'F01-DN: Bảng CĐ Số phát sinh', icon: FileText },
          { id: 'S03', label: 'S03-DN: Sổ Nhật ký chung', icon: BookOpen },
          { id: 'S04', label: 'S04-DN: Sổ Cái tài khoản', icon: FileText },
          { id: 'B01', label: 'B01-DN: Báo cáo Tình hình tài chính', icon: PieChart },
          { id: 'B02', label: 'B02-DN: Báo cáo Kết quả KD', icon: FileBarChart }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id as any)}
            className={cn(
              "px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer",
              reportType === tab.id
                ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30 rounded-t-lg"
                : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters & Presets bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-b-xl border border-slate-200 dark:border-slate-800 shadow-2xs text-xs transition-colors">
        <div className="flex flex-wrap items-center gap-3">
          {/* Presets */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <span className="text-[10px] text-slate-400 px-1 font-semibold">Kỳ nhanh:</span>
            <button onClick={() => applyPeriodPreset('T01')} className="px-2 py-0.5 rounded text-[11px] font-medium hover:bg-white dark:hover:bg-slate-700 tabular-nums">01/2026</button>
            <button onClick={() => applyPeriodPreset('T02')} className="px-2 py-0.5 rounded text-[11px] font-medium hover:bg-white dark:hover:bg-slate-700 tabular-nums">02/2026</button>
            <button onClick={() => applyPeriodPreset('T03')} className="px-2 py-0.5 rounded text-[11px] font-medium hover:bg-white dark:hover:bg-slate-700 tabular-nums">03/2026</button>
            <button onClick={() => applyPeriodPreset('Q1')} className="px-2 py-0.5 rounded text-[11px] font-bold text-blue-600 hover:bg-white dark:hover:bg-slate-700">Quý 1</button>
            <button onClick={() => applyPeriodPreset('YEAR')} className="px-2 py-0.5 rounded text-[11px] font-medium hover:bg-white dark:hover:bg-slate-700">Cả năm</button>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-400 font-medium">Từ:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-medium">Đến:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 text-xs"
            />
          </div>

          {reportType === 'S04' && (
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-medium">Tài khoản:</span>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded px-2 py-1 text-xs font-bold text-blue-600 dark:text-blue-400"
              >
                <option value="111">111 - Tiền mặt</option>
                <option value="112">112 - Tiền gửi không kỳ hạn</option>
                <option value="131">131 - Phải thu của khách hàng</option>
                <option value="156">156 - Hàng hóa</option>
                <option value="331">331 - Phải trả cho người bán</option>
                <option value="332">332 - Phải trả cổ tức, lợi nhuận (TT99)</option>
                <option value="511">511 - Doanh thu bán hàng</option>
                <option value="632">632 - Giá vốn hàng bán</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Lọc tài khoản, chỉ tiêu..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-xs w-48"
            />
          </div>
        </div>
      </div>

      {/* REPORT CONTENT */}

      {/* F01-DN: Bảng cân đối số phát sinh */}
      {reportType === 'F01' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
            <div>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Mẫu số F01-DN</span>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">BẢNG CÂN ĐỐI SỐ PHÁT SINH TÀI KHOẢN</h3>
              <p className="text-xs text-slate-500">Từ {formatDateVN(fromDate)} đến {formatDateVN(toDate)} • Nhấp vào tài khoản để mở Sổ cái drill-down</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                trialBalance.canDoiPhatSinh ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30" : "bg-rose-500/10 text-rose-600 border border-rose-500/30"
              )}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {trialBalance.canDoiPhatSinh ? '3 Cặp Cân đối 100%' : 'Chưa cân đối'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th rowSpan={2} className="p-2.5 border-r border-slate-200 dark:border-slate-700 text-center w-20">Số hiệu</th>
                  <th rowSpan={2} className="p-2.5 border-r border-slate-200 dark:border-slate-700">Tên tài khoản</th>
                  <th colSpan={2} className="p-2 border-r border-slate-200 dark:border-slate-700 text-center">Số dư đầu kỳ</th>
                  <th colSpan={2} className="p-2 border-r border-slate-200 dark:border-slate-700 text-center">Số phát sinh trong kỳ</th>
                  <th colSpan={2} className="p-2 text-center">Số dư cuối kỳ</th>
                  <th rowSpan={2} className="p-2.5 text-center w-12">Chi tiết</th>
                </tr>
                <tr className="border-t border-slate-200 dark:border-slate-700">
                  <th className="p-2 text-right border-r border-slate-200 dark:border-slate-700 w-28">Nợ</th>
                  <th className="p-2 text-right border-r border-slate-200 dark:border-slate-700 w-28">Có</th>
                  <th className="p-2 text-right border-r border-slate-200 dark:border-slate-700 w-28">Nợ</th>
                  <th className="p-2 text-right border-r border-slate-200 dark:border-slate-700 w-28">Có</th>
                  <th className="p-2 text-right border-r border-slate-200 dark:border-slate-700 w-28">Nợ</th>
                  <th className="p-2 text-right w-28">Có</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trialBalance.danhSachTk
                  .filter(t => !searchFilter || t.maTk.includes(searchFilter) || t.tenTk.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map((tk) => (
                    <tr
                      key={tk.maTk}
                      onClick={() => setDrillDownAccount(tk.maTk)}
                      className="hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                    >
                      <td className="p-2.5 font-bold text-blue-600 dark:text-blue-400 text-center border-r border-slate-100 dark:border-slate-800">
                        {tk.maTk}
                      </td>
                      <td className="p-2.5 font-medium text-slate-800 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800">
                        {tk.tenTk}
                      </td>
                      <td className="p-2 text-right border-r border-slate-100 dark:border-slate-800 tabular-nums text-slate-500">
                        {tk.duNoDauKy > 0 ? formatCurrency(tk.duNoDauKy) : '-'}
                      </td>
                      <td className="p-2 text-right border-r border-slate-100 dark:border-slate-800 tabular-nums text-slate-500">
                        {tk.duCoDauKy > 0 ? formatCurrency(tk.duCoDauKy) : '-'}
                      </td>
                      <td className="p-2 text-right border-r border-slate-100 dark:border-slate-800 tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                        {tk.phatSinhNo > 0 ? formatCurrency(tk.phatSinhNo) : '-'}
                      </td>
                      <td className="p-2 text-right border-r border-slate-100 dark:border-slate-800 tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                        {tk.phatSinhCo > 0 ? formatCurrency(tk.phatSinhCo) : '-'}
                      </td>
                      <td className="p-2 text-right border-r border-slate-100 dark:border-slate-800 tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {tk.duNoCuoiKy > 0 ? formatCurrency(tk.duNoCuoiKy) : '-'}
                      </td>
                      <td className="p-2 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {tk.duCoCuoiKy > 0 ? formatCurrency(tk.duCoCuoiKy) : '-'}
                      </td>
                      <td className="p-2 text-center text-slate-400 group-hover:text-blue-500">
                        <ChevronRight className="w-4 h-4 mx-auto" />
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-slate-100/90 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td colSpan={2} className="p-2.5 text-center uppercase tracking-wider">Tổng cộng</td>
                  <td className="p-2 text-right border-r border-slate-200 dark:border-slate-700 tabular-nums">{formatCurrency(trialBalance.tongDuNoDauKy)}</td>
                  <td className="p-2 text-right border-r border-slate-200 dark:border-slate-700 tabular-nums">{formatCurrency(trialBalance.tongDuCoDauKy)}</td>
                  <td className="p-2 text-right border-r border-slate-200 dark:border-slate-700 tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(trialBalance.tongPhatSinhNo)}</td>
                  <td className="p-2 text-right border-r border-slate-200 dark:border-slate-700 tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(trialBalance.tongPhatSinhCo)}</td>
                  <td className="p-2 text-right border-r border-slate-200 dark:border-slate-700 tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(trialBalance.tongDuNoCuoiKy)}</td>
                  <td className="p-2 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(trialBalance.tongDuCoCuoiKy)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* S03-DN: Sổ Nhật ký chung */}
      {reportType === 'S03' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Mẫu số S03-DN</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">SỔ NHẬT KÝ CHUNG</h3>
            <p className="text-xs text-slate-500">Ghi chép toàn bộ nghiệp vụ kinh tế tài chính phát sinh theo trình tự thời gian</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 text-center w-12">STT</th>
                  <th className="p-2.5 text-center w-24">Ngày ghi sổ</th>
                  <th className="p-2.5 text-center w-28">Số chứng từ</th>
                  <th className="p-2.5 text-center w-24">Ngày chứng từ</th>
                  <th className="p-2.5">Diễn giải</th>
                  <th className="p-2.5 text-center w-28">TK đối ứng</th>
                  <th className="p-2.5 text-right w-32">Phát sinh Nợ</th>
                  <th className="p-2.5 text-right w-32">Phát sinh Có</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {nhatKyChung.danhSachDong.map((d) => (
                  <tr key={d.stt} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="p-2 text-center text-slate-400">{d.stt}</td>
                    <td className="p-2 text-center text-slate-600 dark:text-slate-400">{formatDateVN(d.ngayGhiSo)}</td>
                    <td className="p-2 text-center font-bold text-blue-600 dark:text-blue-400">{d.soChungTu}</td>
                    <td className="p-2 text-center text-slate-500">{formatDateVN(d.ngayChungTu)}</td>
                    <td className="p-2 text-slate-800 dark:text-slate-200">{d.dienGiai}</td>
                    <td className="p-2 text-center font-medium text-slate-500">{d.tkDoiUng}</td>
                    <td className="p-2 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">{d.soPhatSinhNo > 0 ? formatCurrency(d.soPhatSinhNo) : '-'}</td>
                    <td className="p-2 text-right tabular-nums font-medium text-slate-900 dark:text-slate-100">{d.soPhatSinhCo > 0 ? formatCurrency(d.soPhatSinhCo) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td colSpan={6} className="p-2.5 text-center uppercase">Tổng cộng phát sinh</td>
                  <td className="p-2.5 text-right tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(nhatKyChung.tongPhatSinhNo)}</td>
                  <td className="p-2.5 text-right tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(nhatKyChung.tongPhatSinhCo)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* S04-DN: Sổ Cái */}
      {reportType === 'S04' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Mẫu số S04-DN</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">SỔ CÁI TÀI KHOẢN {soCai.maTk}</h3>
            <p className="text-xs text-slate-500">Số dư đầu kỳ: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{formatCurrency(soCai.soDuDauKy)}</strong></p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 text-center w-24">Ngày ghi sổ</th>
                  <th className="p-2.5 text-center w-28">Số chứng từ</th>
                  <th className="p-2.5">Diễn giải</th>
                  <th className="p-2.5 text-center w-24">TK đối ứng</th>
                  <th className="p-2.5 text-right w-32">Ghi Nợ</th>
                  <th className="p-2.5 text-right w-32">Ghi Có</th>
                  <th className="p-2.5 text-right w-32">Số dư lũy kế</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {soCai.danhSachDong.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="p-2 text-center text-slate-500">{formatDateVN(d.ngayGhiSo)}</td>
                    <td className="p-2 text-center font-bold text-blue-600 dark:text-blue-400">{d.soChungTu}</td>
                    <td className="p-2 text-slate-800 dark:text-slate-200">{d.dienGiai}</td>
                    <td className="p-2 text-center font-medium text-slate-500">{d.tkDoiUng}</td>
                    <td className="p-2 text-right tabular-nums text-slate-900 dark:text-slate-100">{d.soPhatSinhNo > 0 ? formatCurrency(d.soPhatSinhNo) : '-'}</td>
                    <td className="p-2 text-right tabular-nums text-slate-900 dark:text-slate-100">{d.soPhatSinhCo > 0 ? formatCurrency(d.soPhatSinhCo) : '-'}</td>
                    <td className="p-2 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(d.soDu)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-900 dark:text-slate-100 border-t-2 border-slate-300 dark:border-slate-700">
                <tr>
                  <td colSpan={4} className="p-2.5 text-center uppercase">Tổng phát sinh & Số dư cuối kỳ</td>
                  <td className="p-2.5 text-right tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(soCai.tongPhatSinhNo)}</td>
                  <td className="p-2.5 text-right tabular-nums text-blue-600 dark:text-blue-400">{formatCurrency(soCai.tongPhatSinhCo)}</td>
                  <td className="p-2.5 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{formatCurrency(soCai.soDuCuoiKy)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* B01-DN: Báo cáo tình hình tài chính */}
      {reportType === 'B01' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Mẫu số B01-DN</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">BÁO CÁO TÌNH HÌNH TÀI CHÍNH</h3>
            <p className="text-xs text-slate-500">Tại ngày {formatDateVN(toDate)} (Tổng cộng Tài sản mã 280 chuẩn TT99)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 w-20 text-center">Mã số</th>
                  <th className="p-2.5">Chỉ tiêu</th>
                  <th className="p-2.5 text-right w-40">Số cuối kỳ</th>
                  <th className="p-2.5 text-right w-40">Số đầu năm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {b01.danhSachChiTieu.map((c) => (
                  <tr key={c.maSo} className={cn(
                    c.isHeader
                        ? "bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-slate-100"
                        : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  )}>
                    <td className="p-2 text-center font-bold text-blue-600 dark:text-blue-400">{c.maSo}</td>
                    <td className={cn("p-2", c.isHeader ? "font-bold text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300 pl-6")}>{c.chiTieu}</td>
                    <td className="p-2 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">{formatCurrency(c.soCuoiKy)}</td>
                    <td className="p-2 text-right text-slate-400">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* B02-DN: Báo cáo kết quả hoạt động kinh doanh */}
      {reportType === 'B02' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Mẫu số B02-DN</span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH</h3>
            <p className="text-xs text-slate-500">Kỳ báo cáo: Từ {formatDateVN(fromDate)} đến {formatDateVN(toDate)}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-2.5 w-20 text-center">Mã số</th>
                  <th className="p-2.5">Chỉ tiêu</th>
                  <th className="p-2.5 text-right w-40">Kỳ này</th>
                  <th className="p-2.5 text-right w-40">Kỳ trước</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {b02.danhSachChiTieu.map((c) => (
                  <tr key={c.maSo} className={cn(
                    c.isHeader
                      ? "bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-900 dark:text-slate-100"
                      : "hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                  )}>
                    <td className="p-2 text-center font-bold text-blue-600 dark:text-blue-400">{c.maSo}</td>
                    <td className={cn("p-2", c.isHeader ? "font-bold text-slate-900 dark:text-slate-100" : "text-slate-700 dark:text-slate-300 pl-6")}>{c.chiTieu}</td>
                    <td className="p-2 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">{formatCurrency(c.kyNay)}</td>
                    <td className="p-2 text-right text-slate-400">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INTERACTIVE DRILL-DOWN SIDE DRAWER */}
      {drillDownAccount && drillDownSoCai && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-3xl xl:max-w-4xl h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div>
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">DRILL-DOWN SỔ CÁI S04-DN</span>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Tài khoản {drillDownAccount}
                </h3>
                <p className="text-xs text-slate-500">
                  Chi tiết chứng từ phát sinh trong kỳ {formatDateVN(fromDate)} ➔ {formatDateVN(toDate)}
                </p>
              </div>

              <button
                onClick={() => setDrillDownAccount(null)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex justify-between items-center text-xs">
                <span className="font-semibold text-blue-900 dark:text-blue-300">Tổng phát sinh Nợ: <strong className="tabular-nums">{formatCurrency(drillDownSoCai.tongPhatSinhNo)}</strong></span>
                <span className="font-semibold text-emerald-900 dark:text-emerald-300">Tổng phát sinh Có: <strong className="tabular-nums">{formatCurrency(drillDownSoCai.tongPhatSinhCo)}</strong></span>
              </div>

              {drillDownSoCai.danhSachDong.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Không có phát sinh nào trên tài khoản {drillDownAccount} trong khoảng thời gian đã chọn.
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2 w-20">Ngày</th>
                        <th className="p-2 w-24">Số CT</th>
                        <th className="p-2">Diễn giải</th>
                        <th className="p-2 text-right w-24">Nợ</th>
                        <th className="p-2 text-right w-24">Có</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {drillDownSoCai.danhSachDong.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 text-slate-500">{formatDateVN(d.ngayGhiSo)}</td>
                          <td className="p-2 font-bold text-blue-600 dark:text-blue-400">{d.soChungTu}</td>
                          <td className="p-2 text-slate-800 dark:text-slate-200">{d.dienGiai}</td>
                          <td className="p-2 text-right tabular-nums text-slate-900 dark:text-slate-100">{d.soPhatSinhNo > 0 ? formatCurrency(d.soPhatSinhNo) : '-'}</td>
                          <td className="p-2 text-right tabular-nums text-slate-900 dark:text-slate-100">{d.soPhatSinhCo > 0 ? formatCurrency(d.soPhatSinhCo) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setDrillDownAccount(null)}
                className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-bold"
              >
                Đóng (Esc)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL IN & XUẤT BÁO CÁO TOÀN DIỆN */}
      <BaoCaoPrintExportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        reportType={reportType}
        fromDate={fromDate}
        toDate={toDate}
        selectedAccount={selectedAccount}
        trialBalance={trialBalance}
        nhatKyChung={nhatKyChung}
        soCai={soCai}
        b01={b01}
        b02={b02}
        companyInfo={companyInfo}
      />
    </div>
  );
}
