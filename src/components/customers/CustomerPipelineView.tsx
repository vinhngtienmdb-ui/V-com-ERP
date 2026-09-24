import React, { useState } from 'react';
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
  FileText
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
      { id: 'd1', client: 'Tập đoàn TH True Milk', contactName: 'Nguyễn Anh Tuấn', phone: '0912345678', val: 150000000, pd: 'Hệ thống chuỗi 50 máy POS thanh toán', probability: 20, assignee: 'Lê Minh Hùng', priority: 'high' },
      { id: 'd2', client: 'Vinpearl Nha Trang Resort', contactName: 'Phạm Thu Hương', phone: '0987654321', val: 280000000, pd: 'Đồng phục nhân viên & vật tư khách sạn', probability: 25, assignee: 'Võ Thị Mai', priority: 'medium' },
      { id: 'd8', client: 'Chuỗi Cà phê Highlands', contactName: 'Trần Văn Long', phone: '0903112233', val: 95000000, pd: 'Phần mềm E-Menu QR Code', probability: 15, assignee: 'Nguyễn Quốc Bảo', priority: 'medium' }
    ] 
  },
  { 
    id: 'qualified', 
    name: 'Đã Thẩm Định', 
    color: 'bg-blue-600 text-white', 
    deals: [
      { id: 'd3', client: 'Tập đoàn Kangaroo Việt Nam', contactName: 'Đỗ Hải Đăng', phone: '0933445566', val: 120000000, pd: 'Quà tặng đại lý tri ân cuối năm', probability: 45, assignee: 'Lê Minh Hùng', priority: 'high' },
      { id: 'd9', client: 'Hệ thống Dược Pharmacity', contactName: 'Hoàng Kim Yến', phone: '0977889900', val: 340000000, pd: 'Kho lạnh Mini WMS & Thiết bị RFID', probability: 50, assignee: 'Võ Thị Mai', priority: 'high' }
    ] 
  },
  { 
    id: 'proposal', 
    name: 'Gửi Báo Giá', 
    color: 'bg-amber-500 text-white', 
    deals: [
      { id: 'd4', client: 'Tổng Công ty Viettel Telecom', contactName: 'Lê Quốc Trung', phone: '0988112233', val: 450000000, pd: 'Gói combo đồng phục & quà tặng thương hiệu', probability: 65, assignee: 'Nguyễn Quốc Bảo', priority: 'high' },
      { id: 'd5', client: 'FPT Software Hà Nội', contactName: 'Bùi Đức Thắng', phone: '0966554433', val: 85000000, pd: 'Balo chống nước & áo polo công nghệ', probability: 70, assignee: 'Lê Minh Hùng', priority: 'medium' }
    ] 
  },
  { 
    id: 'negotiation', 
    name: 'Thương Lượng HĐ', 
    color: 'bg-orange-500 text-white', 
    deals: [
      { id: 'd6', client: 'Bệnh viện Đa khoa Tâm Anh', contactName: 'BS. Vũ Đình Hưng', phone: '0944332211', val: 310000000, pd: 'Vật tư tiêu hao y tế sỉ hợp đồng năm', probability: 85, assignee: 'Võ Thị Mai', priority: 'high' }
    ] 
  },
  { 
    id: 'won', 
    name: 'Chốt - Đoạt HĐ', 
    color: 'bg-emerald-600 text-white', 
    deals: [
      { id: 'd7', client: 'Ngân hàng Techcombank', contactName: 'Trịnh Mai Lan', phone: '0911223344', val: 680000000, pd: 'Đồng phục giao dịch viên 120 chi nhánh', probability: 100, assignee: 'Lê Minh Hùng', priority: 'high' }
    ] 
  }
];

export function CustomerPipelineView() {
  const navigate = useNavigate();
  const [stages, setStages] = useState<PipelineStage[]>(INITIAL_STAGES);
  const [showAddDealModal, setShowAddDealModal] = useState(false);
  const [targetStageForNewDeal, setTargetStageForNewDeal] = useState('new');
  
  // New deal form state
  const [newClient, setNewClient] = useState('');
  const [newContact, setNewContact] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newVal, setNewVal] = useState('');
  const [newProduct, setNewProduct] = useState('');
  const [newAssignee, setNewAssignee] = useState('Lê Minh Hùng');

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, dealId: string, sourceStageId: string) => {
    e.dataTransfer.setData('dealId', dealId);
    e.dataTransfer.setData('sourceStageId', sourceStageId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    const dealId = e.dataTransfer.getData('dealId');
    const sourceStageId = e.dataTransfer.getData('sourceStageId');
    if (!dealId || !sourceStageId || sourceStageId === targetStageId) return;

    setStages(prev => {
      const next = [...prev];
      const sourceIndex = next.findIndex(s => s.id === sourceStageId);
      const targetIndex = next.findIndex(s => s.id === targetStageId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const dealIndex = next[sourceIndex].deals.findIndex(d => d.id === dealId);
      if (dealIndex === -1) return prev;

      const [movedDeal] = next[sourceIndex].deals.splice(dealIndex, 1);
      // Auto adjust probability on stage change
      if (targetStageId === 'won') movedDeal.probability = 100;
      else if (targetStageId === 'negotiation') movedDeal.probability = 85;
      else if (targetStageId === 'proposal') movedDeal.probability = 65;
      else if (targetStageId === 'qualified') movedDeal.probability = 45;
      else if (targetStageId === 'new') movedDeal.probability = 20;

      next[targetIndex].deals.push(movedDeal);
      return next;
    });
  };

  const handleAdvanceStage = (dealId: string, currentStageId: string) => {
    const stageOrder = ['new', 'qualified', 'proposal', 'negotiation', 'won'];
    const currentIdx = stageOrder.indexOf(currentStageId);
    if (currentIdx < stageOrder.length - 1) {
      const nextStageId = stageOrder[currentIdx + 1];
      setStages(prev => {
        const next = [...prev];
        const sIdx = next.findIndex(s => s.id === currentStageId);
        const tIdx = next.findIndex(s => s.id === nextStageId);
        const dIdx = next[sIdx].deals.findIndex(d => d.id === dealId);
        const [moved] = next[sIdx].deals.splice(dIdx, 1);
        if (nextStageId === 'won') moved.probability = 100;
        else if (nextStageId === 'negotiation') moved.probability = 85;
        else if (nextStageId === 'proposal') moved.probability = 65;
        else if (nextStageId === 'qualified') moved.probability = 45;
        next[tIdx].deals.push(moved);
        return next;
      });
    }
  };

  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.trim() || !newVal) return;

    const newDeal: PipelineDeal = {
      id: 'deal_' + Date.now(),
      client: newClient.trim(),
      contactName: newContact.trim(),
      phone: newPhone.trim(),
      val: Number(newVal) || 0,
      pd: newProduct.trim() || 'Hợp đồng giải pháp TMĐT',
      probability: targetStageForNewDeal === 'won' ? 100 : 25,
      assignee: newAssignee,
      priority: 'high'
    };

    setStages(prev => prev.map(stage => {
      if (stage.id === targetStageForNewDeal) {
        return { ...stage, deals: [newDeal, ...stage.deals] };
      }
      return stage;
    }));

    setShowAddDealModal(false);
    setNewClient('');
    setNewContact('');
    setNewPhone('');
    setNewVal('');
    setNewProduct('');
  };

  // Metrics computation
  const totalPipelineValue = stages.reduce((sum, s) => {
    return sum + s.deals.reduce((dSum, d) => dSum + d.val, 0);
  }, 0);

  const wonDealsValue = stages.find(s => s.id === 'won')?.deals.reduce((sum, d) => sum + d.val, 0) || 0;
  const totalDealsCount = stages.reduce((sum, s) => sum + s.deals.length, 0);
  const winRate = totalDealsCount > 0 ? Math.round(((stages.find(s => s.id === 'won')?.deals.length || 0) / totalDealsCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Pipeline Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-xs">
            <Kanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tổng giá trị Pipeline</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{formatCurrency(totalPipelineValue)}</p>
            <span className="text-[11px] text-slate-500 font-medium">Toàn bộ {totalDealsCount} cơ hội</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Doanh số Đã Chốt (Won)</p>
            <p className="text-xl font-black text-emerald-600 mt-0.5">{formatCurrency(wonDealsValue)}</p>
            <span className="text-[11px] text-emerald-700 font-bold">Thực thu ký kết hợp đồng</span>
          </div>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Tỉ lệ chốt Sale (Win Rate)</p>
            <p className="text-xl font-black text-indigo-600 mt-0.5">{winRate}%</p>
            <span className="text-[11px] text-indigo-700 font-semibold">Tăng +4.5% so với tháng trước</span>
          </div>
        </div>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1280px]">
          {stages.map(stage => {
            const stageTotal = stage.deals.reduce((sum, d) => sum + d.val, 0);

            return (
              <div 
                key={stage.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, stage.id)}
                className="flex-1 bg-slate-100/80 rounded-2xl p-3.5 flex flex-col border border-slate-200/80 min-h-[550px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2.5 py-1 rounded-lg text-xs font-bold shadow-xs", stage.color)}>
                      {stage.name}
                    </span>
                    <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200">
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

                {/* Column Total Value Strip */}
                <div className="bg-white/80 rounded-xl px-3 py-1.5 mb-3 flex items-center justify-between text-[11px] font-mono border border-slate-200/50 shadow-2xs">
                  <span className="text-slate-500">Tổng giá trị:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(stageTotal)}</span>
                </div>

                {/* Deal Cards */}
                <div className="space-y-3 flex-1 overflow-y-auto pr-0.5">
                  {stage.deals.map(deal => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal.id, stage.id)}
                      className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing group hover:-translate-y-0.5"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                          {deal.client}
                        </h4>
                        {deal.priority === 'high' && (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 text-[9px] font-bold rounded uppercase shrink-0 border border-rose-200">
                            Ưu tiên
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-600 line-clamp-2 mb-2.5 font-medium">
                        {deal.pd}
                      </p>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">Giá trị Deal</p>
                          <p className="text-xs font-black text-slate-900 font-mono">
                            {formatCurrency(deal.val)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] text-slate-400 font-semibold uppercase">Xác suất</p>
                          <span className="text-[11px] font-bold text-emerald-600">
                            {deal.probability}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full"
                          style={{ width: `${deal.probability}%` }}
                        />
                      </div>

                      {/* Card Footer */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[9px]">
                            {deal.assignee.charAt(0)}
                          </div>
                          <span className="truncate max-w-[90px]">{deal.assignee}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
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

                          {stage.id !== 'won' && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceStage(deal.id, stage.id)}
                              className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-0.5 transition-colors cursor-pointer hover:underline"
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
                    <div className="h-32 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs text-center p-3">
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
                  onChange={(e) => setNewClient(e.target.value)}
                  placeholder="VD: Tập đoàn Masan Consumer"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Gói sản phẩm / Nhu cầu quan tâm *</label>
                <input 
                  type="text"
                  required
                  value={newProduct}
                  onChange={(e) => setNewProduct(e.target.value)}
                  placeholder="VD: 100 Máy POS Pax A920 + Sim 4G"
                  className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giá trị dự kiến (VNĐ) *</label>
                  <input 
                    type="number"
                    required
                    value={newVal}
                    onChange={(e) => setNewVal(e.target.value)}
                    placeholder="VD: 250000000"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 font-mono outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Người phụ trách</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="Lê Minh Hùng">Lê Minh Hùng</option>
                    <option value="Võ Thị Mai">Võ Thị Mai</option>
                    <option value="Nguyễn Quốc Bảo">Nguyễn Quốc Bảo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Người liên hệ</label>
                  <input 
                    type="text"
                    value={newContact}
                    onChange={(e) => setNewContact(e.target.value)}
                    placeholder="VD: Anh Nam (Giám đốc Mua hàng)"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại</label>
                  <input 
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="VD: 0987654321"
                    className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddDealModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
                >
                  Lưu cơ hội
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
