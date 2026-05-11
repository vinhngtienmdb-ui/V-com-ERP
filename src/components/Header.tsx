import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, User, CheckCheck, Trash2, Eye, EyeOff, LayoutTemplate, WifiOff, Activity, X, Clock, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { CommandPalette } from './CommandPalette';
import { ActivityFeed } from './ActivityFeed';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

export function Header() {
  const isOnline = useNetworkStatus();
  const { staffInfo } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const [showViewSettings, setShowViewSettings] = useState(false);
  const [hideCharts, setHideCharts] = useState(false);
  const [hideTables, setHideTables] = useState(false);
  const [now, setNow] = useState(new Date());
  const dropdownRef = useRef<HTMLDivElement>(null);
  const viewSettingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { document.body.classList.toggle('hide-app-charts', hideCharts); }, [hideCharts]);
  useEffect(() => { document.body.classList.toggle('hide-app-tables', hideTables); }, [hideTables]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (viewSettingsRef.current && !viewSettingsRef.current.contains(event.target as Node)) setShowViewSettings(false);
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' });
  const initials = (staffInfo?.name || 'U').split(' ').map((w: string) => w[0]).slice(-2).join('').toUpperCase();

  return (
    <>
      {!isOnline && (
        <div className="sticky top-0 z-[60] bg-red-500 text-white px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold">
          <WifiOff className="w-3.5 h-3.5 shrink-0" />
          Mất kết nối mạng — Dữ liệu có thể chưa được cập nhật
        </div>
      )}

      <header className="h-14 flex items-center sticky top-0 z-50 bg-white border-b border-slate-200 shrink-0 px-4 gap-3">

        {/* Time & Date */}
        <div className="flex items-center gap-3 shrink-0">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-sm font-semibold tabular-nums">{timeStr}</span>
          </div>
          <div className="hidden md:flex items-center gap-1.5 text-slate-500">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs">{dateStr}</span>
          </div>
        </div>

        <div className="w-px h-5 bg-slate-200 shrink-0" />

        {/* Search */}
        <div className="flex-1">
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 h-9 px-3 bg-slate-50 border border-slate-200 hover:border-slate-300 hover:bg-white transition-all text-slate-400 hover:text-slate-600 w-full max-w-sm rounded-xl"
          >
            <Search className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left text-sm text-slate-400">Tìm kiếm...</span>
            <span className="hidden md:flex items-center gap-0.5 border border-slate-200 px-1.5 py-0.5 text-xs text-slate-400 bg-white rounded-md">
              Ctrl K
            </span>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0">

          {/* View settings */}
          <div className="relative" ref={viewSettingsRef}>
            <button
              onClick={() => setShowViewSettings(!showViewSettings)}
              title="Hiển thị Bảng/Biểu"
              className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <LayoutTemplate className="w-4 h-4" />
            </button>
            {showViewSettings && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200 shadow-xl rounded-xl z-50">
                <div className="px-4 py-3 border-b border-slate-100">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Hiển thị lớp dữ liệu</span>
                </div>
                <div className="p-3 space-y-3">
                  {[
                    { label: 'Biểu đồ hệ thống', value: hideCharts, onChange: () => setHideCharts(!hideCharts) },
                    { label: 'Bảng dữ liệu', value: hideTables, onChange: () => setHideTables(!hideTables) },
                  ].map(item => (
                    <label key={item.label} className="flex items-center justify-between cursor-pointer">
                      <span className="text-sm text-slate-700 flex items-center gap-2">
                        {item.value ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5 text-slate-500" />}
                        {item.label}
                      </span>
                      <div onClick={item.onChange} className={`w-9 h-5 rounded-full border transition-colors relative cursor-pointer ${!item.value ? 'bg-blue-500 border-blue-500' : 'bg-slate-200 border-slate-300'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${!item.value ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Activity */}
          <button
            onClick={() => setShowActivity(true)}
            title="Hoạt động hệ thống"
            className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="w-9 h-9 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-xl z-50 max-w-[calc(100vw-1rem)]">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-700">Thông báo</span>
                    {unreadCount > 0 && (
                      <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{unreadCount} mới</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={markAllAsRead} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors" title="Đánh dấu đã đọc">
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={clearAll} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa tất cả">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="max-h-[360px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                      <Bell className="w-8 h-8 opacity-30" />
                      <p className="text-sm">Không có thông báo</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map(notif => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 hover:bg-slate-50 cursor-pointer flex gap-3 transition-colors ${notif.isRead ? 'opacity-60' : ''}`}
                          onClick={() => markAsRead(notif.id)}
                        >
                          <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-blue-500'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm leading-snug ${notif.isRead ? 'font-normal text-slate-600' : 'font-semibold text-slate-900'}`}>{notif.title}</p>
                            <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                            <span className="text-xs text-slate-400 mt-1 block">
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

          {/* Profile */}
          <Link
            to="/profile"
            className="flex items-center gap-2 h-9 px-3 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <div className="w-7 h-7 bg-blue-500 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-700 leading-none">{staffInfo?.name || 'Quản trị viên'}</p>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{staffInfo?.role || 'admin'}</p>
            </div>
          </Link>
        </div>
      </header>

      {showSearch && <CommandPalette onClose={() => setShowSearch(false)} />}
      {showActivity && <ActivityFeed onClose={() => setShowActivity(false)} />}
    </>
  );
}
