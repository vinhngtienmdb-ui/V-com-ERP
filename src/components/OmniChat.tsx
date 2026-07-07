import React, { useState, useEffect, useRef } from 'react';
import { 
 MessageSquare, 
 Share2,
 Globe, 
 Search, 
 Send, 
 Bot, 
 User, 
 Zap, 
 MoreVertical, 
 PhoneCall,
 History,
 CheckCheck,
 X,
 Plus,
 Sparkles,
 MessageCircle,
 Smartphone,
 Video,
 Hash,
 Camera,
 Lock,
 Smile,
 Frown,
 Meh
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { ChatChannel, ChatMessage, ChatThread } from '../types/erp';
import { getConversations, getMessages, sendMessage, ChatwootConversation, ChatwootMessage } from '../services/chatwootService';
import { db, collection, getDocs, setDoc, doc } from '../services/dbService';

interface Customer { id: number | string; name: string; phone: string; email: string; debt: number; status: string; createdAt?: string; }
interface Order { id: number | string; customerId: number | string; totalAmount: number; status: string; createdAt: string; }

const getCustomers = async (): Promise<Customer[]> => {
  const querySnapshot = await getDocs(collection(db, 'customers'));
  return querySnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
};

const getOrders = async (): Promise<Order[]> => {
  const querySnapshot = await getDocs(collection(db, 'orders'));
  return querySnapshot.docs.map((d: any) => ({ id: d.id, ...d.data() }));
};

// -- Mock Real-time Hook --
function useSimulatedWebSocket(onMessage: (msg: any) => void) {
  useEffect(() => {
    // In production, this would be: const ws = new WebSocket('wss://api.example.com/chat');
    // ws.onmessage = (e) => onMessage(JSON.parse(e.data));
    
    // For demo, we simulate receiving a message every 45 seconds randomly if there is an active conversation
    const timer = setInterval(() => {
      if (Math.random() > 0.7) {
        onMessage({ type: 'new_message', data: { content: 'Khách hàng vừa gửi ảnh đính kèm.', message_type: 0 }});
      }
    }, 45000);

    return () => clearInterval(timer);
  }, [onMessage]);
}



export function OmniChat() {
  const [conversations, setConversations] = useState<ChatwootConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [aiText, setAiText] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [messages, setMessages] = useState<ChatwootMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [isAiorocessing, setIsAiorocessing] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
  const [erpCustomer, setErpCustomer] = useState<Customer | null>(null);
  const [erpOrders, setErpOrders] = useState<Order[]>([]);
  const [isLinking, setIsLinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConvos = async () => {
      const convos = await getConversations();
      setConversations(convos);
      if (convos.length > 0) {
        setActiveConversationId(convos[0].id);
      }
    };
    fetchConvos();
  }, []);

  // WebSocket / Real-time Sync
  useSimulatedWebSocket((event) => {
    if (event.type === 'new_message' && activeConversationId) {
       // Refresh messages when a real-time event occurs
       getMessages(activeConversationId).then(msgs => {
         setMessages(msgs.reverse());
       });
    }
  });

  useEffect(() => {
    if (activeConversationId) {
      const fetchMsgs = async () => {
        setIsFetching(true);
        const msgs = await getMessages(activeConversationId);
        setMessages(msgs.reverse());
        setIsFetching(false);
      };
      fetchMsgs();
    }
  }, [activeConversationId]);

  const activeThread = conversations.find(c => c.id === activeConversationId);
  useEffect(() => {
    if (activeThread) {
      const phone = activeThread.meta.sender.phone_number;
      if (phone) {
        getCustomers().then(customers => {
          const matched = customers.find(c => c.phone === phone);
          if (matched) {
            setErpCustomer(matched);
            getOrders().then(orders => {
              const matchedOrders = orders.filter(o => o.customerId === matched.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
              setErpOrders(matchedOrders);
            });
          } else {
            setErpCustomer(null);
            setErpOrders([]);
          }
        });
      } else {
        setErpCustomer(null);
        setErpOrders([]);
      }
    }
  }, [activeThread]);

  const handleLinkNewErp = () => {
    setIsLinking(true);
    setTimeout(() => {
      setErpCustomer({
        id: Math.floor(Math.random() * 10000),
        name: activeThread?.meta.sender.name || 'Khách hàng mới',
        phone: activeThread?.meta.sender.phone_number || '',
        email: '',
        status: 'active',
        debt: 0,
        createdAt: new Date().toISOString()
      });
      setIsLinking(false);
    }, 1500);
  };

 useEffect(() => {
 if (scrollRef.current) {
 scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
 }
 }, [messages]);

 const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeConversationId) return;
    
    setIsSending(true);
    const text = inputValue;
    setInputValue('');
    
    // Optimistic UI update
    const optimisticMsg: ChatwootMessage = {
      id: Date.now(),
      content: text,
      message_type: 1,
      content_type: 'text',
      sender_type: 'User',
      sender: { id: 0, name: 'You', avatar_url: '' },
      created_at: Date.now() / 1000
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    const sent = await sendMessage(activeConversationId, text);
    if (sent) {
      // Re-fetch or replace optimistic
      const updatedMsgs = await getMessages(activeConversationId);
      setMessages(updatedMsgs.reverse());
    }
    setIsSending(false);
  };

 const generateDraft = async () => {
 if (isAiorocessing) return;
 setIsAiorocessing(true);
 const lastCustomerMsg = [...messages].reverse().find(m => m.message_type === 0)?.content;
 if (lastCustomerMsg) {
 const prompt = `Dựa trên tin nhắn này của khách hàng: "${lastCustomerMsg}", hãy gợi ý 3 câu trả lời ngắn gọn, chuyên nghiệp và thân thiện cho nhân viên CSKỗ (ngôn ngữ Tiếng Việt).`;
//  const response = await getAiChatResponse(prompt, []);
 // Split by newline or common separators if AI returns a list
 const suggestions = response ? response.split('\n').filter((s: any) => s.trim().length > 5).slice(0, 3) : ['Dạ vâng, bên em sẽ kiểm tra ngay ạ.', 'Xin chào, tôi có thể hỗ trợ gì cho bạn?', 'Cảm ơn bạn đã liên hệ.'];
 setSuggestedReplies(suggestions);
 }
 setIsAiorocessing(false);
 };

 return (
 <div className="flex bg-white rounded-lg border border-slate-300 shadow-sm h-[calc(100vh-180px)] overflow-hidden animate-in fade-in duration-500">
 {/* Sidebar - Thread List */}
 <div className="w-[320px] border-r border-slate-100 flex flex-col">
 <div className="p-4 border-b border-slate-100">
 <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
 <MessageSquare className="w-5 h-5 text-primary-600" /> OmniChat Center
 </h2>
 <div className="relative mt-4">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Tìm khách hàng..." 
 className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 transition-all"
 />
 </div>
 </div>
 <div className="flex-1 overflow-y-auto">
 {conversations.map(thread => (
 <button
 key={thread.id}
 onClick={() => setActiveConversationId(thread.id)}
 className={cn(
 "w-full p-4 flex gap-3 hover:bg-slate-50 transition-all border-b border-slate-100 text-left relative",
 activeConversationId === thread.id && "bg-slate-100/50 after:absolute after:left-0 after:top-0 after:bottom-0 after:w-1 after:bg-slate-900"
 )}
 >
 <div className="relative">
 <div className="w-12 h-12 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-slate-600 font-bold overflow-hidden shadow-sm">
 {thread.meta.sender.avatar_url ? <img src={thread.meta.sender.avatar_url} alt="" /> : (thread.meta.sender.name || 'Unknown')[0]}
 </div>
 <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
 {(() => {
   const channel = thread.meta.channel || 'web';
   switch(channel) {
     case 'zalo': return <div className="w-3.5 h-3.5 bg-slate-800 rounded-full flex items-center justify-center text-[8px] text-white font-bold">Z</div>;
     case 'zalo_personal': return <Smartphone className="w-3.5 h-3.5 text-slate-800" />;
     case 'facebook': return <MessageCircle className="w-3.5 h-3.5 text-blue-600" />;
     case 'instagram': return <Camera className="w-3.5 h-3.5 text-pink-600" />;
     case 'threads': return <Hash className="w-3.5 h-3.5 text-slate-900" />;
     case 'wechat': return <MessageSquare className="w-3.5 h-3.5 text-green-500" />;
     case 'telegram': return <Send className="w-3.5 h-3.5 text-sky-500" />;
     case 'tiktok': return <Video className="w-3.5 h-3.5 text-slate-800" />;
     default: return <Globe className="w-3.5 h-3.5 text-slate-600" />;
   }
 })()}
 </div>
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex justify-between items-start">
 <h3 className="text-sm font-bold text-slate-900 truncate">{(thread.meta.sender.name || 'Unknown')}</h3>
 <span className="text-[10px] text-[#9CA3AF]">{(new Date(thread.updated_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</span>
 </div>
 <p className="text-xs text-slate-500 truncate mt-0.5">{(thread.messages?.[0]?.content || '...')}</p>
 </div>
 {thread.unread_count > 0 && (
 <div className="absolute top-1/2 -translate-y-1/2 right-4 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">
 {thread.unread_count}
 </div>
 )}
 </button>
 ))}
 </div>
 </div>

 {/* Main Chat Area */}
 <div className="flex-1 flex flex-col bg-slate-50">
 {/* Chat ỗeader */}
 <div className="p-4 bg-white border-b border-slate-100 flex justify-between items-center z-10">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs border border-slate-300">
 {(activeThread?.meta.sender.name || 'Unknown')[0]}
 </div>
 <div>
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 {(activeThread?.meta.sender.name || 'Unknown')}
 <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
 </h3>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
 {(() => {
   const c = activeThread?.meta.channel || 'web';
   const map: Record<string, string> = {
     'zalo': 'Zalo OA',
     'zalo_personal': 'Zalo Cá Nhân',
     'facebook': 'Messenger',
     'instagram': 'Instagram Direct',
     'threads': 'Threads',
     'wechat': 'WeChat',
     'telegram': 'Telegram',
     'tiktok': 'TikTok Shop',
     'web': 'Livechat Website'
   };
   return map[c] || c;
 })()}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2">
 <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><PhoneCall className="w-4 h-4 text-slate-500" /></button>
 <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><History className="w-4 h-4 text-slate-500" /></button>
 <div className="h-6 w-[1px] bg-slate-200 mx-2" />
 <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical className="w-4 h-4 text-slate-500" /></button>
 </div>
 </div>

 {/* Messages List */}
 <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={scrollRef}>
 {/* AI Summary Banner */}
 <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group">
   <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
   <div className="relative z-10">
     <h4 className="text-xs font-extrabold text-indigo-900 uppercase tracking-widest flex items-center gap-2 mb-2">
       <Sparkles className="w-4 h-4 text-indigo-600" /> AI Tóm tắt Hội thoại
     </h4>
     <p className="text-sm text-indigo-800 font-medium leading-relaxed">
       Khách hàng khiếu nại về việc đơn hàng giao chậm 3 ngày. Khách đang có cảm xúc <strong>tiêu cực</strong> và dọa hủy đơn. Đã giải thích do thời tiết nhưng khách chưa hài lòng.
     </p>
   </div>
 </div>

 {messages.map((msg, idx) => (
 <div key={msg.id} className={cn(
 "flex items-start gap-3 animate-in fade-in slide-in- duration-300",
 msg.message_type === 1 ? "flex-row" : "flex-row-reverse"
 )}>
 <div className={cn(
 "w-8 h-8 rounded-full flex items-center justify-center shadow-sm",
 msg.message_type === 1 ? "bg-primary-600 text-white" : "bg-primary-600 text-white"
 )}>
 {msg.message_type === 1 ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
 </div>
 <div className={cn(
 "max-w-[70%] space-y-1",
 msg.message_type === 1 ? "items-start" : "items-end flex flex-col"
 )}>
 <div className={cn(
 "p-4 rounded-lg text-sm shadow-sm",
 msg.message_type === 1 
 ? "bg-white text-slate-900 border border-slate-100 rounded-tl-none" 
 : "bg-primary-600 hover:bg-primary-700 text-white rounded-tr-none"
 )}>
 {msg.content}
 </div>
 <div className="flex items-center gap-2 px-1">
 <span className="text-[10px] text-[#9CA3AF] font-medium">{(msg.sender?.name || 'User')} • {(new Date(msg.created_at * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))}</span>
 {msg.message_type === 0 && (
   <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest border", 
     idx % 3 === 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
   )}>
     {idx % 3 === 0 ? 'Tiêu cực' : 'Tích cực'}
   </span>
 )}
 {msg.message_type === 0 && <CheckCheck className="w-3 h-3 text-primary-600" />}
 </div>
 </div>
 </div>
 ))}
 {isAiorocessing && (
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center animate-pulse">
 <Bot className="w-4 h-4" />
 </div>
 <div className="bg-white border border-slate-100 p-3 rounded-lg rounded-tl-none shadow-sm flex items-center gap-2">
 <span className="text-xs text-slate-500 font-bold">AI Assistant đang soạn câu trả lời</span>
 <div className="flex gap-1">
 <div className="w-1 h-1 bg-slate-900 rounded-full animate-bounce [animation-delay:-0.3s]" />
 <div className="w-1 h-1 bg-slate-900 rounded-full animate-bounce [animation-delay:-0.15s]" />
 <div className="w-1 h-1 bg-slate-900 rounded-full animate-bounce" />
 </div>
 </div>
 </div>
 )}
 </div>

 {/* AI Suggestions */}
 {suggestedReplies.length > 0 && (
 <div className="px-6 py-3 flex gap-2 overflow-x-auto bg-white border-y border-slate-200 no-scrollbar min-w-0">
 {suggestedReplies.map((reply, i) => (
 <button 
 key={i}
 onClick={() => setInputValue(reply)}
 className="whitespace-nowrap px-4 py-2 bg-slate-100 text-primary-600 text-[11px] font-bold rounded-full border border-slate-300 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
 >
 {reply}
 </button>
 ))}
 <button onClick={() => setSuggestedReplies([])} className="p-2 text-slate-500 hover:text-slate-700"><X className="w-4 h-4" /></button>
 </div>
 )}

 {/* Input Area */}
 <div className="p-4 bg-white border-t border-slate-100">
 <div className="flex items-center gap-3">
 <button 
 onClick={generateDraft}
 disabled={isAiorocessing}
 className="p-3 bg-primary-50 border border-primary-100 text-primary-600 rounded-lg hover:bg-primary-600 hover:text-white transition-all shadow-sm group relative"
 >
 <Sparkles className={cn("w-5 h-5", isAiorocessing && "animate-spin")} />
 <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">AI Draft</span>
 </button>
 <div className="flex-1 relative flex flex-col gap-2">
 {isInternalNote && (
   <div className="absolute -top-10 right-0 bg-amber-100 text-amber-800 text-xs px-3 py-1.5 rounded-t-lg font-bold flex items-center gap-1 border border-amber-200 border-b-0">
     <Lock className="w-3 h-3" /> Chế độ Ghi chú Nội bộ
   </div>
 )}
 {inputValue.startsWith('/') && (
   <div className="absolute bottom-full mb-2 left-0 w-80 bg-white rounded-lg shadow-xl border border-slate-200 p-2 z-50">
     <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest px-2 pb-2 mb-2 border-b border-slate-100">Mẫu câu trả lời nhanh</p>
     <button onClick={() => setInputValue('Dạ V-com xin chào anh/chị, em có thể hỗ trợ gì ạ?')} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-md transition-colors"><span className="font-bold text-slate-900 mr-2">/chao</span>Xin chào</button>
     <button onClick={() => setInputValue('Dạ vâng, bên em sẽ kiểm tra ngay và phản hồi lại ạ.')} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-md transition-colors"><span className="font-bold text-slate-900 mr-2">/wait</span>Chờ kiểm tra</button>
     <button onClick={() => setInputValue('Dạ đơn hàng của anh/chị đang được chuẩn bị và sẽ sớm giao cho bên vận chuyển ạ.')} className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-primary-50 hover:text-primary-700 rounded-md transition-colors"><span className="font-bold text-slate-900 mr-2">/ship</span>Tình trạng đơn</button>
   </div>
 )}
 <div className="relative flex-1 flex items-center">
 <input 
 type="text" 
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
 placeholder={isInternalNote ? "Nhập ghi chú nội bộ (chỉ nhân viên xem được)..." : "Nhập tin nhắn..."} 
 className={cn(
   "w-full rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 transition-all",
   isInternalNote 
     ? "bg-amber-50 border-amber-300 focus:ring-amber-500/30 placeholder:text-amber-700/50 text-amber-900" 
     : "bg-slate-50 border-slate-200 focus:ring-primary-500/20 text-slate-900"
 )}
 />
 <button className={cn("absolute right-3 p-1.5 transition-transform disabled:opacity-50 disabled:scale-100 rounded-md", isInternalNote ? "text-amber-600 hover:bg-amber-100" : "text-primary-600 hover:bg-primary-50")} onClick={handleSendMessage} disabled={isAiorocessing}>
 <Send className="w-5 h-5" />
 </button>
 </div>
 </div>
 <button 
   onClick={() => setIsInternalNote(!isInternalNote)} 
   className={cn("p-3 rounded-lg transition-colors border", isInternalNote ? "bg-amber-100 border-amber-300 text-amber-700" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100")}
   title="Ghi chú nội bộ"
 >
 <Lock className="w-5 h-5" />
 </button>
 </div>
 <div className="mt-2 text-center">
 <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest">oowered by Gemini AI Engine</p>
 </div>
 </div>
 </div>

 {/* Right Sidebar - Info & Copilot */}
 <div className="w-[320px] border-l border-slate-100 bg-white hidden xl:flex flex-col p-6 space-y-6 overflow-y-auto">
 <div className="text-center space-y-3 pb-6 border-b border-slate-100">
 <div className="w-16 h-16 rounded-full bg-slate-100 border-4 border-white shadow-sm mx-auto flex items-center justify-center text-xl font-bold text-slate-500 relative">
 {(activeThread?.meta.sender.name || 'Unknown')[0]}
 <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
   <div className="w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
 </div>
 </div>
 <div>
 <h3 className="font-bold text-slate-900 flex items-center justify-center gap-1">
   {(activeThread?.meta.sender.name || 'Unknown')}
   <span title="Đã đồng bộ ERP"><CheckCheck className="w-4 h-4 text-primary-600" /></span>
 </h3>
 <p className="text-xs text-slate-500 font-mono mt-1">ERP ID: CUS-{(activeThread?.meta.sender.id || '9982').toString().padStart(4, '0')}</p>
 </div>
 <div className="flex justify-center gap-2">
 <span className="px-3 py-1 bg-primary-50 border border-primary-100 text-primary-700 rounded-lg text-[10px] font-extrabold uppercase tracking-widest flex items-center gap-1">
   <Sparkles className="w-3 h-3" /> VIP BẠC
 </span>
 </div>
 </div>

 <div className="space-y-4">
 <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2 flex items-center justify-between">
   <span>Dữ liệu ERP 360°</span>
   <button className="text-[10px] text-primary-600 hover:underline">Đồng bộ lại</button>
 </h4>
 <div className="grid grid-cols-2 gap-3">
 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
 <p className="text-[10px] text-[#9CA3AF] font-bold uppercase mb-1">Số điện thoại</p>
 <p className="text-xs font-bold text-slate-900">090 123 4567</p>
 </div>
 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
 <p className="text-[10px] text-[#9CA3AF] font-bold uppercase mb-1">Email</p>
 <p className="text-xs font-bold text-slate-900 truncate" title="lan.pham@gmail.com">lan.pham@gmail.com</p>
 </div>
 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
 <p className="text-[10px] text-[#9CA3AF] font-bold uppercase mb-1">Công nợ (Debt)</p>
 <p className="text-xs font-bold text-red-600">{formatCurrency(1500000)}</p>
 </div>
 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
 <p className="text-[10px] text-[#9CA3AF] font-bold uppercase mb-1">LTV (Vòng đời)</p>
 <p className="text-xs font-bold text-emerald-600">{formatCurrency(12500000)}</p>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <div className="flex items-center justify-between border-b border-slate-100 pb-2">
   <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Đơn hàng & Tickets</h4>
   <button className="text-[10px] font-bold text-primary-600 flex items-center gap-1 hover:underline">
     <Plus className="w-3 h-3" /> Tạo mới
   </button>
 </div>
 <div className="space-y-3">
 {[
 { id: 'ORD-9921', status: 'shipping', amount: 1540000 },
 { id: 'ORD-8840', status: 'delivered', amount: 850000 }
 ].map(order => (
 <div key={order.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1 group hover:border-orange-200 transition-all cursor-pointer">
 <div className="flex justify-between items-start">
 <span className="text-xs font-bold text-slate-900 font-mono">{order.id}</span>
 <span className={cn(
 "text-[9px] font-bold uppercase",
 order.status === 'shipping' ? "text-primary-600" : "text-emerald-600"
 )}>{order.status}</span>
 </div>
 <p className="text-sm font-bold text-primary-600">{formatCurrency(order.amount)}</p>
 </div>
 ))}
 </div>
 </div>

 {/* AI Copilot Section */}
 <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-inner flex flex-col mt-4">
   <h4 className="text-xs font-bold text-primary-700 uppercase flex items-center gap-2 mb-3">
     <Bot className="w-4 h-4" /> V-Comm Copilot
   </h4>
   <div className="space-y-3">
     <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 text-[11px] text-slate-700 leading-relaxed">
       Khách hàng vừa hỏi về lịch giao đơn <strong>ORD-9921</strong>. Hệ thống kiểm tra: đơn hàng đang ở kho trung chuyển Giao Hàng Nhanh.
     </div>
     
     <div className="flex gap-2 flex-col">
       <button className="w-full py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 transition-colors flex justify-center items-center gap-2 shadow-sm">
         <Sparkles className="w-3.5 h-3.5" /> Tạo câu trả lời tự động
       </button>
       <button className="w-full py-2 bg-white text-slate-700 border border-slate-300 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex justify-center items-center gap-2 shadow-sm">
         <Plus className="w-3.5 h-3.5" /> Tạo Ticket Hỗ trợ
       </button>
     </div>
   </div>
 </div>
 </div>
 </div>
 );
}
