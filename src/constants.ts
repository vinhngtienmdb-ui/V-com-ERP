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
 FileText
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

export const flatNavItems = [
 { icon: Home,        label: 'Trang chủ',              path: '/' },
 { icon: Briefcase,   label: 'Hành chính',              path: '/requests' },
 { icon: Users,       label: 'Nhân sự',                 path: '/hr' },
 { icon: Activity,    label: 'Vận hành',                path: '/workflow' },
 { icon: BarChart3,   label: 'Kinh doanh',              path: '/dashboard' },
 { icon: Megaphone,   label: 'Marketing',               path: '/marketing' },
 { icon: Calculator,  label: 'Tài chính',               path: '/finance' },
 { icon: ShoppingBag, label: 'Mua hàng',                path: '/scm' },
 { icon: Package,     label: 'Sản xuất',                path: '/pim' },
 { icon: Warehouse,   label: 'Kho vận',                 path: '/warehouse' },
 { icon: PieChart,    label: 'Điều hành',               path: '/bi' },
 { icon: Settings,    label: 'Hệ thống',                path: '/settings' },
 { icon: Sparkles,    label: 'Trợ lý AI',               path: '/ai-ops' },
 { icon: Info,        label: 'Thông tin bản quyền',     path: '/settings' },
];

export const HOME_MODULES = [
 { icon: FileText,    label: 'Hành chính',             path: '/requests',  color: 'bg-orange-500',  desc: 'Công văn, hợp đồng, văn thư lưu trữ.' },
 { icon: Users,       label: 'Nhân sự',                path: '/hr',         color: 'bg-emerald-500', desc: 'Tuyển dụng, đào tạo, chấm công, lương.' },
 { icon: Activity,    label: 'Vận hành',               path: '/workflow',   color: 'bg-cyan-500',    desc: 'Quản lý vận hành, giám sát và quy trình. (Placeholder)' },
 { icon: BarChart3,   label: 'Kinh doanh',             path: '/dashboard',  color: 'bg-blue-600',    desc: 'Bán hàng, khách hàng, cơ hội và báo cáo kinh doanh.' },
 { icon: Megaphone,   label: 'Marketing',              path: '/marketing',  color: 'bg-pink-600',    desc: 'Chiến dịch, khách hàng, báo cáo marketing.' },
 { icon: Calculator,  label: 'Tài chính',              path: '/finance',    color: 'bg-orange-600',  desc: 'Kế toán, ngân sách, báo cáo tài chính.' },
 { icon: ShoppingBag, label: 'Mua hàng',               path: '/scm',        color: 'bg-red-500',     desc: 'Đề xuất vật tư, đơn đặt hàng, đối tác.' },
 { icon: Package,     label: 'Sản xuất',               path: '/pim',        color: 'bg-green-600',   desc: 'Kế hoạch sản xuất, quản lý sản xuất.' },
 { icon: Warehouse,   label: 'Kho vận',                path: '/warehouse',  color: 'bg-teal-600',    desc: 'Tồn kho, xuất nhập kho, vận chuyển.' },
 { icon: PieChart,    label: 'Điều hành',              path: '/bi',         color: 'bg-indigo-500',  desc: 'Điều hành, giám sát và vận hành.' },
 { icon: Settings,    label: 'Hệ thống',               path: '/settings',   color: 'bg-slate-700',   desc: 'Cấu hình, phân quyền và nhân sự.' },
 { icon: Sparkles,    label: 'Trợ lý AI',              path: '/ai-ops',     color: 'bg-violet-600',  desc: 'Cấu hình, phân quyền và nhân sự.' },
 { icon: Info,        label: 'Thông tin bản quyền',    path: '/settings',   color: 'bg-blue-500',    desc: 'Quản lý sở hữu trí tuệ và thông tin nhà phát triển.' },
];
