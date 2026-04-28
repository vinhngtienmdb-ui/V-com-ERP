import React, { useState } from 'react';
import { 
  Bot, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  AlertTriangle, 
  Activity, 
  Search, 
  Filter, 
  Layers, 
  RefreshCw,
  Sparkles,
  BarChart4,
  CheckCircle2,
  XCircle,
  Eye,
  Settings,
  Server,
  Network,
  DollarSign,
  LineChart,
  UserCheck,
  Globe,
  Clock,
  TrendingUp,
  Plus,
  Settings2,
  ChevronRight,
  Terminal,
  Cpu as CpuIcon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AiTaskResult } from '../types/erp';

const MOCK_AI_LOGS: AiTaskResult[] = [
  { id: 'AI-101', type: 'image_moderation', targetId: 'PRD-002', confidence: 0.98, status: 'flagged', result: { reason: 'Hình ảnh chứa watermark thương hiệu khác' }, timestamp: '10 phút trước' },
  { id: 'AI-102', type: 'dynamic_pricing', targetId: 'PRD-001', confidence: 0.85, status: 'fixed', result: { oldPrice: 34990000, newPrice: 34500000, reason: 'Cạnh tranh giá so với sàn Shopee' }, timestamp: '2 giờ trước' },
  { id: 'AI-103', type: 'fraud_alert', targetId: 'USR-8821', confidence: 0.92, status: 'flagged', result: { risk: 'Buff đơn ảo (Click farming)', location: 'IP Cluster' }, timestamp: '1 giờ trước' },
  { id: 'AI-104', type: 'recommendation', targetId: 'USR-9011', confidence: 0.88, status: 'fixed', result: { engine: 'collab-filtering', action: 'Gợi ý combo giày thể thao' }, timestamp: '3 phút trước' },
  { id: 'AI-105', type: 'chatbot', targetId: 'TKT-1922', confidence: 0.95, status: 'fixed', result: { action: 'Tự động duyệt hoàn tiền', intent: 'refund_request' }, timestamp: 'Vừa xong' },
];

const renderResult = (log: AiTaskResult) => {
  switch (log.type) {
    case 'image_moderation':
      return `Phát hiện vi phạm: ${log.result.reason}`;
    case 'dynamic_pricing':
      return `Giảm giá từ ${log.result.oldPrice?.toLocaleString('vi-VN')}đ xuống ${log.result.newPrice?.toLocaleString('vi-VN')}đ. Lý do: ${log.result.reason}`;
    case 'fraud_alert':
      return `Cảnh báo rủi ro: ${log.result.risk} tại ${log.result.location}`;
    case 'recommendation':
      return (
        <>
          Sử dụng model <span className="font-mono text-xs bg-slate-200 px-1 py-0.5 rounded text-slate-800">{log.result.engine}</span> để thay đổi: {log.result.action}
        </>
      );
    case 'chatbot':
      return `Tự động phản hồi: ${log.result.action} (Ý định: ${log.result.intent})`;
    default:
      return log.result.action || JSON.stringify(log.result);
  }
};

const MOCK_HUMAN_QUEUE = [
  { id: 'RVW-881', type: 'image_moderation', targetId: 'PRD-990', confidence: 0.62, reason: 'Nghi vấn nội dung nhạy cảm nhúng trong ảnh', timestamp: '5 phút trước' },
  { id: 'RVW-882', type: 'fraud_alert', targetId: 'USR-772', confidence: 0.58, reason: 'Chu kỳ nạp/rút tiền bất thường (Anomalous Flow)', timestamp: '12 phút trước' },
];

export function AIOperations() {
  const [activeModel, setActiveModel] = useState<'moderation' | 'pricing' | 'fraud' | 'recommendation' | 'chatbot' | 'review'>('moderation');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="header-title">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 bg-blue-950/50 border border-blue-900 px-2 py-0.5 rounded-none">Neural Network Central</span>
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Operations <span className="text-blue-600">(AIOps)</span></h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Điều phối và giám sát hệ thống Multi-Agent vận hành toàn sàn thương mại.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="bg-white border border-slate-200 px-5 py-2.5 rounded-none text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm border-b-2 active:translate-y-0.5">
            <Settings className="w-4 h-4 text-slate-400" />
            Cấu hình tham số
          </button>
          <button className="bg-slate-900 text-white px-5 py-2.5 rounded-none text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95">
             <RefreshCw className="w-4 h-4" />
             Re-Train All Models
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-950 text-white p-7 rounded-none relative overflow-hidden group shadow-2xl border border-slate-800">
           <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-6">
                 <div className="p-3 bg-blue-600 rounded-none shadow-2xl shadow-blue-600/40 group-hover:scale-110 transition-transform duration-500">
                    <Cpu className="w-6 h-6" />
                 </div>
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">System Health</span>
                    <span className="text-xs font-bold text-emerald-400">99.99%</span>
                 </div>
              </div>
              <div>
                 <div className="text-3xl font-black tracking-tight">12 Tác nhân</div>
                 <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">Active Neural Nodes</p>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-3xl" />
           <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 group-hover:rotate-12 transition-transform duration-1000" />
        </div>

        {[
          { label: 'Duyệt AI tự động', value: '8,421', sub: 'Tác vụ / 24h', icon: ShieldCheck, color: 'emerald' },
          { label: 'Cảnh báo rủi ro', value: '12', sub: 'Detected today', icon: AlertTriangle, color: 'rose', alert: true },
          { label: 'Độ trễ suy luận', value: '140ms', sub: 'Avg Response', icon: Activity, color: 'blue' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white p-7 rounded-none border border-slate-100 shadow-xl shadow-slate-200/50 flex items-center gap-6 group hover:shadow-blue-500/5 transition-all">
            <div className={cn(
              "p-4 rounded-none transition-transform group-hover:scale-110 duration-500",
              stat.alert ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-slate-50 text-slate-600 border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600"
            )}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <div className={cn("text-2xl font-black tracking-tight", stat.alert ? "text-rose-600" : "text-slate-900")}>
                {stat.value}
              </div>
              <p className="text-[10px] text-slate-500 font-bold mt-0.5">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-none border border-slate-100 shadow-2xl overflow-hidden">
        <div className="flex border-b border-slate-100 bg-slate-50/30 p-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
           {[
             { id: 'moderation', label: 'Bảo vệ Nội dung', icon: ShieldCheck },
             { id: 'pricing', label: 'AI Giá linh hoạt', icon: Zap },
             { id: 'fraud', label: 'Phát hiện Gian lận', icon: AlertTriangle },
             { id: 'recommendation', label: 'Gợi ý Sản phẩm', icon: Network },
             { id: 'chatbot', label: 'CSKH (Bot AI)', icon: Bot },
             { id: 'review', label: 'Human-in-the-loop', icon: UserCheck }
           ].map((tab) => (
             <button 
                key={tab.id}
                onClick={() => setActiveModel(tab.id as any)}
                className={cn(
                  "px-6 py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 rounded-none",
                  activeModel === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-500 hover:text-slate-900 hover:bg-white"
                )}
             >
                <tab.icon className="w-4 h-4" /> {tab.label}
             </button>
           ))}
        </div>

        <div className="p-8">
           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
              <div className="flex gap-4 w-full md:w-auto">
                 <div className="relative flex-1 md:flex-initial">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Tìm ID xử lý của AI..." 
                      className="bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-6 py-3 text-sm focus:outline-none w-full md:w-80 ring-blue-500/10 focus:ring-4 transition-all"
                    />
                 </div>
                 <button className="bg-white border border-slate-200 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 hover:bg-slate-50 transition-all">
                    <Filter className="w-4 h-4" /> Filter Confidence
                 </button>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-100">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> Live Inference Stream
              </div>
           </div>

           <div className="space-y-4">
              {activeModel === 'review' ? (
                 MOCK_HUMAN_QUEUE.map((item) => (
                    <div key={item.id} className="p-8 bg-amber-50/30 border border-amber-200 rounded-3xl flex flex-col sm:flex-row items-start gap-8 group">
                       <div className="p-5 rounded-2xl bg-white shadow-xl shadow-amber-200/50 text-amber-600 border border-amber-100 group-hover:scale-105 transition-transform">
                          <UserCheck className="w-8 h-8" />
                       </div>
                       <div className="flex-1 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                             <div>
                                <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
                                   {item.id}
                                   <span className="text-[10px] bg-amber-600 text-white px-3 py-1 rounded-full uppercase tracking-[0.1em] font-black shadow-lg shadow-amber-600/20">Pending Human</span>
                                </h4>
                                <div className="flex items-center gap-3 mt-1.5">
                                   <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5" /> {item.timestamp}
                                   </span>
                                   <div className="w-px h-3 bg-slate-300" />
                                   <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Confidence: {(item.confidence * 100).toFixed(0)}%</span>
                                </div>
                             </div>
                             <div className="flex gap-3">
                                <button className="px-6 py-3 bg-white border border-slate-200 text-rose-600 font-black rounded-xl text-[10px] uppercase tracking-[0.1em] hover:bg-rose-50 transition-all border-b-2 active:translate-y-0.5">Reject Action</button>
                                <button className="px-6 py-3 bg-slate-900 text-white font-black rounded-xl text-[10px] uppercase tracking-[0.1em] hover:bg-emerald-600 transition-all shadow-xl shadow-slate-900/20 active:translate-y-0.5">Approve Model</button>
                             </div>
                          </div>
                          <div className="p-4 bg-white/80 rounded-2xl border border-amber-200/50 shadow-inner">
                             <p className="text-sm font-bold text-amber-900/80 leading-relaxed italic">"{item.reason}"</p>
                          </div>
                       </div>
                    </div>
                 ))
              ) : (
                MOCK_AI_LOGS.filter(l => l.type === activeModel || activeModel === 'moderation').map((log) => (
                  <div key={log.id} className="p-8 bg-white border border-slate-100 rounded-3xl hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/10 transition-all group flex flex-col sm:flex-row items-start gap-8 border-b-2">
                    <div className={cn(
                       "p-5 rounded-2xl shadow-xl transition-all group-hover:scale-105",
                       log.status === 'flagged' ? "bg-rose-50 text-rose-500 shadow-rose-200/30" : "bg-emerald-50 text-emerald-500 shadow-emerald-200/30"
                    )}>
                       {log.status === 'flagged' ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                    </div>
                    <div className="flex-1 space-y-4">
                       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                             <h4 className="text-lg font-black text-slate-900 flex items-center gap-3 italic">
                                {log.id} 
                                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full" />
                                <span className={cn(
                                   "text-[10px] px-3 py-1 rounded-full uppercase tracking-widest font-black font-sans",
                                   log.status === 'flagged' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                                )}>Confidence: {(log.confidence * 100).toFixed(0)}%</span>
                             </h4>
                             <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {log.timestamp}</span>
                                <div className="w-px h-3 bg-slate-300" />
                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest opacity-60">Target: {log.targetId}</span>
                             </div>
                          </div>
                          <div className="flex gap-2">
                             <button className="px-5 py-2.5 bg-slate-100 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border-b-2 active:translate-y-0.5">Override</button>
                             <button className="px-5 py-2.5 bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 active:translate-y-0.5">Telemetry</button>
                          </div>
                       </div>
                       <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100/50 shadow-inner group-hover:bg-slate-100/50 transition-colors">
                          <p className="text-sm font-bold text-slate-700 leading-relaxed">
                             <span className="text-blue-600 uppercase tracking-widest text-[10px] font-black mr-2">Action Report:</span> {renderResult(log)}
                          </p>
                       </div>
                    </div>
                 </div>
                ))
              )}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                  <DollarSign className="w-6 h-6 text-emerald-500" /> Cost & Token Efficiency
               </h3>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Monthly Allowance</span>
            </div>
            <div className="grid grid-cols-2 gap-6 mb-10">
               <div className="p-6 bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                  <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2">Cost Real-time</p>
                  <p className="text-3xl font-black tracking-tight tracking-tighter">31,012,500đ</p>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-blue-600/10 rounded-full blur-xl group-hover:bg-blue-600/20 transition-all" />
               </div>
               <div className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-500/10 group">
                  <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-2">Cache Hit Rate</p>
                  <p className="text-3xl font-black text-emerald-700 tracking-tight tracking-tighter">32.4%</p>
                  <TrendingUp className="absolute top-4 right-4 w-10 h-10 text-emerald-200 group-hover:text-emerald-300 group-hover:rotate-12 transition-all" />
               </div>
            </div>
            <div className="space-y-4">
               {[
                 { provider: 'OpenAI (GPT-4o)', cost: '10,505,000đ', usage: 35 },
                 { provider: 'Google (Gemini 1.5)', cost: '14,502,500đ', usage: 48 },
                 { provider: 'Local (Llama 3)', cost: '6,005,000đ', usage: 17 },
               ].map((p, idx) => (
                 <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                       <span className="font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-blue-500" /> {p.provider}
                       </span>
                       <span className="font-black text-slate-900">{p.cost}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p.usage}%` }} />
                    </div>
                 </div>
               ))}
            </div>
         </div>

         <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40">
            <div className="flex justify-between items-center mb-10">
               <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
                  <LineChart className="w-6 h-6 text-blue-600" /> Multi-Model Arena Performance
               </h3>
               <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-4 py-2 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-all">Start A/B Battle</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                        <th className="pb-5">Neural Model</th>
                        <th className="pb-5">Latency</th>
                        <th className="pb-5 text-right">Accuracy</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {[
                       { name: 'Gemini 1.5 Pro', latency: '420ms', accuracy: '94.2%', highlight: true },
                       { name: 'GPT-4o Mini', latency: '120ms', accuracy: '89.5%', highlight: false },
                       { name: 'Claude 3.5 Sonnet', latency: '650ms', accuracy: '95.8%', highlight: false },
                     ].map((m, idx) => (
                       <tr key={idx} className="group hover:bg-slate-50/80 transition-colors">
                          <td className="py-5 font-black text-slate-800 text-sm">{m.name} {m.highlight && <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-[8px] rounded uppercase tracking-widest">Selected</span>}</td>
                          <td className="py-5 text-slate-500 font-bold text-xs"><Clock className="w-3.5 h-3.5 inline mr-1 text-slate-400" /> {m.latency}</td>
                          <td className="py-5 text-right font-mono font-black text-sm text-emerald-600">{m.accuracy}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
         <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-12 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl border border-slate-800 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-blue-600/20 transition-all duration-1000" />
            
            <div className="relative z-10 space-y-8">
               <div className="flex items-center gap-6">
                  <div className="p-5 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl group-hover:scale-110 transition-transform duration-500">
                     <BarChart4 className="w-10 h-10 text-blue-400" />
                  </div>
                  <h3 className="text-4xl font-black tracking-tight leading-tight italic font-serif">MoE Intelligence <br /> <span className="text-blue-500">Router</span></h3>
               </div>
               <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
                  Tự động phân bổ tác vụ cho các cụm mô hình tối ưu nhất. Giảm thiểu chi phí lên tới 40% bằng cách sử dụng Small Model cho các tác vụ cơ bản.
               </p>
               <div className="flex flex-wrap gap-4 pt-4">
                  <button className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/40 hover:-translate-y-1">Inference Logs</button>
                  <button className="px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all">Optimization Policy</button>
               </div>
            </div>
            <Layers className="absolute -bottom-16 -right-16 w-80 h-80 text-white/5 opacity-50 group-hover:rotate-12 transition-transform duration-1000" />
         </div>

         <div className="bg-white p-12 border border-slate-100 rounded-[2.5rem] shadow-xl shadow-slate-200/40 space-y-10">
            <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
               <Activity className="w-7 h-7 text-blue-600" /> Model Drift & Health Analytics
            </h3>
            <div className="space-y-8">
               {[
                 { name: 'Fraud Detection v4.2', drift: 1.2, health: 'Optimized', statusColor: 'bg-emerald-50 text-emerald-600' },
                 { name: 'Vector Search Encoder', drift: -4.5, health: 'Degraded', statusColor: 'bg-rose-50 text-rose-600' },
                 { name: 'Dynamic Pricing Agent', drift: 0.1, health: 'Stable', statusColor: 'bg-blue-50 text-blue-600' }
               ].map((m, i) => (
                 <div key={i} className="space-y-4 group">
                    <div className="flex justify-between items-center">
                       <span className="font-black text-slate-800 text-base">{m.name}</span>
                       <span className={cn(
                         "text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm",
                         m.statusColor
                       )}>{m.health}</span>
                    </div>
                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden flex shadow-inner">
                       <div 
                         className={cn("h-full transition-all duration-1000 group-hover:opacity-80 rounded-full", 
                           m.health === 'Degraded' ? "bg-rose-500" : 
                           m.health === 'Optimized' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-blue-500")} 
                         style={{ width: `${90 + (i * -12)}%` }} 
                       />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                       <span className={cn(m.drift < 0 ? "text-rose-500" : "text-emerald-600")}>Accuracy Delta: {m.drift}%</span>
                       <span>Node Uptime: 99.99%</span>
                    </div>
                 </div>
               ))}
               <button className="w-full py-5 bg-slate-50 text-slate-500 text-xs font-black rounded-[1.5rem] border border-slate-100 hover:text-blue-600 hover:bg-blue-50 transition-all uppercase tracking-widest border-b-4 active:translate-y-1">View Full Neural Architecture</button>
            </div>
         </div>
      </div>

      {/* Hardware & Resource Grid */}
      <div className="mt-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl p-12 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-1000">
           <Server className="w-64 h-64 rotate-12" />
        </div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 relative z-10">
          <div>
            <h3 className="text-2xl font-black flex items-center gap-4 text-slate-900">
              <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 shadow-xl shadow-emerald-500/10">
                <Server className="w-7 h-7" />
              </div>
              Hardware Cluster Telemetry
            </h3>
            <p className="text-slate-500 font-medium mt-2">Giám sát tải của các cụm GPU NVIDIA dành cho Inference & Fine-tuning.</p>
          </div>
          <button className="px-6 py-3 border border-emerald-200 text-emerald-700 font-black text-[11px] uppercase tracking-widest rounded-xl hover:bg-emerald-50 transition-all flex items-center gap-3 shadow-xl shadow-emerald-700/5 bg-white border-b-4 active:translate-y-1">
             <RefreshCw className="w-4 h-4" /> Sync Cluster State
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
           <div className="border border-slate-100 rounded-3xl p-8 bg-slate-50 relative overflow-hidden group/card hover:shadow-2xl transition-all border-b-4">
             <div className="flex justify-between items-center mb-8">
               <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">Node: A100-80GB</h4>
               <span className="text-[9px] bg-emerald-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20">Training Pool</span>
             </div>
             <div className="space-y-6">
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">
                     <span>VRAM Utilization</span>
                     <span className="text-rose-600">92% Critical</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner flex">
                     <div className="h-full bg-rose-500 w-[92%] rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">
                     <span>GPU Compute Load</span>
                     <span className="text-orange-500">85% High</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner flex">
                     <div className="h-full bg-orange-500 w-[85%] rounded-full"></div>
                  </div>
               </div>
               <div className="pt-4 border-t border-slate-200">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" /> Fine-tuning NLP v4.0
                  </p>
               </div>
             </div>
           </div>

           <div className="border border-blue-100 rounded-3xl p-8 bg-white shadow-2xl shadow-blue-500/10 ring-2 ring-blue-500/5 relative group/card border-b-4">
             <div className="flex justify-between items-center mb-8">
               <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">Node: L4-24GB</h4>
               <span className="text-[9px] bg-blue-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg shadow-blue-600/20">Inference Pool</span>
             </div>
             <div className="space-y-6">
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">
                     <span>VRAM Utilization</span>
                     <span className="text-blue-600">45% Optimal</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                     <div className="h-full bg-blue-500 w-[45%] rounded-full"></div>
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-[0.1em]">
                     <span>Throughput (RPS)</span>
                     <span className="text-emerald-600">2,400 rps</span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
                     <div className="h-full bg-emerald-500 w-[60%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
                  </div>
               </div>
               <div className="pt-4 border-t border-slate-100">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" /> Vision Moderation Active
                  </p>
               </div>
             </div>
           </div>

           <div className="border-2 border-slate-100 border-dashed rounded-3xl p-8 bg-slate-50/50 flex flex-col items-center justify-center min-h-[250px] hover:bg-blue-50/50 hover:border-blue-300 hover:text-blue-600 transition-all cursor-pointer group/add">
              <div className="p-5 bg-white rounded-full shadow-xl group-hover/add:scale-110 transition-transform mb-4 border border-slate-100">
                <Plus className="w-10 h-10 text-slate-300 group-hover/add:text-blue-500" />
              </div>
              <span className="font-black text-xs uppercase tracking-[0.2em] text-slate-400 group-hover/add:text-blue-600">Deploy New Node</span>
              <span className="text-[10px] font-bold text-slate-400 mt-2">Azure / AWS / GCP Cluster</span>
           </div>
        </div>
      </div>
    </div>
  );
}
