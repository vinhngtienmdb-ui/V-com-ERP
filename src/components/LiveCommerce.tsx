import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 Video, 
 Tv, 
 BarChart3, 
 Calendar, 
 MessageSquare, 
 Users, 
 TrendingUp, 
 Plus, 
 Search, 
 Filter, 
 Eye, 
 Heart, 
 ShoppingCart,
 CheckCircle2,
 Clock,
 PlayCircle,
 MoreVertical,
 ArrowRight
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { LiveSession } from '../types/erp';

const MOCK_LIVES: LiveSession[] = [
 { 
 id: 'LIVE-001', 
 sellerId: 'SEL-001', 
 sellerName: 'Phá»¥ kiá»‡n Apple HÃ  Ná»™i', 
 title: 'Xáº£ kho iPhone 15 Pro Max - GiÃ¡ sá»‘c chá»‰ hÃ´m nay!', 
 startTime: '17/03/2024 20:00', 
 viewerCount: 4250, 
 pinnedProducts: ['IP15-PM-128', 'IP15-PRO-256'], 
 revenue: 1250000000, 
 status: 'live' 
 },
 { 
 id: 'LIVE-002', 
 sellerId: 'SEL-005', 
 sellerName: 'Thá»i trang Uniqlo Official', 
 title: 'BST hÃ¨ 2024 - Sale up to 50%', 
 startTime: '18/03/2024 10:00', 
 viewerCount: 0, 
 pinnedProducts: ['UNI-TSHIRT-01', 'UNI-PANTS-02'], 
 revenue: 0, 
 status: 'upcoming' 
 }
];

export function LiveCommerce() {
 const [activeTab, setActiveTab] = useState<'sessions' | 'analytics' | 'schedule'>('sessions');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Live-commerce Hub</h1>
 <p className="text-sm text-[#6B7280] mt-1">Trung tÃ¢m Ä‘iá»u hÃ nh Livestream toÃ n sÃ n, ghim sáº£n pháº©m vÃ  theo dÃµi tÆ°Æ¡ng tÃ¡c thá»i gian thá»±c.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Calendar className="w-4 h-4" />
 Lá»‹ch Livestream táº­p trung
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" />
 Táº¡o Chiáº¿n dá»‹ch Live lá»›n
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Tá»•ng Livestreams hÃ´m nay</span>
 <Video className="w-4 h-4 text-[#2563EB]" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">420</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">12 phiÃªn Ä‘ang LIVE trá»±c tiáº¿p</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Äang xem trá»±c tiáº¿p</span>
 <Users className="w-4 h-4 text-[#8B5CF6]" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">15,450</div>
 <p className="text-[10px] text-[#6B7280] mt-1">KhÃ¡ch hÃ ng trÃªn cÃ¡c kÃªnh Live</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Doanh thu bÃ¡n qua Live</span>
 <TrendingUp className="w-4 h-4 text-[#10B981]" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">{formatCurrency(4850000000)}</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">+24% so vá»›i trung bÃ¬nh ngÃ y</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Engagement Rate</span>
 <Heart className="w-4 h-4 text-emerald-500" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">18.5%</div>
 <p className="text-[10px] text-[#6B7280] mt-1">Tá»· lá»‡ tÆ°Æ¡ng tÃ¡c: Comment/Tim</p>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-[#F3F4F6]">
 {[
 { id: 'sessions', label: 'CÃ¡c phiÃªn Livestream', icon: Tv },
 { id: 'analytics', label: 'BÃ¡o cÃ¡o hiá»‡u quáº£ Live', icon: BarChart3 },
 { id: 'schedule', label: 'Lá»‹ch trÃ¬nh sáº¯p tá»›i', icon: Clock }
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

 <div className="p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="TÃ¬m Seller, TiÃªu Ä‘á» LIVE..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Táº¥t cáº£ tráº¡ng thÃ¡i
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
 {activeTab === 'sessions' && MOCK_LIVES.map(live => (
 <div key={live.id} className="bg-white border border-slate-300 rounded-lg overflow-hidden group hover:border-[#2563EB] transition-all shadow-sm">
 <div className="relative h-48 bg-slate-100 flex items-center justify-center">
 {live.status === 'live' ? (
 <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-red-600 rounded-lg text-[10px] font-bold text-[#FAF9F5] uppercase tracking-widest animate-pulse z-10">
 <Eye className="w-3.5 h-3.5" /> LIVE TRá»°C TIáº¾P
 </div>
 ) : (
 <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-[#FAF9F5] uppercase tracking-widest z-10">
 <Clock className="w-3.5 h-3.5" /> Sáº®P DIá»„N RA
 </div>
 )}
 <PlayCircle className="w-12 h-12 text-slate-500 opacity-50 group-hover:scale-110 group-hover:text-[#2563EB] group-hover:opacity-100 transition-all" />
 <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black/40 backdrop-blur-md rounded-lg p-2 z-10">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
 <span className="text-[#FAF9F5] text-[10px] font-bold truncate max-w-[100px]">{live.sellerName}</span>
 </div>
 <div className="flex items-center gap-1.5 text-[#FAF9F5]/80 text-[10px] font-medium">
 <Users className="w-3.5 h-3.5" /> {live.viewerCount.toLocaleString()}
 </div>
 </div>
 </div>
 <div className="p-4 space-y-3">
 <h4 className="font-bold text-[#111827] line-clamp-2 leading-tight group-hover:text-[#2563EB] transition-colors">{live.title}</h4>
 <div className="flex items-center gap-4 text-[10px] text-[#6B7280] font-bold">
 <div className="flex items-center gap-1">
 <ShoppingCart className="w-3.5 h-3.5 text-[#2563EB]" /> {live.pinnedProducts.length} Sáº£n pháº©m
 </div>
 {live.status === 'live' && (
 <div className="flex items-center gap-1 text-[#10B981]">
 <TrendingUp className="w-3.5 h-3.5" /> {formatCurrency(live.revenue)}
 </div>
 )}
 </div>
 <div className="pt-2 flex gap-2">
 <button className="flex-1 py-2 bg-[#2563EB] text-[#FAF9F5] text-[11px] font-bold rounded-lg hover:bg-slate-800 transition-all">VÃ o kiá»ƒm soÃ¡t Live</button>
 <button className="p-2 border border-slate-300 rounded-lg"><MoreVertical className="w-4 h-4 text-slate-500" /></button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-slate-900 rounded-lg p-8 text-[#FAF9F5] relative overflow-hidden">
 <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
 <div className="flex-1 space-y-4 text-center md:text-left">
 <div className="flex items-center justify-center md:justify-start gap-4">
 <div className="p-3 bg-slate-800 rounded-lg">
 <Tv className="w-8 h-8 text-[#FAF9F5]" />
 </div>
 <h3 className="text-2xl font-bold italic">Live Management Hub</h3>
 </div>
 <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
 Há»‡ thá»‘ng Ä‘iá»u phá»‘i luá»“ng Livestream chuyÃªn nghiá»‡p cho SÃ n. Cho phÃ©p Admin theo dÃµi hÃ nh vi ngÆ°á»i dÃ¹ng, lá»c bÃ¬nh luáº­n tiÃªu cá»±c thá»i gian thá»±c vÃ  tá»± Ä‘á»™ng gá»­i Voucher "giáº£m sÃ¢u" ngay khi lÆ°á»£t xem Ä‘áº¡t má»‘c (Goal Achievement).
 </p>
 <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
 <button className="px-8 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-all text-sm flex items-center gap-2">
 BÃ¡o cÃ¡o doanh thu LIVE <ArrowRight className="w-4 h-4" />
 </button>
 <button className="px-8 py-3 bg-slate-800 border border-slate-700 text-[#FAF9F5] font-bold rounded-lg hover:bg-slate-700 transition-all text-sm">Cáº¥u hÃ¬nh API RTMP/Stream</button>
 </div>
 </div>
 <div className="hidden lg:block w-72 h-48 bg-slate-800/50 rounded-lg border border-slate-700 relative overflow-hidden">
 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
 <div className="absolute top-4 left-4 px-2 py-0.5 bg-red-600 rounded text-[9px] font-bold uppercase tracking-widest animate-pulse">REC</div>
 <div className="absolute inset-0 flex items-center justify-center">
 <PlayCircle className="w-12 h-12 text-[#FAF9F5]/50" />
 </div>
 </div>
 </div>
 <Video className="absolute -bottom-10 -right-10 w-64 h-64 text-slate-900/10" />
 </div>
 </div>
 );
}

