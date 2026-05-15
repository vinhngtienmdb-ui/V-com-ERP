import React, { useState, useEffect } from 'react';
import { orderBy, where } from 'firebase/firestore';
import {
  ArrowLeft, MapPin, ScanFace, Wifi, QrCode,
  RefreshCcw, Target, TrendingUp, Sparkles, Zap,
  Plus, Lock, PlusCircle, Timer, Settings, AlertCircle,
  ShieldCheck, Globe, Video, History,
} from 'lucide-react';
import { attendanceRepo, type AttendanceInput } from '../../services/repositories';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/utils';
import type { AttendanceRecord } from '../../types/erp';
import type { AttendanceSetting } from './types';
import { MOCK_ATTENDANCE, INITIAL_ATTENDANCE_SETTINGS } from './mockData';

function adaptAttendance(a: AttendanceInput): AttendanceRecord {
  return {
    id: a.id,
    employeeId: a.employeeId,
    date: a.date,
    checkIn: a.timestamp ? '' : '08:00',
    checkOut: '',
    status: a.type === 'absent' ? 'absent' : a.type === 'overtime' ? 'on_time' : 'on_time',
    overtimeHours: a.type === 'overtime' ? (a.hours ?? 0) : 0,
    location: undefined,
    method: undefined,
    deviceInfo: undefined,
  };
}

interface Props {
  onBack: () => void;
  employees: { id: string; fullName: string }[];
}

export function HRAttendance({ onBack, employees }: Props) {
  const [dbAttendance, setDbAttendance] = useState<AttendanceRecord[]>([]);
  const attendance = dbAttendance.length > 0 ? dbAttendance : MOCK_ATTENDANCE;

  const [attendanceView, setAttendanceView] = useState<'week' | 'month'>('week');
  const [filterDateAtt, setFilterDateAtt] = useState('');
  const [activeMethod, setActiveMethod] = useState<'status' | 'config'>('status');
  const [showConfig, setShowConfig] = useState(false);
  const [attendanceSettings, setAttendanceSettings] = useState<AttendanceSetting[]>(INITIAL_ATTENDANCE_SETTINGS);

  useEffect(() => {
    const constraints = filterDateAtt
      ? [where('date', '>=', filterDateAtt), orderBy('date', 'desc')]
      : [orderBy('date', 'desc')];
    const unsub = attendanceRepo.subscribe(constraints, (items) =>
      setDbAttendance(items.map(adaptAttendance)),
    );
    return () => unsub();
  }, [filterDateAtt]);

  const filteredAttendance = attendance.filter(att => {
    if (filterDateAtt && !att.date.includes(filterDateAtt)) return false;
    return true;
  });

  const toggleAttendanceSetting = (method: string) =>
    setAttendanceSettings(prev => prev.map(s => s.method === method ? { ...s, enabled: !s.enabled } : s));

  const updateSettingConfig = (method: string, key: string, value: any) =>
    setAttendanceSettings(prev => prev.map(s => s.method === method ? { ...s, config: { ...s.config, [key]: value } } : s));

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

      <div className="p-4 bg-white border-b border-[#F3F4F6] flex justify-between items-center px-6">
        <div className="flex gap-2 items-center">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setAttendanceView('week')}
              className={cn('px-3 py-1.5 text-xs font-bold rounded-md transition-colors', attendanceView === 'week' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600 hover:text-slate-800')}
            >
              Theo Tuần
            </button>
            <button
              onClick={() => setAttendanceView('month')}
              className={cn('px-3 py-1.5 text-xs font-bold rounded-md transition-colors', attendanceView === 'month' ? 'bg-white text-orange-700 shadow-sm' : 'text-slate-600 hover:text-slate-800')}
            >
              Theo Tháng
            </button>
          </div>
          <input
            type={attendanceView === 'month' ? 'month' : 'week'}
            value={filterDateAtt}
            onChange={(e) => setFilterDateAtt(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-600/20"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <History className="w-4 h-4" /> {showConfig ? 'Ẩn cài đặt' : 'Cài đặt chấm công'}
          </button>
          <button className="bg-slate-900 text-[#FAF9F5] px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
            <PlusCircle className="w-4 h-4" /> Chấm công thủ công
          </button>
        </div>
      </div>

      {showConfig ? (
        <AttendanceConfigPanel
          settings={attendanceSettings}
          onToggle={toggleAttendanceSetting}
          onUpdate={updateSettingConfig}
        />
      ) : (
        <div className="grid grid-cols-12 gap-8 p-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="bg-white border border-slate-300 shadow-sm rounded-lg overflow-hidden">
              <div className="overflow-x-auto min-w-0">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b border-slate-200">
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nhân viên</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Ca làm việc</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Giờ vào/ra</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Phương thức</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">OT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredAttendance.map((att, i) => {
                      const emp = employees.find(e => e.id === att.employeeId);
                      return (
                        <tr key={i} className="hover:bg-primary-50/20 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-[10px] uppercase">
                                {emp?.fullName.split(' ').pop()?.charAt(0) || 'U'}
                              </div>
                              <div>
                                <div className="text-xs font-bold text-slate-900">{emp?.fullName ?? att.employeeId}</div>
                                <div className="text-[9px] text-slate-500 font-mono italic">{att.employeeId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className="text-[9px] font-bold text-slate-700 px-2 py-0.5 bg-slate-100 rounded uppercase tracking-tighter">Hành chính</span>
                          </td>
                          <td className="px-6 py-5 text-center">
                            <div className="text-xs font-black text-slate-900 tabular-nums">{att.checkIn} - {att.checkOut || '--:--'}</div>
                            <div className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">Total: {att.overtimeHours + 8}h</div>
                          </td>
                          <td className="px-6 py-5 text-center">
                            {att.method === 'face' ? (
                              <div className="px-2 py-0.5 bg-slate-100 text-orange-700 rounded flex items-center gap-1 text-[9px] font-bold justify-center">
                                <ScanFace className="w-3 h-3" /> FaceID
                              </div>
                            ) : att.method === 'wifi' ? (
                              <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded flex items-center gap-1 text-[9px] font-bold justify-center">
                                <Wifi className="w-3 h-3" /> Wifi
                              </div>
                            ) : (
                              <div className="px-2 py-0.5 bg-orange-50 text-orange-600 rounded flex items-center gap-1 text-[9px] font-bold justify-center">
                                <MapPin className="w-3 h-3" /> GPS
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-5 text-center">
                            <span className={cn(
                              'px-3 py-1 rounded text-[9px] font-black uppercase tracking-tighter shadow-sm',
                              att.status === 'on_time' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100',
                            )}>
                              {att.status === 'on_time' ? 'Đúng giờ' : 'Đi muộn'}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <span className="text-xs font-black text-slate-900 tabular-nums">{formatCurrency(att.overtimeHours * 50000)}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-6 flex items-center gap-2 uppercase tracking-widest">
                <Target className="w-4 h-4 text-rose-500" /> Phân tích Chuyên cần
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-4xl font-black text-slate-900 tracking-tighter">94.2%</p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase mt-1 tracking-widest">Tỷ lệ Presence Rate</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> +1.2%
                  </div>
                </div>
                {[
                  { label: 'Có mặt ngay lúc này', count: 112, color: 'emerald' },
                  { label: 'Đã Checkout (Hết ca)', count: 24, color: 'blue' },
                  { label: 'Vắng mặt / Đi muộn', count: 8, color: 'rose' },
                ].map((s, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold">
                      <span className="text-slate-600 uppercase">{s.label}</span>
                      <span className="text-slate-900 font-black">{s.count} người</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all duration-1000', s.color === 'emerald' ? 'bg-emerald-500' : s.color === 'rose' ? 'bg-rose-500' : 'bg-slate-800')}
                        style={{ width: `${(s.count / 144) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="p-5 bg-primary-50 border border-primary-100 rounded-lg space-y-3 relative overflow-hidden">
                  <Zap className="absolute -right-2 -top-2 w-12 h-12 text-primary-100 rotate-12" />
                  <h4 className="text-[10px] font-black text-primary-900 uppercase tracking-[0.2em] flex items-center gap-2 relative z-10">
                    <Sparkles className="w-3.5 h-3.5" /> AI Khuyến nghị
                  </h4>
                  <p className="text-[11px] text-primary-800 leading-relaxed font-medium italic relative z-10">Bộ phận "Kho" đang có tỷ lệ đi muộn cao đột biến vào thứ Hai. Cân nhắc điều chỉnh ca làm.</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
              <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-widest flex items-center gap-2">
                <QrCode className="w-4 h-4 text-primary-600" /> Mã QR Động (Anti-Fake)
              </h3>
              <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center group-hover:bg-white transition-all duration-500 relative cursor-pointer">
                <QrCode className="w-24 h-24 text-slate-500 group-hover:text-primary-600 transition-all duration-500" />
                <div className="absolute inset-0 bg-white/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <RefreshCcw className="w-8 h-8 text-primary-600" />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-4 leading-relaxed font-bold italic text-center">Mã tự động reset sau <span className="text-primary-600 font-black">24s</span>.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AttendanceConfigPanel({
  settings,
  onToggle,
  onUpdate,
}: {
  settings: AttendanceSetting[];
  onToggle: (method: string) => void;
  onUpdate: (method: string, key: string, value: any) => void;
}) {
  return (
    <div className="p-8 space-y-8 bg-slate-50/30">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
          <Settings className="w-6 h-6 text-orange-700" /> Cấu hình Hệ thống Chấm công
        </h2>
        <p className="text-sm text-slate-600 font-medium mt-1">Thiết lập các phương thức và quy tắc xác thực chấm công.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-12">
        {settings.map(setting => (
          <div
            key={setting.method}
            className={cn(
              'bg-white rounded-lg border transition-all duration-300 shadow-sm overflow-hidden flex flex-col group',
              setting.enabled ? 'border-orange-200 ring-1 ring-blue-50/50' : 'border-slate-300 opacity-80',
            )}
          >
            <div className="p-6 flex justify-between items-start border-b border-stone-50">
              <div className="flex gap-4">
                <div className={cn(
                  'w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110',
                  setting.enabled ? 'bg-slate-900 text-[#FAF9F5] shadow-sm' : 'bg-slate-100 text-slate-500',
                )}>
                  {setting.method === 'gps' && <MapPin className="w-6 h-6" />}
                  {setting.method === 'wifi' && <Wifi className="w-6 h-6" />}
                  {setting.method === 'face' && <ScanFace className="w-6 h-6" />}
                  {setting.method === 'qr' && <QrCode className="w-6 h-6" />}
                  {setting.method === 'device' && <Timer className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">
                    {setting.method === 'gps' ? 'Chấm công GPS' :
                      setting.method === 'wifi' ? 'Chấm công Wi-Fi' :
                      setting.method === 'face' ? 'Chấm công Face ID' :
                      setting.method === 'qr' ? 'Chấm công QR Code' : 'Máy chấm công'}
                  </p>
                  <p className="text-slate-600 text-xs font-medium uppercase tracking-wider mt-0.5">Protocol: {setting.method}</p>
                </div>
              </div>
              <button
                onClick={() => onToggle(setting.method)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none',
                  setting.enabled ? 'bg-slate-900' : 'bg-slate-200',
                )}
              >
                <span className={cn('inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm', setting.enabled ? 'translate-x-6' : 'translate-x-1')} />
              </button>
            </div>
            <div className="p-6 bg-slate-50/30 flex-1">
              {setting.enabled ? (
                <div className="space-y-4">
                  {setting.method === 'gps' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Bán kính mặc định (m)</label>
                      <input
                        type="number"
                        value={setting.config.radius}
                        onChange={(e) => onUpdate('gps', 'radius', Number(e.target.value))}
                        className="w-full mt-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-orange-600/10 outline-none"
                      />
                    </div>
                  )}
                  {setting.method === 'face' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Độ chính xác yêu cầu ({setting.config.minMatch})</label>
                      <input
                        type="range" min="0.5" max="0.99" step="0.01"
                        value={setting.config.minMatch}
                        onChange={(e) => onUpdate('face', 'minMatch', Number(e.target.value))}
                        className="w-full mt-2 accent-blue-600"
                      />
                      {[
                        { id: 'livenessCheck', label: 'Bật Liveness Check', icon: Globe },
                        { id: 'antiSpoofing', label: 'AI Anti-Spoofing Guard', icon: ShieldCheck },
                        { id: 'autoCapture', label: 'Tự động chụp khi phát hiện', icon: Video },
                      ].map(feat => (
                        <label key={feat.id} className="flex items-center justify-between p-3 bg-white border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors mt-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                            <feat.icon className="w-4 h-4 text-orange-600" /> {feat.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={!!setting.config[feat.id]}
                            onChange={(e) => onUpdate('face', feat.id, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-400 text-orange-700"
                          />
                        </label>
                      ))}
                    </div>
                  )}
                  {setting.method === 'qr' && (
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Thời gian làm mới (giây)</label>
                      <input
                        type="number"
                        value={setting.config.refreshRate}
                        onChange={(e) => onUpdate('qr', 'refreshRate', Number(e.target.value))}
                        className="w-full mt-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm font-mono focus:ring-2 outline-none"
                      />
                    </div>
                  )}
                  {(setting.method === 'wifi' || setting.method === 'device') && (
                    <p className="text-xs text-slate-500 italic">Cấu hình chi tiết cho {setting.method}.</p>
                  )}
                </div>
              ) : (
                <div className="h-full min-h-[100px] flex flex-col items-center justify-center text-center space-y-2">
                  <Lock className="w-6 h-6 text-slate-400" />
                  <p className="text-xs font-bold text-slate-500">Phương thức này đang tắt</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="bg-primary-900 text-[#FAF9F5] p-8 rounded-lg shadow-sm flex justify-between items-center gap-8">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-300" /> AI Smart-Sync Optimizer
          </h3>
          <p className="text-blue-100 text-sm leading-relaxed max-w-lg mt-2">
            Kích hoạt AI để tự động phát hiện các hành vi chấm công bất thường (Buddy Punching).
          </p>
        </div>
        <button className="px-8 py-4 bg-white text-primary-900 font-bold rounded-lg text-sm hover:translate-y-[-2px] transition-all uppercase tracking-widest shadow-sm">
          Kích hoạt AI Optimizer
        </button>
      </div>
    </div>
  );
}
