import React from 'react';
import { Lock, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AccessDenied() {
  const { signOut, user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-lg border border-slate-200 shadow-xl p-10 space-y-8">
        <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-lg flex items-center justify-center mx-auto animate-pulse">
           <ShieldAlert className="w-10 h-10" />
        </div>
        
        <div className="space-y-3">
           <h1 className="text-2xl font-black text-slate-900 leading-tight">Yêu cầu xác thực Nhân sự</h1>
           <p className="text-slate-500 text-sm leading-relaxed">
             Chào <span className="font-bold text-slate-900">{user?.displayName}</span>, tài khoản của bạn chưa được cấp quyền truy cập hệ thống quản trị VComm ERP.
           </p>
        </div>

        <div className="bg-amber-50 border border-amber-100 rounded-lg p-6 text-left flex gap-4">
           <Lock className="w-5 h-5 text-amber-600 shrink-0" />
           <p className="text-[11px] text-amber-800 font-medium leading-relaxed">
             Vui lòng liên hệ với bộ phận Quản trị hệ thống (IT) để được thêm email <span className="font-bold">{user?.email}</span> vào danh sách nhân sự chính thức.
           </p>
        </div>

        <button 
          onClick={() => signOut()}
          className="w-full py-4 bg-slate-900 text-white rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-3"
        >
           <LogOut className="w-4 h-4" /> Đăng xuất & Đổi tài khoản
        </button>
      </div>
    </div>
  );
}
