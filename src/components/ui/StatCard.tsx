import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: LucideIcon;
  trend: 'up' | 'down';
  subValue?: React.ReactNode;
  color?: string;
  iconBg?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title, value, change, icon: Icon, trend, subValue, color, iconBg
}) => (
  <div className={cn(
    'bg-white p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all duration-200 group relative overflow-hidden flex flex-col justify-between',
    color
  )}>
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className={cn(
          'w-6 h-6 rounded flex items-center justify-center shrink-0 transition-transform duration-200',
          iconBg || 'bg-blue-500'
        )}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{title}</div>
      </div>
      <div className={cn(
        'text-[10px] flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded border',
        trend === 'up'
          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
          : 'text-rose-700 bg-rose-50 border-rose-200'
      )}>
        {trend === 'up' ? '↗' : '↘'} {change}%
      </div>
    </div>
    <div className="text-xl font-bold text-slate-900 tracking-tight mt-auto">{value}</div>
    {subValue && (
      <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
        {subValue}
      </div>
    )}
  </div>
);
