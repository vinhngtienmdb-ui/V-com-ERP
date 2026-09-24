import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Calculator,
  Download,
  FileCheck,
  Users,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  HelpCircle,
  ArrowRight,
  TrendingDown,
  Building,
  Search,
  Eye,
  FileText,
  Landmark,
  ArrowUpRight
} from 'lucide-react';
import { doc, setDoc, db } from '../lib/firebase';

interface TaxEmployee {
  id: string;
  name: string;
  position: string;
  department: string;
  taxCode: string;
  grossIncome: number;
  insuranceDeduction: number; // 10.5% (BHXH 8%, BHYT 1.5%, BHTN 1%)
  dependentsCount: number;
  dependentRelief: number; // 4.4M * số người phụ thuộc
  taxableIncome: number; // Thu nhập tính thuế sau giảm trừ
  taxBracket: number; // Bậc thuế 1 - 7
  pitAmount: number; // Thuế TNCN phải nộp
  netIncome: number; // Lương thực nhận
  status: 'declared' | 'pending' | 'finalized';
}

export const TaxPIT: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'employees' | 'brackets' | 'declaration' | 'finalization'>('employees');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSyncingFinance, setIsSyncingFinance] = useState(false);
  const [syncedVoucherId, setSyncedVoucherId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Định mức giảm trừ gia cảnh theo Nghị quyết 954/2020/UBTVQH14
  const PERSONAL_RELIEF = 11000000; // 11 triệu/tháng
  const DEPENDENT_RELIEF_PER_PERSON = 4400000; // 4.4 triệu/tháng/người

  // Helper tính thuế TNCN lũy tiến 7 bậc chuẩn Thông tư 111/2013 & TT92/2015
  const computeEmployeePit = (
    id: string,
    name: string,
    position: string,
    department: string,
    taxCode: string,
    gross: number,
    dependents: number,
    status: 'declared' | 'pending' | 'finalized' = 'declared'
  ): TaxEmployee => {
    const insuranceDeduction = Math.min(Math.round(gross * 0.105), 4914000);
    const dependentRelief = dependents * DEPENDENT_RELIEF_PER_PERSON;
    const taxableIncome = Math.max(0, gross - insuranceDeduction - PERSONAL_RELIEF - dependentRelief);

    let taxBracket = 1;
    let pitAmount = 0;

    if (taxableIncome <= 0) {
      taxBracket = 0;
      pitAmount = 0;
    } else if (taxableIncome <= 5000000) {
      taxBracket = 1;
      pitAmount = Math.round(taxableIncome * 0.05);
    } else if (taxableIncome <= 10000000) {
      taxBracket = 2;
      pitAmount = Math.round(taxableIncome * 0.10 - 250000);
    } else if (taxableIncome <= 18000000) {
      taxBracket = 3;
      pitAmount = Math.round(taxableIncome * 0.15 - 750000);
    } else if (taxableIncome <= 32000000) {
      taxBracket = 4;
      pitAmount = Math.round(taxableIncome * 0.20 - 1650000);
    } else if (taxableIncome <= 52000000) {
      taxBracket = 5;
      pitAmount = Math.round(taxableIncome * 0.25 - 3250000);
    } else if (taxableIncome <= 80000000) {
      taxBracket = 6;
      pitAmount = Math.round(taxableIncome * 0.30 - 5850000);
    } else {
      taxBracket = 7;
      pitAmount = Math.round(taxableIncome * 0.35 - 9850000);
    }

    const netIncome = Math.round(gross - insuranceDeduction - pitAmount);

    return {
      id,
      name,
      position,
      department,
      taxCode,
      grossIncome: gross,
      insuranceDeduction,
      dependentsCount: dependents,
      dependentRelief,
      taxableIncome,
      taxBracket,
      pitAmount,
      netIncome,
      status
    };
  };

  const defaultInitialTaxData: TaxEmployee[] = [
    {
      id: 'EMP-001',
      name: 'Nguyễn Văn An',
      position: 'Tổng Giám Đốc (CEO)',
      department: 'Ban Điều Hành',
      taxCode: '8012345678',
      grossIncome: 85000000,
      insuranceDeduction: 3500000,
      dependentsCount: 2,
      dependentRelief: 8800000,
      taxableIncome: 61700000,
      taxBracket: 6,
      pitAmount: 12660000,
      netIncome: 68840000,
      status: 'declared'
    },
    {
      id: 'EMP-002',
      name: 'Trần Thị Mai Lan',
      position: 'Giám Đốc Vận Hành (COO)',
      department: 'Ban Điều Hành',
      taxCode: '8012345679',
      grossIncome: 60000000,
      insuranceDeduction: 3500000,
      dependentsCount: 1,
      dependentRelief: 4400000,
      taxableIncome: 41100000,
      taxBracket: 5,
      pitAmount: 7025000,
      netIncome: 49475000,
      status: 'declared'
    },
    {
      id: 'EMP-003',
      name: 'Lê Hoàng Minh',
      position: 'Trưởng Phòng R&D',
      department: 'Công Nghệ (R&D)',
      taxCode: '8012345680',
      grossIncome: 45000000,
      insuranceDeduction: 3500000,
      dependentsCount: 1,
      dependentRelief: 4400000,
      taxableIncome: 26100000,
      taxBracket: 4,
      pitAmount: 3570000,
      netIncome: 37930000,
      status: 'declared'
    },
    {
      id: 'EMP-004',
      name: 'Phạm Quỳnh Nga',
      position: 'Kế Toán Trưởng',
      department: 'Tài Chính - Kế Toán',
      taxCode: '8012345681',
      grossIncome: 32000000,
      insuranceDeduction: 3360000,
      dependentsCount: 0,
      dependentRelief: 0,
      taxableIncome: 17640000,
      taxBracket: 3,
      pitAmount: 1896000,
      netIncome: 26744000,
      status: 'finalized'
    },
    {
      id: 'EMP-005',
      name: 'Vũ Đức Thịnh',
      position: 'Giám Đốc Kho Vận HCM',
      department: 'Kho Vận & Chuỗi Cung Ứng',
      taxCode: '8012345682',
      grossIncome: 25000000,
      insuranceDeduction: 2625000,
      dependentsCount: 1,
      dependentRelief: 4400000,
      taxableIncome: 6975000,
      taxBracket: 2,
      pitAmount: 447500,
      netIncome: 21927500,
      status: 'pending'
    },
    {
      id: 'EMP-006',
      name: 'Đặng Thùy Dương',
      position: 'Trưởng Nhóm CSKH',
      department: 'Chăm Sóc Khách Hàng',
      taxCode: '8012345683',
      grossIncome: 18000000,
      insuranceDeduction: 1890000,
      dependentsCount: 0,
      dependentRelief: 0,
      taxableIncome: 5110000,
      taxBracket: 2,
      pitAmount: 261000,
      netIncome: 15849000,
      status: 'declared'
    }
  ];

  const loadMergedTaxData = (): TaxEmployee[] => {
    const baseList: TaxEmployee[] = defaultInitialTaxData;
    try {
      const saved = localStorage.getItem('vcomm_hr_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const mapped: TaxEmployee[] = parsed.map((e: any, idx: number) => {
            const gross = Number(e.salaryBase || e.salary || 22000000);
            const depCount = Number(e.dependentsCount ?? (idx % 2));
            const taxCode = e.taxCode || `80${String(10000000 + idx)}`;
            return computeEmployeePit(
              e.id || `EMP-${100 + idx}`,
              e.name,
              e.position || e.title || 'Nhân sự',
              e.department || 'Vận hành Sàn',
              taxCode,
              gross,
              depCount,
              'declared'
            );
          });

          const merged = [...baseList];
          mapped.forEach(m => {
            const existingIdx = merged.findIndex(item => item.id === m.id || item.name.toLowerCase() === m.name.toLowerCase());
            if (existingIdx >= 0) {
              merged[existingIdx] = m;
            } else {
              merged.push(m);
            }
          });
          return merged;
        }
      }
    } catch (e) {
      console.error('Failed to load vcomm_hr_employees into TaxPIT:', e);
    }
    return baseList;
  };

  const [taxData, setTaxData] = useState<TaxEmployee[]>(loadMergedTaxData);

  useEffect(() => {
    const handleSync = () => {
      setTaxData(loadMergedTaxData());
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('vcomm_employee_synced', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('vcomm_employee_synced', handleSync);
    };
  }, []);

  const handleSyncToFinance = async () => {
    try {
      setIsSyncingFinance(true);
      const now = new Date();
      const monthStr = String(now.getMonth() + 1).padStart(2, '0');
      const yearStr = String(now.getFullYear());
      const voucherId = `JE-PIT-${yearStr}-${monthStr}`;

      const totalTax = taxData.reduce((acc, curr) => acc + curr.pitAmount, 0);
      if (totalTax <= 0) {
        showToast('Tổng thuế TNCN bằng 0, không có phát sinh để hạch toán.');
        setIsSyncingFinance(false);
        return;
      }

      const journalEntry = {
        id: voucherId,
        date: now.toISOString(),
        ref: `PIT-${monthStr}/${yearStr}`,
        description: `Hạch toán trích khấu trừ Thuế TNCN người lao động kỳ ${monthStr}/${yearStr}`,
        tenantId: 'tenant-vcomm-prod-01',
        items: [
          { accountId: '3341', debit: totalTax, credit: 0, partnerId: 'CỤC THUẾ' },
          { accountId: '3335', debit: 0, credit: totalTax, partnerId: 'CỤC THUẾ' }
        ]
      };

      await setDoc(doc(db, 'journal_entries', voucherId), journalEntry);

      try {
        const cacheKey = 'fs_cache_docs_journal_entries';
        const cached = localStorage.getItem(cacheKey);
        const existingDocs = cached ? JSON.parse(cached) : [];
        const filtered = existingDocs.filter((d: any) => d.id !== voucherId);
        filtered.unshift({ id: voucherId, data: journalEntry });
        localStorage.setItem(cacheKey, JSON.stringify(filtered));
      } catch (e) {}

      window.dispatchEvent(new CustomEvent('vcomm_finance_synced', { detail: journalEntry }));

      setSyncedVoucherId(voucherId);
      showToast(`Đã hạch toán thành công chứng từ ${voucherId} (Nợ 3341 / Có 3335: ${formatCurrency(totalTax)}) sang Sổ cái Tài chính!`);
    } catch (err: any) {
      console.error('Failed to sync PIT to Finance:', err);
      showToast(`Lỗi khi hạch toán vào Kế toán: ${err.message || err}`);
    } finally {
      setIsSyncingFinance(false);
    }
  };

  const taxBrackets = [
    { bracket: 1, range: 'Đến 5 triệu VNĐ', rate: '5%', formula: 'Thu nhập tính thuế × 5%', maxAmount: 250000 },
    { bracket: 2, range: 'Trên 5 đến 10 triệu VNĐ', rate: '10%', formula: 'Thu nhập tính thuế × 10% - 250.000đ', maxAmount: 750000 },
    { bracket: 3, range: 'Trên 10 đến 18 triệu VNĐ', rate: '15%', formula: 'Thu nhập tính thuế × 15% - 750.000đ', maxAmount: 1950000 },
    { bracket: 4, range: 'Trên 18 đến 32 triệu VNĐ', rate: '20%', formula: 'Thu nhập tính thuế × 20% - 1.650.000đ', maxAmount: 4750000 },
    { bracket: 5, range: 'Trên 32 đến 52 triệu VNĐ', rate: '25%', formula: 'Thu nhập tính thuế × 25% - 3.250.000đ', maxAmount: 9750000 },
    { bracket: 6, range: 'Trên 52 đến 80 triệu VNĐ', rate: '30%', formula: 'Thu nhập tính thuế × 30% - 5.850.000đ', maxAmount: 18150000 },
    { bracket: 7, range: 'Trên 80 triệu VNĐ', rate: '35%', formula: 'Thu nhập tính thuế × 35% - 9.850.000đ', maxAmount: 'Không giới hạn' }
  ];

  const filteredData = taxData.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          emp.taxCode.includes(searchQuery) ||
                          emp.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept = selectedDept === 'ALL' || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  const totalTaxWithheld = taxData.reduce((acc, curr) => acc + curr.pitAmount, 0);
  const totalGrossPayroll = taxData.reduce((acc, curr) => acc + curr.grossIncome, 0);
  const totalDependents = taxData.reduce((acc, curr) => acc + curr.dependentsCount, 0);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Personal Income Tax (PIT)
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">NQ 954/2020 & Luật Thuế TNCN</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              Quản Trị Thuế Thu Nhập Cá Nhân
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200/60">
                Biểu lũy tiến 7 bậc
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200/60 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Đồng bộ VComm HRM ({taxData.length} nhân sự)
              </span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Tự động tính thuế TNCN, quản lý hồ sơ người phụ thuộc và kết xuất Tờ khai khấu trừ 05/KK-TNCN chuẩn XML nộp eTax.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleSyncToFinance}
            disabled={isSyncingFinance}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-xs active:scale-95 disabled:opacity-50"
            title="Tự động ghi chứng từ Nợ 3341 / Có 3335 vào Sổ cái Kế toán"
          >
            <Landmark className="w-4 h-4 text-indigo-200" />
            {isSyncingFinance ? 'Đang hạch toán...' : syncedVoucherId ? 'Đã hạch toán sang Kế toán ✓' : 'Hạch toán sang Kế toán (Nợ 3341 / Có 3335)'}
          </button>
          <button
            onClick={() => showToast('Đang kết xuất file XML Tờ khai 05/KK-TNCN chuẩn Cục Thuế...')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition shadow-2xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            Xuất XML 05/KK-TNCN
          </button>
          <button
            onClick={() => {
              setTaxData(loadMergedTaxData());
              showToast('Đã tính toán lại toàn bộ dữ liệu giảm trừ gia cảnh từ VComm HRM!');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-xs active:scale-95"
          >
            <Calculator className="w-4 h-4" />
            Quyết toán nhanh
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tổng thuế TNCN đã khấu trừ</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-blue-600 tracking-tight">{formatCurrency(totalTaxWithheld)}</div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Kỳ tính thuế: Tháng 09/2026</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Tổng quỹ lương chịu thuế (Gross)</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(totalGrossPayroll)}</div>
          <p className="text-[11px] text-emerald-600 mt-2 font-medium">Khấu trừ BHXH (10.5%): {formatCurrency(taxData.reduce((s, i) => s + i.insuranceDeduction, 0))}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Người phụ thuộc đăng ký</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">{totalDependents}</span>
            <span className="text-xs text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200/60">
              Định mức 4.4M / người
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Giảm trừ bản thân: 11.000.000 đ/tháng</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Trạng thái tờ khai Cục Thuế</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-emerald-600">Đã sẵn sàng nộp</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-medium">Mã cơ quan thuế quản lý: 010023456</p>
        </div>
      </div>

      {/* Tabs & Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          <button
            onClick={() => setActiveTab('employees')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'employees' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bảng tính khấu trừ ({taxData.length})
          </button>
          <button
            onClick={() => setActiveTab('brackets')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'brackets' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Biểu thuế 7 bậc & Công thức
          </button>
          <button
            onClick={() => setActiveTab('declaration')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'declaration' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tờ khai 05/KK-TNCN
          </button>
          <button
            onClick={() => setActiveTab('finalization')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              activeTab === 'finalization' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bảng kê 05-1/BK-TNCN
          </button>
        </div>

        {/* Search & Dept filter */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên, MST cá nhân..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 w-56 transition"
            />
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 py-2 px-3 focus:outline-none focus:border-blue-500 font-medium transition"
          >
            <option value="ALL">Tất cả phòng ban</option>
            <option value="Ban Điều Hành">Ban Điều Hành</option>
            <option value="Công Nghệ (R&D)">Công Nghệ (R&D)</option>
            <option value="Tài Chính - Kế Toán">Tài Chính - Kế Toán</option>
            <option value="Kho Vận & Chuỗi Cung Ứng">Kho Vận</option>
            <option value="Chăm Sóc Khách Hàng">CSKH</option>
          </select>
        </div>
      </div>

      {/* TAB 1: Employees List */}
      {activeTab === 'employees' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Họ và tên & MST</th>
                  <th className="p-3.5">Phòng ban</th>
                  <th className="p-3.5 text-right">Thu nhập Gross</th>
                  <th className="p-3.5 text-right">BHXH (10.5%)</th>
                  <th className="p-3.5 text-center">Người phụ thuộc</th>
                  <th className="p-3.5 text-right">Giảm trừ gia cảnh</th>
                  <th className="p-3.5 text-right">Thu nhập tính thuế</th>
                  <th className="p-3.5 text-center">Bậc</th>
                  <th className="p-3.5 text-right font-bold text-blue-600">Thuế TNCN nộp</th>
                  <th className="p-3.5 text-right font-bold text-emerald-600">Lương thực nhận Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredData.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{emp.name}</div>
                      <div className="text-[10px] font-mono text-slate-400">MST: {emp.taxCode}</div>
                    </td>
                    <td className="p-3.5 text-slate-600">{emp.department}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-slate-900">{formatCurrency(emp.grossIncome)}</td>
                    <td className="p-3.5 text-right font-mono text-slate-600">-{formatCurrency(emp.insuranceDeduction)}</td>
                    <td className="p-3.5 text-center">
                      <span className="font-bold text-purple-700 bg-purple-50 border border-purple-200/60 px-2 py-0.5 rounded-full text-[11px]">
                        {emp.dependentsCount} người
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-600">
                      -{formatCurrency(PERSONAL_RELIEF + emp.dependentRelief)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-medium text-slate-800">
                      {formatCurrency(emp.taxableIncome)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        Bậc {emp.taxBracket}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-blue-600">
                      {formatCurrency(emp.pitAmount)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                      {formatCurrency(emp.netIncome)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Tax Brackets */}
      {activeTab === 'brackets' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Biểu Thuế Lũy Tiến Từng Phần (Điều 22 Luật Thuế TNCN)</h3>
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                Thu nhập từ tiền lương, tiền công
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-600 uppercase font-bold tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Bậc thuế</th>
                    <th className="p-3.5">Thu nhập tính thuế / tháng</th>
                    <th className="p-3.5 text-center">Thuế suất</th>
                    <th className="p-3.5">Công thức tính nhanh</th>
                    <th className="p-3.5 text-right">Số thuế tối đa bậc</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {taxBrackets.map(b => (
                    <tr key={b.bracket} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3.5">
                        <span className="font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full text-xs">
                          Bậc {b.bracket}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium text-slate-900">{b.range}</td>
                      <td className="p-3.5 text-center font-bold text-blue-600">{b.rate}</td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-600">{b.formula}</td>
                      <td className="p-3.5 text-right font-mono font-semibold text-slate-800">
                        {typeof b.maxAmount === 'number' ? formatCurrency(b.maxAmount) : b.maxAmount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Quy Định Giảm Trừ Gia Cảnh
            </h4>
            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-medium">1. Mức giảm trừ bản thân:</span>
                <span className="text-base font-black text-blue-700">11.000.000 VNĐ / tháng</span>
                <span className="text-[11px] text-slate-400 block">(Tương đương 132.000.000 VNĐ / năm)</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block font-medium">2. Mức giảm trừ mỗi người phụ thuộc:</span>
                <span className="text-base font-black text-purple-700">4.400.000 VNĐ / tháng</span>
                <span className="text-[11px] text-slate-400 block">(Con dưới 18 tuổi, cha mẹ hết tuổi lao động)</span>
              </div>

              <div className="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl text-blue-900 space-y-1">
                <span className="font-bold block">3. Các khoản bảo hiểm bắt buộc trừ ra:</span>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  BHXH 8%, BHYT 1.5%, BHTN 1% được trừ 100% trước khi tính thu nhập chịu thuế TNCN.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Declaration Form 05/KK-TNCN */}
      {activeTab === 'declaration' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b border-slate-200 pb-6">
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
            <p className="text-[11px] text-slate-400 font-medium">Độc lập - Tự do - Hạnh phúc</p>
            <h2 className="text-xl font-black text-slate-900 mt-4 uppercase tracking-tight">
              TỜ KHAI KHẤU TRỪ THUẾ THU NHẬP CÁ NHÂN
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1">Mẫu số: 05/KK-TNCN (Ban hành kèm theo Thông tư 80/2021/TT-BTC)</p>
            <p className="text-xs text-blue-600 font-semibold mt-1">[X] Kỳ tính thuế: Tháng 09 năm 2026</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Tên người nộp thuế:</span>
              <span className="font-bold text-slate-900 text-sm">CÔNG TY CỔ PHẦN CÔNG NGHỆ THƯƠNG MẠI VCOMM</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-slate-500 block">Mã số thuế doanh nghiệp:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">0109988776</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Chỉ tiêu kê khai tổng hợp:</h4>
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex justify-between p-3 bg-white hover:bg-slate-50/50">
                <span className="font-medium text-slate-700">[21] Tổng số cá nhân có thu nhập chịu thuế:</span>
                <span className="font-mono font-bold text-slate-900">124 người</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50/50">
                <span className="font-medium text-slate-700">[22] Cá nhân cư trú có hợp đồng lao động:</span>
                <span className="font-mono font-bold text-slate-900">124 người</span>
              </div>
              <div className="flex justify-between p-3 bg-white hover:bg-slate-50/50">
                <span className="font-medium text-slate-700">[27] Tổng thu nhập trả cho cá nhân (Gross):</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(totalGrossPayroll)}</span>
              </div>
              <div className="flex justify-between p-3 bg-slate-50/50">
                <span className="font-medium text-slate-700">[31] Tổng số thuế thu nhập cá nhân đã khấu trừ:</span>
                <span className="font-mono font-black text-blue-600 text-sm">{formatCurrency(totalTaxWithheld)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              onClick={() => showToast('Đang kết xuất XML Tờ khai 05/KK-TNCN...')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Tải file XML nộp Thuế điện tử
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: Finalization 05-1/BK-TNCN */}
      {activeTab === 'finalization' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs max-w-4xl mx-auto space-y-6">
          <div className="text-center border-b border-slate-200 pb-6">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
              BẢNG KÊ CHI TIẾT CÁ NHÂN THUỘC DIỆN TÍNH THUẾ THEO BIỂU LŨY TIẾN
            </h2>
            <p className="text-xs text-slate-500 font-mono mt-1">Phụ lục 05-1/BK-TNCN (Kèm theo Tờ khai Quyết toán năm)</p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-bold block">Ủy quyền quyết toán thay: 120 / 124 nhân sự</span>
                <span className="text-[11px] text-emerald-700">Đã thu thập đầy đủ Giấy ủy quyền quyết toán thuế TNCN mẫu 08/UQ-TNCN.</span>
              </div>
            </div>
            <button
              onClick={() => showToast('Đang tải danh sách bản kê 05-1/BK-TNCN...')}
              className="px-3.5 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-lg hover:bg-emerald-700 transition"
            >
              Tải Bảng kê Excel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
