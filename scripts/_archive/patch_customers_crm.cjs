const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'src', 'components', 'Customers.tsx');
let content = fs.readFileSync(targetFile, 'utf8');

// 1. Add AddDealModal component before export function Customers()
const addDealModalCode = `
const AddDealModal = ({ onClose, onSave, initialStage }: { onClose: () => void; onSave: (deal: { client: string; val: number; pd: string; stage: string }) => void; initialStage?: string }) => {
  const [client, setClient] = useState('');
  const [val, setVal] = useState('');
  const [pd, setPd] = useState('');
  const [stage, setStage] = useState(initialStage || 'new');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !val || !pd) return;
    onSave({
      client,
      val: Number(val),
      pd,
      stage
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-sm overflow-hidden animate-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Thêm Deal B2B mới</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition-all text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Tên khách hàng doanh nghiệp *</label>
            <input 
              required
              type="text" 
              value={client}
              onChange={e => setClient(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none" 
              placeholder="Ví dụ: Công ty Cổ phần Sữa TH"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Sản phẩm/Dịch vụ quan tâm *</label>
            <input 
              required
              type="text" 
              value={pd}
              onChange={e => setPd(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none" 
              placeholder="Ví dụ: Giày đồng phục 500 đôi"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Giá trị Deal (VNĐ) *</label>
            <input 
              required
              type="number" 
              value={val}
              onChange={e => setVal(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none" 
              placeholder="Ví dụ: 50000000"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 mb-1 block">Giai đoạn *</label>
            <select
              value={stage}
              onChange={e => setStage(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-orange-600 outline-none"
            >
              <option value="new">Leads Mới</option>
              <option value="qualified">Đã Thẩm Định</option>
              <option value="proposal">Gửi Báo Giá</option>
              <option value="negotiation">Thương Lượng</option>
              <option value="won">Chốt - Đoạt HĐ</option>
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-800 font-bold text-sm rounded-lg hover:bg-slate-200">Hủy</button>
            <button type="submit" className="px-4 py-2 bg-slate-900 text-[#FAF9F5] font-bold text-sm rounded-lg hover:bg-slate-800 flex items-center gap-2">
              <Check className="w-4 h-4" />
              Lưu Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
`;

content = content.replace('export function Customers()', addDealModalCode + '\nexport function Customers()');

// 2. Add new states in Customers component
const newStates = `
  const [selectedRfmFilter, setSelectedRfmFilter] = useState<'all' | 'core' | 'old' | 'potential' | 'new'>('all');
  const [deals, setDeals] = useState<any[]>([]);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [initialDealStage, setInitialDealStage] = useState('new');
`;

content = content.replace(
  /const\s+\[activeView,\s*setActiveView\]\s*=\s*useState<[^>]+>\('list'\);/,
  `const [activeView, setActiveView] = useState<'list' | 'pipeline'>('list');` + newStates
);

// 3. Replace pipelineStages state with dynamic definition
const pipelineStagesRegex = /const\s+\[pipelineStages,\s*setPipelineStages\]\s*=\s*useState\(\[\s*\{\s*id:\s*'new'[\s\S]*?\}\s*\]\);/;
const dynamicPipelineStages = `
  const pipelineStages = [
    { 
      id: 'new', 
      name: 'Leads Mới', 
      count: deals.filter(d => d.stage === 'new').length, 
      color: 'bg-slate-800', 
      deals: deals.filter(d => d.stage === 'new') 
    },
    { 
      id: 'qualified', 
      name: 'Đã Thẩm Định', 
      count: deals.filter(d => d.stage === 'qualified').length, 
      color: 'bg-primary-500', 
      deals: deals.filter(d => d.stage === 'qualified') 
    },
    { 
      id: 'proposal', 
      name: 'Gửi Báo Giá', 
      count: deals.filter(d => d.stage === 'proposal').length, 
      color: 'bg-amber-500', 
      deals: deals.filter(d => d.stage === 'proposal') 
    },
    { 
      id: 'negotiation', 
      name: 'Thương Lượng', 
      count: deals.filter(d => d.stage === 'negotiation').length, 
      color: 'bg-orange-500', 
      deals: deals.filter(d => d.stage === 'negotiation') 
    },
    { 
      id: 'won', 
      name: 'Chốt - Đoạt HĐ', 
      count: deals.filter(d => d.stage === 'won').length, 
      color: 'bg-emerald-500', 
      deals: deals.filter(d => d.stage === 'won') 
    }
  ];
`;

content = content.replace(pipelineStagesRegex, dynamicPipelineStages);

// 4. Update drag & drop handlers
const dragHandlersRegex = /const\s+handleDragStartPipeline[\s\S]*?const\s+handleDropPipeline[\s\S]*?setPipelineStages[\s\S]*?\}\);?\s*\}\s*;/;
const newDragHandlers = `
  const handleDragStartPipeline = (e: React.DragEvent, dealId: string, sourceStageId: string) => {
    e.dataTransfer.setData('dealId', dealId);
    e.dataTransfer.setData('sourceStageId', sourceStageId);
  };

  const handleDropPipeline = async (e: React.DragEvent, targetStageId: string) => {
    const dealId = e.dataTransfer.getData('dealId');
    const sourceStageId = e.dataTransfer.getData('sourceStageId');
    if (sourceStageId === targetStageId) return;

    const updated = deals.map(d => d.id === dealId ? { ...d, stage: targetStageId } : d);
    setDeals(updated);
    localStorage.setItem('vcomm_crm_deals', JSON.stringify(updated));

    if (!dealId.startsWith('d_')) {
      try {
        await updateDoc(doc(db, 'crm_deals', dealId), { stage: targetStageId });
      } catch (err) {
        console.warn('Failed to update deal stage in Firestore', err);
      }
    }
  };

  const handleSaveDeal = async (newDealData: { client: string; val: number; pd: string; stage: string }) => {
    const tempId = 'd_' + Date.now();
    const newDeal = { id: tempId, ...newDealData };
    
    const updated = [...deals, newDeal];
    setDeals(updated);
    localStorage.setItem('vcomm_crm_deals', JSON.stringify(updated));
    setShowAddDealModal(false);

    try {
      await addDoc(collection(db, 'crm_deals'), newDealData);
    } catch (err) {
      console.warn('Failed to add deal to Firestore', err);
    }
  };
`;

content = content.replace(dragHandlersRegex, newDragHandlers);

// 5. Update useEffect to listen to crm_deals
const useEffectRegex = /useEffect\(\(\)\s*=>\s*\{[\s\S]*?unsubCustomers\(\);\s*unsubOrders\(\);\s*\}\s*;\s*\}\s*,\s*\[\]\)/;
const newUseEffect = `useEffect(() => {
    // Fetch customers
    const unsubCustomers = onSnapshot(collection(db, 'customers'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setCustomers(data);
      setLoading(false);
    });

    // Fetch all completed orders to aggregate totalSpent per customer
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snap) => {
      const ordersData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setOrders(ordersData.filter(o => o.status === 'completed' && o.customerId));
    });

    const defaultDeals = [
      { id: 'd1', client: 'Công ty Cổ phần Sữa TH', val: 50000000, pd: 'Giày đồng phục 500 đôi', stage: 'new' },
      { id: 'd2', client: 'Vinpearl Nha Trang', val: 120000000, pd: 'Khăn lạnh KS', stage: 'new' },
      { id: 'd3', client: 'Kangaroo Việt Nam', val: 80000000, pd: 'Quà tặng Tết', stage: 'qualified' },
      { id: 'd4', client: 'Viettel Telecom', val: 350000000, pd: 'Gói combo đồng phục', stage: 'proposal' },
      { id: 'd5', client: 'FPT Software', val: 45000000, pd: 'Balo laptop', stage: 'proposal' },
      { id: 'd6', client: 'Bệnh viện Tâm Anh', val: 210000000, pd: 'Khẩu trang Y tế sỉ', stage: 'negotiation' },
      { id: 'd7', client: 'Techcombank', val: 560000000, pd: 'Đồng phục Giao dịch viên', stage: 'won' }
    ];

    // Fetch deals
    const unsubDeals = onSnapshot(collection(db, 'crm_deals'), (snap) => {
      if (snap.empty) {
        const local = localStorage.getItem('vcomm_crm_deals');
        if (local) {
          setDeals(JSON.parse(local));
        } else {
          defaultDeals.forEach(async (d) => {
            try {
              await addDoc(collection(db, 'crm_deals'), {
                client: d.client,
                val: d.val,
                pd: d.pd,
                stage: d.stage
              });
            } catch (e) {
              console.error(e);
            }
          });
          setDeals(defaultDeals);
          localStorage.setItem('vcomm_crm_deals', JSON.stringify(defaultDeals));
        }
      } else {
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setDeals(data);
        localStorage.setItem('vcomm_crm_deals', JSON.stringify(data));
      }
    }, (err) => {
      console.warn('Firestore offline or failed, using localStorage', err);
      const local = localStorage.getItem('vcomm_crm_deals');
      if (local) {
        setDeals(JSON.parse(local));
      } else {
        setDeals(defaultDeals);
        localStorage.setItem('vcomm_crm_deals', JSON.stringify(defaultDeals));
      }
    });

    return () => {
      unsubCustomers();
      unsubOrders();
      unsubDeals();
    };
  }, [])`;

content = content.replace(useEffectRegex, newUseEffect);

// 6. Update adjust history in submitAdjust
const submitAdjustRegex = /await updateDoc\(doc\(db,\s*'customers',\s*adjustingCustomer\.id\),\s*\{\s*\[field\]:\s*currentVal\s*\+\s*Number\(adjustAmount\)\s*\}\);/;
const newSubmitAdjust = `const amount = Number(adjustAmount);
    const newActivity = {
      id: 'act_' + Date.now(),
      type: 'other' as const,
      title: adjustType === 'wallet' ? 'Điều chỉnh số dư ví' : 'Điều chỉnh điểm thưởng',
      description: \`Hệ thống điều chỉnh \${amount >= 0 ? 'cộng' : 'trừ'} \${adjustType === 'wallet' ? formatCurrency(Math.abs(amount)) : Math.abs(amount) + ' pts'}.\`,
      date: new Date().toISOString().split('T')[0],
      status: 'Hoàn thành'
    };
    const updatedActivities = adjustingCustomer.activities ? [newActivity, ...adjustingCustomer.activities] : [newActivity];
    await updateDoc(doc(db, 'customers', adjustingCustomer.id), {
      [field]: currentVal + amount,
      activities: updatedActivities
    });`;

content = content.replace(submitAdjustRegex, newSubmitAdjust);

// 7. Replace dynamicCustomers calculation with RFM scoring and segmentation
const dynamicCustomersRegex = /const\s+dynamicCustomers\s*=\s*customers\.map\([\s\S]*?return\s*\{\s*\.\.\.c,\s*totalSpent,\s*orderCount,\s*status\s*\}\s*as\s*Customer;\s*\}\);/;
const newDynamicCustomers = `const dynamicCustomers = customers.map(c => {
    const customerOrders = orders.filter(o => o.customerId === c.id);
    const totalSpent = customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const orderCount = customerOrders.length;
    
    const status = (orderCount > 0 || c.status === 'active') ? 'active' : 'inactive';

    let lastOrderDateStr = c.lastOrderDate || '';
    if (customerOrders.length > 0) {
      const dates = customerOrders.map(o => new Date(o.date).getTime()).filter(t => !isNaN(t));
      if (dates.length > 0) {
        lastOrderDateStr = new Date(Math.max(...dates)).toISOString().split('T')[0];
      }
    }

    let recencyDays = Infinity;
    if (lastOrderDateStr) {
      const lastOrderTime = new Date(lastOrderDateStr).getTime();
      const refTime = new Date('2026-06-05').getTime();
      recencyDays = Math.max(0, Math.floor((refTime - lastOrderTime) / (1000 * 60 * 60 * 24)));
    }

    let rScore = 1;
    if (recencyDays <= 30) rScore = 5;
    else if (recencyDays <= 60) rScore = 4;
    else if (recencyDays <= 90) rScore = 3;
    else if (recencyDays <= 180) rScore = 2;

    let fScore = 1;
    if (orderCount >= 10) fScore = 5;
    else if (orderCount >= 5) fScore = 4;
    else if (orderCount >= 3) fScore = 3;
    else if (orderCount >= 2) fScore = 2;
    else if (orderCount === 1) fScore = 1;
    else if (orderCount === 0) fScore = 0;

    let mScore = 1;
    const monetaryValue = totalSpent || 0;
    if (monetaryValue >= 50000000) mScore = 5;
    else if (monetaryValue >= 20000000) mScore = 4;
    else if (monetaryValue >= 10000000) mScore = 3;
    else if (monetaryValue >= 5000000) mScore = 2;
    else mScore = 1;

    const rfmScore = { recency: rScore, frequency: fScore, monetary: mScore };

    let segment = 'potential';
    if (fScore >= 3 && recencyDays <= 30 && monetaryValue >= 10000000) {
      segment = 'core';
    } else if (recencyDays > 90 && orderCount > 0) {
      segment = 'old';
    } else if (orderCount === 0 || (orderCount === 1 && recencyDays <= 30)) {
      segment = 'new';
    }

    return { 
      ...c, 
      totalSpent, 
      orderCount, 
      status, 
      lastOrderDate: lastOrderDateStr,
      rfmScore,
      segment
    } as any;
  });`;

content = content.replace(dynamicCustomersRegex, newDynamicCustomers);

// 8. Update filteredCustomers with selectedRfmFilter
const filteredCustomersRegex = /const\s+filteredCustomers\s*=\s*dynamicCustomers\.filter\([\s\S]*?return\s+matchesChannel\s*&&\s*matchesSearch;\s*\}\);/;
const newFilteredCustomers = `const filteredCustomers = dynamicCustomers.filter(c => {
    const matchesChannel = activeChannel === 'all' || (c.channels && c.channels.includes(activeChannel as any));
    const matchesRfm = selectedRfmFilter === 'all' || c.segment === selectedRfmFilter;
    const matchesSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone?.includes(searchQuery) || 
      c.email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesChannel && matchesRfm && matchesSearch;
  });`;

content = content.replace(filteredCustomersRegex, newFilteredCustomers);

// 9. Update details modal reference to keep it live
content = content.replace(
  'customer={selectedCustomer}',
  'customer={dynamicCustomers.find(c => c.id === selectedCustomer.id) || selectedCustomer}'
);

// 10. Add AddDealModal to return render
content = content.replace(
  `{showAddModal && (
  <AddCustomerModal onClose={() => setShowAddModal(false)} />
  )}`,
  `{showAddModal && (
  <AddCustomerModal onClose={() => setShowAddModal(false)} />
  )}
  {showAddDealModal && (
  <AddDealModal 
    onClose={() => setShowAddDealModal(false)} 
    onSave={handleSaveDeal}
    initialStage={initialDealStage}
  />
  )}`
);

// 11. Make RFM cards dynamic and interactive
const rfmCardsRegex = /\{\[\s*\{\s*name:\s*'Khách hàng Core'[\s\S]*?\}\s*\]\.map\(\(seg,\s*i\)\s*=>\s*\([\s\S]*?<\/div>\s*\}\)\s*\}/;
const newRfmCards = `(() => {
    const totalCustomerCount = dynamicCustomers.length;
    const coreCount = dynamicCustomers.filter(c => c.segment === 'core').length;
    const oldCount = dynamicCustomers.filter(c => c.segment === 'old').length;
    const potentialCount = dynamicCustomers.filter(c => c.segment === 'potential').length;
    const newCount = dynamicCustomers.filter(c => c.segment === 'new').length;

    const corePct = totalCustomerCount ? Math.round((coreCount / totalCustomerCount) * 100) : 0;
    const oldPct = totalCustomerCount ? Math.round((oldCount / totalCustomerCount) * 100) : 0;
    const potentialPct = totalCustomerCount ? Math.round((potentialCount / totalCustomerCount) * 100) : 0;
    const newPct = totalCustomerCount ? Math.round((newCount / totalCustomerCount) * 100) : 0;

    return [
      { id: 'core', name: 'Khách hàng Core', val: corePct, color: 'bg-emerald-500', desc: 'Mua nhiều & gần đây' },
      { id: 'old', name: 'Khách hàng Cũ', val: oldPct, color: 'bg-rose-500', desc: 'Chưa mua lại > 3 tháng' },
      { id: 'potential', name: 'Tiềm năng', val: potentialPct, color: 'bg-slate-800', desc: 'Sẵn sàng Upsell' },
      { id: 'new', name: 'Mới đăng ký', val: newPct, color: 'bg-primary-500', desc: 'Cần Onboarding' }
    ].map((seg, i) => (
      <div 
        key={i} 
        onClick={() => setSelectedRfmFilter(prev => prev === seg.id ? 'all' : (seg.id as any))}
        className={cn(
          "p-4 rounded-xl border hover:bg-white hover:shadow-sm transition-all cursor-pointer",
          selectedRfmFilter === seg.id ? "bg-white border-primary-500 ring-2 ring-primary-500/20 shadow-sm" : "bg-slate-50 border-slate-200"
        )}
      >
        <div className="flex justify-between items-start mb-2">
          <div className={cn("w-2 h-2 rounded-full", seg.color)} />
          <span className="text-xl font-black text-slate-900">{seg.val}%</span>
        </div>
        <p className="text-xs font-bold text-slate-900 mb-1">{seg.name}</p>
        <p className="text-[10px] text-slate-500 leading-tight">{seg.desc}</p>
      </div>
    ));
  })()`;

content = content.replace(rfmCardsRegex, newRfmCards);

// 12. Update "+ Thêm Deal mới" header button
content = content.replace(
  `<button className="text-xs px-3 py-1.5 bg-slate-900 text-[#FAF9F5] font-bold rounded-lg hover:bg-slate-800 shadow-sm">+ Thêm Deal mới</button>`,
  `<button onClick={() => { setInitialDealStage('new'); setShowAddDealModal(true); }} className="text-xs px-3 py-1.5 bg-slate-900 text-[#FAF9F5] font-bold rounded-lg hover:bg-slate-800 shadow-sm">+ Thêm Deal mới</button>`
);

// 13. Update "+ Thêm Deal" column button
content = content.replace(
  `<button className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors border border-dashed border-slate-400">
  + Thêm Deal
  </button>`,
  `<button onClick={() => { setInitialDealStage(stage.id); setShowAddDealModal(true); }} className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors border border-dashed border-slate-400">
  + Thêm Deal
  </button>`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully patched Customers.tsx');
