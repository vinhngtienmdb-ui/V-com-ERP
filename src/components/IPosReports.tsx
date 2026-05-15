import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useEffect } from 'react';
import { BarChart, Search, Gift, Copy, Calendar, MoreHorizontal } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { ordersRepo, type OrderInput } from '../services/repositories';
import { orderBy, where, limit } from 'firebase/firestore';

export function IPosPromotions({ activeStore }: { activeStore: any }) {
  return (
    <div className="col-span-12 flex-1 bg-slate-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-slate-300 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary-600" /> Chương trình Khuyến mại
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
        </div>
        <div className="flex gap-2">
           <button className="bg-primary-600 text-white px-4 py-2 rounded-sm text-xs font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2">
             Tạo Khuyến mại
           </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
                <div key={i} className="bg-white border border-slate-300 rounded-sm shadow-sm p-6 group">
                   <div className="flex justify-between items-start mb-4">
                       <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase rounded tracking-wider">Đang diễn ra</span>
                       <button className="text-slate-500 hover:text-slate-900"><MoreHorizontal className="w-4 h-4"/></button>
                   </div>
                   <h3 className="text-sm font-bold text-slate-900 mb-2">Giảm 10% Tối đa 50k - Chào hè {i}</h3>
                   <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded px-3 py-2 w-fit mb-4">
                       <span className="font-mono font-bold text-primary-600 text-xs">SUMMER{i}</span>
                       <button className="text-slate-500 hover:text-primary-600"><Copy className="w-3.5 h-3.5"/></button>
                   </div>
                   <div className="space-y-2 text-[11px] font-medium text-slate-600">
                       <p className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5"/> Hết hạn: 30/06/2026</p>
                       <p>Áp dụng: Chi nhánh hiện tại</p>
                       <p>Đã Dùng: <span className="font-bold text-slate-900">{i*15}/100</span> lượt</p>
                   </div>
                </div>
            ))}
         </div>
      </div>
    </div>
  );
}

export function IPosReports({ activeStore }: { activeStore: any }) {
  const [orders, setOrders] = useState<OrderInput[]>([]);
  useEffect(() => {
    if (!activeStore?.id) return;
    const unsub = ordersRepo.subscribe(
      [where('storeId', '==', activeStore.id), orderBy('createdAt', 'desc'), limit(200)],
      setOrders,
    );
    return () => unsub();
  }, [activeStore?.id]);

  // Tổng hợp doanh thu hôm nay (timezone Asia/Ho_Chi_Minh đơn giản hóa)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => {
    const d = (o as any).createdAt?.toDate?.()?.toISOString?.()?.split('T')[0];
    return d === todayStr && (o.status === 'delivered' || o.status === 'completed');
  });
  const todayGmv = todayOrders.reduce((s, o) => s + (o.total ?? 0), 0);
  const todayOrderCount = todayOrders.length;
  const avgOrderValue = todayOrderCount > 0 ? Math.round(todayGmv / todayOrderCount) : 0;

  return (
    <div className="col-span-12 flex-1 bg-slate-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-slate-300 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
               <BarChart className="w-5 h-5 text-primary-600" /> Báo cáo Doanh thu & Vận hành
            </h2>
            <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{activeStore?.name}</p>
         </div>
         <div className="flex gap-2">
            <select className="bg-slate-100 border border-slate-300 text-slate-700 px-3 py-2 rounded-sm text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary-100">
                <option>Hôm nay</option>
                <option>Tuần này</option>
                <option>Tháng này</option>
            </select>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-sm text-xs font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2">
               Xuất Báo Cáo Mở Rộng
            </button>
         </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[{ label: 'Doanh thu thuần', val: formatCurrency(25000000), trend: '+15%' },
              { label: 'Số đơn hàng', val: '124', trend: '+5%' },
              { label: 'Giá trị TB / Đơn', val: formatCurrency(201000), trend: '+2%' },
              { label: 'Lợi nhuận gộp', val: formatCurrency(9500000), trend: '+18%' }].map((stat, i) => (
                <div key={i} className="bg-white border border-slate-300 rounded-sm shadow-sm p-5">
                   <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                   <div className="flex items-end justify-between">
                       <p className="text-2xl font-black text-slate-900">{stat.val}</p>
                       <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{stat.trend}</span>
                   </div>
                </div>
            ))}
         </div>
         <DraggableGrid className="grid grid-cols-1 lg:grid-cols-2 gap-6" columns={2} gap={24}>
             <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-6 min-h-[300px] flex items-center justify-center">
                <div className="text-center text-slate-500">
                   <BarChart className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                   <p className="text-sm font-bold text-slate-700">Biểu đồ doanh thu theo giờ</p>
                   <p className="text-xs">Đang tải biểu đồ Tùy chỉnh chi nhánh...</p>
                </div>
             </div>
             <div className="bg-white border border-slate-300 rounded-sm shadow-sm p-6 min-h-[300px] flex items-center justify-center">
                <div className="text-center text-slate-500">
                   <BarChart className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                   <p className="text-sm font-bold text-slate-700">Top 10 sản phẩm bán chạy</p>
                   <p className="text-xs">Đang phân tích dữ liệu...</p>
                </div>
             </div>
         </DraggableGrid>
      </div>
    </div>
  );
}

