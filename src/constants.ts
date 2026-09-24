import { 
 LayoutDashboard, 
 ShoppingBag, 
 Box, 
 Boxes,
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
 GraduationCap,
 LifeBuoy,
 FolderTree,
 FileBarChart,
 ShieldCheck
} from 'lucide-react';

export const navGroups = [
  {
    title: 'Kinh doanh & Bán hàng',
    items: [
      { icon: ShoppingBag, label: 'Đơn hàng TMĐT', path: '/orders', color: 'rose', description: 'Nền tảng eCommerce cốt lõi: cấp mã vận đơn 3PL và in tem A6' },
      { icon: Store, label: 'Siêu thị VComm (Offline)', path: '/vcomm-supermarket', color: 'emerald', description: 'Quản lý bán hàng offline và tồn kho siêu thị VComm' },
      { icon: Box, label: 'Quản lý sản phẩm (PIM)', path: '/pim', color: 'teal', description: 'Thông tin sản phẩm tập trung và bảng giá' },
      { icon: Store, label: 'Kênh Nhà bán hàng', path: '/sellers', color: 'cyan', description: 'Hệ thống đối tác gian hàng và quản lý seller' },
      { icon: UserPlus2, label: 'Đội ngũ Kinh doanh (Sales)', path: '/sales', color: 'teal', description: 'Quản lý chỉ tiêu doanh số và đội ngũ bán lẻ' },
      { icon: Zap, label: 'Flash Sale & Giờ vàng', path: '/flash-sale', color: 'yellow', description: 'Khuyến mãi giờ vàng, voucher sàn và mua chung' },
      { icon: Video, label: 'Livestream Commerce', path: '/live', color: 'pink', description: 'Giải pháp bán hàng livestream và tương tác video' },
      { icon: Share2, label: 'KOL/KOC & Affiliate', path: '/affiliate', color: 'purple', description: 'Mạng lưới cộng tác viên và tiếp thị liên kết' },
      { icon: Megaphone, label: 'Marketing & Quảng bá', path: '/marketing', color: 'red', description: 'Chiến dịch tiếp thị tự động AI đa kênh' },
      { icon: Megaphone, label: 'Quản lý Quảng cáo (Ads)', path: '/ads', color: 'blue', description: 'Tối ưu ngân sách quảng cáo Facebook & TikTok' },
      { icon: MessageCircle, label: 'Mạng xã hội người dùng', path: '/social', color: 'indigo', description: 'Cộng đồng mua sắm và Social Commerce' },
    ]
  },
  {
    title: 'Khách hàng & Dịch vụ (CSKH)',
    items: [
      { icon: Users, label: 'Khách hàng 360° (CRM)', path: '/customers', color: 'indigo', description: 'Quản lý quan hệ khách hàng và phân khúc RFM' },
      { icon: Headphones, label: 'Chăm sóc Khách hàng', path: '/cskh', color: 'blue', description: 'Tổng đài đa kênh và ticket hỗ trợ sau bán hàng' },
      { icon: MessageCircle, label: 'Trò chuyện OmniChat', path: '/omnichat', color: 'sky', description: 'Kênh chat tập trung Facebook, Zalo OA và Web' },
      { icon: Gem, label: 'Khách hàng thân thiết', path: '/loyalty', color: 'fuchsia', description: 'Chương trình tích điểm và phân hạng VIP' },
    ]
  },
  {
    title: 'Tài chính & Kế toán',
    items: [
      { icon: Calculator, label: 'Kế toán tổng hợp (TT99)', path: '/finance', color: 'emerald', description: 'Báo cáo tài chính chuẩn mực và hạch toán số' },
      { icon: FileBarChart, label: 'Báo cáo & Sổ sách TT99', path: '/finance?tab=tt99_reports', color: 'purple', description: 'B01-DN, B02-DN, Bảng CĐPS F01-DN chuẩn TT99' },
      { icon: ShieldCheck, label: 'Kiểm soát Điều 28 TT99', path: '/finance?tab=tt99_dieu28', color: 'rose', description: 'Khóa sổ kỳ kế toán, đánh số liên tục, Merkle SHA-256' },
      { icon: FolderTree, label: 'Hồ sơ – Lưu trữ kế toán', path: '/ho-so', color: 'indigo', description: 'Chuẩn NĐ 174 & TT99, 18 phần, trích xuất 6 mức' },
      { icon: Wallet, label: 'Đối soát & Công nợ', path: '/settlement', color: 'sky', description: 'Tự động đối soát công nợ 3PL và sàn TMĐT' },
      { icon: Smartphone, label: 'Ví & Cổng thanh toán', path: '/wallet', color: 'indigo', description: 'Xử lý giao dịch SePay QR và cổng thanh toán' },
      { icon: Banknote, label: 'Tài chính Nhà bán (Credit)', path: '/seller-finance', color: 'blue', description: 'Gói giải ngân vốn lưu động và hạn mức tín dụng' },
      { icon: Smartphone, label: 'Cho thuê thiết bị / Knox', path: '/device-leasing', color: 'blue', description: 'Hợp đồng thuê thiết bị và trả góp bảo mật MDM' },
    ]
  },
  {
    title: 'Kho vận & Chuỗi cung ứng',
    items: [
      { icon: Warehouse, label: 'Quản trị Kho vận (WMS)', path: '/warehouse', color: 'amber', description: 'Bản đồ số 2D Digital Twin và điểm ROP tồn kho' },
      { icon: Boxes, label: 'Quản trị Tài sản & CCDC', path: '/assets', color: 'emerald', description: 'Quản lý máy POS, máy in tem, thiết bị kho TT45' },
      { icon: ShoppingBag, label: 'Mua hàng & NCC (SCM)', path: '/scm', color: 'lime', description: 'Đơn đặt hàng nhà cung cấp và chuỗi mua sắm' },
      { icon: Scale, label: 'Tuân thủ & Pháp chế', path: '/compliance', color: 'gray', description: 'Đảm bảo tiêu chuẩn vận hành toàn chuỗi' },
    ]
  },
  {
    title: 'Nhân sự & Đào tạo',
    items: [
      { icon: UserCircle, label: 'Quản trị Nhân sự (HRM)', path: '/hr', color: 'rose', description: 'Tổng thể hồ sơ cán bộ nhân viên và chế độ đãi ngộ' },
      { icon: Trophy, label: 'Hiệu suất KPI & 360°', path: '/performance', color: 'amber', description: 'Đánh giá KPI tính lương hiệu suất và khảo thí 360°' },
      { icon: GraduationCap, label: 'LMS Đào tạo nội bộ', path: '/lms', color: 'indigo', description: 'Học E-learning, thi trắc nghiệm và chứng chỉ số' },
      { icon: Building2, label: 'Sơ đồ cơ cấu tổ chức', path: '/org', color: 'slate', description: 'Sơ đồ cây phòng ban và ma trận chức danh' },
    ]
  },
  {
    title: 'Văn phòng số & Điều hành',
    items: [
      { icon: Home, label: 'Trang chủ Portal', path: '/', color: 'blue', description: 'Tổng quan và truy cập nhanh tất cả module' },
      { icon: LayoutDashboard, label: 'Bảng điều khiển', path: '/dashboard', color: 'indigo', description: 'Báo cáo và thông số vận hành realtime' },
      { icon: PieChart, label: 'Phân tích dữ liệu (BI)', path: '/bi', color: 'violet', description: 'Công cụ BI và phân tích chuyên sâu cho lãnh đạo' },
      { icon: Sparkles, label: 'Trung tâm vận hành AI', path: '/ai-ops', color: 'cyan', description: 'Tối ưu vận hành tự động bằng trí tuệ nhân tạo' },
      { icon: Activity, label: 'Điều hành & Workflow', path: '/workflow', color: 'emerald', description: 'Quản lý quy trình và luồng công việc phê duyệt' },
      { icon: Briefcase, label: 'Đề xuất & Trình ký', path: '/requests', color: 'amber', description: 'Hệ thống phê duyệt và trình ký điện tử' },
      { icon: Scale, label: 'Hợp đồng kinh tế', path: '/contracts', color: 'slate', description: 'Quản lý kho hợp đồng và tuân thủ pháp lý' },
      { icon: Key, label: 'Ký số & Cloud HSM', path: '/signature', color: 'blue', description: 'Chữ ký số Cloud HSM công ty và chứng thư cá nhân' },
      { icon: Briefcase, label: 'Không gian làm việc', path: '/workspace', color: 'indigo', description: 'Cộng tác nội bộ và chia sẻ tài liệu' },
    ]
  },
  {
    title: 'Hệ thống & IT Helpdesk',
    items: [
      { icon: LifeBuoy, label: 'IT & Helpdesk', path: '/it-helpdesk', color: 'cyan', description: 'Tiếp nhận ticket sự cố IT, SLA/MTTR và bản quyền số' },
      { icon: Settings, label: 'Cấu hình hệ thống', path: '/settings', color: 'gray', description: 'Thiết lập tham số, bảo mật và phân quyền RBAC' },
    ]
  }
];
