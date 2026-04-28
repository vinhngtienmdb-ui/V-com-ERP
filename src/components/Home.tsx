import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Search, 
  Star, 
  History,
  LayoutGrid,
  Menu
} from 'lucide-react';
import { cn } from '../lib/utils';
import { navGroups } from '../constants';

export function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const filteredGroups = navGroups.map(group => ({
    ...group,
    items: group.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.items.length > 0);

  return (
    <div className="flex flex-col h-full gap-8 animate-in fade-in duration-700 pb-20 pt-2">
      {/* Hero / Search Section */}
      <div className="relative overflow-hidden bg-[#0F172A] rounded-2xl p-8 md:p-10 text-white border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
           <LayoutGrid className="w-64 h-64 rotate-12" />
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
            <span className="text-xs font-semibold text-slate-400">Hệ thống vận hành ổn định. Có <span className="text-white">2 thông báo mới</span></span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
            Trung tâm Điều hành <span className="text-blue-500">VComm ERP</span>
          </h1>
          
          <p className="text-slate-400 text-sm font-medium mb-8 max-w-xl leading-relaxed">
            Hệ thống quản trị doanh nghiệp hợp nhất. Truy cập nhanh tất cả các module vận hành từ một giao diện tập trung.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative group flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
              <input 
                type="text"
                placeholder="Tìm kiếm module hoặc chức năng..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1E293B]/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all backdrop-blur-md"
              />
            </div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl backdrop-blur-md">
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vừa truy cập: Dashboard, PIM, Đơn hàng</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Modules */}
      <div className="space-y-12">
        {filteredGroups.map((group, idx) => (
          <div key={idx} className="space-y-6">
            <div className="flex items-center gap-4">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">
                {group.title}
              </h2>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="group relative bg-white border border-slate-200 rounded-2xl p-5 text-left hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden border-b-2 hover:border-b-blue-600 active:translate-y-0"
                >
                  <div className="relative z-10">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
                      "bg-slate-50 text-slate-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200"
                    )}>
                      <item.icon className="w-5 h-5" />
                    </div>
                    
                    <h3 className="text-sm font-bold text-slate-900 mb-1 tracking-tight group-hover:text-blue-600 transition-colors">
                      {item.label}
                    </h3>
                    
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed line-clamp-2 italic">
                      {item.description || 'Module quản lý nghiệp vụ hệ thống.'}
                    </p>
                    
                    <div className="mt-4 flex items-center gap-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
                      <span>Truy cập</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Decorative background elements */}
                  <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-500 pointer-events-none">
                     <item.icon className="w-32 h-32 -mr-8 -mt-8" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}

        {filteredGroups.length === 0 && (
          <div className="py-20 text-center space-y-4">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-400">
               <Search className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Không tìm thấy module phù hợp</h3>
            <p className="text-slate-500">Thử tìm kiếm với từ khóa khác hoặc duyệt danh mục bên dưới.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-blue-600 font-bold hover:underline"
            >
              Xóa tìm kiếm
            </button>
          </div>
        )}
      </div>

      {/* Footer Support */}
      <footer className="mt-12 pt-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-6">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Hỗ trợ kỹ thuật: 1900 8888</div>
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Version: 2.5.0-Enterprise</div>
           </div>
           <div className="flex gap-4">
              <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">Hướng dẫn sử dụng</button>
              <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors">Báo cáo sự cố</button>
           </div>
        </div>
      </footer>
    </div>
  );
}
