import React, { useEffect } from 'react';
import { Keyboard } from 'lucide-react';
import { Modal } from './ui/Modal';

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
    <Modal
      title="Phím tắt hệ thống"
      icon={<Keyboard className="w-5 h-5 text-blue-500" />}
      isOpen={true}
      onClose={onClose}
      maxWidth="md"
    >
      <div className="space-y-5 px-1">
        {GROUPS.map(group => (
          <div key={group.title}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">{group.title}</span>
              <div className="flex-1 h-px bg-[#E5E7EB] dark:bg-slate-700" />
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {group.shortcuts.map(sc => (
                <div key={sc.desc} className="flex items-center justify-between py-2">
                  <span className="text-[12px] text-slate-600 dark:text-slate-300 font-medium">{sc.desc}</span>
                  <div className="flex items-center gap-1">
                    {sc.keys.map((k, i) => (
                      <React.Fragment key={k}>
                        {i > 0 && <span className="font-mono text-[9px] text-slate-300 dark:text-slate-500 mx-0.5">+</span>}
                        <kbd className="inline-flex items-center justify-center min-w-[24px] h-5 px-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-600 dark:text-slate-400 rounded">
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

      <div className="-mx-4 -mb-4 mt-6 px-4 py-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <p className="font-mono text-[9px] text-slate-400 dark:text-slate-500 text-center tracking-wider">
          Nhấn <kbd className="px-1 py-0.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[9px] rounded">?</kbd> bất kỳ lúc nào để mở lại
        </p>
      </div>
    </Modal>
  );
}
