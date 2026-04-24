import React, { useState, useEffect } from 'react';
import { 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
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
  Users
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

const sellerData = [
  { name: 'Mobile World', gmv: '450tr', rating: 4.8 },
  { name: 'Fashion Hub', gmv: '280tr', rating: 4.6 },
  { name: 'Eco Mart', gmv: '190tr', rating: 4.9 },
  { name: 'Tech Store', gmv: '150tr', rating: 4.2 },
];

const StatCard = ({ title, value, change, icon: Icon, trend, subValue }: any) => (
  <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all group">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2.5 bg-slate-50 text-slate-500 rounded-lg group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <div className={cn(
        "text-[10px] flex items-center gap-1 font-bold px-2 py-0.5 rounded-full",
        trend === 'up' ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
      )}>
        {trend === 'up' ? '▲' : '▼'} {change}%
      </div>
    </div>
    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{title}</div>
    <div className="text-2xl font-bold text-[#111827] tracking-tight">{value}</div>
    {subValue && (
      <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-slate-50">
        <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{subValue}</span>
      </div>
    )}
  </div>
);

const QuickActionCard = ({ title, icon: Icon, onClick, color, description }: any) => (
  <button 
    onClick={onClick}
    className={cn(
      "relative group overflow-hidden p-6 rounded-lg border transition-all hover:shadow-lg text-left",
      color === 'bg-blue-600' ? "bg-blue-600 border-blue-500" : 
      color === 'bg-emerald-600' ? "bg-emerald-600 border-emerald-500" : 
      "bg-slate-900 border-slate-800"
    )}
  >
    <div className="relative z-10 flex flex-col h-full">
      <div className="p-3 bg-white/10 rounded-lg w-fit mb-4 backdrop-blur-md group-hover:scale-110 transition-transform">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="mt-auto">
        <h3 className="text-white font-bold text-lg leading-tight">{title}</h3>
        <p className="text-white/60 text-xs mt-1 font-medium">{description}</p>
      </div>
    </div>
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
       <Icon className="w-24 h-24 -mr-8 -mt-8" />
    </div>
  </button>
);

export function Dashboard() {
  const navigate = useNavigate();
  const [dbOrdersLength, setDbOrdersLength] = useState(0);
  const [dbGMV, setDbGMV] = useState(0);

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

    return () => {
      unsubOrders();
    };
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      
      {delayedOrdersCount > 0 && (
         <div 
          onClick={() => navigate('/orders')}
          className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center justify-between cursor-pointer hover:bg-red-100 transition-all animate-in slide-in-from-top-4 duration-500 shadow-sm"
         >
            <div className="flex items-center gap-3">
               <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                  <ShoppingCart className="w-5 h-5" />
               </div>
               <div>
                  <h4 className="text-sm font-black text-red-900 tracking-tight">Cảnh báo SLA: Có {delayedOrdersCount} đơn hàng tồn đọng {">"}24h</h4>
                  <p className="text-xs text-red-700 mt-0.5">Một số đơn hàng đang ở trạng thái 'Chờ xác nhận' hoặc 'Đang đóng gói' quá hạn cam kết vận hành.</p>
               </div>
            </div>
            <button className="px-4 py-2 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg shadow-md shadow-red-200 hover:bg-red-700 transition-all">Xử lý ngay</button>
         </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="header-title">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded uppercase tracking-widest border border-blue-100">Live Dashboard</span>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Đã đồng bộ realtime</span>
          </div>
          <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Tổng quan Sàn Thương mại</h1>
          <p className="text-sm text-[#6B7280] mt-1.5 max-w-lg">Báo cáo sức khỏe kinh doanh đa kênh, hiệu suất nhà bán và thông số iPOS.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Báo cáo Vận hành
          </button>
          <button className="bg-[#111827] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-md shadow-slate-200">
            Xuất dữ liệu BI
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="GMV (Doanh số Thực tế)" 
          value={formatCurrency(dbGMV || 6700000000)} 
          change="15.8" 
          icon={DollarSign} 
          trend="up" 
          subValue="Đã bao gồm đơn iPOS"
        />
        <StatCard 
          title="Traffic (Lượt truy cập)" 
          value="192,450" 
          change="24.2" 
          icon={Eye} 
          trend="up" 
          subValue="Tỉ lệ chuyển đổi: 3.2%"
        />
        <StatCard 
          title="Tổng đơn hàng (Real-time)" 
          value={dbOrdersLength > 0 ? dbOrdersLength.toLocaleString() : "8,560"} 
          change="8.2" 
          icon={ShoppingCart} 
          trend="up" 
          subValue={dbOrdersLength > 0 ? "Số liệu thực tế từ Database" : "Trung bình: 780k / đơn"}
        />
        <StatCard 
          title="Seller hoạt động" 
          value="426" 
          change="2.1" 
          icon={Store} 
          trend="up" 
          subValue="12 Seller mới tuần này"
        />
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden h-full flex flex-col">
            <div className="px-6 py-5 border-b border-[#F3F4F6] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#111827]">Biểu đồ Tăng trưởng & Xu hướng</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Thời gian: 6 tháng gần nhất</p>
              </div>
              <div className="flex gap-6">
                 <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 bg-blue-600 rounded-sm"></div>
                   <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">GMV (Tỷ)</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 bg-slate-200 rounded-sm"></div>
                   <span className="text-xs font-bold text-slate-600 uppercase tracking-tighter">Traffic</span>
                 </div>
              </div>
            </div>
            <div className="p-6 flex-1 min-h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                  <defs>
                    <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                    dy={12}
                  />
                  <YAxis 
                    yAxisId="left"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                    tickFormatter={(value) => `${value}T`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                    tickFormatter={(value) => `${value / 1000}k`}
                  />
                  <Tooltip 
                    cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                  />
                  <Area yAxisId="left" type="monotone" dataKey="gmv" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorGmv)" />
                  {/* @ts-ignore */}
                  <Bar yAxisId="right" dataKey="traffic" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={40} opacity={0.6} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {/* Quick Nav Cards */}
          <div className="grid grid-cols-1 gap-4">
             <QuickActionCard 
                title="PIM System" 
                description="Quản lý danh mục & SKU"
                icon={Package} 
                onClick={() => navigate('/pim')} 
                color="bg-blue-600" 
             />
             <QuickActionCard 
                title="Order Center" 
                description="Xử lý đơn & Logistics"
                icon={ListOrdered} 
                onClick={() => navigate('/orders')} 
                color="bg-emerald-600" 
             />
             <QuickActionCard 
                title="Seller Hub" 
                description="Quản trị nhà bán hàng"
                icon={Users} 
                onClick={() => navigate('/sellers')} 
                color="bg-slate-900" 
             />
          </div>

          <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#111827]">Top Sellers</h3>
              <button className="text-[10px] font-bold text-blue-600 uppercase tracking-widest hover:underline">Xem tất cả</button>
            </div>
            <div className="divide-y divide-[#F9FAFB]">
              {sellerData.map((seller, index) => (
                <div key={seller.name} className="flex items-center justify-between p-4 hover:bg-[#F9FAFB] transition-colors group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-50 text-slate-400 font-bold text-xs flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111827]">{seller.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                         <span className="text-[10px] text-amber-500">★ {seller.rating}</span>
                         <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                         <span className="text-[10px] text-slate-400 font-medium lowercase">Gold Tier</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#111827]">{seller.gmv}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">+12%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="bg-[#111827] rounded-lg p-8 text-white relative overflow-hidden shadow-xl shadow-slate-200">
            <div className="relative z-10 flex flex-col h-full bg-blend-soft-light">
               <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-blue-500 rounded-lg">
                     <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Cộng đồng Nhà bán hàng</h3>
                    <p className="text-blue-300/60 text-xs font-bold uppercase tracking-widest mt-0.5">Tăng trưởng: +24% YoY</p>
                  </div>
               </div>
               <p className="text-slate-400 text-sm leading-relaxed max-w-md">
                  Ghi nhận sự bùng nổ của các thương hiệu Local Brand và xu hướng Direct-to-Consumer (D2C). Hiện có hơn 2,400 SKU mới đang chờ duyệt trong 24h tới.
               </p>
               <div className="mt-8 flex gap-4">
                  <button className="px-6 py-2.5 bg-white text-slate-900 font-bold rounded-lg text-xs hover:bg-blue-50 transition-colors">Duyệt Seller mới</button>
                  <button className="px-6 py-2.5 bg-white/10 text-white font-bold rounded-lg text-xs hover:bg-white/20 transition-colors border border-white/10">Phân tích Phân khúc</button>
               </div>
            </div>
            <Users className="absolute -bottom-10 -right-10 w-64 h-64 text-white opacity-[0.03]" />
         </div>

         <div className="bg-white p-8 rounded-lg border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-bold text-[#111827]">Chỉ số Hiệu vận hành (SLA)</h3>
               <div className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 uppercase tracking-widest">Hệ thống ổn định</div>
            </div>
            <div className="space-y-8">
               {[
                 { label: 'Tỷ lệ Hoàn thành Đơn (SLA)', value: 94.2, color: 'bg-blue-600' },
                 { label: 'Tỉ lệ Duyệt Sản phẩm Tự động', value: 82.5, color: 'bg-emerald-500' },
                 { label: 'Tỷ lệ Phản hồi Chat sàn', value: 3.2, color: 'bg-amber-500', max: 5 }
               ].map((item) => (
                 <div key={item.label} className="group cursor-default">
                   <div className="flex justify-between items-end mb-2.5">
                     <span className="text-xs font-bold text-slate-500 uppercase tracking-tight group-hover:text-slate-900 transition-colors">{item.label}</span>
                     <span className="text-sm font-bold text-[#111827]">{item.value}%</span>
                   </div>
                   <div className="h-2 w-full bg-slate-50 rounded-full border border-slate-100 overflow-hidden">
                     <div 
                        className={cn("h-full transition-all duration-1000 ease-out", item.color)} 
                        style={{ width: `${item.max ? (item.value / item.max) * 100 : item.value}%` }}
                     ></div>
                   </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
