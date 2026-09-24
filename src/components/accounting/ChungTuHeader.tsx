import React from 'react';
import { LoaiChungTu, TrangThaiChungTu, ChungTuNhatKyChung } from '../../lib/keToan/types';
import { Calendar, FileCode, Tag, CheckCircle2, Clock, Lock, Ban } from 'lucide-react';
import { formatDateVN, formatMonthVN } from '../../lib/keToan/dateUtils';

interface ChungTuHeaderProps {
  data?: ChungTuNhatKyChung;
  formData?: ChungTuNhatKyChung;
  onChange: (fields: Partial<ChungTuNhatKyChung>) => void;
  readOnly?: boolean;
}

export const ChungTuHeader: React.FC<ChungTuHeaderProps> = ({
  data,
  formData,
  onChange,
  readOnly = false
}) => {
  const currentData = data || formData;
  if (!currentData) return null;
  const renderStatusBadge = (status: TrangThaiChungTu) => {
    switch (status) {
      case 'DA_GHI_SO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ĐÃ GHI SỔ
          </span>
        );
      case 'CHUA_GHI_SO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            CHƯA GHI SỔ (NHÁP)
          </span>
        );
      case 'DA_KHOA_SO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300">
            <Lock className="w-3.5 h-3.5 text-slate-600" />
            ĐÃ KHÓA SỔ
          </span>
        );
      case 'DA_HUY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <Ban className="w-3.5 h-3.5 text-rose-600" />
            ĐÃ HỦY
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>Chứng từ Kế toán Nhật ký chung</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-bold">
                TT 99/2025/TT-BTC
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mẫu S03-DN • Nguồn chân lý kế toán kép nội bộ VComm
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {renderStatusBadge(currentData.trangThai || 'CHUA_GHI_SO')}
        </div>
      </div>

      {/* Input Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {/* Loại chứng từ */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">Loại chứng từ</label>
          <select
            disabled={readOnly}
            value={currentData.loaiCt || 'THU'}
            onChange={(e) => onChange({ loaiCt: e.target.value as LoaiChungTu })}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
          >
            <option value="THU">Thu tiền (Phiếu thu / Báo có)</option>
            <option value="CHI">Chi tiền (Phiếu chi / UNC)</option>
            <option value="BAN">Bán hàng (Hóa đơn bán)</option>
            <option value="MUA">Mua hàng (Hóa đơn mua)</option>
            <option value="KHO">Kho (Phiếu nhập / xuất kho)</option>
            <option value="LUONG">Tiền lương & BHXH</option>
            <option value="KET_CHUYEN">Bút toán kết chuyển cuối kỳ</option>
            <option value="KHAC">Bút toán điều chỉnh / Khác</option>
          </select>
        </div>

        {/* Số chứng từ */}
        <div>
          <label className="block font-bold text-slate-700 mb-1">Số chứng từ</label>
          <input
            type="text"
            disabled={readOnly}
            value={currentData.soCt || ''}
            onChange={(e) => onChange({ soCt: e.target.value })}
            placeholder="VD: PT-2026-0001"
            className="w-full px-3 py-2 tabular-nums font-bold text-indigo-900 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
          />
        </div>

        {/* Ngày chứng từ */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>Ngày chứng từ</span>
            <span className="text-[11px] text-blue-600 font-semibold tabular-nums">{formatDateVN(currentData.ngayCt || '')}</span>
          </label>
          <div className="relative">
            <input
              type="date"
              disabled={readOnly}
              value={currentData.ngayCt || ''}
              onChange={(e) => onChange({ ngayCt: e.target.value })}
              className="w-full px-3 py-2 tabular-nums font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Ngày hạch toán */}
        <div>
          <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
            <span>Ngày hạch toán</span>
            <span className="text-[11px] text-blue-600 font-semibold tabular-nums">
              {formatDateVN(currentData.ngayHachToan || '')} (Kỳ {formatMonthVN(currentData.kyKeToan || currentData.ngayHachToan || '')})
            </span>
          </label>
          <div className="relative">
            <input
              type="date"
              disabled={readOnly}
              value={currentData.ngayHachToan || ''}
              onChange={(e) => {
                const val = e.target.value;
                const ky = val ? val.substring(0, 7) : currentData.kyKeToan;
                onChange({ ngayHachToan: val, kyKeToan: ky });
              }}
              className="w-full px-3 py-2 tabular-nums font-bold text-slate-800 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
            />
          </div>
        </div>

        {/* Diễn giải chung */}
        <div className="sm:col-span-2 md:col-span-4">
          <label className="block font-bold text-slate-700 mb-1">Diễn giải chung nghiệp vụ</label>
          <input
            type="text"
            disabled={readOnly}
            value={currentData.dienGiai || ''}
            onChange={(e) => onChange({ dienGiai: e.target.value })}
            placeholder="Nhập nội dung diễn giải chung của chứng từ kế toán..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
          />
        </div>
      </div>
    </div>
  );
};
