import { DraggableGrid } from './ui/DraggableGrid';
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
 LineChart as LineChartIcon,
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
import { db, collection, addDoc } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

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
 Sử dụng model <span className="font-mono text-xs bg-slate-200 px-1 py-0.5 rounded text-slate-900">{log.result.engine}</span> để thay đổi: {log.result.action}
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
  const [activeModel, setActiveModel] = useState<'moderation' | 'pricing' | 'fraud' | 'recommendation' | 'chatbot' | 'review' | 'db_inspector'>('moderation');
 const { staffInfo, user } = useAuth();
 
 // Custom neural diagnostics states
 const [customPrompt, setCustomPrompt] = useState('');
 const [insightOutput, setInsightOutput] = useState('');
 const [isLoadingInsight, setIsLoadingInsight] = useState(false);
 const [insightSimulated, setInsightSimulated] = useState(false);
 const [diagnosticType, setDiagnosticType] = useState<'fraud' | 'pricing' | 'general'>('general');
 const [insightStatusMsg, setInsightStatusMsg] = useState('');

 const handleGenerateDiagnostics = async (type: 'fraud' | 'pricing' | 'general', promptText: string) => {
   setIsLoadingInsight(true);
   setInsightOutput('');
   setInsightStatusMsg('Đang gửi yêu cầu phân tích nơ-ron...');
   setDiagnosticType(type);
   
   try {
     const response = await fetch('/api/gemini/diagnostics', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ prompt: promptText, type }),
     });
     const data = await response.json();
     if (data.error) {
       setInsightOutput(`### ❌ Lỗi phân tích\n\${data.error}`);
     } else {
       setInsightOutput(data.text || '');
       setInsightSimulated(!!data.simulated);
       setInsightStatusMsg('Phân tích hoàn tất thành công!');
     }
   } catch (e: any) {
     setInsightOutput(`### ❌ Lỗi kết nối\nKhông thể kết nối đến máy chủ AI: \${e.message || e}`);
   } finally {
     setIsLoadingInsight(false);
   }
 };

 const handleApplyMitigation = async () => {
   if (!insightOutput) return;
   setInsightStatusMsg('Đang ghi nhận cấu hình quyết định vào blockchain/audit logs...');
   
   try {
     const email = user?.email || staffInfo?.username || 'admin@v-erp.com';
     const tenantId = staffInfo?.tenantId || 'tenant-vcomm-prod-01';
     
     const payload = {
       email,
       userId: user?.uid || 'admin-ai-system',
       action: `Apply Gemini AI Mitigation [\${diagnosticType.toUpperCase()}]`,
       status: 'Success',
       timestamp: new Date().toISOString(),
       userAgent: navigator.userAgent,
       browser: 'AIOps Engine (Gemini 3.5)',
       ipAddress: '127.0.0.1',
       tenantId
     };
     
     // Write to Firestore admin_audit_logs root collection
     await addDoc(collection(db, 'admin_audit_logs'), payload);
     
     // Write to nested tenant subcollection
     await addDoc(collection(db, 'tenants', tenantId, 'audit_logs'), payload);
     
     setInsightStatusMsg('Áp dụng chính sách thành công! Đã đồng bộ lên lịch sử Audit Logs.');
     alert('Đã áp dụng đề xuất thành công và lưu vết kiểm toán (Audit Trail) hệ thống!');
   } catch (err: any) {
     console.error('Failed to log audit of mitigation:', err);
     setInsightStatusMsg(`Lỗi ghi nhận: \${err.message || err}`);
   }
 };

 const renderInsightText = (text: string) => {
   return text.split('\n').map((line, index) => {
     if (line.startsWith('###')) {
       return <h3 key={index} className="text-sm uppercase tracking-wider font-black text-slate-100 flex items-center gap-2 mt-4 first:mt-0 mb-2 italic border-b border-light-900 pb-1">{line.replace('###', '')}</h3>;
     }
     if (line.startsWith('####')) {
       return <h4 key={index} className="text-xs font-black uppercase tracking-wider text-orange-400 mt-3 mb-1.5">{line.replace('####', '')}</h4>;
     }
     if (line.startsWith('- **') || line.startsWith('* **')) {
       const parts = line.split('**');
       if (parts.length >= 3) {
         return (
           <li key={index} className="list-none pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-orange-500 text-xs text-slate-300 leading-relaxed mb-1.5">
             <strong className="text-slate-100 font-bold">{parts[1]}</strong>{parts.slice(2).join('')}
           </li>
         );
       }
     }
     if (line.startsWith('-') || line.startsWith('*')) {
       return (
         <li key={index} className="list-none pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-orange-500 text-xs text-slate-300 leading-relaxed mb-1.5">
           {line.substring(2)}
         </li>
       );
     }
     if (line.trim() === '') return <div key={index} className="h-2" />;
     return <p key={index} className="text-xs text-slate-300 leading-relaxed mb-1.5">{line}</p>;
   });
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-700 pb-12">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 bg-blue-950/50 border border-blue-900 px-2 py-0.5 rounded-none">Trung tâm Mạng Nơ-ron</span>
 <div className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
 </div>
 <h1 className="font-serif tracking-tight text-3xl font-black text-slate-900 tracking-tight">AI Operations <span className="text-orange-700">(AIOps)</span></h1>
 <p className="text-sm text-slate-600 font-medium mt-1">Điều phối và giám sát hệ thống Multi-Agent vận hành toàn sàn thương mại.</p>
 </div>
 <div className="flex flex-wrap gap-3">
 <button className="bg-white border border-slate-300 px-5 py-2.5 rounded-none text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm border-b-2 active:translate-y-0.5">
 <Settings className="w-4 h-4 text-slate-500" />
 Cấu hình tham số
 </button>
 <button className="bg-slate-900 text-[#FAF9F5] px-5 py-2.5 rounded-none text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95">
 <RefreshCw className="w-4 h-4" />
 Re-Train All Models
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-stone-950 text-[#FAF9F5] p-7 rounded-none relative overflow-hidden group shadow-sm border border-slate-800">
 <div className="relative z-10 flex flex-col justify-between h-full">
 <div className="flex justify-between items-start mb-6">
 <div className="p-3 bg-slate-900 rounded-none shadow-sm shadow-slate-900/5  transition-transform duration-500">
 <Cpu className="w-6 h-6" />
 </div>
 <div className="flex flex-col items-end">
 <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">System Health</span>
 <span className="text-xs font-bold text-emerald-400">99.99%</span>
 </div>
 </div>
 <div>
 <div className="text-3xl font-black tracking-tight">12 Tác nhân</div>
 <p className="text-[10px] text-slate-500 font-bold mt-2 uppercase tracking-widest">Các Nút Nơ-ron Hoạt động</p>
 </div>
 </div>
 <div className="absolute top-0 right-0 w-32 h-32 bg-slate-900/5 rounded-full blur-3xl" />
 <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 text-[#FAF9F5]/5 group-hover:rotate-12 transition-transform duration-1000" />
 </div>

 {[
 { label: 'Duyệt AI tự động', value: '8,421', sub: 'Tác vụ / 24h', icon: ShieldCheck, color: 'emerald' },
 { label: 'Cảnh báo rủi ro', value: '12', sub: 'Detected today', icon: AlertTriangle, color: 'rose', alert: true },
 { label: 'Độ trễ suy luận', value: '140ms', sub: 'Avg Response', icon: Activity, color: 'blue' },
 ].map((stat) => (
 <div key={stat.label} className="bg-white p-7 rounded-none border border-slate-200 shadow-sm shadow-slate-200/50 flex items-center gap-6 group hover:shadow-slate-900/5 transition-all">
 <div className={cn(
 "p-4 rounded-none transition-transform  duration-500",
 stat.alert ? "bg-rose-50 text-rose-600 border border-rose-100" : "bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-slate-100 group-hover:text-orange-700"
 )}>
 <stat.icon className="w-6 h-6" />
 </div>
 <div>
 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{stat.label}</p>
 <div className={cn("text-2xl font-black tracking-tight", stat.alert ? "text-rose-600" : "text-slate-900")}>
 {stat.value}
 </div>
 <p className="text-[10px] text-slate-600 font-bold mt-0.5">{stat.sub}</p>
 </div>
 </div>
 ))}
 </DraggableGrid>

 <div className="bg-white rounded-none border border-slate-200 shadow-sm overflow-hidden">
 <div className="flex border-b border-slate-200 bg-slate-50/30 p-2 overflow-x-auto whitespace-nowrap scrollbar-hide min-w-0">
 {[
 { id: 'moderation', label: 'Bảo vệ Nội dung', icon: ShieldCheck },
 { id: 'pricing', label: 'AI Giá linh hoạt', icon: Zap },
 { id: 'fraud', label: 'Phát hiện Gian lận', icon: AlertTriangle },
 { id: 'recommendation', label: 'Gợi ý Sản phẩm', icon: Network },
 { id: 'chatbot', label: 'CSKH (Bot AI)', icon: Bot },
 { id: 'review', label: 'Human-in-the-loop', icon: UserCheck },
 { id: 'db_inspector', label: 'AI Database Inspector', icon: Terminal }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveModel(tab.id as any)}
 className={cn(
 "px-6 py-4 text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 rounded-none",
 activeModel === tab.id ? "bg-slate-900 text-[#FAF9F5] shadow-sm shadow-slate-900/5" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 <div className="p-6">
 <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
 <div className="flex gap-4 w-full md:w-auto">
 <div className="relative flex-1 md:flex-initial">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input 
 type="text" 
 placeholder="Tìm ID xử lý của AI..." 
 className="bg-slate-50 border border-slate-300 rounded-lg pl-12 pr-6 py-3 text-sm focus:outline-none w-full md:w-80 ring-orange-600/10 focus:ring-4 transition-all"
 />
 </div>
 <button className="bg-white border border-slate-300 px-5 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-all">
 <Filter className="w-4 h-4" /> Filter Confidence
 </button>
 </div>
 <div className="flex items-center gap-3 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" /> Live Inference Stream
 </div>
 </div>

 <div className="space-y-4">
 {activeModel === 'db_inspector' ? (
 <AiDatabaseInspector />
 ) : activeModel === 'review' ? (
 MOCK_HUMAN_QUEUE.map((item) => (
 <div key={item.id} className="p-6 bg-amber-50/30 border border-amber-200 rounded-lg flex flex-col sm:flex-row items-start gap-6 group">
 <div className="p-5 rounded-lg bg-white shadow-sm shadow-amber-200/50 text-amber-600 border border-amber-100  transition-transform">
 <UserCheck className="w-8 h-8" />
 </div>
 <div className="flex-1 space-y-4">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h4 className="text-lg font-black text-slate-900 flex items-center gap-3">
 {item.id}
 <span className="text-[10px] bg-amber-600 text-[#FAF9F5] px-3 py-1 rounded-full uppercase tracking-[0.1em] font-black shadow-sm shadow-amber-600/20">Chờ người duyệt</span>
 </h4>
 <div className="flex items-center gap-3 mt-1.5">
 <span className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5">
 <Clock className="w-3.5 h-3.5" /> {item.timestamp}
 </span>
 <div className="w-px h-3 bg-slate-300" />
 <span className="text-[11px] text-slate-600 font-bold uppercase tracking-widest">Confidence: {(item.confidence * 100).toFixed(0)}%</span>
 </div>
 </div>
 <div className="flex gap-3">
 <button className="px-6 py-3 bg-white border border-slate-300 text-rose-600 font-black rounded-lg text-[10px] uppercase tracking-[0.1em] hover:bg-rose-50 transition-all border-b-2 active:translate-y-0.5">Reject Action</button>
 <button className="px-6 py-3 bg-slate-900 text-[#FAF9F5] font-black rounded-lg text-[10px] uppercase tracking-[0.1em] hover:bg-emerald-600 transition-all shadow-sm shadow-slate-900/20 active:translate-y-0.5">Approve Model</button>
 </div>
 </div>
 <div className="p-4 bg-white/80 rounded-lg border border-amber-200/50 shadow-inner">
 <p className="text-sm font-bold text-amber-900/80 leading-relaxed italic">"{item.reason}"</p>
 </div>
 </div>
 </div>
 ))
 ) : (
 MOCK_AI_LOGS.filter(l => l.type === activeModel || activeModel === 'moderation').map((log) => (
 <div key={log.id} className="p-6 bg-white border border-slate-200 rounded-lg hover:border-orange-200 hover:shadow-sm hover:shadow-slate-900/5 transition-all group flex flex-col sm:flex-row items-start gap-6 border-b-2">
 <div className={cn(
 "p-5 rounded-lg shadow-sm transition-all ",
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
 <span className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {log.timestamp}</span>
 <div className="w-px h-3 bg-slate-300" />
 <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Target: {log.targetId}</span>
 </div>
 </div>
 <div className="flex gap-2">
 <button className="px-5 py-2.5 bg-slate-100 text-slate-900 font-black rounded-lg text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border-b-2 active:translate-y-0.5">Override</button>
 <button className="px-5 py-2.5 bg-slate-900 text-[#FAF9F5] font-black rounded-lg text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm shadow-blue-200 active:translate-y-0.5">Telemetry</button>
 </div>
 </div>
 <div className="p-5 bg-slate-50 rounded-lg border border-slate-200/50 shadow-inner group-hover:bg-slate-100/50 transition-colors">
 <p className="text-sm font-bold text-slate-800 leading-relaxed">
 <span className="text-orange-700 uppercase tracking-widest text-[10px] font-black mr-2">Action Report:</span> {renderResult(log)}
 </p>
 </div>
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 </div>

   {/* Gemini Real-time AI Operations Analyzer Console */}
  <div className="bg-[#0b1329] text-[#f8fafc] p-6 rounded-lg border border-slate-800 shadow-xl overflow-hidden relative group my-6">
    {/* Background pulse elements */}
    <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none -mr-40 -mt-40 animate-pulse duration-[8000ms]" />
    
    <div className="relative z-10 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-950 border border-blue-900 rounded-lg text-orange-500">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-black font-sans tracking-tight flex items-center gap-2 text-slate-100">
              Gemini 3.5 Neural Insights Console
              <span className="bg-slate-800 text-[9px] font-bold text-orange-400 px-2 py-0.5 rounded tracking-normal normal-case">VComm AIOps Edition</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Truy vấn sâu nơ-ron đa nhiệm sử dụng Gemini Agent phục vụ kiểm toán phân tích rủi ro & giá động.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {insightOutput && (
            <span className={cn(
              "text-[10px] uppercase font-black tracking-wider px-3.5 py-1.5 rounded-full",
              insightSimulated 
                ? "bg-amber-950/80 border border-amber-900/60 text-amber-400" 
                : "bg-emerald-950/80 border border-emerald-900/60 text-emerald-400"
            )}>
              {insightSimulated ? "💡 Chế độ mô phỏng" : "⚡ Đã kết nối Live Gemini API"}
            </span>
          )}
        </div>
      </div>

      {/* Preset Tasks / Prompts */}
      <div className="space-y-3">
        <label className="text-[10px] text-slate-400 font-black uppercase tracking-[0.15em] block">Nhiệm vụ phân tích ERP khẩn cấp:</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button 
            type="button"
            onClick={() => {
              const p = "Quét phát hiện click farm và buff đơn ảo hàng loạt đối với khách hàng mới tạo dưới 48 giờ từ dải IP liên kết.";
              setCustomPrompt(p);
              handleGenerateDiagnostics('fraud', p);
            }}
            disabled={isLoadingInsight}
            className="p-4 bg-[#141d36] hover:bg-[#1b274c] border border-slate-800 hover:border-slate-700 text-left rounded-lg transition-all group/btn disabled:opacity-50 text-xs flex flex-col justify-between space-y-3 h-full border-b-2 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="p-1.5 bg-rose-950/50 border border-rose-900 rounded text-rose-500"><AlertTriangle className="w-4 h-4" /></span>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#f8fafc]/40">Độ khẩn: Cao</span>
            </div>
            <div>
              <p className="font-bold text-slate-200 group-hover/btn:text-slate-100">Quét Gian Lận & Đơn Ảo</p>
              <p className="text-[10px] text-slate-400 font-normal mt-1 leading-relaxed text-slate-400">Nhận diện click farm, spam dải IP, đề xuất tự động khóa.</p>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => {
              const p = "Tối ưu hóa giá bán linh hoạt sản phẩm điện thoại iPhone và phụ kiện Apple thiết lập bám cạnh đối thủ tuần này.";
              setCustomPrompt(p);
              handleGenerateDiagnostics('pricing', p);
            }}
            disabled={isLoadingInsight}
            className="p-4 bg-[#141d36] hover:bg-[#1b274c] border border-slate-800 hover:border-slate-700 text-left rounded-lg transition-all group/btn disabled:opacity-50 text-xs flex flex-col justify-between space-y-3 h-full border-b-2 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="p-1.5 bg-emerald-950/50 border border-emerald-900 rounded text-emerald-500"><DollarSign className="w-4 h-4" /></span>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#f8fafc]/40">Đối soát: Giá động</span>
            </div>
            <div>
              <p className="font-bold text-slate-200 group-hover/btn:text-slate-100">Tối Ưu Giá Bán Động</p>
              <p className="text-[10px] text-slate-400 font-normal mt-1 leading-relaxed text-slate-400">Phân bổ biên lợi nhuận và thiết lập giá tối ưu theo thị trường.</p>
            </div>
          </button>

          <button 
            type="button"
            onClick={() => {
              const p = "Kiểm tra 48 đơn hàng vi phạm cam kết SLA giao vận vượt mức 24 giờ chưa bàn giao kho tự động chuyển tiếp đối tác.";
              setCustomPrompt(p);
              handleGenerateDiagnostics('general', p);
            }}
            disabled={isLoadingInsight}
            className="p-4 bg-[#141d36] hover:bg-[#1b274c] border border-slate-800 hover:border-slate-700 text-left rounded-lg transition-all group/btn disabled:opacity-50 text-xs flex flex-col justify-between space-y-3 h-full border-b-2 cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span className="p-1.5 bg-blue-950/50 border border-blue-900 rounded text-blue-500"><Layers className="w-4 h-4" /></span>
              <span className="text-[8px] font-black uppercase tracking-widest text-[#f8fafc]/40">Vận hành: Đầy đủ</span>
            </div>
            <div>
              <p className="font-bold text-slate-200 group-hover/btn:text-slate-100">Giải Quyết Vi Phạm SLA</p>
              <p className="text-[10px] text-slate-400 font-normal mt-1 leading-relaxed text-slate-400">Phân luồng đối tác giao vận, kiểm soát độ trễ giao nhận.</p>
            </div>
          </button>
        </div>
      </div>

      {/* Input box */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-[10px] text-slate-400 font-black uppercase tracking-[0.1em]">
          <span>Gửi yêu cầu tùy chỉnh bảo mật:</span>
          <span>Sử dụng Mô hình Gemini 3.5 Flash</span>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            className="flex-1 bg-[#141d36] text-[#f8fafc] text-xs px-4 py-3 border border-slate-800 rounded-lg focus:border-slate-700 focus:outline-none placeholder-slate-500 font-medium"
            placeholder="Nhập yêu cầu phân tích dữ liệu kho, đối soát iPOS, hoặc chỉ tiêu lợi nhuận..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
          />
          <button
            type="button"
            onClick={() => handleGenerateDiagnostics('general', customPrompt)}
            disabled={isLoadingInsight || !customPrompt.trim()}
            className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-950 disabled:opacity-50 font-black rounded-lg text-xs uppercase tracking-widest transition-all shadow-md active:translate-y-0.5 border-b-2 flex items-center gap-2 cursor-pointer font-sans"
          >
            {isLoadingInsight ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Trực Quan Hóa...
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-orange-600 fill-orange-600" /> Phân Tích AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output Screen */}
      {(insightOutput || isLoadingInsight) && (
        <div className="border border-slate-800 bg-[#070d1a] rounded-lg overflow-hidden shadow-inner">
          <div className="bg-[#101930] px-4 py-3 border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              {insightStatusMsg || "Đang xử lý phân tích logic..."}
            </span>
            <span className="text-slate-500 text-[10px] tracking-widest uppercase">AIOps Terminal v1.4</span>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[350px] space-y-4 font-mono select-text bg-[#070d1a]/80">
            {isLoadingInsight ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-10 h-10 border-4 border-[#1e293b] border-t-orange-500 rounded-full animate-spin" />
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest animate-pulse leading-none py-1">
                  Đang khởi chạy luồng suy nghĩ nơ-ron ERP...
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 text-slate-300">
                  {renderInsightText(insightOutput)}
                </div>
                
                {/* Applied CTA block */}
                <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-200">Bạn muốn triển khai khuyến nghị này?</p>
                    <p className="text-[10px] text-slate-500 leading-relaxed text-slate-500">Kích hoạt nút dưới đây để phê duyệt, áp dụng thay đổi và lưu vết kiểm toán.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyMitigation}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-950 font-black rounded-lg text-xs uppercase tracking-widest transition-all flex items-center gap-2 border-b-2 active:translate-y-0.5 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Phê Duyệt & Ghi Lịch Sử Audit
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  </div>

<DraggableGrid className="grid grid-cols-1 md:grid-cols-2 gap-6" columns={2} gap={32}>
 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm shadow-slate-200/40">
 <div className="flex justify-between items-center mb-10">
 <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
 <DollarSign className="w-6 h-6 text-emerald-500" /> Cost & Token Efficiency
 </h3>
 <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Ngân sách Hàng tháng</span>
 </div>
 <DraggableGrid className="grid grid-cols-2 gap-6 mb-10" columns={2} gap={24}>
 <div className="p-6 bg-stone-950 text-[#FAF9F5] rounded-lg border border-slate-800 shadow-sm relative overflow-hidden group">
 <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest mb-2">Chi phí Thời gian thực</p>
 <p className="text-3xl font-black tracking-tight tracking-tighter">31,012,500đ</p>
 <div className="absolute top-0 right-0 w-16 h-16 bg-slate-900/10 rounded-full blur-xl group-hover:bg-slate-900/20 transition-all" />
 </div>
 <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-100 shadow-sm shadow-emerald-500/10 group">
 <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-2">Cache Hit Rate</p>
 <p className="text-3xl font-black text-emerald-700 tracking-tight tracking-tighter">32.4%</p>
 <TrendingUp className="absolute top-4 right-4 w-10 h-10 text-emerald-200 group-hover:text-emerald-300 group-hover:rotate-12 transition-all" />
 </div>
 </DraggableGrid>
 <div className="space-y-4">
 {[
 { provider: 'OpenAI (GPT-4o)', cost: '10,505,000đ', usage: 35 },
 { provider: 'Google (Gemini 1.5)', cost: '14,502,500đ', usage: 48 },
 { provider: 'Local (Llama 3)', cost: '6,005,000đ', usage: 17 },
 ].map((p, idx) => (
 <div key={idx} className="space-y-2">
 <div className="flex justify-between items-center text-xs">
 <span className="font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
 <Globe className="w-3.5 h-3.5 text-orange-600" /> {p.provider}
 </span>
 <span className="font-black text-slate-900">{p.cost}</span>
 </div>
 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full bg-slate-900 rounded-full" style={{ width: `${p.usage}%` }} />
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm shadow-slate-200/40">
 <div className="flex justify-between items-center mb-10">
 <h3 className="text-xl font-black text-slate-900 flex items-center gap-4">
 <LineChartIcon className="w-6 h-6 text-orange-700" /> Multi-Model Arena Performance
 </h3>
 <button className="text-[10px] font-black text-orange-700 uppercase tracking-widest px-4 py-2 bg-slate-100 rounded-lg border border-slate-300 hover:bg-[#EAE7DF] transition-all">Start A/B Battle</button>
 </div>
 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left whitespace-nowrap">
 <thead>
 <tr className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-200">
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
 <td className="py-5 font-black text-slate-900 text-sm">{m.name} {m.highlight && <span className="ml-2 px-2 py-0.5 bg-slate-900 text-[#FAF9F5] text-[8px] rounded uppercase tracking-widest">Selected</span>}</td>
 <td className="py-5 text-slate-600 font-bold text-xs"><Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" /> {m.latency}</td>
 <td className="py-5 text-right font-mono font-black text-sm text-emerald-600">{m.accuracy}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </DraggableGrid>

 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4" columns={2} gap={32}>
 <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-6 rounded-lg text-[#FAF9F5] relative overflow-hidden shadow-sm border border-slate-800 group">
 <div className="absolute top-0 right-0 w-64 h-64 bg-slate-900/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-slate-900/20 transition-all duration-1000" />
 
 <div className="relative z-10 space-y-8">
 <div className="flex items-center gap-6">
 <div className="p-5 bg-white/5 backdrop-blur-xl rounded-lg border border-white/10 shadow-sm  transition-transform duration-500">
 <BarChart4 className="w-10 h-10 text-orange-500" />
 </div>
 <h3 className="text-4xl font-black tracking-tight leading-tight italic font-serif">MoE Intelligence <br /> <span className="text-orange-600">Router</span></h3>
 </div>
 <p className="text-slate-500 text-lg font-medium leading-relaxed max-w-md">
 Tự động phân bổ tác vụ cho các cụm mô hình tối ưu nhất. Giảm thiểu chi phí lên tới 40% bằng cách sử dụng Small Model cho các tác vụ cơ bản.
 </p>
 <div className="flex flex-wrap gap-4 pt-4">
 <button className="px-6 py-4 bg-slate-900 text-[#FAF9F5] font-black rounded-lg text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5 ">Inference Logs</button>
 <button className="px-6 py-4 bg-slate-900/5 backdrop-blur-md border border-white/10 text-[#FAF9F5] font-black rounded-lg text-xs uppercase tracking-widest hover:bg-slate-900/10 transition-all">Optimization Policy</button>
 </div>
 </div>
 <Layers className="absolute -bottom-16 -right-16 w-80 h-80 text-[#FAF9F5]/5 opacity-50 group-hover:rotate-12 transition-transform duration-1000" />
 </div>

 <div className="bg-white p-6 border border-slate-200 rounded-lg shadow-sm shadow-slate-200/40 space-y-10">
 <h3 className="text-2xl font-black text-slate-900 flex items-center gap-4">
 <Activity className="w-7 h-7 text-orange-700" /> Phân tích Độ lệch & Tình trạng Model
 </h3>
 <div className="space-y-8">
 {[
 { name: 'Fraud Detection v4.2', drift: 1.2, health: 'Optimized', statusColor: 'bg-emerald-50 text-emerald-600' },
 { name: 'Vector Search Encoder', drift: -4.5, health: 'Degraded', statusColor: 'bg-rose-50 text-rose-600' },
 { name: 'Dynamic Pricing Agent', drift: 0.1, health: 'Stable', statusColor: 'bg-slate-100 text-orange-700' }
 ].map((m, i) => (
 <div key={i} className="space-y-4 group">
 <div className="flex justify-between items-center">
 <span className="font-black text-slate-900 text-base">{m.name}</span>
 <span className={cn(
 "text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm",
 m.statusColor
 )}>{m.health}</span>
 </div>
 <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden flex shadow-inner">
 <div 
 className={cn("h-full transition-all duration-1000 group-hover:opacity-80 rounded-full", 
 m.health === 'Degraded' ? "bg-rose-500" : 
 m.health === 'Optimized' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-800")} 
 style={{ width: `${90 + (i * -12)}%` }} 
 />
 </div>
 <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-widest">
 <span className={cn(m.drift < 0 ? "text-rose-500" : "text-emerald-600")}>Accuracy Delta: {m.drift}%</span>
 <span>Node Uptime: 99.99%</span>
 </div>
 </div>
 ))}
 <button className="w-full py-5 bg-slate-50 text-slate-600 text-xs font-black rounded-[1.5rem] border border-slate-200 hover:text-orange-700 hover:bg-slate-100 transition-all uppercase tracking-widest border-b-4 active:translate-y-1">View Full Neural Architecture</button>
 </div>
 </div>
 </DraggableGrid>

 {/* Hardware & Resource Grid */}
 <div className="mt-8 bg-white rounded-lg border border-slate-200 shadow-sm p-6 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none  transition-transform duration-1000">
 <Server className="w-64 h-64 rotate-12" />
 </div>
 
 <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12 relative z-10">
 <div>
 <h3 className="text-2xl font-black flex items-center gap-4 text-slate-900">
 <span className="p-3 bg-emerald-50 rounded-lg text-emerald-600 shadow-sm shadow-emerald-500/10 inline-block"><Server className="w-7 h-7" /></span>
 Hardware Cluster Telemetry
 </h3>
 <p className="text-slate-600 font-medium mt-2">Giám sát tải của các cụm GPU NVIDIA dành cho Inference & Fine-tuning.</p>
 </div>
 <button className="px-6 py-3 border border-emerald-200 text-emerald-700 font-black text-[11px] uppercase tracking-widest rounded-lg hover:bg-emerald-50 transition-all flex items-center gap-3 shadow-sm shadow-emerald-700/5 bg-white border-b-4 active:translate-y-1">
 <RefreshCw className="w-4 h-4" /> Sync Cluster State
 </button>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10" columns={3} gap={32}>
 <div className="border border-slate-200 rounded-lg p-6 bg-slate-50 relative overflow-hidden group/card hover:shadow-sm transition-all border-b-4">
 <div className="flex justify-between items-center mb-8">
 <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">Node: A100-80GB</h4>
 <span className="text-[9px] bg-emerald-600 text-[#FAF9F5] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm shadow-emerald-600/20">Training Pool</span>
 </div>
 <div className="space-y-6">
 <div className="space-y-2">
 <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">
 <span>VRAM Utilization</span>
 <span className="text-rose-600">92% Critical</span>
 </div>
 <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner flex">
 <div className="h-full bg-rose-500 w-[92%] rounded-full shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div>
 </div>
 </div>
 <div className="space-y-2">
 <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">
 <span>GPU Compute Load</span>
 <span className="text-orange-500">85% High</span>
 </div>
 <div className="h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner flex">
 <div className="h-full bg-orange-500 w-[85%] rounded-full"></div>
 </div>
 </div>
 <div className="pt-4 border-t border-slate-300">
 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-2">
 <span className="w-2 h-2 bg-slate-800 rounded-full animate-pulse" /> Fine-tuning NLP v4.0
 </p>
 </div>
 </div>
 </div>

 <div className="border border-slate-300 rounded-lg p-6 bg-white shadow-sm shadow-slate-900/5 ring-2 ring-orange-600/5 relative group/card border-b-4">
 <div className="flex justify-between items-center mb-8">
 <h4 className="font-black text-slate-900 text-lg uppercase tracking-tight">Node: L4-24GB</h4>
 <span className="text-[9px] bg-slate-900 text-[#FAF9F5] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm shadow-slate-900/5">Inference Pool</span>
 </div>
 <div className="space-y-6">
 <div className="space-y-2">
 <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">
 <span>VRAM Utilization</span>
 <span className="text-orange-700">45% Optimal</span>
 </div>
 <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
 <div className="h-full bg-slate-800 w-[45%] rounded-full"></div>
 </div>
 </div>
 <div className="space-y-2">
 <div className="flex justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.1em]">
 <span>Throughput (RPS)</span>
 <span className="text-emerald-600">2,400 rps</span>
 </div>
 <div className="h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner flex">
 <div className="h-full bg-emerald-500 w-[60%] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]"></div>
 </div>
 </div>
 <div className="pt-4 border-t border-slate-200">
 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest flex items-center gap-2">
 <span className="w-2 h-2 bg-emerald-500 rounded-full" /> Vision Moderation Active
 </p>
 </div>
 </div>
 </div>

 <div className="border-2 border-slate-200 border-dashed rounded-lg p-6 bg-slate-50/50 flex flex-col items-center justify-center min-h-[250px] hover:bg-slate-100/50 hover:border-blue-300 hover:text-orange-700 transition-all cursor-pointer group/add">
 <div className="p-5 bg-white rounded-full shadow-sm group-hover/add:scale-110 transition-transform mb-4 border border-slate-200">
 <Plus className="w-10 h-10 text-slate-500 group-hover/add:text-orange-600" />
 </div>
 <span className="font-black text-xs uppercase tracking-[0.2em] text-slate-500 group-hover/add:text-orange-700">Deploy New Node</span>
 <span className="text-[10px] font-bold text-slate-500 mt-2">Azure / AWS / GCP Cluster</span>
 </div>
 </DraggableGrid>
 </div>
 </div>
 );
}

function AiDatabaseInspector() {
  const [queryText, setQueryText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ sql: string; explanation: string; rows: any[] } | null>(null);
  const { staffInfo } = useAuth();
  const tenantId = staffInfo?.tenantId || 'tenant-vcomm-prod-01';

  const sampleQueries = [
    'Liệt kê các tài khoản kế toán và tên của chúng',
    'Hiển thị 5 sản phẩm đắt nhất',
    'Tính tổng giá trị các đơn hàng ở trạng thái paid',
    'Có những mặt hàng nào tồn kho dưới mức an toàn?',
    'Hiển thị các đề xuất mua sắm đang chờ duyệt'
  ];

  const handleQuery = async (q: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const response = await fetch('/api/gemini/db-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, tenantId })
      });
      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Lỗi không xác định khi truy xuất cơ sở dữ liệu AI.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Lỗi kết nối máy chủ.');
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = (result as any)?.chartConfig;
  const chartData = result?.rows.map(row => {
    if (!chartConfig || chartConfig.type === 'none') return row;
    const updatedRow = { ...row };
    for (const key of chartConfig.yKeys || []) {
      if (updatedRow[key] !== undefined) {
        updatedRow[key] = Number(updatedRow[key]);
      }
    }
    return updatedRow;
  }) || [];

  return (
    <div className="space-y-6 font-sans">
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 space-y-4">
        <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-500 animate-pulse" />
          AI Database RAG Inspector (Hỏi đáp SQL Tiếng Việt)
        </h3>
        
        <p className="text-xs text-slate-500 leading-relaxed">
          Nhập câu hỏi của bạn bằng ngôn ngữ tự nhiên (tiếng Việt). AI sẽ phân tích cấu trúc cơ sở dữ liệu Supabase, tự động chuyển dịch thành truy vấn SQL PostgreSQL an toàn, thực thi và trực quan hóa kết quả cho bạn.
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQueryText(q);
                handleQuery(q);
              }}
              className="text-[10px] font-bold bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <input
            type="text"
            placeholder="Ví dụ: Liệt kê các đơn hàng đã thanh toán có tổng tiền lớn hơn 1 triệu đồng..."
            className="flex-1 text-xs p-3.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-100"
            value={queryText}
            onChange={e => setQueryText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleQuery(queryText);
            }}
          />
          <button
            onClick={() => handleQuery(queryText)}
            disabled={loading || !queryText}
            className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-6 py-3.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Truy vấn 🔍'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs font-bold text-red-700 flex items-center gap-2">
          <XCircle className="w-5 h-5 shrink-0" />
          {error}
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider animate-pulse">AI đang phân tích và thực thi truy vấn...</p>
        </div>
      )}

      {result && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SQL & Explanation Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Phân tích & SQL từ AI</h4>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-700 font-bold leading-relaxed">{result.explanation}</p>
              </div>

              <div className="bg-slate-900 rounded-lg p-4 font-mono text-[10px] text-emerald-400 overflow-x-auto border border-slate-950 relative">
                <div className="absolute right-3 top-3 bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[8px] font-sans font-bold uppercase">SQL (Read-only)</div>
                <pre>{result.sql}</pre>
              </div>
            </div>

            {/* Visualizer Chart Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs flex flex-col min-h-[300px]">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Đồ thị hóa kết quả (Visualizer)</h4>
              
              {chartConfig && chartConfig.type !== 'none' && chartData.length > 0 ? (
                <div className="flex-1 w-full min-h-[200px]">
                  <ResponsiveContainer width="100%" height={220}>
                    {chartConfig.type === 'bar' && (
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey={chartConfig.xKey} tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94A3B8" />
                        <YAxis tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94A3B8" />
                        <Tooltip contentStyle={{ fontSize: '11px', fontWeight: 700, borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                        {chartConfig.yKeys.map((yKey: string, index: number) => (
                          <Bar key={yKey} name={yKey.toUpperCase()} dataKey={yKey} fill={index === 0 ? "#3B82F6" : index === 1 ? "#10B981" : "#F59E0B"} radius={[4, 4, 0, 0]} />
                        ))}
                      </BarChart>
                    )}
                    {chartConfig.type === 'line' && (
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey={chartConfig.xKey} tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94A3B8" />
                        <YAxis tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94A3B8" />
                        <Tooltip contentStyle={{ fontSize: '11px', fontWeight: 700, borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                        {chartConfig.yKeys.map((yKey: string, index: number) => (
                          <Line key={yKey} type="monotone" name={yKey.toUpperCase()} dataKey={yKey} stroke={index === 0 ? "#3B82F6" : index === 1 ? "#10B981" : "#F59E0B"} strokeWidth={2} activeDot={{ r: 6 }} />
                        ))}
                      </LineChart>
                    )}
                    {chartConfig.type === 'area' && (
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey={chartConfig.xKey} tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94A3B8" />
                        <YAxis tick={{ fontSize: 9, fontWeight: 700 }} stroke="#94A3B8" />
                        <Tooltip contentStyle={{ fontSize: '11px', fontWeight: 700, borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                        {chartConfig.yKeys.map((yKey: string) => (
                          <Area key={yKey} type="monotone" name={yKey.toUpperCase()} dataKey={yKey} stroke="#3B82F6" fillOpacity={1} fill="url(#colorArea)" strokeWidth={2} />
                        ))}
                      </AreaChart>
                    )}
                    {chartConfig.type === 'pie' && (
                      <PieChart>
                        <Tooltip contentStyle={{ fontSize: '11px', fontWeight: 700, borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                        <Pie
                          data={chartData}
                          dataKey={chartConfig.yKeys[0]}
                          nameKey={chartConfig.xKey}
                          cx="50%"
                          cy="50%"
                          outerRadius={70}
                          fill="#3B82F6"
                          label={{ fontSize: 8, fontWeight: 700 }}
                        >
                          {chartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"][index % 6]} />
                          ))}
                        </Pie>
                      </PieChart>
                    )}
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <BarChart4 className="w-12 h-12 stroke-1 opacity-50" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">Không có cấu hình biểu đồ phù hợp</p>
                </div>
              )}
            </div>
          </div>

          {/* Database Table Card */}
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200">
              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Kết quả truy xuất ({result.rows.length} dòng)</h4>
            </div>
            
            {result.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      {Object.keys(result.rows[0]).map((key) => (
                        <th key={key} className="px-6 py-4 font-black uppercase text-slate-500 tracking-wider">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        {Object.values(row).map((val: any, cellIdx) => (
                          <td key={cellIdx} className="px-6 py-4 font-bold text-slate-700 font-mono">
                            {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center text-slate-500 font-bold text-xs uppercase tracking-wider">
                Truy vấn hoàn thành nhưng không trả về dữ liệu.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

