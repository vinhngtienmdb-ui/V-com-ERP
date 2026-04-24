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
    <header className="h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-50 bg-slate-50/80 backdrop-blur-md">
      <div className="header-title">
        <h1 className="text-xl md:text-2xl font-semibold text-[#111827]">
          {language === 'vi' ? 'Chào buổi sáng' : 'Good morning'}, {staffInfo?.name || (language === 'vi' ? 'Nhân viên' : 'Staff')}
        </h1>
        <p className="text-xs md:text-sm text-[#6B7280] mt-1 hidden sm:block">
          {language === 'vi' ? `Hệ thống vận hành ổn định. Có ${unreadCount} thông báo mới.` : `System running smoothly. You have ${unreadCount} new notifications.`}
        </p>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500" />
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="w-64 bg-white border border-[#E5E7EB] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all border-solid"
          />
        </div>

        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:bg-white hover:shadow-sm rounded-lg relative transition-all"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#F9FAFB]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300 z-50">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900">{language === 'vi' ? 'Thông báo' : 'Notifications'}</h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{unreadCount} {language === 'vi' ? 'mới' : 'new'}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={markAllAsRead} className="text-slate-400 hover:text-blue-600 transition-colors" title={language === 'vi' ? 'Đánh dấu tất cả đã đọc' : 'Mark all as read'}>
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button onClick={clearAll} className="text-slate-400 hover:text-red-600 transition-colors" title={language === 'vi' ? 'Xóa tất cả' : 'Clear all'}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">{language === 'vi' ? 'Không có thông báo nào' : 'No notifications'}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex gap-3 ${notif.isRead ? 'opacity-70' : 'bg-blue-50/30'}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-blue-500'}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm tracking-tight ${notif.isRead ? 'font-medium text-slate-700' : 'font-bold text-slate-900'}`}>{notif.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-2 block w-full">
                            {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true, locale: language === 'vi' ? vi : enUS })}
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
        
        <div className="flex items-center gap-3 border-l border-[#E5E7EB] pl-6">
          <Link to="/profile" className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-600 border border-[#E5E7EB] shadow-sm hover:border-blue-500 hover:text-blue-500 transition-all">
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
