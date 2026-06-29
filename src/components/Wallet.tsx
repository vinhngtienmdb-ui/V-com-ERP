import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useEffect } from 'react';
import { 
 Users,
 Coins,
 Gift,
 Settings2,
 List,
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
 BarChart2,
 Activity,
 ArrowLeftRight,
 Landmark,
 X,
 CreditCard as CardIcon,
 Zap,
 Globe,
 Settings as SettingsIcon,
 CreditCard as CreditCardIcon
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { WalletTransaction, EscrowAccount, PaymentGateway, BankAccount, PaymentLink } from '../types/erp';
import { motion, AnimatePresence } from 'motion/react';
import { sePayService, SePayTransaction } from '../services/sepayService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MOCK_CHART_DATA = [
 { name: '01/04', income: 45000000, expense: 20000000 },
 { name: '05/04', income: 52000000, expense: 35000000 },
 { name: '10/04', income: 48000000, expense: 45000000 },
 { name: '15/04', income: 70000000, expense: 25000000 },
 { name: '20/04', income: 65000000, expense: 30000000 },
];

const MOCK_BANK_ACCOUNTS: BankAccount[] = [
 { id: 'BANK-01', bankName: 'Vietcombank', accountNumber: '2191 0201 229', accountName: 'VCOMM ERP CORP', type: 'checking', balance: 5400000000, isDefault: true },
 { id: 'BANK-02', bankName: 'Techcombank', accountNumber: '1122 0033 445', accountName: 'VCOMM ERP TECHNOLOGY', type: 'savings', balance: 1200000000, isDefault: false },
];

const MOCK_TRANSACTIONS: WalletTransaction[] = [
 { id: 'TXN-101', userId: 'USR-882', type: 'deposit', amount: 5000000, gateway: 'momo', status: 'success', timestamp: '16/03/2024 14:20' },
 { id: 'TXN-102', userId: 'SEL-001', type: 'payout', amount: 15400000, gateway: 'internal', status: 'success', timestamp: '16/03/2024 11:00' },
 { id: 'TXN-103', userId: 'USR-441', type: 'payment', amount: 1200000, gateway: 'zalopay', status: 'pending', timestamp: '16/03/2024 16:45' },
];

const MOCK_ESCROWS: EscrowAccount[] = [
 { orderId: 'ORD-9901', amount: 2500000, sellerId: 'SEL-001', buyerId: 'USR-882', releaseStatus: 'locked', autoReleaseAt: '20/03/2024' },
 { orderId: 'ORD-9902', amount: 890000, sellerId: 'SEL-005', buyerId: 'USR-129', releaseStatus: 'released', autoReleaseAt: '14/03/2024' },
];

const MOCK_GATEWAYS: PaymentGateway[] = [
 { id: 'GW-001', name: 'VNPay QR & ATM', provider: 'vnpay', status: 'active', transactionFee: 0.8, isPreferred: true },
 { id: 'GW-002', name: 'MoMo E-Wallet', provider: 'momo', status: 'active', transactionFee: 1.0, isPreferred: false },
 { id: 'GW-003', name: 'ZaloPay Wallet', provider: 'zalopay', status: 'maintenance', transactionFee: 1.2, isPreferred: false },
 { id: 'GW-004', name: 'Napas Portal', provider: 'napas', status: 'active', transactionFee: 0.5, isPreferred: false },
 { id: 'GW-005', name: 'Thẻ Quốc tế (Visa/Master)', provider: 'credit_card', status: 'inactive', transactionFee: 2.5, isPreferred: false },
];

export function WalletHub() {
 const [activeTab, setActiveTab] = useState<'history' | 'escrow' | 'gateway' | 'banking' | 'crm_wallet'>('history');
 const [sepayTransactions, setSepayTransactions] = useState<SePayTransaction[]>([]);
 const [isSyncing, setIsSyncing] = useState(false);
 const [showActionModal, setShowActionModal] = useState<'deposit' | 'withdraw' | null>(null);
  // Close action modal on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowActionModal(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showActionModal]);
 const [transactionAmount, setTransactionAmount] = useState('');
 const [selectedBank, setSelectedBank] = useState(MOCK_BANK_ACCOUNTS[0]);
 const [gateways, setGateways] = useState(MOCK_GATEWAYS);

 const [searchHistory, setSearchHistory] = useState('');
 const [filterType, setFilterType] = useState('all');
 const [filterStatus, setFilterStatus] = useState('all');
 const [filterDate, setFilterDate] = useState('');
 const [crmHistoryTab, setCrmHistoryTab] = useState<'all' | 'cashback' | 'promo' | 'loyalty'>('all');

 const filteredTransactions = MOCK_TRANSACTIONS.filter((txn) => {
 if (searchHistory && !txn.id.toLowerCase().includes(searchHistory.toLowerCase()) && !txn.userId.toLowerCase().includes(searchHistory.toLowerCase())) return false;
 if (filterType !== 'all' && txn.type !== filterType) return false;
 if (filterStatus !== 'all' && txn.status !== filterStatus) return false;
 if (filterDate) {
 const [y, m, d] = filterDate.split('-');
 const formattedFilterDate = `${d}/${m}/${y}`;
 if (!txn.timestamp.startsWith(formattedFilterDate)) return false;
 }
 return true;
 });

 const setPreferredGateway = (id: string) => {
 setGateways(gateways.map(gw => ({
 ...gw,
 isPreferred: gw.id === id
 })));
 };

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

 const handleTransaction = () => {
 const type = showActionModal === 'deposit' ? 'Nạp tiền' : 'Rút tiền';
 alert(`${type} thành công: ${formatCurrency(Number(transactionAmount))} qua ${selectedBank.bankName}`);
 setShowActionModal(null);
 setTransactionAmount('');
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
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 {/* Action Modal */}
 <AnimatePresence>
 {showActionModal && (
 <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
 <motion.div 
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 exit={{ opacity: 0, scale: 0.95 }}
 className="bg-white rounded-lg w-full max-w-md shadow-sm overflow-hidden"
 >
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
 <h3 className="text-xl font-black text-slate-900 tracking-tight italic uppercase">
 {showActionModal === 'deposit' ? 'Nạp tiền vào ví' : 'Rút tiền về ngân hàng'}
 </h3>
 <button onClick={() => setShowActionModal(null)} className="p-2 hover:bg-white rounded-lg transition-all">
 <X className="w-6 h-6 text-slate-500" />
 </button>
 </div>
 <div className="p-6 space-y-6">
 <div className="space-y-2">
 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Số tiền (VNĐ)</label>
 <input 
 type="number" 
 className="w-full bg-slate-50 border border-slate-300 rounded-lg px-6 py-4 text-2xl font-black text-slate-900 focus:ring-4 focus:ring-blue-50 focus:border-slate-900 transition-all outline-none"
 placeholder="0"
 value={transactionAmount}
 onChange={(e) => setTransactionAmount(e.target.value)}
 />
 </div>
 
 <div className="space-y-3">
 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
 {showActionModal === 'deposit' ? 'Nguồn tiền' : 'Ngân hàng nhận'}
 </label>
 <div className="space-y-2">
 {MOCK_BANK_ACCOUNTS.map(bank => (
 <button 
 key={bank.id}
 onClick={() => setSelectedBank(bank)}
 className={cn(
 "w-full p-4 rounded-lg border-2 flex items-center justify-between transition-all group",
 selectedBank.id === bank.id ? "border-slate-900 bg-slate-100" : "border-slate-200 bg-white hover:border-slate-300"
 )}
 >
 <div className="flex items-center gap-3">
 <div className={cn(
 "w-10 h-10 rounded-lg flex items-center justify-center text-[#FAF9F5]",
 selectedBank.id === bank.id ? "bg-slate-900" : "bg-slate-200"
 )}>
 <Landmark className="w-5 h-5" />
 </div>
 <div className="text-left">
 <p className={cn("text-sm font-bold", selectedBank.id === bank.id ? "text-primary-900" : "text-slate-800")}>{bank.bankName}</p>
 <p className="text-[10px] text-slate-500 font-mono italic">{bank.accountNumber}</p>
 </div>
 </div>
 {selectedBank.id === bank.id && (
 <div className="w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center">
 <CheckCircle2 className="w-3 h-3 text-[#FAF9F5]" />
 </div>
 )}
 </button>
 ))}
 </div>
 </div>

 <div className="pt-4 flex gap-4">
 <button 
 onClick={() => setShowActionModal(null)}
 className="flex-1 py-4 bg-white border border-slate-300 text-slate-500 font-bold rounded-lg hover:bg-slate-50 transition-all text-xs uppercase tracking-widest"
 >
 Hủy bỏ
 </button>
 <button 
 onClick={handleTransaction}
 className="flex-[2] py-4 bg-slate-900 text-[#FAF9F5] rounded-lg font-black text-xs uppercase tracking-[0.2em] shadow-sm shadow-blue-200 hover:bg-slate-800 active:scale-95 transition-all"
 >
 Xác nhận giao dịch
 </button>
 </div>
 </div>
 </motion.div>
 </div>
 )}
 </AnimatePresence>

 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Ví Tài chính & Ký quỹ (Kho lưu trữ Số)</h1>
 <p className="text-sm text-[#6B7280] mt-1">Hệ thống thanh toán tập trung, Quản lý dòng tiền và Bảo mật giao dịch Ký quỹ.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <RefreshCcw className="w-4 h-4" />
 Đối soát tự động
 </button>
 <button className="bg-[#111827] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Fingerprint className="w-4 h-4 text-primary-500" /> Cài đặt Bảo mật
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-3 gap-6" columns={3} gap={24}>
 {/* Main Wallet Card */}
 <div className="lg:col-span-2 relative h-[240px] rounded-lg bg-slate-900 p-6 text-[#FAF9F5] shadow-sm shadow-slate-900/5 overflow-hidden group">
 <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
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
 <p className="text-[10px] font-bold text-blue-200/60 uppercase">Tiền Ký quỹ</p>
 <p className="text-lg font-bold text-[#FAF9F5]">{formatCurrency(8500000000)}</p>
 </div>
 </div>

 <div className="flex justify-between items-end border-t border-white/10 pt-6">
 <div className="flex gap-6">
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
 <button 
 onClick={() => setShowActionModal('deposit')}
 className="bg-white text-primary-750 px-6 py-2.5 rounded-lg font-bold text-sm shadow-sm shadow-blue-900/10 hover:bg-slate-100 transition-all"
 >
 Nạp ví
 </button>
 <button 
 onClick={() => setShowActionModal('withdraw')}
 className="bg-white/10 hover:bg-white/20 border border-white/10 backdrop-blur-md px-6 py-2.5 rounded-lg font-bold text-sm transition-all"
 >
 Rút tiền
 </button>
 </div>
 </div>
 </div>
 </div>

 {/* Phân tích Dòng tiền */}
 <div className="lg:col-span-1 bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
 <div>
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-primary-50 rounded-lg">
 <Activity className="w-4 h-4 text-primary-600" />
 </div>
 <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Cashflow Analytics</p>
 </div>
 <TrendingUp className="w-4 h-4 text-emerald-500" />
 </div>
 <div className="h-[120px] w-full">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={MOCK_CHART_DATA}>
 <defs>
 <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--app-primary-500, #003991)" stopOpacity={0.1}/>
 <stop offset="95%" stopColor="var(--app-primary-500, #003991)" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <Area type="monotone" dataKey="income" stroke="var(--app-primary-500, #003991)" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 <div className="pt-4 border-t border-stone-50 flex justify-between items-center">
 <div>
 <p className="text-[10px] font-bold text-slate-500 uppercase">Dự báo tăng trưởng</p>
 <p className="text-lg font-black text-slate-900">+24.5%</p>
 </div>
 <button className="p-2 hover:bg-slate-50 rounded-lg transition-all text-primary-750">
 <ArrowRight className="w-5 h-5" />
 </button>
 </div>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden p-2 min-h-[600px]">
 <div className="flex border-b border-slate-200 bg-slate-50/50 p-1.5 overflow-x-auto scrollbar-hide min-w-0">
 {[
 { id: 'history', label: 'Lịch sử giao dịch', icon: History },
 { id: 'banking', label: 'Tài khoản Ngân hàng', icon: Landmark },
 { id: 'escrow', label: 'Bảo mật Ký quỹ', icon: ShieldCheck },
 { id: 'gateway', label: 'Cổng thanh toán', icon: Smartphone },
 { id: 'crm_wallet', label: 'Tích điểm & Ví CSKH', icon: Users }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "flex-1 px-6 py-3.5 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 w-full",
 activeTab === tab.id ? "bg-white text-primary-750 shadow-sm" : "text-slate-600 hover:text-slate-800"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 <div className="p-6">
 <AnimatePresence mode="wait">
 {activeTab === 'history' && (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="space-y-6"
 >
 <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center bg-slate-50 p-4 rounded-lg">
 <div className="relative flex-1 group w-full xl:max-w-md">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
 <input 
 type="text" 
 value={searchHistory}
 onChange={(e) => setSearchHistory(e.target.value)}
 placeholder="Tìm theo Mã GD, User ID..." 
 className="w-full bg-white border border-slate-300 rounded-lg pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
 />
 </div>
 <div className="flex flex-wrap gap-2 w-full xl:w-auto">
 <input 
 type="date"
 value={filterDate}
 onChange={(e) => setFilterDate(e.target.value)}
 className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-900"
 />
 <select 
 value={filterType}
 onChange={(e) => setFilterType(e.target.value)}
 className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-900"
 >
 <option value="all">Loại GD: Tất cả</option>
 <option value="deposit">Nạp tiền</option>
 <option value="withdraw">Rút tiền</option>
 <option value="payment">Thanh toán</option>
 <option value="payout">Payout</option>
 </select>
 <select 
 value={filterStatus}
 onChange={(e) => setFilterStatus(e.target.value)}
 className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:border-slate-900"
 >
 <option value="all">Trạng thái: Tất cả</option>
 <option value="success">Thành công</option>
 <option value="pending">Đang xử lý</option>
 <option value="failed">Thất bại</option>
 </select>
 <button className="px-4 py-2 bg-[#111827] text-[#FAF9F5] rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all ml-auto xl:ml-0">
 Xuất CSV <ArrowDownRight className="w-3.5 h-3.5" />
 </button>
 </div>
 </div>

 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left whitespace-nowrap">
 <thead>
 <tr className="border-b border-slate-200">
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mã Giao dịch</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loại giao dịch</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Số tiền (VNĐ)</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gateway</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Thời gian</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {filteredTransactions.length === 0 ? (
 <tr>
 <td colSpan={6} className="py-6 text-center text-sm text-slate-600 font-medium">Không tìm thấy giao dịch nào phù hợp.</td>
 </tr>
 ) : filteredTransactions.map(txn => (
 <tr key={txn.id} className="hover:bg-slate-50 transition-all group">
 <td className="px-6 py-4">
 <div className="flex items-center gap-2">
 <div className={cn("w-1.5 h-1.5 rounded-full", txn.type === 'deposit' ? "bg-emerald-500" : "bg-slate-800")} />
 <span className="text-xs font-mono font-bold text-slate-900 group-hover:text-primary-750">{txn.id}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={cn(
 "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight",
 txn.type === 'deposit' ? "bg-emerald-50 text-emerald-600" :
 txn.type === 'payout' ? "bg-slate-100 text-primary-750" : "bg-slate-100 text-slate-700"
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
 <Smartphone className="w-3.5 h-3.5 text-slate-500" />
 </div>
 <span className="text-xs font-bold text-slate-600 uppercase">{txn.gateway}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex justify-center">
 <span className={cn(
 "px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5",
 txn.status === 'success' ? "bg-emerald-500 text-[#FAF9F5]" : "bg-amber-100 text-amber-700"
 )}>
 {txn.status === 'success' ? <CheckCircle2 className="w-3 h-3" /> : <RefreshCcw className="w-3 h-3 animate-spin" />}
 {txn.status === 'success' ? 'SUCCESS' : 'PENDING'}
 </span>
 </div>
 </td>
 <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{txn.timestamp}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </motion.div>
 )}

 {activeTab === 'banking' && (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="space-y-8"
 >
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-2 gap-6" columns={2} gap={24}>
 {MOCK_BANK_ACCOUNTS.map(bank => (
 <div key={bank.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
 <Landmark className="w-32 h-32 rotate-12" />
 </div>
 
 <div className="flex justify-between items-start relative z-10">
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-[#FAF9F5] shadow-sm">
 <Building2 className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-black text-slate-900 leading-none">{bank.bankName}</h4>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{bank.type} account</p>
 </div>
 </div>
 <div>
 <p className="text-[10px] font-bold text-slate-500 uppercase">Account Number</p>
 <p className="text-xl font-mono font-bold text-slate-800 tracking-wider mt-1">{bank.accountNumber}</p>
 </div>
 <div>
 <p className="text-[10px] font-bold text-slate-500 uppercase">Account Holder</p>
 <p className="text-sm font-black text-slate-900 tracking-tight uppercase italic">{bank.accountName}</p>
 </div>
 </div>
 <div className="text-right">
 {bank.isDefault && (
 <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-lg mb-4">Primary</div>
 )}
 <p className="text-[10px] font-bold text-slate-500 uppercase">Balance</p>
 <p className="text-2xl font-black text-slate-900">{formatCurrency(bank.balance)}</p>
 </div>
 </div>

 <div className="mt-8 pt-6 border-t border-stone-50 flex justify-between items-center relative z-10">
 <div className="flex gap-2">
 <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all text-slate-500 hover:text-primary-750">
 <SettingsIcon className="w-4 h-4" />
 </button>
 <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all text-slate-500 hover:text-primary-750">
 <ArrowLeftRight className="w-4 h-4" />
 </button>
 </div>
 <button className="px-4 py-2 bg-slate-900 text-[#FAF9F5] text-xs font-black uppercase rounded-lg shadow-sm shadow-blue-200 hover:bg-slate-800 transition-all flex items-center gap-2">
 Manage Bank <ChevronRight className="w-3 h-3" />
 </button>
 </div>
 </div>
 ))}
 
 <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-4 hover:bg-slate-100 transition-all cursor-pointer group">
 <div className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center  transition-transform">
 <Plus className="w-8 h-8 text-slate-500" />
 </div>
 <div>
 <h4 className="font-bold text-slate-900 text-lg">Link New Bank Account</h4>
 <p className="text-xs text-slate-600 max-w-[200px] mx-auto mt-1">Connect your corporate bank account for instant payouts.</p>
 </div>
 </div>
 </DraggableGrid>

 <div className="bg-slate-900 rounded-lg p-6 text-[#FAF9F5] flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm shadow-blue-200 overflow-hidden relative">
 <div className="absolute top-0 right-0 p-6 opacity-10">
 <Globe className="w-48 h-48" />
 </div>
 <div className="relative z-10 max-w-lg space-y-4">
 <div className="flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full w-fit">
 <Zap className="w-3.5 h-3.5 text-yellow-400" />
 <span className="text-[9px] font-black uppercase tracking-[0.2em]">Live Settlement</span>
 </div>
 <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Instant Settlement Protocol</h3>
 <p className="text-sm text-blue-100/80 leading-relaxed uppercase font-bold tracking-tight">Rút tiền về ngay lập tức 24/7 kể cả ngày lễ và cuối tuần qua hệ thống Napas 247. Phí giao dịch cố định chỉ 1.100đ.</p>
 </div>
 <button className="relative z-10 px-6 py-5 bg-white text-primary-750 rounded-lg font-black text-sm uppercase tracking-widest shadow-sm hover:bg-slate-100 transition-all active:scale-95 whitespace-nowrap">
 Cấu hình Rút tiền nhanh
 </button>
 </div>
 </motion.div>
 )}

 {activeTab === 'escrow' && (
 <motion.div 
 initial={{ opacity: 0, scale: 0.98 }}
 animate={{ opacity: 1, scale: 1 }}
 className="space-y-8"
 >
 <div className="bg-slate-900 rounded-lg p-6 text-[#FAF9F5] relative overflow-hidden flex flex-col md:flex-row gap-6 items-center">
 <div className="relative z-10 space-y-4 max-w-md">
 <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/20 rounded-full w-fit">
 <ShieldCheck className="w-4 h-4 text-primary-500" />
 <span className="text-[10px] font-black uppercase tracking-widest text-primary-500">Security Standard v4.2</span>
 </div>
 <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Escrow Smart Protocol</h3>
 <p className="text-sm text-slate-500 leading-relaxed">Tiền người mua được chuyển trực tiếp vào Vault của Sàn (Đã khóa). Khi Logistics xác nhận "Giao hàng thành công", hệ thống tự động giải ngân cho Người bán sau 7 ngày (Retention Period), đảm bảo an toàn 100%.</p>
 <div className="flex gap-4 pt-4">
 <div className="text-center">
 <p className="text-[10px] font-bold text-slate-600 uppercase">Retention Time</p>
 <p className="text-lg font-bold text-[#FAF9F5]">07 Days</p>
 </div>
 <div className="w-px h-10 bg-white/10" />
 <div className="text-center">
 <p className="text-[10px] font-bold text-slate-600 uppercase">Protection Level</p>
 <p className="text-lg font-bold text-emerald-400">MAXIMUM</p>
 </div>
 </div>
 </div>
 <DraggableGrid className="relative z-10 flex-1 grid grid-cols-3 gap-2" columns={3} gap={8}>
 {['BUYER PAYS', 'ESCROW LOCK', 'SELLER PAID'].map((step, i) => (
 <div key={i} className="flex flex-col items-center gap-4">
 <div className={cn(
 "w-16 h-16 rounded-lg flex items-center justify-center border-2",
 i === 1 ? "bg-slate-900 border-slate-900 shadow-[0_0_20px_rgba(37,99,235,0.4)]" : "border-white/10 bg-white/5"
 )}>
 {i === 0 ? <CreditCard className="w-6 h-6" /> : i === 1 ? <Lock className="w-6 h-6" /> : <Unlock className="w-6 h-6" />}
 </div>
 <p className="text-[10px] font-bold text-[#FAF9F5] text-center opacity-60 px-2">{step}</p>
 </div>
 ))}
 <div className="col-span-3 h-0.5 bg-white/10 mt-4 relative">
 <div className="absolute top-0 left-0 w-2/3 h-full bg-slate-800 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
 </div>
 </DraggableGrid>
 </div>

 <div className="bg-white border border-slate-200 rounded-lg overflow-hidden overflow-x-auto min-w-0">
 <table className="w-full text-left whitespace-nowrap">
 <thead>
 <tr className="border-b border-stone-50">
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mã đơn hàng</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số tiền Ký quỹ</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Các bên tham gia</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
 <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ngày giải ngân</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {MOCK_ESCROWS.map(escrow => (
 <tr key={escrow.orderId} className="hover:bg-slate-50 transition-all">
 <td className="px-6 py-4 text-sm font-bold text-slate-900 group">{escrow.orderId}</td>
 <td className="px-6 py-4 text-sm font-black text-primary-750">{formatCurrency(escrow.amount)}</td>
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-slate-500 uppercase">Seller: {escrow.sellerId}</span>
 <span className="text-[10px] font-bold text-slate-500 uppercase">Người mua: {escrow.buyerId}</span>
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
 <Unlock className="w-3 h-3" /> Đã giải ngân
 </div>
 )}
 </div>
 </td>
 <td className="px-6 py-4 text-right text-[10px] font-black text-slate-500">{escrow.autoReleaseAt}</td>
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
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" columns={3} gap={24}>
 <div className="lg:col-span-3 border-l-4 border-slate-900 bg-slate-100/50 p-6 rounded-lg mb-4 flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-white rounded-lg shadow-sm flex items-center justify-center">
 <Building2 className="w-6 h-6 text-primary-750" />
 </div>
 <div>
 <h4 className="font-bold text-slate-900">SePay Bank Hub Connection</h4>
 <p className="text-xs text-slate-600">Đang đồng bộ hóa dữ liệu từ 3 tài khoản ngân hàng liên kết.</p>
 </div>
 </div>
 <div className="flex items-center gap-6">
 <div className="text-right">
 <p className="text-[10px] font-bold text-slate-500 uppercase">Trạng thái API</p>
 <div className="flex items-center gap-1.5 text-emerald-600">
 <div className={cn("w-1.5 h-1.5 bg-emerald-500 rounded-full", isSyncing && "animate-ping")} />
 <span className="text-xs font-bold font-mono">{isSyncing ? 'SYNCING...' : 'CONNECTED'}</span>
 </div>
 </div>
 <button 
 onClick={syncBankHub}
 disabled={isSyncing}
 className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-primary-750 hover:bg-white shadow-sm transition-all flex items-center gap-2"
 >
 <RefreshCcw className={cn("w-3 h-3", isSyncing && "animate-spin")} />
 Refresh Balance
 </button>
 </div>
 </div>
 {gateways.map(gw => (
 <div key={gw.id} className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm hover:shadow-sm transition-all relative group overflow-hidden">
 {gw.isPreferred && (
 <div className="absolute top-0 right-0 p-4">
 <div className="px-2 py-1 bg-slate-900 text-[#FAF9F5] text-[8px] font-black uppercase rounded-lg shadow-sm">Preferred</div>
 </div>
 )}
 
 <div className="flex gap-4">
 <div className={cn(
 "w-14 h-14 rounded-lg flex items-center justify-center text-[#FAF9F5] shadow-sm shrink-0",
 gw.provider === 'vnpay' ? "bg-slate-800" :
 gw.provider === 'momo' ? "bg-pink-600" :
 gw.provider === 'zalopay' ? "bg-slate-900 text-[#FAF9F5]" : "bg-slate-900"
 )}>
 {gw.provider === 'credit_card' ? <CreditCard className="w-7 h-7" /> : <Smartphone className="w-7 h-7" />}
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-slate-900">{gw.name}</h4>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1.5">{gw.id}</p>
 <div className="flex items-center gap-1 mt-1 flex-wrap">
 <span className="text-[8px] font-bold bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded uppercase">E-Commerce</span>
 <span className="text-[8px] font-bold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded uppercase">iPOS</span>
 </div>
 </div>
 </div>

 <div className="mt-4 flex justify-between items-end">
 <div>
 <p className="text-[10px] font-bold text-slate-500 uppercase">Phí giao dịch (Phí giao dịch)</p>
 <p className="text-xl font-black text-slate-900">{gw.transactionFee}%</p>
 </div>
 <div className={cn(
 "px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5",
 gw.status === 'active' ? "bg-emerald-50 text-emerald-600" :
 gw.status === 'maintenance' ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-500"
 )}>
 <div className={cn("w-1.5 h-1.5 rounded-full animate-pulse", gw.status === 'active' ? "bg-emerald-500" : "bg-amber-500")} />
 {gw.status.toUpperCase()}
 </div>
 </div>

 <div className="mt-4 pt-4 border-t border-stone-50 flex items-center justify-between gap-2">
 <div className="flex flex-1 items-center gap-2 text-[10px] font-bold text-slate-500">
 <Wifi className="w-3 h-3 text-emerald-500" /> API Connected
 </div>
 {!gw.isPreferred && (
 <button 
 onClick={() => setPreferredGateway(gw.id)}
 className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase rounded transition-all"
 >
 Đặt mặc định
 </button>
 )}
 <button className="text-primary-750 text-[10px] font-black hover:underline flex items-center gap-1">
 Cấu hình <ExternalLink className="w-3 h-3" />
 </button>
 </div>
 </div>
 ))}
 <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer hover:bg-slate-100 transition-all">
 <div className="p-3 bg-white rounded-full shadow-sm">
 <Plus className="w-6 h-6 text-slate-500" />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900">Add New Gateway</p>
 <p className="text-[10px] text-slate-500">Connect to international banks or wallets</p>
 </div>
 </div>
 </DraggableGrid>
 </motion.div>
 )}
 
 {activeTab === 'crm_wallet' && (
 <motion.div 
 initial={{ opacity: 0, y: 10 }}
 animate={{ opacity: 1, y: 0 }}
 className="space-y-8"
 >
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-3 gap-6" columns={3} gap={24}>
 {/* Points Earning Config */}
 <div className="bg-white p-6 rounded-lg border border-purple-100 shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-5">
 <Gift className="w-24 h-24 rotate-12" />
 </div>
 <div className="relative z-10 space-y-4">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-10 h-10 bg-purple-50 flex items-center justify-center rounded-lg text-purple-600">
 <Gift className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-slate-900 leading-tight">Tích điểm Loyalty</h3>
 <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Quy tắc sinh điểm</p>
 </div>
 </div>
 
 <div className="bg-slate-50 rounded-lg p-4 space-y-3">
 <div className="flex justify-between items-center text-sm">
 <span className="text-slate-700 font-bold">Số tiền chi tiêu (VNĐ)</span>
 <input type="text" className="w-24 text-right px-2 py-1 border border-slate-300 rounded block focus:outline-none" defaultValue="10,000" />
 </div>
 <div className="flex justify-center">
 <ArrowDownRight className="w-4 h-4 text-slate-500" />
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-purple-600 font-bold">Điểm Loyalty tương ứng</span>
 <input type="text" className="w-24 text-right px-2 py-1 border border-purple-200 rounded block focus:outline-none text-purple-700 bg-purple-50 font-bold" defaultValue="1" />
 </div>
 </div>
 <div className="pt-2">
 <button onClick={() => alert('Đã cập nhật quy tắc tích điểm')} className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[11px] uppercase tracking-wider transition-colors">
 Lưu Cấu Hình
 </button>
 </div>
 </div>
 </div>

 {/* Points to Promo Conversion */}
 <div className="bg-white p-6 rounded-lg border border-primary-100 shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-5">
 <ArrowLeftRight className="w-24 h-24 -rotate-12" />
 </div>
 <div className="relative z-10 space-y-4">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-10 h-10 bg-primary-50 flex items-center justify-center rounded-lg text-primary-600">
 <ArrowLeftRight className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-slate-900 leading-tight">Hoàn tiền / Đổi điểm</h3>
 <p className="text-[10px] text-slate-600 uppercase tracking-widest font-bold">Loyalty &rarr; Ví Khuyến Mại</p>
 </div>
 </div>
 
 <div className="bg-slate-50 rounded-lg p-4 space-y-3">
 <div className="flex justify-between items-center text-sm">
 <span className="text-purple-600 font-bold">Ví Điểm Loyalty</span>
 <input type="text" className="w-24 text-right px-2 py-1 border border-purple-200 rounded block focus:outline-none bg-purple-50 text-purple-700" defaultValue="1" />
 </div>
 <div className="flex justify-center">
 <ArrowDownRight className="w-4 h-4 text-slate-500" />
 </div>
 <div className="flex justify-between items-center text-sm">
 <span className="text-primary-600 font-bold">Ví Khuyến Mại (VNĐ)</span>
 <input type="text" className="w-24 text-right px-2 py-1 border border-blue-200 rounded block focus:outline-none text-blue-700 bg-primary-50 font-bold" defaultValue="10,000" />
 </div>
 <div className="border-t border-slate-300 pt-3 mt-3 flex justify-between items-center text-sm">
 <span className="text-slate-700 font-bold">Thời hạn hiệu lực (Ngày)</span>
 <input type="text" className="w-24 text-right px-2 py-1 border border-slate-300 rounded block focus:outline-none bg-white text-slate-900 font-bold" defaultValue="30" />
 </div>
 <p className="text-[10px] text-slate-600 italic text-right mt-1">Hệ thống sẽ dọn dẹp các KM hết hạn tự động.</p>
 </div>
 <div className="pt-2">
 <button onClick={() => alert('Đã cập nhật quy tắc quy đổi')} className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg text-[11px] uppercase tracking-wider transition-colors">
 Lưu Quy Đổi
 </button>
 </div>
 </div>
 </div>

 {/* View Histories */}
 <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 flex flex-col justify-between shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-10">
 <History className="w-32 h-32" />
 </div>
 <div className="relative z-10">
 <h3 className="text-xl font-black text-white italic">Tra cứu Giao dịch</h3>
 <p className="text-sm text-slate-500 mt-2">Truy xuất lịch sử giao dịch và biến động số dư của từng nền tảng ví riêng biệt.</p>
 </div>
 <div className="relative z-10 space-y-2 mt-6">
 <button onClick={() => alert('Đang mở: Lịch sử nạp rút Ví Cashback hoàn tiền.')} className="w-full bg-slate-800 hover:bg-emerald-900/50 text-emerald-400 border border-emerald-900/50 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all text-left px-4 flex justify-between items-center group">
 <span>Lịch Sử Cashback</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
 </button>
 <button onClick={() => alert('Đang mở: Báo cáo tiêu dùng Ví Khuyến mại voucher.')} className="w-full bg-slate-800 hover:bg-blue-900/50 text-blue-400 border border-blue-900/50 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all text-left px-4 flex justify-between items-center group">
 <span>Sổ Phụ Khuyến Mại</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
 </button>
 <button onClick={() => alert('Đang mở: Lịch sử tích lũy/đổi Ví Điểm Loyalty.')} className="w-full bg-slate-800 hover:bg-purple-900/50 text-purple-400 border border-purple-900/50 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-all text-left px-4 flex justify-between items-center group">
 <span>Lịch Sử Điểm Loyalty</span> <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
 </button>
 </div>
 </div>
 </DraggableGrid>
 
 <div className="bg-white border border-slate-300 rounded-lg shadow-sm">
 <div className="p-6 border-b border-slate-200 flex flex-col gap-4">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-slate-100 flex items-center justify-center rounded-lg text-slate-700">
 <List className="w-5 h-5" />
 </div>
 <div>
 <h3 className="font-bold text-lg text-slate-900">Chi tiết Biến động Ví gần đây</h3>
 <p className="text-xs text-slate-600 font-bold uppercase tracking-widest">Khách hàng & Đối tác (Real-time)</p>
 </div>
 </div>
 <div className="flex gap-2">
 <input type="text" placeholder="Tìm theo Username, ID..." className="px-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary-500" />
 <button className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm font-bold">
 <Filter className="w-4 h-4" /> Lọc
 </button>
 </div>
 </div>
 
 <div className="flex gap-2">
 {[
 { id: 'all', label: 'Tất cả Giao Dịch' },
 { id: 'cashback', label: 'Ví Cashback' },
 { id: 'promo', label: 'Ví Khuyến Mại' },
 { id: 'loyalty', label: 'Ví Điểm Loyalty' }
 ].map(tab => (
 <button 
 key={tab.id}
 onClick={() => setCrmHistoryTab(tab.id as any)}
 className={cn(
 "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
 crmHistoryTab === tab.id 
 ? "bg-slate-900 text-white shadow-sm" 
 : "bg-slate-50 text-slate-600 hover:bg-slate-100"
 )}
 >
 {tab.label}
 </button>
 ))}
 </div>
 </div>
 <div className="overflow-x-auto min-w-0">
 <table className="w-full whitespace-nowrap">
 <thead>
 <tr className="bg-slate-50 text-[10px] font-bold text-slate-600 uppercase tracking-widest text-left">
 <th className="px-6 py-4">Đối tượng</th>
 <th className="px-6 py-4">Loại Ví</th>
 <th className="px-6 py-4 w-full">Giao dịch / Chuyển đổi</th>
 <th className="px-6 py-4 text-right">Biến động</th>
 <th className="px-6 py-4 text-right">Số dư mới</th>
 <th className="px-6 py-4">Thời gian</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {[
 { user: 'vinh.ngtienmdb', role: 'Khách hàng', type: 'cashback', typeLabel: 'Cashback', action: 'Hoàn tiền mua sắm đơn ORD-9121', icon: RefreshCcw, amount: '+50,000', curr: 'VNĐ', class: 'text-emerald-600', time: '12 thg 5, 2024 14:02' },
 { user: 'vinh.ngtienmdb', role: 'Khách hàng', type: 'promo', typeLabel: 'Khuyến Mại', action: 'Đổi từ Cashback sang Khuyến mại', icon: ArrowLeftRight, amount: '+55,000', curr: 'VNĐ', class: 'text-primary-600', time: '12 thg 5, 2024 14:05' },
 { user: 'kh_0911', role: 'Khách hàng', type: 'loyalty', typeLabel: 'Loyalty', action: 'Tích điểm đơn hàng tự động', icon: RefreshCcw, amount: '+12', curr: 'Pts', class: 'text-purple-600', time: '11 thg 5, 2024 09:30' },
 { user: 'kh_0911', role: 'Khách hàng', type: 'promo', typeLabel: 'Khuyến Mại', action: 'Quy đổi Điểm Loyalty ra Vourcher KM', icon: ArrowLeftRight, amount: '+120,000', curr: 'VNĐ', class: 'text-primary-600', time: '11 thg 5, 2024 10:15' },
 { user: 'seller_thuyvan', role: 'Seller', type: 'cashback', typeLabel: 'Cashback', action: 'Thanh toán đơn hàng (Trừ Ví KH)', icon: CreditCard, amount: '-150,000', curr: 'VNĐ', class: 'text-slate-700', time: '10 thg 5, 2024 08:20' },
 { user: 'store_q7', role: 'Cửa hàng', type: 'promo', typeLabel: 'Khuyến Mại', action: 'Khách hàng áp dụng Ví Khuyến Mại', icon: Gift, amount: '-50,000', curr: 'VNĐ', class: 'text-slate-700', time: '09 thg 5, 2024 19:45' },
 ].filter(row => crmHistoryTab === 'all' || row.type === crmHistoryTab).map((row, i) => (
 <tr key={i} className="hover:bg-slate-50">
 <td className="px-6 py-4">
 <div className="font-bold text-slate-900 text-sm">{row.user}</div>
 <div className="text-[10px] text-slate-600 uppercase font-bold mt-0.5 tracking-wider">{row.role}</div>
 </td>
 <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.type === 'cashback' ? 'bg-emerald-50 text-emerald-700' : row.type === 'promo' ? 'bg-primary-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{row.typeLabel}</span></td>
 <td className="px-6 py-4 text-sm text-slate-700">
 <div className="flex items-center gap-2">
 <row.icon className="w-3.5 h-3.5 text-slate-500" />
 <span>{row.action}</span>
 </div>
 </td>
 <td className={`px-6 py-4 font-bold text-right ${row.class}`}>{row.amount} {row.curr}</td>
 <td className="px-6 py-4 font-mono text-sm text-right font-medium text-slate-500">***</td>
 <td className="px-6 py-4 text-xs font-bold text-slate-500">{row.time}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </motion.div>
 )}

</AnimatePresence>
 </div>
 </div>
 
 {/* Footer / AI Monitoring */}
 <div className="bg-slate-900 rounded-lg p-6 flex flex-col md:flex-row gap-6 items-center justify-between relative overflow-hidden">
 <div className="absolute right-0 top-0 opacity-10">
 <Lock className="w-64 h-64 -rotate-12 translate-x-32" />
 </div>
 
 <div className="relative z-10 max-w-xl space-y-6">
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center border border-white/10">
 <Fingerprint className="w-6 h-6 text-primary-500" />
 </div>
 <div>
 <h3 className="text-xl font-bold text-[#FAF9F5] tracking-tight uppercase italic">Vault Guard™ AI Monitoring</h3>
 <p className="text-primary-500 text-xs font-bold uppercase tracking-widest mt-0.5">Real-time fraud detection active</p>
 </div>
 </div>
 <p className="text-sm text-slate-500 leading-relaxed">Hệ thống AI giám sát mọi giao dịch 24/7 để phát hiện các hành vi bất thường như rửa tiền, gian lận thẻ hoặc nạp tiền ảo. Tự động đóng băng tài khoản khi có rủi ro cao để bảo vệ tài sản của Doanh nghiệp.</p>
 </div>

 <div className="relative z-10 flex flex-col gap-3 w-full">
 <button className="w-full py-4 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-all shadow-sm text-sm flex items-center justify-center gap-2">
 Fraud Analysis Report <BarChart2 className="w-4 h-4" />
 </button>
 <button className="w-full py-4 bg-slate-900/5 text-[#FAF9F5] font-bold rounded-lg hover:bg-slate-900/10 transition-all border border-white/10 text-sm flex items-center justify-center gap-2">
 Security Audit Log <History className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 );
}
