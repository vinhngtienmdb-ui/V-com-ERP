import React from 'react';
import { Trash2 } from 'lucide-react';
import { DinhKhoan } from '../../lib/keToan/types';
import { TaiKhoanPicker } from './TaiKhoanPicker';
import { DoiTuongPicker } from './DoiTuongPicker';

interface DinhKhoanRowProps {
  dinhKhoan: DinhKhoan;
  index: number;
  onChange: (index: number, updated: DinhKhoan) => void;
  onRemove: (index: number) => void;
  onAddNewBelow?: (index: number) => void;
}

export const DinhKhoanRow: React.FC<DinhKhoanRowProps> = ({
  dinhKhoan,
  index,
  onChange,
  onRemove,
  onAddNewBelow
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey && onAddNewBelow) {
      e.preventDefault();
      onAddNewBelow(index);
    }
  };

  return (
    <tr className="hover:bg-indigo-50/30 transition-colors border-b border-slate-100 text-xs" onKeyDown={handleKeyDown}>
      {/* STT */}
      <td className="p-2.5 text-center font-mono font-bold text-slate-400 bg-slate-50/50 w-10">
        {index + 1}
      </td>

      {/* Diễn giải dòng */}
      <td className="p-2 min-w-[200px]">
        <input
          type="text"
          value={dinhKhoan.dienGiai || ''}
          onChange={(e) => handleChangeField('dienGiai', e.target.value)}
          placeholder="Diễn giải nghiệp vụ phát sinh..."
          className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
        />
      </td>

      {/* TK Nợ */}
      <td className="p-2 min-w-[170px]">
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
          placeholder="Nợ TK..."
        />
      </td>

      {/* TK Có */}
      <td className="p-2 min-w-[170px]">
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
          placeholder="Có TK..."
        />
      </td>

      {/* Số tiền */}
      <td className="p-2 min-w-[130px]">
        <input
          type="number"
          min="0"
          value={dinhKhoan.soTien || ''}
          onChange={(e) => handleChangeField('soTien', Number(e.target.value))}
          placeholder="0"
          className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-right text-indigo-950 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
        />
      </td>

      {/* Loại tiền */}
      <td className="p-2 w-20">
        <select
          value={dinhKhoan.loaiTien || 'VND'}
          onChange={(e) => handleChangeField('loaiTien', e.target.value)}
          className="w-full px-2 py-1.5 text-xs font-mono font-semibold rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
        >
          <option value="VND">VND</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
        </select>
      </td>

      {/* Tỷ giá (nếu ngoại tệ) */}
      <td className="p-2 w-24">
        <input
          type="number"
          disabled={dinhKhoan.loaiTien === 'VND'}
          value={dinhKhoan.loaiTien === 'VND' ? 1 : dinhKhoan.tyGia || 1}
          onChange={(e) => handleChangeField('tyGia', Number(e.target.value))}
          className="w-full px-2 py-1.5 text-xs font-mono text-right rounded-lg border border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 bg-white"
        />
      </td>

      {/* Đối tượng theo dõi */}
      <td className="p-2 min-w-[180px]">
        <DoiTuongPicker
          value={dinhKhoan.maDoiTuong}
          onChange={(dt) => {
            const updated = {
              ...dinhKhoan,
              doiTuongId: dt.id,
              maDoiTuong: dt.maDt,
              tenDoiTuong: dt.tenDt
            };
            onChange(index, updated);
          }}
          placeholder="F4 - Đối tượng..."
        />
      </td>

      {/* Hành động */}
      <td className="p-2 text-center w-12">
        <button
          type="button"
          onClick={() => onRemove(index)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Xóa dòng định khoản này"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
};
