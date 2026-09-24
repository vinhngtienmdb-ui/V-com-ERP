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
  const [affiliates, setAffiliates] = useState<Affiliate[]>(MOCK_AFFILIATES);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [selectedKolForUrl, setSelectedKolForUrl] = useState<string>('AFL-001');
  const [targetProduct, setTargetProduct] = useState<string>('1073131895');
  const [copied, setCopied] = useState(false);

  const generatedUrl = `https://vcomm.vn/product/${targetProduct}?utm_source=koc&utm_medium=affiliate&utm_campaign=flashsale_2026&aff_id=${selectedKolForUrl}`;

  const handleSettleCommission = (id: string, name: string, amount: number) => {
    alert(`✅ Đã tất toán số dư hoa hồng ${formatCurrency(amount)} sau thời hạn tạm giữ 14 ngày (Escrow) vào Ví tiền mặt của ${name}!\nChứng từ hạch toán Nợ 641 / Có 3388 đã đồng bộ lên sổ cái.`);
    setAffiliates(prev => prev.map(a => a.id === id ? { ...a, commissionEarned: 0 } : a));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in- duration-500">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
              VComm Affiliate Network
            </span>
            <span className="text-xs text-slate-500 font-medium">Mạng Lưới Tiếp Thị Liên Kết & KOC</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Quản Lý KOL / KOC & Tiếp Thị Liên Kết</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Quản trị mạng lưới Nhà sáng tạo nội dung, sinh mã link UTM tracking, đối soát hoa hồng sau 14 ngày và thanh toán ví KOC.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setShowUrlModal(true)}
            className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Link2 className="w-4 h-4 text-blue-600" />
            Tạo Link UTM Tracking
          </button>
          <button 
            onClick={() => alert('Mạng lưới Tiếp thị Mua chung (Group Buy) đã đồng bộ 4,200 mã giảm giá!')}
            className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-emerald-600" />
            Đồng Bộ Mua Chung
          </button>
          <button 
            onClick={() => alert('Đang mở cổng Booking KOL độc quyền VComm...')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Booking KOL Mới
          </button>
        </div>
      </div>

      {/* URL Tracking Generator Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in zoom-in-95">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Trình Sinh Link UTM Tracking Cá Nhân Hóa</h3>
              </div>
              <button onClick={() => setShowUrlModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn KOC / Publisher nhận hoa hồng</label>
                <select 
                  value={selectedKolForUrl} 
                  onChange={(e) => setSelectedKolForUrl(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl bg-white font-medium"
                >
                  {affiliates.map(a => (
                    <option key={a.id} value={a.id}>{a.name} ({a.id}) - {a.type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã Sản phẩm / Trang đích</label>
                <input 
                  type="text" 
                  value={targetProduct} 
                  onChange={(e) => setTargetProduct(e.target.value)}
                  placeholder="ID sản phẩm (VD: 1073131895)..." 
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs"
                />
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="font-bold text-blue-900 mb-1">Liên kết tiếp thị tạo ra (Auto-tagged):</p>
                <p className="font-mono text-[11px] text-blue-700 break-all bg-white p-2 rounded border border-blue-200">
                  {generatedUrl}
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2.5">
              <button onClick={() => setShowUrlModal(false)} className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-xl">Đóng</button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
              >
                {copied ? '✓ Đã sao chép Link' : 'Sao chép Link Tiếp Thị'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <DraggableGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" columns={4} gap={16}>
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Publisher / KOL</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">1,240 đối tác</div>
          <div className="mt-2 text-xs font-semibold text-emerald-600">
            +12 đối tác mới trong tuần
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hoa Hồng Đã Chi</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(2450000000)}</div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            Chiếm 8.2% tổng GMV sàn
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">CTR Chuyển Đổi TB</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Link2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 tracking-tight">6.8%</div>
          <div className="mt-2 text-xs font-semibold text-emerald-600">
            +1.2% so với tháng trước
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đơn Hàng Tiếp Thị</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">42,850 đơn</div>
          <div className="mt-2 text-xs font-medium text-slate-500">
            Chiếm 24% tổng sản lượng đơn hàng sàn
          </div>
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
 <table className="w-full text-left border-collapse whitespace-nowrap">
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
            {affiliates.filter(a => activeTab === 'all' || a.status === 'pending').map((affiliate) => (
              <tr key={affiliate.id} className="hover:bg-[#F9FAFB] group transition-colors">
                <td className="px-6 py-4">
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
                <td className="px-6 py-4">
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
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#111827]">{affiliate.ordersCount} đơn hàng</p>
                    <p className="text-[10px] text-[#6B7280]">CTR: {affiliate.clickThroughRate}%</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <p className="text-sm font-bold text-[#10B981]">{formatCurrency(affiliate.commissionEarned)}</p>
                  {affiliate.commissionEarned > 0 ? (
                    <p className="text-[9px] text-amber-600 font-bold mt-0.5">Đã qua 14 ngày Escrow</p>
                  ) : (
                    <p className="text-[9px] text-slate-400 mt-0.5">Đã tất toán ví</p>
                  )}
                </td>
                <td className="px-6 py-4">
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
                  <div className="flex items-center justify-end gap-2">
                    {affiliate.commissionEarned > 0 && (
                      <button 
                        onClick={() => handleSettleCommission(affiliate.id, affiliate.name, affiliate.commissionEarned)}
                        className="px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg hover:bg-emerald-700 shadow-2xs"
                      >
                        ⚡ Tất toán ví
                      </button>
                    )}
                    {affiliate.status === 'pending' ? (
                      <button 
                        onClick={() => setAffiliates(prev => prev.map(a => a.id === affiliate.id ? { ...a, status: 'active' } : a))}
                        className="px-3 py-1 bg-[#2563EB] text-[#FAF9F5] text-[11px] font-bold rounded-md hover:bg-slate-800 shadow-sm"
                      >
                        Duyệt KOL
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          setSelectedKolForUrl(affiliate.id);
                          setShowUrlModal(true);
                        }}
                        className="text-xs font-semibold text-[#2563EB] hover:underline p-1"
                      >
                        Lấy Link
                      </button>
                    )}
                  </div>
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
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
