import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 Megaphone, 
 Layout, 
 TrendingUp, 
 ArrowUpRight, 
 Calendar,
 Search,
 Filter,
 BarChart2,
 X,
 Share2,
 Camera,
 AtSign,
 Plus,
 Music2,
 Smartphone,
 MessageSquare,
 Repeat,
 Link2,
 Globe,
 Settings2,
 Cpu
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { Campaign } from '../types/erp';
import { motion, AnimatePresence } from 'motion/react';

const MOCK_CAMPAIGNS: Campaign[] = [
 {
 id: 'CMP-004',
 name: 'Chiáº¿n dá»‹ch Khai XuÃ¢n Y2024',
 type: 'voucher',
 status: 'active',
 budget: 200000000,
 spent: 85000000,
 gmvGenerated: 900000000,
 roi: 10.5,
 startDate: '01/02/2024',
 endDate: '28/02/2024'
 },
 {
 id: 'CMP-002',
 name: 'Voucher SiÃªu Sale 15/3',
 type: 'voucher',
 status: 'upcoming',
 budget: 20000000,
 spent: 0,
 gmvGenerated: 0,
 roi: 0,
 startDate: '15/03/2024',
 endDate: '15/03/2024'
 }
];

const SOCIAL_ACCOUNTS = [
 { id: 'fb', platform: 'Facebook', name: 'VComm Official', status: 'connected', followers: '150k', color: 'bg-slate-900', icon: Globe },
 { id: 'tt', platform: 'TikTok', name: '@vcomm_shop_vn', status: 'connected', followers: '850k', color: 'bg-stone-950', icon: Music2 },
 { id: 'ig', platform: 'Instagram', name: 'vcomm.lifestyle', status: 'connected', followers: '45k', color: 'bg-pink-600', icon: Camera },
 { id: 'x', platform: 'Twitter/X', name: 'vcomm_global', status: 'disconnected', followers: '0', color: 'bg-slate-800', icon: AtSign },
];

const MARKETING_MODULE_GROUPS = [
 {
 title: 'Chiáº¿n dá»‹ch & TÄƒng trÆ°á»Ÿng',
 items: [
 { id: 'campaigns', label: 'Chiáº¿n dá»‹ch (Campaigns)', desc: 'Setup voucher, khuyáº¿n mÃ£i sÃ n.', icon: Megaphone, color: 'blue' },
 { id: 'vouchers', label: 'MÃ£ giáº£m giÃ¡', desc: 'Quáº£n lÃ½ kho voucher vÃ  Ä‘iá»u kiá»‡n.', icon: Calendar, color: 'indigo' },
 { id: 'affiliate', label: 'Affiliate & KOC', desc: 'Máº¡ng lÆ°á»›i Ä‘á»‘i tÃ¡c lan tá»a.', icon: Share2, color: 'emerald' },
 ]
 },
 {
 title: 'Äa kÃªnh & Tá»± Ä‘á»™ng hÃ³a',
 items: [
 { id: 'omnichannel', label: 'Đồng bộ Mạng xã hội', desc: 'Äá»“ng bá»™ Facebook, TikTok, IG.', icon: Globe, color: 'blue' },
 { id: 'ads', label: 'Quản lý Quảng cáo', desc: 'QuÃ©t tracking vÃ  tá»‘i Æ°u ngÃ¢n sÃ¡ch.', icon: TrendingUp, color: 'purple' },
 { id: 'automation', label: 'Tự động Marketing', desc: 'Ká»‹ch báº£n chÄƒm sÃ³c tá»± Ä‘á»™ng.', icon: Cpu, color: 'rose' },
 ]
 }
];

function getColorClasses(color: string) {
 switch (color) {
 case 'blue': return 'bg-slate-100 text-orange-700';
 case 'orange': return 'bg-orange-50 text-orange-600';
 case 'indigo': return 'bg-primary-50 text-primary-600';
 case 'purple': return 'bg-purple-50 text-purple-600';
 case 'emerald': return 'bg-emerald-50 text-emerald-600';
 case 'rose': return 'bg-rose-50 text-rose-600';
 default: return 'bg-slate-50 text-slate-700';
 }
}

export function Marketing() {
 const [isModalOpen, setIsModalOpen] = useState(false);
 const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'omnichannel' | 'ads' | 'vouchers' | string>('overview');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <div className="flex items-center gap-2 mb-1">
 {activeTab !== 'overview' && (
 <button onClick={() => setActiveTab('overview')} className="p-1 hover:bg-slate-100 rounded-md transition-colors mr-1">
 <ArrowUpRight className="w-4 h-4 rotate-225" />
 </button>
 )}
 <h1 className="font-serif tracking-tight text-2xl font-bold text-[#111827]">Marketing & Omnichannel</h1>
 </div>
 <p className="text-sm text-[#6B7280]">Káº¿t ná»‘i Ä‘a kÃªnh (FB, TT, IG), Quáº£n lÃ½ chiáº¿n dá»‹ch & Tá»± Ä‘á»™ng hÃ³a tiáº¿p thá»‹.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Cpu className="w-4 h-4 text-purple-500" />
 AI Content Maker
 </button>
 <button 
 onClick={() => setIsModalOpen(true)}
 className="bg-[#2563EB] text-[#FAF9F5] px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
 >
 <Plus className="w-4 h-4" /> Táº¡o chiáº¿n dá»‹ch má»›i
 </button>
 </div>
 </div>

 {activeTab === 'overview' && (
 <div className="space-y-8">
 {/* Stats Cards */}
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">GMV tá»« Marketing</span>
 <BarChart2 className="w-4 h-4 text-emerald-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{formatCurrency(900000000)}</span>
 <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">ROI 10.5</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Tá»•ng Follower (Multi)</span>
 <Smartphone className="w-4 h-4 text-orange-700" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">1.2M</span>
 <span className="text-[10px] text-orange-700 font-bold bg-slate-100 px-2 py-0.5 rounded">+15k/day</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Chi phÃ­ Ä‘Ã£ tiÃªu</span>
 <TrendingUp className="w-4 h-4 text-orange-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">{formatCurrency(85000000)}</span>
 <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded">42% Budget</span>
 </div>
 </div>
 <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-sm hover:shadow-sm transition-all">
 <div className="flex justify-between items-start mb-3">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase tracking-widest">Chiến dịch đang chạy</span>
 <Megaphone className="w-4 h-4 text-primary-600" />
 </div>
 <div className="flex items-end justify-between">
 <span className="text-2xl font-black text-[#111827]">08</span>
 <span className="text-[10px] text-primary-600 font-bold bg-primary-50 px-2 py-0.5 rounded">Đang hot</span>
 </div>
 </div>
 </DraggableGrid>

 {/* Matrix Grid Layout */}
 <div className="space-y-6">
 {MARKETING_MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx} className="space-y-4">
 <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 px-1">
 <span className="w-1 h-4 bg-[#2563EB] rounded-full inline-block" />
 {group.title}
 </h3>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
 {group.items.map((mod) => (
 <div 
 key={mod.id}
 onClick={() => setActiveTab(mod.id as any)}
 className="group bg-white p-5 rounded-lg border border-slate-300 shadow-sm hover:shadow-sm hover:border-[#2563EB]/50 transition-all cursor-pointer flex flex-col gap-4 relative overflow-hidden"
 >
 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
 <mod.icon className="w-24 h-24 transform -rotate-12 translate-x-4 -translate-y-4" />
 </div>
 <div className={cn("w-12 h-12 rounded relative z-10 flex items-center justify-center group-hover:scale-110 group-hover:bg-[#2563EB] group-hover:text-[#FAF9F5] transition-all shadow-sm", getColorClasses(mod.color))}>
 <mod.icon className="w-6 h-6" />
 </div>
 <div className="relative z-10">
 <h3 className="font-bold text-[#111827] text-sm mb-1.5 group-hover:text-[#2563EB] transition-colors">{mod.label}</h3>
 <p className="text-[11px] text-[#6B7280] leading-relaxed line-clamp-2">{mod.desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Tabs Menu */}
 {activeTab !== 'overview' && (
 <>
 <div className="flex border-b border-slate-300 gap-8">
 {[
 { id: 'campaigns', label: 'Chiáº¿n dá»‹ch (Campaigns)', icon: Megaphone },
 { id: 'vouchers', label: 'MÃ£ giáº£m giÃ¡ (Vouchers)', icon: Calendar },
 { id: 'omnichannel', label: 'Káº¿t ná»‘i Äa kÃªnh (Social Sync)', icon: Share2 },
 { id: 'ads', label: 'Quáº£n lÃ½ Ads & Tracking', icon: TrendingUp },
 ].map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "pb-4 text-sm font-bold transition-all relative flex items-center gap-2",
 activeTab === tab.id ? "text-orange-700" : "text-slate-500 hover:text-slate-700"
 )}
 >
 <tab.icon className="w-4 h-4" />
 {tab.label}
 {activeTab === tab.id && (
 <motion.div layoutId="activeTabMarketing" className="absolute bottom-0 left-0 right-0 h-0.5 bg-slate-900" />
 )}
 </button>
 ))}
 </div>

 <AnimatePresence mode="wait">
 {activeTab === 'omnichannel' && (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="space-y-6"
 >
 {/* Social Accounts Area */}
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
 <div>
 <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
 <Link2 className="w-5 h-5 text-orange-600" /> Tráº¡ng thÃ¡i Káº¿t ná»‘i TÃ i khoáº£n Social
 </h2>
 <p className="text-xs text-slate-600 mt-0.5">Tá»± Ä‘á»™ng Ä‘á»“ng bá»™ ná»™i dung & TrÃ² chuyá»‡n táº­p trung tá»« cÃ¡c ná»n táº£ng.</p>
 </div>
 <button className="text-xs font-bold bg-[#111827] text-[#FAF9F5] px-4 py-2 rounded-lg hover:bg-slate-800 transition-all flex items-center gap-2">
 <Plus className="w-3.5 h-3.5" /> ThÃªm TÃ i khoáº£n
 </button>
 </div>

 <div className="p-6">
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 {SOCIAL_ACCOUNTS.map(acc => (
 <div key={acc.id} className="p-4 rounded-lg border border-slate-200 bg-white hover:border-orange-200 transition-all shadow-sm relative group">
 <div className="flex items-center gap-4 mb-4">
 <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shadow-sm", acc.color)}>
 <acc.icon className="w-6 h-6 text-[#FAF9F5]" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="font-bold text-slate-900 truncate text-sm">{acc.name}</p>
 <p className="text-[10px] text-slate-600 uppercase tracking-widest">{acc.platform}</p>
 </div>
 </div>
 
 <div className="flex items-center justify-between mt-auto pt-4 border-t border-stone-50">
 <div className="flex flex-col">
 <span className="text-[10px] font-bold text-slate-500 uppercase">Người theo dõi</span>
 <span className="text-sm font-bold text-slate-900">{acc.followers}</span>
 </div>
 <div className={cn(
 "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
 acc.status === 'connected' ? "bg-emerald-50 text-emerald-600" : "bg-slate-50 text-slate-500"
 )}>
 <div className={cn("w-1.5 h-1.5 rounded-full", acc.status === 'connected' ? "bg-emerald-500" : "bg-slate-300")} />
 {acc.status === 'connected' ? 'LIVE' : 'LINK'}
 </div>
 </div>

 <button className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
 <Settings2 className="w-4 h-4 text-slate-500" />
 </button>
 </div>
 ))}
 </div>
 </div>

 <DraggableGrid className="p-6 bg-slate-100/30 border-t border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-8" columns={3} gap={32}>
 <div className="flex gap-4">
 <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-300 flex items-center justify-center text-orange-700">
 <MessageSquare className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-slate-900">Omni Chat (Inbox táº­p trung)</h4>
 <p className="text-xs text-slate-600 mt-1">Tráº£ lá»i bÃ¬nh luáº­n, tin nháº¯n tá»« FB/IG/TT táº¡i má»™t nÆ¡i duy nháº¥t.</p>
 </div>
 </div>
 <div className="flex gap-4">
 <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-300 flex items-center justify-center text-orange-700">
 <Repeat className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-slate-900">Tự động Đồng bộ Nội dung</h4>
 <p className="text-xs text-slate-600 mt-1">Háº¹n giá» Ä‘Äƒng bÃ i Ä‘á»“ng thá»i lÃªn táº¥t cáº£ cÃ¡c ná»n táº£ng Ä‘Ã£ káº¿t ná»‘i.</p>
 </div>
 </div>
 <div className="flex gap-4">
 <div className="w-10 h-10 bg-white rounded-lg shadow-sm border border-slate-300 flex items-center justify-center text-orange-700">
 <Smartphone className="w-5 h-5" />
 </div>
 <div>
 <h4 className="text-sm font-bold text-slate-900">Video Mua sắm</h4>
 <p className="text-xs text-slate-600 mt-1">Gáº¯n tag sáº£n pháº©m vÃ o video TikTok/Instagram Reels tá»± Ä‘á»™ng.</p>
 </div>
 </div>
 </DraggableGrid>
 </div>
 </motion.div>
 )}

 {activeTab === 'vouchers' && (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="space-y-6"
 >
 <div className="bg-white rounded-lg border border-slate-300 overflow-hidden shadow-sm">
 <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <h3 className="font-bold text-slate-900 text-sm">Danh sÃ¡ch mÃ£ giáº£m giÃ¡</h3>
 <button className="text-xs font-bold text-orange-700 hover:text-orange-800 flex items-center gap-1">
 <Plus className="w-3 h-3" /> Táº¡o mÃ£ giáº£m giÃ¡
 </button>
 </div>
 <div className="overflow-x-auto min-w-0">
<table className="w-full text-left text-sm">
 <thead>
 <tr className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold">
 <th className="px-3 py-2">TÃªn chiáº¿n dá»‹ch</th>
 <th className="px-3 py-2">Loáº¡i mÃ£</th>
 <th className="px-3 py-2">Má»©c giáº£m</th>
 <th className="px-3 py-2">Ãp dá»¥ng cho</th>
 <th className="px-6 py-3 text-right">Thao tÃ¡c</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 <tr className="hover:bg-slate-50">
 <td className="px-6 py-4 font-bold text-slate-900">Flash Sale 15/3</td>
 <td className="px-3 py-2.5">Giáº£m %</td>
 <td className="px-3 py-2.5">10%</td>
 <td className="px-6 py-4 text-xs text-slate-700">Äiá»‡n tá»­, Thá»i trang</td>
 <td className="px-6 py-4 text-right">
 <button className="text-xs font-bold text-slate-600 hover:text-orange-700">Sá»­a</button>
 </td>
 </tr>
 <tr className="hover:bg-slate-50">
 <td className="px-6 py-4 font-bold text-slate-900">ÄÆ¡n hÃ ng Ä‘áº§u tiÃªn</td>
 <td className="px-3 py-2.5">Miá»…n phÃ­ váº­n chuyá»ƒn</td>
 <td className="px-3 py-2.5">Tá»‘i Ä‘a 30k</td>
 <td className="px-6 py-4 text-xs text-slate-700">Táº¥t cáº£ sáº£n pháº©m</td>
 <td className="px-6 py-4 text-right">
 <button className="text-xs font-bold text-slate-600 hover:text-orange-700">Sá»­a</button>
 </td>
 </tr>
 </tbody>
 </table>
</div>
 </div>
 </motion.div>
 )}

 {activeTab === 'campaigns' && (
 <motion.div 
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 exit={{ opacity: 0, y: -20 }}
 className="space-y-6"
 >
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 border-b border-[#F3F4F6] flex justify-between items-center bg-[#F9FAFB]">
 <div className="flex gap-4">
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
 <input 
 type="text" 
 placeholder="TÃ¬m chiáº¿n dá»‹ch Marketing, Voucher..." 
 className="bg-white border border-slate-300 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none w-72"
 />
 </div>
 <button className="bg-white border border-slate-300 px-3 py-2 rounded-lg text-sm text-[#4B5563] flex items-center gap-2 font-medium">
 <Filter className="w-4 h-4" /> Lá»c theo loáº¡i
 </button>
 </div>
 <button className="text-xs font-semibold text-[#2563EB] flex items-center gap-2 hover:underline">
 BÃ¡o cÃ¡o hiá»‡u suáº¥t <BarChart2 className="w-3 h-3" />
 </button>
 </div>

 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="bg-[#F9FAFB] border-b border-[#F3F4F6]">
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-[10px]">Chiáº¿n dá»‹ch / Voucher</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-[10px]">Thá»i gian cháº¡y</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-right text-[10px]">NgÃ¢n sÃ¡ch / ÄÃ£ dÃ¹ng</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-center text-[10px]">Chá»‰ sá»‘ ROAS</th>
 <th className="px-6 py-4 text-[11px] font-bold text-[#6B7280] uppercase tracking-widest text-[10px]">Tráº¡ng thÃ¡i</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#F3F4F6]">
 {MOCK_CAMPAIGNS.map((campaign) => (
 <tr key={campaign.id} className="hover:bg-[#F9FAFB] group transition-colors">
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-3">
 <div className="p-3 rounded-lg bg-slate-100 text-orange-700">
 <Megaphone className="w-5 h-5" />
 </div>
 <div>
 <p className="text-sm font-semibold text-[#111827]">{campaign.name}</p>
 <p className="text-[10px] text-[#6B7280] uppercase tracking-tight">{campaign.type.replace('_', ' ')}</p>
 </div>
 </div>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex items-center gap-1.5 text-xs text-[#4B5563]">
 <Calendar className="w-3.5 h-3.5 text-[#9CA3AF]" />
 {campaign.startDate} - {campaign.endDate}
 </div>
 </td>
 <td className="px-6 py-4 text-right">
 <p className="text-sm font-bold text-[#111827]">{formatCurrency(campaign.budget)}</p>
 <p className="text-[10px] text-[#6B7280]">Chi: {formatCurrency(campaign.spent)}</p>
 </td>
 <td className="px-3 py-2.5">
 <div className="flex flex-col items-center">
 <div className="flex items-center gap-1.5">
 <span className="text-sm font-bold text-emerald-600">{campaign.roi > 0 ? campaign.roi + 'x' : '--'}</span>
 {campaign.roi > 0 && <ArrowUpRight className="w-3 h-3 text-[#10B981]" />}
 </div>
 <p className="text-[10px] text-[#6B7280]">Doanh thu: {formatCurrency(campaign.gmvGenerated)}</p>
 </div>
 </td>
 <td className="px-3 py-2.5">
 <span className={cn(
 "px-2 py-0.5 rounded-full text-[10px] font-bold",
 campaign.status === 'active' ? "bg-emerald-50 text-emerald-600" :
 campaign.status === 'upcoming' ? "bg-slate-100 text-orange-700" : "bg-slate-100 text-slate-500"
 )}>
 {campaign.status === 'active' ? 'ÄANG CHáº Y' : 
 campaign.status === 'upcoming' ? 'Sáº®P DIá»„N RA' : 'ÄÃƒ Káº¾T THÃšC'}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </>
 )}

 {isModalOpen && (
 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-sm animate-in zoom-in-95 duration-200">
 <div className="flex justify-between items-center mb-6">
 <div className="flex items-center gap-2 text-orange-700">
 <Megaphone className="w-5 h-5 fill-current" />
 <h2 className="text-lg font-bold text-[#111827]">Táº¡o chiáº¿n dá»‹ch Marketing</h2>
 </div>
 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
 <X className="w-5 h-5" />
 </button>
 </div>
 
 <form className="space-y-4">
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">TÃªn chiáº¿n dá»‹ch</label>
 <input type="text" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-orange-600 focus:border-transparent outline-none" required />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">KÃªnh má»¥c tiÃªu</label>
 <select className="w-full border border-slate-400 rounded-lg p-2.5 text-sm bg-white outline-none">
 <option value="fb">Facebook Fanpage</option>
 <option value="tt">TikTok Shop</option>
 <option value="ig">Instagram</option>
 <option value="multi">Táº¥t cáº£ kÃªnh (Omni)</option>
 </select>
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">NgÃ¢n sÃ¡ch (VNÄ)</label>
 <input type="number" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm outline-none" placeholder="0" required />
 </div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">NgÃ y báº¯t Ä‘áº§u</label>
 <input type="date" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm outline-none" required />
 </div>
 <div>
 <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-widest mb-1">NgÃ y káº¿t thÃºc</label>
 <input type="date" className="w-full border border-slate-400 rounded-lg p-2.5 text-sm outline-none" required />
 </div>
 </div>
 <button className="w-full bg-[#2563EB] text-[#FAF9F5] py-3 rounded-lg font-bold mt-6 hover:bg-slate-800 shadow-sm shadow-slate-900/5 transition-all">
 Khá»Ÿi táº¡o chiáº¿n dá»‹ch Äa kÃªnh
 </button>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}



