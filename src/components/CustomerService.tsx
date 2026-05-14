import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useEffect, useRef } from 'react';
import { 
 Headphones, 
 Ticket, 
 MessageSquare, 
 Star, 
 Clock, 
 AlertCircle, 
 CheckCircle2, 
 BarChart2, 
 User, 
 Mail, 
 Search, 
 Filter, 
 Sparkles,
 MoreVertical,
 ThumbsUp,
 ThumbsDown,
 ArrowRight,
 PhoneCall,
 Loader2,
 Send,
 History,
 Globe,
 Bot,
 Zap,
 CheckCheck,
 Plus,
 Settings,
 MessageCircle,
 Code2,
 Plug,
 ToggleRight,
 Laptop,
 Building2,
 Store,
 Users,
 UserPlus,
 Shield,
 Headset
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatChannel, ChatMessage, ChatThread } from '../types/erp';
import { getAiChatResponse } from '../services/geminiService';

// --- MOCK DATA ---
const MOCK_THREADS: ChatThread[] = [
 { id: 'T1', channel: 'zalo', userName: 'Pháº¡m Thá»‹ Lan', lastMessage: 'ÄÆ¡n hÃ ng cá»§a tÃ´i bao giá» tá»›i?', unreadCount: 2, updatedAt: '14:20' },
 { id: 'T2', channel: 'facebook', userName: 'HoÃ ng Anh Tuáº¥n', lastMessage: 'Shop cÃ³ tÃºi xÃ¡ch mÃ u kem khÃ´ng?', unreadCount: 0, updatedAt: '12:05' },
 { id: 'T3', channel: 'web', userName: 'KhÃ¡ch vÃ£ng lai #42', lastMessage: 'Sáº£n pháº©m nÃ y cÃ³ báº£o hÃ nh khÃ´ng áº¡?', unreadCount: 1, updatedAt: '10:15' },
];

const MOCK_TICKETS = [
 { id: 'TKT-1042', customerName: 'Nguyá»…n VÄƒn A', subject: 'HÃ ng nháº­n bá»‹ mÃ³p há»™p', status: 'open', priority: 'high', type: 'complaint', createdAt: '10:45 20/04/2026', sentiment: 'critical' },
 { id: 'TKT-1041', customerName: 'Tráº§n Thá»‹ B', subject: 'Há»i vá» thá»i gian báº£o hÃ nh', status: 'in_progress', priority: 'medium', type: 'inquiry', createdAt: '09:12 20/04/2026', sentiment: 'neutral' },
 { id: 'TKT-1040', customerName: 'LÃª VÄƒn C', subject: 'Lá»—i thanh toÃ¡n Momo', status: 'closed', priority: 'high', type: 'technical', createdAt: '16:30 19/04/2026', sentiment: 'negative' },
 { id: 'TKT-1039', customerName: 'Pháº¡m D', subject: 'Cáº§n Ä‘á»•i size Ã¡o', status: 'open', priority: 'medium', type: 'return', createdAt: '08:05 19/04/2026', sentiment: 'neutral' },
 { id: 'TKT-1038', customerName: 'HoÃ ng E', subject: 'Khen ngá»£i dá»‹ch vá»¥ shipper', status: 'closed', priority: 'low', type: 'feedback', createdAt: '14:20 18/04/2026', sentiment: 'positive' },
];

const MOCK_FEEDBACKS = [
 { id: 'FB-001', customerName: 'Äáº·ng F', rating: 5, comment: 'Giao hÃ ng siÃªu nhanh, Ä‘Ã³ng gÃ³i cáº©n tháº­n. Sáº½ á»§ng há»™ shop dÃ i dÃ i!', date: 'HÃ´m nay', channel: 'shopee' },
 { id: 'FB-002', customerName: 'VÅ© G', rating: 2, comment: 'NhÃ¢n viÃªn tÆ° váº¥n cháº­m, pháº£n há»“i khÃ¡ch hÆ¡i lÃ¢u.', date: 'HÃ´m qua', channel: 'zalo' },
 { id: 'FB-003', customerName: 'BÃ¹i H', rating: 4, comment: 'Cháº¥t lÆ°á»£ng oki, nhÆ°ng giÃ¡ hÆ¡i cao so vá»›i thá»‹ trÆ°á»ng má»™t chÃºt.', date: '18/04/2026', channel: 'web' },
];

const MOCK_CAMPAIGNS = [
 { id: 'CMP-01', name: 'ChÃºc má»«ng Sinh nháº­t ThÃ¡ng 4', type: 'email', target: 'KhÃ¡ch hÃ ng cÃ³ sinh nháº­t trong thÃ¡ng', sent: 1250, openRate: 45, clickRate: 12, status: 'active' },
 { id: 'CMP-02', name: 'Nháº¯c nhá»Ÿ sá»­ dá»¥ng Voucher', type: 'sms', target: 'KhÃ¡ch hÃ ng cÃ³ voucher sáº¯p háº¿t háº¡n', sent: 840, openRate: 92, clickRate: 35, status: 'active' },
 { id: 'CMP-03', name: 'Kháº£o sÃ¡t CSAT Q1', type: 'zalo', target: 'KhÃ¡ch hÃ ng mua hÃ ng trong Q1', sent: 5000, openRate: 68, clickRate: 20, status: 'completed' },
];

// --- COMPONENT ---
export function CustomerService() {
 const [activeTab, setActiveTab] = useState<'tickets' | 'campaigns' | 'feedback' | 'chat' | 'calls' | 'config' | 'livechat' | 'agents'>('tickets');
 const [roleScope, setRoleScope] = useState<'platform' | 'seller'>('platform');
 const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
 const [aiDrafting, setAiDrafting] = useState(false);
 const [draftedMessage, setDraftedMessage] = useState('');

 // OmniChat States
 const [activeThreadId, setActiveThreadId] = useState<string>('T1');
 const [messages, setMessages] = useState<ChatMessage[]>([
 { id: 'm1', channel: 'zalo', senderId: 'user', senderName: 'Pháº¡m Thá»‹ Lan', text: 'ChÃ o shop, Ä‘Æ¡n hÃ ng ORD-9921 bao giá» giao váº­y?', isAi: false, timestamp: '14:15' },
 { id: 'm2', channel: 'zalo', senderId: 'ai', senderName: 'AI Assistant', text: 'ChÃ o chá»‹ Lan, em lÃ  trá»£ lÃ½ áº£o VComm. Äá»ƒ em kiá»ƒm tra mÃ£ Ä‘Æ¡n ORD-9921 cho chá»‹ nhÃ©!', isAi: true, timestamp: '14:16' },
 ]);
 const [inputValue, setInputValue] = useState('');
 const [isAiProcessing, setIsAiProcessing] = useState(false);
 const scrollRef = useRef<HTMLDivElement>(null);

 const activeThread = MOCK_THREADS.find(t => t.id === activeThreadId);

 useEffect(() => {
 if (activeTab === 'chat' && scrollRef.current) {
 scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
 }
 }, [messages, activeTab]);

 const handleSendMessage = async () => {
 if (!inputValue.trim()) return;

 const userMsg: ChatMessage = {
 id: Date.now().toString(),
 channel: activeThread?.channel || 'web',
 senderId: 'user',
 senderName: 'You',
 text: inputValue,
 isAi: false,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
 };

 setMessages(prev => [...prev, userMsg]);
 setInputValue('');
 setIsAiProcessing(true);

 // Call Gemini AI
 const history = messages.map(m => ({
 role: m.isAi ? 'model' as const : 'user' as const,
 content: m.text
 }));

 const aiText = await getAiChatResponse(inputValue, history);

 const aiMsg: ChatMessage = {
 id: (Date.now() + 1).toString(),
 channel: activeThread?.channel || 'web',
 senderId: 'ai',
 senderName: 'AI Assistant',
 text: aiText,
 isAi: true,
 timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
 };

 setMessages(prev => [...prev, aiMsg]);
 setIsAiProcessing(false);
 };

 const handleSimulateAiReply = () => {
 setAiDrafting(true);
 setTimeout(() => {
 setDraftedMessage(`Dáº¡ em chÃ o anh/chá»‹ ${selectedTicket.customerName}, em bÃªn bá»™ pháº­n CSKH xin ghi nháº­n thÃ´ng tin vá» váº¥n Ä‘á» "${selectedTicket.subject}". Bá»™ pháº­n liÃªn quan Ä‘ang tiáº¿n hÃ nh kiá»ƒm tra láº¡i vÃ  sáº½ xá»­ lÃ½ ngay láº­p tá»©c áº¡. Xin lá»—i vÃ¬ sá»± báº¥t tiá»‡n nÃ y.`);
 setAiDrafting(false);
 }, 1500);
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-3">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">ChÄƒm sÃ³c KhÃ¡ch hÃ ng</h1>
 <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-300 shadow-inner">
 <button 
 onClick={() => setRoleScope('platform')}
 className={cn("px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all", roleScope === 'platform' ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 <Building2 className="w-3.5 h-3.5" /> Quáº£n trá»‹ SÃ n
 </button>
 <button 
 onClick={() => setRoleScope('seller')}
 className={cn("px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all", roleScope === 'seller' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 <Store className="w-3.5 h-3.5" /> Quáº£n trá»‹ NhÃ  BÃ¡n
 </button>
 </div>
 </div>
 <p className="text-sm text-[#6B7280] mt-1">
 {roleScope === 'platform' ? 'Quáº£n lÃ½ váº­n hÃ nh há»‡ thá»‘ng, giÃ¡m sÃ¡t Ä‘Ã¡nh giÃ¡ cá»­a hÃ ng vÃ  há»— trá»£ tranh cháº¥p.' : 'Quáº£n lÃ½ khiáº¿u náº¡i, pháº£n há»“i, vÃ  tá»± Ä‘á»™ng hÃ³a CSKH cho cá»­a hÃ ng cá»§a báº¡n.'}
 </p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <BarChart2 className="w-4 h-4 text-emerald-600" />
 BÃ¡o cÃ¡o SLA
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Ticket className="w-4 h-4" />
 Táº¡o Ticket má»›i
 </button>
 </div>
 </div>

 {/* Overview Cards */}
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
 <div className="flex justify-between items-start relative z-10 mb-2">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiáº¿p nháº­n má»›i (Má»Ÿ)</p>
 <AlertCircle className="w-4 h-4 text-red-500" />
 </div>
 <p className="text-3xl font-bold text-slate-900 relative z-10">24</p>
 <div className="mt-2 text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg w-fit">Cáº§n xá»­ lÃ½ gáº¥p: 5</div>
 </div>
 
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-slate-100 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
 <div className="flex justify-between items-start relative z-10 mb-2">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Thá»i gian P/há»“i TB (SLA)</p>
 <Clock className="w-4 h-4 text-orange-600" />
 </div>
 <p className="text-3xl font-bold text-slate-900 relative z-10">14 <span className="text-sm font-medium text-slate-600">phÃºt</span></p>
 <div className="mt-2 text-[10px] text-emerald-500 font-medium">Nhanh hÆ¡n 5p so vá»›i tuáº§n trÆ°á»›c</div>
 </div>

 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
 <div className="flex justify-between items-start relative z-10 mb-2">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">ÄÃ¡nh giÃ¡ chung (CSAT)</p>
 <Star className="w-4 h-4 text-yellow-500" />
 </div>
 <p className="text-3xl font-bold text-slate-900 relative z-10">4.8<span className="text-xl text-slate-500">/5</span></p>
 <div className="mt-2 text-[10px] text-emerald-500 font-medium">Ráº¥t xuáº¥t sáº¯c</div>
 </div>

 <div className="bg-white p-5 rounded-lg border border-slate-800 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
 <div className="flex justify-between items-start relative z-10 mb-2">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Autofill / Auto-reply</p>
 <Sparkles className="w-4 h-4 text-primary-400" />
 </div>
 <p className="text-3xl font-bold text-[#FAF9F5] relative z-10">68%</p>
 <div className="mt-2 text-[10px] text-primary-200 font-medium tracking-wide">Tá»· lá»‡ tá»± Ä‘á»™ng hÃ³a tin nháº¯n</div>
 </div>
 </DraggableGrid>

 {/* Main Content Area */}
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
 {/* Navigation Tabs */}
 <div className="flex bg-slate-50 border-b border-slate-300 p-2 gap-2 overflow-x-auto hidden-scrollbar min-w-0">
 <button 
 onClick={() => setActiveTab('tickets')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'tickets' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <Ticket className="w-4 h-4" /> Quáº£n lÃ½ Tickets
 </button>
 <button 
 onClick={() => setActiveTab('campaigns')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'campaigns' ? "bg-white text-emerald-600 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <Mail className="w-4 h-4" /> Chiáº¿n dá»‹ch ChÄƒm sÃ³c (Loyalty)
 </button>
 <button 
 onClick={() => setActiveTab('feedback')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'feedback' ? "bg-white text-purple-600 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <Star className="w-4 h-4" /> Pháº£n há»“i & ÄÃ¡nh giÃ¡
 </button>
 <button 
 onClick={() => setActiveTab('chat')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'chat' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <MessageSquare className="w-4 h-4" /> Chat Äa kÃªnh (FB/Zalo)
 </button>
 <button 
 onClick={() => setActiveTab('calls')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'calls' ? "bg-white text-emerald-600 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <PhoneCall className="w-4 h-4" /> Tá»•ng Ä‘Ã i OmiCall
 </button>
 <button 
 onClick={() => setActiveTab('livechat')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'livechat' ? "bg-white text-primary-600 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <MessageCircle className="w-4 h-4" /> Livechat Website
 </button>
 <button 
 onClick={() => setActiveTab('agents')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'agents' ? "bg-white text-rose-600 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <Users className="w-4 h-4" /> Äá»™i ngÅ© & Extension
 </button>
 <button 
 onClick={() => setActiveTab('config')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'config' ? "bg-white text-slate-900 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <Settings className="w-4 h-4" /> Cáº¥u hÃ¬nh KÃªnh
 </button>
 </div>

 {/* Filters */}
 <div className="p-4 border-b border-stone-50 flex flex-wrap gap-4 items-center justify-between">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input 
 type="text" 
 placeholder={activeTab === 'tickets' ? "TÃ¬m mÃ£ ticket, tÃªn khÃ¡ch hÃ ng..." : "TÃ¬m kiáº¿m..."} 
 className="bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72 focus:bg-white focus:ring-4 focus:ring-orange-600/10 transition-all font-medium"
 />
 </div>
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm text-slate-700 flex items-center gap-2 font-bold hover:bg-slate-50">
 <Filter className="w-4 h-4" /> Bá»™ lá»c
 </button>
 </div>
 </div>

 {/* Content by Tab */}
 <div className="flex-1 overflow-x-auto min-w-0">
 {activeTab === 'tickets' && (
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-200">
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Ticket ID & KH</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Váº¥n Ä‘á» / TiÃªu Ä‘á»</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Tráº¡ng thÃ¡i</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Má»©c Ä‘á»™ Æ°u tiÃªn</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right leading-relaxed">Thá»i gian</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {MOCK_TICKETS.map(ticket => (
 <tr 
 key={ticket.id} 
 onClick={() => setSelectedTicket(ticket)}
 className={cn("hover:bg-slate-100/50 cursor-pointer transition-colors group", ticket.status === 'open' ? 'bg-white' : 'bg-slate-50/30')}
 >
 <td className="px-3 py-2.5">
 <p className="text-xs font-mono font-bold text-slate-700 mb-0.5">{ticket.id}</p>
 <p className="text-sm font-bold text-slate-900 group-hover:text-orange-700 transition-colors">{ticket.customerName}</p>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 {ticket.sentiment === 'critical' ? <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> : 
 ticket.sentiment === 'negative' ? <span className="w-2 h-2 rounded-full bg-orange-500" /> : 
 <span className="w-2 h-2 rounded-full bg-emerald-500" />}
 <div>
 <p className="text-sm font-bold text-slate-800">{ticket.subject}</p>
 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">{ticket.type}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn(
 "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
 ticket.status === 'open' ? "bg-[#EAE7DF] text-orange-800" : 
 ticket.status === 'in_progress' ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
 )}>
 {ticket.status === 'open' ? 'Má»šI' : ticket.status === 'in_progress' ? 'ÄANG Xá»¬ LÃ' : 'ÄÃƒ ÄÃ“NG'}
 </span>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn(
 "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
 ticket.priority === 'high' ? "border-red-200 text-red-600 bg-red-50" : 
 ticket.priority === 'medium' ? "border-amber-200 text-amber-600 bg-amber-50" : "border-slate-300 text-slate-600 bg-white"
 )}>
 {ticket.priority}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <p className="text-xs text-slate-700 font-medium">{ticket.createdAt}</p>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}

 {activeTab === 'campaigns' && (
 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-200">
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">TÃªn Chiáº¿n dá»‹ch</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">KÃªnh / Äá»‘i tÆ°á»£ng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">ÄÃ£ gá»­i</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Tá»· lá»‡ Má»Ÿ (Open Rate)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right leading-relaxed">Tráº¡ng thÃ¡i</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {MOCK_CAMPAIGNS.map(camp => (
 <tr key={camp.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-3 py-2.5">
 <p className="text-sm font-bold text-slate-900">{camp.name}</p>
 <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{camp.id}</p>
 </td>
 <td className="px-3 py-2.5">
 <p className="text-xs font-bold uppercase tracking-widest text-orange-700 mb-0.5">{camp.type}</p>
 <p className="text-xs text-slate-600">{camp.target}</p>
 </td>
 <td className="px-6 py-4 text-center font-mono font-bold text-slate-800">
 {camp.sent.toLocaleString()}
 </td>
 <td className="px-3 py-2.5">
 <div className="flex flex-col items-center gap-1">
 <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
 <div className="h-full bg-emerald-500" style={{ width: `${camp.openRate}%` }} />
 </div>
 <span className="text-[10px] font-bold text-slate-600">{camp.openRate}%</span>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <span className={cn(
 "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block",
 camp.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
 )}>
 {camp.status === 'active' ? 'ÄANG CHáº Y' : 'HOÃ€N THÃ€NH'}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {activeTab === 'feedback' && (
 <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {MOCK_FEEDBACKS.map(fb => (
 <div key={fb.id} className="p-5 border border-slate-300 rounded-lg shadow-sm bg-white hover:shadow-sm transition-shadow">
 <div className="flex justify-between items-start mb-3">
 <div className="flex items-center gap-2">
 <div className="w-8 h-8 rounded-full bg-slate-900 text-[#FAF9F5] font-bold flex items-center justify-center text-xs">
 {fb.customerName.charAt(0)}
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900">{fb.customerName}</p>
 <p className="text-[10px] text-slate-500 capitalize">{fb.channel}</p>
 </div>
 </div>
 <span className="text-[10px] font-medium text-slate-500">{fb.date}</span>
 </div>
 <div className="flex gap-1 mb-2">
 {[...Array(5)].map((_, i) => (
 <Star key={i} className={cn("w-3 h-3", i < fb.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-400")} />
 ))}
 </div>
 <p className="text-sm text-slate-700 italic">"{fb.comment}"</p>
 </div>
 ))}
 </div>
 )}

 {activeTab === 'chat' && (
 <div className="flex bg-white h-[600px] overflow-hidden">
 {/* Sidebar - Thread List */}
 <div className="w-[320px] border-r border-[#F3F4F6] flex flex-col bg-slate-50/50">
 <div className="p-4 border-b border-[#F3F4F6]">
 <h2 className="text-sm font-bold text-[#111827] flex items-center gap-2 mb-3">
 KÃªnh tÆ°Æ¡ng tÃ¡c (API)
 </h2>
 <div className="flex gap-2">
 <button className="flex-1 bg-slate-900 text-[#FAF9F5] text-[10px] font-bold py-1.5 rounded-lg flex justify-center items-center gap-1 shadow-sm"><span className="w-3 h-3 flex items-center justify-center rounded-full bg-slate-900 text-orange-700">f</span> Fanpage</button>
 <button className="flex-1 bg-slate-800 text-[#FAF9F5] text-[10px] font-bold py-1.5 rounded-lg flex justify-center items-center gap-1 shadow-sm"><MessageSquare className="w-3 h-3" /> Zalo OA</button>
 </div>
 <div className="relative mt-4">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="TÃ¬m khÃ¡ch hÃ ng..." 
 className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-orange-600 transition-all shadow-sm"
 />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto">
 {MOCK_THREADS.map(thread => (
 <button
 key={thread.id}
 onClick={() => setActiveThreadId(thread.id)}
 className={cn(
 "w-full p-4 flex gap-3 hover:bg-slate-50 transition-all border-b border-[#F3F4F6] text-left relative cursor-pointer",
 activeThreadId === thread.id && "bg-white border-l-2 border-l-blue-600 shadow-sm"
 )}
 >
 <div className="relative">
 <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
 {thread.userAvatar ? <img src={thread.userAvatar} alt="" className="rounded-full" /> : thread.userName[0]}
 </div>
 <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white", thread.channel === 'facebook' ? "bg-slate-900" : thread.channel === 'zalo' ? "bg-slate-800" : "bg-slate-500")}>
 {thread.channel === 'facebook' ? <span className="text-[8px] font-bold text-[#FAF9F5]">f</span> : thread.channel === 'zalo' ? <MessageSquare className="w-2 h-2 text-[#FAF9F5]" /> : <Globe className="w-2 h-2 text-[#FAF9F5]" />}
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start">
 <h3 className="text-sm font-bold text-[#111827] truncate">{thread.userName}</h3>
 <span className="text-[9px] text-[#9CA3AF]">{thread.updatedAt}</span>
 </div>
 <p className="text-xs text-[#6B7280] truncate mt-0.5">{thread.lastMessage}</p>
 </div>
 {thread.unreadCount > 0 && (
 <div className="absolute top-1/2 -translate-y-1/2 right-4 w-4 h-4 bg-red-500 text-[#FAF9F5] rounded-full text-[10px] font-bold flex items-center justify-center">
 {thread.unreadCount}
 </div>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Main Chat Area */}
 <div className="flex-1 flex flex-col bg-[#F9FAFB]">
 {/* Chat Header */}
 <div className="p-4 bg-white border-b border-[#F3F4F6] flex justify-between items-center z-10">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs border border-slate-300 text-slate-600">
 {activeThread?.userName[0]}
 </div>
 <div>
 <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
 {activeThread?.userName}
 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
 </h3>
 <p className="text-[10px] text-emerald-600 font-medium">Äang hoáº¡t Ä‘á»™ng trÃªn {activeThread?.channel}</p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><PhoneCall className="w-4 h-4 text-[#6B7280]" /></button>
 <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><History className="w-4 h-4 text-[#6B7280]" /></button>
 <div className="h-6 w-[1px] bg-slate-200 mx-2" />
 <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical className="w-4 h-4 text-[#6B7280]" /></button>
 </div>
 </div>

 {/* Messages List */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth" ref={scrollRef}>
 {messages.map((msg) => (
 <div key={msg.id} className={cn(
 "flex items-end gap-3",
 msg.senderId === 'ai' ? "flex-row" : "flex-row-reverse"
 )}>
 <div className={cn(
 "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm",
 msg.senderId === 'ai' ? "bg-slate-900 text-[#FAF9F5]" : "bg-white border border-slate-300 text-slate-800"
 )}>
 {msg.senderId === 'ai' ? <Bot className="w-4 h-4" /> : 'CS'}
 </div>
 <div className={cn(
 "max-w-[70%] space-y-1",
 msg.senderId === 'ai' ? "items-start" : "items-end flex flex-col"
 )}>
 <div className={cn(
 "p-3 rounded-xl text-sm shadow-sm leading-relaxed",
 msg.senderId === 'ai' 
 ? "bg-white text-slate-900 border border-slate-300 rounded-bl-sm" 
 : "bg-slate-900 text-[#FAF9F5] rounded-br-sm"
 )}>
 {msg.text}
 </div>
 <div className="flex items-center gap-2 px-1">
 <span className={cn("text-[9px] font-medium tracking-wide", msg.senderId === 'ai' ? "text-slate-500" : "text-blue-300")}>{msg.senderName} â€¢ {msg.timestamp}</span>
 {msg.senderId === 'user' && <CheckCheck className="w-3.5 h-3.5 text-orange-600" />}
 </div>
 </div>
 </div>
 ))}
 {isAiProcessing && (
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-slate-900 text-[#FAF9F5] flex items-center justify-center shadow-sm shadow-slate-900/5">
 <Bot className="w-4 h-4 animate-bounce" />
 </div>
 <div className="bg-white border border-slate-300 p-4 rounded-lg rounded-bl-sm shadow-sm flex items-center gap-3">
 <span className="text-xs text-slate-700 font-bold tracking-wide">AI Assistant Ä‘ang soáº¡n cÃ¢u tráº£ lá»i</span>
 <div className="flex gap-1.5">
 <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce [animation-delay:-0.3s]" />
 <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce [animation-delay:-0.15s]" />
 <div className="w-1.5 h-1.5 bg-slate-900 rounded-full animate-bounce" />
 </div>
 </div>
 </div>
 )}
 </div>

 {/* Input Area */}
 <div className="p-4 bg-white border-t border-slate-300 flex flex-col gap-3">
 <div className="flex gap-2 p-1 overflow-x-auto hidden-scrollbar min-w-0">
 <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full whitespace-nowrap transition-colors">Xin chÃ o</button>
 <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full whitespace-nowrap transition-colors">Xin thÃ´ng tin nháº­n hÃ ng</button>
 <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full whitespace-nowrap transition-colors">Gá»­i mÃ£ freeship</button>
 <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full whitespace-nowrap transition-colors">ThÃ´ng bÃ¡o cháº­m hÃ ng</button>
 </div>
 <div className="flex items-center gap-3">
 <button className="p-2.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-all flex-shrink-0">
 <Plus className="w-5 h-5" />
 </button>
 <div className="flex-1 relative">
 <input 
 type="text" 
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
 placeholder="Nháº­p tin nháº¯n..." 
 className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-slate-900 focus:bg-white transition-all font-medium"
 />
 <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 hover:bg-slate-800 text-[#FAF9F5] rounded-lg transition-all disabled:opacity-50 flex items-center justify-center shadow-sm shadow-slate-900/5" onClick={handleSendMessage} disabled={isAiProcessing || !inputValue.trim()}>
 <Send className="w-4 h-4 ml-0.5" />
 </button>
 </div>
 <button className="bg-amber-100 hover:bg-amber-200 p-3 rounded-xl transition-colors flex-shrink-0 relative group">
 <Zap className="w-5 h-5 text-amber-600 fill-current" />
 <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap px-3 py-2 bg-slate-800 text-[#FAF9F5] text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
 DÃ¹ng AI tráº£ lá»i
 </div>
 </button>
 </div>
 <div className="text-center mt-1">
 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">ÄÆ°á»£c há»— trá»£ bá»Ÿi Gemini AI Engine</p>
 </div>
 </div>
 </div>

 {/* Right Sidebar - Info */}
 <div className="w-[280px] border-l border-[#F3F4F6] bg-slate-50/50 flex flex-col p-6 space-y-6 overflow-y-auto">
 <div className="text-center space-y-3">
 <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-white shadow-sm mx-auto flex items-center justify-center text-2xl font-bold text-slate-500">
 {activeThread?.userName[0]}
 </div>
 <div>
 <h3 className="font-bold text-[#111827]">{activeThread?.userName}</h3>
 <p className="text-xs text-[#6B7280]">{activeThread?.channel === 'zalo' ? 'Vietnam' : 'Social Hub'}</p>
 </div>
 <div className="flex justify-center gap-2">
 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">New Customer</span>
 <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold">VIP VÃ ng</span>
 </div>
 </div>

 <div className="space-y-4">
 <div className="flex justify-between items-center border-b border-[#F3F4F6] pb-2">
 <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest">ÄÆ¡n hÃ ng gáº§n Ä‘Ã¢y</h4>
 <button className="text-[10px] font-bold text-orange-700 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1">
 <Plus className="w-3 h-3" /> Táº¡o Ä‘Æ¡n
 </button>
 </div>
 <div className="space-y-3">
 {[
 { id: 'ORD-9921', status: 'shipping', amount: 1540000 },
 { id: 'ORD-8840', status: 'delivered', amount: 850000 }
 ].map(order => (
 <div key={order.id} className="p-3 bg-white rounded-lg border border-slate-300 shadow-sm space-y-1 hover:border-orange-200 transition-all cursor-pointer">
 <div className="flex justify-between items-start">
 <span className="text-xs font-bold text-[#111827] font-mono">{order.id}</span>
 <span className={cn(
 "text-[9px] font-bold uppercase",
 order.status === 'shipping' ? "text-orange-700" : "text-emerald-600"
 )}>{order.status}</span>
 </div>
 <p className="text-sm font-bold text-[#2563EB]">{formatCurrency(order.amount)}</p>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-primary-50 p-4 rounded-lg space-y-2 border border-primary-100 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-16 h-16 bg-white/40 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
 <h4 className="text-[10px] font-bold text-primary-700 uppercase tracking-widest flex items-center gap-2 relative z-10">
 <Sparkles className="w-3 h-3 text-primary-500" /> Nháº­n Ä‘á»‹nh AI
 </h4>
 <p className="text-[11px] text-primary-900 leading-relaxed font-medium relative z-10">KhÃ¡ch hÃ ng há»i vá» lá»‹ch giao Ä‘Æ¡n ORD-9921. ÄÃ¢y lÃ  khÃ¡ch hÃ ng VIP, cÃ³ thá»ƒ chá»§ Ä‘á»™ng Ä‘á» nghá»‹ freeship Ä‘Æ¡n sau.</p>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'calls' && (
 <div className="flex h-[600px]">
 {/* OmiCall Dialer */}
 <div className="w-1/3 border-r border-slate-300 bg-slate-50/50 p-6 flex flex-col items-center">
 <h3 className="font-bold text-slate-900 text-lg mb-2 text-center w-full">Tá»•ng Ä‘Ã i OmiCall (VoIP)</h3>
 <div className="flex items-center gap-2 mb-8 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SIP Registered â€¢ Ext: 101
 </div>
 
 <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-sm border border-slate-300 flex flex-col items-center">
 <div className="w-full bg-slate-100 h-16 rounded-lg flex items-center justify-center mb-8 text-2xl font-mono font-bold text-slate-800 tracing-widest">
 090 123 4567
 </div>
 
 <div className="grid grid-cols-3 gap-4 w-full px-4 mb-8">
 {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(num => (
 <button key={num} className="h-14 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 text-xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-sm">
 {num}
 </button>
 ))}
 </div>
 
 <button className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-[#FAF9F5] flex items-center justify-center shadow-sm shadow-emerald-500/30 transition-all active:scale-95">
 <PhoneCall className="w-8 h-8" />
 </button>
 </div>
 </div>

 {/* Call Logs */}
 <div className="flex-1 bg-white p-6">
 <div className="flex justify-between items-center mb-6">
 <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2"><History className="w-5 h-5 text-orange-700" /> Lá»‹ch sá»­ cuá»™c gá»i (Call Logs)</h3>
 <button className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-all">Äá»“ng bá»™ OmiCall API</button>
 </div>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-200">
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">KhÃ¡ch hÃ ng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Loáº¡i HÆ°á»›ng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Tráº¡ng thÃ¡i</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Thá»i lÆ°á»£ng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">File Ghi Ã¢m</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right leading-relaxed">Thá»i gian / Ghi chÃº</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {[
 { time: '14:20 20/04/2026', duration: '02:45', status: 'missed', caller: '0901234567', type: 'inbound', name: 'Nguyá»…n VÄƒn A', hasAudio: false },
 { time: '10:15 20/04/2026', duration: '08:12', status: 'completed', caller: '0987654321', type: 'outbound', name: 'Tráº§n Thá»‹ B', hasAudio: true },
 { time: '09:05 19/04/2026', duration: '01:20', status: 'completed', caller: '0919876543', type: 'inbound', name: 'Le Van C', hasAudio: true }
 ].map((log, i) => (
 <tr key={i} className="hover:bg-slate-50 transition-colors">
 <td className="px-3 py-2.5">
 <p className="text-sm font-bold text-slate-900">{log.name}</p>
 <p className="text-[10px] text-slate-600 font-mono mt-0.5">{log.caller}</p>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", log.type === 'inbound' ? "border-orange-200 text-orange-700 bg-slate-100" : "border-purple-200 text-purple-600 bg-purple-50")}>
 {log.type === 'inbound' ? 'Gá»ŒI VÃ€O' : 'Gá»ŒI RA'}
 </span>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", log.status === 'completed' ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50")}>
 {log.status === 'completed' ? 'THÃ€NH CÃ”NG' : 'Gá»ŒI NHá» '}
 </span>
 </td>
 <td className="px-6 py-4 text-center text-sm font-mono text-slate-700 font-bold">
 {log.duration}
 </td>
 <td className="px-6 py-4 text-center">
 {log.hasAudio ? (
 <button className="inline-flex p-1.5 bg-slate-100 text-orange-700 rounded-lg items-center justify-center hover:bg-[#EAE7DF] transition-colors tooltip" title="Nghe láº¡i">
 <Headphones className="w-4 h-4" />
 </button>
 ) : (
 <span className="text-slate-500">-</span>
 )}
 </td>
 <td className="px-6 py-4 text-right">
 <div className="text-xs text-slate-600 font-medium mb-1 border-b border-dashed border-slate-300 pb-1 inline-block">
 {log.time}
 </div>
 <div>
 <button className="text-[10px] font-bold text-orange-700 hover:text-blue-800 uppercase tracking-widest mt-0.5">ThÃªm ghi chÃº</button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}
 {activeTab === 'livechat' && (
 <div className="flex h-[600px]">
 {/* Livechat Inbox Sidebar */}
 <div className="w-1/3 border-r border-[#F3F4F6] flex flex-col bg-slate-50/50">
 <div className="p-4 border-b border-slate-300 bg-white">
 <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
 <Laptop className="w-5 h-5 text-primary-600" /> Web Livechat
 </h3>
 <div className="flex bg-slate-100 p-1 rounded-lg">
 <button className="flex-1 bg-white shadow-sm text-xs font-bold py-1.5 rounded-md text-slate-800 transition-all text-center">Äang chá» (12)</button>
 <button className="flex-1 text-xs font-bold py-1.5 rounded-md text-slate-600 hover:text-slate-800 transition-all text-center">Äang xá»­ lÃ½ (5)</button>
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-3 space-y-2">
 <div className="bg-white p-3 rounded-lg border border-primary-200 shadow-sm relative overflow-hidden cursor-pointer">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
 <div className="flex justify-between items-start mb-1">
 <p className="text-sm font-bold text-slate-900">KhÃ¡ch vÃ£ng lai #889</p>
 <span className="text-[10px] text-slate-500">Vá»«a xong</span>
 </div>
 <p className="text-xs text-slate-700 truncate">Sáº£n pháº©m nÃ y cÃ³ size XL khÃ´ng shop?</p>
 <div className="mt-2 flex items-center gap-2">
 <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-[9px] font-bold uppercase tracking-wider border border-primary-100">Äang hoáº¡t Ä‘á»™ng trÃªn web</span>
 </div>
 </div>
 
 <div className="bg-white p-3 rounded-lg border border-slate-300 hover:border-slate-400 cursor-pointer transition-all opacity-70">
 <div className="flex justify-between items-start mb-1">
 <p className="text-sm font-bold text-slate-900">KhÃ¡ch vÃ£ng lai #885</p>
 <span className="text-[10px] text-slate-500">5p trÆ°á»›c</span>
 </div>
 <p className="text-xs text-slate-700 truncate">MÃ¬nh muá»‘n Ä‘á»•i hÃ ng thÃ¬ lÃ m sao?</p>
 <div className="mt-2 flex items-center gap-2">
 <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">ÄÃ£ rá»i web</span>
 </div>
 </div>
 </div>
 </div>
 
 {/* Livechat Main Area */}
 <div className="flex-1 flex flex-col bg-[#F9FAFB]">
 <div className="p-4 bg-white border-b border-slate-300 flex justify-between items-center z-10 shadow-sm">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600">
 <Laptop className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-slate-900 text-sm">KhÃ¡ch vÃ£ng lai #889</h3>
 <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Äang xem: GiÃ y thá»ƒ thao nam siÃªu nháº¹</p>
 </div>
 </div>
 <div className="flex gap-2">
 <button className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">Lá»‹ch sá»­ Duyá»‡t web</button>

 {roleScope === 'platform' ? (
 <button className="px-3 py-1.5 text-xs font-bold text-[#FAF9F5] bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5">
 <Shield className="w-3.5 h-3.5" /> Can thiá»‡p Tranh cháº¥p
 </button>
 ) : (
 <>
 <button className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-all flex items-center gap-1.5">
 <Building2 className="w-3.5 h-3.5" /> Gá»i CSKH SÃ n
 </button>
 <button className="px-3 py-1.5 text-xs font-bold text-[#FAF9F5] bg-primary-600 hover:bg-primary-700 rounded-lg transition-all shadow-sm">Táº¡o ÄÆ¡n HÃ ng</button>
 </>
 )}
 </div>
 </div>
 
 <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
 <div className="text-center text-xs text-slate-500 font-medium my-4">â€” Cuá»™c trÃ² chuyá»‡n báº¯t Ä‘áº§u lÃºc 10:24 â€”</div>
 <div className="flex flex-col gap-1 items-start">
 <div className="px-4 py-2 bg-white border border-slate-300 rounded-lg rounded-tl-sm text-sm text-slate-800 max-w-[70%] shadow-sm">
 Sáº£n pháº©m nÃ y cÃ³ size XL khÃ´ng shop?
 </div>
 <span className="text-[10px] text-slate-500">10:24</span>
 </div>
 
 <div className="flex flex-col gap-1 items-end">
 <div className="px-4 py-2 bg-primary-600 text-[#FAF9F5] rounded-lg rounded-tr-sm text-sm max-w-[70%] shadow-sm">
 ChÃ o báº¡n, sáº£n pháº©m hiá»‡n táº¡i váº«n cÃ²n size XL nha báº¡n Æ¡i. MÃ¬nh mua hÃ´m nay Ä‘ang cÃ³ mÃ£ giáº£m giÃ¡ 10% Ä‘áº¥y áº¡.
 </div>
 <span className="text-[10px] text-slate-500">10:25 âœ“</span>
 </div>

 {roleScope === 'platform' && (
 <div className="my-6">
 <div className="flex items-center justify-center gap-4">
 <div className="h-px bg-rose-200 flex-1" />
 <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
 CSKH SÃ n (Admin) Ä‘Ã£ tham gia
 </span>
 <div className="h-px bg-rose-200 flex-1" />
 </div>
 <div className="flex flex-col gap-1 items-end mt-4">
 <div className="px-4 py-2 bg-rose-600 text-[#FAF9F5] rounded-lg rounded-tr-sm text-sm max-w-[70%] shadow-sm">
 ChÃ o báº¡n, mÃ¬nh lÃ  Admin tá»« há»‡ thá»‘ng. Báº¡n Ä‘ang gáº·p váº¥n Ä‘á» gÃ¬ vá»›i cá»­a hÃ ng nÃ y áº¡?
 </div>
 <span className="text-[10px] text-slate-500">10:28 âœ“</span>
 </div>
 </div>
 )}
 
 <div className="flex flex-col gap-1 items-start">
 <div className="flex items-center gap-2 text-xs text-slate-600 mb-1">
 <div className="flex gap-1">
 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
 </div>
 KhÃ¡ch hÃ ng Ä‘ang nháº­p...
 </div>
 </div>
 </div>
 
 <div className="p-4 bg-white border-t border-slate-300">
 <div className="relative">
 <input 
 type="text" 
 placeholder="Nháº­p tin nháº¯n (Nháº¥n Enter Ä‘á»ƒ gá»­i)..." 
 className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
 />
 <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex flex-col items-center justify-center bg-primary-600 text-[#FAF9F5] rounded-lg hover:bg-primary-700 transition-all">
 <Send className="w-4 h-4 ml-0.5" />
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'agents' && (
 <div className="p-6 bg-slate-50 min-h-[600px]">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2">
 <Users className="w-6 h-6 text-rose-600" /> Quáº£n lÃ½ Äá»™i ngÅ© CSKH & Extensions
 </h3>
 <p className="text-sm text-slate-600 mt-1">PhÃ¢n cÃ´ng ca trá»±c, thiáº¿t láº­p tá»•ng Ä‘Ã i viÃªn vÃ  Ä‘á»‹nh tuyáº¿n ticket/cuá»™c gá»i.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
 <Filter className="w-4 h-4" /> Lá»c nhÃ¢n viÃªn
 </button>
 <button className="bg-rose-600 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold hover:bg-rose-700 transition-all shadow-sm shadow-rose-500/30 flex items-center gap-2">
 <UserPlus className="w-4 h-4" /> ThÃªm thÃ nh viÃªn
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
 <div className="xl:col-span-2 space-y-6">
 {/* Team Stats */}
 <DraggableGrid className="grid grid-cols-3 gap-4" columns={3} gap={16}>
 <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center gap-4">
 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
 <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
 </div>
 <div>
 <p className="text-2xl font-black text-slate-900">12</p>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Äang Online</p>
 </div>
 </div>
 <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center gap-4">
 <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
 <PhoneCall className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-black text-slate-900">4</p>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Äang nghe mÃ¡y</p>
 </div>
 </div>
 <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center gap-4">
 <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
 <Ticket className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-black text-slate-900">45</p>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ticket Ä‘ang chá» xá»­ lÃ½</p>
 </div>
 </div>
 </DraggableGrid>

 {/* Staff List */}
 <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-x-auto min-w-0">
 <table className="w-full text-left">
 <thead className="bg-slate-50 border-b border-slate-200">
 <tr>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">NhÃ¢n viÃªn</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center">Tráº¡ng thÃ¡i</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">SLA / ÄÃ¡nh giÃ¡</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center">EXT (Tá»•ng Ä‘Ã i)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Thao tÃ¡c</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 <tr className="hover:bg-slate-50">
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
 <img src="https://ui-avatars.com/api/?name=Ngoc+Trinh&background=f4f4f5&color=3f3f46" alt="avatar" />
 </div>
 <div>
 <p className="font-bold text-slate-900 text-sm">Nguyá»…n Ngá»c Trinh</p>
 <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">{roleScope === 'platform' ? 'Há»— trá»£ Cá»­a HÃ ng (Platform)' : 'CSKH (Seller)'}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
 <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Sáºµn sÃ ng
 </span>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
 <span className="text-sm font-bold text-slate-900">4.9</span>
 <span className="text-xs text-slate-500">/ 120 SLA: 5p</span>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800">
 <Headset className="w-3.5 h-3.5 text-slate-500" /> 101
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <button className="p-2 text-slate-500 hover:text-orange-700 transition-colors">
 <Settings className="w-4 h-4" />
 </button>
 </td>
 </tr>
 <tr className="hover:bg-slate-50">
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
 <img src="https://ui-avatars.com/api/?name=Minh+Tuan&background=f4f4f5&color=3f3f46" alt="avatar" />
 </div>
 <div>
 <p className="font-bold text-slate-900 text-sm">Tráº§n Minh Tuáº¥n</p>
 <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">{roleScope === 'platform' ? 'Xá»­ lÃ½ Khiáº¿u Náº¡i (Platform)' : 'CSKH (Seller)'}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
 <PhoneCall className="w-3 h-3" /> Äang nghe mÃ¡y
 </span>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
 <span className="text-sm font-bold text-slate-900">4.7</span>
 <span className="text-xs text-slate-500">/ 85 SLA: 12p</span>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800">
 <Headset className="w-3.5 h-3.5 text-slate-500" /> 105
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <button className="p-2 text-slate-500 hover:text-orange-700 transition-colors">
 <Settings className="w-4 h-4" />
 </button>
 </td>
 </tr>
 <tr className="hover:bg-slate-50 opacity-60 grayscale">
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
 <img src="https://ui-avatars.com/api/?name=Van+A&background=f4f4f5&color=3f3f46" alt="avatar" />
 </div>
 <div>
 <p className="font-bold text-slate-900 text-sm">LÃª VÄƒn A</p>
 <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">{roleScope === 'platform' ? 'Há»— trá»£ Cá»­a HÃ ng (Platform)' : 'CSKH (Seller)'}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" /> Táº¡m nghá»‰
 </span>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-2">
 <Star className="w-4 h-4 text-amber-400" />
 <span className="text-sm font-bold text-slate-900">4.5</span>
 <span className="text-xs text-slate-500">/ 50 SLA: 15p</span>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-800">
 <Headset className="w-3.5 h-3.5 text-slate-500" /> 102
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <button className="p-2 text-slate-500 hover:text-orange-700 transition-colors">
 <Settings className="w-4 h-4" />
 </button>
 </td>
 </tr>
 </tbody>
 </table>
 </div>
 </div>

 {/* Ext & Routing Config */}
 <div className="space-y-6">
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm">
 <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
 <Shield className="w-4 h-4 text-primary-600" /> Äá»‹nh tuyáº¿n thÃ´ng minh (Smart Routing)
 </h4>
 <div className="space-y-4">
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
 <div className="flex justify-between items-center mb-2">
 <span className="text-xs font-bold text-slate-800">Quy táº¯c chia Ticket</span>
 <ToggleRight className="w-6 h-6 text-primary-600" />
 </div>
 <select className="w-full bg-white border border-slate-300 rounded text-xs p-1.5 font-medium focus:ring-2 focus:ring-primary-500/20">
 <option>Xoay vÃ²ng (Round Robin)</option>
 <option>Chia theo Khá»‘i lÆ°á»£ng (Load Balance)</option>
 <option>Ká»¹ nÄƒng (Skill-based)</option>
 </select>
 </div>
 
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
 <div className="flex justify-between items-center mb-2">
 <span className="text-xs font-bold text-slate-800">Äá»‹nh tuyáº¿n Cuá»™c gá»i OmiCall</span>
 <ToggleRight className="w-6 h-6 text-primary-600" />
 </div>
 <select className="w-full bg-white border border-slate-300 rounded text-xs p-1.5 font-medium focus:ring-2 focus:ring-primary-500/20">
 <option>Rung táº¥t cáº£ mÃ¡y (Ring All)</option>
 <option>Theo thá»© tá»± (Linear)</option>
 <option>Thá»i gian ráº£nh lÃ¢u nháº¥t</option>
 </select>
 </div>
 </div>
 </div>
 
 <div className="bg-primary-600 p-5 rounded-xl text-[#FAF9F5] shadow-sm shadow-indigo-600/20 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
 <h4 className="font-bold mb-2 flex items-center gap-2">
 <PhoneCall className="w-4 h-4" /> Äá»“ng bá»™ PBX (OmiCall)
 </h4>
 <p className="text-xs text-primary-100 font-medium leading-relaxed mb-4">
 Há»‡ thá»‘ng Ä‘Ã£ káº¿t ná»‘i OmiCall. Báº¡n cÃ³ thá»ƒ gÃ¡n Extension (Ext) cho tá»«ng nhÃ¢n viÃªn Ä‘á»ƒ nháº­n popup cuá»™c gá»i ngay trÃªn trÃ¬nh duyá»‡t.
 </p>
 <button className="w-full py-2 bg-white text-primary-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
 Quáº£n lÃ½ Ext (SIP)
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'config' && (
 <div className="p-6 bg-slate-50 min-h-[600px]">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2">
 <Settings className="w-6 h-6 text-slate-700" /> Cáº¥u hÃ¬nh KÃªnh & TÃ­ch há»£p (Omni-channel)
 </h3>
 <p className="text-sm text-slate-600 mt-1">Káº¿t ná»‘i vÃ  quáº£n lÃ½ cÃ¡c kÃªnh giao tiáº¿p vá»›i khÃ¡ch hÃ ng táº¡i má»™t nÆ¡i.</p>
 </div>
 </div>
 
 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-2 gap-6" columns={2} gap={24}>
 {/* Fanpage Config */}
 <div className="bg-white rounded-xl p-6 border border-slate-300 shadow-sm flex flex-col">
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-[#EAE7DF] rounded-xl flex items-center justify-center text-orange-700">
 <Globe className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-slate-900 text-lg">Facebook Fanpage</h4>
 <p className="text-xs text-slate-600">Äá»“ng bá»™ tin nháº¯n & bÃ¬nh luáº­n</p>
 </div>
 </div>
 <ToggleRight className="w-8 h-8 text-orange-700 shrink-0 cursor-pointer" />
 </div>
 
 <div className="space-y-4 mb-6 flex-1">
 <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center">
 <div className="flex items-center gap-3">
 <img src="https://ui-avatars.com/api/?name=VComm+Store&background=random" alt="" className="w-8 h-8 rounded-full" />
 <div>
 <p className="text-sm font-bold text-slate-900">VComm Official Store</p>
 <p className="text-[10px] text-emerald-600 font-bold">ÄÃ£ káº¿t ná»‘i</p>
 </div>
 </div>
 <button className="text-xs text-red-600 font-bold hover:underline">Há»§y káº¿t ná»‘i</button>
 </div>
 </div>
 
 <button className="w-full py-2.5 border-2 border-dashed border-slate-400 rounded-lg text-slate-700 font-bold text-sm hover:border-slate-900 hover:text-orange-700 transition-all flex justify-center items-center gap-2">
 <Plus className="w-4 h-4" /> ThÃªm Fanpage má»›i
 </button>
 </div>

 {/* Zalo OA Config */}
 <div className="bg-white rounded-xl p-6 border border-slate-300 shadow-sm flex flex-col">
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-slate-800/10 rounded-xl flex items-center justify-center text-orange-600">
 <MessageSquare className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-slate-900 text-lg">Zalo Official Account</h4>
 <p className="text-xs text-slate-600">Gá»­i ZNS & chat vá»›i khÃ¡ch hÃ ng</p>
 </div>
 </div>
 <ToggleRight className="w-8 h-8 text-orange-600 shrink-0 cursor-pointer" />
 </div>
 
 <div className="space-y-4 mb-6 flex-1">
 <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center opacity-70 grayscale">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-700">Z</div>
 <div>
 <p className="text-sm font-bold text-slate-900">ChÆ°a káº¿t ná»‘i OA nÃ o</p>
 <p className="text-[10px] text-slate-600 font-bold">Cáº§n cáº¥u hÃ¬nh API OA</p>
 </div>
 </div>
 </div>
 <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <p>Vui lÃ²ng táº¡o Zalo App vÃ  cáº¥p quyá»n truy cáº­p Zalo OA trÆ°á»›c khi káº¿t ná»‘i vÃ o há»‡ thá»‘ng.</p>
 </div>
 </div>
 
 <button className="w-full py-2.5 bg-slate-800 text-[#FAF9F5] rounded-lg font-bold text-sm hover:bg-slate-900 transition-all flex justify-center items-center gap-2 shadow-sm">
 <Plug className="w-4 h-4" /> Káº¿t ná»‘i Zalo OA
 </button>
 </div>

 {/* Web Livechat Widget */}
 <div className="bg-white rounded-xl p-6 border border-slate-300 shadow-sm flex flex-col lg:col-span-2">
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
 <Code2 className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-slate-900 text-lg">MÃ£ nhÃºng Livechat Website</h4>
 <p className="text-xs text-slate-600">ChÃ¨n widget chat trá»±c tiáº¿p lÃªn website cá»§a báº¡n</p>
 </div>
 </div>
 <ToggleRight className="w-8 h-8 text-primary-600 shrink-0 cursor-pointer" />
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div>
 <h5 className="text-xs font-bold text-slate-800 uppercase mb-3">TÃ¹y chá»‰nh giao diá»‡n</h5>
 <div className="space-y-4">
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1.5">MÃ u chá»§ Ä‘áº¡o (Hex code)</label>
 <div className="flex gap-2">
 <input type="color" value="#4F46E5" readOnly className="w-8 h-8 rounded border-none cursor-pointer" />
 <input type="text" value="#4F46E5" readOnly className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1 font-mono text-sm text-slate-700" />
 </div>
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1.5">Lá»i chÃ o máº·c Ä‘á»‹nh</label>
 <input type="text" value="ChÃ o báº¡n, VComm cÃ³ thá»ƒ giÃºp gÃ¬ cho báº¡n?" readOnly className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium" />
 </div>
 </div>
 </div>
 
 <div>
 <h5 className="text-xs font-bold text-slate-800 uppercase mb-3">Copy JavaScript Snippet</h5>
 <div className="relative">
 <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto min-w-0">
{`<script>
 window.VCommChatOptions = {
 appId: "vcomm_live_9a8b7c6d",
 color: "#4F46E5",
 greeting: "ChÃ o báº¡n..."
 };
</script>
<script src="https://cdn.vcomm.io/chat.js" async></script>`}
 </pre>
 <button className="absolute top-2 right-2 bg-slate-900/10 hover:bg-white/20 text-[#FAF9F5] rounded p-1.5 transition-all text-[10px] font-bold">Copy Code</button>
 </div>
 <p className="text-[10px] text-slate-600 mt-2 italic">* ChÃ¨n Ä‘oáº¡n mÃ£ nÃ y vÃ o tháº» &lt;head&gt; hoáº·c trÆ°á»›c tháº» Ä‘Ã³ng &lt;/body&gt; trÃªn website cá»§a báº¡n.</p>
 </div>
 </div>
 </div>
 </DraggableGrid>
 </div>
 )}
 </div>
 </div>

 {/* Ticket Detail / AI Reply Slide-over */}
 <AnimatePresence>
 {selectedTicket && (
 <div className="fixed inset-0 z-50 flex justify-end">
 <motion.div 
 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
 onClick={() => setSelectedTicket(null)}
 className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
 />
 <motion.div 
 initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
 transition={{ type: "spring", damping: 25, stiffness: 200 }}
 className="relative w-full max-w-lg bg-white shadow-sm border-l border-slate-300 flex flex-col z-10"
 >
 <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-start">
 <div>
 <h2 className="text-lg font-bold text-slate-900 break-words pr-4">{selectedTicket.subject}</h2>
 <div className="flex items-center gap-3 mt-2">
 <span className="text-xs font-mono font-bold text-slate-500 uppercase">{selectedTicket.id}</span>
 <span className={cn(
 "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
 selectedTicket.status === 'open' ? "bg-[#EAE7DF] text-orange-800" : "bg-amber-100 text-amber-700"
 )}>
 {selectedTicket.status === 'open' ? 'Má»šI' : 'ÄANG Xá»¬ LÃ'}
 </span>
 </div>
 </div>
 <button onClick={() => setSelectedTicket(null)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors shrink-0">
 <ArrowRight className="w-5 h-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-6">
 {/* Customer Info */}
 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
 <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
 <User className="w-5 h-5 text-slate-600" />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900">{selectedTicket.customerName}</p>
 <p className="text-xs text-slate-600">KhÃ¡ch hÃ ng VÃ ng â€¢ 12 Ä‘Æ¡n hÃ ng</p>
 </div>
 </div>

 {/* AI Sentiment analysis */}
 <div className={cn("p-4 rounded-lg border", selectedTicket.sentiment === 'critical' ? 'bg-red-50 border-red-100' : 'bg-primary-50 border-primary-100')}>
 <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2" style={{ color: selectedTicket.sentiment === 'critical' ? '#EF4444' : '#6366F1' }}>
 <Sparkles className="w-3 h-3" /> Nháº­n Ä‘á»‹nh AI
 </p>
 <p className="text-sm font-medium text-slate-800">
 {selectedTicket.sentiment === 'critical' ? 
 "KhÃ¡ch hÃ ng Ä‘ang cÃ³ thÃ¡i Ä‘á»™ ráº¥t bá»©c xÃºc. Cáº§n giáº£i quyáº¿t vÃ  Ä‘á»n bÃ¹ NGAY Láº¬P Tá»¨C Ä‘á»ƒ trÃ¡nh khá»§ng hoáº£ng truyá»n thÃ´ng." : 
 "KhÃ¡ch hÃ ng Ä‘Æ°a ra tháº¯c máº¯c thÃ´ng thÆ°á»ng, giá»ng Ä‘iá»‡u trung tÃ­nh. CÃ³ thá»ƒ dÃ¹ng template tráº£ lá»i tá»± Ä‘á»™ng."}
 </p>
 </div>

 {/* Reply Action */}
 <div className="space-y-3">
 <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
 <MessageSquare className="w-4 h-4 text-orange-600" /> Pháº£n há»“i khÃ¡ch hÃ ng
 </h3>
 <textarea 
 className="w-full h-32 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-all resize-none bg-slate-50"
 placeholder="Nháº­p ná»™i dung pháº£n há»“i..."
 value={draftedMessage}
 onChange={(e) => setDraftedMessage(e.target.value)}
 />
 
 <div className="flex gap-2">
 <button 
 onClick={handleSimulateAiReply}
 disabled={aiDrafting}
 className="flex-1 bg-primary-100 text-primary-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-primary-200 transition-all flex items-center justify-center gap-2"
 >
 {aiDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
 Tá»± Ä‘á»™ng soáº¡n báº±ng AI
 </button>
 <button className="bg-slate-900 text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-all">
 Gá»­i & ÄÃ³ng Ticket
 </button>
 </div>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}


