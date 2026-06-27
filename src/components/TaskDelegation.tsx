import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  UserPlus, 
  Calendar, 
  Tag, 
  Sliders, 
  Briefcase, 
  Building2, 
  CheckCircle2, 
  Edit, 
  Trash2, 
  ChevronRight, 
  Send,
  Eye,
  AlertCircle
} from 'lucide-react';
import { Task, Member, MOCK_MEMBERS, DEPARTMENTS, LABELS } from '../types/task';
import { cn } from '../lib/utils';

interface TaskDelegationProps {
  tasks: Task[];
  onAddTask: (newTask: Partial<Task>) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onSelectTask: (task: Task) => void;
}

export function TaskDelegation({ tasks, onAddTask, onEditTask, onDeleteTask, onSelectTask }: TaskDelegationProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterScope, setFilterScope] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // New Delegation Form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [scope, setScope] = useState<'individual' | 'team' | 'department' | 'company'>('individual');
  const [department, setDepartment] = useState('Phòng Công nghệ');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [assigneeId, setAssigneeId] = useState(MOCK_MEMBERS[0].id);
  const [date, setDate] = useState(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]); // 5 days from now
  const [taskLabels, setTaskLabels] = useState<string[]>([]);

  const toggleFormLabel = (lbl: string) => {
    if (taskLabels.includes(lbl)) {
      setTaskLabels(taskLabels.filter(item => item !== lbl));
    } else {
      setTaskLabels([...taskLabels, lbl]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Vui lòng nhập tên công việc");
      return;
    }

    const assignedMember = MOCK_MEMBERS.find(m => m.id === assigneeId) || MOCK_MEMBERS[0];

    onAddTask({
      title: title.trim(),
      desc: desc.trim(),
      scope,
      department,
      priority,
      status: 'todo',
      progress: 0,
      labels: taskLabels,
      assignee: assignedMember,
      date,
      subtasks: [],
      comments: [],
      creator: 'Nguyễn Văn Thắng', // mock as logged-in manager
    });

    // Reset Form
    setTitle('');
    setDesc('');
    setScope('individual');
    setPriority('medium');
    setTaskLabels([]);
    setShowForm(false);
    alert('Đã giao công việc và đồng bộ hệ thống thành công!');
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (t.desc && t.desc.toLowerCase().includes(searchTerm.toLowerCase())) ||
                        t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchScope = filterScope === 'all' || t.scope === filterScope;
    const matchDept = filterDept === 'all' || t.department === filterDept;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;

    return matchSearch && matchScope && matchDept && matchPriority && matchStatus;
  });

  return (
    <div className="space-y-6 font-sans">
      
      {/* Action Header & Toggle Form Button */}
      <div className="flex justify-between items-center bg-white rounded-lg border border-slate-300 p-5 shadow-sm">
        <div className="space-y-1">
          <h2 className="text-base font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            Điều phối và Giám sát Công việc
          </h2>
          <p className="text-xs text-slate-500 font-medium font-sans">
            Giao phó công vụ, thiết lập mục tiêu, phân luồng phòng ban và giám sát tiến trình SLA.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer",
            showForm ? "bg-slate-900 text-white" : "bg-[#2563EB] text-[#FAF9F5] hover:bg-slate-800"
          )}
        >
          {showForm ? 'Đóng form' : 'Giao việc mới (Đồng bộ)'}
        </button>
      </div>

      {/* Delegation Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border-2 border-indigo-200/60 p-6 shadow-md space-y-5 animate-in slide-in-from-top duration-300">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" /> Form Giao Công Việc Mới
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Mấu chốt của quy trình điều phối là định vị đúng người, đúng bộ phận và đúng cấp độ ưu tiên.</p>
          </div>

          <div className="space-y-4 text-xs font-sans">
            {/* Title & Desc */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="font-extrabold text-slate-600 uppercase">Tên công việc <span className="text-rose-500 mr-1">*</span></label>
                <input 
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Rà soát phụ lục hợp đồng thương mại dịch vụ eMenu..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800 placeholder-slate-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-600 uppercase">Người được giao phụ trách</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800"
                >
                  {MOCK_MEMBERS.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.position} - {m.department})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description Area */}
            <div className="space-y-1.5">
              <label className="font-extrabold text-slate-600 uppercase">Mô tả chi tiết nội dung công việc</label>
              <textarea 
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Nhập yêu cầu thực hiện công việc, kết quả đầu ra mong đợi và tài liệu tham chiếu nếu có..."
                className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-medium text-slate-700 placeholder-slate-400 h-20 resize-none"
              />
            </div>

            {/* Quick selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Scope */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-600 uppercase flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> Phạm vi cấp độ</label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800"
                >
                  <option value="individual">Cá nhân</option>
                  <option value="team">Đội nhóm</option>
                  <option value="department">Phòng ban</option>
                  <option value="company">Toàn công ty</option>
                </select>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-600 uppercase flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> Bộ phận chính</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-600 uppercase flex items-center gap-1"><Sliders className="w-3.5 h-3.5" /> Mức độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800"
                >
                  <option value="low">Thấp</option>
                  <option value="medium">Trung bình</option>
                  <option value="high">Cao (Gấp)</option>
                  <option value="urgent">Gấp (Khẩn cấp)</option>
                </select>
              </div>

              {/* Deadline */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-600 uppercase flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Hạn hoàn thành</label>
                <input 
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold text-slate-800"
                />
              </div>
            </div>

            {/* Labels (Multi-select) */}
            <div className="space-y-2">
              <label className="font-extrabold text-slate-600 uppercase flex items-center gap-1"><Tag className="w-3.5 h-3.5" /> Gắn nhãn công việc</label>
              <div className="flex flex-wrap gap-1.5">
                {LABELS.map(lbl => {
                  const isSelected = taskLabels.includes(lbl);
                  return (
                    <button
                      type="button"
                      key={lbl}
                      onClick={() => toggleFormLabel(lbl)}
                      className={cn(
                        "px-2.5 py-1 rounded text-[11px] font-bold transition-all border cursor-pointer",
                        isSelected 
                          ? "bg-slate-900 border-slate-900 text-white" 
                          : "bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {lbl}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-emerald-200"
            >
              <Send className="w-3.5 h-3.5" /> Phân phó và Đồng bộ dải việc
            </button>
          </div>
        </form>
      )}

      {/* Advanced Filter Panel */}
      <div className="bg-white rounded-lg border border-slate-300 p-5 shadow-sm space-y-4">
        
        {/* Search row */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
          
          <div className="relative flex-1">
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm việc bằng mã ID, tiêu đề, mô tả hoặc nhãn..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 border-b-2"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="flex gap-2 shrink-0">
            {/* Quick count badge */}
            <div className="px-3 py-2.5 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 flex items-center gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Kết quả: {filteredTasks.length} việc
            </div>
          </div>

        </div>

        {/* Dropdowns Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 pt-1 text-[11px] font-sans">
          
          {/* Filter Scope */}
          <div className="space-y-1">
            <span className="font-extrabold text-slate-500 uppercase tracking-wider">Cấp độ (Scope)</span>
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
            >
              <option value="all">Tất cả cấp độ</option>
              <option value="individual">Cá nhân</option>
              <option value="team">Đội nhóm</option>
              <option value="department">Phòng ban</option>
              <option value="company">Công ty</option>
            </select>
          </div>

          {/* Filter Department */}
          <div className="space-y-1">
            <span className="font-extrabold text-slate-500 uppercase tracking-wider">Bộ phận</span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="w-full bg-white border border-[#CBD5E1] rounded-lg p-2 font-bold text-[#1E293B]"
            >
              <option value="all">Tất cả phòng ban</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Filter Priority */}
          <div className="space-y-1">
            <span className="font-extrabold text-[#64748B] uppercase tracking-wider">Ưu tiên</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
            >
              <option value="all">Tất cả mức</option>
              <option value="low">Thấp</option>
              <option value="medium">Trung bình</option>
              <option value="high">Cao</option>
              <option value="urgent">Gấp</option>
            </select>
          </div>

          {/* Filter Status */}
          <div className="space-y-1">
            <span className="font-extrabold text-slate-500 uppercase tracking-wider">Trạng thái</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="todo">Cần làm</option>
              <option value="in_progress">Đang làm</option>
              <option value="testing">Kiểm thử</option>
              <option value="done">Hoàn thành</option>
            </select>
          </div>

        </div>

      </div>

      {/* Task List Table View */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden text-xs">
        {filteredTasks.length > 0 ? (
          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-left border-collapse whitespace-nowrap font-sans">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-extrabold text-slate-600 uppercase tracking-widest text-[9.5px]">
                  <th className="px-6 py-4">Mã việc</th>
                  <th className="px-6 py-4">Công việc chi tiết</th>
                  <th className="px-6 py-4">Cấp độ & Bộ phận</th>
                  <th className="px-6 py-4 text-center">Người phụ trách</th>
                  <th className="px-6 py-4 text-center">Nhãn (Tags)</th>
                  <th className="px-6 py-4 text-center">Hạn chót</th>
                  <th className="px-6 py-4 text-center">Biên tiến độ</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTasks.map(task => {
                  const today = new Date().toISOString().split('T')[0];
                  const isOverdue = task.status !== 'done' && task.date < today;
                  
                  return (
                    <tr key={task.id} className="hover:bg-slate-50/50 transition-colors">
                      {/* ID */}
                      <td className="px-6 py-4 font-mono font-bold text-slate-500">{task.id}</td>
                      
                      {/* Title & Priority Badge in Column */}
                      <td className="px-6 py-4 max-w-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border shrink-0",
                            task.priority === 'urgent' ? 'bg-red-50 text-red-600 border-red-200' :
                            task.priority === 'high' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                            task.priority === 'medium' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                            'bg-slate-100 text-slate-600 border-slate-200'
                          )}>
                            {task.priority === 'urgent' ? 'Nguy cấp' :
                             task.priority === 'high' ? 'Cao' :
                             task.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                          </span>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider border shrink-0",
                            task.status === 'done' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            task.status === 'testing' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                            task.status === 'in_progress' ? 'bg-indigo-50 text-indigo-100 border-indigo-200' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                          )}>
                            {task.status === 'done' ? 'Hoàn thành' :
                             task.status === 'testing' ? 'Kiểm thử' :
                             task.status === 'in_progress' ? 'Đang làm' : 'Cần làm'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer" onClick={() => onSelectTask(task)}>
                          {task.title}
                        </h4>
                        {task.desc && <p className="text-[10.5px] text-slate-500 truncate mt-0.5 leading-normal">{task.desc}</p>}
                      </td>

                      {/* Scope & Dept */}
                      <td className="px-6 py-4">
                        <span className="font-bold text-slate-800 font-sans block">{task.department}</span>
                        <span className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 block">
                          LEVEL: {task.scope}
                        </span>
                      </td>

                      {/* Assignee Avatar & Name */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1.5 text-left">
                          <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-[10px]">
                            {task.assignee.initials}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-800 text-xs block">{task.assignee.name}</span>
                            <span className="text-[9.5px] text-slate-400 font-semibold block leading-tight">{task.assignee.position}</span>
                          </div>
                        </div>
                      </td>

                      {/* Labels / Tags */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-wrap gap-1 justify-center max-w-xs">
                          {task.labels.map(lbl => (
                            <span key={lbl} className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9.5px] font-semibold">{lbl}</span>
                          ))}
                        </div>
                      </td>

                      {/* Deadline & Warning indicator */}
                      <td className="px-6 py-4 text-center">
                        <span className={cn(
                          "font-mono font-bold text-xs inline-flex items-center gap-1",
                          isOverdue ? "text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded" : "text-slate-600"
                        )}>
                          <Calendar className="w-3 h-3" />
                          {task.date}
                          {isOverdue && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />}
                        </span>
                      </td>

                      {/* Progress bar */}
                      <td className="px-6 py-4 text-center">
                        <div className="inline-block w-24">
                          <div className="flex justify-between text-[10px] pb-1">
                            <span className="font-bold text-indigo-500">{task.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all",
                                task.status === 'done' ? "bg-emerald-500" :
                                task.status === 'testing' ? "bg-amber-500" : "bg-indigo-500"
                              )}
                              style={{ width: `${task.progress}%` }} 
                            />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <button 
                            onClick={() => onSelectTask(task)} 
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-[#1E293B] rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Xác nhận hoàn thành công việc nhanh?')) {
                                onEditTask({
                                  ...task,
                                  status: 'done',
                                  progress: 100
                                });
                              }
                            }}
                            disabled={task.status === 'done'}
                            className={cn(
                              "p-1.5 rounded-lg transition-colors",
                              task.status === 'done' 
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                                : "bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                            )}
                            title="Đóng việc nhanh"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              if (confirm('Xác nhận xóa công việc này?')) {
                                onDeleteTask(task.id);
                              }
                            }}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors border border-rose-100 cursor-pointer"
                            title="Xóa công việc"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="font-bold text-sm text-slate-700">Không tìm thấy công việc phù hợp</h4>
            <p className="text-xs text-slate-400">Điều chỉnh phễu lọc hoặc nhấp 'Giao việc mới' để bổ sung tác vụ mới.</p>
          </div>
        )}
      </div>

    </div>
  );
}
