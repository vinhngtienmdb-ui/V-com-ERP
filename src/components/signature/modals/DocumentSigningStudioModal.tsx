import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Stamp,
  ShieldCheck,
  UserCheck,
  Server,
  Key,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Check,
  Layers,
  Sparkles,
  Move,
  Info,
  Calendar,
  DollarSign,
  Building,
  RefreshCw,
  QrCode
} from 'lucide-react';
import {
  SigningDocument,
  CompanyHSMProfile,
  PersonalCertificate,
  calculateDocumentHashSHA256
} from '../../../data/hsmSignatureData';
import { formatCurrency, cn } from '../../../lib/utils';

export interface DocumentSigningStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: SigningDocument | null;
  companyHsm: CompanyHSMProfile;
  personalCerts: PersonalCertificate[];
  onSignSuccess: (
    docId: string,
    signaturePayload: {
      signerName: string;
      certSerial: string;
      method: string;
      signedAt: string;
      hashSHA256: string;
      stampPosition: {
        page: number;
        x: number;
        y: number;
        stampType: 'company_stamp' | 'personal_signature' | 'badge_eidas';
      };
      hasInitialStampAllPages: boolean;
    }
  ) => void;
}

type StampType = 'company_stamp' | 'personal_signature' | 'badge_eidas';
type SigningSource = 'company_hsm' | 'personal_cert' | 'usb_token';

export const DocumentSigningStudioModal: React.FC<DocumentSigningStudioModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  companyHsm,
  personalCerts,
  onSignSuccess
}) => {
  // Navigation & Zoom initial values derived from document
  const initialPage = doc?.stampPosition?.page ?? (doc?.totalPages || 1);
  const initialStampType: StampType =
    doc?.stampPosition?.stampType ||
    (doc?.signatureTypeNeeded === 'personal_cert' ? 'personal_signature' : 'company_stamp');

  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [zoom, setZoom] = useState<number>(100);
  const [hasInitialStampAllPages, setHasInitialStampAllPages] = useState<boolean>(true);

  // Stamp selection & Positioning
  const [stampType, setStampType] = useState<StampType>(initialStampType);
  const [stampPosition, setStampPosition] = useState<{
    page: number;
    x: number;
    y: number;
    stampType: StampType;
  }>({
    page: initialPage,
    x: doc?.stampPosition?.x ?? 360,
    y: doc?.stampPosition?.y ?? 680,
    stampType: initialStampType
  });

  // Signer options
  const [signingSource, setSigningSource] = useState<SigningSource>(
    doc?.signatureTypeNeeded === 'personal_cert' ? 'personal_cert' : 'company_hsm'
  );
  const [selectedCertId, setSelectedCertId] = useState<string>(
    personalCerts.find(c => c.status === 'active')?.id || personalCerts[0]?.id || ''
  );
  const [pinCode, setPinCode] = useState<string>('123456');
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const paperRef = useRef<HTMLDivElement>(null);

  // Synchronize state when document prop changes
  useEffect(() => {
    if (doc) {
      const page = doc.stampPosition?.page ?? (doc.totalPages || 1);
      setCurrentPage(page);
      const st: StampType =
        doc.stampPosition?.stampType ||
        (doc.signatureTypeNeeded === 'personal_cert' ? 'personal_signature' : 'company_stamp');
      setStampType(st);
      setStampPosition({
        page,
        x: doc.stampPosition?.x ?? 360,
        y: doc.stampPosition?.y ?? 680,
        stampType: st
      });
      if (doc.signatureTypeNeeded === 'personal_cert') {
        setSigningSource('personal_cert');
      } else {
        setSigningSource('company_hsm');
      }
      setPinCode('123456');
      setErrorMsg(null);
      setOtpSentNotice(null);
    }
  }, [doc]);

  // Sync stampType in position state
  useEffect(() => {
    setStampPosition(prev => ({
      ...prev,
      stampType
    }));
  }, [stampType]);

  // ESC key handler
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

  // Selected personal certificate
  const selectedCert = useMemo(() => {
    return personalCerts.find(c => c.id === selectedCertId) || personalCerts[0];
  }, [personalCerts, selectedCertId]);

  // Check authority limit
  const isAuthorityExceeded = useMemo(() => {
    if (signingSource !== 'personal_cert') return false;
    if (!doc?.amount) return false;
    if (!selectedCert) return false;
    // signingLimitVND = 0 means unlimited
    if (selectedCert.signingLimitVND === 0) return false;
    return doc.amount > selectedCert.signingLimitVND;
  }, [signingSource, doc?.amount, selectedCert]);

  if (!isOpen || !doc) return null;

  const totalPages = doc.totalPages || (doc.pagesContent?.length ?? 1);
  const currentPageData = doc.pagesContent?.find(p => p.pageNumber === currentPage);

  // Handle click on canvas paper to place stamp
  const handlePaperClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!paperRef.current) return;
    const rect = paperRef.current.getBoundingClientRect();
    const scale = zoom / 100;

    // Coordinate relative to paper taking scale into account
    const rawX = (e.clientX - rect.left) / scale;
    const rawY = (e.clientY - rect.top) / scale;

    // Clamp coordinates within paper boundary (640px width, 880px height approx)
    const clampedX = Math.round(Math.max(20, Math.min(rawX - 90, 460)));
    const clampedY = Math.round(Math.max(30, Math.min(rawY - 60, 780)));

    setStampPosition({
      page: currentPage,
      x: clampedX,
      y: clampedY,
      stampType
    });
  };

  // Preset positioning shortcuts
  const handleApplyPreset = (preset: 'bottom_right' | 'bottom_left' | 'center') => {
    let x = 360;
    let y = 680;
    if (preset === 'bottom_left') {
      x = 40;
      y = 680;
    } else if (preset === 'center') {
      x = 220;
      y = 480;
    }
    setStampPosition({
      page: currentPage,
      x,
      y,
      stampType
    });
  };

  // Handle OTP request simulation
  const handleSendOTP = () => {
    setOtpSentNotice(`Mã OTP đã được gửi bảo mật về ứng dụng SmartCA của ${selectedCert?.fullName || 'cán bộ'}!`);
    setTimeout(() => {
      setOtpSentNotice(null);
    }, 4500);
  };

  // Execute signing
  const handleExecuteSigning = () => {
    if (isAuthorityExceeded) {
      setErrorMsg('Vượt quá hạn mức ký! Vui lòng chọn Cloud HSM hoặc chuyển cấp phê duyệt cấp cao hơn.');
      return;
    }

    if (!pinCode || pinCode.length < 4) {
      setErrorMsg('Vui lòng nhập mã PIN bảo mật hợp lệ (ít nhất 4 số).');
      return;
    }

    setIsSigning(true);
    setErrorMsg(null);

    // Calculate deterministic SHA-256 hash
    const hashSHA256 = calculateDocumentHashSHA256(doc, pinCode);

    let signerName = companyHsm.companyName;
    let certSerial = companyHsm.serialNumber;
    let method = 'Cloud HSM (FIPS 140-2 Level 3)';

    if (signingSource === 'personal_cert') {
      signerName = selectedCert?.fullName || 'Cán bộ VComm';
      certSerial = selectedCert?.serialNumber || 'PERSONAL-CA-DEFAULT';
      method = `SmartCA Cloud (${selectedCert?.algorithm || 'RSA 2048-bit'})`;
    } else if (signingSource === 'usb_token') {
      signerName = `${companyHsm.companyName} (PKCS#11)`;
      certSerial = 'USB-TOKEN-HARDWARE-01';
      method = 'USB Token Cục Bộ PKCS#11';
    }

    const payload = {
      signerName,
      certSerial,
      method,
      signedAt: new Date().toISOString(),
      hashSHA256,
      stampPosition,
      hasInitialStampAllPages
    };

    // Realistic cryptographic signing delay
    setTimeout(() => {
      setIsSigning(false);
      onSignSuccess(doc.id, payload);
      onClose();
    }, 400);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="signing-studio-title"
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col animate-in fade-in duration-200"
    >
      {/* Top Header Bar */}
      <header className="h-16 px-6 bg-slate-900 border-b border-slate-800 text-white flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="truncate">
            <div className="flex items-center gap-2">
              <h1 id="signing-studio-title" className="text-base font-bold text-white truncate max-w-xl">
                {doc.title}
              </h1>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                {doc.docCode}
              </span>
              {doc.priority === 'urgent' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wide">
                  Hỏa tốc
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span>{doc.department}</span>
              <span>•</span>
              <span>Kích thước: {doc.fileSize}</span>
              <span>•</span>
              <span>Tổng số: {totalPages} trang</span>
              {doc.amount && doc.amount > 0 && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-emerald-400 font-mono">
                    Giá trị: {formatCurrency(doc.amount)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Bàn ký số tương tác v2.5</span>
          </div>

          <button
            onClick={onClose}
            aria-label="Đóng bàn ký"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Đóng (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Studio Split-View */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column (70%): Canvas & Document Viewer */}
        <section aria-label="Khu vực tài liệu ký số" className="flex-[7] flex flex-col bg-slate-950 min-w-0 border-r border-slate-800/80">
          {/* Viewer Toolbar */}
          <div className="h-13 px-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0 select-none">
            {/* Page navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                aria-label="Trang trước"
                className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-300"
                title="Trang trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium text-slate-200 min-w-[90px] text-center font-mono">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                aria-label="Trang sau"
                className="p-1.5 rounded-md hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-slate-300"
                title="Trang sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1.5 bg-slate-800/60 p-1 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setZoom(z => Math.max(50, z - 10))}
                aria-label="Thu nhỏ"
                className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Thu nhỏ"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono font-semibold text-slate-200 text-[11px] min-w-[45px] text-center">
                {zoom}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(150, z + 10))}
                aria-label="Phóng to"
                className="p-1 rounded hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="Phóng to"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(100)}
                aria-label="Đặt lại thu phóng"
                className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors ml-0.5"
                title="Đặt lại 100%"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Stamp Style Toggle */}
            <div className="hidden lg:flex items-center gap-1 bg-slate-800/70 p-1 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setStampType('company_stamp')}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5',
                  stampType === 'company_stamp'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Building className="w-3 h-3" />
                <span>Dấu Đỏ Pháp Nhân</span>
              </button>
              <button
                onClick={() => setStampType('personal_signature')}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5',
                  stampType === 'personal_signature'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <UserCheck className="w-3 h-3" />
                <span>Chữ Ký Tay Số</span>
              </button>
              <button
                onClick={() => setStampType('badge_eidas')}
                className={cn(
                  'px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1.5',
                  stampType === 'badge_eidas'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Tem Số eIDAS</span>
              </button>
            </div>

            {/* Initial Stamp Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHasInitialStampAllPages(prev => !prev)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-all',
                  hasInitialStampAllPages
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-300'
                )}
                title="Đóng con dấu nháy bảo mật giáp lai ở góc dưới tất cả các trang"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ký Nháy Giáp Lai</span>
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    hasInitialStampAllPages ? 'bg-emerald-400' : 'bg-slate-500'
                  )}
                />
              </button>
            </div>
          </div>

          {/* Quick presets & coordinate info bar */}
          <div className="h-8 px-5 bg-slate-900/50 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Vị trí con dấu:</span>
              <span className="font-mono text-indigo-300">
                Trang {stampPosition.page} (X: {stampPosition.x}px, Y: {stampPosition.y}px)
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 italic">Click vào trang để đặt dấu</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Vị trí chuẩn:</span>
              <button
                onClick={() => handleApplyPreset('bottom_right')}
                className="hover:text-indigo-300 underline cursor-pointer"
              >
                Góc dưới phải (Chuẩn)
              </button>
              <span>•</span>
              <button
                onClick={() => handleApplyPreset('bottom_left')}
                className="hover:text-indigo-300 underline cursor-pointer"
              >
                Góc dưới trái
              </button>
              <span>•</span>
              <button
                onClick={() => handleApplyPreset('center')}
                className="hover:text-indigo-300 underline cursor-pointer"
              >
                Chính giữa
              </button>
            </div>
          </div>

          {/* Canvas Scrollable Viewport */}
          <div className="flex-1 overflow-auto bg-slate-950 p-6 flex justify-center items-start relative select-none">
            {/* Paper Canvas */}
            <div
              ref={paperRef}
              onClick={handlePaperClick}
              data-testid="document-paper-canvas"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                width: '640px',
                minHeight: '880px'
              }}
              className="bg-white text-slate-900 shadow-2xl rounded-sm p-10 relative cursor-crosshair transition-transform border border-slate-300 shrink-0 mb-12"
            >
              {/* Paper Watermark / Header */}
              <div className="text-center border-b border-slate-200 pb-5 mb-6">
                <p className="text-[11px] font-bold tracking-widest text-slate-700 uppercase">
                  CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                </p>
                <p className="text-[10px] text-slate-600 underline font-semibold mt-0.5">
                  Độc lập - Tự do - Hạnh phúc
                </p>
                <div className="mt-4 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-mono">Số: {doc.docCode}</span>
                  <span>TP. Hồ Chí Minh, ngày {doc.createdDate}</span>
                </div>
              </div>

              {/* Document Content Display */}
              <div className="space-y-4 text-xs leading-relaxed text-slate-800">
                {currentPageData ? (
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 mb-3 text-center uppercase tracking-wide">
                      {currentPageData.title}
                    </h2>
                    <div className="space-y-3">
                      {currentPageData.paragraphs.map((p, idx) => (
                        <p key={idx} className="text-justify indent-4 leading-relaxed">
                          {p}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h2 className="text-sm font-bold text-slate-900 mb-3 text-center uppercase">
                      {doc.title} (Trang {currentPage})
                    </h2>
                    <p className="text-justify indent-4">
                      Căn cứ Bộ luật Dân sự số 91/2015/QH13 và Luật Giao dịch Điện tử số 20/2023/QH15 của Quốc hội
                      nước Cộng hòa Xã hội Chủ nghĩa Việt Nam.
                    </p>
                    <p className="text-justify indent-4">
                      Các bên nhất trí ký kết văn bản pháp lý điện tử với đầy đủ điều khoản và giá trị ràng buộc.
                      Văn bản được xác thực bằng mật mã học bất đối xứng tiêu chuẩn FIPS 140-2 Level 3 và Cloud HSM.
                    </p>
                    {doc.amount && (
                      <p className="font-semibold text-slate-900 indent-4">
                        Tổng giá trị giao dịch ghi nhận: {formatCurrency(doc.amount)} (bằng chữ: Đã xác thực theo
                        nguyên tắc kế toán VComm).
                      </p>
                    )}
                    <p className="text-justify indent-4">
                      Văn bản này có hiệu lực kể từ thời điểm chữ ký số hợp lệ được gắn nhãn thời gian TSA thành công.
                    </p>
                  </div>
                )}
              </div>

              {/* Interactive Stamp Box placed on Current Page */}
              {stampPosition.page === currentPage && (
                <div
                  data-testid="interactive-stamp-box"
                  style={{
                    position: 'absolute',
                    left: `${stampPosition.x}px`,
                    top: `${stampPosition.y}px`
                  }}
                  className="z-20 cursor-move border-2 border-dashed border-indigo-500/80 bg-indigo-50/10 p-1.5 rounded-lg shadow-lg group hover:border-indigo-600 transition-all"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="absolute -top-6 left-0 bg-indigo-600 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow flex items-center gap-1 whitespace-nowrap opacity-80 group-hover:opacity-100 transition-opacity">
                    <Move className="w-2.5 h-2.5" />
                    <span>
                      Vị trí ({stampPosition.x}, {stampPosition.y})
                    </span>
                  </div>

                  {/* Stamp Rendering */}
                  {stampType === 'company_stamp' && (
                    <div
                      data-testid="rendered-company-stamp"
                      className="w-40 h-40 rounded-full border-4 border-rose-600 text-rose-600 flex flex-col items-center justify-between p-2.5 text-center relative select-none shadow-sm -rotate-2"
                      style={{
                        backgroundColor: 'rgba(254, 242, 242, 0.45)'
                      }}
                    >
                      <div className="text-[7.5px] font-black tracking-tight uppercase leading-tight pt-1 px-1">
                        CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM
                      </div>
                      <div className="my-auto flex flex-col items-center">
                        <span className="text-sm">★</span>
                        <div className="text-[8px] font-extrabold tracking-wide">
                          MST: {companyHsm.taxCode}
                        </div>
                        <div className="text-[7px] font-bold text-rose-700">CLOUD HSM SECURE</div>
                      </div>
                      <div className="text-[7.5px] font-black tracking-wider uppercase pb-0.5">
                        ★ TP. HỒ CHÍ MINH ★
                      </div>
                    </div>
                  )}

                  {stampType === 'personal_signature' && (
                    <div
                      data-testid="rendered-personal-signature"
                      className="w-48 bg-white/90 border border-slate-300 rounded-lg p-3 shadow-md text-slate-800"
                    >
                      <div className="border-b border-slate-200 pb-1.5 mb-1.5">
                        <div className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                          Đã ký điện tử bởi
                        </div>
                        <div className="font-serif italic text-base font-bold text-blue-900 tracking-wide mt-0.5">
                          {selectedCert?.fullName || 'Trần Minh Đức'}
                        </div>
                        <div className="text-[9px] text-slate-600 font-medium">
                          {selectedCert?.title || 'Đại diện thẩm quyền'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[8px] text-emerald-700 font-medium">
                        <span className="flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          SmartCA Verified
                        </span>
                        <span className="font-mono text-slate-500">
                          {new Date().toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>
                  )}

                  {stampType === 'badge_eidas' && (
                    <div
                      data-testid="rendered-badge-eidas"
                      className="w-56 bg-slate-900 text-white rounded-lg p-2.5 shadow-xl border border-cyan-500/40 text-[9px]"
                    >
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                        <div className="flex items-center gap-1 text-cyan-400 font-bold uppercase tracking-wider text-[8px]">
                          <ShieldCheck className="w-3 h-3" />
                          <span>eIDAS / FIPS 140-2 Level 3</span>
                        </div>
                        <QrCode className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="space-y-0.5 text-[8.5px] text-slate-300">
                        <p className="truncate font-semibold text-white">
                          Ký bởi: {signingSource === 'company_hsm' ? companyHsm.companyName : selectedCert?.fullName}
                        </p>
                        <p className="text-slate-400 font-mono text-[8px] truncate">
                          Serial: {signingSource === 'company_hsm' ? companyHsm.serialNumber : selectedCert?.serialNumber}
                        </p>
                        <p className="text-emerald-400 flex items-center gap-1 text-[8px]">
                          <Check className="w-2.5 h-2.5" />
                          Đã đóng dấu thời gian TSA RFC 3161
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Initial Stamp on All Pages (Bottom Right of Paper) */}
              {hasInitialStampAllPages && (
                <div
                  data-testid="rendered-initial-stamp"
                  className="absolute bottom-6 right-8 border border-emerald-600/70 bg-emerald-50/70 text-emerald-800 px-2 py-1 rounded text-[8px] font-mono font-bold flex items-center gap-1 shadow-sm select-none"
                >
                  <Stamp className="w-2.5 h-2.5 text-emerald-600" />
                  <span>KÝ NHÁY GIÁP LAI • VCOMM-CA • P.{currentPage}</span>
                </div>
              )}

              {/* Page Numbering on Paper Footer */}
              <div className="absolute bottom-3 left-0 right-0 text-center text-[10px] text-slate-400 font-mono">
                Trang {currentPage} / {totalPages}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column (30%): Signer Control Panel */}
        <aside aria-label="Bảng điều khiển ký số" className="flex-[3] w-96 min-w-[320px] max-w-[420px] bg-slate-900 border-l border-slate-800 flex flex-col justify-between overflow-y-auto text-slate-200">
          <div className="p-5 space-y-5">
            {/* Header info */}
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span>Thiết Lập Chữ Ký & Thẩm Quyền</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Chọn nguồn khóa mật mã và kiểm tra hạn mức theo quy chế doanh nghiệp.
              </p>
            </div>

            {/* Signing Source Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Nguồn chữ ký số mật mã học:
              </label>

              {/* Option 1: Company Cloud HSM */}
              <div
                onClick={() => {
                  setSigningSource('company_hsm');
                  setStampType('company_stamp');
                  setErrorMsg(null);
                }}
                className={cn(
                  'p-3 rounded-xl border text-xs cursor-pointer transition-all',
                  signingSource === 'company_hsm'
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                    : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800/70 hover:border-slate-600'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Cloud HSM Doanh nghiệp</div>
                      <div className="text-[10px] text-slate-400">
                        {companyHsm.provider} • Slot: {companyHsm.slotId}
                      </div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Pháp nhân
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Tốc độ: {companyHsm.tpsSpeed} TPS</span>
                  <span className="text-indigo-300 font-mono">
                    Còn {companyHsm.remainingSignatures.toLocaleString()} lượt
                  </span>
                </div>
              </div>

              {/* Option 2: SmartCA Personal Cert */}
              <div
                onClick={() => {
                  setSigningSource('personal_cert');
                  setStampType('personal_signature');
                  setErrorMsg(null);
                }}
                className={cn(
                  'p-3 rounded-xl border text-xs cursor-pointer transition-all',
                  signingSource === 'personal_cert'
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                    : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800/70 hover:border-slate-600'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">Chứng thư Cá nhân SmartCA</div>
                      <div className="text-[10px] text-slate-400">Ký duyệt theo phân quyền chức danh</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    SmartCA
                  </span>
                </div>

                {/* Sub-selector for Personal Certificate */}
                {signingSource === 'personal_cert' && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2">
                    <label className="text-[11px] font-medium text-slate-300 block">
                      Chọn cán bộ ký số:
                    </label>
                    <select
                      value={selectedCertId}
                      onChange={e => setSelectedCertId(e.target.value)}
                      aria-label="Chọn cán bộ ký số"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    >
                      {personalCerts.map(cert => (
                        <option key={cert.id} value={cert.id}>
                          {cert.fullName} — {cert.title} ({cert.department})
                        </option>
                      ))}
                    </select>

                    {selectedCert && (
                      <div className="bg-slate-900/80 rounded-lg p-2.5 border border-slate-700/70 text-[11px] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Chức vụ:</span>
                          <span className="font-medium text-slate-200">{selectedCert.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Hạn mức phê duyệt:</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            {selectedCert.signingLimitVND === 0
                              ? 'Không giới hạn'
                              : formatCurrency(selectedCert.signingLimitVND)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Thuật toán:</span>
                          <span className="font-mono text-slate-300">{selectedCert.algorithm}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Option 3: Local USB Token */}
              <div
                onClick={() => {
                  setSigningSource('usb_token');
                  setStampType('badge_eidas');
                  setErrorMsg(null);
                }}
                className={cn(
                  'p-3 rounded-xl border text-xs cursor-pointer transition-all',
                  signingSource === 'usb_token'
                    ? 'bg-indigo-950/40 border-indigo-500 shadow-md ring-1 ring-indigo-500/40'
                    : 'bg-slate-800/40 border-slate-700/80 hover:bg-slate-800/70 hover:border-slate-600'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-white">USB Token Cục Bộ</div>
                      <div className="text-[10px] text-slate-400">PKCS#11 WebCrypto Hardware Device</div>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Hardware
                  </span>
                </div>
              </div>
            </div>

            {/* Authority Limit Warning Alert */}
            {isAuthorityExceeded && doc.amount && selectedCert && (
              <div
                data-testid="authority-limit-warning"
                className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1.5 animate-in slide-in-from-top-1"
              >
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>CẢNH BÁO VƯỢT THẨM QUYỀN KÝ</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-200">
                  Giá trị tài liệu ({formatCurrency(doc.amount)}) vượt quá hạn mức tối đa (
                  {formatCurrency(selectedCert.signingLimitVND)}) của cán bộ{' '}
                  <strong className="text-white">{selectedCert.fullName}</strong>.
                </p>
                <p className="text-[10px] text-rose-300 font-medium">
                  → Vui lòng chuyển cấp phê duyệt Tổng Giám Đốc hoặc chuyển sang phương thức Cloud HSM Pháp Nhân.
                </p>
              </div>
            )}

            {/* PIN Code / OTP Input Section */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label htmlFor="hsm-pin-input" className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Mã PIN Mật Mã (6 số):</span>
                </label>
                {signingSource === 'personal_cert' && (
                  <button
                    type="button"
                    onClick={handleSendOTP}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    Nhận OTP SmartCA
                  </button>
                )}
              </div>

              <input
                id="hsm-pin-input"
                type="password"
                maxLength={6}
                value={pinCode}
                onChange={e => setPinCode(e.target.value)}
                placeholder="Nhập 6 số PIN (mặc định: 123456)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-center text-sm font-mono tracking-widest text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />

              {otpSentNotice && (
                <div className="text-[11px] text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{otpSentNotice}</span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px] flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Security Guarantee Note */}
            <div className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center gap-1 text-slate-300 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Tiêu chuẩn bảo mật pháp lý:</span>
              </div>
              <p>• Mã băm SHA-256 xác thực tính toàn vẹn 100%.</p>
              <p>• Dán nhãn thời gian TSA chuẩn RFC 3161.</p>
              <p>• Chống chối bỏ theo Luật Giao dịch Điện tử số 20/2023/QH15.</p>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2">
            <button
              onClick={handleExecuteSigning}
              disabled={isSigning || isAuthorityExceeded}
              className={cn(
                'w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer',
                isAuthorityExceeded
                  ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white shadow-indigo-500/25 active:scale-[0.98]'
              )}
            >
              {isSigning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang Ký Số Mật Mã Học...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Xác Nhận Ký Số Mật Mã Học</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              disabled={isSigning}
              className="w-full py-2 px-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
            >
              Hủy Bỏ
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};
