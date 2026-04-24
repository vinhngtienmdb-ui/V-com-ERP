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
  ArrowRight,
  BrainCircuit,
  PieChart as LucidePieChart,
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
  Video,
  Sparkles,
  Wifi,
  QrCode,
  ScanFace,
  Cpu,
  Fingerprint,
  Globe,
  Lock,
  Smartphone,
  Plus,
  PlusCircle,
  History,
  Trash2,
  X
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Employee, AttendanceRecord, Payroll, KPI } from '../types/erp';
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';

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

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  {
    id: 'ATT-001',
    employeeId: 'EMP-001',
    date: '2024-03-20',
    checkIn: '08:00',
    checkOut: '17:30',
    status: 'on_time',
    overtimeHours: 0.5,
    location: 'Trụ sở chính (Zone A)',
    method: 'face',
    deviceInfo: 'Face Terminal 01'
  },
  {
    id: 'ATT-002',
    employeeId: 'EMP-002',
    date: '2024-03-20',
    checkIn: '08:15',
    checkOut: '17:00',
    status: 'late',
    overtimeHours: 0,
    location: 'Marketing Office',
    method: 'wifi',
    deviceInfo: 'VComm ERP_Office_5G'
  },
  {
    id: 'ATT-003',
    employeeId: 'EMP-001',
    date: '2024-03-21',
    checkIn: '07:55',
    checkOut: '17:15',
    status: 'on_time',
    overtimeHours: 0,
    location: 'Kho Long Biên',
    method: 'gps',
    deviceInfo: 'GPS App (±5m)'
  },
  {
    id: 'ATT-004',
    employeeId: 'EMP-002',
    date: '2024-03-21',
    checkIn: '08:05',
    checkOut: '18:00',
    status: 'on_time',
    overtimeHours: 1,
    location: 'Trụ sở chính',
    method: 'qr',
    deviceInfo: 'QR Dynamic Scan'
  }
];

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-001',
    fullName: 'Lê Hoàng Minh',
    email: 'minh.lh@vcomm.vn',
    phone: '0901234567',
    department: 'Vận hành Sàn',
    position: 'Quản lý kho',
    joinDate: '2023-01-15',
    employeeType: 'full_time',
    status: 'active',
    contracts: [{ type: 'Hợp đồng lao động xác định thời hạn 1 năm', signDate: '2024-01-15', expiryDate: '2025-01-14' }],
    skills: [{ name: 'Logistics', level: 90 }, { name: 'Leadership', level: 75 }],
    leaveBalance: { total: 12, used: 4, pending: 1 },
    recentSentiment: 'positive'
  },
  {
    id: 'EMP-002',
    fullName: 'Nguyễn Diệu Nhi',
    email: 'nhi.nd@vcomm.vn',
    phone: '0987123456',
    department: 'Marketing',
    position: 'KOL Specialist',
    joinDate: '2023-06-01',
    employeeType: 'full_time',
    status: 'active',
    contracts: [{ type: 'Hợp đồng lao động xác định thời hạn 1 năm', signDate: '2023-06-01', expiryDate: '2024-05-31' }],
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
  { month: 'T1', attrition: 2.1, hiring: 15, late: 45, absent: 12 },
  { month: 'T2', attrition: 1.8, hiring: 12, late: 38, absent: 8 },
  { month: 'T3', attrition: 2.4, hiring: 20, late: 52, absent: 15 },
  { month: 'T4', attrition: 1.5, hiring: 8, late: 30, absent: 5 },
  { month: 'T5', attrition: 1.9, hiring: 18, late: 40, absent: 10 },
  { month: 'T6', attrition: 1.2, hiring: 25, late: 25, absent: 4 },
];

// --- ATTENDANCE INSTALLATION SETTINGS ---
export type AttendanceSetting = {
  method: 'gps' | 'wifi' | 'face' | 'qr' | 'device';
  enabled: boolean;
  config: Record<string, any>;
};

const INITIAL_ATTENDANCE_SETTINGS: AttendanceSetting[] = [
  { 
    method: 'gps', 
    enabled: true, 
    config: { 
      radius: 100,
      zones: [
        { name: 'Trụ sở chính', lat: 21.0285, lng: 105.8542, radius: 100 },
        { name: 'Kho Long Biên', lat: 21.0385, lng: 105.8942, radius: 200 }
      ]
    } 
  },
  { 
    method: 'wifi', 
    enabled: false, 
    config: { 
      ssids: ['VComm ERP_Office_5G', 'VComm ERP_Warehouse'],
      macRestricted: true 
    } 
  },
  { 
    method: 'face', 
    enabled: true, 
    config: { 
      minMatch: 0.8,
      livenessCheck: true,
      antiSpoofing: true,
      autoCapture: true
    } 
  },
  { 
    method: 'qr', 
    enabled: true, 
    config: { 
      refreshRate: 30,
      encryption: 'AES-256',
      dynamicSalt: true
    } 
  },
  { 
    method: 'device', 
    enabled: true, 
    config: { 
      ip: '192.168.1.200',
      port: 4370,
      model: 'ZKTeco K40',
      syncInterval: 15
    } 
  },
];

// --- ATS & RECRUITMENT MOCK DATA ---
export type Candidate = {
  id: string;
  name: string;
  role: string;
  status: 'sourced' | 'interview' | 'offered' | 'hired';
  matchScore: number;
};

const INITIAL_CANDIDATES: Candidate[] = [
  { id: 'C-001', name: 'Nguyễn Văn A', role: 'Frontend Dev', status: 'sourced', matchScore: 85 },
  { id: 'C-002', name: 'Trần Thị B', role: 'UX Designer', status: 'interview', matchScore: 92 },
  { id: 'C-003', name: 'Lê C', role: 'Product Manager', status: 'offered', matchScore: 98 },
  { id: 'C-004', name: 'Hoàng D', role: 'Backend Dev', status: 'sourced', matchScore: 78 },
  { id: 'C-005', name: 'Phạm E', role: 'Marketing Lead', status: 'interview', matchScore: 88 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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

  // New features state
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [draggedCandidateId, setDraggedCandidateId] = useState<string | null>(null);
  
  // ATS Modal state
  const [showATSModal, setShowATSModal] = useState(false);
  const [activeATSView, setActiveATSView] = useState<'request' | 'candidates' | 'interview' | 'email'>('candidates');
  
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotMessages, setCopilotMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Xin chào! Tôi là AI Copilot hỗ trợ nhân sự. Bạn muốn tôi phân tích dữ liệu, xuất báo cáo hay tìm kiếm nhân viên có kỹ năng cụ thể?' }
  ]);
  const [copilotInput, setCopilotInput] = useState('');

  const [searchEmployee, setSearchEmployee] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterPosition, setFilterPosition] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const [filterDateAtt, setFilterDateAtt] = useState('');
  const [attendanceView, setAttendanceView] = useState<'week' | 'month'>('month');

  const filteredEmployees = MOCK_EMPLOYEES.filter(emp => {
    if (searchEmployee && !emp.fullName.toLowerCase().includes(searchEmployee.toLowerCase()) && !emp.id.toLowerCase().includes(searchEmployee.toLowerCase())) return false;
    if (filterDept !== 'all' && emp.department !== filterDept) return false;
    if (filterPosition !== 'all' && emp.position !== filterPosition) return false;
    if (filterStatus !== 'all' && emp.status !== filterStatus) return false;
    return true;
  });

  const filteredAttendance = MOCK_ATTENDANCE.filter(att => {
    if (filterDateAtt && !att.date.startsWith(filterDateAtt)) return false;
    return true;
  });

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedCandidateId(id);
    // Needed for Firefox
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: Candidate['status']) => {
    e.preventDefault();
    if (draggedCandidateId) {
      setCandidates(prev => 
        prev.map(c => c.id === draggedCandidateId ? { ...c, status } : c)
      );
    }
    setDraggedCandidateId(null);
  };

  const handleSendCopilotMessage = () => {
    if (!copilotInput.trim()) return;
    setCopilotMessages(prev => [...prev, { role: 'user', content: copilotInput }]);
    
    // Simulate AI thinking and replying
    setTimeout(() => {
      setCopilotMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Dựa trên dữ liệu hiện tại, tôi đã nhận yêu cầu của bạn về: "${copilotInput}". Đang cập nhật báo cáo và đánh giá kỹ năng liên quan.` 
      }]);
    }, 1000);
    setCopilotInput('');
  };

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
          <button 
            onClick={() => setActiveTab('rec_candidates')}
            className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
          >
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
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
             <div className="h-72 w-full space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Tỷ lệ Tuyển dụng & Nghỉ việc</h4>
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
             <div className="h-72 w-full space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center">Biểu đồ Vi phạm Chấm công</h4>
                <ResponsiveContainer width="100%" height="100%">
                   <RechartsLineChart data={HR_METRICS_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                     <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                     <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
                     <Tooltip 
                       contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' }}
                     />
                     <Line type="monotone" dataKey="late" name="Đi muộn" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4, fill: '#F59E0B', strokeWidth: 2, stroke: '#fff' }} />
                     <Line type="monotone" dataKey="absent" name="Vắng mặt" stroke="#EF4444" strokeWidth={3} dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }} />
                   </RechartsLineChart>
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
              <div key={gIdx} className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
                  <h2 className="text-xl font-bold text-[#111827]">{group.title}</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {group.items.map(item => (
                      <button 
                         key={item.id}
                         onClick={() => {
                            if (['rec_request', 'rec_candidates', 'rec_interview', 'rec_email'].includes(item.id)) {
                               setActiveATSView(item.id === 'rec_request' ? 'request' : item.id === 'rec_candidates' ? 'candidates' : item.id === 'rec_interview' ? 'interview' : 'email');
                               setShowATSModal(true);
                            } else {
                               setActiveTab(item.id);
                            }
                         }}
                         className="bg-slate-50 border border-slate-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-md hover:bg-white transition-all text-left flex gap-4 items-start group"
                      >
                         <div className={cn("p-3 rounded-lg shrink-0 transition-transform group-hover:scale-105", getColorClasses(item.color))}>
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
             <div className="bg-white p-10 border border-[#E5E7EB] rounded-lg shadow-sm space-y-8 relative overflow-hidden group">
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
                <LucidePieChart className="absolute -bottom-12 -right-12 w-48 h-48 text-slate-50 group-hover:scale-110 transition-transform duration-700" />
             </div>

             <div className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] p-10 rounded-lg text-white relative overflow-hidden shadow-2xl flex flex-col justify-between">
                <div className="relative z-10 space-y-4">
                   <div className="flex items-center gap-4">
                      <div className="p-4 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
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
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent pointer-events-none rounded-lg" />
             <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
                <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
                   <MapPin className="w-4 h-4 text-[#2563EB]" /> Live Map Chấm công Giao hàng
                </h3>
                <div className="h-48 bg-slate-50 rounded-lg border border-[#F3F4F6] relative overflow-hidden flex items-center justify-center">
                   <div className="text-center space-y-2 opacity-40">
                      <MapPin className="w-8 h-8 mx-auto" />
                      <p className="text-xs font-medium">Bản đồ GPS đang hoạt động (Mock)</p>
                   </div>
                   <div className="absolute top-10 left-20 w-3 h-3 bg-blue-500 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
                   <div className="absolute top-20 right-32 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <p className="text-[10px] text-[#6B7280] mt-3">Tích hợp GPS App để chấm công tự động cho nhân viên vận chuyển và Sale hiện trường khi vào vùng kho/cửa hàng.</p>
             </div>
             <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-8 rounded-lg flex flex-col justify-between">
                <div>
                   <h3 className="text-xl font-bold italic mb-2">Dynamic Salary Engine</h3>
                   <p className="text-slate-400 text-sm leading-relaxed">Cấu hình công thức tính lương động theo từng vị trí (Kinh doanh: Lương cứng + % Hoa hồng; Kho: Lương theo sản lượng). Tự động kết nối dữ liệu từ module Seller & Đơn hàng để tính thưởng nóng.</p>
                </div>
                <div className="pt-6">
                   <button className="w-full bg-white text-slate-900 font-bold py-3 rounded-lg text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
                      <Briefcase className="w-4 h-4" /> Cấu hình công thức tính lương
                   </button>
                </div>
             </div>
          </div>
        </>
      )}

      {activeTab !== 'overview' && (
      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
        <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
           <button 
             onClick={() => setActiveTab('overview')} 
             className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 px-4 py-2 rounded-lg w-fit shadow-sm"
           >
              <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
           </button>
        </div>
        
        {['personnel', 'skills', 'attendance', 'leave', 'kpi', 'sentiment', 'attendance_config'].includes(activeTab) ? (
          <>
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
                        className="bg-slate-50 border border-slate-200 rounded-lg px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-64 transition-all" 
                      />
                    </div>
                    {activeTab === 'personnel' && (
                      <div className="flex gap-2">
                        <select 
                          value={filterDept}
                          onChange={(e) => setFilterDept(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="all">Tất cả Phòng ban</option>
                          <option value="Marketing">Marketing</option>
                          <option value="Vận hành Sàn">Vận hành Sàn</option>
                        </select>
                        <select 
                          value={filterPosition}
                          onChange={(e) => setFilterPosition(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="all">Tất cả Chức danh</option>
                          <option value="Quản lý kho">Quản lý kho</option>
                          <option value="KOL Specialist">KOL Specialist</option>
                        </select>
                        <select 
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        >
                          <option value="all">Tất cả Trạng thái làm việc</option>
                          <option value="active">Đang làm việc</option>
                          <option value="inactive">Đã nghỉ việc</option>
                        </select>
                      </div>
                    )}
                    {activeTab === 'attendance' && (
                       <div className="flex gap-2 items-center">
                         <div className="flex bg-slate-100 p-1 rounded-lg">
                           <button 
                             onClick={() => setAttendanceView('week')}
                             className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-colors", attendanceView === 'week' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                           >
                             Theo Tuần
                           </button>
                           <button 
                             onClick={() => setAttendanceView('month')}
                             className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-colors", attendanceView === 'month' ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                           >
                             Theo Tháng
                           </button>
                         </div>
                         <input
                           type={attendanceView === 'month' ? "month" : "week"}
                           value={filterDateAtt}
                           onChange={(e) => setFilterDateAtt(e.target.value)}
                           className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                         />
                       </div>
                    )}
                 </div>
                 {activeTab === 'attendance_config' ? (
                   <div className="flex gap-3">
                      <button className="bg-white border border-slate-200 px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2">
                         <History className="w-4 h-4" /> Nhật ký thay đổi
                      </button>
                   </div>
                 ) : (
                   <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 w-max">
                      <PlusCircle className="w-4 h-4" /> Thêm mới
                   </button>
                 )}
               </div>
             </div>
            
            <div className="flex-1 overflow-auto">
               {activeTab === 'attendance_config' ? (
                 <div className="p-8 space-y-8 bg-slate-50/30">
                   <div className="flex justify-between items-center">
                     <div className="space-y-1">
                       <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900"><Settings className="w-6 h-6 text-blue-600"/> Cấu hình Hệ thống Chấm công</h2>
                       <p className="text-sm text-slate-500 font-medium">Thiết lập các phương thức và quy tắc xác thực chấm công cho toàn doanh nghiệp.</p>
                     </div>
                   </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
                    {attendanceSettings.map(setting => (
                      <div key={setting.method} className={cn(
                        "bg-white rounded-lg border transition-all duration-300 shadow-sm overflow-hidden flex flex-col group",
                        setting.enabled ? "border-blue-200 ring-1 ring-blue-50/50" : "border-slate-200 opacity-80"
                      )}>
                         <div className="p-6 flex justify-between items-start border-b border-slate-50">
                             <div className="flex gap-4">
                                <div className={cn(
                                  "w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
                                  setting.enabled ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-slate-100 text-slate-400"
                                )}>
                                   {setting.method === 'gps' && <MapPin className="w-6 h-6" />}
                                   {setting.method === 'wifi' && <Wifi className="w-6 h-6" />}
                                   {setting.method === 'face' && <ScanFace className="w-6 h-6" />}
                                   {setting.method === 'qr' && <QrCode className="w-6 h-6" />}
                                   {setting.method === 'device' && <Fingerprint className="w-6 h-6" />}
                                </div>
                                <div>
                                   <div className="flex items-center gap-2">
                                      <p className="font-bold text-slate-900 text-lg">{
                                         setting.method === 'gps' ? 'Chấm công GPS (Địa điểm)' :
                                         setting.method === 'wifi' ? 'Chấm công qua mạng Wi-Fi' :
                                         setting.method === 'face' ? 'Chấm công Face ID (AI)' :
                                         setting.method === 'qr' ? 'Chấm công QR Code động' :
                                         'Máy chấm công Vân tay/Thẻ'
                                      }</p>
                                      {setting.enabled && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                                   </div>
                                   <p className="text-slate-500 text-xs font-medium uppercase tracking-wider mt-0.5">Protocol: {setting.method}</p>
                                </div>
                             </div>
                             <div className="flex flex-col items-end gap-2">
                                <button
                                  onClick={() => toggleAttendanceSetting(setting.method)}
                                  className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                    setting.enabled ? "bg-blue-600" : "bg-slate-200"
                                  )}
                                >
                                   <span className={cn(
                                     "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
                                     setting.enabled ? "translate-x-6" : "translate-x-1"
                                   )} />
                                </button>
                                <span className={cn("text-[10px] font-bold uppercase", setting.enabled ? "text-blue-600" : "text-slate-400")}>
                                   {setting.enabled ? 'Đang bật' : 'Đã tắt'}
                                </span>
                             </div>
                         </div>
                         
                         <div className="p-6 bg-slate-50/30 flex-1">
                            {setting.enabled ? (
                               <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                  {setting.method === 'gps' && (
                                     <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                           <div className="space-y-1.5">
                                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Bán kính mặc định (m)</label>
                                              <div className="relative">
                                                 <input 
                                                   type="number" 
                                                   value={setting.config.radius}
                                                   onChange={(e) => updateSettingConfig('gps', 'radius', Number(e.target.value))}
                                                   className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                                 />
                                                 <Timer className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                              </div>
                                           </div>
                                           <div className="space-y-1.5">
                                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số lượng Vùng</label>
                                              <div className="px-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-blue-600 flex justify-between items-center">
                                                 {setting.config.zones?.length || 0} Vùng an toàn
                                                 <button className="text-blue-500 hover:scale-110 transition-transform"><PlusCircle className="w-4 h-4" /></button>
                                              </div>
                                           </div>
                                        </div>
                                        <div className="space-y-2">
                                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Danh sách Vùng an toàn</label>
                                           <div className="space-y-2">
                                              {setting.config.zones?.map((zone: any, i: number) => (
                                                 <div key={i} className="bg-white border border-slate-200 p-3 rounded-lg flex justify-between items-center group/item hover:border-blue-300 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                       <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500"><MapPin className="w-4 h-4" /></div>
                                                       <div>
                                                          <p className="text-xs font-bold text-slate-800">{zone.name}</p>
                                                          <p className="text-[10px] text-slate-500 font-mono italic">{zone.lat}, {zone.lng} (±{zone.radius}m)</p>
                                                       </div>
                                                    </div>
                                                    <button className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                                 </div>
                                              ))}
                                           </div>
                                        </div>
                                     </div>
                                  )}
                                  {setting.method === 'wifi' && (
                                     <div className="space-y-4">
                                        <div className="space-y-1.5">
                                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Danh sách Wi-Fi Tin cậy</label>
                                           <div className="flex flex-wrap gap-2">
                                              {setting.config.ssids?.map((ssid: string, i: number) => (
                                                 <div key={i} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-100 text-xs font-bold">
                                                    <Wifi className="w-3 h-3" />
                                                    {ssid}
                                                    <button className="hover:text-blue-900 ml-1">×</button>
                                                 </div>
                                              ))}
                                              <button className="flex items-center gap-2 border border-dashed border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all">
                                                 <Plus className="w-3 h-3" /> Thêm mạng
                                              </button>
                                           </div>
                                        </div>
                                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
                                           <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                                           <p className="text-[11px] text-amber-800 leading-relaxed font-bold uppercase tracking-tight">Cảnh báo: Luôn kích hoạt "MAC Restricted" để tránh nhân viên fake SSID thủ công.</p>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
                                           <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500"><Lock className="w-4 h-4" /></div>
                                              <div>
                                                 <p className="text-xs font-bold text-slate-800">Xác thực qua MAC Address</p>
                                                 <p className="text-[10px] text-slate-500 font-medium">Bảo mật cao nhất cho môi trường văn phòng.</p>
                                              </div>
                                           </div>
                                           <input type="checkbox" defaultChecked={setting.config.macRestricted} className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
                                        </div>
                                     </div>
                                  )}
                                  {setting.method === 'face' && (
                                     <div className="space-y-4">
                                        <div className="space-y-1.5">
                                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Độ chính xác yêu cầu (0.8 - 0.99)</label>
                                           <div className="flex items-center gap-4">
                                              <input 
                                                type="range" 
                                                min="0.5" 
                                                max="0.99" 
                                                step="0.01"
                                                value={setting.config.minMatch}
                                                onChange={(e) => updateSettingConfig('face', 'minMatch', Number(e.target.value))}
                                                className="flex-1 accent-blue-600"
                                              />
                                              <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{setting.config.minMatch}</span>
                                           </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2">
                                           {[
                                              { id: 'livenessCheck', label: 'Bật Liveness Check (Chống ảnh giả/Video)', icon: Globe },
                                              { id: 'antiSpoofing', label: 'AI Anti-Spoofing Guard', icon: ShieldCheck },
                                              { id: 'autoCapture', label: 'Tự động chụp khi phát hiện gương mặt', icon: Video }
                                           ].map(feat => (
                                              <label key={feat.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                                                 <div className="flex items-center gap-3">
                                                    <feat.icon className="w-4 h-4 text-blue-500" />
                                                    <span className="text-xs font-bold text-slate-700">{feat.label}</span>
                                                 </div>
                                                 <input 
                                                   type="checkbox" 
                                                   checked={!!setting.config[feat.id]} 
                                                   onChange={(e) => updateSettingConfig('face', feat.id, e.target.checked)}
                                                   className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                                                 />
                                              </label>
                                           ))}
                                        </div>
                                     </div>
                                  )}
                                  {setting.method === 'qr' && (
                                     <div className="space-y-4">
                                        <div className="space-y-1.5">
                                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Thời gian làm mới mã (giây)</label>
                                           <div className="relative">
                                              <input 
                                                type="number" 
                                                value={setting.config.refreshRate}
                                                onChange={(e) => updateSettingConfig('qr', 'refreshRate', Number(e.target.value))}
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                              />
                                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">GIÂY</span>
                                           </div>
                                        </div>
                                        <div className="p-4 bg-indigo-900/5 border border-indigo-100 rounded-lg space-y-3">
                                           <h5 className="text-[10px] font-bold text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                                              <Lock className="w-3 h-3" /> Bảo mật & Mã hóa
                                           </h5>
                                           <div className="flex justify-between items-center">
                                              <span className="text-xs font-medium text-slate-700">Thuật toán mã hóa</span>
                                              <span className="text-xs font-bold text-indigo-600 px-2 py-1 bg-white border border-indigo-100 rounded-lg">{setting.config.encryption}</span>
                                           </div>
                                           <label className="flex items-center gap-3">
                                              <input 
                                                type="checkbox" 
                                                checked={setting.config.dynamicSalt}
                                                onChange={(e) => updateSettingConfig('qr', 'dynamicSalt', e.target.checked)}
                                                className="w-4 h-4 rounded border-slate-300 text-indigo-600" 
                                              />
                                              <span className="text-xs font-medium text-slate-700">Sử dụng Mobile-ID as Dynamic Salt</span>
                                           </label>
                                        </div>
                                     </div>
                                  )}
                                  {setting.method === 'device' && (
                                     <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                           <div className="space-y-1.5">
                                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Địa chỉ IP thiết bị</label>
                                              <input 
                                                type="text" 
                                                placeholder="192.168.1.xxx"
                                                value={setting.config.ip}
                                                onChange={(e) => updateSettingConfig('device', 'ip', e.target.value)}
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                              />
                                           </div>
                                           <div className="space-y-1.5">
                                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cổng kết nối (Port)</label>
                                              <input 
                                                type="number" 
                                                value={setting.config.port}
                                                onChange={(e) => updateSettingConfig('device', 'port', Number(e.target.value))}
                                                className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                                              />
                                           </div>
                                        </div>
                                        <div className="space-y-1.5">
                                           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Model thiết bị & Giao thức</label>
                                           <select 
                                             value={setting.config.model}
                                             onChange={(e) => updateSettingConfig('device', 'model', e.target.value)}
                                             className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none bg-white font-bold"
                                           >
                                              <option>ZKTeco K40 (Standalone)</option>
                                              <option>Ronald Jack F18 (TCP/IP)</option>
                                              <option>Hikvision Face Terminal (Web SDK)</option>
                                              <option>Khác (Generic ADMS)</option>
                                           </select>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg">
                                           <div className="space-y-0.5">
                                              <p className="text-xs font-bold text-slate-800">Khoảng cách đồng bộ</p>
                                              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Sync every {setting.config.syncInterval} minutes</p>
                                           </div>
                                           <div className="flex gap-2">
                                              <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">Ping test</button>
                                              <button className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all border border-blue-100"><Zap className="w-4 h-4 fill-current" /></button>
                                           </div>
                                        </div>
                                     </div>
                                  )}
                               </div>
                            ) : (
                               <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-8 space-y-3">
                                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                                     <Lock className="w-6 h-6" />
                                  </div>
                                  <div>
                                     <p className="text-sm font-bold text-slate-400">Phương thức này đang tắt</p>
                                     <p className="text-xs text-slate-300 mt-1">Bật switch để cấu hình chi tiết cho hệ thống.</p>
                                  </div>
                               </div>
                            )}
                         </div>

                         <div className="p-4 border-t border-slate-50 flex justify-between items-center bg-white px-6">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Last Update: 2 mins ago</span>
                            <button className={cn(
                              "text-xs font-bold transition-all flex items-center gap-2",
                              setting.enabled ? "text-blue-600 hover:text-blue-800" : "text-slate-300 cursor-not-allowed"
                            )}>
                               Xem tài liệu API <ArrowRight className="w-3 h-3" />
                            </button>
                         </div>
                      </div>
                    ))}
                  </div>

                  <div className="bg-indigo-900 text-white p-8 rounded-lg shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
                     <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-4">
                           <div className="p-4 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20">
                              <Sparkles className="w-8 h-8 text-blue-300" />
                           </div>
                           <div>
                              <h3 className="text-2xl font-extrabold tracking-tight">AI Smart-Sync Optimizer</h3>
                              <p className="text-blue-200/60 text-xs font-bold uppercase tracking-widest">Enterprise Edition features</p>
                           </div>
                        </div>
                        <p className="text-blue-100 text-sm leading-relaxed max-w-lg">
                           Kích hoạt AI để tự động phát hiện các hành vi chấm công bất thường (Buddy Punching), tối ưu hóa luồng dữ liệu từ máy chấm công vân tay và tự động gợi ý lịch trình làm việc dựa trên dữ liệu lịch sử.
                        </p>
                     </div>
                     <div className="relative z-10 w-full md:w-auto">
                        <button className="w-full px-8 py-4 bg-white text-indigo-900 font-bold rounded-lg text-sm hover:translate-y-[-2px] transition-all uppercase tracking-widest shadow-xl">Kích hoạt AI Optimizer</button>
                     </div>
                     <Layers className="absolute -bottom-24 -right-12 w-64 h-64 text-white/5 rotate-12" />
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
                  {activeTab === 'attendance' && (
                    <>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nhân viên & Ngày</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Giờ vào/ra</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Phương thức & Thiết bị</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Vị trí xác thực</th>
                      <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Trạng thái</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {activeTab === 'personnel' && filteredEmployees.map((emp) => (
                  <tr key={emp.id} onClick={() => setSelectedEmployee(emp)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                    <td className="px-6 py-5">
                       <p className="text-sm font-bold text-[#111827] group-hover:text-blue-600 transition-colors">{emp.fullName}</p>
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
                       <button className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all uppercase tracking-widest shadow-md">Đề cử Training</button>
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
                          {emp.recentSentiment === 'positive' && <span className="text-emerald-500 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg"><Smile className="w-4 h-4"/> Good</span>}
                          {emp.recentSentiment === 'neutral' && <span className="text-slate-500 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg"><MoreVertical className="w-4 h-4"/> Neutral</span>}
                          {emp.recentSentiment === 'critical' && <span className="text-red-500 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg"><AlertCircle className="w-4 h-4"/> Critical Risk</span>}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <p className="text-[10px] font-medium text-slate-500 leading-relaxed max-w-[200px] mx-auto text-left">
                          {emp.recentSentiment === 'critical' ? 'Dấu hiệu burn-out, thường xuyên OT trong 2 tuần qua.' : 'Cảm xúc ổn định, tương tác tốt tại nơi làm.'}
                        </p>
                      </td>
                      <td className="px-6 py-5">
                         <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg max-w-[150px]">
                            {emp.recentSentiment === 'critical' ? 'Đề nghị nghỉ dưỡng / 1-1 meeting' : 'Không có đề xuất'}
                         </p>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <button className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all shadow-sm">Lên lịch 1-on-1</button>
                      </td>
                   </tr>
                ))}
                {activeTab === 'attendance' && filteredAttendance.map(record => {
                  const emp = MOCK_EMPLOYEES.find(e => e.id === record.employeeId);
                  
                  // Calculate hours
                  const [inH, inM] = record.checkIn.split(':').map(Number);
                  const [outH, outM] = record.checkOut.split(':').map(Number);
                  const totalMinutes = (outH * 60 + outM) - (inH * 60 + inM);
                  const hoursWorked = totalMinutes > 0 ? (totalMinutes / 60).toFixed(1) : parseFloat('0');
                  
                  const hw = Number(hoursWorked);
                  let warning = '';
                  if (hw < 8 && hw > 0) warning = 'Cảnh báo thiếu giờ';
                  else if (record.overtimeHours > 2) warning = 'Cảnh báo OT quá mức';
                  else if (inH >= 9) warning = 'Cảnh báo đi muộn';

                  return (
                    <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-5">
                         <p className="text-sm font-bold text-slate-800">{emp?.fullName ?? 'Hệ thống'}</p>
                         <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{record.date}</p>
                      </td>
                      <td className="px-6 py-5 text-center">
                         <div className="flex flex-col items-center">
                            <span className="text-xs font-bold text-emerald-600">In: {record.checkIn}</span>
                            <span className="text-xs font-bold text-amber-600 mt-0.5">Out: {record.checkOut}</span>
                            <span className="text-[10px] font-bold text-slate-400 mt-1 bg-slate-100 px-2 py-0.5 rounded-full">{hoursWorked} giờ (OT: {record.overtimeHours}h)</span>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                               {record.method === 'gps' && <MapPin className="w-4 h-4" />}
                               {record.method === 'wifi' && <Wifi className="w-4 h-4" />}
                               {record.method === 'face' && <ScanFace className="w-4 h-4" />}
                               {record.method === 'qr' && <QrCode className="w-4 h-4" />}
                               {record.method === 'device' && <Fingerprint className="w-4 h-4" />}
                            </div>
                            <div>
                               <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">{record.method}</p>
                               <p className="text-[10px] text-slate-500">{record.deviceInfo}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <p className="text-xs font-medium text-slate-600">{record.location}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                         <div className="flex flex-col items-end gap-2">
                           <span className={cn(
                             "px-3 py-1 rounded-full text-[10px] font-bold shadow-sm uppercase inline-flex items-center gap-1.5",
                             record.status === 'on_time' ? "bg-emerald-50 text-emerald-600" :
                             record.status === 'late' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                           )}>
                              {record.status === 'on_time' ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              {record.status === 'on_time' ? 'Đúng giờ' : record.status === 'late' ? 'Muộn' : 'Vắng'}
                           </span>
                           {warning && (
                             <span className="text-[9px] bg-rose-100 text-rose-600 font-bold px-2 py-0.5 rounded flex items-center gap-1">
                               <AlertCircle className="w-3 h-3" /> {warning}
                             </span>
                           )}
                         </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          </div>
          </>
        ) : activeTab === 'payroll' ? (
           <div className="p-8 bg-slate-50 min-h-[500px]">
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800"><Wallet className="w-6 h-6 text-blue-600"/> Quản lý Quỹ lương & Payslip</h2>
                    <p className="text-xs text-slate-500 mt-1">Kỳ lương hiển thị: <strong className="text-slate-700">Tháng 03/2024</strong></p>
                 </div>
                 <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        const results = MOCK_EMPLOYEES.map(emp => ({
                          employeeId: emp.id,
                          ...autoCalculatePayroll(emp, [], MOCK_KPIs)
                        }));                
                        console.table(results);                
                        alert("Đã tính lương tự động thành công (Kiểm tra console/table)!");
                      }}
                      className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all hover:bg-indigo-700">
                       <Zap className="w-4 h-4" /> Tính lương AI (Batch)
                    </button>
                    <button className="bg-[#111827] text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-slate-900/20 active:scale-95 transition-all hover:bg-slate-800">
                       <BadgeDollarSign className="w-4 h-4 text-emerald-400" /> Xuất phiếu lương đồng loạt
                    </button>
                 </div>
              </div>

              {/* Payroll Dashboard Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10 mb-1">Tổng lương cơ bản</p>
                    <p className="text-2xl font-bold text-slate-800 relative z-10">{formatCurrency(MOCK_PAYROLL.reduce((acc, pay) => acc + pay.baseSalary, 0))}</p>
                 </div>
                 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10 mb-1">Tổng Phụ cấp & Thưởng</p>
                    <p className="text-2xl font-bold text-emerald-600 relative z-10">+{formatCurrency(MOCK_PAYROLL.reduce((acc, pay) => acc + pay.allowance + pay.bonus, 0))}</p>
                 </div>
                 <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10 mb-1">Thuế TNCN & BH</p>
                    <p className="text-2xl font-bold text-red-500 relative z-10">-{formatCurrency(MOCK_PAYROLL.reduce((acc, pay) => acc + pay.pitAmount + pay.insuranceAmount, 0))}</p>
                 </div>
                 <div className="bg-gradient-to-br from-[#111827] to-slate-800 p-5 rounded-lg border border-slate-700 shadow-xl relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10 mb-1">Tổng chi trả Thực tế (Net Pay)</p>
                    <p className="text-2xl font-bold text-white relative z-10">{formatCurrency(MOCK_PAYROLL.reduce((acc, pay) => acc + pay.netSalary, 0))}</p>
                 </div>
              </div>

              {/* Advanced Payroll Table */}
              <div className="bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50/80 border-b border-slate-100">
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Mã / Tên Nhân viên</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Lương Cơ bản</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Thưởng / Phụ cấp</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Khấu trừ (Thuế, BH)</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Thực lãnh</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">Bảng lương</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {MOCK_PAYROLL.map((pay) => (
                         <tr key={pay.id} className="hover:bg-blue-50/30 transition-colors group">
                           <td className="px-6 py-4">
                              <p className="text-sm font-bold text-slate-800">{pay.employeeName}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5">{pay.employeeId}</p>
                           </td>
                           <td className="px-6 py-4 text-right font-mono font-bold text-sm text-slate-600">{formatCurrency(pay.baseSalary)}</td>
                           <td className="px-6 py-4 text-right">
                              <p className="text-xs font-bold text-emerald-600 font-mono">+{formatCurrency(pay.allowance + pay.bonus)}</p>
                              {pay.bonus > 0 && <span className="text-[9px] font-bold text-emerald-500 opacity-60">Gồm {formatCurrency(pay.bonus)} KPI/OT</span>}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <p className="text-xs font-bold text-red-500 font-mono">-{formatCurrency(pay.pitAmount + pay.insuranceAmount)}</p>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <p className="text-[15px] font-bold text-[#2563EB] font-mono bg-blue-50 px-3 py-1 rounded-lg inline-block">{formatCurrency(pay.netSalary)}</p>
                           </td>
                           <td className="px-6 py-4">
                              <div className="flex justify-center">
                                 <span className={cn(
                                   "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                                   pay.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                 )}>
                                    {pay.status === 'paid' ? 'Đã thanh toán' : 'Chờ duyệt chi'}
                                 </span>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold hover:bg-slate-200 transition-all flex items-center gap-1.5 ml-auto border border-slate-200">
                                 <FileText className="w-3.5 h-3.5" /> Chi tiết
                              </button>
                           </td>
                         </tr>
                       ))}
                       {MOCK_PAYROLL.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                              Không có dữ liệu bảng lương trong kỳ này.
                            </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
                 <div className="bg-slate-50 border-t border-slate-100 p-4 text-xs text-slate-500 font-medium flex justify-between items-center">
                    <p className="flex items-center gap-1.5">
                       <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dữ liệu đã được đồng bộ với module Chấm công & KPI.
                    </p>
                    <p>Tổng số bản ghi: <strong>{MOCK_PAYROLL.length}</strong></p>
                 </div>
              </div>
           </div>
        ) : activeTab === 'rec_candidates' ? (
           <div className="p-6 bg-slate-50 min-h-[500px]">
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold flex items-center gap-2"><UserPlus className="w-6 h-6 text-indigo-600"/> ATS Pipeline</h2>
                 <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-indigo-700 transition">Thêm ứng viên</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                 {(['sourced', 'interview', 'offered', 'hired'] as const).map(status => (
                    <div 
                      key={status} 
                      className="bg-slate-100/50 rounded-lg p-4 border border-slate-200"
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, status)}
                    >
                       <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-slate-700 uppercase tracking-widest text-xs">
                           {status === 'sourced' ? 'Sourced' : status === 'interview' ? 'Phỏng vấn' : status === 'offered' ? 'Đề nghị' : 'Đã tuyển'}
                         </h3>
                         <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-500 shadow-sm">
                           {candidates.filter(c => c.status === status).length}
                         </span>
                       </div>
                       <div className="flex flex-col gap-3 min-h-[150px]">
                          <AnimatePresence>
                             {candidates.filter(c => c.status === status).map(candidate => (
                               <motion.div
                                 layout
                                 initial={{ opacity: 0, scale: 0.9 }}
                                 animate={{ opacity: 1, scale: 1 }}
                                 exit={{ opacity: 0, scale: 0.9 }}
                                 key={candidate.id}
                                 draggable
                                 onDragStart={(e: any) => handleDragStart(e, candidate.id)}
                                 className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative overflow-hidden"
                               >
                                  <div className={cn("absolute top-0 left-0 w-1 h-full", 
                                     candidate.matchScore >= 90 ? "bg-emerald-500" : 
                                     candidate.matchScore >= 80 ? "bg-blue-500" : "bg-amber-500"
                                  )} />
                                  <div className="pl-2">
                                     <div className="flex justify-between items-start mb-2">
                                        <p className="font-bold text-sm text-[#111827]">{candidate.name}</p>
                                        <span className="text-[10px] font-bold text-slate-400 font-mono">{candidate.id}</span>
                                     </div>
                                     <p className="text-xs font-medium text-slate-600 mb-3">{candidate.role}</p>
                                     <div className="flex justify-between items-center">
                                        <div className="flex -space-x-2">
                                           <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-500">HR</div>
                                           <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-indigo-600">AI</div>
                                        </div>
                                        <span className={cn(
                                          "px-2 py-1 rounded-md text-[10px] font-bold",
                                          candidate.matchScore >= 90 ? "bg-emerald-50 text-emerald-600" : 
                                          candidate.matchScore >= 80 ? "bg-blue-50 text-blue-600" : "bg-amber-50 text-amber-600"
                                        )}>
                                          Match: {candidate.matchScore}%
                                        </span>
                                     </div>
                                  </div>
                               </motion.div>
                             ))}
                          </AnimatePresence>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
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

      {/* 360 Employee Slide-out Panel */}
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col overflow-y-auto"
            >
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 sticky top-0 z-10">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">{selectedEmployee.fullName}</h2>
                    <p className="text-xs font-mono font-bold text-slate-400 mt-1 uppercase tracking-widest">{selectedEmployee.id}</p>
                  </div>
                  <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                     <span className="sr-only">Đóng</span>
                     <ArrowLeft className="w-5 h-5 rotate-180" />
                  </button>
               </div>
               
               <div className="p-6 space-y-8 flex-1">
                 {/* Skill Radar */}
                 <div className="space-y-4">
                    <h3 className="font-bold tracking-widest uppercase text-xs text-slate-400 flex items-center gap-2">
                       <BrainCircuit className="w-4 h-4 text-blue-500"/> Skill Matrix (Radar)
                    </h3>
                    <div className="h-64 bg-slate-50 rounded-lg border border-slate-100 p-4 relative">
                       <ResponsiveContainer width="100%" height="100%">
                         <RadarChart cx="50%" cy="50%" outerRadius="70%" data={selectedEmployee.skills || []}>
                           <PolarGrid stroke="#e2e8f0" />
                           <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                           <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                           <Radar name="Kỹ năng" dataKey="level" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                         </RadarChart>
                       </ResponsiveContainer>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                       {selectedEmployee.skills?.map((s, i) => (
                         <div key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 flex items-center justify-between gap-3 text-xs flex-1 min-w-[140px]">
                           <span className="font-bold">{s.name}</span>
                           <span className="font-mono">{s.level}%</span>
                         </div>
                       ))}
                    </div>
                 </div>

                 {/* Contracts */}
                 <div className="space-y-4">
                    <h3 className="font-bold tracking-widest uppercase text-xs text-slate-400 flex items-center gap-2">
                       <FileText className="w-4 h-4 text-purple-500"/> Lịch sử Hợp đồng
                    </h3>
                    <div className="space-y-2">
                       {selectedEmployee.contracts?.map((c, i) => (
                         <div key={i} className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                           <p className="text-xs font-bold text-slate-800 mb-1">{c.type}</p>
                           <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase font-mono">
                              <span>Ký: {c.signDate}</span>
                              <span className="text-blue-500 font-bold">Hết hạn: {c.expiryDate}</span>
                           </div>
                         </div>
                       ))}
                       {(!selectedEmployee.contracts || selectedEmployee.contracts.length === 0) && (
                         <p className="text-xs text-slate-400 italic">Chưa có dữ liệu hợp đồng</p>
                       )}
                    </div>
                 </div>

                 {/* Timeline */}
                 <div className="space-y-4">
                    <h3 className="font-bold tracking-widest uppercase text-xs text-slate-400 flex items-center gap-2">
                       <Clock className="w-4 h-4 text-emerald-500"/> Timeline Công tác
                    </h3>
                    <div className="pl-4 border-l-2 border-slate-100 space-y-6 relative ml-2">
                       <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                          <p className="text-xs font-bold text-slate-800">Cập nhật Lương</p>
                          <p className="text-[10px] text-slate-500 font-medium">Tăng 15% lương cơ bản</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">11/2023</p>
                       </div>
                       <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
                          <p className="text-xs font-bold text-slate-800">Thăng tiến</p>
                          <p className="text-[10px] text-slate-500 font-medium">Lên vị trí: {selectedEmployee.position}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">08/2023</p>
                       </div>
                       <div className="relative">
                          <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
                          <p className="text-xs font-bold text-slate-800">Gia nhập công ty</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{selectedEmployee.joinDate}</p>
                       </div>
                    </div>
                 </div>

                 {/* AI Insight */}
                 <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100/50 rounded-lg relative overflow-hidden">
                    <div className="relative z-10">
                       <h3 className="font-bold tracking-widest uppercase text-[10px] text-indigo-500 flex items-center gap-1.5 mb-2">
                          <Sparkles className="w-3 h-3"/> AI Sentiment Insight
                       </h3>
                       <p className="text-sm font-medium text-slate-700 leading-relaxed">
                         {selectedEmployee.recentSentiment === 'critical' ? 'Nhân viên có biểu hiện quá tải công việc, thường làm thêm giờ. Đề xuất: 1-on-1 trong tuần này.' : 'Trạng thái tích cực, kỹ năng phù hợp để tham gia dự án chiến lược Q3.'}
                       </p>
                    </div>
                 </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI HR Copilot Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
        <AnimatePresence>
           {isCopilotOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="w-[380px] h-[500px] bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
              >
                 <div className="p-4 bg-[#111827] text-white flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-blue-500/20 rounded-lg">
                          <BrainCircuit className="w-5 h-5 text-blue-400" />
                       </div>
                       <div>
                          <h3 className="font-bold text-sm">HR Copilot</h3>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Online</p>
                       </div>
                    </div>
                    <button onClick={() => setIsCopilotOpen(false)} className="text-slate-400 hover:text-white transition">
                       <ArrowLeft className="w-5 h-5 rotate-180" />
                    </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                    {copilotMessages.map((msg, idx) => (
                       <div key={idx} className={cn("flex max-w-[85%]", msg.role === 'user' ? "ml-auto justify-end" : "")}>
                          <div className={cn("p-3 rounded-lg text-sm font-medium leading-relaxed relative", 
                            msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                          )}>
                             {msg.content}
                          </div>
                       </div>
                    ))}
                 </div>

                 <div className="p-4 bg-white border-t border-slate-100">
                    <div className="flex items-center bg-slate-100 rounded-full pr-1.5 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 transition-all">
                       <input 
                         type="text" 
                         value={copilotInput}
                         onChange={(e) => setCopilotInput(e.target.value)}
                         onKeyDown={(e) => e.key === 'Enter' && handleSendCopilotMessage()}
                         placeholder="Hỏi AI về nhân sự..."
                         className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none"
                       />
                       <button 
                         onClick={handleSendCopilotMessage}
                         className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors shadow-sm"
                       >
                         <Send className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className="w-14 h-14 bg-blue-600 rounded-full shadow-xl text-white flex items-center justify-center relative group"
        >
           <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
           {isCopilotOpen ? <ArrowLeft className="w-6 h-6 rotate-180" /> : <BrainCircuit className="w-6 h-6" />}
        </motion.button>
      </div>
      <AnimatePresence>
        {showATSModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-lg w-full max-w-4xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-[#111827]">Quản lý Tuyển dụng (ATS) - {
                   activeATSView === 'request' ? 'Đề xuất tuyển dụng' : 
                   activeATSView === 'candidates' ? 'Hồ sơ ứng viên' : 
                   activeATSView === 'interview' ? 'Lịch phỏng vấn' : 'Email ứng viên'
                }</h2>
                <button onClick={() => setShowATSModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X className="w-6 h-6" /></button>
              </div>
              <div className="flex gap-4 mb-6">
                {['request', 'candidates', 'interview', 'email'].map(t => (
                  <button key={t} onClick={() => setActiveATSView(t as any)} className={cn("px-4 py-2 text-sm font-bold rounded-lg", activeATSView === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600')}>
                    {t === 'request' ? 'Đề xuất' : t === 'candidates' ? 'Ứng viên' : t === 'interview' ? 'Lịch phỏng vấn' : 'Email'}
                  </button>
                ))}
              </div>
              <div className="min-h-[400px]">
                {activeATSView === 'candidates' && (
                  <div className="grid grid-cols-4 gap-4">
                    {['sourced', 'interview', 'offered', 'hired'].map(status => (
                      <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status as any)} className="bg-slate-50 p-4 rounded-lg">
                        <h3 className="font-bold text-slate-800 capitalize mb-4">{status}</h3>
                        {candidates.filter(c => c.status === status).map(c => (
                          <div key={c.id} draggable onDragStart={(e) => handleDragStart(e, c.id)} className="bg-white p-3 rounded-lg border shadow-sm mb-2 cursor-grab">
                            <p className="font-bold">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.role} ({c.matchScore}%)</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
                {/* Add placeholders for other views */}
                {activeATSView !== 'candidates' && <div className="text-center text-slate-400 mt-20">Nội dung chức năng {activeATSView} đang được xây dựng...</div>}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}