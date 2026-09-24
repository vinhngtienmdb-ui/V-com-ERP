import React from 'react';
import { Users, UserCheck, CalendarOff, Sparkles, Activity, ShieldCheck, Plus, ArrowUpRight, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface HRPulseBarProps {
  totalEmployees: number;
  activeToday: number;
  onLeave: number;
  lateToday: number;
  onAddEmployee: () => void;
  onOpenAttendance: () => void;
}

export function HRPulseBar({
  totalEmployees,
  activeToday,
  onLeave,
  lateToday,
  onAddEmployee,
  onOpenAttendance
}: HRPulseBarProps) {
  const attendanceRate = totalEmployees > 0 ? Math.round((activeToday / totalEmployees) * 100) : 0;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-xl shadow-slate-200/50 p-5 transition-all">
      {/* Soft Ambient Background Glows */}
      <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 left-24 w-56 h-56 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5">
        {/* Left: Workforce Pulse Indicator */}
        <div className="flex items-center gap-4">
          <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 shrink-0">
            <Activity className="w-7 h-7 animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-slate-900">Workforce Pulse</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Thời gian thực
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Cập nhật ca làm việc: {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} • Toàn hệ thống VComm
            </p>
          </div>
        </div>

        {/* Center: Key Metric Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Quân số */}
          <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-100/80 shadow-xs hover:border-indigo-200 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Tổng nhân sự</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">{totalEmployees}</div>
            <span className="text-[10px] font-bold text-slate-400">100% hợp đồng số</span>
          </div>

          {/* Card 2: Đi làm hôm nay */}
          <div 
            onClick={onOpenAttendance}
            className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-200/60 shadow-xs hover:border-emerald-400 cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold mb-1">
              <span>Đang có mặt</span>
              <UserCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-800 tracking-tight">{activeToday}</span>
              <span className="text-xs font-bold text-emerald-600">({attendanceRate}%)</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
              Xem radar <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          {/* Card 3: Nghỉ phép */}
          <div className="p-3.5 rounded-2xl bg-white/80 border border-slate-100/80 shadow-xs hover:border-amber-200 transition-all">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
              <span>Nghỉ phép/CT</span>
              <CalendarOff className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-700 tracking-tight">{onLeave}</div>
            <span className="text-[10px] font-bold text-amber-600">Đã duyệt phép</span>
          </div>

          {/* Card 4: AI Nhiệt độ gắn kết */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-100 shadow-xs">
            <div className="flex items-center justify-between text-indigo-700 text-xs font-semibold mb-1">
              <span>Gắn kết (eNPS)</span>
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-900 tracking-tight">88 / 100</div>
            <span className="text-[10px] font-bold text-indigo-600">Mức độ Hạnh phúc cao</span>
          </div>
        </div>

        {/* Right: Quick Action Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onAddEmployee}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-bold shadow-lg shadow-slate-900/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm nhân sự mới</span>
          </button>
        </div>
      </div>
    </div>
  );
}
