import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Check,
  Copy,
  Sparkles,
  LayoutDashboard,
  CheckSquare,
  GitPullRequest,
  Inbox,
  ExternalLink,
  ChevronRight,
  Filter,
  FileEdit,
  Shield,
  Layers,
  CheckCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Task, DEFAULT_TASKS, MOCK_MEMBERS } from '../types/task';
import { TaskDetailModal } from './TaskDetailModal';
import { TaskReports } from './TaskReports';
import { TaskDelegation } from './TaskDelegation';
import { TaskMyTasks } from './TaskMyTasks';
import { TaskKanban } from './TaskKanban';
import { MailClient } from './MailClient';
import { InternalChat } from './InternalChat';
import { QuickNotes } from './QuickNotes';

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
  },
  {
    title: 'Liên lạc & Cộng tác (eOffice Pack)',
    items: [
      { id: 'mail_client', label: 'Hộp thư cá nhân', desc: 'Quản lý Gmail hoặc Outlook 365', icon: Mail, color: 'blue' },
      { id: 'internal_chat', label: 'Chat nội bộ', desc: 'Nhắn tin cá nhân, nhóm & phòng ban', icon: MessageSquare, color: 'indigo' },
    ]
  }
];

const INTERNAL_NEWS = [
  { id: 1, title: 'Thông báo v/v Nghỉ lễ Quốc khánh và triển khai hạ tầng mạng mới', date: 'Hôm nay', type: 'Announcement', priority: 'high' },
  { id: 2, title: 'Chiến dịch "Xanh hóa văn phòng" và quy hoạch không gian xanh quý 3', date: 'Vừa xong', type: 'Event', priority: 'medium' },
  { id: 3, title: 'Thư tuyên dương đội dự án eOffice đạt mốc KPI giai đoạn vươn mình', date: 'Hôm qua', type: 'News', priority: 'low' },
];

export const WORKPLACE_ECOSYSTEM_APPS = [
  { id: 'work_project', name: 'Công việc & Dự án', path: '/workspace?tab=work_project', isInternal: true, icon: FolderOpen, color: 'from-blue-600 to-indigo-600', desc: 'Bảng Kanban, phân ca & SLA' },
  { id: 'phe_duyet', name: 'Cổng Phê duyệt', path: '/requests', isInternal: false, icon: CheckSquare, color: 'from-emerald-500 to-teal-600', desc: 'Tờ trình, tạm ứng, thanh toán' },
  { id: 'quy_trinh', name: 'Quy trình BPMN', path: '/workflow?tab=builder', isInternal: false, icon: GitPullRequest, color: 'from-purple-500 to-indigo-600', desc: 'Studio vẽ luồng kéo thả tự động' },
  { id: 'tai_lieu', name: 'Kho Tài liệu Số', path: '/dochub', isInternal: false, icon: FolderOpen, color: 'from-amber-500 to-orange-600', desc: 'Lưu trữ đám mây & phân quyền RBAC' },
  { id: 'van_thu', name: 'Văn thư & Công văn', path: '/official-dispatch', isInternal: false, icon: Inbox, color: 'from-rose-500 to-pink-600', desc: 'Sổ công văn đến, đi & hỏa tốc' },
  { id: 'hop_dong', name: 'Hợp đồng & Ký số', path: '/contracts', isInternal: false, icon: FileSignature, color: 'from-blue-600 to-cyan-600', desc: 'Ký số Cloud HSM & dấu thời gian TSA' },
  { id: 'phong_hop', name: 'Phòng họp thông minh', path: '/workspace?tab=meeting_rooms', isInternal: true, icon: Building2, color: 'from-cyan-500 to-blue-600', desc: 'Đặt phòng & Google Meet' },
  { id: 'chat_noi_bo', name: 'Trò chuyện Nội bộ', path: '/omnichat', isInternal: false, icon: MessageSquare, color: 'from-indigo-500 to-sky-600', desc: 'Kênh chat phòng ban & dự án' },
];

export const MOCK_PENDING_APPROVALS = [
  { id: 'REQ-108', title: 'Tờ trình phê duyệt kinh phí chiến dịch Mega Sale 10.10', requester: 'Lê Hoàng Minh', department: 'Marketing', amount: 45000000, date: '17/09/2026', priority: 'high', type: 'Duyệt chi' },
  { id: 'REQ-109', title: 'Đơn xin nghỉ phép thường niên (2 ngày)', requester: 'Nguyễn Diệu Nhi', department: 'Kinh doanh', amount: null, date: '17/09/2026', priority: 'medium', type: 'Nghỉ phép' },
  { id: 'REQ-110', title: 'Đề xuất cấp bổ sung 5 máy POS di động cho kho Long Biên', requester: 'Trần Văn Tuấn', department: 'Vận hành WMS', amount: 18500000, date: '16/09/2026', priority: 'high', type: 'Mua sắm' }
];

export const MOCK_URGENT_DISPATCHES = [
  { id: 'CV-2026/089', title: 'Thông tri phối hợp kiểm tra an toàn PCCC & cứu nạn cơ quan', sender: 'UBND Quận Cầu Giấy', date: '17/09/2026', urgency: 'Hỏa tốc' },
  { id: 'TB-VCOMM/045', title: 'Quyết định bổ nhiệm Phó Giám đốc Trung tâm Dữ liệu & AI', sender: 'Ban Tổng Giám Đốc', date: '16/09/2026', urgency: 'Thượng khẩn' }
];

export const WEEK_SCHEDULE = [
  { day: 'Thứ 2 (15/09)', time: '08:30 - 10:00', title: 'Giao ban Ban Lãnh Đạo đầu tuần', location: 'Executive Boardroom T12', host: 'Tổng Giám Đốc' },
  { day: 'Thứ 3 (16/09)', time: '14:00 - 15:30', title: 'Họp rà soát tiến độ tích hợp Core Backend v2.3', location: 'P.502 Kỹ thuật', host: 'Giám đốc Công nghệ' },
  { day: 'Thứ 4 (17/09)', time: '09:30 - 11:00', title: 'Đánh giá chiến dịch Tiếp thị Sàn Q3/2026', location: 'Innovation Hub T8', host: 'Trưởng phòng Marketing' },
  { day: 'Thứ 5 (18/09)', time: '15:00 - 16:30', title: 'Tiếp đoàn đối tác thanh toán NAPAS & VietQR', location: 'Town Hall Auditorium T3', host: 'Giám đốc Tài chính' },
  { day: 'Thứ 6 (19/09)', time: '16:30 - 17:30', title: 'Tổng kết tuần & Happy Hour toàn công ty', location: 'Khu vực Pantry T12', host: 'Công đoàn VComm' }
];

export function Workspace() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const getMappedWorkspaceModule = (tab: string | null): string => {
    if (!tab) return 'overview';
    if (tab === 'meeting' || tab === 'meeting_rooms') return 'meeting_rooms';
    if (tab === 'notes') return 'notes';
    if (tab === 'work_mine') return 'work_mine';
    if (tab === 'project' || tab === 'work_project') return 'work_project';
    if (tab === 'tasks' || tab === 'work_manage') return 'work_manage';
    if (tab === 'calendar') return 'calendar';
    return tab;
  };

  const [activeModule, setActiveModule] = useState<string>(() => getMappedWorkspaceModule(tabParam));

  useEffect(() => {
    if (tabParam) {
      setActiveModule(getMappedWorkspaceModule(tabParam));
    }
  }, [tabParam]);
  
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
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 font-sans text-xs">
      {/* Top Glassmorphism Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/60 text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Quay lại Launcher chính (/)"
          >
            <ArrowLeft className="w-4 h-4 text-amber-700" />
            <span>Launcher</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                VComm Digital Workplace & eOffice
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" /> Apple Glass UI
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Trung tâm điều hành công việc, quy trình tự động và tiện ích hành chính số tập trung
            </p>
          </div>
        </div>

        {/* Right Quick Navigations & Action Center */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {activeModule !== 'overview' && (
            <button
              onClick={() => setActiveModule('overview')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Về Bàn làm việc</span>
            </button>
          )}
          <button
            onClick={() => setActiveModule('work_manage')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-black shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Giao Việc Mới</span>
          </button>
          <button
            onClick={() => navigate('/requests')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-lg shadow-emerald-500/25 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Gửi Tờ Trình</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Modern Sub-Tab Pill Bar */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm overflow-x-auto text-xs font-bold">
        {[
          { id: 'overview', label: 'Bàn Làm Việc Hợp Nhất', icon: LayoutDashboard },
          { id: 'work_mine', label: 'Việc Của Tôi', icon: ClipboardCheck },
          { id: 'work_project', label: 'Dự Án (Kanban)', icon: FolderOpen },
          { id: 'work_manage', label: 'Giao Việc & SLA', icon: ClipboardList },
          { id: 'meeting_rooms', label: 'Phòng Họp & Meet', icon: Building2 },
          { id: 'calendar', label: 'Lịch Công Tác Tuần', icon: CalendarIcon },
          { id: 'work_report', label: 'Báo Cáo Hiệu Suất', icon: BarChart2 },
          { id: 'notes', label: 'Ghi Chép Cá Nhân', icon: FileEdit },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveModule(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer shrink-0",
                activeModule === tab.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", activeModule === tab.id ? "text-indigo-400" : "text-slate-400")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Module Layout (Apple Glass Daily Cockpit) */}
      {activeModule === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          
          {/* 1. Workplace Pulse Bar: 4 Core Live Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Metric 1: My Tasks */}
            <div 
              onClick={() => setActiveModule('work_mine')}
              className="p-4 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500">Việc Cần Xử Lý</span>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <ClipboardCheck className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-900">
                  {tasks.filter(t => t.status !== 'done').length}
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  {tasks.filter(t => t.status === 'in_progress').length} đang làm
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Xem danh sách nhiệm vụ được giao</p>
            </div>

            {/* Metric 2: Pending Approvals */}
            <div 
              onClick={() => navigate('/requests')}
              className="p-4 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500">Chờ Tôi Duyệt</span>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-600">{MOCK_PENDING_APPROVALS.length}</span>
                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md">
                  2 khẩn cấp
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Tờ trình & đề xuất chờ phê duyệt</p>
            </div>

            {/* Metric 3: Next Meeting */}
            <div 
              onClick={() => setActiveModule('meeting_rooms')}
              className="p-4 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500">Cuộc Họp Kế Tiếp</span>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Video className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-base font-black text-slate-900">09:00</span>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded-md line-clamp-1">
                  Boardroom T12
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Họp Chiến lược Ban TGĐ</p>
            </div>

            {/* Metric 4: SLA Compliance */}
            <div 
              onClick={() => setActiveModule('work_report')}
              className="p-4 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:scale-[1.02] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-500">Đúng Hạn SLA</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-600">94.8%</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                  +1.2% tuần
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">Chỉ số tuân thủ tiến độ phòng ban</p>
            </div>
          </div>

          {/* 2. Standalone Digital Workplace Mini-Apps Ecosystem Launcher Grid */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-md shadow-slate-200/40">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-slate-900 tracking-tight">Hệ Sinh Thái 8 Mini App Văn Phòng Số</h2>
                  <p className="text-[11px] text-slate-500 font-medium">Truy cập trực tiếp tới các phân hệ nghiệp vụ số hóa của doanh nghiệp</p>
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                8/8 Ứng Dụng Sẵn Sàng
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              {WORKPLACE_ECOSYSTEM_APPS.map((app) => {
                const AppIcon = app.icon;
                return (
                  <button
                    key={app.id}
                    onClick={() => {
                      if (app.isInternal) {
                        const tab = app.path.split('tab=')[1];
                        setActiveModule(tab);
                      } else {
                        navigate(app.path);
                      }
                    }}
                    className="group flex flex-col items-start p-3 rounded-2xl bg-white/90 hover:bg-white border border-slate-200/80 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all text-left cursor-pointer active:scale-98"
                  >
                    <div className={cn("p-2 rounded-xl bg-gradient-to-br text-white shadow-sm mb-2 group-hover:scale-110 transition-transform", app.color)}>
                      <AppIcon className="w-4 h-4" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                      {app.name}
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover:text-slate-500 line-clamp-1 mt-0.5">
                      {app.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 3-Column Dynamic Work Deck */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Column 1: Today's Tasks & Urgent Action List */}
            <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                      <ClipboardCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">Việc Cần Xử Lý</h3>
                      <p className="text-[10px] text-slate-400">Ưu tiên cao & tiến độ công việc</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('work_project')}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Mở Kanban</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {tasks.slice(0, 4).map((task) => (
                    <div 
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="p-3 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/60 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={task.status === 'done'}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleUpdateTask({
                                ...task,
                                status: task.status === 'done' ? 'todo' : 'done',
                                progress: task.status === 'done' ? 0 : 100
                              });
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className={cn(
                            "text-xs font-bold transition-all line-clamp-1",
                            task.status === 'done' ? "line-through text-slate-400" : "text-slate-800 group-hover:text-blue-600"
                          )}>
                            {task.title}
                          </span>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider shrink-0",
                          task.priority === 'urgent' || task.priority === 'high' ? "bg-rose-50 text-rose-600 border border-rose-200" :
                          task.priority === 'medium' ? "bg-amber-50 text-amber-600 border border-amber-200" :
                          "bg-slate-100 text-slate-600 border border-slate-200"
                        )}>
                          {task.priority}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 text-[10px] text-slate-400">
                        <span>Hạn: {task.date}</span>
                        <span className="font-bold text-slate-600">{task.assignee.name}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handleAddTaskQuick('todo')}
                className="w-full mt-4 py-2.5 rounded-2xl border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/50 text-slate-600 hover:text-blue-600 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm Nhanh Việc Mới</span>
              </button>
            </div>

            {/* Column 2: Pending Approvals & Urgent Dispatches */}
            <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                      <CheckSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">Đề Xuất & Tờ Trình</h3>
                      <p className="text-[10px] text-slate-400">Chờ xem xét & ký số điện tử</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/requests')}
                    className="text-[11px] font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Cổng duyệt ({MOCK_PENDING_APPROVALS.length})</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  {MOCK_PENDING_APPROVALS.map((req) => (
                    <div 
                      key={req.id}
                      onClick={() => navigate('/requests')}
                      className="p-3 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200/60 hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[9px] font-black">
                              {req.id}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">{req.type}</span>
                          </div>
                          <h4 className="text-xs font-black text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-1">
                            {req.title}
                          </h4>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/50 text-[10px]">
                        <span className="text-slate-400">{req.requester} ({req.department})</span>
                        {req.amount && (
                          <span className="font-mono font-bold text-emerald-600">
                            {req.amount.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Urgent Dispatch Notification Banner */}
                  <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200/80 mt-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-200/60 px-2 py-0.5 rounded">
                        Công văn hỏa tốc
                      </span>
                      <span className="text-[10px] text-rose-500 font-bold">17/09/2026</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                      {MOCK_URGENT_DISPATCHES[0].title}
                    </div>
                    <button
                      onClick={() => navigate('/official-dispatch')}
                      className="mt-2 text-[10px] font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Mở Sổ Văn thư xử lý</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/requests')}
                className="w-full mt-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Xét Duyệt Nhanh Các Tờ Trình</span>
              </button>
            </div>

            {/* Column 3: Upcoming Meetings & Internal News */}
            <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900">Phòng Họp & Sự Kiện</h3>
                      <p className="text-[10px] text-slate-400">Lịch họp hôm nay & Google Meet</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModule('meeting_rooms')}
                    className="text-[11px] font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Lịch phòng</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Next Meeting Live Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-950 text-white shadow-md mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      Sắp diễn ra (15 phút nữa)
                    </span>
                    <span className="text-[11px] font-mono text-purple-300 font-bold">09:00 - 11:30</span>
                  </div>
                  <h4 className="text-xs font-black text-white line-clamp-2">
                    Họp Chiến lược Ban Tổng Giám Đốc Q3/2026
                  </h4>
                  <p className="text-[10px] text-slate-300 mt-1">Executive Boardroom T12 • Neat Bar Pro 4K</p>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                    <button
                      onClick={() => window.open('https://meet.google.com/vcm-exec-q3', '_blank')}
                      className="flex-1 py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Vào Google Meet</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText('https://meet.google.com/vcm-exec-q3');
                        alert('Đã sao chép link Google Meet!');
                      }}
                      className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                      title="Sao chép link họp"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Company News Mini Ticker */}
                <div className="space-y-2">
                  <div className="text-[11px] font-black text-slate-600 flex items-center gap-1.5 px-1 uppercase tracking-wider">
                    <Zap className="w-3 h-3 text-amber-500 fill-current" />
                    <span>Bảng Tin Công Ty</span>
                  </div>
                  {INTERNAL_NEWS.slice(0, 2).map((news) => (
                    <div key={news.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-[11px]">
                      <div className="flex items-center justify-between mb-1 text-[9px]">
                        <span className="font-extrabold text-blue-600 uppercase">{news.type}</span>
                        <span className="text-slate-400 font-bold">{news.date}</span>
                      </div>
                      <div className="font-bold text-slate-800 line-clamp-1">{news.title}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={() => setActiveModule('meeting_rooms')}
                  className="flex-1 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-purple-600" />
                  <span>Đặt Phòng</span>
                </button>
                <button
                  onClick={() => setActiveModule('notes')}
                  className="flex-1 py-2 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileEdit className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ghi Chép</span>
                </button>
              </div>
            </div>

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

      {/* 2.5 QuickNotes Smart Meeting & Personal Notepad */}
      {activeModule === 'notes' && (
        <div className="space-y-4">
          <div className="bg-white p-3 rounded-xl border border-slate-200 w-fit">
            <button
              onClick={() => setActiveModule('overview')}
              className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition"
            >
              &larr; Quay lại Tổng quan Văn phòng
            </button>
          </div>
          <QuickNotes />
        </div>
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

      {/* 4.5 Mail Client */}
      {activeModule === 'mail_client' && (
        <MailClient />
      )}

      {/* 4.6 Internal Chat */}
      {activeModule === 'internal_chat' && (
        <InternalChat />
      )}

      {/* 4.7 Smart Meeting Rooms & Google Meet Integration */}
      {activeModule === 'meeting_rooms' && (
        <MeetingRoomManager />
      )}

      {/* 4.8 Executive Weekly Calendar */}
      {activeModule === 'calendar' && (
        <ExecutiveCalendarView />
      )}

      {/* 5. Vehicles dispatch view */}
      {activeModule === 'vehicles' && (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-100 shadow-sm">
            <Car className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">Điều Động Xe Ô Tô Công Tác</h3>
            <p className="text-xs text-slate-500">Quản lý điều xe ô tô cơ quan, lịch trình công vụ và phê duyệt công tác phí</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/60 text-left space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
              <span className="font-bold text-slate-800">Toyota Fortuner 7 chỗ (29A-888.88)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">Đang công vụ Sơn Tây</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="font-bold text-slate-800">Mazda 3 4 chỗ (29A-666.66)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">Sẵn sàng điều động</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setActiveModule('overview')}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs cursor-pointer shadow-xs"
            >
              Quay lại Bàn làm việc
            </button>
            <button
              onClick={() => navigate('/requests')}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-xs shadow-blue-500/20"
            >
              Gửi Phiếu Yêu Cầu Điều Xe
            </button>
          </div>
        </div>
      )}

      {/* 6. Documents redirect to DocHub */}
      {(activeModule === 'doc_list' || activeModule === 'doc_archive') && (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-100 shadow-sm">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">Kho Lưu Trữ Tài Liệu Doanh Nghiệp (DocHub)</h3>
            <p className="text-xs text-slate-500">Hệ thống đã nâng cấp sang phân hệ chuyên biệt DocHub với phân quyền đa cấp RBAC và xem trước trực tiếp.</p>
          </div>
          <button
            onClick={() => navigate('/dochub')}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs flex items-center gap-2 mx-auto cursor-pointer shadow-lg shadow-amber-500/25"
          >
            <span>Mở Kho Tài Liệu DocHub</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 7. Assets redirect to Device Leasing */}
      {activeModule.startsWith('asset_') && (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto border border-purple-100 shadow-sm">
            <Monitor className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900">Quản Lý Tài Sản & Thiết Bị Cơ Quan</h3>
            <p className="text-xs text-slate-500">Toàn bộ hồ sơ máy tính, thiết bị POS, máy in và trang thiết bị làm việc đã được quản lý tại Phân hệ Tài sản.</p>
          </div>
          <button
            onClick={() => navigate('/device-leasing')}
            className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs flex items-center gap-2 mx-auto cursor-pointer shadow-lg shadow-purple-500/25"
          >
            <span>Mở Phân Hệ Quản Lý Tài Sản</span>
            <ExternalLink className="w-3.5 h-3.5" />
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

// -------------------------------------------------------------
// Component: Executive Weekly Calendar (Lịch Công Tác Tuần)
// -------------------------------------------------------------
function ExecutiveCalendarView() {
  const [selectedDayIndex, setSelectedDayIndex] = useState(2); // Thứ 4

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Lịch Công Tác Tuần
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Tuần 38 - Tháng 09/2026
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Lịch Công Tác Lãnh Đạo & Sự Kiện Cơ Quan</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl font-medium">
            Theo dõi chi tiết chương trình làm việc, lịch tiếp khách, kiểm tra hiện trường và các phiên họp điều hành của Ban Lãnh đạo VComm.
          </p>
        </div>
      </div>

      {/* Week Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {WEEK_SCHEDULE.map((item, idx) => {
          const isSelected = selectedDayIndex === idx;
          return (
            <div
              key={item.day}
              onClick={() => setSelectedDayIndex(idx)}
              className={cn(
                "p-4 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between backdrop-blur-xl",
                isSelected
                  ? "bg-white border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/20"
                  : "bg-white/80 hover:bg-white border-white/80 shadow-md shadow-slate-200/40"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black text-slate-600">{item.day}</span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </div>
                <div className="text-xs font-black text-slate-900 line-clamp-2 leading-snug">{item.title}</div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-blue-600 font-bold">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.time}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-500 font-medium line-clamp-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{item.location}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700 font-bold line-clamp-1">
                  <User className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{item.host}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// Component: Smart Meeting Room Manager & Google Meet Hub
// -------------------------------------------------------------
interface MeetingRoom {
  id: string;
  name: string;
  floor: string;
  capacity: number;
  status: 'available' | 'occupied' | 'maintenance';
  equipment: string[];
  currentMeeting?: {
    title: string;
    host: string;
    time: string;
    meetUrl: string;
  };
  upcomingMeetings: {
    title: string;
    host: string;
    time: string;
    meetUrl: string;
  }[];
}

const INITIAL_ROOMS: MeetingRoom[] = [
  {
    id: 'MR-101',
    name: 'Executive Boardroom T12',
    floor: 'Tầng 12 - Trụ sở VComm Tower',
    capacity: 20,
    status: 'occupied',
    equipment: ['Neat Bar Pro 4K', 'Màn hình ghép 85 inch', 'Mic mảng trần Beamforming', 'Bảng điện tử số'],
    currentMeeting: {
      title: 'Họp Chiến lược Ban Tổng Giám Đốc Q3/2026',
      host: 'Tổng Giám Đốc (CEO)',
      time: '09:00 - 11:30',
      meetUrl: 'https://meet.google.com/vcm-exec-q3'
    },
    upcomingMeetings: [
      {
        title: 'Review Tiến độ Triển khai Dự án eOffice & WMS',
        host: 'Giám đốc Công nghệ (CTO)',
        time: '14:00 - 15:30',
        meetUrl: 'https://meet.google.com/vcm-tech-sync'
      }
    ]
  },
  {
    id: 'MR-102',
    name: 'Town Hall Auditorium T3',
    floor: 'Tầng 3 - Trung tâm Hội nghị',
    capacity: 150,
    status: 'available',
    equipment: ['Polycom Studio 4K Camera kép', '2 Màn hình LED P2.5', 'Hệ thống âm thanh Sennheiser không dây', 'Bục phát biểu tự động'],
    upcomingMeetings: [
      {
        title: 'All-hands Toàn công ty & Vinh danh Nhân sự Xuất sắc',
        host: 'Phòng Hành chính Nhân sự',
        time: '16:00 - 17:30',
        meetUrl: 'https://meet.google.com/vcm-town-hall'
      }
    ]
  },
  {
    id: 'MR-103',
    name: 'Creative Innovation Hub T8',
    floor: 'Tầng 8 - Không gian Sáng tạo',
    capacity: 12,
    status: 'available',
    equipment: ['Samsung Flip Pro 75"', 'Hệ thống WebRTC Conference 60fps', 'Bảng kính tương tác Agile Scrum'],
    upcomingMeetings: [
      {
        title: 'Sprint Retrospective & Demo Tính năng Sàn TMĐT',
        host: 'Trưởng nhóm Product Owner',
        time: '13:30 - 14:30',
        meetUrl: 'https://meet.google.com/vcm-crea-hub'
      }
    ]
  },
  {
    id: 'MR-104',
    name: 'Phân ban Thảo luận Kỹ thuật P.502',
    floor: 'Tầng 5 - Khối Kỹ thuật & Hạ tầng',
    capacity: 8,
    status: 'available',
    equipment: ['Logitech Rally Plus', 'Màn hình 65" 4K HDR', 'Google Meet Hardware Box'],
    upcomingMeetings: []
  }
];

function MeetingRoomManager() {
  const [rooms, setRooms] = useState<MeetingRoom[]>(INITIAL_ROOMS);
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string>('MR-102');

  // Booking Form State
  const [meetingTitle, setMeetingTitle] = useState<string>('');
  const [meetingHost, setMeetingHost] = useState<string>('Nguyễn Hữu Nghĩa (Admin)');
  const [meetingDate, setMeetingDate] = useState<string>('2026-09-17');
  const [meetingStart, setMeetingStart] = useState<string>('15:00');
  const [meetingEnd, setMeetingEnd] = useState<string>('16:00');
  const [autoCreateMeet, setAutoCreateMeet] = useState<boolean>(true);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleJoinMeeting = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingTitle.trim()) {
      alert('Vui lòng nhập tên cuộc họp!');
      return;
    }

    const randomSlug = Math.random().toString(36).substring(2, 6);
    const generatedMeet = `https://meet.google.com/vcm-${randomSlug}`;

    setRooms(prev => prev.map(r => {
      if (r.id === selectedRoomId) {
        return {
          ...r,
          upcomingMeetings: [
            ...r.upcomingMeetings,
            {
              title: meetingTitle,
              host: meetingHost,
              time: `${meetingStart} - ${meetingEnd} (${meetingDate})`,
              meetUrl: autoCreateMeet ? generatedMeet : ''
            }
          ]
        };
      }
      return r;
    }));

    setIsBookingModalOpen(false);
    setMeetingTitle('');
    alert(`Đã đặt phòng họp thành công! ${autoCreateMeet ? `Mã Google Meet: ${generatedMeet}` : ''}`);
  };

  const filteredRooms = rooms.filter(r => {
    if (filterFloor === 'all') return true;
    return r.floor.includes(filterFloor);
  });

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-rose-900 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/30">
              eOffice Smart Workspace
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Google Meet Sync Active
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight">Hệ Thống Quản Lý Phòng Họp Thông Minh & Google Meet</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl font-medium">
            Giám sát trạng thái phòng họp theo thời gian thực, tích hợp camera hội nghị Neat Bar/Polycom và tự động khởi tạo link Google Meet bảo mật cho mọi cuộc họp nội bộ.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              const demoMeet = `https://meet.google.com/vcm-${Math.random().toString(36).substring(2, 6)}`;
              window.open(demoMeet, '_blank');
            }}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <Video className="w-4 h-4 text-emerald-400" />
            Tạo Nhanh Google Meet
          </button>
          <button
            onClick={() => setIsBookingModalOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Đặt Phòng Họp Mới
          </button>
        </div>
      </div>

      {/* Filter and Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setFilterFloor('all')}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer", filterFloor === 'all' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900")}
          >
            Tất cả tầng ({rooms.length})
          </button>
          <button
            onClick={() => setFilterFloor('Tầng 12')}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer", filterFloor === 'Tầng 12' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900")}
          >
            Tầng 12 (Boardroom)
          </button>
          <button
            onClick={() => setFilterFloor('Tầng 3')}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer", filterFloor === 'Tầng 3' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900")}
          >
            Tầng 3 (Town Hall)
          </button>
          <button
            onClick={() => setFilterFloor('Tầng 8')}
            className={cn("px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer", filterFloor === 'Tầng 8' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900")}
          >
            Tầng 8 (Innovation)
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            3 Phòng Sẵn Sàng
          </span>
          <span className="flex items-center gap-1.5 text-rose-700 bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            1 Phòng Đang Họp
          </span>
        </div>
      </div>

      {/* Grid of Meeting Rooms */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredRooms.map(room => (
          <div key={room.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between">
            <div>
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                      {room.id}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {room.floor}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-slate-900">{room.name}</h3>
                </div>

                <div>
                  {room.status === 'available' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Đang trống
                    </span>
                  )}
                  {room.status === 'occupied' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Đang có cuộc họp
                    </span>
                  )}
                  {room.status === 'maintenance' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-600 border border-slate-300">
                      Bảo trì
                    </span>
                  )}
                </div>
              </div>

              {/* Room Details & Equipment */}
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    Sức chứa tiêu chuẩn:
                  </span>
                  <span className="font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                    {room.capacity} người
                  </span>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Trang thiết bị hội nghị:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {room.equipment.map((eq, i) => (
                      <span key={i} className="text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg">
                        {eq}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Current Ongoing Meeting (if occupied) */}
                {room.currentMeeting && (
                  <div className="p-3.5 bg-rose-50/80 border border-rose-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                        Cuộc họp đang diễn ra:
                      </span>
                      <span className="text-xs font-mono font-bold text-rose-700">{room.currentMeeting.time}</span>
                    </div>
                    <p className="text-xs font-black text-slate-900">{room.currentMeeting.title}</p>
                    <p className="text-[11px] text-slate-600">Chủ trì: <span className="font-bold">{room.currentMeeting.host}</span></p>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleJoinMeeting(room.currentMeeting!.meetUrl)}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Video className="w-3.5 h-3.5" />
                        Tham gia Google Meet
                      </button>
                      <button
                        onClick={() => handleCopyLink(room.currentMeeting!.meetUrl)}
                        className="px-2.5 py-1.5 bg-white border border-rose-200 hover:bg-rose-100/50 rounded-lg text-xs font-bold text-rose-700 transition-all flex items-center gap-1 cursor-pointer"
                        title="Sao chép liên kết"
                      >
                        {copiedUrl === room.currentMeeting.meetUrl ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Đã chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Chép link
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Upcoming Meetings */}
                {room.upcomingMeetings.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lịch họp kế tiếp hôm nay:</p>
                    {room.upcomingMeetings.map((m, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">{m.title}</p>
                          <p className="text-[11px] text-slate-500">{m.time} • Chủ trì: {m.host}</p>
                        </div>
                        {m.meetUrl && (
                          <button
                            onClick={() => handleJoinMeeting(m.meetUrl)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg font-bold shrink-0 flex items-center gap-1 transition-all cursor-pointer text-[11px]"
                          >
                            <Video className="w-3 h-3" />
                            Meet
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setSelectedRoomId(room.id);
                  setIsBookingModalOpen(true);
                }}
                className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Đặt phòng này
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Đặt Phòng Họp */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Đăng Ký Đặt Phòng Họp & Google Meet</h3>
                  <p className="text-xs text-slate-500">Đồng bộ tự động vào Google Calendar và eOffice</p>
                </div>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên cuộc họp / Nội dung làm việc *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Họp R&D Kiến trúc Smart Order Routing"
                  value={meetingTitle}
                  onChange={(e) => setMeetingTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Chọn phòng họp *</label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.name} ({r.capacity} người)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Người chủ trì / Bộ phận</label>
                  <input
                    type="text"
                    value={meetingHost}
                    onChange={(e) => setMeetingHost(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ngày họp</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Bắt đầu</label>
                  <input
                    type="time"
                    value={meetingStart}
                    onChange={(e) => setMeetingStart(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kết thúc</label>
                  <input
                    type="time"
                    value={meetingEnd}
                    onChange={(e) => setMeetingEnd(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="autoCreateMeet"
                  checked={autoCreateMeet}
                  onChange={(e) => setAutoCreateMeet(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <label htmlFor="autoCreateMeet" className="text-xs text-indigo-950 font-semibold cursor-pointer">
                  Tự động sinh liên kết Google Meet bảo mật và gửi thông báo lịch mời đến thành viên
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-rose-600/20 cursor-pointer"
                >
                  Xác Nhận Đặt Phòng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
