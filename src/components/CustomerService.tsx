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
  Plus
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
  const [activeTab, setActiveTab] = useState<'tickets' | 'campaigns' | 'feedback' | 'chat' | 'calls'>('tickets');
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
          <h1 className="text-2xl font-semibold text-[#111827]">Chăm sóc Khách hàng (CSKH)</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý khiếu nại, phản hồi, và tự động hóa CSKH.</p>
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
        <div className="flex bg-slate-50 border-b border-slate-200 p-2 gap-2">
           <button 
             onClick={() => setActiveTab('tickets')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'tickets' ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <Ticket className="w-4 h-4" /> Quản lý Tickets
           </button>
           <button 
             onClick={() => setActiveTab('campaigns')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'campaigns' ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <Mail className="w-4 h-4" /> Chiến dịch Chăm sóc (Loyalty)
           </button>
           <button 
             onClick={() => setActiveTab('feedback')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'feedback' ? "bg-white text-purple-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <Star className="w-4 h-4" /> Phản hồi & Đánh giá
           </button>
           <button 
             onClick={() => setActiveTab('chat')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'chat' ? "bg-white text-blue-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <MessageSquare className="w-4 h-4" /> Chat Đa kênh (FB/Zalo)
           </button>
           <button 
             onClick={() => setActiveTab('calls')}
             className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all", activeTab === 'calls' ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-500 hover:bg-slate-100")}
           >
              <PhoneCall className="w-4 h-4" /> Tổng đài OmiCall
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
                  <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
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
                               "p-3 rounded-lg text-sm shadow-sm",
                               msg.senderId === 'ai' 
                                 ? "bg-white text-slate-700 border border-slate-200 rounded-bl-sm" 
                                 : "bg-blue-600 text-white rounded-br-sm"
                             )}>
                                {msg.text}
                             </div>
                             <div className="flex items-center gap-2 px-1">
                                <span className={cn("text-[9px]", msg.senderId === 'ai' ? "text-slate-400" : "text-blue-300")}>{msg.senderName} • {msg.timestamp}</span>
                                {msg.senderId === 'user' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                             </div>
                          </div>
                       </div>
                     ))}
                     {isAiProcessing && (
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center animate-pulse">
                            <Bot className="w-4 h-4" />
                         </div>
                         <div className="bg-white border border-[#F3F4F6] p-3 rounded-lg rounded-bl-sm shadow-sm flex items-center gap-2">
                            <span className="text-xs text-[#6B7280] font-bold">AI Assistant đang soạn câu trả lời</span>
                            <div className="flex gap-1">
                               <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                               <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                               <div className="w-1 h-1 bg-blue-600 rounded-full animate-bounce" />
                            </div>
                         </div>
                       </div>
                     )}
                  </div>

                  {/* Input Area */}
                  <div className="p-4 bg-white border-t border-[#F3F4F6]">
                     <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 border border-transparent hover:border-slate-200 transition-all">
                           <Plus className="w-5 h-5" />
                        </button>
                        <div className="flex-1 relative">
                           <input 
                             type="text" 
                             value={inputValue}
                             onChange={(e) => setInputValue(e.target.value)}
                             onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                             placeholder="Nhập tin nhắn..." 
                             className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                           />
                           <button className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:scale-110 transition-transform disabled:opacity-50 disabled:scale-100" onClick={handleSendMessage} disabled={isAiProcessing}>
                              <Send className="w-5 h-5" />
                           </button>
                        </div>
                        <button className="bg-slate-100 p-3 rounded-lg hover:bg-slate-200 transition-colors">
                           <Zap className="w-5 h-5 text-orange-500 fill-current" />
                        </button>
                     </div>
                     <div className="mt-2 text-center">
                        <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest">Powered by Gemini AI Engine</p>
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
                      <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest border-b border-[#F3F4F6] pb-2">Đơn hàng gần đây</h4>
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
                    
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-6 shadow-xl border border-slate-200 flex flex-col items-center">
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
                                <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right leading-relaxed">Thời gian</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                             {[
                               { time: '14:20 20/04/2026', duration: '02:45', status: 'missed', caller: '0901234567', type: 'inbound', name: 'Nguyễn Văn A' },
                               { time: '10:15 20/04/2026', duration: '08:12', status: 'completed', caller: '0987654321', type: 'outbound', name: 'Trần Thị B' },
                               { time: '09:05 19/04/2026', duration: '01:20', status: 'completed', caller: '0919876543', type: 'inbound', name: 'Le Van C' }
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
                                  <td className="px-6 py-4 text-right text-xs text-slate-500 font-medium">
                                     {log.time}
                                  </td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
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
