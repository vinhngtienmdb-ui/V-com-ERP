import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Search,
  Plus,
  Lock,
  CheckCircle2,
  AlertTriangle,
  UserX,
  RotateCw,
  Eye,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Clock,
  Sparkles,
  Building2,
  Briefcase
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import { PersonalCertificate } from '../../data/hsmSignatureData';

export interface PersonalCertsManagerProps {
  certs: PersonalCertificate[];
  onCertAction: (certId: string, action: 'suspend' | 'activate' | 'revoke' | 'renew') => void;
  onOpenIssueModal: () => void;
  onInspectCert: (cert: PersonalCertificate) => void;
}

export const PersonalCertsManager: React.FC<PersonalCertsManagerProps> = ({
  certs,
  onCertAction,
  onOpenIssueModal,
  onInspectCert
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  // Helper to check if a certificate is expiring within 90 days
  const isExpiringSoon = (expiryDateStr: string): boolean => {
    try {
      const parts = expiryDateStr.split('/');
      if (parts.length === 3) {
        const expDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        const now = new Date();
        const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 90;
      }
    } catch {
      return false;
    }
    return false;
  };

  // Filter certs based on status and search query
  const filteredCerts = useMemo(() => {
    return certs.filter(cert => {
      // Status filter
      if (filterStatus !== 'all' && cert.status !== filterStatus) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = cert.fullName.toLowerCase().includes(q);
        const matchesEmail = cert.email.toLowerCase().includes(q);
        const matchesStaffCode = cert.staffCode.toLowerCase().includes(q);
        const matchesSerial = cert.serialNumber.toLowerCase().includes(q);
        const matchesDept = cert.department.toLowerCase().includes(q);
        const matchesTitle = cert.title.toLowerCase().includes(q);

        return matchesName || matchesEmail || matchesStaffCode || matchesSerial || matchesDept || matchesTitle;
      }

      return true;
    });
  }, [certs, filterStatus, searchQuery]);

  // Status counts for badge chips
  const counts = useMemo(() => {
    return {
      all: certs.length,
      active: certs.filter(c => c.status === 'active').length,
      suspended: certs.filter(c => c.status === 'suspended').length,
      revoked: certs.filter(c => c.status === 'revoked').length
    };
  }, [certs]);

  const handleCopySerial = (serial: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(serial);
    setCopiedSerial(serial);
    setTimeout(() => {
      setCopiedSerial(null);
    }, 2000);
  };

  const handleRevokeConfirm = (cert: PersonalCertificate) => {
    const isConfirmed = window.confirm(
      `Bạn có chắc chắn muốn thu hồi vĩnh viễn chứng thư số của ${cert.fullName} (${cert.staffCode})? Thao tác này sẽ hủy khóa trên toàn hệ thống và không thể hoàn tác!`
    );
    if (isConfirmed) {
      onCertAction(cert.id, 'revoke');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in" data-testid="personal-certs-manager">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Tổng Chứng Thư
          </div>
          <div className="text-2xl font-black text-slate-900 flex items-center justify-between">
            <span>{counts.all}</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Cán bộ được cấp phát</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
            Đang Hoạt Động
          </div>
          <div className="text-2xl font-black text-emerald-600 flex items-center justify-between">
            <span>{counts.active}</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Sẵn sàng ký số</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider mb-1">
            Tạm Khóa (Suspended)
          </div>
          <div className="text-2xl font-black text-amber-600 flex items-center justify-between">
            <span>{counts.suspended}</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Nghỉ phép / Phòng ngừa</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1">
            Đã Thu Hồi (Revoked)
          </div>
          <div className="text-2xl font-black text-rose-600 flex items-center justify-between">
            <span>{counts.revoked}</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Hết hiệu lực vĩnh viễn</div>
        </div>
      </div>

      {/* Header & Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/90 p-4 rounded-2xl border border-slate-200">
        {/* Status Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
          <span className="text-xs font-bold text-slate-600 mr-1 flex-shrink-0">Bộ lọc:</span>
          {[
            { id: 'all', label: 'Tất cả', count: counts.all },
            { id: 'active', label: 'Đang hoạt động', count: counts.active },
            { id: 'suspended', label: 'Tạm khóa', count: counts.suspended },
            { id: 'revoked', label: 'Đã thu hồi', count: counts.revoked }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                filterStatus === tab.id
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span>{tab.label}</span>
              <span className={cn(
                "px-1.5 py-0.2 rounded-full text-[10px]",
                filterStatus === tab.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 font-mono"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & New Cert Button */}
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm CBNV, email, mã NV, serial, phòng ban..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 placeholder:text-slate-400"
              data-testid="cert-search-input"
            />
          </div>

          <button
            onClick={onOpenIssueModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all flex-shrink-0"
            data-testid="open-issue-cert-button"
          >
            <Plus className="w-4 h-4" />
            <span>Cấp Chứng Thư Mới</span>
          </button>
        </div>
      </div>

      {/* Personal Certificates Table */}
      <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" data-testid="personal-certs-table">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3.5 px-4">Cán bộ Nhân sự</th>
                <th className="py-3.5 px-4">Phòng ban & Chức danh</th>
                <th className="py-3.5 px-4">Serial Chứng thư</th>
                <th className="py-3.5 px-4">Thuật toán</th>
                <th className="py-3.5 px-4 text-center">Hạn mức Ký (VND)</th>
                <th className="py-3.5 px-4 text-center">Thời hạn Hiệu lực</th>
                <th className="py-3.5 px-4 text-center">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCerts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <UserX className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600 text-sm">Không tìm thấy chứng thư số nào phù hợp</p>
                    <p className="text-[11px] text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc bỏ chọn bộ lọc trạng thái</p>
                  </td>
                </tr>
              ) : (
                filteredCerts.map(cert => {
                  const expiringSoon = isExpiringSoon(cert.expiryDate);

                  // Extract initials for avatar
                  const nameParts = cert.fullName.trim().split(' ');
                  const initials = nameParts.length >= 2
                    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
                    : cert.fullName.slice(0, 2);

                  return (
                    <tr 
                      key={cert.id} 
                      className="hover:bg-slate-50/80 transition-colors"
                      data-testid={`cert-row-${cert.id}`}
                    >
                      {/* Cán bộ nhân sự */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center uppercase shadow-xs flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{cert.fullName}</span>
                              {cert.certType === 'executive' && (
                                <span className="px-1.5 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded border border-amber-200" title="Chứng thư Quản lý / Đại diện">
                                  Lãnh đạo
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                              <span className="font-semibold text-slate-600">{cert.staffCode}</span>
                              <span>•</span>
                              <span className="truncate max-w-[160px]">{cert.email}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phòng ban & Chức danh */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{cert.title}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span>{cert.department}</span>
                        </div>
                        {cert.role && (
                          <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                            {cert.role}
                          </div>
                        )}
                      </td>

                      {/* Serial Chứng thư */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                          <span 
                            onClick={() => onInspectCert(cert)}
                            className="font-mono text-[11px] text-indigo-700 font-bold hover:underline cursor-pointer"
                            title="Click để soi chi tiết chứng thư X.509"
                          >
                            {cert.serialNumber}
                          </span>
                          <button
                            onClick={(e) => handleCopySerial(cert.serialNumber, e)}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                            title={copiedSerial === cert.serialNumber ? "Đã chép!" : "Sao chép Serial"}
                            data-testid={`copy-serial-${cert.id}`}
                          >
                            {copiedSerial === cert.serialNumber ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        {copiedSerial === cert.serialNumber && (
                          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5 animate-in fade-in">
                            ✓ Đã chép
                          </span>
                        )}
                      </td>

                      {/* Thuật toán */}
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1",
                          cert.algorithm.includes('SmartCA') 
                            ? "bg-purple-50 text-purple-700 border-purple-200" 
                            : cert.algorithm.includes('ECC') 
                            ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                            : "bg-indigo-50 text-indigo-700 border-indigo-200"
                        )}>
                          <Key className="w-3 h-3" />
                          {cert.algorithm}
                        </span>
                      </td>

                      {/* Hạn mức Ký (VND) */}
                      <td className="py-3.5 px-4 text-center">
                        {cert.signingLimitVND === 0 ? (
                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-black text-xs rounded-lg border border-emerald-200 inline-block">
                            Không giới hạn
                          </span>
                        ) : (
                          <span className="font-bold text-slate-900 font-mono text-xs">
                            {formatCurrency(cert.signingLimitVND)}
                          </span>
                        )}
                      </td>

                      {/* Thời hạn Hiệu lực */}
                      <td className="py-3.5 px-4 text-center text-slate-600 text-[11px]">
                        <div className="font-semibold text-slate-800">{cert.expiryDate}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Cấp: {cert.issuedDate}</div>
                        {expiringSoon && (
                          <span className="mt-1 px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold rounded-md inline-flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5 text-amber-600" /> Sắp hết hạn (&lt;90 ngày)
                          </span>
                        )}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1",
                            cert.status === 'active' 
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                              : cert.status === 'suspended' 
                              ? "bg-amber-50 text-amber-700 border border-amber-200" 
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          )}>
                            {cert.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                            {cert.status === 'suspended' && <Lock className="w-3 h-3" />}
                            {cert.status === 'revoked' && <UserX className="w-3 h-3" />}
                            
                            <span>
                              {cert.status === 'active' && 'Đang hoạt động'}
                              {cert.status === 'suspended' && 'Tạm khóa'}
                              {cert.status === 'revoked' && 'Đã thu hồi'}
                            </span>
                          </span>

                          {cert.revocationReason && (
                            <span className="text-[9px] text-amber-700 max-w-[130px] truncate" title={cert.revocationReason}>
                              {cert.revocationReason}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Nút Soi Chứng Thư X.509 */}
                          <button
                            onClick={() => onInspectCert(cert)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Soi Chứng Thư X.509 v3"
                            data-testid={`inspect-cert-${cert.id}`}
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          {/* Nút Tạm Khóa (Nếu đang active) */}
                          {cert.status === 'active' && (
                            <button
                              onClick={() => onCertAction(cert.id, 'suspend')}
                              className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Tạm Khóa"
                              data-testid={`suspend-cert-${cert.id}`}
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                          )}

                          {/* Nút Mở Khóa (Nếu đang suspended) */}
                          {cert.status === 'suspended' && (
                            <button
                              onClick={() => onCertAction(cert.id, 'activate')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Mở Khóa"
                              data-testid={`activate-cert-${cert.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Nút Thu Hồi Vĩnh Viễn (Nếu chưa bị revoke) */}
                          {cert.status !== 'revoked' && (
                            <button
                              onClick={() => handleRevokeConfirm(cert)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Thu Hồi Vĩnh Viễn"
                              data-testid={`revoke-cert-${cert.id}`}
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}

                          {/* Nút Gia Hạn 3 Năm */}
                          <button
                            onClick={() => onCertAction(cert.id, 'renew')}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Gia Hạn 3 Năm"
                            data-testid={`renew-cert-${cert.id}`}
                          >
                            <RotateCw className="w-4 h-4" />
                          </button>
                        </div>
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
