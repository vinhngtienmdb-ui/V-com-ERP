import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ClipboardList, 
  FileSignature, 
  Activity, 
  DollarSign, 
  Zap, 
  Mail, 
  User, 
  Users, 
  Calendar as CalendarIcon, 
  Send, 
  FileText, 
  ShieldCheck, 
  BarChart2, 
  Settings, 
  Building2, 
  Video, 
  BrainCircuit, 
  MessageSquare, 
  Car, 
  Monitor, 
  ArrowLeft, 
  ArrowRight, 
  FolderOpen, 
  ClipboardCheck, 
  MapPin, 
  Wrench, 
  ArrowRightLeft, 
  Plus, 
  CheckCircle2, 
  Clock3,
  ArrowUpRight,
  UserCircle,
  AlertCircle,
  Search,
  Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Task, DEFAULT_TASKS, MOCK_MEMBERS } from '../types/task';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskReports } from './TaskReports';
import { TaskDelegation } from './TaskDelegation';
import { TaskMyTasks } from './TaskMyTasks';
import { TaskKanban } from './TaskKanban';

function getColorClasses(color: string) {
  switch (color) {
  case 'blue': return 'bg-slate-100 text-orange-700';
  case 'orange': return 'bg-orange-50 text-orange-600';
  case 'indigo': return 'bg-blue-50 text-blue-600';
  case 'purple': return 'bg-purple-50 text-purple-600';
  case 'emerald': return 'bg-emerald-50 text-emerald-600';
  case 'fuchsia': return 'bg-fuchsia-50 text-fuchsia-600';
  case 'rose': return 'bg-rose-50 text-rose-600';
  case 'cyan': return 'bg-cyan-50 text-cyan-600';
  case 'slate':
  default: return 'bg-slate-50 text-slate-700';
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
    title: 'Công việc & Quy trình (Chuyên nghiệp)',
    items: [
      { id: 'work_project', label: 'Quản lý Dự án (Kanban)', desc: 'Tiến độ dự án kéo thả', icon: FolderOpen, color: 'blue' },
      { id: 'work_mine', label: 'Công việc của tôi', desc: 'Danh sách việc cần làm cá nhân.', icon: ClipboardCheck, color: 'emerald' },
      { id: 'work_manage', label: 'Giao việc & Giám sát', desc: 'Giao việc cho cấp dưới.', icon: ClipboardList, color: 'purple' },
      { id: 'work_report', label: 'Báo cáo hiệu suất', desc: 'Thống kê lượng việc, SLA.', icon: BarChart2, color: 'cyan' },
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
      { id: 'asset_list', label: 'Danh sách tài sản', desc: 'Quản lý kho tài sản cơ quan.', icon: Monitor, color: 'blue' },
      { id: 'asset_assign', label: 'Cấp phát & Bàn giao', desc: 'Luân chuyển tài sản nội bộ.', icon: ArrowRightLeft, color: 'emerald' },
      { id: 'asset_maintenance', label: 'Bảo trì sửa chữa', desc: 'Lịch sử bảo dưỡng tài sản.', icon: Wrench, color: 'orange' },
    ]
  }
];

const INTERNAL_NEWS = [
  { id: 1, title: 'Thông báo v/v Nghỉ lễ Quốc khánh và triển khai hạ tầng mạng mới', date: 'Tận hôm nay', type: 'Announcement', priority: 'high' },
  { id: 2, title: 'Chiến dịch "Xanh hóa văn phòng" và quy hoạch không gian xanh quý 2', date: 'Vừa xong', type: 'Event', priority: 'medium' },
  { id: 3, title: 'Thư tuyên dương đội dự án eOffice đạt mốc KPI giai đoạn vươn mình', date: 'Hôm qua', type: 'News', priority: 'low' },
];

export function Workspace() {
  const [activeModule, setActiveModule] = useState<string>('overview');
  
  // Persistent State of Tasks
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('eoffice_tasks_db_v2');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_TASKS;
      }
    }
    return DEFAULT_TASKS;
  });

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('eoffice_tasks_db_v2', JSON.stringify(tasks));
  }, [tasks]);

  // Task Handlers
  const handleAddTask = (newTaskData: Partial<Task>) => {
    const nextId = `TKS-${String(tasks.length + 1).padStart(3, '0')}`;
    const newTask: Task = {
      id: nextId,
      title: newTaskData.title || 'Công việc mới chưa đặt tên',
      desc: newTaskData.desc || '',
      scope: newTaskData.scope || 'individual',
      department: newTaskData.department || 'Phòng Công nghệ',
      priority: newTaskData.priority || 'medium',
      status: newTaskData.status || 'todo',
      progress: newTaskData.progress || 0,
      labels: newTaskData.labels || [],
      assignee: newTaskData.assignee || MOCK_MEMBERS[0],
      date: newTaskData.date || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      creator: newTaskData.creator || 'Nguyễn Văn Thắng',
      subtasks: newTaskData.subtasks || [],
      comments: newTaskData.comments || []
    };

    setTasks(prev => [newTask, ...prev]);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    // If the currently selected task was updated, keep it in sync
    if (selectedTask && selectedTask.id === updatedTask.id) {
      setSelectedTask(updatedTask);
    }
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    if (selectedTask && selectedTask.id === id) {
      setSelectedTask(null);
    }
  };

  const handleAddTaskQuick = (status: 'todo' | 'in_progress' | 'testing' | 'done') => {
    const titlePrompt = prompt('Nhập tiêu đề công việc nhanh:');
    if (!titlePrompt || !titlePrompt.trim()) return;

    handleAddTask({
      title: titlePrompt.trim(),
      status,
      progress: status === 'done' ? 100 : 0
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12 font-sans text-xs">
      
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="header-title">
          <div className="flex items-center gap-2 mb-1">
            {activeModule !== 'overview' && (
              <button 
                onClick={() => setActiveModule('overview')} 
                className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors mr-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
            )}
            <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">
              {activeModule === 'overview' && "Không gian làm việc (eOffice)"}
              {activeModule === 'work_project' && "Quản lý Dự án (Kanban / Quy trình)"}
              {activeModule === 'work_mine' && "Công việc của tôi"}
              {activeModule === 'work_manage' && "Giao việc và Giám sát"}
              {activeModule === 'work_report' && "Báo cáo hiệu suất"}
              {['calendar', 'meeting_rooms', 'vehicles', 'doc_list', 'doc_archive', 'asset_list', 'asset_assign', 'asset_maintenance'].includes(activeModule) && `Tiện ích eOffice: ${MODULE_GROUPS.flatMap(g => g.items).find(i => i.id === activeModule)?.label}`}
            </h1>
          </div>
          <p className="text-xs text-[#6B7280]">
            {activeModule === 'overview' && "Trung tâm điều hành công việc, quy trình và các tiện ích hành chính nội bộ."}
            {activeModule === 'work_project' && "Bảng Kanban trực quan cho phép kéo thả phân chia luồng công việc tự động."}
            {activeModule === 'work_mine' && "Quản lý danh sách nhiệm vụ được ủy thác riêng cho bạn trong năm 2026."}
            {activeModule === 'work_manage' && "Phần quyền điều hành, giao chỉ tiêu KPI và giám sát tiến độ SLA phòng ban."}
            {activeModule === 'work_report' && "Biểu đồ phân tích dữ liệu hiệu quả SLA hoàn thành công việc của toàn tổ chức."}
            {['calendar', 'meeting_rooms', 'vehicles', 'doc_list', 'doc_archive', 'asset_list', 'asset_assign', 'asset_maintenance'].includes(activeModule) && "Hệ thống hỗ trợ tự động hóa các hoạt động hậu cần, tài liệu của văn phòng cơ quan."}
          </p>
        </div>

        <div className="flex gap-2.5">
          {activeModule === 'overview' ? (
            <>
              <button 
                onClick={() => setActiveModule('work_mine')}
                className="bg-white border border-slate-300 px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 cursor-pointer"
              >
                <ClipboardCheck className="w-4 h-4 text-emerald-600" /> Việc của tôi
              </button>
              <button 
                onClick={() => setActiveModule('work_manage')}
                className="bg-[#2563EB] text-[#FAF9F5] px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Giao việc mới
              </button>
            </>
          ) : (
            <button 
              onClick={() => setActiveModule('overview')}
              className="bg-white border border-slate-300 px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              &larr; Về trang chủ eOffice
            </button>
          )}
        </div>
      </div>

      {/* Overview Module Layout */}
      {activeModule === 'overview' && (
        <div className="space-y-8">
          
          {/* News / Alert Banner */}
          <div className="bg-slate-900 rounded-xl p-6 text-[#FAF9F5] relative overflow-hidden shadow-sm shadow-blue-900/10">
            <div className="relative z-10 flex flex-col gap-5 items-start">
              <div className="flex items-center gap-3">
                <div className="bg-orange-600 text-white p-2 rounded-xl">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-base font-black tracking-tight uppercase">Bảng Tin & Thông Báo Công Ty</h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">Cập nhật chỉ thị, thông tin cơ quan và kế hoạch vận hành định kỳ.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                {INTERNAL_NEWS.map(news => (
                  <div key={news.id} className="bg-white/5 border border-white/10 p-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <span className={cn(
                        "text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider",
                        news.priority === 'high' ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : 
                        news.priority === 'medium' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : 
                        "bg-slate-800/20 text-slate-300 border border-slate-700"
                      )}>
                        {news.type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold">{news.date}</span>
                    </div>
                    <h3 className="text-xs font-black text-slate-200 group-hover:text-orange-500 transition-colors line-clamp-2 leading-relaxed">
                      {news.title}
                    </h3>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
              <BrainCircuit className="w-64 h-64 transform rotate-12 translate-x-20 -translate-y-10" />
            </div>
          </div>

          {/* eOffice Matrix Grid Groups */}
          <div className="space-y-6">
            {MODULE_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-4">
                <h3 className="text-xs font-extrabold text-slate-800 flex items-center gap-2 px-1 uppercase tracking-wider text-slate-500">
                  <span className="w-1.5 h-3.5 bg-[#2563EB] rounded-full inline-block" />
                  {group.title}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {group.items.map((mod) => (
                    <div 
                      key={mod.id}
                      onClick={() => setActiveModule(mod.id)}
                      className="group bg-white p-5 rounded-xl border border-slate-300 hover:border-[#2563EB]/40 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                        <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
                      </div>
                      
                      <div className={cn(
                        "w-11 h-11 rounded-lg relative z-10 flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-white transition-all shadow-sm border border-slate-200", 
                        getColorClasses(mod.color)
                      )}>
                        <mod.icon className="w-5 h-5" />
                      </div>
                      
                      <div className="relative z-10 select-none">
                        <h3 className="font-extrabold text-slate-900 text-xs mb-1 group-hover:text-[#2563EB] transition-colors flex items-center gap-1">
                          {mod.label} <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all" />
                        </h3>
                        <p className="text-[10.5px] text-[#6B7280] leading-relaxed line-clamp-2 font-medium">{mod.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Active Modules Dispatch logic */}

      {/* 1. Kanban Project Board */}
      {activeModule === 'work_project' && (
        <TaskKanban 
          tasks={tasks}
          onTasksChange={setTasks}
          onSelectTask={setSelectedTask}
          onAddTaskQuick={handleAddTaskQuick}
        />
      )}

      {/* 2. Personal tasks of Logon user */}
      {activeModule === 'work_mine' && (
        <TaskMyTasks 
          tasks={tasks}
          onUpdateTask={handleUpdateTask}
          onSelectTask={setSelectedTask}
        />
      )}

      {/* 3. Task delegation, management & list */}
      {activeModule === 'work_manage' && (
        <TaskDelegation 
          tasks={tasks}
          onAddTask={handleAddTask}
          onEditTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onSelectTask={setSelectedTask}
        />
      )}

      {/* 4. Statistics SLA Analytics Dashboard */}
      {activeModule === 'work_report' && (
        <TaskReports tasks={tasks} />
      )}

      {/* 5. Placeholder screens representing secondary features in high-fidelity */}
      {['calendar', 'meeting_rooms', 'vehicles', 'doc_list', 'doc_archive', 'asset_list', 'asset_assign', 'asset_maintenance'].includes(activeModule) && (
        <div className="bg-white rounded-xl border border-slate-300 p-8 shadow-sm text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mx-auto border border-slate-200">
            {activeModule === 'calendar' && <CalendarIcon className="w-8 h-8 text-indigo-600" />}
            {activeModule === 'meeting_rooms' && <Building2 className="w-8 h-8 text-rose-600" />}
            {activeModule === 'vehicles' && <Car className="w-8 h-8 text-blue-600" />}
            {(activeModule === 'doc_list' || activeModule === 'doc_archive') && <FolderOpen className="w-8 h-8 text-[#2563EB]" />}
            {activeModule.startsWith('asset_') && <Monitor className="w-8 h-8 text-purple-600" />}
          </div>

          <div className="space-y-1.5">
            <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight">
              Giao diện Mô phỏng Tiện ích Hành chính
            </h3>
            <p className="text-xs text-slate-500 font-medium font-sans">
              Chúng tôi đã liên kết tiện ích này với cấu trúc eOffice. Dữ liệu đang được kết nối và mô phỏng thành công với tài khoản quản trị.
            </p>
          </div>

          {/* Interactive features simulation list */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-[11px] font-sans space-y-2">
            <p className="font-extrabold text-[#64748B] uppercase tracking-wider">Lịch sử giao thức liên kết gần đây:</p>
            
            {activeModule === 'calendar' && (
              <div className="divide-y divide-slate-200 space-y-2 pt-1 font-bold">
                <div className="flex justify-between text-slate-700 py-1">
                  <span> họp Ban giám đốc tuần thứ 23</span>
                  <span className="text-indigo-600 font-mono">08:00 - Thứ 2</span>
                </div>
                <div className="flex justify-between text-slate-700 py-1">
                  <span> Tiếp đoàn thanh tra sở Công nghệ</span>
                  <span className="text-indigo-600 font-mono">14:00 - Thứ 4</span>
                </div>
              </div>
            )}

            {activeModule === 'meeting_rooms' && (
              <div className="divide-y divide-slate-200 space-y-2 pt-1 font-bold">
                <div className="flex justify-between text-slate-700 py-1">
                  <span>Phòng hội trường lớn tầng 3</span>
                  <span className="text-emerald-600">Đang bận</span>
                </div>
                <div className="flex justify-between text-slate-700 py-1">
                  <span>Phòng thảo luận chuyên đề (P.205)</span>
                  <span className="text-slate-500">Đang trống</span>
                </div>
              </div>
            )}

            {activeModule === 'vehicles' && (
              <div className="divide-y divide-slate-200 space-y-2 pt-1 font-bold">
                <div className="flex justify-between text-slate-700 py-1">
                  <span>Xe 7 chỗ Toyota Fortuner (BKS: 29A-888.88)</span>
                  <span className="text-amber-600 text-[10.5px]">Đang công vụ Sơn Tây</span>
                </div>
                <div className="flex justify-between text-slate-700 py-1">
                  <span>Xe 4 chỗ Mazda 3 (BKS: 29A-666.66)</span>
                  <span className="text-emerald-600">Sẵn sàng điều động</span>
                </div>
              </div>
            )}

            {activeModule.includes('doc_') && (
              <div className="divide-y divide-slate-200 space-y-2 pt-1 font-bold">
                <div className="flex justify-between text-slate-700 py-1">
                  <span>Tài liệu tiêu chuẩn an toàn ISO 9001:2026</span>
                  <span className="text-blue-600">TẢI XUỐNG (PDF)</span>
                </div>
                <div className="flex justify-between text-slate-700 py-1">
                  <span>Bản đồ quy hoạch cơ sở dữ liệu phân tán ERP</span>
                  <span className="text-blue-600">TẢI XUỐNG (CAD)</span>
                </div>
              </div>
            )}

            {activeModule.includes('asset_') && (
              <div className="divide-y divide-slate-200 space-y-2 pt-1 font-bold">
                <div className="flex justify-between text-slate-700 py-1">
                  <span>Màn hình Dell UltraSharp 27" (ID: EQ-MNT-032)</span>
                  <span className="text-[#2563EB]">Đã bàn giao - P.Tech</span>
                </div>
                <div className="flex justify-between text-slate-700 py-1">
                  <span>Máy chủ cấu hình cao AI Xeon (ID: EQ-SRV-001)</span>
                  <span className="text-rose-500">Cần bảo dưỡng định kỳ</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveModule('overview')}
            className="px-5 py-2 hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold font-sans text-slate-700 inline-block cursor-pointer"
          >
            Quay lại bàng điều khiển chính
          </button>
        </div>
      )}

      {/* Central Task Detail Slide-over Modal */}
      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={handleUpdateTask}
          onDelete={handleDeleteTask}
        />
      )}

    </div>
  );
}
