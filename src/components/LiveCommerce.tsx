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
 sellerName: 'Phụ kiện Apple Hà Nội', 
 title: 'Xả kho iPhone 15 Pro Max - Giá sốc chỉ hôm nay!', 
 startTime: '17/03/2024 20:00', 
 viewerCount: 4250, 
 pinnedProducts: ['IP15-PM-128', 'IP15-PRO-256'], 
 revenue: 1250000000, 
 status: 'live' 
 },
 { 
 id: 'LIVE-002', 
 sellerId: 'SEL-005', 
 sellerName: 'Thời trang Uniqlo Official', 
 title: 'BST hè 2024 - Sale up to 50%', 
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
 <div className="space-y-4 animate-in fade-in slide-in- duration-500 pb-4">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900">Live-commerce Hub</h1>
 <p className="text-sm text-slate-500 mt-1">Trung tâm điều hành Livestream toàn sàn, ghim sản phẩm và theo dõi tương tác thời gian thực.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Calendar className="w-4 h-4" />
 Lịch Livestream tập trung
 </button>
 <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" />
 Tạo Chiến dịch Live lớn
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Tổng Livestreams hôm nay</span>
 <Video className="w-4 h-4 text-blue-600" />
 </div>
 <div className="text-xl font-bold text-slate-900">420</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">12 phiên đang LIVE trực tiếp</p>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Đang xem trực tiếp</span>
 <Users className="w-4 h-4 text-[#8B5CF6]" />
 </div>
 <div className="text-xl font-bold text-slate-900">15,450</div>
 <p className="text-[10px] text-slate-500 mt-1">Khách hàng trên các kênh Live</p>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Doanh thu bán qua Live</span>
 <TrendingUp className="w-4 h-4 text-[#10B981]" />
 </div>
 <div className="text-xl font-bold text-slate-900">{formatCurrency(4850000000)}</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">+24% so với trung bình ngày</p>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Engagement Rate</span>
 <Heart className="w-4 h-4 text-emerald-500" />
 </div>
 <div className="text-xl font-bold text-slate-900">18.5%</div>
 <p className="text-[10px] text-slate-500 mt-1">Tỷ lệ tương tác: Comment/Tim</p>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-slate-100">
 {[
 { id: 'sessions', label: 'Các phiên Livestream', icon: Tv },
 { id: 'analytics', label: 'Báo cáo hiệu quả Live', icon: BarChart3 },
 { id: 'schedule', label: 'Lịch trình sắp tới', icon: Clock }
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

 <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Tìm Seller, Tiêu đề LIVE..." 
 className="bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Tất cả trạng thái
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
 {activeTab === 'sessions' && MOCK_LIVES.map(live => (
 <div key={live.id} className="bg-white border border-slate-300 rounded-2xl overflow-hidden group hover:border-[#2563EB] transition-all shadow-sm">
 <div className="relative h-48 bg-slate-100 flex items-center justify-center">
 {live.status === 'live' ? (
 <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-red-600 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest animate-pulse z-10">
 <Eye className="w-3.5 h-3.5" /> LIVE TRỰC TIẾP
 </div>
 ) : (
 <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-white uppercase tracking-widest z-10">
 <Clock className="w-3.5 h-3.5" /> SẮP DIỄN RA
 </div>
 )}
 <PlayCircle className="w-12 h-12 text-slate-500 opacity-50 group-hover:scale-110 group-hover:text-blue-600 group-hover:opacity-100 transition-all" />
 <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center bg-black/40 backdrop-blur-md rounded-lg p-2 z-10">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white" />
 <span className="text-white text-[10px] font-bold truncate max-w-[100px]">{live.sellerName}</span>
 </div>
 <div className="flex items-center gap-1.5 text-white/80 text-[10px] font-medium">
 <Users className="w-3.5 h-3.5" /> {live.viewerCount.toLocaleString()}
 </div>
 </div>
 </div>
 <div className="p-4 space-y-3">
 <h4 className="font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{live.title}</h4>
 <div className="flex items-center gap-4 text-[10px] text-slate-500 font-bold">
 <div className="flex items-center gap-1">
 <ShoppingCart className="w-3.5 h-3.5 text-blue-600" /> {live.pinnedProducts.length} Sản phẩm
 </div>
 {live.status === 'live' && (
 <div className="flex items-center gap-1 text-[#10B981]">
 <TrendingUp className="w-3.5 h-3.5" /> {formatCurrency(live.revenue)}
 </div>
 )}
 </div>
 <div className="pt-2 flex gap-2">
 <button className="flex-1 py-2 bg-blue-600 text-white text-[11px] font-bold rounded-lg hover:bg-slate-800 transition-all">Vào kiểm soát Live</button>
 <button className="p-2 border border-slate-200 rounded-2xl"><MoreVertical className="w-4 h-4 text-slate-500" /></button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
 <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
 <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Tv className="w-4 h-4" /></div>
 <h3 className="text-sm font-bold text-slate-900">Live Management Hub</h3>
 <span className="ml-auto px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold uppercase tracking-widest rounded animate-pulse">REC</span>
 </div>
 <div className="p-4 flex flex-col md:flex-row items-start gap-6">
 <div className="flex-1 space-y-3">
 <p className="text-sm text-slate-600 leading-relaxed">
 Hệ thống điều phối luồng Livestream chuyên nghiệp. Theo dõi hành vi người dùng, lọc bình luận tiêu cực thời gian thực và tự động gửi Voucher khi lượt xem đạt mốc.
 </p>
 <div className="flex flex-wrap gap-3">
 <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-all text-xs flex items-center gap-2">
 Báo cáo doanh thu LIVE <ArrowRight className="w-3 h-3" />
 </button>
 <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-all text-xs">Cấu hình API RTMP/Stream</button>
 </div>
 </div>
 <div className="hidden lg:flex w-48 h-28 bg-slate-100 rounded-xl border border-slate-200 relative overflow-hidden shrink-0 items-center justify-center">
 <PlayCircle className="w-10 h-10 text-slate-400" />
 </div>
 </div>
 </div>
 </div>
 );
}
