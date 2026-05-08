import { DraggableGrid } from './ui/DraggableGrid';
import React from 'react';
import { Users, Search, Plus, UserCircle2, Star, Download, Upload } from 'lucide-react';
import { cn } from '../lib/utils';
import { formatCurrency } from '../lib/utils';

export function IPosCustomers({ activeStore }: { activeStore: any }) {
  return (
    <div className="col-span-12 flex-1 bg-slate-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-slate-300 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" /> Quản lý Khách hàng
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
        </div>
        <div className="flex gap-2">
           <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input type="text" placeholder="Tìm tên, SĐT..." className="pl-9 pr-4 py-2 bg-slate-100 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 w-64" />
           </div>
           <button className="bg-primary-600 text-white px-4 py-2 rounded-sm text-xs font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2">
             <Plus className="w-3.5 h-3.5" /> Thêm KH
           </button>
           <button className="bg-slate-100 border border-slate-300 text-slate-700 px-3 py-2 rounded-sm text-xs font-bold shadow-sm hover:bg-slate-200 flex items-center gap-2">
             <Download className="w-3.5 h-3.5" /> Xuất
           </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
         <DraggableGrid className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6" columns={3} gap={24}>
             <div className="bg-white p-5 rounded-sm border border-slate-300 shadow-sm flex items-center gap-4">
                 <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center"><Users className="w-6 h-6" /></div>
                 <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tổng KH Chi Nhánh</p>
                    <p className="text-2xl font-black text-slate-900">1,248</p>
                 </div>
             </div>
             <div className="bg-white p-5 rounded-sm border border-slate-300 shadow-sm flex items-center gap-4">
                 <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center"><Star className="w-6 h-6" /></div>
                 <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">KH VIP (Tích cực)</p>
                    <p className="text-2xl font-black text-slate-900">42</p>
                 </div>
             </div>
         </DraggableGrid>

         <div className="bg-white border border-slate-300 rounded-sm shadow-sm overflow-hidden overflow-x-auto min-w-0">
             <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-300 text-slate-600 font-bold">
                    <tr>
                        <th className="px-4 py-3">Khách hàng</th>
                        <th className="px-4 py-3">Phân loại</th>
                        <th className="px-4 py-3 text-right">Tổng chi tiêu</th>
                        <th className="px-4 py-3 text-right">Số điểm</th>
                        <th className="px-4 py-3 text-center">Đồng bộ CRM</th>
                    </tr>
                </thead>
                <tbody>
                    {[1,2,3,4,5].map(i => (
                        <tr key={i} className="border-b last:border-0 border-slate-200 hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500"><UserCircle2 className="w-5 h-5"/></div>
                                <div>
                                    <p className="font-bold text-slate-900">Nguyễn Văn Khách {i}</p>
                                    <p className="text-xs text-slate-600 mt-0.5">090123456{i}</p>
                                </div>
                            </td>
                            <td className="px-4 py-4">
                                <span className={cn("px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider", i%2===0 ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-700")}>
                                    {i%2===0 ? 'VIP' : 'Thường'}
                                </span>
                            </td>
                            <td className="px-4 py-4 text-right font-medium text-slate-700">{formatCurrency(1500000 * i)}</td>
                            <td className="px-4 py-4 text-right font-black text-emerald-600">{100 * i}</td>
                            <td className="px-4 py-4 text-center">
                                <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Đã đồng bộ</span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}
