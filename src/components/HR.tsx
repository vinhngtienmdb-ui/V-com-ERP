import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CompactPageHeader } from './common/CompactPageHeader';
import { 
  Users, 
  ArrowLeft, 
  ShieldAlert, 
  Receipt, 
  Target, 
  UserPlus, 
  ExternalLink, 
  Sparkles, 
  LayoutDashboard, 
  FileSpreadsheet,
  DollarSign,
  Fingerprint,
  HeartHandshake,
  Star,
  Clock,
  Contact,
  Grid
} from 'lucide-react';
import { HROverviewDashboard } from './hr/HROverviewDashboard';
import { LaborCompliance } from './LaborCompliance';
import { VCommHRMComponent } from './VCommHRM';
import { TaxPIT } from './TaxPIT';
import { OKRManagement } from './OKRManagement';
import { RecruitmentPipeline } from './RecruitmentPipeline';
import { cn } from '../lib/utils';

const HR_MINI_APPS = [
  { name: 'Cổng Nhân Viên (ESS)', path: '/ess', icon: Fingerprint, color: 'from-emerald-500 to-teal-600', desc: 'Chấm công 1 chạm & Nghỉ phép' },
  { name: 'Hồ Sơ Nhân Viên', path: '/employees', icon: Contact, color: 'from-violet-500 to-purple-600', desc: 'Quản lý 360° hồ sơ & hợp đồng' },
  { name: 'Chấm Công & Ca Kíp', path: '/attendance', icon: Clock, color: 'from-amber-500 to-orange-500', desc: 'Máy quét, phân ca & radar' },
  { name: 'Bảng Lương & Chi Trả', path: '/payroll', icon: DollarSign, color: 'from-emerald-600 to-green-700', desc: 'Mô phỏng Net/Gross & Lương' },
  { name: 'Bảo Hiểm Xã Hội', path: '/insurance', icon: HeartHandshake, color: 'from-teal-500 to-cyan-600', desc: 'Đóng nộp 32% BHXH & Mẫu D02-LT' },
  { name: 'Thuế TNCN', path: '/tax-pit', icon: Receipt, color: 'from-sky-500 to-blue-600', desc: 'Biểu lũy tiến 7 bậc & Giảm trừ' },
  { name: 'Tuyển Dụng ATS', path: '/recruitment', icon: UserPlus, color: 'from-blue-600 to-indigo-600', desc: 'Phễu Kanban & Scorecard' },
  { name: 'Đánh Giá KPI', path: '/performance', icon: Star, color: 'from-green-500 to-emerald-600', desc: 'Đánh giá năng lực & hiệu suất' },
  { name: 'Mục Tiêu OKRs', path: '/okr', icon: Target, color: 'from-blue-500 to-cyan-600', desc: 'Căn chỉnh mục tiêu chiến lược' },
  { name: 'Tuân Thủ Lao Động', path: '/labor-compliance', icon: ShieldAlert, color: 'from-rose-500 to-amber-600', desc: 'Nghị định 145 & Máy tính phạt' }
];

export function HumanResources() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const getMappedTab = (tab: string | null): string => {
    if (!tab) return 'overview';
    if (tab === 'payroll') return 'overview';
    if (tab === 'attendance') return 'overview';
    if (tab === 'tax' || tab === 'tax-pit' || tab === 'pit') return 'tax_pit';
    if (tab === 'recruitment' || tab === 'ats') return 'recruitment_ats';
    if (tab === 'employees') return 'vcomm_hr';
    if (tab === 'labor_compliance' || tab === 'compliance_labor' || tab === 'compliance') return 'labor_compliance';
    if (tab === 'okr') return 'okr_mgmt';
    return tab;
  };

  const [activeTab, setActiveTab] = useState<string>(() => getMappedTab(tabParam));

  useEffect(() => {
    if (tabParam) {
      setActiveTab(getMappedTab(tabParam));
    }
  }, [tabParam]);

  const handleTabChange = (tabKey: string) => {
    setActiveTab(tabKey);
    setSearchParams(tabKey === 'overview' ? {} : { tab: tabKey });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-16 font-sans">
      {/* Compact Standardized Header */}
      <CompactPageHeader
        icon={
          <button 
            onClick={() => navigate('/')} 
            className="p-1 hover:bg-slate-200 rounded-lg transition-colors text-slate-600 hover:text-slate-900 cursor-pointer"
            title="Quay lại Launcher (/)"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        }
        title="VComm HRM & Human Capital"
        badge={{ text: "HRM & ESS", variant: "blue" }}
        description="Hệ thống Quản trị Nguồn nhân lực & Tiền lương thế hệ mới theo chuẩn Luật Lao động Việt Nam"
        actions={
          <button
            onClick={() => navigate('/ess')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <span>Cổng Nhân viên (ESS)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        }
      />

      {/* Standalone HR Mini-Apps Ecosystem Launcher Grid */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-md shadow-slate-200/40">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Grid className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Hệ Sinh Thái 10 Mini App Nhân Sự Độc Lập</h2>
              <p className="text-[11px] text-slate-500 font-medium">Mỗi phân hệ chạy trên URL chuyên biệt, tách rời hoàn toàn khỏi lõi HRM nguyên khối</p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
            10/10 Micro-Apps Sẵn Sàng
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {HR_MINI_APPS.map((app) => {
            const AppIcon = app.icon;
            return (
              <button
                key={app.path}
                onClick={() => navigate(app.path)}
                className="group flex flex-col items-start p-3 rounded-2xl bg-white/90 hover:bg-white border border-slate-200/80 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all text-left cursor-pointer active:scale-98"
              >
                <div className={cn("p-2 rounded-xl bg-gradient-to-br text-white shadow-sm mb-2 group-hover:scale-110 transition-transform", app.color)}>
                  <AppIcon className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {app.name}
                </div>
                <div className="text-[10px] text-slate-400 group-hover:text-slate-500 line-clamp-1 mt-0.5">
                  {app.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modern Sub-Tab Pill Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Bảng Điều Hành Đột Phá', icon: LayoutDashboard },
          { id: 'hr_core', label: 'Hồ Sơ Cán Bộ VComm', icon: FileSpreadsheet },
          { id: 'labor_compliance', label: 'Tuân Thủ NĐ 145 / NĐ 283', icon: ShieldAlert },
          { id: 'tax_pit', label: 'Kê Khai Thuế TNCN', icon: Receipt },
          { id: 'okr_mgmt', label: 'Quản Trị OKRs', icon: Target },
          { id: 'recruitment_ats', label: 'Tuyển Dụng ATS', icon: UserPlus },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer shrink-0",
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", activeTab === tab.id ? "text-indigo-400" : "text-slate-400")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab View Rendering */}
      <div className="transition-all">
        {activeTab === 'overview' && <HROverviewDashboard />}

        {(activeTab === 'hr_core' || activeTab === 'vcomm_hr') && (
          <div className="space-y-4">
            <VCommHRMComponent />
          </div>
        )}

        {activeTab === 'labor_compliance' && (
          <div className="space-y-4">
            <LaborCompliance />
          </div>
        )}

        {activeTab === 'tax_pit' && (
          <div className="space-y-4">
            <TaxPIT />
          </div>
        )}

        {activeTab === 'okr_mgmt' && (
          <div className="space-y-4">
            <OKRManagement />
          </div>
        )}

        {activeTab === 'recruitment_ats' && (
          <div className="space-y-4">
            <RecruitmentPipeline />
          </div>
        )}
      </div>
    </div>
  );
}

export default HumanResources;
