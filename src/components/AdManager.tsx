import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 Megaphone, 
 BarChart3, 
 Target, 
 Zap, 
 TrendingUp, 
 PieChart, 
 Search, 
 Filter, 
 Plus, 
 MousePointerClick, 
 Eye, 
 ArrowUpRight, 
 CheckCircle2,
 Clock,
 AlertCircle,
 GanttChartSquare,
 BadgeDollarSign,
 ArrowRight,
 ShieldCheck,
 ZapOff
} from 'lucide-react';
import { 
 ResponsiveContainer, 
 AreaChart, 
 Area, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 BarChart, 
 Bar, 
 Cell 
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { AdBid } from '../types/erp';

const MOCK_BIDS: AdBid[] = [
 { id: 'BID-001', sellerId: 'SEL-001', type: 'keyword', target: 'iPhone 15', bidAmount: 1200, budget: 10000000, spent: 4500000, clicks: 3750, impressions: 84000, status: 'active' },
 { id: 'BID-002', sellerId: 'SEL-005', type: 'banner', target: 'Trang chá»§ - Banner 1', bidAmount: 500000, budget: 50000000, spent: 32000000, clicks: 12400, impressions: 1540000, status: 'active' },
 { id: 'BID-003', sellerId: 'SEL-009', type: 'top_search', target: 'Thá»i trang Nam', bidAmount: 2500, budget: 5000000, spent: 5000000, clicks: 2000, impressions: 45000, status: 'exhausted' },
];

const REVENUE_DATA = [
 { name: '01/04', revenue: 45000000 },
 { name: '05/04', revenue: 52000000 },
 { name: '10/04', revenue: 48000000 },
 { name: '15/04', revenue: 61000000 },
 { name: '20/04', revenue: 55000000 },
 { name: '25/04', revenue: 67000000 },
 { name: '30/04', revenue: 72000000 },
];

const SELLER_PERFORMANCE = [
 { name: 'Mobile World', roas: 8.5, ctr: 4.2 },
 { name: 'Fashion Hub', roas: 6.2, ctr: 3.5 },
 { name: 'Electronics Pro', roas: 7.8, ctr: 3.8 },
 { name: 'Home Decor', roas: 5.4, ctr: 2.9 },
 { name: 'Kids Zone', roas: 6.9, ctr: 4.0 },
];

export function AdManager() {
 const [activeTab, setActiveTab] = useState<'bidding' | 'analytics' | 'revenue'>('bidding');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Advertising Manager (Quáº£ng cÃ¡o ná»™i bá»™)</h1>
 <p className="text-sm text-[#6B7280] mt-1">Há»‡ thá»‘ng Ä‘áº¥u tháº§u tá»« khÃ³a, Ä‘áº¥u tháº§u vá»‹ trÃ­ hiá»ƒn thá»‹ vÃ  phÃ¢n tÃ­ch hiá»‡u quáº£ ROAS cho SÃ n.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <GanttChartSquare className="w-4 h-4" />
 BÃ¡o cÃ¡o ROAS Tá»•ng thá»ƒ
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm">
 Cáº¥u hÃ¬nh vá»‹ trÃ­ Äáº¥u tháº§u
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Doanh thu Quáº£ng cÃ¡o thÃ¡ng</span>
 <BadgeDollarSign className="w-4 h-4 text-[#2563EB]" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">{formatCurrency(1540000000)}</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">+12.5% so vá»›i thÃ¡ng trÆ°á»›c</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">LÆ°á»£t Click (CTR)</span>
 <MousePointerClick className="w-4 h-4 text-[#8B5CF6]" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">425k</div>
 <p className="text-[10px] text-[#6B7280] mt-1">CTR Trung bÃ¬nh: 3.2%</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">ROAS Trung bÃ¬nh sÃ n</span>
 <TrendingUp className="w-4 h-4 text-[#10B981]" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">6.5x</div>
 <p className="text-[10px] text-[#6B7280] mt-1">1Ä‘ quáº£ng cÃ¡o â†’ 6.5Ä‘ doanh thu</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Chiáº¿n dá»‹ch Ä‘ang cháº¡y</span>
 <Target className="w-4 h-4 text-orange-500" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">1,245</div>
 <p className="text-[10px] text-[#F59E0B] font-medium mt-1">42 chiáº¿n dá»‹ch sáº¯p háº¿t ngÃ¢n sÃ¡ch</p>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden p-2">
 <div className="flex border-b border-[#F3F4F6] bg-slate-50/50 rounded-lg overflow-x-auto whitespace-nowrap scrollbar-hide min-w-0">
 {[
 { id: 'bidding', label: 'Äáº¥u tháº§u (Bidding Management)', icon: Zap },
 { id: 'analytics', label: 'Analytics Dashboard (Seller & Marketplace)', icon: BarChart3 }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-8 py-5 text-sm font-bold border-b-2 transition-all flex items-center gap-3",
 activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-slate-100/30" : "border-transparent text-[#6B7280] hover:text-[#111827]"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 {activeTab === 'bidding' && (
 <div className="animate-in fade-in duration-500">
 <div className="p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="TÃ¬m Seller, Tá»« khÃ³a, Vá»‹ trÃ­..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Táº¥t cáº£ loáº¡i hÃ¬nh
 </button>
 </div>
 </div>

 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">TÃªn tháº§u / Seller</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Loáº¡i & Má»¥c tiÃªu</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-right">GiÃ¡ tháº§u (Bid)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">NgÃ¢n sÃ¡ch / ÄÃ£ tiÃªu</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-right">Click / Imp</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center">Tráº¡ng thÃ¡i</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {MOCK_BIDS.map(bid => (
 <tr key={bid.id} className="hover:bg-slate-50 transition-colors text-xs">
 <td className="px-3 py-2.5">
 <p className="font-bold text-[#111827]">{bid.id}</p>
 <p className="text-[10px] text-slate-600 font-mono">Seller ID: {bid.sellerId}</p>
 </td>
 <td className="px-3 py-2.5">
 <div className="space-y-1">
 <span className={cn(
 "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
 bid.type === 'keyword' ? "bg-slate-100 text-orange-700" :
 bid.type === 'banner' ? "bg-purple-50 text-purple-600" : "bg-emerald-50 text-emerald-600"
 )}>
 {bid.type.replace('_', ' ')}
 </span>
 <p className="text-[10px] font-bold text-slate-800">{bid.target}</p>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <p className="font-bold text-[#111827]">{formatCurrency(bid.bidAmount)}</p>
 <p className="text-[10px] text-slate-500">trÃªn {bid.type === 'keyword' ? 'Click' : '1000 Imp'}</p>
 </td>
 <td className="px-3 py-2.5">
 <div className="max-w-[120px] space-y-1.5">
 <div className="flex justify-between text-[10px] font-bold text-[#6B7280]">
 <span>{((bid.spent / bid.budget) * 100).toFixed(0)}%</span>
 <span>{formatCurrency(bid.spent)}</span>
 </div>
 <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
 <div 
 className={cn("h-full rounded-full transition-all duration-700", bid.status === 'active' ? "bg-[#2563EB]" : "bg-slate-400")} 
 style={{ width: `${(bid.spent / bid.budget) * 100}%` }}
 />
 </div>
 <p className="text-[9px] text-slate-500 text-right">Háº¡n má»©c: {formatCurrency(bid.budget)}</p>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <p className="font-bold text-[#111827]">{bid.clicks.toLocaleString()}</p>
 <p className="text-[10px] text-slate-500">{bid.impressions.toLocaleString()} views</p>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex justify-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
 bid.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
 )}>
 {bid.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
 {bid.status === 'active' ? 'ÄANG CHáº Y' : 'Háº¾T NGÃ‚N SÃCH'}
 </span>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {activeTab === 'analytics' && (
 <div className="animate-in fade-in duration-500 p-8 space-y-10">
 {/* Marketplace Revenue Analytics */}
 <div className="bg-slate-50 p-6 rounded-lg border border-slate-200">
 <div className="flex justify-between items-center mb-6">
 <div>
 <h3 className="text-xl font-bold text-[#111827]">Marketplace Ad Revenue Trends</h3>
 <p className="text-xs text-[#6B7280]">Tá»•ng doanh thu tá»« quáº£ng cÃ¡o ná»™i bá»™ cá»§a sÃ n trong 30 ngÃ y qua.</p>
 </div>
 <div className="flex gap-2">
 <span className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-[10px] font-bold">ThÃ¡ng 4, 2024</span>
 </div>
 </div>
 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-3 gap-8" columns={3} gap={32}>
 <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <div className="h-[300px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={REVENUE_DATA}>
 <defs>
 <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
 <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B'}} />
 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748B'}} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
 <Tooltip 
 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
 formatter={(v: any) => [formatCurrency(v), 'Doanh thu']}
 />
 <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 <div className="space-y-4">
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm h-full flex flex-col justify-center">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Doanh thu trung bÃ¬nh ngÃ y</p>
 <h4 className="text-3xl font-black text-[#111827]">{formatCurrency(54000000)}</h4>
 <div className="mt-6 pt-6 border-t border-stone-50 space-y-3">
 <div className="flex justify-between items-center text-xs">
 <span className="text-slate-600">Tá»« khÃ³a (Keywords)</span>
 <span className="font-bold">62%</span>
 </div>
 <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full bg-slate-900" style={{ width: '62%' }} />
 </div>
 <div className="flex justify-between items-center text-xs">
 <span className="text-slate-600">Banners & Ads</span>
 <span className="font-bold">38%</span>
 </div>
 <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full bg-purple-500" style={{ width: '38%' }} />
 </div>
 </div>
 </div>
 </div>
 </DraggableGrid>
 </div>

 {/* Seller ROI & performance */}
 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-2 gap-8" columns={2} gap={32}>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <h3 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
 <TrendingUp className="w-5 h-5 text-emerald-500" /> Top Seller ROAS (Return on Ad Spend)
 </h3>
 <div className="h-[250px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={SELLER_PERFORMANCE}>
 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748B'}} />
 <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#64748B'}} />
 <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
 <Bar dataKey="roas" radius={[4, 4, 0, 0]} barSize={32}>
 {SELLER_PERFORMANCE.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={entry.roas > 7 ? '#10B981' : '#2563EB'} />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 <div className="mt-4 p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center gap-3">
 <Zap className="w-5 h-5 text-emerald-600" />
 <p className="text-[11px] text-emerald-700 font-medium">NhÃ  bÃ¡n hÃ ng <strong>Mobile World</strong> Ä‘ang cÃ³ hiá»‡u quáº£ quáº£ng cÃ¡o tá»‘t nháº¥t vá»›i tá»· lá»‡ 1Ä‘ chi phÃ­ thu vá» 8.5Ä‘ doanh thu.</p>
 </div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <h3 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
 <MousePointerClick className="w-5 h-5 text-[#8B5CF6]" /> Campaign CTR (Click-Through Rate)
 </h3>
 <div className="space-y-4">
 {SELLER_PERFORMANCE.sort((a, b) => b.ctr - a.ctr).map((seller, i) => (
 <div key={seller.name} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200 group">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600">
 {i + 1}
 </div>
 <div>
 <p className="text-sm font-bold text-[#111827]">{seller.name}</p>
 <p className="text-[10px] text-slate-500">Campaign Accuracy: High</p>
 </div>
 </div>
 <div className="text-right">
 <div className="flex items-center gap-2 justify-end">
 <span className="text-sm font-black text-[#111827]">{seller.ctr}%</span>
 <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
 </div>
 <p className="text-[9px] font-bold text-emerald-500">Above Benchmark</p>
 </div>
 </div>
 ))}
 </div>
 <button className="w-full py-3 mt-6 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-50 hover:text-orange-700 transition-all uppercase tracking-widest">
 Xem toÃ n bá»™ bÃ¡o cÃ¡o CTR
 </button>
 </div>
 </DraggableGrid>
 </div>
 )}
 </div>

 <div className="bg-primary-900 text-[#FAF9F5] p-8 rounded-lg mt-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-12">
 <div className="flex-1 space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-3 bg-slate-800 rounded-lg shadow-sm shadow-slate-900/5">
 <PieChart className="w-6 h-6" />
 </div>
 <h3 className="text-xl font-bold italic">Ad Bidding Algorithm v3</h3>
 </div>
 <p className="text-slate-500 text-sm leading-relaxed max-w-lg">Thuáº­t toÃ¡n Ä‘áº¥u tháº§u tá»± Ä‘á»™ng dá»±a trÃªn má»©c Ä‘á»™ liÃªn quan (Relevance Score) vÃ  GiÃ¡ tháº§u. Äáº£m báº£o tráº£i nghiá»‡m ngÆ°á»i dÃ¹ng khÃ´ng bá»‹ "spam" quáº£ng cÃ¡o rÃ¡c, Ä‘á»“ng thá»i tá»‘i Æ°u hÃ³a ROAS cho nhá»¯ng NhÃ  bÃ¡n hÃ ng thá»±c lá»±c.</p>
 <div className="flex gap-4 pt-4">
 <button className="px-8 py-3 bg-white text-primary-900 font-bold rounded-lg text-sm hover:bg-slate-100 transition-all">PhÃ¢n tÃ­ch ROAS SÃ n</button>
 <button className="px-8 py-3 border border-primary-700 text-[#FAF9F5] font-bold rounded-lg text-sm hover:bg-primary-800 transition-all">Lá»‹ch sá»­ Äáº¥u tháº§u Vá»‹ trÃ­</button>
 </div>
 </div>
 <Megaphone className="absolute -bottom-10 -right-10 w-64 h-64 text-primary-800/30 -rotate-12" />
 </div>
 </div>
 );
}

