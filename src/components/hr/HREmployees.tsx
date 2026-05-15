import React, { useState, useEffect } from 'react';
import { orderBy } from 'firebase/firestore';
import {
  Search, PlusCircle, ArrowLeft, CheckCircle2, AlertCircle,
  ShieldCheck, MoreVertical, Smile, Clock, X, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { employeesRepo, type EmployeeInput } from '../../services/repositories';
import { cn } from '../../lib/utils';
import type { Employee } from '../../types/erp';
import { MOCK_EMPLOYEES } from './mockData';

/** Map EmployeeInput (Firestore) → Employee (UI legacy type) */
function adaptEmployee(e: EmployeeInput): Employee {
  const statusMap: Record<string, Employee['status']> = {
    active: 'active',
    probation: 'on_boarding',
    leave: 'on_leave',
    terminated: 'resigned',
    retired: 'resigned',
  };
  return {
    id: e.id,
    fullName: e.fullName,
    email: e.email ?? '',
    phone: e.phone ?? '',
    department: e.department ?? '',
    position: e.position ?? '',
    joinDate: e.startDate ?? '',
    employeeType: 'full_time',
    status: statusMap[e.employmentStatus] ?? 'active',
    contracts: [],
    skills: [],
    leaveBalance: { total: 12, used: 0, pending: 0 },
    recentSentiment: 'positive',
  };
}

interface Props {
  onBack: () => void;
}

export function HREmployees({ onBack }: Props) {
  const [dbEmployees, setDbEmployees] = useState<Employee[]>([]);
  const employees = dbEmployees.length > 0 ? dbEmployees : MOCK_EMPLOYEES;

  const [searchEmployee, setSearchEmployee] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState<Partial<EmployeeInput>>({
    employmentStatus: 'active',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = employeesRepo.subscribe(
      [orderBy('updatedAt', 'desc')],
      (items) => setDbEmployees(items.map(adaptEmployee)),
    );
    return () => unsub();
  }, []);

  const filteredEmployees = employees.filter(emp => {
    if (searchEmployee && !emp.fullName.toLowerCase().includes(searchEmployee.toLowerCase()) && !emp.id.toLowerCase().includes(searchEmployee.toLowerCase())) return false;
    if (filterDept !== 'all' && emp.department !== filterDept) return false;
    if (filterPosition !== 'all' && emp.position !== filterPosition) return false;
    if (filterStatus !== 'all' && emp.status !== filterStatus) return false;
    return true;
  });

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.fullName) return;
    setSaving(true);
    try {
      await employeesRepo.create(newEmployee as Omit<EmployeeInput, 'id'>);
      setShowAddForm(false);
      setNewEmployee({ employmentStatus: 'active' });
    } catch {
      // fallback: vẫn hiển thị mock
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xoá nhân viên này?')) return;
    try {
      await employeesRepo.remove(id);
    } catch {
      // ignore
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      {/* Header */}
      <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
        </button>
      </div>

      <div className="p-4 bg-white border-b border-[#F3F4F6] flex flex-col gap-4 px-6 relative z-30">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Tìm nhân viên, ID..."
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 w-64 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
              >
                <option value="all">Tất cả Phòng ban</option>
                <option value="Marketing">Marketing</option>
                <option value="Vận hành Sàn">Vận hành Sàn</option>
              </select>
              <select
                value={filterPosition}
                onChange={(e) => setFilterPosition(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
              >
                <option value="all">Tất cả Chức danh</option>
                <option value="Quản lý kho">Quản lý kho</option>
                <option value="KOL Specialist">KOL Specialist</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
              >
                <option value="all">Tất cả Trạng thái làm việc</option>
                <option value="active">Đang làm việc</option>
                <option value="inactive">Đã nghỉ việc</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-300">
              <span className="text-xs font-semibold text-slate-600 pl-2">Admin Mode</span>
              <button
                onClick={() => setIsAdmin(!isAdmin)}
                className={cn('w-10 h-5 rounded-full relative transition-colors shadow-inner', isAdmin ? 'bg-primary-600' : 'bg-slate-300')}
              >
                <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm', isAdmin ? 'translate-x-5' : 'translate-x-0')} />
              </button>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Thêm nhân viên
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden m-4">
        <div className="overflow-x-auto min-w-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-[#F3F4F6]">
                <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Họ tên & ID</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Phòng ban / Vị trí</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Loại hợp đồng</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Sentiment & Leave</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Ngày tham gia</th>
                <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái</th>
                {isAdmin && <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Hành động</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {filteredEmployees.map((emp) => (
                <tr key={emp.id} onClick={() => setSelectedEmployee(emp)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-[#111827] group-hover:text-orange-700 transition-colors">{emp.fullName}</p>
                    <p className="text-[10px] text-[#6B7280] font-mono font-bold uppercase tracking-tight opacity-50">{emp.id}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-bold text-[#111827] tracking-tight">{emp.department}</p>
                    <p className="text-[10px] text-[#6B7280] uppercase opacity-70 font-medium">{emp.position}</p>
                  </td>
                  <td className="px-6 py-5 font-mono">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-lg uppercase">
                      {emp.employeeType.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center gap-1.5 font-bold">
                        {emp.recentSentiment === 'positive' && <span className="text-emerald-500 flex items-center gap-1"><Smile className="w-3.5 h-3.5" /> Good</span>}
                        {emp.recentSentiment === 'neutral' && <span className="text-slate-600 flex items-center gap-1"><MoreVertical className="w-3.5 h-3.5" /> OK</span>}
                        {emp.recentSentiment === 'critical' && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> High Risk</span>}
                      </div>
                      {emp.leaveBalance && (
                        <p className="text-[10px] text-[#6B7280] mt-1">Leaves: <span className={cn('font-bold text-[#111827]', emp.leaveBalance.total - emp.leaveBalance.used <= 2 && 'text-red-600')}>{emp.leaveBalance.total - emp.leaveBalance.used} left</span></p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-xs text-[#4B5563] font-medium">{emp.joinDate}</td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center">
                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold shadow-sm inline-flex items-center gap-1.5 uppercase tracking-wide">
                        <CheckCircle2 className="w-3 h-3" /> Hoạt động
                      </span>
                    </div>
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDeleteEmployee(emp.id)}
                        className="text-red-400 hover:text-red-600 text-xs font-bold transition-colors"
                      >
                        Xoá
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-sm w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Thêm nhân viên mới</h3>
              <button onClick={() => setShowAddForm(false)} className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEmployee} className="p-6 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Họ tên *</label>
                <input
                  type="text"
                  required
                  value={newEmployee.fullName ?? ''}
                  onChange={(e) => setNewEmployee(p => ({ ...p, fullName: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Email</label>
                <input
                  type="email"
                  value={newEmployee.email ?? ''}
                  onChange={(e) => setNewEmployee(p => ({ ...p, email: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Điện thoại</label>
                <input
                  type="tel"
                  value={newEmployee.phone ?? ''}
                  onChange={(e) => setNewEmployee(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Phòng ban</label>
                <input
                  type="text"
                  value={newEmployee.department ?? ''}
                  onChange={(e) => setNewEmployee(p => ({ ...p, department: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Chức vụ</label>
                <input
                  type="text"
                  value={newEmployee.position ?? ''}
                  onChange={(e) => setNewEmployee(p => ({ ...p, position: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20"
                />
              </div>
              <div className="col-span-2 flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
                  Hủy
                </button>
                <button type="submit" disabled={saving} className="px-6 py-2.5 text-sm font-bold text-[#FAF9F5] bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-60 flex items-center gap-2">
                  {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Detail Panel */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedEmployee(null)}
              className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-sm z-50 border-l border-slate-300 flex flex-col overflow-y-auto"
            >
              <div className="p-8 border-b border-slate-200 flex justify-between items-start bg-white sticky top-0 z-10">
                <div className="flex gap-4 items-center">
                  <div className="w-16 h-16 bg-[#EAE7DF] text-orange-700 rounded-full flex items-center justify-center text-xl font-bold shadow-sm border border-orange-200">
                    {selectedEmployee.fullName.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-tight">{selectedEmployee.fullName}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-widest">{selectedEmployee.id}</span>
                      <span className="text-sm font-medium text-slate-600">{selectedEmployee.department}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedEmployee(null)} className="p-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-full transition-colors text-slate-600 shadow-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-8 space-y-8 flex-1">
                {isAdmin && (
                  <div className="space-y-4">
                    <h3 className="font-bold tracking-widest uppercase text-[11px] text-slate-500 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" /> Vai trò & Phân quyền
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-300">
                      <p className="text-sm font-bold text-slate-900 mb-1">Cấp quyền hệ thống</p>
                      <p className="text-xs text-slate-600">Vai trò: <span className="font-bold text-slate-900">{selectedEmployee.role ?? 'Nhân viên'}</span></p>
                    </div>
                  </div>
                )}
                <div className="space-y-4">
                  <h3 className="font-bold tracking-widest uppercase text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-500" /> Timeline Công tác
                  </h3>
                  <div className="pl-4 border-l-2 border-slate-200 space-y-4 ml-2">
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                      <p className="text-xs font-bold text-slate-900">Gia nhập công ty</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{selectedEmployee.joinDate}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 bg-white border border-primary-100/50 rounded-lg">
                  <h3 className="font-bold tracking-widest uppercase text-[10px] text-primary-500 flex items-center gap-1.5 mb-2">
                    <Sparkles className="w-3 h-3" /> AI Sentiment Insight
                  </h3>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {selectedEmployee.recentSentiment === 'critical' ? 'Nhân viên có biểu hiện quá tải công việc. Đề xuất: 1-on-1 trong tuần này.' : 'Trạng thái tích cực, phù hợp tham gia dự án chiến lược Q3.'}
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
