import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface CompactPageHeaderProps {
  icon?: React.ReactNode;
  title: string;
  badge?: {
    text: string;
    variant?: 'blue' | 'emerald' | 'amber' | 'purple' | 'slate';
  };
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const CompactPageHeader: React.FC<CompactPageHeaderProps> = ({
  icon,
  title,
  badge,
  description,
  actions,
  className
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getBadgeClass = (variant = 'blue') => {
    switch (variant) {
      case 'emerald':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'amber':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'purple':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'slate':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'blue':
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className={cn(
      "flex flex-wrap items-center justify-between gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs relative",
      className
    )}>
      {/* Left: Icon + Title + Badge + Tooltip Info */}
      <div className="flex items-center gap-2.5 min-w-0">
        {icon && (
          <div className="p-1.5 bg-slate-100 text-slate-700 rounded-lg shrink-0">
            {icon}
          </div>
        )}

        <div className="flex items-center gap-2 min-w-0">
          <h1 className="text-base font-black text-slate-900 tracking-tight truncate leading-none">
            {title}
          </h1>

          {badge && (
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase border shrink-0 leading-tight",
              getBadgeClass(badge.variant)
            )}>
              {badge.text}
            </span>
          )}

          {description && (
            <div className="relative shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => setShowTooltip(!showTooltip)}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded-md hover:bg-slate-100 cursor-pointer"
                title="Xem giới thiệu phân hệ"
              >
                <Info className="w-3.5 h-3.5" />
              </button>

              {showTooltip && (
                <div className="absolute left-0 top-full mt-1.5 z-50 w-72 sm:w-96 p-3 bg-slate-900 text-white rounded-xl shadow-xl text-xs leading-relaxed border border-slate-800 animate-in fade-in duration-150">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] text-slate-300">{description}</p>
                    <button 
                      onClick={() => setShowTooltip(false)}
                      className="text-slate-400 hover:text-white shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      {actions && (
        <div className="flex items-center gap-2 shrink-0 ml-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
