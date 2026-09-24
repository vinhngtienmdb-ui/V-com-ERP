import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Contact, 
  Users, 
  UserPlus, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  Search, 
  Building2,
  Calendar,
  AlertTriangle,
  Award,
  Download,
  TrendingUp,
  Clock,
  Heart
} from 'lucide-react';
import { VCommHRMComponent } from './VCommHRM';

export function EmployeesApp() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16 text-slate-800">
      {/* Top Enterprise Glassmorphism Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Quay lại Launcher chính (/)"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600" />
            <span>Launcher</span>
          </button>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
                <Contact className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                VComm Quản Trị Nhân Sự & Hồ Sơ 360°
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-violet-50 text-violet-700 border border-violet-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-violet-500" /> Enterprise HRM
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Quản lý toàn diện vòng đời nhân sự: Hồ sơ cán bộ 360°, Hợp đồng lao động điện tử, Diễn biến lương, Người phụ thuộc, Thai sản & Bổ nhiệm điều chuyển.
            </p>
          </div>
        </div>

        {/* Quick Navigation Links */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/directory')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Sơ Đồ Cây Tổ Chức</span>
          </button>

          <button
            onClick={() => navigate('/performance')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Đánh Giá Hiệu Suất KPI</span>
          </button>

          <button
            onClick={() => navigate('/lms')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>LMS Đào Tạo</span>
          </button>
        </div>
      </div>

      {/* Real-time HR Headcount & Compliance KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Tổng Cán Bộ Nhân Sự</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">142 người</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>128 chính thức • 14 thử việc</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">HĐ Sắp Hết Hạn (&le; 30 ngày)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">03 hợp đồng</div>
          <div className="mt-2 text-xs text-slate-500">Cần thẩm định gia hạn / ký mới</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Chế Độ Thai Sản / Nghỉ Phép</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">04 nhân sự</div>
          <div className="mt-2 text-xs text-slate-500">Hưởng trợ cấp BHXH chế độ thai sản</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Tuân Thủ Hợp Đồng Số</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">98.5%</div>
          <div className="mt-2 text-xs text-slate-500">Ký số HSM Cloud đạt chuẩn Bộ LĐTBXH</div>
        </div>
      </div>

      {/* Main HRM Core Component */}
      <div className="space-y-6">
        <VCommHRMComponent />
      </div>
    </div>
  );
}
