import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  HeartHandshake, 
  ShieldCheck, 
  FileCheck, 
  Download, 
  Plus, 
  Users, 
  Calendar, 
  Sparkles,
  Building2,
  AlertCircle
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export function InsuranceApp() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'employees' | 'd02' | 'benefits'>('employees');

  const insuranceList = [
    { id: '1', code: 'EMP-001', name: 'Lê Hoàng Minh', bhxhNumber: '7912345678', salaryBase: 28000000, companyPay: 6020000, employeePay: 2940000, status: 'ACTIVE', joinedDate: '2024-03-01' },
    { id: '2', code: 'EMP-002', name: 'Nguyễn Diệu Nhi', bhxhNumber: '7923456789', salaryBase: 22000000, companyPay: 4730000, employeePay: 2310000, status: 'ACTIVE', joinedDate: '2024-06-15' },
    { id: '3', code: 'EMP-003', name: 'Trần Văn Tuấn', bhxhNumber: '7934567890', salaryBase: 35000000, companyPay: 7525000, employeePay: 3675000, status: 'ACTIVE', joinedDate: '2023-11-01' },
    { id: '4', code: 'EMP-004', name: 'Hoàng Thị Thảo', bhxhNumber: '7945678901', salaryBase: 20000000, companyPay: 4300000, employeePay: 2100000, status: 'MATERNITY', joinedDate: '2024-01-10' },
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
                <HeartHandshake className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                VComm Bảo Hiểm Xã Hội Điện Tử
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-teal-500" /> Chuẩn BHXH VN
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Quản lý trích nộp BHXH (25.5%), BHYT (4.5%), BHTN (2%) & hồ sơ chế độ thai sản, ốm đau
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/payroll')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <span>Sang Bảng Lương</span>
          </button>

          <button
            onClick={() => alert("Đang xuất mẫu D02-LT điện tử chuẩn nộp Cổng Dịch vụ công BHXH...")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white text-xs font-black shadow-lg shadow-teal-500/25 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Hồ Sơ D02-LT</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg shadow-slate-200/30">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tổng Lao Động Tham Gia</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900">128</span>
            <span className="text-xs font-bold text-emerald-600">/ 130 nhân sự (98.5%)</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg shadow-slate-200/30">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trích Nộp Tháng Này (32%)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-teal-600">682.400.000đ</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg shadow-slate-200/30">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh Nghiệp Đóng (21.5%)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900">458.500.000đ</span>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/80 shadow-lg shadow-slate-200/30">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Người LĐ Trích (10.5%)</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-black text-slate-900">223.900.000đ</span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900">Danh Sách Trích Nộp BHXH, BHYT, BHTN Kỳ 09/2026</h3>
            <p className="text-xs text-slate-500">Áp dụng trần đóng BHXH/BHYT 46.800.000đ & BHTN 99.200.000đ</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                <th className="p-3 font-bold">Mã NV</th>
                <th className="p-3 font-bold">Họ & Tên</th>
                <th className="p-3 font-bold">Mã Số BHXH</th>
                <th className="p-3 font-bold text-right">Lương Đóng BHXH</th>
                <th className="p-3 font-bold text-right">DN Đóng (21.5%)</th>
                <th className="p-3 font-bold text-right">NLĐ Trích (10.5%)</th>
                <th className="p-3 font-bold text-right">Tổng Nộp (32%)</th>
                <th className="p-3 font-bold text-center">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {insuranceList.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-mono font-bold text-slate-700">{row.code}</td>
                  <td className="p-3 font-bold text-slate-900">{row.name}</td>
                  <td className="p-3 font-mono text-slate-600">{row.bhxhNumber}</td>
                  <td className="p-3 text-right font-medium text-slate-800">{formatCurrency(row.salaryBase)}</td>
                  <td className="p-3 text-right text-slate-700">{formatCurrency(row.companyPay)}</td>
                  <td className="p-3 text-right text-rose-600 font-medium">{formatCurrency(row.employeePay)}</td>
                  <td className="p-3 text-right font-black text-teal-700">{formatCurrency(row.companyPay + row.employeePay)}</td>
                  <td className="p-3 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold",
                      row.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-800" : "bg-purple-100 text-purple-800"
                    )}>
                      {row.status === 'ACTIVE' ? 'Bình thường' : 'Nghỉ thai sản'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
