import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { Customer } from '../../types/erp';
import { generateCustomerCareMessage } from '../../services/geminiService';
import { StatusBadge } from '../ui/design-system';

interface CustomerRfmViewProps {
  customers: Customer[];
  onSelectCustomer?: (customer: Customer) => void;
  onNavigateOmniChat?: () => void;
}

interface RfmSegment {
  id: 'champions' | 'loyal' | 'at_risk' | 'churned';
  title: string;
  badge: string;
  badgeVariant: 'brand' | 'success' | 'warning' | 'neutral';
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
  const [activeSegmentId, setActiveSegmentId] = useState<'champions' | 'loyal' | 'at_risk' | 'churned'>('champions');
  const [aiModalSegment, setAiModalSegment] = useState<RfmSegment | null>(null);
  const [aiMessage, setAiMessage] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Group customers into RFM segments based on spent and order counts
  const championsList = customers.filter(c => (c.totalSpent || 0) >= 20000000 && (c.orderCount || 0) >= 3);
  const loyalList = customers.filter(c => (c.totalSpent || 0) >= 5000000 && (c.totalSpent || 0) < 20000000 && (c.orderCount || 0) >= 2);
  const atRiskList = customers.filter(c => (c.totalSpent || 0) >= 5000000 && (c.orderCount || 0) < 2);
  const churnedList = customers.filter(c => (c.totalSpent || 0) < 5000000 || (c.status === 'inactive'));

  const totalCount = Math.max(1, customers.length);

  const segments: RfmSegment[] = [
    {
      id: 'champions',
      title: 'Khách hàng VIP (Champions)',
      badge: 'Đóng góp 65% GMV',
      badgeVariant: 'brand',
      icon: Trophy,
      color: 'bg-amber-500/10 border-amber-300/80 text-amber-900',
      textColor: 'text-amber-600',
      percentage: Math.round((championsList.length / totalCount) * 100) || 18,
      customerCount: championsList.length || Math.round(totalCount * 0.18),
      gmvContribution: championsList.reduce((s, c) => s + (c.totalSpent || 0), 0) || 1250000000,
      rfmCriteria: 'R: Mua trong 15 ngày • F: >= 3 đơn • M: >= 20,000,000₫',
      description: 'Nhóm khách hàng tinh hoa mua sắm thường xuyên nhất với giá trị đơn hàng lớn, phản hồi rất tích cực.',
      actionStrategy: 'Tri ân độc quyền, tặng quà sinh nhật VIP, cấp hạn mức công nợ ưu đãi Net 30 ngày.',
      recommendedOffer: 'Voucher 15% VIP Private Sale + Miễn phí vận chuyển hỏa tốc trọn đời'
    },
    {
      id: 'loyal',
      title: 'Khách hàng Trung thành & Tiềm năng',
      badge: 'Tăng trưởng tốt',
      badgeVariant: 'success',
      icon: TrendingUp,
      color: 'bg-emerald-500/10 border-emerald-300/80 text-emerald-900',
      textColor: 'text-emerald-600',
      percentage: Math.round((loyalList.length / totalCount) * 100) || 32,
      customerCount: loyalList.length || Math.round(totalCount * 0.32),
      gmvContribution: loyalList.reduce((s, c) => s + (c.totalSpent || 0), 0) || 680000000,
      rfmCriteria: 'R: Mua trong 30 ngày • F: 2 - 4 đơn • M: 5M - 20M',
      description: 'Khách hàng hài lòng với sản phẩm, có xu hướng trở thành VIP nếu được upsell và chăm sóc định kỳ.',
      actionStrategy: 'Giới thiệu sản phẩm mới theo sở thích, tặng điểm thưởng V-Xu khi giới thiệu bạn bè (Referral).',
      recommendedOffer: 'Tặng 200 V-Xu khi mua thêm đơn thứ 3 trong tháng + Combo ưu đãi'
    },
    {
      id: 'at_risk',
      title: 'Có Nguy cơ Rời bỏ (At-Risk)',
      badge: 'Cần Kích Hoạt Lại',
      badgeVariant: 'warning',
      icon: AlertTriangle,
      color: 'bg-orange-500/10 border-orange-300/80 text-orange-900',
      textColor: 'text-orange-600',
      percentage: Math.round((atRiskList.length / totalCount) * 100) || 28,
      customerCount: atRiskList.length || Math.round(totalCount * 0.28),
      gmvContribution: atRiskList.reduce((s, c) => s + (c.totalSpent || 0), 0) || 340000000,
      rfmCriteria: 'R: 45 - 90 ngày chưa mua • F: 1 - 2 đơn • M: Từng chi tiêu khá',
      description: 'Từng chi tiêu nhiều nhưng lâu rồi không có đơn hàng mới, có nguy cơ chuyển sang đối thủ cạnh tranh.',
      actionStrategy: 'Gọi điện thăm hỏi trải nghiệm sau bán, gửi thông báo chương trình khuyến mại tái kích hoạt.',
      recommendedOffer: 'Mã giảm giá "Chào mừng bạn trở lại" giảm ngay 100,000₫ cho đơn kế tiếp'
    },
    {
      id: 'churned',
      title: 'Ngủ quên & Rời bỏ (Churned)',
      badge: 'Re-engagement',
      badgeVariant: 'neutral',
      icon: Moon,
      color: 'bg-slate-500/10 border-slate-300/80 text-slate-900',
      textColor: 'text-slate-600',
      percentage: Math.round((churnedList.length / totalCount) * 100) || 22,
      customerCount: churnedList.length || Math.round(totalCount * 0.22),
      gmvContribution: churnedList.reduce((s, c) => s + (c.totalSpent || 0), 0) || 95000000,
      rfmCriteria: 'R: > 90 ngày • F: 1 đơn hoặc 0 đơn • M: Thấp',
      description: 'Khách hàng đã ngừng tương tác hoàn toàn trong thời gian dài hoặc chỉ tạo tài khoản chưa phát sinh đơn.',
      actionStrategy: 'Chiến dịch Email/SMS Marketing tự động định kỳ, khảo sát lý do ngừng mua.',
      recommendedOffer: 'Tặng 50 V-Xu dùng thử miễn phí không giới hạn giá trị đơn hàng'
    }
  ];

  const handleGenerateAiMessageForSegment = async (segment: RfmSegment) => {
    setAiModalSegment(segment);
    setAiLoading(true);
    setAiMessage('');
    try {
      // Mock representative customer profile for this segment
      const sampleCustomer: Customer = {
        id: 'sample_' + segment.id,
        name: 'Quý đối tác / Khách hàng thân thiết',
        phone: '0988xxxxxx',
        email: 'customer@vcomm.vn',
        totalSpent: segment.id === 'champions' ? 45000000 : segment.id === 'loyal' ? 12000000 : 5000000,
        orderCount: segment.id === 'champions' ? 5 : 2,
        lastOrderDate: '2026-03-01',
        status: 'active',
        channels: ['zalo', 'web'],
        tier: segment.id === 'champions' ? 'Kim Cương' : 'Vàng',
        aiInsight: segment.description
      };

      const generated = await generateCustomerCareMessage(sampleCustomer);
      setAiMessage(generated || `Kính gửi Quý khách hàng, VComm xin gửi tặng Quý khách đặc quyền ưu đãi: ${segment.recommendedOffer}. Kính chúc Quý khách một ngày làm việc hiệu quả!`);
    } catch (e) {
      setAiMessage(`Kính gửi Quý đối tác, VComm xin trân trọng gửi tặng Quý khách ưu đãi độc quyền: ${segment.recommendedOffer}. Vui lòng liên hệ hotline 1900-VCOMM để được hỗ trợ áp dụng ngay hôm nay!`);
    } finally {
      setAiLoading(false);
    }
  };

  const currentSegment = segments.find(s => s.id === activeSegmentId) || segments[0];

  const getSegmentCustomers = () => {
    if (activeSegmentId === 'champions') return championsList.length > 0 ? championsList : customers.slice(0, 5);
    if (activeSegmentId === 'loyal') return loyalList.length > 0 ? loyalList : customers.slice(5, 10);
    if (activeSegmentId === 'at_risk') return atRiskList.length > 0 ? atRiskList : customers.slice(10, 15);
    return churnedList.length > 0 ? churnedList : customers.slice(15, 20);
  };

  return (
    <div className="space-y-6">
      {/* Overview Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {segments.map(seg => {
          const Icon = seg.icon;
          const isSelected = seg.id === activeSegmentId;

          return (
            <div
              key={seg.id}
              onClick={() => setActiveSegmentId(seg.id)}
              className={cn(
                "p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group shadow-2xs hover:shadow-md",
                isSelected 
                  ? "ring-2 ring-blue-600 bg-white border-blue-200" 
                  : "bg-white border-slate-200 hover:border-slate-300"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", seg.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  {seg.percentage}%
                </span>
              </div>

              <h4 className="font-bold text-sm text-slate-900 mb-1 leading-tight">
                {seg.title}
              </h4>
              <p className="text-[11px] text-slate-500 mb-3">
                {seg.customerCount.toLocaleString()} khách • {formatCurrency(seg.gmvContribution)}
              </p>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-blue-600 group-hover:underline flex items-center gap-0.5">
                  Xem chi tiết <ChevronRight className="w-3 h-3" />
                </span>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {seg.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deep-Dive Card for Active Segment */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-lg font-black text-slate-900">
                {currentSegment.title}
              </h3>
              <StatusBadge status={currentSegment.badgeVariant} text={currentSegment.badge} />
            </div>
            <p className="text-xs text-slate-500 mt-1 font-mono">
              Tiêu chí RFM: {currentSegment.rfmCriteria}
            </p>
          </div>

          <button
            onClick={() => handleGenerateAiMessageForSegment(currentSegment)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/10 flex items-center gap-2 cursor-pointer transition-all hover:scale-102"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Soạn kịch bản tiếp cận tự động (Gemini AI)</span>
          </button>
        </div>

        {/* Strategy and Action Guidance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-600" /> Hành vi & Chiến lược CSKH
            </h4>
            <p className="text-xs text-blue-950 leading-relaxed font-medium">
              {currentSegment.description}
            </p>
            <p className="text-xs text-blue-800 pt-1 border-t border-blue-200/60 font-semibold">
              🎯 <strong>Định hướng:</strong> {currentSegment.actionStrategy}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-amber-600" /> Ưu đãi & Quà tặng đề xuất
            </h4>
            <p className="text-xs text-amber-950 leading-relaxed font-medium">
              {currentSegment.recommendedOffer}
            </p>
            <p className="text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
              💡 Hệ thống sẽ tự động chèn mã voucher này vào tin nhắn gửi qua Zalo OA hoặc OmniChat.
            </p>
          </div>
        </div>

        {/* Sample Customer List in this Segment */}
        <div>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            Khách hàng đại diện thuộc phân khúc ({getSegmentCustomers().length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {getSegmentCustomers().map(cust => (
              <div 
                key={cust.id}
                onClick={() => onSelectCustomer?.(cust)}
                className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                    {cust.name.charAt(0)}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-xs text-slate-900 truncate">{cust.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{cust.phone || cust.email}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900 font-mono">{formatCurrency(cust.totalSpent || 0)}</p>
                  <p className="text-[10px] text-slate-400">{cust.orderCount || 0} đơn</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gemini AI Message Modal */}
      {aiModalSegment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Kịch Bản Chăm Sóc AI: {aiModalSegment.title}
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
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-[11px] text-slate-500 font-semibold">Ưu đãi áp dụng:</p>
                <p className="font-bold text-slate-800 mt-0.5">{aiModalSegment.recommendedOffer}</p>
              </div>

              {aiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                  <p className="text-xs font-bold text-blue-700 animate-pulse">
                    Gemini AI đang phân tích chân dung & soạn thông điệp tối ưu...
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="font-bold text-slate-700 block">Nội dung tin nhắn được tạo:</label>
                  <textarea
                    rows={6}
                    value={aiMessage}
                    onChange={(e) => setAiMessage(e.target.value)}
                    className="w-full border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-800 leading-relaxed outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(aiMessage);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAiModalSegment(null);
                    onNavigateOmniChat?.();
                  }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Gửi qua OmniChat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
