import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Wallet, 
  Building2, 
  Calendar, 
  FileSignature, 
  Lock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

interface EmployeePayslipModalProps {
  payroll: any;
  employee?: any;
  onClose: () => void;
  onSignPayslip?: (payrollId: string) => void;
}

export function EmployeePayslipModal({ payroll, employee, onClose, onSignPayslip }: EmployeePayslipModalProps) {
  const [pinCode, setPinCode] = useState('');
  const [isSigned, setIsSigned] = useState(payroll.isSigned || false);
  const [showSignPrompt, setShowSignPrompt] = useState(false);
  const [signError, setSignError] = useState('');

  if (!payroll) return null;

  const baseSalary = payroll.baseSalary || 15000000;
  const actualWorkDays = payroll.actualWorkDays || 22;
  const standardWorkDays = 22;
  const salaryByWorkDays = Math.round((baseSalary / standardWorkDays) * actualWorkDays);
  
  const allowance = payroll.allowance || 1500000;
  const kpiBonus = payroll.bonus || 2000000;
  const salesCommission = payroll.commission || 1200000;
  const totalIncome = salaryByWorkDays + allowance + kpiBonus + salesCommission;

  // Social Insurance deductions (Statutory 10.5%)
  const socialInsurance = Math.round(baseSalary * 0.08); // 8% BHXH
  const healthInsurance = Math.round(baseSalary * 0.015); // 1.5% BHYT
  const unemploymentInsurance = Math.round(baseSalary * 0.01); // 1% BHTN
  const totalInsurance = socialInsurance + healthInsurance + unemploymentInsurance;

  // Personal Income Tax (PIT)
  const pit = payroll.pitAmount || Math.round(Math.max(0, totalIncome - totalInsurance - 11000000) * 0.05);
  const totalDeduction = totalInsurance + pit;
  const netSalary = totalIncome - totalDeduction;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmSign = () => {
    if (pinCode.length < 4) {
      setSignError('Vui lòng nhập mã PIN/OTP cá nhân (ít nhất 4 chữ số).');
      return;
    }
    setIsSigned(true);
    setShowSignPrompt(false);
    if (onSignPayslip) {
      onSignPayslip(payroll.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight">Phiếu Lương Điện Tử (e-Payslip)</h3>
                {isSigned ? (
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Đã Ký Xác Nhận
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/30">
                    Chờ Ký Xác Nhận
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kỳ chi trả: Tháng 03/2024 • Doanh nghiệp: VComm Global Commerce JSC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="In phiếu lương"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Payslip Document Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh] bg-slate-50">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
            
            {/* Enterprise Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <span className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  CÔNG TY CỔ PHẦN THƯƠNG MẠI VCOMM
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">Tầng 12, Tòa nhà V-Center, 29 Liễu Giai, Ba Đình, Hà Nội</p>
                <p className="text-[11px] text-slate-500">Mã số thuế: 0109988776</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-slate-400">Mã phiếu: #{payroll.id}</span>
                <p className="text-xs font-bold text-indigo-700 mt-1">Kỳ lương: 03/2024</p>
              </div>
            </div>

            {/* Employee Info Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Nhân viên</span>
                <span className="font-bold text-slate-900">{payroll.employeeName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Mã nhân sự</span>
                <span className="font-mono font-bold text-indigo-700">{payroll.employeeId}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Phòng ban</span>
                <span className="font-semibold text-slate-700">{payroll.department || 'Vận hành TMĐT'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Công thực tế</span>
                <span className="font-mono font-bold text-emerald-700">{actualWorkDays} / {standardWorkDays} ngày</span>
              </div>
            </div>

            {/* Breakdown Table */}
            <div className="space-y-4">
              {/* Income Items */}
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>I. Các Khoản Thu Nhập (Gross)</span>
                  <span className="font-mono text-emerald-600 font-bold">{formatCurrency(totalIncome)}</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-50/50">
                    <span className="text-slate-600 pl-2">1. Lương cơ bản theo hợp đồng</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(baseSalary)}</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-600 pl-2">2. Lương thực tế theo ngày công ({actualWorkDays}/{standardWorkDays})</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(salaryByWorkDays)}</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-600 pl-2">3. Phụ cấp ăn trưa, đi lại & điện thoại</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(allowance)}</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-600 pl-2">4. Thưởng hiệu quả công việc (KPI)</span>
                    <span className="font-mono font-bold text-emerald-600">+{formatCurrency(kpiBonus)}</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-600 pl-2">5. Hoa hồng bán hàng TMĐT / Affiliate</span>
                    <span className="font-mono font-bold text-emerald-600">+{formatCurrency(salesCommission)}</span>
                  </div>
                </div>
              </div>

              {/* Deductions Items */}
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>II. Các Khoản Khấu Trừ Bắt Buộc</span>
                  <span className="font-mono text-rose-600 font-bold">-{formatCurrency(totalDeduction)}</span>
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 text-xs">
                  <div className="flex justify-between p-2.5 bg-slate-50/50">
                    <span className="text-slate-600 pl-2">1. Bảo hiểm xã hội (8% BHXH)</span>
                    <span className="font-mono font-bold text-slate-700">-{formatCurrency(socialInsurance)}</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-600 pl-2">2. Bảo hiểm y tế (1.5% BHYT)</span>
                    <span className="font-mono font-bold text-slate-700">-{formatCurrency(healthInsurance)}</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-600 pl-2">3. Bảo hiểm thất nghiệp (1% BHTN)</span>
                    <span className="font-mono font-bold text-slate-700">-{formatCurrency(unemploymentInsurance)}</span>
                  </div>
                  <div className="flex justify-between p-2.5">
                    <span className="text-slate-600 pl-2">4. Thuế thu nhập cá nhân (TNCN)</span>
                    <span className="font-mono font-bold text-rose-600">-{formatCurrency(pit)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Pay Grand Total */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-xl text-white flex justify-between items-center shadow-lg">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                  THỰC LÃNH CHUYỂN KHOẢN (NET PAY)
                </span>
                <p className="text-xs text-slate-300 mt-0.5">Đã hạch toán qua tài khoản Techcombank</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  {formatCurrency(netSalary)}
                </span>
              </div>
            </div>

            {/* Signature & Confirmation Section */}
            <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-slate-500">
                {isSigned ? (
                  <div className="space-y-1">
                    <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Nhân viên đã ký số xác nhận e-Payslip
                    </span>
                    <p className="text-[10px] text-slate-400">Thời gian ký: {new Date().toLocaleString('vi-VN')} • Mã xác thực: VC-AUTH-9982</p>
                  </div>
                ) : (
                  <span className="text-amber-700 font-medium flex items-center gap-1.5">
                    <Lock className="w-4 h-4" /> Vui lòng kiểm tra và ký xác nhận phiếu lương
                  </span>
                )}
              </div>

              {!isSigned && (
                <div>
                  {showSignPrompt ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="password"
                        value={pinCode}
                        onChange={e => setPinCode(e.target.value)}
                        placeholder="Mã PIN (VD: 1234)"
                        className="w-32 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <button
                        onClick={handleConfirmSign}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer shadow-xs"
                      >
                        Ký Ngay
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowSignPrompt(true)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <FileSignature className="w-4 h-4" />
                      <span>Ký Xác Nhận e-Sign</span>
                    </button>
                  )}
                  {signError && <p className="text-[10px] text-rose-600 mt-1">{signError}</p>}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-400">Bảo mật tuyệt đối theo tiêu chuẩn ESS Portal 2026.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
