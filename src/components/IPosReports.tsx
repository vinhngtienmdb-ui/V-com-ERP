import React from 'react';
import { BarChart, Search, Gift, Copy, Calendar, MoreHorizontal } from 'lucide-react';

export function IPosPromotions({ activeStore }: { activeStore: any }) {
  return (
    <div className="flex-1 bg-stone-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-stone-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <Gift className="w-5 h-5 text-indigo-600" /> Chương trình Khuyến mại
          </h2>
          <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-indigo-600 text-white px-4 py-2 rounded-sm text-xs font-bold shadow-sm hover:bg-indigo-700 flex items-center gap-2">
             Tạo Khuyến mại
           </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
                <div key={i} className="bg-white border border-stone-200 rounded-sm shadow-sm p-6 group">
                   <div className="flex justify-between items-start mb-4">
                       <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded tracking-wider">Đang diễn ra</span>
                       <button className="text-stone-400 hover:text-stone-900"><MoreHorizontal className="w-4 h-4"/></button>
                   </div>
                   <h3 className="text-sm font-bold text-stone-900 mb-2">Giảm 10% Tối đa 50k - Chào hè {i}</h3>
                   <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded px-3 py-2 w-fit mb-4">
                       <span className="font-mono font-bold text-indigo-600 text-xs">SUMMER{i}</span>
                       <button className="text-stone-400 hover:text-indigo-600"><Copy className="w-3.5 h-3.5"/></button>
                   </div>
                   <div className="space-y-2 text-[11px] font-medium text-stone-500">
                       <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5"/> Hết hạn: 30/06/2026</p>
                       <p>Áp dụng: Chi nhánh hiện tại</p>
                       <p>Đã Dùng: <span className="font-bold text-stone-800">{i*15}/100</span> lượt</p>
                   </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
}

export function IPosReports({ activeStore }: { activeStore: any }) {
  return (
    <div className="flex-1 bg-stone-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-stone-200 px-6 py-4">
         <h2 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <BarChart className="w-5 h-5 text-indigo-600" /> Báo cáo Doanh thu & Vận hành
         </h2>
         <p className="text-xs font-bold text-stone-400 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto flex items-center justify-center">
         <div className="text-center space-y-4 max-w-md">
            <BarChart className="w-16 h-16 text-stone-300 mx-auto" />
            <h3 className="text-lg font-bold text-stone-900 text-center">Báo cáo Mở rộng</h3>
            <p className="text-sm text-stone-500 text-center">Các biểu đồ phân tích sâu về Sản phẩm, Ca làm việc, Khách hàng và Doanh thu theo giờ sẽ được tích hợp tại đây.</p>
            <button className="px-4 py-2 border border-indigo-600 text-indigo-600 font-bold text-xs rounded-sm hover:bg-indigo-50">
               Tải Xuất Báo Cáo Cũ
            </button>
         </div>
      </div>
    </div>
  );
}
