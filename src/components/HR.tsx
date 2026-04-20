import React, { useState } from 'react';
import { 
  Users, 
  Clock, 
  Wallet, 
  UserPlus, 
  HeartHandshake, 
  FileText, 
  ShieldCheck, 
  MapPin, 
  Search, 
  Filter, 
  Calendar,
  Building2,
  MoreVertical,
  Timer,
  BadgeDollarSign,
  Briefcase,
  Target,
  Rocket,
  ArrowLeft,
  BrainCircuit,
  PieChart,
  CheckCircle2,
  Activity,
  Smile,
  AlertCircle,
  CalendarOff,
  TrendingUp,
  LineChart,
  Layers,
  ClipboardList,
  FileSignature,
  DollarSign,
  Zap,
  Mail,
  User,
  Send,
  BarChart2,
  Settings,
  Video
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Employee, AttendanceRecord, Payroll, KPI } from '../types/erp';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const MOCK_KPIs: KPI[] = [
  {
    id: 'KPI-001',
    employeeId: 'EMP-001',
    title: 'Tỷ lệ xuất/nhập kho đúng hạn',
    target: 95,
    current: 92.5,
    unit: '%',
    period: 'Q1/2024'
  },
  {
    id: 'KPI-002',
    employeeId: 'EMP-002',
    title: 'Lượt tiếp cận chiến dịch mới',
    target: 500000,
    current: 580000,
    unit: 'reach',
    period: '03/2024'
  }
];

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-001',
    fullName: 'Lê Hoàng Minh',
    email: 'minh.lh@vecom.vn',
    phone: '0901234567',
    department: 'Vận hành Sàn',
    position: 'Quản lý kho',
    joinDate: '2023-01-15',
    employeeType: 'full_time',
    status: 'active',
    contracts: [],
    skills: [{ name: 'Logistics', level: 90 }, { name: 'Leadership', level: 75 }],
    leaveBalance: { total: 12, used: 4, pending: 1 },
    recentSentiment: 'positive'
  },
  {
    id: 'EMP-002',
    fullName: 'Nguyễn Diệu Nhi',
    email: 'nhi.nd@vecom.vn',
    phone: '0987123456',
    department: 'Marketing',
    position: 'KOL Specialist',
    joinDate: '2023-06-01',
    employeeType: 'full_time',
    status: 'active',
    contracts: [],
    skills: [{ name: 'Social Media', level: 95 }, { name: 'Creativity', level: 88 }],
    leaveBalance: { total: 12, used: 11, pending: 0 },
    recentSentiment: 'critical'
  }
];

const MOCK_PAYROLL: Payroll[] = [
  {
    id: 'PAY-001',
    employeeId: 'EMP-001',
    employeeName: 'Lê Hoàng Minh',
    month: '03/2024',
    baseSalary: 15000000,
    allowance: 2000000,
    bonus: 1000000,
    deduction: 0,
    pitAmount: 450000,
    insuranceAmount: 1500000,
    netSalary: 16050000,
    status: 'pending'
  }
];

const HR_METRICS_DATA = [
  { month: 'T1', attrition: 2.1, hiring: 15 },
  { month: 'T2', attrition: 1.8, hiring: 12 },
  { month: 'T3', attrition: 2.4, hiring: 20 },
  { month: 'T4', attrition: 1.5, hiring: 8 },
  { month: 'T5', attrition: 1.9, hiring: 18 },
  { month: 'T6', attrition: 1.2, hiring: 25 },
];

// --- ATTENDANCE INSTALLATION SETTINGS ---
export type AttendanceSetting = {
  method: 'gps' | 'wifi' | 'face' | 'qr' | 'device';
  enabled: boolean;
  config: Record<string, any>;
};

const INITIAL_ATTENDANCE_SETTINGS: AttendanceSetting[] = [
  { method: 'gps', enabled: true, config: { radius: 100 } },
  { method: 'wifi', enabled: false, config: { ssid: '' } },
  { method: 'face', enabled: true, config: { minMatch: 0.8 } },
  { method: 'qr', enabled: true, config: { refreshRate: 30 } },
  { method: 'device', enabled: true, config: { ip: '' } },
];
// --- PAYROLL INTELLIGENT ENGINE ---
const autoCalculatePayroll = (employee: Employee, attendance: AttendanceRecord[], kpi: KPI[]) => {
  const baseSalary = 15000000;
  const attendanceRecords = attendance.filter(a => a.employeeId === employee.id);
  const overtimeHours = attendanceRecords.reduce((sum, a) => sum + a.overtimeHours, 0);
  const lateCount = attendanceRecords.filter(a => a.status === 'late').length;
  
  const empKPI = kpi.find(k => k.employeeId === employee.id);
  const kpiBonus = empKPI ? (empKPI.current >= empKPI.target ? 2000000 : 0) : 0;
  
  const bonus = (overtimeHours * 100000) + kpiBonus;
  const deduction = lateCount * 500000;

  return {
    baseSalary,
    allowance: 2000000,
    bonus,
    deduction,
    pitAmount: (baseSalary + 2000000 + bonus - deduction) * 0.05,
    insuranceAmount: baseSalary * 0.1,
    netSalary: baseSalary + 2000000 + bonus - deduction - ((baseSalary + 2000000 + bonus - deduction) * 0.05) - (baseSalary * 0.1)
  };
};

const HR_MODULE_GROUPS = [
  {
    title: 'Hành chính & Nhân sự',
    items: [
      { id: 'personnel', label: 'Hồ sơ nhân sự', desc: 'Quản lý thông tin & lưu trữ.', icon: Users, color: 'blue' },
      { id: 'skills', label: 'Skill Matrix', desc: 'Sơ đồ kỹ năng & AI Scan.', icon: BrainCircuit, color: 'emerald' },
      { id: 'attendance', label: 'Chấm công GPS', desc: 'Quản lý chấm công đa nền tảng.', icon: MapPin, color: 'orange' },
      { id: 'attendance_config', label: 'Cài đặt Chấm công', desc: 'Cấu hình GPS, Wifi, Face, QR.', icon: Settings, color: 'orange' },
      { id: 'leave', label: 'Quản lý nghỉ phép', desc: 'Quy trình phép, công tác, OT.', icon: CalendarOff, color: 'indigo' },
      { id: 'kpi', label: 'KPI & Hiệu suất', desc: 'Đánh giá KPI & OKR.', icon: TrendingUp, color: 'purple' },
      { id: 'payroll', label: 'Lương & Payslip', desc: 'Bảng lương, phụ cấp.', icon: Wallet, color: 'rose' },
      { id: 'sentiment', label: 'Tâm lý nhân viên', desc: 'AI phân tích Sentiment.', icon: Smile, color: 'cyan' },
      { id: 'review_mod', label: 'Tổng hợp chấm công', desc: 'Sổ báo cáo giờ làm.', icon: ClipboardList, color: 'orange' },
      { id: 'points_mod', label: 'Điểm cộng trừ', desc: 'V-Point tích lũy, vinh danh.', icon: Zap, color: 'fuchsia' },
      { id: 'suggestions_mod', label: 'Hòm thư góp ý', desc: 'Gửi góp ý, xem phản hồi.', icon: Mail, color: 'blue' },
      { id: 'config_hr', label: 'Thiết lập HR', desc: 'Cấu hình hệ số, quy tắc.', icon: Building2, color: 'slate' }
    ]
  },
  {
    title: 'Tuyển dụng',
    items: [
      { id: 'rec_request', label: 'Đề xuất tuyển dụng', desc: 'Yêu cầu nhân sự mới.', icon: User, color: 'blue' },
      { id: 'rec_candidates', label: 'Ứng viên', desc: 'Quản lý hồ sơ ứng viên.', icon: Users, color: 'indigo' },
      { id: 'rec_interview', label: 'Lịch phỏng vấn', desc: 'Lên lịch phỏng vấn.', icon: Calendar, color: 'orange' },
      { id: 'rec_email', label: 'Thư gửi ứng viên', desc: 'Template thư mời.', icon: Send, color: 'emerald' },
      { id: 'rec_contract', label: 'Hợp đồng', desc: 'Soạn thảo, quản lý HĐ.', icon: FileText, color: 'purple' },
      { id: 'rec_trial', label: 'Đánh giá thử việc', desc: 'Checklist, báo cáo.', icon: ShieldCheck, color: 'cyan' },
      { id: 'rec_report', label: 'Báo cáo tuyển dụng', desc: 'Thống kê pipeline.', icon: BarChart2, color: 'slate' },
      { id: 'rec_config', label: 'Thiết lập tuyển dụng', desc: 'Config workflow.', icon: Settings, color: 'slate' },
    ]
  },
  {
    title: 'Cuộc họp',
    items: [
      { id: 'meet_rooms', label: 'Phòng họp', desc: 'Quản lý phòng họp.', icon: Building2, color: 'blue' },
      { id: 'meet_sessions', label: 'Cuộc họp', desc: 'Danh sách cuộc họp.', icon: Video, color: 'indigo' },
      { id: 'meet_minutes', label: 'Biên bản họp', desc: 'Lưu trữ biên bản.', icon: FileSignature, color: 'emerald' },
      { id: 'meet_report', label: 'Báo cáo cuộc họp', desc: 'Phân tích hiệu quả họp.', icon: BarChart2, color: 'purple' },
      { id: 'meet_config', label: 'Thiết lập cuộc họp', desc: 'Quy tắc họp.', icon: Settings, color: 'slate' },
    ]
  },
  {
    title: 'Đào tạo',
    items: [
      { id: 'train_plan', label: 'Kế hoạch đào tạo', desc: 'Chi phí, thời gian.', icon: Calendar, color: 'emerald' },
      { id: 'train_courses', label: 'Khóa đào tạo', desc: 'Tài liệu, bài học.', icon: BrainCircuit, color: 'orange' },
      { id: 'train_reg', label: 'Đăng ký tham gia', desc: 'Quản lý đăng ký.', icon: Users, color: 'blue' },
      { id: 'train_report', label: 'Báo cáo đào tạo', desc: 'Kết quả, khảo sát.', icon: BarChart2, color: 'cyan' },
      { id: 'train_config', label: 'Thiết lập đào tạo', desc: 'Config quy tắc.', icon: Settings, color: 'slate' },
    ]
  }
];

function getColorClasses(color: string) {
  switch (color) {
    case 'blue': return 'bg-blue-50 text-blue-600';
    case 'orange': return 'bg-orange-50 text-orange-600';
    case 'indigo': return 'bg-indigo-50 text-indigo-600';
    case 'purple': return 'bg-purple-50 text-purple-600';
    case 'emerald': return 'bg-emerald-50 text-emerald-600';
    case 'fuchsia': return 'bg-fuchsia-50 text-fuchsia-600';
    case 'rose': return 'bg-rose-50 text-rose-600';
    case 'cyan': return 'bg-cyan-50 text-cyan-600';
    case 'slate':
    default: return 'bg-slate-50 text-slate-600';
  }
}

export function HumanResources() {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSetting[]>(INITIAL_ATTENDANCE_SETTINGS);

  const toggleAttendanceSetting = (method: string) => {
    setAttendanceSettings(prev => prev.map(s => s.method === method ? { ...s, enabled: !s.enabled } : s));
  };

  const updateSettingConfig = (method: string, key: string, value: any) => {
    setAttendanceSettings(prev => prev.map(s => s.method === method ? { ...s, config: { ...s.config, [key]: value } } : s));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Quản trị Nguồn nhân lực (HRM)</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý hồ sơ nhân sự, Skill Matrix và Onboarding Intelligence.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <LineChart className="w-4 h-4 text-emerald-600" />
            Báo cáo Nhân sự
          </button>
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-purple-600" />
            AI Talent Scan
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Tuyển dụng nhân sự
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm transform hover:-translate-y-1 transition-all">
               <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Tổng nhân sự</span>
              <Users className="w-4 h-4 text-blue-600" />
           </div>
           <div className="text-3xl font-bold text-[#111827]">124</div>
           <div className="mt-2 flex items-center gap-1.5 text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded-lg w-fit">
              <Building2 className="w-3.5 h-3.5" /> 05 Phòng ban
           </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm transform hover:-translate-y-1 transition-all">
           <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Đang Onboarding</span>
              <Rocket className="w-4 h-4 text-emerald-600" />
           </div>
           <div className="text-3xl font-bold text-emerald-600">12</div>
           <p className="text-[10px] text-[#6B7280] mt-2 font-medium">Bổ sung 4 nhân sự Kho Q3</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm transform hover:-translate-y-1 transition-all">
           <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Quỹ lương tháng</span>
              <Wallet className="w-4 h-4 text-slate-400" />
           </div>
           <div className="text-2xl font-bold text-[#111827] truncate">{formatCurrency(1850000000)}</div>
           <p className="text-[10px] text-slate-400 mt-2 italic">Tăng 5.2% so với tháng 2</p>
        </div>
        <div className="bg-[#111827] p-6 rounded-lg shadow-xl shadow-slate-200 relative overflow-hidden group">
           <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex justify-between items-start mb-3">
                 <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Skill Health</span>
                 <Target className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                 <div className="text-3xl font-bold text-white tracking-tighter">88.5%</div>
                 <p className="text-[10px] text-blue-400 font-bold mt-1 uppercase">Top Dept: Marketing</p>
              </div>
           </div>
           <BrainCircuit className="absolute -bottom-6 -right-6 w-24 h-24 text-white/5 group-hover:rotate-12 transition-transform duration-700" />
        </div>
      </div>

      {/* HR Analytics Dashboard (Upgraded) */}
      <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm mb-6">
         <h3 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" /> HR Dashboard Insight
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
             <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={HR_METRICS_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                     <YAxis yAxisId="left" orientation="left" stroke="#2563EB" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
                     <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={10} />
                     <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                       cursor={{fill: '#F3F4F6'}}
                     />
                     <Bar yAxisId="left" dataKey="hiring" name="Tuyển mới" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={24} />
                     <Bar yAxisId="right" dataKey="attrition" name="Tỷ lệ nghỉ việc (%)" fill="#FBBF24" radius={[4, 4, 0, 0]} barSize={24} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
             <div className="space-y-6">
                <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-lg">
                    <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2"><BrainCircuit className="w-4 h-4 text-blue-600" /> AI Insights</h4>
                    <p className="text-xs text-blue-800 leading-relaxed">Tỷ lệ nghỉ việc (attrition rate) giảm ổn định trong Q2, đặc biệt sau khi triển khai chương trình phúc lợi mới. Nhu cầu tuyển mới tăng mạnh trong tháng 6 chuẩn bị cho mùa Sale cuối năm.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Time to Fill</span>
                        <div className="text-2xl font-bold text-[#111827]">14 Ngày</div>
                        <span className="text-[10px] text-emerald-600 font-bold block mt-1">-2 ngày vs Q1</span>
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Employee NPS</span>
                        <div className="text-2xl font-bold text-[#111827]">78</div>
                        <span className="text-[10px] text-emerald-600 font-bold block mt-1">Hạng A Industry</span>
                    </div>
                </div>
             </div>
          </div>
       </div>
          
       <div className="space-y-12 bg-transparent rounded-b-xl border-t-0 border-[#F3F4F6] mt-4">
            {HR_MODULE_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h2 className="text-xl font-bold text-[#111827]">{group.title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {group.items.map(item => (
                      <button 
                         key={item.id}
                         onClick={() => setActiveTab(item.id)}
                         className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md hover:bg-white transition-all text-left flex gap-4 items-start group"
                      >
                         <div className={cn("p-3 rounded-xl shrink-0 transition-transform group-hover:scale-105", getColorClasses(item.color))}>
                            <item.icon className="w-6 h-6" />
                         </div>
                         <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-[#111827] mb-1">{item.label}</h3>
                            <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.desc}</p>
                         </div>
                      </button>
                   ))}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
             <div className="bg-white p-10 border border-[#E5E7EB] rounded-xl shadow-sm space-y-8 relative overflow-hidden group">
                <h3 className="text-xl font-bold text-[#111827] flex items-center gap-3 relative z-10">
                   <Rocket className="w-6 h-6 text-emerald-500" /> New Hire Launchpad
                </h3>
                <div className="space-y-6 relative z-10">
                   {[
                     { name: 'Chuẩn bị workspace', progress: 100, status: 'Done' },
                     { name: 'Training văn hóa sàn', progress: 45, status: 'In progress' },
                     { name: 'Cấp quyền hệ thống ERP', progress: 10, status: 'Pending' }
                   ].map((m, i) => (
                     <div key={i} className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                           <span className="font-bold text-[#111827]">{m.name}</span>
                           <span className={cn(
                             "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
                             m.status === 'Done' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                           )}>{m.status}</span>
                        </div>
                        <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                           <div className={cn("h-full transition-all duration-1000", m.status === 'Done' ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${m.progress}%` }} />
                        </div>
                     </div>
                   ))}
                   <button className="w-full py-4 bg-[#111827] text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-all uppercase tracking-[0.2em] shadow-lg shadow-slate-900/20">Quản lý lộ trình Onboarding</button>
                </div>
                <PieChart className="absolute -bottom-12 -right-12 w-48 h-48 text-slate-50 group-hover:scale-110 transition-transform duration-700" />
             </div>

             <div className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] p-10 rounded-xl text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
                <div className="relative z-10 space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="p-4 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                         <BrainCircuit className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-extrabold italic font-serif tracking-tight">AI Skill Gap Analysis</h3>
                        <p className="text-blue-100/60 text-[10px] font-bold uppercase tracking-widest mt-1">Hạt nhân HRM v5.0</p>
                      </div>
                   </div>
                   <p className="text-blue-50 text-sm leading-relaxed max-w-sm">
                      AI tự động phân tích dữ liệu hiệu suất của nhân sự để xác định các lỗ hổng kỹ năng so với mục tiêu chiến lược của sàn trong Q4. Từ đó cá nhân hóa lộ trình đào tạo nội bộ.
                   </p>
                </div>
                <div className="relative z-10 pt-8">
                   <button className="px-10 py-4 bg-white text-blue-600 font-bold rounded-lg text-xs hover:translate-y-[-2px] transition-all uppercase tracking-widest shadow-xl shadow-blue-900/40">Launch Matrix AI Scan</button>
                </div>
                <Activity className="absolute -top-12 -right-12 w-64 h-64 text-white/5 opacity-50" />
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative mt-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent pointer-events-none rounded-xl" />
             <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
                <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
                   <MapPin className="w-4 h-4 text-[#2563EB]" /> Live Map Chấm công Giao hàng
                </h3>
                <div className="h-48 bg-slate-50 rounded-xl border border-[#F3F4F6] relative overflow-hidden flex items-center justify-center">
                   <div className="text-center space-y-2 opacity-40">
                      <MapPin className="w-8 h-8 mx-auto" />
                      <p className="text-xs font-medium">Bản đồ GPS đang hoạt động (Mock)</p>
                   </div>
                   <div className="absolute top-10 left-20 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
                   <div className="absolute top-20 right-32 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <p className="text-[10px] text-[#6B7280] mt-3">Tích hợp GPS App để chấm công tự động cho nhân viên vận chuyển và Sale hiện trường khi vào vùng kho/cửa hàng.</p>
             </div>
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 rounded-xl flex flex-col justify-between">
                <div>
                   <h3 className="text-xl font-bold italic mb-2">Dynamic Salary Engine</h3>
                   <p className="text-slate-400 text-sm leading-relaxed">Cấu hình công thức tính lương động theo từng vị trí (Kinh doanh: Lương cứng + % Hoa hồng; Kho: Lương theo sản lượng). Tự động kết nối dữ liệu từ module Seller & Đơn hàng để tính thưởng nóng.</p>
                </div>
                <div className="pt-6">
                   <button className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                      <Briefcase className="w-4 h-4" /> Cấu hình công thức tính lương
                   </button>
                </div>
             </div>
          </div>
        </>
      )}

      {activeTab !== 'overview' && (
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
        <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
           <button 
             onClick={() => setActiveTab('overview')} 
             className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-xl w-fit shadow-sm"
           >
              <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
           </button>
        </div>
        
        {['personnel', 'skills', 'attendance', 'leave', 'kpi', 'sentiment', 'payroll', 'attendance_config'].includes(activeTab) ? (
          <>
            <div className="p-4 bg-white border-b border-[#F3F4F6] flex justify-between items-center px-6">
              <div className="flex gap-4">
                 <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                   <input 
                     type="text" 
                     placeholder="Tìm nhân viên, kỹ năng, vị trí..." 
                     className="bg-slate-50 border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none w-72 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                   />
                 </div>
                 <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-xl text-sm text-[#4B5563] flex items-center gap-2 font-bold hover:bg-slate-50">
                    <Filter className="w-4 h-4" /> Lọc phòng ban
                 </button>
              </div>
              
              <div className="flex gap-3">
                 {activeTab === 'payroll' && (
                    <button 
                      onClick={() => {
                        const results = MOCK_EMPLOYEES.map(emp => ({
                          employeeId: emp.id,
                          ...autoCalculatePayroll(emp, [], MOCK_KPIs)
                        }));                
                        console.table(results);                
                        alert("Đã tính lương tự động thành công (Kiểm tra console/table)!");
                      }}
                      className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all">
                       <Zap className="w-4 h-4" /> Tính lương AI (Batch)
                    </button>
                 )}
                 {activeTab === 'payroll' && (
                    <button className="bg-[#111827] text-white px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-all">
                       <BadgeDollarSign className="w-4 h-4 text-blue-400" /> Xuất phiếu lương đồng loạt
                    </button>
                 )}
                 <button className="text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg font-bold text-sm border border-transparent hover:bg-slate-50">Xuất Excel</button>
              </div>
            </div>

              <div className="overflow-x-auto">
                {activeTab === 'attendance_config' ? (
                <div className="p-8 space-y-6">
                  <h2 className="text-lg font-bold flex items-center gap-2"><Settings className="w-5 h-5"/> Cài đặt Chấm công</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-12">
                    {attendanceSettings.map(setting => (
                      <div key={setting.method} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col gap-4 shadow-sm relative overflow-hidden group">
                         <div className={cn("absolute top-0 left-0 w-1 h-full transition-all duration-300", setting.enabled ? "bg-emerald-500" : "bg-slate-200")}></div>
                         <div className="flex justify-between items-start pl-2">
                             <div>
                                <p className="font-bold text-slate-800 text-base">{
                                   setting.method === 'gps' ? 'Chấm công GPS (Địa điểm)' :
                                   setting.method === 'wifi' ? 'Chấm công qua mạng Wi-Fi' :
                                   setting.method === 'face' ? 'Chấm công nhận diện khuôn mặt' :
                                   setting.method === 'qr' ? 'Chấm công bằng mã QR động' :
                                   'Đồng bộ từ máy chấm công'
                                }</p>
                                <p className="text-slate-500 text-xs mt-1">Phương thức: <span className="uppercase font-mono font-bold text-indigo-600">{setting.method}</span></p>
                             </div>
                             <button
                               onClick={() => toggleAttendanceSetting(setting.method)}
                               className={cn(
                                 "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20",
                                 setting.enabled ? "bg-emerald-500" : "bg-slate-200"
                               )}
                             >
                                <span className={cn(
                                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                  setting.enabled ? "translate-x-6" : "translate-x-1"
                                )} />
                             </button>
                         </div>
                         
                         {setting.enabled && (
                            <div className="pl-2 pt-4 border-t border-slate-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                               {setting.method === 'gps' && (
                                  <div className="flex flex-col gap-1.5">
                                     <label className="text-xs font-bold text-slate-600">Bán kính cho phép (mét)</label>
                                     <input 
                                       type="number" 
                                       value={setting.config.radius}
                                       onChange={(e) => updateSettingConfig('gps', 'radius', Number(e.target.value))}
                                       className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full font-mono font-medium"
                                     />
                                     <p className="text-[10px] text-slate-500 mt-1">Số mét tối đa cho phép nhân viên cách vị trí chuẩn.</p>
                                  </div>
                               )}
                               {setting.method === 'wifi' && (
                                  <div className="flex flex-col gap-1.5">
                                     <label className="text-xs font-bold text-slate-600">SSID Mạng Wi-Fi (Tên hoặc MAC)</label>
                                     <input 
                                       type="text" 
                                       placeholder="Ví dụ: CongTy_HQ_5G"
                                       value={setting.config.ssid}
                                       onChange={(e) => updateSettingConfig('wifi', 'ssid', e.target.value)}
                                       className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full font-medium"
                                     />
                                  </div>
                               )}
                               {setting.method === 'face' && (
                                  <div className="flex flex-col gap-1.5">
                                     <label className="text-xs font-bold text-slate-600">Ngưỡng khớp khuôn mặt (0.1 - 1.0)</label>
                                     <input 
                                       type="number" 
                                       step="0.1"
                                       min="0.1"
                                       max="1.0"
                                       value={setting.config.minMatch}
                                       onChange={(e) => updateSettingConfig('face', 'minMatch', Number(e.target.value))}
                                       className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full font-mono font-medium"
                                     />
                                     <p className="text-[10px] text-slate-500 mt-1">* 0.8 là mức lý tưởng để kích hoạt AI Spoofing Guard.</p>
                                  </div>
                               )}
                               {setting.method === 'qr' && (
                                  <div className="flex flex-col gap-1.5">
                                     <label className="text-xs font-bold text-slate-600">Thời gian làm mới mã (giây)</label>
                                     <input 
                                       type="number" 
                                       value={setting.config.refreshRate}
                                       onChange={(e) => updateSettingConfig('qr', 'refreshRate', Number(e.target.value))}
                                       className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full font-mono font-medium"
                                     />
                                  </div>
                               )}
                               {setting.method === 'device' && (
                                  <div className="flex flex-col gap-1.5">
                                     <label className="text-xs font-bold text-slate-600">IP Thiết bị</label>
                                     <input 
                                       type="text" 
                                       placeholder="Ví dụ: 192.168.1.100"
                                       value={setting.config.ip}
                                       onChange={(e) => updateSettingConfig('device', 'ip', e.target.value)}
                                       className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-full font-mono font-medium"
                                     />
                                     <div className="flex justify-start mt-2">
                                        <button className="bg-slate-900 text-white text-[10px] uppercase tracking-widest font-bold px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-md">Ping Test</button>
                                     </div>
                                  </div>
                               )}
                            </div>
                         )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-[#F3F4F6]">
                      {activeTab === 'personnel' && (
                        <>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Họ tên & ID</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Phòng ban / Vị trí</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Loại hợp đồng</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Sentiment & Leave</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Ngày tham gia</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái</th>
                    </>
                  )}
                  {activeTab === 'skills' && (
                    <>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nhân sự</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Kỹ năng cốt lõi</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Skill Coverage</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Đề xuất đào tạo</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Action</th>
                    </>
                  )}
                  {activeTab === 'leave' && (
                    <>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nhân viên</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Số ngày nghỉ phép</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Đã sử dụng</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Chờ duyệt</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Trạng thái</th>
                    </>
                  )}
                  {activeTab === 'kpi' && (
                    <>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nhân viên</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Chỉ số KPI</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Mục tiêu</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Hiện tại</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Tiến độ</th>
                    </>
                  )}
                  {activeTab === 'sentiment' && (
                    <>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nhân viên</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Cảm xúc gần đây</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Phân tích AI</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Gợi ý</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Hành động</th>
                    </>
                  )}
                  {(activeTab === 'attendance' || activeTab === 'payroll') && (
                     <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest" colSpan={5}>
                        {activeTab === 'attendance' ? 'Dữ liệu chấm công GPS' : 'Danh sách lương tháng'}
                     </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {activeTab === 'personnel' && MOCK_EMPLOYEES.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                       <p className="text-sm font-bold text-[#111827]">{emp.fullName}</p>
                       <p className="text-[10px] text-[#6B7280] font-mono font-bold uppercase tracking-tight opacity-50">{emp.id}</p>
                    </td>
                    <td className="px-6 py-5">
                       <p className="text-xs font-bold text-[#111827] tracking-tight">{emp.department}</p>
                       <p className="text-[10px] text-[#6B7280] uppercase opacity-70 font-medium">{emp.position}</p>
                    </td>
                    <td className="px-6 py-5 font-mono">
                       <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg uppercase">
                         {emp.employeeType.replace('_', ' ')}
                       </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1 text-xs">
                        <div className="flex items-center gap-1.5 font-bold">
                          {emp.recentSentiment === 'positive' && <span className="text-emerald-500 flex items-center gap-1"><Smile className="w-3.5 h-3.5"/> Good</span>}
                          {emp.recentSentiment === 'neutral' && <span className="text-slate-500 flex items-center gap-1"><MoreVertical className="w-3.5 h-3.5"/> OK</span>}
                          {emp.recentSentiment === 'critical' && <span className="text-red-500 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/> High Risk</span>}
                        </div>
                        {emp.leaveBalance && (
                          <p className="text-[10px] text-[#6B7280] mt-1">Leaves: <span className={cn("font-bold text-[#111827]", emp.leaveBalance.total - emp.leaveBalance.used <= 2 && "text-red-600")}>{emp.leaveBalance.total - emp.leaveBalance.used} left</span></p>
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
                  </tr>
                ))}
                {activeTab === 'skills' && MOCK_EMPLOYEES.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5 font-bold text-sm text-[#111827]">{emp.fullName}</td>
                    <td className="px-6 py-5">
                       <div className="flex gap-2">
                          {emp.skills?.map((s, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-lg border border-blue-100">
                               {s.name}
                            </span>
                          ))}
                       </div>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex flex-col items-center gap-1">
                          <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-blue-500" style={{ width: `${(emp.skills?.[0]?.level || 50)}%` }} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-400">{(emp.skills?.[0]?.level || 50)}% Mastered</span>
                       </div>
                    </td>
                    <td className="px-6 py-5 text-[10px] font-bold text-emerald-600 italic">
                       AI Suggested: Advanced Analytics
                    </td>
                    <td className="px-6 py-5 text-right">
                       <button className="px-4 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-bold hover:bg-slate-800 transition-all uppercase tracking-widest shadow-md">Đề cử Training</button>
                    </td>
                  </tr>
                ))}
                {activeTab === 'payroll' && MOCK_PAYROLL.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                       <p className="text-sm font-bold text-[#111827]">{pay.employeeName}</p>
                       <p className="text-[10px] text-[#6B7280] uppercase tracking-widest font-bold opacity-40">Kỳ lương: {pay.month}</p>
                    </td>
                    <td className="px-6 py-5 text-right font-mono font-bold text-xs">{formatCurrency(pay.baseSalary)}</td>
                    <td className="px-6 py-5 text-right">
                       <p className="text-xs font-bold text-emerald-600">+{formatCurrency(pay.allowance + pay.bonus)}</p>
                    </td>
                    <td className="px-6 py-5 text-right text-xs text-red-500 font-bold">-{formatCurrency(pay.pitAmount + pay.insuranceAmount)}</td>
                    <td className="px-6 py-5 text-right">
                       <p className="text-sm font-bold text-[#2563EB]">{formatCurrency(pay.netSalary)}</p>
                    </td>
                    <td className="px-6 py-5">
                       <div className="flex justify-center">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold shadow-sm",
                            pay.status === 'paid' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          )}>
                             {pay.status === 'paid' ? 'ĐÃ PHÁT LƯƠNG' : 'CHỜ DUYỆT CHI'}
                          </span>
                       </div>
                    </td>
                  </tr>
                ))}
                {activeTab === 'leave' && MOCK_EMPLOYEES.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <p className="text-sm font-bold text-[#111827]">{emp.fullName}</p>
                      <p className="text-[10px] text-[#6B7280] font-mono font-bold uppercase tracking-tight opacity-50">{emp.id}</p>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-bold text-[#111827]">{emp.leaveBalance?.total ?? 0}</span>
                      <span className="text-[10px] text-slate-400 ml-1">ngày</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-bold text-emerald-600">{emp.leaveBalance?.used ?? 0}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="text-sm font-bold text-amber-600">{emp.leaveBalance?.pending ?? 0}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex justify-end">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase inline-flex items-center gap-1.5",
                            (emp.leaveBalance?.total ?? 0) - (emp.leaveBalance?.used ?? 0) <= 2 ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"
                          )}>
                             {(emp.leaveBalance?.total ?? 0) - (emp.leaveBalance?.used ?? 0) <= 2 ? <AlertCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                             {(emp.leaveBalance?.total ?? 0) - (emp.leaveBalance?.used ?? 0) <= 2 ? 'SẮP HẾT PHÉP' : 'AN TOÀN'}
                          </span>
                       </div>
                    </td>
                  </tr>
                ))}
                {activeTab === 'kpi' && MOCK_KPIs.map(kpi => {
                  const emp = MOCK_EMPLOYEES.find(e => e.id === kpi.employeeId);
                  const progress = (kpi.current / kpi.target) * 100;
                  return (
                    <tr key={kpi.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-[#111827]">{emp?.fullName ?? 'Unknown'}</p>
                        <p className="text-[10px] text-[#6B7280] font-mono font-bold uppercase tracking-tight opacity-50">{kpi.employeeId}</p>
                      </td>
                      <td className="px-6 py-5">
                        <p className="text-xs font-bold text-[#111827]">{kpi.title}</p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">Kỳ đánh giá: {kpi.period}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-sm font-bold text-slate-600">{kpi.target.toLocaleString()} {kpi.unit}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={cn("text-sm font-bold", progress >= 100 ? "text-emerald-600" : "text-blue-600")}>{kpi.current.toLocaleString()} {kpi.unit}</span>
                      </td>
                      <td className="px-6 py-5 text-right w-48">
                         <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                               <span className={cn(progress >= 100 ? "text-emerald-600" : "text-blue-600")}>{progress.toFixed(1)}%</span>
                               <span className="text-slate-400">{progress >= 100 ? 'Đạt' : 'Đang xử lý'}</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                               <div className={cn("h-full rounded-full transition-all duration-1000", progress >= 100 ? "bg-emerald-500" : "bg-blue-500")} style={{ width: `${Math.min(progress, 100)}%` }} />
                            </div>
                         </div>
                      </td>
                    </tr>
                  );
                })}
                {activeTab === 'sentiment' && MOCK_EMPLOYEES.map(emp => (
                   <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                        <p className="text-sm font-bold text-[#111827]">{emp.fullName}</p>
                        <p className="text-[10px] text-[#6B7280] font-mono font-bold uppercase tracking-tight opacity-50">{emp.id}</p>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-1.5 font-bold">
                          {emp.recentSentiment === 'positive' && <span className="text-emerald-500 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-xl"><Smile className="w-4 h-4"/> Good</span>}
                          {emp.recentSentiment === 'neutral' && <span className="text-slate-500 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-xl"><MoreVertical className="w-4 h-4"/> Neutral</span>}
                          {emp.recentSentiment === 'critical' && <span className="text-red-500 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-xl"><AlertCircle className="w-4 h-4"/> Critical Risk</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed max-w-[200px] mx-auto text-left">
                          {emp.recentSentiment === 'critical' ? 'Dấu hiệu burn-out, thường xuyên OT trong 2 tuần qua.' : 'Cảm xúc ổn định, tương tác tốt tại nơi làm.'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                         <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl max-w-[150px]">
                            {emp.recentSentiment === 'critical' ? 'Đề nghị nghỉ dưỡng / 1-1 meeting' : 'Không có đề xuất'}
                         </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all shadow-sm">Lên lịch 1-on-1</button>
                      </td>
                   </tr>
                ))}
              </tbody>
            </table>
          )}
          </div>
          </>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center">
             <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                <Rocket className="w-10 h-10 text-blue-500" />
             </div>
             <h3 className="text-xl font-bold text-slate-800 mb-2">Phân hệ đang được phát triển</h3>
             <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                Tính năng này đang trong quá trình hoàn thiện và sẽ sớm được ra mắt trong bản cập nhật HRM tiếp theo.
             </p>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
