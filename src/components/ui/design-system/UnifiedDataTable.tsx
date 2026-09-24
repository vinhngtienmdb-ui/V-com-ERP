import React, { useState, useMemo } from 'react';
import { cn } from '../../../lib/utils';
import { 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Inbox,
  CheckSquare,
  Square
} from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  title: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
  width?: string;
}

export interface UnifiedDataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  pageSize?: number;
  showPagination?: boolean;
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (keys: string[]) => void;
  batchActions?: (selectedRows: T[]) => React.ReactNode;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  emptyDescription?: string;
  isLoading?: boolean;
  className?: string;
}

export function UnifiedDataTable<T>({
  columns,
  data,
  keyExtractor,
  pageSize = 10,
  showPagination = true,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  batchActions,
  onRowClick,
  emptyMessage = 'Không tìm thấy dữ liệu',
  emptyDescription = 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm để xem kết quả.',
  isLoading = false,
  className,
}: UnifiedDataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Handle column sort toggle
  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  // Sorted data
  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const column = columns.find((c) => c.key === sortKey);
    if (!column) return data;

    return [...data].sort((a, b) => {
      let valA: any;
      let valB: any;
      if (column.sortValue) {
        valA = column.sortValue(a);
        valB = column.sortValue(b);
      } else {
        valA = (a as any)[sortKey];
        valB = (b as any)[sortKey];
      }

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      const compare = valA < valB ? -1 : 1;
      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [data, sortKey, sortDirection, columns]);

  // Paginated slice
  const totalPages = Math.ceil(sortedData.length / currentPageSize) || 1;
  const paginatedData = useMemo(() => {
    if (!showPagination) return sortedData;
    const start = (currentPage - 1) * currentPageSize;
    return sortedData.slice(start, start + currentPageSize);
  }, [sortedData, currentPage, currentPageSize, showPagination]);

  // Select all on current page
  const pageKeys = useMemo(() => paginatedData.map(keyExtractor), [paginatedData, keyExtractor]);
  const isAllPageSelected = pageKeys.length > 0 && pageKeys.every((k) => selectedKeys.includes(k));
  const isSomeSelected = pageKeys.some((k) => selectedKeys.includes(k)) && !isAllPageSelected;

  const toggleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllPageSelected) {
      onSelectionChange(selectedKeys.filter((k) => !pageKeys.includes(k)));
    } else {
      const newKeys = Array.from(new Set([...selectedKeys, ...pageKeys]));
      onSelectionChange(newKeys);
    }
  };

  const toggleRow = (key: string) => {
    if (!onSelectionChange) return;
    if (selectedKeys.includes(key)) {
      onSelectionChange(selectedKeys.filter((k) => k !== key));
    } else {
      onSelectionChange([...selectedKeys, key]);
    }
  };

  const selectedRows = useMemo(() => {
    const set = new Set(selectedKeys);
    return data.filter((row) => set.has(keyExtractor(row)));
  }, [data, selectedKeys, keyExtractor]);

  return (
    <div className={cn('bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden flex flex-col', className)}>
      {/* Batch Actions Bar (when rows are selected) */}
      {selectable && selectedKeys.length > 0 && (
        <div className="bg-indigo-50/90 border-b border-indigo-100 px-4 py-2.5 flex items-center justify-between gap-3 text-xs text-indigo-900">
          <div className="flex items-center gap-2 font-bold">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span>Đã chọn {selectedKeys.length} bản ghi</span>
            <button
              onClick={() => onSelectionChange?.([])}
              className="text-xs text-indigo-600 hover:text-indigo-800 underline ml-2 cursor-pointer"
            >
              Bỏ chọn tất cả
            </button>
          </div>
          {batchActions && <div>{batchActions(selectedRows)}</div>}
        </div>
      )}

      {/* Table Element */}
      <div className="overflow-x-auto custom-scrollbar flex-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
              {selectable && (
                <th className="w-10 px-4 py-3 text-center">
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    aria-label="Chọn tất cả các dòng trên trang này"
                    className="cursor-pointer text-slate-400 hover:text-slate-600 inline-flex items-center"
                  >
                    {isAllPageSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600" />
                    ) : (
                      <Square className={cn("w-4 h-4", isSomeSelected ? "text-indigo-400" : "text-slate-300")} />
                    )}
                  </button>
                </th>
              )}

              {columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      'px-4 py-3 whitespace-nowrap select-none',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right',
                      col.sortable && 'cursor-pointer hover:bg-slate-100/80 transition-colors',
                      col.className
                    )}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <div
                      className={cn(
                        'inline-flex items-center gap-1.5',
                        col.align === 'center' && 'justify-center',
                        col.align === 'right' && 'justify-end'
                      )}
                    >
                      <span>{col.title}</span>
                      {col.sortable && (
                        <span className="text-slate-400">
                          {isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="w-3 h-3 text-indigo-600 font-black" />
                            ) : (
                              <ArrowDown className="w-3 h-3 text-indigo-600 font-black" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-300 hover:text-slate-500" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: currentPageSize }).map((_, rIdx) => (
                <tr key={rIdx} className="animate-pulse">
                  {selectable && (
                    <td className="px-4 py-3 text-center">
                      <div className="w-4 h-4 bg-slate-200 rounded mx-auto" />
                    </td>
                  )}
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-4 py-3">
                      <div className="h-4 bg-slate-200/80 rounded w-4/5" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length + (selectable ? 1 : 0)} className="py-16 text-center">
                  <div className="max-w-xs mx-auto flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                      <Inbox className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-800">{emptyMessage}</div>
                    <p className="text-xs text-slate-500 mt-1">{emptyDescription}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Real Data Rows
              paginatedData.map((row, idx) => {
                const key = keyExtractor(row);
                const isSelected = selectedKeys.includes(key);

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick?.(row)}
                    className={cn(
                      'transition-colors duration-100',
                      onRowClick && 'cursor-pointer',
                      isSelected
                        ? 'bg-indigo-50/50 hover:bg-indigo-50/80'
                        : 'hover:bg-slate-50/80'
                    )}
                  >
                    {selectable && (
                      <td
                        className="px-4 py-3 text-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(key);
                        }}
                      >
                        <button type="button" aria-label={`Chọn dòng ${key}`} className="cursor-pointer text-slate-400 inline-flex items-center">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                          )}
                        </button>
                      </td>
                    )}

                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 text-slate-700 font-medium whitespace-nowrap',
                          col.align === 'center' && 'text-center',
                          col.align === 'right' && 'text-right',
                          col.className
                        )}
                      >
                        {col.render ? col.render(row, idx) : (row as any)[col.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {showPagination && !isLoading && sortedData.length > 0 && (
        <div className="border-t border-slate-200 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Hiển thị</span>
            <select
              value={currentPageSize}
              onChange={(e) => {
                setCurrentPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              aria-label="Số dòng trên mỗi trang"
              className="py-1 px-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-slate-50 focus:outline-none"
            >
              {[10, 25, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size} dòng
                </option>
              ))}
            </select>
            <span>
              trên tổng số <strong className="text-slate-900 font-bold">{sortedData.length}</strong> bản ghi
            </span>
          </div>

          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            <span className="mr-2">
              Trang <strong>{currentPage}</strong> / <strong>{totalPages}</strong>
            </span>

            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              aria-label="Đến trang đầu tiên"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Đến trang trước"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Đến trang tiếp theo"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              aria-label="Đến trang cuối cùng"
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
