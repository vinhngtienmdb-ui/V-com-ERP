import * as XLSX from 'xlsx';

export interface ExportColumn<T> {
  header: string;
  key: keyof T | ((row: T) => string | number);
  width?: number;
}

export function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  fileName: string,
  sheetName = 'Sheet1'
) {
  const rows = data.map(row =>
    Object.fromEntries(
      columns.map(col => [
        col.header,
        typeof col.key === 'function'
          ? col.key(row)
          : (row[col.key] ?? '') as string | number,
      ])
    )
  );

  const ws = XLSX.utils.json_to_sheet(rows);

  // Column widths
  ws['!cols'] = columns.map(c => ({ wch: c.width ?? 20 }));

  // Header style (bold)
  const range = XLSX.utils.decode_range(ws['!ref'] ?? 'A1');
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[addr]) continue;
    ws[addr].s = { font: { bold: true }, fill: { fgColor: { rgb: 'EFF6FF' } } };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  fileName: string
) {
  const headers = columns.map(c => c.header).join(',');
  const rows = data.map(row =>
    columns
      .map(col => {
        const val = typeof col.key === 'function' ? col.key(row) : (row[col.key] ?? '');
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(',')
  );
  const csv = [headers, ...rows].join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
