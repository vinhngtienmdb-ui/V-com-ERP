import React, { useState } from 'react';
import { 
  Trophy, 
  Gift, 
  Star, 
  Crown, 
  UserCheck, 
  Coins, 
  ArrowRight, 
  Zap, 
  Gem, 
  Search, 
  Filter, 
  Heart,
  ChevronRight,
  MoreVertical,
  Clock,
  RotateCcw,
  CheckCircle2,
  Play
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { LoyaltyProgram } from '../types/erp';

const MOCK_LOYALTY: LoyaltyProgram[] = [
  { id: '1', tier: 'diamond', points: 15400, privileges: ['Hoàn tiền 5%', 'Miễn phí vận chuyển hỏa tốc', 'Hỗ trợ 24/7 Priority'] },
  { id: '2', tier: 'gold', points: 8200, privileges: ['Hoàn tiền 3%', 'Voucher sinh nhật 500k'] },
  { id: '3', tier: 'silver', points: 2400, privileges: ['Voucher ưu đãi 10%'] },
];

export function LoyaltyManagement() {
  const [activeTab, setActiveTab] = useState<'tiers' | 'missions' | 'gamification'>('tiers');

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Loyalty & Gamification</h1>
          <p className="text-sm text-[#6B7280] mt-1">Quản lý hạng thành viên, nhiệm vụ hàng ngày và hệ thống vòng quay may mắn.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Cấu hình Đổi quà
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm">
            Tạo Chiến dịch tích điểm
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm relative overflow-hidden">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1 relative z-10">Thành viên Diamond</p>
           <div className="text-2xl font-bold text-[#111827] relative z-10">1,245</div>
           <p className="text-[10px] text-[#10B981] font-medium mt-1 relative z-10">+42 trong tuần này</p>
           <Crown className="absolute -bottom-2 -right-2 w-16 h-16 text-blue-50/50 -rotate-12" />
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Tổng điểm đang lưu hành</p>
           <div className="text-2xl font-bold text-[#2563EB]">15.4M</div>
           <p className="text-[10px] text-[#6B7280] mt-1">Giá trị quy đổi ~ 1.5 tỷ VNĐ</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Tỷ lệ đổi quà (Redemption Rate)</p>
           <div className="text-2xl font-bold text-[#111827]">24.5%</div>
           <p className="text-[10px] text-[#10B981] font-medium mt-1">Tăng 5% so với tháng trước</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <p className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest mb-1">Retention Boosters</p>
           <div className="text-2xl font-bold text-[#8B5CF6]">8,450</div>
           <p className="text-[10px] text-[#6B7280] mt-1">Daily Check-in active users</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
         <div className="flex border-b border-[#F3F4F6]">
            {[
              { id: 'tiers', label: 'Hạng thành viên & Đặc quyền', icon: Crown },
              { id: 'missions', label: 'Nhiệm vụ hàng ngày', icon: Zap },
              { id: 'gamification', label: 'Vòng quay & Games', icon: RotateCcw }
            ].map((tab) => (
              <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={cn(
                   "px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
                   activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-blue-50/30" : "border-transparent text-[#6B7280] hover:text-[#111827]"
                 )}
              >
                 <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
         </div>

         <div className="p-6">
            {activeTab === 'tiers' && (
               <div className="space-y-4 animate-in fade-in duration-300">
                  {MOCK_LOYALTY.map(tier => (
                    <div key={tier.id} className={cn(
                      "p-5 rounded-lg border transition-all flex justify-between items-center group",
                      tier.tier === 'diamond' ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-[#E5E7EB] text-[#111827]"
                    )}>
                       <div className="flex items-center gap-4">
                          <div className={cn(
                            "p-3 rounded-xl",
                            tier.tier === 'diamond' ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20" : 
                            tier.tier === 'gold' ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-600"
                          )}>
                             {tier.tier === 'diamond' ? <Gem className="w-6 h-6" /> : <Star className="w-6 h-6" />}
                          </div>
                          <div className="space-y-1">
                             <h4 className="font-bold uppercase tracking-widest text-xs italic">{tier.tier} tier</h4>
                             <p className={cn("text-[10px] font-bold", tier.tier === 'diamond' ? "text-blue-400" : "text-slate-400")}>Hơn {tier.points.toLocaleString()} points</p>
                          </div>
                       </div>
                       <div className="flex flex-wrap gap-2 max-w-sm justify-end">
                          {tier.privileges.map((p, i) => (
                             <span key={i} className={cn(
                               "px-2 py-0.5 rounded text-[9px] font-bold uppercase",
                               tier.tier === 'diamond' ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-500"
                             )}>{p}</span>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            )}

            {activeTab === 'missions' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                  {[
                    { title: 'Điểm danh 7 ngày liên tiếp', reward: '500 Pts + Voucher 50k', progress: 40, status: 'doing' },
                    { title: 'Mua sắm đơn hàng từ 1tr', reward: 'X2 Points', progress: 100, status: 'done' },
                    { title: 'Chia sẻ sản phẩm lên Facebook', reward: '100 Pts / lượt', progress: 60, status: 'doing' },
                    { title: 'Đánh giá sản phẩm kèm ảnh', reward: '200 Pts', progress: 0, status: 'upcoming' },
                  ].map((task, i) => (
                    <div key={i} className="p-5 border border-[#E5E7EB] rounded-lg space-y-4 hover:border-[#2563EB] transition-all">
                       <div className="flex justify-between items-start">
                          <div>
                             <h4 className="text-sm font-bold text-[#111827]">{task.title}</h4>
                             <p className="text-[10px] font-bold text-[#2563EB] uppercase mt-0.5">Thưởng: {task.reward}</p>
                          </div>
                          {task.status === 'done' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Clock className="w-5 h-5 text-slate-300" />}
                       </div>
                       <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold">
                             <span className="text-slate-500">Tiến độ</span>
                             <span className="text-slate-900">{task.progress}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-[#2563EB] rounded-full" style={{ width: `${task.progress}%` }} />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            )}

            {activeTab === 'gamification' && (
               <div className="flex flex-col md:flex-row gap-8 items-center justify-center py-8 animate-in fade-in duration-300">
                  <div className="relative w-64 h-64 rounded-full border-8 border-slate-900 flex items-center justify-center bg-slate-50">
                     <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-1 bg-slate-900 absolute rotate-45" />
                        <div className="w-full h-1 bg-slate-900 absolute -rotate-45" />
                        <div className="w-full h-1 bg-slate-900 absolute rotate-0" />
                        <div className="w-full h-1 bg-slate-900 absolute rotate-90" />
                     </div>
                     <div className="w-12 h-12 bg-red-600 rounded-full border-4 border-white z-10 shadow-lg flex items-center justify-center">
                        <Play className="w-5 h-5 text-white fill-current" />
                     </div>
                     <div className="absolute top-0 -translate-y-6 flex flex-col items-center">
                        <div className="w-4 h-6 bg-red-600 rounded-b-full shadow-md" />
                     </div>
                  </div>
                  <div className="space-y-4 max-w-sm">
                     <h3 className="text-xl font-bold italic text-[#111827]">Vòng quay may mắn (Lucky Spin)</h3>
                     <p className="text-xs text-slate-500 leading-relaxed">Cấu hình tỷ lệ trúng thưởng cho từng ô (Voucher, Xu, Quà hiện vật). Hệ thống tự động khấu trừ lượt quay từ số dư "Lượt quay" của người dùng thu thập qua Nhiệm vụ hàng ngày.</p>
                     <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600">
                           <span>Giải đặc biệt: iPhone 15 PM</span>
                           <span>Tỷ lệ: 0.01%</span>
                        </div>
                        <div className="flex justify-between text-[10px] font-bold text-slate-600">
                           <span>Voucher 20k</span>
                           <span>Tỷ lệ: 45.0%</span>
                        </div>
                     </div>
                     <button className="w-full bg-[#111827] text-white font-bold py-3 rounded-xl text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Cấu hình Tỷ lệ trúng thưởng
                     </button>
                  </div>
               </div>
            )}
         </div>
      </div>

      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-8 rounded-lg flex flex-col items-center text-center space-y-4">
         <div className="p-3 bg-white/10 rounded-lg border border-white/20">
            <Trophy className="w-8 h-8 text-purple-300" />
         </div>
         <h3 className="text-xl font-bold italic">Retention & Engagement Engine</h3>
         <p className="text-slate-400 text-sm max-w-2xl">
            Sử dụng Gamification để biến việc mua sắm thành các thử thách đầy thú vị. Tự động thông báo nhiệm vụ mới qua Push Notification để kéo người dùng quay lại App ngay khi họ có dấu hiệu "ngủ đông".
         </p>
         <button className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-slate-100 transition-all shadow-lg text-sm flex items-center gap-2">
            Phân tích Cohort Retention <ArrowRight className="w-4 h-4" />
         </button>
      </div>
    </div>
  );
}
