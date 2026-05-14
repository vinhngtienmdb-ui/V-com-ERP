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
    <aside className="w-[210px] bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo area */}
      <div className="px-4 py-4 flex items-center gap-2.5">
        {logo ? (
          <img src={logo} alt="Logo" className="h-7 w-auto object-contain" referrerPolicy="no-referrer" />
        ) : (
          <>
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <LayoutGrid className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-sm text-slate-900 leading-tight truncate">VComm ERP</div>
              <div className="text-[10px] text-slate-400 leading-tight truncate">Quản lý doanh nghiệp</div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {flatNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={`${item.label}-${item.path}`}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors border-l-[3px]',
                isActive
                  ? 'border-blue-500 bg-blue-50 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:bg-slate-50'
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
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
