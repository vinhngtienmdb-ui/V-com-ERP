import React from 'react';

export function LoadingScreen() {
 return (
 <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6">
 <div className="space-y-6 text-center">
 <div className="relative w-20 h-20 mx-auto">
 <div className="absolute inset-0 border-4 border-primary-600/20 rounded-full" />
 <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
 </div>
 <div className="space-y-2">
 <h2 className="text-xl font-bold text-[#FAF9F5] tracking-tight">Đang tải VComm ERP...</h2>
 <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">Đang thiết lập kết nối an toàn</p>
 </div>
 </div>
 </div>
 );
}
