import React, { useState } from 'react';
import { Users, DollarSign, Calendar, Clock, CreditCard, ChevronDown, CheckCircle2, TrendingUp, AlertTriangle, FileText, Download, UserCircle2, ArrowRight } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

interface EmployeePayroll {
  id: string;
  name: string;
  role: string;
  workDays: number;
  totalWorkDays: number;
  otHours: number;
  baseSalary: number; // Lương cơ bản thoả thuận
  allowances: number; // Phụ cấp
  bonus: number; // Thưởng (Hoa hồng, KPI)
  penalty: number; // Phạt (Đi muộn, lỗi)
  tax: number; // Thuế TNCN
  insurance: number; // BHXH, BHYT
  status: 'paid' | 'pending';
}

const mockPayrollData: EmployeePayroll[] = [
  {
    id: "EMP-001",
    name: "Nguyễn Văn Quản Lý",
    role: "Cửa hàng trưởng",
    workDays: 26,
    totalWorkDays: 26,
    otHours: 0,
    baseSalary: 15000000,
    allowances: 2000000,
    bonus: 3500000,
    penalty: 0,
    tax: 450000,
    insurance: 1575000,
    status: 'paid'
  },
  {
    id: "EMP-002",
    name: "Trần Thị Thu Ngân",
    role: "Thu ngân chính",
    workDays: 25,
    totalWorkDays: 26,
    otHours: 12,
    baseSalary: 8000000,
    allowances: 1000000,
    bonus: 1200000,
    penalty: 200000,
    tax: 0,
    insurance: 840000,
    status: 'pending'
  },
  {
    id: "EMP-003",
    name: "Lê Văn Phục Vụ",
    role: "Nhân viên Kho",
    workDays: 26,
    totalWorkDays: 26,
    otHours: 8,
    baseSalary: 7000000,
    allowances: 1000000,
    bonus: 800000,
    penalty: 0,
    tax: 0,
    insurance: 735000,
    status: 'pending'
  },
  {
    id: "EMP-004",
    name: "Phạm Hải Bán Hàng",
    role: "Nhân viên Bán hàng",
    workDays: 24,
    totalWorkDays: 26,
    otHours: 4,
    baseSalary: 7000000,
    allowances: 1000000,
    bonus: 500000,
    penalty: 500000,
    tax: 0,
    insurance: 735000,
    status: 'pending'
  }
];

const calculateDetails = (emp: EmployeePayroll) => {
   const actualBase = (emp.baseSalary / emp.totalWorkDays) * emp.workDays;
   const hourlyRate = emp.baseSalary / emp.totalWorkDays / 8;
   const otPay = emp.otHours * hourlyRate * 1.5;
   
   const gross = actualBase + otPay + emp.allowances + emp.bonus;
   const deductions = emp.penalty + emp.tax + emp.insurance;
   const net = gross - deductions;
   
   return { actualBase, otPay, gross, deductions, net };
};

export function IPosPayroll({ activeStore }: { activeStore: any }) {
  const [selectedMonth, setSelectedMonth] = useState('2024-05');
  const [employees, setEmployees] = useState<EmployeePayroll[]>(mockPayrollData);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeePayroll | null>(null);

  const stats = {
    totalNetPay: employees.reduce((acc, emp) => acc + calculateDetails(emp).net, 0),
    totalEmployees: employees.length,
    totalOT: employees.reduce((acc, emp) => acc + emp.otHours, 0)
  };
  
  return (
    <div className="col-span-12 flex-1 bg-slate-50 overflow-hidden flex flex-col h-full animate-in fade-in duration-300">
      <div className="bg-white border-b border-slate-300 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" /> Bảng Lương & Nhân Sự
          </h2>
          <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">{activeStore?.name || 'Tất cả chi nhánh'}</p>
        </div>
        <div className="flex gap-3">
           <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)} 
              className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-md text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-500 transition-all cursor-pointer" 
           />
           <button className="bg-emerald-600 text-white px-4 py-2 rounded-md text-xs font-bold shadow-sm hover:bg-emerald-700 flex items-center gap-2 transition-all">
             <CreditCard className="w-4 h-4" /> Thanh toán tự động (SePay)
           </button>
           <button className="bg-slate-900 text-white px-4 py-2 rounded-md text-xs font-bold shadow-sm hover:bg-slate-800 flex items-center gap-2 transition-all">
             <Download className="w-4 h-4" /> Xuất Excel
           </button>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto no-scrollbar">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
             {[{ label: 'Tổng lương thực nhận', val: formatCurrency(stats.totalNetPay), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { label: 'Số nhân sự hiện tại', val: stats.totalEmployees.toString(), icon: Users, color: 'text-primary-600', bg: 'bg-primary-50' },
               { label: 'Tổng giờ tăng ca (OT)', val: `${stats.totalOT} giờ`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' }].map((stat, idx) => (
                 <div key={idx} className="bg-white border text-center md:text-left border-slate-300 rounded-lg p-6 flex flex-col md:flex-row items-center md:items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
                     <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", stat.bg, stat.color)}>
                         <stat.icon className="w-6 h-6" />
                     </div>
                     <div>
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                         <p className="text-3xl font-black text-slate-900 tracking-tight">{stat.val}</p>
                     </div>
                 </div>
             ))}
         </div>
         
         <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden mb-6">
             <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50/50">
                <div>
                   <h3 className="font-bold text-slate-900 flex items-center gap-2 text-lg">
                      Chi tiết bảng lương tháng {selectedMonth.split('-')[1]}
                   </h3>
                   <p className="text-xs text-slate-600 mt-1">Hệ thống tự động chấm công, tính OT, phụ cấp, thưởng phạt và thuế TNCN chuẩn mực.</p>
                </div>
                <div className="flex gap-2">
                    <button className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-md text-xs font-bold shadow-sm hover:bg-slate-50 transition-colors">Đồng bộ lại chấm công</button>
                    <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-md text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors">Chốt bảng lương</button>
                </div>
             </div>
             
             <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-[#F9FAFB] border-b border-slate-300 text-slate-600">
                        <tr>
                            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest">Nhân viên</th>
                            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-center">Công chuẩn / Thực tế</th>
                            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-center">Tăng ca (OT)</th>
                            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-right">Lương CB & OT</th>
                            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-right">Thưởng / Phụ cấp</th>
                            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-right">Khấu trừ (Phạt/Thuế/BH)</th>
                            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-right">Thực nhận (Net)</th>
                            <th className="px-6 py-4 font-bold text-[10px] uppercase tracking-widest text-center">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {employees.map((emp) => {
                            const details = calculateDetails(emp);
                            return (
                                <tr 
                                    key={emp.id} 
                                    onClick={() => setSelectedEmployee(emp)}
                                    className="hover:bg-primary-50/30 cursor-pointer transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary-100 group-hover:text-primary-600 transition-colors shrink-0">
                                                <UserCircle2 className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{emp.name}</p>
                                                <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-0.5">{emp.role}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="inline-flex items-baseline gap-1">
                                            <span className={cn("font-bold text-base", emp.workDays < emp.totalWorkDays ? "text-rose-600" : "text-slate-800")}>{emp.workDays}</span>
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">/ {emp.totalWorkDays}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {emp.otHours > 0 ? (
                                            <span className="inline-flex items-center gap-1 bg-orange-50 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold">
                                                <Clock className="w-3.5 h-3.5" /> +{emp.otHours}h
                                            </span>
                                        ) : (
                                            <span className="text-slate-500 font-medium">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="font-bold text-slate-800">{formatCurrency(details.actualBase)}</p>
                                        {details.otPay > 0 && <p className="text-[10px] text-orange-600 font-bold uppercase mt-1">+ {formatCurrency(details.otPay)} (OT)</p>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {emp.allowances > 0 && <p className="text-[10px] text-primary-600 font-bold uppercase">PC: +{formatCurrency(emp.allowances)}</p>}
                                        {emp.bonus > 0 && <p className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5">Thưởng: +{formatCurrency(emp.bonus)}</p>}
                                        {emp.allowances === 0 && emp.bonus === 0 && <span className="text-slate-500">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {emp.insurance > 0 && <p className="text-[10px] text-slate-600 font-bold uppercase">BH: -{formatCurrency(emp.insurance)}</p>}
                                        {emp.tax > 0 && <p className="text-[10px] text-rose-500 font-bold uppercase mt-0.5">Thuế: -{formatCurrency(emp.tax)}</p>}
                                        {emp.penalty > 0 && <p className="text-[10px] text-amber-600 font-bold uppercase mt-0.5">Phạt: -{formatCurrency(emp.penalty)}</p>}
                                        {details.deductions === 0 && <span className="text-slate-500">-</span>}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <p className="font-black text-primary-700 text-base">{formatCurrency(details.net)}</p>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={cn(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                                            emp.status === 'paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                                        )}>
                                            {emp.status === 'paid' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                                            {emp.status === 'paid' ? 'Đã thanh toán' : 'Chờ TT'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
             </div>
         </div>
      </div>

      {/* Employee Details Sidebar/Modal (Simulated) */}
      {selectedEmployee && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in">
              <div className="w-full md:w-[480px] bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right-8">
                  <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                      <div>
                          <h3 className="font-black text-slate-900 text-lg">Phiếu Lương Chi Tiết</h3>
                          <p className="text-xs text-slate-600 uppercase tracking-widest font-bold mt-1">Kỳ lương: {selectedMonth} • {selectedEmployee.id}</p>
                      </div>
                      <button onClick={() => setSelectedEmployee(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                          <CheckCircle2 className="w-5 h-5 text-slate-500 rotate-45" />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                      <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center text-primary-600 border-2 border-primary-100">
                              <UserCircle2 className="w-8 h-8" />
                          </div>
                          <div>
                              <p className="font-black text-xl text-slate-900 tracking-tight">{selectedEmployee.name}</p>
                              <span className="inline-flex mt-1 items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 uppercase tracking-widest">
                                  {selectedEmployee.role}
                              </span>
                          </div>
                      </div>

                      {/* Thu nhập */}
                      <div className="space-y-4">
                          <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                              1. Tổng Thu Nhập (Gross)
                          </h4>
                          <div className="space-y-3 px-2">
                              <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600 font-medium">Lương cơ bản ({selectedEmployee.workDays}/{selectedEmployee.totalWorkDays} công)</span>
                                  <span className="font-bold text-slate-900">{formatCurrency(calculateDetails(selectedEmployee).actualBase)}</span>
                              </div>
                              {selectedEmployee.otHours > 0 && (
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-600 font-medium">Lương tăng ca (OT {selectedEmployee.otHours}h x 1.5)</span>
                                    <span className="font-bold text-slate-900">{formatCurrency(calculateDetails(selectedEmployee).otPay)}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600 font-medium">Phụ cấp (Ăn ca, Trách nhiệm)</span>
                                  <span className="font-bold text-slate-900">{formatCurrency(selectedEmployee.allowances)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600 font-medium">Thưởng KPI & Hoa hồng</span>
                                  <span className="font-bold text-emerald-600">+{formatCurrency(selectedEmployee.bonus)}</span>
                              </div>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center border border-slate-200">
                              <span className="font-bold text-slate-800 text-xs uppercase tracking-widest">Tổng thu nhập</span>
                              <span className="font-black text-slate-900 text-lg">{formatCurrency(calculateDetails(selectedEmployee).gross)}</span>
                          </div>
                      </div>

                      {/* Khấu trừ */}
                      <div className="space-y-4">
                          <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2 border-b border-slate-200 pb-2">
                              2. Các Khoản Khấu Trừ
                          </h4>
                          <div className="space-y-3 px-2">
                              <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600 font-medium">Khấu trừ BHXH, BHYT (10.5%)</span>
                                  <span className="font-bold text-rose-600">-{formatCurrency(selectedEmployee.insurance)}</span>
                              </div>
                              <div className="flex justify-between items-center text-sm">
                                  <span className="text-slate-600 font-medium">Thuế TNCN (Tạm tính)</span>
                                  <span className="font-bold text-rose-600">-{formatCurrency(selectedEmployee.tax)}</span>
                              </div>
                              {selectedEmployee.penalty > 0 && (
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="text-slate-600 font-medium">Khấu trừ vi phạm nội quy</span>
                                      <span className="font-bold text-amber-600">-{formatCurrency(selectedEmployee.penalty)}</span>
                                  </div>
                              )}
                          </div>
                          <div className="bg-slate-50 p-3 rounded-lg flex justify-between items-center border border-slate-200">
                              <span className="font-bold text-slate-800 text-xs uppercase tracking-widest">Tổng khấu trừ</span>
                              <span className="font-black text-rose-600 text-lg">-{formatCurrency(calculateDetails(selectedEmployee).deductions)}</span>
                          </div>
                      </div>

                      {/* Thực nhận */}
                      <div className="bg-gradient-to-r from-primary-900 to-primary-800 rounded-xl p-6 text-white shadow-md relative overflow-hidden group">
                          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
                          <p className="text-[10px] text-primary-200 font-black uppercase tracking-widest mb-1 relative z-10">
                              3. Lương Thực Nhận (Net Pay)
                          </p>
                          <p className="text-4xl font-black tracking-tight relative z-10">
                              {formatCurrency(calculateDetails(selectedEmployee).net)}
                          </p>
                          <div className="mt-4 pt-4 border-t border-primary-700/50 flex items-center justify-between relative z-10">
                              <span className="text-xs font-bold text-primary-200 uppercase tracking-widest">
                                  Trạng thái
                              </span>
                              <span className={cn(
                                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                                  selectedEmployee.status === 'paid' ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"
                              )}>
                                  {selectedEmployee.status === 'paid' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                  {selectedEmployee.status === 'paid' ? 'Đã Thanh Toán' : 'Chờ Thanh Toán'}
                              </span>
                          </div>
                      </div>
                  </div>

                  <div className="p-6 border-t border-slate-200 bg-slate-50 flex gap-3">
                      <button className="flex-1 py-3 bg-white border border-slate-300 text-slate-800 font-bold rounded-lg hover:bg-slate-100 transition-colors text-xs uppercase tracking-widest shadow-sm">
                          In Phiếu
                      </button>
                      <button className="flex-[2] py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors text-xs uppercase tracking-widest shadow-sm flex items-center justify-center gap-2">
                          Gửi Phiếu Lương (Zalo/Email) <ArrowRight className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}
