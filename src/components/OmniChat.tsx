import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Hash, 
  Users, 
  User, 
  PhoneCall, 
  Video, 
  Search, 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical, 
  Pin, 
  Sparkles, 
  CheckCheck, 
  Clock, 
  ExternalLink, 
  Bot, 
  Plus, 
  X, 
  ChevronRight, 
  CheckSquare, 
  ShieldCheck, 
  FileText, 
  ArrowLeft,
  Calendar,
  Layers,
  AtSign,
  Phone,
  Mail,
  Building2,
  Share2,
  Headphones,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAiChatResponse } from '../services/geminiService';

interface WorkplaceChannel {
  id: string;
  name: string;
  topic: string;
  category: 'department' | 'project' | 'general';
  memberCount: number;
  unreadCount: number;
  lastMessage: string;
  lastTime: string;
  isPrivate?: boolean;
}

interface WorkplaceDirectMember {
  id: string;
  name: string;
  avatar: string;
  position: string;
  department: string;
  email: string;
  internalExt: string;
  status: 'online' | 'busy' | 'offline';
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  isAiBot?: boolean;
}

interface InternalChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  text: string;
  timestamp: string;
  isMe?: boolean;
  isAi?: boolean;
  isPinned?: boolean;
  reactions?: { emoji: string; count: number; users: string[] }[];
  attachment?: {
    type: 'pdf' | 'excel' | 'image' | 'link';
    name: string;
    size?: string;
    url?: string;
  };
  embeddedEntity?: {
    type: 'request' | 'doc' | 'task';
    id: string;
    title: string;
    status: string;
    url: string;
  };
}

const INITIAL_CHANNELS: WorkplaceChannel[] = [
  { id: 'C1', name: 'chung-toan-cong-ty', topic: 'Thông báo chính thức & tin tức nội bộ CBNV VComm', category: 'general', memberCount: 145, unreadCount: 0, lastMessage: 'Kế toán đã phát hành phiếu lương kỳ T03/2026', lastTime: '14:20' },
  { id: 'C2', name: 'khoi-van-hanh-erp', topic: 'Kỹ thuật hệ thống, điều phối phân hệ ERP & Core API', category: 'department', memberCount: 18, unreadCount: 3, lastMessage: 'Cổng Gateway 5000 đã cập nhật chuẩn endpoint v1/api', lastTime: '15:10' },
  { id: 'C3', name: 'phong-kinh-doanh-sales', topic: 'Chiến dịch bán hàng, KPI doanh số chuỗi O2O', category: 'department', memberCount: 24, unreadCount: 0, lastMessage: 'Doanh số Flash Sale hôm nay vượt 120% kế hoạch', lastTime: '11:45' },
  { id: 'C4', name: 'phong-ke-toan-tai-chinh', topic: 'Đối soát hóa đơn điện tử, tạm ứng, thanh toán', category: 'department', memberCount: 8, unreadCount: 1, lastMessage: 'Các bạn nộp chứng từ hoàn ứng trước ngày 28 nhé', lastTime: '09:30' },
  { id: 'C5', name: 'du-an-sieu-thi-vcomm', topic: 'Mặt bằng, thiết bị POS & nhượng quyền siêu thị O2O', category: 'project', memberCount: 15, unreadCount: 0, lastMessage: 'Điểm bán Quận 7 đã nghiệm thu bàn giao thiết bị', lastTime: 'Hôm qua' },
  { id: 'C6', name: 'ban-lanh-dao-executive', topic: 'Kênh kín Ban Giám Đốc & Giám đốc Khối', category: 'general', memberCount: 6, unreadCount: 0, lastMessage: 'Cuộc họp giao ban tuần bắt đầu lúc 09:00 sáng mai', lastTime: 'Hôm qua', isPrivate: true }
];

const INITIAL_DIRECT_MEMBERS: WorkplaceDirectMember[] = [
  { id: 'D1', name: 'Nguyễn Văn An', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80', position: 'Tổng Giám Đốc (CEO)', department: 'Ban Điều Hành', email: 'an.nguyen@vcomm.vn', internalExt: '#101', status: 'online', lastMessage: 'Báo cáo doanh thu tuần trước đã tổng hợp xong chưa?', lastTime: '15:05', unreadCount: 1 },
  { id: 'D2', name: 'Lê Hoàng Long', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80', position: 'Giám Đốc Công Nghệ (CTO)', department: 'Khối Kỹ Thuật', email: 'long.le@vcomm.vn', internalExt: '#102', status: 'online', lastMessage: 'Mình vừa đẩy bản build mới của mini app Văn thư lên staging', lastTime: '14:48', unreadCount: 0 },
  { id: 'D3', name: 'Trần Thị Mai', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80', position: 'Giám Đốc Tài Chính (CFO)', department: 'Khối Tài Chính Kế Toán', email: 'mai.tran@vcomm.vn', internalExt: '#103', status: 'busy', lastMessage: 'Khoản chi phí thuê thiết bị tháng này cần duyệt bổ sung', lastTime: '13:15', unreadCount: 0 },
  { id: 'D4', name: 'Phạm Quỳnh Anh', avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80', position: 'Trưởng Phòng Nhân Sự (HRM)', department: 'Ban Nhân Lực', email: 'anh.pham@vcomm.vn', internalExt: '#104', status: 'online', lastMessage: 'Đơn xin nghỉ phép của Minh đã được HR duyệt rồi nhé', lastTime: '10:02', unreadCount: 0 },
  { id: 'D5', name: 'Đỗ Minh Trí', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80', position: 'Trưởng Nhóm Vận Hành', department: 'Khối Vận Hành', email: 'tri.do@vcomm.vn', internalExt: '#105', status: 'online', lastMessage: 'Lô hàng thiết bị kiểm kho PDA đã nhập vào kho trung tâm', lastTime: '08:30', unreadCount: 0 },
  { id: 'D6', name: 'VComm AI Copilot', avatar: '', position: 'Trợ Lý Ảo Doanh Nghiệp', department: 'Hệ Thống Trí Tuệ Nhân Tạo', email: 'ai.copilot@vcomm.vn', internalExt: '#AI', status: 'online', lastMessage: 'Em có thể giúp anh tóm tắt cuộc họp hoặc tra cứu quy định công ty!', lastTime: '08:00', unreadCount: 0, isAiBot: true }
];

const INITIAL_MESSAGES: InternalChatMessage[] = [
  {
    id: 'm1',
    conversationId: 'C2',
    senderId: 'D2',
    senderName: 'Lê Hoàng Long',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    senderRole: 'Giám Đốc Công Nghệ (CTO)',
    text: 'Thông báo cả team: Hệ thống VComm Core Backend đã chuẩn hóa toàn bộ routing sang prefix `/api/v1/` và cổng 5000. Mọi phân hệ O2O đều kết nối mượt mà.',
    timestamp: '14:30',
    isPinned: true,
    reactions: [{ emoji: '🚀', count: 5, users: ['Nguyễn Văn An', 'Đỗ Minh Trí'] }]
  },
  {
    id: 'm2',
    conversationId: 'C2',
    senderId: 'D5',
    senderName: 'Đỗ Minh Trí',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
    senderRole: 'Trưởng Nhóm Vận Hành',
    text: 'Đã test thử luân chuyển công văn và phê duyệt tờ trình tạm ứng, thời gian phản hồi API dưới 120ms rất nhanh.',
    timestamp: '14:45',
    reactions: [{ emoji: '👍', count: 3, users: ['Lê Hoàng Long'] }]
  },
  {
    id: 'm3',
    conversationId: 'C2',
    senderId: 'me',
    senderName: 'Tôi (Người dùng)',
    text: 'Mình vừa kiểm tra giao diện mới của mini app Văn thư và Phê duyệt, thiết kế Apple Glass rất trực quan và thoáng.',
    timestamp: '15:00',
    isMe: true
  },
  {
    id: 'm4',
    conversationId: 'C2',
    senderId: 'D2',
    senderName: 'Lê Hoàng Long',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
    senderRole: 'Giám Đốc Công Nghệ (CTO)',
    text: 'Tuyệt vời. Đính kèm đây là tài liệu kiến trúc e-Office mới để cả phòng đối chiếu nhé!',
    timestamp: '15:10',
    attachment: {
      type: 'pdf',
      name: 'KienTruc_HeThong_VComm_Workplace_2026.pdf',
      size: '2.4 MB'
    },
    embeddedEntity: {
      type: 'request',
      id: 'REQ-002',
      title: 'Tạm ứng công tác phí triển khai hạ tầng',
      status: 'Đã phê duyệt',
      url: '/requests'
    }
  },
  {
    id: 'dm1',
    conversationId: 'D1',
    senderId: 'D1',
    senderName: 'Nguyễn Văn An',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    senderRole: 'Tổng Giám Đốc (CEO)',
    text: 'Chào bạn, tờ trình mở rộng quầy bán hàng O2O của khối Vận hành tôi đã xem qua và rất đồng ý.',
    timestamp: '14:50'
  },
  {
    id: 'dm2',
    conversationId: 'D1',
    senderId: 'D1',
    senderName: 'Nguyễn Văn An',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    senderRole: 'Tổng Giám Đốc (CEO)',
    text: 'Báo cáo doanh thu tuần trước đã tổng hợp xong chưa? Nếu được gửi tôi file để chuẩn bị họp giao ban nhé.',
    timestamp: '15:05'
  },
  {
    id: 'ai1',
    conversationId: 'D6',
    senderId: 'D6',
    senderName: 'VComm AI Copilot',
    senderRole: 'Trợ Lý Ảo Doanh Nghiệp',
    text: 'Xin chào! Em là VComm AI Copilot. Em có thể hỗ trợ anh/chị:\n• Tra cứu quy định nội quy, chế độ phúc lợi, công tác phí\n• Tóm tắt nhanh nội dung thảo luận các kênh chat\n• Hỗ trợ soạn thảo thông báo nội bộ chuẩn mực\nAnh/chị cần em hỗ trợ gì hôm nay ạ?',
    timestamp: '08:00',
    isAi: true
  }
];

export interface CustomerThreadItem {
  id: string;
  name: string;
  phone: string;
  channel: 'zalo' | 'facebook' | 'vcomm' | 'web';
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  tier: 'Diamond' | 'Gold' | 'Silver' | 'Standard';
  totalSpent: number;
  orderCount: number;
  tags: string[];
}

const INITIAL_CUSTOMER_THREADS: CustomerThreadItem[] = [
  {
    id: 'CUST-01',
    name: 'Nguyễn Thị Mai Hương',
    phone: '0988123456',
    channel: 'zalo',
    lastMessage: 'Shop ơi đơn #ORD-9921 bên GHN đã lấy hàng chưa ạ?',
    lastTime: '15:12',
    unreadCount: 2,
    tier: 'Gold',
    totalSpent: 18500000,
    orderCount: 12,
    tags: ['Khách thân thiết', 'Tra cứu đơn']
  },
  {
    id: 'CUST-02',
    name: 'Hoàng Anh Tuấn',
    phone: '0912348899',
    channel: 'facebook',
    lastMessage: 'Mình muốn đặt 5 combo áo thun oversize màu be size L',
    lastTime: '14:45',
    unreadCount: 0,
    tier: 'Silver',
    totalSpent: 4200000,
    orderCount: 3,
    tags: ['Mua sỉ', 'Fanpage']
  },
  {
    id: 'CUST-03',
    name: 'Vũ Đức Thịnh',
    phone: '0903332211',
    channel: 'web',
    lastMessage: 'Máy POS Sunmi bên mình có bảo hành tận nơi không shop?',
    lastTime: '11:20',
    unreadCount: 1,
    tier: 'Diamond',
    totalSpent: 85000000,
    orderCount: 24,
    tags: ['Khách B2B', 'Thiết bị POS']
  }
];

export function OmniChat() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [chatScope, setChatScope] = useState<'workplace' | 'cskh'>('cskh');
  const [activeType, setActiveType] = useState<'channel' | 'direct'>('channel');
  const [activeId, setActiveId] = useState<string>('CUST-01');
  const [customerThreads, setCustomerThreads] = useState<CustomerThreadItem[]>(INITIAL_CUSTOMER_THREADS);
  const [channels, setChannels] = useState<WorkplaceChannel[]>(INITIAL_CHANNELS);
  const [directMembers, setDirectMembers] = useState<WorkplaceDirectMember[]>(INITIAL_DIRECT_MEMBERS);
  const [messages, setMessages] = useState<InternalChatMessage[]>([
    ...INITIAL_MESSAGES,
    {
      id: 'cust-m1',
      conversationId: 'CUST-01',
      senderId: 'cust-01',
      senderName: 'Nguyễn Thị Mai Hương',
      text: 'Shop ơi đơn #ORD-9921 bên GHN đã lấy hàng chưa ạ?',
      timestamp: '15:10'
    },
    {
      id: 'cust-m2',
      conversationId: 'CUST-01',
      senderId: 'user',
      senderName: 'Nhân viên CSKH VComm',
      text: 'Chào chị Hương, em kiểm tra đơn hàng #ORD-9921 của chị đã bàn giao cho bưu tá GHN lúc 14:00, dự kiến giao vào ngày mai chị nhé!',
      timestamp: '15:12',
      isMe: true
    },
    {
      id: 'cust-m3',
      conversationId: 'CUST-02',
      senderId: 'cust-02',
      senderName: 'Hoàng Anh Tuấn',
      text: 'Mình muốn đặt 5 combo áo thun oversize màu be size L, shop có chính sách chiết khấu mua sỉ không?',
      timestamp: '14:45'
    },
    {
      id: 'cust-m4',
      conversationId: 'CUST-03',
      senderId: 'cust-03',
      senderName: 'Vũ Đức Thịnh',
      text: 'Máy POS Sunmi bên mình có tích hợp sẵn phần mềm in hóa đơn điện tử và bảo hành tận nơi không shop?',
      timestamp: '11:20'
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [showRightDrawer, setShowRightDrawer] = useState(true);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [myStatus, setMyStatus] = useState<'online' | 'busy' | 'meeting'>('online');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const activeChannel = channels.find(c => c.id === activeId);
  const activeDirect = directMembers.find(d => d.id === activeId);
  const activeCustomer = customerThreads.find(ct => ct.id === activeId);
  const conversationMessages = messages.filter(m => m.conversationId === activeId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeId]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const currentText = inputValue;
    const newMsg: InternalChatMessage = {
      id: `msg-${Date.now()}`,
      conversationId: activeId,
      senderId: 'me',
      senderName: user?.name || 'Tôi (Người dùng)',
      senderRole: 'Chuyên Viên Vận Hành',
      text: currentText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    setMessages(prev => [...prev, newMsg]);
    setInputValue('');

    if (activeId === 'D6') {
      setIsAiReplying(true);
      try {
        const history = conversationMessages.map(m => ({
          role: m.isMe ? ('user' as const) : ('model' as const),
          content: m.text
        }));
        
        const prompt = `Bạn là Trợ lý AI Nội Bộ của Tập đoàn VComm (VComm Workplace Copilot). Người dùng là nhân viên nội bộ hỏi: "${currentText}". Hãy trả lời ngắn gọn, thân thiện, chuyên nghiệp, hỗ trợ công việc văn phòng doanh nghiệp (Tiếng Việt).`;
        const aiResponse = await getAiChatResponse(prompt, history);

        const aiReplyMsg: InternalChatMessage = {
          id: `msg-ai-${Date.now()}`,
          conversationId: 'D6',
          senderId: 'D6',
          senderName: 'VComm AI Copilot',
          senderRole: 'Trợ Lý Ảo Doanh Nghiệp',
          text: aiResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true
        };
        setMessages(prev => [...prev, aiReplyMsg]);
      } catch {
        const fallbackMsg: InternalChatMessage = {
          id: `msg-ai-${Date.now()}`,
          conversationId: 'D6',
          senderId: 'D6',
          senderName: 'VComm AI Copilot',
          senderRole: 'Trợ Lý Ảo Doanh Nghiệp',
          text: 'Dạ em đã ghi nhận thông tin của anh/chị. Em sẵn sàng hỗ trợ giải đáp các quy định và kết nối tới các bộ phận liên quan!',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isAi: true
        };
        setMessages(prev => [...prev, fallbackMsg]);
      } finally {
        setIsAiReplying(false);
      }
    }
  };

  const handleCreateTaskFromMessage = (msg: InternalChatMessage) => {
    showToast(`Đã chuyển tin nhắn "${msg.text.slice(0, 30)}..." thành Công việc tại Bàn làm việc (/workspace)`);
  };

  const handleAddReaction = (msgId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id !== msgId) return m;
      const reactions = m.reactions ? [...m.reactions] : [];
      const existing = reactions.find(r => r.emoji === emoji);
      if (existing) {
        existing.count += 1;
      } else {
        reactions.push({ emoji, count: 1, users: ['Tôi'] });
      }
      return { ...m, reactions };
    }));
  };

  return (
    <div className="h-full flex flex-col gap-2 animate-in fade-in duration-300 font-sans overflow-hidden">
      {toastMessage && (
        <div className="fixed top-4 right-5 z-50 bg-slate-900/95 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3 backdrop-blur-md">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sleek Compact Apple Glass Mini App Header */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-1.5 sm:py-2 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold border border-slate-200">
            <button
              onClick={() => {
                setChatScope('cskh');
                setActiveId('CUST-01');
              }}
              className={cn(
                "px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                chatScope === 'cskh' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Headphones className="w-3.5 h-3.5 text-blue-600" />
              <span>CSKH Đa Kênh</span>
            </button>
            <button
              onClick={() => {
                setChatScope('workplace');
                setActiveId('C2');
              }}
              className={cn(
                "px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                chatScope === 'workplace' ? "bg-white text-indigo-700 shadow-xs" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Workplace Nội Bộ</span>
            </button>
          </div>
          <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200 shrink-0">
            Bảo Mật RSA-256
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Status selector */}
          <div className="flex items-center gap-1.5 bg-slate-100/90 px-2.5 py-1 rounded-xl border border-slate-200/80 text-xs font-bold">
            <span className={cn(
              "w-2 h-2 rounded-full shrink-0",
              myStatus === 'online' ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.7)]" :
              myStatus === 'meeting' ? "bg-amber-500" : "bg-rose-500"
            )} />
            <select
              value={myStatus}
              onChange={(e) => setMyStatus(e.target.value as any)}
              className="bg-transparent border-none focus:outline-none cursor-pointer text-slate-700 text-xs font-bold pr-1"
            >
              <option value="online">Trực tuyến</option>
              <option value="meeting">Đang họp</option>
              <option value="busy">Bận</option>
            </select>
          </div>

          <button 
            onClick={() => navigate('/workspace')}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Mở Bàn làm việc"
          >
            <span>Bàn làm việc</span>
          </button>

          <button 
            onClick={() => window.open('https://meet.google.com/new', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            title="Khởi tạo họp trực tuyến Google Meet"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Huddle Meet</span>
          </button>
        </div>
      </div>

      {/* Main Workplace Chat Frame (Expanded Full Workspace) */}
      <div className="flex-1 min-h-0 flex bg-white/85 backdrop-blur-2xl rounded-2xl sm:rounded-3xl border border-white/80 shadow-xl overflow-hidden">
        {/* Left Sidebar: Channels & Direct Messages */}
        {showLeftSidebar && (
        <div className="w-[280px] sm:w-[300px] border-r border-slate-200/80 flex flex-col bg-slate-50/70 backdrop-blur-xl shrink-0 h-full overflow-hidden">
          <div className="p-3.5 border-b border-slate-200/80">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input 
                type="text"
                placeholder="Tìm kênh, đồng nghiệp, tệp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-2xs"
              />
            </div>
          </div>

          {chatScope === 'cskh' ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Hội thoại khách hàng</span>
                <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                  {customerThreads.length} khách
                </span>
              </div>
              {customerThreads
                .filter(t => !searchQuery || t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.phone.includes(searchQuery))
                .map(thread => (
                  <button
                    key={thread.id}
                    onClick={() => setActiveId(thread.id)}
                    className={cn(
                      "w-full p-3 rounded-2xl flex items-start gap-3 text-left transition-all cursor-pointer group border",
                      activeId === thread.id
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-indigo-500/20 border-transparent"
                        : "hover:bg-slate-100/80 bg-white/70 border-slate-100 text-slate-800"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs",
                        activeId === thread.id ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
                      )}>
                        {thread.name[0]}
                      </div>
                      <span className={cn(
                        "absolute -bottom-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-white",
                        thread.channel === 'zalo' ? "bg-blue-500" :
                        thread.channel === 'facebook' ? "bg-indigo-700" :
                        thread.channel === 'vcomm' ? "bg-orange-500" : "bg-emerald-500"
                      )}>
                        {thread.channel === 'zalo' ? 'Z' : thread.channel === 'facebook' ? 'f' : thread.channel === 'vcomm' ? 'V' : 'W'}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-black truncate leading-tight">{thread.name}</p>
                        <span className={cn("text-[9px] font-mono", activeId === thread.id ? "text-indigo-100" : "text-slate-400")}>{thread.lastTime}</span>
                      </div>
                      <p className={cn(
                        "text-[11px] truncate mt-0.5",
                        activeId === thread.id ? "text-indigo-100" : "text-slate-500"
                      )}>
                        {thread.lastMessage}
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <span className={cn(
                          "text-[9px] font-bold px-1.5 py-0.2 rounded",
                          activeId === thread.id ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                        )}>
                          {thread.phone}
                        </span>
                        {thread.unreadCount > 0 && (
                          <span className="ml-auto w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                            {thread.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          ) : (
            <>
              <div className="flex p-1.5 mx-3 mt-2 bg-slate-200/70 rounded-2xl text-xs font-bold">
                <button
                  onClick={() => setActiveType('channel')}
                  className={cn(
                    "flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    activeType === 'channel' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <Hash className="w-3.5 h-3.5" />
                  <span>Kênh Nhóm</span>
                </button>
                <button
                  onClick={() => setActiveType('direct')}
                  className={cn(
                    "flex-1 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                    activeType === 'direct' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Đồng Nghiệp</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-1">
                {activeType === 'channel' ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-2 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <span>Kênh phòng ban & dự án</span>
                      <button 
                        onClick={() => showToast('Mở trình tạo kênh chat nhóm mới')}
                        className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-600 transition-colors cursor-pointer" 
                        title="Tạo kênh mới"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {channels
                      .filter(c => !searchQuery || c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(channel => (
                        <button
                          key={channel.id}
                          onClick={() => setActiveId(channel.id)}
                          className={cn(
                            "w-full px-3 py-2.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group",
                            activeId === channel.id
                              ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-500/20"
                              : "hover:bg-slate-100/80 text-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={cn(
                              "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 font-bold",
                              activeId === channel.id ? "bg-white/20 text-white" : "bg-slate-200/70 text-slate-600 group-hover:bg-slate-300/60"
                            )}>
                              <Hash className="w-3.5 h-3.5" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate leading-tight">#{channel.name}</p>
                              <p className={cn(
                                "text-[10px] truncate mt-0.5",
                                activeId === channel.id ? "text-indigo-100" : "text-slate-400"
                              )}>
                                {channel.lastMessage}
                              </p>
                            </div>
                          </div>
                          {channel.unreadCount > 0 && (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0",
                              activeId === channel.id ? "bg-white text-indigo-600" : "bg-rose-500 text-white"
                            )}>
                              {channel.unreadCount}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="px-2 py-1 text-[11px] font-black uppercase tracking-wider text-slate-400">
                      <span>Trò chuyện trực tiếp (1:1)</span>
                    </div>
                    {directMembers
                      .filter(d => !searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(member => (
                        <button
                          key={member.id}
                          onClick={() => setActiveId(member.id)}
                          className={cn(
                            "w-full px-3 py-2.5 rounded-2xl flex items-center justify-between text-left transition-all cursor-pointer group",
                            activeId === member.id
                              ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md shadow-indigo-500/20"
                              : "hover:bg-slate-100/80 text-slate-700"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative shrink-0">
                              {member.isAiBot ? (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                                  <Bot className="w-4 h-4" />
                                </div>
                              ) : member.avatar ? (
                                <img src={member.avatar} alt={member.name} className="w-8 h-8 rounded-full object-cover border border-white shadow-xs" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-600">
                                  {member.name[0]}
                                </div>
                              )}
                              <span className={cn(
                                "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
                                member.status === 'online' ? "bg-emerald-500" :
                                member.status === 'busy' ? "bg-amber-500" : "bg-slate-400"
                              )} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate leading-tight">{member.name}</p>
                              <p className={cn(
                                "text-[10px] truncate mt-0.5",
                                activeId === member.id ? "text-indigo-100" : "text-slate-400"
                              )}>
                                {member.position}
                              </p>
                            </div>
                          </div>
                          {member.unreadCount > 0 && (
                            <span className={cn(
                              "px-1.5 py-0.5 rounded-full text-[10px] font-black shrink-0",
                              activeId === member.id ? "bg-white text-indigo-600" : "bg-rose-500 text-white"
                            )}>
                              {member.unreadCount}
                            </span>
                          )}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
        )}

        {/* Center: Active Chat Stream */}
        <div className="flex-1 flex flex-col bg-slate-50/30 min-w-0 h-full overflow-hidden">
          {/* Chat Stream Header */}
          <div className="px-4 py-2 sm:py-2.5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button 
                onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                title={showLeftSidebar ? "Thu gọn danh sách kênh" : "Mở rộng danh sách kênh"}
              >
                {showLeftSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
              </button>
              {activeCustomer ? (
                <>
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      {activeCustomer.name[0]}
                    </div>
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full text-[8px] font-bold text-white flex items-center justify-center border border-white",
                      activeCustomer.channel === 'zalo' ? "bg-blue-500" :
                      activeCustomer.channel === 'facebook' ? "bg-indigo-600" : "bg-orange-500"
                    )}>
                      {activeCustomer.channel[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 truncate">
                      {activeCustomer.name}
                      <span className="text-[9px] bg-amber-50 text-amber-700 font-bold px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                        {activeCustomer.tier} VIP
                      </span>
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">
                      SĐT: {activeCustomer.phone} • Chi tiêu: {formatCurrency(activeCustomer.totalSpent)} ({activeCustomer.orderCount} đơn)
                    </p>
                  </div>
                </>
              ) : activeChannel ? (
                <>
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold shadow-2xs shrink-0">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 truncate">
                      #{activeChannel.name}
                      {activeChannel.isPrivate && (
                        <span className="text-[9px] bg-rose-50 text-rose-700 font-bold px-1.5 py-0.5 rounded border border-rose-200 shrink-0">Kín</span>
                      )}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium line-clamp-1 truncate">{activeChannel.topic}</p>
                  </div>
                </>
              ) : activeDirect ? (
                <>
                  <div className="relative shrink-0">
                    {activeDirect.isAiBot ? (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md">
                        <Bot className="w-4 h-4" />
                      </div>
                    ) : (
                      <img src={activeDirect.avatar} alt="" className="w-8 h-8 rounded-xl object-cover border border-slate-200 shadow-2xs" />
                    )}
                    <span className={cn(
                      "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
                      activeDirect.status === 'online' ? "bg-emerald-500" :
                      activeDirect.status === 'busy' ? "bg-amber-500" : "bg-slate-400"
                    )} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 truncate">
                      {activeDirect.name}
                      <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded shrink-0">
                        {activeDirect.department}
                      </span>
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium truncate">{activeDirect.position} • Máy lẻ: {activeDirect.internalExt}</p>
                  </div>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => window.open('https://meet.google.com/new', '_blank')}
                className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer" 
                title="Gọi video Google Meet"
              >
                <Video className="w-4 h-4" />
              </button>
              <button 
                onClick={() => showToast('Đã sao chép liên kết cuộc trò chuyện')}
                className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer" 
                title="Chia sẻ liên kết"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <div className="h-5 w-[1px] bg-slate-200 mx-1" />
              <button 
                onClick={() => setShowRightDrawer(!showRightDrawer)}
                className={cn(
                  "p-2 rounded-xl transition-all cursor-pointer",
                  showRightDrawer ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-100"
                )} 
                title="Chi tiết thông tin kênh/nhân sự"
              >
                <Users className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pinned Message Banner (If Any) */}
          {conversationMessages.some(m => m.isPinned) && (
            <div className="px-5 py-2 bg-amber-50/80 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-900 font-medium">
              <div className="flex items-center gap-2 truncate">
                <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0 rotate-45" />
                <span className="font-bold">Tin ghim:</span>
                <span className="truncate">{conversationMessages.find(m => m.isPinned)?.text}</span>
              </div>
              <span className="text-[10px] text-amber-700 shrink-0 font-bold ml-2">Đính kèm thông báo</span>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5" ref={scrollRef}>
            {conversationMessages.map((msg) => (
              <div 
                key={msg.id}
                className={cn(
                  "flex items-start gap-3 group animate-in fade-in duration-200",
                  msg.isMe ? "flex-row-reverse" : "flex-row"
                )}
              >
                {/* Avatar */}
                <div className="shrink-0 mt-0.5">
                  {msg.isMe ? (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                      {user?.name ? user.name[0] : 'U'}
                    </div>
                  ) : msg.isAi ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  ) : msg.senderAvatar ? (
                    <img src={msg.senderAvatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-xs" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center text-xs">
                      {msg.senderName[0]}
                    </div>
                  )}
                </div>

                {/* Message Bubble & Metadata */}
                <div className={cn(
                  "max-w-[75%] space-y-1.5",
                  msg.isMe ? "items-end flex flex-col" : "items-start flex flex-col"
                )}>
                  {/* Sender Name & Role */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="font-bold text-slate-800">{msg.senderName}</span>
                    {msg.senderRole && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-600 font-semibold">
                        {msg.senderRole}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                  </div>

                  {/* Main Bubble */}
                  <div className={cn(
                    "p-3.5 rounded-2xl text-xs font-medium shadow-xs leading-relaxed whitespace-pre-line",
                    msg.isMe 
                      ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-tr-xs"
                      : msg.isAi
                      ? "bg-white text-slate-900 border border-purple-200/80 shadow-md shadow-purple-500/5 rounded-tl-xs"
                      : "bg-white text-slate-900 border border-slate-200/80 rounded-tl-xs"
                  )}>
                    {msg.text}

                    {/* Attachment Preview (if any) */}
                    {msg.attachment && (
                      <div className="mt-3 p-2.5 rounded-xl bg-black/5 border border-black/10 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                          <div className="truncate">
                            <p className="font-bold truncate">{msg.attachment.name}</p>
                            <p className="text-[10px] opacity-75">{msg.attachment.size}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => showToast(`Đang tải tệp ${msg.attachment?.name}...`)}
                          className="px-2.5 py-1 rounded-lg bg-white text-slate-800 font-bold text-[10px] hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                        >
                          Tải xuống
                        </button>
                      </div>
                    )}

                    {/* Embedded Internal Entity (e.g. Request or Doc) */}
                    {msg.embeddedEntity && (
                      <div className="mt-3 p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-400/30 flex items-center justify-between gap-3 text-xs">
                        <div className="truncate">
                          <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                            <CheckSquare className="w-3 h-3" /> Tờ trình nội bộ liên kết
                          </div>
                          <p className="font-bold truncate text-slate-900">{msg.embeddedEntity.title}</p>
                          <span className="text-[10px] font-semibold text-emerald-600">{msg.embeddedEntity.status}</span>
                        </div>
                        <button 
                          onClick={() => navigate(msg.embeddedEntity!.url)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] hover:bg-indigo-700 transition-colors shrink-0 cursor-pointer"
                        >
                          Xem phiếu
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Actions & Reactions Row */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleAddReaction(msg.id, '👍')}
                      className="text-[11px] hover:bg-slate-200 px-1.5 py-0.5 rounded-md text-slate-600 transition-colors"
                      title="Thích"
                    >
                      👍
                    </button>
                    <button 
                      onClick={() => handleAddReaction(msg.id, '🚀')}
                      className="text-[11px] hover:bg-slate-200 px-1.5 py-0.5 rounded-md text-slate-600 transition-colors"
                      title="Hoan nghênh"
                    >
                      🚀
                    </button>
                    <button 
                      onClick={() => handleAddReaction(msg.id, '❤️')}
                      className="text-[11px] hover:bg-slate-200 px-1.5 py-0.5 rounded-md text-slate-600 transition-colors"
                      title="Yêu thích"
                    >
                      ❤️
                    </button>
                    <button 
                      onClick={() => handleCreateTaskFromMessage(msg)}
                      className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Tạo task từ tin nhắn này"
                    >
                      <CheckSquare className="w-3 h-3" /> Tạo việc
                    </button>
                  </div>

                  {/* Reactions Display */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="flex items-center gap-1 mt-0.5">
                      {msg.reactions.map((r, rIdx) => (
                        <span key={rIdx} className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center gap-1 shadow-2xs">
                          <span>{r.emoji}</span>
                          <span>{r.count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isAiReplying && (
              <div className="flex items-center gap-3 animate-in fade-in">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs animate-pulse">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-white border border-purple-200/80 p-3 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-2">
                  <span className="text-xs text-purple-700 font-bold">VComm AI Copilot đang soạn câu trả lời</span>
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 bg-white/90 backdrop-blur-md border-t border-slate-200/80">
            {chatScope === 'cskh' && (
              <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" /> Gợi ý AI:
                </span>
                {[
                  'Dạ đơn #ORD-9921 đã bàn giao cho GHN, dự kiến giao vào ngày mai ạ!',
                  'Dạ bên em còn sẵn áo thun oversize màu be và có chiết khấu sỉ 15% ạ.',
                  'Dạ máy POS Sunmi bên em bảo hành chính hãng 12 tháng tận nơi ạ!'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setInputValue(chip)}
                    className="px-2.5 py-1 rounded-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-medium border border-indigo-200 shrink-0 transition-colors cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => showToast('Mở trình đính kèm tệp tài liệu')}
                className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-colors cursor-pointer"
                title="Đính kèm tệp"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              
              <div className="flex-1 relative">
                <input 
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    activeCustomer
                      ? `Nhập câu trả lời khách hàng ${activeCustomer.name}...`
                      : activeChannel 
                        ? `Nhập tin nhắn gửi tới #${activeChannel.name}...` 
                        : `Nhắn tin cho đồng nghiệp ${activeDirect?.name}...`
                  }
                  className="w-full bg-slate-100/80 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-2xs"
                />
              </div>

              <button 
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className="p-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white font-bold transition-all shadow-md shadow-indigo-500/25 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                title="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            
            <div className="mt-2 flex items-center justify-between px-1 text-[10px] text-slate-400 font-medium">
              <span>Nhấn <kbd className="px-1 py-0.5 rounded bg-slate-200 text-slate-700 font-mono">Enter</kbd> để gửi tin nhắn</span>
              <span className="flex items-center gap-1 text-slate-500">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Hệ thống bảo mật mã hóa SSL/TLS 256-bit
              </span>
            </div>
          </div>
        </div>

        {/* Right Drawer: Customer 360 / Channel Info / Staff Business Card */}
        {showRightDrawer && (
          <div className="w-[280px] border-l border-slate-200/80 bg-white/70 backdrop-blur-xl flex flex-col p-5 space-y-5 overflow-y-auto shrink-0 animate-in slide-in-from-right-5 duration-200">
            {activeCustomer ? (
              <>
                <div className="text-center space-y-2 pb-4 border-b border-slate-200/80">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-black mx-auto shadow-md shadow-blue-500/20 text-xl">
                    {activeCustomer.name[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{activeCustomer.name}</h3>
                    <p className="text-[11px] text-indigo-600 font-bold">Hạng: {activeCustomer.tier} VIP</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hồ Sơ Khách Hàng 360</p>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <span className="font-bold text-slate-900">{activeCustomer.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Kênh mua sắm:</span>
                      <span className="font-bold text-slate-900 uppercase">{activeCustomer.channel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tổng chi tiêu:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(activeCustomer.totalSpent)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Số đơn hoàn thành:</span>
                      <span className="font-bold text-slate-900">{activeCustomer.orderCount} đơn</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Thẻ Phân Loại (Tags)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activeCustomer.tags.map((tag, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <button 
                    onClick={() => navigate('/customers')}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <span>Xem Hồ Sơ CRM Đầy Đủ</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : activeChannel ? (
              <>
                <div className="text-center space-y-2 pb-4 border-b border-slate-200/80">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-600 text-white flex items-center justify-center font-black mx-auto shadow-md shadow-indigo-500/20">
                    <Hash className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">#{activeChannel.name}</h3>
                    <p className="text-[11px] text-slate-500">{activeChannel.memberCount} thành viên tham gia</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mô tả kênh</p>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                    {activeChannel.topic}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Tài liệu đã chia sẻ</p>
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate font-semibold text-slate-800">KienTruc_ERP_2026.pdf</span>
                      </div>
                      <span className="text-[10px] text-slate-400">2.4MB</span>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 hover:bg-slate-100 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate font-semibold text-slate-800">KeHoach_TrienKhai.xlsx</span>
                      </div>
                      <span className="text-[10px] text-slate-400">840KB</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80">
                  <button 
                    onClick={() => navigate('/workspace')}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Xem việc tại Bàn làm việc</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </>
            ) : activeDirect ? (
              <>
                <div className="text-center space-y-2 pb-4 border-b border-slate-200/80">
                  {activeDirect.isAiBot ? (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-black mx-auto shadow-md">
                      <Bot className="w-8 h-8" />
                    </div>
                  ) : (
                    <img src={activeDirect.avatar} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md mx-auto" />
                  )}
                  <div>
                    <h3 className="font-black text-sm text-slate-900">{activeDirect.name}</h3>
                    <p className="text-[11px] text-indigo-600 font-bold">{activeDirect.position}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{activeDirect.department}</p>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Danh thiếp nội bộ</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-semibold">{activeDirect.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold">Máy lẻ: {activeDirect.internalExt}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate font-semibold">{activeDirect.department}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 space-y-2">
                  <button 
                    onClick={() => navigate('/employees')}
                    className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Xem Hồ sơ Cán bộ</span>
                  </button>
                  <button 
                    onClick={() => window.open('https://meet.google.com/new', '_blank')}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Họp 1:1 trực tuyến</span>
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
