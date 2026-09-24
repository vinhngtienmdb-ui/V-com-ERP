import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  ShieldCheck, 
  Zap, 
  PieChart as PieIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Download,
  AlertTriangle,
  ShoppingBag,
  Store,
  Layers,
  Sparkles,
  Activity,
  Calendar,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  ChevronRight,
  Tv,
  Briefcase,
  Truck,
  Cpu,
  HeartHandshake,
  Bot,
  RefreshCw,
  Sliders,
  Maximize2,
  CheckSquare,
  Flame,
  Award,
  ShieldAlert,
  ArrowRight
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
  PieChart,
  Pie
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { getAiChatResponse } from '../services/geminiService';

// --- MOCK DATA FOR EXECUTIVE COCKPIT ---

const REVENUE_RUNRATE_DATA = [
  { day: '01/03', actual: 1.4, target: 1.6, forecast: 1.4 },
  { day: '05/03', actual: 7.2, target: 8.0, forecast: 7.2 },
  { day: '10/03', actual: 16.5, target: 16.0, forecast: 16.5 },
  { day: '15/03', actual: 24.8, target: 24.0, forecast: 24.8 },
  { day: '20/03', actual: 33.2, target: 32.0, forecast: 33.2 },
  { day: '25/03', actual: 41.0, target: 40.0, forecast: 41.5 },
  { day: '30/03', actual: null, target: 48.0, forecast: 50.8 },
  { day: '31/03', actual: null, target: 50.0, forecast: 52.4 },
];

const DEPARTMENT_METRICS = [
  {
    id: 'retail_ecom',
    name: 'Khối TMĐT & Bán Lẻ O2O',
    head: 'Nguyễn Văn An (CEO kiêm)',
    icon: ShoppingBag,
    color: 'from-blue-600 to-indigo-600',
    revenue: 34200000000,
    target: 36000000000,
    progress: 95.0,
    status: 'good',
    kpis: [
      { label: 'Đơn hàng hoàn tất', value: '48,250 đơn' },
      { label: 'AOV bình quân', value: '708.000đ' },
      { label: 'Tỷ lệ huỷ/hoàn', value: '1.8% (Tốt)' }
    ]
  },
  {
    id: 'scm_logistics',
    name: 'Khối Chuỗi Cung Ứng & Kho Vận',
    head: 'Đỗ Minh Trí (Trưởng Khối)',
    icon: Truck,
    color: 'from-amber-500 to-orange-600',
    revenue: 5400000000,
    target: 5000000000,
    progress: 108.0,
    status: 'excellent',
    kpis: [
      { label: 'Tỷ lệ đúng hẹn OTIF', value: '97.2%' },
      { label: 'Vòng quay tồn kho', value: '14.5 ngày' },
      { label: 'Tỷ lệ hỏng hóc', value: '0.04%' }
    ]
  },
  {
    id: 'finance_acc',
    name: 'Khối Tài Chính & Kế Toán',
    head: 'Trần Thị Mai (CFO)',
    icon: DollarSign,
    color: 'from-emerald-500 to-teal-600',
    revenue: 45800000000,
    target: 50000000000,
    progress: 91.6,
    status: 'good',
    kpis: [
      { label: 'Dòng tiền khả dụng', value: '18.2 tỷ' },
      { label: 'Biên lợi nhuận ròng', value: '16.4%' },
      { label: 'Đối soát VComm/SePay', value: '100% Khớp' }
    ]
  },
  {
    id: 'hr_org',
    name: 'Khối Nhân Lực & Văn Hóa',
    head: 'Phạm Quỳnh Anh (HR Lead)',
    icon: Users,
    color: 'from-purple-500 to-pink-600',
    revenue: 0,
    target: 0,
    progress: 96.4,
    status: 'good',
    kpis: [
      { label: 'Quân số hiện tại', value: '248 nhân sự' },
      { label: 'Chi phí lương / DT', value: '14.2%' },
      { label: 'Tỷ lệ nghỉ việc', value: '1.2% (Rất thấp)' }
    ]
  },
  {
    id: 'tech_core',
    name: 'Khối Công Nghệ & Hạ Tầng API',
    head: 'Lê Hoàng Long (CTO)',
    icon: Cpu,
    color: 'from-cyan-500 to-blue-600',
    revenue: 0,
    target: 0,
    progress: 99.9,
    status: 'excellent',
    kpis: [
      { label: 'Hệ thống Uptime', value: '99.98%' },
      { label: 'Độ trễ API Core 5000', value: '98ms' },
      { label: 'An ninh mạng', value: '0 sự cố' }
    ]
  }
];

const CEO_PENDING_APPROVALS = [
  {
    id: 'REQ-CEO-01',
    title: 'Đề xuất duyệt tạm ứng mở rộng 3 siêu thị VComm Quận 7 & Thủ Đức',
    creator: 'Đỗ Minh Trí (Khối Vận Hành)',
    amount: 1500000000,
    sla: 'Hỏa tốc (còn 3 giờ)',
    category: 'Đầu tư mở rộng O2O',
    priority: 'urgent'
  },
  {
    id: 'REQ-CEO-02',
    title: 'Hợp đồng mua thiết bị máy chủ cụm Core Backend dự phòng năm 2026',
    creator: 'Lê Hoàng Long (CTO)',
    amount: 420000000,
    sla: 'Hôm nay',
    category: 'Hạ tầng CNTT',
    priority: 'high'
  },
  {
    id: 'REQ-CEO-03',
    title: 'Đề xuất ký hợp đồng nhà phân phối chiến lược độc quyền ngành sữa',
    creator: 'Nguyễn Văn An (Khối Kinh Doanh)',
    amount: 3200000000,
    sla: 'Trước ngày 25/03',
    category: 'Chuỗi cung ứng SCM',
    priority: 'normal'
  }
];

const OMNICHANNEL_SHARE = [
  { name: 'VComm eCommerce Trực tiếp', value: 42, color: '#4F46E5' },
  { name: 'VComm Mall Chính hãng', value: 28, color: '#0EA5E9' },
  { name: 'VComm FlashSale & Live', value: 16, color: '#EC4899' },
  { name: 'VComm Supermarket O2O', value: 8, color: '#F59E0B' },
  { name: 'NextHub B2B Wholesale', value: 6, color: '#10B981' },
];

export function ExecutiveCockpit() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [timeRange, setTimeRange] = useState<'today' | 'this_week' | 'this_month' | 'this_quarter'>('this_month');
  const [activeTab, setActiveTab] = useState<'overview' | 'departments' | 'analytics' | 'ai_copilot'>('overview');
  const [isTvMode, setIsTvMode] = useState(false);
  const [showDirectiveModal, setShowDirectiveModal] = useState(false);
  const [directiveText, setDirectiveText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Assistant in Cockpit
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSendDirective = () => {
    if (!directiveText.trim()) return;
    showToast(`Đã ban hành chỉ thị điều hành khẩn tới toàn bộ Ban Lãnh đạo & các Khối`);
    setDirectiveText('');
    setShowDirectiveModal(false);
  };

  const handleAskAi = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiLoading(true);
    try {
      const prompt = `Bạn là Trợ lý AI Cấp Cao dành riêng cho Ban Giám Đốc Tập đoàn VComm (Executive AI Decision Copilot). Dữ liệu hiện tại: Doanh thu 45.8 tỷ/50 tỷ (đạt 91.6%), Dòng tiền 18.2 tỷ khả dụng, 248 nhân sự, Uptime 99.98%. Câu hỏi từ Ban Giám Đốc: "${aiPrompt}". Hãy phân tích kịch bản kinh doanh ngắn gọn, đề xuất hành động trọng tâm (3 ý chính) bằng tiếng Việt chuyên nghiệp.`;
      const res = await getAiChatResponse(prompt);
      setAiResponse(res);
    } catch (e) {
      setAiResponse('Hệ thống dự báo AI nhận định: Doanh số run-rate tháng này dự kiến vượt 52.4 tỷ (+4.8%). Khuyến nghị: Duyệt hạn mức nhập kho chuỗi siêu thị trước ngày 22 để tối ưu chiết khấu nhà cung cấp.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className={cn(
      "h-full flex flex-col gap-2 font-sans overflow-hidden transition-colors",
      isTvMode ? "bg-slate-950 text-white" : ""
    )}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-3 border border-white/20">
          <CheckSquare className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Slim Glass Executive Header Bar */}
      <div className={cn(
        "flex items-center justify-between gap-3 px-3.5 py-1.5 sm:py-2 rounded-2xl backdrop-blur-xl border shadow-xs shrink-0",
        isTvMode ? "bg-slate-900/90 border-slate-800" : "bg-white/85 border-white/80"
      )}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-1.5 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xs shrink-0">
            <BarChart3 className="w-4 h-4" />
          </span>
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-xs sm:text-sm font-black tracking-tight truncate">
              Trung Tâm Điều Hành Doanh Nghiệp
            </h1>
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200/60 shrink-0">
              Executive Cockpit
            </span>
            <span className="hidden md:inline-flex px-2 py-0.5 text-[10px] bg-emerald-50 text-emerald-700 font-bold rounded-full border border-emerald-200 shrink-0">
              Realtime Sync 360°
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Time range selector */}
          <div className="hidden sm:flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 text-[11px] font-bold">
            {(['today', 'this_week', 'this_month', 'this_quarter'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-2.5 py-0.5 rounded-lg transition-all cursor-pointer",
                  timeRange === range ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-800"
                )}
              >
                {range === 'today' ? 'Hôm nay' : range === 'this_week' ? 'Tuần này' : range === 'this_month' ? 'Tháng này' : 'Quý T1'}
              </button>
            ))}
          </div>

          {/* Quick Action: Broadcast Directive */}
          <button 
            onClick={() => setShowDirectiveModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95"
            title="Ban hành chỉ thị điều hành khẩn cấp"
          >
            <Zap className="w-3 h-3 text-amber-300" />
            <span className="hidden xs:inline">Chỉ Thị Khẩn</span>
          </button>

          {/* Export Report */}
          <button 
            onClick={() => showToast('Đang tạo báo cáo Executive Briefing PDF (Khổ A4) gửi HĐQT...')}
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Xuất báo cáo điều hành"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Xuất Báo Cáo</span>
          </button>

          {/* Boardroom TV Mode Toggle */}
          <button 
            onClick={() => setIsTvMode(!isTvMode)}
            className={cn(
              "p-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer",
              isTvMode ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
            )}
            title={isTvMode ? "Tắt chế độ phòng họp TV" : "Bật chế độ trình chiếu Boardroom TV"}
          >
            <Tv className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Expanded Workspace Container */}
      <div className="flex-1 min-h-0 flex flex-col gap-2 overflow-hidden">
        {/* Executive Pulse Bar (4 Strategic Macro Metrics) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 shrink-0">
          {/* Card 1: Revenue & Progress */}
          <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Doanh Thu Hợp Nhất</span>
              <span className="p-1 rounded-lg bg-blue-50 text-blue-600">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-slate-900">45.8 tỷ</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">+12.4%</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>Tiến độ kế hoạch tháng:</span>
                <span className="font-bold text-slate-800">91.6% (Mục tiêu 50 tỷ)</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" style={{ width: '91.6%' }} />
              </div>
            </div>
          </div>

          {/* Card 2: Cash Flow & Runway */}
          <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Dòng Tiền & Thanh Khoản</span>
              <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
                <DollarSign className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-slate-900">18.2 tỷ</span>
                <span className="text-[10px] font-bold text-slate-500">khả dụng</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>Phải thu: <b className="text-emerald-700">6.4 tỷ</b></span>
                <span>Phải trả: <b className="text-rose-700">4.1 tỷ</b></span>
              </div>
              <div className="mt-1 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Runway an toàn: 8.5 tháng chi phí</span>
              </div>
            </div>
          </div>

          {/* Card 3: Headcount & Productivity */}
          <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Nhân Lực & Hiệu Suất</span>
              <span className="p-1 rounded-lg bg-purple-50 text-purple-600">
                <Users className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-slate-900">248 CBNV</span>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">96.4% Đi làm</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>Đúng hạn SLA: <b className="text-indigo-600">94.8%</b></span>
                <span>Biến động (Turnover): <b className="text-slate-700">1.2%</b></span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: '94.8%' }} />
              </div>
            </div>
          </div>

          {/* Card 4: Compliance & Risk Score */}
          <div className="p-3 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Sức Khỏe Tuân Thủ & Rủi Ro</span>
              <span className="p-1 rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg sm:text-xl font-black text-emerald-600">98 / 100</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Hạng A</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>Thuế & BHXH: <b className="text-emerald-600">Chuẩn 100%</b></span>
                <span>Gian lận O2O: <b className="text-amber-600">2 nghi vấn</b></span>
              </div>
              <div className="mt-1 text-[10px] text-slate-500 font-medium truncate">
                Core Backend 5000: <span className="text-indigo-600 font-bold">Uptime 99.98%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center justify-between gap-2 px-1 shrink-0">
          <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-xl p-1 rounded-2xl border border-white/80 shadow-2xs text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={cn(
                "px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'overview' ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Tổng Quan & Chỉ Đạo</span>
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={cn(
                "px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'departments' ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Ma Trận 5 Khối</span>
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                "px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'analytics' ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Kênh Bán & RFM</span>
            </button>
            <button
              onClick={() => setActiveTab('ai_copilot')}
              className={cn(
                "px-3 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5",
                activeTab === 'ai_copilot' ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs" : "text-slate-600 hover:text-slate-900"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Dự Báo Chiến Lược AI</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cập nhật lúc: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Tab Content Display Area */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {/* TAB 1: OVERVIEW & FAST ACTION HUB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 h-full">
              {/* Left 2 Columns: Macro Runrate & Channel Share */}
              <div className="lg:col-span-2 flex flex-col gap-2">
                {/* Revenue Run-Rate Curve */}
                <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs flex-1 min-h-[260px] flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-2">
                        <span>Đường Cong Run-Rate Doanh Thu Tháng 03/2026</span>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Dự kiến 52.4 tỷ (+4.8%)</span>
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">So sánh Doanh thu thực tế (Actual), Mục tiêu kế hoạch (Target) và Dự báo AI (Forecast)</p>
                    </div>
                  </div>
                  <div className="flex-1 w-full min-h-[190px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={REVENUE_RUNRATE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                        <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#64748B' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={(v) => `${v} tỷ`} />
                        <Tooltip 
                          formatter={(value: any) => [`${value} tỷ VNĐ`]}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: '1px solid #E2E8F0', fontSize: '11px', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="actual" name="Thực tế đạt được" stroke="#4F46E5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorActual)" />
                        <Line type="monotone" dataKey="target" name="Mục tiêu kế hoạch" stroke="#94A3B8" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                        <Area type="monotone" dataKey="forecast" name="Dự báo AI cán đích" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorForecast)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Omnichannel Market Share */}
                <div className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs flex items-center justify-between gap-4">
                  <div className="w-1/2">
                    <h4 className="text-xs font-black text-slate-900">Cơ Cấu Doanh Thu Đa Kênh (Omnichannel)</h4>
                    <p className="text-[10px] text-slate-500 font-medium">Bán lẻ tại quầy iPOS vẫn là trụ cột vững chắc (38%)</p>
                    <div className="mt-2 space-y-1 text-[11px] font-bold">
                      {OMNICHANNEL_SHARE.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-slate-600">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            {item.name}
                          </span>
                          <span className="text-slate-900">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="w-1/2 h-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={OMNICHANNEL_SHARE}
                          innerRadius={30}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {OMNICHANNEL_SHARE.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Right 1 Column: Executive Decision Hub (CEO Pending Approvals & Bottlenecks) */}
              <div className="flex flex-col gap-2">
                {/* CEO Urgent Approval Queue */}
                <div className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="p-1 rounded-lg bg-amber-50 text-amber-700">
                        <Flame className="w-3.5 h-3.5 text-amber-600" />
                      </span>
                      <h3 className="text-xs font-black text-slate-900">Chờ Lãnh Đạo Ký Duyệt</h3>
                    </div>
                    <button 
                      onClick={() => navigate('/requests')}
                      className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Tất cả</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>

                  <p className="text-[10px] text-slate-500 font-medium mb-2.5">Các khoản chi & hợp đồng vượt hạn mức thẩm quyền cấp dưới</p>

                  <div className="space-y-2 flex-1">
                    {CEO_PENDING_APPROVALS.map((item) => (
                      <div key={item.id} className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1.5 hover:bg-slate-100/80 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <span className={cn(
                            "text-[9px] font-black px-1.5 py-0.2 rounded-full",
                            item.priority === 'urgent' ? "bg-rose-100 text-rose-700 border border-rose-200" : "bg-blue-100 text-blue-700 border border-blue-200"
                          )}>
                            {item.sla}
                          </span>
                          <span className="text-xs font-black text-slate-900 text-right">
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</p>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span>{item.creator}</span>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => showToast(`Đã phê duyệt điện tử ${item.id}`)}
                              className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
                            >
                              Duyệt ngay
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Critical Operational Blockers */}
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                      Điểm Nghẽn Cần Tháo Gỡ
                    </span>
                    <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded-full">SLA Warning</span>
                  </div>
                  <p className="text-xs font-bold text-slate-100 leading-snug">
                    Kho Trung Tâm VComm (Quận 7) đang đạt 92% dung lượng chứa. Cần giải phóng 200 pallet trước 28/03.
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px]">
                    <span className="text-slate-400">Đầu mối: Đỗ Minh Trí</span>
                    <button 
                      onClick={() => navigate('/omnichat')}
                      className="px-2 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span>Mở chat chỉ đạo</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 5 DEPARTMENT PERFORMANCE MATRIX */}
          {activeTab === 'departments' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {DEPARTMENT_METRICS.map((dept) => {
                  const Icon = dept.icon;
                  return (
                    <div key={dept.id} className="p-3.5 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={cn("p-2 rounded-xl text-white shadow-xs bg-gradient-to-br", dept.color)}>
                            <Icon className="w-4 h-4" />
                          </span>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{dept.name}</h4>
                            <p className="text-[10px] text-slate-500 font-medium">{dept.head}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-black",
                          dept.progress >= 100 ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {dept.progress}% KPI
                        </span>
                      </div>

                      {dept.revenue > 0 && (
                        <div>
                          <div className="flex items-baseline justify-between text-xs font-bold">
                            <span className="text-slate-500 text-[10px]">Doanh số ghi nhận:</span>
                            <span className="text-slate-900">{formatCurrency(dept.revenue)}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.min(dept.progress, 100)}%` }} />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-center">
                        {dept.kpis.map((kpi, idx) => (
                          <div key={idx} className="p-1.5 rounded-xl bg-slate-50">
                            <p className="text-[9px] text-slate-400 font-medium truncate">{kpi.label}</p>
                            <p className="text-[11px] font-black text-slate-800 mt-0.5 truncate">{kpi.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Trạng thái: <b className="text-emerald-600">Hoạt động ổn định</b></span>
                        <button 
                          onClick={() => showToast(`Xem báo cáo chi tiết ${dept.name}`)}
                          className="font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                        >
                          Chi tiết &gt;
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: OMNICHANNEL ANALYTICS & RFM */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {/* RFM Customer Segmentation */}
              <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">Phân Khúc Khách Hàng RFM Doanh Nghiệp</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Định vị nhóm khách hàng mang lại giá trị cao nhất cho VComm</p>
                  </div>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">Tổng: 1,070 Doanh nghiệp</span>
                </div>

                <div className="space-y-2">
                  {[
                    { group: 'Khách hàng VIP (Doanh nghiệp & Đại lý lớn)', count: 120, value: 450000000, share: '42%' },
                    { group: 'Khách hàng Tiềm năng & Tần suất cao', count: 450, value: 850000000, share: '38%' },
                    { group: 'Có nguy cơ rời bỏ (Chưa đặt lại > 45 ngày)', count: 180, value: 120000000, share: '14%' },
                    { group: 'Dormant (Ngủ đông > 90 ngày)', count: 320, value: 45000000, share: '6%' },
                  ].map((row, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{row.group}</p>
                        <p className="text-[10px] text-slate-500">{row.count} khách hàng • Đóng góp {row.share} doanh thu</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-indigo-600">{formatCurrency(row.value)}</p>
                        <button 
                          onClick={() => showToast(`Kích hoạt chiến dịch Re-engagement cho nhóm ${row.group}`)}
                          className="text-[9px] font-bold text-slate-500 hover:text-indigo-600 underline cursor-pointer"
                        >
                          Tạo chiến dịch
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Channel Performance Detailed */}
              <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900">Chi Phí & Biên Lợi Nhuận Theo Kênh Bán</h3>
                    <p className="text-[10px] text-slate-500 font-medium">So sánh hoa hồng sàn TMĐT vs chi phí mặt bằng siêu thị</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200/70">
                    <div className="flex items-center justify-between font-bold text-indigo-950">
                      <span>iPOS (Siêu Thị & Cửa Hàng Tại Quầy)</span>
                      <span className="text-emerald-700">Biên LN: 28.5%</span>
                    </div>
                    <p className="text-[10px] text-indigo-700 mt-1">Phí hoa hồng: 0% • Chi phí mặt bằng & nhân sự quầy: 8.2%</p>
                  </div>

                  <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/70">
                    <div className="flex items-center justify-between font-bold text-sky-950">
                      <span>VComm Mall & FlashSale Trực Tuyến</span>
                      <span className="text-sky-700">Biên LN: 24.2%</span>
                    </div>
                    <p className="text-[10px] text-sky-700 mt-1">Phí sàn nội bộ: 5.5% • Chi phí Marketing & Livestream: 3.2%</p>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/70">
                    <div className="flex items-center justify-between font-bold text-emerald-950">
                      <span>NextHub B2B & Đại Lý Nhượng Quyền</span>
                      <span className="text-emerald-800">Biên LN: 22.0%</span>
                    </div>
                    <p className="text-[10px] text-emerald-700 mt-1">Chiết khấu số lượng lớn: 15% • Chi phí công nợ: 1.5%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PREDICTIVE EXECUTIVE COPILOT */}
          {activeTab === 'ai_copilot' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2.5">
              {/* AI Forecast Scenarios (2 Columns) */}
              <div className="lg:col-span-2 space-y-2.5">
                <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        <span>Kịch Bản Dự Báo Doanh Số & Dòng Tiền 60 Ngày Tới</span>
                      </h3>
                      <p className="text-[10px] text-slate-500 font-medium">Mô hình AI Monte Carlo phân tích dựa trên lịch sử 24 tháng và xu hướng thị trường</p>
                    </div>
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      Độ tin cậy: 94.2%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Thận Trọng (Bear)</p>
                      <p className="text-base font-black text-slate-700 mt-1">48.5 tỷ</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Tăng trưởng: +6.2%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                      <p className="text-[10px] font-bold text-indigo-600 uppercase">Cơ Sở (Base - Khả dĩ nhất)</p>
                      <p className="text-base font-black text-indigo-700 mt-1">52.4 tỷ</p>
                      <p className="text-[10px] text-indigo-600 font-bold mt-0.5">Tăng trưởng: +14.8%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase">Lạc Quan (Bull)</p>
                      <p className="text-base font-black text-emerald-700 mt-1">56.8 tỷ</p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Tăng trưởng: +24.5%</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200/70 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-black text-purple-900">
                      <Bot className="w-4 h-4 text-purple-600" />
                      <span>3 Khuyến Nghị Quyết Sách Từ Trợ Lý AI:</span>
                    </div>
                    <ul className="text-xs text-purple-800 space-y-1 pl-4 list-disc font-medium">
                      <li><b>Tăng hạn mức nhập kho ngành bách hóa & FMCG</b>: Dự báo tháng 4 nhu cầu O2O tăng 22%, cần ký trước hợp đồng nguyên tắc để giữ giá tốt.</li>
                      <li><b>Đẩy mạnh chiến dịch FlashSale & Livestream trên VComm</b>: Phân hệ FlashSale mang lại tỷ lệ chuyển đổi cao hơn 34% so với bán lẻ thông thường.</li>
                      <li><b>Rút ngắn kỳ hạn đối soát công nợ B2B từ 30 ngày xuống 15 ngày</b>: Tối ưu dòng tiền thanh khoản thêm 3.2 tỷ tiền mặt.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Interactive AI Chat with CEO (1 Column) */}
              <div className="p-4 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/80 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 mb-1">
                    <Bot className="w-4 h-4 text-indigo-600" />
                    <span>Hỏi Đáp Trợ Lý Điều Hành</span>
                  </h3>
                  <p className="text-[10px] text-slate-500 font-medium mb-3">Đặt câu hỏi tự nhiên về dữ liệu và kịch bản chiến lược</p>

                  <div className="space-y-1.5 mb-3">
                    <button 
                      onClick={() => setAiPrompt('Dự báo tình hình lợi nhuận quý này nếu giữ nguyên chi phí vận hành?')}
                      className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-700 border border-slate-200/80 transition-colors cursor-pointer"
                    >
                      💡 Dự báo lợi nhuận quý này nếu giữ nguyên chi phí?
                    </button>
                    <button 
                      onClick={() => setAiPrompt('So sánh hiệu quả phân hệ VComm Mall so với VComm FlashSale?')}
                      className="w-full text-left p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[11px] font-medium text-slate-700 border border-slate-200/80 transition-colors cursor-pointer"
                    >
                      💡 So sánh hiệu quả VComm Mall vs FlashSale?
                    </button>
                  </div>

                  {aiResponse && (
                    <div className="p-3 rounded-xl bg-indigo-50/80 border border-indigo-200 text-xs text-slate-800 leading-relaxed max-h-[160px] overflow-y-auto font-medium">
                      {aiResponse}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200/80">
                  <div className="flex items-center gap-1.5">
                    <input 
                      type="text" 
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAskAi()}
                      placeholder="Nhập câu hỏi chỉ đạo cho AI..."
                      className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:bg-white focus:border-indigo-500"
                    />
                    <button 
                      onClick={handleAskAi}
                      disabled={isAiLoading || !aiPrompt.trim()}
                      className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer disabled:opacity-40"
                    >
                      {isAiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: BROADCAST EXECUTIVE DIRECTIVE */}
      {showDirectiveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-3xl p-6 border border-white/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-100 text-purple-700">
                  <Zap className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Ban Hành Chỉ Thị Điều Hành Khẩn</h3>
                  <p className="text-xs text-slate-500">Thông báo sẽ được đẩy ưu tiên cao nhất tới toàn bộ Ban Lãnh đạo</p>
                </div>
              </div>
              <button 
                onClick={() => setShowDirectiveModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Đối tượng nhận chỉ đạo:</label>
                <div className="flex flex-wrap gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200">Tất cả Giám đốc Khối</span>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">Trưởng Bộ Phận</span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">Văn phòng HĐQT</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung chỉ thị từ Ban Giám Đốc:</label>
                <textarea 
                  rows={4}
                  value={directiveText}
                  onChange={(e) => setDirectiveText(e.target.value)}
                  placeholder="Nhập nội dung chỉ đạo điều hành... (ví dụ: Yêu cầu Khối Vận hành và Chuỗi cung ứng họp khẩn lúc 14h hôm nay để xử lý tồn kho)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-semibold focus:outline-none focus:bg-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button 
                onClick={() => setShowDirectiveModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={handleSendDirective}
                disabled={!directiveText.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
              >
                Phát Lệnh Chỉ Thị
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
