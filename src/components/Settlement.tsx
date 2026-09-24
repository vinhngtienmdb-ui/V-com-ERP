import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 FileText, 
 CreditCard, 
 Wallet, 
 CheckCircle2, 
 Search, 
 Filter, 
 Download, 
 RefreshCcw,
 ShieldCheck,
 Receipt,
 Truck,
 AlertCircle
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { SettlementRow, WithdrawalRequest } from '../types/erp';

const MOCK_COD_SETTLEMENTS = [
 {
 id: 'COD-GHTK-0301',
 carrier: 'Giao Hàng Tiết Kiệm',
 period: '01/04 - 07/04',
 totalOrders: 1450,
 expectedCod: 345000000,
 transferredCod: 345000000,
 shippingFee: 28500000,
 status: 'matched'
 },
 {
 id: 'COD-GHN-0301',
 carrier: 'Giao Hàng Nhanh',
 period: '01/04 - 07/04',
 totalOrders: 842,
 expectedCod: 124500000,
 transferredCod: 120000000,
 shippingFee: 15600000,
 status: 'discrepancy',
 note: 'Lệch 4.5M (Đã tạo Ticket xử lý)'
 }
];

const MOCK_SETTLEMENTS: SettlementRow[] = [
 {
 id: 'STL-2024-001',
 sellerId: 'SEL-001',
 sellerName: 'Phụ kiện Apple Hà Nội',
 period: '01/03 - 15/03',
 totalSales: 250000000,
 commissionFee: 12500000,
 shippingFee: 2450000,
 netPayout: 235050000,
 status: 'completed'
 },
 {
 id: 'STL-2024-002',
 sellerId: 'SEL-002',
 sellerName: 'Shop Mẹ & Bé Official',
 period: '01/03 - 15/03',
 totalSales: 154000000,
 commissionFee: 7700000,
 shippingFee: 1500000,
 netPayout: 144800000,
 status: 'pending'
 }
];

const MOCK_WITHDRAWALS: WithdrawalRequest[] = [
 {
 id: 'WDR-1001',
 userId: 'SEL-001',
 userName: 'Phụ kiện Apple Hà Nội',
 userType: 'seller',
 amount: 50000000,
 bankAccount: { bankName: 'Vietcombank', accountNo: '1023456789', accountName: 'NGUYEN VAN A' },
 status: 'pending',
 requestDate: '15/03/2024 10:30'
 },
 {
 id: 'WDR-1002',
 userId: 'USR-882',
 userName: 'Trần Minh Tuấn',
 userType: 'buyer',
 amount: 1500000,
 bankAccount: { bankName: 'Techcombank', accountNo: '190345678901', accountName: 'TRAN MINH TUAN' },
 status: 'approved',
 requestDate: '14/03/2024 16:45'
 }
];

export function SettlementManagement() {
 const [activeTab, setActiveTab] = useState<'settlement' | 'withdrawal' | 'einvoice' | 'cod'>('settlement');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
              Escrow & e-Invoice Automation
            </span>
            <span className="text-xs text-slate-500 font-medium">Đối Soát COD 3PL & Thuế TMĐT</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Đối Soát Dòng Tiền & Hóa Đơn Điện Tử</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Đối soát dòng tiền ký quỹ Escrow nhà bán, khấu trừ thuế sàn theo NĐ 126/TT 88 và tự động phát hành hóa đơn điện tử VComm Invoice.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer">
            <RefreshCcw className="w-4 h-4 text-blue-600" />
            Chạy Đối Soát Tự Động
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer">
            <Receipt className="w-4 h-4" />
            Xuất Hóa Đơn Hàng Loạt
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <DraggableGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" columns={4} gap={16}>
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Số Dư Ký Quỹ Escrow</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">{formatCurrency(15450000000)}</div>
          <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Tài khoản Escrow chuẩn định danh</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đang Chờ Giải Ngân</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600 tracking-tight">{formatCurrency(2450000000)}</div>
          <p className="mt-2 text-xs text-slate-500 font-medium">Tự động chuyển khoản sau T+3</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Lệnh Rút Chờ Duyệt</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <RefreshCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 tracking-tight">42 lệnh</div>
          <p className="mt-2 text-xs text-slate-500 font-medium">Ưu tiên xử lý: 35 nhà bán lớn</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Doanh Thu Hoa Hồng (Margin)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">{formatCurrency(845000000)}</div>
          <p className="mt-2 text-xs text-slate-500 font-medium">Kỳ quyết toán tháng 03/2026</p>
        </div>
      </DraggableGrid>

      <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap gap-2">
          {[
            { id: 'settlement', label: 'Đối Soát Nhà Bán (Seller Payout)', icon: RefreshCcw },
            { id: 'cod', label: 'Đối Soát COD Đối Tác 3PL', icon: Truck },
            { id: 'withdrawal', label: 'Lệnh Rút Tiền Về Ngân Hàng', icon: Wallet },
            { id: 'einvoice', label: 'Hóa Đơn Điện Tử VComm Invoice', icon: FileText }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer",
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100/50"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" /> {tab.label}
            </button>
          ))}
        </div>

 <div className="p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Tìm Seller, Mã lệnh, STK..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Lọc trạng thái
 </button>
 </div>
 <button className="text-xs font-semibold text-[#2563EB] flex items-center gap-2 hover:underline">
 Tải danh sách chi tiết <Download className="w-3 h-3" />
 </button>
 </div>

 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse whitespace-nowrap">
 <thead>
 {activeTab === 'settlement' && (
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nhà bán hàng (Seller)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Kỳ đối soát</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Tổng Doanh số</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Phí sàn/Ship</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Tiền về (Payout)</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái</th>
 </tr>
 )}
 {activeTab === 'withdrawal' && (
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Người dùng / Đối tượng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Thông tin Ngân hàng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Số tiền rút</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Thời gian yêu cầu</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái duyệt</th>
 </tr>
 )}
 {activeTab === 'cod' && (
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Đơn vị Vận chuyển</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Kỳ đối soát / Số ĐH</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Tổng Cước phí</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">COD Hệ thống ghi nhận</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">COD Thực chuyển</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái Kế toán</th>
 </tr>
 )}
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {activeTab === 'settlement' && MOCK_SETTLEMENTS.map((stl) => (
 <tr key={stl.id} className="hover:bg-[#F9FAFB] group transition-colors">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-[#111827]">{stl.sellerName}</p>
 <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-tight">{stl.sellerId}</p>
 </td>
 <td className="px-6 py-4 text-xs text-[#4B5563]">{stl.period}</td>
 <td className="px-6 py-4 text-right font-semibold">{formatCurrency(stl.totalSales)}</td>
 <td className="px-6 py-4 text-right text-xs text-red-500 font-medium">-{formatCurrency(stl.commissionFee + stl.shippingFee)}</td>
 <td className="px-6 py-4 text-right">
 <p className="text-sm font-bold text-[#10B981]">{formatCurrency(stl.netPayout)}</p>
 </td>
 <td className="px-6 py-4">
 <div className="flex justify-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold",
 stl.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
 )}>
 {stl.status === 'completed' ? 'ĐÃ QUYẾT TOÁN' : 'CHỜ DUYỆT'}
 </span>
 </div>
 </td>
 </tr>
 ))}
 {activeTab === 'withdrawal' && MOCK_WITHDRAWALS.map((wdr) => (
 <tr key={wdr.id} className="hover:bg-[#F9FAFB] group transition-colors">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-[#111827]">{wdr.userName}</p>
 <span className="text-[10px] text-[#6B7280] uppercase font-semibold bg-slate-100 px-1.5 py-0.5 rounded">{wdr.userType}</span>
 </td>
 <td className="px-6 py-4">
 <p className="text-xs font-bold text-[#111827]">{wdr.bankAccount.bankName}</p>
 <p className="text-[10px] font-mono text-[#6B7280]">{wdr.bankAccount.accountNo} - {wdr.bankAccount.accountName}</p>
 </td>
 <td className="px-6 py-4 text-right font-bold text-[#111827]">{formatCurrency(wdr.amount)}</td>
 <td className="px-6 py-4 text-right text-[10px] text-[#9CA3AF]">{wdr.requestDate}</td>
 <td className="px-6 py-4 text-right">
 {wdr.status === 'pending' ? (
 <div className="flex justify-end gap-2">
 <button className="px-3 py-1.5 bg-[#111827] text-[#FAF9F5] text-[10px] font-bold rounded-md hover:bg-slate-800">Duyệt chi</button>
 <button className="px-3 py-1.5 border border-slate-300 text-[#6B7280] text-[10px] font-bold rounded-md">Từ chối</button>
 </div>
 ) : (
 <div className="flex justify-end">
 <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3" /> ĐÃ XỬ LÝ (Payout)
 </span>
 </div>
 )}
 </td>
 </tr>
 ))}
 {activeTab === 'cod' && MOCK_COD_SETTLEMENTS.map((cod) => (
 <tr key={cod.id} className="hover:bg-[#F9FAFB] group transition-colors">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-[#111827]">{cod.carrier}</p>
 <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-tight">{cod.id}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-xs font-bold text-[#4B5563]">{cod.period}</p>
 <p className="text-[10px] text-[#6B7280]">Tổng {cod.totalOrders} đơn</p>
 </td>
 <td className="px-6 py-4 text-right font-semibold text-slate-800">
 {formatCurrency(cod.shippingFee)}
 </td>
 <td className="px-6 py-4 text-right">
 <p className="text-sm font-bold text-slate-900">{formatCurrency(cod.expectedCod)}</p>
 </td>
 <td className="px-6 py-4 text-right">
 <p className="text-sm font-bold text-[#10B981]">{formatCurrency(cod.transferredCod)}</p>
 </td>
 <td className="px-6 py-4">
 <div className="flex justify-center">
 {cod.status === 'matched' ? (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3" /> ĐÃ KHỚP COD
 </span>
 ) : (
 <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 flex items-center gap-1" title={cod.note}>
 <AlertCircle className="w-3 h-3" /> LỆCH ĐỐI SOÁT
 </span>
 )}
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div className="bg-slate-900 text-[#FAF9F5] rounded-lg p-6 overflow-hidden relative">
 <div className="relative z-10 space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-slate-800 rounded-lg">
 <CreditCard className="w-6 h-6 text-[#FAF9F5]" />
 </div>
 <h3 className="text-xl font-bold italic">Giải ngân tự động qua Cổng Payout</h3>
 </div>
 <p className="text-slate-500 text-sm max-w-xl leading-relaxed">Hệ thống đã kết nối trực tiếp với API Payout của Vietcombank và Techcombank. Lệnh rút tiền sau khi được Admin phê duyệt sẽ được giải ngân theo thời gian thực (24/7) mà không cần thao tác thủ công trên Internet Banking.</p>
 <div className="flex gap-4 pt-2">
 <div className="bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-700 flex flex-col">
 <span className="text-[10px] text-slate-600 font-bold uppercase">Hạn mức Payout Ngày</span>
 <span className="text-base font-bold text-[#FAF9F5] leading-none mt-1">2,000,000,000đ</span>
 </div>
 <div className="bg-slate-800/50 px-4 py-3 rounded-lg border border-slate-700 flex flex-col">
 <span className="text-[10px] text-slate-600 font-bold uppercase">Phí Payout Trung bình</span>
 <span className="text-base font-bold text-orange-500 leading-none mt-1">1,200đ / Giao dịch</span>
 </div>
 </div>
 </div>
 <ShieldCheck className="absolute -bottom-10 -right-10 w-64 h-64 text-slate-900/50 -rotate-12" />
 </div>
 </div>
 );
}
