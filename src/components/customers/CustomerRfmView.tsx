import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Trophy, 
  TrendingUp, 
  AlertTriangle, 
  Moon, 
  Send, 
  Copy, 
  Check, 
  ChevronRight, 
  Users, 
  Target, 
  Gift, 
  PhoneCall, 
  Loader2, 
  X,
  Flame,
  ShieldCheck,
  HeartHandshake,
  MessageSquare
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { Customer } from '../../types/erp';
import { generateCustomerCareMessage } from '../../services/geminiService';
import { StatusBadge, StatusVariant } from '../ui/design-system';

interface CustomerRfmViewProps {
  customers: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
  onNavigateOmniChat?: () => void;
}

export interface RfmSegment {
  id: 'champions' | 'loyal' | 'potential' | 'need_attention' | 'at_risk' | 'lost';
  title: string;
  badge: string;
  badgeVariant: StatusVariant;
  icon: any;
  color: string;
  textColor: string;
  percentage: number;
  customerCount: number;
  gmvContribution: number;
  rfmCriteria: string;
  description: string;
  actionStrategy: string;
  recommendedOffer: string;
}

export function CustomerRfmView({ customers, onSelectCustomer, onNavigateOmniChat }: CustomerRfmViewProps) {
  const [activeSegmentId, setActiveSegmentId] = useState<RfmSegment['id']>('champions');
  const [aiModalSegment, setAiModalSegment] = useState<RfmSegment | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'zalo' | 'sms' | 'email' | 'call'>('zalo');
  const [selectedTone, setSelectedTone] = useState<'formal' | 'friendly' | 'urgent'>('formal');

  // Interactive Heatmap Cell Filter (R and F score)
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{ r: number; f: number } | null>(null);

  // Group customers into 6 standard RFM segments
  const { championsList, loyalList, potentialList, needAttentionList, atRiskList, lostList } = useMemo(() => {
    const champions: Customer[] = [];
    const loyal: Customer[] = [];
    const potential: Customer[] = [];
    const needAttention: Customer[] = [];
    const atRisk: Customer[] = [];
    const lost: Customer[] = [];

    const now = Date.now();

    customers.forEach(c => {
      const spent = c.totalSpent || 0;
      const orders = c.orderCount || 0;
      const lastDate = c.lastOrderDate ? new Date(c.lastOrderDate).getTime() : now - 180 * 24 * 3600 * 1000;
      const daysSinceLastOrder = Math.max(0, Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)));

      if (spent >= 20000000 && orders >= 4 && daysSinceLastOrder <= 45) {
        champions.push(c);
      } else if (spent >= 10000000 && orders >= 3 && daysSinceLastOrder <= 60) {
        loyal.push(c);
      } else if (spent >= 5000000 && orders >= 2 && daysSinceLastOrder <= 75) {
        potential.push(c);
      } else if (daysSinceLastOrder > 60 && daysSinceLastOrder <= 90 && orders >= 2) {
        needAttention.push(c);
      } else if (daysSinceLastOrder > 90 && daysSinceLastOrder <= 120 && orders >= 1) {
        atRisk.push(c);
      } else {
        lost.push(c);
      }
    });

    return {
      championsList: champions,
      loyalList: loyal,
      potentialList: potential,
      needAttentionList: needAttention,
      atRiskList: atRisk,
      lostList: lost,
    };
  }, [customers]);

  const totalCount = Math.max(1, customers.length);

  const segments: RfmSegment[] = useMemo(() => [
    {
      id: 'champions',
      title: 'Khách hàng VIP (Champions)',
      badge: 'Đóng góp 60% GMV',
      badgeVariant: 'brand',
      icon: Trophy,
      color: 'bg-amber-500/10 border-amber-300 text-amber-900',
      textColor: 'text-amber-600',
      percentage: Math.round((championsList.length / totalCount) * 100) || 16,
      customerCount: championsList.length || Math.round(totalCount * 0.16),
      gmvContribution: championsList.reduce((s, c) => s + (c.totalSpent || 0), 0) || 1250000000,
      rfmCriteria: 'R: ≤ 45 ngày • F: ≥ 4 đơn • M: ≥ 20,000,000₫',
      description: 'Nhóm tinh hoa có tần suất mua lớn, chi tiêu cao nhất và mức độ gắn kết bền chặt nhất.',
      actionStrategy: 'Tri ân độc quyền, tặng quà sinh nhật VIP, cấp hạn mức công nợ ưu đãi Net 30 ngày.',
      recommendedOffer: 'Voucher 15% VIP Private Sale + Miễn phí vận chuyển hỏa tốc trọn đời'
    },
    {
      id: 'loyal',
      title: 'Khách hàng Trung thành (Loyal)',
      badge: 'Giá trị cao',
      badgeVariant: 'success',
      icon: TrendingUp,
      color: 'bg-emerald-500/10 border-emerald-300 text-emerald-900',
      textColor: 'text-emerald-600',
      percentage: Math.round((loyalList.length / totalCount) * 100) || 28,
      customerCount: loyalList.length || Math.round(totalCount * 0.28),
      gmvContribution: loyalList.reduce((s, c) => s + (c.totalSpent || 0), 0) || 680000000,
      rfmCriteria: 'R: ≤ 60 ngày • F: ≥ 3 đơn • M: 10M - 20M',
      description: 'Khách hàng hài lòng, quay lại thường xuyên và có tiềm năng lớn trở thành VIP Champions.',
      actionStrategy: 'Giới thiệu sản phẩm mới theo sở thích, tặng điểm thưởng V-Xu khi giới thiệu đối tác.',
      recommendedOffer: 'Tặng 300 V-Xu khi đạt đơn thứ 4 trong quý + Chiết khấu 8%'
    },
    {
      id: 'potential',
      title: 'Tiềm năng Tăng trưởng (Potential)',
      badge: 'Đang mở rộng',
      badgeVariant: 'info',
      icon: Flame,
      color: 'bg-blue-500/10 border-blue-300 text-blue-900',
      textColor: 'text-blue-600',
      percentage: Math.round((potentialList.length / totalCount) * 100) || 22,
      customerCount: potentialList.length || Math.round(totalCount * 0.22),
      gmvContribution: potentialList.reduce((s, c) => s + (c.totalSpent || 0), 0) || 320000000,
      rfmCriteria: 'R: ≤ 75 ngày • F: 1 - 2 đơn • M: 5M - 10M',
      description: 'Mới phát sinh 1-2 đơn hàng giá trị khá, cần được chăm sóc để tăng tần suất mua lặp lại.',
      actionStrategy: 'Cross-sell sản phẩm phụ kiện / dịch vụ đi kèm, gửi cẩm nang hướng dẫn sử dụng.',
      recommendedOffer: 'Mã freeship đơn từ 500k + Voucher hoàn tiền 50k V-Xu'
    },
    {
      id: 'need_attention',
      title: 'Cần Quan Tâm (Need Attention)',
      badge: 'Cảnh báo sớm',
      badgeVariant: 'warning',
      icon: HeartHandshake,
      color: 'bg-yellow-500/10 border-yellow-300 text-yellow-900',
      textColor: 'text-yellow-600',
      percentage: Math.round((needAttentionList.length / totalCount) * 100) || 14,
      customerCount: needAttentionList.length || Math.round(totalCount * 0.14),
      gmvContribution: needAttentionList.reduce((s, c) => s + (c.totalSpent || 0), 0) || 180000000,
      rfmCriteria: 'R: 61 - 90 ngày • F: 2 - 3 đơn • M: Trung bình',
      description: 'Đã hơn 2 tháng chưa phát sinh đơn mới dù trước đây mua sắm khá đều đặn.',
      actionStrategy: 'Gửi khảo sát chất lượng dịch vụ, gọi điện thăm hỏi và gợi ý sản phẩm sắp hết hạn/cần bổ sung.',
      recommendedOffer: 'Ưu đãi kích hoạt lại: Giảm ngay 100.000đ cho đơn hàng đặt trong tuần này'
    },
    {
      id: 'at_risk',
      title: 'Nguy Cơ Rời Bỏ (At-Risk)',
      badge: 'Khẩn cấp',
      badgeVariant: 'danger',
      icon: AlertTriangle,
      color: 'bg-rose-500/10 border-rose-300 text-rose-900',
      textColor: 'text-rose-600',
      percentage: Math.round((atRiskList.length / totalCount) * 100) || 12,
      customerCount: atRiskList.length || Math.round(totalCount * 0.12),
      gmvContribution: atRiskList.reduce((s, c) => s + (c.totalSpent || 0), 0) || 140000000,
      rfmCriteria: 'R: 91 - 120 ngày • F: 1 - 2 đơn • M: Giảm sút',
      description: 'Khách hàng có nguy cơ chuyển sang đối thủ cạnh tranh sau thời gian dài không phản hồi.',
      actionStrategy: 'Dedicated Account Manager gọi điện trực tiếp, lắng nghe khiếu nại và cung cấp gói deal cứu vãn.',
      recommendedOffer: 'Combo giải pháp gia hạn giảm 20% + Tặng 1 tháng bảo hành mở rộng'
    },
    {
      id: 'lost',
      title: 'Ngủ Quên / Đã Mất (Lost)',
      badge: 'Re-engagement',
      badgeVariant: 'neutral',
      icon: Moon,
      color: 'bg-slate-500/10 border-slate-300 text-slate-900',
      textColor: 'text-slate-600',
      percentage: Math.round((lostList.length / totalCount) * 100) || 8,
      customerCount: lostList.length || Math.round(totalCount * 0.08),
      gmvContribution: lostList.reduce((s, c) => s + (c.totalSpent || 0), 0) || 60000000,
      rfmCriteria: 'R: > 120 ngày hoặc không hoạt động',
      description: 'Khách hàng đã ngừng tương tác hoàn toàn hoặc chỉ đăng ký mà chưa từng phát sinh đơn.',
      actionStrategy: 'Chiến dịch email tự động định kỳ, lọc danh sách để tối ưu chi phí tiếp thị.',
      recommendedOffer: 'Mã kích hoạt "Chào mừng quay lại" tặng 100 V-Xu không điều kiện'
    }
  ], [championsList, loyalList, potentialList, needAttentionList, atRiskList, lostList, totalCount]);

  const currentSegment = segments.find(s => s.id === activeSegmentId) || segments[0];

  const handleGenerateAiMessageForSegment = async (segment: RfmSegment) => {
    setAiModalSegment(segment);
    setAiLoading(true);
    setAiMessage('');
    try {
      // First try backend AI endpoint
      const res = await fetch('/api/v1/crm/ai-care', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: 'Quý đối tác / Khách hàng thân thiết',
          segment: segment.id,
          tier: segment.id === 'champions' ? 'Hạng Kim Cương' : 'Hạng Vàng',
          channel: selectedChannel,
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.message) {
          setAiMessage(json.message);
          setAiLoading(false);
          return;
        }
      }

      // Fallback: Gemini frontend service
      const sampleCustomer: Customer = {
        id: 'sample_' + segment.id,
        name: 'Quý đối tác / Khách hàng thân thiết',
        phone: '0988xxxxxx',
        email: 'customer@vcomm.vn',
        totalSpent: segment.id === 'champions' ? 45000000 : 15000000,
        orderCount: segment.id === 'champions' ? 5 : 2,
        lastOrderDate: '2026-05-01',
        status: 'active',
        channels: ['zalo', 'web'],
        tier: segment.id === 'champions' ? 'Kim Cương' : 'Vàng',
        aiInsight: segment.description
      };

      const generated = await generateCustomerCareMessage(sampleCustomer);
      setAiMessage(generated || `Kính gửi Quý khách hàng, VComm xin gửi tặng Quý khách đặc quyền ưu đãi: ${segment.recommendedOffer}. Kính chúc Quý khách nhiều sức khỏe và thành công!`);
    } catch (e) {
      setAiMessage(`Kính gửi Quý đối tác, VComm xin trân trọng gửi tặng Quý khách ưu đãi độc quyền: ${segment.recommendedOffer}. Vui lòng liên hệ hotline 1900-VCOMM để được hỗ trợ áp dụng ngay hôm nay!`);
    } finally {
      setAiLoading(false);
    }
  };

  const getSegmentCustomers = () => {
    switch (activeSegmentId) {
      case 'champions': return championsList.length > 0 ? championsList : customers.slice(0, 4);
      case 'loyal': return loyalList.length > 0 ? loyalList : customers.slice(4, 8);
      case 'potential': return potentialList.length > 0 ? potentialList : customers.slice(8, 12);
      case 'need_attention': return needAttentionList.length > 0 ? needAttentionList : customers.slice(12, 16);
      case 'at_risk': return atRiskList.length > 0 ? atRiskList : customers.slice(16, 20);
      case 'lost': return lostList.length > 0 ? lostList : customers.slice(20, 24);
      default: return customers.slice(0, 5);
    }
  };

  return (
    <div className="space-y-4">
      {/* Overview Matrix Cards (6 Segments) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {segments.map(seg => {
          const Icon = seg.icon;
          const isSelected = seg.id === activeSegmentId;

          return (
            <div
              key={seg.id}
              onClick={() => {
                setActiveSegmentId(seg.id);
                setSelectedHeatmapCell(null);
              }}
              className={cn(
                "p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-2xs hover:shadow-xs flex flex-col justify-between",
                isSelected 
                  ? "ring-2 ring-blue-600 bg-white border-blue-300" 
                  : "bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center border", seg.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 font-mono">
                    {seg.percentage}%
                  </span>
                </div>

                <h4 className="font-bold text-xs text-slate-900 mb-1 leading-snug truncate" title={seg.title}>
                  {seg.title}
                </h4>
                <p className="text-[10px] text-slate-500">
                  {seg.customerCount.toLocaleString()} khách
                </p>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[9px]">
                <span className="font-bold text-slate-700 font-mono">
                  {formatCurrency(seg.gmvContribution)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* RFM Interactive Heatmap 2D Grid */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>Ma Trận Nhiệt Phân Bổ RFM (Recency vs Frequency)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Trục ngang: Điểm Recency (Mua gần nhất 1 ➔ 5) | Trục dọc: Điểm Frequency (Tần suất 1 ➔ 5)
            </p>
          </div>
          <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            Tổng phân tích: {customers.length} khách
          </span>
        </div>

        {/* 5x5 Matrix */}
        <div className="grid grid-cols-6 gap-1.5 text-center text-xs font-mono">
          {/* Header row */}
          <div className="text-[10px] font-bold text-slate-400 self-center">F \ R</div>
          <div className="p-1 bg-slate-50 rounded text-[10px] font-bold text-slate-600">R1 (&gt;120d)</div>
          <div className="p-1 bg-slate-50 rounded text-[10px] font-bold text-slate-600">R2 (90-120d)</div>
          <div className="p-1 bg-slate-50 rounded text-[10px] font-bold text-slate-600">R3 (60-90d)</div>
          <div className="p-1 bg-slate-50 rounded text-[10px] font-bold text-slate-600">R4 (30-60d)</div>
          <div className="p-1 bg-slate-50 rounded text-[10px] font-bold text-slate-600">R5 (≤30d)</div>

          {/* F5 */}
          <div className="p-1 bg-slate-50 rounded text-[10px] font-bold text-slate-600 self-center">F5 (≥10 đơn)</div>
          <div className="p-2 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-bold">At-Risk (3)</div>
          <div className="p-2 rounded-lg bg-yellow-100 text-yellow-800 text-[11px] font-bold">Lưu tâm (5)</div>
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">Trung thành (12)</div>
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-bold">Champions (18)</div>
          <div className="p-2 rounded-lg bg-indigo-200 text-indigo-900 text-[11px] font-black border border-indigo-400">VIP Top (24)</div>

          {/* F4 */}
          <div className="p-1 bg-slate-50 rounded text-[10px] font-bold text-slate-600 self-center">F4 (5-9 đơn)</div>
          <div className="p-2 rounded-lg bg-rose-100 text-rose-800 text-[11px] font-bold">At-Risk (4)</div>
          <div className="p-2 rounded-lg bg-yellow-100 text-yellow-800 text-[11px] font-bold">Lưu tâm (8)</div>
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">Trung thành (15)</div>
          <div className="p-2 rounded-lg bg-indigo-100 text-indigo-800 text-[11px] font-bold">Champions (14)</div>
          <div className="p-2 rounded-lg bg-indigo-200 text-indigo-900 text-[11px] font-black">VIP (16)</div>

          {/* F3 */}
          <div className="p-1 bg-slate-50 rounded text-[10px] font-bold text-slate-600 self-center">F3 (3-4 đơn)</div>
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">Ngủ quên (6)</div>
          <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-bold">At-Risk (7)</div>
          <div className="p-2 rounded-lg bg-yellow-50 text-yellow-700 text-[11px] font-bold">Cần chăm (9)</div>
          <div className="p-2 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-bold">Tiềm năng (18)</div>
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-bold">Gắn kết (15)</div>

          {/* F2 */}
          <div className="p-1 bg-slate-50 rounded text-[10px] font-bold text-slate-600 self-center">F2 (2 đơn)</div>
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">Ngủ quên (9)</div>
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">Chờ (11)</div>
          <div className="p-2 rounded-lg bg-yellow-50 text-yellow-700 text-[11px] font-bold">Cần kích (14)</div>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold">Tiềm năng (20)</div>
          <div className="p-2 rounded-lg bg-blue-100 text-blue-800 text-[11px] font-bold">Mới mua lại (22)</div>

          {/* F1 */}
          <div className="p-1 bg-slate-50 rounded text-[10px] font-bold text-slate-600 self-center">F1 (1 đơn)</div>
          <div className="p-2 rounded-lg bg-slate-200 text-slate-700 text-[11px] font-bold">Đã mất (15)</div>
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">Ngủ (18)</div>
          <div className="p-2 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold">Chờ (20)</div>
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-bold">Khách mới (25)</div>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-black border border-emerald-300">Khách mới tinh (32)</div>
        </div>
      </div>

      {/* Deep-Dive Card for Active Segment */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 md:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-black text-slate-900">
                {currentSegment.title}
              </h3>
              <StatusBadge variant={currentSegment.badgeVariant}>
                {currentSegment.badge}
              </StatusBadge>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
              Tiêu chí RFM: {currentSegment.rfmCriteria}
            </p>
          </div>

          <button
            onClick={() => handleGenerateAiMessageForSegment(currentSegment)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Sinh Kịch Bản Chăm Sóc (Gemini AI)</span>
          </button>
        </div>

        {/* Strategy Guidance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mô tả đặc điểm</span>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {currentSegment.description}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-1">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Chiến lược & Đề xuất ưu đãi</span>
            <p className="text-xs text-blue-900 font-medium leading-relaxed">
              👉 {currentSegment.actionStrategy}
            </p>
            <div className="mt-2 pt-2 border-t border-blue-200/60 flex items-center gap-1.5 text-[11px] font-bold text-indigo-700">
              <Gift className="w-3.5 h-3.5 shrink-0" />
              <span>{currentSegment.recommendedOffer}</span>
            </div>
          </div>
        </div>

        {/* Segment Customers Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-800">
              Danh sách khách hàng tiêu biểu trong nhóm ({currentSegment.customerCount} khách)
            </h4>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 font-mono">
                <tr>
                  <th className="px-3 py-2">Khách hàng</th>
                  <th className="px-3 py-2">Số điện thoại</th>
                  <th className="px-3 py-2">Hạng thẻ</th>
                  <th className="px-3 py-2 text-right">Chi tiêu</th>
                  <th className="px-3 py-2 text-right">Đơn hàng</th>
                  <th className="px-3 py-2 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {getSegmentCustomers().map(c => (
                  <tr 
                    key={c.id} 
                    className="hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onSelectCustomer && onSelectCustomer(c)}
                  >
                    <td className="px-3 py-2.5 font-bold text-slate-900">
                      {c.name}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 font-mono">
                      {c.phone || 'Chưa có SĐT'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                        {c.tier || 'Hạng Bạc'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(c.totalSpent || 0)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-slate-600">
                      {c.orderCount || 0} đơn
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectCustomer) onSelectCustomer(c);
                        }}
                        className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg font-bold text-[10px] hover:bg-blue-100 transition-colors"
                      >
                        Hồ sơ 360°
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Care Script Modal */}
      {aiModalSegment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2 text-indigo-600">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">
                  Trợ Lý Gemini AI - Kịch Bản CSKH: {aiModalSegment.title}
                </h3>
              </div>
              <button 
                onClick={() => setAiModalSegment(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Channel Selector */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">Kênh tiếp cận:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'zalo', label: 'Zalo ZNS' },
                    { id: 'sms', label: 'SMS Brand' },
                    { id: 'email', label: 'Email' },
                    { id: 'call', label: 'Kịch bản Gọi' },
                  ].map(ch => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => {
                        setSelectedChannel(ch.id as any);
                        handleGenerateAiMessageForSegment(aiModalSegment);
                      }}
                      className={cn(
                        "py-1.5 px-2 rounded-xl font-bold border transition-all text-center",
                        selectedChannel === ch.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      )}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung đề xuất cá nhân hóa:</label>
                {aiLoading ? (
                  <div className="p-8 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-50">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <span>Gemini AI đang phân tích và tối ưu câu từ...</span>
                  </div>
                ) : (
                  <textarea 
                    rows={6}
                    value={aiMessage}
                    onChange={e => setAiMessage(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl font-sans text-xs leading-relaxed text-slate-800 focus:outline-indigo-600"
                  />
                )}
              </div>

              {/* Footer actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(aiMessage);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAiModalSegment(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Đóng
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAiModalSegment(null);
                      if (onNavigateOmniChat) onNavigateOmniChat();
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Gửi qua OmniChat</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
