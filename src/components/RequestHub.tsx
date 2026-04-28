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
  Zap
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

  // Filters State
  const [searchReqQuery, setSearchReqQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [requesterFilter, setRequesterFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');

  const filteredRequests = requests.filter(doc => {
    const matchesTab = activeTab === 'all' || doc.type === activeTab;
    const matchesSearch = doc.title.toLowerCase().includes(searchReqQuery.toLowerCase()) || doc.id.toLowerCase().includes(searchReqQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || doc.status === statusFilter;
    const matchesRequester = requesterFilter === 'all' || doc.requester === requesterFilter;
    let matchesDate = true;
    if (dateFilter) {
      const [year, month, day] = dateFilter.split('-');
      const formattedDateFilter = `${day}/${month}/${year}`;
      matchesDate = doc.date === formattedDateFilter;
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
      date: new Date().toLocaleDateString('en-GB')
    };
    
    setRequests([request, ...requests]);
    setShowAddModal(false);
    setNewRequest({ subtype: formConfigs[0]?.name || '', title: '', requester: 'Tôi (Người đang đăng nhập)', formData: {} });
  };

  const [signingRequestId, setSigningRequestId] = useState<string | null>(null);
  const [signatureMethod, setSignatureMethod] = useState<'smart_ca' | 'viettel_ca' | 'usb_token'>('smart_ca');
  const [isSigningInProcess, setIsSigningInProcess] = useState(false);

  const handleStatusChange = (id: string, newStatus: string) => {
    setRequests(requests.map(req => {
      if (req.id === id) {
        const config = formConfigs.find(c => c.name === req.subtype);
        const currentLevel = (req as any).currentLevel || 1;
        const totalLevels = config?.workflow.length || 1;

        if (newStatus === 'approved' && currentLevel < totalLevels) {
          return { ...req, currentLevel: currentLevel + 1, status: 'pending' };
        }
        return { ...req, status: newStatus, currentLevel: currentLevel };
      }
      return req;
    }));
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
              <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
                 <div className="flex flex-wrap items-center gap-3">
                   <div className="relative w-64">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Tìm kiếm phiếu..."
                        value={searchReqQuery}
                        onChange={(e) => setSearchReqQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-sm"
                      />
                   </div>
                   <select
                     value={statusFilter}
                     onChange={(e) => setStatusFilter(e.target.value)}
                     className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm font-medium text-slate-600"
                   >
                     <option value="all">Tất cả trạng thái</option>
                     <option value="pending">Chờ duyệt</option>
                     <option value="approved">Đã duyệt</option>
                     <option value="rejected">Từ chối</option>
                   </select>
                   <select
                     value={requesterFilter}
                     onChange={(e) => setRequesterFilter(e.target.value)}
                     className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm font-medium text-slate-600 max-w-[150px]"
                   >
                     <option value="all">Mọi người tạo</option>
                     {uniqueRequesters.map(req => (
                       <option key={req} value={req}>{req}</option>
                     ))}
                   </select>
                   <div className="relative">
                     <input 
                       type="date"
                       value={dateFilter}
                       onChange={(e) => setDateFilter(e.target.value)}
                       className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-sm font-medium text-slate-600"
                     />
                     {dateFilter && (
                       <button 
                         onClick={() => setDateFilter('')}
                         className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-100 rounded-full p-0.5 text-slate-500 hover:text-slate-700"
                         title="Xóa bộ lọc ngày"
                       >
                         <X className="w-3 h-3" />
                       </button>
                     )}
                   </div>
                 </div>
                 <button className="p-2 text-slate-400 hover:text-slate-600 bg-white border border-slate-200 rounded-lg shadow-sm shrink-0">
                    <RefreshCw className="w-4 h-4" />
                 </button>
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
                       {filteredRequests.map(doc => (
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
                               </div>
                            </td>
                         </tr>
                       ))}
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
                    setEditingFormConfig({ id: `F0${formConfigs.length + 1}`, name: 'Loại phiếu mới', category: 'Khác', isActive: true, workflow: [] });
                    setShowConfigModal(true);
                  }} className="border border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:text-emerald-600 hover:border-emerald-300 transition-colors bg-white">
                    <Plus className="w-6 h-6 mb-2" />
                    <span className="text-sm font-bold">Thêm loại phiếu mới</span>
                  </button>
                </div>
              </div>

              {formConfigs.length > 0 && selectedConfigForWorkflow && (
              <div className="border-t border-slate-100 pt-8">
                <h3 className="text-lg font-bold text-slate-800 mb-2">Thiết lập Luồng phê duyệt (Approval Workflow)</h3>
                <p className="text-sm text-slate-500 mb-4">Mô phỏng cấu hình luồng duyệt mặc định cho một loại phiếu cụ thể.</p>
                
                <div className="bg-white border border-slate-200 rounded-lg p-5">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Cấu hình luồng cho phiếu</label>
                      <select 
                        value={selectedConfigForWorkflow}
                        onChange={(e) => setSelectedConfigForWorkflow(e.target.value)}
                        className="border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 w-64 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        {formConfigs.map(c => (
                           <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
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
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Thêm cấp duyệt
                    </button>
                  </div>

                  <div className="space-y-4">
                    {formConfigs.find(f => f.id === selectedConfigForWorkflow)?.workflow.map((step, idx, arr) => (
                      <React.Fragment key={step.id}>
                        <div className="flex items-start gap-4">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black flex items-center justify-center shrink-0 mt-2">{idx + 1}</div>
                          <div className="flex-1 bg-slate-50 border border-slate-200 p-4 rounded-lg">
                            <h5 className="font-bold text-slate-800 mb-3 text-sm flex justify-between items-center">
                              Cấp duyệt {idx + 1} {idx === 0 && '(Bắt buộc)'}
                              {idx > 0 && (
                                <button onClick={() => {
                                  const updated = [...formConfigs];
                                  const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                  updated[cIdx].workflow = updated[cIdx].workflow.filter(w => w.id !== step.id);
                                  setFormConfigs(updated);
                                }} className="text-xs text-red-500 hover:underline">Xóa cấp duyệt</button>
                              )}
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Quy tắc chọn người duyệt</label>
                                <select 
                                  value={step.ruleType}
                                  onChange={(e) => {
                                    const updated = [...formConfigs];
                                    const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                    const wIdx = updated[cIdx].workflow.findIndex(w => w.id === step.id);
                                    updated[cIdx].workflow[wIdx].ruleType = e.target.value;
                                    setFormConfigs(updated);
                                  }}
                                  className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white"
                                >
                                  <option value="system">Theo hệ thống (Trưởng bộ phận)</option>
                                  <option value="user_select">Người dùng tự chọn khi tạo</option>
                                  <option value="specific">Chỉ định đích danh</option>
                                </select>
                              </div>
                              {step.ruleType === 'specific' ? (
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1">Người duyệt cụ thể</label>
                                  <select 
                                    value={step.specificUser}
                                    onChange={(e) => {
                                      const updated = [...formConfigs];
                                      const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                      const wIdx = updated[cIdx].workflow.findIndex(w => w.id === step.id);
                                      updated[cIdx].workflow[wIdx].specificUser = e.target.value;
                                      setFormConfigs(updated);
                                    }}
                                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white"
                                  >
                                    <option value="">-- Chọn người duyệt --</option>
                                    <option value="Giám đốc Nhân sự">Giám đốc Nhân sự</option>
                                    <option value="Giám đốc Điều hành">Giám đốc Điều hành</option>
                                    <option value="Kế toán trưởng">Kế toán trưởng</option>
                                  </select>
                                </div>
                              ) : (
                                <div>
                                  <label className="block text-xs font-semibold text-slate-500 mb-1">Thời hạn duyệt (SLA)</label>
                                  <select 
                                    value={step.sla}
                                    onChange={(e) => {
                                      const updated = [...formConfigs];
                                      const cIdx = updated.findIndex(f => f.id === selectedConfigForWorkflow);
                                      const wIdx = updated[cIdx].workflow.findIndex(w => w.id === step.id);
                                      updated[cIdx].workflow[wIdx].sla = e.target.value;
                                      setFormConfigs(updated);
                                    }}
                                    className="w-full border border-slate-200 rounded px-2 py-1.5 text-sm bg-white"
                                  >
                                    <option value="24h">24 giờ</option>
                                    <option value="48h">48 giờ</option>
                                    <option value="unlimited">Không giới hạn</option>
                                  </select>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {idx < arr.length - 1 && (
                          <div className="flex justify-center -my-1 text-slate-300 ml-4">
                            <div className="border-l-2 border-dashed border-slate-300 h-6"></div>
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm" onClick={() => alert('Đã lưu cấu hình luồng duyệt')}>Lưu cấu hình luồng duyệt</button>
                  </div>
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
               className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
                  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-4">
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
                                 "p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-2",
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
                     className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                     Hủy bỏ
                  </button>
                  <button 
                     onClick={executeSignature}
                     disabled={isSigningInProcess}
                     className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
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
    </div>
  );
}
