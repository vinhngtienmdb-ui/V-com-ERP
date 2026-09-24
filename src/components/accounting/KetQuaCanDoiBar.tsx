import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Zap, Scale } from 'lucide-react';
import { KetQuaCanDoi } from '../../lib/keToan/types';
import { cn } from '../../lib/utils';

interface KetQuaCanDoiBarProps {
  ketQua: KetQuaCanDoi;
  onAutoBalance?: () => void;
  isDarkMode?: boolean;
}

export const KetQuaCanDoiBar: React.FC<KetQuaCanDoiBarProps> = ({
  ketQua,
  onAutoBalance,
  isDarkMode = false
}) => {
  const { tongNo, tongCo, chenhLech, canDoi, loi, soDong } = ketQua;

  const formatVnd = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(val);
  };

  const maxVal = Math.max(tongNo, tongCo, 1);
  const noPercent = Math.min(100, Math.round((tongNo / maxVal) * 100));
  const coPercent = Math.min(100, Math.round((tongCo / maxVal) * 100));

  return (
    <div className={cn(
      "border-t p-4 rounded-b-2xl shadow-lg flex flex-col gap-3 transition-colors",
      isDarkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200 text-slate-900"
    )}>
      {/* Metrics Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Số dòng định khoản:</span>
            <span className={cn(
              "font-mono font-bold text-xs px-2 py-0.5 rounded",
              isDarkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
            )}>
              {soDong}
            </span>
          </div>

          {canDoi ? (
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>BÚT TOÁN CÂN ĐỐI 100%</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/30">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>CHƯA CÂN ĐỐI (LỆCH {formatVnd(Math.abs(chenhLech))} đ)</span>
              </div>

              {onAutoBalance && (
                <button
                  type="button"
                  onClick={onAutoBalance}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs rounded-full flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  title="Tự động bù số tiền chênh lệch vào dòng cuối cùng (Phím tắt F9)"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>Tự cân đối (F9)</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Financial Numbers with Tabular Alignment */}
        <div className="flex items-center gap-6 font-mono">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-sans text-slate-400 font-bold">Tổng Nợ</div>
            <div className="text-sm font-extrabold text-blue-500 tabular-nums">{formatVnd(tongNo)} đ</div>
          </div>

          <div className="text-slate-300 dark:text-slate-700 font-light text-xl">|</div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-sans text-slate-400 font-bold">Tổng Có</div>
            <div className="text-sm font-extrabold text-emerald-500 tabular-nums">{formatVnd(tongCo)} đ</div>
          </div>

          <div className="text-slate-300 dark:text-slate-700 font-light text-xl">|</div>

          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider font-sans text-slate-400 font-bold">Chênh lệch</div>
            <div className={cn(
              "text-sm font-extrabold tabular-nums",
              chenhLech === 0 ? "text-emerald-500" : "text-rose-500 animate-pulse"
            )}>
              {formatVnd(chenhLech)} đ
            </div>
          </div>
        </div>
      </div>

      {/* Visual Audio-Equalizer Balance Bar */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 font-sans mb-1">
            <span>Bên Nợ: {noPercent}%</span>
            <span>{formatVnd(tongNo)}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${noPercent}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] text-slate-400 font-sans mb-1">
            <span>Bên Có: {coPercent}%</span>
            <span>{formatVnd(tongCo)}</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${coPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Validation Errors List */}
      {loi.length > 0 && (
        <div className="bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl p-3 text-xs space-y-1">
          <div className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Phát hiện {loi.length} điểm cần xử lý trước khi ghi sổ:</span>
          </div>
          <ul className="list-disc list-inside space-y-0.5 text-rose-700 dark:text-rose-400 pl-1 text-[11px]">
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
