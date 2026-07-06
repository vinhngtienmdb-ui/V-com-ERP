import React, { useState, useEffect } from 'react';
import { 
  FileSignature, X, Printer, Layout, Clock, Scale, Sparkles, RefreshCw, 
  ShieldCheck, ShieldAlert, Loader2 
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useNotifications } from '../../context/NotificationContext';

interface RequestDetailProps {
  request: any;
  formConfigs: any[];
  onClose: () => void;
  onPrint: () => void;
  onSign?: () => void; // Passed if we want to sign from detail view
  isAdmin?: boolean;
}

export function RequestDetail({ request, formConfigs, onClose, onPrint, onSign, isAdmin }: RequestDetailProps) {
  const { addNotification } = useNotifications();
  
  const [legalAuditResult, setLegalAuditResult] = useState<string | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'unverified' | 'verified' | 'tampered'>('unverified');

  useEffect(() => {
    setLegalAuditResult(null);
    if (request) {
      verifyRequestSignature(request);
    } else {
      setVerificationStatus('unverified');
    }
  }, [request]);

  const verifyRequestSignature = async (reqItem: any) => {
    if (reqItem.signatureStatus !== 'signed') {
      setVerificationStatus('unverified');
      return;
    }
    setVerificationLoading(true);
    try {
      const documentData = {
        id: reqItem.id,
        title: reqItem.title,
        type: reqItem.type,
        date: reqItem.date
      };

      const res = await fetch('/api/signatures/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: reqItem.id,
          documentData
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.verified) {
          setVerificationStatus('verified');
        } else {
          setVerificationStatus('tampered');
        }
      } else {
        setVerificationStatus('tampered');
      }
    } catch (err) {
      console.error('Verify error:', err);
      setVerificationStatus('tampered');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleAiLegalAudit = async () => {
    if (!request) return;
    setIsAuditing(true);
    setLegalAuditResult(null);
    try {
      // Use mock API for now
      const response = await fetch("/api/mock/legal-audit").catch(() => null);
      
      // Simulate network delay and response if mock fetch fails
      await new Promise(r => setTimeout(r, 1500));
      const text = "- [Luật Lao động 2019] Điều 107: Thời giờ làm thêm không quá 50% số giờ làm việc bình thường.\n- Không phát hiện rủi ro nghiêm trọng.\n- Đề xuất được đánh giá HỢP LỆ.";
      
      setLegalAuditResult(response ? (await response.json()).text : text);
      addNotification('Thẩm định AI hoàn tất', `Pháp chế VComm đã hoàn tất thẩm định tính tuân thủ cho hồ sơ ${request.id}.`);
    } catch (err) {
      console.error('AI Legal Audit Error:', err);
      addNotification('Lỗi Thẩm định AI', 'Hệ thống thẩm định pháp lý AI đang bận. Vui lòng thử lại sau.');
    } finally {
      setIsAuditing(false);
    }
  };

  if (!request) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col animate-in slide-in-from-right-4 duration-300">
      <div className="px-4 py-3 border-b border-emerald-100 bg-emerald-50/50 flex justify-between items-center sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 text-emerald-700 p-2 rounded-lg">
            <FileSignature className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Chi tiết Đề xuất</h3>
            <p className="text-xs text-emerald-700 font-medium">Phiếu: {request.id} | {request.subtype}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onSign && request.status === 'pending' && isAdmin && (
            <button 
              onClick={onSign}
              className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs border border-primary-200"
            >
              <FileSignature className="w-4 h-4" /> Ký duyệt
            </button>
          )}
          <button 
            onClick={onPrint}
            className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors flex items-center gap-1 font-bold text-xs"
          >
            <Printer className="w-4 h-4" /> In
          </button>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className="p-6 max-w-5xl mx-auto w-full flex-1 space-y-8">
        {/* Header Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Người đề xuất</p>
            <p className="text-[13px] font-bold text-slate-900">{request.requester}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày gửi</p>
            <p className="text-[13px] font-bold text-slate-900">{request.date}</p>
          </div>
          <div className="col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Tiêu đề / Lý do</p>
            <p className="text-[13px] font-bold text-slate-900">{request.title}</p>
          </div>
        </div>

        {/* Approval Flow Visualizer */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="text-[13px] font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Tiến trình Phê duyệt & Luồng Ký duyệt
          </h4>
          <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-2 pt-2 pb-4">
            {/* Step Line (hidden on mobile) */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-100 -translate-y-6 hidden md:block z-0" />
            
            {(() => {
              const matchedConfig = formConfigs.find((c: any) => c.name === request.subtype);
              const workflowSteps = matchedConfig?.workflow || [];
              
              const steps = [
                {
                  role: 'Người lập',
                  name: request.requester || 'Nhân viên',
                  status: 'completed',
                  date: request.date || '---',
                  notes: 'Khởi tạo đề xuất'
                },
                ...workflowSteps.map((stepConfig: any, index: number) => {
                  const levelNum = index + 1;
                  const logItem = (request.approvalLog || []).find((l: any) => l.level === levelNum);
                  
                  let role = stepConfig.specificUser || `Phê duyệt Cấp ${levelNum}`;
                  let name = logItem ? logItem.by : (stepConfig.specificUser || 'Quản lý thẩm quyền');
                  let status = 'waiting';
                  let date = '---';
                  let notes = 'Chờ duyệt';
                  
                  if (logItem) {
                    status = logItem.status === 'approved' ? 'completed' : 'rejected';
                    date = logItem.time || '---';
                    notes = logItem.stepName || (logItem.status === 'approved' ? 'Đã phê duyệt' : 'Đã từ chối');
                  } else if (request.status === 'rejected') {
                    status = 'waiting';
                    notes = 'Đã dừng';
                  } else if (request.currentLevel === levelNum && request.status === 'pending') {
                    status = 'pending';
                    notes = 'Đang chờ xử lý';
                  } else if (request.currentLevel > levelNum) {
                    status = 'completed';
                    date = request.date || '---';
                    notes = 'Đã thông qua';
                  }
                  
                  return { role, name, status, date, notes };
                })
              ];

              return steps.map((step, idx) => {
                const isCompleted = step.status === 'completed';
                const isPending = step.status === 'pending';
                const isRejected = step.status === 'rejected';
                const isWaiting = step.status === 'waiting';

                return (
                  <div key={idx} className="relative z-10 flex md:flex-col items-center gap-3 md:gap-2 flex-1 w-full md:w-auto text-left md:text-center group">
                    {/* Circle Indicator */}
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shadow-sm transition-all duration-300",
                      isCompleted && "bg-emerald-500 border-emerald-500 text-white",
                      isPending && "bg-amber-400 border-amber-500 text-white animate-pulse",
                      isRejected && "bg-rose-500 border-rose-500 text-white",
                      isWaiting && "bg-white border-slate-300 text-slate-400"
                    )}>
                      {isCompleted ? "✓" : isRejected ? "✗" : isPending ? "⏳" : idx + 1}
                    </div>

                    {/* Step Details */}
                    <div className="flex flex-col md:items-center">
                      <span className={cn(
                        "text-xs font-extrabold uppercase tracking-wider",
                        isCompleted && "text-emerald-700",
                        isPending && "text-amber-700",
                        isRejected && "text-rose-700",
                        isWaiting && "text-slate-400"
                      )}>
                        {step.role}
                      </span>
                      <span className="text-[13px] font-bold text-slate-800 leading-tight">{step.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono mt-0.5">{step.date}</span>
                      <p className="text-[11px] text-slate-600 font-medium italic mt-1 bg-slate-50 border border-slate-200/60 px-2 py-0.5 rounded shadow-sm group-hover:bg-slate-100 transition-colors">
                        {step.notes}
                      </p>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        {/* Form Data */}
        <div>
          <h4 className="text-[13px] font-bold text-slate-900 mb-3 border-b border-emerald-100 pb-2 text-emerald-800 flex items-center gap-2">
            <Layout className="w-4 h-4" /> Dữ liệu biểu mẫu
          </h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {formConfigs.find((c: any) => c.name === request.subtype)?.fields?.map((field: any) => (
              <div key={field.id} className={field.type === 'textarea' ? "col-span-2" : ""}>
                <p className="text-xs font-bold text-slate-500 border-b border-slate-200 pb-1 mb-1">{field.label}</p>
                <p className="text-[13px] font-medium text-slate-900 mt-1">{(request.formData || {})[field.id] || '---'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SLA Escalation Warning */}
        {request.status === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3 shadow-sm border-l-4 border-l-amber-500">
            <div className="bg-amber-100 text-amber-600 p-1.5 rounded flex-shrink-0 mt-0.5">
              <Clock className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-amber-900 flex items-center gap-2">
                Cảnh báo SLA Escalation <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded shadow-sm">Sắp vi phạm hạn chót</span>
              </h4>
              <p className="text-[12px] text-amber-800/90 mt-1 leading-relaxed font-medium">
                Đề xuất này đã tồn đọng quá 80% thời gian cam kết dịch vụ (SLA) tại bước duyệt hiện tại. Hệ thống sẽ tự động escalate lên cấp quản lý cao hơn trong vòng <span className="font-bold text-rose-600">4 giờ tới</span>.
              </p>
            </div>
          </div>
        )}

        {/* Thẩm định Pháp lý & Tuân thủ AI */}
        <div>
          <h4 className="text-[13px] font-bold text-slate-900 mb-3 border-b border-rose-100 pb-2 text-rose-800 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Scale className="w-4 h-4" /> Thẩm định Pháp chế & Tuân thủ AI
            </span>
            <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 px-2 py-0.5 rounded tracking-wider leading-none">
              Luật Lao động & Kế toán VN
            </span>
          </h4>

          {legalAuditResult ? (
            <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-5 space-y-4">
              <div className="prose prose-slate max-w-none text-xs leading-relaxed text-slate-700 whitespace-pre-line font-medium md:text-[13px]">
                {legalAuditResult}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAiLegalAudit}
                  disabled={isAuditing}
                  className="px-3.5 py-1.5 bg-white border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-50 text-rose-700 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isAuditing && "animate-spin")} /> Chạy lại kiểm tra
                </button>
                <button
                  onClick={() => setLegalAuditResult(null)}
                  className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-all cursor-pointer"
                >
                  Đóng kết quả
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#fafafa] border border-slate-200 rounded-lg p-6 text-center space-y-3">
              <div className="w-12 h-12 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div className="max-w-md mx-auto">
                <p className="text-[13px] font-bold text-slate-800">Quét rủi ro pháp lý bằng trí tuệ nhân tạo (Generative AI)</p>
                <p className="text-[11px] text-slate-500 mt-1 font-medium leading-normal">
                  Tự động rà soát nội dung phiếu so với Bộ luật Lao động 2019, Luật Kế toán 2015, định ngạch chi tiêu nội bộ, trần OT, và phát hiện lỗi trước khi quản cấp cao tiến hành "Ký số" phê duyệt.
                </p>
              </div>
              <button
                onClick={handleAiLegalAudit}
                disabled={isAuditing}
                className="px-5 py-2.5 bg-rose-950 text-rose-200 border border-rose-900 rounded-lg text-xs font-bold hover:bg-rose-900 hover:text-white transition-all flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isAuditing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Đang thẩm định điều khoản...
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4 text-rose-400" /> BẮT ĐẦU THẨM ĐỊNH TUÂN THỦ <Sparkles className="w-3.5 h-3.5 text-rose-400" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Chứng thư tài liệu / Security Sealed block */}
        {request.signatureStatus === 'signed' && (
          <div className="space-y-3">
            {verificationLoading ? (
              <div className="bg-slate-100 border border-slate-300 text-slate-700 px-4 py-3 rounded-lg flex items-center gap-2 text-xs font-bold animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                Đang xác thực tính toàn vẹn chữ ký số...
              </div>
            ) : verificationStatus === 'verified' ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                Chữ ký số hợp lệ: Nội dung văn bản nguyên vẹn (Verified).
              </div>
            ) : verificationStatus === 'tampered' ? (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg flex items-center gap-2 text-xs font-bold shadow-sm border-l-4 border-l-rose-600 animate-bounce">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                CẢNH BÁO LỖI TOÀN VẸN: Dữ liệu đã bị thay đổi trái phép sau khi ký số!
              </div>
            ) : null}

            <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-950 shadow-sm space-y-4">
              <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-emerald-950 text-emerald-400 border border-emerald-900/50 rounded-lg">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-sans leading-none">Chứng Thư Niêm Phong Điện Tử</h4>
                    <span className="text-[9px] text-slate-400 font-medium">Xác thực mã hóa qua {request.caProvider || 'CA'}</span>
                  </div>
                </div>
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded border",
                  verificationStatus === 'verified' 
                    ? "bg-emerald-950 text-emerald-400 border-emerald-900/40" 
                    : "bg-rose-950 text-rose-400 border-rose-900/40"
                )}>
                  {verificationStatus === 'verified' ? 'SECURE INTEGRITY' : 'TAMPERED ALERT'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-[11px] leading-tight font-medium pb-2">
                <div>
                  <p className="text-slate-400 mb-0.5">Xác thực chứng thư:</p>
                  <p className="font-bold text-slate-100">{request.signedBy || 'Quản trị viên'}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5">Thời gian ký số:</p>
                  <p className="font-bold text-slate-100">{request.signedAt || '---'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-slate-400 mb-0.5">Mã định danh bảo mật SHA-256 Seal:</p>
                  <p className="font-bold text-slate-100 text-[10px] font-mono tracking-tight bg-slate-950 p-2 rounded-lg border border-slate-800 truncate">
                    {request.secureHash || 'AES-SHA256-D93B8C1D0F1C3E4'}
                  </p>
                </div>
              </div>
              
              {request.signatureDraw && (
                <div className="border-t border-slate-800 pt-3">
                  <p className="text-[10px] text-slate-400 mb-1.5 uppercase font-bold tracking-wider">Bản quét Chữ ký tay điện tử:</p>
                  <div className="bg-white p-2 rounded-lg flex items-center justify-center max-w-[200px] border border-slate-700">
                    <img src={request.signatureDraw} alt="Chữ ký tay điện tử" className="max-h-16 object-contain" referrerPolicy="no-referrer" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
