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
 case 'blue': return 'bg-slate-100 text-blue-600';
 case 'orange': return 'bg-orange-50 text-blue-600';
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
 <div className="space-y-4 animate-in fade-in slide-in- duration-500 pb-4">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-1">
 {activeTab !== 'overview' && (
 <button onClick={() => setActiveTab('overview')} className="p-1 hover:bg-slate-100 rounded-md transition-colors mr-1">
 <ArrowLeft className="w-4 h-4 text-slate-600" />
 </button>
 )}
 <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900">Quản trị Kinh doanh (Sales)</h1>
 </div>
 <p className="text-sm text-slate-500">Hệ thống quản lý KPI, tính hoa hồng tự động và thi đua đội ngũ Sales.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 Xuất Báo cáo KPI
 </button>
 <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 + Tạo Lead mới
 </button>
 </div>
 </div>

 {activeTab === 'overview' && (
 <div className="space-y-4">
 {/* Stats Cards */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
 <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0"><TrendingUp className="w-4 h-4" /></div>
 <div className="min-w-0">
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">Tổng GMV chốt (T3)</p>
 <span className="text-base font-bold text-slate-900">{formatCurrency(12500000000)}</span>
 </div>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded ml-auto shrink-0">+15.8%</span>
 </div>
 <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
 <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0"><Target className="w-4 h-4" /></div>
 <div className="min-w-0">
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">Hoàn thành KPI</p>
 <span className="text-base font-bold text-slate-900">88.5%</span>
 </div>
 <span className="text-[10px] text-blue-600 font-bold bg-slate-100 px-2 py-0.5 rounded ml-auto shrink-0">On Track</span>
 </div>
 <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
 <div className="p-2 bg-primary-50 text-primary-600 rounded-lg shrink-0"><GitMerge className="w-4 h-4" /></div>
 <div className="min-w-0">
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">Deal đang Open</p>
 <span className="text-base font-bold text-slate-900">45 Leads</span>
 </div>
 <span className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded ml-auto shrink-0">High Value</span>
 </div>
 <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
 <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0"><Award className="w-4 h-4" /></div>
 <div className="min-w-0">
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">Hoa hồng tạm tính</p>
 <span className="text-base font-bold text-amber-600">{formatCurrency(320000000)}</span>
 </div>
 <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded ml-auto shrink-0">Commission</span>
 </div>
 </div>

 {/* AI Sales Insights */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
 <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
 <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-blue-600" />
 <h3 className="text-sm font-bold text-slate-900">AI Sales Intelligence</h3>
 <span className="ml-auto text-[10px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">Trực tiếp</span>
 </div>
 <div className="p-4">
 <div className="grid grid-cols-3 gap-4 mb-4">
 <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
 <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Dự báo doanh thu</p>
 <p className="text-base font-bold text-slate-900">{formatCurrency(15200000000)}</p>
 <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
 <TrendingUp className="w-3 h-3" /> +21.4% vs T4
 </p>
 </div>
 <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
 <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Tỉ lệ chốt deal</p>
 <p className="text-base font-bold text-slate-900">34.2%</p>
 <p className="text-[10px] font-bold text-blue-600 mt-0.5">Trên TB ngành</p>
 </div>
 <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
 <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">LTV (90 ngày)</p>
 <p className="text-base font-bold text-slate-900">{formatCurrency(4500000000)}</p>
 <p className="text-[10px] font-bold text-primary-600 mt-0.5">Khách hiện tại</p>
 </div>
 </div>
 <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="flex -space-x-2">
 {['A', 'B', 'C', 'D'].map((char, i) => (
 <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
 {char}
 </div>
 ))}
 </div>
 <p className="text-[10px] font-medium text-slate-600">4 nhân viên có dấu hiệu bứt phá vượt bậc</p>
 </div>
 <button className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-blue-700 transition-all">
 Xem đề xuất
 </button>
 </div>
 </div>
 </div>

 <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
 <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
 <Clock className="w-4 h-4 text-slate-500" />
 <h4 className="text-sm font-bold text-slate-900">Hoạt động gần đây</h4>
 </div>
 <div className="p-4 space-y-3">
 {[
 { time: '2 phút trước', msg: 'Trần Thị B vừa chốt deal 450tr', type: 'win' },
 { time: '15 phút trước', msg: 'Lead mới từ Facebook: VNPT Corp', type: 'lead' },
 { time: '1 giờ trước', msg: 'Lê Văn C cập nhật báo cáo KPI', type: 'update' }
 ].map((act, i) => (
 <div key={i} className="flex gap-3 items-start">
 <div className={cn(
 "w-1.5 h-1.5 rounded-full mt-1.5 shrink-0",
 act.type === 'win' ? "bg-emerald-500" : act.type === 'lead' ? "bg-blue-500" : "bg-slate-300"
 )} />
 <div>
 <p className="text-xs font-medium text-slate-900">{act.msg}</p>
 <p className="text-[10px] text-slate-400">{act.time}</p>
 </div>
 </div>
 ))}
 </div>
 <div className="px-4 pb-4">
 <button className="w-full py-2 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 transition-all flex items-center justify-center gap-1">
 Xem tất cả <ArrowRight className="w-3 h-3" />
 </button>
 </div>
 </div>
 </div>

 {/* Module Grid */}
 <div className="space-y-3">
 {SALES_MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx} className="space-y-4">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
 <span className="w-1 h-4 bg-blue-600 rounded-full inline-block" />
 {group.title}
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
 {group.items.map((mod) => (
 <div 
 key={mod.id}
 onClick={() => setActiveTab(mod.id as any)}
 className="group bg-white p-5 rounded-2xl border border-slate-300 shadow-sm hover:shadow-sm hover:border-[#2563EB]/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
 <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
 </div>
 <div className={cn("w-12 h-12 rounded relative z-10 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm", getColorClasses(mod.color))}>
 <mod.icon className="w-6 h-6" />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-slate-900 text-sm mb-1.5 group-hover:text-blue-600 transition-colors">{mod.label}</h3>
 <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{mod.desc}</p>
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
 <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Tìm nhân viên, cấp bậc..." 
 className="bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Lọc theo Tier
 </button>
 </div>
 <button className="text-xs font-semibold text-blue-600 flex items-center gap-2 hover:underline">
 Real-time Leaderboard <ArrowUpRight className="w-3 h-3" />
 </button>
 </div>

 <div className="overflow-x-auto min-w-0 custom-scrollbar-x">
 <table className="min-w-[680px] w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-100">
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nhân viên Sales</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40 whitespace-nowrap">Cấp bậc & Hoa hồng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-44 whitespace-nowrap">Target Hoàn thành</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40 whitespace-nowrap text-right">Hoa hồng tạm tính</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-32 whitespace-nowrap text-right">Phân hạng (Rank)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {MOCK_SALES.map((sale, idx) => (
 <tr key={sale.id} className="hover:bg-slate-50 group transition-colors text-sm">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-blue-600 border border-slate-300 text-xs">
 {sale.name.charAt(0)}
 </div>
 <div>
 <p className="font-bold text-slate-900">{sale.name}</p>
 <p className="text-[10px] text-slate-500 uppercase tracking-tight">{sale.id}</p>
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
 <p className="text-[10px] text-slate-500 font-medium">Rate: {sale.commissionRate}% Doanh số</p>
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
 className={cn("h-full rounded-full transition-all duration-1000", sale.achieved >= sale.target ? "bg-[#10B981]" : "bg-blue-600")} 
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
 <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
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
 <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden animate-in fade-in slide-in- duration-500">
 {settingSection === 'commission' && (
 <>
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <div>
 <h3 className="text-lg font-bold text-slate-900">Thiết lập Bậc & Hoa hồng</h3>
 <p className="text-xs text-slate-600 mt-1">Cấu hình cấp độ Seniority và tỷ lệ Commission tương ứng cho Đội ngũ Kinh doanh.</p>
 </div>
 <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">
 <Save className="w-4 h-4" /> Lưu thông số
 </button>
 </div>
 <div className="p-6 space-y-6">
 {['Sales Lead', 'Senior Sales', 'Junior Sales'].map((tier, i) => (
 <div key={tier} className="flex flex-col md:flex-row gap-6 p-5 border border-slate-200 rounded-xl bg-slate-50 items-start md:items-center">
 <div className="w-full md:w-1/3">
 <h4 className="font-bold text-slate-900 text-sm">{tier}</h4>
 <p className="text-xs text-slate-600 mt-1">Cấp bậc {i + 1} trong cấu trúc Sales Team.</p>
 </div>
 <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target tháng (VND)</label>
 <input type="text" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-orange-600" defaultValue={i === 0 ? "5,000,000,000" : i === 1 ? "3,000,000,000" : "1,000,000,000"} />
 </div>
 <div className="relative">
 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tỷ lệ HH (%)</label>
 <div className="relative">
 <input type="number" step="0.1" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-2xl focus:outline-none focus:ring-1 focus:ring-orange-600" defaultValue={i === 0 ? "2.5" : i === 1 ? "1.8" : "1.2"} />
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
 <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex items-center justify-between px-4 py-3 gap-4">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
 <Trophy className="w-5 h-5" />
 </div>
 <div>
 <h4 className="font-bold text-sm text-slate-900">Sales Gamification Engine</h4>
 <p className="text-xs text-slate-500">Vinh danh Sales thành tích tốt nhất. Tự động tính thưởng nóng "Hổ báo" cho hợp đồng GMV trên 100tr.</p>
 </div>
 </div>
 <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shrink-0">Mở Dashboard Thi đua</button>
 </div>
 )}
 </div>
 );
}
