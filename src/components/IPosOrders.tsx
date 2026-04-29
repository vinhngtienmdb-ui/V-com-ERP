import React, { useState } from 'react';
import { ShoppingBag, Search, Filter, AlertCircle, FileText, Truck } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export function IPosOrders({ activeStore }: { activeStore: any }) {
  const [tab, setTab] = useState<'all' | 'pending' | 'shipping' | 'completed' | 'issues'>('all');
  
  return (
    <div className="col-span-12 flex-1 bg-stone-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-stone-200 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary-600" /> Quản lý Đơn hàng
              </h2>
              <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
            </div>
            <div className="flex gap-2">
               <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input type="text" placeholder="Tra mã đơn, SĐT khách..." className="pl-9 pr-4 py-2 bg-stone-100 border border-stone-200 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 w-64" />
               </div>
               <button className="bg-white border border-stone-200 text-stone-600 px-4 py-2 rounded-sm text-xs font-bold shadow-sm hover:bg-stone-50 flex items-center gap-2">
                 <Filter className="w-3.5 h-3.5" /> Lọc nâng cao
               </button>
            </div>
        </div>
        <div className="flex gap-4">
            {[
              { id: 'all', label: 'Tất cả đơn' },
              { id: 'pending', label: 'Chờ đóng gói/Bàn giao' },
              { id: 'shipping', label: 'Đang giao (COD)' },
              { id: 'completed', label: 'Hoàn thành' },
              { id: 'issues', label: 'Khiếu nại/Đơn trùng' },
              { id: 'history', label: 'Lịch sử Sửa/Xóa' }
            ].map(t => (
               <button key={t.id} onClick={() => setTab(t.id as any)} className={cn("pb-2 text-sm font-bold border-b-2 transition-colors", tab === t.id ? "border-primary-600 text-primary-600" : "border-transparent text-stone-400 hover:text-stone-600")}>
                  {t.label}
               </button>
            ))}
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
         <div className="bg-white border border-stone-200 rounded-sm shadow-sm overflow-hidden min-h-[400px]">
             {tab === 'issues' ? (
                <div className="p-8 text-center text-stone-500">
                   <AlertCircle className="w-12 h-12 text-rose-200 mx-auto mb-4" />
                   <h3 className="font-bold text-stone-800 text-lg mb-2">Đơn khiếu nại & Đơn trùng</h3>
                   <p className="text-sm">Hệ thống có thể phát hiện và cảnh báo các đơn trùng lặp dựa trên SĐT, Địa chỉ, và thời gian đặt hàng.</p>
                </div>
             ) : tab === 'history' ? (
                <div className="p-8 text-center text-stone-500">
                   <FileText className="w-12 h-12 text-stone-200 mx-auto mb-4" />
                   <h3 className="font-bold text-stone-800 text-lg mb-2">Lịch sử Chỉnh sửa / Xóa đơn</h3>
                   <p className="text-sm">Ghi nhận toàn bộ thao tác của nhân viên trên đơn hàng nhằm đối soát và kiểm toán.</p>
                </div>
             ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                   <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold">
                       <tr>
                           <th className="px-4 py-3">Mã KH/Nguồn</th>
                           <th className="px-4 py-3">Thông tin Đơn</th>
                           <th className="px-4 py-3">Trạng thái & Đối soát</th>
                           <th className="px-4 py-3 text-right">Tổng thanh toán</th>
                           <th className="px-4 py-3 text-center">Thao tác</th>
                       </tr>
                   </thead>
                   <tbody>
                       {[1,2,3,4,5].map(i => (
                           <tr key={i} className="border-b last:border-0 border-stone-100 hover:bg-stone-50 transition-colors">
                               <td className="px-4 py-4">
                                   <p className="font-bold text-stone-900">#ORD-00{i}</p>
                                   <p className="text-xs text-stone-500 mt-0.5">{i%2===0 ? 'Lazada' : 'ShopeeFood'}</p>
                               </td>
                               <td className="px-4 py-4">
                                   <p className="font-semibold text-stone-800">Khách hàng {i}</p>
                                   <p className="text-[10px] bg-stone-100 px-2 py-0.5 rounded w-fit mt-1">SĐT: 091234567{i}</p>
                               </td>
                               <td className="px-4 py-4">
                                   <div className="flex flex-col gap-1">
                                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider w-fit", i%3===0 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700")}>
                                          {i%3===0 ? 'Chờ lấy hàng' : 'Đã giao'}
                                      </span>
                                      <span className="text-[10px] font-bold text-stone-400">COD: Đã đối soát</span>
                                   </div>
                               </td>
                               <td className="px-4 py-4 text-right font-black text-primary-600">{formatCurrency(150000 * i)}</td>
                               <td className="px-4 py-4 text-center space-x-2">
                                   <button className="p-1.5 bg-stone-100 text-stone-500 rounded hover:bg-primary-50 hover:text-primary-600 transition-colors" title="In Biên bản Bàn Giao"><FileText className="w-4 h-4" /></button>
                                   <button className="p-1.5 bg-stone-100 text-stone-500 rounded hover:bg-primary-50 hover:text-primary-600 transition-colors" title="Đóng Gói & Chờ VC"><Truck className="w-4 h-4" /></button>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
             )}
         </div>
      </div>
    </div>
  );
}
