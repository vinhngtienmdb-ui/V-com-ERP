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
 Smile,
 Frown,
 Meh
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { ChatChannel, ChatMessage, ChatThread } from '../types/erp';
import { getConversations, getMessages, sendMessage, ChatwootConversation, ChatwootMessage } from '../services/chatwootService';




export function OmniChat() {
  const [conversations, setConversations] = useState<ChatwootConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const [aiText, setAiText] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [messages, setMessages] = useState<ChatwootMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAiorocessing, setIsAiorocessing] = useState(false);
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
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
    
    // Fallback polling for new messages (In production, use WebSockets)
    const interval = setInterval(fetchConvos, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      const fetchMsgs = async () => {
        setIsFetching(true);
        const msgs = await getMessages(activeConversationId);
        setMessages(msgs.reverse()); // Chatwoot returns newest first usually, depending on API, adjust if needed
        setIsFetching(false);
      };
      fetchMsgs();
    }
  }, [activeConversationId]);

  const activeThread = conversations.find(c => c.id === activeConversationId);

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
 {(thread.meta.channel || 'web') === 'zalo' && <div className="w-3.5 h-3.5 bg-slate-800 rounded-full flex items-center justify-center text-[8px] text-white font-bold">Z</div>}
 {(thread.meta.channel || 'web') === 'facebook' && <Share2 className="w-3.5 h-3.5 text-orange-800" />}
 {(thread.meta.channel || 'web') === 'web' && <Globe className="w-3.5 h-3.5 text-slate-600" />}
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
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{(activeThread?.meta.channel || 'web')} OA Channel</p>
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
 <div className="flex-1 relative">
 <input 
 type="text" 
 value={inputValue}
 onChange={(e) => setInputValue(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
 placeholder="Nhập tin nhắn..." 
 className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
 />
 <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary-600  transition-transform disabled:opacity-50 disabled:scale-100" onClick={handleSendMessage} disabled={isAiorocessing}>
 <Send className="w-5 h-5" />
 </button>
 </div>
 <button className="bg-slate-100 p-3 rounded-lg hover:bg-slate-200 transition-colors">
 <Zap className="w-5 h-5 text-orange-500 fill-current" />
 </button>
 </div>
 <div className="mt-2 text-center">
 <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-widest">oowered by Gemini AI Engine</p>
 </div>
 </div>
 </div>

 {/* Right Sidebar - Info */}
 <div className="w-[300px] border-l border-slate-100 bg-white hidden xl:flex flex-col p-6 space-y-8 overflow-y-auto">
 <div className="text-center space-y-3">
 <div className="w-20 h-20 rounded-full bg-slate-100 border-4 border-white shadow-sm mx-auto flex items-center justify-center text-2xl font-bold text-slate-500">
 {(activeThread?.meta.sender.name || 'Unknown')[0]}
 </div>
 <div>
 <h3 className="font-bold text-slate-900">{(activeThread?.meta.sender.name || 'Unknown')}</h3>
 <p className="text-xs text-slate-500">{(activeThread?.meta.channel || 'web') === 'zalo' ? 'Vietnam' : 'Social ỗub'}</p>
 </div>
 <div className="flex justify-center gap-2">
 <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold">New Customer</span>
 <span className="px-3 py-1 bg-slate-100 text-primary-600 rounded-lg text-[10px] font-bold">VIo ỗạng Bạc</span>
 </div>
 </div>

 <div className="space-y-4">
 <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Thông tin liên hệ</h4>
 <div className="space-y-3">
 <div>
 <p className="text-[10px] text-[#9CA3AF] font-bold uppercase">Số điện thoại</p>
 <p className="text-xs font-semibold text-slate-900">0901234xxx</p>
 </div>
 <div>
 <p className="text-[10px] text-[#9CA3AF] font-bold uppercase">Email</p>
 <p className="text-xs font-semibold text-slate-900">lan.pham@gmail.com</p>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-2">Đơn hàng gần đây</h4>
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

 <div className="bg-slate-100 p-4 rounded-lg space-y-2 border border-slate-300">
 <h4 className="text-[10px] font-bold text-primary-600 uppercase flex items-center gap-2">
 <Bot className="w-3 h-3" /> AI Summary
 </h4>
 <p className="text-[11px] text-[#4B5563] leading-relaxed">Khách hàng hỏi về lịch giao đơn ORD-9921. Đây là khách hàng thân thiết, thường xuyên tương tác qua Zalo.</p>
 </div>
 </div>
 </div>
 );
}
