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
  companyInfo: { brandName: 'VComm', tagline: 'Ná»n táº£ng thÆ°Æ¡ng máº¡i Ä‘iá»‡n tá»­ toÃ n diá»‡n', address: 'Táº§ng 5, TÃ²a nhÃ  Innovation, CÃ´ng viÃªn pháº§n má»m Quang Trung, P. TÃ¢n ChÃ¡nh Hiá»‡p, Q.12, TP. Há»“ ChÃ­ Minh', hotline: '1900 1234', email: 'support@vcomm.vn' },
  footerLinks: {
    col1Title: 'CHÄ‚M SÃ“C KHÃCH HÃ€NG',
    col1Items: [
      { label: 'Trung tÃ¢m trá»£ giÃºp', url: '/help' },
      { label: 'VComm Blog', url: '/blog' },
      { label: 'HÆ°á»›ng dáº«n mua sáº¯m', url: '/guide/buy' },
      { label: 'HÆ°á»›ng dáº«n bÃ¡n hÃ ng', url: '/guide/sell' },
      { label: 'Thanh toÃ¡n', url: '/payment' },
      { label: 'Váº­n chuyá»ƒn', url: '/shipping' },
      { label: 'Tráº£ hÃ ng & HoÃ n tiá»n', url: '/returns' },
    ],
    col2Title: 'Vá»€ VCOMM',
    col2Items: [
      { label: 'Giá»›i thiá»‡u vá» VComm', url: '/about' },
      { label: 'Tuyá»ƒn dá»¥ng', url: '/careers' },
      { label: 'Äiá»u khoáº£n VComm', url: '/terms' },
      { label: 'ChÃ­nh sÃ¡ch báº£o máº­t', url: '/privacy' },
      { label: 'ChÃ­nh hÃ£ng', url: '/authentic' },
      { label: 'KÃªnh ngÆ°á»i bÃ¡n', url: '/sellers' },
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
  legalInfo: { companyName: 'CÃ”NG TY Cá»” PHáº¦N CÃ”NG NGHá»† VCOMM', legalAddress: 'Táº§ng 5, TÃ²a nhÃ  Innovation, CÃ´ng viÃªn pháº§n má»m Quang Trung, P. TÃ¢n ChÃ¡nh Hiá»‡p, Q.12, TP. Há»“ ChÃ­ Minh', taxCode: '0101234567', representative: 'Nguyá»…n VÄƒn ThÆ°Æ¡ng', businessReg: '0101234567', businessRegDate: '01/01/2024' },
  copyrightText: 'Â© 2026 - Báº£n quyá»n thuá»™c vá» CÃ”NG TY Cá»” PHáº¦N CÃ”NG NGHá»† VCOMM',
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
 name: 'PhÃ­ cá»‘ Ä‘á»‹nh theo Ä‘Æ¡n (Fixed Fee)', 
 type: 'fixed', 
 value: 5000, 
 description: 'PhÃ­ xá»­ lÃ½ Ä‘Æ¡n hÃ ng cá»‘ Ä‘á»‹nh má»—i giao dá»‹ch thÃ nh cÃ´ng.', 
 isActive: true, 
 applyTo: { sellerTypes: ['mall', 'normal'], categories: ['all'] } 
 },
 { 
 id: 'f2', 
 name: 'PhÃ­ Marketing & Quáº£ng cÃ¡o', 
 type: 'percentage', 
 value: 2, 
 description: 'PhÃ­ há»— trá»£ cÃ¡c chÆ°Æ¡ng trÃ¬nh truyá»n thÃ´ng chung trÃªn SÃ n.', 
 isActive: false, 
 applyTo: { sellerTypes: ['mall'], categories: ['1', '4'] } 
 },
 { 
 id: 'f3', 
 name: 'PhÃ­ Ä‘Ã³ng gÃ³i há»— trá»£ (Fulfill)', 
 type: 'fixed', 
 value: 12000, 
 description: 'Ãp dá»¥ng cho cÃ¡c ngÃ nh hÃ ng cá»“ng ká»nh cáº§n Ä‘Ã³ng gÃ³i Ä‘áº·c biá»‡t.', 
 isActive: true, 
 applyTo: { sellerTypes: ['normal'], categories: ['3'] } 
 },
];

const MOCK_DEPARTMENTS: Department[] = [
 { id: 'D-001', name: 'Váº­n hÃ nh SÃ n', manager: 'LÃª HoÃ ng Minh', staffCount: 45 },
 { id: 'D-003', name: 'Kho váº­n nhÃ¡nh HN', manager: 'Tráº§n VÄƒn B', staffCount: 10, parentId: 'D-001' },
 { id: 'D-002', name: 'Marketing', manager: 'Nguyá»…n Diá»‡u Nhi', staffCount: 22 },
];
const MOCK_JOB_TITLES: JobTitle[] = [
 { id: 'T-001', name: 'Quáº£n lÃ½ kho', department: 'D-001', description: 'Quáº£n lÃ½ váº­n hÃ nh kho bÃ£i, nhÃ¢n sá»± kho.', rank: 'R-003' },
 { id: 'T-002', name: 'KOL Specialist', department: 'D-002', description: 'TÃ¬m kiáº¿m, lÃ m viá»‡c vÃ  Ä‘Ã m phÃ¡n vá»›i KOL/Influencer trÃªn MXH.', rank: 'R-001' },
];
const MOCK_JOB_RANKS: JobRank[] = [
 { id: 'R-001', name: 'NhÃ¢n viÃªn', level: 1 },
 { id: 'R-002', name: 'TrÆ°á»Ÿng nhÃ³m', level: 2 },
 { id: 'R-003', name: 'Quáº£n lÃ½', level: 3 },
];

const MOCK_AI_FEE_SUGGESTIONS: AiFeeSuggestion[] = [
 { category: 'Äiá»‡n tá»­ & CÃ´ng nghá»‡', currentFee: 3, suggestedFee: 3.5, reasoning: 'Nhu cáº§u cao, biÃªn lá»£i nhuáº­n seller á»•n Ä‘á»‹nh á»Ÿ má»©c 18%.', competitorAvg: 4, impactOnGmv: '+2.1% Revenue' },
 { category: 'Thá»i trang & Phá»¥ kiá»‡n', currentFee: 8, suggestedFee: 7.2, reasoning: 'Cáº¡nh tranh gáº¯t gao, giáº£m phÃ­ Ä‘á»ƒ hÃºt Seller cháº¥t lÆ°á»£ng cao.', competitorAvg: 6.5, impactOnGmv: '+15% Seller Growth' },
];

const MOCK_ROLES: PermissionRole[] = [
 { id: '1', name: 'SiÃªu quáº£n trá»‹ (Super Admin)', permissions: ['all'] },
 { id: '2', name: 'Quáº£n lÃ½ (Manager)', permissions: ['dashboard.view', 'pim.view', 'pim.edit', 'orders.view', 'orders.edit', 'orders.approve', 'finance.view', 'hr.view', 'hr.edit'] },
 { id: '3', name: 'NhÃ¢n viÃªn bÃ¡n hÃ ng (Sales)', permissions: ['dashboard.view', 'orders.view', 'orders.create', 'pim.view', 'customers.view'] },
 { id: '4', name: 'Káº¿ toÃ¡n (Accountant)', permissions: ['finance.view', 'finance.create', 'finance.edit', 'finance.approve', 'settlement.view', 'settlement.approve'] },
 { id: '5', name: 'ChÄƒm sÃ³c KhÃ¡ch hÃ ng', permissions: ['customers.view', 'customers.edit', 'wallet.view', 'wallet.edit', 'loyalty.view'] },
];

const MODULE_PERMISSIONS = [
 { 
 id: 'core', 
 label: 'Há»‡ thá»‘ng cá»‘t lÃµi', 
 modules: [
 { id: 'dashboard', label: 'Dashboard & BÃ¡o cÃ¡o', actions: ['view'] },
 { id: 'bi', label: 'PhÃ¢n tÃ­ch dá»¯ liá»‡u (BI)', actions: ['view'] },
 { id: 'settings', label: 'Cáº¥u hÃ¬nh há»‡ thá»‘ng', actions: ['view', 'edit'] },
 ]
 },
 {
 id: 'commerce',
 label: 'ThÆ°ong máº¡i & BÃ¡n hÃ ng',
 modules: [
 { id: 'pim', label: 'Sáº£n pháº©m (PIM)', actions: ['view', 'create', 'edit', 'delete'] },
 { id: 'orders', label: 'Quáº£n lÃ½ ÄÆ¡n hÃ ng', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
 { id: 'flash_sale', label: 'Flash Sale & Voucher', actions: ['view', 'create', 'edit', 'delete'] },
 { id: 'ipos', label: 'Pháº§n má»m iPOS', actions: ['view', 'create', 'edit', 'delete'] },
 ]
 },
 {
 id: 'finance',
 label: 'TÃ i chÃ­nh & Thanh toÃ¡n',
 modules: [
 { id: 'finance', label: 'Káº¿ toÃ¡n tá»•ng há»£p', actions: ['view', 'create', 'edit', 'delete', 'approve'] },
 { id: 'settlement', label: 'Äá»‘i soÃ¡t & CÃ´ng ná»£', actions: ['view', 'edit', 'approve'] },
 { id: 'wallet', label: 'VÃ­ & Thanh toÃ¡n', actions: ['view', 'edit'] },
 ]
 },
 {
 id: 'hr',
 label: 'NhÃ¢n sá»± & Tá»• chá»©c',
 modules: [
 { id: 'hr', label: 'Quáº£n trá»‹ nhÃ¢n sá»± (HR)', actions: ['view', 'create', 'edit', 'delete'] },
 { id: 'org', label: 'SÆ¡ Ä‘á»“ tá»• chá»©c', actions: ['view', 'edit'] },
 { id: 'payroll', label: 'Quáº£n lÃ½ lÆ°Æ¡ng', actions: ['view', 'edit', 'approve'] },
 ]
 }
];

const MOCK_WEBHOOKS: WebhookConfig[] = [
 { id: '1', name: 'ERP Brand Samsung Integration', url: 'https://api.samsung.com/webhook', events: ['order.created', 'order.cancelled'], status: 'active' },
 { id: '2', name: 'GHTK Logistis Status', url: 'https://webhook.ghtk.vn/callback', events: ['delivery.status'], status: 'active' },
];

const SETTINGS_MODULE_GROUPS = [
 {
 title: 'Váº­n hÃ nh & Kinh doanh',
 items: [
 { id: 'wallet_crm', label: 'Quáº£n lÃ½ VÃ­ CSKH', icon: Wallet, desc: 'Cáº¥u hÃ¬nh cÃ¡c loáº¡i VÃ­ Khuyáº¿n Máº¡i & TÃ­ch Ä‘iá»ƒm KH', color: 'primary' },
  { id: 'general', label: 'Cáº¥u hÃ¬nh chung', icon: Settings, desc: 'CÃ i Ä‘áº·t cÆ¡ báº£n há»‡ thá»‘ng, Payout tá»± Ä‘á»™ng', color: 'blue' },
 { id: 'appearance', label: 'Giao diá»‡n & Theme', icon: Sparkles, desc: 'TÃ¹y chá»‰nh mÃ u sáº¯c, bo gÃ³c, Lá»… táº¿t', color: 'rose' },
 { id: 'fees', label: 'PhÃ­ sÃ n & NgÃ nh hÃ ng', icon: BadgeDollarSign, desc: 'Setup tá»· lá»‡ hoa há»“ng theo tá»«ng ngÃ nh', color: 'emerald' },
 { id: 'website', label: 'Website & Menu', icon: Globe, desc: 'Quáº£n lÃ½ biá»ƒu máº«u, tÃªn miá»n vÃ  menu', color: 'indigo' },
 { id: 'storefront', label: 'Trang bÃ¡n hÃ ng', icon: AppWindow, desc: 'Footer, thÃ´ng tin cÃ´ng ty, MXH & phÃ¡p lÃ½', color: 'emerald' },
 { id: 'inventory', label: 'HÃ ng hÃ³a & Kho', icon: Package, desc: 'PhÃ¢n loáº¡i máº·t hÃ ng vÃ  lÆ°u kho', color: 'orange' },
 ]
 },
 {
 title: 'Há»‡ thá»‘ng & Báº£o máº­t',
 items: [
 { id: 'rbac', label: 'PhÃ¢n quyá»n (Roles)', icon: Lock, desc: 'Äiá»u hÆ°á»›ng truy cáº­p vÃ  quáº£n lÃ½ Matrix Roles', color: 'purple' },
 { id: 'api', label: 'OpenAPI & Webhooks', icon: Webhook, desc: 'Cáº¥p API token vÃ  báº¯n sá»± kiá»‡n Server', color: 'rose' },
 { id: 'popup', label: 'Popup & ThÃ´ng bÃ¡o', icon: Bell, desc: 'Thiáº¿t láº­p Push notification trung tÃ¢m', color: 'blue' },
 { id: 'comms', label: 'TÃ­ch há»£p KÃªnh', icon: MessageSquare, desc: 'Cáº¥u hÃ¬nh API gá»­i tin nháº¯n Zalo/SMS', color: 'cyan' },
 ]
 },
 {
 title: 'Cáº¥u trÃºc & Háº¡ táº§ng',
 items: [
 { id: 'org', label: 'CÆ¡ cáº¥u Tá»• chá»©c', icon: Building2, desc: 'CÃ¢y phÃ²ng ban vÃ  chá»©c danh nhÃ¢n sá»±', color: 'emerald' },
 { id: 'stores', label: 'Chuá»—i cá»­a hÃ ng', icon: Store, desc: 'Cáº¥u hÃ¬nh chi nhÃ¡nh vÃ  subdomain', color: 'indigo' },
 { id: 'address', label: 'Äá»‹a chá»‰ HÃ nh chÃ­nh', icon: MapPin, desc: 'Danh má»¥c Tá»‰nh/ThÃ nh/PhÆ°á»ng/XÃ£', color: 'slate' },
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
 { id: '1', name: 'HÃ  Ná»™i', code: 'HN', wards: 579, status: 'active' },
 { id: '2', name: 'Há»“ ChÃ­ Minh', code: 'HCM', wards: 312, status: 'active' },
 { id: '3', name: 'ÄÃ  Náºµng', code: 'DN', wards: 56, status: 'active' },
 { id: '4', name: 'Háº£i PhÃ²ng', code: 'HP', wards: 217, status: 'active' },
 { id: '5', name: 'Cáº§n ThÆ¡', code: 'CT', wards: 83, status: 'active' },
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
 { id: '1', name: 'Äiá»‡n tá»­ & CÃ´ng nghá»‡', sellerFee: 3, mallFee: 5, aiSuggestedSellerFee: 3.5, aiSuggestedMallFee: 5.5, aiReasoning: 'Nhu cáº§u cao, biÃªn lá»£i nhuáº­n seller á»•n Ä‘á»‹nh á»Ÿ má»©c 18%.' },
 { id: '2', name: 'Thá»i trang & Phá»¥ kiá»‡n', sellerFee: 8, mallFee: 12, aiSuggestedSellerFee: 7.2, aiSuggestedMallFee: 10.5, aiReasoning: 'Cáº¡nh tranh gáº¯t gao, giáº£m phÃ­ Ä‘á»ƒ hÃºt Seller cháº¥t lÆ°á»£ng cao.' },
 { id: '3', name: 'Gia dá»¥ng & Äá»i sá»‘ng', sellerFee: 5, mallFee: 8 },
 { id: '4', name: 'Sá»©c khá»e & Sáº¯c Ä‘áº¹p', sellerFee: 10, mallFee: 15 },
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
 const [popupTitle, setPopupTitle] = useState('Khuyáº¿n MÃ£i HÃ¨ 2024');
 const [popupDesc, setPopupDesc] = useState('SÄƒn deal chá»›p nhoÃ¡ng vá»›i rá»• hÃ ng giáº£m giÃ¡ 50% cÃ¹ng nhiá»u voucher Ä‘á»™c quyá»n.');
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

 // Site Config (Trang bÃ¡n hÃ ng) state
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
     addNotification('ÄÃ£ lÆ°u cáº¥u hÃ¬nh', 'Trang bÃ¡n hÃ ng Ä‘Ã£ Ä‘Æ°á»£c cáº­p nháº­t thÃ nh cÃ´ng.');
   } catch {
     addNotification('Lá»—i lÆ°u cáº¥u hÃ¬nh', 'KhÃ´ng thá»ƒ lÆ°u â€” vui lÃ²ng thá»­ láº¡i.');
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
   setSiteConfig(c => ({ ...c, paymentMethods: [...c.paymentMethods, { id: `pm-${Date.now()}`, label: 'PhÆ°Æ¡ng thá»©c má»›i', logo: '', active: true }] }));

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
      alert('Cáº¥u hÃ¬nh website Ä‘Ã£ Ä‘Æ°á»£c lÆ°u thÃ nh cÃ´ng!');
    }, 800);
  } catch (error) {
    console.error('Error saving website config:', error);
    setIsSavingWebsite(false);
    alert('CÃ³ lá»—i xáº£y ra khi lÆ°u cáº¥u hÃ¬nh!');
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
 alert('ÄÃ£ lÆ°u cÃ¡c thay Ä‘á»•i cáº¥u hÃ¬nh thÃ nh cÃ´ng!');
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
 alert(`ÄÃ£ Ã¡p dá»¥ng Ä‘á» xuáº¥t tá»‘i Æ°u AI cho ngÃ nh hÃ ng ${category?.name}`);
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
 name: 'Máº¹ & BÃ©',
 sellerFee: 4,
 mallFee: 6,
 aiReasoning: 'PhÃ¢n tÃ­ch tá»« AI: Sá»‘ lÆ°á»£ng tÃ¬m kiáº¿m "Bá»‰m sá»¯a" tÄƒng máº¡nh. BiÃªn lá»£i nhuáº­n máº£ng nÃ y khÃ¡ á»•n Ä‘á»‹nh.'
 },
 {
 id: (categoryFees.length + 2).toString(),
 name: 'Thá»ƒ thao & DÃ£ ngoáº¡i',
 sellerFee: 6,
 mallFee: 9,
 aiReasoning: 'PhÃ¢n tÃ­ch tá»« AI: Nhu cáº§u du lá»‹ch vÃ  thá»ƒ thao tÄƒng cao mÃ¹a thu/Ä‘Ã´ng. Dá»¯ liá»‡u cross-platform (social & sÃ n TMÄT) cho tháº¥y tiá»m nÄƒng.'
 }
 ];
 setCategoryFees(prev => [...prev, ...newItems]);
 setIsScanningAI(false);
 alert('AI Ä‘Ã£ phÃ¢n tÃ­ch dá»¯ liá»‡u thá»‹ trÆ°á»ng vÃ  tá»± Ä‘á»™ng Ä‘á» xuáº¥t thÃªm 2 ngÃ nh hÃ ng tiá»m nÄƒng!');
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
      <h1 className="text-lg font-bold text-slate-900">Cáº¥u hÃ¬nh & TÃ­ch há»£p Há»‡ thá»‘ng</h1>
      <p className="text-sm text-slate-500 mt-0.5">PhÃ¢n quyá»n roles, cáº¥u hÃ¬nh phÃ­ sÃ n vÃ  quáº£n lÃ½ OpenAPI/Webhook.</p>
    </div>
  </div>
  <div className="flex items-center gap-2 shrink-0">
    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors">
      <RefreshCw className="w-4 h-4 text-emerald-500" /> Lá»‹ch sá»­
    </button>
    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-xl transition-colors">
      <Sparkles className="w-4 h-4 text-purple-500" /> AI Audit
    </button>
    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shadow-sm">
      <Save className="w-4 h-4" />{isSaving ? 'Äang lÆ°u...' : 'LÆ°u thay Ä‘á»•i'}
    </button>
  </div>
 </div>

 <div className="flex flex-col gap-6">
 {/* Main Grid or Content Area */}
 {activeTab !== 'overview' && (
 <div className="flex items-center gap-3">
   <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-medium rounded-xl transition-colors shadow-sm">
     <ChevronLeft className="w-4 h-4" /> Tá»•ng quan
   </button>
   <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
   {[
   { id: 'general', label: 'Cáº¥u hÃ¬nh chung', icon: Settings },
   { id: 'fees', label: 'Cáº¥u hÃ¬nh PhÃ­ sÃ n', icon: BadgeDollarSign },
   { id: 'website', label: 'Cáº¥u hÃ¬nh Website', icon: Globe },
   { id: 'popup', label: 'Cáº¥u hÃ¬nh Popup & ThÃ´ng bÃ¡o', icon: Bell },
   { id: 'comms', label: 'TÃ­ch há»£p KÃªnh', icon: MessageSquare },
   { id: 'rbac', label: 'PhÃ¢n quyá»n & Roles', icon: Lock },
   { id: 'api', label: 'OpenAPI & Webhooks', icon: Webhook },
   { id: 'address', label: 'Cáº¥u hÃ¬nh Tá»‰nh/ThÃ nh', icon: MapPin },
   { id: 'org', label: 'CÆ¡ cáº¥u Tá»• chá»©c', icon: Building2 },
   { id: 'stores', label: 'Quáº£n lÃ½ Chuá»—i cá»­a hÃ ng', icon: Store },
   { id: 'inventory', label: 'HÃ ng hÃ³a & Kho', icon: Package },
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
 {/* Stat row â€” compact */}
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
   {[
     { label: 'Vai trÃ² há»‡ thá»‘ng', value: `${roles.length} Roles`,            badge: 'Báº£o máº­t cao',  badgeCls: 'bg-emerald-100 text-emerald-700', icon: Lock,            iconBg: 'bg-purple-500' },
     { label: 'TÃªn miá»n trá» vá»',  value: `${customDomains.length} Domains`,  badge: 'ÄÃ£ xÃ¡c thá»±c', badgeCls: 'bg-blue-100 text-blue-700',       icon: Globe,           iconBg: 'bg-blue-500' },
     { label: 'Äiá»ƒm Webhook',      value: `${MOCK_WEBHOOKS.length} Endpoints`,badge: '100% Uptime', badgeCls: 'bg-sky-100 text-sky-700',           icon: Webhook,         iconBg: 'bg-sky-500' },
     { label: 'NgÃ nh hÃ ng',        value: `${categoryFees.length} NhÃ³m`,     badge: 'Tá»‘i Æ°u AI',   badgeCls: 'bg-violet-100 text-violet-700',     icon: BadgeDollarSign, iconBg: 'bg-emerald-500' },
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

 {/* Grouped module list â€” compact horizontal rows */}
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
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
  <Sparkles className="w-5 h-5 text-rose-500" />
  Giao diá»‡n & Theme
 </h3>
 
 <div className="space-y-4">
  <h4 className="font-semibold text-slate-900">MÃ u sáº¯c chá»§ Ä‘áº¡o (Primary Color)</h4>
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
  <h4 className="font-semibold text-slate-900">Bo gÃ³c báº£ng biá»ƒu (Border Radius)</h4>
  <div className="flex gap-4">
  <button onClick={() => setBorderRadius('none')} className={`px-4 py-2 border ${borderRadius === 'none' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-none flex-1 font-medium`}>Sáº¯c cáº¡nh (none)</button>
  <button onClick={() => setBorderRadius('sm')} className={`px-4 py-2 border ${borderRadius === 'sm' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-sm flex-1 font-medium`}>Nháº¹ (sm)</button>
  <button onClick={() => setBorderRadius('lg')} className={`px-4 py-2 border ${borderRadius === 'lg' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-lg flex-1 font-medium`}>Vá»«a (lg)</button>
  <button onClick={() => setBorderRadius('xl')} className={`px-4 py-2 border ${borderRadius === 'xl' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-xl flex-1 font-medium`}>Cong (xl)</button>
  <button onClick={() => setBorderRadius('2xl')} className={`px-4 py-2 border ${borderRadius === '2xl' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-2xl flex-1 font-medium`}>Ráº¥t cong (2xl)</button>
  </div>
 </div>

 <div className="space-y-4">
  <h4 className="font-semibold text-slate-900 flex items-center gap-2">Theme Lá»… Táº¿t</h4>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {(['none', 'tet', 'christmas', 'mid-autumn', 'halloween'] as const).map(theme => (
  <button
  key={theme}
  onClick={() => setHolidayTheme(theme)}
  className={`p-4 border rounded-xl text-center flex flex-col items-center gap-2 transition-all ${holidayTheme === theme ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' : 'border-slate-300 hover:border-slate-400'}`}
  >
  <span className="text-2xl">
  {theme === 'tet' ? 'ðŸ§§' : theme === 'christmas' ? 'ðŸŽ„' : theme === 'mid-autumn' ? 'ðŸŒ•' : theme === 'halloween' ? 'ðŸŽƒ' : 'âœ¨'}
  </span>
  <span className="font-semibold capitalize">{theme === 'none' ? 'Máº·c Ä‘á»‹nh' : theme}</span>
  </button>
  ))}
  </div>
 </div>
 
 </div>
 </div>
 )}

 {activeTab === 'general' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <h3 className="font-bold text-slate-900">Cáº¥u hÃ¬nh vÃ­ & Payout</h3>
 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
 <div className="space-y-1">
 <p className="text-sm font-bold text-slate-900">TÃ­nh nÄƒng Duyá»‡t Payout tá»± Ä‘á»™ng</p>
 <p className="text-[10px] text-slate-600 italic text-pretty max-w-md">Náº¿u Ä‘Æ°á»£c báº­t, há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng giáº£i ngÃ¢n cho Seller khi Ä‘Æ¡n hÃ ng chuyá»ƒn sang tráº¡ng thÃ¡i "ThÃ nh cÃ´ng" vÃ  qua thá»i gian khiáº¿u náº¡i (7 ngÃ y).</p>
 </div>
 <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
 <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
 </div>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-4">
 <button className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all border border-transparent">
 Há»§y bá»
 </button>
 <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5 active:scale-95">
 LÆ°u cáº¥u hÃ¬nh
 </button>
 </div>
 </div>
 )}

  {activeTab === 'wallet_crm' && (
  <div className="animate-in fade-in duration-300 space-y-6">
    <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-primary-600" /> Cáº¥u hÃ¬nh VÃ­ CSKH & Khuyáº¿n máº¡i
        </h3>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 transition flex items-center gap-2">
          <Plus className="w-4 h-4" /> ThÃªm loáº¡i VÃ­ má»›i
        </button>
      </div>

      <div className="space-y-4">
        {[{
          name: 'VÃ­ Khuyáº¿n Máº¡i',
          desc: 'VÃ­ chá»©a tiá»n Ä‘Æ°á»£c táº·ng tá»« cÃ¡c chÆ°Æ¡ng trÃ¬nh khuyáº¿n máº¡i, cÃ³ thá»ƒ giá»›i háº¡n % thanh toÃ¡n trÃªn má»—i Ä‘Æ¡n hÃ ng.',
          usedFor: 'Thanh toÃ¡n tá»‘i Ä‘a 50% giÃ¡ trá»‹ Ä‘Æ¡n hÃ ng',
          canTransfer: false,
          color: 'blue'
        }, {
          name: 'VÃ­ HoÃ n Tiá»n (Cashback)',
          desc: 'Sá»‘ tiá»n hoÃ n láº¡i tá»« viá»‡c há»§y Ä‘Æ¡n hoáº·c chÆ°Æ¡ng trÃ¬nh Ä‘á»‘i soÃ¡t.',
          usedFor: 'Thanh toÃ¡n 100% hoáº·c RÃºt vá» tÃ i khoáº£n Bank',
          canTransfer: true,
          color: 'emerald'
        }, {
          name: 'VÃ­ ThÃ nh ViÃªn (Loyalty)',
          desc: 'Äiá»ƒm thÄƒng háº¡ng (KhÃ´ng quy Ä‘á»•i ra tiá»n tháº­t).',
          usedFor: 'Giá»¯ háº¡ng & Táº­n hÆ°á»Ÿng Ä‘áº·c quyá»n',
          canTransfer: false,
          color: 'purple'
        }].map(wallet => (
          <div key={wallet.name} className="border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <span className={cn("w-3 h-3 rounded-full", wallet.color === "emerald" ? "bg-emerald-500" : wallet.color === "blue" ? "bg-blue-500" : wallet.color === "indigo" ? "bg-indigo-500" : "bg-slate-500")}></span>
                {wallet.name}
              </h4>
              <p className="text-sm text-slate-600 mt-1">{wallet.desc}</p>
            </div>
            
            <div className="flex flex-col gap-2 md:items-end">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">Quy táº¯c: {wallet.usedFor}</span>
              <label className="flex items-center gap-2 text-sm text-slate-800 cursor-pointer">
                <input type="checkbox" checked={wallet.canTransfer} readOnly className="w-4 h-4 text-primary-600 rounded border-slate-400" />
                Cho phÃ©p KH Ä‘iá»u chuyá»ƒn / RÃºt
              </label>
            </div>
          </div>
        ))}
      </div>

      <div className="pt-6 border-t border-slate-200">
        <h4 className="font-bold text-slate-900 mb-4">Quy táº¯c Ä‘iá»u chuyá»ƒn sá»‘ dÆ° (Transfer Rules)</h4>
        <div className="p-4 bg-orange-50 border border-orange-100 rounded-lg space-y-3">
           <div className="flex items-center justify-between text-sm font-medium text-slate-900">
             <div className="flex items-center gap-3">
               <span className="w-40">VÃ­ HoÃ n Tiá»n</span>
               <ArrowRight className="w-4 h-4 text-slate-500" />
               <span className="w-40">VÃ­ Khuyáº¿n Máº¡i</span>
             </div>
             <span className="text-right">Tá»· lá»‡ quy Ä‘á»•i: 1 VNÄ = 1.1 Khuyáº¿n máº¡i</span>
           </div>
           <div className="flex items-center justify-between text-sm font-medium text-slate-900 opacity-60">
             <div className="flex items-center gap-3">
               <span className="w-40">VÃ­ Khuyáº¿n Máº¡i</span>
               <ArrowRight className="w-4 h-4 text-slate-500" />
               <span className="w-40">VÃ­ HoÃ n Tiá»n</span>
             </div>
             <span className="text-right text-rose-600 italic">Cáº¥m (KhÃ´ng há»— trá»£)</span>
           </div>
        </div>
      </div>
    </div>
  </div>
  )}

 {activeTab === 'fees' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 {/* Section 1: Dynamic System Fees */}
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <div className="flex items-center justify-between">
 <div>
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <AlertCircle className="w-4 h-4 text-orange-500" /> Quáº£n lÃ½ cÃ¡c loáº¡i Chi phÃ­ Há»‡ thá»‘ng há»— trá»£
 </h3>
 <p className="text-xs text-slate-600 mt-1">Cáº¥u hÃ¬nh linh hoáº¡t cÃ¡c loáº¡i phÃ­ phÃ¡t sinh ngoÃ i phÃ­ hoa há»“ng (Fixed hoáº·c %).</p>
 </div>
 <button 
 onClick={() => { setEditingFee(null); setNewFee({ type: 'percentage', value: 0, isActive: true, applyTo: { sellerTypes: ['normal'], categories: ['all'] } }); setShowFeeModal(true); }}
 className="flex items-center gap-2 bg-[#111827] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm"
 >
 <Plus className="w-4 h-4" /> ThÃªm loáº¡i phÃ­ má»›i
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
 <p className="text-[10px] text-slate-600">{fee.type === 'fixed' ? 'Sá»‘ tiá»n cá»‘ Ä‘á»‹nh' : 'Tá»· lá»‡ % doanh thu'}</p>
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
 {fee.applyTo.sellerTypes.map(st => st === 'mall' ? 'Shop Mall' : 'Seller thÆ°á»ng').join(', ')}
 </div>
 <div className="flex items-center gap-1.5 text-[10px] text-slate-700">
 <Package className="w-3 h-3" />
 {fee.applyTo.categories.includes('all') ? 'Táº¥t cáº£ ngÃ nh hÃ ng' : `Ãp dá»¥ng ${fee.applyTo.categories.length} nhÃ³m`}
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
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
 <BadgeDollarSign className="w-4 h-4 text-blue-600" /> PhÃ­ hoa há»“ng theo NgÃ nh hÃ ng & Loáº¡i NhÃ  BÃ¡n
 </h3>
 <p className="text-xs text-slate-600 mt-1">Cáº¥u hÃ¬nh linh hoáº¡t má»©c phÃ­ SÃ n thu tá»« Seller thÆ°á»ng vÃ  Shop Mall (Ä‘á»‘i tÃ¡c chÃ­nh hÃ£ng).</p>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={handleAIScanCategories}
 disabled={isScanningAI}
 className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
 >
 <RefreshCw className={cn("w-4 h-4", isScanningAI ? "animate-spin" : "")} /> 
 {isScanningAI ? 'AI Ä‘ang phÃ¢n tÃ­ch...' : 'AI Ä‘á» xuáº¥t ngÃ nh hÃ ng'}
 </button>
 <button 
 onClick={() => setShowAddCategory(true)}
 className="flex items-center gap-1.5 text-xs bg-primary-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-primary-700 transition-colors shadow-sm"
 >
 <Plus className="w-4 h-4" /> ThÃªm ngÃ nh hÃ ng
 </button>
 </div>
 </div>

 {showAddCategory && (
 <div className="mb-4 p-4 bg-slate-50 border border-slate-300 rounded-xl flex items-center gap-3 animate-in slide-in- duration-200">
 <label className="text-sm font-bold text-slate-800 whitespace-nowrap">TÃªn ngÃ nh hÃ ng:</label>
 <input 
 type="text" 
 placeholder="VD: Máº¹ & BÃ©, Äá»“ gia dá»¥ng..." 
 className="flex-1 p-2 bg-white border border-slate-300 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
 value={newCategoryName}
 onChange={(e) => setNewCategoryName(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
 />
 <button onClick={handleAddCategory} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700">LÆ°u</button>
 <button onClick={() => setShowAddCategory(false)} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-300">Há»§y</button>
 </div>
 )}

 <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto min-w-0">
 <table className="w-full text-sm">
 <thead className="bg-slate-50 border-b border-slate-300">
 <tr>
 <th className="px-5 py-4 text-left font-bold text-slate-500 text-xs uppercase tracking-wider w-[30%]">NgÃ nh hÃ ng</th>
 <th className="px-5 py-4 text-center border-l border-slate-300 bg-slate-100/50 w-[25%]">
 <div className="flex flex-col items-center gap-1">
 <span className="font-bold text-blue-800 text-[11px] uppercase tracking-wider">Seller ThÆ°á»ng</span>
 <span className="text-[9px] font-medium text-blue-600">NhÃ  bÃ¡n cÃ¡ nhÃ¢n/nhá» láº»</span>
 </div>
 </th>
 <th className="px-5 py-4 text-center border-l border-slate-300 bg-amber-50/50 w-[25%]">
 <div className="flex flex-col items-center gap-1">
 <span className="font-bold text-amber-800 text-[11px] uppercase tracking-wider">Shop Mall</span>
 <span className="text-[9px] font-medium text-amber-600">Äá»‘i tÃ¡c chÃ­nh hÃ£ng</span>
 </div>
 </th>
 <th className="px-5 py-4 text-right font-bold text-slate-500 text-[10px] uppercase tracking-wider w-[20%]">Tá»‘i Æ°u AI</th>
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
 <span className="text-[10px] text-blue-600 font-bold bg-[#EAE7DF] px-2 py-0.5 rounded-full">AI khuyÃªn dÃ¹ng: {cf.aiSuggestedSellerFee}%</span>
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
 <span className="text-[10px] text-amber-600 font-bold bg-amber-100 px-2 py-0.5 rounded-full">AI khuyÃªn dÃ¹ng: {cf.aiSuggestedMallFee}%</span>
 )}
 </div>
 </td>
 <td className="px-5 py-4 text-right">
 {cf.aiSuggestedSellerFee && (
 <button 
 onClick={() => handleApplyAiSuggestion(cf.id)}
 className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-3 py-2 rounded-xl border border-primary-100 hover:bg-primary-600 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
 title={`Gá»£i Ã½: ${cf.aiReasoning}`}
 >
 <Sparkles className="w-4 h-4" /> Ãp dá»¥ng
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
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-100 pb-3">
 <Globe className="w-4 h-4 text-blue-600" /> Cáº¥u hÃ¬nh Website Tá»•ng (Há»‡ thá»‘ng ERP & Storefront)
 </h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Danh sÃ¡ch tÃªn miá»n</label>
 <div className="space-y-2">
 {customDomains.map((domain, index) => (
 <div key={index} className="flex gap-2">
 <input 
 type="text" 
 value={domain} 
 onChange={(e) => updateDomain(index, e.target.value)}
 placeholder="vÃ­ dá»¥: store.domain.com" 
 className="flex-1 p-3 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-slate-900 transition-all" 
 />
 <button onClick={() => removeDomain(index)} className="p-3 text-red-500 hover:bg-red-50 rounded-lg">
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 <button onClick={addDomain} className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 mt-2">
 <Plus className="w-3 h-3" /> ThÃªm tÃªn miá»n má»›i
 </button>
 </div>
 <p className="text-[10px] text-[#9CA3AF] mt-1.5 leading-relaxed">TÃªn miá»n trá» vá» há»‡ thá»‘ng VComm ERP.</p>
 </div>
 </div>

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Logo ToÃ n Há»‡ Thá»‘ng</label>
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
 Nháº¥n Ä‘á»ƒ táº£i lÃªn hoáº·c kÃ©o tháº£ Logo
 </span>
 <p className="text-[10px] text-[#9CA3AF] mt-1">PNG, JPG tá»‘i Ä‘a 5MB</p>
 </label>
 </div>
 </div>
 </div>
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Favicon Há»‡ Thá»‘ng</label>
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
 Nháº¥n Ä‘á»ƒ táº£i lÃªn hoáº·c kÃ©o tháº£ Favicon
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
       Äang lÆ°u...
     </>
   ) : (
     <>
       <Save className="w-4 h-4" />
       LÆ°u cáº¥u hÃ¬nh website
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
     {/* â”€â”€ Section helper â”€â”€ */}
     {([
       { key: 'companyInfo', title: 'ThÃ´ng tin cÃ´ng ty', icon: Building2 },
       { key: 'footerLinks', title: 'Cá»™t liÃªn káº¿t Footer', icon: Globe },
       { key: 'paymentMethods', title: 'PhÆ°Æ¡ng thá»©c Thanh toÃ¡n & Váº­n chuyá»ƒn', icon: CreditCard },
       { key: 'socialLinks', title: 'Máº¡ng xÃ£ há»™i', icon: Link2 },
       { key: 'legalInfo', title: 'ThÃ´ng tin phÃ¡p lÃ½', icon: ShieldCheck },
       { key: 'preview', title: 'Xem trÆ°á»›c Footer', icon: AppWindow },
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
                   { field: 'brandName', label: 'TÃªn thÆ°Æ¡ng hiá»‡u', placeholder: 'VComm' },
                   { field: 'tagline', label: 'Slogan / MÃ´ táº£ ngáº¯n', placeholder: 'Ná»n táº£ng TMÄT toÃ n diá»‡n' },
                   { field: 'hotline', label: 'Hotline', placeholder: '1900 1234' },
                   { field: 'email', label: 'Email há»— trá»£', placeholder: 'support@vcomm.vn' },
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
                   <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Äá»‹a chá»‰ vÄƒn phÃ²ng</label>
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
                         <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">TiÃªu Ä‘á» cá»™t</label>
                         <input
                           type="text"
                           value={siteConfig.footerLinks[titleKey]}
                           onChange={e => setSiteConfig(c => ({ ...c, footerLinks: { ...c.footerLinks, [titleKey]: e.target.value } }))}
                           className="w-full p-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Danh sÃ¡ch liÃªn káº¿t</label>
                         {siteConfig.footerLinks[colKey].map((item, idx) => (
                           <div key={idx} className="flex gap-2">
                             <input
                               type="text"
                               value={item.label}
                               onChange={e => updateFooterLink(colKey, idx, 'label', e.target.value)}
                               placeholder="NhÃ£n hiá»ƒn thá»‹"
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
                               title="Chá»‰nh sá»­a ná»™i dung trang"
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
                           <Plus className="w-3 h-3" /> ThÃªm liÃªn káº¿t
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
                 <p className="text-xs text-slate-500">Quáº£n lÃ½ danh sÃ¡ch phÆ°Æ¡ng thá»©c thanh toÃ¡n hiá»ƒn thá»‹ á»Ÿ footer â€” báº­t/táº¯t, Ä‘á»•i tÃªn vÃ  upload logo riÃªng.</p>

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
                           title="Click Ä‘á»ƒ upload logo"
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
                             title="XÃ³a logo"
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
                         placeholder="TÃªn phÆ°Æ¡ng thá»©c..."
                       />

                       {/* Status badge */}
                       <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', pm.active ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400')}>
                         {pm.active ? 'Hiá»‡n' : 'áº¨n'}
                       </span>

                       {/* Delete */}
                       <button
                         onClick={() => removePaymentMethod(pm.id)}
                         className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                         title="XÃ³a phÆ°Æ¡ng thá»©c"
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
                   <Plus className="w-4 h-4" /> ThÃªm phÆ°Æ¡ng thá»©c thanh toÃ¡n
                 </button>

                 <p className="text-[10px] text-slate-400 pt-1">
                   KÃ©o Ä‘á»ƒ sáº¯p xáº¿p thá»© tá»± hiá»ƒn thá»‹ â€¢ Logo nÃªn cÃ³ kÃ­ch thÆ°á»›c 120Ã—80px, ná»n tráº¯ng hoáº·c trong suá»‘t
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
                   <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">TÃªn cÃ´ng ty (Ä‘áº§y Ä‘á»§ theo phÃ¡p lÃ½)</label>
                   <input type="text" value={siteConfig.legalInfo.companyName}
                     onChange={e => setSiteConfig(c => ({ ...c, legalInfo: { ...c.legalInfo, companyName: e.target.value } }))}
                     className="w-full p-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Äá»‹a chá»‰ phÃ¡p lÃ½</label>
                   <textarea value={siteConfig.legalInfo.legalAddress}
                     onChange={e => setSiteConfig(c => ({ ...c, legalInfo: { ...c.legalInfo, legalAddress: e.target.value } }))}
                     rows={2} className="w-full p-2.5 rounded-2xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" />
                 </div>
                 {([
                   { field: 'taxCode' as const, label: 'MÃ£ sá»‘ thuáº¿', placeholder: '' },
                   { field: 'representative' as const, label: 'NgÆ°á»i Ä‘áº¡i diá»‡n phÃ¡p luáº­t', placeholder: '' },
                   { field: 'businessReg' as const, label: 'Sá»‘ GCNÄKDN', placeholder: '' },
                   { field: 'businessRegDate' as const, label: 'NgÃ y cáº¥p láº§n Ä‘áº§u', placeholder: 'DD/MM/YYYY' },
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
                   <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">DÃ²ng báº£n quyá»n (Copyright)</label>
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
                   <span className="ml-2 text-xs text-slate-400 font-mono">Footer Preview â€” {siteConfig.companyInfo.brandName}</span>
                 </div>
                 <div className="p-6 bg-white">
                   <div className="grid grid-cols-4 gap-4 pb-6 border-b border-slate-200">
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
                           <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">THANH TOÃN</div>
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
                         <div className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">THEO DÃ•I</div>
                         <div className="flex gap-2">
                           {siteConfig.socialLinks.facebook && <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[9px] font-bold">f</div>}
                           {siteConfig.socialLinks.instagram && <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-[9px] font-bold">in</div>}
                           {siteConfig.socialLinks.twitter && <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-[9px] font-bold">X</div>}
                           {siteConfig.socialLinks.youtube && <div className="w-6 h-6 rounded-full bg-red-600 flex items-center justify-center text-white text-[9px] font-bold">â–¶</div>}
                           {siteConfig.socialLinks.tiktok && <div className="w-6 h-6 rounded-full bg-black flex items-center justify-center text-white text-[9px] font-bold">tt</div>}
                         </div>
                       </div>
                     </div>
                   </div>
                   {/* Legal bottom bar */}
                   <div className="pt-4 text-center space-y-0.5">
                     <p className="text-[10px] font-bold text-slate-600">{siteConfig.legalInfo.companyName}</p>
                     <p className="text-[10px] text-slate-400">Äá»‹a chá»‰: {siteConfig.legalInfo.legalAddress}</p>
                     <p className="text-[10px] text-slate-400">MÃ£ sá»‘ thuáº¿: {siteConfig.legalInfo.taxCode} â€” Äáº¡i diá»‡n: {siteConfig.legalInfo.representative}</p>
                     {siteConfig.legalInfo.businessReg && (
                       <p className="text-[10px] text-slate-400">
                         Giáº¥y chá»©ng nháº­n ÄKDN sá»‘ {siteConfig.legalInfo.businessReg} do Sá»Ÿ Káº¿ hoáº¡ch vÃ  Äáº§u tÆ° TP.HCM cáº¥p láº§n Ä‘áº§u ngÃ y {siteConfig.legalInfo.businessRegDate}
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
           <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Äang lÆ°u...</>
         ) : (
           <><Save className="w-4 h-4" />LÆ°u cáº¥u hÃ¬nh Trang bÃ¡n hÃ ng</>
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
 <Lock className="w-4 h-4 text-blue-600" /> Quáº£n lÃ½ Vai trÃ² & PhÃ¢n quyá»n
 </h3>
 <button 
 onClick={() => {
 const newId = (roles.length + 1).toString();
 const newRole: PermissionRole = { id: newId, name: 'Vai trÃ² má»›i', permissions: [] };
 setRoles([...roles, newRole]);
 setEditingRole(newRole);
 }}
 className="flex items-center gap-2 text-xs font-bold text-blue-600 hover:underline"
 >
 <Plus className="w-3.5 h-3.5" /> Táº¡o Vai trÃ² má»›i
 </button>
 </div>
 <div className="overflow-x-auto min-w-0">
 <table className="w-full text-left">
 <thead>
 <tr className="bg-slate-50 border-b border-slate-100">
 <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">TÃªn Vai trÃ²</th>
 <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase">Sá»‘ quyá»n háº¡n</th>
 <th className="px-6 py-3 text-[10px] font-bold text-slate-500 uppercase text-right">Thao tÃ¡c</th>
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
 {role.permissions.includes('all') ? 'ToÃ n quyá»n' : `${role.permissions.length} quyá»n chi tiáº¿t`}
 </span>
 </td>
 <td className="px-6 py-4 text-right">
 <button 
 onClick={() => setEditingRole(role)}
 className="text-xs font-bold text-blue-600 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all"
 >
 Thiáº¿t láº­p chi tiáº¿t
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
 <p className="text-xs text-slate-600">Thiáº¿t láº­p ma tráº­n quyá»n cho {editingRole.name}</p>
 </div>
 </div>
 <div className="flex gap-2">
 <button 
 onClick={() => setEditingRole(null)}
 className="px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-lg transition-all"
 >
 Há»§y bá»
 </button>
 <button 
 onClick={() => {
 setRoles(roles.map(r => r.id === editingRole.id ? editingRole : r));
 setEditingRole(null);
 addNotification('ÄÃ£ cáº­p nháº­t phÃ¢n quyá»n', `Vai trÃ² ${editingRole.name} Ä‘Ã£ Ä‘Æ°á»£c lÆ°u thÃ nh cÃ´ng.`);
 }}
 className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5"
 >
 LÆ°u thay Ä‘á»•i
 </button>
 </div>
 </div>

 <div className="bg-white rounded-2xl border border-slate-300 shadow-sm overflow-hidden">
 <div className="p-4 bg-slate-50 border-b border-slate-300 flex justify-between items-center">
 <h4 className="font-bold text-slate-900 text-sm">Ma tráº­n Quyá»n háº¡n chi tiáº¿t</h4>
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
 <span className="text-xs font-bold text-slate-800">GÃ¡n ToÃ n quyá»n (Super Admin)</span>
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
 action === 'create' ? 'Táº¡o' : 
 action === 'edit' ? 'Sá»­a' : 
 action === 'delete' ? 'XÃ³a' : 
 action === 'approve' ? 'Duyá»‡t' : action}
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
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <Key className="w-4 h-4 text-orange-500" /> API Keys & Access Tokens
 </h3>
 <p className="text-xs text-slate-500">Cáº¥p quyá»n cho bÃªn thá»© 3 (Brand, Logistics) truy cáº­p trá»±c tiáº¿p vÃ o API sÃ n.</p>
 <div className="p-3 bg-slate-50 rounded-lg font-mono text-[10px] text-slate-600 flex justify-between items-center">
 <span>sk_live_vcomm_*********************</span>
 <button className="text-blue-600 font-bold">Sao chÃ©p</button>
 </div>
 <button className="w-full py-2 border border-slate-200 rounded-2xl text-xs font-bold hover:bg-slate-50">Táº¡o má»›i Secret Key</button>
 </div>
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <AppWindow className="w-4 h-4 text-blue-600" /> Webhook Settings
 </h3>
 <p className="text-xs text-slate-500">Tá»± Ä‘á»™ng Ä‘áº©y thÃ´ng bÃ¡o sá»± kiá»‡n (ÄÆ¡n hÃ ng, Äá»‘i soÃ¡t) vá» Server Ä‘á»‘i tÃ¡c.</p>
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
 <button className="w-full py-2 bg-[#111827] text-white rounded-lg text-xs font-bold hover:bg-slate-800">Cáº¥u hÃ¬nh Webhook má»›i</button>
 </div>
 </div>

 <div className="bg-blue-900 text-white p-6 rounded-lg flex items-center gap-6">
 <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
 <Globe className="w-8 h-8 text-blue-600" />
 </div>
 <div>
 <h4 className="font-bold text-lg mb-1">OpenAPI Public Documentation</h4>
 <p className="text-slate-500 text-xs">Cung cáº¥p tÃ i liá»‡u tÃ­ch há»£p (Swagger/Postman) cho cá»™ng Ä‘á»“ng phÃ¡t triá»ƒn vÃ  Ä‘á»‘i tÃ¡c chiáº¿n lÆ°á»£c Ä‘á»ƒ káº¿t ná»‘i trá»±c tiáº¿p kho hÃ ng Brand vá»›i váº­n hÃ nh sÃ n.</p>
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
 <h3 className="text-sm font-bold text-slate-800">Chá»n Ä‘á»‹a chá»‰ nhanh</h3>
 <span className="font-mono text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5">Tá»‰nh â†’ Huyá»‡n â†’ XÃ£</span>
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
 <h3 className="text-sm font-bold text-slate-800">Danh sÃ¡ch Tá»‰nh/ThÃ nh phá»‘</h3>
 <span className="font-mono text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5">Nguá»“n: provinces.open-api.vn</span>
 </div>
 <VietnamProvinceBrowser />
 </div>
 </div>
 )}

 {activeTab === 'org' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <Building2 className="w-5 h-5 text-blue-600" /> Quáº£n lÃ½ CÆ¡ cáº¥u Tá»• chá»©c
 </h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:col-span-1">
 <h4 className="font-bold text-slate-900 mb-4">PhÃ²ng ban</h4>
 {MOCK_DEPARTMENTS.map((dept) => (
 <div key={dept.id} className={cn("bg-white p-3 rounded-2xl border border-slate-200 mb-2 flex justify-between items-center", dept.parentId ? "ml-6 border-l-4 border-l-blue-400" : "")}>
 <span className="text-sm font-medium">{dept.name}</span>
 <button className="text-[10px] bg-slate-100 px-2 py-1 rounded">Sá»­a</button>
 </div>
 ))}
 </div>
 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:col-span-1">
 <div className="flex justify-between items-center mb-4">
 <h4 className="font-bold text-slate-900">Chá»©c danh</h4>
 <button 
 onClick={() => { setNewJobTitle({}); setEditingJobTitle(null); setShowAddJobTitleModal(true); }}
 className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-slate-800 transition"
 >
 <Plus className="w-3 h-3 inline" /> ThÃªm
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
 >Sá»­a</button>
 </div>
 <div className="text-xs text-slate-600 mb-1 line-clamp-2" title={title.description}>{title.description || 'ChÆ°a cÃ³ mÃ´ táº£'}</div>
 <div className="flex gap-2 text-[10px]">
 <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
 PhÃ²ng: {MOCK_DEPARTMENTS.find(d => d.id === title.department)?.name || title.department}
 </span>
 {title.rank && (
 <span className="bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded">
 Cáº¥p báº­c: {MOCK_JOB_RANKS.find(r => r.id === title.rank)?.name || title.rank}
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 md:col-span-1">
 <div className="flex justify-between items-center mb-4">
 <h4 className="font-bold text-slate-900">Cáº¥p báº­c</h4>
 <button className="text-xs bg-slate-200 text-slate-800 px-2 py-1 rounded hover:bg-slate-300 transition">
 <Plus className="w-3 h-3 inline" /> ThÃªm
 </button>
 </div>
 <div className="space-y-2">
 {MOCK_JOB_RANKS.map((item) => (
 <div key={item.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex justify-between items-center shadow-sm">
 <div>
 <div className="text-sm font-medium">{item.name}</div>
 <div className="text-[10px] text-slate-500">Level: {item.level}</div>
 </div>
 <button className="text-[10px] bg-slate-100 px-2 py-1 rounded">Sá»­a</button>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'stores' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <Building2 className="w-5 h-5 text-blue-600" /> Quáº£n lÃ½ Chuá»—i cá»­a hÃ ng / Chi nhÃ¡nh
 </h3>
 <button className="bg-slate-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#EAE7DF] flex items-center gap-2">
 <Plus className="w-4 h-4" /> ThÃªm Cá»­a hÃ ng
 </button>
 </div>

 <div className="bg-primary-50 border border-primary-100 rounded-lg p-5 mb-6">
 <h4 className="font-bold text-primary-900 mb-2 flex items-center gap-2"><Globe className="w-4 h-4" /> Cáº¥u hÃ¬nh TÃªn miá»n (Domain)</h4>
 <p className="text-sm text-primary-700 mb-4">CÃ¡c chi nhÃ¡nh cÃ³ thá»ƒ cháº¡y trÃªn subdomain riÃªng biá»‡t, cung cáº¥p cho nhÃ¢n viÃªn thu ngÃ¢n Ä‘Æ°á»ng dáº«n Ä‘Äƒng nháº­p trá»±c tiáº¿p mÃ  khÃ´ng cáº§n vÃ o trang chá»§ ERP.</p>
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-white p-3 rounded-2xl shadow-sm border border-primary-50 flex justify-between items-center">
 <div className="space-y-1">
 <span className="text-[10px] uppercase font-bold text-slate-500">Chi nhÃ¡nh Quáº­n 1</span>
 <p className="font-mono text-sm text-slate-900">sg1.v-erp.com</p>
 </div>
 <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">ACTIVE</span>
 </div>
 <div className="bg-white p-3 rounded-2xl shadow-sm border border-primary-50 flex justify-between items-center">
 <div className="space-y-1">
 <span className="text-[10px] uppercase font-bold text-slate-500">Chi nhÃ¡nh Cáº§u Giáº¥y</span>
 <p className="font-mono text-sm text-slate-900">hn1.v-erp.com</p>
 </div>
 <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">ACTIVE</span>
 </div>
 </div>
 </div>

 <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">Danh sÃ¡ch Cá»­a hÃ ng & NhÃ¢n sá»±</h4>
 
 <div className="space-y-4">
 {[
 { id: 'STORE_001', name: 'Chi nhÃ¡nh Quáº­n 1 - SÃ i GÃ²n', address: '123 LÃª Lá»£i, Q.1, TP.HCM', staff: 5, manager: 'Nguyá»…n VÄƒn A' },
 { id: 'STORE_002', name: 'Chi nhÃ¡nh Cáº§u Giáº¥y - HÃ  Ná»™i', address: '45 XuÃ¢n Thá»§y, Cáº§u Giáº¥y, HN', staff: 8, manager: 'Tráº§n Thá»‹ B' },
 ].map(store => (
 <div key={store.id} className="border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:border-blue-400 transition-colors bg-slate-50">
 <div>
 <h5 className="font-bold text-slate-900 text-lg flex items-center gap-2">{store.name}</h5>
 <p className="text-sm text-slate-600 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {store.address}</p>
 <div className="flex gap-4 mt-3">
 <span className="text-xs bg-slate-200/50 text-slate-700 px-2 py-1 rounded-md font-medium">Quáº£n lÃ½: <span className="font-bold">{store.manager}</span></span>
 <span className="text-xs bg-slate-100 text-blue-600 px-2 py-1 rounded-md font-medium">{store.staff} nhÃ¢n viÃªn</span>
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
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <MessageSquare className="w-5 h-5 text-blue-600" /> TÃ­ch há»£p SMS OTP & Zalo ZNS
 </h3>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Zalo ZNS Config */}
 <div className="border border-slate-200 rounded-2xl p-5 hover:border-blue-400 transition-colors">
 <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-white"><MessageSquare className="w-5 h-5" /></div>
 <div>
 <h4 className="font-bold text-slate-900">Zalo ZNS (Zalo Notification Service)</h4>
 <p className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold uppercase w-fit mt-1 border border-emerald-100">Äang hoáº¡t Ä‘á»™ng</p>
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
 <button className="px-3 bg-slate-100 border border-slate-200 rounded-2xl hover:bg-slate-200 text-sm font-bold text-slate-700">Äá»“ng bá»™</button>
 </div>
 <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Token sáº½ háº¿t háº¡n vÃ o 20:00 25/04/2026. Báº­t auto-refresh Ä‘á»ƒ tá»± lÃ m má»›i.</p>
 </div>
 </div>
 <button className="w-full mt-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
 Kiá»ƒm tra káº¿t ná»‘i ZNS
 </button>
 </div>

 {/* SMS OTP Config */}
 <div className="border border-slate-200 rounded-2xl p-5 hover:border-emerald-400 transition-colors">
 <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white"><MessageSquare className="w-5 h-5" /></div>
 <div>
 <h4 className="font-bold text-slate-900">SMS OTP & Brandname</h4>
 <p className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-bold uppercase w-fit mt-1">ChÆ°a thiáº¿t láº­p</p>
 </div>
 </div>
 <div className="h-8 w-14 bg-slate-200 rounded-full p-1 cursor-pointer">
 <div className="w-6 h-6 bg-white rounded-full shadow-sm"></div>
 </div>
 </div>
 <div className="space-y-4 opacity-70">
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">NhÃ  cung cáº¥p (SMS Vendor)</label>
 <select className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
 <option>eSMS.vn</option>
 <option>VietGuys</option>
 <option>FPT SMS</option>
 <option>Viettel MKT</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Brandname Ä‘Äƒng kÃ½</label>
 <input type="text" placeholder="VÃ­ dá»¥: V-ECOM" className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">API Key</label>
 <input type="password" placeholder="Nháº­p API Key..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono" />
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Secret Key</label>
 <input type="password" placeholder="Nháº­p Secret..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono" />
 </div>
 </div>
 </div>
 <button className="w-full mt-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
 LÆ°u thiáº¿t láº­p SMS
 </button>
 </div>
 </div>
 
 <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 mt-6">
 <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Zap className="w-4 h-4" /> Ká»‹ch báº£n Gá»­i tin (Triggers)</h4>
 <p className="text-sm text-orange-800 mb-4">Cáº¥u hÃ¬nh cÃ¡c sá»± kiá»‡n há»‡ thá»‘ng tá»± Ä‘á»™ng gá»i API ZNS/SMS Ä‘á»ƒ thÃ´ng bÃ¡o chÄƒm sÃ³c khÃ¡ch hÃ ng.</p>
 <div className="space-y-3">
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer">
 <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-400 focus:ring-orange-600" />
 <span className="text-sm font-medium text-slate-800 flex-1">Nháº¯n mÃ£ OTP xÃ¡c thá»±c khi Ä‘Äƒng nháº­p/Ä‘á»•i máº­t kháº©u</span>
 <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">Æ¯u tiÃªn: SMS OTP</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer">
 <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-400 focus:ring-orange-600" />
 <span className="text-sm font-medium text-slate-800 flex-1">Gá»­i Zalo ZNS xÃ¡c nháº­n Äáº·t hÃ ng thÃ nh cÃ´ng</span>
 <span className="text-[10px] font-bold text-blue-600 bg-[#EAE7DF] px-2 py-1 rounded">Template: ZNS_ORDER_01</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer">
 <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-400 focus:ring-orange-600" />
 <span className="text-sm font-medium text-slate-800 flex-1">Gá»­i Zalo ZNS chÃºc má»«ng Sinh nháº­t KhÃ¡ch hÃ ng (Loyalty)</span>
 <button className="text-[10px] font-bold text-blue-600 hover:text-orange-800 underline">Cáº¥u hÃ¬nh Máº«u tin</button>
 </label>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'popup' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-100 pb-3">
 <Send className="w-4 h-4 text-blue-600" /> Trung tÃ¢m Gá»­i thÃ´ng bÃ¡o (Push Notification)
 </h3>

 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">TiÃªu Ä‘á» thÃ´ng bÃ¡o</label>
 <input 
 type="text" 
 placeholder="VD: ThÃ´ng bÃ¡o báº£o trÃ¬ há»‡ thá»‘ng" 
 value={notiTitle}
 onChange={(e) => setNotiTitle(e.target.value)}
 className="w-full p-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Ná»™i dung thÃ´ng bÃ¡o (há»— trá»£ vÄƒn báº£n)</label>
 <textarea 
 rows={4} 
 placeholder="Chi tiáº¿t thÃ´ng bÃ¡o..." 
 value={notiMessage}
 onChange={(e) => setNotiMessage(e.target.value)}
 className="w-full p-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-y"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Äá»‘i tÆ°á»£ng nháº­n thÃ´ng bÃ¡o</label>
 <select className="w-full p-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white cursor-pointer mb-2">
 <option value="all">Táº¥t cáº£ nhÃ¢n viÃªn (Há»‡ thá»‘ng ERP)</option>
 <option value="seller">Táº¥t cáº£ NhÃ  bÃ¡n hÃ ng (Seller Center)</option>
 <option value="customer">Táº¥t cáº£ KhÃ¡ch hÃ ng (Storefront App)</option>
 <option value="dept_operations">PhÃ²ng Váº­n hÃ nh</option>
 <option value="dept_cskh">PhÃ²ng ChÄƒm sÃ³c KhÃ¡ch hÃ ng</option>
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
 setNotiStatus('ÄÃ£ gá»­i thÃ´ng bÃ¡o thÃ nh cÃ´ng!');
 setNotiTitle('');
 setNotiMessage('');
 setTimeout(() => setNotiStatus(''), 3000);
 }}
 className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2"
 >
 <Send className="w-4 h-4" /> Báº¯n thÃ´ng bÃ¡o ngay
 </button>
 </div>
 </div>
 </div>

 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-6">
 <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-100 pb-3">
 <AppWindow className="w-4 h-4 text-blue-600" /> Quáº£n lÃ½ Popup Website
 </h3>
 
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Tráº¡ng thÃ¡i Popup hiá»‡n váº­t / Quáº£ng cÃ¡o</label>
 <div className="flex items-center gap-2">
 <span className={cn("text-[10px] font-bold px-2 py-1 rounded", isPopupActive ? "text-emerald-700 bg-emerald-100" : "text-slate-500 bg-slate-100")}>{isPopupActive ? 'Äang má»Ÿ (Banner tá»± chÃ¨n)' : 'KhÃ´ng tá»± Ä‘á»™ng hiá»ƒn thá»‹'}</span>
 <div 
 onClick={() => setIsPopupActive(!isPopupActive)}
 className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors", isPopupActive ? "bg-emerald-500" : "bg-slate-200")}
 >
 <div className={cn("absolute top-1 w-3 h-3 bg-white rounded-full transition-all duration-300", isPopupActive ? "left-[22px]" : "left-1")} />
 </div>
 </div>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5">TiÃªu Ä‘á» Popup</label>
 <input 
 type="text" 
 placeholder="VD: Khuyáº¿n MÃ£i HÃ¨ 2024" 
 value={popupTitle}
 onChange={(e) => setPopupTitle(e.target.value)}
 className="w-full p-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5">Ná»™i dung / MÃ´ táº£</label>
 <textarea 
 placeholder="Nháº­p ná»™i dung hiá»ƒn thá»‹ trong popup..." 
 value={popupDesc}
 rows={2}
 onChange={(e) => setPopupDesc(e.target.value)}
 className="w-full p-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-y" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5">HÃ¬nh áº£nh (URL hoáº·c upload)</label>
 <input 
 type="text" 
 placeholder="https://example.com/banner.jpg" 
 value={popupImage}
 onChange={(e) => setPopupImage(e.target.value)}
 className="w-full p-2 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5">NÃºt Call-To-Action (NÃºt Ä‘iá»u hÆ°á»›ng)</label>
 <div className="flex gap-2">
 <input 
 type="text" 
 placeholder="TÃªn nÃºt (VD: Xem ngay)" 
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
 <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest absolute top-2 right-2">Xem trÆ°á»›c</div>
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
 </div>
 
 <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
 <button 
 onClick={() => alert('ÄÃ£ lÆ°u cáº¥u hÃ¬nh Popup!')}
 className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all shadow-sm active:scale-95"
 >
 LÆ°u thiáº¿t láº­p Popup
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab === 'inventory' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-5 rounded-2xl border border-slate-300 shadow-sm space-y-4">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <Package className="w-5 h-5 text-blue-600" /> PhÃ¢n loáº¡i & Cáº¥u hÃ¬nh HÃ ng hÃ³a
 </h3>
 <p className="text-sm text-slate-600 mb-4">Quáº£n lÃ½ cÃ¡c loáº¡i máº·t hÃ ng, Ä‘á»‹nh má»©c dá»± trá»¯, Ä‘Æ¡n vá»‹ tÃ­nh, vÃ  cÃ¡c thuá»™c tÃ­nh lÆ°u kho (SKU/Barcode).</p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
 <div className="flex justify-between items-center mb-4">
 <h4 className="font-bold text-slate-900">Danh má»¥c NhÃ³m HÃ ng hÃ³a</h4>
 <button className="text-xs text-blue-600 font-bold hover:underline">+ ThÃªm nhÃ³m</button>
 </div>
 <div className="space-y-2">
 {['NguyÃªn váº­t liá»‡u (Raw Materials)', 'ThÃ nh pháº©m (Finished Goods)', 'BÃ¡n thÃ nh pháº©m (WIP)', 'HÃ ng hÃ³a thÆ°Æ¡ng máº¡i (Trading Goods)'].map((type, i) => (
 <div key={i} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-2xl">
 <span className="text-sm font-medium">{type}</span>
 <button className="text-slate-500 hover:text-slate-700"><Edit2 className="w-4 h-4" /></button>
 </div>
 ))}
 </div>
 </div>

 <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
 <h4 className="font-bold text-slate-900 mb-4">PhÆ°Æ¡ng phÃ¡p Quáº£n lÃ½ Kho</h4>
 <div className="space-y-3">
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">
 <input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" defaultChecked />
 <span className="text-sm font-medium">BÃ¬nh quÃ¢n gia quyá»n (Weighted Average)</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100/50">
 <input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" />
 <span className="text-sm font-medium">Nháº­p trÆ°á»›c xuáº¥t trÆ°á»›c (FIFO)</span>
 </label>
 </div>
 </div>
 </div>
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
 <h3 className="font-bold text-slate-900">{editingJobTitle ? 'Chá»‰nh sá»­a Chá»©c danh' : 'ThÃªm Chá»©c danh má»›i'}</h3>
 <button 
 onClick={() => { setShowAddJobTitleModal(false); setEditingJobTitle(null); }}
 className="text-slate-500 hover:text-slate-700 font-bold text-lg leading-none"
 >
 &times;
 </button>
 </div>
 <div className="p-4 overflow-y-auto flex-1 space-y-4">
 <div>
 <label className="block text-sm font-bold text-slate-800 mb-1">TÃªn chá»©c danh <span className="text-red-500">*</span></label>
 <input 
 type="text" 
 value={newJobTitle.name || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, name: e.target.value})}
 className="w-full px-3 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm"
 placeholder="VD: TrÆ°á»Ÿng phÃ²ng Marketing"
 />
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-800 mb-1">PhÃ²ng ban <span className="text-red-500">*</span></label>
 <select 
 value={newJobTitle.department || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, department: e.target.value})}
 className="w-full px-3 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm"
 >
 <option value="">Chá»n phÃ²ng ban</option>
 {MOCK_DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-800 mb-1">Cáº¥p báº­c</label>
 <select 
 value={newJobTitle.rank || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, rank: e.target.value})}
 className="w-full px-3 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm"
 >
 <option value="">Chá»n cáº¥p báº­c</option>
 {MOCK_JOB_RANKS.map(r => <option key={r.id} value={r.id}>{r.name} (Level {r.level})</option>)}
 </select>
 </div>
 <div>
 <label className="block text-sm font-bold text-slate-800 mb-1">MÃ´ táº£ cÃ´ng viá»‡c</label>
 <textarea 
 value={newJobTitle.description || ''} 
 onChange={e => setNewJobTitle({...newJobTitle, description: e.target.value})}
 className="w-full px-3 py-2 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-600/20 text-sm min-h-[100px]"
 placeholder="MÃ´ táº£ ngáº¯n gá»n chá»©c nÄƒng, nhiá»‡m vá»¥..."
 />
 </div>
 </div>
 <div className="p-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
 <button 
 onClick={() => { setShowAddJobTitleModal(false); setEditingJobTitle(null); }}
 className="px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100"
 >
 Há»§y
 </button>
 <button 
 onClick={handleSaveJobTitle}
 disabled={!newJobTitle.name || !newJobTitle.department}
 className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 disabled:opacity-50"
 >
 LÆ°u Chá»©c danh
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
 <h3 className="text-lg font-bold text-slate-900">{editingFee ? 'Chá»‰nh sá»­a loáº¡i phÃ­' : 'ThÃªm loáº¡i phÃ­ má»›i'}</h3>
 <p className="text-xs text-slate-600">Thiáº¿t láº­p tham sá»‘ vÃ  pháº¡m vi Ã¡p dá»¥ng phÃ­</p>
 </div>
 </div>
 <button onClick={() => setShowFeeModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
 <X className="w-5 h-5 text-slate-500" />
 </button>
 </div>

 <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
 {/* Fee Name */}
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">TÃªn loáº¡i phÃ­</label>
 <input 
 type="text" 
 value={newFee.name || ''}
 onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
 placeholder="VD: PhÃ­ váº­n hÃ nh kho, PhÃ­ thanh toÃ¡n..."
 className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:border-slate-900 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
 />
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Loáº¡i phÃ­</label>
 <div className="flex bg-slate-100 p-1 rounded-xl">
 <button 
 onClick={() => setNewFee({ ...newFee, type: 'percentage' })}
 className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", newFee.type === 'percentage' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 Pháº§n trÄƒm (%)
 </button>
 <button 
 onClick={() => setNewFee({ ...newFee, type: 'fixed' })}
 className={cn("flex-1 py-2 text-xs font-bold rounded-lg transition-all", newFee.type === 'fixed' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
 >
 Cá»‘ Ä‘á»‹nh (Ä‘)
 </button>
 </div>
 </div>
 <div className="space-y-2">
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">GiÃ¡ trá»‹</label>
 <div className="relative">
 <input 
 type="number" 
 value={newFee.value || ''}
 onChange={(e) => setNewFee({ ...newFee, value: parseFloat(e.target.value) })}
 className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold focus:border-slate-900 outline-none"
 />
 <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">
 {newFee.type === 'percentage' ? '%' : 'Ä‘'}
 </span>
 </div>
 </div>
 </div>

 {/* Targeting: Seller Type */}
 <div className="space-y-3">
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ãp dá»¥ng cho Loáº¡i NhÃ  BÃ¡n</label>
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
 {type === 'mall' ? 'Shop Mall' : 'Seller thÆ°á»ng'}
 </span>
 </div>
 );
 })}
 </div>
 </div>

 {/* Targeting: Categories */}
 <div className="space-y-3">
 <div className="flex justify-between items-center">
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">NgÃ nh hÃ ng Ã¡p dá»¥ng</label>
 <button 
 onClick={() => setNewFee({ ...newFee, applyTo: { ...newFee.applyTo!, categories: ['all'] } })}
 className="text-[10px] font-bold text-blue-600 hover:underline"
 >
 Táº¥t cáº£ ngÃ nh
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
 <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">MÃ´ táº£ (Ghi chÃº)</label>
 <textarea 
 rows={2}
 value={newFee.description || ''}
 onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
 placeholder="Ghi chÃº vá» Ã½ nghÄ©a loáº¡i phÃ­ nÃ y..."
 className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm focus:border-slate-900 outline-none resize-none"
 />
 </div>
 </div>

 <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-3">
 <button 
 onClick={() => setShowFeeModal(false)}
 className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
 >
 Há»§y bá»
 </button>
 <button 
 onClick={() => {
 if (editingFee) {
 setSystemFees(systemFees.map(f => f.id === editingFee.id ? { ...newFee as SystemFee, id: f.id } : f));
 } else {
 setSystemFees([...systemFees, { ...newFee as SystemFee, id: `sys-${Date.now()}`, isActive: true }]);
 }
 setShowFeeModal(false);
 addNotification('ÄÃ£ cáº­p nháº­t cáº¥u hÃ¬nh', `Loáº¡i phÃ­ ${newFee.name} Ä‘Ã£ Ä‘Æ°á»£c lÆ°u thÃ nh cÃ´ng.`);
 }}
 className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-sm shadow-slate-900/5"
 >
 {editingFee ? 'Cáº­p nháº­t' : 'XÃ¡c nháº­n ThÃªm'}
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


