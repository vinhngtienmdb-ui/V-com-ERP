import React, { useState } from 'react';
import { 
  Trophy, 
  Coins, 
  Globe, 
  Settings, 
  Check, 
  Plus, 
  ShieldCheck, 
  Percent, 
  Smartphone,
  ExternalLink,
  Edit2,
  Sparkles,
  CreditCard,
  Calculator,
  Gift,
  X
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

export interface LoyaltyTier {
  id: string;
  name: string;
  minSpend: number;
  discount: number;
  multiplier: number;
  cardTheme: {
    bg: string;
    border: string;
    text: string;
    badge: string;
    chip: string;
  };
  perks: string[];
}

const DEFAULT_TIERS: LoyaltyTier[] = [
  { 
    id: 'silver', 
    name: 'Hạng Bạc (Member)', 
    minSpend: 0, 
    discount: 0, 
    multiplier: 1.0,
    cardTheme: {
      bg: 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900',
      border: 'border-slate-600',
      text: 'text-slate-100',
      badge: 'bg-slate-700/80 text-slate-200 border-slate-500',
      chip: 'bg-amber-300'
    },
    perks: ['Tích điểm 1% trên mỗi đơn hàng', 'Quà sinh nhật voucher 50.000đ', 'Nhận thông báo Flash Sale sớm'] 
  },
  { 
    id: 'gold', 
    name: 'Hạng Vàng (Gold VIP)', 
    minSpend: 10000000, 
    discount: 5, 
    multiplier: 1.5,
    cardTheme: {
      bg: 'bg-gradient-to-br from-amber-600 via-yellow-700 to-amber-900',
      border: 'border-amber-400',
      text: 'text-amber-50',
      badge: 'bg-amber-500/80 text-amber-100 border-amber-300',
      chip: 'bg-yellow-200'
    },
    perks: ['Chiết khấu trực tiếp 5% toàn bộ đơn hàng', 'Tích điểm x1.5 lần', 'Ưu tiên giao vận hỏa tốc', 'Voucher sinh nhật 200.000đ'] 
  },
  { 
    id: 'platinum', 
    name: 'Hạng Bạch Kim (Platinum)', 
    minSpend: 30000000, 
    discount: 8, 
    multiplier: 2.0,
    cardTheme: {
      bg: 'bg-gradient-to-br from-cyan-800 via-blue-900 to-slate-950',
      border: 'border-cyan-400',
      text: 'text-cyan-50',
      badge: 'bg-cyan-500/80 text-cyan-100 border-cyan-300',
      chip: 'bg-cyan-200'
    },
    perks: ['Chiết khấu 8% đơn hàng', 'Tích điểm x2 lần', 'Miễn phí đổi trả 30 ngày', 'Dedicated Account Manager B2B'] 
  },
  { 
    id: 'diamond', 
    name: 'Hạng Kim Cương (Diamond Black)', 
    minSpend: 50000000, 
    discount: 12, 
    multiplier: 3.0,
    cardTheme: {
      bg: 'bg-gradient-to-br from-purple-900 via-indigo-950 to-black',
      border: 'border-purple-400',
      text: 'text-purple-50',
      badge: 'bg-purple-600/90 text-purple-100 border-purple-300',
      chip: 'bg-purple-200'
    },
    perks: ['Chiết khấu 12% tối đa', 'Tích điểm x3 lần', 'Vé sự kiện Private Sale VIP', 'Hỗ trợ công nợ ưu đãi Net 45 ngày'] 
  },
];

export function CustomerLoyaltyConfigView() {
  const [activeSubTab, setActiveSubTab] = useState<'tiers' | 'points' | 'calculator' | 'sources'>('tiers');
  const [tiers, setTiers] = useState<LoyaltyTier[]>(DEFAULT_TIERS);

  const [pointRatio, setPointRatio] = useState(100000); // 100k
  const [pointEarned, setPointEarned] = useState(10); // 10 V-Xu
  const [pointValue, setPointValue] = useState(1000); // 1 V-Xu = 1000đ
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Calculator state
  const [calcAmount, setCalcAmount] = useState<number>(5000000);

  // Edit / Add tier modal
  const [editingTier, setEditingTier] = useState<LoyaltyTier | null>(null);

  const handleSavePoints = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleUpdateTier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTier) return;
    setTiers(prev => prev.map(t => t.id === editingTier.id ? editingTier : t));
    setEditingTier(null);
  };

  return (
    <div className="space-y-4">
      {/* Subtab Navigation */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1.5 w-fit">
        {[
          { id: 'tiers', label: 'Hạng Thành Viên & Thẻ VIP', icon: Trophy },
          { id: 'points', label: 'Tỉ Lệ Tích Điểm V-Xu', icon: Coins },
          { id: 'calculator', label: 'Mô Phỏng Lợi Ích Mua Sắm', icon: Calculator },
          { id: 'sources', label: 'Nguồn & Kênh Đồng Bộ', icon: Globe },
        ].map(t => {
          const Icon = t.icon;
          const isSelected = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as any)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                isSelected
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab 1: TIERS & 3D VIP CARDS */}
      {activeSubTab === 'tiers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
            <div>
              <h3 className="font-bold text-xs text-slate-900">Danh Sách Hạng Thành Viên & Thẻ VIP Ảo</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Khách hàng được tự động nâng hạng khi chi tiêu tích lũy hoặc số đơn hàng đạt mốc quy định.</p>
            </div>
            <button 
              onClick={() => {
                setEditingTier({
                  id: 'tier_' + Date.now(),
                  name: 'Hạng Mới',
                  minSpend: 20000000,
                  discount: 6,
                  multiplier: 1.8,
                  cardTheme: {
                    bg: 'bg-gradient-to-br from-emerald-800 to-teal-950',
                    border: 'border-emerald-400',
                    text: 'text-emerald-50',
                    badge: 'bg-emerald-600/80 text-emerald-100 border-emerald-300',
                    chip: 'bg-emerald-200'
                  },
                  perks: ['Đặc quyền theo quy định']
                });
              }}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm hạng mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map(t => (
              <div 
                key={t.id} 
                className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <div>
                  {/* Virtual Card Preview Mockup */}
                  <div className={cn(
                    "rounded-2xl p-4 shadow-lg border relative overflow-hidden aspect-[1.586/1] flex flex-col justify-between mb-4 group-hover:scale-[1.02] transition-transform",
                    t.cardTheme.bg,
                    t.cardTheme.border,
                    t.cardTheme.text
                  )}>
                    {/* Background glow & mesh */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex justify-between items-start z-10">
                      <div>
                        <span className="text-[10px] font-bold tracking-widest uppercase opacity-80">VCOMM VIP CLUB</span>
                        <h4 className="font-black text-sm tracking-tight">{t.name}</h4>
                      </div>
                      <div className={cn("px-2 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider", t.cardTheme.badge)}>
                        {t.discount > 0 ? `Giảm ${t.discount}%` : 'Standard'}
                      </div>
                    </div>

                    {/* Chip & NFC symbol */}
                    <div className="flex items-center gap-2 z-10">
                      <div className={cn("w-7 h-5 rounded-md border border-black/20 shadow-xs", t.cardTheme.chip)} />
                      <div className="text-[10px] opacity-60 font-mono tracking-widest">•••• 8899</div>
                    </div>

                    {/* Card Footer */}
                    <div className="flex justify-between items-end text-[10px] z-10 opacity-90">
                      <div>
                        <p className="text-[8px] uppercase tracking-wider opacity-70">Thành viên</p>
                        <p className="font-bold tracking-wide">QUÝ KHÁCH HÀNG</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] uppercase tracking-wider opacity-70">Hệ số tích điểm</p>
                        <p className="font-bold font-mono">x{t.multiplier} V-Xu</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-slate-500 font-mono">
                      Ngưỡng chi tiêu: <strong className="text-slate-900">{formatCurrency(t.minSpend)}</strong>
                    </p>
                  </div>

                  {/* Perks list */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <p className="text-[11px] font-bold text-slate-700">Đặc quyền hội viên:</p>
                    {t.perks.map((p, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-600 text-[11px]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setEditingTier(t)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer mt-4 flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Chỉnh sửa đặc quyền</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: POINTS CONFIG */}
      {activeSubTab === 'points' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-2xs max-w-2xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900">Cấu Hình Quy Đổi Điểm Thưởng V-Xu</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Đồng bộ chính sách tích điểm trên toàn sàn TMĐT, ứng dụng POS bán lẻ và cổng thanh toán VietQR.
            </p>
          </div>

          <form onSubmit={handleSavePoints} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tỷ lệ tích điểm: Cứ mỗi chi tiêu (VNĐ)
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  value={pointRatio}
                  onChange={(e) => setPointRatio(Number(e.target.value))}
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="font-bold text-slate-600 text-sm">=</span>
                <div className="flex items-center gap-1.5 border border-slate-300 rounded-xl px-3 py-2 bg-slate-50">
                  <input 
                    type="number"
                    value={pointEarned}
                    onChange={(e) => setPointEarned(Number(e.target.value))}
                    className="w-16 bg-transparent font-bold text-sm text-center font-mono outline-none text-amber-600"
                  />
                  <span className="font-bold text-slate-700">V-Xu</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                (Hiện tại: {formatCurrency(pointRatio)} được tích {pointEarned} V-Xu ~ tương đương hoàn tiền {((pointEarned * pointValue) / pointRatio * 100).toFixed(1)}%)
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <label className="font-bold text-slate-700 block mb-1">
                Giá trị quy đổi tiêu điểm: 1 V-Xu bằng
              </label>
              <div className="flex items-center gap-2">
                <input 
                  type="number"
                  value={pointValue}
                  onChange={(e) => setPointValue(Number(e.target.value))}
                  className="w-48 border border-slate-300 rounded-xl px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="font-bold text-slate-700">VNĐ trừ vào đơn hàng</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Lưu cấu hình tích điểm
              </button>
              {savedSuccess && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> Đã cập nhật thành công!
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Subtab 3: CALCULATOR */}
      {activeSubTab === 'calculator' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-2xs max-w-3xl space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-indigo-600" />
              <span>Mô Phỏng Lợi Ích & Chiết Khấu Theo Hạng Thẻ</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhập giá trị đơn hàng bất kỳ để kiểm tra mức chiết khấu và điểm tích lũy V-Xu cho từng phân hạng.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="font-bold text-slate-700 text-xs block mb-1">
                Giả lập giá trị đơn hàng (VNĐ):
              </label>
              <div className="flex items-center gap-3">
                <input 
                  type="number"
                  step="500000"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(Math.max(0, Number(e.target.value)))}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-bold text-slate-900 focus:outline-blue-600"
                />
                <span className="font-bold text-slate-700 font-mono text-base">
                  {formatCurrency(calcAmount)}
                </span>
              </div>
            </div>

            {/* Comparison Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 uppercase text-[10px] font-bold text-slate-500 font-mono border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Hạng Thẻ</th>
                    <th className="px-4 py-3 text-right">Chiết Khấu (%)</th>
                    <th className="px-4 py-3 text-right">Tiết Kiệm Trực Tiếp</th>
                    <th className="px-4 py-3 text-right">V-Xu Tích Lũy</th>
                    <th className="px-4 py-3 text-right">Giá Sau Giảm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tiers.map(t => {
                    const discountVal = Math.round((calcAmount * t.discount) / 100);
                    const finalPrice = calcAmount - discountVal;
                    const xuEarned = Math.round((calcAmount / pointRatio) * pointEarned * t.multiplier);

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <Trophy className={cn("w-4 h-4", t.id === 'diamond' ? "text-purple-600" : t.id === 'platinum' ? "text-cyan-600" : t.id === 'gold' ? "text-amber-500" : "text-slate-400")} />
                          <span>{t.name}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-700">
                          {t.discount}%
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-600">
                          -{formatCurrency(discountVal)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-amber-600">
                          +{xuEarned.toLocaleString()} V-Xu
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-black text-emerald-600">
                          {formatCurrency(finalPrice)}
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

      {/* Subtab 4: SOURCES */}
      {activeSubTab === 'sources' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-slate-900">Zalo Official Account (OA)</h4>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">Đang hoạt động</span>
              </div>
              <p className="text-xs text-slate-600">Tự động đồng bộ số điện thoại và hội thoại tư vấn khi khách nhắn tin Zalo OA.</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-slate-500">Đã sync: <strong>1,840 leads</strong></span>
                <span className="text-blue-600 font-bold hover:underline cursor-pointer">Cấu hình Webhook</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-slate-900">Facebook Shop & Messenger</h4>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">Đang hoạt động</span>
              </div>
              <p className="text-xs text-slate-600">Đồng bộ qua Meta Graph API v19.0. Tự động thu thập lead từ bình luận và inbox.</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-slate-500">Đã sync: <strong>3,250 leads</strong></span>
                <span className="text-blue-600 font-bold hover:underline cursor-pointer">Cấu hình API</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-bold text-sm text-slate-900">Website Storefront (shop.vcomm.vn)</h4>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md">Đang hoạt động</span>
              </div>
              <p className="text-xs text-slate-600">Khách hàng đăng ký tài khoản hoặc đặt hàng tự động đồng bộ theo thời gian thực.</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs">
                <span className="text-slate-500">Đã sync: <strong>4,920 leads</strong></span>
                <span className="text-blue-600 font-bold hover:underline cursor-pointer">Xem Analytics</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tier Modal */}
      {editingTier && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">Chỉnh Sửa Hạng Thẻ: {editingTier.name}</h3>
              </div>
              <button 
                onClick={() => setEditingTier(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTier} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên hạng thẻ:</label>
                <input 
                  type="text"
                  required
                  value={editingTier.name}
                  onChange={e => setEditingTier({ ...editingTier, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chi tiêu tối thiểu (VNĐ):</label>
                  <input 
                    type="number"
                    min="0"
                    step="1000000"
                    value={editingTier.minSpend}
                    onChange={e => setEditingTier({ ...editingTier, minSpend: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono focus:outline-blue-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chiết khấu (%):</label>
                  <input 
                    type="number"
                    min="0"
                    max="100"
                    value={editingTier.discount}
                    onChange={e => setEditingTier({ ...editingTier, discount: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono focus:outline-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Hệ số tích điểm (Multiplier):</label>
                <input 
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={editingTier.multiplier}
                  onChange={e => setEditingTier({ ...editingTier, multiplier: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium font-mono focus:outline-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTier(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
