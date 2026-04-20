import React from 'react';
import { Search, Bell, User } from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export function Header() {
  const { staffInfo } = useAuth();
  
  return (
    <header className="h-20 px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md">
      <div className="header-title">
        <h1 className="text-xl md:text-2xl font-semibold text-[#111827]">Chào buổi sáng, {staffInfo?.name || 'Nhân viên'}</h1>
        <p className="text-xs md:text-sm text-[#6B7280] mt-1 hidden sm:block">Hệ thống vận hành ổn định. Có 12 đơn hàng mới cần xử lý.</p>
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

        <button className="p-2 text-slate-500 hover:bg-white hover:shadow-sm rounded-lg relative transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#F9FAFB]"></span>
        </button>
        
        <div className="flex items-center gap-3 border-l border-[#E5E7EB] pl-6">
          <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center text-slate-600 border border-[#E5E7EB] shadow-sm">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
