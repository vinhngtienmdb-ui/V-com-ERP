import { DraggableGrid } from './ui/DraggableGrid';
import { Wallet , Save } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { VietnamAddressSelector, VietnamProvinceBrowser, type VietnamAddress, EMPTY_ADDRESS, formatAddress } from './VietnamAddressSelector';
import { 
 ShieldCheck, 
 Settings, 
 Users, 
 Lock, 
 Webhook, 
 Globe, 
 Database, 
 Key, 
 AppWindow, 
 CreditCard,
 Building2,
 Trash2,
 CheckCircle2,
 Plus,
 Sparkles,
 Zap,
 ArrowRight,
 ChevronLeft,
 Target,
 MapPin,
 Search,
 Edit2,
 Store,
 MessageSquare,
 AlertCircle,
 Image,
 Bell,
 Send,
 BadgeDollarSign,
 RefreshCw,
 Package,
 X,
 Check,
 Link2
} from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { PermissionRole, WebhookConfig, AiFeeSuggestion } from '../types/erp';
import { useNotifications } from '../context/NotificationContext';
import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { PageEditorModal } from './PageEditorModal';

interface Department { id: string; name: string; manager: string; staffCount: number; parentId?: string; }
interface JobTitle { id: string; name: string; department: string; description?: string; rank?: string; }
interface JobRank { id: string; name: string; level: number; }
interface CategoryFee { 
 id: string; 
 name: string; 
 sellerFee: number; 
 mallFee: number; 
 aiSuggestedSellerFee?: number; 
 aiSuggestedMallFee?: number; 
 aiReasoning?: string;
}

interface FooterLink { label: string; url: string; }
interface PaymentMethod { id: string; label: string; logo: string; active: boolean; }
interface SiteConfig {
  companyInfo: { brandName: string; tagline: string; address: string; hotline: string; email: string; };
  footerLinks: { col1Title: string; col1Items: FooterLink[]; col2Title: string; col2Items: FooterLink[]; };
  paymentMethods: PaymentMethod[];
  socialLinks: { facebook: string; instagram: string; twitter: string; youtube: string; tiktok: string; };
  legalInfo: { companyName: string; legalAddress: string; taxCode: string; representative: string; businessReg: string; businessRegDate: string; };
  copyrightText: string;
}

const DEFAULT_SITE_CONFIG: SiteConfig = {
  companyInfo: { brandName: 'VComm', tagline: 'Nền tảng thương mại điện tử toàn diện', address: 'Tầng 5, Tòa nhà Innovation, Công viên phần mềm Quang Trung, P. Tân Chánh Hiệp, Q.12, TP. Hồ Chí Minh', hotline: '1900 1234', email: 'support@vcomm.vn' },
  footerLinks: {
    col1Title: 'CHĂM SÓC KHÁCH HÀNG',
    col1Items: [
      { label: 'Trung tâm trợ giúp', url: '/help' },
      { label: 'VComm Blog', url: '/blog' },
      { label: 'Hướng dẫn mua sắm', url: '/guide/buy' },
      { label: 'Hướng dẫn bán hàng', url: '/guide/sell' },
      { label: 'Thanh toán', url: '/payment' },
      { label: 'Vận chuyển', url: '/shipping' },
      { label: 'Trả hàng & Hoàn tiền', url: '/returns' },
    ],
    col2Title: 'VỀ VCOMM',
    col2Items: [
      { label: 'Giới thiệu về VComm', url: '/about' },
      { label: 'Tuyển dụng', url: '/careers' },
      { label: 'Điều khoản VComm', url: '/terms' },
      { label: 'Chính sách bảo mật', url: '/privacy' },
      { label: 'Chính hãng', url: '/authentic' },
      { label: 'Kênh người bán', url: '/sellers' },
      { label: 'Flash Sales', url: '/flash-sale' },
    ],
  },
  paymentMethods: [
    { id: 'visa', label: 'Visa', logo: '', active: true },
    { id: 'mastercard', label: 'Master', logo: '', active: true },
    { id: 'momo', label: 'MoMo', logo: '', active: true },
    { id: 'zalopay', label: 'ZaloPay', logo: '', active: false },
    { id: 'vnpay', label: 'VNPay', logo: '', active: false },
    { id: 'cod', label: 'COD', logo: '', active: false },
  ],
  socialLinks: { facebook: 'https://facebook.com/vcomm', instagram: 'https://instagram.com/vcomm', twitter: 'https://twitter.com/vcomm', youtube: 'https://youtube.com/@vcomm', tiktok: '' },
  legalInfo: { companyName: 'CÔNG TY CỔ PHẦN CÔNG NGHỆ VCOMM', legalAddress: 'Tầng 5, Tòa nhà Innovation, Công viên phần mềm Quang Trung, P. Tân Chánh Hiệp, Q.12, TP. Hồ Chí Minh', taxCode: '0101234567', representative: 'Nguyễn Văn Thương', businessReg: '0101234567', businessRegDate: '01/01/2024' },
  copyrightText: '© 2026 - Bản quyền thuộc về CÔNG TY CỔ PHẦN CÔNG NGHỆ VCOMM',
};


interface SystemFee {
 id: string;
 name: string;
 type: 'percentage' | 'fixed';
 value: number;
 description: string;
 isActive: boolean;
 applyTo: {
 sellerTypes: ('mall' | 'normal')[];
 categories: string[]; // ['1', '2'] or ['all']
 };
}

const MOCK_SYSTEM_FEES: SystemFee[] = [
 { 
 id: 'f1', 
 name: 'Phí cố định theo đơn (Fixed Fee)', 
 type: 'fixed', 
 value: 5000, 
 description: 'Phí xử lý đơn hàng cố định mỗi giao dịch thành công.', 
 isActive: true, 
 applyTo: { sellerTypes: ['mall', 'normal'], categories: ['all'] } 
 },
 { 
 id: 'f2', 
 name: 'Phí Marketing & Quảng cáo', 
 type: 'percentage', 
 value: 2, 
 description: 'Phí hỗ trợ các chương trình truyền thông chung trên Sàn.', 
 isActive: false, 
 applyTo: { sellerTypes: ['mall'], categories: ['1', '4'] } 
 },
 { 
 id: 'f3', 
 name: 'Phí đóng gói hỗ trợ (Fulfill)', 
 type: 'fixed', 
 value: 12000, 
 description: 'Áp dụng cho các ngành hàng cồng kềnh cần đóng gói đặc biệt.', 
 isActive: true, 
 applyTo: { sellerTypes: ['normal'], categories: ['3'] } 
 },
];

const MOCK_DEPARTMENTS: Department[] = [
 { id: 'D-001', name: 'Vận hành Sàn', manager: 'Lê Hoàng Minh', staffCount: 45 },
 { id: 'D-003', name: 'Kho vận nhánh HN', manager: 'Trần Văn B', staffCount: 10, parentId: 'D-001' },
 { id: 'D-002', name: 'Marketing', manager: 'Nguyễn Diệu Nhi', staffCount: 22 },
];
const MOCK_JOB_TITLES: JobTitle[] = [
 { id: 'T-001', name: 'Quản lý kho', department: 'D-001', description: 'Quản lý vận hành kho bãi, nhân sự kho.', rank: 'R-003' },
 { id: 'T-002', name: 'KOL Specialist', department: 'D-002', description: 'Tìm kiếm, làm việc và đàm phán với KOL/Influencer trên MXH.', rank: 'R-001' },
];
const MOCK_JOB_RANKS: JobRank[] = [
 { id: 'R-001', name: 'Nhân viên', level: 1 },
 { id: 'R-002', name: 'Trưởng nhóm', level: 2 },
 { id: 'R-003', name: 'Quản lý', level: 3 },
];

const MOCK_AI_FEE_SUGGESTIONS: AiFeeSuggestion[] = [
 { category: 'Điện tử & Công nghệ', currentFee: 3, suggestedFee: 3.5, reasoning: 'Nhu cầu cao, biên lợi nhuận seller ổn định ở mức 18%.', competitorAvg: 4, impactOnGmv: '+2.1% Revenue' },
 { category: 'Thời trang & Phụ kiện', currentFee: 8, suggestedFee: 7.2, reasoning: 'Cạnh tranh gắt gao, giảm phí để hút Seller chất lượng cao.', competitorAvg: 6.5, impactOnGmv: '+15% Seller Growth' },
];

const MOCK_ROLES: PermissionRole[] = [
 { id: '1', name: 'Siêu quản trị (Super Admin)', permissions: ['all'] },
 { id: '2', name: 'Quản lý (Manager)', permissions: ['dashboard.view', 'pim.view', 'pim.edit', 'orders.view', 'orders.edit', 'orders.approve', 'finance.view', 'hr.view', 'hr.edit'] },
 { id: '3', name: 'Nhân viên bán hàng (Sales)', permissions: ['dashboard.view', 'orders.view', 'orders.create', 'pim.view', 'customers.view'] },
 { id: '4', name: 'Kế toán (Accountant)', permissions: ['finance.view', 'finance.create', 'finance.edit', 'finance.approve', 'settlement.view', 'settlement.approve'] },
 { id: '5', name: 'Chăm sóc Khách hàng', permissions: ['customers.view', 'customers.edit', 'wallet.view', 'wallet.edit', 'loyalty.view'] },
];

const MODULE_PERMISSIONS = [
 { 
 id: 'core', 
 label: 'Hệ thống cốt lõi', 
 modules: [
 { id: 'dashboard', label: 'Dashboard & Báo cáo', actions: ['view'] },
 { id: 'bi', label: 'Phân tích dữ liệu (BI)', actions: ['view'] },
 { id: 'settings', label: 'Cấu hình hệ thống', actions: ['view', 'edit'] },
 ]
 },
 {
 id: 'commerce',
 label: 'Thưong mại & Bán hàng',
 modules: [
 { id: 'pim', label: 'Sản phẩm (PIM)', actions: ['view', 'create', 'edit', 'delete'] },
 { id: 'orders', label: 'Quản lý Đơn hàng', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
 { id: 'flash_sale', label: 'Flash Sale & Voucher', actions: ['view', 'create', 'edit', 'delete'] },
 { id: 'ipos', label: 'Phần mềm iPOS', actions: ['view', 'create', 'edit', 'delete'] },
 ]
 },
 {
 id: 'finance',
 label: 'Tài chính & Thanh toán',
 modules: [
 { id: 'finance', label: 'Kế toán tổng hợp', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
 { id: 'settlement', label: 'Đối soát & Công nợ', actions: ['view', 'edit', 'approve'] },
 { id: 'wallet', label: 'Ví & Thanh toán', actions: ['view', 'edit'] },
 ]
 },
 {
 id: 'hr',
 label: 'Nhân sự & Tổ chức',
 modules: [
 { id: 'hr', label: 'Quản trị nhân sự (HR)', actions: ['view', 'create', 'edit', 'delete'] },
 { id: 'org', label: 'Sơ đồ tổ chức', actions: ['view', 'edit'] },
 { id: 'payroll', label: 'Quản lý lương', actions: ['view', 'edit', 'approve'] },
 ]
 }
];

const MOCK_WEBHOOKS: WebhookConfig[] = [
 { id: '1', name: 'ERP Brand Samsung Integration', url: 'https://api.samsung.com/webhook', events: ['order.created', 'order.cancelled'], status: 'active' },
 { id: '2', name: 'GHTK Logistis Status', url: 'https://webhook.ghtk.vn/callback', events: ['delivery.status'], status: 'active' },
];

const SETTINGS_MODULE_GROUPS = [
 {
 title: 'Vận hành & Kinh doanh',
 items: [
 { id: 'wallet_crm', label: 'Quản lý Ví CSKH', icon: Wallet, desc: 'Cấu hình các loại Ví Khuyến Mại & Tích điểm KH', color: 'primary' },
  { id: 'general', label: 'Cấu hình chung', icon: Settings, desc: 'Cài đặt cơ bản hệ thống, Payout tự động', color: 'blue' },
 { id: 'appearance', label: 'Giao diện & Theme', icon: Sparkles, desc: 'Tùy chỉnh màu sắc, bo góc, Lễ tết', color: 'rose' },
 { id: 'fees', label: 'Phí sàn & Ngành hàng', icon: BadgeDollarSign, desc: 'Setup tỷ lệ hoa hồng theo từng ngành', color: 'emerald' },
 { id: 'website', label: 'Website & Menu', icon: Globe, desc: 'Quản lý biểu mẫu, tên miền và menu', color: 'indigo' },
 { id: 'storefront', label: 'Trang bán hàng', icon: AppWindow, desc: 'Footer, thông tin công ty, MXH & pháp lý', color: 'emerald' },
 { id: 'inventory', label: 'Hàng hóa & Kho', icon: Package, desc: 'Phân loại mặt hàng và lưu kho', color: 'orange' },
 ]
 },
 {
 title: 'Hệ thống & Bảo mật',
 items: [
 { id: 'rbac', label: 'Phân quyền (Roles)', icon: Lock, desc: 'Điều hướng truy cập và quản lý Matrix Roles', color: 'purple' },
 { id: 'api', label: 'OpenAPI & Webhooks', icon: Webhook, desc: 'Cấp API token và bắn sự kiện Server', color: 'rose' },
 { id: 'popup', label: 'Popup & Thông báo', icon: Bell, desc: 'Thiết lập Push notification trung tâm', color: 'blue' },
 { id: 'comms', label: 'Tích hợp Kênh', icon: MessageSquare, desc: 'Cấu hình API gửi tin nhắn Zalo/SMS', color: 'cyan' },
 ]
 },
 {
 title: 'Cấu trúc & Hạ tầng',
 items: [
 { id: 'org', label: 'Cơ cấu Tổ chức', icon: Building2, desc: 'Cây phòng ban và chức danh nhân sự', color: 'emerald' },
 { id: 'stores', label: 'Chuỗi cửa hàng', icon: Store, desc: 'Cấu hình chi nhánh và subdomain', color: 'indigo' },
 { id: 'address', label: 'Địa chỉ Hành chính', icon: MapPin, desc: 'Danh mục Tỉnh/Thành/Phường/Xã', color: 'slate' },
 ]
 }
];

function getColorClasses(color: string) {
 switch (color) {
 case 'blue': return 'bg-slate-100 text-blue-600';
 case 'orange': return 'bg-orange-50 text-blue-600';
 case 'indigo': return 'bg-primary-50 text-primary-600';
 case 'purple': return 'bg-purple-50 text-purple-600';
 case 'emerald': return 'bg-emerald-50 text-emerald-600';
 case 'fuchsia': return 'bg-fuchsia-50 text-fuchsia-600';
 case 'rose': return 'bg-rose-50 text-rose-600';
 case 'cyan': return 'bg-cyan-50 text-cyan-600';
 case 'slate':
 default: return 'bg-slate-50 text-slate-700';
 }
}

function getIconBg(color: string) {
  const map: Record<string, string> = {
    blue: 'bg-blue-500', indigo: 'bg-indigo-500', purple: 'bg-purple-500',
    emerald: 'bg-emerald-500', rose: 'bg-rose-500', cyan: 'bg-cyan-500',
    orange: 'bg-orange-500', primary: 'bg-blue-500', slate: 'bg-slate-600',
  };
  return map[color] || 'bg-slate-500';
}

const MOCK_PROVINCES = [
 { id: '1', name: 'Hà Nội', code: 'HN', wards: 579, status: 'active' },
 { id: '2', name: 'Hồ Chí Minh', code: 'HCM', wards: 312, status: 'active' },
 { id: '3', name: 'Đà Nẵng', code: 'DN', wards: 56, status: 'active' },
 { id: '4', name: 'Hải Phòng', code: 'HP', wards: 217, status: 'active' },
 { id: '5', name: 'Cần Thơ', code: 'CT', wards: 83, status: 'active' },
];

import { usePreferences } from '../context/PreferencesContext';

export function SettingsPage() {
 const { primaryColor, setPrimaryColor, borderRadius, setBorderRadius, holidayTheme, setHolidayTheme } = usePreferences();
 const [activeTab, setActiveTab] = useState<'overview' | 'general' | 'appearance' | 'wallet_crm' | 'rbac' | 'api' | 'address' | 'org' | 'comms' | 'website' | 'storefront' | 'stores' | 'fees' | 'popup' | 'inventory'>('overview');
 const [roles, setRoles] = useState<PermissionRole[]>(MOCK_ROLES);
 const [editingRole, setEditingRole] = useState<PermissionRole | null>(null);
 const [notiTitle, setNotiTitle] = useState('');
 const [notiMessage, setNotiMessage] = useState('');
 const [notiStatus, setNotiStatus] = useState('');
 const { addNotification } = useNotifications();
 const [categoryFees, setCategoryFees] = useState<CategoryFee[]>([
 { id: '1', name: 'Điện tử & Công nghệ', sellerFee: 3, mallFee: 5, aiSuggestedSellerFee: 3.5, aiSuggestedMallFee: 5.5, aiReasoning: 'Nhu cầu cao, biên lợi nhuận seller ổn định ở mức 18%.' },
 { id: '2', name: 'Thời trang & Phụ kiện', sellerFee: 8, mallFee: 12, aiSuggestedSellerFee: 7.2, aiSuggestedMallFee: 10.5, aiReasoning: 'Cạnh tranh gắt gao, giảm phí để hút Seller chất lượng cao.' },
 { id: '3', name: 'Gia dụng & Đời sống', sellerFee: 5, mallFee: 8 },
 { id: '4', name: 'Sức khỏe & Sắc đẹp', sellerFee: 10, mallFee: 15 },
 ]);
 const [systemFees, setSystemFees] = useState<SystemFee[]>(MOCK_SYSTEM_FEES);
 const [showFeeModal, setShowFeeModal] = useState(false);
 const [editingFee, setEditingFee] = useState<SystemFee | null>(null);
 const [newFee, setNewFee] = useState<Partial<SystemFee>>({
 type: 'percentage',
 value: 0,
 isActive: true,
 applyTo: { sellerTypes: ['normal'], categories: ['all'] }
 });
 const [isSaving, setIsSaving] = useState(false);
 const [customDomains, setCustomDomains] = useState<string[]>(['erp.vcom.vn']);
 const [showAddCategory, setShowAddCategory] = useState(false);
 const [newCategoryName, setNewCategoryName] = useState('');
 const [isScanningAI, setIsScanningAI] = useState(false);
 const [activeModuleTab, setActiveModuleTab] = useState(MODULE_PERMISSIONS[0].id);

 // Popup States
 const [isPopupActive, setIsPopupActive] = useState(false);
 const [popupTitle, setPopupTitle] = useState('Khuyến Mãi Hè 2024');
 const [popupDesc, setPopupDesc] = useState('Săn deal chớp nhoáng với rổ hàng giảm giá 50% cùng nhiều voucher độc quyền.');
 const [popupImage, setPopupImage] = useState('');
 const [popupCtaText, setPopupCtaText] = useState('Xem ngay');
 const [popupCtaLink, setPopupCtaLink] = useState('');

 // Job Title State
 const [jobTitles, setJobTitles] = useState<JobTitle[]>(MOCK_JOB_TITLES);
 const [showAddJobTitleModal, setShowAddJobTitleModal] = useState(false);
 const [editingJobTitle, setEditingJobTitle] = useState<JobTitle | null>(null);
 const [newJobTitle, setNewJobTitle] = useState<Partial<JobTitle>>({});

 // Website States
 const [systemLogo, setSystemLogo] = useState<string>('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=128&h=128&fit=crop');
 const [systemFavicon, setSystemFavicon] = useState<string>('https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=32&h=32&fit=crop');
 const [isSavingWebsite, setIsSavingWebsite] = useState(false);

 // Site Config (Trang bán hàng) state
 const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
 const [isSavingSiteConfig, setIsSavingSiteConfig] = useState(false);
 const [siteConfigLoading, setSiteConfigLoading] = useState(false);
 const [expandedSection, setExpandedSection] = useState<string | null>('companyInfo');
 const [companyAddress, setCompanyAddress] = useState<VietnamAddress>(EMPTY_ADDRESS);
 const [editingPageUrl, setEditingPageUrl] = useState<{ url: string; label: string } | null>(null);

 useEffect(() => {
   let cancelled = false;
   setSiteConfigLoading(true);
   getDoc(doc(db, 'site_config', 'main')).then((snap) => {
     if (!cancelled && snap.exists()) {
       setSiteConfig({ ...DEFAULT_SITE_CONFIG, ...(snap.data() as SiteConfig) });
     }
   }).finally(() => { if (!cancelled) setSiteConfigLoading(false); });
   return () => { cancelled = true; };
 }, []);

 const handleSaveSiteConfig = async () => {
   setIsSavingSiteConfig(true);
   try {
     await setDoc(doc(db, 'site_config', 'main'), siteConfig);
     addNotification('Đã lưu cấu hình', 'Trang bán hàng đã được cập nhật thành công.');
   } catch {
     addNotification('Lỗi lưu cấu hình', 'Không thể lưu — vui lòng thử lại.');
   } finally {
     setIsSavingSiteConfig(false);
   }
 };

 const addFooterLink = (col: 'col1Items' | 'col2Items') =>
   setSiteConfig(c => ({ ...c, footerLinks: { ...c.footerLinks, [col]: [...c.footerLinks[col], { label: '', url: '' }] } }));

 const removeFooterLink = (col: 'col1Items' | 'col2Items', idx: number) =>
   setSiteConfig(c => ({ ...c, footerLinks: { ...c.footerLinks, [col]: c.footerLinks[col].filter((_, i) => i !== idx) } }));

 const updateFooterLink = (col: 'col1Items' | 'col2Items', idx: number, field: 'label' | 'url', value: string) =>
   setSiteConfig(c => ({
     ...c,
     footerLinks: {
       ...c.footerLinks,
       [col]: c.footerLinks[col].map((item, i) => i === idx ? { ...item, [field]: value } : item),
     },
   }));

 const togglePaymentMethod = (id: string) =>
   setSiteConfig(c => ({ ...c, paymentMethods: c.paymentMethods.map(p => p.id === id ? { ...p, active: !p.active } : p) }));

 const updatePaymentMethod = (id: string, field: 'label' | 'logo', value: string) =>
   setSiteConfig(c => ({ ...c, paymentMethods: c.paymentMethods.map(p => p.id === id ? { ...p, [field]: value } : p) }));

 const removePaymentMethod = (id: string) =>
   setSiteConfig(c => ({ ...c, paymentMethods: c.paymentMethods.filter(p => p.id !== id) }));

 const addPaymentMethod = () =>
   setSiteConfig(c => ({ ...c, paymentMethods: [...c.paymentMethods, { id: `pm-${Date.now()}`, label: 'Phương thức mới', logo: '', active: true }] }));

 const handlePaymentLogoUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
   const file = e.target.files?.[0];
   if (!file) return;
   const reader = new FileReader();
   reader.onloadend = () => updatePaymentMethod(id, 'logo', reader.result as string);
   reader.readAsDataURL(file);
 };

 useEffect(() => {
   const savedLogo = localStorage.getItem('system-logo');
   const savedFavicon = localStorage.getItem('system-favicon');
   if (savedLogo) setSystemLogo(savedLogo);
   if (savedFavicon) setSystemFavicon(savedFavicon);
 }, []);

 const handleSaveWebsiteConfig = () => {
  setIsSavingWebsite(true);
  try {
    localStorage.setItem('system-logo', systemLogo);
    localStorage.setItem('system-favicon', systemFavicon);
    
    // Update favicon in DOM
    const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (faviconLink) {
        faviconLink.href = systemFavicon;
    } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = systemFavicon;
        document.head.appendChild(link);
    }

    setTimeout(() => {
      setIsSavingWebsite(false);
      // Using a simple notification since I don't see a toast library easily available
      alert('Cấu hình website đã được lưu thành công!');
    }, 800);
  } catch (error) {
    console.error('Error saving website config:', error);
    setIsSavingWebsite(false);
    alert('Có lỗi xảy ra khi lưu cấu hình!');
  }
 };

 const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
  const file = e.target.files?.[0];
  if (file) {
  const reader = new FileReader();
  reader.onloadend = () => {
  if (type === 'logo') setSystemLogo(reader.result as string);
  else setSystemFavicon(reader.result as string);
  };
  reader.readAsDataURL(file);
  }
 };

 const handleSaveJobTitle = () => {
 if (!newJobTitle.name || !newJobTitle.department) return;
 
 if (editingJobTitle) {
 setJobTitles(prev => prev.map(t => t.id === editingJobTitle.id ? { ...t, ...newJobTitle } as JobTitle : t));
 } else {
 setJobTitles([...jobTitles, { ...newJobTitle, id: `T-${Date.now()}` } as JobTitle]);
 }
 setShowAddJobTitleModal(false);
 setEditingJobTitle(null);
 setNewJobTitle({});
 };

 const addDomain = () => setCustomDomains([...customDomains, '']);
 const updateDomain = (index: number, value: string) => {
 const newDomains = [...customDomains];
 newDomains[index] = value;
 setCustomDomains(newDomains);
 };
 const removeDomain = (index: number) => {
 setCustomDomains(customDomains.filter((_, i) => i !== index));
 };

 const handleSave = () => {
 setIsSaving(true);
 setTimeout(() => {
 setIsSaving(false);
 alert('Đã lưu các thay đổi cấu hình thành công!');
 }, 1000);
 };

 const handleApplyAiSuggestion = (id: string) => {
 setCategoryFees(prev => prev.map(cf => {
 if (cf.id === id && cf.aiSuggestedSellerFee && cf.aiSuggestedMallFee) {
 return {
 ...cf,
 sellerFee: cf.aiSuggestedSellerFee,
 mallFee: cf.aiSuggestedMallFee
 };
 }
 return cf;
 }));
 const category = categoryFees.find(c => c.id === id);
 alert(`Đã áp dụng đề xuất tối ưu AI cho ngành hàng ${category?.name}`);
 };

 const handleAddCategory = () => {
 if (!newCategoryName.trim()) return;
 const newId = (categoryFees.length + 1).toString();
 setCategoryFees([...categoryFees, {
 id: newId,
 name: newCategoryName,
 sellerFee: 5,
 mallFee: 7
 }]);
 setNewCategoryName('');
 setShowAddCategory(false);
 };

 const handleAIScanCategories = () => {
 setIsScanningAI(true);
 setTimeout(() => {
 const newItems = [
 {
 id: (categoryFees.length + 1).toString(),
 name: 'Mẹ & Bé',
 sellerFee: 4,
 mallFee: 6,
 aiReasoning: 'Phân tích từ AI: Số lượng tìm kiếm "Bỉm sữa" tăng mạnh. Biên lợi nhuận mảng này khá ổn định.'
 },
 {
 id: (categoryFees.length + 2).toString(),
 name: 'Thể thao & Dã ngoại',
 sellerFee: 6,
 mallFee: 9,
 aiReasoning: 'Phân tích từ AI: Nhu cầu du lịch và thể thao tăng cao mùa thu/đông. Dữ liệu cross-platform (social & sàn TMĐT) cho thấy tiềm năng.'
 }
 ];
 setCategoryFees(prev => [...prev, ...newItems]);
 setIsScanningAI(false);
 alert('AI đã phân tích dữ liệu thị trường và tự động đề xuất thêm 2 ngành hàng tiềm năng!');
 }, 2000);
 };

 return (
 <>
 <div className="space-y-8 animate-in fade-in slide-in- duration-500 pb-12">
 <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-2xl bg-slate-700 flex items-center justify-center shrink-0">
      <Settings className="w-6 h-6 text-white" />
    </div>
    <div>
      <h1 className="text-lg font-bold text-slate-900">Cấu hình & Tích hợp Hệ thống</h1>
      <p className="text-sm text-slate-500 mt-0.5">Phân quyền roles, cấu hình phí sàn và quản lý OpenAPI/Webhook.</p>
    </div>
  </div>
  <div className="flex items-center gap-2 shrink-0">
    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors">
      <RefreshCw className="w-4 h-4 text-emerald-500" /> Lịch sử
    </button>
    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors">
      <Sparkles className="w-4 h-4 text-purple-500" /> AI Audit
    </button>
    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm">
      <Save className="w-4 h-4" />{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
    </button>
  </div>
 </div>

 <div className="flex flex-col gap-6">
 {/* Main Grid or Content Area */}
 {activeTab !== 'overview' && (
 <div className="flex items-center gap-3">
   <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-medium rounded-xl transition-colors shadow-sm">
     <ChevronLeft className="w-4 h-4" /> Tổng quan
   </button>
   <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
   {[
   { id: 'general', label: 'Cấu hình chung', icon: Settings },
   { id: 'fees', label: 'Cấu hình Phí sàn', icon: BadgeDollarSign },
   { id: 'website', label: 'Cấu hình Website', icon: Globe },
   { id: 'popup', label: 'Cấu hình Popup & Thông báo', icon: Bell },
   { id: 'comms', label: 'Tích hợp Kênh', icon: MessageSquare },
   { id: 'rbac', label: 'Phân quyền & Roles', icon: Lock },
   { id: 'api', label: 'OpenAPI & Webhooks', icon: Webhook },
   { id: 'address', label: 'Cấu hình Tỉnh/Thành', icon: MapPin },
   { id: 'org', label: 'Cơ cấu Tổ chức', icon: Building2 },
   { id: 'stores', label: 'Quản lý Chuỗi cửa hàng', icon: Store },
   { id: 'inventory', label: 'Hàng hóa & Kho', icon: Package },
   ].filter(t => t.id === activeTab).map(t => (
   <React.Fragment key={t.id}>
   <t.icon className="w-5 h-5 text-blue-600" /> {t.label}
   </React.Fragment>
   ))}
   </h2>
 </div>
 )}

 {/* Content Area */}
 <div className="flex-1 space-y-4">
 {activeTab === 'overview' && (
 <div className="animate-in fade-in slide-in- duration-500 space-y-5">
 {/* Stat row — compact */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
   {[
     { label: 'Vai trò hệ thống', value: `${roles.length} Roles`,            badge: 'Bảo mật cao',  badgeCls: 'bg-emerald-100 text-emerald-700', icon: Lock,            iconBg: 'bg-purple-500' },
     { label: 'Tên miền trỏ về',  value: `${customDomains.length} Domains`,  badge: 'Đã xác thực', badgeCls: 'bg-blue-100 text-blue-700',       icon: Globe,           iconBg: 'bg-blue-500' },
     { label: 'Điểm Webhook',      value: `${MOCK_WEBHOOKS.length} Endpoints`,badge: '100% Uptime', badgeCls: 'bg-sky-100 text-sky-700',           icon: Webhook,         iconBg: 'bg-sky-500' },
     { label: 'Ngành hàng',        value: `${categoryFees.length} Nhóm`,     badge: 'Tối ưu AI',   badgeCls: 'bg-violet-100 text-violet-700',     icon: BadgeDollarSign, iconBg: 'bg-emerald-500' },
   ].map(item => (
     <div key={item.label} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm">
       <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${item.iconBg}`}>
         <item.icon className="w-5 h-5 text-white" />
       </div>
       <div className="flex-1 min-w-0">
         <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest leading-none">{item.label}</p>
         <p className="font-mono text-[15px] font-bold text-slate-800 mt-1 leading-none">{item.value}</p>
       </div>
       <span className={`font-mono text-[9px] font-bold px-1.5 py-0.5 border shrink-0 ${item.badgeCls}`}>{item.badge}</span>
     </div>
   ))}
 </div>

 {/* Grouped module list — compact horizontal rows */}
 <div className="space-y-4">
 {SETTINGS_MODULE_GROUPS.map((group, gIdx) => (
 <div key={gIdx}>
   <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 font-mono">{group.title}</h2>
   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
   {group.items.map((mod) => (
     <button
       key={mod.id}
       onClick={() => setActiveTab(mod.id as any)}
       className="group bg-white border border-slate-200 rounded-2xl p-5 flex flex-col items-center text-center gap-3 hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 min-h-[160px] justify-between"
     >
       <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 duration-200", getIconBg(mod.color))}>
         <mod.icon className="w-6 h-6 text-white" />
       </div>
       <div>
         <p className="text-sm font-semibold text-slate-800 leading-snug">{mod.label}</p>
         <p className="text-xs text-slate-400 mt-1 leading-snug line-clamp-1">{mod.desc}</p>
       </div>
     </button>
   ))}
   </div>
 </div>
 ))}
 </div>
 </div>
 )}
 {activeTab === 'appearance' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
  <Sparkles className="w-5 h-5 text-rose-500" />
  Giao diện & Theme
 </h3>
 
 <div className="space-y-4">
  <h4 className="font-semibold text-slate-900">Màu sắc chủ đạo (Primary Color)</h4>
  <div className="flex gap-4">
  {(['indigo', 'blue', 'emerald', 'rose', 'amber', 'slate'] as const).map(color => (
  <button
  key={color}
  onClick={() => setPrimaryColor(color)}
  className={`w-10 h-10 rounded-full flex items-center justify-center ${primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-800' : ''}`}
  style={{ backgroundColor: `var(--color-${color}-600)` }}
  >
  {primaryColor === color && <Check className="w-5 h-5 text-white" />}
  </button>
  ))}
  </div>
 </div>

 <div className="space-y-4">
  <h4 className="font-semibold text-slate-900">Bo góc bảng biểu (Border Radius)</h4>
  <div className="flex gap-4">
  <button onClick={() => setBorderRadius('none')} className={`px-4 py-2 border ${borderRadius === 'none' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-none flex-1 font-medium`}>Sắc cạnh (none)</button>
  <button onClick={() => setBorderRadius('sm')} className={`px-4 py-2 border ${borderRadius === 'sm' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-sm flex-1 font-medium`}>Nhẹ (sm)</button>
  <button onClick={() => setBorderRadius('lg')} className={`px-4 py-2 border ${borderRadius === 'lg' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-lg flex-1 font-medium`}>Vừa (lg)</button>
  <button onClick={() => setBorderRadius('xl')} className={`px-4 py-2 border ${borderRadius === 'xl' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-xl flex-1 font-medium`}>Cong (xl)</button>
  <button onClick={() => setBorderRadius('2xl')} className={`px-4 py-2 border ${borderRadius === '2xl' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-2xl flex-1 font-medium`}>Rất cong (2xl)</button>
  </div>
 </div>

 <div className="space-y-4">
  <h4 className="font-semibold text-slate-900 flex items-center gap-2">Theme Lễ Tết</h4>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {(['none', 'tet', 'christmas', 'mid-autumn', 'halloween'] as const).map(theme => (
  <button
  key={theme}
  onClick={() => setHolidayTheme(theme)}
  className={`p-4 border rounded-xl text-center flex flex-col items-center gap-2 transition-all ${holidayTheme === theme ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' : 'border-slate-300 hover:border-slate-400'}`}
  >
  <span className="text-2xl">
  {theme === 'tet' ? '🧧' : theme === 'christmas' ? '🎄' : theme === 'mid-autumn' ? '🌕' : theme === 'halloween' ? '🎃' : '✨'}
  </span>
  <span className="font-semibold capitalize">{theme === 'none' ? 'Mặc định' : theme}</span>
  </button>
  ))}
  </div>
 </div>
 
 </div>
 </div>
 )}

 {activeTab === 'general' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <h3 className="font-bold text-slate-900">Cấu hình ví & Payout</h3>
 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
 <div className="space-y-1">
 <p className="text-sm font-bold text-slate-900">Tính năng Duyệt Payout tự động</p>
 <p className="text-[10px] text-slate-600 italic text-pretty max-w-md">Nếu được bật, hệ thống sẽ tự động giải ngân cho Seller khi đơn hàng chuyển sang trạng thái "Thành công" và qua thời gian khiếu nại (7 ngày).</p>
 </div>
 <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
 <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-4">
 <button className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all border border-transparent">
 Hủy bỏ
 </button>
 <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5 active:scale-95">
 Lưu cấu hình
 </button>
 </div>
 </div>
 )}

  {activeTab === 'wallet_crm' && (
  <div className="animate-in fade-in duration-300 space-y-6">
    <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary-600" /> Cấu hình Ví CSKH & Khuyến mại
        </h3>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> Thêm loại Ví mới
        </button>
      </div>

      <div className="space-y-4">
        {[{
          name: 'Ví Khuyến Mại',
          desc: 'Ví chứa tiền được tặng từ các chương trình khuyến mại, có thể giới hạn % thanh toán trên mỗi đơn hàng.',
          usedFor: 'Thanh toán tối đa 50% giá trị đơn hàng',
          canTransfer: false,
          color: 'blue'
        }, {
          name: 'Ví Hoàn Tiền (Cashback)',
          desc: 'Số tiền hoàn lại từ việc hủy đơn hoặc chương trình đối soát.',
          usedFor: 'Thanh toán 100% hoặc Rút về tài khoản Bank',
          canTransfer: true,
          color: 'emerald'
        }, {
          name: 'Ví Thành Viên (Loyalty)',
          desc: 'Điểm thăng hạng (Không quy đổi ra tiền thật).',
          usedFor: 'Giữ hạng & Tận hưởng đặc quyền',
          canTransfer: false,
          color: 'purple'
        }].map(wallet => (
          <div key={wallet.name} className="border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full bg-${wallet.color}-500`}></span>
                {wallet.name}
              </h4>
              <p className="text-sm text-slate-600 mt-1">{wallet.desc}</p>
            </div>
            
            <div className="flex flex-col gap-2 md:items-end">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">Quy tắc: {wallet.usedFor}</span>
              <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                <input type="checkbox" checked={wallet.canTransfer} readOnly className="w-4 h-4 text-primary-600 rounded border-slate-400" />
                Cho phép KH điều chuyển / Rút
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-slate-200">
        <h4 className="font-bold text-slate-900 mb-4">Quy tắc điều chuyển số dư (Transfer Rules)</h4>
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg space-y-3">
           <div className="flex items-center justify-between text-sm font-medium text-slate-900">
             <div className="flex items-center gap-3">
               <span className="w-40">Ví Hoàn Tiền</span>
               <ArrowRight className="w-4 h-4 text-slate-500" />
               <span className="w-40">Ví Khuyến Mại</span>
             </div>
             <span className="text-right">Tỷ lệ quy đổi: 1 VNĐ = 1.1 Khuyến mại</span>
           </div>
           <div className="flex items-center justify-between text-sm font-medium text-slate-900 opacity-60">
             <div className="flex items-center gap-3">
               <span className="w-40">Ví Khuyến Mại</span>
               <ArrowRight className="w-4 h-4 text-slate-500" />
               <span className="w-40">Ví Hoàn Tiền</span>
             </div>
             <span className="text-right text-rose-600 italic">Cấm (Không hỗ trợ)</span>
           </div>
        </div>
      </div>
    </div>
  </div>
  )}

 {activeTab === 'fees' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 {/* Section 1: Dynamic System Fees */}
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <AlertCircle className="w-4 h-4 text-orange-500" /> Quản lý các loại Chi phí Hệ thống hỗ trợ
 </h3>
 <p className="text-xs text-slate-600 mt-1">Cấu hình linh hoạt các loại phí phát sinh ngoài phí hoa hồng (Fixed hoặc %).</p>
 </div>
 <button 
 onClick={() => { setEditingFee(null); setNewFee({ type: 'percentage', value: 0, isActive: true, applyTo: { sellerTypes: ['normal'], categories: ['all'] } }); setShowFeeModal(true); }}
 className="flex items-center gap-2 bg-[#111827] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
 >
 <Plus className="w-4 h-4" /> Thêm loại phí mới
 </button>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
 {systemFees.map((fee) => (
 <div key={fee.id} className={cn("p-4 rounded-xl border transition-all relative overflow-hidden group", fee.isActive ? "bg-white border-slate-300" : "bg-slate-50 border-slate-200 opacity-60")}>
 <div className="flex justify-between items-start mb-3 relative z-10">
 <div className="flex items-center gap-2">
 <div className={cn("p-2 rounded-lg", fee.type === 'fixed' ? "bg-slate-100 text-blue-600" : "bg-purple-50 text-purple-600")}>
 {fee.type === 'fixed' ? <BadgeDollarSign className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
 </div>
 <div>
 <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{fee.name}</h4>
 <p className="text-[10px] text-slate-600">{fee.type === 'fixed' ? 'Số tiền cố định' : 'Tỷ lệ % doanh thu'}</p>
 </div>
 </div>
 <div 
 onClick={() => setSystemFees(systemFees.map(f => f.id === fee.id ? { ...f, isActive: !f.isActive } : f))}
 className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors shrink-0", fee.isActive ? "bg-emerald-500" : "bg-slate-300")}
 >
 <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all", fee.isActive ? "right-1" : "left-1")} />
 </div>
 </div>

 <div className="mb-4 relative z-10">
 <span className={cn("text-2xl font-bold", fee.type === 'fixed' ? "text-blue-600" : "text-purple-600")}>
 {fee.type === 'fixed' ? formatCurrency(fee.value) : `${fee.value}%`}
 </span>
 <div className="mt-2 space-y-1.5">
 <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
 <Users className="w-3 h-3" />
 {fee.applyTo.sellerTypes.map(st => st === 'mall' ? 'Shop Mall' : 'Seller thường').join(', ')}
 </div>
 <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
 <Package className="w-3 h-3" />
 {fee.applyTo.categories.includes('all') ? 'Tất cả ngành hàng' : `Áp dụng ${fee.applyTo.categories.length} nhóm`}
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-2 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
 <button 
 onClick={() => { setEditingFee(fee); setNewFee(fee); setShowFeeModal(true); }}
 className="p-1.5 text-blue-600 hover:bg-slate-100 rounded"
 >
 <Edit2 className="w-3.5 h-3.5" />
 </button>
 <button 
 onClick={() => setSystemFees(systemFees.filter(f => f.id !== fee.id))}
 className="p-1.5 text-red-500 hover:bg-red-50 rounded"
 >
 <Trash2 className="w-3.5 h-3.5" />
 </button>
 </div>
 
 <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12 group-hover:scale-110 transition-transform">
 {fee.type === 'fixed' ? <BadgeDollarSign className="w-24 h-24" /> : <Zap className="w-24 h-24" />}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Section 2: Platform Commission (Existing) */}
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
 <BadgeDollarSign className="w-4 h-4 text-blue-600" /> Phí hoa hồng theo Ngành hàng & Loại Nhà Bán
 </h3>
 <p className="text-xs text-slate-600 mt-1">Cấu hình linh hoạt mức phí Sàn thu từ Seller thường và Shop Mall (đối tác chính hãng).</p>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={handleAIScanCategories}
 disabled={isScanningAI}
 className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
 >
 <RefreshCw className={cn("w-4 h-4", isScanningAI ? "animate-spin" : "")} /> 
 {isScanningAI ? 'AI đang phân tích...' : 'AI đề xuất ngành hàng'}
 </button>
 <button 
 onClick={() => setShowAddCategory(true)}
 className="flex items-center gap-1.5 text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-sm"
 >
 <Plus className="w-4 h-4" /> Thêm ngành hàng
 </button>
 </div>
 </div>

 {showAddCategory && (
 <div className="mb-4 p-4 bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-3 animate-in slide-in- duration-200">
 <label className="text-sm font-bold text-slate-800 whitespace-nowrap">Tên ngành hàng:</label>
 <input 
 type="text" 
 placeholder="VD: Mẹ & Bé, Đồ gia dụng..." 
 className="flex-1 p-2 bg-white border border-slate-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
 value={newCategoryName}
 onChange={(e) => setNewCategoryName(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
 />
 <button onClick={handleAddCategory} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700">Lưu</button>
 <button onClick={() => setShowAddCategory(false)} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-300">Hủy</button>
 </div>
 )}

 <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto min-w-0">
 <table className="w-full text-sm">
 <thead className="bg-slate-50 border-b border-slate-300">
 <tr>
 <th className="px-5 py-4 text-left font-bold text-slate-500 text-xs uppercase tracking-wider w-[30%]">Ngành hàng</th>
 <th className="px-5 py-4 text-center border-l border-slate-300 bg-slate-100/50 w-[25%]">
 <div className="flex flex-col items-center gap-1">
 <span className="font-bold text-blue-800 text-[11px] uppercase tracking-wider">Seller Thường</span>
 <span className="text-[9px] font-medium text-blue-600">Nhà bán cá nhân/nhỏ lẻ</span>
 </div>
 </th>
 <th className="px-5 py-4 text-center border-l border-slate-300 bg-amber-50/50 w-[25%]">
 <div className="flex flex-col items-center gap-1">
 <span className="font-bold text-amber-800 text-[11px] uppercase tracking-wider">Shop Mall</span>
 <span className="text-[9px] font-medium text-amber-600">Đối tác chính hãng</span>
 </div>
 </th>
 <th className="px-5 py-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider w-[20%]">Tối ưu AI</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-[#E5E7EB] bg-white">
 {categoryFees.map((cf) => (
 <tr key={cf.id} className="hover:bg-slate-50/50 transition-colors group">
 <td className="px-5 py-4 text-sm font-bold text-slate-900">{cf.name}</td>
 <td className="px-5 py-4 border-l border-slate-200 bg-slate-100/10">
 <div className="flex justify-center flex-col items-center gap-1.5">
 <div className="flex items-center gap-2">
 <input 
 type="number"
 value={cf.sellerFee}
 onChange={(e) => setCategoryFees(prev => prev.map(p => p.id === cf.id ? { ...p, sellerFee: parseFloat(e.target.value) } : p))}
 className="w-16 p-1.5 text-sm border-2 border-slate-300 rounded-2xl text-center focus:outline-none focus:border-slate-900 font-bold text-blue-900 bg-white"
 />
 <span className="text-xs font-bold text-orange-500">%</span>
 </div>
 {cf.aiSuggestedSellerFee && cf.aiSuggestedSellerFee !== cf.sellerFee && (
 <span className="text-[10px] text-blue-600 font-bold bg-[#EAE7DF] px-2 py-0.5 rounded-full">AI khuyên dùng: {cf.aiSuggestedSellerFee}%</span>
 )}
 </div>
 </td>
 <td className="px-5 py-4 border-l border-slate-200 bg-amber-50/10">
 <div className="flex justify-center flex-col items-center gap-1.5">
 <div className="flex items-center gap-2">
 <input 
 type="number"
 value={cf.mallFee}
 onChange={(e) => setCategoryFees(prev => prev.map(p => p.id === cf.id ? { ...p, mallFee: parseFloat(e.target.value) } : p))}
 className="w-16 p-1.5 text-sm border-2 border-amber-100 rounded-2xl text-center focus:outline-none focus:border-amber-500 font-bold text-amber-900 bg-white"
 />
 <span className="text-xs font-bold text-amber-400">%</span>
 </div>
 {cf.aiSuggestedMallFee && cf.aiSuggestedMallFee !== cf.mallFee && (
 <span className="text-[10px] text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded-full">AI khuyên dùng: {cf.aiSuggestedMallFee}%</span>
 )}
 </div>
 </td>
 <td className="px-5 py-4 text-right">
 {cf.aiSuggestedSellerFee && (
 <button 
 onClick={() => handleApplyAiSuggestion(cf.id)}
 className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-3 py-2 rounded-xl border border-primary-100 hover:bg-primary-600 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
 title={`Gợi ý: ${cf.aiReasoning}`}
 >
 <Sparkles className="w-4 h-4" /> Áp dụng
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'website' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-100 pb-3">
 <Globe className="w-4 h-4 text-blue-600" /> Cấu hình Website Tổng (Hệ thống ERP & Storefront)
 </h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Danh sách tên miền</label>
 <div className="space-y-2">
 {customDomains.map((domain, index) => (
 <div key={index} className="flex gap-2">
 <input 
 type="text" 
 value={domain} 
 onChange={(e) => updateDomain(index, e.target.value)}
 placeholder="ví dụ: store.domain.com" 
 className="flex-1 p-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-slate-900 transition-all" 
 />
 <button onClick={() => removeDomain(index)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 <button onClick={addDomain} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-2">
 <Plus className="w-3 h-3" /> Thêm tên miền mới
 </button>
 </div>
 <p className="text-[10px] text-[#9CA3AF] mt-1.5 leading-relaxed">Tên miền trỏ về hệ thống VComm ERP.</p>
 </div>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Logo Toàn Hệ Thống</label>
 <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative min-h-[140px] flex items-center justify-center">
 <input 
 type="file" 
 id="logo-upload" 
 className="hidden" 
 accept="image/*" 
 onChange={(e) => handleFileUpload(e, 'logo')}
 />
 <label htmlFor="logo-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2 w-full h-full p-2">
 {systemLogo ? (
 <img src={systemLogo} alt="System Logo" className="h-16 object-contain" referrerPolicy="no-referrer" />
 ) : (
 <Image className="w-8 h-8 text-slate-400" />
 )}
 <span className="text-xs font-bold text-blue-600">
 Nhấn để tải lên hoặc kéo thả Logo
 </span>
 <p className="text-[10px] text-[#9CA3AF] mt-1">PNG, JPG tối đa 5MB</p>
 </label>
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Favicon Hệ Thống</label>
 <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors relative min-h-[140px] flex items-center justify-center">
 <input 
 type="file" 
 id="favicon-upload" 
 className="hidden" 
 accept="image/x-icon,image/png" 
 onChange={(e) => handleFileUpload(e, 'favicon')}
 />
 <label htmlFor="favicon-upload" className="cursor-pointer flex flex-col items-center justify-center gap-2 w-full h-full p-2">
 {systemFavicon ? (
 <img src={systemFavicon} alt="Favicon" className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
 ) : (
 <Globe className="w-6 h-6 text-slate-400" />
 )}
 <span className="text-xs font-bold text-blue-600">
 Nhấn để tải lên hoặc kéo thả Favicon
 </span>
 <p className="text-[10px] text-[#9CA3AF] mt-1">ICO, PNG (32x32px)</p>
 </label>
 </div>
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
 <button 
   onClick={handleSaveWebsiteConfig}
   disabled={isSavingWebsite}
   className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
 >
   {isSavingWebsite ? (
     <>
       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
       Đang lưu...
     </>
   ) : (
     <>
       <Save className="w-4 h-4" />
       Lưu cấu hình website
     </>
   )}
 </button>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'storefront' && (
 <div className="animate-in fade-in duration-300 space-y-4">
   {siteConfigLoading ? (
     <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
   ) : (
     <>
     {/* ── Section helper ── */}
     {([
       { key: 'companyInfo', title: 'Thông tin công ty', icon: Building2 },
       { key: 'footerLinks', title: 'Cột liên kết Footer', icon: Globe },
       { key: 'paymentMethods', title: 'Phương thức Thanh toán & Vận chuyển', icon: CreditCard },
       { key: 'socialLinks', title: 'Mạng xã hội', icon: Link2 },
       { key: 'legalInfo', title: 'Thông tin pháp lý', icon: ShieldCheck },
       { key: 'preview', title: 'Xem trước Footer', icon: AppWindow },
     ] as const).map(({ key, title, icon: Icon }) => (
       <div key={key} className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
         <button
           onClick={() => setExpandedSection(expandedSection === key ? null : key)}
           className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition-colors"
         >
           <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
             <Icon className="w-4 h-4 text-blue-600" /> {title}
           </h3>
           <ChevronLeft className={cn('w-4 h-4 text-slate-400 transition-transform', expandedSection === key ? '-rotate-90' : 'rotate-180')} />
         </button>

         {expandedSection === key && (
           <div className="px-6 pb-6 pt-2 border-t border-slate-100 space-y-4">

             {/* COMPANY INFO */}
             {key === 'companyInfo' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {([
                   { field: 'brandName', label: 'Tên thương hiệu', placeholder: 'VComm' },
                   { field: 'tagline', label: 'Slogan / Mô tả ngắn', placeholder: 'Nền tảng TMĐT toàn diện' },
                   { field: 'hotline', label: 'Hotline', placeholder: '1900 1234' },
                   { field: 'email', label: 'Email hỗ trợ', placeholder: 'support@vcomm.vn' },
                 ] as const).map(({ field, label, placeholder }) => (
                   <div key={field}>
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                     <input
                       type="text"
                       value={siteConfig.companyInfo[field]}
                       onChange={e => setSiteConfig(c => ({ ...c, companyInfo: { ...c.companyInfo, [field]: e.target.value } }))}
                       placeholder={placeholder}
                       className="w-full p-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                     />
                   </div>
                 ))}
                 <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Địa chỉ văn phòng</label>
                   <VietnamAddressSelector
                     value={companyAddress}
                     onChange={addr => {
                       setCompanyAddress(addr);
                       setSiteConfig(c => ({ ...c, companyInfo: { ...c.companyInfo, address: formatAddress(addr) } }));
                     }}
                   />
                 </div>
               </div>
             )}

             {/* FOOTER LINKS */}
             {key === 'footerLinks' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {(['col1', 'col2'] as const).map(col => {
                   const colKey = `${col}Items` as 'col1Items' | 'col2Items';
                   const titleKey = `${col}Title` as 'col1Title' | 'col2Title';
                   return (
                     <div key={col} className="space-y-3">
                       <div>
                         <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tiêu đề cột</label>
                         <input
                           type="text"
                           value={siteConfig.footerLinks[titleKey]}
                           onChange={e => setSiteConfig(c => ({ ...c, footerLinks: { ...c.footerLinks, [titleKey]: e.target.value } }))}
                           className="w-full p-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Danh sách liên kết</label>
                         {siteConfig.footerLinks[colKey].map((item, idx) => (
                           <div key={idx} className="flex gap-2">
                             <input
                               type="text"
                               value={item.label}
                               onChange={e => updateFooterLink(colKey, idx, 'label', e.target.value)}
                               placeholder="Nhãn hiển thị"
                               className="flex-1 p-2 rounded-2xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                             />
                             <input
                               type="text"
                               value={item.url}
                               onChange={e => updateFooterLink(colKey, idx, 'url', e.target.value)}
                               placeholder="/duong-dan"
                               className="flex-1 p-2 rounded-2xl border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                             />
                             <button
                               onClick={() => item.url && setEditingPageUrl({ url: item.url, label: item.label })}
                               title="Chỉnh sửa nội dung trang"
                               disabled={!item.url}
                               className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                             >
                               <Edit2 className="w-3.5 h-3.5" />
                             </button>
                             <button onClick={() => removeFooterLink(colKey, idx)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0">
                               <X className="w-3.5 h-3.5" />
                             </button>
                           </div>
                         ))}
                         <button onClick={() => addFooterLink(colKey)} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-1">
                           <Plus className="w-3 h-3" /> Thêm liên kết
                         </button>
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}

             {/* PAYMENT METHODS */}
             {key === 'paymentMethods' && (
               <div className="space-y-3">
                 <p className="text-xs text-slate-500">Quản lý danh sách phương thức thanh toán hiển thị ở footer — bật/tắt, đổi tên và upload logo riêng.</p>

                 {/* List */}
                 <div className="space-y-2">
                   {siteConfig.paymentMethods.map((pm) => (
                     <div key={pm.id} className={cn('flex items-center gap-3 p-3 rounded-xl border transition-all', pm.active ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-white opacity-60')}>
                       {/* Toggle */}
                       <button
                         onClick={() => togglePaymentMethod(pm.id)}
                         className={cn('w-10 h-6 rounded-full transition-all shrink-0 relative', pm.active ? 'bg-blue-500' : 'bg-slate-300')}
                       >
                         <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', pm.active ? 'left-5' : 'left-1')} />
                       </button>

                       {/* Logo upload */}
                       <div className="relative shrink-0">
                         <input
                           type="file"
                           id={`logo-${pm.id}`}
                           className="hidden"
                           accept="image/*"
                           onChange={(e) => handlePaymentLogoUpload(pm.id, e)}
                         />
                         <label
                           htmlFor={`logo-${pm.id}`}
                           className="flex items-center justify-center w-14 h-10 rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 cursor-pointer overflow-hidden bg-white transition-colors group"
                           title="Click để upload logo"
                         >
                           {pm.logo ? (
                             <img src={pm.logo} alt={pm.label} className="w-full h-full object-contain p-1" />
                           ) : (
                             <div className="flex flex-col items-center gap-0.5">
                               <Image className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors" />
                               <span className="text-[9px] text-slate-300 group-hover:text-blue-400 leading-none">Logo</span>
                             </div>
                           )}
                         </label>
                         {pm.logo && (
                           <button
                             onClick={() => updatePaymentMethod(pm.id, 'logo', '')}
                             className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                             title="Xóa logo"
                           >
                             <X className="w-2.5 h-2.5" />
                           </button>
                         )}
                       </div>

                       {/* Label */}
                       <input
                         type="text"
                         value={pm.label}
                         onChange={(e) => updatePaymentMethod(pm.id, 'label', e.target.value)}
                         className="flex-1 px-3 py-1.5 text-sm rounded-2xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                         placeholder="Tên phương thức..."
                       />

                       {/* Status badge */}
                       <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', pm.active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400')}>
                         {pm.active ? 'Hiện' : 'Ẩn'}
                       </span>

                       {/* Delete */}
                       <button
                         onClick={() => removePaymentMethod(pm.id)}
                         className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                         title="Xóa phương thức"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   ))}
                 </div>

                 {/* Add new */}
                 <button
                   onClick={addPaymentMethod}
                   className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
                 >
                   <Plus className="w-4 h-4" /> Thêm phương thức thanh toán
                 </button>

                 <p className="text-[10px] text-slate-400 pt-1">
                   Kéo để sắp xếp thứ tự hiển thị • Logo nên có kích thước 120×80px, nền trắng hoặc trong suốt
                 </p>
               </div>
             )}

             {/* SOCIAL LINKS */}
             {key === 'socialLinks' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {([
                   { field: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/your-page' },
                   { field: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/your-page' },
                   { field: 'twitter', label: 'Twitter / X', placeholder: 'https://twitter.com/your-handle' },
                   { field: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@your-channel' },
                   { field: 'tiktok', label: 'TikTok', placeholder: 'https://tiktok.com/@your-page' },
                 ] as const).map(({ field, label, placeholder }) => (
                   <div key={field}>
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                     <input
                       type="url"
                       value={siteConfig.socialLinks[field]}
                       onChange={e => setSiteConfig(c => ({ ...c, socialLinks: { ...c.socialLinks, [field]: e.target.value } }))}
                       placeholder={placeholder}
                       className="w-full p-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                     />
                   </div>
                 ))}
               </div>
             )}

             {/* LEGAL INFO */}
             {key === 'legalInfo' && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tên công ty (đầy đủ theo pháp lý)</label>
                   <input type="text" value={siteConfig.legalInfo.companyName}
                     onChange={e => setSiteConfig(c => ({ ...c, legalInfo: { ...c.legalInfo, companyName: e.target.value } }))}
                     className="w-full p-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Địa chỉ pháp lý</label>
                   <textarea value={siteConfig.legalInfo.legalAddress}
                     onChange={e => setSiteConfig(c => ({ ...c, legalInfo: { ...c.legalInfo, legalAddress: e.target.value } }))}
                     rows={2} className="w-full p-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" />
                 </div>
                 {([
                   { field: 'taxCode' as const, label: 'Mã số thuế', placeholder: '' },
                   { field: 'representative' as const, label: 'Người đại diện pháp luật', placeholder: '' },
                   { field: 'businessReg' as const, label: 'Số GCNĐKDN', placeholder: '' },
                   { field: 'businessRegDate' as const, label: 'Ngày cấp lần đầu', placeholder: 'DD/MM/YYYY' },
                 ]).map(({ field, label, placeholder }) => (
                   <div key={field}>
                     <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">{label}</label>
                     <input type="text" value={siteConfig.legalInfo[field]}
                       onChange={e => setSiteConfig(c => ({ ...c, legalInfo: { ...c.legalInfo, [field]: e.target.value } }))}
                       placeholder={placeholder}
                       className="w-full p-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                   </div>
                 ))}
                 <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Dòng bản quyền (Copyright)</label>
                   <input type="text" value={siteConfig.copyrightText}
                     onChange={e => setSiteConfig(c => ({ ...c, copyrightText: e.target.value }))}
                     className="w-full p-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                 </div>
               </div>
             )}

             {/* PREVIEW */}
             {key === 'preview' && (
               <div className="rounded-xl overflow-hidden border border-slate-200 bg-white text-sm">
                 <div className="bg-slate-100 px-4 py-2 flex items-center gap-2 border-b border-slate-200">
                   <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                   <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                   <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                   <span className="ml-2 text-xs text-slate-400 font-mono">Footer Preview — {siteConfig.companyInfo.brandName}</span>
                 </div>
                 <div className="p-6 bg-white">
                   <div className="grid grid-cols-4 gap-6 pb-6 border-b border-slate-200">
                     {/* Col 0: Company */}
                     <div className="space-y-2">
                       <div className="font-bold text-lg text-blue-600">{siteConfig.companyInfo.brandName}</div>
                       <p className="text-[11px] text-slate-500 leading-relaxed">{siteConfig.companyInfo.address}</p>
                       {siteConfig.companyInfo.hotline && <p className="text-[11px] text-slate-500">Hotline: {siteConfig.companyInfo.hotline}</p>}
                       {siteConfig.companyInfo.email && <p className="text-[11px] text-slate-500">Email: {siteConfig.companyInfo.email}</p>}
                     </div>
                     {/* Col 1 */}
                     <div className="space-y-2">
                       <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{siteConfig.footerLinks.col1Title}</div>
                       {siteConfig.footerLinks.col1Items.filter(l => l.label).map((l, i) => (
                         <div key={i} className="text-[11px] text-slate-500 hover:text-blue-600 cursor-pointer transition-colors">{l.label}</div>
                       ))}
                     </div>
                     {/* Col 2 */}
                     <div className="space-y-2">
                       <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">{siteConfig.footerLinks.col2Title}</div>
                       {siteConfig.footerLinks.col2Items.filter(l => l.label).map((l, i) => (
                         <div key={i} className="text-[11px] text-slate-500 hover:text-blue-600 cursor-pointer transition-colors">{l.label}</div>
                       ))}
                     </div>
                     {/* Col 3: Payment + Social */}
                     <div className="space-y-4">
                       {siteConfig.paymentMethods.some(p => p.active) && (
                         <div className="space-y-1.5">
                           <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">THANH TOÁN</div>
                           <div className="flex flex-wrap gap-1.5 items-center">
                             {siteConfig.paymentMethods.filter(p => p.active).map(p => (
                               <div key={p.id} className="flex items-center justify-center h-7 px-2 rounded border border-slate-200 bg-white">
                                 {p.logo
                                   ? <img src={p.logo} alt={p.label} className="h-5 max-w-[48px] object-contain" />
                                   : <span className="text-[10px] font-bold text-slate-600">{p.label}</span>
                                 }
                               </div>
                             ))}
                           </div>
                         </div>
                       )}
                       <div className="space-y-1.5">
                         <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">THEO DÕI</div>
                         <div className="flex gap-2">
                           {siteConfig.socialLinks.facebook && <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">f</div>}
                           {siteConfig.socialLinks.instagram && <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold">in</div>}
                           {siteConfig.socialLinks.twitter && <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-[9px] font-bold">X</div>}
                           {siteConfig.socialLinks.youtube && <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-[9px] font-bold">▶</div>}
                           {siteConfig.socialLinks.tiktok && <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-[9px] font-bold">tt</div>}
                         </div>
                       </div>
                     </div>
                   </div>
                   {/* Legal bottom bar */}
                   <div className="pt-4 text-center space-y-0.5">
                     <p className="text-[10px] font-bold text-slate-600">{siteConfig.legalInfo.companyName}</p>
                     <p className="text-[10px] text-slate-400">Địa chỉ: {siteConfig.legalInfo.legalAddress}</p>
                     <p className="text-[10px] text-slate-400">Mã số thuế: {siteConfig.legalInfo.taxCode} — Đại diện: {siteConfig.legalInfo.representative}</p>
                     {siteConfig.legalInfo.businessReg && (
                       <p className="text-[10px] text-slate-400">
                         Giấy chứng nhận ĐKDN số {siteConfig.legalInfo.businessReg} do Sở Kế hoạch và Đầu tư TP.HCM cấp lần đầu ngày {siteConfig.legalInfo.businessRegDate}
                       </p>
                     )}
                     <p className="text-[10px] text-slate-400 mt-2">{siteConfig.copyrightText}</p>
                   </div>
                 </div>
               </div>
             )}

           </div>
         )}
       </div>
     ))}

     {/* Save Button */}
     <div className="flex justify-end pt-2">
       <button
         onClick={handleSaveSiteConfig}
         disabled={isSavingSiteConfig}
         className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
       >
         {isSavingSiteConfig ? (
           <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Đang lưu...</>
         ) : (
           <><Save className="w-4 h-4" />Lưu cấu hình Trang bán hàng</>
         )}
       </button>
     </div>
     </>
   )}
 </div>
 )}

 {activeTab === 'rbac' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 {!editingRole ? (
 <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
 <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
 <Lock className="w-4 h-4 text-blue-600" /> Quản lý Vai trò & Phân quyền
 </h3>
 <button 
 onClick={() => {
 const newId = (roles.length + 1).toString();
 const newRole: PermissionRole = { id: newId, name: 'Vai trò mới', permissions: [] };
 setRoles([...roles, newRole]);
 setEditingRole(newRole);
 }}
 className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline"
 >
 <Plus className="w-3.5 h-3.5" /> Tạo Vai trò mới
 </button>
 </div>
 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-100">
 <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Tên Vai trò</th>
 <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Số quyền hạn</th>
 <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Thao tác</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-100">
 {roles.map(role => (
 <tr key={role.id} className="hover:bg-slate-50 transition-colors group">
 <td className="px-6 py-4">
 <div className="flex flex-col">
 <span className="text-sm font-bold text-slate-900">{role.name}</span>
 <span className="text-[10px] text-slate-500 font-mono">ID: {role.id}</span>
 </div>
 </td>
 <td className="px-6 py-4">
 <span className="px-2 py-0.5 bg-slate-100 text-blue-600 text-[10px] font-bold rounded-full border border-slate-300">
 {role.permissions.includes('all') ? 'Toàn quyền' : `${role.permissions.length} quyền chi tiết`}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <button 
 onClick={() => setEditingRole(role)}
 className="text-xs font-bold text-blue-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all"
 >
 Thiết lập chi tiết
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 ) : (
 <div className="space-y-6 animate-in slide-in- duration-300">
 <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-300 shadow-sm">
 <div className="flex items-center gap-4">
 <button 
 onClick={() => setEditingRole(null)}
 className="p-2 hover:bg-slate-100 rounded-lg transition-all"
 >
 <ArrowRight className="w-5 h-5 rotate-180 text-slate-500" />
 </button>
 <div>
 <div className="flex items-center gap-2">
 <input 
 type="text" 
 value={editingRole.name}
 onChange={(e) => setEditingRole({...editingRole, name: e.target.value})}
 className="text-lg font-bold text-slate-900 border-b border-transparent hover:border-slate-400 focus:border-slate-900 focus:outline-none bg-transparent"
 />
 <Edit2 className="w-4 h-4 text-slate-500" />
 </div>
 <p className="text-xs text-slate-600">Thiết lập ma trận quyền cho {editingRole.name}</p>
 </div>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => setEditingRole(null)}
 className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
 >
 Hủy bỏ
 </button>
 <button 
 onClick={() => {
 setRoles(roles.map(r => r.id === editingRole.id ? editingRole : r));
 setEditingRole(null);
 addNotification('Đã cập nhật phân quyền', `Vai trò ${editingRole.name} đã được lưu thành công.`);
 }}
 className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5"
 >
 Lưu thay đổi
 </button>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 bg-slate-50 border-b border-slate-300 flex justify-between items-center">
 <h4 className="font-bold text-slate-900 text-sm">Ma trận Quyền hạn chi tiết</h4>
 <label className="flex items-center gap-2 cursor-pointer">
 <input 
 type="checkbox" 
 checked={editingRole.permissions.includes('all')}
 onChange={(e) => {
 if (e.target.checked) {
 setEditingRole({...editingRole, permissions: ['all']});
 } else {
 setEditingRole({...editingRole, permissions: []});
 }
 }}
 className="w-4 h-4 text-blue-600 rounded border-slate-400 focus:ring-orange-600"
 />
 <span className="text-xs font-bold text-slate-800">Gán Toàn quyền (Super Admin)</span>
 </label>
 </div>
 
 <div className="bg-white border-b border-slate-300">
 <div className="flex px-4 gap-6">
 {MODULE_PERMISSIONS.map(group => (
 <button
 key={group.id}
 onClick={() => setActiveModuleTab(group.id)}
 className={cn(
 "py-4 text-sm font-bold transition-all border-b-2",
 activeModuleTab === group.id
 ? "border-slate-900 text-blue-600"
 : "border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-400"
 )}
 >
 {group.label}
 </button>
 ))}
 </div>
 </div>
 
 <div className="p-6">
 {MODULE_PERMISSIONS.filter(group => group.id === activeModuleTab).map(group => (
 <div key={group.id} className="space-y-4 animate-in fade-in slide-in- duration-300">
 <div className="grid grid-cols-1 gap-3">
 {group.modules.map(module => (
 <div key={module.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:bg-white hover:shadow-sm transition-all group">
 <div className="space-y-1">
 <p className="text-sm font-bold text-slate-900">{module.label}</p>
 <p className="text-[10px] text-slate-500 font-mono uppercase">Module: {module.id}</p>
 </div>
 <div className="flex gap-4 flex-wrap justify-end">
 {module.actions.map(action => {
 const permissionKey = `${module.id}.${action}`;
 const isChecked = editingRole.permissions.includes('all') || editingRole.permissions.includes(permissionKey);
 const isDisabled = editingRole.permissions.includes('all');
 
 return (
 <label key={action} className={cn(
 "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none",
 isChecked ? "bg-slate-100 border-orange-200 text-orange-800" : "bg-white border-slate-300 text-slate-600 hover:border-slate-400",
 isDisabled && "opacity-50 cursor-not-allowed"
 )}>
 <input 
 type="checkbox"
 checked={isChecked}
 disabled={isDisabled}
 onChange={(e) => {
 const newPermissions = e.target.checked 
 ? [...editingRole.permissions, permissionKey]
 : editingRole.permissions.filter(p => p !== permissionKey);
 setEditingRole({...editingRole, permissions: newPermissions});
 }}
 className="w-3.5 h-3.5 text-blue-600 rounded border-slate-400 focus:ring-orange-600"
 />
 <span className="text-[10px] font-bold uppercase tracking-tight">
 {action === 'view' ? 'Xem' : 
 action === 'create' ? 'Tạo' : 
 action === 'edit' ? 'Sửa' : 
 action === 'delete' ? 'Xóa' : 
 action === 'approve' ? 'Duyệt' : action}
 </span>
 </label>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 </div>
 )}

 {activeTab === 'api' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-2 gap-6" columns={2} gap={24}>
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <Key className="w-4 h-4 text-orange-500" /> API Keys & Access Tokens
 </h3>
 <p className="text-xs text-slate-500">Cấp quyền cho bên thứ 3 (Brand, Logistics) truy cập trực tiếp vào API sàn.</p>
 <div className="p-3 bg-slate-50 rounded-lg font-mono text-[10px] text-slate-600 flex justify-between items-center">
 <span>sk_live_vcomm_*********************</span>
 <button className="text-blue-600 font-bold">Copy</button>
 </div>
 <button className="w-full py-2 border border-slate-200 rounded-2xl text-xs font-bold hover:bg-slate-50">Tạo mới Secret Key</button>
 </div>
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <AppWindow className="w-4 h-4 text-blue-600" /> Webhook Settings
 </h3>
 <p className="text-xs text-slate-500">Tự động đẩy thông báo sự kiện (Đơn hàng, Đối soát) về Server đối tác.</p>
 <div className="space-y-3">
 {MOCK_WEBHOOKS.map(wb => (
 <div key={wb.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
 <div className="space-y-1">
 <p className="text-[10px] font-bold text-slate-900">{wb.name}</p>
 <p className="text-[9px] text-slate-500 font-mono truncate max-w-[150px]">{wb.url}</p>
 </div>
 <button className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
 </div>
 ))}
 </div>
 <button className="w-full py-2 bg-[#111827] text-white rounded-lg text-xs font-bold hover:bg-slate-800">Cấu hình Webhook mới</button>
 </div>
 </DraggableGrid>

 <div className="bg-blue-900 text-white p-6 rounded-lg flex items-center gap-6">
 <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
 <Globe className="w-8 h-8 text-blue-600" />
 </div>
 <div>
 <h4 className="font-bold text-lg mb-1">OpenAPI Public Documentation</h4>
 <p className="text-slate-500 text-xs">Cung cấp tài liệu tích hợp (Swagger/Postman) cho cộng đồng phát triển và đối tác chiến lược để kết nối trực tiếp kho hàng Brand với vận hành sàn.</p>
 <div className="flex gap-4 mt-3">
 <button className="text-xs font-bold text-blue-600 hover:underline">Download API Spec</button>
 <button className="text-xs font-bold text-blue-600 hover:underline">Xem Sandbox logs</button>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'address' && (
 <div className="animate-in fade-in duration-300 space-y-4">

 {/* Cascade selector demo */}
 <div className="bg-white p-4 border border-slate-200">
 <div className="flex items-center gap-2 mb-3">
 <MapPin className="w-4 h-4 text-blue-600" />
 <h3 className="text-sm font-bold text-slate-800">Chọn địa chỉ nhanh</h3>
 <span className="font-mono text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5">Tỉnh → Huyện → Xã</span>
 </div>
 <VietnamAddressSelector
 value={companyAddress}
 onChange={setCompanyAddress}
 />
 </div>

 {/* Full province browser from API */}
 <div className="bg-white p-4 border border-slate-200">
 <div className="flex items-center gap-2 mb-3">
 <MapPin className="w-4 h-4 text-blue-600" />
 <h3 className="text-sm font-bold text-slate-800">Danh sách Tỉnh/Thành phố</h3>
 <span className="font-mono text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5">Nguồn: provinces.open-api.vn</span>
 </div>
 <VietnamProvinceBrowser />
 </div>
 </div>
 )}

 {activeTab === 'org' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <Building2 className="w-5 h-5 text-blue-600" /> Quản lý Cơ cấu Tổ chức
 </h3>
 </div>
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-3 gap-6" columns={3} gap={24}>
 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:col-span-1">
 <h4 className="font-bold text-slate-900 mb-4">Phòng ban</h4>
 {MOCK_DEPARTMENTS.map((dept) => (
 <div key={dept.id} className={cn("bg-white p-3 rounded-2xl border border-slate-200 mb-2 flex justify-between items-center", dept.parentId ? "ml-6 border-l-4 border-l-blue-400" : "")}>
 <span className="text-sm font-medium">{dept.name}</span>
 <button className="text-[10px] bg-slate-100 px-2 py-1 rounded">Sửa</button>
 </div>
 ))}
 </div>
 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:col-span-1">
 <div className="flex justify-between items-center mb-4">
 <h4 className="font-bold text-slate-900">Chức danh</h4>
 <button 
 onClick={() => { setNewJobTitle({}); setEditingJobTitle(null); setShowAddJobTitleModal(true); }}
 className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-slate-800 transition"
 >
 <Plus className="w-3 h-3 inline" /> Thêm
 </button>
 </div>
 <div className="space-y-2 h-[400px] overflow-y-auto pr-1">
 {jobTitles.map((title) => (
 <div key={title.id} className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
 <div className="flex justify-between items-start mb-1">
 <div className="font-bold text-sm text-slate-900">{title.name}</div>
 <button 
 onClick={() => { setEditingJobTitle(title); setNewJobTitle(title); setShowAddJobTitleModal(true); }}
 className="text-[10px] text-blue-600 hover:bg-slate-100 px-2 py-1 rounded"
 >Sửa</button>
 </div>
 <div className="text-xs text-slate-600 mb-1 line-clamp-2" title={title.description}>{title.description || 'Chưa có mô tả'}</div>
 <div className="flex gap-2 text-[10px]">
 <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
 Phòng: {MOCK_DEPARTMENTS.find(d => d.id === title.department)?.name || title.department}
 </span>
 {title.rank && (
 <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
 Cấp bậc: {MOCK_JOB_RANKS.find(r => r.id === title.rank)?.name || title.rank}
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:col-span-1">
 <div className="flex justify-between items-center mb-4">
 <h4 className="font-bold text-slate-900">Cấp bậc</h4>
 <button className="text-xs bg-slate-200 text-slate-800 px-2 py-1 rounded hover:bg-slate-300 transition">
 <Plus className="w-3 h-3 inline" /> Thêm
 </button>
 </div>
 <div className="space-y-2">
 {MOCK_JOB_RANKS.map((item) => (
 <div key={item.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
 <div>
 <div className="text-sm font-medium">{item.name}</div>
 <div className="text-[10px] text-slate-500">Level: {item.level}</div>
 </div>
 <button className="text-[10px] bg-slate-100 px-2 py-1 rounded">Sửa</button>
 </div>
 ))}
 </div>
 </div>
 </DraggableGrid>
 </div>
 </div>
 )}

 {activeTab === 'stores' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <Building2 className="w-5 h-5 text-blue-600" /> Quản lý Chuỗi cửa hàng / Chi nhánh
 </h3>
 <button className="bg-slate-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#EAE7DF] flex items-center gap-2">
 <Plus className="w-4 h-4" /> Thêm Cửa hàng
 </button>
 </div>

 <div className="bg-primary-50 border border-primary-100 rounded-lg p-5 mb-6">
 <h4 className="font-bold text-primary-900 mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Cấu hình Tên miền (Domain)</h4>
 <p className="text-sm text-primary-700 mb-4">Các chi nhánh có thể chạy trên subdomain riêng biệt, cung cấp cho nhân viên thu ngân đường dẫn đăng nhập trực tiếp mà không cần vào trang chủ ERP.</p>
 <DraggableGrid className="grid grid-cols-2 gap-4" columns={2} gap={16}>
 <div className="bg-white p-3 rounded-2xl shadow-sm border border-primary-50 flex justify-between items-center">
 <div className="space-y-1">
 <span className="text-[10px] uppercase font-bold text-slate-500">Chi nhánh Quận 1</span>
 <p className="font-mono text-sm text-slate-900">sg1.v-erp.com</p>
 </div>
 <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">ACTIVE</span>
 </div>
 <div className="bg-white p-3 rounded-2xl shadow-sm border border-primary-50 flex justify-between items-center">
 <div className="space-y-1">
 <span className="text-[10px] uppercase font-bold text-slate-500">Chi nhánh Cầu Giấy</span>
 <p className="font-mono text-sm text-slate-900">hn1.v-erp.com</p>
 </div>
 <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">ACTIVE</span>
 </div>
 </DraggableGrid>
 </div>

 <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">Danh sách Cửa hàng & Nhân sự</h4>
 
 <div className="space-y-4">
 {[
 { id: 'STORE_001', name: 'Chi nhánh Quận 1 - Sài Gòn', address: '123 Lê Lợi, Q.1, TP.HCM', staff: 5, manager: 'Nguyễn Văn A' },
 { id: 'STORE_002', name: 'Chi nhánh Cầu Giấy - Hà Nội', address: '45 Xuân Thủy, Cầu Giấy, HN', staff: 8, manager: 'Trần Thị B' },
 ].map(store => (
 <div key={store.id} className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-blue-400 transition-colors bg-slate-50">
 <div>
 <h5 className="font-bold text-slate-900 text-lg flex items-center gap-2">{store.name}</h5>
 <p className="text-sm text-slate-600 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.address}</p>
 <div className="flex gap-4 mt-3">
 <span className="text-xs bg-slate-200/50 text-slate-700 px-2 py-1 rounded-md font-medium">Quản lý: <span className="font-bold">{store.manager}</span></span>
 <span className="text-xs bg-slate-100 text-blue-600 px-2 py-1 rounded-md font-medium">{store.staff} nhân viên</span>
 </div>
 </div>
 <div className="flex gap-2">
 <button className="p-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-100"><Edit2 className="w-4 h-4" /></button>
 <button className="p-2 bg-white border border-slate-300 text-slate-700 rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 {activeTab === 'comms' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <MessageSquare className="w-5 h-5 text-blue-600" /> Tích hợp SMS OTP & Zalo ZNS
 </h3>
 </div>

 <DraggableGrid className="grid grid-cols-1 md:grid-cols-2 gap-6" columns={2} gap={24}>
 {/* Zalo ZNS Config */}
 <div className="border border-slate-200 rounded-2xl p-5 hover:border-blue-400 transition-colors">
 <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white"><MessageSquare className="w-5 h-5" /></div>
 <div>
 <h4 className="font-bold text-slate-900">Zalo ZNS (Zalo Notification Service)</h4>
 <p className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold uppercase w-fit mt-1 border border-emerald-100">Đang hoạt động</p>
 </div>
 </div>
 <div className="h-8 w-14 bg-[#EAE7DF] rounded-full p-1 cursor-pointer">
 <div className="w-6 h-6 bg-slate-900 rounded-full translate-x-6"></div>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Official Account ID (OA ID)</label>
 <input type="text" defaultValue="2938475928374928" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-slate-900 font-mono" />
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Zalo App ID</label>
 <input type="text" defaultValue="142345234523" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-slate-900 font-mono" />
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Access Token</label>
 <div className="flex gap-2">
 <input type="password" defaultValue="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-slate-900 font-mono" />
 <button className="px-3 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-slate-200 text-sm font-bold text-slate-700">Đồng bộ</button>
 </div>
 <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Token sẽ hết hạn vào 20:00 25/04/2026. Bật auto-refresh để tự làm mới.</p>
 </div>
 </div>
 <button className="w-full mt-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
 Kiểm tra kết nối ZNS
 </button>
 </div>

 {/* SMS OTP Config */}
 <div className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 transition-colors">
 <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white"><MessageSquare className="w-5 h-5" /></div>
 <div>
 <h4 className="font-bold text-slate-900">SMS OTP & Brandname</h4>
 <p className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-bold uppercase w-fit mt-1">Chưa thiết lập</p>
 </div>
 </div>
 <div className="h-8 w-14 bg-slate-200 rounded-full p-1 cursor-pointer">
 <div className="w-6 h-6 bg-white rounded-full shadow-sm"></div>
 </div>
 </div>
 <div className="space-y-4 opacity-70">
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Nhà cung cấp (SMS Vendor)</label>
 <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
 <option>eSMS.vn</option>
 <option>VietGuys</option>
 <option>FPT SMS</option>
 <option>Viettel MKT</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Brandname đăng ký</label>
 <input type="text" placeholder="Ví dụ: V-ECOM" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">API Key</label>
 <input type="password" placeholder="Nhập API Key..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono" />
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Secret Key</label>
 <input type="password" placeholder="Nhập Secret..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono" />
 </div>
 </div>
 </div>
 <button className="w-full mt-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
 Lưu thiết lập SMS
 </button>
 </div>
 </DraggableGrid>
 
 <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 mt-6">
 <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Zap className="w-4 h-4" /> Kịch bản Gửi tin (Triggers)</h4>
 <p className="text-sm text-orange-800 mb-4">Cấu hình các sự kiện hệ thống tự động gọi API ZNS/SMS để thông báo chăm sóc khách hàng.</p>
 <div className="space-y-3">
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer">
 <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-400 focus:ring-orange-600" />
 <span className="text-sm font-medium text-slate-800 flex-1">Nhắn mã OTP xác thực khi đăng nhập/đổi mật khẩu</span>
 <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">Ưu tiên: SMS OTP</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer">
 <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-400 focus:ring-orange-600" />
 <span className="text-sm font-medium text-slate-800 flex-1">Gửi Zalo ZNS xác nhận Đặt hàng thành công</span>
 <span className="text-[10px] font-bold text-blue-600 bg-[#EAE7DF] px-2 py-1 rounded">Template: ZNS_ORDER_01</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer">
 <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-400 focus:ring-orange-600" />
 <span className="text-sm font-medium text-slate-800 flex-1">Gửi Zalo ZNS chúc mừng Sinh nhật Khách hàng (Loyalty)</span>
 <button className="text-[10px] font-bold text-blue-600 hover:text-orange-800 underline">Cấu hình Mẫu tin</button>
 </label>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'popup' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-100 pb-3">
 <Send className="w-4 h-4 text-blue-600" /> Trung tâm Gửi thông báo (Push Notification)
 </h3>

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Tiêu đề thông báo</label>
 <input 
 type="text" 
 placeholder="VD: Thông báo bảo trì hệ thống" 
 value={notiTitle}
 onChange={(e) => setNotiTitle(e.target.value)}
 className="w-full p-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nội dung thông báo (hỗ trợ văn bản)</label>
 <textarea 
 rows={4} 
 placeholder="Chi tiết thông báo..." 
 value={notiMessage}
 onChange={(e) => setNotiMessage(e.target.value)}
 className="w-full p-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-y"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Đối tượng nhận thông báo</label>
 <select className="w-full p-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white cursor-pointer mb-2">
 <option value="all">Tất cả nhân viên (Hệ thống ERP)</option>
 <option value="seller">Tất cả Nhà bán hàng (Seller Center)</option>
 <option value="customer">Tất cả Khách hàng (Storefront App)</option>
 <option value="dept_operations">Phòng Vận hành</option>
 <option value="dept_cskh">Phòng Chăm sóc Khách hàng</option>
 </select>
 </div>

 <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6 items-center">
 {notiStatus && (
 <span className="text-emerald-600 font-bold text-sm flex items-center gap-1 mr-4">
 <CheckCircle2 className="w-4 h-4" /> {notiStatus}
 </span>
 )}
 <button 
 onClick={() => {
 if (!notiTitle.trim() || !notiMessage.trim()) return;
 addNotification(notiTitle, notiMessage);
 setNotiStatus('Đã gửi thông báo thành công!');
 setNotiTitle('');
 setNotiMessage('');
 setTimeout(() => setNotiStatus(''), 3000);
 }}
 className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
 >
 <Send className="w-4 h-4" /> Bắn thông báo ngay
 </button>
 </div>
 </div>
 </div>

 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-100 pb-3">
 <AppWindow className="w-4 h-4 text-blue-600" /> Quản lý Popup Website
 </h3>
 
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái Popup hiện vật / Quảng cáo</label>
 <div className="flex items-center gap-2">
 <span className={cn("text-[10px] font-bold px-2 py-1 rounded", isPopupActive ? "text-emerald-700 bg-emerald-100" : "text-slate-500 bg-slate-100")}>{isPopupActive ? 'Đang mở (Banner tự chèn)' : 'Không tự động hiển thị'}</span>
 <div 
 onClick={() => setIsPopupActive(!isPopupActive)}
 className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", isPopupActive ? "bg-emerald-500" : "bg-slate-200")}
 >
 <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300", isPopupActive ? "left-[22px]" : "left-1")} />
 </div>
 </div>
 </div>
 
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4" columns={2} gap={24}>
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5">Tiêu đề Popup</label>
 <input 
 type="text" 
 placeholder="VD: Khuyến Mãi Hè 2024" 
 value={popupTitle}
 onChange={(e) => setPopupTitle(e.target.value)}
 className="w-full p-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5">Nội dung / Mô tả</label>
 <textarea 
 placeholder="Nhập nội dung hiển thị trong popup..." 
 value={popupDesc}
 rows={2}
 onChange={(e) => setPopupDesc(e.target.value)}
 className="w-full p-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-y" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5">Hình ảnh (URL hoặc upload)</label>
 <input 
 type="text" 
 placeholder="https://example.com/banner.jpg" 
 value={popupImage}
 onChange={(e) => setPopupImage(e.target.value)}
 className="w-full p-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5">Nút Call-To-Action (Nút điều hướng)</label>
 <div className="flex gap-2">
 <input 
 type="text" 
 placeholder="Tên nút (VD: Xem ngay)" 
 value={popupCtaText}
 onChange={(e) => setPopupCtaText(e.target.value)}
 className="w-1/3 p-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 <input 
 type="text" 
 placeholder="Link (URL)" 
 value={popupCtaLink}
 onChange={(e) => setPopupCtaLink(e.target.value)}
 className="flex-1 p-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>
 </div>
 </div>
 
 <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 flex flex-col items-center justify-center min-h-[200px] relative">
 <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest absolute top-2 right-2">Preview</div>
 <div className="w-full max-w-[240px] bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-4">
 {popupImage ? (
 <div className="h-24 overflow-hidden relative">
 <img src={popupImage} alt="Popup Banner Preview" className="w-full h-full object-cover" />
 </div>
 ) : (
 <div className="h-24 bg-primary-100 flex items-center justify-center">
 <Image className="w-8 h-8 text-primary-300" />
 </div>
 )}
 <div className="p-3 text-center space-y-2">
 <h4 className="font-bold text-sm text-slate-900 break-words">{popupTitle || '...'}</h4>
 <p className="text-[10px] text-slate-600 line-clamp-3 break-words">{popupDesc || '...'}</p>
 {(popupCtaText || popupCtaLink) && (
 <button className="w-full py-1.5 bg-primary-600 text-white text-[10px] font-bold rounded-md hover:bg-primary-700 mt-2 truncate px-2">
 {popupCtaText || 'Click here'}
 </button>
 )}
 </div>
 </div>
 </div>
 </DraggableGrid>
 
 <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
 <button 
 onClick={() => alert('Đã lưu cấu hình Popup!')}
 className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
 >
 Lưu thiết lập Popup
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'inventory' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <Package className="w-5 h-5 text-blue-600" /> Phân loại & Cấu hình Hàng hóa
 </h3>
 <p className="text-sm text-slate-600 mb-4">Quản lý các loại mặt hàng, định mức dự trữ, đơn vị tính, và các thuộc tính lưu kho (SKU/Barcode).</p>
 <DraggableGrid className="grid grid-cols-1 md:grid-cols-2 gap-6" columns={2} gap={24}>
 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
 <div className="flex justify-between items-center mb-4">
 <h4 className="font-bold text-slate-900">Danh mục Nhóm Hàng hóa</h4>
 <button className="text-xs text-blue-600 font-bold hover:underline">+ Thêm nhóm</button>
 </div>
 <div className="space-y-2">
 {['Nguyên vật liệu (Raw Materials)', 'Thành phẩm (Finished Goods)', 'Bán thành phẩm (WIP)', 'Hàng hóa thương mại (Trading Goods)'].map((type, i) => (
 <div key={i} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-2xl">
 <span className="text-sm font-medium">{type}</span>
 <button className="text-slate-500 hover:text-slate-700"><Edit2 className="w-4 h-4" /></button>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
 <h4 className="font-bold text-slate-900 mb-4">Phương pháp Quản lý Kho</h4>
 <div className="space-y-3">
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">
 <input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" defaultChecked />
 <span className="text-sm font-medium">Bình quân gia quyền (Weighted Average)</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">
 <input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" />
 <span className="text-sm font-medium">Nhập trước xuất trước (FIFO)</span>
 </label>
 </div>
 </div>
 </DraggableGrid>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>

 {showAddJobTitleModal && (
 <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
 <div className="bg-white rounded-xl shadow-sm w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
 <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
 <h3 className="font-bold text-slate-900">{editingJobTitle ? 'Chỉnh sửa Chức danh' : 'Thêm Chức danh mới'}</h3>
 <button 
 onClick={() => { setShowAddJobTitleModal(false); setEditingJobTitle(null); }}
 className="text-slate-500 hover:text-slate-700 font-bold text-lg leading-none"
 >
 &times;
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-800 mb-1">Tên chức danh <span className="text-red-500">*</span></label>
 <input 
 type="text" 
 value={newJobTitle.name || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, name: e.target.value})}
 className="w-full px-3 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm"
 placeholder="VD: Trưởng phòng Marketing"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-800 mb-1">Phòng ban <span className="text-red-500">*</span></label>
 <select 
 value={newJobTitle.department || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, department: e.target.value})}
 className="w-full px-3 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm"
 >
 <option value="">Chọn phòng ban</option>
 {MOCK_DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-800 mb-1">Cấp bậc</label>
 <select 
 value={newJobTitle.rank || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, rank: e.target.value})}
 className="w-full px-3 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm"
 >
 <option value="">Chọn cấp bậc</option>
 {MOCK_JOB_RANKS.map(r => <option key={r.id} value={r.id}>{r.name} (Level {r.level})</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-800 mb-1">Mô tả công việc</label>
 <textarea 
 value={newJobTitle.description || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, description: e.target.value})}
 className="w-full px-3 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm min-h-[100px]"
 placeholder="Mô tả ngắn gọn chức năng, nhiệm vụ..."
 />
 </div>
 </div>
 <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
 <button 
 onClick={() => { setShowAddJobTitleModal(false); setEditingJobTitle(null); }}
 className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100"
 >
 Hủy
 </button>
 <button 
 onClick={handleSaveJobTitle}
 disabled={!newJobTitle.name || !newJobTitle.department}
 className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
 >
 Lưu Chức danh
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Fee Management Modal */}
 {showFeeModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
 <div className="bg-white w-full max-w-lg rounded-2xl shadow-sm border border-slate-300 overflow-hidden animate-in zoom-in-95 slide-in- duration-300">
 <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-slate-100 text-blue-600 rounded-xl flex items-center justify-center">
 <BadgeDollarSign className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-slate-900">{editingFee ? 'Chỉnh sửa loại phí' : 'Thêm loại phí mới'}</h3>
 <p className="text-xs text-slate-600">Thiết lập tham số và phạm vi áp dụng phí</p>
 </div>
 </div>
 <button onClick={() => setShowFeeModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
 <X className="w-5 h-5 text-slate-500" />
 </button>
 </div>

 <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
 {/* Fee Name */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tên loại phí</label>
 <input 
 type="text" 
 value={newFee.name || ''}
 onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
 placeholder="VD: Phí vận hành kho, Phí thanh toán..."
 className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:border-slate-900 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Loại phí</label>
 <div className="flex bg-slate-100 p-1 rounded-xl">
 <button 
 onClick={() => setNewFee({ ...newFee, type: 'percentage' })}
 className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", newFee.type === 'percentage' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 Phần trăm (%)
 </button>
 <button 
 onClick={() => setNewFee({ ...newFee, type: 'fixed' })}
 className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", newFee.type === 'fixed' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 Cố định (đ)
 </button>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Giá trị</label>
 <div className="relative">
 <input 
 type="number" 
 value={newFee.value || ''}
 onChange={(e) => setNewFee({ ...newFee, value: parseFloat(e.target.value) })}
 className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold focus:border-slate-900 outline-none"
 />
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
 {newFee.type === 'percentage' ? '%' : 'đ'}
 </span>
 </div>
 </div>
 </div>

 {/* Targeting: Seller Type */}
 <div className="space-y-3">
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Áp dụng cho Loại Nhà Bán</label>
 <div className="flex gap-4">
 {['mall', 'normal'].map((type) => {
 const isSelected = newFee.applyTo?.sellerTypes.includes(type as any);
 return (
 <div 
 key={type}
 onClick={() => {
 const current = newFee.applyTo?.sellerTypes || [];
 const next = isSelected ? current.filter(t => t !== type) : [...current, type as any];
 setNewFee({ ...newFee, applyTo: { ...newFee.applyTo!, sellerTypes: next } });
 }}
 className={cn(
 "flex-1 p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3",
 isSelected ? "border-slate-900 bg-slate-100/50" : "border-slate-300 bg-white hover:border-slate-400"
 )}
 >
 <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", isSelected ? "border-slate-900 bg-slate-900" : "border-slate-400")}>
 {isSelected && <Check className="w-3 h-3 text-white" />}
 </div>
 <span className={cn("text-xs font-bold", isSelected ? "text-orange-800" : "text-slate-700")}>
 {type === 'mall' ? 'Shop Mall' : 'Seller thường'}
 </span>
 </div>
 );
 })}
 </div>
 </div>

 {/* Targeting: Categories */}
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ngành hàng áp dụng</label>
 <button 
 onClick={() => setNewFee({ ...newFee, applyTo: { ...newFee.applyTo!, categories: ['all'] } })}
 className="text-[10px] font-bold text-blue-600 hover:underline"
 >
 Tất cả ngành
 </button>
 </div>
 <div className="flex flex-wrap gap-2">
 {categoryFees.map(cat => {
 const isAll = newFee.applyTo?.categories.includes('all');
 const isSelected = isAll || newFee.applyTo?.categories.includes(cat.id);
 return (
 <button
 key={cat.id}
 disabled={isAll && newFee.applyTo?.categories.length === 1}
 onClick={() => {
 let next: string[];
 if (isAll) {
 next = [cat.id];
 } else {
 const current = newFee.applyTo?.categories || [];
 next = isSelected ? current.filter(id => id !== cat.id) : [...current, cat.id];
 if (next.length === 0) next = ['all'];
 }
 setNewFee({ ...newFee, applyTo: { ...newFee.applyTo!, categories: next } });
 }}
 className={cn(
 "px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all",
 isSelected ? "bg-primary-600 border-primary-600 text-white shadow-sm" : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"
 )}
 >
 {cat.name}
 </button>
 );
 })}
 </div>
 </div>

 {/* Description */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mô tả (Ghi chú)</label>
 <textarea 
 rows={2}
 value={newFee.description || ''}
 onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
 placeholder="Ghi chú về ý nghĩa loại phí này..."
 className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:border-slate-900 outline-none resize-none"
 />
 </div>
 </div>

 <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
 <button 
 onClick={() => setShowFeeModal(false)}
 className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
 >
 Hủy bỏ
 </button>
 <button 
 onClick={() => {
 if (editingFee) {
 setSystemFees(systemFees.map(f => f.id === editingFee.id ? { ...newFee as SystemFee, id: f.id } : f));
 } else {
 setSystemFees([...systemFees, { ...newFee as SystemFee, id: `sys-${Date.now()}`, isActive: true }]);
 }
 setShowFeeModal(false);
 addNotification('Đã cập nhật cấu hình', `Loại phí ${newFee.name} đã được lưu thành công.`);
 }}
 className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5"
 >
 {editingFee ? 'Cập nhật' : 'Xác nhận Thêm'}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Page Editor Modal */}
 {editingPageUrl && (
   <PageEditorModal
     url={editingPageUrl.url}
     defaultTitle={editingPageUrl.label}
     onClose={() => setEditingPageUrl(null)}
   />
 )}
 </>
 );
}
