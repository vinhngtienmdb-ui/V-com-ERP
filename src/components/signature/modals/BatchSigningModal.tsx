import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Layers,
  CheckCircle2,
  Lock,
  AlertTriangle,
  Loader2,
  X,
  Eye,
  EyeOff,
  Server,
  Zap,
  UserCheck,
  Check,
  FileText,
  Sparkles,
  Building2,
  Clock
} from 'lucide-react';
import { cn, formatCurrency } from '../../../lib/utils';
import {
  SigningDocument,
  CompanyHSMProfile,
  PersonalCertificate
} from '../../../data/hsmSignatureData';

export interface BatchSigningModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDocs: SigningDocument[];
  companyHsm: CompanyHSMProfile;
  personalCerts: PersonalCertificate[];
  onBatchSignSuccess: (
    signedDocIds: string[],
    signaturePayload: {
      signerName: string;
      certSerial: string;
      method: string;
      signedAt: string;
    }
  ) => void;
}

const CATEGORY_LABEL_MAP: Record<string, string> = {
  contract: 'Hợp đồng',
  e_invoice: 'Hóa đơn điện tử',
  warehouse_slip: 'Phiếu xuất kho',
  request: 'Đề xuất chi phí',
  tax_report: 'Tờ khai thuế',
  internal_decision: 'Quyết định nội bộ'
};

export const BatchSigningModal: React.FC<BatchSigningModalProps> = ({
  isOpen,
  onClose,
  selectedDocs,
  companyHsm,
  personalCerts,
  onBatchSignSuccess
}) => {
  const [signingMethod, setSigningMethod] = useState<'company_hsm' | 'personal_cert'>('company_hsm');
  const [selectedCertId, setSelectedCertId] = useState<string>(
    personalCerts.find(c => c.status === 'active')?.id || personalCerts[0]?.id || ''
  );
  const [pinCode, setPinCode] = useState('123456');
  const [showPin, setShowPin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setSigningMethod('company_hsm');
      setSelectedCertId(personalCerts.find(c => c.status === 'active')?.id || personalCerts[0]?.id || '');
      setPinCode('123456');
      setIsProcessing(false);
      setProgressCount(0);
      setIsCompleted(false);
      setErrorMsg(null);
    }
  }, [isOpen, personalCerts]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isProcessing) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  // Aggregated totals
  const totalAmount = useMemo(() => {
    return selectedDocs.reduce((sum, doc) => sum + (doc.amount || 0), 0);
  }, [selectedDocs]);

  const totalPages = useMemo(() => {
    return selectedDocs.reduce((sum, doc) => sum + (doc.totalPages || 1), 0);
  }, [selectedDocs]);

  const progressPercent = useMemo(() => {
    if (selectedDocs.length === 0) return 0;
    return Math.min(100, Math.round((progressCount / selectedDocs.length) * 100));
  }, [progressCount, selectedDocs.length]);

  const selectedCert = useMemo(() => {
    return personalCerts.find(c => c.id === selectedCertId) || personalCerts[0];
  }, [personalCerts, selectedCertId]);

  if (!isOpen) return null;

  const handleStartBatchSigning = () => {
    if (!pinCode || pinCode.length < 4) {
      setErrorMsg('Vui lòng nhập mã PIN bảo mật hợp lệ (tối thiểu 4-6 số).');
      return;
    }

    if (selectedDocs.length === 0) {
      setErrorMsg('Chưa có văn bản nào được chọn để ký.');
      return;
    }

    setErrorMsg(null);
    setIsProcessing(true);
    setProgressCount(0);
    setIsCompleted(false);

    let current = 0;
    const total = selectedDocs.length;

    timerRef.current = setInterval(() => {
      current += 1;
      setProgressCount(current);

      if (current >= total) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsProcessing(false);
        setIsCompleted(true);

        let signerName = companyHsm.companyName;
        let certSerial = companyHsm.serialNumber;
        let method = `Cloud HSM Doanh nghiệp (${companyHsm.provider})`;

        if (signingMethod === 'personal_cert') {
          signerName = selectedCert?.fullName || 'Cán bộ VComm';
          certSerial = selectedCert?.serialNumber || 'PERSONAL-CA-DEFAULT';
          method = `SmartCA Cloud (${selectedCert?.algorithm || 'RSA 2048-bit'})`;
        }

        const payload = {
          signerName,
          certSerial,
          method,
          signedAt: new Date().toISOString()
        };

        onBatchSignSuccess(selectedDocs.map(d => d.id), payload);

        closeTimerRef.current = setTimeout(() => {
          onClose();
        }, 800);
      }
    }, 100);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="batch-signing-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <header className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-indigo-900/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 id="batch-signing-modal-title" className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                Ký Số Hàng Loạt Văn Bản & Chứng Từ
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Batch Execution
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Ký số đồng loạt tốc độ cao với thuật toán mã hóa đám mây an toàn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            aria-label="Đóng cửa sổ"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">
          {/* Summary Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">Tổng văn bản chọn</div>
                <div className="text-xl font-black text-indigo-950 mt-0.5">
                  {selectedDocs.length} <span className="text-xs font-normal text-indigo-700">văn bản</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Tổng giá trị tài chính</div>
                <div className="text-xl font-black text-emerald-950 mt-0.5">
                  {totalAmount > 0 ? formatCurrency(totalAmount) : '0 ₫'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-100 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Tổng số trang</div>
                <div className="text-xl font-black text-amber-950 mt-0.5">
                  {totalPages} <span className="text-xs font-normal text-amber-700">trang</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar (Visible during processing or completed) */}
          {(isProcessing || isCompleted) && (
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-3 animate-in fade-in shadow-md">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold">
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                      <span>Đang thực thi ký số hàng loạt...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-300">Đã hoàn tất ký số toàn bộ văn bản!</span>
                    </>
                  )}
                </div>
                <div className="font-mono font-bold text-indigo-300">
                  {progressCount}/{selectedDocs.length} ({progressPercent}%)
                </div>
              </div>

              {/* Progress track */}
              <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden border border-slate-700">
                <div
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    isCompleted
                      ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                      : "bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-400"
                  )}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {isCompleted && (
                <div className="pt-1 text-xs text-emerald-300 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-300" />
                  <span>Ký số thành công! Cửa sổ sẽ tự động đóng trong giây lát...</span>
                </div>
              )}
            </div>
          )}

          {/* Selected Documents Summary List */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                {`Danh sách văn bản đang chọn (${selectedDocs.length})`}
              </h3>
              <span className="text-[11px] text-slate-500">
                Tự động kiểm tra tính toàn vẹn và gắn chữ ký số
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px] sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3.5">Mã số</th>
                    <th className="py-2.5 px-3.5">Tiêu đề văn bản</th>
                    <th className="py-2.5 px-3.5">Phân loại</th>
                    <th className="py-2.5 px-3.5 text-right">Số tiền</th>
                    <th className="py-2.5 px-3.5 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedDocs.map((doc, idx) => {
                    const isDocSigned = isCompleted || idx < progressCount;
                    const isDocCurrent = isProcessing && idx === progressCount;

                    return (
                      <tr
                        key={doc.id}
                        className={cn(
                          "transition-colors",
                          isDocCurrent ? "bg-indigo-50/70" : isDocSigned ? "bg-emerald-50/30" : "hover:bg-slate-50"
                        )}
                      >
                        <td className="py-2.5 px-3.5 font-mono font-bold text-slate-700 whitespace-nowrap">
                          {doc.docCode}
                        </td>
                        <td className="py-2.5 px-3.5 font-medium text-slate-900 max-w-xs truncate" title={doc.title}>
                          {doc.title}
                        </td>
                        <td className="py-2.5 px-3.5 text-slate-600 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] font-medium border border-slate-200">
                            {CATEGORY_LABEL_MAP[doc.category] || doc.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3.5 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                          {doc.amount ? formatCurrency(doc.amount) : '-'}
                        </td>
                        <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                          {isDocSigned ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Đã ký
                            </span>
                          ) : isDocCurrent ? (
                            <span className="inline-flex items-center gap-1 text-indigo-600 font-bold text-[11px] animate-pulse">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang ký...
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] flex items-center justify-center gap-1">
                              <Clock className="w-3 h-3" /> Chờ xử lý
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signing Method Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Chọn phương thức ký số
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* Option 1: Corporate Cloud HSM */}
              <label
                className={cn(
                  "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all",
                  signingMethod === 'company_hsm'
                    ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300",
                  (isProcessing || isCompleted) && "pointer-events-none opacity-70"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      signingMethod === 'company_hsm' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {`Cloud HSM Doanh nghiệp (${companyHsm.provider})`}
                      </div>
                      <div className="text-[11px] text-indigo-700 font-semibold mt-0.5">
                        Khuyến nghị cho ký hàng loạt tốc độ cao (120 TPS)
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="batchSigningMethod"
                    value="company_hsm"
                    checked={signingMethod === 'company_hsm'}
                    onChange={() => setSigningMethod('company_hsm')}
                    disabled={isProcessing || isCompleted}
                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-1"
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <p>
                    Tự động khấu trừ <span className="font-bold text-slate-900">{selectedDocs.length}</span> lượt ký từ{' '}
                    <span className="font-bold text-slate-900">{companyHsm.remainingSignatures.toLocaleString('vi-VN')}</span> lượt còn lại.
                  </p>
                  <p className="text-slate-400 font-mono text-[10px]">
                    Serial: {companyHsm.serialNumber} • Tiêu chuẩn: {companyHsm.fipsStandard}
                  </p>
                </div>
              </label>

              {/* Option 2: SmartCA Personal Certificate */}
              <label
                className={cn(
                  "relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all",
                  signingMethod === 'personal_cert'
                    ? "border-indigo-600 bg-indigo-50/40 shadow-xs"
                    : "border-slate-200 bg-white hover:border-slate-300",
                  (isProcessing || isCompleted) && "pointer-events-none opacity-70"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      signingMethod === 'personal_cert' ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
                    )}>
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        Chứng thư số Cá nhân SmartCA
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Chọn cán bộ đại diện ký số
                      </div>
                    </div>
                  </div>
                  <input
                    type="radio"
                    name="batchSigningMethod"
                    value="personal_cert"
                    checked={signingMethod === 'personal_cert'}
                    onChange={() => setSigningMethod('personal_cert')}
                    disabled={isProcessing || isCompleted}
                    className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-1"
                  />
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80">
                  {signingMethod === 'personal_cert' ? (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Cán bộ đại diện ký:
                      </label>
                      <select
                        value={selectedCertId}
                        onChange={e => setSelectedCertId(e.target.value)}
                        disabled={isProcessing || isCompleted}
                        className="w-full text-xs py-1.5 px-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {personalCerts.map(cert => (
                          <option key={cert.id} value={cert.id}>
                            {cert.fullName} - {cert.title} ({cert.serialNumber})
                          </option>
                        ))}
                      </select>
                      {selectedCert && (
                        <p className="text-[10px] text-slate-500">
                          Hạn mức: {selectedCert.signingLimitVND === 0 ? 'Không giới hạn' : formatCurrency(selectedCert.signingLimitVND)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      Ký thay mặt cá nhân đại diện doanh nghiệp có thẩm quyền.
                    </p>
                  )}
                </div>
              </label>
            </div>
          </div>

          {/* PIN Input Section */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label htmlFor="batch-pin-input" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-indigo-600" />
                  Mã PIN bí mật ký số (6 chữ số):
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Mã PIN bảo mật khóa mật mã lưu trữ trên Cloud HSM / SmartCA HSM
                </p>
              </div>

              <div className="relative w-full sm:w-56">
                <input
                  id="batch-pin-input"
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  value={pinCode}
                  onChange={e => setPinCode(e.target.value.replace(/\D/g, ''))}
                  disabled={isProcessing || isCompleted}
                  placeholder="Nhập PIN 6 số"
                  className="w-full px-3 py-2 pr-10 bg-white border border-slate-300 rounded-xl font-mono text-center tracking-widest text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  disabled={isProcessing || isCompleted}
                  aria-label={showPin ? 'Ẩn mã PIN' : 'Hiện mã PIN'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <footer className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Mọi giao dịch ký số hàng loạt đều được ghi log kiểm toán bất biến (SHA-256).</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleStartBatchSigning}
              disabled={isProcessing || isCompleted || selectedDocs.length === 0}
              className={cn(
                "px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all",
                isProcessing
                  ? "bg-indigo-400 cursor-not-allowed"
                  : isCompleted
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-500/25 active:scale-98"
              )}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {`Đang Ký Hàng Loạt (${progressCount}/${selectedDocs.length})...`}
                </>
              ) : isCompleted ? (
                <>
                  <Check className="w-4 h-4" />
                  Đã Ký Xong Toàn Bộ
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4" />
                  {`Bắt Đầu Ký Hàng Loạt (${selectedDocs.length} văn bản)`}
                </>
              )}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
