import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, X, Check, CheckCheck, Trash2, Eye, EyeOff, LayoutTemplate } from 'lucide-react';
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
 const [showViewSettings, setShowViewSettings] = useState(false);
 const [hideCharts, setHideCharts] = useState(false);
 const [hideTables, setHideTables] = useState(false);
 const viewSettingsRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
   if (hideCharts) {
     document.body.classList.add('hide-app-charts');
   } else {
     document.body.classList.remove('hide-app-charts');
   }
 }, [hideCharts]);

 useEffect(() => {
   if (hideTables) {
     document.body.classList.add('hide-app-tables');
   } else {
     document.body.classList.remove('hide-app-tables');
   }
 }, [hideTables]);

 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 
      if (viewSettingsRef.current && !viewSettingsRef.current.contains(event.target as Node)) {
        setShowViewSettings(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 setShowNotifications(false);
 }
 }
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);
 
 return (
 <header className="h-20 px-4 md:px-10 flex items-center justify-between sticky top-0 z-50 bg-[#F9FAFB]/95 backdrop-blur-md border-b border-slate-300/50">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
 {'Chào buổi sáng'}, {staffInfo?.name || ('Quản trị hệ thống')}
 </h1>
 <p className="text-[11px] md:text-xs text-slate-600 font-medium mt-1">
 {`Hệ thống vận hành ổn định. Có ${unreadCount} thông báo mới.`}
 </p>
 </div>

 <div className="flex items-center gap-4 md:gap-8">
 <div className="relative group hidden sm:block">
 <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-orange-600 transition-colors" />
 <input
 type="text"
 placeholder="Tìm kiếm..."
 className="w-48 md:w-72 bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-600/10 focus:border-slate-900 transition-all font-medium placeholder:text-slate-500"
 />
 </div>

 <div className="flex items-center gap-3 md:gap-4">
 
        {/* View Settings */}
        <div className="relative" ref={viewSettingsRef}>
          <button 
            onClick={() => setShowViewSettings(!showViewSettings)}
            className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-xl relative transition-all border border-transparent hover:border-slate-300"
            title="Tùy chỉnh giao diện Bảng/Biểu"
          >
            <LayoutTemplate className="w-4.5 h-4.5" />
          </button>

          {showViewSettings && (
            <div className="absolute right-0 mt-3 w-64 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in- duration-300 z-50">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
                <h3 className="font-bold text-slate-900">Hiển thị Bảng/Biểu</h3>
              </div>
              <div className="p-4 space-y-4">
                 <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                       {hideCharts ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-orange-600" />}
                       Biểu đồ hệ thống
                    </span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${!hideCharts ? 'bg-orange-600' : 'bg-slate-300'}`}>
                       <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${!hideCharts ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <input type="checkbox" className="sr-only" checked={!hideCharts} onChange={() => setHideCharts(!hideCharts)} />
                 </label>

                 <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                       {hideTables ? <EyeOff className="w-4 h-4 text-slate-500" /> : <Eye className="w-4 h-4 text-blue-600" />}
                       Bảng dữ liệu báo cáo
                    </span>
                    <div className={`w-10 h-5 rounded-full p-0.5 transition-colors ${!hideTables ? 'bg-blue-600' : 'bg-slate-300'}`}>
                       <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${!hideTables ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                    <input type="checkbox" className="sr-only" checked={!hideTables} onChange={() => setHideTables(!hideTables)} />
                 </label>
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={dropdownRef}>
 <button 
 onClick={() => setShowNotifications(!showNotifications)}
 className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-xl relative transition-all border border-transparent hover:border-slate-300"
 >
 <Bell className="w-4.5 h-4.5" />
 {unreadCount > 0 && (
 <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
 )}
 </button>

 {showNotifications && (
 <div className="absolute right-0 mt-3 w-80 bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in- duration-300 z-50">
 <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-slate-900">{'Thông báo'}</h3>
 {unreadCount > 0 && (
 <span className="bg-[#EAE7DF] text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} {'mới'}</span>
 )}
 </div>
 <div className="flex items-center gap-2">
 <button onClick={markAllAsRead} className="text-slate-500 hover:text-orange-700 transition-colors" title={'Đánh dấu tất cả đã đọc'}>
 <CheckCheck className="w-4 h-4" />
 </button>
 <button onClick={clearAll} className="text-slate-500 hover:text-red-600 transition-colors" title={'Xóa tất cả'}>
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 
 <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
 {notifications.length === 0 ? (
 <div className="p-8 text-center text-slate-500">
 <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
 <p className="text-sm">{'Không có thông báo nào'}</p>
 </div>
 ) : (
 <div className="divide-y divide-slate-50">
 {notifications.map(notif => (
 <div 
 key={notif.id} 
 className={`p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex gap-3 ${notif.isRead ? 'opacity-70' : 'bg-slate-100/30'}`}
 onClick={() => markAsRead(notif.id)}
 >
 <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-slate-800'}`} />
 <div className="flex-1 min-w-0">
 <h4 className={`text-sm tracking-tight ${notif.isRead ? 'font-medium text-slate-800' : 'font-bold text-slate-900'}`}>{notif.title}</h4>
 <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
 <span className="text-[10px] text-slate-500 mt-2 block w-full">
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
 
 <div className="flex items-center gap-3 border-l border-slate-300 pl-4 md:pl-8">
 <Link to="/profile" className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-600 border border-slate-300 shadow-sm hover:border-slate-900 hover:text-orange-600 transition-all hover:scale-105 active:scale-95">
 <User className="w-5 h-5" />
 </Link>
 </div>
 </div>
 </div>
 </header>
 );
}
