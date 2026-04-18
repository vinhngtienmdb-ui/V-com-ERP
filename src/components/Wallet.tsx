import React, { useState } from 'react';
import { 
  Wallet, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight, 
  History, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Lock, 
  Unlock, 
  RefreshCcw,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { WalletTransaction, EscrowAccount, PaymentGateway } from '../types/erp';

const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: 'TXN-101', userId: 'USR-882', type: 'deposit', amount: 5000000, gateway: 'momo', status: 'success', timestamp: '2024-03-16 14:20' },
  { id: 'TXN-102', userId: 'SEL-001', type: 'payout', amount: 15400000, gateway: 'internal', status: 'success', timestamp: '2024-03-16 11:00' },
  { id: 'TXN-103', userId: 'USR-441', type: 'payment', amount: 1200000, gateway: 'zalopay', status: 'pending', timestamp: '2024-03-16 16:45' },
];

const MOCK_ESCROWS: EscrowAccount[] = [
  { orderId: 'ORD-9901', amount: 2500000, sellerId: 'SEL-001', buyerId: 'USR-882', releaseStatus: 'locked', autoReleaseAt: '2024-03-20' },
  { orderId: 'ORD-9902', amount: 890000, sellerId: 'SEL-005', buyerId: 'USR-129', releaseStatus: 'released', autoReleaseAt: '2024-03-14' },
];

const MOCK_GATEWAYS: PaymentGateway[] = [
  { id: 'GW-001', name: 'VNPay QR & ATM', provider: 'vnpay', status: 'active', transactionFee: 0.8, isPreferred: true },
  { id: 'GW-002', name: 'MoMo E-Wallet', provider: 'momo', status: 'active', transactionFee: 1.0, isPreferred: false },
  { id: 'GW-003', name: 'ZaloPay Wallet', provider: 'zalopay', status: 'maintenance', transactionFee: 1.2, isPreferred: false },
  { id: 'GW-004', name: 'Napas Portal', provider: 'napas', status: 'active', transactionFee: 0.5, isPreferred: false },
  { id: 'GW-005', name: 'Thẻ Quốc tế (Visa/Master)', provider: 'credit_card', status: 'inactive', transactionFee: 2.5, isPreferred: false },
];

export function WalletHub() {
  const [activeTab, setActiveTab] = useState<'wallet' | 'escrow' | 'gateway'>('wallet');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Ví nội bộ & Ký quỹ (Escrow)</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý số dư, lịch sử giao dịch và cơ chế giữ tiền đảm bảo an toàn Sàn.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" />
            Đối soát Gateway
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm">
            Cấu hình hạn mức ví
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-[#111827] text-white p-6 rounded-xl shadow-xl shadow-slate-900/10">
           <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-500 rounded-xl">
                 <Wallet className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tổng số dư Ví</span>
           </div>
           <div className="text-2xl font-bold">{formatCurrency(24500000000)}</div>
           <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400">
              <Lock className="w-3 h-3" /> Tài khoản Escrow: 8.5 tỷ
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-2">Giao dịch trong ngày</p>
           <div className="text-2xl font-bold text-[#111827]">1,245</div>
           <p className="text-[10px] text-[#10B981] font-medium mt-1">+15% volume so với hôm qua</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-2">Đang chờ giải ngân (Escrow)</p>
           <div className="text-2xl font-bold text-[#F59E0B]">{formatCurrency(8500000000)}</div>
           <p className="text-[10px] text-[#6B7280] mt-1">Giao dịch đang chờ xác nhận nhận hàng</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-2">Lỗi nạp/rút (Gateway)</p>
           <div className="text-2xl font-bold text-[#EF4444]">03</div>
           <p className="text-[10px] text-[#EF4444] font-medium mt-1">MoMo: 2, Napas: 1</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden p-2">
        <div className="flex border-b border-[#F3F4F6] bg-slate-50/50 rounded-t-[2rem] overflow-x-auto whitespace-nowrap scrollbar-hide">
           {[
             { id: 'wallet', label: 'Quản lý Ví người dùng', icon: History },
             { id: 'escrow', label: 'Cơ chế Ký quỹ (Escrow)', icon: ShieldCheck },
             { id: 'gateway', label: 'Cổng thanh toán (NAPAS/MOMO)', icon: Smartphone }
           ].map((tab) => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
                  activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-blue-50/30" : "border-transparent text-[#6B7280] hover:text-[#111827]"
                )}
             >
                {'icon' in tab && <tab.icon className="w-4 h-4" />} {tab.label}
             </button>
           ))}
        </div>

        <div className="p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center">
           <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input 
                  type="text" 
                  placeholder="Tìm giao dịch, User, Mã đơn..." 
                  className="bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
                />
              </div>
              <button className="bg-white border border-[#E5E7EB] px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
                 <Filter className="w-4 h-4" /> Tất cả giao dịch
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              {activeTab === 'wallet' && (
                <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Mã giao dịch</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Loại</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-right">Số tiền</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Cổng thanh toán</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Thời gian</th>
                </tr>
              )}
              {activeTab === 'escrow' && (
                <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Mã đơn hàng</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Số tiền ký quỹ</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Seller ID</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Trạng thái Ký quỹ</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-right">Tự động giải ngân</th>
                </tr>
              )}
              {activeTab === 'gateway' && (
                <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Tên Cổng & Provider</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Phí giao dịch</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Mặc định (Preferred)</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center">Trạng thái HĐ</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-right">Tương tác</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {activeTab === 'wallet' && MOCK_TRANSACTIONS.map(txn => (
                <tr key={txn.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono font-bold text-[#111827]">{txn.id}</td>
                  <td className="px-6 py-4">
                     <span className={cn(
                       "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                       txn.type === 'deposit' ? "bg-emerald-50 text-emerald-600" :
                       txn.type === 'withdraw' ? "bg-red-50 text-red-600" :
                       txn.type === 'payment' ? "bg-blue-50 text-blue-600" : "bg-slate-50 text-slate-600"
                     )}>
                        {txn.type}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#111827]">
                     {txn.type === 'deposit' ? '+' : '-'}{formatCurrency(txn.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                       <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                       <span className="text-xs text-slate-600 uppercase font-bold">{txn.gateway}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                       <span className={cn(
                         "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
                         txn.status === 'success' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                       )}>
                          {txn.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <RefreshCcw className="w-3 h-3" />}
                          {txn.status === 'success' ? 'THÀNH CÔNG' : 'ĐANG XỬ LÝ'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-mono text-slate-400">{txn.timestamp}</td>
                </tr>
              ))}
              {activeTab === 'escrow' && MOCK_ESCROWS.map(escrow => (
                <tr key={escrow.orderId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-bold text-[#111827]">{escrow.orderId}</td>
                  <td className="px-6 py-4 text-sm font-bold text-[#2563EB]">{formatCurrency(escrow.amount)}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{escrow.sellerId}</td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        {escrow.releaseStatus === 'locked' ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Unlock className="w-3.5 h-3.5 text-emerald-500" />}
                        <span className={cn(
                          "text-[10px] font-bold uppercase",
                          escrow.releaseStatus === 'locked' ? "text-amber-600" : "text-emerald-600"
                        )}>
                          {escrow.releaseStatus === 'locked' ? 'ĐANG GIỮ TIỀN (LOCKED)' : 'ĐÃ GIẢI NGÂN (RELEASED)'}
                        </span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400">
                     {escrow.autoReleaseAt}
                  </td>
                </tr>
              ))}
              {activeTab === 'gateway' && MOCK_GATEWAYS.map(gw => (
                <tr key={gw.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                     <p className="text-sm font-bold text-[#111827]">{gw.name}</p>
                     <p className="text-xs text-slate-500 font-mono">{gw.id} • {gw.provider}</p>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-700">{gw.transactionFee}%</td>
                  <td className="px-6 py-4">
                     <button className={cn(
                        "px-3 py-1 text-xs font-bold rounded-full transition-all border",
                        gw.isPreferred 
                          ? "bg-blue-50 text-blue-600 border-blue-200" 
                          : "bg-white text-slate-400 border-slate-200 hover:border-blue-400 hover:text-blue-500"
                     )}>
                        {gw.isPreferred ? 'Đang chọn' : 'Đặt mặc định'}
                     </button>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        gw.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                        gw.status === 'maintenance' ? "bg-amber-50 text-amber-600" :
                        "bg-slate-100 text-slate-500"
                     )}>
                        {gw.status === 'active' ? 'Hoạt động' : gw.status === 'maintenance' ? 'Bảo trì' : 'Không HĐ'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm">
                        Cấu hình
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
         <div className="bg-white p-8 rounded-xl border border-[#E5E7EB] shadow-sm space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2">
               <Smartphone className="w-6 h-6 text-[#2563EB]" /> Gateway Monitoring (Live)
            </h3>
            <div className="space-y-3">
               {[
                 { label: 'NAPAS (Cổng Ngân hàng)', status: 'online', latency: '42ms' },
                 { label: 'MoMo E-Wallet', status: 'online', latency: '124ms' },
                 { label: 'ZaloPay Wallet', status: 'maintenance', latency: '---' },
               ].map(item => (
                 <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                       <div className={cn("w-2 h-2 rounded-full", item.status === 'online' ? "bg-emerald-500" : "bg-amber-500")} />
                       <span className="text-xs font-bold text-slate-700">{item.label}</span>
                    </div>
                    <div className="text-right">
                       <p className={cn("text-[10px] font-bold uppercase tracking-widest", item.status === 'online' ? "text-emerald-600" : "text-amber-600")}>{item.status}</p>
                       <p className="text-[10px] text-slate-400">Độ trễ: {item.latency}</p>
                    </div>
                 </div>
               ))}
            </div>
         </div>
         <div className="bg-slate-900 text-white p-8 rounded-xl relative overflow-hidden flex flex-col justify-between">
            <div className="relative z-10">
               <h3 className="text-xl font-bold italic mb-4">Escrow Protocol v2.0</h3>
               <p className="text-slate-400 text-sm leading-relaxed mb-6">Cơ chế đóng băng tiền người mua ngay khi thanh toán. Tiền chỉ được chuyển sang Ví Seller khi hệ thống Logistics xác nhận "Giao hàng thành công" và người mua không có khiếu nại sau 7 ngày. Đảm bảo 100% an toàn cho giao dịch trên sàn.</p>
               <div className="flex items-center gap-2 text-blue-400 text-sm font-bold">
                  <ShieldCheck className="w-5 h-5" /> Hệ thống bảo mật chuỗi khối
               </div>
            </div>
            <div className="relative z-10 pt-8">
               <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20">Cấu hình Quy tắc Giải ngân</button>
            </div>
            <Lock className="absolute -bottom-10 -right-10 w-64 h-64 text-slate-800/10" />
         </div>
      </div>
    </div>
  );
}
