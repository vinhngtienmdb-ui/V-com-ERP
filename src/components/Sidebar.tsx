import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Box, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronRight,
  Store,
  Megaphone,
  Share2,
  Warehouse,
  Calculator,
  Wallet,
  UserCircle,
  Trophy,
  Briefcase,
  PieChart,
  UserPlus2,
  Gem,
  Smartphone,
  Video,
  Headphones,
  Scale,
  Banknote,
  MessageCircle,
  LifeBuoy,
  Activity,
  Sparkles,
  Building2,
  Monitor,
  Zap,
  Key
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const navGroups = [
  {
    title: 'Điều hành & Hệ thống',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
      { icon: PieChart, label: 'Phân tích dữ liệu', path: '/bi' },
      { icon: Sparkles, label: 'Trung tâm vận hành AI', path: '/ai-ops' },
      { icon: Activity, label: 'Điều hành & Workflow', path: '/workflow' },
    ]
  },
  {
    title: 'Hành chính, Pháp lý & Ký số',
    items: [
      { icon: Briefcase, label: 'Đề xuất & Trình ký', path: '/requests' },
      { icon: Scale, label: 'Hợp đồng & Pháp chế', path: '/contracts' },
      { icon: Zap, label: 'Quản lý Công văn', path: '/documents' },
      { icon: Key, label: 'Trung tâm Ký số', path: '/signature' },
    ]
  },
  {
    title: 'Kinh doanh Đa kênh',
    items: [
      { icon: Monitor, label: 'iPOS Phần mềm bán hàng', path: '/ipos' },
      { icon: ShoppingBag, label: 'Quản lý Đơn hàng', path: '/orders' },
      { icon: Video, label: 'Quản lý Livestream', path: '/live' },
      { icon: MessageCircle, label: 'Mạng xã hội người dùng', path: '/social' },
    ]
  },
  {
    title: 'Sản phẩm & Marketing',
    items: [
      { icon: Box, label: 'Quản lý sản phẩm', path: '/pim' },
      { icon: Megaphone, label: 'Marketing & Social', path: '/marketing' },
      { icon: Zap, label: 'Flash Sale & Mua chung', path: '/flash-sale' },
      { icon: Share2, label: 'KOL/KOC & Affiliate', path: '/affiliate' },
      { icon: Gem, label: 'Khách hàng thân thiết', path: '/loyalty' },
      { icon: Megaphone, label: 'Quản lý Quảng cáo (Ads)', path: '/ads' },
    ]
  },
  {
    title: 'Chuỗi cung ứng & Kho',
    items: [
      { icon: Warehouse, label: 'Quản trị Kho vận', path: '/warehouse' },
      { icon: ShoppingBag, label: 'Mua hàng & NCC', path: '/scm' },
      { icon: Scale, label: 'Tuân thủ & Pháp chế', path: '/compliance' },
    ]
  },
  {
    title: 'Tài chính & Thanh toán',
    items: [
      { icon: Calculator, label: 'Tài chính - Kế toán', path: '/finance' },
      { icon: Wallet, label: 'Đối soát & Công nợ', path: '/settlement' },
      { icon: Smartphone, label: 'Ví & Thanh toán', path: '/wallet' },
      { icon: Banknote, label: 'Hỗ trợ Tài chính Seller', path: '/seller-finance' },
    ]
  },
  {
    title: 'Đối tác & Khách hàng',
    items: [
      { icon: Store, label: 'Nhà bán hàng (Seller)', path: '/sellers' },
      { icon: Users, label: 'Khách hàng (CRM)', path: '/customers' },
      { icon: Headphones, label: 'Chăm sóc Khách hàng', path: '/cskh' },
      { icon: UserPlus2, label: 'Đội ngũ Kinh doanh', path: '/sales' },
    ]
  },
  {
    title: 'Nhân sự & Tổ chức',
    items: [
      { icon: UserCircle, label: 'Quản trị Nhân sự (HRM)', path: '/hr' },
      { icon: Building2, label: 'Sơ đồ tổ chức', path: '/org' },
      { icon: Trophy, label: 'Hiệu suất & Đào tạo', path: '/performance' },
      { icon: Briefcase, label: 'Không gian làm việc', path: '/workspace' },
    ]
  },
  {
    title: 'Hệ thống',
    items: [
      { icon: Settings, label: 'Cấu hình hệ thống', path: '/settings' },
    ]
  }
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <aside className="w-[280px] bg-white border-r border-[#E5E7EB] flex flex-col h-full py-6">
      <div className="px-6 mb-8 flex items-center gap-3">
        <div className="w-4 h-4 bg-[#2563EB] rounded-sm transform rotate-45 shadow-lg shadow-blue-500/20"></div>
        <h1 className="text-xl font-black text-[#111827] tracking-tight">
          VComm <span className="text-[#2563EB]">ERP</span>
        </h1>
      </div>

      <nav className="flex-1 px-4 overflow-y-auto custom-scrollbar space-y-6">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            <h3 className="px-4 text-[10px] font-bold text-[#9CA3AF] uppercase tracking-[0.2em] mb-3">
              {group.title}
            </h3>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 group relative",
                      isActive 
                        ? "bg-blue-50 text-[#2563EB] font-bold shadow-sm shadow-blue-100/50" 
                        : "text-[#4B5563] hover:bg-slate-50 hover:text-[#111827]"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-transform duration-200 group-hover:scale-110",
                      isActive ? "text-[#2563EB]" : "text-[#9CA3AF]"
                    )} />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {isActive && (
                      <div className="absolute right-3 w-1.5 h-1.5 bg-[#2563EB] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 mt-auto">
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-[#4B5563] hover:bg-[#F9FAFB] transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
}
