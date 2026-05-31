import React, { useState, useCallback } from 'react';
import ReactFlow, { Background, Controls, applyEdgeChanges, applyNodeChanges, addEdge } from 'reactflow';
import 'reactflow/dist/style.css';
import { 
 Activity, 
 AlertCircle, 
 CheckCircle2, 
 Clock, 
 Filter, 
 Search, 
 Zap, 
 ArrowUpRight, 
 MoreVertical,
 Layers,
 ShieldAlert,
 Boxes,
 Users2,
 Cpu,
 RefreshCw,
 Bell,
 PanelTop,
 FileSignature,
 ShieldCheck,
 X,
 FileEdit,
 PenTool,
 PlayCircle,
 LayoutList,
 Network,
 ChevronRight,
 Monitor,
 Lock,
 Cpu as CpuIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { WorkflowTask } from '../types/erp';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const initialNodes = [
 { id: '1', data: { label: 'Đơn hàng mới' }, position: { x: 250, y: 5 } },
 { id: '2', data: { label: 'Kiểm tra tồn kho' }, position: { x: 250, y: 100 } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

const MOCK_TASKS: WorkflowTask[] = [
 { id: 'WF-101', module: 'Legal', title: 'Thẩm định tranh chấp hàng giả LV-002', priority: 'critical', status: 'pending', deadline: '2 giờ tới', link: '/compliance' },
 { id: 'WF-701', module: 'eOffice', title: 'Ký duyệt: Đề nghị tạm ứng công tác phí - REQ-002', priority: 'high', status: 'pending', deadline: 'Hôm nay', link: '/signature' },
 { id: 'WF-702', module: 'eOffice', title: 'Ký duyệt: Đơn nghỉ phép thường niên - REQ-001', priority: 'medium', status: 'pending', deadline: 'Ngày mai', link: '/signature' },
 { id: 'WF-102', module: 'Finance', title: 'Phê duyệt 12 yêu cầu Early Payout', priority: 'high', status: 'pending', deadline: 'Hôm nay', link: '/seller-finance' },
 { id: 'WF-103', module: 'PIM', title: 'Duyệt 450 sản phẩm Flash Sale mới', priority: 'medium', status: 'in_progress', deadline: 'Ngày mai', link: '/pim' },
 { id: 'WF-104', module: 'Logistic', title: 'Cảnh báo tồn kho an toàn Kho Hà Nội', priority: 'critical', status: 'pending', deadline: 'Ngay lập tức', link: '/scm' },
];

export function WorkflowHub() {
 const navigate = useNavigate();
 const { user } = useAuth();
 const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');
 const [viewMode, setViewMode] = useState<'tasks' | 'builder'>('tasks');
 const [nodes, setNodes] = useState(initialNodes);
 const [edges, setEdges] = useState(initialEdges);
 const [tasks, setTasks] = useState(MOCK_TASKS);
 
 const [signingTaskId, setSigningTaskId] = useState<string | null>(null);
 const [signatureMethod, setSignatureMethod] = useState<'smart_ca' | 'viettel_ca' | 'usb_token'>('smart_ca');
 const [isSigningInProcess, setIsSigningInProcess] = useState(false);

 const onNodesChange = useCallback(
 (changes: any) => setNodes((nds) => applyNodeChanges(changes, nds)),
 []
 );
 const onEdgesChange = useCallback(
 (changes: any) => setEdges((eds) => applyEdgeChanges(changes, eds)),
 []
 );
 const onConnect = useCallback(
 (params: any) => setEdges((eds) => addEdge(params, eds)),
 []
 );

 const handleApprove = (taskId: string) => {
 setTasks(tasks.filter(t => t.id !== taskId));
 alert(`Đã phê duyệt Task ${taskId} thành công!`);
 };

 const executeSignature = async () => {
 setIsSigningInProcess(true);
 // Simulate API call to CA provider
 await new Promise(resolve => setTimeout(resolve, 2000));
 
 if (signingTaskId) {
 setTasks(tasks.filter(t => t.id !== signingTaskId));
 }
 
 setIsSigningInProcess(false);
 setSigningTaskId(null);
 alert("Ký số thành công! Tài liệu đã được gắn dấu thời gian và luồng công việc đã được cập nhật.");
 };

 const handleSignRequest = (taskId: string) => {
 setSigningTaskId(taskId);
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-700 pb-12">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700 bg-slate-100 px-2 py-0.5 rounded">Mission Control Hub</span>
 <div className="w-1.5 h-1.5 bg-slate-800 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
 </div>
 <h1 className="font-serif tracking-tight text-3xl font-black text-slate-900 tracking-tight italic">Operations & <span className="text-orange-700 font-serif">Workflows</span></h1>
 <p className="text-sm text-slate-600 font-medium mt-1">Điều phối quy trình ký số, phê duyệt đa cấp và tự động hóa chuỗi cung ứng.</p>
 </div>
 <div className="flex flex-wrap gap-3">
 <button 
 onClick={() => setViewMode(viewMode === 'tasks' ? 'builder' : 'tasks')}
 className="bg-white border border-slate-300 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm border-b-2 active:translate-y-0.5"
 >
 {viewMode === 'tasks' ? <PanelTop className="w-4 h-4 text-orange-700" /> : <Activity className="w-4 h-4 text-emerald-600" />}
 {viewMode === 'tasks' ? 'Mở Trình tạo Luồng' : 'Xem danh sách Task'}
 </button>
 <button className="bg-slate-900 text-[#FAF9F5] px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/10 flex items-center gap-2 hover:scale-[1.02] active:scale-95">
 <Cpu className="w-4 h-4 text-orange-500" />
 AI Automation Config
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {[
 { label: 'Cần Phê duyệt', value: 18, sub: '8 ưu tiên cao', icon: ShieldAlert, color: 'rose' },
 { label: 'Đang Vận hành', value: 45, sub: '24 quy trình tự động', icon: Boxes, color: 'blue' },
 { label: 'Workflow Hoàn tất', value: '92%', sub: '+12 so với tháng trước', icon: CheckCircle2, color: 'emerald' },
 { label: 'Nhân sự trực tuyến', value: '42/48', sub: 'Trên 6 bộ phận', icon: Users2, color: 'indigo' },
 ].map((stat) => (
 <div key={stat.label} className="bg-white p-7 rounded-none border border-slate-200 shadow-sm shadow-slate-200/50 flex items-center gap-6 group hover:shadow-slate-900/5 transition-all">
 <div className={cn(
 "p-4 rounded-none shadow-sm transition-transform  group-hover:rotate-6 duration-500",
 stat.color === 'rose' ? "bg-rose-50 text-rose-600 shadow-rose-100" :
 stat.color === 'blue' ? "bg-slate-100 text-orange-700 shadow-blue-100" :
 stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 shadow-emerald-100" :
 "bg-primary-50 text-primary-600 shadow-indigo-100"
 )}>
 <stat.icon className="w-6 h-6" />
 </div>
 <div>
 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">{stat.label}</p>
 <div className="text-3xl font-black text-slate-900 tracking-tight">
 {stat.value}
 </div>
 <p className="text-[10px] text-slate-600 font-bold mt-0.5">{stat.sub}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
 <div className="flex border-b border-slate-200 bg-slate-50/50 p-2">
 <button 
 onClick={() => setViewMode('tasks')}
 className={cn(
 "px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2",
 viewMode === 'tasks' ? "bg-white text-orange-700 shadow-sm shadow-slate-900/5 border border-slate-300" : "text-slate-600 hover:text-slate-900"
 )}
 >
 <LayoutList className="w-4 h-4" /> Queue Navigator
 </button>
 <button 
 onClick={() => setViewMode('builder')}
 className={cn(
 "px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2",
 viewMode === 'builder' ? "bg-white text-emerald-600 shadow-sm shadow-emerald-600/10 border border-emerald-100" : "text-slate-600 hover:text-slate-900"
 )}
 >
 <Network className="w-4 h-4" /> Neural Workflow Designer
 </button>
 </div>

 <div className="p-6 flex-1 flex flex-col">
 {viewMode === 'tasks' ? (
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 <div className="lg:col-span-2 space-y-6">
 <div className="flex justify-between items-center mb-6">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input 
 type="text" 
 placeholder="Search process IDs..." 
 className="bg-slate-50 border border-slate-300 rounded-xl pl-12 pr-6 py-3 text-sm focus:outline-none w-full ring-orange-600/10 focus:ring-4 transition-all"
 />
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => setFilter('all')}
 className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'all' ? "bg-slate-900 text-[#FAF9F5]" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
 >
 Tất cả
 </button>
 <button 
 onClick={() => setFilter('critical')}
 className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", filter === 'critical' ? "bg-rose-600 text-[#FAF9F5]" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
 >
 Critical
 </button>
 </div>
 </div>

 <div className="space-y-4">
 {tasks.filter(t => filter === 'all' || t.priority === filter).map((task) => (
 <div key={task.id} className="p-6 bg-white border border-slate-200 rounded-xl hover:border-orange-200 hover:shadow-sm hover:shadow-slate-900/5 transition-all group flex flex-wrap items-center gap-6 border-b-2">
 <div className={cn(
 "p-4 rounded-lg shadow-sm transition-all ",
 task.priority === 'critical' ? "bg-rose-50 text-rose-500 shadow-rose-200/30" : 
 task.priority === 'high' ? "bg-orange-50 text-orange-500 shadow-orange-200/30" :
 "bg-slate-100 text-orange-600 shadow-blue-200/30"
 )}>
 {task.status === 'completed' ? <CheckCircle2 className="w-7 h-7" /> : 
 task.status === 'in_progress' ? <RefreshCw className="w-7 h-7 animate-spin-slow" /> : 
 <ShieldAlert className="w-7 h-7" />}
 </div>
 <div className="flex-1 w-full">
 <div className="flex items-center gap-2 mb-1">
 <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest">{task.module} • {task.id}</span>
 {task.priority === 'critical' && <div className="w-2 h-2 bg-rose-600 rounded-full animate-pulse" />}
 </div>
 <h4 className="text-base font-black text-slate-900 group-hover:text-orange-700 transition-colors uppercase tracking-tight">{task.title}</h4>
 <p className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5 mt-2 shadow-inner bg-slate-50 px-3 py-1 rounded-full w-fit">
 <Clock className="w-3.5 h-3.5" /> Hạn chót: {task.deadline}
 </p>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex gap-2">
 <button onClick={() => handleApprove(task.id)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all opacity-0 group-hover:opacity-100 border border-emerald-100">
 <CheckCircle2 className="w-5 h-5" />
 </button>
 <button onClick={() => handleSignRequest(task.id)} className="p-3 bg-slate-100 text-orange-700 rounded-xl hover:bg-[#EAE7DF] transition-all opacity-0 group-hover:opacity-100 border border-slate-300">
 <FileSignature className="w-5 h-5" />
 </button>
 <button onClick={() => navigate(task.link)} className="p-3 bg-slate-900 text-[#FAF9F5] rounded-xl shadow-sm shadow-slate-900/20  active:scale-95 transition-all">
 <ArrowUpRight className="w-5 h-5" />
 </button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="space-y-8">
 <div className="bg-stone-950 text-[#FAF9F5] p-6 rounded-xl relative overflow-hidden shadow-sm border border-slate-800 group">
 <div className="relative z-10 space-y-6">
 <div className="p-4 bg-slate-900 rounded-lg shadow-sm shadow-slate-900/5 w-fit  transition-transform">
 <Zap className="w-6 h-6" />
 </div>
 <h3 className="text-2xl font-black italic tracking-tight">AI Process <br/> <span className="text-orange-500">Accelerator</span></h3>
 <p className="text-slate-500 text-sm font-medium leading-relaxed">Hệ thống đang tự động lọc 420 task phụ để bạn tập trung vào 8 task quan trọng nhất.</p>
 <button className="w-full py-4 bg-white/5 border border-white/10 text-[#FAF9F5] font-black rounded-lg text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Audit Automation Log</button>
 </div>
 <Layers className="absolute -bottom-10 -right-10 w-48 h-48 text-[#FAF9F5]/5 opacity-50 group-hover:rotate-12 transition-transform duration-1000" />
 </div>

 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm shadow-slate-200/40">
 <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs mb-8 flex items-center gap-3">
 <Users2 className="w-5 h-5 text-primary-500" /> Team Availability
 </h4>
 <div className="space-y-6">
 {[
 { name: 'Phòng Pháp chế', active: 3, total: 4, color: 'blue' },
 { name: 'Kế toán Tổng hợp', active: 5, total: 5, color: 'emerald' },
 { name: 'Quản lý Kho', active: 12, total: 15, color: 'indigo' },
 ].map((dept) => (
 <div key={dept.name} className="space-y-2">
 <div className="flex justify-between text-[11px] font-black text-slate-800 uppercase tracking-widest">
 <span>{dept.name}</span>
 <span>{dept.active}/{dept.total} On</span>
 </div>
 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div className={cn("h-full rounded-full transition-all duration-1000", dept.color === 'blue' ? "bg-slate-800" : dept.color === 'emerald' ? "bg-emerald-500" : "bg-primary-500")} style={{ width: `${(dept.active/dept.total)*100}%` }} />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 ) : (
 <div className="flex-1 bg-slate-50 border border-slate-300 border-dashed rounded-xl relative overflow-hidden flex flex-col p-2">
 <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#10B981 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
 <div className="flex-1 min-h-[500px]">
 <ReactFlow
 nodes={nodes}
 edges={edges}
 onNodesChange={onNodesChange}
 onEdgesChange={onEdgesChange}
 onConnect={onConnect}
 fitView
 >
 <Background color="#cbd5e1" gap={20} />
 <Controls className="!bg-white !border-slate-300 !shadow-sm" />
 </ReactFlow>
 </div>
 <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-300 flex justify-between items-center rounded-b-[3rem]">
 <div className="flex items-center gap-4">
 <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
 <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 italic">Neural Canvas Active | Beta v2.4</span>
 </div>
 <div className="flex gap-2">
 <button className="px-5 py-2.5 bg-slate-100 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Save Draft</button>
 <button className="px-5 py-2.5 bg-emerald-600 text-[#FAF9F5] font-black rounded-xl text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all">Publish Flow</button>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>

 <AnimatePresence>
 {signingTaskId && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/60 backdrop-blur-3xl">
 <motion.div 
 initial={{ opacity: 0, scale: 0.9, y: 40 }}
 animate={{ opacity: 1, scale: 1, y: 0 }}
 exit={{ opacity: 0, scale: 0.9, y: 40 }}
 className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-white/20 relative"
 >
 <button 
 onClick={() => setSigningTaskId(null)}
 className="absolute top-8 right-8 p-3 hover:bg-slate-100 rounded-lg transition-all z-20 group"
 >
 <X className="w-5 h-5 text-slate-500 group-hover:text-slate-900" />
 </button>

 <div className="p-6 space-y-10">
 <div className="space-y-4">
 <div className="flex items-center gap-5">
 <div className="p-5 bg-emerald-600 rounded-xl shadow-sm shadow-emerald-500/40 relative group overflow-hidden">
 <ShieldCheck className="w-10 h-10 text-[#FAF9F5] relative z-10" />
 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">Enterprise Digital Identity</span>
 </div>
 <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
 Cổng Ký Số <span className="text-slate-500 italic font-medium">VComm CA</span>
 </h2>
 </div>
 </div>
 <p className="text-slate-600 font-medium text-base max-w-lg leading-relaxed">
 Hệ thống kết nối trực tiếp với các nhà cung cấp CA chính thức. Tài liệu sẽ được gắn dấu thời gian pháp lý quốc gia.
 </p>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {[
 { id: 'smart_ca', name: 'VNPT-CA Smart', desc: 'BKAV / VNPT Token Cloud', icon: Monitor },
 { id: 'viettel_ca', name: 'Viettel-CA App', desc: 'Chữ ký số Viettel Mobile', icon: Lock },
 { id: 'usb_token', name: 'FPT USB Token', desc: 'Thiết bị khóa USB vật lý', icon: CpuIcon },
 ].map((ca) => (
 <button 
 key={ca.id}
 onClick={() => setSignatureMethod(ca.id as any)}
 className={cn(
 "p-6 border rounded-[1.5rem] text-left transition-all group relative border-b-4",
 signatureMethod === ca.id 
 ? "bg-stone-950 text-[#FAF9F5] border-slate-900 shadow-sm scale-[1.02]" 
 : "bg-slate-50 border-slate-200 text-slate-900 hover:border-emerald-300 hover:bg-white"
 )}
 >
 <div className={cn(
 "w-10 h-10 rounded-xl mb-4 flex items-center justify-center border transition-colors",
 signatureMethod === ca.id ? "bg-slate-900 border-slate-900" : "bg-white border-slate-300"
 )}>
 <ca.icon className={cn("w-5 h-5", signatureMethod === ca.id ? "text-[#FAF9F5]" : "text-emerald-600")} />
 </div>
 <h4 className="font-black text-sm uppercase tracking-tight">{ca.name}</h4>
 <p className={cn("text-[10px] font-bold mt-1 uppercase tracking-widest opacity-60", signatureMethod === ca.id ? "text-blue-300" : "text-slate-600")}>{ca.desc}</p>
 {signatureMethod === ca.id && <div className="absolute top-6 right-6 w-2 h-2 bg-blue-400 rounded-full animate-ping" />}
 </button>
 ))}
 </div>

 <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center">
 <ShieldCheck className="w-6 h-6 text-emerald-600" />
 </div>
 <div className="text-left">
 <p className="text-xs font-black text-slate-900 uppercase">Audit ID: {signingTaskId}</p>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">TLS 1.3 Encryption Active</p>
 </div>
 </div>
 <button 
 onClick={executeSignature}
 disabled={isSigningInProcess}
 className={cn(
 "px-6 py-5 font-black rounded-lg text-[10px] uppercase tracking-[0.2em] transition-all shadow-sm flex items-center gap-3 w-full sm:w-auto justify-center active:translate-y-1",
 isSigningInProcess ? "bg-slate-100 text-slate-600 cursor-not-allowed" : "bg-emerald-600 text-[#FAF9F5] shadow-emerald-600/30 hover:bg-emerald-500"
 )}
 >
 {isSigningInProcess ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin" />
 Processing Identity...
 </>
 ) : (
 <>
 Xác thực & Ký số
 <ChevronRight className="w-4 h-4" />
 </>
 )}
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}
