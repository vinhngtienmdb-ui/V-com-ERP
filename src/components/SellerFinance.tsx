import React, { useState, useEffect } from 'react';
import { 
  BadgeDollarSign, 
  TrendingUp, 
  CreditCard, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  GanttChartSquare, 
  Wallet, 
  Zap,
  Info,
  ShieldCheck,
  Star,
  Banknote,
  PieChart,
  ArrowRight,
  Lock,
  Sparkles,
  Settings2,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { SellerCreditScore, EarlyPayoutRequest } from '../types/erp';
import { useNotifications } from '../context/NotificationContext';
import { db, doc, getDoc, collection, query, where, getDocs, addDoc } from '../services/dbService';
import { updateWalletBalance } from '../services/dbService';

// Extended type for Simulator
interface SimulatedSeller {
  sellerId: string;
  sellerName: string;
  gmvGrowth: number;       // 0-100 scale
  refundRate: number;       // 0-100 scale (high is good/low refund)
  buyerRating: number;      // 0-100 scale
  complianceIndex: number;  // 0-100 scale
  maxLimitBase: number;
  outstandingDebt: number;
  score: number;
  tier: 'AAA' | 'AA' | 'A' | 'B' | 'C';
  maxCreditLimit: number;
  availableCredit: number;
}

const INITIAL_SELLERS: SimulatedSeller[] = [
  { sellerId: 'SEL-001', sellerName: 'Thời Trang H&M Vietnam', gmvGrowth: 88, refundRate: 94, buyerRating: 92, complianceIndex: 95, maxLimitBase: 600000000, outstandingDebt: 150000000, score: 850, tier: 'AAA', maxCreditLimit: 500000000, availableCredit: 350000000 },
  { sellerId: 'SEL-005', sellerName: 'Gia Dụng LockLock', gmvGrowth: 75, refundRate: 85, buyerRating: 88, complianceIndex: 90, maxLimitBase: 300000000, outstandingDebt: 8000000, score: 720, tier: 'A', maxCreditLimit: 100000000, availableCredit: 92000000 },
  { sellerId: 'SEL-012', sellerName: 'Mỹ Phẩm Coco Lux', gmvGrowth: 92, refundRate: 98, buyerRating: 95, complianceIndex: 95, maxLimitBase: 800000000, outstandingDebt: 320000000, score: 940, tier: 'AAA', maxCreditLimit: 750000000, availableCredit: 430000000 },
  { sellerId: 'SEL-018', sellerName: 'Điện Máy Chợ Lớn', gmvGrowth: 60, refundRate: 72, buyerRating: 80, complianceIndex: 65, maxLimitBase: 400000000, outstandingDebt: 280000000, score: 580, tier: 'B', maxCreditLimit: 200000000, availableCredit: 0 },
  { sellerId: 'SEL-024', sellerName: 'Nông Sản Sạch Đà Lạt', gmvGrowth: 82, refundRate: 90, buyerRating: 85, complianceIndex: 92, maxLimitBase: 250000000, outstandingDebt: 10000000, score: 810, tier: 'AA', maxCreditLimit: 200000000, availableCredit: 190000000 }
];

const INITIAL_PAYOUTS: EarlyPayoutRequest[] = [
  { id: 'EPR-01', sellerId: 'SEL-001', amount: 45000000, discountFee: 450000, requestDate: '17/03/2026', status: 'pending' },
  { id: 'EPR-02', sellerId: 'SEL-012', amount: 15400000, discountFee: 154000, requestDate: '16/03/2026', status: 'approved' },
  { id: 'EPR-03', sellerId: 'SEL-005', amount: 82000000, discountFee: 820000, requestDate: '15/03/2026', status: 'disbursed' },
  { id: 'EPR-04', sellerId: 'SEL-018', amount: 23000000, discountFee: 230000, requestDate: '14/03/2026', status: 'pending' }
];

// Recharts mock data
const LIQUIDITY_TREND_DATA = [
  { month: 'T1', 'Quỹ khả dụng': 15000, 'Giải ngân sớm': 12000, 'Nợ xấu ước tính': 50 },
  { month: 'T2', 'Quỹ khả dụng': 16000, 'Giải ngân sớm': 13500, 'Nợ xấu ước tính': 48 },
  { month: 'T3', 'Quỹ khả dụng': 18000, 'Giải ngân sớm': 14200, 'Nợ xấu ước tính': 35 },
  { month: 'T4', 'Quỹ khả dụng': 20000, 'Giải ngân sớm': 17000, 'Nợ xấu ước tính': 62 },
  { month: 'T5', 'Quỹ khả dụng': 22000, 'Giải ngân sớm': 18500, 'Nợ xấu ước tính': 54 },
  { month: 'T6', 'Quỹ khả dụng': 25000, 'Giải ngân sớm': 21000, 'Nợ xấu ước tính': 60 }
];

export function SellerFinance() {
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'credit' | 'early_payout' | 'risk_analytics' | 'seller_wallet'>('credit');
  
  // Scoring weights configuration state
  const [weights, setWeights] = useState({
    gmvGrowth: 30,
    refundRate: 20,
    buyerRating: 25,
    complianceIndex: 25
  });
  
  const [sellers, setSellers] = useState<SimulatedSeller[]>(INITIAL_SELLERS);
  const [payouts, setPayouts] = useState<EarlyPayoutRequest[]>(INITIAL_PAYOUTS);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Credit line slide-over state
  const [selectedSeller, setSelectedSeller] = useState<SimulatedSeller | null>(null);
  const [newCreditLimit, setNewCreditLimit] = useState<number>(0);
  const [isSyncingMisa, setIsSyncingMisa] = useState(true);

  // Early Payout wizard state
  const [selectedPayout, setSelectedPayout] = useState<EarlyPayoutRequest | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1); // 1 to 4
  const [otpCode, setOtpCode] = useState('');
  const [isSigning, setIsSigning] = useState(false);

  // Loan Calculator states
  const [calcSellerId, setCalcSellerId] = useState('SEL-001');
  const [calcAmount, setCalcAmount] = useState(100000000);
  const [calcTerm, setCalcTerm] = useState(6);
  const [calcCollateral, setCalcCollateral] = useState<'inventory' | 'revenue' | 'guarantee'>('revenue');
  const [isSyncedLedger, setIsSyncedLedger] = useState(false);

  // Seller Wallet State (Mocked logged in seller)
  const currentSellerId = 'SEL-001';
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);

  useEffect(() => {
    if (activeTab === 'seller_wallet') {
      fetchWalletData();
    }
  }, [activeTab]);

  const fetchWalletData = async () => {
    setIsLoadingWallet(true);
    try {
      const sellerRef = doc(db, 'sellers', currentSellerId);
      const sellerSnap = await getDoc(sellerRef);
      if (sellerSnap.exists()) {
        setWalletBalance(Number(sellerSnap.data().walletBalance) || 0);
      }

      const q = query(
        collection(db, 'wallet_transactions'),
        where('userId', '==', currentSellerId)
      );
      const querySnapshot = await getDocs(q);
      const txns: any[] = [];
      querySnapshot.forEach((doc) => {
        txns.push({ id: doc.id, ...doc.data() });
      });
      txns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setWalletTransactions(txns);
    } catch (error) {
      console.error('Error fetching wallet data:', error);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const handleRequestWithdrawal = async () => {
    const amount = Number(withdrawalAmount);
    if (!amount || amount <= 0) {
      addNotification('Lỗi', 'Số tiền rút không hợp lệ');
      return;
    }
    if (amount > walletBalance) {
      addNotification('Lỗi', 'Số dư ví không đủ');
      return;
    }

    try {
      const withdrawalRef = collection(db, 'withdrawals');
      await addDoc(withdrawalRef, {
        sellerId: currentSellerId,
        amount: amount,
        status: 'pending',
        requestDate: new Date().toISOString(),
        bankAccount: '123456789 - Vietcombank' // Mock bank
      });

      await updateWalletBalance(currentSellerId, -amount, {
        type: 'withdraw',
        gateway: 'internal',
        status: 'pending'
      });

      addNotification('Thành công', 'Đã gửi yêu cầu rút tiền thành công');
      setShowWithdrawModal(false);
      setWithdrawalAmount('');
      fetchWalletData();
    } catch (error) {
      console.error('Error requesting withdrawal:', error);
      addNotification('Lỗi', 'Đã xảy ra lỗi khi tạo yêu cầu rút tiền');
    }
  };

  // Helpers for calculations
  const totalWeight = weights.gmvGrowth + weights.refundRate + weights.buyerRating + weights.complianceIndex;

  const calculateScore = (seller: SimulatedSeller, currentWeights: typeof weights) => {
    // Score based on weighted attributes (total weight must sum to 100)
    const factor = (
      seller.gmvGrowth * (currentWeights.gmvGrowth / 100) +
      seller.refundRate * (currentWeights.refundRate / 100) +
      seller.buyerRating * (currentWeights.buyerRating / 100) +
      seller.complianceIndex * (currentWeights.complianceIndex / 100)
    );
    const scoreVal = Math.round(factor * 10);
    return Math.min(1000, Math.max(100, scoreVal));
  };

  const getTierAndLimit = (score: number, baseLimit: number) => {
    let tier: 'AAA' | 'AA' | 'A' | 'B' | 'C' = 'C';
    let multiplier = 0.2;
    if (score >= 850) {
      tier = 'AAA';
      multiplier = 1.0;
    } else if (score >= 750) {
      tier = 'AA';
      multiplier = 0.8;
    } else if (score >= 650) {
      tier = 'A';
      multiplier = 0.5;
    } else if (score >= 500) {
      tier = 'B';
      multiplier = 0.3;
    }
    const maxCreditLimit = Math.round(baseLimit * multiplier);
    return { tier, maxCreditLimit };
  };

  // Run scoring simulation
  const handleRunSimulation = () => {
    if (totalWeight !== 100) return;
    
    setIsSimulating(true);
    setTimeout(() => {
      const updatedSellers = sellers.map(seller => {
        const score = calculateScore(seller, weights);
        const { tier, maxCreditLimit } = getTierAndLimit(score, seller.maxLimitBase);
        const availableCredit = Math.max(0, maxCreditLimit - seller.outstandingDebt);
        return {
          ...seller,
          score,
          tier,
          maxCreditLimit,
          availableCredit
        };
      });
      setSellers(updatedSellers);
      setIsSimulating(false);
      addNotification(
        'Đã cập nhật xếp hạng tín dụng',
        'Điểm tín dụng và hạn mức của Sellers đã được tính toán lại theo trọng số mới.'
      );
    }, 800);
  };

  // Open credit assignment dialog
  const handleOpenCreditModal = (seller: SimulatedSeller) => {
    setSelectedSeller(seller);
    setNewCreditLimit(seller.maxCreditLimit);
  };

  // Confirm credit limit update
  const handleSaveCreditLimit = () => {
    if (!selectedSeller) return;
    
    setSellers(prev => prev.map(s => {
      if (s.sellerId === selectedSeller.sellerId) {
        return {
          ...s,
          maxCreditLimit: newCreditLimit,
          availableCredit: Math.max(0, newCreditLimit - s.outstandingDebt)
        };
      }
      return s;
    }));

    addNotification(
      'Hạn mức tín dụng mới được áp dụng',
      `Đã cấp hạn mức thấu chi ${formatCurrency(newCreditLimit)} cho ${selectedSeller.sellerName}.${isSyncingMisa ? ' Đã hạch toán MISA.' : ''}`
    );
    setSelectedSeller(null);
  };

  // Early payout approval wizard action
  const handleOpenPayoutWizard = (payout: EarlyPayoutRequest) => {
    setSelectedPayout(payout);
    setWizardStep(1);
    setOtpCode('');
  };

  const handleNextWizardStep = () => {
    if (wizardStep === 3) {
      setIsSigning(true);
      setTimeout(() => {
        setIsSigning(false);
        setWizardStep(4);
      }, 1000);
    } else {
      setWizardStep(prev => prev + 1);
    }
  };

  const handleCompletePayout = () => {
    if (!selectedPayout) return;
    
    setPayouts(prev => prev.map(p => {
      if (p.id === selectedPayout.id) {
        return { ...p, status: 'disbursed' };
      }
      return p;
    }));

    addNotification(
      'Giải ngân sớm thành công',
      `Số tiền ${formatCurrency(selectedPayout.amount - selectedPayout.discountFee)} đã được chuyển đến Seller.`
    );
    setSelectedPayout(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-xs font-sans">
      
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif tracking-tight text-2xl font-black text-slate-900">
            Supply Chain Finance (Hỗ trợ tài chính nhà bán)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Chấm điểm tín dụng Seller thông minh, cung cấp các giải pháp thấu chi và ứng vốn xoay vòng nhanh.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('risk_analytics')}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer bg-white border-slate-300 hover:bg-slate-100",
              activeTab === 'risk_analytics' && "bg-slate-900 border-slate-900 text-white hover:bg-slate-800"
            )}
          >
            <PieChart className="w-4 h-4" /> Báo cáo rủi ro nợ
          </button>
        </div>
      </div>

      {/* 2. Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 text-[#FAF9F5] p-5 rounded-lg border border-slate-850 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-800 rounded-lg">
              <BadgeDollarSign className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng dư nợ thấu chi</span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold">{formatCurrency(788000000)}</div>
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-500 font-bold">
              <TrendingUp className="w-3.5 h-3.5" /> Tỷ lệ nợ xấu: 0.12%
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-100 text-primary-600 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chờ duyệt ứng vốn</span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-slate-900">
              {payouts.filter(p => p.status === 'pending').length} yêu cầu
            </div>
            <p className="text-[10.5px] text-amber-600 font-medium mt-1">Cần đối soát thanh khoản sớm</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-100 text-emerald-600 rounded-lg">
              <Star className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Doanh thu phí dịch vụ</span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-primary-600">
              {formatCurrency(payouts.reduce((acc, p) => p.status === 'disbursed' ? acc + p.discountFee : acc, 0) + 1240000)}
            </div>
            <p className="text-[10.5px] text-emerald-600 font-medium mt-1">Dựa trên phí 1% giá trị giải ngân</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-3xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-slate-100 text-indigo-600 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Seller AAA (Tín nhiệm cao)</span>
          </div>
          <div className="mt-4">
            <div className="text-xl font-bold text-emerald-600">
              {sellers.filter(s => s.tier === 'AAA').length} đối tác
            </div>
            <p className="text-[10.5px] text-slate-500 mt-1">Đủ điều kiện hạn mức thấu chi đặc biệt</p>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tabs */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-3xs overflow-hidden">
        <div className="flex border-b border-slate-200">
          {[
            { id: 'credit', label: 'Tín dụng & Thấu chi Seller', icon: ShieldCheck },
            { id: 'early_payout', label: 'Yêu cầu Giải ngân sớm', icon: Banknote },
            { id: 'risk_analytics', label: 'Phân tích rủi ro & Thanh khoản', icon: PieChart },
            { id: 'seller_wallet', label: 'Ví Gian Hàng (Seller)', icon: Wallet }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-5 py-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer bg-transparent border-transparent text-slate-500 hover:text-slate-900",
                activeTab === tab.id && "border-blue-600 text-primary-600 bg-slate-50/50"
              )}
            >
              <tab.icon className="w-4.5 h-4.5" /> {tab.label}
            </button>
          ))}
        </div>

        {/* 4. Tab Content */}
        <div className="p-6">
          
          {/* TAB 1: Credit Score & Simulator */}
          {activeTab === 'credit' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Scoring Simulator Panel */}
                <div className="bg-slate-50 rounded-lg border border-slate-250 p-5 space-y-5">
                  <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                    <Settings2 className="w-4 h-4 text-primary-600" /> Trình mô phỏng chỉ số chấm điểm
                  </h3>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed">
                    Điều chỉnh trọng số của 4 nhóm chỉ số nghiệp vụ dưới đây (tổng trọng số phải bằng 100%) để cập nhật lại hạn mức thấu chi tự động.
                  </p>
                  
                  <div className="space-y-4 pt-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>Tăng trưởng GMV</span>
                        <span>{weights.gmvGrowth}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" step="5"
                        value={weights.gmvGrowth}
                        onChange={e => setWeights(prev => ({ ...prev, gmvGrowth: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>Tỷ lệ hoàn trả (Chất lượng)</span>
                        <span>{weights.refundRate}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" step="5"
                        value={weights.refundRate}
                        onChange={e => setWeights(prev => ({ ...prev, refundRate: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>Đánh giá từ người mua (CSKH)</span>
                        <span>{weights.buyerRating}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" step="5"
                        value={weights.buyerRating}
                        onChange={e => setWeights(prev => ({ ...prev, buyerRating: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-700">
                        <span>Chỉ số tuân thủ sàn (SLA)</span>
                        <span>{weights.complianceIndex}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" step="5"
                        value={weights.complianceIndex}
                        onChange={e => setWeights(prev => ({ ...prev, complianceIndex: parseInt(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-[10px] text-slate-500">Tổng trọng số:</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px]",
                        totalWeight === 100 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      )}>
                        {totalWeight}% {totalWeight === 100 ? '🟢 OK' : '⚠️ Lỗi'}
                      </span>
                    </div>

                    <button 
                      onClick={handleRunSimulation}
                      disabled={totalWeight !== 100 || isSimulating}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-xs disabled:opacity-40 flex items-center gap-1 cursor-pointer border-0"
                    >
                      {isSimulating ? (
                        <>🔄 Đang tính...</>
                      ) : (
                        <>⚡ Chạy mô phỏng</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sellers List Table */}
                <div className="lg:col-span-2 overflow-x-auto border border-slate-200 rounded-lg bg-white min-w-0">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mã / Tên Seller</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Score / Xếp hạng</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Dư nợ hiện tại</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">Hạn mức thấu chi</th>
                        <th className="px-5 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sellers.map(s => (
                        <tr key={s.sellerId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-bold text-slate-900">{s.sellerName}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{s.sellerId}</p>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-bold text-slate-800 text-[11.5px]">{s.score} / 1000</span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider",
                                s.tier === 'AAA' ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                                s.tier === 'AA' ? "bg-blue-100 text-blue-800" :
                                s.tier === 'A' ? "bg-indigo-100 text-indigo-800" :
                                "bg-amber-100 text-amber-800"
                              )}>
                                Tier {s.tier}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-slate-650">
                            {formatCurrency(s.outstandingDebt)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <p className="font-bold text-slate-900">{formatCurrency(s.maxCreditLimit)}</p>
                            <p className="text-[9.5px] text-primary-600 font-semibold mt-0.5">
                              Khả dụng: {formatCurrency(s.availableCredit)}
                            </p>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button 
                              onClick={() => handleOpenCreditModal(s)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-primary-600 rounded-lg font-bold border-0 cursor-pointer text-[10px]"
                            >
                              Cấp tín dụng
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* TAB 2: Early Payouts Requests */}
          {activeTab === 'early_payout' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Interactive Loan Calculator & Credit Agreement Generator */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-slate-50/50 p-5 rounded-lg border border-slate-200">
                
                {/* 1. Loan Calculator */}
                <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-200 shadow-3xs">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      <Settings2 className="w-4.5 h-4.5 text-blue-650" />
                      Công cụ Tính toán Lãi suất & Hạn mức vay Seller
                    </h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Tính toán lãi suất ưu đãi động dựa trên xếp hạng tín dụng AI và tài sản thế chấp.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Chọn Nhà bán hàng:</label>
                      <select
                        value={calcSellerId}
                        onChange={e => setCalcSellerId(e.target.value)}
                        className="w-full p-2 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                      >
                        {sellers.map(s => (
                          <option key={s.sellerId} value={s.sellerId}>{s.sellerName} ({s.tier})</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Số tiền vay (VND):</label>
                      <input
                        type="number"
                        value={calcAmount}
                        onChange={e => setCalcAmount(Math.max(0, Number(e.target.value)))}
                        className="w-full p-1.5 border border-slate-255 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Kỳ hạn vay:</label>
                      <select
                        value={calcTerm}
                        onChange={e => setCalcTerm(Number(e.target.value))}
                        className="w-full p-2 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                      >
                        <option value={1}>1 tháng (Ứng ngắn hạn)</option>
                        <option value={3}>3 tháng (Xoay vòng nhanh)</option>
                        <option value={6}>6 tháng (Trung hạn sản xuất)</option>
                        <option value={12}>12 tháng (Dài hạn mở rộng)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tài sản bảo đảm:</label>
                      <select
                        value={calcCollateral}
                        onChange={e => setCalcCollateral(e.target.value as any)}
                        className="w-full p-2 border border-slate-250 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                      >
                        <option value="revenue">Doanh thu tương lai trên sàn</option>
                        <option value="inventory">Hàng tồn kho ký gửi VComm</option>
                        <option value="guarantee">Bảo lãnh tài chính ngân hàng</option>
                      </select>
                    </div>
                  </div>

                  {/* Calculator Outputs */}
                  {(() => {
                    const sel = sellers.find(s => s.sellerId === calcSellerId) || sellers[0];
                    const baseRate = sel.tier === 'AAA' ? 5.5 : sel.tier === 'AA' ? 6.8 : sel.tier === 'A' ? 7.5 : sel.tier === 'B' ? 9.0 : 12.0;
                    const modifier = calcCollateral === 'inventory' ? -0.5 : calcCollateral === 'guarantee' ? -1.0 : 0;
                    const finalRate = Math.max(4.5, baseRate + modifier);
                    const interest = calcAmount * (finalRate / 100) * (calcTerm / 12);
                    const serviceFee = calcAmount * 0.01;
                    const totalPayable = calcAmount + interest;

                    return (
                      <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 font-medium">
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-450">Xếp hạng tín nhiệm AI:</span>
                          <span className="font-bold text-emerald-600">Tier {sel.tier} (Điểm: {sel.score})</span>
                        </div>
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-450">Lãi suất áp dụng:</span>
                          <span className="font-bold text-slate-900">{finalRate}% / năm</span>
                        </div>
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-450">Chi phí lãi vay dự kiến:</span>
                          <span className="font-bold text-red-650">+{formatCurrency(interest)}</span>
                        </div>
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-slate-450">Phí quản trị dịch vụ (1%):</span>
                          <span className="font-bold text-slate-700">{formatCurrency(serviceFee)}</span>
                        </div>
                        <div className="flex justify-between text-xs font-bold pt-2 border-t border-slate-200 text-slate-905">
                          <span>Tổng số tiền gốc & lãi phải trả:</span>
                          <span className="text-primary-600">{formatCurrency(totalPayable)}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 italic">
                          <span>Trả hàng tháng:</span>
                          <span>~{formatCurrency(totalPayable / calcTerm)} / tháng</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. Contract Preview */}
                {(() => {
                  const sel = sellers.find(s => s.sellerId === calcSellerId) || sellers[0];
                  const baseRate = sel.tier === 'AAA' ? 5.5 : sel.tier === 'AA' ? 6.8 : sel.tier === 'A' ? 7.5 : sel.tier === 'B' ? 9.0 : 12.0;
                  const modifier = calcCollateral === 'inventory' ? -0.5 : calcCollateral === 'guarantee' ? -1.0 : 0;
                  const finalRate = Math.max(4.5, baseRate + modifier);
                  const interest = calcAmount * (finalRate / 100) * (calcTerm / 12);
                  const totalPayable = calcAmount + interest;
                  const collateralName = calcCollateral === 'inventory' ? 'Hàng tồn kho ký gửi VComm' : calcCollateral === 'guarantee' ? 'Bảo lãnh ngân hàng' : 'Doanh thu tương lai trên sàn';

                  return (
                    <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-200 shadow-3xs flex flex-col justify-between">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <h3 className="text-xs font-extrabold text-slate-905 uppercase tracking-wide">
                            Xem trước Hợp đồng Tín dụng số
                          </h3>
                          <span className="text-[9px] bg-blue-100 text-primary-600 font-bold px-2 py-0.5 rounded">Được bảo vệ 🔒</span>
                        </div>
                        
                        <div className="p-3 bg-slate-900 text-[#FAF9F5] border border-slate-800 rounded-lg font-mono text-[9px] leading-relaxed max-h-[160px] overflow-y-auto select-text">
                          <p className="text-center font-bold text-amber-500">HỢP ĐỒNG TÍN DỤNG HẠN MỨC DOANH NGHIỆP</p>
                          <p className="text-center font-bold">Số: HĐTD/VCOMM/{Date.now().toString().slice(-5)}</p>
                          <p className="mt-2 text-slate-400">Bên Cho Vay: CỔNG TÀI CHÍNH VCOMM PLATFORM (VComm ERP)</p>
                          <p className="text-slate-400">Bên Vay: {sel.sellerName}</p>
                          <p className="mt-2">• Số tiền gốc vay: {formatCurrency(calcAmount)} (VNĐ)</p>
                          <p className="mt-1">• Thời hạn vay: {calcTerm} tháng kể từ ngày ký.</p>
                          <p className="mt-1">• Lãi suất áp dụng: {finalRate}% / năm (Tính trên dư nợ ban đầu).</p>
                          <p className="mt-1">• Tài sản bảo đảm thế chấp: {collateralName}.</p>
                          <p className="mt-1">• Tổng gốc & lãi phải trả: {formatCurrency(totalPayable)} (VNĐ).</p>
                          <p className="mt-3 text-slate-500">// Chữ ký số HSM xác minh của VComm Platform //</p>
                          <p className="text-emerald-500">KÝ BỞI: GIÁM ĐỐC TÀI CHÍNH (CFO) VCOMM ERP</p>
                          <p className="text-slate-500">Thời gian ký: {new Date().toLocaleDateString('vi-VN')}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            alert(`Đang tải xuống hợp đồng tín dụng số của ${sel.sellerName} thành công!`);
                          }}
                          className="flex-1 py-2 border border-slate-300 text-slate-700 bg-white hover:bg-slate-100 font-bold rounded-lg cursor-pointer border-0 text-xs flex items-center justify-center gap-1.5"
                        >
                          Tải Hợp đồng (.PDF)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSyncedLedger(true);
                            addNotification(
                              'Đồng bộ Kế toán',
                              `Đã tạo bút toán hạch toán tự động giải ngân hạn mức vay thấu chi của ${sel.sellerName} thành công.`
                            );
                            alert(`Đồng bộ bút toán kế toán thành công:\n- Nợ TK 1121 (Tiền gửi ngân hàng): ${formatCurrency(calcAmount - calcAmount*0.01)}\n- Nợ TK 635 (Chi phí tài chính - Lãi vay): ${formatCurrency(interest)}\n- Có TK 341 (Vay ngắn hạn): ${formatCurrency(calcAmount)}`);
                          }}
                          className={cn(
                            "flex-1 py-2 font-bold rounded-lg cursor-pointer border-0 text-xs flex items-center justify-center gap-1.5 text-white transition",
                            isSyncedLedger ? "bg-emerald-600 hover:bg-emerald-700" : "bg-slate-900 hover:bg-slate-800"
                          )}
                        >
                          {isSyncedLedger ? '✓ Đã đồng bộ Kế toán' : 'Đồng bộ hạch toán'}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex justify-between items-center pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Danh sách yêu cầu rút tiền sớm từ đơn hàng đã hoàn thành
                </span>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded">
                  Tổng lượng giao dịch: <span className="font-bold text-slate-800">{payouts.length} yêu cầu</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payouts.map(p => {
                  const sellerInfo = sellers.find(s => s.sellerId === p.sellerId);
                  return (
                    <div 
                      key={p.id} 
                      className="p-5 bg-white border border-slate-200 rounded-lg hover:border-blue-600 hover:shadow-2xs transition-all flex flex-col justify-between space-y-4"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
                            {p.id}
                          </span>
                          <h4 className="font-extrabold text-slate-900 mt-2 text-sm">
                            {sellerInfo ? sellerInfo.sellerName : p.sellerId}
                          </h4>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider",
                          p.status === 'pending' ? "bg-amber-100 text-amber-800 border border-amber-200" :
                          p.status === 'approved' ? "bg-blue-100 text-blue-800 border border-blue-200" :
                          "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        )}>
                          {p.status === 'pending' ? 'Đang chờ' : p.status === 'approved' ? 'Đã duyệt chi' : 'Đã giải ngân'}
                        </span>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-450">Số tiền ứng vốn:</span>
                          <span className="font-bold text-slate-800">{formatCurrency(p.amount)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-red-600 font-semibold">
                          <span>Phí ứng vốn (1%):</span>
                          <span>-{formatCurrency(p.discountFee)}</span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 border-t border-slate-50 font-bold text-slate-900">
                          <span>Thực nhận Napas:</span>
                          <span className="text-primary-600">{formatCurrency(p.amount - p.discountFee)}</span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-400 font-mono italic">
                        <span>Ngày tạo: {p.requestDate}</span>
                        {p.status === 'pending' && (
                          <button 
                            onClick={() => handleOpenPayoutWizard(p)}
                            className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold uppercase tracking-wider border-0 cursor-pointer text-[9.5px]"
                          >
                            Duyệt giải ngân
                          </button>
                        )}
                        {p.status === 'approved' && (
                          <button 
                            onClick={() => {
                              setSelectedPayout(p);
                              setWizardStep(3);
                            }}
                            className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-[#FAF9F5] rounded-lg font-bold uppercase tracking-wider border-0 cursor-pointer text-[9.5px]"
                          >
                            Ký duyệt & Chi
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Risk Analytics & Liquidity */}
          {activeTab === 'risk_analytics' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              
              {/* Liquidity Chart and Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Recharts trend */}
                <div className="lg:col-span-2 border border-slate-200 p-5 rounded-lg bg-white space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                      Xu hướng Dòng tiền & Yêu cầu giải ngân sớm
                    </h4>
                    <span className="text-[10px] text-slate-400 font-mono">Đơn vị: Triệu VND</span>
                  </div>

                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={LIQUIDITY_TREND_DATA} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAvailable" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPayouts" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 650, fill: '#64748B' }} />
                        <Tooltip />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="Quỹ khả dụng" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAvailable)" />
                        <Area type="monotone" dataKey="Giải ngân sớm" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPayouts)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Aging analysis & AI Insights */}
                <div className="space-y-6">
                  <div className="bg-slate-900 text-[#FAF9F5] p-5 rounded-lg border border-slate-850 space-y-4">
                    <h4 className="text-[10px] font-black text-amber-500 tracking-wider flex items-center gap-1.5 uppercase">
                      <Zap className="w-4 h-4 fill-current text-amber-500" /> AI Risk Intelligence
                    </h4>
                    <p className="text-[10.5px] text-slate-400 leading-relaxed font-medium">
                      Hệ thống tự động phát hiện sớm rủi ro thanh khoản nợ thấu chi chuỗi cung ứng.
                    </p>
                    <ul className="space-y-3.5 text-[10.5px] text-slate-300 font-medium">
                      <li className="flex items-start gap-2">
                        <span className="text-rose-500 text-xs">⚠️</span>
                        <span>
                          <strong>Ngành hàng Gia dụng:</strong> Dòng tiền thu về chậm 4.2% so với cùng kỳ. Đề xuất thắt chặt thấu chi 5% cho Tier B.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-emerald-500 text-xs">🟢</span>
                        <span>
                          <strong>LockLock (SEL-005):</strong> Điểm tín dụng tăng vượt kỳ vọng. Đề xuất mở rộng thấu chi thêm 50,000,000 đ.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-indigo-500 text-xs">🤖</span>
                        <span>
                          Thanh khoản quỹ ứng vốn sớm ở trạng thái <strong>An toàn (84%)</strong>. Đủ năng lực đáp ứng đợt sales Mega 6/6.
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>

              </div>

              {/* Debt Aging Table */}
              <div className="border border-slate-200 rounded-lg bg-white p-5 space-y-4">
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">
                  Chi tiết cơ cấu nợ thấu chi quá hạn (Debt Aging Breakdown)
                </h4>
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
                        <th className="px-5 py-3">Xếp hạng (Tier)</th>
                        <th className="px-5 py-3 text-right">Dư nợ trong hạn</th>
                        <th className="px-5 py-3 text-right">Quá hạn 1-30 ngày</th>
                        <th className="px-5 py-3 text-right">Quá hạn 31-60 ngày</th>
                        <th className="px-5 py-3 text-right">Quá hạn &gt;60 ngày</th>
                        <th className="px-5 py-3 text-center">Trạng thái rủi ro</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      <tr>
                        <td className="px-5 py-3.5 font-bold text-slate-900">Tier AAA</td>
                        <td className="px-5 py-3.5 text-right">{formatCurrency(470000000)}</td>
                        <td className="px-5 py-3.5 text-right">0 đ</td>
                        <td className="px-5 py-3.5 text-right">0 đ</td>
                        <td className="px-5 py-3.5 text-right">0 đ</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-bold">Rất An toàn</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3.5 font-bold text-slate-900">Tier AA</td>
                        <td className="px-5 py-3.5 text-right">{formatCurrency(190000000)}</td>
                        <td className="px-5 py-3.5 text-right">0 đ</td>
                        <td className="px-5 py-3.5 text-right">0 đ</td>
                        <td className="px-5 py-3.5 text-right">0 đ</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-bold">Rất An toàn</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3.5 font-bold text-slate-900">Tier A</td>
                        <td className="px-5 py-3.5 text-right">{formatCurrency(8000000)}</td>
                        <td className="px-5 py-3.5 text-right">0 đ</td>
                        <td className="px-5 py-3.5 text-right">0 đ</td>
                        <td className="px-5 py-3.5 text-right">0 đ</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-bold">An toàn</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-5 py-3.5 font-bold text-slate-900">Tier B</td>
                        <td className="px-5 py-3.5 text-right">{formatCurrency(120000000)}</td>
                        <td className="px-5 py-3.5 text-right text-amber-600">{formatCurrency(28000000)}</td>
                        <td className="px-5 py-3.5 text-right">0 đ</td>
                        <td className="px-5 py-3.5 text-right">0 đ</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] font-bold">Chú ý</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Seller Wallet */}
          {activeTab === 'seller_wallet' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-slate-900 text-[#FAF9F5] p-6 rounded-lg border border-slate-850 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Số dư khả dụng</h3>
                  <div className="text-4xl font-black italic tracking-tight">
                    {isLoadingWallet ? 'Đang tải...' : formatCurrency(walletBalance)}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">Seller ID: {currentSellerId}</p>
                </div>
                <button 
                  onClick={() => setShowWithdrawModal(true)}
                  className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg cursor-pointer border-0 shadow-xs whitespace-nowrap"
                >
                  Rút tiền về ngân hàng
                </button>
              </div>

              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-bold text-slate-800">Lịch sử giao dịch ví</h3>
                </div>
                <div className="overflow-x-auto min-w-0">
                  <table className="w-full text-left whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Thời gian</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Loại giao dịch</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Số tiền (VNĐ)</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gateway</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {isLoadingWallet ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-sm text-slate-500">Đang tải dữ liệu...</td>
                        </tr>
                      ) : walletTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-sm text-slate-500">Chưa có giao dịch nào</td>
                        </tr>
                      ) : walletTransactions.map(txn => (
                        <tr key={txn.id} className="hover:bg-slate-50 transition-all">
                          <td className="px-6 py-4 text-xs text-slate-600">{txn.timestamp || new Date(txn.createdAt).toLocaleString('vi-VN')}</td>
                          <td className="px-6 py-4">
                            <span className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-tight",
                              txn.type === 'deposit' ? "bg-emerald-50 text-emerald-600" : 
                              txn.type === 'withdraw' ? "bg-rose-50 text-rose-600" :
                              txn.type === 'payout' ? "bg-primary-50 text-primary-600" : "bg-slate-100 text-slate-700"
                            )}>
                              {txn.type}
                            </span>
                          </td>
                          <td className={cn(
                            "px-6 py-4 font-bold",
                            txn.type === 'deposit' || txn.type === 'payout' ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {txn.type === 'deposit' || txn.type === 'payout' ? '+' : '-'}{formatCurrency(txn.amount)}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 uppercase font-mono">{txn.gateway || 'INTERNAL'}</td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold",
                                txn.status === 'success' ? "bg-emerald-100 text-emerald-700" : 
                                txn.status === 'pending' ? "bg-amber-100 text-amber-700" :
                                "bg-rose-100 text-rose-700"
                              )}>
                                {txn.status.toUpperCase()}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 5. Bottom Info Banner */}
      <div className="bg-[#111827] text-[#FAF9F5] p-6 rounded-lg relative overflow-hidden border border-slate-850">
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary-600 rounded-lg">
                <GanttChartSquare className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">Thuật toán Xếp hạng Tín nhiệm (Financial Rating Engine)</h3>
            </div>
            <p className="text-slate-450 leading-relaxed font-medium">
              Chấm điểm dựa trên 24 chỉ số tài chính và hành vi thời gian thực. Đảm bảo giảm thiểu tỷ lệ nợ xấu thấu chi chuỗi cung ứng xuống dưới mức 0.5% tối thiểu.
            </p>
          </div>
          <div className="flex md:justify-end gap-3">
            <button className="px-4 py-2.5 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition border-0 cursor-pointer">
              Xem Model Chấm Điểm
            </button>
            <button className="px-4 py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 transition border border-slate-700 cursor-pointer">
              Nhật ký thấu chi Seller
            </button>
          </div>
        </div>
      </div>

      {/* 6. MODALS & SLIDE-OVERS */}

      {/* SLIDE-OVER: Credit Limit Overdraft */}
      {selectedSeller && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md h-full shadow-lg border-l border-slate-200 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-350">
            <div className="space-y-6 overflow-y-auto pr-1">
              <div className="flex justify-between items-center pb-4 border-b border-slate-150">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary-600" /> Cấp tín dụng & thấu chi
                </h3>
                <button 
                  onClick={() => setSelectedSeller(null)}
                  className="p-1 hover:bg-slate-100 rounded-full border-0 bg-transparent cursor-pointer text-slate-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Nhà bán hàng:</span>
                  <span className="font-extrabold text-slate-900">{selectedSeller.sellerName}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Mã Seller:</span>
                  <span className="font-mono text-slate-850 font-bold">{selectedSeller.sellerId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Điểm tín nhiệm:</span>
                  <span className="font-bold text-slate-900">{selectedSeller.score} (Tier {selectedSeller.tier})</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Dư nợ hiện tại:</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(selectedSeller.outstandingDebt)}</span>
                </div>
              </div>

              {/* Edit credit limit */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Hạn mức tín dụng mới đề xuất (VND)
                </label>
                <input 
                  type="number"
                  value={newCreditLimit}
                  onChange={e => setNewCreditLimit(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
                
                {/* Safe limit check warning */}
                {newCreditLimit > selectedSeller.maxLimitBase * (selectedSeller.score >= 850 ? 1.0 : selectedSeller.score >= 750 ? 0.8 : selectedSeller.score >= 650 ? 0.5 : 0.3) && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-[10.5px] text-rose-700 leading-relaxed font-semibold flex gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>
                      Cảnh báo: Hạn mức nhập vượt ngưỡng xếp hạng rủi ro tín dụng tối đa của đối tác (Hạn mức đề xuất an toàn: {formatCurrency(selectedSeller.maxLimitBase * (selectedSeller.score >= 850 ? 1.0 : selectedSeller.score >= 750 ? 0.8 : selectedSeller.score >= 650 ? 0.5 : 0.3))}). Yêu cầu đặc cách duyệt đặc biệt.
                    </span>
                  </div>
                )}
              </div>

              {/* MISA double entry preview */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Định khoản hạch toán mô phỏng (ERP MISA)
                  </span>
                  <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-650 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={isSyncingMisa} 
                      onChange={e => setIsSyncingMisa(e.target.checked)}
                      className="rounded text-primary-600 focus:ring-0 cursor-pointer"
                    /> Đồng bộ MISA
                  </label>
                </div>

                {isSyncingMisa && (
                  <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-center text-[10.5px] font-semibold text-slate-700">
                      <span>Nợ TK 1388 (Phải thu khác - Thấu chi Seller):</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(newCreditLimit)}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10.5px] font-semibold text-slate-700">
                      <span>Có TK 3388 (Phải trả khác - Thấu chi cấp nhận):</span>
                      <span className="font-mono font-bold text-slate-900">{formatCurrency(newCreditLimit)}</span>
                    </div>
                    <div className="text-[9.5px] text-slate-400 font-bold border-t border-slate-200 pt-1.5">
                      Ghi chú: Đối tượng hạch toán: {selectedSeller.sellerId} - {selectedSeller.sellerName}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2 bg-white shrink-0">
              <button 
                onClick={() => setSelectedSeller(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 bg-white rounded-lg font-bold cursor-pointer border-0 hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSaveCreditLimit}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold cursor-pointer border-0 shadow-xs"
              >
                Phê duyệt & Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WIZARD MODAL: Early Payout Approval */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-lg border border-slate-350 shadow-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            
            {/* Wizard Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-primary-600" />
                <div>
                  <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Quy trình duyệt ứng vốn giải ngân
                  </h3>
                  <span className="text-[9.5px] text-slate-400 font-mono font-bold uppercase">{selectedPayout.id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPayout(null)}
                className="p-1 hover:bg-slate-200 rounded-full border-0 bg-transparent cursor-pointer text-slate-400"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between select-none">
              {[
                { step: 1, label: 'Kiểm tra' },
                { step: 2, label: 'Tài chính' },
                { step: 3, label: 'Ký số' },
                { step: 4, label: 'Hoàn tất' }
              ].map(s => (
                <div key={s.step} className="flex items-center gap-1">
                  <span className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                    wizardStep === s.step ? "bg-primary-600 text-white" : 
                    wizardStep > s.step ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                  )}>
                    {s.step}
                  </span>
                  <span className={cn(
                    "text-[10px] font-bold",
                    wizardStep === s.step ? "text-primary-600" : 
                    wizardStep > s.step ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Wizard Content Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4 text-left">
              
              {/* Step 1: Order/Logistics checks */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-805 text-xs">Xác minh tình trạng vận đơn vận chuyển</h4>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed">
                    Hệ thống đã kết nối API với đối tác vận chuyển GHTK / GHN để xác thực đơn hàng đã giao thành công và hết hạn khiếu nại đổi trả.
                  </p>
                  
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/30 overflow-hidden">
                    <div className="p-3 flex justify-between items-center text-[10.5px]">
                      <div>
                        <p className="font-bold text-slate-800">Đơn hàng ORD-2983</p>
                        <p className="text-[9.5px] text-slate-400">Giao hàng hoả tốc GHTK</p>
                      </div>
                      <span className="text-[9.5px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Giao thành công 🟢</span>
                    </div>
                    <div className="p-3 flex justify-between items-center text-[10.5px]">
                      <div>
                        <p className="font-bold text-slate-800">Đơn hàng ORD-2989</p>
                        <p className="text-[9.5px] text-slate-400">Giao hàng tiết kiệm GHN</p>
                      </div>
                      <span className="text-[9.5px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Giao thành công 🟢</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-lg text-[10.5px] text-emerald-700 leading-relaxed font-semibold flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>🟢 Mọi vận đơn khớp điều kiện giải ngân. Đủ điều kiện thanh khoản 100%.</span>
                  </div>
                </div>
              )}

              {/* Step 2: Financial deductions */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-805 text-xs">Chi tiết khấu trừ phí & số tiền chuyển khoản</h4>
                  
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Tổng tiền giải ngân yêu cầu:</span>
                      <span className="font-bold text-slate-900">{formatCurrency(selectedPayout.amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-red-600 font-bold">
                      <span>Phí ứng vốn dịch vụ (1.0%):</span>
                      <span>-{formatCurrency(selectedPayout.discountFee)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold pt-2.5 border-t border-slate-200 text-slate-900">
                      <span>Thực nhận chuyển khoản Seller:</span>
                      <span className="text-primary-600 text-sm">{formatCurrency(selectedPayout.amount - selectedPayout.discountFee)}</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-lg space-y-2">
                    <p className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Định khoản hạch toán ERP MISA</p>
                    <div className="flex justify-between text-[10.5px] font-semibold text-slate-700">
                      <span>Nợ TK 131 (Phải thu khách hàng - Seller):</span>
                      <span className="font-mono text-slate-900">{formatCurrency(selectedPayout.amount)}</span>
                    </div>
                    <div className="flex justify-between text-[10.5px] font-semibold text-slate-700">
                      <span>Có TK 112 (Tiền gửi ngân hàng - Escrow):</span>
                      <span className="font-mono text-slate-900">{formatCurrency(selectedPayout.amount - selectedPayout.discountFee)}</span>
                    </div>
                    <div className="flex justify-between text-[10.5px] font-semibold text-slate-700">
                      <span>Có TK 5111 (Doanh thu phí ứng vốn 1%):</span>
                      <span className="font-mono text-slate-900">{formatCurrency(selectedPayout.discountFee)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: HSM Digital Signing */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <h4 className="font-bold text-slate-805 text-xs">Xác thực chứng thư & Ký số duyệt chi</h4>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed">
                    Xác thực chữ ký số HSM của VComm ERP để hợp pháp hóa chứng từ giải ngân tự động.
                  </p>

                  <div className="p-4 bg-slate-900 text-[#FAF9F5] border border-slate-800 rounded-lg space-y-3 relative overflow-hidden">
                    <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-blue-500" /> Digital Certificate
                    </h5>
                    <div className="text-[11px] font-mono space-y-1 text-slate-300">
                      <p>CN: VCOMM ERP PLATFORM HSM 2026</p>
                      <p>Issuer: VComm CA Root Authority</p>
                      <p>Serial: 921A-BD83-F723-E78C</p>
                    </div>
                    <Star className="absolute -bottom-6 -right-6 w-20 h-20 text-blue-500/10" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Nhập mã PIN Chữ ký số / OTP duyệt chi
                    </label>
                    <input 
                      type="password"
                      maxLength={6}
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value)}
                      placeholder="Mã PIN (Ví dụ: 123456)"
                      className="w-full p-2.5 border border-slate-300 rounded-lg font-bold tracking-widest text-center focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Finished & Napas receipt */}
              {wizardStep === 4 && (
                <div className="space-y-4 text-center py-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold">
                    ✓
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">Giải ngân đã được duyệt chi & Ký số thành công!</h4>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed">
                    Yêu cầu ứng vốn sớm của đối tác đã được giải ngân thành công qua cổng thanh toán Napas 24/7 và ghi sổ kế toán MISA.
                  </p>

                  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 text-left space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Chứng từ thanh toán Napas</p>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>Mã tham chiếu GD:</span>
                      <span className="font-mono text-slate-900">REF-NPS-{Date.now().toString().slice(-6)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>Số tài khoản thụ hưởng:</span>
                      <span className="font-mono text-slate-900">9704-XXXX-XXXX-9283</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                      <span>Thời gian giải ngân:</span>
                      <span className="font-mono text-slate-900">Hôm nay, vừa xong</span>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Wizard Footer buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 shrink-0">
              {wizardStep < 4 ? (
                <>
                  <button 
                    onClick={() => setSelectedPayout(null)}
                    className="px-4 py-1.5 border border-slate-300 text-slate-700 bg-white font-bold rounded-lg cursor-pointer border-0 hover:bg-slate-100"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    onClick={handleNextWizardStep}
                    disabled={wizardStep === 3 && otpCode.length < 4}
                    className="px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg cursor-pointer border-0 shadow-xs disabled:opacity-40"
                  >
                    {isSigning ? '🔄 Đang ký số...' : 'Tiếp tục ➔'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleCompletePayout}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer border-0 shadow-xs"
                >
                  Xác nhận hoàn tất
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Request Withdrawal (Seller) */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-lg w-full max-w-md shadow-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Tạo yêu cầu rút tiền
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors border-0 bg-transparent cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-primary-50 border border-primary-100 p-4 rounded-lg flex justify-between items-center">
                <span className="text-xs font-bold text-blue-800">Số dư khả dụng</span>
                <span className="text-lg font-black text-blue-700">{formatCurrency(walletBalance)}</span>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Số tiền rút (VNĐ)
                </label>
                <input 
                  type="number"
                  value={withdrawalAmount}
                  onChange={e => setWithdrawalAmount(e.target.value)}
                  placeholder="Nhập số tiền muốn rút..."
                  className="w-full p-3 border border-slate-300 rounded-lg font-bold text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex-1 py-3 border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleRequestWithdrawal}
                  className="flex-[2] py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 cursor-pointer border-0 shadow-xs"
                >
                  Xác nhận rút tiền
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
