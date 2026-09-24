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
  ChevronRight,
  Cpu,
  Radio,
  FileCheck2,
  Truck,
  Receipt,
  Landmark,
  ShieldCheck,
  Copy
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
  // Quota percentage calculation
  const totalQuota = companyHsm.totalSignaturesQuota || 20000;
  const remainingQuota = companyHsm.remainingSignatures;
  const usedQuota = Math.max(0, totalQuota - remainingQuota);
  const usedPercent = Math.min(100, Math.round((usedQuota / totalQuota) * 100));

  return (
    <div className="p-4 md:p-6 space-y-5 animate-in fade-in max-w-7xl mx-auto" data-testid="company-hsm-manager">
      {/* 1. Banner kiểm tra kết nối thành công */}
      {testHsmSuccess && (
        <div 
          className="bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-400 dark:border-emerald-600 rounded-2xl p-4 flex items-center justify-between gap-4 text-emerald-900 dark:text-emerald-100 text-xs shadow-xs animate-in fade-in"
          data-testid="hsm-connected-banner"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-sm text-emerald-950 dark:text-emerald-200 block">
                Kiểm tra kết nối HSM thành công!
              </span>
              <span className="text-emerald-700 dark:text-emerald-300">
                Cụm Cloud HSM <strong className="text-emerald-950 dark:text-white">{companyHsm.provider}</strong> phản hồi với độ trễ <strong className="text-emerald-950 dark:text-white">14ms</strong>, Slot Token sẵn sàng xử lý ký số với tốc độ <strong className="text-emerald-950 dark:text-white">{companyHsm.tpsSpeed} TPS</strong>.
              </span>
            </div>
          </div>
          <button
            onClick={onOpenInspectHsm}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Soi X.509</span>
          </button>
        </div>
      )}

      {/* 2. Corporate Digital Identity Card (Thẻ Định Danh Pháp Nhân Ký Số Cao Cấp) */}
      <div 
        className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 md:p-6 rounded-2xl shadow-lg relative overflow-hidden border border-slate-800/80"
        data-testid="certificate-identity-card"
      >
        {/* Glow background effects */}
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-20 w-80 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-400/10 border border-amber-400/25 flex items-center justify-center text-amber-400 shadow-inner flex-shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-400/20">
                  Chứng Thư Số Pháp Nhân Công Ty
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold rounded-full inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Có hiệu lực
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black text-white mt-1 tracking-tight" data-testid="company-name">
                {companyHsm.companyName}
              </h2>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
            <button
              onClick={onTestHsm}
              disabled={isTestingHsm}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              data-testid="btn-test-hsm"
            >
              {isTestingHsm ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-300" />
              ) : (
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>{isTestingHsm ? 'Đang kiểm tra...' : 'Test Kết Nối HSM'}</span>
            </button>

            <button
              onClick={onOpenInspectHsm}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-900/30 cursor-pointer"
              data-testid="btn-open-inspect-hsm"
            >
              <Eye className="w-3.5 h-3.5 text-amber-300" />
              <span>Soi Chi Tiết X.509 v3 &amp; Chuỗi CA</span>
            </button>
          </div>
        </div>

        {/* Certificate Metadata Ribbon */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 text-xs">
          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase block font-medium">Mã số thuế</span>
            <span className="font-mono font-bold text-white tracking-wider text-xs md:text-sm" data-testid="company-taxcode">
              {companyHsm.taxCode}
            </span>
          </div>

          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase block font-medium">Nhà cung cấp CA</span>
            <span className="font-bold text-white text-xs md:text-sm truncate block">
              {companyHsm.provider}
            </span>
          </div>

          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase block font-medium">Tiêu chuẩn bảo mật</span>
            <span className="font-bold text-indigo-200 text-xs truncate block">
              {companyHsm.fipsStandard}
            </span>
          </div>

          <div className="p-2.5 bg-white/5 rounded-xl border border-white/10">
            <span className="text-[10px] text-slate-400 uppercase block font-medium">Thời gian còn lại</span>
            <span className="font-bold text-amber-300 text-xs md:text-sm flex items-center gap-1" data-testid="days-remaining">
              <Clock className="w-3 h-3 text-amber-400" /> {`${companyHsm.daysRemaining} ngày`}
            </span>
          </div>
        </div>

        {/* Technical Sub-row: Subject DN & Serial */}
        <div className="relative z-10 pt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/10 flex items-center justify-between gap-2 overflow-hidden">
            <span className="text-[10px] font-sans text-slate-400 uppercase flex-shrink-0 font-medium">Subject DN:</span>
            <span className="text-slate-300 truncate" title={companyHsm.subjectDN} data-testid="subject-dn">
              {companyHsm.subjectDN}
            </span>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-xl border border-white/10 flex items-center justify-between gap-2 overflow-hidden">
            <span className="text-[10px] font-sans text-slate-400 uppercase flex-shrink-0 font-medium">Serial (Hex):</span>
            <span className="text-amber-300 font-bold truncate tracking-wider" data-testid="serial-number">
              {companyHsm.serialNumber}
            </span>
          </div>
        </div>

        {/* Validity dates banner */}
        <div className="relative z-10 pt-2 flex items-center justify-between text-[11px] text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span>Ngày cấp: <strong className="text-slate-200 font-mono" data-testid="valid-from">{companyHsm.validFrom}</strong></span>
            <span>•</span>
            <span>Ngày hết hạn: <strong className="text-slate-200 font-mono" data-testid="valid-to">{companyHsm.validTo}</strong></span>
          </div>
          <div className="text-[10px] text-indigo-300/80 truncate max-w-sm">
            Cấp bởi: {companyHsm.issuer}
          </div>
        </div>
      </div>

      {/* 3. Main Dashboard Grid (2 Cột Cân Đối: Hạ Tầng HSM vs Quy Tắc Ký Tự Động) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CỘT TRÁI: GIÁM SÁT PHẦN CỨNG & HẠ TẦNG CLOUD HSM */}
        <div 
          className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4"
          data-testid="hsm-monitoring-card"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Giám Sát Phần Cứng &amp; Hạ Tầng Cloud HSM</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Thông số Slot PKCS#11, Token Label và hạn ngạch lượt ký</p>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-md text-[10px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live
            </span>
          </div>

          {/* 4 Chỉ số phần cứng */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase block font-semibold">Slot ID</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs truncate block" data-testid="slot-id">
                {companyHsm.slotId}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase block font-semibold">Token Label</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-xs truncate block" data-testid="token-label">
                {companyHsm.tokenLabel}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase block font-semibold">Tốc độ Ký</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs block" data-testid="tps-speed">
                {`${companyHsm.tpsSpeed} TPS`}
              </span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 dark:text-slate-400 uppercase block font-semibold">Mã PIN Slot</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100 text-[11px] truncate block" data-testid="slot-pin">
                •••••••••••• (HSM Enclave Protected)
              </span>
            </div>
          </div>

          {/* Quota Progress Card */}
          <div className="p-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-800/70 dark:to-slate-800/40 rounded-xl border border-indigo-100 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Hạn ngạch gói ký số HSM:</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white font-mono text-xs">
                {`${remainingQuota.toLocaleString('vi-VN')} / ${totalQuota.toLocaleString('vi-VN')} lượt (${100 - usedPercent}% còn lại)`}
              </span>
            </div>
            
            <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  usedPercent > 85 ? "bg-amber-500" : "bg-gradient-to-r from-indigo-600 to-indigo-500"
                )}
                style={{ width: `${usedPercent}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
              <span>Đã sử dụng: <strong className="text-slate-700 dark:text-slate-300 font-mono">{usedQuota.toLocaleString('vi-VN')}</strong> lượt</span>
              <span className="text-indigo-700 dark:text-indigo-300 font-semibold">Gói Doanh Nghiệp Không Giới Hạn Phiên</span>
            </div>
          </div>

          {/* Endpoint & mTLS Info Bar */}
          <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="truncate">
              <span className="text-slate-400 font-medium mr-1.5">Endpoint:</span>
              <code className="font-mono font-bold text-indigo-900 dark:text-indigo-300 text-xs" data-testid="server-endpoint">
                {companyHsm.serverEndpoint}
              </code>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 flex-shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>TLS 1.3 / mTLS Enforced</span>
            </span>
          </div>
        </div>

        {/* CỘT PHẢI: CẤU HÌNH KÝ TỰ ĐỘNG & GHI CHÚ BẢO MẬT */}
        <div className="space-y-4">
          <div 
            className="bg-white dark:bg-slate-900 p-5 md:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3.5"
            data-testid="auto-sign-rules-card"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Cấu Hình Quy Tắc Ký Tự Động (Auto-Sign)</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Tự động kích hoạt ký Cloud HSM theo sự kiện luồng nghiệp vụ ERP</p>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {/* Rule 1: Hóa Đơn Điện Tử */}
              <div className="p-3 bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      Hóa Đơn Điện Tử (Nghị định 123 / TT78)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Tự động ký số khi đơn hàng giao thành công hoặc xuất hóa đơn VAT
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={companyHsm.autoSignRules.invoices}
                    onChange={() => onToggleAutoSign('invoices')}
                    className="sr-only peer"
                    data-testid="toggle-auto-sign-invoices"
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Rule 2: Phiếu Xuất Kho */}
              <div className="p-3 bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center flex-shrink-0">
                    <Truck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      Phiếu Xuất Kho Vận Chuyển 3PL (GHN/GHTK)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Ký số lệnh xuất kho bàn giao đơn vị vận chuyển 3PL
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={companyHsm.autoSignRules.warehouseReceipts}
                    onChange={() => onToggleAutoSign('warehouseReceipts')}
                    className="sr-only peer"
                    data-testid="toggle-auto-sign-warehouse"
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Rule 3: Biên Bản Đối Soát Công Nợ */}
              <div className="p-3 bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      Biên Bản Đối Soát Công Nợ Nhà Bán (T+7)
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Tự động ký đối soát doanh thu sàn &amp; phí hoa hồng định kỳ T+7
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={companyHsm.autoSignRules.reconciliations}
                    onChange={() => onToggleAutoSign('reconciliations')}
                    className="sr-only peer"
                    data-testid="toggle-auto-sign-reconciliations"
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Rule 4: Tờ Khai Thuế Định Kỳ */}
              <div className="p-3 bg-slate-50/90 dark:bg-slate-800/60 hover:bg-slate-100/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-3 transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 flex items-center justify-center flex-shrink-0">
                    <Landmark className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      Tờ Khai Thuế Định Kỳ
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      Yêu cầu duyệt thủ công của Kế toán trưởng trước khi ký gửi CQT
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={companyHsm.autoSignRules.taxDeclarations}
                    onChange={() => onToggleAutoSign('taxDeclarations')}
                    className="sr-only peer"
                    data-testid="toggle-auto-sign-tax"
                  />
                  <div className="w-9 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Ghi chú bảo mật pháp lý tinh tế & gọn gàng */}
          <div 
            className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300/80 dark:border-amber-700/60 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 shadow-xs flex items-start gap-3"
            data-testid="legal-security-notice"
          >
            <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-xs text-amber-950 dark:text-amber-100">
                Lưu Ý Bảo Mật Pháp Lý (TT 16/2019/TT-BTTTT)
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                Khóa ký số HSM được lưu trữ an toàn trong vùng bảo mật chuẩn FIPS 140-2 Level 3 của nhà cung cấp. Mọi giao dịch ký số tự động đều được gắn kèm Dấu thời gian điện tử (Timestamp Authority - TSA). Tuân thủ Luật Giao dịch điện tử và Nghị định 130/2018/NĐ-CP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyHsmManager;
