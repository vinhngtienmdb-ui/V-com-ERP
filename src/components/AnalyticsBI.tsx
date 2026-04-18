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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Business Intelligence (BI)</h1>
          <p className="text-sm text-[#6B7280] mt-1">Hệ thống báo cáo phân tích chuyên sâu RFM, LTV, CAC và phát hiện gian lận.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <Download className="w-4 h-4" />
            Xuất báo cáo định kỳ
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Recalculate LTV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">LTV (Customer Lifetime Value)</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
           </div>
           <div className="text-2xl font-bold text-[#111827]">{formatCurrency(3500000)}</div>
           <div className="mt-1 text-[10px] text-[#10B981] font-medium">+12% so với Q4/2023</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">CAC (Customer Acquisition Cost)</span>
              <ArrowDownRight className="w-4 h-4 text-emerald-500" />
           </div>
           <div className="text-2xl font-bold text-[#111827]">{formatCurrency(125000)}</div>
           <div className="mt-1 text-[10px] text-[#10B981] font-medium">-4.5% (Tối ưu hóa ads)</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">AOV (Average Order Value)</span>
              <ArrowUpRight className="w-4 h-4 text-[#2563EB]" />
           </div>
           <div className="text-2xl font-bold text-[#111827]">{formatCurrency(550000)}</div>
           <div className="mt-1 text-[10px] text-[#2563EB] font-medium">+8% nhờ Bundle/Groupbuy</div>
        </div>
        <div className="bg-[#FEF2F2] p-5 rounded-xl border border-[#FEE2E2] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#991B1B] font-bold uppercase">Fraud Alerts (Cảnh báo gian lận)</span>
              <ShieldAlert className="w-4 h-4 text-[#EF4444] animate-pulse" />
           </div>
           <div className="text-2xl font-bold text-[#991B1B]">12</div>
           <div className="mt-1 text-[10px] text-[#EF4444] font-medium">Phát hiện buff đơn/voucher</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-[#111827] flex items-center gap-2">
                 <Users className="w-5 h-5 text-blue-600" /> Phân tích RFM (Customer Cohort)
              </h3>
              <select className="text-xs bg-slate-50 border border-[#E5E7EB] rounded-lg px-2 py-1 outline-none">
                 <option>Lượt khách hàng</option>
                 <option>Giá trị quy đổi</option>
              </select>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={RFM_DATA} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                    <XAxis type="number" hide />
                    <YAxis dataKey="group" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#6B7280' }} />
                    <Tooltip cursor={{ fill: '#F9FAFB' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                       {RFM_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#2563EB' : index === 1 ? '#3B82F6' : index === 2 ? '#F59E0B' : '#9CA3AF'} />
                       ))}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
           <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-[#111827] flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-[#10B981]" /> Xu hướng AOV & CLV (Dynamic Forecast)
              </h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                    <span className="text-[10px] text-[#6B7280]">CLV (k)</span>
                 </div>
                 <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                    <span className="text-[10px] text-[#6B7280]">AOV (k)</span>
                 </div>
              </div>
           </div>
           <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={ANALYTICS_TRENDS}>
                    <defs>
                       <linearGradient id="colorCLV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorAOV" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="clv" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorCLV)" />
                    <Area type="monotone" dataKey="aov" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorAOV)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>

      <div className="bg-[#111827] text-white p-8 rounded-xl relative overflow-hidden">
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-500 rounded-lg shadow-lg shadow-red-500/20">
                     <ShieldAlert className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">Fraud Detection System (AI Enhanced)</h3>
               </div>
               <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
                  Hệ thống phân tích hành vi đơn hàng theo thời gian thực. Tự động gắn cờ đỏ (flag) cho các tài khoản có dấu hiệu buff đơn ảo (sybil attack) hoặc spam voucher quy mô lớn từ một dải IP.
               </p>
               <div className="flex gap-4 pt-4">
                  <button className="px-6 py-2.5 bg-white text-[#111827] font-bold rounded-xl text-xs hover:bg-slate-100 transition-all">Xem bảng tin Fraud</button>
                  <button className="px-6 py-2.5 border border-slate-700 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition-all">Cấu hình Rule AI</button>
               </div>
            </div>
            <div className="space-y-4">
               <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 space-y-3">
                  <div className="flex justify-between items-center">
                     <span className="text-xs font-bold text-red-400 flex items-center gap-1.5 font-mono">
                        <AlertCircle className="w-3.5 h-3.5" /> High Severity
                     </span>
                     <span className="text-[10px] text-slate-500 italic">2 phút trước</span>
                  </div>
                  <p className="text-xs font-medium text-slate-200">Phát hiện 124 đơn hàng cùng sử dụng mã voucher SALE153 từ 8 tài khoản có cùng Fingerprint ID.</p>
                  <div className="flex justify-end">
                     <button className="text-[10px] font-bold text-red-400 hover:underline">Hủy đơn & Khóa ví ngay</button>
                  </div>
               </div>
            </div>
         </div>
         <Radar className="absolute -top-12 -right-12 w-64 h-64 text-slate-800/20" />
      </div>
    </div>
  );
}
