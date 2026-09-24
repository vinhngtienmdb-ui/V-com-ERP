import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  Search,
  Plus,
  Key,
  ShieldCheck,
  Layers,
  AlertTriangle,
  Building2,
  X,
  FileSpreadsheet,
  Package,
  ClipboardList,
  Sparkles,
  FileCheck
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { SigningDocument } from '../../data/hsmSignatureData';

export interface SigningWorkspaceProps {
  documents: SigningDocument[];
  onOpenStudio: (doc: SigningDocument) => void;
  onOpenVerify: (doc: SigningDocument) => void;
  onOpenUpload: () => void;
  onBatchSign: (selectedDocs: SigningDocument[]) => void;
}

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  contract: { label: 'Hợp đồng', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  e_invoice: { label: 'Hóa đơn điện tử', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  warehouse_slip: { label: 'Phiếu xuất kho', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  request: { label: 'Đề xuất chi phí', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  tax_report: { label: 'Tờ khai thuế', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  internal_decision: { label: 'Quyết định nội bộ', color: 'bg-purple-50 text-purple-700 border-purple-200' }
};

const FILTER_CATEGORIES = [
  { id: 'all', label: 'Tất cả' },
  { id: 'contract', label: 'Hợp đồng' },
  { id: 'e_invoice', label: 'Hóa đơn điện tử' },
  { id: 'warehouse_slip', label: 'Phiếu xuất kho' },
  { id: 'request', label: 'Đề xuất chi phí' },
  { id: 'internal_decision', label: 'Quyết định nội bộ' }
];

export const SigningWorkspace: React.FC<SigningWorkspaceProps> = ({
  documents,
  onOpenStudio,
  onOpenVerify,
  onOpenUpload,
  onBatchSign
}) => {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'signed'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Count documents by status
  const pendingCount = useMemo(() => {
    return documents.filter(d => d.status === 'pending').length;
  }, [documents]);

  const signedCount = useMemo(() => {
    return documents.filter(d => d.status === 'signed').length;
  }, [documents]);

  // Filter documents based on status, category, and search query
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      // 1. Status filter
      if (doc.status !== statusFilter) return false;

      // 2. Category filter
      if (categoryFilter !== 'all') {
        const matchesCategory =
          doc.category === categoryFilter ||
          (categoryFilter === 'internal_decision' && (doc.docType === 'decision' || doc.category === 'tax_report'));
        if (!matchesCategory) return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = doc.docCode.toLowerCase().includes(q);
        const matchesTitle = doc.title.toLowerCase().includes(q);
        const matchesRequester = doc.requestedBy.toLowerCase().includes(q);
        const matchesDept = doc.department.toLowerCase().includes(q);

        if (!matchesCode && !matchesTitle && !matchesRequester && !matchesDept) {
          return false;
        }
      }

      return true;
    });
  }, [documents, statusFilter, categoryFilter, searchQuery]);

  // Selected documents objects for batch signing
  const selectedDocs = useMemo(() => {
    return documents.filter(d => selectedDocIds.includes(d.id));
  }, [documents, selectedDocIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedDocs.reduce((sum, d) => sum + (d.amount || 0), 0);
  }, [selectedDocs]);

  // Header checkbox state
  const isAllSelected =
    filteredDocs.length > 0 && filteredDocs.every(d => selectedDocIds.includes(d.id));
  const isSomeSelected =
    filteredDocs.some(d => selectedDocIds.includes(d.id)) && !isAllSelected;

  const handleSelectAll = () => {
    if (isAllSelected) {
      // Uncheck all currently visible
      setSelectedDocIds(prev => prev.filter(id => !filteredDocs.some(d => d.id === id)));
    } else {
      // Check all currently visible
      setSelectedDocIds(prev => {
        const newSet = new Set(prev);
        filteredDocs.forEach(d => newSet.add(d.id));
        return Array.from(newSet);
      });
    }
  };

  const handleToggleDoc = (docId: string) => {
    setSelectedDocIds(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    );
  };

  const handleStatusChange = (status: 'pending' | 'signed') => {
    setStatusFilter(status);
    if (status === 'signed') {
      setSelectedDocIds([]);
    }
  };

  const getDocTypeIcon = (category: string) => {
    switch (category) {
      case 'e_invoice':
        return <FileSpreadsheet className="w-4 h-4 text-blue-600 flex-shrink-0" />;
      case 'warehouse_slip':
        return <Package className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      case 'request':
        return <ClipboardList className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case 'internal_decision':
      case 'tax_report':
        return <FileCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 relative pb-16 animate-in fade-in duration-200">
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status switcher tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStatusChange('pending')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                statusFilter === 'pending'
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
              )}
            >
              <Clock className="w-4 h-4" />
              {`Chờ tôi ký (${pendingCount})`}
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('signed')}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                statusFilter === 'signed'
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              {`Đã hoàn tất ký (${signedCount})`}
            </button>
          </div>

          {/* Search bar and Add Document button */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm mã tài liệu, tiêu đề, người tạo, phòng ban..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={onOpenUpload}
              className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-xs shadow-indigo-500/20 flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              + Trình Ký Văn Bản Mới
            </button>
          </div>
        </div>

        {/* Quick Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 border-t border-slate-100 scrollbar-none">
          {FILTER_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all",
                categoryFilter === cat.id
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold"
                  : "text-slate-600 hover:bg-slate-100 border border-transparent"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                {statusFilter === 'pending' && (
                  <th className="py-3 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Chọn tất cả văn bản"
                      checked={isAllSelected}
                      ref={el => {
                        if (el) el.indeterminate = isSomeSelected;
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                    />
                  </th>
                )}
                <th className="py-3 px-4">Tài liệu / Văn bản</th>
                <th className="py-3 px-4">Phân loại & Người tạo</th>
                <th className="py-3 px-4 text-center">Số tiền (VNĐ)</th>
                <th className="py-3 px-4 text-center">Yêu cầu ký</th>
                <th className="py-3 px-4 text-center">Thời gian</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td
                    colSpan={statusFilter === 'pending' ? 7 : 6}
                    className="py-12 text-center text-slate-500"
                  >
                    <div className="max-w-sm mx-auto space-y-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                        <Search className="w-6 h-6" />
                      </div>
                      <div className="font-bold text-slate-800 text-sm">
                        Không tìm thấy văn bản nào phù hợp
                      </div>
                      <p className="text-xs text-slate-400">
                        Vui lòng thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc phân loại văn bản.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => {
                  const isChecked = selectedDocIds.includes(doc.id);

                  return (
                    <tr
                      key={doc.id}
                      className={cn(
                        "hover:bg-slate-50/80 transition-colors",
                        isChecked && "bg-indigo-50/40"
                      )}
                    >
                      {/* Checkbox column (only in pending) */}
                      {statusFilter === 'pending' && (
                        <td className="py-3.5 px-4 text-center">
                          <input
                            type="checkbox"
                            aria-label={`Chọn văn bản ${doc.docCode}`}
                            checked={isChecked}
                            onChange={() => handleToggleDoc(doc.id)}
                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </td>
                      )}

                      {/* Tài liệu / Văn bản */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-bold text-slate-900 flex items-start gap-2.5">
                          <span className="mt-0.5">{getDocTypeIcon(doc.category)}</span>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="leading-snug">{doc.title}</span>
                              {doc.priority === 'urgent' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-200 inline-flex items-center gap-1 shrink-0">
                                  <AlertTriangle className="w-3 h-3" /> Hỏa tốc
                                </span>
                              )}
                              {doc.priority === 'high' && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                                  Ưu tiên cao
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                              <span>Mã số: {doc.docCode}</span>
                              <span>•</span>
                              <span>{doc.fileSize}</span>
                              <span>•</span>
                              <span>{doc.totalPages} trang</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phân loại & Người tạo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold border inline-block",
                              CATEGORY_MAP[doc.category]?.color || "bg-slate-100 text-slate-700 border-slate-200"
                            )}
                          >
                            {CATEGORY_MAP[doc.category]?.label || doc.category}
                          </span>
                          <div className="font-semibold text-slate-800 text-xs">{doc.requestedBy}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {doc.department}
                          </div>
                        </div>
                      </td>

                      {/* Số tiền (VNĐ) */}
                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800 whitespace-nowrap">
                        {doc.amount ? formatCurrency(doc.amount) : '-'}
                      </td>

                      {/* Yêu cầu ký */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[10px] font-bold border",
                            doc.signatureTypeNeeded === 'company_hsm'
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : doc.signatureTypeNeeded === 'personal_cert'
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-purple-50 text-purple-700 border-purple-200"
                          )}
                        >
                          {doc.signatureTypeNeeded === 'company_hsm'
                            ? 'Cloud HSM Doanh nghiệp'
                            : doc.signatureTypeNeeded === 'personal_cert'
                            ? 'Chứng thư Cá nhân'
                            : 'Ký duyệt 2 lớp'}
                        </span>
                      </td>

                      {/* Thời gian */}
                      <td className="py-3.5 px-4 text-center text-slate-500 text-[11px] whitespace-nowrap">
                        {doc.status === 'signed' && doc.signedBy?.signedAt
                          ? doc.signedBy.signedAt
                          : doc.createdDate}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {doc.status === 'pending' ? (
                          <button
                            type="button"
                            onClick={() => onOpenStudio(doc)}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs flex items-center gap-1.5 ml-auto transition-colors"
                          >
                            <Key className="w-3.5 h-3.5" /> Mở Bàn Ký
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onOpenVerify(doc)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 ml-auto transition-colors"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Xác Thực Chữ Ký
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Action Bar (Thanh tác vụ nổi) Ký Hàng Loạt */}
      {statusFilter === 'pending' && selectedDocIds.length > 0 && (
        <div
          data-testid="batch-floating-action-bar"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200 max-w-2xl w-[92%]"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-md">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white flex items-center gap-2">
                <span>Đã chọn {selectedDocs.length} văn bản</span>
                {totalSelectedAmount > 0 && (
                  <span className="text-emerald-400 font-mono">
                    (Tổng: {formatCurrency(totalSelectedAmount)})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 truncate">
                Sẵn sàng ký đồng loạt tốc độ cao qua Cloud HSM hoặc SmartCA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedDocIds([])}
              className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              Hủy chọn
            </button>
            <button
              type="button"
              onClick={() => onBatchSign(selectedDocs)}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition-all active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Ký Hàng Loạt Ngay ({selectedDocs.length} văn bản)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
