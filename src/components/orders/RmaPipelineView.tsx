import React, { useState, useMemo } from 'react';
import { 
  RotateCcw, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Truck, 
  Package, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw,
  Eye,
  DollarSign,
  ChevronRight,
  FileCheck2,
  Boxes
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

export interface RmaRequest {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  createdAt: string;
  productName: string;
  productSku: string;
  productPrice: number;
  productQuantity: number;
  returnReason: 'damaged_shipping' | 'defect_manufacturer' | 'wrong_item' | 'change_mind';
  reasonDetail: string;
  attachedImages: string[];
  stage: 'requested' | 'retrieving' | 'inspected_qa' | 'resolved' | 'rejected';
  aiRiskScore: number; // 0 - 100 (thấp là uy tín, cao là gian lận)
  aiAssessment: string;
  returnCarrier?: string;
  returnTracking?: string;
  qaResult?: {
    condition: 'restockable' | 'warranty_vendor' | 'scrap_damaged';
    inspector: string;
    inspectedAt: string;
    notes: string;
  };
  resolution?: {
    type: 'refund_wallet' | 'exchange_new' | 'rejected';
    amount?: number;
    exchangeOrderId?: string;
    resolvedAt: string;
  };
}

const MOCK_RMA_LIST: RmaRequest[] = [
  {
    id: 'RMA-2024-001',
    orderId: 'ORD-2024-001',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0981234567',
    customerAddress: 'Quận 1, TP.HCM',
    createdAt: '16/03/2024 10:15',
    productName: 'Áo Thun Nam Cotton Premium',
    productSku: 'SKU-NAM-01',
    productPrice: 250000,
    productQuantity: 2,
    returnReason: 'wrong_item',
    reasonDetail: 'Shop giao nhầm màu đen size L thành size M, áo bị chật không mặc vừa.',
    attachedImages: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&auto=format&fit=crop&q=60'
    ],
    stage: 'requested',
    aiRiskScore: 12, // Rất uy tín
    aiAssessment: 'Khách hàng có lịch sử mua hàng 12 đơn không hoàn trả. Ảnh chụp có tem mác trùng khớp với mã vạch SKU-NAM-01-M. Đề xuất: Phê duyệt đổi hàng ngay lập tức.',
  },
  {
    id: 'RMA-2024-002',
    orderId: 'ORD-2024-002',
    customerName: 'Trần Thị B',
    customerPhone: '0912345678',
    customerAddress: 'Cầu Giấy, Hà Nội',
    createdAt: '15/03/2024 16:45',
    productName: 'Laptop LG Gram 14 2026 i7',
    productSku: 'SKU-TECH-02',
    productPrice: 28500000,
    productQuantity: 1,
    returnReason: 'defect_manufacturer',
    reasonDetail: 'Bật nguồn máy màn hình chớp tắt liên tục, cổng Type-C bên trái không nhận sạc.',
    attachedImages: [
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=300&auto=format&fit=crop&q=60'
    ],
    stage: 'retrieving',
    aiRiskScore: 25,
    aiAssessment: 'Đơn hàng giá trị cao (>20tr). Đã xác nhận serial number kích hoạt bảo hành chính hãng LG 2 ngày trước. Đã tạo vận đơn thu hồi 3PL GHN.',
    returnCarrier: 'GHN Fast',
    returnTracking: 'GHN-RMA-8849102',
  },
  {
    id: 'RMA-2024-003',
    orderId: 'ORD-2024-003',
    customerName: 'Lê Văn C',
    customerPhone: '0909123456',
    customerAddress: 'Hải Châu, Đà Nẵng',
    createdAt: '14/03/2024 09:20',
    productName: 'Bộ Hộp Cơm Giữ Nhiệt Sunhouse',
    productSku: 'SKU-GD-03',
    productPrice: 850000,
    productQuantity: 1,
    returnReason: 'damaged_shipping',
    reasonDetail: 'Thùng carton bị móp méo rách nát, nắp nhựa bên trong vỡ vụn khi mở hộp.',
    attachedImages: [
      'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=60'
    ],
    stage: 'inspected_qa',
    aiRiskScore: 18,
    aiAssessment: 'Sensor va đập của GHTK ghi nhận rung chấn cấp 4 tại bưu cục trung chuyển Đà Nẵng. Khớp với tình trạng vỡ hàng hóa.',
    returnCarrier: 'GHTK Express',
    returnTracking: 'GHTK-RET-99012',
    qaResult: {
      condition: 'scrap_damaged',
      inspector: 'Nguyễn Văn Kho (KTV-QA)',
      inspectedAt: '16/03/2024 14:00',
      notes: 'Sản phẩm vỡ ngàm nắp không thể phục hồi. Chuyển sang biên bản đền bù thiệt hại đối tác vận chuyển GHTK.'
    }
  },
  {
    id: 'RMA-2024-004',
    orderId: 'ORD-2024-004',
    customerName: 'Phạm Minh Đức',
    customerPhone: '0938112233',
    customerAddress: 'Quận 7, TP.HCM',
    createdAt: '12/03/2024 11:30',
    productName: 'Serum Phục Hồi Da B5 GoodnDoc 30ml',
    productSku: 'SKU-MP-05',
    productPrice: 380000,
    productQuantity: 1,
    returnReason: 'change_mind',
    reasonDetail: 'Mua tặng bạn gái nhưng bạn gái đã có sẵn loại này rồi nên muốn trả lại.',
    attachedImages: [],
    stage: 'resolved',
    aiRiskScore: 5,
    aiAssessment: 'Hàng còn nguyên seal nilon, tem chống giả chưa bóc. Đạt tiêu chuẩn hoàn trả theo chính sách 7 ngày.',
    returnCarrier: 'Ahamove Bulky',
    returnTracking: 'AHA-66291',
    qaResult: {
      condition: 'restockable',
      inspector: 'Trần Thị Thu (QA Kho HCM)',
      inspectedAt: '13/03/2024 15:30',
      notes: 'Hộp nguyên vẹn, bao bì 100% mới. Đã tạo phiếu nhập kho lại vào Kệ D2-Tầng 1 (Kho HCM).'
    },
    resolution: {
      type: 'refund_wallet',
      amount: 380000,
      resolvedAt: '13/03/2024 16:00'
    }
  }
];

const STAGE_CONFIG = [
  { id: 'requested', label: '1. Tiếp nhận & Thẩm định', icon: Clock, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'retrieving', label: '2. Đang thu hồi (3PL)', icon: Truck, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'inspected_qa', label: '3. Kiểm định Kho (QA)', icon: ShieldCheck, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'resolved', label: '4. Đã hoàn tiền / Đổi hàng', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
];

const REASON_LABELS: Record<string, { label: string; badge: string }> = {
  damaged_shipping: { label: 'Bể vỡ khi vận chuyển', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  defect_manufacturer: { label: 'Lỗi kỹ thuật / NSX', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  wrong_item: { label: 'Giao sai mẫu mã / Size', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  change_mind: { label: 'Khách hàng đổi ý (7 ngày)', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export function RmaPipelineView() {
  const [rmaList, setRmaList] = useState<RmaRequest[]>(MOCK_RMA_LIST);
  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRma, setSelectedRma] = useState<RmaRequest | null>(null);

  // Modal action states
  const [actionModal, setActionModal] = useState<{
    type: 'approve_retrieval' | 'qa_inspect' | 'resolve_refund' | 'reject';
    rma: RmaRequest;
  } | null>(null);

  const [carrierSelect, setCarrierSelect] = useState('GHN Fast');
  const [qaCondition, setQaCondition] = useState<'restockable' | 'warranty_vendor' | 'scrap_damaged'>('restockable');
  const [qaNote, setQaNote] = useState('');

  const filteredList = useMemo(() => {
    return rmaList.filter(item => {
      const matchStage = activeStageFilter === 'all' || item.stage === activeStageFilter;
      const q = searchQuery.toLowerCase();
      const matchSearch = 
        item.id.toLowerCase().includes(q) ||
        item.orderId.toLowerCase().includes(q) ||
        item.customerName.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q);
      return matchStage && matchSearch;
    });
  }, [rmaList, activeStageFilter, searchQuery]);

  // Handler: Chấp thuận thu hồi 3PL
  const handleApproveRetrieval = (rmaId: string) => {
    const trackingCode = `${carrierSelect.substring(0, 3).toUpperCase()}-RMA-${Math.floor(100000 + Math.random() * 900000)}`;
    setRmaList(prev => prev.map(item => {
      if (item.id === rmaId) {
        return {
          ...item,
          stage: 'retrieving',
          returnCarrier: carrierSelect,
          returnTracking: trackingCode,
        };
      }
      return item;
    }));
    setActionModal(null);
  };

  // Handler: Hoàn tất kiểm định QA
  const handleCompleteQa = (rmaId: string) => {
    setRmaList(prev => prev.map(item => {
      if (item.id === rmaId) {
        return {
          ...item,
          stage: 'inspected_qa',
          qaResult: {
            condition: qaCondition,
            inspector: 'Trần Văn Kho (KTV-QA)',
            inspectedAt: new Date().toLocaleString('vi-VN'),
            notes: qaNote || 'Đã kiểm tra sản phẩm thực tế theo quy chuẩn QA VComm.'
          }
        };
      }
      return item;
    }));
    setActionModal(null);
  };

  // Handler: Hoàn tiền hoặc Đổi hàng
  const handleResolve = (rmaId: string, type: 'refund_wallet' | 'exchange_new') => {
    setRmaList(prev => prev.map(item => {
      if (item.id === rmaId) {
        return {
          ...item,
          stage: 'resolved',
          resolution: {
            type,
            amount: type === 'refund_wallet' ? item.productPrice * item.productQuantity : undefined,
            exchangeOrderId: type === 'exchange_new' ? `ORD-EX-${item.orderId}` : undefined,
            resolvedAt: new Date().toLocaleString('vi-VN'),
          }
        };
      }
      return item;
    }));
    setActionModal(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top summary KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng yêu cầu Đổi trả</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">{rmaList.length}</p>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-amber-600">
            <Clock className="w-3.5 h-3.5" />
            <span>{rmaList.filter(r => r.stage === 'requested').length} đơn đang chờ duyệt sơ bộ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đang thu hồi (3PL)</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">
            {rmaList.filter(r => r.stage === 'retrieving').length}
          </p>
          <p className="text-xs text-slate-500 mt-2">Thời gian lấy hàng TB: 1.2 ngày</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Đang kiểm định QA Kho</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">
            {rmaList.filter(r => r.stage === 'inspected_qa').length}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-2">Tỷ lệ nhập lại kho: 75%</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex justify-between items-start">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Giá trị bồi hoàn tháng</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-800 mt-2">
            {formatCurrency(
              rmaList
                .filter(r => r.stage === 'resolved' && r.resolution?.type === 'refund_wallet')
                .reduce((sum, r) => sum + (r.resolution?.amount || 0), 0)
            )}
          </p>
          <p className="text-xs text-slate-500 mt-2">Tự động hạch toán VComm</p>
        </div>
      </div>

      {/* Stage pipeline tabs & search bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setActiveStageFilter('all')}
            className={cn(
              "px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
              activeStageFilter === 'all'
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
            )}
          >
            Tất cả ({rmaList.length})
          </button>
          {STAGE_CONFIG.map(st => {
            const count = rmaList.filter(r => r.stage === st.id).length;
            const Icon = st.icon;
            return (
              <button
                key={st.id}
                onClick={() => setActiveStageFilter(st.id)}
                className={cn(
                  "px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5",
                  activeStageFilter === st.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{st.label}</span>
                <span className={cn(
                  "ml-1 px-1.5 py-0.2 rounded-full text-[10px]",
                  activeStageFilter === st.id ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã RMA, đơn hàng, khách..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* RMA Pipeline Cards List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredList.map((item) => {
          const reasonMeta = REASON_LABELS[item.returnReason] || { label: item.returnReason, badge: 'bg-slate-100 text-slate-700' };
          const stageObj = STAGE_CONFIG.find(s => s.id === item.stage) || STAGE_CONFIG[0];
          const StageIcon = stageObj.icon;

          return (
            <div 
              key={item.id} 
              className="bg-white border border-slate-200 hover:border-indigo-300 rounded-xl p-5 shadow-2xs hover:shadow-xs transition-all space-y-4"
            >
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-sm text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                    {item.id}
                  </span>
                  <span className="text-xs text-slate-500">
                    Đơn gốc: <strong className="text-slate-800">{item.orderId}</strong>
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500">{item.createdAt}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5",
                    stageObj.color
                  )}>
                    <StageIcon className="w-3.5 h-3.5" />
                    <span>{stageObj.label}</span>
                  </span>

                  <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold border", reasonMeta.badge)}>
                    {reasonMeta.label}
                  </span>
                </div>
              </div>

              {/* Main content grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Col 1: Customer & Item info */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Khách hàng & Sản phẩm</p>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{item.customerName}</p>
                    <p className="text-xs text-slate-500">{item.customerPhone} • {item.customerAddress}</p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2.5">
                    <div className="p-2 bg-white rounded border border-slate-200 text-slate-600">
                      <Package className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 line-clamp-1">{item.productName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {item.productSku} • SL: <strong className="text-slate-800">{item.productQuantity}</strong>
                      </p>
                      <p className="text-xs font-bold text-indigo-600 mt-0.5">
                        {formatCurrency(item.productPrice * item.productQuantity)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Col 2: Reason & Evidence */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mô tả & Bằng chứng khiếu nại</p>
                  <p className="text-xs text-slate-700 bg-amber-50/50 p-2.5 rounded-lg border border-amber-100 italic leading-relaxed">
                    "{item.reasonDetail}"
                  </p>
                  {item.attachedImages.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      {item.attachedImages.map((img, idx) => (
                        <a 
                          key={idx} 
                          href={img} 
                          target="_blank" 
                          rel="noreferrer"
                          className="group relative block w-14 h-14 rounded-lg overflow-hidden border border-slate-200 hover:border-indigo-500 shadow-2xs"
                        >
                          <img src={img} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <Eye className="w-3.5 h-3.5" />
                          </div>
                        </a>
                      ))}
                      <span className="text-[11px] text-slate-400 font-medium">({item.attachedImages.length} ảnh)</span>
                    </div>
                  )}
                </div>

                {/* Col 3: AI CSKH Assessment & Risk Score */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>AI CSKH Thẩm Định Tự Động</span>
                    </p>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded-full",
                      item.aiRiskScore <= 20 ? "bg-emerald-100 text-emerald-700" :
                      item.aiRiskScore <= 50 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    )}>
                      Rủi ro gian lận: {item.aiRiskScore}%
                    </span>
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-lg text-xs text-indigo-950 leading-relaxed font-sans">
                    {item.aiAssessment}
                  </div>

                  {/* Operational status details */}
                  {item.stage === 'retrieving' && (
                    <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg text-xs flex items-center justify-between text-blue-900">
                      <div>
                        <span className="font-bold">{item.returnCarrier}:</span>{' '}
                        <span className="font-mono">{item.returnTracking}</span>
                      </div>
                      <span className="text-[10px] bg-blue-200/60 px-1.5 py-0.5 rounded font-semibold">Đang trên xe thu gom</span>
                    </div>
                  )}

                  {item.stage === 'inspected_qa' && item.qaResult && (
                    <div className="bg-purple-50 border border-purple-200 p-2 rounded-lg text-xs text-purple-950 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-bold">Kết quả QA:</span>
                        <span className="font-semibold text-purple-700">
                          {item.qaResult.condition === 'restockable' ? 'Đạt chuẩn nhập kho ✅' :
                           item.qaResult.condition === 'warranty_vendor' ? 'Bảo hành NSX 🔧' : 'Hư hỏng thanh lý ❌'}
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-800">{item.qaResult.notes}</p>
                    </div>
                  )}

                  {item.stage === 'resolved' && item.resolution && (
                    <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-xs text-emerald-950 flex items-center justify-between">
                      <span className="font-bold">
                        {item.resolution.type === 'refund_wallet' ? 'Đã hoàn ví VComm:' : 'Đã xuất đơn đổi hàng:'}
                      </span>
                      <span className="font-bold text-emerald-700">
                        {item.resolution.type === 'refund_wallet' 
                          ? formatCurrency(item.resolution.amount || 0)
                          : item.resolution.exchangeOrderId}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons row */}
              <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {item.stage === 'requested' && 'Chờ quản lý Logistics phê duyệt thu hồi hoặc từ chối khiếu nại.'}
                  {item.stage === 'retrieving' && 'Shipper đang đến địa chỉ khách hàng lấy lại kiện hàng.'}
                  {item.stage === 'inspected_qa' && 'Hàng đã về kho. Cần KTV kiểm tra thực tế để ra quyết định hoàn tiền.'}
                  {item.stage === 'resolved' && 'Quy trình RMA hoàn tất. Đã tự động hạch toán vào Kế toán VComm.'}
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  {item.stage === 'requested' && (
                    <>
                      <button
                        onClick={() => setActionModal({ type: 'reject', rma: item })}
                        className="px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => setActionModal({ type: 'approve_retrieval', rma: item })}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Duyệt thu hồi 3PL</span>
                      </button>
                    </>
                  )}

                  {item.stage === 'retrieving' && (
                    <button
                      onClick={() => setActionModal({ type: 'qa_inspect', rma: item })}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Nhận hàng tại Kho & Đánh giá QA</span>
                    </button>
                  )}

                  {item.stage === 'inspected_qa' && (
                    <>
                      <button
                        onClick={() => handleResolve(item.id, 'exchange_new')}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Xuất đơn đổi mới</span>
                      </button>
                      <button
                        onClick={() => handleResolve(item.id, 'refund_wallet')}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Hoàn tiền Ví ({formatCurrency(item.productPrice * item.productQuantity)})</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-bold text-sm">Không tìm thấy yêu cầu đổi trả nào</p>
            <p className="text-slate-400 text-xs mt-1">Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>

      {/* Action Dialog Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            {/* Modal header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {actionModal.type === 'approve_retrieval' && 'Tạo Vận Đơn Thu Hồi Hàng (3PL)'}
                  {actionModal.type === 'qa_inspect' && 'Biên Bản Đánh Giá Chất Lượng Kho (QA)'}
                  {actionModal.type === 'reject' && 'Xác Nhận Từ Chối Khiếu Nại'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mã RMA: <strong className="font-mono text-indigo-600">{actionModal.rma.id}</strong>
                </p>
              </div>
              <button
                onClick={() => setActionModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body */}
            {actionModal.type === 'approve_retrieval' && (
              <div className="space-y-4">
                <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-900">
                  Hệ thống sẽ tự động đồng bộ API sang hãng vận chuyển để shipper đến lấy hàng tận nhà khách hàng tại:
                  <p className="font-bold mt-1 text-slate-800">{actionModal.rma.customerAddress}</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Chọn đơn vị vận chuyển thu hồi</label>
                  <select
                    value={carrierSelect}
                    onChange={e => setCarrierSelect(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="GHN Fast">GHN Fast (Giao Hàng Nhanh) - Phí ước tính: 22,000đ</option>
                    <option value="GHTK Express">GHTK Express - Phí ước tính: 20,000đ</option>
                    <option value="ViettelPost">ViettelPost - Phí ước tính: 24,000đ</option>
                    <option value="Ahamove Bulky">Ahamove Thu Hồi Cấp Tốc - Phí ước tính: 35,000đ</option>
                  </select>
                </div>
              </div>
            )}

            {actionModal.type === 'qa_inspect' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Tình trạng thẩm định thực tế</label>
                  <div className="space-y-2">
                    {[
                      { id: 'restockable', title: 'Đạt chuẩn nhập lại kho (Restock)', desc: 'Nguyên bao bì/tem mác, không trầy xước, tái nhập bán bình thường' },
                      { id: 'warranty_vendor', title: 'Lỗi NSX - Chuyển Bảo hành', desc: 'Có lỗi phần cứng/kỹ thuật, chuyển hãng sản xuất bảo hành hoặc đổi mới' },
                      { id: 'scrap_damaged', title: 'Hỏng hóc tiêu hủy / Khiếu nại 3PL', desc: 'Bể vỡ hoàn toàn do vận chuyển, lập biên bản đền bù với bên vận chuyển' },
                    ].map(opt => (
                      <label 
                        key={opt.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all",
                          qaCondition === opt.id ? "bg-purple-50/70 border-purple-500 ring-1 ring-purple-500" : "bg-white border-slate-200 hover:border-slate-300"
                        )}
                      >
                        <input
                          type="radio"
                          name="qaCondition"
                          checked={qaCondition === opt.id}
                          onChange={() => setQaCondition(opt.id as any)}
                          className="mt-1 text-purple-600 focus:ring-purple-500"
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-800">{opt.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Ghi chú của KTV Kiểm Định</label>
                  <textarea
                    rows={3}
                    placeholder="VD: Serial number máy khớp đơn hàng, hộp nguyên seal..."
                    value={qaNote}
                    onChange={e => setQaNote(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            )}

            {actionModal.type === 'reject' && (
              <div className="space-y-3">
                <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-900 leading-relaxed">
                  Lưu ý: Từ chối khiếu nại sẽ thông báo tới khách hàng qua ZNS/SMS và đóng quy trình đổi trả của đơn hàng này.
                </div>
              </div>
            )}

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActionModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Hủy bỏ
              </button>
              {actionModal.type === 'approve_retrieval' && (
                <button
                  onClick={() => handleApproveRetrieval(actionModal.rma.id)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Xác nhận Thu hồi 3PL
                </button>
              )}
              {actionModal.type === 'qa_inspect' && (
                <button
                  onClick={() => handleCompleteQa(actionModal.rma.id)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Lưu Kết Quả Kiểm Định
                </button>
              )}
              {actionModal.type === 'reject' && (
                <button
                  onClick={() => {
                    setRmaList(prev => prev.map(r => r.id === actionModal.rma.id ? { ...r, stage: 'rejected' } : r));
                    setActionModal(null);
                  }}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  Xác nhận Từ chối
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
