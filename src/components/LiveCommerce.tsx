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
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
              Live Shopping Hub
            </span>
            <span className="text-xs text-slate-500 font-medium">Điều Phối Livestream & Ghim Giỏ Hàng</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Trung Tâm Vận Hành Live-Commerce</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Giám sát phiên livestream toàn sàn theo thời gian thực, điều phối flash deal, voucher chớp nhoáng và phân tích tỷ lệ chốt đơn (CVR).
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer">
            <Calendar className="w-4 h-4 text-blue-600" />
            Lịch Livestream Tập Trung
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Tạo Chiến Dịch Mega Live
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <DraggableGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" columns={4} gap={16}>
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Phiên Live Hôm Nay</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Video className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">420 phiên</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>12 phiên đang trực tiếp</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đang Xem Trực Tiếp</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">15,450 người</div>
          <div className="mt-2 text-xs font-semibold text-purple-600">
            Khán giả đồng thời trên các kênh Live
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Doanh Thu Qua Live</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(4850000000)}</div>
          <div className="mt-2 text-xs font-semibold text-emerald-600">
            +24% so với trung bình ngày
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ Tương Tác</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">18.5%</div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            Bình luận & thả tim tương tác cao
          </div>
        </div>
      </DraggableGrid>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap gap-2">
          {[
            { id: 'sessions', label: 'Các Phiên Livestream Đang Mở', icon: Tv },
            { id: 'analytics', label: 'Báo Cáo Hiệu Quả Doanh Thu', icon: BarChart3 },
            { id: 'schedule', label: 'Lịch Đặt Chỗ Sắp Diễn Ra', icon: Clock }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100/50"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

 <div className="p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Tìm Seller, Tiêu đề LIVE..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Tất cả trạng thái
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
 {activeTab === 'sessions' && MOCK_LIVES.map(live => (
 <div key={live.id} className="bg-white border border-slate-300 rounded-lg overflow-hidden group hover:border-[#2563EB] transition-all shadow-sm">
 <div className="relative h-48 bg-slate-100 flex items-center justify-center">
 {live.status === 'live' ? (
 <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-red-600 rounded-lg text-[10px] font-bold text-[#FAF9F5] uppercase tracking-widest animate-pulse z-10">
 <Eye className="w-3.5 h-3.5" /> LIVE TRỰC TIẾP
 </div>
 ) : (
 <div className="absolute top-4 left-4 flex items-center gap-2 px-2 py-1 bg-slate-800 rounded-lg text-[10px] font-bold text-[#FAF9F5] uppercase tracking-widest z-10">
 <Clock className="w-3.5 h-3.5" /> SẮP DIỄN RA
 </div>
 )}
 <PlayCircle className="w-12 h-12 text-slate-500 opacity-50  group-hover:text-[#2563EB] group-hover:opacity-100 transition-all" />
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
 <ShoppingCart className="w-3.5 h-3.5 text-[#2563EB]" /> {live.pinnedProducts.length} Sản phẩm
 </div>
 {live.status === 'live' && (
 <div className="flex items-center gap-1 text-[#10B981]">
 <TrendingUp className="w-3.5 h-3.5" /> {formatCurrency(live.revenue)}
 </div>
 )}
 </div>
 <div className="pt-2 flex gap-2">
 <button className="flex-1 py-2 bg-[#2563EB] text-[#FAF9F5] text-[11px] font-bold rounded-lg hover:bg-slate-800 transition-all">Vào kiểm soát Live</button>
 <button className="p-2 border border-slate-300 rounded-lg"><MoreVertical className="w-4 h-4 text-slate-500" /></button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-slate-900 rounded-lg p-6 text-[#FAF9F5] relative overflow-hidden">
 <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
 <div className="flex-1 space-y-4 text-center md:text-left">
 <div className="flex items-center justify-center md:justify-start gap-4">
 <div className="p-3 bg-slate-800 rounded-lg">
 <Tv className="w-8 h-8 text-[#FAF9F5]" />
 </div>
 <h3 className="text-2xl font-bold italic">Live Management Hub</h3>
 </div>
 <p className="text-slate-500 text-sm leading-relaxed max-w-xl">
 Hệ thống điều phối luồng Livestream chuyên nghiệp cho Sàn. Cho phép Admin theo dõi hành vi người dùng, lọc bình luận tiêu cực thời gian thực và tự động gửi Voucher "giảm sâu" ngay khi lượt xem đạt mốc (Goal Achievement).
 </p>
 <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
 <button className="px-6 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-all text-sm flex items-center gap-2">
 Báo cáo doanh thu LIVE <ArrowRight className="w-4 h-4" />
 </button>
 <button className="px-6 py-3 bg-slate-800 border border-slate-700 text-[#FAF9F5] font-bold rounded-lg hover:bg-slate-700 transition-all text-sm">Cấu hình API RTMP/Stream</button>
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
