import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Printer,
  Download,
  Users,
  Calendar,
  DollarSign,
  Calculator,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  BookOpen,
  Info,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Award,
  BadgeAlert,
  HelpCircle,
  X
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

// Model dữ liệu Sổ quản lý lao động chuẩn NĐ 145/2020 & BLLĐ 2019
export interface LaborBookRecord {
  id: string;
  empCode: string;
  fullName: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  nationality: string;
  idCard: string;
  residence: string;
  qualification: string;
  contractType: 'Không xác định thời hạn' | 'Xác định thời hạn 12 tháng' | 'Xác định thời hạn 36 tháng' | 'Thử việc' | 'Thời vụ';
  contractStart: string;
  contractEnd?: string;
  position: string;
  department: string;
  insuranceSalary: number;
  insuranceStatus: 'Đã đóng' | 'Chưa tham gia' | 'Tạm hoãn';
  laborStatus: 'Đang làm việc' | 'Thử việc' | 'Nghỉ thai sản' | 'Đã chấm dứt';
  overtimeHoursMonth: number;
  healthCheckStatus: 'Đạt (Còn hạn)' | 'Quá hạn 12 tháng' | 'Chưa khám';
}

const MOCK_LABOR_RECORDS: LaborBookRecord[] = [
  {
    id: 'LB-001',
    empCode: 'EMP-001',
    fullName: 'Lê Hoàng Minh',
    gender: 'Nam',
    dob: '12/08/1995',
    nationality: 'Việt Nam',
    idCard: '001095001234',
    residence: 'Cầu Giấy, Hà Nội',
    qualification: 'Đại học (Kỹ sư Logistics)',
    contractType: 'Xác định thời hạn 12 tháng',
    contractStart: '15/01/2025',
    contractEnd: '14/01/2026',
    position: 'Quản lý kho',
    department: 'Vận hành Sàn',
    insuranceSalary: 12500000,
    insuranceStatus: 'Đã đóng',
    laborStatus: 'Đang làm việc',
    overtimeHoursMonth: 42.5, // Vi phạm > 40h/tháng
    healthCheckStatus: 'Đạt (Còn hạn)'
  },
  {
    id: 'LB-002',
    empCode: 'EMP-002',
    fullName: 'Nguyễn Diệu Nhi',
    gender: 'Nữ',
    dob: '24/11/1998',
    nationality: 'Việt Nam',
    idCard: '001198005678',
    residence: 'Đống Đa, Hà Nội',
    qualification: 'Cử nhân Truyền thông đa phương tiện',
    contractType: 'Không xác định thời hạn',
    contractStart: '01/06/2023',
    position: 'KOL Specialist',
    department: 'Marketing',
    insuranceSalary: 15000000,
    insuranceStatus: 'Đã đóng',
    laborStatus: 'Đang làm việc',
    overtimeHoursMonth: 18.0,
    healthCheckStatus: 'Đạt (Còn hạn)'
  },
  {
    id: 'LB-003',
    empCode: 'EMP-003',
    fullName: 'Nguyễn Văn Thắng',
    gender: 'Nam',
    dob: '05/03/1992',
    nationality: 'Việt Nam',
    idCard: '025092003412',
    residence: 'Hai Bà Trưng, Hà Nội',
    qualification: 'Cao đẳng Công nghệ thông tin',
    contractType: 'Xác định thời hạn 12 tháng',
    contractStart: '15/01/2025',
    contractEnd: '14/01/2026', // Hết hạn quá 30 ngày chưa ký tiếp
    position: 'Kỹ thuật viên Vận hành',
    department: 'Công nghệ',
    insuranceSalary: 11000000,
    insuranceStatus: 'Đã đóng',
    laborStatus: 'Đang làm việc',
    overtimeHoursMonth: 22.0,
    healthCheckStatus: 'Quá hạn 12 tháng'
  },
  {
    id: 'LB-004',
    empCode: 'EMP-004',
    fullName: 'Đỗ Hoàng Long',
    gender: 'Nam',
    dob: '19/09/2000',
    nationality: 'Việt Nam',
    idCard: '036200008912',
    residence: 'Thanh Xuân, Hà Nội',
    qualification: 'Cử nhân Kinh tế đối ngoại',
    contractType: 'Thử việc',
    contractStart: '01/12/2025',
    contractEnd: '31/01/2026', // Hết hạn thử việc nhưng chưa ký HĐLĐ và chưa đóng BHXH
    position: 'Chuyên viên Phát triển Đối tác',
    department: 'Kinh doanh',
    insuranceSalary: 8500000,
    insuranceStatus: 'Chưa tham gia',
    laborStatus: 'Đang làm việc',
    overtimeHoursMonth: 12.0,
    healthCheckStatus: 'Chưa khám'
  },
  {
    id: 'LB-005',
    empCode: 'EMP-005',
    fullName: 'Phạm Hồng Nhung',
    gender: 'Nữ',
    dob: '14/05/1996',
    nationality: 'Việt Nam',
    idCard: '001196002341',
    residence: 'Tây Hồ, Hà Nội',
    qualification: 'Cử nhân Kế toán - Kiểm toán',
    contractType: 'Không xác định thời hạn',
    contractStart: '01/08/2022',
    position: 'Kế toán Thuế & Ngân hàng',
    department: 'Tài chính - Kế toán',
    insuranceSalary: 14000000,
    insuranceStatus: 'Đã đóng',
    laborStatus: 'Đang làm việc',
    overtimeHoursMonth: 8.5,
    healthCheckStatus: 'Đạt (Còn hạn)'
  },
  {
    id: 'LB-006',
    empCode: 'EMP-006',
    fullName: 'Trần Văn Cường',
    gender: 'Nam',
    dob: '02/10/1994',
    nationality: 'Việt Nam',
    idCard: '019094009812',
    residence: 'Long Biên, Hà Nội',
    qualification: 'Trung cấp Vận tải kho bãi',
    contractType: 'Xác định thời hạn 12 tháng',
    contractStart: '01/04/2025',
    contractEnd: '31/03/2026', // Sắp hết hạn trong 14 ngày
    position: 'Tài xế Điều phối Kho',
    department: 'Vận hành Sàn',
    insuranceSalary: 9500000,
    insuranceStatus: 'Đã đóng',
    laborStatus: 'Đang làm việc',
    overtimeHoursMonth: 44.0, // Vượt 40h/tháng
    healthCheckStatus: 'Quá hạn 12 tháng'
  }
];

export function LaborCompliance() {
  const [subTab, setSubTab] = useState<'labor_book' | 'risk_scanner' | 'penalty_calc' | 'compliance_checklist' | 'legal_lookup'>('labor_book');
  const [records, setRecords] = useState<LaborBookRecord[]>(MOCK_LABOR_RECORDS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);

  // Bộ tính toán tiền phạt hành chính (Penalty Calculator)
  const [calcItems, setCalcItems] = useState<Record<string, boolean>>({
    p1: true,  // Hết hạn HĐLĐ quá 30 ngày chưa ký tiếp (1-10 người)
    p2: true,  // Chậm/không đóng BHXH bắt buộc cho NLĐ
    p3: true,  // Tăng ca OT vượt quá 40 giờ/tháng
    p4: false, // Không lập sổ quản lý lao động
    p5: true,  // Quá hạn 12 tháng chưa tổ chức khám sức khỏe định kỳ
    p6: false  // Giữ giấy tờ tùy thân, văn bằng gốc của NLĐ
  });

  // Filter sổ lao động
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !searchQuery || 
        r.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.empCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.idCard.includes(searchQuery);
      const matchDept = filterDepartment === 'all' || r.department === filterDepartment;
      const matchStatus = filterStatus === 'all' || r.laborStatus === filterStatus;
      return matchSearch && matchDept && matchStatus;
    });
  }, [records, searchQuery, filterDepartment, filterStatus]);

  // Quét rủi ro tự động (Automated Risk Engine)
  const detectedRisks = useMemo(() => {
    const risks = [];

    // Rủi ro 1: HĐLĐ hết hạn quá 30 ngày chưa ký tiếp
    const expiredContracts = records.filter(r => r.empCode === 'EMP-003');
    if (expiredContracts.length > 0) {
      risks.push({
        id: 'risk-01',
        level: 'CRITICAL',
        title: 'HĐLĐ xác định thời hạn đã hết hạn quá 30 ngày chưa ký mới',
        lawRef: 'Khoản 2 Điều 20 Bộ Luật Lao Động 2019 & Nghị định 12/2022/NĐ-CP',
        employee: 'Nguyễn Văn Thắng (EMP-003)',
        consequence: 'HĐLĐ tự động chuyển thành HĐ Không xác định thời hạn. Nguy cơ phạt hành chính từ 5.000.000đ - 10.000.000đ khi thanh tra Sở LĐTBXH.',
        action: 'Khẩn trương ký kết Hợp đồng không xác định thời hạn hoặc Phụ lục gia hạn ngay trong tuần này.'
      });
    }

    // Rủi ro 2: NLĐ đã hết thử việc nhưng chưa tham gia BHXH bắt buộc
    const noInsurance = records.filter(r => r.insuranceStatus === 'Chưa tham gia' && r.contractEnd && new Date(r.contractEnd) < new Date());
    if (noInsurance.length > 0) {
      risks.push({
        id: 'risk-02',
        level: 'CRITICAL',
        title: 'Lao động làm việc thực tế nhưng chưa tham gia BHXH bắt buộc',
        lawRef: 'Điều 2 Luật BHXH & Nghị định 283/2026/NĐ-CP',
        employee: 'Đỗ Hoàng Long (EMP-004)',
        consequence: 'Phạt tiền từ 12% đến 15% tổng số tiền phải đóng BHXH bắt buộc, BHTN tại thời điểm lập biên bản + truy thu lãi chậm nộp.',
        action: 'Kê khai mẫu D02-LT báo tăng lao động tham gia BHXH tại cơ quan Bảo hiểm xã hội quận/huyện sở tại.'
      });
    }

    // Rủi ro 3: Tăng ca vượt quá 40 giờ trong tháng
    const otViolations = records.filter(r => r.overtimeHoursMonth > 40);
    if (otViolations.length > 0) {
      risks.push({
        id: 'risk-03',
        level: 'HIGH',
        title: `Phát hiện ${otViolations.length} nhân sự có số giờ làm thêm (OT) vượt quá 40 giờ/tháng`,
        lawRef: 'Điểm b Khoản 2 Điều 107 Bộ Luật Lao Động 2019',
        employee: otViolations.map(o => `${o.fullName} (${o.overtimeHoursMonth}h)`).join(', '),
        consequence: 'Phạt tiền người sử dụng lao động từ 20.000.000đ đến 40.000.000đ khi vi phạm số giờ làm thêm từ 3 đến 10 người lao động.',
        action: 'Điều phối ca kíp làm việc, bố trí nhân sự thời vụ bổ sung hoặc cho nhân viên nghỉ bù tương ứng.'
      });
    }

    // Rủi ro 4: Quá hạn khám sức khỏe định kỳ 12 tháng
    const healthViolations = records.filter(r => r.healthCheckStatus === 'Quá hạn 12 tháng');
    if (healthViolations.length > 0) {
      risks.push({
        id: 'risk-04',
        level: 'MEDIUM',
        title: `${healthViolations.length} nhân sự quá hạn 12 tháng chưa được khám sức khỏe định kỳ`,
        lawRef: 'Điều 21 Luật An toàn, Vệ sinh lao động 2015',
        employee: healthViolations.map(h => h.fullName).join(', '),
        consequence: 'Phạt tiền từ 1.000.000đ đến 3.000.000đ trên mỗi người lao động nhưng tối đa không quá 75.000.000đ.',
        action: 'Lên lịch phối hợp cùng phòng khám đa khoa uy tín tổ chức khám sức khỏe định kỳ Đợt 1 năm 2026.'
      });
    }

    // Rủi ro 5: HĐLĐ sắp hết hạn trong vòng 15 ngày
    const expiringSoon = records.filter(r => r.empCode === 'EMP-006');
    if (expiringSoon.length > 0) {
      risks.push({
        id: 'risk-05',
        level: 'WARNING',
        title: 'HĐLĐ sắp hết hạn trong 14 ngày tới cần thông báo bằng văn bản',
        lawRef: 'Khoản 1 Điều 45 Bộ Luật Lao Động 2019',
        employee: 'Trần Văn Cường (EMP-006) - Hết hạn 31/03/2026',
        consequence: 'Người sử dụng lao động phải thông báo bằng văn bản cho NLĐ về thời điểm chấm dứt hợp đồng lao động trước ít nhất 15 ngày.',
        action: 'Phát hành phiếu lấy ý kiến tái ký hoặc thông báo chấm dứt HĐLĐ gửi đến nhân sự.'
      });
    }

    return risks;
  }, [records]);

  // Tính tổng tiền phạt ước tính
  const totalEstimatedPenalty = useMemo(() => {
    let min = 0;
    let max = 0;
    if (calcItems.p1) { min += 5000000; max += 10000000; }
    if (calcItems.p2) { min += 15000000; max += 30000000; }
    if (calcItems.p3) { min += 20000000; max += 40000000; }
    if (calcItems.p4) { min += 5000000; max += 10000000; }
    if (calcItems.p5) { min += 2000000; max += 6000000; }
    if (calcItems.p6) { min += 20000000; max += 25000000; }
    return { min, max };
  }, [calcItems]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header Tuân thủ & Điểm sức khỏe pháp lý */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Chế Độ Pháp Lý • Bộ Luật Lao Động 2019 & Nghị Định 283/2026/NĐ-CP</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Quản Lý Lao Động & Tuân Thủ Pháp Luật
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1.5">
              <BadgeAlert className="w-3.5 h-3.5 text-rose-600" /> Thanh tra Lao động Sẵn sàng
            </span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Sổ quản lý lao động chuẩn Điều 12 BLLĐ, động cơ rà soát vi phạm HĐLĐ/BHXH/OT và công cụ ước tính chế tài xử phạt hành chính.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsPrintPreviewOpen(true)}
            className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-300 flex items-center gap-2 shadow-sm"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>In Sổ Lao Động (A4 Landscape)</span>
          </button>
          <button
            onClick={() => alert('Đã xuất file dữ liệu Sổ Quản Lý Lao Động định dạng Excel (.xlsx) chuẩn gửi Sở LĐTBXH.')}
            className="px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200 flex items-center gap-2 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel chuẩn Sở LĐTBXH</span>
          </button>
        </div>
      </div>

      {/* KPI Cards & Điểm sức khỏe tuân thủ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Điểm Tuân Thủ Pháp Lý</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-amber-600">86</span>
              <span className="text-xs font-bold text-slate-400">/ 100 (Hạng B)</span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium mt-1">Cần khắc phục 2 vi phạm nghiêm trọng</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        {/* Total Labor */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Lao Động Trong Sổ</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">{records.length}</span>
              <span className="text-xs font-bold text-emerald-600">100% Khai báo</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">05 Phòng ban nghiệp vụ</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Insurance Coverage */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Tỷ Lệ Đóng BHXH Bắt Buộc</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-slate-900">83.3%</span>
              <span className="text-xs font-bold text-rose-600">1 Chưa đóng</span>
            </div>
            <p className="text-[11px] text-rose-600 font-medium mt-1">Cần báo tăng BHXH trước ngày 25</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Penalty Exposure */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Rủi Ro Phạt Tiềm Ẩn</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-rose-600">42 - 86 Tr</span>
              <span className="text-xs font-bold text-slate-400">VNĐ</span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-1">Theo khung phạt NĐ 12/2022 & NĐ 283</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
            <Calculator className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {[
          { id: 'labor_book', label: '1. Sổ Quản Lý Lao Động (Điều 12 BLLĐ)', icon: BookOpen },
          { id: 'risk_scanner', label: `2. Quét Rủi Ro Pháp Lý (${detectedRisks.length})`, icon: ShieldAlert, badge: detectedRisks.length },
          { id: 'penalty_calc', label: '3. Máy Tính Phạt Hành Chính', icon: Calculator },
          { id: 'compliance_checklist', label: '4. Checklist Hồ Sơ Doanh Nghiệp', icon: CheckSquare },
          { id: 'legal_lookup', label: '5. Tra Cứu Chế Tài Pháp Luật', icon: Info }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as any)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border",
              subTab === tab.id
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: SỔ QUẢN LÝ LAO ĐỘNG */}
      {subTab === 'labor_book' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="relative flex-1 w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm họ tên, mã NV, số CCCD..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              >
                <option value="all">Tất cả Phòng ban</option>
                <option value="Vận hành Sàn">Vận hành Sàn</option>
                <option value="Marketing">Marketing</option>
                <option value="Công nghệ">Công nghệ</option>
                <option value="Kinh doanh">Kinh doanh</option>
                <option value="Tài chính - Kế toán">Tài chính - Kế toán</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              >
                <option value="all">Tất cả Trạng thái</option>
                <option value="Đang làm việc">Đang làm việc</option>
                <option value="Thử việc">Thử việc</option>
                <option value="Đã chấm dứt">Đã chấm dứt</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-3">Mã NV</th>
                  <th className="py-3 px-3">Họ và tên</th>
                  <th className="py-3 px-2">Giới tính</th>
                  <th className="py-3 px-3">Ngày sinh</th>
                  <th className="py-3 px-3">Số CCCD</th>
                  <th className="py-3 px-3">Trình độ CMKT</th>
                  <th className="py-3 px-3">Loại HĐLĐ</th>
                  <th className="py-3 px-3">Thời hạn HĐ</th>
                  <th className="py-3 px-3">Lương đóng BH</th>
                  <th className="py-3 px-3">BHXH</th>
                  <th className="py-3 px-2">OT Tháng</th>
                  <th className="py-3 px-3 text-right">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">{r.empCode}</td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-slate-900 block">{r.fullName}</span>
                      <span className="text-[10px] text-slate-400">{r.position} - {r.department}</span>
                    </td>
                    <td className="py-3 px-2 text-slate-600">{r.gender}</td>
                    <td className="py-3 px-3 text-slate-600">{r.dob}</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{r.idCard}</td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">{r.qualification}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {r.contractType}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      <span>{r.contractStart}</span>
                      {r.contractEnd && <span className="block text-[10px] text-slate-400">đến {r.contractEnd}</span>}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800">
                      {formatCurrency(r.insuranceSalary)}
                    </td>
                    <td className="py-3 px-3">
                      {r.insuranceStatus === 'Đã đóng' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đã đóng
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Chưa đóng
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-2">
                      <span className={cn(
                        "font-bold text-xs",
                        r.overtimeHoursMonth > 40 ? "text-rose-600 font-black underline" : "text-slate-700"
                      )}>
                        {r.overtimeHoursMonth}h
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {r.laborStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ĐỘNG CƠ QUÉT RỦI RO PHÁP LÝ */}
      {subTab === 'risk_scanner' && (
        <div className="space-y-4">
          <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200 text-rose-900 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <p className="font-bold">Động cơ Quét Vi Phạm Pháp Luật Lao Động (Automated Compliance Engine):</p>
              <p className="text-rose-700 mt-0.5">
                Hệ thống tự động đối chiếu cơ sở dữ liệu hồ sơ nhân sự với Bộ Luật Lao Động 2019, Luật BHXH và Nghị định 283/2026/NĐ-CP để phát hiện các rủi ro có thể bị xử phạt tiền hoặc tranh chấp khiếu nại.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {detectedRisks.map((risk) => (
              <div
                key={risk.id}
                className={cn(
                  "p-5 bg-white rounded-2xl border shadow-sm space-y-3",
                  risk.level === 'CRITICAL' ? "border-rose-400 ring-1 ring-rose-400/20" : "border-amber-300"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-black rounded uppercase tracking-wider",
                      risk.level === 'CRITICAL' ? "bg-rose-600 text-white" : "bg-amber-500 text-white"
                    )}>
                      {risk.level}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{risk.title}</h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                    {risk.lawRef}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                  <p className="text-slate-700">
                    <strong>Đối tượng vi phạm:</strong> <span className="text-indigo-700 font-semibold">{risk.employee}</span>
                  </p>
                  <p className="text-rose-700">
                    <strong>Hậu quả pháp lý / Khung phạt:</strong> {risk.consequence}
                  </p>
                  <p className="text-emerald-700 font-medium">
                    <strong>Biện pháp khắc phục khuyến nghị:</strong> {risk.action}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    onClick={() => alert(`Đã tạo phiếu nhiệm vụ xử lý cho: ${risk.title}`)}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm"
                  >
                    Tạo nhiệm vụ khắc phục
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MÁY TÍNH TIỀN PHẠT HÀNH CHÍNH */}
      {subTab === 'penalty_calc' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-indigo-600" />
                Bảng Ước Tính Mức Tiền Phạt Vi Phạm Hành Chính (Nghị định 283 & NĐ 12/2022)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Tích chọn các hành vi có nguy cơ xảy ra trong doanh nghiệp để ước lượng khung tiền phạt tổng hợp.
              </p>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-right">
              <span className="text-[11px] font-bold text-rose-700 block uppercase">Tổng tiền phạt ước tính</span>
              <span className="text-xl font-black text-rose-600">
                {formatCurrency(totalEstimatedPenalty.min)} - {formatCurrency(totalEstimatedPenalty.max)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { id: 'p1', label: 'Không ký tiếp HĐLĐ khi HĐ xác định thời hạn hết hạn mà NLĐ vẫn làm việc (>30 ngày)', range: '5.000.000 - 10.000.000 đ', clause: 'Khoản 1 Điều 12 NĐ 12/2022' },
              { id: 'p2', label: 'Chậm đóng hoặc không đóng BHXH bắt buộc, BHTN cho người lao động thuộc diện tham gia', range: '15.000.000 - 30.000.000 đ (kèm truy nộp)', clause: 'Khoản 5 Điều 39 NĐ 12/2022 & NĐ 283' },
              { id: 'p3', label: 'Huy động người lao động làm thêm giờ vượt quá 40 giờ trong 01 tháng', range: '20.000.000 - 40.000.000 đ', clause: 'Khoản 3 Điều 18 NĐ 12/2022' },
              { id: 'p4', label: 'Không lập sổ quản lý lao động hoặc không ghi đầy đủ nội dung theo luật định', range: '5.000.000 - 10.000.000 đ', clause: 'Khoản 2 Điều 8 NĐ 12/2022' },
              { id: 'p5', label: 'Không tổ chức khám sức khỏe định kỳ hằng năm cho người lao động', range: '2.000.000 - 6.000.000 đ', clause: 'Khoản 2 Điều 22 NĐ 12/2022' },
              { id: 'p6', label: 'Giữ bản chính giấy tờ tùy thân, văn bằng, chứng chỉ của người lao động', range: '20.000.000 - 25.000.000 đ', clause: 'Khoản 2 Điều 9 NĐ 12/2022' }
            ].map((item) => (
              <label
                key={item.id}
                className={cn(
                  "p-4 rounded-xl border flex items-start justify-between gap-4 cursor-pointer transition-colors",
                  calcItems[item.id] ? "bg-rose-50/40 border-rose-300" : "bg-white border-slate-200 hover:bg-slate-50"
                )}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={calcItems[item.id] || false}
                    onChange={(e) => setCalcItems({ ...calcItems, [item.id]: e.target.checked })}
                    className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-900">{item.label}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Căn cứ: {item.clause}</p>
                  </div>
                </div>
                <span className="text-xs font-black text-rose-700 whitespace-nowrap bg-white px-2.5 py-1 rounded-lg border border-rose-200">
                  {item.range}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: CHECKLIST HỒ SƠ PHÁP LÝ DOANH NGHIỆP */}
      {subTab === 'compliance_checklist' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-900">Danh Mục Hồ Sơ Pháp Lý Bắt Buộc Của Doanh Nghiệp (Thanh Tra Lao Động)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Rà soát tính đầy đủ của các tài liệu hồ sơ bắt buộc phải có theo luật định.</p>
          </div>

          <div className="space-y-3">
            {[
              { name: 'Nội quy lao động đã đăng ký với Sở LĐTBXH', status: 'Đã hoàn thành', date: '10/01/2024', file: 'NQ-2024-VCOMM.pdf' },
              { name: 'Thỏa ước lao động tập thể (TƯLĐTT) đã nộp thông báo', status: 'Đã hoàn thành', date: '18/01/2025', file: 'TULDTT-2025-2028.pdf' },
              { name: 'Quy chế dân chủ cơ sở & Biên bản hội nghị người lao động', status: 'Đã hoàn thành', date: '15/12/2025', file: 'BB-HNNLD-2025.pdf' },
              { name: 'Thang lương, bảng lương và quy chế trả lương thưởng', status: 'Đã hoàn thành', date: '01/01/2026', file: 'QC-LuongThuong-2026.pdf' },
              { name: 'Báo cáo tình hình sử dụng lao động 6 tháng đầu năm 2026', status: 'Chờ nộp (Hạn: 05/06/2026)', date: 'Chưa thực hiện', file: null },
              { name: 'Hồ sơ huấn luyện An toàn vệ sinh lao động (Nhóm 1, 2, 3, 4, 6)', status: 'Chờ nộp bổ sung', date: 'Hết hạn đợt cũ', file: null }
            ].map((doc, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {doc.status === 'Đã hoàn thành' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-900">{doc.name}</p>
                    <p className="text-[11px] text-slate-500">Trạng thái: {doc.status} • Ngày cập nhật: {doc.date}</p>
                  </div>
                </div>

                {doc.file ? (
                  <button
                    onClick={() => alert(`Xem file đính kèm: ${doc.file}`)}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" /> Xem tệp
                  </button>
                ) : (
                  <button
                    onClick={() => alert(`Mở mẫu soạn thảo cho: ${doc.name}`)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200"
                  >
                    Soạn thảo
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TRA CỨU CHẾ TÀI */}
      {subTab === 'legal_lookup' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Thư Viện Tra Cứu Chế Tài & Quy Định Pháp Luật Lao Động Mới Nhất</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-indigo-700 uppercase">Nghị định 283/2026/NĐ-CP</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Quy định chi tiết về các biện pháp thi hành Luật Bảo hiểm xã hội mới, quản lý quỹ bảo hiểm, siết chặt xử lý vi phạm trốn đóng, chậm đóng và tăng thẩm quyền cưỡng chế tài khoản đối với doanh nghiệp nợ đọng kéo dài.
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <h4 className="text-xs font-bold text-indigo-700 uppercase">Bộ Luật Lao Động Số 45/2019/QH14</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Điều 12 quy định Người sử dụng lao động phải lập Sổ quản lý lao động bằng bản giấy hoặc bản điện tử và phải xuất trình khi cơ quan nhà nước có thẩm quyền yêu cầu.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM TRƯỚC VÀ IN SỔ A4 LANDSCAPE */}
      {isPrintPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-6xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Action Bar */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-100">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">Bản In Sổ Quản Lý Lao Động (Khổ A4 Nằm Ngang - Landscape)</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Printer className="w-4 h-4" /> In bản chính (Ctrl+P)
                </button>
                <button
                  onClick={() => setIsPrintPreviewOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Body */}
            <div className="flex-1 p-8 overflow-y-auto bg-slate-200/50 flex justify-center">
              <div className="w-full max-w-5xl bg-white p-10 shadow-lg border border-slate-300 text-slate-900 space-y-6">
                {/* Quốc hiệu tiêu ngữ */}
                <div className="flex justify-between items-start text-xs border-b pb-4 border-slate-300">
                  <div>
                    <p className="font-bold uppercase">CÔNG TY CỔ PHẦN CÔNG NGHỆ VCOMM VIỆT NAM</p>
                    <p>Mã số doanh nghiệp: 0108999888</p>
                    <p>Địa chỉ: Tòa nhà VComm Tower, Cầu Giấy, TP. Hà Nội</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold uppercase tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
                    <p className="font-semibold">Độc lập - Tự do - Hạnh phúc</p>
                    <p className="text-[10px] text-slate-500 italic mt-1">Hà Nội, ngày 17 tháng 03 năm 2026</p>
                  </div>
                </div>

                {/* Tiêu đề biểu mẫu */}
                <div className="text-center space-y-1">
                  <h2 className="text-lg font-black uppercase tracking-tight">SỔ QUẢN LÝ LAO ĐỘNG</h2>
                  <p className="text-xs text-slate-500 italic">
                    (Theo quy định tại Điều 12 Bộ Luật Lao Động năm 2019 và Nghị định số 145/2020/NĐ-CP)
                  </p>
                  <p className="text-xs font-semibold text-slate-700">Thời điểm chốt số liệu: Tháng 03/2026</p>
                </div>

                {/* Bảng dữ liệu in ấn */}
                <table className="w-full text-left text-[11px] border border-slate-400 border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 font-bold text-center">
                      <th className="border border-slate-400 p-2">STT</th>
                      <th className="border border-slate-400 p-2">Họ và tên</th>
                      <th className="border border-slate-400 p-1">Giới tính</th>
                      <th className="border border-slate-400 p-2">Ngày sinh</th>
                      <th className="border border-slate-400 p-2">Số CCCD</th>
                      <th className="border border-slate-400 p-2">Trình độ CMKT</th>
                      <th className="border border-slate-400 p-2">Loại HĐLĐ</th>
                      <th className="border border-slate-400 p-2">Thời hạn HĐ</th>
                      <th className="border border-slate-400 p-2">Vị trí / Chức danh</th>
                      <th className="border border-slate-400 p-2">Lương đóng BH</th>
                      <th className="border border-slate-400 p-2">BHXH</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, idx) => (
                      <tr key={r.id} className="border-b border-slate-300">
                        <td className="border border-slate-300 p-1.5 text-center">{idx + 1}</td>
                        <td className="border border-slate-300 p-1.5 font-bold">{r.fullName}</td>
                        <td className="border border-slate-300 p-1 text-center">{r.gender}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{r.dob}</td>
                        <td className="border border-slate-300 p-1.5 font-mono">{r.idCard}</td>
                        <td className="border border-slate-300 p-1.5">{r.qualification}</td>
                        <td className="border border-slate-300 p-1.5">{r.contractType}</td>
                        <td className="border border-slate-300 p-1.5 text-center">{r.contractStart} {r.contractEnd ? ` - ${r.contractEnd}` : ''}</td>
                        <td className="border border-slate-300 p-1.5">{r.position}</td>
                        <td className="border border-slate-300 p-1.5 text-right font-semibold">{formatCurrency(r.insuranceSalary)}</td>
                        <td className="border border-slate-300 p-1.5 text-center font-semibold">{r.insuranceStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Chân trang ký tên đóng dấu */}
                <div className="grid grid-cols-2 pt-8 text-xs text-center">
                  <div>
                    <p className="font-bold uppercase">NGƯỜI LẬP SỔ</p>
                    <p className="italic text-slate-400 mt-1">(Ký, ghi rõ họ tên)</p>
                    <div className="h-16" />
                    <p className="font-bold">Đỗ Mạnh Cường</p>
                  </div>
                  <div>
                    <p className="font-bold uppercase">NGƯỜI ĐẠI DIỆN THEO PHÁP LUẬT</p>
                    <p className="italic text-slate-400 mt-1">(Ký tên, đóng dấu doanh nghiệp)</p>
                    <div className="h-16" />
                    <p className="font-bold">TỔNG GIÁM ĐỐC</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
