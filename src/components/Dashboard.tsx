import React, { useState, useEffect } from 'react';
import { 
  Bar, 
  BarChart,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { 
  DollarSign, 
  ShoppingCart, 
  Eye,
  Store,
  ArrowUpRight,
  ShieldCheck,
  Package,
  ListOrdered,
  Users,
  Settings2,
  LayoutDashboard,
  CheckCircle2,
  X,
  Activity,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  TrendingDown,
  TrendingUp,
  Wallet,
  Banknote,
  Sparkles,
  Zap,
  Bot,
  BrainCircuit,
  Volume2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, limit } from 'firebase/firestore';

const data = [
  { name: 'T1', gmv: 4.5, traffic: 120000 },
  { name: 'T2', gmv: 5.2, traffic: 145000 },
  { name: 'T3', gmv: 4.8, traffic: 132000 },
  { name: 'T4', gmv: 6.1, traffic: 168000 },
  { name: 'T5', gmv: 5.5, traffic: 155000 },
  { name: 'T6', gmv: 6.7, traffic: 192000 },
];

const categoryData = [
  { name: 'Thời trang', value: 35 },
  { name: 'Điện tử', value: 25 },
  { name: 'Mẹ & Bé', value: 15 },
  { name: 'Gia dụng', value: 15 },
  { name: 'Khác', value: 10 },
];
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const hourlyData = [
  { time: '08:00', orders: 120 },
  { time: '10:00', orders: 250 },
  { time: '12:00', orders: 480 },
  { time: '14:00', orders: 390 },
  { time: '16:00', orders: 420 },
  { time: '18:00', orders: 650 },
  { time: '20:00', orders: 810 },
  { time: '22:00', orders: 350 },
];

const financeData = [
  { month: 'T10', revenue: 450, expense: 280, profit: 170 },
  { month: 'T11', revenue: 520, expense: 310, profit: 210 },
  { month: 'T12', revenue: 780, expense: 420, profit: 360 },
  { month: 'T1', revenue: 610, expense: 340, profit: 270 },
  { month: 'T2', revenue: 550, expense: 300, profit: 250 },
  { month: 'T3', revenue: 670, expense: 350, profit: 320 },
];

const cashFlowData = [
  { day: 'T2', in: 120, out: 45 },
  { day: 'T3', in: 145, out: 60 },
  { day: 'T4', in: 110, out: 95 },
  { day: 'T5', in: 168, out: 55 },
  { day: 'T6', in: 192, out: 80 },
  { day: 'T7', in: 255, out: 40 },
  { day: 'CN', in: 210, out: 30 },
];

const sellerData = [
  { name: 'Mobile World', gmv: '450tr', rating: 4.8 },
  { name: 'Fashion Hub', gmv: '280tr', rating: 4.6 },
  { name: 'Eco Mart', gmv: '190tr', rating: 4.9 },
  { name: 'Tech Store', gmv: '150tr', rating: 4.2 },
];

const StatCard = ({ title, value, change, icon: Icon, trend, subValue }: any) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden">
    <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity duration-500 group-hover:scale-110 pointer-events-none">
       <Icon className="w-24 h-24 -mr-6 -mt-6 text-slate-900" />
    </div>
    <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 bg-slate-50 text-slate-600 rounded-xl group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors border border-slate-100 group-hover:border-blue-100 shadow-sm">
            <Icon className="w-5 h-5" />
          </div>
          <div className={cn(
            "text-xs flex items-center gap-1 font-bold px-2.5 py-1 rounded-full border shadow-sm",
            trend === 'up' ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200"
          )}>
            {trend === 'up' ? '↗' : '↘'} {change}%
          </div>
        </div>
        <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider mb-1.5">{title}</div>
        <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
        {subValue && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            {subValue}
          </div>
        )}
    </div>
  </div>
);

const QuickActionCard = ({ title, icon: Icon, onClick, color, description }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "relative group overflow-hidden p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl text-left",
      color === 'bg-blue-600' ? "bg-gradient-to-br from-blue-600 to-blue-800 border-blue-500 hover:shadow-blue-500/30" : 
      color === 'bg-emerald-600' ? "bg-gradient-to-br from-emerald-500 to-emerald-700 border-emerald-500 hover:shadow-emerald-500/30" : 
      "bg-gradient-to-br from-slate-800 to-slate-950 border-slate-700 hover:shadow-slate-900/30"
    )}
  >
    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300 pointer-events-none"></div>
    <div className="relative z-10 flex flex-col h-full">
      <div className="p-3 bg-white/20 rounded-xl w-fit mb-4 backdrop-blur-md group-hover:scale-110 group-hover:-rotate-3 transition-transform shadow-sm border border-white/10">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="mt-auto relative z-10">
        <h3 className="text-white font-bold tracking-tight text-lg mb-1 group-hover:translate-x-1 transition-transform">{title}</h3>
        <p className="text-white/70 text-xs font-medium leading-relaxed group-hover:translate-x-1 transition-transform delay-75">{description}</p>
      </div>
    </div>
    <div className="absolute -top-8 -right-8 p-4 opacity-[0.08] group-hover:opacity-[0.15] group-hover:rotate-12 transition-all transform scale-150 duration-500 pointer-events-none">
       <Icon className="w-32 h-32 text-white" />
    </div>
  </button>
);

export function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview'|'performance'|'finance'>('overview');
  const [dbOrdersLength, setDbOrdersLength] = useState(0);
  const [dbGMV, setDbGMV] = useState(0);
  const [dbCustomersLength, setDbCustomersLength] = useState(0);
  
  const [config, setConfig] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('dashboard_config');
    if (saved) return JSON.parse(saved);
    return {
      showStats: true,
      showMainChart: true,
      showCategorySplit: true,
      showHourlyOrders: true,
      showTopSellers: true,
      showSLA: true,
      showCommunity: true,
      showQuickNav: true,
      showFinanceStats: true,
      showRevenueExpense: true,
      showCashFlow: true,
    };
  });
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const handleConfigChange = (key: string) => {
    const newConfig = { ...config, [key]: !config[key] };
    setConfig(newConfig);
    localStorage.setItem('dashboard_config', JSON.stringify(newConfig));
  };

  const [delayedOrdersCount, setDelayedOrdersCount] = useState(0);

  useEffect(() => {
    // Listen to real orders from Firebase
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      let gmv = 0;
      let delayedCount = 0;
      const now = Date.now();
      const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

      snap.docs.forEach(doc => {
        const data = doc.data();
        if (data.status === 'completed') {
           gmv += data.total || 0;
        }

        // Logic for delayed orders check (pending or processing for > 24h)
        if (data.status === 'pending' || data.status === 'processing') {
           const createdAt = data.createdAt?.toDate?.() || (data.date ? new Date(data.date) : null);
           if (createdAt && createdAt.getTime() < twentyFourHoursAgo) {
              delayedCount++;
           }
        }
      });
      setDbOrdersLength(snap.size);
      setDbGMV(gmv);
      setDelayedOrdersCount(delayedCount);
    });

    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      setDbCustomersLength(snap.size);
    });

    return () => {
      unsubOrders();
      unsubCustomers();
    };
  }, []);

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-700 overflow-y-auto custom-scrollbar pb-12">
      {/* AI Intelligence Command Center */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-500/20">
         <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <BrainCircuit className="w-80 h-80 rotate-12" />
         </div>
         <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/20">
                     <Sparkles className="w-6 h-6 text-blue-300 animate-pulse" />
                  </div>
                  <div>
                     <h2 className="text-2xl font-black tracking-tight">AI Enterprise Command Center</h2>
                     <p className="text-blue-100/70 text-sm font-medium">Hệ thống của bạn đã được nâng cấp lên AI-First. Mọi module hiện được tích hợp trợ lý Gemini.</p>
                  </div>
               </div>
               
               <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm cursor-default hover:bg-white/20 transition-colors">
                     <Zap className="w-4 h-4 text-amber-300" />
                     <span className="text-xs font-bold">Predictive Sales: ON</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm cursor-default hover:bg-white/20 transition-colors">
                     <Store className="w-4 h-4 text-emerald-300" />
                     <span className="text-xs font-bold">Smart Warehouse: Optimized</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm cursor-default hover:bg-white/20 transition-colors">
                     <Bot className="w-4 h-4 text-blue-300" />
                     <span className="text-xs font-bold">Omni-Agent: Live</span>
                  </div>
               </div>
            </div>

            <div className="bg-white/10 p-6 rounded-2xl border border-white/10 backdrop-blur-sm space-y-4 w-full md:w-80">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">AI Priority Insights</span>
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-ping" />
               </div>
               <p className="text-xs font-medium leading-relaxed italic">"Nhu cầu mặt hàng SKU-992 dự kiến tăng 45% trong tuần tới. Đề xuất luân chuyển hàng từ Kho A sang Kho B ngay hôm nay."</p>
               <button className="w-full py-2.5 bg-blue-500 hover:bg-blue-400 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/30">
                  Phê duyệt đề xuất AI
               </button>
            </div>
         </div>
      </div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg uppercase tracking-widest border border-blue-200/60 shadow-sm">Live Dashboard</span>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
               <span className="relative flex h-2 w-2">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
               </span>
               Đồng bộ realtime
            </span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Tổng quan Hệ thống</h1>
          <p className="text-sm text-slate-500 mt-2 max-w-lg font-medium">Theo dõi hiệu suất đa kênh.</p>
        </div>
        
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 shadow-sm">
            <Activity className="w-4 h-4 text-emerald-500" />
            Báo cáo Vận hành
          </button>
          <button className="bg-slate-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600 transition-all shadow-md shadow-slate-900/10 hover:shadow-blue-600/30">
            Xuất dữ liệu BI
          </button>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            <Settings2 className="w-4 h-4 text-blue-500" />
            Tùy biến
          </button>
        </div>
      </div>

      {config.showQuickNav && (
        <div className="flex flex-wrap items-center gap-3">
           <button onClick={() => navigate('/pim')} className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center gap-2 shadow-sm group">
              <Package className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
              PIM System
           </button>
           <button onClick={() => navigate('/orders')} className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-all flex items-center gap-2 shadow-sm group">
              <ListOrdered className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
              Order Center
           </button>
           <button onClick={() => navigate('/sellers')} className="bg-white border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all flex items-center gap-2 shadow-sm group">
              <Users className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
              Seller Hub
           </button>
        </div>
      )}

      {delayedOrdersCount > 0 && (
        <div 
          onClick={() => navigate('/orders')}
          className="bg-gradient-to-br from-red-50 to-white border border-red-200 p-4 rounded-xl cursor-pointer hover:shadow-md transition-all group"
        >
           <div className="flex items-start gap-4">
              <div className="p-2.5 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm shrink-0 mt-0.5">
                 <ShoppingCart className="w-5 h-5" />
              </div>
              <div>
                 <h4 className="text-sm font-black text-red-900 tracking-tight flex items-center gap-2">
                    Cảnh báo SLA: {delayedOrdersCount} đơn &gt;24h
                    <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                 </h4>
                 <p className="text-[13px] text-red-700 mt-1 font-medium leading-relaxed">Đơn chờ xác nhận hoặc đóng gói trễ hạn. Cần xử lý ngay.</p>
              </div>
           </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-slate-200 shrink-0">
        <button onClick={() => setActiveTab('overview')} className={cn("pb-3 px-1 text-sm font-bold border-b-2 transition-colors", activeTab === 'overview' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900")}>
          Kinh doanh & Bán hàng
        </button>
        <button onClick={() => setActiveTab('performance')} className={cn("pb-3 px-1 text-sm font-bold border-b-2 transition-colors", activeTab === 'performance' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900")}>
          Hiệu suất Vận hành
        </button>
        <button onClick={() => setActiveTab('finance')} className={cn("pb-3 px-1 text-sm font-bold border-b-2 transition-colors", activeTab === 'finance' ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-900")}>
          Tài chính & Dòng tiền
        </button>
      </div>

      <div className="space-y-6">
          {isConfigOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
              <div className="bg-white w-full max-w-sm h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Settings2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">Tùy chỉnh Giao diện</h3>
                  </div>
                  <button onClick={() => setIsConfigOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
                   <p className="text-sm font-medium text-slate-500 mb-6">Chọn các Widget (thẻ Báo cáo) bạn muốn hiển thị trên biểu đồ chính, bảng xếp hạng và lối tắt.</p>
                   <div className="space-y-4">
                     {[
                       { id: 'showStats', label: 'Chỉ số Kinh doanh (Thẻ Stats)', icon: DollarSign },
                       { id: 'showMainChart', label: 'Biểu đồ chính (Tăng trưởng)', icon: LineChartIcon },
                       { id: 'showTopSellers', label: 'Bảng xếp hạng (Top Sellers)', icon: Store },
                       { id: 'showQuickNav', label: 'Lối tắt chức năng', icon: ArrowUpRight },
                       { id: 'showCategorySplit', label: 'Biểu đồ Tỷ trọng Ngành hàng', icon: PieChartIcon },
                       { id: 'showCommunity', label: 'Thông tin Cộng đồng', icon: Users },
                       { id: 'showSLA', label: 'Chỉ số SLA Vận hành', icon: ShieldCheck },
                       { id: 'showHourlyOrders', label: 'Biểu đồ Đơn hàng theo giờ', icon: ListOrdered },
                       { id: 'showFinanceStats', label: 'Chỉ số Tài chính', icon: Banknote },
                       { id: 'showRevenueExpense', label: 'Biểu đồ Thu Chi', icon: LineChartIcon },
                       { id: 'showCashFlow', label: 'Dòng tiền', icon: Wallet },
                     ].map(item => (
                       <label key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-blue-50/50 hover:border-blue-100 transition-colors cursor-pointer group">
                         <div className="flex items-center gap-3">
                            <item.icon className={cn("w-5 h-5", config[item.id] ? "text-blue-500" : "text-slate-400 group-hover:text-blue-400")} />
                            <span className={cn("text-sm font-bold", config[item.id] ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700")}>{item.label}</span>
                         </div>
                         <div className={cn("w-11 h-6 rounded-full p-1 transition-colors relative shadow-inner", config[item.id] ? "bg-blue-600" : "bg-slate-300")}>
                            <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200", config[item.id] ? "translate-x-5" : "translate-x-0")}></div>
                         </div>
                         <input type="checkbox" className="sr-only" checked={config[item.id]} onChange={() => handleConfigChange(item.id)} />
                       </label>
                     ))}
                   </div>
                </div>
                <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                   <button onClick={() => setIsConfigOpen(false)} className="px-6 py-3 w-full bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-blue-600 shadow-xl shadow-slate-900/10 hover:shadow-blue-600/30 transition-all flex justify-center items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Lưu tùy chỉnh
                   </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {config.showStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <StatCard title="GMV Thực tế" value={formatCurrency(dbGMV || 6700000000)} change="15.8" icon={DollarSign} trend="up" />
                <StatCard title="Traffic (Truy cập)" value="192,450" change="24.2" icon={Eye} trend="up" />
                <StatCard title="Tổng đơn hàng" value={dbOrdersLength > 0 ? dbOrdersLength.toLocaleString() : "8,560"} change="8.2" icon={ShoppingCart} trend="up" />
                <StatCard title="Khách hàng" value={dbCustomersLength > 0 ? dbCustomersLength.toLocaleString() : "15,248"} change="5.4" icon={Users} trend="up" />
                <StatCard title="Seller hoạt động" value="426" change="2.1" icon={Store} trend="up" />
                <StatCard title="Tỉ lệ chuyển đổi" value="3.8%" change="1.2" icon={ListOrdered} trend="up" />
              </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-8 space-y-6">
                  {config.showMainChart && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                      <div>
                        <h3 className="font-bold text-slate-900 tracking-tight text-lg">Biểu đồ Tăng trưởng & Xu hướng</h3>
                      </div>
                      <div className="flex gap-6">
                         <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></div>
                           <span className="text-xs font-bold text-slate-600 uppercase">GMV (Tỷ)</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 bg-slate-200 rounded-sm"></div>
                           <span className="text-xs font-bold text-slate-600 uppercase">Traffic</span>
                         </div>
                      </div>
                    </div>
                    <div className="p-6 h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                          <defs>
                            <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} dy={12}/>
                          <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} tickFormatter={(value) => `${value}T`}/>
                          <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} tickFormatter={(value) => `${value / 1000}k`}/>
                          <Tooltip cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}/>
                          <Area yAxisId="left" type="monotone" dataKey="gmv" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorGmv)" />
                          {/* @ts-ignore */}
                          <Bar yAxisId="right" dataKey="traffic" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={40} opacity={0.6} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {config.showCommunity && (
                    <div className="bg-gradient-to-br from-slate-900 to-[#0B1120] rounded-xl p-8 text-white relative overflow-hidden shadow-md shadow-slate-900/10 border border-slate-800 flex flex-col justify-between">
                      <div className="relative z-10">
                         <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-lg shadow-lg shadow-blue-500/20 shadow-inner border border-blue-400/50">
                               <Users className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold tracking-tight">Cộng đồng Seller</h3>
                            </div>
                         </div>
                         <p className="text-slate-400 text-xs leading-relaxed max-w-sm">Hơn 2,400 SKU mới đang chờ duyệt trong 24h tới.</p>
                      </div>
                      <div className="mt-6">
                         <button className="px-5 py-2 bg-white text-slate-900 font-bold rounded-lg text-xs hover:bg-blue-50 transition-all shadow-md">Duyệt Seller mới</button>
                      </div>
                      <Users className="absolute -bottom-8 -right-8 w-48 h-48 text-white opacity-[0.02]" />
                    </div>
                    )}

                    {config.showCategorySplit && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-bold text-slate-900 text-sm">Tỷ trọng Ngành</h3>
                      </div>
                      <div className="p-4 flex-1 h-[220px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                              {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                            <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '11px' }}/>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    )}
                  </div>
                </div>

                <div className="xl:col-span-4 space-y-6">
                  {config.showTopSellers && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-xl">
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight">Top Sellers</h3>
                      <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors">Xem tất cả</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {sellerData.map((seller, index) => (
                        <div key={seller.name} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-bold text-xs flex items-center justify-center border border-slate-200/60 group-hover:bg-blue-50 group-hover:text-blue-700 transition-all">
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-900">{seller.name}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                 <span className="text-[10px] text-amber-500 font-bold">★ {seller.rating}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-slate-900">{seller.gmv}</p>
                            <p className="text-[10px] text-emerald-600 font-bold mt-0.5">+12%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {config.showSLA && (
                 <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg relative overflow-hidden group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 blur-3xl rounded-full pointer-events-none"></div>
                    <div className="flex items-center justify-between mb-8 relative z-10">
                       <h3 className="font-bold text-white text-lg flex items-center gap-2">
                         <Activity className="w-5 h-5 text-blue-400" />
                         Báo cáo Vận hành
                       </h3>
                       <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                          Live
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Giao đúng hạn</div>
                        <div className="text-2xl font-bold flex items-baseline gap-1">
                          98.5<span className="text-sm font-normal text-slate-400">%</span>
                        </div>
                        <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">+1.2% <TrendingUp className="w-3 h-3"/></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                        <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Lỗi / Sự cố</div>
                        <div className="text-2xl font-bold flex items-baseline gap-1">
                          1.2<span className="text-sm font-normal text-slate-400">%</span>
                        </div>
                        <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">-0.4% <TrendingDown className="w-3 h-3"/></div>
                      </div>
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 col-span-2 flex justify-between items-center">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Xử lý Đơn (TB)</div>
                          <div className="text-2xl font-bold flex items-baseline gap-1">
                            2.4<span className="text-sm font-normal text-slate-400">giờ</span>
                          </div>
                          <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">-0.2h <TrendingDown className="w-3 h-3"/> so với hôm qua</div>
                        </div>
                        <div className="w-24 h-12 opacity-80">
                           <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible drop-shadow-md">
                              <path d="M0,30 L20,25 L40,35 L60,15 L80,20 L100,5" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                           </svg>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 relative z-10">
                       {[
                         { label: 'Tỷ lệ Hoàn thành Đơn', value: 94.2, color: 'bg-blue-400', unit: '%' },
                         { label: 'Tỉ lệ Duyệt Tự động', value: 82.5, color: 'bg-emerald-400', unit: '%' },
                         { label: 'Tỷ lệ Hủy/Hoàn trả', value: 2.4, color: 'bg-rose-400', unit: '%' },
                       ].map((item) => (
                         <div key={item.label} className="group">
                           <div className="flex justify-between items-end mb-2">
                             <span className="text-xs font-bold text-slate-300">{item.label}</span>
                             <span className="text-sm font-black text-white">{item.value}{item.unit}</span>
                           </div>
                           <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                             <div className={cn("h-full transition-all duration-1000", item.color)} style={{ width: `${item.value}%` }}></div>
                           </div>
                         </div>
                       ))}
                    </div>
                 </div>
                 )}

                 {config.showHourlyOrders && (
                 <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-slate-900 text-lg">Đơn hàng theo Giờ</h3>
                    </div>
                    <div className="p-6 flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={hourlyData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} dy={8} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '12px' }} />
                          <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
                 )}
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {config.showFinanceStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Tổng Doanh thu" value="1,250,000,000" change="12.5" icon={Banknote} trend="up" />
                <StatCard title="Tổng Chi phí" value="980,000,000" change="-5.2" icon={Wallet} trend="down" />
                <StatCard title="Lợi nhuận gộp" value="270,000,000" change="8.4" icon={LineChartIcon} trend="up" />
              </div>
              )}

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                 {config.showRevenueExpense && (
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                         <LineChartIcon className="w-5 h-5 text-blue-600" />
                         Biểu đồ Thu Chi (Tháng)
                       </h3>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={financeData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                          <YAxis tickFormatter={(value) => `${value}tr`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
                          <Tooltip 
                             cursor={{ fill: '#F3F4F6' }}
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                             formatter={(value: number) => [`${value} triệu VNĐ`, '']}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Bar dataKey="revenue" name="Doanh thu" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                          <Bar dataKey="expense" name="Chi phí" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
                 )}

                 {config.showCashFlow && (
                 <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-6">
                       <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                         <Wallet className="w-5 h-5 text-emerald-600" />
                         Dòng tiền (Tuần)
                       </h3>
                    </div>
                    <div className="flex-1 min-h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cashFlowData}>
                          <defs>
                            <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                          <YAxis tickFormatter={(value) => `${value}tr`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
                          <Tooltip 
                             cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
                             contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
                             formatter={(value: number) => [`${value} triệu VNĐ`, '']}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          <Area type="monotone" dataKey="in" name="Tiền vào" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
                          <Area type="monotone" dataKey="out" name="Tiền ra" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
                 )}
              </div>
            </div>
          )}
        </div>
    </div>
  );
}
