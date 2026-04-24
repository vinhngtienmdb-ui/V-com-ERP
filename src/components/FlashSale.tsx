import React, { useState } from 'react';
import { 
  Zap, 
  Users2, 
  TrendingUp, 
  ArrowUpRight, 
  Calendar,
  Search,
  Filter,
  BarChart2,
  X,
  Plus,
  Trash2,
  Calculator,
  Package
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Campaign } from '../types/erp';
import { MOCK_AFFILIATES } from './Affiliate';

interface FlashSaleCampaign extends Campaign {
  requiredParticipants?: number;
  currentParticipants?: number;
  kolName?: string;
  baseDiscount?: number;
  maxDiscount?: number;
}

const MOCK_FLASH_SALES: FlashSaleCampaign[] = [
  {
    id: 'FS-001',
    name: 'Deal Chớp Nhoáng 12H',
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
    id: 'GB-001',
    name: 'Mua Chung Sập Giá: Tủ Lạnh Samsung',
    type: 'group_buy',
    status: 'active',
    budget: 100000000,
    spent: 45000000,
    gmvGenerated: 1200000000,
    roi: 26.6,
    startDate: '2024-03-01',
    endDate: '2024-03-20',
    requiredParticipants: 1000,
    currentParticipants: 842,
    kolName: 'KOC Hằng Túi',
    baseDiscount: 10,
    maxDiscount: 40
  }
];

const MOCK_PRODUCTS = [
  { id: 'P01', name: 'Tủ Lạnh Samsung Inverter 300L', costPrice: 8000000, price: 12000000 },
  { id: 'P02', name: 'iPhone 15 Pro Max 256GB', costPrice: 24000000, price: 29000000 },
  { id: 'P03', name: 'Nồi chiên không dầu Philips', costPrice: 1500000, price: 3000000 },
];

export function FlashSale() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [tiers, setTiers] = useState([{ quantity: 50, discount: 5 }, { quantity: 500, discount: 10 }]);
  const [distributorDiscount, setDistributorDiscount] = useState(10);
  const [agentDiscount, setAgentDiscount] = useState(5);
  const [kolCommission, setKolCommission] = useState(5);

  const selectedProduct = MOCK_PRODUCTS.find(p => p.id === selectedProductId);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Flash Sale & Mua Chung</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý giảm giá, chiến dịch Flash Sale và mô hình "Mua chung sập giá" qua KOL/KOC.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Tạo chiến dịch mới
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
               <div className="flex items-center gap-2 text-rose-600">
                 <Zap className="w-5 h-5 fill-current" />
                 <h2 className="text-lg font-bold text-[#111827]">Tạo chiến dịch Mua Chung Sập Giá</h2>
               </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                 <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar">
              <form className="space-y-6">
                {/* General Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tên chiến dịch</label>
                    <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" placeholder="VD: Mua chung Tủ Lạnh..." required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">KOL/KOC Khởi tạo</label>
                    <select className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white" required>
                      <option value="">-- Chọn KOL/KOC --</option>
                      {MOCK_AFFILIATES.filter(a => a.type === 'kol').map(kol => (
                         <option key={kol.id} value={kol.name}>{kol.name} ({kol.followers ? `${(kol.followers/1000).toFixed(0)}K followers` : ''})</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Sản phẩm triển khai</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white" 
                      required
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                    >
                      <option value="">-- Chọn sản phẩm --</option>
                      {MOCK_PRODUCTS.map(p => (
                         <option key={p.id} value={p.id}>{p.name} - Giá bán: {formatCurrency(p.price)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bắt đầu</label>
                    <input type="datetime-local" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" required />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">Kết thúc</label>
                    <input type="datetime-local" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm" required />
                  </div>
                </div>

                {/* Tiers Configuration */}
                <div className="bg-slate-50 p-5 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Các mốc giảm giá (Multi-tier)</h4>
                      <p className="text-xs text-slate-500">Người mua sẽ được hưởng chiết khấu tương ứng với mốc số lượng mua chung đạt được.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setTiers([...tiers, { quantity: 1000, discount: 15 }])}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 flex items-center gap-1.5 hover:bg-slate-100"
                    >
                       <Plus className="w-3.5 h-3.5" /> Thêm mốc mới
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {tiers.map((tier, index) => (
                      <div key={index} className="flex items-center gap-4 bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex-1">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Mốc đơn hàng đạt</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={tier.quantity} 
                              onChange={(e) => {
                                const newTiers = [...tiers];
                                newTiers[index].quantity = Number(e.target.value);
                                setTiers(newTiers);
                              }}
                              className="w-full font-mono text-sm border border-slate-200 rounded p-2 focus:border-blue-500 outline-none" 
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Giảm giá (%)</label>
                          <div className="relative">
                            <input 
                              type="number" 
                              value={tier.discount} 
                              onChange={(e) => {
                                const newTiers = [...tiers];
                                newTiers[index].discount = Number(e.target.value);
                                setTiers(newTiers);
                              }}
                              className="w-full font-mono text-sm border border-slate-200 rounded p-2 pr-8 focus:border-blue-500 outline-none text-rose-600 font-bold" 
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">%</span>
                          </div>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setTiers(tiers.filter((_, i) => i !== index))}
                          className="mt-5 p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PnL Parameters */}
                <div className="bg-white p-5 rounded-lg border border-slate-200">
                   <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2"><Calculator className="w-4 h-4 text-blue-500" /> Bảng tính Lợi nhuận (P&L)</h4>
                   
                   <div className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-slate-100">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">C/K Nhà cung cấp (%)</label>
                        <input type="number" value={distributorDiscount} onChange={(e) => setDistributorDiscount(Number(e.target.value))} className="w-full border border-gray-300 rounded-md p-2 text-sm bg-slate-50" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">C/K Đại lý (%)</label>
                        <input type="number" value={agentDiscount} onChange={(e) => setAgentDiscount(Number(e.target.value))} className="w-full border border-gray-300 rounded-md p-2 text-sm bg-slate-50" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 mb-1">Hoa hồng KOL (%)</label>
                        <input type="number" value={kolCommission} onChange={(e) => setKolCommission(Number(e.target.value))} className="w-full border border-gray-300 rounded-md p-2 text-sm bg-slate-50" />
                      </div>
                   </div>

                   {/* PnL Projection Table */}
                   {selectedProduct ? (
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50 text-[10px] uppercase font-black text-slate-500 tracking-widest">
                               <th className="p-3 rounded-tl-lg">Mốc đơn</th>
                               <th className="p-3">Giá bán/SP</th>
                               <th className="p-3 text-right">Lợi nhuận/SP</th>
                               <th className="p-3 text-right rounded-tr-lg">Tổng LN (Dự kiến)</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm">
                            {tiers.sort((a, b) => a.quantity - b.quantity).map((tier, idx) => {
                               const salePrice = selectedProduct.price * (1 - tier.discount / 100);
                               // Deducting discounts based on SalePrice
                               const netRevenue = salePrice * (1 - distributorDiscount / 100 - agentDiscount / 100 - kolCommission / 100);
                               const profitPerItem = netRevenue - selectedProduct.costPrice;
                               const totalProfit = profitPerItem * tier.quantity;

                               return (
                                 <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50">
                                   <td className="p-3 font-bold text-slate-800">{tier.quantity} x {tier.discount}%</td>
                                   <td className="p-3 font-mono text-blue-600">{formatCurrency(salePrice)}</td>
                                   <td className={cn("p-3 font-mono text-right font-bold", profitPerItem > 0 ? "text-emerald-600" : "text-rose-600")}>
                                      {formatCurrency(profitPerItem)}
                                   </td>
                                   <td className={cn("p-3 font-mono text-right font-black", totalProfit > 0 ? "text-emerald-600" : "text-rose-600")}>
                                      {formatCurrency(totalProfit)}
                                   </td>
                                 </tr>
                               );
                            })}
                          </tbody>
                        </table>
                        <p className="text-[10px] text-slate-400 mt-2 italic">* Lợi nhuận = Giá sau KM - (C/K NCC + C/K Đại lý + HH KOL) - Giá vốn</p>
                     </div>
                   ) : (
                     <div className="text-center py-6 text-sm text-slate-500 bg-slate-50 rounded-lg flex flex-col items-center gap-2">
                        <Package className="w-8 h-8 text-slate-300" />
                        Vui lòng chọn Sản phẩm triển khai ở trên để xem P&L.
                     </div>
                   )}
                </div>
              </form>
            </div>
            
            <div className="mt-6 pt-4 border-t border-slate-100 shrink-0">
               <button className="w-full bg-rose-600 text-white p-3 rounded-lg font-bold shadow-lg shadow-rose-500/25 hover:bg-rose-700 transition flex items-center justify-center gap-2">
                  <Zap className="w-5 h-5 fill-current" /> Khởi chạy Mua Chung Sập Giá
               </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
                <Users2 className="w-5 h-5" />
             </div>
             <span className="text-[10px] text-rose-600 font-bold">HOT NEW</span>
          </div>
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Trưởng nhóm KOL tham gia</p>
          <div className="text-2xl font-bold text-[#111827]">24</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                <Zap className="w-5 h-5" />
             </div>
             <span className="text-[10px] text-[#2563EB] font-bold">Live Deal</span>
          </div>
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Flash Sale Đang chạy</p>
          <div className="text-2xl font-bold text-[#111827]">03</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5" />
             </div>
             <span className="text-[10px] text-[#10B981] font-bold">+28%</span>
          </div>
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Người dùng tham gia mua</p>
          <div className="text-2xl font-bold text-[#111827]">15,400</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
          <div className="flex justify-between items-start mb-4">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <BarChart2 className="w-5 h-5" />
             </div>
             <span className="text-[10px] text-[#10B981] font-bold">+18.5% Margin</span>
          </div>
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">PnL Hiệu quả Tích lũy</p>
          <div className="text-2xl font-bold text-[#111827]">{formatCurrency(850000000)}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Tìm chiến dịch giảm giá, KOL..." 
                className="bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
              />
            </div>
            <button className="bg-white border border-[#E5E7EB] px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
               <Filter className="w-4 h-4" /> Lọc theo loại
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Chiến dịch Group Buy / Flash Sale</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Tiến độ người tham gia</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Khuyến mãi hiện tại</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Hiệu quả PnL</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {MOCK_FLASH_SALES.map((campaign) => (
                <tr key={campaign.id} className="hover:bg-[#F9FAFB] group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className={cn(
                         "p-3 rounded-lg",
                         campaign.type === 'group_buy' ? "bg-rose-50 text-rose-600" : "bg-orange-50 text-orange-600"
                       )}>
                          {campaign.type === 'group_buy' ? <Users2 className="w-5 h-5" /> : <Zap className="w-5 h-5 fill-current" />}
                       </div>
                       <div>
                          <p className="text-sm font-semibold text-[#111827]">{campaign.name}</p>
                          <div className="flex items-center gap-2 mt-1 display">
                            <span className={cn(
                              "text-[10px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded",
                              campaign.type === 'group_buy' ? "bg-rose-100 text-rose-600" : "bg-orange-100 text-orange-600"
                            )}>{campaign.type === 'group_buy' ? 'MUA CHUNG' : 'FLASH SALE'}</span>
                            {campaign.kolName && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">🎤 {campaign.kolName}</span>
                            )}
                          </div>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     {campaign.type === 'group_buy' && campaign.requiredParticipants ? (
                        <div className="space-y-1.5 w-48">
                           <div className="flex justify-between text-[10px] font-medium">
                              <span className="text-slate-600">{campaign.currentParticipants} người</span>
                              <span className="text-rose-600 font-bold whitespace-nowrap">Mục tiêu: {campaign.requiredParticipants}</span>
                           </div>
                           <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-rose-500 rounded-full" 
                                style={{ width: `${Math.min(((campaign.currentParticipants || 0) / campaign.requiredParticipants) * 100, 100)}%` }}
                              />
                           </div>
                        </div>
                     ) : (
                        <span className="text-xs text-slate-500 italic">Không áp dụng</span>
                     )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {campaign.type === 'group_buy' ? (
                       <>
                         <p className="text-lg font-black text-rose-600 border-rose-200">-{Math.min((campaign.baseDiscount || 0) + Math.floor((campaign.currentParticipants || 0) / 100), campaign.maxDiscount || 0)}%</p>
                         <p className="text-[10px] text-[#6B7280]">Khởi điểm: -{campaign.baseDiscount}%</p>
                       </>
                    ) : (
                       <p className="text-sm font-bold text-slate-800">Cố định / Khung giờ</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                       <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-emerald-600">{campaign.roi > 0 ? '+' + formatCurrency(campaign.gmvGenerated * 0.185) : '--'}</span>
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
    </div>
  );
}
