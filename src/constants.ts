import {
  LayoutDashboard,
  ShoppingBag,
  Box,
  Users,
  BarChart3,
  Settings,
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
  Activity,
  Sparkles,
  Building2,
  Monitor,
  Zap,
  Key,
  Home,
  Package,
  Info,
  FileText,
  ShoppingCart,
  Tv,
  Globe,
  CreditCard,
  BadgePercent,
  ClipboardList,
  FilePen,
  FolderOpen,
} from 'lucide-react';

export const navGroups = [
  {
    title: 'Hệ thống chính',
    items: [
      { icon: Home, label: 'Trang chủ', path: '/', color: 'blue', description: 'Tổng quan và truy cập nhanh tất cả module' },
      { icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/dashboard', color: 'indigo', description: 'Báo cáo và thông số vận hành realtime' },
    ]
  },
  {
    title: 'Điều hành & Hệ thống',
    items: [
      { icon: PieChart, label: 'Phân tích dữ liệu', path: '/bi', color: 'violet', description: 'Công cụ BI và phân tích chuyên sâu' },
      { icon: Sparkles, label: 'Trung tâm vận hành AI', path: '/ai-ops', color: 'cyan', description: 'Tối ưu vận hành bằng trí tuệ nhân tạo' },
      { icon: Activity, label: 'Điều hành & Workflow', path: '/workflow', color: 'emerald', description: 'Quản lý quy trình và luồng công việc' },
    ]
  },
  {
    title: 'Hành chính, Pháp lý & Ký số',
    items: [
      { icon: Briefcase, label: 'Đề xuất & Trình ký', path: '/requests', color: 'amber', description: 'Hệ thống phê duyệt và trình ký điện tử' },
      { icon: Scale, label: 'Hợp đồng & Pháp chế', path: '/contracts', color: 'slate', description: 'Quản lý kho hợp đồng và tuân thủ' },
      { icon: Zap, label: 'Quản lý Công văn', path: '/documents', color: 'orange', description: 'Số hóa và lưu trữ văn bản đến/đi' },
      { icon: Key, label: 'Trung tâm Ký số', path: '/signature', color: 'blue', description: 'Quản lý chữ ký số và xác thực doanh nghiệp' },
    ]
  },
  {
    title: 'Kinh doanh Đa kênh',
    items: [
      { icon: Monitor, label: 'iPOS Phần mềm bán hàng', path: '/ipos', color: 'sky', description: 'Hệ thống bán hàng tại quầy và thiết bị' },
      { icon: ShoppingBag, label: 'Quản lý Đơn hàng', path: '/orders', color: 'rose', description: 'Xử lý đơn hàng đa nền tảng tập trung' },
      { icon: Video, label: 'Quản lý Livestream', path: '/live', color: 'pink', description: 'Giải pháp bán hàng qua video trực tiếp' },
      { icon: MessageCircle, label: 'Mạng xã hội người dùng', path: '/social', color: 'indigo', description: 'Tương tác cộng đồng và Social Commerce' },
    ]
  },
  {
    title: 'Sản phẩm & Marketing',
    items: [
      { icon: Box, label: 'Quản lý sản phẩm', path: '/pim', color: 'teal', description: 'Thông tin sản phẩm tập trung (PIM)' },
      { icon: Megaphone, label: 'Marketing & Social', path: '/marketing', color: 'red', description: 'Chiến dịch tiếp thị và quảng bá' },
      { icon: Zap, label: 'Flash Sale & Mua chung', path: '/flash-sale', color: 'yellow', description: 'Quản lý chương trình khuyến mãi giờ vàng' },
      { icon: Share2, label: 'KOL/KOC & Affiliate', path: '/affiliate', color: 'purple', description: 'Mạng lưới cộng tác viên và tiếp thị liên kết' },
      { icon: Gem, label: 'Khách hàng thân thiết', path: '/loyalty', color: 'fuchsia', description: 'Chương trình điểm thưởng và hạng thành viên' },
      { icon: Megaphone, label: 'Quản lý Quảng cáo (Ads)', path: '/ads', color: 'blue', description: 'Tối ưu ngân sách và hiệu quả quảng cáo' },
    ]
  },
  {
    title: 'Chuỗi cung ứng & Kho',
    items: [
      { icon: Warehouse, label: 'Quản trị Kho vận', path: '/warehouse', color: 'amber', description: 'Tối ưu tồn kho và quản lý kho bãi' },
      { icon: ShoppingBag, label: 'Mua hàng & NCC', path: '/scm', color: 'lime', description: 'Quản lý nhà cung cấp và thu mua' },
      { icon: Scale, label: 'Tuân thủ & Pháp chế', path: '/compliance', color: 'gray', description: 'Đảm bảo tiêu chuẩn vận hành toàn chuỗi' },
    ]
  },
  {
    title: 'Tài chính & Thanh toán',
    items: [
      { icon: Calculator, label: 'Tài chính - Kế toán', path: '/finance', color: 'emerald', description: 'Báo cáo tài chính và hạch toán kế toán' },
      { icon: Wallet, label: 'Đối soát & Công nợ', path: '/settlement', color: 'sky', description: 'Tự động đối soát và quản lý công nợ' },
      { icon: Smartphone, label: 'Ví & Thanh toán', path: '/wallet', color: 'indigo', description: 'Xử lý giao dịch và cổng thanh toán' },
      { icon: Banknote, label: 'Hỗ trợ Tài chính Nhà bán', path: '/seller-finance', color: 'blue', description: 'Gói vay và hỗ trợ vốn cho nhà bán' },
    ]
  },
  {
    title: 'Đối tác & Khách hàng',
    items: [
      { icon: Store, label: 'Nhà bán hàng', path: '/sellers', color: 'cyan', description: 'Hệ thống quản lý đối tác nhà bán hàng' },
      { icon: Users, label: 'Khách hàng (CRM)', path: '/customers', color: 'indigo', description: 'Quản lý quan hệ khách hàng đa kênh' },
      { icon: Headphones, label: 'Chăm sóc Khách hàng', path: '/cskh', color: 'blue', description: 'Tổng đài và hỗ trợ sau bán hàng' },
      { icon: UserPlus2, label: 'Đội ngũ Kinh doanh', path: '/sales', color: 'teal', description: 'Quản lý sales và chỉ tiêu doanh số' },
    ]
  },
  {
    title: 'Nhân sự & Tổ chức',
    items: [
      { icon: UserCircle, label: 'Quản trị Nhân sự (HRM)', path: '/hr', color: 'rose', description: 'Tuyển dụng, hồ sơ và chế độ nhân viên' },
      { icon: Building2, label: 'Sơ đồ tổ chức', path: '/org', color: 'slate', description: 'Quản lý cấu trúc và phân quyền tổ chức' },
      { icon: Trophy, label: 'Hiệu suất & Đào tạo', path: '/performance', color: 'amber', description: 'Đánh giá KPI và lộ trình phát triển' },
      { icon: Briefcase, label: 'Không gian làm việc', path: '/workspace', color: 'indigo', description: 'Cộng tác nội bộ và chia sẻ tài liệu' },
    ]
  },
  {
    title: 'Cấu hình',
    items: [
      { icon: Settings, label: 'Cấu hình hệ thống', path: '/settings', color: 'gray', description: 'Thiết lập tham số và vận hành hệ thống' },
    ]
  }
];

// Flat nav dùng cho Sidebar mới — giữ đầy đủ tất cả module, phân nhóm bằng divider
export interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  section?: string; // tên nhóm — hiển thị divider khi khác nhóm trước
}

export const flatNavItems: NavItem[] = [
  // ── Hệ thống chính ──
  { icon: Home,           label: 'Trang chủ',              path: '/',             section: 'Hệ thống' },
  { icon: LayoutDashboard,label: 'Bảng điều khiển',        path: '/dashboard',    section: 'Hệ thống' },
  { icon: PieChart,       label: 'Phân tích dữ liệu',      path: '/bi',           section: 'Hệ thống' },
  { icon: Sparkles,       label: 'Trung tâm AI',           path: '/ai-ops',       section: 'Hệ thống' },
  { icon: Activity,       label: 'Workflow',               path: '/workflow',     section: 'Hệ thống' },

  // ── Hành chính & Pháp lý ──
  { icon: Briefcase,      label: 'Đề xuất & Trình ký',     path: '/requests',     section: 'Hành chính' },
  { icon: Scale,          label: 'Hợp đồng',               path: '/contracts',    section: 'Hành chính' },
  { icon: FolderOpen,     label: 'Quản lý Công văn',       path: '/documents',    section: 'Hành chính' },
  { icon: Key,            label: 'Trung tâm Ký số',        path: '/signature',    section: 'Hành chính' },

  // ── Kinh doanh ──
  { icon: Monitor,        label: 'iPOS',                   path: '/ipos',         section: 'Kinh doanh' },
  { icon: ShoppingBag,    label: 'Đơn hàng',               path: '/orders',       section: 'Kinh doanh' },
  { icon: Video,          label: 'Livestream',             path: '/live',         section: 'Kinh doanh' },
  { icon: MessageCircle,  label: 'Social Commerce',        path: '/social',       section: 'Kinh doanh' },
  { icon: UserPlus2,      label: 'Đội ngũ Kinh doanh',    path: '/sales',        section: 'Kinh doanh' },

  // ── Sản phẩm & Marketing ──
  { icon: Box,            label: 'Quản lý sản phẩm',       path: '/pim',          section: 'Marketing' },
  { icon: Megaphone,      label: 'Marketing',              path: '/marketing',    section: 'Marketing' },
  { icon: Zap,            label: 'Flash Sale',             path: '/flash-sale',   section: 'Marketing' },
  { icon: Share2,         label: 'KOL / Affiliate',        path: '/affiliate',    section: 'Marketing' },
  { icon: Gem,            label: 'Loyalty',                path: '/loyalty',      section: 'Marketing' },
  { icon: BarChart3,      label: 'Quảng cáo (Ads)',        path: '/ads',          section: 'Marketing' },

  // ── Kho & Chuỗi cung ứng ──
  { icon: Warehouse,      label: 'Kho vận',                path: '/warehouse',    section: 'Kho & SCM' },
  { icon: ClipboardList,  label: 'Mua hàng & NCC',         path: '/scm',          section: 'Kho & SCM' },
  { icon: Scale,          label: 'Tuân thủ',               path: '/compliance',   section: 'Kho & SCM' },

  // ── Tài chính ──
  { icon: Calculator,     label: 'Tài chính - Kế toán',    path: '/finance',      section: 'Tài chính' },
  { icon: Wallet,         label: 'Đối soát & Công nợ',     path: '/settlement',   section: 'Tài chính' },
  { icon: Smartphone,     label: 'Ví & Thanh toán',        path: '/wallet',       section: 'Tài chính' },
  { icon: Banknote,       label: 'TC Nhà bán hàng',        path: '/seller-finance', section: 'Tài chính' },

  // ── Đối tác & Khách hàng ──
  { icon: Store,          label: 'Nhà bán hàng',           path: '/sellers',      section: 'Khách hàng' },
  { icon: Users,          label: 'Khách hàng (CRM)',        path: '/customers',    section: 'Khách hàng' },
  { icon: Headphones,     label: 'CSKH',                   path: '/cskh',         section: 'Khách hàng' },

  // ── Nhân sự ──
  { icon: UserCircle,     label: 'Nhân sự (HRM)',           path: '/hr',           section: 'Nhân sự' },
  { icon: Building2,      label: 'Sơ đồ tổ chức',          path: '/org',          section: 'Nhân sự' },
  { icon: Trophy,         label: 'Hiệu suất & Đào tạo',   path: '/performance',  section: 'Nhân sự' },
  { icon: Briefcase,      label: 'Workspace',              path: '/workspace',    section: 'Nhân sự' },

  // ── Cấu hình ──
  { icon: Settings,       label: 'Cấu hình hệ thống',      path: '/settings',     section: 'Cấu hình' },
];

export const HOME_MODULES = [
  // Hệ thống chính
  { icon: LayoutDashboard, label: 'Bảng điều khiển',      path: '/dashboard',      color: 'bg-indigo-600',  desc: 'Báo cáo và thông số vận hành realtime.' },
  { icon: PieChart,        label: 'Phân tích dữ liệu',    path: '/bi',             color: 'bg-violet-600',  desc: 'Công cụ BI, RFM, LTV và phân tích chuyên sâu.' },
  { icon: Sparkles,        label: 'Trung tâm AI',         path: '/ai-ops',         color: 'bg-cyan-500',    desc: 'Tối ưu vận hành bằng trí tuệ nhân tạo.' },
  { icon: Activity,        label: 'Workflow',             path: '/workflow',       color: 'bg-emerald-500', desc: 'Quản lý quy trình và luồng công việc.' },
  // Hành chính
  { icon: Briefcase,       label: 'Đề xuất & Trình ký',   path: '/requests',       color: 'bg-amber-500',   desc: 'Hệ thống phê duyệt và trình ký điện tử.' },
  { icon: Scale,           label: 'Hợp đồng',             path: '/contracts',      color: 'bg-slate-600',   desc: 'Quản lý kho hợp đồng và tuân thủ pháp lý.' },
  { icon: FolderOpen,      label: 'Quản lý Công văn',     path: '/documents',      color: 'bg-orange-500',  desc: 'Số hóa và lưu trữ văn bản đến/đi.' },
  { icon: Key,             label: 'Trung tâm Ký số',      path: '/signature',      color: 'bg-blue-600',    desc: 'Quản lý chữ ký số và xác thực doanh nghiệp.' },
  // Kinh doanh
  { icon: Monitor,         label: 'iPOS',                 path: '/ipos',           color: 'bg-sky-500',     desc: 'Hệ thống bán hàng tại quầy và thiết bị.' },
  { icon: ShoppingBag,     label: 'Đơn hàng',             path: '/orders',         color: 'bg-rose-500',    desc: 'Xử lý đơn hàng đa nền tảng tập trung.' },
  { icon: Video,           label: 'Livestream',           path: '/live',           color: 'bg-pink-500',    desc: 'Giải pháp bán hàng qua video trực tiếp.' },
  { icon: MessageCircle,   label: 'Social Commerce',      path: '/social',         color: 'bg-indigo-500',  desc: 'Tương tác cộng đồng và Social Commerce.' },
  { icon: UserPlus2,       label: 'Đội ngũ Kinh doanh',  path: '/sales',          color: 'bg-teal-500',    desc: 'Quản lý sales và chỉ tiêu doanh số.' },
  // Marketing
  { icon: Box,             label: 'Quản lý sản phẩm',    path: '/pim',            color: 'bg-teal-600',    desc: 'Thông tin sản phẩm tập trung (PIM).' },
  { icon: Megaphone,       label: 'Marketing',            path: '/marketing',      color: 'bg-red-500',     desc: 'Chiến dịch tiếp thị và quảng bá đa kênh.' },
  { icon: Zap,             label: 'Flash Sale',           path: '/flash-sale',     color: 'bg-yellow-500',  desc: 'Quản lý chương trình khuyến mãi giờ vàng.' },
  { icon: Share2,          label: 'KOL / Affiliate',      path: '/affiliate',      color: 'bg-purple-500',  desc: 'Mạng lưới cộng tác viên và tiếp thị liên kết.' },
  { icon: Gem,             label: 'Loyalty',              path: '/loyalty',        color: 'bg-fuchsia-500', desc: 'Chương trình điểm thưởng và hạng thành viên.' },
  { icon: BarChart3,       label: 'Quảng cáo (Ads)',      path: '/ads',            color: 'bg-blue-500',    desc: 'Tối ưu ngân sách và hiệu quả quảng cáo.' },
  // Kho & SCM
  { icon: Warehouse,       label: 'Kho vận',              path: '/warehouse',      color: 'bg-amber-600',   desc: 'Tối ưu tồn kho và quản lý kho bãi.' },
  { icon: ClipboardList,   label: 'Mua hàng & NCC',       path: '/scm',            color: 'bg-lime-600',    desc: 'Quản lý nhà cung cấp và thu mua vật tư.' },
  { icon: Scale,           label: 'Tuân thủ',             path: '/compliance',     color: 'bg-gray-600',    desc: 'Đảm bảo tiêu chuẩn vận hành toàn chuỗi.' },
  // Tài chính
  { icon: Calculator,      label: 'Tài chính - Kế toán',  path: '/finance',        color: 'bg-emerald-600', desc: 'Báo cáo tài chính và hạch toán kế toán.' },
  { icon: Wallet,          label: 'Đối soát & Công nợ',   path: '/settlement',     color: 'bg-sky-600',     desc: 'Tự động đối soát và quản lý công nợ.' },
  { icon: Smartphone,      label: 'Ví & Thanh toán',      path: '/wallet',         color: 'bg-indigo-500',  desc: 'Xử lý giao dịch và cổng thanh toán.' },
  { icon: Banknote,        label: 'TC Nhà bán hàng',      path: '/seller-finance', color: 'bg-blue-700',    desc: 'Gói vay và hỗ trợ vốn cho nhà bán.' },
  // Đối tác & Khách hàng
  { icon: Store,           label: 'Nhà bán hàng',         path: '/sellers',        color: 'bg-cyan-600',    desc: 'Hệ thống quản lý đối tác nhà bán hàng.' },
  { icon: Users,           label: 'Khách hàng (CRM)',      path: '/customers',      color: 'bg-indigo-600',  desc: 'Quản lý quan hệ khách hàng đa kênh.' },
  { icon: Headphones,      label: 'CSKH',                 path: '/cskh',           color: 'bg-blue-500',    desc: 'Tổng đài và hỗ trợ sau bán hàng.' },
  // Nhân sự
  { icon: UserCircle,      label: 'Nhân sự (HRM)',         path: '/hr',             color: 'bg-rose-500',    desc: 'Tuyển dụng, hồ sơ và chế độ nhân viên.' },
  { icon: Building2,       label: 'Sơ đồ tổ chức',        path: '/org',            color: 'bg-slate-600',   desc: 'Quản lý cấu trúc và phân quyền tổ chức.' },
  { icon: Trophy,          label: 'Hiệu suất & Đào tạo',  path: '/performance',    color: 'bg-amber-600',   desc: 'Đánh giá KPI và lộ trình phát triển.' },
  { icon: Briefcase,       label: 'Workspace',            path: '/workspace',      color: 'bg-indigo-500',  desc: 'Cộng tác nội bộ và chia sẻ tài liệu.' },
  // Cấu hình
  { icon: Settings,        label: 'Cấu hình hệ thống',    path: '/settings',       color: 'bg-slate-700',   desc: 'Thiết lập tham số và vận hành hệ thống.' },
];
