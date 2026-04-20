import React from 'react';
import { useStore } from '../context/StoreContext';
import { Store, Building2, MapPin, ChevronRight, Home, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function StoreSelector() {
  const { activeStore, setActiveStore, availableStores } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const handleGoBack = () => {
    navigate('/');
  };

  // Only render if logged in but no store is selected yet.
  if (activeStore) return null;

  return (
    <div className="h-full bg-slate-900 rounded-3xl flex items-center justify-center p-6 selection-overlay animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative shadow-2xl">
      <div className="max-w-4xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-10">
        <div className="md:w-[45%] bg-[#0F172A] p-12 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10 flex flex-col items-start gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20 backdrop-blur-md">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Xin chào, {user?.displayName || 'User'}!</h2>
              <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
                Bạn đang được cấp quyền làm việc tại nhiều chi nhánh POS. Vui lòng chọn cửa hàng/chi nhánh bạn muốn truy cập bán hàng.
              </p>
            </div>
          </div>
          
          <div className="relative z-10 mt-12 space-y-4">
             <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                <Building2 className="w-8 h-8 text-blue-400" />
                <div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Tài khoản Doanh nghiệp</p>
                   <p className="font-bold text-slate-100">V-ERP Corporation</p>
                </div>
             </div>
          </div>
          
          <button 
             onClick={handleGoBack}
             className="relative z-10 mt-12 text-xs font-bold text-slate-500 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-widest"
          >
             <Home className="w-4 h-4" /> Quay lại Bảng Điều Khiển
          </button>
          
          {/* Decorative Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        </div>
        
        <div className="md:w-[55%] bg-slate-50 p-12 flex flex-col h-[500px]">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-200 pb-4">Chọn Chi nhánh / Cửa hàng</h3>
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {availableStores.map((store) => (
              <button
                key={store.id}
                onClick={() => setActiveStore(store)}
                className="w-full text-left bg-white p-5 rounded-2xl border-2 border-transparent hover:border-blue-600 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-bl-3xl -translate-y-full translate-x-full group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <div className="flex items-center justify-between relative z-10">
                  <div className="space-y-1 text-left">
                    <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{store.name}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                       <MapPin className="w-3.5 h-3.5" /> {store.address}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-2 bg-slate-50 px-2 py-0.5 rounded-md inline-block border border-slate-100">
                       Domain: {store.domain}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
