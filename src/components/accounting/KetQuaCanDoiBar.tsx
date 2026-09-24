import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { KetQuaCanDoi } from '../../lib/keToan/types';

interface KetQuaCanDoiBarProps {
  ketQua: KetQuaCanDoi;
}

export const KetQuaCanDoiBar: React.FC<KetQuaCanDoiBarProps> = ({ ketQua }) => {
  const { tongNo, tongCo, chenhLech, canDoi, loi, soDong } = ketQua;

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  return (
    <div className="bg-white border-t border-slate-200 p-4 rounded-b-2xl shadow-lg flex flex-col gap-3">
      {/* Metrics Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Số dòng định khoản:</span>
            <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              {soDong}
            </span>
          </div>

          {canDoi ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>BÚT TOÁN CÂN ĐỐI</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>CHƯA CÂN ĐỐI (LỆCH {formatVnd(Math.abs(chenhLech))} đ)</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6 font-mono">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-sans text-slate-400 font-bold">Tổng Nợ</div>
            <div className="text-sm font-extrabold text-indigo-900">{formatVnd(tongNo)} đ</div>
          </div>

          <div className="text-slate-300 font-light text-xl">|</div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-sans text-slate-400 font-bold">Tổng Có</div>
            <div className="text-sm font-extrabold text-indigo-900">{formatVnd(tongCo)} đ</div>
          </div>

          <div className="text-slate-300 font-light text-xl">|</div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-sans text-slate-400 font-bold">Chênh lệch</div>
            <div className={`text-sm font-extrabold ${chenhLech === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatVnd(chenhLech)} đ
            </div>
          </div>
        </div>
      </div>

      {/* Validation Errors List */}
      {loi.length > 0 && (
        <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3 text-xs space-y-1">
          <div className="font-bold text-rose-900 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>Phát hiện {loi.length} điểm cần xử lý trước khi ghi sổ:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-rose-700 pl-1 text-[11px]">
            {loi.map((item, idx) => (
              <li key={idx}>
                {item.dong > 0 ? `Dòng ${item.dong}: ` : ''}
                {item.thongDiep}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
