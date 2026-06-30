import { DraggableGrid } from './ui/DraggableGrid';
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
 Download,
 Briefcase,
 FileSignature
} from 'lucide-react';
import { cn } from '../lib/utils';
import { BrandProtection, DisputeRequest } from '../types/erp';
import { useTableColumns } from '../hooks/useTableColumns';
import { ResizableTh } from './ui/ResizableTh';

const MOCK_BRANDS: BrandProtection[] = [
 { id: 'BRD-001', brandName: 'Samsung Official Store', ownerId: 'SEL-001', registrationDate: '10/01/2024', status: 'verified', documents: ['GPKD.pdf', 'Trademark.pdf'] },
 { id: 'BRD-002', brandName: 'Louis Vuitton Vietnam', ownerId: 'SEL-099', registrationDate: '01/03/2024', status: 'pending', documents: ['LV_Global_Auth.pdf'] },
];

const MOCK_DISPUTES: DisputeRequest[] = [
 { id: 'DSP-102', orderId: 'ORD-5541', type: 'counterfeit', reporterId: 'USR-882', evidence: ['img1.jpg', 'video.mp4'], status: 'investigating' },
 { id: 'DSP-103', orderId: 'ORD-8821', type: 'ip_infringement', reporterId: 'BRAND-OWNER-02', evidence: ['proof.pdf'], status: 'open' },
];

const MOCK_CLM = [
  { id: 'HD-2024-001', partner: 'Công ty TNHH ABC', type: 'Hợp đồng mua bán', value: '1.500.000.000 VNĐ', expiryDate: '31/12/2025', status: 'active' },
  { id: 'HD-2024-042', partner: 'Tập đoàn XYZ', type: 'Hợp đồng dịch vụ', value: '500.000.000 VNĐ', expiryDate: '15/06/2024', status: 'expiring_soon' },
];

const MOCK_LITIGATION = [
  { id: 'CASE-2024-01', plaintiff: 'Nguyễn Văn A', defendant: 'Công ty Cổ phần MDB', type: 'Tranh chấp lao động', court: 'TAND Quận 1', status: 'hearing' },
  { id: 'CASE-2024-02', plaintiff: 'Công ty Cổ phần MDB', defendant: 'Công ty TNHH DEF', type: 'Vi phạm hợp đồng', court: 'Trọng tài thương mại', status: 'preparing' },
];

export function Compliance() {
 const [activeTab, setActiveTab] = useState<'brand' | 'dispute' | 'policy' | 'clm' | 'litigation'>('brand');

 const { columns: brandCols, handleResize: handleBrandResize, getPinOffset: getBrandPinOffset } = useTableColumns('complianceBrand', ['brandName', 'owner', 'date', 'docs', 'status']);
 const { columns: disputeCols, handleResize: handleDisputeResize, getPinOffset: getDisputePinOffset } = useTableColumns('complianceDispute', ['id', 'type', 'target', 'evidence', 'status']);
 const { columns: clmCols, handleResize: handleClmResize, getPinOffset: getClmPinOffset } = useTableColumns('complianceClm', ['id', 'partner', 'type', 'value', 'expiry', 'status']);
 const { columns: litigationCols, handleResize: handleLitigationResize, getPinOffset: getLitigationPinOffset } = useTableColumns('complianceLitigation', ['id', 'plaintiff', 'defendant', 'type', 'court', 'status']);

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Pháp chế & Bảo vệ thương hiệu</h1>
 <p className="text-sm text-[#6B7280] mt-1">Quản lý bản quyền thương hiệu, xử lý tranh chấp hàng giả và giám sát tuân thủ sàn.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Download className="w-4 h-4" />
 Tải báo cáo tuân thủ
 </button>
 <button className="bg-primary-600 text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <ShieldCheck className="w-4 h-4" />
 Đăng ký bảo quyền mới
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Thương hiệu đã bảo quyền</span>
 <ShieldCheck className="w-4 h-4 text-primary-600" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">842</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">Đã xác thực sở hữu trí tuệ</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Tranh chấp đang xử lý</span>
 <Gavel className="w-4 h-4 text-orange-500" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">15</div>
 <p className="text-[10px] text-orange-600 font-medium mt-1">Cần Admin thẩm định bằng chứng</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Cảnh báo vi phạm (Policy)</span>
 <AlertTriangle className="w-4 h-4 text-red-500" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">124</div>
 <p className="text-[10px] text-red-600 font-medium mt-1">Sản phẩm bị gỡ bỏ do vi phạm</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Compliance Score</span>
 <Scale className="w-4 h-4 text-emerald-500" />
 </div>
 <div className="text-2xl font-bold text-emerald-600">98/100</div>
 <p className="text-[10px] text-[#6B7280] mt-1">Chỉ số tuân thủ pháp luật sàn</p>
 </div>
 </DraggableGrid>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-[#F3F4F6]">
 {[
 { id: 'brand', label: 'Brand Portal (Bản quyền)', icon: ShieldCheck },
 { id: 'dispute', label: 'Giải quyết Tranh chấp', icon: Gavel },
 { id: 'policy', label: 'Giám sát Tuân thủ', icon: ShieldAlert },
 { id: 'clm', label: 'Quản lý Hợp đồng (CLM)', icon: FileSignature },
 { id: 'litigation', label: 'Quản lý Tố tụng', icon: Briefcase }
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

 <div className="p-4 bg-[#F9FAFB] border-b border-[#F3F4F6] flex justify-between items-center">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="Tìm thương hiệu, mã tranh chấp..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Lọc trạng thái
 </button>
 </div>
 </div>

 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse whitespace-nowrap">
 <thead>
 {activeTab === 'brand' && (
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <ResizableTh width={brandCols.find(c => c.id === 'brandName')?.currentWidth} onResize={(w) => handleBrandResize('brandName', w)} isPinned={brandCols.find(c => c.id === 'brandName')?.isPinned} pinOffset={getBrandPinOffset('brandName')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Tên thương hiệu</ResizableTh>
 <ResizableTh width={brandCols.find(c => c.id === 'owner')?.currentWidth} onResize={(w) => handleBrandResize('owner', w)} isPinned={brandCols.find(c => c.id === 'owner')?.isPinned} pinOffset={getBrandPinOffset('owner')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Mã sở hữu</ResizableTh>
 <ResizableTh width={brandCols.find(c => c.id === 'date')?.currentWidth} onResize={(w) => handleBrandResize('date', w)} isPinned={brandCols.find(c => c.id === 'date')?.isPinned} pinOffset={getBrandPinOffset('date')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Ngày đăng ký</ResizableTh>
 <ResizableTh width={brandCols.find(c => c.id === 'docs')?.currentWidth} onResize={(w) => handleBrandResize('docs', w)} isPinned={brandCols.find(c => c.id === 'docs')?.isPinned} pinOffset={getBrandPinOffset('docs')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Tệp đính kèm</ResizableTh>
 <ResizableTh width={brandCols.find(c => c.id === 'status')?.currentWidth} onResize={(w) => handleBrandResize('status', w)} isPinned={brandCols.find(c => c.id === 'status')?.isPinned} pinOffset={getBrandPinOffset('status')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center">Trạng thái</ResizableTh>
 </tr>
 )}
 {activeTab === 'dispute' && (
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <ResizableTh width={disputeCols.find(c => c.id === 'id')?.currentWidth} onResize={(w) => handleDisputeResize('id', w)} isPinned={disputeCols.find(c => c.id === 'id')?.isPinned} pinOffset={getDisputePinOffset('id')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Mã tranh chấp</ResizableTh>
 <ResizableTh width={disputeCols.find(c => c.id === 'type')?.currentWidth} onResize={(w) => handleDisputeResize('type', w)} isPinned={disputeCols.find(c => c.id === 'type')?.isPinned} pinOffset={getDisputePinOffset('type')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Loại vi phạm</ResizableTh>
 <ResizableTh width={disputeCols.find(c => c.id === 'target')?.currentWidth} onResize={(w) => handleDisputeResize('target', w)} isPinned={disputeCols.find(c => c.id === 'target')?.isPinned} pinOffset={getDisputePinOffset('target')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Đơn hàng / Đối tượng</ResizableTh>
 <ResizableTh width={disputeCols.find(c => c.id === 'evidence')?.currentWidth} onResize={(w) => handleDisputeResize('evidence', w)} isPinned={disputeCols.find(c => c.id === 'evidence')?.isPinned} pinOffset={getDisputePinOffset('evidence')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Bằng chứng</ResizableTh>
 <ResizableTh width={disputeCols.find(c => c.id === 'status')?.currentWidth} onResize={(w) => handleDisputeResize('status', w)} isPinned={disputeCols.find(c => c.id === 'status')?.isPinned} pinOffset={getDisputePinOffset('status')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center">Trạng thái</ResizableTh>
 </tr>
 )}
 {activeTab === 'clm' && (
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <ResizableTh width={clmCols.find(c => c.id === 'id')?.currentWidth} onResize={(w) => handleClmResize('id', w)} isPinned={clmCols.find(c => c.id === 'id')?.isPinned} pinOffset={getClmPinOffset('id')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Mã hợp đồng</ResizableTh>
 <ResizableTh width={clmCols.find(c => c.id === 'partner')?.currentWidth} onResize={(w) => handleClmResize('partner', w)} isPinned={clmCols.find(c => c.id === 'partner')?.isPinned} pinOffset={getClmPinOffset('partner')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Đối tác</ResizableTh>
 <ResizableTh width={clmCols.find(c => c.id === 'type')?.currentWidth} onResize={(w) => handleClmResize('type', w)} isPinned={clmCols.find(c => c.id === 'type')?.isPinned} pinOffset={getClmPinOffset('type')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Loại hợp đồng</ResizableTh>
 <ResizableTh width={clmCols.find(c => c.id === 'value')?.currentWidth} onResize={(w) => handleClmResize('value', w)} isPinned={clmCols.find(c => c.id === 'value')?.isPinned} pinOffset={getClmPinOffset('value')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Giá trị</ResizableTh>
 <ResizableTh width={clmCols.find(c => c.id === 'expiry')?.currentWidth} onResize={(w) => handleClmResize('expiry', w)} isPinned={clmCols.find(c => c.id === 'expiry')?.isPinned} pinOffset={getClmPinOffset('expiry')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Ngày hết hạn</ResizableTh>
 <ResizableTh width={clmCols.find(c => c.id === 'status')?.currentWidth} onResize={(w) => handleClmResize('status', w)} isPinned={clmCols.find(c => c.id === 'status')?.isPinned} pinOffset={getClmPinOffset('status')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center">Trạng thái</ResizableTh>
 </tr>
 )}
 {activeTab === 'litigation' && (
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <ResizableTh width={litigationCols.find(c => c.id === 'id')?.currentWidth} onResize={(w) => handleLitigationResize('id', w)} isPinned={litigationCols.find(c => c.id === 'id')?.isPinned} pinOffset={getLitigationPinOffset('id')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Mã vụ kiện</ResizableTh>
 <ResizableTh width={litigationCols.find(c => c.id === 'plaintiff')?.currentWidth} onResize={(w) => handleLitigationResize('plaintiff', w)} isPinned={litigationCols.find(c => c.id === 'plaintiff')?.isPinned} pinOffset={getLitigationPinOffset('plaintiff')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Nguyên đơn</ResizableTh>
 <ResizableTh width={litigationCols.find(c => c.id === 'defendant')?.currentWidth} onResize={(w) => handleLitigationResize('defendant', w)} isPinned={litigationCols.find(c => c.id === 'defendant')?.isPinned} pinOffset={getLitigationPinOffset('defendant')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Bị đơn</ResizableTh>
 <ResizableTh width={litigationCols.find(c => c.id === 'type')?.currentWidth} onResize={(w) => handleLitigationResize('type', w)} isPinned={litigationCols.find(c => c.id === 'type')?.isPinned} pinOffset={getLitigationPinOffset('type')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Loại vụ kiện</ResizableTh>
 <ResizableTh width={litigationCols.find(c => c.id === 'court')?.currentWidth} onResize={(w) => handleLitigationResize('court', w)} isPinned={litigationCols.find(c => c.id === 'court')?.isPinned} pinOffset={getLitigationPinOffset('court')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase">Cơ quan giải quyết</ResizableTh>
 <ResizableTh width={litigationCols.find(c => c.id === 'status')?.currentWidth} onResize={(w) => handleLitigationResize('status', w)} isPinned={litigationCols.find(c => c.id === 'status')?.isPinned} pinOffset={getLitigationPinOffset('status')} className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase text-center">Trạng thái</ResizableTh>
 </tr>
 )}
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {activeTab === 'brand' && MOCK_BRANDS.map(brand => (
 <tr key={brand.id} className="hover:bg-slate-50 transition-colors">
 <td className="px-6 py-4">
 <p className="text-sm font-bold text-[#111827]">{brand.brandName}</p>
 <p className="text-[10px] text-slate-600 font-mono">Owner: {brand.ownerId}</p>
 </td>
 <td className="px-6 py-4 text-xs font-mono text-slate-700">{brand.id}</td>
 <td className="px-6 py-4 text-xs text-slate-600">{brand.registrationDate}</td>
 <td className="px-6 py-4">
 <div className="flex gap-2">
 {brand.documents.map((doc, idx) => (
 <span key={idx} className="px-2 py-0.5 bg-slate-100 text-[#6B7280] text-[9px] font-bold rounded flex items-center gap-1 cursor-pointer hover:bg-slate-200">
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
 <td className="px-6 py-4 font-bold text-[#111827] font-mono">{dispute.id}</td>
 <td className="px-6 py-4 uppercase font-bold text-red-600">{dispute.type}</td>
 <td className="px-6 py-4">
 <p className="font-bold">Order: {dispute.orderId}</p>
 <p className="text-[10px] text-slate-600">Người báo: {dispute.reporterId}</p>
 </td>
 <td className="px-6 py-4 text-primary-600 font-medium cursor-pointer flex items-center gap-1">
 <Eye className="w-3.5 h-3.5" /> Xem {dispute.evidence.length} bằng chứng
 </td>
 <td className="px-6 py-4 text-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold",
 dispute.status === 'investigating' ? "bg-slate-100 text-orange-700" : "bg-red-50 text-red-600"
 )}>
 {dispute.status.toUpperCase()}
 </span>
 </td>
 </tr>
 ))}
 {activeTab === 'clm' && MOCK_CLM.map(clm => (
 <tr key={clm.id} className="hover:bg-slate-50 transition-colors text-xs">
 <td className="px-6 py-4 font-bold text-[#111827] font-mono">{clm.id}</td>
 <td className="px-6 py-4 font-bold text-[#111827]">{clm.partner}</td>
 <td className="px-6 py-4 text-slate-600">{clm.type}</td>
 <td className="px-6 py-4 text-emerald-600 font-bold">{clm.value}</td>
 <td className="px-6 py-4 text-slate-600">{clm.expiryDate}</td>
 <td className="px-6 py-4 text-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold",
 clm.status === 'active' ? "bg-emerald-50 text-emerald-600" : "bg-orange-50 text-orange-600"
 )}>
 {clm.status === 'active' ? 'ĐANG HIỆU LỰC' : 'SẮP HẾT HẠN'}
 </span>
 </td>
 </tr>
 ))}
 {activeTab === 'litigation' && MOCK_LITIGATION.map(lit => (
 <tr key={lit.id} className="hover:bg-slate-50 transition-colors text-xs">
 <td className="px-6 py-4 font-bold text-[#111827] font-mono">{lit.id}</td>
 <td className="px-6 py-4 font-bold text-[#111827]">{lit.plaintiff}</td>
 <td className="px-6 py-4 font-bold text-slate-600">{lit.defendant}</td>
 <td className="px-6 py-4 text-slate-600">{lit.type}</td>
 <td className="px-6 py-4 text-slate-600">{lit.court}</td>
 <td className="px-6 py-4 text-center">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold",
 lit.status === 'hearing' ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
 )}>
 {lit.status === 'hearing' ? 'ĐANG XÉT XỬ' : 'ĐANG CHUẨN BỊ'}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 <div className="bg-slate-900 text-[#FAF9F5] p-6 rounded-lg overflow-hidden relative border border-slate-800">
 <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-3 bg-red-600 rounded-lg shadow-sm shadow-red-600/20">
 <ShieldAlert className="w-6 h-6" />
 </div>
 <h3 className="text-xl font-bold italic font-serif tracking-tight">Compliance Guardian</h3>
 </div>
 <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
 Hệ thống tự động rà quét sản phẩm để phát hiện từ khóa cấm, hình ảnh nhạy cảm và các sản phẩm vi phạm bản quyền thương hiệu. Tự động tạm khóa các shop có Compliance Score dưới 60.
 </p>
 <div className="flex gap-4 pt-4">
 <button className="px-6 py-3 bg-white text-slate-900 font-bold rounded-lg text-xs hover:bg-slate-100 transition-all uppercase tracking-widest">Cấu hình Luật sàn</button>
 <button className="px-6 py-3 border border-slate-700 font-bold rounded-lg text-xs hover:bg-slate-800 transition-all uppercase tracking-widest">Logs vi phạm</button>
 </div>
 </div>
 <div className="hidden md:block">
 <div className="p-6 bg-slate-800/40 rounded-lg border border-slate-700/50 backdrop-blur-sm space-y-4">
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
