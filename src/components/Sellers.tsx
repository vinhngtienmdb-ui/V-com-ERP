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
  Briefcase,
  Store,
  Globe,
  Plus,
  Key,
  X,
  UserCheck,
  UserCog,
  Trash2,
  Edit2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { SellerMetric } from '../types/erp';

interface SellerPosAccount {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Staff';
  branches: string[];
}

interface PartnerData extends SellerMetric {
  partnerType: 'seller' | 'dealer';
  activeModules: string[];
}

const MOCK_SELLERS: PartnerData[] = [
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
    onboardingStep: 'completed',
    partnerType: 'dealer',
    activeModules: ['ipos', 'pim', 'scm', 'hr']
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
    onboardingStep: 'completed',
    partnerType: 'seller',
    activeModules: ['orders', 'pim', 'marketing', 'flashsale', 'affiliate']
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
    onboardingStep: 'verification',
    partnerType: 'seller',
    activeModules: []
  }
];

export function SellerManagement() {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'seller' | 'dealer'>('all');
  const [selectedSeller, setSelectedSeller] = useState<PartnerData | null>(null);

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
        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
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

        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Percent className="w-5 h-5" />
             </div>
             <span className="text-sm font-semibold text-[#6B7280] uppercase tracking-wider">Hoa hồng trung bình</span>
          </div>
          <div className="text-3xl font-bold text-[#111827]">7.2% <span className="text-sm font-normal text-[#9CA3AF]">revenue share</span></div>
          <p className="mt-4 text-[10px] text-[#6B7280]">Tổng doanh thu phí sàn: {formatCurrency(850000000)}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm">
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

      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
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
             >Tất cả Đối tác</button>
             <button 
                onClick={() => setActiveTab('seller')}
                className={cn("px-4 py-2 text-xs font-semibold border-l border-[#E5E7EB] transition-all", activeTab === 'seller' ? "bg-[#2563EB] text-white" : "text-[#4B5563] hover:bg-slate-50")}
             >Nhà bán (Online)</button>
             <button 
                onClick={() => setActiveTab('dealer')}
                className={cn("px-4 py-2 text-xs font-semibold border-l border-[#E5E7EB] transition-all", activeTab === 'dealer' ? "bg-[#2563EB] text-white" : "text-[#4B5563] hover:bg-slate-50")}
             >Đại lý (Offline)</button>
             <button 
                onClick={() => setActiveTab('pending')}
                className={cn("px-4 py-2 text-xs font-semibold border-l border-[#E5E7EB] transition-all", activeTab === 'pending' ? "bg-[#2563EB] text-white" : "text-[#4B5563] hover:bg-slate-50")}
             >Đang chờ duyệt</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Hồ sơ Đối tác</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Xác thực Định danh</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">GMV / Phí Sàn</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Chỉ số Rating</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {MOCK_SELLERS.filter(s => {
                if (activeTab === 'pending') return s.status === 'pending';
                if (activeTab === 'seller') return s.partnerType === 'seller';
                if (activeTab === 'dealer') return s.partnerType === 'dealer';
                return true;
              }).map((seller) => (
                <tr key={seller.id} className="hover:bg-[#F9FAFB] group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center text-[#2563EB] font-bold text-sm border border-[#E5E7EB]">
                        {seller.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <p className="text-sm font-semibold text-[#111827]">{seller.name}</p>
                           {seller.partnerType === 'seller' ? (
                             <span className="text-[9px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Nhà bán</span>
                           ) : (
                             <span className="text-[9px] bg-teal-50 text-teal-600 border border-teal-100 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Đại lý Offline</span>
                           )}
                        </div>
                        <p className="text-[10px] text-[#9CA3AF] mt-0.5">Ngày gia nhập: {seller.joinDate}</p>
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
                     <div className="flex gap-2 justify-center">
                        {seller.status === 'pending' ? (
                          <button className="flex-1 px-3 py-1.5 bg-[#2563EB] text-white text-[11px] font-bold rounded-md hover:bg-blue-700 shadow-sm">Duyệt hồ sơ</button>
                        ) : (
                          <>
                            <button 
                              onClick={() => setSelectedSeller(seller)}
                              className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all font-bold flex items-center gap-1 text-[10px]"
                              title="Tích hợp iPOS, App & Phân quyền"
                            >
                              <Briefcase className="w-3.5 h-3.5" /> Phân quyền
                            </button>
                            <button className="p-2 hover:bg-[#F3F4F6] rounded-lg text-[#9CA3AF] hover:text-[#2563EB] transition-all">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </>
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

      {selectedSeller && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xl">
                       {selectedSeller.name.charAt(0)}
                    </div>
                    <div>
                       <h2 className="text-xl font-bold text-slate-900 leading-tight">Cấu hình Hệ sinh thái & Phân quyền ứng dụng</h2>
                       <p className="text-xs text-slate-500 font-medium">Đối tác: <span className="font-bold text-indigo-600">{selectedSeller.name}</span> ({selectedSeller.partnerType === 'seller' ? 'Nhà bán Online' : 'Đại lý Offline'}) • MST: {selectedSeller.taxCode}</p>
                    </div>
                 </div>
                 <button onClick={() => setSelectedSeller(null)} className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-white grid grid-cols-1 md:grid-cols-2 gap-8 custom-scrollbar">
                 {/* Left Col: Domain Setup */}
                 <div className="space-y-6">
                    <div>
                       <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                          <Globe className="w-5 h-5 text-indigo-600" /> Tên miền POS (Domain)
                       </h3>
                       <p className="text-[11px] text-slate-500 mb-4">Cấu hình Subdomain dành riêng cho nhân viên tại các chi nhánh/cửa hàng của Seller này đăng nhập hệ thống iPOS độc lập.</p>
                       <div className="space-y-3">
                          <div>
                             <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Subdomain chính</label>
                             <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg overflow-hidden">
                                <span className="pl-4 pr-1 py-3 text-slate-400"><Globe className="w-4 h-4" /></span>
                                <input type="text" className="flex-1 bg-transparent px-2 py-3 text-sm font-bold text-slate-900 focus:outline-none" defaultValue={selectedSeller.name.toLowerCase().replace(/\s/g, '')} />
                                <span className="px-4 py-3 bg-slate-100 border-l border-slate-200 text-xs font-mono font-medium text-slate-500">.v-erp.com</span>
                             </div>
                          </div>
                       </div>
                       <button className="mt-4 w-full bg-indigo-50 text-indigo-700 py-2.5 rounded-lg text-sm font-bold border border-indigo-100 hover:bg-indigo-100 transition-colors">
                          Cập nhật Domain
                       </button>
                    </div>
                    
                    <div className="pt-6 border-t border-slate-100">
                       <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                          <Store className="w-5 h-5 text-indigo-600" /> Chi nhánh / Cửa hàng
                       </h3>
                       <div className="space-y-3">
                          <div className="border border-slate-200 rounded-lg p-3 bg-slate-50 flex justify-between items-center">
                             <div>
                                <p className="text-sm font-bold text-slate-800">Chi nhánh Mặc định (Trụ sở)</p>
                                <p className="text-[10px] text-slate-500">Mã: ST-001</p>
                             </div>
                             <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded font-bold">ACTIVE</span>
                          </div>
                       </div>
                       <button className="mt-4 w-full border-2 border-dashed border-slate-200 text-slate-500 py-2.5 rounded-lg text-sm font-bold hover:border-indigo-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                          <Plus className="w-4 h-4" /> Thêm Cửa hàng mới
                       </button>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                       <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                          <ShieldCheck className="w-5 h-5 text-indigo-600" /> Cấp phép Ứng dụng & Modules
                       </h3>
                       <p className="text-[11px] text-slate-500 mb-4">Chọn các module trên hệ thống ERP mà đối tác này được phép truy cập dựa trên mô hình kinh doanh.</p>
                       <div className="grid grid-cols-2 gap-3">
                         {[
                           { id: 'dashboard', label: 'Dashboard & Phân tích', reqDealer: true, reqSeller: true },
                           { id: 'orders', label: 'Quản lý Đơn hàng', reqDealer: false, reqSeller: true },
                           { id: 'pim', label: 'Quản lý Sản phẩm (PIM)', reqDealer: true, reqSeller: true },
                           { id: 'ipos', label: 'iPOS Bán hàng', reqDealer: true, reqSeller: false },
                           { id: 'marketing', label: 'Chiến dịch Marketing', reqDealer: false, reqSeller: true },
                           { id: 'flashsale', label: 'Flash Sale (Mua chung)', reqDealer: false, reqSeller: true },
                           { id: 'scm', label: 'Chuỗi cung ứng (Kho)', reqDealer: true, reqSeller: false },
                           { id: 'hr', label: 'Nhân sự (Giao ca, Lương)', reqDealer: true, reqSeller: false }
                         ].map(mod => {
                           const isActive = selectedSeller.activeModules.includes(mod.id) || 
                                            (selectedSeller.partnerType === 'seller' && mod.reqSeller) ||
                                            (selectedSeller.partnerType === 'dealer' && mod.reqDealer);
                           
                           return (
                             <label key={mod.id} className={cn("flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-slate-50 transition-all", isActive ? "border-indigo-200 bg-indigo-50/30" : "border-slate-100")}>
                               <input type="checkbox" defaultChecked={isActive} className="mt-1 flex-shrink-0 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500" />
                               <span className="text-xs font-bold text-slate-700 leading-tight">{mod.label}</span>
                             </label>
                           );
                         })}
                       </div>
                    </div>
                 </div>

                 {/* Right Col: RBAC Staff Setup */}
                 <div className="bg-slate-50 rounded-lg p-6 border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                       <h3 className="font-bold text-slate-900 flex items-center gap-2">
                          <UserCog className="w-5 h-5 text-indigo-600" /> Phân quyền Tài khoản
                       </h3>
                       <button className="bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                          <Plus className="w-4 h-4" />
                       </button>
                    </div>

                    <div className="space-y-4">
                       <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />
                          <div className="flex justify-between items-start">
                             <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center font-bold text-rose-600 text-xs">AD</div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900">{selectedSeller.name} Admin</p>
                                   <p className="text-[10px] text-slate-500">admin@{selectedSeller.name.toLowerCase().replace(/\s/g, '')}.v-erp.com</p>
                                   <div className="mt-2 flex gap-2">
                                      <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Quản trị viên (Admin)</span>
                                   </div>
                                </div>
                             </div>
                             <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Key className="w-4 h-4" /></button>
                          </div>
                       </div>

                       <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                          <div className="flex justify-between items-start">
                             <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600 text-xs">MG</div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900">Quản lý Cửa hàng 1</p>
                                   <p className="text-[10px] text-slate-500">manager1@{selectedSeller.name.toLowerCase().replace(/\s/g, '')}.v-erp.com</p>
                                   <div className="mt-2 flex gap-2">
                                      <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Quản lý (Manager)</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button className="text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-slate-50">
                             <p className="text-[10px] text-slate-500 flex items-center gap-1"><Store className="w-3 h-3" /> Quyền truy cập: <span className="font-bold text-slate-700">Chi nhánh Mặc định (ST-001)</span></p>
                          </div>
                       </div>

                       <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm relative overflow-hidden group">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
                          <div className="flex justify-between items-start">
                             <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-emerald-600 text-xs">ST</div>
                                <div>
                                   <p className="text-sm font-bold text-slate-900">Thu Ngân (Ca 1)</p>
                                   <p className="text-[10px] text-slate-500">pos1@{selectedSeller.name.toLowerCase().replace(/\s/g, '')}.v-erp.com</p>
                                   <div className="mt-2 flex gap-2">
                                      <span className="text-[9px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider">Nhân viên POS (Staff)</span>
                                   </div>
                                </div>
                             </div>
                             <div className="flex gap-2">
                                <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                <button className="text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
