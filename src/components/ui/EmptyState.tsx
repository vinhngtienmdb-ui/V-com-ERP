import React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
  variant?: 'default' | 'compact' | 'card';
}

/**
 * Empty state UI — hiển thị khi collection rỗng (production thật chưa có data).
 * Dùng thay cho hard-coded mock fallback ở các module wire-through.
 *
 * Examples:
 *   <EmptyState title="Chưa có đơn hàng" description="Đơn từ eMenu / iPos sẽ hiển thị tại đây" />
 *   <EmptyState icon={Users} title="Chưa có khách hàng" action={{ label: 'Thêm khách', onClick: () => ... }} />
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
  variant = 'default',
}: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-3 text-slate-500 text-sm py-4", className)}>
        <Icon className="w-5 h-5 shrink-0" />
        <div>
          <span className="font-medium text-slate-700">{title}</span>
          {description && <span className="ml-2 text-slate-500">— {description}</span>}
        </div>
      </div>
    );
  }

  const wrapper = variant === 'card'
    ? "bg-white rounded-xl border border-slate-300 shadow-sm p-8"
    : "p-8";

  return (
    <div className={cn(wrapper, "flex flex-col items-center justify-center text-center", className)}>
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-bold text-slate-800 mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-slate-500 max-w-md mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
