import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2, FileText, Download, ShieldCheck } from 'lucide-react';
import { DocumentViewer, DocumentType } from './DocumentViewer';
import { cn } from '../../lib/utils';

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  file?: string | File | Blob | ArrayBuffer | null;
  fileName?: string;
  fileType?: DocumentType;
  title?: string;
  subtitle?: string;
  watermarkText?: string;
  extraActions?: React.ReactNode;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  onClose,
  file,
  fileName = 'TaiLieu',
  fileType = 'auto',
  title,
  subtitle,
  watermarkText,
  extraActions
}) => {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const displayTitle = title || fileName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={cn(
          "bg-white rounded-2xl shadow-2xl border border-slate-700/50 flex flex-col overflow-hidden transition-all duration-300 w-full",
          isFullscreen ? "h-[98vh] max-w-[98vw]" : "h-[90vh] max-w-6xl"
        )}
      >
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white px-5 py-3 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-indigo-600/80 text-white rounded-xl shadow-xs shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 truncate">{displayTitle}</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 uppercase border border-slate-700 shrink-0">
                  Xem trực tiếp (No Download)
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {subtitle || 'Xem trước an toàn không tải về máy • Mã hóa đầu cuối'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {extraActions}

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(prev => !prev)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title={isFullscreen ? 'Thu nhỏ cửa sổ' : 'Phóng to toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-rose-600/80 rounded-lg transition-colors"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="flex-1 bg-slate-900/5 overflow-hidden flex flex-col relative">
          <DocumentViewer
            file={file}
            fileName={fileName}
            fileType={fileType}
            height="100%"
            watermarkText={watermarkText}
          />
        </div>

        {/* Modal Footer info bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[11px] text-slate-600">
              Văn bản được bảo vệ: Tuyệt đối không lưu tạm ra ổ đĩa máy tính
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Nhấn <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[10px] font-mono">Esc</kbd> để đóng
          </div>
        </div>
      </div>
    </div>
  );
};
