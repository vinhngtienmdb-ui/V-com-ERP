import React, { useState } from 'react';
import {
  Warehouse,
  LayoutGrid,
  Layers,
  MapPin,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  FileText,
  Truck,
  Building2,
  Calendar,
  X,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

interface DigitalTwinWMSProps {
  initialSubTab?: '2d_floor_map' | 'reorder_point' | 'req_purchase' | 'in_out_vouchers';
  onNavigateToPO?: () => void;
  onBackToOverview?: () => void;
}

// 6 Aisles Layout for 2D Floor Plan
const WAREHOUSE_AISLES = [
  {
    id: 'A1',
    name: 'Dãy A1: Cà phê & Nông sản',
    zone: 'Zone A - Hàng Khô',
    totalBins: 120,
    occupiedBins: 98,
    occupancyRate: 81.6,
    temp: '23°C',
    humidity: '55%',
    type: 'Dry Goods',
    color: 'emerald',
    hotSku: 'Cà phê Robusta Thượng Hạng'
  },
  {
    id: 'A2',
    name: 'Dãy A2: Trà & Gia vị đóng gói',
    zone: 'Zone A - Hàng Khô',
    totalBins: 120,
    occupiedBins: 110,
    occupancyRate: 91.7,
    temp: '24°C',
    humidity: '54%',
    type: 'Dry Goods',
    color: 'rose',
    hotSku: 'Trà ô long túi lọc Cozy'
  },
  {
    id: 'B1',
    name: 'Dãy B1: Sữa đặc & Đồ hộp',
    zone: 'Zone B - Đồ Hộp & Chai Lọ',
    totalBins: 100,
    occupiedBins: 72,
    occupancyRate: 72.0,
    temp: '22°C',
    humidity: '50%',
    type: 'Canned & Bottled',
    color: 'emerald',
    hotSku: 'Sữa Đặc Ngôi Sao Phương Nam'
  },
  {
    id: 'B2',
    name: 'Dãy B2: Siro pha chế & Hương liệu',
    zone: 'Zone B - Đồ Hộp & Chai Lọ',
    totalBins: 100,
    occupiedBins: 88,
    occupancyRate: 88.0,
    temp: '22°C',
    humidity: '52%',
    type: 'Canned & Bottled',
    color: 'amber',
    hotSku: 'Syrup Monin Vani 700ml'
  },
  {
    id: 'C1',
    name: 'Dãy C1: Bao bì, Ly cốc, Hộp carton',
    zone: 'Zone C - Vật tư Đóng gói',
    totalBins: 140,
    occupiedBins: 65,
    occupancyRate: 46.4,
    temp: '25°C',
    humidity: '58%',
    type: 'Packaging',
    color: 'emerald',
    hotSku: 'Hộp carton TMĐT size 20x15x10'
  },
  {
    id: 'C2',
    name: 'Dãy C2: Dụng cụ pha chế & Thiết bị quầy',
    zone: 'Zone C - Thiết bị & Phụ kiện',
    totalBins: 80,
    occupiedBins: 45,
    occupancyRate: 56.2,
    temp: '24°C',
    humidity: '50%',
    type: 'Equipment',
    color: 'emerald',
    hotSku: 'Cốc giữ nhiệt Inox LocknLock'
  },
];

// Reorder Point SKU Dataset
const INITIAL_ROP_ITEMS = [
  {
    skuId: 'SKU-881',
    name: 'Cà phê hạt Robusta Thượng Hạng (Bao 25kg)',
    category: 'Cà phê',
    currentStock: 120,
    unit: 'Bao',
    dailyDemand: 45, // 45 bao / ngày
    leadTimeDays: 3, // NCC giao hàng 3 ngày
    safetyStock: 50, // Tồn kho an toàn
    rop: 185, // ROP = (3 * 45) + 50 = 185
    targetMaxStock: 500,
    supplier: 'Công ty CP Cà Phê Buôn Ma Thuột',
    unitCost: 1250000,
    status: 'urgent', // 120 < 185
  },
  {
    skuId: 'SKU-882',
    name: 'Sữa Đặc Ngôi Sao Phương Nam 1.2kg (Thùng 24 hộp)',
    category: 'Sữa đặc',
    currentStock: 120,
    unit: 'Thùng',
    dailyDemand: 15,
    leadTimeDays: 2,
    safetyStock: 20,
    rop: 50, // ROP = (2 * 15) + 20 = 50
    targetMaxStock: 200,
    supplier: 'Vinamilk Việt Nam',
    unitCost: 890000,
    status: 'safe', // 120 > 50
  },
  {
    skuId: 'SKU-883',
    name: 'Trà ô long túi lọc Cozy (Thùng 40 hộp)',
    category: 'Trà',
    currentStock: 95,
    unit: 'Thùng',
    dailyDemand: 30,
    leadTimeDays: 4,
    safetyStock: 40,
    rop: 160, // ROP = (4 * 30) + 40 = 160
    targetMaxStock: 300,
    supplier: 'Công ty TNHH Thế Hệ Mới ECO',
    unitCost: 720000,
    status: 'urgent', // 95 < 160
  },
  {
    skuId: 'SKU-884',
    name: 'Cốc giữ nhiệt Inox LocknLock 500ml',
    category: 'Thiết bị & Phụ kiện',
    currentStock: 35,
    unit: 'Cái',
    dailyDemand: 8,
    leadTimeDays: 7,
    safetyStock: 25,
    rop: 81, // ROP = (7 * 8) + 25 = 81
    targetMaxStock: 150,
    supplier: 'Lock&Lock Vietnam',
    unitCost: 320000,
    status: 'urgent', // 35 < 81
  },
  {
    skuId: 'SKU-885',
    name: 'Syrup Monin Vani 700ml (Chai)',
    category: 'Siro pha chế',
    currentStock: 80,
    unit: 'Chai',
    dailyDemand: 12,
    leadTimeDays: 3,
    safetyStock: 15,
    rop: 51, // ROP = (3 * 12) + 15 = 51
    targetMaxStock: 120,
    supplier: 'An Nam Fine Food',
    unitCost: 245000,
    status: 'safe', // 80 > 51
  },
  {
    skuId: 'SKU-886',
    name: 'Hộp carton TMĐT size 20x15x10 (Bó 100 cái)',
    category: 'Bao bì',
    currentStock: 210,
    unit: 'Bó',
    dailyDemand: 50,
    leadTimeDays: 2,
    safetyStock: 80,
    rop: 180, // ROP = (2 * 50) + 80 = 180
    targetMaxStock: 500,
    supplier: 'Bao Bì Giấy Toàn Quốc',
    unitCost: 180000,
    status: 'safe', // 210 > 180
  },
];

// Mock Purchase Requisitions (wh_req_purchase)
const INITIAL_PURCHASE_REQS = [
  {
    id: 'PR-2026-081',
    createdDate: '2026-03-16',
    creator: 'Hệ thống Auto-ROP AI',
    title: 'Đề xuất mua khẩn cấp Cà phê Robusta & Trà Cozy',
    totalItems: 2,
    estimatedValue: 475000000,
    supplier: 'Công ty CP Cà Phê Buôn Ma Thuột',
    status: 'pending_approval',
    urgency: 'high',
    notes: 'Tồn thực tế dưới ngưỡng điểm đặt hàng lại ROP (Robusta còn 120/185 bao)',
  },
  {
    id: 'PR-2026-079',
    createdDate: '2026-03-14',
    creator: 'Trần Văn Kho (Thủ kho Hà Nội)',
    title: 'Đề xuất bổ sung bao bì carton đóng gói Q2',
    totalItems: 5,
    estimatedValue: 90000000,
    supplier: 'Bao Bì Giấy Toàn Quốc',
    status: 'approved',
    urgency: 'normal',
    notes: 'Đã phê duyệt và chuyển sang PO-2026-042',
  },
  {
    id: 'PR-2026-075',
    createdDate: '2026-03-10',
    creator: 'Hệ thống Auto-ROP AI',
    title: 'Đề xuất nhập kho Cốc giữ nhiệt Lock&Lock',
    totalItems: 1,
    estimatedValue: 36800000,
    supplier: 'Lock&Lock Vietnam',
    status: 'converted_po',
    urgency: 'high',
    notes: 'Đã lập PO và NCC đã giao hàng thành công',
  },
];

// Mock In/Out Vouchers (wh_in_out)
const INITIAL_STOCK_VOUCHERS = [
  {
    id: 'NK-2026-0312',
    type: 'inbound',
    typeLabel: 'Nhập kho mua hàng (PO)',
    source: 'PO-2026-041',
    warehouse: 'Kho Hà Nội (FBL North)',
    date: '2026-03-16 09:30',
    partner: 'Vinamilk Việt Nam',
    totalItems: 120,
    value: 106800000,
    status: 'completed',
    handler: 'Nguyễn Văn Thủ Kho'
  },
  {
    id: 'XK-2026-0988',
    type: 'outbound',
    typeLabel: 'Xuất kho giao hàng TMĐT',
    source: 'Batch Wave #402 (38 đơn)',
    warehouse: 'Kho Hà Nội (FBL North)',
    date: '2026-03-16 11:15',
    partner: 'Đơn vị 3PL (GHN & GHTK)',
    totalItems: 42,
    value: 68500000,
    status: 'completed',
    handler: 'Lê Đóng Gói'
  },
  {
    id: 'DC-2026-0045',
    type: 'transfer',
    typeLabel: 'Điều chuyển kho HN -> HCM',
    source: 'TR-2026-088',
    warehouse: 'Từ Kho HN đến Kho HCM',
    date: '2026-03-15 14:00',
    partner: 'Viettel Post Truck Logistics',
    totalItems: 300,
    value: 375000000,
    status: 'in_transit',
    handler: 'Trần Logistics'
  },
];

export function DigitalTwinWMS({ initialSubTab = '2d_floor_map', onNavigateToPO, onBackToOverview }: DigitalTwinWMSProps) {
  const [subTab, setSubTab] = useState<'2d_floor_map' | 'reorder_point' | 'req_purchase' | 'in_out_vouchers'>(initialSubTab);
  const [selectedHub, setSelectedHub] = useState<'hn' | 'hcm' | 'dn'>('hn');
  const [selectedAisle, setSelectedAisle] = useState<any | null>(WAREHOUSE_AISLES[0]);
  const [ropItems, setRopItems] = useState(INITIAL_ROP_ITEMS);
  const [purchaseReqs, setPurchaseReqs] = useState(INITIAL_PURCHASE_REQS);
  const [stockVouchers, setStockVouchers] = useState(INITIAL_STOCK_VOUCHERS);
  const [autoGeneratingPO, setAutoGeneratingPO] = useState(false);

  // Filter urgent items
  const urgentCount = ropItems.filter(it => it.currentStock <= it.rop).length;

  const handleGenerateAutoPO = () => {
    setAutoGeneratingPO(true);
    setTimeout(() => {
      setAutoGeneratingPO(false);
      const urgentList = ropItems.filter(it => it.currentStock <= it.rop);
      const newPR = {
        id: `PR-2026-${Math.floor(100 + Math.random() * 900)}`,
        createdDate: new Date().toISOString().split('T')[0],
        creator: 'Động cơ AI Smart-ROP',
        title: `Đề xuất mua hàng bổ sung tồn an toàn (${urgentList.length} SKU khẩn cấp)`,
        totalItems: urgentList.length,
        estimatedValue: urgentList.reduce((acc, it) => acc + (it.targetMaxStock - it.currentStock) * it.unitCost, 0),
        supplier: urgentList[0]?.supplier || 'Nhà cung cấp đề xuất',
        status: 'pending_approval',
        urgency: 'high',
        notes: 'Tự động tính toán theo công thức ROP = (Lead Time * Daily Demand) + Safety Stock',
      };
      setPurchaseReqs([newPR, ...purchaseReqs]);
      setSubTab('req_purchase');
      alert(`✓ Đã tạo thành công Phiếu đề xuất mua hàng ${newPR.id} cho ${urgentList.length} mặt hàng cần nhập gấp!`);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Bar with Hub Selector and Global Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBackToOverview && (
            <button
              onClick={onBackToOverview}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
              title="Quay lại phân hệ Kho"
            >
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          )}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Bản Đồ Số 2D Digital Twin WMS & Động Cơ Điểm Đặt Hàng Lại (ROP)
              </h2>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Real-time IoT Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mô phỏng mặt bằng kho thực tế theo Dãy/Kệ/Ô (Aisle/Rack/Bin), giám sát mật độ chứa và tự động cảnh báo tồn tối thiểu.
            </p>
          </div>
        </div>

        {/* Hub Selector Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl self-start lg:self-auto border border-slate-200">
          <button
            onClick={() => setSelectedHub('hn')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              selectedHub === 'hn' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Kho Hà Nội (FBL North)
          </button>
          <button
            onClick={() => setSelectedHub('dn')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              selectedHub === 'dn' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Kho Đà Nẵng (FBL Central)
          </button>
          <button
            onClick={() => setSelectedHub('hcm')}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
              selectedHub === 'hcm' ? "bg-white text-slate-900 shadow-xs" : "text-slate-600 hover:text-slate-900"
            )}
          >
            Kho TP.HCM (FBL South)
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('2d_floor_map')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              subTab === '2d_floor_map' 
                ? "bg-slate-900 text-white shadow-sm" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-amber-400" />
            <span>Mặt Bằng Số 2D (Digital Twin Layout)</span>
          </button>

          <button
            onClick={() => setSubTab('reorder_point')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              subTab === 'reorder_point' 
                ? "bg-orange-600 text-white shadow-sm" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Điểm Đặt Hàng Lại ROP</span>
            {urgentCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[9px] font-black rounded-full animate-pulse">
                {urgentCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('req_purchase')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              subTab === 'req_purchase' 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Phiếu Đề Xuất Mua Hàng ({purchaseReqs.length})</span>
          </button>

          <button
            onClick={() => setSubTab('in_out_vouchers')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
              subTab === 'in_out_vouchers' 
                ? "bg-blue-600 text-white shadow-sm" 
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            )}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Phiếu Nhập/Xuất/Điều Chuyển</span>
          </button>
        </div>

        {subTab === 'reorder_point' && (
          <button
            onClick={handleGenerateAutoPO}
            disabled={autoGeneratingPO}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-xs font-black shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>⚡ Tạo Đề Xuất Mua Tự Động (Auto-PO)</span>
          </button>
        )}
      </div>

      {/* TAB 1: 2D Floor Map Visualizer */}
      {subTab === '2d_floor_map' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main 2D Floor Plan Canvas / SVG View */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900">Sơ Đồ Mặt Bằng Kho Thực Tế (Top-Down View)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Click vào từng Dãy Kệ để soi chi tiết từng ô chứa hàng (Bin level 1-4)</p>
              </div>

              {/* Legend */}
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Thoáng (&lt;75%)
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Vừa (75-85%)
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Đầy (&gt;85%)
                </span>
              </div>
            </div>

            {/* Industrial Blueprint 2D Map Container */}
            <div className="bg-slate-950 rounded-xl p-6 text-white border border-slate-800 relative overflow-hidden shadow-inner font-mono">
              
              {/* Warehouse Inbound Dock Area */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 mb-6 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-emerald-400 uppercase tracking-widest text-[11px]">CỬA NHẬP HÀNG (INBOUND DOCK 01 & 02)</span>
                </div>
                <span className="text-[10px] text-slate-400">Tiếp nhận xe container NCC & Dán mã Barcode SKU</span>
              </div>

              {/* Aisles Grid: 2 columns of Aisles with Forklift Passage */}
              <div className="space-y-4">
                <div className="text-[10px] text-slate-500 uppercase tracking-widest text-center border-b border-slate-800 pb-1">
                  ◄ LỐI ĐI VẬN HÀNH XE NÂNG & PICK HÀNG (AISLE PASSAGE) ►
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {WAREHOUSE_AISLES.map(aisle => {
                    const isSelected = selectedAisle?.id === aisle.id;
                    return (
                      <div
                        key={aisle.id}
                        onClick={() => setSelectedAisle(aisle)}
                        className={cn(
                          "p-4 rounded-xl border transition-all cursor-pointer relative group",
                          isSelected 
                            ? "bg-slate-900 border-amber-500 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10" 
                            : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                              {aisle.id}
                            </span>
                            <span className="text-xs font-bold text-slate-200">{aisle.name}</span>
                          </div>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-black font-mono",
                            aisle.occupancyRate > 85 ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                            aisle.occupancyRate > 75 ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" :
                            "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          )}>
                            {aisle.occupancyRate}%
                          </span>
                        </div>

                        {/* Progress Bar of Occupancy */}
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden mb-2">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              aisle.occupancyRate > 85 ? "bg-rose-500" :
                              aisle.occupancyRate > 75 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${aisle.occupancyRate}%` }}
                          />
                        </div>

                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span>Sức chứa: {aisle.occupiedBins}/{aisle.totalBins} Ô (Bin)</span>
                          <span className="text-slate-300 font-semibold">{aisle.temp} • {aisle.humidity}</span>
                        </div>

                        <p className="text-[10px] text-slate-500 mt-2 truncate">
                          Mặt hàng chủ lực: <strong className="text-slate-300">{aisle.hotSku}</strong>
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[10px] text-slate-500 uppercase tracking-widest text-center border-t border-slate-800 pt-1">
                  ◄ BĂNG CHUYỀN ĐÓNG GÓI SCAN-TO-VERIFY ►
                </div>
              </div>

              {/* Warehouse Outbound Area */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3 mt-6 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse" />
                  <span className="font-bold text-blue-400 uppercase tracking-widest text-[11px]">CỬA XUẤT HÀNG LOGISTICS (OUTBOUND DOCK)</span>
                </div>
                <span className="text-[10px] text-slate-400">Bàn giao xe GHN, Viettel Post, GHTK, SPX Express</span>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Bin Matrix for Selected Aisle */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            {selectedAisle ? (
              <>
                <div className="border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Chi tiết ma trận Ô (Bin Matrix)
                    </span>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded font-mono">
                      {selectedAisle.id}
                    </span>
                  </div>
                  <h3 className="text-sm font-black text-slate-900 mt-1">{selectedAisle.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedAisle.zone}</p>
                </div>

                {/* 4 Levels Representation (Tầng 4 xuống Tầng 1) */}
                <div className="space-y-3">
                  {[4, 3, 2, 1].map(level => {
                    return (
                      <div key={level} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-2">
                          <span>Tầng {level} (Level {level})</span>
                          <span className="text-[10px] text-slate-500 font-mono">Tải trọng tối đa: 1,000 kg</span>
                        </div>

                        {/* 4 Bins per level preview */}
                        <div className="grid grid-cols-4 gap-2">
                          {[1, 2, 3, 4].map(binIdx => {
                            const binCode = `${selectedAisle.id}-0${level}-0${binIdx}`;
                            const isFull = (level + binIdx) % 3 !== 0;
                            return (
                              <div
                                key={binIdx}
                                className={cn(
                                  "p-2 rounded-lg border text-center transition-all cursor-pointer font-mono text-[10px]",
                                  isFull 
                                    ? "bg-white border-slate-300 text-slate-800 shadow-2xs hover:border-orange-500" 
                                    : "bg-slate-100 border-dashed border-slate-300 text-slate-400"
                                )}
                                title={`Vị trí ${binCode}: ${isFull ? 'Có hàng tồn kho' : 'Ô trống sẵn sàng chứa hàng'}`}
                              >
                                <span className="font-bold block">{binCode}</span>
                                <span className={cn(
                                  "text-[9px] font-semibold mt-0.5 block",
                                  isFull ? "text-emerald-700" : "text-slate-400"
                                )}>
                                  {isFull ? 'Đã chứa' : 'Trống'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Gợi ý sắp xếp thông minh (AI Slotting):
                  </div>
                  <p className="text-[11px] text-indigo-700">
                    Sắp xếp sản phẩm có tần suất Pick cao ({selectedAisle.hotSku}) ở Tầng 1 và Tầng 2 để rút ngắn 35% thời gian lấy hàng của thủ kho.
                  </p>
                </div>
              </>
            ) : (
              <div className="py-20 text-center text-slate-400 text-xs">
                Chọn một dãy kệ trên sơ đồ để xem vị trí ô (Bin).
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: Reorder Point (ROP) Engine */}
      {subTab === 'reorder_point' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-orange-50/80 to-amber-50/80 p-5 rounded-2xl border border-orange-200/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 bg-orange-600 text-white rounded-full text-[10px] font-black uppercase">
                  Động Cơ ROP AI
                </span>
                <span className="text-xs font-mono font-bold text-orange-800">
                  Công thức: ROP = (Lead Time × Daily Demand) + Safety Stock
                </span>
              </div>
              <h3 className="text-base font-black text-slate-900">
                Bảng Phân Tích Cảnh Báo Tồn Kho & Điểm Đặt Hàng Lại Tự Động
              </h3>
              <p className="text-xs text-slate-600 max-w-3xl">
                Hệ thống tự động phân tích tốc độ bán ra hàng ngày (Daily Demand) và thời gian giao hàng của Nhà cung cấp (Lead Time) để phát hiện SKU dưới ngưỡng an toàn, ngăn chặn đứt gãy nguồn cung TMĐT.
              </p>
            </div>

            <button
              onClick={handleGenerateAutoPO}
              disabled={autoGeneratingPO}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>Sinh Phiếu Đề Xuất Mua (Auto-PO)</span>
            </button>
          </div>

          {/* ROP Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <th className="px-4 py-3">Mã SKU & Tên Sản Phẩm</th>
                  <th className="px-4 py-3 text-right">Tồn Thực Tế</th>
                  <th className="px-4 py-3 text-right">Bán / Ngày</th>
                  <th className="px-4 py-3 text-right">Lead Time NCC</th>
                  <th className="px-4 py-3 text-right">Tồn An Toàn</th>
                  <th className="px-4 py-3 text-right">Điểm Đặt Lại (ROP)</th>
                  <th className="px-4 py-3 text-center">Trạng Thái Tồn</th>
                  <th className="px-4 py-3 text-right">Đề Xuất Mua Bù</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {ropItems.map(item => {
                  const isUrgent = item.currentStock <= item.rop;
                  const replenishQty = Math.max(0, item.targetMaxStock - item.currentStock);

                  return (
                    <tr key={item.skuId} className={cn("hover:bg-slate-50 transition-colors", isUrgent ? "bg-rose-50/40" : "")}>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="font-mono text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded font-bold">
                            {item.skuId}
                          </span>
                          <span className="text-[10px] text-slate-500">{item.supplier}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-black text-sm text-slate-900">
                        {item.currentStock} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono">
                        {item.dailyDemand} {item.unit}/ngày
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {item.leadTimeDays} ngày
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {item.safetyStock} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-orange-700">
                        {item.rop} {item.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isUrgent ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> CẦN ĐẶT GẤP ⚠️
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> An toàn ✓
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isUrgent ? (
                          <span className="font-mono font-black text-rose-600">
                            +{replenishQty} {item.unit} ({formatCurrency(replenishQty * item.unitCost)})
                          </span>
                        ) : (
                          <span className="text-slate-400 font-mono">Đủ định mức</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Purchase Requisitions (wh_req_purchase) */}
      {subTab === 'req_purchase' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Danh Sách Phiếu Đề Xuất Mua Hàng (Purchase Requisitions)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tự động sinh từ cảnh báo ROP hoặc do thủ kho tạo trước khi gửi sang PO Mua sắm</p>
            </div>
            {onNavigateToPO && (
              <button
                onClick={onNavigateToPO}
                className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Mở Phân Hệ Mua Sắm PO</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100">
            {purchaseReqs.map(req => (
              <div key={req.id} className="p-4 hover:bg-slate-50 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-0.5 rounded">
                      #{req.id}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{req.title}</span>
                    {req.urgency === 'high' && (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[9px] font-black rounded uppercase">
                        Khẩn cấp
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{req.notes}</p>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400">
                    <span>Người đề xuất: <strong className="text-slate-600">{req.creator}</strong></span>
                    <span>• Ngày tạo: {req.createdDate}</span>
                    <span>• NCC: <strong className="text-slate-600">{req.supplier}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Giá trị dự toán</span>
                    <span className="font-mono font-black text-slate-900 text-sm">{formatCurrency(req.estimatedValue)}</span>
                  </div>

                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase",
                    req.status === 'converted_po' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                    req.status === 'approved' ? "bg-blue-50 text-blue-700 border border-blue-200" :
                    "bg-amber-50 text-amber-700 border border-amber-200"
                  )}>
                    {req.status === 'converted_po' ? 'Đã lập PO ✓' :
                     req.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Stock Vouchers In/Out (wh_in_out) */}
      {subTab === 'in_out_vouchers' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Sổ Quản Lý Phiếu Kho (Nhập / Xuất / Điều Chuyển)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Theo dõi lịch sử luân chuyển hàng hóa thực tế qua từng kho và hãng vận chuyển</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {stockVouchers.map(v => (
              <div key={v.id} className="p-4 hover:bg-slate-50 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded">
                      #{v.id}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      v.type === 'inbound' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                      v.type === 'outbound' ? "bg-blue-50 text-blue-700 border border-blue-200" :
                      "bg-purple-50 text-purple-700 border border-purple-200"
                    )}>
                      {v.typeLabel}
                    </span>
                    <span className="text-xs text-slate-600 font-medium">({v.warehouse})</span>
                  </div>
                  <p className="text-xs text-slate-500">Đối tác: <strong className="text-slate-700">{v.partner}</strong> • Nguồn chứng từ: {v.source}</p>
                  <p className="text-[10px] text-slate-400">Thời gian: {v.date} • Thủ kho thực hiện: {v.handler}</p>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Tổng giá trị</span>
                    <span className="font-mono font-black text-slate-900 text-sm">{formatCurrency(v.value)}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">({v.totalItems} SP)</span>
                  </div>

                  <span className={cn(
                    "px-2.5 py-1 rounded-full text-[10px] font-black uppercase",
                    v.status === 'completed' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                  )}>
                    {v.status === 'completed' ? 'Hoàn thành ✓' : 'Đang luân chuyển'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
