import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Award, 
  Search, 
  Filter, 
  ArrowUpRight, 
  Medal, 
  Trophy, 
  Percent, 
  GitMerge, 
  Gift, 
  Save, 
  ShieldCheck, 
  ArrowLeft,
  ChevronLeft,
  Sparkles,
  Zap,
  Clock,
  ArrowRight,
  Plus,
  ChevronRight,
  Phone,
  Briefcase,
  DollarSign,
  CheckCircle2,
  XCircle,
  BarChart3,
  Calendar,
  Layers,
  Flame,
  Check
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

interface SalesRep {
  id: string;
  name: string;
  tier: 'lead' | 'senior' | 'junior';
  target: number;
  achieved: number;
  commissionRate: number;
  dealsWon: number;
  phone: string;
  avatar?: string;
}

const MOCK_SALES: SalesRep[] = [
  { id: 'S-001', name: 'Nguyễn Văn A', tier: 'senior', target: 500000000, achieved: 450000000, commissionRate: 2.5, dealsWon: 12, phone: '0901234567' },
  { id: 'S-002', name: 'Trần Thị B', tier: 'lead', target: 800000000, achieved: 920000000, commissionRate: 3.5, dealsWon: 18, phone: '0912345678' },
  { id: 'S-003', name: 'Lê Văn C', tier: 'junior', target: 200000000, achieved: 120000000, commissionRate: 1.5, dealsWon: 5, phone: '0987654321' },
  { id: 'S-004', name: 'Phạm Minh Đức', tier: 'senior', target: 450000000, achieved: 480000000, commissionRate: 2.5, dealsWon: 14, phone: '0934567890' },
  { id: 'S-005', name: 'Hoàng Lan Anh', tier: 'junior', target: 250000000, achieved: 210000000, commissionRate: 1.8, dealsWon: 8, phone: '0978901234' },
];

interface SalesDeal {
  id: string;
  title: string;
  customerName: string;
  customerPhone: string;
  value: number;
  stage: 'lead' | 'contacted' | 'proposal' | 'negotiation' | 'won' | 'lost';
  assignedTo: string;
  source: 'Facebook' | 'Website' | 'Hotline' | 'Đối tác' | 'Triển lãm';
  expectedClose: string;
  tag: string;
}

const INITIAL_DEALS: SalesDeal[] = [
  { id: 'DEAL-101', title: 'Cung ứng 50 Tablet Galaxy Knox', customerName: 'FPT Retail Miền Bắc', customerPhone: '0912888999', value: 350000000, stage: 'proposal', assignedTo: 'Trần Thị B', source: 'Đối tác', expectedClose: '2026-09-25', tag: 'B2B Enterprise' },
  { id: 'DEAL-102', title: 'Hợp đồng chuỗi POS 15 điểm', customerName: 'Chuỗi Cà phê Highlands Coffee', customerPhone: '0903112233', value: 180000000, stage: 'negotiation', assignedTo: 'Nguyễn Văn A', source: 'Hotline', expectedClose: '2026-09-22', tag: 'Thiết bị POS' },
  { id: 'DEAL-103', title: 'Gói thiết bị Livestream bán lẻ O2O', customerName: 'Công ty TNHH Mỹ Phẩm Hoa Mai', customerPhone: '0988665544', value: 75000000, stage: 'contacted', assignedTo: 'Lê Văn C', source: 'Facebook', expectedClose: '2026-09-30', tag: 'Livestream Studio' },
  { id: 'DEAL-104', title: 'Cho thuê 120 Laptop làm việc Core i7', customerName: 'Trung tâm Đào tạo IT Aptech', customerPhone: '0944556677', value: 420000000, stage: 'lead', assignedTo: 'Phạm Minh Đức', source: 'Website', expectedClose: '2026-10-05', tag: 'Device Leasing' },
  { id: 'DEAL-105', title: 'Trọn gói hệ thống Kiosk Tra cứu', customerName: 'Bệnh viện Đa khoa Quốc tế', customerPhone: '0908887766', value: 650000000, stage: 'won', assignedTo: 'Trần Thị B', source: 'Đối tác', expectedClose: '2026-09-15', tag: 'Smart Healthcare' },
  { id: 'DEAL-106', title: 'Setup Camera AI đếm lưu lượng khách', customerName: 'Chuỗi Siêu thị WinMart+', customerPhone: '0919223344', value: 290000000, stage: 'proposal', assignedTo: 'Nguyễn Văn A', source: 'Triển lãm', expectedClose: '2026-09-28', tag: 'AI Vision' },
  { id: 'DEAL-107', title: 'Mua sỉ 500 phụ kiện sạc dự phòng', customerName: 'Shop Công nghệ Minh Khang', customerPhone: '0933445566', value: 95000000, stage: 'won', assignedTo: 'Hoàng Lan Anh', source: 'Website', expectedClose: '2026-09-12', tag: 'Phụ kiện' },
  { id: 'DEAL-108', title: 'Hệ thống âm thanh thông báo cửa hàng', customerName: 'Nhà sách Phương Nam', customerPhone: '0966778899', value: 110000000, stage: 'lost', assignedTo: 'Lê Văn C', source: 'Hotline', expectedClose: '2026-09-10', tag: 'Audio B2B' },
];

const PIPELINE_STAGES: { id: SalesDeal['stage']; label: string; prob: number; color: string; border: string; bg: string }[] = [
  { id: 'lead', label: 'Tiếp cận mới', prob: 20, color: 'text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50/50' },
  { id: 'contacted', label: 'Đang tư vấn & Demo', prob: 40, color: 'text-indigo-700', border: 'border-indigo-200', bg: 'bg-indigo-50/50' },
  { id: 'proposal', label: 'Đã gửi Báo giá', prob: 60, color: 'text-purple-700', border: 'border-purple-200', bg: 'bg-purple-50/50' },
  { id: 'negotiation', label: 'Đàm phán Hợp đồng', prob: 80, color: 'text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50/50' },
  { id: 'won', label: 'Chốt đơn (Won)', prob: 100, color: 'text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50/50' },
  { id: 'lost', label: 'Thất bại (Lost)', prob: 0, color: 'text-rose-700', border: 'border-rose-200', bg: 'bg-rose-50/50' },
];

const SALES_MODULE_GROUPS = [
  {
    title: 'Vận hành Kinh doanh',
    items: [
      { id: 'pipeline', label: 'Cơ hội (Pipeline)', desc: 'Theo dõi các deal đang đàm phán kéo thả Kanban.', icon: TrendingUp, color: 'emerald' },
      { id: 'dashboard', label: 'Bảng theo dõi KPI', desc: 'Theo dõi tiến độ doanh số và rank đội ngũ.', icon: Target, color: 'blue' },
      { id: 'reps', label: 'Đội ngũ Sales', desc: 'Quản lý nhân viên, hạn mức và cấp bậc.', icon: Users, color: 'indigo' },
      { id: 'commissions', label: 'Tính toán Hoa hồng', desc: 'Tự động tính commission theo dữ liệu thực đạt.', icon: Award, color: 'orange' },
    ]
  },
  {
    title: 'Cấu hình & Gamification',
    items: [
      { id: 'rewards', label: 'Khen thưởng nóng', desc: 'Gamification chốt deal thần tốc, bảng vàng Top Gun.', icon: Trophy, color: 'rose' },
      { id: 'settings', label: 'Cấu hình Sales', desc: 'Thiết lập bậc hoa hồng và rules phân bổ lead.', icon: GitMerge, color: 'purple' },
    ]
  }
];

function getColorClasses(color: string) {
  switch (color) {
    case 'blue': return 'bg-slate-100 text-orange-700';
    case 'orange': return 'bg-orange-50 text-orange-600';
    case 'indigo': return 'bg-primary-50 text-primary-600';
    case 'purple': return 'bg-purple-50 text-purple-600';
    case 'emerald': return 'bg-emerald-50 text-emerald-600';
    case 'rose': return 'bg-rose-50 text-rose-600';
    default: return 'bg-slate-50 text-slate-700';
  }
}

export function SalesManagement() {
  const [activeTab, setActiveTab] = useState<'overview' | 'dashboard' | 'reps' | 'settings' | 'pipeline' | 'commissions' | 'rewards'>('overview');
  const [settingSection, setSettingSection] = useState<'commission' | 'routing' | 'gamification'>('commission');

  // Pipeline states
  const [deals, setDeals] = useState<SalesDeal[]>(INITIAL_DEALS);
  const [filterRep, setFilterRep] = useState<string>('all');
  const [dealSearch, setDealSearch] = useState<string>('');
  const [showNewDealModal, setShowNewDealModal] = useState<boolean>(false);

  // New Deal form state
  const [newDealTitle, setNewDealTitle] = useState('');
  const [newDealCustomer, setNewDealCustomer] = useState('');
  const [newDealPhone, setNewDealPhone] = useState('');
  const [newDealValue, setNewDealValue] = useState<number>(50000000);
  const [newDealAssigned, setNewDealAssigned] = useState(MOCK_SALES[0].name);
  const [newDealSource, setNewDealSource] = useState<SalesDeal['source']>('Website');
  const [newDealTag, setNewDealTag] = useState('B2B Enterprise');

  // Pipeline Metrics
  const pipelineMetrics = useMemo(() => {
    const activeDeals = deals.filter(d => d.stage !== 'lost');
    const totalPipelineValue = activeDeals.reduce((sum, d) => sum + d.value, 0);
    const wonValue = deals.filter(d => d.stage === 'won').reduce((sum, d) => sum + d.value, 0);
    const weightedForecast = deals.reduce((sum, d) => {
      const stageConfig = PIPELINE_STAGES.find(s => s.id === d.stage);
      return sum + (d.value * (stageConfig?.prob || 0)) / 100;
    }, 0);
    const totalFinished = deals.filter(d => d.stage === 'won' || d.stage === 'lost').length;
    const winRate = totalFinished > 0 ? (deals.filter(d => d.stage === 'won').length / totalFinished) * 100 : 0;

    return { totalPipelineValue, wonValue, weightedForecast, winRate, count: activeDeals.length };
  }, [deals]);

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const matchRep = filterRep === 'all' || deal.assignedTo === filterRep;
      const matchSearch = !dealSearch || 
        deal.title.toLowerCase().includes(dealSearch.toLowerCase()) || 
        deal.customerName.toLowerCase().includes(dealSearch.toLowerCase()) ||
        deal.customerPhone.includes(dealSearch);
      return matchRep && matchSearch;
    });
  }, [deals, filterRep, dealSearch]);

  const handleMoveStage = (dealId: string, direction: 'next' | 'prev') => {
    setDeals(prev => prev.map(deal => {
      if (deal.id !== dealId) return deal;
      const stageOrder: SalesDeal['stage'][] = ['lead', 'contacted', 'proposal', 'negotiation', 'won'];
      const currentIndex = stageOrder.indexOf(deal.stage);
      if (currentIndex === -1) return deal; // was 'lost'
      
      let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= stageOrder.length) nextIndex = stageOrder.length - 1;
      return { ...deal, stage: stageOrder[nextIndex] };
    }));
  };

  const handleMarkLost = (dealId: string) => {
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: 'lost' } : d));
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDealTitle || !newDealCustomer) {
      alert('Vui lòng nhập đầy đủ tên cơ hội và tên khách hàng');
      return;
    }
    const newDeal: SalesDeal = {
      id: `DEAL-${Math.floor(100 + Math.random() * 900)}`,
      title: newDealTitle,
      customerName: newDealCustomer,
      customerPhone: newDealPhone || '0900000000',
      value: Number(newDealValue) || 10000000,
      stage: 'lead',
      assignedTo: newDealAssigned,
      source: newDealSource,
      expectedClose: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      tag: newDealTag
    };
    setDeals([newDeal, ...deals]);
    setShowNewDealModal(false);
    // Reset
    setNewDealTitle('');
    setNewDealCustomer('');
    setNewDealPhone('');
    setNewDealValue(50000000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="header-title">
          <div className="flex items-center gap-2 mb-1">
            {activeTab !== 'overview' && (
              <button onClick={() => setActiveTab('overview')} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors mr-1 border border-slate-200">
                <ArrowLeft className="w-4 h-4 text-slate-600" />
              </button>
            )}
            <h1 className="font-sans tracking-tight text-xl font-black text-slate-900">Quản trị Kinh doanh & Sales Pipeline</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
              Chốt đơn O2O & B2B
            </span>
          </div>
          <p className="text-xs text-[#6B7280]">Theo dõi phễu cơ hội (Pipeline), tính hoa hồng tự động và thi đua đội ngũ Sales.</p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'pipeline' && (
            <button 
              onClick={() => setShowNewDealModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Deal Cơ Hội</span>
            </button>
          )}
          <button 
            onClick={() => setActiveTab('pipeline')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === 'pipeline' ? "bg-slate-900 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Phễu Cơ Hội (Kanban)</span>
          </button>
          <button 
            onClick={() => setActiveTab('commissions')}
            className={cn(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
              activeTab === 'commissions' ? "bg-slate-900 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
            )}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Bảng Hoa Hồng</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: 'overview', label: 'Tổng quan Kinh doanh', icon: BarChart3 },
          { id: 'pipeline', label: `Pipeline Cơ hội (${deals.filter(d => d.stage !== 'lost').length})`, icon: TrendingUp },
          { id: 'dashboard', label: 'Bảng theo dõi KPI', icon: Target },
          { id: 'reps', label: 'Đội ngũ Sales', icon: Users },
          { id: 'commissions', label: 'Tính toán Hoa hồng', icon: Award },
          { id: 'rewards', label: 'Vinh danh & Khen thưởng', icon: Trophy },
          { id: 'settings', label: 'Cấu hình Tỷ lệ', icon: GitMerge },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer",
                isActive 
                  ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats Cards */}
          <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
            <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-3">Tổng GMV chốt (T9)</p>
              <div className="flex items-end justify-between">
                <span className="text-2xl font-black text-[#111827]">{formatCurrency(12500000000)}</span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">+15.8%</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Tỉ lệ Hoàn thành KPI</p>
              <div className="flex items-end justify-between mt-3">
                <span className="text-2xl font-black text-[#111827]">88.5%</span>
                <span className="text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded">On Track</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Pipeline Đang Mở</p>
              <div className="flex items-end justify-between mt-3">
                <span className="text-2xl font-black text-blue-600">{formatCurrency(pipelineMetrics.totalPipelineValue)}</span>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">{pipelineMetrics.count} Deals</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
              <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Hoa hồng tạm tính</p>
              <div className="flex items-end justify-between mt-3">
                <span className="text-2xl font-black text-amber-600">{formatCurrency(320000000)}</span>
                <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded">Commission</span>
              </div>
            </div>
          </DraggableGrid>

          {/* AI Sales Insights */}
          <DraggableGrid className="grid grid-cols-1 lg:grid-cols-3 gap-6" columns={3} gap={24}>
            <div className="lg:col-span-2 bg-slate-900 rounded-xl p-6 text-[#FAF9F5] relative overflow-hidden shadow-sm">
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="w-5 h-5 text-blue-300" />
                  <h3 className="text-lg font-bold uppercase tracking-widest italic">AI Sales Intelligence</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-blue-100 font-bold uppercase opacity-70">Dự báo doanh thu tháng</p>
                    <p className="text-2xl font-black">{formatCurrency(15200000000)}</p>
                    <p className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> +21.4% vs T8
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-blue-100 font-bold uppercase opacity-70">Tỉ lệ chốt deal (Win Rate)</p>
                    <p className="text-2xl font-black">66.7%</p>
                    <p className="text-[10px] font-bold text-blue-200">Trên trung bình ngành</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-blue-100 font-bold uppercase opacity-70">LTV Dự kiến (Next 90d)</p>
                    <p className="text-2xl font-black">{formatCurrency(4500000000)}</p>
                    <p className="text-[10px] font-bold text-blue-200">Từ khách hàng hiện tại</p>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {['A', 'B', 'C', 'D'].map((char, i) => (
                        <div key={i} className="w-8 h-8 rounded-full border-2 border-blue-600 bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                          {char}
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-blue-100 italic">4 nhân viên đang có dấu hiệu bứt phá doanh số vượt bậc</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('pipeline')}
                    className="px-4 py-2 bg-white text-blue-700 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm ring-4 ring-white/10 cursor-pointer"
                  >
                    Xem Chi Tiết Pipeline
                  </button>
                </div>
              </div>
              <Zap className="absolute -bottom-10 -right-10 w-48 h-48 text-[#FAF9F5]/5 rotate-12" />
            </div>

            <div className="bg-white border border-slate-300 rounded-xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Hoạt động gần đây
                </h4>
                <div className="space-y-4">
                  {[
                    { time: '2 phút trước', msg: 'Trần Thị B vừa chốt deal 650tr (Bệnh viện Đa khoa)', type: 'win' },
                    { time: '15 phút trước', msg: 'Lead mới từ Website: Aptech 120 Laptop', type: 'lead' },
                    { time: '1 giờ trước', msg: 'Lê Văn C gửi báo giá gói Livestream', type: 'update' }
                  ].map((act, i) => (
                    <div key={i} className="flex gap-3">
                      <div className={cn(
                        "w-1 h-8 rounded-full",
                        act.type === 'win' ? "bg-emerald-500" : act.type === 'lead' ? "bg-blue-600" : "bg-slate-300"
                      )} />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{act.msg}</p>
                        <p className="text-[10px] text-slate-500">{act.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setActiveTab('dashboard')}
                className="w-full mt-6 py-3 border border-slate-300 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
              >
                Xem tất cả Log KPI <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </DraggableGrid>

          {/* Module Grid */}
          <div className="space-y-6">
            {SALES_MODULE_GROUPS.map((group, gIdx) => (
              <div key={gIdx} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
                  <span className="w-1 h-4 bg-[#2563EB] rounded-full inline-block" />
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {group.items.map((mod) => (
                    <div 
                      key={mod.id}
                      onClick={() => setActiveTab(mod.id as any)}
                      className="group bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm hover:border-[#2563EB]/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
                      </div>
                      <div className={cn("w-12 h-12 rounded-lg relative z-10 flex items-center justify-center group-hover:bg-[#2563EB] group-hover:text-[#FAF9F5] transition-all shadow-sm", getColorClasses(mod.color))}>
                        <mod.icon className="w-6 h-6" />
                      </div>
                      <div className="relative z-10">
                        <h3 className="font-bold text-[#111827] text-sm mb-1.5 group-hover:text-[#2563EB] transition-colors">{mod.label}</h3>
                        <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">{mod.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 2: PIPELINE KANBAN ================= */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Pipeline Metric Cards Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tổng Giá Trị Phễu (Pipeline)</span>
              <div className="text-xl font-black text-slate-900 mt-1">{formatCurrency(pipelineMetrics.totalPipelineValue)}</div>
              <span className="text-[10px] text-blue-600 font-bold mt-1 inline-block">{pipelineMetrics.count} Cơ hội đang triển khai</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Dự Báo Doanh Thu Có Trọng Số</span>
              <div className="text-xl font-black text-indigo-600 mt-1">{formatCurrency(pipelineMetrics.weightedForecast)}</div>
              <span className="text-[10px] text-indigo-500 font-medium mt-1 inline-block">Tính theo xác suất từng bước chốt</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Doanh Số Đã Chốt (Won)</span>
              <div className="text-xl font-black text-emerald-600 mt-1">{formatCurrency(pipelineMetrics.wonValue)}</div>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">Hợp đồng đã ký thành công</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tỷ Lệ Chốt Thành Công</span>
              <div className="text-xl font-black text-amber-600 mt-1">{pipelineMetrics.winRate.toFixed(1)}%</div>
              <span className="text-[10px] text-amber-600 font-bold mt-1 inline-block">Win/Loss Ratio kỳ này</span>
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Tìm cơ hội, tên khách, số điện thoại..."
                  value={dealSearch}
                  onChange={e => setDealSearch(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 font-bold">Sales phụ trách:</span>
                <select 
                  value={filterRep}
                  onChange={e => setFilterRep(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:outline-none"
                >
                  <option value="all">Tất cả nhân viên</option>
                  {MOCK_SALES.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.tier})</option>
                  ))}
                </select>
              </div>
            </div>

            <button 
              onClick={() => setShowNewDealModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Thêm Cơ Hội Mới</span>
            </button>
          </div>

          {/* Kanban Board Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-start overflow-x-auto pb-4">
            {PIPELINE_STAGES.map(col => {
              const colDeals = filteredDeals.filter(d => d.stage === col.id);
              const colTotal = colDeals.reduce((sum, d) => sum + d.value, 0);

              return (
                <div 
                  key={col.id} 
                  className={cn(
                    "flex flex-col rounded-xl border p-3 min-w-[240px] max-h-[750px] shadow-2xs",
                    col.bg,
                    col.border
                  )}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/80">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("text-xs font-black", col.color)}>{col.label}</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-white text-slate-700 text-[10px] font-bold border border-slate-200">
                          {colDeals.length}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                        Xác suất: <span className="font-bold text-slate-700">{col.prob}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[11px] font-black text-slate-800 mb-3 bg-white/80 px-2 py-1 rounded border border-slate-200/60 flex justify-between">
                    <span>Tổng:</span>
                    <span className="text-emerald-700">{formatCurrency(colTotal)}</span>
                  </div>

                  {/* Deal Cards Container */}
                  <div className="space-y-2.5 overflow-y-auto pr-1 flex-1">
                    {colDeals.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs italic border-2 border-dashed border-slate-200/60 rounded-lg">
                        Không có deal
                      </div>
                    ) : (
                      colDeals.map(deal => (
                        <div 
                          key={deal.id}
                          className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-2.5 group"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="text-[9px] font-mono font-bold text-slate-400">{deal.id}</span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {deal.tag}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                            {deal.title}
                          </h4>

                          <div className="space-y-1 text-[11px]">
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="truncate max-w-[130px] font-medium">{deal.customerName}</span>
                              <span className="font-mono text-[10px] text-slate-400">{deal.customerPhone}</span>
                            </div>
                            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                              <span className="text-[10px] text-slate-500">Giá trị:</span>
                              <span className="font-black text-xs text-emerald-600">{formatCurrency(deal.value)}</span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-500">
                              <span>Phụ trách:</span>
                              <span className="font-bold text-slate-700">{deal.assignedTo}</span>
                            </div>
                          </div>

                          {/* Stage Transition Buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                            {deal.stage !== 'lost' && (
                              <button 
                                onClick={() => handleMoveStage(deal.id, 'prev')}
                                disabled={deal.stage === 'lead'}
                                className="p-1 rounded hover:bg-slate-100 text-slate-500 disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Lùi stage"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {deal.stage !== 'won' && deal.stage !== 'lost' && (
                              <button
                                onClick={() => handleMarkLost(deal.id)}
                                className="px-2 py-0.5 rounded text-[9px] font-bold text-rose-600 hover:bg-rose-50"
                                title="Đánh dấu thất bại"
                              >
                                Thất bại
                              </button>
                            )}

                            {deal.stage !== 'lost' && (
                              <button 
                                onClick={() => handleMoveStage(deal.id, 'next')}
                                disabled={deal.stage === 'won'}
                                className="p-1 rounded hover:bg-slate-100 text-blue-600 font-bold flex items-center gap-0.5 text-[10px] disabled:opacity-30 disabled:hover:bg-transparent"
                                title="Chuyển stage kế tiếp"
                              >
                                <span>Tiếp</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TAB 3: COMMISSIONS TABLE ================= */}
      {activeTab === 'commissions' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div>
                <h3 className="text-base font-black text-slate-900">Bảng Kê Hoa Hồng Kinh Doanh (Tháng 9/2026)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Tự động tính theo tỷ lệ Commission cấp bậc và thưởng vượt hạn mức chỉ tiêu (KPI Milestone).</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => alert('Đã chốt và xuất bảng kê hoa hồng tháng 9/2026 thành công!')}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Chốt Kỳ Hoa Hồng</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 border-b border-slate-200 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-5">Nhân viên Sales</th>
                    <th className="py-3 px-4">Cấp bậc</th>
                    <th className="py-3 px-4 text-right">Chỉ tiêu (Target)</th>
                    <th className="py-3 px-4 text-right">Thực đạt (GMV)</th>
                    <th className="py-3 px-4 text-center">Tiến độ %</th>
                    <th className="py-3 px-4 text-center">Tỷ lệ HH</th>
                    <th className="py-3 px-4 text-right">HH Cơ bản</th>
                    <th className="py-3 px-4 text-right">Thưởng vượt KPI</th>
                    <th className="py-3 px-5 text-right font-black">Tổng nhận về</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {MOCK_SALES.map(s => {
                    const percent = (s.achieved / s.target) * 100;
                    const baseCommission = (s.achieved * s.commissionRate) / 100;
                    const bonusOver = s.achieved > s.target ? (s.achieved - s.target) * 0.05 : 0;
                    const totalPay = baseCommission + bonusOver;

                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="font-bold text-slate-900 text-sm">{s.name}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{s.id} • {s.phone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black uppercase border",
                            s.tier === 'lead' ? "bg-purple-50 text-purple-700 border-purple-200" :
                            s.tier === 'senior' ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-700 border-slate-200"
                          )}>
                            {s.tier}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                          {formatCurrency(s.target)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                          {formatCurrency(s.achieved)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black",
                            percent >= 100 ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          )}>
                            {percent.toFixed(0)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {s.commissionRate}%
                        </td>
                        <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                          {formatCurrency(baseCommission)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                          {bonusOver > 0 ? `+${formatCurrency(bonusOver)}` : '--'}
                        </td>
                        <td className="py-3.5 px-5 text-right font-black text-sm text-emerald-700">
                          {formatCurrency(totalPay)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 4: REWARDS & GAMIFICATION ================= */}
      {activeTab === 'rewards' && (
        <div className="space-y-6">
          {/* Top Banner Vinh Danh */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white border border-slate-800 shadow-lg relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                  <span className="text-xs font-black tracking-widest text-amber-400 uppercase">Top Gun Sales Leaderboard</span>
                </div>
                <h3 className="text-2xl font-black">Bảng Vàng Thi Đua Doanh Số Quý 3/2026</h3>
                <p className="text-xs text-slate-300 max-w-xl">
                  Chương trình "Chiến Binh Hổ Báo" thưởng nóng ngay 2,000,000đ cho mỗi hợp đồng B2B trên 100 triệu, và cúp vinh danh Top 1 GMV tháng.
                </p>
              </div>

              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center text-slate-950 shadow-md">
                  <Trophy className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-300">Quán Quân Doanh Số</div>
                  <div className="text-base font-black">Trần Thị B (Lead)</div>
                  <div className="text-xs font-bold text-emerald-400">920,000,000 VND (115%)</div>
                </div>
              </div>
            </div>
            <Trophy className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 rotate-12 pointer-events-none" />
          </div>

          {/* Leaderboard Podium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { rank: 1, name: 'Trần Thị B', tier: 'Lead', achieved: 920000000, deals: 18, medal: 'bg-amber-400 text-slate-900', bonus: '5,000,000 VND' },
              { rank: 2, name: 'Phạm Minh Đức', tier: 'Senior', achieved: 480000000, deals: 14, medal: 'bg-slate-300 text-slate-900', bonus: '3,000,000 VND' },
              { rank: 3, name: 'Nguyễn Văn A', tier: 'Senior', achieved: 450000000, deals: 12, medal: 'bg-amber-700 text-white', bonus: '1,500,000 VND' },
            ].map(user => (
              <div key={user.rank} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm", user.medal)}>
                      #{user.rank}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Thưởng: {user.bonus}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900">{user.name}</h4>
                  <p className="text-xs text-slate-500">{user.tier} Sales • {user.deals} Deals Won</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">GMV Đạt:</span>
                  <span className="text-sm font-black text-slate-900">{formatCurrency(user.achieved)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 5: DASHBOARD & REPS ================= */}
      {(activeTab === 'dashboard' || activeTab === 'reps') && (
        <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input 
                  type="text" 
                  placeholder="Tìm nhân viên, cấp bậc..." 
                  className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
                />
              </div>
              <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
                <Filter className="w-4 h-4" /> Lọc theo Tier
              </button>
            </div>
            <button 
              onClick={() => setActiveTab('pipeline')}
              className="text-xs font-semibold text-[#2563EB] flex items-center gap-2 hover:underline cursor-pointer"
            >
              Xem Cơ Hội Pipeline <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto min-w-0">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Nhân viên Sales</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Cấp bậc & Hoa hồng</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest">Target Hoàn thành</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Hoa hồng tạm tính</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right">Phân hạng (Rank)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {MOCK_SALES.map((sale, idx) => (
                  <tr key={sale.id} className="hover:bg-[#F9FAFB] group transition-colors text-sm">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[#2563EB] border border-slate-300 text-xs">
                          {sale.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-[#111827]">{sale.name}</p>
                          <p className="text-[10px] text-[#6B7280] uppercase tracking-tight">{sale.id} • {sale.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border",
                          sale.tier === 'lead' ? "bg-purple-50 text-purple-700 border-purple-100" :
                          sale.tier === 'senior' ? "bg-slate-100 text-orange-800 border-slate-300" : "bg-slate-50 text-slate-800 border-slate-200"
                        )}>
                          {sale.tier.toUpperCase()}
                        </span>
                        <p className="text-[10px] text-[#6B7280] font-medium">Rate: {sale.commissionRate}% Doanh số</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-[150px] space-y-1.5">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span>{((sale.achieved / sale.target) * 100).toFixed(0)}%</span>
                          <span>{formatCurrency(sale.achieved)} / {formatCurrency(sale.target)}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full transition-all duration-1000", sale.achieved >= sale.target ? "bg-[#10B981]" : "bg-[#2563EB]")} 
                            style={{ width: `${Math.min(100, (sale.achieved / sale.target) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#10B981]">
                      {formatCurrency((sale.achieved * sale.commissionRate) / 100)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end">
                        {idx === 0 && <Medal className="w-5 h-5 text-yellow-500" />}
                        {idx === 1 && <Medal className="w-5 h-5 text-slate-500" />}
                        {idx === 2 && <Medal className="w-5 h-5 text-amber-600" />}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 6: SETTINGS ================= */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="col-span-1 space-y-2 relative">
            <div className="sticky top-8">
              <button 
                onClick={() => setSettingSection('commission')}
                className={cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all", settingSection === 'commission' ? "bg-slate-100 text-orange-800" : "text-slate-700 hover:bg-slate-50")}
              >
                <Percent className="w-4 h-4" /> Bậc hoa hồng (Tiers)
              </button>
              <button 
                onClick={() => setSettingSection('routing')}
                className={cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all", settingSection === 'routing' ? "bg-slate-100 text-orange-800" : "text-slate-700 hover:bg-slate-50")}
              >
                <GitMerge className="w-4 h-4" /> Phân bổ Leads
              </button>
              <button 
                onClick={() => setSettingSection('gamification')}
                className={cn("w-full text-left px-4 py-3 rounded-lg text-sm font-bold flex items-center gap-3 transition-all", settingSection === 'gamification' ? "bg-slate-100 text-orange-800" : "text-slate-700 hover:bg-slate-50")}
              >
                <Gift className="w-4 h-4" /> Khen thưởng (Gamification)
              </button>
            </div>
          </div>

          <div className="col-span-1 md:col-span-3">
            <div className="bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden animate-in fade-in slide-in- duration-500">
              {settingSection === 'commission' && (
                <>
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-[#F9FAFB]">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Thiết lập Bậc & Hoa hồng</h3>
                      <p className="text-xs text-slate-600 mt-1">Cấu hình cấp độ Seniority và tỷ lệ Commission tương ứng cho Đội ngũ Kinh doanh.</p>
                    </div>
                    <button 
                      onClick={() => alert('Đã lưu thông số hoa hồng thành công!')}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-[#FAF9F5] rounded-lg text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Lưu thông số
                    </button>
                  </div>
                  <div className="p-6 space-y-6">
                    {['Sales Lead', 'Senior Sales', 'Junior Sales'].map((tier, i) => (
                      <div key={tier} className="flex flex-col md:flex-row gap-6 p-5 border border-slate-200 rounded-xl bg-slate-50 items-start md:items-center">
                        <div className="w-full md:w-1/3">
                          <h4 className="font-bold text-slate-900 text-sm">{tier}</h4>
                          <p className="text-xs text-slate-600 mt-1">Cấp bậc {i + 1} trong cấu trúc Sales Team.</p>
                        </div>
                        <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Target tháng (VND)</label>
                            <input type="text" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-600" defaultValue={i === 0 ? "5,000,000,000" : i === 1 ? "3,000,000,000" : "1,000,000,000"} />
                          </div>
                          <div className="relative">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tỷ lệ HH (%)</label>
                            <div className="relative">
                              <input type="number" step="0.1" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-600" defaultValue={i === 0 ? "2.5" : i === 1 ? "1.8" : "1.2"} />
                              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tạo Deal Mới */}
      {showNewDealModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Tạo Cơ Hội Bán Hàng Mới</h3>
                  <p className="text-[10px] text-slate-500">Đưa khách hàng tiềm năng vào phễu Pipeline kinh doanh</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewDealModal(false)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên cơ hội / Dự án *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ví dụ: Cung ứng 20 Tablet cho Chuỗi Nhà Thuốc"
                  value={newDealTitle}
                  onChange={e => setNewDealTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tên khách hàng / DN *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Công ty ABC"
                    value={newDealCustomer}
                    onChange={e => setNewDealCustomer(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                  <input 
                    type="text"
                    placeholder="0912xxxxxx"
                    value={newDealPhone}
                    onChange={e => setNewDealPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Giá trị dự kiến (VND) *</label>
                  <input 
                    type="number"
                    step="1000000"
                    required
                    value={newDealValue}
                    onChange={e => setNewDealValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phân loại sản phẩm</label>
                  <input 
                    type="text"
                    value={newDealTag}
                    onChange={e => setNewDealTag(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sales phụ trách</label>
                  <select 
                    value={newDealAssigned}
                    onChange={e => setNewDealAssigned(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {MOCK_SALES.map(s => (
                      <option key={s.id} value={s.name}>{s.name} ({s.tier})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nguồn Lead</label>
                  <select 
                    value={newDealSource}
                    onChange={e => setNewDealSource(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Website">Website</option>
                    <option value="Facebook">Facebook Fanpage</option>
                    <option value="Hotline">Hotline</option>
                    <option value="Đối tác">Đối tác giới thiệu</option>
                    <option value="Triển lãm">Triển lãm / Sự kiện</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button 
                  type="button"
                  onClick={() => setShowNewDealModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  Tạo Cơ Hội Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
