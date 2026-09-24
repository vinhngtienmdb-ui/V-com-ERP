import React, { useState } from 'react';
import { 
  X, 
  Building, 
  Store, 
  User, 
  ShieldCheck, 
  CheckCircle2, 
  FileText, 
  CreditCard, 
  Receipt, 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Wallet, 
  Percent, 
  Lock, 
  Unlock,
  Settings2,
  Globe
} from 'lucide-react';
import { ComprehensiveSeller } from '../../types/sellerKyc';
import { formatCurrency, cn } from '../../lib/utils';

interface SellerDetailModalProps {
  seller: ComprehensiveSeller;
  onClose: () => void;
  onToggleLock: (sellerId: string) => void;
  onAdjustWallet: (seller: ComprehensiveSeller) => void;
}

export const SellerDetailModal: React.FC<SellerDetailModalProps> = ({
  seller,
  onClose,
  onToggleLock,
  onAdjustWallet
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'tax' | 'ecosystem'>('profile');

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs",
              seller.legalType === 'ENTERPRISE' ? "bg-purple-100 text-purple-700 border border-purple-200" :
              seller.legalType === 'HOUSEHOLD' ? "bg-teal-100 text-teal-700 border border-teal-200" :
              "bg-blue-100 text-blue-700 border border-blue-200"
            )}>
              {seller.legalType === 'ENTERPRISE' ? <Building className="w-6 h-6" /> :
               seller.legalType === 'HOUSEHOLD' ? <Store className="w-6 h-6" /> :
               <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">{seller.shopName}</h2>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                  seller.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  seller.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  {seller.status === 'active' ? 'Đang hoạt động' : seller.status === 'pending' ? 'Chờ duyệt' : 'Tạm khóa'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Mã định danh: <span className="font-mono text-slate-700 font-bold">{seller.id}</span> • Ngày tham gia: {seller.joinDate}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-white flex gap-6 text-xs font-bold">
          <button 
            onClick={() => setActiveTab('profile')}
            className={cn("py-3 border-b-2 transition-all cursor-pointer", activeTab === 'profile' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800")}
          >
            Hồ sơ Định danh & VNeID
          </button>
          <button 
            onClick={() => setActiveTab('tax')}
            className={cn("py-3 border-b-2 transition-all cursor-pointer", activeTab === 'tax' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800")}
          >
            Thuế Suất & Khấu Trừ Sàn
          </button>
          <button 
            onClick={() => setActiveTab('ecosystem')}
            className={cn("py-3 border-b-2 transition-all cursor-pointer", activeTab === 'ecosystem' ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-800")}
          >
            Phân Quyền iPOS & Hệ Sinh Thái
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              
              {/* VNeID Card */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span className="font-bold text-sm">Định danh điện tử Quốc gia VNeID (Mức 2)</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> ĐÃ XÁC THỰC CHÍNH CHỦ
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-white/5 p-3.5 rounded-xl">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Số CCCD / VNeID</span>
                    <span className="font-mono font-bold text-white text-sm">{seller.vneid.citizenId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Họ và tên</span>
                    <span className="font-bold text-emerald-300">{seller.vneid.fullName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Ngày sinh</span>
                    <span className="text-slate-200">{seller.vneid.dob}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Giới tính</span>
                    <span className="text-slate-200">{seller.vneid.gender}</span>
                  </div>
                  <div className="col-span-2 sm:col-span-4 pt-2 border-t border-white/10">
                    <span className="text-[10px] text-slate-400 block uppercase">Địa chỉ thường trú</span>
                    <span className="text-slate-200">{seller.vneid.permanentAddress}</span>
                  </div>
                </div>
              </div>

              {/* Financial & Banking */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tài khoản Ngân hàng</span>
                  <p className="font-bold text-slate-900 text-sm">{seller.bank.bankName}</p>
                  <p className="font-mono font-bold text-slate-800 select-all">STK: {seller.bank.accountNumber}</p>
                  <p className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Chủ TK: {seller.bank.accountHolder}
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ví Dòng Tiền & GMV</span>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Số dư khả dụng:</span>
                    <span className="font-black text-emerald-600 text-base">{formatCurrency(seller.walletBalance || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Tổng doanh số GMV:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(seller.gmv || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Hoa hồng sàn:</span>
                    <span className="font-bold text-blue-600 font-mono">{seller.commissionRate}%</span>
                  </div>
                </div>
              </div>

              {/* Legal Address & Warehouse */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-800 font-bold mb-1">
                  <MapPin className="w-4 h-4 text-slate-500" /> Địa Điểm Hoạt Động & Kho Hàng
                </div>
                <p className="text-slate-600"><b className="text-slate-800">Trụ sở đăng ký:</b> {seller.businessAddress}</p>
                <p className="text-slate-600"><b className="text-slate-800">Kho hàng lấy hàng:</b> {seller.warehouseAddress}</p>
              </div>

            </div>
          )}

          {activeTab === 'tax' && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-blue-950 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-blue-600" /> 
                    Mô Hình Khấu Trừ Thuế: {seller.legalType === 'ENTERPRISE' ? 'Doanh Nghiệp Kê Khai' : 'Sàn Khấu Trừ Nộp Thay (TT40)'}
                  </span>
                  <span className="font-mono font-bold text-blue-800">MST: {seller.tax.taxCode}</span>
                </div>
                <p className="text-blue-800 leading-relaxed">
                  {seller.legalType === 'ENTERPRISE' 
                    ? 'Doanh nghiệp chịu trách nhiệm xuất hóa đơn điện tử GTGT cho từng đơn hàng thành công và tự quyết toán thuế TNDN.'
                    : 'Căn cứ Thông tư 40/2021/TT-BTC, Sàn TMĐT VComm thực hiện khấu trừ và kê khai nộp thuế thay người bán với biểu thuế chuẩn.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Thuế Giá Trị Gia Tăng (GTGT)</span>
                  <p className="text-lg font-black text-slate-900">{seller.tax.vatRate}%</p>
                  <p className="text-[11px] text-slate-500">Khấu trừ trên doanh thu bán lẻ từng đơn</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Thuế Thu Nhập Cá Nhân (TNCN)</span>
                  <p className="text-lg font-black text-slate-900">{seller.tax.pitRate}%</p>
                  <p className="text-[11px] text-slate-500">Kê khai thay vào Cổng thông tin Thuế điện tử</p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Chi cục thuế quản lý</span>
                <p className="font-bold text-slate-800 text-sm">{seller.tax.taxOffice}</p>
                <p className="text-[11px] text-slate-500">Trạng thái mã số thuế: <b className="text-emerald-600">Đang hoạt động (Đã đối soát)</b></p>
              </div>
            </div>
          )}

          {activeTab === 'ecosystem' && (
            <div className="space-y-4 animate-in fade-in duration-150 text-xs">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-600" /> Tên miền iPOS Cửa hàng
                </span>
                <p className="text-slate-600 text-[11px]">Subdomain dành riêng cho nhân viên cửa hàng và thu ngân:</p>
                <div className="font-mono font-bold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-300">
                  https://{seller.shopName.toLowerCase().replace(/[^a-z0-9]/g, '')}.v-erp.com
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 block">Các phân hệ được cấp phép hoạt động:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {seller.activeModules.map(mod => (
                    <div key={mod} className="bg-white p-2.5 rounded-lg border border-slate-200 font-bold text-slate-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="uppercase">{mod}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAdjustWallet(seller)}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-4 h-4" /> Điều chỉnh ví tiền
            </button>
            <button
              onClick={() => onToggleLock(seller.id)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer",
                seller.status === 'suspended'
                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                  : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
              )}
            >
              {seller.status === 'suspended' ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              {seller.status === 'suspended' ? 'Mở khóa Shop' : 'Tạm khóa Shop'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};
