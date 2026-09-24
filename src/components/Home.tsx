import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search,
  ArrowRight,
  ArrowLeft,
  Settings,
  X,
  Image as ImageIcon,
  Sparkles,
  Check,
  Palette,
  Layers,
  Star
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { MISA_APPS, MisaAppItem, CATEGORY_GROUPS } from '../data/misaApps';
import { useStarredApps } from '../hooks/useStarredApps';
import { safeLocalStorage } from '../lib/storage';

const APPS_PER_PAGE = 15; // 5 columns x 3 rows

// Iconic Vietnamese wallpapers
export const VIETNAM_WALLPAPERS = [
  { 
    id: 'dongson_scarlet', 
    name: 'Trống Đồng & Chim Hạc', 
    subtitle: 'Hào khí Đông Sơn - Đỏ tươi hoàng gia', 
    path: '/wallpapers/vietnam-dongson-scarlet.svg',
    tag: 'Đặc sắc',
    tagColor: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black'
  },
  { 
    id: 'halong', 
    name: 'Vịnh Hạ Long', 
    subtitle: 'Kỳ quan thiên nhiên thế giới', 
    path: '/wallpapers/vietnam-halong.jpg',
    tag: 'Di sản',
    tagColor: 'bg-emerald-500 text-white font-bold'
  },
  { 
    id: 'landscape', 
    name: 'Mù Cang Chải (Sa Pa)', 
    subtitle: 'Sóng vàng ruộng bậc thang Tây Bắc', 
    path: '/wallpapers/vietnam-landscape.jpg',
    tag: 'Tây Bắc',
    tagColor: 'bg-amber-500 text-white font-bold'
  },
  { 
    id: 'hoian', 
    name: 'Phố Cổ Hội An', 
    subtitle: 'Đêm hoa đăng & đèn lồng lung linh', 
    path: '/wallpapers/vietnam-hoian-night.svg',
    tag: 'Phố cổ',
    tagColor: 'bg-rose-500 text-white font-bold'
  },
  { 
    id: 'lotus', 
    name: 'Sen Hồng Đồng Tháp', 
    subtitle: 'Quốc hoa thuần khiết thanh tao', 
    path: '/wallpapers/vietnam-lotus-pink.svg',
    tag: 'Quốc hoa',
    tagColor: 'bg-pink-500 text-white font-bold'
  },
];

export const BACKGROUND_COLORS = [
  {
    id: 'royal_scarlet',
    name: 'Đỏ Cờ Hoàng Gia',
    subtitle: 'Khí sắc thịnh vượng & may mắn',
    gradient: 'linear-gradient(135deg, #450a0a 0%, #991b1b 50%, #dc2626 100%)',
    preview: '#dc2626'
  },
  {
    id: 'dongson_gold',
    name: 'Vàng Kim Lạc Hồng',
    subtitle: 'Sang trọng, uy nghi tài lộc',
    gradient: 'linear-gradient(135deg, #451a03 0%, #92400e 50%, #d97706 100%)',
    preview: '#d97706'
  },
  {
    id: 'imperial_emerald',
    name: 'Xanh Ngọc Tràng An',
    subtitle: 'Non nước thanh bình, thư thái',
    gradient: 'linear-gradient(135deg, #022c22 0%, #065f46 50%, #059669 100%)',
    preview: '#059669'
  },
  {
    id: 'ocean_navy',
    name: 'Xanh Biển Đông',
    subtitle: 'Hiện đại, công nghệ, bao la',
    gradient: 'linear-gradient(135deg, #020617 0%, #0f172a 50%, #0284c7 100%)',
    preview: '#0284c7'
  },
  {
    id: 'slate_minimal',
    name: 'Xám Đá Slate Minimalist',
    subtitle: 'Tối giản macOS, tập trung cao độ',
    gradient: 'linear-gradient(135deg, #090d16 0%, #1e293b 60%, #334155 100%)',
    preview: '#334155'
  },
  {
    id: 'deep_purple',
    name: 'Tím Cung Đình Huế',
    subtitle: 'Trầm lắng quý phái kinh kỳ',
    gradient: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #7c3aed 100%)',
    preview: '#7c3aed'
  }
];

export function Home() {
  const navigate = useNavigate();
  const { staffInfo, signOut } = useAuth();
  
  // Active Tab Filter
  const [activeTab, setActiveTab] = useState<string>('my_apps');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isSlideAnimating, setIsSlideAnimating] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showWallpaperMenu, setShowWallpaperMenu] = useState(false);
  const [customizerTab, setCustomizerTab] = useState<'wallpapers' | 'colors'>('wallpapers');

  // Background display type: 'wallpaper' | 'color'
  const [bgType, setBgType] = useState<'wallpaper' | 'color'>(() => {
    return (safeLocalStorage.getItem('vcomm_portal_bg_type') as 'wallpaper' | 'color') || 'wallpaper';
  });

  // Selected wallpaper state
  const [activeWallpaper, setActiveWallpaper] = useState<string>(() => {
    return safeLocalStorage.getItem('vcomm_portal_wallpaper') || '/wallpapers/vietnam-dongson-scarlet.svg';
  });

  // Selected background color state
  const [activeBgColor, setActiveBgColor] = useState<string>(() => {
    return safeLocalStorage.getItem('vcomm_portal_bg_color') || 'linear-gradient(135deg, #450a0a 0%, #991b1b 50%, #dc2626 100%)';
  });

  const handleSelectWallpaper = (path: string) => {
    setBgType('wallpaper');
    setActiveWallpaper(path);
    safeLocalStorage.setItem('vcomm_portal_bg_type', 'wallpaper');
    safeLocalStorage.setItem('vcomm_portal_wallpaper', path);
  };

  const handleSelectBgColor = (gradient: string) => {
    setBgType('color');
    setActiveBgColor(gradient);
    safeLocalStorage.setItem('vcomm_portal_bg_type', 'color');
    safeLocalStorage.setItem('vcomm_portal_bg_color', gradient);
  };

  // Starred / Favorite Apps management
  const { starredIds, isStarred, toggleStar } = useStarredApps();

  // Filter apps based on search and active tab
  const filteredApps = useMemo(() => {
    let list = MISA_APPS;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.filter(app => 
        app.name.toLowerCase().includes(q) || 
        app.description.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (activeTab === 'my_apps') {
      return list.filter(app => starredIds.includes(app.id));
    } else if (activeTab === 'all') {
      return list;
    } else {
      return list.filter(app => app.category === activeTab);
    }
  }, [activeTab, searchQuery, starredIds]);

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / APPS_PER_PAGE));

  // Reset page to 0 when filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [activeTab, searchQuery]);

  // Adjust page if out of bounds
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [totalPages, currentPage]);

  const changePage = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages && newPage !== currentPage) {
      setIsSlideAnimating(true);
      setCurrentPage(newPage);
      setTimeout(() => setIsSlideAnimating(false), 250);
    }
  };

  // Keyboard navigation for left/right arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') {
        changePage(currentPage + 1);
      } else if (e.key === 'ArrowLeft') {
        changePage(currentPage - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages]);

  // Get current 15 apps
  const visibleApps = useMemo(() => {
    const start = currentPage * APPS_PER_PAGE;
    return filteredApps.slice(start, start + APPS_PER_PAGE);
  }, [filteredApps, currentPage]);

  // User initial avatar
  const userInitials = useMemo(() => {
    if (staffInfo?.name) {
      const parts = staffInfo.name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'NV';
  }, [staffInfo]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-cover bg-center bg-no-repeat select-none flex flex-col justify-between transition-all duration-500"
      style={
        bgType === 'color'
          ? { 
              background: activeBgColor,
              backgroundAttachment: 'fixed'
            }
          : { 
              backgroundImage: `url('${activeWallpaper}'), radial-gradient(circle at 50% 30%, #1e293b 0%, #0f172a 100%)`,
              backgroundBlendMode: 'normal'
            }
      }
    >
      {/* Background Soft Cinematic Ambient Layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/10 to-black/45 pointer-events-none" />

      {/* ================= MACOS-STYLE TOP HEADERBAR (All menus on the Top-Left) ================= */}
      <header className="relative z-30 h-11 px-4 sm:px-6 flex items-center justify-between text-white backdrop-blur-xl bg-black/40 border-b border-white/10 shadow-sm">
        
        {/* TOP-LEFT: Brand "VComm ERP" + macOS Menu Tabs */}
        <div className="flex items-center gap-1 sm:gap-2 min-w-0">
          
          {/* Brand Logo & Name */}
          <div 
            onClick={() => { setActiveTab('my_apps'); setCurrentPage(0); setSearchQuery(''); }}
            className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity pr-2 shrink-0"
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center shadow-md">
              <span className="text-white font-black text-xs">V</span>
            </div>
            <span className="font-bold text-sm tracking-tight text-white drop-shadow-sm">
              VComm ERP
            </span>
          </div>

          {/* Thin macOS Divider */}
          <div className="h-4 w-[1px] bg-white/20 shrink-0 mx-1 hidden sm:block" />

          {/* MacOS-style Top Navigation Menus */}
          <nav className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
            {CATEGORY_GROUPS.map((group) => {
              const isStarredTab = group.id === 'my_apps';
              const label = isStarredTab
                ? `⭐ Ứng dụng của tôi (${starredIds.length})`
                : group.title;
              return (
                <button
                  key={group.id}
                  onClick={() => { setActiveTab(group.id); setCurrentPage(0); }}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer shrink-0 font-medium whitespace-nowrap",
                    activeTab === group.id
                      ? "bg-white/25 text-white font-bold shadow-xs"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  )}
                >
                  {label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* TOP-RIGHT: Search + Wallpaper Switcher + Settings + Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          
          {/* Quick Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/60 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm app..."
              className="pl-8 pr-7 py-1 bg-white/15 hover:bg-white/20 focus:bg-white/25 backdrop-blur-md border border-white/15 rounded-lg text-white placeholder-white/60 text-xs w-32 sm:w-44 focus:w-56 transition-all outline-none"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Wallpaper & Theme Customizer Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowWallpaperMenu(!showWallpaperMenu)}
              className={cn(
                "w-7 h-7 rounded-lg backdrop-blur-md text-white border flex items-center justify-center transition-all cursor-pointer shadow-sm",
                showWallpaperMenu 
                  ? "bg-rose-600 border-rose-400 text-white shadow-rose-900/40" 
                  : "bg-white/15 hover:bg-white/25 border-white/15"
              )}
              title="Tùy biến hình nền & màu sắc Launcher"
            >
              <Palette className="w-3.5 h-3.5 text-white" />
            </button>

            {showWallpaperMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl p-3 z-50 text-xs text-white animate-in fade-in zoom-in-95 duration-150">
                {/* Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="font-bold text-slate-100 text-xs leading-none">Tùy biến Giao diện Launcher</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Bản sắc văn hóa Việt Nam & Màu nền</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowWallpaperMenu(false)}
                    className="w-5 h-5 rounded-md hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Segmented Switcher: Wallpapers vs Colors */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-xl mb-3 border border-white/10">
                  <button
                    onClick={() => setCustomizerTab('wallpapers')}
                    className={cn(
                      "py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      customizerTab === 'wallpapers'
                        ? "bg-white/20 text-white shadow-xs border border-white/20"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-rose-400" />
                    <span>Bản sắc VN ({VIETNAM_WALLPAPERS.length})</span>
                  </button>
                  <button
                    onClick={() => setCustomizerTab('colors')}
                    className={cn(
                      "py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                      customizerTab === 'colors'
                        ? "bg-white/20 text-white shadow-xs border border-white/20"
                        : "text-slate-400 hover:text-white"
                    )}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Màu nền ({BACKGROUND_COLORS.length})</span>
                  </button>
                </div>

                {/* Tab 1: Iconic Vietnamese Wallpapers */}
                {customizerTab === 'wallpapers' && (
                  <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {VIETNAM_WALLPAPERS.map((wp) => {
                      const isSelected = bgType === 'wallpaper' && activeWallpaper === wp.path;
                      return (
                        <button
                          key={wp.id}
                          onClick={() => handleSelectWallpaper(wp.path)}
                          className={cn(
                            "w-full text-left p-2 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer border group",
                            isSelected 
                              ? "bg-rose-500/20 border-rose-500/50 shadow-sm" 
                              : "hover:bg-white/5 border-transparent hover:border-white/10"
                          )}
                        >
                          {/* Mini Thumbnail Preview */}
                          <div 
                            className="w-12 h-10 rounded-lg overflow-hidden shrink-0 border border-white/20 bg-cover bg-center shadow-xs group-hover:scale-105 transition-transform"
                            style={{ backgroundImage: `url('${wp.path}')` }}
                          />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "font-bold text-xs truncate",
                                isSelected ? "text-rose-200" : "text-white"
                              )}>
                                {wp.name}
                              </span>
                              {wp.tag && (
                                <span className={cn(
                                  "px-1.5 py-0.2 rounded text-[9px] uppercase tracking-wider shrink-0",
                                  wp.tagColor || "bg-white/20 text-white"
                                )}>
                                  {wp.tag}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {wp.subtitle}
                            </p>
                          </div>

                          {/* Selected Checkmark */}
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <Check className="w-3 h-3" strokeWidth={3} />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Tab 2: Solid & Mesh Gradient Colors */}
                {customizerTab === 'colors' && (
                  <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    {BACKGROUND_COLORS.map((col) => {
                      const isSelected = bgType === 'color' && activeBgColor === col.gradient;
                      return (
                        <button
                          key={col.id}
                          onClick={() => handleSelectBgColor(col.gradient)}
                          className={cn(
                            "text-left p-2 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group",
                            isSelected 
                              ? "bg-white/15 border-amber-400 shadow-md ring-1 ring-amber-400/50" 
                              : "bg-white/5 border-white/10 hover:border-white/25 hover:bg-white/10"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div 
                              className="w-7 h-7 rounded-lg border border-white/30 shadow-sm group-hover:scale-110 transition-transform"
                              style={{ background: col.gradient }}
                            />
                            {isSelected && (
                              <div className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                                <Check className="w-2.5 h-2.5" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold text-[11px] text-white block truncate">
                              {col.name}
                            </span>
                            <span className="text-[9px] text-slate-400 block truncate">
                              {col.subtitle}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Settings Icon */}
          <div className="relative">
            <button
              onClick={() => setShowSettingsMenu(!showSettingsMenu)}
              className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/15 flex items-center justify-center transition-all cursor-pointer"
              title="Cài đặt hệ thống"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {showSettingsMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900/95 backdrop-blur-2xl border border-white/15 rounded-xl shadow-2xl p-1.5 z-50 text-xs text-white animate-in fade-in duration-150">
                <button
                  onClick={() => { navigate('/settings'); setShowSettingsMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/15 flex items-center gap-2 font-medium"
                >
                  <Settings className="w-3.5 h-3.5 text-blue-400" />
                  <span>Quản trị hệ thống</span>
                </button>
                <button
                  onClick={() => { signOut(); setShowSettingsMenu(false); }}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-500/20 text-rose-300 flex items-center gap-2 font-medium"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>

          {/* User Initial Circle */}
          <div 
            onClick={() => navigate('/settings')}
            className="w-7 h-7 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center shadow-sm cursor-pointer border border-white/30 transition-transform active:scale-95"
            title={staffInfo?.name || 'Tài khoản người dùng'}
          >
            {userInitials}
          </div>
        </div>
      </header>

      {/* ================= MAIN APP GRID AREA (SPACIOUS, AIRY, FULL APP NAMES) ================= */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-12 md:px-20 lg:px-28">
        
        {/* Left Horizontal Navigation Arrow Button */}
        {currentPage > 0 && (
          <button
            onClick={() => changePage(currentPage - 1)}
            className="absolute left-3 sm:left-6 md:left-10 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl cursor-pointer transition-all hover:scale-110 z-30"
            title="Màn hình trước (Phím Mũi tên Trái)"
          >
            <ArrowLeft className="w-5 h-5 text-white" strokeWidth={2.2} />
          </button>
        )}

        {/* Right Horizontal Navigation Arrow Button */}
        {currentPage < totalPages - 1 && (
          <button
            onClick={() => changePage(currentPage + 1)}
            className="absolute right-3 sm:right-6 md:right-10 top-1/2 -translate-y-1/2 w-11 h-11 md:w-12 md:h-12 rounded-full bg-black/30 hover:bg-black/50 active:scale-95 backdrop-blur-md border border-white/20 text-white flex items-center justify-center shadow-xl cursor-pointer transition-all hover:scale-110 z-30"
            title="Màn hình tiếp theo (Phím Mũi tên Phải)"
          >
            <ArrowRight className="w-5 h-5 text-white" strokeWidth={2.2} />
          </button>
        )}

        {/* When filteredApps is empty (e.g. no starred apps or no search results) */}
        {visibleApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-white/15 max-w-md mx-auto text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mb-4 shadow-lg shadow-amber-500/10">
              <Star className="w-8 h-8 fill-current" />
            </div>
            <h3 className="text-base font-bold mb-1.5">
              {activeTab === 'my_apps' ? 'Chưa có ứng dụng được đánh dấu sao' : 'Không tìm thấy ứng dụng phù hợp'}
            </h3>
            <p className="text-xs text-white/70 mb-5 leading-relaxed">
              {activeTab === 'my_apps' 
                ? 'Bạn có thể đánh dấu sao (⭐) cho bất kỳ ứng dụng nào trong danh sách Tất cả để ghim vào mục Ứng dụng của tôi truy cập nhanh.'
                : 'Thử tìm kiếm với từ khóa khác hoặc chuyển sang danh mục ứng dụng khác.'}
            </p>
            <button
              onClick={() => { setActiveTab('all'); setSearchQuery(''); setCurrentPage(0); }}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold rounded-xl shadow-lg transition-all cursor-pointer hover:scale-105"
            >
              Xem tất cả ứng dụng
            </button>
          </div>
        ) : (
          /* 5 Columns x 3 Rows Grid: Airy, Refined Corner Radius, Full Names */
          <div 
            className={cn(
              "w-full max-w-5xl mx-auto grid grid-cols-5 grid-rows-3 gap-y-7 sm:gap-y-9 md:gap-y-11 gap-x-4 sm:gap-x-8 md:gap-x-12 place-items-center transition-all duration-300",
              isSlideAnimating && "opacity-50 scale-98"
            )}
          >
            {visibleApps.map((app) => {
              const Icon = app.icon;
              const starred = isStarred(app.id);

              return (
                <div
                  key={app.id}
                  onClick={() => navigate(app.path)}
                  className="group flex flex-col items-center cursor-pointer transition-transform hover:-translate-y-1.5 active:scale-95 w-24 sm:w-28 md:w-32"
                  title={`${app.name}: ${app.description}`}
                >
                  {/* Modern Icon Box: Refined Rounded-2xl (not overly rounded), Sleek Border & Inner Glow */}
                  <div 
                    className={cn(
                      "w-15 h-15 sm:w-17 sm:h-17 md:w-[72px] md:h-[72px] rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center text-white border border-white/20 transition-all duration-200 group-hover:scale-105 group-hover:shadow-2xl relative",
                      app.color
                    )}
                  >
                    {/* Star / Favorite toggle button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleStar(app.id);
                      }}
                      className={cn(
                        "absolute -top-1.5 -left-1.5 p-1 rounded-full z-20 transition-all cursor-pointer shadow-md",
                        starred
                          ? "bg-amber-400 text-slate-950 scale-100 hover:scale-110 hover:bg-amber-300 shadow-amber-400/30"
                          : "bg-black/60 text-white/50 opacity-0 group-hover:opacity-100 hover:text-amber-300 hover:bg-black/90 hover:scale-110"
                      )}
                      title={starred ? "Bỏ đánh dấu sao khỏi Ứng dụng của tôi" : "Đánh dấu sao vào Ứng dụng của tôi"}
                    >
                      <Star className={cn("w-3 h-3", starred ? "fill-current text-slate-950" : "text-white/80")} />
                    </button>

                    <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-white drop-shadow-sm" strokeWidth={1.8} />

                    {/* Primary eCommerce Core badge */}
                    {app.isPrimary && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-rose-600 text-[9px] font-black text-white rounded-md shadow-md border border-white/30 tracking-tight animate-pulse">
                        CORE
                      </span>
                    )}

                    {/* Beta badge */}
                    {app.isBeta && (
                      <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-emerald-600 text-[9px] font-black text-white rounded-md shadow-md border border-white/30 tracking-tight">
                        BETA
                      </span>
                    )}
                  </div>

                  {/* Full App Name (No aggressive truncation - fully readable across 1 or 2 lines) */}
                  <div className="mt-2 text-center w-full min-h-[34px] flex items-center justify-center px-1">
                    <span className="text-white font-medium text-xs sm:text-[13px] leading-snug line-clamp-2 break-words drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                      {app.name}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Empty slot placeholders to keep 5-column grid perfectly aligned */}
            {Array.from({ length: Math.max(0, APPS_PER_PAGE - visibleApps.length) }).map((_, i) => (
              <div key={`empty-${i}`} className="w-24 sm:w-28 md:w-32 h-24 sm:h-28 md:h-32 invisible pointer-events-none" />
            ))}
          </div>
        )}
      </main>

      {/* ================= BOTTOM PAGINATION PILL ================= */}
      <footer className="relative z-20 pb-4 sm:pb-6 flex justify-center items-center">
        {totalPages > 1 && (
          <div className="bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/15 shadow-lg">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => changePage(idx)}
                className={cn(
                  "transition-all duration-300 cursor-pointer",
                  idx === currentPage
                    ? "w-6 h-1.5 rounded-full bg-white shadow-xs"
                    : "w-1.5 h-1.5 rounded-full bg-white/40 hover:bg-white/80"
                )}
                title={`Trang ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </footer>
    </div>
  );
}
