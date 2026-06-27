import React, { useState } from 'react';
import { sendZnsNotification } from '../services/znsService';
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
 Play,
 Sparkles,
 ArrowUpRight,
 Ticket,
 Flame,
 LayoutGrid,
 Settings2,
 Smartphone
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { LoyaltyProgram } from '../types/erp';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_LOYALTY: (LoyaltyProgram & { color: string; textColor: string; nextTierPoints: number })[] = [
 { 
 id: '1', 
 tier: 'diamond', 
 points: 15400, 
 privileges: ['Hoàn tiền 5% không giới hạn', 'Miễu phí vận chuyển hỏa tốc toàn quốc', 'Đặc quyền phòng chờ VIP', 'Hỗ trợ 24/7 Priority'],
 color: 'bg-slate-900',
 textColor: 'text-orange-500',
 nextTierPoints: 20000
 },
 { 
 id: '2', 
 tier: 'gold', 
 points: 8200, 
 privileges: ['Hoàn tiền 3%', 'Voucher sinh nhật 1.000.000đ', 'Phòng thử đồ riêng'],
 color: 'bg-amber-600',
 textColor: 'text-amber-100',
 nextTierPoints: 15000
 },
 { 
 id: '3', 
 tier: 'silver', 
 points: 2400, 
 privileges: ['Voucher ưu đãi 10%', 'Tích điểm x1.2'],
 color: 'bg-slate-600',
 textColor: 'text-slate-300',
 nextTierPoints: 5000
 },
];

const REWARDS = [
 { id: 'R1', title: 'Voucher 200k All Stores', points: 2000, type: 'voucher', stock: 45 },
 { id: 'R2', title: 'Bình nước giữ nhiệt VCOMM', points: 5000, type: 'item', stock: 12 },
 { id: 'R3', title: 'Thẻ Starbucks 100k', points: 1500, type: 'giftcard', stock: 88 },
];

export function LoyaltyManagement() {
 const [activeTab, setActiveTab] = useState<'tiers' | 'missions' | 'rewards' | 'gamification'>('tiers');
 const [vipMembers, setVipMembers] = useState([
  { id: 'M-001', name: 'Nguyễn Bích Phương', phone: '0987654321', tier: 'Bạc', points: 2400, birthday: '03/06' },
  { id: 'M-002', name: 'Phạm Minh Chính', phone: '0912345678', tier: 'Vàng', points: 8200, birthday: '12/10' },
  { id: 'M-003', name: 'Lê Thùy Trang', phone: '0977889900', tier: 'Kim cương', points: 15400, birthday: '05/09' }
 ]);

 const handleRankUp = (memberId: string) => {
  setVipMembers(prev => prev.map(m => {
    if (m.id === memberId) {
      let nextTier = '';
      let voucher = '';
      if (m.tier === 'Bạc') {
        nextTier = 'Vàng';
        voucher = 'GOLD2026';
      } else if (m.tier === 'Vàng') {
        nextTier = 'Kim cương';
        voucher = 'DIAMOND2026';
      } else {
        alert('Khách hàng đã đạt hạng cao nhất!');
        return m;
      }
      
      sendZnsNotification(m.phone, 'ZNS_LOYALTY_RANK_UP', {
        'Tên_Khách_Hàng': m.name,
        'Hạng_Mới': nextTier,
        'Mã_Voucher': voucher
      }, {
        customerName: m.name
      });
      
      alert("Đã thăng hạng " + m.name + " lên " + nextTier + " và tự động gửi tin nhắn Zalo ZNS thông báo thăng hạng!");
      return { ...m, tier: nextTier, points: m.points + 5000 };
    }
    return m;
  }));
 };

 const handleSendBirthdayMsg = (member: any) => {
  sendZnsNotification(member.phone, 'ZNS_LOYALTY_BIRTHDAY', {
    'Tên_Khách_Hàng': member.name,
    'Trị_Giá_Quà': 'Voucher 500.000đ'
  }, {
    customerName: member.name
  });
  alert("Đã gửi Zalo ZNS chúc mừng sinh nhật tới khách hàng " + member.name + " thành công!");
 };

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Loyalty & Club Prestige</h1>
 <p className="text-sm text-[#6B7280] mt-1">Hệ thống thành viên, Phần thưởng và Gamification tăng trưởng tỷ lệ quay lại.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Settings2 className="w-4 h-4 text-slate-500" />
 Cấu hình Điểm
 </button>
 <button className="bg-[#111827] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Trophy className="w-4 h-4 text-yellow-400" /> Chiến dịch Thưởng Điểm
 </button>
 </div>
 </div>

 {/* Hero Stats */}
 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
 {[
 { label: 'Thành viên Diamond', value: '1,245', sub: '+42 tuần này', icon: Crown, color: 'text-orange-700', bg: 'bg-slate-100' },
 { label: 'Points lưu hành', value: '15.4M', sub: '~ 1.5 tỷ VNĐ', icon: Coins, color: 'text-amber-600', bg: 'bg-amber-50' },
 { label: 'Redemption Rate', value: '24.5%', sub: '+5% tháng trước', icon: RotateCcw, color: 'text-emerald-600', bg: 'bg-emerald-50' },
 { label: 'Retention Boost', value: '8,450', sub: 'Daily active users', icon: Zap, color: 'text-purple-600', bg: 'bg-purple-50' },
 ].map((stat, i) => (
 <div key={i} className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-start gap-4">
 <div className={cn("p-3 rounded-lg", stat.bg)}>
 <stat.icon className={cn("w-5 h-5", stat.color)} />
 </div>
 <div>
 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
 <h3 className="text-xl font-bold text-slate-900 mt-0.5">{stat.value}</h3>
 <p className={cn("text-[10px] font-bold mt-1", stat.sub.includes('+') ? "text-emerald-600" : "text-slate-500")}>{stat.sub}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden min-h-[500px]">
 <div className="flex border-b border-slate-200 bg-slate-50/50 p-1">
 {[
 { id: 'tiers', label: 'Hạng thành viên', icon: Crown },
 { id: 'missions', label: 'Nhiệm vụ hàng ngày', icon: Zap },
 { id: 'rewards', label: 'Đổi quà (Shop)', icon: Gift },
 { id: 'gamification', label: 'Vòng quay & Games', icon: RotateCcw }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "flex-1 px-4 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2",
 activeTab === tab.id ? "bg-white text-orange-700 shadow-sm" : "text-slate-600 hover:text-slate-800"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 <div className="p-6">
 <AnimatePresence mode="wait">
 {activeTab === 'tiers' && (
  <>
  <motion.div 
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 1.05 }}
  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
  >
  {MOCK_LOYALTY.map(tier => (
  <div key={tier.id} className={cn(
  "relative h-[450px] rounded-lg p-6 flex flex-col justify-between overflow-hidden group shadow-sm transition-transform ",
  tier.color
  )}>
  {/* Background pattern */}
  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
  {tier.tier === 'diamond' ? <Gem className="w-48 h-48 rotate-12" /> : <Star className="w-48 h-48 rotate-12" />}
  </div>
  
  <div className="relative z-10">
  <div className="flex justify-between items-start">
  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center">
  {tier.tier === 'diamond' ? <Gem className="w-6 h-6 text-[#FAF9F5]" /> : <Star className="w-6 h-6 text-[#FAF9F5]" />}
  </div>
  <div className="text-right">
  <p className="text-[10px] font-bold text-[#FAF9F5]/60 uppercase tracking-widest">Available Points</p>
  <p className="text-xl font-bold text-[#FAF9F5]">{tier.points.toLocaleString()}</p>
  </div>
  </div>
  
  <div className="mt-8">
  <h4 className="text-2xl font-black italic uppercase tracking-tighter text-[#FAF9F5]">{tier.tier.toUpperCase()} CLUB</h4>
  <p className={cn("text-xs font-bold mt-1", tier.textColor)}>TIER STATUS: {tier.points >= 15000 ? 'ELITE' : 'ACTIVE'}</p>
  </div>
  </div>

  <div className="relative z-10 space-y-4">
  <div className="space-y-2">
  <div className="flex justify-between text-[10px] font-bold text-[#FAF9F5]/60 uppercase tracking-widest">
  <span>Tiến trình nâng hạng</span>
  <span>{tier.nextTierPoints.toLocaleString()} PTS</span>
  </div>
  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
  <motion.div 
  initial={{ width: 0 }}
  animate={{ width: `${(tier.points / tier.nextTierPoints) * 100}%` }}
  className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]" 
  />
  </div>
  </div>

  <div className="space-y-2">
  <p className="text-[10px] font-bold text-[#FAF9F5]/40 uppercase tracking-widest border-b border-white/10 pb-1">Đặc quyền Tier</p>
  <div className="space-y-1.5">
  {tier.privileges.slice(0, 3).map((p, i) => (
  <div key={i} className="flex items-center gap-2 text-[11px] font-medium text-[#FAF9F5]/80">
  <CheckCircle2 className="w-3 h-3 text-[#FAF9F5]/40" />
  {p}
  </div>
  ))}
  </div>
  </div>

  <button className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-[#FAF9F5] py-3 rounded-lg font-bold text-sm transition-all border border-white/10 flex items-center justify-center gap-2">
  Chi tiết đặc quyền <ArrowRight className="w-4 h-4" />
  </button>
  </div>
  </div>
  ))}
  </motion.div>

  {/* VIP Members Management Table */}
  <div className="mt-8 bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 shadow-sm">
    <div className="flex justify-between items-center">
      <div>
        <h3 className="text-base font-bold text-slate-900">Quản lý Thành viên VIP & Tự động hóa ZNS</h3>
        <p className="text-xs text-slate-500">Mô phỏng thăng cấp thành viên hoặc gửi tin nhắn chăm sóc khách hàng tự động.</p>
      </div>
      <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 border border-blue-200 rounded">LOYALTY ZNS ACTIVE</span>
    </div>
    
    <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white shadow-xs">
      <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
        <thead className="bg-slate-50 text-slate-650 font-bold border-b border-slate-200">
          <tr>
            <th className="p-3">Mã KH</th>
            <th className="p-3">Họ và tên</th>
            <th className="p-3">Số điện thoại</th>
            <th className="p-3">Hạng hiện tại</th>
            <th className="p-3">Điểm tích lũy</th>
            <th className="p-3 text-center">Thao tác tự động hóa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-150">
          {vipMembers.map(m => (
            <tr key={m.id} className="hover:bg-slate-50/50">
              <td className="p-3 font-mono font-semibold text-slate-800">{m.id}</td>
              <td className="p-3 font-bold text-slate-900">{m.name}</td>
              <td className="p-3 font-mono text-slate-600">{m.phone}</td>
              <td className="p-3">
                <span className={cn(
                  "px-2 py-0.5 rounded font-bold text-[10px]",
                  m.tier === 'Kim cương' ? "bg-slate-900 text-orange-500" :
                  m.tier === 'Vàng' ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                )}>
                  {m.tier}
                </span>
              </td>
              <td className="p-3 font-mono font-bold text-slate-900">{m.points.toLocaleString()} PTS</td>
              <td className="p-3 text-center flex justify-center gap-2">
                <button
                  onClick={() => handleRankUp(m.id)}
                  disabled={m.tier === 'Kim cương'}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer",
                    m.tier === 'Kim cương' 
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  )}
                >
                  Thăng hạng 👑
                </button>
                <button
                  onClick={() => handleSendBirthdayMsg(m)}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                >
                  Chúc mừng sinh nhật 🎂
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  </>
)}

 {activeTab === 'missions' && (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="grid grid-cols-1 md:grid-cols-2 gap-6"
 >
 {[
 { title: 'Chuỗi 7 ngày Đăng nhập', reward: '500 Pts + Voucher 50k', progress: 4, total: 7, icon: Flame, color: 'text-orange-500' },
 { title: 'Đơn hàng đầu tháng (>2tr)', reward: 'X2 Loyalty Points', progress: 1.2, total: 2, icon: Sparkles, color: 'text-orange-600' },
 { title: 'Đánh giá 5 sao kèm ảnh', reward: '200 Pts / lượt', progress: 1, total: 3, icon: Heart, color: 'text-pink-500' },
 { title: 'Mua sắm tại quầy iPOS', reward: '100 Pts Bonus', progress: 0, total: 1, icon: LayoutGrid, color: 'text-primary-500' },
 ].map((task, i) => (
 <div key={i} className="p-6 bg-white border border-slate-200 rounded-lg space-y-6 hover:shadow-sm transition-all group border-b-4 border-b-stone-100 hover:border-b-blue-500">
 <div className="flex justify-between items-start">
 <div className="flex gap-4">
 <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center bg-slate-50  transition-transform", task.color)}>
 <task.icon className="w-6 h-6" />
 </div>
 <div>
 <h4 className="font-bold text-slate-900">{task.title}</h4>
 <p className="text-[11px] font-bold text-orange-700 uppercase tracking-wider mt-1 flex items-center gap-1">
 <Trophy className="w-3 h-3" /> THƯỞNG: {task.reward}
 </p>
 </div>
 </div>
 </div>
 
 <div className="space-y-2">
 <div className="flex justify-between text-[11px] font-bold">
 <span className="text-slate-500 uppercase">Tiến độ ({task.progress}/{task.total})</span>
 <span className="text-slate-900">{Math.round((task.progress / task.total) * 100)}%</span>
 </div>
 <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
 <motion.div 
 initial={{ width: 0 }}
 animate={{ width: `${(task.progress / task.total) * 100}%` }}
 className="h-full bg-slate-800 rounded-full" 
 />
 </div>
 </div>

 <button className="w-full py-2.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all">
 Xem hướng dẫn nhiệm vụ
 </button>
 </div>
 ))}
 </motion.div>
 )}

 {activeTab === 'rewards' && (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="space-y-8"
 >
 <div className="flex items-center justify-between">
 <h3 className="text-lg font-bold">Quà tặng đặc quyền</h3>
 <div className="flex gap-2">
 <button className="px-3 py-1.5 text-xs font-bold bg-slate-100 rounded-lg">Tất cả</button>
 <button className="px-3 py-1.5 text-xs font-bold text-slate-600">Voucher</button>
 <button className="px-3 py-1.5 text-xs font-bold text-slate-600">Quà tặng</button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 {REWARDS.map(reward => (
 <div key={reward.id} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm hover:shadow-sm transition-all">
 <div className="h-40 bg-slate-50 flex items-center justify-center relative">
 {reward.type === 'voucher' ? <Ticket className="w-12 h-12 text-orange-600 opacity-40" /> : <Gift className="w-12 h-12 text-pink-500 opacity-40" />}
 <div className="absolute top-4 right-4 px-2 py-1 bg-white/80 backdrop-blur-md rounded-lg text-[10px] font-bold text-slate-600 uppercase">
 Còn {reward.stock} suất
 </div>
 </div>
 <div className="p-6 space-y-4">
 <div>
 <h4 className="font-bold text-slate-900">{reward.title}</h4>
 <div className="flex items-center gap-2 mt-2">
 <Coins className="w-4 h-4 text-amber-500" />
 <span className="text-lg font-black text-slate-900">{reward.points.toLocaleString()}</span>
 <span className="text-xs font-bold text-slate-500 uppercase">Points</span>
 </div>
 </div>
 <button className="w-full py-3 bg-slate-900 text-[#FAF9F5] rounded-lg text-sm font-bold shadow-sm shadow-slate-900/5 hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
 Đổi quà ngay <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 </motion.div>
 )}

 {activeTab === 'gamification' && (
 <motion.div 
 initial={{ opacity: 0, rotate: -5 }}
 animate={{ opacity: 1, rotate: 0 }}
 className="flex flex-col md:flex-row gap-6 items-center justify-center py-6"
 >
 <div className="relative w-80 h-80 rounded-full border-[10px] border-slate-900 shadow-sm flex items-center justify-center bg-white p-2">
 <div className="absolute inset-0 rounded-full overflow-hidden">
 {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
 <div 
 key={deg} 
 className={cn(
 "absolute w-0.5 h-1/2 bg-slate-900 left-1/2 top-0 origin-bottom",
 i % 2 === 0 ? "opacity-100" : "opacity-30"
 )} 
 style={{ transform: `rotate(${deg}deg) translateX(-50%)` }} 
 />
 ))}
 <div className="absolute top-0 left-1/2 -translate-x-1/2 p-4 text-[10px] font-black text-orange-700">IPHONE 16</div>
 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 p-4 text-[10px] font-black text-slate-500">MAY MẮN</div>
 <div className="absolute right-0 top-1/2 -translate-y-1/2 p-4 text-[10px] font-black text-slate-500 rotate-90">1k PTS</div>
 <div className="absolute left-0 top-1/2 -translate-y-1/2 p-4 text-[10px] font-black text-slate-500 -rotate-90">Voucher 50k</div>
 </div>
 
 <div className="relative z-10 w-20 h-20 bg-red-600 rounded-full border-4 border-white shadow-[0_0_20px_rgba(239,68,68,0.5)] flex flex-col items-center justify-center text-[#FAF9F5] cursor-pointer  active:scale-95 transition-all">
 <p className="text-[10px] font-black tracking-tighter">SPIN</p>
 <Play className="w-6 h-6 fill-current" />
 </div>

 <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
 <div className="w-6 h-8 bg-red-600 rounded-b-full shadow-sm" />
 </div>
 </div>

 <div className="max-w-sm space-y-6">
 <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
 <Sparkles className="w-3 h-3" /> Hot Content
 </div>
 <h3 className="text-3xl font-black italic text-slate-900 tracking-tight leading-none uppercase">Vòng quay May mắn<br/>(Elite Lucky Spin)</h3>
 <p className="text-sm text-slate-600 leading-relaxed">Sử dụng lượt quay từ nhiệm vụ hàng ngày để nhận quà tặng hiện vật hoặc xu thưởng. Hạng Diamond được x2 tỷ lệ trúng quà giá trị.</p>
 
 <div className="p-4 bg-slate-50 rounded-lg space-y-3">
 <div className="flex justify-between text-xs font-bold">
 <span className="text-slate-500">Lượt quay khả dụng</span>
 <span className="text-slate-900">03 Lượt</span>
 </div>
 <button className="w-full py-4 bg-slate-900 text-[#FAF9F5] rounded-lg font-bold text-sm shadow-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
 <RotateCcw className="w-4 h-4" /> Bắt đầu quay (1 Lượt)
 </button>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>

 {/* Retention Marketing Engine Footer */}
 <div className="bg-slate-900 rounded-lg p-6 flex flex-col items-center text-center space-y-6 relative overflow-hidden">
 <div className="absolute inset-0 opacity-10">
 <div className="grid grid-cols-12 gap-1 h-full w-full">
 {Array.from({ length: 48 }).map((_, i) => (
 <div key={i} className="h-full bg-slate-800/20" />
 ))}
 </div>
 </div>
 
 <div className="p-4 bg-white/5 rounded-lg border border-white/10 relative z-10 backdrop-blur-sm">
 <Sparkles className="w-10 h-10 text-orange-500" />
 </div>
 
 <div className="space-y-2 relative z-10">
 <h3 className="text-2xl font-black italic text-[#FAF9F5] uppercase tracking-wider">Retention AI Engine</h3>
 <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
 Hệ thống tự động phát hiện người dùng có dấu hiệu "ngủ đông" (Churn Risk) và gửi mã Voucher đặc biệt qua Push Notification. Tăng tỷ lệ quay lại của khách hàng cũ lên đến 35%.
 </p>
 </div>

 <div className="flex flex-wrap justify-center gap-4 relative z-10">
 <button className="px-6 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition-all shadow-sm text-sm flex items-center gap-2">
 Phân tích Retention Report <ArrowRight className="w-4 h-4" />
 </button>
 <button className="px-6 py-3 bg-white/5 text-[#FAF9F5] font-bold rounded-lg hover:bg-white/10 transition-all border border-white/10 text-sm flex items-center gap-2">
 Quản lý Notification <Smartphone className="w-4 h-4" />
 </button>
 </div>
 </div>
 </div>
 );
}
