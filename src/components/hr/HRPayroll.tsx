import React, { useState, useEffect } from 'react';
import { orderBy } from 'firebase/firestore';
import {
  ArrowLeft, ArrowRight, Wallet, Zap, BadgeDollarSign,
  Edit2, X, CheckCircle2, Sparkles,
} from 'lucide-react';
import { DraggableGrid } from '../ui/DraggableGrid';
import { payrollRepo, type PayrollInput } from '../../services/repositories';
import { formatCurrency, cn } from '../../lib/utils';
import type { Payroll } from '../../types/erp';
import { MOCK_PAYROLL, MOCK_KPIs } from './mockData';

/**
 * netPay = baseSalary + overtime + bonus - deductions - insurance - tax
 * Pure function dùng cho cả UI và test.
 */
export function calcNetPay(params: {
  baseSalary: number;
  overtime?: number;
  bonus?: number;
  deductions?: number;
  insurance?: number;
  tax?: number;
}): number {
  const { baseSalary, overtime = 0, bonus = 0, deductions = 0, insurance = 0, tax = 0 } = params;
  return baseSalary + overtime + bonus - deductions - insurance - tax;
}

function adaptPayroll(p: PayrollInput): Payroll {
  return {
    id: p.id,
    employeeId: p.employeeId,
    employeeName: p.employeeName,
    month: p.period,
    baseSalary: p.baseSalary,
    allowance: p.allowance ?? 0,
    bonus: p.bonus ?? 0,
    deduction: p.deductions ?? 0,
    pitAmount: p.personalIncomeTax ?? 0,
    insuranceAmount: p.insurance ?? 0,
    netSalary: p.netPay,
    status: p.status === 'paid' ? 'paid' : 'pending',
  };
}

interface Props {
  onBack: () => void;
}

export function HRPayroll({ onBack }: Props) {
  const [dbPayroll, setDbPayroll] = useState<Payroll[]>([]);
  const payrollList = dbPayroll.length > 0 ? dbPayroll : MOCK_PAYROLL;

  const [editingPayrollId, setEditingPayrollId] = useState<string | null>(null);
  const [editPayrollForm, setEditPayrollForm] = useState<Partial<Payroll>>({});
  const [aiPayrollSuggestion, setAiPayrollSuggestion] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = payrollRepo.subscribe(
      [orderBy('period', 'desc')],
      (items) => setDbPayroll(items.map(adaptPayroll)),
    );
    return () => unsub();
  }, []);

  const handleSavePayroll = async () => {
    if (!editingPayrollId || !editPayrollForm) return;
    setSaving(true);
    try {
      const patch: Partial<Omit<PayrollInput, 'id'>> = {
        baseSalary: editPayrollForm.baseSalary ?? 0,
        allowance: editPayrollForm.allowance ?? 0,
        bonus: editPayrollForm.bonus ?? 0,
        deductions: editPayrollForm.deduction ?? 0,
        personalIncomeTax: editPayrollForm.pitAmount ?? 0,
        insurance: editPayrollForm.insuranceAmount ?? 0,
        netPay: editPayrollForm.netSalary ?? 0,
      };
      await payrollRepo.update(editingPayrollId, patch);
    } catch {
      // fallback local
    } finally {
      setSaving(false);
      setEditingPayrollId(null);
      setAiPayrollSuggestion(null);
    }
  };

  const handleAiSuggest = () => {
    const empKpi = MOCK_KPIs.find(k => k.employeeId === editPayrollForm.employeeId);
    let suggestBonus = editPayrollForm.bonus ?? 0;
    let suggestDed = editPayrollForm.deduction ?? 0;
    const notes: string[] = [];

    if (empKpi) {
      const cp = empKpi.current / empKpi.target;
      if (cp >= 1) {
        suggestBonus += 3000000;
        notes.push(`• Vượt KPI (${Math.round(cp * 100)}%): Đề xuất cộng 3,000,000 ₫ thưởng.`);
      } else if (cp < 0.8) {
        suggestDed += 1000000;
        notes.push(`• Không đạt KPI (< 80%): Đề xuất trừ 1,000,000 ₫.`);
      } else {
        notes.push(`• Đạt KPI cơ bản (${Math.round(cp * 100)}%).`);
      }
    }
    if (notes.length === 0) notes.push('• Không có đề xuất thay đổi.');

    setAiPayrollSuggestion(notes.join('\n'));
    setEditPayrollForm(prev => {
      const p = { ...prev, bonus: suggestBonus, deduction: suggestDed };
      p.pitAmount = ((p.baseSalary ?? 0) + (p.allowance ?? 0) + (p.bonus ?? 0) - (p.deduction ?? 0)) * 0.05;
      p.netSalary = calcNetPay({
        baseSalary: p.baseSalary ?? 0,
        bonus: (p.allowance ?? 0) + (p.bonus ?? 0),
        deductions: p.deduction ?? 0,
        insurance: p.insuranceAmount ?? 0,
        tax: p.pitAmount ?? 0,
      });
      return p;
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 border-b border-[#F3F4F6] bg-slate-50/50">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-orange-700 transition-colors bg-white border border-slate-300 px-4 py-2 rounded-lg w-fit shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Quay lại Giao diện chung
        </button>
      </div>

      <div className="p-8 bg-slate-50 min-h-[500px]">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Wallet className="w-6 h-6 text-orange-700" /> Quản lý Quỹ lương & Payslip
            </h2>
            <p className="text-xs text-slate-600 mt-1">Kỳ lương hiển thị: <strong className="text-slate-800">Tháng 03/2024</strong></p>
          </div>
          <div className="flex gap-3">
            <button className="bg-primary-600 text-[#FAF9F5] px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-primary-700">
              <Zap className="w-4 h-4" /> Tính lương AI (Batch)
            </button>
            <button className="bg-[#111827] text-[#FAF9F5] px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all hover:bg-slate-800">
              <BadgeDollarSign className="w-4 h-4 text-emerald-400" /> Xuất phiếu lương
            </button>
          </div>
        </div>

        <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" columns={4} gap={16}>
          <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tổng lương cơ bản</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(payrollList.reduce((a, p) => a + p.baseSalary, 0))}</p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tổng Phụ cấp & Thưởng</p>
            <p className="text-2xl font-bold text-emerald-600">+{formatCurrency(payrollList.reduce((a, p) => a + p.allowance + p.bonus, 0))}</p>
          </div>
          <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Thuế TNCN & BH</p>
            <p className="text-2xl font-bold text-red-500">-{formatCurrency(payrollList.reduce((a, p) => a + p.pitAmount + p.insuranceAmount, 0))}</p>
          </div>
          <div className="bg-gradient-to-br from-[#111827] to-slate-900 p-5 rounded-lg border border-slate-700 shadow-sm">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tổng chi trả Thực tế</p>
            <p className="text-2xl font-bold text-[#FAF9F5]">{formatCurrency(payrollList.reduce((a, p) => a + p.netSalary, 0))}</p>
          </div>
        </DraggableGrid>

        <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest">Mã / Tên Nhân viên</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Lương Cơ bản</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Thưởng / Phụ cấp</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Khấu trừ</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Thực lãnh</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-slate-600 uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrollList.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-100/30 transition-colors group">
                    <td className="px-3 py-2.5">
                      <p className="text-sm font-bold text-slate-900">{pay.employeeName}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">{pay.employeeId}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-sm text-slate-700">{formatCurrency(pay.baseSalary)}</td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xs font-bold text-emerald-600 font-mono">+{formatCurrency(pay.allowance + pay.bonus)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xs font-bold text-red-500 font-mono">-{formatCurrency(pay.pitAmount + pay.insuranceAmount)}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-[15px] font-bold text-[#2563EB] font-mono bg-slate-100 px-3 py-1 rounded-lg inline-block">{formatCurrency(pay.netSalary)}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-center">
                        <span className={cn(
                          'px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest',
                          pay.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700',
                        )}>
                          {pay.status === 'paid' ? 'Đã thanh toán' : 'Chờ duyệt chi'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => { setEditingPayrollId(pay.id); setEditPayrollForm(pay); }}
                        className="px-3 py-1.5 bg-primary-50 text-primary-600 rounded-lg text-[10px] font-bold hover:bg-primary-100 transition-all flex items-center gap-1.5 ml-auto border border-primary-100"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                ))}
                {payrollList.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-600">Không có dữ liệu bảng lương trong kỳ này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-slate-50 border-t border-slate-200 p-4 text-xs text-slate-600 font-medium flex justify-between items-center">
            <p className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Dữ liệu đã được đồng bộ với module Chấm công & KPI.
            </p>
            <p>Tổng số bản ghi: <strong>{payrollList.length}</strong></p>
          </div>
        </div>
      </div>

      {/* Edit Payroll Modal */}
      {editingPayrollId && editPayrollForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-sm w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900">Cập nhật Lương ({editPayrollForm.employeeName})</h3>
              <button onClick={() => { setEditingPayrollId(null); setAiPayrollSuggestion(null); }} className="p-2 text-slate-500 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors">
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
                {([
                  { key: 'baseSalary', label: 'Lương cơ bản', cls: '' },
                  { key: 'allowance', label: 'Phụ cấp', cls: '' },
                  { key: 'bonus', label: 'Thưởng (OT, KPI...)', cls: 'bg-emerald-50' },
                  { key: 'deduction', label: 'Phạt (Đi trễ, vắng...)', cls: 'bg-rose-50' },
                  { key: 'pitAmount', label: 'Thuế TNCN (-)', cls: 'bg-slate-50' },
                  { key: 'insuranceAmount', label: 'Bảo hiểm xã hội (-)', cls: 'bg-slate-50' },
                ] as const).map(({ key, label, cls }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-widest mb-2">{label}</label>
                    <input
                      type="number"
                      value={(editPayrollForm as any)[key] ?? 0}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditPayrollForm(prev => {
                          const p = { ...prev, [key]: val };
                          const base = p.baseSalary ?? 0;
                          const allow = p.allowance ?? 0;
                          const bonus = p.bonus ?? 0;
                          const ded = p.deduction ?? 0;
                          const ins = p.insuranceAmount ?? 0;
                          p.pitAmount = (base + allow + bonus - ded) * 0.05;
                          p.netSalary = calcNetPay({ baseSalary: base, bonus: allow + bonus, deductions: ded, insurance: ins, tax: p.pitAmount });
                          return p;
                        });
                      }}
                      className={cn('w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-600', cls)}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 bg-slate-900 rounded-xl flex justify-between items-center text-[#FAF9F5]">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Thực lãnh (Net Salary)</p>
                  <p className="text-sm font-medium text-slate-500">Đã trừ Thuế & BHXH</p>
                </div>
                <p className="text-4xl font-black font-mono tracking-tight">{formatCurrency(editPayrollForm.netSalary ?? 0)}</p>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex gap-3 justify-end rounded-b-xl">
              <button
                onClick={handleAiSuggest}
                className="px-5 py-2.5 text-sm font-bold text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors shadow-sm flex items-center gap-2 mr-auto"
              >
                <Sparkles className="w-4 h-4" /> Phân tích AI
              </button>
              <button onClick={() => { setEditingPayrollId(null); setAiPayrollSuggestion(null); }} className="px-5 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
                Hủy
              </button>
              <button
                onClick={handleSavePayroll}
                disabled={saving}
                className="px-6 py-2.5 text-sm font-bold text-[#FAF9F5] bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-sm flex items-center gap-2 disabled:opacity-60"
              >
                <CheckCircle2 className="w-4 h-4" /> Lưu bảng lương
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
