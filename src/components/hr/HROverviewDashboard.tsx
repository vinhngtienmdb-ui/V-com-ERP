import React, { useState } from 'react';
import { 
  Activity, 
  Fingerprint, 
  Calculator, 
  CheckSquare, 
  Users, 
  Sparkles,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { HRPulseBar } from './HRPulseBar';
import { HRAttendanceRadar } from './HRAttendanceRadar';
import { HRPayrollSimulator } from './HRPayrollSimulator';
import { HRApprovalBoard } from './HRApprovalBoard';
import { HREmployeeDirectoryGlass } from './HREmployeeDirectoryGlass';
import { HREmployeePassportModal, EmployeePassportData } from './HREmployeePassportModal';
import { cn } from '../../lib/utils';

const MOCK_PASSPORT_EMPLOYEES: EmployeePassportData[] = [
  {
    id: 'emp-001',
    employeeCode: 'EMP-001',
    fullName: 'Lê Hoàng Minh',
    department: 'Vận hành Sàn',
    position: 'Quản lý kho',
    status: 'ACTIVE',
    gender: 'Nam',
    birthDate: '12/08/1995',
    identityCard: '001095001234',
    identityDate: '20/10/2021',
    identityPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Số 15 Doãn Kế Thiện, Mai Dịch, Cầu Giấy, Hà Nội',
    currentAddress: 'Chung cư Hateco Apollo, Nam Từ Liêm, Hà Nội',
    email: 'minh.lh@vcomm.vn',
    phone: '0901234567',
    bankAccount: '1903456789012',
    bankName: 'Techcombank',
    bankBeneficiary: 'LE HOANG MINH',
    taxCode: '8532456789',
    insuranceBookNo: '0116123456',
    contractType: 'HĐLĐ xác định thời hạn 1 năm',
    contractNumber: 'HDLD-2024/001-VCOMM',
    contractSignDate: '15/01/2024',
    contractExpiryDate: '14/01/2025',
    rsaHash: 'a7f92b4c5e8d1a3f6b9c2e4d7a8b1c3e5f8a2b4c6d8e1f3a5b7c9d1e3f5a7b9c',
    baseSalary: 18000000,
    allowance: 2500000,
    leaveTotal: 12,
    leaveUsed: 3,
    skills: [
      { name: 'Logistics WMS', level: 92 },
      { name: 'Quản lý kho bãi', level: 88 },
      { name: 'Vận hành iPOS', level: 80 }
    ]
  },
  {
    id: 'emp-002',
    employeeCode: 'EMP-002',
    fullName: 'Nguyễn Diệu Nhi',
    department: 'Marketing',
    position: 'KOL Specialist',
    status: 'ACTIVE',
    gender: 'Nữ',
    birthDate: '24/09/1998',
    identityCard: '031098005678',
    identityDate: '15/03/2019',
    identityPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Đường Lê Lợi, Bến Thành, Quận 1, TP. Hồ Chí Minh',
    currentAddress: 'Vinhomes Ocean Park, Gia Lâm, Hà Nội',
    email: 'nhi.nd@vcomm.vn',
    phone: '0987123456',
    bankAccount: '1023456789',
    bankName: 'Vietcombank',
    bankBeneficiary: 'NGUYEN DIEU NHI',
    taxCode: '8612345678',
    insuranceBookNo: '0218654321',
    contractType: 'HĐLĐ không xác định thời hạn',
    contractNumber: 'HDLD-2023/089-VCOMM',
    contractSignDate: '01/06/2023',
    contractExpiryDate: '',
    rsaHash: 'c4e6f8a1b3d5e7a9b2c4d6f8a1b3c5e7a9b2d4f6a8b1c3e5a7b9c1d3e5f7a9b1',
    baseSalary: 22000000,
    allowance: 3000000,
    leaveTotal: 14,
    leaveUsed: 5,
    skills: [
      { name: 'Influencer Marketing', level: 95 },
      { name: 'Content & Live Commerce', level: 90 },
      { name: 'VComm Live Commerce Growth', level: 85 }
    ]
  },
  {
    id: 'emp-003',
    employeeCode: 'EMP-003',
    fullName: 'Trần Văn Tuấn',
    department: 'Kỹ thuật',
    position: 'Senior Backend Engineer',
    status: 'ACTIVE',
    gender: 'Nam',
    birthDate: '10/05/1994',
    identityCard: '001094008765',
    identityDate: '12/04/2020',
    identityPlace: 'Cục Cảnh sát QLHC về TTXH',
    permanentAddress: 'Phố Huế, Hàng Bài, Hoàn Kiếm, Hà Nội',
    currentAddress: 'Số 88 Cầu Giấy, Hà Nội',
    email: 'tuan.tv@vcomm.vn',
    phone: '0912889900',
    bankAccount: '098877665544',
    bankName: 'MB Bank',
    bankBeneficiary: 'TRAN VAN TUAN',
    taxCode: '8912349988',
    insuranceBookNo: '0115566778',
    contractType: 'HĐLĐ xác định thời hạn 3 năm',
    contractNumber: 'HDLD-2024/015-VCOMM',
    contractSignDate: '01/03/2024',
    contractExpiryDate: '28/02/2027',
    rsaHash: 'b1d3e5f7a9c2e4a6f8b1d3e5a7c9e1f3a5b7d9f1a3c5e7a9b1d3f5a7c9e1f3a5',
    baseSalary: 35000000,
    allowance: 4000000,
    leaveTotal: 15,
    leaveUsed: 2,
    skills: [
      { name: 'NestJS & TypeScript', level: 96 },
      { name: 'PostgreSQL & Supabase', level: 94 },
      { name: 'High-traffic Architecture', level: 89 }
    ]
  }
];

export function HROverviewDashboard() {
  const [activeSection, setActiveSection] = useState<'radar' | 'payroll' | 'approvals' | 'directory'>('radar');
  const [selectedPassportEmployee, setSelectedPassportEmployee] = useState<EmployeePassportData | null>(null);
  const [isPassportOpen, setIsPassportOpen] = useState(false);

  const handleOpenPassport = (emp: EmployeePassportData) => {
    setSelectedPassportEmployee(emp);
    setIsPassportOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      {/* 1. Signature Pulse Bar */}
      <HRPulseBar
        totalEmployees={MOCK_PASSPORT_EMPLOYEES.length}
        activeToday={MOCK_PASSPORT_EMPLOYEES.length}
        onLeave={1}
        lateToday={1}
        onAddEmployee={() => handleOpenPassport(MOCK_PASSPORT_EMPLOYEES[0])}
        onOpenAttendance={() => setActiveSection('radar')}
      />

      {/* 2. Floating Signature Module Navigation Tabs */}
      <div className="flex items-center justify-between p-2 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-md shadow-slate-200/40">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold w-full sm:w-auto">
          {[
            { id: 'radar', label: 'Radar Chấm công', icon: Fingerprint },
            { id: 'payroll', label: 'Mô phỏng Lương & Thuế', icon: Calculator },
            { id: 'approvals', label: 'Bảng Phê duyệt Đơn từ', icon: CheckSquare },
            { id: 'directory', label: 'Danh bạ Digital Passport', icon: Users },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all cursor-pointer shrink-0",
                  activeSection === tab.id
                    ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                )}
              >
                <Icon className={cn("w-4 h-4", activeSection === tab.id ? "text-indigo-400" : "text-slate-400")} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Dynamic Section Content */}
      <div className="transition-all">
        {activeSection === 'radar' && <HRAttendanceRadar />}
        {activeSection === 'payroll' && <HRPayrollSimulator />}
        {activeSection === 'approvals' && <HRApprovalBoard />}
        {activeSection === 'directory' && (
          <HREmployeeDirectoryGlass
            employees={MOCK_PASSPORT_EMPLOYEES}
            onSelectEmployee={handleOpenPassport}
          />
        )}
      </div>

      {/* 4. Digital Passport 360 Modal */}
      <HREmployeePassportModal
        employee={selectedPassportEmployee}
        isOpen={isPassportOpen}
        onClose={() => setIsPassportOpen(false)}
      />
    </div>
  );
}
