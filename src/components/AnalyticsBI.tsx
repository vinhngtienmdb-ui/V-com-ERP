import { DraggableGrid } from './ui/DraggableGrid';
import React from 'react';
import { 
 BarChart3, 
 TrendingUp, 
 Users, 
 ShieldAlert, 
 Zap, 
 PieChart, 
 ArrowUpRight, 
 ArrowDownRight, 
 Radar, 
 Filter, 
 Download,
 AlertCircle,
 ShoppingBag,
 Store,
 Percent,
 Award,
 Layers,
 Globe,
 Sparkles,
 Activity,
 Calendar
} from 'lucide-react';
import { 
 AreaChart, 
 Area, 
 XAxis, 
 YAxis, 
 CartesianGrid, 
 Tooltip, 
 ResponsiveContainer,
 BarChart,
 Bar,
 Cell,
 Legend,
 LineChart,
 Line,
 PieChart as RechartsPieChart,
 Pie
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';

const RFM_DATA = [
 { group: 'Khách hàng VIP', count: 120, value: 450000000 },
 { group: 'Đông đảo/Tiềm năng', count: 450, value: 850000000 },
 { group: 'Có nguy cơ rời bỏ', count: 180, value: 120000000 },
 { group: 'Dormant (Ngủ đông)', count: 320, value: 45000000 },
];

const ANALYTICS_TRENDS = [
 { month: 'T10', aov: 420, clv: 2400 },
 { month: 'T11', aov: 450, clv: 2600 },
 { month: 'T12', aov: 520, clv: 3000 },
 { month: 'T1', aov: 480, clv: 2800 },
 { month: 'T2', aov: 490, clv: 3100 },
 { month: 'T3', aov: 550, clv: 3500 },
];

const CHANNEL_DATA_7_DAYS = [
  { epoch: '27/05', 'iPOS (Tại quầy)': 45000000, 'Shopee': 38000000, 'Lazada': 18000000, 'TikTok Shop': 28000000, 'Delivery (App)': 12000000, 'eCommerce (Website)': 25000000, 'NextHub (B2B)': 15000000 },
  { epoch: '28/05', 'iPOS (Tại quầy)': 48000000, 'Shopee': 42000000, 'Lazada': 19000000, 'TikTok Shop': 32000000, 'Delivery (App)': 14000000, 'eCommerce (Website)': 28000000, 'NextHub (B2B)': 18000000 },
  { epoch: '29/05', 'iPOS (Tại quầy)': 52000000, 'Shopee': 40000000, 'Lazada': 15000000, 'TikTok Shop': 35000000, 'Delivery (App)': 15000000, 'eCommerce (Website)': 31000000, 'NextHub (B2B)': 19000000 },
  { epoch: '30/05', 'iPOS (Tại quầy)': 68000000, 'Shopee': 54000000, 'Lazada': 24000000, 'TikTok Shop': 52000000, 'Delivery (App)': 28000000, 'eCommerce (Website)': 45000000, 'NextHub (B2B)': 28000000 },
  { epoch: '31/05', 'iPOS (Tại quầy)': 85000000, 'Shopee': 68000000, 'Lazada': 31000000, 'TikTok Shop': 65000000, 'Delivery (App)': 35000000, 'eCommerce (Website)': 59000000, 'NextHub (B2B)': 36000000 },
  { epoch: '01/06', 'iPOS (Tại quầy)': 95000000, 'Shopee': 72000000, 'Lazada': 28000000, 'TikTok Shop': 70000000, 'Delivery (App)': 38000000, 'eCommerce (Website)': 64000000, 'NextHub (B2B)': 42000000 },
  { epoch: '02/06', 'iPOS (Tại quầy)': 50000000, 'Shopee': 45000000, 'Lazada': 22000000, 'TikTok Shop': 31000000, 'Delivery (App)': 16500000, 'eCommerce (Website)': 33000000, 'NextHub (B2B)': 22000000 },
];

const CHANNEL_DATA_30_DAYS = [
  { epoch: 'Tuần 1', 'iPOS (Tại quầy)': 312000000, 'Shopee': 288000000, 'Lazada': 124000000, 'TikTok Shop': 195000000, 'Delivery (App)': 88000000, 'eCommerce (Website)': 175000000, 'NextHub (B2B)': 112000000 },
  { epoch: 'Tuần 2', 'iPOS (Tại quầy)': 345000000, 'Shopee': 310000000, 'Lazada': 118000000, 'TikTok Shop': 240000000, 'Delivery (App)': 92000000, 'eCommerce (Website)': 190000000, 'NextHub (B2B)': 125000000 },
  { epoch: 'Tuần 3', 'iPOS (Tại quầy)': 328000000, 'Shopee': 345000000, 'Lazada': 142000000, 'TikTok Shop': 295000000, 'Delivery (App)': 105000000, 'eCommerce (Website)': 215000000, 'NextHub (B2B)': 138000000 },
  { epoch: 'Tuần 4', 'iPOS (Tại quầy)': 443000000, 'Shopee': 359000000, 'Lazada': 157000000, 'TikTok Shop': 343000000, 'Delivery (App)': 158500000, 'eCommerce (Website)': 298000000, 'NextHub (B2B)': 188000000 },
];

const CHANNEL_DATA_6_MONTHS = [
  { epoch: 'Tháng 1', 'iPOS (Tại quầy)': 1250000000, 'Shopee': 1120000000, 'Lazada': 480000000, 'TikTok Shop': 750000000, 'Delivery (App)': 340000000, 'eCommerce (Website)': 720000000, 'NextHub (B2B)': 480000000 },
  { epoch: 'Tháng 2', 'iPOS (Tại quầy)': 1180000000, 'Shopee': 1190000000, 'Lazada': 450000000, 'TikTok Shop': 890000000, 'Delivery (App)': 350000000, 'eCommerce (Website)': 690000000, 'NextHub (B2B)': 490000000 },
  { epoch: 'Tháng 3', 'iPOS (Tại quầy)': 1450000000, 'Shopee': 1350000000, 'Lazada': 540000000, 'TikTok Shop': 1120000000, 'Delivery (App)': 420000000, 'eCommerce (Website)': 880000000, 'NextHub (B2B)': 590000000 },
  { epoch: 'Tháng 4', 'iPOS (Tại quầy)': 1410000000, 'Shopee': 1390000000, 'Lazada': 510000000, 'TikTok Shop': 1360000000, 'Delivery (App)': 440000000, 'eCommerce (Website)': 910000000, 'NextHub (B2B)': 640000000 },
  { epoch: 'Tháng 5', 'iPOS (Tại quầy)': 1720000000, 'Shopee': 1650000000, 'Lazada': 620000000, 'TikTok Shop': 1880000000, 'Delivery (App)': 590000000, 'eCommerce (Website)': 1120000000, 'NextHub (B2B)': 780000000 },
  { epoch: 'Tháng 6', 'iPOS (Tại quầy)': 1850000000, 'Shopee': 1780000000, 'Lazada': 680000000, 'TikTok Shop': 2250000000, 'Delivery (App)': 640000000, 'eCommerce (Website)': 1250000000, 'NextHub (B2B)': 890000000 },
];

const CHANNEL_METADATA = [
  {
    name: 'iPOS (Tại quầy)',
    color: '#4F46E5',
    commissionFee: '0%',
    desc: 'Bán trực tiếp tại cửa hàng, doanh thu thuần mặt bằng, không mất phí chiết khấu hoa hồng sàn.',
    growth: '+8.4%',
    avgOrder: 185000,
    ordersCount: 4210
  },
  {
    name: 'eCommerce (Website)',
    color: '#3B82F6',
    commissionFee: '1.5%',
    desc: 'Website thương mại điện tử chính hãng VComm. Tối ưu chi phí hoa hồng, dữ liệu khách hàng sở hữu.',
    growth: '+18.5%',
    avgOrder: 350000,
    ordersCount: 1820
  },
  {
    name: 'NextHub (B2B)',
    color: '#EC4899',
    commissionFee: '5%',
    desc: 'Kênh cộng tác viên bán chéo NextHub. Tận dụng mạng lưới bán hàng xã hội quy mô lớn.',
    growth: '+22.4%',
    avgOrder: 450000,
    ordersCount: 950
  },
  {
    name: 'Shopee',
    color: '#EA580C',
    commissionFee: '12%',
    desc: 'Bán online qua gian hàng Shopee Mall, tập trung tối đa đẩy quy mô đơn hàng và tồn dư.',
    growth: '+14.2%',
    avgOrder: 240000,
    ordersCount: 3820
  },
  {
    name: 'TikTok Shop',
    color: '#000000',
    commissionFee: '10.5%',
    desc: 'Livestream kết hợp video ngắn sáng tạo, hiệu suất chuyển đổi bùng nổ, tệp khách hàng trẻ năng động.',
    growth: '+28.6%',
    avgOrder: 210000,
    ordersCount: 5100
  },
  {
    name: 'Lazada',
    color: '#2563EB',
    commissionFee: '11%',
    desc: 'Mua sắm phân khúc trung lưu kỹ tính, khâu đóng gói niêm phong chuyên nghiệp và đơn hàng giá trị cao.',
    growth: '+3.1%',
    avgOrder: 255000,
    ordersCount: 1540
  },
  {
    name: 'Delivery (App)',
    color: '#10B981',
    commissionFee: '22%',
    desc: 'Giao nước hoả tốc iPOS qua GrabFood, Baemin & ShopeeFood. Phí sàn cao nhưng giải quyết nhanh cung giờ.',
    growth: '+11.5%',
    avgOrder: 110000,
    ordersCount: 2200
  }
];

export function AnalyticsBI() {
  const [timeRange, setTimeRange] = React.useState<'7days' | '30days' | '6months'>('7days');
  const [chartType, setChartType] = React.useState<'stacked' | 'grouped' | 'line'>('stacked');
  const [activeChannels, setActiveChannels] = React.useState<string[]>([
    'iPOS (Tại quầy)', 'eCommerce (Website)', 'NextHub (B2B)', 'Shopee', 'Lazada', 'TikTok Shop', 'Delivery (App)'
  ]);

  const currentData = timeRange === '7days' 
    ? CHANNEL_DATA_7_DAYS 
    : timeRange === '30days' 
      ? CHANNEL_DATA_30_DAYS 
      : CHANNEL_DATA_6_MONTHS;

  const channelTotals = CHANNEL_METADATA.map(ch => {
    const channelSum = currentData.reduce((acc, row) => acc + (Number(row[ch.name as keyof typeof row]) || 0), 0);
    return {
      ...ch,
      value: channelSum
    };
  });

  const activeChannelTotals = channelTotals.filter(c => activeChannels.includes(c.name) && c.value > 0);
  const totalOmnichannelSales = activeChannelTotals.reduce((sum, item) => sum + item.value, 0);
  const topChannelItem = activeChannelTotals.length > 0
    ? activeChannelTotals.reduce((max, item) => item.value > max.value ? item : max, activeChannelTotals[0])
    : channelTotals[0];

  const offlineSales = channelTotals.find(c => c.name === 'iPOS (Tại quầy)')?.value || 0;
  const onlineSales = channelTotals.filter(c => c.name !== 'iPOS (Tại quầy)' && activeChannels.includes(c.name)).reduce((sum, item) => sum + item.value, 0);
  const offlineRatio = totalOmnichannelSales > 0 ? (offlineSales / totalOmnichannelSales) * 100 : 0;
  const onlineRatio = totalOmnichannelSales > 0 ? (onlineSales / totalOmnichannelSales) * 100 : 0;

  const toggleChannel = (channelName: string) => {
    setActiveChannels(prev => 
      prev.includes(channelName)
        ? prev.filter(c => c !== channelName)
        : [...prev, channelName]
    );
  };

  return (
  <div className="space-y-8 animate-in fade-in duration-700 pb-12">
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-2">
 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-700 bg-slate-100 px-2 py-0.5 rounded">Intelligence Hub</span>
 <div className="w-1 h-1 bg-slate-900 rounded-full animate-pulse" />
 </div>
 <h1 className="font-serif tracking-tight text-3xl font-black text-slate-900 tracking-tight">Business Intelligence</h1>
 <p className="text-sm text-slate-600 font-medium mt-1">Hệ thống phân tích chuyên sâu RFM, LTV, CAC và Giám sát gian lận thời gian thực.</p>
 </div>
 <div className="flex flex-wrap gap-3">
 <button className="bg-white border border-slate-300 px-5 py-2.5 rounded-none text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm border-b-2 active:translate-y-0.5">
 <Download className="w-4 h-4 text-slate-500" />
 Xuất báo cáo (PDF/XLS)
 </button>
 <button className="bg-slate-900 text-[#FAF9F5] px-5 py-2.5 rounded-none text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5 flex items-center gap-2 hover:scale-[1.02] active:scale-95">
 <Zap className="w-4 h-4" />
 Đồng bộ dữ liệu LTV
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
 {[
 { label: 'LTV (Giá trị vòng đời)', value: 3500000, trend: '+12%', sub: 'So với Q4/2023', icon: TrendingUp, color: 'blue' },
 { label: 'CAC (Chi phí thu hút)', value: 125000, trend: '-4.5%', sub: 'Tối ưu hóa Ads', icon: ArrowDownRight, color: 'emerald' },
 { label: 'AOV (Đơn hàng trung bình)', value: 550000, trend: '+8%', sub: 'Nhờ Bundle/Groupbuy', icon: ArrowUpRight, color: 'indigo' },
 { label: 'Gian lận (Cảnh báo)', value: 12, trend: 'Critical', sub: 'Cần xử lý ngay', icon: ShieldAlert, color: 'rose', alert: true },
 ].map((stat) => (
 <div key={stat.label} className={cn(
 "relative overflow-hidden p-6 rounded-none border transition-all duration-300 hover:shadow-sm group",
 stat.alert ? "bg-rose-50 border-rose-200 shadow-rose-200/20" : "bg-white border-slate-200 shadow-slate-200/50 hover:shadow-slate-900/5"
 )}>
 <div className="relative z-10 flex flex-col justify-between h-full">
 <div className="flex justify-between items-start mb-4">
 <span className={cn(
 "text-[10px] font-black uppercase tracking-widest",
 stat.alert ? "text-rose-600" : "text-slate-500"
 )}>{stat.label}</span>
 <div className={cn(
 "p-2 rounded-xl border transition-transform group-hover:rotate-12",
 stat.alert ? "bg-rose-100 border-rose-200 text-rose-600 animate-pulse" : "bg-slate-50 border-slate-200 text-slate-500 group-hover:bg-slate-100 group-hover:text-orange-700"
 )}>
 <stat.icon className="w-4 h-4" />
 </div>
 </div>
 <div>
 <div className={cn("text-2xl font-black tracking-tight mb-1", stat.alert ? "text-rose-700" : "text-slate-900")}>
 {typeof stat.value === 'number' && stat.label !== 'Gian lận (Cảnh báo)' ? formatCurrency(stat.value) : stat.value}
 </div>
 <div className="flex items-center gap-2">
 <span className={cn(
 "text-[10px] font-bold px-1.5 py-0.5 rounded",
 stat.color === 'emerald' || stat.trend.includes('+') ? "bg-emerald-100 text-emerald-700" : 
 stat.alert ? "bg-rose-200 text-rose-800" : "bg-[#EAE7DF] text-orange-800"
 )}>{stat.trend}</span>
 <span className="text-[10px] text-slate-500 font-medium">{stat.sub}</span>
 </div>
 </div>
 </div>
 {/* Decorative background circle */}
 <div className={cn(
 "absolute -bottom-6 -right-6 w-24 h-24 rounded-full blur-2xl opacity-10 transition-opacity group-hover:opacity-20",
 stat.alert ? "bg-rose-500" : "bg-slate-800"
 )} />
 </div>
 ))}
 </div>

  {/* ================= PANELS BÁO CÁO DOANH THU ĐA KÊNH: TMĐT VS TẠI QUẦY (iPOS) ================= */}
  <div className="bg-white border border-slate-200 shadow-sm p-6 space-y-6 mb-6">
    {/* Header & Controls of Multi-channel block */}
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-slate-200">
      <div>
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded">
            Omnichannel performance
          </span>
          <span className="text-[10px] font-bold text-slate-400 font-mono">Real-time Sync</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-5 h-5 text-blue-600" /> Báo cáo Hiệu quả Kênh bán hàng & Doanh thu hợp nhất
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          So sánh tương quan giữa các sàn điện tử (Shopee, Lazada, TikTok Shop), giao hàng ẩm thực và quầy thu ngân iPOS.
        </p>
      </div>

      {/* Control Switchers */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Time Period Select */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-none border border-slate-200">
          {[
            { id: '7days', label: '7 ngày qua' },
            { id: '30days', label: '30 ngày qua' },
            { id: '6months', label: '6 tháng gần đây' }
          ].map(p => (
            <button
              key={p.id}
              id={`timeRange-${p.id}`}
              onClick={() => setTimeRange(p.id as any)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-none",
                timeRange === p.id 
                  ? "bg-white text-slate-900 shadow-sm border border-slate-200 font-black" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Chart type select */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-none border border-slate-200">
          {[
            { id: 'stacked', label: 'Cột chồng' },
            { id: 'grouped', label: 'Cột ghép' },
            { id: 'line', label: 'Đường xu hướng' }
          ].map(type => (
            <button
              key={type.id}
              id={`chartType-${type.id}`}
              onClick={() => setChartType(type.id as any)}
              className={cn(
                "px-3 py-1.5 text-xs font-bold uppercase transition-all rounded-none",
                chartType === type.id 
                  ? "bg-slate-900 text-[#FAF9F5] font-black" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              )}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
    </div>

    {/* Key Insight & Filter Ribbons */}
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-none">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-slate-600 flex items-center gap-1 flex-shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-500" /> Bật/tắt biểu đồ kênh:
        </span>
        <div className="flex flex-wrap gap-2">
          {CHANNEL_METADATA.map(ch => {
            const isActive = activeChannels.includes(ch.name);
            return (
              <button
                key={ch.name}
                id={`btn-channel-${ch.name.replace(/\s+/g, '')}`}
                onClick={() => toggleChannel(ch.name)}
                className={cn(
                  "px-2.5 py-1 text-[11px] font-bold border transition-all flex items-center gap-1.5 rounded-none shadow-sm",
                  isActive 
                    ? "bg-white text-slate-800 border-b-2 font-black shadow-slate-900/5"
                    : "bg-slate-100 border-slate-200 text-slate-400 line-through hover:bg-slate-200"
                )}
                style={{ borderBottomColor: isActive ? ch.color : undefined }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
                {ch.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="text-xs font-bold text-[#2563EB] bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-none flex items-center gap-1.5">
        <Sparkles className="w-4 h-4 text-orange-600 animate-pulse" />
        Kênh hiệu quả nhất: <span className="font-extrabold uppercase text-slate-900">{topChannelItem?.name}</span> ({topChannelItem ? formatCurrency(topChannelItem.value) : '0đ'} - tăng trưởng {topChannelItem?.growth})
      </div>
    </div>

    {/* Live comparison dashboard: Charts section */}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
      {/* Chart container */}
      <div className="lg:col-span-8 border border-slate-200 p-4 relative bg-[#FAF9F5]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-mono">
            BI Comparison Chart ({timeRange === '7days' ? 'Hàng ngày' : timeRange === '30days' ? 'Hàng tuần' : 'Hàng tháng'})
          </span>
          <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5">
            Tổng cộng: <span className="text-slate-900 font-extrabold">{formatCurrency(totalOmnichannelSales)}</span>
          </span>
        </div>

        <div className="h-[360px] w-full">
          {activeChannelTotals.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <AlertCircle className="w-10 h-10 mb-2 text-slate-300 animate-bounce" />
              <p className="text-sm font-bold">Vui lòng chọn ít nhất một kênh bán hàng để hiển thị dữ liệu so sánh.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={currentData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                  <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']} 
                    contentStyle={{ borderRadius: '0px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '10px' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                  {CHANNEL_METADATA.map(ch => activeChannels.includes(ch.name) && (
                    <Line 
                      key={ch.name} 
                      type="monotone" 
                      dataKey={ch.name} 
                      stroke={ch.color} 
                      strokeWidth={3} 
                      dot={{ r: 4, strokeWidth: 2 }} 
                      activeDot={{ r: 6 }} 
                    />
                  ))}
                </LineChart>
              ) : (
                <BarChart data={currentData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="epoch" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#64748B' }} />
                  <YAxis tickFormatter={(val) => `${(val / 1000000).toFixed(0)}Tr`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 600, fill: '#64748B' }} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(Number(value)), 'Doanh thu']} 
                    contentStyle={{ borderRadius: '0px', border: '1px solid #CBD5E1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', padding: '10px' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingTop: '10px' }} />
                  {CHANNEL_METADATA.map(ch => activeChannels.includes(ch.name) && (
                    <Bar 
                      key={ch.name} 
                      dataKey={ch.name} 
                      fill={ch.color} 
                      stackId={chartType === 'stacked' ? 'a' : undefined} 
                      radius={0} 
                      barSize={chartType === 'stacked' ? 32 : 12} 
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Share / Breakdown analysis */}
      <div className="lg:col-span-4 flex flex-col justify-between border border-slate-200 p-4 bg-white">
        <div>
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest font-mono block mb-3">
            Tỉ trọng Doanh số O2O (Online vs Offline)
          </span>

          {/* Donut Chart container */}
          <div className="relative h-[190px] w-full flex items-center justify-center">
            {activeChannelTotals.length === 0 ? (
              <span className="text-xs text-slate-400 italic">Không có dữ liệu tỉ trọng</span>
            ) : (
              <>
                <div className="w-[180px] h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={activeChannelTotals}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {activeChannelTotals.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                {/* Central text for breakdown */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Offline</span>
                  <span className="text-lg font-black text-slate-800">{offlineRatio.toFixed(0)}%</span>
                  <span className="text-[9px] font-bold text-slate-400">Online {onlineRatio.toFixed(0)}%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Dynamic O2O details bar */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Store className="w-3.5 h-3.5 text-indigo-600" /> Bán tại quầy (iPOS)
              </span>
              <span className="text-slate-800">{formatCurrency(offlineSales)} ({offlineRatio.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-none overflow-hidden">
              <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${offlineRatio}%` }} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5 text-slate-700">
                <Globe className="w-3.5 h-3.5 text-orange-500" /> Đa kênh Online (TMĐT/App)
              </span>
              <span className="text-slate-800">{formatCurrency(onlineSales)} ({onlineRatio.toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-none overflow-hidden">
              <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${onlineRatio}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Financial Efficiency Comparer */}
    <div className="mt-4 pt-4 border-t border-slate-200">
      <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <Percent className="w-4 h-4 text-emerald-600" /> Đánh giá hiệu suất ròng sau chiết khấu hoa hồng của các Kênh
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {channelTotals.map(ch => {
          const isSelected = activeChannels.includes(ch.name);
          // Calculate estimate fee burden based on platform commission rate
          const rateNum = Number(ch.commissionFee.replace('%', ''));
          const platformFeeAmount = (ch.value * rateNum) / 100;
          const netRevenue = ch.value - platformFeeAmount;
          
          return (
            <div 
              key={ch.name} 
              id={`efficiency-${ch.name.replace(/\s+/g, '')}`}
              className={cn(
                "p-4 border transition-all relative overflow-hidden flex flex-col justify-between rounded-none",
                isSelected 
                  ? "bg-slate-50 border-slate-300"
                  : "bg-white border-slate-100 opacity-60 hover:opacity-100"
              )}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ch.color }} />
                    {ch.name}
                  </span>
                  <span className={cn(
                    "text-[10px] font-black px-1.5 py-0.5 font-mono",
                    ch.commissionFee === '0%' ? 'bg-emerald-100 text-emerald-800 uppercase' : 'bg-red-50 text-red-700'
                  )}>
                    Phí: {ch.commissionFee}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-3 min-h-[48px]">
                  {ch.desc}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-500 font-mono">
                  <span>Gộp:</span>
                  <span className="text-slate-800 font-bold">{formatCurrency(ch.value)}</span>
                </div>
                {rateNum > 0 && (
                  <div className="flex justify-between items-center text-[10px] font-bold text-red-500 font-mono">
                    <span>Phí sàn:</span>
                    <span>-{formatCurrency(platformFeeAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[11px] font-black text-emerald-700">
                  <span>Ước lượng ròng:</span>
                  <span>{formatCurrency(netRevenue)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
  {/* ========================================================================================= */}

 <DraggableGrid className="grid grid-cols-1 lg:grid-cols-2 gap-6" columns={2} gap={32}>
 <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm shadow-slate-200/40">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
 <Users className="w-5 h-5 text-orange-700" /> Phân tích RFM (Recency/Frequency/Monetary)
 </h3>
 <p className="text-xs text-slate-500 font-medium mt-1">Phân vị khách hàng dựa trên lịch sử mua sắm</p>
 </div>
 <select className="text-[10px] font-bold uppercase tracking-widest bg-slate-50 border border-slate-300 rounded-none px-3 py-2 outline-none focus:ring-2 focus:ring-orange-600/20">
 <option>Theo lượt khách hàng</option>
 <option>Theo giá trị quy đổi</option>
 </select>
 </div>
 <div className="h-[320px]">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={RFM_DATA} layout="vertical" margin={{ left: 20 }}>
 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
 <XAxis type="number" hide />
 <YAxis 
 dataKey="group" 
 type="category" 
 width={140} 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} 
 />
 <Tooltip 
 cursor={{ fill: '#F8FAFC', radius: 4 }} 
 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} 
 />
 <Bar dataKey="count" radius={0} barSize={32}>
 {RFM_DATA.map((entry, index) => (
 <Cell 
 key={`cell-${index}`} 
 fill={index === 0 ? '#2563EB' : index === 1 ? '#3B82F6' : index === 2 ? '#6366F1' : '#94A3B8'} 
 className="hover:opacity-80 transition-opacity"
 />
 ))}
 </Bar>
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 <div className="bg-white p-6 rounded-none border border-slate-200 shadow-sm shadow-slate-200/40">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-lg font-black text-slate-900 flex items-center gap-3">
 <TrendingUp className="w-5 h-5 text-emerald-600" /> Xu hướng AOV & CLV (Predictive)
 </h3>
 <p className="text-xs text-slate-500 font-medium mt-1">Dự báo chuyển động tài chính trong 6 tháng tới</p>
 </div>
 <div className="flex gap-4 p-1.5 bg-slate-50 rounded-xl">
 <div className="flex items-center gap-2 px-2">
 <div className="w-2 h-2 rounded-full bg-slate-900" />
 <span className="text-[10px] font-black uppercase text-slate-600">CLV</span>
 </div>
 <div className="flex items-center gap-2 px-2">
 <div className="w-2 h-2 rounded-full bg-emerald-500" />
 <span className="text-[10px] font-black uppercase text-slate-600">AOV</span>
 </div>
 </div>
 </div>
 <div className="h-[320px]">
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={ANALYTICS_TRENDS}>
 <defs>
 <linearGradient id="colorCLV" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="colorAOV" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
 <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
 <XAxis 
 dataKey="month" 
 axisLine={false} 
 tickLine={false} 
 tick={{ fontSize: 11, fontWeight: 700, fill: '#94A3B8' }} 
 dy={10} 
 />
 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#94A3B8' }} />
 <Tooltip 
 contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '12px' }} 
 />
 <Area type="monotone" dataKey="clv" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorCLV)" />
 <Area type="monotone" dataKey="aov" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorAOV)" />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 </DraggableGrid>

 {/* Fraud Detection Command Console */}
 <div className="bg-slate-900 text-[#FAF9F5] p-6 rounded-none relative overflow-hidden shadow-sm shadow-blue-900/20">
 <div className="absolute top-0 right-0 p-6 opacity-[0.05] pointer-events-none">
 <Radar className="w-80 h-80 rotate-12" />
 </div>
 
 <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
 <div className="lg:col-span-2 space-y-6">
 <div className="flex items-center gap-4">
 <div className="p-4 bg-rose-600 rounded-none shadow-sm shadow-rose-600/30 group hover:rotate-12 transition-transform duration-500">
 <ShieldAlert className="w-7 h-7 text-[#FAF9F5]" />
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">Security Node</span>
 <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
 </div>
 <h3 className="text-2xl font-black tracking-tight">AI Fraud Detection Guardian</h3>
 </div>
 </div>
 
 <p className="text-slate-500 text-base font-medium leading-relaxed max-w-2xl bg-white/5 p-4 rounded-lg border border-white/5">
 Phân tích hành vi chuỗi cung ứng và thanh toán đa điểm. Tự động gắn cờ cho các tài khoản có dấu hiệu Sybil Attack hoặc can thiệp tham số Voucher hệ thống.
 </p>
 
 <div className="flex flex-wrap gap-4 pt-2">
 <button className="px-6 py-3 bg-white text-slate-900 font-black rounded-none text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all shadow-sm shadow-white/10 .5">
 Open Security Console
 </button>
 <button className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/10 text-[#FAF9F5] font-black rounded-none text-[11px] uppercase tracking-widest hover:bg-white/20 transition-all">
 Configure AI Policy
 </button>
 </div>
 </div>

 <div className="space-y-4">
 <div className="p-6 bg-white/5 backdrop-blur-2xl rounded-none border border-white/10 space-y-4 shadow-sm">
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
 <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" /> Incident Detected
 </span>
 <span className="text-[10px] text-slate-600 font-bold font-mono">2 min ago</span>
 </div>
 <p className="text-xs font-bold text-slate-400 leading-relaxed italic">
 "Detecting 124 orders using Voucher SALE153 from same Fingerprint ID cluster."
 </p>
 <div className="pt-2 border-t border-white/5">
 <button className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-[#FAF9F5] rounded-none text-[10px] font-black uppercase tracking-widest transition-all border border-rose-500/30">
 Immediate Block & Void
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
