import fs from 'fs';

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

// 1. Add default layouts for performance and finance
const newLayouts = `
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

`;
code = code.replace(
  /const defaultOverviewLayout = \{/,
  newLayouts + "const defaultOverviewLayout = {"
);

// 2. Replace performance tab grid
// It starts with: <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
// And ends right before {activeTab === 'finance'
const perfLayoutCode = `
 <ResponsiveGridLayout
  className="layout w-full -mx-4 md:mx-0"
  layouts={defaultPerformanceLayout}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
  rowHeight={100}
  draggableHandle=".drag-handle"
  margin={[24, 24]}
 >
  {config.showSLA && (
  <div key="sla" className="bg-stone-900 text-[#FAF9F5] rounded-xl shadow-sm relative overflow-hidden group flex flex-col h-full w-full">
  <div className="drag-handle cursor-move p-6 relative z-10 flex items-center justify-between mb-2">
  <h3 className="font-bold text-[#FAF9F5] text-lg flex items-center gap-2 pointer-events-none">
  <Activity className="w-5 h-5 text-orange-500" />
  Báo cáo Vận hành
  </h3>
  <div className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1.5 pointer-events-none">
  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
  Live
  </div>
  </div>
  
  <div className="px-6 flex-1 flex flex-col justify-end relative z-10 pb-6 pointer-events-none">
  <div className="grid grid-cols-2 gap-4 mb-8">
  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
  <div className="text-[10px] text-stone-400 uppercase tracking-widest mb-1 font-bold">Giao đúng hạn</div>
  <div className="text-2xl font-bold flex items-baseline gap-1">
  98.5<span className="text-sm font-normal text-stone-400">%</span>
  </div>
  <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">+1.2% <TrendingUp className="w-3 h-3"/></div>
  </div>
  <div className="bg-white/5 border border-white/10 rounded-lg p-4">
  <div className="text-[10px] text-stone-400 uppercase tracking-widest mb-1 font-bold">Lỗi / Sự cố</div>
  <div className="text-2xl font-bold flex items-baseline gap-1">
  1.2<span className="text-sm font-normal text-stone-400">%</span>
  </div>
  <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">-0.4% <TrendingDown className="w-3 h-3"/></div>
  </div>
  <div className="bg-white/5 border border-white/10 rounded-lg p-4 col-span-2 flex justify-between items-center">
  <div>
  <div className="text-[10px] text-stone-400 uppercase tracking-widest mb-1 font-bold">Xử lý Đơn (TB)</div>
  <div className="text-2xl font-bold flex items-baseline gap-1">
  2.4<span className="text-sm font-normal text-stone-400">giờ</span>
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
  <span className="text-xs font-bold text-stone-300">{item.label}</span>
  <span className="text-sm font-black text-[#FAF9F5]">{item.value}{item.unit}</span>
  </div>
  <div className="h-1.5 w-full bg-stone-800 rounded-full overflow-hidden">
  <div className={cn("h-full transition-all duration-1000", item.color)} style={{ width: \`\${item.value}%\` }}></div>
  </div>
  </div>
  ))}
  </div>
  </div>
  <div className="absolute -top-24 -right-24 w-64 h-64 bg-stone-800/20 blur-3xl rounded-full pointer-events-none"></div>
  </div>
  )}

  {config.showHourlyOrders && (
  <div key="hourlyOrders" className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col overflow-hidden h-full w-full">
  <div className="drag-handle cursor-move px-6 py-5 border-b border-stone-100 flex items-center justify-between hover:bg-stone-50 transition-colors">
  <h3 className="font-bold text-stone-900 text-lg pointer-events-none">Đơn hàng theo Giờ</h3>
  </div>
  <div className="p-6 flex-1 min-h-0 h-full">
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
 </ResponsiveGridLayout>
`;

code = code.replace(
  /<div className="grid grid-cols-1 xl:grid-cols-2 gap-6">[\s\S]*?(?= \{activeTab === 'finance')/,
  perfLayoutCode + "  </div>\n  )}\n\n"
);

// 3. Replace finance tab
const financeLayoutCode = `
 <ResponsiveGridLayout
  className="layout w-full -mx-4 md:mx-0"
  layouts={defaultFinanceLayout}
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
  <div key="revenueExpense" className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col h-full w-full overflow-hidden">
  <div className="drag-handle cursor-move px-6 py-5 border-b border-stone-100 flex items-center justify-between hover:bg-stone-50 transition-colors">
  <h3 className="font-bold text-indigo-900 text-lg flex items-center gap-2 pointer-events-none">
  <LineChartIcon className="w-5 h-5 text-orange-700" />
  Biểu đồ Thu Chi (Tháng)
  </h3>
  </div>
  <div className="p-6 flex-1 min-h-0 h-full">
  <ResponsiveContainer width="100%" height="100%">
  <BarChart data={financeData}>
  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
  <YAxis tickFormatter={(value) => \`\${value}tr\`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
  <Tooltip 
  cursor={{ fill: '#F3F4F6' }}
  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
  formatter={(value) => [\`\${value} triệu VNĐ\`, '']}
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
  <div key="cashFlow" className="bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col h-full w-full overflow-hidden">
  <div className="drag-handle cursor-move px-6 py-5 border-b border-stone-100 flex items-center justify-between hover:bg-stone-50 transition-colors">
  <h3 className="font-bold text-stone-900 text-lg flex items-center gap-2 pointer-events-none">
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
  <YAxis tickFormatter={(value) => \`\${value}tr\`} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dx={-10} />
  <Tooltip 
  cursor={{ stroke: '#94A3B8', strokeWidth: 1, strokeDasharray: '4 4' }}
  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
  formatter={(value) => [\`\${value} triệu VNĐ\`, '']}
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
`;

code = code.replace(
  /\{config\.showFinanceStats && \([\s\S]*?(?= <\/div>\n <\/div>\n \);)/,
  financeLayoutCode + "\n  </div>"
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
