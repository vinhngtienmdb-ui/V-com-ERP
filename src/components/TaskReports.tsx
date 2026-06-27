import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { 
  BarChart2, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Award,
  Filter
} from 'lucide-react';
import { Task, Member, MOCK_MEMBERS, DEPARTMENTS } from '../types/task';
import { cn } from '../lib/utils';

interface TaskReportsProps {
  tasks: Task[];
}

export function TaskReports({ tasks }: TaskReportsProps) {
  const [filterScope, setFilterScope] = useState<string>('all');
  const [filterDept, setFilterDept] = useState<string>('all');

  // Filtered tasks for stats
  const filteredTasks = tasks.filter(t => {
    const matchScope = filterScope === 'all' || t.scope === filterScope;
    const matchDept = filterDept === 'all' || t.department === filterDept;
    return matchScope && matchDept;
  });

  // Calculate Basic Metrics
  const totalCount = filteredTasks.length;
  const doneCount = filteredTasks.filter(t => t.status === 'done').length;
  const progressCount = filteredTasks.filter(t => t.status === 'in_progress').length;
  const testingCount = filteredTasks.filter(t => t.status === 'testing').length;
  const todoCount = filteredTasks.filter(t => t.status === 'todo').length;

  const completionRate = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  // Check Overdue Tasks (deadline < today AND status !== done)
  const todayStr = new Date().toISOString().split('T')[0];
  const overdueCount = filteredTasks.filter(t => t.status !== 'done' && t.date < todayStr).length;

  // Average progress
  const totalProgress = filteredTasks.reduce((sum, t) => sum + t.progress, 0);
  const avgProgress = totalCount > 0 ? Math.round(totalProgress / totalCount) : 0;

  // Chart Data 1: Task Status Distribution
  const statusData = [
    { name: 'Cần làm', value: todoCount, color: '#94A3B8' },
    { name: 'Đang làm', value: progressCount, color: '#3B82F6' },
    { name: 'Kiểm thử', value: testingCount, color: '#F59E0B' },
    { name: 'Đã xong', value: doneCount, color: '#10B981' }
  ];

  // Chart Data 2: Tasks by Department
  const deptData = DEPARTMENTS.map(dept => {
    const deptAll = tasks.filter(t => t.department === dept);
    const completed = deptAll.filter(t => t.status === 'done').length;
    const active = deptAll.filter(t => t.status !== 'done').length;
    return {
      department: dept,
      'Hoàn thành': completed,
      'Chưa xong': active,
      'Tổng số': deptAll.length
    };
  });

  // Chart Data 3: Performance Trend (by Scope)
  const scopeData = [
    { name: 'Cá nhân', 'Đã xong': tasks.filter(t => t.scope === 'individual' && t.status === 'done').length, 'Chưa xong': tasks.filter(t => t.scope === 'individual' && t.status !== 'done').length },
    { name: 'Đội nhóm', 'Đã xong': tasks.filter(t => t.scope === 'team' && t.status === 'done').length, 'Chưa xong': tasks.filter(t => t.scope === 'team' && t.status !== 'done').length },
    { name: 'Phòng ban', 'Đã xong': tasks.filter(t => t.scope === 'department' && t.status === 'done').length, 'Chưa xong': tasks.filter(t => t.scope === 'department' && t.status !== 'done').length },
    { name: 'Công ty', 'Đã xong': tasks.filter(t => t.scope === 'company' && t.status === 'done').length, 'Chưa xong': tasks.filter(t => t.scope === 'company' && t.status !== 'done').length },
  ];

  // Chart Data 4: Tasks by Priority
  const priorityData = [
    { name: 'Thấp', count: filteredTasks.filter(t => t.priority === 'low').length, color: '#64748B' },
    { name: 'Trung bình', count: filteredTasks.filter(t => t.priority === 'medium').length, color: '#F59E0B' },
    { name: 'Cao', count: filteredTasks.filter(t => t.priority === 'high').length, color: '#EF4444' },
    { name: 'Gấp', count: filteredTasks.filter(t => t.priority === 'urgent').length, color: '#B91C1C' }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-300 p-4 shadow-sm flex flex-wrap gap-4 items-center justify-between text-xs">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-1.5 font-bold">
            <Filter className="w-4 h-4 text-slate-400" />
            Lọc báo cáo:
          </div>
          
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Cấp độ (Phạm vi):</span>
            <select
              value={filterScope}
              onChange={(e) => setFilterScope(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
            >
              <option value="all">Tất cả</option>
              <option value="individual">Cá nhân</option>
              <option value="team">Đội nhóm</option>
              <option value="department">Phòng ban</option>
              <option value="company">Toàn công ty</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600">Bộ phận:</span>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
            >
              <option value="all">Tất cả Phòng ban</option>
              {DEPARTMENTS.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg flex items-center gap-1">
          <Award className="w-3.5 h-3.5" /> Báo cáo SLA chuẩn thời gian thực
        </div>
      </div>

      {/* Basic Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
        
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng số công việc</p>
            <p className="text-3xl font-black text-slate-900">{totalCount}</p>
            <p className="text-[10.5px] text-slate-500 font-medium font-sans">Đang theo sát vận hành</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tỷ lệ hoàn thành</p>
            <p className="text-3xl font-black text-emerald-600">{completionRate}%</p>
            <p className="text-[10.5px] text-emerald-500 font-medium">Đồ thị tiến trình tổng quan</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tiến độ trung bình</p>
            <p className="text-3xl font-black text-indigo-600">{avgProgress}%</p>
            <p className="text-[10.5px] text-indigo-500 font-medium">Độ hoàn thiện trung bình</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <TrendingUp className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Công việc quá hạn</p>
            <p className={cn("text-3xl font-black", overdueCount > 0 ? "text-rose-600 animate-pulse" : "text-slate-900")}>
              {overdueCount}
            </p>
            <p className="text-[10.5px] text-slate-500 font-medium">Cần đôn đốc kiểm điểm</p>
          </div>
          <div className={cn("p-3 rounded-lg", overdueCount > 0 ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-slate-600")}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Tasks by Department */}
        <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Tiến độ công việc theo Phòng Ban</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">So sánh số lượng đã hoàn tất và việc đang giải quyết tại các bộ phận.</p>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="department" stroke="#64748B" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Hoàn thành" fill="#10B981" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="Chưa xong" fill="#3B82F6" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Task Status Ratio */}
        <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Phân bố Trạng thái Công việc</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Cơ cấu trạng thái giúp phân tích điểm nghẽn của quy trình sản xuất.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
            
            {/* Visual Pie Chart */}
            <div className="h-48 w-full sm:col-span-2 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} công việc`, 'Số lượng']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Custom Legend Custom layout */}
            <div className="space-y-2 text-xs font-sans font-bold text-slate-700">
              {statusData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1">
                    <div className="text-slate-500 text-[10px] font-bold uppercase">{item.name}</div>
                    <div className="text-slate-900 text-xs font-black">
                      {item.value} việc ({totalCount > 0 ? Math.round((item.value / totalCount) * 100) : 0}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* Row 3: Scope Trend & Priority Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tasks by Scope (Company Wide) Bar Chart */}
        <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm space-y-4 lg:col-span-2">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Số lượng Công việc theo dải Cấp độ (Scope)</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Khối lượng việc phân chia theo Cá nhân, Nhóm, Phòng ban và Công ty.</p>
          </div>
          <div className="h-48 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scopeData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" stroke="#64748B" tickLine={false} axisLine={false} />
                <YAxis stroke="#64748B" tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                <Legend iconType="circle" />
                <Bar dataKey="Đã xong" fill="#10B981" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Chưa xong" fill="#FDA4AF" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority Stats List View */}
        <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Mức độ ưu tiên</h4>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Sự phân tách mức khẩn cấp tại phễu lọc hiện tại.</p>
          </div>
          <div className="space-y-3 pt-2">
            {priorityData.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <span className="font-mono font-black text-slate-900">{item.count} việc</span>
                </div>
                {/* Custom bar indicator */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all" 
                    style={{ 
                      backgroundColor: item.color, 
                      width: `${totalCount > 0 ? (item.count / totalCount) * 100 : 0}%` 
                    }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
