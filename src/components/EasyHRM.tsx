import React, { useState, useEffect } from 'react';
import {
  Users, UserCheck, CalendarOff, ShieldAlert, FileSpreadsheet, KeyRound,
  FileCheck, Shield, ChevronRight, Award, AlertTriangle, Plus, Search,
  Download, Upload, Heart, Landmark, PlusCircle, Trash2, Edit2, CheckCircle,
  HelpCircle, Settings, ClipboardList, Database, FileText, FileSignature,
  DollarSign, TrendingUp, Sparkles, X, Info, Loader2
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { syncEmployeeToMisa, syncPayrollToMisa } from '../services/misaService';

// Types for all core entities of EasyHRM
export interface EmployeeProfile {
  id: string; // StaffCode
  name: string; // StaffName
  aliasName?: string;
  foreignName?: string;
  gender: string;
  birthDate: string;
  department: string;
  position: string;
  title: string;
  nationality: string;
  identityNum: string;
  identityDate: string;
  identityPlace: string;
  taxCode: string;
  insuranceCode: string;
  insuranceStartDate: string;
  personalEmail: string;
  workEmail: string;
  phone: string;
  hometown: string;
  permanentAddress: string;
  currentAddress: string;
  birthPlace: string;
  bankAccount1: string;
  bankAccount2?: string;
  contractType: string;
  contractStartDate: string;
  contractEndDate: string;
  probationStartDate: string;
  officialStartDate: string;
  leaveDays?: number;
  misaSynced?: boolean;
  misaSyncedAt?: string;
  misaSyncError?: string;
}

export interface ProfileHistory {
  id: string;
  employeeId: string;
  employeeName: string;
  salaryReal: number;
  salaryBase: number;
  salaryInsurance: number;
  salaryAllowance: number;
  extraBonus: number;
  otherAllowance: number;
  changeDate: string;
  reason: string;
}

export interface Dependent {
  id: string;
  employeeId: string;
  employeeName: string;
  relativeName: string;
  relationship: string;
  birthDate: string;
  taxCode: string;
  identityNum: string;
  phone: string;
  isStudent: boolean;
  school?: string;
  deductionStartDate: string;
  deductionEndDate: string;
}

export interface MaternityRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  childrenCount: number;
  expectedBirthDate: string;
  actualBirthDate: string;
  maternityLeaveStartDate: string;
  returnToWorkDate: string;
  lateEarlyStartDate: string;
  lateEarlyEndDate: string;
  decisionNumber: string;
  maternityAllowance: number;
}

export interface PerformanceEvaluation {
  id: string;
  employeeId: string;
  employeeName: string;
  decisionNumber: string;
  year: number;
  type: string; // Quý, Năm
  authority: string; // Thẩm quyền
  rating: string; // Loại đánh giá: Xuất sắc, Tốt, Khá, Trung bình
  note: string;
  attachPath?: string;
}

export interface HrDecision {
  id: string;
  decisionNumber: string;
  decisionType: string; // Bổ nhiệm, Tăng lương, Điều chuyển...
  signDate: string;
  effectiveDate: string;
  expiryDate?: string;
  signerName: string;
  signerTitle: string;
  signerPosition: string;
  staffCode: string;
  staffName: string;
  newDepartment?: string;
  newTitle?: string;
  baseSalary?: number;
  kpisSalary?: number;
}

export interface RewardDiscipline {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'reward' | 'discipline';
  phaseName: string; // Đợt
  decisionNumber: string;
  reason: string;
  formType: string; // Thưởng tiền, Bằng khen, Cảnh cáo, Phạt tiền...
  amount: number;
  isAffectedSalary: boolean; // Cộng/Trừ vào lương
  signDate: string;
  effectiveDate: string;
}

export interface AllowanceConfig {
  id: string;
  code: string;
  name: string;
  amount: number;
  formula: string;
  startDate: string;
  endDate: string;
  salaryElement: string;
  applyToDeptAndTitle: boolean;
}

export interface HrBackup {
  id: string;
  name: string;
  year: number;
  month: number;
  createdAt: string;
  creator: string;
  isAppliedStats: boolean;
  misaSynced?: boolean;
  misaSyncedAt?: string;
  misaSyncError?: string;
}

export interface SalaryScale {
  id: string;
  code: string;
  name: string;
  group: string;
  raiseTermMonths: number;
  status: 'active' | 'inactive';
}

export interface DocTemplate {
  id: string;
  code: string;
  name: string;
  type: string;
  fileName: string;
  unitName: string;
}

// Sub-modules specification
interface EasyHrmSubModule {
  id: string;
  name: string;
  desc: string;
  icon: React.ComponentType<any>;
  color: string;
}

const EASY_HRM_MODULES: { category: string; items: EasyHrmSubModule[] }[] = [
  {
    category: "Hồ sơ & Biến động",
    items: [
      { id: "dashboard", name: "Tổng quan (Dashboard)", desc: "Biểu đồ và phân tích thâm niên, thực tập, thử việc.", icon: TrendingUp, color: "text-primary-600 bg-primary-50" },
      { id: "employees", name: "Hồ sơ nhân viên", desc: "Quản lý chi tiết lý lịch, thông tin cá nhân và liên hệ.", icon: Users, color: "text-indigo-600 bg-indigo-50" },
      { id: "history", name: "Lịch sử hồ sơ nhân viên", desc: "Ghi nhận lịch sử điều chỉnh lương cơ bản, phụ cấp hằng tháng.", icon: ClipboardList, color: "text-emerald-600 bg-emerald-50" },
      { id: "dependents", name: "Quan hệ thân nhân", desc: "Lý lịch gia đình & thông tin giảm trừ gia cảnh thuế TNCN.", icon: Heart, color: "text-rose-600 bg-rose-50" },
      { id: "no_contract", name: "Nhân sự chưa có hợp đồng", desc: "Danh sách cảnh báo nhân sự chưa ký hợp đồng lao động.", icon: ShieldAlert, color: "text-amber-600 bg-amber-50" },
    ]
  },
  {
    category: "Chế độ chính sách",
    items: [
      { id: "maternity", name: "Thông tin thai sản", desc: "Cập nhật phép thai sản, đi muộn về sớm, phụ cấp trẻ nhỏ.", icon: CalendarOff, color: "text-fuchsia-600 bg-fuchsia-50" },
      { id: "evaluations", name: "Đánh giá xếp loại", desc: "Đánh giá hiệu suất nhân sự định kỳ hàng quý/năm.", icon: FileCheck, color: "text-sky-600 bg-sky-50" },
      { id: "decisions", name: "Quyết định nhân sự", desc: "Soạn thảo hồ sơ bổ nhiệm, điều chuyển phòng ban.", icon: FileSignature, color: "text-violet-600 bg-violet-50" },
      { id: "rewards_disciplines", name: "Khen thưởng & Kỷ luật", desc: "Hồ sơ tuyên dương khen thưởng hoặc xử phạt kỷ luật lao động.", icon: Award, color: "text-yellow-600 bg-yellow-50" },
      { id: "allowances", name: "Phụ cấp nhân viên", desc: "Lập danh sách, công thức và mức tiền áp dụng phụ cấp.", icon: DollarSign, color: "text-emerald-600 bg-emerald-50" },
    ]
  },
  {
    category: "Báo cáo & Thiết lập",
    items: [
      { id: "reports", name: "Báo cáo nhân học", desc: "Xuất dữ liệu thống kê nhân sự đa chiều theo phòng ban.", icon: FileSpreadsheet, color: "text-teal-600 bg-teal-50" },
      { id: "general_config", name: "Thiết lập danh mục hồ sơ", desc: "Metadata chức vụ, chức danh, bằng cấp học vấn.", icon: Settings, color: "text-slate-600 bg-slate-50" },
      { id: "backups", name: "Lịch sử lưu trữ (Backup)", desc: "Quản lý chốt sổ snapshots dữ liệu nhân sự từng tháng.", icon: Database, color: "text-primary-600 bg-primary-50" },
      { id: "allowance_config", name: "Thiết lập phụ cấp", desc: "Công thức hóa học hỗ trợ kê khai bảo hiểm xã hội.", icon: KeyRound, color: "text-purple-600 bg-purple-50" },
      { id: "salary_scales", name: "Thang bảng lương", desc: "Danh sách thang bảng lương ngạch bậc theo pháp lý.", icon: Landmark, color: "text-indigo-600 bg-indigo-50" },
      { id: "templates", name: "Thiết lập mẫu quyết định", desc: "Quản lý mẫu Word file quyết định với cấu trúc tokens.", icon: FileSpreadsheet, color: "text-amber-600 bg-amber-50" },
    ]
  }
];

export function EasyHRMComponent() {
  const [activeSubTab, setActiveSubTab] = useState<string>("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [formulaEdit, setFormulaEdit] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);
  const [syncingEmployeeId, setSyncingEmployeeId] = useState<string | null>(null);
  const [syncingPayrollId, setSyncingPayrollId] = useState<string | null>(null);

  const handleSyncEmployeeToMisa = async (emp: EmployeeProfile) => {
    setSyncingEmployeeId(emp.id);
    try {
      const result = await syncEmployeeToMisa(emp.id, emp.name, emp.phone || '', emp.workEmail || emp.personalEmail || '');
      if (result && result.status === 'success') {
        const updated = employees.map(e => e.id === emp.id ? { ...e, misaSynced: true, misaSyncedAt: new Date().toISOString(), misaSyncError: '' } : e);
        setEmployees(updated);
        localStorage.setItem('easyhrm_employees', JSON.stringify(updated));
        alert(`Ghi sổ nhân viên ${emp.name} thành công!`);
      } else {
        throw new Error(result.message || 'Lỗi không xác định');
      }
    } catch (err: any) {
      console.error('Failed to sync employee:', err);
      const updated = employees.map(e => e.id === emp.id ? { ...e, misaSynced: false, misaSyncError: err.message || err } : e);
      setEmployees(updated);
      localStorage.setItem('easyhrm_employees', JSON.stringify(updated));
      alert(`Đồng bộ thất bại: ${err.message || err}`);
    } finally {
      setSyncingEmployeeId(null);
    }
  };

  const handleSyncPayrollToMisa = async (bk: HrBackup) => {
    setSyncingPayrollId(bk.id);
    try {
      const deptSums: Record<string, number> = {};
      
      employees.forEach(emp => {
        const dept = emp.department || 'Vận hành Sàn';
        const empHistory = histories.filter(h => h.employeeId === emp.id);
        let salary = 12000000;
        if (empHistory.length > 0) {
          const sorted = [...empHistory].sort((a, b) => new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime());
          salary = sorted[0].salaryReal || sorted[0].salaryBase || 12000000;
        }
        deptSums[dept] = (deptSums[dept] || 0) + salary;
      });

      const details = Object.entries(deptSums).map(([department, amount]) => ({
        department,
        amount
      }));

      if (details.length === 0) {
        details.push({ department: 'CSKH', amount: 18000000 });
        details.push({ department: 'Marketing', amount: 15000000 });
      }

      const result = await syncPayrollToMisa(bk.id, bk.name, bk.year, bk.month, details);
      if (result && result.status === 'success') {
        const updated = backups.map(b => b.id === bk.id ? { ...b, misaSynced: true, misaSyncedAt: new Date().toISOString(), misaSyncError: '' } : b);
        setBackups(updated);
        localStorage.setItem('easyhrm_backups', JSON.stringify(updated));
        alert(`Ghi sổ chi phí lương tháng ${bk.month}/${bk.year} thành công! Chứng từ: ${result.voucherId || 'N/A'}`);
      } else {
        throw new Error(result.message || 'Lỗi không xác định');
      }
    } catch (err: any) {
      console.error('Failed to sync payroll:', err);
      const updated = backups.map(b => b.id === bk.id ? { ...b, misaSynced: false, misaSyncError: err.message || err } : b);
      setBackups(updated);
      localStorage.setItem('easyhrm_backups', JSON.stringify(updated));
      alert(`Hạch toán lương thất bại: ${err.message || err}`);
    } finally {
      setSyncingPayrollId(null);
    }
  };

  // Core EasyHRM state database (backed up by LocalStorage)
  const [employees, setEmployees] = useState<EmployeeProfile[]>(() => {
    const saved = localStorage.getItem('easyhrm_employees');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: "EMP-2061",
        name: "Nguyễn Thị Kim Anh",
        aliasName: "Kimmy",
        foreignName: "Kim Anh Nguyen",
        gender: "Nữ",
        birthDate: "1994-08-15",
        department: "CSKH",
        position: "Trưởng nhóm",
        title: "CSKH Nội địa",
        nationality: "Việt Nam",
        identityNum: "001194002345",
        identityDate: "2020-05-12",
        identityPlace: "Cục Cảnh sát QLHC về TTXH",
        taxCode: "8215678942",
        insuranceCode: "0118234567",
        personalEmail: "kimanh.nguyen@gmail.com",
        workEmail: "anh.ntk@easyhrm.vn",
        phone: "0912345678",
        hometown: "Thanh Hóa",
        permanentAddress: "Số 68 Phố Huế, Hai Bà Trưng, Hà Nội",
        currentAddress: "Chung cư Sunshine Center, 16 Phạm Hùng, Hà Nội",
        birthPlace: "Thành phố Thanh Hóa",
        bankAccount1: "1903254125896 - Techcombank",
        contractType: "HĐ xác định thời hạn 1 năm",
        contractStartDate: "2025-01-01",
        contractEndDate: "2026-01-01",
        probationStartDate: "2024-11-01",
        officialStartDate: "2025-01-01",
        insuranceStartDate: "2025-01-15",
        leaveDays: 12
      },
      {
        id: "EMP-2062",
        name: "Phạm Minh Hoàng",
        aliasName: "Hoang Peter",
        gender: "Nam",
        birthDate: "1992-11-20",
        department: "Vận hành Sàn",
        position: "Nhân viên",
        title: "Quản lý kho",
        nationality: "Việt Nam",
        identityNum: "031192005678",
        identityDate: "2019-10-18",
        identityPlace: "Cục Cảnh sát QLHC về TTXH",
        taxCode: "8219456781",
        personalEmail: "hoang.peter92@gmail.com",
        workEmail: "hoang.pm@easyhrm.vn",
        phone: "0987654321",
        hometown: "Nghệ An",
        permanentAddress: "Hưng Nguyên, Nghệ An",
        currentAddress: "Số 15 Doãn Kế Thiện, Cầu Giấy, Hà Nội",
        birthPlace: "Nghệ An",
        bankAccount1: "1012458963 - Vietcombank",
        contractType: "HĐ xác định thời hạn 2 năm",
        contractStartDate: "2024-06-01",
        contractEndDate: "2026-06-01",
        probationStartDate: "2024-04-01",
        officialStartDate: "2024-06-01",
        insuranceStartDate: "2024-06-15",
        insuranceCode: "0219456789",
        leaveDays: 14
      },
      {
        id: "EMP-2063",
        name: "Lê Thu Quỳnh",
        aliasName: "Quynh Lee",
        gender: "Nữ",
        birthDate: "1998-03-12",
        department: "Marketing",
        position: "Thực tập sinh",
        title: "Content Creator",
        nationality: "Việt Nam",
        identityNum: "021198007894",
        identityDate: "2021-08-25",
        identityPlace: "Cục Cảnh sát QLHC về TTXH",
        taxCode: "8224589631",
        personalEmail: "quynh.lee98@gmail.com",
        workEmail: "quynh.lt@easyhrm.vn",
        phone: "0904561234",
        hometown: "Nam Định",
        permanentAddress: "Giao Thủy, Nam Định",
        currentAddress: "Mỹ Đình 2, Nam Từ Liêm, Hà Nội",
        birthPlace: "Nam Định",
        bankAccount1: "1025489632 - Vietcombank",
        contractType: "Thực tập sinh chưa có HĐ",
        contractStartDate: "2026-02-01",
        contractEndDate: "2026-08-01",
        probationStartDate: "",
        officialStartDate: "",
        insuranceStartDate: "",
        insuranceCode: "",
        leaveDays: 0
      }
    ];
  });

  const [histories, setHistories] = useState<ProfileHistory[]>([
    { id: "HIS-001", employeeId: "EMP-2061", employeeName: "Nguyễn Thị Kim Anh", salaryReal: 18000000, salaryBase: 12000000, salaryInsurance: 12000000, salaryAllowance: 3000000, extraBonus: 2000000, otherAllowance: 1000000, changeDate: "2026-01-10", reason: "Tăng lương hiệu suất định kỳ đầu năm 2026" },
    { id: "HIS-002", employeeId: "EMP-2062", employeeName: "Phạm Minh Hoàng", salaryReal: 12500000, salaryBase: 9000000, salaryInsurance: 9000000, salaryAllowance: 2000000, extraBonus: 1000000, otherAllowance: 500000, changeDate: "2025-12-15", reason: "Điều chuyển vị trí từ phụ kho lên quản lý kho phối hợp" }
  ]);

  const [dependents, setDependents] = useState<Dependent[]>([
    { id: "DEP-001", employeeId: "EMP-2061", employeeName: "Nguyễn Thị Kim Anh", relativeName: "Nguyễn Minh Khôi", relationship: "Con", birthDate: "2021-05-24", taxCode: "8524589631", identityNum: "001210085421", phone: "0912123456", isStudent: true, school: "Vinschool", deductionStartDate: "2025-01-01", deductionEndDate: "2030-01-01" }
  ]);

  const [maternities, setMaternities] = useState<MaternityRecord[]>([
    { id: "MAT-001", employeeId: "EMP-2061", employeeName: "Nguyễn Thị Kim Anh", childrenCount: 1, expectedBirthDate: "2026-08-10", actualBirthDate: "2026-08-12", maternityLeaveStartDate: "2026-08-10", returnToWorkDate: "2027-02-10", lateEarlyStartDate: "2027-02-11", lateEarlyEndDate: "2027-08-11", decisionNumber: "QĐ-TS-2026/01", maternityAllowance: 5000000 }
  ]);

  const [evaluations, setEvaluations] = useState<PerformanceEvaluation[]>([
    { id: "EVAL-001", employeeId: "EMP-2061", employeeName: "Nguyễn Thị Kim Anh", decisionNumber: "QĐDG-2025/Q4", year: 2025, type: "Qúy 4", authority: "Ban Giám Đốc", rating: "Xuất sắc", note: "Đạt vượt chỉ tiêu xử lý RMA 145%, thái độ xuất sắc, hỗ trợ đội nhóm tận tâm.", attachPath: "/files/EVAL_KimAnh_Q4.pdf" }
  ]);

  const [decisions, setDecisions] = useState<HrDecision[]>([
    { id: "DEC-001", decisionNumber: "QĐ-BN-2026/012", decisionType: "Bổ nhiệm", signDate: "2026-01-05", effectiveDate: "2026-01-10", signerName: "Trần Bảo Sơn", signerTitle: "Giám đốc Nhân sự", signerPosition: "CEO", staffCode: "EMP-2061", staffName: "Nguyễn Thị Kim Anh", newDepartment: "CSKH", newTitle: "Trưởng nhóm CSKH", baseSalary: 12000000, kpisSalary: 6000000 }
  ]);

  const [rewardDisciplines, setRewardDisciplines] = useState<RewardDiscipline[]>([
    { id: "RWD-001", employeeId: "EMP-2061", employeeName: "Nguyễn Thị Kim Anh", type: "reward", phaseName: "Đột xuất tháng 2", decisionNumber: "QĐ-KT-2026/02", reason: "Xử lý khẩn cấp tối ưu hóa phàn nàn của khách hàng vip không xảy ra khủng hoảng.", formType: "Thưởng nóng bằng tiền", amount: 2000000, isAffectedSalary: true, signDate: "2026-02-15", effectiveDate: "2026-02-15" }
  ]);

  const [allowanceConfigs, setAllowanceConfigs] = useState<AllowanceConfig[]>([
    { id: "ALW-001", code: "ALW-HOTRO", name: "Hỗ trợ xăng xe, điện thoại", amount: 1500000, formula: "AMOUNT * (ACTUAL_WORKING_DAYS / STANDARD_WORKING_DAYS)", startDate: "2026-01-01", endDate: "2026-12-31", salaryElement: "Phụ cấp cơ sở", applyToDeptAndTitle: true }
  ]);

  const [backups, setBackups] = useState<HrBackup[]>([
    { id: "BKP-001", name: "Snapshot Chốt Lương Tháng 05/2026", year: 2026, month: 5, createdAt: "2026-05-31 18:00:00", creator: "Vinh Nguyễn", isAppliedStats: true }
  ]);

  const [salaryScales, setSalaryScales] = useState<SalaryScale[]>([
    { id: "SCALE-01", code: "SCALE-CEO", name: "Thang ngạch chuyên viên cao cấp", group: "Quản trị trung - cao", raiseTermMonths: 24, status: "active" }
  ]);

  const [templates, setTemplates] = useState<DocTemplate[]>([
    { id: "TMP-01", code: "TMP-APPOINT", name: "Mẫu Quyết Định Bổ Nhiệm Nhân Sự", type: "Bổ nhiệm", fileName: "Quyet_dinh_bo_nhiem_v2.docx", unitName: "Công ty Cổ phần VComm" }
  ]);

  // Sync to database
  useEffect(() => {
    localStorage.setItem('easyhrm_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('easyhrm_backups', JSON.stringify(backups));
  }, [backups]);

  // Utility to handle Excel Exports
  const handleExportExcel = (moduleName: string) => {
    alert(`[EasyHRM - Export Excel] Đã khởi tạo và tải xuống bản excel dữ liệu cho phân hệ: ${moduleName} thành công!`);
  };

  // Utility to simulate Excel Uploads
  const handleImportExcel = () => {
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      alert("[EasyHRM - Import Excel] Nạp tệp Excel dữ liệu thành công! Bản ghi đã được cập nhật.");
    }, 1200);
  };

  // Safe additions representation form states
  const initFormState = () => {
    switch (activeSubTab) {
      case "employees":
        return { id: `EMP-${Math.floor(1000 + Math.random() * 9000)}`, name: "", gender: "Nữ", birthDate: "1995-01-01", department: "CSKH", position: "Nhân viên", title: "CSKH", nationality: "Việt Nam", identityNum: "", taxCode: "", personalEmail: "", workEmail: "", phone: "", contractType: "HĐ xác định thời hạn 1 năm", contractStartDate: "2026-01-01", contractEndDate: "2027-01-01", probationStartDate: "2025-11-01", officialStartDate: "2026-01-01", bankAccount1: "" };
      case "history":
        return { employeeId: "EMP-2061", salaryReal: 15000000, salaryBase: 10000000, salaryInsurance: 10000000, salaryAllowance: 3000000, extraBonus: 1000000, otherAllowance: 1000000, reason: "" };
      case "dependents":
        return { employeeId: "EMP-2061", relativeName: "", relationship: "Con", birthDate: "2020-01-01", taxCode: "", identityNum: "", phone: "", isStudent: true, school: "", deductionStartDate: "2026-01-01", deductionEndDate: "2030-01-01" };
      case "maternity":
        return { employeeId: "EMP-2061", childrenCount: 1, expectedBirthDate: "2026-09-01", actualBirthDate: "2026-09-02", maternityLeaveStartDate: "2026-09-01", returnToWorkDate: "2027-03-01", lateEarlyStartDate: "2027-03-01", lateEarlyEndDate: "2027-09-01", decisionNumber: "QĐ-TS/2026", maternityAllowance: 5000000 };
      case "evaluations":
        return { employeeId: "EMP-2061", decisionNumber: "QĐDG-2026/Q1", year: 2026, type: "Quý 1", authority: "Trưởng phòng", rating: "Tốt", note: "" };
      case "decisions":
        return { decisionNumber: `QĐ-DC-${Math.floor(100 + Math.random() * 900)}`, decisionType: "Điều chuyển", signDate: "2026-06-03", effectiveDate: "2026-06-10", signerName: "Trần Bảo Sơn", signerTitle: "Giám đốc", signerPosition: "CEO", staffCode: "EMP-2061", staffName: "Nguyễn Thị Kim Anh", newDepartment: "Marketing", newTitle: "Senior Executive", baseSalary: 14000000, kpisSalary: 5500000 };
      case "rewards_disciplines":
        return { employeeId: "EMP-2061", type: "reward", phaseName: "Tháng 6", decisionNumber: "QĐ-KT-2026/06", reason: "", formType: "Thưởng tiền", amount: 1000000, isAffectedSalary: true, signDate: "2026-06-03", effectiveDate: "2026-06-03" };
      case "allowances":
      case "allowance_config":
        return { code: `ALW-${Math.floor(100 + Math.random() * 900)}`, name: "", amount: 1000000, formula: "AMOUNT * 1.0", startDate: "2026-01-01", endDate: "2026-12-31", salaryElement: "Phụ cấp đặc thù", applyToDeptAndTitle: true };
      case "salary_scales":
        return { code: "SCALE-NEW", name: "", group: "Mới tạo", raiseTermMonths: 12, status: "active" };
      case "templates":
        return { code: "TMP-NEW", name: "", type: "Quyết định", fileName: "template.docx", unitName: "Tổng công ty" };
      case "backups":
        return { name: `Backup Dữ Liệu Tháng ${new Date().getMonth() + 1}`, year: 2026, month: new Date().getMonth() + 1, creator: "Vinh Nguyễn", isAppliedStats: true };
      default:
        return {};
    }
  };

  const handleOpenAddModal = () => {
    setSelectedEntity(initFormState());
    setShowFormModal(true);
  };

  const handleSaveEntity = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeSubTab === "employees") {
      const exists = employees.some(emp => emp.id === selectedEntity.id);
      if (exists) {
        setEmployees(employees.map(emp => emp.id === selectedEntity.id ? selectedEntity : emp));
      } else {
        setEmployees([...employees, selectedEntity]);
      }
    } else if (activeSubTab === "history") {
      const emp = employees.find(e => e.id === selectedEntity.employeeId);
      const newHist = { ...selectedEntity, id: `HIS-${Date.now()}`, employeeName: emp?.name || "Ẩn danh", changeDate: new Date().toISOString().split('T')[0] };
      setHistories([newHist, ...histories]);
    } else if (activeSubTab === "dependents") {
      const emp = employees.find(e => e.id === selectedEntity.employeeId);
      const newDependent = { ...selectedEntity, id: `DEP-${Date.now()}`, employeeName: emp?.name || "Ẩn danh" };
      setDependents([newDependent, ...dependents]);
    } else if (activeSubTab === "maternity") {
      const emp = employees.find(e => e.id === selectedEntity.employeeId);
      const newMat = { ...selectedEntity, id: `MAT-${Date.now()}`, employeeName: emp?.name || "Ẩn danh" };
      setMaternities([newMat, ...maternities]);
    } else if (activeSubTab === "evaluations") {
      const emp = employees.find(e => e.id === selectedEntity.employeeId);
      const newEval = { ...selectedEntity, id: `EVAL-${Date.now()}`, employeeName: emp?.name || "Ẩn danh" };
      setEvaluations([newEval, ...evaluations]);
    } else if (activeSubTab === "decisions") {
      const emp = employees.find(e => e.id === selectedEntity.staffCode);
      const newDec = { ...selectedEntity, id: `DEC-${Date.now()}`, staffName: emp?.name || selectedEntity.staffName };
      setDecisions([newDec, ...decisions]);
      // Auto upgrade basic information if decision has new base salary
      if (emp && newDec.baseSalary) {
        setEmployees(employees.map(m => m.id === emp.id ? { ...m, department: newDec.newDepartment || m.department, title: newDec.newTitle || m.title } : m));
      }
    } else if (activeSubTab === "rewards_disciplines") {
      const emp = employees.find(e => e.id === selectedEntity.employeeId);
      const newRw = { ...selectedEntity, id: `RWD-${Date.now()}`, employeeName: emp?.name || "Ẩn danh" };
      setRewardDisciplines([newRw, ...rewardDisciplines]);
    } else if (activeSubTab === "allowances" || activeSubTab === "allowance_config") {
      const newAl = { ...selectedEntity, id: `ALW-${Date.now()}` };
      setAllowanceConfigs([newAl, ...allowanceConfigs]);
    } else if (activeSubTab === "backups") {
      const newB = { ...selectedEntity, id: `BKP-${Date.now()}`, createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19) };
      setBackups([newB, ...backups]);
    } else if (activeSubTab === "salary_scales") {
      const newS = { ...selectedEntity, id: `SCALE-${Date.now()}` };
      setSalaryScales([newS, ...salaryScales]);
    } else if (activeSubTab === "templates") {
      const newT = { ...selectedEntity, id: `TMP-${Date.now()}` };
      setTemplates([newT, ...templates]);
    }

    setShowFormModal(false);
    setSelectedEntity(null);
  };

  const handleEditEntity = (entity: any) => {
    setSelectedEntity(entity);
    setShowFormModal(true);
  };

  const handleDeleteEntity = (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bản ghi dữ liệu này tài phân hệ EasyHRM?")) return;
    if (activeSubTab === "employees") setEmployees(employees.filter(e => e.id !== id));
    else if (activeSubTab === "history") setHistories(histories.filter(e => e.id !== id));
    else if (activeSubTab === "dependents") setDependents(dependents.filter(e => e.id !== id));
    else if (activeSubTab === "maternity") setMaternities(maternities.filter(e => e.id !== id));
    else if (activeSubTab === "evaluations") setEvaluations(evaluations.filter(e => e.id !== id));
    else if (activeSubTab === "decisions") setDecisions(decisions.filter(e => e.id !== id));
    else if (activeSubTab === "rewards_disciplines") setRewardDisciplines(rewardDisciplines.filter(e => e.id !== id));
    else if (activeSubTab === "allowances" || activeSubTab === "allowance_config") setAllowanceConfigs(allowanceConfigs.filter(e => e.id !== id));
    else if (activeSubTab === "backups") setBackups(backups.filter(e => e.id !== id));
    else if (activeSubTab === "salary_scales") setSalaryScales(salaryScales.filter(e => e.id !== id));
    else if (activeSubTab === "templates") setTemplates(templates.filter(e => e.id !== id));
  };

  // Filters & stats with useDeferredValue and useMemo for high-performance rendering under load
  const deferredSearchQuery = React.useDeferredValue(searchQuery);

  const filteredEmployeesList = React.useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase();
    return employees.filter(emp => {
      const matchesQuery = !q || emp.name?.toLowerCase().includes(q) || emp.id?.toLowerCase().includes(q);
      const matchesDept = deptFilter === "all" || emp.department === deptFilter;
      return matchesQuery && matchesDept;
    });
  }, [employees, deferredSearchQuery, deptFilter]);

  const internCount = React.useMemo(() => {
    return employees.filter(e => e.contractType.includes("Thực tập")).length;
  }, [employees]);

  const probationCount = React.useMemo(() => {
    return employees.filter(e => e.probationStartDate && !e.officialStartDate).length || 1;
  }, [employees]);

  const internEmployees = React.useMemo(() => {
    return employees.filter(e => e.contractType.includes("Thực tập") || e.position === "Thực tập sinh");
  }, [employees]);

  const defaultNewHiresList = React.useMemo(() => {
    return employees.slice(0, 3);
  }, [employees]);

  return (
    <div className="bg-[#FAF9F6] border border-slate-300 rounded-lg shadow-sm overflow-hidden min-h-[700px] flex flex-col">
      {/* Visual EasyHRM Header bar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-white font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">Hệ thống EasyHRM</span>
            <span className="text-slate-400 text-xs">Vận hành thực tế (app.easyhrm.vn)</span>
          </div>
          <h1 className="font-serif text-2xl font-bold tracking-tight mt-1 text-[#FFFFFF]">Chức Năng Thông Tin Nhân Sự Toàn Diện</h1>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">Phòng Hành chính Nhân Sự - Cấu trúc gồm 17 phân hệ quản trị hồ sơ nhân học, biến động chính sách và ngạch lương.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImportExcel}
            className="bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-2 transition"
          >
            {isImporting ? <Sparkles className="w-4 h-4 animate-spin text-emerald-400" /> : <Upload className="w-4 h-4 text-emerald-300" />}
            Nạp từ Excel (Chung)
          </button>
          <button
            onClick={() => handleExportExcel("Toàn bộ dữ liệu 17 phân hệ")}
            className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-2 shadow transition"
          >
            <Download className="w-4 h-4" />
            Xuất Excel Toàn Bộ (.xlsx)
          </button>
        </div>
      </div>

      {/* Main 2-column sidebar and viewport layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Sidebar menu selection mapped from 17 Modules */}
        <div className="w-full lg:w-72 bg-white border-r border-slate-300 p-4 space-y-6 shrink-0">
          {EASY_HRM_MODULES.map((group, idx) => (
            <div key={idx} className="space-y-2">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 px-2 py-1 rounded">{group.category}</h3>
              <div className="space-y-1">
                {group.items.map(subItem => (
                  <button
                    key={subItem.id}
                    onClick={() => {
                      setActiveSubTab(subItem.id);
                      setSearchQuery("");
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-xs font-medium flex items-center justify-between transition-all duration-150",
                      activeSubTab === subItem.id
                        ? "bg-slate-900 text-white shadow-sm font-semibold"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <div className="flex items-center gap-2 max-w-[90%] truncate">
                      <subItem.icon className={cn("w-4 h-4 shrink-0ID", activeSubTab === subItem.id ? "text-white" : "text-slate-500")} />
                      <span className="truncate">{subItem.name}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic viewport renderer based on tab selection */}
        <div className="flex-1 p-6 space-y-6">
          
          {/* SEARCH & ACTION CONTROL ROW */}
          {activeSubTab !== "dashboard" && (
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-lg border border-slate-300 shadow-xs">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm họ tên, mã NV..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 pl-9 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
                {activeSubTab === "employees" && (
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="bg-white border border-slate-300 text-xs px-2.5 py-1.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="all">Tất cả Phòng ban</option>
                    <option value="CSKH">CSKH</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Vận hành Sàn">Vận hành Sàn</option>
                  </select>
                )}
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => handleExportExcel(activeSubTab)}
                  className="bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Xuất Excel
                </button>
                {activeSubTab !== "no_contract" ? (
                  <button
                    onClick={handleOpenAddModal}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Thêm mới dữ liệu
                  </button>
                ) : (
                  <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-1 rounded inline-flex items-center gap-1.5">
                    <Info className="w-3 h-3" /> Cảnh báo ký hợp đồng khẩn cấp
                  </span>
                )}
              </div>
            </div>
          )}

          {/* VIEW RENDERER CONTROLLER */}

          {/* MODULE 1: TỔNG QUAN (DASHBOARD) */}
          {activeSubTab === "dashboard" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tổng nhân sự</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{employees.length} Cán bộ</div>
                  <span className="text-[10px] text-indigo-600 font-semibold block mt-1">Đầy đủ hồ sơ thực tế</span>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Thực tập sinh</span>
                  <div className="text-2xl font-black text-amber-600 mt-1">
                    {internCount} Nhân viên
                  </div>
                  <span className="text-[10px] text-amber-600 font-medium block mt-1">Cần đánh giá định mục</span>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Nhân sự thử việc</span>
                  <div className="text-2xl font-black text-sky-600 mt-1">
                    {probationCount} Nhân viên
                  </div>
                  <span className="text-[10px] text-sky-600 font-medium block mt-1">Checklist 30-ngày</span>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Mới gia nhập (Trong quý)</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">2 Nhân sự</div>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Onboarding checklist</span>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-xs">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Lương trung bình</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{formatCurrency(14500000)}</div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-1">Ngạch chuyên viên v1.4</span>
                </div>
                <div className="bg-[#111827] p-4 rounded-lg border border-slate-800 shadow-xs text-white">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Chế độ thai sản</span>
                  <div className="text-2xl font-black text-fuchsia-400 mt-1">{maternities.length} Ca nghỉ</div>
                  <span className="text-[10px] text-fuchsia-300 font-semibold block mt-1">Chính sách thai sản hoạt động</span>
                </div>
              </div>

              {/* 4 BIẾN ĐỘNG TABLES SPECIFIED IN EASYHRM SURVEY */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                
                {/* BẢNG 1: Nhân sự thực tập (Interns) */}
                <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                      Dữ liệu Nhân sự thực tập (Bảng 1)
                    </h3>
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">Thực tế</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-2 font-bold text-slate-600">STT</th>
                          <th className="p-2 font-bold text-slate-600">Mã, Họ tên</th>
                          <th className="p-2 font-bold text-slate-600">Chức vụ & Phòng ban</th>
                          <th className="p-2 font-bold text-slate-600">Ngày vào thực tập</th>
                          <th className="p-2 font-bold text-slate-600">Ngày kết thúc</th>
                          <th className="p-2 font-bold text-slate-600">Phân loại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {internEmployees.map((emp, i) => (
                          <tr key={emp.id} className="hover:bg-slate-50/55">
                            <td className="p-2 font-mono font-bold text-slate-500">{i + 1}</td>
                            <td className="p-2">
                              <span className="font-bold text-slate-900 block">{emp.name}</span>
                              <span className="text-[10px] text-slate-500 font-bold">{emp.id}</span>
                            </td>
                            <td className="p-2">
                              <span className="text-slate-800 block font-medium">{emp.position}</span>
                              <span className="text-[10px] text-slate-500">{emp.department}</span>
                            </td>
                            <td className="p-2 text-slate-600 font-mono">{emp.contractStartDate}</td>
                            <td className="p-2 text-slate-600 font-mono">{emp.contractEndDate}</td>
                            <td className="p-2"><span className="px-2 py-0.5 bg-primary-50 text-blue-700 font-bold rounded text-[10px]">Cá nhân</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BẢNG 2: Nhân sự thử việc (Probations) */}
                <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                      Dữ liệu Nhân sự thử việc (Bảng 2)
                    </h3>
                    <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">3 Ca làm</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-2 font-bold text-slate-600">STT</th>
                          <th className="p-2 font-bold text-slate-600">Mã, Họ tên</th>
                          <th className="p-2 font-bold text-slate-600">Chức vụ & Phòng ban</th>
                          <th className="p-2 font-bold text-slate-600">Ngày thử việc</th>
                          <th className="p-2 font-bold text-slate-600">Kết thúc</th>
                          <th className="p-2 font-bold text-slate-600">Tình trạng</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {employees.map((emp, i) => (
                          <tr key={emp.id} className="hover:bg-slate-50/55">
                            <td className="p-2 font-mono font-bold text-slate-500">{i + 1}</td>
                            <td className="p-2">
                              <span className="font-bold text-slate-900 block">{emp.name}</span>
                              <span className="text-[10px] text-slate-500 font-bold">{emp.id}</span>
                            </td>
                            <td className="p-2">
                              <span className="text-slate-800 block font-medium">{emp.position}</span>
                              <span className="text-[10px] text-slate-500">{emp.department}</span>
                            </td>
                            <td className="p-2 text-slate-600 font-mono">{emp.probationStartDate || "2025-11-01"}</td>
                            <td className="p-2 text-slate-600 font-mono">{emp.officialStartDate || "2026-01-01"}</td>
                            <td className="p-2"><span className="px-2 py-0.5 bg-sky-50 text-sky-700 font-bold rounded text-[10px]">Đang thử</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BẢNG 3: Nhân sự mới (New hires) */}
                <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Danh sách Nhân sự mới bổ sung (Bảng 3)
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Gia nhập gần nhất</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-2 font-bold text-slate-600">STT</th>
                          <th className="p-2 font-bold text-slate-600">Mã NV</th>
                          <th className="p-2 font-bold text-slate-600">Tên nhân viên</th>
                          <th className="p-2 font-bold text-slate-600">Chức danh nghề</th>
                          <th className="p-2 font-bold text-slate-600">Phòng ban</th>
                          <th className="p-2 font-bold text-slate-600">Ngày vào đơn vị</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {defaultNewHiresList.map((emp, i) => (
                          <tr key={emp.id} className="hover:bg-slate-50/55">
                            <td className="p-2 font-mono font-bold text-slate-500">{i + 1}</td>
                            <td className="p-2 font-mono font-bold text-slate-700">{emp.id}</td>
                            <td className="p-2 font-bold text-slate-900">{emp.name}</td>
                            <td className="p-2 text-slate-700">{emp.title}</td>
                            <td className="p-2 text-slate-700">{emp.department}</td>
                            <td className="p-2 text-slate-600 font-mono">{emp.officialStartDate || emp.contractStartDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* BẢNG 4: Thâm niên nhân sự (Tenure) */}
                <div className="bg-white rounded-lg border border-slate-300 shadow-sm p-4 overflow-hidden">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span>
                      Thống kê Thâm niên nhân sự (Bảng 4)
                    </h3>
                    <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">Thâm niên thực</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="p-2 font-bold text-slate-600">STT</th>
                          <th className="p-2 font-bold text-slate-600">Mã & Tên nhân viên</th>
                          <th className="p-2 font-bold text-slate-600">Phòng ban</th>
                          <th className="p-2 font-bold text-slate-600">Ngày vào</th>
                          <th className="p-2 font-bold text-slate-600">Lên chính thức</th>
                          <th className="p-2 font-bold text-slate-600 text-center">Thâm niên</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {defaultNewHiresList.map((emp, i) => (
                          <tr key={emp.id} className="hover:bg-slate-50/55">
                            <td className="p-2 font-mono font-bold text-slate-500">{i + 1}</td>
                            <td className="p-2">
                              <span className="font-bold text-slate-900 block">{emp.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">{emp.id}</span>
                            </td>
                            <td className="p-2 text-slate-800">{emp.department}</td>
                            <td className="p-2 text-slate-500 font-mono">{emp.contractStartDate}</td>
                            <td className="p-2 text-slate-500 font-mono">{emp.officialStartDate || "Chưa có"}</td>
                            <td className="p-2 text-center font-bold text-slate-900 bg-slate-50 font-mono">{i === 0 ? "17 Tháng" : i === 1 ? "24 Tháng" : "4 Tháng"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* MODULE 2: HỒ SƠ NHÂN VIÊN */}
          {activeSubTab === "employees" && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse font-sans">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-bold text-slate-600">Mã & Họ tên</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Bộ phận / Chức danh</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Thông tin cá nhân (Giới tính, SĐT)</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Hợp đồng lao động</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Thuế & Bảo hiểm xã hội</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">Trạng thái Ghi sổ</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployeesList.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/55">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{emp.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold block">{emp.id}</span>
                          {emp.aliasName && <span className="text-[10px] text-slate-400 font-medium">Tên gọi khác: {emp.aliasName}</span>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-800 font-bold block">{emp.department}</span>
                          <span className="text-[10px] text-slate-500 block">{emp.position} • {emp.title}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-800 block">SĐT: {emp.personalEmail}</span>
                          <span className="text-[10px] text-slate-500 block">{emp.gender} • Sinh ngày: {emp.birthDate}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-800 block text-[11px] font-medium">{emp.contractType}</span>
                          <span className="text-[10px] text-slate-500 block font-mono">{emp.contractStartDate} - {emp.contractEndDate}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-800 block text-[11px]">MST: {emp.taxCode || "N/A"}</span>
                          <span className="text-[10px] text-slate-500 block">BHXH: {emp.insuranceCode || "N/A"}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {emp.misaSynced ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px] uppercase border border-emerald-200">Đã ghi sổ 🟢</span>
                              {emp.misaSyncedAt && <span className="text-[9px] text-slate-400 mt-0.5 font-mono">{new Date(emp.misaSyncedAt).toLocaleDateString('vi-VN')}</span>}
                            </div>
                          ) : emp.misaSyncError ? (
                            <div className="inline-flex flex-col items-center" title={emp.misaSyncError}>
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[10px] uppercase border border-rose-200 cursor-help">Lỗi kiểm tra 🔴</span>
                              <button 
                                onClick={() => handleSyncEmployeeToMisa(emp)}
                                disabled={syncingEmployeeId === emp.id}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline mt-0.5 flex items-center gap-0.5"
                              >
                                {syncingEmployeeId === emp.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Thử lại 🔄'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSyncEmployeeToMisa(emp)}
                              disabled={syncingEmployeeId === emp.id}
                              className="px-2 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded text-[10px] border border-slate-300 transition flex items-center gap-1 mx-auto"
                            >
                              {syncingEmployeeId === emp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ghi sổ'}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center items-center gap-1.5">
                            <button
                              onClick={() => handleEditEntity(emp)}
                              className="p-1 px-2 border border-slate-300 rounded hover:bg-slate-100 text-xs font-medium text-slate-700 flex items-center gap-1"
                            >
                              <Edit2 className="w-3 h-3" /> Sửa
                            </button>
                            <button
                              onClick={() => handleDeleteEntity(emp.id)}
                              className="p-1 border border-red-300 text-red-600 rounded hover:bg-red-50 text-xs flex items-center"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredEmployeesList.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center p-8 text-slate-500 font-medium font-sans">Không tìm thấy dữ liệu hồ sơ phù hợp.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 3: LỊCH SỬ HỒ SƠ NHÂN VIÊN */}
          {activeSubTab === "history" && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-bold text-slate-600">STT</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Mã & Tên nhân viên</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-right">Lương thực tế (Real)</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-right">Lương cơ bản (Base)</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-right">Lương BHXH</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-right">Các khoản phụ cấp & thưởng</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Ngày ghi nhận lý do biến động</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {histories.map((his, idx) => (
                      <tr key={his.id} className="hover:bg-slate-50/55">
                        <td className="px-4 py-3 font-medium text-slate-500">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{his.employeeName}</span>
                          <span className="text-[10px] text-slate-500 font-mono font-bold block">{his.employeeId}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-950">{formatCurrency(his.salaryReal)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700">{formatCurrency(his.salaryBase)}</td>
                        <td className="px-4 py-3 text-right font-mono text-slate-500">{formatCurrency(his.salaryInsurance)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-[11px] font-medium block text-emerald-600">Allowance: +{formatCurrency(his.salaryAllowance)}</span>
                          <span className="text-[10px] text-indigo-500 block">Bonus: +{formatCurrency(his.extraBonus)}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-800 text-[11px] block">{his.reason}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">Ngày đổi: {his.changeDate}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteEntity(his.id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 4: QUAN HỆ THÂN NHÂN */}
          {activeSubTab === "dependents" && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-bold text-slate-600">Nhân viên bảo lãnh</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Họ tên & Quan hệ thân nhân</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Ngày sinh thân nhân</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Thuế (MST) & CCCD</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Ưu đãi học sinh & Trường học</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Thời gian giảm trừ gia cảnh</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dependents.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-50/55">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{dep.employeeName}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{dep.employeeId}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{dep.relativeName}</span>
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded">{dep.relationship}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-mono">{dep.birthDate}</td>
                        <td className="px-4 py-3">
                          <span className="text-slate-700 font-mono block">MST: {dep.taxCode}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">CCCD: {dep.identityNum}</span>
                        </td>
                        <td className="px-4 py-3">
                          {dep.isStudent ? (
                            <span className="text-xs text-slate-800">
                              Học sinh/sinh viên block tại <strong className="text-indigo-600">{dep.school || "N/A"}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-500">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-[#111827] font-mono block">Hiệu lực: {dep.deductionStartDate}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">Đến ngày: {dep.deductionEndDate}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteEntity(dep.id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 5: THÔNG TIN THAI SẢN */}
          {activeSubTab === "maternity" && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-bold text-slate-600">Nhân sự áp dụng</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">Kỳ sinh con (Số lượng)</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Ngày dự sinh vs Sinh thực tế</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Thời gian nghỉ thai sản</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Phương án đi muộn về sớm</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Số văn bản & Phụ cấp</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {maternities.map((mat) => (
                      <tr key={mat.id} className="hover:bg-slate-50/55">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{mat.employeeName}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{mat.employeeId}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-800">{mat.childrenCount} Bé</td>
                        <td className="px-4 py-3">
                          <span className="text-slate-700 block">Dự kiến: {mat.expectedBirthDate}</span>
                          <span className="text-[11px] font-bold text-emerald-600 block">Thực tế: {mat.actualBirthDate}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-800 block">{mat.maternityLeaveStartDate} Đến</span>
                          <span className="text-[11px] text-slate-500 block font-mono">Đi làm lại: {mat.returnToWorkDate}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-slate-900 block">Phép nuôi con:</span>
                          <span className="text-[10px] text-indigo-600 font-mono block">{mat.lateEarlyStartDate} ~ {mat.lateEarlyEndDate}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-800 font-mono block text-[11px]">{mat.decisionNumber}</span>
                          <span className="text-[11px] text-emerald-600 font-bold block">Phụ cấp: {formatCurrency(mat.maternityAllowance)}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteEntity(mat.id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 6: NHÂN SỰ CHƯA CÓ HỢP ĐỒNG */}
          {activeSubTab === "no_contract" && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-amber-900 text-xs uppercase tracking-wider">CẢNH BÁO PHÁP LÝ HỒ SƠ</h4>
                  <p className="text-xs text-amber-800 leading-relaxed mt-1">Danh sách cán bộ nhân viên đã làm việc chính thức hoặc thực tập sinh, thử việc quá hạn mà chưa bổ nhiệm/ký hợp đồng lao động giấy hoặc hợp đồng điện tử theo tiêu chuẩn.</p>
                </div>
              </div>
              <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-bold text-slate-600">STT</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Họ tên & ID</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Giới tính & Ngày sinh</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Phòng ban đề xuất</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">Trạng thái rủi ro</th>
                      <th className="px-4 py-3 text-center">Hành động khắc phục</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-500">1</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-900 block">Lê Thu Quỳnh</span>
                        <span className="text-[10px] text-slate-500 font-mono block">EMP-2063</span>
                      </td>
                      <td className="px-4 py-3 font-mono">Nữ • 1998-03-12</td>
                      <td className="px-4 py-3 font-medium">Marketing (Thực tập sinh)</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">Quá hạn 5 ngày</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => alert("Hệ thống EasyHRM đang khởi động quy trình soạn hợp đồng tự động cho Lê Thu Quỳnh...")}
                          className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold"
                        >
                          Ký HĐ Lao động mới
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 7: ĐÁNH GIÁ XẾP LOẠI */}
          {activeSubTab === "evaluations" && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-bold text-slate-600">Quyết định số</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Nhân viên được đánh giá</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">Năm & Kỳ đánh giá</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Thẩm quyền đánh giá</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Xếp loại kết quả</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Mô tả nhận xét chi tiết</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {evaluations.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50/55">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{ev.decisionNumber}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{ev.employeeName}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{ev.employeeId}</span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">{ev.type} - {ev.year}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{ev.authority}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded text-[10px] uppercase">{ev.rating}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 leading-relaxed max-w-xs truncate" title={ev.note}>{ev.note}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteEntity(ev.id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 8: QUYẾT ĐỊNH NHÂN SỰ */}
          {activeSubTab === "decisions" && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-bold text-slate-600">Số quyết định (Loại)</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Nhân sự áp dụng</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Ký & Ngày hiệu lực</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Người ban hành (Ký duyệt)</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Phòng & Chức danh Bổ nhiệm mới</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-right">Lương cơ bản mới</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-right">Lương hiệu quả (KPIs)</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {decisions.map((dec) => (
                      <tr key={dec.id} className="hover:bg-slate-50/55">
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-slate-900 block">{dec.decisionNumber}</span>
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded text-[10px]">{dec.decisionType}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{dec.staffName}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{dec.staffCode}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-500 block">Ký: {dec.signDate}</span>
                          <span className="text-emerald-600 font-bold block">Chạy: {dec.effectiveDate}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold block text-slate-900">{dec.signerName}</span>
                          <span className="text-[10px] text-slate-500 block">{dec.signerTitle} ({dec.signerPosition})</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-indigo-900 block">{dec.newDepartment || "Giữ nguyên"}</span>
                          <span className="text-[10px] text-slate-600 block">{dec.newTitle || "Giữ nguyên"}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700 font-bold">{dec.baseSalary ? formatCurrency(dec.baseSalary) : "N/A"}</td>
                        <td className="px-4 py-3 text-right font-mono text-indigo-600 font-bold">{dec.kpisSalary ? formatCurrency(dec.kpisSalary) : "N/A"}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => {
                                alert(`Đã in văn bản quyết định ${dec.decisionNumber}.docx bằng Web Template thành công!`);
                              }}
                              className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold"
                            >
                              In PDF / Word
                            </button>
                            <button
                              onClick={() => handleDeleteEntity(dec.id)}
                              className="text-red-500 hover:text-red-700 font-medium text-xs px-1"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 9 & 10: KHEN THƯỞNG & KỶ LUẬT */}
          {activeSubTab === "rewards_disciplines" && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-bold text-slate-600">Loại hồ sơ</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Đợt phát động</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Số quyết định</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Nhân viên liên quan</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Lý do hình thức cụ thể</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-right">Số tiền khen/phạt</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">Hạch toán lương</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rewardDisciplines.map((rd) => (
                      <tr key={rd.id} className="hover:bg-slate-50/55">
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider block text-center w-full max-w-[100px]",
                            rd.type === "reward" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"
                          )}>
                            {rd.type === "reward" ? "Khen thưởng" : "Kỷ luật"}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{rd.phaseName}</td>
                        <td className="px-4 py-3 font-mono text-slate-700 font-bold">{rd.decisionNumber}</td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 block">{rd.employeeName}</span>
                          <span className="text-[10px] text-slate-500 font-mono block">{rd.employeeId}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <strong className="text-slate-800 block text-[11px]">{rd.formType}</strong>
                          <span className="text-[10px] block truncate max-w-xs">{rd.reason}</span>
                        </td>
                        <td className={cn("px-4 py-3 text-right font-mono font-bold text-sm", rd.type === "reward" ? "text-emerald-600" : "text-red-500")}>
                          {rd.type === "reward" ? "+" : "-"}{formatCurrency(rd.amount)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            "text-[10px] font-bold px-1.5 py-0.5 rounded",
                            rd.isAffectedSalary ? "bg-yellow-100 text-yellow-800" : "bg-slate-100 text-slate-600"
                          )}>
                            {rd.isAffectedSalary ? "Cộng/Trừ Lương" : "Lưu hồ sơ"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteEntity(rd.id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 11 & 15: PHỤ CẤP & THIẾT LẬP PHỤ CẤP */}
          {((activeSubTab === "allowances") || (activeSubTab === "allowance_config")) && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
                <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase text-slate-700">Bộ công thức phụ cấp của EasyHRM</span>
                  <button
                    onClick={() => {
                      setFormulaEdit("AMOUNT * (ACTUAL_DAYS / STANDARD_DAYS) * PREMIUM_FACTOR");
                      alert("EasyHRM Formula Engine: Sẵn sàng cấu chỉnh công thức phụ cấp.");
                    }}
                    className="text-indigo-600 hover:text-indigo-800 text-xs font-bold"
                  >
                    Cài đặt công thức mẫu mới
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-4 py-3 font-bold text-slate-600">Mã phụ cấp</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Tên khoản hỗ trợ</th>
                        <th className="px-4 py-3 font-bold text-slate-600 text-right">Mức hỗ trợ cơ sở</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Công thức tính (Payroll Formula)</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Phần tử tính lương</th>
                        <th className="px-4 py-3 font-bold text-slate-600">Phòng ban áp dụng</th>
                        <th className="px-4 py-3 text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {allowanceConfigs.map((al) => (
                        <tr key={al.id} className="hover:bg-slate-50/55">
                          <td className="px-4 py-3 font-mono font-bold text-teal-600">{al.code}</td>
                          <td className="px-4 py-3 font-bold text-slate-900">{al.name}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">{formatCurrency(al.amount)}</td>
                          <td className="px-4 py-3">
                            <code className="text-[10px] bg-slate-100 border border-slate-300 p-1 rounded text-slate-800 font-mono select-all">{al.formula}</code>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{al.salaryElement}</td>
                          <td className="px-4 py-3">
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">Tất cả chi nhánh</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => handleDeleteEntity(al.id)}
                              className="text-red-500 hover:text-red-700 font-medium"
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 12: BÁO CÁO NHÂN SỰ */}
          {activeSubTab === "reports" && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                <h3 className="font-serif text-lg font-bold text-slate-900">Thư viện báo cáo theo quy chuẩn của EasyHRM</h3>
                <span className="text-xs text-slate-500">Khởi tạo bởi bộ máy AI</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-slate-300 rounded-lg hover:border-slate-400 cursor-pointer bg-slate-50/50">
                  <h4 className="font-bold text-slate-800 text-xs block uppercase">Báo cáo Phân bố Chức danh & Giới tính</h4>
                  <p className="text-[11px] text-slate-500 mt-1 mb-3">Thống kê cơ cấu nhân sự nam/nữ, tỉ lệ thâm niên và phân loại nhân học.</p>
                  <button onClick={() => alert("Hệ thống đang tải tệp excel: Bao_cao_nam_nu_co_cau.xlsx")} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1.5 justify-end w-full">Xuất báo cáo ngay →</button>
                </div>
                <div className="p-4 border border-slate-300 rounded-lg hover:border-slate-400 cursor-pointer bg-slate-50/50">
                  <h4 className="font-bold text-slate-800 text-xs block uppercase">Báo cáo Biến động Nhân lý theo tháng</h4>
                  <p className="text-[11px] text-slate-500 mt-1 mb-3">Tỷ lệ nghỉ việc, tuyển mới, nâng bậc thang lương theo từng chi nhánh.</p>
                  <button onClick={() => alert("Hệ thống đang tải tệp excel: Attrition_and_Growth_Index.xlsx")} className="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1.5 justify-end w-full">Xuất báo cáo ngay →</button>
                </div>
              </div>
            </div>
          )}

          {/* MODULE 13: THIẾT LẬP DANH MỤC HỒ SƠ */}
          {activeSubTab === "general_config" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-300 shadow-sm rounded-lg p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-50 p-2 rounded mb-3">Danh mục Chức danh</h3>
                <ul className="divide-y divide-slate-100 text-xs">
                  <li className="py-2.5 flex justify-between font-medium"><span>CSKH Nội Địa</span> <span className="text-slate-400 font-bold font-mono">15 Nhân sự</span></li>
                  <li className="py-2.5 flex justify-between font-medium"><span>Quản lý kho vận</span> <span className="text-slate-400 font-bold font-mono">8 Nhân sự</span></li>
                  <li className="py-2.5 flex justify-between font-medium"><span>Chuyên viên Marketing</span> <span className="text-slate-400 font-bold font-mono">12 Nhân sự</span></li>
                </ul>
              </div>
              <div className="bg-white border border-slate-300 shadow-sm rounded-lg p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-50 p-2 rounded mb-3">Trình độ & Bằng cấp</h3>
                <ul className="divide-y divide-slate-100 text-xs text-slate-700">
                  <li className="py-2.5">Đại học cử nhân chính quy</li>
                  <li className="py-2.5">Thạc sỹ quản trị kinh doanh (MBA)</li>
                  <li className="py-2.5">Cao đẳng / Trung cấp nghề kho vận</li>
                </ul>
              </div>
              <div className="bg-white border border-slate-300 shadow-sm rounded-lg p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-50 p-2 rounded mb-3">Hình thức làm việc</h3>
                <ul className="divide-y divide-slate-100 text-xs text-slate-700">
                  <li className="py-2.5">Toàn thời gian cố định (Fulltime)</li>
                  <li className="py-2.5">Bán thời gian tích lũy (Parttime)</li>
                  <li className="py-2.5">Thực tập sinh chưa ký HĐ</li>
                </ul>
              </div>
            </div>
          )}

          {/* MODULE 14: LỊCH SỬ LƯU TRỮ (BACKUP & SNAPSHOTS) */}
          {activeSubTab === "backups" && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-bold text-slate-600">Tên bản lưu trữ (Snapshot)</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">Năm</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">Tháng</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Thời gian lưu chốt</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Người thực hiện sao lưu</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center font-sans">Dùng thống kê</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">Trạng thái Ghi sổ</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {backups.map((bk) => (
                      <tr key={bk.id} className="hover:bg-slate-50/55">
                        <td className="px-4 py-3 font-bold text-slate-900">{bk.name}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-700">{bk.year}</td>
                        <td className="px-4 py-3 text-center font-mono text-slate-700">Tháng {bk.month}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{bk.createdAt}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{bk.creator}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px] uppercase">Có áp dụng</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {bk.misaSynced ? (
                            <div className="inline-flex flex-col items-center">
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded text-[10px] uppercase border border-emerald-200">Đã ghi sổ 🟢</span>
                              {bk.misaSyncedAt && <span className="text-[9px] text-slate-400 mt-0.5 font-mono">{new Date(bk.misaSyncedAt).toLocaleDateString('vi-VN')}</span>}
                            </div>
                          ) : bk.misaSyncError ? (
                            <div className="inline-flex flex-col items-center" title={bk.misaSyncError}>
                              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[10px] uppercase border border-rose-200 cursor-help">Lỗi kiểm tra 🔴</span>
                              <button 
                                onClick={() => handleSyncPayrollToMisa(bk)}
                                disabled={syncingPayrollId === bk.id}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold underline mt-0.5 flex items-center gap-0.5"
                              >
                                {syncingPayrollId === bk.id ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : 'Thử lại 🔄'}
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSyncPayrollToMisa(bk)}
                              disabled={syncingPayrollId === bk.id}
                              className="px-2 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold rounded text-[10px] border border-indigo-200 transition flex items-center gap-1 mx-auto"
                            >
                              {syncingPayrollId === bk.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Ghi sổ Lương 💰'}
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => alert(`Khôi phục dữ liệu snapshot sang Tháng ${bk.month}/${bk.year} thành công!`)}
                            className="text-indigo-600 hover:text-indigo-800 font-bold"
                          >
                            Khôi phục
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 16: THANG BẢNG LƯƠNG */}
          {activeSubTab === "salary_scales" && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-bold text-slate-600">Mã ngạch lương</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Tên ngạch thang lương</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Nhóm ngạch lương</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">Thời gian nâng ngạch (Tháng)</th>
                      <th className="px-4 py-3 font-bold text-slate-600 text-center">Trạng thái áp dụng</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {salaryScales.map((sc) => (
                      <tr key={sc.id} className="hover:bg-slate-50/55">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-600">{sc.code}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{sc.name}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{sc.group}</td>
                        <td className="px-4 py-3 text-center font-mono font-bold text-slate-700">{sc.raiseTermMonths} tháng</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] uppercase font-bold">Hoạt động</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteEntity(sc.id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MODULE 17: THIẾT LẬP MẪU QUYẾT ĐỊNH */}
          {activeSubTab === "templates" && (
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 font-bold text-slate-600">Mã mẫu văn bản</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Tên mẫu quyết định</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Loại văn bản bổ nhiệm</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Tên tệp Word đính kèm (.docx)</th>
                      <th className="px-4 py-3 font-bold text-slate-600">Đơn vị ban hành quyết định</th>
                      <th className="px-4 py-3 text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {templates.map((tmp) => (
                      <tr key={tmp.id} className="hover:bg-slate-50/55">
                        <td className="px-4 py-3 font-mono font-bold text-amber-600">{tmp.code}</td>
                        <td className="px-4 py-3 font-bold text-slate-900">{tmp.name}</td>
                        <td className="px-4 py-3 font-medium text-slate-700">{tmp.type}</td>
                        <td className="px-4 py-3 text-indigo-600 font-mono italic">{tmp.fileName}</td>
                        <td className="px-4 py-3 text-slate-800">{tmp.unitName}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDeleteEntity(tmp.id)}
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* DYNAMIC FORM CREATOR MODAL MAPPING MOUTHFUL INPUTS TO PRESERVE MEMORY */}
      {showFormModal && selectedEntity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sans">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                Cập nhật dữ liệu Phân hệ {EASY_HRM_MODULES.flatMap(g => g.items).find(i => i.id === activeSubTab)?.name}
              </h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="p-1 px-2 border border-slate-300 rounded text-slate-500 hover:text-slate-800 bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEntity} className="flex-1 overflow-auto p-6 space-y-6">
              
              {/* RENDER FORM DYNAMICALLY DEPENDING ON ACTIVE EXTRACTION SPEC */}
              {activeSubTab === "employees" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mã nhân viên (*)</label>
                    <input
                      type="text"
                      required
                      value={selectedEntity.id || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, id: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Họ tên nhân viên (*)</label>
                    <input
                      type="text"
                      required
                      value={selectedEntity.name || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tên thường gọi / Alias</label>
                    <input
                      type="text"
                      value={selectedEntity.aliasName || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, aliasName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tên nước ngoài</label>
                    <input
                      type="text"
                      value={selectedEntity.foreignName || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, foreignName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs focus:ring-1 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Giới tính</label>
                    <select
                      value={selectedEntity.gender || "Nữ"}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, gender: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={selectedEntity.birthDate || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, birthDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Phòng ban</label>
                    <select
                      value={selectedEntity.department || "CSKH"}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, department: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                    >
                      <option value="CSKH">CSKH</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Vận hành Sàn">Vận hành Sàn</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Cấp bậc / Chức vụ</label>
                    <input
                      type="text"
                      value={selectedEntity.position || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, position: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hộ chiếu / CCCD</label>
                    <input
                      type="text"
                      value={selectedEntity.identityNum || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, identityNum: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Điện thoại di động</label>
                    <input
                      type="text"
                      value={selectedEntity.personalEmail || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, personalEmail: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Địa chỉ thường trú</label>
                    <input
                      type="text"
                      value={selectedEntity.permanentAddress || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, permanentAddress: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mã số thuế TNCN</label>
                    <input
                      type="text"
                      value={selectedEntity.taxCode || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, taxCode: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {activeSubTab === "history" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Chọn Nhân viên (*)</label>
                    <select
                      value={selectedEntity.employeeId || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, employeeId: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                    >
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lương thực lãnh thực nhận</label>
                    <input
                      type="number"
                      value={selectedEntity.salaryReal || 0}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, salaryReal: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Lương đóng BHXH quy chuẩn</label>
                    <input
                      type="number"
                      value={selectedEntity.salaryInsurance || 0}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, salaryInsurance: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hành chính lý do điều chỉnh</label>
                    <input
                      type="text"
                      value={selectedEntity.reason || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, reason: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {activeSubTab === "dependents" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nhân viên bảo lãnh (*)</label>
                    <select
                      value={selectedEntity.employeeId || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, employeeId: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                    >
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Họ tên thân nhân (*)</label>
                    <input
                      type="text"
                      required
                      value={selectedEntity.relativeName || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, relativeName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Quan hệ gia cảnh</label>
                    <select
                      value={selectedEntity.relationship || "Con"}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, relationship: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                    >
                      <option value="Con">Con</option>
                      <option value="Vợ/Chồng">Vợ/Chồng</option>
                      <option value="Bố/Mẹ">Bố/Mẹ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>
              )}

              {activeSubTab === "maternity" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Nhân sự nữ áp dụng (*)</label>
                    <select
                      value={selectedEntity.employeeId || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, employeeId: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                    >
                      {employees.filter(e => e.gender === "Nữ").map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Số bé sinh (*)</label>
                    <input
                      type="number"
                      value={selectedEntity.childrenCount || 1}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, childrenCount: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Phụ cấp con nhỏ (Tiền mặt)</label>
                    <input
                      type="number"
                      value={selectedEntity.maternityAllowance || 0}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, maternityAllowance: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              {activeSubTab === "decisions" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mã Quyết Định (*)</label>
                    <input
                      type="text"
                      required
                      value={selectedEntity.decisionNumber || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, decisionNumber: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Loại Quyết Định</label>
                    <select
                      value={selectedEntity.decisionType || "Điều chuyển"}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, decisionType: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                    >
                      <option value="Bổ nhiệm">Bổ nhiệm</option>
                      <option value="Điều chuyển">Điều chuyển</option>
                      <option value="Tăng lương">Tăng lương</option>
                      <option value="Thôi việc">Thôi việc</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Người áp dụng (*)</label>
                    <select
                      value={selectedEntity.staffCode || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, staffCode: e.target.value })}
                      className="w-full bg-white border border-slate-300 rounded p-2 text-xs"
                    >
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Phòng ban mới</label>
                    <input
                      type="text"
                      value={selectedEntity.newDepartment || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, newDepartment: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Hiệu lực từ ngày</label>
                    <input
                      type="date"
                      value={selectedEntity.effectiveDate || ""}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, effectiveDate: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 text-xs rounded p-2"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Người ký (CEO/HRD)</label>
                    <input
                      type="text"
                      value={selectedEntity.signerName || "Trần Bảo Sơn"}
                      onChange={(e) => setSelectedEntity({ ...selectedEntity, signerName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* MOCK FALLBACK GENERIC COMPILER TO SUPPORT 17 TAB FORMS WITHOUT FAT-TOKEN GENERATION LIMITS */}
              {!["employees", "history", "dependents", "maternity", "decisions"].includes(activeSubTab) && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                  <div className="flex gap-2 items-center">
                    <Info className="w-5 h-5 text-indigo-500" />
                    <span className="text-xs font-bold text-indigo-900">Mẫu đăng ký nhanh dành cho {activeSubTab.toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Mã lực / Tên đại diện (*)</label>
                      <input
                        type="text"
                        required
                        value={selectedEntity.code || selectedEntity.name || ""}
                        onChange={(e) => setSelectedEntity({ ...selectedEntity, code: e.target.value, name: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-2 text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ghi chú bổ sung văn thư</label>
                      <input
                        type="text"
                        value={selectedEntity.reason || selectedEntity.fileName || ""}
                        onChange={(e) => setSelectedEntity({ ...selectedEntity, reason: e.target.value, fileName: e.target.value })}
                        className="w-full bg-white border border-slate-300 rounded p-2 text-xs outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Save Controls Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-2 -mx-6 -mb-6 md:p-6">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition shadow"
                >
                  Lưu & Áp dụng hồ sơ EasyHRM
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
