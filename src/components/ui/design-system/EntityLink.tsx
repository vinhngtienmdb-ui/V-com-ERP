import React from 'react';
import { cn } from '../../../lib/utils';
import { useEntityPeek, EntityType } from '../../../context/EntityContext';
import { 
  User, 
  ShoppingBag, 
  BadgeCheck, 
  Boxes, 
  FileText, 
  Headphones, 
  ExternalLink 
} from 'lucide-react';

interface EntityLinkProps {
  type: EntityType;
  id: string;
  label?: string;
  subLabel?: string;
  showIcon?: boolean;
  clickable?: boolean;
  className?: string;
}

const entityConfig: Record<
  EntityType,
  { icon: React.ElementType; color: string; prefix: string }
> = {
  customer: {
    icon: User,
    color: 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100/70',
    prefix: 'KH',
  },
  order: {
    icon: ShoppingBag,
    color: 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100/70',
    prefix: 'ĐH',
  },
  employee: {
    icon: BadgeCheck,
    color: 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100/70',
    prefix: 'NV',
  },
  asset: {
    icon: Boxes,
    color: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70',
    prefix: 'TS',
  },
  invoice: {
    icon: FileText,
    color: 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100/70',
    prefix: 'HD',
  },
  ticket: {
    icon: Headphones,
    color: 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100/70',
    prefix: 'TK',
  },
};

export function EntityLink({
  type,
  id,
  label,
  subLabel,
  showIcon = true,
  clickable = true,
  className,
}: EntityLinkProps) {
  const { openPeek } = useEntityPeek();
  const config = entityConfig[type] || entityConfig.customer;
  const Icon = config.icon;

  const handleClick = (e: React.MouseEvent) => {
    if (!clickable) return;
    e.stopPropagation();
    openPeek(type, id, {
      title: label || id,
      subtitle: subLabel,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Xem 360° thực thể ${id}`}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all duration-150 select-none text-left',
        config.color,
        clickable && 'cursor-pointer hover:shadow-xs active:scale-98',
        className
      )}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0 opacity-80" />}
      <span className="font-mono font-bold tracking-tight">{label || id}</span>
      {subLabel && <span className="text-[11px] opacity-75 truncate max-w-[120px]">({subLabel})</span>}
      {clickable && <ExternalLink className="w-2.5 h-2.5 opacity-50 ml-0.5 shrink-0" />}
    </button>
  );
}
