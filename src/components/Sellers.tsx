import React, { useState } from 'react';
import { 
  Users, 
  ShieldCheck, 
  FileText, 
  Search, 
  Filter, 
  MoreVertical, 
  Star, 
  Percent,
  History,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Briefcase
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { SellerMetric } from '../types/erp';

const MOCK_SELLERS: SellerMetric[] = [
  {
    id: 'SEL-001',
    name: 'Mobile World',
    totalProducts: 1250,
    rating: 4.8,
    gmv: 4500000000,
    status: 'active',
    taxCode: '0101234567',
    identityCard: '001090123456',
    commissionRate: 5,
    joinDate: '2023-12-01',
    onboardingStep: 'completed'
  },
  {
    id: 'SEL-002',
    name: 'Fashion Hub',
    totalProducts: 850,
    rating: 4.6,
    gmv: 2800000000,
    status: 'active',
    taxCode: '0309876543',
    identityCard: '079090987654',
    commissionRate: 8,
    joinDate: '2024-01-15',
    onboardingStep: 'completed'
  },
  {
    id: 'SEL-003',
    name: 'Eco Mart',
    totalProducts: 120,
    rating: 0,
    gmv: 0,
    status: 'pending',
    taxCode: '0401122334',
    identityCard: '012345678901',
    commissionRate: 10,
    joinDate: '2024-03-10',
    onboardingStep: 'verification'
  }
];

export function SellerManagement() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Quản lý Seller / Vendor</h1>
          <p className="text-sm text-[#6B7280] mt-1">Hồ sơ nhà bán, đối soát MST/CCCD và quản lý hoa hồng.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Báo cáo đối soát
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm">
            Kích hoạt Seller nhanh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
             </div>
             <span className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Đang chờ Onboarding</span>
          </div>
          <div className="text-3xl font-bold text-[#111827]">12 <span className="text-sm font-normal text-[#9CA3AF]">Seller</span></div>
          <div className="mt-4 flex items-center gap-2 text-xs text-[#EAB308] font-bold">
            <AlertCircle className="w-3 h-3" /> 8 Seller đang chờ đối soát MST
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Percent className="w-5 h-5" />
             </div>
             <span className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Hoa hồng trung bình</span>
          </div>
          <div className="text-3xl font-bold text-[#111827]">7.2% <span className="text-sm font-normal text-[#9CA3AF]">revenue share</span></div>
          <p className="mt-4 text-[10px] text-[#6B7280]">Tổng doanh thu phí sàn: {formatCurrency(850000000)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <Star className="w-5 h-5" />
             </div>
             <span className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Rating trung bình sàn</span>
          </div>
          <div className="text-3xl font-bold text-[#111827]">4.72 <span className="text-sm font-normal text-[#9CA3AF]">/ 5.0</span></div>
          <p className="mt-4 text-[10px] text-[#10B981] font-medium">+0.15 so với tháng trước</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Tìm tên Seller, MST, CCCD..." 
                className="bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-80"
              />
            </div>
            <button className="bg-white border border-[#E5E7EB] px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
               <Filter className="w-4 h-4" /> Bộ lọc đối soát
            </button>
          </div>
          <div className="flex border border-[#E5E7EB] rounded-lg overflow-hidden bg-white">
             <button 
                onClick={() => setActiveTab('all')}
                className={cn("px-4 py-2 text-xs font-semibold transition-all", activeTab === 'all' ? "bg-[#2563EB] text-white" : "text-[#4B5563] hover:bg-slate-50")}
             >Tất cả Seller</button>
             <button 
                onClick={() => setActiveTab('pending')}
                className={cn("px-4 py-2 text-xs font-semibold border-l border-[#E5E7EB] transition-all", activeTab === 'pending' ? "bg-[#2563EB] text-white" : "text-[#4B5563] hover:bg-slate-50")}
             >Đang phê duyệt</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Hồ sơ Seller</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Xác thực Định danh</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">GMV / Phí Sàn</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Chỉ số Rating</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {MOCK_SELLERS.filter(s => activeTab === 'all' || s.status === 'pending').map((seller) => (
                <tr key={seller.id} className="hover:bg-[#F9FAFB] group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#2563EB] font-bold text-sm border border-[#E5E7EB]">
                        {seller.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#111827]">{seller.name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">Ngày gia nhập: {seller.joinDate}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1.5">
                       <div className="flex items-center gap-2">
                          <div className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold",
                            seller.onboardingStep === 'completed' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                          )}>
                             {seller.onboardingStep === 'completed' ? 'MST ĐÃ ĐỐI SOÁT' : 'CHỜ ĐỐI SOÁT MST'}
                          </div>
                       </div>
                       <div className="text-[10px] font-mono text-[#6B7280] select-all">MST: {seller.taxCode}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-[#111827]">{formatCurrency(seller.gmv)}</p>
                    <p className="text-[10px] text-[#2563EB] font-medium">Hoa hồng: {seller.commissionRate}%</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                       <div className="flex items-center gap-1">
                          <Star className={cn("w-3.5 h-3.5 fill-current", seller.rating > 0 ? "text-[#F59E0B]" : "text-[#E5E7EB]")} />
                          <span className="text-sm font-bold text-[#111827]">{seller.rating || '--'}</span>
                       </div>
                       <span className="text-[10px] text-[#9CA3AF] mt-1">{seller.totalProducts} SP</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex gap-2">
                        {seller.status === 'pending' ? (
                          <button className="flex-1 px-3 py-1.5 bg-[#2563EB] text-white text-[11px] font-bold rounded-md hover:bg-blue-700 shadow-sm">Duyệt hồ sơ</button>
                        ) : (
                          <button className="p-2 hover:bg-[#F3F4F6] rounded-lg text-[#9CA3AF] hover:text-[#2563EB] transition-all">
                            <MoreVertical className="w-4 h-4" />
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

      <div className="bg-[#111827] rounded-lg p-8 text-white relative overflow-hidden shadow-xl">
         <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ShieldCheck className="w-32 h-32" />
         </div>
         <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Briefcase className="w-6 h-6 text-blue-400" />
               </div>
               <h3 className="text-xl font-semibold">Cơ chế phê duyệt hồ sơ tự động</h3>
            </div>
            <p className="text-gray-400 text-sm max-w-2xl">
              Hệ thống tích hợp API tra cứu từ Tổng cục Thuế và cơ sở dữ liệu quốc gia về dân cư. Tự động từ chối hồ sơ nếu MST hoặc CCCD/CMND không tồn tại hoặc không chính chủ.
            </p>
            <div className="flex gap-4 pt-2">
               <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Đang kết nối MST API
               </div>
               <div className="flex items-center gap-2 text-xs bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Đang kết nối CCCD OCR
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
