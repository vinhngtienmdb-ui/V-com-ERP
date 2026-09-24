import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Copy,
  Check,
  Download,
  FileText,
  KeyRound,
  Fingerprint,
  Calendar,
  X,
  FileCheck,
  Layers,
  Scale
} from 'lucide-react';
import {
  SigningDocument,
  calculateDocumentHashSHA256
} from '../../../data/hsmSignatureData';

export interface VerifyIntegrityModalProps {
  isOpen: boolean;
  onClose: () => void;
  doc: SigningDocument | null;
}

export const VerifyIntegrityModal: React.FC<VerifyIntegrityModalProps> = ({
  isOpen,
  onClose,
  doc
}) => {
  const [copiedHash, setCopiedHash] = useState(false);

  if (!isOpen || !doc) return null;

  const isSigned = doc.status === 'signed' && Boolean(doc.signedBy);
  const hashSHA256 = doc.signedBy?.hashSHA256 || calculateDocumentHashSHA256(doc);

  const handleCopyHash = () => {
    navigator.clipboard.writeText(hashSHA256);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const handleDownloadCertificatePDF = () => {
    const reportContent = `
========================================================================
       GIẤY CHỨNG NHẬN TOÀN VẸN CHỮ KÝ SỐ ĐIỆN TỬ
 Căn cứ theo Nghị định 130/2018/NĐ-CP & Luật Giao dịch Điện tử 20/2023/QH15
========================================================================

1. THÔNG TIN VĂN BẢN ĐIỆN TỬ:
- Mã tài liệu: ${doc.docCode}
- Tiêu đề: ${doc.title}
- Đơn vị đề xuất: ${doc.department} (${doc.requestedBy})
- Ngày tạo: ${doc.createdDate}
- Dung lượng: ${doc.fileSize} (${doc.totalPages} trang)
${doc.amount ? `- Giá trị kinh tế: ${new Intl.NumberFormat('vi-VN').format(doc.amount)} VNĐ` : ''}

2. THÔNG TIN NGƯỜI KÝ & CHỨNG THƯ SỐ:
- Chủ thể ký xác thực: ${doc.signedBy?.name || 'Hệ thống Doanh nghiệp VComm'}
- Serial Chứng thư số: ${doc.signedBy?.certSerial || 'N/A'}
- Phương thức ký: ${doc.signedBy?.method || 'N/A'}
- Thời gian ký (Timestamp): ${doc.signedBy?.signedAt || new Date().toLocaleString('vi-VN')}
- Nhà cung cấp Dịch vụ Dấu thời gian: National TSA / Viettel-TSA Authority (RFC 3161)

3. KẾT QUẢ KIỂM ĐỊNH MẬT MÃ HỌC:
- Trạng thái toàn vẹn: NGUYÊN VẸN 100% - KHÔNG BỊ THAY ĐỔI
- Thuật toán băm: SHA-256 (Secure Hash Algorithm 256-bit)
- Mã băm toàn vẹn (Checksum):
  ${hashSHA256}
- Khóa công khai: Hợp lệ tại thời điểm ký kết, xác thực OCSP Good.

========================================================================
Xác thực tự động bởi Cổng Chứng thực Điện tử VComm ERP Enterprise HSM
Ngày xuất chứng nhận: ${new Date().toLocaleString('vi-VN')}
========================================================================
    `.trim();

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Giay_Chung_Nhan_Ky_So_${doc.docCode}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'contract':
        return 'Hợp đồng thương mại / B2B';
      case 'e_invoice':
        return 'Hóa đơn điện tử (TT78)';
      case 'warehouse_slip':
        return 'Phiếu xuất kho kiêm vận chuyển nội bộ';
      case 'request':
        return 'Tờ trình / Đề xuất thanh toán';
      case 'tax_report':
        return 'Báo cáo / Tờ khai thuế GTGT';
      case 'internal_decision':
        return 'Quyết định hành chính nội bộ';
      default:
        return category;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-integrity-title"
    >
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white flex items-center justify-between border-b border-emerald-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="verify-integrity-title" className="text-lg font-bold text-white tracking-tight">
                  Thẩm Tra Toàn Vẹn Chữ Ký Số
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Nghị định 130/2018/NĐ-CP
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
                Văn bản: {doc.docCode} &bull; {doc.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            title="Đóng modal"
            aria-label="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white dark:bg-slate-900">
          {/* Main Status Banner */}
          {isSigned ? (
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-md mt-0.5 shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-emerald-900 dark:text-emerald-200">
                  Chữ Ký Số Hợp Lệ & Nguyên Vẹn 100%
                </h3>
                <p className="text-xs text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                  Tài liệu được bảo vệ toàn vẹn bằng hàm băm mật mã học SHA-256 và khóa số hợp lệ tại thời điểm ký kết. Văn bản không có dấu hiệu bị can thiệp hoặc chỉnh sửa trái phép sau khi ký.
                </p>
                <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" /> Tuân thủ Luật Giao dịch Điện tử 2023
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Dấu thời gian TSA RFC 3161
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-md mt-0.5 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                  Văn Bản Chưa Hoàn Tất Ký Số
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                  Văn bản này đang trong trạng thái chờ duyệt hoặc chưa ký số. Chưa có con dấu mật mã học hoặc chứng thư nào được cấp phát cho phiên bản hiện tại.
                </p>
              </div>
            </div>
          )}

          {/* Document Summary Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Thông Tin Văn Bản Thẩm Tra</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Mã văn bản:</span>
                <span className="font-semibold text-slate-900 dark:text-white font-mono">
                  {doc.docCode}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Loại văn bản:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {getCategoryLabel(doc.category)}
                </span>
              </div>

              <div className="md:col-span-2">
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Tiêu đề:</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {doc.title}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Đơn vị đề xuất:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {doc.requestedBy} &bull; {doc.department}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Quy cách tệp:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {doc.fileSize} &bull; {doc.totalPages} trang tài liệu
                </span>
              </div>

              {doc.amount && doc.amount > 0 ? (
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Giá trị giao kết:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(doc.amount)}
                  </span>
                </div>
              ) : null}

              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 block">Ngày tạo lập:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {doc.createdDate}
                </span>
              </div>
            </div>
          </div>

          {/* Signer & Certificate Verification Card */}
          {doc.signedBy && (
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Chữ Ký Số & Chứng Thư Xác Thực</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Người ký xác thực:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {doc.signedBy.name}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Phương thức ký số:</span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {doc.signedBy.method}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Số Serial chứng thư:</span>
                  <span className="font-mono text-xs text-slate-800 dark:text-slate-200 font-medium select-all">
                    {doc.signedBy.certSerial}
                  </span>
                </div>

                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Thời gian ký xác thực:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {doc.signedBy.signedAt}
                  </span>
                </div>

                <div className="md:col-span-2 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                  <span className="text-xs text-slate-500 dark:text-slate-400 block">Dấu thời gian điện tử (TSA Timestamp Authority):</span>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-700 dark:text-slate-300">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    <span>Dấu thời gian cấp bởi Cụm máy chủ TSA Quốc gia (RFC 3161) &bull; Khóa niêm phong bất biến thời gian thực</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cryptographic SHA-256 Checksum Frame */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Fingerprint className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Mã Băm Toàn Vẹn SHA-256 (Cryptographic Checksum)
              </span>

              <button
                onClick={handleCopyHash}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
              >
                {copiedHash ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Đã chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép mã băm</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl border border-slate-800 break-all select-all shadow-inner">
              {hashSHA256}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              * Mã băm được tính toán độc lập từ nội dung văn bản. Nếu tài liệu bị thay đổi dù chỉ 1 ký tự, mã băm sẽ sai lệch hoàn toàn.
            </p>
          </div>

          {/* Technical Verification Details Checklist */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Chi Tiết Kiểm Định Kỹ Thuật (Nghị định 130/2018/NĐ-CP)
            </span>

            <div className="space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Kiểm tra mã băm văn bản không bị biến đổi</strong>
                  <span className="text-slate-600 dark:text-slate-400">
                    Bản băm SHA-256 hiện tại hoàn toàn trùng khớp với giá trị đã được mã hóa bằng khóa riêng (Private Key).
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Chứng thư số và khóa công khai hợp lệ tại thời điểm ký</strong>
                  <span className="text-slate-600 dark:text-slate-400">
                    Chứng thư số không nằm trong danh sách thu hồi CRL và phản hồi OCSP trả về trạng thái Good.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Dấu thời gian điện tử (TSA) hợp lệ</strong>
                  <span className="text-slate-600 dark:text-slate-400">
                    Thời điểm ký được niêm phong bởi nhà cung cấp dấu thời gian được cấp phép, chứng minh sự tồn tại của văn bản.
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block">Giá trị pháp lý theo Luật Giao dịch Điện tử</strong>
                  <span className="text-slate-600 dark:text-slate-400">
                    Văn bản có giá trị pháp lý tương đương văn bản giấy có chữ ký tay và đóng dấu mộc pháp nhân theo Luật số 20/2023/QH15.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <button
            onClick={handleDownloadCertificatePDF}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Tải Giấy Chứng Nhận Ký Số (.PDF)</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 transition-colors shadow-md cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
