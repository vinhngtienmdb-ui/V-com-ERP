import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, X, Check, CheckCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { usePreferences } from '../context/PreferencesContext';
import { formatDistanceToNow } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

export function Header() {
 const { staffInfo } = useAuth();
 const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
 const { language } = usePreferences();
 const [showNotifications, setShowNotifications] = useState(false);
 const dropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 setShowNotifications(false);
 }
 }
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);
 
 return (
 <header className="h-20 px-4 md:px-10 flex items-center justify-between sticky top-0 z-50 bg-[#F9FAFB]/95 backdrop-blur-md border-b border-stone-200/50">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-xl md:text-2xl font-bold text-stone-900 tracking-tight">
 {'Chào buổi sáng'}, {staffInfo?.name || ('Quản trị hệ thống')}
 </h1>
 <p className="text-[11px] md:text-xs text-stone-500 font-medium mt-1">
 {`Hệ thống vận hành ổn định. Có ${unreadCount} thông báo mới.`}
 </p>
 </div>

 <div className="flex items-center gap-4 md:gap-8">
 <div className="relative group hidden sm:block">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 group-focus-within:text-orange-600 transition-colors" />
 <input
 type="text"
 placeholder="Tìm kiếm..."
 className="w-48 md:w-72 bg-white border border-stone-200 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-600/10 focus:border-stone-900 transition-all font-medium placeholder:text-stone-400"
 />
 </div>

 <div className="flex items-center gap-3 md:gap-4">
 <div className="relative" ref={dropdownRef}>
 <button 
 onClick={() => setShowNotifications(!showNotifications)}
 className="p-2 text-stone-500 hover:bg-white hover:shadow-sm rounded-xl relative transition-all border border-transparent hover:border-stone-200"
 >
 <Bell className="w-4.5 h-4.5" />
 {unreadCount > 0 && (
 <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
 )}
 </button>

 {showNotifications && (
 <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-sm border border-stone-100 overflow-hidden animate-in fade-in slide-in- duration-300 z-50">
 <div className="p-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-stone-900">{'Thông báo'}</h3>
 {unreadCount > 0 && (
 <span className="bg-[#EAE7DF] text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} {'mới'}</span>
 )}
 </div>
 <div className="flex items-center gap-2">
 <button onClick={markAllAsRead} className="text-stone-400 hover:text-orange-700 transition-colors" title={'Đánh dấu tất cả đã đọc'}>
 <CheckCheck className="w-4 h-4" />
 </button>
 <button onClick={clearAll} className="text-stone-400 hover:text-red-600 transition-colors" title={'Xóa tất cả'}>
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 
 <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
 {notifications.length === 0 ? (
 <div className="p-8 text-center text-stone-400">
 <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
 <p className="text-sm">{'Không có thông báo nào'}</p>
 </div>
 ) : (
 <div className="divide-y divide-stone-50">
 {notifications.map(notif => (
 <div 
 key={notif.id} 
 className={`p-4 hover:bg-stone-50/80 transition-colors cursor-pointer flex gap-3 ${notif.isRead ? 'opacity-70' : 'bg-[#F2F0E9]/30'}`}
 onClick={() => markAsRead(notif.id)}
 >
 <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-stone-800'}`} />
 <div className="flex-1 min-w-0">
 <h4 className={`text-sm tracking-tight ${notif.isRead ? 'font-medium text-stone-700' : 'font-bold text-stone-900'}`}>{notif.title}</h4>
 <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
 <span className="text-[10px] text-stone-400 mt-2 block w-full">
 {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: vi })}
 </span>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 
 <div className="flex items-center gap-3 border-l border-stone-200 pl-4 md:pl-8">
 <Link to="/profile" className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-stone-500 border border-stone-200 shadow-sm hover:border-stone-900 hover:text-orange-600 transition-all hover:scale-105 active:scale-95">
 <User className="w-5 h-5" />
 </Link>
 </div>
 </div>
 </div>
 </header>
 );
}
