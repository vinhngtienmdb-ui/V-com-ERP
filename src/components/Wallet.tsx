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
  Filter,
  ArrowRight,
  TrendingUp,
  Fingerprint,
  QrCode,
  ShieldAlert,
  Wifi,
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Plus,
  BarChart2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { WalletTransaction, EscrowAccount, PaymentGateway } from '../types/erp';
import { motion, AnimatePresence } from 'motion/react';
import { sePayService, SePayTransaction } from '../services/sepayService';

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
  const [sepayTransactions, setSepayTransactions] = useState<SePayTransaction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncBankHub = async () => {
    setIsSyncing(true);
    try {
      const txns = await sePayService.getTransactions();
      setSepayTransactions(txns);
    } catch (err) {
      console.error("BankHub sync failed:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  const createVirtualVA = async () => {
    try {
      const va = await sePayService.createVirtualAccount(`ORDER-${Date.now()}`, 500000);
      alert(`Created Virtual Account: ${va.account_number} (${va.bank_name})`);
    } catch (err) {
      alert("Failed to create Virtual Account");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Ví Tài chính & Ký quỹ (Digital Vault)</h1>
          <p className="text-sm text-[#6B7280] mt-1">Hệ thống thanh toán tập trung, Quản lý dòng tiền và Bảo mật giao dịch Ký quỹ.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <RefreshCcw className="w-4 h-4" />
            Đối soát tự động
          </button>
          <button className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
             <Fingerprint className="w-4 h-4 text-blue-400" /> Security Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Wallet Card */}
        <div className="lg:col-span-2 relative h-[240px] rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 p-8 text-white shadow-2xl shadow-blue-500/20 overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:opacity-20 transition-opacity">
              <QrCode className="w-64 h-64 rotate-12" />
           </div>
           
           <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex justify-between items-start">
                 <div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full w-fit">
                       <ShieldCheck className="w-3.5 h-3.5 text-blue-100" />
                       <span className="text-[10px] font-bold uppercase tracking-widest text-blue-50">Verified Business Wallet</span>
                    </div>
                    <p className="text-xs font-medium text-blue-100 mt-4 uppercase tracking-tighter opacity-60">Tổng số dư khả dụng</p>
                    <h2 className="text-4xl font-black mt-1 tracking-tight italic">{formatCurrency(24500000000)}</h2>
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-bold text-blue-200/60 uppercase">Escrow Hold</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(8500000000)}</p>
                 </div>
              </div>

              <div className="flex justify-between items-end border-t border-white/10 pt-6">
                 <div className="flex gap-8">
                    <div>
                       <p className="text-[10px] font-bold text-blue-200/60 uppercase">Dòng tiền Thu</p>
                       <p className="font-bold">+125.4M</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-bold text-blue-200/60 uppercase">Dòng tiền Chi</p>
                       <p className="font-bold">-42.8M</p>
                    </div>
                 </div>
                 <div className="flex gap-2">
                    <button className="bg-white text-blue-600 px-6 py-2.5 rounded-lg font-bold text-sm shadow-xl shadow-blue-900/10 hover:bg-blue-50 transition-all">Nạp ví</button>
                    <button className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md px-6 py-2.5 rounded-lg font-bold text-sm transition-all">Rút tiền</button>
                 </div>
              </div>
           </div>
        </div>

        {/* Status Snapshot */}
        <div className="space-y-4">
           <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-lg">
                   <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Giao dịch trong ngày</p>
             </div>
             <div className="text-3xl font-black text-slate-900">1,245</div>
             <p className="text-xs font-bold text-emerald-600 mt-2 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> +15.5% volume
             </p>
           </div>
           <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-50 rounded-lg">
                   <ShieldAlert className="w-4 h-4 text-red-600" />
                </div>
                <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">Sự cố Gateway</p>
             </div>
             <div className="text-3xl font-black text-red-600">03 <span className="text-xs font-bold text-slate-400">cases</span></div>
             <p className="text-xs font-bold text-slate-400 mt-2">Đang chờ xử lý hoàn tiền</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-2 min-h-[600px]">
        <div className="flex border-b border-slate-100 bg-slate-50/50 p-1.5 overflow-x-auto scrollbar-hide">
           {[
             { id: 'wallet', label: 'Lịch sử Giao dịch', icon: History },
             { id: 'escrow', label: 'Bảo mật Ký quỹ (Escrow)', icon: ShieldCheck },
             { id: 'gateway', label: 'Cổng thanh toán (API)', icon: Smartphone }
           ].map((tab) => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 px-8 py-3.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
                  activeTab === tab.id ? "bg-white text-blue-600 shadow-md" : "text-slate-500 hover:text-slate-700"
                )}
             >
                <tab.icon className="w-4 h-4" /> {tab.label}
             </button>
           ))}
        </div>

        <div className="p-8">
           <AnimatePresence mode="wait">
             {activeTab === 'wallet' && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-6"
               >
                 <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-xl">
                    <div className="relative flex-1 group">
                       <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                       <input 
                         type="text" 
                         placeholder="Tìm theo Mã giao dịch, User ID, Đơn hàng..." 
                         className="w-full bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                       />
                    </div>
                    <div className="flex gap-2">
                       <button 
                          onClick={createVirtualVA}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                       >
                          <Plus className="w-3.5 h-3.5" /> Tạo Virtual Account
                       </button>
                       <button className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 hover:bg-white transition-all">
                          <Filter className="w-3.5 h-3.5" /> Bộ lọc
                       </button>
                       <button className="px-4 py-2 bg-[#111827] text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all">
                          Xuất CSV <ArrowDownRight className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-slate-100">
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mã Giao dịch</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Loại giao dịch</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Số tiền (VNĐ)</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gateway</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Thời gian</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {MOCK_TRANSACTIONS.map(txn => (
                             <tr key={txn.id} className="hover:bg-slate-50 transition-all group">
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <div className={cn("w-1.5 h-1.5 rounded-full", txn.type === 'deposit' ? "bg-emerald-500" : "bg-blue-500")} />
                                      <span className="text-xs font-mono font-bold text-slate-900 group-hover:text-blue-600">{txn.id}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <span className={cn(
                                      "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight",
                                      txn.type === 'deposit' ? "bg-emerald-50 text-emerald-600" :
                                      txn.type === 'payout' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                                   )}>
                                      {txn.type}
                                   </span>
                                </td>
                                <td className={cn(
                                   "px-6 py-4 text-right font-black",
                                   txn.type === 'deposit' ? "text-emerald-600" : "text-slate-900"
                                )}>
                                   {txn.type === 'deposit' ? '+' : '-'}{formatCurrency(txn.amount)}
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center">
                                         <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                                      </div>
                                      <span className="text-xs font-bold text-slate-500 uppercase">{txn.gateway}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex justify-center">
                                      <span className={cn(
                                         "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5",
                                         txn.status === 'success' ? "bg-emerald-500 text-white" : "bg-amber-100 text-amber-700"
                                      )}>
                                         {txn.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <RefreshCcw className="w-3 h-3 animate-spin" />}
                                         {txn.status === 'success' ? 'SUCCESS' : 'PENDING'}
                                      </span>
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-tighter whitespace-nowrap">{txn.timestamp}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               </motion.div>
             )}

             {activeTab === 'escrow' && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0.98 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="space-y-8"
               >
                 <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row gap-8 items-center">
                    <div className="relative z-10 space-y-4 max-w-md">
                       <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full w-fit">
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Security Standard v4.2</span>
                       </div>
                       <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Escrow Smart Protocol</h3>
                       <p className="text-sm text-slate-400 leading-relaxed">Tiền người mua được chuyển trực tiếp vào Vault của Sàn (Locked). Khi Logistics xác nhận "Giao hàng thành công", hệ thống tự động giải ngân cho Seller sau 7 ngày (Retention Period), đảm bảo an toàn 100%.</p>
                       <div className="flex gap-4 pt-4">
                          <div className="text-center">
                             <p className="text-[10px] font-bold text-slate-500 uppercase">Retention Time</p>
                             <p className="text-lg font-bold text-white">07 Days</p>
                          </div>
                          <div className="w-px h-10 bg-white/10" />
                          <div className="text-center">
                             <p className="text-[10px] font-bold text-slate-500 uppercase">Protection Level</p>
                             <p className="text-lg font-bold text-emerald-400">MAXIMUM</p>
                          </div>
                       </div>
                    </div>
                    <div className="relative z-10 flex-1 grid grid-cols-3 gap-2">
                       {['BUYER PAYS', 'ESCROW LOCK', 'SELLER PAID'].map((step, i) => (
                          <div key={i} className="flex flex-col items-center gap-4">
                             <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center border-2",
                                i === 1 ? "bg-blue-600 border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]" : "border-white/10 bg-white/5"
                             )}>
                                {i === 0 ? <CreditCard className="w-6 h-6" /> : i === 1 ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
                             </div>
                             <p className="text-[10px] font-bold text-white text-center opacity-60 px-2">{step}</p>
                          </div>
                       ))}
                       <div className="col-span-3 h-0.5 bg-white/10 mt-4 relative">
                          <div className="absolute top-0 left-0 w-2/3 h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
                       </div>
                    </div>
                 </div>

                 <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-slate-50">
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Reference</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escrow Amount</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Participants</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                             <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Release Date</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-50">
                          {MOCK_ESCROWS.map(escrow => (
                             <tr key={escrow.orderId} className="hover:bg-slate-50 transition-all">
                                <td className="px-6 py-4 text-sm font-bold text-slate-900 group">{escrow.orderId}</td>
                                <td className="px-6 py-4 text-sm font-black text-blue-600">{formatCurrency(escrow.amount)}</td>
                                <td className="px-6 py-4">
                                   <div className="flex flex-col">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Seller: {escrow.sellerId}</span>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">Buyer: {escrow.buyerId}</span>
                                   </div>
                                </td>
                                <td className="px-6 py-4">
                                   <div className="flex items-center gap-2">
                                      {escrow.releaseStatus === 'locked' ? (
                                         <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 rounded-lg text-[10px] font-bold uppercase">
                                            <Lock className="w-3 h-3" /> Locked
                                         </div>
                                      ) : (
                                         <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-bold uppercase">
                                            <Unlock className="w-3 h-3" /> Released
                                         </div>
                                      )}
                                   </div>
                                </td>
                                <td className="px-6 py-4 text-right text-[10px] font-black text-slate-400">{escrow.autoReleaseAt}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                 </div>
               </motion.div>
             )}

             {activeTab === 'gateway' && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="space-y-8"
               >
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-3 border-l-4 border-blue-600 bg-blue-50/50 p-6 rounded-3xl mb-4 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                             <Building2 className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                             <h4 className="font-bold text-slate-900">SePay Bank Hub Connection</h4>
                             <p className="text-xs text-slate-500">Đang đồng bộ hóa dữ liệu từ 3 tài khoản ngân hàng liên kết.</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className="text-[10px] font-bold text-slate-400 uppercase">Trạng thái API</p>
                             <div className="flex items-center gap-1.5 text-emerald-600">
                                <div className={cn("w-1.5 h-1.5 bg-emerald-500 rounded-full", isSyncing && "animate-ping")} />
                                <span className="text-xs font-bold font-mono">{isSyncing ? 'SYNCING...' : 'CONNECTED'}</span>
                             </div>
                          </div>
                          <button 
                             onClick={syncBankHub}
                             disabled={isSyncing}
                             className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-blue-600 hover:bg-white shadow-sm transition-all flex items-center gap-2"
                          >
                             <RefreshCcw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
                             Refresh Balance
                          </button>
                       </div>
                    </div>
                    {MOCK_GATEWAYS.map(gw => (
                       <div key={gw.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all relative group overflow-hidden">
                          {gw.isPreferred && (
                             <div className="absolute top-0 right-0 p-4">
                                <div className="px-2 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded-lg shadow-lg">Preferred</div>
                             </div>
                          )}
                          
                          <div className="flex gap-4">
                             <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg",
                                gw.provider === 'vnpay' ? "bg-red-600" :
                                gw.provider === 'momo' ? "bg-pink-600" :
                                gw.provider === 'zalopay' ? "bg-blue-500" : "bg-slate-900"
                             )}>
                                {gw.provider === 'credit_card' ? <CreditCard className="w-7 h-7" /> : <Smartphone className="w-7 h-7" />}
                             </div>
                             <div className="flex-1">
                                <h4 className="font-bold text-slate-900">{gw.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{gw.id}</p>
                             </div>
                          </div>

                          <div className="mt-6 flex justify-between items-end">
                             <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">Transaction Fee</p>
                                <p className="text-xl font-black text-slate-900">{gw.transactionFee}%</p>
                             </div>
                             <div className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5",
                                gw.status === 'active' ? "bg-emerald-50 text-emerald-600" :
                                gw.status === 'maintenance' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"
                             )}>
                                <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", gw.status === 'active' ? "bg-emerald-500" : "bg-amber-500")} />
                                {gw.status.toUpperCase()}
                             </div>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-50 flex justify-between">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                <Wifi className="w-3 h-3 text-emerald-500" /> API Connected
                             </div>
                             <button className="text-blue-600 text-[10px] font-black hover:underline flex items-center gap-1">
                                Configure <ExternalLink className="w-3 h-3" />
                             </button>
                          </div>
                       </div>
                    ))}
                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer hover:bg-slate-100 transition-all">
                       <div className="p-3 bg-white rounded-full shadow-sm">
                          <Plus className="w-6 h-6 text-slate-400" />
                       </div>
                       <div>
                          <p className="text-sm font-bold text-slate-900">Add New Gateway</p>
                          <p className="text-[10px] text-slate-400">Connect to international banks or wallets</p>
                       </div>
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>
      </div>
      
      {/* Footer / AI Monitoring */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-10 flex flex-col md:flex-row gap-12 items-center justify-between relative overflow-hidden">
         <div className="absolute right-0 top-0 opacity-10">
            <Lock className="w-64 h-64 -rotate-12 translate-x-32" />
         </div>
         
         <div className="relative z-10 max-w-xl space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                  <Fingerprint className="w-6 h-6 text-blue-400" />
               </div>
               <div>
                  <h3 className="text-xl font-bold text-white tracking-tight uppercase italic">Vault Guard™ AI Monitoring</h3>
                  <p className="text-blue-400 text-xs font-bold uppercase tracking-widest mt-0.5">Real-time fraud detection active</p>
               </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">Hệ thống AI giám sát mọi giao dịch 24/7 để phát hiện các hành vi bất thường như rửa tiền, gian lận thẻ hoặc nạp tiền ảo. Tự động đóng băng tài khoản khi có rủi ro cao để bảo vệ tài sản của Doanh nghiệp.</p>
         </div>

         <div className="relative z-10 flex flex-col gap-3 min-w-[240px]">
            <button className="w-full py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-slate-100 transition-all shadow-xl text-sm flex items-center justify-center gap-2">
               Fraud Analysis Report <BarChart2 className="w-4 h-4" />
            </button>
            <button className="w-full py-4 bg-white/5 text-white font-bold rounded-2xl hover:bg-white/10 transition-all border border-white/10 text-sm flex items-center justify-center gap-2">
               Security Audit Log <History className="w-4 h-4" />
            </button>
         </div>
      </div>
    </div>
  );
}
