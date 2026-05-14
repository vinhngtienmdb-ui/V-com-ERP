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
 title: 'Nháº­p/xuáº¥t kho',
 items: [
 { id: 'wh_in_out', label: 'Phiáº¿u kho', desc: 'Nháº­p kho, xuáº¥t kho, Ä‘iá»u chuyá»ƒn.', icon: FileInput, color: 'blue' },
 { id: 'wh_req_purchase', label: 'Phiáº¿u Ä‘á» xuáº¥t mua hÃ ng', desc: 'Äá» xuáº¥t hÃ ng thiáº¿u.', icon: GitBranch, color: 'indigo' },
 { id: 'wh_inventory', label: 'Kiá»ƒm kÃª kho', desc: 'Thá»±c hiá»‡n kiá»ƒm kÃª Ä‘á»‹nh ká»³.', icon: ClipboardList, color: 'emerald' },
 ]
 },
 {
 title: 'Váº­n hÃ nh & Tá»‘i Æ°u AI',
 items: [
 { id: 'wh_ff_orders', label: 'Quáº£n lÃ½ váº­n chuyá»ƒn', desc: 'Theo dÃµi Ä‘Æ¡n hÃ ng Ä‘ang giao.', icon: ListTodo, color: 'indigo' },
 { id: 'wh_ff_predict', label: 'Dá»± bÃ¡o nhu cáº§u AI', desc: 'Dá»± bÃ¡o hÃ ng tá»“n cáº§n nháº­p.', icon: Sparkles, color: 'purple' },
 { id: 'wh_ff_heatmap', label: 'Báº£n Ä‘á»“ nhiá»‡t kho', desc: 'Tá»‘i Æ°u hÃ³a vá»‹ trÃ­ lÆ°u kho.', icon: Zap, color: 'orange' },
 { id: 'wh_ff_tracking', label: 'Theo dÃµi lá»™ trÃ¬nh', desc: 'Real-time tracking váº­n chuyá»ƒn.', icon: Navigation, color: 'blue' },
 ]
 },
 {
 title: 'BÃ¡o cÃ¡o',
 items: [
 { id: 'wh_stock', label: 'Tá»“n kho', desc: 'Danh sÃ¡ch tá»“n kho hiá»‡n táº¡i.', icon: Package, color: 'orange' },
 { id: 'wh_in_out_report', label: 'BÃ¡o cÃ¡o nháº­p xuáº¥t tá»“n', desc: 'Thá»‘ng kÃª luÃ¢n chuyá»ƒn.', icon: BarChart2, color: 'purple' },
 ]
 },
 {
 title: 'Thiáº¿t láº­p vÃ  danh má»¥c',
 items: [
 { id: 'wh_cat', label: 'Danh má»¥c hÃ ng hÃ³a', desc: 'PhÃ¢n loáº¡i hÃ ng hÃ³a.', icon: FileSignature, color: 'rose' },
 { id: 'wh_items', label: 'Danh sÃ¡ch hÃ ng hÃ³a', desc: 'Quáº£n lÃ½ mÃ£ hÃ ng, SKU.', icon: Package, color: 'fuchsia' },
 { id: 'wh_list', label: 'Danh sÃ¡ch kho', desc: 'Quáº£n lÃ½ cÃ¡c vá»‹ trÃ­ kho.', icon: Warehouse, color: 'blue' },
 { id: 'wh_partners', label: 'Danh sÃ¡ch Ä‘á»‘i tÃ¡c', desc: 'Äá»‘i tÃ¡c kho váº­n.', icon: Users, color: 'slate' },
 { id: 'wh_settings', label: 'Thiáº¿t láº­p kho', desc: 'Config quy táº¯c kho.', icon: Settings, color: 'slate' }
 ]
 }
];

const LOGISTICS_PARTNERS = [
 { 
 id: 'LP001', 
 name: 'Giao HÃ ng Nhanh (GHN)', 
 contact: '1900 636683', 
 email: 'cskh@ghn.vn', 
 policy: 'Chiáº¿t kháº¥u 10% cho Ä‘Æ¡n trÃªn 100tr/thÃ¡ng', 
 status: 'Active',
 website: 'ghn.vn',
 coverage: 'ToÃ n quá»‘c'
 },
 { 
 id: 'LP002', 
 name: 'Viettel Post', 
 contact: '1900 8095', 
 email: 'support@viettelpost.com.vn', 
 policy: 'Äá»“ng giÃ¡ 22k ná»™i tá»‰nh', 
 status: 'Active',
 website: 'viettelpost.com.vn',
 coverage: 'ToÃ n quá»‘c'
 },
 { 
 id: 'LP003', 
 name: 'Ninja Van', 
 contact: '1900 888685', 
 email: 'support_vn@ninjavan.co', 
 policy: 'Giáº£m 15% cho shop má»›i', 
 status: 'Maintenance',
 website: 'ninjavan.co',
 coverage: 'ToÃ n quá»‘c'
 }
];

const LOGISTICS_FEES: Record<string, any[]> = {
 // ... existing fees
};

const MOCK_SHIPMENTS = [
 { id: 'SHIP-001', orderId: 'ORD-5521', partner: 'GHN', status: 'In Transit', driver: 'Nguyá»…n VÄƒn Nam', eta: '15:30 Today' },
 { id: 'SHIP-002', orderId: 'ORD-5525', partner: 'Viettel Post', status: 'Delivered', driver: 'Tráº§n VÄƒn TÃº', eta: 'Success' },
 { id: 'SHIP-003', orderId: 'ORD-5528', partner: 'Ninja Van', status: 'Chá» xá»­ lÃ½', driver: 'ChÆ°a Ä‘iá»u phá»‘i', eta: 'NgÃ y mai' },
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
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Quáº£n trá»‹ Kho váº­n</h1>
 </div>
 <p className="text-sm text-[#6B7280]">Quáº£n lÃ½ nháº­p xuáº¥t kho, kiá»ƒm kÃª vÃ  váº­n hÃ nh Fulfillment.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Filter className="w-4 h-4" /> Báº£n Ä‘á»“ kho
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" /> Táº¡o phiáº¿u kho
 </button>
 </div>
 </div>

 {activeTab === 'overview' && (
 <div className="space-y-8">
 {/* Stats Cards */}
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={16}>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">GiÃ¡ trá»‹ tá»“n kho</span>
 <DollarSign className="w-4 h-4 text-emerald-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{formatCurrency(4850000000)}</span>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">+5.2%</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">ÄÆ¡n Fulfillment</span>
 <Truck className="w-4 h-4 text-orange-700" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">1,248</span>
 <span className="text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded">85 Äang giao</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">HÃ ng sáº¯p háº¿t (Alt)</span>
 <AlertCircle className="w-4 h-4 text-orange-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">42 SKUs</span>
 <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">Cáº§n nháº­p</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Uptime Kho váº­n</span>
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
 <ArrowLeft className="w-4 h-4" /> Quay láº¡i Giao diá»‡n chung
 </button>
 <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
 <Plus className="w-4 h-4" /> ThÃªm Ä‘Æ¡n vá»‹ váº­n chuyá»ƒn
 </button>
 </div>
 
 {!selectedPartnerForFees && (
 <div className="p-8">
 <div className="flex justify-between items-center mb-8">
 <div className="relative w-96">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input type="text" placeholder="TÃ¬m kiáº¿m Ä‘Æ¡n vá»‹ váº­n chuyá»ƒn..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-900" />
 </div>
 <button className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg">
 <Filter className="w-4 h-4" /> Lá»c
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
 <p className="text-xs text-slate-600 mb-4">{partner.id} â€¢ {partner.coverage}</p>
 
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
 <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">ChÃ­nh sÃ¡ch chiáº¿t kháº¥u</span>
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
 <Receipt className="w-3.5 h-3.5" /> Biá»ƒu phÃ­
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
 <ArrowLeft className="w-4 h-4" /> Danh sÃ¡ch Ä‘á»‘i tÃ¡c
 </button>
 <div className="flex items-center gap-3">
 <h3 className="text-lg font-bold text-slate-900">
 Biá»ƒu phÃ­ dá»‹ch vá»¥: {LOGISTICS_PARTNERS.find(p => p.id === selectedPartnerForFees)?.name}
 </h3>
 <span className="text-[10px] bg-[#EAE7DF] text-orange-800 font-bold px-2 py-0.5 rounded uppercase tracking-wider">
 {selectedPartnerForFees}
 </span>
 </div>
 <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
 <Plus className="w-4 h-4" /> ThÃªm khoáº£n phÃ­ má»›i
 </button>
 </div>

 <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
 <div className="overflow-x-auto min-w-0">
<table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-300">
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">TÃªn khoáº£n phÃ­</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Loáº¡i phÃ­</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">GiÃ¡ trá»‹</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tráº¡ng thÃ¡i</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Thao tÃ¡c</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {LOGISTICS_FEES[selectedPartnerForFees]?.map(fee => (
 <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors group">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center group-hover:bg-slate-100 group-hover:text-orange-700 transition-colors">
 <DollarSign className="w-4 h-4" />
 </div>
 <span className="text-sm font-bold text-slate-900">{fee.name}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className="text-xs font-medium text-slate-600">{fee.type}</span>
 </td>
 <td className="px-6 py-4">
 <span className="text-sm font-black text-orange-700">{fee.value}</span>
 </td>
 <td className="px-6 py-4">
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
 <p className="text-sm font-medium text-slate-600">ChÆ°a cÃ³ dá»¯ liá»‡u biá»ƒu phÃ­ cho Ä‘á»‘i tÃ¡c nÃ y</p>
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
 <ArrowLeft className="w-4 h-4" /> Quay láº¡i Giao diá»‡n chung
 </button>
 <div className="flex gap-3">
 <button className="bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold border border-slate-300">Xuáº¥t bÃ¡o cÃ¡o</button>
 <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
 <Plus className="w-4 h-4" /> Táº¡o Ä‘Æ¡n váº­n má»›i
 </button>
 </div>
 </div>
 
 <div className="p-8">
 <div className="flex gap-4 mb-8">
 <div className="flex-1 relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input type="text" placeholder="MÃ£ váº­n Ä‘Æ¡n, mÃ£ Ä‘Æ¡n hÃ ng, shipper..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:border-slate-900" />
 </div>
 <select className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium outline-none">
 <option>Táº¥t cáº£ tráº¡ng thÃ¡i</option>
 <option>Äang giao</option>
 <option>ÄÃ£ giao</option>
 <option>Chá» láº¥y hÃ ng</option>
 </select>
 </div>

 <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
 <div className="overflow-x-auto min-w-0">
<table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-300 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
 <th className="px-6 py-4">Váº­n Ä‘Æ¡n</th>
 <th className="px-6 py-4">Äá»‘i tÃ¡c</th>
 <th className="px-6 py-4">TÃ i xáº¿/Shipper</th>
 <th className="px-6 py-4">Dá»± kiáº¿n</th>
 <th className="px-6 py-4 text-center">Tráº¡ng thÃ¡i</th>
 <th className="px-6 py-4 text-right">Thao tÃ¡c</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {MOCK_SHIPMENTS.map(ship => (
 <tr key={ship.id} className="hover:bg-slate-50/50 transition-colors">
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-900">{ship.id}</span>
 <span className="text-[10px] text-slate-600 font-medium">{ship.orderId}</span>
 </div>
 </td>
 <td className="px-6 py-4 font-bold text-sm text-slate-800">{ship.partner}</td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 bg-[#EAE7DF] rounded-full flex items-center justify-center text-[10px] font-bold text-orange-700">
 {ship.driver.charAt(0)}
 </div>
 <span className="text-sm text-slate-700 font-medium">{ship.driver}</span>
 </div>
 </td>
 <td className="px-6 py-4 text-sm font-medium text-slate-700">{ship.eta}</td>
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
 <ArrowLeft className="w-4 h-4" /> Quay láº¡i
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
 <h3 className="text-sm font-bold text-slate-900">Dá»± bÃ¡o Nhu cáº§u SKUs (ThÃ¡ng 5/2026)</h3>
 </div>
 <div className="p-5 flex-1 flex flex-col">
 <p className="text-slate-500 text-xs mb-4">Dá»±a trÃªn dá»¯ liá»‡u lá»‹ch sá»­ bÃ¡n hÃ ng vÃ  biáº¿n Ä‘á»™ng thá»‹ trÆ°á»ng.</p>
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
 <p className="text-sm font-bold text-slate-900">Nháº­p hÃ ng gáº¥p: SKU-552</p>
 <p className="text-[11px] text-slate-600 leading-relaxed">Dá»± kiáº¿n háº¿t kho trong 3 ngÃ y tá»›i do chiáº¿n dá»‹ch Flash Sale 5/5.</p>
 </div>
 </div>
 <div className="flex gap-3">
 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg h-fit">
 <TrendingUp className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900">Giáº£m nháº­p: SKU-991</p>
 <p className="text-[11px] text-slate-600 leading-relaxed">Tá»‘c Ä‘á»™ tiÃªu thá»¥ giáº£m 25% trong 2 tuáº§n qua. TrÃ¡nh tá»“n Ä‘á»ng vá»‘n.</p>
 </div>
 </div>
 </div>
 <button className="w-full mt-6 py-3 bg-primary-600 text-[#FAF9F5] rounded-xl text-xs font-black uppercase tracking-widest shadow-sm shadow-indigo-200">
 Táº¡o Ä‘á» xuáº¥t mua hÃ ng tá»± Ä‘á»™ng
 </button>
 </div>

 <div className="bg-slate-50 border border-slate-300 rounded-xl p-6">
 <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Äá»™ chÃ­nh xÃ¡c mÃ´ hÃ¬nh</h4>
 <div className="flex items-center gap-4">
 <div className="w-16 h-16 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin flex items-center justify-center">
 <span className="text-xs font-black text-slate-900 animate-none">94.2%</span>
 </div>
 <div>
 <p className="text-xs font-bold text-slate-900">MÃ´ hÃ¬nh LSTM v4.2</p>
 <p className="text-[10px] text-slate-600 font-medium">Cáº­p nháº­t: 04:52 AM HÃ´m nay</p>
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
 <ArrowLeft className="w-4 h-4" /> Quay láº¡i
 </button>
 <div className="flex items-center gap-6">
 {['Lá»‘i Ä‘i A', 'Lá»‘i Ä‘i B', 'Lá»‘i Ä‘i C', 'Khu vá»±c Pick-Pack'].map(zone => (
 <span key={zone} className="text-[10px] font-bold text-slate-500 uppercase tracking-widest cursor-pointer hover:text-orange-700 transition-colors">
 {zone}
 </span>
 ))}
 </div>
 </div>
 
 <div className="p-8">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h3 className="text-lg font-bold text-slate-900">Báº£n Ä‘á»“ nhiá»‡t LÆ°u trá»¯ (Storage Heatmap)</h3>
 <p className="text-xs text-slate-600">Trá»±c quan hÃ³a máº­t Ä‘á»™ hÃ ng hÃ³a vÃ  hiá»‡u suáº¥t láº¥y hÃ ng (Pick efficiency).</p>
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
 <p className="font-black mb-1">MÃ£ ká»‡: A-{i+101}</p>
 <p className="opacity-70">Sá»©c chá»©a: {i % 7 === 0 ? '98%' : '45%'}</p>
 <p className="opacity-70">Táº§n suáº¥t Pick: {i % 7 === 0 ? 'High' : 'Normal'}</p>
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
 <ArrowLeft className="w-4 h-4" /> Quay láº¡i
 </button>
 </div>
 <div className="flex-1 flex">
 <div className="w-80 border-r border-slate-200 p-6 space-y-4 overflow-y-auto">
 <h3 className="font-bold text-slate-900 border-b pb-4 mb-4">ÄÆ¡n Ä‘ang giao (2)</h3>
 {MOCK_SHIPMENTS.filter(s => s.status === 'In Transit').map(s => (
 <div key={s.id} className="p-4 bg-slate-50 rounded-lg border border-orange-200 cursor-pointer hover:bg-white transition-all">
 <div className="flex justify-between items-start mb-2">
 <span className="font-bold text-sm text-orange-700">{s.id}</span>
 <span className="text-[10px] font-bold text-slate-500">Äang cháº¡y</span>
 </div>
 <p className="text-xs text-slate-700 mb-2">{s.driver}</p>
 <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
 <Clock className="w-3 h-3" /> Cáº­p nháº­t: 2 phÃºt trÆ°á»›c
 </div>
 </div>
 ))}
 </div>
 <div className="flex-1 bg-slate-100 relative overflow-hidden">
 <div className="absolute inset-0 flex items-center justify-center">
 <div className="text-center opacity-40">
 <Navigation className="w-16 h-16 mx-auto mb-4" />
 <p className="font-bold">Báº¢N Äá»’ Lá»˜ TRÃŒNH REAL-TIME</p>
 <p className="text-xs">Äang táº£i dá»¯ liá»‡u vá»‡ tinh GPS...</p>
 </div>
 </div>
 <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-4 rounded-lg shadow-sm space-y-3 w-48">
 <div className="flex items-center justify-between text-xs font-bold text-slate-700 border-b pb-2">
 <span>Tá»•ng sá»‘ xe</span>
 <span className="text-orange-700">12</span>
 </div>
 <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
 <span>Äang giao hÃ ng</span>
 <span className="text-emerald-500">8</span>
 </div>
 <div className="flex items-center justify-between text-[10px] font-bold text-slate-600">
 <span>Dá»«ng nghá»‰</span>
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
 <h2 className="text-2xl font-bold text-slate-900 mb-4">Tá»‘i Æ°u Tuyáº¿n Ä‘Æ°á»ng Giao hÃ ng</h2>
 <p className="text-slate-600 max-w-lg mx-auto leading-relaxed mb-8">
 Sá»­ dá»¥ng thuáº­t toÃ¡n AI Ä‘á»ƒ sáº¯p xáº¿p thá»© tá»± cÃ¡c Ä‘iá»ƒm giao hÃ ng, giáº£m 20% quÃ£ng Ä‘Æ°á»ng di chuyá»ƒn vÃ  tá»‘i Æ°u hÃ³a thá»i gian nháº­n hÃ ng cá»§a khÃ¡ch hÃ ng.
 </p>
 <div className="flex gap-4">
 <button className="bg-emerald-600 text-[#FAF9F5] px-8 py-3 rounded-lg font-bold shadow-sm shadow-emerald-600/20">Cháº¡y Optimization ngay</button>
 <button 
 onClick={() => setActiveTab('overview')}
 className="bg-slate-100 text-slate-700 px-8 py-3 rounded-lg font-bold"
 >
 Há»§y bá»
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
 <h3 className="text-sm font-bold text-slate-900 leading-none mb-1">Tá»“n kho nguyÃªn váº­t liá»‡u</h3>
 <p className="text-[10px] text-slate-600 font-medium">Kho: <span className="text-orange-700 uppercase">{activeStore?.name}</span></p>
 </div>
 </div>
 <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5">
 <Plus className="w-4 h-4" /> Nháº­p tá»“n Ä‘áº§u ká»³
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
 <th className="px-6 py-4">MÃ£ NguyÃªn liá»‡u</th>
 <th className="px-6 py-4 text-center">Tá»“n kho thá»±c táº¿</th>
 <th className="px-6 py-4 text-center">ÄÆ¡n vá»‹</th>
 <th className="px-6 py-4">Cáº­p nháº­t láº§n cuá»‘i</th>
 <th className="px-6 py-4 text-right">Thao tÃ¡c</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {stockItems.map(item => (
 <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <span className="text-sm font-bold text-slate-900">{item.materialId}</span>
 {item.quantity < 20 && <span className="text-[8px] bg-rose-50 text-rose-600 font-black px-1.5 py-0.5 rounded uppercase">Sáº¯p háº¿t</span>}
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
 {item.updatedAt?.toDate().toLocaleString('vi-VN') || 'Vá»«a cáº­p nháº­t'}
 </td>
 <td className="px-6 py-4 text-right">
 <button className="text-orange-700 text-xs font-bold hover:underline">Chi tiáº¿t</button>
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
 <ArrowLeft className="w-4 h-4" /> Quay láº¡i Giao diá»‡n chung
 </button>
 </div>
 
 <div className="p-16 flex flex-col items-center justify-center text-center">
 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
 <Warehouse className="w-10 h-10 text-orange-600" />
 </div>
 <h3 className="text-xl font-bold text-slate-900 mb-2">PhÃ¢n há»‡: {activeTab}</h3>
 <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
 TÃ­nh nÄƒng nÃ y Ä‘ang trong quÃ¡ trÃ¬nh phÃ¡t triá»ƒn chi tiáº¿t cho phÃ¢n há»‡ Kho váº­n.
 </p>
 </div>
 </div>
 )}
 </div>
 );
}

