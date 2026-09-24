import React, { useState } from 'react';
import { 
  Fingerprint, 
  MapPin, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Receipt, 
  Sparkles, 
  Send, 
  FileText, 
  ShieldCheck, 
  QrCode, 
  ChevronRight,
  ArrowLeft,
  Download,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';

export function EmployeeSelfService() {
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'attendance' | 'leave' | 'payslip'>('attendance');

  // Leave Form State
  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [leaveDate, setLeaveDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveDuration, setLeaveDuration] = useState('1');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveSuccessMsg, setLeaveSuccessMsg] = useState(false);

  const handle1TapCheckIn = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (!isCheckedIn) {
        setIsCheckedIn(true);
        setCheckInTime(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }));
      } else {
        setIsCheckedIn(false);
      }
    }, 1200);
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason.trim()) return;
    setLeaveSuccessMsg(true);
    setTimeout(() => {
      setLeaveSuccessMsg(false);
      setLeaveReason('');
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100 p-4 sm:p-8 space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/50">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Về Trang chủ Launcher"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                Employee Self-Service (ESS)
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Đang kết nối
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Cổng Tự Phục Vụ Nhân Viên
            </h1>
          </div>
        </div>

        {/* Digital Staff Card Pill */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-base">
            M
          </div>
          <div className="text-xs pr-2">
            <span className="font-bold block">Lê Hoàng Minh</span>
            <span className="text-[10px] text-indigo-300 font-mono">EMP-001 • Vận hành Sàn</span>
          </div>
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex items-center gap-2 p-1.5 rounded-3xl bg-white/70 backdrop-blur-xl border border-white/80 shadow-sm w-fit text-xs font-bold">
        {[
          { id: 'attendance', label: '1. Chấm công 1-Chạm', icon: Fingerprint },
          { id: 'leave', label: '2. Nộp đơn Nghỉ phép & OT', icon: Calendar },
          { id: 'payslip', label: '3. Phiếu lương Cá nhân', icon: Receipt },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={cn(
                "flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all cursor-pointer",
                activeTab === t.id
                  ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: ATTENDANCE 1-TAP */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* 1-Tap Big Circle Card */}
          <div className="md:col-span-6 p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/50 flex flex-col items-center justify-center text-center space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Điểm danh định vị GPS</span>
              <h3 className="text-lg font-black text-slate-900">
                {isCheckedIn ? 'Bạn đã Check-in ca hôm nay' : 'Sẵn sàng ghi nhận ca làm việc'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs">
                Hệ thống tự động xác minh tọa độ GPS trong bán kính 250m của Trụ sở chính Cầu Giấy
              </p>
            </div>

            {/* Big Interactive Button */}
            <div className="relative my-4">
              <div className={cn(
                "absolute -inset-4 rounded-full transition-all pointer-events-none",
                isCheckedIn ? "bg-emerald-400/20 animate-pulse" : "bg-indigo-400/20 animate-ping"
              )} style={{ animationDuration: '3s' }} />

              <button
                onClick={handle1TapCheckIn}
                disabled={isProcessing}
                className={cn(
                  "relative w-44 h-44 rounded-full flex flex-col items-center justify-center text-white shadow-2xl transition-all cursor-pointer active:scale-95",
                  isCheckedIn
                    ? "bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/40"
                    : "bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-indigo-500/40 hover:scale-105"
                )}
              >
                <Fingerprint className="w-16 h-16 mb-2" />
                <span className="text-sm font-black uppercase tracking-wider">
                  {isProcessing ? 'Đang xác thực...' : isCheckedIn ? 'Bấm Check-out' : 'Bấm Check-in'}
                </span>
                {checkInTime && (
                  <span className="text-[11px] font-mono mt-1 text-emerald-100">
                    Vào ca: {checkInTime}
                  </span>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>Tọa độ xác thực: 21.033333, 105.783333 (Khoảng cách: 25m)</span>
            </div>
          </div>

          {/* Today Shift Summary Card */}
          <div className="md:col-span-6 space-y-4">
            <div className="p-6 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/50 space-y-4">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" /> Lịch sử điểm danh tuần này
              </h4>
              <div className="space-y-2.5 text-xs">
                {[
                  { day: 'Thứ Năm (Hôm nay)', in: checkInTime || '07:55', out: isCheckedIn ? '--:--' : '17:30', status: 'Đúng giờ' },
                  { day: 'Thứ Tư (16/09)', in: '07:58', out: '18:30 (OT 1h)', status: 'Tăng ca OT' },
                  { day: 'Thứ Ba (15/09)', in: '07:50', out: '17:30', status: 'Đúng giờ' },
                  { day: 'Thứ Hai (14/09)', in: '08:02', out: '17:35', status: 'Đúng giờ' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div>
                      <span className="font-bold text-slate-800 block">{item.day}</span>
                      <span className="text-slate-500 text-[11px] font-mono">Vào: {item.in} • Ra: {item.out}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave balance quick glance */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-indigo-300 font-bold block">Quỹ ngày phép năm 2026</span>
                <div className="text-3xl font-black mt-1">9.0 <span className="text-sm font-normal text-indigo-200">/ 12 ngày còn lại</span></div>
              </div>
              <button
                onClick={() => setActiveTab('leave')}
                className="px-4 py-2 rounded-2xl bg-white text-slate-900 text-xs font-bold hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                Nộp đơn ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SUBMIT LEAVE & OT */}
      {activeTab === 'leave' && (
        <div className="p-8 rounded-3xl bg-white/80 backdrop-blur-2xl border border-white/80 shadow-xl shadow-slate-200/50 space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              Tạo Đơn Xin Nghỉ Phép / Đăng Ký Tăng Ca OT
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Đơn sẽ được tự động chuyển tiếp đến Trưởng bộ phận để duyệt cấp 1 trước khi chuyển HR
            </p>
          </div>

          {leaveSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Đã gửi đơn thành công! Bạn sẽ nhận thông báo khi đơn được phê duyệt.</span>
            </div>
          )}

          <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Loại đơn</label>
                <select
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="ANNUAL">Nghỉ phép năm (Có lương)</option>
                  <option value="SICK">Nghỉ ốm đau (Hưởng BHXH)</option>
                  <option value="OVERTIME">Đăng ký làm thêm ngoài giờ (OT)</option>
                  <option value="LATE_EXPLANATION">Giải trình đi muộn / về sớm</option>
                  <option value="UNPAID">Nghỉ không hưởng lương</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Ngày bắt đầu</label>
                <input
                  type="date"
                  value={leaveDate}
                  onChange={(e) => setLeaveDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-700">Số ngày / Giờ xin nghỉ</label>
                <select
                  value={leaveDuration}
                  onChange={(e) => setLeaveDuration(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="0.5">Nửa ngày (0.5 ngày)</option>
                  <option value="1">1 ngày trọn vẹn</option>
                  <option value="2">2 ngày</option>
                  <option value="3">3 ngày</option>
                  <option value="5">5 ngày (1 tuần làm việc)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-700">Lý do cụ thể</label>
              <textarea
                rows={3}
                value={leaveReason}
                onChange={(e) => setLeaveReason(e.target.value)}
                placeholder="Nhập lý do chi tiết để quản lý xem xét phê duyệt..."
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-indigo-600 text-white font-bold transition-all shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Gửi đơn phê duyệt</span>
            </button>
          </form>
        </div>
      )}

      {/* SECTION 3: MY PAYSLIPS */}
      {activeTab === 'payslip' && (
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white shadow-2xl relative overflow-hidden space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 block">
                  Phiếu Lương Điện Tử Gần Nhất
                </span>
                <h3 className="text-2xl font-black tracking-tight mt-1">Kỳ Lương Tháng 08/2026</h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" /> Đã Ký số Kế toán
              </span>
            </div>

            {/* Net Amount Spotlight */}
            <div className="p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-300 block">Thực Lĩnh Chuyển Khoản (Net)</span>
                <span className="text-3xl sm:text-4xl font-black tracking-tight text-emerald-400">
                  {formatCurrency(18685000)}
                </span>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Đã chuyển tới Techcombank •••• 9012 vào ngày 05/09/2026
                </span>
              </div>

              <button className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-slate-900 text-xs font-bold hover:bg-indigo-50 transition-colors shadow-md cursor-pointer">
                <Download className="w-4 h-4" /> Tải Phiếu Lương PDF
              </button>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-white/10">
              <div>
                <span className="text-slate-400 block mb-1">Lương thỏa thuận:</span>
                <strong className="font-mono text-sm">{formatCurrency(18000000)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Phụ cấp & Thưởng:</span>
                <strong className="font-mono text-sm text-indigo-300">+{formatCurrency(3500000)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Bảo hiểm trích nộp:</span>
                <strong className="font-mono text-sm text-amber-300">-{formatCurrency(1890000)}</strong>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Thuế TNCN (Bậc 2):</span>
                <strong className="font-mono text-sm text-rose-300">-{formatCurrency(925000)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
