import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Calendar, 
  ListTodo, 
  CheckSquare, 
  MoreHorizontal, 
  AlertTriangle, 
  Play, 
  FileText, 
  Sliders, 
  MessageSquare,
  ArrowRight,
  Plus
} from 'lucide-react';
import { Task, Member, MOCK_MEMBERS, LABELS } from '../types/task';
import { cn } from '../lib/utils';

interface TaskMyTasksProps {
  tasks: Task[];
  onUpdateTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
}

export function TaskMyTasks({ tasks, onUpdateTask, onSelectTask }: TaskMyTasksProps) {
  // Proxy logged in user: Tran Thi Hong (id: m2)
  const myMember = MOCK_MEMBERS[1]; // Tran Thi Hong
  const [activeTab, setActiveTab] = useState<'all' | 'todo' | 'in_progress' | 'testing' | 'done'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only tasks assigned to m2 (Tran Thi Hong)
  const myTasks = tasks.filter(t => t.assignee.id === myMember.id);

  // Search filter
  const filteredTasks = myTasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (t.desc && t.desc.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    return t.status === activeTab && matchesSearch;
  });

  // Calculate metrics
  const total = myTasks.length;
  const pending = myTasks.filter(t => t.status !== 'done').length;
  const completed = myTasks.filter(t => t.status === 'done').length;
  
  const today = new Date().toISOString().split('T')[0];
  const overdue = myTasks.filter(t => t.status !== 'done' && t.date < today).length;

  const handleStatusChange = (task: Task, newStatus: 'todo' | 'in_progress' | 'testing' | 'done') => {
    onUpdateTask({
      ...task,
      status: newStatus,
      progress: newStatus === 'done' ? 100 : task.progress
    });
  };

  const handleProgressChange = (task: Task, newProgress: number) => {
    onUpdateTask({
      ...task,
      progress: newProgress,
      status: newProgress === 100 ? 'done' : 
              newProgress > 0 && task.status === 'todo' ? 'in_progress' : task.status
    });
  };

  const handleSubtaskToggle = (task: Task, subtaskId: string) => {
    const nextSubtasks = task.subtasks.map(s => {
      if (s.id === subtaskId) return { ...s, done: !s.done };
      return s;
    });

    const completedSubs = nextSubtasks.filter(s => s.done).length;
    const nextProgress = nextSubtasks.length > 0 
      ? Math.round((completedSubs / nextSubtasks.length) * 100) 
      : task.progress;

    onUpdateTask({
      ...task,
      subtasks: nextSubtasks,
      progress: nextProgress,
      status: nextProgress === 100 ? 'done' : task.status
    });
  };

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Banner with Staff summary */}
      <div className="bg-[#1E293B] text-white p-6 rounded-xl border border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-lg border-2 border-slate-600 shadow-sm text-[#FAF9F5]">
            {myMember.initials}
          </div>
          <div>
            <h2 className="text-base font-black tracking-tight">{myMember.name}</h2>
            <p className="text-[11px] text-slate-400 font-medium font-sans">
              Chức vụ: <strong>{myMember.position}</strong> — Bộ phận: <strong>{myMember.department}</strong>
            </p>
          </div>
        </div>

        {/* Metric counts */}
        <div className="flex flex-wrap gap-3 text-center text-xs relative z-10 w-full md:w-auto">
          
          <div className="flex-1 min-w-[70px] bg-slate-800/60 border border-slate-700 p-2.5 rounded-lg">
            <span className="text-slate-400 block text-[9.5px] uppercase font-bold tracking-wider mb-0.5">Tổng số</span>
            <span className="text-sm font-black block">{total} j</span>
          </div>

          <div className="flex-1 min-w-[70px] bg-indigo-950/40 border border-indigo-900/60 p-2.5 rounded-lg">
            <span className="text-slate-400 block text-[9.5px] uppercase font-bold tracking-wider mb-0.5">Chưa xong</span>
            <span className="text-sm font-black text-indigo-400 block">{pending} j</span>
          </div>

          <div className="flex-1 min-w-[70px] bg-rose-950/40 border border-rose-900/60 p-2.5 rounded-lg">
            <span className="text-slate-400 block text-[9.5px] uppercase font-bold tracking-wider mb-0.5">Quá hạn</span>
            <span className={cn("text-sm font-black block", overdue > 0 ? "text-rose-400 animate-pulse" : "text-slate-400")}>{overdue} j</span>
          </div>

          <div className="flex-1 min-w-[70px] bg-emerald-950/40 border border-emerald-900/60 p-2.5 rounded-lg">
            <span className="text-slate-400 block text-[9.5px] uppercase font-bold tracking-wider mb-0.5">Hoàn tất</span>
            <span className="text-sm font-black text-emerald-400 block">{completed} j</span>
          </div>

        </div>

      </div>

      {/* Tabs list & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between text-xs font-sans">
        
        {/* Navigation Filters */}
        <div className="flex bg-slate-100 border border-slate-300 p-1.5 gap-1 rounded-xl overflow-x-auto hidden-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all",
              activeTab === 'all' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Tất cả ({total})
          </button>
          
          <button
            onClick={() => setActiveTab('todo')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all",
              activeTab === 'todo' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Cần làm ({myTasks.filter(t => t.status === 'todo').length})
          </button>

          <button
            onClick={() => setActiveTab('in_progress')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all",
              activeTab === 'in_progress' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Đang làm ({myTasks.filter(t => t.status === 'in_progress').length})
          </button>

          <button
            onClick={() => setActiveTab('testing')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all",
              activeTab === 'testing' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Đang test ({myTasks.filter(t => t.status === 'testing').length})
          </button>

          <button
            onClick={() => setActiveTab('done')}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-all",
              activeTab === 'done' ? "bg-white text-orange-700 shadow-sm border border-slate-300" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Hoàn tất ({myTasks.filter(t => t.status === 'done').length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <input 
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo chủ đề, tiêu đề việc của bạn..."
            className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-9 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 border-b-2"
          />
          <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>

      </div>

      {/* Task Rows List */}
      {filteredTasks.length > 0 ? (
        <div className="space-y-4">
          {filteredTasks.map(task => {
            const isOverdue = task.status !== 'done' && task.date < today;

            return (
              <div 
                key={task.id}
                className={cn(
                  "bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden p-5 transition-all text-xs flex flex-col md:flex-row gap-5 relative group",
                )}
              >
                {/* Due alert side indicator */}
                {isOverdue && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-red-600 animate-pulse" />
                )}

                {/* Left block: Title, description, meta */}
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-slate-400 text-[10px]">{task.id}</span>
                    
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border",
                      task.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' :
                      task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                      task.priority === 'medium' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    )}>
                      {task.priority === 'urgent' ? 'Nguy cấp' :
                       task.priority === 'high' ? 'Khẩn' :
                       task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                    </span>

                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border",
                      task.scope === 'company' ? "bg-purple-50 text-purple-700 border-purple-200" :
                      task.scope === 'department' ? "bg-blue-50 text-blue-700 border-blue-200" :
                      task.scope === 'team' ? "bg-orange-50 text-orange-700 border-orange-200" :
                      "bg-emerald-50 text-emerald-700 border-emerald-200"
                    )}>
                      {task.scope === 'company' ? 'Công ty' :
                       task.scope === 'department' ? 'Phòng ban' :
                       task.scope === 'team' ? 'Đội nhóm' : 'Cá nhân'}
                    </span>

                    <span className="text-[10px] text-slate-400 font-bold ml-auto sm:ml-0.5">
                      Giao bởi: <strong>{task.creator}</strong>
                    </span>
                  </div>

                  <h3 
                    onClick={() => onSelectTask(task)}
                    className="font-black text-sm text-[#111827] hover:text-[#2563EB] cursor-pointer transition-colors"
                  >
                    {task.title}
                  </h3>

                  {task.desc && (
                    <p className="text-slate-600 text-[11px] leading-relaxed max-w-2xl font-medium font-sans">
                      {task.desc}
                    </p>
                  )}

                  {/* Subtask micro checklists */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 mt-2.5 max-w-2xl space-y-2">
                      <p className="font-extrabold text-[#64748B] text-[9.5px] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                        <CheckSquare className="w-3.5 h-3.5" />
                        Đầu việc chi tiết ({task.subtasks.filter(s => s.done).length}/{task.subtasks.length})
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {task.subtasks.map(sub => (
                          <button
                            key={sub.id}
                            onClick={() => handleSubtaskToggle(task, sub.id)}
                            className="flex items-start text-left gap-1.5 text-[10.5px] font-medium font-sans cursor-pointer hover:bg-white p-1 rounded transition-colors group/subitem"
                          >
                            <span className="shrink-0 mt-0.5">
                              {sub.done ? (
                                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <span className="block w-3.5 h-3.5 rounded-sm border border-slate-400 group-hover/subitem:border-emerald-600" />
                              )}
                            </span>
                            <span className={cn("text-slate-700", sub.done && "line-through text-slate-400")}>
                              {sub.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Labels list */}
                  <div className="flex flex-wrap gap-1 pt-1.5">
                    {task.labels.map(lbl => (
                      <span key={lbl} className="bg-slate-100 border border-slate-200 text-slate-500 font-semibold px-2 py-0.5 rounded text-[10px]">{lbl}</span>
                    ))}
                  </div>
                </div>

                {/* Right block: Progress sliders/controls & Dropdown status */}
                <div className="flex md:flex-col items-stretch md:items-end justify-between md:justify-center border-t md:border-t-0 md:border-l border-slate-200 pt-3 md:pt-0 md:pl-5 md:w-52 shrink-0 gap-3">
                  
                  {/* Status Dropdown control */}
                  <div className="space-y-1 w-full text-left md:text-right">
                    <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Trạng thái</span>
                    <select
                      value={task.status}
                      onChange={(e) => handleStatusChange(task, e.target.value as any)}
                      className={cn(
                        "font-bold text-[11px] rounded-lg px-2 py-1.5 bg-slate-50 border cursor-pointer border-slate-300 focus:ring-2 focus:ring-[#2563EB]/20 outline-none w-full max-w-[150px] inline-block",
                        task.status === 'done' ? "text-emerald-700 border-emerald-400 font-extrabold" : "text-slate-800"
                      )}
                    >
                      <option value="todo">Cần làm</option>
                      <option value="in_progress">Đang làm</option>
                      <option value="testing">Kiểm thử</option>
                      <option value="done">Hoàn thành</option>
                    </select>
                  </div>

                  {/* Deadline displaying */}
                  <div className="space-y-1 w-full text-left md:text-right">
                    <span className="text-[9.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Kỳ hạn chót</span>
                    <span className={cn(
                      "font-mono font-bold text-xs inline-flex items-center gap-1",
                      isOverdue ? "text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-lg text-[10.5px] animate-pulse" : "text-slate-600"
                    )}>
                      <Calendar className="w-3.5 h-3.5" />
                      {task.date}
                    </span>
                  </div>

                  {/* Progress slide bar directly on row */}
                  <div className="space-y-1.5 w-full">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500">
                      <span>Cập nhật tiến độ:</span>
                      <span className="text-[#2563EB] font-black">{task.progress}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={task.progress}
                      onChange={(e) => handleProgressChange(task, Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                    />
                  </div>

                  {/* View Details Action Button */}
                  <button
                    onClick={() => onSelectTask(task)}
                    className="p-1.5 w-full bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center gap-1 font-bold text-[10px] uppercase transition-all mt-4 cursor-pointer"
                  >
                    Xem Chi Tiết &rarr;
                  </button>

                </div>

              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-12 text-center text-slate-500 space-y-2.5">
          <ListTodo className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-extrabold text-sm text-slate-700">Tuyệt vời! Bạn không có công vụ nào tồn đọng</h4>
          <p className="text-xs text-slate-400">Không có công việc nào trong danh mục hoặc bộ lọc hiện tại.</p>
        </div>
      )}

    </div>
  );
}
