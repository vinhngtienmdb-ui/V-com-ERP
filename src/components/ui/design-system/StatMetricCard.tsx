import React from 'react';
import { cn } from '../../../lib/utils';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface StatMetricCardProps {
  title: string;
  value: string | number;
  change?: number; // percentage, e.g. 12.5 or -4.2
  changeLabel?: string; // e.g. "so với kỳ trước"
  icon: LucideIcon;
  iconColor?: string; // e.g. "text-blue-600 bg-blue-50"
  badgeText?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  tooltip?: string;
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
}

export function StatMetricCard({
  title,
  value,
  change,
  changeLabel = 'so với kỳ trước',
  icon: Icon,
  iconColor = 'text-indigo-600 bg-indigo-50 border-indigo-100',
  badgeText,
  badgeVariant = 'info',
  tooltip,
  onClick,
  className,
  isLoading = false,
}: StatMetricCardProps) {
  const isClickable = !!onClick;

  if (isLoading) {
    return (
      <div className={cn('bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs animate-pulse', className)}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-24 bg-slate-200 rounded" />
          <div className="w-10 h-10 bg-slate-200 rounded-xl" />
        </div>
        <div className="h-8 w-32 bg-slate-200 rounded mb-2" />
        <div className="h-3 w-20 bg-slate-100 rounded" />
      </div>
    );
  }

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;
  const isNeutral = change !== undefined && change === 0;

  return (
    <div
      onClick={onClick}
      title={tooltip}
      className={cn(
        'bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs transition-all duration-200',
        'hover:shadow-md hover:border-slate-300',
        isClickable && 'cursor-pointer active:scale-[0.99]',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider truncate">
              {title}
            </span>
            {badgeText && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {badgeText}
              </span>
            )}
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight truncate">
            {value}
          </div>
        </div>

        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center border shrink-0', iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {change !== undefined && (
        <div className="flex items-center gap-1.5 text-xs mt-3 pt-3 border-t border-slate-100">
          <span
            className={cn(
              'inline-flex items-center font-bold px-1.5 py-0.5 rounded text-[11px]',
              isPositive && 'text-emerald-700 bg-emerald-50',
              isNegative && 'text-rose-700 bg-rose-50',
              isNeutral && 'text-slate-600 bg-slate-100'
            )}
          >
            {isPositive && <TrendingUp className="w-3 h-3 mr-0.5" />}
            {isNegative && <TrendingDown className="w-3 h-3 mr-0.5" />}
            {isNeutral && <Minus className="w-3 h-3 mr-0.5" />}
            {Math.abs(change)}%
          </span>
          <span className="text-slate-400 font-medium text-[11px] truncate">
            {changeLabel}
          </span>
        </div>
      )}
    </div>
  );
}
