import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  DollarSign, 
  Calculator, 
  Receipt, 
  ShieldCheck, 
  FileSpreadsheet, 
  Download, 
  Lock, 
  CheckCircle2, 
  Sparkles,
  Building2,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { HRPayrollSimulator } from './hr/HRPayrollSimulator';
import { cn, formatCurrency } from '../lib/utils';

export function PayrollApp() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'simulator' | 'sheet'>('simulator');
  const [isLocked, setIsLocked] = useState(false);

  const samplePayrollData = [
    { id: '1', code: 'EMP-001', name: 'Lê Hoàng Minh', dept: 'Vận hành Sàn', base: 28000000, allowance: 3500000, kpi: 6000000, days: 26, bhxh: 2940000, pit: 2150000, net: 32410000, status: 'APPROVED' },
    { id: '2', code: 'EMP-002', name: 'Nguyễn Diệu Nhi', dept: 'Marketing', base: 22000000, allowance: 2500000, kpi: 4500000, days: 25, bhxh: 2310000, pit: 1250000, net: 25440000, status: 'APPROVED' },
    { id: '3', code: 'EMP-003', name: 'Trần Văn Tuấn', dept: 'Kỹ thuật', base: 35000000, allowance: 4000000, kpi: 8000000, days: 26, bhxh: 3675000, pit: 4520000, net: 38805000, status: 'PENDING' },
    { id: '4', code: 'EMP-004', name: 'Hoàng Thị Thảo', dept: 'Kế toán', base: 20000000, allowance: 2000000, kpi: 3000000, days: 26, bhxh: 2100000, pit: 850000, net: 22050000, status: 'APPROVED' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Navigation Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-5 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300/60 text-xs font-black transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Quay lại Launcher chính (/)"
          >
            <ArrowLeft className="w-4 h-4 text-amber-700" />
            <span>Launcher</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md">
                <DollarSign className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                VComm Tiền Lương & Đãi Ngộ C&B
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" /> Chuẩn Luật LĐ 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Động cơ tính lương tự động Net/Gross, đối soát ngân hàng lô & phân bổ chi phí kế toán VComm
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/insurance')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Xem BHXH & Chế độ</span>
          </button>

          <button
            onClick={() => navigate('/tax-pit')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Receipt className="w-3.5 h-3.5 text-blue-600" />
            <span>Quyết toán Thuế TNCN</span>
          </button>

          <button
            onClick={() => setIsLocked(!isLocked)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-2xl text-white text-xs font-black shadow-lg transition-all cursor-pointer",
              isLocked 
                ? "bg-slate-700 hover:bg-slate-800 shadow-slate-700/25" 
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/25"
            )}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLocked ? "Bảng Lương Đã Khóa" : "Chốt & Khóa Bảng Lương"}</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm w-fit text-xs font-bold">
        <button
          onClick={() => setActiveTab('simulator')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer",
            activeTab === 'simulator'
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
          )}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Mô Phỏng & Tính Lương Net/Gross</span>
        </button>

        <button
          onClick={() => setActiveTab('sheet')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer",
            activeTab === 'sheet'
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
          )}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Bảng Lương Kỳ 09/2026 Toàn Công Ty</span>
        </button>
      </div>

      {/* Main Content */}
      {activeTab === 'simulator' && (
        <div className="space-y-6">
          <HRPayrollSimulator />
        </div>
      )}

      {activeTab === 'sheet' && (
        <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Bảng Tổng Hợp Chi Trả Lương Tháng 09/2026</h3>
              <p className="text-xs text-slate-500">Đã đối soát công từ Mini App Chấm công & tính trừ bảo hiểm 10.5%</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition">
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Lệnh Chi Ngân Hàng Lô</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                  <th className="p-3 font-bold">Mã NV</th>
                  <th className="p-3 font-bold">Họ & Tên</th>
                  <th className="p-3 font-bold">Phòng ban</th>
                  <th className="p-3 font-bold text-right">Lương cơ bản</th>
                  <th className="p-3 font-bold text-right">Phụ cấp & KPI</th>
                  <th className="p-3 font-bold text-center">Công</th>
                  <th className="p-3 font-bold text-right">Khấu trừ BHXH</th>
                  <th className="p-3 font-bold text-right">Thuế TNCN</th>
                  <th className="p-3 font-bold text-right">Thực nhận (Net)</th>
                  <th className="p-3 font-bold text-center">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {samplePayrollData.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-700">{row.code}</td>
                    <td className="p-3 font-bold text-slate-900">{row.name}</td>
                    <td className="p-3 text-slate-600">{row.dept}</td>
                    <td className="p-3 text-right font-medium text-slate-800">{formatCurrency(row.base)}</td>
                    <td className="p-3 text-right font-medium text-slate-800">{formatCurrency(row.allowance + row.kpi)}</td>
                    <td className="p-3 text-center font-bold text-slate-700">{row.days}</td>
                    <td className="p-3 text-right text-rose-600 font-medium">-{formatCurrency(row.bhxh)}</td>
                    <td className="p-3 text-right text-rose-600 font-medium">-{formatCurrency(row.pit)}</td>
                    <td className="p-3 text-right font-black text-emerald-600">{formatCurrency(row.net)}</td>
                    <td className="p-3 text-center">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold",
                        row.status === 'APPROVED' ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                      )}>
                        {row.status === 'APPROVED' ? 'Đã duyệt' : 'Chờ duyệt'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
