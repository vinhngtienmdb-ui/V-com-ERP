import React, { useState } from 'react';
import {
  FileText,
  FileBarChart,
  Printer,
  Download,
  Filter,
  Calendar,
  CheckCircle2,
  RefreshCw,
  Search,
  BookOpen,
  PieChart
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

export function BaoCaoTt99Page() {
  const [reportType, setReportType] = useState<'F01' | 'S03' | 'S04' | 'B01' | 'B02'>('F01');
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState('2026-01-31');
  const [selectedAccount, setSelectedAccount] = useState('112');
  const [searchFilter, setSearchFilter] = useState('');

  // Tính toán các báo cáo
  const trialBalance = lapBangCanDoiPhatSinh(fromDate, toDate, MOCK_SO_DU_DAU_KY, MOCK_CHUNG_TU_LIST);
  const nhatKyChung = xuatSoNhatKyChung(fromDate, toDate, MOCK_CHUNG_TU_LIST);
  const soCai = xuatSoCai(selectedAccount, fromDate, toDate, 850000000, MOCK_CHUNG_TU_LIST);
  const b01 = lapBaoCaoTinhHinhTaiChinh(trialBalance);
  const b02 = lapBaoCaoKetQuaKinhDoanh(fromDate, toDate, MOCK_CHUNG_TU_LIST);

  return (
    <div className="space-y-4">
      {/* Header & Report selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-blue-600" />
            Hệ thống Báo cáo Tài chính & Sổ kế toán TT99/2025/TT-BTC
          </h2>
          <p className="text-xs text-slate-500">
            Biểu mẫu chuẩn Phụ lục III & IV Thông tư 99/2025/TT-BTC, áp dụng từ 01/01/2026
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" /> In báo cáo
          </button>
          <button 
            onClick={() => alert('Đã xuất tệp bảng tính Excel chuẩn mẫu TT99.')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Xuất Excel
          </button>
        </div>
      </div>

      {/* Navigation tabs for reports */}
      <div className="flex gap-2 border-b border-slate-200 bg-white px-3 pt-2 rounded-t-xl overflow-x-auto">
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
              "px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors",
              reportType === tab.id
                ? "border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg"
                : "border-transparent text-slate-600 hover:text-slate-900"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-b-xl border border-slate-200 shadow-2xs text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-slate-500 font-medium">Từ ngày:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-slate-200 rounded px-2 py-1 text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Đến ngày:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-slate-200 rounded px-2 py-1 text-xs"
            />
          </div>

          {reportType === 'S04' && (
            <div className="flex items-center gap-1.5 pl-3 border-l border-slate-200">
              <span className="text-slate-500 font-medium">Tài khoản:</span>
              <select
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                className="border border-slate-200 rounded px-2 py-1 text-xs font-bold text-blue-600"
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
              placeholder="Lọc chỉ tiêu..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1 border border-slate-200 rounded-lg text-xs w-48"
            />
          </div>
        </div>
      </div>

      {/* REPORT CONTENT */}

      {/* F01-DN: Bảng cân đối số phát sinh */}
      {reportType === 'F01' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <span className="text-xs font-bold text-blue-600 uppercase">Mẫu số F01-DN</span>
              <h3 className="text-sm font-bold text-slate-900">BẢNG CÂN ĐỐI SỐ PHÁT SINH TÀI KHOẢN</h3>
              <p className="text-xs text-slate-500">Từ {fromDate} đến {toDate} — Đơn vị: Đồng Việt Nam</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2 py-1 rounded text-xs font-bold flex items-center gap-1",
                trialBalance.canDoiPhatSinh ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              )}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                {trialBalance.canDoiPhatSinh ? '3 Cặp Cân đối 100%' : 'Chưa cân đối'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th rowSpan={2} className="p-2.5 border-r border-slate-200 text-center w-20">Số hiệu TK</th>
                  <th rowSpan={2} className="p-2.5 border-r border-slate-200">Tên tài khoản</th>
                  <th colSpan={2} className="p-2 border-r border-slate-200 text-center">Số dư đầu kỳ</th>
                  <th colSpan={2} className="p-2 border-r border-slate-200 text-center">Số phát sinh trong kỳ</th>
                  <th colSpan={2} className="p-2 text-center">Số dư cuối kỳ</th>
                </tr>
                <tr className="border-t border-slate-200">
                  <th className="p-2 text-right border-r border-slate-200 w-28">Nợ</th>
                  <th className="p-2 text-right border-r border-slate-200 w-28">Có</th>
                  <th className="p-2 text-right border-r border-slate-200 w-28">Nợ</th>
                  <th className="p-2 text-right border-r border-slate-200 w-28">Có</th>
                  <th className="p-2 text-right border-r border-slate-200 w-28">Nợ</th>
                  <th className="p-2 text-right w-28">Có</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trialBalance.danhSachTk
                  .filter(t => !searchFilter || t.maTk.includes(searchFilter) || t.tenTk.toLowerCase().includes(searchFilter.toLowerCase()))
                  .map((tk) => (
                    <tr key={tk.maTk} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-2.5 font-bold text-blue-600 text-center border-r border-slate-100">{tk.maTk}</td>
                      <td className="p-2.5 font-medium text-slate-800 border-r border-slate-100">{tk.tenTk}</td>
                      <td className="p-2 text-right border-r border-slate-100 text-slate-600">{tk.duNoDauKy > 0 ? formatCurrency(tk.duNoDauKy) : '-'}</td>
                      <td className="p-2 text-right border-r border-slate-100 text-slate-600">{tk.duCoDauKy > 0 ? formatCurrency(tk.duCoDauKy) : '-'}</td>
                      <td className="p-2 text-right border-r border-slate-100 font-semibold text-slate-800">{tk.phatSinhNo > 0 ? formatCurrency(tk.phatSinhNo) : '-'}</td>
                      <td className="p-2 text-right border-r border-slate-100 font-semibold text-slate-800">{tk.phatSinhCo > 0 ? formatCurrency(tk.phatSinhCo) : '-'}</td>
                      <td className="p-2 text-right border-r border-slate-100 font-bold text-emerald-700">{tk.duNoCuoiKy > 0 ? formatCurrency(tk.duNoCuoiKy) : '-'}</td>
                      <td className="p-2 text-right font-bold text-emerald-700">{tk.duCoCuoiKy > 0 ? formatCurrency(tk.duCoCuoiKy) : '-'}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-slate-100/90 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={2} className="p-2.5 text-center uppercase tracking-wider">Tổng cộng</td>
                  <td className="p-2 text-right border-r border-slate-200">{formatCurrency(trialBalance.tongDuNoDauKy)}</td>
                  <td className="p-2 text-right border-r border-slate-200">{formatCurrency(trialBalance.tongDuCoDauKy)}</td>
                  <td className="p-2 text-right border-r border-slate-200 text-blue-700">{formatCurrency(trialBalance.tongPhatSinhNo)}</td>
                  <td className="p-2 text-right border-r border-slate-200 text-blue-700">{formatCurrency(trialBalance.tongPhatSinhCo)}</td>
                  <td className="p-2 text-right border-r border-slate-200 text-emerald-700">{formatCurrency(trialBalance.tongDuNoCuoiKy)}</td>
                  <td className="p-2 text-right text-emerald-700">{formatCurrency(trialBalance.tongDuCoCuoiKy)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* S03-DN: Sổ Nhật ký chung */}
      {reportType === 'S03' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs font-bold text-blue-600 uppercase">Mẫu số S03-DN</span>
            <h3 className="text-sm font-bold text-slate-900">SỔ NHẬT KÝ CHUNG</h3>
            <p className="text-xs text-slate-500">Ghi chép toàn bộ nghiệp vụ kinh tế tài chính phát sinh theo trình tự thời gian</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
                {nhatKyChung.danhSachDong.map((d) => (
                  <tr key={d.stt} className="hover:bg-slate-50/80">
                    <td className="p-2 text-center text-slate-500">{d.stt}</td>
                    <td className="p-2 text-center text-slate-700">{d.ngayGhiSo}</td>
                    <td className="p-2 text-center font-bold text-blue-600">{d.soChungTu}</td>
                    <td className="p-2 text-center text-slate-600">{d.ngayChungTu}</td>
                    <td className="p-2 text-slate-800">{d.dienGiai}</td>
                    <td className="p-2 text-center font-mono font-medium text-slate-600">{d.tkDoiUng}</td>
                    <td className="p-2 text-right font-medium text-slate-900">{d.soPhatSinhNo > 0 ? formatCurrency(d.soPhatSinhNo) : '-'}</td>
                    <td className="p-2 text-right font-medium text-slate-900">{d.soPhatSinhCo > 0 ? formatCurrency(d.soPhatSinhCo) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={6} className="p-2.5 text-center uppercase">Tổng cộng phát sinh</td>
                  <td className="p-2.5 text-right text-blue-700">{formatCurrency(nhatKyChung.tongPhatSinhNo)}</td>
                  <td className="p-2.5 text-right text-blue-700">{formatCurrency(nhatKyChung.tongPhatSinhCo)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* S04-DN: Sổ Cái */}
      {reportType === 'S04' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs font-bold text-blue-600 uppercase">Mẫu số S04-DN</span>
            <h3 className="text-sm font-bold text-slate-900">SỔ CÁI TÀI KHOẢN {soCai.maTk}</h3>
            <p className="text-xs text-slate-500">Số dư đầu kỳ: <strong className="text-slate-800">{formatCurrency(soCai.soDuDauKy)}</strong></p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
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
              <tbody className="divide-y divide-slate-100">
                {soCai.danhSachDong.map((d, i) => (
                  <tr key={i} className="hover:bg-slate-50/80">
                    <td className="p-2 text-center text-slate-700">{d.ngayGhiSo}</td>
                    <td className="p-2 text-center font-bold text-blue-600">{d.soChungTu}</td>
                    <td className="p-2 text-slate-800">{d.dienGiai}</td>
                    <td className="p-2 text-center font-mono font-medium text-slate-600">{d.tkDoiUng}</td>
                    <td className="p-2 text-right font-medium text-slate-900">{d.soPhatSinhNo > 0 ? formatCurrency(d.soPhatSinhNo) : '-'}</td>
                    <td className="p-2 text-right font-medium text-slate-900">{d.soPhatSinhCo > 0 ? formatCurrency(d.soPhatSinhCo) : '-'}</td>
                    <td className="p-2 text-right font-bold text-emerald-700">{formatCurrency(d.soDu)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={4} className="p-2.5 text-center uppercase">Tổng phát sinh & Số dư cuối kỳ</td>
                  <td className="p-2.5 text-right text-blue-700">{formatCurrency(soCai.tongPhatSinhNo)}</td>
                  <td className="p-2.5 text-right text-blue-700">{formatCurrency(soCai.tongPhatSinhCo)}</td>
                  <td className="p-2.5 text-right text-emerald-700">{formatCurrency(soCai.soDuCuoiKy)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* B01-DN: Báo cáo tình hình tài chính */}
      {reportType === 'B01' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs font-bold text-blue-600 uppercase">Mẫu số B01-DN</span>
            <h3 className="text-sm font-bold text-slate-900">BÁO CÁO TÌNH HÌNH TÀI CHÍNH</h3>
            <p className="text-xs text-slate-500">Tại ngày {toDate} (Tổng cộng Tài sản mã 280 chuẩn TT99)</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-20 text-center">Mã số</th>
                  <th className="p-2.5">Chỉ tiêu</th>
                  <th className="p-2.5 text-right w-40">Số cuối kỳ</th>
                  <th className="p-2.5 text-right w-40">Số đầu năm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {b01.danhSachChiTieu.map((c) => (
                  <tr key={c.maSo} className={cn(
                    c.isHeader ? "bg-slate-50 font-bold text-slate-900" : "hover:bg-slate-50/60"
                  )}>
                    <td className="p-2 text-center font-mono font-bold text-blue-600">{c.maSo}</td>
                    <td className={cn("p-2", c.isHeader ? "font-bold text-slate-900" : "text-slate-700 pl-6")}>{c.chiTieu}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(c.soCuoiKy)}</td>
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/50">
            <span className="text-xs font-bold text-blue-600 uppercase">Mẫu số B02-DN</span>
            <h3 className="text-sm font-bold text-slate-900">BÁO CÁO KẾT QUẢ HOẠT ĐỘNG KINH DOANH</h3>
            <p className="text-xs text-slate-500">Kỳ báo cáo: Từ {fromDate} đến {toDate}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2.5 w-20 text-center">Mã số</th>
                  <th className="p-2.5">Chỉ tiêu</th>
                  <th className="p-2.5 text-right w-40">Kỳ này</th>
                  <th className="p-2.5 text-right w-40">Kỳ trước</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {b02.danhSachChiTieu.map((c) => (
                  <tr key={c.maSo} className={cn(
                    c.isHeader ? "bg-slate-50 font-bold text-slate-900" : "hover:bg-slate-50/60"
                  )}>
                    <td className="p-2 text-center font-mono font-bold text-blue-600">{c.maSo}</td>
                    <td className={cn("p-2", c.isHeader ? "font-bold text-slate-900" : "text-slate-700 pl-6")}>{c.chiTieu}</td>
                    <td className="p-2 text-right font-bold text-slate-900">{formatCurrency(c.kyNay)}</td>
                    <td className="p-2 text-right text-slate-400">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
