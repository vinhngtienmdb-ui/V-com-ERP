import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { exportToExcel, exportToCSV, ExportColumn } from '../../lib/exportExcel';
import { cn } from '../../lib/utils';

interface Props<T extends Record<string, unknown>> {
  data: T[];
  columns: ExportColumn<T>[];
  fileName: string;
  sheetName?: string;
  disabled?: boolean;
  className?: string;
}

export function ExportButton<T extends Record<string, unknown>>({
  data, columns, fileName, sheetName, disabled, className,
}: Props<T>) {
  const [open, setOpen] = useState(false);

  const doExcel = () => { exportToExcel(data, columns, fileName, sheetName); setOpen(false); };
  const doCSV   = () => { exportToCSV(data, columns, fileName); setOpen(false); };

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={disabled || data.length === 0}
        className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <Download className="w-3.5 h-3.5" />
        Xuất file
        <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-sm z-50 overflow-hidden animate-in fade-in scale-in duration-150">
            <button onClick={doExcel} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Excel (.xlsx)
            </button>
            <div className="border-t border-slate-100" />
            <button onClick={doCSV} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
              <FileText className="w-4 h-4 text-blue-600" />
              CSV (.csv)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
