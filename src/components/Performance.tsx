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
 <div className="space-y-4 animate-in fade-in slide-in- duration-500">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900">Hiệu suất & Đào tạo</h1>
 <p className="text-sm text-slate-500 mt-1">Quản lý mục tiêu KPIs/OKRs, đánh giá 360 độ và cổng học tập trực tuyến (LMS).</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <TrendingUp className="w-4 h-4" />
 Báo cáo hiệu suất
 </button>
 <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" />
 Thiết lập mục tiêu mới
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="p-2 bg-slate-100 text-blue-600 rounded-lg w-fit mb-3">
 <Target className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">KPI Hoàn thành TB (Toàn sàn)</p>
 <div className="text-xl font-bold text-slate-900">92.4%</div>
 <div className="mt-1 text-[10px] text-[#10B981] font-medium">+2.1% so với tháng trước</div>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg w-fit mb-3">
 <GraduationCap className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Khóa học đang diễn ra</p>
 <div className="text-xl font-bold text-slate-900">08</div>
 <p className="text-[10px] text-slate-500 mt-1">1,240 lượt đăng ký học</p>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="p-2 bg-orange-50 text-blue-600 rounded-lg w-fit mb-3">
 <Users className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Đánh giá 360 Độ</p>
 <div className="text-2xl font-bold text-[#F59E0B]">Đợt 1/2024</div>
 <p className="text-[10px] text-[#EF4444] font-medium">15 nhân sự chưa hoàn tất</p>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-3">
 <Trophy className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Nhân viên ưu tú tháng</p>
 <div className="text-2xl font-bold text-[#10B981]">05</div>
 <div className="mt-1 flex items-center gap-1 text-[10px] text-[#8B5CF6] font-medium">
 <Star className="w-3 h-3 fill-current" /> Thưởng nóng GMV
 </div>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-slate-100">
 {[
 { id: 'kpi', label: 'Quản trị KPI/OKR', icon: Target },
 { id: 'training', label: 'E-learning (LMS)', icon: BookOpen },
 { id: 'review', label: 'Đánh giá năng lực 360', icon: Star }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
 activeTab === tab.id ? "border-[#2563EB] text-blue-600 bg-slate-100/30" : "border-transparent text-slate-500 hover:text-slate-900"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 <div className="p-6 space-y-3">
 {activeTab === 'kpi' && (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
 {MOCK_KPIs.map(kpi => (
 <div key={kpi.id} className="p-5 border border-slate-200 rounded-2xl space-y-4">
 <div className="flex justify-between items-start">
 <div>
 <h4 className="font-bold text-slate-900">{kpi.title}</h4>
 <p className="text-[10px] text-slate-500 uppercase tracking-wider">{kpi.period}</p>
 </div>
 <button className="text-[#9CA3AF] hover:text-slate-900"><MoreVertical className="w-4 h-4" /></button>
 </div>
 <div className="space-y-1.5">
 <div className="flex justify-between text-xs">
 <span className="text-slate-500">Tiến độ</span>
 <span className="font-bold text-blue-600">{((kpi.current / kpi.target) * 100).toFixed(1)}%</span>
 </div>
 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
 <div 
 className="h-full bg-blue-600 rounded-full"
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

 <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
 <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
 <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Users className="w-4 h-4" /></div>
 <h3 className="text-sm font-bold text-slate-900">Hệ thống Đào tạo & Đánh giá 360 Độ</h3>
 </div>
 <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
 <p className="text-sm text-slate-600 leading-relaxed flex-1">
 Tự động tổng hợp ý kiến từ Đồng nghiệp, Quản lý và Nhân viên cấp dưới. Kết nối kết quả học tập từ LMS để đề xuất thăng tiến hoặc điều chỉnh quỹ lương.
 </p>
 <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all text-xs flex items-center gap-2 shrink-0">
 Mở cổng Đánh giá <ArrowRight className="w-3 h-3" />
 </button>
 </div>
 </div>
 </div>
 );
}
