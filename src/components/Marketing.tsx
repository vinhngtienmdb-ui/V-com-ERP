import React, { useState } from 'react';
import { 
  Megaphone, 
  Zap, 
  Ticket, 
  Layout, 
  Users2, 
  TrendingUp, 
  ArrowUpRight, 
  Calendar,
  DollarSign,
  Search,
  Filter,
  BarChart2,
  X
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Campaign } from '../types/erp';

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'CMP-001',
    name: 'Flash Sale Hè Rực Rỡ',
    type: 'flash_sale',
    status: 'active',
    budget: 50000000,
    spent: 12000000,
    gmvGenerated: 250000000,
    roi: 20.8,
    startDate: '2024-03-01',
    endDate: '2024-03-31'
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
    startDate: '2024-03-15',
    endDate: '2024-03-15'
  },
  {
    id: 'CMP-003',
    name: 'Mua Nhóm: iPhone 15 Pro Max',
    type: 'group_buy',
    status: 'active',
    budget: 100000000,
    spent: 45000000,
    gmvGenerated: 1200000000,
    roi: 26.6,
    startDate: '2024-03-01',
    endDate: '2024-03-20'
  }
];

export function Marketing() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Trung tâm Marketing & Voucher</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý chiến dịch Flash Sale, Mua nhóm và phân tích hiệu quả ROI/P&L.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Thiết kế Landing Page
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm"
          >
            Tạo chiến dịch mới
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-[#111827]">Tạo chiến dịch mới</h2>
              <button onClick={() => setIsModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên chiến dịch</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Loại</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2">
                    <option value="flash_sale">Flash Sale</option>
                    <option value="voucher">Voucher</option>
                    <option value="group_buy">Mua nhóm</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngân sách (VNĐ)</label>
                  <input type="number" className="w-full border border-gray-300 rounded-lg p-2" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày bắt đầu</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg p-2" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày kết thúc</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg p-2" required />
                </div>
              </div>
              <button className="w-full bg-[#2563EB] text-white py-2 rounded-lg font-bold mt-4 hover:bg-blue-700">Tạo chiến dịch</button>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
             </div>
             <span className="text-[10px] text-[#10B981] font-bold">+15% ROI</span>
          </div>
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Tổng GMV Chiến dịch</p>
          <div className="text-2xl font-bold text-[#111827]">{formatCurrency(1450000000)}</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Zap className="w-5 h-5" />
             </div>
             <span className="text-[10px] text-[#2563EB] font-bold">2 LIVE</span>
          </div>
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Flash Sale Đang chạy</p>
          <div className="text-2xl font-bold text-[#111827]">03</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Ticket className="w-5 h-5" />
             </div>
             <span className="text-[10px] text-[#10B981] font-bold">94% Used</span>
          </div>
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Voucher đã phát hành</p>
          <div className="text-2xl font-bold text-[#111827]">15,400</div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Users2 className="w-5 h-5" />
             </div>
             <span className="text-[10px] text-purple-600 font-bold">Hot Deal</span>
          </div>
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Đơn Mua Nhóm (Group Buy)</p>
          <div className="text-2xl font-bold text-[#111827]">842</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Tìm chiến dịch, voucher..." 
                className="bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
              />
            </div>
            <button className="bg-white border border-[#E5E7EB] px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
               <Filter className="w-4 h-4" /> Lọc theo loại
            </button>
          </div>
          <button className="text-xs font-semibold text-[#2563EB] flex items-center gap-2 hover:underline">
             Báo cáo P&L chi tiết <BarChart2 className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Chiến dịch / Landing Page</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Thời gian</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Ngân sách / Đã chi</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Hiệu quả (ROI)</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {MOCK_CAMPAIGNS.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-[#F9FAFB] group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "p-2 rounded-lg",
                         campaign.type === 'flash_sale' ? "bg-orange-50 text-orange-600" :
                         campaign.type === 'group_buy' ? "bg-purple-50 text-purple-600" :
                         campaign.type === 'voucher' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                       )}>
                          {campaign.type === 'flash_sale' && <Zap className="w-4 h-4" />}
                          {campaign.type === 'group_buy' && <Users2 className="w-4 h-4" />}
                          {campaign.type === 'voucher' && <Ticket className="w-4 h-4" />}
                          {campaign.type === 'landing_page' && <Layout className="w-4 h-4" />}
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
                    <p className="text-[10px] text-[#6B7280]">Đã dùng: {formatCurrency(campaign.spent)}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                       <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#111827]">{campaign.roi > 0 ? campaign.roi + 'x' : '--'}</span>
                          <ArrowUpRight className="w-3 h-3 text-[#10B981]" />
                       </div>
                       <p className="text-[10px] text-[#6B7280]">GMV: {formatCurrency(campaign.gmvGenerated)}</p>
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

      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-lg p-8 text-white flex justify-between items-center shadow-xl shadow-purple-500/20">
         <div className="space-y-2">
            <h3 className="text-xl font-semibold flex items-center gap-2 italic">
               <TrendingUp className="w-6 h-6" /> Phân tích P&L Chiến dịch thông minh
            </h3>
            <p className="text-purple-100 text-sm max-w-xl">Hệ thống tự động trừ chi phí Voucher, phí Affiliate, phí hoa hồng Seller và chi phí vận hành sàn để tính Margin thực tế của mỗi Landing Page.</p>
         </div>
         <button className="px-6 py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-all">Xem Báo cáo P&L</button>
      </div>
    </div>
  );
}
