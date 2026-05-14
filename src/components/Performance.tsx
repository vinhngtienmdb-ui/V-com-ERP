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
 { id: '1', employeeId: 'EMP-001', title: 'Tá»· lá»‡ Ä‘Æ¡n hÃ ng thÃ nh cÃ´ng', target: 98, current: 96.5, unit: '%', period: 'ThÃ¡ng 03/2024' },
 { id: '2', employeeId: 'EMP-001', title: 'Thá»i gian Ä‘Ã³ng gÃ³i TB', target: 30, current: 28, unit: 'phÃºt', period: 'ThÃ¡ng 03/2024' },
];

const MOCK_COURSES: TrainingCourse[] = [
 { id: '1', title: 'Quy trÃ¬nh váº­n hÃ nh SÃ n VComm', category: 'CÆ¡ báº£n', enrolledCount: 124, progress: 85 },
 { id: '2', title: 'Ká»¹ nÄƒng CSKH Ä‘a kÃªnh nÃ¢ng cao', category: 'Ká»¹ nÄƒng', enrolledCount: 45, progress: 40 },
 { id: '3', title: 'An toÃ n thÃ´ng tin dá»¯ liá»‡u sÃ n', category: 'Báº¯t buá»™c', enrolledCount: 156, progress: 100 },
];

export function Performance() {
 const [activeTab, setActiveTab] = useState<'kpi' | 'training' | 'review'>('kpi');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Hiá»‡u suáº¥t & ÄÃ o táº¡o</h1>
 <p className="text-sm text-[#6B7280] mt-1">Quáº£n lÃ½ má»¥c tiÃªu KPIs/OKRs, Ä‘Ã¡nh giÃ¡ 360 Ä‘á»™ vÃ  cá»•ng há»c táº­p trá»±c tuyáº¿n (LMS).</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <TrendingUp className="w-4 h-4" />
 BÃ¡o cÃ¡o hiá»‡u suáº¥t
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" />
 Thiáº¿t láº­p má»¥c tiÃªu má»›i
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="p-2 bg-slate-100 text-orange-700 rounded-lg w-fit mb-3">
 <Target className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">KPI HoÃ n thÃ nh TB (ToÃ n sÃ n)</p>
 <div className="text-2xl font-bold text-[#111827]">92.4%</div>
 <div className="mt-1 text-[10px] text-[#10B981] font-medium">+2.1% so vá»›i thÃ¡ng trÆ°á»›c</div>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="p-2 bg-purple-50 text-purple-600 rounded-lg w-fit mb-3">
 <GraduationCap className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">KhÃ³a há»c Ä‘ang diá»…n ra</p>
 <div className="text-2xl font-bold text-[#111827]">08</div>
 <p className="text-[10px] text-[#6B7280] mt-1">1,240 lÆ°á»£t Ä‘Äƒng kÃ½ há»c</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="p-2 bg-orange-50 text-orange-600 rounded-lg w-fit mb-3">
 <Users className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">ÄÃ¡nh giÃ¡ 360 Äá»™</p>
 <div className="text-2xl font-bold text-[#F59E0B]">Äá»£t 1/2024</div>
 <p className="text-[10px] text-[#EF4444] font-medium">15 nhÃ¢n sá»± chÆ°a hoÃ n táº¥t</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg w-fit mb-3">
 <Trophy className="w-5 h-5" />
 </div>
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">NhÃ¢n viÃªn Æ°u tÃº thÃ¡ng</p>
 <div className="text-2xl font-bold text-[#10B981]">05</div>
 <div className="mt-1 flex items-center gap-1 text-[10px] text-[#8B5CF6] font-medium">
 <Star className="w-3 h-3 fill-current" /> ThÆ°á»Ÿng nÃ³ng GMV
 </div>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-[#F3F4F6]">
 {[
 { id: 'kpi', label: 'Quáº£n trá»‹ KPI/OKR', icon: Target },
 { id: 'training', label: 'E-learning (LMS)', icon: BookOpen },
 { id: 'review', label: 'ÄÃ¡nh giÃ¡ nÄƒng lá»±c 360', icon: Star }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
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
 <span className="text-[#6B7280]">Tiáº¿n Ä‘á»™</span>
 <span className="font-bold text-[#2563EB]">{((kpi.current / kpi.target) * 100).toFixed(1)}%</span>
 </div>
 <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
 <div 
 className="h-full bg-[#2563EB] rounded-full"
 style={{ width: `${(kpi.current / kpi.target) * 100}%` }}
 />
 </div>
 <div className="flex justify-between text-[10px] text-[#9CA3AF]">
 <span>Hiá»‡n táº¡i: {kpi.current}{kpi.unit}</span>
 <span>Má»¥c tiÃªu: {kpi.target}{kpi.unit}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>

 <div className="bg-slate-900 text-[#FAF9F5] p-8 rounded-lg flex flex-col items-center text-center space-y-4">
 <div className="p-3 bg-white/10 rounded-lg border border-white/20">
 <Users className="w-8 h-8 text-blue-300" />
 </div>
 <h3 className="text-xl font-bold italic">Há»‡ thá»‘ng ÄÃ o táº¡o & ÄÃ¡nh giÃ¡ 360 Äá»™</h3>
 <p className="text-slate-500 text-sm max-w-2xl">
 Tá»± Ä‘á»™ng tá»•ng há»£p Ã½ kiáº¿n tá»« Äá»“ng nghiá»‡p, Quáº£n lÃ½ trá»±c tiáº¿p vÃ  NhÃ¢n viÃªn cáº¥p dÆ°á»›i Ä‘á»ƒ Ä‘Æ°a ra cÃ¡i nhÃ¬n khÃ¡ch quan nháº¥t vá» nÄƒng lá»±c. Káº¿t ná»‘i trá»±c tiáº¿p káº¿t quáº£ há»c táº­p tá»« LMS Ä‘á»ƒ Ä‘á» xuáº¥t thÄƒng tiáº¿n hoáº·c Ä‘iá»u chá»‰nh quá»¹ lÆ°Æ¡ng.
 </p>
 <button className="px-8 py-3 bg-[#2563EB] text-[#FAF9F5] font-bold rounded-lg hover:bg-slate-900 transition-all shadow-sm shadow-slate-900/5 flex items-center gap-2">
 Má»Ÿ cá»•ng ÄÃ¡nh giÃ¡ Äá»‹nh ká»³ <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 );
}

