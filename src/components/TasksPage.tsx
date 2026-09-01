import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Kanban, ListChecks, Users2, BarChart3, Plus, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { TaskKanban } from './TaskKanban';
import { TaskMyTasks } from './TaskMyTasks';
import { TaskDelegation } from './TaskDelegation';
import { TaskReports } from './TaskReports';
import { TaskDetailModal } from './TaskDetailModal';
import { Task, DEFAULT_TASKS } from '../types/task';

/**
 * Tasks Hub — MỘT hệ thống công việc, BỐN cách sắp xếp (không phải 4 module riêng):
 *   Kanban       — theo cột trạng thái
 *   Việc của tôi — danh sách cá nhân
 *   Giao việc    — ủy quyền & theo dõi
 *   Báo cáo      — thống kê
 * Cùng state `tasks` — đổi view không mất dữ liệu, sửa ở đâu thấy ở đó.
 * (Trước đây 4 file riêng không có route, chỉ Workspace nhúng kanban.)
 */
const VIEWS = [
  { id: 'kanban', label: 'Kanban', icon: Kanban, desc: 'Công việc theo cột trạng thái' },
  { id: 'my', label: 'Việc của tôi', icon: ListChecks, desc: 'Danh sách nhiệm vụ cá nhân' },
  { id: 'delegation', label: 'Giao việc', icon: Users2, desc: 'Ủy quyền và theo dõi tiến độ' },
  { id: 'reports', label: 'Báo cáo', icon: BarChart3, desc: 'Thống kê hiệu suất công việc' }
] as const;

type ViewId = typeof VIEWS[number]['id'];

export function TasksPage() {
  const [view, setView] = useState<ViewId>('kanban');
  const [tasks, setTasks] = useState<Task[]>(DEFAULT_TASKS);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const navigate = useNavigate();

  const updateTask = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
  };

  const addTask = (partial: Partial<Task>) => {
    const newTask: Task = {
      id: 'TKS-' + Date.now().toString().slice(-6),
      title: partial.title || 'Công việc mới',
      desc: partial.desc,
      scope: partial.scope || 'individual',
      department: partial.department || 'Ban Lãnh đạo',
      priority: partial.priority || 'medium',
      status: partial.status || 'todo',
      progress: partial.progress ?? 0,
      labels: partial.labels || [],
      assignee: partial.assignee || DEFAULT_TASKS[0].assignee,
      date: partial.date || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      creator: 'Tôi',
      subtasks: partial.subtasks || [],
      comments: partial.comments || []
    };
    setTasks(prev => [newTask, ...prev]);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in- duration-500">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quản lý Công việc</h1>
          <p className="text-sm text-slate-500 mt-1">Một hệ thống — bốn cách sắp xếp: Kanban, việc của tôi, giao việc, báo cáo.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-primary-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-primary-700 transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Thêm công việc
          </button>
          <button
            onClick={() => navigate('/workflow')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-2.5 rounded-lg"
          >
            Điều hành & Workflow <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* View switcher — cùng dữ liệu, nhiều cách xếp */}
      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
        {VIEWS.map(v => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            title={v.desc}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2',
              view === v.id ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
            )}
          >
            <v.icon className="w-4 h-4" /> {v.label}
          </button>
        ))}
      </div>

      {/* Cùng state tasks — mọi view nhìn thấy cùng dữ liệu */}
      <div>
        {view === 'kanban' && (
          <TaskKanban
            tasks={tasks}
            onTasksChange={(next) => setTasks(next)}
            onSelectTask={(t) => setSelectedTask(t)}
            onAddTaskQuick={(status) => { setShowAddModal(true); void status; }}
          />
        )}
        {view === 'my' && (
          <TaskMyTasks
            tasks={tasks}
            onUpdateTask={updateTask}
            onSelectTask={(t) => setSelectedTask(t)}
          />
        )}
        {view === 'delegation' && (
          <TaskDelegation
            tasks={tasks}
            onAddTask={addTask}
            onEditTask={updateTask}
            onDeleteTask={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
            onSelectTask={(t) => setSelectedTask(t)}
          />
        )}
        {view === 'reports' && <TaskReports tasks={tasks} />}
      </div>

      {/* Chi tiết — dùng chung mọi view */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onSave={updateTask}
        onDelete={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
      />

      {/* Modal thêm nhanh */}
      {showAddModal && (
        <QuickAddTaskModal
          onClose={() => setShowAddModal(false)}
          onAdd={addTask}
        />
      )}
    </div>
  );
}

function QuickAddTaskModal({ onClose, onAdd }: { onClose: () => void; onAdd: (t: Partial<Task>) => void }) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Task['priority']>('medium');
  const [date, setDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title, priority, date });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center">
          <h3 className="text-base font-semibold text-slate-900">Thêm công việc mới</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Tiêu đề <span className="text-rose-500">*</span></label>
            <input
              autoFocus
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Chuẩn bị chiến dịch 2/9"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Độ ưu tiên</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Task['priority'])}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30">
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao</option>
                <option value="urgent">Gấp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Hạn chót</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200">
              Hủy
            </button>
            <button type="submit" disabled={!title.trim()}
              className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-50">
              Thêm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
