const fs = require('fs');

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  /<div className="grid grid-cols-1 xl:grid-cols-12 gap-6">[\s\S]*?(?= \{activeTab === 'performance')/,
  ` <ResponsiveGridLayout
  className="layout w-full -mx-4 md:mx-0"
  layouts={defaultOverviewLayout}
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
  rowHeight={100}
  draggableHandle=".drag-handle"
  margin={[24, 24]}
 >
  {config.showMainChart && (
  <div key="mainChart" className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-sm transition-shadow overflow-hidden flex flex-col h-full w-full">
  <div className="drag-handle cursor-move px-6 py-5 border-b border-stone-100 flex items-center justify-between bg-stone-50/50 hover:bg-stone-100 transition-colors">
  <div>
  <h3 className="font-bold text-indigo-900 tracking-tight text-lg pointer-events-none">Biểu đồ Tăng trưởng & Xu hướng</h3>
  </div>
  <div className="flex gap-6 pointer-events-none">
  <div className="flex items-center gap-2">
  <div className="w-2.5 h-2.5 bg-stone-900 rounded-sm"></div>
  <span className="text-xs font-bold text-stone-600 uppercase">GMV (Tỷ)</span>
  </div>
  <div className="flex items-center gap-2">
  <div className="w-2.5 h-2.5 bg-stone-200 rounded-sm"></div>
  <span className="text-xs font-bold text-stone-600 uppercase">Traffic</span>
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
  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} tickFormatter={(value) => \`\${value}T\`} />
  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }} tickFormatter={(value) => \`\${value / 1000}k\`} />
  <Tooltip cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}/>
  <Area yAxisId="left" type="monotone" dataKey="gmv" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorGmv)" />
  {/* @ts-ignore */}
  <Bar yAxisId="right" dataKey="traffic" fill="#E2E8F0" radius={[4, 4, 0, 0]} barSize={40} opacity={0.6} />
  </AreaChart>
  </ResponsiveContainer>
  </div>
  </div>
  )}

  {config.showCommunity && (
  <div key="community" className="bg-gradient-to-br from-stone-900 to-[#0B1120] rounded-xl text-[#FAF9F5] relative overflow-hidden shadow-sm shadow-stone-900/10 border border-stone-800 flex flex-col justify-between h-full w-full">
  <div className="drag-handle cursor-move px-8 py-6 relative z-10 hover:bg-white/5 transition-colors rounded-t-xl rounded-b-xl h-full flex flex-col">
  <div className="flex items-center gap-4 mb-6 pointer-events-none">
  <div className="p-3 bg-stone-800 rounded-lg shadow-sm shadow-stone-900/5 shadow-inner border border-stone-700">
  <Users className="w-6 h-6 text-[#FAF9F5]" />
  </div>
  <div>
  <h3 className="text-lg font-bold tracking-tight">Cộng đồng Seller</h3>
  </div>
  </div>
  <p className="text-stone-400 text-xs leading-relaxed max-w-sm pointer-events-none mb-6">Hơn 2,400 SKU mới đang chờ duyệt trong 24h tới.</p>
  <div className="relative z-10 w-full mt-auto">
  <button className="px-5 w-fit py-2 pointer-events-auto bg-white text-stone-900 font-bold rounded-lg text-xs hover:bg-[#F2F0E9] transition-all shadow-sm">Duyệt Seller mới</button>
  </div>
  </div>
  <Users className="absolute -bottom-8 -right-8 w-48 h-48 text-[#FAF9F5] opacity-[0.02] pointer-events-none" />
  </div>
  )}

  {config.showCategorySplit && (
  <div key="categorySplit" className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col h-full w-full">
  <div className="drag-handle cursor-move hover:bg-stone-50 transition-colors px-5 py-4 border-b border-stone-100 flex items-center justify-between">
  <h3 className="font-bold text-indigo-900 text-sm pointer-events-none">Tỷ trọng Ngành</h3>
  </div>
  <div className="p-4 flex-1 h-full min-h-0">
  <ResponsiveContainer width="100%" height="100%">
  <PieChart>
  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
  {categoryData.map((entry, index) => <Cell key={\`cell-\${index}\`} fill={COLORS[index % COLORS.length]} />)}
  </Pie>
  <Tooltip />
  <Legend verticalAlign="bottom" height={24} iconType="circle" wrapperStyle={{ fontSize: '11px' }}/>
  </PieChart>
  </ResponsiveContainer>
  </div>
  </div>
  )}

  {config.showTopSellers && (
  <div key="topSellers" className="bg-white rounded-xl border border-stone-200 shadow-sm hover:shadow-sm transition-shadow overflow-hidden flex flex-col h-full w-full">
  <div className="drag-handle cursor-move hover:bg-stone-50/90 transition-colors sticky top-0 z-10 px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/90 backdrop-blur-sm rounded-t-xl">
  <h3 className="font-bold text-indigo-900 text-sm tracking-tight pointer-events-none">Top Sellers</h3>
  <button className="text-[10px] font-bold text-orange-700 uppercase tracking-widest hover:text-blue-800 transition-colors pointer-events-auto">Xem tất cả</button>
  </div>
  <div className="divide-y divide-stone-100 overflow-y-auto flex-1 custom-scrollbar">
  {sellerData.map((seller, index) => (
  <div key={seller.name} className="flex items-center justify-between p-4 hover:bg-stone-50 transition-colors group cursor-pointer pointer-events-auto">
  <div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-500 font-bold text-xs flex items-center justify-center border border-stone-200/60 group-hover:bg-[#F2F0E9] group-hover:text-orange-800 transition-all">
  {index + 1}
  </div>
  <div>
  <p className="text-xs font-bold text-stone-900">{seller.name}</p>
  <div className="flex items-center gap-1.5 mt-0.5">
  <span className="text-[10px] text-amber-500 font-bold">★ {seller.rating}</span>
  </div>
  </div>
  </div>
  <div className="text-right">
  <p className="text-xs font-bold text-stone-900">{seller.gmv}</p>
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
`
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
