import React, { useMemo } from 'react';
import {
  Server,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  FileSignature,
  Layers,
  Sparkles,
  Activity,
  UserCheck,
  UserX,
  ChevronRight,
  TrendingUp,
  Zap,
  Loader2,
  Shield,
  Eye,
  FileCheck,
  RefreshCw
} from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';
import {
  CompanyHSMProfile,
  PersonalCertificate,
  SigningDocument,
  isExpiringSoon
} from '../../data/hsmSignatureData';

export interface SignatureDashboardProps {
  companyHsm: CompanyHSMProfile;
  personalCerts: PersonalCertificate[];
  documents: SigningDocument[];
  onNavigateTab: (tabId: 'company_hsm' | 'personal_certs' | 'signing_workspace' | 'authority_matrix' | 'audit_logs') => void;
  onOpenInspectHsm: () => void;
  onTestHsm: () => void;
  isTestingHsm: boolean;
  testHsmSuccess: boolean;
  onQuickBatchSign?: () => void;
  onQuickIssueCert?: () => void;
}

// 7-day activity trend mock data with realistic numbers
interface DailyActivity {
  dayLabel: string;
  dateStr: string;
  invoices: number;
  warehouseReceipts: number;
  contracts: number;
  taxDeclarations: number;
  total: number;
}

const SEVEN_DAYS_ACTIVITY: DailyActivity[] = [
  { dayLabel: 'T5', dateStr: '18/09', invoices: 620, warehouseReceipts: 240, contracts: 90, taxDeclarations: 15, total: 965 },
  { dayLabel: 'T6', dateStr: '19/09', invoices: 780, warehouseReceipts: 310, contracts: 140, taxDeclarations: 45, total: 1275 },
  { dayLabel: 'T7', dateStr: '20/09', invoices: 890, warehouseReceipts: 350, contracts: 110, taxDeclarations: 20, total: 1370 },
  { dayLabel: 'CN', dateStr: '21/09', invoices: 450, warehouseReceipts: 180, contracts: 40, taxDeclarations: 10, total: 680 },
  { dayLabel: 'T2', dateStr: '22/09', invoices: 920, warehouseReceipts: 380, contracts: 160, taxDeclarations: 60, total: 1520 },
  { dayLabel: 'T3', dateStr: '23/09', invoices: 1050, warehouseReceipts: 410, contracts: 180, taxDeclarations: 80, total: 1720 },
  { dayLabel: 'Hôm nay', dateStr: '24/09', invoices: 850, warehouseReceipts: 280, contracts: 170, taxDeclarations: 130, total: 1430 }
];

export const SignatureDashboard: React.FC<SignatureDashboardProps> = ({
  companyHsm,
  personalCerts,
  documents,
  onNavigateTab,
  onOpenInspectHsm,
  onTestHsm,
  isTestingHsm,
  testHsmSuccess,
  onQuickBatchSign,
  onQuickIssueCert
}) => {
  // Quota calculation
  const totalQuota = companyHsm.totalSignaturesQuota || 20000;
  const remainingQuota = companyHsm.remainingSignatures;
  const usedQuota = Math.max(0, totalQuota - remainingQuota);
  const usedPercent = Math.min(100, Math.round((usedQuota / totalQuota) * 100));

  // Personal Certs calculations
  const activeCerts = useMemo(() => {
    return personalCerts.filter(c => c.status === 'active');
  }, [personalCerts]);

  const suspendedCerts = useMemo(() => {
    return personalCerts.filter(c => c.status === 'suspended' || c.status === 'revoked');
  }, [personalCerts]);

  // Certs expiring within 90 days
  const expiringSoonCerts = useMemo(() => {
    return personalCerts.filter(c => c.status === 'active' && isExpiringSoon(c.expiryDate, 90));
  }, [personalCerts]);

  // Pending Documents calculations
  const pendingDocs = useMemo(() => {
    return documents.filter(d => d.status === 'pending');
  }, [documents]);

  const urgentDocs = useMemo(() => {
    return pendingDocs.filter(d => d.priority === 'urgent' || d.priority === 'high');
  }, [pendingDocs]);

  const totalPendingAmount = useMemo(() => {
    return pendingDocs.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [pendingDocs]);

  // 7-day stats summary
  const totalWeekSignatures = useMemo(() => {
    return SEVEN_DAYS_ACTIVITY.reduce((sum, item) => sum + item.total, 0);
  }, []);

  const avgDailyTransactions = Math.round(totalWeekSignatures / SEVEN_DAYS_ACTIVITY.length);
  const maxDailyValue = Math.max(...SEVEN_DAYS_ACTIVITY.map(d => d.total));

  return (
    <div className="space-y-6 animate-in fade-in" data-testid="signature-dashboard">
      {/* Realtime HSM Test Banner */}
      {testHsmSuccess && (
        <div 
          className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-4 text-emerald-900 text-xs shadow-xs animate-in fade-in"
          data-testid="hsm-test-success-banner"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-emerald-950">
                Kiểm tra kết nối Cụm Cloud HSM thành công!
              </div>
              <div className="text-emerald-700 mt-0.5">
                Cụm Cloud HSM <strong className="font-semibold text-emerald-900">{companyHsm.provider}</strong> phản hồi với độ trễ <strong className="font-bold text-emerald-900">14ms</strong>, tốc độ xử lý <strong className="font-bold text-emerald-900">{companyHsm.tpsSpeed} TPS</strong>. Sẵn sàng ký số pháp nhân theo chuẩn FIPS 140-2 Level 3.
              </div>
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

      {/* Hero KPI Cards: 4 Thẻ chỉ số cao cấp */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="hero-kpi-cards">
        {/* KPI 1: Trạng thái Cụm Cloud HSM */}
        <div 
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all group flex flex-col justify-between"
          data-testid="kpi-hsm-status"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Cụm Cloud HSM Công Ty
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-[11px] rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Operational
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <h4 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {companyHsm.provider}
                </h4>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>Tốc độ: <strong className="text-slate-800 font-semibold">{`${companyHsm.tpsSpeed} TPS`}</strong></span>
                  <span>•</span>
                  <span>Độ trễ: <strong className="text-emerald-600 font-semibold">14ms</strong></span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Server className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <button
              onClick={onOpenInspectHsm}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors"
              data-testid="btn-inspect-hsm-kpi"
            >
              <Eye className="w-3.5 h-3.5" />
              Soi X.509
            </button>
            <button
              onClick={() => onNavigateTab('company_hsm')}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5 transition-colors font-medium"
            >
              Quản trị HSM
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 2: Hạn Ngạch Lượt Ký HSM (Quota) */}
        <div 
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all group flex flex-col justify-between"
          data-testid="kpi-hsm-quota"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Hạn Ngạch Ký Số HSM
              </span>
              <span className="px-2.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[11px] rounded-full">
                {usedPercent}% đã dùng
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors">
                  {remainingQuota.toLocaleString('vi-VN')} <span className="text-xs font-semibold text-slate-500">lượt còn lại</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Tổng hạn ngạch: <strong className="text-slate-700">{totalQuota.toLocaleString('vi-VN')} lượt</strong>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Zap className="w-5 h-5" />
              </div>
            </div>

            {/* Dynamic Progress Bar */}
            <div className="mt-3 space-y-1">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    usedPercent > 85 ? "bg-amber-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"
                  )}
                  style={{ width: `${usedPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Hạn ngạch an toàn
            </span>
            <button
              onClick={() => onNavigateTab('company_hsm')}
              className="text-slate-500 hover:text-slate-800 flex items-center gap-0.5 transition-colors font-medium"
            >
              Chi tiết gói
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 3: Chứng Thư Cá Nhân CBNV */}
        <div 
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-purple-300 transition-all group flex flex-col justify-between"
          data-testid="kpi-personal-certs"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Chứng Thư Cá Nhân CBNV
              </span>
              {expiringSoonCerts.length > 0 ? (
                <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 font-bold text-[10px] rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  {expiringSoonCerts.length} sắp hết hạn
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-purple-50 border border-purple-200 text-purple-700 font-bold text-[10px] rounded-full">
                  FIPS 140-2
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xl font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                  {activeCerts.length} <span className="text-xs font-semibold text-slate-500">đang hoạt động</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                  <span>Tạm khóa: <strong className="text-amber-600 font-semibold">{suspendedCerts.length}</strong></span>
                  <span>•</span>
                  <span>Tổng cấp: <strong className="text-slate-700 font-semibold">{personalCerts.length}</strong></span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-all">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Chuẩn SmartCA / RSA
            </span>
            <button
              onClick={() => onNavigateTab('personal_certs')}
              className="text-purple-600 hover:text-purple-800 font-bold flex items-center gap-0.5 transition-colors"
              data-testid="btn-view-personal-certs"
            >
              Xem danh sách
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* KPI 4: Tài Liệu Chờ Ký Duyệt */}
        <div 
          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 transition-all group flex flex-col justify-between"
          data-testid="kpi-pending-docs"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Tài Liệu Chờ Ký Duyệt
              </span>
              {urgentDocs.length > 0 && (
                <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] rounded-full flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3 text-rose-600" />
                  {urgentDocs.length} hồ sơ gấp
                </span>
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-xl font-black text-slate-900 group-hover:text-amber-600 transition-colors">
                  {pendingDocs.length} <span className="text-xs font-semibold text-slate-500">văn bản</span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Giá trị: <strong className="text-slate-800 font-semibold">{formatCurrency(totalPendingAmount)}</strong>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-all">
                <FileSignature className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              Chờ duyệt giải ngân
            </span>
            <button
              onClick={() => onNavigateTab('signing_workspace')}
              className="text-amber-600 hover:text-amber-800 font-bold flex items-center gap-0.5 transition-colors"
              data-testid="btn-view-signing-workspace"
            >
              Vào bàn ký
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Signing Activity Trends (7 Days) & Quick Actions Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Biểu Đồ & Thống Kê Lưu Lượng Ký 7 Ngày (Signing Activity Trends) */}
        <div 
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6"
          data-testid="signing-activity-trends"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-base text-slate-900">
                  Lưu Lượng Ký Số 7 Ngày Gần Nhất
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Trực quan hóa khối lượng giao dịch điện tử theo 4 nhóm chứng từ nghiệp vụ cốt lõi
              </p>
            </div>

            {/* SLA Badges */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                <span className="text-[10px] text-emerald-600 uppercase font-bold block">Tỷ lệ thành công</span>
                <span className="font-black text-sm text-emerald-700">99.8% SLA</span>
              </div>
              <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Trung bình / ngày</span>
                <span className="font-black text-sm text-slate-900">{avgDailyTransactions.toLocaleString('vi-VN')}</span>
              </div>
            </div>
          </div>

          {/* Interactive Stacked Bar Chart */}
          <div className="space-y-4">
            <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
              {SEVEN_DAYS_ACTIVITY.map((activity, idx) => {
                const heightPercent = Math.max(15, Math.round((activity.total / maxDailyValue) * 100));
                const invoicePercent = (activity.invoices / activity.total) * 100;
                const warehousePercent = (activity.warehouseReceipts / activity.total) * 100;
                const contractPercent = (activity.contracts / activity.total) * 100;
                const taxPercent = (activity.taxDeclarations / activity.total) * 100;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Hover Tooltip Details */}
                    <div className="text-[11px] font-bold text-slate-700 opacity-80 group-hover:opacity-100 group-hover:text-indigo-600 transition-all">
                      {activity.total.toLocaleString('vi-VN')}
                    </div>

                    {/* Stacked Bar */}
                    <div 
                      className="w-full max-w-[44px] rounded-t-lg overflow-hidden bg-slate-100 flex flex-col justify-end transition-all duration-300 group-hover:scale-105 shadow-xs"
                      style={{ height: `${heightPercent}%` }}
                    >
                      {/* Segment 4: Tax Declarations */}
                      <div 
                        className="w-full bg-cyan-500 transition-all"
                        style={{ height: `${taxPercent}%` }}
                        title={`Tờ khai thuế: ${activity.taxDeclarations}`}
                      ></div>
                      {/* Segment 3: Contracts */}
                      <div 
                        className="w-full bg-indigo-600 transition-all"
                        style={{ height: `${contractPercent}%` }}
                        title={`Hợp đồng B2B: ${activity.contracts}`}
                      ></div>
                      {/* Segment 2: Warehouse Receipts */}
                      <div 
                        className="w-full bg-amber-500 transition-all"
                        style={{ height: `${warehousePercent}%` }}
                        title={`Phiếu xuất kho: ${activity.warehouseReceipts}`}
                      ></div>
                      {/* Segment 1: Invoices */}
                      <div 
                        className="w-full bg-blue-500 transition-all"
                        style={{ height: `${invoicePercent}%` }}
                        title={`Hóa đơn điện tử: ${activity.invoices}`}
                      ></div>
                    </div>

                    {/* Day & Date Labels */}
                    <div className="text-center">
                      <div className="text-xs font-bold text-slate-800">{activity.dayLabel}</div>
                      <div className="text-[10px] text-slate-400">{activity.dateStr}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend for 4 Document Categories */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500 flex-shrink-0"></span>
                <span className="text-slate-600 font-medium truncate">Hóa đơn điện tử (TT78)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></span>
                <span className="text-slate-600 font-medium truncate">Phiếu xuất kho (3PL)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-indigo-600 flex-shrink-0"></span>
                <span className="text-slate-600 font-medium truncate">Hợp đồng B2B</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-cyan-500 flex-shrink-0"></span>
                <span className="text-slate-600 font-medium truncate">Tờ khai thuế GTGT</span>
              </div>
            </div>
          </div>

          {/* Quick SLA Summary Note */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>
                Toàn bộ chữ ký số được đóng dấu thời gian <strong>TSA (RFC 3161)</strong> và xác thực tính toàn vẹn <strong>SHA-256</strong>.
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('audit_logs')}
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition-colors whitespace-nowrap ml-2"
            >
              Xem Audit Logs
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Col: Thanh Tác Vụ Nhanh (Quick Actions Hub) */}
        <div 
          className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 flex flex-col justify-between"
          data-testid="quick-actions-hub"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Thanh Tác Vụ Nhanh
                </h3>
                <p className="text-xs text-slate-500">Phím tắt thực thi nhanh các luồng ký số</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3">
              {/* Action 1: Mở Bàn Ký Số Ngay */}
              <button
                onClick={() => onNavigateTab('signing_workspace')}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/50 text-left transition-all flex items-center justify-between group"
                data-testid="btn-action-open-workspace"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileSignature className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-900">
                      Mở Bàn Ký Số Ngay
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Duyệt & ký từng văn bản trong hàng đợi
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
              </button>

              {/* Action 2: Ký Hàng Loạt Hóa Đơn & Phiếu Kho */}
              <button
                onClick={() => {
                  if (onQuickBatchSign) {
                    onQuickBatchSign();
                  } else {
                    onNavigateTab('signing_workspace');
                  }
                }}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 text-left transition-all flex items-center justify-between group"
                data-testid="btn-action-quick-batch-sign"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900">
                      Ký Hàng Loạt Hóa Đơn & Phiếu Kho
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Ký số tự động các tài liệu đủ điều kiện batch
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>

              {/* Action 3: Kiểm Tra Kết Nối Cụm HSM Realtime */}
              <button
                onClick={onTestHsm}
                disabled={isTestingHsm}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 text-left transition-all flex items-center justify-between group disabled:opacity-50"
                data-testid="btn-action-test-hsm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    {isTestingHsm ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Activity className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-900 flex items-center gap-1.5">
                      Kiểm Tra Kết Nối Cụm HSM Realtime
                      {isTestingHsm && <span className="text-[10px] text-emerald-600 font-normal">(Đang kiểm tra...)</span>}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Ping test độ trễ & khả năng đáp ứng Slot Token
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </button>

              {/* Action 4: Cấp Chứng Thư Mới Từ Hồ Sơ HRM */}
              <button
                onClick={() => {
                  if (onQuickIssueCert) {
                    onQuickIssueCert();
                  } else {
                    onNavigateTab('personal_certs');
                  }
                }}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-purple-500 bg-slate-50 hover:bg-purple-50/50 text-left transition-all flex items-center justify-between group"
                data-testid="btn-action-quick-issue-cert"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-purple-900">
                      Cấp Chứng Thư Mới Từ Hồ Sơ HRM
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Trích xuất thông tin cán bộ tự động, không nhập tay
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
              </button>
            </div>
          </div>

          {/* Compliance & Security badge */}
          <div className="mt-4 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center gap-2.5 text-[11px] text-indigo-900">
            <Shield className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>Tuân thủ Luật Giao dịch điện tử 2023 & Nghị định 130/2018/NĐ-CP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignatureDashboard;
