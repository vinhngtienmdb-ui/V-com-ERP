import React, { useState } from 'react';
import { 
 FileSignature, 
 Key, 
 ShieldCheck, 
 Clock, 
 CheckCircle2, 
 Search, 
 RefreshCw,
 FileText,
 Lock,
 UserCheck,
 Building2
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const INITIAL_SIGNATURES = [
 { id: 'SIGN-001', docId: 'HDLD-001', title: 'Hợp đồng lao động - Nguyễn Văn A', type: 'contract', requestDate: '25/03/2024', status: 'pending', requesters: 'Phòng Nhân sự' },
 { id: 'SIGN-002', docId: 'REQ-002', title: 'Đề nghị tạm ứng công tác phí', type: 'request', requestDate: '24/03/2024', status: 'signed', requesters: 'Nguyễn Diệu Nhi' },
 { id: 'SIGN-003', docId: 'CV-2024-001', title: 'Quyết định bổ nhiệm Giám đốc', type: 'document', requestDate: '20/03/2024', status: 'signed', requesters: 'Hội đồng quản trị' },
 { id: 'SIGN-004', docId: 'HDDV-001', title: 'Hợp đồng tư vấn AI', type: 'contract', requestDate: '01/02/2024', status: 'pending', requesters: 'Phòng Pháp chế' }
];

export function SignatureHub() {
 const [activeTab, setActiveTab] = useState('pending');
 const navigate = useNavigate();
 const [signatures, setSignatures] = useState(INITIAL_SIGNATURES);
 const [signingModalOpen, setSigningModalOpen] = useState(false);
 const [selectedDoc, setSelectedDoc] = useState<any>(null);

 // Filters State
 const [searchSigQuery, setSearchSigQuery] = useState('');
 const [typeFilter, setTypeFilter] = useState('all');
 const [requesterFilter, setRequesterFilter] = useState('all');
 const [dateFilter, setDateFilter] = useState('');

 const filteredSignatures = signatures.filter(doc => {
 const matchesTab = doc.status === activeTab;
 const matchesSearch = doc.title.toLowerCase().includes(searchSigQuery.toLowerCase()) || doc.docId.toLowerCase().includes(searchSigQuery.toLowerCase()) || doc.id.toLowerCase().includes(searchSigQuery.toLowerCase());
 const matchesType = typeFilter === 'all' || doc.type === typeFilter;
 const matchesRequester = requesterFilter === 'all' || doc.requesters === requesterFilter;
 
 let matchesDate = true;
 if (dateFilter) {
 const [year, month, day] = dateFilter.split('-');
 const formattedDateFilter = `${day}/${month}/${year}`;
 matchesDate = doc.requestDate === formattedDateFilter;
 }
 return matchesTab && matchesSearch && matchesType && matchesRequester && matchesDate;
 });

 const uniqueRequesters = Array.from(new Set(signatures.map(s => s.requesters)));

 const handleSign = (doc: any) => {
 setSelectedDoc(doc);
 setSigningModalOpen(true);
 };
 
 const [signatureMethod, setSignatureMethod] = useState<'smart_ca' | 'viettel_ca' | 'usb_token'>('smart_ca');
 const [isSigningInProcess, setIsSigningInProcess] = useState(false);

 const confirmSign = async () => {
 setIsSigningInProcess(true);
 // Simulate CA latency
 await new Promise(resolve => setTimeout(resolve, 2000));
 
 if (selectedDoc) {
 setSignatures(signatures.map(s => s.id === selectedDoc.id ? { ...s, status: 'signed' } : s));
 setSigningModalOpen(false);
 setSelectedDoc(null);
 }
 setIsSigningInProcess(false);
 alert("Ký số thành công!");
 };

 return (
 <div className="space-y-4 animate-in fade-in slide-in- duration-500 pb-4">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900 tracking-tight">Trung tâm Ký số (Digital Signature Hub)</h1>
 <p className="text-xs text-slate-500 mt-1 italic">Hệ thống ký số tập trung, hỗ trợ SmartCA, Viettel-CA và HSM Token.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 hover:bg-slate-50 transition-all flex items-center gap-2">
 <RefreshCw className="w-4 h-4" />
 Làm mới Certs
 </button>
 <button className="bg-[#111827] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all shadow-sm shadow-slate-200 flex items-center gap-2 uppercase tracking-widest">
 <Key className="w-4 h-4 text-emerald-400" />
 Quản lý chứng thư
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
 <div className="group bg-white border border-slate-300 p-6 rounded-lg shadow-sm hover:shadow-sm transition-all relative overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
 <div className="relative z-10">
 <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Chờ tôi ký</h3>
 <p className="text-4xl font-bold text-slate-900">{signatures.filter(s => s.status === 'pending').length}</p>
 <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-amber-600">
 <Clock className="w-3 h-3" /> Cần xử lý gấp
 </div>
 </div>
 </div>
 <div className="group bg-white border border-slate-300 p-6 rounded-lg shadow-sm hover:shadow-sm transition-all relative overflow-hidden">
 <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
 <div className="relative z-10">
 <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Đã hoàn tất</h3>
 <p className="text-4xl font-bold text-slate-900">{signatures.filter(s => s.status === 'signed').length}</p>
 <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-blue-600">
 <CheckCircle2 className="w-3 h-3" /> Lưu trữ an toàn
 </div>
 </div>
 </div>
 <div className="group bg-slate-900 p-6 rounded-lg shadow-sm shadow-slate-200 relative overflow-hidden lg:col-span-2">
 <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-12 -mt-12" />
 <div className="relative z-10 flex justify-between items-center h-full">
 <div>
 <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Chứng thư đang hoạt động</h3>
 <p className="text-xl font-bold text-white">VNPT SmartCA Certificate</p>
 <div className="flex items-center gap-4 mt-3">
 <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
 <ShieldCheck className="w-3 h-3" /> Đang bảo mật (Active)
 </div>
 <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
 <Clock className="w-3 h-3" /> Hết hạn: 15/10/2026
 </div>
 </div>
 </div>
 <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
 <FileSignature className="w-8 h-8 text-white/40" />
 </div>
 </div>
 </div>
 </div>

 <div className="flex gap-6">
 {/* Sidebar */}
 <div className="w-[240px] shrink-0 space-y-1">
 {[
 { id: 'pending', label: 'Chờ tôi ký', icon: Clock },
 { id: 'signed', label: 'Đã ký / Lịch sử', icon: CheckCircle2 },
 { id: 'certificates', label: 'Quản lý Chứng thư số', icon: Key },
 { id: 'permissions', label: 'Phân quyền Ký số', icon: UserCheck },
 { id: 'logs', label: 'Nhật ký hệ thống', icon: Lock },
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all text-left",
 activeTab === tab.id 
 ? "bg-primary-50 text-primary-700 font-bold" 
 : "text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-medium"
 )}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 </button>
 ))}
 </div>

 {/* Content */}
 <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
 {(activeTab === 'pending' || activeTab === 'signed') && (
 <>
 <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50">
 <div className="flex flex-wrap items-center gap-3">
 <div className="relative w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
 <input 
 type="text" 
 placeholder="Tìm kiếm tài liệu..."
 value={searchSigQuery}
 onChange={(e) => setSearchSigQuery(e.target.value)}
 className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 shadow-sm"
 />
 </div>
 <select
 value={typeFilter}
 onChange={(e) => setTypeFilter(e.target.value)}
 className="border border-slate-200 rounded-2xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-sm font-medium text-slate-700"
 >
 <option value="all">Tất cả phân loại</option>
 <option value="contract">Hợp đồng</option>
 <option value="request">Đề xuất E-Form</option>
 <option value="document">Văn bản</option>
 </select>
 <select
 value={requesterFilter}
 onChange={(e) => setRequesterFilter(e.target.value)}
 className="border border-slate-200 rounded-2xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-sm font-medium text-slate-700 max-w-[150px]"
 >
 <option value="all">Mọi người tạo</option>
 {uniqueRequesters.map(req => (
 <option key={req} value={req}>{req}</option>
 ))}
 </select>
 <div className="relative flex-1">
 <input 
 type="date"
 value={dateFilter}
 onChange={(e) => setDateFilter(e.target.value)}
 className="border border-slate-200 rounded-2xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 shadow-sm font-medium text-slate-700 w-full"
 />
 {dateFilter && (
 <button 
 onClick={() => setDateFilter('')}
 className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-100 rounded-full p-0.5 text-slate-600 hover:text-slate-800"
 title="Xóa bộ lọc ngày"
 >
 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
 </svg>
 </button>
 )}
 </div>
 </div>
 <button className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-2xl shadow-sm shrink-0">
 <RefreshCw className="w-4 h-4" />
 </button>
 </div>

 <div className="p-0 overflow-auto">
 <table className="w-full text-left border-collapse">
 <thead className="bg-slate-50 border-b border-slate-100">
 <tr>
 <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Mã trình ký</th>
 <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tài liệu tham chiếu</th>
 <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phân loại</th>
 <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiến trình ký & Phân quyền</th>
 <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Trạng thái</th>
 <th className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ngày</th>
 <th className="px-4 py-3"></th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {filteredSignatures.map(doc => (
 <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-4 py-3">
 <p className="text-[13px] font-bold text-slate-900">{doc.id}</p>
 </td>
 <td className="px-4 py-3">
 <p className="text-[13px] font-medium text-slate-900">{doc.title}</p>
 <p className="text-xs text-slate-600 font-mono mt-0.5">{doc.docId}</p>
 </td>
 <td className="px-4 py-3">
 <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg uppercase tracking-tight">
 {doc.type === 'contract' ? 'Hợp đồng' : doc.type === 'request' ? 'Đề xuất E-Form' : 'Văn bản (NĐ30)'}
 </span>
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-2">
 <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tight w-16">Luồng ký:</p>
 <div className="flex items-center gap-1">
 <div className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded">Người tạo</div>
 <span className="text-slate-500">→</span>
 <div className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded">Quản lý</div>
 <span className="text-slate-500">→</span>
 <div className="px-2 py-0.5 bg-primary-50 text-primary-700 text-[10px] font-bold rounded">Giám đốc</div>
 </div>
 </div>
 <div className="flex -space-x-2 overflow-hidden mt-2">
 {[1, 2, 3].map((idx) => (
 <div key={idx} className={cn(
 "inline-block h-6 w-6 rounded-full ring-2 ring-white bg-slate-100 flex-shrink-0 flex items-center justify-center text-[8px] font-bold",
 idx === 1 ? "bg-emerald-100 text-emerald-700" : (idx === 2 && doc.status === 'signed' ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600")
 )} title={`Bước ${idx}`}>
 {idx === 1 ? <CheckCircle2 className="w-3 h-3" /> : (idx === 2 && doc.status === 'signed' ? <CheckCircle2 className="w-3 h-3" /> : idx)}
 </div>
 ))}
 </div>
 </td>
 <td className="px-4 py-3 text-center">
 <span className={cn(
 "px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
 doc.status === 'signed' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
 )}>
 {doc.status === 'signed' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
 {doc.status === 'signed' ? 'Đã ký số' : 'Chờ ký'}
 </span>
 </td>
 <td className="px-4 py-3">
 <p className="text-xs text-slate-700">{doc.requestDate}</p>
 </td>
 <td className="px-4 py-3 text-right">
 {doc.status === 'pending' && (
 <button 
 onClick={() => handleSign(doc)}
 className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-primary-700 transition-colors flex items-center gap-1.5 ml-auto"
 >
 <Key className="w-3.5 h-3.5" /> Ký ngay
 </button>
 )}
 {doc.status === 'signed' && (
 <button className="px-3 py-1.5 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1.5 ml-auto">
 <FileText className="w-3.5 h-3.5" /> Xem bản ký
 </button>
 )}
 </td>
 </tr>
 ))}
 {signatures.filter(doc => doc.status === activeTab).length === 0 && (
 <tr>
 <td colSpan={7} className="px-6 py-12 text-center text-slate-600 font-medium">
 Không có tài liệu nào trong mục này.
 </td>
 </tr>
 )}
 </tbody>
 </table>
 </div>
 </>
 )}

 {activeTab === 'permissions' && (
 <div className="p-6">
 <div className="mb-6">
 <h3 className="text-lg font-bold text-slate-900">Cấu hình Quy trình Ký số & Phân quyền</h3>
 <p className="text-xs text-slate-600 mt-1">Thiết lập những ai có thẩm quyền ký và thứ tự ký cho từng loại tài liệu trong hệ thống.</p>
 </div>

 <div className="space-y-4">
 {[
 { type: 'Quản lý Hợp đồng (Lao động)', flow: ['Chuyên viên HR', 'Trưởng phòng HR', 'Giám đốc'], methods: ['Ký nháy', 'Ký nháy', 'Ký số SmartCA'] },
 { type: 'Hợp đồng mua bán / Dịch vụ', flow: ['Pháp chế', 'Kế toán trưởng', 'Giám đốc', 'Đối tác'], methods: ['Ký nháy', 'Ký nháy', 'Ký số Token', 'Ký số Tùy chọn'] },
 { type: 'Đề nghị Tạm ứng / Chi tiêu', flow: ['Người đề xuất', 'Quản lý trực tiếp', 'Kế toán trưởng', 'Giám đốc'], methods: ['Xác nhận E-Form', 'Ký nháy', 'Ký nháy', 'Ký số / Chuyển khoản'] }
 ].map((item, idx) => (
 <div key={idx} className="border border-slate-200 rounded-2xl p-5">
 <h4 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
 {item.type}
 <button className="text-xs text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg font-bold hover:bg-primary-100 transition-colors">Chỉnh sửa</button>
 </h4>
 <div className="flex flex-wrap items-start gap-4">
 {item.flow.map((role, rIdx) => (
 <React.Fragment key={rIdx}>
 <div className="flex flex-col items-center bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 w-full">
 <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs mb-2">
 {rIdx + 1}
 </div>
 <p className="text-xs font-bold text-slate-900 text-center">{role}</p>
 <p className="text-[10px] text-slate-600 mt-1 bg-white px-2 rounded-full border border-slate-300">{item.methods[rIdx]}</p>
 </div>
 {rIdx < item.flow.length - 1 && (
 <div className="h-16 flex items-center text-slate-500">
 →
 </div>
 )}
 </React.Fragment>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'certificates' && (
 <div className="p-6">
 <div className="mb-6 flex items-center justify-between">
 <div>
 <h3 className="text-lg font-bold text-slate-900">Quản lý Chứng thư số</h3>
 <p className="text-xs text-slate-600 mt-1">Danh sách chứng thư số, chữ ký điện tử hiện có trên hệ thống.</p>
 </div>
 <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-all shadow-sm flex items-center gap-2">
 <Key className="w-4 h-4" />
 Thêm Chứng thư
 </button>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 {[
 { id: 'CA-001', name: 'Nguyễn Văn A (Giám đốc)', provider: 'SmartCA VNPT', type: 'Cá nhân', expiry: '15/10/2025', status: 'active' },
 { id: 'CA-002', name: 'Công ty Cổ phần VComm ERP', provider: 'Viettel CA', type: 'Doanh nghiệp', expiry: '20/01/2026', status: 'active' },
 { id: 'CA-003', name: 'Trần B (Kế toán)', provider: 'USB Token', type: 'Cá nhân', expiry: '10/05/2024', status: 'expiring_soon' },
 ].map(cert => (
 <div key={cert.id} className="border border-slate-200 rounded-2xl p-5 flex items-start gap-4 hover:border-primary-300 transition-colors bg-white">
 <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-300 flex items-center justify-center shrink-0">
 {cert.type === 'Cá nhân' ? <UserCheck className="w-6 h-6 text-slate-500" /> : <Building2 className="w-6 h-6 text-primary-500" />}
 </div>
 <div className="flex-1">
 <div className="flex items-start justify-between mb-1">
 <h4 className="font-bold text-slate-900">{cert.name}</h4>
 <span className={cn(
 "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
 cert.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-blue-600"
 )}>
 {cert.status === 'active' ? 'Hoạt động' : 'Sắp hết hạn'}
 </span>
 </div>
 <p className="text-xs text-slate-600 mb-3">{cert.provider} • ID: {cert.id}</p>
 <div className="flex items-center justify-between text-xs font-semibold">
 <span className="text-slate-700">Hết hạn: <span className={cert.status === 'expiring_soon' ? 'text-blue-600' : ''}>{cert.expiry}</span></span>
 <button className="text-primary-600 hover:text-primary-800">Cập nhật mật khẩu / PIN</button>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'logs' && (
 <div className="p-0">
 <div className="p-6 border-b border-slate-200 bg-slate-50">
 <h3 className="text-lg font-bold text-slate-900">Nhật ký Hệ thống Ký số</h3>
 <p className="text-xs text-slate-600 mt-1">Lưu trữ lịch sử thao tác, xác thực và ký số trên toàn hệ thống.</p>
 </div>
 <div className="overflow-auto max-h-[500px]">
 <table className="w-full text-left">
 <thead className="bg-slate-50 sticky top-0">
 <tr>
 <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">Thời gian</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">Thao tác</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">Người thực hiện</th>
 <th className="px-4 py-2 text-xs font-bold text-slate-600 uppercase">IP & Thiết bị</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {[
 { time: '10:45 27/04/2026', action: 'Ký số thành công (SmartCA) tài liệu HD-001', user: 'Nguyễn Văn A', ip: '192.168.1.100 (iOS)' },
 { time: '09:20 27/04/2026', action: 'Gia hạn Chứng thư số CA-002', user: 'Admin System', ip: 'Xác thực từ hệ thống' },
 { time: '16:30 26/04/2026', action: 'Ký thất bại (Sai mã PIN USB Token) tài liệu QD-12', user: 'Trần B', ip: '10.0.0.50 (Windows)' },
 { time: '14:15 26/04/2026', action: 'Tạo luồng trình ký mới REQ-99', user: 'Phòng Nhân sự', ip: '192.168.1.155 (Mac OS)' },
 ].map((log, idx) => (
 <tr key={idx} className="hover:bg-slate-50">
 <td className="px-4 py-3 text-xs text-slate-700 font-mono">{log.time}</td>
 <td className="px-4 py-3 text-sm font-semibold text-slate-900">{log.action}</td>
 <td className="px-4 py-3 text-xs text-slate-700">{log.user}</td>
 <td className="px-4 py-3 text-xs text-slate-600 font-mono">{log.ip}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}

 {(!['pending', 'signed', 'permissions', 'certificates', 'logs'].includes(activeTab)) && (
 <div className="p-12 text-center text-slate-600">
 <ShieldCheck className="w-12 h-12 mx-auto mb-4 text-slate-500" />
 <p className="text-lg font-medium text-slate-800">Mô-đun đang được xây dựng</p>
 <p className="mt-2 text-sm">Chức năng cấu hình chữ ký số và phân quyền nâng cao.</p>
 </div>
 )}
 </div>
 </div>

 {signingModalOpen && selectedDoc && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSigningModalOpen(false)}>
 <div className="bg-white rounded-xl shadow-sm w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
 <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
 <div>
 <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
 <ShieldCheck className="w-5 h-5 text-primary-600" />
 Xác nhận Ký số
 </h3>
 </div>
 </div>
 
 <div className="p-6 space-y-5">
 <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl">
 <p className="text-sm text-blue-800 font-medium leading-relaxed">Tài liệu: <br/><strong className="text-blue-900">{selectedDoc?.title}</strong></p>
 <p className="text-xs text-blue-600/80 font-mono mt-1">{selectedDoc?.docId}</p>
 </div>

 <div>
 <label className="block text-sm font-semibold text-slate-800 mb-3">Chọn phương thức ký số chuyên dụng</label>
 <div className="space-y-3">
 {[
 { id: 'smart_ca', label: 'VNPT SmartCA', desc: 'Remote Signing App' },
 { id: 'viettel_ca', label: 'Viettel CA', desc: 'Cloud Hub / SIM PKI' },
 { id: 'usb_token', label: 'USB Token', desc: 'Thiết bị HSM vật lý' }
 ].map((ca) => (
 <div 
 key={ca.id}
 onClick={() => setSignatureMethod(ca.id as any)}
 className={cn(
 "flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all",
 signatureMethod === ca.id ? "border-primary-600 bg-primary-50" : "border-slate-300 bg-white hover:bg-slate-50"
 )}
 >
 <div className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0", signatureMethod === ca.id ? "bg-primary-600 border-primary-600" : "bg-white border-slate-400")} />
 <div>
 <p className="text-[13px] font-bold text-slate-900">{ca.label}</p>
 <p className="text-xs text-slate-600 mt-0.5">{ca.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
 <button 
 onClick={() => setSigningModalOpen(false)}
 disabled={isSigningInProcess}
 className="px-4 py-2.5 text-[13px] font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
 >
 Hủy bỏ
 </button>
 <button 
 disabled={isSigningInProcess}
 className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-[13px] font-bold hover:bg-primary-700 shadow-sm shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
 onClick={confirmSign}
 >
 {isSigningInProcess ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
 {isSigningInProcess ? 'Đang kết nối...' : 'Chấp nhận Ký'}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
