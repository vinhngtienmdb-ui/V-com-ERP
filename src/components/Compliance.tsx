import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Scale, 
  FileText, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Eye, 
  MoreVertical, 
  Gavel, 
  Download,
  Activity,
  BarChart3,
  Flame,
  Plus,
  TrendingDown,
  TrendingUp,
  Sliders,
  CheckSquare,
  Sparkles,
  Layers,
  ArrowUpRight,
  Shield,
  X,
  Building2,
  Calendar
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { BrandProtection, DisputeRequest } from '../types/erp';

// Model chuẩn ERM ISO 31000 từ repo qtrr
export type RiskCategory = 'Operational' | 'Financial' | 'Compliance' | 'CyberSecurity' | 'SupplyChain';
export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type RiskStrategy = 'Avoid' | 'Mitigate' | 'Transfer' | 'Accept';
export type RiskStatus = 'Open' | 'Mitigating' | 'Controlled' | 'Closed';

export interface EnterpriseRisk {
  id: string;
  code: string;
  title: string;
  category: RiskCategory;
  description: string;
  likelihood: number; // 1 to 5
  impact: number;     // 1 to 5
  inherentScore: number; // likelihood * impact (1 - 25)
  residualScore: number; // Điểm sau kiểm soát
  level: RiskLevel;
  owner: string;
  department: string;
  strategy: RiskStrategy;
  mitigationPlan: string;
  mitigationProgress: number; // 0 - 100%
  status: RiskStatus;
  updatedAt: string;
  dueDate: string;
}

export interface KRIItem {
  id: string;
  name: string;
  category: RiskCategory;
  currentValue: string;
  thresholdGreen: string;
  thresholdAmber: string;
  thresholdRed: string;
  status: 'Normal' | 'Warning' | 'Critical';
  trend: 'up' | 'down' | 'stable';
  owner: string;
}

// Dữ liệu mẫu Enterprise Risk Register
const MOCK_RISKS: EnterpriseRisk[] = [
  {
    id: 'RSK-001',
    code: 'CYB-01',
    title: 'Sự cố tấn công DDoS & rò rỉ dữ liệu thông tin khách hàng trên sàn',
    category: 'CyberSecurity',
    description: 'Nguy cơ mã độc tống tiền hoặc tấn công từ chối dịch vụ làm sập hệ thống thanh toán và đơn hàng.',
    likelihood: 4,
    impact: 5,
    inherentScore: 20,
    residualScore: 8,
    level: 'Critical',
    owner: 'Trần Đình Trọng (CISO)',
    department: 'Công nghệ & An toàn thông tin',
    strategy: 'Mitigate',
    mitigationPlan: 'Triển khai Cloudflare Enterprise WAF, định kỳ Pentest 3 tháng/lần, backup sao lưu đa vùng AWS & GCP.',
    mitigationProgress: 75,
    status: 'Mitigating',
    updatedAt: '12/03/2026',
    dueDate: '30/04/2026'
  },
  {
    id: 'RSK-002',
    code: 'CMP-02',
    title: 'Rủi ro pháp lý xử phạt hành chính về lao động & BHXH theo NĐ 283/2026',
    category: 'Compliance',
    description: 'Chậm đóng BHXH cho nhân sự hết thử việc và vi phạm số giờ làm thêm OT của khối kho vận.',
    likelihood: 4,
    impact: 4,
    inherentScore: 16,
    residualScore: 6,
    level: 'High',
    owner: 'Đỗ Mạnh Cường (HR Director)',
    department: 'Nhân sự & Lao động',
    strategy: 'Mitigate',
    mitigationPlan: 'Rà soát 100% hợp đồng, tự động hóa cảnh báo OT qua App, nộp tờ khai báo tăng BHXH trước ngày 20 hằng tháng.',
    mitigationProgress: 90,
    status: 'Mitigating',
    updatedAt: '15/03/2026',
    dueDate: '31/03/2026'
  },
  {
    id: 'RSK-003',
    code: 'FIN-01',
    title: 'Biến động tỷ giá USD/VND và rủi ro chậm thanh toán từ đối tác B2B',
    category: 'Financial',
    description: 'Công nợ quá hạn từ các chuỗi đại lý lớn dẫn đến thiếu hụt dòng tiền lưu động ngắn hạn.',
    likelihood: 3,
    impact: 4,
    inherentScore: 12,
    residualScore: 6,
    level: 'High',
    owner: 'Nguyễn Văn Quang (CFO)',
    department: 'Tài chính - Kế toán',
    strategy: 'Transfer',
    mitigationPlan: 'Sử dụng hợp đồng phái sinh bảo hiểm tỷ giá Forward, siết hạn mức tín dụng 30 ngày cho khách hàng nợ nhóm 2.',
    mitigationProgress: 60,
    status: 'Mitigating',
    updatedAt: '10/03/2026',
    dueDate: '15/05/2026'
  },
  {
    id: 'RSK-004',
    code: 'OPR-01',
    title: 'Quá tải hệ thống trung tâm phân phối kho Long Biên mùa Mega Sale',
    category: 'Operational',
    description: 'Nghẽn cổ chai khâu đóng gói xuất hàng khiến thời gian hoàn tất đơn tăng quá 48 giờ.',
    likelihood: 4,
    impact: 3,
    inherentScore: 12,
    residualScore: 4,
    level: 'Medium',
    owner: 'Lê Hoàng Minh (Kho vận)',
    department: 'Vận hành Sàn',
    strategy: 'Mitigate',
    mitigationPlan: 'Ký hợp đồng thuê thêm kho đệm vệ tinh, kích hoạt hệ thống băng chuyền phân loại tự động Sorting Hub.',
    mitigationProgress: 85,
    status: 'Controlled',
    updatedAt: '08/03/2026',
    dueDate: '20/04/2026'
  },
  {
    id: 'RSK-005',
    code: 'SUP-01',
    title: 'Đứt gãy nguồn cung linh kiện từ đối tác sản xuất thiết bị POS',
    category: 'SupplyChain',
    description: 'Nhà máy cung ứng duy nhất gặp sự cố gián đoạn sản xuất kéo dài.',
    likelihood: 2,
    impact: 4,
    inherentScore: 8,
    residualScore: 4,
    level: 'Medium',
    owner: 'Hoàng Quốc Việt (Mua hàng)',
    department: 'Cung ứng & Mua sắm',
    strategy: 'Avoid',
    mitigationPlan: 'Mở rộng tìm kiếm thêm 2 nhà cung cấp dự phòng tại miền Trung và miền Nam.',
    mitigationProgress: 50,
    status: 'Mitigating',
    updatedAt: '05/03/2026',
    dueDate: '30/06/2026'
  },
  {
    id: 'RSK-006',
    code: 'LEG-03',
    title: 'Tranh chấp quyền sở hữu trí tuệ thương hiệu hàng hóa trên sàn',
    category: 'Compliance',
    description: 'Seller bán hàng vi phạm nhãn hiệu chính hãng dẫn đến khiếu kiện liên đới trách nhiệm sàn TMĐT.',
    likelihood: 3,
    impact: 3,
    inherentScore: 9,
    residualScore: 3,
    level: 'Medium',
    owner: 'Vũ Quốc Khánh (Pháp chế)',
    department: 'Pháp chế & Bảo quyền',
    strategy: 'Mitigate',
    mitigationPlan: 'Yêu cầu giấy ủy quyền đại lý chính hãng, tích hợp AI tự động quét ảnh nhãn hiệu vi phạm khi đăng tải sản phẩm.',
    mitigationProgress: 95,
    status: 'Controlled',
    updatedAt: '14/03/2026',
    dueDate: '25/03/2026'
  }
];

// Chỉ số rủi ro trọng yếu (KRI)
const MOCK_KRIS: KRIItem[] = [
  {
    id: 'KRI-01',
    name: 'Tỷ lệ thanh toán trực tuyến thất bại (Payment Failure Rate)',
    category: 'CyberSecurity',
    currentValue: '0.42%',
    thresholdGreen: '< 1.0%',
    thresholdAmber: '1.0% - 2.5%',
    thresholdRed: '> 2.5%',
    status: 'Normal',
    trend: 'down',
    owner: 'Khối Fintech'
  },
  {
    id: 'KRI-02',
    name: 'Tỷ lệ đơn hàng giao trễ SLA 48h trên toàn quốc',
    category: 'Operational',
    currentValue: '3.8%',
    thresholdGreen: '< 2.0%',
    thresholdAmber: '2.0% - 5.0%',
    thresholdRed: '> 5.0%',
    status: 'Warning',
    trend: 'up',
    owner: 'Vận hành Logistics'
  },
  {
    id: 'KRI-03',
    name: 'Số vụ việc tranh chấp sở hữu trí tuệ chưa giải quyết quá 7 ngày',
    category: 'Compliance',
    currentValue: '2 vụ việc',
    thresholdGreen: '< 3 vụ',
    thresholdAmber: '3 - 8 vụ',
    thresholdRed: '> 8 vụ',
    status: 'Normal',
    trend: 'stable',
    owner: 'Pháp chế'
  },
  {
    id: 'KRI-04',
    name: 'Tỷ lệ công nợ Seller & Khách sỉ quá hạn > 60 ngày',
    category: 'Financial',
    currentValue: '6.5%',
    thresholdGreen: '< 4.0%',
    thresholdAmber: '4.0% - 7.0%',
    thresholdRed: '> 7.0%',
    status: 'Warning',
    trend: 'up',
    owner: 'Tài chính - Kế toán'
  }
];

const MOCK_BRANDS: BrandProtection[] = [
  { id: 'BRD-001', brandName: 'Samsung Official Store', ownerId: 'SEL-001', registrationDate: '10/01/2024', status: 'verified', documents: ['GPKD.pdf', 'Trademark.pdf'] },
  { id: 'BRD-002', brandName: 'Louis Vuitton Vietnam', ownerId: 'SEL-099', registrationDate: '01/03/2024', status: 'pending', documents: ['LV_Global_Auth.pdf'] },
];

const MOCK_DISPUTES: DisputeRequest[] = [
  { id: 'DSP-102', orderId: 'ORD-5541', type: 'counterfeit', reporterId: 'USR-882', evidence: ['img1.jpg', 'video.mp4'], status: 'investigating' },
  { id: 'DSP-103', orderId: 'ORD-8821', type: 'ip_infringement', reporterId: 'BRAND-OWNER-02', evidence: ['proof.pdf'], status: 'open' },
];

export function Compliance() {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'register' | 'kri' | 'mitigation' | 'brand' | 'dispute'>('heatmap');
  const [risks, setRisks] = useState<EnterpriseRisk[]>(MOCK_RISKS);
  const [selectedCell, setSelectedCell] = useState<{ likelihood: number; impact: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchRisk, setSearchRisk] = useState<string>('');
  const [isAddRiskModalOpen, setIsAddRiskModalOpen] = useState(false);
  const [newRisk, setNewRisk] = useState<Partial<EnterpriseRisk>>({
    category: 'Operational',
    likelihood: 3,
    impact: 3,
    strategy: 'Mitigate',
    status: 'Open'
  });

  // Tính mức rủi ro theo điểm
  const getRiskLevel = (score: number): RiskLevel => {
    if (score >= 15) return 'Critical';
    if (score >= 10) return 'High';
    if (score >= 5) return 'Medium';
    return 'Low';
  };

  // Lọc rủi ro theo ma trận hoặc category hoặc search
  const filteredRisks = useMemo(() => {
    return risks.filter(r => {
      const matchCell = !selectedCell || (r.likelihood === selectedCell.likelihood && r.impact === selectedCell.impact);
      const matchCategory = selectedCategory === 'all' || r.category === selectedCategory;
      const matchSearch = !searchRisk || 
        r.title.toLowerCase().includes(searchRisk.toLowerCase()) || 
        r.code.toLowerCase().includes(searchRisk.toLowerCase()) ||
        r.owner.toLowerCase().includes(searchRisk.toLowerCase());
      return matchCell && matchCategory && matchSearch;
    });
  }, [risks, selectedCell, selectedCategory, searchRisk]);

  // Màu sắc của từng ô trong ma trận 5x5
  const getMatrixCellColor = (likelihood: number, impact: number) => {
    const score = likelihood * impact;
    if (score >= 15) return 'bg-rose-500 text-white hover:bg-rose-600';
    if (score >= 10) return 'bg-amber-500 text-white hover:bg-amber-600';
    if (score >= 5) return 'bg-yellow-400 text-slate-900 hover:bg-yellow-500';
    return 'bg-emerald-500 text-white hover:bg-emerald-600';
  };

  // Đếm số lượng rủi ro trong từng ô (L, I)
  const getRiskCountInCell = (likelihood: number, impact: number) => {
    return risks.filter(r => r.likelihood === likelihood && r.impact === impact).length;
  };

  // Thống kê nhanh
  const stats = useMemo(() => {
    const criticalCount = risks.filter(r => r.level === 'Critical').length;
    const highCount = risks.filter(r => r.level === 'High').length;
    const mediumCount = risks.filter(r => r.level === 'Medium').length;
    const lowCount = risks.filter(r => r.level === 'Low').length;
    const avgScore = Math.round(risks.reduce((acc, cur) => acc + cur.inherentScore, 0) / (risks.length || 1));
    return { criticalCount, highCount, mediumCount, lowCount, avgScore };
  }, [risks]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Header ERM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 mb-1">
            <Shield className="w-4 h-4" />
            <span>Enterprise Risk Management • ISO 31000 & COSO Standard</span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200">
              QTRR Engine
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Trung Tâm Quản Trị Rủi Ro & Tuân Thủ (ERM)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Ma trận nhiệt rủi ro 5x5 tương tác, Sổ đăng ký rủi ro (Risk Register), Chỉ số cảnh báo sớm KRI và kế hoạch ứng phó toàn diện.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setIsAddRiskModalOpen(true)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shadow-indigo-600/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Mới Rủi Ro (Risk Item)</span>
          </button>
          <button
            onClick={() => alert('Đã xuất Báo cáo Quản trị Rủi ro Doanh nghiệp định dạng PDF.')}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Xuất Báo Cáo ERM</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase">Tổng Số Rủi Ro</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{risks.length}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">5 Phân hệ nghiệp vụ</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-rose-600 font-bold uppercase">Rủi Ro Khẩn Cấp (Critical)</p>
            <p className="text-2xl font-black text-rose-600 mt-1">{stats.criticalCount}</p>
            <p className="text-[11px] text-rose-700 font-medium mt-0.5">Cần hành động tức thì</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-200">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-amber-600 font-bold uppercase">Rủi Ro Mức Cao (High)</p>
            <p className="text-2xl font-black text-amber-600 mt-1">{stats.highCount}</p>
            <p className="text-[11px] text-amber-700 font-medium mt-0.5">Ưu tiên giám sát tuần</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-200">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-yellow-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-yellow-700 font-bold uppercase">Mức Trung Bình (Medium)</p>
            <p className="text-2xl font-black text-yellow-700 mt-1">{stats.mediumCount}</p>
            <p className="text-[11px] text-yellow-800 font-medium mt-0.5">Đã có kế hoạch kiểm soát</p>
          </div>
          <div className="p-3 bg-yellow-50 text-yellow-700 rounded-xl border border-yellow-200">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-700 font-bold uppercase">Điểm Rủi Ro Bình Quân</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{stats.avgScore} <span className="text-xs font-normal text-slate-400">/ 25</span></p>
            <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Mức an toàn tổng thể</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs điều hướng ERM */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-2">
        {[
          { id: 'heatmap', label: '1. Ma Trận Nhiệt Rủi Ro 5x5 (Heatmap Matrix)', icon: BarChart3 },
          { id: 'register', label: `2. Sổ Đăng Ký Rủi Ro (${risks.length})`, icon: FileText },
          { id: 'kri', label: '3. Chỉ Số Cảnh Báo Sớm KRI', icon: Activity },
          { id: 'mitigation', label: '4. Kế Hoạch Ứng Phó & Giảm Thiểu', icon: CheckSquare },
          { id: 'brand', label: '5. Cổng Bảo Quyền Thương Hiệu', icon: ShieldCheck },
          { id: 'dispute', label: '6. Xử Lý Tranh Chấp Sàn', icon: Gavel }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border",
              activeTab === tab.id
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: MA TRẬN NHIỆT RỦI RO 5x5 INTERACTIVE */}
      {activeTab === 'heatmap' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Heatmap Grid 5x5 */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-600" /> Ma Trận Rủi Ro (Likelihood x Impact)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Nhấp vào từng ô để lọc danh sách rủi ro tương ứng bên phải.</p>
              </div>
              {selectedCell && (
                <button
                  onClick={() => setSelectedCell(null)}
                  className="px-2.5 py-1 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 border border-indigo-200"
                >
                  Xóa lọc ô ({selectedCell.likelihood}x{selectedCell.impact})
                </button>
              )}
            </div>

            {/* Matrix Container */}
            <div className="space-y-3">
              <div className="flex">
                {/* Trục Tung (Impact 5 -> 1) */}
                <div className="flex flex-col justify-between pr-3 py-2 text-right text-[11px] font-bold text-slate-600 select-none w-28 shrink-0">
                  <span className="text-rose-600 font-extrabold">5. Thảm họa</span>
                  <span className="text-amber-600">4. Nghiêm trọng</span>
                  <span className="text-yellow-600">3. Trung bình</span>
                  <span className="text-emerald-600">2. Nhỏ</span>
                  <span className="text-slate-400">1. Không đáng kể</span>
                </div>

                {/* 5x5 Grid Cells */}
                <div className="flex-1 grid grid-cols-5 gap-2">
                  {[5, 4, 3, 2, 1].map(impact => (
                    <React.Fragment key={impact}>
                      {[1, 2, 3, 4, 5].map(likelihood => {
                        const count = getRiskCountInCell(likelihood, impact);
                        const isSelected = selectedCell?.likelihood === likelihood && selectedCell?.impact === impact;
                        return (
                          <button
                            key={`${likelihood}-${impact}`}
                            onClick={() => setSelectedCell(isSelected ? null : { likelihood, impact })}
                            className={cn(
                              "h-16 rounded-xl flex flex-col items-center justify-center font-black transition-all text-xs relative",
                              getMatrixCellColor(likelihood, impact),
                              isSelected ? "ring-4 ring-slate-900 shadow-xl scale-105 z-10" : "shadow-xs hover:scale-102"
                            )}
                          >
                            <span className="text-[10px] opacity-75 font-mono">{likelihood}x{impact}={likelihood * impact}</span>
                            {count > 0 ? (
                              <span className="mt-0.5 px-2 py-0.5 rounded-full bg-white text-slate-900 font-black text-xs shadow-sm">
                                {count} rủi ro
                              </span>
                            ) : (
                              <span className="text-[11px] opacity-40">-</span>
                            )}
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Trục Hoành (Likelihood 1 -> 5) */}
              <div className="flex pl-32">
                <div className="flex-1 grid grid-cols-5 gap-2 text-center text-[11px] font-bold text-slate-600 select-none">
                  <span>1. Rất hiếm</span>
                  <span>2. Hiếm</span>
                  <span>3. Có thể</span>
                  <span>4. Thường gặp</span>
                  <span className="text-rose-600 font-extrabold">5. Chắc chắn</span>
                </div>
              </div>
              <p className="text-center text-xs font-bold text-slate-500 uppercase tracking-widest pt-2">
                Khả Năng Xảy Ra (Likelihood) →
              </p>
            </div>
          </div>

          {/* Cột Phải: Danh sách rủi ro đã lọc theo ma trận */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                {selectedCell 
                  ? `Rủi ro tại ô [Khả năng: ${selectedCell.likelihood}, Tác động: ${selectedCell.impact}]` 
                  : 'Danh sách rủi ro trọng điểm'}
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 rounded-lg text-slate-600">
                {filteredRisks.length} mục
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredRisks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Không có rủi ro nào nằm trong ô đánh giá này.
                </div>
              ) : (
                filteredRisks.map(r => (
                  <div
                    key={r.id}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-all space-y-2 bg-slate-50/50 hover:bg-white"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {r.code}
                      </span>
                      <span className={cn(
                        "text-[10px] font-black px-2 py-0.5 rounded-full uppercase",
                        r.level === 'Critical' ? "bg-rose-100 text-rose-700" :
                        r.level === 'High' ? "bg-amber-100 text-amber-700" :
                        r.level === 'Medium' ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {r.level} ({r.inherentScore} pts)
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 leading-snug">{r.title}</h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">{r.description}</p>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-600">
                      <span>Phụ trách: <strong>{r.owner}</strong></span>
                      <span className="font-semibold text-indigo-600">Ứng phó: {r.mitigationProgress}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RISK REGISTER BẢNG CHI TIẾT */}
      {activeTab === 'register' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="relative flex-1 w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã rủi ro, tiêu đề, người phụ trách..."
                value={searchRisk}
                onChange={(e) => setSearchRisk(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
              >
                <option value="all">Tất cả Nhóm Rủi Ro</option>
                <option value="CyberSecurity">An Toàn Thông Tin & CNTT</option>
                <option value="Compliance">Pháp Lý & Tuân Thủ</option>
                <option value="Financial">Tài Chính & Thanh Khoản</option>
                <option value="Operational">Vận Hành Sàn & Kho Bãi</option>
                <option value="SupplyChain">Chuỗi Cung Ứng</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-3 px-3">Mã</th>
                  <th className="py-3 px-4">Tên Rủi Ro & Mô Tả</th>
                  <th className="py-3 px-3">Phân Loại</th>
                  <th className="py-3 px-2 text-center">Khả Năng</th>
                  <th className="py-3 px-2 text-center">Tác Động</th>
                  <th className="py-3 px-3 text-center">Điểm Rủi Ro</th>
                  <th className="py-3 px-3">Người Chịu Trách Nhiệm</th>
                  <th className="py-3 px-3">Chiến Lược</th>
                  <th className="py-3 px-3 text-center">Tiến Độ</th>
                  <th className="py-3 px-3 text-right">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRisks.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-indigo-700">{r.code}</td>
                    <td className="py-3 px-4 max-w-sm">
                      <span className="font-bold text-slate-900 block">{r.title}</span>
                      <span className="text-[11px] text-slate-500 line-clamp-1">{r.description}</span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {r.category}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-bold">{r.likelihood}/5</td>
                    <td className="py-3 px-2 text-center font-bold">{r.impact}/5</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-black",
                        r.level === 'Critical' ? "bg-rose-100 text-rose-700" :
                        r.level === 'High' ? "bg-amber-100 text-amber-700" :
                        r.level === 'Medium' ? "bg-yellow-100 text-yellow-800" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {r.inherentScore} pts ({r.level})
                      </span>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-bold text-slate-800 block">{r.owner}</span>
                      <span className="text-[10px] text-slate-400">{r.department}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">{r.strategy}</td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="w-16 bg-slate-200 rounded-full h-2 mx-auto overflow-hidden">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${r.mitigationProgress}%` }} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-600">{r.mitigationProgress}%</span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CHỈ SỐ CẢNH BÁO SỚM KRI */}
      {activeTab === 'kri' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> Hệ Thống Chỉ Số Rủi Ro Trọng Yếu (Key Risk Indicators - KRI)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Giám sát tự động các ngưỡng cảnh báo sớm để can thiệp kịp thời trước khi rủi ro phát sinh thiệt hại.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MOCK_KRIS.map(kri => (
              <div
                key={kri.id}
                className={cn(
                  "p-5 rounded-2xl border shadow-sm space-y-3 bg-white",
                  kri.status === 'Warning' ? "border-amber-300 ring-1 ring-amber-300/30" : "border-slate-200"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">{kri.category}</span>
                  <span className={cn(
                    "px-2 py-0.5 text-[10px] font-bold rounded-full",
                    kri.status === 'Normal' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  )}>
                    {kri.status === 'Normal' ? 'Trong ngưỡng an toàn' : 'Vượt ngưỡng cảnh báo'}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{kri.name}</h4>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-2xl font-black text-slate-900">{kri.currentValue}</span>
                    <span className="text-xs text-slate-400">Phụ trách: {kri.owner}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[10px] text-center">
                  <div className="p-1.5 rounded bg-emerald-50 text-emerald-700">
                    <p className="font-bold">An toàn (Green)</p>
                    <p>{kri.thresholdGreen}</p>
                  </div>
                  <div className="p-1.5 rounded bg-amber-50 text-amber-700">
                    <p className="font-bold">Cảnh báo (Amber)</p>
                    <p>{kri.thresholdAmber}</p>
                  </div>
                  <div className="p-1.5 rounded bg-rose-50 text-rose-700">
                    <p className="font-bold">Khẩn cấp (Red)</p>
                    <p>{kri.thresholdRed}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: KẾ HOẠCH GIẢM THIỂU */}
      {activeTab === 'mitigation' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-indigo-600" /> Kế Hoạch Hành Động Giảm Thiểu Rủi Ro (Mitigation Action Plans)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Tiến độ thực hiện các biện pháp kiểm soát và hạn chế thiệt hại.</p>
          </div>

          <div className="space-y-3">
            {risks.map(r => (
              <div key={r.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-700">{r.code}</span>
                    <span className="font-bold text-xs text-slate-900">{r.title}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600">{r.mitigationProgress}% hoàn thành</span>
                </div>
                <p className="text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-200">
                  <strong>Biện pháp:</strong> {r.mitigationPlan}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Chủ trì: <strong>{r.owner}</strong> ({r.department})</span>
                  <span>Hạn chót: <strong>{r.dueDate}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BẢO VỆ THƯƠNG HIỆU */}
      {activeTab === 'brand' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Danh Sách Nhãn Hiệu Được Bảo Quyền Sở Hữu Trí Tuệ</h3>
            <button
              onClick={() => alert('Mở form đăng ký bảo quyền mới')}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700"
            >
              + Đăng ký nhãn hiệu
            </button>
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Mã</th>
                <th className="py-2.5 px-3">Tên Thương Hiệu</th>
                <th className="py-2.5 px-3">Mã Chủ Sở Hữu</th>
                <th className="py-2.5 px-3">Ngày Cấp Quyền</th>
                <th className="py-2.5 px-3">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_BRANDS.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-blue-700">{b.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{b.brandName}</td>
                  <td className="py-3 px-3 text-slate-600">{b.ownerId}</td>
                  <td className="py-3 px-3 text-slate-600">{b.registrationDate}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {b.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 6: TRANH CHẤP */}
      {activeTab === 'dispute' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">Hồ Sơ Tranh Chấp & Khiếu Nại Bản Quyền Sàn</h3>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
              <tr>
                <th className="py-2.5 px-3">Mã Vụ Việc</th>
                <th className="py-2.5 px-3">Mã Đơn Hàng / SKU</th>
                <th className="py-2.5 px-3">Loại Khiếu Nại</th>
                <th className="py-2.5 px-3">Bên Khiếu Nại</th>
                <th className="py-2.5 px-3">Trạng Thái Xử Lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_DISPUTES.map(d => (
                <tr key={d.id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-mono font-bold text-amber-700">{d.id}</td>
                  <td className="py-3 px-3 font-bold text-slate-900">{d.orderId}</td>
                  <td className="py-3 px-3 text-slate-600">{d.type}</td>
                  <td className="py-3 px-3 text-slate-600">{d.reporterId}</td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {d.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL THÊM RỦI RO MỚI */}
      {isAddRiskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" /> Khai Báo Rủi Ro Doanh Nghiệp Mới
              </h3>
              <button onClick={() => setIsAddRiskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tiêu đề rủi ro</label>
                <input
                  type="text"
                  placeholder="VD: Rủi ro biến động giá nguyên vật liệu..."
                  value={newRisk.title || ''}
                  onChange={(e) => setNewRisk({ ...newRisk, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phân loại</label>
                  <select
                    value={newRisk.category}
                    onChange={(e) => setNewRisk({ ...newRisk, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="Operational">Vận Hành</option>
                    <option value="Financial">Tài Chính</option>
                    <option value="Compliance">Pháp Lý & Tuân Thủ</option>
                    <option value="CyberSecurity">An Toàn Thông Tin</option>
                    <option value="SupplyChain">Chuỗi Cung Ứng</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chiến lược</label>
                  <select
                    value={newRisk.strategy}
                    onChange={(e) => setNewRisk({ ...newRisk, strategy: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="Mitigate">Giảm thiểu (Mitigate)</option>
                    <option value="Avoid">Né tránh (Avoid)</option>
                    <option value="Transfer">Chuyển giao (Transfer)</option>
                    <option value="Accept">Chấp nhận (Accept)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Khả năng xảy ra (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newRisk.likelihood || 3}
                    onChange={(e) => setNewRisk({ ...newRisk, likelihood: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mức độ tác động (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newRisk.impact || 3}
                    onChange={(e) => setNewRisk({ ...newRisk, impact: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Kế hoạch ứng phó giảm thiểu</label>
                <textarea
                  rows={2}
                  placeholder="Các biện pháp kiểm soát dự kiến triển khai..."
                  value={newRisk.mitigationPlan || ''}
                  onChange={(e) => setNewRisk({ ...newRisk, mitigationPlan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsAddRiskModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  if (!newRisk.title) return;
                  const l = newRisk.likelihood || 3;
                  const i = newRisk.impact || 3;
                  const score = l * i;
                  const created: EnterpriseRisk = {
                    id: `RSK-${Date.now()}`,
                    code: `RISK-0${risks.length + 1}`,
                    title: newRisk.title,
                    category: newRisk.category || 'Operational',
                    description: newRisk.description || 'Mô tả rủi ro được thêm mới.',
                    likelihood: l,
                    impact: i,
                    inherentScore: score,
                    residualScore: Math.round(score * 0.5),
                    level: getRiskLevel(score),
                    owner: 'Bạn (Risk Manager)',
                    department: 'Quản trị rủi ro',
                    strategy: newRisk.strategy || 'Mitigate',
                    mitigationPlan: newRisk.mitigationPlan || 'Đang xây dựng biện pháp kiểm soát.',
                    mitigationProgress: 10,
                    status: 'Open',
                    updatedAt: 'Hôm nay',
                    dueDate: '30 ngày tới'
                  };
                  setRisks([created, ...risks]);
                  setIsAddRiskModalOpen(false);
                  alert('Đã thêm mới rủi ro vào Risk Register!');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md"
              >
                Lưu rủi ro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
