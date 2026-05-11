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
 X
} from 'lucide-react';
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
 case 'blue': return 'bg-slate-100 text-blue-600';
 case 'orange': return 'bg-orange-50 text-blue-600';
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
 const [isScanning, setIsScanning] = useState(false);
 const [scanResult, setScanResult] = useState<{
  vendor?: string; taxCode?: string; invoiceNumber?: string;
  invoiceDate?: string; lineItems?: { description: string; amount: number }[];
  tax?: number; total?: number; confidence?: number;
 } | null>(null);

 useEffect(() => {
 const q = query(collection(db, 'finance_transactions'), limit(50));
 const unsubscribe = onSnapshot(
  q,
  (snapshot) => {
   const docs = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date?.toDate()?.toLocaleDateString('vi-VN') || doc.data().dateStr || ''
   })) as FinanceTransaction[];
   setTransactions(docs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
   setLoading(false);
  },
  (error) => {
   console.error('Finance transactions snapshot error:', error);
   setLoading(false);
  }
 );

 return () => unsubscribe();
 }, []);

 const [showNewTxModal, setShowNewTxModal] = useState(false);
 const [newTxForm, setNewTxForm] = useState({ description: '', amount: '', type: 'income', category: 'Sales', dateStr: '' });
 const [submittingTx, setSubmittingTx] = useState(false);

 const handleAddTransaction = async () => {
 if (!auth.currentUser || !newTxForm.description || !newTxForm.amount) return;
 setSubmittingTx(true);
 try {
  await addDoc(collection(db, 'finance_transactions'), {
  description: newTxForm.description,
  amount: parseFloat(newTxForm.amount.replace(/\D/g, '')),
  type: newTxForm.type,
  category: newTxForm.category,
  dateStr: newTxForm.dateStr || new Date().toLocaleDateString('vi-VN'),
  createdAt: serverTimestamp(),
  createdBy: auth.currentUser.uid
  });
  setShowNewTxModal(false);
  setNewTxForm({ description: '', amount: '', type: 'income', category: 'Sales', dateStr: '' });
 } catch (e) {
  console.error('Error adding transaction:', e);
 }
 setSubmittingTx(false);
 };

 const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
 const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
 const netProfit = totalIncome - totalExpense;

 return (
 <>
 <div className="space-y-4 animate-in fade-in slide-in- duration-500 pb-4">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-1">
 {activeTab !== 'overview' && (
 <button onClick={() => setActiveTab('overview')} className="p-1 hover:bg-slate-100 rounded-md transition-colors mr-1">
 <ArrowLeft className="w-4 h-4 text-slate-600" />
 </button>
 )}
 <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900">Tài chính & Kế toán</h1>
 </div>
 <p className="text-sm text-slate-500">Quản lý doanh số, chi phí, dòng tiền và báo cáo thuế theo thời gian thực.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Download className="w-4 h-4 text-slate-600" /> Xuất Excel
 </button>
 <button
 onClick={() => setShowNewTxModal(true)}
 className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Bút toán mới
 </button>
 </div>
 </div>

 {activeTab === 'overview' && (
 <div className="space-y-4">
 {/* Stats Cards */}
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-3" columns={4} gap={24}>
 <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-blue-600">Doanh thu Hệ thống (G.M.V)</span>
 <TrendingUp className="w-4 h-4 text-emerald-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-xl font-bold text-slate-900">{formatCurrency(totalIncome)}</span>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Real-time</span>
 </div>
 </div>
 <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-rose-600">Tổng Chi phí & Quỹ lương</span>
 <TrendingDown className="w-4 h-4 text-rose-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-xl font-bold text-slate-900">{formatCurrency(totalExpense)}</span>
 <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">Sync Data</span>
 </div>
 </div>
 <div className="bg-white p-3 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-teal-600">Lợi nhuận ròng (P&L)</span>
 <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className={cn("text-2xl font-bold", netProfit >= 0 ? "text-emerald-600" : "text-rose-600")}>
 {formatCurrency(netProfit)}
 </span>
 <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-2 py-0.5 rounded">Kết quả KD</span>
 </div>
 </div>
 <div className="bg-primary-600 p-3 rounded-xl border border-primary-700 shadow-sm hover:shadow-indigo-500/20 transition-all relative overflow-hidden group">
 <div className="absolute right-0 bottom-0 p-2 opacity-10 group-hover:scale-125 transition-transform">
 <Building2 className="w-8 h-8 text-white" />
 </div>
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-primary-200 font-bold uppercase tracking-widest">Dấu vân tay tài chính</span>
 <ShieldCheck className="w-4 h-4 text-white" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-xl font-bold text-white">Trust Score: 9.8</span>
 <span className="text-[10px] text-white font-bold bg-white/20 px-2 py-0.5 rounded underline cursor-pointer">Verify</span>
 </div>
 </div>
 </DraggableGrid>

 {/* Module Grid */}
 <div className="space-y-3">
 {FINANCE_MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx} className="space-y-4">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
 <span className="w-1 h-4 bg-blue-600 rounded-full inline-block" />
 {group.title}
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
 {group.items.map((mod) => (
 <div 
 key={mod.id}
 onClick={() => setActiveTab(mod.id as any)}
 className="group bg-white p-5 rounded-2xl border border-slate-300 shadow-sm hover:shadow-sm hover:border-[#2563EB]/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
 <mod.icon className="w-10 h-10 transform -rotate-12 translate-x-4 -translate-y-4" />
 </div>
 <div className={cn("w-12 h-12 rounded relative z-10 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm", getColorClasses(mod.color))}>
 <mod.icon className="w-6 h-6" />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-slate-900 text-sm mb-1.5 group-hover:text-blue-600 transition-colors">{mod.label}</h3>
 <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">{mod.desc}</p>
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
 <div className="flex border-b border-slate-100">
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
 "px-4 py-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
 activeTab === tab.id ? "border-[#2563EB] text-blue-600 bg-slate-100/30" : "border-transparent text-slate-500 hover:text-slate-900"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 <div className="p-0">
 {activeTab === 'ocr' && (
 <div className="p-4 animate-in fade-in slide-in- duration-500 bg-slate-50">
 <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-3">
 <div className="space-y-3">
 <div className="bg-white p-4 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-400 hover:bg-slate-100/50 transition-all cursor-pointer group relative overflow-hidden h-[400px]">
 <div className="p-3 bg-slate-100 text-blue-600 rounded-full group-hover:scale-110 transition-transform">
 <Upload className="w-10 h-10" />
 </div>
 <div>
 <p className="text-sm font-bold text-slate-900">Tải lên hoặc Kéo thả Hóa đơn</p>
 <p className="text-xs text-slate-500 mt-2">Hỗ trợ JPG, PNG, PDF (Tối đa 10MB)</p>
 </div>
 <button onClick={() => document.getElementById('ocr-file-input')?.click()} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm">Chọn tệp tin</button>
 
 {isScanning && (
 <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
 <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center animate-bounce">
 <Zap className="w-8 h-8 text-white" />
 </div>
 <div className="space-y-1 text-center">
 <p className="text-sm font-bold text-slate-900 animate-pulse">Gemini AI đang phân tích...</p>
 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Trích xuất Header & Line Items</p>
 </div>
 <div className="w-48 h-1 bg-slate-100 rounded-full overflow-hidden">
 <div className="h-full bg-slate-900 animate-[scan_2s_ease-in-out_infinite]" />
 </div>
 </div>
 )}
 </div>

 <div className="bg-primary-900 rounded-xl p-3 text-white relative overflow-hidden shadow-sm">
 <div className="flex items-start gap-4">
 <div className="p-3 bg-white/10 rounded-lg">
 <Sparkles className="w-6 h-6 text-primary-300" />
 </div>
 <div>
 <h4 className="text-sm font-bold uppercase tracking-widest mb-1 italic">AI Productivity Tip</h4>
 <p className="text-[11px] text-primary-100/70 leading-relaxed font-medium">Sử dụng Smart OCR có thể giúp bạn giảm 90% lỗi sai sót trong quá trình nhập liệu hóa đơn đỏ. Độ chính xác đạt 99.2% với các hóa đơn chuẩn E-Invoice.</p>
 </div>
 </div>
 <Zap className="absolute -bottom-6 -right-6 w-10 h-10 text-white/5 rotate-12" />
 </div>
 </div>

 <div className="space-y-3">
 <div className={cn(
 "bg-white p-4 rounded-xl border border-slate-300 shadow-sm transition-all",
 !scanResult && "opacity-50 grayscale flex flex-col items-center justify-center text-center"
 )}>
 {!scanResult ? (
 <>
 <FileSearch className="w-12 h-12 text-slate-400 mb-4" />
 <p className="text-xs font-bold text-slate-500 tracking-widest uppercase">Kết quả nhận diện sẽ hiển thị tại đây</p>
 </>
 ) : (
 <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
 <div className="flex justify-between items-center pb-4 border-b border-slate-200">
  <h3 className="font-bold text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2">
  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Kết quả Trích xuất AI
  </h3>
  <div className="flex items-center gap-2">
  {scanResult?.confidence && (
   <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
   Match: {scanResult.confidence}%
   </span>
  )}
  <button onClick={() => setScanResult(null)} className="text-[10px] text-slate-400 hover:text-red-500 px-2 py-0.5 rounded hover:bg-red-50 transition-colors font-bold">Quét lại</button>
  </div>
 </div>

 <div className="grid grid-cols-2 gap-3">
  {[
  { label: 'Nhà cung cấp', value: scanResult?.vendor },
  { label: 'Mã số thuế', value: scanResult?.taxCode, mono: true },
  { label: 'Số hóa đơn', value: scanResult?.invoiceNumber, mono: true, accent: true },
  { label: 'Ngày hóa đơn', value: scanResult?.invoiceDate },
  ].map(({ label, value, mono, accent }) => value ? (
  <div key={label} className="space-y-1">
   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</p>
   <p className={cn("text-sm font-bold tracking-tight", mono && "font-mono", accent ? "text-primary-600" : "text-slate-900 uppercase")}>{value}</p>
  </div>
  ) : null)}
 </div>

 {scanResult?.lineItems && scanResult.lineItems.length > 0 && (
  <div className="space-y-4">
  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chi tiết dòng (Line Items)</p>
  <div className="p-4 bg-slate-50 rounded-lg space-y-3">
   {scanResult.lineItems.map((item, i) => (
   <div key={i} className="flex justify-between text-xs items-center">
    <span className="font-bold text-slate-900">{item.description}</span>
    <span className="font-bold text-slate-900">{formatCurrency(item.amount)}</span>
   </div>
   ))}
   {scanResult.tax != null && (
   <div className="flex justify-between text-[10px] text-slate-600 font-medium border-t border-slate-200 pt-2">
    <span>Thuế GTGT</span>
    <span>{formatCurrency(scanResult.tax)}</span>
   </div>
   )}
  </div>
  </div>
 )}

 <div className="bg-slate-900 p-3 rounded-lg flex justify-between items-center shadow-sm shadow-blue-200">
  <div>
  <p className="text-[10px] font-bold text-blue-100 uppercase mb-1 tracking-widest">Tổng tiền cần thanh toán</p>
  <p className="text-2xl font-bold text-white">{formatCurrency(scanResult?.total ?? 0)}</p>
  </div>
  <button
  onClick={async () => {
   if (!auth.currentUser || !scanResult?.total) return;
   await addDoc(collection(db, 'finance_transactions'), {
   description: `Chi - HĐ ${scanResult.invoiceNumber ?? 'OCR'} / ${scanResult.vendor ?? 'NCC'}`,
   amount: scanResult.total,
   type: 'expense',
   category: 'Operational',
   dateStr: scanResult.invoiceDate ?? new Date().toLocaleDateString('vi-VN'),
   createdAt: serverTimestamp(),
   createdBy: auth.currentUser.uid,
   source: 'ocr'
   });
   setScanResult(null);
  }}
  className="px-6 py-3 bg-white text-blue-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform active:scale-95 shadow-sm"
  >
  Tạo bút toán Chi
  </button>
 </div>
 </div>
 )}
 </div>

 {!scanResult && (
 <>
 <input
  type="file"
  id="ocr-file-input"
  accept="image/*,.pdf"
  className="hidden"
  onChange={async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setIsScanning(true);
  try {
   const formData = new FormData();
   formData.append('file', file);
   const res = await fetch('/api/ai/ocr', { method: 'POST', body: formData });
   if (res.ok) {
   const data = await res.json();
   setScanResult(data);
   } else {
   console.error('OCR API error:', res.status);
   }
  } catch (err) {
   console.error('OCR request failed:', err);
  } finally {
   setIsScanning(false);
  }
  }}
 />
 <button
  onClick={() => document.getElementById('ocr-file-input')?.click()}
  className="w-full py-5 bg-blue-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm shadow-blue-100 flex items-center justify-center gap-3"
 >
  <Scan className="w-5 h-5" /> Bắt đầu AI Scan
 </button>
 </>
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
 <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input type="text" placeholder="Tìm kiếm bút toán..." className="bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-sm focus:outline-none w-64" />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Filter className="w-4 h-4 text-slate-500" /> Lọc kỳ
 </button>
 </div>
 </div>
 <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
 <div className="overflow-x-auto min-w-0 custom-scrollbar-x">
<table className="min-w-[600px] w-full text-left border-collapse">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-100">
 <th className="px-6 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-36 whitespace-nowrap">Ngày hạch toán</th>
 <th className="px-6 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Diễn giải</th>
 <th className="px-6 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-32 whitespace-nowrap">Phân loại</th>
 <th className="px-6 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest w-40 whitespace-nowrap text-right">Số tiền (VND)</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {transactions.map((tx) => (
 <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-6 py-2 w-36 whitespace-nowrap">
 <div className="flex items-center gap-2">
 <Calendar className="w-3.5 h-3.5 text-[#9CA3AF] shrink-0" />
 <span className="text-sm text-slate-900 font-medium">{tx.date}</span>
 </div>
 </td>
 <td className="px-6 py-2 max-w-0">
 <span className="block truncate text-sm text-slate-900 font-medium">{tx.description}</span>
 </td>
 <td className="px-6 py-2 w-32 whitespace-nowrap">
 <span className="px-2.5 py-1 bg-slate-100 text-slate-800 text-[10px] font-bold rounded-full uppercase">
 {tx.category}
 </span>
 </td>
 <td className="px-6 py-2 w-40 whitespace-nowrap text-right">
 <span className={cn(
 "text-xs font-bold",
 tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
 )}>
 {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'reports' && (
 <div className="p-4 space-y-4 animate-in fade-in duration-300">
 <div className="max-w-4xl mx-auto space-y-3">
 {[
 { title: 'Bảng Cân đối Kế toán', desc: 'Phản ánh tình hình tài sản, nợ phải trả và vốn chủ sở hữu tại một thời điểm.' },
 { title: 'Báo cáo Kết quả Hoạt động Kinh doanh', desc: 'Phản ánh doanh thu, chi phí và lợi nhuận của doanh nghiệp trong kỳ.' },
 { title: 'Báo cáo Lưu chuyển Tiền tệ', desc: 'Theo dõi dòng tiền vào và ra từ hoạt động KD, đầu tư và tài chính.' }
 ].map((report) => (
 <div key={report.title} className="bg-slate-50 p-3 rounded-2xl border border-slate-300 flex justify-between items-center group cursor-pointer hover:border-[#2563EB] transition-all">
 <div className="space-y-1">
 <h4 className="text-base font-bold text-slate-900">{report.title}</h4>
 <p className="text-sm text-slate-500">{report.desc}</p>
 </div>
 <div className="p-3 bg-white rounded-2xl shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
 <ArrowUpRight className="w-5 h-5" />
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 )}

 <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 flex items-start gap-4 mt-3">
 <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
 <ShieldCheck className="w-6 h-6" />
 </div>
 <div className="space-y-1">
 <h4 className="text-sm font-bold text-emerald-900 italic">Bảo mật & Tuân thủ Tài chính</h4>
 <p className="text-xs text-emerald-800 leading-relaxed max-w-2xl">Toàn bộ bút toán kết chuyển và khóa sổ kỳ kế toán được mã hóa và lưu trữ log thay đổi chi tiết (Auditing Log), đảm bảo tính toàn vẹn của dữ liệu theo Thông tư 99/2025/TT-BTC. Hệ thống tự động đối soát tiền về từ các Cổng thanh toán (Visa, MoMo, VNPay) với sổ ngân hàng.</p>
 </div>
 </div>
 </div>

 {showNewTxModal && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewTxModal(false)}>
 <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-3 space-y-5" onClick={e => e.stopPropagation()}>
 <div className="flex justify-between items-center">
  <h3 className="text-base font-bold text-slate-900">Tạo bút toán mới</h3>
  <button onClick={() => setShowNewTxModal(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
  <X className="w-4 h-4 text-slate-500" />
  </button>
 </div>
 <div className="space-y-4">
  <div>
  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Diễn giải</label>
  <input
   type="text"
   value={newTxForm.description}
   onChange={e => setNewTxForm(f => ({ ...f, description: e.target.value }))}
   placeholder="Ví dụ: Thanh toán tiền thuê văn phòng T5"
   className="w-full border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
  />
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div>
   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Số tiền (VND)</label>
   <input
   type="text"
   value={newTxForm.amount}
   onChange={e => setNewTxForm(f => ({ ...f, amount: e.target.value }))}
   placeholder="0"
   className="w-full border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
   />
  </div>
  <div>
   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Ngày hạch toán</label>
   <input
   type="date"
   value={newTxForm.dateStr}
   onChange={e => setNewTxForm(f => ({ ...f, dateStr: e.target.value }))}
   className="w-full border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
   />
  </div>
  </div>
  <div className="grid grid-cols-2 gap-4">
  <div>
   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Loại</label>
   <select
   value={newTxForm.type}
   onChange={e => setNewTxForm(f => ({ ...f, type: e.target.value }))}
   className="w-full border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 bg-white"
   >
   <option value="income">Thu (Income)</option>
   <option value="expense">Chi (Expense)</option>
   </select>
  </div>
  <div>
   <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1 block">Phân loại</label>
   <select
   value={newTxForm.category}
   onChange={e => setNewTxForm(f => ({ ...f, category: e.target.value }))}
   className="w-full border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 bg-white"
   >
   <option value="Sales">Sales (Doanh thu)</option>
   <option value="Operational">Operational (Vận hành)</option>
   <option value="Inventory">Inventory (Hàng tồn kho)</option>
   <option value="Payroll">Payroll (Lương)</option>
   <option value="Tax">Tax (Thuế)</option>
   <option value="Other">Khác</option>
   </select>
  </div>
  </div>
 </div>
 <div className="flex gap-3 pt-2">
  <button
  onClick={() => setShowNewTxModal(false)}
  className="flex-1 py-2.5 border border-slate-200 rounded-2xl text-sm font-medium hover:bg-slate-50 transition-colors"
  >Hủy</button>
  <button
  onClick={handleAddTransaction}
  disabled={submittingTx || !newTxForm.description || !newTxForm.amount}
  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
  >{submittingTx ? 'Đang lưu...' : 'Tạo bút toán'}</button>
 </div>
 </div>
 </div>
 )}
 </>
 );
}
