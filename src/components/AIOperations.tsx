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
  Clock
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
  { id: 'RVW-882', type: 'dynamic_pricing', targetId: 'PRD-121', confidence: 0.74, reason: 'Giá giảm quá sâu (>50%) cần xác nhận', timestamp: '12 phút trước' },
];

export function AIOperations() {
  const [activeModel, setActiveModel] = useState<'moderation' | 'pricing' | 'fraud' | 'recommendation' | 'chatbot' | 'review'>('moderation');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Trung tâm Vận hành AI (AIOps)</h1>
          <p className="text-sm text-[#6B7280] mt-1">Điều phối và giám sát các mô hình AI vận hành toàn sàn thương mại.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Cấu hình Model
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
             <RefreshCw className="w-4 h-4" />
             Re-train MoE Models
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111827] text-white p-6 rounded-lg relative overflow-hidden group shadow-xl">
           <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <Cpu className="w-6 h-6" />
                 </div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Models</span>
              </div>
              <div>
                 <div className="text-2xl font-bold">12 Agents</div>
                 <p className="text-[10px] text-[#10B981] font-bold mt-1 tracking-tight">System Health: 99.9%</p>
              </div>
           </div>
           <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm flex items-center gap-4">
           <div className="p-3 bg-emerald-50 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
           </div>
           <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Duyệt AI tự động</p>
              <div className="text-xl font-bold text-[#111827]">8,421 <span className="text-xs font-normal text-slate-400">task/day</span></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm flex items-center gap-4">
           <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
           </div>
           <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Cảnh báo rủi ro</p>
              <div className="text-xl font-bold text-red-600">12 <span className="text-xs font-normal text-slate-400">flags</span></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm flex items-center gap-4">
           <div className="p-3 bg-blue-50 rounded-lg">
              <Activity className="w-6 h-6 text-[#2563EB]" />
           </div>
           <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Latent Space Latency</p>
              <div className="text-xl font-bold text-[#111827]">140ms</div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-lg overflow-hidden p-2">
        <div className="flex border-b border-[#F3F4F6] bg-slate-50/50 overflow-x-auto whitespace-nowrap scrollbar-hide rounded-t-[2rem]">
           {[
             { id: 'moderation', label: 'AI Content Guard', icon: ShieldCheck },
             { id: 'pricing', label: 'Dynamic Price AI', icon: Zap },
             { id: 'fraud', label: 'Fraud Detection', icon: AlertTriangle },
             { id: 'recommendation', label: 'Recommendation', icon: Network },
             { id: 'chatbot', label: 'CSKH (Bot)', icon: Bot },
             { id: 'review', label: 'Review Queue', icon: UserCheck }
           ].map((tab) => (
             <button 
                key={tab.id}
                onClick={() => setActiveModel(tab.id as any)}
                className={cn(
                  "px-8 py-5 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
                  activeModel === tab.id ? "border-[#2563EB] text-[#2563EB] bg-white translate-y-[1px]" : "border-transparent text-[#6B7280] hover:text-[#111827]"
                )}
             >
                <tab.icon className="w-4 h-4" /> {tab.label}
             </button>
           ))}
        </div>

        <div className="p-6">
           <div className="flex justify-between items-center mb-6">
              <div className="flex gap-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input 
                      type="text" 
                      placeholder="Tìm ID xử lý của AI..." 
                      className="bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-64 ring-blue-500/20 focus:ring-4 transition-all"
                    />
                 </div>
                 <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-bold text-slate-500 flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Lọc Độ tin cậy (Confidence)
                 </button>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Live Feed
              </div>
           </div>

           <div className="space-y-4">
              {activeModel === 'review' ? (
                 MOCK_HUMAN_QUEUE.map((item) => (
                    <div key={item.id} className="p-6 bg-amber-50/30 border border-amber-200 rounded-lg flex items-start gap-6">
                       <div className="p-4 rounded-lg bg-amber-100 text-amber-600">
                          <UserCheck className="w-6 h-6" />
                       </div>
                       <div className="flex-1 space-y-2">
                          <div className="flex justify-between">
                             <div>
                                <h4 className="font-bold text-[#111827] flex items-center gap-3">
                                   {item.id}
                                   <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded uppercase tracking-widest font-bold">Manual Review</span>
                                </h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">{item.timestamp} • Confidence: {(item.confidence * 100).toFixed(0)}%</p>
                             </div>
                             <div className="flex gap-2">
                                <button className="px-4 py-2 bg-white border border-slate-200 text-red-600 font-bold rounded-lg text-[10px] uppercase hover:bg-red-50 transition-all">Reject</button>
                                <button className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-[10px] uppercase hover:bg-emerald-700 transition-all shadow-sm">Approve AI</button>
                             </div>
                          </div>
                          <div className="p-3 bg-white/80 rounded-lg border border-amber-100">
                             <p className="text-sm font-medium text-slate-700 leading-relaxed italic text-amber-900/70">"{item.reason}"</p>
                          </div>
                       </div>
                    </div>
                 ))
              ) : (
                MOCK_AI_LOGS.filter(l => l.type === activeModel || activeModel === 'moderation').map((log) => (
                  <div key={log.id} className="p-6 bg-white border border-[#F3F4F6] rounded-lg hover:border-[#2563EB]/30 transition-all group flex items-start gap-6">
                    <div className={cn(
                       "p-4 rounded-lg",
                       log.status === 'flagged' ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-500"
                    )}>
                       {log.status === 'flagged' ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 space-y-2">
                       <div className="flex justify-between">
                          <div>
                             <h4 className="font-bold text-[#111827] flex items-center gap-3 italic">
                                {log.id} 
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-[10px] text-slate-400 not-italic uppercase tracking-widest font-sans">Confidence: {(log.confidence * 100).toFixed(0)}%</span>
                             </h4>
                             <p className="text-[10px] text-slate-400 mt-0.5">{log.timestamp} • Target: {log.targetId}</p>
                          </div>
                          <div className="flex gap-2">
                             <button className="px-5 py-2 bg-slate-100 text-[#111827] font-bold rounded-lg text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Ghi đè (Override)</button>
                             <button className="px-5 py-2 bg-slate-900 text-white font-bold rounded-lg text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all">Chi tiết Model</button>
                          </div>
                       </div>
                       <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100/50">
                          <p className="text-sm font-medium text-slate-700 leading-relaxed">
                             <span className="font-bold text-slate-900">Mô tả hành động:</span> {renderResult(log)}
                          </p>
                       </div>
                    </div>
                 </div>
                ))
              )}
           </div>
        </div>
      </div>

      {/* Additional Stats: Cost & Performance Arena */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {/* Feature 1: AI Budget Monitoring */}
         <div className="bg-white p-8 rounded-lg border border-[#E5E7EB] shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-emerald-500" /> AI Spending & Budget
               </h3>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Monthly Limit: $2,500</span>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">MTD Spending</p>
                  <p className="text-xl font-bold text-slate-900">$1,240.50</p>
               </div>
               <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Token Cache Rate</p>
                  <p className="text-xl font-bold text-emerald-600">32.4%</p>
               </div>
            </div>
            <div className="space-y-3">
               {[
                 { provider: 'OpenAI (GPT-4o)', cost: '$420.2', usage: 'High' },
                 { provider: 'Google (Gemini 1.5)', cost: '$580.1', usage: 'Med' },
                 { provider: 'Self-Hosted (Llama 3)', cost: '$240.2', usage: 'Low' },
               ].map((p, idx) => (
                 <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 pb-2">
                    <div className="flex items-center gap-2">
                       <Globe className="w-3 h-3 text-slate-400" />
                       <span className="font-medium text-slate-700">{p.provider}</span>
                    </div>
                    <span className="font-bold text-slate-900">{p.cost}</span>
                 </div>
               ))}
            </div>
         </div>

         {/* Feature 2: Model Arena Performance */}
         <div className="bg-white p-8 rounded-lg border border-[#E5E7EB] shadow-sm">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold flex items-center gap-3">
                  <LineChart className="w-5 h-5 text-blue-600" /> Model Arena Results
               </h3>
               <button className="text-[10px] font-bold text-blue-600 hover:underline px-2 py-1 bg-blue-50 rounded">Run A/B Test</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-3">Model Engine</th>
                        <th className="pb-3">Latency</th>
                        <th className="pb-3 text-right">Accuracy</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {[
                       { name: 'Gemini 1.5 Pro', latency: '420ms', accuracy: '94.2%' },
                       { name: 'GPT-4o Mini', latency: '120ms', accuracy: '89.5%' },
                       { name: 'Claude 3.5 Sonnet', latency: '650ms', accuracy: '95.8%' },
                     ].map((m, idx) => (
                       <tr key={idx} className="text-xs group hover:bg-slate-50/50">
                          <td className="py-3 font-bold text-slate-800">{m.name}</td>
                          <td className="py-3 text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {m.latency}</td>
                          <td className="py-3 text-right font-mono font-bold text-emerald-600">{m.accuracy}</td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
         <div className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] p-10 rounded-lg text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
                     <BarChart4 className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight font-serif italic">MoE Analytics & Routing</h3>
               </div>
               <p className="text-blue-100/80 leading-relaxed max-w-md">
                  Phân tích dữ liệu từ hàng tỷ tham số để tối ưu hóa tỷ lệ chuyển đổi. Hệ thống Mixture of Experts tự động điều phối task cho model dựa trên chi phí phân bổ (LLaMA 3, GPT-4o, Gemini 1.5).
               </p>
               <div className="flex gap-4 pt-4">
                  <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg text-sm hover:translate-y-[-2px] transition-all shadow-xl shadow-blue-900/10">Inference Logs</button>
                  <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-lg text-sm hover:bg-white/20 transition-all">Cost Analysis</button>
               </div>
            </div>
            <Layers className="absolute -bottom-12 -right-12 w-64 h-64 text-white/5 opacity-50" />
         </div>

         <div className="bg-white p-10 border border-[#E5E7EB] rounded-lg shadow-sm space-y-8">
            <h3 className="text-xl font-bold text-[#111827] flex items-center gap-3">
               <Activity className="w-6 h-6 text-blue-600" /> Model Performance Drifts
            </h3>
            <div className="space-y-6">
               {[
                 { name: 'Fraud Shield v4', drift: 1.2, health: 'Stable' },
                 { name: 'Vector Search v2', drift: -4.5, health: 'Warning' },
                 { name: 'Price Opt Hybrid', drift: 0.1, health: 'Stable' }
               ].map((m, i) => (
                 <div key={i} className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                       <span className="font-bold text-[#111827]">{m.name}</span>
                       <span className={cn(
                         "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                         m.health === 'Stable' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                       )}>{m.health}</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden flex">
                       <div 
                         className={cn("h-full transition-all duration-1000", m.health === 'Stable' ? "bg-emerald-500" : "bg-red-500")} 
                         style={{ width: `${90 + (i * -10)}%` }} 
                       />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                       <span>Drift: {m.drift}%</span>
                       <span>Uptime: 99.99%</span>
                    </div>
                 </div>
               ))}
               <button className="w-full py-4 bg-slate-50 text-slate-400 text-xs font-bold rounded-lg border border-slate-100 hover:text-[#111827] hover:bg-slate-100 transition-all uppercase tracking-widest">Xem toàn bộ Registry Model</button>
            </div>
         </div>
      </div>

      {/* Hardware & Resource Grid */}
      <div className="mt-8 bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-3">
              <Server className="w-6 h-6 text-[#10B981]" /> Hardware & Compute Orchestration
            </h3>
            <p className="text-sm text-slate-500 mt-1">Giám sát tải của các cụm GPU dành cho AI Serving & Training.</p>
          </div>
          <button className="px-4 py-2 border border-emerald-200 text-emerald-700 font-bold text-sm rounded-lg hover:bg-emerald-50 transition-all flex items-center gap-2">
             <RefreshCw className="w-4 h-4" /> Sync Cluster
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="border border-slate-200 rounded-lg p-6 bg-slate-50">
             <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold text-slate-800">Cụm A100-80GB</h4>
               <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-bold">LLM Training</span>
             </div>
             <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                     <span>VRAM Usage</span>
                     <span>92% (73/80GB)</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-red-500 w-[92%]"></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                     <span>Compute Load</span>
                     <span>85%</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-orange-500 w-[85%]"></div>
                  </div>
               </div>
               <p className="text-[10px] text-slate-400 font-mono mt-4">Current task: Fine-tuning Vietnamese NLP</p>
             </div>
           </div>

           <div className="border border-slate-200 rounded-lg p-6 bg-white shadow-sm ring-1 ring-blue-500/20">
             <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold text-slate-800">Cụm L4-24GB (Inference)</h4>
               <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">Serving</span>
             </div>
             <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                     <span>VRAM Usage</span>
                     <span>45% (11/24GB)</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-blue-500 w-[45%]"></div>
                  </div>
               </div>
               <div>
                  <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                     <span>Requests / sec</span>
                     <span>2,400 rps</span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                     <div className="h-full bg-[#10B981] w-[60%]"></div>
                  </div>
               </div>
               <p className="text-[10px] text-slate-400 font-mono mt-4">Models: Content Guard, RecSys</p>
             </div>
           </div>

           <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 text-slate-400 border-dashed flex flex-col items-center justify-center min-h-[200px] hover:bg-blue-50/50 hover:border-blue-300 hover:text-blue-500 transition-colors cursor-pointer group">
              <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
              <span className="font-bold">Provision New Cluster</span>
              <span className="text-xs font-medium mt-1">AWS / GCP Integrations</span>
           </div>
        </div>
      </div>
    </div>
  );
}

function Plus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
