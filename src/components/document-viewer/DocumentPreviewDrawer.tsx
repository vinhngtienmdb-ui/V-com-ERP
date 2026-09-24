import React, { useEffect } from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import { DocumentViewer, DocumentType } from './DocumentViewer';
import { cn } from '../../lib/utils';

export interface DocumentPreviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  file?: string | File | Blob | ArrayBuffer | null;
  fileName?: string;
  fileType?: DocumentType;
  title?: string;
  subtitle?: string;
  width?: string;
}

export const DocumentPreviewDrawer: React.FC<DocumentPreviewDrawerProps> = ({
  isOpen,
  onClose,
  file,
  fileName = 'TaiLieu',
  fileType = 'auto',
  title,
  subtitle,
  width = 'w-[680px]'
}) => {
  // ESC key
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

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={cn("w-screen bg-white shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300", width)}>
          {/* Header */}
          <div className="px-5 py-3.5 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-100 truncate">
                  {title || fileName}
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  {subtitle || 'Xem nhanh đối chiếu chứng từ'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <DocumentViewer
              file={file}
              fileName={fileName}
              fileType={fileType}
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
