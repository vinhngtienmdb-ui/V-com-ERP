import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 Trophy, 
 GraduationCap, 
 Target, 
 TrendingUp, 
 BookOpen, 
 PlayCircle, 
 CheckCircle2, 
 Clock, 
 Search, 
 Filter, 
 Plus,
 ArrowRight,
 Star,
 Users,
 MoreVertical
} from 'lucide-react';
import { cn } from '../lib/utils';
import { KPI, TrainingCourse } from '../types/erp';

const MOCK_KPIs: KPI[] = [
 { id: '1', employeeId: 'EMP-001', title: 'Tỷ lệ đơn hàng thành công', target: 98, current: 96.5, unit: '%', period: 'Tháng 03/2024' },
 { id: '2', employeeId: 'EMP-001', title: 'Thời gian đóng gói TB', target: 30, current: 28, unit: 'phút', period: 'Tháng 03/2024' },
];

const MOCK_COURSES: TrainingCourse[] = [
 { id: '1', title: 'Quy trình vận hành Sàn VComm', category: 'Cơ bản', enrolledCount: 124, progress: 85 },
 { id: '2', title: 'Kỹ năng CSKH đa kênh nâng cao', category: 'Kỹ năng', enrolledCount: 45, progress: 40 },
 { id: '3', title: 'An toàn thông tin dữ liệu sàn', category: 'Bắt buộc', enrolledCount: 156, progress: 100 },
];

export function Performance() {
 const [activeTab, setActiveTab] = useState<'kpi' | 'training' | 'review'>('kpi');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Hiệu suất & Đào tạo</h1>
 <p className="text-sm text-[#6B7280] mt-1">Quản lý mục tiêu KPIs/OKRs, đánh giá 360 độ và cổng học tập trực tuyến (LMS).</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <TrendingUp className="w-4 h-4" />
 Báo cáo hiệu suất
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" />
 Thiết lập mục tiêu mới
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="p-2 bg-slate-100 text-orange-700 rounded-lg w-fit mb-3">
 <Target className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">KPI Hoàn thành TB (Toàn sàn)</p>
 <div className="text-2xl font-bold text-[#111827]">92.4%</div>
 <div className="mt-1 text-[10px] text-[#10B981] font-medium">+2.1% so với tháng trước</div>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg w-fit mb-3">
 <GraduationCap className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Khóa học đang diễn ra</p>
 <div className="text-2xl font-bold text-[#111827]">08</div>
 <p className="text-[10px] text-[#6B7280] mt-1">1,240 lượt đăng ký học</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="p-2 bg-orange-50 text-orange-600 rounded-lg w-fit mb-3">
 <Users className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Đánh giá 360 Độ</p>
 <div className="text-2xl font-bold text-[#F59E0B]">Đợt 1/2024</div>
 <p className="text-[10px] text-[#EF4444] font-medium">15 nhân sự chưa hoàn tất</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-3">
 <Trophy className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Nhân viên ưu tú tháng</p>
 <div className="text-2xl font-bold text-[#10B981]">05</div>
 <div className="mt-1 flex items-center gap-1 text-[10px] text-[#8B5CF6] font-medium">
 <Star className="w-3 h-3 fill-current" /> Thưởng nóng GMV
 </div>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-[#F3F4F6]">
 {[
 { id: 'kpi', label: 'Quản trị KPI/OKR', icon: Target },
 { id: 'training', label: 'E-learning (LMS)', icon: BookOpen },
 { id: 'review', label: 'Đánh giá năng lực 360', icon: Star }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
 activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-slate-100/30" : "border-transparent text-[#6B7280] hover:text-[#111827]"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 <div className="p-6 space-y-6">
 {activeTab === 'kpi' && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
 {MOCK_KPIs.map(kpi => (
 <div key={kpi.id} className="p-5 border border-slate-300 rounded-lg space-y-4">
 <div className="flex justify-between items-start">
 <div>
 <h4 className="font-bold text-[#111827]">{kpi.title}</h4>
 <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">{kpi.period}</p>
 </div>
 <button className="text-[#9CA3AF] hover:text-[#111827]"><MoreVertical className="w-4 h-4" /></button>
 </div>
 <div className="space-y-1.5">
 <div className="flex justify-between text-xs">
 <span className="text-[#6B7280]">Tiến độ</span>
 <span className="font-bold text-[#2563EB]">{((kpi.current / kpi.target) * 100).toFixed(1)}%</span>
 </div>
 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
 <div 
 className="h-full bg-[#2563EB] rounded-full"
 style={{ width: `${(kpi.current / kpi.target) * 100}%` }}
 />
 </div>
 <div className="flex justify-between text-[10px] text-[#9CA3AF]">
 <span>Hiện tại: {kpi.current}{kpi.unit}</span>
 <span>Mục tiêu: {kpi.target}{kpi.unit}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="bg-slate-900 text-[#FAF9F5] p-6 rounded-lg flex flex-col items-center text-center space-y-4">
 <div className="p-3 bg-white/10 rounded-lg border border-white/20">
 <Users className="w-8 h-8 text-blue-300" />
 </div>
 <h3 className="text-xl font-bold italic">Hệ thống Đào tạo & Đánh giá 360 Độ</h3>
 <p className="text-slate-500 text-sm max-w-2xl">
 Tự động tổng hợp ý kiến từ Đồng nghiệp, Quản lý trực tiếp và Nhân viên cấp dưới để đưa ra cái nhìn khách quan nhất về năng lực. Kết nối trực tiếp kết quả học tập từ LMS để đề xuất thăng tiến hoặc điều chỉnh quỹ lương.
 </p>
 <button className="px-6 py-3 bg-[#2563EB] text-[#FAF9F5] font-bold rounded-lg hover:bg-slate-900 transition-all shadow-sm shadow-slate-900/5 flex items-center gap-2">
 Mở cổng Đánh giá Định kỳ <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 );
}
