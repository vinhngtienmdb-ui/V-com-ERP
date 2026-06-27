import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Filter, 
  Users, 
  User, 
  Building2, 
  Tag, 
  AlertTriangle,
  ArrowRight,
  Eye,
  LayoutGrid
} from 'lucide-react';
import { Task, Member, MOCK_MEMBERS, DEPARTMENTS } from '../types/task';
import { cn } from '../lib/utils';

interface TaskKanbanProps {
  tasks: Task[];
  onTasksChange: (updater: Task[]) => void;
  onSelectTask: (task: Task) => void;
  onAddTaskQuick: (status: 'todo' | 'in_progress' | 'testing' | 'done') => void;
}

export function TaskKanban({ tasks, onTasksChange, onSelectTask, onAddTaskQuick }: TaskKanbanProps) {
  const [filterScope, setFilterScope] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  // Drag and drop setup
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: 'todo' | 'in_progress' | 'testing' | 'done') => {
    const id = e.dataTransfer.getData('taskId');
    if (!id) return;

    const nextTasks = tasks.map(t => {
      if (t.id === id) {
        return {
          ...t, 
          status: targetStatus,
          progress: targetStatus === 'done' ? 100 : (targetStatus === 'todo' ? 0 : t.progress)
        };
      }
      return t;
    });
    onTasksChange(nextTasks);
  };

  // Filter tasks based on settings
  const filteredTasks = tasks.filter(t => {
    const matchScope = filterScope === 'all' || t.scope === filterScope;
    const matchDept = filterDept === 'all' || t.department === filterDept;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    return matchScope && matchDept && matchPriority;
  });

  const columns: { id: 'todo' | 'in_progress' | 'testing' | 'done'; title: string; color: string; border: string }[] = [
    { id: 'todo', title: 'Cần làm', color: 'bg-slate-100 text-slate-800', border: 'border-t-slate-400' },
    { id: 'in_progress', title: 'Đang thực hiện', color: 'bg-blue-50 text-blue-800', border: 'border-t-blue-500' },
    { id: 'testing', title: 'Đang kiểm thử', color: 'bg-amber-50 text-amber-800', border: 'border-t-amber-500' },
    { id: 'done', title: 'Đã hoàn thành', color: 'bg-emerald-50 text-emerald-800', border: 'border-t-emerald-500' }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Filter and Actions Bar */}
      <div className="bg-white rounded-lg border border-slate-300 p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between text-xs font-sans">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1.5 font-bold">
            <Filter className="w-4 h-4 text-slate-400" />
            Lọc thẻ bảng:
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Phạm vi:</span>
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">Tất cả</option>
              <option value="individual">Cá nhân</option>
              <option value="team">Đội nhóm</option>
              <option value="department">Phòng ban</option>
              <option value="company">Toàn công ty</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Bộ phận:</span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">Tất cả Phòng ban</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-500">Ưu tiên:</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2 py-1.5 font-bold text-slate-800 cursor-pointer"
            >
              <option value="all">Tất cả mức</option>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Gấp</option>
            </select>
          </div>
        </div>

        <div className="px-3 py-1 bg-slate-100 rounded-full font-bold text-[10.5px] text-slate-600 flex items-center gap-1">
          <LayoutGrid className="w-3.5 h-3.5" /> Thể hiện: {filteredTasks.length} thẻ
        </div>
      </div>

      {/* Board Layout Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className="bg-slate-50/50 rounded-lg border border-slate-300 flex flex-col min-h-[550px] transition-all"
            >
              {/* Column Header */}
              <div className={cn(
                "p-3.5 border-b border-slate-200 flex items-center justify-between border-t-4 rounded-t-xl",
                col.border
              )}>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-xs text-slate-900 uppercase tracking-wider">{col.title}</h3>
                  <span className="bg-white border border-slate-300 text-slate-600 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                <button 
                  onClick={() => onAddTaskQuick(col.id)}
                  className="p-1 hover:bg-white border border-transparent hover:border-slate-300 rounded transition-colors text-slate-500"
                  title="Thêm công việc nhanh"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Tasks List */}
              <div className="p-3.5 space-y-3 flex-1 overflow-y-auto max-h-[700px]">
                {colTasks.map(task => {
                  const today = new Date().toISOString().split('T')[0];
                  const isOverdue = task.status !== 'done' && task.date < today;

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className={cn(
                        "bg-white p-4 rounded-lg border border-slate-300 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-grab active:cursor-grabbing group relative",
                        isOverdue && "border-red-300 bg-red-50/10"
                      )}
                    >
                      {/* Drag Handles / Category icons */}
                      <div className="flex justify-between items-center mb-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={cn(
                            "text-[8.5px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider",
                            task.priority === 'urgent' ? "bg-rose-100 text-rose-700 font-black" :
                            task.priority === 'high' ? "bg-orange-100 text-orange-700" :
                            task.priority === 'medium' ? "bg-blue-100 text-blue-700" :
                            "bg-slate-100 text-slate-600"
                          )}>
                            {task.priority === 'urgent' ? 'Khẩn' :
                             task.priority === 'high' ? 'Cao' :
                             task.priority === 'medium' ? 'T.Bình' : 'Thấp'}
                          </span>
                          
                          <span className={cn(
                            "text-[8.5px] font-bold px-1 rounded uppercase bg-slate-100 text-slate-500"
                          )}>
                            {task.scope === 'company' ? 'C.Ty' :
                             task.scope === 'department' ? 'P.Ban' :
                             task.scope === 'team' ? 'Nhóm' : 'C.Nhân'}
                          </span>
                        </div>

                        {/* View Action */}
                        <button 
                          onClick={() => onSelectTask(task)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 border border-slate-200 rounded transition-opacity"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                        </button>
                      </div>

                      {/* Title */}
                      <h4 
                        onClick={() => onSelectTask(task)}
                        className="text-xs font-extrabold text-slate-800 hover:text-indigo-600 transition-colors leading-snug cursor-pointer line-clamp-2"
                      >
                        {task.title}
                      </h4>

                      {/* Desc snippet */}
                      {task.desc && (
                        <p className="text-[10.5px] text-slate-500 line-clamp-2 mt-1.5 leading-relaxed font-medium">
                          {task.desc}
                        </p>
                      )}

                      {/* Labels tags representation */}
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {task.labels.slice(0, 3).map(lbl => (
                            <span key={lbl} className="bg-slate-50 border border-slate-200/80 text-slate-400 font-semibold px-1 py-0.2 rounded text-[9.5px]">
                              {lbl}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Progress Line */}
                      <div className="mt-3.5 space-y-1">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                          <span>Tiến trình:</span>
                          <span>{task.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all",
                              task.status === 'done' ? "bg-emerald-500" : "bg-indigo-500"
                            )} 
                            style={{ width: `${task.progress}%` }} 
                          />
                        </div>
                      </div>

                      {/* Footer Info line */}
                      <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-slate-100">
                        <span className={cn(
                          "flex items-center gap-1 text-[10px] font-bold",
                          isOverdue ? "text-rose-600 animate-pulse font-extrabold" : "text-slate-400"
                        )}>
                          <Calendar className="w-3 h-3" /> 
                          {task.date.substring(5)}
                        </span>
                        
                        {/* Assignee initials badge */}
                        <div 
                          className="w-5 h-5 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8.5px] font-bold text-slate-700" 
                          title={`${task.assignee.name} (${task.assignee.position})`}
                        >
                          {task.assignee.initials}
                        </div>
                      </div>

                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div className="py-8 text-center text-slate-400 text-[10.5px] italic border-2 border-dashed border-slate-200 rounded-lg">
                    Cột trống
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
