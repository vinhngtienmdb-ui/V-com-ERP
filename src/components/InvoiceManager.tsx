import React, { useState } from 'react';
import {
  FileCheck,
  Receipt,
  Search,
  Filter,
  Download,
  Plus,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  FileCode,
  FileText,
  Printer,
  Sparkles,
  RefreshCw,
  Building,
  Calendar,
  XCircle,
  Eye,
  X
} from 'lucide-react';

interface Invoice {
  id: string;
  templateCode: string; // Ký hiệu: 1C26TBB
  invoiceNumber: string; // Số hóa đơn: 00000124
  customerName: string;
  customerTaxCode: string;
  issueDate: string;
  preTaxAmount: number;
  vatAmount: number;
  totalAmount: number;
  signStatus: 'signed' | 'unsigned';
  cqtStatus: 'approved' | 'pending' | 'rejected' | 'adjusted' | 'replaced';
  cqtCode?: string; // Mã của cơ quan thuế
  signer: string;
  signTime: string;
}

export const InvoiceManager: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: 'INV-2026-001',
      templateCode: '1C26TBB',
      invoiceNumber: '00000452',
      customerName: 'CÔNG TY TNHH PHÁT TRIỂN CÔNG NGHỆ ALPHA TECH',
      customerTaxCode: '0108992345',
      issueDate: '16/09/2026',
      preTaxAmount: 45000000,
      vatAmount: 4500000,
      totalAmount: 49500000,
      signStatus: 'signed',
      cqtStatus: 'approved',
      cqtCode: 'T26-00014829104',
      signer: 'VComm eSign HSM Cloud',
      signTime: '16/09/2026 10:24:12'
    },
    {
      id: 'INV-2026-002',
      templateCode: '1C26TBB',
      invoiceNumber: '00000453',
      customerName: 'TẬP ĐOÀN BÁN LẺ TIÊU DÙNG VIỆT SAO',
      customerTaxCode: '0312456789',
      issueDate: '16/09/2026',
      preTaxAmount: 120000000,
      vatAmount: 12000000,
      totalAmount: 132000000,
      signStatus: 'signed',
      cqtStatus: 'approved',
      cqtCode: 'T26-00014829105',
      signer: 'Viettel-CA Cloud HSM',
      signTime: '16/09/2026 14:15:08'
    },
    {
      id: 'INV-2026-003',
      templateCode: '1C26TBB',
      invoiceNumber: '00000454',
      customerName: 'CÔNG TY CỔ PHẦN LOGISTICS VẬN TẢI BIỂN ĐÔNG',
      customerTaxCode: '0101345678',
      issueDate: '17/09/2026',
      preTaxAmount: 28500000,
      vatAmount: 2850000,
      totalAmount: 31350000,
      signStatus: 'signed',
      cqtStatus: 'pending',
      cqtCode: 'Đang gửi TCT...',
      signer: 'VComm eSign HSM Cloud',
      signTime: '17/09/2026 09:05:22'
    },
    {
      id: 'INV-2026-004',
      templateCode: '1C26TBB',
      invoiceNumber: '00000455',
      customerName: 'CÔNG TY TNHH XÂY DỰNG & NỘI THẤT HÒA PHÁT',
      customerTaxCode: '0106789012',
      issueDate: '17/09/2026',
      preTaxAmount: 64000000,
      vatAmount: 6400000,
      totalAmount: 70400000,
      signStatus: 'unsigned',
      cqtStatus: 'pending',
      signer: 'Chưa ký số',
      signTime: '-'
    },
    {
      id: 'INV-2026-005',
      templateCode: '1C26TBB',
      invoiceNumber: '00000450',
      customerName: 'CÔNG TY CỔ PHẦN ĐẦU TƯ THƯƠNG MẠI AN PHÚ',
      customerTaxCode: '0309998877',
      issueDate: '14/09/2026',
      preTaxAmount: 18000000,
      vatAmount: 1800000,
      totalAmount: 19800000,
      signStatus: 'signed',
      cqtStatus: 'adjusted',
      cqtCode: 'T26-00014811902',
      signer: 'VComm eSign HSM Cloud',
      signTime: '14/09/2026 16:20:00'
    }
  ]);

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.includes(searchQuery) ||
                          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.customerTaxCode.includes(searchQuery) ||
                          (inv.cqtCode && inv.cqtCode.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = selectedStatusFilter === 'ALL' || inv.cqtStatus === selectedStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSignInvoice = (id: string) => {
    setInvoices(prev => prev.map(inv => {
      if (inv.id === id) {
        return {
          ...inv,
          signStatus: 'signed',
          signer: 'VComm eSign HSM Cloud (Đã xác thực)',
          signTime: new Date().toLocaleString('vi-VN'),
          cqtStatus: 'approved',
          cqtCode: `T26-0001${Math.floor(1000000 + Math.random() * 9000000)}`
        };
      }
      return inv;
    }));
    showToast('Đã ký số điện tử HSM thành công và được Tổng cục Thuế cấp mã CQT!');
  };

  const getCqtBadge = (status: Invoice['cqtStatus']) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" />Đã cấp mã CQT</span>;
      case 'pending':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 flex items-center gap-1 w-fit"><Clock className="w-3 h-3" />Đang chờ cấp mã</span>;
      case 'adjusted':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/80 flex items-center gap-1 w-fit"><RefreshCw className="w-3 h-3" />Đã điều chỉnh</span>;
      case 'replaced':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" />Đã thay thế</span>;
      case 'rejected':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/80 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" />Từ chối cấp mã</span>;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const totalPreTax = invoices.reduce((s, i) => s + i.preTaxAmount, 0);
  const totalVAT = invoices.reduce((s, i) => s + i.vatAmount, 0);
  const totalRevenue = invoices.reduce((s, i) => s + i.totalAmount, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Phân hệ Hóa đơn Điện tử VComm Invoice - Nghị định 123 & TT 78</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Quản trị Hóa đơn Điện tử (e-Invoice)
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/80 font-mono">
              Ký hiệu 1C26TBB
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Phát hành, Ký số HSM Cloud tập trung, truyền nhận dữ liệu trực tiếp với Cổng Thông tin Hóa đơn Tổng cục Thuế.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => showToast('Đang đồng bộ trạng thái cấp mã từ máy chủ Tổng cục Thuế (TCT)...')}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200/80 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Đồng bộ CQT
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Lập hóa đơn mới
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tổng doanh thu xuất HĐ</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900">{formatCurrency(totalRevenue)}</div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">
              Tiền hàng: {formatCurrency(totalPreTax)}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Thuế GTGT đầu ra (VAT 10%)</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-slate-900">{formatCurrency(totalVAT)}</div>
            <div className="text-[11px] text-blue-600 mt-1 font-semibold">
              Tự động kết chuyển vào Tờ khai TT80
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Đã cấp mã CQT thành công</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-emerald-700">
              {invoices.filter(i => i.cqtStatus === 'approved').length} / {invoices.length} HĐ
            </div>
            <div className="text-[11px] text-slate-500 mt-1 font-medium">Tỷ lệ hợp lệ 100%</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Chứng thư số HSM Cloud</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xs font-bold text-slate-900">VComm eSign Server CA</div>
            <div className="text-[11px] text-emerald-700 mt-1 font-semibold">Hạn dùng: 31/12/2028 (Hợp lệ)</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm số HĐ, MST khách, mã CQT..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 w-64 transition"
            />
          </div>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 py-2 px-3 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="ALL">Tất cả trạng thái CQT</option>
            <option value="approved">Đã cấp mã CQT</option>
            <option value="pending">Chờ cấp mã / Chưa ký</option>
            <option value="adjusted">Đã điều chỉnh</option>
            <option value="replaced">Đã thay thế</option>
          </select>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>Ký hiệu mẫu hóa đơn áp dụng:</span>
          <span className="font-mono px-2.5 py-0.5 bg-slate-100 rounded-md border border-slate-200 text-emerald-700 font-bold">
            1C26TBB
          </span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Ký hiệu & Số HĐ</th>
                <th className="p-3.5">Ngày lập</th>
                <th className="p-3.5">Khách hàng & Mã số thuế</th>
                <th className="p-3.5">Tổng tiền thanh toán</th>
                <th className="p-3.5">Trạng thái CQT</th>
                <th className="p-3.5">Mã cơ quan thuế</th>
                <th className="p-3.5">Chữ ký số</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3.5">
                    <div className="font-mono font-bold text-slate-900 text-sm">{inv.invoiceNumber}</div>
                    <div className="font-mono text-[11px] text-emerald-700 font-semibold">{inv.templateCode}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {inv.issueDate}
                    </span>
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <div className="font-bold text-slate-900 truncate">{inv.customerName}</div>
                    <div className="text-[11px] font-mono text-slate-500">MST: {inv.customerTaxCode}</div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900">{formatCurrency(inv.totalAmount)}</div>
                    <div className="text-[11px] text-slate-500">VAT: {formatCurrency(inv.vatAmount)}</div>
                  </td>
                  <td className="p-3.5">
                    {getCqtBadge(inv.cqtStatus)}
                  </td>
                  <td className="p-3.5">
                    <div className="font-mono text-[11px] text-slate-700 font-semibold">
                      {inv.cqtCode || '---'}
                    </div>
                  </td>
                  <td className="p-3.5">
                    {inv.signStatus === 'signed' ? (
                      <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {inv.signer}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Chờ ký số
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {inv.signStatus === 'unsigned' && (
                        <button
                          onClick={() => handleSignInvoice(inv.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                        >
                          <Send className="w-3 h-3" />
                          Ký số HSM
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                        title="Xem chi tiết hóa đơn"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => showToast(`Đang tải bản thể hiện PDF hóa đơn ${inv.invoiceNumber}...`)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                        title="Tải PDF"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => showToast(`Đang xuất file XML gốc hóa đơn có mã CQT ${inv.cqtCode}...`)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                        title="Tải XML gốc"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <span className="text-xs text-emerald-700 font-bold uppercase tracking-wider">Bản thể hiện Hóa đơn Điện tử</span>
                <h3 className="text-xl font-black text-slate-900 font-mono">
                  Số: {selectedInvoice.invoiceNumber} | Mẫu: {selectedInvoice.templateCode}
                </h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Header Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-start">
                <div>
                  <div className="text-slate-500 font-medium">Đơn vị bán hàng:</div>
                  <div className="font-bold text-slate-900 text-sm">CÔNG TY CỔ PHẦN CÔNG NGHỆ THƯƠNG MẠI VCOMM</div>
                  <div className="text-slate-600 mt-1">Mã số thuế: 0109988776</div>
                  <div className="text-slate-500">Địa chỉ: Tòa nhà VComm Innovation, Cầu Giấy, Hà Nội</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-500 font-medium">Ngày lập:</div>
                  <div className="font-bold text-slate-900">{selectedInvoice.issueDate}</div>
                  <div className="mt-2">{getCqtBadge(selectedInvoice.cqtStatus)}</div>
                </div>
              </div>

              {/* Customer Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="text-slate-500 font-medium mb-1">Khách hàng / Người mua hàng:</div>
                <div className="font-bold text-slate-900 text-sm">{selectedInvoice.customerName}</div>
                <div className="font-mono text-emerald-700 mt-1 font-bold">Mã số thuế: {selectedInvoice.customerTaxCode}</div>
              </div>

              {/* Amount Breakdown */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Cộng tiền hàng (chưa bao gồm VAT):</span>
                  <span className="font-bold font-mono">{formatCurrency(selectedInvoice.preTaxAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Thuế suất GTGT 10%:</span>
                  <span className="font-bold font-mono">{formatCurrency(selectedInvoice.vatAmount)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-900 font-black text-sm">
                  <span>Tổng tiền thanh toán (bằng số):</span>
                  <span className="text-emerald-700 font-mono text-base">{formatCurrency(selectedInvoice.totalAmount)}</span>
                </div>
              </div>

              {/* Verification and Signing */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Mã xác thực của Cơ quan Thuế (CQT):
                </div>
                <div className="font-mono font-bold text-slate-900 text-sm">{selectedInvoice.cqtCode || 'Chưa cấp'}</div>
                <div className="text-[11px] text-emerald-800 mt-1 font-medium">
                  Ký bởi: {selectedInvoice.signer} • Lúc: {selectedInvoice.signTime}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast('Đang tạo hóa đơn điều chỉnh sai sót theo Điều 19 NĐ 123...')}
                  className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-xl transition"
                >
                  Lập HĐ điều chỉnh
                </button>
                <button
                  onClick={() => showToast(`Đã xuất và tải PDF hóa đơn số ${selectedInvoice.invoiceNumber}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  <Download className="w-4 h-4" />
                  Tải PDF bản thể hiện
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleUp">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Lập Hóa Đơn Điện Tử Mới (1C26TBB)
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Tên đơn vị người mua / Doanh nghiệp</label>
                <input
                  type="text"
                  placeholder="VD: CÔNG TY CỔ PHẦN CÔNG NGHỆ THỦ ĐÔ..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Mã số thuế người mua</label>
                  <input
                    type="text"
                    placeholder="VD: 0108899221"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 mb-1 font-bold">Hình thức thanh toán</label>
                  <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:border-emerald-500">
                    <option>Chuyển khoản (TM/CK)</option>
                    <option>Tiền mặt</option>
                    <option>Cấn trừ công nợ</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-slate-700 mb-1 font-bold">Tổng tiền thanh toán (VNĐ)</label>
                <input
                  type="number"
                  placeholder="VD: 55000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/60">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl hover:bg-slate-300 transition text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  showToast('Đã lập hóa đơn nháp thành công! Bạn có thể Ký số HSM bất kỳ lúc nào.');
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition font-bold text-xs shadow-xs"
              >
                Lập hóa đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
