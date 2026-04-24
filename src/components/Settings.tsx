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
  Edit2,
  Store,
  MessageSquare,
  AlertCircle
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
  const [activeTab, setActiveTab] = useState<'general' | 'rbac' | 'api' | 'address' | 'org' | 'comms' | 'website'>('general');
  const [fees, setFees] = useState({
    'Điện tử & Công nghệ': '3%',
    'Thời trang & Phụ kiện': '8%',
    'Gia dụng & Đời sống': '5%',
    'Sức khỏe & Sắc đẹp': '10%',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [customDomains, setCustomDomains] = useState<string[]>(['erp.vcom.vn']);

  const addDomain = () => setCustomDomains([...customDomains, '']);
  const updateDomain = (index: number, value: string) => {
    const newDomains = [...customDomains];
    newDomains[index] = value;
    setCustomDomains(newDomains);
  };
  const removeDomain = (index: number) => {
    setCustomDomains(customDomains.filter((_, i) => i !== index));
  };

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
          className="bg-[#2563EB] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm disabled:opacity-50"
        >
          {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </button>
      </div>

      <div className="flex gap-8">
        {/* Nav Sidebar */}
        <div className="w-64 space-y-1">
           {[
             { id: 'general', label: 'Cấu hình chung & Phí sàn', icon: Settings },
             { id: 'website', label: 'Cấu hình Website', icon: AppWindow },
             { id: 'comms', label: 'Tích hợp Kênh (SMS/Zalo)', icon: MessageSquare },
             { id: 'rbac', label: 'Phân quyền & Roles', icon: Lock },
             { id: 'api', label: 'OpenAPI & Webhooks', icon: Webhook },
             { id: 'address', label: 'Cấu hình Tỉnh/Thành', icon: MapPin },
             { id: 'org', label: 'Cơ cấu Tổ chức', icon: Building2 },
             { id: 'stores', label: 'Quản lý Chuỗi cửa hàng', icon: Building2 },
           ].map((tab) => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group",
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
                         <div key={item.cat} className="p-4 bg-[#F9FAFB] rounded-lg border border-[#F3F4F6] flex justify-between items-center group relative overflow-hidden">
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
                          <button className="text-[10px] font-bold text-white bg-blue-600 px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/10">
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
                                   <button className="flex-1 md:flex-none px-6 py-2 bg-white border border-blue-200 text-blue-600 rounded-lg text-[10px] font-bold hover:bg-blue-600 hover:text-white transition-all shadow-sm">
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
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
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
                    <button className="px-6 py-2.5 rounded-lg text-sm font-bold text-[#6B7280] hover:bg-slate-100 transition-all border border-transparent">
                       Hủy bỏ
                    </button>
                    <button className="px-6 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                       Lưu cấu hình
                    </button>
                 </div>
              </div>
           )}

           {activeTab === 'website' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                 <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-6">
                    <h3 className="font-bold text-[#111827] flex items-center gap-2 text-sm border-b border-[#F3F4F6] pb-3">
                       <Globe className="w-4 h-4 text-[#2563EB]" /> Cấu hình Website Tổng (Hệ thống ERP & Storefront)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-4">
                           <div>
                              <label className="block text-xs font-bold text-[#6B7280] mb-1 uppercase tracking-wider">Danh sách tên miền</label>
                              <div className="space-y-2">
                                 {customDomains.map((domain, index) => (
                                   <div key={index} className="flex gap-2">
                                      <input 
                                         type="text" 
                                         value={domain} 
                                         onChange={(e) => updateDomain(index, e.target.value)}
                                         placeholder="ví dụ: store.domain.com" 
                                         className="flex-1 p-3 rounded-lg border border-[#E5E7EB] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" 
                                      />
                                      <button onClick={() => removeDomain(index)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg">
                                         <Trash2 className="w-4 h-4" />
                                      </button>
                                   </div>
                                 ))}
                                 <button onClick={addDomain} className="text-xs font-bold text-[#2563EB] hover:underline flex items-center gap-1 mt-2">
                                    <Plus className="w-3 h-3" /> Thêm tên miền mới
                                 </button>
                               </div>
                              <p className="text-[10px] text-[#9CA3AF] mt-1.5 leading-relaxed">Tên miền trỏ về hệ thống VComm ERP.</p>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div>
                              <label className="block text-xs font-bold text-[#6B7280] mb-4 uppercase tracking-wider">Cấu hình Hoa hồng (Commission Rate)</label>
                              <div className="border border-[#E5E7EB] rounded-lg overflow-hidden">
                                 <table className="w-full text-sm">
                                    <thead className="bg-[#F9FAFB] border-b border-[#E5E7EB]">
                                       <tr>
                                          <th className="px-4 py-2 text-left font-bold text-[#6B7280]">Ngành hàng</th>
                                          <th className="px-4 py-2 text-left font-bold text-[#6B7280]">Phí hiện tại</th>
                                          <th className="px-4 py-2 text-left font-bold text-[#6B7280]">Thao tác</th>
                                       </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#E5E7EB]">
                                       {Object.entries(fees).map(([category, fee]) => {
                                          const suggestion = MOCK_AI_FEE_SUGGESTIONS.find(s => s.category === category);
                                          return (
                                             <tr key={category}>
                                                <td className="px-4 py-3 text-xs font-medium text-slate-800">{category}</td>
                                                <td className="px-4 py-3">
                                                   <input 
                                                      type="text"
                                                      value={fee}
                                                      onChange={(e) => setFees(prev => ({ ...prev, [category]: e.target.value }))}
                                                      className="w-16 p-1 text-xs border border-[#E5E7EB] rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                   />
                                                </td>
                                                <td className="px-4 py-3">
                                                   {suggestion && (
                                                      <button 
                                                         onClick={() => setFees(prev => ({ ...prev, [category]: `${suggestion.suggestedFee}%` }))}
                                                         className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800"
                                                         title={`Gợi ý: ${suggestion.suggestedFee}% - ${suggestion.reasoning}`}
                                                      >
                                                         <Sparkles className="w-3 h-3" /> AI
                                                      </button>
                                                   )}
                                                </td>
                                             </tr>
                                          );
                                       })}
                                    </tbody>
                                 </table>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-[#F3F4F6]">
                        <div className="space-y-4">
                           <div>
                              <label className="block text-xs font-bold text-[#6B7280] mb-1 uppercase tracking-wider">Logo Toàn Hệ Thống</label>
                              <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                                 <input type="file" id="logo-upload" className="hidden" accept="image/*" />
                                 <label htmlFor="logo-upload" className="cursor-pointer text-xs font-bold text-[#2563EB]">
                                    Nhấn để tải lên hoặc kéo thả Logo
                                 </label>
                                 <p className="text-[10px] text-[#9CA3AF] mt-1">PNG, JPG tối đa 5MB</p>
                              </div>
                           </div>
                        </div>
                        <div className="space-y-4">
                           <div>
                              <label className="block text-xs font-bold text-[#6B7280] mb-1 uppercase tracking-wider">Favicon Hệ Thống</label>
                              <div className="border-2 border-dashed border-[#E5E7EB] rounded-lg p-6 text-center hover:bg-slate-50 transition-colors">
                                 <input type="file" id="favicon-upload" className="hidden" accept="image/x-icon,image/png" />
                                 <label htmlFor="favicon-upload" className="cursor-pointer text-xs font-bold text-[#2563EB]">
                                    Nhấn để tải lên hoặc kéo thả Favicon
                                 </label>
                                 <p className="text-[10px] text-[#9CA3AF] mt-1">ICO, PNG (32x32px)</p>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex justify-end gap-3 pt-4 border-t border-[#F3F4F6] mt-6">
                        <button className="px-6 py-2.5 bg-[#2563EB] text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm active:scale-95">
                           Lưu cấu hình website
                        </button>
                     </div>
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
                       <div className="p-3 bg-slate-50 rounded-lg font-mono text-[10px] text-slate-500 flex justify-between items-center">
                          <span>sk_live_vcomm_*********************</span>
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
                            <div key={wb.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
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

                    <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
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
               <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-6">
                 <div className="flex justify-between items-center">
                   <h3 className="font-bold text-[#111827] flex items-center gap-2">
                     <Building2 className="w-5 h-5 text-blue-600" /> Quản lý Cơ cấu Tổ chức
                   </h3>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:col-span-1">
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
                     <div key={section.title} className="bg-slate-50 border border-slate-200 rounded-lg p-4">
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

           {activeTab === 'stores' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                       <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <Building2 className="w-5 h-5 text-blue-600" /> Quản lý Chuỗi cửa hàng / Chi nhánh
                       </h3>
                       <button className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 flex items-center gap-2">
                          <Plus className="w-4 h-4" /> Thêm Cửa hàng
                       </button>
                    </div>

                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5 mb-6">
                       <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Cấu hình Tên miền (Domain)</h4>
                       <p className="text-sm text-indigo-700 mb-4">Các chi nhánh có thể chạy trên subdomain riêng biệt, cung cấp cho nhân viên thu ngân đường dẫn đăng nhập trực tiếp mà không cần vào trang chủ ERP.</p>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-50 flex justify-between items-center">
                             <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Chi nhánh Quận 1</span>
                                <p className="font-mono text-sm text-slate-900">sg1.v-erp.com</p>
                             </div>
                             <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">ACTIVE</span>
                          </div>
                          <div className="bg-white p-3 rounded-lg shadow-sm border border-indigo-50 flex justify-between items-center">
                             <div className="space-y-1">
                                <span className="text-[10px] uppercase font-bold text-slate-400">Chi nhánh Cầu Giấy</span>
                                <p className="font-mono text-sm text-slate-900">hn1.v-erp.com</p>
                             </div>
                             <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">ACTIVE</span>
                          </div>
                       </div>
                    </div>

                    <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-2">Danh sách Cửa hàng & Nhân sự</h4>
                    
                    <div className="space-y-4">
                       {[
                         { id: 'STORE_001', name: 'Chi nhánh Quận 1 - Sài Gòn', address: '123 Lê Lợi, Q.1, TP.HCM', staff: 5, manager: 'Nguyễn Văn A' },
                         { id: 'STORE_002', name: 'Chi nhánh Cầu Giấy - Hà Nội', address: '45 Xuân Thủy, Cầu Giấy, HN', staff: 8, manager: 'Trần Thị B' },
                       ].map(store => (
                         <div key={store.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-400 transition-colors bg-slate-50">
                            <div>
                               <h5 className="font-bold text-slate-900 text-lg flex items-center gap-2">{store.name}</h5>
                               <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.address}</p>
                               <div className="flex gap-4 mt-3">
                                  <span className="text-xs bg-slate-200/50 text-slate-600 px-2 py-1 rounded-md font-medium">Quản lý: <span className="font-bold">{store.manager}</span></span>
                                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium">{store.staff} nhân viên</span>
                               </div>
                            </div>
                            <div className="flex gap-2">
                               <button className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-100"><Edit2 className="w-4 h-4" /></button>
                               <button className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"><Trash2 className="w-4 h-4" /></button>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           )}
           {activeTab === 'comms' && (
              <div className="animate-in fade-in duration-300 space-y-6">
                 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                    <div className="flex justify-between items-center">
                       <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-blue-600" /> Tích hợp SMS OTP & Zalo ZNS
                       </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {/* Zalo ZNS Config */}
                       <div className="border border-slate-200 rounded-lg p-5 hover:border-blue-400 transition-colors">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white"><MessageSquare className="w-5 h-5" /></div>
                                <div>
                                   <h4 className="font-bold text-slate-900">Zalo ZNS (Zalo Notification Service)</h4>
                                   <p className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold uppercase w-fit mt-1 border border-emerald-100">Đang hoạt động</p>
                                </div>
                             </div>
                             <div className="h-8 w-14 bg-blue-100 rounded-full p-1 cursor-pointer">
                                <div className="w-6 h-6 bg-blue-600 rounded-full translate-x-6"></div>
                             </div>
                          </div>
                          <div className="space-y-4">
                             <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">Official Account ID (OA ID)</label>
                                <input type="text" defaultValue="2938475928374928" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                             </div>
                             <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">Zalo App ID</label>
                                <input type="text" defaultValue="142345234523" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                             </div>
                             <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">Access Token</label>
                                <div className="flex gap-2">
                                   <input type="password" defaultValue="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 font-mono" />
                                   <button className="px-3 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 text-sm font-bold text-slate-600">Đồng bộ</button>
                                </div>
                                <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Token sẽ hết hạn vào 20:00 25/04/2026. Bật auto-refresh để tự làm mới.</p>
                             </div>
                          </div>
                          <button className="w-full mt-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
                             Kiểm tra kết nối ZNS
                          </button>
                       </div>

                       {/* SMS OTP Config */}
                       <div className="border border-slate-200 rounded-lg p-5 hover:border-emerald-400 transition-colors">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white"><MessageSquare className="w-5 h-5" /></div>
                                <div>
                                   <h4 className="font-bold text-slate-900">SMS OTP & Brandname</h4>
                                   <p className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold uppercase w-fit mt-1">Chưa thiết lập</p>
                                </div>
                             </div>
                             <div className="h-8 w-14 bg-slate-200 rounded-full p-1 cursor-pointer">
                                <div className="w-6 h-6 bg-white rounded-full shadow-sm"></div>
                             </div>
                          </div>
                          <div className="space-y-4 opacity-70">
                             <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">Nhà cung cấp (SMS Vendor)</label>
                                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                                   <option>eSMS.vn</option>
                                   <option>VietGuys</option>
                                   <option>FPT SMS</option>
                                   <option>Viettel MKT</option>
                                </select>
                             </div>
                             <div>
                                <label className="text-xs font-bold text-slate-600 block mb-1">Brandname đăng ký</label>
                                <input type="text" placeholder="Ví dụ: V-ECOM" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
                             </div>
                             <div className="grid grid-cols-2 gap-3">
                                <div>
                                   <label className="text-xs font-bold text-slate-600 block mb-1">API Key</label>
                                   <input type="password" placeholder="Nhập API Key..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono" />
                                </div>
                                <div>
                                   <label className="text-xs font-bold text-slate-600 block mb-1">Secret Key</label>
                                   <input type="password" placeholder="Nhập Secret..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono" />
                                </div>
                             </div>
                          </div>
                          <button className="w-full mt-6 py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
                             Lưu thiết lập SMS
                          </button>
                       </div>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-5 mt-6">
                       <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Zap className="w-4 h-4" /> Kịch bản Gửi tin (Triggers)</h4>
                       <p className="text-sm text-blue-700 mb-4">Cấu hình các sự kiện hệ thống tự động gọi API ZNS/SMS để thông báo chăm sóc khách hàng.</p>
                       <div className="space-y-3">
                          <label className="flex items-center gap-3 p-3 bg-white border border-blue-100 rounded-lg cursor-pointer">
                             <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                             <span className="text-sm font-medium text-slate-700 flex-1">Nhắn mã OTP xác thực khi đăng nhập/đổi mật khẩu</span>
                             <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">Ưu tiên: SMS OTP</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white border border-blue-100 rounded-lg cursor-pointer">
                             <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                             <span className="text-sm font-medium text-slate-700 flex-1">Gửi Zalo ZNS xác nhận Đặt hàng thành công</span>
                             <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded">Template: ZNS_ORDER_01</span>
                          </label>
                          <label className="flex items-center gap-3 p-3 bg-white border border-blue-100 rounded-lg cursor-pointer">
                             <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                             <span className="text-sm font-medium text-slate-700 flex-1">Gửi Zalo ZNS chúc mừng Sinh nhật Khách hàng (Loyalty)</span>
                             <button className="text-[10px] font-bold text-blue-500 hover:text-blue-700 underline">Cấu hình Mẫu tin</button>
                          </label>
                       </div>
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
