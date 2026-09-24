import React from 'react';
import {
  Shield,
  CheckCircle2,
  Activity,
  Loader2,
  AlertTriangle,
  Server,
  Zap,
  Lock,
  Eye,
  Key,
  Layers,
  FileText,
  Clock,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { CompanyHSMProfile } from '../../data/hsmSignatureData';

export interface CompanyHsmManagerProps {
  companyHsm: CompanyHSMProfile;
  onToggleAutoSign: (rule: keyof CompanyHSMProfile['autoSignRules']) => void;
  onTestHsm: () => void;
  onOpenInspectHsm: () => void;
  isTestingHsm: boolean;
  testHsmSuccess: boolean;
}

export const CompanyHsmManager: React.FC<CompanyHsmManagerProps> = ({
  companyHsm,
  onToggleAutoSign,
  onTestHsm,
  onOpenInspectHsm,
  isTestingHsm,
  testHsmSuccess
}) => {
  // Quota percentage
  const totalQuota = companyHsm.totalSignaturesQuota || 20000;
  const remainingQuota = companyHsm.remainingSignatures;
  const usedQuota = Math.max(0, totalQuota - remainingQuota);
  const usedPercent = Math.min(100, Math.round((usedQuota / totalQuota) * 100));

  return (
    <div className="p-6 space-y-6 animate-in fade-in" data-testid="company-hsm-manager">
      {/* Banner kết nối thành công */}
      {testHsmSuccess && (
        <div 
          className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-4 text-emerald-900 text-xs shadow-xs animate-in fade-in"
          data-testid="hsm-connected-banner"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-emerald-950 block">
                Kiểm tra kết nối HSM thành công!
              </span>
              <span className="text-emerald-700">
                Cụm Cloud HSM <strong className="text-emerald-900">{companyHsm.provider}</strong> phản hồi với độ trễ <strong className="text-emerald-900">14ms</strong>, Slot Token sẵn sàng xử lý ký số với tốc độ <strong className="text-emerald-900">{companyHsm.tpsSpeed} TPS</strong>.
              </span>
            </div>
          </div>
          <button
            onClick={onOpenInspectHsm}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors flex-shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            Soi X.509
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Certificate Identity Card & Cloud HSM Infrastructure Monitoring */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thẻ định danh Chứng Thư Số Doanh Nghiệp (Certificate Identity Card) */}
          <div 
            className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4 relative overflow-hidden border border-slate-800"
            data-testid="certificate-identity-card"
          >
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                  Chứng Thư Số Pháp Nhân Công Ty
                </span>
              </div>
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-black rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Có hiệu lực
              </span>
            </div>

            <div className="relative z-10">
              <h2 className="text-lg font-black text-white" data-testid="company-name">
                {companyHsm.companyName}
              </h2>
              <div className="text-xs text-indigo-200 mt-1.5 flex items-center gap-3 flex-wrap">
                <span>Mã số thuế: <strong className="text-white font-mono" data-testid="company-taxcode">{companyHsm.taxCode}</strong></span>
                <span>•</span>
                <span>Nhà cung cấp: <strong className="text-white">{companyHsm.provider}</strong></span>
                <span>•</span>
                <span>Tiêu chuẩn: <strong className="text-white">{companyHsm.fipsStandard}</strong></span>
              </div>
            </div>

            <div className="p-3.5 bg-white/5 rounded-xl border border-white/10 font-mono text-xs text-indigo-100 break-all space-y-1 relative z-10">
              <div className="text-[10px] text-slate-400 uppercase font-sans">Subject DN:</div>
              <div className="text-[11px] text-slate-300" data-testid="subject-dn">{companyHsm.subjectDN}</div>
              <div className="text-[10px] text-slate-400 uppercase font-sans pt-1">Serial Number (Hex):</div>
              <div className="text-amber-300 font-bold tracking-wider" data-testid="serial-number">{companyHsm.serialNumber}</div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs pt-2 border-t border-white/10 relative z-10">
              <div>
                <span className="block text-slate-400 text-[10px]">Ngày cấp</span>
                <span className="font-semibold text-slate-200" data-testid="valid-from">{companyHsm.validFrom}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px]">Ngày hết hạn</span>
                <span className="font-semibold text-slate-200" data-testid="valid-to">{companyHsm.validTo}</span>
              </div>
              <div>
                <span className="block text-slate-400 text-[10px]">Thời gian còn lại</span>
                <span className="font-bold text-amber-300" data-testid="days-remaining">{`${companyHsm.daysRemaining} ngày`}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between relative z-10">
              <div className="text-[11px] text-indigo-300 flex items-center gap-1">
                <span>Cơ quan cấp:</span>
                <span className="text-white font-medium truncate max-w-xs">{companyHsm.issuer}</span>
              </div>
              <button
                onClick={onOpenInspectHsm}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-colors shadow-sm"
                data-testid="btn-open-inspect-hsm"
              >
                <Eye className="w-4 h-4" />
                Soi Chi Tiết X.509 v3 & Chuỗi CA
              </button>
            </div>
          </div>

          {/* Giám Sát Phần Cứng & Hạ Tầng HSM (Cloud HSM Monitoring) */}
          <div 
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
            data-testid="hsm-monitoring-card"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Giám Sát Phần Cứng & Hạ Tầng Cloud HSM</h3>
                <p className="text-xs text-slate-500">Giám sát Slot PKCS#11, Token ID, lưu lượng quota và khả năng đáp ứng</p>
              </div>
              <button
                onClick={onTestHsm}
                disabled={isTestingHsm}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50"
                data-testid="btn-test-hsm"
              >
                {isTestingHsm ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Activity className="w-3.5 h-3.5 text-indigo-600" />
                )}
                <span>Test Kết Nối HSM</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Slot ID</span>
                <span className="font-mono font-bold text-slate-800" data-testid="slot-id">{companyHsm.slotId}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Token Label</span>
                <span className="font-mono font-bold text-slate-800" data-testid="token-label">{companyHsm.tokenLabel}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Tốc độ Ký (TPS)</span>
                <span className="font-bold text-emerald-600" data-testid="tps-speed">{`${companyHsm.tpsSpeed} TPS`}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">Mã PIN Slot</span>
                <span className="font-mono font-bold text-slate-800" data-testid="slot-pin">•••••••••••• (HSM Enclave Protected)</span>
              </div>
            </div>

            {/* Quota bar & Remaining Signatures */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Hạn ngạch gói ký số HSM:</span>
                <span className="font-bold text-slate-800">
                  {`${remainingQuota.toLocaleString('vi-VN')} / ${totalQuota.toLocaleString('vi-VN')} lượt (${100 - usedPercent}% còn lại)`}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    usedPercent > 85 ? "bg-amber-500" : "bg-indigo-600"
                  )}
                  style={{ width: `${usedPercent}%` }}
                ></div>
              </div>
            </div>

            <div className="text-xs text-slate-500 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 flex items-center justify-between">
              <div>
                Endpoint kết nối: <code className="font-mono font-bold text-indigo-900" data-testid="server-endpoint">{companyHsm.serverEndpoint}</code>
              </div>
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                TLS 1.3 / mTLS Enforced
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Cấu hình Quy Tắc Ký Tự Động (Auto-Sign Rules) */}
        <div className="space-y-6">
          <div 
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4"
            data-testid="auto-sign-rules-card"
          >
            <div>
              <h3 className="font-bold text-sm text-slate-900">Cấu Hình Quy Tắc Ký Tự Động (Auto-Sign)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tự động kích hoạt ký Cloud HSM theo sự kiện luồng nghiệp vụ ERP</p>
            </div>

            <div className="space-y-3">
              {/* Rule 1: Hóa Đơn Điện Tử */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">Hóa Đơn Điện Tử (Nghị định 123 / TT78)</div>
                  <div className="text-[11px] text-slate-500">Tự động ký số khi đơn hàng giao thành công hoặc xuất hóa đơn VAT</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={companyHsm.autoSignRules.invoices}
                    onChange={() => onToggleAutoSign('invoices')}
                    className="sr-only peer"
                    data-testid="toggle-auto-sign-invoices"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Rule 2: Phiếu Xuất Kho */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">Phiếu Xuất Kho Vận Chuyển 3PL (GHN/GHTK)</div>
                  <div className="text-[11px] text-slate-500">Ký số lệnh xuất kho bàn giao đơn vị vận chuyển 3PL</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={companyHsm.autoSignRules.warehouseReceipts}
                    onChange={() => onToggleAutoSign('warehouseReceipts')}
                    className="sr-only peer"
                    data-testid="toggle-auto-sign-warehouse"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Rule 3: Biên Bản Đối Soát Công Nợ */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">Biên Bản Đối Soát Công Nợ Nhà Bán (T+7)</div>
                  <div className="text-[11px] text-slate-500">Tự động ký đối soát doanh thu sàn & phí hoa hồng định kỳ T+7</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={companyHsm.autoSignRules.reconciliations}
                    onChange={() => onToggleAutoSign('reconciliations')}
                    className="sr-only peer"
                    data-testid="toggle-auto-sign-reconciliations"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Rule 4: Tờ Khai Thuế Định Kỳ */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-900">Tờ Khai Thuế Định Kỳ</div>
                  <div className="text-[11px] text-slate-500">Yêu cầu duyệt thủ công của Kế toán trưởng trước khi ký gửi CQT</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={companyHsm.autoSignRules.taxDeclarations}
                    onChange={() => onToggleAutoSign('taxDeclarations')}
                    className="sr-only peer"
                    data-testid="toggle-auto-sign-tax"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Ghi chú bảo mật pháp lý */}
          <div 
            className="bg-amber-50 rounded-2xl border border-amber-200 p-5 space-y-2 text-xs text-amber-900 shadow-xs"
            data-testid="legal-security-notice"
          >
            <div className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              Lưu Ý Bảo Mật Pháp Lý (TT 16/2019/TT-BTTTT)
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Khóa ký số HSM được lưu trữ an toàn trong vùng bảo mật chuẩn FIPS 140-2 Level 3 của nhà cung cấp. Mọi giao dịch ký số tự động đều được gắn kèm Dấu thời gian điện tử (Timestamp Authority - TSA). Tuân thủ Luật Giao dịch điện tử và Nghị định 130/2018/NĐ-CP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyHsmManager;
