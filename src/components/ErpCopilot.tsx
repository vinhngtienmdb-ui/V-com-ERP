import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, Terminal, BarChart2, Table, ChevronDown, ChevronUp } from 'lucide-react';
import { getAiChatResponse } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface CopilotMessage {
  role: 'user' | 'model';
  content: string;
  isDbQuery?: boolean;
  sql?: string;
  explanation?: string;
  chartConfig?: {
    type: 'bar' | 'line' | 'area' | 'pie' | 'none';
    xKey: string;
    yKeys: string[];
    title: string;
  };
  rows?: any[];
}

export function ErpCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<CopilotMessage[]>([
    { 
      role: 'model', 
      content: 'Chào bạn! Tôi là ERP Copilot. Hãy hỏi tôi bất cứ điều gì về dữ liệu hệ thống (doanh thu, tồn kho, khách hàng, kế toán...). Ví dụ: "Kho còn bao nhiêu áo thun?" hoặc "Tổng giá trị các đơn hàng hôm nay."' 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSqlIdx, setExpandedSqlIdx] = useState<number | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { staffInfo } = useAuth();
  const tenantId = staffInfo?.tenantId || 'tenant-vcomm-prod-01';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    // Heuristics to determine if query is likely a DB query
    const dbKeywords = ['bao nhiêu', 'doanh thu', 'tồn kho', 'liệt kê', 'báo cáo', 'đơn hàng', 'khách hàng', 'kế toán', 'sản phẩm', 'tiền', 'kho', 'bán chạy', 'đắt nhất'];
    const isDbLikely = dbKeywords.some(kw => userMessage.toLowerCase().includes(kw)) || userMessage.startsWith('?');
    const cleanQuery = userMessage.startsWith('?') ? userMessage.substring(1).trim() : userMessage;

    try {
      if (isDbLikely) {
        console.log('[Copilot] Executing DB query via RAG...');
        const response = await fetch('/api/gemini/db-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: cleanQuery, tenantId })
        });
        const data = await response.json();
        
        if (response.ok && data.sql && data.rows) {
          // It succeeded and returned database results!
          setMessages(prev => [...prev, {
            role: 'model',
            content: data.explanation || 'Đây là dữ liệu tôi tìm được:',
            isDbQuery: true,
            sql: data.sql,
            explanation: data.explanation,
            chartConfig: data.chartConfig || { type: 'none', xKey: '', yKeys: [], title: '' },
            rows: data.rows
          }]);
          setIsLoading(false);
          return;
        }
      }
      
      // Fallback: General AI conversation
      console.log('[Copilot] Falling back to general AI conversation...');
      const chatHistory = messages.map(m => ({ role: m.role, content: m.content }));
      const responseText = await getAiChatResponse(userMessage, chatHistory);
      
      setMessages(prev => [...prev, { role: 'model', content: responseText }]);
    } catch (error) {
      console.error('[Copilot] Error processing message:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: 'Xin lỗi, tôi gặp sự cố khi xử lý câu hỏi của bạn. Hệ thống AI đang đạt giới hạn. Vui lòng thử lại sau.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderDbChart = (msg: CopilotMessage) => {
    if (!msg.chartConfig || msg.chartConfig.type === 'none' || !msg.rows || msg.rows.length === 0) return null;
    const { type, xKey, yKeys, title } = msg.chartConfig;

    // Convert values to numbers for chart rendering safety
    const chartData = msg.rows.map(row => {
      const updatedRow = { ...row };
      for (const key of yKeys || []) {
        if (updatedRow[key] !== undefined) {
          updatedRow[key] = Number(updatedRow[key]);
        }
      }
      return updatedRow;
    });

    return (
      <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg shadow-inner w-full min-h-[160px]">
        <p className="text-[10px] font-black text-slate-800 mb-2 text-center uppercase tracking-wider">{title || 'Đồ thị trực quan'}</p>
        <ResponsiveContainer width="100%" height={130}>
          {type === 'bar' ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 8, fontWeight: 700 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 8, fontWeight: 700 }} stroke="#94A3B8" />
              <Tooltip contentStyle={{ fontSize: '9px', fontWeight: 700 }} />
              {yKeys.map((yKey, index) => (
                <Bar key={yKey} name={yKey.toUpperCase()} dataKey={yKey} fill={index === 0 ? "#3B82F6" : "#10B981"} radius={[2, 2, 0, 0]} />
              ))}
            </BarChart>
          ) : type === 'line' ? (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 8, fontWeight: 700 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 8, fontWeight: 700 }} stroke="#94A3B8" />
              <Tooltip contentStyle={{ fontSize: '9px', fontWeight: 700 }} />
              {yKeys.map((yKey, index) => (
                <Line key={yKey} type="monotone" name={yKey.toUpperCase()} dataKey={yKey} stroke={index === 0 ? "#3B82F6" : "#10B981"} strokeWidth={1.5} dot={{ r: 2 }} />
              ))}
            </LineChart>
          ) : type === 'area' ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey={xKey} tick={{ fontSize: 8, fontWeight: 700 }} stroke="#94A3B8" />
              <YAxis tick={{ fontSize: 8, fontWeight: 700 }} stroke="#94A3B8" />
              <Tooltip contentStyle={{ fontSize: '9px', fontWeight: 700 }} />
              {yKeys.map((yKey) => (
                <Area key={yKey} type="monotone" name={yKey.toUpperCase()} dataKey={yKey} stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} strokeWidth={1.5} />
              ))}
            </AreaChart>
          ) : type === 'pie' ? (
            <PieChart>
              <Tooltip contentStyle={{ fontSize: '9px', fontWeight: 700 }} />
              <Pie
                data={chartData}
                dataKey={yKeys[0]}
                nameKey={xKey}
                cx="50%"
                cy="50%"
                outerRadius={35}
                fill="#3B82F6"
                label={{ fontSize: 7, fontWeight: 700 }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={["#3B82F6", "#10B981", "#F59E0B", "#EF4444"][index % 4]} />
                ))}
              </Pie>
            </PieChart>
          ) : null}
        </ResponsiveContainer>
      </div>
    );
  };

  const renderDbTable = (msg: CopilotMessage) => {
    if (!msg.rows || msg.rows.length === 0) return null;
    const columns = Object.keys(msg.rows[0]);

    return (
      <div className="mt-3 overflow-x-auto border border-slate-200 rounded-lg max-h-48 shadow-inner">
        <table className="w-full text-left border-collapse text-[9px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 sticky top-0 font-bold text-slate-500">
              {columns.map(col => (
                <th key={col} className="px-3 py-2 uppercase">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {msg.rows.map((row, idx) => (
              <tr key={idx} className="bg-white hover:bg-slate-50/50">
                {columns.map(col => (
                  <td key={col} className="px-3 py-1.5 font-mono font-bold text-slate-700">
                    {typeof row[col] === 'object' && row[col] !== null 
                      ? JSON.stringify(row[col]) 
                      : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <>
      {/* Floating button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 p-4 bg-[#111827] text-[#FAF9F5] rounded-full shadow-lg hover:bg-slate-800 transition-all z-[1000] active:scale-95 flex items-center justify-center border border-slate-800 hover:rotate-6 duration-300"
      >
        <MessageSquare className="w-6 h-6 animate-pulse" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[430px] h-[580px] bg-white rounded-lg shadow-2xl border border-slate-300 flex flex-col z-[1000] animate-in slide-in-from-bottom-5 fade-in duration-300 overflow-hidden font-sans">
          {/* Header */}
          <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 border border-slate-700 rounded-lg">
                <Bot className="w-5 h-5 text-cyan-400 animate-bounce" />
              </div>
              <div>
                <h3 className="font-extrabold text-xs tracking-wide">VCOMM ERP COPILOT</h3>
                <p className="text-[9px] text-cyan-400 font-bold uppercase tracking-widest mt-0.5">Database Intelligent Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages screen */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex flex-col", m.role === 'user' ? "items-end" : "items-start")}>
                <div className={cn(
                  "max-w-[90%] p-3.5 rounded-lg text-xs leading-relaxed shadow-sm border",
                  m.role === 'user' 
                    ? "bg-slate-900 text-[#FAF9F5] border-slate-800 rounded-tr-none" 
                    : "bg-white text-slate-800 border-slate-200 rounded-tl-none"
                )}>
                  {/* Natural Language reply */}
                  <p className="font-bold text-xs">{m.content}</p>

                  {/* If DB query results are available */}
                  {m.isDbQuery && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                      {/* Collapsible SQL preview */}
                      <div>
                        <button 
                          onClick={() => setExpandedSqlIdx(expandedSqlIdx === i ? null : i)}
                          className="flex items-center gap-1.5 text-[9px] font-black text-cyan-700 hover:text-cyan-800 uppercase tracking-widest cursor-pointer"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          {expandedSqlIdx === i ? 'Ẩn câu lệnh SQL' : 'Xem câu lệnh SQL'}
                          {expandedSqlIdx === i ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {expandedSqlIdx === i && (
                          <pre className="mt-1.5 p-2 bg-slate-900 text-emerald-400 font-mono text-[9px] rounded-lg overflow-x-auto border border-slate-950">
                            {m.sql}
                          </pre>
                        )}
                      </div>

                      {/* Render Visualizer Chart */}
                      {renderDbChart(m)}

                      {/* Render Data Table */}
                      {renderDbTable(m)}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 text-slate-500 p-3 rounded-lg rounded-tl-none text-xs flex items-center gap-2 shadow-sm font-bold animate-pulse">
                  <Bot className="w-4 h-4 text-cyan-600 animate-spin" />
                  Copilot đang suy nghĩ và truy vấn cơ sở dữ liệu...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="p-3 border-t border-[#F3F4F6] bg-white flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Nhập yêu cầu (ví dụ: kho Hà Nội còn bao nhiêu hàng?)..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
            <button 
              onClick={handleSend} 
              disabled={isLoading || !input.trim()}
              className="p-3 bg-slate-900 text-[#FAF9F5] rounded-lg hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
