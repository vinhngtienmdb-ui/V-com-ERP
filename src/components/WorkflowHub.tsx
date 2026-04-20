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
  PanelTop
} from 'lucide-react';
import { cn } from '../lib/utils';
import { WorkflowTask } from '../types/erp';
import { useNavigate } from 'react-router-dom';

const initialNodes = [
  { id: '1', data: { label: 'Đơn hàng mới' }, position: { x: 250, y: 5 } },
  { id: '2', data: { label: 'Kiểm tra tồn kho' }, position: { x: 250, y: 100 } },
];
const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

const MOCK_TASKS: WorkflowTask[] = [
  { id: 'WF-101', module: 'Legal', title: 'Thẩm định tranh chấp hàng giả LV-002', priority: 'critical', status: 'pending', deadline: '2 giờ tới', link: '/compliance' },
  { id: 'WF-102', module: 'Finance', title: 'Phê duyệt 12 yêu cầu Early Payout', priority: 'high', status: 'pending', deadline: 'Hôm nay', link: '/seller-finance' },
  { id: 'WF-103', module: 'PIM', title: 'Duyệt 450 sản phẩm Flash Sale mới', priority: 'medium', status: 'in_progress', deadline: 'Ngày mai', link: '/pim' },
  { id: 'WF-104', module: 'Logistic', title: 'Cảnh báo tồn kho an toàn Kho Hà Nội', priority: 'critical', status: 'pending', deadline: 'Ngay lập tức', link: '/scm' },
  { id: 'WF-105', module: 'Orders', title: 'Xử lý các đơn hàng trạng thái Pending', priority: 'high', status: 'pending', deadline: 'Ngay lập tức', link: '/orders' },
];

export function WorkflowHub() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'critical' | 'high'>('all');
  const [viewMode, setViewMode] = useState<'tasks' | 'builder'>('tasks');
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);

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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Mission Control (Trung tâm Điều hành)</h1>
          <p className="text-sm text-[#6B7280] mt-1">Theo dõi toàn bộ workflow hệ thống và xử lý các điểm nghẽn vận hành.</p>
        </div>
        <div className="flex gap-3">
          <button 
             onClick={() => setViewMode(viewMode === 'tasks' ? 'builder' : 'tasks')}
             className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {viewMode === 'tasks' ? <PanelTop className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
            {viewMode === 'tasks' ? 'Mở Trình tạo Luồng' : 'Xem danh sách Task'}
          </button>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            Cấu hình AI Automation
          </button>
        </div>
      </div>

      {viewMode === 'builder' ? (
        <div className="h-[600px] w-full border border-[#E5E7EB] rounded-xl bg-white">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-red-50 border border-red-100 p-6 rounded-xl">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-red-500 rounded-xl shadow-lg shadow-red-500/20">
                   <ShieldAlert className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-red-600 font-bold uppercase tracking-widest">Điểm nghẽn rủi ro</span>
             </div>
             <div className="text-2xl font-extrabold text-red-700">08</div>
             <p className="text-[10px] text-red-500 font-medium mt-1">Cần hành động ngay lập tức</p>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                   <Boxes className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Task SCM & Vận hành</span>
             </div>
             <div className="text-2xl font-extrabold text-blue-700">124</div>
             <p className="text-[10px] text-blue-500 font-medium mt-1">Đang xử lý trong luồng</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-500/20">
                   <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Workflow hoàn tất</span>
             </div>
             <div className="text-2xl font-extrabold text-emerald-700">92%</div>
             <p className="text-[10px] text-emerald-500 font-medium mt-1">Hiệu suất vận hành tháng</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl">
             <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-slate-400 rounded-xl shadow-lg shadow-slate-400/20">
                   <Users2 className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Nguồn lực sẵn sàng</span>
             </div>
             <div className="text-2xl font-extrabold text-slate-700">42/48</div>
             <p className="text-[10px] text-slate-400 font-medium mt-1">Nhân sự đang trực tuyến</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-lg shadow-slate-200/50 overflow-hidden">
               <div className="p-6 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]/50">
                  <h2 className="font-bold text-[#111827] flex items-center gap-2">
                     <Layers className="w-5 h-5 text-blue-600" /> Action Required (Danh sách Task)
                  </h2>
                  <div className="flex gap-2">
                     <button 
                       onClick={() => setFilter('all')}
                       className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", filter === 'all' ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100")}
                     >
                       Tất cả
                     </button>
                     <button 
                       onClick={() => setFilter('critical')}
                       className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all", filter === 'critical' ? "bg-red-600 text-white" : "text-slate-500 hover:bg-slate-100")}
                     >
                       Critical
                     </button>
                  </div>
               </div>
               <div className="divide-y divide-[#F3F4F6]">
                  {MOCK_TASKS.filter(t => filter === 'all' || t.priority === filter).map(task => (
                     <div key={task.id} className="p-6 flex items-center gap-6 hover:bg-slate-50 transition-all group">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          task.priority === 'critical' ? "bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.5)]" : 
                          task.priority === 'high' ? "bg-orange-500" : "bg-blue-500"
                        )} />
                        <div className="flex-1 space-y-1">
                           <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.module} • {task.id}</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                                task.status === 'in_progress' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-500"
                              )}>{task.status}</span>
                           </div>
                           <h4 className="text-sm font-bold text-[#111827] group-hover:text-blue-600 transition-colors">{task.title}</h4>
                           <p className="text-[11px] text-[#6B7280] flex items-center gap-1">
                              <Clock className="w-3 h-3" /> Hạn chót: {task.deadline}
                           </p>
                        </div>
                        <button 
                          onClick={() => navigate(task.link)}
                          className="p-3 bg-white border border-[#E5E7EB] rounded-lg text-[#2563EB] hover:bg-[#2563EB] hover:text-white transition-all shadow-sm"
                        >
                           <ArrowUpRight className="w-5 h-5" />
                        </button>
                     </div>
                  ))}
               </div>
               <div className="p-4 bg-[#F9FAFB] border-t border-[#F3F4F6] text-center">
                  <button className="text-[11px] font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest">Xem tất cả 42 task vận hành</button>
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-[#111827] text-white p-8 rounded-xl space-y-6 relative overflow-hidden border border-white/5 shadow-2xl">
               <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                     <div className="p-3 bg-emerald-500 rounded-lg shadow-xl shadow-emerald-500/20">
                        <RefreshCw className="w-6 h-6 text-white" />
                     </div>
                     <h3 className="text-lg font-bold font-serif italic">Optimization Suggerter</h3>
                  </div>
                  <div className="space-y-4">
                     <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
                        <p className="text-[11px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                           <Zap className="w-3 h-3 fill-current" /> Automation Opportunity
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">Phát hiện 124 sản phẩm bị gán sai danh mục (PIM). Hãy bật AI Auto-Categorize để tiết kiệm 4 giờ làm việc mỗi ngày.</p>
                        <button className="text-[10px] font-bold bg-white text-slate-900 px-4 py-2 rounded-xl mt-2 hover:bg-slate-100 transition-all uppercase tracking-widest">Bật ngay</button>
                     </div>
                     <div className="p-4 bg-white/5 rounded-lg border border-white/10 space-y-2">
                        <p className="text-[11px] font-bold text-red-400 uppercase flex items-center gap-1">
                           <AlertCircle className="w-3 h-3" /> Risk Warning
                        </p>
                        <p className="text-xs text-slate-300 leading-relaxed">Tỷ lệ hủy đơn tại khu vực miền Trung tăng 12%. Kiểm tra hiệu suất đối tác vận chuyển GHTK.</p>
                        <button className="text-[10px] font-bold border border-white/20 text-white px-4 py-2 rounded-xl mt-2 hover:bg-white/5 transition-all uppercase tracking-widest">Kiểm tra chi tiết</button>
                     </div>
                  </div>
               </div>
               <Cpu className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 -rotate-12" />
            </div>

            <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm space-y-6">
               <h3 className="font-bold text-[#111827] flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" /> Hệ thống Log & Trình ký
               </h3>
               <div className="space-y-4">
                  {[
                    { type: 'Sign', title: 'Phê duyệt Payout #991', time: '5p trước', user: 'Finance Chief' },
                    { type: 'Legal', title: 'Shop LV-Fake bị khóa', time: '12p trước', user: 'AI Guardian' },
                    { type: 'Procure', title: 'Yêu cầu POS-2024 mới', time: '25p trước', user: 'Ops Manager' },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-4 group cursor-pointer">
                       <div className="w-2 h-10 bg-slate-100 rounded-full group-hover:bg-blue-100 overflow-hidden">
                          <div className={cn("w-full h-1/2", i === 0 ? "bg-blue-600" : "bg-slate-200")} />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-[#111827]">{log.title}</p>
                          <p className="text-[10px] text-slate-500">{log.user} • {log.time}</p>
                       </div>
                    </div>
                  ))}
               </div>
               <button className="w-full py-3 border border-slate-100 text-slate-400 text-[10px] font-bold hover:bg-slate-50 rounded-lg uppercase tracking-widest transition-all">Xem tất cả hđ vận hành</button>
            </div>
         </div>
      </div>
    </div>
  );
}
