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
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Đối soát & Hóa đơn Điện tử</h1>
 <p className="text-sm text-[#6B7280] mt-1">Đối soát dòng tiền Seller, xử lý yêu cầu rút tiền và tự động xuất hóa đơn GTGT.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <RefreshCcw className="w-4 h-4" />
 Chạy đối soát tự động
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Receipt className="w-4 h-4" />
 Xuất hóa đơn hàng loạt
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={16}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Số dư Ví Sàn (Tất cả)</p>
 <div className="text-2xl font-bold text-[#111827]">{formatCurrency(15450000000)}</div>
 <div className="mt-1 flex items-center gap-1 text-[10px] text-[#10B981] font-medium">
 <CheckCircle2 className="w-3 h-3" /> Tài khoản Escrow an toàn
 </div>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Đang chờ giải ngân (Payout)</p>
 <div className="text-2xl font-bold text-[#2563EB]">{formatCurrency(2450000000)}</div>
 <p className="text-[10px] text-[#6B7280] mt-1">Sẽ tự động chuyển sau 3 ngày</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Lệnh rút tiền chờ duyệt</p>
 <div className="text-2xl font-bold text-[#F59E0B]">42</div>
 <p className="text-[10px] text-[#6B7280] mt-1">Ưu tiên: Nhà bán hàng (35)</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Doanh thu hoa hồng (Margin)</p>
 <div className="text-2xl font-bold text-[#10B981]">{formatCurrency(845000000)}</div>
 <p className="text-[10px] text-[#6B7280] mt-1">Tháng: 03/2024</p>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-[#F3F4F6]">
 {[
 { id: 'settlement', label: 'Đối soát Nhà bán (Seller)', icon: RefreshCcw },
 { id: 'cod', label: 'Đối soát COD (Vận chuyển)', icon: Truck },
 { id: 'withdrawal', label: 'Yêu cầu Rút tiền', icon: Wallet },
 { id: 'einvoice', label: 'Hóa đơn Điện tử (e-Invoice)', icon: FileText }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
 activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-slate-100/30" : "border-transparent text-[#6B7280] hover:text-[#111827]"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
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
 <table className="w-full text-left border-collapse">
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
 <td className="px-3 py-2.5">
 <p className="text-sm font-bold text-[#111827]">{stl.sellerName}</p>
 <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-tight">{stl.sellerId}</p>
 </td>
 <td className="px-6 py-4 text-xs text-[#4B5563]">{stl.period}</td>
 <td className="px-6 py-4 text-right font-semibold">{formatCurrency(stl.totalSales)}</td>
 <td className="px-6 py-4 text-right text-xs text-red-500 font-medium">-{formatCurrency(stl.commissionFee + stl.shippingFee)}</td>
 <td className="px-6 py-4 text-right">
 <p className="text-sm font-bold text-[#10B981]">{formatCurrency(stl.netPayout)}</p>
 </td>
 <td className="px-3 py-2.5">
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
 <td className="px-3 py-2.5">
 <p className="text-sm font-bold text-[#111827]">{wdr.userName}</p>
 <span className="text-[10px] text-[#6B7280] uppercase font-semibold bg-slate-100 px-1.5 py-0.5 rounded">{wdr.userType}</span>
 </td>
 <td className="px-3 py-2.5">
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
 <td className="px-3 py-2.5">
 <p className="text-sm font-bold text-[#111827]">{cod.carrier}</p>
 <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-tight">{cod.id}</p>
 </td>
 <td className="px-3 py-2.5">
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
 <td className="px-3 py-2.5">
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

 <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
 <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
 <CreditCard className="w-4 h-4 text-blue-600" />
 <h3 className="text-sm font-bold text-slate-900">Giải ngân tự động qua Cổng Payout</h3>
 </div>
 <div className="p-5">
 <p className="text-slate-600 text-sm max-w-xl leading-relaxed mb-4">Hệ thống đã kết nối trực tiếp với API Payout của Vietcombank và Techcombank. Lệnh rút tiền sau khi được Admin phê duyệt sẽ được giải ngân theo thời gian thực (24/7) mà không cần thao tác thủ công trên Internet Banking.</p>
 <div className="flex gap-4">
 <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 flex flex-col">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Hạn mức Payout Ngày</span>
 <span className="text-base font-bold text-slate-900 leading-none mt-1">2,000,000,000đ</span>
 </div>
 <div className="bg-slate-50 px-4 py-3 rounded-lg border border-slate-200 flex flex-col">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Phí Payout Trung bình</span>
 <span className="text-base font-bold text-orange-600 leading-none mt-1">1,200đ / Giao dịch</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
