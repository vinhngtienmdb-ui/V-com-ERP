import { DraggableGrid } from './ui/DraggableGrid';
import { Modal } from './ui/Modal';
import { 
  BarChart, 
  Bar, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { LayoutGrid as LayoutGridIcon } from 'lucide-react';
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
import { 
  getZnsLogs, 
  getZnsTemplates, 
  getZnsConfig, 
  saveZnsConfig, 
  saveZnsTemplates, 
  sendZnsNotification, 
  clearZnsLogs 
} from '../services/znsService';

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
  const [activeTab, setActiveTab] = useState<any>('dashboard');
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [znsToast, setZnsToast] = useState<{ show: boolean, message: string, logContent: string } | null>(null);
  
  // Zalo ZNS state variables
  const [znsLogs, setZnsLogs] = useState<any[]>([]);
  const [znsTemplates, setZnsTemplates] = useState<any[]>([]);
  const [znsOaConnected, setZnsOaConnected] = useState<boolean>(true);
  
  const [testTemplateCode, setTestTemplateCode] = useState<string>('ZNS_ORDER_CONFIRMED');
  const [testCustomerName, setTestCustomerName] = useState<string>('Nguyễn Hữu Nghĩa');
  const [testPhone, setTestPhone] = useState<string>('0981234567');
  const [testVar1, setTestVar1] = useState<string>('ORD-2026');
  const [testVar2, setTestVar2] = useState<string>('1,850,000đ');

  const [logsSearchQuery, setLogsSearchQuery] = useState<string>('');

    // Close ticket detail modal on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTicket(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTicket]);

  useEffect(() => {
    setZnsLogs(getZnsLogs());
    setZnsTemplates(getZnsTemplates());
    setZnsOaConnected(getZnsConfig().isActive);

    const handleZnsLogAdded = (e: any) => {
      setZnsLogs(prev => [e.detail, ...prev]);
    };
    
    window.addEventListener('zns-log-added', handleZnsLogAdded);
    return () => {
      window.removeEventListener('zns-log-added', handleZnsLogAdded);
    };
  }, []);

  const handleToggleTemplate = (templateId: string) => {
    const updated = znsTemplates.map(t => t.id === templateId ? { ...t, isActive: !t.isActive } : t);
    setZnsTemplates(updated);
    saveZnsTemplates(updated);
  };

  const handleUpdateTemplateText = (templateId: string, newText: string) => {
    const updated = znsTemplates.map(t => t.id === templateId ? { ...t, contentTemplate: newText } : t);
    setZnsTemplates(updated);
    saveZnsTemplates(updated);
    setSuccessToast("Cập nhật mẫu tin ZNS thành công!");
  };

  const handleToggleZaloOA = () => {
    const newStatus = !znsOaConnected;
    setZnsOaConnected(newStatus);
    const config = getZnsConfig();
    config.isActive = newStatus;
    saveZnsConfig(config);
    setSuccessToast(newStatus ? "Đã bật kết nối Zalo OA & dịch vụ ZNS!" : "Đã tạm dừng kết nối Zalo OA.");
  };

  const handleSendTestZns = (e: React.FormEvent) => {
    e.preventDefault();
    if (!znsOaConnected) {
      alert("Zalo OA chưa kết nối! Vui lòng bật hoạt động để gửi.");
      return;
    }
    
    const activeTpl = znsTemplates.find(t => t.code === testTemplateCode);
    if (activeTpl && !activeTpl.isActive) {
      alert("Mẫu tin này đang bị tắt! Vui lòng kích hoạt mẫu tin.");
      return;
    }

    const vars: Record<string, string> = {
      'Tên_Khách_Hàng': testCustomerName,
      'Mã_Đơn_Hàng': testVar1,
      'Mã_Phiếu': testVar1,
      'Tổng_Tiền': testVar2,
      'Trạng_Thái': 'Đang vận chuyển',
      'Đơn_Vị_Vận_Chuyển': 'GHN Fast',
      'Mã_Vận_Đơn': 'GHN-VN-48201',
      'Tiêu_Đề': 'Yêu cầu thẩm định RMA',
      'Nội_Dung_Phản_Hồi': 'Phản hồi CSKH mẫu: Chúng tôi đã tiếp nhận ý kiến của khách hàng.'
    };

    const log = sendZnsNotification(testPhone, testTemplateCode, vars, {
      customerName: testCustomerName,
      ticketId: testTemplateCode.includes('TICKET') ? testVar1 : undefined,
      orderId: testTemplateCode.includes('ORDER') ? testVar1 : undefined
    });

    setZnsToast({
      show: true,
      message: `Đã gửi tin nhắn Zalo ZNS thành công tới SĐT ${testPhone}!`,
      logContent: log.content
    });
  };

  const handleCloseTicket = (ticket: any, replyText: string) => {
    // Update ticket in state
    setTickets(prev => prev.map(t => t.id === ticket.id ? { ...t, status: 'closed' } : t));
    
    const textOfReply = replyText.trim() || 'Chào anh/chị, yêu cầu hỗ trợ của anh/chị đã được giải quyết hoàn tất và bộ phận CSKH xin phép được đóng phiếu yêu cầu.';
    
    // Variables for ZNS replies
    const variables = {
      'Tên_Khách_Hàng': ticket.customerName,
      'Mã_Phiếu': ticket.id,
      'Tiêu_Đề': ticket.subject,
      'Nội_Dung_Phản_Hồi': textOfReply.length > 50 ? textOfReply.slice(0, 50) + '...' : textOfReply
    };
    
    // Send ZNS Notifications via service
    const log1 = sendZnsNotification('0912345678', 'ZNS_TICKET_REPLIED', variables, {
      ticketId: ticket.id,
      customerName: ticket.customerName
    });

    const closeVariables = {
      'Tên_Khách_Hàng': ticket.customerName,
      'Mã_Phiếu': ticket.id
    };
    sendZnsNotification('0912345678', 'ZNS_TICKET_CLOSED', closeVariables, {
      ticketId: ticket.id,
      customerName: ticket.customerName
    });

    setZnsToast({
      show: true,
      message: `Ticket ${ticket.id} đã đóng! Đã gửi thông báo ZNS tự động cho khách hàng ${ticket.customerName}.`,
      logContent: log1.content
    });

    setDraftedMessage('');
    setSelectedTicket(null);
  };

 // Real-time SLA & Distribution States
 const [dashboardChannel, setDashboardChannel] = useState<string>('all');
 const [dashboardPriority, setDashboardPriority] = useState<string>('all');
 const [liveTicketResolvedCount, setLiveTicketResolvedCount] = useState<number>(384);
 const [isSimulatingTicket, setIsSimulatingTicket] = useState<boolean>(false);
 const [successToast, setSuccessToast] = useState<string | null>(null);
 const [activeAlerts, setActiveAlerts] = useState<any[]>([
   { id: 'TKT-1042', customerName: 'Nguyễn Văn A', subject: 'Hàng nhận bị móp hộp', priority: 'high', channel: 'shopee', waitingTime: '24 phút', sentiment: 'critical' },
   { id: 'TKT-1039', customerName: 'Phạm D', subject: 'Cần đổi size áo', priority: 'medium', channel: 'facebook', waitingTime: '18 phút', sentiment: 'neutral' },
   { id: 'TKT-1041', customerName: 'Trần Thị B', subject: 'Hỏi về thời gian bảo hành', priority: 'medium', channel: 'zalo', waitingTime: '15 phút', sentiment: 'neutral' },
   { id: 'TKT-1040', customerName: 'Lê Văn C', subject: 'Lỗi thanh toán Momo', priority: 'high', channel: 'web', waitingTime: '32 phút', sentiment: 'negative' },
 ]);

 const simulateNewTicket = () => {
   setIsSimulatingTicket(true);
   setTimeout(() => {
     const customers = ['Đặng Văn Lâm', 'Nguyễn Thị Tuyết', 'Hồ Hoài Nam', 'Phạm Quỳnh Anh'];
     const issues = ['Hỏi về mã khuyến mãi giảm 20%', 'Sản phẩm giao bị thiếu quà tặng', 'Lỗi thanh toán ngân hàng báo thành công nhưng app báo chờ', 'Tư vấn đóng gói quà sinh nhật'];
     const channels = ['facebook', 'zalo', 'web', 'shopee'];
     const priorities = ['high', 'medium', 'low'];
     const sentiments = ['critical', 'neutral', 'negative'];

     const randomCustomer = customers[Math.floor(Math.random() * customers.length)];
     const randomIssue = issues[Math.floor(Math.random() * issues.length)];
     const randomChannel = channels[Math.floor(Math.random() * channels.length)];
     const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
     const randomSentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
     const id = 'TKT-' + (1043 + Math.floor(Math.random() * 100));

     const newAlert = {
       id,
       customerName: randomCustomer,
       subject: randomIssue,
       priority: randomPriority,
       channel: randomChannel,
       waitingTime: '1 phút',
       sentiment: randomSentiment,
       createdAt: 'Vừa xong',
       type: 'complaint'
     };

     setActiveAlerts(prev => [newAlert, ...prev]);
     setLiveTicketResolvedCount(prev => prev + 1);
     setSuccessToast(`Nhận thành công Ticket mới ${id} từ ${randomCustomer}!`);
     setIsSimulatingTicket(false);

     setTimeout(() => {
       setSuccessToast(null);
     }, 4000);
   }, 800);
 };

 const getSlaDistribution = () => {
   let modifier = 1.0;
   if (dashboardChannel === 'facebook') modifier *= 0.35;
   else if (dashboardChannel === 'zalo') modifier *= 0.28;
   else if (dashboardChannel === 'web') modifier *= 0.20;
   else if (dashboardChannel === 'shopee') modifier *= 0.17;

   if (dashboardPriority === 'high') modifier *= 0.30;
   else if (dashboardPriority === 'medium') modifier *= 0.45;
   else if (dashboardPriority === 'low') modifier *= 0.25;

   const ratioFast = dashboardPriority === 'high' ? 1.35 : dashboardPriority === 'low' ? 0.75 : 1.0;
   const ratioSlow = dashboardPriority === 'high' ? 0.45 : dashboardPriority === 'low' ? 1.45 : 1.0;

   return [
     { range: '< 5 phút', count: Math.round(184 * modifier * ratioFast), label: 'Xuất sắc', color: '#10B981', desc: 'Đạt SLA tối ưu' },
     { range: '5-15 phút', count: Math.round(112 * modifier * ratioFast), label: 'Đạt SLA', color: '#34D399', desc: 'Đạt SLA tiêu chuẩn' },
     { range: '15-30 phút', count: Math.round(54 * modifier), label: 'Cảnh báo', color: '#FBBF24', desc: 'Vượt SLA nhẹ' },
     { range: '30-60 phút', count: Math.round(24 * modifier * ratioSlow), label: 'Vi phạm', color: '#F97316', desc: 'Vi phạm SLA cấp 1' },
     { range: '1-2 giờ', count: Math.round(8 * modifier * ratioSlow), label: 'Nghiêm trọng', color: '#EF4444', desc: 'Vi phạm SLA cấp 2' },
     { range: '> 2 giờ', count: Math.round(2 * modifier * ratioSlow), label: 'Bỏ lỡ', color: '#B91C1C', desc: 'Bỏ qua ticket' },
   ].map(item => ({
     ...item,
     count: Math.max(0, item.count)
   }));
 };

 const dashboardData = getSlaDistribution();

 const CustomTooltip = ({ active, payload }: any) => {
   if (active && payload && payload.length) {
     const data = payload[0].payload;
     return (
       <div className="bg-slate-900 text-white p-3 rounded-lg border border-slate-700 shadow-xl text-left text-xs space-y-1">
         <p className="font-extrabold text-[#F59E0B]">{data.range}</p>
         <p className="font-semibold text-slate-100">Vé đã xử lý: <strong className="text-[#FAF9F5] text-sm">{data.count}</strong></p>
         <p className="text-slate-300">Đánh giá: <span className="font-bold uppercase tracking-wider" style={{ color: data.color }}>{data.label}</span></p>
         <p className="text-slate-400 text-[10px] italic">{data.desc}</p>
       </div>
     );
   }
   return null;
 };

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
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 {/* Header */}
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-3">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Chăm sóc Khách hàng</h1>
 <div className="flex bg-slate-100/80 p-1 rounded-lg border border-slate-300 shadow-inner">
 <button 
 onClick={() => setRoleScope('platform')}
 className={cn("px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all", roleScope === 'platform' ? "bg-white text-primary-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 <Building2 className="w-3.5 h-3.5" /> Quản trị Sàn
 </button>
 <button 
 onClick={() => setRoleScope('seller')}
 className={cn("px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-1.5 transition-all", roleScope === 'seller' ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
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
 <button onClick={() => setActiveTab('dashboard')} className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <BarChart2 className="w-4 h-4 text-emerald-600" />
 Báo cáo SLA
 </button>
 <button className="bg-primary-600 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Ticket className="w-4 h-4" />
 Tạo Ticket mới
 </button>
 </div>
 </div>

 {/* Overview Cards */}
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 opacity-50 transition-transform " />
 <div className="flex justify-between items-start relative z-10 mb-2">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiếp nhận mới (Mở)</p>
 <AlertCircle className="w-4 h-4 text-red-500" />
 </div>
 <p className="text-3xl font-bold text-slate-900 relative z-10">24</p>
 <div className="mt-2 text-[10px] text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg w-fit">Cần xử lý gấp: 5</div>
 </div>
 
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-slate-100 rounded-bl-full -z-0 opacity-50 transition-transform " />
 <div className="flex justify-between items-start relative z-10 mb-2">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Thời gian P/hồi TB (SLA)</p>
 <Clock className="w-4 h-4 text-orange-600" />
 </div>
 <p className="text-3xl font-bold text-slate-900 relative z-10">14 <span className="text-sm font-medium text-slate-600">phút</span></p>
 <div className="flex justify-between items-center mt-2 group/btn">
					<div className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Nhanh hơn 5p so với tuần trước</div>
					<button onClick={(e) => { e.stopPropagation(); setActiveTab('dashboard'); }} className="text-[10px] text-primary-600 font-extrabold hover:underline flex items-center gap-0.5 transition-all">Biểu đồ &rarr;</button>
				</div>
 </div>

 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50 transition-transform " />
 <div className="flex justify-between items-start relative z-10 mb-2">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đánh giá chung (CSAT)</p>
 <Star className="w-4 h-4 text-yellow-500" />
 </div>
 <p className="text-3xl font-bold text-slate-900 relative z-10">4.8<span className="text-xl text-slate-500">/5</span></p>
 <div className="mt-2 text-[10px] text-emerald-500 font-medium">Rất xuất sắc</div>
 </div>

 <div className="bg-white p-5 rounded-lg border border-slate-800 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-bl-full -z-0 transition-transform " />
 <div className="flex justify-between items-start relative z-10 mb-2">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AI Autofill / Auto-reply</p>
 <Sparkles className="w-4 h-4 text-primary-400" />
 </div>
 <p className="text-3xl font-bold text-[#FAF9F5] relative z-10">68%</p>
 <div className="mt-2 text-[10px] text-primary-200 font-medium tracking-wide">Tỷ lệ tự động hóa tin nhắn</div>
 </div>
 </DraggableGrid>

 {/* Main Content Area */}
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
 {/* Navigation Tabs */}
 <div className="flex bg-slate-50 border-b border-slate-300 p-2 gap-2 overflow-x-auto hidden-scrollbar min-w-0">
  <button 
    onClick={() => setActiveTab('dashboard')}
    className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'dashboard' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
  >
    <LayoutGridIcon className="w-4 h-4" /> Tổng quan Dashboard
  </button>
 <button 
 onClick={() => setActiveTab('tickets')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'tickets' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <Ticket className="w-4 h-4" /> Quản lý Tickets
 </button>
 <button 
 onClick={() => setActiveTab('campaigns')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'campaigns' ? "bg-white text-emerald-600 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <Mail className="w-4 h-4" /> Chiến dịch Chăm sóc (Loyalty)
 </button>
 <button 
 onClick={() => setActiveTab('feedback')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'feedback' ? "bg-white text-purple-600 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <Star className="w-4 h-4" /> Phản hồi & Đánh giá
 </button>
 <button 
 onClick={() => setActiveTab('chat')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'chat' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <MessageSquare className="w-4 h-4" /> Chat Đa kênh (FB/Zalo)
 </button>
 <button 
 onClick={() => setActiveTab('calls')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'calls' ? "bg-white text-emerald-600 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <PhoneCall className="w-4 h-4" /> Tổng đài OmiCall
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
 <Users className="w-4 h-4" /> Đội ngũ & Extension
 </button>
 <button 
 onClick={() => setActiveTab('config')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'config' ? "bg-white text-slate-900 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
 >
 <Settings className="w-4 h-4" /> Cấu hình Kênh
 </button>
 <button 
 onClick={() => setActiveTab('zalo_zns')}
 className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0", activeTab === 'zalo_zns' ? "bg-white text-blue-700 shadow-sm border border-blue-200" : "text-slate-600 hover:bg-slate-100")}
 >
 <MessageSquare className="w-4 h-4 text-primary-600" /> Bản tin Zalo ZNS
 </button>
 </div>

 {/* Filters */}
 <div className="p-4 border-b border-stone-50 flex flex-wrap gap-4 items-center justify-between">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input 
 type="text" 
 placeholder={activeTab === 'tickets' ? "Tìm mã ticket, tên khách hàng..." : "Tìm kiếm..."} 
 className="bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72 focus:bg-white focus:ring-4 focus:ring-primary-500/10 transition-all font-medium"
 />
 </div>
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm text-slate-700 flex items-center gap-2 font-bold hover:bg-slate-50">
 <Filter className="w-4 h-4" /> Bộ lọc
 </button>
 </div>
 </div>

 {/* Content by Tab */}
 <div className="flex-1 overflow-x-auto min-w-0">
 {activeTab === 'dashboard' && (
		<div className="p-6 space-y-6 bg-[#FAF9F5] min-h-[600px] overflow-y-auto">
			{/* Dashboard Top Alerts */}
			{successToast && (
				<div className="bg-emerald-600 text-white p-3 rounded-lg shadow-lg flex items-center justify-between text-sm animate-bounce font-bold tracking-tight">
					<span>✓ {successToast}</span>
					<button onClick={() => setSuccessToast(null)} className="text-white hover:text-emerald-100 text-xs uppercase font-bold ml-4">Đóng</button>
				</div>
			)}

			<div className="flex flex-col lg:flex-row gap-6 items-start">
				{/* Left: Distribution Bar Chart Component */}
				<div className="w-full lg:w-2/3 bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-200">
						<div>
							<h3 className="text-base font-bold text-slate-900 flex items-center gap-2 font-sans">
								<Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
								Phân phối Thời gian Phản hồi (Response Time Distribution)
							</h3>
							<p className="text-xs text-slate-500 mt-1 font-medium font-sans">Theo dõi thời gian khách chờ nhận phản hồi đầu tiên (FCR/FRT) thời gian thực.</p>
						</div>

						{/* Real-time Indicator Badge */}
						<div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-50 border border-red-100 text-[10px] font-extrabold text-red-600 animate-pulse shrink-0 font-sans">
							<span className="w-2 h-2 rounded-full bg-red-500" />
							REAL-TIME MONITORING
						</div>
					</div>

					{/* Filters Row Inside Chart */}
					<div className="flex flex-wrap items-center gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs font-sans">
						<div className="flex items-center gap-2">
							<span className="font-bold text-slate-600">Kênh Tiếp Nhận:</span>
							<select 
								value={dashboardChannel} 
								onChange={(e) => setDashboardChannel(e.target.value)}
								className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
							>
								<option value="all">Tất cả Kênh ({liveTicketResolvedCount - 300}+ vé)</option>
								<option value="facebook">Facebook Messenger</option>
								<option value="zalo">Zalo OA</option>
								<option value="web">Website Chat widget</option>
								<option value="shopee">Shopee Chat</option>
							</select>
						</div>

						<div className="flex items-center gap-2">
							<span className="font-bold text-slate-600">Mức Độ Ưu Tiên:</span>
							<select 
								value={dashboardPriority} 
								onChange={(e) => setDashboardPriority(e.target.value)}
								className="bg-white border border-slate-300 rounded-md px-2.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
							>
								<option value="all">Tất cả Độ Ưu Tiên</option>
								<option value="high">Cao (Gấp)</option>
								<option value="medium">Trung bình</option>
								<option value="low">Thấp</option>
							</select>
						</div>

						<div className="ml-auto flex items-center gap-2 max-sm:w-full max-sm:justify-between">
							<span className="text-[11px] font-mono font-bold text-slate-500">Đăng ký tự động:</span>
							<button 
								onClick={() => simulateNewTicket()}
								disabled={isSimulatingTicket}
								className={cn(
									"px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer",
									isSimulatingTicket ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-orange-600 text-white hover:bg-orange-700"
								)}
							>
								{isSimulatingTicket ? (
									<>
										<Loader2 className="w-3 h-3 animate-spin" />
										Đang tạo...
									</>
								) : (
									<>
										<Plus className="w-3 h-3" />
										Giả lập Ticket Mới (+1)
									</>
								)}
							</button>
						</div>
					</div>

					{/* Recharts Bar Chart Container */}
					<div className="h-[280px] w-full bg-white relative">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={dashboardData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
								<defs>
									<linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
										<stop offset="0%" stopColor="#4F46E5" stopOpacity={0.85}/>
										<stop offset="100%" stopColor="#4F46E5" stopOpacity={0.4}/>
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
								<XAxis 
									dataKey="range" 
									stroke="#64748B" 
									fontSize={11} 
									fontWeight="bold" 
									tickLine={false} 
									axisLine={false} 
								/>
								<YAxis 
									stroke="#64748B" 
									fontSize={11} 
									fontWeight="bold" 
									tickLine={false} 
									axisLine={false} 
									allowDecimals={false}
								/>
								<Tooltip content={<CustomTooltip />} cursor={{ fill: '#F8FAFC', opacity: 0.6 }} />
								<Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={44}>
									{dashboardData.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					</div>

					{/* Custom Legend / Guide */}
					<div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-4 border-t border-slate-100 text-center text-[10px] font-bold text-slate-600 uppercase tracking-wider font-sans">
						{dashboardData.map((item, idx) => (
							<div key={idx} className="p-2 rounded bg-slate-50 border border-slate-200/60 flex flex-col items-center justify-center gap-1">
								<span className="w-3 h-1.5 rounded" style={{ backgroundColor: item.color }} />
								<span>{item.range}</span>
								<span className="text-slate-900 text-xs font-black">{item.count} vé</span>
							</div>
						))}
					</div>
				</div>

				{/* Right: Operational Statistics & Live Actions */}
				<div className="w-full lg:w-1/3 space-y-6 font-sans">
					{/* Status Stats Summary */}
					<div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm space-y-4">
						<h4 className="text-sm font-bold text-slate-800 uppercase tracking-widest pb-2 border-b border-slate-150 flex items-center gap-2">
							<Sparkles className="w-4 h-4 text-primary-500" />
							Chỉ Số SLA Chốt Hôm Nay
						</h4>
						<div className="space-y-3.5">
							<div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">Tỷ Lệ Đạt SLA</p>
									<p className="text-2xl font-black text-emerald-600 font-sans">92.5%</p>
								</div>
								<div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-extrabold font-mono border border-emerald-100">
									Mục tiêu: 90%
								</div>
							</div>

							<div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">Xử Lý Trung Bình (ART)</p>
									<p className="text-2xl font-black text-indigo-700 font-sans">11.8 phút</p>
								</div>
								<div className="p-2 bg-indigo-50 text-indigo-100 rounded-lg text-xs font-extrabold font-mono border border-indigo-100">
									Hạn định: 15p
								</div>
							</div>

							<div className="flex justify-between items-center bg-slate-50/50 p-2.5 rounded-lg border border-slate-200">
								<div>
									<p className="text-[10px] font-bold text-slate-500 uppercase">Tổng Vé Đã Đóng</p>
									<p className="text-2xl font-black text-slate-800 font-sans">{liveTicketResolvedCount}</p>
								</div>
								<div className="p-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-extrabold font-mono font-sans">
									Hôm nay
								</div>
							</div>
						</div>
					</div>

					{/* Routing and Live Support Tip */}
					<div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-5 rounded-lg text-[#FAF9F5] shadow-lg relative overflow-hidden border border-slate-700">
						<div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
						<div className="relative z-15">
							<div className="flex items-center gap-1.5 text-xs font-bold text-[#E2E8F0] uppercase tracking-widest mb-2 font-sans">
								<Zap className="w-3.5 h-3.5 text-amber-400" />
								Tip Tự động hóa CSKH
							</div>
							<h5 className="text-sm font-bold leading-snug mb-1 font-sans">Thiết lập quy tắc định tuyến tự động!</h5>
							<p className="text-xs text-[#94A3B8] leading-relaxed font-medium font-sans">Bố trí chia đều các Ticket có dải phản hồi chạm mức vi phạm SLA để đảm bảo trải nghiệm người dùng khẩn trương.</p>
						</div>
					</div>
				</div>
			</div>

			{/* SLA Violations warnings table (Actionable Warnings) */}
			<div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden font-sans">
				<div className="p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-4 bg-slate-50/70">
					<div>
						<h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
							<AlertCircle className="w-5 h-5 text-red-600 animate-pulse" />
							Danh sách Vé Chờ Quá Hạn Phản Hồi SLA (Cần xử lý khẩn cấp)
						</h4>
						<p className="text-xs text-slate-500 mt-1 font-medium text-slate-600">Chi tiết các Ticket có thời gian phản hồi đang chạm dải cảnh báo. Nhấp "Xử lý khẩn" để viết mẫu trả lời AI và hoàn tất gửi ngay.</p>
					</div>

					<div className="px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-100 font-bold text-xs text-orange-700 font-mono">
						Đang vi phạm: {activeAlerts.length} ticket(s)
					</div>
				</div>

				<div className="overflow-x-auto min-w-0">
					<table className="w-full text-left border-collapse whitespace-nowrap">
						<thead>
							<tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
								<th className="px-6 py-4">Mã Vé</th>
								<th className="px-6 py-4">Khách Hàng</th>
								<th className="px-6 py-4">Chủ Đề Yêu Cầu</th>
								<th className="px-6 py-4 text-center">Độ Ưu Tiên</th>
								<th className="px-6 py-4 text-center">Thực Tế Đã Đợi</th>
								<th className="px-6 py-4 text-center">Cực Đoán</th>
								<th className="px-6 py-4 text-right">Thao Tác</th>
							</tr>
						</thead>
						<tbody className="divide-y divide-slate-100 divide-dotted text-sm">
							{activeAlerts.map(alert => (
								<tr key={alert.id} className="hover:bg-slate-50/70 transition-colors">
									<td className="px-6 py-4 font-mono font-bold text-slate-700 text-xs">{alert.id}</td>
									<td className="px-6 py-4">
										<div className="font-bold text-slate-900">{alert.customerName}</div>
										<div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
											{alert.channel === 'facebook' ? <span className="text-primary-600 font-bold">Facebook</span> : 
											 alert.channel === 'zalo' ? <span className="text-sky-600 font-bold">Zalo</span> : 
											 alert.channel === 'shopee' ? <span className="text-orange-600 font-bold">Shopee</span> : 
											 <span className="text-emerald-600 font-bold font-sans">Web Engine</span>}
										</div>
									</td>
									<td className="px-6 py-4">
										<div className="font-bold text-slate-800 truncate max-w-sm">{alert.subject}</div>
									</td>
									<td className="px-6 py-4 text-center">
										<span className={cn(
											"px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest border",
											alert.priority === 'high' ? "border-red-200 text-red-700 bg-red-50" : "border-slate-300 text-slate-600"
										)}>
											{alert.priority === 'high' ? 'Khẩn cấp' : 'Bình thường'}
										</span>
									</td>
									<td className="px-6 py-4 text-center">
										<span className="font-bold text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-md text-xs font-mono select-none animate-pulse">
											{alert.waitingTime} ⏳
										</span>
									</td>
									<td className="px-6 py-4 text-center">
										<span className={cn(
											"inline-flex w-2.5 h-2.5 rounded-full",
											alert.sentiment === 'critical' ? 'bg-red-500 animate-ping' : 'bg-slate-400'
										)} title={alert.sentiment} />
									</td>
									<td className="px-6 py-4 text-right">
										<button 
											onClick={() => {
												setSelectedTicket({
													id: alert.id,
													customerName: alert.customerName,
													subject: alert.subject,
													status: 'open',
													priority: alert.priority,
													type: alert.type || 'complaint',
													createdAt: alert.createdAt,
													sentiment: alert.sentiment
												});
											}}
											className="px-3.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-extrabold hover:bg-slate-900 shadow-sm transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
										>
											<Zap className="w-3 h-3" />
											Xử lý khẩn
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	)}

{activeTab === 'tickets' && (
 <table className="w-full text-left border-collapse whitespace-nowrap">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-200">
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Ticket ID & KH</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Vấn đề / Tiêu đề</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Trạng thái</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Mức độ ưu tiên</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right leading-relaxed">Thời gian</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {tickets.map(ticket => (
 <tr 
 key={ticket.id} 
 onClick={() => setSelectedTicket(ticket)}
 className={cn("hover:bg-slate-100/50 cursor-pointer transition-colors group", ticket.status === 'open' ? 'bg-white' : 'bg-slate-50/30')}
 >
 <td className="px-6 py-4">
 <p className="text-xs font-mono font-bold text-slate-700 mb-0.5">{ticket.id}</p>
 <p className="text-sm font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{ticket.customerName}</p>
 </td>
 <td className="px-6 py-4">
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
 {ticket.status === 'open' ? 'MỚI' : ticket.status === 'in_progress' ? 'ĐANG XỬ LÝ' : 'ĐÃ ĐÓNG'}
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
 <table className="w-full text-left border-collapse whitespace-nowrap">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-200">
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Tên Chiến dịch</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Kênh / Đối tượng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Đã gửi</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Tỷ lệ Mở (Open Rate)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right leading-relaxed">Trạng thái</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {MOCK_CAMPAIGNS.map(camp => (
 <tr key={camp.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-slate-900">{camp.name}</p>
 <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">{camp.id}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-xs font-bold uppercase tracking-widest text-orange-700 mb-0.5">{camp.type}</p>
 <p className="text-xs text-slate-600">{camp.target}</p>
 </td>
 <td className="px-6 py-4 text-center font-mono font-bold text-slate-800">
 {camp.sent.toLocaleString()}
 </td>
 <td className="px-6 py-4">
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
 {camp.status === 'active' ? 'ĐANG CHẠY' : 'HOÀN THÀNH'}
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
 Kênh tương tác (API)
 </h2>
 <div className="flex gap-2">
 <button className="flex-1 bg-slate-900 text-[#FAF9F5] text-[10px] font-bold py-1.5 rounded-lg flex justify-center items-center gap-1 shadow-sm"><span className="w-3 h-3 flex items-center justify-center rounded-full bg-slate-900 text-orange-700">f</span> Fanpage</button>
 <button className="flex-1 bg-slate-800 text-[#FAF9F5] text-[10px] font-bold py-1.5 rounded-lg flex justify-center items-center gap-1 shadow-sm"><MessageSquare className="w-3 h-3" /> Zalo OA</button>
 </div>
 <div className="relative mt-4">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Tìm khách hàng..." 
 className="w-full bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all shadow-sm"
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
 msg.senderId === 'ai' ? "bg-slate-900 text-[#FAF9F5]" : "bg-white border border-slate-300 text-slate-800"
 )}>
 {msg.senderId === 'ai' ? <Bot className="w-4 h-4" /> : 'CS'}
 </div>
 <div className={cn(
 "max-w-[70%] space-y-1",
 msg.senderId === 'ai' ? "items-start" : "items-end flex flex-col"
 )}>
 <div className={cn(
 "p-3 rounded-lg text-sm shadow-sm leading-relaxed",
 msg.senderId === 'ai' 
 ? "bg-white text-slate-900 border border-slate-300 rounded-bl-sm" 
 : "bg-slate-900 text-[#FAF9F5] rounded-br-sm"
 )}>
 {msg.text}
 </div>
 <div className="flex items-center gap-2 px-1">
 <span className={cn("text-[9px] font-medium tracking-wide", msg.senderId === 'ai' ? "text-slate-500" : "text-blue-300")}>{msg.senderName} • {msg.timestamp}</span>
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
 <span className="text-xs text-slate-700 font-bold tracking-wide">AI Assistant đang soạn câu trả lời</span>
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
 <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full whitespace-nowrap transition-colors">Xin chào</button>
 <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full whitespace-nowrap transition-colors">Xin thông tin nhận hàng</button>
 <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full whitespace-nowrap transition-colors">Gửi mã freeship</button>
 <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full whitespace-nowrap transition-colors">Thông báo chậm hàng</button>
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
 placeholder="Nhập tin nhắn..." 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-slate-900 focus:bg-white transition-all font-medium"
 />
 <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 hover:bg-slate-800 text-[#FAF9F5] rounded-lg transition-all disabled:opacity-50 flex items-center justify-center shadow-sm shadow-slate-900/5" onClick={handleSendMessage} disabled={isAiProcessing || !inputValue.trim()}>
 <Send className="w-4 h-4 ml-0.5" />
 </button>
 </div>
 <button className="bg-amber-100 hover:bg-amber-200 p-3 rounded-lg transition-colors flex-shrink-0 relative group">
 <Zap className="w-5 h-5 text-amber-600 fill-current" />
 <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap px-3 py-2 bg-slate-800 text-[#FAF9F5] text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
 Dùng AI trả lời
 </div>
 </button>
 </div>
 <div className="text-center mt-1">
 <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em]">Được hỗ trợ bởi Gemini AI Engine</p>
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
 <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold">VIP Vàng</span>
 </div>
 </div>

 <div className="space-y-4">
 <div className="flex justify-between items-center border-b border-[#F3F4F6] pb-2">
 <h4 className="text-xs font-bold text-[#111827] uppercase tracking-widest">Đơn hàng gần đây</h4>
 <button className="text-[10px] font-bold text-orange-700 hover:text-blue-800 uppercase tracking-widest flex items-center gap-1">
 <Plus className="w-3 h-3" /> Tạo đơn
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
 <p className="text-sm font-bold text-primary-600">{formatCurrency(order.amount)}</p>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-primary-50 p-4 rounded-lg space-y-2 border border-primary-100 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-16 h-16 bg-white/40 rounded-bl-full -z-0 transition-transform " />
 <h4 className="text-[10px] font-bold text-primary-700 uppercase tracking-widest flex items-center gap-2 relative z-10">
 <Sparkles className="w-3 h-3 text-primary-500" /> Nhận định AI
 </h4>
 <p className="text-[11px] text-primary-900 leading-relaxed font-medium relative z-10">Khách hàng hỏi về lịch giao đơn ORD-9921. Đây là khách hàng VIP, có thể chủ động đề nghị freeship đơn sau.</p>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'calls' && (
 <div className="flex h-[600px]">
 {/* OmiCall Dialer */}
 <div className="w-1/3 border-r border-slate-300 bg-slate-50/50 p-6 flex flex-col items-center">
 <h3 className="font-bold text-slate-900 text-lg mb-2 text-center w-full">Tổng đài OmiCall (VoIP)</h3>
 <div className="flex items-center gap-2 mb-8 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> SIP Registered • Ext: 101
 </div>
 
 <div className="bg-white w-full max-w-sm rounded-lg p-6 shadow-sm border border-slate-300 flex flex-col items-center">
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
 <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2"><History className="w-5 h-5 text-orange-700" /> Lịch sử cuộc gọi (Call Logs)</h3>
 <button className="text-xs bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-200 transition-all">Đồng bộ OmiCall API</button>
 </div>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse whitespace-nowrap">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-200">
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Khách hàng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Loại Hướng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Trạng thái</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Thời lượng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">File Ghi âm</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right leading-relaxed">Thời gian / Ghi chú</th>
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
 <p className="text-sm font-bold text-slate-900">{log.name}</p>
 <p className="text-[10px] text-slate-600 font-mono mt-0.5">{log.caller}</p>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border", log.type === 'inbound' ? "border-orange-200 text-orange-700 bg-slate-100" : "border-purple-200 text-purple-600 bg-purple-50")}>
 {log.type === 'inbound' ? 'GỌI VÀO' : 'GỌI RA'}
 </span>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest", log.status === 'completed' ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50")}>
 {log.status === 'completed' ? 'THÀNH CÔNG' : 'GỌI NHỠ'}
 </span>
 </td>
 <td className="px-6 py-4 text-center text-sm font-mono text-slate-700 font-bold">
 {log.duration}
 </td>
 <td className="px-6 py-4 text-center">
 {log.hasAudio ? (
 <button className="inline-flex p-1.5 bg-slate-100 text-orange-700 rounded-lg items-center justify-center hover:bg-[#EAE7DF] transition-colors tooltip" title="Nghe lại">
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
 <button className="text-[10px] font-bold text-orange-700 hover:text-blue-800 uppercase tracking-widest mt-0.5">Thêm ghi chú</button>
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
 <button className="flex-1 bg-white shadow-sm text-xs font-bold py-1.5 rounded-md text-slate-800 transition-all text-center">Đang chờ (12)</button>
 <button className="flex-1 text-xs font-bold py-1.5 rounded-md text-slate-600 hover:text-slate-800 transition-all text-center">Đang xử lý (5)</button>
 </div>
 </div>
 <div className="flex-1 overflow-y-auto p-3 space-y-2">
 <div className="bg-white p-3 rounded-lg border border-primary-200 shadow-sm relative overflow-hidden cursor-pointer">
 <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
 <div className="flex justify-between items-start mb-1">
 <p className="text-sm font-bold text-slate-900">Khách vãng lai #889</p>
 <span className="text-[10px] text-slate-500">Vừa xong</span>
 </div>
 <p className="text-xs text-slate-700 truncate">Sản phẩm này có size XL không shop?</p>
 <div className="mt-2 flex items-center gap-2">
 <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-[9px] font-bold uppercase tracking-wider border border-primary-100">Đang hoạt động trên web</span>
 </div>
 </div>
 
 <div className="bg-white p-3 rounded-lg border border-slate-300 hover:border-slate-400 cursor-pointer transition-all opacity-70">
 <div className="flex justify-between items-start mb-1">
 <p className="text-sm font-bold text-slate-900">Khách vãng lai #885</p>
 <span className="text-[10px] text-slate-500">5p trước</span>
 </div>
 <p className="text-xs text-slate-700 truncate">Mình muốn đổi hàng thì làm sao?</p>
 <div className="mt-2 flex items-center gap-2">
 <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider">Đã rời web</span>
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
 <h3 className="font-bold text-slate-900 text-sm">Khách vãng lai #889</h3>
 <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Đang xem: Giày thể thao nam siêu nhẹ</p>
 </div>
 </div>
 <div className="flex gap-2">
 <button className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-all">Lịch sử Duyệt web</button>

 {roleScope === 'platform' ? (
 <button className="px-3 py-1.5 text-xs font-bold text-[#FAF9F5] bg-rose-600 hover:bg-rose-700 rounded-lg transition-all shadow-sm flex items-center gap-1.5">
 <Shield className="w-3.5 h-3.5" /> Can thiệp Tranh chấp
 </button>
 ) : (
 <>
 <button className="px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-all flex items-center gap-1.5">
 <Building2 className="w-3.5 h-3.5" /> Gọi CSKH Sàn
 </button>
 <button className="px-3 py-1.5 text-xs font-bold text-[#FAF9F5] bg-primary-600 hover:bg-primary-700 rounded-lg transition-all shadow-sm">Tạo Đơn Hàng</button>
 </>
 )}
 </div>
 </div>
 
 <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
 <div className="text-center text-xs text-slate-500 font-medium my-4">— Cuộc trò chuyện bắt đầu lúc 10:24 —</div>
 <div className="flex flex-col gap-1 items-start">
 <div className="px-4 py-2 bg-white border border-slate-300 rounded-lg rounded-tl-sm text-sm text-slate-800 max-w-[70%] shadow-sm">
 Sản phẩm này có size XL không shop?
 </div>
 <span className="text-[10px] text-slate-500">10:24</span>
 </div>
 
 <div className="flex flex-col gap-1 items-end">
 <div className="px-4 py-2 bg-primary-600 text-[#FAF9F5] rounded-lg rounded-tr-sm text-sm max-w-[70%] shadow-sm">
 Chào bạn, sản phẩm hiện tại vẫn còn size XL nha bạn ơi. Mình mua hôm nay đang có mã giảm giá 10% đấy ạ.
 </div>
 <span className="text-[10px] text-slate-500">10:25 ✓</span>
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
 <div className="px-4 py-2 bg-rose-600 text-[#FAF9F5] rounded-lg rounded-tr-sm text-sm max-w-[70%] shadow-sm">
 Chào bạn, mình là Admin từ hệ thống. Bạn đang gặp vấn đề gì với cửa hàng này ạ?
 </div>
 <span className="text-[10px] text-slate-500">10:28 ✓</span>
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
 Khách hàng đang nhập...
 </div>
 </div>
 </div>
 
 <div className="p-4 bg-white border-t border-slate-300">
 <div className="relative">
 <input 
 type="text" 
 placeholder="Nhập tin nhắn (Nhấn Enter để gửi)..." 
 className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all font-medium"
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
 <Users className="w-6 h-6 text-rose-600" /> Quản lý Đội ngũ CSKH & Extensions
 </h3>
 <p className="text-sm text-slate-600 mt-1">Phân công ca trực, thiết lập tổng đài viên và định tuyến ticket/cuộc gọi.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all flex items-center gap-2">
 <Filter className="w-4 h-4" /> Lọc nhân viên
 </button>
 <button className="bg-rose-600 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold hover:bg-rose-700 transition-all shadow-sm shadow-rose-500/30 flex items-center gap-2">
 <UserPlus className="w-4 h-4" /> Thêm thành viên
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
 <div className="xl:col-span-2 space-y-6">
 {/* Team Stats */}
 <DraggableGrid className="grid grid-cols-3 gap-4" columns={3} gap={16}>
 <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex items-center gap-4">
 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
 <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
 </div>
 <div>
 <p className="text-2xl font-black text-slate-900">12</p>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đang Online</p>
 </div>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex items-center gap-4">
 <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
 <PhoneCall className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-black text-slate-900">4</p>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đang nghe máy</p>
 </div>
 </div>
 <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex items-center gap-4">
 <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
 <Ticket className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-black text-slate-900">45</p>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ticket đang chờ xử lý</p>
 </div>
 </div>
 </DraggableGrid>

 {/* Staff List */}
 <div className="bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden overflow-x-auto min-w-0">
 <table className="w-full text-left whitespace-nowrap">
 <thead className="bg-slate-50 border-b border-slate-200">
 <tr>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">Nhân viên</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center">Trạng thái</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">SLA / Đánh giá</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center">EXT (Tổng đài)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Thao tác</th>
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
 <p className="font-bold text-slate-900 text-sm">Nguyễn Ngọc Trinh</p>
 <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">{roleScope === 'platform' ? 'Hỗ trợ Cửa Hàng (Platform)' : 'CSKH (Seller)'}</p>
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
 <button className="p-2 text-slate-500 hover:text-primary-600 transition-colors">
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
 <p className="font-bold text-slate-900 text-sm">Trần Minh Tuấn</p>
 <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">{roleScope === 'platform' ? 'Xử lý Khiếu Nại (Platform)' : 'CSKH (Seller)'}</p>
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
 <button className="p-2 text-slate-500 hover:text-primary-600 transition-colors">
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
 <p className="font-bold text-slate-900 text-sm">Lê Văn A</p>
 <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">{roleScope === 'platform' ? 'Hỗ trợ Cửa Hàng (Platform)' : 'CSKH (Seller)'}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-4 text-center">
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
 <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" /> Tạm nghỉ
 </span>
 </td>
 <td className="px-6 py-4">
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
 <button className="p-2 text-slate-500 hover:text-primary-600 transition-colors">
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
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
 <Shield className="w-4 h-4 text-primary-600" /> Định tuyến thông minh (Smart Routing)
 </h4>
 <div className="space-y-4">
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
 <div className="flex justify-between items-center mb-2">
 <span className="text-xs font-bold text-slate-800">Quy tắc chia Ticket</span>
 <ToggleRight className="w-6 h-6 text-primary-600" />
 </div>
 <select className="w-full bg-white border border-slate-300 rounded text-xs p-1.5 font-medium focus:ring-2 focus:ring-primary-500/20">
 <option>Xoay vòng (Round Robin)</option>
 <option>Chia theo Khối lượng (Load Balance)</option>
 <option>Kỹ năng (Skill-based)</option>
 </select>
 </div>
 
 <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
 <div className="flex justify-between items-center mb-2">
 <span className="text-xs font-bold text-slate-800">Định tuyến Cuộc gọi OmiCall</span>
 <ToggleRight className="w-6 h-6 text-primary-600" />
 </div>
 <select className="w-full bg-white border border-slate-300 rounded text-xs p-1.5 font-medium focus:ring-2 focus:ring-primary-500/20">
 <option>Rung tất cả máy (Ring All)</option>
 <option>Theo thứ tự (Linear)</option>
 <option>Thời gian rảnh lâu nhất</option>
 </select>
 </div>
 </div>
 </div>
 
 <div className="bg-primary-600 p-5 rounded-lg text-[#FAF9F5] shadow-sm shadow-indigo-600/20 relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10" />
 <h4 className="font-bold mb-2 flex items-center gap-2">
 <PhoneCall className="w-4 h-4" /> Đồng bộ PBX (OmiCall)
 </h4>
 <p className="text-xs text-primary-100 font-medium leading-relaxed mb-4">
 Hệ thống đã kết nối OmiCall. Bạn có thể gán Extension (Ext) cho từng nhân viên để nhận popup cuộc gọi ngay trên trình duyệt.
 </p>
 <button className="w-full py-2 bg-white text-primary-600 font-bold text-sm rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
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
 <h3 className="font-bold text-slate-900 text-xl flex items-center gap-2">
 <Settings className="w-6 h-6 text-slate-700" /> Cấu hình Kênh & Tích hợp (Omni-channel)
 </h3>
 <p className="text-sm text-slate-600 mt-1">Kết nối và quản lý các kênh giao tiếp với khách hàng tại một nơi.</p>
 </div>
 </div>
 
 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-2 gap-6" columns={2} gap={24}>
 {/* Fanpage Config */}
 <div className="bg-white rounded-lg p-6 border border-slate-300 shadow-sm flex flex-col">
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-[#EAE7DF] rounded-lg flex items-center justify-center text-orange-700">
 <Facebook className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-slate-900 text-lg">Facebook Fanpage</h4>
 <p className="text-xs text-slate-600">Đồng bộ tin nhắn & bình luận</p>
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
 <p className="text-[10px] text-emerald-600 font-bold">Đã kết nối</p>
 </div>
 </div>
 <button className="text-xs text-red-600 font-bold hover:underline">Hủy kết nối</button>
 </div>
 </div>
 
 <button className="w-full py-2.5 border-2 border-dashed border-slate-400 rounded-lg text-slate-700 font-bold text-sm hover:border-slate-900 hover:text-primary-600 transition-all flex justify-center items-center gap-2">
 <Plus className="w-4 h-4" /> Thêm Fanpage mới
 </button>
 </div>

 {/* Zalo OA Config */}
 <div className="bg-white rounded-lg p-6 border border-slate-300 shadow-sm flex flex-col">
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-slate-800/10 rounded-lg flex items-center justify-center text-orange-600">
 <MessageSquare className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-slate-900 text-lg">Zalo Official Account</h4>
 <p className="text-xs text-slate-600">Gửi ZNS & chat với khách hàng</p>
 </div>
 </div>
 <ToggleRight className="w-8 h-8 text-orange-600 shrink-0 cursor-pointer" />
 </div>
 
 <div className="space-y-4 mb-6 flex-1">
 <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-center opacity-70 grayscale">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-700">Z</div>
 <div>
 <p className="text-sm font-bold text-slate-900">Chưa kết nối OA nào</p>
 <p className="text-[10px] text-slate-600 font-bold">Cần cấu hình API OA</p>
 </div>
 </div>
 </div>
 <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100 flex items-start gap-2">
 <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
 <p>Vui lòng tạo Zalo App và cấp quyền truy cập Zalo OA trước khi kết nối vào hệ thống.</p>
 </div>
 </div>
 
 <button className="w-full py-2.5 bg-slate-800 text-[#FAF9F5] rounded-lg font-bold text-sm hover:bg-slate-900 transition-all flex justify-center items-center gap-2 shadow-sm">
 <Plug className="w-4 h-4" /> Kết nối Zalo OA
 </button>
 </div>

 {/* Web Livechat Widget */}
 <div className="bg-white rounded-lg p-6 border border-slate-300 shadow-sm flex flex-col lg:col-span-2">
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
 <Code2 className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-slate-900 text-lg">Mã nhúng Livechat Website</h4>
 <p className="text-xs text-slate-600">Chèn widget chat trực tiếp lên website của bạn</p>
 </div>
 </div>
 <ToggleRight className="w-8 h-8 text-primary-600 shrink-0 cursor-pointer" />
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div>
 <h5 className="text-xs font-bold text-slate-800 uppercase mb-3">Tùy chỉnh giao diện</h5>
 <div className="space-y-4">
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1.5">Màu chủ đạo (Hex code)</label>
 <div className="flex gap-2">
 <input type="color" value="#4F46E5" readOnly className="w-8 h-8 rounded border-none cursor-pointer" />
 <input type="text" value="#4F46E5" readOnly className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1 font-mono text-sm text-slate-700" />
 </div>
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1.5">Lời chào mặc định</label>
 <input type="text" value="Chào bạn, VComm có thể giúp gì cho bạn?" readOnly className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 font-medium" />
 </div>
 </div>
 </div>
 
 <div>
 <h5 className="text-xs font-bold text-slate-800 uppercase mb-3">Copy JavaScript Snippet</h5>
 <div className="relative">
 <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg text-[11px] font-mono overflow-x-auto min-w-0">
{`<script>
 window.VCommChatOptions = {
 appId: "vcomm_live_9a8b7c6d",
 color: "#4F46E5",
 greeting: "Chào bạn..."
 };
</script>
<script src="https://cdn.vcomm.io/chat.js" async></script>`}
 </pre>
 <button className="absolute top-2 right-2 bg-slate-900/10 hover:bg-white/20 text-[#FAF9F5] rounded p-1.5 transition-all text-[10px] font-bold">Copy Code</button>
 </div>
 <p className="text-[10px] text-slate-600 mt-2 italic">* Chèn đoạn mã này vào thẻ &lt;head&gt; hoặc trước thẻ đóng &lt;/body&gt; trên website của bạn.</p>
 </div>
 </div>
 </div>
 </DraggableGrid>
 </div>
 )}
 </div>
 </div>

 {/* Ticket Detail / AI Reply Modal */}
 <AnimatePresence>
 {selectedTicket && (
  <Modal
    isOpen={true}
    onClose={() => setSelectedTicket(null)}
    maxWidth="2xl"
    hideFooter
    noPadding
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
            {selectedTicket.status === 'open' ? 'MỚI' : 'ĐANG XỬ LÝ'}
          </span>
        </div>
      </div>
    </div>

    <div className="p-6 space-y-6">
      {/* Customer Info */}
      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{selectedTicket.customerName}</p>
          <p className="text-xs text-slate-600">Khách hàng Vàng • 12 đơn hàng</p>
        </div>
      </div>

      {/* AI Sentiment analysis */}
      <div className={cn("p-4 rounded-lg border", selectedTicket.sentiment === 'critical' ? 'bg-red-50 border-red-100' : 'bg-primary-50 border-primary-100')}>
        <p className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 mb-2" style={{ color: selectedTicket.sentiment === 'critical' ? '#EF4444' : '#6366F1' }}>
          <Sparkles className="w-3 h-3" /> Nhận định AI
        </p>
        <p className="text-sm font-medium text-slate-800">
          {selectedTicket.sentiment === 'critical' ? 
          "Khách hàng đang có thái độ rất bức xúc. Cần giải quyết và đền bù NGAY LẬP TỨC để tránh khủng hoảng truyền thông." : 
          "Khách hàng đưa ra thắc mắc thông thường, giọng điệu trung tính. Có thể dùng template trả lời tự động."}
        </p>
      </div>

      {/* Reply Action */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-orange-600" /> Phản hồi khách hàng
        </h3>
        <textarea 
          className="w-full h-32 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none bg-slate-50"
          placeholder="Nhập nội dung phản hồi..."
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
            Tự động soạn bằng AI
          </button>
          <button 
            onClick={() => handleCloseTicket(selectedTicket, draftedMessage)}
            className="bg-slate-900 text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 transition-all font-mono"
          >
            Gửi & Đóng Ticket
          </button>
        </div>
      </div>
    </div>
  </Modal>
 )}
 </AnimatePresence>

  {/* Zalo ZNS Sentinel Success Floating Toast */}
  {znsToast && znsToast.show && (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-950 border border-blue-500/50 text-[#FAF9F5] rounded-lg p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white shrink-0 shadow">
          Z
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black tracking-widest text-blue-400 uppercase">Zalo Notification Service (ZNS)</p>
          <p className="text-xs font-semibold text-slate-100 mt-1 leading-snug">{znsToast.message}</p>
          
          <div className="mt-3 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
            <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1 font-mono">Bản tin đã gửi:</p>
            <p className="text-[11px] text-slate-300 font-mono leading-relaxed max-h-24 overflow-y-auto">
              {znsToast.logContent}
            </p>
          </div>
          
          <div className="flex items-center justify-between mt-3 text-[10px]">
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              ● Đã chuyển tiếp thành công
            </span>
            <button 
              onClick={() => setZnsToast(null)}
              className="font-bold text-slate-400 hover:text-slate-100 underline transition"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )}

 </div>
 );
}
