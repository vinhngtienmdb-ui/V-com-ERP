import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Briefcase, User, Wallet, Calendar, Plus, Trash2, 
  CheckCircle2, HardHat, FileText, Gift, HelpCircle, 
  MapPin, Clock, Search, Laptop, Users, ShieldAlert,
  ChevronRight, Award, History, FileSignature, AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Employee } from '../types/erp';

interface EmployeeDetailModalProps {
  show: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (updatedData: any) => void;
}

// 12 precise tabs representing a highly professional HR Information module
type ActiveTabType = 
  | 'job'          // Thông tin làm việc
  | 'cv'           // Sơ yếu lý lịch
  | 'salaries'     // Quá trình lương
  | 'family'       // Thông tin gia đình
  | 'docs'         // Túi hồ sơ
  | 'assets'       // Quản lý trang thiết bị
  | 'experience'   // Quá trình làm việc
  | 'rewards'      // Khen thưởng, kỷ luật
  | 'bio'          // Lịch sử bản thân
  | 'logs'         // Lịch sử yêu cầu chỉnh sửa
  | 'insurance'    // Trạng thái tham gia BHXH
  | 'others';      // Thông tin khác

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({
  show,
  employee,
  onClose,
  onSave
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('job');
  const [formState, setFormState] = useState<any>({});
  
  // Tab title mappings
  const tabLabels: { key: ActiveTabType; label: string }[] = [
    { key: 'job', label: 'Thông tin làm việc' },
    { key: 'cv', label: 'Sơ yếu lý lịch' },
    { key: 'salaries', label: 'Quá trình lương' },
    { key: 'family', label: 'Thông tin gia đình' },
    { key: 'docs', label: 'Túi hồ sơ' },
    { key: 'assets', label: 'Quản lý trang thiết bị' },
    { key: 'experience', label: 'Quá trình làm việc' },
    { key: 'rewards', label: 'Khen thưởng, kỷ luật' },
    { key: 'bio', label: 'Lịch sử bản thân' },
    { key: 'logs', label: 'Lịch sử yêu cầu chỉnh sửa' },
    { key: 'insurance', label: 'Trạng thái tham gia BHXH' },
    { key: 'others', label: 'Thông tin khác' }
  ];

  // Populate formState when employee changes
  useEffect(() => {
    if (show) {
      if (employee) {
        setFormState({
          ...employee,
          faceVerified: employee.faceVerified ?? false,
          unitCode: employee.unitCode ?? 'TAM938A',
          department: employee.department ?? 'Ban giám đốc',
          workEmail: employee.workEmail ?? employee.email ?? '',
          timeAttendanceCode: employee.timeAttendanceCode ?? 'CC-' + employee.id,
          workplace: employee.workplace ?? 'Lầu 34, Toà nhà Bitexco Financial Tower, số 2 Hải Triều, Phường Bến Nghé, Quận 1, TPHCM',
          salaryHistory: employee.salaryHistory ?? [
            { id: 'S1', decisionNo: 'QS-015/VCOMM-2025', signDate: '15/12/2025', effectiveDate: '01/01/2026', baseSalary: 18500000, coef: 1.2, allowance: 1500000, status: 'approved', approvedBy: 'CEO Lê Hoàng Minh' }
          ],
          familyMembers: employee.familyMembers ?? [
            { id: 'F1', name: 'Nguyễn Trần Thảo Nguyên', relationship: 'Vợ', dob: '15/05/1997', job: 'Nhân viên Ngân hàng', phone: '0981122334', isDependent: true }
          ],
          documents: employee.documents ?? [
            { id: 'D1', type: 'CCCD Mặt trước', status: 'submitted', url: '#', updatedAt: '01/01/2026' },
            { id: 'D2', type: 'CCCD Mặt sau', status: 'submitted', url: '#', updatedAt: '01/01/2026' },
            { id: 'D3', type: 'Bằng tốt nghiệp Đại học/Chứng chỉ', status: 'submitted', url: '#', updatedAt: '02/01/2026' },
            { id: 'D4', type: 'Giấy khám sức khỏe (6 tháng gần nhất)', status: 'pending', url: '', updatedAt: '' }
          ],
          equipmentList: employee.equipmentList ?? [
            { id: 'E1', name: 'MacBook Pro 14" M3', code: 'LAP-M3-016', assignDate: '16/05/2025', status: 'active', value: 39900000 }
          ],
          workHistory: employee.workHistory ?? [
            { id: 'W1', company: 'Shopee Việt Nam', position: 'SEO Specialist', fromDate: '01/2023', toDate: '04/2025', reason: 'Thay đổi định hướng phát triển' }
          ],
          rewardsHistory: employee.rewardsHistory ?? [
            { id: 'R1', decisionNo: 'KT-045/VCOMM', type: 'reward', title: 'Thưởng nóng 2 triệu VNĐ', reason: 'Đạt thành tích xuất sắc trong chiến dịch truyền thông Q4', date: '15/01/2026' }
          ],
          personalHistory: employee.personalHistory ?? [
            { id: 'P1', period: '2015 - 2019', description: 'Học tập tại trường Đại học Ngoại Thương TPHCM chuyên ngành Kinh tế Ngoại thương.' },
            { id: 'P2', period: '2019 - 2022', description: 'Làm việc chuyên môn Marketing tại Công ty Cổ phần VNP Group.' }
          ],
          editRequests: employee.editRequests ?? [
            { id: 'L1', timestamp: '02/06/2026 09:30', author: 'vinh.ngtienmdb@gmail.com', action: 'Cập nhật số điện thoại cá nhân và nơi ở tạm trú hiện nay thành công.' }
          ],
          insuranceHistory: employee.insuranceHistory ?? [
            { id: 'I1', month: '05/2026', unit: 'TAM938A', checked: true, code: 'BH-0116123456', amount: 3500000 }
          ]
        });
      } else {
        // Initial defaults for a new employee
        setFormState({
          id: 'LKS' + Math.floor(100 + Math.random() * 900),
          fullName: '',
          faceVerified: false,
          status: 'active',
          unitCode: 'TAM938A',
          department: 'Ban giám đốc',
          position: 'Nhân viên mẫu',
          joinDate: new Date().toISOString().split('T')[0],
          employeeType: 'full_time',
          role: 'Nhân viên',
          email: '',
          phone: '',
          salaryHistory: [],
          familyMembers: [],
          documents: [
            { id: 'D1', type: 'CCCD Mặt trước', status: 'pending', url: '', updatedAt: '' },
            { id: 'D2', type: 'CCCD Mặt sau', status: 'pending', url: '', updatedAt: '' },
            { id: 'D3', type: 'Bằng tốt nghiệp Đại học/Chứng chỉ', status: 'pending', url: '', updatedAt: '' },
            { id: 'D4', type: 'Giấy khám sức khỏe (6 tháng gần nhất)', status: 'pending', url: '', updatedAt: '' }
          ],
          equipmentList: [],
          workHistory: [],
          rewardsHistory: [],
          personalHistory: [],
          editRequests: [{ id: 'L1', timestamp: new Date().toLocaleString(), author: 'System', action: 'Khởi tạo hồ sơ nháp' }],
          insuranceHistory: []
        });
      }
      setActiveTab('job');
    }
  }, [show, employee]);

  if (!show) return null;

  // Handle saving the full state back to parents
  const handleSaveClick = () => {
    if (!formState.fullName || formState.fullName.trim() === '') {
      alert('Họ tên nhân viên không được để trống!');
      return;
    }
    onSave(formState);
  };

  // Generic updater for deep nested list entries
  const updateNestedList = (key: string, updatedList: any[]) => {
    setFormState((prev: any) => ({ ...prev, [key]: updatedList }));
  };

  return (
    <div className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 text-left font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-[#FAF9F5] rounded-lg w-full max-w-7xl h-[95vh] flex flex-col border border-zinc-300 shadow-2xl overflow-hidden text-slate-900"
      >
        {/* TOP BAR: HEADER PANEL */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
            <div>
              <h2 className="text-lg font-black tracking-wider text-slate-800 uppercase font-sans">
                THÔNG TIN NHÂN VIÊN
              </h2>
              <p className="text-xs text-slate-500 font-sans font-medium">
                Mã số hồ sơ quản lý trực tuyến: <span className="font-bold text-slate-700">{formState.id || 'Khởi tạo'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save Button (Green) */}
            <button
              type="button"
              onClick={handleSaveClick}
              className="px-5 py-2 bg-emerald-600 font-bold text-white text-xs uppercase tracking-widest rounded-lg hover:bg-emerald-500 transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
            >
              Lưu
            </button>
            {/* Cancel Button (Red) */}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-rose-600 font-bold text-white text-xs uppercase tracking-widest rounded-lg hover:bg-rose-500 transition-all flex items-center gap-1.5 shadow-sm active:scale-[0.98]"
            >
              Hủy
            </button>
            {/* Close X symbol */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 ml-1 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-600 transition-colors border border-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* TABS SELECTOR PANEL */}
        <div className="px-6 bg-[#FAF9F5] border-b border-slate-200 h-11 flex items-center shrink-0">
          <div className="flex gap-2 overflow-x-auto overflow-y-hidden max-w-full h-full scrollbar-none items-end whitespace-nowrap">
            {tabLabels.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={cn(
                  "px-3.5 pb-2 text-xs font-black tracking-tight border-b-2 transition-all font-sans select-none whitespace-nowrap",
                  activeTab === t.key
                    ? "border-orange-600 text-orange-700"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* PERSISTENT GENERAL EMPLOYEE HEADER BLOCK */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Avatar frame */}
          <div className="lg:col-span-3 flex items-center gap-4 border-r border-slate-200/80 pr-4">
            <div className="w-16 h-16 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 shrink-0 shadow-inner relative overflow-hidden group">
              <User className="w-8 h-8" />
              <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-[10px] text-white font-bold cursor-pointer">
                Đổi ảnh
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Xác thực danh tính
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFormState((prev: any) => ({ ...prev, faceVerified: !prev.faceVerified }))}
                  className={cn(
                    "w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none flex items-center",
                    formState.faceVerified ? "bg-emerald-600 justify-end" : "bg-slate-300 justify-start"
                  )}
                >
                  <span className="w-4 h-4 rounded-full bg-white shadow-md block" />
                </button>
                <span className="text-xs font-bold text-slate-700 font-sans">
                  {formState.faceVerified ? 'Xác thực khuôn mặt' : 'Chờ bật xác thực'}
                </span>
              </div>
            </div>
          </div>

          {/* Core inputs line */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-4 gap-4">
            {/* Mã nhân viên */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-slate-500 flex items-center gap-1 font-sans">
                Mã nhân viên <span className="text-rose-500 font-black">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formState.id || ''}
                  onChange={(e) => setFormState((prev: any) => ({ ...prev, id: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-1.5 text-sm bg-slate-50 font-mono font-bold focus:ring-2 focus:ring-primary-500/10 focus:border-slate-800 outline-none text-slate-700"
                  placeholder="VD: LKS016"
                />
                <button 
                  type="button" 
                  onClick={() => setFormState((prev: any) => ({ ...prev, id: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tên nhân viên */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-slate-500 flex items-center gap-1 font-sans">
                Tên nhân viên <span className="text-rose-500 font-black">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formState.fullName || ''}
                  onChange={(e) => setFormState((prev: any) => ({ ...prev, fullName: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3.5 py-1.5 text-sm font-sans font-bold focus:ring-2 focus:ring-primary-500/10 focus:border-slate-800 outline-none text-slate-850"
                  placeholder="VD: Mai Trần Đình Thi"
                />
                <button 
                  type="button" 
                  onClick={() => setFormState((prev: any) => ({ ...prev, fullName: '' }))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tình trạng công tác */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-slate-500 font-sans">
                Tình trạng công tác
              </label>
              <select
                value={formState.status || 'active'}
                onChange={(e) => setFormState((prev: any) => ({ ...prev, status: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-primary-500/10 focus:border-slate-800 outline-none text-slate-800 font-bold"
              >
                <option value="active">Đang làm việc</option>
                <option value="on_boarding">Thử việc (Trial)</option>
                <option value="on_leave">Nghỉ phép dài hạn</option>
                <option value="resigned">Đã chấm dứt hợp đồng</option>
              </select>
            </div>

            {/* Mã đơn vị */}
            <div className="space-y-1">
              <label className="text-[10px] sm:text-xs font-bold text-slate-500 font-sans">
                Mã đơn vị
              </label>
              <select
                value={formState.unitCode || 'TAM938A'}
                onChange={(e) => setFormState((prev: any) => ({ ...prev, unitCode: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:ring-2 focus:ring-primary-500/10 focus:border-slate-800 outline-none text-slate-800 font-bold"
              >
                <option value="TAM938A">TAM938A - Trụ sở HN</option>
                <option value="VCOMM-SGN">VCOMM-SGN - Chi nhánh HCM</option>
                <option value="LOGS-LONG-BIEN">LOGS-LBN - Vận hành kho</option>
                <option value="CORP-CENTRAL">CORP-OFFICE - Văn phòng tổng</option>
              </select>
            </div>
          </div>
        </div>

        {/* SCROLLABLE INNER WORKSPACE SECTION */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50">
          {/* TAB BORDER CONTAINER BOX (Light blue border like theme in screenshot) */}
          <div className="border-2 border-primary-100 bg-white rounded-lg shadow-sm p-4 sm:p-6 min-h-[450px]">
            {/* Active Tab subtitle */}
            <div className="text-xs uppercase font-black text-blue-800 tracking-wider mb-5 flex items-center gap-2 border-b border-blue-50 pb-2">
              <span className="w-1.5 h-3.5 bg-primary-600 rounded" />
              {tabLabels.find((t) => t.key === activeTab)?.label}
            </div>

            {/* Render conditional forms */}
            {activeTab === 'job' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {/* Phòng ban */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Phòng ban <span className="text-red-500">*</span></span>
                  <div className="flex gap-1.5">
                    <select
                      value={formState.department || 'Ban giám đốc'}
                      onChange={(e) => setFormState((prev: any) => ({ ...prev, department: e.target.value }))}
                      className="flex-1 border border-zinc-350 bg-white rounded px-2.5 py-1.5 font-bold text-slate-800"
                    >
                      <option value="Ban giám đốc">Ban giám đốc</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Vận hành Sàn">Vận hành Sàn</option>
                      <option value="Hành chính">Hành chính</option>
                      <option value="Kinh doanh">Kinh doanh</option>
                      <option value="CSKH">CSKH</option>
                    </select>
                    <button type="button" className="p-1 px-2 border bg-slate-50 rounded border-slate-350 text-slate-700 hover:bg-slate-100" title="Tìm nhanh">
                      <Search className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Chức danh nghề nghiệp */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Chức danh nghề nghiệp <span className="text-red-500">*</span></span>
                  <input
                    type="text"
                    value={formState.position || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, position: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5 font-bold text-slate-800"
                    placeholder="VD: Trưởng phòng Quản lý đối tác"
                  />
                </div>

                {/* Chức vụ */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Chức vụ</span>
                  <select
                    value={formState.role || 'Nhân viên'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, role: e.target.value }))}
                    className="w-full border border-zinc-350 bg-white rounded px-2.5 py-1.5 font-sans"
                  >
                    <option value="Nhân viên">Nhân viên thông thường</option>
                    <option value="Quản lý">Quản lý chuyên môn</option>
                    <option value="Admin">Hành chính Tổng quản</option>
                  </select>
                </div>

                {/* Nhóm vị trí làm việc */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Nhóm vị trí làm việc</span>
                  <select
                    value={formState.jobGroup || 'Nhóm văn phòng'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, jobGroup: e.target.value }))}
                    className="w-full border border-zinc-350 bg-white rounded px-2.5 py-1.5 font-sans"
                  >
                    <option value="Nhóm ban điều hành">Nhóm ban điều hành (EXEC)</option>
                    <option value="Nhóm văn phòng">Nhóm văn phòng & Chiến lược</option>
                    <option value="Nhóm Sale">Nhóm Sale & Thị trường</option>
                    <option value="Nhóm kho bãi">Nhóm kho bãi & Hậu cần</option>
                  </select>
                </div>

                {/* Cấp bậc chuyên môn */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Cấp bậc chuyên môn</span>
                  <select
                    value={formState.expertLevel || 'Level 2'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, expertLevel: e.target.value }))}
                    className="w-full border border-zinc-350 bg-white rounded px-2.5 py-1.5 font-sans"
                  >
                    <option value="Level 1">Nhân sự thử việc (L1)</option>
                    <option value="Level 2">Chuyên viên độc lập (L2)</option>
                    <option value="Level 3">Chuyên gia cốt cán (L3)</option>
                    <option value="Level 4">Lãnh đạo đơn vị (L4)</option>
                  </select>
                </div>

                {/* Ngày bổ nhiệm */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Ngày bổ nhiệm</span>
                  <input
                    type="date"
                    value={formState.appointmentDate || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, appointmentDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1 font-mono text-slate-800"
                  />
                </div>

                {/* Ngày bổ nhiệm lại */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Ngày bổ nhiệm lại</span>
                  <input
                    type="date"
                    value={formState.reappointmentDate || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, reappointmentDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1 font-mono text-slate-800"
                  />
                </div>

                {/* Phân loại nhân viên */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Phân loại nhân viên</span>
                  <select
                    value={formState.employeeType || 'full_time'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, employeeType: e.target.value }))}
                    className="w-full border border-zinc-350 bg-white rounded px-2.5 py-1.5"
                  >
                    <option value="full_time">Chính thức (Full-time)</option>
                    <option value="part_time">Bán thời gian (Part-time)</option>
                    <option value="contract">Cộng tác viên (Contractor)</option>
                  </select>
                </div>

                {/* Thâm niên */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Thâm niên</span>
                  <input
                    type="text"
                    value={formState.seniority || '1 năm 6 tháng'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, seniority: e.target.value }))}
                    className="w-full border border-zinc-350 bg-slate-50 rounded px-2.5 py-1.5 font-bold"
                  />
                </div>

                {/* Email làm việc */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Email làm việc</span>
                  <input
                    type="email"
                    value={formState.workEmail || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, workEmail: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5"
                    placeholder="VD: thi.mtd@luckyapp.vn"
                  />
                </div>

                {/* Mã chấm công */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Mã chấm công</span>
                  <input
                    type="text"
                    value={formState.timeAttendanceCode || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, timeAttendanceCode: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5 font-mono"
                    placeholder="CC-016"
                  />
                </div>

                {/* Nơi làm việc */}
                <div className="col-span-2 space-y-1">
                  <span className="font-bold text-slate-600">Nơi làm việc</span>
                  <input
                    type="text"
                    value={formState.workplace || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, workplace: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5"
                    placeholder="Địa chỉ bàn giao nhiệm vụ cụ thể"
                  />
                </div>

                {/* Ngày vào đơn vị */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Ngày vào đơn vị</span>
                  <input
                    type="text"
                    value={formState.joinDate || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, joinDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5 font-mono text-slate-800"
                    placeholder="16/05/2025"
                  />
                </div>

                {/* Ngày học việc */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Ngày học việc</span>
                  <input
                    type="date"
                    value={formState.apprenticeshipDate || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, apprenticeshipDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1 font-mono text-slate-800"
                  />
                </div>

                {/* Ngày vào thực tập */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Ngày vào thực tập</span>
                  <input
                    type="date"
                    value={formState.internshipStartDate || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, internshipStartDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1 font-mono text-slate-800"
                  />
                </div>

                {/* Ngày kết thúc thực tập */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Ngày kết thúc thực tập</span>
                  <input
                    type="date"
                    value={formState.internshipEndDate || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, internshipEndDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1 font-mono text-slate-800"
                  />
                </div>

                {/* Ngày thử việc */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Ngày thử việc</span>
                  <input
                    type="date"
                    value={formState.probationStartDate || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, probationStartDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1 font-mono text-slate-800"
                  />
                </div>

                {/* Ngày kết thúc thử việc */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Ngày kết thúc thử việc</span>
                  <input
                    type="date"
                    value={formState.probationEndDate || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, probationEndDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1 font-mono text-slate-800"
                  />
                </div>

                {/* Ngày chính thức */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Ngày chính thức</span>
                  <input
                    type="date"
                    value={formState.officialStartDate || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, officialStartDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1 font-mono text-slate-800"
                  />
                </div>

                {/* Ngày xét duyệt phép */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Ngày xét duyệt phép</span>
                  <input
                    type="date"
                    value={formState.leaveReviewDate || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, leaveReviewDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1 font-mono text-slate-800"
                  />
                </div>

                {/* Loại hợp đồng */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Loại hợp đồng</span>
                  <select
                    value={formState.contractType || 'Lao động 1 năm'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, contractType: e.target.value }))}
                    className="w-full border border-zinc-350 bg-white rounded px-2.5 py-1.5"
                  >
                    <option value="Lao động 1 năm">Xác định thời hạn (1 năm)</option>
                    <option value="Lao động không thời hạn">Vô thời hạn (Thân cận)</option>
                    <option value="Hợp đồng bảo mật">Thử việc/Dịch vụ vụ việc</option>
                  </select>
                </div>

                {/* Số hợp đồng */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Số hợp đồng</span>
                  <input
                    type="text"
                    value={formState.contractCode || 'LKS015/HĐLĐ-PLHĐ1/2026'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, contractCode: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                {/* Ngày ký HĐLĐ */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Ngày ký HĐLĐ</span>
                  <input
                    type="text"
                    value={formState.contractSignDate || '01/01/2026'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, contractSignDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                {/* Quản lý trực tiếp */}
                <div className="col-span-2 space-y-1">
                  <span className="font-bold text-slate-600">Quản lý trực tiếp</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      className="flex-1 border border-zinc-350 rounded px-2.5 py-1.5 font-sans bg-slate-50 italic"
                      placeholder="Nhấn F2 hoặc Click để tra cứu người phê duyệt..."
                      value={formState.managerName || 'Lê Hoàng Minh (CEO) - CEO-001'}
                      onChange={(e) => setFormState((prev: any) => ({ ...prev, managerName: e.target.value }))}
                    />
                    <button type="button" className="p-1 px-3 border bg-slate-100/80 hover:bg-slate-200 rounded text-xs select-none font-bold" onClick={() => alert('Đã mở phân hệ chọn Quản lý từ cây nhân sự!')}>
                      Chọn
                    </button>
                  </div>
                </div>

                {/* Hình thức làm việc */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Hình thức làm việc</span>
                  <select
                    value={formState.workMode || 'Văn phòng'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, workMode: e.target.value }))}
                    className="w-full border border-zinc-350 bg-white rounded px-2.5 py-1.5"
                  >
                    <option value="Văn phòng">Tại văn phòng (Onsite)</option>
                    <option value="Online">Văn phòng ảo (Remote x100%)</option>
                    <option value="Hybrid">Tự quản / Kết hợp (Hybrid)</option>
                  </select>
                </div>

                {/* Thứ tự hiển thị */}
                <div className="space-y-1">
                  <span className="font-bold text-slate-600">Thứ tự hiển thị sơ đồ</span>
                  <input
                    type="number"
                    value={formState.displayOrder || 1}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, displayOrder: parseInt(e.target.value) }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1 font-mono text-center"
                  />
                </div>
              </div>
            )}

            {activeTab === 'cv' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs text-slate-800">
                <div className="space-y-1">
                  <span className="font-bold text-slate-650">Giới tính</span>
                  <select
                    value={formState.gender || 'Nam'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, gender: e.target.value }))}
                    className="w-full border border-zinc-350 bg-white rounded px-2.5 py-1.5"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-650">Ngày sinh</span>
                  <input
                    type="text"
                    value={formState.dateOfBirth || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5 font-mono"
                    placeholder="VD: 1995-08-12"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-650">Số CCCD / CMND</span>
                  <input
                    type="text"
                    value={formState.identityCard || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, identityCard: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5 font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-650">Ngày cấp CCCD</span>
                  <input
                    type="text"
                    value={formState.identityCardDate || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, identityCardDate: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <span className="font-bold text-slate-650">Nơi cấp CCCD</span>
                  <input
                    type="text"
                    value={formState.identityCardPlace || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, identityCardPlace: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-650">SĐT Cá nhân</span>
                  <input
                    type="text"
                    value={formState.personalPhone || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, personalPhone: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-650">Email Cá nhân</span>
                  <input
                    type="email"
                    value={formState.personalEmail || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, personalEmail: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5"
                  />
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-650">Dân tộc / Tôn giáo</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Dân tộc"
                      value={formState.ethnicity || 'Kinh'}
                      onChange={(e) => setFormState((prev: any) => ({ ...prev, ethnicity: e.target.value }))}
                      className="border border-zinc-350 rounded px-2 py-1.5"
                    />
                    <input
                      type="text"
                      placeholder="Tôn giáo"
                      value={formState.religion || 'Không'}
                      onChange={(e) => setFormState((prev: any) => ({ ...prev, religion: e.target.value }))}
                      className="border border-zinc-350 rounded px-2 py-1.5"
                    />
                  </div>
                </div>

                <div className="col-span-3 space-y-1">
                  <span className="font-bold text-slate-650">Hộ khẩu thường trú</span>
                  <input
                    type="text"
                    value={formState.permanentAddress || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, permanentAddress: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5"
                  />
                </div>

                <div className="col-span-3 space-y-1">
                  <span className="font-bold text-slate-650">Nơi ở hiện nay</span>
                  <input
                    type="text"
                    value={formState.currentAddress || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, currentAddress: e.target.value }))}
                    className="w-full border border-zinc-350 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>
            )}

            {activeTab === 'salaries' && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Danh sách quá trình nâng bậc, hệ số và thay đổi thu nhập</span>
                  <button 
                    type="button"
                    onClick={() => {
                      const updated = [...(formState.salaryHistory || [])];
                      updated.push({
                        id: 'S' + (updated.length + 1),
                        decisionNo: `QĐ-L${updated.length + 10}/VCOMM`,
                        signDate: new Date().toLocaleDateString('vi-VN'),
                        effectiveDate: new Date().toLocaleDateString('vi-VN'),
                        baseSalary: 15000000,
                        coef: 1.0,
                        allowance: 1000000,
                        status: 'pending',
                        approvedBy: 'Hành chính tổng hợp'
                      });
                      updateNestedList('salaryHistory', updated);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded flex items-center gap-1 active:scale-95 transition-all text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm quyết định lương mới
                  </button>
                </div>

                <div className="overflow-x-auto border rounded-lg border-neutral-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-neutral-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Số quyết định</th>
                        <th className="p-3">Ngày ký</th>
                        <th className="p-3">Ngày chính thức hiệu lực</th>
                        <th className="p-3 text-right">Lương cơ bản</th>
                        <th className="p-3 text-center">Hệ số lương</th>
                        <th className="p-3 text-right">Phụ cấp</th>
                        <th className="p-3">Người phê duyệt</th>
                        <th className="p-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-150">
                      {formState.salaryHistory && formState.salaryHistory.map((s: any, index: number) => (
                        <tr key={s.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-850">
                            <input 
                              type="text" 
                              value={s.decisionNo} 
                              onChange={(e) => {
                                const updated = [...formState.salaryHistory];
                                updated[index].decisionNo = e.target.value;
                                updateNestedList('salaryHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent font-bold text-slate-800 w-full"
                            />
                          </td>
                          <td className="p-3 font-mono">
                            <input 
                              type="text" 
                              value={s.signDate} 
                              onChange={(e) => {
                                const updated = [...formState.salaryHistory];
                                updated[index].signDate = e.target.value;
                                updateNestedList('salaryHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent font-mono text-slate-800 w-24"
                            />
                          </td>
                          <td className="p-3 font-mono">
                            <input 
                              type="text" 
                              value={s.effectiveDate} 
                              onChange={(e) => {
                                const updated = [...formState.salaryHistory];
                                updated[index].effectiveDate = e.target.value;
                                updateNestedList('salaryHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent font-mono text-slate-800 w-24"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input 
                              type="number" 
                              value={s.baseSalary} 
                              onChange={(e) => {
                                const updated = [...formState.salaryHistory];
                                updated[index].baseSalary = parseInt(e.target.value) || 0;
                                updateNestedList('salaryHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent font-bold text-right text-slate-800 w-28"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input 
                              type="number" 
                              step="0.1"
                              value={s.coef} 
                              onChange={(e) => {
                                const updated = [...formState.salaryHistory];
                                updated[index].coef = parseFloat(e.target.value) || 1.0;
                                updateNestedList('salaryHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent text-center text-slate-800 w-16"
                            />
                          </td>
                          <td className="p-3 text-right">
                            <input 
                              type="number" 
                              value={s.allowance} 
                              onChange={(e) => {
                                const updated = [...formState.salaryHistory];
                                updated[index].allowance = parseInt(e.target.value) || 0;
                                updateNestedList('salaryHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent font-bold text-right text-slate-800 w-24"
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              type="text" 
                              value={s.approvedBy} 
                              onChange={(e) => {
                                const updated = [...formState.salaryHistory];
                                updated[index].approvedBy = e.target.value;
                                updateNestedList('salaryHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent text-slate-800 w-full"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formState.salaryHistory.filter((item: any) => item.id !== s.id);
                                updateNestedList('salaryHistory', updated);
                              }}
                              className="p-1 px-2 border border-red-200 text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'family' && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Đăng ký thân nhân giảm trừ gia cảnh & liên hệ khẩn cấp</span>
                  <button 
                    type="button"
                    onClick={() => {
                      const updated = [...(formState.familyMembers || [])];
                      updated.push({
                        id: 'F' + (updated.length + 1),
                        name: '',
                        relationship: 'Con',
                        dob: '01/01/2020',
                        job: 'Học sinh',
                        phone: '',
                        isDependent: true
                      });
                      updateNestedList('familyMembers', updated);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded flex items-center gap-1 active:scale-95 transition-all text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm danh sách thân nhân
                  </button>
                </div>

                <div className="overflow-x-auto border rounded-lg border-neutral-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-neutral-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Họ và tên nhân thân</th>
                        <th className="p-3">Mối quan hệ</th>
                        <th className="p-3">Ngày sinh</th>
                        <th className="p-3">Nghề nghiệp</th>
                        <th className="p-3">Số điện thoại liên hệ</th>
                        <th className="p-3 text-center">Thuộc diện phụ thuộc</th>
                        <th className="p-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-150">
                      {formState.familyMembers && formState.familyMembers.map((member: any, index: number) => (
                        <tr key={member.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold">
                            <input 
                              type="text" 
                              value={member.name} 
                              onChange={(e) => {
                                const updated = [...formState.familyMembers];
                                updated[index].name = e.target.value;
                                updateNestedList('familyMembers', updated);
                              }}
                              className="border border-zinc-200 rounded px-2.5 py-0.5 bg-transparent font-bold text-slate-800 w-full"
                              placeholder="Nhập họ và tên..."
                            />
                          </td>
                          <td className="p-3">
                            <select
                              value={member.relationship}
                              onChange={(e) => {
                                const updated = [...formState.familyMembers];
                                updated[index].relationship = e.target.value;
                                updateNestedList('familyMembers', updated);
                              }}
                              className="border border-zinc-200 rounded px-1.5 py-0.5 bg-white text-slate-800"
                            >
                              <option value="Bố">Bố đẻ</option>
                              <option value="Mẹ">Mẹ đẻ</option>
                              <option value="Vợ">Vợ</option>
                              <option value="Chồng">Chồng</option>
                              <option value="Con">Con ruột</option>
                              <option value="Anh/Em">Anh/Chị/Em</option>
                            </select>
                          </td>
                          <td className="p-3 font-mono">
                            <input 
                              type="text" 
                              value={member.dob} 
                              onChange={(e) => {
                                const updated = [...formState.familyMembers];
                                updated[index].dob = e.target.value;
                                updateNestedList('familyMembers', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent font-mono text-slate-850 w-28"
                            />
                          </td>
                          <td className="p-3">
                            <input 
                              type="text" 
                              value={member.job} 
                              onChange={(e) => {
                                const updated = [...formState.familyMembers];
                                updated[index].job = e.target.value;
                                updateNestedList('familyMembers', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent text-slate-800 w-full"
                            />
                          </td>
                          <td className="p-3 font-mono">
                            <input 
                              type="text" 
                              value={member.phone} 
                              onChange={(e) => {
                                const updated = [...formState.familyMembers];
                                updated[index].phone = e.target.value;
                                updateNestedList('familyMembers', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent font-mono text-slate-800 w-32"
                              placeholder="SDT liên hệ"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={member.isDependent} 
                              onChange={(e) => {
                                const updated = [...formState.familyMembers];
                                updated[index].isDependent = e.target.checked;
                                updateNestedList('familyMembers', updated);
                              }}
                              className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formState.familyMembers.filter((item: any) => item.id !== member.id);
                                updateNestedList('familyMembers', updated);
                              }}
                              className="p-1 px-2 border border-red-200 text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'docs' && (
              <div className="space-y-4 text-xs">
                <p className="text-slate-600 font-bold leading-relaxed mb-4">
                  Hệ thống số hóa hồ sơ giấy của cán bộ nhân viên. Đảm bảo đầy đủ bản sao có chứng thực để hoàn thiện điều kiện xuất lương.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formState.documents && formState.documents.map((doc: any, index: number) => (
                    <div key={doc.id} className="border border-zinc-200/80 rounded-lg p-4 flex justify-between items-center shadow-inner hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary-50 text-primary-600 rounded-lg">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 leading-snug uppercase text-[11px] tracking-tight">{doc.type}</div>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1.5 font-mono">
                            {doc.status === 'submitted' ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Đã nghiệm thu (Tải lại lúc {doc.updatedAt})
                              </span>
                            ) : (
                              <span className="text-amber-600 font-bold flex items-center gap-0.5">
                                <AlertCircle className="w-3 h-3 text-amber-600" /> Còn thiếu / Chờ bổ sung
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <button 
                          type="button" 
                          onClick={() => {
                            const updated = [...formState.documents];
                            updated[index].status = 'submitted';
                            updated[index].updatedAt = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
                            updateNestedList('documents', updated);
                            alert(`Thiết lập file đính kèm cho "${doc.type}" thành công!`);
                          }}
                          className="px-2.5 py-1.5 bg-slate-900 border text-white hover:bg-slate-800 rounded font-bold text-[10px]"
                        >
                          Tải lên file mới
                        </button>
                        {doc.status === 'submitted' && (
                          <button 
                            type="button" 
                            onClick={() => alert(`Đang giả lập hiển thị tệp tin đính kèm cho ${doc.type}`)}
                            className="px-2.5 py-1.5 border bg-white text-slate-700 hover:bg-slate-100 rounded font-bold text-[10px]"
                          >
                            Xem bản gốc
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-650">Thiết bị, tài sản, bản quyền phần mềm đã được cấp phát bàn giao</span>
                  <button 
                    type="button"
                    onClick={() => {
                      const nameInput = prompt("Nhập tên dòng thiết bị văn phòng:");
                      if (!nameInput) return;
                      const updated = [...(formState.equipmentList || [])];
                      updated.push({
                        id: 'E' + (updated.length + 1),
                        name: nameInput,
                        code: 'EQ-' + Math.floor(1000 + Math.random() * 9000),
                        assignDate: new Date().toLocaleDateString('vi-VN'),
                        status: 'active',
                        value: 12000000
                      });
                      updateNestedList('equipmentList', updated);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded flex items-center gap-1 active:scale-95 transition-all text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Khởi tạo biên bản cấp phát thiết bị
                  </button>
                </div>

                <div className="overflow-x-auto border rounded-lg border-neutral-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-neutral-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Tên thiết bị bàn giao</th>
                        <th className="p-3">Mã định danh tài sản/Serial No</th>
                        <th className="p-3">Ngày bàn giao sở hữu</th>
                        <th className="p-3 text-right">Khấu hao ước tính (VND)</th>
                        <th className="p-3 text-center">Tình trạng vật lý</th>
                        <th className="p-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-150">
                      {formState.equipmentList && formState.equipmentList.map((eq: any, index: number) => (
                        <tr key={eq.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-850 flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-slate-500" />
                            <input 
                              type="text" 
                              value={eq.name} 
                              onChange={(e) => {
                                const updated = [...formState.equipmentList];
                                updated[index].name = e.target.value;
                                updateNestedList('equipmentList', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent font-bold text-slate-800 w-full"
                            />
                          </td>
                          <td className="p-3 font-mono font-bold">
                            <input 
                              type="text" 
                              value={eq.code} 
                              onChange={(e) => {
                                const updated = [...formState.equipmentList];
                                updated[index].code = e.target.value;
                                updateNestedList('equipmentList', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent font-mono text-slate-800 w-44"
                            />
                          </td>
                          <td className="p-3 font-mono text-slate-650">
                            <input 
                              type="text" 
                              value={eq.assignDate} 
                              onChange={(e) => {
                                const updated = [...formState.equipmentList];
                                updated[index].assignDate = e.target.value;
                                updateNestedList('equipmentList', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent font-mono text-slate-800 w-32"
                            />
                          </td>
                          <td className="p-3 text-right font-bold font-mono">
                            <input 
                              type="number" 
                              value={eq.value} 
                              onChange={(e) => {
                                const updated = [...formState.equipmentList];
                                updated[index].value = parseInt(e.target.value) || 0;
                                updateNestedList('equipmentList', updated);
                              }}
                              className="border border-zinc-200 rounded px-2 py-0.5 bg-transparent font-mono font-bold text-right text-slate-800 w-28"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={eq.status}
                              onChange={(e) => {
                                const updated = [...formState.equipmentList];
                                updated[index].status = e.target.value;
                                updateNestedList('equipmentList', updated);
                              }}
                              className="border border-zinc-200 rounded px-1.5 py-0.5 bg-white text-slate-800 font-bold"
                            >
                              <option value="active">Đang sử dụng ổn định</option>
                              <option value="repairing">Hỏng hóc / Đang bảo trì</option>
                              <option value="lost">Báo mất mát / Thất thoát</option>
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formState.equipmentList.filter((item: any) => item.id !== eq.id);
                                updateNestedList('equipmentList', updated);
                              }}
                              className="p-1 px-2 border border-red-200 text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'experience' && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Sơ lý quá trình làm việc trước khi gia nhập VComm ERP</span>
                  <button 
                    type="button"
                    onClick={() => {
                      const updated = [...(formState.workHistory || [])];
                      updated.push({
                        id: 'W' + (updated.length + 1),
                        company: 'Đơn vị cũ',
                        position: 'Nhân viên marketing',
                        fromDate: '2023',
                        toDate: '2025',
                        reason: 'Tìm kiếm thách thức mới'
                      });
                      updateNestedList('workHistory', updated);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded flex items-center gap-1 active:scale-95 transition-all text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm địa chỉ làm việc lịch sử
                  </button>
                </div>

                <div className="overflow-x-auto border rounded-lg border-neutral-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-neutral-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Doanh nghiệp công tác</th>
                        <th className="p-3">Chức vụ đảm nhiệm</th>
                        <th className="p-3 text-center">Từ thời gian</th>
                        <th className="p-3 text-center">Đến thời gian</th>
                        <th className="p-3">Lý do chấm dứt công tác</th>
                        <th className="p-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-150">
                      {formState.workHistory && formState.workHistory.map((w: any, index: number) => (
                        <tr key={w.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-bold text-slate-850">
                            <input 
                              type="text" 
                              value={w.company} 
                              onChange={(e) => {
                                const updated = [...formState.workHistory];
                                updated[index].company = e.target.value;
                                updateNestedList('workHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-2.5 py-0.5 bg-transparent font-bold text-slate-800 w-full"
                            />
                          </td>
                          <td className="p-3 text-slate-800">
                            <input 
                              type="text" 
                              value={w.position} 
                              onChange={(e) => {
                                const updated = [...formState.workHistory];
                                updated[index].position = e.target.value;
                                updateNestedList('workHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-2.5 py-0.5 bg-transparent text-slate-800 w-full"
                            />
                          </td>
                          <td className="p-3 text-center font-mono">
                            <input 
                              type="text" 
                              value={w.fromDate} 
                              onChange={(e) => {
                                const updated = [...formState.workHistory];
                                updated[index].fromDate = e.target.value;
                                updateNestedList('workHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-1.5 py-0.5 bg-transparent font-mono text-center text-slate-800 w-20"
                            />
                          </td>
                          <td className="p-3 text-center font-mono">
                            <input 
                              type="text" 
                              value={w.toDate} 
                              onChange={(e) => {
                                const updated = [...formState.workHistory];
                                updated[index].toDate = e.target.value;
                                updateNestedList('workHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-1.5 py-0.5 bg-transparent font-mono text-center text-slate-800 w-20"
                            />
                          </td>
                          <td className="p-3 text-slate-650">
                            <input 
                              type="text" 
                              value={w.reason} 
                              onChange={(e) => {
                                const updated = [...formState.workHistory];
                                updated[index].reason = e.target.value;
                                updateNestedList('workHistory', updated);
                              }}
                              className="border border-zinc-200 rounded px-2.5 py-0.5 bg-transparent text-slate-800 w-full"
                            />
                          </td>
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = formState.workHistory.filter((item: any) => item.id !== w.id);
                                updateNestedList('workHistory', updated);
                              }}
                              className="p-1 px-2 border border-red-200 text-rose-600 hover:bg-rose-50 rounded"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'rewards' && (
              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600">Lịch sử tôn vinh, Khen thưởng & thông báo Kỷ luật</span>
                  <button 
                    type="button"
                    onClick={() => {
                      const updated = [...(formState.rewardsHistory || [])];
                      updated.push({
                        id: 'R' + (updated.length + 1),
                        decisionNo: `QĐ-KT0${updated.length + 1}/2026/VCOMM`,
                        type: 'reward',
                        title: 'Đăng kiểm hiệu suất',
                        reason: 'Vượt mục tiêu đề ra xuất sắc',
                        date: new Date().toLocaleDateString('vi-VN')
                      });
                      updateNestedList('rewardsHistory', updated);
                    }}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded flex items-center gap-1 active:scale-95 transition-all text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tạo quyết định khen thưởng / kỷ luật
                  </button>
                </div>

                <div className="space-y-3">
                  {formState.rewardsHistory && formState.rewardsHistory.map((item: any, index: number) => (
                    <div 
                      key={item.id} 
                      className={cn(
                        "p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm",
                        item.type === 'reward' 
                          ? 'border-emerald-200 bg-emerald-50/20 text-emerald-900' 
                          : 'border-rose-250 bg-rose-50/10 text-rose-900'
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                            item.type === 'reward' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          )}>
                            {item.type === 'reward' ? 'KHEN THƯỞNG' : 'KỶ LUẬT'}
                          </span>
                          <span className="font-mono font-bold text-slate-500 text-[10px]">{item.decisionNo}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-[10px] text-slate-500">{item.date}</span>
                        </div>
                        <h4 className="font-sans font-black text-slate-900 text-sm leading-snug uppercase tracking-tight">
                          <input 
                            type="text" 
                            value={item.title} 
                            onChange={(e) => {
                              const updated = [...formState.rewardsHistory];
                              updated[index].title = e.target.value;
                              updateNestedList('rewardsHistory', updated);
                            }}
                            className="bg-transparent font-black text-slate-800 w-full outline-none focus:border-b focus:border-slate-400"
                          />
                        </h4>
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-bold text-slate-650">Lý do:</span> 
                          <input 
                            type="text" 
                            value={item.reason} 
                            onChange={(e) => {
                              const updated = [...formState.rewardsHistory];
                              updated[index].reason = e.target.value;
                              updateNestedList('rewardsHistory', updated);
                            }}
                            className="bg-transparent text-slate-600 w-full outline-none focus:border-b focus:border-slate-400 inline-block ml-1"
                          />
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={item.type}
                          onChange={(e) => {
                            const updated = [...formState.rewardsHistory];
                            updated[index].type = e.target.value;
                            updateNestedList('rewardsHistory', updated);
                          }}
                          className="border border-zinc-200 rounded px-1.5 py-1 bg-white text-xs text-slate-800 font-bold"
                        >
                          <option value="reward">Khen thưởng (+)</option>
                          <option value="penalty">Kỷ luật (-)</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formState.rewardsHistory.filter((r: any) => r.id !== item.id);
                            updateNestedList('rewardsHistory', updated);
                          }}
                          className="p-1.5 px-3 border border-zinc-300 rounded text-slate-500 hover:text-rose-600 hover:bg-white transition-colors text-[10px] font-bold"
                        >
                          Xóa quyết định
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'bio' && (
              <div className="space-y-4 text-xs">
                <span className="font-bold text-slate-600">Dòng sự kiện tiểu sử nổi bật của cá nhân</span>
                <div className="space-y-6 pl-4 border-l-2 border-orange-500/30 relative">
                  {formState.personalHistory && formState.personalHistory.map((p: any, index: number) => (
                    <div key={p.id} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-orange-600 border border-white" />
                      
                      <div className="bg-slate-50 p-4 rounded-lg border border-slate-200/60 flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="w-24 font-mono font-bold text-orange-700 shrink-0 uppercase tracking-tight">
                          <input 
                            type="text" 
                            value={p.period} 
                            onChange={(e) => {
                              const updated = [...formState.personalHistory];
                              updated[index].period = e.target.value;
                              updateNestedList('personalHistory', updated);
                            }}
                            className="bg-transparent font-bold font-mono text-orange-700 w-full outline-none focus:border-b focus:border-slate-300"
                          />
                        </div>
                        <div className="flex-1 text-slate-800 leading-relaxed">
                          <input 
                            type="text" 
                            value={p.description} 
                            onChange={(e) => {
                              const updated = [...formState.personalHistory];
                              updated[index].description = e.target.value;
                              updateNestedList('personalHistory', updated);
                            }}
                            className="bg-transparent text-slate-800 w-full outline-none focus:border-b focus:border-slate-300"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = formState.personalHistory.filter((item: any) => item.id !== p.id);
                            updateNestedList('personalHistory', updated);
                          }}
                          className="p-1 border border-zinc-200 hover:bg-rose-50 text-rose-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  type="button"
                  onClick={() => {
                    const updated = [...(formState.personalHistory || [])];
                    updated.push({
                      id: 'P' + (updated.length + 1),
                      period: 'Khoảng thời gian',
                      description: 'Mô tả tóm tắt sự kiện học tập hoặc hoạt động xã hội nổi bật...'
                    });
                    updateNestedList('personalHistory', updated);
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 font-bold rounded flex items-center gap-1 active:scale-95 transition-all text-[11px] w-fit mt-4"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm cột mốc mới
                </button>
              </div>
            )}

            {activeTab === 'logs' && (
              <div className="space-y-4 text-xs font-sans">
                <span className="font-bold text-slate-600 block">Lịch sử ghi chép sửa đổi dữ liệu lý lịch nhân viên</span>
                <div className="overflow-x-auto border rounded-lg border-neutral-200 bg-slate-50/50">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100/80 border-b border-zinc-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3 w-40">Thời điểm xảy ra</th>
                        <th className="p-3 w-48">Tác nhân sửa đổi</th>
                        <th className="p-3">Hành động/Thông báo chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                      {formState.editRequests && formState.editRequests.map((req: any) => (
                        <tr key={req.id} className="hover:bg-slate-50 font-mono text-slate-800">
                          <td className="p-3 font-bold text-slate-500">{req.timestamp}</td>
                          <td className="p-3 text-orange-700 font-bold">{req.author}</td>
                          <td className="p-3 font-sans font-medium text-slate-700">{req.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'insurance' && (
              <div className="space-y-4 text-xs font-sans text-slate-800">
                <p className="text-slate-600 leading-relaxed font-bold">
                  Bản tra cứu quá trình đóng BHXH (Bảo Hiểm Xã Hội), BHYT bắt buộc thông qua kết nối API cơ sở dữ liệu VSSID quốc gia.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-650">Số sổ BHXH định danh</span>
                    <input
                      type="text"
                      value={formState.socialInsuranceNo || '0116123456'}
                      onChange={(e) => setFormState((prev: any) => ({ ...prev, socialInsuranceNo: e.target.value }))}
                      className="w-full border border-zinc-350 rounded px-2.5 py-1.5 font-mono font-bold"
                      placeholder="Số BHXH cơ bản"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-650">Mức đóng BHXH cơ bản hiện tại</span>
                    <input
                      type="number"
                      value={formState.socialInsuranceSalary || 5000000}
                      onChange={(e) => setFormState((prev: any) => ({ ...prev, socialInsuranceSalary: parseInt(e.target.value) || 0 }))}
                      className="w-full border border-zinc-350 rounded px-2.5 py-1.5 font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border rounded-lg border-neutral-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-neutral-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-3">Chu kỳ đóng</th>
                        <th className="p-3">Đơn vị sử dụng lao động</th>
                        <th className="p-3 text-right">Phí đóng BHXH bắt buộc</th>
                        <th className="p-3 text-center">Trạng thái rà soát kiểm tra</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-150">
                      {formState.insuranceHistory && formState.insuranceHistory.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-850">{item.month}</td>
                          <td className="p-3 font-medium text-slate-700">{item.unit}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-800">
                            {item.amount?.toLocaleString('vi-VN')} VND
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold inline-block border border-emerald-100 text-[9px] uppercase tracking-wider">
                              Đối soát hoàn thành
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'others' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs text-slate-800 font-sans">
                <div className="space-y-2 border p-4 bg-slate-50/50 rounded-lg">
                  <span className="font-bold text-slate-650 block border-b pb-1 mb-2 uppercase tracking-tight text-[10px] text-orange-700">Chính đảng & Quân sự</span>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer p-1 font-bold">
                      <input 
                        type="checkbox" 
                        checked={formState.isPartyMember ?? false} 
                        onChange={(e) => setFormState((prev: any) => ({ ...prev, isPartyMember: e.target.checked }))}
                        className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                      />
                      Đoàn viên / Đảng viên ĐCSVN
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer p-1 font-bold">
                      <input 
                        type="checkbox" 
                        checked={formState.milServiceCompleted ?? false} 
                        onChange={(e) => setFormState((prev: any) => ({ ...prev, milServiceCompleted: e.target.checked }))}
                        className="rounded border-zinc-300 text-orange-600 focus:ring-orange-500 w-4 h-4"
                      />
                      Đã hoàn tất nghĩa vụ quân sự
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-650 block">Nhóm máu nhóm</span>
                  <select
                    value={formState.bloodType || 'O'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, bloodType: e.target.value }))}
                    className="w-full border border-zinc-350 bg-white rounded px-2.5 py-1.5"
                  >
                    <option value="O">Nhóm O</option>
                    <option value="A">Nhóm A</option>
                    <option value="B">Nhóm B</option>
                    <option value="AB">Nhóm AB</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="font-bold text-slate-650 block">Tình trạng hôn nhân</span>
                  <select
                    value={formState.maritalStatus || 'Độc thân'}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, maritalStatus: e.target.value }))}
                    className="w-full border border-zinc-350 bg-white rounded px-2.5 py-1.5"
                  >
                    <option value="Độc thân">Độc thân</option>
                    <option value="Đã kết hôn">Đã kết hôn</option>
                    <option value="Ly hôn">Ly hôn / Góa lẻ</option>
                  </select>
                </div>

                <div className="col-span-3 space-y-1 mt-2">
                  <span className="font-bold text-slate-650">Ghi chú đặc thù nhân sự</span>
                  <textarea
                    rows={4}
                    value={formState.notes || ''}
                    onChange={(e) => setFormState((prev: any) => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-zinc-350 rounded-lg px-2.5 py-2 whitespace-pre-wrap outline-none focus:ring-1 focus:ring-orange-500 bg-white text-slate-800"
                    placeholder="Nhập thông tin cam kết bảo mật thông tin NDA, sở thích cá nhân, năng lực sở trường hoặc lưu ý nội bộ công tác..."
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER INFORMATIONAL BLOCK */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center bg-white shrink-0">
          <div className="text-xs text-slate-500 italic font-sans flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 block animate-pulse" />
            Vui lòng xem xét đối chiếu thông tin chính xác trùng khớp với chứng minh thư, lý lịch và trích lục pháp lý.
          </div>
          <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-widest">
            VCOMM ERP HRMODULE V5.26
          </div>
        </div>
      </motion.div>
    </div>
  );
};
