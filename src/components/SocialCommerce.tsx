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
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
              VComm Social Network
            </span>
            <span className="text-xs text-slate-500 font-medium">Nội Dung Người Dùng Tạo (UGC) & Nhóm</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Cộng Đồng & Mạng Xã Hội Mua Sắm</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Không gian chia sẻ video review, bài viết UGC, tạo xu hướng mua sắm theo nhóm và kiểm duyệt nội dung cộng đồng.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 transition-all flex items-center gap-2 shadow-2xs cursor-pointer">
            <Globe className="w-4 h-4 text-blue-600" />
            Quản Lý Hashtag Xu Hướng
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer">
            <Plus className="w-4 h-4" />
            Tạo Chiến Dịch Social
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <DraggableGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" columns={4} gap={16}>
        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kho Bài Viết UGC</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">12.5k bài</div>
          <p className="text-xs text-emerald-600 font-semibold mt-2">+1.2k bài mới trong ngày</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Lượt Tương Tác</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">1.2M lượt</div>
          <p className="text-xs text-slate-500 font-medium mt-2">Thích, bình luận & chia sẻ</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Cộng Đồng Mua Chung</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">420 nhóm</div>
          <p className="text-xs text-emerald-600 font-semibold mt-2">85 nhóm tăng trưởng cao</p>
        </div>

        <div className="p-5 rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ Mua Hàng Từ Feed</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">4.8%</div>
          <p className="text-xs text-slate-500 font-medium mt-2">Chuyển đổi trực tiếp qua bài đăng</p>
        </div>
      </DraggableGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-3 bg-slate-50/70 border-b border-slate-200/80 flex flex-wrap gap-2">
              {[
                { id: 'feed', label: 'Bảng Tin Cộng Đồng (Feed)', icon: MessageCircle },
                { id: 'communities', label: 'Hội Nhóm & Câu Lạc Bộ', icon: Users },
                { id: 'moderation', label: 'Kiểm Duyệt Nội Dung AI', icon: Hash }
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer",
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
                      : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80 hover:bg-slate-100/50"
                  )}
                >
                  <tab.icon className="w-3.5 h-3.5" /> {tab.label}
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
 <button className="text-[10px] text-[#2563EB] font-bold hover:underline italic">Theo dõi</button>
 </h4>
 <p className="text-[10px] text-[#6B7280]">{post.timestamp}</p>
 </div>
 </div>
 <button className="p-2 hover:bg-slate-50 rounded-lg"><MoreHorizontal className="w-4 h-4 text-slate-500" /></button>
 </div>
 <p className="text-sm text-[#374151] leading-relaxed">{post.content}</p>
 <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden group">
 <ImageIcon className="w-8 h-8 text-slate-500  transition-transform" />
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
 <Share2 className="w-4 h-4" /> Chia sẻ
 </button>
 </div>
 <button className="bg-[#F9FAFB] px-4 py-2 rounded-lg text-[10px] font-bold text-slate-700 hover:bg-slate-100 transition-all uppercase tracking-widest">Ghim sản phẩm trong bài</button>
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
 <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:text-[#2563EB] transition-colors">
 <Hash className="w-4 h-4" />
 </div>
 <div>
 <p className="text-xs font-bold text-[#111827]">#{h.tag}</p>
 <p className="text-[10px] text-slate-600">{h.posts} bài viết</p>
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
 Hệ thống tự động nhận diện sản phẩm trong ảnh bài viết qua AI Vision. Gắn link mua hàng trực tiếp vào bài viết UGC để rút ngắn hành trình mua sắm từ "Xem nội dung" sang "Mua hàng".
 </p>
 <button className="w-full py-3 bg-slate-900 text-[#FAF9F5] font-bold rounded-lg text-xs hover:bg-slate-800 transition-all uppercase tracking-widest shadow-sm shadow-slate-900/5">Cấu hình AI Vision</button>
 </div>
 <Users className="absolute -bottom-10 -right-10 w-48 h-48 text-[#FAF9F5]/5 -rotate-12" />
 </div>
 </div>
 </div>
 </div>
 );
}
