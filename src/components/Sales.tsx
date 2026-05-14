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
 { id: 'S-001', name: 'Nguyá»…n VÄƒn A', tier: 'senior', target: 500000000, achieved: 450000000, commissionRate: 2.5 },
 { id: 'S-002', name: 'Tráº§n Thá»‹ B', tier: 'lead', target: 800000000, achieved: 920000000, commissionRate: 3.5 },
 { id: 'S-003', name: 'LÃª VÄƒn C', tier: 'junior', target: 200000000, achieved: 120000000, commissionRate: 1.5 },
];

const SALES_MODULE_GROUPS = [
 {
 title: 'Váº­n hÃ nh Kinh doanh',
 items: [
 { id: 'dashboard', label: 'Báº£ng theo dÃµi KPI', desc: 'Theo dÃµi tiáº¿n Ä‘á»™ doanh sá»‘ vÃ  rank.', icon: Target, color: 'blue' },
 { id: 'reps', label: 'Äá»™i ngÅ© Sales', desc: 'Quáº£n lÃ½ nhÃ¢n viÃªn vÃ  cáº¥p báº­c.', icon: Users, color: 'indigo' },
 { id: 'pipeline', label: 'CÆ¡ há»™i (Pipeline)', desc: 'Theo dÃµi cÃ¡c deal Ä‘ang Ä‘Ã m phÃ¡n.', icon: TrendingUp, color: 'emerald' },
 { id: 'commissions', label: 'TÃ­nh toÃ¡n Hoa há»“ng', desc: 'Tá»± Ä‘á»™ng tÃ­nh commission theo data.', icon: Award, color: 'orange' },
 ]
 },
 {
 title: 'Cáº¥u hÃ¬nh & Gamification',
 items: [
 { id: 'settings', label: 'Cáº¥u hÃ¬nh Sales', desc: 'Thiáº¿t láº­p báº­c hoa há»“ng vÃ  rules.', icon: GitMerge, color: 'purple' },
 { id: 'rewards', label: 'Khen thÆ°á»Ÿng nÃ³ng', desc: 'Gamification chá»‘t deal tháº§n tá»‘c.', icon: Trophy, color: 'rose' },
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
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Quáº£n trá»‹ Kinh doanh (Sales)</h1>
 </div>
 <p className="text-sm text-[#6B7280]">Há»‡ thá»‘ng quáº£n lÃ½ KPI, tÃ­nh hoa há»“ng tá»± Ä‘á»™ng vÃ  thi Ä‘ua Ä‘á»™i ngÅ© Sales.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 Xuáº¥t BÃ¡o cÃ¡o KPI
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 + Táº¡o Lead má»›i
 </button>
 </div>
 </div>

 {activeTab === 'overview' && (
 <div className="space-y-8">
 {/* Stats Cards */}
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-3">Tá»•ng GMV chá»‘t (T3)</p>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{formatCurrency(12500000000)}</span>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">+15.8%</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Tá»‰ lá»‡ HoÃ n thÃ nh KPI</p>
 <div className="flex items-end justify-between mt-3">
 <span className="text-2xl font-black text-[#111827]">88.5%</span>
 <span className="text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded">On Track</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Deal Ä‘ang Open</p>
 <div className="flex items-end justify-between mt-3">
 <span className="text-2xl font-black text-[#111827]">45 Leads</span>
 <span className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded">High Value</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Hoa há»“ng táº¡m tÃ­nh</p>
 <div className="flex items-end justify-between mt-3">
 <span className="text-2xl font-black text-amber-600">{formatCurrency(320000000)}</span>
 <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Commission</span>
 </div>
 </div>
 </DraggableGrid>

 {/* AI Sales Insights */}
 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-3 gap-6" columns={3} gap={24}>
 <div className="lg:col-span-2 bg-slate-900 rounded-xl p-8 text-[#FAF9F5] relative overflow-hidden shadow-sm">
 <div className="relative z-10">
 <div className="flex items-center gap-2 mb-6">
 <Sparkles className="w-5 h-5 text-primary-200" />
 <h3 className="text-lg font-bold uppercase tracking-widest italic">AI Sales Intelligence</h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
 <div className="space-y-1">
 <p className="text-[10px] text-primary-100 font-bold uppercase opacity-70">Dá»± bÃ¡o doanh thu thÃ¡ng</p>
 <p className="text-2xl font-black">{formatCurrency(15200000000)}</p>
 <p className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
 <TrendingUp className="w-3 h-3" /> +21.4% vs T4
 </p>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] text-primary-100 font-bold uppercase opacity-70">Tá»‰ lá»‡ chá»‘t deal (Win Rate)</p>
 <p className="text-2xl font-black">34.2%</p>
 <p className="text-[10px] font-bold text-primary-200">TrÃªn trung bÃ¬nh ngÃ nh</p>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] text-primary-100 font-bold uppercase opacity-70">LTV Dá»± kiáº¿n (Next 90d)</p>
 <p className="text-2xl font-black">{formatCurrency(4500000000)}</p>
 <p className="text-[10px] font-bold text-primary-200">Tá»« khÃ¡ch hÃ ng hiá»‡n táº¡i</p>
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
 <p className="text-[10px] font-bold text-primary-100 italic">4 nhÃ¢n viÃªn Ä‘ang cÃ³ dáº¥u hiá»‡u bá»©t phÃ¡ doanh sá»‘ vÆ°á»£t báº­c</p>
 </div>
 <button className="px-4 py-2 bg-white text-primary-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary-50 transition-all shadow-sm ring-4 ring-white/10">
 Xem Recommendation
 </button>
 </div>
 </div>
 <Zap className="absolute -bottom-10 -right-10 w-48 h-48 text-[#FAF9F5]/5 rotate-12" />
 </div>

 <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-sm flex flex-col justify-between">
 <div>
 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
 <Clock className="w-4 h-4" /> Hoáº¡t Ä‘á»™ng gáº§n Ä‘Ã¢y
 </h4>
 <div className="space-y-4">
 {[
 { time: '2 phÃºt trÆ°á»›c', msg: 'Tráº§n Thá»‹ B vá»«a chá»‘t deal 450tr', type: 'win' },
 { time: '15 phÃºt trÆ°á»›c', msg: 'Lead má»›i tá»« Facebook: VNPT Corp', type: 'lead' },
 { time: '1 giá» trÆ°á»›c', msg: 'LÃª VÄƒn C cáº­p nháº­t bÃ¡o cÃ¡o KPI', type: 'update' }
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
 <button className="w-full mt-6 py-3 border border-slate-300 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
 Xem táº¥t cáº£ Log <ArrowRight className="w-3 h-3" />
 </button>
 </div>
 </DraggableGrid>

 {/* Module Grid */}
 <div className="space-y-6">
 {SALES_MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx} className="space-y-4">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
 <span className="w-1 h-4 bg-[#2563EB] rounded-full inline-block" />
 {group.title}
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
 {group.items.map((mod) => (
 <div 
 key={mod.id}
 onClick={() => setActiveTab(mod.id as any)}
 className="group bg-white p-5 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm hover:border-[#2563EB]/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
 <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
 </div>
 <div className={cn("w-12 h-12 rounded relative z-10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-[#FAF9F5] transition-all shadow-sm", getColorClasses(mod.color))}>
 <mod.icon className="w-6 h-6" />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-[#111827] text-sm mb-1.5 group-hover:text-[#2563EB] transition-colors">{mod.label}</h3>
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
 <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="TÃ¬m nhÃ¢n viÃªn, cáº¥p báº­c..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Lá»c theo Tier
 </button>
 </div>
 <button className="text-xs font-semibold text-[#2563EB] flex items-center gap-2 hover:underline">
 Real-time Leaderboard <ArrowUpRight className="w-3 h-3" />
 </button>
 </div>

 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">NhÃ¢n viÃªn Sales</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Cáº¥p báº­c & Hoa há»“ng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Target HoÃ n thÃ nh</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Hoa há»“ng táº¡m tÃ­nh</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">PhÃ¢n háº¡ng (Rank)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {MOCK_SALES.map((sale, idx) => (
 <tr key={sale.id} className="hover:bg-[#F9FAFB] group transition-colors text-sm">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#2563EB] border border-slate-300 text-xs">
 {sale.name.charAt(0)}
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
 <p className="text-[10px] text-[#6B7280] font-medium">Rate: {sale.commissionRate}% Doanh sá»‘</p>
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
 <Percent className="w-4 h-4" /> Báº­c hoa há»“ng (Tiers)
 </button>
 <button 
 onClick={() => setSettingSection('routing')}
 className={cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all", settingSection === 'routing' ? "bg-slate-100 text-orange-800" : "text-slate-700 hover:bg-slate-50")}
 >
 <GitMerge className="w-4 h-4" /> PhÃ¢n bá»• Leads
 </button>
 <button 
 onClick={() => setSettingSection('gamification')}
 className={cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all", settingSection === 'gamification' ? "bg-slate-100 text-orange-800" : "text-slate-700 hover:bg-slate-50")}
 >
 <Gift className="w-4 h-4" /> Khen thÆ°á»Ÿng (Gamification)
 </button>
 </div>
 </div>

 <div className="col-span-1 md:col-span-3">
 <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden animate-in fade-in slide-in- duration-500">
 {settingSection === 'commission' && (
 <>
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-[#F9FAFB]">
 <div>
 <h3 className="text-lg font-bold text-slate-900">Thiáº¿t láº­p Báº­c & Hoa há»“ng</h3>
 <p className="text-xs text-slate-600 mt-1">Cáº¥u hÃ¬nh cáº¥p Ä‘á»™ Seniority vÃ  tá»· lá»‡ Commission tÆ°Æ¡ng á»©ng cho Äá»™i ngÅ© Kinh doanh.</p>
 </div>
 <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-[#FAF9F5] rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">
 <Save className="w-4 h-4" /> LÆ°u thÃ´ng sá»‘
 </button>
 </div>
 <div className="p-6 space-y-6">
 {['Sales Lead', 'Senior Sales', 'Junior Sales'].map((tier, i) => (
 <div key={tier} className="flex flex-col md:flex-row gap-6 p-5 border border-slate-200 rounded-xl bg-slate-50 items-start md:items-center">
 <div className="w-full md:w-1/3">
 <h4 className="font-bold text-slate-900 text-sm">{tier}</h4>
 <p className="text-xs text-slate-600 mt-1">Cáº¥p báº­c {i + 1} trong cáº¥u trÃºc Sales Team.</p>
 </div>
 <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target thÃ¡ng (VND)</label>
 <input type="text" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-600" defaultValue={i === 0 ? "5,000,000,000" : i === 1 ? "3,000,000,000" : "1,000,000,000"} />
 </div>
 <div className="relative">
 <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tá»· lá»‡ HH (%)</label>
 <div className="relative">
 <input type="number" step="0.1" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-600" defaultValue={i === 0 ? "2.5" : i === 1 ? "1.8" : "1.2"} />
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
 <div className="bg-slate-900 rounded-xl p-6 text-[#FAF9F5] border border-slate-800 flex items-center justify-between mt-8">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg">
 <Trophy className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-lg italic">Sales Gamification Engine</h4>
 <p className="text-slate-500 text-sm">Há»‡ thá»‘ng vinh danh Sales cÃ³ thÃ nh tÃ­ch tá»‘t nháº¥t trong ngÃ y. Tá»± Ä‘á»™ng tÃ­nh thÆ°á»Ÿng nÃ³ng "Há»• bÃ¡o" cho cÃ¡c há»£p Ä‘á»“ng Seller cÃ³ GMV trÃªn 100tr.</p>
 </div>
 </div>
 <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-[#FAF9F5] font-bold rounded-lg transition-all shadow-sm shadow-emerald-500/20">Má»Ÿ Dashboard Thi Ä‘ua</button>
 </div>
 )}
 </div>
 );
}


