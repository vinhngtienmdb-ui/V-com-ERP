import React from 'react';
import { cn } from '../../../lib/utils';
import { LucideIcon, ChevronRight, Home, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface AppTabItem {
  id: string;
  label: string;
  count?: number | string;
  icon?: LucideIcon;
  badge?: string;
}

export interface AppModuleShellProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconGradient?: string; // e.g. "from-blue-600 to-indigo-600"
  categoryLabel?: string; // e.g. "Bán Hàng & CRM", "Chuỗi Cung Ứng", "Nhân Sự"
  badge?: string;
  badgeVariant?: 'success' | 'warning' | 'info' | 'brand';
  breadcrumbs?: { label: string; path?: string }[];
  tabs?: AppTabItem[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  actions?: React.ReactNode;
  secondaryActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}

export function AppModuleShell({
  title,
  description,
  icon: Icon,
  iconGradient = 'from-indigo-600 to-blue-600',
  categoryLabel,
  badge,
  breadcrumbs,
  tabs,
  activeTab,
  onTabChange,
  actions,
  secondaryActions,
  children,
  className,
  containerClassName,
}: AppModuleShellProps) {
  const navigate = useNavigate();

  return (
    <div className={cn('space-y-5 pb-12', className)}>
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 md:p-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 mb-3 text-xs text-slate-500 font-medium">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              <span>ERP Portal</span>
            </button>
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                <ChevronRight className="w-3 h-3 text-slate-400" />
                {crumb.path ? (
                  <button
                    onClick={() => navigate(crumb.path!)}
                    className="hover:text-indigo-600 transition-colors"
                  >
                    {crumb.label}
                  </button>
                ) : (
                  <span className="text-slate-900 font-semibold">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title + Icon + Actions Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'w-13 h-13 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white shadow-sm shrink-0',
                iconGradient
              )}
            >
              <Icon className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                  {title}
                </h1>
                {categoryLabel && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider">
                    {categoryLabel}
                  </span>
                )}
                {badge && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Sparkles className="w-3 h-3" />
                    {badge}
                  </span>
                )}
              </div>

              {description && (
                <p className="text-xs md:text-sm text-slate-500 mt-1 line-clamp-2 max-w-3xl">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Header Action Buttons */}
          {(actions || secondaryActions) && (
            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              {secondaryActions}
              {actions}
            </div>
          )}
        </div>

        {/* Standardized Tabs Bar */}
        {tabs && tabs.length > 0 && (
          <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar mt-6 pt-4 border-t border-slate-100">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all duration-150 select-none cursor-pointer',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  )}
                >
                  {TabIcon && <TabIcon className="w-4 h-4 shrink-0" />}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        'text-[10px] font-black px-1.5 py-0.2 rounded-full',
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-200/70 text-slate-700'
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                  {tab.badge && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-amber-950">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Content Body */}
      <div className={cn('space-y-5', containerClassName)}>
        {children}
      </div>
    </div>
  );
}
