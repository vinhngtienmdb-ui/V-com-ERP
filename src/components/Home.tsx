import { safeLocalStorage } from '../lib/storage';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Search, 
  Star, 
  History,
  LayoutGrid,
  FileText,
  Users,
  Gauge,
  ShoppingBag,
  Megaphone,
  Wallet,
  ShoppingCart,
  Factory,
  Package,
  Activity,
  Layers,
  Sparkles,
  Shield,
  X,
  ChevronRight,
  Info,
  Calendar,
  Layers3,
  Flame,
  UserCheck,
  Building,
  HelpCircle,
  Warehouse,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { navGroups } from '../constants';

// Define the 13 parent functional areas matching the required layout in the user's screenshot
interface FunctionalGroup {
  id: string;
  title: string;
  desc: string;
  icon: any;
  color: string;
  modulePaths: string[];
}

const FUNCTIONAL_GROUPS: FunctionalGroup[] = [
  {
    id: 'he_thong_chinh',
    title: 'Hệ thống chính',
    desc: 'Tổng quan và bảng điều khiển trung tâm.',
    icon: LayoutGrid,
    color: 'blue',
    modulePaths: ['/', '/dashboard']
  },
  {
    id: 'dieu_hanh_he_thong',
    title: 'Điều hành & Hệ thống',
    desc: 'Công cụ phân tích BI, trí tuệ nhân tạo và workflow.',
    icon: Activity,
    color: 'emerald',
    modulePaths: ['/bi', '/workflow']
  },
  {
    id: 'hanh_chinh_phap_ly',
    title: 'Hành chính & Ký số',
    desc: 'Đề xuất, hợp đồng, văn bản và chữ ký số.',
    icon: FileText,
    color: 'orange',
    modulePaths: ['/requests', '/contracts', '/documents', '/signature']
  },
  {
    id: 'kinh_doanh_da_kenh',
    title: 'Kinh doanh Đa kênh',
    desc: 'Đơn hàng, livestream và mạng xã hội.',
    icon: ShoppingBag,
    color: 'indigo',
    modulePaths: ['/orders', '/live', '/social']
  },
  {
    id: 'san_pham_marketing',
    title: 'Sản phẩm & Marketing',
    desc: 'Quản lý PIM, khuyến mãi, chiến dịch và tiếp thị.',
    icon: Megaphone,
    color: 'rose',
    modulePaths: ['/pim', '/marketing', '/flash-sale', '/affiliate', '/loyalty', '/ads']
  },
  {
    id: 'chuoi_cung_ung',
    title: 'Chuỗi cung ứng & Kho',
    desc: 'Quản lý kho vận, tiêu chuẩn tuân thủ và đối tác Mua hàng.',
    icon: Warehouse,
    color: 'amber',
    modulePaths: ['/warehouse', '/scm', '/compliance']
  },
  {
    id: 'tai_chinh_thanh_toan',
    title: 'Tài chính & Thanh toán',
    desc: 'Kế toán, định mức, đối soát giao dịch và ví.',
    icon: Wallet,
    color: 'teal',
    modulePaths: ['/finance', '/settlement', '/wallet', '/seller-finance']
  },
  {
    id: 'doi_tac_khach_hang',
    title: 'Đối tác & Khách hàng',
    desc: 'CRM, CSKH, quản lý đại lý và kinh doanh.',
    icon: Users,
    color: 'sky',
    modulePaths: ['/sellers', '/customers', '/cskh', '/sales']
  },
  {
    id: 'nhan_su_to_chuc',
    title: 'Nhân sự & Tổ chức',
    desc: 'Tuyển dụng, đánh giá năng lực, sơ đồ và workspace.',
    icon: Layers,
    color: 'violet',
    modulePaths: ['/hr', '/org', '/performance', '/workspace']
  },
  {
    id: 'cau_hinh',
    title: 'Cấu hình',
    desc: 'Thiết lập tham số và phân quyền hệ thống.',
    icon: Settings,
    color: 'slate',
    modulePaths: ['/settings']
  }
];

// Flat list of all core modules defined in navGroups for faster lookup/search/bookmarking
const ALL_SUB_MODULES = navGroups.flatMap(group => group.items);

const COLOR_MAP: Record<string, string> = {
  orange: 'bg-orange-500 text-white shadow-sm shadow-orange-100',
  emerald: 'bg-emerald-500 text-white shadow-sm shadow-emerald-100',
  blue: 'bg-primary-500 text-white shadow-sm shadow-blue-100',
  indigo: 'bg-indigo-500 text-white shadow-sm shadow-indigo-100',
  rose: 'bg-rose-500 text-white shadow-sm shadow-rose-100',
  violet: 'bg-violet-500 text-white shadow-sm shadow-violet-100',
  amber: 'bg-amber-500 text-white shadow-sm shadow-amber-100',
  lime: 'bg-lime-600 text-white shadow-sm shadow-lime-100',
  cyan: 'bg-cyan-500 text-white shadow-sm shadow-cyan-100',
  teal: 'bg-teal-500 text-white shadow-sm shadow-teal-100',
  slate: 'bg-slate-700 text-white shadow-sm shadow-slate-100',
  purple: 'bg-purple-500 text-white shadow-sm shadow-purple-100',
  sky: 'bg-sky-500 text-white shadow-sm shadow-sky-100',
};

const getModuleVisuals = (path: string) => {
  const group = FUNCTIONAL_GROUPS.find(g => g.modulePaths.includes(path));
  return {
    color: group ? group.color : 'blue'
  };
};

export function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chuc_nang' | 'danh_dau' | 'tat_ca'>('chuc_nang');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Bookmarks local storage handling
  const [bookmarkedPaths, setBookmarkedPaths] = useState<string[]>(() => {
    const saved = safeLocalStorage.getItem('bookmarked_modules');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return ['/dashboard', '/requests', '/orders', '/hr', '/settings']; }
    }
    // Default bookmarks if empty to present a stunning dashboard first-look
    return ['/dashboard', '/requests', '/orders', '/hr', '/settings'];
  });

  useEffect(() => {
    safeLocalStorage.setItem('bookmarked_modules', JSON.stringify(bookmarkedPaths));
  }, [bookmarkedPaths]);

  const toggleBookmark = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (bookmarkedPaths.includes(path)) {
      setBookmarkedPaths(prev => prev.filter(p => p !== path));
    } else {
      setBookmarkedPaths(prev => [...prev, path]);
    }
  };

  // Click group handler
  const [selectedGroup, setSelectedGroup] = useState<FunctionalGroup | null>(null);
  const [showCopyright, setShowCopyright] = useState(false);
  const [showProduction, setShowProduction] = useState(false);

  const handleGroupClick = (group: FunctionalGroup) => {
    if (group.id === 'ban_quyen') {
      setShowCopyright(true);
    } else if (group.id === 'san_xuat') {
      setShowProduction(true);
    } else {
      setSelectedGroup(group);
    }
  };

  // Filter modules based on search query
  const filteredSubModules = ALL_SUB_MODULES.filter(item => {
    return (item.label?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
           (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase());
  });

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      (item.label?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (item.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-300 pb-20 pt-2 bg-slate-50/50 min-h-screen px-2 md:px-0">
      
      {/* Dynamic Header with Navigation & Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm mt-1">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold text-primary-600 bg-primary-50 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Enterprise OS</span>
            <span className="text-[10px] font-medium text-slate-400">Ver 2.50</span>
          </div>
          <h2 className="font-serif text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            VComm ERP <span className="text-primary-600 font-sans font-bold">Intelligence</span>
          </h2>
        </div>

        {/* Dynamic Search Box */}
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            placeholder="Tìm kiếm nhanh module..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Primary Pill-style Tabs Control */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex gap-2 bg-white/80 p-1 rounded-lg border border-slate-200 shadow-xs backdrop-blur-md">
          <button
            onClick={() => { setActiveTab('chuc_nang'); setSelectedGroup(null); }}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              activeTab === 'chuc_nang'
                ? "bg-primary-50 text-primary-600 border border-blue-200 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Chức năng</span>
          </button>

          <button
            onClick={() => { setActiveTab('danh_dau'); setSelectedGroup(null); }}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              activeTab === 'danh_dau'
                ? "bg-primary-50 text-primary-600 border border-blue-200 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent"
            )}
          >
            <Star className="w-3.5 h-3.5" />
            <span>Đánh dấu</span>
          </button>

          <button
            onClick={() => { setActiveTab('tat_ca'); setSelectedGroup(null); }}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5",
              activeTab === 'tat_ca'
                ? "bg-primary-50 text-primary-600 border border-blue-200 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/50 border border-transparent"
            )}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Tất cả</span>
          </button>
        </div>

        {/* Recently Visited Modules (Quick access) */}
        <div className="hidden lg:flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs font-medium text-slate-500">
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-700">Mở gần đây:</span>
          {['/dashboard', '/requests', '/orders'].map(path => {
            const mod = ALL_SUB_MODULES.find(m => m.path === path);
            if (!mod) return null;
            return (
              <button 
                key={path}
                onClick={() => navigate(path)}
                className="hover:text-primary-600 hover:bg-primary-50/50 px-2 py-0.5 rounded-md transition-all font-bold flex items-center gap-1"
              >
                <mod.icon className="w-3 h-3 text-slate-500" />
                {mod.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Reactive Dynamic Sections */}
      <div className="min-h-[400px]">
        
        {/* TAB 1: CHỨC NĂNG (The 13 corporate parent cards matching your screenshot) */}
        {activeTab === 'chuc_nang' && (
          <div className="space-y-6">
            
            {/* SEARCHING STATE IN TABS */}
            {searchQuery && (
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kết quả tìm kiếm phân hệ liên quan:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {filteredSubModules.map(item => {
                    const visuals = getModuleVisuals(item.path);
                    const IconComponent = item.icon;
                    return (
                      <div 
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden group"
                      >
                        {/* Star icon badge absolute right-4 top-4 */}
                        <button 
                          onClick={(e) => toggleBookmark(item.path, e)}
                          className="absolute right-4 top-4 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-500  transition-transform z-10"
                        >
                          <Star className={cn("w-3.5 h-3.5", bookmarkedPaths.includes(item.path) ? "fill-amber-400 text-amber-500" : "")} />
                        </button>

                        {/* Large circle squircle around icon */}
                        <div className={cn(
                          "w-14 h-14 rounded-lg flex items-center justify-center mb-5 transition-all duration-300 ",
                          COLOR_MAP[visuals.color] || COLOR_MAP.blue
                        )}>
                          <IconComponent className="w-6 h-6" />
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-slate-900 text-sm mb-2 group-hover:text-primary-600 transition-colors tracking-tight">
                          {item.label}
                        </h4>

                        {/* Subtitle / Description */}
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[180px] line-clamp-3">
                          {item.description || 'Phân hệ nghiệp vụ chất lượng cao.'}
                        </p>

                        {/* Fancy indicator bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-primary-600/10 transition-colors" />
                      </div>
                    );
                  })}
                  {filteredSubModules.length === 0 && (
                    <div className="col-span-full py-6 text-center text-xs text-slate-400">Không tìm thấy module nào khớp với "{searchQuery}"</div>
                  )}
                </div>
              </div>
            )}

            {/* The standard Grid of 13 cards styled exactly as requested in your image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
              {FUNCTIONAL_GROUPS.map((group) => {
                const IconComponent = group.icon;
                const isSelected = selectedGroup?.id === group.id;

                return (
                  <button
                    key={group.id}
                    id={`card-${group.id}`}
                    onClick={() => handleGroupClick(group)}
                    className={cn(
                      "bg-white border rounded-3xl p-6 flex flex-col items-center text-center hover:shadow-sm hover:border-slate-300 transition-all duration-300 transform .5 relative overflow-hidden group min-h-[190px]",
                      isSelected ? "border-blue-500 ring-2 ring-blue-100" : "border-slate-200"
                    )}
                  >
                    {group.id === 'hanh_chinh_phap_ly' && (
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/settings');
                        }}
                        className="absolute top-4 right-4 p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer z-10"
                        title="Thiết lập quy trình trình ký"
                      >
                        <Settings className="w-4 h-4" />
                      </div>
                    )}
                    {/* Circle squircle around icon */}
                    <div className={cn(
                      "w-14 h-14 rounded-lg flex items-center justify-center mb-5 transition-all duration-300 ",
                      COLOR_MAP[group.color] || COLOR_MAP.blue
                    )}>
                      <IconComponent className="w-6 h-6" />
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-slate-900 text-base mb-2 tracking-tight group-hover:text-primary-600 transition-colors">
                      {group.title}
                    </h3>

                    {/* Subtitle / Description */}
                    <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-[180px] line-clamp-3">
                      {group.desc}
                    </p>

                    {/* Fancy indicator bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-primary-600/10 transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: ĐÁNH DẤU (Persisted Bookmarked modules drawer) */}
        {activeTab === 'danh_dau' && (
          <div className="animate-in fade-in duration-300 space-y-4">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" /> Danh mục Đánh dấu ưa thích
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Nhấp vào hình ngôi sao trên bất cứ danh mục module nào để đưa vào trang chủ của bạn.</p>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full uppercase">
                  {bookmarkedPaths.length} Modules
                </span>
              </div>

              {bookmarkedPaths.length === 0 ? (
                <div className="py-6 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Star className="w-10 h-10 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-500">Chưa có ứng dụng nào được đánh dấu</p>
                  <button 
                    onClick={() => setActiveTab('chuc_nang')} 
                    className="text-xs font-bold text-primary-600 hover:underline hover:text-blue-700 bg-primary-50 px-3 py-1.5 rounded-lg border border-primary-100"
                  >
                    Duyệt các chức năng chính ngay
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {ALL_SUB_MODULES.filter(m => bookmarkedPaths.includes(m.path)).map((item) => {
                    const visuals = getModuleVisuals(item.path);
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden group"
                      >
                        {/* Star icon badge absolute right-4 top-4 */}
                        <button
                          onClick={(e) => toggleBookmark(item.path, e)}
                          className="absolute right-4 top-4 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-amber-500  transition-transform z-10"
                          title="Bỏ đánh dấu"
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                        </button>

                        <div className="flex items-center gap-3 w-full relative z-10">
                          {/* Large circle squircle around icon */}
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            COLOR_MAP[visuals.color] || COLOR_MAP.blue
                          )}>
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0 text-left">
                            {/* Title */}
                            <h4 className="font-bold text-slate-900 text-sm mb-0.5 group-hover:text-primary-700 transition-colors truncate">
                              {item.label}
                            </h4>

                            {/* Subtitle / Description */}
                            <p className="text-[11px] text-slate-500 leading-tight truncate">
                              {item.description || 'Module quản lý nghiệp vụ chất lượng cao.'}
                            </p>
                          </div>
                        </div>

                        {/* Fancy indicator bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-primary-600/10 transition-colors" />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TẤT CẢ (Original group structures retained so no feature is lost!) */}
        {activeTab === 'tat_ca' && (
          <div className="animate-in fade-in duration-300 space-y-10 bg-white p-6 rounded-lg border border-slate-200 shadow-xs">
            {filteredGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-[0.2em]">
                    {group.title}
                  </h3>
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-full">{group.items.length} modules</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {group.items.map((item) => {
                    const visuals = getModuleVisuals(item.path);
                    const IconComponent = item.icon;
                    return (
                      <div
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-center hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden group"
                      >
                        {/* Star icon badge absolute right-4 top-4 */}
                        <button
                          onClick={(e) => toggleBookmark(item.path, e)}
                          className="absolute right-4 top-4 p-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-amber-500  transition-transform z-10"
                          title="Đánh dấu"
                        >
                          <Star className={cn("w-3.5 h-3.5", bookmarkedPaths.includes(item.path) ? "fill-amber-400 text-amber-500" : "")} />
                        </button>

                        <div className="flex items-center gap-3 w-full relative z-10">
                          {/* Large circle squircle around icon */}
                          <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                            COLOR_MAP[visuals.color] || COLOR_MAP.blue
                          )}>
                            <IconComponent className="w-5 h-5" />
                          </div>

                          <div className="flex-1 min-w-0 text-left">
                            {/* Title */}
                            <h4 className="font-bold text-slate-900 text-sm mb-0.5 group-hover:text-primary-700 transition-colors truncate">
                              {item.label}
                            </h4>

                            {/* Subtitle / Description */}
                            <p className="text-[11px] text-slate-500 leading-tight truncate">
                              {item.description || 'Module quản lý nghiệp vụ chất lượng cao.'}
                            </p>
                          </div>
                        </div>

                        {/* Fancy indicator bar */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-transparent group-hover:bg-primary-600/10 transition-colors" />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredGroups.length === 0 && (
              <div className="py-6 text-center text-slate-400 text-sm font-medium">Không tìm thấy module nào phù hợp với yêu cầu tìm kiếm.</div>
            )}
          </div>
        )}

      </div>

      {/* FOOTER & TECHNICAL DISCLOSURES */}
      <footer className="mt-6 pt-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Hỗ trợ kỹ thuật: 1900 8888</div>
            <div className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Doanh nghiệp: Enterprise Edition</div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => setShowCopyright(true)} className="text-xs font-bold text-primary-600 hover:bg-slate-100/50 px-4 py-2 rounded-lg transition-colors flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Bản quyền hệ thống
            </button>
            <button onClick={() => alert('Đang tải cẩm nang hướng dẫn sử dụng VComm ERP...')} className="text-xs font-bold text-slate-600 hover:bg-slate-100/50 px-4 py-2 rounded-lg transition-colors flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> Cẩm nang HDSD
            </button>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Sub-modules Selector Drawer for Chức Năng (Slide-over / popup) */}
      <AnimatePresence>
        {selectedGroup && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedGroup(null)}
              className="absolute inset-0 bg-slate-900 bg-opacity-70 backdrop-blur-xs"
            />

            {/* Slide-over Content */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white h-full shadow-sm flex flex-col z-10 border-l border-slate-200"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", COLOR_MAP[selectedGroup.color] || COLOR_MAP.blue)}>
                    {React.createElement(selectedGroup.icon, { className: "w-5 h-5" })}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{selectedGroup.title}</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Danh mục các phân hệ vận hành</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedGroup(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                <p className="text-xs text-slate-500 leading-relaxed font-medium bg-primary-50/50 text-blue-700 p-3 rounded-lg border border-primary-100/50">
                  {selectedGroup.desc} Chọn một phân hệ nghiệp vụ ERP dưới đây để chuyển hướng điều hướng xử lý thông tin:
                </p>

                <div className="space-y-3">
                  {selectedGroup.modulePaths.map(path => {
                    const mod = ALL_SUB_MODULES.find(m => m.path === path);
                    if (!mod) return null;

                    return (
                      <div
                        key={path}
                        onClick={() => {
                          setSelectedGroup(null);
                          navigate(path);
                        }}
                        className="group flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-500 rounded-lg transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 group-hover:bg-primary-50 group-hover:border-primary-100 group-hover:text-primary-600 flex items-center justify-center transition-colors shadow-xs">
                            <mod.icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 group-hover:text-primary-600 transition-colors">{mod.label}</p>
                            <p className="text-[10px] text-slate-500 line-clamp-1 leading-normal max-w-[200px]">{mod.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button 
                            onClick={(e) => toggleBookmark(path, e)}
                            className="p-1.5 hover:bg-slate-100 text-slate-300 hover:text-amber-500 rounded-lg transition-colors"
                            title="Thêm vào Đánh dấu"
                          >
                            <Star className={cn("w-3.5 h-3.5", bookmarkedPaths.includes(path) ? "fill-amber-400 text-amber-500" : "")} />
                          </button>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>
                    );
                  })}

                  {selectedGroup.modulePaths.length === 0 && (
                    <div className="py-6 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                      <Layers3 className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-bold">Không tìm thấy phân hệ phụ</p>
                      <p className="text-[10px] text-slate-500">Phân hệ này đang hoạt động cơ chế ngầm định.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 bg-slate-50 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                VCOMM ENTERPRISE WORK ENGINE
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Copyright & License Information Modal (Highly polished Corporate styling) */}
      <AnimatePresence>
        {showCopyright && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCopyright(false)}
              className="absolute inset-0 bg-slate-900"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 z-10 flex flex-col"
            >
              <div className="bg-gradient-to-br from-slate-900 to-blue-980 p-6 text-white text-center sm:text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-[0.05] p-6 pointer-events-none">
                  <Shield className="w-48 h-48 rotate-12" />
                </div>
                <h3 className="font-serif text-lg font-black flex items-center justify-center sm:justify-start gap-2 text-white">
                  <Shield className="w-5 h-5 text-blue-400" /> VComm ERP Enterprise License Key
                </h3>
                <p className="text-slate-400 text-xs mt-1">Hệ thống thông báo thông tin đăng ký bản quyền sản phẩm</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="border border-slate-200 rounded-lg p-5 bg-slate-50 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Chủ sở hữu bản quyền</span>
                    <span className="text-xs font-extrabold text-slate-800 font-mono">vinh.ngtienmdb@gmail.com</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mã phần mềm (VComm Product ID)</span>
                    <span className="text-xs font-semibold text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-md font-mono">VCOMM-ERP-ENT-2026</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nhà phát triển phân phối</span>
                    <span className="text-xs font-bold text-slate-700">Công ty Cổ phần VComm Intelligence Corp</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái xác thực</span>
                    <span className="text-xs font-extrabold text-emerald-600 flex items-center gap-1 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-full">
                      <UserCheck className="w-3 h-3" /> ĐÃ KÍCH HOẠT (ACTIVE)
                    </span>
                  </div>
                </div>

                <div className="text-xs text-slate-500 leading-relaxed font-medium">
                  Sản phẩm được bảo hộ bởi luật sở hữu trí tuệ của Nước Cộng Hòa Xã Hội Chủ Nghĩa Việt Nam. Nghiêm cấm mọi hành vi sao chép thiết lập mã nguồn, can thiệp vào các API SePay & Gemini SDK trái phép hoặc bẻ khóa giấy phép Enterprise.
                </div>
              </div>

              <div className="p-4 bg-slate-100 flex justify-end gap-2 border-t border-slate-200">
                <button 
                  onClick={() => setShowCopyright(false)} 
                  className="px-5 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-xs font-extrabold transition-all shadow-sm active:scale-95"
                >
                  Đóng chứng chỉ
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Manufacturer Operations Showcase Dashboard (No static fake page, actual layout!) */}
      <AnimatePresence>
        {showProduction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProduction(false)}
              className="absolute inset-0 bg-slate-900"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200 z-10 flex flex-col"
            >
              <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-lime-500 text-white flex items-center justify-center shadow-sm">
                    <Factory className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-black text-white">Phân hệ Quản trị Sản xuất & Chế biến</h3>
                    <p className="text-slate-400 text-xs">Mô hình sản xuất khép kín MRP & ERP Warehouse Logistics</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowProduction(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 overflow-y-auto max-h-[500px]">
                {/* Visual Pipeline components */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Item 1 */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <p className="text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full w-fit uppercase">Giai đoạn 1: Lập kế hoạch (MRP)</p>
                    <h4 className="font-bold text-slate-800 text-sm">Nhu cầu nguyên vật liệu</h4>
                    <p className="text-xs text-slate-500 italic font-medium leading-relaxed">Hệ thống phân tích báo cáo đơn hàng và cấu trúc sản phẩm BOM để xuất phiếu mua vật tư.</p>
                    <div className="p-3 bg-white border border-slate-100 rounded-lg text-[11px] text-slate-600 font-mono space-y-1">
                      <div className="flex justify-between"><span>Phiếu kế hoạch:</span><span className="font-bold">MRP-2026-091</span></div>
                      <div className="flex justify-between"><span>Nguyên liệu:</span><span className="font-bold text-primary-600">Thép mạ kẽm</span></div>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <p className="text-[10px] font-bold text-primary-600 bg-primary-50 border border-primary-100 px-2 py-0.5 rounded-full w-fit uppercase">Giai đoạn 2: Lệnh sản xuất</p>
                    <h4 className="font-bold text-slate-800 text-sm">Chế tạo & Lắp ráp phân xưởng</h4>
                    <p className="text-xs text-slate-500 italic font-medium leading-relaxed">Phân bổ chỉ tiêu sản lượng theo dây chuyền lắp ráp công nghệ chính xác cao IoT.</p>
                    <div className="p-3 bg-white border border-slate-100 rounded-lg text-[11px] text-slate-600 font-mono space-y-1">
                      <div className="flex justify-between"><span>Lệnh chế tạo:</span><span className="font-bold">WO-9948271</span></div>
                      <div className="flex justify-between"><span>Nhà xưởng:</span><span className="font-bold text-green-600">Line A - Khu CNC</span></div>
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full w-fit uppercase">Giai đoạn 3: Kiểm định & Đóng gói</p>
                    <h4 className="font-bold text-slate-800 text-sm">Quản lý chất lượng (IQC/OQC)</h4>
                    <p className="text-xs text-slate-500 italic font-medium leading-relaxed">Chứng thư kiểm tra chất lượng từ các kỹ sư đầu ngành, sấy dán mã vạch kho vận bốc xếp.</p>
                    <div className="p-3 bg-white border border-slate-100 rounded-lg text-[11px] text-slate-600 font-mono space-y-1">
                      <div className="flex justify-between"><span>Tỷ lệ đạt chuẩn:</span><span className="font-bold text-emerald-600">99.85%</span></div>
                      <div className="flex justify-between"><span>Nhãn dán QR code:</span><span className="font-bold text-slate-600">QR-BATCH-204</span></div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg flex gap-3 text-xs font-medium">
                  <Info className="w-5 h-5 flex-shrink-0 text-yellow-600" />
                  <div>
                    <span className="font-bold">Lưu ý nghiệp vụ:</span> Phân hệ quản lý dây chuyền sản xuất đang được cấu hình đồng bộ trực tiếp với hệ sinh thái ERP phần cứng tại nhà máy. Liên hệ quản lý IT Enterprise của VComm để tích hợp PLC/Scada.
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-100 flex justify-end gap-2 border-t border-slate-200">
                <button 
                  onClick={() => setShowProduction(false)} 
                  className="px-5 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-xs font-bold transition-all shadow-sm active:scale-95"
                >
                  Xác nhận cấu hình
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
