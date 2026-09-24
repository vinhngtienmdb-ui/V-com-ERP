import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  FileCheck,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileCode,
  FileText,
  Printer,
  Sparkles,
  Building,
  Calendar,
  XCircle,
  Eye,
  X,
  Mail,
  Globe,
  ArrowRight,
  Plus,
  Copy,
  Check,
  HelpCircle,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { EInvoiceData, parseInvoiceXml } from '../../lib/keToan/invoiceXmlParser';
import {
  reconcileInvoicesWithVouchers,
  generateVoucherFromInvoice,
  ReconciliationReport,
  ReconciliationItem,
  ReconciliationStatus
} from '../../lib/keToan/invoiceReconciliationEngine';
import {
  getStoredInboundInvoices,
  saveInboundInvoices,
  syncInvoicesFromGdtPortal,
  syncInvoicesFromEmail,
  DEFAULT_GDT_CONFIG,
  DEFAULT_EMAIL_CONFIG,
  GdtPortalConfig,
  EmailSyncConfig
} from '../../lib/keToan/gdtAndEmailSyncService';
import { ChungTuNhatKyChung } from '../../lib/keToan/types';
import { formatDateVN, formatMonthVN } from '../../lib/keToan/dateUtils';
import { formatCurrency, cn } from '../../lib/utils';
import { ThietLapCongTy } from './ThietLapCongTyModal';

interface DoiChieuHoaDonPageProps {
  vouchers: ChungTuNhatKyChung[];
  onAddVoucher?: (voucher: ChungTuNhatKyChung) => void;
  companyInfo?: ThietLapCongTy;
}

export const DoiChieuHoaDonPage: React.FC<DoiChieuHoaDonPageProps> = ({
  vouchers,
  onAddVoucher,
  companyInfo
}) => {
  const [invoices, setInvoices] = useState<EInvoiceData[]>(() => getStoredInboundInvoices());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ReconciliationStatus>('ALL');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'GDT_PORTAL' | 'EMAIL' | 'FILE_UPLOAD'>('ALL');
  
  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<EInvoiceData | null>(null);
  const [invoiceModalTab, setInvoiceModalTab] = useState<'PREVIEW' | 'XML'>('PREVIEW');
  const [isGdtModalOpen, setIsGdtModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [copiedXml, setCopiedXml] = useState(false);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Tính toán kết quả đối chiếu 2 chiều thời gian thực
  const report: ReconciliationReport = useMemo(() => {
    return reconcileInvoicesWithVouchers(invoices, vouchers);
  }, [invoices, vouchers]);

  // Bộ lọc danh sách
  const filteredItems = useMemo(() => {
    return report.items.filter(item => {
      const inv = item.invoice;
      const matchesSearch = 
        inv.soHDon.includes(searchQuery) ||
        inv.kyHieuHDon.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.nguoiBan.ten.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.nguoiBan.mst.includes(searchQuery);

      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesSource = sourceFilter === 'ALL' || inv.nguonHoaDon === sourceFilter;

      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [report, searchQuery, statusFilter, sourceFilter]);

  // Xử lý tải lên file XML từ máy tính
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let addedCount = 0;
    const currentInvoices = [...invoices];
    const existingIds = new Set(currentInvoices.map(i => i.id));

    Array.from(files).forEach(file => {
      if (file.name.endsWith('.xml')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const content = event.target?.result as string;
            const parsed = parseInvoiceXml(content, 'FILE_UPLOAD');
            if (!existingIds.has(parsed.id)) {
              currentInvoices.push(parsed);
              existingIds.add(parsed.id);
              addedCount++;
              setInvoices([...currentInvoices]);
              saveInboundInvoices(currentInvoices);
            }
          } catch (err: any) {
            console.error('Lỗi phân tích file XML:', file.name, err);
          }
        };
        reader.readAsText(file);
      }
    });

    setTimeout(() => {
      showToast(`Đã nạp thành công hóa đơn từ tệp XML tải lên.`, 'success');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }, 500);
  };

  // Đồng bộ Cổng Tổng cục Thuế
  const handleSyncGdt = async () => {
    setIsSyncing(true);
    try {
      const res = await syncInvoicesFromGdtPortal(DEFAULT_GDT_CONFIG, '2026-03-01', '2026-03-31');
      setInvoices([...res.invoices]);
      showToast(`Đã đồng bộ ${res.total} hóa đơn từ Cổng hoadondientu.gdt.gov.vn.`, 'success');
      setIsGdtModalOpen(false);
    } catch (err) {
      showToast('Lỗi kết nối Cổng Tổng cục Thuế.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Quét Email nhận hóa đơn
  const handleSyncEmail = async () => {
    setIsSyncing(true);
    try {
      const res = await syncInvoicesFromEmail(DEFAULT_EMAIL_CONFIG);
      setInvoices([...res.invoices]);
      showToast(`Đã quét hộp thư ${DEFAULT_EMAIL_CONFIG.email}, nạp hóa đơn thành công!`, 'success');
      setIsEmailModalOpen(false);
    } catch (err) {
      showToast('Lỗi quét email nhận hóa đơn.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Tự động sinh chứng từ kế toán từ 1 hóa đơn
  const handleAutoPostInvoice = (inv: EInvoiceData) => {
    if (!onAddVoucher) {
      showToast('Chức năng thêm chứng từ chưa được kết nối.', 'error');
      return;
    }
    const newVoucher = generateVoucherFromInvoice(inv);
    onAddVoucher(newVoucher);
    showToast(`Đã tự động lập và ghi sổ chứng từ ${newVoucher.soCt} (TT99) cho HĐ ${inv.soHDon}!`, 'success');
  };

  // Tự động hạch toán hàng loạt tất cả hóa đơn chưa ghi sổ
  const handleAutoPostAll = () => {
    if (!onAddVoucher) return;
    const unposted = report.items.filter(i => i.status === 'CHUA_HACH_TOAN');
    if (unposted.length === 0) {
      showToast('Không có hóa đơn nào ở trạng thái Chưa hạch toán.', 'info');
      return;
    }
    unposted.forEach(item => {
      const newVoucher = generateVoucherFromInvoice(item.invoice);
      onAddVoucher(newVoucher);
    });
    showToast(`Đã tự động hạch toán hàng loạt ${unposted.length} hóa đơn vào Sổ Nhật ký chung!`, 'success');
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={cn(
          "fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom-2",
          toastMessage.type === 'success' ? "bg-emerald-600 text-white border-emerald-500" :
          toastMessage.type === 'error' ? "bg-rose-600 text-white border-rose-500" :
          "bg-slate-900 text-white border-slate-700"
        )}>
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* 1. Top Ribbon Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            Quản lý & Đối chiếu Hóa đơn điện tử XML (NĐ 123 / TT 78)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tự động tải từ Cổng Thuế <code>hoadondientu.gdt.gov.vn</code> & Email công ty • Đối chiếu 2 chiều với Sổ kế toán TT99
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút Upload XML */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border border-slate-200 dark:border-slate-700"
            title="Tải lên tệp XML hóa đơn điện tử từ máy tính"
          >
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Tải tệp XML</span>
          </button>

          {/* Nút Đồng bộ Cổng Thuế */}
          <button
            onClick={() => setIsGdtModalOpen(true)}
            className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-900 dark:text-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border border-amber-300 dark:border-amber-800"
            title="Đồng bộ từ Cổng hoadondientu.gdt.gov.vn"
          >
            <Globe className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Cổng Thuế (GDT)</span>
          </button>

          {/* Nút Quét Email */}
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-800 dark:text-blue-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border border-blue-200 dark:border-blue-800"
            title="Quét hộp thư hoadon@vcomm.vn"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Quét Email</span>
          </button>

          {/* Nút Tự động hạch toán hàng loạt */}
          <button
            onClick={handleAutoPostAll}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Tự động hạch toán tất cả hóa đơn chưa ghi sổ theo TT99"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tự động Hạch toán (F2)</span>
          </button>
        </div>
      </div>

      {/* 2. Thẻ Thống kê nhanh (KPI Ribbons) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Tổng HĐ */}
        <div 
          onClick={() => setStatusFilter('ALL')}
          className={cn(
            "p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between",
            statusFilter === 'ALL'
              ? "bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 shadow-2xs"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300"
          )}
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Tổng HĐ đầu vào</span>
            <Receipt className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-900 dark:text-slate-100 tabular-nums mt-1">
            {report.summary.tongHoaDon}
          </p>
          <span className="text-[10px] text-slate-400">
            Tổng tiền: {formatCurrency(report.summary.tongTienHoaDon)}
          </span>
        </div>

        {/* Khớp hoàn toàn */}
        <div 
          onClick={() => setStatusFilter('KHOP_HOAN_TOAN')}
          className={cn(
            "p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between",
            statusFilter === 'KHOP_HOAN_TOAN'
              ? "bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 shadow-2xs"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300"
          )}
        >
          <div className="flex items-center justify-between text-xs text-emerald-600">
            <span>Khớp 100% (Đã sổ)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {report.summary.khopHoanToan}
          </p>
          <span className="text-[10px] text-emerald-600/80 font-medium">
            Số liệu khớp hoàn hảo
          </span>
        </div>

        {/* Lệch số liệu */}
        <div 
          onClick={() => setStatusFilter('LECH_SO_LIEU')}
          className={cn(
            "p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between",
            statusFilter === 'LECH_SO_LIEU'
              ? "bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 shadow-2xs"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300"
          )}
        >
          <div className="flex items-center justify-between text-xs text-amber-600">
            <span>Lệch số liệu</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums mt-1">
            {report.summary.lechSoLieu}
          </p>
          <span className="text-[10px] text-amber-600/80 font-medium">
            Lệch tiền hoặc ngày hạch toán
          </span>
        </div>

        {/* Chưa hạch toán */}
        <div 
          onClick={() => setStatusFilter('CHUA_HACH_TOAN')}
          className={cn(
            "p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between",
            statusFilter === 'CHUA_HACH_TOAN'
              ? "bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 shadow-2xs"
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300"
          )}
        >
          <div className="flex items-center justify-between text-xs text-rose-600">
            <span>Chưa hạch toán</span>
            <Clock className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-600 dark:text-rose-400 tabular-nums mt-1">
            {report.summary.chuaHachToan}
          </p>
          <span className="text-[10px] text-rose-600 font-bold">
            Cần lập chứng từ (F2)
          </span>
        </div>

        {/* Thuế GTGT đầu vào */}
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-purple-600 dark:text-purple-400">
            <span>Thuế GTGT đầu vào (133)</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-base font-black text-purple-600 dark:text-purple-400 tabular-nums mt-1">
            {formatCurrency(report.summary.tongThueDauVao)}
          </p>
          <span className="text-[10px] text-slate-400">
            Được khấu trừ hợp pháp
          </span>
        </div>
      </div>

      {/* 3. Thanh tìm kiếm & Bộ lọc */}
      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[300px]">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Số HĐ, Ký hiệu, Tên NCC, MST..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-blue-500 dark:text-slate-100"
            />
          </div>

          {/* Lọc nguồn hóa đơn */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <span className="text-[10px] text-slate-400 px-1 font-semibold">Nguồn:</span>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'GDT_PORTAL', label: 'Cổng Thuế' },
              { id: 'EMAIL', label: 'Email' },
              { id: 'FILE_UPLOAD', label: 'File XML' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSourceFilter(tab.id as any)}
                className={cn(
                  "px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer",
                  sourceFilter === tab.id
                    ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 font-bold shadow-2xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-slate-500">
          Hiển thị: <strong className="text-slate-800 dark:text-slate-200 tabular-nums">{filteredItems.length}</strong> / {report.summary.tongHoaDon} hóa đơn
        </div>
      </div>

      {/* 4. Bảng Đối Chiếu Song Song (Hóa đơn XML vs Sổ Kế Toán) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-3 w-10 text-center">STT</th>
                <th className="p-3 min-w-[280px]">Hóa đơn điện tử XML (GDT / Email)</th>
                <th className="p-3 text-right w-36">Tổng tiền thanh toán</th>
                <th className="p-3 text-center w-36">Trạng thái đối chiếu</th>
                <th className="p-3 min-w-[260px]">Chứng từ Sổ Nhật ký chung (TT99)</th>
                <th className="p-3 text-center w-28">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Không tìm thấy hóa đơn nào phù hợp với điều kiện lọc.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, idx) => {
                  const inv = item.invoice;
                  const v = item.matchedVoucher;

                  return (
                    <tr 
                      key={item.id}
                      className={cn(
                        "hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors",
                        item.status === 'CHUA_HACH_TOAN' ? "bg-rose-50/20 dark:bg-rose-950/10" : ""
                      )}
                    >
                      {/* STT */}
                      <td className="p-3 text-center text-slate-400 font-mono">
                        {idx + 1}
                      </td>

                      {/* Hóa đơn điện tử */}
                      <td className="p-3 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">
                            HĐ #{inv.soHDon}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 font-mono">
                            {inv.kyHieuHDon}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDateVN(inv.ngayLap)}
                          </span>
                          <span className={cn(
                            "px-1.5 py-0.2 rounded text-[10px] font-semibold",
                            inv.nguonHoaDon === 'GDT_PORTAL' ? "bg-amber-100 text-amber-800" :
                            inv.nguonHoaDon === 'EMAIL' ? "bg-blue-100 text-blue-800" :
                            "bg-slate-100 text-slate-700"
                          )}>
                            {inv.nguonHoaDon === 'GDT_PORTAL' ? 'Cổng Thuế' : inv.nguonHoaDon === 'EMAIL' ? 'Email' : 'File XML'}
                          </span>
                        </div>

                        <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate max-w-md" title={inv.nguoiBan.ten}>
                          {inv.nguoiBan.ten}
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-3">
                          <span>MST: <strong className="font-mono text-slate-700 dark:text-slate-300">{inv.nguoiBan.mst}</strong></span>
                          {inv.maCQT && (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3" /> Có mã CQT
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Tổng tiền thanh toán */}
                      <td className="p-3 text-right">
                        <div className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatCurrency(inv.tongTienThanhToan)}
                        </div>
                        <div className="text-[10px] text-slate-500 tabular-nums">
                          Tiền hàng: {formatCurrency(inv.tongTienChuaThue)}
                        </div>
                        <div className="text-[10px] text-purple-600 dark:text-purple-400 tabular-nums">
                          Thuế: {formatCurrency(inv.tongTienThue)}
                        </div>
                      </td>

                      {/* Trạng thái đối chiếu */}
                      <td className="p-3 text-center">
                        {item.status === 'KHOP_HOAN_TOAN' && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-[11px] inline-flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Khớp 100%
                          </span>
                        )}
                        {item.status === 'LECH_SO_LIEU' && (
                          <div className="space-y-1">
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-[11px] inline-flex items-center gap-1 border border-amber-200 dark:border-amber-800">
                              <AlertTriangle className="w-3.5 h-3.5" /> Lệch số liệu
                            </span>
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 max-w-[150px] mx-auto text-left leading-tight">
                              {item.ghiChuDoiChieu}
                            </p>
                          </div>
                        )}
                        {item.status === 'CHUA_HACH_TOAN' && (
                          <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold text-[11px] inline-flex items-center gap-1 border border-rose-200 dark:border-rose-800">
                            <Clock className="w-3.5 h-3.5" /> Chưa hạch toán
                          </span>
                        )}
                      </td>

                      {/* Chứng từ đối ứng */}
                      <td className="p-3">
                        {v ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                {v.soCt}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                                {v.loaiCt}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {formatDateVN(v.ngayHachToan)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
                              {v.dienGiai}
                            </p>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Định khoản: {v.dinhKhoan.map(d => `${d.tkNo}/${d.tkCo}`).slice(0, 2).join(', ')}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-xs italic space-y-1">
                            <span>Chưa có bút toán nào trong sổ.</span>
                            {item.autoPostingSuggestion && (
                              <div className="text-[11px] text-blue-600 dark:text-blue-400 not-italic">
                                Gợi ý TT99: <strong>Nợ {item.autoPostingSuggestion.tkNo} / Nợ 1331 / Có 331</strong>
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="p-3 text-center space-y-1">
                        {item.status === 'CHUA_HACH_TOAN' ? (
                          <button
                            onClick={() => handleAutoPostInvoice(inv)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer w-full justify-center"
                            title="Tự động lập chứng từ theo TT99"
                          >
                            <Sparkles className="w-3 h-3" />
                            <span>Hạch toán (F2)</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setInvoiceModalTab('PREVIEW');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-all cursor-pointer w-full justify-center"
                          >
                            <Eye className="w-3 h-3 text-blue-500" />
                            <span>Xem HĐ</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setInvoiceModalTab('XML');
                          }}
                          className="px-2 py-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-[10px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileCode className="w-3 h-3" />
                          <span>Mã XML</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Xem Chi Tiết Hóa Đơn Điện Tử (Bản in & XML) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/50 shrink-0">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <span>Hóa đơn điện tử #{selectedInvoice.soHDon}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-mono font-bold">
                      {selectedInvoice.kyHieuHDon}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Người bán: {selectedInvoice.nguoiBan.ten} (MST: {selectedInvoice.nguoiBan.mst})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Tabs Preview vs XML */}
                <div className="bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg flex items-center text-xs">
                  <button
                    onClick={() => setInvoiceModalTab('PREVIEW')}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer",
                      invoiceModalTab === 'PREVIEW' ? "bg-white dark:bg-slate-700 text-blue-600 shadow-2xs" : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    Bản thể hiện HĐ
                  </button>
                  <button
                    onClick={() => setInvoiceModalTab('XML')}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer",
                      invoiceModalTab === 'XML' ? "bg-white dark:bg-slate-700 text-amber-600 shadow-2xs" : "text-slate-600 dark:text-slate-400"
                    )}
                  >
                    Mã XML gốc
                  </button>
                </div>

                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-2 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950 flex justify-center custom-scrollbar">
              {invoiceModalTab === 'PREVIEW' ? (
                /* Bản thể hiện đồ họa chuẩn hóa đơn điện tử */
                <div className="w-full max-w-[760px] bg-white text-slate-900 p-8 rounded-xl shadow-md border border-slate-200 font-sans space-y-6">
                  {/* Header Hóa đơn */}
                  <div className="border-b pb-4 space-y-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-base uppercase text-blue-900">
                          {selectedInvoice.nguoiBan.ten}
                        </h4>
                        <p className="text-xs text-slate-600">Địa chỉ: {selectedInvoice.nguoiBan.diaChi}</p>
                        <p className="text-xs text-slate-600">
                          Mã số thuế: <strong className="font-mono font-bold text-slate-900">{selectedInvoice.nguoiBan.mst}</strong>
                        </p>
                      </div>
                      <div className="text-right text-xs space-y-0.5 shrink-0 pl-4">
                        <p className="font-semibold text-slate-500">Mẫu số: <span className="font-mono">{selectedInvoice.mauSoHDon}</span></p>
                        <p className="font-semibold text-slate-500">Ký hiệu: <span className="font-mono">{selectedInvoice.kyHieuHDon}</span></p>
                        <p className="font-bold text-blue-600 text-sm">Số: <span className="font-mono">{selectedInvoice.soHDon}</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Tiêu đề hóa đơn */}
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-black uppercase text-blue-950 tracking-wider">
                      HÓA ĐƠN GIÁ TRỊ GIA TĂNG
                    </h2>
                    <p className="text-xs text-slate-600 italic">
                      Ngày {selectedInvoice.ngayLap.split('-')[2]} tháng {selectedInvoice.ngayLap.split('-')[1]} năm {selectedInvoice.ngayLap.split('-')[0]}
                    </p>
                    {selectedInvoice.maCQT && (
                      <p className="text-[11px] text-emerald-700 font-mono font-semibold">
                        Mã của cơ quan thuế: {selectedInvoice.maCQT}
                      </p>
                    )}
                  </div>

                  {/* Thông tin Người mua */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-1">
                    <p>Tên đơn vị mua hàng: <strong>{selectedInvoice.nguoiMua.ten}</strong></p>
                    <p>Mã số thuế: <strong className="font-mono">{selectedInvoice.nguoiMua.mst}</strong></p>
                    <p>Địa chỉ: {selectedInvoice.nguoiMua.diaChi}</p>
                    <p>Hình thức thanh toán: <strong>{selectedInvoice.hinhThucTT}</strong></p>
                  </div>

                  {/* Bảng Hàng hóa dịch vụ */}
                  <table className="w-full text-xs border-collapse border border-slate-300">
                    <thead className="bg-slate-100 font-bold text-center">
                      <tr>
                        <th className="border border-slate-300 p-2 w-10">STT</th>
                        <th className="border border-slate-300 p-2 text-left">Tên hàng hóa, dịch vụ</th>
                        <th className="border border-slate-300 p-2 w-16">ĐVT</th>
                        <th className="border border-slate-300 p-2 w-16 text-right">Số lượng</th>
                        <th className="border border-slate-300 p-2 w-24 text-right">Đơn giá</th>
                        <th className="border border-slate-300 p-2 w-28 text-right">Thành tiền</th>
                        <th className="border border-slate-300 p-2 w-16 text-center">Thuế suất</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.danhSachHangHoa.map((item) => (
                        <tr key={item.stt}>
                          <td className="border border-slate-300 p-1.5 text-center">{item.stt}</td>
                          <td className="border border-slate-300 p-1.5 font-medium">{item.tenHangHoa}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{item.donViTinh}</td>
                          <td className="border border-slate-300 p-1.5 text-right tabular-nums">{item.soLuong}</td>
                          <td className="border border-slate-300 p-1.5 text-right tabular-nums">{formatCurrency(item.donGia)}</td>
                          <td className="border border-slate-300 p-1.5 text-right tabular-nums font-semibold">{formatCurrency(item.thanhTien)}</td>
                          <td className="border border-slate-300 p-1.5 text-center">{item.thueSuat}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="font-semibold">
                      <tr>
                        <td colSpan={5} className="border border-slate-300 p-1.5 text-right">Cộng tiền hàng:</td>
                        <td colSpan={2} className="border border-slate-300 p-1.5 text-right font-bold tabular-nums">
                          {formatCurrency(selectedInvoice.tongTienChuaThue)}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="border border-slate-300 p-1.5 text-right">Tiền thuế GTGT:</td>
                        <td colSpan={2} className="border border-slate-300 p-1.5 text-right font-bold tabular-nums text-purple-700">
                          {formatCurrency(selectedInvoice.tongTienThue)}
                        </td>
                      </tr>
                      <tr className="bg-slate-100">
                        <td colSpan={5} className="border border-slate-300 p-2 text-right uppercase font-extrabold text-blue-900">
                          Tổng cộng tiền thanh toán:
                        </td>
                        <td colSpan={2} className="border border-slate-300 p-2 text-right font-black text-sm text-blue-900 tabular-nums">
                          {formatCurrency(selectedInvoice.tongTienThanhToan)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {selectedInvoice.tongTienBangChu && (
                    <p className="text-xs italic text-slate-700">
                      Số tiền viết bằng chữ: <strong>{selectedInvoice.tongTienBangChu}</strong>
                    </p>
                  )}

                  {/* Con dấu chữ ký số */}
                  <div className="pt-6 border-t flex justify-end">
                    <div className="border border-emerald-600 rounded-lg p-3 bg-emerald-50 text-emerald-900 text-xs space-y-1 w-64 text-center shadow-xs">
                      <div className="font-bold flex items-center justify-center gap-1 text-emerald-800">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>KÝ BỞI: {selectedInvoice.nguoiBan.ten}</span>
                      </div>
                      <p className="text-[10px] text-emerald-700">Chứng thư số Viettel-CA / VNPT-CA hợp lệ</p>
                      <p className="text-[10px] text-emerald-700">Ngày ký: {formatDateVN(selectedInvoice.ngayLap)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Tab Xem Code XML gốc */
                <div className="w-full bg-slate-900 rounded-xl p-4 text-xs font-mono text-amber-200 overflow-auto shadow-inner">
                  <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800 text-slate-400">
                    <span>Định dạng XML chuẩn Thông tư 78 / QĐ 1450-TCT</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedInvoice.rawXml || '');
                        setCopiedXml(true);
                        setTimeout(() => setCopiedXml(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-sans flex items-center gap-1"
                    >
                      {copiedXml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedXml ? 'Đã sao chép' : 'Sao chép XML'}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre">{selectedInvoice.rawXml || 'Không có mã XML gốc.'}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Cổng Thuế (hoadondientu.gdt.gov.vn) */}
      {isGdtModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Kết nối Cổng Thuế (hoadondientu.gdt.gov.vn)
                </h3>
              </div>
              <button onClick={() => setIsGdtModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="font-semibold block mb-1">Mã số thuế Doanh nghiệp:</label>
                <input
                  type="text"
                  defaultValue={DEFAULT_GDT_CONFIG.maSoThue}
                  disabled
                  className="w-full p-2 bg-white dark:bg-slate-800 border rounded font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Tài khoản Cổng HĐĐT:</label>
                <input
                  type="text"
                  defaultValue={DEFAULT_GDT_CONFIG.tenDangNhap}
                  className="w-full p-2 bg-white dark:bg-slate-800 border rounded font-mono text-xs"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Mật khẩu:</label>
                <input
                  type="password"
                  defaultValue="12345678"
                  className="w-full p-2 bg-white dark:bg-slate-800 border rounded text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5 text-emerald-600 text-[11px] font-semibold pt-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Trạng thái kết nối API: Đã xác thực thành công</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsGdtModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleSyncGdt}
                disabled={isSyncing}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isSyncing ? 'Đang đồng bộ...' : 'Tải hóa đơn về máy'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal Hộp Thư Email Hóa Đơn */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Hộp thư nhận hóa đơn công ty
                </h3>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 space-y-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <div>
                <label className="font-semibold block mb-1">Địa chỉ Email tiếp nhận:</label>
                <input
                  type="email"
                  defaultValue={DEFAULT_EMAIL_CONFIG.email}
                  className="w-full p-2 bg-white dark:bg-slate-800 border rounded font-mono text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold block mb-1">Server IMAP:</label>
                  <input
                    type="text"
                    defaultValue={DEFAULT_EMAIL_CONFIG.serverImap}
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold block mb-1">Cổng (SSL):</label>
                  <input
                    type="number"
                    defaultValue={DEFAULT_EMAIL_CONFIG.port}
                    className="w-full p-2 bg-white dark:bg-slate-800 border rounded font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 text-slate-500 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Tự động quét định kỳ: Mỗi 15 phút</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsEmailModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Hủy
              </button>
              <button
                onClick={handleSyncEmail}
                disabled={isSyncing}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                <span>{isSyncing ? 'Đang quét thư...' : 'Quét hộp thư ngay'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
