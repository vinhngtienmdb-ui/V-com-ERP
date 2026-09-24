import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Building, 
  Store, 
  User, 
  FileText, 
  ExternalLink, 
  Eye, 
  RefreshCw, 
  CreditCard, 
  Receipt, 
  Calendar, 
  MapPin, 
  Phone, 
  Mail, 
  CheckSquare, 
  Square, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Percent,
  Sliders
} from 'lucide-react';
import { ComprehensiveSeller } from '../../types/sellerKyc';
import { formatCurrency, cn } from '../../lib/utils';

interface SellerApprovalModalProps {
  seller: ComprehensiveSeller;
  onClose: () => void;
  onApprove: (sellerId: string, commissionRate: number, customNotes: string) => Promise<void>;
  onReject: (sellerId: string, reason: string) => Promise<void>;
  onRequestChanges: (sellerId: string, requestNotes: string) => Promise<void>;
}

export const SellerApprovalModal: React.FC<SellerApprovalModalProps> = ({
  seller,
  onClose,
  onApprove,
  onReject,
  onRequestChanges
}) => {
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [commission, setCommission] = useState(seller.commissionRate || 5);
  const [isVerifyingVneid, setIsVerifyingVneid] = useState(false);
  const [vneidVerified, setVneidVerified] = useState(seller.vneid?.level === 2);

  // Verification Checklist State
  const [checks, setChecks] = useState({
    vneidMatched: true,
    taxActive: true,
    bankMatched: true,
    licenseValid: true,
    contractSigned: true
  });

  // Action modals
  const [actionType, setActionType] = useState<'none' | 'approve' | 'reject' | 'changes'>('none');
  const [rejectionReason, setRejectionReason] = useState('');
  const [requestNotes, setRequestNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedDoc = seller.documents[activeDocIndex] || null;

  const handleSimulateVneidCheck = () => {
    setIsVerifyingVneid(true);
    setTimeout(() => {
      setIsVerifyingVneid(false);
      setVneidVerified(true);
      alert('✅ Kết quả đối soát VNeID API (Bộ Công An):\n- Số định danh: ' + seller.vneid.citizenId + '\n- Chủ sở hữu: ' + seller.vneid.fullName + '\n- Trạng thái: Định danh điện tử Mức 2 chính chủ\n- Tỷ lệ khớp sinh trắc: 100%');
    }, 1000);
  };

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecksPassed = Object.values(checks).every(Boolean);

  const handleConfirmAction = async () => {
    setIsSubmitting(true);
    try {
      if (actionType === 'approve') {
        await onApprove(seller.id, commission, 'Hồ sơ pháp lý hợp lệ. Đã duyệt xác thực VNeID Mức 2 và cấu hình thuế.');
      } else if (actionType === 'reject') {
        if (!rejectionReason.trim()) {
          alert('Vui lòng nhập lý do từ chối hồ sơ.');
          setIsSubmitting(false);
          return;
        }
        await onReject(seller.id, rejectionReason);
      } else if (actionType === 'changes') {
        if (!requestNotes.trim()) {
          alert('Vui lòng nhập nội dung yêu cầu bổ sung chứng từ.');
          setIsSubmitting(false);
          return;
        }
        await onRequestChanges(seller.id, requestNotes);
      }
      onClose();
    } catch (err: any) {
      alert('Thao tác thất bại: ' + (err.message || err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-250">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs",
              seller.legalType === 'ENTERPRISE' ? "bg-purple-100 text-purple-700 border border-purple-200" :
              seller.legalType === 'HOUSEHOLD' ? "bg-teal-100 text-teal-700 border border-teal-200" :
              "bg-blue-100 text-blue-700 border border-blue-200"
            )}>
              {seller.legalType === 'ENTERPRISE' ? <Building className="w-6 h-6" /> :
               seller.legalType === 'HOUSEHOLD' ? <Store className="w-6 h-6" /> :
               <User className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">{seller.shopName}</h2>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border",
                  seller.legalType === 'ENTERPRISE' ? "bg-purple-50 text-purple-700 border-purple-200" :
                  seller.legalType === 'HOUSEHOLD' ? "bg-teal-50 text-teal-700 border-teal-200" :
                  "bg-blue-50 text-blue-700 border-blue-200"
                )}>
                  {seller.legalType === 'ENTERPRISE' ? 'Doanh nghiệp (Công ty)' :
                   seller.legalType === 'HOUSEHOLD' ? 'Hộ kinh doanh cá thể' :
                   'Cá nhân kinh doanh'}
                </span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                  seller.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  seller.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" :
                  "bg-rose-50 text-rose-700 border-rose-200"
                )}>
                  {seller.status === 'active' ? 'Đã kích hoạt' : seller.status === 'pending' ? 'Chờ thẩm định' : 'Tạm khóa / Từ chối'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3 font-medium">
                <span>Mã số: <b className="font-mono text-slate-700">{seller.id}</b></span>
                <span>•</span>
                <span>Ngày gửi hồ sơ: <b className="text-slate-700">{seller.joinDate}</b></span>
                <span>•</span>
                <span>Nguồn: <b className="text-orange-600">Đăng ký Cổng VComm Seller Centre</b></span>
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Workspace (Two Columns) */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Left Column: Comprehensive Legal & Tax & VNeID Profile */}
          <div className="lg:col-span-6 p-6 space-y-5 overflow-y-auto max-h-[calc(95vh-140px)]">
            
            {/* 1. VNeID Authentication Card */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-sm border border-slate-700 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Định Danh Điện Tử Quốc Gia VNeID</h3>
                    <p className="text-[11px] text-slate-400">Bộ Công An • Xác thực công dân Mức 2</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    MỨC 2 CHÍNH CHỦ
                  </span>
                  <button 
                    onClick={handleSimulateVneidCheck}
                    disabled={isVerifyingVneid}
                    title="Đối soát lại với VNeID API"
                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isVerifyingVneid && "animate-spin text-emerald-400")} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-white/5 p-3.5 rounded-xl border border-white/10">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Số định danh / CCCD</span>
                  <span className="font-mono font-bold text-white text-sm tracking-wider">{seller.vneid.citizenId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Họ và tên</span>
                  <span className="font-bold text-emerald-300 text-sm uppercase">{seller.vneid.fullName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Ngày sinh / Giới tính</span>
                  <span className="font-medium text-slate-200">{seller.vneid.dob} • {seller.vneid.gender}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Thời gian xác thực</span>
                  <span className="font-mono text-slate-300 text-[11px]">{seller.vneid.verifiedAt}</span>
                </div>
                <div className="col-span-2 pt-1 border-t border-white/10">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Nơi thường trú</span>
                  <span className="text-slate-200 text-xs font-medium">{seller.vneid.permanentAddress}</span>
                </div>
              </div>
            </div>

            {/* 2. Tax & Legal Registration Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Hồ Sơ Thuế & Pháp Lý (Tổng cục Thuế GDT)</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  MST ĐANG HOẠT ĐỘNG
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mã số thuế (MST)</label>
                  <div className="font-mono font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 select-all">
                    {seller.tax.taxCode}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tên đăng ký tại Cơ quan Thuế</label>
                  <div className="font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 truncate" title={seller.tax.registeredName}>
                    {seller.tax.registeredName}
                  </div>
                </div>

                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cơ quan thuế quản lý</label>
                  <div className="text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                    {seller.tax.taxOffice}
                  </div>
                </div>
              </div>

              {/* Legal Tax Rate Policy Card */}
              <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-blue-600" /> 
                    Chính Sách Thuế Áp Dụng: {seller.legalType === 'ENTERPRISE' ? 'Doanh Nghiệp Xuất Hóa Đơn' : 'Khấu Trừ Sàn Kê Khai Thay'}
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-800">
                    {seller.legalType === 'ENTERPRISE' ? 'VAT 8% - 10%' : `Tổng: ${(seller.tax.vatRate + seller.tax.pitRate).toFixed(1)}%`}
                  </span>
                </div>
                
                <p className="text-[11px] text-blue-800/90 leading-relaxed">
                  {seller.legalType === 'ENTERPRISE' ? (
                    <>Doanh nghiệp tự kê khai thuế TNDN và xuất hóa đơn GTGT điện tử trực tiếp cho khách hàng. VComm thu phí dịch vụ sàn và xuất hóa đơn VAT hoa hồng cho DN.</>
                  ) : seller.legalType === 'HOUSEHOLD' ? (
                    <>Hộ kinh doanh nộp thuế theo phương pháp khoán / kê khai. VComm thực hiện khấu trừ và kê khai nộp thay thuế GTGT 1.0% và thuế TNCN 0.5% theo Thông tư 40/2021/TT-BTC.</>
                  ) : (
                    <>Cá nhân kinh doanh được VComm tự động khấu trừ thuế tại nguồn: Thuế GTGT 1.0% + Thuế TNCN 0.5% trên tổng doanh thu đơn hàng hoàn tất.</>
                  )}
                </p>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-200/60 text-xs">
                  <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-500 block">Thuế GTGT</span>
                    <span className="font-bold text-slate-900">{seller.tax.vatRate}%</span>
                  </div>
                  <div className="bg-white/80 p-2 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-500 block">Thuế TNCN</span>
                    <span className="font-bold text-slate-900">{seller.tax.pitRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Bank Account & Identity Matching */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Tài Khoản Ngân Hàng Thanh Toán</h3>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  KHỚP 100% CHÍNH CHỦ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Ngân hàng</span>
                  <div className="font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-200 truncate">
                    {seller.bank.bankName}
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Số tài khoản</span>
                  <div className="font-mono font-bold text-slate-900 bg-slate-50 p-2.5 rounded-xl border border-slate-200 select-all">
                    {seller.bank.accountNumber}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Tên chủ tài khoản</span>
                  <div className="font-bold text-emerald-700 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200">
                    {seller.bank.accountHolder}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Contact & Address */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-2.5 shadow-2xs text-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" /> Thông Tin Liên Lạc & Địa Điểm Kho Hàng
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span>{seller.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 truncate">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{seller.email}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 text-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Địa chỉ kho hàng xuất phát</span>
                <span>{seller.warehouseAddress}</span>
              </div>
            </div>

          </div>

          {/* Right Column: Document Viewer & Compliance Checklist */}
          <div className="lg:col-span-6 p-6 space-y-5 bg-slate-50/60 overflow-y-auto max-h-[calc(95vh-140px)]">
            
            {/* Document Selection Tabs */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  Chứng Từ Định Danh Đã Nộp ({seller.documents.length})
                </h3>
                <span className="text-[11px] text-slate-500">Đã đối soát OCR tự động</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {seller.documents.map((doc, idx) => (
                  <button
                    key={doc.id}
                    onClick={() => {
                      setActiveDocIndex(idx);
                      setZoomLevel(1);
                      setRotation(0);
                    }}
                    className={cn(
                      "px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border cursor-pointer",
                      activeDocIndex === idx
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{doc.title}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  </button>
                ))}
              </div>
            </div>

            {/* Document Viewer Box */}
            {selectedDoc && (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-xs font-bold text-slate-800 truncate">{selectedDoc.fileName}</span>
                    <span className="text-[10px] text-slate-500">({selectedDoc.uploadedAt})</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.5))}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600"
                      title="Phóng to"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600"
                      title="Thu nhỏ"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setRotation(prev => (prev + 90) % 360)}
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600"
                      title="Xoay ảnh"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <a 
                      href={selectedDoc.fileUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600"
                      title="Xem ảnh gốc"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Viewer Canvas */}
                <div className="p-4 bg-slate-900/5 min-h-[260px] max-h-[360px] overflow-auto flex items-center justify-center">
                  <img 
                    src={selectedDoc.fileUrl} 
                    alt={selectedDoc.title}
                    style={{
                      transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                      transition: 'transform 0.2s ease'
                    }}
                    className="max-h-[320px] object-contain rounded-lg shadow-md"
                  />
                </div>

                {/* OCR Data Extraction Accordion */}
                {selectedDoc.ocrData && (
                  <div className="p-3.5 bg-slate-50 border-t border-slate-200 text-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                      Dữ liệu bóc tách OCR tự động:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedDoc.ocrData).map(([k, v]) => (
                        <div key={k} className="bg-white p-2 rounded-lg border border-slate-200">
                          <span className="text-[10px] text-slate-400 block">{k}</span>
                          <span className="font-bold text-slate-800 text-[11px] truncate block">{v}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mandatory Compliance Verification Checklist */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3.5 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                Checklist Thẩm Định Tuân Thủ Bắt Buộc (SLA Compliance)
              </h3>
              <p className="text-[11px] text-slate-500">
                Chuyên viên kiểm duyệt phải tích chọn xác nhận tất cả các tiêu chí trước khi tiến hành kích hoạt gian hàng:
              </p>

              <div className="space-y-2.5 pt-1">
                <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checks.vneidMatched} 
                    onChange={() => toggleCheck('vneidMatched')}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Định danh VNeID Mức 2 chính xác & trùng khớp</span>
                    <span className="text-[10px] text-slate-500">Số CCCD, họ tên, địa chỉ thường trú đã đối soát khớp với Cơ sở dữ liệu quốc gia về dân cư.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checks.taxActive} 
                    onChange={() => toggleCheck('taxActive')}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Mã số thuế hợp lệ và đang hoạt động</span>
                    <span className="text-[10px] text-slate-500">Cổng Tổng cục Thuế ghi nhận MST không bị đóng/khóa, đúng người đại diện pháp luật.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checks.bankMatched} 
                    onChange={() => toggleCheck('bankMatched')}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Tài khoản ngân hàng trùng khớp người đại diện</span>
                    <span className="text-[10px] text-slate-500">Đảm bảo dòng tiền đối soát Payout giải ngân đúng chủ sở hữu, ngăn chặn rửa tiền.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checks.licenseValid} 
                    onChange={() => toggleCheck('licenseValid')}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Giấy phép ĐKKD / Ngành hàng có điều kiện</span>
                    <span className="text-[10px] text-slate-500">Văn bản pháp lý còn hạn sử dụng, rõ con dấu và không có dấu hiệu chỉnh sửa giả mạo.</span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    checked={checks.contractSigned} 
                    onChange={() => toggleCheck('contractSigned')}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Hợp đồng Hợp tác Thương mại Điện tử VComm</span>
                    <span className="text-[10px] text-slate-500">Đã ký số điện tử kèm thỏa thuận chia sẻ dữ liệu doanh thu với cơ quan chức năng.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Commission & Rate Setting */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  Mức Phí Sàn / Chiết Khấu Thiết Lập Cho Gian Hàng:
                </span>
                <span className="text-base font-black text-blue-600 font-mono">{commission}%</span>
              </div>
              <input 
                type="range" 
                min={1} 
                max={15} 
                step={0.5}
                value={commission}
                onChange={e => setCommission(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                <span>Ưu đãi (1%)</span>
                <span>Tiêu chuẩn (5%)</span>
                <span>Cao cấp (15%)</span>
              </div>
            </div>

          </div>
        </div>

        {/* Footer Action Bar */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {allChecksPassed ? (
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Đủ điều kiện phê duyệt & kích hoạt gian hàng
              </span>
            ) : (
              <span className="text-amber-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> Cần tích chọn đủ 5 tiêu chí thẩm định trước khi duyệt
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setActionType('changes')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100 text-xs font-bold transition-all cursor-pointer"
            >
              Yêu cầu Bổ sung Hồ sơ
            </button>

            <button
              onClick={() => setActionType('reject')}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-all cursor-pointer"
            >
              Từ chối Hồ sơ
            </button>

            <button
              onClick={() => setActionType('approve')}
              disabled={!allChecksPassed}
              className={cn(
                "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer",
                allChecksPassed
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 active:scale-95"
                  : "bg-slate-300 cursor-not-allowed text-slate-500 shadow-none"
              )}
            >
              <CheckCircle2 className="w-4 h-4" />
              Phê duyệt & Kích hoạt Gian hàng
            </button>
          </div>
        </div>

      </div>

      {/* Action Sub-Modals (Approve / Reject / Changes) */}
      {actionType !== 'none' && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {actionType === 'approve' && 'Xác nhận Phê duyệt Nhà Bán Hàng'}
                {actionType === 'reject' && 'Từ chối Hồ sơ Đăng ký'}
                {actionType === 'changes' && 'Yêu cầu Bổ sung / Cập nhật Hồ sơ'}
              </h3>
              <button onClick={() => setActionType('none')} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionType === 'approve' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p>Hệ thống sẽ thực hiện các tác vụ sau ngay khi phê duyệt:</p>
                <ul className="list-disc pl-5 space-y-1 font-medium text-slate-700">
                  <li>Kích hoạt tài khoản người bán sang trạng thái <b>ACTIVE</b> trên VComm Seller Centre.</li>
                  <li>Thiết lập mức hoa hồng chiết khấu sàn: <b className="text-blue-600 font-mono">{commission}%</b>.</li>
                  <li>Ghi nhận biểu thuế: <b>GTGT {seller.tax.vatRate}% + TNCN {seller.tax.pitRate}%</b>.</li>
                  <li>Gửi email chúc mừng và thông báo đăng nhập gian hàng tới <b>{seller.email}</b>.</li>
                </ul>
              </div>
            )}

            {actionType === 'reject' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Lý do từ chối hồ sơ (Gửi cho Seller)</label>
                <textarea 
                  rows={3}
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Ví dụ: Giấy phép kinh doanh không khớp thông tin đăng ký, phát hiện dấu hiệu chỉnh sửa ảnh..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>
            )}

            {actionType === 'changes' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Nội dung yêu cầu bổ sung</label>
                <textarea 
                  rows={3}
                  value={requestNotes}
                  onChange={e => setRequestNotes(e.target.value)}
                  placeholder="Ví dụ: Ảnh CCCD mặt sau bị mờ góc số 5, đề nghị quét lại qua VNeID hoặc chụp lại rõ nét..."
                  className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
            )}

            <div className="flex gap-3 pt-3 border-t border-slate-100">
              <button 
                onClick={() => setActionType('none')}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleConfirmAction}
                disabled={isSubmitting}
                className={cn(
                  "flex-1 py-2.5 rounded-xl text-white text-xs font-bold shadow-sm transition-all cursor-pointer",
                  actionType === 'approve' ? "bg-emerald-600 hover:bg-emerald-700" :
                  actionType === 'reject' ? "bg-rose-600 hover:bg-rose-700" :
                  "bg-amber-600 hover:bg-amber-700"
                )}
              >
                {isSubmitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
