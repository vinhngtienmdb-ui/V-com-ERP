import React from 'react';
import {
  Users, Clock, Wallet, Target, BrainCircuit,
  UserPlus, HeartHandshake, FileText, ShieldCheck,
  MapPin, CalendarOff, TrendingUp, ClipboardList,
  Zap, Mail, User, Send, BarChart2, Settings, Building2,
  Calendar,
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const HR_MODULE_GROUPS = [
  {
    title: 'Hành chính & Nhân sự',
    items: [
      { id: 'personnel', label: 'Hồ sơ nhân sự', desc: 'Quản lý thông tin & lưu trữ.', icon: Users, color: 'blue' },
      { id: 'insurance', label: 'Bảo hiểm Xã hội', desc: 'Quản lý đóng BHXH, BHYT, BHTN.', icon: ShieldCheck, color: 'emerald' },
      { id: 'skills', label: 'Skill Matrix', desc: 'Sơ đồ kỹ năng & AI Scan.', icon: BrainCircuit, color: 'emerald' },
      { id: 'attendance', label: 'Chấm công GPS', desc: 'Quản lý chấm công đa nền tảng.', icon: MapPin, color: 'orange' },
      { id: 'attendance_config', label: 'Cài đặt Chấm công', desc: 'Cấu hình GPS, Wifi, Face, QR.', icon: Settings, color: 'orange' },
      { id: 'leave', label: 'Quản lý nghỉ phép', desc: 'Quy trình phép, công tác, OT.', icon: CalendarOff, color: 'indigo' },
      { id: 'kpi', label: 'KPI & Hiệu suất', desc: 'Đánh giá KPI & OKR.', icon: TrendingUp, color: 'purple' },
      { id: 'payroll', label: 'Lương & Payslip', desc: 'Bảng lương, phụ cấp.', icon: Wallet, color: 'rose' },
      { id: 'sentiment', label: 'Tâm lý nhân viên', desc: 'AI phân tích Sentiment.', icon: Target, color: 'cyan' },
      { id: 'review_mod', label: 'Tổng hợp chấm công', desc: 'Sổ báo cáo giờ làm.', icon: ClipboardList, color: 'orange' },
      { id: 'points_mod', label: 'Điểm cộng trừ', desc: 'V-Point tích lũy, vinh danh.', icon: Zap, color: 'fuchsia' },
      { id: 'suggestions_mod', label: 'Hòm thư góp ý', desc: 'Gửi góp ý, xem phản hồi.', icon: Mail, color: 'blue' },
      { id: 'config_hr', label: 'Thiết lập HR', desc: 'Cấu hình hệ số, quy tắc.', icon: Building2, color: 'slate' },
    ],
  },
  {
    title: 'Quản trị Đội nhóm & CSKH',
    items: [
      { id: 'teams', label: 'Quản lý Đội nhóm', desc: 'Cấu trúc & Phân quyền team.', icon: Users, color: 'blue' },
      { id: 'cs_staff', label: 'Nhân viên CSKH', desc: 'Quản lý nhân viên CSKH.', icon: HeartHandshake, color: 'rose' },
    ],
  },
  {
    title: 'Tuyển dụng',
    items: [
      { id: 'rec_request', label: 'Đề xuất tuyển dụng', desc: 'Yêu cầu nhân sự mới.', icon: User, color: 'blue' },
      { id: 'rec_candidates', label: 'Ứng viên', desc: 'Quản lý hồ sơ ứng viên.', icon: Users, color: 'indigo' },
      { id: 'rec_interview', label: 'Lịch phỏng vấn', desc: 'Lên lịch phỏng vấn.', icon: Calendar, color: 'orange' },
      { id: 'rec_email', label: 'Thư gửi ứng viên', desc: 'Template thư mời.', icon: Send, color: 'emerald' },
      { id: 'rec_contract', label: 'Hợp đồng', desc: 'Soạn thảo, quản lý HĐ.', icon: FileText, color: 'purple' },
      { id: 'rec_trial', label: 'Đánh giá thử việc', desc: 'Checklist, báo cáo.', icon: ShieldCheck, color: 'cyan' },
      { id: 'rec_report', label: 'Báo cáo tuyển dụng', desc: 'Thống kê pipeline.', icon: BarChart2, color: 'slate' },
      { id: 'rec_config', label: 'Thiết lập tuyển dụng', desc: 'Config workflow.', icon: Settings, color: 'slate' },
    ],
  },
  {
    title: 'Cuộc họp',
    items: [
      { id: 'meet_rooms', label: 'Phòng họp', desc: 'Quản lý phòng họp.', icon: Building2, color: 'blue' },
      { id: 'meet_sessions', label: 'Cuộc họp', desc: 'Danh sách cuộc họp.', icon: Clock, color: 'indigo' },
      { id: 'meet_minutes', label: 'Biên bản họp', desc: 'Lưu trữ biên bản.', icon: FileText, color: 'emerald' },
      { id: 'meet_report', label: 'Báo cáo cuộc họp', desc: 'Phân tích hiệu quả họp.', icon: BarChart2, color: 'purple' },
      { id: 'meet_config', label: 'Thiết lập cuộc họp', desc: 'Quy tắc họp.', icon: Settings, color: 'slate' },
    ],
  },
  {
    title: 'Đào tạo',
    items: [
      { id: 'train_plan', label: 'Kế hoạch đào tạo', desc: 'Chi phí, thời gian.', icon: Calendar, color: 'emerald' },
      { id: 'train_courses', label: 'Khóa đào tạo', desc: 'Tài liệu, bài học.', icon: BrainCircuit, color: 'orange' },
      { id: 'train_reg', label: 'Đăng ký tham gia', desc: 'Quản lý đăng ký.', icon: Users, color: 'blue' },
      { id: 'train_report', label: 'Báo cáo đào tạo', desc: 'Kết quả, khảo sát.', icon: BarChart2, color: 'cyan' },
      { id: 'train_config', label: 'Thiết lập đào tạo', desc: 'Config quy tắc.', icon: Settings, color: 'slate' },
    ],
  },
];

export function getColorClasses(color: string) {
  switch (color) {
    case 'blue': return 'bg-slate-100 text-orange-700';
    case 'orange': return 'bg-orange-50 text-orange-600';
    case 'indigo': return 'bg-primary-50 text-primary-600';
    case 'purple': return 'bg-purple-50 text-purple-600';
    case 'emerald': return 'bg-emerald-50 text-emerald-600';
    case 'fuchsia': return 'bg-fuchsia-50 text-fuchsia-600';
    case 'rose': return 'bg-rose-50 text-rose-600';
    case 'cyan': return 'bg-cyan-50 text-cyan-600';
    case 'slate':
    default: return 'bg-slate-50 text-slate-700';
  }
}

interface HRLayoutProps {
  onNavigate: (tab: string) => void;
}

export function HRModuleGrid({ onNavigate }: HRLayoutProps) {
  const ATSViewMap: Record<string, string> = {
    rec_request: 'request',
    rec_candidates: 'candidates',
    rec_interview: 'interview',
    rec_email: 'email',
  };

  return (
    <div className="space-y-12 bg-transparent rounded-b-xl border-t-0 border-[#F3F4F6] mt-4">
      {HR_MODULE_GROUPS.map((group, gIdx) => (
        <div key={gIdx} className="bg-white rounded-lg border border-slate-300 shadow-sm p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
            <h2 className="text-xl font-bold text-[#111827]">{group.title}</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {group.items.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(ATSViewMap[item.id] ? `ats_${ATSViewMap[item.id]}` : item.id)}
                className="bg-slate-50 border border-slate-300 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm hover:bg-white transition-all text-left flex gap-4 items-start group"
              >
                <div className={cn('p-3 rounded-lg shrink-0 transition-transform group-hover:scale-105', getColorClasses(item.color))}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-[#111827] mb-1">{item.label}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
