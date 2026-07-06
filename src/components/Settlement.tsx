import { db, collection, getDocs, query, where, addDoc, updateDoc, recordPartnerLedgerEntry } from '../services/dbService';
import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useEffect } from 'react';
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
 AlertCircle,
 Loader2,
 Coins,
 Store
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { SettlementRow, WithdrawalRequest, Order } from '../types/erp';

// Keep the old mocks for tabs that are not implemented yet
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
 }
];

const MOCK_AFFILIATE_SETTLEMENTS = [
  {
    id: 'AFF-001',
    affiliateName: 'KOL Thùy Chi',
    period: '01/04 - 07/04',
    totalOrders: 145,
    gmv: 45000000,
    commissionEarned: 4500000,
    status: 'pending'
  },
  {
    id: 'AFF-002',
    affiliateName: 'Đại lý Hoàng Nam',
    period: '01/04 - 07/04',
    totalOrders: 82,
    gmv: 24000000,
    commissionEarned: 2400000,
    status: 'completed'
  }
];

const MOCK_PICKUP_SETTLEMENTS = [
  {
    id: 'PKP-001',
    hubName: 'Điểm nhận Hàng Quận 7',
    period: '01/04 - 07/04',
    totalOrders: 120,
    pickupFee: 600000,
    status: 'pending'
  },
  {
    id: 'PKP-002',
    hubName: 'Điểm nhận Hàng Thủ Đức',
    period: '01/04 - 07/04',
    totalOrders: 250,
    pickupFee: 1250000,
    status: 'completed'
  }
];

export function SettlementManagement() {
  const [activeTab, setActiveTab] = useState<'settlement' | 'withdrawal' | 'einvoice' | 'cod' | 'affiliate' | 'pickup'>('settlement');
  const [settlements, setSettlements] = useState<SettlementRow[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [affiliateSettlements, setAffiliateSettlements] = useState(MOCK_AFFILIATE_SETTLEMENTS);
  const [pickupSettlements, setPickupSettlements] = useState(MOCK_PICKUP_SETTLEMENTS);
  const [loading, setLoading] = useState(true);
  const [isReconciling, setIsReconciling] = useState(false);

  const approveAffiliateSettlement = async (aff: any) => {
    if (!confirm('Duyệt chi trả hoa hồng cho CTV này?')) return;
    try {
      const { postWithdrawalJournalEntries } = await import('../services/accountingService');
      await postWithdrawalJournalEntries({
        id: aff.id,
        userId: aff.id,
        userType: 'agent',
        amount: aff.commissionEarned
      });

      await recordPartnerLedgerEntry({
        partnerId: aff.id,
        partnerType: 'agent',
        refType: 'settlement',
        refId: aff.id,
        debit: aff.commissionEarned,
        credit: 0
      });

      setAffiliateSettlements(prev => prev.map(a => a.id === aff.id ? { ...a, status: 'completed' } : a));
      alert('Đã duyệt chi trả hoa hồng thành công!');
    } catch (err: any) {
      console.error(err);
      alert('Lỗi duyệt chi hoa hồng: ' + err.message);
    }
  };

  const approvePickupSettlement = async (hub: any) => {
    if (!confirm('Duyệt thanh toán phí vận hành cho Điểm nhận hàng này?')) return;
    try {
      const { postWithdrawalJournalEntries } = await import('../services/accountingService');
      await postWithdrawalJournalEntries({
        id: hub.id,
        userId: hub.id,
        userType: 'agent',
        amount: hub.pickupFee
      });

      await recordPartnerLedgerEntry({
        partnerId: hub.id,
        partnerType: 'agent',
        refType: 'settlement',
        refId: hub.id,
        debit: hub.pickupFee,
        credit: 0
      });

      setPickupSettlements(prev => prev.map(p => p.id === hub.id ? { ...p, status: 'completed' } : p));
      alert('Đã duyệt chi trả phí vận hành thành công!');
    } catch (err: any) {
      console.error(err);
      alert('Lỗi duyệt chi phí vận hành: ' + err.message);
    }
  };

  const fetchSettlements = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'settlements'));
      const data = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as SettlementRow));
      setSettlements(data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));

      const withdrawalSnapshot = await getDocs(collection(db, 'withdrawals'));
      const withdrawalData = withdrawalSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as WithdrawalRequest));
      setWithdrawals(withdrawalData.sort((a, b) => new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime()));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, []);

  const runAutoReconciliation = async () => {
    setIsReconciling(true);
    try {
      // 1. Lấy tất cả Đơn hàng (Sub-orders) đã giao thành công và chưa đối soát
      const ordersRef = collection(db, 'orders');
      // Tạm thời lấy tất cả pending để lọc (do có thể thiếu index query phức tạp)
      const q = query(ordersRef, where('settlementStatus', '==', 'pending'));
      const snapshot = await getDocs(q);
      
      const ordersToSettle = snapshot.docs
        .map((d: any) => ({ id: d.id, ...d.data() } as Order))
        .filter((o: any) => (o.status === 'delivered' || o.status === 'completed') && o.sellerId);

      if (ordersToSettle.length === 0) {
        alert('Không có đơn hàng nào cần đối soát!');
        setIsReconciling(false);
        return;
      }

      // 2. Gom nhóm theo Gian hàng (Seller ID)
      const groupedBySeller: Record<string, {
        orders: Order[],
        totalSales: number,
        totalCommission: number,
        totalShipping: number,
        sellerName: string
      }> = {};

      ordersToSettle.forEach((o: any) => {
        const sid = o.sellerId!;
        if (!groupedBySeller[sid]) {
          groupedBySeller[sid] = { orders: [], totalSales: 0, totalCommission: 0, totalShipping: 0, sellerName: o.sellerId! };
        }
        groupedBySeller[sid].orders.push(o);
        groupedBySeller[sid].totalSales += (o.total || 0);
        groupedBySeller[sid].totalCommission += (o.commissionFee || 0);
        groupedBySeller[sid].totalShipping += (o.shippingCost || 0);
      });

      // 3. Tạo Settlements và Cập nhật Orders (Thay vì writeBatch, dùng Promise.all)
      const promises: Promise<any>[] = [];
      
      for (const [sellerId, data] of Object.entries(groupedBySeller)) {
        const settlementData: Partial<SettlementRow> = {
          sellerId,
          sellerName: `Gian hàng ${sellerId}`, // Tạm lấy ID làm tên
          periodStart: new Date().toISOString(),
          periodEnd: new Date().toISOString(),
          totalSales: data.totalSales,
          commissionFee: data.totalCommission,
          shippingFee: data.totalShipping,
          netPayout: data.totalSales - data.totalCommission - data.totalShipping,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        
        // Tạo settlement
        const p = addDoc(collection(db, 'settlements'), settlementData).then(settlementRef => {
          // Sau khi tạo xong, update các orders thuộc về settlement này
          const orderPromises = data.orders.map(o => {
            // giả lập updateDoc cần reference object theo định dạng SupabaseAdapter
            const mockDocRef = { path: `orders/${o.id}`, tableName: 'orders', id: o.id };
            return updateDoc(mockDocRef as any, { 
              settlementStatus: 'settled',
              settlementId: settlementRef.id
            });
          });
          return Promise.all(orderPromises);
        });
        
        promises.push(p);
      }

      await Promise.all(promises);
      alert(`Đã đối soát tự động cho ${Object.keys(groupedBySeller).length} gian hàng!`);
      fetchSettlements();
    } catch (error) {
      console.error('Lỗi chạy đối soát:', error);
      alert('Đã xảy ra lỗi khi đối soát.');
    } finally {
      setIsReconciling(false);
    }
  };

  const approveSettlement = async (settlement: SettlementRow) => {
    if (!confirm('Duyệt đối soát và chuyển tiền vào ví gian hàng?')) return;
    try {
      if (!settlement.sellerId || !settlement.netPayout) return;
      
      const { updateWalletBalance } = await import('../services/dbService');
      await updateWalletBalance(settlement.sellerId, settlement.netPayout, {
        type: 'deposit',
        gateway: 'system_reconciliation',
        status: 'success'
      });

      const mockDocRef = { path: `settlements/${settlement.id}`, tableName: 'settlements', id: settlement.id };
      await updateDoc(mockDocRef as any, { status: 'completed' });
      
      await recordPartnerLedgerEntry({
        partnerId: settlement.sellerId,
        partnerType: 'seller',
        refType: 'settlement',
        refId: settlement.id,
        debit: 0,
        credit: settlement.netPayout
      });
      
      alert('Đã duyệt chuyển tiền vào ví gian hàng!');
      fetchSettlements();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi duyệt đối soát');
    }
  };

  const approveWithdrawal = async (withdrawal: WithdrawalRequest) => {
    if (!confirm('Xác nhận đã giải ngân qua ngân hàng?')) return;
    try {
      const mockDocRef = { path: `withdrawals/${withdrawal.id}`, tableName: 'withdrawals', id: withdrawal.id };
      await updateDoc(mockDocRef as any, { status: 'processed' });
      
      await recordPartnerLedgerEntry({
        partnerId: withdrawal.userId,
        partnerType: withdrawal.userType === 'seller' ? 'seller' : 'agent',
        refType: 'withdrawal',
        refId: withdrawal.id,
        debit: withdrawal.amount,
        credit: 0
      });
      
      alert('Đã cập nhật trạng thái chi thành công!');
      fetchSettlements();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi duyệt chi');
    }
  };

  const rejectWithdrawal = async (withdrawal: WithdrawalRequest) => {
    if (!confirm('Từ chối yêu cầu và hoàn tiền vào ví?')) return;
    try {
      const { updateWalletBalance } = await import('../services/dbService');
      await updateWalletBalance(withdrawal.userId, withdrawal.amount, {
        type: 'refund',
        gateway: 'system_rejection',
        status: 'success'
      });
      
      const mockDocRef = { path: `withdrawals/${withdrawal.id}`, tableName: 'withdrawals', id: withdrawal.id };
      await updateDoc(mockDocRef as any, { status: 'rejected' });
      alert('Đã từ chối và hoàn tiền vào ví!');
      fetchSettlements();
    } catch (err) {
      console.error(err);
      alert('Lỗi khi từ chối');
    }
  };

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Đối soát & Hóa đơn Điện tử</h1>
 <p className="text-sm text-[#6B7280] mt-1">Đối soát dòng tiền Seller, xử lý yêu cầu rút tiền và tự động xuất hóa đơn GTGT.</p>
 </div>
 <div className="flex gap-3">
 <button 
  onClick={runAutoReconciliation}
  disabled={isReconciling}
  className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2 disabled:opacity-50"
 >
  {isReconciling ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
  Chạy đối soát tự động
 </button>
 <button className="bg-primary-600 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Receipt className="w-4 h-4" />
 Xuất hóa đơn hàng loạt
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Số dư Ví Sàn (Tất cả)</p>
 <div className="text-2xl font-bold text-[#111827]">{formatCurrency(15450000000)}</div>
 <div className="mt-1 flex items-center gap-1 text-[10px] text-[#10B981] font-medium">
 <CheckCircle2 className="w-3 h-3" /> Tài khoản Escrow an toàn
 </div>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Đang chờ giải ngân (Payout)</p>
 <div className="text-2xl font-bold text-primary-600">{formatCurrency(2450000000)}</div>
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
 { id: 'affiliate', label: 'Hoa hồng CTV / Affiliate', icon: Coins },
 { id: 'pickup', label: 'Đối soát Điểm nhận (Pickup)', icon: Store },
 { id: 'cod', label: 'Đối soát COD (Vận chuyển)', icon: Truck },
 { id: 'withdrawal', label: 'Yêu cầu Rút tiền', icon: Wallet },
 { id: 'einvoice', label: 'Hóa đơn Điện tử (e-Invoice)', icon: FileText }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-6 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
 activeTab === tab.id ? "border-primary-600 text-primary-600 bg-slate-100/30" : "border-transparent text-[#6B7280] hover:text-[#111827]"
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
 <button className="text-xs font-semibold text-primary-600 flex items-center gap-2 hover:underline">
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
 {activeTab === 'affiliate' && (
  <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Cộng tác viên / KOL</th>
  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Kỳ đối soát</th>
  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Số Đơn</th>
  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Tổng Doanh số (GMV)</th>
  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Hoa hồng phát sinh</th>
  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái</th>
  </tr>
  )}
  {activeTab === 'pickup' && (
  <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Điểm nhận hàng (Hub)</th>
  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Kỳ đối soát</th>
  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Số đơn xử lý</th>
  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Phí vận hành (5k/đơn)</th>
  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái</th>
  </tr>
  )}
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {activeTab === 'settlement' && settlements.map((stl) => {
   const periodStr = stl.periodStart && stl.periodEnd 
     ? `${new Date(stl.periodStart).toLocaleDateString('vi-VN')} - ${new Date(stl.periodEnd).toLocaleDateString('vi-VN')}`
     : 'N/A';
   return (
 <tr key={stl.id} className="hover:bg-[#F9FAFB] group transition-colors">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-[#111827]">{stl.sellerName}</p>
 <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-tight">{stl.sellerId}</p>
 </td>
 <td className="px-6 py-4 text-xs text-[#4B5563]">{periodStr}</td>
 <td className="px-6 py-4 text-right font-semibold">{formatCurrency(stl.totalSales || 0)}</td>
 <td className="px-6 py-4 text-right text-xs text-red-500 font-medium">-{formatCurrency((stl.commissionFee || 0) + (stl.shippingFee || 0))}</td>
 <td className="px-6 py-4 text-right">
 <p className="text-sm font-bold text-[#10B981]">{formatCurrency(stl.netPayout || 0)}</p>
 </td>
 <td className="px-6 py-4">
 <div className="flex justify-end gap-2 items-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold",
 stl.status === 'completed' ? "bg-emerald-100 text-emerald-700" :
 stl.status === 'pending' ? "bg-amber-100 text-amber-700" :
 "bg-red-100 text-red-700"
 )}>
 {stl.status === 'completed' ? 'Đã Thanh toán' : stl.status === 'pending' ? 'Chờ Duyệt' : 'Thất bại'}
 </span>
 {stl.status === 'pending' && (
   <button onClick={() => approveSettlement(stl)} className="px-2 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700">Duyệt vào ví</button>
 )}
 </div>
 </td>
 </tr>
 );
 })}
 {activeTab === 'withdrawal' && withdrawals.map((wdr) => (
 <tr key={wdr.id} className="hover:bg-[#F9FAFB] group transition-colors">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-[#111827]">{wdr.userName}</p>
 <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-tight">{wdr.userId} • {wdr.userType === 'seller' ? 'Nhà Bán' : 'Người Mua'}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-xs font-semibold text-[#374151]">{wdr.bankAccount?.bankName}</p>
 <p className="text-[10px] text-[#6B7280]">{wdr.bankAccount?.accountNo} - {wdr.bankAccount?.accountName}</p>
 </td>
 <td className="px-6 py-4 text-right">
 <p className="text-sm font-bold text-[#111827]">{formatCurrency(wdr.amount)}</p>
 </td>
 <td className="px-6 py-4 text-right text-[10px] text-[#9CA3AF]">{wdr.requestDate}</td>
 <td className="px-6 py-4 text-right">
 {wdr.status === 'pending' ? (
 <div className="flex justify-end gap-2">
 <button onClick={() => approveWithdrawal(wdr)} className="px-3 py-1.5 bg-[#111827] text-[#FAF9F5] text-[10px] font-bold rounded-md hover:bg-slate-800">Duyệt chi</button>
 <button onClick={() => rejectWithdrawal(wdr)} className="px-3 py-1.5 border border-slate-300 text-[#6B7280] text-[10px] font-bold rounded-md hover:bg-slate-50">Từ chối</button>
 </div>
 ) : wdr.status === 'rejected' ? (
 <div className="flex justify-end">
 <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[10px] font-bold">ĐÃ TỪ CHỐI</span>
 </div>
 ) : (
 <div className="flex justify-end">
 <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold flex items-center gap-1">
 <CheckCircle2 className="w-3 h-3" /> ĐÃ XỬ LÝ
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
 {activeTab === 'affiliate' && affiliateSettlements.map((aff) => (
  <tr key={aff.id} className="hover:bg-[#F9FAFB] group transition-colors">
  <td className="px-6 py-4">
  <p className="text-sm font-bold text-[#111827]">{aff.affiliateName}</p>
  <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-tight">{aff.id}</p>
  </td>
  <td className="px-6 py-4 text-xs text-[#4B5563]">{aff.period}</td>
  <td className="px-6 py-4 text-right text-xs font-semibold text-slate-800">{aff.totalOrders}</td>
  <td className="px-6 py-4 text-right font-semibold text-slate-800">{formatCurrency(aff.gmv)}</td>
  <td className="px-6 py-4 text-right">
  <p className="text-sm font-bold text-[#10B981]">{formatCurrency(aff.commissionEarned)}</p>
  </td>
  <td className="px-6 py-4">
  <div className="flex justify-end gap-2 items-center">
  <span className={cn(
  "px-2 py-0.5 rounded-full text-[10px] font-bold",
  aff.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
  )}>
  {aff.status === 'completed' ? 'Đã Thanh toán' : 'Chờ Duyệt'}
  </span>
  {aff.status === 'pending' && (
    <button onClick={() => approveAffiliateSettlement(aff)} className="px-2 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700">Duyệt chi</button>
  )}
  </div>
  </td>
  </tr>
  ))}
  {activeTab === 'pickup' && pickupSettlements.map((hub) => (
  <tr key={hub.id} className="hover:bg-[#F9FAFB] group transition-colors">
  <td className="px-6 py-4">
  <p className="text-sm font-bold text-[#111827]">{hub.hubName}</p>
  <p className="text-[10px] text-[#6B7280] font-mono uppercase tracking-tight">{hub.id}</p>
  </td>
  <td className="px-6 py-4 text-xs text-[#4B5563]">{hub.period}</td>
  <td className="px-6 py-4 text-right text-xs font-semibold text-slate-800">{hub.totalOrders}</td>
  <td className="px-6 py-4 text-right">
  <p className="text-sm font-bold text-[#10B981]">{formatCurrency(hub.pickupFee)}</p>
  </td>
  <td className="px-6 py-4">
  <div className="flex justify-end gap-2 items-center">
  <span className={cn(
  "px-2 py-0.5 rounded-full text-[10px] font-bold",
  hub.status === 'completed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
  )}>
  {hub.status === 'completed' ? 'Đã Thanh toán' : 'Chờ Duyệt'}
  </span>
  {hub.status === 'pending' && (
    <button onClick={() => approvePickupSettlement(hub)} className="px-2 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-700">Duyệt chi</button>
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
