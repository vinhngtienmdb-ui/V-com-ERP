import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 Users, 
 Target, 
 TrendingUp, 
 Award, 
 Search, 
 Filter, 
 ArrowUpRight, 
 Medal, 
 Trophy, 
 Percent, 
 GitMerge, 
 Gift, 
 Save, 
 ShieldCheck, 
 ArrowLeft,
 ChevronLeft,
 Sparkles,
 Zap,
 Clock,
 ArrowRight
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

const MOCK_SALES = [
 { id: 'S-001', name: 'Nguyễn Văn A', tier: 'senior', target: 500000000, achieved: 450000000, commissionRate: 2.5 },
 { id: 'S-002', name: 'Trần Thị B', tier: 'lead', target: 800000000, achieved: 920000000, commissionRate: 3.5 },
 { id: 'S-003', name: 'Lê Văn C', tier: 'junior', target: 200000000, achieved: 120000000, commissionRate: 1.5 },
];

const SALES_MODULE_GROUPS = [
 {
 title: 'Vận hành Kinh doanh',
 items: [
 { id: 'dashboard', label: 'Bảng theo dõi KPI', desc: 'Theo dõi tiến độ doanh số và rank.', icon: Target, color: 'blue' },
 { id: 'reps', label: 'Đội ngũ Sales', desc: 'Quản lý nhân viên và cấp bậc.', icon: Users, color: 'indigo' },
 { id: 'pipeline', label: 'Cơ hội (Pipeline)', desc: 'Theo dõi các deal đang đàm phán.', icon: TrendingUp, color: 'emerald' },
 { id: 'commissions', label: 'Tính toán Hoa hồng', desc: 'Tự động tính commission theo data.', icon: Award, color: 'orange' },
 ]
 },
 {
 title: 'Cấu hình & Gamification',
 items: [
 { id: 'settings', label: 'Cấu hình Sales', desc: 'Thiết lập bậc hoa hồng và rules.', icon: GitMerge, color: 'purple' },
 { id: 'rewards', label: 'Khen thưởng nóng', desc: 'Gamification chốt deal thần tốc.', icon: Trophy, color: 'rose' },
 ]
 }
];

function getColorClasses(color: string) {
 switch (color) {
 case 'blue': return 'bg-slate-100 text-orange-700';
 case 'orange': return 'bg-orange-50 text-orange-600';
 case 'indigo': return 'bg-primary-50 text-primary-600';
 case 'purple': return 'bg-purple-50 text-purple-600';
 case 'emerald': return 'bg-emerald-50 text-emerald-600';
 case 'rose': return 'bg-rose-50 text-rose-600';
 default: return 'bg-slate-50 text-slate-700';
 }
}

export function SalesManagement() {
 const [activeTab, setActiveTab] = useState<'overview' | 'dashboard' | 'reps' | 'settings' | 'pipeline' | 'commissions' | 'rewards'>('overview');
 const [settingSection, setSettingSection] = useState<'commission' | 'routing' | 'gamification'>('commission');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-1">
 {activeTab !== 'overview' && (
 <button onClick={() => setActiveTab('overview')} className="p-1 hover:bg-slate-100 rounded-md transition-colors mr-1">
 <ArrowLeft className="w-4 h-4 text-slate-600" />
 </button>
 )}
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Quản trị Kinh doanh (Sales)</h1>
 </div>
 <p className="text-sm text-[#6B7280]">Hệ thống quản lý KPI, tính hoa hồng tự động và thi đua đội ngũ Sales.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 Xuất Báo cáo KPI
 </button>
 <button className="bg-primary-600 text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 + Tạo Lead mới
 </button>
 </div>
 </div>

 {activeTab === 'overview' && (
 <div className="space-y-8">
 {/* Stats Cards */}
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-3">Tổng GMV chốt (T3)</p>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{formatCurrency(12500000000)}</span>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">+15.8%</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Tỉ lệ Hoàn thành KPI</p>
 <div className="flex items-end justify-between mt-3">
 <span className="text-2xl font-black text-[#111827]">88.5%</span>
 <span className="text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded">On Track</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Deal đang Open</p>
 <div className="flex items-end justify-between mt-3">
 <span className="text-2xl font-black text-[#111827]">45 Leads</span>
 <span className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded">High Value</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Hoa hồng tạm tính</p>
 <div className="flex items-end justify-between mt-3">
 <span className="text-2xl font-black text-amber-600">{formatCurrency(320000000)}</span>
 <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Commission</span>
 </div>
 </div>
 </DraggableGrid>

 {/* AI Sales Insights */}
 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-3 gap-6" columns={3} gap={24}>
 <div className="lg:col-span-2 bg-slate-900 rounded-lg p-6 text-[#FAF9F5] relative overflow-hidden shadow-sm">
 <div className="relative z-10">
 <div className="flex items-center gap-2 mb-6">
 <Sparkles className="w-5 h-5 text-primary-200" />
 <h3 className="text-lg font-bold uppercase tracking-widest italic">AI Sales Intelligence</h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="space-y-1">
 <p className="text-[10px] text-primary-100 font-bold uppercase opacity-70">Dự báo doanh thu tháng</p>
 <p className="text-2xl font-black">{formatCurrency(15200000000)}</p>
 <p className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
 <TrendingUp className="w-3 h-3" /> +21.4% vs T4
 </p>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] text-primary-100 font-bold uppercase opacity-70">Tỉ lệ chốt deal (Win Rate)</p>
 <p className="text-2xl font-black">34.2%</p>
 <p className="text-[10px] font-bold text-primary-200">Trên trung bình ngành</p>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] text-primary-100 font-bold uppercase opacity-70">LTV Dự kiến (Next 90d)</p>
 <p className="text-2xl font-black">{formatCurrency(4500000000)}</p>
 <p className="text-[10px] font-bold text-primary-200">Từ khách hàng hiện tại</p>
 </div>
 </div>
 
 <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="flex -space-x-2">
 {['A', 'B', 'C', 'D'].map((char, i) => (
 <div key={i} className="w-8 h-8 rounded-full border-2 border-primary-600 bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
 {char}
 </div>
 ))}
 </div>
 <p className="text-[10px] font-bold text-primary-100 italic">4 nhân viên đang có dấu hiệu bứt phá doanh số vượt bậc</p>
 </div>
 <button className="px-4 py-2 bg-white text-primary-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-primary-50 transition-all shadow-sm ring-4 ring-white/10">
 Xem Recommendation
 </button>
 </div>
 </div>
 <Zap className="absolute -bottom-10 -right-10 w-48 h-48 text-[#FAF9F5]/5 rotate-12" />
 </div>

 <div className="bg-white border border-slate-300 rounded-lg p-6 shadow-sm flex flex-col justify-between">
 <div>
 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
 <Clock className="w-4 h-4" /> Hoạt động gần đây
 </h4>
 <div className="space-y-4">
 {[
 { time: '2 phút trước', msg: 'Trần Thị B vừa chốt deal 450tr', type: 'win' },
 { time: '15 phút trước', msg: 'Lead mới từ Facebook: VNPT Corp', type: 'lead' },
 { time: '1 giờ trước', msg: 'Lê Văn C cập nhật báo cáo KPI', type: 'update' }
 ].map((act, i) => (
 <div key={i} className="flex gap-3">
 <div className={cn(
 "w-1 h-8 rounded-full",
 act.type === 'win' ? "bg-emerald-500" : act.type === 'lead' ? "bg-slate-800" : "bg-slate-300"
 )} />
 <div>
 <p className="text-xs font-bold text-slate-900">{act.msg}</p>
 <p className="text-[10px] text-slate-500">{act.time}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 <button className="w-full mt-6 py-3 border border-slate-300 rounded-lg text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
 Xem tất cả Log <ArrowRight className="w-3 h-3" />
 </button>
 </div>
 </DraggableGrid>

 {/* Module Grid */}
 <div className="space-y-6">
 {SALES_MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx} className="space-y-4">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
 <span className="w-1 h-4 bg-primary-600 rounded-full inline-block" />
 {group.title}
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
 {group.items.map((mod) => (
 <div 
 key={mod.id}
 onClick={() => setActiveTab(mod.id as any)}
 className="group bg-white p-5 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm hover:border-primary-600/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
 <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
 </div>
 <div className={cn("w-12 h-12 rounded relative z-10 flex items-center justify-center  group-hover:bg-primary-600 group-hover:text-[#FAF9F5] transition-all shadow-sm", getColorClasses(mod.color))}>
 <mod.icon className="w-6 h-6" />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-[#111827] text-sm mb-1.5 group-hover:text-primary-600 transition-colors">{mod.label}</h3>
 <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">{mod.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {(activeTab === 'dashboard' || activeTab === 'reps') && (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Tìm nhân viên, cấp bậc..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Lọc theo Tier
 </button>
 </div>
 <button className="text-xs font-semibold text-primary-600 flex items-center gap-2 hover:underline">
 Real-time Leaderboard <ArrowUpRight className="w-3 h-3" />
 </button>
 </div>

 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse whitespace-nowrap">
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
 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-primary-600 border border-slate-300 text-xs">
 {sale?.name?.charAt(0) || '?'}
 </div>
 <div>
 <p className="font-bold text-[#111827]">{sale.name}</p>
 <p className="text-[10px] text-[#6B7280] uppercase tracking-tight">{sale.id}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="space-y-1">
 <span className={cn(
 "px-2 py-0.5 rounded text-[10px] font-bold border",
 sale.tier === 'lead' ? "bg-purple-50 text-purple-700 border-purple-100" :
 sale.tier === 'senior' ? "bg-slate-100 text-orange-800 border-slate-300" : "bg-slate-50 text-slate-800 border-slate-200"
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
 className={cn("h-full rounded-full transition-all duration-1000", sale.achieved >= sale.target ? "bg-[#10B981]" : "bg-primary-600")} 
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
 {idx === 1 && <Medal className="w-5 h-5 text-slate-500" />}
 {idx === 2 && <Medal className="w-5 h-5 text-amber-600" />}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {activeTab === 'settings' && (
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="col-span-1 space-y-2 relative">
 <div className="sticky top-8">
 <button 
 onClick={() => setSettingSection('commission')}
 className={cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all", settingSection === 'commission' ? "bg-slate-100 text-orange-800" : "text-slate-700 hover:bg-slate-50")}
 >
 <Percent className="w-4 h-4" /> Bậc hoa hồng (Tiers)
 </button>
 <button 
 onClick={() => setSettingSection('routing')}
 className={cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all", settingSection === 'routing' ? "bg-slate-100 text-orange-800" : "text-slate-700 hover:bg-slate-50")}
 >
 <GitMerge className="w-4 h-4" /> Phân bổ Leads
 </button>
 <button 
 onClick={() => setSettingSection('gamification')}
 className={cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all", settingSection === 'gamification' ? "bg-slate-100 text-orange-800" : "text-slate-700 hover:bg-slate-50")}
 >
 <Gift className="w-4 h-4" /> Khen thưởng (Gamification)
 </button>
 </div>
 </div>

 <div className="col-span-1 md:col-span-3">
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden animate-in fade-in slide-in- duration-500">
 {settingSection === 'commission' && (
 <>
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-[#F9FAFB]">
 <div>
 <h3 className="text-lg font-bold text-slate-900">Thiết lập Bậc & Hoa hồng</h3>
 <p className="text-xs text-slate-600 mt-1">Cấu hình cấp độ Seniority và tỷ lệ Commission tương ứng cho Đội ngũ Kinh doanh.</p>
 </div>
 <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-[#FAF9F5] rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">
 <Save className="w-4 h-4" /> Lưu thông số
 </button>
 </div>
 <div className="p-6 space-y-6">
 {['Sales Lead', 'Senior Sales', 'Junior Sales'].map((tier, i) => (
 <div key={tier} className="flex flex-col md:flex-row gap-6 p-5 border border-slate-200 rounded-lg bg-slate-50 items-start md:items-center">
 <div className="w-full md:w-1/3">
 <h4 className="font-bold text-slate-900 text-sm">{tier}</h4>
 <p className="text-xs text-slate-600 mt-1">Cấp bậc {i + 1} trong cấu trúc Sales Team.</p>
 </div>
 <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target tháng (VND)</label>
 <input type="text" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" defaultValue={i === 0 ? "5,000,000,000" : i === 1 ? "3,000,000,000" : "1,000,000,000"} />
 </div>
 <div className="relative">
 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tỷ lệ HH (%)</label>
 <div className="relative">
 <input type="number" step="0.1" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500" defaultValue={i === 0 ? "2.5" : i === 1 ? "1.8" : "1.2"} />
 <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </>
 )}
 </div>
 </div>
 </div>
 )}

 {activeTab !== 'overview' && (
 <div className="bg-slate-900 rounded-lg p-6 text-[#FAF9F5] border border-slate-800 flex items-center justify-between mt-8">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
 <Trophy className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-lg italic">Sales Gamification Engine</h4>
 <p className="text-slate-500 text-sm">Hệ thống vinh danh Sales có thành tích tốt nhất trong ngày. Tự động tính thưởng nóng "Hổ báo" cho các hợp đồng Seller có GMV trên 100tr.</p>
 </div>
 </div>
 <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-[#FAF9F5] font-bold rounded-lg transition-all shadow-sm shadow-emerald-500/20">Mở Dashboard Thi đua</button>
 </div>
 )}
 </div>
 );
}
