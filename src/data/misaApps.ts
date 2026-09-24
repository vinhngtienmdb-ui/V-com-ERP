import { 
  Settings,
  Calculator,
  Landmark,
  FileCheck2,
  Receipt,
  CreditCard,
  Key,
  Building,
  FileText,
  ShoppingBag,
  Percent,
  Megaphone,
  Share2,
  Users,
  Store,
  Utensils,
  DollarSign,
  HeartHandshake,
  UserCheck,
  UserCog,
  Phone,
  Fingerprint,
  Star,
  Target,
  Contact,
  FolderGit2,
  GitPullRequest,
  Briefcase,
  Video,
  Inbox,
  MessageSquare,
  FileEdit,
  BarChart3,
  Boxes,
  Globe2,
  Sparkles,
  Mail,
  Warehouse,
  Truck,
  Building2,
  Headphones,
  Shield,
  FileSignature,
  TrendingUp,
  LineChart,
  Link2,
  FolderOpen,
  ShieldAlert,
  CheckSquare,
  Radio,
  Crown,
  ShoppingCart,
  Scale,
  GraduationCap,
  LifeBuoy,
  Smartphone,
  LucideIcon
} from 'lucide-react';

export type MisaCategory = 
  | 'my_apps'
  | 'kinh_doanh'
  | 'cskh'
  | 'tai_chinh'
  | 'chuoi_cung_ung'
  | 'nhan_su'
  | 'van_phong_so'
  | 'he_thong_it';

export interface MisaAppItem {
  id: string;
  name: string;
  category: MisaCategory;
  path: string;
  icon: LucideIcon;
  color: string;
  isBeta?: boolean;
  isPrimary?: boolean;
  badgeText?: string;
  description: string;
}

export const CATEGORY_GROUPS = [
  { id: 'all', title: 'Tất cả ứng dụng', color: 'text-slate-200' },
  { id: 'my_apps', title: '⭐ Ứng dụng của tôi', color: 'text-amber-400' },
  { id: 'kinh_doanh', title: 'Kinh doanh & Bán hàng', color: 'text-rose-400' },
  { id: 'cskh', title: 'CSKH & Dịch vụ', color: 'text-orange-400' },
  { id: 'tai_chinh', title: 'Tài chính & Kế toán', color: 'text-emerald-400' },
  { id: 'chuoi_cung_ung', title: 'Kho & Chuỗi cung ứng', color: 'text-blue-400' },
  { id: 'nhan_su', title: 'Nhân sự & Đào tạo', color: 'text-amber-400' },
  { id: 'van_phong_so', title: 'Văn phòng số & Điều hành', color: 'text-indigo-400' },
  { id: 'he_thong_it', title: 'Hệ thống & IT', color: 'text-cyan-400' },
] as const;

export const MISA_APPS: MisaAppItem[] = [
  // --- ROW 1: Quản trị & Nhân sự cốt lõi ---
  {
    id: 'nhan_su',
    name: 'Nhân sự',
    category: 'nhan_su',
    path: '/hr',
    icon: UserCog,
    color: 'from-blue-600 to-indigo-700',
    isPrimary: true,
    badgeText: 'Tổng thể',
    description: 'Tổng quan quản trị nhân sự HRM, cơ cấu tổ chức và hồ sơ nhân viên'
  },
  {
    id: 'cong_nhan_vien',
    name: 'Cổng nhân viên',
    category: 'nhan_su',
    path: '/ess',
    icon: Fingerprint,
    color: 'from-emerald-500 to-teal-600',
    badgeText: 'Tự phục vụ',
    description: 'Chấm công GPS 1-chạm, nộp đơn nghỉ phép/OT và tra cứu phiếu lương điện tử'
  },
  {
    id: 'he_thong',
    name: 'Hệ thống',
    category: 'he_thong_it',
    path: '/settings',
    icon: Settings,
    color: 'from-slate-600 to-slate-700',
    description: 'Cấu hình tham số hệ thống, phân quyền và bảo mật doanh nghiệp'
  },
  {
    id: 'tien_luong',
    name: 'Tiền lương',
    category: 'nhan_su',
    path: '/payroll',
    icon: DollarSign,
    color: 'from-emerald-500 to-green-600',
    description: 'Tính lương tự động, bảng lương và chuyển khoản ngân hàng'
  },
  {
    id: 'bao_hiem_xa_hoi',
    name: 'Bảo hiểm',
    category: 'nhan_su',
    path: '/insurance',
    icon: HeartHandshake,
    color: 'from-emerald-400 to-teal-600',
    description: 'Quản lý đóng nộp BHXH, BHYT, BHTN theo chuẩn nhà nước'
  },
  {
    id: 'tuyen_dung',
    name: 'Tuyển dụng',
    category: 'nhan_su',
    path: '/recruitment',
    icon: UserCheck,
    color: 'from-blue-500 to-indigo-600',
    description: 'Phễu tuyển dụng Kanban, quản lý ứng viên, lịch phỏng vấn và Scorecard'
  },

  // --- ROW 2: Nhân sự chi tiết & Tài chính cơ bản ---
  {
    id: 'danh_ba',
    name: 'Danh bạ',
    category: 'nhan_su',
    path: '/directory',
    icon: Phone,
    color: 'from-purple-500 to-indigo-600',
    description: 'Tra cứu thông tin liên lạc, máy lẻ VoIP và sơ đồ cây tổ chức trực quan'
  },
  {
    id: 'nhan_vien',
    name: 'Nhân viên',
    category: 'nhan_su',
    path: '/employees',
    icon: Contact,
    color: 'from-violet-500 to-purple-600',
    description: 'Hồ sơ nhân viên, hợp đồng lao động và quyết định bổ nhiệm'
  },
  {
    id: 'cham_cong',
    name: 'Chấm công',
    category: 'nhan_su',
    path: '/attendance',
    icon: Fingerprint,
    color: 'from-orange-500 to-amber-500',
    description: 'Chấm công vân tay, FaceID, định vị GPS và đơn xin nghỉ phép'
  },
  {
    id: 'danh_gia',
    name: 'Đánh giá',
    category: 'nhan_su',
    path: '/performance',
    icon: Star,
    color: 'from-green-500 to-emerald-600',
    description: 'Đánh giá hiệu suất KPI, khung năng lực và xếp loại'
  },
  {
    id: 'thue_tncn',
    name: 'Thuế TNCN',
    category: 'tai_chinh',
    path: '/tax-pit',
    icon: Receipt,
    color: 'from-sky-500 to-blue-600',
    description: 'Biểu thuế lũy tiến 7 bậc, quản lý người phụ thuộc và tờ khai 05/KK-TNCN'
  },

  // --- ROW 3: Mục tiêu, Kinh doanh & Văn phòng số ---
  {
    id: 'muc_tieu',
    name: 'Mục tiêu',
    category: 'nhan_su',
    path: '/okr',
    icon: Target,
    color: 'from-blue-500 to-cyan-500',
    description: 'Quản trị mục tiêu chiến lược OKRs toàn công ty, phòng ban và kết quả then chốt'
  },
  {
    id: 'khuyen_mai',
    name: 'Khuyến mại',
    category: 'kinh_doanh',
    path: '/flash-sale',
    icon: Percent,
    color: 'from-purple-500 to-indigo-500',
    description: 'Flash Sale, Voucher sàn, Mua chung và Vòng quay may mắn'
  },
  {
    id: 'aimarketing',
    name: 'Marketing',
    category: 'kinh_doanh',
    path: '/marketing',
    icon: Megaphone,
    color: 'from-rose-500 to-orange-500',
    description: 'Tự động phân tích và tiếp thị đa kênh bằng Gemini AI'
  },
  {
    id: 'crm',
    name: 'Khách hàng',
    category: 'cskh',
    path: '/customers',
    icon: Users,
    color: 'from-blue-600 to-indigo-600',
    description: 'Quản lý quan hệ khách hàng, cơ hội bán hàng và phân khúc RFM'
  },
  {
    id: 'tai_lieu_dien_tu',
    name: 'Tài liệu',
    category: 'van_phong_so',
    path: '/dochub',
    icon: FolderOpen,
    color: 'from-blue-600 to-indigo-600',
    description: 'Kho lưu trữ tài liệu số đa cấp, phân quyền RBAC và bảo mật số'
  },

  // --- ROW 4: Tuân thủ, Kế toán, Đơn hàng, Chuỗi cung ứng ---
  {
    id: 'quan_ly_lao_dong',
    name: 'Luật lao động',
    category: 'nhan_su',
    path: '/labor-compliance',
    icon: ShieldAlert,
    color: 'from-rose-500 to-amber-600',
    description: 'Sổ quản lý lao động điện tử, quét rủi ro pháp lý & máy tính phạt NĐ 283'
  },
  {
    id: 'ke_toan',
    name: 'Kế toán',
    category: 'tai_chinh',
    path: '/finance',
    icon: Calculator,
    color: 'from-cyan-400 to-blue-600',
    description: 'Kế toán tài chính Thông tư 99, sổ cái kép và báo cáo thuế'
  },
  {
    id: 'don_hang_tmdt',
    name: 'Đơn hàng',
    category: 'kinh_doanh',
    path: '/orders',
    icon: ShoppingBag,
    color: 'from-rose-500 to-red-600',
    isPrimary: true,
    badgeText: 'Nền tảng',
    description: 'Nền tảng eCommerce cốt lõi: tự động đẩy GHN/GHTK, in tem A6'
  },
  {
    id: 'san_pham',
    name: 'Sản phẩm',
    category: 'kinh_doanh',
    path: '/pim',
    icon: Boxes,
    color: 'from-amber-500 to-orange-600',
    description: 'Quản lý thông tin và danh mục sản phẩm PIM/Catalog, mã vạch Barcode và SKU'
  },
  {
    id: 'nha_ban_hang',
    name: 'Nhà bán hàng',
    category: 'kinh_doanh',
    path: '/sellers',
    icon: Building2,
    color: 'from-indigo-500 to-violet-600',
    description: 'Quản trị đối tác bán hàng Sellers/Vendors và hạn mức gian hàng Marketplace'
  },

  // --- ROW 5: Bán hàng, Storefront, F&B, Thanh toán ---
  {
    id: 'ban_hang_da_kenh',
    name: 'Đa kênh',
    category: 'kinh_doanh',
    path: '/sales',
    icon: Share2,
    color: 'from-indigo-500 to-purple-600',
    description: 'Đồng bộ doanh số chuỗi cửa hàng liên minh iPOS và điểm bán lẻ'
  },
  {
    id: 'website_ban_hang',
    name: 'Cửa hàng web',
    category: 'kinh_doanh',
    path: '/storefront',
    icon: Store,
    color: 'from-pink-500 to-rose-600',
    description: 'Quản trị giao diện shop.vcomm.vn, banner slider, SEO Google & chính sách bán lẻ'
  },
  {
    id: 'nha_hang',
    name: 'Nhà hàng',
    category: 'kinh_doanh',
    path: '/e-menu',
    icon: Utensils,
    color: 'from-amber-400 to-orange-500',
    description: 'Quản lý quán ăn, thực đơn E-Menu và tích/tiêu điểm V-Xu'
  },
  {
    id: 'cong_thanh_toan',
    name: 'Thanh toán',
    category: 'tai_chinh',
    path: '/wallet',
    icon: CreditCard,
    color: 'from-indigo-500 to-blue-600',
    description: 'Dynamic VietQR, Open Banking, ví MoMo/ZaloPay, thẻ Napas/Visa'
  },
  {
    id: 'doi_soat',
    name: 'Đối soát',
    category: 'tai_chinh',
    path: '/settlement',
    icon: Scale,
    color: 'from-teal-500 to-cyan-700',
    description: 'Quyết toán và đối soát doanh thu sàn TMĐT, khấu trừ phí nền tảng'
  },

  // --- ROW 6: Thuế, Chữ ký số, Hóa đơn, Kho hàng, Mua hàng ---
  {
    id: 'thue_dien_tu',
    name: 'Thuế',
    category: 'tai_chinh',
    path: '/finance?tab=tax',
    icon: Receipt,
    color: 'from-blue-600 to-indigo-600',
    description: 'Khấu trừ thuế 1% GTGT + 0.5% TNCN và báo cáo Thuế tự động'
  },
  {
    id: 'chu_ky_so',
    name: 'Chữ ký số',
    category: 'van_phong_so',
    path: '/signature',
    icon: Key,
    color: 'from-purple-500 to-indigo-600',
    badgeText: 'Cloud HSM',
    description: 'Quản trị Chữ ký số Cloud HSM công ty, cấp phát chứng thư số cá nhân và ký số an toàn'
  },
  {
    id: 'hoa_don_dien_tu',
    name: 'Hóa đơn',
    category: 'tai_chinh',
    path: '/invoices',
    icon: FileText,
    color: 'from-cyan-500 to-blue-600',
    description: 'Phát hành HĐĐT ký hiệu 1C26TBB, ký số HSM Cloud và cấp mã CQT theo TT 78'
  },
  {
    id: 'kho_hang',
    name: 'Kho hàng',
    category: 'chuoi_cung_ung',
    path: '/warehouse',
    icon: Warehouse,
    color: 'from-blue-600 to-indigo-700',
    description: 'Quản trị Multi-WMS từ 3 - 10 kho vật lý, kho tổng FBL'
  },
  {
    id: 'mua_hang',
    name: 'Mua hàng',
    category: 'chuoi_cung_ung',
    path: '/procurement',
    icon: ShoppingBag,
    color: 'from-teal-500 to-cyan-600',
    description: 'Lập PO mua hàng 1P, phê duyệt đơn hàng nhập kho'
  },

  // --- ROW 7: Nhà cung cấp, Giao vận, CSKH, Công việc, Phê duyệt ---
  {
    id: 'cong_nha_cung_cap',
    name: 'Nhà cung cấp',
    category: 'chuoi_cung_ung',
    path: '/supplier-portal',
    icon: Building2,
    color: 'from-emerald-500 to-teal-700',
    description: 'Cổng đối tác tự phục vụ: nhận đơn PO, gửi phiếu giao hàng'
  },
  {
    id: 'dieu_phoi_giao_van',
    name: 'Giao vận',
    category: 'chuoi_cung_ung',
    path: '/orders?tab=routing',
    icon: Truck,
    color: 'from-indigo-600 to-blue-700',
    description: 'Thuật toán Smart Order Routing định tuyến kho gần nhất'
  },
  {
    id: 'cskh_da_kenh',
    name: 'CSKH',
    category: 'cskh',
    path: '/cskh',
    icon: Headphones,
    color: 'from-rose-500 to-orange-500',
    description: 'Tổng đài thoại VoIP, Omni-chat Zalo/FB và xử lý khiếu nại'
  },
  {
    id: 'cong_viec',
    name: 'Công việc',
    category: 'van_phong_so',
    path: '/workspace',
    icon: Briefcase,
    color: 'from-emerald-500 to-teal-600',
    description: 'Giao việc, nhắc việc và quản lý tiến độ công việc cá nhân'
  },
  {
    id: 'phe_duyet',
    name: 'Phê duyệt',
    category: 'van_phong_so',
    path: '/requests',
    icon: CheckSquare,
    color: 'from-cyan-500 to-blue-600',
    description: 'Cổng xét duyệt tờ trình, duyệt chi, đề xuất và thẩm quyền đa cấp'
  },

  // --- ROW 8: Quy trình, Phòng họp, Văn thư, Rủi ro, Trò chuyện ---
  {
    id: 'quy_trinh',
    name: 'Quy trình',
    category: 'van_phong_so',
    path: '/workflow?tab=builder',
    icon: GitPullRequest,
    color: 'from-teal-500 to-emerald-600',
    isBeta: true,
    badgeText: 'Studio',
    description: 'Công cụ vẽ luồng công việc tự động kéo thả trực quan theo chuẩn BPMN'
  },
  {
    id: 'phong_hop',
    name: 'Phòng họp',
    category: 'van_phong_so',
    path: '/workspace?tab=meeting',
    icon: Video,
    color: 'from-purple-500 to-indigo-600',
    description: 'Đặt lịch phòng họp thông minh và chia sẻ tài liệu họp'
  },
  {
    id: 'van_thu',
    name: 'Văn thư',
    category: 'van_phong_so',
    path: '/official-dispatch',
    icon: Inbox,
    color: 'from-orange-500 to-amber-600',
    description: 'Quản lý văn bản đến, đi, nội bộ và luân chuyển chuẩn E-Office'
  },
  {
    id: 'quan_tri_rui_ro',
    name: 'Rủi ro',
    category: 'van_phong_so',
    path: '/compliance',
    icon: Shield,
    color: 'from-purple-600 to-indigo-700',
    description: 'Ma trận Heatmap 5x5, Risk Register, KRI và kế hoạch giảm thiểu ISO 31000'
  },
  {
    id: 'chat_noi_bo',
    name: 'Trò chuyện',
    category: 'cskh',
    path: '/omnichat',
    icon: MessageSquare,
    color: 'from-blue-500 to-sky-600',
    description: 'Kênh giao tiếp công việc nhóm và trao đổi công việc bảo mật'
  },

  // --- ROW 9: Ghi chép, Điều hành, Tài sản, Bảng tin, Trợ lý AI ---
  {
    id: 'ghi_chep',
    name: 'Ghi chép',
    category: 'van_phong_so',
    path: '/notes',
    icon: FileEdit,
    color: 'from-amber-400 to-yellow-500',
    description: 'Sổ tay cá nhân điện tử, biên bản họp, to-do checklist và lưu trữ ý tưởng'
  },
  {
    id: 'dieu_hanh',
    name: 'Điều hành',
    category: 'van_phong_so',
    path: '/operations',
    icon: BarChart3,
    color: 'from-purple-600 to-indigo-700',
    description: 'Trung tâm chỉ huy & báo cáo quản trị tổng thể dành cho Ban Lãnh đạo'
  },
  {
    id: 'tai_san',
    name: 'Tài sản',
    category: 'chuoi_cung_ung',
    path: '/assets',
    icon: Boxes,
    color: 'from-emerald-500 to-teal-600',
    description: 'Quản lý máy POS, máy in tem, thiết bị kho và CCDC'
  },
  {
    id: 'cho_thue_thiet_bi',
    name: 'Cho thuê thiết bị',
    category: 'tai_chinh',
    path: '/device-leasing',
    icon: Smartphone,
    color: 'from-blue-600 to-indigo-700',
    description: 'Cho thuê máy POS, điện thoại, trả góp Knox MDM và chấm điểm CIC'
  },
  {
    id: 'mang_xa_hoi',
    name: 'Bảng tin',
    category: 'van_phong_so',
    path: '/social',
    icon: Globe2,
    color: 'from-sky-500 to-blue-600',
    description: 'Bảng tin truyền thông nội bộ và vinh danh nhân sự'
  },
  {
    id: 'agentwork',
    name: 'Trợ lý AI',
    category: 'van_phong_so',
    path: '/ai-ops',
    icon: Sparkles,
    color: 'from-rose-400 to-purple-600',
    description: 'Trợ lý AI tự động: tổng hợp dữ liệu và hỗ trợ ra quyết định'
  },

  // --- ROW 10: Hộp thư, Tín dụng, Kiểm toán, Tập đoàn, Hợp đồng ---
  {
    id: 'mail',
    name: 'Hộp thư',
    category: 'van_phong_so',
    path: '/mail',
    icon: Mail,
    color: 'from-blue-500 to-indigo-600',
    description: 'Email doanh nghiệp kết nối liền mạch với luồng công việc'
  },
  {
    id: 'ket_noi_vay_von',
    name: 'Tín dụng',
    category: 'tai_chinh',
    path: '/seller-credit',
    icon: Landmark,
    color: 'from-teal-400 to-emerald-600',
    description: 'Tài trợ vốn lưu động Techcombank/MB tín chấp dựa trên GMV và dòng tiền ERP'
  },
  {
    id: 'kiem_toan',
    name: 'Kiểm toán',
    category: 'tai_chinh',
    path: '/finance?tab=audit',
    icon: FileCheck2,
    color: 'from-emerald-500 to-teal-700',
    description: 'Nhật ký vết (Audit Trail) giao dịch và cảnh báo gian lận'
  },
  {
    id: 'quan_ly_tap_doan',
    name: 'Tập đoàn',
    category: 'tai_chinh',
    path: '/org',
    icon: Building,
    color: 'from-sky-500 to-blue-700',
    description: 'Hợp nhất báo cáo tài chính chuỗi chi nhánh toàn quốc'
  },
  {
    id: 'hop_dong_dien_tu',
    name: 'Hợp đồng',
    category: 'van_phong_so',
    path: '/contracts',
    icon: FileSignature,
    color: 'from-blue-600 to-indigo-700',
    description: 'Ký số e-Contract từ xa qua Cloud HSM, mộc đỏ số TSA và xác thực pháp lý'
  },

  // --- ROW 11: Tiếp thị, Quảng cáo, Dự báo, Livestream, Hội viên, Siêu thị ---
  {
    id: 'tiep_thi_lien_ket',
    name: 'Tiếp thị',
    category: 'kinh_doanh',
    path: '/affiliate',
    icon: Link2,
    color: 'from-rose-500 to-pink-600',
    description: 'Quản trị mạng lưới Affiliate KOC/Publisher, sinh link UTM và chi trả hoa hồng'
  },
  {
    id: 'quang_cao_ads',
    name: 'Quảng cáo',
    category: 'kinh_doanh',
    path: '/ads',
    icon: Megaphone,
    color: 'from-amber-500 to-orange-600',
    description: 'Chiến dịch quảng cáo đa kênh sàn TMĐT, ngân sách đấu thầu và tối ưu ROI'
  },
  {
    id: 'ai_du_bao_ton_kho',
    name: 'Dự báo',
    category: 'chuoi_cung_ung',
    path: '/ai-predictions',
    icon: Sparkles,
    color: 'from-indigo-600 to-purple-600',
    description: 'AI dự báo chuỗi thời gian nhu cầu mua sắm và tự động sinh đơn đặt hàng PO'
  },
  {
    id: 'livestream',
    name: 'Livestream',
    category: 'kinh_doanh',
    path: '/live',
    icon: Radio,
    color: 'from-rose-500 to-red-600',
    description: 'Bán hàng trực tiếp qua Livestream, ghim sản phẩm giỏ hàng và chốt đơn tự động'
  },
  {
    id: 'hoi_vien',
    name: 'Hội viên',
    category: 'cskh',
    path: '/loyalty',
    icon: Crown,
    color: 'from-amber-400 to-yellow-600',
    description: 'Chăm sóc khách hàng thân thiết, tích lũy điểm V-Xu và đổi voucher ưu đãi'
  },
  {
    id: 'sieu_thi',
    name: 'Siêu thị',
    category: 'kinh_doanh',
    path: '/vcomm-supermarket',
    icon: ShoppingCart,
    color: 'from-emerald-500 to-teal-600',
    description: 'Siêu thị bách hóa O2O, kết nối kệ hàng thực địa và điểm bán lẻ POS'
  },
  {
    id: 'it_helpdesk',
    name: 'IT & Helpdesk',
    category: 'he_thong_it',
    path: '/it-helpdesk',
    icon: LifeBuoy,
    color: 'from-cyan-600 to-blue-700',
    badgeText: 'Mới',
    description: 'Tiếp nhận ticket sự cố P1-P4, đo đếm SLA/MTTR và quản lý tài nguyên số IT'
  },
  {
    id: 'lms_dao_tao',
    name: 'LMS Đào tạo',
    category: 'nhan_su',
    path: '/lms',
    icon: GraduationCap,
    color: 'from-indigo-600 to-purple-700',
    badgeText: 'Mới',
    description: 'Học trực tuyến E-learning, bài thi trắc nghiệm Quiz và cấp chứng chỉ số'
  }
];
