import React, { useState, useMemo } from 'react';
import {
  Lock,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Key,
  Server,
  FileText,
  Globe,
  Filter,
  Layers,
  Database
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { HSMAuditLog } from '../../data/hsmSignatureData';

export interface SignatureAuditLogsTabProps {
  logs: HSMAuditLog[];
}

export const SignatureAuditLogsTab: React.FC<SignatureAuditLogsTabProps> = ({ logs }) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [exportNotification, setExportNotification] = useState<string | null>(null);

  // Filter logs based on type and search query
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Event filter
      if (filterType === 'hsm') {
        const isHsm = 
          log.action.toLowerCase().includes('hsm') || 
          log.performedBy.toLowerCase().includes('hsm') ||
          log.performedBy.toLowerCase().includes('auto-sign');
        if (!isHsm) return false;
      } else if (filterType === 'personal') {
        const isPersonal = 
          log.action.toLowerCase().includes('cá nhân') || 
          log.action.toLowerCase().includes('smartca') ||
          log.action.toLowerCase().includes('từ xa') ||
          log.performedBy.toLowerCase().includes('tổng giám đốc') ||
          log.performedBy.toLowerCase().includes('hoàng');
        if (!isPersonal) return false;
      } else if (filterType === 'issue') {
        const isIssue = 
          log.action.toLowerCase().includes('cấp') || 
          log.action.toLowerCase().includes('cấp phát') ||
          log.targetDocCode.toLowerCase().includes('staff-cert');
        if (!isIssue) return false;
      } else if (filterType === 'revoke_renew') {
        const isRevokeRenew = 
          log.action.toLowerCase().includes('thu hồi') || 
          log.action.toLowerCase().includes('gia hạn') ||
          log.action.toLowerCase().includes('khóa') ||
          log.action.toLowerCase().includes('tạm khóa');
        if (!isRevokeRenew) return false;
      }

      // Search query filter (hash, docCode, performedBy, action, ipAddress)
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesHash = log.hashSHA256.toLowerCase().includes(q);
        const matchesDoc = log.targetDocCode.toLowerCase().includes(q);
        const matchesUser = log.performedBy.toLowerCase().includes(q);
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesIp = log.ipAddress.toLowerCase().includes(q);

        return matchesHash || matchesDoc || matchesUser || matchesAction || matchesIp;
      }

      return true;
    });
  }, [logs, filterType, searchQuery]);

  // Copy hash with 1-click feedback
  const handleCopyHash = (hash: string) => {
    navigator.clipboard?.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => {
      setCopiedHash(null);
    }, 2000);
  };

  // Export audit logs to CSV
  const handleExportCSV = () => {
    try {
      const headers = [
        'Thời gian (TSA)',
        'Hành động',
        'Mã văn bản',
        'Chủ thể thực hiện',
        'Serial chứng thư',
        'Thuật toán',
        'Mã băm SHA-256',
        'Địa chỉ IP',
        'Trạng thái'
      ];

      const csvRows = filteredLogs.map(log => [
        `"${log.timestamp.replace(/"/g, '""')}"`,
        `"${log.action.replace(/"/g, '""')}"`,
        `"${log.targetDocCode.replace(/"/g, '""')}"`,
        `"${log.performedBy.replace(/"/g, '""')}"`,
        `"${log.certSerial.replace(/"/g, '""')}"`,
        `"${log.algorithm.replace(/"/g, '""')}"`,
        `"${log.hashSHA256.replace(/"/g, '""')}"`,
        `"${log.ipAddress.replace(/"/g, '""')}"`,
        `"${log.status === 'success' ? 'Thành công' : log.status === 'warning' ? 'Cảnh báo' : 'Thất bại'}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...csvRows.map(r => r.join(','))].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.setAttribute('download', `vcomm_signature_audit_logs_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportNotification('Đã xuất file log audit (.CSV) thành công!');
    } catch (err) {
      console.error('Lỗi khi xuất file log audit:', err);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in" data-testid="signature-audit-logs-tab">
      {/* Export Notification Alert */}
      {exportNotification && (
        <div 
          className="bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl p-4 flex items-center gap-3 text-xs animate-in fade-in shadow-xs"
          data-testid="audit-export-success-alert"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <span className="font-bold text-sm block">{exportNotification}</span>
            <span className="text-emerald-700">
              Dữ liệu nhật ký kiểm toán đã được trích xuất với chuẩn UTF-8 BOM, sẵn sàng mở bằng Excel hoặc phần mềm kiểm toán.
            </span>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base md:text-lg font-black text-slate-900 tracking-tight">
              Nhật Ký Truy Vết Ký Số & Cloud HSM (Audit Trail)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ghi nhận chi tiết mọi giao dịch mật mã học, mã băm SHA-256 và dấu thời gian TSA tuân thủ Nghị định 130/2018/NĐ-CP và Luật Giao dịch điện tử 2023.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-98 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-2 flex-shrink-0"
          data-testid="export-audit-csv-button"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Xuất Log Audit (.CSV / Excel)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/90 p-4 rounded-2xl border border-slate-200">
        {/* Event Type Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-bold text-slate-600 mr-1 flex-shrink-0">Sự kiện:</span>
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'hsm', label: 'Ký HSM' },
            { id: 'personal', label: 'Ký cá nhân' },
            { id: 'issue', label: 'Cấp phát' },
            { id: 'revoke_renew', label: 'Thu hồi / Gia hạn' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap",
                filterType === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm mã băm SHA-256, mã văn bản, người ký, IP..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
            data-testid="audit-search-input"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" data-testid="audit-logs-table">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Thời gian (TSA)</th>
                <th className="py-3.5 px-4">Hành động & Mã văn bản</th>
                <th className="py-3.5 px-4">Chủ thể Ký số</th>
                <th className="py-3.5 px-4">Mã băm SHA-256</th>
                <th className="py-3.5 px-4">Địa chỉ IP & Thiết bị</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Database className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600 text-sm">Không tìm thấy bản ghi nhật ký kiểm toán nào</p>
                    <p className="text-[11px] text-slate-400 mt-1">Thử thay đổi bộ lọc sự kiện hoặc cụm từ tìm kiếm</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const isCopied = copiedHash === log.hashSHA256;

                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-slate-50/80 transition-colors"
                      data-testid={`audit-log-row-${log.id}`}
                    >
                      {/* Thời gian (TSA) */}
                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{log.timestamp}</span>
                        </div>
                        <span className="text-[10px] text-indigo-600 font-bold block mt-0.5">
                          RFC 3161 TSA Valid
                        </span>
                      </td>

                      {/* Hành động & Mã văn bản */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{log.action}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded border border-slate-200 inline-flex items-center gap-1">
                            <FileText className="w-3 h-3 text-slate-400" />
                            {log.targetDocCode}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.algorithm}
                          </span>
                        </div>
                      </td>

                      {/* Chủ thể Ký số */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{log.performedBy}</div>
                        <div className="text-[11px] font-mono text-indigo-700 font-bold mt-0.5">
                          {log.certSerial}
                        </div>
                      </td>

                      {/* Mã băm SHA-256 */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                          <span 
                            className="font-mono text-[11px] text-slate-600" 
                            title={log.hashSHA256}
                          >
                            {log.hashSHA256.length > 20 
                              ? `${log.hashSHA256.substring(0, 12)}...${log.hashSHA256.slice(-8)}`
                              : log.hashSHA256}
                          </span>
                          <button
                            onClick={() => handleCopyHash(log.hashSHA256)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                            title={isCopied ? "Đã chép!" : "Sao chép SHA-256"}
                            data-testid={`copy-hash-${log.id}`}
                          >
                            {isCopied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {isCopied && (
                          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5 animate-in fade-in">
                            ✓ Đã chép
                          </span>
                        )}
                      </td>

                      {/* Địa chỉ IP & Thiết bị */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1.5 font-mono text-[11px]">
                          <Globe className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          <span>{log.ipAddress}</span>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-medium block mt-0.5">
                          SSL Verified Session
                        </span>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                          log.status === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                          log.status === 'warning' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-rose-50 text-rose-700 border border-rose-200"
                        )}>
                          {log.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                          {log.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
                          {log.status === 'failed' && <XCircle className="w-3 h-3" />}
                          <span>
                            {log.status === 'success' ? 'Thành công' : log.status === 'warning' ? 'Cảnh báo' : 'Thất bại'}
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
