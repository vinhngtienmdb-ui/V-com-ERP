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
  Settings
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Customer } from '../types/erp';
import { generateCustomerCareMessage } from '../services/geminiService';
import { db } from '../lib/firebase';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

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
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailContent, setEmailContent] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);

  const handleGenerateAiMessage = async () => {
    setLoadingAi(true);
    try {
      const msg = await generateCustomerCareMessage(customer);
      // Try to parse a subject if AI returned something like "Subject: ..." or "Tiêu đề: ..."
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

  // Logic for tier progress (Mock)
  const nextTierThreshold = 50000000;
  const progressPercent = Math.min((customer.totalSpent / nextTierThreshold) * 100, 100);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#111827]">Hồ sơ Khách hàng</h2>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase flex items-center gap-1 border border-amber-200">
              <Trophy className="w-3 h-3" /> Hạng Vàng
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-6 h-6 text-slate-400" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="p-6 bg-slate-50 border border-slate-100 rounded-xl text-center">
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold mb-4 mx-auto border-4 border-white shadow-sm">
                  {customer.name.split(' ').pop()?.charAt(0)}
                </div>
                <h3 className="font-bold text-lg text-slate-800">{customer.name}</h3>
                <p className="text-sm text-slate-400 mb-4 font-mono">{customer.id}</p>
                <div className="space-y-2.5 text-sm">
                  <div className="flex items-center gap-2 text-slate-600 bg-white p-2 rounded-lg border border-slate-100"><Mail className="w-4 h-4 text-slate-400" /> <span className="truncate">{customer.email}</span></div>
                  <div className="flex items-center gap-2 text-slate-600 bg-white p-2 rounded-lg border border-slate-100"><Smartphone className="w-4 h-4 text-slate-400" /> {customer.phone}</div>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                 <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-widest">Mục tiêu lên hạng</h4>
                    <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{Math.round(progressPercent)}%</span>
                 </div>
                 <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-2.5 text-center">Tích lũy thêm <span className="font-bold text-slate-600">{formatCurrency(nextTierThreshold - customer.totalSpent)}</span> để lên Kim Cương</p>
              </div>
              
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 shadow-sm">
                <h4 className="font-bold text-xs mb-3 text-blue-800 flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5" /> Chỉ số RFM
                </h4>
                <div className="space-y-2.5">
                  {[
                    { label: 'Recency', score: customer.rfmScore?.recency || 0, desc: 'Độ gần đây' },
                    { label: 'Frequency', score: customer.rfmScore?.frequency || 0, desc: 'Tần suất' },
                    { label: 'Monetary', score: customer.rfmScore?.monetary || 0, desc: 'Giá trị' },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center text-xs">
                      <span className="text-blue-600/70 font-medium">{item.label} <span className="text-[10px] text-blue-400 font-normal">({item.desc})</span></span> 
                      <span className="font-bold text-blue-800 bg-white px-2 py-0.5 rounded shadow-sm border border-blue-50">{item.score}/5</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 shadow-sm">
                <h4 className="font-bold text-xs mb-3 text-emerald-800 flex items-center gap-2">
                  <DollarSign className="w-3.5 h-3.5" /> Tài sản & Thưởng
                </h4>
                <div className="space-y-4">
                  <div className="bg-white p-3 rounded-lg border border-emerald-100/50">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Số dư ví</span>
                      <button className="text-[9px] text-white bg-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-emerald-700">Nạp</button>
                    </div>
                    <span className="text-lg font-bold text-emerald-900 leading-none tracking-tight">{formatCurrency(customer.walletBalance || 0)}</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-100/50">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Điểm Loyalty</span>
                      <button className="text-[9px] text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-emerald-50">Lịch sử</button>
                    </div>
                    <span className="text-lg font-bold text-emerald-900 leading-none tracking-tight">{customer.points || 0} <span className="text-xs font-medium text-emerald-600">pts</span></span>
                  </div>
                </div>
              </div>

            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100 shadow-sm">
              <h4 className="font-bold text-sm mb-3 text-purple-800 flex items-center gap-2"><Users className="w-4 h-4" /> Mạng lưới Affiliate</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] text-purple-500 font-bold uppercase tracking-widest block mb-2">Người giới thiệu (Upline)</span>
                  <div className="flex items-center gap-2 bg-white rounded-md p-2 border border-purple-100">
                    <div className="w-6 h-6 rounded-full bg-purple-100 border border-purple-200 flex flex-shrink-0 items-center justify-center text-purple-700 font-bold text-[10px]">
                      {customer.referrerName ? customer.referrerName.split(' ').pop()?.charAt(0) : '?'}
                    </div>
                    <span className="text-xs font-bold text-purple-900 truncate">{customer.referrerName || 'Không có người giới thiệu'}</span>
                  </div>
                </div>
                <div className="h-px bg-purple-200/50"></div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-purple-500 font-bold uppercase tracking-widest block">Đội nhóm (Downline)</span>
                    <button className="text-[10px] text-purple-600 font-bold uppercase hover:underline bg-white px-2 py-0.5 rounded shadow-sm">Xem chi tiết</button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1,2,3].slice(0, Math.min(customer.downlineCount || 0, 3)).map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex justify-center items-center text-[8px] font-bold text-indigo-600 shadow-sm">U</div>
                      ))}
                      {(customer.downlineCount || 0) > 3 && (
                        <div className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex justify-center items-center text-[8px] font-bold text-gray-600 shadow-sm">+{((customer.downlineCount || 0) - 3)}</div>
                      )}
                      {(customer.downlineCount || 0) === 0 && (
                        <span className="text-xs text-purple-400 italic">Chưa có F1</span>
                      )}
                    </div>
                    {(customer.downlineCount || 0) > 0 && <span className="text-sm font-bold text-purple-900">{customer.downlineCount} <span className="text-xs font-medium text-purple-700">F1 hoạt động</span></span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
            <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-5 border border-slate-100 rounded-xl bg-white shadow-sm group">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">Tổng chi tiêu</p>
                   <p className="text-2xl font-black text-slate-900">{formatCurrency(customer.totalSpent)}</p>
                 </div>
                 <div className="p-5 border border-slate-100 rounded-xl bg-white shadow-sm group">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 group-hover:text-indigo-500 transition-colors">Số đơn hàng</p>
                   <div className="flex items-baseline gap-1">
                     <span className="text-2xl font-black text-slate-900">{customer.orderCount}</span>
                     <span className="text-xs font-bold text-slate-400">đơn</span>
                   </div>
                 </div>
              </div>
              
              <div className="bg-indigo-50/50 border border-indigo-100 p-6 rounded-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 -mr-8 -mt-8 rounded-full opacity-50"></div>
                 <div className="flex justify-between items-center mb-5 relative z-10">
                    <h4 className="font-bold text-indigo-900 flex items-center gap-2">
                       <Sparkles className="w-5 h-5 text-indigo-600" /> CSKH thông minh (AI Assist)
                    </h4>
                    <button 
                      onClick={handleGenerateAiMessage}
                      disabled={loadingAi}
                      className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-md shadow-indigo-100"
                    >
                      {loadingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      QUÉT RFM & SOẠN TIN
                    </button>
                 </div>
                 
                 <div className="bg-white p-4 rounded-xl border border-indigo-100/50 shadow-inner relative z-10 mb-4 focus-within:border-indigo-300 transition-colors">
                   <input 
                      type="text" 
                      placeholder="Tiêu đề email tự động..." 
                      className="w-full border-b border-slate-100 pb-2 mb-2 text-sm focus:outline-none font-bold text-slate-800 placeholder:font-normal placeholder:italic bg-transparent"
                      value={emailSubject}
                      readOnly={loadingAi}
                      onChange={(e) => setEmailSubject(e.target.value)}
                   />
                   <textarea 
                      className="w-full h-32 text-sm resize-none focus:outline-none text-slate-700 placeholder:italic bg-transparent scrollbar-hide"
                      placeholder={loadingAi ? "AI đang phân tích & soạn thảo thảo phù hợp với phân khúc khách hàng..." : "Soạn thảo nội dung hoặc dùng AI soạn nhanh tích hợp dữ liệu CRM..."}
                      value={emailContent}
                      readOnly={loadingAi}
                      onChange={(e) => setEmailContent(e.target.value)}
                   />
                   {loadingAi && (
                     <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">Đang soạn thảo...</span>
                        </div>
                     </div>
                   )}
                 </div>
                 
                 <div className="flex justify-end gap-3 relative z-10">
                    <button 
                       disabled={!emailSubject || !emailContent || loadingAi}
                       className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-bold shadow-lg shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2"
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
                  <h4 className="font-bold flex items-center gap-2 text-slate-800 text-sm">
                    <History className="w-4 h-4 text-indigo-600" /> Hành trình khách hàng
                  </h4>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                    STATUS: <span className="text-indigo-600 uppercase tracking-tighter bg-indigo-50 px-1.5 py-0.5 rounded">Tích cực</span>
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
                        case 'purchase': return 'text-blue-600 bg-blue-100 border-blue-200';
                        case 'consultation': return 'text-purple-600 bg-purple-100 border-purple-200';
                        case 'rma': return 'text-red-600 bg-red-100 border-red-200';
                        default: return 'text-gray-600 bg-gray-100 border-gray-200';
                      }
                    };

                    return (
                      <div key={item.id} className="flex gap-4 relative group">
                        {idx < customer.activities!.length - 1 && (
                          <div className="absolute left-[13px] top-7 w-[1px] h-full bg-gray-200 group-hover:bg-blue-300 transition-colors"></div>
                        )}
                        <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border shadow-sm transition-transform group-hover:scale-110", getColor())}>
                           {getIcon()}
                        </div>
                        <div className="flex-1 bg-white p-3 rounded-lg border border-transparent group-hover:border-blue-100 group-hover:shadow-sm transition-all">
                           <div className="flex items-center justify-between mb-1">
                              <p className="text-xs font-bold text-[#111827]">{item.title}</p>
                              <span className="text-[10px] text-gray-400 font-mono tracking-tighter">{item.date}</span>
                           </div>
                           <p className="text-[11px] text-gray-500 leading-normal">{item.description}</p>
                           <div className="mt-2 flex items-center justify-between">
                              {item.status && (
                                <span className={cn(
                                  "text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-full",
                                  item.status === 'Hoàn thành' ? "text-emerald-600 bg-emerald-50" : "text-gray-400 bg-gray-50"
                                )}>
                                  {item.status}
                                </span>
                              )}
                              <button className="text-[9px] font-bold text-blue-600 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100">
                                 Sự kiện gốc <ExternalLink className="w-2 h-2" />
                              </button>
                           </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-200">
                    <History className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 italic">Chưa có dữ liệu hoạt động cho khách hàng này.</p>
                  </div>
                )}
              </div>
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
      <div className="bg-white rounded-lg p-8 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
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
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
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
              className="flex-1 py-3 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Sao chép nội dung
            </button>
            <button 
              className="flex-1 py-3 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
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

const CustomerConfigModal = ({ onClose }: { onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'tier' | 'points' | 'tags' | 'sources'>('tier');
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Cấu hình Khách hàng (CRM)</h2>
              <p className="text-xs text-slate-500">Quản lý hạng thẻ, phân nhóm và cấu hình thu thập dữ liệu</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex border-b border-slate-200">
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
                activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8 min-h-[300px] bg-slate-50 max-h-[60vh] overflow-y-auto">
          {activeTab === 'tier' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800">Danh sách Hạng thành viên</h3>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                  + Thêm hạng thành viên
                </button>
              </div>
              <div className="space-y-3">
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                       <Trophy className="w-4 h-4 text-slate-400" /> Hạng Bạc (Mặc định)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Chi tiêu từ: 0đ</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-blue-600 font-medium hover:underline">Sửa</button>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                       <Trophy className="w-4 h-4 text-yellow-500" /> Hạng Vàng
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Chi tiêu từ: 10,000,000đ</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-blue-600 font-medium hover:underline">Sửa</button>
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                       <Trophy className="w-4 h-4 text-sky-400" /> Hạng Kim Cương
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">Chi tiêu từ: 50,000,000đ</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs text-blue-600 font-medium hover:underline">Sửa</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'points' && (
            <div className="space-y-6">
               <h3 className="font-bold text-slate-800">Cấu hình Tích điểm & Tiêu điểm</h3>
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-sm text-slate-700 mb-2 border-b border-slate-100 pb-2">Tỉ lệ tích điểm</h4>
                    <div>
                      <label className="text-xs font-bold text-slate-500">Giới hạn thời gian (Tháng)</label>
                      <input type="number" defaultValue={12} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500">Chi tiêu (VNĐ) = Bằng</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input type="number" defaultValue={100000} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                        <span className="text-sm font-bold text-slate-600">=</span>
                        <input type="number" defaultValue={10} className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none placeholder:text-slate-400" />
                        <span className="text-xs text-slate-500">Điểm</span>
                      </div>
                    </div>
                 </div>
                 <div className="space-y-4 bg-white p-5 rounded-lg border border-slate-200">
                    <h4 className="font-bold text-sm text-slate-700 mb-2 border-b border-slate-100 pb-2">Tỉ lệ tiêu điểm (Thanh toán)</h4>
                    <div>
                      <label className="text-xs font-bold text-slate-500">1 Điểm tương đương (VNĐ)</label>
                      <input type="number" defaultValue={100} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500">Tối đa sử dụng / Đơn hàng (%)</label>
                      <input type="number" defaultValue={50} className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                    </div>
                 </div>
               </div>
               <div className="flex justify-end">
                 <button onClick={onClose} className="px-6 py-2.5 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700">Lưu cấu hình</button>
               </div>
            </div>
          )}

          {activeTab === 'tags' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                  <div>
                    <h3 className="font-bold text-slate-800">Thẻ phân loại ưu tiên (VIP, Fraud...)</h3>
                    <p className="text-xs text-slate-500 mt-1">Cấu hình các tag màu để làm nổi bật khách hàng trong hệ thống.</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                    + Thêm thẻ
                  </button>
               </div>
               <div className="space-y-3">
                  <div className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200">#FRAUD / SPAM</span>
                       <p className="text-xs text-slate-500">Khách hàng có lịch sử bom hàng, lừa đảo.</p>
                    </div>
                    <button className="text-xs text-slate-400 hover:text-red-500 font-medium">Xóa</button>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold border border-blue-200">#KOL / INFLUENCER</span>
                       <p className="text-xs text-slate-500">Người có ảnh hưởng, cần chăm sóc đặc biệt.</p>
                    </div>
                    <button className="text-xs text-slate-400 hover:text-red-500 font-medium">Xóa</button>
                  </div>
               </div>
            </div>
          )}
          
          {activeTab === 'sources' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                   <div>
                     <h3 className="font-bold text-slate-800">Cấu hình Nguồn Tracking</h3>
                     <p className="text-xs text-slate-500 mt-1">Đồng bộ dữ liệu khách hàng từ các nền tảng tự động.</p>
                   </div>
                   <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all">
                     + Kết nối Nguồn mới
                   </button>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg border border-emerald-500 bg-emerald-50 relative overflow-hidden group">
                     <h4 className="font-bold text-emerald-900">Landing Page Nệm Foam</h4>
                     <p className="text-xs text-emerald-700 mt-1">Đang hoạt động (Tự động sync qua Webhook)</p>
                     <div className="mt-3 flex items-center justify-between">
                       <span className="text-xs font-bold text-emerald-600 bg-white px-2 py-1 rounded">240 Leads</span>
                       <button className="text-emerald-700 text-[10px] font-bold uppercase hover:underline">Chỉnh sửa</button>
                     </div>
                  </div>
                  <div className="p-4 rounded-lg border border-slate-200 bg-white relative overflow-hidden group">
                     <h4 className="font-bold text-slate-800">Chiến dịch Mùa Hè - Zalo Ads</h4>
                     <p className="text-xs text-slate-500 mt-1">Tạm dừng (Mất kết nối API)</p>
                     <div className="mt-3 flex items-center justify-between">
                       <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">0 Leads</span>
                       <button className="text-blue-600 text-[10px] font-bold uppercase hover:underline">Kết nối lại</button>
                     </div>
                  </div>
                  <div className="p-4 rounded-lg border border-blue-500 bg-blue-50 relative overflow-hidden group">
                     <h4 className="font-bold text-blue-900">Facebook Shop</h4>
                     <p className="text-xs text-blue-700 mt-1">Đang hoạt động (Sync qua Meta Graph API)</p>
                     <div className="mt-3 flex items-center justify-between">
                       <span className="text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded">1,250 Leads</span>
                       <button className="text-blue-700 text-[10px] font-bold uppercase hover:underline">Chỉnh sửa</button>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AddCustomerModal = ({ onClose }: { onClose: () => void }) => {
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
      await addDoc(collection(db, 'customers'), {
        ...formData,
        status: 'active',
        totalSpent: 0,
        orderCount: 0,
        points: 0
      });
      onClose();
    } catch (error) {
      console.error(error);
      alert('Thêm khách hàng thất bại!');
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Thêm Khách hàng mới</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Họ và tên *</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
              placeholder="Nguyễn Văn A"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Số điện thoại *</label>
            <input 
              required
              type="text" 
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
              placeholder="0901234567"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-1 block">Email</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none" 
              placeholder="email@example.com"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-200">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Lưu Khách hàng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export function Customers() {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState<'all' | 'zalo' | 'facebook' | 'web' | 'hotline'>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [aiQuickModalCustomer, setAiQuickModalCustomer] = useState<Customer | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
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

    return { ...c, totalSpent, orderCount, status } as Customer;
  });

  const filteredCustomers = dynamicCustomers.filter(c => {
    const matchesChannel = activeChannel === 'all' || (c.channels && c.channels.includes(activeChannel as any));
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.phone?.includes(searchQuery) || 
                          c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesSearch;
  });

  return (
    <div className="max-w-[1440px] mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden pb-10">
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
      {showConfigModal && (
        <CustomerConfigModal onClose={() => setShowConfigModal(false)} />
      )}
      {showAddModal && (
        <AddCustomerModal onClose={() => setShowAddModal(false)} />
      )}
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">CRM & Marketing Đa kênh</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý khách hàng, lịch sửa mua hàng và tích hợp Omnichannel Chat.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowConfigModal(true)}
            className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            Cấu hình
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            + Thêm Khách hàng
          </button>
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
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Tổng khách hàng</p>
          <div className="text-2xl font-bold text-[#111827]">{dynamicCustomers.length}</div>
          <div className="mt-2 text-[10px] text-[#10B981] font-medium">+5% so với tháng trước</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Active (Hệ thống)</p>
          <div className="text-2xl font-bold text-[#111827]">{dynamicCustomers.filter(c => c.status === 'active').length}</div>
          <div className="mt-2 text-[10px] text-[#6B7280]">Chiếm {dynamicCustomers.length ? ((dynamicCustomers.filter(c => c.status === 'active').length / dynamicCustomers.length) * 100).toFixed(1) : 0}% tổng user</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Chi tiêu TB (CLV)</p>
          <div className="text-2xl font-bold text-[#111827]">{formatCurrency(dynamicCustomers.length ? dynamicCustomers.reduce((acc, c) => acc + (c.totalSpent || 0), 0) / dynamicCustomers.length : 0)}</div>
          <div className="mt-2 text-[10px] text-[#2563EB] font-medium">Đồng bộ từ giao dịch</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-[#E5E7EB] shadow-sm">
          <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Hạng Vàng/Kim Cương</p>
          <div className="text-2xl font-bold text-[#F59E0B]">{dynamicCustomers.filter(c => (c.totalSpent || 0) > 10000000).length}</div>
          <div className="mt-2 text-[10px] text-[#F59E0B] font-medium">Khách hàng trung thành</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
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

        <div className="overflow-x-auto bg-white border-t border-slate-100">
          <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 italic">
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[20%]">Khách hàng</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[18%]">Liên hệ</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[10%]">Kênh</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[15%]">Chi tiêu</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[15%]">Ví / Loyalty</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[12%]">Trạng thái</th>
                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right w-[10%]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center bg-white">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-1" />
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Đang truy xuất dữ liệu CRM...</p>
                  </td>
                </tr>
              ) : filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-indigo-50/30 group transition-all duration-200">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px] shrink-0 border border-indigo-100 group-hover:scale-110 transition-transform">
                          {customer.name?.split(' ').pop()?.charAt(0) || 'U'}
                       </div>
                       <div className="min-w-0">
                          <p onClick={() => setSelectedCustomer(customer)} className="text-sm font-bold text-slate-800 truncate cursor-pointer hover:text-indigo-600 transition-colors uppercase tracking-tight">{customer.name}</p>
                          <p className="text-[9px] text-slate-400 font-mono tracking-tighter">ID: {customer.id.slice(-8).toUpperCase()}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                       <div className="flex items-center justify-between group/copy text-[11px]">
                          <span className="text-slate-600 font-bold tracking-tight">{customer.phone}</span>
                          <CopyButton value={customer.phone} />
                       </div>
                       <div className="flex items-center justify-between group/copy text-[10px]">
                          <span className="text-slate-400 truncate max-w-[120px] italic">{customer.email}</span>
                          <CopyButton value={customer.email} />
                       </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center flex-wrap gap-1">
                       {customer.channels && customer.channels.slice(0, 3).map(channel => (
                         <span key={channel} className="p-1 rounded bg-white border border-slate-100 shadow-sm" title={channel.toUpperCase()}>
                            {channel === 'zalo' && <MessageSquare className="w-3 h-3 text-blue-500" />}
                            {channel === 'facebook' && <Facebook className="w-3 h-3 text-blue-700" />}
                            {channel === 'hotline' && <PhoneCall className="w-3 h-3 text-emerald-600" />}
                            {channel === 'web' && <Globe className="w-3 h-3 text-slate-400" />}
                         </span>
                       ))}
                       {customer.channels && customer.channels.length > 3 && (
                         <span className="text-[8px] font-bold text-slate-400 self-center">+{customer.channels.length - 3}</span>
                       )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="text-sm font-black text-slate-800">{formatCurrency(customer.totalSpent || 0)}</p>
                    <p className="text-[9px] text-slate-400">Đơn hàng: <span className="font-bold text-slate-600">{customer.orderCount || 0}</span></p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <p className="text-sm font-bold text-emerald-600">{formatCurrency(customer.walletBalance || 0)}</p>
                    <p className="text-[9px] font-bold text-amber-600 flex items-center justify-end gap-1"><Trophy className="w-2.5 h-2.5" /> {customer.points || 0} pts</p>
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex justify-center">
                       <span className={cn(
                         "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shadow-sm",
                         customer.status === 'active' ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                       )}>
                         {customer.status === 'active' ? 'ACTIVE' : 'OFF'}
                       </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-2">
                       <button 
                         onClick={() => setAiQuickModalCustomer(customer)}
                         className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                         title="Soạn tin AI nhanh"
                       >
                          <Sparkles className="w-3.5 h-3.5" />
                       </button>
                       <button 
                         onClick={() => setSelectedCustomer(customer)}
                         className="p-1.5 bg-slate-50 text-slate-400 rounded-lg hover:bg-slate-100 hover:text-slate-800 transition-all shadow-sm"
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
      </div>
    </div>
  );
}
