import React, { useState, useEffect } from 'react';
import { 
  X, 
  Calendar, 
  User, 
  Tag, 
  Briefcase, 
  Layers, 
  Trash2, 
  Save, 
  Plus, 
  Trash, 
  MessageSquare,
  CheckSquare,
  Square,
  Sliders,
  Send,
  Building2
} from 'lucide-react';
import { Task, Member, MOCK_MEMBERS, DEPARTMENTS, LABELS } from '../types/task';
import { cn } from '../lib/utils';

interface TaskDetailModalProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: Task) => void;
  onDelete?: (id: string) => void;
}

export function TaskDetailModal({ task, isOpen, onClose, onSave, onDelete }: TaskDetailModalProps) {
  const [title, setTitle] = useState(task.title);
  const [desc, setDesc] = useState(task.desc || '');
  const [scope, setScope] = useState(task.scope);
  const [department, setDepartment] = useState(task.department);
  const [priority, setPriority] = useState(task.priority);
  const [status, setStatus] = useState(task.status);
  const [progress, setProgress] = useState(task.progress);
  const [labels, setLabels] = useState<string[]>(task.labels);
  const [assigneeId, setAssigneeId] = useState(task.assignee.id);
  const [date, setDate] = useState(task.date);
  
  // Subtasks & Comments
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [comments, setComments] = useState(task.comments || []);
  const [newCommentText, setNewCommentText] = useState('');

  // Reset states when current task changes
  useEffect(() => {
    setTitle(task.title);
    setDesc(task.desc || '');
    setScope(task.scope);
    setDepartment(task.department);
    setPriority(task.priority);
    setStatus(task.status);
    setProgress(task.progress);
    setLabels(task.labels);
    setAssigneeId(task.assignee.id);
    setDate(task.date);
    setSubtasks(task.subtasks || []);
    setComments(task.comments || []);
  }, [task]);

  if (!isOpen) return null;

  const handleSave = () => {
    const selectedAssignee = MOCK_MEMBERS.find(m => m.id === assigneeId) || task.assignee;
    
    onSave({
      ...task,
      title,
      desc,
      scope,
      department,
      priority,
      status,
      progress: Number(progress),
      labels,
      assignee: selectedAssignee,
      date,
      subtasks,
      comments
    });
    onClose();
  };

  const toggleLabel = (label: string) => {
    if (labels.includes(label)) {
      setLabels(labels.filter(l => l !== label));
    } else {
      setLabels([...labels, label]);
    }
  };

  // Subtask Actions
  const toggleSubtask = (id: string) => {
    const nextSubtasks = subtasks.map(sub => {
      if (sub.id === id) {
        const nextDone = !sub.done;
        return { ...sub, done: nextDone };
      }
      return sub;
    });
    setSubtasks(nextSubtasks);

    // Calculate auto progress based on completed subtasks
    if (nextSubtasks.length > 0) {
      const completed = nextSubtasks.filter(s => s.done).length;
      const pct = Math.round((completed / nextSubtasks.length) * 100);
      setProgress(pct);
    }
  };

  const addSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    
    const newSub = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      done: false
    };
    
    const nextSubtasks = [...subtasks, newSub];
    setSubtasks(nextSubtasks);
    setNewSubtaskTitle('');
    
    // Recalculate progress
    const completed = nextSubtasks.filter(s => s.done).length;
    setProgress(Math.round((completed / nextSubtasks.length) * 100));
  };

  const removeSubtask = (id: string) => {
    const nextSubtasks = subtasks.filter(s => s.id !== id);
    setSubtasks(nextSubtasks);
    
    if (nextSubtasks.length > 0) {
      const completed = nextSubtasks.filter(s => s.done).length;
      setProgress(Math.round((completed / nextSubtasks.length) * 100));
    } else {
      setProgress(0);
    }
  };

  // Comments Actions
  const addComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const newComment = {
      id: `comm-${Date.now()}`,
      author: 'Nguyễn Văn Thắng', // Logged in user proxy
      text: newCommentText.trim(),
      date: new Date().toISOString().split('T')[0]
    };

    setComments([...comments, newComment]);
    setNewCommentText('');
  };

  const deleteComment = (id: string) => {
    setComments(comments.filter(c => c.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm flex justify-end z-50 transition-all font-sans">
      <div className="bg-white w-full max-w-2xl h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold bg-slate-200 text-slate-800 px-2 py-1 rounded">
              {task.id}
            </span>
            <span className={cn(
              "text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border",
              task.scope === 'company' ? "bg-purple-50 text-purple-700 border-purple-200" :
              task.scope === 'department' ? "bg-primary-50 text-blue-700 border-blue-200" :
              task.scope === 'team' ? "bg-orange-50 text-orange-700 border-orange-200" :
              "bg-emerald-50 text-emerald-700 border-emerald-200"
            )}>
              {task.scope === 'company' ? 'Công ty' :
               task.scope === 'department' ? 'Phòng ban' :
               task.scope === 'team' ? 'Đội nhóm' : 'Cá nhân'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {onDelete && (
              <button 
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
                    onDelete(task.id);
                    onClose();
                  }
                }}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Xóa công việc"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Title and Description */}
          <div className="space-y-4">
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-black text-slate-900 border-none px-0 focus:ring-0 focus:border-none placeholder-slate-400 font-sans tracking-tight focus:outline-none"
              placeholder="Nhập tiêu đề công việc..."
            />
            
            <textarea 
              value={desc} 
              onChange={(e) => setDesc(e.target.value)}
              className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 placeholder-slate-400 resize-none h-24"
              placeholder="Mô tả nội dung chi tiết công việc..."
            />
          </div>

          {/* Quick Properties Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs">
            
            {/* Assignee Selection */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-slate-400" /> Người phụ trách
              </label>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-bold text-slate-800"
              >
                {MOCK_MEMBERS.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.position})</option>
                ))}
              </select>
            </div>

            {/* Deadline Selection */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> Hạn hoàn thành
              </label>
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-bold text-slate-800"
              />
            </div>

            {/* Priority Selection */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <Sliders className="w-3.5 h-3.5 text-slate-400" /> Mức độ ưu tiên
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-bold text-slate-800"
              >
                <option value="low">Thấp</option>
                <option value="medium">Trung bình</option>
                <option value="high">Cao (Quan trọng)</option>
                <option value="urgent">Gấp (Khẩn cấp)</option>
              </select>
            </div>

            {/* Status Selection */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-bold text-slate-800"
              >
                <option value="todo">Cần làm</option>
                <option value="in_progress">Đang thực hiện</option>
                <option value="testing">Đang kiểm thử</option>
                <option value="done">Hoàn thành</option>
              </select>
            </div>

            {/* Scope (Phạm vi) Selection */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Cấp độ (Phạm vi)
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-bold text-slate-800"
              >
                <option value="individual">Cá nhân</option>
                <option value="team">Đội nhóm</option>
                <option value="department">Phòng ban</option>
                <option value="company">Toàn công ty</option>
              </select>
            </div>

            {/* Department Selection */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> Bộ phận / Phòng ban
              </label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-2 font-bold text-slate-800"
              >
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Interactive Progress Slider */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div className="flex justify-between items-center text-xs">
              <span className="font-extrabold text-slate-500 uppercase tracking-wider">Tiến độ thực hiện</span>
              <span className="text-sm font-black text-primary-600 bg-white border border-slate-300 px-2 py-0.5 rounded shadow-sm">{progress}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="100" 
              step="5"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
            />
            <div className="flex justify-between text-[10px] font-bold text-slate-400">
              <span>0% (Mới tạo)</span>
              <span>50% (Đang làm)</span>
              <span>100% (Hoàn tất)</span>
            </div>
          </div>

          {/* Labels / Tags Multi-select */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Nhãn công việc (Labels)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {LABELS.map(label => {
                const isSelected = labels.includes(label);
                return (
                  <button
                    key={label}
                    onClick={() => toggleLabel(label)}
                    className={cn(
                      "px-2.5 py-1 rounded text-xs transition-all font-bold cursor-pointer",
                      isSelected 
                        ? "bg-slate-900 text-white border border-slate-900" 
                        : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Checklist (Subtasks) */}
          <div className="space-y-3.5 pt-2 border-t border-slate-200">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-slate-400" /> Danh mục việc phụ ({subtasks.filter(s => s.done).length}/{subtasks.length})
            </h4>
            
            {/* List */}
            {subtasks.length > 0 ? (
              <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
                {subtasks.map(sub => (
                  <div key={sub.id} className="flex items-center justify-between group/sub">
                    <button 
                      onClick={() => toggleSubtask(sub.id)}
                      className="flex items-start gap-2.5 text-left text-sm font-medium flex-1 cursor-pointer"
                    >
                      {sub.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <span className={cn(
                        "text-slate-800",
                        sub.done && "line-through text-slate-400"
                      )}>
                        {sub.title}
                      </span>
                    </button>
                    <button 
                      onClick={() => removeSubtask(sub.id)}
                      className="text-slate-400 hover:text-rose-500 opacity-0 group-hover/sub:opacity-100 transition-opacity p-1 rounded hover:bg-white"
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa có danh mục việc phụ nào.</p>
            )}

            {/* Add Subtask Form */}
            <form onSubmit={addSubtask} className="flex gap-2">
              <input 
                type="text" 
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Nhập việc phụ mới..."
                className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800"
              />
              <button 
                type="submit"
                className="px-3 py-1.5 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-200 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Thêm
              </button>
            </form>
          </div>

          {/* Comments Section */}
          <div className="space-y-3.5 pt-4 border-t border-slate-200">
            <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-slate-400" /> Thảo luận ({comments.length})
            </h4>

            {/* List */}
            {comments.length > 0 ? (
              <div className="space-y-4">
                {comments.map(comm => (
                  <div key={comm.id} className="flex gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/60 relative group/comm animate-in fade-in">
                    <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center font-bold text-slate-600">
                      {comm.author.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{comm.author}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{comm.date}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-medium">{comm.text}</p>
                    </div>
                    <button 
                      onClick={() => deleteComment(comm.id)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-rose-500 opacity-0 group-hover/comm:opacity-100 transition-opacity"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa có bình luận thảo luận nào.</p>
            )}

            {/* Post Comment Form */}
            <form onSubmit={addComment} className="flex gap-2">
              <input 
                type="text" 
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                placeholder="Nhập nội dung phản hồi, ý kiến..."
                className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs text-slate-800"
              />
              <button 
                type="submit"
                className="px-3.5 py-1 bg-slate-900 text-white rounded-lg hover:bg-orange-700 font-bold text-xs flex items-center gap-1 shrink-0"
              >
                <Send className="w-3 h-3" /> Gửi
              </button>
            </form>
          </div>

        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3.5">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-100 transition-all text-slate-700"
          >
            Hủy bỏ
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-primary-600 text-[#FAF9F5] rounded-lg text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Save className="w-4 h-4" /> Lưu thay đổi
          </button>
        </div>

      </div>
    </div>
  );
}
