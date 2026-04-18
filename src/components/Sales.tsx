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
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { SalesRep } from '../types/erp';

const MOCK_SALES: SalesRep[] = [
  { id: 'SAL-001', name: 'Lê Văn Tám', tier: 'lead', target: 5000000000, achieved: 4200000000, commissionRate: 2.5, salesCount: 124 },
  { id: 'SAL-002', name: 'Trần Thị Thu', tier: 'senior', target: 3000000000, achieved: 3250000000, commissionRate: 1.8, salesCount: 88 },
  { id: 'SAL-003', name: 'Nguyễn Minh Anh', tier: 'junior', target: 1000000000, achieved: 850000000, commissionRate: 1.2, salesCount: 42 },
];

export function SalesManagement() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Quản lý Đội ngũ Kinh doanh</h1>
          <p className="text-sm text-[#6B7280] mt-1">Cấp bậc, hoa hồng và theo dõi hiệu suất thực tế của đội ngũ Sales sàn.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Cấu hình chính sách hoa hồng
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm">
            Thêm nhân sự mới
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Tổng doanh số tháng 03</p>
           <div className="text-2xl font-bold text-[#111827]">{formatCurrency(8300000000)}</div>
           <p className="text-[10px] text-[#10B981] font-medium mt-1">Hoàn thành 92% kế hoạch</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Tổng hoa hồng chi trả</p>
           <div className="text-2xl font-bold text-[#2563EB]">{formatCurrency(124500000)}</div>
           <p className="text-[10px] text-[#6B7280] mt-1">Tỷ lệ trung bình: 1.5%</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Người dẫn đầu (Champion)</p>
           <div className="text-lg font-bold text-[#111827] truncate mt-1">Trần Thị Thu</div>
           <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#10B981] font-bold">
              <Crown className="w-3.5 h-3.5 fill-current" /> 108% Target
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Active Sales Rep</p>
           <div className="text-2xl font-bold text-[#111827]">24/25</div>
           <p className="text-[10px] text-[#6B7280] mt-1">Đang hoạt động tại thực địa</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
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
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
               <Trophy className="w-6 h-6" />
            </div>
            <div>
               <h4 className="font-bold text-lg italic">Sales Gamification Engine</h4>
               <p className="text-slate-400 text-sm">Hệ thống vinh danh Sales có thành tích tốt nhất trong ngày. Tự động tính thưởng nóng "Hổ báo" cho các hợp đồng Seller có GMV trên 100tr.</p>
            </div>
         </div>
         <button className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20">Mở Dashboard Thi đua</button>
      </div>
    </div>
  );
}
