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
 Volume2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// @ts-ignore
import { Responsive as ResponsiveGridLayoutNative, useContainerWidth } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

function ResponsiveGridLayout({ children, ...props }: any) {
  const { width, containerRef } = useContainerWidth();
  return (
    <div ref={containerRef} className="w-full">
      <ResponsiveGridLayoutNative width={width || 1200} {...props}>
        {children}
      </ResponsiveGridLayoutNative>
    </div>
  );
}
import { formatCurrency, cn } from '../lib/utils';
import { db } from '../lib/firebase';
import { auth } from '../lib/firebase';
import { collection, onSnapshot, query, limit, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';

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

const StatCard = ({ title, value, change, icon: Icon, trend, subValue, color }: any) => (
 <div className={cn("bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5 flex items-center gap-4", color)}>
 <div className="p-2.5 bg-slate-50 text-slate-600 rounded-lg border border-slate-200 shrink-0 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
  <Icon className="w-5 h-5" />
 </div>
 <div className="flex-1 min-w-0">
  <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider truncate">{title}</div>
  <div className="text-lg font-bold text-slate-900 tracking-tight leading-tight">{value}</div>
  {subValue && <div className="text-[11px] text-slate-400 mt-0.5">{subValue}</div>}
 </div>
 <div className={cn(
  "text-xs flex items-center gap-0.5 font-semibold px-2 py-1 rounded-full shrink-0",
  trend === 'up' ? "text-emerald-700 bg-emerald-50" : "text-rose-700 bg-rose-50"
 )}>
  {trend === 'up' ? '↗' : '↘'} {change}%
 </div>
 </div>
);

const QuickActionCard = ({ title, icon: Icon, onClick, color, description }: any) => (
 <button 
 onClick={onClick}
 className={cn(
 "relative group overflow-hidden p-6 rounded-lg border transition-all duration-300 hover:shadow-sm text-left",
 color === 'bg-slate-900' ? "bg-white border-slate-900 hover:shadow-slate-900/5" : 
 color === 'bg-emerald-600' ? "bg-white border-emerald-500 hover:shadow-emerald-500/30" : 
 "bg-white border-slate-700 hover:shadow-slate-900/30"
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



const defaultPerformanceLayout = {
  lg: [
    { i: 'sla', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'hourlyOrders', x: 6, y: 0, w: 6, h: 4, minW: 3, minH: 3 }
  ]
};

const defaultFinanceLayout = {
  lg: [
    { i: 'financeStats', x: 0, y: 0, w: 12, h: 1, minW: 12, minH: 1, static: true },
    { i: 'revenueExpense', x: 0, y: 1, w: 6, h: 4, minW: 3, minH: 3 },
    { i: 'cashFlow', x: 6, y: 1, w: 6, h: 4, minW: 3, minH: 3 }
  ]
};

const defaultOverviewLayout = {
  lg: [
    { i: 'mainChart', x: 0, y: 0, w: 8, h: 4, minW: 4, minH: 3 },
    { i: 'topSellers', x: 8, y: 0, w: 4, h: 7, minW: 3, minH: 3 },
    { i: 'community', x: 0, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
    { i: 'categorySplit', x: 4, y: 4, w: 4, h: 3, minW: 3, minH: 3 }
  ],
  md: [
    { i: 'mainChart', x: 0, y: 0, w: 10, h: 4 },
    { i: 'topSellers', x: 0, y: 4, w: 5, h: 6 },
    { i: 'community', x: 5, y: 4, w: 5, h: 3 },
    { i: 'categorySplit', x: 5, y: 7, w: 5, h: 3 }
  ],
  sm: [
    { i: 'mainChart', x: 0, y: 0, w: 6, h: 4 },
    { i: 'topSellers', x: 0, y: 4, w: 6, h: 5 },
    { i: 'community', x: 0, y: 9, w: 6, h: 3 },
    { i: 'categorySplit', x: 0, y: 12, w: 6, h: 3 }
  ]
};

export function Dashboard() {
 const navigate = useNavigate();
 const [activeTab, setActiveTab] = useState<'overview'|'performance'|'finance'>('overview');
 const [dbOrdersLength, setDbOrdersLength] = useState(0);
 const [dbGMV, setDbGMV] = useState(0);
 const [dbCustomersLength, setDbCustomersLength] = useState(0);
 const [dbSellersLength, setDbSellersLength] = useState(0);
 const [dbConversionRate, setDbConversionRate] = useState(0);
 const [dateRangeStart, setDateRangeStart] = useState('');
 const [dateRangeEnd, setDateRangeEnd] = useState('');
 
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

 const [overviewLayout, setOverviewLayout] = useState(defaultOverviewLayout);
 const [performanceLayout, setPerformanceLayout] = useState(defaultPerformanceLayout);
 const [financeLayout, setFinanceLayout] = useState(defaultFinanceLayout);

 useEffect(() => {
   const user = auth.currentUser;
   if (!user) return;
   getDoc(doc(db, 'preferences', user.uid, 'dashboard', 'layout')).then(snap => {
     if (!snap.exists()) return;
     const d = snap.data();
     if (d.overview) setOverviewLayout(d.overview);
     if (d.performance) setPerformanceLayout(d.performance);
     if (d.finance) setFinanceLayout(d.finance);
   }).catch(() => {});
 }, []);

 const saveLayoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
 const saveLayout = (tab: string, layouts: any) => {
   if (saveLayoutRef.current) clearTimeout(saveLayoutRef.current);
   saveLayoutRef.current = setTimeout(async () => {
     const user = auth.currentUser;
     if (!user) return;
     try {
       const ref = doc(db, 'preferences', user.uid, 'dashboard', 'layout');
       const snap = await getDoc(ref);
       const existing = snap.exists() ? snap.data() : {};
       await setDoc(ref, { ...existing, [tab]: layouts }, { merge: true });
     } catch {}
   }, 1500);
 };

 const handleConfigChange = (key: string) => {
 const newConfig = { ...config, [key]: !config[key] };
 setConfig(newConfig);
 localStorage.setItem('dashboard_config', JSON.stringify(newConfig));
 };

 const [delayedOrdersCount, setDelayedOrdersCount] = useState(0);

 useEffect(() => {
 const now = Date.now();
 const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;
 const startTs = dateRangeStart ? new Date(dateRangeStart).getTime() : null;
 const endTs = dateRangeEnd ? new Date(dateRangeEnd + 'T23:59:59').getTime() : null;

 const unsubOrders = onSnapshot(
  query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500)),
  (snap) => {
   let gmv = 0;
   let delayedCount = 0;
   let ordersInRange = 0;
   let deliveredInRange = 0;
   snap.docs.forEach(doc => {
    const d = doc.data();
    const createdAt = d.createdAt?.toDate?.()?.getTime?.() || null;
    const inRange = !startTs || !endTs || (createdAt && createdAt >= startTs && createdAt <= endTs);
    if (inRange) {
     ordersInRange++;
     if (d.status === 'delivered' || d.status === 'completed') { gmv += d.total || 0; deliveredInRange++; }
     if (d.status === 'pending' || d.status === 'processing') {
      const ct = d.createdAt?.toDate?.() || null;
      if (ct && ct.getTime() < twentyFourHoursAgo) delayedCount++;
     }
    }
   });
   setDbOrdersLength(startTs ? ordersInRange : snap.size);
   setDbGMV(gmv);
   setDelayedOrdersCount(delayedCount);
   setDbConversionRate(ordersInRange > 0 ? Math.round((deliveredInRange / ordersInRange) * 1000) / 10 : 0);
  },
  (error) => console.error('Dashboard orders snapshot error:', error)
 );

 const unsubCustomers = onSnapshot(
  collection(db, 'customers'),
  (snap) => setDbCustomersLength(snap.size),
  (error) => console.error('Dashboard customers snapshot error:', error)
 );

 const unsubSellers = onSnapshot(
  collection(db, 'sellers'),
  (snap) => setDbSellersLength(snap.size),
  (error) => console.error('Dashboard sellers snapshot error:', error)
 );

 return () => {
  unsubOrders();
  unsubCustomers();
  unsubSellers();
 };
 }, [dateRangeStart, dateRangeEnd]);

 return (
 <div className="flex flex-col h-full gap-3 animate-in fade-in duration-700 overflow-y-auto custom-scrollbar pb-12 pt-2">
 {/* Dashboard Header */}
 <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
   <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shrink-0">
     <Sparkles className="w-6 h-6 text-white" />
    </div>
    <div>
     <div className="flex items-center gap-2 mb-1">
      <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold">Bảng điều khiển</span>
      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
       <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex h-1.5 w-1.5 bg-emerald-500"></span></span>
       Realtime
      </span>
     </div>
     <h1 className="text-xl font-bold text-slate-900">Tổng quan Hệ thống</h1>
     <p className="text-sm text-slate-500 mt-0.5">AI-First · Trung tâm điều hành VComm ERP</p>
    </div>
   </div>
   <div className="flex flex-wrap gap-2">
    {[
     { icon: Zap, label: 'Dự đoán: BẬT', cls: 'bg-amber-100 text-amber-700' },
     { icon: Store, label: 'Kho: TỐT', cls: 'bg-emerald-100 text-emerald-700' },
     { icon: Bot, label: 'Agent: Hoạt động', cls: 'bg-cyan-100 text-cyan-700' }
    ].map(chip => (
     <div key={chip.label} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${chip.cls}`}>
      <chip.icon className="w-3.5 h-3.5" />
      {chip.label}
     </div>
    ))}
    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
     <Activity className="w-3.5 h-3.5" />
     Báo cáo
    </button>
    <button
     onClick={() => setIsConfigOpen(true)}
     className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
    >
     <Settings2 className="w-3.5 h-3.5" />
     Tùy biến
    </button>
   </div>
  </div>
 </div>

 {config.showQuickNav && (
 <div className="flex flex-wrap items-center gap-2">
 <button onClick={() => navigate('/pim')} className="bg-white border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5">
 <Package className="w-3.5 h-3.5 text-blue-600" />
 PIM
 </button>
 <button onClick={() => navigate('/orders')} className="bg-white border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-1.5">
 <ListOrdered className="w-3.5 h-3.5 text-emerald-500" />
 Đơn hàng
 </button>
 <button onClick={() => navigate('/sellers')} className="bg-white border border-slate-200 px-3 py-1.5 text-[12px] font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5">
 <Users className="w-3.5 h-3.5 text-slate-700" />
 Đối tác
 </button>
 </div>
 )}

 {delayedOrdersCount > 0 && (
 <div 
 onClick={() => navigate('/orders')}
 className="bg-white to-white border border-red-200 p-4 rounded-xl cursor-pointer hover:shadow-sm transition-all group"
 >
 <div className="flex items-start gap-4">
 <div className="p-2.5 bg-red-100 text-red-600 rounded-lg group-hover:bg-red-600 group-hover:text-white transition-all shadow-sm shrink-0 mt-0.5">
 <ShoppingCart className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-red-900 tracking-tight flex items-center gap-2">
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
 <div className="flex items-center gap-6 border-b border-slate-300 shrink-0">
 <button onClick={() => setActiveTab('overview')} className={cn("pb-3 px-1 text-sm font-bold border-b-2 transition-colors", activeTab === 'overview' ? "border-slate-900 text-blue-600" : "border-transparent text-slate-600 hover:text-slate-900")}>
 Kinh doanh & Bán hàng
 </button>
 <button onClick={() => setActiveTab('performance')} className={cn("pb-3 px-1 text-sm font-bold border-b-2 transition-colors", activeTab === 'performance' ? "border-slate-900 text-blue-600" : "border-transparent text-slate-600 hover:text-slate-900")}>
 Hiệu suất Vận hành
 </button>
 <button onClick={() => setActiveTab('finance')} className={cn("pb-3 px-1 text-sm font-bold border-b-2 transition-colors", activeTab === 'finance' ? "border-slate-900 text-blue-600" : "border-transparent text-slate-600 hover:text-slate-900")}>
 Tài chính & Dòng tiền
 </button>
 </div>

 <div className="space-y-6">
 {isConfigOpen && (
 <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end">
 <div className="bg-white w-full max-w-sm h-full shadow-sm animate-in slide-in-from-right duration-300 flex flex-col">
 <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-[#EAE7DF] text-blue-600 rounded-lg">
 <Settings2 className="w-5 h-5" />
 </div>
 <h3 className="font-bold text-slate-900 text-lg">Tùy chỉnh Giao diện</h3>
 </div>
 <button onClick={() => setIsConfigOpen(false)} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
 <X className="w-5 h-5" />
 </button>
 </div>
 <div className="flex-1 overflow-y-auto p-6 bg-white custom-scrollbar">
 <p className="text-sm font-medium text-slate-600 mb-6">Chọn các Widget (thẻ Báo cáo) bạn muốn hiển thị trên biểu đồ chính, bảng xếp hạng và lối tắt.</p>
 <div className="space-y-4">
 {[
 { id: 'showStats', label: 'Chỉ số Kinh doanh (Thẻ Stats)', icon: DollarSign },
 { id: 'showMainChart', label: 'Biểu đồ chính (Tăng trưởng)', icon: LineChartIcon },
 { id: 'showTopSellers', label: 'Bảng xếp hạng (Top Nhà bán hàng)', icon: Store },
 { id: 'showQuickNav', label: 'Lối tắt chức năng', icon: ArrowUpRight },
 { id: 'showCategorySplit', label: 'Biểu đồ Tỷ trọng Ngành hàng', icon: PieChartIcon },
 { id: 'showCommunity', label: 'Thông tin Cộng đồng', icon: Users },
 { id: 'showSLA', label: 'Chỉ số SLA Vận hành', icon: ShieldCheck },
 { id: 'showHourlyOrders', label: 'Biểu đồ Đơn hàng theo giờ', icon: ListOrdered },
 { id: 'showFinanceStats', label: 'Chỉ số Tài chính', icon: Banknote },
 { id: 'showRevenueExpense', label: 'Biểu đồ Thu Chi', icon: LineChartIcon },
 { id: 'showCashFlow', label: 'Dòng tiền', icon: Wallet },
 ].map(item => (
 <label key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/50 hover:border-slate-300 transition-colors cursor-pointer group">
 <div className="flex items-center gap-3">
 <item.icon className={cn("w-5 h-5", config[item.id] ? "text-blue-600" : "text-slate-500 group-hover:text-orange-500")} />
 <span className={cn("text-sm font-bold", config[item.id] ? "text-slate-900" : "text-slate-600 group-hover:text-slate-800")}>{item.label}</span>
 </div>
 <div className={cn("w-11 h-6 rounded-full p-1 transition-colors relative shadow-inner", config[item.id] ? "bg-slate-900" : "bg-slate-300")}>
 <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200", config[item.id] ? "translate-x-5" : "translate-x-0")}></div>
 </div>
 <input type="checkbox" className="sr-only" checked={config[item.id]} onChange={() => handleConfigChange(item.id)} />
 </label>
 ))}
 </div>
 </div>
 <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end shrink-0">
 <button onClick={() => setIsConfigOpen(false)} className="px-6 py-3 w-full bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-slate-900 shadow-sm shadow-slate-900/10 hover:shadow-slate-900/5 transition-all flex justify-center items-center gap-2">
 <CheckCircle2 className="w-5 h-5" /> Lưu tùy chỉnh
 </button>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'overview' && (
 <div className="space-y-6 animate-in fade-in slide-in- duration-500">
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-4 animate-pulse">
      <div className="p-2 bg-red-100 rounded-lg shrink-0">
        <Activity className="w-5 h-5 text-red-600" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-red-900">Cảnh báo Hiệu suất Thời gian thực</h4>
        <p className="text-xs text-red-700 mt-1 max-w-4xl">Phát hiện tỷ lệ thoát tăng đột biến (↑ 15%) ở trang Thanh toán trong 10 phút qua. Đề xuất: Kiểm tra ngay cổng thanh toán VNPAY.</p>
      </div>
    </div>
 {config.showStats && (
 <div className="space-y-4">
 <div className="flex items-center gap-3 flex-wrap">
  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Lọc theo thời gian:</span>
  <input type="date" value={dateRangeStart} onChange={e => setDateRangeStart(e.target.value)} className="border border-slate-200 rounded-2xl px-3 py-1.5 text-sm focus:outline-none bg-white" />
  <span className="text-slate-400 text-sm">—</span>
  <input type="date" value={dateRangeEnd} onChange={e => setDateRangeEnd(e.target.value)} className="border border-slate-200 rounded-2xl px-3 py-1.5 text-sm focus:outline-none bg-white" />
  {(dateRangeStart || dateRangeEnd) && (
  <button onClick={() => { setDateRangeStart(''); setDateRangeEnd(''); }} className="text-xs text-slate-500 hover:text-red-500 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">Xóa bộ lọc</button>
  )}
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
 <StatCard title="GMV Thực tế" value={formatCurrency(dbGMV || 0)} change="15.8" icon={DollarSign} trend="up" />
 <StatCard title="Traffic (Truy cập)" value="192,450" change="24.2" icon={Eye} trend="up" />
 <StatCard title="Tổng đơn hàng" value={dbOrdersLength.toLocaleString()} change="8.2" icon={ShoppingCart} trend="up" />
 <StatCard title="Khách hàng" value={dbCustomersLength.toLocaleString()} change="5.4" icon={Users} trend="up" />
 <StatCard title="Seller hoạt động" value={dbSellersLength > 0 ? dbSellersLength.toLocaleString() : '426'} change="2.1" icon={Store} trend="up" />
 <StatCard title="Tỉ lệ chuyển đổi" value={dbConversionRate > 0 ? `${dbConversionRate}%` : '3.8%'} change="1.2" icon={ListOrdered} trend="up" />
 </div>
 </div>
 )}

  <ResponsiveGridLayout
  className="layout w-full -mx-4 md:mx-0"
  layouts={overviewLayout}
  onLayoutChange={(_: any, all: any) => { setOverviewLayout(all); saveLayout('overview', all); }}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
  rowHeight={100}
  draggableHandle=".drag-handle"
  margin={[24, 24]}
 >
  {config.showMainChart && (
  <div key="mainChart" className="bg-white rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-shadow overflow-hidden flex flex-col h-full w-full">
  <div className="drag-handle cursor-move px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 hover:bg-slate-100 transition-colors">
  <div>
  <h3 className="font-bold text-primary-900 tracking-tight text-lg pointer-events-none">Biểu đồ Tăng trưởng & Xu hướng</h3>
  </div>
  <div className="flex gap-6 pointer-events-none">
  <div className="flex items-center gap-2">
  <div className="w-2.5 h-2.5 bg-slate-900 rounded-sm"></div>
  <span className="text-xs font-bold text-slate-700 uppercase">GMV (Tỷ)</span>
  </div>
  <div className="flex items-center gap-2">
  <div className="w-2.5 h-2.5 bg-slate-200 rounded-sm"></div>
  <span className="text-xs font-bold text-slate-700 uppercase">Traffic</span>
  </div>
  </div>
  </div>
  <div className="p-6 flex-1 h-full min-h-0">
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
  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} tickFormatter={(value) => `${value}T`} />
  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} tickFormatter={(value) => `${value / 1000}k`} />
  <Tooltip cursor={{ stroke: "#E2E8F0", strokeWidth: 1 }} />
  <Area yAxisId="left" type="monotone" dataKey="gmv" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorGmv)" />
  {/* @ts-ignore */}
  <Bar yAxisId="right" dataKey="traffic" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={40} opacity={0.6} />
  </AreaChart>
  </ResponsiveContainer>
  </div>
  </div>
  )}

  {config.showCommunity && (
  <div key="community" className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between h-full w-full">
  <div className="drag-handle cursor-move px-8 py-6 relative z-10 hover:bg-white/5 transition-colors rounded-t-xl rounded-b-xl h-full flex flex-col">
  <div className="flex items-center gap-4 mb-6 pointer-events-none">
  <div className="p-3 bg-slate-800 rounded-lg shadow-sm shadow-slate-900/5 shadow-inner border border-slate-700">
  <Users className="w-6 h-6 text-white" />
  </div>
  <div>
  <h3 className="text-lg font-bold tracking-tight">Cộng đồng Seller</h3>
  </div>
  </div>
  <p className="text-slate-500 text-xs leading-relaxed max-w-sm pointer-events-none mb-6">Hơn 2,400 SKU mới đang chờ duyệt trong 24h tới.</p>
  <div className="relative z-10 w-full mt-auto">
  <button className="px-5 w-fit py-2 pointer-events-auto bg-white text-slate-900 font-bold rounded-lg text-xs hover:bg-slate-100 transition-all shadow-sm">Duyệt Seller mới</button>
  </div>
  </div>
  <Users className="absolute -bottom-8 -right-8 w-48 h-48 text-white opacity-[0.02] pointer-events-none" />
  </div>
  )}

  {config.showCategorySplit && (
  <div key="categorySplit" className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden flex flex-col h-full w-full">
  <div className="drag-handle cursor-move hover:bg-slate-50 transition-colors px-5 py-4 border-b border-slate-200 flex items-center justify-between">
  <h3 className="font-bold text-primary-900 text-sm pointer-events-none">Tỷ trọng Ngành</h3>
  </div>
  <div className="p-4 flex-1 h-full min-h-0">
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

  {config.showTopSellers && (
  <div key="topSellers" className="bg-white rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-shadow overflow-hidden flex flex-col h-full w-full">
  <div className="drag-handle cursor-move hover:bg-slate-50/90 transition-colors sticky top-0 z-10 px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/90 backdrop-blur-sm rounded-t-xl">
  <h3 className="font-bold text-primary-900 text-sm tracking-tight pointer-events-none">Top Sellers</h3>
  <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:text-blue-800 transition-colors pointer-events-auto">Xem tất cả</button>
  </div>
  <div className="divide-y divide-slate-100 overflow-y-auto flex-1 custom-scrollbar">
  {sellerData.map((seller, index) => (
  <div key={seller.name} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group cursor-pointer pointer-events-auto">
  <div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs flex items-center justify-center border border-slate-300/60 group-hover:bg-slate-100 group-hover:text-orange-800 transition-all">
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
 </ResponsiveGridLayout>
  </div>
  )}
 {activeTab === 'performance' && (
 <div className="space-y-6 animate-in fade-in slide-in- duration-500">
 
 <ResponsiveGridLayout
  className="layout w-full -mx-4 md:mx-0"
  layouts={performanceLayout}
  onLayoutChange={(_: any, all: any) => { setPerformanceLayout(all); saveLayout('performance', all); }}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
  rowHeight={100}
  draggableHandle=".drag-handle"
  margin={[24, 24]}
 >
  {config.showSLA && (
  <div key="sla" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm relative overflow-hidden group flex flex-col h-full w-full">
  <div className="drag-handle cursor-move p-6 relative z-10 flex items-center justify-between mb-2">
  <h3 className="font-bold text-white text-lg flex items-center gap-2 pointer-events-none">
  <Activity className="w-5 h-5 text-orange-500" />
  Báo cáo Vận hành
  </h3>
  <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1.5 pointer-events-none">
  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
  Live
  </div>
  </div>
  
  <div className="px-6 flex-1 flex flex-col justify-end relative z-10 pb-6 pointer-events-none">
  <div className="grid grid-cols-2 gap-4 mb-2">
  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Giao đúng hạn</div>
  <div className="text-2xl font-bold flex items-baseline gap-1">
  98.5<span className="text-sm font-normal text-slate-500">%</span>
  </div>
  <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">+1.2% <TrendingUp className="w-3 h-3"/></div>
  </div>
  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Lỗi / Sự cố</div>
  <div className="text-2xl font-bold flex items-baseline gap-1">
  1.2<span className="text-sm font-normal text-slate-500">%</span>
  </div>
  <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">-0.4% <TrendingDown className="w-3 h-3"/></div>
  </div>
  <div className="bg-white/5 border border-white/10 rounded-lg p-4 col-span-2 flex justify-between items-center">
  <div>
  <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Xử lý Đơn (TB)</div>
  <div className="text-2xl font-bold flex items-baseline gap-1">
  2.4<span className="text-sm font-normal text-slate-500">giờ</span>
  </div>
  <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">-0.2h <TrendingDown className="w-3 h-3"/> so với hôm qua</div>
  </div>
  <div className="w-24 h-12 opacity-80">
  <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible drop-shadow-sm">
  <path d="M0,30 L20,25 L40,35 L60,15 L80,20 L100,5" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
  </div>
  </div>
  </div>
  
  <div className="space-y-5">
  {[
  { label: 'Tỷ lệ Hoàn thành Đơn', value: 94.2, color: 'bg-blue-400', unit: '%' },
  { label: 'Tỉ lệ Duyệt Tự động', value: 82.5, color: 'bg-emerald-400', unit: '%' },
  { label: 'Tỷ lệ Hủy/Hoàn trả', value: 2.4, color: 'bg-rose-400', unit: '%' },
  ].map((item) => (
  <div key={item.label} className="group">
  <div className="flex justify-between items-end mb-2">
  <span className="text-xs font-bold text-slate-500">{item.label}</span>
  <span className="text-sm font-bold text-white">{item.value}{item.unit}</span>
  </div>
  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
  <div className={cn("h-full transition-all duration-1000", item.color)} style={{ width: `${item.value}%` }}></div>
  </div>
  </div>
  ))}
  </div>
  </div>
  <div className="absolute -top-24 -right-24 w-64 h-64 bg-slate-800/20 blur-3xl rounded-full pointer-events-none"></div>
  </div>
  )}

  {config.showHourlyOrders && (
  <div key="hourlyOrders" className="bg-white rounded-xl border border-slate-300 shadow-sm flex flex-col overflow-hidden h-full w-full">
  <div className="drag-handle cursor-move px-6 py-5 border-b border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
  <h3 className="font-bold text-slate-900 text-lg pointer-events-none">Đơn hàng theo Giờ</h3>
  </div>
  <div className="p-6 flex-1 min-h-0 h-full">
  <ResponsiveContainer width="100%" height="100%">
  <LineChart data={hourlyData}>
  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} dy={8} />
  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748B' }} />
  <Tooltip />
  <Line type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
  </LineChart>
  </ResponsiveContainer>
  </div>
  </div>
  )}
 </ResponsiveGridLayout>
  </div>
  )}

 {activeTab === 'finance' && (
 <div className="space-y-6 animate-in fade-in slide-in- duration-500">
 
 <ResponsiveGridLayout
  className="layout w-full -mx-4 md:mx-0"
  layouts={financeLayout}
  onLayoutChange={(_: any, all: any) => { setFinanceLayout(all); saveLayout('finance', all); }}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
  rowHeight={100}
  draggableHandle=".drag-handle"
  margin={[24, 24]}
 >
  {config.showFinanceStats && (
  <div key="financeStats" className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full w-full drag-handle cursor-move">
  <StatCard title="Tổng Doanh thu" value="1,250,000,000" change="12.5" icon={Banknote} trend="up" />
  <StatCard title="Tổng Chi phí" value="980,000,000" change="-5.2" icon={Wallet} trend="down" />
  <StatCard title="Lợi nhuận gộp" value="270,000,000" change="8.4" icon={LineChartIcon} trend="up" />
  </div>
  )}

  {config.showRevenueExpense && (
  <div key="revenueExpense" className="bg-white rounded-xl border border-slate-300 shadow-sm flex flex-col h-full w-full overflow-hidden">
  <div className="drag-handle cursor-move px-6 py-5 border-b border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
  <h3 className="font-bold text-primary-900 text-lg flex items-center gap-2 pointer-events-none">
  <LineChartIcon className="w-5 h-5 text-blue-600" />
  Biểu đồ Thu Chi (Tháng)
  </h3>
  </div>
  <div className="p-6 flex-1 min-h-0 h-full">
  <ResponsiveContainer width="100%" height="100%">
  <BarChart data={financeData}>
  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
  <YAxis tickFormatter={(value) => `${value}tr`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
  <Tooltip 
  cursor={{ fill: '#F3F4F6' }}
  formatter={(value) => [`${value} triệu VNĐ`, '']}
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
  <div key="cashFlow" className="bg-white rounded-xl border border-slate-300 shadow-sm flex flex-col h-full w-full overflow-hidden">
  <div className="drag-handle cursor-move px-6 py-5 border-b border-slate-200 flex items-center justify-between hover:bg-slate-50 transition-colors">
  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 pointer-events-none">
  <Wallet className="w-5 h-5 text-emerald-600" />
  Dòng tiền (Tuần)
  </h3>
  </div>
  <div className="p-6 flex-1 min-h-0 h-full">
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
  formatter={(value) => [`${value} triệu VNĐ`, '']}
  />
  <Legend wrapperStyle={{ paddingTop: '20px' }} />
  <Area type="monotone" dataKey="in" name="Tiền vào" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIn)" />
  <Area type="monotone" dataKey="out" name="Tiền ra" stroke="#F59E0B" strokeWidth={3} fillOpacity={1} fill="url(#colorOut)" />
  </AreaChart>
  </ResponsiveContainer>
  </div>
  </div>
  )}
 </ResponsiveGridLayout>
  </div>
  )}
  </div>
</div>
  );
}
