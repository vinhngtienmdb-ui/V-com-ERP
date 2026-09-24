import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Coins, 
  Receipt, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  SlidersHorizontal,
  Calendar,
  Layers,
  Info
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

export function HRPayrollSimulator() {
  const [baseSalary, setBaseSalary] = useState<number>(25000000);
  const [allowance, setAllowance] = useState<number>(3000000);
  const [kpiBonus, setKpiBonus] = useState<number>(5000000);
  const [dependents, setDependents] = useState<number>(1);
  const [workDays, setWorkDays] = useState<number>(26);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [cycleType, setCycleType] = useState<'standard' | 'shifted'>('standard');

  // Interactive calculations
  const payrollCalc = useMemo(() => {
    const standardDays = 26;
    const actualDays = Math.min(standardDays, Math.max(0, workDays));
    const dailyRate = baseSalary / standardDays;
    const proratedBase = Math.round(dailyRate * actualDays);

    // 1. Gross Income
    const grossIncome = proratedBase + allowance + kpiBonus;

    // 2. Insurance Deductions (Cap 46.8M for BHXH/BHYT, 99.2M for BHTN)
    const baseCap = 46800000;
    const bhtnCap = 99200000;
    const capBhxh = Math.min(baseSalary, baseCap);
    const capBhtn = Math.min(baseSalary, bhtnCap);

    const bhxh = Math.round(capBhxh * 0.08);
    const bhyt = Math.round(capBhxh * 0.015);
    const bhtn = Math.round(capBhtn * 0.01);
    const totalInsurance = bhxh + bhyt + bhtn;

    // 3. Tax Reliefs
    const personalRelief = 11000000;
    const dependentRelief = dependents * 4400000;
    const totalRelief = personalRelief + dependentRelief + totalInsurance;

    // 4. Taxable Income & Progressive 7-bracket PIT
    const taxableIncome = Math.max(0, grossIncome - totalRelief);
    let pitAmount = 0;
    let bracket = 0;

    if (taxableIncome > 0) {
      if (taxableIncome <= 5000000) {
        pitAmount = taxableIncome * 0.05;
        bracket = 1;
      } else if (taxableIncome <= 10000000) {
        pitAmount = taxableIncome * 0.10 - 250000;
        bracket = 2;
      } else if (taxableIncome <= 18000000) {
        pitAmount = taxableIncome * 0.15 - 750000;
        bracket = 3;
      } else if (taxableIncome <= 32000000) {
        pitAmount = taxableIncome * 0.20 - 1650000;
        bracket = 4;
      } else if (taxableIncome <= 52000000) {
        pitAmount = taxableIncome * 0.25 - 3250000;
        bracket = 5;
      } else if (taxableIncome <= 80000000) {
        pitAmount = taxableIncome * 0.30 - 5850000;
        bracket = 6;
      } else {
        pitAmount = taxableIncome * 0.35 - 9850000;
        bracket = 7;
      }
    }
    pitAmount = Math.max(0, Math.round(pitAmount));

    // 5. Net Salary
    const netSalary = Math.max(0, grossIncome - totalInsurance - pitAmount);

    return {
      grossIncome,
      proratedBase,
      totalInsurance,
      bhxh,
      bhyt,
      bhtn,
      personalRelief,
      dependentRelief,
      totalRelief,
      taxableIncome,
      pitAmount,
      bracket,
      netSalary
    };
  }, [baseSalary, allowance, kpiBonus, dependents, workDays]);

  const taxBracketsInfo = [
    { b: 1, range: '≤ 5tr', rate: '5%' },
    { b: 2, range: '5-10tr', rate: '10%' },
    { b: 3, range: '10-18tr', rate: '15%' },
    { b: 4, range: '18-32tr', rate: '20%' },
    { b: 5, range: '32-52tr', rate: '25%' },
    { b: 6, range: '52-80tr', rate: '30%' },
    { b: 7, range: '> 80tr', rate: '35%' },
  ];

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-xl shadow-slate-200/40 p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              Interactive Payroll & Tax Simulator
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
              Biểu thuế 7 Bậc & BHXH Việt Nam
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Mô phỏng tức thì thu nhập thực tế, các khoản giảm trừ và thuế TNCN theo chính sách từng năm
          </p>
        </div>

        {/* Year and Cycle Selectors */}
        <div className="flex items-center gap-2">
          {/* Cycle switch */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 text-xs">
            <button
              onClick={() => setCycleType('standard')}
              className={cn(
                "px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer",
                cycleType === 'standard' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
              )}
            >
              Chu kỳ 01 - Cuối tháng
            </button>
            <button
              onClick={() => setCycleType('shifted')}
              className={cn(
                "px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer",
                cycleType === 'shifted' ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
              )}
            >
              Chu kỳ 26 - 25
            </button>
          </div>

          {/* Year selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
          >
            <option value={2026}>Chính sách Năm 2026</option>
            <option value={2025}>Chính sách Năm 2025</option>
            <option value={2024}>Chính sách Năm 2024</option>
          </select>
        </div>
      </div>

      {/* Simulator 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Controls */}
        <div className="lg:col-span-6 p-5 rounded-3xl bg-slate-50/80 border border-slate-200/60 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              Tham số Lương & Giảm trừ
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Kéo trượt để điều chỉnh</span>
          </div>

          {/* Slider 1: Base Salary */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700">Lương cơ bản thỏa thuận</label>
              <span className="font-mono font-black text-indigo-600 text-sm">
                {formatCurrency(baseSalary)}
              </span>
            </div>
            <input
              type="range"
              min={5000000}
              max={80000000}
              step={500000}
              value={baseSalary}
              onChange={(e) => setBaseSalary(Number(e.target.value))}
              className="w-full accent-indigo-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>5.000.000đ</span>
              <span>80.000.000đ</span>
            </div>
          </div>

          {/* Slider 2: Work Days */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700">Ngày công thực tế trong tháng</label>
              <span className="font-mono font-black text-slate-900 text-sm">
                {workDays} / 26 ngày
              </span>
            </div>
            <input
              type="range"
              min={15}
              max={26}
              step={0.5}
              value={workDays}
              onChange={(e) => setWorkDays(Number(e.target.value))}
              className="w-full accent-emerald-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
            />
          </div>

          {/* Grid: Allowance & Bonus */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Phụ cấp (Ăn trưa, xăng xe)</label>
              <input
                type="number"
                value={allowance}
                step={500000}
                onChange={(e) => setAllowance(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600">Thưởng KPI / Doanh số</label>
              <input
                type="number"
                value={kpiBonus}
                step={500000}
                onChange={(e) => setKpiBonus(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
              />
            </div>
          </div>

          {/* Dependents Counter */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/80">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Số người phụ thuộc</span>
              <span className="text-[11px] text-slate-500">Giảm trừ 4.400.000đ / người / tháng</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDependents(Math.max(0, dependents - 1))}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <span className="font-mono font-black text-slate-900 text-base w-4 text-center">{dependents}</span>
              <button
                onClick={() => setDependents(Math.min(5, dependents + 1))}
                className="w-8 h-8 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Right: Realtime Payslip Card & Tax Bracket Gauge */}
        <div className="lg:col-span-6 flex flex-col justify-between p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white relative overflow-hidden shadow-2xl space-y-5">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Result: Net Salary */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block mb-1">
              Lương Thực Lĩnh Dự Kiến (Net)
            </span>
            <div className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{formatCurrency(payrollCalc.netSalary)}</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md">
                Thực nhận vào TK
              </span>
            </div>
          </div>

          {/* Financial Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/10 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Tổng thu nhập Gross:</span>
              <span className="font-mono font-bold text-white text-sm">
                {formatCurrency(payrollCalc.grossIncome)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Khấu trừ Bảo hiểm (10.5%):</span>
              <span className="font-mono font-bold text-amber-300 text-sm">
                -{formatCurrency(payrollCalc.totalInsurance)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Tổng mức giảm trừ gia cảnh:</span>
              <span className="font-mono font-bold text-slate-200 text-sm">
                {formatCurrency(payrollCalc.totalRelief)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Thuế TNCN khấu trừ (Bậc {payrollCalc.bracket}):</span>
              <span className="font-mono font-bold text-rose-300 text-sm">
                -{formatCurrency(payrollCalc.pitAmount)}
              </span>
            </div>
          </div>

          {/* Progressive 7-Bracket Visual Gauge */}
          <div>
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <span className="font-bold text-indigo-200">Thang bậc Thuế lũy tiến 7 bậc</span>
              <span className="text-slate-400 font-mono">Chạm Bậc {payrollCalc.bracket || 0} / 7</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {taxBracketsInfo.map((b) => (
                <div
                  key={b.b}
                  className={cn(
                    "p-1.5 rounded-lg text-center transition-all",
                    payrollCalc.bracket === b.b
                      ? "bg-gradient-to-t from-rose-500 to-amber-500 text-white font-black shadow-md scale-105"
                      : payrollCalc.bracket > b.b
                      ? "bg-indigo-600/40 text-indigo-200"
                      : "bg-white/10 text-slate-500"
                  )}
                >
                  <span className="text-[10px] block font-mono">B{b.b}</span>
                  <span className="text-[9px] block opacity-80">{b.rate}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Legal Footnote */}
          <div className="text-[10px] text-slate-400 flex items-center gap-1.5 pt-1">
            <Info className="w-3.5 h-3.5 text-indigo-300 shrink-0" />
            <span>Áp dụng giảm trừ bản thân 11tr, người phụ thuộc 4.4tr/tháng theo Luật Thuế hiện hành.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
