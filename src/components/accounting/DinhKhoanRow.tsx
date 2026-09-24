import React from 'react';
import { Trash2, ArrowLeftRight, Copy } from 'lucide-react';
import { DinhKhoan } from '../../lib/keToan/types';
import { TaiKhoanPicker } from './TaiKhoanPicker';
import { DoiTuongPicker } from './DoiTuongPicker';
import { cn } from '../../lib/utils';

interface DinhKhoanRowProps {
  dinhKhoan: DinhKhoan;
  index: number;
  onChange: (index: number, updated: DinhKhoan) => void;
  onRemove: (index: number) => void;
  onAddNewBelow?: (index: number) => void;
  onDuplicateRow?: (index: number) => void;
  isDarkMode?: boolean;
}

export const DinhKhoanRow: React.FC<DinhKhoanRowProps> = ({
  dinhKhoan,
  index,
  onChange,
  onRemove,
  onAddNewBelow,
  onDuplicateRow,
  isDarkMode = false
}) => {
  const handleChangeField = (field: keyof DinhKhoan, value: any) => {
    const updated = { ...dinhKhoan, [field]: value };
    if (field === 'soTien' || field === 'tyGia') {
      const soTien = field === 'soTien' ? Number(value) || 0 : dinhKhoan.soTien;
      const tyGia = field === 'tyGia' ? Number(value) || 1 : (dinhKhoan.tyGia || 1);
      updated.soTienQuyDoi = soTien * tyGia;
    }
    onChange(index, updated);
  };

  // Hoán đổi Nợ ⇄ Có
  const handleSwapDebitCredit = () => {
    const next = {
      ...dinhKhoan,
      tkNo: dinhKhoan.tkCo,
      tenTkNo: dinhKhoan.tenTkCo,
      tkCo: dinhKhoan.tkNo,
      tenTkCo: dinhKhoan.tenTkNo
    };
    onChange(index, next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl + Space: Hoán đổi Nợ Có
    if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
      e.preventDefault();
      handleSwapDebitCredit();
    }
    // Ctrl + Enter: Thêm dòng bên dưới
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && onAddNewBelow) {
      e.preventDefault();
      onAddNewBelow(index);
    }
  };

  return (
    <tr
      className={cn(
        "transition-colors border-b text-xs group",
        isDarkMode
          ? "border-slate-800 hover:bg-slate-800/40 text-slate-200"
          : "border-slate-100 hover:bg-blue-50/30 text-slate-800"
      )}
      onKeyDown={handleKeyDown}
    >
      {/* STT */}
      <td className={cn(
        "p-2 text-center tabular-nums font-bold w-10 select-none",
        isDarkMode ? "bg-slate-900/60 text-slate-500" : "bg-slate-50/50 text-slate-400"
      )}>
        {index + 1}
      </td>

      {/* Diễn giải dòng */}
      <td className="p-1.5 min-w-[200px]">
        <input
          type="text"
          value={dinhKhoan.dienGiai || ''}
          onChange={(e) => handleChangeField('dienGiai', e.target.value)}
          placeholder="Diễn giải nghiệp vụ..."
          className={cn(
            "w-full px-2.5 py-1.5 text-xs rounded-lg border transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500",
            isDarkMode
              ? "bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-600"
              : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
          )}
        />
      </td>

      {/* TK Nợ */}
      <td className="p-1.5 min-w-[170px]">
        <TaiKhoanPicker
          value={dinhKhoan.tkNo}
          onChange={(acc) => {
            const updated = {
              ...dinhKhoan,
              tkNo: acc.maTk,
              tenTkNo: acc.tenTk
            };
            onChange(index, updated);
          }}
          placeholder="Nợ TK (Alt+K)..."
        />
      </td>

      {/* Nút Swap Nợ Có */}
      <td className="p-0.5 text-center w-6">
        <button
          type="button"
          onClick={handleSwapDebitCredit}
          className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors cursor-pointer"
          title="Đổi chiều Nợ ⇄ Có (Ctrl + Space)"
        >
          <ArrowLeftRight className="w-3.5 h-3.5" />
        </button>
      </td>

      {/* TK Có */}
      <td className="p-1.5 min-w-[170px]">
        <TaiKhoanPicker
          value={dinhKhoan.tkCo}
          onChange={(acc) => {
            const updated = {
              ...dinhKhoan,
              tkCo: acc.maTk,
              tenTkCo: acc.tenTk
            };
            onChange(index, updated);
          }}
          placeholder="Có TK (Alt+K)..."
        />
      </td>

      {/* Số tiền */}
      <td className="p-1.5 min-w-[140px]">
        <input
          type="number"
          min="0"
          value={dinhKhoan.soTien || ''}
          onChange={(e) => handleChangeField('soTien', Number(e.target.value))}
          placeholder="0"
          className={cn(
            "w-full px-2.5 py-1.5 text-xs font-bold text-right rounded-lg border tabular-nums transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500",
            isDarkMode
              ? "bg-slate-900 border-slate-700 text-emerald-400 placeholder-slate-600"
              : "bg-white border-slate-200 text-slate-950 placeholder-slate-400"
          )}
        />
      </td>

      {/* Loại tiền */}
      <td className="p-1.5 w-20">
        <select
          value={dinhKhoan.loaiTien || 'VND'}
          onChange={(e) => handleChangeField('loaiTien', e.target.value)}
          className={cn(
            "w-full px-2 py-1.5 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500",
            isDarkMode ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-200 text-slate-800"
          )}
        >
          <option value="VND">VND</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </td>

      {/* Tỷ giá (nếu ngoại tệ) */}
      <td className="p-1.5 w-24">
        <input
          type="number"
          disabled={dinhKhoan.loaiTien === 'VND'}
          value={dinhKhoan.loaiTien === 'VND' ? 1 : dinhKhoan.tyGia || 1}
          onChange={(e) => handleChangeField('tyGia', Number(e.target.value))}
          className={cn(
            "w-full px-2 py-1.5 text-xs text-right rounded-lg border tabular-nums",
            dinhKhoan.loaiTien === 'VND' ? "opacity-40 cursor-not-allowed" : "",
            isDarkMode ? "bg-slate-900 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-800"
          )}
        />
      </td>

      {/* Đối tượng công nợ */}
      <td className="p-1.5 min-w-[200px]">
        <DoiTuongPicker
          value={dinhKhoan.maDoiTuong}
          tenDoiTuong={dinhKhoan.tenDoiTuong}
          onChange={(doiTuong) => {
            const updated = {
              ...dinhKhoan,
              maDoiTuong: doiTuong.maDoiTuong,
              tenDoiTuong: doiTuong.tenDoiTuong
            };
            onChange(index, updated);
          }}
          placeholder="Đối tượng (Alt+D)..."
        />
      </td>

      {/* Kho hàng */}
      <td className="p-1.5 w-32">
        <input
          type="text"
          value={dinhKhoan.maKho || ''}
          onChange={(e) => handleChangeField('maKho', e.target.value)}
          placeholder="Mã kho..."
          className={cn(
            "w-full px-2 py-1.5 text-xs rounded-lg border",
            isDarkMode ? "bg-slate-900 border-slate-700 text-slate-300" : "bg-white border-slate-200 text-slate-800"
          )}
        />
      </td>

      {/* Thao tác */}
      <td className="p-1.5 text-center w-16">
        <div className="flex items-center justify-center gap-1">
          {onDuplicateRow && (
            <button
              type="button"
              onClick={() => onDuplicateRow(index)}
              className="p-1 text-slate-400 hover:text-blue-500 rounded transition-colors cursor-pointer"
              title="Nhân bản dòng này"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors cursor-pointer"
            title="Xóa dòng (Alt + Backspace)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
