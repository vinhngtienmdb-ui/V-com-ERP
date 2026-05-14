import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutGrid } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { flatNavItems } from '../constants';

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  const [logo, setLogo] = React.useState<string | null>(null);

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
    <aside className="w-[220px] bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo area */}
      <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
        {logo ? (
          <img src={logo} alt="Logo" className="h-7 w-auto object-contain" referrerPolicy="no-referrer" />
        ) : (
          <>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <LayoutGrid className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-[15px] text-slate-900 leading-tight truncate">VComm ERP</div>
              <div className="text-[11px] text-slate-400 leading-tight truncate">Quản lý doanh nghiệp</div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
        {flatNavItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const prevSection = index > 0 ? flatNavItems[index - 1].section : item.section;
          const showDivider = index > 0 && item.section && item.section !== prevSection;

          return (
            <React.Fragment key={`${item.label}-${item.path}-${index}`}>
              {showDivider && (
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {item.section}
                  </span>
                </div>
              )}
              {index === 0 && item.section && (
                <div className="px-4 pt-1 pb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {item.section}
                  </span>
                </div>
              )}
              <button
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors border-l-[3px]',
                  isActive
                    ? 'border-blue-500 bg-blue-50 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            </React.Fragment>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-slate-100">
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
