import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Award,
  Key,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Download,
  ExternalLink,
  Layers,
  Lock,
  Server,
  UserCheck,
  Calendar,
  Hash,
  Globe,
  Building,
  X,
  FileCheck2,
  ChevronRight
} from 'lucide-react';
import {
  CompanyHSMProfile,
  PersonalCertificate,
  X509CertificateDetails,
  generateX509Details
} from '../../../data/hsmSignatureData';

export interface CertificateInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  certData: CompanyHSMProfile | PersonalCertificate | null;
}

export const CertificateInspectorModal: React.FC<CertificateInspectorModalProps> = ({
  isOpen,
  onClose,
  certData
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'chain' | 'crypto'>('overview');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [selectedChainLevel, setSelectedChainLevel] = useState<number>(3); // Default to leaf certificate

  const x509: X509CertificateDetails | null = useMemo(() => {
    if (!certData) return null;
    return generateX509Details(certData);
  }, [certData]);

  if (!isOpen || !certData || !x509) return null;

  const isHsm = 'provider' in certData;
  const hsmProfile = isHsm ? (certData as CompanyHSMProfile) : null;
  const personalCert = !isHsm ? (certData as PersonalCertificate) : null;

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  const handleExportCRT = () => {
    // Generate standard RFC 7468 PEM-encoded certificate mock format
    const pemHeader = '-----BEGIN CERTIFICATE-----\n';
    const pemFooter = '\n-----END CERTIFICATE-----';
    const rawPayload = `VCOMM-X509-CERT|Serial:${x509.serialNumber}|Subject:${x509.subjectCN}|Issuer:${x509.issuerCN}|SHA256:${x509.sha256Fingerprint}`;
    const fakeBase64Body = btoa(unescape(encodeURIComponent(rawPayload)))
      .match(/.{1,64}/g)
      ?.join('\n') || '';

    const pemContent = `${pemHeader}${fakeBase64Body}${pemFooter}`;
    const blob = new Blob([pemContent], { type: 'application/x-x509-ca-cert' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const cleanFileName = (x509.subjectCN || 'certificate')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_');
    link.download = `${cleanFileName}_x509.crt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Remaining days styling
  const days = x509.daysRemaining;
  let remainingColorClass = 'text-emerald-700 bg-emerald-50 border-emerald-200';
  let progressBgClass = 'bg-emerald-500';
  if (days < 30) {
    remainingColorClass = 'text-rose-700 bg-rose-50 border-rose-200';
    progressBgClass = 'bg-rose-500';
  } else if (days <= 90) {
    remainingColorClass = 'text-amber-700 bg-amber-50 border-amber-200';
    progressBgClass = 'bg-amber-500';
  }

  // Selected chain item
  const selectedChainItem = x509.trustChain.find(item => item.level === selectedChainLevel) || x509.trustChain[2];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cert-inspector-title"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="cert-inspector-title" className="text-lg font-bold text-white tracking-tight">
                  Trình Soi Chứng Thư Số X.509
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/40">
                  {isHsm ? 'Cloud HSM Root' : 'Personal CA'}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                {x509.subjectCN} &bull; Serial: {x509.serialNumber}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Đóng modal"
            aria-label="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Tổng quan</span>
          </button>

          <button
            onClick={() => setActiveTab('chain')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'chain'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Chuỗi Chứng Thực (Trust Chain)</span>
          </button>

          <button
            onClick={() => setActiveTab('crypto')}
            className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'crypto'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Chi Tiết Mật Mã Học</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-slate-900">
          {/* ================= TAB 1: OVERVIEW ================= */}
          {activeTab === 'overview' && (
            <div className="space-y-5 animate-fadeIn">
              {/* Status Header Ribbon */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-white text-sm">
                        Trạng Thái Chứng Thư
                      </span>
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                        {x509.status === 'valid' ? 'HỢP LỆ & KHẢ DỤNG' : x509.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Đã thẩm tra hợp lệ trực tuyến với cơ quan thẩm quyền quốc gia
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Chuẩn thiết bị:</span>
                  <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {hsmProfile?.fipsStandard || 'FIPS 140-2 Level 3 / eIDAS'}
                  </span>
                </div>
              </div>

              {/* Subject & Issuer Grids */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Subject Details */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
                    <UserCheck className="w-4 h-4" />
                    <span>Chủ Thể Chứng Thư (Subject)</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Tên chủ thể (Common Name - CN):</span>
                      <span className="font-semibold text-slate-900 dark:text-white break-words">
                        {x509.subjectCN}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Tổ chức (Organization - O):</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {x509.subjectOrg}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {x509.subjectTaxCode ? (
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">Mã số thuế (Tax Code):</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                            {x509.subjectTaxCode}
                          </span>
                        </div>
                      ) : personalCert ? (
                        <div>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block">Mã nhân viên (Staff Code):</span>
                          <span className="font-mono text-slate-800 dark:text-slate-200 font-medium">
                            {personalCert.staffCode}
                          </span>
                        </div>
                      ) : null}

                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">Quốc gia (Country - C):</span>
                        <span className="text-slate-800 dark:text-slate-200 font-medium flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          {x509.subjectCountry} (Việt Nam)
                        </span>
                      </div>
                    </div>

                    {x509.subjectEmail && (
                      <div>
                        <span className="text-xs text-slate-500 dark:text-slate-400 block">Email định danh:</span>
                        <span className="text-slate-700 dark:text-slate-300 font-mono text-xs">
                          {x509.subjectEmail}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Issuer Details */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase">
                    <Server className="w-4 h-4" />
                    <span>Tổ Chức Cấp Phát (Issuer CA)</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Tên cơ quan CA (Issuer CN):</span>
                      <span className="font-semibold text-slate-900 dark:text-white break-words">
                        {x509.issuerCN}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Đơn vị quản lý CA (Organization):</span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {x509.issuerOrg}
                      </span>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Cơ quan thẩm quyền cấp phép:</span>
                      <span className="text-slate-700 dark:text-slate-300 text-xs">
                        Bộ Thông tin và Truyền thông &bull; Trung tâm NEAC
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validity Period & Countdown Bar */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold text-sm">
                    <Calendar className="w-4 h-4 text-indigo-500" />
                    <span>Thời Hạn Hiệu Lực Chứng Thư Số</span>
                  </div>
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${remainingColorClass}`}>
                    Còn lại {days} ngày
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Hiệu lực từ ngày:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{x509.validFrom}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 block">Hết hạn vào ngày:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">{x509.validTo}</span>
                  </div>
                </div>

                {/* Progress Visual */}
                <div className="space-y-1 pt-1">
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${progressBgClass}`}
                      style={{ width: `${Math.min(100, Math.max(5, (days / 1095) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Cấp mới</span>
                    <span>Hết hạn</span>
                  </div>
                </div>
              </div>

              {/* OCSP & CRL Online Revocation Status */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    <span>Kiểm Tra Thu Hồi Trực Tuyến (OCSP & CRL)</span>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                    Valid & Active
                  </span>
                </div>

                <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <p>
                    <strong className="text-slate-800 dark:text-slate-100">OCSP Status:</strong>{' '}
                    {x509.ocspStatus}
                  </p>
                  <p className="truncate">
                    <strong className="text-slate-800 dark:text-slate-100">CRL Endpoint:</strong>{' '}
                    <span className="font-mono text-indigo-600 dark:text-indigo-400 select-all">
                      {x509.crlDistributionPoint}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: TRUST CHAIN ================= */}
          {activeTab === 'chain' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-900 dark:text-indigo-200">
                Chuỗi tin cậy phân cấp 3 tầng (X.509 Trust Hierarchy) xác lập từ Căn cước điện tử quốc gia đến Chứng thư đầu cuối VComm. Nhấp vào từng tầng để xem chi tiết.
              </div>

              {/* Visual Tree */}
              <div className="space-y-3">
                {x509.trustChain.map((node, index) => {
                  const isSelected = selectedChainLevel === node.level;
                  const isRoot = node.type === 'root_ca';
                  const isIntermediate = node.type === 'intermediate_ca';
                  const isLeaf = node.type === 'leaf';

                  return (
                    <div key={node.level} className="relative">
                      {/* Connector Line */}
                      {index < x509.trustChain.length - 1 && (
                        <div className="absolute left-6 top-12 bottom-[-16px] w-0.5 bg-indigo-200 dark:bg-indigo-800 z-0" />
                      )}

                      <div
                        onClick={() => setSelectedChainLevel(node.level)}
                        className={`relative z-10 p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 shadow-md ring-1 ring-indigo-500'
                            : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${
                              isRoot
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                                : isIntermediate
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                            }`}
                          >
                            {node.level}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900 dark:text-white text-sm">
                                {node.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                                  isRoot
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200'
                                    : isIntermediate
                                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
                                }`}
                              >
                                {isRoot ? 'Root CA' : isIntermediate ? 'Intermediate Sub-CA' : 'Leaf Certificate'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              Cấp bởi: {node.issuer} &bull; Hiệu lực đến: {node.validTo}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-semibold rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            {node.status === 'valid' ? 'Hợp lệ' : 'Hết hạn'}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isSelected ? 'rotate-90 text-indigo-600' : 'text-slate-400'
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Node Details Card */}
              {selectedChainItem && (
                <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/50 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                      Chi Tiết Tầng {selectedChainItem.level}: {selectedChainItem.name}
                    </span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      {selectedChainItem.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Tên Thực Thể:</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {selectedChainItem.name}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Đơn Vị Cấp Quyền:</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {selectedChainItem.issuer}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Thời Điểm Hết Hạn:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {selectedChainItem.validTo}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Trạng Thái Xác Thực:</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Chuỗi khóa bất biến &bull; Chữ ký hợp lệ
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: CRYPTOGRAPHIC DETAILS ================= */}
          {activeTab === 'crypto' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Serial & Key Algo Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Số Serial Number (Hexadecimal):
                  </span>
                  <div className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 select-all">
                      {x509.serialNumber}
                    </span>
                    <button
                      onClick={() => handleCopy(x509.serialNumber, 'serial')}
                      className="text-slate-400 hover:text-indigo-600 transition-colors p-1"
                      title="Sao chép Serial Number"
                    >
                      {copiedField === 'serial' ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">
                    Thuật Toán & Kích Thước Khóa Công Khai:
                  </span>
                  <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                      {x509.publicKeyAlgorithm}
                    </span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-mono">
                      {x509.keySize}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signature Algorithm */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">
                  Thuật Toán Băm & Chữ Ký Số (Signature Algorithm):
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {x509.signatureAlgorithm}
                </span>
              </div>

              {/* Fingerprints */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
                  Dấu Vân Tay Chứng Thư (Certificate Thumbprints)
                </span>

                {/* SHA-256 Fingerprint */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>SHA-256 Fingerprint:</span>
                    <button
                      onClick={() => handleCopy(x509.sha256Fingerprint, 'sha256')}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                    >
                      {copiedField === 'sha256' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 text-[11px]">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 text-emerald-400 font-mono text-[11px] break-all border border-slate-800 select-all">
                    {x509.sha256Fingerprint}
                  </div>
                </div>

                {/* SHA-1 Fingerprint */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>SHA-1 Fingerprint:</span>
                    <button
                      onClick={() => handleCopy(x509.sha1Fingerprint, 'sha1')}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium"
                    >
                      {copiedField === 'sha1' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-emerald-600 text-[11px]">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px]">Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900 text-emerald-400/90 font-mono text-[11px] break-all border border-slate-800 select-all">
                    {x509.sha1Fingerprint}
                  </div>
                </div>
              </div>

              {/* Key Usage & Security standard */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                    Mục Đích Sử Dụng Khóa (Key Usage):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {x509.keyUsage.map((usage, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200"
                      >
                        {usage}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                    Tiêu Chuẩn Bảo Mật Phần Cứng:
                  </span>
                  <div className="p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 space-y-1">
                    <p className="font-semibold flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      {hsmProfile?.fipsStandard || 'FIPS 140-2 Level 3 / eIDAS Compliant'}
                    </p>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Khóa riêng tư (Private Key) được bảo vệ bằng mô-đun phần cứng chống xâm nhập vật lý (Tamper-Resistant Hardware Module).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleExportCRT}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Xuất Chứng Thư (.CRT)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-md cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
