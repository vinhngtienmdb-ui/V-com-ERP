import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  Paperclip, 
  Filter, 
  Search, 
  AlertCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LeaveItem {
  id: string;
  employeeName: string;
  employeeCode: string;
  department: string;
  leaveType: 'ANNUAL' | 'SICK' | 'MATERNITY' | 'OVERTIME' | 'LATE_EXPLANATION';
  fromDate: string;
  toDate: string;
  durationDays: number;
  reason: string;
  attachmentName?: string;
  status: 'PENDING_MANAGER' | 'PENDING_HR' | 'APPROVED' | 'REJECTED';
}

const INITIAL_REQUESTS: LeaveItem[] = [
  {
    id: 'LV-001',
    employeeName: 'Nguyễn Diệu Nhi',
    employeeCode: 'EMP-002',
    department: 'Marketing',
    leaveType: 'ANNUAL',
    fromDate: '22/09/2026',
    toDate: '23/09/2026',
    durationDays: 2,
    reason: 'Xin nghỉ phép giải quyết việc gia đình cá nhân',
    status: 'PENDING_MANAGER'
  },
  {
    id: 'LV-002',
    employeeName: 'Trần Văn Tuấn',
    employeeCode: 'EMP-003',
    department: 'Kỹ thuật',
    leaveType: 'LATE_EXPLANATION',
    fromDate: '17/09/2026',
    toDate: '17/09/2026',
    durationDays: 0.5,
    reason: 'Kẹt xe tuyến đường Cầu Giấy do ngập úng sau mưa lớn',
    attachmentName: 'anh_ket_xe.jpg',
    status: 'PENDING_HR'
  },
  {
    id: 'LV-003',
    employeeName: 'Lê Hoàng Minh',
    employeeCode: 'EMP-001',
    department: 'Vận hành Sàn',
    leaveType: 'OVERTIME',
    fromDate: '16/09/2026',
    toDate: '16/09/2026',
    durationDays: 0,
    reason: 'Làm thêm 3 giờ ca đêm phục vụ chiến dịch Flash Sale',
    status: 'APPROVED'
  },
  {
    id: 'LV-004',
    employeeName: 'Hoàng Thị Thảo',
    employeeCode: 'EMP-004',
    department: 'Kế toán',
    leaveType: 'SICK',
    fromDate: '15/09/2026',
    toDate: '15/09/2026',
    durationDays: 1,
    reason: 'Nghỉ ốm có giấy chứng nhận của Bệnh viện Giao Thông Vận Tải',
    attachmentName: 'giay_ra_vien.pdf',
    status: 'APPROVED'
  }
];

export function HRApprovalBoard() {
  const [requests, setRequests] = useState<LeaveItem[]>(INITIAL_REQUESTS);
  const [filterType, setFilterType] = useState('ALL');

  const getLeaveTypeBadge = (type: LeaveItem['leaveType']) => {
    switch (type) {
      case 'ANNUAL': return { label: 'Nghỉ phép năm', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'SICK': return { label: 'Nghỉ ốm (BHXH)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'OVERTIME': return { label: 'Tăng ca OT', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'LATE_EXPLANATION': return { label: 'Giải trình đi muộn', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      default: return { label: 'Khác', color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(r => {
      if (r.id === id) {
        const nextStatus = r.status === 'PENDING_MANAGER' ? 'PENDING_HR' : 'APPROVED';
        return { ...r, status: nextStatus };
      }
      return r;
    }));
  };

  const handleReject = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
  };

  const columns = [
    { id: 'PENDING_MANAGER', title: '1. Chờ Quản lý duyệt', color: 'border-amber-400 bg-amber-50/50' },
    { id: 'PENDING_HR', title: '2. Chờ HR đối soát', color: 'border-indigo-400 bg-indigo-50/50' },
    { id: 'APPROVED', title: '3. Đã phê duyệt', color: 'border-emerald-400 bg-emerald-50/50' },
    { id: 'REJECTED', title: '4. Từ chối', color: 'border-rose-400 bg-rose-50/50' },
  ];

  return (
    <div className="rounded-3xl bg-white/70 backdrop-blur-2xl border border-white/60 shadow-xl shadow-slate-200/40 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-indigo-600" />
              Smart Approval Board (Quy trình Duyệt 2 cấp)
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/50">
              Quản lý ➔ HR ➔ Chốt công
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Duyệt 1-chạm các đơn nghỉ phép, công tác, đăng ký tăng ca OT và giải trình đi muộn
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer shadow-xs"
          >
            <option value="ALL">Tất cả loại đơn</option>
            <option value="ANNUAL">Phép năm</option>
            <option value="SICK">Nghỉ ốm</option>
            <option value="OVERTIME">Làm thêm OT</option>
            <option value="LATE_EXPLANATION">Giải trình</option>
          </select>
        </div>
      </div>

      {/* 4-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {columns.map(col => {
          const items = requests.filter(r => r.status === col.id && (filterType === 'ALL' || r.leaveType === filterType));

          return (
            <div 
              key={col.id}
              className="p-4 rounded-3xl bg-slate-50/70 border border-slate-200/70 flex flex-col space-y-3 min-h-[350px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-black text-slate-800">{col.title}</span>
                <span className="text-[11px] font-mono font-black text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {items.length}
                </span>
              </div>

              {/* Card List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[420px] pr-1">
                {items.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 font-medium">
                    Không có đơn nào
                  </div>
                ) : (
                  items.map(item => {
                    const badge = getLeaveTypeBadge(item.leaveType);

                    return (
                      <div 
                        key={item.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all space-y-3"
                      >
                        {/* Card Top */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-sm font-bold text-slate-900 block">{item.employeeName}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.employeeCode} • {item.department}</span>
                          </div>
                          <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold border", badge.color)}>
                            {badge.label}
                          </span>
                        </div>

                        {/* Card Date & Reason */}
                        <div className="text-xs text-slate-600 space-y-1">
                          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{item.fromDate} {item.fromDate !== item.toDate && `- ${item.toDate}`}</span>
                            {item.durationDays > 0 && <span className="text-indigo-600 font-bold">({item.durationDays} ngày)</span>}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-relaxed line-clamp-2 bg-slate-50 p-2 rounded-xl">
                            "{item.reason}"
                          </p>
                        </div>

                        {item.attachmentName && (
                          <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-semibold">
                            <Paperclip className="w-3 h-3" />
                            <span>{item.attachmentName}</span>
                          </div>
                        )}

                        {/* Card Actions for Pending states */}
                        {(item.status === 'PENDING_MANAGER' || item.status === 'PENDING_HR') && (
                          <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                            <button
                              onClick={() => handleReject(item.id)}
                              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Từ chối
                            </button>
                            <button
                              onClick={() => handleApprove(item.id)}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-[11px] font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              {item.status === 'PENDING_MANAGER' ? 'Duyệt cấp 1' : 'Phê duyệt chốt'}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
