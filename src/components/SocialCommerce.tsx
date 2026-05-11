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
 content: 'Vừa unbox chiếc máy pha cà phê mini này siêu mê! Tiện cho ai hay đi làm văn phòng như mình. Click link xem shop nha mn.', 
 media: ['coffee.jpg'], 
 likes: 1245, 
 comments: 242, 
 tags: ['Tech', 'CoffeeLovers'], 
 timestamp: '2 giờ trước' 
 },
 { 
 id: 'POST-002', 
 authorId: 'SEL-005', 
 authorName: 'Uniqlo VN Official', 
 content: 'Preview BST mùa hè sắp ra mắt trên Sàn vào ngày 20/03. Ai hóng không nào? Like để nhận coupon bí mật!', 
 media: ['summer-fashion.mp4'], 
 likes: 8500, 
 comments: 1200, 
 tags: ['Uniqlo', 'NewArrival'], 
 timestamp: '5 giờ trước' 
 },
];

export function SocialCommerce() {
 const [activeTab, setActiveTab] = useState<'feed' | 'communities' | 'trending'>('feed');

 return (
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="flex items-center justify-between">
 <div className="header-title">
 <h1 className="font-sans tracking-tight text-xl font-bold text-slate-900">Cộng đồng & Mạng xã hội TMĐT</h1>
 <p className="text-sm text-slate-500 mt-1">Không gian chia sẻ nội dung UGC, tạo xu hướng mua sắm và kết nối cộng đồng người dùng.</p>
 </div>
 <div className="flex gap-3">
 <button className="bg-white border border-slate-300 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
 <Globe className="w-4 h-4" />
 Quản lý Hashtag
 </button>
 <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
 <Plus className="w-4 h-4" />
 Tạo Chiến dịch Social
 </button>
 </div>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-4 gap-6" columns={4} gap={24}>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Tổng bài viết (Kho bài viết)</span>
 <MessageSquare className="w-4 h-4 text-blue-600" />
 </div>
 <div className="text-xl font-bold text-slate-900">12.5k</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">+1.2k bài mới hôm qua</p>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Tổng lượt tương tác</span>
 <Heart className="w-4 h-4 text-red-500" />
 </div>
 <div className="text-xl font-bold text-slate-900">1.2M</div>
 <p className="text-[10px] text-slate-500 mt-1">Thích, Bình luận & Chia sẻ</p>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">Cộng đồng (Nhóm)</span>
 <Users className="w-4 h-4 text-[#8B5CF6]" />
 </div>
 <div className="text-xl font-bold text-slate-900">420</div>
 <p className="text-[10px] text-[#10B981] font-medium mt-1">85 nhóm tăng trưởng nhanh</p>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex justify-between items-start mb-2">
 <span className="text-[10px] text-slate-500 font-bold uppercase">UGC Conversion Rate</span>
 <TrendingUp className="w-4 h-4 text-[#10B981]" />
 </div>
 <div className="text-xl font-bold text-slate-900">4.8%</div>
 <p className="text-[10px] text-slate-500 mt-1">Tỷ lệ mua hàng từ Social Feed</p>
 </div>
 </DraggableGrid>

 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
 <div className="lg:col-span-2 space-y-6">
 <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
 <div className="flex border-b border-slate-100">
 {[
 { id: 'feed', label: 'Bảng tin (Social Feed)', icon: MessageCircle },
 { id: 'communities', label: 'Cộng đồng & Nhóm', icon: Users },
 { id: 'moderation', label: 'Kiểm duyệt nội dung', icon: Hash }
 ].map((tab) => (
 <button 
 key={tab.id}
 onClick={() => setActiveTab(tab.id as any)}
 className={cn(
 "px-8 py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2",
 activeTab === tab.id ? "border-[#2563EB] text-blue-600 bg-slate-100/20" : "border-transparent text-slate-500 hover:text-slate-900"
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
 <div key={post.id} className="bg-white border border-slate-100 rounded-lg p-6 hover:shadow-sm transition-all space-y-4">
 <div className="flex justify-between items-start">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center font-bold text-slate-500">
 {post.authorName[0]}
 </div>
 <div>
 <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
 {post.authorName}
 <span className="w-1 h-1 bg-slate-300 rounded-full" />
 <button className="text-[10px] text-blue-600 font-bold hover:underline italic">Theo dõi</button>
 </h4>
 <p className="text-[10px] text-slate-500">{post.timestamp}</p>
 </div>
 </div>
 <button className="p-2 hover:bg-slate-50 rounded-lg"><MoreHorizontal className="w-4 h-4 text-slate-500" /></button>
 </div>
 <p className="text-sm text-slate-700 leading-relaxed">{post.content}</p>
 <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden group">
 <ImageIcon className="w-8 h-8 text-slate-500 group-hover:scale-110 transition-transform" />
 <div className="absolute inset-0 bg-black/5" />
 </div>
 <div className="flex gap-4">
 {post.tags.map(tag => (
 <span key={tag} className="text-blue-600 font-bold text-xs">#{tag}</span>
 ))}
 </div>
 <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
 <div className="flex items-center gap-6">
 <button className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-red-500">
 <Heart className="w-4 h-4" /> {post.likes.toLocaleString()}
 </button>
 <button className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-600">
 <MessageSquare className="w-4 h-4" /> {post.comments.toLocaleString()}
 </button>
 <button className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-emerald-500">
 <Share2 className="w-4 h-4" /> Chia sẻ
 </button>
 </div>
 <button className="bg-slate-50 px-4 py-2 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition-all uppercase tracking-widest">Ghim sản phẩm trong bài</button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="space-y-6">
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <Flame className="w-5 h-5 text-orange-500" /> Hashtag thịnh hành
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
 <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-blue-600 transition-colors">
 <Hash className="w-4 h-4" />
 </div>
 <div>
 <p className="text-xs font-bold text-slate-900">#{h.tag}</p>
 <p className="text-[10px] text-slate-600">{h.posts} bài viết</p>
 </div>
 </div>
 {h.trend === 'up' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingUp className="w-4 h-4 text-slate-500 rotate-180" />}
 </div>
 ))}
 </div>
 </div>

 <div className="bg-[#111827] text-white p-6 rounded-lg space-y-4 relative overflow-hidden">
 <div className="relative z-10 space-y-4">
 <h3 className="text-lg font-bold flex items-center gap-2">
 <Smile className="w-5 h-5 text-yellow-500 fill-current" /> Social-to-Shop Engine
 </h3>
 <p className="text-slate-500 text-xs leading-relaxed">
 Hệ thống tự động nhận diện sản phẩm trong ảnh bài viết qua AI Vision. Gắn link mua hàng trực tiếp vào bài viết UGC để rút ngắn hành trình mua sắm từ "Xem nội dung" sang "Mua hàng".
 </p>
 <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition-all uppercase tracking-widest shadow-sm shadow-slate-900/5">Cấu hình AI Vision</button>
 </div>
 <Users className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 -rotate-12" />
 </div>
 </div>
 </div>
 </div>
 );
}
