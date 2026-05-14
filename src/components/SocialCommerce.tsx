import { DraggableGrid } from './ui/DraggableGrid';
import React, { useState } from 'react';
import { 
 MessageSquare, 
 Heart, 
 Share2, 
 Users, 
 Plus, 
 Image as ImageIcon, 
 Video, 
 Tag, 
 MoreHorizontal, 
 Search, 
 Filter, 
 TrendingUp, 
 UserPlus, 
 MessageCircle,
 Hash,
 Smile,
 Flame,
 Globe
} from 'lucide-react';
import { cn } from '../lib/utils';
import { SocialPost } from '../types/erp';

const MOCK_POSTS: SocialPost[] = [
 { 
 id: 'POST-001', 
 authorId: 'USR-772', 
 authorName: 'Minh Anh Review', 
 content: 'Vá»«a unbox chiáº¿c mÃ¡y pha cÃ  phÃª mini nÃ y siÃªu mÃª! Tiá»‡n cho ai hay Ä‘i lÃ m vÄƒn phÃ²ng nhÆ° mÃ¬nh. Click link xem shop nha mn.', 
 media: ['coffee.jpg'], 
 likes: 1245, 
 comments: 242, 
 tags: ['Tech', 'CoffeeLovers'], 
 timestamp: '2 giá» trÆ°á»›c' 
 },
 { 
 id: 'POST-002', 
 authorId: 'SEL-005', 
 authorName: 'Uniqlo VN Official', 
 content: 'Preview BST mÃ¹a hÃ¨ sáº¯p ra máº¯t trÃªn SÃ n vÃ o ngÃ y 20/03. Ai hÃ³ng khÃ´ng nÃ o? Like Ä‘á»ƒ nháº­n coupon bÃ­ máº­t!', 
 media: ['summer-fashion.mp4'], 
 likes: 8500, 
 comments: 1200, 
 tags: ['Uniqlo', 'NewArrival'], 
 timestamp: '5 giá» trÆ°á»›c' 
 },
];

export function SocialCommerce() {
 const [activeTab, setActiveTab] = useState<'feed' | 'communities' | 'trending'>('feed');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-serif tracking-tight text-2xl font-semibold text-[#111827]">Cá»™ng Ä‘á»“ng & Máº¡ng xÃ£ há»™i TMÄT</h1>
 <p className="text-sm text-[#6B7280] mt-1">KhÃ´ng gian chia sáº» ná»™i dung UGC, táº¡o xu hÆ°á»›ng mua sáº¯m vÃ  káº¿t ná»‘i cá»™ng Ä‘á»“ng ngÆ°á»i dÃ¹ng.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Globe className="w-4 h-4" />
 Quáº£n lÃ½ Hashtag
 </button>
 <button className="bg-[#2563EB] text-[#FAF9F5] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" />
 Táº¡o Chiáº¿n dá»‹ch Social
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-4" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Tá»•ng bÃ i viáº¿t (Kho bÃ i viáº¿t)</span>
 <MessageSquare className="w-4 h-4 text-[#2563EB]" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">12.5k</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">+1.2k bÃ i má»›i hÃ´m qua</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Tá»•ng lÆ°á»£t tÆ°Æ¡ng tÃ¡c</span>
 <Heart className="w-4 h-4 text-red-500" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">1.2M</div>
 <p className="text-[10px] text-[#6B7280] mt-1">ThÃ­ch, BÃ¬nh luáº­n & Chia sáº»</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">Cá»™ng Ä‘á»“ng (NhÃ³m)</span>
 <Users className="w-4 h-4 text-[#8B5CF6]" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">420</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">85 nhÃ³m tÄƒng trÆ°á»Ÿng nhanh</p>
 </div>
 <div className="bg-white p-5 rounded-lg border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-[#6B7280] font-bold uppercase">UGC Conversion Rate</span>
 <TrendingUp className="w-4 h-4 text-[#10B981]" />
 </div>
 <div className="text-2xl font-bold text-[#111827]">4.8%</div>
 <p className="text-[10px] text-slate-500 mt-1">Tá»· lá»‡ mua hÃ ng tá»« Social Feed</p>
 </div>
 </DraggableGrid>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-[#F3F4F6]">
 {[
 { id: 'feed', label: 'Báº£ng tin (Social Feed)', icon: MessageCircle },
 { id: 'communities', label: 'Cá»™ng Ä‘á»“ng & NhÃ³m', icon: Users },
 { id: 'moderation', label: 'Kiá»ƒm duyá»‡t ná»™i dung', icon: Hash }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
 activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-slate-100/20" : "border-transparent text-[#6B7280] hover:text-[#111827]"
 )}
 >
 <tab.icon className="w-4 h-4" /> {tab.label}
 </button>
 ))}
 </div>

 <div className="p-6">
 {activeTab === 'feed' && (
 <div className="space-y-8 animate-in fade-in duration-300">
 {MOCK_POSTS.map(post => (
 <div key={post.id} className="bg-white border border-[#F3F4F6] rounded-lg p-6 hover:shadow-sm transition-all space-y-4">
 <div className="flex justify-between items-start">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center font-bold text-slate-500">
 {post.authorName[0]}
 </div>
 <div>
 <h4 className="text-sm font-bold text-[#111827] flex items-center gap-2">
 {post.authorName}
 <span className="w-1 h-1 bg-slate-300 rounded-full" />
 <button className="text-[10px] text-[#2563EB] font-bold hover:underline italic">Theo dÃµi</button>
 </h4>
 <p className="text-[10px] text-[#6B7280]">{post.timestamp}</p>
 </div>
 </div>
 <button className="p-2 hover:bg-slate-50 rounded-lg"><MoreHorizontal className="w-4 h-4 text-slate-500" /></button>
 </div>
 <p className="text-sm text-[#374151] leading-relaxed">{post.content}</p>
 <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden group">
 <ImageIcon className="w-8 h-8 text-slate-500 group-hover:scale-110 transition-transform" />
 <div className="absolute inset-0 bg-black/5" />
 </div>
 <div className="flex gap-4">
 {post.tags.map(tag => (
 <span key={tag} className="text-[#2563EB] font-bold text-xs">#{tag}</span>
 ))}
 </div>
 <div className="pt-4 border-t border-[#F3F4F6] flex items-center justify-between">
 <div className="flex items-center gap-6">
 <button className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-500">
 <Heart className="w-4 h-4" /> {post.likes.toLocaleString()}
 </button>
 <button className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#2563EB]">
 <MessageSquare className="w-4 h-4" /> {post.comments.toLocaleString()}
 </button>
 <button className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-500">
 <Share2 className="w-4 h-4" /> Chia sáº»
 </button>
 </div>
 <button className="bg-[#F9FAFB] px-4 py-2 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition-all uppercase tracking-widest">Ghim sáº£n pháº©m trong bÃ i</button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
 <h3 className="font-bold text-[#111827] flex items-center gap-2">
 <Flame className="w-5 h-5 text-orange-500" /> Hashtag thá»‹nh hÃ nh
 </h3>
 <div className="space-y-4">
 {[
 { tag: 'DecorPhongNgu', posts: '1.2k', trend: 'up' },
 { tag: 'UnboxIphone15', posts: '4.5k', trend: 'up' },
 { tag: 'ReviewMyPham', posts: '850', trend: 'down' },
 { tag: 'FashionHacks', posts: '15.4k', trend: 'up' },
 ].map((h, i) => (
 <div key={i} className="flex items-center justify-between group cursor-pointer">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-[#2563EB] transition-colors">
 <Hash className="w-4 h-4" />
 </div>
 <div>
 <p className="text-xs font-bold text-[#111827]">#{h.tag}</p>
 <p className="text-[10px] text-slate-600">{h.posts} bÃ i viáº¿t</p>
 </div>
 </div>
 {h.trend === 'up' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingUp className="w-4 h-4 text-slate-500 rotate-180" />}
 </div>
 ))}
 </div>
 </div>

 <div className="bg-[#111827] text-[#FAF9F5] p-6 rounded-lg space-y-4 relative overflow-hidden">
 <div className="relative z-10 space-y-4">
 <h3 className="text-lg font-bold flex items-center gap-2">
 <Smile className="w-5 h-5 text-yellow-500 fill-current" /> Social-to-Shop Engine
 </h3>
 <p className="text-slate-500 text-xs leading-relaxed">
 Há»‡ thá»‘ng tá»± Ä‘á»™ng nháº­n diá»‡n sáº£n pháº©m trong áº£nh bÃ i viáº¿t qua AI Vision. Gáº¯n link mua hÃ ng trá»±c tiáº¿p vÃ o bÃ i viáº¿t UGC Ä‘á»ƒ rÃºt ngáº¯n hÃ nh trÃ¬nh mua sáº¯m tá»« "Xem ná»™i dung" sang "Mua hÃ ng".
 </p>
 <button className="w-full py-3 bg-slate-900 text-[#FAF9F5] font-bold rounded-lg text-xs hover:bg-slate-800 transition-all uppercase tracking-widest shadow-sm shadow-slate-900/5">Cáº¥u hÃ¬nh AI Vision</button>
 </div>
 <Users className="absolute -bottom-10 -right-10 w-48 h-48 text-[#FAF9F5]/5 -rotate-12" />
 </div>
 </div>
 </div>
 </div>
 );
}

