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
  Check
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Customer } from '../types/erp';
import { generateCustomerCareMessage } from '../services/geminiService';
import { db } from '../lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

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
      className="p-1 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-blue-600"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
    </button>
  );
};

const CustomerDetailModal = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => {
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleGenerateAiMessage = async () => {
    setLoadingAi(true);
    try {
      const msg = await generateCustomerCareMessage(customer);
      setAiMessage(msg);
    } finally {
      setLoadingAi(false);
    }
  };

  // Logic for tier progress (Mock)
  const nextTierThreshold = 50000000;
  const progressPercent = Math.min((customer.totalSpent / nextTierThreshold) * 100, 100);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl shadow-xl max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#111827]">Hồ sơ Khách hàng: {customer.name}</h2>
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded-full uppercase flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Hạng Vàng
            </span>
          </div>
          <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-gray-600" /></button>
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl font-bold mb-4 mx-auto border-4 border-white shadow-sm">
                {customer.name.split(' ').pop()?.charAt(0)}
              </div>
              <h3 className="text-center font-bold text-lg">{customer.name}</h3>
              <p className="text-center text-sm text-gray-500 mb-4">{customer.id}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4" /> {customer.email}</div>
                <div className="flex items-center gap-2 text-gray-600"><Smartphone className="w-4 h-4" /> {customer.phone}</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
               <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-xs uppercase text-slate-500">Mục tiêu lên hạng</h4>
                  <span className="text-[10px] font-bold text-blue-600">{Math.round(progressPercent)}%</span>
               </div>
               <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
               </div>
               <p className="text-[10px] text-gray-400 mt-2 text-center">Còn {formatCurrency(nextTierThreshold - customer.totalSpent)} để lên hạng KIm Cương</p>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-xl">
              <h4 className="font-bold text-sm mb-2 text-blue-700">Chỉ số RFM</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-600 font-medium">Recency (Độ gần đây)</span> 
                  <span className="text-sm font-bold text-blue-800">{customer.rfmScore?.recency || 0}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-600 font-medium">Frequency (Tần suất)</span> 
                  <span className="text-sm font-bold text-blue-800">{customer.rfmScore?.frequency || 0}/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-blue-600 font-medium">Monetary (Giá trị)</span> 
                  <span className="text-sm font-bold text-blue-800">{customer.rfmScore?.monetary || 0}/5</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-span-2 space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Tổng chi tiêu</p>
                 <p className="text-xl font-bold text-[#111827]">{formatCurrency(customer.totalSpent)}</p>
               </div>
               <div className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm">
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Số đơn hàng</p>
                 <p className="text-xl font-bold text-[#111827]">{customer.orderCount} đơn</p>
               </div>
            </div>
            
            <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-lg">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" /> Chăm sóc chủ động (AI)
                  </h4>
                  <button 
                    onClick={handleGenerateAiMessage}
                    disabled={loadingAi}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    {loadingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Gợi ý tin nhắn AI
                  </button>
               </div>
               
               <div className="bg-white p-4 rounded-xl border border-indigo-100 min-h-[120px] relative">
                  {loadingAi ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-xl">
                       <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                    </div>
                  ) : aiMessage ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-700 leading-relaxed italic">"{aiMessage}"</p>
                      <div className="flex gap-2">
                        <button className="text-[10px] font-bold text-indigo-600 border border-indigo-200 px-2 py-1 rounded hover:bg-indigo-50">Sao chép</button>
                        <button className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-1 rounded hover:bg-indigo-700">Dùng tin nhắn này</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full py-4">
                       <p className="text-xs text-gray-400 italic">Nhấn nút bên trên để AI soạn nội dung chăm sóc khách hàng cá nhân hóa dựa trên hành vi mua hàng.</p>
                    </div>
                  )}
               </div>
            </div>

            <div>
              <h4 className="font-bold mb-3 flex items-center gap-2 text-[#111827]">
                <History className="w-4 h-4 text-blue-600" /> Dòng thời gian hoạt động
              </h4>
              <div className="bg-gray-50 p-4 rounded-xl space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar">
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
                        case 'purchase': return 'text-blue-600 bg-blue-100';
                        case 'consultation': return 'text-purple-600 bg-purple-100';
                        case 'rma': return 'text-red-600 bg-red-100';
                        default: return 'text-gray-600 bg-gray-100';
                      }
                    };

                    return (
                      <div key={item.id} className="flex gap-4 relative">
                        {idx < customer.activities!.length - 1 && (
                          <div className="absolute left-[13px] top-7 w-[1px] h-6 bg-gray-200"></div>
                        )}
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10", getColor())}>
                           {getIcon()}
                        </div>
                        <div className="flex-1">
                           <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-[#111827]">{item.title}</p>
                              <span className="text-[10px] text-gray-400">{item.date}</span>
                           </div>
                           <p className="text-[11px] text-gray-500 mt-0.5">{item.description}</p>
                           {item.status && (
                             <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                               Trạng thái: {item.status}
                             </span>
                           )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <p className="text-xs text-gray-400 italic">Chưa có hoạt động ghi nhận nào.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AiMessageQuickModal = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => {
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const handleGenerate = async () => {
    setLoadingAi(true);
    try {
      const msg = await generateCustomerCareMessage(customer);
      setAiMessage(msg);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-black text-[#111827]">Chăm sóc AI: {customer.name}</h3>
            <p className="text-xs text-slate-500 font-medium mt-1">Hệ thống sẽ dựa trên RFM & lịch sử mua hàng để soạn tin.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-lg min-h-[180px] flex flex-col items-center justify-center text-center relative mb-6">
          {loadingAi ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-bold text-indigo-600 animate-pulse">Đang phân tích dữ liệu khách hàng...</p>
            </div>
          ) : aiMessage ? (
             <div className="w-full">
                <p className="text-sm text-slate-700 leading-relaxed text-left whitespace-pre-line italic">"{aiMessage}"</p>
             </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Sparkles className="w-10 h-10 text-indigo-300" />
              <button 
                onClick={handleGenerate}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Soạn tin nhắn cá nhân hóa
              </button>
            </div>
          )}
        </div>

        {aiMessage && (
          <div className="flex gap-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(aiMessage);
                alert('Đã copy tin nhắn!');
              }}
              className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Sao chép nội dung
            </button>
            <button 
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
              onClick={() => {
                 alert('Tin nhắn đã được chuyển sang module Omnichannel Chat!');
                 onClose();
              }}
            >
              Dùng tin nhắn này
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export function Customers() {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState<'all' | 'zalo' | 'facebook' | 'web' | 'hotline'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [aiQuickModalCustomer, setAiQuickModalCustomer] = useState<Customer | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    // Fetch customers
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setCustomers(data);
      setLoading(false);
    });

    // Fetch all completed orders to aggregate totalSpent per customer
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setOrders(ordersData.filter(o => o.status === 'completed' && o.customerId));
    });

    return () => {
      unsubCustomers();
      unsubOrders();
    };
  }, []);

  // Compute dynamic fields
  const dynamicCustomers = customers.map(c => {
    const customerOrders = orders.filter(o => o.customerId === c.id);
    const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCount = customerOrders.length;
    
    // Simulate active status based on recent purchase or base status
    // If they have any orders in the system they are active
    const status = (orderCount > 0 || c.status === 'active') ? 'active' : 'inactive';

    return { ...c, totalSpent, orderCount, status, _realOrders: customerOrders } as Customer & { _realOrders: any[] };
  });

  const filteredCustomers = dynamicCustomers.filter(c => {
    const matchesChannel = activeChannel === 'all' || (c.channels && c.channels.includes(activeChannel as any));
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone?.includes(searchQuery) || 
                          c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {selectedCustomer && (
        <CustomerDetailModal 
          customer={selectedCustomer} 
          onClose={() => setSelectedCustomer(null)} 
        />
      )}
      {aiQuickModalCustomer && (
        <AiMessageQuickModal 
          customer={aiQuickModalCustomer} 
          onClose={() => setAiQuickModalCustomer(null)} 
        />
      )}
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">CRM & Marketing Đa kênh</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý khách hàng, lịch sửa mua hàng và tích hợp Omnichannel Chat.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/omnichat')}
            className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <LifeBuoy className="w-4 h-4" />
            Vào Chat Tổng (Omni)
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm">
            Chiến dịch Marketing
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Tổng khách hàng</p>
          <div className="text-2xl font-bold text-[#111827]">{dynamicCustomers.length}</div>
          <div className="mt-2 text-[10px] text-[#10B981] font-medium">+5% so với tháng trước</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Active (Hệ thống)</p>
          <div className="text-2xl font-bold text-[#111827]">{dynamicCustomers.filter(c => c.status === 'active').length}</div>
          <div className="mt-2 text-[10px] text-[#6B7280]">Chiếm {dynamicCustomers.length ? ((dynamicCustomers.filter(c => c.status === 'active').length / dynamicCustomers.length) * 100).toFixed(1) : 0}% tổng user</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Chi tiêu TB (CLV)</p>
          <div className="text-2xl font-bold text-[#111827]">{formatCurrency(dynamicCustomers.length ? dynamicCustomers.reduce((acc, c) => acc + (c.totalSpent || 0), 0) / dynamicCustomers.length : 0)}</div>
          <div className="mt-2 text-[10px] text-[#2563EB] font-medium">Đồng bộ từ giao dịch</div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Hạng Vàng/Kim Cương</p>
          <div className="text-2xl font-bold text-[#F59E0B]">{dynamicCustomers.filter(c => (c.totalSpent || 0) > 10000000).length}</div>
          <div className="mt-2 text-[10px] text-[#F59E0B] font-medium">Khách hàng trung thành</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input 
                type="text" 
                placeholder="Tìm tên, SĐT, Email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
              />
            </div>
            <div className="flex gap-1 bg-white border border-[#E5E7EB] p-1 rounded-lg">
               <button 
                 onClick={() => setActiveChannel('all')}
                 className={cn("p-1.5 rounded-md transition-all", activeChannel === 'all' ? "bg-slate-100 text-[#111827]" : "text-[#9CA3AF]")}
               >
                 <Globe className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setActiveChannel('zalo')}
                 className={cn("p-1.5 rounded-md transition-all", activeChannel === 'zalo' ? "bg-blue-50 text-blue-600" : "text-[#9CA3AF]")}
               >
                 <MessageSquare className="w-4 h-4" />
               </button>
               <button 
                 onClick={() => setActiveChannel('facebook')}
                 className={cn("p-1.5 rounded-md transition-all", activeChannel === 'facebook' ? "bg-blue-600 text-white" : "text-[#9CA3AF]")}
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
          <button className="text-xs font-semibold text-[#2563EB] flex items-center gap-2 hover:underline">
             Xuất tệp CRM <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Khách hàng</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">SĐT & Email</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Kênh</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Lịch sử Mua</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái</th>
                <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F6]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu khách hàng...</p>
                  </td>
                </tr>
              ) : filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-[#F9FAFB] group transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs">
                          {customer.name?.split(' ').pop()?.charAt(0) || 'U'}
                       </div>
                       <div>
                          <p className="text-sm font-semibold text-[#111827]">{customer.name}</p>
                          <p className="text-[10px] text-[#9CA3AF]">ID: {customer.id}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1.5 min-w-[180px]">
                       <div className="flex items-center justify-between group/copy text-xs">
                          <span className="text-slate-600 font-mono tracking-tighter">{customer.phone}</span>
                          <CopyButton value={customer.phone} />
                       </div>
                       <div className="flex items-center justify-between group/copy text-[11px]">
                          <span className="text-slate-400 truncate max-w-[140px] italic">{customer.email}</span>
                          <CopyButton value={customer.email} />
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center flex-wrap gap-1 max-w-[100px] mx-auto">
                       {customer.channels && customer.channels.map(channel => (
                         <span key={channel} className="p-1 rounded bg-slate-50 border border-slate-100" title={channel.toUpperCase()}>
                            {channel === 'zalo' && <MessageSquare className="w-3 h-3 text-blue-500" />}
                            {channel === 'facebook' && <Facebook className="w-3 h-3 text-blue-700" />}
                            {channel === 'hotline' && <PhoneCall className="w-3 h-3 text-emerald-600" />}
                            {channel === 'web' && <Globe className="w-3 h-3 text-slate-400" />}
                         </span>
                       ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-[#111827]">{formatCurrency(customer.totalSpent || 0)}</p>
                    <p className="text-[10px] text-[#6B7280]">Lần cuối: {customer.lastPurchase || 'N/A'} ({customer.orderCount || 0} đơn)</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center flex-col items-center gap-1">
                       <span className={cn(
                         "px-2 py-0.5 rounded-full text-[10px] font-bold",
                         customer.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                       )}>
                         {customer.status === 'active' ? 'HOẠT ĐỘNG' : 'NGỪNG HOẠT ĐỘNG'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <button 
                        onClick={() => setAiQuickModalCustomer(customer)}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md flex items-center gap-1.5 transition-all"
                      >
                         <Sparkles className="w-3 h-3" /> Gửi tin AI
                      </button>
                      <button 
                        onClick={() => setSelectedCustomer(customer)}
                        className="text-[10px] font-bold text-[#6B7280] hover:text-[#111827] px-2 py-1"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
           <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#2563EB]" /> Chat nhanh CSKH
           </h3>
           <div className="space-y-4">
              <div className="flex gap-3 items-start">
                 <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs border border-blue-200">Z</div>
                 <div className="bg-[#F3F4F6] p-3 rounded-lg rounded-tl-none max-w-[80%]">
                    <p className="text-xs text-[#111827]">Chào bạn, đơn hàng ORD-2024-003 bao giờ tôi mới nhận được vậy?</p>
                    <span className="text-[9px] text-[#9CA3AF] mt-1 block">Zalo - 2 phút trước</span>
                 </div>
              </div>
              <div className="flex gap-3 items-start flex-row-reverse">
                 <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">A</div>
                 <div className="bg-blue-600 p-3 rounded-lg rounded-tr-none max-w-[80%] text-white">
                    <p className="text-xs">Dạ chaào chị, đơn hàng đang được GHTK giao, dự kiến tối nay sẽ đến ạ.</p>
                    <span className="text-[9px] text-blue-200 mt-1 block text-right">Hệ thống - Vừa xong</span>
                 </div>
              </div>
           </div>
           <div className="mt-4 flex gap-2">
              <input type="text" placeholder="Nhập tin nhắn trả lời..." className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs focus:outline-none" />
              <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-xs font-bold">Gửi</button>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[#E5E7EB] shadow-sm">
           <h3 className="font-semibold text-[#111827] mb-4 flex items-center gap-2">
              <History className="w-4 h-4 text-[#2563EB]" /> Log Tổng đài ảo (V-Call)
           </h3>
           <div className="space-y-3">
              {[
                { time: '14:20', duration: '02:45', status: 'missed', caller: '090...567' },
                { time: '10:15', duration: '08:12', status: 'completed', caller: '098...321' },
                { time: '09:05', duration: '01:20', status: 'completed', caller: '091...789' }
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-100 transition-all">
                  <div className="flex items-center gap-3">
                     <div className={cn("p-1.5 rounded-full", log.status === 'completed' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600")}>
                        <PhoneCall className="w-3 h-3" />
                     </div>
                     <div>
                        <p className="text-xs font-semibold text-[#111827]">{log.caller}</p>
                        <p className="text-[9px] text-[#9CA3AF] uppercase">Hotline - {log.time}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] font-mono text-[#6B7280]">{log.duration}</p>
                     <span className={cn("text-[9px] font-bold", log.status === 'completed' ? "text-emerald-500" : "text-red-500")}>
                        {log.status === 'completed' ? 'THÀNH CÔNG' : 'GỌI NHỠ'}
                     </span>
                  </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
