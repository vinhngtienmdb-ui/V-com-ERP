import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 ShieldCheck, 
 Scale, 
 AlertTriangle, 
 FileText, 
 Search, 
 Filter, 
 CheckCircle2, 
 XCircle, 
 Clock, 
 Eye, 
 MoreVertical,
 Gavel,
 ShieldAlert,
 Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BrandProtection, DisputeRequest } from '../types/erp';

const MOCK_BRANDS: BrandProtection[] = [
 { id: 'BRD-001', brandName: 'Samsung Official Store', ownerId: 'SEL-001', registrationDate: '10/01/2024', status: 'verified', documents: ['GPKD.pdf', 'Trademark.pdf'] },
 { id: 'BRD-002', brandName: 'Louis Vuitton Vietnam', ownerId: 'SEL-099', registrationDate: '01/03/2024', status: 'pending', documents: ['LV_Global_Auth.pdf'] },
];

const MOCK_DISPUTES: DisputeRequest[] = [
 { id: 'DSP-102', orderId: 'ORD-5541', type: 'counterfeit', reporterId: 'USR-882', evidence: ['img1.jpg', 'video.mp4'], status: 'investigating' },
 { id: 'DSP-103', orderId: 'ORD-8821', type: 'ip_infringement', reporterId: 'BRAND-OWNER-02', evidence: ['proof.pdf'], status: 'open' },
];

export function Compliance() {
 const [activeTab, setActiveTab] = useState<'brand' | 'dispute' | 'policy'>('brand');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">PhÃ¡p cháº¿ & Báº£o vá»‡ thÆ°Æ¡ng hiá»‡u</h1>
 <p className="text-sm text-[#6B7280] mt-1">Quáº£n lÃ½ báº£n quyá»n thÆ°Æ¡ng hiá»‡u, xá»­ lÃ½ tranh cháº¥p hÃ ng giáº£ vÃ  giÃ¡m sÃ¡t tuÃ¢n thá»§ sÃ n.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Download className="w-4 h-4" />
 Táº£i bÃ¡o cÃ¡o tuÃ¢n thá»§
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <ShieldCheck className="w-4 h-4" />
 ÄÄƒng kÃ½ báº£o quyá»n má»›i
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">ThÆ°Æ¡ng hiá»‡u Ä‘Ã£ báº£o quyá»n</span>
 <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">842</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">ÄÃ£ xÃ¡c thá»±c sá»Ÿ há»¯u trÃ­ tuá»‡</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Tranh cháº¥p Ä‘ang xá»­ lÃ½</span>
 <Gavel className="w-4 h-4 text-orange-500" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">15</div>
 <p className="text-[10px] text-orange-600 font-medium mt-1">Cáº§n Admin tháº©m Ä‘á»‹nh báº±ng chá»©ng</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Cáº£nh bÃ¡o vi pháº¡m (Policy)</span>
 <AlertTriangle className="w-4 h-4 text-red-500" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">124</div>
 <p className="text-[10px] text-red-600 font-medium mt-1">Sáº£n pháº©m bá»‹ gá»¡ bá» do vi pháº¡m</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Compliance Score</span>
 <Scale className="w-4 h-4 text-emerald-500" />
 </div>
 <div className="text-2xl font-bold text-emerald-600">98/100</div>
 <p className="text-[10px] text-[#6B7280] mt-1">Chá»‰ sá»‘ tuÃ¢n thá»§ phÃ¡p luáº­t sÃ n</p>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-[#F3F4F6]">
 {[
 { id: 'brand', label: 'Brand Portal (Báº£n quyá»n)', icon: ShieldCheck },
 { id: 'dispute', label: 'Giáº£i quyáº¿t Tranh cháº¥p', icon: Gavel },
 { id: 'policy', label: 'GiÃ¡m sÃ¡t TuÃ¢n thá»§', icon: ShieldAlert }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
 activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-slate-100/30" : "border-transparent text-[#6B7280] hover:text-[#111827]"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 <div className="p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="TÃ¬m thÆ°Æ¡ng hiá»‡u, mÃ£ tranh cháº¥p..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Lá»c tráº¡ng thÃ¡i
 </button>
 </div>
 </div>

 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse">
 <thead>
 {activeTab === 'brand' && (
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">TÃªn thÆ°Æ¡ng hiá»‡u</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">MÃ£ sá»Ÿ há»¯u</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">NgÃ y Ä‘Äƒng kÃ½</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Tá»‡p Ä‘Ã­nh kÃ¨m</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center">Tráº¡ng thÃ¡i</th>
 </tr>
 )}
 {activeTab === 'dispute' && (
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">MÃ£ tranh cháº¥p</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Loáº¡i vi pháº¡m</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">ÄÆ¡n hÃ ng / Äá»‘i tÆ°á»£ng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Báº±ng chá»©ng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center">Tráº¡ng thÃ¡i</th>
 </tr>
 )}
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {activeTab === 'brand' && MOCK_BRANDS.map(brand => (
 <tr key={brand.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-[#111827]">{brand.brandName}</p>
 <p className="text-[10px] text-slate-600 font-mono">Owner: {brand.ownerId}</p>
 </td>
 <td className="px-6 py-4 text-xs font-mono text-slate-700">{brand.id}</td>
 <td className="px-6 py-4 text-xs text-slate-600">{brand.registrationDate}</td>
 <td className="px-6 py-4">
 <div className="flex gap-2">
 {brand.documents.map((doc, idx) => (
 <span key={idx} className="px-2 py-0.5 bg-slate-100 text-[#6B7280] text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer hover:bg-slate-200">
 <FileText className="w-3 h-3" /> {doc}
 </span>
 ))}
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex justify-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
 brand.status === 'verified' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
 )}>
 {brand.status === 'verified' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
 {brand.status === 'verified' ? 'ÄÃƒ XÃC THá»°C' : 'ÄANG CHá»œ'}
 </span>
 </div>
 </td>
 </tr>
 ))}
 {activeTab === 'dispute' && MOCK_DISPUTES.map(dispute => (
 <tr key={dispute.id} className="hover:bg-slate-50 transition-colors text-xs">
 <td className="px-6 py-4 font-bold text-[#111827] font-mono">{dispute.id}</td>
 <td className="px-6 py-4 uppercase font-bold text-red-600">{dispute.type}</td>
 <td className="px-6 py-4">
 <p className="font-bold">Order: {dispute.orderId}</p>
 <p className="text-[10px] text-slate-600">NgÆ°á»i bÃ¡o: {dispute.reporterId}</p>
 </td>
 <td className="px-6 py-4 text-[#2563EB] font-medium cursor-pointer flex items-center gap-1">
 <Eye className="w-3.5 h-3.5" /> Xem {dispute.evidence.length} báº±ng chá»©ng
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold",
 dispute.status === 'investigating' ? "bg-slate-100 text-orange-700" : "bg-red-50 text-red-600"
 )}>
 {dispute.status.toUpperCase()}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div className="bg-slate-900 text-[#FAF9F5] p-8 rounded-lg overflow-hidden relative border border-slate-800">
 <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-3 bg-red-600 rounded-lg shadow-sm shadow-red-600/20">
 <ShieldAlert className="w-6 h-6" />
 </div>
 <h3 className="text-xl font-bold italic font-serif tracking-tight">AI Compliance Guardian</h3>
 </div>
 <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
 Há»‡ thá»‘ng tá»± Ä‘á»™ng rÃ  quÃ©t sáº£n pháº©m dá»±a trÃªn AI Ä‘á»ƒ phÃ¡t hiá»‡n tá»« khÃ³a cáº¥m, hÃ¬nh áº£nh nháº¡y cáº£m vÃ  cÃ¡c sáº£n pháº©m vi pháº¡m báº£n quyá»n thÆ°Æ¡ng hiá»‡u. Tá»± Ä‘á»™ng táº¡m khÃ³a cÃ¡c shop cÃ³ Compliance Score dÆ°á»›i 60.
 </p>
 <div className="flex gap-4 pt-4">
 <button className="px-8 py-3 bg-white text-slate-900 font-bold rounded-lg text-xs hover:bg-slate-100 transition-all uppercase tracking-widest">Cáº¥u hÃ¬nh Luáº­t sÃ n</button>
 <button className="px-8 py-3 border border-slate-700 font-bold rounded-lg text-xs hover:bg-slate-800 transition-all uppercase tracking-widest">Logs vi pháº¡m AI</button>
 </div>
 </div>
 <div className="hidden md:block">
 <div className="p-6 bg-slate-800/40 rounded-lg border border-slate-700/50 backdrop-blur-sm space-y-4">
 <h4 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
 <Clock className="w-3.5 h-3.5" /> Real-time Legal Feed
 </h4>
 <div className="space-y-3">
 {[1, 2].map(i => (
 <div key={i} className="flex gap-3 text-xs border-l-2 border-red-500 pl-4 py-1">
 <div>
 <p className="text-slate-400 font-bold">PhÃ¡t hiá»‡n Seller bÃ¡n hÃ ng giáº£ máº¡o (Counterfeit)</p>
 <p className="text-slate-600 text-[10px]">MÃ£ shop: SEL-0{i}42 â€¢ 5 phÃºt trÆ°á»›c</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

