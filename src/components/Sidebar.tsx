import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, PanelLeftClose, PanelLeftOpen, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { navGroups } from '../constants';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, staffInfo } = useAuth();

  const [logo, setLogo] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState(() =>
    localStorage.getItem('sidebar-collapsed') === 'true'
  );

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('sidebar-collapsed', String(next));
  };

  React.useEffect(() => {
    const savedLogo = localStorage.getItem('system-logo');
    if (savedLogo) setLogo(savedLogo);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'system-logo') setLogo(e.newValue);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full shrink-0 transition-[width] duration-300 ease-in-out overflow-hidden',
        'bg-white border-r border-slate-200',
        collapsed ? 'w-[56px]' : 'w-[240px]'
      )}
    >
      {/* ── Brand + toggle ─────────────────────────────────────── */}
      <div className={cn(
        'flex items-center border-b border-slate-200 shrink-0 h-14',
        collapsed ? 'justify-center px-0' : 'px-4 justify-between gap-2'
      )}>
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            {logo
              ? <img src={logo} alt="Logo" className="h-6 w-auto object-contain shrink-0" referrerPolicy="no-referrer" />
              : (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-4 h-4 border-2 border-blue-600 rotate-45 shrink-0" />
                  <span className="font-mono text-[13px] font-bold text-slate-800 tracking-wide truncate">
                    VCOMM <span className="text-blue-600">ERP</span>
                  </span>
                </div>
              )
            }
          </div>
        )}

        {collapsed && (
          logo
            ? <img src={logo} alt="Logo" className="h-6 w-auto object-contain" referrerPolicy="no-referrer" />
            : <div className="w-4 h-4 border-2 border-blue-600 rotate-45" />
        )}

        {!collapsed && (
          <button
            onClick={toggleCollapsed}
            title="Thu gọn"
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={toggleCollapsed}
          title="Mở rộng"
          className="flex items-center justify-center py-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-200"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
      )}

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto custom-scrollbar py-2 space-y-0">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="mx-3 my-2 border-t border-slate-100" />}

            {!collapsed && (
              <div className="px-4 pt-3 pb-1.5">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                  {group.title}
                </span>
              </div>
            )}

            <div className="space-y-px px-2">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    data-tooltip={collapsed ? item.label : undefined}
                    className={cn(
                      'w-full flex items-center gap-2.5 text-[13px] transition-all duration-150 group relative rounded-lg',
                      collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2',
                      isActive ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    )}
                  >
                    {/* Active indicator strip */}
                    {isActive && (
                      <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-blue-600" />
                    )}

                    <item.icon className={cn(
                      'shrink-0',
                      collapsed ? 'w-[18px] h-[18px]' : 'w-[15px] h-[15px]',
                      isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'
                    )} />

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left truncate text-[13px] font-medium leading-snug">
                          {item.label}
                        </span>
                        {isActive && (
                          <ChevronRight className="w-3 h-3 text-blue-500 shrink-0" />
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-200">
        {!collapsed && staffInfo && (
          <div className="px-4 py-2.5 flex items-center gap-2 border-b border-slate-100">
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {(staffInfo.name || staffInfo.email || 'U').charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-slate-700 truncate leading-none">{staffInfo.name || staffInfo.email}</p>
              <p className="font-mono text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">{staffInfo.role || 'staff'}</p>
            </div>
          </div>
        )}

        <button
          onClick={() => signOut()}
          data-tooltip={collapsed ? 'Đăng xuất' : undefined}
          className={cn(
            'w-full flex items-center gap-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors',
            collapsed ? 'justify-center px-0 py-3' : 'px-4 py-2.5'
          )}
        >
          <LogOut className="w-[14px] h-[14px] shrink-0" />
          {!collapsed && <span className="text-[12px]">Đăng xuất</span>}
        </button>
      </div>
    </aside>
  );
}
