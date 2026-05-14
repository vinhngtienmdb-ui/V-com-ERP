import { DraggableGrid } from './ui/DraggableGrid';
import { useState, useEffect } from 'react';
import { 
 Users, Building2, Settings, BarChart2, FileSignature, GitBranch, 
 ArrowLeft, Search, Filter, Warehouse, Package, FileInput, FileOutput, ClipboardList,
 Phone, Mail, Percent, Globe, Plus, MoreVertical, Receipt, ArrowRight, CheckCircle2, AlertCircle, XCircle, DollarSign,
 Truck, MapPin, Navigation, ListTodo, Clock, Sparkles, Zap, TrendingUp, LayoutGrid, Timer
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useStore } from '../context/StoreContext';

const WAREHOUSE_MODULE_GROUPS = [
 {
 title: 'Nhập/xuất kho',
 items: [
 { id: 'wh_in_out', label: 'Phiếu kho', desc: 'Nhập kho, xuất kho, điều chuyển.', icon: FileInput, color: 'blue' },
 { id: 'wh_req_purchase', label: 'Phiếu đề xuất mua hàng', desc: 'Đề xuất hàng thiếu.', icon: GitBranch, color: 'indigo' },
 { id: 'wh_inventory', label: 'Kiểm kê kho', desc: 'Thực hiện kiểm kê định kỳ.', icon: ClipboardList, color: 'emerald' },
 ]
 },
 {
 title: 'Vận hành & Tối ưu AI',
 items: [
 { id: 'wh_ff_orders', label: 'Quản lý vận chuyển', desc: 'Theo dõi đơn hàng đang giao.', icon: ListTodo, color: 'indigo' },
 { id: 'wh_ff_predict', label: 'Dự báo nhu cầu AI', desc: 'Dự báo hàng tồn cần nhập.', icon: Sparkles, color: 'purple' },
 { id: 'wh_ff_heatmap', label: 'Bản đồ nhiệt kho', desc: 'Tối ưu hóa vị trí lưu kho.', icon: Zap, color: 'orange' },
 { id: 'wh_ff_tracking', label: 'Theo dõi lộ trình', desc: 'Real-time tracking vận chuyển.', icon: Navigation, color: 'blue' },
 ]
 },
 {
 title: 'Báo cáo',
 items: [
 { id: 'wh_stock', label: 'Tồn kho', desc: 'Danh sách tồn kho hiện tại.', icon: Package, color: 'orange' },
 { id: 'wh_in_out_report', label: 'Báo cáo nhập xuất tồn', desc: 'Thống kê luân chuyển.', icon: BarChart2, color: 'purple' },
 ]
 },
 {
 title: 'Thiết lập và danh mục',
 items: [
 { id: 'wh_cat', label: 'Danh mục hàng hóa', desc: 'Phân loại hàng hóa.', icon: FileSignature, color: 'rose' },
 { id: 'wh_items', label: 'Danh sách hàng hóa', desc: 'Quản lý mã hàng, SKU.', icon: Package, color: 'fuchsia' },
 { id: 'wh_list', label: 'Danh sách kho', desc: 'Quản lý các vị trí kho.', icon: Warehouse, color: 'blue' },
 { id: 'wh_partners', label: 'Danh sách đối tác', desc: 'Đối tác kho vận.', icon: Users, color: 'slate' },
 { id: 'wh_settings', label: 'Thiết lập kho', desc: 'Config quy tắc kho.', icon: Settings, color: 'slate' }
 ]
 }
];

const LOGISTICS_PARTNERS = [
 { 
 id: 'LP001', 
 name: 'Giao Hàng Nhanh (GHN)', 
 contact: '1900 636683', 
 email: 'cskh@ghn.vn', 
 policy: 'Chiết khấu 10% cho đơn trên 100tr/tháng', 
 status: 'Active',
 website: 'ghn.vn',
 coverage: 'Toàn quốc'
 },
 { 
 id: 'LP002', 
 name: 'Viettel Post', 
 contact: '1900 8095', 
 email: 'support@viettelpost.com.vn', 
 policy: 'Đồng giá 22k nội tỉnh', 
 status: 'Active',
 website: 'viettelpost.com.vn',
 coverage: 'Toàn quốc'
 },
 { 
 id: 'LP003', 
 name: 'Ninja Van', 
 contact: '1900 888685', 
 email: 'support_vn@ninjavan.co', 
 policy: 'Giảm 15% cho shop mới', 
 status: 'Maintenance',
 website: 'ninjavan.co',
 coverage: 'Toàn quốc'
 }
];

const LOGISTICS_FEES: Record<string, any[]> = {
 // ... existing fees
};

const MOCK_SHIPMENTS = [
 { id: 'SHIP-001', orderId: 'ORD-5521', partner: 'GHN', status: 'In Transit', driver: 'Nguyễn Văn Nam', eta: '15:30 Today' },
 { id: 'SHIP-002', orderId: 'ORD-5525', partner: 'Viettel Post', status: 'Delivered', driver: 'Trần Văn Tú', eta: 'Success' },
 { id: 'SHIP-003', orderId: 'ORD-5528', partner: 'Ninja Van', status: 'Chờ xử lý', driver: 'Chưa điều phối', eta: 'Ngày mai' },
];

function getColorClasses(color: string) {
 switch (color) {
 case 'blue': return 'bg-slate-100 text-orange-700';
 case 'orange': return 'bg-orange-50 text-orange-600';
 case 'indigo': return 'bg-primary-50 text-primary-600';
 case 'purple': return 'bg-purple-50 text-purple-600';
 case 'emerald': return 'bg-emerald-50 text-emerald-600';
 case 'fuchsia': return 'bg-fuchsia-50 text-fuchsia-600';
 case 'rose': return 'bg-rose-50 text-rose-600';
 case 'slate':
 default: return 'bg-slate-50 text-slate-700';
 }
}

export function WarehouseModule() {
 const { activeStore } = useStore();
 const [activeTab, setActiveTab] = useState<string>('overview');
 const [selectedPartnerForFees, setSelectedPartnerForFees] = useState<string | null>(null);
 const [stockItems, setStockItems] = useState<any[]>([]);

 useEffect(() => {
 if (!activeStore) return;
 const q = query(
 collection(db, 'warehouse_stock'),
 where('storeId', '==', activeStore.id)
 );
 const unsub = onSnapshot(q, (snap) => {
 setStockItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
 });
 return () => unsub();
 }, [activeStore]);

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-1">
 {activeTab !== 'overview' && (
 <button onClick={() => setActiveTab('overview')} className="p-1 hover:bg-slate-100 rounded-md transition-colors mr-1">
 <ArrowLeft className="w-4 h-4 text-slate-600" />
 </button>
 )}
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Quản trị Kho vận</h1>
 </div>
 <p className="text-sm text-[#6B7280]">Quản lý nhập xuất kho, kiểm kê và vận hành Fulfillment.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Filter className="w-4 h-4" /> Bản đồ kho
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" /> Tạo phiếu kho
 </button>
 </div>
 </div>

 {activeTab === 'overview' && (
 <div className="space-y-8">
 {/* Stats Cards */}
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={16}>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Giá trị tồn kho</span>
 <DollarSign className="w-4 h-4 text-emerald-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{formatCurrency(4850000000)}</span>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">+5.2%</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Đơn Fulfillment</span>
 <Truck className="w-4 h-4 text-orange-700" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">1,248</span>
 <span className="text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded">85 Đang giao</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Hàng sắp hết (Alt)</span>
 <AlertCircle className="w-4 h-4 text-orange-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">42 SKUs</span>
 <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">Cần nhập</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Uptime Kho vận</span>
 <Clock className="w-4 h-4 text-primary-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">99.8%</span>
 <span className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded">Realtime</span>
 </div>
 </div>
 </DraggableGrid>

 {/* Matrix Grid Layout */}
 <div className="space-y-6">
 {WAREHOUSE_MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx} className="space-y-4">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
 <span className="w-1 h-4 bg-[#2563EB] rounded-full inline-block" />
 {group.title}
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
 {group.items.map((mod) => (
 <div 
 key={mod.id}
 onClick={() => setActiveTab(mod.id as any)}
 className="group bg-white p-5 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm hover:border-[#2563EB]/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
 <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
 </div>
 <div className={cn("w-12 h-12 rounded relative z-10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-[#FAF9F5] transition-all shadow-sm", getColorClasses(mod.color))}>
 <mod.icon className="w-6 h-6" />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-[#111827] text-sm mb-1.5 group-hover:text-[#2563EB] transition-colors">{mod.label}</h3>
 <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">{mod.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'wh_partners' && (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
 <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
 <button 
 onClick={() => setActiveTab('overview')} 
 className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm"
 >
 <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
 </button>
 <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
 <Plus className="w-4 h-4" /> Thêm đơn vị vận chuyển
 </button>
 </div>
 
 {!selectedPartnerForFees && (
 <div className="p-8">
 <div className="flex justify-between items-center mb-8">
 <div className="relative w-96">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input type="text" placeholder="Tìm kiếm đơn vị vận chuyển..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-900" />
 </div>
 <button className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg">
 <Filter className="w-4 h-4" /> Lọc
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
 {LOGISTICS_PARTNERS.map(partner => (
 <div key={partner.id} className="bg-white border border-slate-300 rounded-lg p-6 hover:shadow-sm transition-all group">
 <div className="flex justify-between items-start mb-4">
 <div className="w-12 h-12 bg-slate-100 text-orange-700 rounded-lg flex items-center justify-center">
 <Warehouse className="w-6 h-6" />
 </div>
 <button className="text-slate-500 hover:text-slate-700">
 <MoreVertical className="w-5 h-5" />
 </button>
 </div>
 <h3 className="text-lg font-bold text-slate-900 mb-1">{partner.name}</h3>
 <p className="text-xs text-slate-600 mb-4">{partner.id} • {partner.coverage}</p>
 
 <div className="space-y-3 mb-6">
 <div className="flex items-center gap-3 text-xs text-slate-700">
 <Phone className="w-3.5 h-3.5 text-slate-500" /> {partner.contact}
 </div>
 <div className="flex items-center gap-3 text-xs text-slate-700">
 <Mail className="w-3.5 h-3.5 text-slate-500" /> {partner.email}
 </div>
 <div className="flex items-center gap-3 text-xs text-slate-700">
 <Globe className="w-3.5 h-3.5 text-slate-500" /> {partner.website}
 </div>
 </div>

 <div className="bg-slate-100 border border-slate-300 rounded-lg p-4">
 <div className="flex items-center gap-2 mb-1">
 <Percent className="w-3.5 h-3.5 text-orange-700" />
 <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Chính sách chiết khấu</span>
 </div>
 <p className="text-xs text-slate-800 leading-relaxed font-medium">
 {partner.policy}
 </p>
 </div>

 <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-200">
 <span className={cn(
 "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
 partner.status === 'Active' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
 )}>
 {partner.status}
 </span>
 <div className="flex gap-2">
 <button 
 onClick={() => setSelectedPartnerForFees(partner.id)}
 className="text-xs font-bold text-orange-700 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
 >
 <Receipt className="w-3.5 h-3.5" /> Biểu phí
 </button>
 <button className="text-xs font-bold text-slate-600 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors">API</button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {selectedPartnerForFees && (
 <div className="p-8 animate-in fade-in slide-in- duration-300">
 <div className="flex items-center justify-between mb-8">
 <button 
 onClick={() => setSelectedPartnerForFees(null)}
 className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors"
 >
 <ArrowLeft className="w-4 h-4" /> Danh sách đối tác
 </button>
 <div className="flex items-center gap-3">
 <h3 className="text-lg font-bold text-slate-900">
 Biểu phí dịch vụ: {LOGISTICS_PARTNERS.find(p => p.id === selectedPartnerForFees)?.name}
 </h3>
 <span className="text-[10px] bg-[#EAE7DF] text-orange-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
 {selectedPartnerForFees}
 </span>
 </div>
 <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
 <Plus className="w-4 h-4" /> Thêm khoản phí mới
 </button>
 </div>

 <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
 <div className="overflow-x-auto min-w-0">
<table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-300">
 <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên khoản phí</th>
 <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Loại phí</th>
 <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Giá trị</th>
 <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Trạng thái</th>
 <th className="px-3 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {LOGISTICS_FEES[selectedPartnerForFees]?.map(fee => (
 <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors group">
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center group-hover:bg-slate-100 group-hover:text-orange-700 transition-colors">
 <DollarSign className="w-4 h-4" />
 </div>
 <span className="text-sm font-bold text-slate-900">{fee.name}</span>
 </div>
 </td>
 <td className="px-3 py-2.5">
 <span className="text-xs font-medium text-slate-600">{fee.type}</span>
 </td>
 <td className="px-3 py-2.5">
 <span className="text-sm font-black text-orange-700">{fee.value}</span>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 {fee.status === 'Active' ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
 ) : (
 <XCircle className="w-4 h-4 text-rose-500" />
 )}
 <span className={cn(
 "text-[10px] font-bold uppercase tracking-wider",
 fee.status === 'Active' ? "text-emerald-600" : "text-rose-600"
 )}>
 {fee.status}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <button className="text-slate-500 hover:text-orange-700 transition-colors">
 <MoreVertical className="w-5 h-5" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 {(!LOGISTICS_FEES[selectedPartnerForFees] || LOGISTICS_FEES[selectedPartnerForFees].length === 0) && (
 <div className="py-20 flex flex-col items-center justify-center text-center opacity-50">
 <Receipt className="w-12 h-12 mb-4 text-slate-500" />
 <p className="text-sm font-medium text-slate-600">Chưa có dữ liệu biểu phí cho đối tác này</p>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 )}

 {activeTab === 'wh_ff_orders' && (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
 <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
 <button 
 onClick={() => setActiveTab('overview')} 
 className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm"
 >
 <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
 </button>
 <div className="flex gap-3">
 <button className="bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold border border-slate-300">Xuất báo cáo</button>
 <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
 <Plus className="w-4 h-4" /> Tạo đơn vận mới
 </button>
 </div>
 </div>
 
 <div className="p-8">
 <div className="flex gap-4 mb-8">
 <div className="flex-1 relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input type="text" placeholder="Mã vận đơn, mã đơn hàng, shipper..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-900" />
 </div>
 <select className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium outline-none">
 <option>Tất cả trạng thái</option>
 <option>Đang giao</option>
 <option>Đã giao</option>
 <option>Chờ lấy hàng</option>
 </select>
 </div>

 <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
 <div className="overflow-x-auto min-w-0">
<table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
 <th className="px-3 py-2.5">Vận đơn</th>
 <th className="px-3 py-2.5">Đối tác</th>
 <th className="px-3 py-2.5">Tài xế/Shipper</th>
 <th className="px-3 py-2.5">Dự kiến</th>
 <th className="px-6 py-4 text-center">Trạng thái</th>
 <th className="px-6 py-4 text-right">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {MOCK_SHIPMENTS.map(ship => (
 <tr key={ship.id} className="hover:bg-slate-50/50 transition-colors">
 <td className="px-3 py-2.5">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-900">{ship.id}</span>
 <span className="text-[10px] text-slate-600 font-medium">{ship.orderId}</span>
 </div>
 </td>
 <td className="px-6 py-4 font-bold text-sm text-slate-800">{ship.partner}</td>
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 bg-[#EAE7DF] rounded-full flex items-center justify-center text-[10px] font-bold text-orange-700">
 {ship.driver.charAt(0)}
 </div>
 <span className="text-sm text-slate-700 font-medium">{ship.driver}</span>
 </div>
 </td>
 <td className="px-3 py-2 text-sm font-medium text-slate-700">{ship.eta}</td>
 <td className="px-6 py-4 text-center">
 <span className={cn(
 "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tight",
 ship.status === 'In Transit' ? "bg-slate-100 text-orange-700" :
 ship.status === 'Delivered' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-600"
 )}>
 {ship.status}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <button className="p-2 text-slate-500 hover:text-orange-700 transition-colors">
 <Navigation className="w-4 h-4" />
 </button>
 <button className="p-2 text-slate-500 hover:text-slate-700 transition-colors">
 <MoreVertical className="w-4 h-4" />
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'wh_ff_predict' && (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
 <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
 <button 
 onClick={() => setActiveTab('overview')} 
 className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg"
 >
 <ArrowLeft className="w-4 h-4" /> Quay lại
 </button>
 <div className="flex items-center gap-2 text-primary-600 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-100 animate-pulse">
 <Sparkles className="w-4 h-4" />
 <span className="text-[10px] font-black uppercase tracking-widest">AI Demand Forecasting Live</span>
 </div>
 </div>
 
 <div className="p-8 space-y-8">
 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-3 gap-4" columns={3} gap={16}>
 <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden h-[400px] flex flex-col">
 <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
 <Sparkles className="w-4 h-4 text-blue-600" />
 <h3 className="text-sm font-bold text-slate-900">Dự báo Nhu cầu SKUs (Tháng 5/2026)</h3>
 </div>
 <div className="p-5 flex-1 flex flex-col">
 <p className="text-slate-500 text-xs mb-4">Dựa trên dữ liệu lịch sử bán hàng và biến động thị trường.</p>
 <div className="flex items-end gap-3 flex-1">
 {[45, 65, 35, 85, 55, 95, 75, 45, 65, 80, 70, 90].map((val, i) => (
 <div key={i} className="flex-1 flex flex-col items-center gap-2">
 <div
 className="w-full bg-primary-500/30 border-t-2 border-primary-400 rounded-t-sm transition-all hover:bg-primary-400"
 style={{ height: `${val}%` }}
 />
 <span className="text-[8px] text-slate-600 font-bold">W{i+1}</span>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <div className="bg-white border-2 border-primary-100 rounded-xl p-6 shadow-sm shadow-indigo-100/20">
 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">AI Recommendation</h4>
 <div className="space-y-4">
 <div className="flex gap-3">
 <div className="p-2 bg-amber-50 text-amber-600 rounded-lg h-fit">
 <AlertCircle className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900">Nhập hàng gấp: SKU-552</p>
 <p className="text-[11px] text-slate-600 leading-relaxed">Dự kiến hết kho trong 3 ngày tới do chiến dịch Flash Sale 5/5.</p>
 </div>
 </div>
 <div className="flex gap-3">
 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg h-fit">
 <TrendingUp className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900">Giảm nhập: SKU-991</p>
 <p className="text-[11px] text-slate-600 leading-relaxed">Tốc độ tiêu thụ giảm 25% trong 2 tuần qua. Tránh tồn đọng vốn.</p>
 </div>
 </div>
 </div>
 <button className="w-full mt-6 py-3 bg-primary-600 text-[#FAF9F5] rounded-xl text-xs font-black uppercase tracking-widest shadow-sm shadow-indigo-200">
 Tạo đề xuất mua hàng tự động
 </button>
 </div>

 <div className="bg-slate-50 border border-slate-300 rounded-xl p-6">
 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Độ chính xác mô hình</h4>
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center">
 <span className="text-xs font-black text-slate-900 animate-none">94.2%</span>
 </div>
 <div>
 <p className="text-xs font-bold text-slate-900">Mô hình LSTM v4.2</p>
 <p className="text-[10px] text-slate-600 font-medium">Cập nhật: 04:52 AM Hôm nay</p>
 </div>
 </div>
 </div>
 </div>
 </DraggableGrid>
 </div>
 </div>
 )}

 {activeTab === 'wh_ff_heatmap' && (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
 <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
 <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg">
 <ArrowLeft className="w-4 h-4" /> Quay lại
 </button>
 <div className="flex items-center gap-6">
 {['Lối đi A', 'Lối đi B', 'Lối đi C', 'Khu vực Pick-Pack'].map(zone => (
 <span key={zone} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-orange-700 transition-colors">
 {zone}
 </span>
 ))}
 </div>
 </div>
 
 <div className="p-8">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h3 className="text-lg font-bold text-slate-900">Bản đồ nhiệt Lưu trữ (Storage Heatmap)</h3>
 <p className="text-xs text-slate-600">Trực quan hóa mật độ hàng hóa và hiệu suất lấy hàng (Pick efficiency).</p>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 rounded-lg text-[10px] font-bold border border-rose-100">
 <Zap className="w-3 h-3" /> Overloaded
 </div>
 <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold border border-emerald-100">
 <CheckCircle2 className="w-3 h-3" /> Optimized
 </div>
 </div>
 </div>

 <div className="grid grid-cols-10 gap-3 border border-slate-200 p-8 rounded-xl bg-slate-50/50">
 {Array.from({ length: 40 }).map((_, i) => (
 <div 
 key={i} 
 className={cn(
 "aspect-square rounded-xl border flex flex-col items-center justify-center gap-1 transition-all hover:scale-105 cursor-help group",
 i % 7 === 0 ? "bg-rose-500 border-rose-600 shadow-sm shadow-rose-100" :
 i % 5 === 0 ? "bg-amber-400 border-amber-500 shadow-sm shadow-amber-100" :
 "bg-white border-slate-300 hover:border-blue-400"
 )}
 >
 <span className={cn("text-[9px] font-black", i % 7 === 0 || i % 5 === 0 ? "text-[#FAF9F5]" : "text-slate-500")}>
 A-{i+101}
 </span>
 <LayoutGrid className={cn("w-3 h-3", i % 7 === 0 || i % 5 === 0 ? "text-[#FAF9F5]/50" : "text-slate-400")} />
 
 <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-[#FAF9F5] p-3 rounded-lg text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap shadow-sm">
 <p className="font-black mb-1">Mã kệ: A-{i+101}</p>
 <p className="opacity-70">Sức chứa: {i % 7 === 0 ? '98%' : '45%'}</p>
 <p className="opacity-70">Tần suất Pick: {i % 7 === 0 ? 'High' : 'Normal'}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 {activeTab === 'wh_ff_tracking' && (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
 <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
 <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700">
 <ArrowLeft className="w-4 h-4" /> Quay lại
 </button>
 </div>
 <div className="flex-1 flex">
 <div className="w-80 border-r border-slate-200 p-6 space-y-4 overflow-y-auto">
 <h3 className="font-bold text-slate-900 border-b pb-4 mb-4">Đơn đang giao (2)</h3>
 {MOCK_SHIPMENTS.filter(s => s.status === 'In Transit').map(s => (
 <div key={s.id} className="p-4 bg-slate-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-white transition-all">
 <div className="flex justify-between items-start mb-2">
 <span className="font-bold text-sm text-orange-700">{s.id}</span>
 <span className="text-[10px] font-bold text-slate-500">Đang chạy</span>
 </div>
 <p className="text-xs text-slate-700 mb-2">{s.driver}</p>
 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
 <Clock className="w-3 h-3" /> Cập nhật: 2 phút trước
 </div>
 </div>
 ))}
 </div>
 <div className="flex-1 bg-slate-100 relative overflow-hidden">
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="text-center opacity-40">
 <Navigation className="w-16 h-16 mx-auto mb-4" />
 <p className="font-bold">BẢN ĐỒ LỘ TRÌNH REAL-TIME</p>
 <p className="text-xs">Đang tải dữ liệu vệ tinh GPS...</p>
 </div>
 </div>
 <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-sm space-y-3 w-48">
 <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b pb-2">
 <span>Tổng số xe</span>
 <span className="text-orange-700">12</span>
 </div>
 <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
 <span>Đang giao hàng</span>
 <span className="text-emerald-500">8</span>
 </div>
 <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
 <span>Dừng nghỉ</span>
 <span className="text-orange-500">4</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'wh_ff_optimize' && (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4 p-12 items-center justify-center text-center">
 <div className="w-20 h-20 bg-emerald-50 rounded-lg flex items-center justify-center mb-6 animate-bounce">
 <MapPin className="w-10 h-10 text-emerald-600" />
 </div>
 <h2 className="text-2xl font-bold text-slate-900 mb-4">Tối ưu Tuyến đường Giao hàng</h2>
 <p className="text-slate-600 max-w-lg mx-auto leading-relaxed mb-8">
 Sử dụng thuật toán AI để sắp xếp thứ tự các điểm giao hàng, giảm 20% quãng đường di chuyển và tối ưu hóa thời gian nhận hàng của khách hàng.
 </p>
 <div className="flex gap-4">
 <button className="bg-emerald-600 text-[#FAF9F5] px-8 py-3 rounded-lg font-bold shadow-sm shadow-emerald-600/20">Chạy Optimization ngay</button>
 <button 
 onClick={() => setActiveTab('overview')}
 className="bg-slate-100 text-slate-700 px-8 py-3 rounded-lg font-bold"
 >
 Hủy bỏ
 </button>
 </div>
 </div>
 )}

 {activeTab === 'wh_stock' && (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
 <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50 flex justify-between items-center">
 <div className="flex items-center gap-4">
 <button 
 onClick={() => setActiveTab('overview')} 
 className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-300 transition-all shadow-sm group"
 >
 <ArrowLeft className="w-4 h-4 text-slate-600 group-hover:text-orange-700" />
 </button>
 <div>
 <h3 className="text-sm font-bold text-slate-900 leading-none mb-1">Tồn kho nguyên vật liệu</h3>
 <p className="text-[10px] text-slate-600 font-medium">Kho: <span className="text-orange-700 uppercase">{activeStore?.name}</span></p>
 </div>
 </div>
 <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
 <Plus className="w-4 h-4" /> Nhập tồn đầu kỳ
 </button>
 </div>
 
 <div className="p-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
 {stockItems.slice(0, 3).map(item => (
 <div key={item.id} className="bg-slate-50 border border-slate-300 p-4 rounded-xl flex items-center gap-4">
 <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
 <Package className={cn("w-5 h-5", item.quantity < 20 ? "text-rose-500" : "text-orange-600")} />
 </div>
 <div>
 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{item.materialId}</p>
 <p className="text-lg font-black text-slate-900">{item.quantity.toFixed(2)}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
 <div className="overflow-x-auto min-w-0">
<table className="w-full text-left border-collapse">
 <thead className="bg-slate-50 border-b border-slate-300">
 <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
 <th className="px-3 py-2.5">Mã Nguyên liệu</th>
 <th className="px-6 py-4 text-center">Tồn kho thực tế</th>
 <th className="px-6 py-4 text-center">Đơn vị</th>
 <th className="px-3 py-2.5">Cập nhật lần cuối</th>
 <th className="px-6 py-4 text-right">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {stockItems.map(item => (
 <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-3">
 <span className="text-sm font-bold text-slate-900">{item.materialId}</span>
 {item.quantity < 20 && <span className="text-[8px] bg-rose-50 text-rose-600 font-black px-1.5 py-0.5 rounded uppercase">Sắp hết</span>}
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn("text-sm font-black", item.quantity < 20 ? "text-rose-600" : "text-slate-900 text-lg")}>
 {item.quantity.toFixed(2)}
 </span>
 </td>
 <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">
 {item.materialId.includes('MAT-001') ? 'KG' : item.materialId.includes('MAT-004') ? 'BOX' : 'LIT'}
 </td>
 <td className="px-6 py-4 text-xs font-medium text-slate-600">
 {item.updatedAt?.toDate().toLocaleString('vi-VN') || 'Vừa cập nhật'}
 </td>
 <td className="px-6 py-4 text-right">
 <button className="text-orange-700 text-xs font-bold hover:underline">Chi tiết</button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab !== 'overview' && activeTab !== 'wh_partners' && !activeTab.startsWith('wh_ff_') && activeTab !== 'wh_stock' && (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
 <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
 <button 
 onClick={() => setActiveTab('overview')} 
 className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm"
 >
 <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
 </button>
 </div>
 
 <div className="p-16 flex flex-col items-center justify-center text-center">
 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
 <Warehouse className="w-10 h-10 text-orange-600" />
 </div>
 <h3 className="text-xl font-bold text-slate-900 mb-2">Phân hệ: {activeTab}</h3>
 <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
 Tính năng này đang trong quá trình phát triển chi tiết cho phân hệ Kho vận.
 </p>
 </div>
 </div>
 )}
 </div>
 );
}

