import React from 'react';
import { Plus, ClipboardPaste } from 'lucide-react';
import { DinhKhoan } from '../../lib/keToan/types';
import { DinhKhoanRow } from './DinhKhoanRow';

interface DinhKhoanGridProps {
  items: DinhKhoan[];
  onChange: (items: DinhKhoan[]) => void;
  readOnly?: boolean;
}

export const DinhKhoanGrid: React.FC<DinhKhoanGridProps> = ({
  items,
  onChange,
  readOnly = false
}) => {
  const handleRowChange = (index: number, updated: DinhKhoan) => {
    const next = [...items];
    next[index] = updated;
    onChange(next);
  };

  const handleRowRemove = (index: number) => {
    if (items.length <= 1) {
      // Keep at least one empty row
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

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
      {/* Grid Toolbar */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
            Chi tiết Định khoản (S03-DN)
          </span>
          <span className="text-[11px] text-slate-500">
            • Nhấn F3 chọn TK • F4 chọn đối tượng • Ctrl+Enter thêm dòng
          </span>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAddRow()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm dòng (Ctrl+Enter)</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="p-2.5 text-center w-10">STT</th>
              <th className="p-2.5 min-w-[200px]">Diễn giải nghiệp vụ</th>
              <th className="p-2.5 min-w-[170px]">TK Nợ</th>
              <th className="p-2.5 min-w-[170px]">TK Có</th>
              <th className="p-2.5 text-right min-w-[130px]">Số tiền phát sinh</th>
              <th className="p-2.5 w-20">Loại tiền</th>
              <th className="p-2.5 text-right w-24">Tỷ giá</th>
              <th className="p-2.5 min-w-[180px]">Đối tượng (Công nợ)</th>
              <th className="p-2.5 text-center w-12">Xóa</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <DinhKhoanRow
                key={index}
                index={index}
                dinhKhoan={item}
                onChange={handleRowChange}
                onRemove={handleRowRemove}
                onAddNewBelow={handleAddRow}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
