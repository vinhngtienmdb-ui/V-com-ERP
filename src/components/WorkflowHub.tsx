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
 Cpu as CpuIcon,
 Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { WorkflowTask } from '../types/erp';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ResizableTh } from './ui/ResizableTh';
import { useTableColumns } from '../hooks/useTableColumns';
import {
 linkGoogleCalendar,
 getGoogleCalendarSession,
 disconnectGoogleCalendar,
 parseDeadlineStringToDate,
 createCalendarEvent
} from '../services/googleCalendar';

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

 const [calendarSession, setCalendarSession] = useState<{ email: string | null } | null>(
  getGoogleCalendarSession()
 );
 const [syncedTaskIds, setSyncedTaskIds] = useState<string[]>([]);
 const [syncingTask, setSyncingTask] = useState<WorkflowTask | null>(null);
 const [isSyncingAllTasks, setIsSyncingAllTasks] = useState(false);
 const [isSyncingInProgress, setIsSyncingInProgress] = useState(false);

 const { columns: taskColumns, handleResize: handleTaskResize } = useTableColumns('taskList', [
   { id: 'id', initialWidth: 120, label: 'ID / Module' },
   { id: 'title', initialWidth: 350, label: 'Nhiệm vụ' },
   { id: 'priority', initialWidth: 120, label: 'Độ ưu tiên' },
   { id: 'deadline', initialWidth: 150, label: 'Hạn chót' },
   { id: 'actions', initialWidth: 180, label: 'Thao tác' }
 ]);

 const handleConnectCalendar = async () => {
  try {
   const session = await linkGoogleCalendar();
   setCalendarSession({ email: session.email });
   alert("Đã kết nối tài khoản Google và cấp quyền Google Calendar thành công!");
  } catch (err: any) {
   console.error(err);
   alert("Kết nối Google Calendar thất bại: " + err.message);
  }
 };

 const handleDisconnectCalendar = () => {
  disconnectGoogleCalendar();
  setCalendarSession(null);
  alert("Đã ngắt kết nối Google Calendar.");
 };

 const handleConfirmSyncSingle = async (task: WorkflowTask) => {
  setIsSyncingInProgress(true);
  try {
   const { start, end } = parseDeadlineStringToDate(task.deadline);
   await createCalendarEvent(task, start, end);
   setSyncedTaskIds((prev) => [...prev, task.id]);
   alert(`Đã đồng bộ công việc "${task.title}" vào Google Calendar thành công!`);
  } catch (err: any) {
   console.error(err);
   alert("Đồng bộ lịch thất bại: " + err.message);
  } finally {
   setIsSyncingInProgress(false);
   setSyncingTask(null);
  }
 };

 const handleConfirmSyncAll = async () => {
  setIsSyncingInProgress(true);
  let successCount = 0;
  const tasksToSync = tasks.filter(t => !syncedTaskIds.includes(t.id));
  
  for (const task of tasksToSync) {
   try {
    const { start, end } = parseDeadlineStringToDate(task.deadline);
    await createCalendarEvent(task, start, end);
    setSyncedTaskIds((prev) => [...prev, task.id]);
    successCount++;
   } catch (err) {
    console.error(`Thất bại khi đồng bộ task ${task.id}:`, err);
   }
  }

  setIsSyncingInProgress(false);
  setIsSyncingAllTasks(false);
  alert(`Đã hoàn tất đồng bộ! Thêm mới ${successCount}/${tasksToSync.length} sự kiện vào Google Calendar thành công.`);
 };

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

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { label: 'Cần Phê duyệt', value: 18, sub: '8 ưu tiên cao', icon: ShieldAlert, color: 'rose' },
 { label: 'Đang Vận hành', value: 45, sub: '24 quy trình tự động', icon: Boxes, color: 'blue' },
 { label: 'Workflow Hoàn tất', value: '92%', sub: '+12 so với tháng trước', icon: CheckCircle2, color: 'emerald' },
 { label: 'Nhân sự trực tuyến', value: '42/48', sub: 'Trên 6 bộ phận', icon: Users2, color: 'indigo' },
 ].map((stat) => (
 <div key={stat.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all cursor-pointer relative overflow-hidden">
 <div className={cn(
 "p-2.5 rounded-lg shadow-sm transition-transform group-hover:rotate-6 duration-500 shrink-0 relative z-10",
 stat.color === 'rose' ? "bg-rose-50 text-rose-600 shadow-rose-100" :
 stat.color === 'blue' ? "bg-slate-100 text-orange-700 shadow-blue-100" :
 stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 shadow-emerald-100" :
 "bg-primary-50 text-primary-600 shadow-indigo-100"
 )}>
 <stat.icon className="w-5 h-5" />
 </div>
 <div className="flex-1 min-w-0 text-left z-10">
 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5 truncate">{stat.label}</p>
 <div className="text-xl font-black text-slate-900 truncate">
 {stat.value}
 </div>
 <p className="text-[10px] text-slate-600 font-bold mt-0.5">{stat.sub}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden min-h-[600px] flex flex-col">
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
  {/* Google Calendar Integration Panel */}
  <div className="bg-gradient-to-r from-orange-50/50 to-orange-100/50 p-6 rounded-lg border border-orange-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
   <div className="flex items-start gap-4">
    <div className="p-3 bg-white text-orange-700 rounded-lg shadow-sm border border-orange-100 shrink-0">
     <Calendar className="w-6 h-6" />
    </div>
    <div className="space-y-1 text-left">
     <h1 className="text-sm font-black text-slate-900 uppercase tracking-wider">Đồng bộ lịch Google Calendar</h1>
     {calendarSession ? (
      <p className="text-xs text-slate-600">
       Đang liên kết với: <span className="font-bold text-orange-750">{calendarSession.email}</span>. Sẵn sàng tích hợp dòng thời gian.
      </p>
     ) : (
      <p className="text-xs text-slate-500">
       Hỗ trợ gửi trực tiếp deadline vào lịch cá nhân của bạn để không bao giờ bỏ lỡ nhiệm vụ quan trọng.
      </p>
     )}
    </div>
   </div>
   <div className="flex items-center gap-2 shrink-0">
    {calendarSession ? (
     <>
      <button 
       onClick={() => setIsSyncingAllTasks(true)}
       className="px-4 py-2.5 bg-slate-900 text-[#FAF9F5] text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-800 transition-all shadow-sm active:scale-95"
      >
       Đồng bộ tất cả
      </button>
      <button 
       onClick={handleDisconnectCalendar}
       className="px-4 py-2.5 bg-white border border-slate-300 text-rose-600 hover:text-rose-700 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95"
      >
       Hủy liên kết
      </button>
     </>
    ) : (
     <button 
       onClick={handleConnectCalendar}
       className="px-5 py-2.5 bg-orange-700 text-[#FAF9F5] text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-850 transition-all shadow-md shadow-orange-700/10 flex items-center gap-2 active:scale-95"
     >
      <Calendar className="w-4 h-4" /> Liên kết Lịch
     </button>
    )}
   </div>
  </div>

 <div className="flex justify-between items-center mb-6">
 <div className="relative flex-1 max-w-sm">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input 
 type="text" 
 placeholder="Search process IDs..." 
 className="bg-slate-50 border border-slate-300 rounded-lg pl-12 pr-6 py-3 text-sm focus:outline-none w-full ring-orange-600/10 focus:ring-4 transition-all"
 />
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => setFilter('all')}
 className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filter === 'all' ? "bg-slate-900 text-[#FAF9F5]" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
 >
 Tất cả
 </button>
 <button 
 onClick={() => setFilter('critical')}
 className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all", filter === 'critical' ? "bg-rose-600 text-[#FAF9F5]" : "bg-slate-50 text-slate-600 hover:bg-slate-100")}
 >
 Critical
 </button>
 </div>
 </div>

 <div className="space-y-4">
 {tasks.filter(t => filter === 'all' || t.priority === filter).length > 0 ? (
 <div className="overflow-x-auto min-w-0 custom-scrollbar-x border border-slate-200 rounded-lg">
  <table className="min-w-full w-max text-left border-collapse whitespace-nowrap bg-white">
   <thead className="bg-slate-50 border-b border-slate-200">
    <tr>
     <ResizableTh columnId="id" width={taskColumns.find(c=>c.id==='id')?.currentWidth || 120} onResize={(w) => handleTaskResize('id', w)} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">ID / Module</ResizableTh>
     <ResizableTh columnId="title" width={taskColumns.find(c=>c.id==='title')?.currentWidth || 350} onResize={(w) => handleTaskResize('title', w)} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nhiệm vụ</ResizableTh>
     <ResizableTh columnId="priority" width={taskColumns.find(c=>c.id==='priority')?.currentWidth || 120} onResize={(w) => handleTaskResize('priority', w)} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-center">Độ ưu tiên</ResizableTh>
     <ResizableTh columnId="deadline" width={taskColumns.find(c=>c.id==='deadline')?.currentWidth || 150} onResize={(w) => handleTaskResize('deadline', w)} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">Hạn chót</ResizableTh>
     <ResizableTh columnId="actions" width={taskColumns.find(c=>c.id==='actions')?.currentWidth || 180} onResize={(w) => handleTaskResize('actions', w)} className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap text-right">Thao tác</ResizableTh>
    </tr>
   </thead>
   <tbody className="divide-y divide-slate-100">
    {tasks.filter(t => filter === 'all' || t.priority === filter).map((task) => (
     <tr key={task.id} className="hover:bg-slate-50 transition-colors group">
      <td className="px-4 py-3">
       <span className="text-[10px] font-black text-orange-700 uppercase tracking-widest block">{task.module}</span>
       <span className="text-xs font-bold text-slate-900">{task.id}</span>
      </td>
      <td className="px-4 py-3">
       <div className="flex items-center gap-2">
        <div className={cn("p-1.5 rounded-md", task.status === 'completed' ? "bg-emerald-50 text-emerald-600" : task.status === 'in_progress' ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600")}>
         {task.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : task.status === 'in_progress' ? <RefreshCw className="w-4 h-4 animate-spin-slow" /> : <ShieldAlert className="w-4 h-4" />}
        </div>
        <span className="text-[13px] font-bold text-slate-900 uppercase tracking-tight">{task.title}</span>
       </div>
      </td>
      <td className="px-4 py-3 text-center">
       {task.priority === 'critical' ? (
        <span className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 w-fit mx-auto"><AlertCircle className="w-3 h-3" /> Critical</span>
       ) : task.priority === 'high' ? (
        <span className="px-2.5 py-1 bg-orange-50 text-orange-600 rounded text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 w-fit mx-auto"><AlertCircle className="w-3 h-3" /> High</span>
       ) : (
        <span className="px-2.5 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-1 w-fit mx-auto"><Activity className="w-3 h-3" /> Medium</span>
       )}
      </td>
      <td className="px-4 py-3">
       <div className="flex flex-col gap-1">
        <span className="text-[11px] text-slate-600 font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {task.deadline}</span>
        {syncedTaskIds.includes(task.id) && <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded w-fit flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Đã đồng bộ Lịch</span>}
       </div>
      </td>
      <td className="px-4 py-3 text-right">
       <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => handleApprove(task.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 transition-all border border-emerald-100" title="Phê duyệt"><CheckCircle2 className="w-4 h-4" /></button>
        <button onClick={() => handleSignRequest(task.id)} className="p-2 bg-slate-100 text-orange-700 rounded hover:bg-[#EAE7DF] transition-all border border-slate-300" title="Ký số"><FileSignature className="w-4 h-4" /></button>
        {calendarSession && (
         <button onClick={() => setSyncingTask(task)} disabled={syncedTaskIds.includes(task.id)} className={cn("p-2 rounded transition-all border", syncedTaskIds.includes(task.id) ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100")} title={syncedTaskIds.includes(task.id) ? "Đã đồng bộ" : "Đồng bộ Calendar"}><Calendar className="w-4 h-4" /></button>
        )}
        <button onClick={() => navigate(task.link)} className="p-2 bg-slate-900 text-[#FAF9F5] rounded shadow-sm shadow-slate-900/20 active:scale-95 transition-all" title="Mở chi tiết"><ArrowUpRight className="w-4 h-4" /></button>
       </div>
      </td>
     </tr>
    ))}
   </tbody>
  </table>
 </div>
 ) : (
  <div className="p-12 text-center bg-white border border-slate-200 rounded-lg">
   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4"><CheckCircle2 className="w-8 h-8" /></div>
   <h3 className="text-lg font-bold text-slate-900">Không có nhiệm vụ nào</h3>
   <p className="text-sm text-slate-500 mt-1">Tất cả quy trình đều đang trơn tru.</p>
  </div>
 )}
 </div>
 </div>

 <div className="space-y-8">
 <div className="bg-stone-950 text-[#FAF9F5] p-6 rounded-lg relative overflow-hidden shadow-sm border border-slate-800 group">
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

 <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm shadow-slate-200/40">
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
 <div className="flex-1 bg-slate-50 border border-slate-300 border-dashed rounded-lg relative overflow-hidden flex flex-col p-2">
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
 <button className="px-5 py-2.5 bg-slate-100 text-slate-900 font-black rounded-lg text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">Save Draft</button>
 <button className="px-5 py-2.5 bg-emerald-600 text-[#FAF9F5] font-black rounded-lg text-[10px] uppercase tracking-widest hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all">Publish Flow</button>
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
 className="bg-white rounded-lg w-full max-w-2xl overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-white/20 relative"
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
 <div className="p-5 bg-emerald-600 rounded-lg shadow-sm shadow-emerald-500/40 relative group overflow-hidden">
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
 "w-10 h-10 rounded-lg mb-4 flex items-center justify-center border transition-colors",
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

 {/* Single Task Sync Confirmation Modal */}
 {syncingTask && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/60 backdrop-blur-3xl text-left">
   <motion.div 
    initial={{ opacity: 0, scale: 0.9, y: 40 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, y: 40 }}
    className="bg-white rounded-lg w-full max-w-lg overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-white/20 relative"
   >
    <button 
     onClick={() => setSyncingTask(null)}
     className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-lg transition-all z-20 group"
     disabled={isSyncingInProgress}
    >
     <X className="w-5 h-5 text-slate-500 group-hover:text-slate-900" />
    </button>

    <div className="p-6 space-y-6">
     <div className="flex items-center gap-4">
      <div className="p-4 bg-orange-50 text-orange-700 rounded-lg relative">
       <Calendar className="w-8 h-8" />
      </div>
      <div>
       <span className="text-[10px] font-black uppercase tracking-widest text-orange-700/80">Google Calendar Integration</span>
       <h2 className="text-xl font-black text-slate-900 tracking-tight">Xác nhận đồng bộ Lịch</h2>
      </div>
     </div>

     <div className="bg-slate-50 p-5 rounded-lg border border-slate-200/60 text-left space-y-3">
      <div className="flex justify-between items-center text-xs">
       <span className="font-bold text-slate-500 uppercase tracking-widest">Nhiệm vụ:</span>
       <span className="font-mono bg-slate-200 px-2 py-0.5 rounded text-slate-800 font-bold">{syncingTask.id}</span>
      </div>
      <div className="text-sm font-black text-slate-900 uppercase tracking-tight leading-snug">{syncingTask.title}</div>
      <hr className="border-slate-200" />
      <div className="grid grid-cols-2 gap-4 text-xs">
       <div>
        <div className="text-slate-500 font-bold uppercase tracking-widest mb-1">Phân hệ:</div>
        <div className="font-bold text-slate-800">{syncingTask.module}</div>
       </div>
       <div>
        <div className="text-slate-500 font-bold uppercase tracking-widest mb-1">Thời hạn:</div>
        <div className="font-bold text-slate-800">{syncingTask.deadline}</div>
       </div>
      </div>
      <div className="bg-orange-50/50 p-3 rounded-lg border border-orange-100 text-xs mt-2 font-black text-slate-800">
       <div className="text-orange-700 font-bold uppercase tracking-widest mb-1">Thời gian tạo trên Google Lịch:</div>
       <div>
        {(() => {
         const { start, end } = parseDeadlineStringToDate(syncingTask.deadline);
         return `${new Date(start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}`;
        })()}
       </div>
      </div>
     </div>

     <p className="text-xs text-slate-500 leading-relaxed text-left">
      VComm ERP sẽ kết nối trực tiếp đến Google Calendar của tài khoản <span className="font-bold">{calendarSession?.email}</span> để thực hiện thêm sự kiện.
     </p>

     <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
      <button 
       onClick={() => setSyncingTask(null)}
       className="px-5 py-3 text-[10px] font-black uppercase tracking-widest bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-all text-slate-600"
       disabled={isSyncingInProgress}
      >
       Hủy
      </button>
      <button 
       onClick={() => handleConfirmSyncSingle(syncingTask)}
       disabled={isSyncingInProgress}
       className={cn(
        "px-5 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#FAF9F5] shadow-sm flex items-center gap-2",
        isSyncingInProgress ? "bg-slate-400 cursor-not-allowed" : "bg-orange-700 hover:bg-orange-850"
       )}
      >
       {isSyncingInProgress ? (
        <>
         <RefreshCw className="w-4 h-4 animate-spin" />
         Đang đồng bộ...
        </>
       ) : (
        'Thêm vào Lịch'
       )}
      </button>
     </div>
    </div>
   </motion.div>
  </div>
 )}

 {/* Sync All Tasks Confirmation Modal */}
 {isSyncingAllTasks && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-stone-950/60 backdrop-blur-3xl text-left">
   <motion.div 
    initial={{ opacity: 0, scale: 0.9, y: 40 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, y: 40 }}
    className="bg-white rounded-lg w-full max-w-lg overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] border border-white/20 relative"
   >
    <button 
     onClick={() => setIsSyncingAllTasks(false)}
     className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-lg transition-all z-20 group"
     disabled={isSyncingInProgress}
    >
     <X className="w-5 h-5 text-slate-500 group-hover:text-slate-900" />
    </button>

    <div className="p-6 space-y-6">
     <div className="flex items-center gap-4">
      <div className="p-4 bg-orange-50 text-orange-700 rounded-lg relative">
       <Calendar className="w-8 h-8" />
      </div>
      <div>
       <span className="text-[10px] font-black uppercase tracking-widest text-orange-700/80">Google Calendar Batch Process</span>
       <h2 className="text-xl font-black text-slate-900 tracking-tight">Đồng bộ hàng loạt</h2>
      </div>
     </div>

     <p className="text-sm text-slate-650 leading-relaxed text-left">
      Bạn có chắc chắn muốn đồng bộ tất cả <span className="font-bold text-orange-700">{tasks.filter(t => !syncedTaskIds.includes(t.id)).length}</span> nhiệm vụ chưa đồng bộ của bạn sang Google Calendar của tài khoản <span className="font-bold">({calendarSession?.email})</span>?
     </p>

     <div className="max-h-48 overflow-y-auto space-y-2 text-left">
      {tasks.filter(t => !syncedTaskIds.includes(t.id)).map(task => (
       <div key={task.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
        <div>
         <span className="font-bold font-mono text-orange-700 mr-2">{task.id}</span>
         <span className="text-slate-800 font-bold">{task.title}</span>
        </div>
        <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-black uppercase text-slate-600 shrink-0">{task.deadline}</span>
       </div>
      ))}
     </div>

     <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 font-bold text-slate-500">
      <button 
       onClick={() => setIsSyncingAllTasks(false)}
       className="px-5 py-3 text-[10px] font-black uppercase tracking-widest bg-slate-50 border border-slate-300 rounded-lg hover:bg-slate-100 transition-all text-slate-600"
       disabled={isSyncingInProgress}
      >
       Hủy
      </button>
      <button 
       onClick={handleConfirmSyncAll}
       disabled={isSyncingInProgress}
       className={cn(
        "px-5 py-3 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#FAF9F5] shadow-sm flex items-center gap-2",
        isSyncingInProgress ? "bg-slate-400 cursor-not-allowed" : "bg-orange-700 hover:bg-orange-850"
       )}
      >
       {isSyncingInProgress ? (
        <>
         <RefreshCw className="w-4 h-4 animate-spin" />
         Đang đồng bộ...
        </>
       ) : (
        'Đồng bộ toàn bộ'
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
