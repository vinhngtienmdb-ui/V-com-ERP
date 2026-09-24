import React from 'react';
import { cn } from '../../../lib/utils';
import { LucideIcon } from 'lucide-react';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand' | 'purple';
export type BadgeSize = 'xs' | 'sm' | 'md';

interface StatusBadgeProps {
  children: React.ReactNode;
  variant?: StatusVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: LucideIcon;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<StatusVariant, { badge: string; dot: string }> = {
  success: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70',
    dot: 'bg-emerald-500',
  },
  warning: {
    badge: 'bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/70',
    dot: 'bg-amber-500',
  },
  danger: {
    badge: 'bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/70',
    dot: 'bg-rose-500',
  },
  info: {
    badge: 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100/70',
    dot: 'bg-blue-500',
  },
  neutral: {
    badge: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200/70',
    dot: 'bg-slate-400',
  },
  brand: {
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/70',
    dot: 'bg-indigo-500',
  },
  purple: {
    badge: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/70',
    dot: 'bg-purple-500',
  },
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'text-[10px] px-1.5 py-0.5 font-semibold gap-1',
  sm: 'text-xs px-2.5 py-0.5 font-medium gap-1.5',
  md: 'text-xs px-3 py-1 font-semibold gap-1.5',
};

export function StatusBadge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  icon: Icon,
  className,
  onClick,
}: StatusBadgeProps) {
  const styles = variantStyles[variant] || variantStyles.neutral;
  const isClickable = !!onClick;

  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full border transition-all select-none',
        styles.badge,
        sizeStyles[size],
        isClickable && 'cursor-pointer hover:shadow-xs active:scale-95',
        className
      )}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0 animate-pulse', styles.dot)} />
      )}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      <span className="truncate">{children}</span>
    </span>
  );
}
