import React, { useState } from 'react';
import { Users, DollarSign, Calendar, Clock, CreditCard, ChevronDown } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export function IPosPayroll({ activeStore }: { activeStore: any }) {
  const [selectedMonth, setSelectedMonth] = useState('2024-05');
  
  return (
    <div className="flex-1 bg-stone-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" /> Bảng Lương Nhân Sự
          </h2>
          <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
        </div>
        <div className="flex gap-3">
           <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="px-4 py-2 bg-stone-100 border border-stone-200 rounded-sm text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-100" />
           <button className="bg-stone-900 text-white px-4 py-2 rounded-sm text-xs font-bold shadow-sm hover:bg-stone-800 flex items-center gap-2">
             Tính lương {selectedMonth}
           </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
             {[{ label: 'Tổng lương dự kiến', val: formatCurrency(125000000), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { label: 'Số nhân sự', val: '15', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
               { label: 'Ca làm thêm (OT)', val: '42 giờ', icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' }].map((stat, idx) => (
                 <div key={idx} className="bg-white border border-stone-200 rounded-sm p-6 flex flex-col gap-4 shadow-sm">
                     <div className={cn("w-10 h-10 rounded-sm flex items-center justify-center", stat.bg, stat.color)}>
                         <stat.icon className="w-5 h-5" />
                     </div>
                     <div>
                         <p className="text-xs font-bold text-stone-400 uppercase tracking-widest mb-1">{stat.label}</p>
                         <p className="text-2xl font-black text-stone-900">{stat.val}</p>
                     </div>
                 </div>
             ))}
         </div>
         
         <div className="bg-white border border-stone-200 rounded-sm shadow-sm p-6">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-stone-800 text-sm">Chi tiết bảng lương</h3>
                <button className="text-emerald-600 text-xs font-bold flex items-center gap-1 hover:underline">
                   <CreditCard className="w-3.5 h-3.5" /> Chi lương tài khoản
                </button>
             </div>
             <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-stone-50 border-y border-stone-200 text-stone-500 font-bold">
                    <tr>
                        <th className="px-4 py-3">Nhân viên</th>
                        <th className="px-4 py-3">Chức vụ</th>
                        <th className="px-4 py-3 text-right">Lương CB</th>
                        <th className="px-4 py-3 text-right">Thưởng/Phạt</th>
                        <th className="px-4 py-3 text-right">Tổng nhận</th>
                    </tr>
                </thead>
                <tbody>
                    {['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C'].map((name, i) => (
                        <tr key={i} className="border-b last:border-0 border-stone-100 hover:bg-stone-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-stone-900">{name}</td>
                            <td className="px-4 py-3 text-stone-500">{i===0 ? "Quản lý" : "Nhân viên Bán hàng"}</td>
                            <td className="px-4 py-3 text-right font-medium">{formatCurrency(i===0 ? 15000000 : 7000000)}</td>
                            <td className="px-4 py-3 text-right font-medium text-amber-600">+ {formatCurrency(i*500000)}</td>
                            <td className="px-4 py-3 text-right font-black text-emerald-600">{formatCurrency(i===0 ? 15000000 : 7000000 + i*500000)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
