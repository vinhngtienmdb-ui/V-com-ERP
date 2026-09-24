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
  Edit2
} from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

export function CustomerLoyaltyConfigView() {
  const [activeSubTab, setActiveSubTab] = useState<'tiers' | 'points' | 'sources'>('tiers');

  const [tiers, setTiers] = useState([
    { id: 'silver', name: 'Hạng Bạc (Member)', minSpend: 0, discount: 0, iconColor: 'text-slate-400 bg-slate-100', perks: ['Tích điểm 1% trên mỗi đơn hàng', 'Quà sinh nhật voucher 50k'] },
    { id: 'gold', name: 'Hạng Vàng (Gold VIP)', minSpend: 10000000, discount: 5, iconColor: 'text-amber-500 bg-amber-50', perks: ['Chiết khấu trực tiếp 5% toàn bộ đơn hàng', 'Tích điểm x1.5 lần', 'Ưu tiên giao vận hỏa tốc'] },
    { id: 'platinum', name: 'Hạng Bạch Kim (Platinum)', minSpend: 30000000, discount: 8, iconColor: 'text-cyan-600 bg-cyan-50', perks: ['Chiết khấu 8% đơn hàng', 'Tích điểm x2 lần', 'Miễn phí đổi trả 30 ngày'] },
    { id: 'diamond', name: 'Hạng Kim Cương (Diamond)', minSpend: 50000000, discount: 12, iconColor: 'text-indigo-600 bg-indigo-50', perks: ['Chiết khấu 12% tối đa', 'Tặng vé sự kiện Private Sale', 'Dedicated Account Manager 24/7'] },
  ]);

  const [pointRatio, setPointRatio] = useState(100000); // 100k
  const [pointEarned, setPointEarned] = useState(10); // 10 V-Xu
  const [pointValue, setPointValue] = useState(1000); // 1 V-Xu = 1000đ
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePoints = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Subtab Navigation */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-1.5 w-fit">
        {[
          { id: 'tiers', label: 'Hạng Thành Viên', icon: Trophy },
          { id: 'points', label: 'Tỉ Lệ Tích Điểm V-Xu', icon: Coins },
          { id: 'sources', label: 'Nguồn Dữ Liệu & Webhooks', icon: Globe },
        ].map(t => {
          const Icon = t.icon;
          const isSelected = activeSubTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveSubTab(t.id as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer",
                isSelected
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab 1: TIERS */}
      {activeSubTab === 'tiers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Danh Sách Hạng Thành Viên & Đặc Quyền</h3>
              <p className="text-xs text-slate-500 mt-0.5">Khách hàng được tự động nâng hạng khi tổng chi tiêu tích lũy đạt ngưỡng.</p>
            </div>
            <button className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm hạng mới</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map(t => (
              <div key={t.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200/60", t.iconColor)}>
                      <Trophy className="w-5 h-5" />
                    </div>
                    {t.discount > 0 ? (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold">
                        Giảm {t.discount}%
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                        Cơ bản
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-sm text-slate-900">{t.name}</h4>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    Chi tiêu từ: <strong className="text-slate-900">{formatCurrency(t.minSpend)}</strong>
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <p className="text-[11px] font-bold text-slate-700">Đặc quyền hội viên:</p>
                    {t.perks.map((p, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-slate-600 text-[11px]">
                        <Check className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{p}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer mt-4">
                  Chỉnh sửa quyền lợi
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: POINTS */}
      {activeSubTab === 'points' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-2xs max-w-2xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900">Cấu Hình Quy Đổi Điểm Thưởng V-Xu</h3>
            <p className="text-xs text-slate-500 mt-1">
              Đồng bộ chính sách tích điểm chung trên toàn sàn TMĐT, quầy POS nhà hàng và cổng thanh toán.
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
                  className="flex-1 border border-slate-300 rounded-xl px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="font-bold text-slate-600 text-sm">=</span>
                <div className="flex items-center gap-1.5 border border-slate-300 rounded-xl px-3 py-2.5 bg-slate-50">
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
                  className="w-48 border border-slate-300 rounded-xl px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <span className="font-bold text-slate-700">VNĐ trừ vào đơn hàng</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
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

      {/* Subtab 3: SOURCES */}
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
    </div>
  );
}
