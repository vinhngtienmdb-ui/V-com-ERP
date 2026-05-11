import React, { useEffect } from 'react';
import { X, Keyboard } from 'lucide-react';

const GROUPS = [
  {
    title: 'Điều hướng',
    shortcuts: [
      { keys: ['Ctrl', 'K'], desc: 'Mở Global Search' },
      { keys: ['?'], desc: 'Hiện danh sách phím tắt' },
      { keys: ['G', 'D'], desc: 'Đến Dashboard' },
      { keys: ['G', 'O'], desc: 'Đến Đơn hàng' },
      { keys: ['G', 'P'], desc: 'Đến Sản phẩm (PIM)' },
      { keys: ['G', 'C'], desc: 'Đến Khách hàng' },
      { keys: ['G', 'F'], desc: 'Đến Tài chính' },
      { keys: ['G', 'S'], desc: 'Đến Cài đặt' },
    ],
  },
  {
    title: 'Trang soạn thảo',
    shortcuts: [
      { keys: ['Ctrl', 'S'], desc: 'Lưu nội dung' },
      { keys: ['Ctrl', 'B'], desc: 'In đậm' },
      { keys: ['Ctrl', 'I'], desc: 'In nghiêng' },
      { keys: ['Ctrl', 'Z'], desc: 'Hoàn tác' },
      { keys: ['Ctrl', 'Y'], desc: 'Làm lại' },
      { keys: ['Esc'], desc: 'Đóng modal / Hủy' },
    ],
  },
];

interface Props { onClose: () => void; }

export function ShortcutsModal({ onClose }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' || e.key === '?') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: 'rgba(9,11,17,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-slate-300 w-full max-w-lg overflow-hidden animate-in scale-in duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-600">Phím tắt hệ thống</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {GROUPS.map(group => (
            <div key={group.title}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{group.title}</span>
                <div className="flex-1 h-px bg-[#E5E7EB]" />
              </div>
              <div className="divide-y divide-slate-100">
                {group.shortcuts.map(sc => (
                  <div key={sc.desc} className="flex items-center justify-between py-2">
                    <span className="text-[12px] text-slate-600 font-medium">{sc.desc}</span>
                    <div className="flex items-center gap-1">
                      {sc.keys.map((k, i) => (
                        <React.Fragment key={k}>
                          {i > 0 && <span className="font-mono text-[9px] text-slate-300 mx-0.5">+</span>}
                          <kbd className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 bg-slate-100 border border-slate-300 font-mono text-[10px] text-slate-600">
                            {k}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200">
          <p className="font-mono text-[9px] text-slate-400 text-center tracking-wider">
            Nhấn <kbd className="px-1 py-0.5 bg-white border border-slate-300 font-mono text-[9px]">?</kbd> bất kỳ lúc nào để mở lại
          </p>
        </div>
      </div>
    </div>
  );
}
