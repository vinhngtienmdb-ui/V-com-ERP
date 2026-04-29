import React from 'react';
import { 
 BarChart3, 
 TrendingUp, 
 Users, 
 ShieldAlert, 
 Zap, 
 PieChart, 
 ArrowUpRight, 
 ArrowDownRight, 
 Radar, 
 Filter, 
 Download,
 AlertCircle
} from 'lucide-react';
import { 
 AreaChart, 
 Area, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 ResponsiveContainer,
 BarChart,
 Bar,
 Cell,
 Legend
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';

const RFM_DATA = [
 { group: 'Khách hàng VIP', count: 120, value: 450000000 },
 { group: 'Đông đảo/Tiềm năng', count: 450, value: 850000000 },
 { group: 'Có nguy cơ rời bỏ', count: 180, value: 120000000 },
 { group: 'Dormant (Ngủ đông)', count: 320, value: 45000000 },
];

const ANALYTICS_TRENDS = [
 { month: 'T10', aov: 420, clv: 2400 },
 { month: 'T11', aov: 450, clv: 2600 },
 { month: 'T12', aov: 520, clv: 3000 },
 { month: 'T1', aov: 480, clv: 2800 },
 { month: 'T2', aov: 490, clv: 3100 },
 { month: 'T3', aov: 550, clv: 3500 },
];

export function AnalyticsBI() {
 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-700 pb-12">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700 bg-[#F2F0E9] px-2 py-0.5 rounded">Intelligence Hub</span>
 <div className="w-1 h-1 bg-stone-900 rounded-full animate-pulse" />
 </div>
 <h1 className="font-serif tracking-tight text-3xl font-black text-stone-900 tracking-tight">Business Intelligence</h1>
 <p className="text-sm text-stone-500 font-medium mt-1">Hệ thống phân tích chuyên sâu RFM, LTV, CAC và Giám sát gian lận thời gian thực.</p>
 </div>
 <div className="flex flex-wrap gap-3">
 <button className="bg-white border border-stone-200 px-5 py-2.5 rounded-none text-xs font-black uppercase tracking-widest hover:bg-stone-50 transition-all flex items-center gap-2 shadow-sm border-b-2 active:translate-y-0.5">
 <Download className="w-4 h-4 text-stone-400" />
 Xuất báo cáo (PDF/XLS)
 </button>
 <button className="bg-stone-900 text-[#FAF9F5] px-5 py-2.5 rounded-none text-xs font-black uppercase tracking-widest hover:bg-stone-800 transition-all shadow-sm shadow-stone-900/5 flex items-center gap-2 hover:scale-[1.02] active:scale-95">
 <Zap className="w-4 h-4" />
 Đồng bộ dữ liệu LTV
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {[
 { label: 'LTV (Giá trị vòng đời)', value: 3500000, trend: '+12%', sub: 'So với Q4/2023', icon: TrendingUp, color: 'blue' },
 { label: 'CAC (Chi phí thu hút)', value: 125000, trend: '-4.5%', sub: 'Tối ưu hóa Ads', icon: ArrowDownRight, color: 'emerald' },
 { label: 'AOV (Đơn hàng trung bình)', value: 550000, trend: '+8%', sub: 'Nhờ Bundle/Groupbuy', icon: ArrowUpRight, color: 'indigo' },
 { label: 'Gian lận (Cảnh báo)', value: 12, trend: 'Critical', sub: 'Cần xử lý ngay', icon: ShieldAlert, color: 'rose', alert: true },
 ].map((stat) => (
 <div key={stat.label} className={cn(
 "relative overflow-hidden p-6 rounded-none border transition-all duration-300 hover:shadow-sm group",
 stat.alert ? "bg-rose-50 border-rose-200 shadow-rose-200/20" : "bg-white border-stone-100 shadow-stone-200/50 hover:shadow-stone-900/5"
 )}>
 <div className="relative z-10 flex flex-col justify-between h-full">
 <div className="flex justify-between items-start mb-4">
 <span className={cn(
 "text-[10px] font-black uppercase tracking-widest",
 stat.alert ? "text-rose-600" : "text-stone-400"
 )}>{stat.label}</span>
 <div className={cn(
 "p-2 rounded-xl border transition-transform group-hover:rotate-12",
 stat.alert ? "bg-rose-100 border-rose-200 text-rose-600 animate-pulse" : "bg-stone-50 border-stone-100 text-stone-400 group-hover:bg-[#F2F0E9] group-hover:text-orange-700"
 )}>
 <stat.icon className="w-4 h-4" />
 </div>
 </div>
 <div>
 <div className={cn("text-2xl font-black tracking-tight mb-1", stat.alert ? "text-rose-700" : "text-stone-900")}>
 {typeof stat.value === 'number' && stat.label !== 'Gian lận (Cảnh báo)' ? formatCurrency(stat.value) : stat.value}
 </div>
 <div className="flex items-center gap-2">
 <span className={cn(
 "text-[10px] font-bold px-1.5 py-0.5 rounded",
 stat.color === 'emerald' || stat.trend.includes('+') ? "bg-emerald-100 text-emerald-700" : 
 stat.alert ? "bg-rose-200 text-rose-800" : "bg-[#EAE7DF] text-orange-800"
 )}>{stat.trend}</span>
 <span className="text-[10px] text-stone-400 font-medium">{stat.sub}</span>
 </div>
 </div>
 </div>
 {/* Decorative background circle */}
 <div className={cn(
 "absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20",
 stat.alert ? "bg-rose-500" : "bg-stone-800"
 )} />
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div className="bg-white p-8 rounded-none border border-stone-100 shadow-sm shadow-stone-200/40">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-lg font-black text-stone-900 flex items-center gap-3">
 <Users className="w-5 h-5 text-orange-700" /> Phân tích RFM (Recency/Frequency/Monetary)
 </h3>
 <p className="text-xs text-stone-400 font-medium mt-1">Phân vị khách hàng dựa trên lịch sử mua sắm</p>
 </div>
 <select className="text-[10px] font-bold uppercase tracking-widest bg-stone-50 border border-stone-200 rounded-none px-3 py-2 outline-none focus:ring-2 focus:ring-orange-600/20">
 <option>Theo lượt khách hàng</option>
 <option>Theo giá trị quy đổi</option>
 </select>
 </div>
 <div className="h-[320px]">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={RFM_DATA} layout="vertical" margin={{ left: 20 }}>
 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
 <XAxis type="number" hide />
 <YAxis 
 dataKey="group" 
 type="category" 
 width={140} 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
 />
 <Tooltip 
 cursor={{ fill: '#F8FAFC', radius: 4 }} 
 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} 
 />
 <Bar dataKey="count" radius={0} barSize={32}>
 {RFM_DATA.map((entry, index) => (
 <Cell 
 key={`cell-${index}`} 
 fill={index === 0 ? '#2563EB' : index === 1 ? '#3B82F6' : index === 2 ? '#6366F1' : '#94A3B8'} 
 className="hover:opacity-80 transition-opacity"
 />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="bg-white p-8 rounded-none border border-stone-100 shadow-sm shadow-stone-200/40">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-lg font-black text-stone-900 flex items-center gap-3">
 <TrendingUp className="w-5 h-5 text-emerald-600" /> Xu hướng AOV & CLV (Predictive)
 </h3>
 <p className="text-xs text-stone-400 font-medium mt-1">Dự báo chuyển động tài chính trong 6 tháng tới</p>
 </div>
 <div className="flex gap-4 p-1.5 bg-stone-50 rounded-xl">
 <div className="flex items-center gap-2 px-2">
 <div className="w-2 h-2 rounded-full bg-stone-900" />
 <span className="text-[10px] font-black uppercase text-stone-500">CLV</span>
 </div>
 <div className="flex items-center gap-2 px-2">
 <div className="w-2 h-2 rounded-full bg-emerald-500" />
 <span className="text-[10px] font-black uppercase text-stone-500">AOV</span>
 </div>
 </div>
 </div>
 <div className="h-[320px]">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={ANALYTICS_TRENDS}>
 <defs>
 <linearGradient id="colorCLV" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorAOV" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
 <XAxis 
 dataKey="month" 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }} 
 dy={10} 
 />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }} />
 <Tooltip 
 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} 
 />
 <Area type="monotone" dataKey="clv" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorCLV)" />
 <Area type="monotone" dataKey="aov" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAOV)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 {/* Fraud Detection Command Console */}
 <div className="bg-stone-900 text-[#FAF9F5] p-10 rounded-none relative overflow-hidden shadow-sm shadow-blue-900/20">
 <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
 <Radar className="w-80 h-80 rotate-12" />
 </div>
 
 <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
 <div className="lg:col-span-2 space-y-6">
 <div className="flex items-center gap-4">
 <div className="p-4 bg-rose-600 rounded-none shadow-sm shadow-rose-600/30 group hover:rotate-12 transition-transform duration-500">
 <ShieldAlert className="w-7 h-7 text-[#FAF9F5]" />
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Security Node</span>
 <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
 </div>
 <h3 className="text-2xl font-black tracking-tight">AI Fraud Detection Guardian</h3>
 </div>
 </div>
 
 <p className="text-stone-400 text-base font-medium leading-relaxed max-w-2xl bg-white/5 p-4 rounded-lg border border-white/5">
 Phân tích hành vi chuỗi cung ứng và thanh toán đa điểm. Tự động gắn cờ cho các tài khoản có dấu hiệu Sybil Attack hoặc can thiệp tham số Voucher hệ thống.
 </p>
 
 <div className="flex flex-wrap gap-4 pt-2">
 <button className="px-6 py-3 bg-white text-stone-900 font-black rounded-none text-[11px] uppercase tracking-widest hover:bg-stone-100 transition-all shadow-sm shadow-white/10 hover:-translate-y-0.5">
 Open Security Console
 </button>
 <button className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/10 text-[#FAF9F5] font-black rounded-none text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all">
 Configure AI Policy
 </button>
 </div>
 </div>

 <div className="space-y-4">
 <div className="p-6 bg-white/5 backdrop-blur-2xl rounded-none border border-white/10 space-y-4 shadow-sm">
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
 <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> Incident Detected
 </span>
 <span className="text-[10px] text-stone-500 font-bold font-mono">2 min ago</span>
 </div>
 <p className="text-xs font-bold text-stone-200 leading-relaxed italic">
 "Detecting 124 orders using Voucher SALE153 from same Fingerprint ID cluster."
 </p>
 <div className="pt-2 border-t border-white/5">
 <button className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-[#FAF9F5] rounded-none text-[10px] font-black uppercase tracking-widest transition-all border border-rose-500/30">
 Immediate Block & Void
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
