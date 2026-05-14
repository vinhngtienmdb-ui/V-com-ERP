import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 Zap, 
 Users2, 
 TrendingUp, 
 ArrowUpRight, 
 Calendar,
 Search,
 Filter,
 BarChart2,
 X,
 Plus,
 Trash2,
 Calculator,
 Package,
 Ticket,
 Clock,
 Store,
 ShieldCheck
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Campaign } from '../types/erp';
import { MOCK_AFFILIATES } from './Affiliate';
import { MOCK_SELLERS } from './Sellers';

interface FlashSaleCampaign extends Campaign {
 requiredParticipants?: number;
 currentParticipants?: number;
 kolName?: string;
 baseDiscount?: number;
 maxDiscount?: number;
 products?: { id: string; discountParams: any }[];
}

interface Voucher {
 id: string;
 code: string;
 type: 'percent' | 'fixed';
 value: number;
 minOrderValue?: number;
 maxDiscount?: number;
 startDate: string;
 endDate: string;
 status: 'active' | 'upcoming' | 'expired';
 creatorType: 'admin' | 'seller' | 'shipping';
 creatorName: string;
 sellerIds?: string[]; // ThÃªm trÆ°á»ng danh sÃ¡ch ID nhÃ  bÃ¡n náº¿u cáº§n
 usageLimit: number;
 usedCount: number;
}

const MOCK_FLASH_SALES: FlashSaleCampaign[] = [
 {
 id: 'FS-001',
 name: 'Deal Chá»›p NhoÃ¡ng 12H',
 type: 'flash_sale',
 status: 'active',
 budget: 50000000,
 spent: 12000000,
 gmvGenerated: 250000000,
 roi: 20.8,
 startDate: '01/03/2024',
 endDate: '31/03/2024'
 },
 {
 id: 'GB-001',
 name: 'Mua Chung Sáº­p GiÃ¡: Tá»§ Láº¡nh Samsung',
 type: 'group_buy',
 status: 'active',
 budget: 100000000,
 spent: 45000000,
 gmvGenerated: 1200000000,
 roi: 26.6,
 startDate: '01/03/2024',
 endDate: '20/03/2024',
 requiredParticipants: 1000,
 currentParticipants: 842,
 kolName: 'KOC Háº±ng TÃºi',
 baseDiscount: 10,
 maxDiscount: 40
 }
];

const MOCK_VOUCHERS: Voucher[] = [
 {
 id: 'V-001',
 code: 'MEGA50K',
 type: 'fixed',
 value: 50000,
 minOrderValue: 200000,
 startDate: '2024-03-01T00:00:00',
 endDate: '2024-04-01T23:59:59',
 status: 'active',
 creatorType: 'admin',
 creatorName: 'Há»‡ thá»‘ng',
 usageLimit: 10000,
 usedCount: 2450
 },
 {
 id: 'V-002',
 code: 'GIAM10PT',
 type: 'percent',
 value: 10,
 maxDiscount: 100000,
 startDate: '2024-03-15T00:00:00',
 endDate: '2024-03-30T23:59:59',
 status: 'active',
 creatorType: 'seller',
 creatorName: 'Táº¡p hÃ³a ChÃº Ba',
 usageLimit: 500,
 usedCount: 124
 }
];

const MOCK_PRODUCTS = [
 { id: 'P01', name: 'Tá»§ Láº¡nh Samsung Inverter 300L', costPrice: 8000000, price: 12000000 },
 { id: 'P02', name: 'iPhone 15 Pro Max 256GB', costPrice: 24000000, price: 29000000 },
 { id: 'P03', name: 'Ná»“i chiÃªn khÃ´ng dáº§u Philips', costPrice: 1500000, price: 3000000 },
];

export function FlashSale() {
 const [activeTab, setActiveTab] = useState<'group_buy' | 'flash_sale' | 'voucher'>('group_buy');
 const [isModalOpen, setIsModalOpen] = useState(false);
 
 // Voucher states
 const [voucherType, setVoucherType] = useState<'admin' | 'seller' | 'shipping'>('admin');
 const [selectedSellers, setSelectedSellers] = useState<string[]>([]);

 // Group buy states
 const [selectedProductId, setSelectedProductId] = useState('');
 const [tiers, setTiers] = useState([{ quantity: 50, discount: 5 }, { quantity: 500, discount: 10 }]);
 const [distributorDiscount, setDistributorDiscount] = useState(10);
 const [agentDiscount, setAgentDiscount] = useState(5);
 const [kolCommission, setKolCommission] = useState(5);

 const selectedProduct = MOCK_PRODUCTS.find(p => p.id === selectedProductId);

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Khuyáº¿n mÃ£i & Group Buy</h1>
 <p className="text-sm text-[#6B7280] mt-1">Quáº£n lÃ½ giáº£m giÃ¡, chiáº¿n dá»‹ch Flash Sale, MÃ£ Æ°u Ä‘Ã£i vÃ  mÃ´ hÃ¬nh "Mua chung sáº­p giÃ¡".</p>
 </div>
 <button 
 onClick={() => setIsModalOpen(true)}
 className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> 
 {activeTab === 'group_buy' ? 'Táº¡o Mua Chung' : activeTab === 'flash_sale' ? 'Táº¡o Flash Sale' : 'Táº¡o Voucher'}
 </button>
 </div>

 <div className="flex gap-4 border-b border-slate-300">
 <button 
 onClick={() => setActiveTab('group_buy')}
 className={cn(
 "px-4 py-2 border-b-2 text-sm font-medium transition-colors flex items-center gap-2",
 activeTab === 'group_buy' ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-600 hover:text-slate-800"
 )}
 >
 <Users2 className="w-4 h-4" />
 Mua Chung Sáº­p GiÃ¡
 </button>
 <button 
 onClick={() => setActiveTab('flash_sale')}
 className={cn(
 "px-4 py-2 border-b-2 text-sm font-medium transition-colors flex items-center gap-2",
 activeTab === 'flash_sale' ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-600 hover:text-slate-800"
 )}
 >
 <Zap className="w-4 h-4" />
 Flash Sale
 </button>
 <button 
 onClick={() => setActiveTab('voucher')}
 className={cn(
 "px-4 py-2 border-b-2 text-sm font-medium transition-colors flex items-center gap-2",
 activeTab === 'voucher' ? "border-[#2563EB] text-[#2563EB]" : "border-transparent text-slate-600 hover:text-slate-800"
 )}
 >
 <Ticket className="w-4 h-4" />
 Voucher (MÃ£ Giáº£m GiÃ¡)
 </button>
 </div>

 {isModalOpen && activeTab === 'group_buy' && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-sm max-h-[90vh] flex flex-col">
 <div className="flex justify-between items-center mb-6 shrink-0">
 <div className="flex items-center gap-2 text-rose-600">
 <Zap className="w-5 h-5 fill-current" />
 <h2 className="text-lg font-bold text-[#111827]">Táº¡o chiáº¿n dá»‹ch Mua Chung Sáº­p GiÃ¡</h2>
 </div>
 <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
 <X className="w-5 h-5" />
 </button>
 </div>
 
 <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
 <form className="space-y-6">
 {/* General Settings */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">TÃªn chiáº¿n dá»‹ch</label>
 <input type="text" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" placeholder="VD: Mua chung Tá»§ Láº¡nh..." required />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">KOL/KOC Khá»Ÿi táº¡o</label>
 <select className="w-full border border-slate-400 rounded-lg p-2.5 text-sm bg-white" required>
 <option value="">-- Chá»n KOL/KOC --</option>
 {MOCK_AFFILIATES.filter(a => a.type === 'kol').map(kol => (
 <option key={kol.id} value={kol.name}>{kol.name} ({kol.followers ? `${(kol.followers/1000).toFixed(0)}K followers` : ''})</option>
 ))}
 </select>
 </div>
 <div className="md:col-span-2">
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Sáº£n pháº©m triá»ƒn khai</label>
 <select 
 className="w-full border border-slate-400 rounded-lg p-2.5 text-sm bg-white" 
 required
 value={selectedProductId}
 onChange={(e) => setSelectedProductId(e.target.value)}
 >
 <option value="">-- Chá»n sáº£n pháº©m --</option>
 {MOCK_PRODUCTS.map(p => (
 <option key={p.id} value={p.id}>{p.name} - GiÃ¡ bÃ¡n: {formatCurrency(p.price)}</option>
 ))}
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Báº¯t Ä‘áº§u</label>
 <input type="datetime-local" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" required />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Káº¿t thÃºc</label>
 <input type="datetime-local" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" required />
 </div>
 </div>

 {/* Tiers Configuration */}
 <div className="bg-slate-50 p-5 rounded-lg border border-slate-300">
 <div className="flex justify-between items-center mb-4">
 <div>
 <h4 className="text-sm font-bold text-slate-900">CÃ¡c má»‘c giáº£m giÃ¡ (Multi-tier)</h4>
 <p className="text-xs text-slate-600">NgÆ°á»i mua sáº½ Ä‘Æ°á»£c hÆ°á»Ÿng chiáº¿t kháº¥u tÆ°Æ¡ng á»©ng vá»›i má»‘c sá»‘ lÆ°á»£ng mua chung Ä‘áº¡t Ä‘Æ°á»£c.</p>
 </div>
 <button 
 type="button"
 onClick={() => setTiers([...tiers, { quantity: 1000, discount: 15 }])}
 className="px-3 py-1.5 bg-white border border-slate-400 rounded-lg text-xs font-bold text-slate-800 flex items-center gap-1.5 hover:bg-slate-100"
 >
 <Plus className="w-3.5 h-3.5" /> ThÃªm má»‘c má»›i
 </button>
 </div>
 
 <div className="space-y-3">
 {tiers.map((tier, index) => (
 <div key={index} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-300">
 <div className="flex-1">
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Má»‘c Ä‘Æ¡n hÃ ng Ä‘áº¡t</label>
 <div className="relative">
 <input 
 type="number" 
 value={tier.quantity} 
 onChange={(e) => {
 const newTiers = [...tiers];
 newTiers[index].quantity = Number(e.target.value);
 setTiers(newTiers);
 }}
 className="w-full font-mono text-sm border border-slate-300 rounded p-2 focus:border-slate-900 outline-none" 
 />
 </div>
 </div>
 <div className="flex-1">
 <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Giáº£m giÃ¡ (%)</label>
 <div className="relative">
 <input 
 type="number" 
 value={tier.discount} 
 onChange={(e) => {
 const newTiers = [...tiers];
 newTiers[index].discount = Number(e.target.value);
 setTiers(newTiers);
 }}
 className="w-full font-mono text-sm border border-slate-300 rounded p-2 pr-8 focus:border-slate-900 outline-none text-rose-600 font-bold" 
 />
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">%</span>
 </div>
 </div>
 <button 
 type="button" 
 onClick={() => setTiers(tiers.filter((_, i) => i !== index))}
 className="mt-5 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 </div>

 {/* PnL Parameters */}
 <div className="bg-white p-5 rounded-lg border border-slate-300">
 <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-orange-600" /> Báº£ng tÃ­nh Lá»£i nhuáº­n (P&L)</h4>
 
 <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-200">
 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">C/K NhÃ  cung cáº¥p (%)</label>
 <input type="number" value={distributorDiscount} onChange={(e) => setDistributorDiscount(Number(e.target.value))} className="w-full border border-slate-400 rounded-md p-2 text-sm bg-slate-50" />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">C/K Äáº¡i lÃ½ (%)</label>
 <input type="number" value={agentDiscount} onChange={(e) => setAgentDiscount(Number(e.target.value))} className="w-full border border-slate-400 rounded-md p-2 text-sm bg-slate-50" />
 </div>
 <div>
 <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hoa há»“ng KOL (%)</label>
 <input type="number" value={kolCommission} onChange={(e) => setKolCommission(Number(e.target.value))} className="w-full border border-slate-400 rounded-md p-2 text-sm bg-slate-50" />
 </div>
 </div>

 {/* PnL Projection Table */}
 {selectedProduct ? (
 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-600 tracking-widest">
 <th className="p-3 rounded-tl-lg">Má»‘c Ä‘Æ¡n</th>
 <th className="p-3">GiÃ¡ bÃ¡n/SP</th>
 <th className="p-3 text-right">Lá»£i nhuáº­n/SP</th>
 <th className="p-3 text-right rounded-tr-lg">Tá»•ng LN (Dá»± kiáº¿n)</th>
 </tr>
 </thead>
 <tbody className="text-sm">
 {tiers.sort((a, b) => a.quantity - b.quantity).map((tier, idx) => {
 const salePrice = selectedProduct.price * (1 - tier.discount / 100);
 // Deducting discounts based on SalePrice
 const netRevenue = salePrice * (1 - distributorDiscount / 100 - agentDiscount / 100 - kolCommission / 100);
 const profitPerItem = netRevenue - selectedProduct.costPrice;
 const totalProfit = profitPerItem * tier.quantity;

 return (
 <tr key={idx} className="border-b border-slate-200 last:border-0 hover:bg-slate-50/50">
 <td className="p-3 font-bold text-slate-900">{tier.quantity} x {tier.discount}%</td>
 <td className="p-3 font-mono text-orange-700">{formatCurrency(salePrice)}</td>
 <td className={cn("p-3 font-mono text-right font-bold", profitPerItem > 0 ? "text-emerald-600" : "text-rose-600")}>
 {formatCurrency(profitPerItem)}
 </td>
 <td className={cn("p-3 font-mono text-right font-black", totalProfit > 0 ? "text-emerald-600" : "text-rose-600")}>
 {formatCurrency(totalProfit)}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 <p className="text-[10px] text-slate-500 mt-2 italic">* Lá»£i nhuáº­n = GiÃ¡ sau KM - (C/K NCC + C/K Äáº¡i lÃ½ + HH KOL) - GiÃ¡ vá»‘n</p>
 </div>
 ) : (
 <div className="text-center py-6 text-sm text-slate-600 bg-slate-50 rounded-lg flex flex-col items-center gap-2">
 <Package className="w-8 h-8 text-slate-500" />
 Vui lÃ²ng chá»n Sáº£n pháº©m triá»ƒn khai á»Ÿ trÃªn Ä‘á»ƒ xem P&L.
 </div>
 )}
 </div>
 </form>
 </div>
 
 <div className="mt-6 pt-4 border-t border-slate-200 shrink-0">
 <button className="w-full bg-rose-600 text-[#FAF9F5] p-3 rounded-lg font-bold shadow-sm shadow-rose-500/25 hover:bg-rose-700 transition flex items-center justify-center gap-2">
 <Zap className="w-5 h-5 fill-current" /> Khá»Ÿi cháº¡y Mua Chung Sáº­p GiÃ¡
 </button>
 </div>
 </div>
 </div>
 )}

 {isModalOpen && activeTab === 'flash_sale' && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-sm max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
 <div className="flex justify-between items-center mb-6 shrink-0">
 <div className="flex items-center gap-2 text-orange-600">
 <Zap className="w-5 h-5 fill-current" />
 <h2 className="text-lg font-bold text-[#111827]">Táº¡o Flash Sale</h2>
 </div>
 <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
 <X className="w-5 h-5" />
 </button>
 </div>
 
 <form className="space-y-4">
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">TÃªn chiáº¿n dá»‹ch Flash Sale</label>
 <input type="text" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" placeholder="Deal khá»§ng giá»¯a thÃ¡ng..." required />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Thá»i gian Báº¯t Ä‘áº§u</label>
 <input type="datetime-local" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" required />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Thá»i gian Káº¿t thÃºc</label>
 <input type="datetime-local" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" required />
 </div>
 </div>

 <div className="bg-slate-50 p-4 border border-slate-300 rounded-lg">
 <h4 className="text-sm font-bold text-slate-900 mb-2">ThÃªm Sáº£n pháº©m Flash Sale</h4>
 <div className="flex gap-2 mb-3">
 <select className="flex-1 border border-slate-400 rounded-lg p-2 text-sm bg-white" required>
 <option value="">-- Chá»n sáº£n pháº©m tham gia --</option>
 {MOCK_PRODUCTS.map(p => (
 <option key={p.id} value={p.id}>{p.name} (Gá»‘c: {formatCurrency(p.price)})</option>
 ))}
 </select>
 <input type="number" placeholder="Giáº£m giÃ¡ (%)" className="w-24 border border-slate-400 rounded-lg p-2 text-sm" />
 <input type="number" placeholder="Giá»›i háº¡n (SP)" className="w-32 border border-slate-400 rounded-lg p-2 text-sm" />
 <button type="button" className="bg-slate-800 text-[#FAF9F5] px-3 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 transition"><Plus className="w-4 h-4"/></button>
 </div>
 <div className="text-[11px] text-slate-600 italic mb-3">ThÃªm 1 hoáº·c nhiá»u sáº£n pháº©m vá»›i má»©c giáº£m giÃ¡ khÃ¡c nhau...</div>
 
 {/* Table preview for added flash sale products */}
 <div className="bg-white border text-sm border-slate-300 rounded-lg overflow-x-auto min-w-0">
 <table className="w-full text-left">
 <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase">
 <tr>
 <th className="px-3 py-2">Sáº£n pháº©m</th>
 <th className="px-3 py-2 text-right">Giáº£m giÃ¡ (%)</th>
 <th className="px-3 py-2 text-right">SL Giá»›i háº¡n</th>
 <th className="px-3 py-2"></th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-t border-slate-200">
 <td className="px-3 py-2 font-medium text-slate-800">iPhone 15 Pro Max 256GB</td>
 <td className="px-3 py-2 text-right font-bold text-rose-600">8%</td>
 <td className="px-3 py-2 text-right font-mono">100</td>
 <td className="px-3 py-2 text-right">
 <button type="button" className="text-rose-400 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 <button className="w-full bg-orange-600 text-[#FAF9F5] p-3 rounded-lg font-bold shadow-sm shadow-orange-500/25 hover:bg-orange-700 transition mt-4">
 LÆ°u & Khá»Ÿi cháº¡y Flash Sale
 </button>
 </form>
 </div>
 </div>
 )}

 {isModalOpen && activeTab === 'voucher' && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-sm max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
 <div className="flex justify-between items-center mb-6">
 <div className="flex items-center gap-2 text-emerald-600">
 <Ticket className="w-5 h-5 fill-current" />
 <h2 className="text-lg font-bold text-[#111827]">Táº¡o Voucher Má»›i</h2>
 </div>
 <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-slate-700">
 <X className="w-5 h-5" />
 </button>
 </div>
 
 <form className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">MÃ£ Voucher (Code)</label>
 <input type="text" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm uppercase font-mono" placeholder="VD: SIEUSALE50" required />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">PhÃ¢n loáº¡i Voucher</label>
 <select 
 className="w-full border border-slate-400 rounded-lg p-2.5 text-sm bg-white" 
 required
 value={voucherType}
 onChange={(e) => setVoucherType(e.target.value as any)}
 >
 <option value="admin">Voucher SÃ n (DÃ¹ng toÃ n há»‡ thá»‘ng)</option>
 <option value="seller">Voucher NhÃ  bÃ¡n (Shop cá»¥ thá»ƒ)</option>
 <option value="shipping">Voucher Váº­n chuyá»ƒn</option>
 </select>
 </div>
 </div>

 {voucherType === 'seller' && (
 <div className="bg-slate-50 p-4 border border-slate-300 rounded-lg">
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-2">Ãp dá»¥ng cho NhÃ  bÃ¡n / Cá»­a hÃ ng</label>
 <div className="max-h-40 overflow-y-auto border border-slate-300 rounded bg-white">
 {MOCK_SELLERS.length > 0 ? MOCK_SELLERS.map(seller => (
 <label key={seller.id} className="flex items-center gap-3 p-3 border-b border-slate-200 hover:bg-slate-50 cursor-pointer last:border-b-0">
 <input 
 type="checkbox" 
 className="w-4 h-4 text-orange-700 rounded border-slate-400 focus:ring-orange-600"
 checked={selectedSellers.includes(seller.id)}
 onChange={(e) => {
 if (e.target.checked) {
 setSelectedSellers([...selectedSellers, seller.id]);
 } else {
 setSelectedSellers(selectedSellers.filter(id => id !== seller.id));
 }
 }}
 />
 <div>
 <p className="text-sm font-bold text-slate-900">{seller.name}</p>
 <p className="text-[10px] text-slate-600">MÃ£: {seller.id}</p>
 </div>
 </label>
 )) : (
 <div className="p-4 text-center text-sm text-slate-600">ChÆ°a cÃ³ dá»¯ liá»‡u nhÃ  bÃ¡n</div>
 )}
 </div>
 </div>
 )}

 <div className="grid grid-cols-3 gap-4">
 <div className="col-span-1">
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Loáº¡i Giáº£m GiÃ¡</label>
 <select className="w-full border border-slate-400 rounded-lg p-2.5 text-sm bg-white" required>
 <option value="percent">Giáº£m theo %</option>
 <option value="fixed">Giáº£m sá»‘ tiá»n cá»‘ Ä‘á»‹nh</option>
 </select>
 </div>
 <div className="col-span-2">
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Má»©c Giáº£m TÆ°Æ¡ng á»¨ng</label>
 <input type="number" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" placeholder="VD: 50000 (VND) hoáº·c 10 (%)" required />
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">GiÃ¡ Trá»‹ ÄÆ¡n Tá»‘i Thiá»ƒu (VND)</label>
 <input type="number" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" placeholder="0 náº¿u khÃ´ng yÃªu cáº§u" />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Giáº£m Tá»‘i Äa (VND) (Chá»‰ dÃ¹ng cho %)</label>
 <input type="number" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" placeholder="Äá»ƒ trá»‘ng náº¿u khÃ´ng giá»›i háº¡n" />
 </div>
 </div>

 <div className="grid grid-cols-3 gap-4">
 <div className="col-span-1">
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Sá»‘ lÆ°á»£t sá»­ dá»¥ng</label>
 <input type="number" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" placeholder="VD: 1000" />
 </div>
 <div className="col-span-1">
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Thá»i gian Báº¯t Ä‘áº§u</label>
 <input type="datetime-local" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" required />
 </div>
 <div className="col-span-1">
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">Thá»i gian Káº¿t thÃºc</label>
 <input type="datetime-local" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm" required />
 </div>
 </div>

 <button className="w-full bg-emerald-600 text-[#FAF9F5] p-3 rounded-lg font-bold shadow-sm shadow-emerald-500/25 hover:bg-emerald-700 transition mt-4">
 PhÃ¡t hÃ nh Voucher
 </button>
 </form>
 </div>
 </div>
 )}

 {/* Stats - Hide if Voucher Tab is active */}
 {activeTab !== 'voucher' && (
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
 <Users2 className="w-5 h-5" />
 </div>
 <span className="text-[10px] text-rose-600 font-bold">HOT NEW</span>
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">TrÆ°á»Ÿng nhÃ³m KOL tham gia</p>
 <div className="text-2xl font-bold text-[#111827]">24</div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
 <Zap className="w-5 h-5" />
 </div>
 <span className="text-[10px] text-[#2563EB] font-bold">Live Deal</span>
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Flash Sale Äang cháº¡y</p>
 <div className="text-2xl font-bold text-[#111827]">03</div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-slate-100 text-orange-700 rounded-lg">
 <TrendingUp className="w-5 h-5" />
 </div>
 <span className="text-[10px] text-[#10B981] font-bold">+28%</span>
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">NgÆ°á»i dÃ¹ng tham gia mua</p>
 <div className="text-2xl font-bold text-[#111827]">15,400</div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
 <BarChart2 className="w-5 h-5" />
 </div>
 <span className="text-[10px] text-[#10B981] font-bold">+18.5% Margin</span>
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">PnL Hiá»‡u quáº£ TÃ­ch lÅ©y</p>
 <div className="text-2xl font-bold text-[#111827]">{formatCurrency(850000000)}</div>
 </div>
 </DraggableGrid>
 )}

 {/* Main Content Areas */}
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 {activeTab !== 'voucher' ? (
 <>
 <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="TÃ¬m chiáº¿n dá»‹ch giáº£m giÃ¡..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Lá»c
 </button>
 </div>
 </div>

 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Chiáº¿n dá»‹ch Group Buy / Flash Sale</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Tiáº¿n Ä‘á»™ ngÆ°á»i tham gia</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Khuyáº¿n mÃ£i hiá»‡n táº¡i</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Hiá»‡u quáº£ PnL</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Tráº¡ng thÃ¡i</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {MOCK_FLASH_SALES.filter(c => c.type === activeTab).map((campaign) => (
 <tr key={campaign.id} className="hover:bg-[#F9FAFB] group transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className={cn(
 "p-3 rounded-lg flex items-center justify-center shrink-0",
 campaign.type === 'group_buy' ? "bg-rose-50 text-rose-600" : "bg-orange-50 text-orange-600"
 )}>
 {campaign.type === 'group_buy' ? <Users2 className="w-5 h-5" /> : <Zap className="w-5 h-5 fill-current" />}
 </div>
 <div>
 <p className="text-sm font-semibold text-[#111827]">{campaign.name}</p>
 <div className="flex items-center gap-2 mt-1">
 <span className={cn(
 "text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded flex items-center gap-1",
 campaign.type === 'group_buy' ? "bg-rose-100 text-rose-600" : "bg-orange-100 text-orange-600"
 )}>
 {campaign.type === 'group_buy' ? <><Users2 className="w-3 h-3"/> MUA CHUNG</> : <><Zap className="w-3 h-3"/> FLASH SALE</>}
 </span>
 {campaign.kolName && (
 <span className="text-[10px] text-slate-600 flex items-center gap-1">ðŸŽ¤ {campaign.kolName}</span>
 )}
 </div>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 {campaign.type === 'group_buy' && campaign.requiredParticipants ? (
 <div className="space-y-1.5 w-48">
 <div className="flex justify-between text-[10px] font-medium">
 <span className="text-slate-700">{campaign.currentParticipants} ngÆ°á»i</span>
 <span className="text-rose-600 font-bold whitespace-nowrap">Má»¥c tiÃªu: {campaign.requiredParticipants}</span>
 </div>
 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
 <div 
 className="h-full bg-rose-500 rounded-full" 
 style={{ width: `${Math.min(((campaign.currentParticipants || 0) / campaign.requiredParticipants) * 100, 100)}%` }}
 />
 </div>
 </div>
 ) : (
 <span className="text-xs text-slate-600 italic">KhÃ´ng Ã¡p dá»¥ng</span>
 )}
 </td>
 <td className="px-6 py-4 text-right">
 {campaign.type === 'group_buy' ? (
 <>
 <p className="text-lg font-black text-rose-600 border-rose-200">-{Math.min((campaign.baseDiscount || 0) + Math.floor((campaign.currentParticipants || 0) / 100), campaign.maxDiscount || 0)}%</p>
 <p className="text-[10px] text-[#6B7280]">Khá»Ÿi Ä‘iá»ƒm: -{campaign.baseDiscount}%</p>
 </>
 ) : (
 <p className="text-sm font-bold text-slate-900">Cá»‘ Ä‘á»‹nh / Khung giá»</p>
 )}
 </td>
 <td className="px-6 py-4">
 <div className="flex flex-col items-center">
 <div className="flex items-center gap-1.5">
 <span className="text-sm font-bold text-emerald-600">{campaign.roi > 0 ? '+' + formatCurrency(campaign.gmvGenerated * 0.185) : '--'}</span>
 </div>
 <p className="text-[10px] text-[#6B7280]">GMV: {formatCurrency(campaign.gmvGenerated)}</p>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap",
 campaign.status === 'active' ? "bg-emerald-50 text-emerald-600" :
 campaign.status === 'upcoming' ? "bg-slate-100 text-orange-700" : "bg-slate-100 text-slate-500"
 )}>
 {campaign.status === 'active' ? 'ÄANG CHáº Y' : 
 campaign.status === 'upcoming' ? 'Sáº®P DIá»„N RA' : 'ÄÃƒ Káº¾T THÃšC'}
 </span>
 </td>
 </tr>
 ))}
 {MOCK_FLASH_SALES.filter(c => c.type === activeTab).length === 0 && (
 <tr>
 <td colSpan={5} className="text-center py-8 text-slate-600 text-sm">KhÃ´ng cÃ³ chiáº¿n dá»‹ch nÃ o</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </>
 ) : (
 <>
 <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="TÃ¬m theo mÃ£ code, tÃªn ngÆ°á»i táº¡o..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Má»©c Giáº£m & Tráº¡ng thÃ¡i
 </button>
 </div>
 </div>
 
 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">MÃ£ Voucher</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nguá»“n (Admin/NhÃ  bÃ¡n)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Chi tiáº¿t Giáº£m giÃ¡</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">LÆ°á»£t SC & Háº¡n sá»­ dá»¥ng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Tráº¡ng thÃ¡i</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {MOCK_VOUCHERS.map(voucher => (
 <tr key={voucher.id} className="hover:bg-[#F9FAFB] transition-colors">
 <td className="px-6 py-4">
 <div className="flex items-center gap-3">
 <div className={cn(
 "p-2.5 rounded-lg border border-dashed border-2",
 voucher.creatorType === 'admin' ? "border-emerald-200 bg-emerald-50 text-emerald-600" : "border-orange-200 bg-slate-100 text-orange-700"
 )}>
 <Ticket className="w-5 h-5" />
 </div>
 <div>
 <p className="font-mono text-base font-black text-slate-900 tracking-wide">{voucher.code}</p>
 <p className="text-[10px] text-slate-600 mt-0.5">Giáº£m tá»‘i Ä‘a {formatCurrency(voucher.maxDiscount || voucher.value)}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 {voucher.creatorType === 'admin' ? (
 <ShieldCheck className="w-4 h-4 text-emerald-500" />
 ) : voucher.creatorType === 'shipping' ? (
 <Package className="w-4 h-4 text-purple-500" />
 ) : (
 <Store className="w-4 h-4 text-orange-600" />
 )}
 <div>
 <p className="text-xs font-bold text-slate-800">{voucher.creatorName}</p>
 <p className="text-[10px] text-slate-500">
 {voucher.creatorType === 'admin' ? 'ToÃ n sÃ n' : voucher.creatorType === 'shipping' ? 'Váº­n chuyá»ƒn' : 'NhÃ  bÃ¡n'}
 </p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <p className="text-sm font-bold text-rose-600">
 {voucher.type === 'percent' ? `Giáº£m ${voucher.value}%` : `Giáº£m ${formatCurrency(voucher.value)}`}
 </p>
 <p className="text-[10px] text-slate-600">ÄÆ¡n tá»« {formatCurrency(voucher.minOrderValue || 0)}</p>
 </td>
 <td className="px-6 py-4">
 <div className="w-32 mb-1.5">
 <div className="flex justify-between text-[10px] font-medium mb-1">
 <span className="text-slate-700">{voucher.usedCount} lÆ°á»£t Ä‘Ã£ dÃ¹ng</span>
 <span className="text-slate-500">/{voucher.usageLimit}</span>
 </div>
 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div 
 className="h-full bg-slate-400 rounded-full" 
 style={{ width: `${(voucher.usedCount / voucher.usageLimit) * 100}%` }}
 />
 </div>
 </div>
 <div className="flex items-center gap-1 text-[10px] text-slate-500">
 <Clock className="w-3 h-3" /> HSD: {new Date(voucher.endDate).toLocaleDateString()}
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap",
 voucher.status === 'active' ? "bg-emerald-50 text-emerald-600" :
 voucher.status === 'upcoming' ? "bg-slate-100 text-orange-700" : "bg-slate-100 text-slate-500"
 )}>
 {voucher.status === 'active' ? 'ÄANG PHÃT HÃ€NH' : 
 voucher.status === 'upcoming' ? 'Sáº®P PHÃT HÃ€NH' : 'ÄÃƒ Háº¾T Háº N'}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </>
 )}
 </div>
 </div>
 );
}

