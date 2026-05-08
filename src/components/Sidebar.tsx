import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { navGroups } from '../constants';

export function Sidebar() {
 const navigate = useNavigate();
 const location = useLocation();
 const { signOut } = useAuth();
 
 const [logo, setLogo] = React.useState<string | null>(null);

 React.useEffect(() => {
   const savedLogo = localStorage.getItem('system-logo');
   if (savedLogo) setLogo(savedLogo);
   
   // Listen for storage changes in other tabs/windows
   const handleStorage = (e: StorageEvent) => {
     if (e.key === 'system-logo') setLogo(e.newValue);
   };
   window.addEventListener('storage', handleStorage);
   return () => window.removeEventListener('storage', handleStorage);
 }, []);

 return (
 <aside className="w-[280px] bg-white border-r border-slate-300 flex flex-col h-full py-6">
 <div className="px-6 mb-8 flex items-center gap-3">
 {logo ? (
   <img src={logo} alt="Logo" className="h-8 w-auto object-contain" referrerPolicy="no-referrer" />
 ) : (
   <>
    <div className="w-4 h-4 bg-[#2563EB] rounded-sm transform rotate-45 shadow-sm shadow-slate-900/5"></div>
    <h1 className="font-serif tracking-tight text-xl font-black text-[#111827]">
    VComm <span className="text-[#2563EB]">ERP</span>
    </h1>
   </>
 )}
 </div>

 <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-6">
 {navGroups.map((group, groupIdx) => (
 <div key={groupIdx} className="space-y-1">
 <h3 className="px-4 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em] mb-3">
 {group.title}
 </h3>
 <div className="space-y-0.5">
 {group.items.map((item) => {
 const isActive = location.pathname === item.path;
 return (
 <button
 key={item.path}
 onClick={() => navigate(item.path)}
 className={cn(
 "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group relative",
 isActive 
 ? "bg-slate-100 text-[#2563EB] font-bold shadow-sm shadow-blue-100/50" 
 : "text-[#4B5563] hover:bg-slate-50 hover:text-[#111827]"
 )}
 >
 <item.icon className={cn(
 "w-4 h-4 transition-transform duration-200 group-hover:scale-110",
 isActive ? "text-[#2563EB]" : "text-[#9CA3AF]"
 )} />
 <span className="flex-1 text-left truncate">{item.label}</span>
 {isActive && (
 <div className="absolute right-3 w-1.5 h-1.5 bg-[#2563EB] rounded-full" />
 )}
 </button>
 );
 })}
 </div>
 </div>
 ))}
 </nav>

 <div className="px-4 mt-auto">
 <button 
 onClick={() => signOut()}
 className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
 >
 <LogOut className="w-4 h-4" />
 <span>Đăng xuất</span>
 </button>
 </div>
 </aside>
 );
}
