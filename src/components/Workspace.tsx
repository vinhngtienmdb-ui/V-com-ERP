import { useState } from 'react';
import { Clock, ClipboardList, FileSignature, Activity, DollarSign, Zap, Mail, User, Users, Calendar, Send, FileText, ShieldCheck, BarChart2, Settings, Building2, Video, BrainCircuit, MessageSquare, Car, Monitor, ArrowLeft, ArrowRight, FolderOpen, ClipboardCheck, MapPin, Wrench, ArrowRightLeft } from 'lucide-react';
import { cn } from '../lib/utils';
import { WorkspaceBooking, MeetingEvent } from '../types/erp';

function getColorClasses(color: string) {
  switch (color) {
    case 'blue': return 'bg-blue-50 text-blue-600';
    case 'orange': return 'bg-orange-50 text-orange-600';
    case 'indigo': return 'bg-indigo-50 text-indigo-600';
    case 'purple': return 'bg-purple-50 text-purple-600';
    case 'emerald': return 'bg-emerald-50 text-emerald-600';
    case 'fuchsia': return 'bg-fuchsia-50 text-fuchsia-600';
    case 'rose': return 'bg-rose-50 text-rose-600';
    case 'cyan': return 'bg-cyan-50 text-cyan-600';
    case 'slate':
    default: return 'bg-slate-50 text-slate-600';
  }
}

const MODULE_GROUPS = [
  {
    title: 'Tài liệu & Quy trình',
    items: [
      { id: 'doc_list', label: 'Danh sách tài liệu', desc: 'Lưu trữ & chia sẻ.', icon: FolderOpen, color: 'blue' },
      { id: 'doc_archive', label: 'Lưu trữ hồ sơ', desc: 'Tài liệu số hóa.', icon: FileText, color: 'emerald' },
      { id: 'doc_config', label: 'Thiết lập tài liệu', desc: 'Phân quyền & danh mục.', icon: Settings, color: 'slate' },
    ]
  },
  {
    title: 'Công việc',
    items: [
      { id: 'work_project', label: 'Dự án', desc: 'Quản lý tiến độ dự án.', icon: FolderOpen, color: 'blue' },
      { id: 'work_mine', label: 'Công việc của tôi', desc: 'Danh sách việc cần làm.', icon: ClipboardCheck, color: 'emerald' },
      { id: 'work_manage', label: 'Việc tôi quản lý', desc: 'Giám sát tiến độ nhân viên.', icon: ClipboardList, color: 'purple' },
      { id: 'work_report', label: 'Báo cáo công việc', desc: 'Thống kê khối lượng.', icon: BarChart2, color: 'cyan' },
      { id: 'work_config', label: 'Thiết lập công việc', desc: 'Cấu hình quy trình, loại việc.', icon: Settings, color: 'slate' },
    ]
  },
  {
    title: 'Tài sản',
    items: [
      { id: 'asset_list', label: 'Danh sách tài sản', desc: 'Quản lý kho tài sản.', icon: Monitor, color: 'blue' },
      { id: 'asset_assign', label: 'Cấp phát thu hồi', desc: 'Quản lý luân chuyển tài sản.', icon: ArrowRightLeft, color: 'emerald' },
      { id: 'asset_maintenance', label: 'Bảo trì sửa chữa', desc: 'Lịch sử bảo dưỡng.', icon: Wrench, color: 'orange' },
      { id: 'asset_inventory', label: 'Kiểm kê tài sản', desc: 'Biên bản kiểm kê.', icon: ClipboardCheck, color: 'purple' },
      { id: 'asset_depreciation', label: 'Khấu hao tài sản', desc: 'Bảng tính khấu hao.', icon: BarChart2, color: 'cyan' },
      { id: 'asset_location', label: 'Nơi quản lý', desc: 'Phòng ban/Vị trí lưu kho.', icon: MapPin, color: 'indigo' },
      { id: 'asset_config', label: 'Thiết lập tài sản', desc: 'Cấu hình danh mục.', icon: Settings, color: 'slate' },
    ]
  }
];

const INTERNAL_NEWS = [
  { id: 1, title: 'Thông báo v/v Nghỉ lễ Chiến thắng 30/4 và Quốc tế lao động 1/5', date: '18/04/2026', type: 'Announcement', priority: 'high' },
  { id: 2, title: 'Chiến dịch "Xanh hóa văn phòng" - Kick-off quý 2/2026', date: '15/04/2026', type: 'Event', priority: 'medium' },
  { id: 3, title: 'Thư chúc mừng của Ban Giám đốc nhân dịp đạt KPI quý 1', date: '12/04/2026', type: 'News', priority: 'low' },
];

export function Workspace() {
  const [activeModule, setActiveModule] = useState<string>('overview');

  return (
    <div className="p-8 space-y-12">
      {activeModule === 'overview' && (
        <>
          {/* News & Announcements Widget */}
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-900/10">
            <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="bg-blue-500/20 text-blue-400 p-2 rounded-lg border border-blue-500/30">
                      <Zap className="w-5 h-5 fill-current" />
                   </div>
                   <h2 className="text-xl font-bold tracking-tight">Tin tức & Thông báo nội bộ</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {INTERNAL_NEWS.map(news => (
                      <div key={news.id} className="bg-white/5 border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all cursor-pointer group">
                         <div className="flex justify-between items-start mb-3">
                            <span className={cn(
                               "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
                               news.priority === 'high' ? "bg-rose-500/20 text-rose-400" : 
                               news.priority === 'medium' ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                            )}>
                               {news.type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{news.date}</span>
                         </div>
                         <h3 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 leading-relaxed">
                            {news.title}
                         </h3>
                         <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-400 group-hover:text-white transition-colors">
                            Xem chi tiết <ArrowRight className="w-3 h-3" />
                         </div>
                      </div>
                   ))}
                </div>
              </div>
              <div className="shrink-0 hidden xl:block">
                 <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20">
                    Tất cả tin tức
                 </button>
              </div>
            </div>
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 blur-[80px] translate-y-1/2 -translate-x-1/4" />
          </div>

          <div className="space-y-12">
            {MODULE_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-1.5 h-8 bg-blue-600 rounded-full" />
                <h2 className="text-xl font-bold text-[#111827]">{group.title}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {group.items.map(item => (
                    <button 
                       key={item.id} 
                       onClick={() => setActiveModule(item.id)}
                       className="bg-slate-50 border border-slate-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md hover:bg-white transition-all text-left flex gap-4 items-start group"
                    >
                       <div className={cn("p-3 rounded-xl shrink-0 transition-transform group-hover:scale-105", getColorClasses(item.color))}>
                          <item.icon className="w-6 h-6" />
                       </div>
                       <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold text-[#111827] mb-1">{item.label}</h3>
                          <p className="text-xs text-slate-500 leading-relaxed mb-3">{item.desc}</p>
                       </div>
                    </button>
                 ))}
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);
}
