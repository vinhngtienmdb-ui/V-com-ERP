import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 BadgeDollarSign, 
 TrendingUp, 
 CreditCard, 
 Clock, 
 CheckCircle2, 
 AlertCircle, 
 ArrowUpRight, 
 GanttChartSquare, 
 Wallet, 
 Zap,
 Info,
 ShieldCheck,
 Star,
 Banknote,
 PieChart
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { SellerCreditScore, EarlyPayoutRequest } from '../types/erp';

const MOCK_CREDITS: SellerCreditScore[] = [
 { sellerId: 'SEL-001', score: 850, tier: 'AAA', maxCreditLimit: 500000000, availableCredit: 350000000 },
 { sellerId: 'SEL-005', score: 720, tier: 'A', maxCreditLimit: 100000000, availableCredit: 92000000 },
];

const MOCK_PAYOUTS: EarlyPayoutRequest[] = [
 { id: 'EPR-01', sellerId: 'SEL-001', amount: 45000000, discountFee: 450000, requestDate: '17/03/2024', status: 'pending' },
 { id: 'EPR-02', sellerId: 'SEL-012', amount: 15400000, discountFee: 154000, requestDate: '16/03/2024', status: 'approved' },
];

export function SellerFinance() {
 const [activeTab, setActiveTab] = useState<'credit' | 'early_payout'>('credit');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Supply Chain Finance (Há»— trá»£ tÃ i chÃ­nh)</h1>
 <p className="text-sm text-[#6B7280] mt-1">Cháº¥m Ä‘iá»ƒm tÃ­n dá»¥ng Seller vÃ  cung cáº¥p cÃ¡c giáº£i phÃ¡p á»©ng vá»‘n nhanh, quay vÃ²ng vá»‘n linh hoáº¡t.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <PieChart className="w-4 h-4" />
 PhÃ¢n tÃ­ch rá»§i ro ná»£
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Zap className="w-4 h-4 fill-current" />
 Cáº¥u hÃ¬nh GÃ³i á»©ng vá»‘n
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-[#111827] text-[#FAF9F5] p-6 rounded-lg shadow-sm shadow-slate-900/10">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-slate-800 rounded-lg">
 <BadgeDollarSign className="w-6 h-6" />
 </div>
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tá»•ng dÆ° ná»£ Seller</span>
 </div>
 <div className="text-2xl font-bold">{formatCurrency(12540000000)}</div>
 <div className="mt-4 flex items-center gap-2 text-[10px] text-[#10B981] font-bold">
 <TrendingUp className="w-3 h-3" /> Tá»· lá»‡ ná»£ xáº¥u: 0.24%
 </div>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">YÃªu cáº§u á»©ng vá»‘n sá»›m (Early Payouts)</p>
 <div className="text-2xl font-bold text-[#111827]">42</div>
 <p className="text-[10px] text-amber-600 font-medium mt-1">12 yÃªu cáº§u Ä‘ang chá» duyá»‡t gáº¥p</p>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Doanh thu phÃ­ dá»‹ch vá»¥ TÃ i chÃ­nh</p>
 <div className="text-2xl font-bold text-[#2563EB]">{formatCurrency(450000000)}</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">PhÃ­ 1-2% giÃ¡ trá»‹ á»©ng vá»‘n</p>
 <Star className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-50/50" />
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Seller AAA (TÃ­n dá»¥ng cao)</p>
 <div className="text-2xl font-bold text-emerald-600">125</div>
 <p className="text-[10px] text-slate-500 mt-1">Äá»§ Ä‘iá»u kiá»‡n vay tháº¥u chi 0%</p>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-[#F3F4F6]">
 {[
 { id: 'credit', label: 'Xáº¿p háº¡ng TÃ­n dá»¥ng Seller', icon: ShieldCheck },
 { id: 'early_payout', label: 'Giáº£i ngÃ¢n sá»›m (Early Payout)', icon: Banknote },
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-8 py-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
 activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-slate-100/20" : "border-transparent text-[#6B7280] hover:text-[#111827]"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 <div className="p-6">
 {activeTab === 'credit' && (
 <div className="overflow-x-auto animate-in fade-in duration-300 min-w-0">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">MÃ£ Seller / TÃªn</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center">Điểm Tín dụng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Tier</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-right">Háº¡n má»©c (Max)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-right">Kháº£ dá»¥ng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Thao tÃ¡c</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {MOCK_CREDITS.map(credit => (
 <tr key={credit.sellerId} className="hover:bg-slate-50 transition-colors">
 <td className="px-3 py-2.5">
 <p className="text-sm font-bold text-[#111827]">{credit.sellerId}</p>
 <p className="text-[10px] text-[#6B7280]">Hiá»‡u suáº¥t thÃ¡ng: 9.2/10</p>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex flex-col items-center gap-2">
 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden max-w-[100px]">
 <div 
 className={cn("h-full rounded-full transition-all duration-700", 
 credit.score > 800 ? "bg-emerald-500" : credit.score > 600 ? "bg-[#2563EB]" : "bg-red-500"
 )} 
 style={{ width: `${(credit.score / 1000) * 100}%` }}
 />
 </div>
 <span className="text-[11px] font-bold text-slate-800">{credit.score}</span>
 </div>
 </td>
 <td className="px-3 py-2.5">
 <span className={cn(
 "px-3 py-1 rounded-lg text-[10px] font-bold italic tracking-widest",
 credit.tier === 'AAA' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-orange-700 border border-slate-300"
 )}>{credit.tier}</span>
 </td>
 <td className="px-6 py-4 text-right font-bold text-[#111827]">{formatCurrency(credit.maxCreditLimit)}</td>
 <td className="px-6 py-4 text-right font-bold text-[#2563EB]">{formatCurrency(credit.availableCredit)}</td>
 <td className="px-3 py-2.5">
 <button className="text-[10px] font-bold text-[#2563EB] bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-[#EAE7DF] transition-colors uppercase tracking-wider">Cáº¥p tÃ­n dá»¥ng</button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {activeTab === 'early_payout' && (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
 {MOCK_PAYOUTS.map(payout => (
 <div key={payout.id} className="p-6 bg-white border border-slate-300 rounded-lg shadow-sm space-y-4 hover:border-[#2563EB] transition-all group">
 <div className="flex justify-between items-start">
 <div className="p-2 bg-slate-100 rounded-lg group-hover:bg-slate-900 transition-colors">
 <ArrowUpRight className="w-5 h-5 text-[#2563EB] group-hover:text-[#FAF9F5]" />
 </div>
 <span className={cn(
 "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
 payout.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
 )}>{payout.status}</span>
 </div>
 <div>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{payout.id} â€¢ {payout.sellerId}</p>
 <h4 className="text-xl font-bold text-[#111827] mt-1">{formatCurrency(payout.amount)}</h4>
 <p className="text-[10px] text-red-600 font-bold mt-1">PhÃ­ kháº¥u trá»« (1%): -{formatCurrency(payout.discountFee)}</p>
 </div>
 <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
 <span className="text-[10px] text-slate-500 font-mono italic">NgÃ y yÃªu cáº§u: {payout.requestDate}</span>
 <button className="px-4 py-2 bg-slate-900 text-[#FAF9F5] text-[10px] font-bold rounded-lg hover:bg-slate-800 transition-all uppercase tracking-widest">Duyá»‡t giáº£i ngÃ¢n</button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="bg-slate-900 text-[#FAF9F5] p-10 rounded-lg relative overflow-hidden border border-slate-800 shadow-sm">
 <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
 <div className="space-y-6">
 <div className="flex items-center gap-4">
 <div className="p-4 bg-[#2563EB] rounded-lg shadow-sm shadow-slate-900/5">
 <GanttChartSquare className="w-8 h-8 text-[#FAF9F5]" />
 </div>
 <h3 className="text-3xl font-bold font-serif italic tracking-tight">Công cụ Đánh giá Tài chính</h3>
 </div>
 <p className="text-slate-500 text-base leading-relaxed">
 Thiáº¿t láº­p thuáº­t toÃ¡n cháº¥m Ä‘iá»ƒm tÃ­n nhiá»‡m (Internal Credit Rating) dá»±a trÃªn 24 chá»‰ sá»‘: doanh sá»‘ trung bÃ¬nh, tá»· lá»‡ hoÃ n tráº£, Ä‘Ã¡nh giÃ¡ cá»§a ngÆ°á»i mua, thÃ¢m niÃªn hoáº¡t Ä‘á»™ng vÃ  má»©c Ä‘á»™ tuÃ¢n thá»§ phÃ¡p luáº­t sÃ n.
 </p>
 <div className="pt-6 flex flex-wrap gap-4">
 <button className="px-8 py-4 bg-white text-slate-900 font-bold rounded-lg text-sm hover:bg-slate-100 transition-all shadow-sm shadow-white/5">Xem Model Cháº¥m Äiá»ƒm</button>
 <button className="px-8 py-4 border border-slate-700 text-[#FAF9F5] font-bold rounded-lg text-sm hover:bg-slate-800 transition-all">Lá»‹ch sá»­ cáº¥p vá»‘n Seller</button>
 </div>
 </div>
 <div className="hidden lg:flex justify-end">
 <div className="w-80 p-8 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 space-y-6 relative overflow-hidden">
 <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-orange-500" /> TÃ¬nh tráº¡ng thanh khoáº£n
 </h4>
 <div className="space-y-4">
 <div>
 <div className="flex justify-between text-[11px] font-bold mb-2">
 <span className="text-slate-500">Quá»¹ á»©ng vá»‘n sá»›m</span>
 <span className="text-orange-500">84%</span>
 </div>
 <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
 <div className="h-full bg-slate-800 rounded-full" style={{ width: '84%' }} />
 </div>
 </div>
 <div className="p-4 bg-white/5 rounded-lg border border-white/5">
 <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Dá»± bÃ¡o nhu cáº§u 48h tá»›i</p>
 <p className="text-lg font-bold text-[#FAF9F5] tracking-tight">{formatCurrency(4500000000)}</p>
 </div>
 </div>
 <CreditCard className="absolute -bottom-10 -right-10 w-48 h-48 text-[#FAF9F5]/5 -rotate-12" />
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

