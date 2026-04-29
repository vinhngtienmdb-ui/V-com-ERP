import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot } from 'lucide-react';
import { getAiChatResponse } from '../services/geminiService';
import { cn } from '../lib/utils';

export function AIChatBot() {
 const [isOpen, setIsOpen] = useState(false);
 const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([
 { role: 'model', content: 'Chào bạn! Tôi là trợ lý AI. Làm sao tôi có thể giúp bạn về đơn hàng hay sản phẩm hôm nay?' }
 ]);
 const [input, setInput] = useState('');
 const [isLoading, setIsLoading] = useState(false);
 const messagesEndRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
 }, [messages]);

 const handleSend = async () => {
 if (!input.trim() || isLoading) return;

 const userMessage = input.trim();
 setInput('');
 setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
 setIsLoading(true);

 try {
 const response = await getAiChatResponse(userMessage, messages);
 setMessages(prev => [...prev, { role: 'model', content: response }]);
 } finally {
 setIsLoading(false);
 }
 };

 return (
 <>
 <button 
 onClick={() => setIsOpen(!isOpen)}
 className="fixed bottom-6 right-6 p-4 bg-[#111827] text-[#FAF9F5] rounded-full shadow-sm hover:bg-stone-800 transition-all z-[1000] active:scale-95"
 >
 <MessageSquare className="w-6 h-6" />
 </button>

 {isOpen && (
 <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-sm border border-[#E5E7EB] flex flex-col z-[1000] animate-in slide-in- fade-in duration-300">
 <div className="p-6 border-b border-[#F3F4F6] flex justify-between items-center bg-stone-50/50 rounded-t-[2rem]">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-stone-900 rounded-lg">
 <Bot className="w-5 h-5 text-[#FAF9F5]" />
 </div>
 <h3 className="font-black text-[#111827]">Trợ lý VComm</h3>
 </div>
 <button onClick={() => setIsOpen(false)} className="text-[#9CA3AF] hover:text-[#111827]">
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto p-6 space-y-4">
 {messages.map((m, i) => (
 <div key={i} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
 <div className={cn("max-w-[80%] p-4 rounded-lg text-xs leading-relaxed", m.role === 'user' ? "bg-stone-900 text-[#FAF9F5] rounded-tr-none" : "bg-stone-100 text-[#111827] rounded-tl-none")}>
 {m.content}
 </div>
 </div>
 ))}
 {isLoading && (
 <div className="flex justify-start">
 <div className="bg-stone-100 text-[#111827] p-4 rounded-lg rounded-tl-none text-xs">Đang suy nghĩ...</div>
 </div>
 )}
 <div ref={messagesEndRef} />
 </div>

 <div className="p-4 border-t border-[#F3F4F6] flex gap-2">
 <input 
 value={input}
 onChange={(e) => setInput(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleSend()}
 placeholder="Nhập yêu cầu của bạn..."
 className="flex-1 bg-stone-50 border border-[#E5E7EB] rounded-lg px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-orange-600/10"
 />
 <button onClick={handleSend} className="p-3 bg-[#111827] text-[#FAF9F5] rounded-lg hover:bg-stone-800">
 <Send className="w-4 h-4" />
 </button>
 </div>
 </div>
 )}
 </>
 );
}
