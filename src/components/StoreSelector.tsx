import React, { useState, useMemo } from 'react';
import { useStore } from '../context/StoreContext';
import { Store, Building2, MapPin, ChevronRight, Home, CheckCircle2, Lock, ArrowRight, UserCircle2, ShieldCheck, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function StoreSelector() {
  const { activeStore, setActiveStore, availableStores } = useStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Extract unique companies from available stores
  const companies = useMemo(() => {
    const map = new Map<string, string>();
    availableStores.forEach(s => {
      if (!map.has(s.companyId)) {
        map.set(s.companyId, s.companyName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [availableStores]);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies.length > 0 ? companies[0].id : '');

  const filteredStores = useMemo(() => {
    return availableStores.filter(s => s.companyId === selectedCompanyId);
  }, [availableStores, selectedCompanyId]);

  const handleGoBack = () => {
    navigate('/');
  };

  const [selectedStoreForPin, setSelectedStoreForPin] = useState<any | null>(null);
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);

  // Only render if logged in but no store is selected yet.
  if (activeStore) return null;

  const handleStoreClick = (store: any) => {
    setSelectedStoreForPin(store);
    setPin('');
    setIsError(false);
  };

  const handlePinInput = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setIsError(false);
      
      if (newPin.length === 4) {
        // Authenticate (Mock)
        setTimeout(() => {
          if (newPin === '1234' || newPin === '0000') { // accept any 4-digit demo PIN for now, or just validate non empty
            setActiveStore(selectedStoreForPin);
          } else {
            // For demo purposes, we accept any PIN actually, but let's encourage '1234'
            setActiveStore(selectedStoreForPin);
          }
        }, 300);
      }
    }
  };

  const handleDeletePin = () => {
    setPin(pin.slice(0, -1));
  };

  return (
    <div className="h-full bg-[#0F172A] flex items-center justify-center selection-overlay animate-in fade-in zoom-in-95 duration-500 overflow-hidden relative font-sans w-full absolute inset-0 z-50">
      
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,transparent_0%,#0F172A_100%)]" />
      </div>

      <div className="max-w-6xl w-full mx-6 bg-white/5 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl flex relative z-10 h-[700px] overflow-hidden">
        
        {/* Left Side - Branding */}
        <div className="w-[40%] bg-[#0B1121]/80 p-12 flex flex-col justify-between relative border-r border-white/5">
          <div className="relative z-10 space-y-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 border border-white/10">
                <Store className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">VComm<span className="text-orange-500">POS</span></h2>
            </div>
            
            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-white leading-tight">
                {selectedStoreForPin ? "Xác thực truy cập" : "Nền tảng bán hàng điểm mua"}
              </h1>
              <p className="text-stone-400 text-sm leading-relaxed max-w-sm">
                {selectedStoreForPin 
                  ? "Vui lòng nhập mã PIN cá nhân (4 số) của bạn để truy cập phiên làm việc trên máy POS này."
                  : "Hệ thống POS đa kênh thông minh. Chọn cửa hàng và chi nhánh của bạn để bắt đầu phiên làm việc."}
              </p>
            </div>
            
            {!selectedStoreForPin && (
              <div className="space-y-4 pt-8">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="p-3 bg-white/10 rounded-xl"><Zap className="w-6 h-6 text-amber-400" /></div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Đồng bộ toàn thời gian</h4>
                    <p className="text-xs text-stone-400 mt-1">Đơn hàng, Tồn kho & Doanh thu</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="p-3 bg-white/10 rounded-xl"><ShieldCheck className="w-6 h-6 text-emerald-400" /></div>
                  <div>
                    <h4 className="text-white font-bold text-sm">Bảo mật giao dịch tuyệt đối</h4>
                    <p className="text-xs text-stone-400 mt-1">Tiêu chuẩn mã hóa cấp doanh nghiệp</p>
                  </div>
                </div>
              </div>
            )}
            
            {selectedStoreForPin && (
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl mt-8 animate-in slide-in-from-left-8 duration-500">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full border-2 border-indigo-500 p-1">
                    <img src={`https://ui-avatars.com/api/?name=${user?.displayName || 'User'}&background=312e81&color=fff`} className="w-full h-full rounded-full" alt="User" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Ca làm việc hiện tại</p>
                    <p className="text-white font-bold text-lg">{user?.displayName || 'Nhân viên Bán hàng'}</p>
                  </div>
                </div>
                <div className="space-y-2 pt-4 border-t border-white/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Chi nhánh</span>
                    <span className="text-white font-semibold flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{selectedStoreForPin.name}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-stone-400">Địa chỉ</span>
                    <span className="text-white font-semibold truncate max-w-[150px]">{selectedStoreForPin.address}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Vị trí trạm</span>
                    <span className="text-emerald-400 font-semibold">POS-01 (Quầy chính)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleGoBack}
            className="relative z-10 w-fit text-[11px] font-bold text-stone-500 hover:text-white flex items-center gap-2 transition-colors uppercase tracking-[0.15em] bg-white/5 hover:bg-white/10 px-5 py-3 rounded-xl backdrop-blur-sm"
          >
            <Home className="w-4 h-4" /> Về trang quản trị ERP
          </button>
        </div>
        
        {/* Right Side - Interactive Area */}
        <div className="w-[60%] bg-white p-12 flex flex-col h-full relative">
          {!selectedStoreForPin ? (
            <div className="flex flex-col h-full animate-in fade-in duration-500">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Chọn Chi Nhánh
                  </h3>
                  <p className="text-stone-500 text-sm">Hiển thị các chi nhánh bạn có quyền truy cập</p>
                </div>
                <div className="w-64">
                  <select
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="w-full appearance-none bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all cursor-pointer"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 auto-rows-max overflow-y-auto custom-scrollbar pr-2 pb-4">
                {filteredStores.length === 0 ? (
                  <div className="col-span-2 flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50">
                    <div className="w-16 h-16 bg-stone-200 text-stone-400 rounded-2xl flex items-center justify-center mb-4"><MapPin className="w-8 h-8" /></div>
                    <p className="text-stone-500 font-medium">Không tìm thấy chi nhánh nào hệ thống.</p>
                    <p className="text-xs text-stone-400 mt-2">Vui lòng liên hệ Quản trị viên để được cấp quyền.</p>
                  </div>
                ) : (
                  filteredStores.map((store) => (
                    <button
                      key={store.id}
                      onClick={() => handleStoreClick(store)}
                      className="text-left bg-white p-6 rounded-3xl border-2 border-stone-100 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-600/10 transition-all group relative overflow-hidden flex flex-col justify-between min-h-[160px]"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-[60px] -translate-y-full translate-x-full group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-10 h-10 bg-stone-100 group-hover:bg-indigo-600 text-stone-500 group-hover:text-white rounded-xl flex items-center justify-center transition-colors">
                            <Store className="w-5 h-5" />
                          </div>
                          <ChevronRight className="w-5 h-5 text-stone-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                        </div>
                        <h4 className="text-lg font-black text-stone-900 group-hover:text-indigo-900 transition-colors leading-tight">{store.name}</h4>
                        <p className="text-xs text-stone-500 flex items-start gap-1.5 mt-2 line-clamp-2 leading-relaxed">
                          <MapPin className="w-4 h-4 text-stone-400 shrink-0" /> {store.address}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full animate-in slide-in-from-right-8 duration-500 perspective-1000">
              
              <button 
                onClick={() => setSelectedStoreForPin(null)}
                className="absolute top-8 left-8 text-xs font-bold text-stone-500 hover:text-stone-900 flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full transition-all hover:pr-5 group"
              >
                <ArrowRight className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" /> Đổi chi nhánh
              </button>

              <div className="flex flex-col items-center max-w-sm w-full mx-auto space-y-10">
                <div className="space-y-4 w-full flex flex-col items-center">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-2 shadow-inner">
                    <Lock className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl font-black text-stone-900">Bảo mật trạm POS</h3>
                  <div className="flex gap-4">
                    {[0, 1, 2, 3].map((index) => (
                      <div 
                        key={index}
                        className={cn(
                          "w-14 h-16 rounded-2xl flex items-center justify-center text-4xl font-bold bg-stone-50 border-2 transition-all",
                          pin.length > index ? "border-indigo-600 text-indigo-600 shadow-sm shadow-indigo-600/20" : "border-stone-200 text-transparent",
                          isError && "border-red-500 text-red-500"
                        )}
                      >
                        {pin.length > index ? "•" : ""}
                      </div>
                    ))}
                  </div>
                  {isError && <p className="text-red-500 text-xs font-bold mt-2 animate-bounce">Mã PIN không đúng, thử lại!</p>}
                </div>

                <div className="grid grid-cols-3 gap-3 w-full">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                    <button
                      key={num}
                      onClick={() => handlePinInput(num)}
                      className="h-16 rounded-2xl bg-white border border-stone-200 text-3xl font-light text-stone-800 hover:bg-stone-50 hover:border-indigo-200 hover:text-indigo-600 active:scale-95 transition-all shadow-sm flex items-center justify-center leading-none"
                    >
                      {num}
                    </button>
                  ))}
                  <div className="h-16" /> {/* Empty slot */}
                  <button
                    onClick={() => handlePinInput('0')}
                    className="h-16 rounded-2xl bg-white border border-stone-200 text-3xl font-light text-stone-800 hover:bg-stone-50 hover:border-indigo-200 hover:text-indigo-600 active:scale-95 transition-all shadow-sm flex items-center justify-center leading-none"
                  >
                    0
                  </button>
                  <button
                    onClick={handleDeletePin}
                    className="h-16 rounded-2xl bg-stone-100 border border-stone-200 text-stone-500 text-[10px] uppercase tracking-widest font-bold hover:bg-stone-200 hover:text-stone-800 active:scale-95 transition-all flex items-center justify-center"
                  >
                    Xóa
                  </button>
                </div>
                
                <p className="text-xs text-stone-400 font-medium text-center">
                  Dùng mã PIN 4 số <span className="text-stone-600 font-bold bg-stone-100 px-2 py-0.5 rounded">1234</span> cho mục đích thử nghiệm
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
