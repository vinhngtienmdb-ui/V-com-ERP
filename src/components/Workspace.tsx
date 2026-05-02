import React, { useState } from 'react';
import { 
 Clock, 
 ClipboardList, 
 FileSignature, 
 Activity, 
 DollarSign, 
 Zap, 
 Mail, 
 User, 
 Users, 
 Calendar as CalendarIcon, 
 Send, 
 FileText, 
 ShieldCheck, 
 BarChart2, 
 Settings, 
 Building2, 
 Video, 
 BrainCircuit, 
 MessageSquare, 
 Car, 
 Monitor, 
 ArrowLeft, 
 ArrowRight, 
 FolderOpen, 
 ClipboardCheck, 
 MapPin, 
 Wrench, 
 ArrowRightLeft, 
 Plus, 
 CheckCircle2, 
 Clock3,
 ArrowUpRight,
 UserCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { WorkspaceBooking, MeetingEvent } from '../types/erp';

function getColorClasses(color: string) {
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

const MODULE_GROUPS = [
 {
 title: 'Lịch & Tiện ích (Mới & Đề xuất)',
 items: [
 { id: 'calendar', label: 'Lịch công tác', desc: 'Lịch tuần ban lãnh đạo', icon: CalendarIcon, color: 'indigo' },
 { id: 'meeting_rooms', label: 'Đặt phòng họp', desc: 'Lịch trống phòng họp', icon: Building2, color: 'rose' },
 { id: 'vehicles', label: 'Điều xe công tác', desc: 'Đăng ký xe ô tô cơ quan', icon: Car, color: 'blue' },
 ]
 },
 {
 title: 'Công việc & Quy trình (Nâng cấp)',
 items: [
 { id: 'work_project', label: 'Quản lý Dự án (Kanban)', desc: 'Tiến độ dự án', icon: FolderOpen, color: 'blue' },
 { id: 'work_mine', label: 'Công việc của tôi', desc: 'Danh sách việc cần làm.', icon: ClipboardCheck, color: 'emerald' },
 { id: 'work_manage', label: 'Giao việc & Giám sát', desc: 'Giao việc cho cấp dưới.', icon: ClipboardList, color: 'purple' },
 { id: 'work_report', label: 'Báo cáo hiệu suất', desc: 'Thống kê lượng việc.', icon: BarChart2, color: 'cyan' },
 ]
 },
 {
 title: 'Tài liệu & Hồ sơ',
 items: [
 { id: 'doc_list', label: 'Tài liệu chuyên môn', desc: 'Kho lưu trữ dùng chung', icon: FolderOpen, color: 'blue' },
 { id: 'doc_archive', label: 'Kho Lưu trữ Cơ quan', desc: 'Số hóa tài liệu cũ', icon: FileText, color: 'emerald' },
 ]
 },
 {
 title: 'Tài sản Cơ quan',
 items: [
 { id: 'asset_list', label: 'Danh sách tài sản', desc: 'Quản lý kho tài sản.', icon: Monitor, color: 'blue' },
 { id: 'asset_assign', label: 'Cấp phát & Bàn giao', desc: 'Luân chuyển tài sản.', icon: ArrowRightLeft, color: 'emerald' },
 { id: 'asset_maintenance', label: 'Bảo trì sửa chữa', desc: 'Lịch sử bảo dưỡng.', icon: Wrench, color: 'orange' },
 ]
 }
];

const INTERNAL_NEWS = [
 { id: 1, title: 'Thông báo v/v Nghỉ lễ Chiến thắng 30/4 và Quốc tế lao động 1/5', date: '18/04/2026', type: 'Announcement', priority: 'high' },
 { id: 2, title: 'Chiến dịch \"Xanh hóa văn phòng\" - Kick-off quý 2/2026', date: '15/04/2026', type: 'Event', priority: 'medium' },
 { id: 3, title: 'Thư chúc mừng của Ban Giám đốc nhân dịp đạt KPI quý 1', date: '12/04/2026', type: 'News', priority: 'low' },
];

export function Workspace() {
 const [activeModule, setActiveModule] = useState<string>('overview');

 // Kanban Tasks State
 const [tasks, setTasks] = useState([
 { id: 't1', title: 'Lập KH Triển khai eOffice', date: '18/04/2026', priority: 'Gấp', status: 'todo', progress: 0 },
 { id: 't2', title: 'Thiết kế Mockup UI', date: '19/04/2026', priority: 'Bình thường', status: 'todo', progress: 0 },
 { id: 't3', title: 'Báo cáo Quý 1/2026', date: '20/04/2026', priority: 'Dự án', status: 'in_progress', progress: 45, desc: 'Tổng hợp số liệu doanh thu từ các bộ phận kinh doanh và lập báo cáo.' },
 { id: 't4', title: 'Chuẩn bị hồ sơ đấu thầu', date: '15/04/2026', priority: 'Quan trọng', status: 'done', progress: 100 },
 ]);

 const handleDragStart = (e: React.DragEvent, id: string) => {
 e.dataTransfer.setData('taskId', id);
 };

 const handleDragOver = (e: React.DragEvent) => {
 e.preventDefault();
 };

 const handleDrop = (e: React.DragEvent, newStatus: string) => {
 const id = e.dataTransfer.getData('taskId');
 setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus, progress: newStatus === 'done' ? 100 : t.progress } : t));
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-1">
 {activeModule !== 'overview' && (
 <button onClick={() => setActiveModule('overview')} className="p-1 hover:bg-slate-100 rounded-md transition-colors mr-1">
 <ArrowLeft className="w-4 h-4 text-slate-600" />
 </button>
 )}
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Không gian làm việc (eOffice)</h1>
 </div>
 <p className="text-sm text-[#6B7280]">Trung tâm điều hành công việc, quy trình và tiện ích nội bộ.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <CalendarIcon className="w-4 h-4 text-primary-600" /> Lịch tuần
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" /> Tạo mới
 </button>
 </div>
 </div>

 {activeModule === 'overview' && (
 <div className="space-y-8">
 {/* News / Alert Banner */}
 <div className="bg-slate-900 rounded-lg p-8 text-[#FAF9F5] relative overflow-hidden shadow-sm shadow-blue-900/10">
 <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start md:items-center">
 <div className="flex-1 space-y-4">
 <div className="flex items-center gap-3">
 <div className="bg-slate-800/20 text-orange-500 p-2 rounded-lg border border-slate-900/30">
 <Zap className="w-5 h-5 fill-current" />
 </div>
 <h2 className="text-xl font-bold tracking-tight">Tin tức & Thông báo nội bộ</h2>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 {INTERNAL_NEWS.map(news => (
 <div key={news.id} className="bg-white/5 border border-white/10 p-5 rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
 <div className="flex justify-between items-start mb-3">
 <span className={cn(
 "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider",
 news.priority === 'high' ? "bg-rose-500/20 text-rose-400" : 
 news.priority === 'medium' ? "bg-orange-500/20 text-orange-400" : "bg-slate-800/20 text-orange-500"
 )}>
 {news.type}
 </span>
 <span className="text-[10px] text-slate-500 font-medium">{news.date}</span>
 </div>
 <h3 className="text-sm font-bold text-slate-300 group-hover:text-orange-500 transition-colors line-clamp-2 leading-relaxed">
 {news.title}
 </h3>
 </div>
 ))}
 </div>
 </div>
 </div>
 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
 <BrainCircuit className="w-64 h-64 transform rotate-12 translate-x-20 -translate-y-10" />
 </div>
 </div>

 {/* Matrix Grid Layout */}
 <div className="space-y-6">
 {MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx} className="space-y-4">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
 <span className="w-1 h-4 bg-[#2563EB] rounded-full inline-block" />
 {group.title}
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
 {group.items.map((mod) => (
 <div 
 key={mod.id}
 onClick={() => setActiveModule(mod.id as any)}
 className="group bg-white p-5 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm hover:border-[#2563EB]/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
 <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
 </div>
 <div className={cn("w-12 h-12 rounded relative z-10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-[#FAF9F5] transition-all shadow-sm", getColorClasses(mod.color))}>
 <mod.icon className="w-6 h-6" />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-[#111827] text-sm mb-1.5 group-hover:text-[#2563EB] transition-colors">{mod.label}</h3>
 <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">{mod.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeModule === 'work_project' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {['todo', 'in_progress', 'done'].map((status) => (
 <div 
 key={status}
 onDragOver={handleDragOver}
 onDrop={(e) => handleDrop(e, status)}
 className="bg-slate-50/50 rounded-lg border border-slate-300 flex flex-col min-h-[600px]"
 >
 <div className="p-4 border-b border-slate-300 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider">
 {status === 'todo' ? 'Cần làm' : status === 'in_progress' ? 'Đang thực hiện' : 'Hoàn thành'}
 </h3>
 <span className="bg-white border border-slate-300 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
 {tasks.filter(t => t.status === status).length}
 </span>
 </div>
 <button className="p-1 hover:bg-white rounded transition-colors text-slate-500"><Plus className="w-4 h-4" /></button>
 </div>
 <div className="p-3 space-y-3 flex-1">
 {tasks.filter(t => t.status === status).map((task) => (
 <div 
 key={task.id}
 draggable
 onDragStart={(e) => handleDragStart(e, task.id)}
 className="bg-white p-4 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm hover:border-blue-300 transition-all cursor-grab active:cursor-grabbing group"
 >
 <div className="flex justify-between items-start mb-2">
 <span className={cn(
 "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
 task.priority === 'Gấp' ? "bg-rose-50 text-rose-600" : "bg-slate-100 text-orange-700"
 )}>
 {task.priority}
 </span>
 <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-50 rounded transition-opacity"><ArrowUpRight className="w-3 h-3 text-slate-500" /></button>
 </div>
 <h4 className="text-sm font-bold text-slate-900 group-hover:text-orange-700 transition-colors mb-2">{task.title}</h4>
 {task.desc && <p className="text-[11px] text-slate-600 line-clamp-2 mb-3 leading-relaxed">{task.desc}</p>}
 <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-50">
 <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500"><Clock className="w-3 h-3" /> {task.date}</span>
 <div className="flex -space-x-1.5">
 {[1, 2].map(i => (
 <div key={i} className="w-5 h-5 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-600 overflow-hidden">
 <UserCircle className="w-4 h-4" />
 </div>
 ))}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
