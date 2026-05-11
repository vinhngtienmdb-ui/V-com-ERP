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
 <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-slate-100 px-2 py-0.5 rounded">Intelligence Hub</span>
 <div className="w-1 h-1 bg-slate-900 rounded-full animate-pulse" />
 </div>
 <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900 tracking-tight">Business Intelligence</h1>
 <p className="text-sm text-slate-600 font-medium mt-1">Hệ thống phân tích chuyên sâu RFM, LTV, CAC và Giám sát gian lận thời gian thực.</p>
 </div>
 <div className="flex flex-wrap gap-3">
 <button className="bg-white border border-slate-300 px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm border-b-2 active:translate-y-0.5">
 <Download className="w-4 h-4 text-slate-500" />
 Xuất báo cáo (PDF/XLS)
 </button>
 <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5 flex items-center gap-2 hover:scale-[1.02] active:scale-95">
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
 stat.alert ? "bg-rose-50 border-rose-200 shadow-rose-200/20" : "bg-white border-slate-200 shadow-slate-200/50 hover:shadow-slate-900/5"
 )}>
 <div className="relative z-10 flex flex-col justify-between h-full">
 <div className="flex justify-between items-start mb-4">
 <span className={cn(
 "text-[10px] font-bold uppercase tracking-widest",
 stat.alert ? "text-rose-600" : "text-slate-500"
 )}>{stat.label}</span>
 <div className={cn(
 "p-2 rounded-xl border transition-transform group-hover:rotate-12",
 stat.alert ? "bg-rose-100 border-rose-200 text-rose-600 animate-pulse" : "bg-slate-50 border-slate-200 text-slate-500 group-hover:bg-slate-100 group-hover:text-blue-600"
 )}>
 <stat.icon className="w-4 h-4" />
 </div>
 </div>
 <div>
 <div className={cn("text-2xl font-bold tracking-tight mb-1", stat.alert ? "text-rose-700" : "text-slate-900")}>
 {typeof stat.value === 'number' && stat.label !== 'Gian lận (Cảnh báo)' ? formatCurrency(stat.value) : stat.value}
 </div>
 <div className="flex items-center gap-2">
 <span className={cn(
 "text-[10px] font-bold px-1.5 py-0.5 rounded",
 stat.color === 'emerald' || stat.trend.includes('+') ? "bg-emerald-100 text-emerald-700" : 
 stat.alert ? "bg-rose-200 text-rose-800" : "bg-[#EAE7DF] text-orange-800"
 )}>{stat.trend}</span>
 <span className="text-[10px] text-slate-500 font-medium">{stat.sub}</span>
 </div>
 </div>
 </div>
 {/* Decorative background circle */}
 <div className={cn(
 "absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20",
 stat.alert ? "bg-rose-500" : "bg-slate-800"
 )} />
 </div>
 ))}
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {/* RFM Chart */}
 <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
 <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
 <div>
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 <Users className="w-4 h-4 text-blue-500" /> Phân tích RFM (Recency/Frequency/Monetary)
 </h3>
 <p className="text-xs text-slate-500 mt-0.5">Phân vị khách hàng dựa trên lịch sử mua sắm</p>
 </div>
 <select className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-400 text-slate-700">
 <option>Theo lượt khách hàng</option>
 <option>Theo giá trị quy đổi</option>
 </select>
 </div>
 <div className="p-4 flex-1" style={{ minHeight: 280 }}>
 <ResponsiveContainer width="100%" height={260}>
 <BarChart data={RFM_DATA} layout="vertical" margin={{ left: 10, right: 20, top: 4, bottom: 4 }}>
 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
 <XAxis type="number" hide />
 <YAxis
 dataKey="group"
 type="category"
 width={155}
 axisLine={false}
 tickLine={false}
 tick={{ fontSize: 12, fontWeight: 600, fill: '#475569' }}
 />
 <Tooltip cursor={{ fill: '#F8FAFC' }} />
 <Bar dataKey="count" radius={4} barSize={24}>
 {RFM_DATA.map((_entry, index) => (
 <Cell
 key={`cell-${index}`}
 fill={index === 0 ? '#2563EB' : index === 1 ? '#3B82F6' : index === 2 ? '#6366F1' : '#94A3B8'}
 />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* AOV & CLV Chart */}
 <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
 <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 shrink-0">
 <div>
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-emerald-500" /> Xu hướng AOV & CLV (Predictive)
 </h3>
 <p className="text-xs text-slate-500 mt-0.5">Dự báo chuyển động tài chính trong 6 tháng tới</p>
 </div>
 <div className="flex gap-3 items-center">
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
 <span className="text-xs font-semibold text-slate-600">CLV</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
 <span className="text-xs font-semibold text-slate-600">AOV</span>
 </div>
 </div>
 </div>
 <div className="p-4 flex-1" style={{ minHeight: 280 }}>
 <ResponsiveContainer width="100%" height={260}>
 <AreaChart data={ANALYTICS_TRENDS} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
 <defs>
 <linearGradient id="colorCLV" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15}/>
 <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorAOV" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10B981" stopOpacity={0.15}/>
 <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
 <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#94A3B8' }} dy={8} />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }} />
 <Tooltip />
 <Area type="monotone" dataKey="clv" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCLV)" />
 <Area type="monotone" dataKey="aov" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAOV)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 {/* Fraud Detection Command Console */}
 <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
 {/* Header */}
 <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-rose-100 rounded-lg">
 <ShieldAlert className="w-5 h-5 text-rose-600" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Security Node</span>
 <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
 </div>
 <h3 className="text-sm font-bold text-slate-900">AI Fraud Detection Guardian</h3>
 </div>
 </div>
 <Radar className="w-5 h-5 text-slate-400" />
 </div>

 <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
 {/* Left: description + actions */}
 <div className="lg:col-span-2 space-y-4">
 <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-4">
 Phân tích hành vi chuỗi cung ứng và thanh toán đa điểm. Tự động gắn cờ cho các tài khoản có dấu hiệu Sybil Attack hoặc can thiệp tham số Voucher hệ thống.
 </p>
 <div className="flex flex-wrap gap-3">
 <button className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-slate-700 transition-all">
 Open Security Console
 </button>
 <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
 Configure AI Policy
 </button>
 </div>
 </div>

 {/* Right: Incident panel */}
 <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-bold text-rose-700 uppercase tracking-widest flex items-center gap-1.5">
 <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" /> Incident Detected
 </span>
 <span className="text-[10px] text-slate-500 font-mono">2 phút trước</span>
 </div>
 <p className="text-xs font-medium text-slate-700 leading-relaxed">
 Phát hiện 124 đơn hàng sử dụng Voucher SALE153 từ cùng cụm Fingerprint ID.
 </p>
 <div className="pt-2 border-t border-rose-200">
 <button className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
 Immediate Block & Void
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
