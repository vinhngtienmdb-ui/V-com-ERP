import React, { useState } from 'react';
import { 
  Megaphone, 
  Layout, 
  TrendingUp, 
  ArrowUpRight, 
  Calendar,
  Search,
  Filter,
  BarChart2,
  X,
  Share2,
  Instagram,
  Facebook,
  Twitter,
  Plus,
  Music2,
  Smartphone,
  MessageSquare,
  Repeat,
  Link2,
  Globe,
  Settings2,
  Cpu
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Campaign } from '../types/erp';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'CMP-004',
    name: 'Chiến dịch Khai Xuân Y2024',
    type: 'voucher',
    status: 'active',
    budget: 200000000,
    spent: 85000000,
    gmvGenerated: 900000000,
    roi: 10.5,
    startDate: '01/02/2024',
    endDate: '28/02/2024'
  },
  {
    id: 'CMP-002',
    name: 'Voucher Siêu Sale 15/3',
    type: 'voucher',
    status: 'upcoming',
    budget: 20000000,
    spent: 0,
    gmvGenerated: 0,
    roi: 0,
    startDate: '15/03/2024',
    endDate: '15/03/2024'
  }
];

const SOCIAL_ACCOUNTS = [
  { id: 'fb', platform: 'Facebook', name: 'VComm Official', status: 'connected', followers: '150k', color: 'bg-blue-600', icon: Facebook },
  { id: 'tt', platform: 'TikTok', name: '@vcomm_shop_vn', status: 'connected', followers: '850k', color: 'bg-slate-950', icon: Music2 },
  { id: 'ig', platform: 'Instagram', name: 'vcomm.lifestyle', status: 'connected', followers: '45k', color: 'bg-pink-600', icon: Instagram },
  { id: 'x', platform: 'Twitter/X', name: 'vcomm_global', status: 'disconnected', followers: '0', color: 'bg-slate-800', icon: Twitter },
];

const MARKETING_MODULE_GROUPS = [
  {
    title: 'Chiến dịch & Tăng trưởng',
    items: [
      { id: 'campaigns', label: 'Chiến dịch (Campaigns)', desc: 'Setup voucher, khuyến mãi sàn.', icon: Megaphone, color: 'blue' },
      { id: 'vouchers', label: 'Mã giảm giá', desc: 'Quản lý kho voucher và điều kiện.', icon: Calendar, color: 'indigo' },
      { id: 'affiliate', label: 'Affiliate & KOC', desc: 'Mạng lưới đối tác lan tỏa.', icon: Share2, color: 'emerald' },
    ]
  },
  {
    title: 'Đa kênh & Tự động hóa',
    items: [
      { id: 'omnichannel', label: 'Social Sync', desc: 'Đồng bộ Facebook, TikTok, IG.', icon: Facebook, color: 'blue' },
      { id: 'ads', label: 'Ads Manager', desc: 'Quét tracking và tối ưu ngân sách.', icon: TrendingUp, color: 'purple' },
      { id: 'automation', label: 'Marketing Auto', desc: 'Kịch bản chăm sóc tự động.', icon: Cpu, color: 'rose' },
    ]
  }
];

function getColorClasses(color: string) {
  switch (color) {
    case 'blue': return 'bg-blue-50 text-blue-600';
    case 'orange': return 'bg-orange-50 text-orange-600';
    case 'indigo': return 'bg-indigo-50 text-indigo-600';
    case 'purple': return 'bg-purple-50 text-purple-600';
    case 'emerald': return 'bg-emerald-50 text-emerald-600';
    case 'rose': return 'bg-rose-50 text-rose-600';
    default: return 'bg-slate-50 text-slate-600';
  }
}

export function Marketing() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'omnichannel' | 'ads' | 'vouchers' | string>('overview');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <div className="flex items-center gap-2 mb-1">
             {activeTab !== 'overview' && (
                <button onClick={() => setActiveTab('overview')} className="p-1 hover:bg-slate-100 rounded-md transition-colors mr-1">
                   <ArrowUpRight className="w-4 h-4 rotate-225" />
                </button>
             )}
             <h1 className="text-2xl font-bold text-[#111827]">Marketing & Omnichannel</h1>
          </div>
          <p className="text-sm text-[#6B7280]">Kết nối đa kênh (FB, TT, IG), Quản lý chiến dịch & Tự động hóa tiếp thị.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-500" />
            AI Content Maker
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2563EB] text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Tạo chiến dịch mới
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-8">
           {/* Stats Cards */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all">
                 <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">GMV từ Marketing</span>
                    <BarChart2 className="w-4 h-4 text-emerald-600" />
                 </div>
                 <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-[#111827]">{formatCurrency(900000000)}</span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">ROI 10.5</span>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all">
                 <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Tổng Follower (Multi)</span>
                    <Smartphone className="w-4 h-4 text-blue-600" />
                 </div>
                 <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-[#111827]">1.2M</span>
                    <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">+15k/day</span>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all">
                 <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Chi phí đã tiêu</span>
                    <TrendingUp className="w-4 h-4 text-orange-600" />
                 </div>
                 <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-[#111827]">{formatCurrency(85000000)}</span>
                    <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">42% Budget</span>
                 </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all">
                 <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Campaign Active</span>
                    <Megaphone className="w-4 h-4 text-indigo-600" />
                 </div>
                 <div className="flex items-end justify-between">
                    <span className="text-2xl font-black text-[#111827]">08</span>
                    <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded">Hot Sale</span>
                 </div>
              </div>
           </div>

           {/* Matrix Grid Layout */}
           <div className="space-y-6">
              {MARKETING_MODULE_GROUPS.map((group, gIdx) => (
                <div key={gIdx} className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 px-1">
                    <div className="w-1 h-4 bg-[#2563EB] rounded-full" />
                    {group.title}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                    {group.items.map((mod) => (
                       <div 
                         key={mod.id}
                         onClick={() => setActiveTab(mod.id as any)}
                         className="group bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm hover:shadow-lg hover:border-[#2563EB]/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
                       >
                          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                             <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
                          </div>
                          <div className={cn("w-12 h-12 rounded relative z-10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-white transition-all shadow-sm", getColorClasses(mod.color))}>
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

      {/* Tabs Menu */}
      {activeTab !== 'overview' && (
        <>
          <div className="flex border-b border-slate-200 gap-8">
            {[
              { id: 'campaigns', label: 'Chiến dịch (Campaigns)', icon: Megaphone },
              { id: 'vouchers', label: 'Mã giảm giá (Vouchers)', icon: Calendar },
              { id: 'omnichannel', label: 'Kết nối Đa kênh (Social Sync)', icon: Share2 },
              { id: 'ads', label: 'Quản lý Ads & Tracking', icon: TrendingUp },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "pb-4 text-sm font-bold transition-all relative flex items-center gap-2",
                  activeTab === tab.id ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTabMarketing" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
        {activeTab === 'omnichannel' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Social Accounts Area */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div>
                     <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <Link2 className="w-5 h-5 text-blue-500" /> Trạng thái Kết nối Tài khoản Social
                     </h2>
                     <p className="text-xs text-slate-500 mt-0.5">Tự động đồng bộ nội dung & Trò chuyện tập trung từ các nền tảng.</p>
                  </div>
                  <button className="text-xs font-bold bg-[#111827] text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2">
                     <Plus className="w-3.5 h-3.5" /> Thêm Tài khoản
                  </button>
               </div>

               <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                     {SOCIAL_ACCOUNTS.map(acc => (
                        <div key={acc.id} className="p-4 rounded-lg border border-slate-100 bg-white hover:border-blue-200 transition-all shadow-sm relative group">
                           <div className="flex items-center gap-4 mb-4">
                              <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shadow-lg", acc.color)}>
                                 <acc.icon className="w-6 h-6 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="font-bold text-slate-900 truncate text-sm">{acc.name}</p>
                                 <p className="text-[10px] text-slate-500 uppercase tracking-widest">{acc.platform}</p>
                              </div>
                           </div>
                           
                           <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                              <div className="flex flex-col">
                                 <span className="text-[10px] font-bold text-slate-400 uppercase">Followers</span>
                                 <span className="text-sm font-bold text-slate-900">{acc.followers}</span>
                              </div>
                              <div className={cn(
                                 "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
                                 acc.status === 'connected' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-400"
                              )}>
                                 <div className={cn("w-1.5 h-1.5 rounded-full", acc.status === 'connected' ? "bg-emerald-500" : "bg-slate-300")} />
                                 {acc.status === 'connected' ? 'LIVE' : 'LINK'}
                              </div>
                           </div>

                           <button className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <Settings2 className="w-4 h-4 text-slate-400" />
                           </button>
                        </div>
                     ))}
                  </div>
               </div>

               <div className="p-6 bg-blue-50/30 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex gap-4">
                     <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-blue-100 flex items-center justify-center text-blue-600">
                        <MessageSquare className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-slate-800">Omni Chat (Inbox tập trung)</h4>
                        <p className="text-xs text-slate-500 mt-1">Trả lời bình luận, tin nhắn từ FB/IG/TT tại một nơi duy nhất.</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-blue-100 flex items-center justify-center text-blue-600">
                        <Repeat className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-slate-800">Auto Content Sync</h4>
                        <p className="text-xs text-slate-500 mt-1">Hẹn giờ đăng bài đồng thời lên tất cả các nền tảng đã kết nối.</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-blue-100 flex items-center justify-center text-blue-600">
                        <Smartphone className="w-5 h-5" />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold text-slate-800">Shoppable Video</h4>
                        <p className="text-xs text-slate-500 mt-1">Gắn tag sản phẩm vào video TikTok/Instagram Reels tự động.</p>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'vouchers' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
           <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="font-bold text-slate-800 text-sm">Danh sách mã giảm giá</h3>
                 <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Tạo mã giảm giá
                 </button>
              </div>
              <table className="w-full text-left text-sm">
                 <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
                       <th className="px-6 py-3">Tên chiến dịch</th>
                       <th className="px-6 py-3">Loại mã</th>
                       <th className="px-6 py-3">Mức giảm</th>
                       <th className="px-6 py-3">Áp dụng cho</th>
                       <th className="px-6 py-3 text-right">Thao tác</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                       <td className="px-6 py-4 font-bold text-slate-900">Flash Sale 15/3</td>
                       <td className="px-6 py-4">Giảm %</td>
                       <td className="px-6 py-4">10%</td>
                       <td className="px-6 py-4 text-xs text-slate-600">Điện tử, Thời trang</td>
                       <td className="px-6 py-4 text-right">
                          <button className="text-xs font-bold text-slate-500 hover:text-blue-600">Sửa</button>
                       </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                       <td className="px-6 py-4 font-bold text-slate-900">Đơn hàng đầu tiên</td>
                       <td className="px-6 py-4">Miễn phí vận chuyển</td>
                       <td className="px-6 py-4">Tối đa 30k</td>
                       <td className="px-6 py-4 text-xs text-slate-600">Tất cả sản phẩm</td>
                       <td className="px-6 py-4 text-right">
                          <button className="text-xs font-bold text-slate-500 hover:text-blue-600">Sửa</button>
                       </td>
                    </tr>
                 </tbody>
              </table>
           </div>
          </motion.div>
        )}

        {activeTab === 'campaigns' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
              <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input 
                      type="text" 
                      placeholder="Tìm chiến dịch Marketing, Voucher..." 
                      className="bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
                    />
                  </div>
                  <button className="bg-white border border-[#E5E7EB] px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
                     <Filter className="w-4 h-4" /> Lọc theo loại
                  </button>
                </div>
                <button className="text-xs font-semibold text-[#2563EB] flex items-center gap-2 hover:underline">
                   Báo cáo hiệu suất <BarChart2 className="w-3 h-3" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-[10px]">Chiến dịch / Voucher</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-[10px]">Thời gian chạy</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right text-[10px]">Ngân sách / Đã dùng</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center text-[10px]">Chỉ số ROAS</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-[10px]">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {MOCK_CAMPAIGNS.map((campaign) => (
                      <tr key={campaign.id} className="hover:bg-[#F9FAFB] group transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                                <Megaphone className="w-5 h-5" />
                             </div>
                             <div>
                                <p className="text-sm font-semibold text-[#111827]">{campaign.name}</p>
                                <p className="text-[10px] text-[#6B7280] uppercase tracking-tight">{campaign.type.replace('_', ' ')}</p>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
                              <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
                              {campaign.startDate} - {campaign.endDate}
                           </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className="text-sm font-bold text-[#111827]">{formatCurrency(campaign.budget)}</p>
                          <p className="text-[10px] text-[#6B7280]">Chi: {formatCurrency(campaign.spent)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center">
                             <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-emerald-600">{campaign.roi > 0 ? campaign.roi + 'x' : '--'}</span>
                                {campaign.roi > 0 && <ArrowUpRight className="w-3 h-3 text-[#10B981]" />}
                             </div>
                             <p className="text-[10px] text-[#6B7280]">Doanh thu: {formatCurrency(campaign.gmvGenerated)}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold",
                            campaign.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                            campaign.status === 'upcoming' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-400"
                          )}>
                            {campaign.status === 'active' ? 'ĐANG CHẠY' : 
                             campaign.status === 'upcoming' ? 'SẮP DIỄN RA' : 'ĐÃ KẾT THÚC'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
    )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2 text-blue-600">
                <Megaphone className="w-5 h-5 fill-current" />
                <h2 className="text-lg font-bold text-[#111827]">Tạo chiến dịch Marketing</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tên chiến dịch</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Kênh mục tiêu</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white outline-none">
                    <option value="fb">Facebook Fanpage</option>
                    <option value="tt">TikTok Shop</option>
                    <option value="ig">Instagram</option>
                    <option value="multi">Tất cả kênh (Omni)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ngân sách (VNĐ)</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none" placeholder="0" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ngày bắt đầu</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none" required />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Ngày kết thúc</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm outline-none" required />
                </div>
              </div>
              <button className="w-full bg-[#2563EB] text-white py-3 rounded-lg font-bold mt-6 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all">
                 Khởi tạo chiến dịch Đa kênh
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
