import type { Employee, AttendanceRecord, Payroll, KPI, Team } from '../../types/erp';
import type { AttendanceSetting, Candidate } from './types';

export const MOCK_EMPLOYEES: Employee[] = [
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
    recentSentiment: 'positive',
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
    recentSentiment: 'critical',
  },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
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
    deviceInfo: 'Face Terminal 01',
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
    deviceInfo: 'VComm ERP_Office_5G',
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
    deviceInfo: 'GPS App (±5m)',
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
    deviceInfo: 'QR Dynamic Scan',
  },
];

export const MOCK_PAYROLL: Payroll[] = [
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
    status: 'pending',
  },
];

export const MOCK_KPIs: KPI[] = [
  {
    id: 'KPI-001',
    employeeId: 'EMP-001',
    title: 'Tỷ lệ xuất/nhập kho đúng hạn',
    target: 95,
    current: 92.5,
    unit: '%',
    period: 'Q1/2024',
  },
  {
    id: 'KPI-002',
    employeeId: 'EMP-002',
    title: 'Lượt tiếp cận chiến dịch mới',
    target: 500000,
    current: 580000,
    unit: 'reach',
    period: '03/2024',
  },
];

export const MOCK_TEAMS: Team[] = [
  { id: 'TEAM-001', name: 'CSKH Nội địa', type: 'CustomerService', managerId: 'EMP-001', memberIds: ['EMP-002'] },
  { id: 'TEAM-002', name: 'CSKH Quốc tế', type: 'CustomerService', managerId: 'EMP-001', memberIds: [] },
  { id: 'TEAM-003', name: 'Kinh doanh 1', type: 'Sales', managerId: 'EMP-001', memberIds: [] },
];

export const HR_METRICS_DATA = [
  { month: 'T1', attrition: 2.1, hiring: 15, late: 45, absent: 12 },
  { month: 'T2', attrition: 1.8, hiring: 12, late: 38, absent: 8 },
  { month: 'T3', attrition: 2.4, hiring: 20, late: 52, absent: 15 },
  { month: 'T4', attrition: 1.5, hiring: 8, late: 30, absent: 5 },
  { month: 'T5', attrition: 1.9, hiring: 18, late: 40, absent: 10 },
  { month: 'T6', attrition: 1.2, hiring: 25, late: 25, absent: 4 },
];

export const INITIAL_ATTENDANCE_SETTINGS: AttendanceSetting[] = [
  {
    method: 'gps',
    enabled: true,
    config: {
      radius: 100,
      zones: [
        { name: 'Trụ sở chính', lat: 21.0285, lng: 105.8542, radius: 100 },
        { name: 'Kho Long Biên', lat: 21.0385, lng: 105.8942, radius: 200 },
      ],
    },
  },
  {
    method: 'wifi',
    enabled: false,
    config: {
      ssids: ['VComm ERP_Office_5G', 'VComm ERP_Warehouse'],
      macRestricted: true,
    },
  },
  {
    method: 'face',
    enabled: true,
    config: {
      minMatch: 0.8,
      livenessCheck: true,
      antiSpoofing: true,
      autoCapture: true,
    },
  },
  {
    method: 'qr',
    enabled: true,
    config: {
      refreshRate: 30,
      encryption: 'AES-256',
      dynamicSalt: true,
    },
  },
  {
    method: 'device',
    enabled: true,
    config: {
      ip: '192.168.1.200',
      port: 4370,
      model: 'ZKTeco K40',
      syncInterval: 15,
    },
  },
];

export const INITIAL_CANDIDATES: Candidate[] = [
  { id: 'C-001', name: 'Nguyễn Văn A', role: 'Frontend Dev', status: 'sourced', matchScore: 85 },
  { id: 'C-002', name: 'Trần Thị B', role: 'UX Designer', status: 'interview', matchScore: 92 },
  { id: 'C-003', name: 'Lê C', role: 'Product Manager', status: 'offered', matchScore: 98 },
  { id: 'C-004', name: 'Hoàng D', role: 'Backend Dev', status: 'sourced', matchScore: 78 },
  { id: 'C-005', name: 'Phạm E', role: 'Marketing Lead', status: 'interview', matchScore: 88 },
];
