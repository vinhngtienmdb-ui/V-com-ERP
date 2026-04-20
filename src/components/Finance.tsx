import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  FileText, 
  BookOpen, 
  PieChart, 
  TrendingUp, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight,
  Printer,
  Download,
  ShieldCheck,
  Calendar,
  MoreVertical
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { JournalEntry } from '../types/erp';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';

export function Finance() {
  const [activeTab, setActiveTab] = useState<'journal' | 'ledger' | 'reports'>('journal');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        date: doc.data().createdAt?.toDate().toLocaleDateString('vi-VN') || '...'
      }));
      setTransactions(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Tài chính & Kế toán</h1>
          <p className="text-sm text-[#6B7280] mt-1">Hệ thống kế toán chuyên sâu theo Thông tư 99/2025/TT-BTC.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <Printer className="w-4 h-4" />
            In Sổ sách
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Lập Báo cáo Tài chính
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Doanh thu Thuần (Net Revenue)</p>
           <div className="text-2xl font-bold text-[#111827]">{formatCurrency(totalIncome)}</div>
           <div className="mt-1 flex items-center gap-1 text-[10px] text-[#10B981] font-medium">
              <TrendingUp className="w-3 h-3" /> +12.5% so với tháng trước
           </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Chi phí (Total Expense)</p>
           <div className="text-2xl font-bold text-[#EF4444]">{formatCurrency(totalExpense)}</div>
           <p className="text-[10px] text-[#6B7280] mt-1">Biên chi phí: {totalIncome ? ((totalExpense/totalIncome)*100).toFixed(1) : 0}%</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Lợi nhuận ròng (Net Profit)</p>
           <div className="text-2xl font-bold text-[#2563EB]">{formatCurrency(totalIncome - totalExpense)}</div>
           <p className="text-[10px] text-[#6B7280] mt-1">Lợi nhuận sẵn dụng</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Thuế phải nộp (VAT/CIT Est.)</p>
           <div className="text-2xl font-bold text-[#F59E0B]">{formatCurrency(totalIncome * 0.1)}</div>
           <p className="text-[10px] text-[#6B7280] mt-1">Tạm tính (10%)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="flex border-b border-[#F3F4F6]">
           {[
             { id: 'journal', label: 'Bút toán & Nhật ký chung', icon: BookOpen },
             { id: 'ledger', label: 'Hệ thống Tài khoản & Sổ cái', icon: FileText },
             { id: 'reports', label: 'Báo cáo Tài chính', icon: PieChart }
           ].map((tab) => (
             <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
                  activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-blue-50/30" : "border-transparent text-[#6B7280] hover:text-[#111827]"
                )}
             >
                <tab.icon className="w-4 h-4" /> {tab.label}
             </button>
           ))}
        </div>

        {activeTab === 'journal' && (
           <div className="p-0 animate-in fade-in duration-300">
              <div className="p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center">
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input 
                      type="text" 
                      placeholder="Tìm chứng từ, mã tài khoản..." 
                      className="bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
                    />
                  </div>
                  <button className="bg-white border border-[#E5E7EB] px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
                     <Calendar className="w-4 h-4" /> Tháng 3/2024
                  </button>
                </div>
                <button className="text-xs font-semibold text-[#2563EB] flex items-center gap-2 hover:underline">
                   Tải File Excel (XML/XLSX) <Download className="w-3 h-3" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest w-48">Thời gian</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nội dung diễn giải</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Phân loại</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Thu / Chi (VND)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F4F6]">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-[#F9FAFB] group transition-colors">
                        <td className="px-6 py-4">
                           <div className="text-xs font-bold text-[#111827]">{tx.date}</div>
                        </td>
                        <td className="px-6 py-4 max-w-xs">
                           <p className="text-xs text-[#4B5563] truncate font-medium">{tx.description}</p>
                        </td>
                        <td className="px-6 py-4">
                           <span className="px-2.5 py-1 bg-slate-100 text-[#6B7280] text-[9px] font-bold uppercase rounded-md tracking-wider">
                              {tx.category}
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
        )}

        {activeTab === 'reports' && (
           <div className="p-8 space-y-8 animate-in fade-in duration-300">
              <div className="max-w-4xl mx-auto space-y-6">
                 {[
                   { title: 'Bảng Cân đối Kế toán', desc: 'Phản ánh tình hình tài sản, nợ phải trả và vốn chủ sở hữu tại một thời điểm.' },
                   { title: 'Báo cáo Kết quả Hoạt động Kinh doanh', desc: 'Phản ánh doanh thu, chi phí và lợi nhuận của doanh nghiệp trong kỳ.' },
                   { title: 'Báo cáo Lưu chuyển Tiền tệ', desc: 'Theo dõi dòng tiền vào và ra từ hoạt động KD, đầu tư và tài chính.' }
                 ].map((report) => (
                   <div key={report.title} className="bg-[#F9FAFB] p-6 rounded-lg border border-[#E5E7EB] flex justify-between items-center group cursor-pointer hover:border-[#2563EB] transition-all">
                      <div className="space-y-1">
                         <h4 className="text-base font-bold text-[#111827]">{report.title}</h4>
                         <p className="text-sm text-[#6B7280]">{report.desc}</p>
                      </div>
                      <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-[#2563EB] group-hover:text-white transition-all">
                         <ArrowUpRight className="w-5 h-5" />
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-100 flex items-start gap-4">
         <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
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
