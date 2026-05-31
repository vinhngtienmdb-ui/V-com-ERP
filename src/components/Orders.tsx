import { DraggableGrid } from './ui/DraggableGrid';
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
 PieChart as PieIcon,
 Sparkles
} from 'lucide-react';
import { TableVirtuoso } from 'react-virtuoso';
import { formatCurrency, cn } from '../lib/utils';
import { Order } from '../types/erp';
import { generateRMAResponse } from '../services/geminiService';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit, addDoc, serverTimestamp } from 'firebase/firestore';

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
 <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-sm animate-in zoom-in-95 duration-200">
 <div className="flex justify-between items-start mb-6">
 <div>
 <h2 className="text-2xl font-black text-[#111827]">Chi tiết đơn hàng {order.id}</h2>
 <p className="text-sm text-slate-600 font-medium">Đặt ngày: {order.date}</p>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-600">
 <X className="w-6 h-6" />
 </button>
 </div>

 <div className="grid grid-cols-2 gap-6 mb-8">
 <div className="space-y-2">
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Thông tin khách hàng</p>
 <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
 <User className="w-5 h-5 text-slate-500" />
 <span className="font-bold text-slate-900">{order.customerName}</span>
 </div>
 </div>
 <div className="space-y-2">
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phương thức thanh toán</p>
 <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
 <DollarSign className="w-5 h-5 text-slate-500" />
 <span className="font-bold text-slate-900">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
 </div>
 </div>
 </div>

 <div className="space-y-4 mb-8">
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Danh sách sản phẩm</p>
 <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
 {order.items && order.items.length > 0 ? (
 order.items.map((item: any, idx: number) => (
 <div key={idx} className="flex justify-between py-3 border-b last:border-0 border-slate-300 items-center">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-white rounded-md border border-slate-300 flex items-center justify-center">
 <Package className="w-5 h-5 text-slate-500" />
 </div>
 <span className="font-medium text-slate-800">{item.name}</span>
 </div>
 <span className="font-bold text-slate-900">{formatCurrency(item.price)}</span>
 </div>
 ))
 ) : (
 <p className="text-sm text-slate-600 italic pb-2">Chưa có thông tin sản phẩm.</p>
 )}
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lịch sử Vận chuyển</p>
 <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
 <div className="flex items-center gap-4 mb-4">
 <div className="p-2 bg-[#EAE7DF] text-orange-700 rounded-lg">
 <Truck className="w-6 h-6" />
 </div>
 <div>
 <p className="font-bold text-slate-900">{order.carrier || 'Chưa vận chuyển'}</p>
 <p className="font-mono text-xs text-orange-700">{order.tracking || 'N/A'}</p>
 </div>
 </div>
 
 <div className="relative pl-4 space-y-4 before:absolute before:inset-y-0 before:left-[7px] before:w-0.5 before:bg-slate-200">
 <div className="relative z-10 flex items-start gap-4">
 <div className="w-4 h-4 rounded-full bg-slate-800 border-4 border-stone-50 shrink-0 mt-0.5"></div>
 <div>
 <p className="text-sm font-bold text-slate-900">Đơn hàng được tạo</p>
 <p className="text-xs text-slate-600">{order.date}</p>
 </div>
 </div>
 {order.carrier && (
 <div className="relative z-10 flex items-start gap-4">
 <div className="w-4 h-4 rounded-full bg-slate-800 border-4 border-stone-50 shrink-0 mt-0.5"></div>
 <div>
 <p className="text-sm font-bold text-slate-900">Đã bàn giao cho ĐVVC</p>
 <p className="text-xs text-slate-600">Chờ cập nhật...</p>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hỗ trợ CSKH (AI)</p>
 <div className="p-4 rounded-lg bg-slate-100 border border-slate-300">
 <button onClick={() => handleDraftRma(order)} disabled={isGenerating} className="text-xs font-bold text-[#FAF9F5] bg-slate-900 hover:bg-slate-800 disabled:bg-blue-400 px-4 py-2.5 rounded-lg flex items-center gap-2 mb-3 shadow-sm transition-all w-full justify-center">
 <BrainCircuit className="w-4 h-4" /> {isGenerating ? 'AI Đang phân tích và tạo phản hồi...' : 'Tạo phản hồi RMA bằng AI'}
 </button>
 {aiResponse ? (
 <div className="bg-white p-3 rounded-lg border border-slate-300 shadow-sm text-sm text-slate-800 whitespace-pre-line leading-relaxed h-48 overflow-y-auto custom-scrollbar">
 {aiResponse}
 </div>
 ) : (
 <div className="bg-white/50 p-3 rounded-lg border border-slate-300 border-dashed text-sm text-slate-600 text-center flex flex-col items-center justify-center h-48">
 <BrainCircuit className="w-8 h-8 text-blue-300 mb-2 opacity-50" />
 Nhấp để tự động phân tích đơn hàng<br/>và sinh mẫu phản hồi CSKH.
 </div>
 )}
 </div>
 
 {/* Action buttons based on payment rules */}
 <div className="space-y-2 mt-4">
 {order.paymentMethod === 'cod' && order.status === 'delivered' && (
 <button className="w-full bg-emerald-500 text-[#FAF9F5] px-4 py-3 rounded-lg text-sm font-bold hover:bg-emerald-600 shadow-sm flex items-center justify-center gap-2">
 <DollarSign className="w-5 h-5" /> Xác nhận thực thu COD
 </button>
 )}
 {order.paymentMethod === 'cod' && order.status === 'processing' && (
 <button className="w-full bg-slate-100 text-slate-500 px-4 py-3 rounded-lg text-sm font-bold cursor-not-allowed flex items-center justify-center gap-2 border border-slate-300">
 <Clock className="w-5 h-5" /> Chờ giao để thu COD
 </button>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};
const MOCK_ORDERS: (Order & { carrier?: string, tracking?: string, shippingCost?: number })[] = [
 {
 id: 'ORD-2024-001',
 customerName: 'Nguyễn Văn A',
 date: '15/03/2024 14:30',
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
 date: '15/03/2024 15:00',
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
 date: '15/03/2024 16:15',
 total: 8500000,
 status: 'cancelled',
 paymentMethod: 'e_wallet',
 items: [],
 shippingCost: 0
 },
 {
 id: 'ORD-2024-006',
 customerName: 'Vũ Minh Tuấn',
 date: '15/03/2024 17:30',
 total: 4500000,
 status: 'shipped',
 paymentMethod: 'bank_transfer',
 items: [],
 carrier: 'ViettelPost',
 tracking: 'VT0987123',
 shippingCost: 45000
 },
 {
 id: 'ORD-DELAY-001',
 customerName: 'Lê Hoàng Minh',
 date: new Date(Date.now() - 30 * 60 * 60 * 1000).toLocaleString('vi-VN'), // 30 hours ago
 total: 3500000,
 status: 'pending',
 paymentMethod: 'bank_transfer',
 items: [],
 shippingCost: 0
 }
];

const isDelayed = (dateStr: string, status: string) => {
 if (status !== 'pending' && status !== 'processing') return false;
 try {
 // Attempt to handle both 'YYYY-MM-DD HH:mm' and 'toLocaleDateString' formats
 let orderDate: Date;
 if (dateStr.includes('/')) {
 // Assuming 'DD/MM/YYYY, HH:mm:ss' or similar from toLocaleString('vi-VN')
 const [datePart, timePart] = dateStr.split(', ');
 const [d, m, y] = datePart.split('/').map(Number);
 if (timePart) {
 const [h, min] = timePart.split(':').map(Number);
 orderDate = new Date(y, m - 1, d, h, min);
 } else {
 orderDate = new Date(y, m - 1, d);
 }
 } else {
 // Assuming 'YYYY-MM-DD HH:mm'
 orderDate = new Date(dateStr.replace(/-/g, '/'));
 }

 const diffMs = Date.now() - orderDate.getTime();
 return diffMs > 24 * 60 * 60 * 1000;
 } catch (e) {
 return false;
 }
};

const statusIcons = {
 pending: Clock,
 processing: Package,
 shipped: Truck,
 delivered: PackageCheck,
 cancelled: X,
 returning: RotateCcw
};

const statusStyles = {
 pending: "bg-[#FEF3C7] text-[#92400E]",
 processing: "bg-[#DBEAFE] text-[#1E40AF]",
 shipped: "bg-[#EAE7DF] text-blue-800",
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
 e_wallet: "Ví điện tử",
 cash: "Tiền mặt (Tại quầy)",
 qr: "Quét mã QR",
 pos: "Quẹt thẻ POS",
 loyalty: "Điểm thưởng"
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

 const addDemoOrders = async () => {
 // Note: status must be one of: 'pending', 'completed', 'cancelled', 'returned' according to firestore rules
 // paymentMethod must be 'cash', 'qr', 'pos', 'loyalty', 'loyalty_full', or null
 const demo = [
 {
 customerName: 'Nguyễn Văn A',
 total: 2500000,
 status: 'delivered',
 paymentMethod: 'cod',
 items: [{name: 'Bàn phím cơ', price: 2500000}],
 carrier: 'GHTK',
 tracking: 'GHTK123456789',
 shippingCost: 35000,
 source: 'erp'
 },
 {
 customerName: 'Trần Thị B',
 total: 1200000,
 status: 'pending',
 paymentMethod: 'bank_transfer',
 items: [{name: 'Chuột không dây', price: 1200000}],
 carrier: 'GHN',
 tracking: 'GHN987654321',
 shippingCost: 28000,
 source: 'erp'
 }
 ];

 const { getAuth } = await import('firebase/auth');
 const auth = getAuth();
 const currentUser = auth.currentUser;
 if (!currentUser) {
 alert("Bạn cần đăng nhập để thêm demo orders!");
 return;
 }

 for (const o of demo) {
 await addDoc(collection(db, 'orders'), {
 ...o,
 staffId: currentUser.uid,
 createdAt: serverTimestamp()
 });
 }
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Vận hành Đơn hàng & Logistics</h1>
 <p className="text-sm text-[#6B7280] mt-1">Điều phối giao vận, xử lý đổi trả (RMA) và quản lý cước phí thực tế.</p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={addDemoOrders}
 className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold text-[#4B5563] hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
 >
 <Sparkles className="w-4 h-4" />
 Mã giảm giá
 </button>
 <button className="bg-[#111827] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 + Tạo đơn mới
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all ring-2 ring-red-100">
 <div className="flex justify-between items-start mb-4">
 <span className="text-[10px] text-red-600 font-bold uppercase italic tracking-widest">Cảnh báo chậm trễ</span>
 <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
 </div>
 <div className="text-3xl font-black text-red-600">
 {allOrders.filter(o => isDelayed(o.date, o.status)).length}
 </div>
 <div className="mt-3 text-[10px] text-red-400 font-bold uppercase tracking-tight">Đơn {">"}24h chưa xử lý</div>
 </div>
 <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-4">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Cần đóng gói</span>
 <PackageCheck className="w-4 h-4 text-orange-600" />
 </div>
 <div className="text-3xl font-black text-[#111827]">42</div>
 <div className="mt-3 text-[10px] text-[#6B7280] font-bold uppercase tracking-tighter">12 đơn đóng muộn ({">"}24h)</div>
 </div>
 <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-4">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Đang vận chuyển</span>
 <Truck className="w-4 h-4 text-purple-500" />
 </div>
 <div className="text-3xl font-black text-[#111827]">156</div>
 <div className="mt-3 text-[10px] text-[#6B7280] font-bold uppercase tracking-tighter">Chủ yếu: GHTK (65%)</div>
 </div>
 <div className="bg-[#111827] p-6 rounded-xl shadow-sm shadow-slate-200 relative overflow-hidden group border border-slate-800">
 <div className="relative z-10 flex flex-col justify-between h-full text-[#FAF9F5]">
 <div className="flex justify-between items-start mb-4">
 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Yêu cầu Đổi trả (RMA)</span>
 <RotateCcw className="w-4 h-4 text-orange-400" />
 </div>
 <div>
 <div className="text-3xl font-black tracking-tighter">08</div>
 <p className="text-[10px] text-orange-400 font-bold mt-1 uppercase tracking-tighter">3 đơn cần xử lý gấp</p>
 </div>
 </div>
 <RotateCcw className="absolute -bottom-6 -right-6 w-24 h-24 text-[#FAF9F5]/5 group-hover:rotate-12 transition-transform duration-700" />
 </div>
 </DraggableGrid>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Tổng cước phí dự kiến</span>
 <DollarSign className="w-4 h-4 text-emerald-500" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">{formatCurrency(12450000)}</div>
 <div className="mt-1 text-[10px] text-[#10B981]">Tiết kiệm 8% với Hợp đồng sàn</div>
 </div>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Mã đơn, Mã Tracking, SĐT..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 
 {/* Filters */}
 <select 
 value={statusFilter}
 onChange={(e) => setStatusFilter(e.target.value)}
 className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-[#4B5563] appearance-none"
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
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-48"
 />
 </div>
 </div>
 
 <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white">
 <button 
 onClick={() => setActiveStep('all')}
 className={cn("px-4 py-2 text-xs font-semibold", activeStep === 'all' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-[#4B5563]")}
 >Tất cả</button>
 <button 
 onClick={() => setActiveStep('rma')}
 className={cn("px-4 py-2 text-xs font-semibold border-l border-slate-300", activeStep === 'rma' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-[#4B5563]")}
 >Phê duyệt Hoàn tiền/Trả hàng</button>
 </div>
 </div>

   <div className="bg-white border border-slate-300 shadow-sm rounded-xl overflow-hidden mt-4 h-[600px]">
  <TableVirtuoso
    data={filteredOrders}
    components={{
      Scroller: React.forwardRef((props, ref) => (<div {...props} ref={ref} className="overflow-auto custom-scrollbar" />)),
      Table: ({ style, ...props }) => <table {...props} className="w-full text-left border-collapse table-auto" style={style} />,
      TableHead: React.forwardRef((props, ref) => <thead {...props} ref={ref} className="bg-[#F9FAFB] border-b border-[#F3F4F6] sticky top-0 z-10 shadow-sm" />),
      TableRow: (props) => {
        const order = props.item;
        return (
          <tr 
            {...props} 
            className={cn(
              "bg-white hover:bg-slate-50 group hover:shadow-sm transition-all cursor-pointer relative border-l-4 border-transparent hover:border-l-indigo-600 border-b border-[#F3F4F6]",
              isDelayed(order?.date || '', order?.status || '') && "bg-red-50/30 border-l-red-500"
            )}
            onClick={() => setSelectedOrder(order)}
          />
        );
      }
    }}
    fixedHeaderContent={() => (
      <tr>
        <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest bg-[#F9FAFB]">Đơn hàng & Khách hàng</th>
        <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest bg-[#F9FAFB]">Giao nhận & Tracking</th>
        <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest bg-[#F9FAFB]">Cước phí</th>
        <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest bg-[#F9FAFB]">Thanh toán</th>
        <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center bg-[#F9FAFB]">Trạng thái</th>
        <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right bg-[#F9FAFB]">Thao tác</th>
      </tr>
    )}
    itemContent={(index, order) => (
      <>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[#111827] group-hover:text-orange-700 transition-colors">#{order.id.split('-').pop()}</p>
            {isDelayed(order.date, order.status) && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[8px] font-black uppercase rounded animate-bounce">Delayed</span>
            )}
          </div>
          <p className="text-[11px] text-[#6B7280] mt-0.5 font-medium">{order.customerName}</p>
          <p className="text-[10px] text-[#9CA3AF] mt-0.5">{order.date}</p>
        </td>
        <td className="px-6 py-4">
          {order.carrier ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1 bg-white p-2 rounded-lg border border-slate-200 shadow-sm w-full group-hover:border-orange-200 transition-colors">
                <span className="text-[10px] font-bold text-slate-800 uppercase">{order.carrier}</span>
                <span className="text-[10px] font-mono text-[#2563EB] font-bold">{order.tracking}</span>
              </div>
              <button 
                onClick={(e) => { e.stopPropagation(); }}
                className="text-[10px] text-orange-700 hover:bg-[#EAE7DF] px-2 py-1 rounded bg-slate-100 transition-all flex items-center gap-1 shrink-0"
              >
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
              "px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shadow-sm border border-transparent flex items-center gap-1.5",
              statusStyles[order.status as keyof typeof statusStyles] || "bg-slate-100 text-slate-700"
            )}>
              {React.createElement(statusIcons[order.status as keyof typeof statusIcons] || Package, { className: "w-3 h-3" })}
              {statusLabels[order.status as keyof typeof statusLabels] || order.status}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-all">
            <button 
              onClick={(e) => { e.stopPropagation(); }}
              className="p-2.5 bg-white border border-slate-300 shadow-sm hover:border-primary-500 hover:bg-primary-50 rounded-lg text-slate-500 hover:text-primary-600 transition-all active:scale-95"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </td>
      </>
    )}
  />
  </div>
  {selectedOrder && (
 <OrderDetailModal 
 order={selectedOrder} 
 onClose={() => setSelectedOrder(null)} 
 />
 )}

 <div className="bg-amber-50 rounded-lg p-6 border border-amber-100 flex items-start gap-4">
 <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
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
 </div>
  );
}