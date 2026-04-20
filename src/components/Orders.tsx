import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Truck,
  RotateCcw,
  PackageCheck,
  MapPin,
  ShieldAlert,
  DollarSign,
  Calendar,
  X,
  Package,
  User,
  Clock,
  Download,
  BrainCircuit,
  PieChart as PieIcon
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { Order } from '../types/erp';
import { generateRMAResponse } from '../services/geminiService';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

const OrderDetailModal = ({ order, onClose }: { order: any; onClose: () => void }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const handleDraftRma = async (order: any) => {
    setIsGenerating(true);
    try {
      const resp = await generateRMAResponse(order);
      setAiResponse(resp);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black text-[#111827]">Chi tiết đơn hàng {order.id}</h2>
            <p className="text-sm text-slate-500 font-medium">Đặt ngày: {order.date}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin khách hàng</p>
            <div className="flex items-center gap-3">
               <User className="w-5 h-5 text-slate-400" />
               <span className="font-bold text-slate-800">{order.customerName}</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phương thức thanh toán</p>
            <span className="font-bold text-slate-800">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Danh sách sản phẩm</p>
          <div className="bg-slate-50 rounded-lg p-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between py-2 border-b last:border-0 border-slate-200">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="font-bold text-slate-900">{formatCurrency(item.price)}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 italic">Chưa có thông tin sản phẩm.</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lịch sử Tracking</p>
          <div className="bg-slate-50 rounded-lg p-4 flex items-center gap-4">
            <Truck className="w-6 h-6 text-blue-600" />
            <div>
              <p className="font-bold text-slate-800">{order.carrier || 'Chưa vận chuyển'}</p>
              <p className="font-mono text-xs text-blue-600">{order.tracking || 'N/A'}</p>
            </div>
            {order.paymentMethod === 'cod' && order.status === 'delivered' && (
               <button className="ml-auto bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-emerald-600 shadow-sm flex items-center gap-1.5 focus:ring-2 ring-emerald-200">
                  <DollarSign className="w-4 h-4" /> Xác nhận thực thu COD
               </button>
            )}
            {order.paymentMethod === 'cod' && order.status === 'processing' && (
               <button className="ml-auto bg-slate-100 text-slate-400 px-4 py-2 rounded-lg text-xs font-bold cursor-not-allowed flex items-center gap-1.5 border border-slate-200">
                  <Clock className="w-3.5 h-3.5" /> Chờ giao để thu COD
               </button>
            )}
          </div>
          {(order.status === ('returning' as any) || order.status === 'returning') && (
            <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-100">
               <button onClick={() => handleDraftRma(order)} className="text-xs font-bold text-blue-700 flex items-center gap-2 mb-2">
                  <BrainCircuit className="w-4 h-4" /> {isGenerating ? 'Đang tạo...' : 'Tạo phản hồi RMA bằng AI'}
               </button>
               {aiResponse && <p className="text-xs text-blue-900 border-t pt-2 mt-2 whitespace-pre-line">{aiResponse}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
const MOCK_ORDERS: (Order & { carrier?: string, tracking?: string, shippingCost?: number })[] = [
  {
    id: 'ORD-2024-001',
    customerName: 'Nguyễn Văn A',
    date: '2024-03-15 14:30',
    total: 2500000,
    status: 'delivered',
    paymentMethod: 'cod',
    items: [],
    carrier: 'GHTK',
    tracking: 'GHTK123456789',
    shippingCost: 35000
  },
  {
    id: 'ORD-2024-002',
    customerName: 'Trần Thị B',
    date: '2024-03-15 15:00',
    total: 1200000,
    status: 'processing',
    paymentMethod: 'cod',
    items: [],
    carrier: 'GHN',
    tracking: 'GHN987654321',
    shippingCost: 28000
  },
  {
    id: 'ORD-2024-003',
    customerName: 'Lê Văn C',
    date: '2024-03-15 16:15',
    total: 8500000,
    status: 'cancelled',
    paymentMethod: 'e_wallet',
    items: [],
    shippingCost: 0
  },
  {
    id: 'ORD-2024-006',
    customerName: 'Vũ Minh Tuấn',
    date: '2024-03-15 17:30',
    total: 4500000,
    status: 'shipped',
    paymentMethod: 'bank_transfer',
    items: [],
    carrier: 'ViettelPost',
    tracking: 'VT0987123',
    shippingCost: 45000
  }
];

const statusStyles = {
  pending: "bg-[#FEF3C7] text-[#92400E]",
  processing: "bg-[#DBEAFE] text-[#1E40AF]",
  shipped: "bg-blue-100 text-blue-800",
  delivered: "bg-[#D1FAE5] text-[#065F46]",
  cancelled: "bg-[#FEE2E2] text-[#991B1B]",
  returning: "bg-purple-50 text-purple-700 border border-purple-100"
};

const statusLabels = {
  pending: "Chờ xác nhận",
  processing: "Đang đóng gói",
  shipped: "Đang giao hàng",
  delivered: "Đã hoàn tất",
  cancelled: "Đã hủy đơn",
  returning: "Đang đổi trả (RMA)"
};

const paymentMethodLabels: Record<string, string> = {
  cod: "Tiền mặt (COD)",
  bank_transfer: "Chuyển khoản",
  e_wallet: "Ví điện tử"
};

export function Orders() {
  const [activeStep, setActiveStep] = useState<'all' | 'rma'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateQuery, setDateQuery] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [dbOrders, setDbOrders] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          ...d,
          date: d.createdAt?.toDate ? d.createdAt.toDate().toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN')
        };
      });
      setDbOrders(data);
    });
    return () => unsub();
  }, []);

  const allOrders = useMemo(() => {
    return [...MOCK_ORDERS, ...dbOrders];
  }, [dbOrders]);

  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchesDate = !dateQuery || (order.date && order.date.includes(dateQuery));
      const matchesActiveStep = activeStep === 'all' || (activeStep === 'rma' && order.status === 'returning');
      return matchesStatus && matchesDate && matchesActiveStep;
    });
  }, [allOrders, activeStep, statusFilter, dateQuery]);

  const [aiResponse, setAiResponse] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDraftRma = async (order: any) => {
    setIsGenerating(true);
    try {
      const response = await generateRMAResponse(order);
      setAiResponse(response);
    } catch (e) {
      setAiResponse("Lỗi khi tạo phản hồi AI.");
    }
    setIsGenerating(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ... (Header and Stats Cards remain as is) */}
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Vận hành Đơn hàng & Logistics</h1>
          <p className="text-sm text-[#6B7280] mt-1">Điều phối giao vận, xử lý đổi trả (RMA) và quản lý cước phí thực tế.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <Truck className="w-4 h-4" />
            Đẩy đơn hàng loạt (GHTK/GHN)
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm">
            Tạo đơn thủ công
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">Cần đóng gói</span>
              <PackageCheck className="w-4 h-4 text-blue-500" />
           </div>
           <div className="text-2xl font-bold text-[#111827]">42</div>
           <div className="mt-1 text-[10px] text-[#6B7280]">12 đơn đóng muộn ({">"}24h)</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">Đang vận chuyển</span>
              <Truck className="w-4 h-4 text-purple-500" />
           </div>
           <div className="text-2xl font-bold text-[#111827]">156</div>
           <div className="mt-1 text-[10px] text-[#6B7280]">Chủ yếu: GHTK (65%)</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">Yêu cầu Đổi trả (RMA)</span>
              <RotateCcw className="w-4 h-4 text-orange-500" />
           </div>
           <div className="text-2xl font-bold text-[#111827]">08</div>
           <div className="mt-1 text-[10px] text-[#EF4444] font-medium">3 đơn cần xử lý gấp</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">Tổng cước phí dự kiến</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
           </div>
           <div className="text-2xl font-bold text-[#111827]">{formatCurrency(12450000)}</div>
           <div className="mt-1 text-[10px] text-[#10B981]">Tiết kiệm 8% với Hợp đồng sàn</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Mã đơn, Mã Tracking, SĐT..." 
                className="bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
              />
            </div>
            
            {/* Filters */}
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#4B5563] appearance-none"
            >
              <option value="all">Tất cả trạng thái</option>
              {Object.entries(statusLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text"
                value={dateQuery}
                onChange={(e) => setDateQuery(e.target.value)}
                placeholder="Ngày (YYYY-MM-DD)"
                className="bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-48"
              />
            </div>
          </div>
          
          <div className="flex border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
             <button 
                onClick={() => setActiveStep('all')}
                className={cn("px-4 py-2 text-xs font-semibold", activeStep === 'all' ? "bg-[#2563EB] text-white" : "text-[#4B5563]")}
             >Tất cả</button>
             <button 
                onClick={() => setActiveStep('rma')}
                className={cn("px-4 py-2 text-xs font-semibold border-l border-[#E5E7EB]", activeStep === 'rma' ? "bg-[#2563EB] text-white" : "text-[#4B5563]")}
             >Phê duyệt Hoàn tiền/Trả hàng</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Đơn hàng & Khách hàng</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Giao nhận & Tracking</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Cước phí</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Thanh toán</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className="hover:bg-[#F9FAFB] group transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-[#111827]">#{order.id.split('-').pop()}</p>
                    <p className="text-[11px] text-[#6B7280] mt-0.5">{order.customerName}</p>
                    <p className="text-[10px] text-[#9CA3AF] mt-0.5">{order.date}</p>
                  </td>
                  <td className="px-6 py-4">
                    {order.carrier ? (
                      <div className="flex items-center gap-3">
                         <div className="flex flex-col items-center gap-1 bg-white p-2 rounded-lg border border-slate-100 shadow-sm min-w-[80px]">
                            <span className="text-[10px] font-bold text-slate-700 uppercase">{order.carrier}</span>
                            <span className="text-[10px] font-mono text-[#2563EB] font-bold">{order.tracking}</span>
                         </div>
                        <button className="text-[10px] text-blue-600 hover:bg-blue-50 px-2 py-1 rounded bg-blue-50/50 flex items-center gap-1">
                           <MapPin className="w-3 h-3" /> Tra cứu
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#9CA3AF] italic">Chưa đẩy đơn</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                     <p className="text-sm font-semibold text-[#111827]">{formatCurrency(order.total)}</p>
                     <p className="text-[10px] text-[#6B7280]">Cước: {order.shippingCost ? formatCurrency(order.shippingCost) : '--'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-semibold text-[#111827]">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                       <span className={cn(
                         "px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap",
                         statusStyles[order.status]
                       )}>
                         {statusLabels[order.status]}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button className="p-2 hover:bg-[#F3F4F6] rounded-md text-[#6B7280] hover:text-[#2563EB] transition-all">
                          <MoreHorizontal className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {selectedOrder && (
        <OrderDetailModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}

      <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 flex items-start gap-4">
         <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
         </div>
         <div>
            <h4 className="text-sm font-bold text-amber-900">Tính năng Phê duyệt Đổi trả tự động</h4>
            <p className="text-xs text-amber-800 mt-1 max-w-2xl leading-relaxed">
              Dựa trên hình ảnh/video khiếu nại của người mua và kết quả từ đơn vị vận chuyển (tổng hợp từ sensor va đập hoặc khối lượng thay đổi), hệ thống sẽ đánh giá mức độ tin cậy để đề xuất Admin phê duyệt nhanh các đơn hàng RMA dưới 500k.
            </p>
         </div>
      </div>
    </div>
  );
}
