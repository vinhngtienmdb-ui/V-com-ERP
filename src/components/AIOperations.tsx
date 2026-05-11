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
 BarChart4,
 CheckCircle2,
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
  case 'image_moderation': return `Phát hiện vi phạm: ${log.result.reason}`;
  case 'dynamic_pricing': return `Điều chỉnh giá từ ${log.result.oldPrice?.toLocaleString('vi-VN')}đ xuống ${log.result.newPrice?.toLocaleString('vi-VN')}đ. Lý do: ${log.result.reason}`;
  case 'fraud_alert': return `Cảnh báo rủi ro: ${log.result.risk} tại ${log.result.location}`;
  case 'recommendation': return (<>Sử dụng model <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-900">{log.result.engine}</span>: {log.result.action}</>);
  case 'chatbot': return `Tự động phản hồi: ${log.result.action} (Ý định: ${log.result.intent})`;
  default: return log.result.action || JSON.stringify(log.result);
 }
};

const MOCK_HUMAN_QUEUE = [
 { id: 'RVW-881', type: 'image_moderation', targetId: 'PRD-990', confidence: 0.62, reason: 'Nghi vấn nội dung nhạy cảm nhúng trong ảnh', timestamp: '5 phút trước' },
 { id: 'RVW-882', type: 'fraud_alert', targetId: 'USR-772', confidence: 0.58, reason: 'Chu kỳ nạp/rút tiền bất thường (Luồng dòng tiền bất thường)', timestamp: '12 phút trước' },
];

const TABS = [
 { id: 'moderation',     label: 'Bảo vệ Nội dung',    icon: ShieldCheck },
 { id: 'pricing',        label: 'AI Giá linh hoạt',    icon: Zap },
 { id: 'fraud',          label: 'Phát hiện Gian lận',  icon: AlertTriangle },
 { id: 'recommendation', label: 'Gợi ý Sản phẩm',     icon: Network },
 { id: 'chatbot',        label: 'CSKH (Bot AI)',        icon: Bot },
 { id: 'review',         label: 'Kiểm duyệt thủ công', icon: UserCheck },
];

const MODELS = [
 { name: 'Gemini 1.5 Pro',     latency: '420ms', accuracy: '94.2%', selected: true },
 { name: 'GPT-4o Mini',        latency: '120ms', accuracy: '89.5%', selected: false },
 { name: 'Claude 3.5 Sonnet',  latency: '650ms', accuracy: '95.8%', selected: false },
];

const PROVIDERS = [
 { name: 'OpenAI (GPT-4o)',        cost: '10.505.000đ', usage: 35 },
 { name: 'Google (Gemini 1.5)',    cost: '14.502.500đ', usage: 48 },
 { name: 'Máy chủ nội bộ (Llama)', cost: '6.005.000đ',  usage: 17 },
];

const MODEL_HEALTH = [
 { name: 'Phát hiện gian lận v4.2',    drift: 1.2,  health: 'Tối ưu',   statusCls: 'bg-emerald-50 text-emerald-700', barCls: 'bg-emerald-500', barW: 90 },
 { name: 'Bộ mã hóa tìm kiếm Vector',  drift: -4.5, health: 'Suy giảm', statusCls: 'bg-rose-50 text-rose-700',     barCls: 'bg-rose-500',    barW: 78 },
 { name: 'Tác nhân định giá động',      drift: 0.1,  health: 'Ổn định',  statusCls: 'bg-blue-50 text-blue-700',     barCls: 'bg-blue-500',    barW: 66 },
];

export function AIOperations() {
 const [activeModel, setActiveModel] = useState<'moderation'|'pricing'|'fraud'|'recommendation'|'chatbot'|'review'>('moderation');

 return (
  <div className="space-y-4 animate-in fade-in duration-500 pb-6">

   {/* ── Tiêu đề trang ── */}
   <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
    <div>
     <div className="flex items-center gap-2 mb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Trung tâm Mạng Nơ-ron</span>
      <span className="flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-1.5 w-1.5 rounded-full bg-blue-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span></span>
     </div>
     <h1 className="text-lg font-bold text-slate-900">Vận hành AI <span className="text-blue-600">(AIOps)</span></h1>
     <p className="text-sm text-slate-500 mt-0.5">Điều phối và giám sát hệ thống đa tác nhân vận hành toàn sàn thương mại.</p>
    </div>
    <div className="flex flex-wrap gap-2 shrink-0">
     <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2">
      <Settings className="w-3.5 h-3.5 text-slate-500" /> Cấu hình tham số
     </button>
     <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2">
      <RefreshCw className="w-3.5 h-3.5" /> Huấn luyện lại toàn bộ
     </button>
    </div>
   </div>

   {/* ── Thống kê nhanh ── */}
   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
    <div className="bg-slate-900 text-white px-4 py-3 rounded-xl flex items-center gap-3 shadow-sm">
     <div className="p-2 bg-slate-800 rounded-lg shrink-0"><Cpu className="w-4 h-4 text-white" /></div>
     <div className="min-w-0">
      <div className="flex items-center gap-1.5 flex-wrap">
       <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Tình trạng HT</span>
       <span className="text-[10px] font-bold text-emerald-400">99.99%</span>
      </div>
      <div className="text-base font-bold truncate">12 Tác nhân</div>
      <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">Nút nơ-ron hoạt động</p>
     </div>
    </div>
    {[
     { label: 'Duyệt AI tự động', value: '8.421', sub: 'Tác vụ / 24h',     icon: ShieldCheck,  alert: false },
     { label: 'Cảnh báo rủi ro',  value: '12',    sub: 'Phát hiện hôm nay', icon: AlertTriangle, alert: true  },
     { label: 'Độ trễ suy luận',  value: '140ms', sub: 'Phản hồi trung bình', icon: Activity,   alert: false },
    ].map(s => (
     <div key={s.label} className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3 group hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className={cn('p-2 rounded-lg shrink-0 transition-colors border', s.alert ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-200 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100')}>
       <s.icon className="w-4 h-4" />
      </div>
      <div className="min-w-0">
       <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider truncate">{s.label}</p>
       <div className={cn('text-lg font-bold tracking-tight leading-tight', s.alert ? 'text-rose-600' : 'text-slate-900')}>{s.value}</div>
       <p className="text-[10px] text-slate-400 font-medium">{s.sub}</p>
      </div>
     </div>
    ))}
   </div>

   {/* ── Nhật ký tác nhân AI ── */}
   <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
    {/* Tab bar */}
    <div className="flex border-b border-slate-200 bg-slate-50 px-2 pt-2 overflow-x-auto gap-1">
     {TABS.map(tab => (
      <button
       key={tab.id}
       onClick={() => setActiveModel(tab.id as any)}
       className={cn(
        'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-lg whitespace-nowrap transition-all border-b-2',
        activeModel === tab.id
         ? 'bg-white text-blue-600 border-blue-500 shadow-sm'
         : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-white/60'
       )}
      >
       <tab.icon className="w-3.5 h-3.5" />{tab.label}
      </button>
     ))}
    </div>

    <div className="p-4">
     {/* Bộ lọc */}
     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
      <div className="flex gap-2 w-full sm:w-auto">
       <div className="relative flex-1 sm:flex-initial">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input type="text" placeholder="Tìm ID xử lý của AI..." className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-400 w-full sm:w-72" />
       </div>
       <button className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 flex items-center gap-1.5 hover:bg-slate-50 transition-all whitespace-nowrap">
        <Filter className="w-3.5 h-3.5" /> Lọc độ tin cậy
       </button>
      </div>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
       <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span> Luồng suy luận trực tiếp
      </div>
     </div>

     {/* Danh sách */}
     <div className="space-y-3">
      {activeModel === 'review' ? (
       MOCK_HUMAN_QUEUE.map(item => (
        <div key={item.id} className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start gap-3">
         <div className="p-2.5 rounded-lg bg-white border border-amber-200 text-amber-600 shrink-0">
          <UserCheck className="w-5 h-5" />
         </div>
         <div className="flex-1 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
           <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
             {item.id}
             <span className="text-[10px] bg-amber-500 text-white px-2 py-0.5 rounded-full font-bold">Chờ người duyệt</span>
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
             <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{item.timestamp}</span>
             <span>Độ tin cậy: {(item.confidence * 100).toFixed(0)}%</span>
            </div>
           </div>
           <div className="flex gap-2 shrink-0">
            <button className="px-3 py-1.5 bg-white border border-slate-200 text-rose-600 font-semibold rounded-lg text-xs hover:bg-rose-50 transition-all">Từ chối</button>
            <button className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700 transition-all">Phê duyệt</button>
           </div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-amber-200">
           <p className="text-sm text-slate-700 leading-relaxed italic">"{item.reason}"</p>
          </div>
         </div>
        </div>
       ))
      ) : (
       MOCK_AI_LOGS.filter(l => l.type === activeModel || activeModel === 'moderation').map(log => (
        <div key={log.id} className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all flex flex-col sm:flex-row items-start gap-3">
         <div className={cn('p-2.5 rounded-lg shrink-0', log.status === 'flagged' ? 'bg-rose-50 text-rose-500 border border-rose-100' : 'bg-emerald-50 text-emerald-500 border border-emerald-100')}>
          {log.status === 'flagged' ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
         </div>
         <div className="flex-1 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
           <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
             {log.id}
             <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-semibold', log.status === 'flagged' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700')}>
              Độ tin cậy: {(log.confidence * 100).toFixed(0)}%
             </span>
            </h4>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
             <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{log.timestamp}</span>
             <span className="text-slate-400">Mục tiêu: {log.targetId}</span>
            </div>
           </div>
           <div className="flex gap-2 shrink-0">
            <button className="px-3 py-1.5 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-200 transition-all">Ghi đè</button>
            <button className="px-3 py-1.5 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700 transition-all">Giám sát</button>
           </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
           <p className="text-sm text-slate-700 leading-relaxed">
            <span className="text-blue-600 text-[10px] font-bold uppercase tracking-wider mr-2">Kết quả xử lý:</span>{renderResult(log)}
           </p>
          </div>
         </div>
        </div>
       ))
      )}
     </div>
    </div>
   </div>

   {/* ── Chi phí & So sánh mô hình ── */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Chi phí Token */}
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
     <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
       <DollarSign className="w-4 h-4 text-emerald-500" /> Chi phí & Hiệu suất Token
      </h3>
      <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Ngân sách tháng này</span>
     </div>
     <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
       <div className="bg-slate-900 text-white px-4 py-3 rounded-lg">
        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-widest mb-1">Chi phí thực tế</p>
        <p className="text-base font-bold">31.012.500đ</p>
       </div>
       <div className="bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-lg">
        <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest mb-1">Tỉ lệ Cache</p>
        <p className="text-base font-bold text-emerald-700 flex items-center gap-1">32.4% <TrendingUp className="w-3.5 h-3.5" /></p>
       </div>
      </div>
      <div className="space-y-3">
       {PROVIDERS.map((p, i) => (
        <div key={i}>
         <div className="flex justify-between items-center mb-1.5 text-xs">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5"><Globe className="w-3 h-3 text-blue-500" />{p.name}</span>
          <span className="font-bold text-slate-900">{p.cost}</span>
         </div>
         <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-slate-800 rounded-full transition-all duration-700" style={{ width: `${p.usage}%` }} />
         </div>
        </div>
       ))}
      </div>
     </div>
    </div>

    {/* So sánh hiệu năng mô hình */}
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
     <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
       <LineChart className="w-4 h-4 text-blue-500" /> So sánh hiệu năng đa mô hình
      </h3>
      <button className="text-xs font-semibold text-blue-600 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-all">Bắt đầu A/B Test</button>
     </div>
     <div className="p-4 overflow-x-auto">
      <table className="w-full text-left text-sm">
       <thead>
        <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
         <th className="pb-3">Mô hình AI</th>
         <th className="pb-3">Độ trễ</th>
         <th className="pb-3 text-right">Độ chính xác</th>
        </tr>
       </thead>
       <tbody className="divide-y divide-slate-50">
        {MODELS.map((m, i) => (
         <tr key={i} className="hover:bg-slate-50 transition-colors">
          <td className="py-3 font-semibold text-slate-900">
           {m.name}
           {m.selected && <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-[9px] rounded-full font-bold uppercase">Đang dùng</span>}
          </td>
          <td className="py-3 text-slate-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />{m.latency}</td>
          <td className="py-3 text-right font-bold text-emerald-600">{m.accuracy}</td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>
   </div>

   {/* ── Bộ định tuyến & Tình trạng mô hình ── */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {/* Bộ định tuyến thông minh MoE */}
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
     <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
       <BarChart4 className="w-4 h-4 text-orange-500" /> Bộ định tuyến thông minh MoE
      </h3>
      <Layers className="w-4 h-4 text-slate-400" />
     </div>
     <div className="p-5 space-y-4">
      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg p-3">
       Tự động phân bổ tác vụ cho các cụm mô hình tối ưu nhất. Giảm thiểu chi phí lên tới 40% bằng cách sử dụng mô hình nhỏ cho các tác vụ cơ bản.
      </p>
      <div className="flex flex-wrap gap-2">
       <button className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg text-xs hover:bg-blue-700 transition-all">Nhật ký suy luận</button>
       <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-50 transition-all">Chính sách tối ưu</button>
      </div>
     </div>
    </div>

    {/* Tình trạng và độ lệch mô hình */}
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
     <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50">
      <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
       <Activity className="w-4 h-4 text-blue-500" /> Độ lệch & Tình trạng mô hình
      </h3>
     </div>
     <div className="p-4 space-y-4">
      {MODEL_HEALTH.map((m, i) => (
       <div key={i} className="space-y-2">
        <div className="flex justify-between items-center">
         <span className="text-sm font-semibold text-slate-800">{m.name}</span>
         <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full', m.statusCls)}>{m.health}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
         <div className={cn('h-full rounded-full transition-all duration-700', m.barCls)} style={{ width: `${m.barW}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-medium">
         <span className={m.drift < 0 ? 'text-rose-600' : 'text-emerald-600'}>Độ lệch chính xác: {m.drift > 0 ? '+' : ''}{m.drift}%</span>
         <span>Thời gian hoạt động: 99.99%</span>
        </div>
       </div>
      ))}
      <button className="w-full py-2.5 bg-slate-50 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-100 hover:text-blue-600 transition-all mt-2">
       Xem kiến trúc mạng nơ-ron đầy đủ
      </button>
     </div>
    </div>
   </div>

   {/* ── Giám sát cụm phần cứng ── */}
   <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-200 bg-slate-50">
     <div className="flex items-center gap-3">
      <div className="p-2 bg-emerald-50 border border-emerald-100 rounded-lg"><Server className="w-4 h-4 text-emerald-600" /></div>
      <div>
       <h3 className="text-sm font-bold text-slate-900">Giám sát cụm phần cứng GPU</h3>
       <p className="text-xs text-slate-500 mt-0.5">Tải của các cụm GPU NVIDIA dành cho suy luận & tinh chỉnh mô hình.</p>
      </div>
     </div>
     <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg hover:bg-slate-50 transition-all bg-white shrink-0">
      <RefreshCw className="w-3.5 h-3.5" /> Đồng bộ trạng thái
     </button>
    </div>

    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
     {/* Node A100 */}
     <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
      <div className="flex justify-between items-center">
       <h4 className="font-bold text-slate-900 text-sm">Node: A100-80GB</h4>
       <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">Nhóm huấn luyện</span>
      </div>
      <div className="space-y-2.5">
       <div>
        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
         <span>Sử dụng VRAM</span><span className="text-rose-600">92% — Nguy hiểm</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-rose-500 rounded-full" style={{ width: '92%' }} /></div>
       </div>
       <div>
        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
         <span>Tải GPU</span><span className="text-orange-500">85% — Cao</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-orange-500 rounded-full" style={{ width: '85%' }} /></div>
       </div>
      </div>
      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 font-semibold flex items-center gap-1.5">
       <span className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-pulse"></span> Tinh chỉnh NLP v4.0
      </div>
     </div>

     {/* Node L4 */}
     <div className="border border-blue-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
      <div className="flex justify-between items-center">
       <h4 className="font-bold text-slate-900 text-sm">Node: L4-24GB</h4>
       <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold">Nhóm suy luận</span>
      </div>
      <div className="space-y-2.5">
       <div>
        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
         <span>Sử dụng VRAM</span><span className="text-blue-600">45% — Tối ưu</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-slate-800 rounded-full" style={{ width: '45%' }} /></div>
       </div>
       <div>
        <div className="flex justify-between text-[11px] font-semibold text-slate-600 mb-1">
         <span>Thông lượng (yêu cầu/giây)</span><span className="text-emerald-600">2.400 r/s</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }} /></div>
       </div>
      </div>
      <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600 font-semibold flex items-center gap-1.5">
       <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Kiểm duyệt hình ảnh đang chạy
      </div>
     </div>

     {/* Thêm node mới */}
     <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-3 hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer transition-all group">
      <div className="p-3 bg-white rounded-full border border-slate-200 shadow-sm group-hover:border-blue-200 transition-all">
       <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
      </div>
      <div className="text-center">
       <p className="text-xs font-bold text-slate-500 group-hover:text-blue-600 transition-colors uppercase tracking-widest">Thêm Node mới</p>
       <p className="text-[10px] text-slate-400 mt-1">Azure / AWS / GCP</p>
      </div>
     </div>
    </div>
   </div>

  </div>
 );
}
