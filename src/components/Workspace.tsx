import { useState } from 'react';
import { Clock, ClipboardList, FileSignature, Activity, DollarSign, Zap, Mail, User, Users, Calendar as CalendarIcon, Send, FileText, ShieldCheck, BarChart2, Settings, Building2, Video, BrainCircuit, MessageSquare, Car, Monitor, ArrowLeft, ArrowRight, FolderOpen, ClipboardCheck, MapPin, Wrench, ArrowRightLeft, Plus, CheckCircle2, Clock3 } from 'lucide-react';
import { cn } from '../lib/utils';
import { WorkspaceBooking, MeetingEvent } from '../types/erp';

function getColorClasses(color: string) {
  switch (color) {
    case 'blue': return 'bg-blue-50 text-blue-600';
    case 'orange': return 'bg-orange-50 text-orange-600';
    case 'indigo': return 'bg-indigo-50 text-indigo-600';
    case 'purple': return 'bg-purple-50 text-purple-600';
    case 'emerald': return 'bg-emerald-50 text-emerald-600';
    case 'fuchsia': return 'bg-fuchsia-50 text-fuchsia-600';
    case 'rose': return 'bg-rose-50 text-rose-600';
    case 'cyan': return 'bg-cyan-50 text-cyan-600';
    case 'slate':
    default: return 'bg-slate-50 text-slate-600';
  }
}

const MODULE_GROUPS = [
  {
    title: 'Lịch & Tiện ích (Mới & Đề xuất)',
    items: [
      { id: 'calendar', label: 'Lịch công tác', desc: 'Lịch tuần ban lãnh đạo', icon: CalendarIcon, color: 'indigo' },
      { id: 'meeting_rooms', label: 'Đặt phòng họp', desc: 'Lịch trống phòng họp', icon: Building2, color: 'rose' },
      { id: 'vehicles', label: 'Điều xe công tác', desc: 'Đăng ký xe ô tô cơ quan', icon: Car, color: 'blue' },
    ]
  },
  {
    title: 'Công việc & Quy trình (Nâng cấp)',
    items: [
      { id: 'work_project', label: 'Quản lý Dự án (Kanban)', desc: 'Tiến độ dự án', icon: FolderOpen, color: 'blue' },
      { id: 'work_mine', label: 'Công việc của tôi', desc: 'Danh sách việc cần làm.', icon: ClipboardCheck, color: 'emerald' },
      { id: 'work_manage', label: 'Giao việc & Giám sát', desc: 'Giao việc cho cấp dưới.', icon: ClipboardList, color: 'purple' },
      { id: 'work_report', label: 'Báo cáo hiệu suất', desc: 'Thống kê lượng việc.', icon: BarChart2, color: 'cyan' },
    ]
  },
  {
    title: 'Tài liệu & Hồ sơ',
    items: [
      { id: 'doc_list', label: 'Tài liệu chuyên môn', desc: 'Kho lưu trữ dùng chung', icon: FolderOpen, color: 'blue' },
      { id: 'doc_archive', label: 'Kho Lưu trữ Cơ quan', desc: 'Số hóa tài liệu cũ', icon: FileText, color: 'emerald' },
    ]
  },
  {
    title: 'Tài sản Cơ quan',
    items: [
      { id: 'asset_list', label: 'Danh sách tài sản', desc: 'Quản lý kho tài sản.', icon: Monitor, color: 'blue' },
      { id: 'asset_assign', label: 'Cấp phát & Bàn giao', desc: 'Luân chuyển tài sản.', icon: ArrowRightLeft, color: 'emerald' },
      { id: 'asset_maintenance', label: 'Bảo trì sửa chữa', desc: 'Lịch sử bảo dưỡng.', icon: Wrench, color: 'orange' },
    ]
  }
];

const INTERNAL_NEWS = [
  { id: 1, title: 'Thông báo v/v Nghỉ lễ Chiến thắng 30/4 và Quốc tế lao động 1/5', date: '18/04/2026', type: 'Announcement', priority: 'high' },
  { id: 2, title: 'Chiến dịch "Xanh hóa văn phòng" - Kick-off quý 2/2026', date: '15/04/2026', type: 'Event', priority: 'medium' },
  { id: 3, title: 'Thư chúc mừng của Ban Giám đốc nhân dịp đạt KPI quý 1', date: '12/04/2026', type: 'News', priority: 'low' },
];

export function Workspace() {
  const [activeModule, setActiveModule] = useState<string>('overview');

  // Kanban Tasks State
  const [tasks, setTasks] = useState([
    { id: 't1', title: 'Lập KH Triển khai eOffice', date: '18/04/2026', priority: 'Gấp', status: 'todo', progress: 0 },
    { id: 't2', title: 'Thiết kế Mockup UI', date: '19/04/2026', priority: 'Bình thường', status: 'todo', progress: 0 },
    { id: 't3', title: 'Báo cáo Quý 1/2026', date: '20/04/2026', priority: 'Dự án', status: 'in_progress', progress: 45, desc: 'Tổng hợp số liệu doanh thu từ các bộ phận kinh doanh và lập báo cáo.' },
    { id: 't4', title: 'Chuẩn bị hồ sơ đấu thầu', date: '15/04/2026', priority: 'Quan trọng', status: 'done', progress: 100 },
  ]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    const id = e.dataTransfer.getData('taskId');
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus, progress: newStatus === 'done' ? 100 : t.progress } : t));
  };

  return (
    <div className="p-8 space-y-12">
      <div className="flex justify-between items-center bg-white border border-slate-200 p-4 rounded-lg shadow-sm">
         <div className="flex items-center gap-4">
            <button 
               onClick={() => setActiveModule('overview')}
               className={cn("px-4 py-2 rounded-lg font-bold text-sm transition-all", activeModule === 'overview' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50")}
            >
               Tổng quan
            </button>
            <div className="w-px h-6 bg-slate-200"></div>
            <button 
               onClick={() => setActiveModule('work_project')}
               className={cn("px-4 py-2 rounded-lg font-bold text-sm transition-all", activeModule === 'work_project' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50")}
            >
               Công việc
            </button>
            <button 
               onClick={() => setActiveModule('calendar')}
               className={cn("px-4 py-2 rounded-lg font-bold text-sm transition-all", activeModule === 'calendar' ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50")}
            >
               Lịch & Đặt phòng
            </button>
         </div>
      </div>

      {activeModule === 'overview' && (
        <>
          {/* News & Announcements Widget */}
          <div className="bg-slate-900 rounded-lg p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/10">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg border border-blue-500/30">
                      <Zap className="w-5 h-5 fill-current" />
                   </div>
                   <h2 className="text-xl font-bold tracking-tight">Tin tức & Thông báo nội bộ</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {INTERNAL_NEWS.map(news => (
                      <div key={news.id} className="bg-white/5 border border-white/10 p-5 rounded-lg hover:bg-white/10 transition-all cursor-pointer group">
                         <div className="flex justify-between items-start mb-3">
                            <span className={cn(
                               "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                               news.priority === 'high' ? "bg-rose-500/20 text-rose-400" : 
                               news.priority === 'medium' ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                            )}>
                               {news.type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{news.date}</span>
                         </div>
                         <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 leading-relaxed">
                            {news.title}
                         </h3>
                         <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">
                            Xem chi tiết <ArrowRight className="w-3 h-3" />
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 blur-[80px] translate-y-1/2 -translate-x-1/4" />
          </div>

          <div className="space-y-12">
            {MODULE_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                <h2 className="text-xl font-bold text-[#111827]">{group.title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {group.items.map(item => (
                    <button 
                       key={item.id} 
                       onClick={() => setActiveModule(item.id === 'work_project' ? 'work_project' : item.id === 'calendar' ? 'calendar' : item.id === 'meeting_rooms' ? 'calendar' : 'overview')}
                       className="bg-slate-50 border border-slate-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md hover:bg-white transition-all text-left flex gap-4 items-start group"
                    >
                       <div className={cn("p-3 rounded-lg shrink-0 transition-transform group-hover:scale-105", getColorClasses(item.color))}>
                          <item.icon className="w-6 h-6" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-[#111827] mb-1">{item.label}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.desc}</p>
                       </div>
                    </button>
                 ))}
              </div>
            </div>
          ))}
        </div>
      </>
      )}

      {activeModule === 'work_project' && (
         <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
               <div>
                  <h3 className="text-lg font-bold text-slate-800">Cổng Công Việc (eOffice Tasks)</h3>
                  <p className="text-sm text-slate-500">Quản lý dự án, giao việc và theo dõi tiến độ công việc hàng ngày.</p>
               </div>
               <button 
                 onClick={() => {
                   const newTask = { id: `t${Date.now()}`, title: 'Công việc mới', date: new Date().toLocaleDateString('vi-VN'), priority: 'Bình thường', status: 'todo', progress: 0 };
                   setTasks([newTask, ...tasks]);
                 }}
                 className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2"
               >
                  <Plus className="w-4 h-4" /> Giao việc mới
               </button>
            </div>
            
            <div className="p-6 overflow-x-auto">
               <div className="flex gap-6 min-w-max">
                  {/* Cột: Cần làm */}
                  <div 
                    className="w-80 bg-slate-50/80 rounded-xl border border-slate-200 p-4 shrink-0 flex flex-col max-h-[700px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'todo')}
                  >
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700">Cần làm (To-Do)</h4>
                        <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'todo').length}</span>
                     </div>
                     <div className="space-y-3 overflow-y-auto pr-1">
                        {tasks.filter(t => t.status === 'todo').map(task => (
                          <div 
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            className="bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 cursor-grab active:cursor-grabbing shadow-sm transition-all relative group"
                          >
                             <div className="flex justify-between mb-2">
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", task.priority === 'Gấp' || task.priority === 'Quan trọng' ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600")}>{task.priority}</span>
                                <span className="text-[10px] text-slate-500 font-bold">{task.date}</span>
                             </div>
                             <h5 className="font-bold text-sm text-slate-800 mb-2">{task.title}</h5>
                             {task.desc && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.desc}</p>}
                             <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                                <div className="flex -space-x-2">
                                   <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">NV</div>
                                </div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Cột: Đang làm */}
                  <div 
                    className="w-80 bg-blue-50/50 rounded-xl border border-blue-100 p-4 shrink-0 flex flex-col max-h-[700px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'in_progress')}
                  >
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-blue-800">Đang thực hiện (In Progress)</h4>
                        <span className="text-xs font-bold bg-blue-200 text-blue-700 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'in_progress').length}</span>
                     </div>
                     <div className="space-y-3 overflow-y-auto pr-1">
                        {tasks.filter(t => t.status === 'in_progress').map(task => (
                          <div 
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            className="bg-white border border-blue-200 rounded-lg p-3 hover:border-blue-400 cursor-grab active:cursor-grabbing shadow-sm transition-all"
                          >
                             <div className="flex justify-between mb-2">
                                <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded uppercase", task.priority === 'Dự án' ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600")}>{task.priority}</span>
                                <span className="text-[10px] text-slate-500 font-bold">{task.date}</span>
                             </div>
                             <h5 className="font-bold text-sm text-slate-800 mb-2">{task.title}</h5>
                             {task.desc && <p className="text-xs text-slate-500 mb-3 line-clamp-2">{task.desc}</p>}
                             <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2">
                                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${task.progress || 50}%` }}></div>
                             </div>
                             <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                                <div className="flex -space-x-2">
                                   <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-600">NV</div>
                                </div>
                                <div className="text-[10px] font-bold text-slate-500">{task.progress || 50}%</div>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  {/* Cột: Hoàn thành */}
                  <div 
                    className="w-80 bg-emerald-50/50 rounded-xl border border-emerald-100 p-4 shrink-0 flex flex-col max-h-[700px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, 'done')}
                  >
                     <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-emerald-800">Hoàn thành (Done)</h4>
                        <span className="text-xs font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'done').length}</span>
                     </div>
                     <div className="space-y-3 overflow-y-auto pr-1">
                        {tasks.filter(t => t.status === 'done').map(task => (
                          <div 
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            className="bg-white border border-emerald-200 rounded-lg p-3 cursor-grab hover:shadow-md transition-all opacity-80 hover:opacity-100"
                          >
                             <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span className="text-sm font-bold text-emerald-700 line-through">{task.title}</span>
                             </div>
                             <div className="flex justify-between items-center">
                                <span className="text-[10px] text-slate-500">{task.date}</span>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </div>
         </div>
      )}

      {activeModule === 'calendar' && (
         <div className="bg-white rounded-lg shadow-sm border border-slate-200">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-lg">
               <div>
                  <h3 className="text-lg font-bold text-slate-800">Cổng Tiện ích: Lịch & Đặt phòng</h3>
                  <p className="text-sm text-slate-500">Xem lịch tuần cơ quan, đặt phòng họp và tài nguyên.</p>
               </div>
               <div className="flex gap-2">
                  <button className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-50">
                     Hôm nay
                  </button>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2">
                     <Plus className="w-4 h-4" /> Đặt lịch mới
                  </button>
               </div>
            </div>
            
            <div className="p-0 border-b border-slate-100 flex overflow-x-auto bg-white">
               {['Thứ 2 (14/04)', 'Thứ 3 (15/04)', 'Thứ 4 (16/04)', 'Thứ 5 (17/04)', 'Thứ 6 (18/04)', 'Thứ 7 (19/04)'].map((day, idx) => (
                  <div key={idx} className={cn(
                     "flex-1 min-w-[200px] border-r border-slate-100 p-4",
                     idx === 2 ? "bg-blue-50/30 ring-1 ring-blue-500/10 inset-0" : ""
                  )}>
                     <h4 className="font-bold text-slate-700 mb-4 text-center">{day}</h4>
                     <div className="space-y-3">
                        {idx === 1 && (
                           <div className="bg-white border-l-4 border-l-emerald-500 p-3 rounded shadow-sm border border-slate-200 text-xs text-left">
                              <p className="font-bold text-slate-800 mb-1">Họp giao ban tuần</p>
                              <p className="text-emerald-600 font-semibold mb-1">08:30 - 10:00</p>
                              <div className="flex items-center gap-1 text-slate-500 font-medium">
                                 <MapPin className="w-3 h-3" /> Phòng họp A (Tầng 3)
                              </div>
                           </div>
                        )}
                        {idx === 2 && (
                           <div className="bg-white border-l-4 border-l-blue-500 p-3 rounded shadow-sm border border-slate-200 text-xs text-left">
                              <p className="font-bold text-slate-800 mb-1">Tiếp khách Đối tác HN</p>
                              <p className="text-blue-600 font-semibold mb-1">14:00 - 16:30</p>
                              <div className="flex items-center gap-1 text-slate-500 font-medium mb-1">
                                 <Building2 className="w-3 h-3" /> Phòng VIP 1
                              </div>
                              <div className="flex items-center gap-1 text-slate-500 font-medium">
                                 <Car className="w-3 h-3" /> Đã đặt xe: 29A-123.45 (Anh Hùng)
                              </div>
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
            
            <div className="p-6">
               <h4 className="font-bold text-slate-800 mb-4">Trạng thái Phòng họp Hôm nay</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                     { name: 'Phòng họp A (Lớn)', cap: 20, status: 'Trong giờ họp (đến 10:00)', color: 'rose' },
                     { name: 'Phòng họp B (Nhỏ)', cap: 8, status: 'Trống', color: 'emerald' },
                     { name: 'Phòng VIP 1', cap: 12, status: 'Đã đặt (14:00 - 16:30)', color: 'amber' },
                  ].map((room, idx) => (
                     <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white flex items-center justify-between">
                        <div>
                           <h5 className="font-bold text-slate-800 mb-1">{room.name}</h5>
                           <p className="text-xs text-slate-500 font-medium">{room.cap} chỗ ngồi • Máy chiếu, Mic</p>
                        </div>
                        <div className="text-right">
                           <span className={cn(
                              "text-[10px] font-bold px-2 py-1 rounded uppercase",
                              room.color === 'emerald' ? "bg-emerald-100 text-emerald-700" :
                              room.color === 'rose' ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"
                           )}>
                              {room.status}
                           </span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      )}

    </div>
  );
}

