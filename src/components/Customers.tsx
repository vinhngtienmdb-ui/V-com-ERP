import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 Users, 
 MessageSquare, 
 PhoneCall, 
 Globe, 
 Search, 
 Filter, 
 MoreHorizontal,
 ShoppingCart,
 DollarSign,
 History,
 ExternalLink,
 LifeBuoy,
 X,
 Mail,
 Smartphone,
 Sparkles,
 Trophy,
 Loader2,
 Copy,
 Check,
 Send,
 Settings,
 Lock,
 Unlock,
 Wallet,
 Kanban,
 List
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Customer } from '../types/erp';
import { generateCustomerCareMessage } from '../services/geminiService';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc, doc, updateDoc } from 'firebase/firestore';

const CopyButton = ({ value }: { value: string }) => {
 const [copied, setCopied] = useState(false);
 const handleCopy = () => {
 navigator.clipboard.writeText(value);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };
 return (
 <button 
 onClick={handleCopy}
 className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500 hover:text-orange-700"
 title="Copy"
 >
 {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
 </button>
 );
};

const CustomerDetailModal = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => {
 const [emailSubject, setEmailSubject] = useState<string>('');
 const [emailContent, setEmailContent] = useState<string>('');
 const [loadingAi, setLoadingAi] = useState(false);

 const handleGenerateAiMessage = async () => {
 setLoadingAi(true);
 try {
 const msg = await generateCustomerCareMessage(customer);
 // Try to parse a subject if AI returned something like "Subject: ..." or "TiÃªu Ä‘á»: ..."
 const subjectMatch = msg.match(/^(?:TiÃªu Ä‘á»|Subject):\s*(.+?)(?:\n|$)/i);
 if (subjectMatch) {
 setEmailSubject(subjectMatch[1].trim());
 setEmailContent(msg.replace(subjectMatch[0], '').trim());
 } else {
 setEmailSubject(`ChÆ°Æ¡ng trÃ¬nh tri Ã¢n khÃ¡ch hÃ ng ${customer.name}`);
 setEmailContent(msg.trim());
 }
 } finally {
 setLoadingAi(false);
 }
 };

 // Logic for tier progress (Mock)
 const nextTierThreshold = 50000000;
 const progressPercent = Math.min((customer.totalSpent / nextTierThreshold) * 100, 100);

 return (
 <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
 <div className="bg-white rounded-xl w-full max-w-4xl shadow-sm max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 shrink-0">
 <div className="flex items-center gap-3">
 <h2 className="text-xl font-bold text-[#111827]">Há»“ sÆ¡ KhÃ¡ch hÃ ng</h2>
 <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase flex items-center gap-1 border border-amber-200">
 <Trophy className="w-3 h-3" /> Háº¡ng VÃ ng
 </span>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
 </div>
 
 <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-1 space-y-4">
 <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center">
 <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold mb-4 mx-auto border-4 border-white shadow-sm">
 {customer.name.split(' ').pop()?.charAt(0)}
 </div>
 <h3 className="font-bold text-lg text-slate-900">{customer.name}</h3>
 <p className="text-sm text-slate-500 mb-4 font-mono">{customer.id}</p>
 <div className="space-y-2.5 text-sm">
 <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200"><Mail className="w-4 h-4 text-slate-500" /> <span className="truncate">{customer.email}</span></div>
 <div className="flex items-center gap-2 text-slate-700 bg-white p-2 rounded-lg border border-slate-200"><Smartphone className="w-4 h-4 text-slate-500" /> {customer.phone}</div>
 </div>
 </div>

 <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
 <div className="flex justify-between items-center mb-3">
 <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-widest">Má»¥c tiÃªu lÃªn háº¡ng</h4>
 <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{Math.round(progressPercent)}%</span>
 </div>
 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
 <div className="h-full bg-primary-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
 </div>
 <p className="text-[10px] text-slate-500 mt-2.5 text-center">TÃ­ch lÅ©y thÃªm <span className="font-bold text-slate-700">{formatCurrency(nextTierThreshold - customer.totalSpent)}</span> Ä‘á»ƒ lÃªn Kim CÆ°Æ¡ng</p>
 </div>
 
 <div className="p-4 bg-slate-100/50 rounded-xl border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="relative z-10">
 <h4 className="font-bold text-xs mb-3 text-blue-800 flex items-center gap-2">
 <Filter className="w-3.5 h-3.5" /> PhÃ¢n giáº£i RFM Score
 </h4>
 <div className="space-y-2.5">
 {[
 { label: 'Recency', score: 4.2, desc: 'Äá»™ gáº§n Ä‘Ã¢y' },
 { label: 'Frequency', score: 3.8, desc: 'Táº§n suáº¥t' },
 { label: 'Monetary', score: 4.5, desc: 'GiÃ¡ trá»‹' },
 ].map((item) => (
 <div key={item.label} className="space-y-1">
 <div className="flex justify-between items-center text-[10px]">
 <span className="text-orange-700 font-bold uppercase tracking-tighter">{item.label}</span> 
 <span className="font-black text-blue-900">{item.score}/5</span>
 </div>
 <div className="h-1 bg-[#EAE7DF] rounded-full overflow-hidden">
 <div className="h-full bg-slate-900 transition-all duration-1000" style={{ width: `${(item.score / 5) * 100}%` }} />
 </div>
 </div>
 ))}
 </div>
 </div>
 <Sparkles className="absolute -bottom-4 -right-4 w-16 h-16 text-blue-200/40 group-hover:rotate-12 transition-transform duration-500" />
 </div>

 <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 shadow-sm">
 <h4 className="font-bold text-xs mb-3 text-emerald-800 flex items-center gap-2">
 <DollarSign className="w-3.5 h-3.5" /> TÃ i sáº£n & ThÆ°á»Ÿng
 </h4>
 <div className="space-y-2">
 <div className="bg-white p-3 rounded-lg border border-emerald-100/50 relative overflow-hidden">
 <div className="flex justify-between items-center mb-1.5">
 <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">VÃ­ HoÃ n Tiá»n (Cashback)</span>
 <button className="text-[9px] text-[#FAF9F5] bg-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-emerald-700 relative z-10">RÃšT TIá»€N</button>
 </div>
 <span className="text-lg font-bold text-emerald-900 leading-none tracking-tight">{formatCurrency(customer.walletBalance || 0)}</span>
 </div>
 
 <div className="bg-white p-3 rounded-lg border border-blue-100/50 relative overflow-hidden">
 <div className="flex justify-between items-center mb-1.5">
 <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">VÃ­ Khuyáº¿n Máº¡i</span>
 <button className="text-[9px] text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-blue-50 relative z-10">Lá»‹ch sá»­</button>
 </div>
 <span className="text-lg font-bold text-blue-900 leading-none tracking-tight">{formatCurrency(150000)}</span>
 </div>

 <div className="bg-white p-3 rounded-lg border border-purple-100/50 relative overflow-hidden">
 <div className="flex justify-between items-center mb-1.5">
 <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">VÃ­ Äiá»ƒm Loyalty</span>
 <button className="text-[9px] text-[#FAF9F5] bg-purple-600 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-purple-700 relative z-10">Shop Äá»•i Äiá»ƒm</button>
 </div>
 <span className="text-lg font-bold text-purple-900 leading-none tracking-tight">{customer.points || 0} <span className="text-xs font-medium text-purple-600">pts</span></span>
 </div>
 
 <div className="pt-2">
   <button onClick={() => alert('Thao tÃ¡c má»Ÿ giao diá»‡n chuyá»ƒn Ä‘á»•i VÃ­ Cashback sang VÃ­ Khuyáº¿n máº¡i ( tá»· lá»‡ 1.1 )')} className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-bold uppercase rounded transition-colors flex justify-center items-center gap-1.5">
     <ShoppingCart className="w-3 h-3" /> Äá»”I HOÃ€N TIá»€N Láº¤Y KHUYáº¾N Máº I
   </button>
 </div>
 </div>
 </div>

 <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 shadow-sm">
 <h4 className="font-bold text-sm mb-3 text-purple-800 flex items-center gap-2"><Users className="w-4 h-4" /> Máº¡ng lÆ°á»›i Affiliate</h4>
 <div className="space-y-3">
 <div>
 <span className="text-[10px] text-purple-500 font-bold uppercase tracking-widest block mb-2">NgÆ°á»i giá»›i thiá»‡u (Upline)</span>
 <div className="flex items-center gap-2 bg-white rounded-md p-2 border border-purple-100">
 <div className="w-6 h-6 rounded-full bg-purple-100 border border-purple-200 flex flex-shrink-0 items-center justify-center text-purple-700 font-bold text-[10px]">
 {customer.referrerName ? customer.referrerName.split(' ').pop()?.charAt(0) : '?'}
 </div>
 <span className="text-xs font-bold text-purple-900 truncate">{customer.referrerName || 'KhÃ´ng cÃ³ ngÆ°á»i giá»›i thiá»‡u'}</span>
 </div>
 </div>
 <div className="h-px bg-purple-200/50"></div>
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-[10px] text-purple-500 font-bold uppercase tracking-widest block">Äá»™i nhÃ³m (Downline)</span>
 <button className="text-[10px] text-purple-600 font-bold uppercase hover:underline bg-white px-2 py-0.5 rounded shadow-sm">Xem chi tiáº¿t</button>
 </div>
 <div className="flex items-center gap-2">
 <div className="flex -space-x-2">
 {[1,2,3].slice(0, Math.min(customer.downlineCount || 0, 3)).map(i => (
 <div key={i} className="w-6 h-6 rounded-full bg-primary-100 border-2 border-white flex justify-center items-center text-[8px] font-bold text-primary-600 shadow-sm">U</div>
 ))}
 {(customer.downlineCount || 0) > 3 && (
 <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex justify-center items-center text-[8px] font-bold text-slate-700 shadow-sm">+{((customer.downlineCount || 0) - 3)}</div>
 )}
 {(customer.downlineCount || 0) === 0 && (
 <span className="text-xs text-purple-400 italic">ChÆ°a cÃ³ F1</span>
 )}
 </div>
 {(customer.downlineCount || 0) > 0 && <span className="text-sm font-bold text-purple-900">{customer.downlineCount} <span className="text-xs font-medium text-purple-700">F1 hoáº¡t Ä‘á»™ng</span></span>}
 </div>
 </div>
 </div>
 </div>
 </div>
 
 <div className="lg:col-span-2 space-y-6">
 <DraggableGrid className="grid grid-cols-2 gap-4" columns={2} gap={16}>
 <div className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm group">
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover:text-primary-500 transition-colors">Tá»•ng chi tiÃªu</p>
 <p className="text-2xl font-black text-slate-900">{formatCurrency(customer.totalSpent)}</p>
 </div>
 <div className="p-5 border border-slate-200 rounded-xl bg-white shadow-sm group">
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover:text-primary-500 transition-colors">Sá»‘ Ä‘Æ¡n hÃ ng</p>
 <div className="flex items-baseline gap-1">
 <span className="text-2xl font-black text-slate-900">{customer.orderCount}</span>
 <span className="text-xs font-bold text-slate-500">Ä‘Æ¡n</span>
 </div>
 </div>
 </DraggableGrid>
 
 <div className="bg-primary-50/50 border border-primary-100 p-6 rounded-xl relative overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 -mr-8 -mt-8 rounded-full opacity-50"></div>
 <div className="flex justify-between items-center mb-5 relative z-10">
 <h4 className="font-bold text-primary-900 flex items-center gap-2">
 <Sparkles className="w-5 h-5 text-primary-600" /> CSKH thÃ´ng minh (AI Assist)
 </h4>
 <button 
 onClick={handleGenerateAiMessage}
 disabled={loadingAi}
 className="text-[10px] bg-primary-600 text-[#FAF9F5] px-3 py-1.5 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm shadow-indigo-100"
 >
 {loadingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
 QUÃ‰T RFM & SOáº N TIN
 </button>
 </div>
 
 <div className="bg-white p-4 rounded-xl border border-primary-100/50 shadow-inner relative z-10 mb-4 focus-within:border-primary-300 transition-colors">
 <input 
 type="text" 
 placeholder="TiÃªu Ä‘á» email tá»± Ä‘á»™ng..." 
 className="w-full border-b border-slate-200 pb-2 mb-2 text-sm focus:outline-none font-bold text-slate-900 placeholder:font-normal placeholder:italic bg-transparent"
 value={emailSubject}
 readOnly={loadingAi}
 onChange={(e) => setEmailSubject(e.target.value)}
 />
 <textarea 
 className="w-full h-32 text-sm resize-none focus:outline-none text-slate-800 placeholder:italic bg-transparent scrollbar-hide"
 placeholder={loadingAi ? "AI Ä‘ang phÃ¢n tÃ­ch & soáº¡n tháº£o tháº£o phÃ¹ há»£p vá»›i phÃ¢n khÃºc khÃ¡ch hÃ ng..." : "Soáº¡n tháº£o ná»™i dung hoáº·c dÃ¹ng AI soáº¡n nhanh tÃ­ch há»£p dá»¯ liá»‡u CRM..."}
 value={emailContent}
 readOnly={loadingAi}
 onChange={(e) => setEmailContent(e.target.value)}
 />
 {loadingAi && (
 <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl backdrop-blur-[1px]">
 <div className="flex flex-col items-center gap-2">
 <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
 <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Äang soáº¡n tháº£o...</span>
 </div>
 </div>
 )}
 </div>
 
 <div className="flex justify-end gap-3 relative z-10">
 <button 
 disabled={!emailSubject || !emailContent || loadingAi}
 className="bg-primary-600 text-[#FAF9F5] px-6 py-3 rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2"
 onClick={() => {
 alert('Tin nháº¯n chÄƒm sÃ³c Ä‘Ã£ Ä‘Æ°á»£c gá»­i tá»›i ' + customer.email);
 }}
 >
 <Send className="w-3.5 h-3.5" /> Gá»¬I NGAY CHO {customer.name.toUpperCase()}
 </button>
 </div>
 </div>

 <div>
 <div className="flex items-center justify-between mb-4 px-1">
 <h4 className="font-bold flex items-center gap-2 text-slate-900 text-sm">
 <History className="w-4 h-4 text-primary-600" /> HÃ nh trÃ¬nh khÃ¡ch hÃ ng
 </h4>
 <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
 STATUS: <span className="text-primary-600 uppercase tracking-tighter bg-primary-50 px-1.5 py-0.5 rounded">TÃ­ch cá»±c</span>
 </div>
 </div>

 <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
 {customer.activities && customer.activities.length > 0 ? (
 customer.activities.map((item, idx) => {
 const getIcon = () => {
 switch(item.type) {
 case 'purchase': return <ShoppingCart className="w-3 h-3" />;
 case 'consultation': return <MessageSquare className="w-3 h-3" />;
 case 'rma': return <History className="w-3 h-3" />;
 default: return <LifeBuoy className="w-3 h-3" />;
 }
 };
 const getColor = () => {
 switch(item.type) {
 case 'purchase': return 'text-orange-700 bg-[#EAE7DF] border-orange-200';
 case 'consultation': return 'text-purple-600 bg-purple-100 border-purple-200';
 case 'rma': return 'text-red-600 bg-red-100 border-red-200';
 default: return 'text-slate-700 bg-slate-100 border-slate-300';
 }
 };

 return (
 <div key={item.id} className="flex gap-4 relative group">
 {idx < customer.activities!.length - 1 && (
 <div className="absolute left-[13px] top-7 w-[1px] h-full bg-slate-200 group-hover:bg-blue-300 transition-colors"></div>
 )}
 <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border shadow-sm transition-transform group-hover:scale-110", getColor())}>
 {getIcon()}
 </div>
 <div className="flex-1 bg-white p-3 rounded-lg border border-transparent group-hover:border-slate-300 group-hover:shadow-sm transition-all">
 <div className="flex items-center justify-between mb-1">
 <p className="text-xs font-bold text-[#111827]">{item.title}</p>
 <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{item.date}</span>
 </div>
 <p className="text-[11px] text-slate-600 leading-normal">{item.description}</p>
 <div className="mt-2 flex items-center justify-between">
 {item.status && (
 <span className={cn(
 "text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-full",
 item.status === 'HoÃ n thÃ nh' ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-50"
 )}>
 {item.status}
 </span>
 )}
 <button className="text-[9px] font-bold text-orange-700 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100">
 Sá»± kiá»‡n gá»‘c <ExternalLink className="w-2 h-2" />
 </button>
 </div>
 </div>
 </div>
 );
 })
 ) : (
 <div className="text-center py-12 bg-white rounded-lg border border-dashed border-slate-300">
 <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
 <p className="text-xs text-slate-500 italic">ChÆ°a cÃ³ dá»¯ liá»‡u hoáº¡t Ä‘á»™ng cho khÃ¡ch hÃ ng nÃ y.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

const AiMessageQuickModal = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => {
 const [aiMessage, setAiMessage] = useState<string | null>(null);
 const [loadingAi, setLoadingAi] = useState(false);

 const handleGenerate = async () => {
 setLoadingAi(true);
 try {
 const msg = await generateCustomerCareMessage(customer);
 setAiMessage(msg);
 } finally {
 setLoadingAi(false);
 }
 };

 return (
 <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
 <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-sm animate-in zoom-in-95 duration-200">
 <div className="flex justify-between items-start mb-6">
 <div>
 <h3 className="text-xl font-black text-[#111827]">ChÄƒm sÃ³c AI: {customer.name}</h3>
 <p className="text-xs text-slate-600 font-medium mt-1">Há»‡ thá»‘ng sáº½ dá»±a trÃªn RFM & lá»‹ch sá»­ mua hÃ ng Ä‘á»ƒ soáº¡n tin.</p>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
 <X className="w-6 h-6" />
 </button>
 </div>

 <div className="bg-primary-50/50 border border-primary-100 p-6 rounded-lg min-h-[180px] flex flex-col items-center justify-center text-center relative mb-6">
 {loadingAi ? (
 <div className="flex flex-col items-center gap-3">
 <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
 <p className="text-xs font-bold text-primary-600 animate-pulse">Äang phÃ¢n tÃ­ch dá»¯ liá»‡u khÃ¡ch hÃ ng...</p>
 </div>
 ) : aiMessage ? (
 <div className="w-full">
 <p className="text-sm text-slate-800 leading-relaxed text-left whitespace-pre-line italic">"{aiMessage}"</p>
 </div>
 ) : (
 <div className="flex flex-col items-center gap-4">
 <Sparkles className="w-10 h-10 text-primary-300" />
 <button 
 onClick={handleGenerate}
 className="bg-primary-600 text-[#FAF9F5] px-6 py-2.5 rounded-lg font-bold hover:bg-primary-700 shadow-sm shadow-indigo-200 transition-all flex items-center gap-2"
 >
 <Sparkles className="w-4 h-4" /> Soáº¡n tin nháº¯n cÃ¡ nhÃ¢n hÃ³a
 </button>
 </div>
 )}
 </div>

 {aiMessage && (
 <div className="flex gap-3">
 <button 
 onClick={() => {
 navigator.clipboard.writeText(aiMessage);
 alert('ÄÃ£ copy tin nháº¯n!');
 }}
 className="flex-1 py-3 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
 >
 Sao chÃ©p ná»™i dung
 </button>
 <button 
 className="flex-1 py-3 bg-primary-600 text-[#FAF9F5] rounded-lg text-sm font-bold hover:bg-primary-700 transition-all shadow-sm shadow-indigo-100"
 onClick={() => {
 alert('Tin nháº¯n Ä‘Ã£ Ä‘Æ°á»£c chuyá»ƒn sang module Omnichannel Chat!');
 onClose();
 }}
 >
 DÃ¹ng tin nháº¯n nÃ y
 </button>
 </div>
 )}
 </div>
 </div>
 );
};

const CustomerConfigModal = ({ onClose }: { onClose: () => void }) => {
 const [activeTab, setActiveTab] = useState<'tier' | 'points' | 'tags' | 'sources'>('tier');
 return (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl w-full max-w-3xl shadow-sm overflow-hidden animate-in zoom-in duration-300">
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-[#EAE7DF] text-orange-700 rounded-lg">
 <Settings className="w-5 h-5" />
 </div>
 <div>
 <h2 className="text-xl font-bold text-slate-900">Cáº¥u hÃ¬nh KhÃ¡ch hÃ ng (CRM)</h2>
 <p className="text-xs text-slate-600">Quáº£n lÃ½ háº¡ng tháº», phÃ¢n nhÃ³m vÃ  cáº¥u hÃ¬nh thu tháº­p dá»¯ liá»‡u</p>
 </div>
 </div>
 <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-600">
 <X className="w-6 h-6" />
 </button>
 </div>
 
 <div className="flex border-b border-slate-300">
 {[
 { id: 'tier', label: 'Háº¡ng thÃ nh viÃªn' },
 { id: 'points', label: 'TÃ­ch Ä‘iá»ƒm' },
 { id: 'tags', label: 'Tháº» phÃ¢n loáº¡i' },
 { id: 'sources', label: 'Nguá»“n khÃ¡ch hÃ ng' }
 ].map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-6 py-4 text-sm font-bold border-b-2 transition-all",
 activeTab === tab.id ? "border-slate-900 text-orange-700" : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-400"
 )}
 >
 {tab.label}
 </button>
 ))}
 </div>

 <div className="p-8 min-h-[300px] bg-slate-50 max-h-[60vh] overflow-y-auto">
 {activeTab === 'tier' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-slate-900">Danh sÃ¡ch Háº¡ng thÃ nh viÃªn</h3>
 <button className="px-4 py-2 bg-slate-900 text-[#FAF9F5] rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">
 + ThÃªm háº¡ng thÃ nh viÃªn
 </button>
 </div>
 <div className="space-y-3">
 <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex justify-between items-center">
 <div>
 <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
 <Trophy className="w-4 h-4 text-slate-500" /> Háº¡ng Báº¡c (Máº·c Ä‘á»‹nh)
 </h4>
 <p className="text-xs text-slate-600 mt-1">Chi tiÃªu tá»«: 0Ä‘</p>
 </div>
 <div className="flex gap-2">
 <button className="text-xs text-orange-700 font-medium hover:underline">Sá»­a</button>
 </div>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex justify-between items-center">
 <div>
 <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
 <Trophy className="w-4 h-4 text-yellow-500" /> Háº¡ng VÃ ng
 </h4>
 <p className="text-xs text-slate-600 mt-1">Chi tiÃªu tá»«: 10,000,000Ä‘</p>
 </div>
 <div className="flex gap-2">
 <button className="text-xs text-orange-700 font-medium hover:underline">Sá»­a</button>
 </div>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex justify-between items-center">
 <div>
 <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
 <Trophy className="w-4 h-4 text-sky-400" /> Háº¡ng Kim CÆ°Æ¡ng
 </h4>
 <p className="text-xs text-slate-600 mt-1">Chi tiÃªu tá»«: 50,000,000Ä‘</p>
 </div>
 <div className="flex gap-2">
 <button className="text-xs text-orange-700 font-medium hover:underline">Sá»­a</button>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'points' && (
 <div className="space-y-6">
 <h3 className="font-bold text-slate-900">Cáº¥u hÃ¬nh TÃ­ch Ä‘iá»ƒm & TiÃªu Ä‘iá»ƒm</h3>
 <DraggableGrid className="grid grid-cols-2 gap-4" columns={2} gap={16}>
 <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-300">
 <h4 className="font-bold text-sm text-slate-800 mb-2 border-b border-slate-200 pb-2">Tá»‰ lá»‡ tÃ­ch Ä‘iá»ƒm</h4>
 <div>
 <label className="text-xs font-bold text-slate-600">Giá»›i háº¡n thá»i gian (ThÃ¡ng)</label>
 <input type="number" defaultValue={12} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none" />
 </div>
 <div>
 <label className="text-xs font-bold text-slate-600">Chi tiÃªu (VNÄ) = Báº±ng</label>
 <div className="flex items-center gap-2 mt-1">
 <input type="number" defaultValue={100000} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none" />
 <span className="text-sm font-bold text-slate-700">=</span>
 <input type="number" defaultValue={10} className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none placeholder:text-slate-500" />
 <span className="text-xs text-slate-600">Äiá»ƒm</span>
 </div>
 </div>
 </div>
 <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-300">
 <h4 className="font-bold text-sm text-slate-800 mb-2 border-b border-slate-200 pb-2">Tá»‰ lá»‡ tiÃªu Ä‘iá»ƒm (Thanh toÃ¡n)</h4>
 <div>
 <label className="text-xs font-bold text-slate-600">1 Äiá»ƒm tÆ°Æ¡ng Ä‘Æ°Æ¡ng (VNÄ)</label>
 <input type="number" defaultValue={100} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none" />
 </div>
 <div>
 <label className="text-xs font-bold text-slate-600">Tá»‘i Ä‘a sá»­ dá»¥ng / ÄÆ¡n hÃ ng (%)</label>
 <input type="number" defaultValue={50} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none" />
 </div>
 </div>
 </DraggableGrid>
 <div className="flex justify-end">
 <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-[#FAF9F5] font-bold text-sm rounded-lg hover:bg-slate-800">LÆ°u cáº¥u hÃ¬nh</button>
 </div>
 </div>
 )}

 {activeTab === 'tags' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div>
 <h3 className="font-bold text-slate-900">Tháº» phÃ¢n loáº¡i Æ°u tiÃªn (VIP, Fraud...)</h3>
 <p className="text-xs text-slate-600 mt-1">Cáº¥u hÃ¬nh cÃ¡c tag mÃ u Ä‘á»ƒ lÃ m ná»•i báº­t khÃ¡ch hÃ ng trong há»‡ thá»‘ng.</p>
 </div>
 <button className="px-4 py-2 bg-slate-900 text-[#FAF9F5] rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">
 + ThÃªm tháº»
 </button>
 </div>
 <div className="space-y-3">
 <div className="bg-white p-4 rounded-lg border border-slate-300 flex justify-between items-center">
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">#FRAUD / SPAM</span>
 <p className="text-xs text-slate-600">KhÃ¡ch hÃ ng cÃ³ lá»‹ch sá»­ bom hÃ ng, lá»«a Ä‘áº£o.</p>
 </div>
 <button className="text-xs text-slate-500 hover:text-red-500 font-medium">XÃ³a</button>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-300 flex justify-between items-center">
 <div className="flex items-center gap-3">
 <span className="px-3 py-1 bg-[#EAE7DF] text-orange-800 rounded-full text-xs font-bold border border-orange-200">#KOL / INFLUENCER</span>
 <p className="text-xs text-slate-600">NgÆ°á»i cÃ³ áº£nh hÆ°á»Ÿng, cáº§n chÄƒm sÃ³c Ä‘áº·c biá»‡t.</p>
 </div>
 <button className="text-xs text-slate-500 hover:text-red-500 font-medium">XÃ³a</button>
 </div>
 </div>
 </div>
 )}
 
 {activeTab === 'sources' && (
 <div className="space-y-6">
 <div className="flex justify-between items-center bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div>
 <h3 className="font-bold text-slate-900">Cáº¥u hÃ¬nh Nguá»“n Tracking</h3>
 <p className="text-xs text-slate-600 mt-1">Äá»“ng bá»™ dá»¯ liá»‡u khÃ¡ch hÃ ng tá»« cÃ¡c ná»n táº£ng tá»± Ä‘á»™ng.</p>
 </div>
 <button className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
 + Káº¿t ná»‘i Nguá»“n má»›i
 </button>
 </div>
 
 <DraggableGrid className="grid grid-cols-2 gap-4" columns={2} gap={16}>
 <div className="p-4 rounded-lg border border-emerald-500 bg-emerald-50 relative overflow-hidden group">
 <h4 className="font-bold text-emerald-900">Landing Page Ná»‡m Foam</h4>
 <p className="text-xs text-emerald-700 mt-1">Äang hoáº¡t Ä‘á»™ng (Tá»± Ä‘á»™ng sync qua Webhook)</p>
 <div className="mt-3 flex items-center justify-between">
 <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded">240 Leads</span>
 <button className="text-emerald-700 text-[10px] font-bold uppercase hover:underline">Chá»‰nh sá»­a</button>
 </div>
 </div>
 <div className="p-4 rounded-lg border border-slate-300 bg-white relative overflow-hidden group">
 <h4 className="font-bold text-slate-900">Chiáº¿n dá»‹ch MÃ¹a HÃ¨ - Zalo Ads</h4>
 <p className="text-xs text-slate-600 mt-1">Táº¡m dá»«ng (Máº¥t káº¿t ná»‘i API)</p>
 <div className="mt-3 flex items-center justify-between">
 <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">0 Leads</span>
 <button className="text-orange-700 text-[10px] font-bold uppercase hover:underline">Káº¿t ná»‘i láº¡i</button>
 </div>
 </div>
 <div className="p-4 rounded-lg border border-slate-900 bg-slate-100 relative overflow-hidden group">
 <h4 className="font-bold text-blue-900">Facebook Shop</h4>
 <p className="text-xs text-orange-800 mt-1">Äang hoáº¡t Ä‘á»™ng (Sync qua Meta Graph API)</p>
 <div className="mt-3 flex items-center justify-between">
 <span className="text-xs font-bold text-orange-700 bg-white px-2 py-1 rounded">1,250 Leads</span>
 <button className="text-orange-800 text-[10px] font-bold uppercase hover:underline">Chá»‰nh sá»­a</button>
 </div>
 </div>
 </DraggableGrid>
 </div>
 )}
 </div>
 </div>
 </div>
 );
};

const AddCustomerModal = ({ onClose }: { onClose: () => void }) => {
 const [formData, setFormData] = useState({
 name: '',
 phone: '',
 email: '',
 channels: ['web']
 });
 const [isSubmitting, setIsSubmitting] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSubmitting(true);
 try {
 await addDoc(collection(db, 'customers'), {
 ...formData,
 status: 'active',
 totalSpent: 0,
 orderCount: 0,
 points: 0
 });
 onClose();
 } catch (error) {
 console.error(error);
 alert('ThÃªm khÃ¡ch hÃ ng tháº¥t báº¡i!');
 }
 setIsSubmitting(false);
 };

 return (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl w-full max-w-md shadow-sm overflow-hidden animate-in zoom-in duration-300">
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <h2 className="text-xl font-bold text-slate-900">ThÃªm KhÃ¡ch hÃ ng má»›i</h2>
 <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-600">
 <X className="w-5 h-5" />
 </button>
 </div>
 <form onSubmit={handleSubmit} className="p-6 space-y-4">
 <div>
 <label className="text-xs font-bold text-slate-600 mb-1 block">Há» vÃ  tÃªn *</label>
 <input 
 required
 type="text" 
 value={formData.name}
 onChange={e => setFormData({...formData, name: e.target.value})}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none" 
 placeholder="Nguyá»…n VÄƒn A"
 />
 </div>
 <div>
 <label className="text-xs font-bold text-slate-600 mb-1 block">Sá»‘ Ä‘iá»‡n thoáº¡i *</label>
 <input 
 required
 type="text" 
 value={formData.phone}
 onChange={e => setFormData({...formData, phone: e.target.value})}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none" 
 placeholder="0901234567"
 />
 </div>
 <div>
 <label className="text-xs font-bold text-slate-600 mb-1 block">Email</label>
 <input 
 type="email" 
 value={formData.email}
 onChange={e => setFormData({...formData, email: e.target.value})}
 className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none" 
 placeholder="email@example.com"
 />
 </div>
 <div className="pt-4 flex justify-end gap-3">
 <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-800 font-bold text-sm rounded-lg hover:bg-slate-200">Há»§y</button>
 <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-slate-900 text-[#FAF9F5] font-bold text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
 LÆ°u KhÃ¡ch hÃ ng
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};

export function Customers() {
 const navigate = useNavigate();
 const [activeView, setActiveView] = useState<'list' | 'pipeline'>('list');
 const [activeChannel, setActiveChannel] = useState<'all' | 'zalo' | 'facebook' | 'web' | 'hotline'>('all');
 const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
 const [aiQuickModalCustomer, setAiQuickModalCustomer] = useState<Customer | null>(null);
 const [showConfigModal, setShowConfigModal] = useState(false);
 const [showAddModal, setShowAddModal] = useState(false);
 const [adjustingCustomer, setAdjustingCustomer] = useState<Customer | null>(null);
 const [adjustAmount, setAdjustAmount] = useState('');
 const [adjustType, setAdjustType] = useState<'wallet' | 'points'>('wallet');
 const [customers, setCustomers] = useState<Customer[]>([]);
 const [loading, setLoading] = useState(true);
 const [searchQuery, setSearchQuery] = useState('');
 const [orders, setOrders] = useState<any[]>([]);

 const [aiPipelineInsights, setAiPipelineInsights] = useState<string | null>(null);
 const [pipelineStages, setPipelineStages] = useState([
 { id: 'new', name: 'Leads Má»›i', count: 0, color: 'bg-slate-800', 
 deals: [
 { id: 'd1', client: 'CÃ´ng ty Cá»• pháº§n Sá»¯a TH', val: 50000000, pd: 'GiÃ y Ä‘á»“ng phá»¥c 500 Ä‘Ã´i' },
 { id: 'd2', client: 'Vinpearl Nha Trang', val: 120000000, pd: 'KhÄƒn láº¡nh KS' }
 ] 
 },
 { id: 'qualified', name: 'ÄÃ£ Tháº©m Äá»‹nh', count: 0, color: 'bg-primary-500', 
 deals: [
 { id: 'd3', client: 'Kangaroo Viá»‡t Nam', val: 80000000, pd: 'QuÃ  táº·ng TÃªÌt' }
 ] 
 },
 { id: 'proposal', name: 'Gá»­i BÃ¡o GiÃ¡', count: 0, color: 'bg-amber-500', 
 deals: [
 { id: 'd4', client: 'Viettel Telecom', val: 350000000, pd: 'GÃ³i combo Ä‘Ã´Ì€ng phuÌ£c' },
 { id: 'd5', client: 'FPT Software', val: 45000000, pd: 'Balo laptop' }
 ] 
 },
 { id: 'negotiation', name: 'ThÆ°Æ¡ng LÆ°á»£ng', count: 0, color: 'bg-orange-500', 
 deals: [
 { id: 'd6', client: 'Bá»‡nh viá»‡n TÃ¢m Anh', val: 210000000, pd: 'Kháº©u trang Y táº¿ sá»‰' }
 ] 
 },
 { id: 'won', name: 'Chá»‘t - Äoáº¡t HÄ', count: 0, color: 'bg-emerald-500', 
 deals: [
 { id: 'd7', client: 'Techcombank', val: 560000000, pd: 'Äá»“ng phá»¥c Giao diÌ£ch viÃªn' }
 ] 
 }
 ]);

 const handleDragStartPipeline = (e: React.DragEvent, dealId: string, sourceStageId: string) => {
 e.dataTransfer.setData('dealId', dealId);
 e.dataTransfer.setData('sourceStageId', sourceStageId);
 };

 const handleDropPipeline = (e: React.DragEvent, targetStageId: string) => {
 const dealId = e.dataTransfer.getData('dealId');
 const sourceStageId = e.dataTransfer.getData('sourceStageId');
 if (sourceStageId === targetStageId) return;

 setPipelineStages(prev => {
 const newStages = [...prev];
 const sIdx = newStages.findIndex(s => s.id === sourceStageId);
 const tIdx = newStages.findIndex(s => s.id === targetStageId);
 
 const dealIdx = newStages[sIdx].deals.findIndex(d => d.id === dealId);
 const [dealToMove] = newStages[sIdx].deals.splice(dealIdx, 1);
 newStages[tIdx].deals.push(dealToMove);
 return newStages;
 });
 };

 useEffect(() => {
 // Fetch customers
 const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
 const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
 setCustomers(data);
 setLoading(false);
 });

 // Fetch all completed orders to aggregate totalSpent per customer
 const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
 const ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
 setOrders(ordersData.filter(o => o.status === 'completed' && o.customerId));
 });

 return () => {
 unsubCustomers();
 unsubOrders();
 };
 }, []);

 const handleToggleLock = async (id: string, currentStatus: string, e: React.MouseEvent) => {
 e.stopPropagation();
 try {
 await updateDoc(doc(db, 'customers', id), {
 status: currentStatus === 'locked' ? 'active' : 'locked'
 });
 } catch(err) {
 console.error('Error toggling lock state', err);
 }
 };

 const submitAdjust = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!adjustingCustomer || !adjustAmount) return;
 
 try {
 const field = adjustType === 'wallet' ? 'walletBalance' : 'points';
 const currentVal = (adjustingCustomer as any)[field] || 0;
 await updateDoc(doc(db, 'customers', adjustingCustomer.id), {
 [field]: currentVal + Number(adjustAmount)
 });
 setAdjustingCustomer(null);
 setAdjustAmount('');
 } catch(err) {
 console.error('Error adjusting balance', err);
 }
 };

 // Compute dynamic fields
 const dynamicCustomers = customers.map(c => {
 const customerOrders = orders.filter(o => o.customerId === c.id);
 const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
 const orderCount = customerOrders.length;
 
 // Simulate active status based on recent purchase or base status
 // If they have any orders in the system they are active
 const status = (orderCount > 0 || c.status === 'active') ? 'active' : 'inactive';

 return { ...c, totalSpent, orderCount, status } as Customer;
 });

 const filteredCustomers = dynamicCustomers.filter(c => {
 const matchesChannel = activeChannel === 'all' || (c.channels && c.channels.includes(activeChannel as any));
 const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
 c.phone?.includes(searchQuery) || 
 c.email?.toLowerCase().includes(searchQuery.toLowerCase());
 return matchesChannel && matchesSearch;
 });

 return (
 <div className="max-w-[1440px] mx-auto space-y-6 animate-in fade-in slide-in- duration-500 overflow-hidden pb-10">
 {selectedCustomer && (
 <CustomerDetailModal 
 customer={selectedCustomer} 
 onClose={() => setSelectedCustomer(null)} 
 />
 )}
 {aiQuickModalCustomer && (
 <AiMessageQuickModal 
 customer={aiQuickModalCustomer} 
 onClose={() => setAiQuickModalCustomer(null)} 
 />
 )}
 {showConfigModal && (
 <CustomerConfigModal onClose={() => setShowConfigModal(false)} />
 )}
 {showAddModal && (
 <AddCustomerModal onClose={() => setShowAddModal(false)} />
 )}
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-1">
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Quáº£n trá»‹ KhÃ¡ch hÃ ng & CRM</h1>
 </div>
 <p className="text-sm text-[#6B7280]">Há»‡ thá»‘ng chÄƒm sÃ³c khÃ¡ch hÃ ng Ä‘a kÃªnh, quáº£n lÃ½ Loyalty & Pipeline.</p>
 </div>
 <div className="flex gap-3 items-center">
 <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-300 mr-2">
 <button 
 onClick={() => setActiveView('list')}
 className={cn("px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2", activeView === 'list' ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 <List className="w-4 h-4" /> Danh sÃ¡ch
 </button>
 <button 
 onClick={() => setActiveView('pipeline')}
 className={cn("px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2", activeView === 'pipeline' ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 <Kanban className="w-4 h-4" /> Pipeline
 </button>
 </div>
 <button 
 onClick={() => setShowAddModal(true)}
 className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
 >
 <Users className="w-4 h-4" /> ThÃªm KhÃ¡ch hÃ ng
 </button>
 <button 
 onClick={() => navigate('/omnichat')}
 className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2"
 >
 <MessageSquare className="w-4 h-4 text-emerald-500" /> Omni Chat
 </button>
 </div>
 </div>

 {activeView === 'list' ? (
 <>
 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-4 gap-4" columns={4} gap={16}>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-3">Tá»•ng khÃ¡ch hÃ ng</p>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{dynamicCustomers.length}</span>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">+5.2%</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-3">Active (Há»‡ thá»‘ng)</p>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{dynamicCustomers.filter(c => c.status === 'active').length}</span>
 <span className="text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded">High Retention</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-3">Chi tiÃªu TB (CLV)</p>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{formatCurrency(dynamicCustomers.length ? dynamicCustomers.reduce((acc, c) => acc + (c.totalSpent || 0), 0) / dynamicCustomers.length : 0)}</span>
 <span className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded">Synced</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-3">Loyalty (VÃ ng+)</p>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-amber-600">{dynamicCustomers.filter(c => (c.totalSpent || 0) > 10000000).length}</span>
 <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">High Value</span>
 </div>
 </div>
 </DraggableGrid>

 {/* CRM Intelligence & RFM Segmentation */}
 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-3 gap-4" columns={3} gap={16}>
 <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4">
 <Sparkles className="w-5 h-5 text-primary-200 group-hover:text-primary-400 transition-colors animate-pulse" />
 </div>
 <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
 <Users className="w-5 h-5 text-primary-600" /> PhÃ¢n Ä‘oáº¡n KhÃ¡ch hÃ ng (RFM Segmentation)
 </h3>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { name: 'KhÃ¡ch hÃ ng Core', val: 12, color: 'bg-emerald-500', desc: 'Mua nhiá»u & gáº§n Ä‘Ã¢y' },
 { name: 'KhÃ¡ch hÃ ng CÅ©', val: 45, color: 'bg-rose-500', desc: 'ChÆ°a mua láº¡i > 3 thÃ¡ng' },
 { name: 'Tiá»m nÄƒng', val: 28, color: 'bg-slate-800', desc: 'Sáºµn sÃ ng Upsell' },
 { name: 'Má»›i Ä‘Äƒng kÃ½', val: 15, color: 'bg-primary-500', desc: 'Cáº§n Onboarding' }
 ].map((seg, i) => (
 <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white hover:shadow-sm transition-all cursor-pointer">
 <div className="flex justify-between items-start mb-2">
 <div className={cn("w-2 h-2 rounded-full", seg.color)} />
 <span className="text-xl font-black text-slate-900">{seg.val}%</span>
 </div>
 <p className="text-xs font-bold text-slate-900 mb-1">{seg.name}</p>
 <p className="text-[10px] text-slate-500 leading-tight">{seg.desc}</p>
 </div>
 ))}
 </div>
 
 <div className="mt-8 p-4 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-white text-primary-600 rounded-lg shadow-sm">
 <Mail className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-xs font-bold text-primary-900">Chiáº¿n dá»‹ch tá»± Ä‘á»™ng (Marketing Automation)</h4>
 <p className="text-[10px] text-primary-700/70">Äang cÃ³ 12 khÃ¡ch hÃ ng thuá»™c nhÃ³m "Tiá»m nÄƒng" cÃ³ thá»ƒ gá»­i Voucher.</p>
 </div>
 </div>
 <button className="px-5 py-2 bg-primary-600 text-[#FAF9F5] rounded-lg text-xs font-bold hover:bg-primary-700 transition-all shadow-sm">KÃ­ch hoáº¡t Campaign</button>
 </div>
 </div>

 <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
 <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
 <Trophy className="w-4 h-4 text-blue-600" />
 <h3 className="text-sm font-bold text-slate-900">Loyalty Wallet Insight</h3>
 </div>
 <div className="p-5 flex flex-col flex-1 justify-between">
 <div className="relative z-10">
 <div className="space-y-6">
 <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
 <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tá»•ng Ä‘iá»ƒm kháº£ dá»¥ng</div>
 <div className="text-3xl font-black text-slate-900 leading-none">1,245,600 <span className="text-xs font-normal text-slate-500">pts</span></div>
 </div>
 <div className="flex gap-4">
 <div className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl">
 <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Sá»‘ dÆ° VÃ­ khÃ¡ch</p>
 <p className="text-lg font-bold">{formatCurrency(450000000)}</p>
 </div>
 <div className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-xl">
 <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Háº¡ng Kim CÆ°Æ¡ng</p>
 <p className="text-lg font-bold text-sky-600">08 KH</p>
 </div>
 </div>
 </div>
 </div>
 <button className="w-full mt-4 py-3 bg-slate-900 text-[#FAF9F5] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
 <Settings className="w-4 h-4" /> Quáº£n lÃ½ chÃ­nh sÃ¡ch Loyalty
 </button>
 </div>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="TÃ¬m tÃªn, SÄT, Email..." 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <div className="flex gap-1 bg-white border border-slate-300 p-1 rounded-lg">
 <button 
 onClick={() => setActiveChannel('all')}
 className={cn("p-1.5 rounded-md transition-all", activeChannel === 'all' ? "bg-slate-100 text-[#111827]" : "text-[#9CA3AF]")}
 >
 <Globe className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setActiveChannel('zalo')}
 className={cn("p-1.5 rounded-md transition-all", activeChannel === 'zalo' ? "bg-slate-100 text-orange-700" : "text-[#9CA3AF]")}
 >
 <MessageSquare className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setActiveChannel('facebook')}
 className={cn("p-1.5 rounded-md transition-all", activeChannel === 'facebook' ? "bg-slate-900 text-[#FAF9F5]" : "text-[#9CA3AF]")}
 >
 <Globe className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setActiveChannel('hotline')}
 className={cn("p-1.5 rounded-md transition-all", activeChannel === 'hotline' ? "bg-emerald-50 text-emerald-600" : "text-[#9CA3AF]")}
 >
 <PhoneCall className="w-4 h-4" />
 </button>
 </div>
 </div>
 <button className="text-xs font-semibold text-[#2563EB] flex items-center gap-2 hover:underline">
 XuÃ¢Ìt tÃªÌ£p CRM <ExternalLink className="w-3 h-3" />
 </button>
 </div>

 <div className="overflow-x-auto bg-white border-t border-slate-200 min-w-0">
<table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-200 italic">
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">KhÃ¡ch hÃ ng</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">LiÃªn há»‡</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">KÃªnh</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Chi tiÃªu</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">VÃ­ / Loyalty</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Tráº¡ng thÃ¡i</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {loading ? (
 <tr>
 <td colSpan={7} className="px-6 py-12 text-center bg-white">
 <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-1" />
 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Äang truy xuáº¥t dá»¯ liá»‡u CRM...</p>
 </td>
 </tr>
 ) : filteredCustomers.map((customer) => (
 <tr key={customer.id} className="hover:bg-primary-50/30 group transition-all duration-200">
 <td className="px-4 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-[10px] shrink-0 border border-primary-100 group-hover:scale-110 transition-transform">
 {customer.name?.split(' ').pop()?.charAt(0) || 'U'}
 </div>
 <div className="min-w-0">
 <p onClick={() => setSelectedCustomer(customer)} className="text-sm font-bold text-slate-900 truncate cursor-pointer hover:text-primary-600 transition-colors uppercase tracking-tight">{customer.name}</p>
 <p className="text-[9px] text-slate-500 font-mono tracking-tighter">ID: {customer.id.slice(-8).toUpperCase()}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-4">
 <div className="space-y-1">
 <div className="flex items-center justify-between group/copy text-[11px]">
 <span className="text-slate-700 font-bold tracking-tight">{customer.phone}</span>
 <CopyButton value={customer.phone} />
 </div>
 <div className="flex items-center justify-between group/copy text-[10px]">
 <span className="text-slate-500 truncate max-w-[120px] italic">{customer.email}</span>
 <CopyButton value={customer.email} />
 </div>
 </div>
 </td>
 <td className="px-4 py-4 text-center">
 <div className="flex justify-center flex-wrap gap-1">
 {customer.channels && customer.channels.slice(0, 3).map(channel => (
 <span key={channel} className="p-1 rounded bg-white border border-slate-200 shadow-sm" title={channel.toUpperCase()}>
 {channel === 'zalo' && <MessageSquare className="w-3 h-3 text-orange-600" />}
 {channel === 'facebook' && <Globe className="w-3 h-3 text-orange-800" />}
 {channel === 'hotline' && <PhoneCall className="w-3 h-3 text-emerald-600" />}
 {channel === 'web' && <Globe className="w-3 h-3 text-slate-500" />}
 </span>
 ))}
 {customer.channels && customer.channels.length > 3 && (
 <span className="text-[8px] font-bold text-slate-500 self-center">+{customer.channels.length - 3}</span>
 )}
 </div>
 </td>
 <td className="px-4 py-4 text-right">
 <p className="text-sm font-black text-slate-900">{formatCurrency(customer.totalSpent || 0)}</p>
 <p className="text-[9px] text-slate-500">ÄÆ¡n hÃ ng: <span className="font-bold text-slate-700">{customer.orderCount || 0}</span></p>
 </td>
 <td className="px-4 py-4 text-right">
 <p className="text-sm font-bold text-emerald-600">{formatCurrency(customer.walletBalance || 0)}</p>
 <p className="text-[9px] font-bold text-amber-600 flex items-center justify-end gap-1"><Trophy className="w-2.5 h-2.5" /> {customer.points || 0} pts</p>
 </td>
 <td className="px-4 py-4 text-center">
 <div className="flex justify-center">
 <span className={cn(
 "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm",
 customer.status === 'active' ? "bg-emerald-500 text-[#FAF9F5]" : customer.status === 'locked' ? "bg-red-500 text-[#FAF9F5]" : "bg-slate-100 text-slate-700"
 )}>
 {customer.status === 'active' ? 'ACTIVE' : customer.status === 'locked' ? 'LOCKED' : 'OFF'}
 </span>
 </div>
 </td>
 <td className="px-4 py-4 text-right">
 <div className="flex justify-end gap-2">
 <button 
 onClick={(e) => { e.stopPropagation(); setAdjustingCustomer(customer); }}
 className="p-1.5 bg-green-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-[#FAF9F5] transition-all shadow-sm"
 title="Cá»™ng/Trá»« Äiá»ƒm & Tiá»n"
 >
 <Wallet className="w-3.5 h-3.5" />
 </button>
 <button 
 onClick={(e) => handleToggleLock(customer.id!, customer.status, e)}
 className={cn("p-1.5 rounded-lg transition-all shadow-sm", customer.status === 'locked' ? "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-[#FAF9F5]" : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-[#FAF9F5]")}
 title={customer.status === 'locked' ? 'Má»Ÿ khÃ³a' : 'KhÃ³a tÃ i khoáº£n'}
 >
 {customer.status === 'locked' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
 </button>
 <button 
 onClick={() => setAiQuickModalCustomer(customer)}
 className="p-1.5 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-[#FAF9F5] transition-all shadow-sm"
 title="Soáº¡n tin AI nhanh"
 >
 <Sparkles className="w-3.5 h-3.5" />
 </button>
 <button 
 onClick={() => setSelectedCustomer(customer)}
 className="p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </>
 ) : (
 <div className="h-[calc(100vh-200px)] bg-slate-50 border border-slate-300 rounded-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
 <div className="p-4 border-b border-slate-300 bg-white flex justify-between items-center z-10 relative w-full">
 <div className="flex items-center gap-3">
 <h2 className="font-bold text-slate-900">Sales Pipeline B2B (Máº«u)</h2>
 <button 
 onClick={() => {
 const totalDeals = pipelineStages.reduce((sum, stage) => sum + stage.deals.length, 0);
 const wonDeals = pipelineStages.find(s => s.id === 'won')?.deals.length || 0;
 const valWon = pipelineStages.find(s => s.id === 'won')?.deals.reduce((acc, d) => acc + d.val, 0) || 0;
 
 let insights = `â€¢ Tá»•ng sá»‘ Deal Ä‘ang xá»­ lÃ½: ${totalDeals}.\n`;
 insights += `â€¢ Tá»· lá»‡ chuyá»ƒn Ä‘á»•i (Äoáº¡t HÄ): ${Math.round((wonDeals / (totalDeals || 1)) * 100)}% (${wonDeals} deals).\n`;
 insights += `â€¢ GiÃ¡ trá»‹ HÄ Ä‘Ã£ chá»‘t: ${formatCurrency(valWon)}.\n`;
 if ((pipelineStages.find(s => s.id === 'proposal')?.deals.length || 0) > 1) {
 insights += `â€¢ Gá»£i Ã½: CÃ³ khÃ¡ nhiá»u Deal á»Ÿ bÆ°á»›c "Gá»­i BÃ¡o GiÃ¡", hÃ£y theo dÃµi sÃ¡t sao Ä‘á»ƒ tÄƒng kháº£ nÄƒng chá»‘t sale.`;
 }
 if ((pipelineStages.find(s => s.id === 'negotiation')?.deals.length || 0) > 0) {
 insights += `\nâ€¢ Sales Ä‘ang trong giai Ä‘oáº¡n "ThÆ°Æ¡ng LÆ°á»£ng", táº­p trung resources há»— trá»£ chá»‘t nhanh.`;
 }
 setAiPipelineInsights(insights);
 }}
 className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-purple-100 transition-colors shadow-sm cursor-pointer"
 >
 <Sparkles className="w-3.5 h-3.5" /> PhÃ¢n tÃ­ch Pipeline (AI)
 </button>
 </div>
 <button className="text-xs px-3 py-1.5 bg-slate-900 text-[#FAF9F5] font-bold rounded-lg hover:bg-slate-800 shadow-sm">+ ThÃªm Deal má»›i</button>
 </div>
 {aiPipelineInsights && (
 <div className="m-4 mb-0 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-3 relative animate-in slide-in-">
 <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
 <div>
 <h4 className="font-bold text-purple-900 text-sm mb-1">AI PhÃ¢n tÃ­ch Pipeline</h4>
 <div className="text-sm text-purple-800 whitespace-pre-line leading-relaxed">{aiPipelineInsights}</div>
 </div>
 <button onClick={() => setAiPipelineInsights(null)} className="ml-auto text-purple-400 hover:text-purple-600">
 <X className="w-4 h-4" />
 </button>
 </div>
 )}
 <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar-horizontal min-w-0">
 <div className="flex gap-6 h-full items-start">
 {pipelineStages.map(stage => (
 <div 
 key={stage.id} 
 className="w-80 shrink-0 bg-slate-100 rounded-xl flex flex-col max-h-full border border-slate-300 shadow-sm"
 onDragOver={(e) => e.preventDefault()}
 onDrop={(e) => handleDropPipeline(e, stage.id)}
 >
 <div className="p-3 border-b border-slate-300 flex justify-between items-center bg-white rounded-t-xl shrink-0">
 <div className="flex items-center gap-2">
 <div className={cn("w-3 h-3 rounded-full", stage.color)}></div>
 <span className="font-bold text-sm text-slate-900">{stage.name}</span>
 </div>
 <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{stage.deals.length}</span>
 </div>
 <div className="p-3 overflow-y-auto space-y-3 custom-scrollbar flex-1">
 {stage.deals.map((deal) => (
 <div 
 key={deal.id} 
 draggable
 onDragStart={(e) => handleDragStartPipeline(e, deal.id, stage.id)}
 className="bg-white p-3.5 rounded-lg shadow-sm border border-slate-300 cursor-grab hover:shadow-sm transition-all group"
 >
 <h4 className="font-bold text-sm text-slate-900 group-hover:text-orange-700 transition-colors">{deal.client}</h4>
 <p className="text-xs text-slate-600 mt-1 line-clamp-2">{deal.pd}</p>
 <div className="mt-3 flex items-center justify-between">
 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{formatCurrency(deal.val)}</span>
 <div className="flex -space-x-1.5">
 <div className="w-5 h-5 rounded-full bg-[#EAE7DF] text-[8px] font-bold text-orange-800 flex items-center justify-center border border-white">S1</div>
 </div>
 </div>
 </div>
 ))}
 <button className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors border border-dashed border-slate-400">
 + ThÃªm Deal
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {adjustingCustomer && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <div>
 <h2 className="text-lg font-bold text-slate-900">Äiá»u chá»‰nh Äiá»ƒm / VÃ­</h2>
 <p className="text-xs text-slate-600">KhÃ¡ch hÃ ng: {adjustingCustomer.name}</p>
 </div>
 <button onClick={() => setAdjustingCustomer(null)} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
 </div>
 <form onSubmit={submitAdjust} className="p-6 space-y-6">
 <div>
 <label className="text-xs font-bold text-slate-800 uppercase mb-2 block">Loáº¡i Ä‘iá»u chá»‰nh</label>
 <select 
 value={adjustType}
 onChange={(e) => setAdjustType(e.target.value as any)}
 className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
 >
 <option value="wallet">VÃ­ Äiá»‡n Tá»­ (VNÄ)</option>
 <option value="points">Äiá»ƒm ThÆ°á»Ÿng (Points)</option>
 </select>
 </div>
 <div>
 <div className="flex justify-between items-center mb-1.5">
 <label className="text-xs font-bold text-slate-800 uppercase">Sá»‘ dÆ° hiá»‡n táº¡i</label>
 </div>
 <div className="text-xl font-bold text-slate-900">
 {adjustType === 'wallet' ? formatCurrency(adjustingCustomer.walletBalance || 0) : (adjustingCustomer.points || 0) + ' pts'}
 </div>
 </div>
 <div>
 <div className="flex justify-between items-center mb-1.5">
 <label className="text-xs font-bold text-slate-800 uppercase">Sá»‘ tiá»n/Ä‘iá»ƒm cá»™ng hoáº·c trá»«</label>
 </div>
 <input 
 type="number" 
 required
 value={adjustAmount}
 onChange={(e) => setAdjustAmount(e.target.value)}
 placeholder="VD: 500000 (cá»™ng) hoáº·c -1000 (trá»«)"
 className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" 
 />
 <p className="text-[11px] text-slate-600 mt-2">DÃ¹ng sá»‘ Ã¢m Ä‘á»ƒ trá»« Ä‘iá»ƒm/tiá»n. Viáº¿t liá»n khÃ´ng khoáº£ng tráº¯ng.</p>
 </div>
 <div className="flex gap-4 pt-4 border-t border-slate-200">
 <button 
 type="button"
 onClick={() => setAdjustingCustomer(null)}
 className="flex-1 py-2.5 bg-slate-100 text-slate-800 rounded-xl font-bold text-sm hover:bg-slate-200 transition-all"
 >
 Há»§y
 </button>
 <button 
 type="submit"
 className="flex-1 py-2.5 bg-emerald-600 text-[#FAF9F5] rounded-xl font-bold text-sm shadow-sm transition-all hover:bg-emerald-700 hover:shadow-sm"
 >
 XÃ¡c nháº­n
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 </div>
 );
}

