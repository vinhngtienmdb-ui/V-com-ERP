import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
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
  { id: 'BANK-01', bankName: 'MB Bank (Quân Đội)', accountNumber: '0318914439', accountName: 'CONG TY CP THUONG MAI DIEN TU VCOMM', type: 'checking', balance: 18450000000, isDefault: true },
  { id: 'BANK-02', bankName: 'Vietcombank', accountNumber: '2191 0201 229', accountName: 'CONG TY CP THUONG MAI DIEN TU VCOMM', type: 'checking', balance: 5400000000, isDefault: false },
  { id: 'BANK-03', bankName: 'Techcombank', accountNumber: '1122 0033 445', accountName: 'CONG TY CP THUONG MAI DIEN TU VCOMM', type: 'savings', balance: 1200000000, isDefault: false },
];

const MOCK_TRANSACTIONS: WalletTransaction[] = [
  { id: 'APIPAY-TXN-8812', userId: 'ORD-VC-8899', type: 'payment', amount: 450000, gateway: 'apipay', status: 'success', timestamp: '14/09/2026 12:45' },
  { id: 'APIPAY-PAY-019', userId: 'SELLER-SHOP-01', type: 'payout', amount: 8250000, gateway: 'apipay', status: 'success', timestamp: '14/09/2026 11:30' },
  { id: 'TXN-101', userId: 'USR-882', type: 'deposit', amount: 5000000, gateway: 'momo', status: 'success', timestamp: '14/09/2026 10:20' },
  { id: 'TXN-102', userId: 'SEL-001', type: 'payout', amount: 15400000, gateway: 'internal', status: 'success', timestamp: '14/09/2026 09:00' },
  { id: 'TXN-103', userId: 'USR-441', type: 'payment', amount: 1200000, gateway: 'zalopay', status: 'pending', timestamp: '14/09/2026 08:45' },
];

const MOCK_ESCROWS: EscrowAccount[] = [
  { orderId: 'ORD-VC-8899', amount: 450000, sellerId: 'SEL-001', buyerId: 'USR-882', releaseStatus: 'locked', autoReleaseAt: '21/09/2026' },
  { orderId: 'ORD-9901', amount: 2500000, sellerId: 'SEL-001', buyerId: 'USR-882', releaseStatus: 'locked', autoReleaseAt: '20/09/2026' },
  { orderId: 'ORD-9902', amount: 890000, sellerId: 'SEL-005', buyerId: 'USR-129', releaseStatus: 'released', autoReleaseAt: '14/09/2026' },
];

const MOCK_GATEWAYS: PaymentGateway[] = [
  { id: 'GW-APIPAY', name: 'Cổng thanh toán APIPay (Official)', provider: 'apipay' as any, status: 'active', transactionFee: 0.5, isPreferred: true },
  { id: 'GW-001', name: 'VietQR Napas247 Dynamic', provider: 'vnpay', status: 'active', transactionFee: 0.0, isPreferred: true },
  { id: 'GW-002', name: 'MoMo E-Wallet', provider: 'momo', status: 'active', transactionFee: 1.0, isPreferred: false },
  { id: 'GW-003', name: 'ZaloPay Wallet', provider: 'zalopay', status: 'active', transactionFee: 1.2, isPreferred: false },
  { id: 'GW-004', name: 'Napas Portal', provider: 'napas', status: 'active', transactionFee: 0.5, isPreferred: false },
  { id: 'GW-005', name: 'Thẻ Quốc tế (Visa/Master)', provider: 'credit_card', status: 'inactive', transactionFee: 2.2, isPreferred: false },
];

export function WalletHub() {
  const [activeTab, setActiveTab] = useState<'apipay' | 'history' | 'escrow' | 'gateway' | 'banking' | 'crm_wallet'>('apipay');
 const [sepayTransactions, setSepayTransactions] = useState<SePayTransaction[]>([]);
 const [isSyncing, setIsSyncing] = useState(false);
 const [showActionModal, setShowActionModal] = useState<'deposit' | 'withdraw' | null>(null);
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
 <p className={cn("text-sm font-bold", selectedBank.id === bank.id ? "text-blue-900" : "text-slate-800")}>{bank.bankName}</p>
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

  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs mb-6">
    <div className="flex items-center gap-3.5">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0">
        <Wallet className="w-6 h-6" />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            Cổng Thanh Toán & Quản Lý Dòng Tiền (Payment Hub)
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            APIPay & VietQR 24/7
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Tích hợp Cổng thanh toán APIPay (Thu hộ QR/VA dưới 1s, Chi hộ Payout 24/7), VietQR Napas247 &amp; Ký quỹ Escrow T+7
        </p>
      </div>
    </div>

    <div className="flex items-center gap-2.5 shrink-0">
      <button 
        onClick={() => {
          setIsSyncing(true);
          setTimeout(() => setIsSyncing(false), 1200);
        }}
        className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
      >
        <RefreshCcw className={cn("w-3.5 h-3.5 text-blue-600", isSyncing && "animate-spin")} />
        <span>{isSyncing ? "Đang đối soát..." : "Đối soát APIPay & VietQR"}</span>
      </button>
      <button 
        onClick={() => setShowActionModal('deposit')}
        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
      >
        <Plus className="w-3.5 h-3.5 text-emerald-400" />
        <span>Nạp / Rút ví</span>
      </button>
    </div>
  </div>

  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
    {/* Main Wallet Card */}
    <div className="lg:col-span-2 relative h-[230px] rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 text-white shadow-md border border-slate-800 overflow-hidden flex flex-col justify-between">
      <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
        <QrCode className="w-56 h-56 rotate-12" />
      </div>
      
      <div className="relative z-10 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full w-fit border border-white/15">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">Ví Doanh Nghiệp Xác Thực • MB Bank 0318914439</span>
          </div>
          <p className="text-xs font-medium text-slate-400 mt-3 uppercase tracking-wider">Tổng số dư khả dụng</p>
          <h2 className="text-3xl sm:text-4xl font-black mt-1 tracking-tight text-white">{formatCurrency(24500000000)}</h2>
        </div>
        <div className="text-right bg-white/5 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quỹ Ký Quỹ Escrow T+7</p>
          <p className="text-base font-black text-amber-300">{formatCurrency(8500000000)}</p>
        </div>
      </div>

      <div className="relative z-10 flex justify-between items-end border-t border-white/10 pt-4">
        <div className="flex gap-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Thu hộ APIPay hôm nay</p>
            <p className="text-sm font-black text-emerald-400">+142.500.000₫</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chi hộ Payout 24/7</p>
            <p className="text-sm font-black text-rose-400">-38.200.000₫</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowActionModal('deposit')}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            Nạp ví
          </button>
          <button 
            onClick={() => setShowActionModal('withdraw')}
            className="bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer"
          >
            Rút tiền
          </button>
        </div>
      </div>
    </div>

    {/* Cashflow Analytics Card */}
    <div className="lg:col-span-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider">Biểu đồ dòng tiền</p>
          </div>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> +24.5%
          </span>
        </div>
        <div className="h-[120px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_CHART_DATA}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Cổng thanh toán chính</span>
          <p className="font-bold text-slate-900">APIPay & VietQR Napas247</p>
        </div>
        <button 
          onClick={() => setActiveTab('apipay')}
          className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
        >
          <span>Chi tiết</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </div>

  {/* Tabs Switcher and Content */}
  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden min-h-[600px]">
    <div className="flex border-b border-slate-100 bg-slate-50/50 p-2 overflow-x-auto scrollbar-hide min-w-0 gap-1.5">
      {[
        { id: 'apipay', label: 'Cổng APIPay (Trọng tâm)', icon: Zap, highlight: true },
        { id: 'history', label: 'Lịch sử giao dịch', icon: History },
        { id: 'banking', label: 'Tài khoản Ngân hàng', icon: Landmark },
        { id: 'escrow', label: 'Bảo mật Ký quỹ T+7', icon: ShieldCheck },
        { id: 'gateway', label: 'Danh sách Cổng TT', icon: Smartphone },
        { id: 'crm_wallet', label: 'Ví V-Xu & Hoàn tiền', icon: Users }
      ].map((tab) => (
        <button 
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={cn(
            "px-4 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer",
            activeTab === tab.id 
              ? tab.highlight 
                ? "bg-amber-500 text-slate-950 shadow-xs" 
                : "bg-white text-slate-900 shadow-2xs border border-slate-200/80" 
              : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
          )}
        >
          <tab.icon className={cn("w-3.5 h-3.5", tab.highlight && activeTab === tab.id ? "text-slate-950" : tab.highlight ? "text-amber-500" : "")} /> 
          <span>{tab.label}</span>
          {tab.highlight && (
            <span className="px-1.5 py-0.2 bg-rose-600 text-white text-[9px] font-black rounded-md">HOT</span>
          )}
        </button>
      ))}
    </div>

    <div className="p-5 sm:p-6">
      <AnimatePresence mode="wait">
        {activeTab === 'apipay' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top Gateway Status Card */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white border border-slate-700 shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-md">
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-white tracking-tight">Cổng Thanh Toán Trực Tuyến APIPay (Official Gateway)</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Sẵn sàng 24/7 (Production)
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Thu hộ đơn hàng TMĐT qua QR động & Virtual Account &lt; 1s • Chi hộ Payout Napas247 hoàn tiền V-Xu và giải ngân Shop Escrow T+7
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Merchant ID</span>
                    <span className="font-mono font-bold text-amber-300">VCOMM_ECOM_PROD</span>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-xs text-right">
                    <span className="text-[10px] text-slate-400 block uppercase">Webhook IPN</span>
                    <span className="font-mono font-bold text-emerald-400">HMAC-SHA256</span>
                  </div>
                </div>
              </div>

              {/* 3 Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5">
                <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng Thu Hộ Hôm Nay (QR & VA)</span>
                  <div className="text-2xl font-black text-emerald-400 mt-1">142.500.000₫</div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">28 giao dịch • Tỷ lệ thành công 100%</span>
                </div>
                <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tổng Chi Hộ Payout 24/7</span>
                  <div className="text-2xl font-black text-amber-300 mt-1">38.200.000₫</div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Hoàn tiền V-Xu 100% & Quyết toán Seller</span>
                </div>
                <div className="bg-white/5 rounded-xl p-3.5 border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tốc Độ Gạch Nợ Tức Thời</span>
                  <div className="text-2xl font-black text-cyan-300 mt-1">420 ms</div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Tự động kích hoạt đơn hàng ➔ Điều phối 3PL</span>
                </div>
              </div>
            </div>

            {/* Two Column Workspace: Tool 1: Create APIPay Charge | Tool 2: Webhook Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Box 1: Test Tạo Giao Dịch Thu Hộ APIPay */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-sm">Tạo Link & QR Thanh Toán APIPay (Test Inward)</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Mã đơn hàng liên kết</label>
                    <input 
                      type="text" 
                      defaultValue="ORD-VC-2026-8899"
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 block mb-1">Số tiền thanh toán (VND)</label>
                    <input 
                      type="number" 
                      defaultValue={450000}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-emerald-950">Tài khoản định danh (Virtual Account):</p>
                      <p className="font-mono text-emerald-700 text-[11px] mt-0.5">MB Bank: 0318914439 - VCOMM</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-md">Dynamic VietQR</span>
                  </div>
                  <button 
                    onClick={() => alert('Đã sinh mã thanh toán APIPay thành công: Chuyển hướng tới Cổng APIPay hoặc quét mã VietQR!')}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                  >
                    Sinh mã thanh toán APIPay (Create Charge)
                  </button>
                </div>
              </div>

              {/* Box 2: Giả Lập Webhook IPN APIPay */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h4 className="font-bold text-slate-900 text-sm">Giả Lập Webhook IPN từ APIPay (Webhook Tester)</h4>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-slate-500">
                    Khi khách hàng thanh toán tại ngân hàng bất kỳ, APIPay sẽ tự động bắn Webhook kèm chữ ký số HMAC-SHA256 về Core Gateway để gạch nợ đơn sang <span className="font-bold text-emerald-700">PAID</span> và đẩy đơn sang 3PL.
                  </p>
                  <div className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] space-y-1 overflow-x-auto">
                    <p className="text-slate-400">// Sample Payload IPN POST /api/v1/payments/apipay-webhook</p>
                    <p>{"{"}</p>
                    <p>&nbsp;&nbsp;"transactionId": "APIPAY-TXN-998822",</p>
                    <p>&nbsp;&nbsp;"orderId": "ORD-VC-2026-8899",</p>
                    <p>&nbsp;&nbsp;"amount": 450000,</p>
                    <p>&nbsp;&nbsp;"status": "SUCCESS",</p>
                    <p>&nbsp;&nbsp;"signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e..."</p>
                    <p>{"}"}</p>
                  </div>
                  <button 
                    onClick={async () => {
                      try {
                        const res = await fetch('/api/v1/orders/sync-from-ecommerce', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            orderId: 'ORD-VC-' + Math.floor(1000 + Math.random() * 9000),
                            total: 450000,
                            paymentMethod: 'apipay',
                            customerName: 'Nguyễn Văn A (APIPay Test)',
                            customerPhone: '0988776655',
                            shippingAddress: 'Tòa nhà Landmark 81, Bình Thạnh, TP.HCM',
                            carrierId: 'ghn'
                          })
                        });
                        if (res.ok) {
                          alert('✅ Giả lập Webhook IPN APIPay thành công! Đơn hàng đã tự động chuyển sang PAID và kích hoạt lấy mã vận đơn 3PL!');
                        } else {
                          alert('Đã gửi Webhook IPN thử nghiệm tới Gateway.');
                        }
                      } catch (e: any) {
                        alert('Đã gửi Webhook IPN thử nghiệm: ' + e.message);
                      }
                    }}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span>Bắn Webhook IPN Giả Lập Gạch Nợ & Tạo 3PL</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Realtime APIPay Live Stream Transactions Table */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Nhật Ký Giao Dịch APIPay & VietQR Thời Gian Thực</h4>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Cập nhật theo mili-giây (Realtime)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3">Mã GD APIPay</th>
                      <th className="px-5 py-3">Mã Đơn / Đối tượng</th>
                      <th className="px-5 py-3">Loại giao dịch</th>
                      <th className="px-5 py-3 text-right">Số tiền (VND)</th>
                      <th className="px-5 py-3 text-center">Chữ ký HMAC</th>
                      <th className="px-5 py-3 text-center">Trạng thái gạch nợ</th>
                      <th className="px-5 py-3 text-right">Thời gian</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-indigo-700">APIPAY-TXN-8812</td>
                      <td className="px-5 py-3 font-mono text-slate-900">#ORD-VC-8899</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Thu hộ VietQR
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-emerald-600">+450.000₫</td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          HMAC-OK 🟢
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          Đã gạch nợ & GHN ⚡
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500 text-[11px]">14/09/2026 12:45</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-indigo-700">APIPAY-PAY-019</td>
                      <td className="px-5 py-3 font-mono text-slate-900">SELLER-SHOP-01</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Chi hộ Payout Escrow
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-rose-600">-8.250.000₫</td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          HMAC-OK 🟢
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Napas247 Hoàn tất
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500 text-[11px]">14/09/2026 11:30</td>
                    </tr>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-indigo-700">APIPAY-REFUND-004</td>
                      <td className="px-5 py-3 font-mono text-slate-900">REFUND-VXU-441</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Hoàn tiền mặt V-Xu 100%
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-black text-rose-600">-1.200.000₫</td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          HMAC-OK 🟢
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Đã chi trả TT99
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-slate-500 text-[11px]">14/09/2026 10:15</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

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
 className="w-full bg-white border border-slate-300 rounded-lg pl-12 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
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
 <span className="text-xs font-mono font-bold text-slate-900 group-hover:text-orange-700">{txn.id}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className={cn(
 "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight",
 txn.type === 'deposit' ? "bg-emerald-50 text-emerald-600" :
 txn.type === 'payout' ? "bg-slate-100 text-orange-700" : "bg-slate-100 text-slate-700"
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
 <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all text-slate-500 hover:text-orange-700">
 <SettingsIcon className="w-4 h-4" />
 </button>
 <button className="p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all text-slate-500 hover:text-orange-700">
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
 <button className="relative z-10 px-6 py-5 bg-white text-orange-700 rounded-lg font-black text-sm uppercase tracking-widest shadow-sm hover:bg-slate-100 transition-all active:scale-95 whitespace-nowrap">
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
 <ShieldCheck className="w-4 h-4 text-orange-500" />
 <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Security Standard v4.2</span>
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
 <td className="px-6 py-4 text-sm font-black text-orange-700">{formatCurrency(escrow.amount)}</td>
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
 <Building2 className="w-6 h-6 text-orange-700" />
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
 className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-orange-700 hover:bg-white shadow-sm transition-all flex items-center gap-2"
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
 <button className="text-orange-700 text-[10px] font-black hover:underline flex items-center gap-1">
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
 <div className="bg-white p-6 rounded-lg border border-blue-100 shadow-sm relative overflow-hidden">
 <div className="absolute top-0 right-0 p-4 opacity-5">
 <ArrowLeftRight className="w-24 h-24 -rotate-12" />
 </div>
 <div className="relative z-10 space-y-4">
 <div className="flex items-center gap-2 mb-2">
 <div className="w-10 h-10 bg-blue-50 flex items-center justify-center rounded-lg text-blue-600">
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
 <span className="text-blue-600 font-bold">Ví Khuyến Mại (VNĐ)</span>
 <input type="text" className="w-24 text-right px-2 py-1 border border-blue-200 rounded block focus:outline-none text-blue-700 bg-blue-50 font-bold" defaultValue="10,000" />
 </div>
 <div className="border-t border-slate-300 pt-3 mt-3 flex justify-between items-center text-sm">
 <span className="text-slate-700 font-bold">Thời hạn hiệu lực (Ngày)</span>
 <input type="text" className="w-24 text-right px-2 py-1 border border-slate-300 rounded block focus:outline-none bg-white text-slate-900 font-bold" defaultValue="30" />
 </div>
 <p className="text-[10px] text-slate-600 italic text-right mt-1">Hệ thống sẽ dọn dẹp các KM hết hạn tự động.</p>
 </div>
 <div className="pt-2">
 <button onClick={() => alert('Đã cập nhật quy tắc quy đổi')} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-[11px] uppercase tracking-wider transition-colors">
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
 <input type="text" placeholder="Tìm theo Username, ID..." className="px-4 py-2 border border-slate-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-orange-600" />
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
 { user: 'vinh.ngtienmdb', role: 'Khách hàng', type: 'promo', typeLabel: 'Khuyến Mại', action: 'Đổi từ Cashback sang Khuyến mại', icon: ArrowLeftRight, amount: '+55,000', curr: 'VNĐ', class: 'text-blue-600', time: '12 thg 5, 2024 14:05' },
 { user: 'kh_0911', role: 'Khách hàng', type: 'loyalty', typeLabel: 'Loyalty', action: 'Tích điểm đơn hàng tự động', icon: RefreshCcw, amount: '+12', curr: 'Pts', class: 'text-purple-600', time: '11 thg 5, 2024 09:30' },
 { user: 'kh_0911', role: 'Khách hàng', type: 'promo', typeLabel: 'Khuyến Mại', action: 'Quy đổi Điểm Loyalty ra Vourcher KM', icon: ArrowLeftRight, amount: '+120,000', curr: 'VNĐ', class: 'text-blue-600', time: '11 thg 5, 2024 10:15' },
 { user: 'seller_thuyvan', role: 'Seller', type: 'cashback', typeLabel: 'Cashback', action: 'Thanh toán đơn hàng (Trừ Ví KH)', icon: CreditCard, amount: '-150,000', curr: 'VNĐ', class: 'text-slate-700', time: '10 thg 5, 2024 08:20' },
 { user: 'store_q7', role: 'Cửa hàng', type: 'promo', typeLabel: 'Khuyến Mại', action: 'Khách hàng áp dụng Ví Khuyến Mại', icon: Gift, amount: '-50,000', curr: 'VNĐ', class: 'text-slate-700', time: '09 thg 5, 2024 19:45' },
 ].filter(row => crmHistoryTab === 'all' || row.type === crmHistoryTab).map((row, i) => (
 <tr key={i} className="hover:bg-slate-50">
 <td className="px-6 py-4">
 <div className="font-bold text-slate-900 text-sm">{row.user}</div>
 <div className="text-[10px] text-slate-600 uppercase font-bold mt-0.5 tracking-wider">{row.role}</div>
 </td>
 <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${row.type === 'cashback' ? 'bg-emerald-50 text-emerald-700' : row.type === 'promo' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>{row.typeLabel}</span></td>
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
 <Fingerprint className="w-6 h-6 text-orange-500" />
 </div>
 <div>
 <h3 className="text-xl font-bold text-[#FAF9F5] tracking-tight uppercase italic">Vault Guard™ AI Monitoring</h3>
 <p className="text-orange-500 text-xs font-bold uppercase tracking-widest mt-0.5">Real-time fraud detection active</p>
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
