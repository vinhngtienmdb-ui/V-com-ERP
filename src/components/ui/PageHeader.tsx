import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconBg?: string;
  actions?: React.ReactNode;
  badge?: string;
  badgeColor?: string;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconBg = 'bg-blue-500',
  actions,
  badge,
  badgeColor = 'bg-emerald-100 text-emerald-700',
  className,
}: PageHeaderProps) {
  return (
    <div className={cn(
      'bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4',
      className
    )}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center shrink-0', iconBg)}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg font-bold text-slate-900">{title}</h1>
            {badge && (
              <span className={cn('text-xs font-semibold px-2.5 py-0.5 rounded-full', badgeColor)}>
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-slate-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
