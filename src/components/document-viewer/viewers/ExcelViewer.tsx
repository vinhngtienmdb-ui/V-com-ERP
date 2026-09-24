import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Search, Download, Table, Layers, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { generateSampleExcelBuffer } from '../sampleDocuments';

export interface ExcelViewerProps {
  data?: ArrayBuffer | Uint8Array | File | Blob | string | null;
  fileName?: string;
  className?: string;
  zoom?: number;
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({
  data,
  fileName = 'BangKe_DuLieu.xlsx',
  className,
  zoom = 100
}) => {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(() => {
    if (data instanceof ArrayBuffer) {
      try {
        return XLSX.read(data, { type: 'array', cellDates: true });
      } catch {
        return null;
      }
    }
    return null;
  });
  const [activeSheet, setActiveSheet] = useState<string>(() => {
    if (data instanceof ArrayBuffer) {
      try {
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        return wb.SheetNames[0] || '';
      } catch {
        return '';
      }
    }
    return '';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentZoom, setCurrentZoom] = useState<number>(zoom);
  const [isLoading, setIsLoading] = useState<boolean>(() => !(data instanceof ArrayBuffer));
  const [error, setError] = useState<string | null>(null);

  // Load workbook from data prop or generate sample buffer
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const loadData = async () => {
      try {
        let buffer: ArrayBuffer;

        if (!data) {
          // Fallback to sample accounting workbook
          buffer = generateSampleExcelBuffer(fileName);
        } else if (data instanceof File || data instanceof Blob) {
          buffer = await data.arrayBuffer();
        } else if (typeof data === 'string') {
          if (data.startsWith('data:') || data.includes('base64,')) {
            const base64 = data.split('base64,')[1] || data;
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            buffer = bytes.buffer;
          } else {
            // URL or file path: fetch as arrayBuffer
            const res = await fetch(data);
            if (!res.ok) throw new Error(`HTTP error ${res.status}`);
            buffer = await res.arrayBuffer();
          }
        } else if (data instanceof ArrayBuffer) {
          buffer = data;
        } else if (data instanceof Uint8Array) {
          buffer = data.buffer as ArrayBuffer;
        } else {
          buffer = generateSampleExcelBuffer(fileName);
        }

        const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
        if (isMounted) {
          setWorkbook(wb);
          if (wb.SheetNames.length > 0) {
            setActiveSheet(wb.SheetNames[0]);
          }
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          console.warn('Excel parse fallback:', err);
          // If parse fails (e.g., corrupt mock URL), fallback to rich sample
          try {
            const fallbackBuf = generateSampleExcelBuffer(fileName);
            const wb = XLSX.read(fallbackBuf, { type: 'array' });
            setWorkbook(wb);
            if (wb.SheetNames.length > 0) {
              setActiveSheet(wb.SheetNames[0]);
            }
          } catch {
            setError(err?.message || 'Không thể đọc nội dung file Excel.');
          }
          setIsLoading(false);
        }
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [data, fileName]);

  // Extract grid data of current active sheet
  const rawRows: any[][] = useMemo(() => {
    if (!workbook || !activeSheet || !workbook.Sheets[activeSheet]) return [];
    const worksheet = workbook.Sheets[activeSheet];
    return XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
  }, [workbook, activeSheet]);

  // Max column count for standard A, B, C... header
  const maxCols = useMemo(() => {
    if (!rawRows.length) return 0;
    return Math.max(...rawRows.map(r => r.length), 0);
  }, [rawRows]);

  // Column letters: 0 -> A, 1 -> B, 25 -> Z, 26 -> AA...
  const colLetters = useMemo(() => {
    return Array.from({ length: Math.min(maxCols, 50) }, (_, i) => {
      let letter = '';
      let temp = i;
      while (temp >= 0) {
        letter = String.fromCharCode((temp % 26) + 65) + letter;
        temp = Math.floor(temp / 26) - 1;
      }
      return letter;
    });
  }, [maxCols]);

  // Filter rows based on search query
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim()) return rawRows;
    const q = searchQuery.toLowerCase().trim();
    return rawRows.filter(row =>
      row.some(cell => String(cell).toLowerCase().includes(q))
    );
  }, [rawRows, searchQuery]);

  const handleDownloadOriginal = () => {
    if (!workbook) return;
    XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
  };

  const handleExportCsv = () => {
    if (!workbook || !activeSheet) return;
    const ws = workbook.Sheets[activeSheet];
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeSheet}_${fileName.replace(/\.[^/.]+$/, '')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-500 bg-slate-50/70 min-h-[360px]">
        <div className="w-9 h-9 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Đang phân tích bảng tính Excel & cấu trúc Sheet...</p>
        <span className="text-[11px] text-slate-400 mt-1">{fileName}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-rose-600 bg-rose-50/40 min-h-[360px]">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p className="text-sm font-bold">Không thể hiển thị bảng tính</p>
        <p className="text-xs text-rose-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col h-full bg-white select-text border border-slate-200 rounded-lg overflow-hidden", className)}>
      {/* Excel Controls Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-600 text-white rounded shadow-xs">
            <Table className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-slate-800">{fileName}</span>
            <span className="text-[10px] text-slate-400 ml-2 font-mono">
              ({workbook?.SheetNames.length || 0} sheets • {rawRows.length} dòng)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search box within sheet */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm ô dữ liệu..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-hidden focus:ring-1 focus:ring-emerald-500 w-44"
            />
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-white border border-slate-300 rounded-md p-0.5">
            <button
              onClick={() => setCurrentZoom(z => Math.max(70, z - 10))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Thu nhỏ lưới"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="px-1.5 text-[11px] font-mono font-medium text-slate-700 min-w-[36px] text-center">
              {currentZoom}%
            </span>
            <button
              onClick={() => setCurrentZoom(z => Math.min(140, z + 10))}
              className="p-1 hover:bg-slate-100 rounded text-slate-600"
              title="Phóng to lưới"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Export CSV / Download */}
          <button
            onClick={handleExportCsv}
            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md flex items-center gap-1 transition-colors"
            title="Xuất Sheet hiện tại sang CSV"
          >
            <Download className="w-3 h-3" /> CSV
          </button>
          <button
            onClick={handleDownloadOriginal}
            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md flex items-center gap-1 transition-colors"
            title="Lưu file Excel về máy"
          >
            <Download className="w-3 h-3" /> Tải XLSX
          </button>
        </div>
      </div>

      {/* Grid Content Area */}
      <div className="flex-1 overflow-auto bg-slate-100 p-2 relative">
        <div
          style={{ transform: `scale(${currentZoom / 100})`, transformOrigin: 'top left' }}
          className="inline-block min-w-full bg-white shadow-xs rounded border border-slate-300 transition-transform"
        >
          <table className="border-collapse text-left w-full text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 text-slate-500 font-bold sticky top-0 z-10 select-none">
                <th className="w-12 px-2 py-1.5 text-center border-r border-slate-300 bg-slate-200/80 text-[10px] text-slate-500 font-mono">
                  #
                </th>
                {colLetters.map((col, idx) => (
                  <th
                    key={idx}
                    className="px-3 py-1.5 border-r border-slate-300 text-center font-mono text-[11px] min-w-[100px] bg-slate-100"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredRows.length > 0 ? (
                filteredRows.map((row, rIdx) => {
                  const isHeaderRow = rIdx === 0 && row.some(c => typeof c === 'string' && c.toUpperCase() === c && c.length > 3);
                  return (
                    <tr
                      key={rIdx}
                      className={cn(
                        "hover:bg-blue-50/60 transition-colors",
                        isHeaderRow ? "bg-slate-50/90 font-bold text-slate-800" : ""
                      )}
                    >
                      <td className="px-2 py-1 text-center border-r border-slate-300 bg-slate-100/70 font-mono text-[10px] text-slate-400 select-none">
                        {rIdx + 1}
                      </td>
                      {colLetters.map((_, cIdx) => {
                        const cellVal = row[cIdx] !== undefined && row[cIdx] !== null ? row[cIdx] : '';
                        const isNumber = typeof cellVal === 'number';
                        const isFormattedCurrency = isNumber && cellVal >= 1000;
                        const displayVal = isFormattedCurrency
                          ? cellVal.toLocaleString('vi-VN')
                          : String(cellVal);

                        const isMatched = searchQuery.trim() && String(cellVal).toLowerCase().includes(searchQuery.toLowerCase().trim());

                        return (
                          <td
                            key={cIdx}
                            className={cn(
                              "px-3 py-1 border-r border-slate-200 text-slate-700 whitespace-nowrap",
                              isNumber ? "text-right font-mono" : "text-left",
                              isMatched ? "bg-amber-100 font-semibold text-amber-900" : ""
                            )}
                          >
                            {displayVal}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={colLetters.length + 1} className="p-8 text-center text-slate-400">
                    Không tìm thấy dòng nào khớp với từ khóa "{searchQuery}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Sheet Switcher Bar (Like Microsoft Excel / Google Sheets) */}
      <div className="bg-slate-200/90 border-t border-slate-300 px-3 py-1.5 flex items-center gap-1 overflow-x-auto shrink-0 select-none">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 mr-2 px-1">
          <Layers className="w-3 h-3" /> Sheets:
        </span>
        {workbook?.SheetNames.map(sheetName => {
          const isActive = sheetName === activeSheet;
          return (
            <button
              key={sheetName}
              onClick={() => setActiveSheet(sheetName)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-t-md transition-all border border-b-0",
                isActive
                  ? "bg-white text-emerald-800 border-slate-300 shadow-xs font-bold border-t-2 border-t-emerald-600"
                  : "bg-slate-100 text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              {sheetName}
            </button>
          );
        })}
      </div>
    </div>
  );
};
