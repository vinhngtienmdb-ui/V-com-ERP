import React from 'react';
import { Lock, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AccessDenied() {
 const { signOut, user } = useAuth();

 return (
 <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-md p-7 space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h1 className="font-sans tracking-tight text-2xl font-black text-slate-900 leading-tight">Yêu Cầu Xác Thực Nhân Sự</h1>
          <p className="text-slate-600 text-xs leading-relaxed">
            Chào <span className="font-bold text-slate-900">{user?.displayName}</span>, tài khoản của bạn chưa được cấp quyền truy cập hệ thống quản trị VComm ERP.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-left flex gap-3">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 font-medium leading-relaxed">
            Vui lòng liên hệ bộ phận Quản trị hệ thống (IT) để được cấp quyền cho email <span className="font-bold">{user?.email}</span> vào danh bạ nhân sự chính thức của Công ty CP Thương mại điện tử VComm.
          </p>
        </div>

        <button 
          onClick={() => signOut()}
          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất & Đổi tài khoản
        </button>
      </div>
 </div>
 );
}
