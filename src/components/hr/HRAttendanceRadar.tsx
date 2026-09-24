import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  QrCode, 
  Fingerprint, 
  ScanFace, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Wifi, 
  RefreshCw, 
  Sliders, 
  Building2,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AttendanceRecordItem {
  id: string;
  employeeName: string;
  employeeCode: string;
  avatarUrl?: string;
  department: string;
  checkInTime: string;
  method: 'GPS' | 'DYNAMIC_QR' | 'FACE_ID' | 'ZKTECO';
  location: string;
  status: 'ON_TIME' | 'LATE' | 'EARLY_LEAVE' | 'OVERTIME';
}

const MOCK_ATTENDANCE_LOGS: AttendanceRecordItem[] = [
  { id: '1', employeeName: 'Lê Hoàng Minh', employeeCode: 'EMP-001', department: 'Vận hành Sàn', checkInTime: '07:55 AM', method: 'FACE_ID', location: 'Trụ sở chính Cầu Giấy', status: 'ON_TIME' },
  { id: '2', employeeName: 'Nguyễn Diệu Nhi', employeeCode: 'EMP-002', department: 'Marketing', checkInTime: '08:04 AM', method: 'GPS', location: 'Văn phòng Quận 1', status: 'ON_TIME' },
  { id: '3', employeeName: 'Trần Văn Tuấn', employeeCode: 'EMP-003', department: 'Kỹ thuật', checkInTime: '08:18 AM', method: 'DYNAMIC_QR', location: 'Trụ sở chính Cầu Giấy', status: 'LATE' },
  { id: '4', employeeName: 'Hoàng Thị Thảo', employeeCode: 'EMP-004', department: 'Kế toán', checkInTime: '07:50 AM', method: 'ZKTECO', location: 'Tổng kho Long Biên', status: 'ON_TIME' },
  { id: '5', employeeName: 'Phạm Quốc Bảo', employeeCode: 'EMP-005', department: 'Vận hành Sàn', checkInTime: '08:00 AM', method: 'GPS', location: 'Tổng kho Long Biên', status: 'ON_TIME' },
];

export function HRAttendanceRadar() {
  const [selectedBranch, setSelectedBranch] = useState('BRANCH-HQ-HN');
  const [qrCounter, setQrCounter] = useState(30);
  const [showQrModal, setShowQrModal] = useState(false);
  const [records, setRecords] = useState<AttendanceRecordItem[]>(MOCK_ATTENDANCE_LOGS);

  // Dynamic QR countdown simulation (TOTP 30s)
  useEffect(() => {
    const timer = setInterval(() => {
      setQrCounter(prev => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-xl shadow-slate-200/40 p-6 space-y-6">
      {/* Header & Branch Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-600"></span>
              </span>
              Radar Chấm công Đa phương thức
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
              Sinh trắc học & GPS
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Giám sát thời gian thực mọi lượt check-in qua GPS, Dynamic QR và Máy vân tay ZKTeco
          </p>
        </div>

        {/* Branch Selector Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100/80 border border-slate-200/60 text-xs">
          {[
            { id: 'BRANCH-HQ-HN', name: 'HQ Cầu Giấy' },
            { id: 'BRANCH-KHO-LB', name: 'Kho Long Biên' },
            { id: 'BRANCH-VP-HCM', name: 'VP Quận 1' },
          ].map(branch => (
            <button
              key={branch.id}
              onClick={() => setSelectedBranch(branch.id)}
              className={cn(
                "px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer",
                selectedBranch === branch.id
                  ? "bg-white text-slate-900 shadow-sm shadow-slate-200"
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              {branch.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Radar Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Live Radar Scanner Visual + Action Kiosk */}
        <div className="lg:col-span-5 flex flex-col justify-between p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-indigo-950 text-white relative overflow-hidden shadow-2xl">
          {/* Radar Circles Effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-indigo-500/20 rounded-full animate-ping pointer-events-none" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-emerald-500/20 rounded-full pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-indigo-400/30 rounded-full pointer-events-none" />

          {/* Top Status */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">Vùng địa lý an toàn</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-white/10">
              Bán kính: 250m
            </span>
          </div>

          {/* Center: Dynamic QR Showcase Widget */}
          <div className="relative z-10 my-8 flex flex-col items-center justify-center text-center">
            <div className="relative p-4 rounded-2xl bg-white shadow-2xl group cursor-pointer hover:scale-105 transition-all" onClick={() => setShowQrModal(true)}>
              <QrCode className="w-28 h-28 text-slate-900" />
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-white text-xs font-bold px-2 py-1 rounded bg-indigo-600">Phóng to Kiosk</span>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="text-xs text-slate-300 font-medium">Mã Dynamic QR đổi sau:</span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-md">
                {qrCounter}s
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
              Chống chụp ảnh gian lận bằng mã hóa thời gian thực TOTP
            </p>
          </div>

          {/* Bottom Active Gateways */}
          <div className="relative z-10 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-[11px]">
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <MapPin className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <span className="font-bold block text-slate-200">GPS App</span>
              <span className="text-[9px] text-emerald-400 font-semibold">Đang bật</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <QrCode className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
              <span className="font-bold block text-slate-200">Dynamic QR</span>
              <span className="text-[9px] text-indigo-400 font-semibold">Đang phát</span>
            </div>
            <div className="p-2 rounded-xl bg-white/5 border border-white/5">
              <Fingerprint className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <span className="font-bold block text-slate-200">ZKTeco K40</span>
              <span className="text-[9px] text-purple-400 font-semibold">Online :4370</span>
            </div>
          </div>
        </div>

        {/* Right Column: Live Stream Check-in Feed */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Nhật ký Điểm danh Thời gian thực
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Hôm nay: <strong className="text-slate-900 font-bold">{records.length} lượt</strong>
            </span>
          </div>

          {/* Feed List */}
          <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1">
            {records.map((rec) => (
              <div 
                key={rec.id}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/90 border border-slate-200/70 hover:border-indigo-300 shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                    {rec.employeeName.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{rec.employeeName}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-bold">
                        {rec.employeeCode}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{rec.department}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-600">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {rec.location}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">{rec.checkInTime}</span>
                    <span className="text-[10px] font-semibold text-slate-400 flex items-center justify-end gap-1">
                      {rec.method === 'GPS' && <MapPin className="w-2.5 h-2.5 text-emerald-500" />}
                      {rec.method === 'DYNAMIC_QR' && <QrCode className="w-2.5 h-2.5 text-indigo-500" />}
                      {rec.method === 'FACE_ID' && <ScanFace className="w-2.5 h-2.5 text-purple-500" />}
                      {rec.method === 'ZKTECO' && <Fingerprint className="w-2.5 h-2.5 text-orange-500" />}
                      {rec.method}
                    </span>
                  </div>

                  <span className={cn(
                    "px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0",
                    rec.status === 'ON_TIME' 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-amber-50 text-amber-700 border border-amber-200/60"
                  )}>
                    {rec.status === 'ON_TIME' ? 'Đúng giờ' : 'Đi muộn'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Dữ liệu được xác thực vị trí và mã hóa AES-256
            </span>
            <button className="font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer">
              Toàn bộ bảng công <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
