const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'components', 'Customers.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// Find start of CustomerDetailModal
const startStr = 'const CustomerDetailModal = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => {';
const startIndex = content.indexOf(startStr);
if (startIndex === -1) {
  console.error('Could not find start of CustomerDetailModal');
  process.exit(1);
}

// Find start of next component: AiMessageQuickModal
const endStr = 'const AiMessageQuickModal = ({ customer, onClose }: { customer: Customer; onClose: () => void }) => {';
const endIndex = content.indexOf(endStr);
if (endIndex === -1) {
  console.error('Could not find start of AiMessageQuickModal');
  process.exit(1);
}

console.log('Found CustomerDetailModal from index', startIndex, 'to', endIndex);

const replacementText = `const CustomerDetailModal = ({ 
  customer, 
  onClose,
  leases = [],
  transactions = [],
  contracts = [],
  sellers = [],
  payouts = []
}: { 
  customer: Customer; 
  onClose: () => void;
  leases?: any[];
  transactions?: any[];
  contracts?: any[];
  sellers?: any[];
  payouts?: any[];
}) => {
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailContent, setEmailContent] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [showConvertPanel, setShowConvertPanel] = useState(false);
  const [convertAmount, setConvertAmount] = useState<number>(0);
  const [converting, setConverting] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'overview' | 'leasing' | 'seller' | 'contracts' | 'ledger'>('overview');

  const getSegmentLabel = () => {
    switch ((customer as any).segment) {
      case 'core': return 'Khách hàng Core';
      case 'old': return 'Khách hàng Cũ';
      case 'new': return 'Mới đăng ký';
      case 'potential': return 'Tiềm năng';
      default: return 'Khách hàng';
    }
  };

  const handleConvert = async () => {
    if (convertAmount <= 0 || convertAmount > (customer.walletBalance || 0)) return;
    setConverting(true);
    try {
      const cashbackDeducted = convertAmount;
      const promoAdded = Math.round(convertAmount * 1.1);

      const currentWallet = customer.walletBalance || 0;
      const currentPromo = customer.promoBalance || 0;

      const customerRef = doc(db, 'customers', customer.id);
      
      const newActivity = {
        id: 'act_' + Date.now(),
        type: 'other' as const,
        title: 'Quy đổi Cashback sang Khuyến mại',
        description: \`Quy đổi thành công \${formatCurrency(cashbackDeducted)} Cashback sang \${formatCurrency(promoAdded)} ví Khuyến mại (tỷ lệ 1.1).\`,
        date: new Date().toISOString().split('T')[0],
        status: 'Hoàn thành'
      };

      const updatedActivities = customer.activities ? [newActivity, ...customer.activities] : [newActivity];

      await updateDoc(customerRef, {
        walletBalance: currentWallet - cashbackDeducted,
        promoBalance: currentPromo + promoAdded,
        activities: updatedActivities
      });

      alert(\`Chuyển đổi thành công! Trừ \${formatCurrency(cashbackDeducted)} Cashback, cộng \${formatCurrency(promoAdded)} vào ví Khuyến mại.\`);
      setShowConvertPanel(false);
      setConvertAmount(0);
    } catch (err) {
      console.error(err);
      alert('Chuyển đổi thất bại!');
    } finally {
      setConverting(false);
    }
  };

  const handleGenerateAiMessage = async () => {
    setLoadingAi(true);
    try {
      const msg = await generateCustomerCareMessage(customer);
      // Try to parse a subject if AI returned something like "Subject: ..." or "Tiêu đề: ..."
      const subjectMatch = msg.match(/^(?:Tiêu đề|Subject):\\s*(.+?)(?:\\n|$)/i);
      if (subjectMatch) {
        setEmailSubject(subjectMatch[1].trim());
        setEmailContent(msg.replace(subjectMatch[0], '').trim());
      } else {
        setEmailSubject(\`Chương trình tri ân khách hàng \${customer.name}\`);
        setEmailContent(msg.trim());
      }
    } finally {
      setLoadingAi(false);
    }
  };

  // Logic for tier progress (Mock)
  const nextTierThreshold = 50000000;
  const progressPercent = Math.min((customer.totalSpent / nextTierThreshold) * 100, 100);

  // Linked ERP Data Filter Logic
  const customerLeases = leases.filter(l => 
    (l.phone && l.phone === customer.phone) || 
    (l.email && l.email.toLowerCase() === customer.email.toLowerCase())
  );

  const customerTransactions = transactions.filter(t => 
    (t.description && t.description.toLowerCase().includes(customer.name.toLowerCase())) ||
    (t.accountingObjectCode && t.accountingObjectCode === customer.id)
  );

  const customerContracts = contracts.filter(c => 
    c.party && (
      c.party.toLowerCase().includes(customer.name.toLowerCase()) || 
      customer.name.toLowerCase().includes(c.party.toLowerCase())
    )
  );

  const customerSeller = sellers.find(s => 
    s.sellerName && (
      s.sellerName.toLowerCase().includes(customer.name.toLowerCase()) || 
      customer.name.toLowerCase().includes(s.sellerName.toLowerCase())
    )
  );
  const customerPayouts = customerSeller 
    ? payouts.filter(p => p.sellerId === customerSeller.sellerId)
    : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-5xl shadow-sm h-[90vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#111827]">Hồ sơ Khách hàng 360°</h2>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase flex items-center gap-1 border border-amber-200">
              <Trophy className="w-3 h-3" /> Hạng Vàng
            </span>
            <span className="px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full uppercase flex items-center gap-1 border border-blue-200">
              {getSegmentLabel()}
            </span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 shrink-0 overflow-x-auto">
          {[
            { id: 'overview', label: 'Tổng quan & Ví' },
            { id: 'leasing', label: \`Thuê thiết bị (\${customerLeases.length})\` },
            { id: 'seller', label: customerSeller ? \`Tín nhiệm Nhà bán (\${customerSeller.tier})\` : 'Tín nhiệm Nhà bán' },
            { id: 'contracts', label: \`Hợp đồng (\${customerContracts.length})\` },
            { id: 'ledger', label: \`Sổ cái Tài chính (\${customerTransactions.length})\` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveModalTab(tab.id as any)}
              className={cn(
                "px-5 py-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap",
                activeModalTab === tab.id 
                  ? "border-primary-600 text-primary-600 bg-white" 
                  : "border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-100/50"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Body Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* Persistent Left Sidebar */}
          <div className="w-80 border-r border-slate-200 overflow-y-auto p-5 space-y-4 shrink-0 bg-slate-50/50">
            <div className="p-6 bg-white border border-slate-200 rounded-xl text-center shadow-sm">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-3xl font-bold mb-4 mx-auto border-4 border-white shadow-sm">
                {customer.name.split(' ').pop()?.charAt(0)}
              </div>
              <h3 className="font-bold text-lg text-slate-900">{customer.name}</h3>
              <p className="text-sm text-slate-500 mb-4 font-mono">{customer.id}</p>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200"><Mail className="w-4 h-4 text-slate-500" /> <span className="truncate">{customer.email}</span></div>
                <div className="flex items-center gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200"><Smartphone className="w-4 h-4 text-slate-500" /> {customer.phone}</div>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-bold text-[10px] uppercase text-slate-500 tracking-widest">Mục tiêu lên hạng</h4>
                <span className="text-[10px] font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded">{Math.round(progressPercent)}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-primary-600 transition-all duration-1000" style={{ width: \`\${progressPercent}%\` }}></div>
              </div>
              <p className="text-[10px] text-slate-500 mt-2.5 text-center">Tích lũy thêm <span className="font-bold text-slate-700">{formatCurrency(nextTierThreshold - customer.totalSpent)}</span> để lên Kim Cương</p>
            </div>
            
            <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm relative overflow-hidden group">
              <h4 className="font-bold text-xs mb-3 text-blue-800 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5" /> Phân giải RFM Score
              </h4>
              <div className="space-y-2.5">
                {[
                  { label: 'Recency', score: customer.rfmScore?.recency || 1 },
                  { label: 'Frequency', score: customer.rfmScore?.frequency || 1 },
                  { label: 'Monetary', score: customer.rfmScore?.monetary || 1 },
                ].map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-orange-700 font-bold uppercase tracking-tighter">{item.label}</span> 
                      <span className="font-black text-blue-900">{item.score}/5</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-slate-800 transition-all" style={{ width: \`\${(item.score / 5) * 100}%\` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100 shadow-sm space-y-3">
              <h4 className="font-bold text-xs text-emerald-800 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5" /> Tài sản & Thưởng
              </h4>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded-lg border border-emerald-100/50 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Ví Hoàn Tiền (Cashback)</span>
                    <button className="text-[9px] text-[#FAF9F5] bg-emerald-600 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-emerald-700 relative z-10">RÚT TIỀN</button>
                  </div>
                  <span className="text-lg font-bold text-emerald-900 leading-none tracking-tight">{formatCurrency(customer.walletBalance || 0)}</span>
                </div>
                
                <div className="bg-white p-3 rounded-lg border border-blue-100/50 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Ví Khuyến Mại</span>
                    <button className="text-[9px] text-blue-600 border border-blue-200 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-blue-50 relative z-10">Lịch sử</button>
                  </div>
                  <span className="text-lg font-bold text-blue-900 leading-none tracking-tight">{formatCurrency(customer.promoBalance || 0)}</span>
                </div>

                <div className="bg-white p-3 rounded-lg border border-purple-100/50 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Ví Điểm Loyalty</span>
                    <button className="text-[9px] text-[#FAF9F5] bg-purple-600 px-1.5 py-0.5 rounded font-bold uppercase hover:bg-purple-700 relative z-10">Shop Đổi Điểm</button>
                  </div>
                  <span className="text-lg font-bold text-purple-900 leading-none tracking-tight">{customer.points || 0} <span className="text-xs font-medium text-purple-600">pts</span></span>
                </div>
                
                <div className="pt-1 space-y-3">
                  <button 
                    onClick={() => setShowConvertPanel(!showConvertPanel)} 
                    className="w-full py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-[10px] font-bold uppercase rounded transition-colors flex justify-center items-center gap-1.5 shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" /> ĐỔI HOÀN TIỀN LẤY KHUYẾN MẠI
                  </button>

                  {showConvertPanel && (
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-3 animate-in slide-in-from-top-2 duration-200 shadow-inner">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                        <span>Số tiền muốn quy đổi</span>
                        <span className="text-emerald-600">Max: {formatCurrency(customer.walletBalance || 0)}</span>
                      </div>
                      
                      <input 
                        type="range" 
                        min="0" 
                        max={customer.walletBalance || 0} 
                        step="1000"
                        value={convertAmount} 
                        onChange={(e) => setConvertAmount(Number(e.target.value))} 
                        className="w-full accent-emerald-600"
                      />

                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          min="0" 
                          max={customer.walletBalance || 0} 
                          value={convertAmount}
                          onChange={(e) => {
                            const val = Math.min(Number(e.target.value), customer.walletBalance || 0);
                            setConvertAmount(val);
                          }}
                          className="w-full border border-slate-300 rounded px-2.5 py-1 text-xs outline-none focus:border-emerald-500 font-mono"
                        />
                        <button 
                          type="button"
                          onClick={() => setConvertAmount(customer.walletBalance || 0)}
                          className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-[10px] font-bold uppercase hover:bg-slate-200"
                        >
                          Tối đa
                        </button>
                      </div>

                      <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded text-xs space-y-1">
                        <div className="flex justify-between text-slate-600">
                          <span>Dùng Cashback:</span>
                          <span className="font-mono text-red-600">-{formatCurrency(convertAmount)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-800">
                          <span>Nhận Khuyến mại (x1.1):</span>
                          <span className="font-mono text-emerald-600">+{formatCurrency(Math.round(convertAmount * 1.1))}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => { setShowConvertPanel(false); setConvertAmount(0); }}
                          className="flex-1 py-1.5 bg-white border border-slate-300 text-slate-700 text-[10px] font-bold rounded hover:bg-slate-50"
                        >
                          Hủy
                        </button>
                        <button 
                          type="button"
                          onClick={handleConvert}
                          disabled={convertAmount <= 0 || converting}
                          className="flex-1 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-700 disabled:opacity-50 flex justify-center items-center gap-1"
                        >
                          {converting && <Loader2 className="w-3 h-3 animate-spin" />}
                          XÁC NHẬN
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tab Workspaces (Right 2/3 Area) */}
          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {activeModalTab === 'overview' && (
              <div className="space-y-6">
                <DraggableGrid className="grid grid-cols-2 gap-4" columns={2} gap={16}>
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 shadow-sm group">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover:text-primary-500 transition-colors">Tổng chi tiêu mua sắm</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(customer.totalSpent)}</p>
                  </div>
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 shadow-sm group">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1 group-hover:text-primary-500 transition-colors">Số đơn hàng đã mua</p>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-slate-900">{customer.orderCount}</span>
                      <span className="text-xs font-bold text-slate-500">đơn</span>
                    </div>
                  </div>
                </DraggableGrid>
                
                <div className="bg-primary-50/50 border border-primary-100 p-6 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 -mr-8 -mt-8 rounded-full opacity-50"></div>
                  <div className="flex justify-between items-center mb-5 relative z-10">
                    <h4 className="font-bold text-primary-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary-600" /> CSKH thông minh (AI Assist)
                    </h4>
                    <button 
                      onClick={handleGenerateAiMessage}
                      disabled={loadingAi}
                      className="text-[10px] bg-primary-600 text-[#FAF9F5] px-3 py-1.5 rounded-lg font-bold hover:bg-primary-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm shadow-indigo-100"
                    >
                      {loadingAi ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      QUÉT RFM & SOẠN TIN
                    </button>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl border border-primary-100/50 shadow-inner relative z-10 mb-4 focus-within:border-primary-300 transition-colors">
                    <input 
                      type="text" 
                      placeholder="Tiêu đề email tự động..." 
                      className="w-full border-b border-slate-200 pb-2 mb-2 text-sm focus:outline-none font-bold text-slate-900 placeholder:font-normal placeholder:italic bg-transparent"
                      value={emailSubject}
                      readOnly={loadingAi}
                      onChange={(e) => setEmailSubject(e.target.value)}
                    />
                    <textarea 
                      className="w-full h-32 text-sm resize-none focus:outline-none text-slate-800 placeholder:italic bg-transparent scrollbar-hide"
                      placeholder={loadingAi ? "AI đang phân tích & soạn thảo thảo phù hợp với phân khúc khách hàng..." : "Soạn thảo nội dung hoặc dùng AI soạn nhanh tích hợp dữ liệu CRM..."}
                      value={emailContent}
                      readOnly={loadingAi}
                      onChange={(e) => setEmailContent(e.target.value)}
                    />
                    {loadingAi && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-xl backdrop-blur-[1px]">
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                          <span className="text-[10px] font-bold text-primary-600 uppercase tracking-widest">Đang soạn thảo...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end gap-3 relative z-10">
                    <button 
                      disabled={!emailSubject || !emailContent || loadingAi}
                      className="bg-primary-600 text-[#FAF9F5] px-6 py-3 rounded-xl text-xs font-bold shadow-sm shadow-indigo-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all flex items-center gap-2"
                      onClick={() => {
                        alert('Tin nhắn chăm sóc đã được gửi tới ' + customer.email);
                      }}
                    >
                      <Send className="w-3.5 h-3.5" /> GỬI NGAY CHO {customer.name.toUpperCase()}
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h4 className="font-bold flex items-center gap-2 text-slate-900 text-sm">
                      <History className="w-4 h-4 text-primary-600" /> Hành trình khách hàng
                    </h4>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                      STATUS: <span className="text-primary-600 uppercase tracking-tighter bg-primary-50 px-1.5 py-0.5 rounded">Tích cực</span>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar scroll-smooth">
                    {customer.activities && customer.activities.length > 0 ? (
                      customer.activities.map((item, idx) => {
                        const getIcon = () => {
                          switch(item.type) {
                            case 'purchase': return <ShoppingCart className="w-3 h-3" />;
                            case 'consultation': return <MessageSquare className="w-3 h-3" />;
                            case 'rma': return <History className="w-3 h-3" />;
                            default: return <LifeBuoy className="w-3 h-3" />;
                          }
                        };
                        const getColor = () => {
                          switch(item.type) {
                            case 'purchase': return 'text-orange-700 bg-[#EAE7DF] border-orange-200';
                            case 'consultation': return 'text-purple-600 bg-purple-100 border-purple-200';
                            case 'rma': return 'text-red-600 bg-red-100 border-red-200';
                            default: return 'text-slate-700 bg-slate-100 border-slate-300';
                          }
                        };

                        return (
                          <div key={item.id} className="flex gap-4 relative group">
                            {idx < customer.activities!.length - 1 && (
                              <div className="absolute left-[13px] top-7 w-[1px] h-full bg-slate-200 group-hover:bg-blue-300 transition-colors"></div>
                            )}
                            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 border shadow-sm transition-transform ", getColor())}>
                              {getIcon()}
                            </div>
                            <div className="flex-1 bg-white p-3 rounded-lg border border-transparent group-hover:border-slate-300 group-hover:shadow-sm transition-all">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-xs font-bold text-[#111827]">{item.title}</p>
                                <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{item.date}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-normal">{item.description}</p>
                              <div className="mt-2 flex items-center justify-between">
                                {item.status && (
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase tracking-tight px-1.5 py-0.5 rounded-full",
                                    item.status === 'Hoàn thành' ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-50"
                                  )}>
                                    {item.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-6 bg-white rounded-lg border border-dashed border-slate-300">
                        <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                        <p className="text-xs text-slate-500 italic">Chưa có dữ liệu hoạt động cho khách hàng này.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeModalTab === 'leasing' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary-600" /> Hồ sơ Thuê thiết bị (Device Leasing)
                  </h3>
                  <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold rounded">
                    Số HĐ liên kết: {customerLeases.length}
                  </span>
                </div>

                {customerLeases.length > 0 ? (
                  <div className="space-y-6">
                    {customerLeases.map((lease: any) => {
                      const totalOverdue = lease.installments?.filter((i: any) => i.status === 'overdue').length || 0;
                      const totalPaid = lease.installments?.filter((i: any) => i.status === 'paid').length || 0;
                      const totalUnpaid = lease.installments?.filter((i: any) => i.status === 'unpaid').length || 0;
                      
                      return (
                        <div key={lease.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4 hover:border-slate-300 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-bold text-slate-950 text-sm">{lease.deviceModel}</h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">Số HĐ: {lease.id}</p>
                            </div>
                            <div className="flex gap-2">
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                                lease.knoxStatus === 'locked' ? "bg-red-50 text-red-700 border-red-200" :
                                lease.knoxStatus === 'warning' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              )}>
                                Knox: {lease.knoxStatus || 'Unlocked'}
                              </span>
                              <span className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                                lease.status === 'active' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                lease.status === 'late' ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-100 text-slate-600 border-slate-200"
                              )}>
                                HĐ: {lease.status === 'active' ? 'Đang thuê' : lease.status === 'late' ? 'Trễ hạn' : lease.status}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-4 gap-4 bg-white p-3.5 border border-slate-200 rounded-lg text-xs">
                            <div>
                              <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Giá thiết bị</p>
                              <p className="font-bold text-slate-900">{formatCurrency(lease.devicePrice)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Đã đặt cọc</p>
                              <p className="font-bold text-slate-900">{formatCurrency(lease.upfrontFee)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Phí thuê/tháng</p>
                              <p className="font-bold text-slate-900">{formatCurrency(lease.monthlyFee)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 text-[10px] uppercase font-bold mb-0.5">Thời hạn</p>
                              <p className="font-bold text-slate-900">{lease.durationMonths} tháng</p>
                            </div>
                          </div>

                          {/* Installments Progress Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-600">
                              <span>Tiến độ thanh toán các kỳ hạn</span>
                              <span>Đã đóng: {totalPaid} / {lease.installments?.length || 0} kỳ</span>
                            </div>
                            <div className="flex gap-1 h-3.5 w-full bg-slate-100 rounded overflow-hidden p-0.5 border border-slate-200">
                              {lease.installments?.map((inst: any, idx: number) => (
                                <div 
                                  key={idx}
                                  className={cn(
                                    "flex-1 h-full rounded transition-all",
                                    inst.status === 'paid' ? "bg-emerald-500" : 
                                    inst.status === 'overdue' ? "bg-red-500 animate-pulse" : "bg-slate-300"
                                  )}
                                  title={\`Kỳ \${inst.periodNum}: \${formatCurrency(inst.amount)} - \${inst.dueDate} (\${inst.status})\`}
                                />
                              ))}
                            </div>
                            <div className="flex gap-4 justify-end text-[10px] font-bold text-slate-500 pt-1">
                              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span> Đã đóng ({totalPaid})</span>
                              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded"></span> Quá hạn ({totalOverdue})</span>
                              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-300 rounded"></span> Chờ đóng ({totalUnpaid})</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <Smartphone className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Không có hợp đồng thuê thiết bị</p>
                    <p className="text-xs text-slate-500 mt-1 italic">Khách hàng này chưa thực hiện giao dịch hoặc đăng ký thuê máy Knox MDM.</p>
                  </div>
                )}
              </div>
            )}

            {activeModalTab === 'seller' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BadgeDollarSign className="w-4 h-4 text-primary-600" /> Tín nhiệm & Tài chính Nhà bán (B2B Seller)
                  </h3>
                </div>

                {customerSeller ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-3 gap-6 bg-slate-50 border border-slate-200 rounded-xl p-5">
                      <div className="text-center p-3.5 bg-white border border-slate-200 rounded-lg shadow-sm">
                        <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Điểm tín dụng</p>
                        <p className="text-3xl font-black text-slate-900">{customerSeller.score}</p>
                        <span className={cn(
                          "inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-black uppercase border",
                          customerSeller.tier === 'AAA' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          customerSeller.tier === 'AA' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                        )}>
                          Tier {customerSeller.tier}
                        </span>
                      </div>

                      <div className="col-span-2 space-y-4">
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between font-bold text-slate-700">
                            <span>Sử dụng hạn mức tín dụng</span>
                            <span>{Math.round((customerSeller.outstandingDebt / customerSeller.maxCreditLimit) * 100)}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-600" style={{ width: \`\${(customerSeller.outstandingDebt / customerSeller.maxCreditLimit) * 100}%\` }}></div>
                          </div>
                          <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                            <span>Đã dùng: {formatCurrency(customerSeller.outstandingDebt)}</span>
                            <span>Hạn mức phê duyệt: {formatCurrency(customerSeller.maxCreditLimit)}</span>
                          </div>
                        </div>

                        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <p className="text-[10px] font-bold text-emerald-800 uppercase">Hạn mức khả dụng</p>
                            <p className="text-lg font-black text-emerald-950 mt-0.5">{formatCurrency(customerSeller.availableCredit)}</p>
                          </div>
                          <ShieldCheck className="w-8 h-8 text-emerald-600 opacity-60" />
                        </div>
                      </div>
                    </div>

                    {/* Early Payout requests */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Lịch sử yêu cầu Giải ngân sớm (Early Payouts)
                      </h4>
                      {customerPayouts.length > 0 ? (
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                              <tr>
                                <th className="p-3">Mã yêu cầu</th>
                                <th className="p-3">Số tiền</th>
                                <th className="p-3">Phí chiết khấu</th>
                                <th className="p-3">Ngày yêu cầu</th>
                                <th className="p-3 text-center">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {customerPayouts.map((pay: any) => (
                                <tr key={pay.id} className="hover:bg-slate-50">
                                  <td className="p-3 font-mono font-bold text-slate-900">{pay.id}</td>
                                  <td className="p-3 font-bold text-slate-950">{formatCurrency(pay.amount)}</td>
                                  <td className="p-3 text-red-600 font-medium">{formatCurrency(pay.discountFee)}</td>
                                  <td className="p-3 text-slate-600">{pay.requestDate}</td>
                                  <td className="p-3 text-center">
                                    <span className={cn(
                                      "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                                      pay.status === 'disbursed' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                      pay.status === 'approved' ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"
                                    )}>
                                      {pay.status === 'disbursed' ? 'Đã chi tiền' : pay.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-center py-6 text-xs text-slate-500 italic bg-slate-50 border border-dashed border-slate-200 rounded-lg">Không có yêu cầu giải ngân nào gần đây.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <BadgeDollarSign className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Không có hồ sơ tín dụng Nhà bán</p>
                    <p className="text-xs text-slate-500 mt-1 italic">Khách hàng này không thuộc danh mục đối tác B2B Seller có hạn mức tín dụng tài chính.</p>
                  </div>
                )}
              </div>
            )}

            {activeModalTab === 'contracts' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-600" /> Quản lý Hợp đồng B2B & Ký số (SmartCA)
                  </h3>
                </div>

                {customerContracts.length > 0 ? (
                  <div className="space-y-6">
                    {customerContracts.map((con: any) => (
                      <div key={con.id} className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4 hover:border-slate-300 transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-950 text-sm">{con.title}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">Số HĐ: {con.id} • Hết hạn: {con.expiry}</p>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border",
                            con.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            con.status === 'pending' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"
                          )}>
                            {con.status === 'active' ? 'Hiệu lực' : con.status === 'pending' ? 'Chờ ký' : con.status}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-600">Giá trị hợp đồng: <strong className="text-slate-900 font-bold">{con.value}</strong></span>
                          {con.file && <span className="text-[10px] text-slate-500 italic">File đính kèm: {con.file.name}</span>}
                        </div>

                        {/* Signers Progress */}
                        {con.signers && (
                          <div className="bg-white border border-slate-200 p-3 rounded-lg space-y-2.5">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tiến trình chữ ký số SmartCA</p>
                            <div className="flex gap-4">
                              {con.signers.map((sig: any, sIdx: number) => (
                                <div key={sIdx} className="flex-1 p-2 bg-slate-50 border border-slate-100 rounded flex items-center justify-between text-xs">
                                  <div>
                                    <p className="font-bold text-slate-900 truncate max-w-[120px]">{sig.name}</p>
                                    <p className="text-[9px] text-slate-500">{sig.role}</p>
                                  </div>
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                                    sig.status === 'signed' ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"
                                  )}>
                                    {sig.status === 'signed' ? 'Đã ký' : 'Chờ ký'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Không có hợp đồng ký số</p>
                    <p className="text-xs text-slate-500 mt-1 italic">Chưa tìm thấy hợp đồng lao động, mua bán hay dịch vụ của khách hàng này.</p>
                  </div>
                )}
              </div>
            )}

            {activeModalTab === 'ledger' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-primary-600" /> Sổ cái Tài chính & Bút toán (Circular 99/2025/TT-BTC)
                  </h3>
                </div>

                {customerTransactions.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50 border-b border-slate-100 font-bold text-slate-600">
                        <tr>
                          <th className="p-3">Ngày giao dịch</th>
                          <th className="p-3">Mô tả bút toán</th>
                          <th className="p-3">Tài khoản Nợ/Có</th>
                          <th className="p-3 text-right">Số tiền phát sinh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerTransactions.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-slate-50">
                            <td className="p-3 text-slate-500 font-mono">{tx.date || tx.dateStr}</td>
                            <td className="p-3">
                              <p className="font-bold text-slate-900">{tx.description}</p>
                              <p className="text-[9px] text-slate-500 font-mono mt-0.5">Phân loại: {tx.category} • Mã: {tx.id.slice(-8).toUpperCase()}</p>
                            </td>
                            <td className="p-3 font-mono text-slate-600">
                              Nợ: {tx.debitAccount || '112'} / Có: {tx.creditAccount || '131'}
                            </td>
                            <td className={cn(
                              "p-3 text-right font-black",
                              tx.type === 'income' ? "text-emerald-600" : "text-rose-600"
                            )}>
                              {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <DollarSign className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-slate-700">Không có giao dịch tài chính ghi sổ</p>
                    <p className="text-xs text-slate-500 mt-1 italic">Hệ thống kế toán chưa ghi nhận bút toán thu chi nào đối với khách hàng này.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};`;

content = content.substring(0, startIndex) + replacementText + content.substring(endIndex);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully replaced CustomerDetailModal component by index!');
