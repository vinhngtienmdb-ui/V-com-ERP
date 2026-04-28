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
  Facebook,
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
  { id: 'T1', channel: 'zalo', userName: 'Phạm Thị Lan', lastMessage: 'Đơn hàng của tôi bao giờ tới?', unreadCount: 2, updatedAt: '14:20' },
  { id: 'T2', channel: 'facebook', userName: 'Hoàng Anh Tuấn', lastMessage: 'Shop có túi xách màu kem không?', unreadCount: 0, updatedAt: '12:05' },
  { id: 'T3', channel: 'web', userName: 'Khách vãng lai #42', lastMessage: 'Sản phẩm này có bảo hành không ạ?', unreadCount: 1, updatedAt: '10:15' },
];

const MOCK_TICKETS = [
  { id: 'TKT-1042', customerName: 'Nguyễn Văn A', subject: 'Hàng nhận bị móp hộp', status: 'open', priority: 'high', type: 'complaint', createdAt: '10:45 20/04/2026', sentiment: 'critical' },
  { id: 'TKT-1041', customerName: 'Trần Thị B', subject: 'Hỏi về thời gian bảo hành', status: 'in_progress', priority: 'medium', type: 'inquiry', createdAt: '09:12 20/04/2026', sentiment: 'neutral' },
  { id: 'TKT-1040', customerName: 'Lê Văn C', subject: 'Lỗi thanh toán Momo', status: 'closed', priority: 'high', type: 'technical', createdAt: '16:30 19/04/2026', sentiment: 'negative' },
  { id: 'TKT-1039', customerName: 'Phạm D', subject: 'Cần đổi size áo', status: 'open', priority: 'medium', type: 'return', createdAt: '08:05 19/04/2026', sentiment: 'neutral' },
  { id: 'TKT-1038', customerName: 'Hoàng E', subject: 'Khen ngợi dịch vụ shipper', status: 'closed', priority: 'low', type: 'feedback', createdAt: '14:20 18/04/2026', sentiment: 'positive' },
];

const MOCK_FEEDBACKS = [
  { id: 'FB-001', customerName: 'Đặng F', rating: 5, comment: 'Giao hàng siêu nhanh, đóng gói cẩn thận. Sẽ ủng hộ shop dài dài!', date: 'Hôm nay', channel: 'shopee' },
  { id: 'FB-002', customerName: 'Vũ G', rating: 2, comment: 'Nhân viên tư vấn chậm, phản hồi khách hơi lâu.', date: 'Hôm qua', channel: 'zalo' },
  { id: 'FB-003', customerName: 'Bùi H', rating: 4, comment: 'Chất lượng oki, nhưng giá hơi cao so với thị trường một chút.', date: '18/04/2026', channel: 'web' },
];

const MOCK_CAMPAIGNS = [
  { id: 'CMP-01', name: 'Chúc mừng Sinh nhật Tháng 4', type: 'email', target: 'Khách hàng có sinh nhật trong tháng', sent: 1250, openRate: 45, clickRate: 12, status: 'active' },
  { id: 'CMP-02', name: 'Nhắc nhở sử dụng Voucher', type: 'sms', target: 'Khách hàng có voucher sắp hết hạn', sent: 840, openRate: 92, clickRate: 35, status: 'active' },
  { id: 'CMP-03', name: 'Khảo sát CSAT Q1', type: 'zalo', target: 'Khách hàng mua hàng trong Q1', sent: 5000, openRate: 68, clickRate: 20, status: 'completed' },
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
    { id: 'm1', channel: 'zalo', senderId: 'user', senderName: 'Phạm Thị Lan', text: 'Chào shop, đơn hàng ORD-9921 bao giờ giao vậy?', isAi: false, timestamp: '14:15' },
    { id: 'm2', channel: 'zalo', senderId: 'ai', senderName: 'AI Assistant', text: 'Chào chị Lan, em là trợ lý ảo VComm. Để em kiểm tra mã đơn ORD-9921 cho chị nhé!', isAi: true, timestamp: '14:16' },
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
      setDraftedMessage(`Dạ em chào anh/chị ${selectedTicket.customerName}, em bên bộ phận CSKH xin ghi nhận thông tin về vấn đề "${selectedTicket.subject}". Bộ phận liên quan đang tiến hành kiểm tra lại và sẽ xử lý ngay lập tức ạ. Xin lỗi vì sự bất tiện này.`);
      setAiDrafting(false);
    }, 1500);
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="header-title">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[#111827]">Chăm sóc Khách hàng</h1>
            <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-200 shadow-inner">
               <button 
                 onClick={() => setRoleScope('platform')}
                 className={cn("px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all", roleScope === 'platform' ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
               >
                  <Building2 className="w-3.5 h-3.5" /> Quản trị Sàn
               </button>
               <button 
                 onClick={() => setRoleScope('seller')}
                 className={cn("px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all", roleScope === 'seller' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-500 hover:text-slate-700")}
               >
                  <Store className="w-3.5 h-3.5" /> Quản trị Nhà Bán
               </button>
            </div>
          </div>
          <p className="text-sm text-[#6B7280] mt-1">
             {roleScope === 'platform' ? 'Quản lý vận hành hệ thống, giám sát đánh giá cửa hàng và hỗ trợ tranh chấp.' : 'Quản lý khiếu nại, phản hồi, và tự động hóa CSKH cho cửa hàng của bạn.'}
          </p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-600" />
            Báo cáo SLA
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            Tạo Ticket mới
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10 mb-2">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiếp nhận mới (Mở)</p>
             <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800 relative z-10">24</p>
          <div className="mt-2 text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg w-fit">Cần xử lý gấp: 5</div>
        </div>
        
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10 mb-2">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian P/hồi TB (SLA)</p>
             <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800 relative z-10">14 <span className="text-sm font-medium text-slate-500">phút</span></p>
          <div className="mt-2 text-[10px] text-emerald-500 font-medium">Nhanh hơn 5p so với tuần trước</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10 mb-2">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đánh giá chung (CSAT)</p>
             <Star className="w-4 h-4 text-yellow-500" />
          </div>
          <p className="text-3xl font-bold text-slate-800 relative z-10">4.8<span className="text-xl text-slate-400">/5</span></p>
          <div className="mt-2 text-[10px] text-emerald-500 font-medium">Rất xuất sắc</div>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-5 rounded-lg border border-slate-800 shadow-xl relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
          <div className="flex justify-between items-start relative z-10 mb-2">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Autofill / Auto-reply</p>
             <Sparkles className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-bold text-white relative z-10">68%</p>
          <div className="mt-2 text-[10px] text-indigo-200 font-medium tracking-wide">Tỷ lệ tự động hóa tin nhắn</div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
        {/* Navigation Tabs */}
        <div className="flex bg-slate-50 border-b border-slate-200 p-2 gap-2 overflow-x-auto hidden-scrollbar">
           <button 
             onClick={() => setActiveTab('tickets')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'tickets' ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <Ticket className="w-4 h-4" /> Quản lý Tickets
           </button>
           <button 
             onClick={() => setActiveTab('campaigns')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'campaigns' ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <Mail className="w-4 h-4" /> Chiến dịch Chăm sóc (Loyalty)
           </button>
           <button 
             onClick={() => setActiveTab('feedback')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'feedback' ? "bg-white text-purple-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <Star className="w-4 h-4" /> Phản hồi & Đánh giá
           </button>
           <button 
             onClick={() => setActiveTab('chat')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'chat' ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <MessageSquare className="w-4 h-4" /> Chat Đa kênh (FB/Zalo)
           </button>
           <button 
             onClick={() => setActiveTab('calls')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'calls' ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <PhoneCall className="w-4 h-4" /> Tổng đài OmiCall
           </button>
           <button 
             onClick={() => setActiveTab('livechat')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'livechat' ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <MessageCircle className="w-4 h-4" /> Livechat Website
           </button>
           <button 
             onClick={() => setActiveTab('agents')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'agents' ? "bg-white text-rose-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <Users className="w-4 h-4" /> Đội ngũ & Extension
           </button>
           <button 
             onClick={() => setActiveTab('config')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'config' ? "bg-white text-slate-800 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <Settings className="w-4 h-4" /> Cấu hình Kênh
           </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-slate-50 flex flex-wrap gap-4 items-center justify-between">
           <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder={activeTab === 'tickets' ? "Tìm mã ticket, tên khách hàng..." : "Tìm kiếm..."} 
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                />
              </div>
              <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm text-slate-600 flex items-center gap-2 font-bold hover:bg-slate-50">
                 <Filter className="w-4 h-4" /> Bộ lọc
              </button>
           </div>
        </div>

        {/* Content by Tab */}
        <div className="flex-1 overflow-x-auto">
           {activeTab === 'tickets' && (
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Ticket ID & KH</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Vấn đề / Tiêu đề</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed">Trạng thái</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed">Mức độ ưu tiên</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right leading-relaxed">Thời gian</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {MOCK_TICKETS.map(ticket => (
                       <tr 
                          key={ticket.id} 
                          onClick={() => setSelectedTicket(ticket)}
                          className={cn("hover:bg-blue-50/50 cursor-pointer transition-colors group", ticket.status === 'open' ? 'bg-white' : 'bg-slate-50/30')}
                        >
                          <td className="px-6 py-4">
                             <p className="text-xs font-mono font-bold text-slate-600 mb-0.5">{ticket.id}</p>
                             <p className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{ticket.customerName}</p>
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-2">
                               {ticket.sentiment === 'critical' ? <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> : 
                                ticket.sentiment === 'negative' ? <span className="w-2 h-2 rounded-full bg-orange-500" /> : 
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />}
                               <div>
                                 <p className="text-sm font-bold text-slate-700">{ticket.subject}</p>
                                 <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">{ticket.type}</p>
                               </div>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={cn(
                               "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                               ticket.status === 'open' ? "bg-blue-100 text-blue-700" : 
                               ticket.status === 'in_progress' ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-500"
                             )}>
                               {ticket.status === 'open' ? 'MỚI' : ticket.status === 'in_progress' ? 'ĐANG XỬ LÝ' : 'ĐÃ ĐÓNG'}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <span className={cn(
                               "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
                               ticket.priority === 'high' ? "border-red-200 text-red-600 bg-red-50" : 
                               ticket.priority === 'medium' ? "border-amber-200 text-amber-600 bg-amber-50" : "border-slate-200 text-slate-500 bg-white"
                             )}>
                               {ticket.priority}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <p className="text-xs text-slate-600 font-medium">{ticket.createdAt}</p>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           )}

           {activeTab === 'campaigns' && (
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-100">
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Tên Chiến dịch</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Kênh / Đối tượng</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed">Đã gửi</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed">Tỷ lệ Mở (Open Rate)</th>
                       <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right leading-relaxed">Trạng thái</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {MOCK_CAMPAIGNS.map(camp => (
                       <tr key={camp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                             <p className="text-sm font-bold text-slate-800">{camp.name}</p>
                             <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{camp.id}</p>
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-0.5">{camp.type}</p>
                             <p className="text-xs text-slate-500">{camp.target}</p>
                          </td>
                          <td className="px-6 py-4 text-center font-mono font-bold text-slate-700">
                             {camp.sent.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                             <div className="flex flex-col items-center gap-1">
                               <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-emerald-500" style={{ width: `${camp.openRate}%` }} />
                               </div>
                               <span className="text-[10px] font-bold text-slate-500">{camp.openRate}%</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                             <span className={cn(
                               "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block",
                               camp.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-500"
                             )}>
                               {camp.status === 'active' ? 'ĐANG CHẠY' : 'HOÀN THÀNH'}
                             </span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           )}

           {activeTab === 'feedback' && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {MOCK_FEEDBACKS.map(fb => (
                    <div key={fb.id} className="p-5 border border-slate-200 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow">
                       <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-2">
                             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs">
                                {fb.customerName.charAt(0)}
                             </div>
                             <div>
                                <p className="text-sm font-bold text-slate-800">{fb.customerName}</p>
                                <p className="text-[10px] text-slate-400 capitalize">{fb.channel}</p>
                             </div>
                          </div>
                          <span className="text-[10px] font-medium text-slate-400">{fb.date}</span>
                       </div>
                       <div className="flex gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                             <Star key={i} className={cn("w-3 h-3", i < fb.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-200")} />
                          ))}
                       </div>
                       <p className="text-sm text-slate-600 italic">"{fb.comment}"</p>
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
                      Kênh tương tác (API)
                    </h2>
                    <div className="flex gap-2">
                        <button className="flex-1 bg-blue-600 text-white text-[10px] font-bold py-1.5 rounded-lg flex justify-center items-center gap-1 shadow-sm"><span className="w-3 h-3 flex items-center justify-center rounded-full bg-white text-blue-600">f</span> Fanpage</button>
                        <button className="flex-1 bg-blue-500 text-white text-[10px] font-bold py-1.5 rounded-lg flex justify-center items-center gap-1 shadow-sm"><MessageSquare className="w-3 h-3" /> Zalo OA</button>
                    </div>
                    <div className="relative mt-4">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                      <input 
                        type="text" 
                        placeholder="Tìm khách hàng..." 
                        className="w-full bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
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
                          <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-500">
                            {thread.userAvatar ? <img src={thread.userAvatar} alt="" className="rounded-full" /> : thread.userName[0]}
                          </div>
                          <div className={cn("absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white", thread.channel === 'facebook' ? "bg-blue-600" : thread.channel === 'zalo' ? "bg-blue-500" : "bg-slate-500")}>
                             {thread.channel === 'facebook' ? <span className="text-[8px] font-bold text-white">f</span> : thread.channel === 'zalo' ? <MessageSquare className="w-2 h-2 text-white" /> : <Globe className="w-2 h-2 text-white" />}
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
                          <div className="absolute top-1/2 -translate-y-1/2 right-4 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
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
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs border border-slate-200 text-slate-500">
                           {activeThread?.userName[0]}
                        </div>
                        <div>
                           <h3 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                              {activeThread?.userName}
                              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                           </h3>
                           <p className="text-[10px] text-emerald-600 font-medium">Đang hoạt động trên {activeThread?.channel}</p>
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
                            msg.senderId === 'ai' ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-500"
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
                                 ? "bg-white text-slate-800 border border-slate-200 rounded-bl-sm" 
                                 : "bg-blue-600 text-white rounded-br-sm"
                             )}>
                                {msg.text}
                             </div>
                             <div className="flex items-center gap-2 px-1">
                                <span className={cn("text-[9px] font-medium tracking-wide", msg.senderId === 'ai' ? "text-slate-400" : "text-blue-300")}>{msg.senderName} • {msg.timestamp}</span>
                                {msg.senderId === 'user' && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                             </div>
                          </div>
                       </div>
                     ))}
                     {isAiProcessing && (
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Bot className="w-4 h-4 animate-bounce" />
                         </div>
                         <div className="bg-white border border-slate-200 p-4 rounded-lg rounded-bl-sm shadow-sm flex items-center gap-3">
                            <span className="text-xs text-slate-600 font-bold tracking-wide">AI Assistant đang soạn câu trả lời</span>
                            <div className="flex gap-1.5">
                               <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                               <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                               <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                            </div>
                         </div>
                       </div>
                     )}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-3">
                     <div className="flex gap-2 p-1 overflow-x-auto hidden-scrollbar">
                        <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-full whitespace-nowrap transition-colors">Xin chào</button>
                        <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-full whitespace-nowrap transition-colors">Xin thông tin nhận hàng</button>
                        <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-full whitespace-nowrap transition-colors">Gửi mã freeship</button>
                        <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-full whitespace-nowrap transition-colors">Thông báo chậm hàng</button>
                     </div>
                     <div className="flex items-center gap-3">
                        <button className="p-2.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-all flex-shrink-0">
                           <Plus className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative">
                           <input 
                             type="text" 
                             value={inputValue}
                             onChange={(e) => setInputValue(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                             placeholder="Nhập tin nhắn..." 
                             className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all font-medium"
                           />
                           <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-blue-500/20" onClick={handleSendMessage} disabled={isAiProcessing || !inputValue.trim()}>
                              <Send className="w-4 h-4 ml-0.5" />
                           </button>
                        </div>
                        <button className="bg-amber-100 hover:bg-amber-200 p-3 rounded-xl transition-colors flex-shrink-0 relative group">
                           <Zap className="w-5 h-5 text-amber-600 fill-current" />
                           <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                              Dùng AI trả lời
                           </div>
                        </button>
                     </div>
                     <div className="text-center mt-1">
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">Được hỗ trợ bởi Gemini AI Engine</p>
                     </div>
                  </div>
                </div>

                {/* Right Sidebar - Info */}
                <div className="w-[280px] border-l border-[#F3F4F6] bg-slate-50/50 flex flex-col p-6 space-y-6 overflow-y-auto">
                   <div className="text-center space-y-3">
                      <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-white shadow-md mx-auto flex items-center justify-center text-2xl font-bold text-slate-400">
                         {activeThread?.userName[0]}
                      </div>
                      <div>
                         <h3 className="font-bold text-[#111827]">{activeThread?.userName}</h3>
                         <p className="text-xs text-[#6B7280]">{activeThread?.channel === 'zalo' ? 'Vietnam' : 'Social Hub'}</p>
                      </div>
                      <div className="flex justify-center gap-2">
                         <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">New Customer</span>
                         <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold">VIP Vàng</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between items-center border-b border-[#F3F4F6] pb-2">
                         <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest">Đơn hàng gần đây</h4>
                         <button className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1">
                            <Plus className="w-3 h-3" /> Tạo đơn
                         </button>
                      </div>
                      <div className="space-y-3">
                         {[
                           { id: 'ORD-9921', status: 'shipping', amount: 1540000 },
                           { id: 'ORD-8840', status: 'delivered', amount: 850000 }
                         ].map(order => (
                           <div key={order.id} className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm space-y-1 hover:border-blue-200 transition-all cursor-pointer">
                              <div className="flex justify-between items-start">
                                 <span className="text-xs font-bold text-[#111827] font-mono">{order.id}</span>
                                 <span className={cn(
                                   "text-[9px] font-bold uppercase",
                                   order.status === 'shipping' ? "text-blue-600" : "text-emerald-600"
                                 )}>{order.status}</span>
                              </div>
                              <p className="text-sm font-bold text-[#2563EB]">{formatCurrency(order.amount)}</p>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="bg-indigo-50 p-4 rounded-lg space-y-2 border border-indigo-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute right-0 top-0 w-16 h-16 bg-white/40 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
                      <h4 className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest flex items-center gap-2 relative z-10">
                         <Sparkles className="w-3 h-3 text-indigo-500" /> Nhận định AI
                      </h4>
                      <p className="text-[11px] text-indigo-900 leading-relaxed font-medium relative z-10">Khách hàng hỏi về lịch giao đơn ORD-9921. Đây là khách hàng VIP, có thể chủ động đề nghị freeship đơn sau.</p>
                   </div>
                </div>
              </div>
           )}

           {activeTab === 'calls' && (
              <div className="flex h-[600px]">
                 {/* OmiCall Dialer */}
                 <div className="w-1/3 border-r border-slate-200 bg-slate-50/50 p-6 flex flex-col items-center">
                    <h3 className="font-bold text-slate-800 text-lg mb-2 text-center w-full">Tổng đài OmiCall (VoIP)</h3>
                    <div className="flex items-center gap-2 mb-8 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SIP Registered • Ext: 101
                    </div>
                    
                    <div className="bg-white w-full max-w-sm rounded-xl p-6 shadow-xl border border-slate-200 flex flex-col items-center">
                       <div className="w-full bg-slate-100 h-16 rounded-lg flex items-center justify-center mb-8 text-2xl font-mono font-bold text-slate-700 tracing-widest">
                          090 123 4567
                       </div>
                       
                       <div className="grid grid-cols-3 gap-4 w-full px-4 mb-8">
                          {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(num => (
                             <button key={num} className="h-14 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xl font-bold flex items-center justify-center transition-all active:scale-95 shadow-sm">
                                {num}
                             </button>
                          ))}
                       </div>
                       
                       <button className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition-all active:scale-95">
                          <PhoneCall className="w-8 h-8" />
                       </button>
                    </div>
                 </div>

                 {/* Call Logs */}
                 <div className="flex-1 bg-white p-6">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2"><History className="w-5 h-5 text-blue-600" /> Lịch sử cuộc gọi (Call Logs)</h3>
                       <button className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-all">Đồng bộ OmiCall API</button>
                    </div>

                    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                       <table className="w-full text-left border-collapse">
                          <thead>
                             <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest leading-relaxed">Khách hàng</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed">Loại Hướng</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed">Trạng thái</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed">Thời lượng</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed">File Ghi âm</th>
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right leading-relaxed">Thời gian / Ghi chú</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {[
                               { time: '14:20 20/04/2026', duration: '02:45', status: 'missed', caller: '0901234567', type: 'inbound', name: 'Nguyễn Văn A', hasAudio: false },
                               { time: '10:15 20/04/2026', duration: '08:12', status: 'completed', caller: '0987654321', type: 'outbound', name: 'Trần Thị B', hasAudio: true },
                               { time: '09:05 19/04/2026', duration: '01:20', status: 'completed', caller: '0919876543', type: 'inbound', name: 'Le Van C', hasAudio: true }
                             ].map((log, i) => (
                               <tr key={i} className="hover:bg-slate-50 transition-colors">
                                  <td className="px-6 py-4">
                                     <p className="text-sm font-bold text-slate-800">{log.name}</p>
                                     <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.caller}</p>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                     <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", log.type === 'inbound' ? "border-blue-200 text-blue-600 bg-blue-50" : "border-purple-200 text-purple-600 bg-purple-50")}>
                                        {log.type === 'inbound' ? 'GỌI VÀO' : 'GỌI RA'}
                                     </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                     <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", log.status === 'completed' ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50")}>
                                        {log.status === 'completed' ? 'THÀNH CÔNG' : 'GỌI NHỠ'}
                                     </span>
                                  </td>
                                  <td className="px-6 py-4 text-center text-sm font-mono text-slate-600 font-bold">
                                     {log.duration}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                     {log.hasAudio ? (
                                        <button className="inline-flex p-1.5 bg-blue-50 text-blue-600 rounded-lg items-center justify-center hover:bg-blue-100 transition-colors tooltip" title="Nghe lại">
                                           <Headphones className="w-4 h-4" />
                                        </button>
                                     ) : (
                                        <span className="text-slate-300">-</span>
                                     )}
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                     <div className="text-xs text-slate-500 font-medium mb-1 border-b border-dashed border-slate-200 pb-1 inline-block">
                                        {log.time}
                                     </div>
                                     <div>
                                        <button className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-widest mt-0.5">Thêm ghi chú</button>
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
                    <div className="p-4 border-b border-slate-200 bg-white">
                       <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
                          <Laptop className="w-5 h-5 text-indigo-600" /> Web Livechat
                       </h3>
                       <div className="flex bg-slate-100 p-1 rounded-lg">
                          <button className="flex-1 bg-white shadow-sm text-xs font-bold py-1.5 rounded-md text-slate-700 transition-all text-center">Đang chờ (12)</button>
                          <button className="flex-1 text-xs font-bold py-1.5 rounded-md text-slate-500 hover:text-slate-700 transition-all text-center">Đang xử lý (5)</button>
                       </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                       <div className="bg-white p-3 rounded-lg border border-indigo-200 shadow-sm relative overflow-hidden cursor-pointer">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                          <div className="flex justify-between items-start mb-1">
                             <p className="text-sm font-bold text-slate-800">Khách vãng lai #889</p>
                             <span className="text-[10px] text-slate-400">Vừa xong</span>
                          </div>
                          <p className="text-xs text-slate-600 truncate">Sản phẩm này có size XL không shop?</p>
                          <div className="mt-2 flex items-center gap-2">
                             <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-bold uppercase tracking-wider border border-indigo-100">Đang hoạt động trên web</span>
                          </div>
                       </div>
                       
                       <div className="bg-white p-3 rounded-lg border border-slate-200 hover:border-slate-300 cursor-pointer transition-all opacity-70">
                          <div className="flex justify-between items-start mb-1">
                             <p className="text-sm font-bold text-slate-800">Khách vãng lai #885</p>
                             <span className="text-[10px] text-slate-400">5p trước</span>
                          </div>
                          <p className="text-xs text-slate-600 truncate">Mình muốn đổi hàng thì làm sao?</p>
                          <div className="mt-2 flex items-center gap-2">
                             <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-bold uppercase tracking-wider">Đã rời web</span>
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 {/* Livechat Main Area */}
                 <div className="flex-1 flex flex-col bg-[#F9FAFB]">
                    <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center z-10 shadow-sm">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                             <Laptop className="w-5 h-5" />
                          </div>
                          <div>
                             <h3 className="font-bold text-slate-800 text-sm">Khách vãng lai #889</h3>
                             <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Đang xem: Giày thể thao nam siêu nhẹ</p>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <button className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">Lịch sử Duyệt web</button>

                          {roleScope === 'platform' ? (
                             <button className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5" /> Can thiệp Tranh chấp
                             </button>
                          ) : (
                             <>
                                <button className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-all flex items-center gap-1.5">
                                   <Building2 className="w-3.5 h-3.5" /> Gọi CSKH Sàn
                                </button>
                                <button className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm">Tạo Đơn Hàng</button>
                             </>
                          )}
                       </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                       <div className="text-center text-xs text-slate-400 font-medium my-4">— Cuộc trò chuyện bắt đầu lúc 10:24 —</div>
                       <div className="flex flex-col gap-1 items-start">
                          <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg rounded-tl-sm text-sm text-slate-700 max-w-[70%] shadow-sm">
                             Sản phẩm này có size XL không shop?
                          </div>
                          <span className="text-[10px] text-slate-400">10:24</span>
                       </div>
                       
                       <div className="flex flex-col gap-1 items-end">
                          <div className="px-4 py-2 bg-indigo-600 text-white rounded-lg rounded-tr-sm text-sm max-w-[70%] shadow-sm">
                             Chào bạn, sản phẩm hiện tại vẫn còn size XL nha bạn ơi. Mình mua hôm nay đang có mã giảm giá 10% đấy ạ.
                          </div>
                          <span className="text-[10px] text-slate-400">10:25 ✓</span>
                       </div>

                       {roleScope === 'platform' && (
                         <div className="my-6">
                            <div className="flex items-center justify-center gap-4">
                               <div className="h-px bg-rose-200 flex-1" />
                               <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                                  CSKH Sàn (Admin) đã tham gia
                               </span>
                               <div className="h-px bg-rose-200 flex-1" />
                            </div>
                            <div className="flex flex-col gap-1 items-end mt-4">
                               <div className="px-4 py-2 bg-rose-600 text-white rounded-lg rounded-tr-sm text-sm max-w-[70%] shadow-sm">
                                  Chào bạn, mình là Admin từ hệ thống. Bạn đang gặp vấn đề gì với cửa hàng này ạ?
                               </div>
                               <span className="text-[10px] text-slate-400">10:28 ✓</span>
                            </div>
                         </div>
                       )}
                       
                       <div className="flex flex-col gap-1 items-start">
                          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                             <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                             </div>
                             Khách hàng đang nhập...
                          </div>
                       </div>
                    </div>
                    
                    <div className="p-4 bg-white border-t border-slate-200">
                       <div className="relative">
                          <input 
                            type="text" 
                            placeholder="Nhập tin nhắn (Nhấn Enter để gửi)..." 
                            className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                          />
                          <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex flex-col items-center justify-center bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
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
                       <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                          <Users className="w-6 h-6 text-rose-600" /> Quản lý Đội ngũ CSKH & Extensions
                       </h3>
                       <p className="text-sm text-slate-500 mt-1">Phân công ca trực, thiết lập tổng đài viên và định tuyến ticket/cuộc gọi.</p>
                    </div>
                    <div className="flex gap-3">
                       <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
                          <Filter className="w-4 h-4" /> Lọc nhân viên
                       </button>
                       <button className="bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-rose-700 transition-all shadow-sm shadow-rose-500/30 flex items-center gap-2">
                          <UserPlus className="w-4 h-4" /> Thêm thành viên
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2 space-y-6">
                       {/* Team Stats */}
                       <div className="grid grid-cols-3 gap-4">
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                             <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                                <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                             </div>
                             <div>
                                <p className="text-2xl font-black text-slate-800">12</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang Online</p>
                             </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                             <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                                <PhoneCall className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-2xl font-black text-slate-800">4</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Đang nghe máy</p>
                             </div>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
                             <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                                <Ticket className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-2xl font-black text-slate-800">45</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ticket đang chờ xử lý</p>
                             </div>
                          </div>
                       </div>

                       {/* Staff List */}
                       <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                          <table className="w-full text-left">
                             <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                   <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Nhân viên</th>
                                   <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái</th>
                                   <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">SLA / Đánh giá</th>
                                   <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">EXT (Tổng đài)</th>
                                   <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Thao tác</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-100">
                                <tr className="hover:bg-slate-50">
                                   <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                            <img src="https://ui-avatars.com/api/?name=Ngoc+Trinh&background=f4f4f5&color=3f3f46" alt="avatar" />
                                         </div>
                                         <div>
                                            <p className="font-bold text-slate-800 text-sm">Nguyễn Ngọc Trinh</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{roleScope === 'platform' ? 'Hỗ trợ Cửa Hàng (Platform)' : 'CSKH (Seller)'}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Sẵn sàng
                                      </span>
                                   </td>
                                   <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                         <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                         <span className="text-sm font-bold text-slate-800">4.9</span>
                                         <span className="text-xs text-slate-400">/ 120 SLA: 5p</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-700">
                                         <Headset className="w-3.5 h-3.5 text-slate-400" /> 101
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                         <Settings className="w-4 h-4" />
                                      </button>
                                   </td>
                                </tr>
                                <tr className="hover:bg-slate-50">
                                   <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                            <img src="https://ui-avatars.com/api/?name=Minh+Tuan&background=f4f4f5&color=3f3f46" alt="avatar" />
                                         </div>
                                         <div>
                                            <p className="font-bold text-slate-800 text-sm">Trần Minh Tuấn</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{roleScope === 'platform' ? 'Xử lý Khiếu Nại (Platform)' : 'CSKH (Seller)'}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
                                         <PhoneCall className="w-3 h-3" /> Đang nghe máy
                                      </span>
                                   </td>
                                   <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                         <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                                         <span className="text-sm font-bold text-slate-800">4.7</span>
                                         <span className="text-xs text-slate-400">/ 85 SLA: 12p</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-700">
                                         <Headset className="w-3.5 h-3.5 text-slate-400" /> 105
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                         <Settings className="w-4 h-4" />
                                      </button>
                                   </td>
                                </tr>
                                <tr className="hover:bg-slate-50 opacity-60 grayscale">
                                   <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                         <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                            <img src="https://ui-avatars.com/api/?name=Van+A&background=f4f4f5&color=3f3f46" alt="avatar" />
                                         </div>
                                         <div>
                                            <p className="font-bold text-slate-800 text-sm">Lê Văn A</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{roleScope === 'platform' ? 'Hỗ trợ Cửa Hàng (Platform)' : 'CSKH (Seller)'}</p>
                                         </div>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                                         <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" /> Tạm nghỉ
                                      </span>
                                   </td>
                                   <td className="px-6 py-4">
                                      <div className="flex items-center gap-2">
                                         <Star className="w-4 h-4 text-amber-400" />
                                         <span className="text-sm font-bold text-slate-800">4.5</span>
                                         <span className="text-xs text-slate-400">/ 50 SLA: 15p</span>
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-center">
                                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono font-bold text-slate-700">
                                         <Headset className="w-3.5 h-3.5 text-slate-400" /> 102
                                      </div>
                                   </td>
                                   <td className="px-6 py-4 text-right">
                                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
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
                       <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                             <Shield className="w-4 h-4 text-indigo-600" /> Định tuyến thông minh (Smart Routing)
                          </h4>
                          <div className="space-y-4">
                             <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                   <span className="text-xs font-bold text-slate-700">Quy tắc chia Ticket</span>
                                   <ToggleRight className="w-6 h-6 text-indigo-600" />
                                </div>
                                <select className="w-full bg-white border border-slate-200 rounded text-xs p-1.5 font-medium focus:ring-2 focus:ring-indigo-500/20">
                                   <option>Xoay vòng (Round Robin)</option>
                                   <option>Chia theo Khối lượng (Load Balance)</option>
                                   <option>Kỹ năng (Skill-based)</option>
                                </select>
                             </div>
                             
                             <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg">
                                <div className="flex justify-between items-center mb-2">
                                   <span className="text-xs font-bold text-slate-700">Định tuyến Cuộc gọi OmiCall</span>
                                   <ToggleRight className="w-6 h-6 text-indigo-600" />
                                </div>
                                <select className="w-full bg-white border border-slate-200 rounded text-xs p-1.5 font-medium focus:ring-2 focus:ring-indigo-500/20">
                                   <option>Rung tất cả máy (Ring All)</option>
                                   <option>Theo thứ tự (Linear)</option>
                                   <option>Thời gian rảnh lâu nhất</option>
                                </select>
                             </div>
                          </div>
                       </div>
                       
                       <div className="bg-indigo-600 p-5 rounded-xl text-white shadow-lg shadow-indigo-600/20 relative overflow-hidden">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
                          <h4 className="font-bold mb-2 flex items-center gap-2">
                             <PhoneCall className="w-4 h-4" /> Đồng bộ PBX (OmiCall)
                          </h4>
                          <p className="text-xs text-indigo-100 font-medium leading-relaxed mb-4">
                             Hệ thống đã kết nối OmiCall. Bạn có thể gán Extension (Ext) cho từng nhân viên để nhận popup cuộc gọi ngay trên trình duyệt.
                          </p>
                          <button className="w-full py-2 bg-white text-indigo-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                             Quản lý Ext (SIP)
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
                       <h3 className="font-bold text-slate-800 text-xl flex items-center gap-2">
                          <Settings className="w-6 h-6 text-slate-600" /> Cấu hình Kênh & Tích hợp (Omni-channel)
                       </h3>
                       <p className="text-sm text-slate-500 mt-1">Kết nối và quản lý các kênh giao tiếp với khách hàng tại một nơi.</p>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Fanpage Config */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                                <Facebook className="w-6 h-6" />
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-800 text-lg">Facebook Fanpage</h4>
                                <p className="text-xs text-slate-500">Đồng bộ tin nhắn & bình luận</p>
                             </div>
                          </div>
                          <ToggleRight className="w-8 h-8 text-blue-600 shrink-0 cursor-pointer" />
                       </div>
                       
                       <div className="space-y-4 mb-6 flex-1">
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                             <div className="flex items-center gap-3">
                                <img src="https://ui-avatars.com/api/?name=VComm+Store&background=random" alt="" className="w-8 h-8 rounded-full" />
                                <div>
                                   <p className="text-sm font-bold text-slate-800">VComm Official Store</p>
                                   <p className="text-[10px] text-emerald-600 font-bold">Đã kết nối</p>
                                </div>
                             </div>
                             <button className="text-xs text-red-600 font-bold hover:underline">Hủy kết nối</button>
                          </div>
                       </div>
                       
                       <button className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 font-bold text-sm hover:border-blue-500 hover:text-blue-600 transition-all flex justify-center items-center gap-2">
                          <Plus className="w-4 h-4" /> Thêm Fanpage mới
                       </button>
                    </div>

                    {/* Zalo OA Config */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col">
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                                <MessageSquare className="w-6 h-6" />
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-800 text-lg">Zalo Official Account</h4>
                                <p className="text-xs text-slate-500">Gửi ZNS & chat với khách hàng</p>
                             </div>
                          </div>
                          <ToggleRight className="w-8 h-8 text-blue-500 shrink-0 cursor-pointer" />
                       </div>
                       
                       <div className="space-y-4 mb-6 flex-1">
                          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center opacity-70 grayscale">
                             <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">Z</div>
                                <div>
                                   <p className="text-sm font-bold text-slate-800">Chưa kết nối OA nào</p>
                                   <p className="text-[10px] text-slate-500 font-bold">Cần cấu hình API OA</p>
                                </div>
                             </div>
                          </div>
                          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 flex items-start gap-2">
                             <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                             <p>Vui lòng tạo Zalo App và cấp quyền truy cập Zalo OA trước khi kết nối vào hệ thống.</p>
                          </div>
                       </div>
                       
                       <button className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-all flex justify-center items-center gap-2 shadow-sm">
                          <Plug className="w-4 h-4" /> Kết nối Zalo OA
                       </button>
                    </div>

                    {/* Web Livechat Widget */}
                    <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex flex-col lg:col-span-2">
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                <Code2 className="w-6 h-6" />
                             </div>
                             <div>
                                <h4 className="font-bold text-slate-800 text-lg">Mã nhúng Livechat Website</h4>
                                <p className="text-xs text-slate-500">Chèn widget chat trực tiếp lên website của bạn</p>
                             </div>
                          </div>
                          <ToggleRight className="w-8 h-8 text-indigo-600 shrink-0 cursor-pointer" />
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                             <h5 className="text-xs font-bold text-slate-700 uppercase mb-3">Tùy chỉnh giao diện</h5>
                             <div className="space-y-4">
                                <div>
                                   <label className="text-xs font-bold text-slate-600 block mb-1.5">Màu chủ đạo (Hex code)</label>
                                   <div className="flex gap-2">
                                      <input type="color" value="#4F46E5" readOnly className="w-8 h-8 rounded border-none cursor-pointer" />
                                      <input type="text" value="#4F46E5" readOnly className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1 font-mono text-sm text-slate-600" />
                                   </div>
                                </div>
                                <div>
                                   <label className="text-xs font-bold text-slate-600 block mb-1.5">Lời chào mặc định</label>
                                   <input type="text" value="Chào bạn, VComm có thể giúp gì cho bạn?" readOnly className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 font-medium" />
                                </div>
                             </div>
                          </div>
                          
                          <div>
                             <h5 className="text-xs font-bold text-slate-700 uppercase mb-3">Copy JavaScript Snippet</h5>
                             <div className="relative">
                                <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto">
{`<script>
  window.VCommChatOptions = {
    appId: "vcomm_live_9a8b7c6d",
    color: "#4F46E5",
    greeting: "Chào bạn..."
  };
</script>
<script src="https://cdn.vcomm.io/chat.js" async></script>`}
                                </pre>
                                <button className="absolute top-2 right-2 bg-white/10 hover:bg-white/20 text-white rounded p-1.5 transition-all text-[10px] font-bold">Copy Code</button>
                             </div>
                             <p className="text-[10px] text-slate-500 mt-2 italic">* Chèn đoạn mã này vào thẻ &lt;head&gt; hoặc trước thẻ đóng &lt;/body&gt; trên website của bạn.</p>
                          </div>
                       </div>
                    </div>
                 </div>
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
              className="relative w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col z-10"
            >
               <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-start">
                  <div>
                    <h2 className="text-lg font-bold text-slate-800 break-words pr-4">{selectedTicket.subject}</h2>
                    <div className="flex items-center gap-3 mt-2">
                       <span className="text-xs font-mono font-bold text-slate-400 uppercase">{selectedTicket.id}</span>
                       <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          selectedTicket.status === 'open' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {selectedTicket.status === 'open' ? 'MỚI' : 'ĐANG XỬ LÝ'}
                        </span>
                    </div>
                  </div>
                  <button onClick={() => setSelectedTicket(null)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors shrink-0">
                     <ArrowRight className="w-5 h-5" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Customer Info */}
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                     <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-500" />
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-800">{selectedTicket.customerName}</p>
                        <p className="text-xs text-slate-500">Khách hàng Vàng • 12 đơn hàng</p>
                     </div>
                  </div>

                  {/* AI Sentiment analysis */}
                  <div className={cn("p-4 rounded-lg border", selectedTicket.sentiment === 'critical' ? 'bg-red-50 border-red-100' : 'bg-indigo-50 border-indigo-100')}>
                     <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2" style={{ color: selectedTicket.sentiment === 'critical' ? '#EF4444' : '#6366F1' }}>
                        <Sparkles className="w-3 h-3" /> Nhận định AI
                     </p>
                     <p className="text-sm font-medium text-slate-700">
                        {selectedTicket.sentiment === 'critical' ? 
                           "Khách hàng đang có thái độ rất bức xúc. Cần giải quyết và đền bù NGAY LẬP TỨC để tránh khủng hoảng truyền thông." : 
                           "Khách hàng đưa ra thắc mắc thông thường, giọng điệu trung tính. Có thể dùng template trả lời tự động."}
                     </p>
                  </div>

                  {/* Reply Action */}
                  <div className="space-y-3">
                     <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" /> Phản hồi khách hàng
                     </h3>
                     <textarea 
                        className="w-full h-32 border border-slate-200 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none bg-slate-50"
                        placeholder="Nhập nội dung phản hồi..."
                        value={draftedMessage}
                        onChange={(e) => setDraftedMessage(e.target.value)}
                     />
                     
                     <div className="flex gap-2">
                        <button 
                          onClick={handleSimulateAiReply}
                          disabled={aiDrafting}
                          className="flex-1 bg-indigo-100 text-indigo-700 px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-indigo-200 transition-all flex items-center justify-center gap-2"
                        >
                           {aiDrafting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                           Tự động soạn bằng AI
                        </button>
                        <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-all">
                           Gửi & Đóng Ticket
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
