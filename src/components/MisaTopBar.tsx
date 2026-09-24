import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Grid3X3, 
  Bell, 
  MessageSquare, 
  HelpCircle, 
  MoreHorizontal, 
  LogOut, 
  Search, 
  ShoppingBag,
  Home as HomeIcon,
  X,
  ExternalLink,
  ChevronRight,
  Shield,
  User,
  Sparkles,
  ArrowLeft,
  Star,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MISA_APPS, MisaAppItem, CATEGORY_GROUPS } from '../data/misaApps';
import { useStarredApps } from '../hooks/useStarredApps';
import { safeLocalStorage } from '../lib/storage';
import { cn } from '../lib/utils';

export function MisaTopBar({ onOpenAppDrawer, onOpenCommandPalette }: { onOpenAppDrawer?: () => void; onOpenCommandPalette?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { staffInfo, signOut } = useAuth();
  const { starredIds, isStarred, toggleStar } = useStarredApps();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isAppDrawerOpen, setIsAppDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState('');

  // Background appearance: 'white' (nền trắng sáng), 'glass' (nền kính mờ xuyên thấu), 'dark' (nền tối mờ)
  const [launcherTheme, setLauncherTheme] = useState<'white' | 'glass' | 'dark'>(() => {
    return (safeLocalStorage.getItem('vcomm_launcher_theme') as any) || 'white';
  });

  const handleThemeSelect = (t: 'white' | 'glass' | 'dark') => {
    setLauncherTheme(t);
    safeLocalStorage.setItem('vcomm_launcher_theme', t);
  };

  // Handle ESC key to close app drawer
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAppDrawerOpen) {
        setIsAppDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAppDrawerOpen]);

  // Find the currently active app based on pathname and search query
  const currentApp = React.useMemo(() => {
    if (location.pathname === '/') {
      return {
        name: 'VComm Cloud Portal',
        color: 'from-orange-500 to-amber-600',
        icon: HomeIcon,
      };
    }
    const currentFullUrl = location.pathname + location.search;
    // 1. Exact match with search params (e.g. /hr?tab=insurance)
    const exactMatch = MISA_APPS.find(app => app.path === currentFullUrl);
    if (exactMatch) return exactMatch;

    // 2. Exact match with pathname (e.g. /finance)
    const baseMatch = MISA_APPS.find(app => app.path === location.pathname);
    if (baseMatch) return baseMatch;

    // 3. Fallback matching base route
    const fallbackMatch = MISA_APPS.find(app => {
      const baseRoute = app.path.split('?')[0];
      return location.pathname === baseRoute;
    });
    return fallbackMatch || {
      name: 'VComm ERP',
      color: 'from-blue-600 to-indigo-700',
      icon: ShoppingBag,
    };
  }, [location.pathname, location.search]);

  const CurrentIcon = currentApp.icon;

  // Category definitions with colors
  const categorySections = [
    { id: 'my_apps', title: '⭐ Ứng dụng của tôi', colorDark: 'text-amber-400', colorLight: 'text-amber-600' },
    { id: 'kinh_doanh', title: 'Kinh doanh & Bán hàng', colorDark: 'text-rose-400', colorLight: 'text-rose-600' },
    { id: 'cskh', title: 'CSKH & Dịch vụ', colorDark: 'text-orange-400', colorLight: 'text-orange-600' },
    { id: 'tai_chinh', title: 'Tài chính & Kế toán', colorDark: 'text-emerald-400', colorLight: 'text-emerald-600' },
    { id: 'chuoi_cung_ung', title: 'Kho & Chuỗi cung ứng', colorDark: 'text-blue-400', colorLight: 'text-blue-600' },
    { id: 'nhan_su', title: 'Nhân sự & Đào tạo', colorDark: 'text-amber-400', colorLight: 'text-amber-600' },
    { id: 'van_phong_so', title: 'Văn phòng số & Điều hành', colorDark: 'text-indigo-400', colorLight: 'text-indigo-600' },
    { id: 'he_thong_it', title: 'Hệ thống & IT Helpdesk', colorDark: 'text-cyan-400', colorLight: 'text-cyan-600' },
  ];

  // Grouped apps for the 9-dots drawer
  const groupedApps = React.useMemo(() => {
    const q = drawerSearch.trim().toLowerCase();
    const filtered = q 
      ? MISA_APPS.filter(a => a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
      : MISA_APPS;

    return {
      all: filtered,
      my_apps: filtered.filter(a => starredIds.includes(a.id)),
      kinh_doanh: filtered.filter(a => a.category === 'kinh_doanh'),
      cskh: filtered.filter(a => a.category === 'cskh'),
      tai_chinh: filtered.filter(a => a.category === 'tai_chinh'),
      chuoi_cung_ung: filtered.filter(a => a.category === 'chuoi_cung_ung'),
      nhan_su: filtered.filter(a => a.category === 'nhan_su'),
      van_phong_so: filtered.filter(a => a.category === 'van_phong_so'),
      he_thong_it: filtered.filter(a => a.category === 'he_thong_it'),
    };
  }, [drawerSearch, starredIds]);

  const handleAppSelect = (path: string) => {
    setIsAppDrawerOpen(false);
    navigate(path);
  };

  return (
    <>
      {/* Top Header Bar styled with modern Enterprise Glassmorphism */}
      <header className="h-12 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 text-slate-100 flex items-center justify-between px-3 sm:px-4 shadow-sm z-40 shrink-0 select-none">
        
        {/* Left: Brand + 9-Dots Launcher Button + Current App Name */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity pr-1 shrink-0"
            title="Về Màn hình Launcher"
          >
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xs">V</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-white hidden sm:inline">
              VComm ERP
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-800 shrink-0" />

          {/* 9-dots App Launcher Button */}
          <button
            onClick={() => setIsAppDrawerOpen(prev => !prev)}
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition-all cursor-pointer border active:scale-95",
              isAppDrawerOpen
                ? "bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/20"
                : "bg-slate-800/80 hover:bg-slate-700/80 border-slate-700/50 text-slate-300 hover:text-white"
            )}
            title="Tất cả ứng dụng (App Launcher)"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>

          {/* Current App Indicator Tab */}
          <div 
            className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-800/50 border border-slate-700/50 shadow-xs"
          >
            <div className={cn("w-4.5 h-4.5 rounded flex items-center justify-center text-white bg-gradient-to-br shadow-xs", currentApp.color || "from-blue-600 to-indigo-600")}>
              <CurrentIcon className="w-3 h-3" />
            </div>
            <span className="font-bold text-xs tracking-tight text-slate-100 flex items-center gap-1.5">
              {currentApp.name}
            </span>
          </div>

          {/* Quick Back to Launcher Button when inside any mini app */}
          {location.pathname !== '/' && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Quay lại Màn hình Launcher chính (/)"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Quay lại Launcher</span>
              <span className="sm:hidden">Launcher</span>
            </button>
          )}

        </div>

        {/* Center: Quick Search for Core eCommerce / Modules */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-slate-800/90 hover:bg-slate-700/90 text-slate-300 hover:text-white border border-slate-700/70 text-xs font-medium shadow-xs cursor-pointer transition-all active:scale-95"
            title="Mở Command Palette (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden lg:inline text-slate-300">Tìm nhanh tính năng, chứng từ, đơn hàng...</span>
            <span className="lg:hidden text-slate-300">Tìm kiếm...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-900 text-slate-400 rounded border border-slate-700 font-mono font-bold">
              Ctrl K
            </kbd>
          </button>

          <button
            onClick={() => navigate('/orders')}
            className="px-3 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700/60 shadow-2xs"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-rose-400" />
            <span>Đơn hàng TMĐT Core</span>
            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded text-[9px] font-black">Nền tảng chính</span>
          </button>
        </div>

        {/* Right: Launcher Button, Notifications, Chat, Help & User Profile */}
        <div className="flex items-center gap-1 sm:gap-2">
          
          {/* Back to Launcher button */}
          <button
            onClick={() => navigate('/')}
            className="px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 border border-slate-700/50 transition-all cursor-pointer"
            title="Trở về Launcher"
          >
            <HomeIcon className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Launcher</span>
          </button>

          {/* OmniChat / Chat shortcut */}
          <button 
            onClick={() => navigate('/omnichat')}
            className="w-8 h-8 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tin nhắn nội bộ"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Notifications Bell */}
          <button 
            className="w-8 h-8 rounded-md hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors relative cursor-pointer"
            title="Thông báo hệ thống"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse">
            </span>
          </button>

          {/* Help Center */}
          <button 
            onClick={() => window.open('https://vcomm.vn', '_blank')}
            className="w-8 h-8 rounded-md hover:bg-white/20 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Trợ giúp & Tài liệu"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-white/25 mx-1"></div>

          {/* User Profile Avatar with dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(prev => !prev)}
              className="flex items-center gap-1.5 p-1 rounded-full hover:bg-white/20 transition-all cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-300 to-rose-400 text-slate-900 font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-white/50">
                {(staffInfo?.name || 'AD').slice(0, 2).toUpperCase()}
              </div>
            </button>

            {/* User Dropdown */}
            {showProfileMenu && (
              <div 
                className="absolute right-0 top-10 w-56 bg-slate-900 text-white rounded-lg shadow-2xl border border-slate-700/80 py-1.5 animate-in fade-in zoom-in-95 duration-150 z-50 ring-1 ring-white/10"
                onClick={e => e.stopPropagation()}
              >
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <p className="text-xs font-bold text-slate-100">{staffInfo?.name || 'System Admin'}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{staffInfo?.username || 'admin'} • Toàn quyền</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/'); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                  >
                    <HomeIcon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Màn hình Portal App</span>
                  </button>
                  <button
                    onClick={() => { setShowProfileMenu(false); navigate('/settings'); }}
                    className="w-full text-left px-4 py-2 text-xs hover:bg-slate-800 flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Cài đặt hệ thống</span>
                  </button>
                </div>
                <div className="pt-1 border-t border-slate-800">
                  <button
                    onClick={async () => {
                      setShowProfileMenu(false);
                      await signOut();
                    }}
                    className="w-full text-left px-4 py-2 text-xs text-rose-400 hover:bg-rose-500/20 flex items-center gap-2 font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* ALL APPS LAUNCHER - POSITIONED AT TOP-LEFT (Under 9-Dots Button) */}
      {isAppDrawerOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className={cn(
              "fixed inset-0 z-50 transition-opacity duration-150",
              launcherTheme === 'white' && "bg-black/20 backdrop-blur-[1px]",
              launcherTheme === 'glass' && "bg-black/15 backdrop-blur-[2px]",
              launcherTheme === 'dark' && "bg-black/50 backdrop-blur-[2px]"
            )}
            onClick={() => setIsAppDrawerOpen(false)}
          />

          {/* Launcher Popover Menu anchored at top-left */}
          <div 
            className={cn(
              "fixed top-12 left-2 sm:left-4 z-50 w-[calc(100vw-1rem)] sm:w-[540px] md:w-[680px] lg:w-[740px] max-h-[calc(100vh-3.75rem)] rounded-xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 transition-colors",
              launcherTheme === 'white' && "bg-white/98 text-slate-800 border-slate-200/90 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5",
              launcherTheme === 'glass' && "bg-white/85 text-slate-900 border-white/70 backdrop-blur-2xl shadow-2xl shadow-slate-900/15 ring-1 ring-black/5",
              launcherTheme === 'dark' && "bg-slate-900/98 text-white border-slate-700/80 shadow-2xl shadow-black/80 ring-1 ring-white/10"
            )}
            onClick={e => e.stopPropagation()}
          >
            {/* Header: Title, Theme switcher, Close button, and Search input */}
            <div className={cn(
              "p-3.5 sm:p-4 border-b flex flex-col gap-3 shrink-0 transition-colors",
              launcherTheme === 'white' && "bg-slate-50/80 border-slate-200/80",
              launcherTheme === 'glass' && "bg-white/50 backdrop-blur-md border-slate-200/50",
              launcherTheme === 'dark' && "bg-slate-950/60 border-slate-800"
            )}>
              <div className="flex items-center justify-between gap-2.5">
                {/* Brand & Title */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20 shrink-0">
                    <Grid3X3 className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <h2 className={cn(
                      "text-sm sm:text-base font-bold tracking-tight leading-none truncate",
                      launcherTheme === 'dark' ? "text-white" : "text-slate-900"
                    )}>
                      Tất Cả Ứng Dụng VComm ERP
                    </h2>
                    <p className={cn(
                      "text-[11px] mt-0.5 truncate",
                      launcherTheme === 'dark' ? "text-slate-400" : "text-slate-500"
                    )}>
                      Chọn phân hệ làm việc nhanh theo nhóm nghiệp vụ
                    </p>
                  </div>
                </div>

                {/* Right controls: Theme switcher & Close button */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Theme Mode Selector */}
                  <div className={cn(
                    "flex items-center gap-0.5 p-0.5 rounded-lg border text-[11px] select-none",
                    launcherTheme === 'dark' 
                      ? "bg-slate-800/90 border-slate-700/60" 
                      : "bg-slate-100 border-slate-250"
                  )}>
                    <button
                      type="button"
                      onClick={() => handleThemeSelect('white')}
                      className={cn(
                        "px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1 cursor-pointer",
                        launcherTheme === 'white'
                          ? "bg-white text-slate-900 shadow-xs font-semibold"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                      title="Nền trắng sáng"
                    >
                      <Sun className="w-3 h-3 text-amber-500" />
                      <span className="hidden sm:inline">Trắng</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeSelect('glass')}
                      className={cn(
                        "px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1 cursor-pointer",
                        launcherTheme === 'glass'
                          ? "bg-white/95 text-indigo-950 shadow-xs font-semibold"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                      title="Nền kính mờ xuyên thấu"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span className="hidden sm:inline">Mờ</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeSelect('dark')}
                      className={cn(
                        "px-2 py-1 rounded-md transition-all font-medium flex items-center gap-1 cursor-pointer",
                        launcherTheme === 'dark'
                          ? "bg-slate-900 text-white shadow-xs font-semibold"
                          : "text-slate-500 hover:text-slate-900"
                      )}
                      title="Nền tối"
                    >
                      <Moon className="w-3 h-3 text-slate-400" />
                      <span className="hidden sm:inline">Tối</span>
                    </button>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={() => setIsAppDrawerOpen(false)}
                    className={cn(
                      "w-7 h-7 rounded-md border flex items-center justify-center transition-all cursor-pointer",
                      launcherTheme === 'dark'
                        ? "bg-slate-800/80 hover:bg-slate-700 border-slate-700/60 text-slate-400 hover:text-white"
                        : "bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-600 hover:text-slate-900"
                    )}
                    title="Đóng (ESC)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search Box */}
              <div className="relative w-full">
                <Search className={cn(
                  "w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2",
                  launcherTheme === 'dark' ? "text-slate-400" : "text-slate-400"
                )} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Tìm kiếm nhanh phân hệ (ví dụ: Nhân sự, Bán hàng, Kho, Thuế)..."
                  value={drawerSearch}
                  onChange={e => setDrawerSearch(e.target.value)}
                  className={cn(
                    "w-full pl-9 pr-8 py-2 rounded-lg text-xs transition-all focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500",
                    launcherTheme === 'white' && "bg-slate-100/90 border border-slate-250 text-slate-900 placeholder-slate-400 focus:bg-white",
                    launcherTheme === 'glass' && "bg-white/75 backdrop-blur-sm border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white",
                    launcherTheme === 'dark' && "bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-400 focus:bg-slate-800"
                  )}
                />
                {drawerSearch && (
                  <button
                    onClick={() => setDrawerSearch('')}
                    className={cn(
                      "absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:scale-110 transition-transform cursor-pointer",
                      launcherTheme === 'dark' ? "text-slate-400 hover:text-white" : "text-slate-400 hover:text-slate-700"
                    )}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Apps Scroll Area (Direct vertical groups with NO horizontal slidebar) */}
            <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-5 custom-scrollbar">
              {categorySections.map(section => {
                const apps = (groupedApps as any)[section.id] || [];
                if (apps.length === 0) return null;

                return (
                  <div key={section.id} className="space-y-2.5">
                    {/* Section Heading */}
                    <div className={cn(
                      "flex items-center gap-2 pb-1 border-b",
                      launcherTheme === 'dark' ? "border-slate-800" : "border-slate-200/80"
                    )}>
                      <span className={cn(
                        "text-[11px] font-bold uppercase tracking-wider",
                        launcherTheme === 'dark' ? section.colorDark : section.colorLight
                      )}>
                        {section.title}
                      </span>
                      <span className={cn(
                        "text-[10px] font-mono px-1.5 py-0.2 rounded",
                        launcherTheme === 'dark'
                          ? "text-slate-400 bg-slate-800"
                          : "text-slate-500 bg-slate-100 border border-slate-200/70"
                      )}>
                        {apps.length}
                      </span>
                    </div>

                    {/* App Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-2.5">
                      {apps.map((app: MisaAppItem) => {
                        const Icon = app.icon;
                        const starred = isStarred(app.id);

                        return (
                          <div
                            key={app.id}
                            onClick={() => handleAppSelect(app.path)}
                            className={cn(
                              "group relative flex flex-col items-center p-2 rounded-lg border transition-all cursor-pointer text-center active:scale-95 select-none",
                              launcherTheme === 'white' && "bg-slate-50/70 hover:bg-slate-100/90 border-transparent hover:border-slate-200/90 shadow-2xs hover:shadow-xs",
                              launcherTheme === 'glass' && "bg-white/50 hover:bg-white/80 backdrop-blur-sm border-transparent hover:border-white/90 shadow-2xs",
                              launcherTheme === 'dark' && "bg-slate-850/40 hover:bg-slate-800 border-transparent hover:border-slate-700/60"
                            )}
                            title={app.description}
                          >
                            {/* Star Toggle Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(app.id);
                              }}
                              className={cn(
                                "absolute top-1 right-1 p-1 rounded-md z-10 transition-all cursor-pointer",
                                starred
                                  ? "text-amber-500 opacity-100 hover:scale-125"
                                  : launcherTheme === 'dark'
                                    ? "text-slate-500 opacity-0 group-hover:opacity-100 hover:text-amber-300 hover:scale-125"
                                    : "text-slate-400 opacity-0 group-hover:opacity-100 hover:text-amber-500 hover:scale-125"
                              )}
                              title={starred ? "Bỏ ghim phân hệ" : "Ghim phân hệ yêu thích"}
                            >
                              <Star className={cn("w-3 h-3", starred && "fill-current")} />
                            </button>

                            {/* App Icon with refined corners */}
                            <div className={cn(
                              "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white mb-1.5 shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all",
                              app.color
                            )}>
                              <Icon className="w-5 h-5" />
                            </div>

                            {/* App Name */}
                            <span className={cn(
                              "text-[11px] sm:text-xs line-clamp-2 leading-tight transition-colors",
                              launcherTheme === 'dark'
                                ? "text-slate-200 group-hover:text-white font-medium"
                                : "text-slate-700 group-hover:text-slate-950 font-medium"
                            )}>
                              {app.name}
                            </span>

                            {/* Badges */}
                            {app.isPrimary && (
                              <span className={cn(
                                "mt-1 px-1.5 py-0.2 text-[8px] font-bold rounded font-mono uppercase tracking-wider border",
                                launcherTheme === 'dark'
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30"
                                  : "bg-rose-50 text-rose-600 border-rose-200"
                              )}>
                                Core
                              </span>
                            )}
                            {app.isBeta && (
                              <span className={cn(
                                "mt-1 px-1.5 py-0.2 text-[8px] font-bold rounded font-mono uppercase tracking-wider border",
                                launcherTheme === 'dark'
                                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-200"
                              )}>
                                Beta
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Empty Search Result */}
              {Object.values(groupedApps).every(list => list.length === 0) && (
                <div className="py-12 text-center">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3",
                    launcherTheme === 'dark' ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-400 border border-slate-200"
                  )}>
                    <Search className="w-6 h-6" />
                  </div>
                  <p className={cn(
                    "text-sm font-semibold",
                    launcherTheme === 'dark' ? "text-slate-300" : "text-slate-800"
                  )}>Không tìm thấy phân hệ nào</p>
                  <p className={cn(
                    "text-xs mt-1",
                    launcherTheme === 'dark' ? "text-slate-500" : "text-slate-500"
                  )}>Không có kết quả khớp với "{drawerSearch}"</p>
                  <button
                    onClick={() => setDrawerSearch('')}
                    className={cn(
                      "mt-3 px-3 py-1.5 rounded-md text-xs transition-all border cursor-pointer",
                      launcherTheme === 'dark'
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700"
                        : "bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-300 shadow-2xs"
                    )}
                  >
                    Xóa tìm kiếm
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={cn(
              "px-4 py-2.5 border-t flex items-center justify-between text-[11px] select-none shrink-0 transition-colors",
              launcherTheme === 'white' && "bg-slate-50/90 border-slate-200/80 text-slate-500",
              launcherTheme === 'glass' && "bg-white/50 backdrop-blur-md border-slate-200/50 text-slate-600",
              launcherTheme === 'dark' && "bg-slate-950/80 border-slate-800 text-slate-400"
            )}>
              <span className="hidden sm:inline">
                Nhấn <kbd className={cn(
                  "px-1 py-0.5 rounded font-mono text-[10px] border",
                  launcherTheme === 'dark' ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-white text-slate-600 border-slate-300 shadow-2xs"
                )}>ESC</kbd> để đóng • Bấm ⭐ để ghim phân hệ
              </span>
              <button
                onClick={() => {
                  setIsAppDrawerOpen(false);
                  navigate('/');
                }}
                className={cn(
                  "flex items-center gap-1 transition-colors cursor-pointer font-medium ml-auto",
                  launcherTheme === 'dark' ? "text-slate-300 hover:text-orange-400" : "text-slate-700 hover:text-orange-600"
                )}
              >
                <HomeIcon className="w-3.5 h-3.5" />
                <span>Mở Màn hình Portal Launcher chính</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
