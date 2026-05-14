import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 Users, 
 Link2, 
 DollarSign, 
 BarChart3, 
 ExternalLink, 
 Search, 
 Filter, 
 CheckCircle2, 
 Clock,
 ArrowUpRight,
 UserPlus,
 Video,
 Smartphone,
 Share2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Affiliate } from '../types/erp';

export const MOCK_AFFILIATES: Affiliate[] = [
 {
 id: 'AFL-001',
 name: 'KOL Ninh Anh Bùi',
 type: 'kol',
 commissionEarned: 125000000,
 ordersCount: 450,
 clickThroughRate: 18.5,
 status: 'active',
 platforms: ['tiktok', 'instagram'],
 followers: 1200000,
 bookingPrice: 20000000,
 categoryTags: ['Thời trang', 'Đời sống']
 },
 {
 id: 'AFL-002',
 name: 'AccessTrade Vietnam',
 type: 'publisher',
 commissionEarned: 850000000,
 ordersCount: 15400,
 clickThroughRate: 4.2,
 status: 'active'
 },
 {
 id: 'AFL-003',
 name: 'Reviewer Duy Thẩm',
 type: 'kol',
 commissionEarned: 0,
 ordersCount: 0,
 clickThroughRate: 0,
 status: 'pending',
 platforms: ['youtube', 'tiktok'],
 followers: 3500000,
 bookingPrice: 50000000,
 categoryTags: ['Công nghệ', 'Giải trí']
 },
 {
 id: 'AFL-004',
 name: 'KOC Hằng Túi',
 type: 'kol',
 commissionEarned: 350000000,
 ordersCount: 2100,
 clickThroughRate: 12.4,
 status: 'active',
 platforms: ['facebook', 'instagram'],
 followers: 850000,
 bookingPrice: 15000000,
 categoryTags: ['Mẹ & Bé', 'Làm đẹp']
 }
];

export function AffiliateManagement() {
 const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Quản lý KOL/KOC & Affiliate</h1>
 <p className="text-sm text-[#6B7280] mt-1">Quản lý mạng lưới KOL/KOC, Publisher. Booking, thiết lập hoa hồng và Đồng bộ Flash Sale.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm text-slate-800">
 <Share2 className="w-4 h-4 text-emerald-500" />
 Đồng bộ Mua Chung
 </button>
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Link2 className="w-4 h-4" />
 URL Tracking
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <UserPlus className="w-4 h-4" />
 Booking KOL mới
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Tổng Publisher/KOL</p>
 <div className="text-2xl font-bold text-[#111827]">1,240</div>
 <div className="mt-1 text-[10px] text-[#10B981] font-medium">+12 người mới tuần này</div>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Tổng hoa hồng đã chi</p>
 <div className="text-2xl font-bold text-[#111827]">{formatCurrency(2450000000)}</div>
 <div className="mt-1 text-[10px] text-[#6B7280]">Chiếm 8.2% tổng GMV sàn</div>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">CTR Trung bình</p>
 <div className="text-2xl font-bold text-[#2563EB]">6.8%</div>
 <div className="mt-1 text-[10px] text-[#2563EB] font-medium">+1.2% so với tháng trước</div>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Đơn hàng Affiliate</p>
 <div className="text-2xl font-bold text-[#111827]">42,850</div>
 <div className="mt-1 text-[10px] text-[#111827]">24% tổng lượng đơn sàn</div>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Tìm KOL, Publisher, Mã Tracking..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-80"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Lọc theo loại
 </button>
 </div>
 <div className="flex border border-slate-300 rounded-lg overflow-hidden bg-white">
 <button 
 onClick={() => setActiveTab('all')}
 className={cn("px-4 py-2 text-xs font-semibold", activeTab === 'all' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-[#4B5563]")}
 >Tất cả</button>
 <button 
 onClick={() => setActiveTab('pending')}
 className={cn("px-4 py-2 text-xs font-semibold border-l border-slate-300", activeTab === 'pending' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-[#4B5563]")}
 >Chờ duyệt hồ sơ</button>
 </div>
 </div>

 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">KOL / Publisher / Agent</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nền tảng & Followers</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Hiệu quả (Orders/CTR)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Hoa hồng & Booking</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Hành động</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {MOCK_AFFILIATES.filter(a => activeTab === 'all' || a.status === 'pending').map((affiliate) => (
 <tr key={affiliate.id} className="hover:bg-[#F9FAFB] group transition-colors">
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-[#2563EB] font-bold text-xs border border-slate-300 shrink-0">
 {affiliate.name.charAt(0)}
 </div>
 <div>
 <p className="text-sm font-semibold text-[#111827]">{affiliate.name}</p>
 <div className="flex items-center gap-1 mt-0.5">
 <p className="text-[10px] text-[#6B7280] uppercase tracking-tight">{affiliate.type}</p>
 {affiliate.categoryTags && affiliate.categoryTags.length > 0 && (
 <span className="text-[10px] text-orange-700 bg-slate-100 px-1 rounded-sm ml-1">{affiliate.categoryTags[0]}</span>
 )}
 </div>
 </div>
 </div>
 </td>
 <td className="px-3 py-2.5">
 {affiliate.type === 'kol' ? (
 <div className="space-y-1">
 <div className="flex items-center gap-1">
 <Video className="w-3.5 h-3.5 text-slate-500" />
 <span className="text-xs text-slate-800 capitalize">{affiliate.platforms?.join(', ')}</span>
 </div>
 <p className="text-[11px] font-bold text-slate-900">
 {(affiliate.followers || 0) >= 1000000 
 ? `${((affiliate.followers || 0)/1000000).toFixed(1)}M` 
 : `${((affiliate.followers || 0)/1000).toFixed(0)}K`} followers
 </p>
 </div>
 ) : (
 <span className="text-xs text-slate-500 italic">Mạng lưới / Đại lý</span>
 )}
 </td>
 <td className="px-3 py-2.5">
 <div className="space-y-1">
 <p className="text-xs font-bold text-[#111827]">{affiliate.ordersCount} đơn hàng</p>
 <p className="text-[10px] text-[#6B7280]">CTR: {affiliate.clickThroughRate}%</p>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <p className="text-sm font-bold text-[#10B981]">{formatCurrency(affiliate.commissionEarned)}</p>
 {affiliate.bookingPrice && (
 <p className="text-[10px] text-slate-600 mt-1">Booking: {formatCurrency(affiliate.bookingPrice)}</p>
 )}
 </td>
 <td className="px-3 py-2.5">
 <div className="flex justify-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold",
 affiliate.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-orange-700"
 )}>
 {affiliate.status === 'active' ? 'HOẠT ĐỘNG' : 'ĐANG DUYỆT'}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 {affiliate.status === 'pending' ? (
 <button className="px-3 py-1.5 bg-[#2563EB] text-[#FAF9F5] text-[11px] font-bold rounded-md hover:bg-slate-800 shadow-sm">Duyệt KOL</button>
 ) : (
 <button className="text-xs font-semibold text-[#6B7280] hover:text-[#111827] p-2">Thiết lập & Book</button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex items-center gap-3 mb-6">
 <div className="p-2 bg-slate-100 text-orange-700 rounded-lg">
 <DollarSign className="w-5 h-5" />
 </div>
 <h3 className="font-semibold text-[#111827]">Thiết lập Hoa hồng Affiliate theo ngành hàng</h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {[
 { cat: 'Thời trang', rate: '8%' },
 { cat: 'Điện tử', rate: '3%' },
 { cat: 'Gia dụng', rate: '5%' }
 ].map((item) => (
 <div key={item.cat} className="p-4 bg-[#F9FAFB] rounded-lg border border-[#F3F4F6] flex justify-between items-center group hover:border-[#2563EB] transition-all cursor-pointer">
 <span className="text-sm font-medium text-[#4B5563]">{item.cat}</span>
 <div className="flex items-center gap-2">
 <span className="text-lg font-bold text-[#111827]">{item.rate}</span>
 <ArrowUpRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#2563EB]" />
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}

