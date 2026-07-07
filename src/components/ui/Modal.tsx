import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  confirmVariant?: 'primary' | 'danger' | 'warning' | 'success';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  hideFooter?: boolean;
  noPadding?: boolean;
  fullscreen?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  onConfirm,
  confirmText = 'Lưu',
  cancelText = 'Huỷ',
  confirmDisabled = false,
  confirmVariant = 'primary',
  maxWidth = '2xl',
  hideFooter = false,
  noPadding = false,
  fullscreen = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const onCloseRef = React.useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCloseRef.current();
      }
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Lock scroll on main container via class
      document.body.classList.add('modal-open');
    }
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    'full': 'max-w-[95vw]',
  };

  const confirmBtnClasses = {
    'primary': 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/25',
    'danger': 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-500/25',
    'warning': 'bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-500/25',
    'success': 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/25',
  };

  if (fullscreen) {
    return createPortal(
      <div className="fixed inset-0 bg-slate-50 z-[9999] flex flex-col animate-in slide-in-from-right-4 duration-300">
        <div className={cn("flex-1 flex flex-col w-full mx-auto relative", maxWidthClasses[maxWidth] !== 'max-w-[95vw]' ? maxWidthClasses[maxWidth] : 'max-w-7xl')}>
          {/* Fallback close button for fullscreen modals without a header */}
          {!title && (
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-[60] p-2 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full shadow-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          {/* Header */}
          {title && (
            <div className="flex justify-between items-center p-4 border-b border-slate-200 shrink-0 bg-white sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button 
                  onClick={onClose} 
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
                  title="Quay l?i (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-slate-200"></div>
                <div className="flex items-center gap-2">
                  {icon && <div className="text-primary-600">{icon}</div>}
                  <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                </div>
              </div>
            </div>
          )}

          {/* Body */}
          <div className={cn("flex-1 overflow-y-auto custom-scrollbar relative", !noPadding && "p-6")}>
            {children}
          </div>

          {/* Footer */}
          {!hideFooter && (
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-end gap-3 shrink-0 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              {footer ? footer : (
                <>
                  <button 
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                  >
                    {cancelText}
                  </button>
                  {onConfirm && (
                    <button 
                      type="button"
                      onClick={onConfirm}
                      disabled={confirmDisabled}
                      className={cn(
                        "px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2",
                        confirmBtnClasses[confirmVariant],
                        confirmDisabled && "opacity-50 cursor-not-allowed hover:bg-auto hover:opacity-50"
                      )}
                    >
                      {confirmText}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className={cn(
          "bg-white rounded-lg shadow-xl w-full max-h-[85vh] flex flex-col overflow-hidden",
          maxWidthClasses[maxWidth]
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex justify-between items-center p-5 border-b border-slate-200 shrink-0 bg-slate-50/50">
            <div className="flex items-center gap-2">
              {icon && <div className="text-slate-600">{icon}</div>}
              <h2 className="text-lg font-bold text-slate-900">{title}</h2>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Đóng (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Body */}
        <div className={cn("flex-1 overflow-y-auto custom-scrollbar relative", !noPadding && "p-5")}>
          {children}
        </div>

        {/* Footer */}
        {!hideFooter && (
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 shrink-0">
            {footer ? footer : (
              <>
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  {cancelText}
                </button>
                {onConfirm && (
                  <button 
                    type="button"
                    onClick={onConfirm}
                    disabled={confirmDisabled}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2",
                      confirmBtnClasses[confirmVariant],
                      confirmDisabled && "opacity-50 cursor-not-allowed hover:bg-auto hover:opacity-50"
                    )}
                  >
                    {confirmText}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
