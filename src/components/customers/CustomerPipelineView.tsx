import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Kanban, 
  DollarSign, 
  TrendingUp, 
  User, 
  ArrowRight, 
  MoreVertical,
  Briefcase,
  Sparkles,
  CheckCircle2,
  XCircle,
  Building2,
  X,
  FileText,
  AlertTriangle,
  RotateCcw,
  Target
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { StatusBadge } from '../ui/design-system';

export interface PipelineDeal {
  id: string;
  client: string;
  contactName?: string;
  phone?: string;
  val: number;
  pd: string;
  probability: number; // 0 - 100
  assignee: string;
  priority?: 'low' | 'medium' | 'high';
  stage: string;
  lostReason?: string;
  createdAt?: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  color: string;
  deals: PipelineDeal[];
}

const INITIAL_STAGES: PipelineStage[] = [
  { 
    id: 'new', 
    name: 'Leads Mới', 
    color: 'bg-slate-700 text-white', 
    deals: [
      { id: 'd1', client: 'Tập đoàn TH True Milk', contactName: 'Nguyễn Anh Tuấn', phone: '0912345678', val: 150000000, pd: 'Hệ thống chuỗi 50 máy POS thanh toán', probability: 20, assignee: 'Lê Minh Hùng', priority: 'high', stage: 'new' },
      { id: 'd2', client: 'Vinpearl Nha Trang Resort', contactName: 'Phạm Thu Hương', phone: '0987654321', val: 280000000, pd: 'Đồng phục nhân viên & vật tư khách sạn', probability: 25, assignee: 'Võ Thị Mai', priority: 'medium', stage: 'new' },
      { id: 'd8', client: 'Chuỗi Cà phê Highlands', contactName: 'Trần Văn Long', phone: '0903112233', val: 95000000, pd: 'Phần mềm E-Menu QR Code', probability: 15, assignee: 'Nguyễn Quốc Bảo', priority: 'medium', stage: 'new' }
    ] 
  },
  { 
    id: 'qualified', 
    name: 'Đã Thẩm Định', 
    color: 'bg-blue-600 text-white', 
    deals: [
      { id: 'd3', client: 'Tập đoàn Kangaroo Việt Nam', contactName: 'Đỗ Hải Đăng', phone: '0933445566', val: 120000000, pd: 'Quà tặng đại lý tri ân cuối năm', probability: 45, assignee: 'Lê Minh Hùng', priority: 'high', stage: 'qualified' },
      { id: 'd9', client: 'Hệ thống Dược Pharmacity', contactName: 'Hoàng Kim Yến', phone: '0977889900', val: 340000000, pd: 'Kho lạnh Mini WMS & Thiết bị RFID', probability: 50, assignee: 'Võ Thị Mai', priority: 'high', stage: 'qualified' }
    ] 
  },
  { 
    id: 'proposal', 
    name: 'Gửi Báo Giá', 
    color: 'bg-amber-500 text-white', 
    deals: [
      { id: 'd4', client: 'Tổng Công ty Viettel Telecom', contactName: 'Lê Quốc Trung', phone: '0988112233', val: 450000000, pd: 'Gói combo đồng phục & quà tặng thương hiệu', probability: 65, assignee: 'Nguyễn Quốc Bảo', priority: 'high', stage: 'proposal' },
      { id: 'd5', client: 'FPT Software Hà Nội', contactName: 'Bùi Đức Thắng', phone: '0966554433', val: 85000000, pd: 'Balo chống nước & áo polo công nghệ', probability: 70, assignee: 'Lê Minh Hùng', priority: 'medium', stage: 'proposal' }
    ] 
  },
  { 
    id: 'negotiation', 
    name: 'Thương Lượng HĐ', 
    color: 'bg-orange-500 text-white', 
    deals: [
      { id: 'd6', client: 'Bệnh viện Đa khoa Tâm Anh', contactName: 'BS. Vũ Đình Hưng', phone: '0944332211', val: 310000000, pd: 'Vật tư tiêu hao y tế sỉ hợp đồng năm', probability: 85, assignee: 'Võ Thị Mai', priority: 'high', stage: 'negotiation' }
    ] 
  },
  { 
    id: 'won', 
    name: 'Chốt - Đoạt HĐ', 
    color: 'bg-emerald-600 text-white', 
    deals: [
      { id: 'd7', client: 'Ngân hàng Techcombank', contactName: 'Trịnh Mai Lan', phone: '0911223344', val: 680000000, pd: 'Đồng phục giao dịch viên 120 chi nhánh', probability: 100, assignee: 'Lê Minh Hùng', priority: 'high', stage: 'won' }
    ] 
  },
  { 
    id: 'lost', 
    name: 'Thất Bại (Lost)', 
    color: 'bg-rose-600 text-white', 
    deals: [
      { id: 'd10', client: 'Công ty Vận tải Phương Trang', contactName: 'Trần Văn Cường', phone: '0908889999', val: 190000000, pd: 'Bộ phát Wifi 4G & Thiết bị định vị GPS', probability: 0, assignee: 'Nguyễn Quốc Bảo', priority: 'medium', stage: 'lost', lostReason: 'Giá cao hơn đối thủ 15%' }
    ] 
  }
];

const LOST_REASONS = [
  'Giá cao hơn đối thủ cạnh tranh',
  'Chưa có ngân sách / Tạm hoãn kế hoạch',
  'Tính năng kỹ thuật chưa đáp ứng',
  'Khách hàng chọn đối thủ nội bộ',
  'Thời gian giao hàng không kịp tiến độ',
  'Lý do khác'
];

export function CustomerPipelineView() {
  const navigate = useNavigate();
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [targetStageForNewDeal, setTargetStageForNewDeal] = useState('new');
  
  // Dragging active state
  const [draggedDealInfo, setDraggedDealInfo] = useState<{ dealId: string; sourceStageId: string } | null>(null);

  // Lost reason modal
  const [pendingLostDeal, setPendingLostDeal] = useState<{ dealId: string; sourceStageId: string } | null>(null);
  const [selectedLostReason, setSelectedLostReason] = useState(LOST_REASONS[0]);
  const [customLostNote, setCustomLostNote] = useState('');

  // New deal form state
  const [newClient, setNewClient] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newVal, setNewVal] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newAssignee, setNewAssignee] = useState('Lê Minh Hùng');

  // Load pipeline from Core Backend API
  useEffect(() => {
    fetch('/api/v1/crm/pipeline')
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.stages) && json.stages.length > 0) {
          setStages(json.stages);
        }
      })
      .catch(err => {
        console.warn('[CRM Client] Failed to fetch /api/v1/crm/pipeline, using initial state:', err);
      });
  }, []);

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, dealId: string, sourceStageId: string) => {
    e.dataTransfer.setData('dealId', dealId);
    e.dataTransfer.setData('sourceStageId', sourceStageId);
    setDraggedDealInfo({ dealId, sourceStageId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId') || draggedDealInfo?.dealId;
    const sourceStageId = e.dataTransfer.getData('sourceStageId') || draggedDealInfo?.sourceStageId;
    setDraggedDealInfo(null);

    if (!dealId || !sourceStageId || sourceStageId === targetStageId) return;

    // If moving to Lost, prompt for lost reason
    if (targetStageId === 'lost') {
      setPendingLostDeal({ dealId, sourceStageId });
      return;
    }

    applyStageMove(dealId, sourceStageId, targetStageId);
  };

  const applyStageMove = (dealId: string, sourceStageId: string, targetStageId: string, lostReason?: string) => {
    setStages(prev => {
      const next = [...prev];
      const sourceIndex = next.findIndex(s => s.id === sourceStageId);
      const targetIndex = next.findIndex(s => s.id === targetStageId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const dealIndex = next[sourceIndex].deals.findIndex(d => d.id === dealId);
      if (dealIndex === -1) return prev;

      const [movedDeal] = next[sourceIndex].deals.splice(dealIndex, 1);
      movedDeal.stage = targetStageId;

      // Auto adjust probability on stage change
      if (targetStageId === 'won') movedDeal.probability = 100;
      else if (targetStageId === 'negotiation') movedDeal.probability = 85;
      else if (targetStageId === 'proposal') movedDeal.probability = 65;
      else if (targetStageId === 'qualified') movedDeal.probability = 45;
      else if (targetStageId === 'new') movedDeal.probability = 20;
      else if (targetStageId === 'lost') {
        movedDeal.probability = 0;
        if (lostReason) movedDeal.lostReason = lostReason;
      }

      next[targetIndex].deals.push(movedDeal);
      return next;
    });

    // Notify backend
    fetch(`/api/v1/crm/deals/${dealId}/stage`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stage: targetStageId, lostReason })
    }).catch(err => console.warn('Failed to sync deal stage move:', err));
  };

  const handleConfirmLost = () => {
    if (!pendingLostDeal) return;
    const reasonText = customLostNote.trim() ? `${selectedLostReason} - ${customLostNote.trim()}` : selectedLostReason;
    applyStageMove(pendingLostDeal.dealId, pendingLostDeal.sourceStageId, 'lost', reasonText);
    setPendingLostDeal(null);
    setCustomLostNote('');
  };

  const handleAdvanceStage = (dealId: string, currentStageId: string) => {
    const stageOrder = ['new', 'qualified', 'proposal', 'negotiation', 'won'];
    const currentIdx = stageOrder.indexOf(currentStageId);
    if (currentIdx !== -1 && currentIdx < stageOrder.length - 1) {
      const nextStageId = stageOrder[currentIdx + 1];
      applyStageMove(dealId, currentStageId, nextStageId);
    }
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim() || !newVal) return;

    const valNum = Number(newVal) || 0;
    const newDeal: PipelineDeal = {
      id: 'deal_' + Date.now(),
      client: newClient.trim(),
      contactName: newContact.trim(),
      phone: newPhone.trim(),
      val: valNum,
      pd: newProduct.trim() || 'Hợp đồng giải pháp TMĐT',
      probability: targetStageForNewDeal === 'won' ? 100 : (targetStageForNewDeal === 'proposal' ? 65 : 25),
      assignee: newAssignee,
      priority: 'high',
      stage: targetStageForNewDeal,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    setStages(prev => prev.map(stage => {
      if (stage.id === targetStageForNewDeal) {
        return { ...stage, deals: [newDeal, ...stage.deals] };
      }
      return stage;
    }));

    // Post to Core Backend
    fetch('/api/v1/crm/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newDeal)
    }).catch(err => console.warn('Failed to save deal to backend:', err));

    setShowAddDealModal(false);
    setNewClient('');
    setNewContact('');
    setNewPhone('');
    setNewVal('');
    setNewProduct('');
  };

  // Metrics computation
  const totalPipelineValue = useMemo(() => {
    return stages.reduce((sum, s) => {
      if (s.id === 'lost') return sum;
      return sum + s.deals.reduce((dSum, d) => dSum + d.val, 0);
    }, 0);
  }, [stages]);

  const weightedForecastValue = useMemo(() => {
    return stages.reduce((sum, s) => {
      return sum + s.deals.reduce((dSum, d) => dSum + Math.round((d.val * d.probability) / 100), 0);
    }, 0);
  }, [stages]);

  const wonDealsValue = useMemo(() => {
    return stages.find(s => s.id === 'won')?.deals.reduce((sum, d) => sum + d.val, 0) || 0;
  }, [stages]);

  const totalActiveDeals = useMemo(() => {
    return stages.reduce((sum, s) => sum + (s.id !== 'lost' ? s.deals.length : 0), 0);
  }, [stages]);

  const winRate = useMemo(() => {
    const wonCount = stages.find(s => s.id === 'won')?.deals.length || 0;
    const lostCount = stages.find(s => s.id === 'lost')?.deals.length || 0;
    const closedCount = wonCount + lostCount;
    return closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 75;
  }, [stages]);

  return (
    <div className="space-y-4">
      {/* Pipeline Summary Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-2xs">
            <Kanban className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tổng Quy Mô Phễu (Pipeline)</p>
            <p className="text-base font-black text-slate-900 font-mono mt-0.5">{formatCurrency(totalPipelineValue)}</p>
            <span className="text-[11px] text-slate-500 font-medium">{totalActiveDeals} cơ hội đang mở</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shadow-2xs">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Doanh Thu Dự Báo (Weighted)</p>
            <p className="text-base font-black text-purple-600 font-mono mt-0.5">{formatCurrency(weightedForecastValue)}</p>
            <span className="text-[11px] text-purple-700 font-semibold">Theo xác suất chốt</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-2xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Đã Ký Hợp Đồng (Won)</p>
            <p className="text-base font-black text-emerald-600 font-mono mt-0.5">{formatCurrency(wonDealsValue)}</p>
            <span className="text-[11px] text-emerald-700 font-bold">Thực thu ký kết</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tỉ Lệ Thắng Deal (Win Rate)</p>
            <p className="text-base font-black text-amber-600 font-mono mt-0.5">{winRate}%</p>
            <span className="text-[11px] text-amber-700 font-semibold">Tăng +5.2% MoM</span>
          </div>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-3 min-w-[1400px]">
          {stages.map(stage => {
            const stageTotal = stage.deals.reduce((sum, d) => sum + d.val, 0);
            const stageWeighted = stage.deals.reduce((sum, d) => sum + Math.round((d.val * d.probability) / 100), 0);

            return (
              <div 
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={cn(
                  "flex-1 rounded-2xl p-3 flex flex-col border min-h-[580px] transition-all",
                  stage.id === 'lost' 
                    ? "bg-rose-50/40 border-rose-200/80" 
                    : stage.id === 'won'
                      ? "bg-emerald-50/30 border-emerald-200/80"
                      : "bg-slate-100/70 border-slate-200/80"
                )}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("px-2 py-0.5 rounded-lg text-xs font-bold shadow-2xs", stage.color)}>
                      {stage.name}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 bg-white px-2 py-0.2 rounded-full border border-slate-200">
                      {stage.deals.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setTargetStageForNewDeal(stage.id);
                      setShowAddDealModal(true);
                    }}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
                    title={`Thêm cơ hội vào ${stage.name}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Column Total & Weighted Value Strip */}
                <div className="bg-white/90 rounded-xl p-2 mb-3 space-y-1 text-[10px] font-mono border border-slate-200/60 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tổng deal:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(stageTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-purple-600">
                    <span>Dự báo (Weighted):</span>
                    <span className="font-bold">{formatCurrency(stageWeighted)}</span>
                  </div>
                </div>

                {/* Deal Cards */}
                <div className="space-y-2.5 flex-1 overflow-y-auto pr-0.5 custom-scrollbar">
                  {stage.deals.map(deal => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id, stage.id)}
                      className={cn(
                        "bg-white rounded-xl p-3.5 border shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group hover:-translate-y-0.5",
                        stage.id === 'lost' ? "border-rose-100 hover:border-rose-200" : "border-slate-200"
                      )}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                          {deal.client}
                        </h4>
                        {deal.priority === 'high' && (
                          <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 text-[9px] font-bold rounded uppercase shrink-0 border border-rose-200">
                            Gấp
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 font-medium">
                        {deal.pd}
                      </p>

                      {/* Lost reason badge if present */}
                      {deal.lostReason && (
                        <div className="mb-2 p-1.5 bg-rose-50 rounded-lg border border-rose-200/60 text-[10px] text-rose-700 font-medium">
                          ⚠️ {deal.lostReason}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">Giá trị</p>
                          <p className="text-xs font-black text-slate-900 font-mono">
                            {formatCurrency(deal.val)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">Xác suất</p>
                          <span className={cn(
                            "text-[11px] font-bold font-mono",
                            deal.probability >= 80 ? "text-emerald-600" :
                            deal.probability >= 50 ? "text-blue-600" : "text-amber-600"
                          )}>
                            {deal.probability}%
                          </span>
                        </div>
                      </div>

                      {/* Probability Progress Bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className={cn(
                            "h-1.5 rounded-full transition-all",
                            stage.id === 'lost' ? "bg-rose-400" :
                            deal.probability >= 80 ? "bg-emerald-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"
                          )}
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>

                      {/* Card Footer */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <div className="w-4.5 h-4.5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[9px]">
                            {deal.assignee.charAt(0)}
                          </div>
                          <span className="truncate max-w-[85px]">{deal.assignee}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/sales-contracts?dealId=${deal.id}&client=${encodeURIComponent(deal.client)}&val=${deal.val}&pd=${encodeURIComponent(deal.pd)}`);
                            }}
                            className="px-1.5 py-0.5 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[9px] transition-all cursor-pointer shadow-2xs flex items-center gap-0.5"
                            title="Tạo Báo Giá & Hợp Đồng Ký Số từ Deal này"
                          >
                            <FileText className="w-2.5 h-2.5" />
                            <span>Báo giá</span>
                          </button>

                          {stage.id !== 'won' && stage.id !== 'lost' && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStage(deal.id, stage.id)}
                              className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5 transition-colors cursor-pointer hover:underline text-[10px]"
                              title="Chuyển sang giai đoạn tiếp theo"
                            >
                              <span>Tiếp</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {stage.deals.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 text-xs text-center p-3">
                      <span>Kéo thả deal vào đây</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Deal Modal */}
      {showAddDealModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Tạo Cơ Hội Bán Hàng Mới (Deal)</h3>
              </div>
              <button 
                onClick={() => setShowAddDealModal(false)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên khách hàng / Doanh nghiệp *</label>
                <input 
                  type="text"
                  required
                  value={newClient}
                  onChange={e => setNewClient(e.target.value)}
                  placeholder="Ví dụ: Tập đoàn Vingroup, Cà phê Trung Nguyên..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Người liên hệ</label>
                  <input 
                    type="text"
                    value={newContact}
                    onChange={e => setNewContact(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại</label>
                  <input 
                    type="tel"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="0987..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Giá trị dự kiến (VNĐ) *</label>
                <input 
                  type="number"
                  required
                  min="0"
                  step="1000000"
                  value={newVal}
                  onChange={e => setNewVal(e.target.value)}
                  placeholder="150000000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono focus:outline-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Gói sản phẩm / Hạng mục tư vấn</label>
                <input 
                  type="text"
                  value={newProduct}
                  onChange={e => setNewProduct(e.target.value)}
                  placeholder="Ví dụ: 100 Thiết bị máy POS bán lẻ + Phần mềm ERP"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giai đoạn ban đầu</label>
                  <select 
                    value={targetStageForNewDeal}
                    onChange={e => setTargetStageForNewDeal(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                  >
                    {stages.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nhân viên phụ trách</label>
                  <select 
                    value={newAssignee}
                    onChange={e => setNewAssignee(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                  >
                    <option value="Lê Minh Hùng">Lê Minh Hùng</option>
                    <option value="Võ Thị Mai">Võ Thị Mai</option>
                    <option value="Nguyễn Quốc Bảo">Nguyễn Quốc Bảo</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDealModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu Deal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lost Reason Modal */}
      {pendingLostDeal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-bold text-sm text-slate-900">Ghi Nhận Lý Do Thất Bại (Lost Deal)</h3>
              </div>
              <button 
                onClick={() => setPendingLostDeal(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <p className="text-slate-600">
                Vui lòng phân loại lý do mất cơ hội bán hàng để bộ phận kinh doanh rút kinh nghiệm và phân tích Win-Loss:
              </p>

              <div className="space-y-2">
                {LOST_REASONS.map(reason => (
                  <label key={reason} className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input 
                      type="radio" 
                      name="lost_reason"
                      checked={selectedLostReason === reason}
                      onChange={() => setSelectedLostReason(reason)}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-medium text-slate-800">{reason}</span>
                  </label>
                ))}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú bổ sung (nếu có):</label>
                <textarea 
                  rows={2}
                  value={customLostNote}
                  onChange={e => setCustomLostNote(e.target.value)}
                  placeholder="Ghi chú thêm về phản hồi của khách hàng..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingLostDeal(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLost}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Xác nhận Thất bại
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
