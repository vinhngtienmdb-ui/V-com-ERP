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
    'bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group relative overflow-hidden',
    color
  )}>
    <div className="flex justify-between items-start mb-4">
      <div className={cn(
        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200',
        iconBg || 'bg-blue-500'
      )}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className={cn(
        'text-xs flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full',
        trend === 'up'
          ? 'text-emerald-700 bg-emerald-50'
          : 'text-rose-700 bg-rose-50'
      )}>
        {trend === 'up' ? '↗' : '↘'} {change}%
      </div>
    </div>
    <div className="text-[12px] text-slate-500 font-medium mb-1">{title}</div>
    <div className="text-xl font-bold text-slate-900 tracking-tight">{value}</div>
    {subValue && (
      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[12px] text-slate-500">
        {subValue}
      </div>
    )}
  </div>
);
