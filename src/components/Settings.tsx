import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Users, 
  Lock, 
  Webhook, 
  Globe, 
  Database, 
  Key, 
  AppWindow, 
  CreditCard,
  Building2,
  Trash2,
  CheckCircle2,
  Plus,
  Sparkles,
  Zap,
  ArrowRight,
  Target,
  MapPin,
  Search,
  Edit2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { PermissionRole, WebhookConfig, AiFeeSuggestion } from '../types/erp';

interface Department { id: string; name: string; manager: string; staffCount: number; parentId?: string; }
interface JobTitle { id: string; name: string; department: string; }
interface JobRank { id: string; name: string; level: number; }

const MOCK_DEPARTMENTS: Department[] = [
  { id: 'D-001', name: 'Vận hành Sàn', manager: 'Lê Hoàng Minh', staffCount: 45 },
  { id: 'D-003', name: 'Kho vận nhánh HN', manager: 'Trần Văn B', staffCount: 10, parentId: 'D-001' },
  { id: 'D-002', name: 'Marketing', manager: 'Nguyễn Diệu Nhi', staffCount: 22 },
];
const MOCK_JOB_TITLES: JobTitle[] = [
  { id: 'T-001', name: 'Quản lý kho', department: 'Vận hành Sàn' },
  { id: 'T-002', name: 'KOL Specialist', department: 'Marketing' },
];
const MOCK_JOB_RANKS: JobRank[] = [
  { id: 'R-001', name: 'Nhân viên', level: 1 },
  { id: 'R-002', name: 'Trưởng nhóm', level: 2 },
  { id: 'R-003', name: 'Quản lý', level: 3 },
];

const MOCK_AI_FEE_SUGGESTIONS: AiFeeSuggestion[] = [
  { category: 'Điện tử & Công nghệ', currentFee: 3, suggestedFee: 3.5, reasoning: 'Nhu cầu cao, biên lợi nhuận seller ổn định ở mức 18%.', competitorAvg: 4, impactOnGmv: '+2.1% Revenue' },
  { category: 'Thời trang & Phụ kiện', currentFee: 8, suggestedFee: 7.2, reasoning: 'Cạnh tranh gắt gao, giảm phí để hút Seller chất lượng cao.', competitorAvg: 6.5, impactOnGmv: '+15% Seller Growth' },
];

const MOCK_ROLES: PermissionRole[] = [
  { id: '1', name: 'Siêu quản trị (Super Admin)', permissions: ['all'] },
  { id: '2', name: 'Kế toán trưởng', permissions: ['finance.read', 'finance.approve', 'settlement.read'] },
  { id: '3', name: 'Quản lý Kho', permissions: ['inventory.read', 'inventory.write', 'scm.read'] },
];

const MOCK_WEBHOOKS: WebhookConfig[] = [
  { id: '1', name: 'ERP Brand Samsung Integration', url: 'https://api.samsung.com/webhook', events: ['order.created', 'order.cancelled'], status: 'active' },
  { id: '2', name: 'GHTK Logistis Status', url: 'https://webhook.ghtk.vn/callback', events: ['delivery.status'], status: 'active' },
];

const MOCK_PROVINCES = [
  { id: '1', name: 'Hà Nội', code: 'HN', wards: 579, status: 'active' },
  { id: '2', name: 'Hồ Chí Minh', code: 'HCM', wards: 312, status: 'active' },
  { id: '3', name: 'Đà Nẵng', code: 'DN', wards: 56, status: 'active' },
  { id: '4', name: 'Hải Phòng', code: 'HP', wards: 217, status: 'active' },
  { id: '5', name: 'Cần Thơ', code: 'CT', wards: 83, status: 'active' },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'rbac' | 'api' | 'address' | 'org'>('general');
  const [fees, setFees] = useState({
    'Điện tử & Công nghệ': '3%',
    'Thời trang & Phụ kiện': '8%',
    'Gia dụng & Đời sống': '5%',
    'Sức khỏe & Sắc đẹp': '10%',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Đã lưu các thay đổi cấu hình thành công!');
    }, 1000);
  };

  const handleApplyAiSuggestion = (category: string, suggestedFee: number) => {
    setFees(prev => ({
      ...prev,
      [category]: `${suggestedFee}%`
    }));
    alert(`Đã áp dụng đề xuất AI cho ngành hàng ${category} (${suggestedFee}%)`);
  };

  const handleApproveAllSuggestions = () => {
    const updatedFees = { ...fees };
    MOCK_AI_FEE_SUGGESTIONS.forEach(s => {
      updatedFees[s.category] = `${s.suggestedFee}%`;
    });
    setFees(updatedFees);
    alert('Đã áp dụng toàn bộ đề xuất tối ưu từ AI!');
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Cấu hình & Tích hợp Hệ thống</h1>
          <p className="text-sm text-[#6B7280] mt-1">Phân quyền Ma trận roles, cấu hình Phí sàn và quản lý OpenAPI/Webhook.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-[#2563EB] text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Nav Sidebar */}
        <div className="w-64 space-y-1">
           {[
             { id: 'general', label: 'Cấu hình chung & Phí sàn', icon: Settings },
             { id: 'rbac', label: 'Phân quyền & Roles', icon: Lock },
             { id: 'api', label: 'OpenAPI & Webhooks', icon: Webhook },
             { id: 'address', label: 'Cấu hình Tỉnh/Thành', icon: MapPin },
             { id: 'org', label: 'Cơ cấu Tổ chức', icon: Building2 },
           ].map((tab) => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group",
                  activeTab === tab.id ? "bg-white text-[#2563EB] shadow-sm border border-[#E5E7EB]" : "text-[#6B7280] hover:bg-slate-100"
                )}
             >
                <tab.icon className={cn("w-4 h-4", activeTab === tab.id ? "text-[#2563EB]" : "text-[#9CA3AF]")} />
                <span>{tab.label}</span>
             </button>
           ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6">
           {activeTab === 'general' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                       <h3 className="font-bold text-[#111827] flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-emerald-500" /> Cấu hình Phí sàn (Commission Fee)
                       </h3>
                       <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">AI ANALYZING BIAS: OFF</span>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {[
                         { cat: 'Điện tử & Công nghệ', fee: '3%' },
                         { cat: 'Thời trang & Phụ kiện', fee: '8%' },
                         { cat: 'Gia dụng & Đời sống', fee: '5%' },
                         { cat: 'Sức khỏe & Sắc đẹp', fee: '10%' },
                       ].map(item => (
                         <div key={item.cat} className="p-4 bg-[#F9FAFB] rounded-xl border border-[#F3F4F6] flex justify-between items-center group relative overflow-hidden">
                            <span className="text-sm font-medium text-[#4B5563]">{item.cat}</span>
                            <div className="flex items-center gap-4">
                               <input type="text" defaultValue={item.fee} className="w-16 bg-white border border-[#E5E7EB] rounded-lg px-2 py-1 text-center font-bold text-[#111827] outline-none focus:border-[#2563EB]" />
                               <button className="text-[10px] font-bold text-[#2563EB] hover:underline">Cập nhật</button>
                            </div>
                         </div>
                       ))}
                    </div>

                    {/* AI Optimization Section */}
                    <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-600">
                             <Sparkles className="w-5 h-5" />
                             <h4 className="text-sm font-bold uppercase tracking-widest">AI Fee Optimization Suggestions</h4>
                          </div>
                          <button className="text-[10px] font-bold text-white bg-blue-600 px-4 py-1.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10">
                             Duyệt tất cả đề xuất AI
                          </button>
                       </div>
                       
                       <div className="grid grid-cols-1 gap-4">
                          {MOCK_AI_FEE_SUGGESTIONS.map((suggestion, idx) => (
                             <div key={idx} className="bg-slate-50 border border-blue-100 rounded-[1.5rem] p-5 flex flex-col md:flex-row gap-6 relative group hover:border-blue-300 transition-all">
                                <div className="flex-1 space-y-2">
                                   <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-[#111827]">{suggestion.category}</span>
                                      <ArrowRight className="w-3 h-3 text-slate-300" />
                                      <div className="flex items-center gap-2">
                                         <span className="text-xs font-bold text-slate-400 line-through">{suggestion.currentFee}%</span>
                                         <span className="text-sm font-black text-blue-600">{suggestion.suggestedFee}%</span>
                                      </div>
                                      <span className="ml-auto md:ml-2 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                         {suggestion.impactOnGmv}
                                      </span>
                                   </div>
                                   <p className="text-[11px] text-[#6B7280] leading-relaxed">
                                      <span className="font-bold text-slate-500">Lý do AI:</span> {suggestion.reasoning}
                                   </p>
                                </div>
                                <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
                                   <div className="text-center min-w-[80px]">
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">TB Đối thủ</p>
                                      <p className="text-sm font-bold text-[#111827]">{suggestion.competitorAvg}%</p>
                                   </div>
                                   <button className="flex-1 md:flex-none px-6 py-2 bg-white border border-blue-200 text-blue-600 rounded-xl text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                      Áp dụng gợi ý
                                   </button>
                                </div>
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 -rotate-45 translate-x-12 -translate-y-12"></div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-4">
                    <h3 className="font-bold text-[#111827]">Cấu hình ví & Payout</h3>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                       <div className="space-y-1">
                          <p className="text-sm font-bold text-slate-900">Tính năng Duyệt Payout tự động</p>
                          <p className="text-[10px] text-slate-500 italic text-pretty max-w-md">Nếu được bật, hệ thống sẽ tự động giải ngân cho Seller khi đơn hàng chuyển sang trạng thái "Thành công" và qua thời gian khiếu nại (7 ngày).</p>
                       </div>
                       <div className="w-12 h-6 bg-[#2563EB] rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                       </div>
                    </div>
                 </div>

                 <div className="flex justify-end gap-3 pt-4">
                    <button className="px-6 py-2.5 rounded-xl text-sm font-bold text-[#6B7280] hover:bg-slate-100 transition-all border border-transparent">
                       Hủy bỏ
                    </button>
                    <button className="px-6 py-2.5 bg-[#2563EB] text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                       Lưu cấu hình
                    </button>
                 </div>
              </div>
           )}

           {activeTab === 'rbac' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                 <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
                    <div className="p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center">
                       <h3 className="font-bold text-[#111827] flex items-center gap-2 text-sm">
                          <Lock className="w-4 h-4 text-blue-600" /> Ma trận Phân quyền Roles
                       </h3>
                       <button className="flex items-center gap-2 text-xs font-bold text-[#2563EB] hover:underline">
                          <Plus className="w-3.5 h-3.5" /> Tạo Vai trò mới
                       </button>
                    </div>
                    <div className="overflow-x-auto">
                       <table className="w-full text-left">
                          <thead>
                             <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                                <th className="px-6 py-3 text-[10px] font-bold text-[#6B7280] uppercase">Tên Vai trò</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-[#6B7280] uppercase">Quyền hạn chính</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-[#6B7280] uppercase text-right">Thao tác</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-[#F3F4F6]">
                             {MOCK_ROLES.map(role => (
                               <tr key={role.id} className="hover:bg-slate-50">
                                  <td className="px-6 py-4 text-sm font-bold text-[#111827]">{role.name}</td>
                                  <td className="px-6 py-4">
                                     <div className="flex flex-wrap gap-1">
                                        {role.permissions.map(p => (
                                          <span key={p} className="px-2 py-0.5 bg-blue-50 text-[#2563EB] text-[9px] font-bold rounded uppercase border border-blue-100">{p}</span>
                                        ))}
                                     </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <button className="text-xs font-bold text-[#6B7280] hover:text-[#111827] px-3">Sửa</button>
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'api' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-4">
                       <h3 className="font-bold text-[#111827] flex items-center gap-2">
                          <Key className="w-4 h-4 text-orange-500" /> API Keys & Access Tokens
                       </h3>
                       <p className="text-xs text-[#6B7280]">Cấp quyền cho bên thứ 3 (Brand, Logistics) truy cập trực tiếp vào API sàn.</p>
                       <div className="p-3 bg-slate-50 rounded-xl font-mono text-[10px] text-slate-500 flex justify-between items-center">
                          <span>sk_live_vecom_*********************</span>
                          <button className="text-[#2563EB] font-bold">Copy</button>
                       </div>
                       <button className="w-full py-2 border border-[#E5E7EB] rounded-lg text-xs font-bold hover:bg-slate-50">Tạo mới Secret Key</button>
                    </div>
                    <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-4">
                       <h3 className="font-bold text-[#111827] flex items-center gap-2">
                          <AppWindow className="w-4 h-4 text-[#2563EB]" /> Webhook Settings
                       </h3>
                       <p className="text-xs text-[#6B7280]">Tự động đẩy thông báo sự kiện (Đơn hàng, Đối soát) về Server đối tác.</p>
                       <div className="space-y-3">
                          {MOCK_WEBHOOKS.map(wb => (
                            <div key={wb.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                               <div className="space-y-1">
                                  <p className="text-[10px] font-bold text-slate-900">{wb.name}</p>
                                  <p className="text-[9px] text-slate-400 font-mono truncate max-w-[150px]">{wb.url}</p>
                               </div>
                               <button className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          ))}
                       </div>
                       <button className="w-full py-2 bg-[#111827] text-white rounded-lg text-xs font-bold hover:bg-slate-800">Cấu hình Webhook mới</button>
                    </div>
                 </div>

                 <div className="bg-blue-900 text-white p-6 rounded-lg flex items-center gap-6">
                    <div className="p-4 bg-white/10 rounded-lg border border-white/20">
                       <Globe className="w-8 h-8 text-blue-300" />
                    </div>
                    <div>
                       <h4 className="font-bold text-lg mb-1">OpenAPI Public Documentation</h4>
                       <p className="text-slate-400 text-xs">Cung cấp tài liệu tích hợp (Swagger/Postman) cho cộng đồng phát triển và đối tác chiến lược để kết nối trực tiếp kho hàng Brand với vận hành sàn.</p>
                       <div className="flex gap-4 mt-3">
                          <button className="text-xs font-bold text-blue-300 hover:underline">Download API Spec</button>
                          <button className="text-xs font-bold text-blue-300 hover:underline">Xem Sandbox logs</button>
                       </div>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'address' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                       <h3 className="font-bold text-[#111827] flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-blue-600" /> Cấu hình Địa chỉ Hành chính (2 cấp)
                       </h3>
                       <button className="flex items-center gap-2 bg-[#2563EB] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-sm">
                          <Plus className="w-4 h-4" /> Thêm Tỉnh/Thành
                       </button>
                    </div>

                    <div className="flex gap-4 mb-4">
                       <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input type="text" placeholder="Tìm kiếm tỉnh/thành phố..." className="w-full bg-slate-50 border border-[#E5E7EB] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all" />
                       </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                       <table className="w-full text-left text-sm">
                          <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB] text-[#6B7280]">
                             <tr>
                                <th className="px-6 py-4 font-medium">Tên Tỉnh/Thành</th>
                                <th className="px-6 py-4 font-medium">Mã code</th>
                                <th className="px-6 py-4 font-medium">Số lượng Phường/Xã (Cấp 2)</th>
                                <th className="px-6 py-4 font-medium text-center">Trạng thái</th>
                                <th className="px-6 py-4 font-medium text-right">Thao tác</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E7EB] bg-white">
                             {MOCK_PROVINCES.map((prov) => (
                                <tr key={prov.id} className="hover:bg-slate-50 transition-colors group">
                                   <td className="px-6 py-4 font-medium text-slate-900">{prov.name}</td>
                                   <td className="px-6 py-4">
                                      <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">{prov.code}</span>
                                   </td>
                                   <td className="px-6 py-4">
                                      <div className="flex items-center gap-3 text-slate-600">
                                         <div>
                                            <span className="text-sm font-bold text-blue-600">{prov.wards}</span> đơn vị
                                         </div>
                                         <button className="text-[10px] text-blue-500 border border-blue-100 bg-blue-50 px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-wider hover:bg-blue-100">Quản lý cấp 2</button>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                      <span className={cn(
                                         "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                                         prov.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500 border border-slate-200"
                                      )}>
                                         {prov.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'}
                                      </span>
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                         <Edit2 className="w-4 h-4" />
                                      </button>
                                   </td>
                                </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'org' && (
             <div className="animate-in fade-in duration-300 space-y-6">
               <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-sm space-y-6">
                 <div className="flex justify-between items-center">
                   <h3 className="font-bold text-[#111827] flex items-center gap-2">
                     <Building2 className="w-5 h-5 text-blue-600" /> Quản lý Cơ cấu Tổ chức
                   </h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 md:col-span-1">
                     <h4 className="font-bold text-slate-800 mb-4">Phòng ban</h4>
                     {MOCK_DEPARTMENTS.map((dept) => (
                       <div key={dept.id} className={cn("bg-white p-3 rounded-lg border border-slate-100 mb-2 flex justify-between items-center", dept.parentId ? "ml-6 border-l-4 border-l-blue-400" : "")}>
                         <span className="text-sm font-medium">{dept.name}</span>
                         <button className="text-[10px] bg-slate-100 px-2 py-1 rounded">Sửa</button>
                       </div>
                     ))}
                   </div>
                   {[{ title: 'Chức danh', data: MOCK_JOB_TITLES },
                     { title: 'Cấp bậc', data: MOCK_JOB_RANKS }].map(section => (
                     <div key={section.title} className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                       <h4 className="font-bold text-slate-800 mb-4">{section.title}</h4>
                       {section.data.map((item: any, i) => (
                         <div key={i} className="bg-white p-3 rounded-lg border border-slate-100 mb-2 flex justify-between items-center">
                           <span className="text-sm font-medium">{item.name}</span>
                           <button className="text-[10px] bg-slate-100 px-2 py-1 rounded">Sửa</button>
                         </div>
                       ))}
                     </div>
                   ))}
                 </div>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
