import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  X,
  FileCheck,
  Building,
  UserCheck,
  Layers,
  AlertCircle,
  Sparkles,
  DollarSign,
  File,
  CheckCircle2
} from 'lucide-react';
import { SigningDocument } from '../../../data/hsmSignatureData';
import { formatCurrency, cn } from '../../../lib/utils';

export interface NewDocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddDocument: (newDoc: SigningDocument) => void;
}

export const NewDocumentUploadModal: React.FC<NewDocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onAddDocument
}) => {
  // Form fields
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState<SigningDocument['docType']>('contract');
  const [category, setCategory] = useState<SigningDocument['category']>('contract');
  const [amount, setAmount] = useState<string>('');
  const [priority, setPriority] = useState<SigningDocument['priority']>('normal');
  const [requestedBy, setRequestedBy] = useState('Nguyễn Văn A (Phòng Pháp chế)');
  const [department, setDepartment] = useState('Pháp chế & Tuân thủ');
  const [signatureTypeNeeded, setSignatureTypeNeeded] = useState<SigningDocument['signatureTypeNeeded']>('both');

  // File upload state
  const [uploadedFileName, setUploadedFileName] = useState<string>('Hop-dong-thuong-mai-mau-2026.pdf');
  const [uploadedFileSize, setUploadedFileSize] = useState<string>('1.2 MB');
  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync category when docType changes
  const handleDocTypeChange = (type: SigningDocument['docType']) => {
    setDocType(type);
    switch (type) {
      case 'contract':
        setCategory('contract');
        if (!title || title.includes('Văn bản')) setTitle('Hợp đồng cung cấp dịch vụ logistics TMĐT 2026');
        break;
      case 'invoice':
        setCategory('e_invoice');
        if (!title || title.includes('Văn bản')) setTitle('Hóa đơn điện tử GTGT tiền cước vận chuyển tháng 09');
        break;
      case 'warehouse':
        setCategory('warehouse_slip');
        if (!title || title.includes('Văn bản')) setTitle('Phiếu xuất kho chuyển giao thiết bị POS & Smart Terminal');
        break;
      case 'request':
        setCategory('request');
        if (!title || title.includes('Văn bản')) setTitle('Tờ trình đề nghị thanh toán hạ tầng máy chủ GPU Cloud');
        break;
      case 'decision':
        setCategory('internal_decision');
        if (!title || title.includes('Văn bản')) setTitle('Quyết định bổ nhiệm cán bộ quản lý cụm kho VComm FBL');
        break;
    }
  };

  // Esc key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset form only on unmount or close if needed


  if (!isOpen) return null;

  // File drag & drop handling
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setUploadedFileName(file.name);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadedFileSize(`${sizeMB} MB`);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFileName(file.name);
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadedFileSize(`${sizeMB} MB`);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề văn bản.');
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const prefixMap: Record<SigningDocument['docType'], string> = {
      contract: 'HD',
      invoice: 'HDDT',
      warehouse: 'PXK',
      request: 'DNTC',
      decision: 'QD'
    };
    const docCode = `${prefixMap[docType]}-2026-${randomSuffix}`;

    const numAmount = amount ? Number(amount) : undefined;

    // Generate rich 2-page document mock content
    const pagesContent = [
      {
        pageNumber: 1,
        title: `Trang 1: Thông tin căn cứ & Mục đích (${title})`,
        paragraphs: [
          'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM — Độc lập - Tự do - Hạnh phúc',
          `VĂN BẢN ĐIỆN TỬ VCOMM CORPORATION — SỐ: ${docCode}`,
          `Hôm nay, ngày ${new Date().toLocaleDateString('vi-VN')}, tại Văn phòng Công ty Cổ phần Thương mại Điện tử VComm.`,
          `Căn cứ thẩm quyền được giao và quy chế ký duyệt điện tử nội bộ của Doanh nghiệp. Đơn vị đề xuất: ${department}, người phụ trách: ${requestedBy}.`,
          `Nội dung: ${title}. Toàn bộ căn cứ và điều khoản được các bên kiểm tra đối soát pháp lý trước khi đưa vào luồng ký số mật mã học FIPS 140-2.`
        ]
      },
      {
        pageNumber: 2,
        title: `Trang 2: Cam kết thi hành & Phê duyệt ký số`,
        paragraphs: [
          `Điều khoản tài chính: ${numAmount ? `Tổng giá trị giao dịch là ${formatCurrency(numAmount)}` : 'Văn bản không phát sinh nghĩa vụ thanh toán tiền mặt trực tiếp'}.`,
          'Các bên cam kết chịu trách nhiệm toàn vẹn trước pháp luật theo Luật Giao dịch Điện tử số 20/2023/QH15.',
          'Văn bản có giá trị pháp lý tương đương bản giấy có đóng dấu mộc đỏ, được lưu trữ vĩnh viễn trên hệ thống Cloud HSM Vault của VComm.',
          'ĐẠI DIỆN CÁC BÊN THAM GIA XÁC NHẬN KÝ DUYỆT TẠI KHUNG DƯỚI ĐÂY:'
        ]
      }
    ];

    const newDoc: SigningDocument = {
      id: `DOC-${Date.now()}`,
      docCode,
      title: title.trim(),
      docType,
      category,
      requestedBy: requestedBy.trim(),
      department: department.trim(),
      createdDate: new Date().toLocaleDateString('vi-VN'),
      amount: numAmount,
      priority: priority || 'normal',
      status: 'pending',
      signatureTypeNeeded,
      fileSize: uploadedFileSize || '1.1 MB',
      totalPages: 2,
      pagesContent,
      stampPosition: {
        page: 2,
        x: 360,
        y: 680,
        stampType: signatureTypeNeeded === 'personal_cert' ? 'personal_signature' : 'company_stamp'
      },
      isBatchEligible: docType === 'invoice' || docType === 'warehouse'
    };

    onAddDocument(newDoc);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl text-slate-100 shadow-2xl overflow-hidden flex flex-col my-8">
        {/* Header */}
        <header className="px-6 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <UploadCloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="upload-modal-title" className="text-base font-bold text-white">
                Tải Lên Văn Bản Mới & Khởi Tạo Luồng Ký
              </h2>
              <p className="text-xs text-slate-400">
                Hỗ trợ tệp tin PDF, DOCX, XLSX bảo mật toàn vẹn SHA-256
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* File Upload Dropzone */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Tệp tài liệu cần ký:
            </label>
            <div
              onDragOver={e => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2',
                isDragging
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-slate-700 bg-slate-950/50 hover:border-slate-600 hover:bg-slate-950'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.doc,.xlsx"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                <File className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-slate-200">
                  {uploadedFileName ? (
                    <span className="text-indigo-400 font-mono">{uploadedFileName}</span>
                  ) : (
                    'Kéo thả tệp vào đây hoặc nhấn để duyệt file'
                  )}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Dung lượng: {uploadedFileSize} • Định dạng PDF, Word, Excel (Tối đa 25MB)
                </p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="doc-title-input" className="text-xs font-semibold text-slate-300 block mb-1.5">
              Tiêu đề văn bản <span className="text-rose-400">*</span>:
            </label>
            <input
              id="doc-title-input"
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="VD: Hợp đồng phân phối dịch vụ sàn TMĐT VComm 2026"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* DocType & Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="doc-type-select" className="text-xs font-semibold text-slate-300 block mb-1.5">
                Phân loại văn bản:
              </label>
              <select
                id="doc-type-select"
                value={docType}
                onChange={e => handleDocTypeChange(e.target.value as SigningDocument['docType'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="contract">Hợp đồng kinh tế / Hợp đồng lao động</option>
                <option value="invoice">Hóa đơn điện tử GTGT (e-Invoice)</option>
                <option value="warehouse">Phiếu xuất / nhập kho FBL</option>
                <option value="request">Tờ trình / Đề nghị thanh toán</option>
                <option value="decision">Quyết định nội bộ / Quy chế</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Mức độ ưu tiên:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['normal', 'high', 'urgent'] as const).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={cn(
                      'py-2 px-1 rounded-lg border text-center font-medium capitalize text-[11px] transition-all',
                      priority === p
                        ? p === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 ring-1 ring-rose-500/40'
                          : p === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 ring-1 ring-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 ring-1 ring-indigo-500/40'
                        : 'bg-slate-950/60 border-slate-700 text-slate-400 hover:text-slate-300'
                    )}
                  >
                    {p === 'normal' ? 'Bình thường' : p === 'high' ? 'Ưu tiên cao' : 'Hỏa tốc'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Value (Amount) */}
          <div>
            <label htmlFor="doc-amount-input" className="text-xs font-semibold text-slate-300 block mb-1.5">
              Giá trị tài chính (VNĐ, nếu có):
            </label>
            <div className="relative">
              <input
                id="doc-amount-input"
                type="number"
                min="0"
                step="1000000"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="Nhập số tiền (VD: 150000000)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              {amount && Number(amount) > 0 && (
                <div className="absolute right-3 top-2.5 text-xs font-semibold text-emerald-400 font-mono">
                  {formatCurrency(Number(amount))}
                </div>
              )}
            </div>
          </div>

          {/* Requester & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="doc-requester-input" className="text-xs font-semibold text-slate-300 block mb-1.5">
                Người khởi tạo:
              </label>
              <input
                id="doc-requester-input"
                type="text"
                value={requestedBy}
                onChange={e => setRequestedBy(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="doc-department-input" className="text-xs font-semibold text-slate-300 block mb-1.5">
                Phòng ban:
              </label>
              <input
                id="doc-department-input"
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Required Signature Type */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Yêu cầu loại chữ ký số:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSignatureTypeNeeded('company_hsm')}
                className={cn(
                  'p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all',
                  signatureTypeNeeded === 'company_hsm'
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40 text-white'
                    : 'bg-slate-950/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                )}
              >
                <Building className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Chỉ dấu Pháp nhân</div>
                  <div className="text-[10px] text-slate-400">Cloud HSM VComm</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSignatureTypeNeeded('personal_cert')}
                className={cn(
                  'p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all',
                  signatureTypeNeeded === 'personal_cert'
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40 text-white'
                    : 'bg-slate-950/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                )}
              >
                <UserCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Chỉ Chữ ký Cá nhân</div>
                  <div className="text-[10px] text-slate-400">SmartCA Cán bộ</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSignatureTypeNeeded('both')}
                className={cn(
                  'p-2.5 rounded-xl border text-left flex items-start gap-2 transition-all',
                  signatureTypeNeeded === 'both'
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/40 text-white'
                    : 'bg-slate-950/60 border-slate-700/80 text-slate-400 hover:text-slate-200'
                )}
              >
                <Layers className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-white">Cả Hai Hình Thức</div>
                  <div className="text-[10px] text-slate-400">Dấu HSM + Chữ ký</div>
                </div>
              </button>
            </div>
          </div>

          {/* Error notice */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-lg shadow-indigo-500/25 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tạo & Đưa Vào Bàn Ký</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
