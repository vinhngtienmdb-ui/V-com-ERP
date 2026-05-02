import { DraggableGrid } from './ui/DraggableGrid';
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
 X,
 Edit2,
 RefreshCcw,
 Calculator,
 Trophy,
 Map as MapIcon
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Employee, AttendanceRecord, Payroll, KPI, Team } from '../types/erp';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
 date: '20/03/2024',
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
 date: '20/03/2024',
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
 date: '21/03/2024',
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
 date: '21/03/2024',
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
 joinDate: '15/01/2023',
 employeeType: 'full_time',
 status: 'active',
 contracts: [{ type: 'Hợp đồng lao động xác định thời hạn 1 năm', signDate: '15/01/2024', expiryDate: '14/01/2025' }],
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
 joinDate: '01/06/2023',
 employeeType: 'full_time',
 status: 'active',
 contracts: [{ type: 'Hợp đồng lao động xác định thời hạn 1 năm', signDate: '01/06/2023', expiryDate: '31/05/2024' }],
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
 { id: 'insurance', label: 'Bảo hiểm Xã hội', desc: 'Quản lý đóng BHXH, BHYT, BHTN.', icon: ShieldCheck, color: 'emerald' },
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
 title: 'Quản trị Đội nhóm & CSKH',
 items: [
 { id: 'teams', label: 'Quản lý Đội nhóm', desc: 'Cấu trúc & Phân quyền team.', icon: Users, color: 'blue' },
 { id: 'cs_staff', label: 'Nhân viên CSKH', desc: 'Quản lý nhân viên CSKH.', icon: HeartHandshake, color: 'rose' },
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
 case 'blue': return 'bg-slate-100 text-orange-700';
 case 'orange': return 'bg-orange-50 text-orange-600';
 case 'indigo': return 'bg-primary-50 text-primary-600';
 case 'purple': return 'bg-purple-50 text-purple-600';
 case 'emerald': return 'bg-emerald-50 text-emerald-600';
 case 'fuchsia': return 'bg-fuchsia-50 text-fuchsia-600';
 case 'rose': return 'bg-rose-50 text-rose-600';
 case 'cyan': return 'bg-cyan-50 text-cyan-600';
 case 'slate':
 default: return 'bg-slate-50 text-slate-700';
 }
}

const MOCK_TEAMS: Team[] = [
 { id: 'TEAM-001', name: 'CSKH Nội địa', type: 'CustomerService', managerId: 'EMP-001', memberIds: ['EMP-002'] },
 { id: 'TEAM-002', name: 'CSKH Quốc tế', type: 'CustomerService', managerId: 'EMP-001', memberIds: [] },
 { id: 'TEAM-003', name: 'Kinh doanh 1', type: 'Sales', managerId: 'EMP-001', memberIds: [] },
];

export function HumanResources() {
 const [activeTab, setActiveTab] = useState<string>('overview');
 const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSetting[]>(INITIAL_ATTENDANCE_SETTINGS);

 const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
 const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
 
 // Payroll state
 const [payrollList, setPayrollList] = useState<Payroll[]>(MOCK_PAYROLL);
 const [editingPayrollId, setEditingPayrollId] = useState<string | null>(null);
 const [editPayrollForm, setEditPayrollForm] = useState<Partial<Payroll>>({});
 const [aiPayrollSuggestion, setAiPayrollSuggestion] = useState<string | null>(null);
 
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

 const [activeAttendanceMethod, setActiveAttendanceMethod] = useState<'kiosk' | 'status'>('status');
 const [showAttendanceConfig, setShowAttendanceConfig] = useState(false);
 
 const [isAdmin, setIsAdmin] = useState(false);
 const [attendanceView, setAttendanceView] = useState<'week' | 'month'>('week');
 const [filterDateAtt, setFilterDateAtt] = useState('');

 const filteredEmployees = employees.filter(emp => {
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

 const handleRoleChange = (employeeId: string, newRole: string) => {
 if (!isAdmin) return;
 
 // Auto-assign permissions based on role
 const newPerms: Record<string, { read: boolean; create: boolean; update: boolean; delete: boolean }> = {};
 const categories = ['personnel', 'attendance', 'payroll', 'kpi', 'rewards'];
 
 categories.forEach(cat => {
 if (newRole === 'Admin') {
 newPerms[cat] = { read: true, create: true, update: true, delete: true };
 } else if (newRole === 'Quản lý') {
 // Managers can read/create/update but not delete, maybe full for specific things
 newPerms[cat] = { read: true, create: true, update: true, delete: false };
 } else {
 // Employees can only read (or maybe minimal access)
 newPerms[cat] = { read: true, create: false, update: false, delete: false };
 }
 });

 setEmployees(prev => prev.map(emp => emp.id === employeeId ? { ...emp, role: newRole as any, permissions: newPerms } : emp));
 if (selectedEmployee?.id === employeeId) {
 setSelectedEmployee(prev => prev ? { ...prev, role: newRole as any, permissions: newPerms } : null);
 }
 };

 const handlePermissionChange = (employeeId: string, category: string, perm: 'read' | 'create' | 'update' | 'delete', checked: boolean) => {
 if (!isAdmin) return;
 setEmployees(prev => prev.map(emp => {
 if (emp.id === employeeId) {
 const currentPerms = emp.permissions || {
 personnel: { read: false, create: false, update: false, delete: false },
 attendance: { read: false, create: false, update: false, delete: false },
 payroll: { read: false, create: false, update: false, delete: false },
 kpi: { read: false, create: false, update: false, delete: false },
 rewards: { read: false, create: false, update: false, delete: false }
 };
 const updatedPerms = {
 ...currentPerms,
 [category]: {
 ...currentPerms[category],
 [perm]: checked
 }
 };
 return { ...emp, permissions: updatedPerms };
 }
 return emp;
 }));
 
 if (selectedEmployee?.id === employeeId) {
 setSelectedEmployee(prev => {
 if (!prev) return null;
 const currentPerms = prev.permissions || {
 personnel: { read: false, create: false, update: false, delete: false },
 attendance: { read: false, create: false, update: false, delete: false },
 payroll: { read: false, create: false, update: false, delete: false },
 kpi: { read: false, create: false, update: false, delete: false },
 rewards: { read: false, create: false, update: false, delete: false }
 };
 const updatedPerms = {
 ...currentPerms,
 [category]: {
 ...currentPerms[category],
 [perm]: checked
 }
 };
 return { ...prev, permissions: updatedPerms };
 });
 }
 };

 const toggleAttendanceSetting = (method: string) => {
 setAttendanceSettings(prev => prev.map(s => s.method === method ? { ...s, enabled: !s.enabled } : s));
 };

 const updateSettingConfig = (method: string, key: string, value: any) => {
 setAttendanceSettings(prev => prev.map(s => s.method === method ? { ...s, config: { ...s.config, [key]: value } } : s));
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Quản trị Nguồn nhân lực (HRM)</h1>
 <p className="text-sm text-[#6B7280] mt-1">Quản lý hồ sơ nhân sự, Skill Matrix và Onboarding Intelligence.</p>
 </div>
 <div className="flex gap-3 items-center">
 <div className="flex items-center gap-2 mr-4 bg-slate-100 p-1.5 rounded-lg border border-slate-300">
 <span className="text-xs font-semibold text-slate-600 pl-2">Admin Mode</span>
 <button 
 onClick={() => setIsAdmin(!isAdmin)}
 className={cn("w-10 h-5 rounded-full relative transition-colors shadow-inner", isAdmin ? "bg-primary-600" : "bg-slate-300")}
 >
 <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm", isAdmin ? "translate-x-5" : "translate-x-0")} />
 </button>
 </div>
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-bold text-[#4B5563] hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
 <LineChart className="w-4 h-4 text-emerald-600" />
 Báo cáo
 </button>
 <button 
 onClick={() => setActiveTab('rec_candidates')}
 className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
 >
 <UserPlus className="w-4 h-4" />
 + Tuyển dụng
 </button>
 </div>
 </div>

 {activeTab === 'overview' && (
 <div className="space-y-8 animate-in fade-in duration-700">
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-4">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Tổng nhân sự</span>
 <Users className="w-4 h-4 text-orange-700" />
 </div>
 <div className="text-3xl font-black text-[#111827]">124</div>
 <div className="mt-3 flex items-center gap-1.5 text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded w-fit">
 <Building2 className="w-3.5 h-3.5" /> 05 Phòng ban
 </div>
 </div>
 <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-4">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Đang Onboarding</span>
 <Rocket className="w-4 h-4 text-emerald-600" />
 </div>
 <div className="text-3xl font-black text-emerald-600">12</div>
 <p className="text-[10px] text-[#6B7280] mt-3 font-bold uppercase">Bổ sung 4 nhân sự Kho</p>
 </div>
 <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-4">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Quỹ lương tháng</span>
 <Wallet className="w-4 h-4 text-slate-500" />
 </div>
 <div className="text-2xl font-black text-[#111827] truncate">{formatCurrency(1850000000)}</div>
 <p className="text-[10px] text-slate-500 mt-3 font-bold italic uppercase tracking-tighter">Tăng 5.2% so với T2</p>
 </div>
 <div className="bg-[#111827] p-6 rounded-xl shadow-sm shadow-slate-200 relative overflow-hidden group border border-slate-800">
 <div className="relative z-10 flex flex-col justify-between h-full">
 <div className="flex justify-between items-start mb-4">
 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Skill Health</span>
 <Target className="w-4 h-4 text-orange-600" />
 </div>
 <div>
 <div className="text-3xl font-black text-[#FAF9F5] tracking-tighter">88.5%</div>
 <p className="text-[10px] text-orange-500 font-bold mt-1 uppercase">Top: Marketing Dept</p>
 </div>
 </div>
 <BrainCircuit className="absolute -bottom-6 -right-6 w-24 h-24 text-[#FAF9F5]/5 group-hover:rotate-12 transition-transform duration-700" />
 </div>
 </DraggableGrid>

 {/* HR Analytics Dashboard (Upgraded) */}
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm mb-6">
 <h3 className="text-lg font-bold text-[#111827] mb-6 flex items-center gap-2">
 <Activity className="w-5 h-5 text-orange-700" /> HR Dashboard Insight
 </h3>
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
 <div className="h-72 w-full space-y-2">
 <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center">Tỷ lệ Tuyển dụng & Nghỉ việc</h4>
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
 <h4 className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center">Biểu đồ Vi phạm Chấm công</h4>
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
 <div className="p-5 bg-slate-100/50 border border-slate-300 rounded-lg">
 <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2 mb-2"><BrainCircuit className="w-4 h-4 text-orange-700" /> AI Insights</h4>
 <p className="text-xs text-blue-800 leading-relaxed">Tỷ lệ nghỉ việc (attrition rate) giảm ổn định trong Q2, đặc biệt sau khi triển khai chương trình phúc lợi mới. Nhu cầu tuyển mới tăng mạnh trong tháng 6 chuẩn bị cho mùa Sale cuối năm.</p>
 </div>
 <DraggableGrid className="grid grid-cols-2 gap-4" columns={2} gap={16}>
 <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
 <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Time to Fill</span>
 <div className="text-2xl font-bold text-[#111827]">14 Ngày</div>
 <span className="text-[10px] text-emerald-600 font-bold block mt-1">-2 ngày vs Q1</span>
 </div>
 <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
 <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest block mb-1">Employee NPS</span>
 <div className="text-2xl font-bold text-[#111827]">78</div>
 <span className="text-[10px] text-emerald-600 font-bold block mt-1">Hạng A Industry</span>
 </div>
 </DraggableGrid>
 </div>
 </div>
 </div>
 
 <div className="space-y-12 bg-transparent rounded-b-xl border-t-0 border-[#F3F4F6] mt-4">
 {HR_MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx} className="bg-white rounded-lg border border-slate-300 shadow-sm p-8">
 <div className="flex items-center gap-3 mb-6">
 <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
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
 className="bg-slate-50 border border-slate-300 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm hover:bg-white transition-all text-left flex gap-4 items-start group"
 >
 <div className={cn("p-3 rounded-lg shrink-0 transition-transform group-hover:scale-105", getColorClasses(item.color))}>
 <item.icon className="w-6 h-6" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="text-sm font-bold text-[#111827] mb-1">{item.label}</h3>
 <p className="text-xs text-slate-600 leading-relaxed mb-3">{item.desc}</p>
 </div>
 </button>
 ))}
 </div>
 </div>
 ))}
 </div>

 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8" columns={2} gap={32}>
 <div className="bg-white p-10 border border-slate-300 rounded-lg shadow-sm space-y-8 relative overflow-hidden group">
 <h3 className="text-xl font-bold text-[#111827] flex items-center gap-3 relative z-10">
 <Rocket className="w-6 h-6 text-emerald-500" /> New Hire Launchpad
 </h3>
 <div className="space-y-6 relative z-10">
 {[
 { name: 'Chuẩn bị workspace', progress: 100, status: 'Done' },
 { name: 'Training văn hóa sàn', progress: 45, status: 'In progress' },
 { name: 'Cấp quyền hệ thống ERP', progress: 10, status: 'Chờ xử lý' }
 ].map((m, i) => (
 <div key={i} className="space-y-3">
 <div className="flex justify-between items-center text-sm">
 <span className="font-bold text-[#111827]">{m.name}</span>
 <span className={cn(
 "text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest",
 m.status === 'Done' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-orange-700"
 )}>{m.status}</span>
 </div>
 <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
 <div className={cn("h-full transition-all duration-1000", m.status === 'Done' ? "bg-emerald-500" : "bg-slate-800")} style={{ width: `${m.progress}%` }} />
 </div>
 </div>
 ))}
 <button className="w-full py-4 bg-[#111827] text-[#FAF9F5] text-xs font-bold rounded-lg hover:bg-slate-800 transition-all uppercase tracking-[0.2em] shadow-sm shadow-slate-900/20">Quản lý lộ trình Onboarding</button>
 </div>
 <LucidePieChart className="absolute -bottom-12 -right-12 w-48 h-48 text-slate-100 group-hover:scale-110 transition-transform duration-700" />
 </div>

 <div className="bg-gradient-to-br from-[#2563EB] to-[#1E40AF] p-10 rounded-lg text-[#FAF9F5] relative overflow-hidden shadow-sm flex flex-col justify-between">
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
 <button className="px-10 py-4 bg-white text-orange-700 font-bold rounded-lg text-xs hover:translate-y-[-2px] transition-all uppercase tracking-widest shadow-sm shadow-blue-900/40">Launch Matrix AI Scan</button>
 </div>
 <Activity className="absolute -top-12 -right-12 w-64 h-64 text-[#FAF9F5]/5 opacity-50" />
 </div>
 </DraggableGrid>
 
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-2 gap-6 relative mt-6" columns={2} gap={24}>
 <div className="absolute inset-0 bg-white /50 to-transparent pointer-events-none rounded-lg" />
 <div className="bg-white/80 backdrop-blur-sm p-6 rounded-lg border border-slate-300 shadow-sm">
 <h3 className="text-sm font-bold text-[#111827] mb-4 flex items-center gap-2">
 <MapPin className="w-4 h-4 text-[#2563EB]" /> Live Map Chấm công Giao hàng
 </h3>
 <div className="h-48 bg-slate-50 rounded-lg border border-[#F3F4F6] relative overflow-hidden flex items-center justify-center">
 <div className="text-center space-y-2 opacity-40">
 <MapPin className="w-8 h-8 mx-auto" />
 <p className="text-xs font-medium">Bản đồ GPS đang hoạt động (Mock)</p>
 </div>
 <div className="absolute top-10 left-20 w-3 h-3 bg-slate-800 rounded-full border-2 border-white animate-pulse shadow-sm"></div>
 <div className="absolute top-20 right-32 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
 </div>
 <p className="text-[10px] text-[#6B7280] mt-3">Tích hợp GPS App để chấm công tự động cho nhân viên vận chuyển và Sale hiện trường khi vào vùng kho/cửa hàng.</p>
 </div>
 <div className="bg-slate-900 text-[#FAF9F5] p-8 rounded-lg flex flex-col justify-between">
 <div>
 <h3 className="text-xl font-bold italic mb-2">Dynamic Salary Engine</h3>
 <p className="text-slate-500 text-sm leading-relaxed">Cấu hình công thức tính lương động theo từng vị trí (Kinh doanh: Lương cứng + % Hoa hồng; Kho: Lương theo sản lượng). Tự động kết nối dữ liệu từ module Seller & Đơn hàng để tính thưởng nóng.</p>
 </div>
 <div className="pt-6">
 <button className="w-full bg-white text-slate-900 font-bold py-3 rounded-lg text-sm hover:bg-slate-100 transition-all flex items-center justify-center gap-2">
 <Briefcase className="w-4 h-4" /> Cấu hình công thức tính lương
 </button>
 </div>
 </div>
 </DraggableGrid>
 </div>
 )}

 {activeTab !== 'overview' && (
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[600px] flex flex-col mt-4">
 <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
 <button 
 onClick={() => setActiveTab('overview')} 
 className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm"
 >
 <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
 </button>
 </div>
 
 {['personnel', 'insurance', 'skills', 'attendance', 'leave', 'kpi', 'sentiment', 'attendance_config', 'teams', 'cs_staff'].includes(activeTab) ? (
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
 className="bg-slate-50 border border-slate-300 rounded-lg px-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 w-64 transition-all" 
 />
 </div>
 {activeTab === 'personnel' && (
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
 )}
 {activeTab === 'attendance' && (
 <div className="flex gap-2 items-center">
 <div className="flex bg-slate-100 p-1 rounded-lg">
 <button 
 onClick={() => setAttendanceView('week')}
 className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-colors", attendanceView === 'week' ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 Theo Tuần
 </button>
 <button 
 onClick={() => setAttendanceView('month')}
 className={cn("px-3 py-1.5 text-xs font-bold rounded-md transition-colors", attendanceView === 'month' ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 Theo Tháng
 </button>
 </div>
 <input
 type={attendanceView === 'month' ? "month" : "week"}
 value={filterDateAtt}
 onChange={(e) => setFilterDateAtt(e.target.value)}
 className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
 />
 </div>
 )}
 </div>
 {activeTab === 'attendance_config' ? (
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2">
 <History className="w-4 h-4" /> Nhật ký thay đổi
 </button>
 </div>
 ) : (
 <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5 w-max">
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
 <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900"><Settings className="w-6 h-6 text-orange-700"/> Cấu hình Hệ thống Chấm công</h2>
 <p className="text-sm text-slate-600 font-medium">Thiết lập các phương thức và quy tắc xác thực chấm công cho toàn doanh nghiệp.</p>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
 {attendanceSettings.map(setting => (
 <div key={setting.method} className={cn(
 "bg-white rounded-lg border transition-all duration-300 shadow-sm overflow-hidden flex flex-col group",
 setting.enabled ? "border-orange-200 ring-1 ring-blue-50/50" : "border-slate-300 opacity-80"
 )}>
 <div className="p-6 flex justify-between items-start border-b border-stone-50">
 <div className="flex gap-4">
 <div className={cn(
 "w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110",
 setting.enabled ? "bg-slate-900 text-[#FAF9F5] shadow-sm shadow-blue-200" : "bg-slate-100 text-slate-500"
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
 <p className="text-slate-600 text-xs font-medium uppercase tracking-wider mt-0.5">Protocol: {setting.method}</p>
 </div>
 </div>
 <div className="flex flex-col items-end gap-2">
 <button
 onClick={() => toggleAttendanceSetting(setting.method)}
 className={cn(
 "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
 setting.enabled ? "bg-slate-900" : "bg-slate-200"
 )}
 >
 <span className={cn(
 "inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm",
 setting.enabled ? "translate-x-6" : "translate-x-1"
 )} />
 </button>
 <span className={cn("text-[10px] font-bold uppercase", setting.enabled ? "text-orange-700" : "text-slate-500")}>
 {setting.enabled ? 'Đang bật' : 'Đã tắt'}
 </span>
 </div>
 </div>
 
 <div className="p-6 bg-slate-50/30 flex-1">
 {setting.enabled ? (
 <div className="space-y-6 animate-in fade-in slide-in- duration-300">
 {setting.method === 'gps' && (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Bán kính mặc định (m)</label>
 <div className="relative">
 <input 
 type="number" 
 value={setting.config.radius}
 onChange={(e) => updateSettingConfig('gps', 'radius', Number(e.target.value))}
 className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-orange-600/10 focus:border-slate-900 outline-none"
 />
 <Timer className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Số lượng Vùng</label>
 <div className="px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-orange-700 flex justify-between items-center">
 {setting.config.zones?.length || 0} Vùng an toàn
 <button className="text-orange-600 hover:scale-110 transition-transform"><PlusCircle className="w-4 h-4" /></button>
 </div>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Danh sách Vùng an toàn</label>
 <div className="space-y-2">
 {setting.config.zones?.map((zone: any, i: number) => (
 <div key={i} className="bg-white border border-slate-300 p-3 rounded-lg flex justify-between items-center group/item hover:border-blue-300 transition-colors">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-orange-600"><MapPin className="w-4 h-4" /></div>
 <div>
 <p className="text-xs font-bold text-slate-900">{zone.name}</p>
 <p className="text-[10px] text-slate-600 font-mono italic">{zone.lat}, {zone.lng} (±{zone.radius}m)</p>
 </div>
 </div>
 <button className="p-2 text-slate-500 hover:text-red-500 opacity-0 group-hover/item:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 {setting.method === 'wifi' && (
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Danh sách Wi-Fi Tin cậy</label>
 <div className="flex flex-wrap gap-2">
 {setting.config.ssids?.map((ssid: string, i: number) => (
 <div key={i} className="flex items-center gap-2 bg-slate-100 text-orange-800 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold">
 <Wifi className="w-3 h-3" />
 {ssid}
 <button className="hover:text-blue-900 ml-1">×</button>
 </div>
 ))}
 <button className="flex items-center gap-2 border border-dashed border-slate-400 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:border-blue-400 hover:text-orange-600 transition-all">
 <Plus className="w-3 h-3" /> Thêm mạng
 </button>
 </div>
 </div>
 <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg flex gap-3">
 <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
 <p className="text-[11px] text-amber-800 leading-relaxed font-bold uppercase tracking-tight">Cảnh báo: Luôn kích hoạt "MAC Restricted" để tránh nhân viên fake SSID thủ công.</p>
 </div>
 <div className="flex items-center justify-between p-4 bg-white border border-slate-300 rounded-lg">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-500"><Lock className="w-4 h-4" /></div>
 <div>
 <p className="text-xs font-bold text-slate-900">Xác thực qua MAC Address</p>
 <p className="text-[10px] text-slate-600 font-medium">Bảo mật cao nhất cho môi trường văn phòng.</p>
 </div>
 </div>
 <input type="checkbox" defaultChecked={setting.config.macRestricted} className="w-5 h-5 rounded border-slate-400 text-orange-700 focus:ring-orange-600" />
 </div>
 </div>
 )}
 {setting.method === 'face' && (
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Độ chính xác yêu cầu (0.8 - 0.99)</label>
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
 <span className="text-sm font-mono font-bold text-orange-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-300">{setting.config.minMatch}</span>
 </div>
 </div>
 <div className="grid grid-cols-1 gap-2">
 {[
 { id: 'livenessCheck', label: 'Bật Liveness Check (Chống ảnh giả/Video)', icon: Globe },
 { id: 'antiSpoofing', label: 'AI Anti-Spoofing Guard', icon: ShieldCheck },
 { id: 'autoCapture', label: 'Tự động chụp khi phát hiện gương mặt', icon: Video }
 ].map(feat => (
 <label key={feat.id} className="flex items-center justify-between p-3 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
 <div className="flex items-center gap-3">
 <feat.icon className="w-4 h-4 text-orange-600" />
 <span className="text-xs font-bold text-slate-800">{feat.label}</span>
 </div>
 <input 
 type="checkbox" 
 checked={!!setting.config[feat.id]} 
 onChange={(e) => updateSettingConfig('face', feat.id, e.target.checked)}
 className="w-4 h-4 rounded border-slate-400 text-orange-700 focus:ring-orange-600" 
 />
 </label>
 ))}
 </div>
 </div>
 )}
 {setting.method === 'qr' && (
 <div className="space-y-4">
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Thời gian làm mới mã (giây)</label>
 <div className="relative">
 <input 
 type="number" 
 value={setting.config.refreshRate}
 onChange={(e) => updateSettingConfig('qr', 'refreshRate', Number(e.target.value))}
 className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-orange-600/10 focus:border-slate-900 outline-none"
 />
 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500">GIÂY</span>
 </div>
 </div>
 <div className="p-4 bg-primary-900/5 border border-primary-100 rounded-lg space-y-3">
 <h5 className="text-[10px] font-bold text-primary-900 uppercase tracking-widest flex items-center gap-2">
 <Lock className="w-3 h-3" /> Bảo mật & Mã hóa
 </h5>
 <div className="flex justify-between items-center">
 <span className="text-xs font-medium text-slate-800">Thuật toán mã hóa</span>
 <span className="text-xs font-bold text-primary-600 px-2 py-1 bg-white border border-primary-100 rounded-lg">{setting.config.encryption}</span>
 </div>
 <label className="flex items-center gap-3">
 <input 
 type="checkbox" 
 checked={setting.config.dynamicSalt}
 onChange={(e) => updateSettingConfig('qr', 'dynamicSalt', e.target.checked)}
 className="w-4 h-4 rounded border-slate-400 text-primary-600" 
 />
 <span className="text-xs font-medium text-slate-800">Sử dụng Mobile-ID as Dynamic Salt</span>
 </label>
 </div>
 </div>
 )}
 {setting.method === 'device' && (
 <div className="space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Địa chỉ IP thiết bị</label>
 <input 
 type="text" 
 placeholder="192.168.1.xxx"
 value={setting.config.ip}
 onChange={(e) => updateSettingConfig('device', 'ip', e.target.value)}
 className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-orange-600/10 focus:border-slate-900 outline-none"
 />
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Cổng kết nối (Port)</label>
 <input 
 type="number" 
 value={setting.config.port}
 onChange={(e) => updateSettingConfig('device', 'port', Number(e.target.value))}
 className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-orange-600/10 focus:border-slate-900 outline-none"
 />
 </div>
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Model thiết bị & Giao thức</label>
 <select 
 value={setting.config.model}
 onChange={(e) => updateSettingConfig('device', 'model', e.target.value)}
 className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-600/10 focus:border-slate-900 outline-none bg-white font-bold"
 >
 <option>ZKTeco K40 (Standalone)</option>
 <option>Ronald Jack F18 (TCP/IP)</option>
 <option>Hikvision Face Terminal (Web SDK)</option>
 <option>Khác (Generic ADMS)</option>
 </select>
 </div>
 <div className="flex items-center justify-between p-4 bg-white border border-slate-300 rounded-lg">
 <div className="space-y-0.5">
 <p className="text-xs font-bold text-slate-900">Khoảng cách đồng bộ</p>
 <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tight">Sync every {setting.config.syncInterval} minutes</p>
 </div>
 <div className="flex gap-2">
 <button className="px-4 py-2 bg-slate-900 text-[#FAF9F5] rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">Ping test</button>
 <button className="p-2 bg-slate-100 text-orange-700 rounded-lg hover:bg-[#EAE7DF] transition-all border border-slate-300"><Zap className="w-4 h-4 fill-current" /></button>
 </div>
 </div>
 </div>
 )}
 </div>
 ) : (
 <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-8 space-y-3">
 <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
 <Lock className="w-6 h-6" />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-500">Phương thức này đang tắt</p>
 <p className="text-xs text-slate-500 mt-1">Bật switch để cấu hình chi tiết cho hệ thống.</p>
 </div>
 </div>
 )}
 </div>

 <div className="p-4 border-t border-stone-50 flex justify-between items-center bg-white px-6">
 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest italic">Last Update: 2 mins ago</span>
 <button className={cn(
 "text-xs font-bold transition-all flex items-center gap-2",
 setting.enabled ? "text-orange-700 hover:text-blue-800" : "text-slate-500 cursor-not-allowed"
 )}>
 Xem tài liệu API <ArrowRight className="w-3 h-3" />
 </button>
 </div>
 </div>
 ))}
 </div>

 <div className="bg-primary-900 text-[#FAF9F5] p-8 rounded-lg shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8">
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
 <button className="w-full px-8 py-4 bg-white text-primary-900 font-bold rounded-lg text-sm hover:translate-y-[-2px] transition-all uppercase tracking-widest shadow-sm">Kích hoạt AI Optimizer</button>
 </div>
 <Layers className="absolute -bottom-24 -right-12 w-64 h-64 text-[#FAF9F5]/5 rotate-12" />
 </div>
 </div>
 ) : (activeTab !== 'attendance' && activeTab !== 'kpi') ? (
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
 {activeTab === 'insurance' && (
 <>
 <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Họ tên & Phân nhóm</th>
 <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Lương đóng BH</th>
 <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Tỷ lệ (NLĐ - NSDLĐ)</th>
 <th className="px-6 py-5 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái đóng</th>
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
 {emp.recentSentiment === 'positive' && <span className="text-emerald-500 flex items-center gap-1"><Smile className="w-3.5 h-3.5"/> Good</span>}
 {emp.recentSentiment === 'neutral' && <span className="text-slate-600 flex items-center gap-1"><MoreVertical className="w-3.5 h-3.5"/> OK</span>}
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
 {activeTab === 'insurance' && employees.map((emp) => (
 <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-6 py-5">
 <p className="text-sm font-bold text-[#111827]">{emp.fullName}</p>
 <p className="text-[10px] text-[#6B7280] font-mono font-bold uppercase tracking-tight">{emp.department}</p>
 </td>
 <td className="px-6 py-5 text-right font-bold text-sm text-slate-800">10,000,000 ₫</td>
 <td className="px-6 py-5 text-center">
 <p className="text-xs font-bold text-slate-900">10.5% - 21.5%</p>
 </td>
 <td className="px-6 py-5 text-center">
 <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg shrink-0">Đã nộp</span>
 </td>
 </tr>
 ))}
 {activeTab === 'skills' && employees.map((emp) => (
 <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-6 py-5 font-bold text-sm text-[#111827]">{emp.fullName}</td>
 <td className="px-6 py-5">
 <div className="flex gap-2">
 {emp.skills?.map((s, idx) => (
 <span key={idx} className="px-2 py-0.5 bg-slate-100 text-orange-700 text-[10px] font-bold rounded-lg border border-slate-300">
 {s.name}
 </span>
 ))}
 </div>
 </td>
 <td className="px-6 py-5">
 <div className="flex flex-col items-center gap-1">
 <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full bg-slate-800" style={{ width: `${(emp.skills?.[0]?.level || 50)}%` }} />
 </div>
 <span className="text-[10px] font-bold text-slate-500">{(emp.skills?.[0]?.level || 50)}% Mastered</span>
 </div>
 </td>
 <td className="px-6 py-5 text-[10px] font-bold text-emerald-600 italic">
 AI Suggested: Advanced Analytics
 </td>
 <td className="px-6 py-5 text-right">
 <button className="px-4 py-1.5 bg-slate-900 text-[#FAF9F5] rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all uppercase tracking-widest shadow-sm">Đề cử Training</button>
 </td>
 </tr>
 ))}
 {activeTab === 'leave' && employees.map(emp => (
 <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-6 py-5">
 <p className="text-sm font-bold text-[#111827]">{emp.fullName}</p>
 <p className="text-[10px] text-[#6B7280] font-mono font-bold uppercase tracking-tight opacity-50">{emp.id}</p>
 </td>
 <td className="px-6 py-5 text-center">
 <span className="text-sm font-bold text-[#111827]">{emp.leaveBalance?.total ?? 0}</span>
 <span className="text-[10px] text-slate-500 ml-1">ngày</span>
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
 const emp = employees.find(e => e.id === kpi.employeeId);
 const progress = (kpi.current / kpi.target) * 100;
 return (
 <tr key={kpi.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-6 py-5">
 <p className="text-sm font-bold text-[#111827]">{emp?.fullName ?? 'Unknown'}</p>
 <p className="text-[10px] text-[#6B7280] font-mono font-bold uppercase tracking-tight opacity-50">{kpi.employeeId}</p>
 </td>
 <td className="px-6 py-5">
 <p className="text-xs font-bold text-[#111827]">{kpi.title}</p>
 <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tight">Kỳ đánh giá: {kpi.period}</p>
 </td>
 <td className="px-6 py-5 text-center">
 <span className="text-sm font-bold text-slate-700">{kpi.target.toLocaleString()} {kpi.unit}</span>
 </td>
 <td className="px-6 py-5 text-center">
 <span className={cn("text-sm font-bold", progress >= 100 ? "text-emerald-600" : "text-orange-700")}>{kpi.current.toLocaleString()} {kpi.unit}</span>
 </td>
 <td className="px-6 py-5 text-right w-48">
 <div className="flex flex-col gap-2">
 <div className="flex justify-between items-center text-[10px] font-bold">
 <span className={cn(progress >= 100 ? "text-emerald-600" : "text-orange-700")}>{progress.toFixed(1)}%</span>
 <span className="text-slate-500">{progress >= 100 ? 'Đạt' : 'Đang xử lý'}</span>
 </div>
 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
 <div className={cn("h-full rounded-full transition-all duration-1000", progress >= 100 ? "bg-emerald-500" : "bg-slate-800")} style={{ width: `${Math.min(progress, 100)}%` }} />
 </div>
 </div>
 </td>
 </tr>
 );
 })}
 {activeTab === 'sentiment' && employees.map(emp => (
 <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-6 py-5">
 <p className="text-sm font-bold text-[#111827]">{emp.fullName}</p>
 <p className="text-[10px] text-[#6B7280] font-mono font-bold uppercase tracking-tight opacity-50">{emp.id}</p>
 </td>
 <td className="px-6 py-5">
 <div className="flex items-center gap-1.5 font-bold">
 {emp.recentSentiment === 'positive' && <span className="text-emerald-500 flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg"><Smile className="w-4 h-4"/> Good</span>}
 {emp.recentSentiment === 'neutral' && <span className="text-slate-600 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg"><MoreVertical className="w-4 h-4"/> Neutral</span>}
 {emp.recentSentiment === 'critical' && <span className="text-red-500 flex items-center gap-1 bg-red-50 px-3 py-1.5 rounded-lg"><AlertCircle className="w-4 h-4"/> Critical Risk</span>}
 </div>
 </td>
 <td className="px-6 py-5 text-center">
 <p className="text-[10px] font-medium text-slate-600 leading-relaxed max-w-[200px] mx-auto text-left">
 {emp.recentSentiment === 'critical' ? 'Dấu hiệu burn-out, thường xuyên OT trong 2 tuần qua.' : 'Cảm xúc ổn định, tương tác tốt tại nơi làm.'}
 </p>
 </td>
 <td className="px-6 py-5">
 <p className="text-[10px] font-bold text-orange-700 bg-slate-100 px-3 py-1.5 rounded-lg max-w-[150px]">
 {emp.recentSentiment === 'critical' ? 'Đề nghị nghỉ dưỡng / 1-1 meeting' : 'Không có đề xuất'}
 </p>
 </td>
 <td className="px-6 py-5 text-right">
 <button className="px-3 py-1.5 bg-slate-900 text-[#FAF9F5] rounded-lg text-[10px] font-bold hover:bg-slate-800 transition-all shadow-sm">Lên lịch 1-on-1</button>
 </td>
 </tr>
 ))}
 {activeTab === 'teams' && (
 <div className="p-8">
 <div className="grid grid-cols-2 gap-4">
 {teams.map(team => (
 <div key={team.id} className="border p-4 rounded-lg bg-white shadow-sm">
 <p className="font-bold">{team.name}</p>
 <p className="text-sm text-slate-600">{team.type}</p>
 <p className="text-sm">Thành viên: {team.memberIds.length}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 {activeTab === 'cs_staff' && (
 employees.filter(e => e.department === 'CSKH' || e.position.includes('CSKH')).map(emp => (
 <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
 <td className="p-4">{emp.fullName}</td>
 <td className="p-4">{emp.email}</td>
 <td className="p-4">{emp.phone}</td>
 </tr>
 ))
 )}
 {activeTab === 'attendance' && filteredAttendance.map(record => {
 const emp = employees.find(e => e.id === record.employeeId);
 
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
 <p className="text-sm font-bold text-slate-900">{emp?.fullName ?? 'Hệ thống'}</p>
 <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{record.date}</p>
 </td>
 <td className="px-6 py-5 text-center">
 <div className="flex flex-col items-center">
 <span className="text-xs font-bold text-emerald-600">In: {record.checkIn}</span>
 <span className="text-xs font-bold text-amber-600 mt-0.5">Out: {record.checkOut}</span>
 <span className="text-[10px] font-bold text-slate-500 mt-1 bg-slate-100 px-2 py-0.5 rounded-full">{hoursWorked} giờ (OT: {record.overtimeHours}h)</span>
 </div>
 </td>
 <td className="px-6 py-5">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
 {record.method === 'gps' && <MapPin className="w-4 h-4" />}
 {record.method === 'wifi' && <Wifi className="w-4 h-4" />}
 {record.method === 'face' && <ScanFace className="w-4 h-4" />}
 {record.method === 'qr' && <QrCode className="w-4 h-4" />}
 </div>
 <div>
 <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{record.method}</p>
 <p className="text-[10px] text-slate-600">{record.deviceInfo}</p>
 </div>
 </div>
 </td>
 <td className="px-6 py-5">
 <p className="text-xs font-medium text-slate-700">{record.location}</p>
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
 ) : null}
 </div>

 {activeTab === 'attendance' && (
 <div className="space-y-6 animate-in fade-in slide-in- duration-500 p-6 bg-slate-50 min-h-[600px]">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-300 shadow-sm mb-6">
 <div>
 <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
 <Clock className="w-6 h-6 text-orange-500" /> Quản lý Chấm công & Hiện diện
 </h2>
 <p className="text-[10px] text-slate-600 font-medium mt-1 uppercase tracking-wider">Dữ liệu được đồng bộ từ App GPS, Wifi Hub và Máy chấm công FaceID</p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={() => setShowAttendanceConfig(true)}
 className="px-4 py-2 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-200 flex items-center gap-2"
 >
 <Settings className="w-4 h-4" /> Cấu hình
 </button>
 <button 
 onClick={() => setActiveAttendanceMethod(activeAttendanceMethod === 'kiosk' ? 'status' : 'kiosk')}
 className={cn(
 "px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all",
 activeAttendanceMethod === 'kiosk' ? "bg-orange-600 text-[#FAF9F5] shadow-sm shadow-orange-100" : "bg-white border border-slate-300 text-slate-800 hover:bg-slate-50"
 )}
 >
 <ScanFace className="w-4 h-4" /> {activeAttendanceMethod === 'kiosk' ? 'Bảng công' : 'Chế độ Kiosk'}
 </button>
 </div>
 </div>

 {activeAttendanceMethod === 'kiosk' ? (
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[500px]">
 <div className="bg-[#111827] rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden shadow-sm">
 <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] /20 via-transparent to-transparent opacity-50" />
 
 <div className="space-y-2 relative z-10">
 <div className="text-6xl font-black text-[#FAF9F5] tracking-widest tabular-nums">08:45:22</div>
 <p className="text-orange-500 text-xs font-bold uppercase tracking-[0.3em]">Hệ thống đang sẵn sàng</p>
 </div>

 <div className="w-64 h-64 bg-slate-800 rounded-xl border-4 border-slate-700 relative flex items-center justify-center overflow-hidden group">
 <div className="absolute inset-0 bg-slate-800/10 opacity-100" />
 <div className="absolute top-0 left-0 w-full h-1 bg-slate-800 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_3s_ease-in-out_infinite]" />
 <ScanFace className="w-24 h-24 text-orange-500/50 group-hover:text-orange-500 transition-colors" />
 
 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
 <Cpu className="w-3 h-3" /> AI Face Recognition
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4 w-full max-w-md relative z-10">
 <button className="py-6 bg-emerald-600 text-[#FAF9F5] rounded-lg font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all flex flex-col items-center gap-2 shadow-sm shadow-emerald-900/40 active:scale-95">
 <CheckCircle2 className="w-6 h-6" /> VÀO CA
 </button>
 <button className="py-6 bg-rose-600 text-[#FAF9F5] rounded-lg font-black text-sm uppercase tracking-widest hover:bg-rose-700 transition-all flex flex-col items-center gap-2 shadow-sm shadow-rose-900/40 active:scale-95">
 <History className="w-6 h-6" /> HẾT CA
 </button>
 </div>
 </div>

 <div className="space-y-6">
 <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm h-full">
 <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
 <Activity className="w-4 h-4 text-emerald-500" /> Ghi nhận gần đây
 </h3>
 <div className="space-y-4">
 {[
 { name: 'Lê Hoàng Minh', time: '08:00', status: 'In', image: 'M', dept: 'Marketing' },
 { name: 'Trần Thu Thủy', time: '08:15', status: 'In', image: 'T', dept: 'CSKH' },
 { name: 'Nguyễn Diệu Nhi', time: '08:30', status: 'Late', image: 'N', dept: 'Sales' }
 ].map((l, i) => (
 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-orange-200 hover:bg-white transition-all">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center font-bold text-primary-600 text-sm shadow-sm border border-white">
 {l.image}
 </div>
 <div>
 <p className="text-xs font-bold text-slate-900 uppercase tracking-tight">{l.name}</p>
 <p className="text-[10px] text-slate-600 font-medium">Verify: FaceID (Match 98%) • {l.dept}</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-sm font-black text-slate-900">{l.time}</p>
 <p className={cn(
 "text-[9px] font-bold uppercase tracking-tighter",
 l.status === 'In' ? "text-emerald-600" : "text-rose-600"
 )}>{l.status === 'In' ? 'Đã Check-in' : 'Đi muộn'}</p>
 </div>
 </div>
 ))}
 </div>
 <button className="w-full mt-6 py-4 text-xs font-bold text-slate-600 border border-dashed border-slate-300 rounded-xl hover:bg-slate-50 transition-colors uppercase tracking-widest hover:text-slate-800">Xem tất cả lịch sử</button>
 </div>
 
 <div className="bg-white border border-primary-100 p-6 rounded-lg relative overflow-hidden group">
 <Zap className="absolute -right-6 -bottom-6 w-24 h-24 text-primary-100 group-hover:scale-110 transition-transform" />
 <div className="flex items-start gap-4 relative z-10">
 <div className="p-3 bg-white text-primary-600 rounded-xl shadow-sm border border-primary-100">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-primary-900 text-sm">Chế độ bảo mật Cao</h4>
 <p className="text-[11px] text-primary-800/70 mt-1 leading-relaxed font-medium">Hệ thống đang tự động lọc các nỗ lực chấm công giả mạo (Fake GPS/Liveness Spoofing) thông qua thuật toán AI Vision.</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 ) : (
 <DraggableGrid className="grid grid-cols-12 gap-6" columns={12} gap={24}>
 <div className="col-span-12 lg:col-span-8 bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden flex flex-col">
 <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
 <div className="flex gap-4">
 <div className="flex bg-white rounded-lg p-1 border border-slate-300 shadow-sm">
 <button className="px-4 py-1.5 bg-primary-600 text-[#FAF9F5] text-[10px] font-bold rounded-md shadow-sm">Theo ngày</button>
 <button className="px-4 py-1.5 text-[10px] font-bold text-slate-600 hover:text-slate-800">Bảng công tháng</button>
 </div>
 </div>
 <div className="flex items-center gap-3 w-full sm:w-auto">
 <div className="relative flex-1 sm:flex-none">
 <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
 <input 
 type="text" 
 placeholder="Tìm nhân viên..." 
 className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-[10px] focus:outline-none focus:ring-1 focus:ring-primary-500 w-full sm:w-48"
 />
 </div>
 <button className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
 <Filter className="w-4 h-4 text-slate-500" />
 </button>
 </div>
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-200 italic">
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nhân viên</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Ca làm</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">In/Out</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Verify</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Lương ca</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {filteredAttendance.map((att, i) => {
 const emp = employees.find(e => e.id === att.employeeId);
 return (
 <tr key={i} className="hover:bg-primary-50/20 transition-colors group">
 <td className="px-6 py-5">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-[10px] uppercase">
 {emp?.fullName.split(' ').pop()?.charAt(0) || 'U'}
 </div>
 <div>
 <div className="text-xs font-bold text-slate-900 group-hover:text-primary-600 transition-colors">{emp?.fullName}</div>
 <div className="text-[9px] text-slate-500 font-mono italic">{att.employeeId}</div>
 </div>
 </div>
 </td>
 <td className="px-6 py-5 text-center">
 <span className="text-[9px] font-bold text-slate-700 px-2 py-0.5 bg-slate-100 rounded uppercase tracking-tighter">Hành chính</span>
 </td>
 <td className="px-6 py-5 text-center">
 <div className="flex flex-col items-center">
 <div className="text-xs font-black text-slate-900 tabular-nums">{att.checkIn} - {att.checkOut || '--:--'}</div>
 <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Total: {att.overtimeHours + 8}h</div>
 </div>
 </td>
 <td className="px-6 py-5 text-center">
 <div className="flex flex-col items-center gap-1">
 {att.method === 'face' ? (
 <div className="px-2 py-0.5 bg-slate-100 text-orange-700 rounded flex items-center gap-1 text-[9px] font-bold">
 <ScanFace className="w-3 h-3" /> FaceID
 </div>
 ) : att.method === 'wifi' ? (
 <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded flex items-center gap-1 text-[9px] font-bold">
 <Wifi className="w-3 h-3" /> Wifi
 </div>
 ) : (
 <div className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded flex items-center gap-1 text-[9px] font-bold">
 <MapPin className="w-3 h-3" /> GPS
 </div>
 )}
 <span className="text-[9px] text-slate-500 font-medium">{att.deviceInfo}</span>
 </div>
 </td>
 <td className="px-6 py-5 text-center">
 <span className={cn(
 "px-3 py-1 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm",
 att.status === 'on_time' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
 )}>
 {att.status === 'on_time' ? 'Đúng giờ' : 'Đi muộn'}
 </span>
 </td>
 <td className="px-6 py-5 text-right">
 <span className="text-xs font-black text-slate-900 tabular-nums">{formatCurrency(450000)}</span>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 <div className="col-span-12 lg:col-span-4 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <h3 className="font-bold text-slate-900 text-sm mb-6 flex items-center gap-2 uppercase tracking-widest">
 <Target className="w-4 h-4 text-rose-500" /> Phân tích Chuyên cần
 </h3>
 <div className="space-y-6">
 <div className="flex justify-between items-end">
 <div>
 <p className="text-4xl font-black text-slate-900 tracking-tighter">94.2%</p>
 <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-widest">Tỷ lệ Presence Rate</p>
 </div>
 <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
 <TrendingUp className="w-3 h-3" /> +1.2%
 </div>
 </div>
 
 <div className="space-y-4">
 {[
 { label: 'Có mặt ngay lúc này', count: 112, color: 'emerald' },
 { label: 'Đã Checkout (Hết ca)', count: 24, color: 'blue' },
 { label: 'Vắng mặt / Đi muộn', count: 8, color: 'rose' }
 ].map((s, i) => (
 <div key={i} className="space-y-2">
 <div className="flex justify-between text-[10px] font-bold">
 <span className="text-slate-600 uppercase">{s.label}</span>
 <span className="text-slate-900 font-black">{s.count} người</span>
 </div>
 <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
 <div 
 className={cn("h-full transition-all duration-1000", s.color === 'emerald' ? 'bg-emerald-500' : s.color === 'rose' ? 'bg-rose-500' : 'bg-slate-800')} 
 style={{ width: `${(s.count / 144) * 100}%` }} 
 />
 </div>
 </div>
 ))}
 </div>
 
 <div className="p-5 bg-primary-50 border border-primary-100 rounded-lg space-y-3 relative overflow-hidden">
 <Zap className="absolute -right-2 -top-2 w-12 h-12 text-primary-100 rotate-12" />
 <h4 className="text-[10px] font-black text-primary-900 uppercase tracking-[0.2em] flex items-center gap-2 relative z-10">
 <Sparkles className="w-3.5 h-3.5" /> AI Khuyến nghị
 </h4>
 <p className="text-[11px] text-primary-800 leading-relaxed font-medium italic relative z-10">Bộ phận "Kho" đang có tỷ lệ đi muộn cao đột biến vào thứ Hai. Cân nhắc điều chỉnh ca làm sớm hơn hoặc hỗ trợ xe đưa đón.</p>
 </div>
 </div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="relative z-10">
 <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-widest flex items-center gap-2">
 <QrCode className="w-4 h-4 text-primary-600" /> Mã QR Động (Anti-Fake)
 </h3>
 <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center group-hover:bg-white transition-all duration-500 relative cursor-pointer">
 <QrCode className="w-24 h-24 text-slate-500 group-hover:text-primary-600 transition-all duration-500" />
 <div className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
 <RefreshCcw className="w-8 h-8 text-primary-600 animate-spin-slow" />
 </div>
 </div>
 <p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-bold italic text-center">Mã tự động reset sau <span className="text-primary-600 font-black">24s</span>. Chỉ cho phép thiết bị đã định danh quét.</p>
 </div>
 <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary-50 rounded-full opacity-50 transition-transform group-hover:scale-150 duration-700" />
 </div>
 </div>
 </DraggableGrid>
 )}
 </div>
 )}

 {activeTab === 'kpi' && (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 p-8 bg-white min-h-[600px]">
 <div className="flex justify-between items-end mb-8 border-b border-slate-200 pb-8">
 <div className="space-y-1">
 <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
 <Target className="w-8 h-8 text-primary-600" /> KPI & Performance Analysis
 </h2>
 <p className="text-sm font-medium text-slate-500 italic">Đánh giá hiệu quả công việc dựa trên dữ liệu thời gian thực và AI Score.</p>
 </div>
 <div className="flex gap-3">
 <div className="bg-slate-100 p-1 rounded-xl flex">
 <button className="px-4 py-2 bg-white text-primary-600 font-bold text-xs rounded-lg shadow-sm">Tháng này</button>
 <button className="px-4 py-2 text-slate-600 font-bold text-xs hover:text-slate-800">Quý 1/2024</button>
 </div>
 <button className="px-4 py-2 bg-primary-600 text-[#FAF9F5] rounded-xl text-xs font-bold hover:bg-primary-700 transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-2">
 <Calculator className="w-4 h-4" /> Chốt KPI Batch
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-3 gap-6" columns={3} gap={24}>
 <div className="bg-primary-50 border border-primary-100 p-6 rounded-lg space-y-4">
 <div className="flex justify-between items-start">
 <p className="text-[10px] font-black text-primary-400 uppercase tracking-widest">Average Completion</p>
 <div className="w-10 h-10 bg-primary-600 text-[#FAF9F5] rounded-full flex items-center justify-center font-black text-sm shadow-sm">88%</div>
 </div>
 <div className="space-y-1">
 <div className="text-3xl font-black text-primary-900 tabular-nums">88.45%</div>
 <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600">
 <TrendingUp className="w-3 h-3" /> +4.2% vs Last Month
 </div>
 </div>
 </div>
 <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-lg space-y-4">
 <div className="flex justify-between items-start">
 <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Top Performers</p>
 <Trophy className="w-6 h-6 text-emerald-600" />
 </div>
 <div className="space-y-1">
 <div className="text-3xl font-black text-emerald-900 tabular-nums">12 KH</div>
 <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">Đạt trên 120% mục tiêu</p>
 </div>
 </div>
 <div className="bg-rose-50 border border-rose-100 p-6 rounded-lg space-y-4">
 <div className="flex justify-between items-start">
 <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Critical Alert</p>
 <AlertCircle className="w-6 h-6 text-rose-600" />
 </div>
 <div className="space-y-1">
 <div className="text-3xl font-black text-rose-900 tabular-nums">04 KH</div>
 <p className="text-[10px] font-bold text-rose-600 uppercase tracking-tighter">Dưới 60% - Cần 1-on-1</p>
 </div>
 </div>
 </DraggableGrid>

 <DraggableGrid className="grid grid-cols-12 gap-8 mt-4" columns={12} gap={32}>
 <div className="col-span-12 lg:col-span-8 bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm">
 <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center px-8">
 <h3 className="font-black text-slate-900 text-sm uppercase tracking-[0.2em]">Bảng theo dõi mục tiêu chi tiết</h3>
 <div className="relative">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
 <input 
 type="text" 
 placeholder="Tìm kiếm KPIs..." 
 className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-64"
 />
 </div>
 </div>
 <div className="overflow-x-auto">
 <table className="w-full">
 <thead>
 <tr className="bg-slate-50/30 border-b border-slate-200 text-left">
 <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nhân sự & Vị trí</th>
 <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chỉ tiêu trọng yếu</th>
 <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Tiến độ (%)</th>
 <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Phân tích AI</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {MOCK_KPIs.map(kpi => {
 const emp = employees.find(e => e.id === kpi.employeeId);
 const progress = (kpi.current / kpi.target) * 100;
 return (
 <tr key={kpi.id} className="hover:bg-slate-50/80 transition-colors group">
 <td className="px-8 py-5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-900 text-sm shadow-sm group-hover:bg-white transition-all">
 {emp?.fullName.split(' ').pop()?.charAt(0)}
 </div>
 <div>
 <p className="text-sm font-black text-slate-900 italic tracking-tight">{emp?.fullName}</p>
 <p className="text-[10px] text-slate-500 font-bold uppercase">{emp?.department}</p>
 </div>
 </div>
 </td>
 <td className="px-8 py-5">
 <p className="text-xs font-bold text-slate-900">{kpi.title}</p>
 <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter">Target: {kpi.target} {kpi.unit}</p>
 </td>
 <td className="px-8 py-5 w-48">
 <div className="space-y-1.5">
 <div className="flex justify-between text-[10px] font-black">
 <span className={cn(progress >= 100 ? "text-emerald-600" : progress >= 80 ? "text-orange-700" : "text-rose-600")}>{progress.toFixed(1)}%</span>
 <span className="text-slate-500 font-mono italic">#{kpi.id.slice(-4)}</span>
 </div>
 <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
 <div 
 className={cn("h-full transition-all duration-1000", progress >= 100 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]" : progress >= 80 ? "bg-slate-800" : "bg-rose-500")} 
 style={{ width: `${Math.min(progress, 100)}%` }} 
 />
 </div>
 </div>
 </td>
 <td className="px-8 py-5 text-right">
 <div className="flex flex-col items-end gap-1">
 <div className={cn(
 "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
 progress >= 100 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
 )}>
 {progress >= 100 ? 'OUTSTANDING' : 'ON TRACK'}
 </div>
 <p className="text-[9px] text-slate-500 italic">Dự báo: 112% (AI)</p>
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 <div className="col-span-12 lg:col-span-4 space-y-8">
 <div className="bg-slate-900 rounded-xl p-8 text-[#FAF9F5] relative overflow-hidden shadow-sm">
 <div className="absolute top-0 right-0 p-4">
 <Trophy className="w-12 h-12 text-[#FAF9F5]/10 rotate-12" />
 </div>
 <h3 className="text-lg font-black italic tracking-widest mb-8 border-l-4 border-amber-400 pl-4">PERFORMANCE LEADERBOARD</h3>
 <div className="space-y-6">
 {[
 { name: 'Hoàng Minh', score: 98, rank: 1, color: 'text-amber-400' },
 { name: 'Thu Thủy', score: 94, rank: 2, color: 'text-slate-500' },
 { name: 'Diệu Nhi', score: 91, rank: 3, color: 'text-orange-400' }
 ].map((p, i) => (
 <div key={i} className="flex items-center justify-between group cursor-pointer hover:bg-white/5 p-3 rounded-lg transition-all">
 <div className="flex items-center gap-4">
 <span className={cn("text-xl font-black w-6", p.color)}>{p.rank}</span>
 <div>
 <p className="text-sm font-bold tracking-tight">{p.name}</p>
 <div className="h-1 w-12 bg-white/10 rounded-full mt-1.5 overflow-hidden">
 <div className="h-full bg-white/40" style={{ width: `${p.score}%` }} />
 </div>
 </div>
 </div>
 <div className="text-right">
 <p className="text-lg font-black tabular-nums">{p.score}</p>
 <p className="text-[9px] text-slate-600 font-bold uppercase">Points</p>
 </div>
 </div>
 ))}
 </div>
 <button className="w-full mt-10 py-5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
 Xem tất cả bảng xếp hạng
 </button>
 </div>

 <div className="bg-white border border-slate-300 rounded-xl p-8 shadow-sm group">
 <div className="flex items-center gap-3 mb-8">
 <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 shadow-sm relative">
 <MapIcon className="w-6 h-6" />
 <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full animate-ping" />
 </div>
 <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Skill Matrix Heatmap</h3>
 </div>
 <div className="aspect-square bg-slate-50 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-8 space-y-4 text-center group-hover:bg-white transition-all duration-500">
 <Layers className="w-16 h-16 text-slate-500 group-hover:text-primary-400 transition-all duration-500" />
 <div>
 <p className="text-xs font-bold text-slate-700">Phân tích Phủ Kỹ năng</p>
 <p className="text-[10px] text-slate-500 mt-2 leading-relaxed italic">Bản đồ nhiệt cho phép người quản lý nhìn ra các lỗ hổng kỹ năng trong từng phòng ban để có chiến lược Training phù hợp.</p>
 </div>
 </div>
 </div>
 </div>
 </DraggableGrid>
 </div>
 )}
 </>
 ) : activeTab === 'payroll' ? (
 <div className="p-8 bg-slate-50 min-h-[500px]">
 <div className="flex justify-between items-center mb-8">
 <div>
 <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900"><Wallet className="w-6 h-6 text-orange-700"/> Quản lý Quỹ lương & Payslip</h2>
 <p className="text-xs text-slate-600 mt-1">Kỳ lương hiển thị: <strong className="text-slate-800">Tháng 03/2024</strong></p>
 </div>
 <div className="flex gap-3">
 <button 
 onClick={() => {
 const results = employees.map(emp => ({
 employeeId: emp.id,
 ...autoCalculatePayroll(emp, [], MOCK_KPIs)
 })); 
 console.table(results); 
 alert("Đã tính lương tự động thành công (Kiểm tra console/table)!");
 }}
 className="bg-primary-600 text-[#FAF9F5] px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-indigo-600/20 active:scale-95 transition-all hover:bg-primary-700">
 <Zap className="w-4 h-4" /> Tính lương AI (Batch)
 </button>
 <button 
 onClick={async () => {
 try {
 const totalPayroll = payrollList.reduce((acc, pay) => acc + pay.netSalary, 0);
 const totalBonus = payrollList.reduce((acc, pay) => acc + pay.bonus, 0);
 
 await addDoc(collection(db, 'finance_transactions'), {
 type: 'expense',
 amount: totalPayroll,
 category: 'Chi phí nhân sự',
 description: `Quyết toán Quỹ lương & Thưởng Tháng 03/2024 (Tổng PN: ${payrollList.length})`,
 date: serverTimestamp(),
 source: 'hrm_payroll'
 });

 if (totalBonus > 0) {
 await addDoc(collection(db, 'finance_transactions'), {
 type: 'expense',
 amount: totalBonus,
 category: 'Thưởng KPI/OT',
 description: `Chi thưởng KPI & OT Tháng 03/2024`,
 date: serverTimestamp(),
 source: 'hrm_bonus'
 });
 }

 alert("Đã kết chuyển dữ liệu lương sang Phân hệ Tài chính thành công!");
 } catch (error) {
 console.error("Error pushing payroll to finance:", error);
 alert("Lỗi kết chuyển dữ liệu.");
 }
 }}
 className="bg-[#2563EB] text-[#FAF9F5] px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/5 active:scale-95 transition-all hover:bg-slate-800 ml-3">
 <ArrowRight className="w-4 h-4" /> Kết chuyển sang Finance (P&L)
 </button>
 <button className="bg-[#111827] text-[#FAF9F5] px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm shadow-slate-900/20 active:scale-95 transition-all hover:bg-slate-800">
 <BadgeDollarSign className="w-4 h-4 text-emerald-400" /> Xuất phiếu lương đồng loạt
 </button>
 </div>
 </div>

 {/* Payroll Dashboard Cards */}
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" columns={4} gap={16}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-slate-100 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10 mb-1">Tổng lương cơ bản</p>
 <p className="text-2xl font-bold text-slate-900 relative z-10">{formatCurrency(payrollList.reduce((acc, pay) => acc + pay.baseSalary, 0))}</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10 mb-1">Tổng Phụ cấp & Thưởng</p>
 <p className="text-2xl font-bold text-emerald-600 relative z-10">+{formatCurrency(payrollList.reduce((acc, pay) => acc + pay.allowance + pay.bonus, 0))}</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10 mb-1">Thuế TNCN & BH</p>
 <p className="text-2xl font-bold text-red-500 relative z-10">-{formatCurrency(payrollList.reduce((acc, pay) => acc + pay.pitAmount + pay.insuranceAmount, 0))}</p>
 </div>
 <div className="bg-gradient-to-br from-[#111827] to-slate-900 p-5 rounded-lg border border-slate-700 shadow-sm relative overflow-hidden group">
 <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest relative z-10 mb-1">Tổng chi trả Thực tế (Net Pay)</p>
 <p className="text-2xl font-bold text-[#FAF9F5] relative z-10">{formatCurrency(payrollList.reduce((acc, pay) => acc + pay.netSalary, 0))}</p>
 </div>
 </DraggableGrid>

 {/* Advanced Payroll Table */}
 <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50/80 border-b border-slate-200">
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">Mã / Tên Nhân viên</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Lương Cơ bản</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Thưởng / Phụ cấp</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Khấu trừ (Thuế, BH)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Thực lãnh</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center">Trạng thái</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Bảng lương</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {payrollList.map((pay) => (
 <tr key={pay.id} className="hover:bg-slate-100/30 transition-colors group">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-slate-900">{pay.employeeName}</p>
 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">{pay.employeeId}</p>
 </td>
 <td className="px-6 py-4 text-right font-mono font-bold text-sm text-slate-700">{formatCurrency(pay.baseSalary)}</td>
 <td className="px-6 py-4 text-right">
 <p className="text-xs font-bold text-emerald-600 font-mono">+{formatCurrency(pay.allowance + pay.bonus)}</p>
 {pay.bonus > 0 && <span className="text-[9px] font-bold text-emerald-500 opacity-60">Gồm {formatCurrency(pay.bonus)} KPI/OT</span>}
 </td>
 <td className="px-6 py-4 text-right">
 <p className="text-xs font-bold text-red-500 font-mono">-{formatCurrency(pay.pitAmount + pay.insuranceAmount)}</p>
 </td>
 <td className="px-6 py-4 text-right">
 <p className="text-[15px] font-bold text-[#2563EB] font-mono bg-slate-100 px-3 py-1 rounded-lg inline-block">{formatCurrency(pay.netSalary)}</p>
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
 <button 
 onClick={() => {
 setEditingPayrollId(pay.id);
 setEditPayrollForm(pay);
 }}
 className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-[10px] font-bold hover:bg-primary-100 transition-all flex items-center gap-1.5 ml-auto border border-primary-100"
 >
 <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
 </button>
 </td>
 </tr>
 ))}
 {payrollList.length === 0 && (
 <tr>
 <td colSpan={7} className="px-6 py-12 text-center text-slate-600">
 Không có dữ liệu bảng lương trong kỳ này.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs text-slate-600 font-medium flex justify-between items-center">
 <p className="flex items-center gap-1.5">
 <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dữ liệu đã được đồng bộ với module Chấm công & KPI.
 </p>
 <p>Tổng số bản ghi: <strong>{payrollList.length}</strong></p>
 </div>
 </div>

 {/* Edit Payroll Modal */}
 {editingPayrollId && editPayrollForm && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
 <div className="bg-white rounded-xl shadow-sm w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
 <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <h3 className="text-lg font-bold text-slate-900">Cập nhật Lương ({editPayrollForm.employeeName})</h3>
 <button onClick={() => setEditingPayrollId(null)} className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>
 <div className="p-6 overflow-y-auto max-h-[70vh]">
 {aiPayrollSuggestion && (
 <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-3">
 <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
 <div>
 <h4 className="font-bold text-purple-900 text-sm mb-1">AI Phân tích & Đề xuất lương</h4>
 <div className="text-sm text-purple-800 whitespace-pre-line leading-relaxed">{aiPayrollSuggestion}</div>
 </div>
 <button onClick={() => setAiPayrollSuggestion(null)} className="ml-auto text-purple-400 hover:text-purple-600">
 <X className="w-4 h-4" />
 </button>
 </div>
 )}
 <div className="grid grid-cols-2 gap-6">
 <div>
 <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Lương cơ bản</label>
 <input type="number" 
 value={editPayrollForm.baseSalary || 0}
 onChange={(e) => {
 const val = Number(e.target.value);
 setEditPayrollForm(prev => {
 const updated = { ...prev, baseSalary: val };
 updated.pitAmount = ((updated.baseSalary || 0) + (prev.allowance || 0) + (prev.bonus || 0) - (prev.deduction || 0)) * 0.05;
 updated.insuranceAmount = (updated.baseSalary || 0) * 0.1;
 updated.netSalary = (updated.baseSalary || 0) + (prev.allowance || 0) + (prev.bonus || 0) - (prev.deduction || 0) - updated.pitAmount - updated.insuranceAmount;
 return updated;
 });
 }}
 className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-600" />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Phụ cấp</label>
 <input type="number" 
 value={editPayrollForm.allowance || 0}
 onChange={(e) => {
 const val = Number(e.target.value);
 setEditPayrollForm(prev => {
 const updated = { ...prev, allowance: val };
 updated.pitAmount = ((prev.baseSalary || 0) + (updated.allowance || 0) + (prev.bonus || 0) - (prev.deduction || 0)) * 0.05;
 updated.netSalary = (prev.baseSalary || 0) + (updated.allowance || 0) + (prev.bonus || 0) - (prev.deduction || 0) - updated.pitAmount - (prev.insuranceAmount || 0);
 return updated;
 });
 }}
 className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-600" />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Thưởng (OT, KPI...)</label>
 <input type="number" 
 value={editPayrollForm.bonus || 0}
 onChange={(e) => {
 const val = Number(e.target.value);
 setEditPayrollForm(prev => {
 const updated = { ...prev, bonus: val };
 updated.pitAmount = ((prev.baseSalary || 0) + (prev.allowance || 0) + (updated.bonus || 0) - (prev.deduction || 0)) * 0.05;
 updated.netSalary = (prev.baseSalary || 0) + (prev.allowance || 0) + (updated.bonus || 0) - (prev.deduction || 0) - updated.pitAmount - (prev.insuranceAmount || 0);
 return updated;
 });
 }}
 className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-slate-900 bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Phạt (Đi trễ, vắng...)</label>
 <input type="number" 
 value={editPayrollForm.deduction || 0}
 onChange={(e) => {
 const val = Number(e.target.value);
 setEditPayrollForm(prev => {
 const updated = { ...prev, deduction: val };
 updated.pitAmount = ((prev.baseSalary || 0) + (prev.allowance || 0) + (prev.bonus || 0) - (updated.deduction || 0)) * 0.05;
 updated.netSalary = (prev.baseSalary || 0) + (prev.allowance || 0) + (prev.bonus || 0) - (updated.deduction || 0) - updated.pitAmount - (prev.insuranceAmount || 0);
 return updated;
 });
 }}
 className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-slate-900 bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500" />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Thuế TNCN (-)</label>
 <input type="number" 
 value={editPayrollForm.pitAmount || 0}
 onChange={(e) => {
 const val = Number(e.target.value);
 setEditPayrollForm(prev => {
 const updated = { ...prev, pitAmount: val };
 updated.netSalary = (prev.baseSalary || 0) + (prev.allowance || 0) + (prev.bonus || 0) - (prev.deduction || 0) - (updated.pitAmount || 0) - (prev.insuranceAmount || 0);
 return updated;
 });
 }}
 className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500" />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">Bảo hiểm xã hội (-)</label>
 <input type="number" 
 value={editPayrollForm.insuranceAmount || 0}
 onChange={(e) => {
 const val = Number(e.target.value);
 setEditPayrollForm(prev => {
 const updated = { ...prev, insuranceAmount: val };
 updated.netSalary = (prev.baseSalary || 0) + (prev.allowance || 0) + (prev.bonus || 0) - (prev.deduction || 0) - (prev.pitAmount || 0) - (updated.insuranceAmount || 0);
 return updated;
 });
 }}
 className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-slate-900 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500" />
 </div>
 </div>
 
 <div className="mt-8 p-6 bg-slate-900 rounded-xl shadow-inner border border-slate-700 flex justify-between items-center text-[#FAF9F5] relative overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/10 rounded-full blur-2xl flex-shrink-0" />
 <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl flex-shrink-0" />
 <div className="relative z-10">
 <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Thực lãnh (Net Salary)</p>
 <p className="text-sm font-medium text-slate-500">Đã trừ Thuế & BHXH</p>
 </div>
 <div className="relative z-10">
 <p className="text-4xl font-black font-mono tracking-tight">{formatCurrency(editPayrollForm.netSalary || 0)}</p>
 </div>
 </div>
 </div>
 <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end rounded-b-xl">
 <button 
 onClick={() => {
 const empKpi = MOCK_KPIs.find(k => k.employeeId === editPayrollForm.employeeId);
 let suggestBonus = editPayrollForm.bonus || 0;
 let suggestDed = editPayrollForm.deduction || 0;
 let notes = [];

 if (empKpi) {
 const cp = empKpi.current / empKpi.target;
 if (cp >= 1) {
 suggestBonus += 3000000;
 notes.push(`• Vượt KPI (${Math.round(cp*100)}%): Đề xuất cộng thêm hiện tại vào thưởng (VD: 3,000,000 ₫).`);
 } else if (cp < 0.8) {
 suggestDed += 1000000;
 notes.push(`• Không đạt KPI (< 80%): Đề xuất áp dụng mức trừ 1,000,000 ₫.`);
 } else {
 notes.push(`• Đạt KPI cơ bản (${Math.round(cp*100)}%).`);
 }
 }
 const attends = filteredAttendance.filter(a => a.employeeId === editPayrollForm.employeeId && a.checkIn > '08:30');
 if (attends.length > 0) {
 suggestDed += attends.length * 200000;
 notes.push(`• Vi phạm chấm công (đi trễ > 8:30, ${attends.length} lần): Đề xuất phạt ${formatCurrency(attends.length * 200000)}.`);
 }

 if (notes.length === 0) {
 notes.push('• Không có đề xuất thay đổi dựa trên dữ liệu hiện tại.');
 }
 
 setAiPayrollSuggestion(notes.join('\n'));
 
 setEditPayrollForm(prev => {
 const p = { ...prev, bonus: suggestBonus, deduction: suggestDed };
 p.pitAmount = ((p.baseSalary || 0) + (p.allowance || 0) + (p.bonus || 0) - (p.deduction || 0)) * 0.05;
 p.netSalary = (p.baseSalary || 0) + (p.allowance || 0) + (p.bonus || 0) - (p.deduction || 0) - (p.pitAmount || 0) - (p.insuranceAmount || 0);
 return p;
 });
 }}
 className="px-5 py-2.5 text-sm font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors shadow-sm flex items-center gap-2 mr-auto"
 >
 <Sparkles className="w-4 h-4" /> Phân tích AI
 </button>
 <button onClick={() => { setEditingPayrollId(null); setAiPayrollSuggestion(null); }} className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-sm">
 Hủy
 </button>
 <button 
 onClick={() => {
 setPayrollList(prev => prev.map(p => p.id === editingPayrollId ? editPayrollForm as Payroll : p));
 setEditingPayrollId(null);
 setAiPayrollSuggestion(null);
 }}
 className="px-6 py-2.5 text-sm font-bold text-[#FAF9F5] bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm shadow-slate-900/5 flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4" /> Lưu bảng lương
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 ) : activeTab === 'rec_candidates' ? (
 <div className="p-6 bg-slate-50 min-h-[500px]">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-xl font-bold flex items-center gap-2"><UserPlus className="w-6 h-6 text-primary-600"/> ATS Pipeline</h2>
 <button className="bg-primary-600 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 transition">Thêm ứng viên</button>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {(['sourced', 'interview', 'offered', 'hired'] as const).map(status => (
 <div 
 key={status} 
 className="bg-slate-100/50 rounded-lg p-4 border border-slate-300"
 onDragOver={handleDragOver}
 onDrop={(e) => handleDrop(e, status)}
 >
 <div className="flex justify-between items-center mb-4">
 <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">
 {status === 'sourced' ? 'Sourced' : status === 'interview' ? 'Phỏng vấn' : status === 'offered' ? 'Đề nghị' : 'Đã tuyển'}
 </h3>
 <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600 shadow-sm">
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
 className="bg-white p-4 rounded-lg shadow-sm border border-slate-300 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow relative overflow-hidden"
 >
 <div className={cn("absolute top-0 left-0 w-1 h-full", 
 candidate.matchScore >= 90 ? "bg-emerald-500" : 
 candidate.matchScore >= 80 ? "bg-slate-800" : "bg-amber-500"
 )} />
 <div className="pl-2">
 <div className="flex justify-between items-start mb-2">
 <p className="font-bold text-sm text-[#111827]">{candidate.name}</p>
 <span className="text-[10px] font-bold text-slate-500 font-mono">{candidate.id}</span>
 </div>
 <p className="text-xs font-medium text-slate-700 mb-3">{candidate.role}</p>
 <div className="flex justify-between items-center">
 <div className="flex -space-x-2">
 <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[8px] font-bold text-slate-600">HR</div>
 <div className="w-6 h-6 rounded-full bg-primary-100 border-2 border-white flex items-center justify-center text-[8px] font-bold text-primary-600">AI</div>
 </div>
 <span className={cn(
 "px-2 py-1 rounded-md text-[10px] font-bold",
 candidate.matchScore >= 90 ? "bg-emerald-50 text-emerald-600" : 
 candidate.matchScore >= 80 ? "bg-slate-100 text-orange-700" : "bg-amber-50 text-amber-600"
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
 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
 <Rocket className="w-10 h-10 text-orange-600" />
 </div>
 <h3 className="text-xl font-bold text-slate-900 mb-2">Phân hệ đang được phát triển</h3>
 <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
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
 className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-sm z-50 border-l border-slate-300 flex flex-col overflow-y-auto"
 >
 <div className="p-8 border-b border-slate-200 flex justify-between items-start bg-white to-white sticky top-0 z-10">
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
 <button onClick={() => setSelectedEmployee(null)} className="p-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-full transition-colors text-slate-600 shadow-sm active:scale-95">
 <span className="sr-only">Đóng</span>
 <X className="w-5 h-5" />
 </button>
 </div>
 
 <div className="p-8 space-y-10 flex-1">
 {/* Roles - Admin only */}
 {isAdmin && (
 <div className="space-y-6">
 <div className="space-y-4">
 <h3 className="font-bold tracking-widest uppercase text-[11px] text-slate-500 flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-emerald-500"/> Vai trò & Phân quyền
 </h3>
 <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 flex items-center justify-between">
 <div>
 <p className="text-sm font-bold text-slate-900">Cấp quyền hệ thống</p>
 <p className="text-xs text-slate-600 mt-1">Chỉnh sửa vai trò truy cập của nhân viên trên hệ thống ERP.</p>
 </div>
 <select 
 className="bg-white border text-sm font-semibold border-slate-300 text-slate-800 py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-slate-900 shadow-sm transition-all"
 value={selectedEmployee.role || 'Nhân viên'}
 onChange={(e) => handleRoleChange(selectedEmployee.id, e.target.value)}
 >
 <option value="Nhân viên">Nhân viên</option>
 <option value="Quản lý">Quản lý</option>
 <option value="Admin">Admin</option>
 </select>
 </div>
 </div>
 
 <div className="bg-slate-50 p-4 rounded-xl border border-slate-300 space-y-4">
 <h4 className="text-sm font-bold text-slate-900">Phân quyền chi tiết (Permissions)</h4>
 <div className="space-y-3">
 {Object.entries({
 personnel: 'Thông tin nhân sự',
 attendance: 'Chấm công',
 payroll: 'Lương & Thưởng',
 kpi: 'Đánh giá KPI',
 rewards: 'Khen thưởng'
 }).map(([catKey, catName]) => {
 const employeePerms = selectedEmployee.permissions?.[catKey] || { read: false, create: false, update: false, delete: false };
 return (
 <div key={catKey} className="flex items-center justify-between py-2 border-b border-slate-200 last:border-0 last:pb-0">
 <span className="text-xs font-semibold text-slate-700 w-32">{catName}</span>
 <div className="flex gap-4">
 {['read', 'create', 'update', 'delete'].map(pAction => {
 let label = '';
 if (pAction === 'read') label = 'Xem';
 if (pAction === 'create') label = 'Tạo';
 if (pAction === 'update') label = 'Sửa';
 if (pAction === 'delete') label = 'Xóa';
 return (
 <label key={pAction} className="flex items-center gap-1.5 cursor-pointer">
 <input 
 type="checkbox" 
 className="w-3.5 h-3.5 text-orange-700 rounded border-slate-400 focus:ring-orange-600/20 transition-all cursor-pointer"
 checked={employeePerms[pAction as keyof typeof employeePerms]}
 onChange={(e) => handlePermissionChange(selectedEmployee.id, catKey, pAction as any, e.target.checked)}
 />
 <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600">{label}</span>
 </label>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>
 )}

 {/* Skill Radar */}
 <div className="space-y-4">
 <h3 className="font-bold tracking-widest uppercase text-[11px] text-slate-500 flex items-center gap-2">
 <BrainCircuit className="w-4 h-4 text-orange-600"/> Skill Matrix (Radar)
 </h3>
 <div className="h-64 bg-slate-50 rounded-xl border border-slate-300 p-4 relative shadow-sm">
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
 <div key={i} className="px-3 py-1.5 bg-slate-100 text-orange-800 rounded-lg border border-slate-300 flex items-center justify-between gap-3 text-xs flex-1 min-w-[140px]">
 <span className="font-bold">{s.name}</span>
 <span className="font-mono">{s.level}%</span>
 </div>
 ))}
 </div>
 </div>

 {/* Contracts */}
 <div className="space-y-4">
 <h3 className="font-bold tracking-widest uppercase text-xs text-slate-500 flex items-center gap-2">
 <FileText className="w-4 h-4 text-purple-500"/> Lịch sử Hợp đồng
 </h3>
 <div className="space-y-2">
 {selectedEmployee.contracts?.map((c, i) => (
 <div key={i} className="bg-slate-50 border border-slate-200 rounded-lg p-3">
 <p className="text-xs font-bold text-slate-900 mb-1">{c.type}</p>
 <div className="flex justify-between items-center text-[10px] text-slate-600 uppercase font-mono">
 <span>Ký: {c.signDate}</span>
 <span className="text-orange-600 font-bold">Hết hạn: {c.expiryDate}</span>
 </div>
 </div>
 ))}
 {(!selectedEmployee.contracts || selectedEmployee.contracts.length === 0) && (
 <p className="text-xs text-slate-500 italic">Chưa có dữ liệu hợp đồng</p>
 )}
 </div>
 </div>

 {/* Timeline */}
 <div className="space-y-4">
 <h3 className="font-bold tracking-widest uppercase text-xs text-slate-500 flex items-center gap-2">
 <Clock className="w-4 h-4 text-emerald-500"/> Timeline Công tác
 </h3>
 <div className="pl-4 border-l-2 border-slate-200 space-y-6 relative ml-2">
 <div className="relative">
 <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-800 border-2 border-white shadow-sm" />
 <p className="text-xs font-bold text-slate-900">Cập nhật Lương</p>
 <p className="text-[10px] text-slate-600 font-medium">Tăng 15% lương cơ bản</p>
 <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">11/2023</p>
 </div>
 <div className="relative">
 <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm" />
 <p className="text-xs font-bold text-slate-900">Thăng tiến</p>
 <p className="text-[10px] text-slate-600 font-medium">Lên vị trí: {selectedEmployee.position}</p>
 <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">08/2023</p>
 </div>
 <div className="relative">
 <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white shadow-sm" />
 <p className="text-xs font-bold text-slate-900">Gia nhập công ty</p>
 <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">{selectedEmployee.joinDate}</p>
 </div>
 </div>
 </div>

 {/* AI Insight */}
 <div className="p-5 bg-white border border-primary-100/50 rounded-lg relative overflow-hidden">
 <div className="relative z-10">
 <h3 className="font-bold tracking-widest uppercase text-[10px] text-primary-500 flex items-center gap-1.5 mb-2">
 <Sparkles className="w-3 h-3"/> AI Sentiment Insight
 </h3>
 <p className="text-sm font-medium text-slate-800 leading-relaxed">
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
 className="w-[380px] h-[500px] bg-white rounded-lg shadow-sm border border-slate-300 overflow-hidden flex flex-col"
 >
 <div className="p-4 bg-[#111827] text-[#FAF9F5] flex justify-between items-center">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-800/20 rounded-lg">
 <BrainCircuit className="w-5 h-5 text-orange-500" />
 </div>
 <div>
 <h3 className="font-bold text-sm">HR Copilot</h3>
 <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Online</p>
 </div>
 </div>
 <button onClick={() => setIsCopilotOpen(false)} className="text-slate-500 hover:text-[#FAF9F5] transition">
 <ArrowLeft className="w-5 h-5 rotate-180" />
 </button>
 </div>
 
 <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
 {copilotMessages.map((msg, idx) => (
 <div key={idx} className={cn("flex max-w-[85%]", msg.role === 'user' ? "ml-auto justify-end" : "")}>
 <div className={cn("p-3 rounded-lg text-sm font-medium leading-relaxed relative", 
 msg.role === 'user' ? "bg-slate-900 text-[#FAF9F5] rounded-tr-sm" : "bg-white border border-slate-300 text-slate-800 rounded-tl-sm shadow-sm"
 )}>
 {msg.content}
 </div>
 </div>
 ))}
 </div>

 <div className="p-4 bg-white border-t border-slate-200">
 <div className="flex items-center bg-slate-100 rounded-full pr-1.5 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-orange-600 transition-all">
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
 className="p-2 bg-slate-900 hover:bg-slate-800 text-[#FAF9F5] rounded-full transition-colors shadow-sm"
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
 className="w-14 h-14 bg-slate-900 rounded-full shadow-sm text-[#FAF9F5] flex items-center justify-center relative group"
 >
 <div className="absolute inset-0 bg-blue-400 rounded-full animate-ping opacity-20" />
 {isCopilotOpen ? <ArrowLeft className="w-6 h-6 rotate-180" /> : <BrainCircuit className="w-6 h-6" />}
 </motion.button>
 </div>
 <AnimatePresence>
 {showATSModal && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-lg w-full max-w-4xl p-8 shadow-sm">
 <div className="flex justify-between items-center mb-6">
 <h2 className="text-2xl font-bold text-[#111827]">Quản lý Tuyển dụng (ATS) - {
 activeATSView === 'request' ? 'Đề xuất tuyển dụng' : 
 activeATSView === 'candidates' ? 'Hồ sơ ứng viên' : 
 activeATSView === 'interview' ? 'Lịch phỏng vấn' : 'Email ứng viên'
 }</h2>
 <button onClick={() => setShowATSModal(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><X className="w-6 h-6" /></button>
 </div>
 <div className="flex gap-4 mb-8 border-b border-slate-200 pb-4">
 {['request', 'candidates', 'interview', 'email'].map(t => (
 <button key={t} onClick={() => setActiveATSView(t as any)} className={cn("px-5 py-2.5 text-sm font-bold rounded-lg transition-all", activeATSView === t ? 'bg-primary-600 text-[#FAF9F5] shadow-sm' : 'bg-slate-50 border border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-primary-600')}>
 {t === 'request' ? 'Đề xuất' : t === 'candidates' ? 'Ứng viên' : t === 'interview' ? 'Lịch phỏng vấn' : 'Email'}
 </button>
 ))}
 </div>
 <div className="min-h-[500px]">
 {activeATSView === 'candidates' && (
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 h-full">
 {(['sourced', 'interview', 'offered', 'hired'] as const).map(status => (
 <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} className="bg-slate-50/80 rounded-lg p-5 border border-slate-300 flex flex-col h-[500px]">
 <div className="flex justify-between items-center mb-5">
 <h3 className="font-bold text-slate-800 uppercase tracking-widest text-xs">
 {status === 'sourced' ? 'Sourced' : status === 'interview' ? 'Phỏng vấn' : status === 'offered' ? 'Đề nghị' : 'Đã tuyển'}
 </h3>
 <span className="bg-white px-2.5 py-1 rounded-full text-xs font-bold text-slate-600 shadow-sm border border-slate-200">
 {candidates.filter(c => c.status === status).length}
 </span>
 </div>
 <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
 <AnimatePresence>
 {candidates.filter(c => c.status === status).map(c => (
 <motion.div
 layout
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 key={c.id} draggable onDragStart={(e: any) => handleDragStart(e, c.id)} 
 className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-sm hover:border-primary-300 transition-all relative overflow-hidden group"
 >
 <div className={cn("absolute top-0 left-0 w-1.5 h-full transition-colors", 
 c.matchScore >= 90 ? "bg-emerald-500" : 
 c.matchScore >= 80 ? "bg-slate-800" : "bg-amber-500"
 )} />
 <div className="pl-3">
 <p className="font-bold text-sm text-slate-900 mb-1 line-clamp-1">{c.name}</p>
 <div className="flex justify-between items-end mt-3">
 <div>
 <span className="text-xs font-semibold text-slate-600 block mb-1">{c.role}</span>
 <span className="text-[10px] font-mono text-slate-500">{c.id}</span>
 </div>
 <div className={cn("px-2 py-1 flex items-center justify-center rounded-lg font-bold text-[10px]", 
 c.matchScore >= 90 ? "bg-emerald-50 text-emerald-700" : 
 c.matchScore >= 80 ? "bg-slate-100 text-orange-800" : "bg-amber-50 text-amber-700"
 )}>
 Fit {c.matchScore}%
 </div>
 </div>
 </div>
 </motion.div>
 ))}
 </AnimatePresence>
 </div>
 </div>
 ))}
 </div>
 )}
 {/* Add placeholders for other views */}
 {activeATSView !== 'candidates' && <div className="flex items-center justify-center h-full text-slate-500 text-sm mt-20 font-medium">Nội dung chức năng {activeATSView} đang được xây dựng...</div>}
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>
 </div>
 );
}