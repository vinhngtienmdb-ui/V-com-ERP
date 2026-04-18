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
  Settings
} from 'lucide-react';
import { cn } from '../lib/utils';
import { AiTaskResult } from '../types/erp';

const MOCK_AI_LOGS: AiTaskResult[] = [
  { id: 'AI-101', type: 'image_moderation', targetId: 'PRD-002', confidence: 0.98, status: 'flagged', result: { reason: 'Hình ảnh chứa watermark thương hiệu khác' }, timestamp: '10 phút trước' },
  { id: 'AI-102', type: 'dynamic_pricing', targetId: 'PRD-001', confidence: 0.85, status: 'fixed', result: { oldPrice: 34990000, newPrice: 34500000, reason: 'Cạnh tranh giá so với sàn Shopee' }, timestamp: '2 giờ trước' },
  { id: 'AI-103', type: 'fraud_alert', targetId: 'USR-8821', confidence: 0.92, status: 'flagged', result: { risk: 'Buff đơn ảo (Click farming)', location: 'IP Cluster' }, timestamp: '1 giờ trước' },
];

export function AIOperations() {
  const [activeModel, setActiveModel] = useState<'moderation' | 'pricing' | 'fraud'>('moderation');

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
        <div className="bg-[#111827] text-white p-6 rounded-xl relative overflow-hidden group shadow-xl">
           <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
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
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
           <div className="p-3 bg-emerald-50 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
           </div>
           <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Duyệt AI tự động</p>
              <div className="text-xl font-bold text-[#111827]">8,421 <span className="text-xs font-normal text-slate-400">task/day</span></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
           <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
           </div>
           <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Cảnh báo rủi ro</p>
              <div className="text-xl font-bold text-red-600">12 <span className="text-xs font-normal text-slate-400">flags</span></div>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm flex items-center gap-4">
           <div className="p-3 bg-blue-50 rounded-lg">
              <Activity className="w-6 h-6 text-[#2563EB]" />
           </div>
           <div>
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Latent Space Latency</p>
              <div className="text-xl font-bold text-[#111827]">140ms</div>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg overflow-hidden p-2">
        <div className="flex border-b border-[#F3F4F6] bg-slate-50/50 overflow-x-auto whitespace-nowrap scrollbar-hide rounded-t-[2rem]">
           {[
             { id: 'moderation', label: 'AI Content Guard', icon: ShieldCheck },
             { id: 'pricing', label: 'Dynamic Price AI', icon: Zap },
             { id: 'fraud', label: 'Fraud Detection', icon: AlertTriangle }
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
                 <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Real-time Streaming Tasks
              </div>
           </div>

           <div className="space-y-4">
              {MOCK_AI_LOGS.filter(l => l.type === activeModel || activeModel === 'moderation').map((log) => (
                 <div key={log.id} className="p-6 bg-white border border-[#F3F4F6] rounded-xl hover:border-[#2563EB]/30 transition-all group flex items-start gap-6">
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
                             <button className="px-5 py-2 bg-slate-100 text-[#111827] font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Ghi đè (Override)</button>
                             <button className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all">Chi tiết Model</button>
                          </div>
                       </div>
                       <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100/50">
                          <p className="text-sm font-medium text-slate-700 leading-relaxed">
                             <span className="font-bold text-slate-900">Mô tả hành động:</span> {JSON.stringify(log.result)}
                          </p>
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
         <div className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] p-10 rounded-xl text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                     <BarChart4 className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl font-extrabold tracking-tight font-serif italic">MoE Analytics</h3>
               </div>
               <p className="text-blue-100/80 leading-relaxed max-w-md">
                  Phân tích dữ liệu từ hàng tỷ tham số để tối ưu hóa tỷ lệ chuyển đổi. Hệ thống Mixture of Experts tự động điều phối task cho model phù hợp nhất dựa trên chi phí và độ chính xác.
               </p>
               <div className="flex gap-4 pt-4">
                  <button className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg text-sm hover:translate-y-[-2px] transition-all shadow-xl shadow-blue-900/10">Inference Logs</button>
                  <button className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold rounded-lg text-sm hover:bg-white/20 transition-all">Cost Analysis</button>
               </div>
            </div>
            <Layers className="absolute -bottom-12 -right-12 w-64 h-64 text-white/5 opacity-50" />
         </div>

         <div className="bg-white p-10 border border-[#E5E7EB] rounded-xl shadow-sm space-y-8">
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
    </div>
  );
}
