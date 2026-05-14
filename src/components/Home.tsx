import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { HOME_MODULES } from '../constants';

const FAVORITES_KEY = 'home-favorites';

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // ignore
  }
  return new Set();
}

function saveFavorites(favs: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favs)));
}

type Tab = 'functions' | 'favorites' | 'all';

export function Home() {
  const navigate = useNavigate();
  const { staffInfo } = useAuth();

  const [activeTab, setActiveTab] = React.useState<Tab>('functions');
  const [favorites, setFavorites] = React.useState<Set<string>>(() => loadFavorites());

  const greeting = getGreeting(new Date().getHours());
  const name = staffInfo?.name ?? 'Quản trị hệ thống';

  function toggleFavorite(e: React.MouseEvent, path: string, label: string) {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      const key = `${label}::${path}`;
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      saveFavorites(next);
      return next;
    });
  }

  function isFav(path: string, label: string): boolean {
    return favorites.has(`${label}::${path}`);
  }

  const displayedModules = React.useMemo(() => {
    if (activeTab === 'favorites') {
      return HOME_MODULES.filter((m) => isFav(m.path, m.label));
    }
    return HOME_MODULES;
  }, [activeTab, favorites]);

  const tabs: { key: Tab; label: string }[] = [
    { key: 'functions', label: 'Chức năng' },
    { key: 'favorites', label: 'Đánh dấu' },
    { key: 'all', label: 'Tất cả' },
  ];

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">
          {greeting},{' '}
          <span className="text-blue-600">{name}</span> 👋
        </h1>
      </div>

      {/* Tab row */}
      <div className="border-b border-slate-200 -mb-px">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      {displayedModules.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {displayedModules.map((mod) => {
            const favKey = `${mod.label}::${mod.path}`;
            const favorited = favorites.has(favKey);
            return (
              <div
                key={favKey}
                onClick={() => navigate(mod.path)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(mod.path)}
                className="group relative bg-white rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all duration-200 p-6 text-left flex flex-col items-start cursor-pointer"
              >
                {/* Favorite star */}
                <button
                  onClick={(e) => toggleFavorite(e, mod.path, mod.label)}
                  className={cn(
                    'absolute top-3.5 right-3.5 p-1 rounded-full transition-opacity',
                    favorited
                      ? 'opacity-100 text-yellow-400'
                      : 'opacity-0 group-hover:opacity-100 text-slate-300 hover:text-yellow-400'
                  )}
                  aria-label={favorited ? 'Bỏ đánh dấu' : 'Đánh dấu'}
                >
                  <Star
                    className="w-4 h-4"
                    fill={favorited ? 'currentColor' : 'none'}
                  />
                </button>

                {/* Icon */}
                <div
                  className={cn(
                    'w-16 h-16 rounded-2xl shadow-sm mb-4 flex items-center justify-center shrink-0',
                    mod.color
                  )}
                >
                  <mod.icon className="w-8 h-8 text-white" />
                </div>

                {/* Module name */}
                <div className="text-base font-bold text-slate-900 leading-snug mb-1.5">
                  {mod.label}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                  {mod.desc}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center">
          <Star className="w-10 h-10 mx-auto mb-3 text-slate-200" />
          <p className="text-sm text-slate-500">Chưa có module nào được đánh dấu.</p>
          <p className="text-xs text-slate-400 mt-1">
            Nhấn vào biểu tượng ★ trên thẻ module để lưu nhanh.
          </p>
        </div>
      )}
    </div>
  );
}
