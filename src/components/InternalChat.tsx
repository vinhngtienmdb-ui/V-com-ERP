import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Users, 
  Hash, 
  Send, 
  Paperclip, 
  Smile, 
  Sparkles, 
  Plus, 
  Search, 
  X, 
  UserCircle,
  FileText,
  Image as ImageIcon,
  Check,
  CheckCheck
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotifications } from '../context/NotificationContext';
import { MOCK_MEMBERS } from '../types/task';
import { getAiChatResponse } from '../services/geminiService';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
  isAi?: boolean;
  reactions?: { emoji: string; count: number; users: string[] }[];
  attachment?: { name: string; type: 'file' | 'image'; size: string };
}

interface ChatChannel {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'department';
  desc?: string;
  unreadCount: number;
  avatarText?: string;
  status?: 'online' | 'offline';
  role?: string;
}

const INITIAL_CHANNELS: ChatChannel[] = [
  // Departments
  { id: 'ch-dept-1', name: 'Phòng Công nghệ', type: 'department', desc: 'Kênh trao đổi kỹ thuật & hạ tầng ERP', unreadCount: 0, avatarText: 'CN' },
  { id: 'ch-dept-2', name: 'Phòng Marketing', type: 'department', desc: 'Kế hoạch truyền thông & quảng cáo', unreadCount: 2, avatarText: 'MK' },
  { id: 'ch-dept-3', name: 'Vận hành Sàn', type: 'department', desc: 'Theo dõi đơn hàng & đối soát', unreadCount: 0, avatarText: 'VH' },
  { id: 'ch-dept-4', name: 'Ban Giám đốc', type: 'department', desc: 'Thông tin chỉ đạo trực tiếp', unreadCount: 0, avatarText: 'BGĐ' },
  
  // Groups
  { id: 'ch-group-1', name: 'Dự án eOffice', type: 'group', desc: 'Nhóm phát triển không gian làm việc số', unreadCount: 1, avatarText: 'EO' },
  { id: 'ch-group-2', name: 'Chiến dịch 6/6', type: 'group', desc: 'Nhóm đồng bộ bán hàng & Livestream', unreadCount: 0, avatarText: '66' },

  // Direct Messages (Colleagues)
  { id: 'ch-dm-1', name: 'Lê Hoàng Minh', type: 'direct', unreadCount: 0, status: 'online', role: 'Vận hành Sàn' },
  { id: 'ch-dm-2', name: 'Nguyễn Diệu Nhi', type: 'direct', unreadCount: 3, status: 'online', role: 'Trưởng nhóm Marketing' },
  { id: 'ch-dm-3', name: 'Trần Văn B', type: 'direct', unreadCount: 0, status: 'offline', role: 'Phó phòng Kho vận' }
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  'ch-dept-1': [
    { id: 'msg-1', senderId: 'm-2', senderName: 'Lê Hoàng Minh', senderRole: 'Vận hành Sàn', text: 'Chào mọi người, anh Vinh vừa commit code Settings Enterprise lên nhánh main rồi nhé.', timestamp: '09:30 AM', isSelf: false },
    { id: 'msg-2', senderId: 'm-3', senderName: 'Trần Văn B', senderRole: 'Phó phòng Kho vận', text: 'Tuyệt vời, để em pull về test thử module Kho xem có ổn định không.', timestamp: '09:32 AM', isSelf: false },
    { id: 'msg-3', senderId: 'self', senderName: 'Bạn (Vinh NT)', senderRole: 'Trưởng phòng Công nghệ', text: 'Đã hoàn thành xong 70 test cases, hệ thống chạy mượt mà. Mọi người pull code test nhé.', timestamp: '09:35 AM', isSelf: true }
  ],
  'ch-dm-2': [
    { id: 'msg-dm-1', senderId: 'm-4', senderName: 'Nguyễn Diệu Nhi', senderRole: 'Trưởng nhóm Marketing', text: 'Anh Vinh ơi, anh xem giúp em bảng đề xuất ngân sách TikTok Ads em gửi qua email nhé.', timestamp: 'Hôm qua', isSelf: false },
    { id: 'msg-dm-2', senderId: 'm-4', senderName: 'Nguyễn Diệu Nhi', senderRole: 'Trưởng nhóm Marketing', text: 'Em có gửi kèm file PDF tóm tắt chi phí dự kiến ở dưới.', timestamp: 'Hôm qua', isSelf: false, attachment: { name: 'De_xuat_TikTok_Ads_Q2.pdf', type: 'file', size: '1.2 MB' } }
  ]
};

export function InternalChat() {
  const { addNotification } = useNotifications();
  
  // Channels and messages states
  const [channels, setChannels] = useState<ChatChannel[]>(() => {
    const saved = localStorage.getItem('vcomm_chat_channels');
    return saved ? JSON.parse(saved) : INITIAL_CHANNELS;
  });
  
  const [activeChannelId, setActiveChannelId] = useState<string>('ch-dept-1');
  
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem('vcomm_chat_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [inputValue, setInputValue] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<{ name: string; type: 'file' | 'image'; size: string } | null>(null);
  
  // Group creation modal state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync state
  useEffect(() => {
    localStorage.setItem('vcomm_chat_channels', JSON.stringify(channels));
  }, [channels]);

  useEffect(() => {
    localStorage.setItem('vcomm_chat_messages', JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannelId]);

  // Mark channel as read
  useEffect(() => {
    setChannels(prev => prev.map(ch => ch.id === activeChannelId ? { ...ch, unreadCount: 0 } : ch));
  }, [activeChannelId]);

  const activeChannel = channels.find(c => c.id === activeChannelId);

  // Actions
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const messageText = inputValue;
    setInputValue('');
    
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'self',
      senderName: 'Bạn (Vinh NT)',
      senderRole: 'Trưởng phòng Công nghệ',
      text: messageText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true
    };

    setMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), newMsg]
    }));

    // Trigger AI response if tagged
    if (messageText.includes('@AI') || messageText.toLowerCase().startsWith('@ai')) {
      setIsAiTyping(true);
      
      const cleanPrompt = messageText.replace(/@AI/gi, '').trim();
      const chatHistory = (messages[activeChannelId] || []).map(m => ({
        role: m.isSelf ? 'user' as const : 'model' as const,
        content: m.text
      }));

      try {
        const responseText = await getAiChatResponse(cleanPrompt || 'Chào bạn, bạn có thể giúp tôi làm gì?', chatHistory);
        
        setTimeout(() => {
          const aiMsg: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            senderId: 'ai-bot',
            senderName: 'VComm AI Assistant',
            senderRole: 'Trợ lý thông minh',
            text: responseText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSelf: false,
            isAi: true
          };

          setMessages(prev => ({
            ...prev,
            [activeChannelId]: [...(prev[activeChannelId] || []), aiMsg]
          }));
          setIsAiTyping(false);
          addNotification('AI phản hồi', 'VComm AI Assistant vừa trả lời tin nhắn của bạn.');
        }, 800);
      } catch (err) {
        // Fallback mock AI response
        setTimeout(() => {
          const aiMsg: ChatMessage = {
            id: `msg-ai-${Date.now()}`,
            senderId: 'ai-bot',
            senderName: 'VComm AI Assistant',
            senderRole: 'Trợ lý thông minh',
            text: `🤖 Tôi đã nhận được yêu cầu: "${cleanPrompt}". Để hạch toán kế toán hoặc chẩn đoán DNS, vui lòng truy cập các module tương ứng.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isSelf: false,
            isAi: true
          };

          setMessages(prev => ({
            ...prev,
            [activeChannelId]: [...(prev[activeChannelId] || []), aiMsg]
          }));
          setIsAiTyping(false);
        }, 1200);
      }
    }
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages(prev => {
      const channelMsgs = prev[activeChannelId] || [];
      const updated = channelMsgs.map(m => {
        if (m.id === messageId) {
          const reactions = m.reactions ? [...m.reactions] : [];
          const existing = reactions.find(r => r.emoji === emoji);
          if (existing) {
            if (existing.users.includes('self')) {
              // Remove reaction
              existing.users = existing.users.filter(u => u !== 'self');
              existing.count = Math.max(0, existing.count - 1);
            } else {
              // Add reaction
              existing.users.push('self');
              existing.count += 1;
            }
          } else {
            reactions.push({ emoji, count: 1, users: ['self'] });
          }
          return { ...m, reactions: reactions.filter(r => r.count > 0) };
        }
        return m;
      });
      return { ...prev, [activeChannelId]: updated };
    });
  };

  const handleUploadFile = () => {
    const fileTypes: { name: string; type: 'file' | 'image'; size: string }[] = [
      { name: 'Ke_hoach_tuan_sau.docx', type: 'file', size: '1.2 MB' },
      { name: 'Mockup_Giao_dien_Chat.png', type: 'image', size: '2.4 MB' },
      { name: 'Bao_cao_marketing_v2.pdf', type: 'file', size: '3.1 MB' }
    ];
    const chosenFile = fileTypes[Math.floor(Math.random() * fileTypes.length)];

    const fileMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'self',
      senderName: 'Bạn (Vinh NT)',
      senderRole: 'Trưởng phòng Công nghệ',
      text: `Đã tải lên tệp tin: ${chosenFile.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isSelf: true,
      attachment: chosenFile
    };

    setMessages(prev => ({
      ...prev,
      [activeChannelId]: [...(prev[activeChannelId] || []), fileMsg]
    }));
    addNotification('Tải tệp tin', `Đã đính kèm tệp ${chosenFile.name} vào đoạn hội thoại.`);
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    
    const newId = `ch-group-${Date.now()}`;
    const newChan: ChatChannel = {
      id: newId,
      name: newGroupName,
      type: 'group',
      desc: newGroupDesc || 'Nhóm cộng tác dự án mới',
      unreadCount: 0,
      avatarText: newGroupName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    };

    setChannels(prev => [...prev, newChan]);
    
    // Add welcome message
    setMessages(prev => ({
      ...prev,
      [newId]: [
        { id: `msg-${Date.now()}`, senderId: 'system', senderName: 'Hệ thống', senderRole: 'System', text: `Nhóm "${newGroupName}" đã được khởi tạo bởi Trưởng phòng Công nghệ Vinh NT.`, timestamp: 'Vừa xong', isSelf: false }
      ]
    }));

    setShowCreateGroupModal(false);
    setActiveChannelId(newId);
    setNewGroupName('');
    setNewGroupDesc('');
    setSelectedMembers([]);
    addNotification('Tạo nhóm chat', `Đã tạo thành công nhóm chat "${newGroupName}"`);
  };

  const toggleMemberSelection = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]);
  };

  // Filter channels based on search
  const filteredChannels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const currentMessages = messages[activeChannelId] || [];
  const filteredMessages = currentMessages.filter(msg =>
    msg.text.toLowerCase().includes(messageSearchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border border-slate-300 shadow-sm h-[calc(100vh-180px)] overflow-hidden flex animate-in fade-in duration-500 font-sans text-xs">
      
      {/* 1. Left Channels Sidebar */}
      <div className="w-[240px] bg-slate-50 border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div className="p-4 flex flex-col gap-4 overflow-y-auto">
          {/* Header & New Group button */}
          <div className="flex justify-between items-center shrink-0">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary-600" /> Chat nội bộ
            </h2>
            <button 
              onClick={() => setShowCreateGroupModal(true)}
              className="p-1.5 bg-white border border-slate-250 hover:bg-slate-100 rounded-lg shadow-3xs cursor-pointer border-0"
              title="Tạo nhóm chat"
            >
              <Plus className="w-4.5 h-4.5 text-slate-605" />
            </button>
          </div>

          {/* Search channel */}
          <div className="relative shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm phòng ban, đồng nghiệp..."
              className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Channels list by category */}
          <div className="space-y-4">
            {/* Department Rooms */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-2">Phòng ban</span>
              {filteredChannels.filter(c => c.type === 'department').map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border-0 bg-transparent text-left",
                    activeChannelId === ch.id 
                      ? "bg-slate-200 text-primary-600 font-bold" 
                      : "text-slate-650 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Hash className={cn("w-4 h-4 shrink-0", activeChannelId === ch.id ? "text-primary-600" : "text-slate-400")} />
                    <span className="truncate">{ch.name}</span>
                  </div>
                  {ch.unreadCount > 0 && (
                    <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[8.5px]">{ch.unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Groups */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-2">Nhóm dự án</span>
              {filteredChannels.filter(c => c.type === 'group').map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border-0 bg-transparent text-left",
                    activeChannelId === ch.id 
                      ? "bg-slate-200 text-primary-600 font-bold" 
                      : "text-slate-650 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Users className={cn("w-4 h-4 shrink-0", activeChannelId === ch.id ? "text-primary-600" : "text-slate-400")} />
                    <span className="truncate">{ch.name}</span>
                  </div>
                  {ch.unreadCount > 0 && (
                    <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[8.5px]">{ch.unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Direct Messages */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-2">Đồng nghiệp</span>
              {filteredChannels.filter(c => c.type === 'direct').map(ch => (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannelId(ch.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold cursor-pointer border-0 bg-transparent text-left",
                    activeChannelId === ch.id 
                      ? "bg-slate-200 text-primary-600 font-bold" 
                      : "text-slate-650 hover:bg-slate-100"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0 select-none">
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[9px] text-slate-700">
                        {ch.name[0]}
                      </div>
                      <span className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white",
                        ch.status === 'online' ? "bg-emerald-500" : "bg-slate-350"
                      )} />
                    </div>
                    <span className="truncate">{ch.name}</span>
                  </div>
                  {ch.unreadCount > 0 && (
                    <span className="bg-red-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[8.5px]">{ch.unreadCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* User own profile status */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 select-none shrink-0">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 border border-slate-300">V</div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-slate-900 block truncate leading-tight">Vinh NT</span>
            <span className="text-[9px] text-slate-400 font-semibold block flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block"></span> Đang hoạt động
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Chat Panel */}
      <div className="flex-1 flex flex-col bg-slate-50/30 overflow-hidden">
        {activeChannel ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-slate-200 flex justify-between items-center z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-105 border border-slate-200 flex items-center justify-center font-bold text-xs text-blue-650 shadow-3xs select-none">
                  {activeChannel.avatarText || activeChannel.name[0]}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-905 flex items-center gap-1.5">
                    {activeChannel.name}
                    {activeChannel.type === 'direct' && activeChannel.status === 'online' && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    )}
                  </h3>
                  <p className="text-[10px] text-slate-450 leading-relaxed font-medium">
                    {activeChannel.type === 'direct' ? (activeChannel.role || 'Đồng nghiệp') : (activeChannel.desc || 'Hộp chat cộng tác')}
                  </p>
                </div>
              </div>

              {/* Message Search box */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={messageSearchQuery}
                  onChange={e => setMessageSearchQuery(e.target.value)}
                  placeholder="Tìm tin nhắn..."
                  className="bg-slate-50 border border-slate-350 rounded-lg pl-8 pr-7 py-1.5 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-500 w-36 sm:w-48 transition-all"
                />
                {messageSearchQuery && (
                  <button 
                    onClick={() => setMessageSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-200 rounded-full border-0 bg-transparent cursor-pointer"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {filteredMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-slate-450 font-medium select-none space-y-1">
                  <span>💬 {messageSearchQuery ? "Không tìm thấy kết quả" : "Bắt đầu cuộc trò chuyện"}</span>
                  <span className="text-[9.5px] text-slate-400">
                    {messageSearchQuery ? "Thử nhập từ khóa tìm kiếm khác." : "Gửi tin nhắn hoặc đính kèm tài liệu trao đổi công tác."}
                  </span>
                </div>
              ) : (
                filteredMessages.map((msg, idx) => (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex items-start gap-2.5 animate-in fade-in duration-200 max-w-[85%] sm:max-w-[70%]",
                      msg.isSelf ? "ml-auto flex-row-reverse" : "mr-auto flex-row"
                    )}
                  >
                    {/* User profile icon */}
                    {!msg.isSelf && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] border border-slate-350 shrink-0 select-none">
                        {msg.senderName[0]}
                      </div>
                    )}
                    
                    {/* Message content box */}
                    <div className={cn("space-y-1 text-left", msg.isSelf ? "items-end" : "items-start")}>
                      {!msg.isSelf && (
                        <span className="text-[9px] font-bold text-slate-500 px-1">
                          {msg.senderName} <span className="text-[8.5px] font-medium text-slate-400">({msg.senderRole})</span>
                        </span>
                      )}
                      
                      <div 
                        className={cn(
                          "p-3 rounded-lg text-[11.5px] leading-relaxed shadow-3xs",
                          msg.isSelf 
                            ? "bg-primary-600 text-white rounded-tr-none font-medium" 
                            : msg.isAi
                              ? "bg-indigo-50 border border-indigo-150 text-slate-805 rounded-tl-none font-medium"
                              : "bg-white border border-slate-200 text-slate-800 rounded-tl-none font-medium"
                        )}
                      >
                        {/* Render attachment card if exists */}
                        {msg.attachment && (
                          <div 
                            onClick={() => setPreviewAttachment(msg.attachment!)}
                            className={cn(
                              "p-2.5 rounded-lg border mb-2.5 flex items-center justify-between gap-3 text-left cursor-pointer hover:opacity-90 transition duration-150",
                              msg.isSelf ? "bg-blue-700/50 border-blue-500 text-white" : "bg-slate-50 border-slate-200"
                            )}
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              {msg.attachment.type === 'image' ? (
                                <ImageIcon className="w-5 h-5 text-indigo-550 shrink-0" />
                              ) : (
                                <FileText className="w-5 h-5 text-blue-500 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <span className="text-[11px] font-bold block truncate">{msg.attachment.name}</span>
                                <span className="text-[9px] opacity-70 block">{msg.attachment.size}</span>
                              </div>
                            </div>
                            <button className={cn(
                              "p-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg shadow-3xs cursor-pointer border-0",
                              msg.isSelf && "text-slate-800"
                            )}>
                              ⬇️
                            </button>
                          </div>
                        )}
                        
                        {/* Text body */}
                        {msg.text}
                      </div>

                      {/* Msg footer: time & reactions */}
                      <div className="flex flex-wrap items-center gap-2 px-1">
                        <span className="text-[8.5px] text-slate-400 font-semibold">{msg.timestamp}</span>
                        {msg.isSelf && <CheckCheck className="w-3 h-3 text-emerald-500 shrink-0" />}
                        
                        {/* Reaction badges */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <div className="flex gap-1">
                            {msg.reactions.map((r, rIdx) => (
                              <button
                                key={rIdx}
                                onClick={() => handleAddReaction(msg.id, r.emoji)}
                                className={cn(
                                  "px-1.5 py-0.5 rounded-full border text-[9px] font-bold flex items-center gap-0.5 cursor-pointer shadow-3xs",
                                  r.users.includes('self') ? "bg-primary-50 border-blue-200 text-primary-600" : "bg-white border-slate-200 text-slate-500"
                                )}
                              >
                                <span>{r.emoji}</span>
                                <span>{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Emoji reaction picker on hover (simple modal click helper for DM/rooms) */}
                        <div className="relative group/picker">
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-slate-700 text-[10px] cursor-pointer">
                            😊 +
                          </button>
                          <div className="absolute bottom-full left-0 hidden group-hover/picker:flex bg-white border border-slate-250 p-1 rounded-full shadow-md z-20 gap-1 animate-in fade-in">
                            {['❤️', '👍', '😂', '🔥', '😮'].map(emo => (
                              <button 
                                key={emo}
                                onClick={() => handleAddReaction(msg.id, emo)}
                                className="hover:scale-125 transition text-xs p-0.5 border-0 bg-transparent cursor-pointer"
                              >
                                {emo}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              {/* AI Typing loader */}
              {isAiTyping && (
                <div className="flex items-start gap-2.5 max-w-[70%] mr-auto animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] border border-slate-350 shrink-0">AI</div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 px-1">VComm AI Assistant</span>
                    <div className="p-3 bg-indigo-50 border border-indigo-150 text-slate-700 rounded-lg rounded-tl-none text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                      <span>AI đang phân tích câu hỏi và truy vấn CSDL ERP...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={handleUploadFile}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 rounded-lg transition cursor-pointer border-0"
                  title="Đính kèm tệp tin"
                >
                  <Paperclip className="w-4.5 h-4.5" />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Nhập tin nhắn... (Gõ @AI để hỏi đáp AI trợ lý)"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button 
                      onClick={() => setInputValue(prev => prev + ' @AI ')}
                      className="p-1 text-indigo-650 hover:bg-indigo-50 rounded-md font-bold text-[9px] uppercase border border-indigo-200 cursor-pointer"
                    >
                      🤖 @AI
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className="p-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg shadow-xs disabled:opacity-40 transition cursor-pointer border-0"
                >
                  <Send className="w-4.5 h-4.5" />
                </button>
              </div>
              <p className="text-center text-[9px] text-slate-400 mt-2 font-medium">Bảo mật kênh truyền Zero-Trust • VComm Collaboration Pack 2026</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 select-none">
            <MessageSquare className="w-10 h-10 text-slate-200 stroke-[1.5]" />
            <span className="text-xs">Chọn phòng ban hoặc đồng nghiệp để bắt đầu chat</span>
          </div>
        )}
      </div>

      {/* 3. Group Creation Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-sm border border-slate-350 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-250 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-primary-600" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Tạo nhóm chat nội bộ</h3>
              </div>
              <button 
                onClick={() => setShowCreateGroupModal(false)}
                className="p-1 hover:bg-slate-200 rounded-full cursor-pointer border-0 bg-transparent text-slate-550"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên nhóm *</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Ví dụ: Chiến dịch Sales Q3"
                  className="w-full p-2 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mô tả nhóm</label>
                <input
                  type="text"
                  value={newGroupDesc}
                  onChange={e => setNewGroupDesc(e.target.value)}
                  placeholder="Mô tả mục đích nhóm chat..."
                  className="w-full p-2 border border-slate-250 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Members check list */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mời thành viên</label>
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-[160px] overflow-y-auto bg-slate-50/20">
                  {MOCK_MEMBERS.map(member => (
                    <div 
                      key={member.id}
                      onClick={() => toggleMemberSelection(member.id)}
                      className="p-2 flex items-center justify-between gap-3 hover:bg-slate-50 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-805 block truncate">{member.name}</span>
                        <span className="text-[9.5px] text-slate-400 block">{member.position}</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(member.id)}
                        onChange={() => {}} // Controlled by div click
                        className="rounded text-blue-650 focus:ring-0 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setShowCreateGroupModal(false)}
                className="px-4 py-1.5 border border-slate-305 text-slate-700 bg-white text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer border-0"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
                className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg cursor-pointer border-0"
              >
                Lưu & Tạo nhóm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. ATTACHMENT PREVIEW MODAL ── */}
      {previewAttachment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-lg shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary-600" />
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Xem trước tài liệu đính kèm</h3>
              </div>
              <button 
                onClick={() => setPreviewAttachment(null)}
                className="p-1.5 hover:bg-slate-200 rounded-full cursor-pointer border-0 bg-transparent text-slate-550"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex-1 overflow-y-auto space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 text-slate-405">
                {previewAttachment.type === 'image' ? (
                  <ImageIcon className="w-8 h-8 text-indigo-500" />
                ) : (
                  <FileText className="w-8 h-8 text-blue-500" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">{previewAttachment.name}</h4>
                <p className="text-[10px] text-slate-500 mt-1">Dung lượng: {previewAttachment.size} • Định dạng: {previewAttachment.type.toUpperCase()}</p>
              </div>

              {previewAttachment.type === 'image' ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center min-h-[160px] border-dashed">
                  <div className="text-center space-y-2">
                    <ImageIcon className="w-10 h-10 text-slate-300 mx-auto animate-pulse" />
                    <p className="text-[10px] text-slate-400 font-medium">Bản xem trước hình ảnh độ phân giải cao (Mocked Image Canvas)</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-left font-mono text-[10px] text-slate-650 space-y-2 leading-relaxed bg-slate-900/5 select-text shadow-inner">
                  <p className="font-bold border-b border-slate-200 pb-1.5 text-[9px] uppercase tracking-wider text-slate-400">Nội dung văn bản trích xuất (AI Document OCR Preview):</p>
                  <p>1. CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                  <p>2. Đơn vị đề xuất: Bộ phận Vận hành sàn VComm ERP</p>
                  <p>3. Người thực hiện: Lê Hoàng Minh</p>
                  <p>4. Nội dung báo cáo/chi phí: Chi tiết đối soát công nợ tuần 22 và đề xuất duyệt tài chính nhà bán tương đương.</p>
                  <p>5. ... [Nhấp tải xuống để đọc toàn văn tài liệu gốc] ...</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 shrink-0">
              <button 
                onClick={() => setPreviewAttachment(null)}
                className="px-4 py-1.5 border border-slate-305 text-slate-700 bg-white text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer border-0"
              >
                Đóng
              </button>
              <button 
                onClick={() => {
                  alert(`Đang tải xuống tệp: ${previewAttachment.name}`);
                  setPreviewAttachment(null);
                }}
                className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-lg cursor-pointer border-0"
              >
                Tải xuống tệp
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
