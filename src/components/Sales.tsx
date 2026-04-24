import React, { useState } from 'react';
import { 
  Users, 
  Target, 
  Trophy, 
  TrendingUp, 
  BarChart3, 
  Search, 
  Filter, 
  Crown, 
  Medal, 
  ArrowUpRight, 
  Star,
  Settings2,
  MoreVertical,
  CheckCircle2,
  Percent,
  GitMerge,
  Gift,
  Save,
  ShieldCheck
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { SalesRep } from '../types/erp';

const MOCK_SALES: SalesRep[] = [
  { id: 'SAL-001', name: 'Lê Văn Tám', tier: 'lead', target: 5000000000, achieved: 4200000000, commissionRate: 2.5, salesCount: 124 },
  { id: 'SAL-002', name: 'Trần Thị Thu', tier: 'senior', target: 3000000000, achieved: 3250000000, commissionRate: 1.8, salesCount: 88 },
  { id: 'SAL-003', name: 'Nguyễn Minh Anh', tier: 'junior', target: 1000000000, achieved: 850000000, commissionRate: 1.2, salesCount: 42 },
];

export function SalesManagement() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'settings'>('dashboard');
  const [settingSection, setSettingSection] = useState<'commission' | 'routing' | 'gamification'>('commission');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Quản lý Đội ngũ Kinh doanh</h1>
          <p className="text-sm text-[#6B7280] mt-1">Cấp bậc, hoa hồng và theo dõi hiệu suất thực tế của đội ngũ Sales sàn.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setActiveTab(activeTab === 'dashboard' ? 'settings' : 'dashboard')}
            className={cn(
              "border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              activeTab === 'settings' ? "bg-slate-100 text-blue-600 border-blue-200" : "bg-white hover:bg-slate-50"
            )}
          >
            <Settings2 className="w-4 h-4" />
            {activeTab === 'dashboard' ? 'Cấu hình chính sách' : 'Quay lại Dashboard'}
          </button>
          {activeTab === 'dashboard' && (
            <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm">
              Thêm nhân sự mới
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm">
               <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Tổng doanh số tháng 03</p>
               <div className="text-2xl font-bold text-[#111827]">{formatCurrency(8300000000)}</div>
               <p className="text-[10px] text-[#10B981] font-medium mt-1">Hoàn thành 92% kế hoạch</p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm">
               <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Tổng hoa hồng chi trả</p>
               <div className="text-2xl font-bold text-[#2563EB]">{formatCurrency(124500000)}</div>
               <p className="text-[10px] text-[#6B7280] mt-1">Tỷ lệ trung bình: 1.5%</p>
            </div>
            <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm">
               <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Người dẫn đầu (Champion)</p>
               <div className="text-lg font-bold text-[#111827] truncate mt-1">Trần Thị Thu</div>
               <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#10B981] font-bold">
                  <Crown className="w-3.5 h-3.5 fill-current" /> 108% Target
               </div>
            </div>
            <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm">
               <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Active Sales Rep</p>
               <div className="text-2xl font-bold text-[#111827]">24/25</div>
               <p className="text-[10px] text-[#6B7280] mt-1">Đang hoạt động tại thực địa</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <input 
                    type="text" 
                    placeholder="Tìm nhân viên, cấp bậc..." 
                    className="bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
                  />
                </div>
                <button className="bg-white border border-[#E5E7EB] px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
                   <Filter className="w-4 h-4" /> Lọc theo Tier
                </button>
              </div>
              <button className="text-xs font-semibold text-[#2563EB] flex items-center gap-2 hover:underline">
                 Real-time Leaderboard <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                    <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nhân viên Sales</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Cấp bậc & Hoa hồng</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Target Hoàn thành</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Hoa hồng tạm tính</th>
                    <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Phân hạng (Rank)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {MOCK_SALES.map((sale, idx) => (
                    <tr key={sale.id} className="hover:bg-[#F9FAFB] group transition-colors text-sm">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#2563EB] border border-[#E5E7EB] text-xs">
                              {sale.name.charAt(0)}
                           </div>
                           <div>
                              <p className="font-bold text-[#111827]">{sale.name}</p>
                              <p className="text-[10px] text-[#6B7280] uppercase">{sale.id}</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                           <span className={cn(
                             "px-2 py-0.5 rounded text-[10px] font-bold border",
                             sale.tier === 'lead' ? "bg-purple-50 text-purple-700 border-purple-100" :
                             sale.tier === 'senior' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-slate-50 text-slate-700 border-slate-100"
                           )}>
                              {sale.tier.toUpperCase()}
                           </span>
                           <p className="text-[10px] text-[#6B7280] font-medium">Rate: {sale.commissionRate}% Doanh số</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-[150px] space-y-1.5">
                           <div className="flex justify-between text-[10px] font-bold">
                              <span>{((sale.achieved / sale.target) * 100).toFixed(0)}%</span>
                              <span>{formatCurrency(sale.achieved)} / {formatCurrency(sale.target)}</span>
                           </div>
                           <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full transition-all duration-1000", sale.achieved >= sale.target ? "bg-[#10B981]" : "bg-[#2563EB]")} 
                                style={{ width: `${Math.min(100, (sale.achieved / sale.target) * 100)}%` }}
                              />
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#10B981]">
                        {formatCurrency((sale.achieved * sale.commissionRate) / 100)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end">
                           {idx === 0 && <Medal className="w-5 h-5 text-yellow-500" />}
                           {idx === 1 && <Medal className="w-5 h-5 text-slate-300" />}
                           {idx === 2 && <Medal className="w-5 h-5 text-amber-600" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-slate-900 rounded-lg p-6 text-white border border-slate-800 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
                   <Trophy className="w-6 h-6" />
                </div>
                <div>
                   <h4 className="font-bold text-lg italic">Sales Gamification Engine</h4>
                   <p className="text-slate-400 text-sm">Hệ thống vinh danh Sales có thành tích tốt nhất trong ngày. Tự động tính thưởng nóng "Hổ báo" cho các hợp đồng Seller có GMV trên 100tr.</p>
                </div>
             </div>
             <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20">Mở Dashboard Thi đua</button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 space-y-2 relative">
             <div className="sticky top-8">
               <button 
                 onClick={() => setSettingSection('commission')}
                 className={cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all", settingSection === 'commission' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50")}
               >
                 <Percent className="w-4 h-4" /> Bậc hoa hồng (Tiers)
               </button>
               <button 
                 onClick={() => setSettingSection('routing')}
                 className={cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all", settingSection === 'routing' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50")}
               >
                 <GitMerge className="w-4 h-4" /> Phân bổ Leads
               </button>
               <button 
                 onClick={() => setSettingSection('gamification')}
                 className={cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all", settingSection === 'gamification' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50")}
               >
                 <Gift className="w-4 h-4" /> Khen thưởng (Gamification)
               </button>
             </div>
          </div>

          <div className="col-span-1 md:col-span-3">
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                {settingSection === 'commission' && (
                  <>
                     <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#F9FAFB]">
                        <div>
                           <h3 className="text-lg font-bold text-slate-900">Thiết lập Bậc & Hoa hồng</h3>
                           <p className="text-xs text-slate-500 mt-1">Cấu hình cấp độ Seniority và tỷ lệ Commission tương ứng cho Đội ngũ Kinh doanh.</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                           <Save className="w-4 h-4" /> Lưu thông số
                        </button>
                     </div>
                     <div className="p-6 space-y-6">
                        {['Sales Lead', 'Senior Sales', 'Junior Sales'].map((tier, i) => (
                           <div key={tier} className="flex flex-col md:flex-row gap-6 p-5 border border-slate-100 rounded-xl bg-slate-50 items-start md:items-center">
                              <div className="w-full md:w-1/3">
                                 <h4 className="font-bold text-slate-900 text-sm">{tier}</h4>
                                 <p className="text-xs text-slate-500 mt-1">Cấp bậc {i + 1} trong cấu trúc Sales Team.</p>
                              </div>
                              <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
                                 <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Target tháng (VND)</label>
                                    <input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" defaultValue={i === 0 ? "5,000,000,000" : i === 1 ? "3,000,000,000" : "1,000,000,000"} />
                                 </div>
                                 <div className="relative">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Tỷ lệ HH (%)</label>
                                    <div className="relative">
                                       <input type="number" step="0.1" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" defaultValue={i === 0 ? "2.5" : i === 1 ? "1.8" : "1.2"} />
                                       <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                    </div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </>
                )}

                {settingSection === 'routing' && (
                  <>
                     <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#F9FAFB]">
                        <div>
                           <h3 className="text-lg font-bold text-slate-900">Quy tắc Phân bổ Leads</h3>
                           <p className="text-xs text-slate-500 mt-1">Tự động điều phối Leads từ Marketing hoặc hệ thống sang cho Sales.</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                           <Save className="w-4 h-4" /> Lưu quy tắc
                        </button>
                     </div>
                     <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <label className="flex items-start gap-4 p-5 border border-blue-200 bg-blue-50/50 rounded-xl cursor-pointer">
                              <input type="radio" name="routing" defaultChecked className="mt-1" />
                              <div>
                                 <h4 className="font-bold text-slate-900 text-sm">Round Robin</h4>
                                 <p className="text-xs text-slate-600 mt-1">Chia đều lần lượt cho các Sales đang có trạng thái Available.</p>
                              </div>
                           </label>
                           <label className="flex items-start gap-4 p-5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl cursor-pointer transition-all">
                              <input type="radio" name="routing" className="mt-1" />
                              <div>
                                 <h4 className="font-bold text-slate-900 text-sm">Hiệu suất (AI Routing)</h4>
                                 <p className="text-xs text-slate-500 mt-1">Ưu tiên chia Lead cho Sales có tỷ lệ Conversion Rate cao nhất.</p>
                              </div>
                           </label>
                           <label className="flex items-start gap-4 p-5 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl cursor-pointer transition-all">
                              <input type="radio" name="routing" className="mt-1" />
                              <div>
                                 <h4 className="font-bold text-slate-900 text-sm">Phân theo Khu vực / Ngành</h4>
                                 <p className="text-xs text-slate-500 mt-1">Gán theo cấu hình ngành hàng (vd: Thời trang -&gt; Team A).</p>
                              </div>
                           </label>
                        </div>
                        <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
                           <ShieldCheck className="w-5 h-5 text-emerald-600" />
                           <span className="text-sm font-medium text-slate-700">Chống spam: Chặn cùng một SĐT nhảy Lead quá 2 lần/ngày.</span>
                        </div>
                     </div>
                  </>
                )}

                {settingSection === 'gamification' && (
                  <>
                     <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#F9FAFB]">
                        <div>
                           <h3 className="text-lg font-bold text-slate-900">Thi đua & Khen thưởng nóng</h3>
                           <p className="text-xs text-slate-500 mt-1">Tạo động lực chốt Sale qua hệ thống phần thưởng realtime.</p>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                           <Save className="w-4 h-4" /> Lưu chương trình
                        </button>
                     </div>
                     <div className="p-6 space-y-6">
                        <div className="space-y-4">
                           <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                              <div>
                                 <h4 className="font-bold text-slate-900 text-sm">Thưởng Deal "Hổ báo" (Mega Deal)</h4>
                                 <p className="text-xs text-slate-500 mt-0.5">Tự động bắn thông báo và thưởng khi có hợp đồng vượt ngưỡng.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                           </div>
                           <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                              <div className="flex gap-4">
                                 <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Ngưỡng Hợp đồng (VND)</label>
                                    <input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" defaultValue="100,000,000" />
                                 </div>
                                 <div className="flex-1">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Thưởng nóng (VND)</label>
                                    <input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" defaultValue="2,000,000" />
                                 </div>
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium italic">Hiệu ứng pháo hoa sẽ xuất hiện trên màn hình của tất cả User khi Mega Deal được ghi nhận.</p>
                           </div>
                        </div>

                        <div className="space-y-4 pt-6 border-t border-slate-100">
                           <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                              <div>
                                 <h4 className="font-bold text-slate-900 text-sm">Champion of the Month</h4>
                                 <p className="text-xs text-slate-500 mt-0.5">Sale có % hoàn thành target cao nhất tháng.</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                           </div>
                           <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                              <div className="w-full md:w-1/2">
                                 <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Thưởng thêm (VND)</label>
                                 <input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500" defaultValue="5,000,000" />
                              </div>
                           </div>
                        </div>
                     </div>
                  </>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

