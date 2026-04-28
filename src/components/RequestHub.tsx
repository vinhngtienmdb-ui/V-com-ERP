import React, { useState } from 'react';
import { 
  FileText, 
  Send, 
  Inbox, 
  Settings, 
  Search, 
  Plus,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSignature,
  DollarSign,
  Coffee,
  Briefcase,
  UserPlus,
  PenTool,
  X,
  FileEdit,
  ShieldCheck,
  Zap,
  Printer,
  ChevronRight,
  Layout
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const INITIAL_REQUESTS = [
  { id: 'REQ-001', type: 'admin', subtype: 'Nghỉ phép', title: 'Xin nghỉ phép thường niên', requester: 'Lê Hoàng Minh', status: 'pending', date: '25/03/2024' },
  { id: 'REQ-002', type: 'finance', subtype: 'Tạm ứng', title: 'Tạm ứng công tác phí', requester: 'Nguyễn Diệu Nhi', status: 'approved', signatureStatus: 'signed', date: '24/03/2024' },
  { id: 'REQ-003', type: 'other', subtype: 'Tuyển dụng', title: 'Đề nghị tuyển dụng Marketing', requester: 'Trần B', status: 'rejected', date: '23/03/2024' },
];

const INITIAL_FORM_CONFIGS = [
  { id: 'F01', name: 'Đơn xin nghỉ phép', category: 'Hành chính', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }, { id: 2, ruleType: 'specific', sla: '48h', specificUser: 'Giám đốc Nhân sự' }], fields: [{id: 'f1', label: 'Từ ngày', type: 'date', required: true}, {id: 'f2', label: 'Đến ngày', type: 'date', required: true}, {id: 'f3', label: 'Loại phép', type: 'select', options: ['Phép năm', 'Phép không lương', 'Nghỉ ốm'], required: true}] },
  { id: 'F02', name: 'Đăng ký OT', category: 'Hành chính', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }], fields: [{id: 'f1', label: 'Ngày OT', type: 'date', required: true}, {id: 'f2', label: 'Số giờ', type: 'number', required: true}] },
  { id: 'F03', name: 'Tạm ứng', category: 'Tài chính', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }, { id: 2, ruleType: 'specific', sla: '48h', specificUser: 'Kế toán trưởng' }], fields: [{id: 'f1', label: 'Số tiền (VNĐ)', type: 'number', required: true}, {id: 'f2', label: 'Thông tin tài khoản nhận', type: 'text', required: true}] },
  { id: 'F04', name: 'Thanh toán', category: 'Tài chính', isActive: true, workflow: [{ id: 1, ruleType: 'specific', sla: '48h', specificUser: 'Kế toán trưởng' }], fields: [{id: 'f1', label: 'Số tiền (VNĐ)', type: 'number', required: true}, {id: 'f2', label: 'Thông tin tài khoản nhận', type: 'text', required: true}] },
  { id: 'F05', name: 'Mua sắm', category: 'Khác', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }], fields: [{id: 'f1', label: 'Danh sách mặt hàng', type: 'textarea', required: true}, {id: 'f2', label: 'Kinh phí dự kiến (VNĐ)', type: 'number', required: true}] },
  { id: 'F06', name: 'Tuyển dụng', category: 'Khác', isActive: true, workflow: [{ id: 1, ruleType: 'system', sla: '24h', specificUser: '' }, { id: 2, ruleType: 'specific', sla: '48h', specificUser: 'Giám đốc Nhân sự' }], fields: [{id: 'f1', label: 'Vị trí cần tuyển', type: 'text', required: true}, {id: 'f2', label: 'Số lượng', type: 'number', required: true}, {id: 'f3', label: 'Hạn chót cần offer', type: 'date', required: true}] },
];

export function RequestHub() {
  const [activeTab, setActiveTab] = useState('all');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  
  // Settings State
  const [formConfigs, setFormConfigs] = useState(INITIAL_FORM_CONFIGS);
  const [editingFormConfig, setEditingFormConfig] = useState<any>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedConfigForWorkflow, setSelectedConfigForWorkflow] = useState<string>('F01');

  // Signature State
  const [signingRequestId, setSigningRequestId] = useState<string | null>(null);
  const [signatureMethod, setSignatureMethod] = useState<'smart_ca' | 'viettel_ca' | 'usb_token'>('smart_ca');
  const [isSigningInProcess, setIsSigningInProcess] = useState(false);

  // Printing State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedRequestForPrint, setSelectedRequestForPrint] = useState<any>(null);

  const handleStatusChange = (id: string, newStatus: string) => {
    setRequests(requests.map(req => {
      if (req.id === id) {
        const config = formConfigs.find(c => c.name === req.subtype);
        const currentLevel = (req as any).currentLevel || 1;
        const workflowSteps = config?.workflow || [];
        const totalLevels = workflowSteps.length || 1;
        const approvalLog = (req as any).approvalLog || [];

        if (newStatus === 'approved') {
          // Check if there are more steps
          if (currentLevel < totalLevels) {
            // Move to next level
            return { 
              ...req, 
              currentLevel: currentLevel + 1, 
              status: 'pending',
              approvalLog: [...approvalLog, { 
                level: currentLevel, 
                status: 'approved', 
                by: user?.displayName || 'Cấp duyệt 1', 
                time: new Date().toLocaleString('vi-VN'),
                stepName: `Duyệt cấp ${currentLevel}`
              }]
            };
          } else {
            // Final approval
            return { 
              ...req, 
              status: 'approved',
              approvalLog: [...approvalLog, { 
                level: currentLevel, 
                status: 'approved', 
                by: user?.displayName || 'Director', 
                time: new Date().toLocaleString('vi-VN'),
                stepName: 'Duyệt cấp cuối'
              }]
            };
          }
        } else if (newStatus === 'rejected') {
          return {
            ...req,
            status: 'rejected',
            approvalLog: [...approvalLog, { 
              level: currentLevel, 
              status: 'rejected', 
              by: user?.displayName || 'Manager', 
              time: new Date().toLocaleString('vi-VN'),
              stepName: `Từ chối tại cấp ${currentLevel}`
            }]
          };
        }
        
        return { ...req, status: newStatus };
      }
      return req;
    }));
  };
  const [searchReqQuery, setSearchReqQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requesterFilter, setRequesterFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const clearAllFilters = () => {
    setSearchReqQuery('');
    setStatusFilter('all');
    setRequesterFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const isFiltered = searchReqQuery !== '' || statusFilter !== 'all' || requesterFilter !== 'all' || startDate !== '' || endDate !== '';

  const filteredRequests = requests.filter(doc => {
    const matchesTab = activeTab === 'all' || doc.type === activeTab;
    const matchesSearch = 
      doc.title.toLowerCase().includes(searchReqQuery.toLowerCase()) || 
      doc.id.toLowerCase().includes(searchReqQuery.toLowerCase()) ||
      doc.subtype.toLowerCase().includes(searchReqQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesRequester = requesterFilter === 'all' || doc.requester === requesterFilter;

    // Date Range Logic
    let matchesDate = true;
    if (startDate || endDate) {
      // Helper to parse DD/MM/YYYY to Date object
      const [d, m, y] = doc.date.split('/');
      const docDate = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (docDate < start) matchesDate = false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (docDate > end) matchesDate = false;
      }
    }

    return matchesTab && matchesSearch && matchesStatus && matchesRequester && matchesDate;
  });

  const uniqueRequesters = Array.from(new Set(requests.map(r => r.requester)));

  // Create Request Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRequest, setNewRequest] = useState<any>({ subtype: 'Đơn xin nghỉ phép', title: '', requester: 'Tôi (Người đang đăng nhập)', formData: {} });

  const handleAddRequest = () => {
    if (!newRequest.title) return alert("Vui lòng nhập nội dung đề xuất");
    
    const matchedConfig = formConfigs.find(c => c.name === newRequest.subtype);
    let type = 'other';
    if (matchedConfig?.category === 'Hành chính') type = 'admin';
    if (matchedConfig?.category === 'Tài chính') type = 'finance';
    
    const request = {
      id: `REQ-00${requests.length + 1}`,
      type,
      subtype: newRequest.subtype,
      title: newRequest.title,
      requester: newRequest.requester,
      status: 'pending',
      date: new Date().toLocaleDateString('en-GB'),
      currentLevel: 1,
      approvalLog: [],
      formData: newRequest.formData
    };
    
    setRequests([request, ...requests]);
    setShowAddModal(false);
    setNewRequest({ subtype: formConfigs[0]?.name || '', title: '', requester: 'Tôi (Người đang đăng nhập)', formData: {} });
  };

  const executeSignature = async () => {
    setIsSigningInProcess(true);
    // Simulate API call to CA provider
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (signingRequestId) {
      setRequests(requests.map(req => 
        req.id === signingRequestId ? { 
          ...req, 
          signatureStatus: 'signed', 
          status: 'approved',
          signedBy: user?.displayName || 'User',
          signedAt: new Date().toLocaleString('vi-VN'),
          caProvider: signatureMethod.toUpperCase().replace('_', ' ')
        } : req
      ));
    }
    
    setIsSigningInProcess(false);
    setSigningRequestId(null);
    alert("Ký số thành công! Tài liệu đã được gắn dấu thời gian và lưu trữ vào WorkflowHub.");
  };


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Đề xuất, Phê duyệt & Ký số (E-Form)</h1>
          <p className="text-sm text-[#6B7280] mt-1">Cấu hình linh hoạt các loại đề xuất hành chính, tài chính, nhân sự.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/signature')}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2"
          >
            <FileSignature className="w-4 h-4" />
            Trung tâm Ký số
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo đề xuất
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-500" /> Cần tôi duyệt (Pending)</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">{requests.filter(r => r.status === 'pending').length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><Send className="w-4 h-4 text-blue-500" /> Tôi gửi đi</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">{requests.filter(r => r.requester === 'Tôi (Người đang đăng nhập)').length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Đã duyệt (Tháng)</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">{requests.filter(r => r.status === 'approved').length}</p>
        </div>
        <div className="bg-white border border-slate-200 p-6 rounded-lg shadow-sm">
           <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2"><FileSignature className="w-4 h-4 text-purple-500" /> Chờ ký số</h3>
           <p className="text-2xl font-black text-slate-900 mt-2">{requests.filter(r => r.status === 'approved' && r.signatureStatus !== 'signed').length}</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-[240px] shrink-0 space-y-1">
          {[
            { id: 'all', label: 'Tất cả Đề xuất', icon: Inbox },
            { id: 'admin', label: 'Hành chính (Nghỉ phép, OT)', icon: Coffee },
            { id: 'finance', label: 'Tài chính (Tạm ứng, TT)', icon: DollarSign },
            { id: 'other', label: 'Khác (VPP, Tuyển dụng)', icon: UserPlus },
            { id: 'settings', label: 'Cấu hình Form Đề xuất', icon: Settings },
          ].map(tab => (
             <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left",
                  activeTab === tab.id 
                    ? "bg-emerald-50 text-emerald-700 font-bold" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium"
                )}
             >
                <tab.icon className="w-4 h-4" />
                {tab.label}
             </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          {activeTab !== 'settings' ? (
            <>
              <div className="p-4 border-b border-slate-100 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50/80">
                 <div className="flex flex-wrap items-center gap-3 flex-1 w-full">
                   <div className="relative flex-1 min-w-[200px] max-w-sm">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm theo mã, nội dung hoặc loại phiếu..."
                        value={searchReqQuery}
                        onChange={(e) => setSearchReqQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm placeholder:text-slate-400 transition-all"
                      />
                   </div>
                   
                   <div className="flex items-center gap-2">
                     <select
                       value={statusFilter}
                       onChange={(e) => setStatusFilter(e.target.value)}
                       className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm font-medium text-slate-600 cursor-pointer hover:border-slate-300"
                     >
                       <option value="all">Trạng thái (Tất cả)</option>
                       <option value="pending">Chờ duyệt</option>
                       <option value="approved">Đã duyệt</option>
                       <option value="rejected">Từ chối</option>
                     </select>

                     <select
                       value={requesterFilter}
                       onChange={(e) => setRequesterFilter(e.target.value)}
                       className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm font-medium text-slate-600 max-w-[150px] cursor-pointer hover:border-slate-300"
                     >
                       <option value="all">Người tạo (Mọi người)</option>
                       {uniqueRequesters.map(req => (
                         <option key={req} value={req}>{req}</option>
                       ))}
                     </select>
                   </div>

                   <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-sm">
                     <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-slate-400 px-2 border-r border-slate-100">
                       <Clock className="w-3 h-3" /> Từ
                     </div>
                     <input 
                       type="date"
                       value={startDate}
                       onChange={(e) => setStartDate(e.target.value)}
                       className="text-xs bg-transparent focus:outline-none font-bold text-slate-700"
                     />
                     <div className="text-slate-300 mx-1">/</div>
                     <div className="flex items-center gap-1.5 text-[10px] uppercase font-black text-slate-400 px-2 border-r border-slate-100">
                       Đến
                     </div>
                     <input 
                       type="date"
                       value={endDate}
                       onChange={(e) => setEndDate(e.target.value)}
                       className="text-xs bg-transparent focus:outline-none font-bold text-slate-700"
                     />
                   </div>

                   {isFiltered && (
                     <button 
                       onClick={clearAllFilters}
                       className="text-xs font-bold text-rose-500 hover:text-rose-600 px-3 py-2 bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
                     >
                       <X className="w-3 h-3" /> Xóa bộ lọc
                     </button>
                   )}
                 </div>
                 
                 <div className="flex items-center gap-2 shrink-0">
                    <button 
                      onClick={() => {}} // Could trigger a re-fetch if using API
                      className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm transition-all hover:bg-emerald-50 active:scale-95"
                      title="Làm mới"
                    >
                       <RefreshCw className="w-4 h-4" />
                    </button>
                 </div>
              </div>

              <div className="p-0 overflow-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                       <tr>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Loại / Mã phiếu</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nội dung</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Người đề xuất</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center">Trạng thái</th>
                          <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Ngày gửi</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F3F4F6]">
                       {filteredRequests.length > 0 ? filteredRequests.map(doc => (
                         <tr key={doc.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4">
                               <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded inline-block mb-1">{doc.subtype}</span>
                               <p className="text-[10px] text-slate-500 font-bold uppercase">{doc.id}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-sm font-medium text-slate-800">{doc.title}</p>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-sm font-bold text-slate-700">{doc.requester}</p>
                            </td>
                            <td className="px-6 py-4 text-center">
                               <div className="flex flex-col gap-1 items-center">
                                 <span className={cn(
                                   "px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
                                   doc.status === 'approved' ? "bg-emerald-50 text-emerald-600" : 
                                   doc.status === 'pending' ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                                 )}>
                                   {doc.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                                   {doc.status === 'pending' && <Clock className="w-3 h-3" />}
                                   {doc.status === 'rejected' && <AlertCircle className="w-3 h-3" />}
                                   {doc.status === 'approved' ? 'Đã duyệt' : doc.status === 'pending' ? 'Chờ duyệt' : 'Từ chối'}
                                 </span>
                                 {doc.status === 'approved' && (
                                    <span className={cn(
                                       "px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
                                       (doc as any).signatureStatus === 'signed' ? "bg-blue-50 text-blue-600" : "bg-slate-100 text-slate-600"
                                    )}>
                                       <FileSignature className="w-3 h-3" />
                                       {(doc as any).signatureStatus === 'signed' ? 'Đã ký số' : 'Chờ ký số'}
                                    </span>
                                 )}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <div className="flex flex-col items-end gap-2">
                                  <p className="text-sm text-slate-600 font-mono">{doc.date}</p>
                                  {doc.status === 'pending' && (
                                    <div className="flex gap-2 invisible group-hover:visible transition-all">
                                      <button 
                                        onClick={() => handleStatusChange(doc.id, 'approved')}
                                        className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded hover:bg-emerald-100 flex items-center gap-1"
                                      >
                                        <CheckCircle2 className="w-3 h-3" /> Duyệt
                                      </button>
                                      <button 
                                        onClick={() => setSigningRequestId(doc.id)}
                                        className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded hover:bg-blue-100 flex items-center gap-1"
                                      >
                                        <FileSignature className="w-3 h-3" /> Ký & Duyệt
                                      </button>
                                      <button 
                                        onClick={() => handleStatusChange(doc.id, 'rejected')}
                                        className="px-2 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded hover:bg-rose-100 flex items-center gap-1"
                                      >
                                        <X className="w-3 h-3" /> Từ chối
                                      </button>
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => {
                                      setSelectedRequestForPrint(doc);
                                      setShowPrintModal(true);
                                    }}
                                    className="p-1 px-2 text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1 text-[10px] font-bold"
                                  >
                                    <Printer className="w-3.5 h-3.5" /> In phiếu
                                  </button>
                               </div>
                            </td>
                         </tr>
                       )) : (
                         <tr>
                            <td colSpan={5} className="px-6 py-20 text-center">
                               <div className="flex flex-col items-center gap-4">
                                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                                     <Inbox className="w-8 h-8" />
                                  </div>
                                  <div>
                                     <p className="text-lg font-bold text-slate-800">Không tìm thấy phiếu nào</p>
                                     <p className="text-sm text-slate-500">Hãy thử thay đổi từ khóa hoặc bộ lọc của bạn.</p>
                                  </div>
                                  <button 
                                    onClick={clearAllFilters}
                                    className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                                  >
                                    Xóa tất cả bộ lọc
                                  </button>
                               </div>
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
            </>
          ) : (
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Cài đặt Cấu trúc Phiếu (E-Form)</h3>
                <p className="text-sm text-slate-500 mb-4">Tạo và chỉnh sửa các loại phiếu đề xuất để sử dụng trong tổ chức.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {formConfigs.map((item) => (
                    <div key={item.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 relative group">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-slate-800">{item.name}</h4>
                        <div className="flex gap-2 invisible group-hover:visible">
                          <button onClick={() => { setEditingFormConfig(item); setShowConfigModal(true); }} className="text-emerald-600 hover:underline text-xs">Sửa</button>
                          <button onClick={() => {
                            if(window.confirm('Bạn có chắc muốn xóa loại phiếu này?')) {
                                setFormConfigs(formConfigs.filter(f => f.id !== item.id));
                                if (selectedConfigForWorkflow === item.id) {
                                    setSelectedConfigForWorkflow(formConfigs.find(f => f.id !== item.id)?.id || '');
                                }
                            }
                          }} className="text-rose-600 hover:underline text-xs">Xóa</button>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">Nhóm: <span className="font-semibold text-slate-700">{item.category}</span></p>
                      <p className="text-xs text-slate-500">Luồng duyệt: <span className="font-semibold text-indigo-600">{item.workflow.length} cấp</span></p>
                    </div>
                  ))}
                  <button onClick={() => {
                    const nextId = `F${(formConfigs.length + 1).toString().padStart(2, '0')}`;
                    setEditingFormConfig({ id: nextId, name: 'Loại phiếu mới', category: 'Khác', isActive: true, workflow: [], fields: [] });
                    setShowConfigModal(true);
                  }} className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors bg-white">
                    <Plus className="w-6 h-6 mb-2" />
                    <span className="text-sm font-bold">Thêm loại phiếu mới</span>
                  </button>
                </div>
              </div>

              {formConfigs.length > 0 && selectedConfigForWorkflow && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-sm">
                  <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                          <Layout className="w-6 h-6" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cấu hình luồng cho phiếu</label>
                          <select 
                            value={selectedConfigForWorkflow}
                            onChange={(e) => setSelectedConfigForWorkflow(e.target.value)}
                            className="text-lg font-black text-slate-900 bg-transparent focus:outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                          >
                            {formConfigs.map(c => (
                               <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                       </div>
                    </div>
                    <button 
                      onClick={() => {
                        const updated = [...formConfigs];
                        const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                        if(cIdx > -1) {
                           updated[cIdx].workflow.push({ id: Date.now(), ruleType: 'system', sla: '24h', specificUser: '' });
                           setFormConfigs(updated);
                        }
                      }}
                      className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-sm active:scale-95"
                    >
                      <Plus className="w-4 h-4 text-emerald-600" /> Chèn bước duyệt mới
                    </button>
                  </div>

                  <div className="space-y-6 relative">
                    {/* Vertical line through steps */}
                    <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-200" />

                    {formConfigs.find(f => f.id === selectedConfigForWorkflow)?.workflow.map((step, idx, arr) => (
                      <React.Fragment key={step.id}>
                        <div className="flex items-start gap-6 relative z-10 group">
                          <div className={cn(
                            "w-12 h-12 rounded-lg font-black flex items-center justify-center shrink-0 border-4 transition-all shadow-md",
                            idx === 0 ? "bg-emerald-600 border-white text-white shadow-emerald-100" : "bg-white border-slate-100 text-slate-400 group-hover:border-indigo-100 group-hover:text-indigo-600"
                          )}>
                            {idx + 1}
                          </div>
                          
                          <div className="flex-1 bg-white border border-slate-200 p-5 rounded-lg shadow-sm group-hover:shadow-md transition-all group-hover:border-indigo-200">
                            <div className="flex justify-between items-center mb-4">
                               <div className="flex items-center gap-2">
                                  <h5 className="font-black text-slate-800 text-sm uppercase tracking-tight">Bước {idx + 1}: {idx === 0 ? 'Phê duyệt cấp cơ sở' : 'Phê duyệt cấp cao'}</h5>
                                  {idx === 0 && <span className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-500 rounded uppercase">Bắt buộc</span>}
                               </div>
                               {idx > 0 && (
                                 <button onClick={() => {
                                   const updated = [...formConfigs];
                                   const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                   updated[cIdx].workflow = updated[cIdx].workflow.filter(w => w.id !== step.id);
                                   setFormConfigs(updated);
                                 }} className="p-1 px-2 text-rose-500 hover:bg-rose-50 rounded text-[10px] font-bold flex items-center gap-1 transition-colors">
                                   <X className="w-3 h-3" /> Gỡ bỏ bước này
                                 </button>
                               )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Phương thức xác thực</label>
                                <select 
                                  value={step.ruleType}
                                  onChange={(e) => {
                                    const updated = [...formConfigs];
                                    const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                    const wIdx = updated[cIdx].workflow.findIndex(w => w.id === step.id);
                                    updated[cIdx].workflow[wIdx].ruleType = e.target.value;
                                    setFormConfigs(updated);
                                  }}
                                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-inner"
                                >
                                  <option value="system">🏢 Trưởng bộ phận (System-Auto)</option>
                                  <option value="user_select">👤 Người dùng chọn thủ công</option>
                                  <option value="specific">🎯 Chỉ định thành viên cố định</option>
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                {step.ruleType === 'specific' ? (
                                  <>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Thành viên phê duyệt</label>
                                    <select 
                                      value={step.specificUser}
                                      onChange={(e) => {
                                        const updated = [...formConfigs];
                                        const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                        const wIdx = updated[cIdx].workflow.findIndex(w => w.id === step.id);
                                        updated[cIdx].workflow[wIdx].specificUser = e.target.value;
                                        setFormConfigs(updated);
                                      }}
                                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-indigo-50/50 font-bold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner border-indigo-100"
                                    >
                                      <option value="">-- Chọn thành viên --</option>
                                      <option value="Giám đốc Nhân sự">Lê Thị Tuyết (HR Director)</option>
                                      <option value="Giám đốc Điều hành">Nguyễn Văn An (CEO)</option>
                                      <option value="Kế toán trưởng">Trần Thị Bích (CFO)</option>
                                    </select>
                                  </>
                                ) : (
                                  <>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời hạn xác thực (SLA)</label>
                                    <select 
                                      value={step.sla}
                                      onChange={(e) => {
                                        const updated = [...formConfigs];
                                        const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                        const wIdx = updated[cIdx].workflow.findIndex(w => w.id === step.id);
                                        updated[cIdx].workflow[wIdx].sla = e.target.value;
                                        setFormConfigs(updated);
                                      }}
                                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                                    >
                                      <option value="24h">⏱️ Trong vòng 24h</option>
                                      <option value="48h">⏱️ Trong vòng 48h</option>
                                      <option value="unlimited">♾️ Không giới hạn thời gian</option>
                                    </select>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}

                    {/* Step Terminator */}
                    <div className="flex items-center gap-6 relative z-10 px-2 opacity-50">
                       <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center mx-2 text-slate-500">
                          <CheckCircle2 className="w-4 h-4" />
                       </div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Phiếu được hoàn tất và lưu trữ vào WorkflowHub</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end">
                     <button 
                       onClick={() => alert('Đã lưu cấu hình luồng duyệt thành công!')}
                       className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"
                     >
                        LƯU CẤU HÌNH LUỒNG DUYỆT
                     </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">Tạo đề xuất mới</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Loại đề xuất</label>
                <select 
                  value={newRequest.subtype}
                  onChange={(e) => setNewRequest({...newRequest, subtype: e.target.value, formData: {} })}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {Array.from(new Set(formConfigs.map(c => c.category))).map(cat => (
                    <optgroup key={cat} label={cat}>
                      {formConfigs.filter(c => c.category === cat).map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Lý do / Nội dung chung</label>
                <textarea 
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium min-h-[80px]"
                  placeholder="Ví dụ: Nghỉ phép 2 ngày đi du lịch gia đình..."
                />
              </div>

              {/* Dynamic Fields */}
              <div className="pt-2 border-t border-slate-100 mt-2">
                 <div className="grid grid-cols-2 gap-4">
                    {formConfigs.find(c => c.name === newRequest.subtype)?.fields?.map(field => (
                       <div key={field.id} className={cn(field.type === 'textarea' ? "col-span-2" : "")}>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                             {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          {field.type === 'textarea' ? (
                             <textarea 
                               className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                               required={field.required}
                               value={newRequest.formData[field.id] || ''}
                               onChange={(e) => setNewRequest({...newRequest, formData: {...newRequest.formData, [field.id]: e.target.value}})}
                             />
                          ) : field.type === 'select' ? (
                             <select
                               className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                               required={field.required}
                               value={newRequest.formData[field.id] || ''}
                               onChange={(e) => setNewRequest({...newRequest, formData: {...newRequest.formData, [field.id]: e.target.value}})}
                             >
                               <option value="">-- Chọn --</option>
                               {field.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                             </select>
                          ) : (
                             <input 
                               type={field.type} 
                               className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                               required={field.required}
                               value={newRequest.formData[field.id] || ''}
                               onChange={(e) => setNewRequest({...newRequest, formData: {...newRequest.formData, [field.id]: e.target.value}})}
                             />
                          )}
                       </div>
                    ))}
                 </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
              <button onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-sm">
                Hủy
              </button>
              <button 
                onClick={handleAddRequest}
                className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/30">
                Gửi đề xuất
              </button>
            </div>
          </div>
        </div>
      )}
      {showConfigModal && editingFormConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">{editingFormConfig.name === 'Loại phiếu mới' ? 'Thêm Loại Phiếu Mới' : 'Sửa Thông Tin Phiếu'}</h3>
              <button onClick={() => setShowConfigModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[80vh] flex flex-col md:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <h4 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2">Thông tin chung</h4>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tên phiếu</label>
                  <input 
                    type="text" 
                    value={editingFormConfig.name}
                    onChange={(e) => setEditingFormConfig({...editingFormConfig, name: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    placeholder="Ví dụ: Đơn xin nghỉ phép"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nhóm / Phân loại</label>
                  <select 
                    value={editingFormConfig.category}
                    onChange={(e) => setEditingFormConfig({...editingFormConfig, category: e.target.value})}
                    className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  >
                    <option value="Hành chính">Hành chính</option>
                    <option value="Tài chính">Tài chính</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div className="flex-1 space-y-4">
                 <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h4 className="font-bold text-slate-700 text-sm">Cấu hình E-Form</h4>
                    <button 
                      onClick={() => {
                         const newField = { id: `f${Date.now()}`, label: 'Trường mới', type: 'text', required: false };
                         setEditingFormConfig({...editingFormConfig, fields: [...(editingFormConfig.fields || []), newField]});
                      }}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-2 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Thêm trường
                    </button>
                 </div>
                 <div className="space-y-3">
                     {(editingFormConfig.fields || []).map((field: any, idx: number) => (
                        <div key={field.id} className="bg-slate-50 border border-slate-200 p-3 rounded-lg relative group">
                          <button 
                            onClick={() => {
                               setEditingFormConfig({
                                 ...editingFormConfig,
                                 fields: editingFormConfig.fields.filter((f: any) => f.id !== field.id)
                               })
                            }}
                            className="absolute -top-2 -right-2 bg-rose-100 text-rose-600 rounded-full w-5 h-5 flex items-center justify-center invisible group-hover:visible shadow-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <div className="grid grid-cols-2 gap-2 mb-2">
                             <input 
                               type="text" 
                               value={field.label} 
                               onChange={(e) => {
                                 const updated = [...editingFormConfig.fields];
                                 updated[idx].label = e.target.value;
                                 setEditingFormConfig({...editingFormConfig, fields: updated});
                               }}
                               className="border border-slate-200 text-xs px-2 py-1.5 rounded bg-white w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                               placeholder="Tên trường (Label)" 
                             />
                             <select 
                               value={field.type}
                               onChange={(e) => {
                                 const updated = [...editingFormConfig.fields];
                                 updated[idx].type = e.target.value;
                                 setEditingFormConfig({...editingFormConfig, fields: updated});
                               }}
                               className="border border-slate-200 text-xs px-2 py-1.5 rounded bg-white w-full focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                             >
                               <option value="text">Văn bản ngắn</option>
                               <option value="textarea">Văn bản dài</option>
                               <option value="number">Số</option>
                               <option value="date">Ngày tháng</option>
                               <option value="select">Lựa chọn (Dropdown)</option>
                             </select>
                          </div>
                          {field.type === 'select' && (
                             <input 
                                type="text"
                                value={field.options?.join(', ') || ''}
                                onChange={(e) => {
                                   const updated = [...editingFormConfig.fields];
                                   updated[idx].options = e.target.value.split(',').map(s => s.trim());
                                   setEditingFormConfig({...editingFormConfig, fields: updated});
                                }}
                                className="border border-slate-200 text-xs px-2 py-1.5 rounded bg-white w-full mb-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="Tùy chọn (ngăn cách bằng dấu phẩy)"
                             />
                          )}
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer w-fit">
                             <input 
                                type="checkbox" 
                                checked={field.required}
                                onChange={(e) => {
                                   const updated = [...editingFormConfig.fields];
                                   updated[idx].required = e.target.checked;
                                   setEditingFormConfig({...editingFormConfig, fields: updated});
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                             /> Bắt buộc nhập
                          </label>
                        </div>
                     ))}
                     {(!editingFormConfig.fields || editingFormConfig.fields.length === 0) && (
                        <div className="border border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 bg-white">
                           <FileEdit className="w-6 h-6 mb-2 text-slate-300" />
                           <p className="text-sm font-medium">Chưa có trường dữ liệu nào.</p>
                           <p className="text-xs">Bấm "Thêm trường" để cấu hình.</p>
                        </div>
                     )}
                 </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
              <button onClick={() => setShowConfigModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-sm">
                Hủy
              </button>
              <button 
                onClick={() => {
                  const exists = formConfigs.find(f => f.id === editingFormConfig.id);
                  if (exists) {
                     setFormConfigs(formConfigs.map(f => f.id === editingFormConfig.id ? editingFormConfig : f));
                  } else {
                     setFormConfigs([...formConfigs, editingFormConfig]);
                  }
                  setShowConfigModal(false);
                }}
                className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/30">
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Digital Signature Modal */}
      <AnimatePresence>
        {signingRequestId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
            <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95, y: 20 }}
               className="bg-white rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                        <FileSignature className="w-5 h-5" />
                     </div>
                     <div>
                        <h3 className="font-bold text-lg text-slate-900">Xác thực Chữ ký số</h3>
                        <p className="text-xs text-slate-500 font-medium">Bảo mật bởi chuẩn mã hóa AES-256</p>
                     </div>
                  </div>
                  <button onClick={() => setSigningRequestId(null)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200">
                     <X className="w-5 h-5 text-slate-400" />
                  </button>
               </div>

               <div className="flex-1 overflow-y-auto p-8 space-y-8">
                  {/* Document Preview */}
                  <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 space-y-4">
                     <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tài liệu phê duyệt</span>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[10px] font-bold rounded">Hash: 8A2F...3B9C</span>
                     </div>
                     <div className="space-y-3">
                        <h4 className="text-xl font-black text-slate-900">{requests.find(r => r.id === signingRequestId)?.title}</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                           <div>
                              <p className="text-slate-400 mb-1">Loại chứng từ:</p>
                              <p className="font-bold text-slate-700">{requests.find(r => r.id === signingRequestId)?.subtype}</p>
                           </div>
                           <div>
                              <p className="text-slate-400 mb-1">Người đề xuất:</p>
                              <p className="font-bold text-slate-700">{requests.find(r => r.id === signingRequestId)?.requester}</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* CA Selection */}
                  <div className="space-y-4">
                     <label className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600" /> Chọn Nhà cung cấp Chứng thực (CA)
                     </label>
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {[
                           { id: 'smart_ca', label: 'VNPT SmartCA', desc: 'Remote Signing', color: 'blue' },
                           { id: 'viettel_ca', label: 'Viettel-CA', desc: 'Cloud Token', color: 'rose' },
                           { id: 'usb_token', label: 'USB Token', desc: 'Ký bằng thiết bị vật lý', color: 'slate' }
                        ].map((ca) => (
                           <div 
                              key={ca.id}
                              onClick={() => setSignatureMethod(ca.id as any)}
                              className={cn(
                                 "p-4 rounded-lg border-2 cursor-pointer transition-all flex flex-col gap-2",
                                 signatureMethod === ca.id ? "bg-blue-50 border-blue-600 ring-2 ring-blue-100" : "bg-white border-slate-100 hover:border-slate-300"
                              )}
                           >
                              <div className="flex justify-between items-center">
                                 <h5 className="font-bold text-sm text-slate-900">{ca.label}</h5>
                                 <div className={cn("w-3 h-3 rounded-full border-2", signatureMethod === ca.id ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300")} />
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium">{ca.desc}</p>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex items-start gap-4">
                     <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Clock className="w-4 h-4" />
                     </div>
                     <p className="text-[10px] text-amber-700 leading-relaxed font-medium">Hệ thống sẽ chuyển hướng hoặc gửi thông báo (OTP/Push Notification) về thiết bị đã đăng ký với {signatureMethod.replace('_', ' ').toUpperCase()}. Vui lòng không đóng trang này.</p>
                  </div>
               </div>

               <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4 mt-auto">
                  <button 
                     onClick={() => setSigningRequestId(null)}
                     disabled={isSigningInProcess}
                     className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-lg font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                     Hủy bỏ
                  </button>
                  <button 
                     onClick={executeSignature}
                     disabled={isSigningInProcess}
                     className="flex-[2] py-4 bg-blue-600 text-white rounded-lg font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                     {isSigningInProcess ? (
                        <>
                           <RefreshCw className="w-5 h-5 animate-spin" /> Đang kết nối CA...
                        </>
                     ) : (
                        <>
                           XÁC NHẬN KÝ SỐ <Zap className="w-5 h-5" />
                        </>
                     )}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Print PDF / A4 Modal */}
      <AnimatePresence>
        {showPrintModal && selectedRequestForPrint && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
             <motion.div 
               initial={{ opacity: 0, y: 50 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: 50 }}
               className="bg-white rounded-none shadow-2xl w-[210mm] min-h-[297mm] mx-auto p-[20mm] relative"
               id="a4-print-document"
             >
                {/* Print Control Overlay (Visible only on UI, hidden in Print) */}
                <div className="absolute top-4 -right-16 flex flex-col gap-2 print:hidden">
                   <button 
                     onClick={() => window.print()}
                     className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                     title="In ngay"
                   >
                      <Printer className="w-5 h-5" />
                   </button>
                   <button 
                     onClick={() => setShowPrintModal(false)}
                     className="p-3 bg-white text-slate-600 rounded-full shadow-lg border border-slate-200 hover:scale-110 transition-transform"
                   >
                      <X className="w-5 h-5" />
                   </button>
                </div>

                {/* A4 Content */}
                <div className="flex flex-col h-full border-[3px] border-slate-900 p-8">
                   <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                      <div className="flex items-center gap-4">
                         <div className="w-16 h-16 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-2xl tracking-tighter">OS</div>
                         <div>
                            <h2 className="text-xl font-black uppercase tracking-tighter">Omni-System Enterprise</h2>
                            <p className="text-[10px] font-bold text-slate-500 italic">Hệ thống Quản trị Doanh nghiệp Toàn diện</p>
                            <p className="text-[10px] text-slate-400">Số 102, Tòa nhà TechHub, Quận 1, TP. HCM</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 underline underline-offset-8">PHIẾU ĐỀ XUẤT</h1>
                         <p className="text-xs font-bold text-slate-700 mt-4 italic">Số: {selectedRequestForPrint.id}</p>
                         <p className="text-xs font-bold text-slate-700">Ngày tạo: {selectedRequestForPrint.date}</p>
                      </div>
                   </div>

                   <div className="flex-1 space-y-8">
                      <div className="bg-slate-50 p-6 rounded-none border border-slate-200">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <FileText className="w-4 h-4" /> THÔNG TIN ĐỀ XUẤT
                         </h3>
                         <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                            <div className="border-b border-slate-200 pb-1">
                               <p className="text-[10px] font-bold text-slate-500 uppercase">Người đề xuất</p>
                               <p className="text-sm font-black text-slate-900">{selectedRequestForPrint.requester}</p>
                            </div>
                            <div className="border-b border-slate-200 pb-1">
                               <p className="text-[10px] font-bold text-slate-500 uppercase">Loại phiếu</p>
                               <p className="text-sm font-black text-slate-900">{selectedRequestForPrint.subtype}</p>
                            </div>
                            <div className="col-span-2 border-b border-slate-200 pb-1">
                               <p className="text-[10px] font-bold text-slate-500 uppercase">Nội dung / Lý do</p>
                               <p className="text-sm font-black text-slate-900">{selectedRequestForPrint.title}</p>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                         <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
                           <Layout className="w-4 h-4" /> DỮ LIỆU CHI TIẾT
                         </h3>
                         <table className="w-full border-2 border-slate-900">
                            <thead>
                               <tr className="bg-slate-900 text-white">
                                  <th className="px-4 py-2 text-[10px] font-black uppercase text-left border-r border-white/20">Trường thông tin</th>
                                  <th className="px-4 py-2 text-[10px] font-black uppercase text-left">Giá trị</th>
                               </tr>
                            </thead>
                            <tbody>
                               {formConfigs.find(c => c.name === selectedRequestForPrint.subtype)?.fields.map((field: any) => (
                                 <tr key={field.id} className="border-b border-slate-900">
                                    <td className="px-4 py-3 text-xs font-bold text-slate-700 border-r border-slate-900 bg-slate-50">{field.label}</td>
                                    <td className="px-4 py-3 text-xs font-black text-slate-900">
                                       {(selectedRequestForPrint as any).formData?.[field.id] || '---'}
                                    </td>
                                 </tr>
                               ))}
                               {!formConfigs.find(c => c.name === selectedRequestForPrint.subtype)?.fields.length && (
                                  <tr>
                                     <td colSpan={2} className="px-4 py-8 text-center text-xs text-slate-400 italic">Không có dữ liệu chi tiết kèm theo.</td>
                                  </tr>
                               )}
                            </tbody>
                         </table>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 border-t-2 border-slate-900 pt-8 px-4">
                         <div className="flex flex-col items-center gap-3">
                            <p className="text-[10px] font-black text-slate-900 uppercase">NGƯỜI ĐỀ XUẤT</p>
                            <div className="h-24 w-full flex items-center justify-center italic text-slate-400 text-[10px] border border-dashed border-slate-300 bg-slate-50/50 p-2 text-center">
                               (Ký hồ sơ điện tử, <br/>ghi rõ họ tên)
                            </div>
                            <p className="text-[10px] font-bold text-slate-900">{selectedRequestForPrint.requester}</p>
                            <p className="text-[8px] text-slate-400 font-mono">{selectedRequestForPrint.date}</p>
                         </div>
                         
                         {/* Dynamic Approval Logs for N levels */}
                         {(selectedRequestForPrint.approvalLog || []).map((log: any, lIdx: number) => (
                            <div key={lIdx} className="flex flex-col items-center gap-3">
                               <p className="text-[10px] font-black text-slate-900 uppercase text-center">{log.stepName.toUpperCase()}</p>
                               <div className="h-24 w-full flex flex-col items-center justify-center relative border border-slate-300 bg-slate-50/30 p-2">
                                  <div className="text-center">
                                     <div className={cn(
                                       "font-mono text-[9px] border-2 p-1 rotate-[-5deg] tracking-tight font-black uppercase mb-1 px-2 whitespace-nowrap",
                                       log.status === 'approved' ? "text-emerald-700 border-emerald-700" : "text-rose-700 border-rose-700"
                                     )}>
                                        {log.status === 'approved' ? '✓ ĐÃ DUYỆT' : '✗ TỪ CHỐI'}
                                     </div>
                                     <p className="text-[8px] font-bold text-slate-700">{log.by}</p>
                                     <p className="text-[7px] text-slate-500 font-mono italic">{log.time}</p>
                                  </div>
                               </div>
                            </div>
                         ))}

                         {/* Waiting Steps */}
                         {formConfigs.find(c => c.name === selectedRequestForPrint.subtype)?.workflow.slice((selectedRequestForPrint.approvalLog || []).length).map((_: any, sIdx: number) => (
                           <div key={`wait-${sIdx}`} className="flex flex-col items-center gap-3 opacity-40">
                              <p className="text-[10px] font-black text-slate-400 uppercase text-center">Xác thực cấp {(selectedRequestForPrint.approvalLog || []).length + sIdx + 1}</p>
                              <div className="h-24 w-full flex items-center justify-center relative border border-dashed border-slate-200 bg-slate-100">
                                 <span className="text-[8px] font-bold text-slate-400 italic">Đang chờ xử lý...</span>
                              </div>
                           </div>
                         ))}
                         
                         {/* Digital Signature Slot */}
                         <div className="flex flex-col items-center gap-3">
                            <p className="text-[10px] font-black text-slate-900 uppercase">NIÊM PHONG SỐ (CA)</p>
                            <div className="h-24 w-full flex items-center justify-center relative border-2 border-slate-900 bg-slate-50/10">
                               {selectedRequestForPrint.signatureStatus === 'signed' ? (
                                 <div className="relative flex flex-col items-center gap-1 p-2 text-center scale-90">
                                    <div className="text-blue-700 font-black text-[8px] uppercase tracking-tighter border-2 border-blue-700 px-2 py-1 bg-blue-50/50">
                                       CERTIFICATE OK<br/>
                                       <span className="text-[10px] uppercase">{selectedRequestForPrint.signedBy}</span>
                                    </div>
                                    <p className="text-[7px] text-blue-500 font-mono font-bold">{selectedRequestForPrint.signedAt}</p>
                                 </div>
                               ) : (
                                 <div className="text-slate-300 italic text-[9px] text-center px-4 leading-tight">
                                    (Tài liệu chưa được ký số niêm phong)
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                   </div>

                   <div className="mt-20 pt-8 border-t border-slate-200 text-center space-y-1">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-[0.2em]">Tài liệu này được tạo và lưu trữ trên hệ thống Omni-System ERP v2.0</p>
                      <p className="text-[7px] text-slate-300 font-mono">MD5: {Math.random().toString(36).substring(7).toUpperCase()} | Timestamp: {new Date().toISOString()}</p>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
