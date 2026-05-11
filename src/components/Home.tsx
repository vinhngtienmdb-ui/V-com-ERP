import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Grid3x3, Layers } from 'lucide-react';
import { cn } from '../lib/utils';
import { navGroups } from '../constants';
import { useAuth } from '../context/AuthContext';

const colorBg: Record<string, string> = {
 blue:    'bg-blue-500',
 indigo:  'bg-indigo-500',
 violet:  'bg-violet-500',
 cyan:    'bg-cyan-500',
 emerald: 'bg-emerald-500',
 amber:   'bg-amber-500',
 orange:  'bg-orange-500',
 red:     'bg-red-500',
 rose:    'bg-rose-500',
 pink:    'bg-pink-500',
 teal:    'bg-teal-600',
 sky:     'bg-sky-500',
 purple:  'bg-purple-600',
 fuchsia: 'bg-fuchsia-500',
 lime:    'bg-lime-500',
 yellow:  'bg-yellow-500',
 slate:   'bg-slate-600',
 gray:    'bg-slate-500',
};

const allItems = navGroups.flatMap(g => g.items);

function useStarred() {
 const [starred, setStarred] = React.useState<string[]>(() => {
  try { return JSON.parse(localStorage.getItem('starred-modules') || '[]'); } catch { return []; }
 });
 const toggle = (path: string) => {
  setStarred(prev => {
   const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path];
   localStorage.setItem('starred-modules', JSON.stringify(next));
   return next;
  });
 };
 return { starred, toggle };
}

function ModuleCard({
 item, navigate, isStarred, onToggleStar,
}: {
 item: any;
 navigate: (p: string) => void;
 isStarred: boolean;
 onToggleStar: (p: string) => void;
}) {
 const bg = colorBg[item.color || 'blue'] || 'bg-blue-500';
 return (
  <div className="relative group">
   <button
    onClick={() => navigate(item.path)}
    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 w-full min-h-[160px] justify-between"
   >
    <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200', bg)}>
     <item.icon className="w-7 h-7 text-white" />
    </div>
    <div className="w-full">
     <p className="text-sm font-semibold text-slate-800 leading-snug">{item.label}</p>
     {item.description && (
      <p className="text-xs text-slate-400 mt-1 leading-snug line-clamp-1">{item.description}</p>
     )}
    </div>
   </button>
   <button
    onClick={e => { e.stopPropagation(); onToggleStar(item.path); }}
    className={cn(
     'absolute top-2.5 right-2.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all',
     isStarred
      ? 'opacity-100 bg-amber-50 text-amber-500'
      : 'opacity-0 group-hover:opacity-100 bg-slate-100 text-slate-400 hover:text-amber-500'
    )}
   >
    <Star className={cn('w-3.5 h-3.5', isStarred && 'fill-amber-500')} />
   </button>
  </div>
 );
}

type Tab = 'features' | 'starred' | 'all';

export function Home() {
 const navigate = useNavigate();
 const { staffInfo } = useAuth();
 const { starred, toggle } = useStarred();
 const [searchQuery, setSearchQuery] = React.useState('');
 const [activeTab, setActiveTab] = React.useState<Tab>('features');

 const hour = new Date().getHours();
 const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
 const userName = staffInfo?.name || 'bạn';

 const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'features', label: 'Chức năng', icon: Grid3x3 },
  { id: 'starred',  label: 'Đánh dấu',  icon: Star },
  { id: 'all',      label: 'Tất cả',    icon: Layers },
 ];

 const displayItems = React.useMemo(() => {
  let items = activeTab === 'starred'
   ? allItems.filter(i => starred.includes(i.path))
   : allItems;
  if (searchQuery.trim()) {
   const q = searchQuery.toLowerCase();
   items = items.filter(i =>
    i.label.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)
   );
  }
  return items;
 }, [activeTab, starred, searchQuery]);

 return (
  <div className="flex flex-col gap-5 pb-10 animate-in fade-in duration-500">

   {/* Greeting */}
   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
     <h1 className="text-xl font-bold text-slate-900">
      {greeting}, <span className="text-blue-600">{userName}</span> 👋
     </h1>
     <p className="text-sm text-slate-500 mt-1">Chào mừng bạn trở lại hệ thống VComm ERP</p>
    </div>
    <div className="relative w-full sm:w-72">
     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
     <input
      type="text"
      placeholder="Tìm kiếm module..."
      value={searchQuery}
      onChange={e => setSearchQuery(e.target.value)}
      className="w-full bg-white border border-slate-200 py-2.5 pl-10 pr-4 text-sm placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 rounded-xl"
     />
    </div>
   </div>

   {/* Tabs */}
   {!searchQuery && (
    <div className="flex items-center gap-1.5">
     {tabs.map(tab => (
      <button
       key={tab.id}
       onClick={() => setActiveTab(tab.id)}
       className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all',
        activeTab === tab.id
         ? 'bg-blue-600 text-white shadow-sm'
         : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-800'
       )}
      >
       <tab.icon className="w-3.5 h-3.5" />
       {tab.label}
       {tab.id === 'starred' && starred.length > 0 && (
        <span className={cn(
         'text-xs font-bold px-1.5 py-0.5 rounded-full',
         activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-600'
        )}>{starred.length}</span>
       )}
      </button>
     ))}
    </div>
   )}

   {/* Module grid */}
   {activeTab === 'starred' && !searchQuery && displayItems.length === 0 ? (
    <div className="py-20 text-center">
     <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
      <Star className="w-8 h-8 text-amber-400" />
     </div>
     <p className="text-slate-600 font-medium">Chưa có module nào được đánh dấu</p>
     <p className="text-sm text-slate-400 mt-1">Hover vào module và nhấn ⭐ để thêm vào đây</p>
    </div>
   ) : (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
     {displayItems.map(item => (
      <ModuleCard
       key={item.path}
       item={item}
       navigate={navigate}
       isStarred={starred.includes(item.path)}
       onToggleStar={toggle}
      />
     ))}
     {displayItems.length === 0 && searchQuery && (
      <div className="col-span-full py-16 text-center">
       <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
       <p className="text-slate-500">Không tìm thấy module phù hợp</p>
       <button onClick={() => setSearchQuery('')} className="mt-2 text-blue-600 text-sm hover:underline">
        Xóa tìm kiếm
       </button>
      </div>
     )}
    </div>
   )}
  </div>
 );
}
