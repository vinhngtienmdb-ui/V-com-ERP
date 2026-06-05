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
  Loader2
} from 'lucide-react';
import { getMisaConfig, syncTransactionToMisa, unpostTransaction } from '../services/misaService';
import { db, auth } from '../lib/firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp, limit } from 'firebase/firestore';
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
 const [activeTab, setActiveTab] = useState<'overview' | 'journal' | 'ledger' | 'reports' | 'ocr'>('overview');
 const [loading, setLoading] = useState(true);
 const [ocrFile, setOcrFile] = useState<File | null>(null);
 const [isScanning, setIsScanning] = useState(false);
 const [scanResult, setScanResult] = useState<any>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [unpostingId, setUnpostingId] = useState<string | null>(null);
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>('1121');

  const handleSyncToMisa = async (txId: string) => {
    setSyncingId(txId);
    try {
      await syncTransactionToMisa(txId);
    } catch (err) {
      console.error('[Finance] MISA sync failed:', err);
    } finally {
      setSyncingId(null);
    }
  };

  const handleUnpost = async (txId: string) => {
    setUnpostingId(txId);
    try {
      await unpostTransaction(txId);
    } catch (err) {
      console.error('[Finance] Unpost failed:', err);
    } finally {
      setUnpostingId(null);
    }
  };

  const misaConfig = getMisaConfig();

 useEffect(() => {
 const q = query(collection(db, 'finance_transactions'), limit(50));
 const unsubscribe = onSnapshot(q, (snapshot) => {
 const docs = snapshot.docs.map(doc => ({
 id: doc.id,
 ...doc.data(),
 date: doc.data().date?.toDate()?.toLocaleDateString('vi-VN') || doc.data().dateStr || ''
 })) as FinanceTransaction[];
 setTransactions(docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
 setLoading(false);
 });

 return () => unsubscribe();
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
 { id: 'ocr', label: 'Smart OCR', icon: Scan },
 { id: 'reports', label: 'Báo cáo QT', icon: PieChart }
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
  <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Diễn giải</th>
  <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Nợ (Debit)</th>
  <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Có (Credit)</th>
  <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest">Đối tượng</th>
  <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Số tiền (VND)</th>
  <th className="px-6 py-4 text-[10px] font-bold text-[#6B7280] uppercase tracking-widest text-center">
    {misaConfig.localAccountingMode ? 'Trạng thái Ghi sổ' : 'Đồng bộ MISA'}
  </th>
  </tr>
  </thead>
  <tbody className="divide-y divide-[#F3F4F6]">
  {transactions.map((tx) => (
  <tr key={tx.id} className="hover:bg-[#F9FAFB] transition-colors">
  <td className="px-6 py-4">
  <div className="flex items-center gap-2">
  <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
  <span className="text-sm text-[#111827] font-medium">{tx.date}</span>
  </div>
  </td>
  <td className="px-6 py-4">
  <span className="text-sm text-[#111827] font-medium">{tx.description}</span>
  </td>
  <td className="px-6 py-4">
  <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 border border-blue-100 rounded">
    {tx.debitAccount || (tx.type === 'income' ? '1121' : '1111')}
  </span>
  </td>
  <td className="px-6 py-4">
    {tx.type === 'income' && misaConfig.enableMarketplaceSplit ? (
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 border border-purple-100 rounded w-fit">
          {misaConfig.revenueAccountDefault || '5111'} (10% Phí)
        </span>
        <span className="font-mono text-[10px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 border border-purple-100 rounded w-fit">
          {misaConfig.partnerLiabilitiesAccount || '3388'} (90% Sàn)
        </span>
      </div>
    ) : (
      <span className="font-mono text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 border border-purple-100 rounded">
        {tx.creditAccount || (tx.type === 'income' ? '5111' : '1311')}
      </span>
    )}
  </td>
  <td className="px-6 py-4">
  <span className="font-mono text-xs text-slate-700 bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
    {tx.accountingObjectCode || 'KHLE'}
  </span>
  </td>
  <td className="px-6 py-4 text-right">
  <span className={cn(
  "text-xs font-bold",
  tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
  )}>
  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
  </span>
  </td>
  <td className="px-6 py-4 text-center">
    <div className="flex items-center justify-center gap-2">
      {tx.misaSynced ? (
        <div className="flex items-center gap-2">
          <span 
            title={'Mã chứng từ: ' + tx.misaVoucherId}
            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 rounded-full"
          >
            {misaConfig.localAccountingMode ? 'Đã ghi sổ 🟢' : 'Đã đồng bộ 🟢'}
          </span>
          <button
            onClick={() => handleUnpost(tx.id)}
            disabled={unpostingId === tx.id}
            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-semibold rounded-lg border border-slate-200 cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            {unpostingId === tx.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Hủy ghi sổ ↩️
          </button>
        </div>
      ) : tx.misaSyncError ? (
        <div className="flex items-center gap-1.5">
          <span 
            title={'Lỗi: ' + tx.misaSyncError}
            className="px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200 rounded-full cursor-help"
          >
            {misaConfig.localAccountingMode ? 'Lỗi kiểm tra 🔴' : 'Lỗi đồng bộ 🔴'}
          </span>
          <button
            onClick={() => handleSyncToMisa(tx.id)}
            disabled={syncingId === tx.id}
            className="px-2 py-1 bg-slate-900 text-white hover:bg-slate-800 text-[10px] font-semibold rounded-lg shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
          >
            {syncingId === tx.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {misaConfig.localAccountingMode ? 'Hạch toán lại 🔄' : 'Thử lại 🔄'}
          </button>
        </div>
      ) : (
        <button
          onClick={() => handleSyncToMisa(tx.id)}
          disabled={syncingId === tx.id}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1 disabled:opacity-50"
        >
          {syncingId === tx.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {misaConfig.localAccountingMode ? 'Ghi sổ Kế toán' : 'Đồng bộ MISA'}
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
        const isAsset = ['1111', '1121', '1311', '141'].includes(selectedLedgerAccount);
        const isExpense = ['632', '6421', '6422'].includes(selectedLedgerAccount);
        const startingBalance = isAsset ? 100000000 : 0;

        const postedTxs = transactions.filter(t => t.misaSynced);

        const ledgerEntries = postedTxs.map(tx => {
          let debit = 0;
          let credit = 0;
          let counterAccount = '';

          const defaultDebit = tx.debitAccount || (tx.type === 'income' ? '1121' : '1111');
          const isSplit = tx.type === 'income' && misaConfig.enableMarketplaceSplit;

          if (defaultDebit === selectedLedgerAccount) {
            debit = tx.amount;
            counterAccount = isSplit ? `${misaConfig.revenueAccountDefault || '5111'} / ${misaConfig.partnerLiabilitiesAccount || '3388'}` : (tx.creditAccount || '5111');
          }

          if (isSplit) {
            const revAcc = misaConfig.revenueAccountDefault || '5111';
            const partnerAcc = misaConfig.partnerLiabilitiesAccount || '3388';
            const commissionAmount = Math.round(tx.amount * 0.1);
            const partnerAmount = tx.amount - commissionAmount;

            if (revAcc === selectedLedgerAccount) {
              credit = commissionAmount;
              counterAccount = defaultDebit;
            }
            if (partnerAcc === selectedLedgerAccount) {
              credit = partnerAmount;
              counterAccount = defaultDebit;
            }
          } else {
            const defaultCredit = tx.creditAccount || (tx.type === 'income' ? '5111' : '1311');
            if (defaultCredit === selectedLedgerAccount) {
              credit = tx.amount;
              counterAccount = defaultDebit;
            }
          }

          return {
            id: tx.id,
            date: tx.date,
            description: tx.description,
            debit,
            credit,
            counterAccount
          };
        }).filter(entry => entry.debit > 0 || entry.credit > 0);

        ledgerEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        let currentBalance = startingBalance;
        let totalDebit = 0;
        let totalCredit = 0;

        const ledgerWithBalance = ledgerEntries.map(entry => {
          totalDebit += entry.debit;
          totalCredit += entry.credit;

          if (isAsset || isExpense) {
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

  {activeTab === 'reports' && (
    <div className="p-6 space-y-6 animate-in fade-in duration-350 bg-slate-50 min-h-[600px]">
      <div className="max-w-4xl mx-auto space-y-6">
        {(() => {
          const postedTxs = transactions.filter(t => t.misaSynced);

          let revenue = 0;
          let cogs = 0;
          let sellingExpense = 0;
          let adminExpense = 0;

          postedTxs.forEach(tx => {
            const defaultDebit = tx.debitAccount || (tx.type === 'income' ? '1121' : '1111');
            const isSplit = tx.type === 'income' && misaConfig.enableMarketplaceSplit;

            if (isSplit) {
              const revAcc = misaConfig.revenueAccountDefault || '5111';
              if (revAcc === '5111') {
                revenue += Math.round(tx.amount * 0.1);
              }
            } else {
              const defaultCredit = tx.creditAccount || (tx.type === 'income' ? '5111' : '1311');
              if (defaultCredit === '5111') {
                revenue += tx.amount;
              }
            }

            if (defaultDebit === '632') {
              cogs += tx.amount;
            }

            if (defaultDebit === '6421') {
              sellingExpense += tx.amount;
            }

            if (defaultDebit === '6422') {
              adminExpense += tx.amount;
            }
          });

          const grossProfit = revenue - cogs;
          const operatingProfit = grossProfit - sellingExpense - adminExpense;

          return (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex justify-between items-center border-b border-slate-250 pb-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Báo cáo Kết quả Hoạt động Kinh doanh (P&L)</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Trích xuất số liệu phát sinh từ tài khoản 5111, 632, 6421, 6422 đã ghi sổ.</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded font-mono">Real-time Accounting</span>
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
          );
        })()}

        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Các biểu mẫu báo cáo khác</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Bảng Cân đối Kế toán', desc: 'Phản ánh tình hình tài sản, nợ phải trả và vốn chủ sở hữu tại một thời điểm.' },
              { title: 'Báo cáo Lưu chuyển Tiền tệ', desc: 'Theo dõi dòng tiền vào và ra từ hoạt động KD, đầu tư và tài chính.' }
            ].map((report) => (
              <div key={report.title} className="bg-white p-5 rounded-xl border border-slate-200 flex justify-between items-center group cursor-pointer hover:border-indigo-500 hover:shadow-xs transition-all">
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-[#111827]">{report.title}</h5>
                  <p className="text-[11px] text-[#6B7280]">{report.desc}</p>
                </div>
                <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-xs shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
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
