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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex items-center justify-between">
        <div className="header-title">
          <h1 className="text-2xl font-semibold text-[#111827]">Cộng đồng & Mạng xã hội TMĐT</h1>
          <p className="text-sm text-[#6B7280] mt-1">Không gian chia sẻ nội dung UGC, tạo xu hướng mua sắm và kết nối cộng đồng người dùng.</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white border border-[#E5E7EB] px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all flex items-center gap-2">
            <Globe className="w-4 h-4" />
            Quản lý Hashtag
          </button>
          <button className="bg-[#2563EB] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all shadow-sm flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo Chiến dịch Social
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">Tổng bài viết (Post pool)</span>
              <MessageSquare className="w-4 h-4 text-[#2563EB]" />
           </div>
           <div className="text-2xl font-bold text-[#111827]">12.5k</div>
           <p className="text-[10px] text-[#10B981] font-medium mt-1">+1.2k bài mới hôm qua</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">Tổng lượt tương tác</span>
              <Heart className="w-4 h-4 text-red-500" />
           </div>
           <div className="text-2xl font-bold text-[#111827]">1.2M</div>
           <p className="text-[10px] text-[#6B7280] mt-1">Likes, Comments & Shares</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">Communities (Nhóm)</span>
              <Users className="w-4 h-4 text-[#8B5CF6]" />
           </div>
           <div className="text-2xl font-bold text-[#111827]">420</div>
           <p className="text-[10px] text-[#10B981] font-medium mt-1">85 nhóm tăng trưởng nhanh</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-[#E5E7EB] shadow-sm">
           <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] text-[#6B7280] font-bold uppercase">UGC Conversion Rate</span>
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
           </div>
           <div className="text-2xl font-bold text-[#111827]">4.8%</div>
           <p className="text-[10px] text-slate-400 mt-1">Tỷ lệ mua hàng từ Social Feed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-[#E5E7EB] shadow-sm overflow-hidden">
               <div className="flex border-b border-[#F3F4F6]">
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
                         activeTab === tab.id ? "border-[#2563EB] text-[#2563EB] bg-blue-50/20" : "border-transparent text-[#6B7280] hover:text-[#111827]"
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
                           <div key={post.id} className="bg-white border border-[#F3F4F6] rounded-lg p-6 hover:shadow-md transition-all space-y-4">
                              <div className="flex justify-between items-start">
                                 <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#E5E7EB] flex items-center justify-center font-bold text-slate-400">
                                       {post.authorName[0]}
                                    </div>
                                    <div>
                                       <h4 className="text-sm font-bold text-[#111827] flex items-center gap-2">
                                          {post.authorName}
                                          <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                          <button className="text-[10px] text-[#2563EB] font-bold hover:underline italic">Follow</button>
                                       </h4>
                                       <p className="text-[10px] text-[#6B7280]">{post.timestamp}</p>
                                    </div>
                                 </div>
                                 <button className="p-2 hover:bg-slate-50 rounded-lg"><MoreHorizontal className="w-4 h-4 text-slate-400" /></button>
                              </div>
                              <p className="text-sm text-[#374151] leading-relaxed">{post.content}</p>
                              <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center relative overflow-hidden group">
                                 <ImageIcon className="w-8 h-8 text-slate-300 group-hover:scale-110 transition-transform" />
                                 <div className="absolute inset-0 bg-black/5" />
                              </div>
                              <div className="flex gap-4">
                                 {post.tags.map(tag => (
                                    <span key={tag} className="text-[#2563EB] font-bold text-xs">#{tag}</span>
                                 ))}
                              </div>
                              <div className="pt-4 border-t border-[#F3F4F6] flex items-center justify-between">
                                 <div className="flex items-center gap-6">
                                    <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-500">
                                       <Heart className="w-4 h-4" /> {post.likes.toLocaleString()}
                                    </button>
                                    <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#2563EB]">
                                       <MessageSquare className="w-4 h-4" /> {post.comments.toLocaleString()}
                                    </button>
                                    <button className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-500">
                                       <Share2 className="w-4 h-4" /> Chia sẻ
                                    </button>
                                 </div>
                                 <button className="bg-[#F9FAFB] px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-100 transition-all uppercase tracking-widest">Ghim sản phẩm trong bài</button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </div>
         </div>

         <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg border border-[#E5E7EB] shadow-sm space-y-6">
               <h3 className="font-bold text-[#111827] flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" /> Trending Hashtags
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
                          <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-[#2563EB] transition-colors">
                             <Hash className="w-4 h-4" />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-[#111827]">#{h.tag}</p>
                             <p className="text-[10px] text-slate-500">{h.posts} bài viết</p>
                          </div>
                       </div>
                       {h.trend === 'up' ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingUp className="w-4 h-4 text-slate-300 rotate-180" />}
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-[#111827] text-white p-6 rounded-xl space-y-4 relative overflow-hidden">
               <div className="relative z-10 space-y-4">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                     <Smile className="w-5 h-5 text-yellow-500 fill-current" /> Social-to-Shop Engine
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                     Hệ thống tự động nhận diện sản phẩm trong ảnh bài viết qua AI Vision. Gắn link mua hàng trực tiếp vào bài viết UGC để rút ngắn hành trình mua sắm từ "Xem nội dung" sang "Mua hàng".
                  </p>
                  <button className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition-all uppercase tracking-widest shadow-lg shadow-blue-500/20">Cấu hình AI Vision</button>
               </div>
               <Users className="absolute -bottom-10 -right-10 w-48 h-48 text-white/5 -rotate-12" />
            </div>
         </div>
      </div>
    </div>
  );
}
