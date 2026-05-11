import React, { useState } from 'react';
import { 
 FileText, 
 Briefcase, 
 ShoppingCart, 
 FileSignature, 
 Search, 
 Plus,
 RefreshCw,
 Clock,
 CheckCircle2,
 AlertCircle,
 X,
 AlertTriangle,
 ShieldCheck,
 Check,
 PenTool,
 Key
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const MOCK_CONTRACTS = [
 { id: 'HDLD-001', title: 'Hợp đồng lao động - Nguyễn Văn A', type: 'labor', subtype: 'Chính thức', status: 'active', party: 'Nguyễn Văn A', expiry: '01/01/2025', value: '-', signatureStatus: 'signed', signers: [{role: 'Người sử dụng lao động', name: 'Giám đốc', status: 'signed'}, {role: 'Người lao động', name: 'Nguyễn Văn A', status: 'signed'}] },
 { id: 'HDTV-002', title: 'Hợp đồng thử việc - Trần Thái B', type: 'labor', subtype: 'Thử việc', status: 'expiring_soon', signatureStatus: 'signed', party: 'Trần Thái B', expiry: '10/05/2024', value: '-', signers: [{role: 'Người sử dụng ND', name: 'Giám đốc', status: 'signed'}, {role: 'Người lao động', name: 'Trần Thái B', status: 'signed'}] },
 { id: 'HDMB-001', title: 'Hợp đồng mua bán thiết bị VP', type: 'sales', subtype: 'Mua bán', status: 'pending', signatureStatus: 'pending', party: 'Công ty ABC', expiry: '31/12/2024', value: '50,000,000 ₫', signers: [{role: 'Bên mua', name: 'Giám đốc', status: 'pending'}, {role: 'Bên bán', name: 'Đại diện bên bán', status: 'pending'}] },
 { id: 'HDDV-001', title: 'Hợp đồng tư vấn AI', type: 'service', subtype: 'Dịch vụ', status: 'expired', signatureStatus: 'signed', party: 'AI Partner LLC', expiry: '01/02/2024', value: '120,000,000 ₫', signers: [{role: 'Bên thuê', name: 'Giám đốc', status: 'signed'}, {role: 'Bên tư vấn', name: 'AI Partner LLC', status: 'signed'}] }
];

export function ContractManager() {
 const [activeTab, setActiveTab] = useState('labor');
 const [selectedContract, setSelectedContract] = useState<any>(null);
 const [signingModalOpen, setSigningModalOpen] = useState(false);
 const navigate = useNavigate();

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 {selectedContract && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
 <div className="bg-white rounded-xl shadow-sm w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
 <div className="flex items-center justify-between p-6 border-b border-slate-200">
 <div>
 <h3 className="text-lg font-bold text-slate-900">{selectedContract.title}</h3>
 <p className="text-sm font-mono text-slate-600 mt-1">{selectedContract.id}</p>
 </div>
 <button 
 onClick={() => setSelectedContract(null)}
 className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 
 <div className="p-6 space-y-6">
 <div className="grid grid-cols-2 gap-6">
 <div>
 <p className="text-sm text-slate-600">Đối tác / Nhân sự</p>
 <p className="text-base font-medium text-slate-900 mt-1">{selectedContract.party}</p>
 </div>
 <div>
 <p className="text-sm text-slate-600">Loại hợp đồng</p>
 <p className="text-base font-medium text-slate-900 mt-1">{selectedContract.subtype || selectedContract.type}</p>
 </div>
 <div>
 <p className="text-sm text-slate-600">Giá trị hợp đồng</p>
 <p className="text-base font-medium text-slate-900 mt-1">{selectedContract.value}</p>
 </div>
 <div>
 <p className="text-sm text-slate-600">Ngày hết hạn</p>
 <p className={cn(
 "text-base font-bold mt-1",
 selectedContract.status === 'expired' ? "text-red-600" :
 selectedContract.status === 'expiring_soon' ? "text-blue-600" : "text-slate-900"
 )}>{selectedContract.expiry}</p>
 </div>
 </div>

 <div>
 <p className="text-sm text-slate-600 mb-2">Trạng thái hợp đồng</p>
 <div className="flex items-center gap-3">
 <span className={cn(
 "px-3 py-1.5 text-sm font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-2",
 selectedContract.status === 'active' ? "bg-emerald-50 text-emerald-600" : 
 selectedContract.status === 'pending' ? "bg-amber-50 text-amber-600" : 
 selectedContract.status === 'expiring_soon' ? "bg-orange-50 text-blue-600" :
 "bg-red-50 text-red-600"
 )}>
 {selectedContract.status === 'active' && <CheckCircle2 className="w-4 h-4" />}
 {selectedContract.status === 'pending' && <Clock className="w-4 h-4" />}
 {selectedContract.status === 'expiring_soon' && <AlertTriangle className="w-4 h-4" />}
 {selectedContract.status === 'expired' && <AlertCircle className="w-4 h-4" />}
 {selectedContract.status === 'active' ? 'Đang có hiệu lực' : 
 selectedContract.status === 'pending' ? 'Chờ duyệt' : 
 selectedContract.status === 'expiring_soon' ? 'Sắp hết hạn (Cần gia hạn)' : 'Đã hết hạn'}
 </span>
 
 {selectedContract.signatureStatus && (
 <span className={cn(
 "px-3 py-1.5 text-sm font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-2",
 selectedContract.signatureStatus === 'signed' ? "bg-slate-100 text-blue-600" : "bg-slate-100 text-slate-700"
 )}>
 <PenTool className="w-4 h-4" />
 {selectedContract.signatureStatus === 'signed' ? 'Đã ký số' : 'Chưa ký hoàn tất'}
 </span>
 )}
 </div>
 </div>

 {selectedContract.signers && (
 <div className="border border-slate-200 rounded-2xl overflow-hidden">
 <div className="bg-slate-50 px-4 py-3 border-b border-slate-300">
 <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 <ShieldCheck className="w-4 h-4 text-emerald-600" /> Tiến trình ký số
 </h4>
 </div>
 <div className="divide-y divide-slate-100 p-4">
 {selectedContract.signers.map((signer: any, idx: number) => (
 <div key={idx} className="flex items-center justify-between py-2">
 <div>
 <p className="text-sm font-bold text-slate-900">{signer.name}</p>
 <p className="text-xs text-slate-600">{signer.role}</p>
 </div>
 <div>
 {signer.status === 'signed' ? (
 <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
 <Check className="w-3 h-3" /> Đã ký
 </span>
 ) : (
 <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">
 <Clock className="w-3 h-3" /> Chờ ký
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>

 <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
 <button 
 onClick={() => setSelectedContract(null)}
 className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
 >
 Đóng
 </button>
 
 {selectedContract.signatureStatus === 'pending' && (
 <button 
 onClick={() => setSigningModalOpen(true)}
 className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 shadow-sm flex items-center gap-2"
 >
 <Key className="w-4 h-4" />
 Ký số (USB Token / SmartCA)
 </button>
 )}

 {selectedContract.status === 'expiring_soon' && (
 <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 shadow-sm flex items-center gap-2">
 <FileSignature className="w-4 h-4" />
 Gia hạn hợp đồng
 </button>
 )}
 </div>
 </div>
 </div>
 )}

 {signingModalOpen && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
 <div className="bg-white rounded-xl shadow-sm w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
 <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
 <div>
 <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
 <ShieldCheck className="w-5 h-5 text-primary-600" />
 Ký số Hợp đồng
 </h3>
 </div>
 <button 
 onClick={() => setSigningModalOpen(false)}
 className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
 title="Đóng (Esc)"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 
 <div className="p-6 space-y-5">
 <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl">
 <p className="text-sm text-blue-800 font-medium leading-relaxed">Bạn đang thực hiện ký số cho tài liệu: <br/><strong className="text-blue-900">{selectedContract?.title}</strong></p>
 </div>

 <div>
 <label className="block text-sm font-semibold text-slate-800 mb-3">Chọn phương thức ký số</label>
 <div className="space-y-3">
 <label className="flex items-center gap-3 p-3 border border-primary-200 bg-primary-50/50 rounded-lg cursor-pointer hover:bg-primary-50 transition-colors">
 <input type="radio" name="signMethod" defaultChecked className="w-4 h-4 text-primary-600 border-slate-400 focus:ring-primary-600" />
 <div>
 <p className="text-sm font-bold text-slate-900 flex items-center gap-2">Ký số SmartCA (Viettel, VNPT) <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.5 rounded font-bold">Khuyên dùng</span></p>
 <p className="text-xs text-slate-600 mt-0.5">Xác thực qua ứng dụng trên điện thoại thông minh.</p>
 </div>
 </label>
 <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors opacity-70">
 <input type="radio" name="signMethod" className="w-4 h-4 text-primary-600 border-slate-400 focus:ring-primary-600" />
 <div>
 <p className="text-sm font-bold text-slate-900">Ký bằng USB Token</p>
 <p className="text-xs text-slate-600 mt-0.5">Yêu cầu cắm USB và có phần mềm hỗ trợ (plugin).</p>
 </div>
 </label>
 </div>
 </div>
 </div>

 <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
 <button 
 onClick={() => setSigningModalOpen(false)}
 className="px-4 py-2.5 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
 >
 Hủy bỏ
 </button>
 <button 
 className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-sm shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-2"
 onClick={() => {
 alert(`Yêu cầu ký số đã được gửi đến thiết bị SmartCA của bạn!`);
 setSigningModalOpen(false);
 }}
 >
 <Key className="w-4 h-4" /> Xác nhận ký số
 </button>
 </div>
 </div>
 </div>
 )}

 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900">Quản trị Hợp đồng</h1>
 <p className="text-sm text-slate-500 mt-1">Hợp đồng lao động, dịch vụ, mua bán và theo dõi thời hạn hợp đồng.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-[#111827] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" />
 Tạo hợp đồng mới
 </button>
 </div>
 </div>

 <div className="flex gap-6">
 {/* Sidebar */}
 <div className="w-[240px] shrink-0 space-y-1">
 {[
 { id: 'labor', label: 'Hợp đồng LĐ, Thử việc', icon: Briefcase },
 { id: 'sales', label: 'Hợp đồng Mua bán', icon: ShoppingCart },
 { id: 'service', label: 'Hợp đồng Dịch vụ', icon: FileText },
 { id: 'signature', label: 'Trình ký (e-Sign)', icon: FileSignature },
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
 <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <div className="relative w-64">
 <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
 <input 
 type="text" 
 placeholder="Tìm kiếm hợp đồng..."
 className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-300 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
 />
 </div>
 <button className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-2xl shadow-sm">
 <RefreshCw className="w-4 h-4" />
 </button>
 </div>

 <div className="overflow-x-auto min-w-0 custom-scrollbar-x">
 <table className="min-w-[680px] w-full text-left border-collapse">
 <thead className="bg-slate-50 border-b border-slate-100">
 <tr>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Mã HĐ / Tiêu đề</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40">Đối tác / Nhân sự</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-32 whitespace-nowrap">Giá trị</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-40 whitespace-nowrap text-center">Trạng thái</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest w-36 whitespace-nowrap text-right">Ngày hết hạn</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {MOCK_CONTRACTS.filter(doc => activeTab === 'signature' ? true : doc.type === activeTab).map(doc => (
 <tr key={doc.id} onClick={() => setSelectedContract(doc)} className="hover:bg-slate-50 transition-colors cursor-pointer">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-slate-900">{doc.title}</p>
 <p className="text-[10px] text-slate-600 font-bold uppercase">{doc.id}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm font-medium text-slate-900">{doc.party}</p>
 </td>
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-slate-800">{doc.value}</p>
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn(
 "px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-tight inline-flex items-center gap-1",
 doc.status === 'active' ? "bg-emerald-50 text-emerald-600" : 
 doc.status === 'pending' ? "bg-amber-50 text-amber-600" :
 doc.status === 'expiring_soon' ? "bg-orange-50 text-blue-600" : "bg-red-50 text-red-600"
 )}>
 {doc.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
 {doc.status === 'pending' && <Clock className="w-3 h-3" />}
 {doc.status === 'expiring_soon' && <AlertTriangle className="w-3 h-3" />}
 {doc.status === 'expired' && <AlertCircle className="w-3 h-3" />}
 {doc.status === 'active' ? 'Hiệu lực' : 
 doc.status === 'pending' ? 'Chờ duyệt' : 
 doc.status === 'expiring_soon' ? 'Sắp hết hạn' : 'Hết hạn'}
 </span>
 {doc.signatureStatus && (
 <div className="mt-1.5">
 <span className={cn(
 "px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-tight inline-flex items-center gap-1",
 doc.signatureStatus === 'signed' ? "bg-slate-100 text-blue-600" : "bg-slate-100 text-slate-700"
 )}>
 <PenTool className="w-3 h-3" />
 {doc.signatureStatus === 'signed' ? 'Đã ký số' : 'Chưa ký'}
 </span>
 </div>
 )}
 </td>
 <td className="px-6 py-4 text-right">
 <p className={cn(
 "text-sm font-mono font-medium",
 doc.status === 'expired' ? "text-red-500" :
 doc.status === 'expiring_soon' ? "text-blue-600 font-bold" : "text-slate-700"
 )}>{doc.expiry}</p>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </div>
 );
}
