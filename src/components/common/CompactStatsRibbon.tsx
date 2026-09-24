import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface MetricRibbonItem {
  id: string;
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  subText?: string;
  colorVariant?: 'amber' | 'emerald' | 'blue' | 'purple' | 'rose' | 'slate';
  onClick?: () => void;
  isActive?: boolean;
  badge?: string;
}

export interface CompactStatsRibbonProps {
  items: MetricRibbonItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  storageKey?: string;
  className?: string;
}

export const CompactStatsRibbon: React.FC<CompactStatsRibbonProps> = ({
  items,
  collapsible = true,
  defaultCollapsed = false,
  storageKey,
  className
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(`ribbon_${storageKey}`);
      if (saved !== null) return saved === 'true';
    }
    return defaultCollapsed;
  });

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      if (storageKey && typeof window !== 'undefined') {
        localStorage.setItem(`ribbon_${storageKey}`, String(next));
      }
      return next;
    });
  };

  const getColorStyles = (variant = 'slate', isActive = false) => {
    if (isActive) {
      return 'bg-slate-900 text-white ring-1 ring-slate-900 shadow-2xs';
    }

    switch (variant) {
      case 'amber':
        return 'hover:bg-amber-50/80 text-amber-700';
      case 'emerald':
        return 'hover:bg-emerald-50/80 text-emerald-700';
      case 'blue':
        return 'hover:bg-blue-50/80 text-blue-700';
      case 'purple':
        return 'hover:bg-purple-50/80 text-purple-700';
      case 'rose':
        return 'hover:bg-rose-50/80 text-rose-700';
      case 'slate':
      default:
        return 'hover:bg-slate-50 text-slate-700';
    }
  };

  const getValueColor = (variant = 'slate', isActive = false) => {
    if (isActive) return 'text-white';
    switch (variant) {
      case 'amber':
        return 'text-amber-600';
      case 'emerald':
        return 'text-emerald-600';
      case 'blue':
        return 'text-blue-600';
      case 'purple':
        return 'text-purple-600';
      case 'rose':
        return 'text-rose-600';
      case 'slate':
      default:
        return 'text-slate-900';
    }
  };

  if (isCollapsed) {
    return (
      <div className={cn("flex justify-end", className)}>
        <button
          onClick={toggleCollapse}
          className="text-[11px] font-bold text-slate-500 hover:text-slate-800 bg-white/80 border border-slate-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
          title="Mở rộng dải chỉ số thống kê"
        >
          <BarChart2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Hiện chỉ số ({items.length})</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-2xs flex items-stretch divide-x divide-slate-200/80 overflow-x-auto scrollbar-none",
      className
    )}>
      {/* Items List */}
      <div className="flex items-stretch divide-x divide-slate-200/80 flex-1 min-w-0">
        {items.map(item => {
          const isClickable = Boolean(item.onClick);
          const colorClass = getColorStyles(item.colorVariant, item.isActive);
          const valColor = getValueColor(item.colorVariant, item.isActive);

          return (
            <div
              key={item.id}
              onClick={item.onClick}
              className={cn(
                "px-3.5 py-2 flex items-center gap-2.5 shrink-0 transition-colors select-none",
                isClickable ? "cursor-pointer" : "cursor-default",
                colorClass
              )}
            >
              {item.icon && (
                <div className={cn("shrink-0", item.isActive ? "text-white" : "opacity-85")}>
                  {item.icon}
                </div>
              )}

              <div className="flex items-baseline gap-1.5 leading-none">
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                  item.isActive ? "text-slate-200" : "text-slate-500"
                )}>
                  {item.label}:
                </span>

                <span className={cn("text-xs font-black tracking-tight", valColor)}>
                  {item.value}
                </span>

                {item.subText && (
                  <span className={cn(
                    "text-[10px] whitespace-nowrap hidden sm:inline",
                    item.isActive ? "text-slate-300" : "text-slate-400 font-medium"
                  )}>
                    {item.subText}
                  </span>
                )}

                {item.badge && (
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-amber-500 text-white ml-1">
                    {item.badge}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Collapse Toggle Button */}
      {collapsible && (
        <button
          onClick={toggleCollapse}
          className="px-2 py-2 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 shrink-0 transition-colors cursor-pointer"
          title="Thu gọn dải chỉ số để tối đa hóa không gian bảng"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
