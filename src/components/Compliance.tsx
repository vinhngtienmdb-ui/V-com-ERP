import React, { useState } from 'react';
import { 
 ShieldCheck, 
 Scale, 
 AlertTriangle, 
 FileText, 
 Search, 
 Filter, 
 CheckCircle2, 
 XCircle, 
 Clock, 
 Eye, 
 MoreVertical,
 Gavel,
 ShieldAlert,
 Download
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BrandProtection, DisputeRequest } from '../types/erp';

const MOCK_BRANDS: BrandProtection[] = [
 { id: 'BRD-001', brandName: 'Samsung Official Store', ownerId: 'SEL-001', registrationDate: '10/01/2024', status: 'verified', documents: ['GPKD.pdf', 'Trademark.pdf'] },
 { id: 'BRD-002', brandName: 'Louis Vuitton Vietnam', ownerId: 'SEL-099', registrationDate: '01/03/2024', status: 'pending', documents: ['LV_Global_Auth.pdf'] },
];

const MOCK_DISPUTES: DisputeRequest[] = [
 { id: 'DSP-102', orderId: 'ORD-5541', type: 'counterfeit', reporterId: 'USR-882', evidence: ['img1.jpg', 'video.mp4'], status: 'investigating' },
 { id: 'DSP-103', orderId: 'ORD-8821', type: 'ip_infringement', reporterId: 'BRAND-OWNER-02', evidence: ['proof.pdf'], status: 'open' },
];

export function Compliance() {
 const [activeTab, setActiveTab] = useState<'brand' | 'dispute' | 'policy'>('brand');

 return (
 <div className="space-y-4 animate-in fade-in slide-in- duration-500 pb-4">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900">Pháp chế & Bảo vệ thương hiệu</h1>
 <p className="text-sm text-slate-500 mt-1">Quản lý bản quyền thương hiệu, xử lý tranh chấp hàng giả và giám sát tuân thủ sàn.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Download className="w-4 h-4" />
 Tải báo cáo tuân thủ
 </button>
 <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <ShieldCheck className="w-4 h-4" />
 Đăng ký bảo quyền mới
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Thương hiệu đã bảo quyền</span>
 <ShieldCheck className="w-4 h-4 text-blue-600" />
 </div>
 <div className="text-xl font-bold text-slate-900">842</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">Đã xác thực sở hữu trí tuệ</p>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Tranh chấp đang xử lý</span>
 <Gavel className="w-4 h-4 text-orange-500" />
 </div>
 <div className="text-xl font-bold text-slate-900">15</div>
 <p className="text-[10px] text-blue-600 font-medium mt-1">Cần Admin thẩm định bằng chứng</p>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Cảnh báo vi phạm (Policy)</span>
 <AlertTriangle className="w-4 h-4 text-red-500" />
 </div>
 <div className="text-xl font-bold text-slate-900">124</div>
 <p className="text-[10px] text-red-600 font-medium mt-1">Sản phẩm bị gỡ bỏ do vi phạm</p>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Compliance Score</span>
 <Scale className="w-4 h-4 text-emerald-500" />
 </div>
 <div className="text-2xl font-bold text-emerald-600">98/100</div>
 <p className="text-[10px] text-slate-500 mt-1">Chỉ số tuân thủ pháp luật sàn</p>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-slate-100">
 {[
 { id: 'brand', label: 'Brand Portal (Bản quyền)', icon: ShieldCheck },
 { id: 'dispute', label: 'Giải quyết Tranh chấp', icon: Gavel },
 { id: 'policy', label: 'Giám sát Tuân thủ', icon: ShieldAlert }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
 activeTab === tab.id ? "border-[#2563EB] text-blue-600 bg-slate-100/30" : "border-transparent text-slate-500 hover:text-slate-900"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Tìm thương hiệu, mã tranh chấp..." 
 className="bg-white border border-slate-200 rounded-2xl pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Lọc trạng thái
 </button>
 </div>
 </div>

 <div className="overflow-x-auto min-w-0 custom-scrollbar-x">
 <table className="min-w-[640px] w-full text-left border-collapse">
 <thead>
 {activeTab === 'brand' && (
 <tr className="bg-slate-50 border-b border-slate-100">
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Tên thương hiệu</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase w-32 whitespace-nowrap">Mã sở hữu</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase w-32 whitespace-nowrap">Ngày đăng ký</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase w-36 whitespace-nowrap">Tệp đính kèm</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase w-28 whitespace-nowrap text-center">Trạng thái</th>
 </tr>
 )}
 {activeTab === 'dispute' && (
 <tr className="bg-slate-50 border-b border-slate-100">
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase w-32 whitespace-nowrap">Mã tranh chấp</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase w-36 whitespace-nowrap">Loại vi phạm</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase">Đơn hàng / Đối tượng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase w-28 whitespace-nowrap">Bằng chứng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase w-28 whitespace-nowrap text-center">Trạng thái</th>
 </tr>
 )}
 </thead>
 <tbody className="divide-y divide-slate-100">
 {activeTab === 'brand' && MOCK_BRANDS.map(brand => (
 <tr key={brand.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-slate-900">{brand.brandName}</p>
 <p className="text-[10px] text-slate-600 font-mono">Owner: {brand.ownerId}</p>
 </td>
 <td className="px-6 py-4 text-xs font-mono text-slate-700">{brand.id}</td>
 <td className="px-6 py-4 text-xs text-slate-600">{brand.registrationDate}</td>
 <td className="px-6 py-4">
 <div className="flex gap-2">
 {brand.documents.map((doc, idx) => (
 <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer hover:bg-slate-200">
 <FileText className="w-3 h-3" /> {doc}
 </span>
 ))}
 </div>
 </td>
 <td className="px-6 py-4">
 <div className="flex justify-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1",
 brand.status === 'verified' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
 )}>
 {brand.status === 'verified' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
 {brand.status === 'verified' ? 'ĐÃ XÁC THỰC' : 'ĐANG CHỜ'}
 </span>
 </div>
 </td>
 </tr>
 ))}
 {activeTab === 'dispute' && MOCK_DISPUTES.map(dispute => (
 <tr key={dispute.id} className="hover:bg-slate-50 transition-colors text-xs">
 <td className="px-6 py-4 font-bold text-slate-900 font-mono">{dispute.id}</td>
 <td className="px-6 py-4 uppercase font-bold text-red-600">{dispute.type}</td>
 <td className="px-6 py-4">
 <p className="font-bold">Order: {dispute.orderId}</p>
 <p className="text-[10px] text-slate-600">Người báo: {dispute.reporterId}</p>
 </td>
 <td className="px-6 py-4 text-blue-600 font-medium cursor-pointer flex items-center gap-1">
 <Eye className="w-3.5 h-3.5" /> Xem {dispute.evidence.length} bằng chứng
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold",
 dispute.status === 'investigating' ? "bg-slate-100 text-blue-600" : "bg-red-50 text-red-600"
 )}>
 {dispute.status.toUpperCase()}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div className="bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-lg overflow-hidden relative border border-slate-800">
 <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-3 bg-red-600 rounded-lg shadow-sm shadow-red-600/20">
 <ShieldAlert className="w-6 h-6" />
 </div>
 <h3 className="text-xl font-bold italic font-sans tracking-tight">AI Compliance Guardian</h3>
 </div>
 <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
 Hệ thống tự động rà quét sản phẩm dựa trên AI để phát hiện từ khóa cấm, hình ảnh nhạy cảm và các sản phẩm vi phạm bản quyền thương hiệu. Tự động tạm khóa các shop có Compliance Score dưới 60.
 </p>
 <div className="flex gap-4 pt-4">
 <button className="px-8 py-3 bg-white text-slate-900 font-bold rounded-lg text-xs hover:bg-slate-100 transition-all uppercase tracking-widest">Cấu hình Luật sàn</button>
 <button className="px-8 py-3 border border-slate-700 font-bold rounded-lg text-xs hover:bg-slate-800 transition-all uppercase tracking-widest">Logs vi phạm AI</button>
 </div>
 </div>
 <div className="hidden md:block">
 <div className="p-6 bg-slate-800/40 rounded-2xl border border-slate-700/50 backdrop-blur-sm space-y-4">
 <h4 className="text-xs font-bold text-slate-600 uppercase flex items-center gap-2">
 <Clock className="w-3.5 h-3.5" /> Real-time Legal Feed
 </h4>
 <div className="space-y-3">
 {[1, 2].map(i => (
 <div key={i} className="flex gap-3 text-xs border-l-2 border-red-500 pl-4 py-1">
 <div>
 <p className="text-slate-400 font-bold">Phát hiện Seller bán hàng giả mạo (Counterfeit)</p>
 <p className="text-slate-600 text-[10px]">Mã shop: SEL-0{i}42 • 5 phút trước</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
