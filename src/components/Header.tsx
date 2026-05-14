import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Eye, EyeOff, LayoutTemplate, Menu, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { navGroups } from '../constants';

const WEEKDAYS_VI = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

function buildPageMap(): Record<string, string> {
  const map: Record<string, string> = { '/': 'Trang chủ' };
  for (const group of navGroups) {
    for (const item of group.items) {
      if (!map[item.path]) {
        map[item.path] = item.label;
      }
    }
  }
  return map;
}

const PAGE_MAP = buildPageMap();

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { staffInfo } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const location = useLocation();

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [showViewSettings, setShowViewSettings] = useState(false);
  const [hideCharts, setHideCharts] = useState(false);
  const [hideTables, setHideTables] = useState(false);
  const viewSettingsRef = useRef<HTMLDivElement>(null);

  const [clock, setClock] = useState('');
  const [dateStr, setDateStr] = useState('');

  // Live clock
  useEffect(() => {
    function tick() {
      const now = new Date();
      const hh = now.getHours().toString().padStart(2, '0');
      const mm = now.getMinutes().toString().padStart(2, '0');
      const ss = now.getSeconds().toString().padStart(2, '0');
      setClock(`${hh}:${mm}:${ss}`);

      const wd = WEEKDAYS_VI[now.getDay()];
      const dd = now.getDate().toString().padStart(2, '0');
      const mo = (now.getMonth() + 1).toString().padStart(2, '0');
      const yy = now.getFullYear();
      setDateStr(`${wd}, ${dd}/${mo}/${yy}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // hideCharts effect
  useEffect(() => {
    if (hideCharts) {
      document.body.classList.add('hide-app-charts');
    } else {
      document.body.classList.remove('hide-app-charts');
    }
  }, [hideCharts]);

  // hideTables effect
  useEffect(() => {
    if (hideTables) {
      document.body.classList.add('hide-app-tables');
    } else {
      document.body.classList.remove('hide-app-tables');
    }
  }, [hideTables]);

  // Click outside to close dropdowns
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

  const currentPage = PAGE_MAP[location.pathname] ?? 'Trang chủ';

  const name = staffInfo?.name ?? 'Quản trị hệ thống';
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(-2)
    .map((w: string) => w[0].toUpperCase())
    .join('');
  const role = (staffInfo as any)?.role ?? '';

  return (
    <header className="h-[52px] px-3 flex items-center justify-between sticky top-0 z-50 bg-white border-b border-slate-200">
      {/* Left side */}
      <div className="flex items-center gap-2">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <Home className="w-4 h-4 text-slate-400 shrink-0" />

        <span className="bg-blue-600 text-white text-xs font-semibold px-2.5 py-1 rounded-md">
          {currentPage}
        </span>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Clock & date */}
        <div className="hidden sm:flex flex-col items-end leading-tight">
          <span className="font-mono text-xs font-semibold text-slate-700">{clock}</span>
          <span className="text-[10px] text-slate-400">{dateStr}</span>
        </div>

        {/* View settings */}
        <div className="relative" ref={viewSettingsRef}>
          <button
            onClick={() => setShowViewSettings(!showViewSettings)}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
            title="Tùy chỉnh giao diện Bảng/Biểu"
          >
            <LayoutTemplate className="w-4 h-4" />
          </button>

          {showViewSettings && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden z-50">
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <h3 className="font-bold text-sm text-slate-900">Hiển thị Bảng/Biểu</h3>
              </div>
              <div className="p-3 space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    {hideCharts ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-blue-600" />}
                    Biểu đồ hệ thống
                  </span>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${!hideCharts ? 'bg-blue-600' : 'bg-slate-300'}`}
                    onClick={() => setHideCharts(!hideCharts)}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${!hideCharts ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="sr-only" checked={!hideCharts} onChange={() => setHideCharts(!hideCharts)} />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    {hideTables ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-blue-600" />}
                    Bảng dữ liệu báo cáo
                  </span>
                  <div
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${!hideTables ? 'bg-blue-600' : 'bg-slate-300'}`}
                    onClick={() => setHideTables(!hideTables)}
                  >
                    <div className={`bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${!hideTables ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                  <input type="checkbox" className="sr-only" checked={!hideTables} onChange={() => setHideTables(!hideTables)} />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Bell / Notifications */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors relative"
            aria-label="Thông báo"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -bottom-0.5 -right-0.5 bg-blue-600 text-white rounded-full min-w-[16px] h-4 text-[9px] flex items-center justify-center px-0.5 font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden z-50">
              <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-900">Thông báo</h3>
                  {unreadCount > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} mới
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={markAllAsRead}
                    className="p-1 text-slate-400 hover:text-blue-600 transition-colors rounded"
                    title="Đánh dấu tất cả đã đọc"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors rounded"
                    title="Xóa tất cả"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[380px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Không có thông báo nào</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${notif.isRead ? 'opacity-70' : 'bg-blue-50/30'}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className={`w-1.5 h-1.5 rounded-full mt-2 shrink-0 ${notif.isRead ? 'bg-transparent' : 'bg-blue-600'}`} />
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm ${notif.isRead ? 'font-medium text-slate-700' : 'font-semibold text-slate-900'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{notif.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
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

        {/* User avatar */}
        <Link
          to="/profile"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {initials || 'U'}
          </div>
          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[100px]">{name}</span>
            {role && <span className="text-[10px] text-slate-400 truncate max-w-[100px]">{role}</span>}
          </div>
        </Link>
      </div>
    </header>
  );
}
