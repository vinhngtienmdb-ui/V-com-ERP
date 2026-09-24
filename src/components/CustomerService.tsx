import { DraggableGrid } from './ui/DraggableGrid';
import { CompactPageHeader } from './common/CompactPageHeader';
import { CompactStatsRibbon, MetricRibbonItem } from './common/CompactStatsRibbon';
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
 Headset,
 Mic,
 MicOff,
 PhoneOff,
 Pause,
 Play,
 Delete,
 Volume2,
 RefreshCw
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
  { id: 'T4', channel: 'call', userName: 'Trần Văn Bình', lastMessage: 'Ghi âm cuộc gọi nhỡ: 0987654321', unreadCount: 1, updatedAt: '09:40' },
  { id: 'T5', channel: 'zalo', userName: 'Đặng Văn Lâm', lastMessage: 'Cho mình xin mã ZNS theo dõi đơn vận chuyển', unreadCount: 0, updatedAt: '08:15' },
  { id: 'T6', channel: 'web', userName: 'Nguyễn Thị Tuyết', lastMessage: 'Em muốn đổi size máy in bill khổ K80', unreadCount: 0, updatedAt: 'Hôm qua' },
];

export interface CskhAgent {
  id: string;
  name: string;
  role: string;
  skills: ('complaint' | 'inquiry' | 'technical' | 'return' | 'feedback' | 'all')[];
  activeTickets: number;
  isOnline: boolean;
  avatar: string;
}

export const CSKH_AGENTS: CskhAgent[] = [
  { id: 'AGT-01', name: 'Nguyễn Mai Anh', role: 'Chuyên viên Đổi trả & Khiếu nại', skills: ['complaint', 'return'], activeTickets: 2, isOnline: true, avatar: 'M' },
  { id: 'AGT-02', name: 'Trần Văn Bình', role: 'Kỹ thuật viên & Cổng Thanh toán', skills: ['technical'], activeTickets: 1, isOnline: true, avatar: 'B' },
  { id: 'AGT-03', name: 'Lê Thị Thu Thảo', role: 'Tư vấn viên Sản phẩm & CSKH', skills: ['inquiry', 'feedback', 'all'], activeTickets: 1, isOnline: true, avatar: 'T' },
  { id: 'AGT-04', name: 'Hoàng Quốc Dũng', role: 'Chăm sóc Khách hàng VIP', skills: ['all'], activeTickets: 2, isOnline: true, avatar: 'D' }
];

const MOCK_TICKETS = [
 { id: 'TKT-1042', customerName: 'Nguyễn Văn A', subject: 'Hàng nhận bị móp hộp', status: 'open', priority: 'high', type: 'complaint', createdAt: '10:45 20/04/2026', sentiment: 'critical', assignedAgent: 'Nguyễn Mai Anh', channel: 'zalo', phone: '0981234567' },
 { id: 'TKT-1041', customerName: 'Trần Thị B', subject: 'Hỏi về thời gian bảo hành', status: 'in_progress', priority: 'medium', type: 'inquiry', createdAt: '09:12 20/04/2026', sentiment: 'neutral', assignedAgent: 'Lê Thị Thu Thảo', channel: 'web', phone: '0912345678' },
 { id: 'TKT-1040', customerName: 'Lê Văn C', subject: 'Lỗi thanh toán Momo', status: 'closed', priority: 'high', type: 'technical', createdAt: '16:30 19/04/2026', sentiment: 'negative', assignedAgent: 'Trần Văn Bình', channel: 'facebook', phone: '0901234567' },
 { id: 'TKT-1039', customerName: 'Phạm D', subject: 'Cần đổi size áo', status: 'open', priority: 'medium', type: 'return', createdAt: '08:05 19/04/2026', sentiment: 'neutral', assignedAgent: 'Nguyễn Mai Anh', channel: 'zalo', phone: '0934567890' },
 { id: 'TKT-1038', customerName: 'Hoàng E', subject: 'Khen ngợi dịch vụ shipper', status: 'closed', priority: 'low', type: 'feedback', createdAt: '14:20 18/04/2026', sentiment: 'positive', assignedAgent: 'Hoàng Quốc Dũng', channel: 'vcomm', phone: '0977889900' },
];

// --- COMPONENT ---
export function CustomerService() {
  const [activeTab, setActiveTab] = useState<any>('dashboard');
  const [tickets, setTickets] = useState(MOCK_TICKETS);
  const [agents, setAgents] = useState<CskhAgent[]>(CSKH_AGENTS);
  const [isAutoDistributing, setIsAutoDistributing] = useState(false);
  const [znsToast, setZnsToast] = useState<{ show: boolean, message: string, logContent: string } | null>(null);
  const [selectedChatChannel, setSelectedChatChannel] = useState<'all' | 'facebook' | 'zalo' | 'web' | 'call'>('all');
  const [chatSearchText, setChatSearchText] = useState<string>('');

  // Thuật toán chia ticket tự động Round-Robin kết hợp Kỹ năng (Skill-based)
  const handleRoundRobinDistribute = () => {
    setIsAutoDistributing(true);
    setTimeout(() => {
      const onlineAgents = agents.filter(a => a.isOnline);
      if (onlineAgents.length === 0) {
        alert('Không có nhân viên trực nào đang Online!');
        setIsAutoDistributing(false);
        return;
      }

      let agentIdx = 0;
      let assignedCount = 0;
      const updated = tickets.map(t => {
        if (!t.assignedAgent || t.status === 'open') {
          // Phân bổ theo kỹ năng tương thích hoặc luân phiên Round-robin
          const matched = onlineAgents.find(a => a.skills.includes(t.type as any) || a.skills.includes('all')) || onlineAgents[agentIdx % onlineAgents.length];
          agentIdx++;
          assignedCount++;
          return {
            ...t,
            assignedAgent: matched.name,
            status: 'in_progress'
          };
        }
        return t;
      });

      setTickets(updated);
      setIsAutoDistributing(false);
      setSuccessToast(`Đã hoàn tất phân bổ Round-Robin tự động ${assignedCount} ticket cho các nhân sự trực ca!`);
    }, 600);
  };
  
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

  // --- OmiCall & WebRTC SIP Softphone State ---
  const [dialNumber, setDialNumber] = useState<string>('0901234567');
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isHold, setIsHold] = useState<boolean>(false);
  const [callLogs, setCallLogs] = useState([
    { time: '14:20 20/04/2026', duration: '02:45', status: 'missed', caller: '0901234567', type: 'inbound', name: 'Nguyễn Văn A', hasAudio: false },
    { time: '10:15 20/04/2026', duration: '08:12', status: 'completed', caller: '0987654321', type: 'outbound', name: 'Trần Thị B', hasAudio: true },
    { time: '09:05 19/04/2026', duration: '01:20', status: 'completed', caller: '0919876543', type: 'inbound', name: 'Lê Văn C', hasAudio: true }
  ]);

  useEffect(() => {
    let timer: any = null;
    if (callState === 'connected') {
      timer = setInterval(() => {
        setCallSeconds(prev => prev + 1);
      }, 1000);
    } else if (callState === 'idle') {
      setCallSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [callState]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    if (!dialNumber.trim()) {
      alert('Vui lòng nhập số điện thoại cần gọi!');
      return;
    }
    setCallState('calling');
    setTimeout(() => {
      setCallState('connected');
    }, 1500);
  };

  const handleEndCall = () => {
    const durationFormatted = formatTimer(callSeconds);
    const now = new Date();
    const timeFormatted = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')} ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    
    setCallLogs(prev => [
      {
        time: timeFormatted,
        duration: durationFormatted || '00:01',
        status: 'completed',
        caller: dialNumber,
        type: 'outbound',
        name: `Khách hàng (${dialNumber})`,
        hasAudio: true
      },
      ...prev
    ]);

    setCallState('ended');
    setTimeout(() => {
      setCallState('idle');
      setIsMuted(false);
      setIsHold(false);
    }, 1200);
  };

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
   { id: 'TKT-1042', customerName: 'Nguyễn Văn A', subject: 'Hàng nhận bị móp hộp', priority: 'high', channel: 'vcomm', waitingTime: '24 phút', sentiment: 'critical' },
   { id: 'TKT-1039', customerName: 'Phạm D', subject: 'Cần đổi size áo', priority: 'medium', channel: 'facebook', waitingTime: '18 phút', sentiment: 'neutral' },
   { id: 'TKT-1041', customerName: 'Trần Thị B', subject: 'Hỏi về thời gian bảo hành', priority: 'medium', channel: 'zalo', waitingTime: '15 phút', sentiment: 'neutral' },
   { id: 'TKT-1040', customerName: 'Lê Văn C', subject: 'Lỗi thanh toán Momo', priority: 'high', channel: 'web', waitingTime: '32 phút', sentiment: 'negative' },
 ]);

 const simulateNewTicket = () => {
   setIsSimulatingTicket(true);
   setTimeout(() => {
     const customers = ['Đặng Văn Lâm', 'Nguyễn Thị Tuyết', 'Hồ Hoài Nam', 'Phạm Quỳnh Anh'];
     const issues = ['Hỏi về mã khuyến mãi giảm 20%', 'Sản phẩm giao bị thiếu quà tặng', 'Lỗi thanh toán ngân hàng báo thành công nhưng app báo chờ', 'Tư vấn đóng gói quà sinh nhật'];
     const channels = ['facebook', 'zalo', 'web', 'vcomm'];
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
   else if (dashboardChannel === 'vcomm') modifier *= 0.17;

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

  const handleConvertChatToTicket = () => {
    if (!activeThread) return;
    const newId = `TKT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTkt = {
      id: newId,
      customerName: activeThread.userName,
      subject: activeThread.lastMessage || `Yêu cầu hỗ trợ từ kênh ${activeThread.channel.toUpperCase()}`,
      status: 'open' as const,
      priority: 'high' as const,
      type: 'inquiry' as const,
      createdAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date().toLocaleDateString('vi-VN'),
      sentiment: 'critical' as const,
      assignedAgent: agents.find(a => a.isOnline)?.name || 'Nguyễn Mai Anh',
      channel: activeThread.channel,
      phone: '0981234567',
      slaDeadline: '30 phút (P2)',
      slaStatus: 'on_track'
    };
    setTickets(prev => [newTkt as any, ...prev]);
    setSuccessToast(`Đã chuyển đổi hội thoại khách hàng "${activeThread.userName}" thành Ticket #${newId} với giám sát SLA!`);
  };

  const handleUpdateTicketStatus = (ticketId: string, newStatus: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: newStatus as any } : t));
    setSuccessToast(`Đã cập nhật trạng thái Ticket #${ticketId} thành ${newStatus.toUpperCase()}`);
  };

  const handleSimulateAiReply = () => {
    setAiDrafting(true);
    setTimeout(() => {
      setDraftedMessage(`Dạ em chào anh/chị ${selectedTicket?.customerName || 'Quý khách'}, em bên bộ phận CSKH VComm xin ghi nhận thông tin về vấn đề "${selectedTicket?.subject || ''}". Bộ phận kỹ thuật đang tiến hành kiểm tra lại và sẽ xử lý ngay lập tức trong cam kết SLA ạ. Xin lỗi vì sự bất tiện này.`);
      setAiDrafting(false);
    }, 1200);
  };

  const csRibbonItems: MetricRibbonItem[] = [
    {
      id: 'open',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: 'Tiếp Nhận Mới',
      value: 24,
      subText: 'Gấp: 5 ticket',
      colorVariant: 'rose',
      onClick: () => setActiveTab('tickets')
    },
    {
      id: 'sla',
      icon: <Clock className="w-3.5 h-3.5" />,
      label: 'Phản Hồi TB (SLA)',
      value: '14 phút',
      subText: 'Nhanh hơn 5p',
      colorVariant: 'blue'
    },
    {
      id: 'csat',
      icon: <Star className="w-3.5 h-3.5" />,
      label: 'Hài Lòng (CSAT)',
      value: '4.8 / 5.0',
      subText: '96.4% 5 sao',
      colorVariant: 'amber'
    },
    {
      id: 'bot',
      icon: <Sparkles className="w-3.5 h-3.5" />,
      label: 'AI Auto-Reply',
      value: '68%',
      subText: 'Tự động sơ bộ',
      colorVariant: 'purple'
    }
  ];

  return (
    <div className="space-y-3 animate-in fade-in slide-in- duration-500 pb-12 font-sans">
      {/* Compact Standardized Header */}
      <CompactPageHeader
        icon={<Headphones className="w-4 h-4 text-blue-600" />}
        title="Chăm Sóc Khách Hàng & Tổng Đài VComm"
        badge={{ text: "Omnichannel CSKH", variant: "blue" }}
        description={roleScope === 'platform' ? 'Trung tâm điều phối hỗ trợ đa kênh, giải quyết tranh chấp sàn và giám sát cam kết SLA nhà bán.' : 'Quản lý khiếu nại, phản hồi đánh giá và tự động hóa CSKH bằng trí tuệ nhân tạo.'}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Scope Switcher */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button 
                onClick={() => setRoleScope('platform')}
                className={cn("px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer", roleScope === 'platform' ? "bg-white text-blue-700 shadow-2xs" : "text-slate-600 hover:text-slate-900")}
              >
                <Building2 className="w-3 h-3" /> Sàn
              </button>
              <button 
                onClick={() => setRoleScope('seller')}
                className={cn("px-2.5 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-all cursor-pointer", roleScope === 'seller' ? "bg-white text-emerald-700 shadow-2xs" : "text-slate-600 hover:text-slate-900")}
              >
                <Store className="w-3 h-3" /> Nhà bán
              </button>
            </div>

            <button 
              onClick={() => setActiveTab('dashboard')} 
              className="bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <BarChart2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Báo Cáo SLA</span>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer">
              <Ticket className="w-3.5 h-3.5" />
              <span>Tạo Ticket</span>
            </button>
          </div>
        }
      />

      {/* Compact Stats Ribbon */}
      <CompactStatsRibbon
        items={csRibbonItems}
        storageKey="customer_service_stats_ribbon"
      />

 {/* Main Content Area */}
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
  {/* Navigation Tabs */}
  <div className="flex bg-slate-50 border-b border-slate-300 p-2 gap-2 overflow-x-auto hidden-scrollbar min-w-0">
   <button 
     onClick={() => setActiveTab('chat')}
     className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer", activeTab === 'chat' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
   >
     <MessageSquare className="w-4 h-4 text-orange-600" /> Hộp Thư Chat Đa Kênh (Omnichannel)
   </button>
  <button 
  onClick={() => setActiveTab('tickets')}
  className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer", activeTab === 'tickets' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
  >
  <Ticket className="w-4 h-4 text-blue-600" /> Quản Lý Tickets & SLA
  </button>
  <button 
  onClick={() => setActiveTab('calls')}
  className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer", activeTab === 'calls' ? "bg-white text-emerald-600 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
  >
  <PhoneCall className="w-4 h-4 text-emerald-600" /> Tổng Đài WebRTC (VoIP)
  </button>
  <button 
  onClick={() => setActiveTab('zalo_zns')}
  className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer", activeTab === 'zalo_zns' ? "bg-white text-blue-700 shadow-sm border border-blue-200" : "text-slate-600 hover:bg-slate-100")}
  >
  <MessageCircle className="w-4 h-4 text-blue-600" /> Cổng Zalo ZNS Realtime
  </button>
  <button 
  onClick={() => setActiveTab('agents')}
  className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer", activeTab === 'agents' ? "bg-white text-rose-600 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
  >
  <Users className="w-4 h-4 text-rose-600" /> Đội Ngũ Trực Ca & Kỹ Năng
  </button>
   <button 
     onClick={() => setActiveTab('dashboard')}
     className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer", activeTab === 'dashboard' ? "bg-white text-emerald-700 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
   >
     <BarChart2 className="w-4 h-4 text-emerald-600" /> Báo Cáo SLA & CSAT
   </button>
  <button 
  onClick={() => setActiveTab('config')}
  className={cn("px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer", activeTab === 'config' ? "bg-white text-slate-900 shadow-sm border border-slate-300" : "text-slate-600 hover:bg-slate-100")}
  >
  <Settings className="w-4 h-4 text-slate-600" /> Cấu Hình Kênh Kết Nối
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
 className="bg-slate-50 border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72 focus:bg-white focus:ring-4 focus:ring-orange-600/10 transition-all font-medium"
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
				<div className="w-full lg:w-2/3 bg-white p-6 rounded-xl border border-slate-300 shadow-sm space-y-6">
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
								<option value="vcomm">VComm App Chat</option>
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
					<div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm space-y-4">
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
					<div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-5 rounded-xl text-[#FAF9F5] shadow-lg relative overflow-hidden border border-slate-700">
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
			<div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden font-sans">
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
											{alert.channel === 'facebook' ? <span className="text-blue-600 font-bold">Facebook</span> : 
											 alert.channel === 'zalo' ? <span className="text-sky-600 font-bold">Zalo</span> : 
											 alert.channel === 'vcomm' ? <span className="text-orange-600 font-bold">VComm App</span> : 
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
 <div className="space-y-4 p-4">
   {/* Round-Robin & Agent Roster Header Banner */}
   <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-2xl border border-blue-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
     <div className="flex items-center gap-3">
       <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-xs">
         <Headphones className="w-5 h-5" />
       </div>
       <div>
         <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
           Đội Ngũ Trực Tổng Đài & Thuật Toán Phân Bổ Round-Robin
           <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">
             {agents.filter(a => a.isOnline).length} Nhân Sự Online
           </span>
         </h4>
         <p className="text-xs text-slate-500 mt-0.5">
           Tự động cân bằng tải và điều phối ticket theo kỹ năng chuyên môn (Khiếu nại, Kỹ thuật, Đổi trả, VIP).
         </p>
       </div>
     </div>

     {/* Action button */}
     <div className="flex items-center gap-2 w-full md:w-auto">
       <button
         onClick={handleRoundRobinDistribute}
         disabled={isAutoDistributing}
         className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
       >
         <RefreshCw className={cn("w-3.5 h-3.5", isAutoDistributing && "animate-spin")} />
         {isAutoDistributing ? 'Đang phân bổ...' : 'Phân Bổ Tự Động Round-Robin'}
       </button>
     </div>
   </div>

   {/* Agent Quick Status Strip */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
     {agents.map(ag => (
       <div key={ag.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-2xs">
         <div className="flex items-center gap-2.5">
           <div className="relative">
             <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center border border-indigo-200">
               {ag.avatar}
             </div>
             <span className={cn(
               "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
               ag.isOnline ? "bg-emerald-500" : "bg-slate-300"
             )} />
           </div>
           <div>
             <div className="text-xs font-bold text-slate-800 leading-tight">{ag.name}</div>
             <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{ag.role}</div>
           </div>
         </div>
         <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono">
           {tickets.filter(t => (t as any).assignedAgent === ag.name && t.status !== 'closed').length} xử lý
         </span>
       </div>
     ))}
   </div>

   {/* Tickets Table */}
   <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
     <table className="w-full text-left border-collapse whitespace-nowrap">
      <thead>
      <tr className="bg-slate-50/70 border-b border-slate-200">
      <th className="px-6 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Ticket ID & KH</th>
      <th className="px-6 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Vấn đề & Kênh</th>
      <th className="px-6 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">Nhân Sự CSKH (Agent)</th>
      <th className="px-6 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Cam kết SLA</th>
      <th className="px-6 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Trạng thái</th>
      <th className="px-6 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed">Mức độ</th>
      <th className="px-6 py-3.5 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right leading-relaxed">Thao tác SLA</th>
      </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
      {tickets.map(ticket => (
      <tr 
      key={ticket.id} 
      onClick={() => setSelectedTicket(ticket)}
      className={cn("hover:bg-slate-50 cursor-pointer transition-colors group", ticket.status === 'open' ? 'bg-white' : 'bg-slate-50/30')}
      >
      <td className="px-6 py-3.5">
      <p className="text-xs font-mono font-bold text-slate-700 mb-0.5">{ticket.id}</p>
      <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{ticket.customerName}</p>
      </td>
      <td className="px-6 py-3.5">
      <div className="flex items-center gap-2">
      {ticket.sentiment === 'critical' ? <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> : 
      ticket.sentiment === 'negative' ? <span className="w-2 h-2 rounded-full bg-orange-500" /> : 
      <span className="w-2 h-2 rounded-full bg-emerald-500" />}
      <div>
      <p className="text-sm font-bold text-slate-800">{ticket.subject}</p>
      <div className="flex items-center gap-1.5 mt-0.5">
        <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">{ticket.type}</span>
        <span className="text-[10px] text-slate-400">•</span>
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold uppercase">{ticket.channel || 'Zalo OA'}</span>
      </div>
      </div>
      </div>
      </td>
      <td className="px-6 py-3.5">
        {(ticket as any).assignedAgent ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] flex items-center justify-center border border-indigo-200">
              {(ticket as any).assignedAgent[0]}
            </div>
            <span className="text-xs font-bold text-slate-800">{(ticket as any).assignedAgent}</span>
          </div>
        ) : (
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            Chờ phân bổ Round-Robin
          </span>
        )}
      </td>
      <td className="px-6 py-3.5 text-center">
        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center justify-center gap-1 mx-auto w-fit",
          (ticket as any).slaStatus === 'breached' ? "bg-rose-50 text-rose-700 border-rose-200" :
          (ticket as any).slaStatus === 'met' || ticket.status === 'closed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
          "bg-sky-50 text-sky-700 border-sky-200"
        )}>
          <Clock className="w-3 h-3" />
          <span>{(ticket as any).slaDeadline || (ticket.priority === 'high' ? '30 phút (P1)' : '2 giờ (P2)')}</span>
        </span>
      </td>
      <td className="px-6 py-3.5 text-center">
      <span className={cn(
      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
      ticket.status === 'open' ? "bg-red-50 text-red-700 border border-red-200" : 
      ticket.status === 'in_progress' ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
      )}>
      {ticket.status === 'open' ? 'MỚI' : ticket.status === 'in_progress' ? 'ĐANG XỬ LÝ' : 'ĐÃ ĐÓNG'}
      </span>
      </td>
      <td className="px-6 py-3.5 text-center">
      <span className={cn(
      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border",
      ticket.priority === 'high' ? "border-red-200 text-red-600 bg-red-50" : 
      ticket.priority === 'medium' ? "border-amber-200 text-amber-600 bg-amber-50" : "border-slate-300 text-slate-600 bg-white"
      )}>
      {ticket.priority}
      </span>
      </td>
      <td className="px-6 py-3.5 text-right" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1.5">
          {ticket.status !== 'closed' ? (
            <button
              type="button"
              onClick={(e) => handleUpdateTicketStatus(ticket.id, 'closed', e)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
            >
              Đóng phiếu
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => handleUpdateTicketStatus(ticket.id, 'in_progress', e)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold transition-all cursor-pointer"
            >
              Mở lại
            </button>
          )}
          <button
            type="button"
            onClick={() => setSelectedTicket(ticket)}
            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold transition-all cursor-pointer"
          >
            Chi tiết
          </button>
        </div>
      </td>
      </tr>
      ))}
      </tbody>
      </table>
   </div>
 </div>
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
    <div className="p-3 border-b border-[#F3F4F6] space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">Kênh Hội Thoại</span>
        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Real-time</span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {[
          { id: 'all', label: 'Tất cả' },
          { id: 'facebook', label: 'Fanpage' },
          { id: 'zalo', label: 'Zalo ZNS' },
          { id: 'web', label: 'Livechat' },
          { id: 'call', label: 'VoIP' }
        ].map(ch => (
          <button
            key={ch.id}
            onClick={() => setSelectedChatChannel(ch.id as any)}
            className={cn(
              "px-2.5 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer",
              selectedChatChannel === ch.id
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            {ch.label}
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
        <input 
          type="text" 
          value={chatSearchText}
          onChange={e => setChatSearchText(e.target.value)}
          placeholder="Tìm hội thoại, khách hàng..." 
          className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium"
        />
      </div>
    </div>
    <div className="flex-1 overflow-y-auto">
      {MOCK_THREADS.filter(thread => {
        const matchChannel = selectedChatChannel === 'all' || thread.channel === selectedChatChannel;
        const matchSearch = !chatSearchText.trim() ||
          thread.userName.toLowerCase().includes(chatSearchText.toLowerCase()) ||
          thread.lastMessage.toLowerCase().includes(chatSearchText.toLowerCase());
        return matchChannel && matchSearch;
      }).map(thread => (
        <button
          key={thread.id}
          onClick={() => setActiveThreadId(thread.id)}
          className={cn(
            "w-full p-3.5 flex gap-3 hover:bg-slate-50 transition-all border-b border-[#F3F4F6] text-left relative cursor-pointer",
            activeThreadId === thread.id && "bg-white border-l-2 border-l-blue-600 shadow-sm"
          )}
        >
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
              {thread.userAvatar ? <img src={thread.userAvatar} alt="" className="rounded-full" /> : thread.userName[0]}
            </div>
            <div className={cn(
              "absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white",
              thread.channel === 'facebook' ? "bg-blue-600 text-white" :
              thread.channel === 'zalo' ? "bg-blue-500 text-white" :
              thread.channel === 'call' ? "bg-emerald-600 text-white" :
              "bg-indigo-600 text-white"
            )}>
              {thread.channel === 'facebook' ? <span className="text-[8px] font-bold">f</span> :
               thread.channel === 'zalo' ? <MessageSquare className="w-2.5 h-2.5" /> :
               thread.channel === 'call' ? <PhoneCall className="w-2.5 h-2.5" /> :
               <Globe className="w-2.5 h-2.5" />}
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
  <button 
    onClick={handleConvertChatToTicket}
    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
    title="Chuyển hội thoại khách hàng thành Ticket hỗ trợ có giám sát SLA"
  >
    <Ticket className="w-3.5 h-3.5" />
    <span>Chuyển thành Ticket SLA</span>
  </button>
  <button 
    onClick={() => {
      setDialNumber('0981234567');
      setActiveTab('calls');
      handleStartCall();
    }}
    title="Gọi thoại trực tiếp qua WebRTC Softphone"
    className="p-2 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 rounded-full transition-colors cursor-pointer"
  >
    <PhoneCall className="w-4 h-4" />
  </button>
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
 className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-slate-900 focus:bg-white transition-all font-medium"
 />
 <button className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 hover:bg-slate-800 text-[#FAF9F5] rounded-lg transition-all disabled:opacity-50 flex items-center justify-center shadow-sm shadow-slate-900/5" onClick={handleSendMessage} disabled={isAiProcessing || !inputValue.trim()}>
 <Send className="w-4 h-4 ml-0.5" />
 </button>
 </div>
 <button className="bg-amber-100 hover:bg-amber-200 p-3 rounded-xl transition-colors flex-shrink-0 relative group">
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

 {/* Click-to-call & Customer details */}
 <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
 <div className="flex items-center justify-between text-xs text-slate-500">
 <span>Số điện thoại:</span>
 <span className="font-mono font-bold text-slate-900">0981234567</span>
 </div>
 <div className="flex items-center justify-between text-xs text-slate-500">
 <span>Tổng chi tiêu sàn:</span>
 <span className="font-bold text-emerald-600">8,450,000đ</span>
 </div>
 <div className="pt-1 flex gap-2">
 <button
 onClick={() => {
 setDialNumber('0981234567');
 setActiveTab('calls');
 handleStartCall();
 }}
 className="flex-1 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
 >
 <PhoneCall className="w-3.5 h-3.5" />
 <span>Click-to-Call</span>
 </button>
 <button
 onClick={handleConvertChatToTicket}
 className="flex-1 py-2 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
 >
 <Ticket className="w-3.5 h-3.5" />
 <span>Tạo Ticket</span>
 </button>
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
 <p className="text-sm font-bold text-[#2563EB]">{formatCurrency(order.amount)}</p>
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
    <div className="flex flex-col xl:flex-row min-h-[640px]">
      {/* OmiCall & WebRTC SIP Softphone */}
      <div className="w-full xl:w-[420px] border-r border-slate-200 bg-slate-50/70 p-6 flex flex-col items-center justify-between">
        <div className="w-full flex flex-col items-center">
          <div className="w-full flex items-center justify-between mb-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Headset className="w-5 h-5 text-emerald-600" />
              Tổng đài WebRTC Softphone
            </h3>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SIP 101 ONLINE
            </div>
          </div>

          {/* Softphone Body */}
          <div className="bg-white w-full rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col items-center space-y-4">
            {/* Screen display */}
            <div className="w-full bg-slate-900 text-white rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden shadow-inner min-h-[96px]">
              <div className="absolute top-2 left-3 flex items-center gap-1 text-[9px] font-mono text-emerald-400 font-bold">
                <Zap className="w-2.5 h-2.5" /> OPUS 48kHz HD
              </div>
              <div className="absolute top-2 right-3 text-[9px] font-mono text-slate-400 font-bold">
                WSS: sip.vcomm.vn
              </div>

              {callState === 'idle' && (
                <div className="mt-2 flex items-center justify-between w-full px-2">
                  <span className="text-2xl font-mono font-black text-white tracking-wider truncate">
                    {dialNumber || 'Nhập số...'}
                  </span>
                  {dialNumber && (
                    <button
                      onClick={() => setDialNumber(prev => prev.slice(0, -1))}
                      className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                      title="Xóa ký tự cuối"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {callState === 'calling' && (
                <div className="mt-2 flex flex-col items-center text-center">
                  <p className="text-xs text-amber-300 font-bold uppercase tracking-wider animate-pulse flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 animate-bounce" />
                    Đang kết nối cuộc gọi...
                  </p>
                  <p className="text-lg font-mono font-black text-white tracking-widest mt-0.5">{dialNumber}</p>
                </div>
              )}

              {callState === 'connected' && (
                <div className="mt-2 flex flex-col items-center text-center">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xl font-mono font-black text-emerald-400 tracking-wider">
                      {formatTimer(callSeconds)}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-300 mt-0.5">
                    Đàm thoại: <span className="font-mono font-bold text-white">{dialNumber}</span>
                  </p>
                  {/* Fake audio waveform bars */}
                  <div className="flex items-center gap-1 mt-1.5 h-3">
                    {[12, 24, 16, 28, 8, 20, 14, 26, 18, 10].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-emerald-400 rounded-full transition-all duration-150"
                        style={{ height: isHold ? '3px' : `${Math.max(4, (h * ((i % 3) + 1)) % 14)}px` }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {callState === 'ended' && (
                <div className="mt-2 flex flex-col items-center text-center">
                  <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">Cuộc gọi đã kết thúc</p>
                  <p className="text-sm font-mono text-slate-300 mt-0.5">Đã lưu bản ghi âm</p>
                </div>
              )}
            </div>

            {/* In-call controls (when connected) */}
            {callState === 'connected' && (
              <div className="flex items-center justify-center gap-3 w-full py-1">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer",
                    isMuted ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {isMuted ? <MicOff className="w-4 h-4 text-rose-600" /> : <Mic className="w-4 h-4" />}
                  {isMuted ? 'Tắt Mic' : 'Bật Mic'}
                </button>

                <button
                  onClick={() => setIsHold(!isHold)}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer",
                    isHold ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  )}
                >
                  {isHold ? <Play className="w-4 h-4 text-amber-600" /> : <Pause className="w-4 h-4" />}
                  {isHold ? 'Tiếp tục' : 'Giữ máy'}
                </button>

                <button
                  className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[10px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all cursor-pointer"
                  title="Âm lượng loa ngoài"
                >
                  <Volume2 className="w-4 h-4 text-slate-600" />
                  Loa
                </button>
              </div>
            )}

            {/* Keypad Buttons */}
            <div className="grid grid-cols-3 gap-2.5 w-full">
              {[
                { label: '1', sub: '' },
                { label: '2', sub: 'ABC' },
                { label: '3', sub: 'DEF' },
                { label: '4', sub: 'GHI' },
                { label: '5', sub: 'JKL' },
                { label: '6', sub: 'MNO' },
                { label: '7', sub: 'PQRS' },
                { label: '8', sub: 'TUV' },
                { label: '9', sub: 'WXYZ' },
                { label: '*', sub: '' },
                { label: '0', sub: '+' },
                { label: '#', sub: '' },
              ].map(k => (
                <button
                  key={k.label}
                  disabled={callState === 'calling' || callState === 'ended'}
                  onClick={() => setDialNumber(prev => prev + k.label)}
                  className="h-12 rounded-xl bg-slate-50 hover:bg-slate-100 active:bg-slate-200 border border-slate-200/80 text-slate-800 flex flex-col items-center justify-center transition-all active:scale-95 shadow-2xs cursor-pointer disabled:opacity-50"
                >
                  <span className="text-base font-black leading-none">{k.label}</span>
                  {k.sub && <span className="text-[8px] font-bold text-slate-400 leading-none mt-0.5">{k.sub}</span>}
                </button>
              ))}
            </div>

            {/* Main Action Call / Hangup Button */}
            <div className="w-full pt-1 flex items-center justify-center gap-3">
              {callState === 'idle' ? (
                <button
                  onClick={handleStartCall}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/30 transition-all active:scale-98 cursor-pointer"
                >
                  <PhoneCall className="w-5 h-5" />
                  Gọi Thoại WebRTC
                </button>
              ) : (
                <button
                  onClick={handleEndCall}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm shadow-rose-600/30 transition-all active:scale-98 cursor-pointer"
                >
                  <PhoneOff className="w-5 h-5" />
                  Kết Thúc Cuộc Gọi
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SIP Trunking Diagnostics Footprint */}
        <div className="w-full mt-4 p-3.5 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1.5 shadow-2xs">
          <div className="flex justify-between text-slate-500">
            <span>SIP Server:</span>
            <span className="font-mono font-bold text-slate-800">sip.vcomm.vn:5061 (TLS)</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Mã hóa:</span>
            <span className="font-bold text-emerald-700">SRTP / DTLS Active</span>
          </div>
          <div className="flex justify-between text-slate-500">
            <span>Đường truyền / Ping:</span>
            <span className="font-mono font-bold text-slate-800">12ms • Jitter 1.1ms</span>
          </div>
        </div>
      </div>

      {/* Call Logs & Recordings */}
      <div className="flex-1 bg-white p-6 flex flex-col justify-between">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                Lịch Sử Cuộc Gọi Tổng Đài (Call Detail Records)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Tự động đồng bộ file ghi âm cuộc gọi và phân tích sentiment từ OmiCall Cloud PBX.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => alert("Đã đồng bộ CDR mới nhất từ OmiCall API!")}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                Đồng bộ OmiCall API
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden overflow-x-auto min-w-0">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-5 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">Khách hàng</th>
                  <th className="px-5 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider text-center">Hướng gọi</th>
                  <th className="px-5 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider text-center">Trạng thái</th>
                  <th className="px-5 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider text-center">Thời lượng</th>
                  <th className="px-5 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider text-center">Ghi âm</th>
                  <th className="px-5 py-3.5 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider text-right">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {callLogs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="text-xs font-bold text-slate-900">{log.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">{log.caller}</p>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border",
                        log.type === 'inbound' ? "border-indigo-200 text-indigo-700 bg-indigo-50" : "border-purple-200 text-purple-700 bg-purple-50"
                      )}>
                        {log.type === 'inbound' ? 'GỌI VÀO' : 'GỌI RA'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider",
                        log.status === 'completed' ? "text-emerald-700 bg-emerald-50 border border-emerald-200" : "text-rose-700 bg-rose-50 border border-rose-200"
                      )}>
                        {log.status === 'completed' ? 'KẾT NỐI' : 'GỌI NHỠ'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center text-xs font-mono text-slate-700 font-bold">
                      {log.duration}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {log.hasAudio ? (
                        <button
                          onClick={() => alert(`Đang phát đoạn ghi âm cuộc gọi của ${log.name}...`)}
                          className="inline-flex p-1.5 bg-slate-100 text-slate-700 rounded-lg items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-colors cursor-pointer"
                          title="Nghe file ghi âm"
                        >
                          <Headphones className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <span className="text-xs text-slate-500 font-medium">{log.time}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footnote */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Tổng số cuộc gọi ghi nhận: <strong>{callLogs.length} cuộc</strong></span>
          <span className="text-[11px] text-slate-400">Tuân thủ Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân</span>
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
 <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center gap-4">
 <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
 <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
 </div>
 <div>
 <p className="text-2xl font-black text-slate-900">12</p>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đang Online</p>
 </div>
 </div>
 <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center gap-4">
 <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
 <PhoneCall className="w-5 h-5" />
 </div>
 <div>
 <p className="text-2xl font-black text-slate-900">4</p>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đang nghe máy</p>
 </div>
 </div>
 <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm flex items-center gap-4">
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
 <div className="bg-white rounded-xl shadow-sm border border-slate-300 overflow-hidden overflow-x-auto min-w-0">
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
 <button className="p-2 text-slate-500 hover:text-orange-700 transition-colors">
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
 <button className="p-2 text-slate-500 hover:text-orange-700 transition-colors">
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
 
 <div className="bg-primary-600 p-5 rounded-xl text-[#FAF9F5] shadow-sm shadow-indigo-600/20 relative overflow-hidden">
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
 <div className="bg-white rounded-xl p-6 border border-slate-300 shadow-sm flex flex-col">
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-[#EAE7DF] rounded-xl flex items-center justify-center text-orange-700">
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
 
 <button className="w-full py-2.5 border-2 border-dashed border-slate-400 rounded-lg text-slate-700 font-bold text-sm hover:border-slate-900 hover:text-orange-700 transition-all flex justify-center items-center gap-2">
 <Plus className="w-4 h-4" /> Thêm Fanpage mới
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
 <div className="bg-white rounded-xl p-6 border border-slate-300 shadow-sm flex flex-col lg:col-span-2">
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
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
 <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl text-[11px] font-mono overflow-x-auto min-w-0">
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
 {selectedTicket.status === 'open' ? 'MỚI' : 'ĐANG XỬ LÝ'}
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
 className="w-full h-32 border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600 focus:border-transparent transition-all resize-none bg-slate-50"
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
 </motion.div>
 </div>
 )}
 </AnimatePresence>

  {/* Zalo ZNS Sentinel Success Floating Toast */}
  {znsToast && znsToast.show && (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-950 border border-blue-500/50 text-[#FAF9F5] rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shrink-0 shadow">
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
