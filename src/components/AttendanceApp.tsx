import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Fingerprint, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle2, 
  Sliders, 
  CalendarDays, 
  Download, 
  Building2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { HRAttendanceRadar } from './hr/HRAttendanceRadar';
import { cn } from '../lib/utils';

export function AttendanceApp() {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState<'radar' | 'roster' | 'shifts'>('radar');

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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md">
                <Fingerprint className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                VComm Chấm Công & Ca Kíp
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" /> GPS & AI FaceID
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Hệ thống tổng hợp ngày công tự động, kiểm soát đi muộn về sớm & phân ca xoay đa chi nhánh
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/ess')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-slate-600" />
            <span>Chấm công cá nhân (ESS)</span>
          </button>

          <button
            onClick={() => navigate('/payroll')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-black shadow-lg shadow-amber-500/25 transition-all cursor-pointer"
          >
            <span>Chuyển bảng công sang Tiền Lương</span>
          </button>
        </div>
      </div>

      {/* Mini App Sub-Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm w-fit text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('radar')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer",
            activeSubTab === 'radar'
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
          )}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Radar Điểm Danh Thời Gian Thực</span>
        </button>

        <button
          onClick={() => setActiveSubTab('roster')}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-2xl transition-all cursor-pointer",
            activeSubTab === 'roster'
              ? "bg-slate-900 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
          )}
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Bảng Phân Ca & Lịch Làm Việc</span>
        </button>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'radar' && (
        <div className="space-y-6">
          <HRAttendanceRadar />
        </div>
      )}

      {activeSubTab === 'roster' && (
        <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/40 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900">Lịch Phân Ca Làm Việc Tuần Này</h3>
              <p className="text-xs text-slate-500">Phân ca tự động cho các khối Văn phòng, Kho Vận & Chuỗi Điểm Bán POS</p>
            </div>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition">
              <Calendar className="w-3.5 h-3.5" />
              <span>Xếp Ca Mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-amber-900 text-sm">Ca Sáng (Hành chính)</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200/60 font-bold text-amber-900">08:00 - 17:30</span>
              </div>
              <p className="text-xs text-amber-700">Khối Văn phòng, Kế toán, Kỹ thuật, Marketing (68 nhân sự)</p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-blue-900 text-sm">Ca 1 POS & Kho</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-200/60 font-bold text-blue-900">07:00 - 15:00</span>
              </div>
              <p className="text-xs text-blue-700">Thu ngân iPOS, Thủ kho xuất nhập (35 nhân sự)</p>
            </div>

            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-purple-900 text-sm">Ca 2 POS & Kho</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-200/60 font-bold text-purple-900">14:30 - 22:30</span>
              </div>
              <p className="text-xs text-purple-700">Bán hàng ca tối, Đóng gói chuyển phát nhanh 3PL (28 nhân sự)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
