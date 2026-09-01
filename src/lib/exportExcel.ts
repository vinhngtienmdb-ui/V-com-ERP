import ExcelJS from 'exceljs';

export interface ExportColumn<T> {
  header: string;
  key: keyof T | ((row: T) => string | number);
  width?: number;
}

/**
 * Xuất Excel bằng exceljs (thay xlsx/SheetJS — GHSA-4r6h-8v6p-xvw6,
 * ReDoS GHSA-5pgg-2g8v-p4x9, upstream không còn fix).
 * Giữ nguyên API exportToExcel/exportToCSV để không phá nơi gọi.
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExportColumn<T>[],
  fileName: string,
  sheetName = 'Sheet1'
) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);

  // Header
  const headerRow = ws.addRow(columns.map(c => c.header));
  headerRow.font = { bold: true };
  headerRow.eachCell(cell => {
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: 'FFEFF6FF' }
    };
  });
  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width ?? 20;
  });

  // Data
  for (const row of data) {
    ws.addRow(
      columns.map(col =>
        typeof col.key === 'function'
          ? col.key(row)
          : (row[col.key] ?? '') as string | number
      )
    );
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
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
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
