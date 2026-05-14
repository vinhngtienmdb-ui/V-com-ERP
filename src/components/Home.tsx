import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
 ArrowRight, 
 Search, 
 Star, 
 History,
 LayoutGrid,
 Menu
} from 'lucide-react';
import { cn } from '../lib/utils';
import { navGroups } from '../constants';

export function Home() {
 const navigate = useNavigate();
 const [searchQuery, setSearchQuery] = React.useState('');

 const filteredGroups = navGroups.map(group => ({
 ...group,
 items: group.items.filter(item => 
 item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
 item.description?.toLowerCase().includes(searchQuery.toLowerCase())
 )
 })).filter(group => group.items.length > 0);

 return (
 <div className="flex flex-col h-full gap-8 animate-in fade-in duration-700 pb-20 pt-2">
 {/* Hero / Search Section */}
 <div className="relative overflow-hidden bg-slate-900 rounded-lg p-8 md:p-12 text-[#FAF9F5] border border-slate-800 shadow-sm">
 {/* Animated Background Gradients */}
 <div className="absolute top-0 right-0 w-96 h-96 bg-slate-900/20 rounded-full blur-[100px] -mr-48 -mt-48 animate-pulse" />
 <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary-600/10 rounded-full blur-[100px] -ml-48 -mb-48" />
 
 <div className="absolute top-0 right-0 p-12 opacity-[0.05] pointer-events-none">
 <LayoutGrid className="w-80 h-80 rotate-12" />
 </div>
 
 <div className="relative z-10 max-w-4xl">
 <div className="flex items-center gap-3 mb-8">
 <div className="flex h-2 w-2 relative">
 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.9)]"></span>
 </div>
 <span className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em]">Hệ thống vận hành tối ưu</span>
 <div className="w-px h-3 bg-slate-700 mx-2" />
 <span className="text-xs font-medium text-slate-500">Version 2.5.0-Enterprise</span>
 </div>

 <h1 className="font-serif tracking-tight text-4xl md:text-5xl font-black tracking-tight mb-6 text-[#FAF9F5] leading-tight">
 Trung tâm Điều hành <br />
 <span className="bg-white bg-clip-text text-transparent">VComm ERP Intelligence</span>
 </h1>
 
 <p className="text-slate-500 text-lg font-medium mb-10 max-w-2xl leading-relaxed">
 Hệ thống quản trị doanh nghiệp hợp nhất. <br className="hidden md:block" />
 Truy cập nhanh tất cả các module vận hành từ một giao diện AI-First tập trung.
 </p>
 
 <div className="flex flex-col md:flex-row items-center gap-6">
 <div className="relative group flex-1 w-full max-w-xl">
 <div className="absolute -inset-1 bg-white rounded-xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-focus-within:duration-200"></div>
 <div className="relative">
 <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-orange-500 transition-colors" />
 <input 
 type="text"
 placeholder="Tìm kiếm module hoặc chức năng (Shift + /)..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl py-4 pl-14 pr-6 text-base text-[#FAF9F5] placeholder-stone-500 focus:outline-none focus:ring-0 focus:border-slate-900/50 transition-all backdrop-blur-xl"
 />
 </div>
 </div>
 
 <div className="flex flex-wrap items-center justify-center gap-4 bg-white/5 border border-white/10 p-2 pl-4 rounded-xl backdrop-blur-md">
 <div className="flex items-center gap-2">
 <History className="w-4 h-4 text-slate-500" />
 <span className="text-xs font-bold text-slate-600 uppercase tracking-wider mr-2">Vừa mở:</span>
 </div>
 <div className="flex gap-2">
 {['Dashboard', 'Đơn hàng', 'Sản phẩm'].map(item => (
 <button key={item} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-md text-xs font-bold text-slate-500 transition-colors border border-white/5">
 {item}
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Grid of Modules */}
 <div className="space-y-12">
 {filteredGroups.map((group, idx) => (
 <div key={idx} className="space-y-6">
 <div className="flex items-center gap-4">
 <h2 className="text-sm font-black text-slate-600 uppercase tracking-[0.2em]">
 {group.title}
 </h2>
 <div className="flex-1 h-px bg-slate-200" />
 </div>
 
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {group.items.map((item) => {
 const colorClasses: Record<string, any> = {
 blue: { 
 icon: 'text-orange-700 bg-slate-100 group-hover:bg-slate-900 group-hover:shadow-blue-200',
 border: 'hover:border-slate-900',
 text: 'group-hover:text-orange-700',
 action: 'text-orange-700'
 },
 indigo: { 
 icon: 'text-primary-600 bg-primary-50 group-hover:bg-primary-600 group-hover:shadow-indigo-200',
 border: 'hover:border-primary-600',
 text: 'group-hover:text-primary-600',
 action: 'text-primary-600'
 },
 violet: { 
 icon: 'text-violet-600 bg-violet-50 group-hover:bg-violet-600 group-hover:shadow-violet-200',
 border: 'hover:border-violet-600',
 text: 'group-hover:text-violet-600',
 action: 'text-violet-600'
 },
 cyan: { 
 icon: 'text-cyan-600 bg-cyan-50 group-hover:bg-cyan-600 group-hover:shadow-cyan-200',
 border: 'hover:border-cyan-600',
 text: 'group-hover:text-cyan-600',
 action: 'text-cyan-600'
 },
 emerald: { 
 icon: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:shadow-emerald-200',
 border: 'hover:border-emerald-600',
 text: 'group-hover:text-emerald-600',
 action: 'text-emerald-600'
 },
 amber: { 
 icon: 'text-amber-600 bg-amber-50 group-hover:bg-amber-600 group-hover:shadow-amber-200',
 border: 'hover:border-amber-600',
 text: 'group-hover:text-amber-600',
 action: 'text-amber-600'
 },
 slate: { 
 icon: 'text-slate-700 bg-slate-50 group-hover:bg-slate-600 group-hover:shadow-slate-200',
 border: 'hover:border-slate-600',
 text: 'group-hover:text-slate-700',
 action: 'text-slate-700'
 },
 orange: { 
 icon: 'text-orange-600 bg-orange-50 group-hover:bg-orange-600 group-hover:shadow-orange-200',
 border: 'hover:border-orange-600',
 text: 'group-hover:text-orange-600',
 action: 'text-orange-600'
 },
 sky: { 
 icon: 'text-sky-600 bg-sky-50 group-hover:bg-sky-600 group-hover:shadow-sky-200',
 border: 'hover:border-sky-600',
 text: 'group-hover:text-sky-600',
 action: 'text-sky-600'
 },
 rose: { 
 icon: 'text-rose-600 bg-rose-50 group-hover:bg-rose-600 group-hover:shadow-rose-200',
 border: 'hover:border-rose-600',
 text: 'group-hover:text-rose-600',
 action: 'text-rose-600'
 },
 pink: { 
 icon: 'text-pink-600 bg-pink-50 group-hover:bg-pink-600 group-hover:shadow-pink-200',
 border: 'hover:border-pink-600',
 text: 'group-hover:text-pink-600',
 action: 'text-pink-600'
 },
 teal: { 
 icon: 'text-teal-600 bg-teal-50 group-hover:bg-teal-600 group-hover:shadow-teal-200',
 border: 'hover:border-teal-600',
 text: 'group-hover:text-teal-600',
 action: 'text-teal-600'
 },
 red: { 
 icon: 'text-red-600 bg-red-50 group-hover:bg-red-600 group-hover:shadow-red-200',
 border: 'hover:border-red-600',
 text: 'group-hover:text-red-600',
 action: 'text-red-600'
 },
 yellow: { 
 icon: 'text-yellow-600 bg-yellow-50 group-hover:bg-yellow-600 group-hover:shadow-yellow-200',
 border: 'hover:border-yellow-600',
 text: 'group-hover:text-yellow-600',
 action: 'text-yellow-600'
 },
 purple: { 
 icon: 'text-purple-600 bg-purple-50 group-hover:bg-purple-600 group-hover:shadow-purple-200',
 border: 'hover:border-purple-600',
 text: 'group-hover:text-purple-600',
 action: 'text-purple-600'
 },
 fuchsia: { 
 icon: 'text-fuchsia-600 bg-fuchsia-50 group-hover:bg-fuchsia-600 group-hover:shadow-fuchsia-200',
 border: 'hover:border-fuchsia-600',
 text: 'group-hover:text-fuchsia-600',
 action: 'text-fuchsia-600'
 },
 lime: { 
 icon: 'text-lime-600 bg-lime-50 group-hover:bg-lime-600 group-hover:shadow-lime-200',
 border: 'hover:border-lime-600',
 text: 'group-hover:text-lime-600',
 action: 'text-lime-600'
 },
 gray: { 
 icon: 'text-slate-700 bg-slate-50 group-hover:bg-slate-600 group-hover:shadow-slate-200',
 border: 'hover:border-slate-600',
 text: 'group-hover:text-slate-700',
 action: 'text-slate-700'
 },
 };
 
 const classes = colorClasses[item.color || 'blue'] || colorClasses.blue;

 return (
 <button
 key={item.path}
 onClick={() => navigate(item.path)}
 className={cn(
 "group relative bg-white border border-slate-300 rounded-xl p-5 text-left hover:shadow-sm transition-all duration-300 overflow-hidden border-b-2 active:translate-y-0",
 "hover:-translate-y-0.5", 
 classes.border
 )}
 >
 <div className="relative z-10">
 <div className={cn(
 "w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
 "group-hover:text-[#FAF9F5] group-hover:shadow-sm", 
 classes.icon
 )}>
 <item.icon className="w-5 h-5" />
 </div>
 
 <h3 className={cn("text-base font-bold text-slate-900 mb-1 tracking-tight transition-colors", classes.text)}>
 {item.label}
 </h3>
 
 <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2 italic">
 {item.description || 'Module quản lý nghiệp vụ hệ thống.'}
 </p>
 
 <div className={cn("mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0", classes.action)}>
 <span>Truy cập</span>
 <ArrowRight className="w-3 h-3" />
 </div>
 </div>

 {/* Decorative background elements */}
 <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none">
 <item.icon className="w-32 h-32 -mr-8 -mt-8" />
 </div>
 </button>
 );
 })}
 </div>
 </div>
 ))}

 {filteredGroups.length === 0 && (
 <div className="py-20 text-center space-y-4">
 <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-500">
 <Search className="w-10 h-10" />
 </div>
 <h3 className="text-xl font-bold text-slate-900">Không tìm thấy module phù hợp</h3>
 <p className="text-slate-600">Thử tìm kiếm với từ khóa khác hoặc duyệt danh mục bên dưới.</p>
 <button 
 onClick={() => setSearchQuery('')}
 className="text-orange-700 font-bold hover:underline"
 >
 Xóa tìm kiếm
 </button>
 </div>
 )}
 </div>

 {/* Footer Support */}
 <footer className="mt-12 pt-12 border-t border-slate-300">
 <div className="flex flex-col md:flex-row items-center justify-between gap-6">
 <div className="flex items-center gap-6">
 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Hỗ trợ kỹ thuật: 1900 8888</div>
 <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">Version: 2.5.0-Enterprise</div>
 </div>
 <div className="flex gap-4">
 <button className="text-xs font-bold text-orange-700 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors">Hướng dẫn sử dụng</button>
 <button className="text-xs font-bold text-orange-700 hover:bg-slate-100 px-4 py-2 rounded-lg transition-colors">Báo cáo sự cố</button>
 </div>
 </div>
 </footer>
 </div>
 );
}
