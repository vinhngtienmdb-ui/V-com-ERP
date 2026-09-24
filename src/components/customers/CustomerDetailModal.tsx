import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Trophy, 
  Copy, 
  Check, 
  Phone, 
  Mail, 
  Globe, 
  Sparkles, 
  Send, 
  DollarSign, 
  FileText, 
  Smartphone, 
  Calendar, 
  Tag, 
  ShieldCheck, 
  Clock, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building,
  PackageCheck
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { Customer } from '../../types/erp';
import { supabase } from '../../lib/supabase';
import { generateCustomerCareMessage } from '../../services/geminiService';
import { StatusBadge } from '../ui/design-system';

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
  leases?: any[];
  transactions?: any[];
  contracts?: any[];
  sellers?: any[];
  payouts?: any[];
  orders?: any[];
  onSuccess?: () => void;
}

const CopyButton = ({ value }: { value: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button 
      onClick={handleCopy}
      className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-400 hover:text-slate-700"
      title="Sao chép"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  onClose,
  leases = [],
  transactions = [],
  contracts = [],
  sellers = [],
  payouts = [],
  orders = [],
  onSuccess
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'wallet' | 'contracts' | 'activities'>('overview');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showConvertPanel, setShowConvertPanel] = useState(false);
  const [convertAmount, setConvertAmount] = useState(0);
  const [converting, setConverting] = useState(false);

  const getSegmentBadge = () => {
    const seg = (customer as any).segment;
    if (seg === 'core' || customer.totalSpent > 30000000) return <StatusBadge status="brand" text="VIP Champions" />;
    if (seg === 'potential' || customer.orderCount > 3) return <StatusBadge status="success" text="Khách Tiềm năng" />;
    if (seg === 'old') return <StatusBadge status="warning" text="Cần Kích Hoạt" />;
    return <StatusBadge status="neutral" text="Khách Mới" />;
  };

  const customerOrders = orders.filter(o => 
    (o.customerId && o.customerId === customer.id) ||
    (o.customerPhone && o.customerPhone === customer.phone) ||
    (o.customerName && o.customerName.toLowerCase() === customer.name.toLowerCase())
  );

  const customerLeases = leases.filter(l => 
    (l.phone && l.phone === customer.phone) || 
    (l.email && l.email.toLowerCase() === customer.email.toLowerCase())
  );

  const customerTransactions = transactions.filter(t => 
    (t.description && t.description.toLowerCase().includes(customer.name.toLowerCase())) ||
    (t.accountingObjectCode && t.accountingObjectCode === customer.id)
  );

  const customerContracts = contracts.filter(c => 
    c.party && (
      c.party.toLowerCase().includes(customer.name.toLowerCase()) || 
      customer.name.toLowerCase().includes(c.party.toLowerCase())
    )
  );

  const customerSeller = sellers.find(s => 
    s.sellerName && (
      s.sellerName.toLowerCase().includes(customer.name.toLowerCase()) || 
      customer.name.toLowerCase().includes(s.sellerName.toLowerCase())
    )
  );
  const customerPayouts = customerSeller ? payouts.filter(p => p.sellerId === customerSeller.sellerId) : [];

  const handleConvert = async () => {
    if (convertAmount <= 0 || convertAmount > (customer.walletBalance || 0)) return;
    setConverting(true);
    try {
      const cashbackDeducted = convertAmount;
      const promoAdded = Math.round(convertAmount * 1.1);

      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', customer.id)
        .maybeSingle();

      if (userRow) {
        const userData = userRow.data || {};
        const currentWallet = Number(userData.balance || userData.walletBalance || 0);
        const currentPromo = Number(userData.promoBalance || 0);

        const newActivity = {
          id: 'act_' + Date.now(),
          type: 'other' as const,
          title: 'Quy đổi Cashback sang Khuyến mại',
          description: `Quy đổi thành công ${formatCurrency(cashbackDeducted)} Cashback sang ${formatCurrency(promoAdded)} ví Khuyến mại (tỷ lệ 1.1).`,
          date: new Date().toISOString().split('T')[0],
          status: 'Hoàn thành'
        };

        const updatedActivities = userData.activities ? [newActivity, ...userData.activities] : [newActivity];

        userData.balance = currentWallet - cashbackDeducted;
        userData.walletBalance = currentWallet - cashbackDeducted;
        userData.promoBalance = currentPromo + promoAdded;
        userData.activities = updatedActivities;

        const { error } = await supabase
          .from('users')
          .update({ data: userData, updated_at: new Date().toISOString() })
          .eq('id', customer.id);

        if (error) throw error;

        alert(`Chuyển đổi thành công! Trừ ${formatCurrency(cashbackDeducted)} Cashback, cộng ${formatCurrency(promoAdded)} vào ví Khuyến mại.`);
        setShowConvertPanel(false);
        setConvertAmount(0);
        onSuccess?.();
      } else {
        throw new Error("Không tìm thấy thông tin khách hàng trên hệ thống.");
      }
    } catch (err: any) {
      console.error(err);
      alert('Chuyển đổi thất bại: ' + (err.message || 'Lỗi cơ sở dữ liệu'));
    } finally {
      setConverting(false);
    }
  };

  const handleGenerateAiMessage = async () => {
    setLoadingAi(true);
    try {
      const msg = await generateCustomerCareMessage(customer);
      const subjectMatch = msg.match(/^(?:Tiêu đề|Subject):\s*(.+?)(?:\n|$)/i);
      if (subjectMatch) {
        setEmailSubject(subjectMatch[1].trim());
        setEmailContent(msg.replace(subjectMatch[0], '').trim());
      } else {
        setEmailSubject(`Chương trình tri ân khách hàng ${customer.name}`);
        setEmailContent(msg.trim());
      }
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header Bar with Cross-app Actions */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
              {customer.name?.charAt(0)?.toUpperCase() || 'C'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                  {customer.name}
                </h2>
                {getSegmentBadge()}
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 flex items-center gap-1">
                  <Trophy className="w-3 h-3 text-amber-500" />
                  {customer.tier || 'Hạng Bạc'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                ID: {customer.id} • {customer.phone}
              </p>
            </div>
          </div>

          {/* Seamless Cross-App Quick Action Shortcuts */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/orders?search=${encodeURIComponent(customer.phone || customer.name)}`);
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Xem lịch sử đơn hàng tại phân hệ Đơn hàng"
            >
              📦 Đơn hàng
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/omnichat');
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Mở kênh nhắn tin đa kênh"
            >
              💬 OmniChat
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/device-leasing?search=${encodeURIComponent(customer.phone)}`);
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Tra cứu hợp đồng thiết bị đang thuê"
            >
              📱 Thuê máy
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate(`/invoices?search=${encodeURIComponent(customer.name)}`);
              }}
              className="px-2.5 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
              title="Xuất HĐĐT thuế"
            >
              📄 Hóa đơn VAT
            </button>
            <button 
              onClick={onClose} 
              className="w-8 h-8 rounded-xl bg-slate-200/70 hover:bg-slate-300 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all ml-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Subtabs */}
        <div className="flex border-b border-slate-200 bg-white px-5 shrink-0 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Tổng quan Hồ sơ 360°' },
            { id: 'orders', label: `Lịch sử Đơn hàng (${customerOrders.length})` },
            { id: 'wallet', label: 'Ví V-Xu & Nạp tiền' },
            { id: 'contracts', label: `Hợp đồng & Thiết bị (${customerContracts.length + customerLeases.length})` },
            { id: 'activities', label: 'Nhật ký Chăm sóc & AI' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "py-3 px-3.5 text-xs font-bold border-b-2 transition-all cursor-pointer shrink-0",
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50/50">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Tổng chi tiêu (LTV)</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{formatCurrency(customer.totalSpent || 0)}</p>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Đã thanh toán</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Số đơn hàng</p>
                  <p className="text-lg font-black text-slate-900 mt-1">{customer.orderCount || 0} đơn</p>
                  <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded mt-1 inline-block">Trung bình 1.2M/đơn</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Số dư Ví</p>
                  <p className="text-lg font-black text-emerald-600 mt-1">{formatCurrency(customer.walletBalance || 0)}</p>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded mt-1 inline-block">Khả dụng</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Điểm V-Xu Loyalty</p>
                  <p className="text-lg font-black text-amber-600 mt-1">{(customer.points || 0).toLocaleString()} V-Xu</p>
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">Quy đổi 1:1,000đ</span>
                </div>
              </div>

              {/* Contact and Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Phone className="w-3.5 h-3.5 text-blue-600" /> Thông tin liên hệ chính
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Số điện thoại:</span>
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        {customer.phone || 'Chưa cập nhật'}
                        {customer.phone && <CopyButton value={customer.phone} />}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Email:</span>
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        {customer.email || 'Chưa cập nhật'}
                        {customer.email && <CopyButton value={customer.email} />}
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Địa chỉ giao hàng:</span>
                      <span className="font-semibold text-slate-800 text-right max-w-[240px] truncate">
                        {(customer as any).address || 'Quận 1, TP. Hồ Chí Minh'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Người giới thiệu:</span>
                      <span className="font-semibold text-indigo-600">{customer.referrerName || 'Hệ thống trực tiếp'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <Building className="w-3.5 h-3.5 text-indigo-600" /> Pháp lý & Kênh tiếp cận
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Loại khách hàng:</span>
                      <span className="font-bold text-slate-800">
                        {(customer as any).customerType === 'b2b' ? '🏢 Doanh nghiệp B2B' : '👤 Cá nhân B2C'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Mã số thuế:</span>
                      <span className="font-mono font-semibold text-slate-800">{(customer as any).taxCode || '0316889988'}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-50">
                      <span className="text-slate-500">Hạn mức công nợ:</span>
                      <span className="font-bold text-rose-600">{formatCurrency((customer as any).creditLimit || 50000000)}</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-500">Kênh tương tác:</span>
                      <div className="flex gap-1">
                        {customer.channels?.map(ch => (
                          <span key={ch} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress to next tier */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 rounded-2xl text-white shadow-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-xs text-amber-300">Tiến trình Nâng hạng Thẻ Thành viên</span>
                  </div>
                  <span className="text-xs text-slate-300 font-medium">Hạng kế tiếp: <strong>Bạch Kim</strong></span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-400 to-yellow-300 h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, (customer.totalSpent / 50000000) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-mono">
                  <span>Hiện tại: {formatCurrency(customer.totalSpent || 0)}</span>
                  <span>Mục tiêu: 50,000,000₫</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-slate-900">Lịch sử đơn hàng eCommerce & B2B</h3>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/orders?search=${encodeURIComponent(customer.phone || customer.name)}`);
                  }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                >
                  Mở rộng trong Quản lý Đơn hàng →
                </button>
              </div>

              {customerOrders.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Mã đơn</th>
                        <th className="p-3">Ngày đặt</th>
                        <th className="p-3">Sản phẩm</th>
                        <th className="p-3 text-right">Tổng tiền</th>
                        <th className="p-3">Trạng thái</th>
                        <th className="p-3 text-right">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {customerOrders.map(order => (
                        <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-900">{order.id}</td>
                          <td className="p-3 text-slate-600">{order.date || '18/03/2026'}</td>
                          <td className="p-3 text-slate-700 font-medium">
                            {order.items?.length ? `${order.items[0].name} ${order.items.length > 1 ? `(+${order.items.length - 1})` : ''}` : 'Sản phẩm tiêu dùng'}
                          </td>
                          <td className="p-3 text-right font-black text-slate-900 font-mono">
                            {formatCurrency(order.total || 0)}
                          </td>
                          <td className="p-3">
                            <StatusBadge 
                              status={order.status === 'delivered' ? 'success' : order.status === 'pending' ? 'warning' : 'info'}
                              text={order.status === 'delivered' ? 'Đã giao' : order.status === 'pending' ? 'Chờ xử lý' : 'Đang giao'}
                            />
                          </td>
                          <td className="p-3 text-right">
                            <button
                              onClick={() => {
                                onClose();
                                navigate(`/orders?orderId=${order.id}`);
                              }}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold text-slate-700 transition-colors"
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8">
                  <PackageCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-700">Chưa có đơn hàng nào được ghi nhận</p>
                  <p className="text-xs text-slate-500 mt-1">Đơn hàng mua trên sàn TMĐT hoặc tạo trực tiếp sẽ xuất hiện tại đây.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WALLET & CASHBACK */}
          {activeTab === 'wallet' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-5 rounded-2xl text-white shadow-lg space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider">Số dư Ví hoàn tiền (Cashback)</span>
                    <h3 className="text-2xl font-black mt-1">{formatCurrency(customer.walletBalance || 0)}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowConvertPanel(!showConvertPanel)}
                      className="px-3.5 py-2 bg-white text-emerald-800 rounded-xl text-xs font-bold hover:bg-emerald-50 transition-all shadow-xs cursor-pointer"
                    >
                      {showConvertPanel ? 'Đóng quy đổi' : 'Quy đổi sang Khuyến mại (+10%)'}
                    </button>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-5 rounded-2xl text-white shadow-lg space-y-4">
                  <div>
                    <span className="text-[11px] font-bold text-amber-200 uppercase tracking-wider">Điểm tích lũy V-Xu</span>
                    <h3 className="text-2xl font-black mt-1">{(customer.points || 0).toLocaleString()} V-Xu</h3>
                  </div>
                  <p className="text-xs text-amber-100">Dùng để thanh toán trực tiếp các đơn hàng trên toàn hệ sinh thái VComm.</p>
                </div>
              </div>

              {/* VietQR Dynamic Topup */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Nạp tiền tự động qua VietQR Napas 247
                </h4>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-xs">
                    <img 
                      src={`https://api.vietqr.io/image/970415-1020088998-qr_only.jpg?amount=500000&addInfo=VCOMM_DEP_${customer.id}`}
                      alt="VietQR Deposit" 
                      className="w-36 h-36 object-contain"
                    />
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <p>Ngân hàng: <strong>VietinBank (TMCP Công Thương Việt Nam)</strong></p>
                    <p>Số tài khoản: <strong className="font-mono text-blue-600">1020088998</strong></p>
                    <p>Chủ tài khoản: <strong>CONG TY CO PHAN CONG NGHE VCOMM</strong></p>
                    <p>Cú pháp nạp: <strong className="font-mono bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded">VCOMM_DEP_{customer.id}</strong></p>
                    <p className="text-[11px] text-slate-500 italic mt-2">Hệ thống tự động cộng tiền sau 15 giây qua Webhook Open Banking.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTRACTS & LEASING */}
          {activeTab === 'contracts' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Hợp đồng điện tử ký số</h4>
                {customerContracts.length > 0 ? (
                  <div className="space-y-2">
                    {customerContracts.map(c => (
                      <div key={c.id} className="p-3.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{c.title || c.id}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Hạn: {c.expiry} • Giá trị: {c.value}</p>
                        </div>
                        <StatusBadge status="success" text="Đã ký số Cloud HSM" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-white p-4 rounded-xl border border-slate-200">
                    Chưa có hợp đồng nào liên kết với khách hàng này.
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Thiết bị POS / Máy móc cho thuê</h4>
                {customerLeases.length > 0 ? (
                  <div className="space-y-2">
                    {customerLeases.map(l => (
                      <div key={l.id} className="p-3.5 bg-white rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-slate-900">{l.deviceName || l.deviceModel || 'Máy POS Pax A920'}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">Mã hợp đồng: {l.contractCode || l.id} • Hạn thuê: {l.endDate || 'Vô thời hạn'}</p>
                        </div>
                        <StatusBadge status="info" text="Đang vận hành" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic bg-white p-4 rounded-xl border border-slate-200">
                    Khách hàng hiện không thuê thiết bị POS hoặc smartphone nào.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: ACTIVITIES & AI CARE */}
          {activeTab === 'activities' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-4 sm:p-5 rounded-2xl">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-blue-900 uppercase">Trợ lý Gemini AI soạn kịch bản chăm sóc</h4>
                  </div>
                  <button
                    onClick={handleGenerateAiMessage}
                    disabled={loadingAi}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {loadingAi ? 'Đang phân tích...' : '✨ Tạo kịch bản'}
                  </button>
                </div>

                {emailContent ? (
                  <div className="space-y-3 mt-3">
                    <input 
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Tiêu đề tin nhắn..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 outline-none"
                    />
                    <textarea
                      rows={4}
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-700 outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${emailSubject}\n\n${emailContent}`);
                          alert('Đã copy nội dung!');
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                      >
                        Sao chép
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          navigate('/omnichat');
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Gửi qua OmniChat
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-blue-800 leading-relaxed">
                    Bấm "Tạo kịch bản" để Gemini AI tự động phân tích tần suất mua sắm, giá trị chi tiêu và thói quen để gợi ý thông điệp kích hoạt bán hàng phù hợp nhất.
                  </p>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-white flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer shadow-xs"
          >
            Đóng hồ sơ
          </button>
        </div>

      </div>
    </div>
  );
};
