import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  MessageSquare, 
  Facebook, 
  PhoneCall, 
  Globe, 
  Search, 
  Filter, 
  MoreHorizontal,
  ShoppingCart,
  DollarSign,
  History,
  ExternalLink,
  LifeBuoy,
  X,
  Mail,
  Smartphone,
  Sparkles,
  Trophy,
  Loader2,
  Copy,
  Check,
  Send,
  Settings,
  Lock,
  Unlock,
  Wallet,
  Kanban,
  List,
  BadgeDollarSign,
  ShieldCheck,
  Clock,
  FileText
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Customer } from '../types/erp';
import { db, collection, onSnapshot, addDoc, doc, updateDoc, getDocs, query, orderBy, range, search, where } from '../services/dbService';
import { syncCustomerToMisa } from '../services/misaService';
import { supabase } from '../lib/supabase';
import { Modal } from './ui/Modal';

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
 className="p-1 hover:bg-slate-100 rounded-md transition-colors text-slate-500 hover:text-primary-600"
 title="Copy"
 >
 {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
 </button>
 );
};

const CustomerDetailModal = ({ 
  customer, 
  onClose,
  leases = [],
  transactions = [],
  contracts = [],
  sellers = [],
  payouts = [],
  onSuccess
}: { 
  customer: Customer; 
  onClose: () => void;
  leases?: any[];
  transactions?: any[];
  contracts?: any[];
  sellers?: any[];
  payouts?: any[];
  onSuccess?: () => void;
}) => {
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailContent, setEmailContent] = useState<string>('');
  const [showConvertPanel, setShowConvertPanel] = useState(false);
  const [convertAmount, setConvertAmount] = useState<number>(0);
  const [converting, setConverting] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'leasing' | 'seller' | 'contracts' | 'ledger'>('overview');

  const getSegmentLabel = () => {
    switch ((customer as any).segment) {
      case 'core': return 'Khách hàng Core';
      case 'old': return 'Khách hàng Cũ';
      case 'new': return 'Mới đăng ký';
      case 'potential': return 'Tiềm năng';
      default: return 'Khách hàng';
    }
  };

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


  // Logic for tier progress (Mock)
  const nextTierThreshold = 50000000;
  const progressPercent = Math.min((customer.totalSpent / nextTierThreshold) * 100, 100);

  // Linked ERP Data Filter Logic
  const customerLeases = leases.filter(l => 
    (l.phone && l.phone === customer.phone) || 
    (l.email && customer.email && l.email?.toLowerCase() === customer.email?.toLowerCase())
  );

  const customerTransactions = transactions.filter(t => 
    (t.description && customer.name && (t.description?.toLowerCase() || '').includes(customer.name?.toLowerCase())) ||
    (t.accountingObjectCode && t.accountingObjectCode === customer.id)
  );

  const customerContracts = contracts.filter(c => 
    c.party && customer.name && (
      (c.party?.toLowerCase() || '').includes(customer.name?.toLowerCase()) || 
      (customer.name?.toLowerCase() || '').includes(c.party?.toLowerCase())
    )
  );

  const customerSeller = sellers.find(s => 
    s.sellerName && customer.name && (
      (s.sellerName?.toLowerCase() || '').includes(customer.name?.toLowerCase()) || 
      (customer.name?.toLowerCase() || '').includes(s.sellerName?.toLowerCase())
    )
  );
  const customerPayouts = customerSeller 
    ? payouts.filter(p => p.sellerId === customerSeller.sellerId)
    : [];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="5xl"
      hideFooter
      noPadding
      fullscreen
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#111827]">Hồ sơ Khách hàng 360°</h2>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase flex items-center gap-1 border border-amber-200">
              <Trophy className="w-3 h-3" /> Hạng Vàng
            </span>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase flex items-center gap-1 border border-blue-200">
              {getSegmentLabel()}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Tổng quan & Ví' },
            { id: 'leasing', label: `Thuê thiết bị (${customerLeases.length})` },
            { id: 'seller', label: customerSeller ? `Tín nhiệm Nhà bán (${customerSeller.tier})` : 'Tín nhiệm Nhà bán' },
            { id: 'contracts', label: `Hợp đồng (${customerContracts.length})` },
            { id: 'ledger', label: `Sổ cái Tài chính (${customerTransactions.length})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveModalTab(tab.id as any)}
              className={cn(
                "px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap",
                activeModalTab === tab.id 
                  ? "border-primary-600 text-primary-600 bg-white" 
                  : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Body Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Persistent Left Sidebar */}
          <div className="w-80 border-r border-slate-200 overflow-y-auto p-5 space-y-4 shrink-0 bg-slate-50/50">
            <div className="p-6 bg-white border border-slate-200 rounded-lg text-center shadow-sm">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold mb-4 mx-auto border-4 border-white shadow-sm">
                {customer?.name?.split(' ').pop()?.charAt(0) || '?'}
              </div>
              <h3 className="font-bold text-lg text-slate-900">{customer.name}</h3>
              <p className="text-sm text-slate-500 mb-4 font-mono">{customer.id}</p>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200"><Mail className="w-4 h-4 text-slate-500" /> <span className="truncate">{customer.email}</span></div>
                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200"><Smartphone className="w-4 h-4 text-slate-500" /> {customer.phone}</div>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-widest">Mục tiêu lên hạng</h4>
                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2.5 text-center">Tích lũy thêm <span className="font-bold text-slate-700">{formatCurrency(nextTierThreshold - customer.totalSpent)}</span> để lên Kim Cương</p>
            </div>
            
            <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm relative overflow-hidden group">
              <h4 className="font-bold text-xs mb-3 text-blue-800 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" /> Phân giải RFM Score
              </h4>
              <div className="space-y-2.5">
                {[
                  { label: 'Recency', score: customer.rfmScore?.recency || 1 },
                  { label: 'Frequency', score: customer.rfmScore?.frequency || 1 },
                  { label: 'Monetary', score: customer.rfmScore?.monetary || 1 },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-orange-700 font-bold uppercase tracking-tighter">{item.label}</span> 
                      <span className="font-black text-primary-900">{item.score}/5</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-800 transition-all" style={{ width: `${(item.score / 5) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-emerald-800 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" /> Tài sản & Thưởng
              </h4>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-lg border border-emerald-100/50 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Ví Hoàn Tiền (Cashback)</span>
                    <button className="text-[9px] text-[#FAF9F5] bg-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-emerald-700 relative z-10">RÚT TIỀN</button>
                  </div>
                  <span className="text-lg font-bold text-emerald-900 leading-none tracking-tight">{formatCurrency(customer.walletBalance || 0)}</span>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-primary-100/50 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">Ví Khuyến Mại</span>
                    <button className="text-[9px] text-primary-600 border border-blue-200 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-primary-50 relative z-10">Lịch sử</button>
                  </div>
                  <span className="text-lg font-bold text-primary-900 leading-none tracking-tight">{formatCurrency(customer.promoBalance || 0)}</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-purple-100/50 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Ví Điểm Loyalty</span>
                    <button className="text-[9px] text-[#FAF9F5] bg-purple-600 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-purple-700 relative z-10">Shop Đổi Điểm</button>
                  </div>
                  <span className="text-lg font-bold text-purple-900 leading-none tracking-tight">{customer.points || 0} <span className="text-xs font-medium text-purple-600">pts</span></span>
                </div>
                
                <div className="pt-1 space-y-3">
                  <button 
                    onClick={() => setShowConvertPanel(!showConvertPanel)} 
                    className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-[10px] font-bold uppercase rounded transition-colors flex justify-center items-center gap-1.5 shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" /> ĐỔI HOÀN TIỀN LẤY KHUYẾN MẠI
                  </button>

                  {showConvertPanel && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-inner">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                        <span>Số tiền muốn quy đổi</span>
                        <span className="text-emerald-600">Max: {formatCurrency(customer.walletBalance || 0)}</span>
                      </div>
                      
                      <input 
                        type="range" 
                        min="0" 
                        max={customer.walletBalance || 0} 
                        step="1000"
                        value={convertAmount} 
                        onChange={(e) => setConvertAmount(Number(e.target.value))} 
                        className="w-full accent-emerald-600"
                      />

                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          min="0" 
                          max={customer.walletBalance || 0} 
                          value={convertAmount}
                          onChange={(e) => {
                            const val = Math.min(Number(e.target.value), customer.walletBalance || 0);
                            setConvertAmount(val);
                          }}
                          className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs outline-none focus:border-emerald-500 font-mono"
                        />
                        <button 
                          type="button"
                          onClick={() => setConvertAmount(customer.walletBalance || 0)}
                          className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase hover:bg-slate-200"
                        >
                          Tối đa
                        </button>
                      </div>

                      <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded text-xs space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Dùng Cashback:</span>
                          <span className="font-mono text-red-600">-{formatCurrency(convertAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-800">
                          <span>Nhận Khuyến mại (x1.1):</span>
                          <span className="font-mono text-emerald-600">+{formatCurrency(Math.round(convertAmount * 1.1))}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => { setShowConvertPanel(false); setConvertAmount(0); }}
                          className="flex-1 py-1.5 bg-white border border-slate-300 text-slate-700 text-[10px] font-bold rounded hover:bg-slate-50"
                        >
                          Hủy
                        </button>
                        <button 
                          type="button"
                          onClick={handleConvert}
                          disabled={convertAmount <= 0 || converting}
                          className="flex-1 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-700 disabled:opacity-50 flex justify-center items-center gap-1"
                        >
                          {converting && <Loader2 className="w-3 h-3 animate-spin" />}
                          XÁC NHẬN
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Workspaces (Right 2/3 Area) */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {activeModalTab === 'overview' && (
              <div className="space-y-6">
                <DraggableGrid className="grid grid-cols-2 gap-4" columns={2} gap={16}>
                  <div className="p-5 border border-slate-200 rounded-lg bg-slate-50 shadow-sm group">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover:text-primary-500 transition-colors">Tổng chi tiêu mua sắm</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                  <div className="p-5 border border-slate-200 rounded-lg bg-slate-50 shadow-sm group">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover:text-primary-500 transition-colors">Số đơn hàng đã mua</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">{customer.orderCount}</span>
                      <span className="text-xs font-bold text-slate-500">đơn</span>
                    </div>
                  </div>
                </DraggableGrid>
                
                <div className="bg-primary-50/50 border border-primary-100 p-6 rounded-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 -mr-8 -mt-8 rounded-full opacity-50"></div>
                  <div className="flex justify-between items-center mb-5 relative z-10">
                    <h4 className="font-bold text-primary-900 flex items-center gap-2">
                      <Mail className="w-5 h-5 text-primary-600" /> CSKH qua Email
                    </h4>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border border-primary-100/50 shadow-inner relative z-10 mb-4 focus-within:border-primary-300 transition-colors">
                    <input 
                      type="text" 
                      placeholder="Tiêu đề email tự động..." 
                      className="w-full border-b border-slate-200 pb-2 mb-2 text-sm focus:outline-none font-bold text-slate-900 placeholder:font-normal placeholder:italic bg-transparent"
                      value={emailSubject}
                      
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                    <textarea 
                      className="w-full h-32 text-sm resize-none focus:outline-none text-slate-800 placeholder:italic bg-transparent scrollbar-hide"
                      placeholder="Soạn thảo nội dung chăm sóc..."
                      value={emailContent}
                      
                      onChange={(e) => setEmailContent(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex justify-end gap-3 relative z-10">
                    <button 
                      disabled={!emailSubject || !emailContent}
                      className="bg-primary-600 text-[#FAF9F5] px-6 py-3 rounded-lg text-xs font-bold shadow-sm shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2"
                      onClick={() => {
                        alert('Tin nhắn chăm sóc đã được gửi tới ' + customer.email);
                      }}
                    >
                      <Send className="w-3.5 h-3.5" /> GỬI NGAY CHO {customer.name.toUpperCase()}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h4 className="font-bold flex items-center gap-2 text-slate-900 text-sm">
                      <History className="w-4 h-4 text-primary-600" /> Hành trình khách hàng
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      STATUS: <span className="text-primary-600 uppercase tracking-tighter bg-primary-50 px-1.5 py-0.5 rounded">Tích cực</span>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
                    {customer.activities && customer.activities.length > 0 ? (
                      customer.activities.map((item, idx) => {
                        const getIcon = () => {
                          switch(item.type) {
                            case 'purchase': return <ShoppingCart className="w-3 h-3" />;
                            case 'consultation': return <MessageSquare className="w-3 h-3" />;
                            case 'rma': return <History className="w-3 h-3" />;
                            default: return <LifeBuoy className="w-3 h-3" />;
                          }
                        };
                        const getColor = () => {
                          switch(item.type) {
                            case 'purchase': return 'text-orange-700 bg-[#EAE7DF] border-orange-200';
                            case 'consultation': return 'text-purple-600 bg-purple-100 border-purple-200';
                            case 'rma': return 'text-red-600 bg-red-100 border-red-200';
                            default: return 'text-slate-700 bg-slate-100 border-slate-300';
                          }
                        };

                        return (
                          <div key={item.id} className="flex gap-4 relative group">
                            {idx < customer.activities!.length - 1 && (
                              <div className="absolute left-[13px] top-7 w-[1px] h-full bg-slate-200 group-hover:bg-blue-300 transition-colors"></div>
                            )}
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border shadow-sm transition-transform ", getColor())}>
                              {getIcon()}
                            </div>
                            <div className="flex-1 bg-white p-3 rounded-lg border border-transparent group-hover:border-slate-300 group-hover:shadow-sm transition-all">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-[#111827]">{item.title}</p>
                                <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{item.date}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-normal">{item.description}</p>
                              <div className="mt-2 flex items-center justify-between">
                                {item.status && (
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-full",
                                    item.status === 'Hoàn thành' ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-50"
                                  )}>
                                    {item.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 bg-white rounded-lg border border-dashed border-slate-300">
                        <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 italic">Chưa có dữ liệu hoạt động cho khách hàng này.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeModalTab === 'leasing' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary-600" /> Hồ sơ Thuê thiết bị (Device Leasing)
                  </h3>
                  <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded">
                    Số HĐ liên kết: {customerLeases.length}
                  </span>
                </div>

                {customerLeases.length > 0 ? (
                  <div className="space-y-6">
                    {customerLeases.map((lease: any) => {
                      const totalOverdue = lease.installments?.filter((i: any) => i.status === 'overdue').length || 0;
                      const totalPaid = lease.installments?.filter((i: any) => i.status === 'paid').length || 0;
                      const totalUnpaid = lease.installments?.filter((i: any) => i.status === 'unpaid').length || 0;
                      
                      return (
                        <div key={lease.id} className="border border-slate-200 rounded-lg p-5 bg-slate-50/50 space-y-4 hover:border-slate-300 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-950 text-sm">{lease.deviceModel}</h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Số HĐ: {lease.id}</p>
                            </div>
                            <div className="flex gap-2">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                                lease.knoxStatus === 'locked' ? "bg-red-50 text-red-700 border-red-200" :
                                lease.knoxStatus === 'warning' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              )}>
                                Knox: {lease.knoxStatus || 'Unlocked'}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                                lease.status === 'active' ? "bg-primary-50 text-blue-700 border-blue-200" :
                                lease.status === 'late' ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-100 text-slate-600 border-slate-200"
                              )}>
                                HĐ: {lease.status === 'active' ? 'Đang thuê' : lease.status === 'late' ? 'Trễ hạn' : lease.status}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 bg-white p-3.5 border border-slate-200 rounded-lg text-xs">
                            <div>
                              <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Giá thiết bị</p>
                              <p className="font-bold text-slate-900">{formatCurrency(lease.devicePrice)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Đã đặt cọc</p>
                              <p className="font-bold text-slate-900">{formatCurrency(lease.upfrontFee)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Phí thuê/tháng</p>
                              <p className="font-bold text-slate-900">{formatCurrency(lease.monthlyFee)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Thời hạn</p>
                              <p className="font-bold text-slate-900">{lease.durationMonths} tháng</p>
                            </div>
                          </div>

                          {/* Installments Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                              <span>Tiến độ thanh toán các kỳ hạn</span>
                              <span>Đã đóng: {totalPaid} / {lease.installments?.length || 0} kỳ</span>
                            </div>
                            <div className="flex gap-1 h-3.5 w-full bg-slate-100 rounded overflow-hidden p-0.5 border border-slate-200">
                              {lease.installments?.map((inst: any, idx: number) => (
                                <div 
                                  key={idx}
                                  className={cn(
                                    "flex-1 h-full rounded transition-all",
                                    inst.status === 'paid' ? "bg-emerald-500" : 
                                    inst.status === 'overdue' ? "bg-red-500 animate-pulse" : "bg-slate-300"
                                  )}
                                  title={`Kỳ ${inst.periodNum}: ${formatCurrency(inst.amount)} - ${inst.dueDate} (${inst.status})`}
                                />
                              ))}
                            </div>
                            <div className="flex gap-4 justify-end text-[10px] font-bold text-slate-500 pt-1">
                              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span> Đã đóng ({totalPaid})</span>
                              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded"></span> Quá hạn ({totalOverdue})</span>
                              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-300 rounded"></span> Chờ đóng ({totalUnpaid})</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <Smartphone className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Không có hợp đồng thuê thiết bị</p>
                    <p className="text-xs text-slate-500 mt-1 italic">Khách hàng này chưa thực hiện giao dịch hoặc đăng ký thuê máy Knox MDM.</p>
                  </div>
                )}
              </div>
            )}

            {activeModalTab === 'seller' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BadgeDollarSign className="w-4 h-4 text-primary-600" /> Tín nhiệm & Tài chính Nhà bán (B2B Seller)
                  </h3>
                </div>

                {customerSeller ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-6 bg-slate-50 border border-slate-200 rounded-lg p-5">
                      <div className="text-center p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Điểm tín dụng</p>
                        <p className="text-3xl font-black text-slate-900">{customerSeller.score}</p>
                        <span className={cn(
                          "inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-black uppercase border",
                          customerSeller.tier === 'AAA' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          customerSeller.tier === 'AA' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-primary-50 text-blue-700 border-blue-200"
                        )}>
                          Tier {customerSeller.tier}
                        </span>
                      </div>

                      <div className="col-span-2 space-y-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>Sử dụng hạn mức tín dụng</span>
                            <span>{Math.round((customerSeller.outstandingDebt / customerSeller.maxCreditLimit) * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: `${(customerSeller.outstandingDebt / customerSeller.maxCreditLimit) * 100}%` }}></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                            <span>Đã dùng: {formatCurrency(customerSeller.outstandingDebt)}</span>
                            <span>Hạn mức phê duyệt: {formatCurrency(customerSeller.maxCreditLimit)}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <p className="text-[10px] font-bold text-emerald-800 uppercase">Hạn mức khả dụng</p>
                            <p className="text-lg font-black text-emerald-950 mt-0.5">{formatCurrency(customerSeller.availableCredit)}</p>
                          </div>
                          <ShieldCheck className="w-8 h-8 text-emerald-600 opacity-60" />
                        </div>
                      </div>
                    </div>

                    {/* Early Payout requests */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Lịch sử yêu cầu Giải ngân sớm (Early Payouts)
                      </h4>
                      {customerPayouts.length > 0 ? (
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                              <tr>
                                <th className="p-3">Mã yêu cầu</th>
                                <th className="p-3">Số tiền</th>
                                <th className="p-3">Phí chiết khấu</th>
                                <th className="p-3">Ngày yêu cầu</th>
                                <th className="p-3 text-center">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {customerPayouts.map((pay: any) => (
                                <tr key={pay.id} className="hover:bg-slate-50">
                                  <td className="p-3 font-mono font-bold text-slate-900">{pay.id}</td>
                                  <td className="p-3 font-bold text-slate-950">{formatCurrency(pay.amount)}</td>
                                  <td className="p-3 text-red-600 font-medium">{formatCurrency(pay.discountFee)}</td>
                                  <td className="p-3 text-slate-600">{pay.requestDate}</td>
                                  <td className="p-3 text-center">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                                      pay.status === 'disbursed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                      pay.status === 'approved' ? "bg-primary-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                    )}>
                                      {pay.status === 'disbursed' ? 'Đã chi tiền' : pay.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center py-6 text-xs text-slate-500 italic bg-slate-50 border border-dashed border-slate-200 rounded-lg">Không có yêu cầu giải ngân nào gần đây.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <BadgeDollarSign className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Không có hồ sơ tín dụng Nhà bán</p>
                    <p className="text-xs text-slate-500 mt-1 italic">Khách hàng này không thuộc danh mục đối tác B2B Seller có hạn mức tín dụng tài chính.</p>
                  </div>
                )}
              </div>
            )}

            {activeModalTab === 'contracts' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" /> Quản lý Hợp đồng B2B & Ký số (SmartCA)
                  </h3>
                </div>

                {customerContracts.length > 0 ? (
                  <div className="space-y-6">
                    {customerContracts.map((con: any) => (
                      <div key={con.id} className="border border-slate-200 rounded-lg p-5 bg-slate-50/50 space-y-4 hover:border-slate-300 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-950 text-sm">{con.title}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Số HĐ: {con.id} • Hết hạn: {con.expiry}</p>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                            con.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            con.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {con.status === 'active' ? 'Hiệu lực' : con.status === 'pending' ? 'Chờ ký' : con.status}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600">Giá trị hợp đồng: <strong className="text-slate-900 font-bold">{con.value}</strong></span>
                          {con.file && <span className="text-[10px] text-slate-500 italic">File đính kèm: {con.file.name}</span>}
                        </div>

                        {/* Signers Progress */}
                        {con.signers && (
                          <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-2.5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiến trình chữ ký số SmartCA</p>
                            <div className="flex gap-4">
                              {con.signers.map((sig: any, sIdx: number) => (
                                <div key={sIdx} className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded flex items-center justify-between text-xs">
                                  <div>
                                    <p className="font-bold text-slate-900 truncate max-w-[120px]">{sig.name}</p>
                                    <p className="text-[9px] text-slate-500">{sig.role}</p>
                                  </div>
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                                    sig.status === 'signed' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                                  )}>
                                    {sig.status === 'signed' ? 'Đã ký' : 'Chờ ký'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Không có hợp đồng ký số</p>
                    <p className="text-xs text-slate-500 mt-1 italic">Chưa tìm thấy hợp đồng lao động, mua bán hay dịch vụ của khách hàng này.</p>
                  </div>
                )}
              </div>
            )}

            {activeModalTab === 'ledger' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary-600" /> Sổ cái Tài chính & Bút toán (Circular 99/2025/TT-BTC)
                  </h3>
                </div>

                {customerTransactions.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                        <tr>
                          <th className="p-3">Ngày giao dịch</th>
                          <th className="p-3">Mô tả bút toán</th>
                          <th className="p-3">Tài khoản Nợ/Có</th>
                          <th className="p-3 text-right">Số tiền phát sinh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerTransactions.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-500 font-mono">{tx.date || tx.dateStr}</td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{tx.description}</p>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Phân loại: {tx.category} • Mã: {tx.id.slice(-8).toUpperCase()}</p>
                            </td>
                            <td className="p-3 font-mono text-slate-600">
                              Nợ: {tx.debitAccount || '112'} / Có: {tx.creditAccount || '131'}
                            </td>
                            <td className={cn(
                              "p-3 text-right font-black",
                              tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                            )}>
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Chưa có giao dịch sổ cái</p>
                    <p className="text-xs text-slate-500 mt-1 italic">Hệ thống kế toán chưa ghi nhận bút toán thu chi nào đối với khách hàng này.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};


const CustomerConfigModal = ({ onClose }: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'tier' | 'points' | 'tags' | 'sources'>('tier');
  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="3xl"
      title="Cấu hình & Phân tích Nâng cao"
      icon={<Settings className="w-5 h-5" />}
      hideFooter
      noPadding
    >
      <div className="flex flex-col h-full">
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
          {[
            { id: 'tier', label: 'Hạng thành viên' },
            { id: 'points', label: 'Tích điểm' },
            { id: 'tags', label: 'Thẻ phân loại' },
            { id: 'sources', label: 'Nguồn khách hàng' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-6 py-4 text-sm font-bold border-b-2 transition-all",
                activeTab === tab.id ? "border-slate-900 text-orange-700" : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-400"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 min-h-[300px] bg-slate-50 max-h-[60vh] overflow-y-auto">
          {activeTab === 'tier' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900">Danh sách Hạng thành viên</h3>
                <button className="px-4 py-2 bg-slate-900 text-[#FAF9F5] rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">
                  + Thêm hạng thành viên
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-slate-500" /> Hạng Bạc (Mặc định)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">Chi tiêu từ: 0đ</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-orange-700 font-medium hover:underline">Sửa</button>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" /> Hạng Vàng
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">Chi tiêu từ: 10,000,000đ</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-orange-700 font-medium hover:underline">Sửa</button>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-300 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-sky-400" /> Hạng Kim Cương
                    </h4>
                    <p className="text-xs text-slate-600 mt-1">Chi tiêu từ: 50,000,000đ</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-orange-700 font-medium hover:underline">Sửa</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'points' && (
            <div className="space-y-6">
              <h3 className="font-bold text-slate-900">Cấu hình Tích điểm & Tiêu điểm</h3>
              <DraggableGrid className="grid grid-cols-2 gap-6" columns={2} gap={24}>
                <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-300">
                  <h4 className="font-bold text-sm text-slate-800 mb-2 border-b border-slate-200 pb-2">Tỉ lệ tích điểm</h4>
                  <div>
                    <label className="text-xs font-bold text-slate-600">Giới hạn thời gian (Tháng)</label>
                    <input type="number" defaultValue={12} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">Chi tiêu (VNĐ) = Bằng</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input type="number" defaultValue={100000} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none" />
                      <span className="text-sm font-bold text-slate-700">=</span>
                      <input type="number" defaultValue={10} className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none placeholder:text-slate-500" />
                      <span className="text-xs text-slate-600">Điểm</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-300">
                  <h4 className="font-bold text-sm text-slate-800 mb-2 border-b border-slate-200 pb-2">Tỉ lệ tiêu điểm (Thanh toán)</h4>
                  <div>
                    <label className="text-xs font-bold text-slate-600">1 Điểm tương đương (VNĐ)</label>
                    <input type="number" defaultValue={100} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">Tối đa sử dụng / Đơn hàng (%)</label>
                    <input type="number" defaultValue={50} className="w-full mt-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
              </DraggableGrid>
              <div className="flex justify-end">
                <button onClick={onClose} className="px-6 py-2.5 bg-slate-900 text-[#FAF9F5] font-bold text-sm rounded-lg hover:bg-slate-800">Lưu cấu hình</button>
              </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900">Thẻ phân loại ưu tiên (VIP, Fraud...)</h3>
                  <p className="text-xs text-slate-600 mt-1">Cấu hình các tag màu để làm nổi bật khách hàng trong hệ thống.</p>
                </div>
                <button className="px-4 py-2 bg-slate-900 text-[#FAF9F5] rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">
                  + Thêm thẻ
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-slate-300 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">#FRAUD / SPAM</span>
                    <p className="text-xs text-slate-600">Khách hàng có lịch sử bom hàng, lừa đảo.</p>
                  </div>
                  <button className="text-xs text-slate-500 hover:text-red-500 font-medium">Xóa</button>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-300 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-[#EAE7DF] text-orange-800 rounded-full text-xs font-bold border border-orange-200">#KOL / INFLUENCER</span>
                    <p className="text-xs text-slate-600">Người có ảnh hưởng, cần chăm sóc đặc biệt.</p>
                  </div>
                  <button className="text-xs text-slate-500 hover:text-red-500 font-medium">Xóa</button>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'sources' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900">Cấu hình Nguồn Tracking</h3>
                  <p className="text-xs text-slate-600 mt-1">Đồng bộ dữ liệu khách hàng từ các nền tảng tự động.</p>
                </div>
                <button className="px-4 py-2 bg-slate-100 text-slate-800 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                  + Kết nối Nguồn mới
                </button>
              </div>
              
              <DraggableGrid className="grid grid-cols-2 gap-4" columns={2} gap={16}>
                <div className="p-4 rounded-lg border border-emerald-500 bg-emerald-50 relative overflow-hidden group">
                  <h4 className="font-bold text-emerald-900">Landing Page Nệm Foam</h4>
                  <p className="text-xs text-emerald-700 mt-1">Đang hoạt động (Tự động sync qua Webhook)</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded">240 Leads</span>
                    <button className="text-emerald-700 text-[10px] font-bold uppercase hover:underline">Chỉnh sửa</button>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-slate-300 bg-white relative overflow-hidden group">
                  <h4 className="font-bold text-slate-900">Chiến dịch Mùa Hè - Zalo Ads</h4>
                  <p className="text-xs text-slate-600 mt-1">Tạm dừng (Mất kết nối API)</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">0 Leads</span>
                    <button className="text-orange-700 text-[10px] font-bold uppercase hover:underline">Kết nối lại</button>
                  </div>
                </div>
                <div className="p-4 rounded-lg border border-slate-900 bg-slate-100 relative overflow-hidden group">
                  <h4 className="font-bold text-primary-900">Facebook Shop</h4>
                  <p className="text-xs text-orange-800 mt-1">Đang hoạt động (Sync qua Meta Graph API)</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-700 bg-white px-2 py-1 rounded">1,250 Leads</span>
                    <button className="text-orange-800 text-[10px] font-bold uppercase hover:underline">Chỉnh sửa</button>
                  </div>
                </div>
              </DraggableGrid>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const AddCustomerModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    channels: ['web']
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const customerId = 'cust_' + Date.now();
      const userData = {
        id: customerId,
        tenant_id: 'tenant-vcomm-prod-01',
        data: {
          userId: customerId,
          displayName: formData.name,
          phone: formData.phone,
          email: formData.email,
          role: 'user',
          channels: formData.channels || ['web'],
          status: 'active',
          points: 0,
          walletBalance: 0,
          totalSpent: 0,
          orderCount: 0
        },
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('users')
        .insert(userData);

      if (error) throw error;
      
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert('Thêm khách hàng thất bại: ' + (error.message || 'Lỗi kết nối CSDL'));
    }
    setIsSubmitting(false);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      maxWidth="md"
      title="Thêm Khách hàng mới"
      hideFooter
      noPadding
      fullscreen
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block">Họ và tên *</label>
          <input 
            required
            type="text" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none" 
            placeholder="Nguyễn Văn A"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block">Số điện thoại *</label>
          <input 
            required
            type="text" 
            value={formData.phone}
            onChange={e => setFormData({...formData, phone: e.target.value})}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none" 
            placeholder="0901234567"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 mb-1 block">Email</label>
          <input 
            type="email" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-primary-500 outline-none" 
            placeholder="email@example.com"
          />
        </div>
        <div className="pt-4 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-800 font-bold text-sm rounded-lg hover:bg-slate-200">Hủy</button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-slate-900 text-[#FAF9F5] font-bold text-sm rounded-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Lưu Khách hàng
          </button>
        </div>
      </form>
    </Modal>
  );
};

export function Customers() {
 const navigate = useNavigate();
 const [activeView, setActiveView] = useState<'list' | 'pipeline'>('list');
 const [activeChannel, setActiveChannel] = useState<'all' | 'zalo' | 'facebook' | 'web' | 'hotline'>('all');
 const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
 const [showConfigModal, setShowConfigModal] = useState(false);
 const [showAddModal, setShowAddModal] = useState(false);
 const [adjustingCustomer, setAdjustingCustomer] = useState<Customer | null>(null);
 const [adjustAmount, setAdjustAmount] = useState('');
 const [adjustType, setAdjustType] = useState<'wallet' | 'points'>('wallet');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshCount, setRefreshCount] = useState(0);
  const [rfmCounts, setRfmCounts] = useState({ core: 0, old: 0, potential: 0, newReg: 0 });
  const triggerRefresh = () => setRefreshCount(prev => prev + 1);
 const [searchQuery, setSearchQuery] = useState('');
 const [orders, setOrders] = useState<any[]>([]);
  const [syncingCustomerId, setSyncingCustomerId] = useState<string | null>(null);
  const [selectedRfmFilter, setSelectedRfmFilter] = useState<'all' | 'core' | 'old' | 'potential' | 'new'>('all');
  const [leases, setLeases] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

 const [pipelineStages, setPipelineStages] = useState([
 { id: 'new', name: 'Leads Mới', count: 0, color: 'bg-slate-800', 
 deals: [
 { id: 'd1', client: 'Công ty Cổ phần Sữa TH', val: 50000000, pd: 'Giày đồng phục 500 đôi' },
 { id: 'd2', client: 'Vinpearl Nha Trang', val: 120000000, pd: 'Khăn lạnh KS' }
 ] 
 },
 { id: 'qualified', name: 'Đã Thẩm Định', count: 0, color: 'bg-primary-500', 
 deals: [
 { id: 'd3', client: 'Kangaroo Việt Nam', val: 80000000, pd: 'Quà tặng Tết' }
 ] 
 },
 { id: 'proposal', name: 'Gửi Báo Giá', count: 0, color: 'bg-amber-500', 
 deals: [
 { id: 'd4', client: 'Viettel Telecom', val: 350000000, pd: 'Gói combo đồng phục' },
{ id: 'd5', client: 'FPT Software', val: 45000000, pd: 'Balo laptop' }
 ] 
 },
 { id: 'negotiation', name: 'Thương Lượng', count: 0, color: 'bg-orange-500', 
 deals: [
{ id: 'd6', client: 'Bệnh viện Tâm Anh', val: 210000000, pd: 'Khẩu trang Y tế sỉ' }
 ] 
 },
 { id: 'won', name: 'Chốt - Đoạt HĐ', count: 0, color: 'bg-emerald-500', 
 deals: [
 { id: 'd7', client: 'Techcombank', val: 560000000, pd: 'Đồng phục Giao dịch viên' }
 ] 
 }
 ]);

 const handleDragStartPipeline = (e: React.DragEvent, dealId: string, sourceStageId: string) => {
 e.dataTransfer.setData('dealId', dealId);
 e.dataTransfer.setData('sourceStageId', sourceStageId);
 };

 const handleDropPipeline = (e: React.DragEvent, targetStageId: string) => {
 const dealId = e.dataTransfer.getData('dealId');
 const sourceStageId = e.dataTransfer.getData('sourceStageId');
 if (sourceStageId === targetStageId) return;

 setPipelineStages(prev => {
 const newStages = [...prev];
 const sIdx = newStages.findIndex(s => s.id === sourceStageId);
 const tIdx = newStages.findIndex(s => s.id === targetStageId);
 
 const dealIdx = newStages[sIdx].deals.findIndex(d => d.id === dealId);
 const [dealToMove] = newStages[sIdx].deals.splice(dealIdx, 1);
 newStages[tIdx].deals.push(dealToMove);
 return newStages;
 });
 };

    // Close modals on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedCustomer(null);
        setShowConfigModal(false);
        setShowAddModal(false);
        setAdjustingCustomer(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCustomer, showConfigModal, showAddModal, adjustingCustomer]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch customers with pagination and search
  useEffect(() => {
    let active = true;
    setLoading(true);
    
    const load = async () => {
      try {
        const from = (currentPage - 1) * pageSize;
        const to = from + pageSize - 1;
        
        let queryBuilder = supabase
          .from('customers')
          .select('*', { count: 'exact' });

        if (debouncedSearchQuery.trim() !== '') {
          queryBuilder = queryBuilder.or(`name.ilike.%${debouncedSearchQuery}%,phone.ilike.%${debouncedSearchQuery}%,email.ilike.%${debouncedSearchQuery}%`);
        }

        queryBuilder = queryBuilder
          .order('name', { ascending: true })
          .range(from, to);

        const { data: custRows, count, error } = await queryBuilder;
        if (error) throw error;
        
        if (active) {
          if (custRows && custRows.length > 0) {
            const userIds = custRows.map(c => c.id);
            const emails = custRows.map(c => c.email).filter(e => e);
            
            let userRows: any[] = [];
            // Fetch users by ID or Email
            const { data: usersById } = await supabase.from('users').select('*').in('id', userIds);
            const { data: usersAll } = await supabase.from('users').select('*'); // Workaround: since we can't search JSON fields efficiently without RPC, we filter locally. It's a small dataset.
            
            if (usersById) userRows = [...usersById];
            if (usersAll) {
               const usersByEmail = usersAll.filter(u => u.data?.email && emails.includes(u.data.email));
               userRows = [...userRows, ...usersByEmail];
            }
              
            const userMap = new Map();
            if (userRows) {
              userRows.forEach(u => {
                userMap.set(u.id, u);
                if (u.data && u.data.email) userMap.set(u.data.email, u);
              });
            }
            
            const customersList = custRows.map(c => {
              const uMatch = (c.email && userMap.has(c.email)) ? userMap.get(c.email) : userMap.get(c.id);
              const uData = uMatch ? (uMatch.data || {}) : {};
              
              return {
                id: c.id,
                name: c.name || uData.displayName || uData.username || 'Khách hàng mới',
                email: c.email || uData.email || '',
                phone: c.phone || uData.phone || '',
                address: c.address || uData.address || '',
                totalSpent: Number(uData.totalSpent || 0),
                orderCount: Number(uData.orderCount || 0),
                lastOrderDate: uData.lastOrderDate || '',
                status: c.status || uData.status || 'active',
                channels: c.channels || uData.channels || ['web'],
                points: Number(uData.points || uData.vXu || 0),
                walletBalance: Number(uData.balance || uData.walletBalance || 0),
                promoBalance: Number(uData.promoBalance || 0),
                tier: uData.level || uData.tier || 'Thành viên mới',
                activities: uData.activities || [],
                linkedUserId: uMatch ? uMatch.id : null
              };
            });
            
            setCustomers(customersList);
            setTotalCount(count || 0);
          } else {
            setCustomers([]);
            setTotalCount(0);
          }
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
        if (active) setLoading(false);
      }
    };
    
    load();
    return () => { active = false; };
  }, [currentPage, debouncedSearchQuery, refreshCount]);

  useEffect(() => {
    const calculateRfmSegments = async () => {
      try {
        const { data: allCusts } = await supabase
          .from('customers')
          .select('id, email');
          
        if (!allCusts) return;
        
        const { data: allUsers } = await supabase
          .from('users')
          .select('id, data');
          
        if (!allUsers) return;
        
        const userMap = new Map();
        allUsers.forEach(u => {
          userMap.set(u.id, u.data || {});
          if (u.data && u.data.email) userMap.set(u.data.email?.toLowerCase(), u.data || {});
        });
        
        let core = 0;
        let old = 0;
        let potential = 0;
        let newReg = 0;
        
        allCusts.forEach(c => {
          const uData = (c.email && userMap.has(c.email?.toLowerCase())) 
            ? userMap.get(c.email?.toLowerCase()) 
            : (userMap.get(c.id) || {});
            
          const totalSpent = Number(uData.totalSpent || 0);
          const orderCount = Number(uData.orderCount || 0);
          const lastOrderDateStr = uData.lastOrderDate || '';
          
          let recencyScore = 1; // 1: Old, 2: Medium, 3: Recent
          if (lastOrderDateStr) {
            const lastOrderDate = new Date(lastOrderDateStr);
            const daysDiff = (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24);
            if (daysDiff <= 30) recencyScore = 3;
            else if (daysDiff <= 90) recencyScore = 2;
          }
          
          let frequencyScore = 1;
          if (orderCount >= 5) frequencyScore = 3;
          else if (orderCount >= 2) frequencyScore = 2;
          
          let monetaryScore = 1;
          if (totalSpent >= 1000000) monetaryScore = 3;
          else if (totalSpent >= 500000) monetaryScore = 2;
          
          // Classify
          if (orderCount === 0) {
            newReg++;
          } else if (recencyScore >= 2 && frequencyScore >= 2 && monetaryScore >= 2) {
            core++;
          } else if (recencyScore === 1) {
            old++;
          } else {
            potential++;
          }
        });
        
        setRfmCounts({ core, old, potential, newReg });
      } catch (err) {
        console.error('Error calculating RFM segments:', err);
      }
    };
    
    calculateRfmSegments();
  }, [refreshCount]);

  useEffect(() => {
    // Fetch all completed orders to aggregate totalSpent per customer
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setOrders(ordersData.filter(o => o.status === 'completed' && o.customerId));
    });

    // Fetch leases
    const unsubLeases = onSnapshot(collection(db, 'device_leases'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setLeases(data);
    }, (err) => {
      console.warn('Firestore device_leases offline, using empty array', err);
    });

    // Fetch transactions
    const unsubTransactions = onSnapshot(collection(db, 'finance_transactions'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setTransactions(data);
    }, (err) => {
      console.warn('Firestore finance_transactions offline, using empty array', err);
    });

    // Load contracts
    const DEFAULT_CONTRACTS = [
      { id: 'HDLD-001', title: 'Hợp đồng lao động - Nguyễn Văn A', type: 'labor', subtype: 'Chính thức', status: 'active', party: 'Nguyễn Văn A', expiry: '01/01/2025', value: '-', signatureStatus: 'signed', signers: [{role: 'Người sử dụng lao động', name: 'Giám đốc', status: 'signed'}, {role: 'Người lao động', name: 'Nguyễn Văn A', status: 'signed'}], file: { name: 'HDLD_NguyenVanA.docx', type: 'docx' }, comments: [ { id: 1, author: 'Nhân sự', time: '10:00 01/02', content: 'Đã cập nhật phụ lục đính kèm.' } ] },
      { id: 'HDTV-002', title: 'Hợp đồng thử việc - Trần Thái B', type: 'labor', subtype: 'Thử việc', status: 'expiring_soon', signatureStatus: 'signed', party: 'Trần Thái B', expiry: '10/05/2024', value: '-', signers: [{role: 'Người sử dụng ND', name: 'Giám đốc', status: 'signed'}, {role: 'Người lao động', name: 'Trần Thái B', status: 'signed'}], file: { name: 'HDTV_TranThaiB_v2.pdf', type: 'pdf' }, comments: [] },
      { id: 'HDMB-HM-01', title: 'Hợp đồng Mua bán Sỉ Thời trang - H&M Vietnam', type: 'sales', subtype: 'Mua bán', status: 'active', signatureStatus: 'signed', party: 'Thời Trang H&M Vietnam', expiry: '15/05/2027', value: '450,000,000 ₫', signers: [{role: 'Bên mua', name: 'Thời Trang H&M Vietnam', status: 'signed'}, {role: 'Bên bán', name: 'VComm ERP', status: 'signed'}], file: { name: 'HDMB_HM_Vietnam_signed.pdf', type: 'pdf' }, comments: [] },
      { id: 'HDDV-LL-01', title: 'Hợp đồng Dịch vụ Hợp tác Phân phối - LockLock', type: 'service', subtype: 'Dịch vụ', status: 'pending', signatureStatus: 'pending', party: 'Gia Dụng LockLock', expiry: '20/05/2027', value: '180,000,000 ₫', signers: [{role: 'Bên mua', name: 'VComm ERP', status: 'signed'}, {role: 'Bên bán', name: 'Gia Dụng LockLock', status: 'pending'}], file: { name: 'HDDV_LockLock_Draft.docx', type: 'docx' }, comments: [{ id: 1, author: 'Pháp chế', time: '11:00 20/05', content: 'Cần xác thực chữ ký số SmartCA của đại diện LockLock.' }] },
      { id: 'HDMB-CC-01', title: 'Hợp đồng Đại lý Phân phối Mỹ phẩm - Coco Lux', type: 'sales', subtype: 'Mua bán', status: 'active', signatureStatus: 'signed', party: 'Mỹ Phẩm Coco Lux', expiry: '01/06/2028', value: '850,000,000 ₫', signers: [{role: 'Bên mua', name: 'Mỹ Phẩm Coco Lux', status: 'signed'}, {role: 'Bên bán', name: 'VComm ERP', status: 'signed'}], file: { name: 'HDMB_CocoLux_Final.pdf', type: 'pdf' }, comments: [] }
    ];
    const localContracts = localStorage.getItem('vcomm_contracts');
    if (localContracts && localContracts.includes('HDMB-HM-01')) {
      setContracts(JSON.parse(localContracts));
    } else {
      setContracts(DEFAULT_CONTRACTS);
      localStorage.setItem('vcomm_contracts', JSON.stringify(DEFAULT_CONTRACTS));
    }

    // Load sellers credit
    const DEFAULT_SELLERS = [
      { sellerId: 'SEL-001', sellerName: 'Thời Trang H&M Vietnam', gmvGrowth: 88, refundRate: 94, buyerRating: 92, complianceIndex: 95, maxLimitBase: 600000000, outstandingDebt: 150000000, score: 850, tier: 'AAA', maxCreditLimit: 500000000, availableCredit: 350000000 },
      { sellerId: 'SEL-005', sellerName: 'Gia Dụng LockLock', gmvGrowth: 75, refundRate: 85, buyerRating: 88, complianceIndex: 90, maxLimitBase: 300000000, outstandingDebt: 8000000, score: 720, tier: 'A', maxCreditLimit: 100000000, availableCredit: 92000000 },
      { sellerId: 'SEL-012', sellerName: 'Mỹ Phẩm Coco Lux', gmvGrowth: 92, refundRate: 98, buyerRating: 95, complianceIndex: 95, maxLimitBase: 800000000, outstandingDebt: 320000000, score: 940, tier: 'AAA', maxCreditLimit: 750000000, availableCredit: 430000000 },
      { sellerId: 'SEL-018', sellerName: 'Điện Máy Chợ Lớn', gmvGrowth: 60, refundRate: 72, buyerRating: 80, complianceIndex: 65, maxLimitBase: 400000000, outstandingDebt: 280000000, score: 580, tier: 'B', maxCreditLimit: 200000000, availableCredit: 0 },
      { sellerId: 'SEL-024', sellerName: 'Nông Sản Sạch Đà Lạt', gmvGrowth: 82, refundRate: 90, buyerRating: 85, complianceIndex: 92, maxLimitBase: 250000000, outstandingDebt: 10000000, score: 810, tier: 'AA', maxCreditLimit: 200000000, availableCredit: 190000000 }
    ];
    const localSellers = localStorage.getItem('vcomm_seller_credit_scores');
    if (localSellers) {
      setSellers(JSON.parse(localSellers));
    } else {
      setSellers(DEFAULT_SELLERS);
      localStorage.setItem('vcomm_seller_credit_scores', JSON.stringify(DEFAULT_SELLERS));
    }

    // Load payouts
    const DEFAULT_PAYOUTS = [
      { id: 'EPR-01', sellerId: 'SEL-001', amount: 45000000, discountFee: 450000, requestDate: '17/03/2026', status: 'pending' },
      { id: 'EPR-02', sellerId: 'SEL-012', amount: 15400000, discountFee: 154000, requestDate: '16/03/2026', status: 'approved' },
      { id: 'EPR-03', sellerId: 'SEL-005', amount: 82000000, discountFee: 820000, requestDate: '15/03/2026', status: 'disbursed' },
      { id: 'EPR-04', sellerId: 'SEL-018', amount: 23000000, discountFee: 230000, requestDate: '14/03/2026', status: 'pending' }
    ];
    const localPayouts = localStorage.getItem('vcomm_early_payouts');
    if (localPayouts) {
      setPayouts(JSON.parse(localPayouts));
    } else {
      setPayouts(DEFAULT_PAYOUTS);
      localStorage.setItem('vcomm_early_payouts', JSON.stringify(DEFAULT_PAYOUTS));
    }

    return () => {
      unsubOrders();
      unsubLeases();
      unsubTransactions();
    };
  }, []);

  const handleToggleLock = async (id: string, currentStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { data: userRow } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (userRow) {
        const userData = userRow.data || {};
        userData.status = currentStatus === 'locked' ? 'active' : 'locked';
        
        const { error } = await supabase
          .from('users')
          .update({ data: userData, updated_at: new Date().toISOString() })
          .eq('id', id);

        if (error) throw error;
        
        triggerRefresh();
      }
    } catch(err) {
      console.error('Error toggling lock state', err);
    }
  };

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingCustomer || !adjustAmount) return;
    
    // Chuẩn hóa tên field: chỉ dùng 'walletBalance' và 'vXu'
    const canonicalField = adjustType === 'wallet' ? 'walletBalance' : 'vXu';
    const amount = Number(adjustAmount);
    
    if (isNaN(amount) || amount === 0) {
      alert('Số tiền không hợp lệ!');
      return;
    }

    try {
      // Bước 1: Tìm user trong bảng 'users' (eCommerce source of truth)
      // Ưu tiên: linkedUserId → ID trực tiếp → tìm bằng email
      let userRow: any = null;

      // Thử tìm bằng linkedUserId hoặc id trực tiếp
      const lookupId = (adjustingCustomer as any).linkedUserId || adjustingCustomer.id;
      const { data: userById } = await supabase
        .from('users')
        .select('*')
        .eq('id', lookupId)
        .maybeSingle();
      
      if (userById) {
        userRow = userById;
      } else if (adjustingCustomer.email) {
        // Fallback: tìm bằng email trong JSONB data column
        const { data: allUsers } = await supabase
          .from('users')
          .select('*')
          .limit(500);
        
        if (allUsers) {
          userRow = allUsers.find((u: any) => 
            u.data?.email && u.data.email?.toLowerCase() === adjustingCustomer.email?.toLowerCase()
          ) || null;
        }
      }

      if (!userRow) {
        // Không tìm thấy user eCommerce - báo lỗi, không tạo user ảo
        alert(`Không tìm thấy tài khoản eCommerce tương ứng cho khách hàng "${adjustingCustomer.name}".\n\nKhách hàng cần đăng ký tài khoản trên eCommerce trước khi có thể cộng/trừ số dư từ ERP.`);
        return;
      }

      // Bước 2: Cộng/trừ số dư vào đúng field chuẩn
      const userData = userRow.data || {};
      const currentVal = Number(userData[canonicalField] || 0);
      const newVal = currentVal + amount;

      // Ghi chuẩn hóa: chỉ dùng 1 field name duy nhất
      const updatedData = {
        ...userData,
        [canonicalField]: newVal,
      };

      // Đảm bảo backward compat cho eCommerce đọc cả 2 tên field cũ
      if (canonicalField === 'walletBalance') {
        updatedData.balance = newVal; // Legacy compat
      } else if (canonicalField === 'vXu') {
        updatedData.points = newVal; // Legacy compat
      }

      const { error } = await supabase
        .from('users')
        .update({ data: updatedData, updated_at: new Date().toISOString() })
        .eq('id', userRow.id);

      if (error) throw error;

      if (adjustType === 'points') {
        try {
          const ledgerId = `lpl-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          const ledgerPayload = {
            id: ledgerId,
            tenant_id: userRow.tenant_id || 'tenant-vcomm-prod-01',
            customer_id: adjustingCustomer.id,
            points_change: amount,
            transaction_type: amount > 0 ? 'adjust_add' : 'adjust_sub',
            description: `ERP Adjustment: ${amount > 0 ? '+' : ''}${amount} V-Xu`,
            reference_type: 'manual',
            reference_id: null,
            created_at: new Date().toISOString()
          };
          const { error: ledgerError } = await supabase
            .from('loyalty_points_ledger')
            .insert(ledgerPayload);
          if (ledgerError) throw ledgerError;
        } catch (ledgerErr) {
          console.error('[LoyaltyLedger] Failed to write point log:', ledgerErr);
        }
      }
      // Thông báo thành công
      const typeLabel = adjustType === 'wallet' ? 'số dư Ví' : 'V-Xu';
      const action = amount >= 0 ? 'Cộng' : 'Trừ';
      alert(`✓ ${action} ${Math.abs(amount).toLocaleString('vi-VN')}${adjustType === 'wallet' ? '₫' : ' V-Xu'} vào ${typeLabel} của "${adjustingCustomer.name}" thành công!\nSố dư mới: ${newVal.toLocaleString('vi-VN')}${adjustType === 'wallet' ? '₫' : ' V-Xu'}`);

      setAdjustingCustomer(null);
      setAdjustAmount('');
      triggerRefresh();
    } catch(err: any) {
      console.error('Error adjusting balance', err);
      alert(`Lỗi khi điều chỉnh số dư: ${err.message || err}\n\nVui lòng thử lại hoặc kiểm tra kết nối mạng.`);
    }
  };

 // Compute dynamic fields
 const dynamicCustomers = customers.map(c => {
 const customerOrders = orders.filter(o => o.customerId === c.id);
 const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
 const orderCount = customerOrders.length;
 
 // Simulate active status based on recent purchase or base status
 // If they have any orders in the system they are active
const status = (orderCount > 0 || c.status === 'active') ? 'active' : 'inactive';

 return { ...c, totalSpent, orderCount, status } as Customer;
 });



 const totalRfm = rfmCounts.core + rfmCounts.old + rfmCounts.potential + rfmCounts.newReg || 1;
 const corePct = Math.round((rfmCounts.core / totalRfm) * 100);
 const oldPct = Math.round((rfmCounts.old / totalRfm) * 100);
 const potentialPct = Math.round((rfmCounts.potential / totalRfm) * 100);
 const newRegPct = Math.round((rfmCounts.newReg / totalRfm) * 100);

 const filteredCustomers = dynamicCustomers;

 return (
 <div className="max-w-[1440px] mx-auto space-y-6 animate-in fade-in slide-in- duration-500 overflow-hidden pb-10">
 {selectedCustomer && (
 <CustomerDetailModal 
 customer={dynamicCustomers.find(c => c.id === selectedCustomer.id) || selectedCustomer}
  onClose={() => setSelectedCustomer(null)}
  leases={leases}
  transactions={transactions}
  contracts={contracts}
  sellers={sellers}
  payouts={payouts}
  />
 )}
 {showConfigModal && (
 <CustomerConfigModal onClose={() => setShowConfigModal(false)} />
 )}
 {showAddModal && (
 <AddCustomerModal onClose={() => setShowAddModal(false)} />
 )}
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-1">
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Quản trị Khách hàng & CRM</h1>
 </div>
 <p className="text-sm text-[#6B7280]">Hệ thống chăm sóc khách hàng đa kênh, quản lý Loyalty & Pipeline.</p>
 </div>
 <div className="flex gap-3 items-center">
 <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-300 mr-2">
 <button 
 onClick={() => setActiveView('list')}
 className={cn("px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2", activeView === 'list' ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 <List className="w-4 h-4" /> Danh sách
 </button>
 <button 
 onClick={() => setActiveView('pipeline')}
 className={cn("px-3 py-1.5 rounded-md text-sm font-bold transition-all flex items-center gap-2", activeView === 'pipeline' ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 <Kanban className="w-4 h-4" /> Pipeline
 </button>
 </div>
 <button 
 onClick={() => setShowAddModal(true)}
 className="bg-primary-600 text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
 >
 <Users className="w-4 h-4" /> Thêm Khách hàng
 </button>
 <button 
 onClick={() => navigate('/omnichat')}
 className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2"
 >
 <MessageSquare className="w-4 h-4 text-emerald-500" /> Omni Chat
 </button>
 </div>
 </div>

 {activeView === 'list' ? (
 <>
 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-3">Tổng khách hàng</p>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{totalCount}</span>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">+5.2%</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-3">Active (Hệ thống)</p>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{totalCount}</span>
 <span className="text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded">High Retention</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-3">Chi tiêu TB (CLV)</p>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{formatCurrency(24500000)}</span>
 <span className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded">Synced</span>
 </div>
 </div>
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-3">Loyalty (Vàng+)</p>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-amber-600">{Math.round(totalCount * 0.15)}</span>
 <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">High Value</span>
 </div>
 </div>
 </DraggableGrid>

 {/* CRM Intelligence & RFM Segmentation */}
 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-3 gap-6" columns={3} gap={24}>
 <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-300 shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-4">
 <Sparkles className="w-5 h-5 text-primary-200 group-hover:text-primary-400 transition-colors animate-pulse" />
 </div>
 <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
 <Users className="w-5 h-5 text-primary-600" /> Phân đoạn Khách hàng (RFM Segmentation)
 </h3>
 <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 {[
 { name: 'Khách hàng Core', val: 12, color: 'bg-emerald-500', desc: 'Mua nhiều & gần đây' },
 { name: 'Khách hàng Cũ', val: 45, color: 'bg-rose-500', desc: 'Chưa mua lại > 3 tháng' },
 { name: 'Tiềm năng', val: 28, color: 'bg-slate-800', desc: 'Sẵn sàng Upsell' },
 { name: 'Mới đăng ký', val: 15, color: 'bg-primary-500', desc: 'Cần Onboarding' }
 ].map((seg, i) => (
 <div key={i} className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-white hover:shadow-sm transition-all cursor-pointer">
 <div className="flex justify-between items-start mb-2">
 <div className={cn("w-2 h-2 rounded-full", seg.color)} />
 <span className="text-xl font-black text-slate-900">{seg.val}%</span>
 </div>
 <p className="text-xs font-bold text-slate-900 mb-1">{seg.name}</p>
 <p className="text-[10px] text-slate-500 leading-tight">{seg.desc}</p>
 </div>
 ))}
 </div>
 
 <div className="mt-8 p-4 bg-primary-50 border border-primary-100 rounded-lg flex items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-white text-primary-600 rounded-lg shadow-sm">
 <Mail className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-xs font-bold text-primary-900">Chiến dịch tự động (Marketing Automation)</h4>
 <p className="text-[10px] text-primary-700/70">Đang có 12 khách hàng thuộc nhóm "Tiềm năng" có thể gửi Voucher.</p>
 </div>
 </div>
 <button className="px-5 py-2 bg-primary-600 text-[#FAF9F5] rounded-lg text-xs font-bold hover:bg-primary-700 transition-all shadow-sm">Kích hoạt Campaign</button>
 </div>
 </div>

 <div className="bg-slate-900 p-6 rounded-lg text-[#FAF9F5] relative overflow-hidden flex flex-col justify-between shadow-sm">
 <div className="relative z-10">
 <div className="flex items-center gap-3 mb-6">
 <div className="p-3 bg-white/10 backdrop-blur-md rounded-lg border border-white/20">
 <Trophy className="w-6 h-6 text-amber-400" />
 </div>
 <h3 className="text-xl font-black italic tracking-tighter">Loyalty Wallet Insight</h3>
 </div>
 <div className="space-y-6">
 <div className="bg-white/5 border border-white/10 p-4 rounded-lg">
 <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Tổng điểm khả dụng</div>
 <div className="text-3xl font-black text-[#FAF9F5] leading-none">1,245,600 <span className="text-xs font-normal text-slate-500">pts</span></div>
 </div>
 <div className="flex gap-4">
 <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-lg">
 <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Số dư Ví khách</p>
 <p className="text-lg font-bold">{formatCurrency(450000000)}</p>
 </div>
 <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-lg">
 <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">Hạng Kim Cương</p>
 <p className="text-lg font-bold text-sky-400">08 KH</p>
 </div>
 </div>
 </div>
 </div>
 <button className="relative z-10 w-full mt-8 py-4 bg-white text-slate-900 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
 <Settings className="w-4 h-4" /> Quản lý chính sách Loyalty
 </button>
 <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Tìm tên, SĐT, Email..." 
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <div className="flex gap-1 bg-white border border-slate-300 p-1 rounded-lg">
 <button 
 onClick={() => setActiveChannel('all')}
 className={cn("p-1.5 rounded-md transition-all", activeChannel === 'all' ? "bg-slate-100 text-[#111827]" : "text-[#9CA3AF]")}
 >
 <Globe className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setActiveChannel('zalo')}
 className={cn("p-1.5 rounded-md transition-all", activeChannel === 'zalo' ? "bg-slate-100 text-orange-700" : "text-[#9CA3AF]")}
 >
 <MessageSquare className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setActiveChannel('facebook')}
 className={cn("p-1.5 rounded-md transition-all", activeChannel === 'facebook' ? "bg-slate-900 text-[#FAF9F5]" : "text-[#9CA3AF]")}
 >
 <Facebook className="w-4 h-4" />
 </button>
 <button 
 onClick={() => setActiveChannel('hotline')}
 className={cn("p-1.5 rounded-md transition-all", activeChannel === 'hotline' ? "bg-emerald-50 text-emerald-600" : "text-[#9CA3AF]")}
 >
 <PhoneCall className="w-4 h-4" />
 </button>
 </div>
 </div>
 <button className="text-xs font-semibold text-primary-600 flex items-center gap-2 hover:underline">
 Xuất tệp CRM <ExternalLink className="w-3 h-3" />
 </button>
 </div>

 <div className="overflow-x-auto bg-white border-t border-slate-200 min-w-0">
<table className="w-full text-left border-collapse whitespace-nowrap">
 <thead>
 <tr className="bg-slate-50/50 border-b border-slate-200 italic">
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Khách hàng</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Liên hệ</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Kênh</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Chi tiêu</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ví / Loyalty</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái</th>
	<th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái Ghi sổ</th>
 <th className="px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-50">
 {loading ? (
 <tr>
 <td colSpan={7} className="px-6 py-6 text-center bg-white">
 <Loader2 className="w-8 h-8 text-primary-600 animate-spin mx-auto mb-1" />
 <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Đang truy xuất dữ liệu CRM...</p>
 </td>
 </tr>
 ) : filteredCustomers.map((customer) => (
 <tr key={customer.id} className="hover:bg-primary-50/30 group transition-all duration-200">
 <td className="px-4 py-4">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 font-bold text-[10px] shrink-0 border border-primary-100  transition-transform">
 {customer.name?.split(' ').pop()?.charAt(0) || 'U'}
 </div>
 <div className="min-w-0">
 <p onClick={() => setSelectedCustomer(customer)} className="text-sm font-bold text-slate-900 truncate cursor-pointer hover:text-primary-600 transition-colors uppercase tracking-tight">{customer.name}</p>
 <p className="text-[9px] text-slate-500 font-mono tracking-tighter">ID: {customer.id.slice(-8).toUpperCase()}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-4">
 <div className="space-y-1">
 <div className="flex items-center justify-between group/copy text-[11px]">
 <span className="text-slate-700 font-bold tracking-tight">{customer.phone}</span>
 <CopyButton value={customer.phone} />
 </div>
 <div className="flex items-center justify-between group/copy text-[10px]">
 <span className="text-slate-500 truncate max-w-[120px] italic">{customer.email}</span>
 <CopyButton value={customer.email} />
 </div>
 </div>
 </td>
 <td className="px-4 py-4 text-center">
 <div className="flex justify-center flex-wrap gap-1">
 {customer.channels && customer.channels.slice(0, 3).map(channel => (
 <span key={channel} className="p-1 rounded bg-white border border-slate-200 shadow-sm" title={channel.toUpperCase()}>
 {channel === 'zalo' && <MessageSquare className="w-3 h-3 text-orange-600" />}
 {channel === 'facebook' && <Facebook className="w-3 h-3 text-orange-800" />}
 {channel === 'hotline' && <PhoneCall className="w-3 h-3 text-emerald-600" />}
 {channel === 'web' && <Globe className="w-3 h-3 text-slate-500" />}
 </span>
 ))}
 {customer.channels && customer.channels.length > 3 && (
 <span className="text-[8px] font-bold text-slate-500 self-center">+{customer.channels.length - 3}</span>
 )}
 </div>
 </td>
 <td className="px-4 py-4 text-right">
 <p className="text-sm font-black text-slate-900">{formatCurrency(customer.totalSpent || 0)}</p>
 <p className="text-[9px] text-slate-500">Đơn hàng: <span className="font-bold text-slate-700">{customer.orderCount || 0}</span></p>
 </td>
 <td className="px-4 py-4 text-right">
 <p className="text-sm font-bold text-emerald-600">{formatCurrency(customer.walletBalance || 0)}</p>
 <p className="text-[9px] font-bold text-amber-600 flex items-center justify-end gap-1"><Trophy className="w-2.5 h-2.5" /> {customer.points || 0} pts</p>
 </td>
 <td className="px-4 py-4 text-center">
 <div className="flex justify-center">
 <span className={cn(
 "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm",
 customer.status === 'active' ? "bg-emerald-500 text-[#FAF9F5]" : customer.status === 'locked' ? "bg-red-500 text-[#FAF9F5]" : "bg-slate-100 text-slate-700"
 )}>
 {customer.status === 'active' ? 'ACTIVE' : customer.status === 'locked' ? 'LOCKED' : 'OFF'}
 </span>
 </div>
 </td>
              <td className="px-4 py-4 text-center">
                <div className="flex flex-col items-center justify-center gap-1">
                  {customer.misaSynced ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      Đã ghi sổ 🟢
                    </span>
                  ) : customer.misaSyncError ? (
                    <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold flex items-center gap-1 shadow-sm" title={customer.misaSyncError}>
                      Lỗi kiểm tra 🔴
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      Chờ ghi sổ 🟡
                    </span>
                  )}
                  <button
                    disabled={syncingCustomerId === customer.id}
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!customer.id) return;
                      setSyncingCustomerId(customer.id);
                      try {
                        await syncCustomerToMisa(customer.id);
                        alert("Ghi sổ khách hàng thành công!");
                      } catch (err) {
                        alert("Đồng bộ thất bại: " + err.message);
                      } finally {
                        setSyncingCustomerId(null);
                      }
                    }}
                    className="px-2 py-1 bg-slate-900 text-white rounded text-[10px] font-bold hover:bg-slate-800 disabled:opacity-50 transition-all flex items-center gap-1"
                  >
                    {syncingCustomerId === customer.id && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                    Đồng bộ
                  </button>
                </div>
              </td>
 <td className="px-4 py-4 text-right">
 <div className="flex justify-end gap-2">
 <button 
 onClick={(e) => { e.stopPropagation(); setAdjustingCustomer(customer); }}
 className="p-1.5 bg-green-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-[#FAF9F5] transition-all shadow-sm"
 title="Cộng/Trừ Điểm & Tiền"
 >
 <Wallet className="w-3.5 h-3.5" />
 </button>
 <button 
 onClick={(e) => handleToggleLock(customer.id!, customer.status, e)}
 className={cn("p-1.5 rounded-lg transition-all shadow-sm", customer.status === 'locked' ? "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-[#FAF9F5]" : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-[#FAF9F5]")}
 title={customer.status === 'locked' ? 'Mở khóa' : 'Khóa tài khoản'}
 >
 {customer.status === 'locked' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
 </button>
 <button 
 onClick={() => setSelectedCustomer(customer)}
 className="p-1.5 bg-slate-50 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
 >
 <ExternalLink className="w-3.5 h-3.5" />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
  {/* Phân trang Server-side */}
  <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4 font-sans shrink-0">
    <div className="text-xs text-slate-500 font-bold uppercase">
      Hiển thị {totalCount ? ((currentPage - 1) * pageSize) + 1 : 0} - {Math.min(currentPage * pageSize, totalCount)} trong số {totalCount} khách hàng
    </div>
    <div className="flex gap-2">
      <button
        disabled={currentPage === 1 || loading}
        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
        className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Trang trước
      </button>
      <span className="px-4 py-2 text-xs font-bold text-slate-900 self-center">
        Trang {currentPage} / {Math.ceil(totalCount / pageSize) || 1}
      </span>
      <button
        disabled={currentPage >= Math.ceil(totalCount / pageSize) || loading}
        onClick={() => setCurrentPage(prev => prev + 1)}
        className="px-4 py-2 border border-slate-300 bg-white rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Trang sau
      </button>
    </div>
  </div>
  </div>
  </>
 ) : (
 <div className="h-[calc(100vh-200px)] bg-slate-50 border border-slate-300 rounded-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
 <div className="p-4 border-b border-slate-300 bg-white flex justify-between items-center z-10 relative w-full">
 <div className="flex items-center gap-3">
 <h2 className="font-bold text-slate-900">Sales Pipeline B2B (Mẫu)</h2>
 </div>
 <button className="text-xs px-3 py-1.5 bg-slate-900 text-[#FAF9F5] font-bold rounded-lg hover:bg-slate-800 shadow-sm">+ Thêm Deal mới</button>
 </div>
 <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar-horizontal min-w-0">
 <div className="flex gap-6 h-full items-start">
 {pipelineStages.map(stage => (
 <div 
 key={stage.id} 
 className="w-80 shrink-0 bg-slate-100 rounded-lg flex flex-col max-h-full border border-slate-300 shadow-sm"
 onDragOver={(e) => e.preventDefault()}
 onDrop={(e) => handleDropPipeline(e, stage.id)}
 >
 <div className="p-3 border-b border-slate-300 flex justify-between items-center bg-white rounded-t-xl shrink-0">
 <div className="flex items-center gap-2">
 <div className={cn("w-3 h-3 rounded-full", stage.color)}></div>
 <span className="font-bold text-sm text-slate-900">{stage.name}</span>
 </div>
 <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{stage.deals.length}</span>
 </div>
 <div className="p-3 overflow-y-auto space-y-3 custom-scrollbar flex-1">
 {stage.deals.map((deal) => (
 <div 
 key={deal.id} 
 draggable
 onDragStart={(e) => handleDragStartPipeline(e, deal.id, stage.id)}
 className="bg-white p-3.5 rounded-lg shadow-sm border border-slate-300 cursor-grab hover:shadow-sm transition-all group"
 >
 <h4 className="font-bold text-sm text-slate-900 group-hover:text-primary-600 transition-colors">{deal.client}</h4>
 <p className="text-xs text-slate-600 mt-1 line-clamp-2">{deal.pd}</p>
 <div className="mt-3 flex items-center justify-between">
 <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">{formatCurrency(deal.val)}</span>
 <div className="flex -space-x-1.5">
 <div className="w-5 h-5 rounded-full bg-[#EAE7DF] text-[8px] font-bold text-orange-800 flex items-center justify-center border border-white">S1</div>
 </div>
 </div>
 </div>
 ))}
 <button className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors border border-dashed border-slate-400">
 + Thêm Deal
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {adjustingCustomer && (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-lg w-full max-w-md overflow-hidden shadow-sm animate-in fade-in zoom-in-95 duration-300">
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <div>
 <h2 className="text-lg font-bold text-slate-900">Điều chỉnh Điểm / Ví</h2>
 <p className="text-xs text-slate-600">Khách hàng: {adjustingCustomer.name}</p>
 </div>
 <button onClick={() => setAdjustingCustomer(null)} className="p-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"><X className="w-5 h-5 text-slate-600" /></button>
 </div>
 <form onSubmit={submitAdjust} className="p-6 space-y-6">
 <div>
 <label className="text-xs font-bold text-slate-800 uppercase mb-2 block">Loại điều chỉnh</label>
 <select 
 value={adjustType}
 onChange={(e) => setAdjustType(e.target.value as any)}
 className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
 >
 <option value="wallet">Ví Điện Tử (VNĐ)</option>
 <option value="points">Điểm Thưởng (Points)</option>
 </select>
 </div>
 <div>
 <div className="flex justify-between items-center mb-1.5">
 <label className="text-xs font-bold text-slate-800 uppercase">Số dư hiện tại</label>
 </div>
 <div className="text-xl font-bold text-slate-900">
 {adjustType === 'wallet' ? formatCurrency(adjustingCustomer.walletBalance || 0) : (adjustingCustomer.points || 0) + ' pts'}
 </div>
 </div>
 <div>
 <div className="flex justify-between items-center mb-1.5">
 <label className="text-xs font-bold text-slate-800 uppercase">Số tiền/điểm cộng hoặc trừ</label>
 </div>
 <input 
 type="number" 
 required
 value={adjustAmount}
 onChange={(e) => setAdjustAmount(e.target.value)}
 placeholder="VD: 500000 (cộng) hoặc -1000 (trừ)"
 className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono" 
 />
 <p className="text-[11px] text-slate-600 mt-2">Dùng số âm để trừ điểm/tiền. Viết liền không khoảng trắng.</p>
 {adjustType === 'wallet' && Number(adjustAmount) > 0 && (
   <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-center font-sans mt-4">
     <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-2">Quét mã chuyển khoản VietQR Nạp tiền Ví</p>
     <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
       <div className="bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm shrink-0">
         <img
           src={`https://api.vietqr.io/image/970415-1020088998-qr_only.jpg?amount=${adjustAmount}&addInfo=VCOMM_DEP_${adjustingCustomer.id}`}
           alt="VietQR Deposit Code"
           className="w-32 h-32 object-contain mx-auto"
         />
       </div>
       <div className="text-left space-y-1 text-[11px]">
         <p className="text-slate-700">Ngân hàng: <strong>VietinBank</strong></p>
         <p className="text-slate-700">Số tài khoản: <strong>1020088998</strong></p>
         <p className="text-slate-700">Số tiền: <strong className="text-emerald-700">{formatCurrency(Number(adjustAmount))}</strong></p>
         <p className="text-slate-700">Nội dung: <strong className="font-mono text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded border border-emerald-200 font-bold">VCOMM_DEP_{adjustingCustomer.id}</strong></p>
       </div>
     </div>
   </div>
 )}
 </div>
 <div className="flex gap-4 pt-4 border-t border-slate-200">
 <button 
 type="button"
 onClick={() => setAdjustingCustomer(null)}
 className="flex-1 py-2.5 bg-slate-100 text-slate-800 rounded-lg font-bold text-sm hover:bg-slate-200 transition-all"
 >
 Hủy
 </button>
 <button 
 type="submit"
 className="flex-1 py-2.5 bg-emerald-600 text-[#FAF9F5] rounded-lg font-bold text-sm shadow-sm transition-all hover:bg-emerald-700 hover:shadow-sm"
 >
 Xác nhận
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 </div>
 );
}
