import React from 'react';
import { cn } from '../../../lib/utils';
import { Search, X, Filter, RotateCcw } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (val: string) => void;
}

export interface FilterToolbarProps {
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filterGroups?: FilterGroup[];
  activeFiltersCount?: number;
  onResetFilters?: () => void;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function FilterToolbar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  filterGroups,
  activeFiltersCount = 0,
  onResetFilters,
  actions,
  className,
  children,
}: FilterToolbarProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3',
        className
      )}
    >
      {/* Search Bar & Dropdown Filters */}
      <div className="flex flex-1 items-center gap-2.5 flex-wrap">
        {onSearchChange && (
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs text-slate-900 placeholder:text-slate-400 font-medium rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* Filter Dropdowns */}
        {filterGroups &&
          filterGroups.map((group) => (
            <div key={group.id} className="relative">
              <select
                value={group.value}
                onChange={(e) => group.onChange(e.target.value)}
                aria-label={group.label}
                className="py-2 pl-3 pr-8 bg-slate-50 hover:bg-slate-100/70 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
              >
                {group.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Filter className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          ))}

        {/* Reset Filters Button */}
        {activeFiltersCount > 0 && onResetFilters && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa lọc ({activeFiltersCount})</span>
          </button>
        )}

        {children}
      </div>

      {/* Extra Action Buttons (Export, Batch, etc.) */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
          {actions}
        </div>
      )}
    </div>
  );
}
