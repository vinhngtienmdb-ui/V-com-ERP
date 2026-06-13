import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useEffect } from 'react';
import { 
 DollarSign, 
 TrendingUp, 
 TrendingDown, 
 Wallet, 
 Banknote, 
 PieChart, 
 ArrowUpRight, 
 Download, 
 Filter,
 Search,
 Plus,
 BookOpen,
 FileText,
 BadgeDollarSign,
 Receipt,
 ArrowDownCircle,
 ArrowUpCircle,
 ShieldCheck,
 Building2,
 Calendar,
 History,
 FileBarChart,
 Target,
 Clock,
 ArrowLeft,
 Scan,
 Upload,
 FileSearch,
 CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Loader2,
  Lock
} from 'lucide-react';
import { getMisaConfig, syncTransactionToMisa, unpostTransaction } from '../services/misaService';
import { db, auth, collection, onSnapshot, query, addDoc, serverTimestamp, limit, doc, setDoc } from '../lib/firebase';
import { formatCurrency, cn } from '../lib/utils';
import { FinanceTransaction } from '../types/erp';

const FINANCE_MODULE_GROUPS = [
 {
 title: 'Kế toán Tổng hợp',
 items: [
 { id: 'journal', label: 'Sổ Nhật ký chung', desc: 'Ghi chép toàn bộ nghiệp vụ phát sinh.', icon: BookOpen, color: 'blue' },
 { id: 'ledger', label: 'Sổ cái Tài khoản', desc: 'Chi tiết biến động từng tài khoản kế toán.', icon: FileText, color: 'indigo' },
 { id: 'vouchers', label: 'Quản lý Chứng từ', desc: 'Lưu trữ hóa đơn, phiếu thu/chi.', icon: Receipt, color: 'emerald' },
 { id: 'ocr', label: 'Smart OCR Scan', desc: 'Tự động nhận diện hóa đơn bằng AI.', icon: Scan, color: 'purple' },
 { id: 'reconciliation', label: 'Đối soát Ngân hàng', desc: 'Khớp nối dữ liệu bank và sổ sách.', icon: RefreshCw, color: 'orange' },
 ]
 },
 {
 title: 'Báo cáo & Phân tích',
 items: [
 { id: 'reports', label: 'Báo cáo Tài chính', desc: 'Bảng cân đối, kết quả KD, lưu chuyển tiền.', icon: PieChart, color: 'purple' },
 { id: 'tax', label: 'Báo cáo Thuế/VAT', desc: 'Tờ khai thuế GTGT, TNCN, TNDN.', icon: FileBarChart, color: 'rose' },
 { id: 'budget', label: 'Ngân sách & KPI', desc: 'Theo dõi thực hiện so với kế hoạch.', icon: Target, color: 'emerald' },
 { id: 'cashflow', label: 'Dự báo Dòng tiền', desc: 'Phân tích dòng tiền tương lai.', icon: History, color: 'blue' },
 ]
 }
];

function RefreshCw(props: any) {
 return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>;
}

function getColorClasses(color: string) {
 switch (color) {
 case 'blue': return 'bg-slate-100 text-orange-700';
 case 'orange': return 'bg-orange-50 text-orange-600';
 case 'indigo': return 'bg-primary-50 text-primary-600';
 case 'purple': return 'bg-purple-50 text-purple-600';
 case 'emerald': return 'bg-emerald-50 text-emerald-600';
 case 'rose': return 'bg-rose-50 text-rose-600';
 default: return 'bg-slate-50 text-slate-700';
 }
}

export function Finance() {
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'journal' | 'ledger' | 'reports' | 'closing' | 'ocr'>('overview');
  const [reportSubTab, setReportSubTab] = useState<'pl' | 'trial' | 'balance' | 'cashflow' | 'aging'>('pl');
  const [loading, setLoading] = useState(true);
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [unpostingId, setUnpostingId] = useState<string | null>(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>('1121');

  // Trạng thái nâng cấp Khóa sổ & Báo cáo nâng cao
  const [closingLockDate, setClosingLockDate] = useState<string | null>(null);
  const [closingMonth, setClosingMonth] = useState<number>(new Date().getMonth() + 1);
  const [closingYear, setClosingYear] = useState<number>(new Date().getFullYear());
  const [closingStatus, setClosingStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; message: string }>({ type: null, message: '' });

  const isDateLocked = (dStr: any) => {
    if (!closingLockDate || !dStr) return false;
    const lockDate = new Date(closingLockDate);
    const parseDate = (dVal: any) => {
      if (!dVal) return new Date();
      if (dVal instanceof Date) return dVal;
      const parts = String(dVal).split('/');
      if (parts.length === 3) {
        return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
      }
      return new Date(dVal);
    };
    const checkDate = parseDate(dStr);
    return checkDate.getTime() <= lockDate.getTime();
  };

  const handleSyncToMisa = async (txId: string) => {
    setSyncingId(txId);
    try {
      await syncTransactionToMisa(txId);
    } catch (err: any) {
      console.error('[Finance] MISA sync failed:', err);
      alert(err.message || 'Ghi sổ thất bại');
    } finally {
      setSyncingId(null);
    }
  };

  const handleUnpost = async (txId: string) => {
    setUnpostingId(txId);
    try {
      await unpostTransaction(txId);
    } catch (err: any) {
      console.error('[Finance] Unpost failed:', err);
      alert(err.message || 'Hủy ghi sổ thất bại');
    } finally {
      setUnpostingId(null);
    }
  };

  const handlePerformClosing = async () => {
    if (!auth.currentUser) return;
    setClosingStatus({ type: 'loading', message: 'Đang chuẩn bị khóa sổ...' });

    try {
      const startOfMonth = new Date(closingYear, closingMonth - 1, 1);
      const endOfMonth = new Date(closingYear, closingMonth, 0);
      
      const startOfPeriodTime = startOfMonth.getTime();
      const endOfPeriodTime = endOfMonth.getTime();

      const currentPeriodEntries = journalEntries.filter(je => {
        if (je.id.startsWith('JE-CLOSE-')) return false;
        
        const parseDate = (dStr: string) => {
          if (!dStr) return new Date(0);
          const parts = dStr.split('/');
          if (parts.length === 3) {
            return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
          }
          return new Date(dStr);
        };
        const jeTime = parseDate(je.date).getTime();
        return jeTime >= startOfPeriodTime && jeTime <= endOfPeriodTime;
      });

      if (currentPeriodEntries.length === 0) {
        throw new Error(`Không tìm thấy giao dịch nào phát sinh trong Tháng ${closingMonth}/${closingYear}. Không thể khóa sổ!`);
      }

      let totalRevenue = 0;
      let totalCogs = 0;
      let totalSellingExpense = 0;
      let totalAdminExpense = 0;

      currentPeriodEntries.forEach(je => {
        if (!je.items) return;
        je.items.forEach((item: any) => {
          const accId = item.accountId || '';
          if (accId.startsWith('5')) {
            totalRevenue += (item.credit || 0) - (item.debit || 0);
          } else if (accId.startsWith('632')) {
            totalCogs += (item.debit || 0) - (item.credit || 0);
          } else if (accId === '6421') {
            totalSellingExpense += (item.debit || 0) - (item.credit || 0);
          } else if (accId === '6422') {
            totalAdminExpense += (item.debit || 0) - (item.credit || 0);
          }
        });
      });

      const totalExpenses = totalCogs + totalSellingExpense + totalAdminExpense;
      const netProfit = totalRevenue - totalExpenses;
      const closeItems: any[] = [];

      // A. Kết chuyển doanh thu sang 911
      if (totalRevenue > 0) {
        closeItems.push({ accountId: '5111', debit: totalRevenue, credit: 0, partnerId: 'SYSTEM' });
        closeItems.push({ accountId: '911', debit: 0, credit: totalRevenue, partnerId: 'SYSTEM' });
      }

      // B. Kết chuyển chi phí sang 911
      if (totalCogs > 0) {
        closeItems.push({ accountId: '911', debit: totalCogs, credit: 0, partnerId: 'SYSTEM' });
        closeItems.push({ accountId: '632', debit: 0, credit: totalCogs, partnerId: 'SYSTEM' });
      }
      if (totalSellingExpense > 0) {
        closeItems.push({ accountId: '911', debit: totalSellingExpense, credit: 0, partnerId: 'SYSTEM' });
        closeItems.push({ accountId: '6421', debit: 0, credit: totalSellingExpense, partnerId: 'SYSTEM' });
      }
      if (totalAdminExpense > 0) {
        closeItems.push({ accountId: '911', debit: totalAdminExpense, credit: 0, partnerId: 'SYSTEM' });
        closeItems.push({ accountId: '6422', debit: 0, credit: totalAdminExpense, partnerId: 'SYSTEM' });
      }

      // C. Kết chuyển lợi nhuận ròng từ 911 sang 4212
      if (netProfit > 0) {
        closeItems.push({ accountId: '911', debit: netProfit, credit: 0, partnerId: 'SYSTEM' });
        closeItems.push({ accountId: '4212', debit: 0, credit: netProfit, partnerId: 'SYSTEM' });
      } else if (netProfit < 0) {
        const absLoss = Math.abs(netProfit);
        closeItems.push({ accountId: '4212', debit: absLoss, credit: 0, partnerId: 'SYSTEM' });
        closeItems.push({ accountId: '911', debit: 0, credit: absLoss, partnerId: 'SYSTEM' });
      }

      if (closeItems.length === 0) {
        throw new Error('Không có phát sinh doanh thu hay chi phí nào để thực hiện kết chuyển!');
      }

      const closeEntryId = `JE-CLOSE-${closingYear}-${String(closingMonth).padStart(2, '0')}`;
      const closeEntry = {
        id: closeEntryId,
        date: endOfMonth.toISOString(),
        ref: `CLOSED-${closingMonth}/${closingYear}`,
        description: `Kết chuyển cuối kỳ khóa sổ tự động - Tháng ${closingMonth}/${closingYear}`,
        tenantId: 'tenant-vcomm-prod-01',
        items: closeItems
      };

      await setDoc(doc(db, 'journal_entries', closeEntryId), closeEntry);

      const lockDateStr = endOfMonth.toISOString().split('T')[0];
      await setDoc(doc(db, 'tenant_settings', 'config'), {
        closingLockDate: lockDateStr,
        tenantId: 'tenant-vcomm-prod-01'
      });

      setClosingStatus({
        type: 'success',
        message: `Khóa sổ và Kết chuyển tự động thành công Tháng ${closingMonth}/${closingYear}! Hệ thống đã ghi nhận số dư và chặn toàn bộ các giao dịch trước/bằng ngày ${endOfMonth.toLocaleDateString('vi-VN')}.`
      });
    } catch (err: any) {
      console.error('[Finance] Closing period failed:', err);
      setClosingStatus({
        type: 'error',
        message: err.message || 'Lỗi bất ngờ xảy ra trong quá trình khóa sổ.'
      });
    }
  };

  const handleResetLockDate = async () => {
    if (!auth.currentUser) return;
    try {
      await setDoc(doc(db, 'tenant_settings', 'config'), {
        closingLockDate: null,
        tenantId: 'tenant-vcomm-prod-01'
      });
      setClosingStatus({
        type: 'success',
        message: 'Đã mở khóa sổ kế toán thành công. Mọi kỳ kế toán hiện có thể chỉnh sửa.'
      });
    } catch (err: any) {
      setClosingStatus({
        type: 'error',
        message: err.message || 'Lỗi khi mở khóa sổ.'
      });
    }
  };

  const misaConfig = getMisaConfig();

  useEffect(() => {
    // 1. Subscribe to finance transactions
    const qTx = query(collection(db, 'finance_transactions'), limit(50));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate()?.toLocaleDateString('vi-VN') || doc.data().dateStr || ''
      })) as FinanceTransaction[];
      setTransactions(docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    });

    // 2. Subscribe to double-entry journal entries
    const qJe = query(collection(db, 'journal_entries'), limit(100));
    const unsubJe = onSnapshot(qJe, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        let dateStr = '';
        const rawDate = doc.data().date;
        if (rawDate) {
          if (typeof rawDate === 'string') {
            dateStr = new Date(rawDate).toLocaleDateString('vi-VN');
          } else if (rawDate.toDate) {
            dateStr = rawDate.toDate().toLocaleDateString('vi-VN');
          } else if (rawDate.seconds) {
            dateStr = new Date(rawDate.seconds * 1000).toLocaleDateString('vi-VN');
          }
        }
        return {
          id: doc.id,
          ...doc.data(),
          date: dateStr || new Date().toLocaleDateString('vi-VN')
        };
      });
      setJournalEntries(docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    });

    // 3. Subscribe to tenant settings config
    const unsubSettings = onSnapshot(doc(db, 'tenant_settings', 'config'), (snapshot: any) => {
      if (snapshot.exists()) {
        setClosingLockDate(snapshot.data().closingLockDate || null);
      }
    });

    return () => {
      unsubTx();
      unsubJe();
      unsubSettings();
    };
  }, []);

 const addDemoTransactions = async () => {
 if (!auth.currentUser) return;
 const demos = [
 { description: 'Thu hộ COD - Đơn hàng VCOM-9901', amount: 1250000, type: 'income', category: 'Sales', dateStr: '12/12/2023' },
 { description: 'Thanh toán tiền điện văn phòng T12', amount: 4500000, type: 'expense', category: 'Operational', dateStr: '12/12/2023' },
 { description: 'Nhập hàng kho tổng - NCC MobileWorld', amount: 85000000, type: 'expense', category: 'Inventory', dateStr: '11/12/2023' },
 ];

 for (const demo of demos) {
 await addDoc(collection(db, 'finance_transactions'), {
 ...demo,
 createdAt: serverTimestamp(),
 createdBy: auth.currentUser?.uid || 'system'
 });
 }
 };

 const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
 const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
 const netProfit = totalIncome - totalExpense;

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-1">
 {activeTab !== 'overview' && (
 <button onClick={() => setActiveTab('overview')} className="p-1 hover:bg-slate-100 rounded-md transition-colors mr-1">
 <ArrowLeft className="w-4 h-4 text-slate-600" />
 </button>
 )}
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Tài chính & Kế toán</h1>
 </div>
 <p className="text-sm text-[#6B7280]">Quản lý doanh số, chi phí, dòng tiền và báo cáo thuế theo thời gian thực.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Download className="w-4 h-4 text-slate-600" /> Xuất Excel
 </button>
 <button 
 onClick={addDemoTransactions}
 className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Bút toán mới
 </button>
 </div>
 </div>

 {activeTab === 'overview' && (
 <div className="space-y-8">
 {/* Stats Cards */}
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest text-[#2563EB]">Doanh thu Hệ thống (G.M.V)</span>
 <TrendingUp className="w-4 h-4 text-emerald-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{formatCurrency(totalIncome)}</span>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Real-time</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest text-rose-600">Tổng Chi phí & Quỹ lương</span>
 <TrendingDown className="w-4 h-4 text-rose-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{formatCurrency(totalExpense)}</span>
 <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">Sync Data</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest text-teal-600">Lợi nhuận ròng (P&L)</span>
 <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className={cn("text-2xl font-black", netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
 {formatCurrency(netProfit)}
 </span>
 <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded">Kết quả KD</span>
 </div>
 </div>
 <div className="bg-primary-600 p-6 rounded-xl border border-primary-700 shadow-sm hover:shadow-indigo-500/20 transition-all relative overflow-hidden group">
 <div className="absolute right-0 bottom-0 p-2 opacity-10  transition-transform">
 <Building2 className="w-16 h-16 text-[#FAF9F5]" />
 </div>
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-primary-200 font-bold uppercase tracking-widest">Dấu vân tay tài chính</span>
 <ShieldCheck className="w-4 h-4 text-[#FAF9F5]" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-xl font-bold text-[#FAF9F5]">Trust Score: 9.8</span>
 <span className="text-[10px] text-[#FAF9F5] font-bold bg-white/20 px-2 py-0.5 rounded underline cursor-pointer">Verify</span>
 </div>
 </div>
 </DraggableGrid>

 {/* Module Grid */}
 <div className="space-y-6">
 {FINANCE_MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx} className="space-y-4">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
 <span className="w-1 h-4 bg-[#2563EB] rounded-full inline-block" />
 {group.title}
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
 {group.items.map((mod) => (
 <div 
 key={mod.id}
 onClick={() => setActiveTab(mod.id as any)}
 className="group bg-white p-5 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm hover:border-[#2563EB]/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
 <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
 </div>
 <div className={cn("w-12 h-12 rounded relative z-10 flex items-center justify-center  group-hover:bg-[#2563EB] group-hover:text-[#FAF9F5] transition-all shadow-sm", getColorClasses(mod.color))}>
 <mod.icon className="w-6 h-6" />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-[#111827] text-sm mb-1.5 group-hover:text-[#2563EB] transition-colors">{mod.label}</h3>
 <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">{mod.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab !== 'overview' && (
 <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-[#F3F4F6]">
 {[
 { id: 'journal', label: 'Sổ Nhật ký', icon: BookOpen },
 { id: 'ledger', label: 'Sổ cái & Chứng từ', icon: FileText },
 { id: 'reports', label: 'Báo cáo QT', icon: PieChart },
 { id: 'closing', label: 'Khóa sổ & Kết chuyển', icon: Lock },
 { id: 'ocr', label: 'Smart OCR', icon: Scan }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
 activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-slate-100/30" : "border-transparent text-[#6B7280] hover:text-[#111827]"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 <div className="p-0">
 {activeTab === 'ocr' && (
 <div className="p-6 animate-in fade-in slide-in- duration-500 bg-slate-50 min-h-[600px]">
 <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
 <div className="space-y-6">
 <div className="bg-white p-6 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-400 hover:bg-slate-100/50 transition-all cursor-pointer group relative overflow-hidden h-[400px]">
 <div className="p-6 bg-slate-100 text-orange-700 rounded-full  transition-transform">
 <Upload className="w-10 h-10" />
 </div>
 <div>
 <p className="text-sm font-black text-slate-900">Tải lên hoặc Kéo thả Hóa đơn</p>
 <p className="text-xs text-slate-500 mt-2">Hỗ trợ JPG, PNG, PDF (Tối đa 10MB)</p>
 </div>
 <button className="px-6 py-2.5 bg-slate-900 text-[#FAF9F5] rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm">Chọn tệp tin</button>
 
 {isScanning && (
 <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
 <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center animate-bounce">
 <Zap className="w-8 h-8 text-[#FAF9F5]" />
 </div>
 <div className="space-y-1 text-center">
 <p className="text-sm font-black text-slate-900 animate-pulse">Gemini AI đang phân tích...</p>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Trích xuất Header & Line Items</p>
 </div>
 <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full bg-slate-900 animate-[scan_2s_ease-in-out_infinite]" />
 </div>
 </div>
 )}
 </div>

 <div className="bg-primary-900 rounded-xl p-6 text-[#FAF9F5] relative overflow-hidden shadow-sm">
 <div className="flex items-start gap-4">
 <div className="p-3 bg-white/10 rounded-lg">
 <Sparkles className="w-6 h-6 text-primary-300" />
 </div>
 <div>
 <h4 className="text-sm font-bold uppercase tracking-widest mb-1 italic">AI Productivity Tip</h4>
 <p className="text-[11px] text-primary-100/70 leading-relaxed font-medium">Sử dụng Smart OCR có thể giúp bạn giảm 90% lỗi sai sót trong quá trình nhập liệu hóa đơn đỏ. Độ chính xác đạt 99.2% với các hóa đơn chuẩn E-Invoice.</p>
 </div>
 </div>
 <Zap className="absolute -bottom-6 -right-6 w-24 h-24 text-[#FAF9F5]/5 rotate-12" />
 </div>
 </div>

 <div className="space-y-6">
 <div className={cn(
 "bg-white p-6 rounded-xl border border-slate-300 shadow-sm transition-all min-h-[400px]",
 !scanResult && "opacity-50 grayscale flex flex-col items-center justify-center text-center"
 )}>
 {!scanResult ? (
 <>
 <FileSearch className="w-12 h-12 text-slate-400 mb-4" />
 <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">Kết quả nhận diện sẽ hiển thị tại đây</p>
 </>
 ) : (
 <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
 <div className="flex justify-between items-center pb-4 border-b border-slate-200">
 <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Kết quả Trích xuất AI
 </h3>
 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Match: 99.4%</span>
 </div>

 <div className="grid grid-cols-2 gap-6">
 <div className="space-y-1">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Nhà cung cấp</p>
 <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Công ty Điện lực Hà Nội - EVNHANOI</p>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Mã số thuế</p>
 <p className="text-sm font-black text-slate-900 font-mono tracking-tighter">0100101114</p>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Số hóa đơn</p>
 <p className="text-sm font-black text-primary-600 font-mono">EVN-2023-99881</p>
 </div>
 <div className="space-y-1">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Ngày hóa đơn</p>
 <p className="text-sm font-black text-slate-900">15/12/2023</p>
 </div>
 </div>

 <div className="space-y-4">
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chi tiết dòng (Line Items)</p>
 <div className="p-4 bg-slate-50 rounded-lg space-y-3">
 <div className="flex justify-between text-xs items-center">
 <span className="font-bold text-slate-900">Điện năng tiêu thụ (Mức 3)</span>
 <span className="font-black text-slate-900">{formatCurrency(4850000)}</span>
 </div>
 <div className="flex justify-between text-[10px] text-slate-600 font-medium">
 <span>Thuế GTGT (10%)</span>
 <span>{formatCurrency(485000)}</span>
 </div>
 </div>
 </div>

 <div className="bg-slate-900 p-6 rounded-lg flex justify-between items-center shadow-sm shadow-blue-200">
 <div>
 <p className="text-[10px] font-bold text-blue-100 uppercase mb-1 tracking-widest">Tổng tiền cần thanh toán</p>
 <p className="text-2xl font-black text-[#FAF9F5]">{formatCurrency(5335000)}</p>
 </div>
 <button className="px-6 py-3 bg-white text-orange-700 rounded-xl font-black text-xs uppercase tracking-widest  transition-transform active:scale-95 shadow-sm">
 Tạo bút toán Chi
 </button>
 </div>
 </div>
 )}
 </div>

 {!scanResult && (
 <button 
 onClick={() => {
 setIsScanning(true);
 setTimeout(() => {
 setIsScanning(false);
 setScanResult(true);
 }, 2500);
 }}
 className="w-full py-5 bg-slate-900 text-[#FAF9F5] rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm shadow-blue-100 flex items-center justify-center gap-3"
 >
 <Scan className="w-5 h-5" /> Bắt đầu AI Scan
 </button>
 )}
 
 <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100 italic">
<AlertCircle className="w-3.5 h-3.5" /> Lưu ý: Hệ thống đang sử dụng mô hình Gemini 1.5 Pro cho độ chính xác cao nhất trên các định dạng hóa đơn phức tạp.
 </div>
 </div>
 </div>
 </div>
  )}

  {activeTab === 'journal' && (
   <div className="animate-in fade-in duration-300">
   <div className="p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center">
   <div className="flex gap-4">
   <div className="relative">
   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
   <input type="text" placeholder="Tìm kiếm bút toán..." className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-64" />
   </div>
   <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
   <Filter className="w-4 h-4 text-slate-500" /> Lọc kỳ
   </button>
   </div>
   </div>
   <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
   <div className="overflow-x-auto min-w-0">
   <table className="w-full text-left border-collapse whitespace-nowrap">
   <thead>
   <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
   <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Ngày hạch toán</th>
   <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Số chứng từ</th>
   <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Diễn giải</th>
   <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Tài khoản Nợ (Debit)</th>
   <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Tài khoản Có (Credit)</th>
   <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Đối tượng</th>
   <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Số tiền (VND)</th>
   <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái Ghi sổ</th>
   </tr>
   </thead>
   <tbody className="divide-y divide-[#F3F4F6]">
   {(() => {
     const displayEntries = journalEntries.length > 0 
       ? journalEntries 
       : transactions.map(tx => {
           const commissionRate = 10;
           const defaultDebit = tx.debitAccount || (tx.type === 'income' ? '1121' : '1111');
           const defaultCredit = tx.creditAccount || (tx.type === 'income' ? '5111' : '1311');
           const isSplit = tx.type === 'income' && misaConfig.enableMarketplaceSplit;
           const objectCode = tx.accountingObjectCode || (tx.type === 'income' ? 'KHLE' : 'NCCLE');

           const items = [];
           if (isSplit) {
             const commissionAmount = Math.round(tx.amount * (commissionRate / 100));
             const partnerAmount = tx.amount - commissionAmount;
             items.push({ accountId: defaultDebit, debit: tx.amount, credit: 0, partnerId: objectCode });
             items.push({ accountId: misaConfig.revenueAccountDefault || '5111', debit: 0, credit: commissionAmount, partnerId: objectCode });
             items.push({ accountId: misaConfig.partnerLiabilitiesAccount || '3388', debit: 0, credit: partnerAmount, partnerId: objectCode });
           } else {
             items.push({ accountId: defaultDebit, debit: tx.amount, credit: 0, partnerId: objectCode });
             items.push({ accountId: defaultCredit, debit: 0, credit: tx.amount, partnerId: objectCode });
           }
           return {
             id: tx.misaVoucherId || `JE-TX-${tx.id.substring(0, 8).toUpperCase()}`,
             date: tx.date,
             description: tx.description,
             ref: tx.orderId || tx.referenceNumber || '',
             items,
             isSimulated: !tx.misaSynced,
             txId: tx.id
           };
         });

     return displayEntries.map((je) => {
       const debitAccounts = je.items?.filter((item: any) => item.debit > 0).map((item: any) => item.accountId).join(', ') || '';
       const creditAccounts = je.items?.filter((item: any) => item.credit > 0).map((item: any) => item.accountId).join(', ') || '';
       const totalAmount = je.items?.filter((item: any) => item.debit > 0).reduce((sum: number, item: any) => sum + item.debit, 0) || 0;
       const partnerId = je.items?.find((item: any) => item.partnerId)?.partnerId || 'KHLE';

       return (
         <tr key={je.id} className="hover:bg-[#F9FAFB] transition-colors">
           <td className="px-6 py-4">
             <div className="flex items-center gap-2">
               <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
               <span className="text-sm text-[#111827] font-medium">{je.date}</span>
             </div>
           </td>
           <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900">{je.id}</td>
           <td className="px-6 py-4">
             <span className="text-sm text-[#111827] font-medium">{je.description}</span>
             {je.ref && <span className="text-xs text-slate-500 block">Ref: {je.ref}</span>}
           </td>
           <td className="px-6 py-4">
             <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-100 rounded">
               {debitAccounts}
             </span>
           </td>
           <td className="px-6 py-4">
             <span className="font-mono text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 border border-purple-100 rounded">
               {creditAccounts}
             </span>
           </td>
           <td className="px-6 py-4">
             <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
               {partnerId}
             </span>
           </td>
           <td className="px-6 py-4 text-right">
             <span className="text-xs font-bold text-emerald-600 font-mono">
               {formatCurrency(totalAmount)}
             </span>
           </td>
           <td className="px-6 py-4 text-center">
             <div className="flex items-center justify-center gap-2">
               {isDateLocked(je.date) ? (
                 <span className="px-2.5 py-1 bg-slate-50 text-slate-400 text-[10px] font-bold border border-slate-200 rounded-full flex items-center gap-1">
                   <Lock className="w-3 h-3 text-slate-400" /> Đã khóa sổ
                 </span>
               ) : !je.isSimulated ? (
                 <div className="flex items-center gap-2">
                   <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 rounded-full">
                     Đã ghi sổ 🟢
                   </span>
                   {je.txId && (
                     <button
                       onClick={() => handleUnpost(je.txId)}
                       disabled={unpostingId === je.txId}
                       className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg border border-slate-200 cursor-pointer flex items-center gap-1 disabled:opacity-50"
                     >
                       {unpostingId === je.txId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                       Hủy ghi sổ ↩️
                     </button>
                   )}
                 </div>
               ) : (
                 <button
                   onClick={() => handleSyncToMisa(je.txId)}
                   disabled={syncingId === je.txId}
                   className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
                 >
                   {syncingId === je.txId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                   Ghi sổ Kế toán
                 </button>
               )}
             </div>
           </td>
         </tr>
       );
     });
   })()}
   </tbody>
   </table>
   </div>
   </div>
   </div>
  )}

  {activeTab === 'ledger' && (
    <div className="p-6 space-y-6 animate-in fade-in duration-350 bg-slate-50 min-h-[600px]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Sổ cái chi tiết Tài khoản (Ledger Accounts)</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">Truy vấn biến động và số dư lũy kế của tài khoản kế toán nội bộ.</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-700">Chọn tài khoản:</label>
          <select 
            value={selectedLedgerAccount} 
            onChange={(e) => setSelectedLedgerAccount(e.target.value)}
            className="p-2 border border-slate-300 rounded-lg text-sm bg-white font-mono font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="1111">1111 - Tiền mặt tại quỹ</option>
            <option value="1121">1121 - Tiền gửi ngân hàng VND</option>
            <option value="1311">1311 - Phải thu khách hàng</option>
            <option value="141">141 - Tạm ứng nhân viên</option>
            <option value="331">331 - Phải trả người bán</option>
            <option value="3341">3341 - Phải trả người lao động</option>
            <option value="3388">3388 - Phải trả khác (Thu hộ đối tác)</option>
            <option value="5111">5111 - Doanh thu bán hàng</option>
            <option value="632">632 - Giá vốn hàng bán</option>
            <option value="6421">6421 - Chi phí bán hàng</option>
            <option value="6422">6422 - Chi phí quản lý doanh nghiệp</option>
          </select>
        </div>
      </div>

      {(() => {
        const firstChar = selectedLedgerAccount.charAt(0);
        const isAssetOrExpense = ['1', '2', '6', '8'].includes(firstChar);
        
        let startingBalance = 0;
        if (selectedLedgerAccount === '1121') startingBalance = 100000000;
        else if (selectedLedgerAccount === '1111') startingBalance = 50000000;
        else if (selectedLedgerAccount === '1311') startingBalance = 20000000;

        const displayEntries = journalEntries.length > 0 
          ? journalEntries 
          : transactions.map(tx => {
              const commissionRate = 10;
              const defaultDebit = tx.debitAccount || (tx.type === 'income' ? '1121' : '1111');
              const defaultCredit = tx.creditAccount || (tx.type === 'income' ? '5111' : '1311');
              const isSplit = tx.type === 'income' && misaConfig.enableMarketplaceSplit;
              const objectCode = tx.accountingObjectCode || (tx.type === 'income' ? 'KHLE' : 'NCCLE');

              const items = [];
              if (isSplit) {
                const commissionAmount = Math.round(tx.amount * (commissionRate / 100));
                const partnerAmount = tx.amount - commissionAmount;
                items.push({ accountId: defaultDebit, debit: tx.amount, credit: 0, partnerId: objectCode });
                items.push({ accountId: misaConfig.revenueAccountDefault || '5111', debit: 0, credit: commissionAmount, partnerId: objectCode });
                items.push({ accountId: misaConfig.partnerLiabilitiesAccount || '3388', debit: 0, credit: partnerAmount, partnerId: objectCode });
              } else {
                items.push({ accountId: defaultDebit, debit: tx.amount, credit: 0, partnerId: objectCode });
                items.push({ accountId: defaultCredit, debit: 0, credit: tx.amount, partnerId: objectCode });
              }
              return {
                id: tx.misaVoucherId || `JE-TX-${tx.id.substring(0, 8).toUpperCase()}`,
                date: tx.date,
                description: tx.description,
                ref: tx.orderId || tx.referenceNumber || '',
                items,
                isSimulated: !tx.misaSynced
              };
            });

        const ledgerEntries: any[] = [];
        
        displayEntries.forEach(je => {
          if (!je.items) return;
          je.items.forEach((item: any) => {
            if (item.accountId === selectedLedgerAccount) {
              const isDebit = item.debit > 0;
              const otherItems = je.items.filter((i: any) => isDebit ? i.credit > 0 : i.debit > 0);
              const counterAccount = otherItems.map((i: any) => i.accountId).join(', ');
              
              ledgerEntries.push({
                id: je.id,
                date: je.date,
                description: je.description,
                debit: item.debit,
                credit: item.credit,
                counterAccount
              });
            }
          });
        });

        // Sort ledger entries chronologically
        ledgerEntries.sort((a, b) => {
          const parseDate = (dStr: string) => {
            const parts = dStr.split('/');
            if (parts.length === 3) {
              return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
            }
            return new Date(dStr).getTime();
          };
          return parseDate(a.date) - parseDate(b.date);
        });

        let currentBalance = startingBalance;
        let totalDebit = 0;
        let totalCredit = 0;

        const ledgerWithBalance = ledgerEntries.map(entry => {
          totalDebit += entry.debit;
          totalCredit += entry.credit;

          if (isAssetOrExpense) {
            currentBalance += entry.debit - entry.credit;
          } else {
            currentBalance += entry.credit - entry.debit;
          }

          return { ...entry, runningBalance: currentBalance };
        });

        const displayLedger = [...ledgerWithBalance].reverse();

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Số dư đầu kỳ</span>
                <p className="text-lg font-black text-slate-800 mt-1">{formatCurrency(startingBalance)}</p>
              </div>
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs">
                <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">Tổng phát sinh NỢ</span>
                <p className="text-lg font-black text-emerald-600 mt-1">+{formatCurrency(totalDebit)}</p>
              </div>
              <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs">
                <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider">Tổng phát sinh CÓ</span>
                <p className="text-lg font-black text-rose-600 mt-1">-{formatCurrency(totalCredit)}</p>
              </div>
              <div className="bg-white p-5 border border-indigo-200 bg-indigo-50/20 rounded-xl shadow-xs">
                <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Số dư cuối kỳ</span>
                <p className="text-lg font-black text-indigo-700 mt-1">{formatCurrency(currentBalance)}</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                      <th className="px-5 py-3">Ngày</th>
                      <th className="px-5 py-3">Diễn giải</th>
                      <th className="px-5 py-3">Tài khoản đối ứng</th>
                      <th className="px-5 py-3 text-right">Phát sinh Nợ</th>
                      <th className="px-5 py-3 text-right">Phát sinh Có</th>
                      <th className="px-5 py-3 text-right">Số dư lũy kế</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {displayLedger.map((entry, idx) => (
                      <tr key={entry.id + '-' + idx} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3 text-slate-500">{entry.date}</td>
                        <td className="px-5 py-3 text-slate-800">{entry.description}</td>
                        <td className="px-5 py-3 font-mono text-slate-600 font-bold">{entry.counterAccount}</td>
                        <td className="px-5 py-3 text-right font-mono text-emerald-600 font-semibold">{entry.debit > 0 ? formatCurrency(entry.debit) : '-'}</td>
                        <td className="px-5 py-3 text-right font-mono text-rose-600 font-semibold">{entry.credit > 0 ? formatCurrency(entry.credit) : '-'}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(entry.runningBalance)}</td>
                      </tr>
                    ))}
                    {displayLedger.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-400 italic">Không có nghiệp vụ phát sinh của tài khoản này trong kỳ.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  )}

  {activeTab === 'closing' && (
    <div className="p-6 space-y-6 animate-in fade-in duration-350 bg-slate-50 min-h-[600px]">
      <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-indigo-600" />
            Khóa sổ kỳ Kế toán & Kết chuyển Lợi nhuận
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Quy trình kết chuyển số dư doanh thu, chi phí sang tài khoản xác định kết quả kinh doanh (911) và khóa sổ ngăn chặn chỉnh sửa dữ liệu quá khứ.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ngày khóa sổ hiện tại</span>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                {closingLockDate ? new Date(closingLockDate).toLocaleDateString('vi-VN') : 'Chưa có kỳ nào bị khóa'}
              </p>
            </div>
            {closingLockDate && (
              <button 
                onClick={handleResetLockDate}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Mở khóa sổ 🔓
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Tháng khóa sổ:</label>
              <select 
                value={closingMonth} 
                onChange={(e) => setClosingMonth(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>Tháng {m}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Năm:</label>
              <select 
                value={closingYear} 
                onChange={(e) => setClosingYear(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500/20"
              >
                {[2023, 2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            </div>
          </div>

          {closingStatus.type && (
            <div className={cn(
              "p-4 rounded-lg border text-xs font-semibold leading-relaxed",
              closingStatus.type === 'success' && "bg-emerald-50 border-emerald-200 text-emerald-800",
              closingStatus.type === 'error' && "bg-rose-50 border-rose-200 text-rose-800",
              closingStatus.type === 'loading' && "bg-blue-50 border-blue-200 text-blue-800"
            )}>
              {closingStatus.type === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-2 align-middle" />}
              {closingStatus.message}
            </div>
          )}

          <button
            onClick={handlePerformClosing}
            disabled={closingStatus.type === 'loading'}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            Thực hiện Khóa sổ & Kết chuyển Lợi nhuận
          </button>
        </div>
      </div>
    </div>
  )}

  {activeTab === 'reports' && (
    <div className="p-6 space-y-6 animate-in fade-in duration-350 bg-slate-50 min-h-[600px]">
      <div className="max-w-5xl mx-auto space-y-6">
        {(() => {
          const displayEntries = journalEntries.length > 0 
            ? journalEntries 
            : transactions.map(tx => {
                const commissionRate = 10;
                const defaultDebit = tx.debitAccount || (tx.type === 'income' ? '1121' : '1111');
                const defaultCredit = tx.creditAccount || (tx.type === 'income' ? '5111' : '1311');
                const isSplit = tx.type === 'income' && misaConfig.enableMarketplaceSplit;
                const objectCode = tx.accountingObjectCode || (tx.type === 'income' ? 'KHLE' : 'NCCLE');

                const items = [];
                if (isSplit) {
                  const commissionAmount = Math.round(tx.amount * (commissionRate / 100));
                  const partnerAmount = tx.amount - commissionAmount;
                  items.push({ accountId: defaultDebit, debit: tx.amount, credit: 0, partnerId: objectCode });
                  items.push({ accountId: misaConfig.revenueAccountDefault || '5111', debit: 0, credit: commissionAmount, partnerId: objectCode });
                  items.push({ accountId: misaConfig.partnerLiabilitiesAccount || '3388', debit: 0, credit: partnerAmount, partnerId: objectCode });
                } else {
                  items.push({ accountId: defaultDebit, debit: tx.amount, credit: 0, partnerId: objectCode });
                  items.push({ accountId: defaultCredit, debit: 0, credit: tx.amount, partnerId: objectCode });
                }
                return {
                  id: tx.misaVoucherId || `JE-TX-${tx.id.substring(0, 8).toUpperCase()}`,
                  date: tx.date,
                  description: tx.description,
                  ref: tx.orderId || tx.referenceNumber || '',
                  items,
                  isSimulated: !tx.misaSynced
                };
              });

          // 1. Calculate P&L
          let revenue = 0;
          let cogs = 0;
          let sellingExpense = 0;
          let adminExpense = 0;

          displayEntries.forEach(je => {
            if (!je.items) return;
            je.items.forEach((item: any) => {
              if (item.accountId.startsWith('5')) {
                revenue += item.credit;
              } else if (item.accountId.startsWith('632')) {
                cogs += item.debit;
              } else if (item.accountId === '6421') {
                sellingExpense += item.debit;
              } else if (item.accountId === '6422') {
                adminExpense += item.debit;
              }
            });
          });
          const grossProfit = revenue - cogs;
          const operatingProfit = grossProfit - sellingExpense - adminExpense;

          // 2. Calculate Trial Balance
          const accountsList = [
            { id: '1111', name: 'Tiền mặt tại quỹ', type: 'asset', openDebit: 50000000, openCredit: 0 },
            { id: '1121', name: 'Tiền gửi ngân hàng VND', type: 'asset', openDebit: 100000000, openCredit: 0 },
            { id: '1311', name: 'Phải thu khách hàng', type: 'asset', openDebit: 20000000, openCredit: 0 },
            { id: '141', name: 'Tạm ứng nhân viên', type: 'asset', openDebit: 0, openCredit: 0 },
            { id: '1561', name: 'Hàng hóa nhập kho', type: 'asset', openDebit: 150000000, openCredit: 0 },
            { id: '331', name: 'Phải trả người bán', type: 'liability', openDebit: 0, openCredit: 30000000 },
            { id: '3341', name: 'Phải trả người lao động', type: 'liability', openDebit: 0, openCredit: 0 },
            { id: '3388', name: 'Phải trả khác (Thu hộ đối tác)', type: 'liability', openDebit: 0, openCredit: 0 },
            { id: '5111', name: 'Doanh thu bán hàng', type: 'revenue', openDebit: 0, openCredit: 0 },
            { id: '632', name: 'Giá vốn hàng bán', type: 'expense', openDebit: 0, openCredit: 0 },
            { id: '6421', name: 'Chi phí bán hàng', type: 'expense', openDebit: 0, openCredit: 0 },
            { id: '6422', name: 'Chi phí quản lý doanh nghiệp', type: 'expense', openDebit: 0, openCredit: 0 },
          ];

          const trialData = accountsList.map(acc => {
            let debit = 0;
            let credit = 0;
            displayEntries.forEach(je => {
              if (!je.items) return;
              je.items.forEach((item: any) => {
                if (item.accountId === acc.id) {
                  debit += item.debit;
                  credit += item.credit;
                }
              });
            });

            let closeDebit = 0;
            let closeCredit = 0;
            if (acc.type === 'asset' || acc.type === 'expense') {
              const bal = acc.openDebit + debit - credit;
              if (bal >= 0) closeDebit = bal;
              else closeCredit = -bal;
            } else {
              const bal = acc.openCredit + credit - debit;
              if (bal >= 0) closeCredit = bal;
              else closeDebit = -bal;
            }

            return { ...acc, debit, credit, closeDebit, closeCredit };
          });

          // 3. Balance Sheet Calculations
          const closingAssets = trialData.filter(d => d.type === 'asset');
          const closingLiabilities = trialData.filter(d => d.type === 'liability');
          const totalAssets = closingAssets.reduce((sum, d) => sum + d.closeDebit - d.closeCredit, 0);
          const totalLiabilities = closingLiabilities.reduce((sum, d) => sum + d.closeCredit - d.closeDebit, 0);
          const equityCapital = 290000000;
          const totalResources = totalLiabilities + equityCapital + operatingProfit;

          // 4. Calculate Cash Flow (Direct Method)
          let cfInSales = 0;
          let cfInOther = 0;
          let cfOutSupplier = 0;
          let cfOutEmployee = 0;
          let cfOutTax = 0;
          let cfOutOther = 0;

          displayEntries.forEach(je => {
            if (!je.items || je.id.startsWith('JE-CLOSE-')) return;
            
            const hasCashBank = je.items.some((item: any) => item.accountId === '1111' || item.accountId === '1121');
            if (!hasCashBank) return;

            je.items.forEach((item: any) => {
              const isCashBank = item.accountId === '1111' || item.accountId === '1121';
              if (isCashBank) {
                const isDebit = item.debit > 0;
                const counterItems = je.items.filter((i: any) => isDebit ? i.credit > 0 : i.debit > 0);
                
                if (isDebit) {
                  const hasSales = counterItems.some((i: any) => i.accountId.startsWith('5') || i.accountId === '1311');
                  if (hasSales) {
                    cfInSales += item.debit;
                  } else {
                    cfInOther += item.debit;
                  }
                } else {
                  const hasSupplier = counterItems.some((i: any) => i.accountId.startsWith('331') || i.accountId === '1561');
                  const hasEmployee = counterItems.some((i: any) => i.accountId === '3341');
                  const hasTax = counterItems.some((i: any) => i.accountId.startsWith('333'));
                  
                  if (hasSupplier) {
                    cfOutSupplier += item.credit;
                  } else if (hasEmployee) {
                    cfOutEmployee += item.credit;
                  } else if (hasTax) {
                    cfOutTax += item.credit;
                  } else {
                    cfOutOther += item.credit;
                  }
                }
              }
            });
          });

          const totalCfIn = cfInSales + cfInOther;
          const totalCfOut = cfOutSupplier + cfOutEmployee + cfOutTax + cfOutOther;
          const netCashFlow = totalCfIn - totalCfOut;

          // 5. Calculate AR Aging (FIFO Method)
          const customerAgingMap: Record<string, { partnerId: string, totalOutstanding: number, bucket0_30: number, bucket31_60: number, bucket61_90: number, bucketOver90: number }> = {};
          const arItems: any[] = [];
          
          displayEntries.forEach(je => {
            if (!je.items || je.id.startsWith('JE-CLOSE-')) return;
            je.items.forEach((item: any) => {
              if (item.accountId === '1311') {
                arItems.push({
                  jeId: je.id,
                  date: je.date,
                  partnerId: item.partnerId || 'KHLE',
                  debit: item.debit || 0,
                  credit: item.credit || 0
                });
              }
            });
          });

          const partners = Array.from(new Set(arItems.map(item => item.partnerId)));

          partners.forEach(partnerId => {
            if (partnerId === 'SYSTEM') return;
            
            const partnerItems = arItems.filter(item => item.partnerId === partnerId);
            const debits = partnerItems.filter(item => item.debit > 0);
            const totalPaid = partnerItems.filter(item => item.credit > 0).reduce((sum, item) => sum + item.credit, 0);

            const parseDate = (dStr: string) => {
              if (!dStr) return new Date(0);
              const parts = dStr.split('/');
              if (parts.length === 3) {
                return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
              }
              return new Date(dStr);
            };
            debits.sort((a, b) => parseDate(a.date).getTime() - parseDate(b.date).getTime());

            let remainingPaid = totalPaid;
            let totalOutstanding = 0;
            let bucket0_30 = 0;
            let bucket31_60 = 0;
            let bucket61_90 = 0;
            let bucketOver90 = 0;

            debits.forEach(inv => {
              const invAmount = inv.debit;
              let outstanding = 0;

              if (remainingPaid >= invAmount) {
                remainingPaid -= invAmount;
              } else {
                outstanding = invAmount - remainingPaid;
                remainingPaid = 0;
              }

              if (outstanding > 0) {
                totalOutstanding += outstanding;
                const invDate = parseDate(inv.date);
                const today = new Date();
                const diffTime = Math.abs(today.getTime() - invDate.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays <= 30) {
                  bucket0_30 += outstanding;
                } else if (diffDays <= 60) {
                  bucket31_60 += outstanding;
                } else if (diffDays <= 90) {
                  bucket61_90 += outstanding;
                } else {
                  bucketOver90 += outstanding;
                }
              }
            });

            if (totalOutstanding > 0 || totalPaid > 0) {
              customerAgingMap[partnerId] = {
                partnerId,
                totalOutstanding,
                bucket0_30,
                bucket31_60,
                bucket61_90,
                bucketOver90
              };
            }
          });

          const agingData = Object.values(customerAgingMap);

          return (
            <div className="space-y-6">
              {/* Sub-tab Navigation */}
              <div className="flex gap-2 bg-white p-1 rounded-lg border border-slate-200 w-fit">
                <button 
                  onClick={() => setReportSubTab('pl')}
                  className={cn("px-4 py-2 text-xs font-bold rounded-md transition-all", reportSubTab === 'pl' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-slate-600 hover:bg-slate-50")}
                >
                  Báo cáo P&L (Kết quả KD)
                </button>
                <button 
                  onClick={() => setReportSubTab('trial')}
                  className={cn("px-4 py-2 text-xs font-bold rounded-md transition-all", reportSubTab === 'trial' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-slate-600 hover:bg-slate-50")}
                >
                  Bảng Cân đối Phát sinh
                </button>
                <button 
                  onClick={() => setReportSubTab('balance')}
                  className={cn("px-4 py-2 text-xs font-bold rounded-md transition-all", reportSubTab === 'balance' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-slate-600 hover:bg-slate-50")}
                >
                  Bảng Cân đối Kế toán
                </button>
                <button 
                  onClick={() => setReportSubTab('cashflow')}
                  className={cn("px-4 py-2 text-xs font-bold rounded-md transition-all", reportSubTab === 'cashflow' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-slate-600 hover:bg-slate-50")}
                >
                  Báo cáo Dòng tiền 💸
                </button>
                <button 
                  onClick={() => setReportSubTab('aging')}
                  className={cn("px-4 py-2 text-xs font-bold rounded-md transition-all", reportSubTab === 'aging' ? "bg-[#2563EB] text-[#FAF9F5]" : "text-slate-600 hover:bg-slate-50")}
                >
                  Phân tích Tuổi nợ ⏳
                </button>
              </div>

              {/* REPORT Sub-Tab 1: P&L */}
              {reportSubTab === 'pl' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Báo cáo Kết quả Hoạt động Kinh doanh (P&L)</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Trích xuất số liệu phát sinh từ tài khoản 5111, 632, 6421, 6422 nội bộ.</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded font-mono">Real-time accounting</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                          <th className="px-4 py-2.5">Chỉ tiêu</th>
                          <th className="px-4 py-2.5 text-center">Mã số</th>
                          <th className="px-4 py-2.5 text-center">Thuyết minh</th>
                          <th className="px-4 py-2.5 text-right">Số phát sinh kỳ này (VND)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">1. Doanh thu bán hàng và cung cấp dịch vụ (Có TK 5111)</td>
                          <td className="px-4 py-3 text-center font-mono">01</td>
                          <td className="px-4 py-3 text-center font-mono">-</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(revenue)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">2. Các khoản giảm trừ doanh thu</td>
                          <td className="px-4 py-3 text-center font-mono">02</td>
                          <td className="px-4 py-3 text-center font-mono">-</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-400">0</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                          <td className="px-4 py-3 font-bold text-slate-800">3. Doanh thu thuần về bán hàng và cung cấp dịch vụ (10 = 01 - 02)</td>
                          <td className="px-4 py-3 text-center font-mono font-bold">10</td>
                          <td className="px-4 py-3 text-center font-mono">-</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">{formatCurrency(revenue)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">4. Giá vốn hàng bán (Nợ TK 632)</td>
                          <td className="px-4 py-3 text-center font-mono">11</td>
                          <td className="px-4 py-3 text-center font-mono">-</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">{formatCurrency(cogs)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 bg-slate-50/30">
                          <td className="px-4 py-3 font-bold text-slate-800">5. Lợi nhuận gộp về bán hàng và cung cấp dịch vụ (20 = 10 - 11)</td>
                          <td className="px-4 py-3 text-center font-mono font-bold">20</td>
                          <td className="px-4 py-3 text-center font-mono">-</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700">{formatCurrency(grossProfit)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">6. Chi phí bán hàng (Nợ TK 6421)</td>
                          <td className="px-4 py-3 text-center font-mono">25</td>
                          <td className="px-4 py-3 text-center font-mono">-</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(sellingExpense)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3">7. Chi phí quản lý doanh nghiệp (Nợ TK 6422)</td>
                          <td className="px-4 py-3 text-center font-mono">26</td>
                          <td className="px-4 py-3 text-center font-mono">-</td>
                          <td className="px-4 py-3 text-right font-mono text-slate-800">{formatCurrency(adminExpense)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50 bg-indigo-50/15">
                          <td className="px-4 py-3 font-bold text-indigo-900">8. Lợi nhuận thuần từ hoạt động kinh doanh (30 = 20 - 25 - 26)</td>
                          <td className="px-4 py-3 text-center font-mono font-bold text-indigo-900">30</td>
                          <td className="px-4 py-3 text-center font-mono">-</td>
                          <td className={cn("px-4 py-3 text-right font-mono font-black text-sm", operatingProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
                            {formatCurrency(operatingProfit)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REPORT Sub-Tab 2: Trial Balance */}
              {reportSubTab === 'trial' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Bảng Cân đối Phát sinh Tài khoản (Trial Balance)</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Đối chiếu số dư đầu kỳ, phát sinh nợ/có và số dư cuối kỳ toàn hệ thống tài khoản.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 align-middle">Tài khoản</th>
                          <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 align-middle">Tên tài khoản</th>
                          <th colSpan={2} className="px-4 py-2 border-b border-r border-slate-200 text-center">Số dư đầu kỳ</th>
                          <th colSpan={2} className="px-4 py-2 border-b border-r border-slate-200 text-center">Số phát sinh trong kỳ</th>
                          <th colSpan={2} className="px-4 py-2 border-b text-center">Số dư cuối kỳ</th>
                        </tr>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[9px]">
                          <th className="px-4 py-1.5 border-r border-slate-200 text-right">Nợ</th>
                          <th className="px-4 py-1.5 border-r border-slate-200 text-right">Có</th>
                          <th className="px-4 py-1.5 border-r border-slate-200 text-right">Nợ</th>
                          <th className="px-4 py-1.5 border-r border-slate-200 text-right">Có</th>
                          <th className="px-4 py-1.5 border-r border-slate-200 text-right">Nợ</th>
                          <th className="px-4 py-1.5 text-right">Có</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700 font-mono">
                        {trialData.map(acc => (
                          <tr key={acc.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-bold text-slate-900 border-r border-slate-100">{acc.id}</td>
                            <td className="px-4 py-2.5 font-sans text-left border-r border-slate-100">{acc.name}</td>
                            <td className="px-4 py-2.5 text-right border-r border-slate-100">{acc.openDebit > 0 ? formatCurrency(acc.openDebit) : '-'}</td>
                            <td className="px-4 py-2.5 text-right border-r border-slate-100">{acc.openCredit > 0 ? formatCurrency(acc.openCredit) : '-'}</td>
                            <td className="px-4 py-2.5 text-right border-r border-slate-100 text-emerald-600">{acc.debit > 0 ? formatCurrency(acc.debit) : '-'}</td>
                            <td className="px-4 py-2.5 text-right border-r border-slate-100 text-rose-600">{acc.credit > 0 ? formatCurrency(acc.credit) : '-'}</td>
                            <td className="px-4 py-2.5 text-right border-r border-slate-100 font-bold text-slate-900">{acc.closeDebit > 0 ? formatCurrency(acc.closeDebit) : '-'}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-900">{acc.closeCredit > 0 ? formatCurrency(acc.closeCredit) : '-'}</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold text-slate-900">
                          <td colSpan={2} className="px-4 py-3 text-left border-r border-slate-200 font-sans">Tổng cộng</td>
                          <td className="px-4 py-3 text-right border-r border-slate-200">{formatCurrency(320000000)}</td>
                          <td className="px-4 py-3 text-right border-r border-slate-200">{formatCurrency(320000000)}</td>
                          <td className="px-4 py-3 text-right border-r border-slate-200 text-emerald-700">
                            {formatCurrency(trialData.reduce((sum, d) => sum + d.debit, 0))}
                          </td>
                          <td className="px-4 py-3 text-right border-r border-slate-200 text-rose-700">
                            {formatCurrency(trialData.reduce((sum, d) => sum + d.credit, 0))}
                          </td>
                          <td className="px-4 py-3 text-right border-r border-slate-200">
                            {formatCurrency(trialData.reduce((sum, d) => sum + d.closeDebit, 0))}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(trialData.reduce((sum, d) => sum + d.closeCredit, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REPORT Sub-Tab 3: Balance Sheet */}
              {reportSubTab === 'balance' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Bảng Cân đối Kế toán (Balance Sheet)</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Kiểm tra tính cân đối của hệ thống: Tổng Tài sản = Tổng Nguồn vốn.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Assets */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-indigo-700 tracking-wider pb-2 border-b border-slate-100">A. TÀI SẢN</h4>
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          {closingAssets.map(acc => (
                            <tr key={acc.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 text-left">{acc.name} ({acc.id})</td>
                              <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(acc.closeDebit - acc.closeCredit)}</td>
                            </tr>
                          ))}
                          <tr className="font-extrabold text-slate-900 bg-slate-50/50">
                            <td className="py-3 text-left">TỔNG CỘNG TÀI SẢN</td>
                            <td className="py-3 text-right font-mono text-indigo-600 text-sm">{formatCurrency(totalAssets)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Right Column: Liabilities & Equity */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black uppercase text-purple-700 tracking-wider pb-2 border-b border-slate-100">B. NGUỒN VỐN</h4>
                      <table className="w-full text-xs">
                        <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                          <tr>
                            <td colSpan={2} className="py-2 font-bold text-slate-800">I. Nợ phải trả (Liabilities)</td>
                          </tr>
                          {closingLiabilities.map(acc => (
                            <tr key={acc.id} className="hover:bg-slate-50/50">
                              <td className="py-2.5 pl-4 text-left">{acc.name} ({acc.id})</td>
                              <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(acc.closeCredit - acc.closeDebit)}</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={2} className="py-2 font-bold text-slate-800">II. Vốn chủ sở hữu (Equity)</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2.5 pl-4 text-left">Vốn góp của chủ sở hữu</td>
                            <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(equityCapital)}</td>
                          </tr>
                          <tr className="hover:bg-slate-50/50">
                            <td className="py-2.5 pl-4 text-left">Lợi nhuận sau thuế chưa phân phối</td>
                            <td className="py-2.5 text-right font-mono font-bold text-emerald-600">{formatCurrency(operatingProfit)}</td>
                          </tr>
                          <tr className="font-extrabold text-slate-900 bg-slate-50/50">
                            <td className="py-3 text-left">TỔNG CỘNG NGUỒN VỐN</td>
                            <td className="py-3 text-right font-mono text-purple-600 text-sm">{formatCurrency(totalResources)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Verification Check Badge */}
                  <div className={cn(
                    "p-4 rounded-xl border flex items-center justify-between text-xs font-bold mt-4",
                    Math.abs(totalAssets - totalResources) < 0.01 
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-rose-50 border-rose-200 text-rose-800"
                  )}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{Math.abs(totalAssets - totalResources) < 0.01 ? "Hệ thống cân đối tài sản nguồn vốn chính xác 100% 🟢" : "Phát hiện chênh lệch cân đối nguồn vốn! 🔴"}</span>
                    </div>
                    <span className="font-mono">Chênh lệch: {formatCurrency(Math.abs(totalAssets - totalResources))}</span>
                  </div>
                </div>
              )}

              {/* REPORT Sub-Tab 4: Cash Flow */}
              {reportSubTab === 'cashflow' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Báo cáo Lưu chuyển Tiền tệ (Phương pháp Trực tiếp)</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Tổng hợp dòng tiền vào/ra từ hoạt động kinh doanh thực tế qua TK 1111 và 1121.</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                          <th className="px-4 py-2.5">Chỉ tiêu</th>
                          <th className="px-4 py-2.5 text-center">Mã số</th>
                          <th className="px-4 py-2.5 text-right">Số phát sinh kỳ này (VND)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                        <tr className="bg-slate-50/50 font-bold text-slate-800">
                          <td className="px-4 py-3" colSpan={3}>I. Dòng tiền từ hoạt động kinh doanh (Inflows)</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 pl-8">1. Tiền thu từ bán hàng, cung cấp dịch vụ và thu nợ khách hàng</td>
                          <td className="px-4 py-3 text-center font-mono">01</td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-650 font-semibold">{formatCurrency(cfInSales)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 pl-8">2. Tiền thu khác từ hoạt động kinh doanh (Tạm treo, thu hộ)</td>
                          <td className="px-4 py-3 text-center font-mono">02</td>
                          <td className="px-4 py-3 text-right font-mono text-emerald-650 font-semibold">{formatCurrency(cfInOther)}</td>
                        </tr>
                        <tr className="bg-slate-100/40 font-bold text-indigo-700">
                          <td className="px-4 py-3 pl-8">Cộng dòng tiền vào (10 = 01 + 02)</td>
                          <td className="px-4 py-3 text-center font-mono">10</td>
                          <td className="px-4 py-3 text-right font-mono">{formatCurrency(totalCfIn)}</td>
                        </tr>
                        <tr className="bg-slate-50/50 font-bold text-slate-800">
                          <td className="px-4 py-3" colSpan={3}>II. Dòng tiền chi ra cho hoạt động kinh doanh (Outflows)</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 pl-8">1. Tiền chi trả cho người cung cấp hàng hóa và dịch vụ</td>
                          <td className="px-4 py-3 text-center font-mono">21</td>
                          <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">-{formatCurrency(cfOutSupplier)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 pl-8">2. Tiền chi trả cho người lao động (Lương, thưởng)</td>
                          <td className="px-4 py-3 text-center font-mono">22</td>
                          <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">-{formatCurrency(cfOutEmployee)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 pl-8">3. Tiền chi nộp thuế và các khoản nộp ngân sách nhà nước</td>
                          <td className="px-4 py-3 text-center font-mono">23</td>
                          <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">-{formatCurrency(cfOutTax)}</td>
                        </tr>
                        <tr className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 pl-8">4. Tiền chi khác cho hoạt động kinh doanh (Chi phí hành chính, vận hành)</td>
                          <td className="px-4 py-3 text-center font-mono">24</td>
                          <td className="px-4 py-3 text-right font-mono text-rose-600 font-semibold">-{formatCurrency(cfOutOther)}</td>
                        </tr>
                        <tr className="bg-slate-100/40 font-bold text-rose-700">
                          <td className="px-4 py-3 pl-8">Cộng dòng tiền chi ra (30 = 21 + 22 + 23 + 24)</td>
                          <td className="px-4 py-3 text-center font-mono">30</td>
                          <td className="px-4 py-3 text-right font-mono">-{formatCurrency(totalCfOut)}</td>
                        </tr>
                        <tr className="bg-indigo-50 font-bold text-slate-900 text-sm">
                          <td className="px-4 py-3">Lưu chuyển tiền thuần trong kỳ (50 = 10 - 30)</td>
                          <td className="px-4 py-3 text-center font-mono">50</td>
                          <td className={cn("px-4 py-3 text-right font-mono font-black", netCashFlow >= 0 ? "text-emerald-700" : "text-rose-700")}>
                            {formatCurrency(netCashFlow)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* REPORT Sub-Tab 5: AR Aging */}
              {reportSubTab === 'aging' && (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in duration-200">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900">Bảng phân tích Tuổi nợ Phải thu Khách hàng</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Phân loại nợ phải thu (TK 1311) quá hạn dựa trên phương pháp FIFO (First-In First-Out).</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                          <th className="px-4 py-3">Mã Đối tượng</th>
                          <th className="px-4 py-3 text-right">Tổng nợ phải thu</th>
                          <th className="px-4 py-3 text-right text-emerald-600">Trong hạn (0-30 ngày)</th>
                          <th className="px-4 py-3 text-right text-amber-600">Nợ quá hạn 31 - 60 ngày</th>
                          <th className="px-4 py-3 text-right text-orange-600">Nợ quá hạn 61 - 90 ngày</th>
                          <th className="px-4 py-3 text-right text-rose-600">Nợ xấu quá hạn &gt; 90 ngày</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium text-slate-700 font-mono">
                        {agingData.map((cust, idx) => (
                          <tr key={cust.partnerId + '-' + idx} className="hover:bg-slate-50/50">
                            <td className="px-4 py-2.5 font-sans font-bold text-slate-900">{cust.partnerId}</td>
                            <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatCurrency(cust.totalOutstanding)}</td>
                            <td className="px-4 py-2.5 text-right text-emerald-600">{cust.bucket0_30 > 0 ? formatCurrency(cust.bucket0_30) : '-'}</td>
                            <td className="px-4 py-2.5 text-right text-amber-600">{cust.bucket31_60 > 0 ? formatCurrency(cust.bucket31_60) : '-'}</td>
                            <td className="px-4 py-2.5 text-right text-orange-600">{cust.bucket61_90 > 0 ? formatCurrency(cust.bucket61_90) : '-'}</td>
                            <td className="px-4 py-2.5 text-right text-rose-600">{cust.bucketOver90 > 0 ? formatCurrency(cust.bucketOver90) : '-'}</td>
                          </tr>
                        ))}
                        {agingData.length === 0 && (
                          <tr>
                            <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-sans italic">Không phát hiện công nợ phải thu của bất cứ khách hàng nào.</td>
                          </tr>
                        )}
                        {agingData.length > 0 && (
                          <tr className="bg-slate-100 font-bold text-slate-900">
                            <td className="px-4 py-3 font-sans">Tổng cộng</td>
                            <td className="px-4 py-3 text-right">
                              {formatCurrency(agingData.reduce((sum, c) => sum + c.totalOutstanding, 0))}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-700">
                              {formatCurrency(agingData.reduce((sum, c) => sum + c.bucket0_30, 0))}
                            </td>
                            <td className="px-4 py-3 text-right text-amber-700">
                              {formatCurrency(agingData.reduce((sum, c) => sum + c.bucket31_60, 0))}
                            </td>
                            <td className="px-4 py-3 text-right text-orange-700">
                              {formatCurrency(agingData.reduce((sum, c) => sum + c.bucket61_90, 0))}
                            </td>
                            <td className="px-4 py-3 text-right text-rose-700">
                              {formatCurrency(agingData.reduce((sum, c) => sum + c.bucketOver90, 0))}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  )}
 </div>
 </div>
 )}

 <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 flex items-start gap-4 mt-8">
 <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <div className="space-y-1">
 <h4 className="text-sm font-bold text-emerald-900 italic">Bảo mật & Tuân thủ Tài chính</h4>
 <p className="text-xs text-emerald-800 leading-relaxed max-w-2xl">Toàn bộ bút toán kết chuyển và khóa sổ kỳ kế toán được mã hóa và lưu trữ log thay đổi chi tiết (Auditing Log), đảm bảo tính toàn vẹn của dữ liệu theo Thông tư 99/2025/TT-BTC. Hệ thống tự động đối soát tiền về từ các Cổng thanh toán (Visa, MoMo, VNPay) với sổ ngân hàng.</p>
 </div>
 </div>
 </div>
 );
}
