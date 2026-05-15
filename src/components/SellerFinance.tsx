import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useEffect } from 'react';
import { payoutsRepo, type PayoutInput } from '../services/repositories';
import { orderBy } from 'firebase/firestore';
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

/** Map PayoutInput từ Firestore → EarlyPayoutRequest UI shape. */
function adaptPayout(p: PayoutInput): EarlyPayoutRequest {
 return {
   id: p.id,
   sellerId: p.sellerId,
   amount: p.amount,
   discountFee: p.fee ?? 0,
   requestDate: '',
   status: p.status as EarlyPayoutRequest['status'],
 };
}

export function SellerFinance() {
 const [activeTab, setActiveTab] = useState<'credit' | 'early_payout'>('credit');
 const [dbPayouts, setDbPayouts] = useState<EarlyPayoutRequest[]>([]);

 useEffect(() => {
   const unsub = payoutsRepo.subscribe([orderBy('createdAt', 'desc')], (items) => {
     setDbPayouts(items.map(adaptPayout));
   });
   return () => unsub();
 }, []);

 // Fallback MOCK_PAYOUTS khi DB rỗng (UX demo)
 const payouts = dbPayouts.length > 0 ? dbPayouts : MOCK_PAYOUTS;

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Supply Chain Finance (Hỗ trợ tài chính)</h1>
 <p className="text-sm text-[#6B7280] mt-1">Chấm điểm tín dụng Seller và cung cấp các giải pháp ứng vốn nhanh, quay vòng vốn linh hoạt.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <PieChart className="w-4 h-4" />
 Phân tích rủi ro nợ
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Zap className="w-4 h-4 fill-current" />
 Cấu hình Gói ứng vốn
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-[#111827] text-[#FAF9F5] p-6 rounded-lg shadow-sm shadow-slate-900/10">
 <div className="flex justify-between items-start mb-4">
 <div className="p-2 bg-slate-800 rounded-lg">
 <BadgeDollarSign className="w-6 h-6" />
 </div>
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tổng dư nợ Seller</span>
 </div>
 <div className="text-2xl font-bold">{formatCurrency(12540000000)}</div>
 <div className="mt-4 flex items-center gap-2 text-[10px] text-[#10B981] font-bold">
 <TrendingUp className="w-3 h-3" /> Tỷ lệ nợ xấu: 0.24%
 </div>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Yêu cầu ứng vốn sớm (Early Payouts)</p>
 <div className="text-2xl font-bold text-[#111827]">42</div>
 <p className="text-[10px] text-amber-600 font-medium mt-1">12 yêu cầu đang chờ duyệt gấp</p>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Doanh thu phí dịch vụ Tài chính</p>
 <div className="text-2xl font-bold text-[#2563EB]">{formatCurrency(450000000)}</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">Phí 1-2% giá trị ứng vốn</p>
 <Star className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-50/50" />
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Seller AAA (Tín dụng cao)</p>
 <div className="text-2xl font-bold text-emerald-600">125</div>
 <p className="text-[10px] text-slate-500 mt-1">Đủ điều kiện vay thấu chi 0%</p>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-[#F3F4F6]">
 {[
 { id: 'credit', label: 'Xếp hạng Tín dụng Seller', icon: ShieldCheck },
 { id: 'early_payout', label: 'Giải ngân sớm (Early Payout)', icon: Banknote },
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
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Mã Seller / Tên</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center">Credit Score</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Tier</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-right">Hạn mức (Max)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-right">Khả dụng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {MOCK_CREDITS.map(credit => (
 <tr key={credit.sellerId} className="hover:bg-slate-50 transition-colors">
 <td className="px-3 py-2.5">
 <p className="text-sm font-bold text-[#111827]">{credit.sellerId}</p>
 <p className="text-[10px] text-[#6B7280]">Hiệu suất tháng: 9.2/10</p>
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
 <button className="text-[10px] font-bold text-[#2563EB] bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-[#EAE7DF] transition-colors uppercase tracking-wider">Cấp tín dụng</button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {activeTab === 'early_payout' && (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
 {payouts.map(payout => (
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
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{payout.id} • {payout.sellerId}</p>
 <h4 className="text-xl font-bold text-[#111827] mt-1">{formatCurrency(payout.amount)}</h4>
 <p className="text-[10px] text-red-600 font-bold mt-1">Phí khấu trừ (1%): -{formatCurrency(payout.discountFee)}</p>
 </div>
 <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
 <span className="text-[10px] text-slate-500 font-mono italic">Ngày yêu cầu: {payout.requestDate}</span>
 <button className="px-4 py-2 bg-slate-900 text-[#FAF9F5] text-[10px] font-bold rounded-lg hover:bg-slate-800 transition-all uppercase tracking-widest">Duyệt giải ngân</button>
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
 <h3 className="text-3xl font-bold font-serif italic tracking-tight">Financial Scoring Engine</h3>
 </div>
 <p className="text-slate-500 text-base leading-relaxed">
 Thiết lập thuật toán chấm điểm tín nhiệm (Internal Credit Rating) dựa trên 24 chỉ số: doanh số trung bình, tỷ lệ hoàn trả, đánh giá của người mua, thâm niên hoạt động và mức độ tuân thủ pháp luật sàn.
 </p>
 <div className="pt-6 flex flex-wrap gap-4">
 <button className="px-8 py-4 bg-white text-slate-900 font-bold rounded-lg text-sm hover:bg-slate-100 transition-all shadow-sm shadow-white/5">Xem Model Chấm Điểm</button>
 <button className="px-8 py-4 border border-slate-700 text-[#FAF9F5] font-bold rounded-lg text-sm hover:bg-slate-800 transition-all">Lịch sử cấp vốn Seller</button>
 </div>
 </div>
 <div className="hidden lg:flex justify-end">
 <div className="w-80 p-8 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 space-y-6 relative overflow-hidden">
 <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-orange-500" /> Tình trạng thanh khoản
 </h4>
 <div className="space-y-4">
 <div>
 <div className="flex justify-between text-[11px] font-bold mb-2">
 <span className="text-slate-500">Quỹ ứng vốn sớm</span>
 <span className="text-orange-500">84%</span>
 </div>
 <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
 <div className="h-full bg-slate-800 rounded-full" style={{ width: '84%' }} />
 </div>
 </div>
 <div className="p-4 bg-white/5 rounded-lg border border-white/5">
 <p className="text-[10px] text-slate-600 font-bold uppercase mb-1">Dự báo nhu cầu 48h tới</p>
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

