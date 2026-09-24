import React, { useState, useMemo } from 'react';
import { 
  Users, 
  FileText, 
  Search, 
  X, 
  UserCheck, 
  Building2, 
  Check, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  Filter,
  User,
  ArrowRight,
  Lock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  hrmEmployeeService, 
  HrmEmployee, 
  HrmPersonalRequest 
} from '../../services/hrmEmployeeService';

interface HrmStaffOrRequestPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmployee: (employee: HrmEmployee, source: 'cbnv' | 'current_user', originalRequest?: HrmPersonalRequest) => void;
  filterRequestCategory?: 'it_support' | 'signature' | 'all';
  title?: string;
  defaultTab?: 'cbnv' | 'hrm_request';
}

export const HrmStaffOrRequestPickerModal: React.FC<HrmStaffOrRequestPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectEmployee,
  filterRequestCategory = 'all',
  title = 'Chọn Cán Bộ Nhân Viên Hoặc Đơn Yêu Cầu Từ HRM',
  defaultTab = 'cbnv'
}) => {
  const [activeTab, setActiveTab] = useState<'cbnv' | 'hrm_request'>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  const employees = useMemo(() => hrmEmployeeService.getHrmEmployeeList(), []);
  const requests = useMemo(() => hrmEmployeeService.getHrmPersonalRequests(filterRequestCategory), [filterRequestCategory]);
  const currentStaff = useMemo(() => hrmEmployeeService.getCurrentLoggedInStaff(), []);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(e => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return employees.filter(emp => {
      const matchDept = selectedDept === 'ALL' || emp.department === selectedDept;
      const matchQuery = !q || 
        emp.name.toLowerCase().includes(q) ||
        emp.id.toLowerCase().includes(q) ||
        emp.email.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        emp.title.toLowerCase().includes(q);
      return matchDept && matchQuery;
    });
  }, [employees, searchQuery, selectedDept]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return requests.filter(req => {
      if (!q) return true;
      return (
        req.id.toLowerCase().includes(q) ||
        req.requesterName.toLowerCase().includes(q) ||
        req.title.toLowerCase().includes(q) ||
        req.department.toLowerCase().includes(q)
      );
    });
  }, [requests, searchQuery]);

  if (!isOpen) return null;

  const handleSelectRequest = (req: HrmPersonalRequest) => {
    // Find matched employee from CBNV, or create profile from request
    const matched = employees.find(e => e.id === req.requesterCode || e.email.toLowerCase() === req.requesterEmail.toLowerCase()) || {
      id: req.requesterCode,
      name: req.requesterName,
      department: req.department,
      position: 'Cán bộ đề xuất',
      title: 'Cán bộ đề xuất',
      email: req.requesterEmail,
      status: 'active' as const
    };
    onSelectEmployee(matched, 'cbnv', req);
    onClose();
  };

  const handleSelectCurrentStaff = () => {
    onSelectEmployee(currentStaff, 'current_user');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">{title}</h3>
              <p className="text-[11px] text-slate-400">Dữ liệu nguồn chính thức từ phân hệ Quản trị Nhân sự (HRM 360° & ESS)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Current User Banner & Mode Tabs */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3 shrink-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            {/* Mode Switch Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-200/80 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveTab('cbnv')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  activeTab === 'cbnv'
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Users className="w-4 h-4" />
                <span>Danh sách CBNV ({employees.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hrm_request')}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer",
                  activeTab === 'hrm_request'
                    ? "bg-white text-indigo-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                <FileText className="w-4 h-4" />
                <span>Đơn yêu cầu HRM ({requests.length})</span>
              </button>
            </div>

            {/* Quick 1-click select current logged in staff */}
            <button
              type="button"
              onClick={handleSelectCurrentStaff}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Dùng thông tin của tôi ({currentStaff.name})</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'cbnv'
                    ? "Tìm theo Họ tên, Mã nhân viên (EMP-...), Phòng ban, Email..."
                    : "Tìm theo Mã đơn (REQ-...), Tên người yêu cầu, Tiêu đề..."
                }
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {activeTab === 'cbnv' && (
              <div className="w-48 shrink-0">
                <select
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="ALL">Tất cả phòng ban</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Modal Body: List View */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
          {activeTab === 'cbnv' ? (
            filteredEmployees.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <Users className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Không tìm thấy cán bộ nhân viên phù hợp với từ khóa</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {filteredEmployees.map(emp => (
                  <div
                    key={emp.id}
                    onClick={() => {
                      onSelectEmployee(emp, 'cbnv');
                      onClose();
                    }}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all cursor-pointer flex items-center justify-between group shadow-2xs hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {emp.avatar ? (
                        <img
                          src={emp.avatar}
                          alt={emp.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
                          {emp.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {emp.id}
                          </span>
                          <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-700 truncate">
                            {emp.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 font-medium truncate mt-0.5">
                          {emp.title}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                          <span>{emp.department}</span>
                          <span>•</span>
                          <span className="truncate">{emp.email}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-600 text-slate-600 group-hover:text-white text-[10px] font-bold transition-all shrink-0 ml-2"
                    >
                      Chọn
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            filteredRequests.length === 0 ? (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Không có đơn yêu cầu nào phù hợp trong hệ thống HRM</p>
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                {filteredRequests.map(req => (
                  <div
                    key={req.id}
                    onClick={() => handleSelectRequest(req)}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all cursor-pointer flex items-center justify-between group shadow-2xs hover:shadow-sm"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
                          {req.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {req.categoryLabel}
                        </span>
                        <span className={cn(
                          "text-[10px] font-bold px-2 py-0.5 rounded-full",
                          req.status === 'approved' ? "bg-emerald-100 text-emerald-800" :
                          req.status === 'pending' ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        )}>
                          {req.status === 'approved' ? '✓ Đã phê duyệt' : req.status === 'pending' ? 'Chờ duyệt' : 'Đang xử lý'}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-700 leading-snug">
                        {req.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {req.description}
                      </p>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-1">
                        <span>Người yêu cầu: <strong className="text-slate-700">{req.requesterName} ({req.requesterCode})</strong></span>
                        <span>•</span>
                        <span>{req.department}</span>
                        <span>•</span>
                        <span>Ngày tạo: {req.date}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 group-hover:bg-indigo-600 text-indigo-700 group-hover:text-white text-xs font-bold transition-all shrink-0 ml-3 flex items-center gap-1"
                    >
                      <span>Trích xuất</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        {/* Modal Footer Note */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Quy chuẩn bảo mật: Mọi dữ liệu trích xuất từ HRM sẽ được gắn mã kiểm định và khóa chống sửa đổi tùy tiện.</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
