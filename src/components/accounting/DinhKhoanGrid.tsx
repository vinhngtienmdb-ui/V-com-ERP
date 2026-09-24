import React from 'react';
import { Plus, Zap, Copy } from 'lucide-react';
import { DinhKhoan } from '../../lib/keToan/types';
import { DinhKhoanRow } from './DinhKhoanRow';
import { cn } from '../../lib/utils';

interface DinhKhoanGridProps {
  items: DinhKhoan[];
  onChange: (items: DinhKhoan[]) => void;
  readOnly?: boolean;
  isDarkMode?: boolean;
}

export const DinhKhoanGrid: React.FC<DinhKhoanGridProps> = ({
  items,
  onChange,
  readOnly = false,
  isDarkMode = false
}) => {
  const handleRowChange = (index: number, updated: DinhKhoan) => {
    const next = [...items];
    next[index] = updated;
    onChange(next);
  };

  const handleRowRemove = (index: number) => {
    if (items.length <= 1) {
      onChange([
        {
          soDong: 1,
          dienGiai: '',
          tkNo: '',
          tkCo: '',
          soTien: 0,
          loaiTien: 'VND',
          tyGia: 1,
          soTienQuyDoi: 0
        }
      ]);
      return;
    }
    const next = items.filter((_, i) => i !== index).map((row, i) => ({ ...row, soDong: i + 1 }));
    onChange(next);
  };

  const handleAddRow = (afterIndex?: number) => {
    const lastItem = items[items.length - 1];
    const newRow: DinhKhoan = {
      soDong: items.length + 1,
      dienGiai: lastItem?.dienGiai || '',
      tkNo: '',
      tkCo: '',
      soTien: 0,
      loaiTien: 'VND',
      tyGia: 1,
      soTienQuyDoi: 0
    };

    if (afterIndex !== undefined) {
      const next = [...items];
      next.splice(afterIndex + 1, 0, newRow);
      onChange(next.map((r, i) => ({ ...r, soDong: i + 1 })));
    } else {
      onChange([...items, newRow]);
    }
  };

  const handleDuplicateRow = (index: number) => {
    const target = items[index];
    const newRow: DinhKhoan = {
      ...target,
      soDong: items.length + 1
    };
    const next = [...items];
    next.splice(index + 1, 0, newRow);
    onChange(next.map((r, i) => ({ ...r, soDong: i + 1 })));
  };

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden shadow-xs flex flex-col transition-colors",
      isDarkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"
    )}>
      {/* Grid Toolbar */}
      <div className={cn(
        "px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 transition-colors",
        isDarkMode ? "bg-slate-900/90 border-slate-800" : "bg-slate-50 border-slate-200"
      )}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs uppercase tracking-wider text-blue-500">
            Chi tiết Định khoản (S03-DN)
          </span>
          <span className="text-[11px] text-slate-400">
            • Alt+K chọn TK • Alt+D chọn đối tượng • Ctrl+Space đảo Nợ Có • Alt+A thêm dòng
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddRow()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 rounded-lg shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm dòng (Alt+A)</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={cn(
              "border-b text-[11px] font-bold uppercase tracking-wider transition-colors",
              isDarkMode ? "bg-slate-800/60 border-slate-800 text-slate-400" : "bg-slate-100/70 border-slate-200 text-slate-600"
            )}>
              <th className="p-2.5 text-center w-10">STT</th>
              <th className="p-2.5 min-w-[200px]">Diễn giải nghiệp vụ</th>
              <th className="p-2.5 min-w-[170px]">Tài khoản Nợ</th>
              <th className="p-2.5 w-6 text-center">⇄</th>
              <th className="p-2.5 min-w-[170px]">Tài khoản Có</th>
              <th className="p-2.5 min-w-[140px] text-right">Số tiền</th>
              <th className="p-2.5 w-20">Loại tiền</th>
              <th className="p-2.5 w-24 text-right">Tỷ giá</th>
              <th className="p-2.5 min-w-[200px]">Đối tượng</th>
              <th className="p-2.5 w-32">Kho hàng</th>
              <th className="p-2.5 text-center w-16">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((row, idx) => (
              <DinhKhoanRow
                key={idx}
                dinhKhoan={row}
                index={idx}
                onChange={handleRowChange}
                onRemove={handleRowRemove}
                onAddNewBelow={handleAddRow}
                onDuplicateRow={handleDuplicateRow}
                isDarkMode={isDarkMode}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
