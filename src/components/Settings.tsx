import { safeLocalStorage } from '../lib/storage';
import { supabase } from '../lib/supabase';
import { Wallet , Save } from 'lucide-react';
import { useAuditLog } from '../hooks/useAuditLog';
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
 Link2,
 FileText,
 Clock,
 Upload,
 Download,
 Smartphone,
 Tablet,
 Activity,
 XCircle,
 ExternalLink,
 ShieldAlert,
 Eye,
 EyeOff,
 Play,
 Copy,
 Terminal
} from 'lucide-react';
import { getMisaConfig, saveMisaConfig, type MisaConfig } from '../services/misaService';
import { getZnsConfig, saveZnsConfig, type ZnsConfig } from '../services/znsService';
import { formatCurrency, cn } from '../lib/utils';
import { PermissionRole, WebhookConfig, AiFeeSuggestion } from '../types/erp';
import { useNotifications } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { db, doc, getDoc, setDoc, collection, query, where, orderBy, limit, onSnapshot } from '../lib/firebase';
import { PageEditorModal } from './PageEditorModal';

interface ShopifyHaravanConfig {
  shopUrl: string;
  accessToken: string;
  syncProducts: boolean;
  syncOrders: boolean;
  autoInventorySync: boolean;
  isActive: boolean;
}

interface MarketplaceConfig {
  platform: 'shopee' | 'tiktok';
  shopId: string;
  appKey: string;
  appSecret: string;
  accessToken: string;
  refreshToken: string;
  autoSyncStock: boolean;
  autoSyncOrders: boolean;
  isActive: boolean;
}

interface CustomWebhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secretToken: string;
  isActive: boolean;
}

interface ApiSyncLog {
  id: string;
  timestamp: string;
  platform: string;
  event: string;
  status: 'success' | 'failed';
  details: string;
}

interface OpenApiKey {
  id: string;
  name: string;
  token: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string;
  status: 'active' | 'revoked';
}

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
 title: 'Cấu hình chung & Thương hiệu',
 items: [
  { id: 'general', label: 'Cấu hình chung', icon: Settings, desc: 'Cài đặt cơ bản hệ thống, Payout tự động', color: 'blue' },
 { id: 'appearance', label: 'Giao diện & Theme', icon: Sparkles, desc: 'Tùy chỉnh màu sắc, bo góc, Lễ tết', color: 'rose' },
 { id: 'website', label: 'Website & Menu', icon: Globe, desc: 'Quản lý biểu mẫu, tên miền và menu', color: 'indigo' },
 { id: 'storefront', label: 'Trang bán hàng', icon: AppWindow, desc: 'Footer, thông tin công ty, MXH & pháp lý', color: 'emerald' },
 { id: 'popup', label: 'Popup & Thông báo', icon: Bell, desc: 'Thiết lập Push notification trung tâm', color: 'blue' },
 ]
 },
 {
 title: 'Quản lý Kinh doanh & Vận hành',
 items: [
 { id: 'fees', label: 'Phí sàn & Ngành hàng', icon: BadgeDollarSign, desc: 'Setup tỷ lệ hoa hồng theo từng ngành', color: 'emerald' },
 { id: 'inventory', label: 'Hàng hóa & Kho', icon: Package, desc: 'Phân loại mặt hàng và lưu kho', color: 'orange' },
 { id: 'wallet_crm', label: 'Quản lý Ví CSKH', icon: Wallet, desc: 'Cấu hình các loại Ví Khuyến Mại & Tích điểm KH', color: 'primary' },
 ]
 },
 {
 title: 'Cơ cấu Tổ chức & Hạ tầng',
 items: [
 { id: 'org', label: 'Cơ cấu Tổ chức', icon: Building2, desc: 'Cây phòng ban và chức danh nhân sự', color: 'emerald' },
 { id: 'stores', label: 'Chuỗi cửa hàng', icon: Store, desc: 'Cấu hình chi nhánh và subdomain', color: 'indigo' },
 { id: 'address', label: 'Địa chỉ Hành chính', icon: MapPin, desc: 'Danh mục Tỉnh/Thành/Phường/Xã', color: 'slate' },
 ]
 },
 {
 title: 'Bảo mật & Tích hợp Hệ thống',
 items: [
 { id: 'rbac', label: 'Phân quyền (Roles)', icon: Lock, desc: 'Điều hướng truy cập và quản lý Matrix Roles', color: 'purple' },
 { id: 'api', label: 'OpenAPI & Webhooks', icon: Webhook, desc: 'Cấp API token và bắn sự kiện Server', color: 'rose' },
 { id: 'comms', label: 'Tích hợp Kênh', icon: MessageSquare, desc: 'Cấu hình API gửi tin nhắn Zalo/SMS', color: 'cyan' },
	{ id: 'saas_subscription', label: 'Quản lý SaaS', icon: ShieldCheck, desc: 'Giấy phép thuê bao SaaS, hạn mức tài nguyên hệ thống, dữ liệu cô lập và hóa đơn', color: 'emerald' },
		{ id: 'ipos_licenses', label: 'Bản quyền iPOS', icon: Tablet, desc: 'Quản lý bản quyền theo chi nhánh, thiết lập custom domain và token API đối soát', color: 'blue' },
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
 const { staffInfo } = useAuth();
 const [activeTab, setActiveTab] = useState<'overview' | 'general' | 'appearance' | 'wallet_crm' | 'rbac' | 'api' | 'address' | 'org' | 'comms' | 'website' | 'storefront' | 'stores' | 'fees' | 'popup' | 'inventory' | 'saas_subscription' | 'chart_of_accounts' | 'workflow_rules' | 'ipos_licenses'>('overview');

  const [addressConfig, setAddressConfig] = useState<{
    activeProvinces: number[];
    activeWards: number[];
  }>({ activeProvinces: [], activeWards: [] });
  const [loadingAddressConfig, setLoadingAddressConfig] = useState(false);
  const [savingAddressConfig, setSavingAddressConfig] = useState(false);
  const [addressSaveMessage, setAddressSaveMessage] = useState('');

  useEffect(() => {
    if (activeTab !== 'address') return;
    
    async function loadConfig() {
      setLoadingAddressConfig(true);
      try {
        const { data, error } = await supabase
          .from('tenant_settings')
          .select('data')
          .eq('id', 'config')
          .single();
        if (error) throw error;
        
        if (data?.data?.addressConfig) {
          setAddressConfig(data.data.addressConfig);
        } else {
          const res = await fetch('https://provinces.open-api.vn/api/v2/?depth=1');
          const provs = await res.json();
          setAddressConfig({
            activeProvinces: provs.map((p: any) => p.code),
            activeWards: []
          });
        }
      } catch (e) {
        console.error("Failed to load address config:", e);
      } finally {
        setLoadingAddressConfig(false);
      }
    }
    
    loadConfig();
  }, [activeTab]);

  const handleToggleProvince = React.useCallback(async (code: number, checked: boolean) => {
    setAddressConfig(prev => {
      let nextProvinces = [...prev.activeProvinces];
      if (checked) {
        if (!nextProvinces.includes(code)) nextProvinces.push(code);
      } else {
        nextProvinces = nextProvinces.filter(c => c !== code);
      }
      return {
        ...prev,
        activeProvinces: nextProvinces
      };
    });

    try {
      const res = await fetch(`https://provinces.open-api.vn/api/v2/p/${code}?depth=2`);
      const data = await res.json();
      const wardCodes = (data.wards ?? []).map((w: any) => w.code);
      
      setAddressConfig(prev => {
        let nextWards = [...prev.activeWards];
        if (checked) {
          wardCodes.forEach((wc: number) => {
            if (!nextWards.includes(wc)) nextWards.push(wc);
          });
        } else {
          nextWards = nextWards.filter((wc: number) => !wardCodes.includes(wc));
        }
        return {
          ...prev,
          activeWards: nextWards
        };
      });
    } catch (e) {
      console.error("Failed to toggle wards:", e);
    }
  }, []);

  const handleToggleWard = React.useCallback((code: number, checked: boolean) => {
    setAddressConfig(prev => {
      let nextWards = [...prev.activeWards];
      if (checked) {
        if (!nextWards.includes(code)) nextWards.push(code);
      } else {
        nextWards = nextWards.filter(c => c !== code);
      }
      return {
        ...prev,
        activeWards: nextWards
      };
    });
  }, []);

  const handleSelectAll = React.useCallback((allCodes: number[]) => {
    setAddressConfig({
      activeProvinces: allCodes,
      activeWards: []
    });
  }, []);

  const handleDeselectAll = React.useCallback(() => {
    setAddressConfig({
      activeProvinces: [],
      activeWards: []
    });
  }, []);

  const handleSaveAddressConfig = async () => {
    setSavingAddressConfig(true);
    setAddressSaveMessage('');
    try {
      const { data: current, error: getErr } = await supabase
        .from('tenant_settings')
        .select('data')
        .eq('id', 'config')
        .single();
      if (getErr) throw getErr;

      const updatedData = {
        ...current.data,
        addressConfig
      };

      const { error: updateErr } = await supabase
        .from('tenant_settings')
        .update({ data: updatedData })
        .eq('id', 'config');

      if (updateErr) throw updateErr;
      setAddressSaveMessage('Đã lưu cấu hình địa chỉ hành chính thành công!');
      setTimeout(() => setAddressSaveMessage(''), 4000);
    } catch (e: any) {
      console.error(e);
      setAddressSaveMessage('Lỗi khi lưu cấu hình: ' + (e.message || e));
    } finally {
      setSavingAddressConfig(false);
    }
  };
 const [adminAuditLogs, setAdminAuditLogs] = useState<any[]>([]);
 const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);
  const [apiKeys, setApiKeys] = useState<{
    gemini: string;
    sepayToken: string;
    sepayId: string;
    sepaySecret: string;
  }>({
    gemini: safeLocalStorage.getItem('api_gemini_api_key') || '',
    sepayToken: safeLocalStorage.getItem('api_sepay_api_token') || '',
    sepayId: safeLocalStorage.getItem('api_sepay_client_id') || '',
    sepaySecret: safeLocalStorage.getItem('api_sepay_client_secret') || '',
  });

  const saveApiKeys = () => {
    safeLocalStorage.setItem('api_gemini_api_key', apiKeys.gemini);
    safeLocalStorage.setItem('api_sepay_api_token', apiKeys.sepayToken);
    safeLocalStorage.setItem('api_sepay_client_id', apiKeys.sepayId);
    safeLocalStorage.setItem('api_sepay_client_secret', apiKeys.sepaySecret);
  };

  const [simCode, setSimCode] = useState('VCOMM_ORD_');
  const [simAmount, setSimAmount] = useState('500000');
  const [simulating, setSimulating] = useState(false);

  const handleSimulateWebhook = async () => {
    if (!simCode) return;
    setSimulating(true);
    try {
      const response = await fetch('/api/sepay/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Apikey mock_secret'
        },
        body: JSON.stringify({
          gateway: 'SimulatedBank',
          transactionDate: new Date().toISOString().replace('T', ' ').substring(0, 19),
          accountNumber: '1020088998',
          transferType: 'in',
          transferAmount: Number(simAmount),
          accumulated: 50000000,
          code: 'SIM_FT_' + Date.now(),
          content: simCode,
          referenceCode: 'SIM_FT_' + Date.now(),
          description: simCode
        })
      });
      const data = await response.json();
      if (response.ok) {
        addNotification('Giả lập Webhook', 'Giao dịch giả lập thành công: ' + simCode);
      } else {
        addNotification('Giả lập Webhook', 'Thất bại: ' + (data.error || data.message || response.statusText));
      }
    } catch (err: any) {
      console.error(err);
      addNotification('Giả lập Webhook', 'Lỗi kết nối: ' + err.message);
    } finally {
      setSimulating(false);
    }
  };

  // --- API INTEGRATIONS CONFIGURATION STATES & HANDLERS ---
  const [misaConfig, setMisaConfig] = useState<MisaConfig>(() => getMisaConfig());
  const [znsConfig, setZnsConfig] = useState<ZnsConfig>(() => getZnsConfig());
  
  const [shopifyHaravanConfig, setShopifyHaravanConfig] = useState<ShopifyHaravanConfig>(() => {
    const data = safeLocalStorage.getItem('api_shopify_haravan_config');
    return data ? JSON.parse(data) : {
      shopUrl: 'nexhubshop.vn',
      accessToken: 'shpat_simulated_token_xyz789',
      syncProducts: true,
      syncOrders: true,
      autoInventorySync: true,
      isActive: true
    };
  });

  const [marketplaceConfig, setMarketplaceConfig] = useState<MarketplaceConfig>(() => {
    const data = safeLocalStorage.getItem('api_marketplace_config');
    return data ? JSON.parse(data) : {
      platform: 'shopee',
      shopId: 'shopee_shop_9999',
      appKey: 'app_key_shopee_123',
      appSecret: 'app_secret_shopee_456',
      accessToken: 'shopee_access_token_def',
      refreshToken: 'shopee_refresh_token_ghi',
      autoSyncStock: true,
      autoSyncOrders: true,
      isActive: false
    };
  });

  const [customWebhooks, setCustomWebhooks] = useState<CustomWebhook[]>(() => {
    const data = safeLocalStorage.getItem('api_custom_webhooks');
    return data ? JSON.parse(data) : [
      {
        id: 'wh-1',
        name: 'Đẩy Đơn hàng sang Kho ViettelPost',
        url: 'https://api.viettelpost.vn/v1/webhooks/orders',
        events: ['order.created', 'order.cancelled'],
        secretToken: 'whsec_vtp_987654321',
        isActive: true
      },
      {
        id: 'wh-2',
        name: 'Đồng bộ CRM Khách hàng thân thiết',
        url: 'https://webhook.crm-partner.com/vcomm-customer-sync',
        events: ['customer.created', 'customer.updated'],
        secretToken: 'whsec_crm_123456789',
        isActive: false
      }
    ];
  });

  const [syncLogs, setSyncLogs] = useState<ApiSyncLog[]>(() => {
    const data = safeLocalStorage.getItem('api_sync_logs');
    return data ? JSON.parse(data) : [
      {
        id: 'log-1',
        timestamp: '2026-06-11 10:15:00',
        platform: 'MISA Accounting',
        event: 'Đồng bộ hóa đơn bán hàng #DH-2026-001',
        status: 'success',
        details: 'Đã tạo chứng từ kế toán 1302/2026 trên MISA. Tài khoản Nợ: 1121, Tài khoản Có: 5111.'
      },
      {
        id: 'log-2',
        timestamp: '2026-06-11 10:02:15',
        platform: 'Shopify / Haravan',
        event: 'Tải sản phẩm mới từ NexHub',
        status: 'success',
        details: 'Đã tải thành công 12 sản phẩm mới vào ERP.'
      },
      {
        id: 'log-3',
        timestamp: '2026-06-11 09:45:30',
        platform: 'MISA Accounting',
        event: 'Đồng bộ hóa đơn bán hàng #DH-2026-002',
        status: 'failed',
        details: 'Lỗi: Tài khoản kế toán 51111 không tồn tại trong hệ thống tài khoản MISA (Circular 99/2025/TT-BTC).'
      },
      {
        id: 'log-4',
        timestamp: '2026-06-11 09:30:10',
        platform: 'Zalo ZNS',
        event: 'Gửi tin xác nhận đơn hàng #DH-2026-002',
        status: 'success',
        details: 'Tin nhắn ZNS gửi thành công tới số 098****321. Trạng thái: DELIVERED.'
      },
      {
        id: 'log-5',
        timestamp: '2026-06-11 08:12:05',
        platform: 'SePay Gateway',
        event: 'Webhook biến động số dư ngân hàng',
        status: 'failed',
        details: 'Lỗi: Chữ ký MD5 không hợp lệ (Signature mismatch). Yêu cầu đối soát bị hủy bỏ.'
      }
    ];
  });

  const [openApiKeys, setOpenApiKeys] = useState<OpenApiKey[]>(() => {
    const data = safeLocalStorage.getItem('api_openapi_keys');
    return data ? JSON.parse(data) : [
      {
        id: 'key-1',
        name: 'Tích hợp phần mềm giao vận GHTK',
        token: 'vcomm_live_key_ghtk_8a2f9b8c',
        scopes: ['orders.read', 'orders.write', 'inventory.read'],
        createdAt: '2026-05-20 14:30:00',
        lastUsedAt: '2026-06-11 10:00:00',
        status: 'active'
      },
      {
        id: 'key-2',
        name: 'Báo cáo PowerBI nội bộ',
        token: 'vcomm_live_key_pbi_3d7e5f1b',
        scopes: ['analytics.read', 'customers.read'],
        createdAt: '2026-06-01 09:00:00',
        lastUsedAt: '2026-06-11 09:15:00',
        status: 'active'
      }
    ];
  });

  const [activeConfigModal, setActiveConfigModal] = useState<'misa' | 'sepay' | 'zns' | 'shopify' | 'marketplace' | 'webhook' | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<CustomWebhook | null>(null);
  const [newOpenApiKey, setNewOpenApiKey] = useState<Partial<OpenApiKey>>({ name: '', scopes: [] });
  const [createdKeyDetails, setCreatedKeyDetails] = useState<string | null>(null);
  const [testingConnection, setTestingConnection] = useState<Record<string, boolean>>({});
  const [syncLogsSearch, setSyncLogsSearch] = useState('');

  const saveMisaConfigLocal = (config: MisaConfig) => {
    setMisaConfig(config);
    saveMisaConfig(config);
    addNotification('Cài đặt MISA', 'Đã lưu cấu hình MISA thành công.');
  };

  const saveZnsConfigLocal = (config: ZnsConfig) => {
    setZnsConfig(config);
    saveZnsConfig(config);
    addNotification('Cài đặt Zalo ZNS', 'Đã lưu cấu hình ZNS thành công.');
  };

  const saveShopifyHaravanConfig = (config: ShopifyHaravanConfig) => {
    setShopifyHaravanConfig(config);
    safeLocalStorage.setItem('api_shopify_haravan_config', JSON.stringify(config));
    addNotification('Cấu hình Shopify/Haravan', 'Đã lưu cấu hình tích hợp bán lẻ thành công.');
  };

  const saveMarketplaceConfig = (config: MarketplaceConfig) => {
    setMarketplaceConfig(config);
    safeLocalStorage.setItem('api_marketplace_config', JSON.stringify(config));
    addNotification('Cấu hình Sàn TMĐT', 'Đã lưu cấu hình đồng bộ gian hàng thành công.');
  };

  const saveCustomWebhooksLocal = (webhooks: CustomWebhook[]) => {
    setCustomWebhooks(webhooks);
    safeLocalStorage.setItem('api_custom_webhooks', JSON.stringify(webhooks));
  };

  const handleTestConnection = async (platform: string) => {
    setTestingConnection(prev => ({ ...prev, [platform]: true }));
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTestingConnection(prev => ({ ...prev, [platform]: false }));
    addNotification('Kiểm tra kết nối', `Kết nối tới ${platform} thành công và hoạt động tốt!`);
  };

  const handleRetrySync = async (logId: string) => {
    setSyncLogs(prev => prev.map(log => {
      if (log.id === logId) {
        return { ...log, status: 'success', details: `Đã thử lại thành công. ${log.details.replace('Lỗi:', 'Đã sửa lỗi và đồng bộ lại:')}` };
      }
      return log;
    }));
    addNotification('Đồng bộ lại', 'Yêu cầu đồng bộ lại đã được xử lý thành công.');
  };

  const handleCreateApiKey = () => {
    if (!newOpenApiKey.name) {
      addNotification('Lỗi', 'Vui lòng nhập tên ứng dụng kết nối.');
      return;
    }
    const generatedToken = 'vcomm_live_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const newKey: OpenApiKey = {
      id: 'key-' + Date.now(),
      name: newOpenApiKey.name,
      token: generatedToken.substring(0, 15) + '********',
      scopes: newOpenApiKey.scopes || [],
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      lastUsedAt: 'Never',
      status: 'active'
    };
    const updatedKeys = [...openApiKeys, newKey];
    setOpenApiKeys(updatedKeys);
    safeLocalStorage.setItem('api_openapi_keys', JSON.stringify(updatedKeys));
    setCreatedKeyDetails(generatedToken);
    setNewOpenApiKey({ name: '', scopes: [] });
    addNotification('OpenAPI', 'Đã tạo Client API Key mới thành công.');
  };

  const handleRevokeApiKey = (keyId: string) => {
    const updatedKeys = openApiKeys.map(k => k.id === keyId ? { ...k, status: 'revoked' as const } : k);
    setOpenApiKeys(updatedKeys);
    safeLocalStorage.setItem('api_openapi_keys', JSON.stringify(updatedKeys));
    addNotification('OpenAPI', 'Đã thu hồi Client API Key thành công.');
  };



 useEffect(() => {
   if (activeTab === 'saas_subscription') {
     setLoadingAuditLogs(true);
     const tenantId = staffInfo?.tenantId || 'tenant-vcomm-prod-01';
     
     const q = query(
       collection(db, 'tenants', tenantId, 'audit_logs'),
       orderBy('timestamp', 'desc'),
       limit(50)
     );

     const unsubscribe = onSnapshot(q, (snapshot) => {
       const logs = snapshot.docs.map(doc => ({
         id: doc.id,
         ...doc.data()
       }));
       setAdminAuditLogs(logs);
       setLoadingAuditLogs(false);
     }, (err) => {
       console.error("Error subscribing to admin audit logs:", err);
       setLoadingAuditLogs(false);
     });

     return () => unsubscribe();
   }
 }, [activeTab, staffInfo]);
 
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
  const [isSavingFee, setIsSavingFee] = useState(false);

  // 1. DNS Diagnostics State
  const [dnsDiagnostics, setDnsDiagnostics] = useState<Record<string, 'idle' | 'checking' | 'valid' | 'invalid'>>({});
  const handleCheckDns = (domain: string) => {
    if (!domain) return;
    setDnsDiagnostics(prev => ({ ...prev, [domain]: 'checking' }));
    setTimeout(() => {
      const isValid = domain !== 'erp.vcom.vn' && domain.includes('.');
      setDnsDiagnostics(prev => ({ ...prev, [domain]: isValid ? 'valid' : 'invalid' }));
    }, 1200);
  };

  // 2. AI Security Scan State
  const [isScanningAiLogs, setIsScanningAiLogs] = useState(false);
  const runAiSecurityScan = () => {
    setIsScanningAiLogs(true);
    setTimeout(() => {
      setIsScanningAiLogs(false);
      addNotification('AI Security', 'Đã quét xong logs hệ thống. Phát hiện 1 Critical Alert và 1 Warning Alert.');
    }, 1500);
  };

  // 3. Cloud Backup Settings State
  const [backupCloud, setBackupCloud] = useState<'gdrive' | 'dropbox' | 'aws_s3'>('gdrive');
  const [backupFrequency, setBackupFrequency] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [backupHour, setBackupHour] = useState<string>('02:00');
  const [isRunningBackup, setIsRunningBackup] = useState<boolean>(false);

  // 4. Storefront Bento Builder State
  interface StorefrontSection {
    id: string;
    title: string;
    description: string;
    isActive: boolean;
    order: number;
    color: string;
    mockContent: string;
  }
  const [storefrontSections, setStorefrontSections] = useState<StorefrontSection[]>([
    { id: 'hero_banner', title: 'Banner Khuyến Mãi (Hero)', description: 'Banner chính đầu trang hiển thị chiến dịch lớn', isActive: true, order: 0, color: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white', mockContent: '🎁 Siêu Tiệc Thương Hiệu - Giảm đến 50%' },
    { id: 'flash_sale', title: 'Săn Deal Flash Sale', description: 'Đếm ngược các sản phẩm giá sốc giới hạn giờ', isActive: true, order: 1, color: 'bg-rose-500 text-white animate-pulse', mockContent: '⚡ Flash Sale đang diễn ra: 01:59:59' },
    { id: 'bento_campaign', title: 'Bento Grid Chiến Dịch', description: 'Hiển thị danh mục hot dạng lưới Bento Premium', isActive: true, order: 2, color: 'bg-slate-100 border border-slate-200 text-slate-800', mockContent: '🍱 Bộ Sưu Tập Mùa Hè / Xu Hướng Công Nghệ' },
    { id: 'featured_products', title: 'Sản Phẩm Bán Chạy', description: 'Slider cuộn các sản phẩm được đánh giá cao', isActive: true, order: 3, color: 'bg-slate-50 border border-slate-200 text-slate-800', mockContent: '🔥 Top 10 sản phẩm thịnh hành nhất' },
    { id: 'footer_info', title: 'Thông tin chân trang (Footer)', description: 'Hiển thị liên kết pháp lý và thương hiệu', isActive: true, order: 4, color: 'bg-slate-900 text-slate-350', mockContent: '🏢 CÔNG TY CỔ PHẦN CÔNG NGHỆ VCOMM' },
  ]);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'mobile' | 'tablet'>('mobile');

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...storefrontSections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    const tempOrder = newSections[index].order;
    newSections[index].order = newSections[targetIndex].order;
    newSections[targetIndex].order = tempOrder;
    newSections.sort((a, b) => a.order - b.order);
    newSections.forEach((s, idx) => s.order = idx);
    setStorefrontSections(newSections);
  };

  const toggleSectionActive = (id: string) => {
    setStorefrontSections(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  // 5. Chart of Accounts (COA) State
  interface AccountItem {
    code: string;
    name: string;
    type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
    parentCode?: string;
    isLeaf: boolean;
    isActive: boolean;
  }
  const [coaList, setCoaList] = useState<AccountItem[]>([
    { code: '111', name: 'Tiền mặt', type: 'Asset', isLeaf: false, isActive: true },
    { code: '1111', name: 'Tiền Việt Nam (VNĐ)', type: 'Asset', parentCode: '111', isLeaf: true, isActive: true },
    { code: '1112', name: 'Ngoại tệ', type: 'Asset', parentCode: '111', isLeaf: true, isActive: true },
    { code: '112', name: 'Tiền gửi Ngân hàng', type: 'Asset', isLeaf: false, isActive: true },
    { code: '1121', name: 'Tiền Việt Nam gửi Ngân hàng', type: 'Asset', parentCode: '112', isLeaf: true, isActive: true },
    { code: '133', name: 'Thuế GTGT được khấu trừ', type: 'Asset', isLeaf: false, isActive: true },
    { code: '1331', name: 'Thuế GTGT được khấu trừ của hàng hóa, dịch vụ', type: 'Asset', parentCode: '133', isLeaf: true, isActive: true },
    { code: '333', name: 'Thuế và các khoản phải nộp Nhà nước', type: 'Liability', isLeaf: false, isActive: true },
    { code: '33311', name: 'Thuế GTGT đầu ra phải nộp', type: 'Liability', parentCode: '333', isLeaf: true, isActive: true },
    { code: '511', name: 'Doanh thu bán hàng và cung cấp dịch vụ', type: 'Revenue', isLeaf: false, isActive: true },
    { code: '5111', name: 'Doanh thu bán hàng hóa', type: 'Revenue', parentCode: '511', isLeaf: true, isActive: true },
  ]);
  const [newCoa, setNewCoa] = useState<{ code: string; name: string; type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense'; parentCode?: string }>({
    code: '',
    name: '',
    type: 'Asset',
    parentCode: '',
  });
  const [coaError, setCoaError] = useState<string | null>(null);
  const [taxMappings, setTaxMappings] = useState({
    inputTaxAccount: '1331',
    outputTaxAccount: '33311',
  });

  const handleCreateCoa = () => {
    setCoaError(null);
    if (!newCoa.code || !newCoa.name) {
      setCoaError('Vui lòng điền đầy đủ Mã và Tên tài khoản.');
      return;
    }
    if (newCoa.code.length < 4) {
      setCoaError('Mã tài khoản hạch toán chi tiết (tài khoản lá) phải có độ dài từ 4 chữ số trở lên.');
      return;
    }
    if (coaList.some(c => c.code === newCoa.code)) {
      setCoaError('Mã tài khoản này đã tồn tại trong danh mục.');
      return;
    }
    const newItem: AccountItem = {
      code: newCoa.code,
      name: newCoa.name,
      type: newCoa.type,
      parentCode: newCoa.parentCode || undefined,
      isLeaf: true,
      isActive: true,
    };
    setCoaList(prev => [...prev, newItem]);
    addNotification('Kế toán COA', `Đã thêm thành công tài khoản hạch toán ${newCoa.code}`);
    setNewCoa({ code: '', name: '', type: 'Asset', parentCode: '' });
  };

  // 6. Workflow Automation State
  interface WorkflowRule {
    id: string;
    name: string;
    trigger: string;
    condition: string;
    action: string;
    isActive: boolean;
  }
  const [workflowRules, setWorkflowRules] = useState<WorkflowRule[]>([
    { id: 'wf-1', name: 'Gửi Zalo ZNS khi có Đơn hàng VIP mới', trigger: 'order_created', condition: 'total_amount > 20000000', action: 'send_zalo_zns', isActive: true },
    { id: 'wf-2', name: 'Thông báo Push cho Admin khi hàng tồn kho sắp hết', trigger: 'stock_low', condition: 'inventory_qty < 10', action: 'send_push_admin', isActive: true },
    { id: 'wf-3', name: 'Chặn hạch toán tự động khi thiếu mã số thuế đối tượng lẻ', trigger: 'invoice_draft', condition: 'tax_code_missing = true', action: 'block_bookkeeping', isActive: false },
  ]);
  const [showAddWorkflowModal, setShowAddWorkflowModal] = useState(false);
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    trigger: 'order_created',
    condition: 'total_amount > 20000000',
    action: 'send_zalo_zns',
  });

  const handleCreateWorkflow = () => {
    if (!newWorkflow.name) return;
    const rule: WorkflowRule = {
      id: `wf-${Date.now()}`,
      name: newWorkflow.name,
      trigger: newWorkflow.trigger,
      condition: newWorkflow.condition,
      action: newWorkflow.action,
      isActive: true,
    };
    setWorkflowRules(prev => [...prev, rule]);
    addNotification('Tạo Workflow', `Đã thêm và kích hoạt quy trình tự động: ${newWorkflow.name}`);
    setShowAddWorkflowModal(false);
    setNewWorkflow({
      name: '',
      trigger: 'order_created',
      condition: 'total_amount > 20000000',
      action: 'send_zalo_zns',
    });
  };

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
 const [systemFavicon, setSystemFavicon] = useState<string>(`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='8' height='4' x='8' y='2' rx='1' ry='1'/><path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/><path d='M9 12h6'/><path d='M9 16h6'/></svg>`);
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
   const savedLogo = safeLocalStorage.getItem('system-logo');
   const savedFavicon = safeLocalStorage.getItem('system-favicon');
   if (savedLogo) setSystemLogo(savedLogo);
   if (savedFavicon) { setSystemFavicon(savedFavicon); } else { setSystemFavicon(`data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='8' height='4' x='8' y='2' rx='1' ry='1'/><path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/><path d='M9 12h6'/><path d='M9 16h6'/></svg>`); }
 }, []);

 const handleSaveWebsiteConfig = () => {
  setIsSavingWebsite(true);
  try {
    safeLocalStorage.setItem('system-logo', systemLogo);
    safeLocalStorage.setItem('system-favicon', systemFavicon);
    
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

  useEffect(() => {
    if (activeTab !== 'fees') return;
    
    async function loadFeeConfig() {
      try {
        const { data, error } = await supabase
          .from('tenant_settings')
          .select('data')
          .eq('id', 'config')
          .single();
        if (error) throw error;
        
        if (data?.data?.feeConfig) {
          const fc = data.data.feeConfig;
          if (fc.systemFees) {
            setSystemFees(fc.systemFees);
          }
          if (fc.categoryFees) {
            setCategoryFees(fc.categoryFees);
          }
        }
      } catch (err) {
        console.error("Error loading fee config from Supabase:", err);
      }
    }
    
    loadFeeConfig();
  }, [activeTab]);

  const handleSaveFeeConfig = async () => {
    setIsSavingFee(true);
    try {
      const { data: current, error: getErr } = await supabase
        .from('tenant_settings')
        .select('data')
        .eq('id', 'config')
        .single();
      if (getErr) throw getErr;

      const currentData = current.data || {};
      const updatedData = {
        ...currentData,
        feeConfig: {
          ...currentData.feeConfig,
          systemFees,
          categoryFees,
          commissionRate: 3.5
        }
      };

      const { error: updateErr } = await supabase
        .from('tenant_settings')
        .update({ data: updatedData })
        .eq('id', 'config');

      if (updateErr) throw updateErr;
      addNotification('Đã lưu cấu hình', 'Cấu hình Phí sàn đã được cập nhật lên hệ thống thành công.');
      alert('Đã lưu cấu hình Phí sàn thành công!');
    } catch (err) {
      console.error("Error saving fee config:", err);
      addNotification('Lỗi lưu cấu hình', 'Không thể lưu cấu hình — vui lòng thử lại.');
    } finally {
      setIsSavingFee(false);
    }
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
 <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div className="flex items-center gap-4">
    <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center shrink-0">
      <Settings className="w-6 h-6 text-white" />
    </div>
    <div>
      <h1 className="text-lg font-bold text-slate-900">Cấu hình & Tích hợp Hệ thống</h1>
      <p className="text-sm text-slate-500 mt-0.5">Phân quyền roles, cấu hình phí sàn và quản lý OpenAPI/Webhook.</p>
    </div>
  </div>
  <div className="flex items-center gap-2 shrink-0">
    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors">
      <RefreshCw className="w-4 h-4 text-emerald-500" /> Lịch sử
    </button>
    <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg transition-colors">
      <Sparkles className="w-4 h-4 text-purple-500" /> AI Audit
    </button>
    <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm">
      <Save className="w-4 h-4" />{isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
    </button>
  </div>
 </div>

 <div className="flex flex-col gap-6">
 {/* Main Grid or Content Area */}
 {activeTab !== 'overview' && (
 <div className="flex items-center gap-3">
   <button onClick={() => setActiveTab('overview')} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-sm font-medium rounded-lg transition-colors shadow-sm">
     <ChevronLeft className="w-4 h-4" /> Tổng quan
   </button>
   <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
    {[
    { id: 'general', label: 'Cấu hình chung', icon: Settings },
    { id: 'appearance', label: 'Giao diện & Theme', icon: Sparkles },
    { id: 'storefront', label: 'Trang bán hàng', icon: AppWindow },
    { id: 'wallet_crm', label: 'Quản lý Ví CSKH', icon: Wallet },
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
    { id: 'saas_subscription', label: 'Cấu hình SaaS & Đăng ký', icon: ShieldCheck },
		{ id: 'ipos_licenses', label: 'Quản lý Bản quyền iPOS', icon: Tablet },
    { id: 'chart_of_accounts', label: 'Hệ thống tài khoản COA', icon: FileText },
    { id: 'workflow_rules', label: 'Quy trình No-code', icon: Zap },
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
     <div key={item.label} className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3 hover:shadow-sm .5 transition-all shadow-sm">
       <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
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
       className="group bg-white border border-slate-200 rounded-lg p-5 flex flex-col items-center text-center gap-3 hover:shadow-sm hover:border-slate-300 .5 transition-all duration-200 min-h-[160px] justify-between"
     >
       <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-transform  duration-200", getIconBg(mod.color))}>
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
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
 <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
  <Sparkles className="w-5 h-5 text-rose-500" />
  Giao diện & Theme
 </h3>
 
 <div className="space-y-4">
  <h4 className="font-semibold text-slate-900">Màu sắc chủ đạo (Primary Color)</h4>
  <div className="flex gap-4">
  {(['indigo', 'blue', 'emerald', 'rose', 'amber', 'slate', 'vcomm'] as const).map(color => (
  <button
  key={color}
  onClick={() => setPrimaryColor(color)}
  className={`w-10 h-10 rounded-full flex items-center justify-center ${primaryColor === color ? 'ring-2 ring-offset-2 ring-slate-800' : ''}`}
  style={{ backgroundColor: color === 'vcomm' ? '#003991' : `var(--color-${color}-600)` }}
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
   <button onClick={() => setBorderRadius('vcomm')} className={`px-4 py-2 border ${borderRadius === 'vcomm' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-lg flex-1 font-medium`}>VComm Classic</button>
  <button onClick={() => setBorderRadius('xl')} className={`px-4 py-2 border ${borderRadius === 'xl' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-lg flex-1 font-medium`}>Cong (xl)</button>
  <button onClick={() => setBorderRadius('2xl')} className={`px-4 py-2 border ${borderRadius === '2xl' ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-300'} rounded-lg flex-1 font-medium`}>Rất cong (2xl)</button>
  </div>
 </div>

 <div className="space-y-4">
  <h4 className="font-semibold text-slate-900 flex items-center gap-2">Theme Lễ Tết</h4>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  {(['none', 'tet', 'christmas', 'mid-autumn', 'halloween'] as const).map(theme => (
  <button
  key={theme}
  onClick={() => setHolidayTheme(theme)}
  className={`p-4 border rounded-lg text-center flex flex-col items-center gap-2 transition-all ${holidayTheme === theme ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm' : 'border-slate-300 hover:border-slate-400'}`}
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
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-4">
 <h3 className="font-bold text-slate-900">Cấu hình ví & Payout</h3>
 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
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
    <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
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
          <div key={wallet.name} className="border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <h4 className="font-bold text-slate-900 flex items-center gap-2">
                <span className={cn("w-3 h-3 rounded-full", wallet.color === "emerald" ? "bg-emerald-500" : wallet.color === "blue" ? "bg-blue-500" : wallet.color === "indigo" ? "bg-indigo-500" : "bg-slate-500")}></span>
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
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-4">
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
 <div key={fee.id} className={cn("p-4 rounded-lg border transition-all relative overflow-hidden group", fee.isActive ? "bg-white border-slate-300" : "bg-slate-50 border-slate-200 opacity-60")}>
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
 
 <div className="absolute -bottom-4 -right-4 opacity-[0.03] rotate-12  transition-transform">
 {fee.type === 'fixed' ? <BadgeDollarSign className="w-24 h-24" /> : <Zap className="w-24 h-24" />}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Section 2: Platform Commission (Existing) */}
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-4">
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
 <div className="mb-4 p-4 bg-slate-50 border border-slate-300 rounded-lg flex items-center gap-3 animate-in slide-in- duration-200">
 <label className="text-sm font-bold text-slate-800 whitespace-nowrap">Tên ngành hàng:</label>
 <input 
 type="text" 
 placeholder="VD: Mẹ & Bé, Đồ gia dụng..." 
 className="flex-1 p-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 font-medium"
 value={newCategoryName}
 onChange={(e) => setNewCategoryName(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
 />
 <button onClick={handleAddCategory} className="px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700">Lưu</button>
 <button onClick={() => setShowAddCategory(false)} className="px-5 py-2 bg-slate-200 text-slate-800 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-300">Hủy</button>
 </div>
 )}

 <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm overflow-x-auto min-w-0">
 <table className="w-full text-sm whitespace-nowrap">
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
 className="w-16 p-1.5 text-sm border-2 border-slate-300 rounded-lg text-center focus:outline-none focus:border-slate-900 font-bold text-blue-900 bg-white"
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
 className="w-16 p-1.5 text-sm border-2 border-amber-100 rounded-lg text-center focus:outline-none focus:border-amber-500 font-bold text-amber-900 bg-white"
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
 className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 bg-primary-50 px-3 py-2 rounded-lg border border-primary-100 hover:bg-primary-600 hover:text-white transition-all shadow-sm opacity-0 group-hover:opacity-100 scale-95 "
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
  
  <div className="flex justify-end pt-4">
    <button 
      onClick={handleSaveFeeConfig} 
      disabled={isSavingFee} 
      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
    >
      <Save className="w-4 h-4" />{isSavingFee ? 'Đang lưu...' : 'Lưu cấu hình Phí sàn'}
    </button>
  </div>
  
  </div>
  </div>
  )}

  {activeTab === 'website' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
 <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm border-b border-slate-100 pb-3">
 <Globe className="w-4 h-4 text-blue-600" /> Cấu hình Website Tổng (Hệ thống ERP & Storefront)
 </h3>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Danh sách tên miền</label>
 <div className="space-y-2">
  {customDomains.map((domain, index) => {
    const diagState = dnsDiagnostics[domain] || 'idle';
    return (
      <div key={index} className="space-y-2">
        <div className="flex gap-2">
        <input 
        type="text" 
        value={domain} 
        onChange={(e) => updateDomain(index, e.target.value)}
        placeholder="ví dụ: store.domain.com" 
        className="flex-1 p-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-600/20 focus:border-slate-900 transition-all" 
        />
        <button 
          type="button"
          onClick={() => handleCheckDns(domain)}
          disabled={!domain || diagState === 'checking'}
          className="px-4 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {diagState === 'checking' ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>Đang quét...</span>
            </>
          ) : (
            <>
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              <span>Kiểm tra DNS</span>
            </>
          )}
        </button>
        <button onClick={() => removeDomain(index)} className="p-3 text-red-505 hover:bg-red-50 rounded-lg">
        <Trash2 className="w-4 h-4" />
        </button>
        </div>

        {diagState !== 'idle' && (
          <div className={`p-3.5 rounded-lg border text-xs leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200 ${
            diagState === 'checking' 
              ? 'bg-blue-50/50 border-blue-200 text-blue-800' 
              : diagState === 'valid' 
                ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
                : 'bg-rose-50 border-rose-250 text-rose-800'
          }`}>
            {diagState === 'checking' && (
              <p className="flex items-center gap-1.5 font-medium">
                🔍 Đang quét DNS tên miền và phân tích bản ghi...
              </p>
            )}
            {diagState === 'valid' && (
              <div className="space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-700">
                  🟢 Tên miền hợp lệ (Valid IP)
                </p>
                <p className="text-slate-650">
                  Tên miền <strong className="font-mono">{domain}</strong> đã trỏ chính xác về IP Vercel (<strong className="font-mono">76.76.21.21</strong>). Chứng chỉ SSL đang hoạt động ổn định.
                </p>
              </div>
            )}
            {diagState === 'invalid' && (
              <div className="space-y-1.5">
                <p className="font-bold flex items-center gap-1.5 text-rose-700">
                  🔴 Chưa trỏ đúng DNS (Invalid Configuration)
                </p>
                <p className="text-slate-650">
                  Vui lòng định cấu hình bản ghi tên miền của bạn:
                </p>
                <div className="bg-white/60 p-2.5 rounded-lg border border-rose-200/50 font-mono text-[10px] text-slate-700 space-y-1">
                  <div>• Bản ghi <strong className="text-slate-900 font-bold">A</strong>: Tên <strong className="text-slate-900 font-bold">@</strong> trỏ về IP <strong className="text-slate-900 font-bold">76.76.21.21</strong></div>
                  <div>• Hoặc Bản ghi <strong className="text-slate-900 font-bold">CNAME</strong>: Tên <strong className="text-slate-900 font-bold">www</strong> trỏ về <strong className="text-slate-900 font-bold">cname.vercel-dns.com</strong></div>
                </div>
                <p className="text-slate-500 text-[9.5px] italic">Lưu ý: Thay đổi DNS có thể mất vài giờ để có hiệu lực trên toàn cầu.</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  })}
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
       { key: 'bento_builder', title: 'Thiết kế Bố cục Home (Bento Layout Builder & Live Preview)', icon: AppWindow },
        { key: 'companyInfo', title: 'Thông tin công ty', icon: Building2 },
       { key: 'footerLinks', title: 'Cột liên kết Footer', icon: Globe },
       { key: 'paymentMethods', title: 'Phương thức Thanh toán & Vận chuyển', icon: CreditCard },
       { key: 'socialLinks', title: 'Mạng xã hội', icon: Link2 },
       { key: 'legalInfo', title: 'Thông tin pháp lý', icon: ShieldCheck },
       { key: 'preview', title: 'Xem trước Footer', icon: AppWindow },
     ] as const).map(({ key, title, icon: Icon }) => (
       <div key={key} className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
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
                       className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                           className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                               className="flex-1 p-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                             />
                             <input
                               type="text"
                               value={item.url}
                               onChange={e => updateFooterLink(colKey, idx, 'url', e.target.value)}
                               placeholder="/duong-dan"
                               className="flex-1 p-2 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
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
                     <div key={pm.id} className={cn('flex items-center gap-3 p-3 rounded-lg border transition-all', pm.active ? 'border-blue-300 bg-blue-50/40' : 'border-slate-200 bg-white opacity-60')}>
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
                         className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
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
                   className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-xs font-bold text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all flex items-center justify-center gap-2"
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
                       onChange={e => setSiteConfig(c => ({ ...c, socialLinks: { ...c.socialLinks, [field]: e.target.value } } ))}
                       placeholder={placeholder}
                       className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
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
                     className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                 </div>
                 <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Địa chỉ pháp lý</label>
                   <textarea value={siteConfig.legalInfo.legalAddress}
                     onChange={e => setSiteConfig(c => ({ ...c, legalInfo: { ...c.legalInfo, legalAddress: e.target.value } }))}
                     rows={2} className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none" />
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
                       className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                   </div>
                 ))}
                 <div className="md:col-span-2">
                   <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Dòng bản quyền (Copyright)</label>
                   <input type="text" value={siteConfig.copyrightText}
                     onChange={e => setSiteConfig(c => ({ ...c, copyrightText: e.target.value }))}
                     className="w-full p-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all" />
                 </div>
               </div>
             )}

             {/* BENTO BUILDER */}
              {key === 'bento_builder' && (
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Left panel: layout sections order */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Danh sách Khối Homepage (Grid Bento)</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Bật/tắt hoặc kéo đổi vị trí để sắp xếp giao diện trang chủ của bạn.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          addNotification('Storefront', 'Đã đặt lại bố cục mặc định.');
                          setStorefrontSections([
                            { id: 'hero_banner', title: 'Banner Khuyến Mãi (Hero)', description: 'Banner chính đầu trang hiển thị chiến dịch lớn', isActive: true, order: 0, color: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white', mockContent: '🎁 Siêu Tiệc Thương Hiệu - Giảm đến 50%' },
                            { id: 'flash_sale', title: 'Săn Deal Flash Sale', description: 'Đếm ngược các sản phẩm giá sốc giới hạn giờ', isActive: true, order: 1, color: 'bg-rose-500 text-white animate-pulse', mockContent: '⚡ Flash Sale đang diễn ra: 01:59:59' },
                            { id: 'bento_campaign', title: 'Bento Grid Chiến Dịch', description: 'Hiển thị danh mục hot dạng lưới Bento Premium', isActive: true, order: 2, color: 'bg-slate-100 border border-slate-200 text-slate-800', mockContent: '🍱 Bộ Sưu Tập Mùa Hè / Xu Hướng Công Nghệ' },
                            { id: 'featured_products', title: 'Sản Phẩm Bán Chạy', description: 'Slider cuộn các sản phẩm được đánh giá cao', isActive: true, order: 3, color: 'bg-slate-50 border border-slate-200 text-slate-800', mockContent: '🔥 Top 10 sản phẩm thịnh hành nhất' },
                            { id: 'footer_info', title: 'Thông tin chân trang (Footer)', description: 'Hiển thị liên kết pháp lý và thương hiệu', isActive: true, order: 4, color: 'bg-slate-900 text-slate-350', mockContent: '🏢 CÔNG TY CỔ PHẦN CÔNG NGHỆ VCOMM' },
                          ]);
                        }}
                        className="text-xs font-bold text-blue-605 hover:underline cursor-pointer bg-transparent border-0"
                      >
                        Đặt lại mặc định
                      </button>
                    </div>

                    <div className="space-y-3">
                      {storefrontSections.map((sec, idx) => (
                        <div key={sec.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between gap-4 hover:shadow-xs transition duration-150">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${sec.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                              <span className="text-xs font-bold text-slate-850">{sec.title}</span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-snug truncate">{sec.description}</p>
                            {sec.isActive && (
                              <input 
                                type="text" 
                                value={sec.mockContent} 
                                onChange={e => {
                                  const text = e.target.value;
                                  setStorefrontSections(prev => prev.map(s => s.id === sec.id ? { ...s, mockContent: text } : s));
                                }}
                                className="w-full mt-1.5 px-2 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Nội dung hiển thị..."
                              />
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Toggle active switch */}
                            <button 
                              type="button"
                              onClick={() => toggleSectionActive(sec.id)}
                              className={`w-9 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer border-0 ${sec.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
                            >
                              <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${sec.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </button>

                            {/* Move up / down buttons */}
                            <div className="flex flex-col gap-1">
                              <button 
                                type="button"
                                onClick={() => moveSection(idx, 'up')}
                                disabled={idx === 0}
                                className="p-1 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 rounded text-slate-650 text-[10px] font-bold cursor-pointer"
                              >
                                ▲
                              </button>
                              <button 
                                type="button"
                                onClick={() => moveSection(idx, 'down')}
                                disabled={idx === storefrontSections.length - 1}
                                className="p-1 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-30 rounded text-slate-650 text-[10px] font-bold cursor-pointer"
                              >
                                ▼
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right panel: Live Device Preview */}
                  <div className="lg:col-span-2 flex flex-col items-center space-y-4">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Xem trước thiết bị</span>
                      <div className="flex bg-slate-105 p-1 rounded-lg border border-slate-200">
                        <button 
                          type="button"
                          onClick={() => setPreviewDeviceMode('mobile')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer border-0 ${previewDeviceMode === 'mobile' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
                        >
                          <Smartphone className="w-3.5 h-3.5" /> Mobile
                        </button>
                        <button 
                          type="button"
                          onClick={() => setPreviewDeviceMode('tablet')}
                          className={`px-3 py-1 text-[10px] font-bold rounded-lg transition duration-150 flex items-center gap-1 cursor-pointer border-0 ${previewDeviceMode === 'tablet' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'}`}
                        >
                          <Tablet className="w-3.5 h-3.5" /> Tablet
                        </button>
                      </div>
                    </div>

                    {/* Outer Device Container */}
                    <div className={`bg-slate-950 p-3.5 rounded-[40px] shadow-lg border-4 border-slate-800 relative transition-all duration-300 ${
                      previewDeviceMode === 'mobile' ? 'w-[280px] h-[520px]' : 'w-[340px] h-[460px]'
                    }`}>
                      {/* Device notch/speaker */}
                      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 bg-slate-800 h-4 w-28 rounded-full flex items-center justify-center">
                        <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
                      </div>

                      {/* Device screen area */}
                      <div className="w-full h-full bg-slate-100 rounded-[28px] overflow-hidden flex flex-col border border-slate-700/50">
                        {/* Status bar */}
                        <div className="h-6 bg-slate-200 px-4 flex items-center justify-between text-[9px] font-semibold text-slate-500">
                          <span>09:41 AM</span>
                          <div className="flex items-center gap-1">
                            <span>LTE</span>
                            <span>100%</span>
                          </div>
                        </div>
                        {/* URL bar */}
                        <div className="bg-white px-3 py-1.5 border-b border-slate-200 flex items-center justify-center">
                          <div className="bg-slate-100 text-slate-450 text-[9px] px-2.5 py-0.5 rounded-full truncate w-full text-center font-mono border border-slate-200">
                            {customDomains[0] || 'erp.vcom.vn'}
                          </div>
                        </div>

                        {/* Homepage inner contents */}
                        <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 bg-slate-50 scrollbar-none">
                          {/* Store Header logo banner */}
                          <div className="p-2 bg-white rounded-lg shadow-3xs flex justify-between items-center">
                            <span className="text-xs font-black text-slate-905 tracking-tight">{siteConfig.companyInfo.brandName}</span>
                            <div className="flex gap-1.5 text-[8px] font-bold text-slate-500">
                              <span>Sản phẩm</span>
                              <span>Giỏ hàng</span>
                            </div>
                          </div>

                          {/* Render Active Sections in order */}
                          {storefrontSections
                            .filter(s => s.isActive)
                            .map(s => (
                              <div 
                                key={s.id} 
                                className={`p-3 rounded-lg shadow-4xs text-[10px] leading-snug font-semibold text-center transition-all duration-300 hover:scale-[1.02] ${
                                  s.id === 'hero_banner' 
                                    ? 'bg-linear-to-r from-blue-600 to-indigo-600 text-white min-h-[55px] flex items-center justify-center'
                                    : s.id === 'flash_sale'
                                      ? 'bg-rose-505 text-white min-h-[40px] flex items-center justify-center animate-pulse'
                                      : s.id === 'bento_campaign'
                                        ? 'bg-white border border-slate-200 text-slate-805 min-h-[75px] grid grid-cols-2 gap-1.5 p-2'
                                        : s.id === 'featured_products'
                                          ? 'bg-white border border-slate-200 text-slate-805 min-h-[60px] flex flex-col justify-between p-2'
                                          : 'bg-slate-900 text-slate-350 min-h-[35px] flex items-center justify-center font-normal'
                                }`}
                              >
                                {s.id === 'bento_campaign' ? (
                                  <>
                                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-1 text-[8px] flex items-center justify-center text-blue-755 font-bold">🍉 Thời Trang</div>
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-1 text-[8px] flex items-center justify-center text-emerald-755 font-bold">🔌 Điện Tử</div>
                                  </>
                                ) : s.id === 'featured_products' ? (
                                  <>
                                    <div className="text-[9px] text-left text-slate-400 font-bold">Slider Bán Chạy</div>
                                    <div className="flex gap-1.5 pt-1 overflow-x-auto">
                                      <div className="bg-slate-105 border border-slate-200 rounded p-1 text-[8px] min-w-[50px]">🏷️ Giày Sneaker</div>
                                      <div className="bg-slate-105 border border-slate-200 rounded p-1 text-[8px] min-w-[50px]">🏷️ Tai Nghe</div>
                                    </div>
                                  </>
                                ) : (
                                  s.mockContent
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

{/* PREVIEW */}
             {key === 'preview' && (
               <div className="rounded-lg overflow-hidden border border-slate-200 bg-white text-sm">
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
 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
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
 <table className="w-full text-left whitespace-nowrap">
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
 <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-slate-300 shadow-sm">
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

 <div className="bg-white rounded-lg border border-slate-300 shadow-sm overflow-hidden">
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
 <div key={module.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:bg-white hover:shadow-sm transition-all group">
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
      {/* Bento Grid Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-lg border border-indigo-200/50 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-indigo-600/70 dark:text-indigo-400/70">Tổng Kết Nối Hoạt Động</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {[misaConfig.isActive, znsConfig.isActive, shopifyHaravanConfig.isActive, marketplaceConfig.isActive, true, true].filter(Boolean).length} / 6
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Các cổng kết nối dữ liệu ngoại</p>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-lg border border-emerald-200/50 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-emerald-600/70 dark:text-emerald-400/70">Tỷ Lệ Đồng Bộ Thành Công</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {((syncLogs.filter(l => l.status === 'success').length / syncLogs.length) * 100).toFixed(1)}%
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Đạt chỉ tiêu SLA vận hành</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-lg border border-purple-200/50 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-purple-600/70 dark:text-purple-400/70">Webhooks Đang Active</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {customWebhooks.filter(w => w.isActive).length} sự kiện
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Đẩy dữ liệu thời gian thực</p>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg">
            <Webhook className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 dark:from-slate-800 dark:to-slate-800/80 p-5 rounded-lg border border-rose-200/50 dark:border-slate-700 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-bold text-rose-600/70 dark:text-rose-400/70">Lỗi Hệ Thống Hôm Nay</p>
            <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 mt-1">
              {syncLogs.filter(l => l.status === 'failed').length} lỗi
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Cần rà soát đối soát tài khoản</p>
          </div>
          <div className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Connection Manager Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-indigo-500" /> Cổng Kết Nối Hệ Thống (Integration Hub)
          </h3>
          <span className="text-xs text-slate-400">Trạng thái đồng bộ tự động thời gian thực</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* MISA ACCOUNTING */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[180px] hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Kế toán MISA SME</h4>
                    <p className="text-[9px] text-slate-500">Đồng bộ chứng từ & hóa đơn</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={misaConfig.isActive}
                    onChange={(e) => saveMisaConfigLocal({ ...misaConfig, isActive: e.target.checked })}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2">
                Hạch toán tự động công nợ thu chi, doanh thu sàn TMĐT và chi phí vào hệ thống tài khoản MISA theo Thông tư 99/2025/TT-BTC.
              </p>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button 
                onClick={() => handleTestConnection('MISA Accounting')}
                disabled={testingConnection['MISA Accounting']}
                className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
              >
                {testingConnection['MISA Accounting'] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Kiểm tra
              </button>
              <button 
                onClick={() => setActiveConfigModal('misa')}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors"
              >
                Cấu hình
              </button>
            </div>
          </div>

          {/* SEPAY GATEWAY */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[180px] hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-500/10 text-blue-600 rounded-lg">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Cổng SePay Gateway</h4>
                    <p className="text-[9px] text-slate-500">Đối soát chuyển khoản ngân hàng</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={!!apiKeys.sepayToken}
                    onChange={(e) => {
                      if (!e.target.checked) {
                        setApiKeys(prev => ({ ...prev, sepayToken: '' }));
                        safeLocalStorage.setItem('api_sepay_api_token', '');
                        addNotification('SePay Gateway', 'Đã tạm ngưng tích hợp SePay.');
                      } else {
                        setActiveConfigModal('sepay');
                      }
                    }}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-500"></div>
                </label>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2">
                Quét mã QR giao dịch, bắt thông tin biến động số dư ngân hàng và tự động cập nhật trạng thái đơn hàng Đã Thanh Toán trong 3 giây.
              </p>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button 
                onClick={() => handleTestConnection('SePay Gateway')}
                disabled={testingConnection['SePay Gateway']}
                className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
              >
                {testingConnection['SePay Gateway'] ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                Kiểm tra
              </button>
              <button 
                onClick={() => setActiveConfigModal('sepay')}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors"
              >
                Cấu hình
              </button>
            </div>
          </div>

          {/* ZALO ZNS */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[180px] hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-sky-500/10 text-sky-600 rounded-lg">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Tin nhắn Zalo ZNS</h4>
                    <p className="text-[9px] text-slate-500">Chăm sóc khách hàng tự động</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={znsConfig.isActive}
                    onChange={(e) => saveZnsConfigLocal({ ...znsConfig, isActive: e.target.checked })}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-500"></div>
                </label>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2">
                Tự động gửi tin nhắn ZNS xác nhận đơn hàng, cập nhật vận trình giao vận và tri ân thăng hạng loyalty thành viên.
              </p>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button 
                onClick={() => handleTestConnection('Zalo ZNS')}
                disabled={testingConnection['Zalo ZNS']}
                className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
              >
                {testingConnection['Zalo ZNS'] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Kiểm tra
              </button>
              <button 
                onClick={() => setActiveConfigModal('zns')}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors"
              >
                Cấu hình
              </button>
            </div>
          </div>

          {/* SHOPIFY / HARAVAN RETAIL SYNC */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[180px] hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-500/10 text-teal-600 rounded-lg">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Shopify / Haravan</h4>
                    <p className="text-[9px] text-slate-500">Đồng bộ kho lẻ & sản phẩm</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={shopifyHaravanConfig.isActive}
                    onChange={(e) => saveShopifyHaravanConfig({ ...shopifyHaravanConfig, isActive: e.target.checked })}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-teal-500"></div>
                </label>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2">
                Kết nối đẩy hình ảnh, thông tin sản phẩm và đồng bộ đơn hàng tự động hai chiều từ cửa hàng retail online về ERP.
              </p>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button 
                onClick={() => handleTestConnection('Shopify/Haravan')}
                disabled={testingConnection['Shopify/Haravan']}
                className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
              >
                {testingConnection['Shopify/Haravan'] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Kiểm tra
              </button>
              <button 
                onClick={() => setActiveConfigModal('shopify')}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors"
              >
                Cấu hình
              </button>
            </div>
          </div>

          {/* SHOPEE / TIKTOK SHOP MULTICHANNEL */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[180px] hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-orange-500/10 text-orange-600 rounded-lg">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Shopee & TikTok Shop</h4>
                    <p className="text-[9px] text-slate-500">Đồng bộ sàn Thương mại điện tử</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={marketplaceConfig.isActive}
                    onChange={(e) => saveMarketplaceConfig({ ...marketplaceConfig, isActive: e.target.checked })}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                </label>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2">
                Hỗ trợ phân phối tồn kho tự động, cập nhật trạng thái đơn hàng đa sàn để giải quyết bài toán over-selling.
              </p>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button 
                onClick={() => handleTestConnection('Marketplace API')}
                disabled={testingConnection['Marketplace API']}
                className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
              >
                {testingConnection['Marketplace API'] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Kiểm tra
              </button>
              <button 
                onClick={() => setActiveConfigModal('marketplace')}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors"
              >
                Cấu hình
              </button>
            </div>
          </div>

          {/* CUSTOM WEBHOOKS */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-[180px] hover:shadow-md transition-shadow">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
                    <Webhook className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100">Custom Webhooks</h4>
                    <p className="text-[9px] text-slate-500">Đẩy thông báo sự kiện ra ngoài</p>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full font-bold">
                  {customWebhooks.length} Hook
                </span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-2">
                Cho phép truyền trực tiếp các sự kiện phát sinh (đơn hàng mới, thanh toán thành công) về URL server đối tác.
              </p>
            </div>
            <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/50">
              <button 
                onClick={() => handleTestConnection('Webhooks Payload')}
                disabled={testingConnection['Webhooks Payload']}
                className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
              >
                {testingConnection['Webhooks Payload'] ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Test Payload
              </button>
              <button 
                onClick={() => setActiveConfigModal('webhook')}
                className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-colors"
              >
                Quản lý
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Logs and OpenAPI Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sync Logs List */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Nhật ký đồng bộ API (API Sync Logs)
            </h4>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Tìm nền tảng hoặc sự kiện..." 
                className="w-full pl-9 pr-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100"
                value={syncLogsSearch}
                onChange={e => setSyncLogsSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-2.5">Thời gian</th>
                  <th className="py-2.5">Hệ thống</th>
                  <th className="py-2.5">Sự kiện</th>
                  <th className="py-2.5">Chi tiết</th>
                  <th className="py-2.5 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/30 text-xs">
                {syncLogs
                  .filter(log => 
                    log.platform.toLowerCase().includes(syncLogsSearch.toLowerCase()) ||
                    log.event.toLowerCase().includes(syncLogsSearch.toLowerCase())
                  )
                  .map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="py-3 text-[10px] text-slate-500 whitespace-nowrap font-mono">{log.timestamp}</td>
                      <td className="py-3 font-semibold text-slate-700 dark:text-slate-300">{log.platform}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "w-2 h-2 rounded-full flex-shrink-0",
                            log.status === 'success' ? "bg-emerald-500" : "bg-rose-500"
                          )}></span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">{log.event}</span>
                        </div>
                      </td>
                      <td className="py-3 max-w-[240px] truncate text-slate-500 dark:text-slate-400" title={log.details}>
                        {log.details}
                      </td>
                      <td className="py-3 text-center">
                        {log.status === 'failed' ? (
                          <button 
                            onClick={() => handleRetrySync(log.id)}
                            className="px-2 py-1 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 rounded-md text-[10px] font-bold transition-colors flex items-center gap-1 mx-auto"
                          >
                            <RefreshCw className="w-3 h-3" /> Thử lại
                          </button>
                        ) : (
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">Thành công</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* OpenAPI Key Manager */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Key className="w-4 h-4 text-orange-500" /> OpenAPI Client Keys
            </h4>
            <button 
              onClick={() => {
                setCreatedKeyDetails(null);
                setNewOpenApiKey({ name: '', scopes: [] });
                setActiveConfigModal('webhook'); // reusing state to flag key creation display
              }}
              className="p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Tạo API Key mới"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-500">Quản lý các Token truy cập dùng để tích hợp các hệ thống bên thứ ba vào VComm ERP.</p>

          <div className="space-y-3">
            {openApiKeys.map(key => (
              <div key={key.id} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">{key.name}</span>
                  <span className={cn(
                    "text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase",
                    key.status === 'active' ? "bg-emerald-500/10 text-emerald-600" : "bg-slate-200 text-slate-600 dark:bg-slate-700"
                  )}>
                    {key.status === 'active' ? 'Hoạt động' : 'Đã hủy'}
                  </span>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Token:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 font-bold">{key.token}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tạo lúc:</span>
                    <span className="text-slate-600 dark:text-slate-300 font-medium">{key.createdAt}</span>
                  </div>
                  <div className="flex justify-between overflow-hidden">
                    <span className="text-slate-400">Quyền hạn:</span>
                    <span className="text-slate-600 dark:text-slate-300 truncate max-w-[150px]" title={key.scopes.join(', ')}>
                      {key.scopes.join(', ') || 'no-scope'}
                    </span>
                  </div>
                </div>
                {key.status === 'active' && (
                  <button 
                    onClick={() => handleRevokeApiKey(key.id)}
                    className="absolute right-2 bottom-2 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors"
                    title="Thu hồi khóa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <a href="/docs/api" className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center gap-1 hover:underline">
              <FileText className="w-3.5 h-3.5" /> Xem Tài liệu hướng dẫn OpenAPI (Swagger)
            </a>
          </div>
        </div>
      </div>

      {/* --- MISA CONFIGURATION MODAL --- */}
      {activeConfigModal === 'misa' && (
        <Modal
          isOpen={activeConfigModal === 'misa'}
          onClose={() => setActiveConfigModal(null)}
          title="Cấu hình Kế toán Doanh nghiệp MISA"
          icon={<Building2 className="w-5 h-5 text-emerald-600" />}
          maxWidth="lg"
          onConfirm={() => {
            saveMisaConfigLocal(misaConfig);
            logAction('Settings.Misa', 'UPDATE', 'Cập nhật cấu hình Misa');
            setActiveConfigModal(null);
          }}
          confirmText="Lưu cấu hình MISA"
          confirmButtonClass="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          <div className="space-y-4">
            <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200/50 dark:border-yellow-900/30 p-3.5 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] text-yellow-800 dark:text-yellow-300">
                <span className="font-bold">Lưu ý nghiệp vụ</span>: Bắt buộc tuân thủ <span className="font-bold">Thông tư 99/2025/TT-BTC</span> của Bộ Tài chính khi hạch toán. Các mã tài khoản phải khớp chính xác với hệ thống tài khoản kế toán doanh nghiệp (COA) hiện hành.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">MISA App ID</label>
                <input 
                  type="text" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                  value={misaConfig.appId}
                  onChange={e => setMisaConfig(prev => ({ ...prev, appId: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Access Token (API Connect)</label>
                <input 
                  type="password" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                  value={misaConfig.accessToken}
                  onChange={e => setMisaConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3">
              <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300 mb-3">Thiết lập tài khoản hạch toán mặc định</h5>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Tài khoản Nợ thu (Ngân hàng)</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                    value={misaConfig.debitAccountDefault}
                    onChange={e => setMisaConfig(prev => ({ ...prev, debitAccountDefault: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Tài khoản Doanh thu (Có)</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                    value={misaConfig.creditAccountDefault}
                    onChange={e => setMisaConfig(prev => ({ ...prev, creditAccountDefault: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Tài khoản Phải thu (131)</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                    value={misaConfig.receivableAccountDefault}
                    onChange={e => setMisaConfig(prev => ({ ...prev, receivableAccountDefault: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Thuế GTGT đầu ra (33311)</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                    value={misaConfig.taxAccountOutDefault || ''}
                    onChange={e => setMisaConfig(prev => ({ ...prev, taxAccountOutDefault: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Mã kho mặc định</label>
                  <input 
                    type="text" 
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono uppercase"
                    value={misaConfig.defaultWarehouseCode || ''}
                    onChange={e => setMisaConfig(prev => ({ ...prev, defaultWarehouseCode: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500">Phải trả nhà cung cấp (331)</label>
                  <input 
                    type="text" 
                    maxLength={5}
                    className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100 font-mono"
                    value={misaConfig.partnerLiabilitiesAccount || ''}
                    onChange={e => setMisaConfig(prev => ({ ...prev, partnerLiabilitiesAccount: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700/50 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Tách giao dịch sàn TMĐT</h5>
                  <p className="text-[9px] text-slate-500">Tự động hạch toán riêng phí hoa hồng Shopee/TikTok vào TK 641.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={misaConfig.enableMarketplaceSplit}
                    onChange={e => setMisaConfig(prev => ({ ...prev, enableMarketplaceSplit: e.target.checked }))}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Chế độ Kế toán Nội bộ (Mock Mode)</h5>
                  <p className="text-[9px] text-slate-500">Chạy các nghiệp vụ ở dạng Sandbox, không đẩy trực tiếp vào sổ cái chính thức.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={misaConfig.localAccountingMode}
                    onChange={e => setMisaConfig(prev => ({ ...prev, localAccountingMode: e.target.checked }))}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                </label>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* --- SEPAY CONFIGURATION MODAL --- */}
      {activeConfigModal === 'sepay' && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Cấu hình Cổng Thanh toán SePay</h4>
              </div>
              <button onClick={() => setActiveConfigModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">SePay API JWT Token</label>
                <input 
                  type="password" 
                  placeholder="Bearer JWT Token..."
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-100 font-mono"
                  value={apiKeys.sepayToken}
                  onChange={e => setApiKeys(prev => ({ ...prev, sepayToken: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Client ID</label>
                  <input 
                    type="text" 
                    placeholder="SePay client ID"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-100"
                    value={apiKeys.sepayId}
                    onChange={e => setApiKeys(prev => ({ ...prev, sepayId: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Client Secret</label>
                  <input 
                    type="password" 
                    placeholder="SePay client secret"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 dark:text-slate-100"
                    value={apiKeys.sepaySecret}
                    onChange={e => setApiKeys(prev => ({ ...prev, sepaySecret: e.target.value }))}
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2">
                <h5 className="font-bold text-[10px] text-slate-600 dark:text-slate-400 uppercase">SePay Webhook URL để nhận biến động số dư</h5>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="font-mono text-[9px] text-slate-500 truncate select-all flex-1">https://api.vcomm.vn/v1/webhooks/sepay-callback</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('https://api.vcomm.vn/v1/webhooks/sepay-callback');
                      addNotification('Copy Webhook', 'Đã sao chép URL webhook của SePay.');
                    }}
                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-400"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Webhook Simulator Section */}
              <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/50 space-y-3 font-sans">
                <h5 className="font-bold text-[10.5px] text-blue-800 dark:text-blue-400 uppercase tracking-wider">Bộ Giả Lập Webhook (Webhook Simulator)</h5>
                
                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Nội dung chuyển khoản (Content)</label>
                    <input 
                      type="text" 
                      placeholder="Ví dụ: VCOMM_ORD_123 hoặc VCOMM_DEP_cust123"
                      className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:outline-none dark:text-slate-100 font-mono"
                      value={simCode}
                      onChange={e => setSimCode(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Số tiền chuyển khoản (Amount)</label>
                    <input 
                      type="number" 
                      placeholder="Số tiền (VND)"
                      className="w-full text-xs p-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg focus:outline-none dark:text-slate-100"
                      value={simAmount}
                      onChange={e => setSimAmount(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleSimulateWebhook}
                    disabled={simulating || !simCode}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {simulating ? 'Đang giả lập...' : 'Kích hoạt Webhook giả lập 🚀'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setActiveConfigModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  saveApiKeys();
                  setActiveConfigModal(null);
                }}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ZALO ZNS CONFIGURATION MODAL --- */}
      {activeConfigModal === 'zns' && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-sky-600" />
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Cấu hình Zalo ZNS (Zalo OA)</h4>
              </div>
              <button onClick={() => setActiveConfigModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Zalo Official Account ID (OA ID)</label>
                <input 
                  type="text" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 dark:text-slate-100 font-mono"
                  value={znsConfig.oaId}
                  onChange={e => setZnsConfig(prev => ({ ...prev, oaId: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Zalo Developer App ID</label>
                <input 
                  type="text" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 dark:text-slate-100 font-mono"
                  value={znsConfig.appId}
                  onChange={e => setZnsConfig(prev => ({ ...prev, appId: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">OA Access Token</label>
                <input 
                  type="password" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 dark:text-slate-100 font-mono"
                  value={znsConfig.accessToken}
                  onChange={e => setZnsConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <div>
                  <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Tự động refresh token</h5>
                  <p className="text-[9px] text-slate-500">Sử dụng Refresh Token để gia hạn Access Token tự động.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={znsConfig.autoRefresh}
                    onChange={e => setZnsConfig(prev => ({ ...prev, autoRefresh: e.target.checked }))}
                  />
                  <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-500"></div>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setActiveConfigModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  saveZnsConfigLocal(znsConfig);
                  setActiveConfigModal(null);
                }}
                className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Lưu cấu hình ZNS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SHOPIFY / HARAVAN CONFIGURATION MODAL --- */}
      {activeConfigModal === 'shopify' && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-teal-600" />
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Cấu hình Shopify / Haravan Integration</h4>
              </div>
              <button onClick={() => setActiveConfigModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Shop URL (Domain hoặc sub-domain)</label>
                <input 
                  type="text" 
                  placeholder="shop-retail.myshopify.com hoặc nexhubshop.vn"
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-slate-100"
                  value={shopifyHaravanConfig.shopUrl}
                  onChange={e => setShopifyHaravanConfig(prev => ({ ...prev, shopUrl: e.target.value }))}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Admin API Access Token</label>
                <input 
                  type="password" 
                  placeholder="shpat_..."
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 dark:text-slate-100 font-mono"
                  value={shopifyHaravanConfig.accessToken}
                  onChange={e => setShopifyHaravanConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>

              <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Tùy chọn đồng bộ</h5>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Đồng bộ sản phẩm tự động (PIM)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={shopifyHaravanConfig.syncProducts}
                      onChange={e => setShopifyHaravanConfig(prev => ({ ...prev, syncProducts: e.target.checked }))}
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-teal-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Tải đơn hàng về hệ thống ERP</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={shopifyHaravanConfig.syncOrders}
                      onChange={e => setShopifyHaravanConfig(prev => ({ ...prev, syncOrders: e.target.checked }))}
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-teal-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Đồng bộ tồn kho tức thời (Stock sync)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={shopifyHaravanConfig.autoInventorySync}
                      onChange={e => setShopifyHaravanConfig(prev => ({ ...prev, autoInventorySync: e.target.checked }))}
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-teal-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setActiveConfigModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  saveShopifyHaravanConfig(shopifyHaravanConfig);
                  setActiveConfigModal(null);
                }}
                className="flex-1 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SHOPEE / TIKTOK SHOP CONFIGURATION MODAL --- */}
      {activeConfigModal === 'marketplace' && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Cấu hình Shopee / TikTok Shop Integration</h4>
              </div>
              <button onClick={() => setActiveConfigModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Sàn Thương mại</label>
                  <select 
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-slate-100"
                    value={marketplaceConfig.platform}
                    onChange={e => setMarketplaceConfig(prev => ({ ...prev, platform: e.target.value as 'shopee' | 'tiktok' }))}
                  >
                    <option value="shopee">Shopee Mall / Live</option>
                    <option value="tiktok">TikTok Shop VN</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Gian hàng Shop ID</label>
                  <input 
                    type="text" 
                    placeholder="shop_id_12345"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-slate-100"
                    value={marketplaceConfig.shopId}
                    onChange={e => setMarketplaceConfig(prev => ({ ...prev, shopId: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">App Key (API Partner)</label>
                  <input 
                    type="text" 
                    placeholder="app_key"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-slate-100"
                    value={marketplaceConfig.appKey}
                    onChange={e => setMarketplaceConfig(prev => ({ ...prev, appKey: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">App Secret Key</label>
                  <input 
                    type="password" 
                    placeholder="app_secret"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-slate-100"
                    value={marketplaceConfig.appSecret}
                    onChange={e => setMarketplaceConfig(prev => ({ ...prev, appSecret: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Access Token hiện tại</label>
                <input 
                  type="password" 
                  className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-orange-500 dark:text-slate-100 font-mono"
                  value={marketplaceConfig.accessToken}
                  onChange={e => setMarketplaceConfig(prev => ({ ...prev, accessToken: e.target.value }))}
                />
              </div>

              <div className="space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                <h5 className="font-bold text-xs text-slate-700 dark:text-slate-300">Tùy chọn đồng bộ</h5>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Đồng bộ tồn kho tự động</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={marketplaceConfig.autoSyncStock}
                      onChange={e => setMarketplaceConfig(prev => ({ ...prev, autoSyncStock: e.target.checked }))}
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 dark:text-slate-400">Kéo đơn hàng về để tạo phiếu đóng gói</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={marketplaceConfig.autoSyncOrders}
                      onChange={e => setMarketplaceConfig(prev => ({ ...prev, autoSyncOrders: e.target.checked }))}
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:height-3.5 after:width-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setActiveConfigModal(null)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={() => {
                  saveMarketplaceConfig(marketplaceConfig);
                  setActiveConfigModal(null);
                }}
                className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM WEBHOOKS / OPENAPI NEW KEY CONFIG MODAL --- */}
      {activeConfigModal === 'webhook' && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          {createdKeyDetails ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-emerald-600 border-b border-slate-100 dark:border-slate-700 pb-3">
                <ShieldCheck className="w-5 h-5" />
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Client Key Đã Được Tạo Thành Công</h4>
              </div>
              <div className="space-y-3">
                <p className="text-xs text-slate-500">
                  Vui lòng sao chép Client Secret Key dưới đây. Bạn chỉ có thể xem khóa này <span className="font-bold text-red-500">một lần duy nhất</span> vì lý do bảo mật.
                </p>
                <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-slate-800 dark:text-slate-100 font-bold select-all flex-1 break-all">{createdKeyDetails}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(createdKeyDetails);
                      addNotification('Sao chép Key', 'Đã lưu OpenAPI Secret Key vào Clipboard.');
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-400"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <button 
                onClick={() => {
                  setCreatedKeyDetails(null);
                  setActiveConfigModal(null);
                }}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Tôi đã lưu, đóng cửa sổ
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 w-full max-w-md shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100">Tạo mới OpenAPI Client Key</h4>
                </div>
                <button onClick={() => setActiveConfigModal(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full">
                  <X className="w-4 h-4 text-slate-500" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Tên ứng dụng / Đối tác tích hợp</label>
                  <input 
                    type="text" 
                    placeholder="ví dụ: Giao Hàng Tiết Kiệm (GHTK)"
                    className="w-full text-xs p-2.5 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-slate-100"
                    value={newOpenApiKey.name || ''}
                    onChange={e => setNewOpenApiKey(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Gán Quyền Hạn (Scopes)</label>
                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700/60 max-h-[140px] overflow-y-auto">
                    {[
                      { id: 'orders.read', name: 'Đọc Đơn hàng' },
                      { id: 'orders.write', name: 'Tạo/Sửa Đơn hàng' },
                      { id: 'products.read', name: 'Đọc Sản phẩm' },
                      { id: 'products.write', name: 'Tạo/Sửa Sản phẩm' },
                      { id: 'inventory.read', name: 'Đọc Kho hàng' },
                      { id: 'customers.read', name: 'Đọc Khách hàng' }
                    ].map(scope => (
                      <label key={scope.id} className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
                        <input 
                          type="checkbox"
                          className="rounded text-indigo-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
                          checked={newOpenApiKey.scopes?.includes(scope.id) || false}
                          onChange={e => {
                            const current = newOpenApiKey.scopes || [];
                            if (e.target.checked) {
                              setNewOpenApiKey(prev => ({ ...prev, scopes: [...current, scope.id] }));
                            } else {
                              setNewOpenApiKey(prev => ({ ...prev, scopes: current.filter(s => s !== scope.id) }));
                            }
                          }}
                        />
                        <span className="text-[10px] font-semibold">{scope.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                  onClick={() => setActiveConfigModal(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors"
                >
                  Hủy bỏ
                </button>
                <button 
                  onClick={handleCreateApiKey}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Tạo Token Key
                </button>
              </div>
            </div>
          )}
        </div>
      )}
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
 <div className="flex justify-between items-center mb-3">
 <div className="flex items-center gap-2">
 <MapPin className="w-4 h-4 text-blue-600" />
 <h3 className="text-sm font-bold text-slate-800">Danh sách Tỉnh/Thành phố</h3>
 <span className="font-mono text-[10px] text-slate-400 border border-slate-200 px-1.5 py-0.5">Nguồn: provinces.open-api.vn</span>
 </div>
 <div className="flex items-center gap-2">
 {addressSaveMessage && (
 <span className={cn(
 "text-xs font-medium px-2 py-1 rounded",
 addressSaveMessage.includes('Lỗi') ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
 )}>
 {addressSaveMessage}
 </span>
 )}
 <button
 onClick={handleSaveAddressConfig}
 disabled={savingAddressConfig || loadingAddressConfig}
 className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 cursor-pointer"
 >
 {savingAddressConfig ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
 Lưu cấu hình Địa chỉ
 </button>
 </div>
 </div>
 {loadingAddressConfig ? (
 <div className="py-8 text-center text-slate-400 text-sm">
 <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
 Đang tải cấu hình địa chỉ...
 </div>
 ) : (
 <VietnamProvinceBrowser
 isConfigMode={true}
 activeProvinces={addressConfig.activeProvinces}
 activeWards={addressConfig.activeWards}
 onToggleProvince={handleToggleProvince}
 onToggleWard={handleToggleWard}
 onSelectAll={handleSelectAll}
 onDeselectAll={handleDeselectAll}
 />
 )}
 </div>
 </div>
 )}

 {activeTab === 'org' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <Building2 className="w-5 h-5 text-blue-600" /> Quản lý Cơ cấu Tổ chức
 </h3>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
 <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:col-span-1">
 <h4 className="font-bold text-slate-900 mb-4">Phòng ban</h4>
 {MOCK_DEPARTMENTS.map((dept) => (
 <div key={dept.id} className={cn("bg-white p-3 rounded-lg border border-slate-200 mb-2 flex justify-between items-center", dept.parentId ? "ml-6 border-l-4 border-l-blue-400" : "")}>
 <span className="text-sm font-medium">{dept.name}</span>
 <button className="text-[10px] bg-slate-100 px-2 py-1 rounded">Sửa</button>
 </div>
 ))}
 </div>
 <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:col-span-1">
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
 <div key={title.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
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
 <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 md:col-span-1">
 <div className="flex justify-between items-center mb-4">
 <h4 className="font-bold text-slate-900">Cấp bậc</h4>
 <button className="text-xs bg-slate-200 text-slate-800 px-2 py-1 rounded hover:bg-slate-300 transition">
 <Plus className="w-3 h-3 inline" /> Thêm
 </button>
 </div>
 <div className="space-y-2">
 {MOCK_JOB_RANKS.map((item) => (
 <div key={item.id} className="bg-white p-3 rounded-lg border border-slate-200 flex justify-between items-center shadow-sm">
 <div>
 <div className="text-sm font-medium">{item.name}</div>
 <div className="text-[10px] text-slate-500">Level: {item.level}</div>
 </div>
 <button className="text-[10px] bg-slate-100 px-2 py-1 rounded">Sửa</button>
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
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
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
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-white p-3 rounded-lg shadow-sm border border-primary-50 flex justify-between items-center">
 <div className="space-y-1">
 <span className="text-[10px] uppercase font-bold text-slate-500">Chi nhánh Quận 1</span>
 <p className="font-mono text-sm text-slate-900">sg1.v-erp.com</p>
 </div>
 <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">ACTIVE</span>
 </div>
 <div className="bg-white p-3 rounded-lg shadow-sm border border-primary-50 flex justify-between items-center">
 <div className="space-y-1">
 <span className="text-[10px] uppercase font-bold text-slate-500">Chi nhánh Cầu Giấy</span>
 <p className="font-mono text-sm text-slate-900">hn1.v-erp.com</p>
 </div>
 <span className="bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">ACTIVE</span>
 </div>
 </div>
 </div>

 <h4 className="font-bold text-slate-900 border-b border-slate-200 pb-2">Danh sách Cửa hàng & Nhân sự</h4>
 
 <div className="space-y-4">
 {[
 { id: 'STORE_001', name: 'Chi nhánh Quận 1 - Sài Gòn', address: '123 Lê Lợi, Q.1, TP.HCM', staff: 5, manager: 'Nguyễn Văn A' },
 { id: 'STORE_002', name: 'Chi nhánh Cầu Giấy - Hà Nội', address: '45 Xuân Thủy, Cầu Giấy, HN', staff: 8, manager: 'Trần Thị B' },
 ].map(store => (
 <div key={store.id} className="border border-slate-200 rounded-lg p-4 flex items-center justify-between hover:border-blue-400 transition-colors bg-slate-50">
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
 <button className="p-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"><Trash2 className="w-4 h-4" /></button>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}
 {activeTab === 'comms' && (
 <div className="animate-in fade-in duration-300 space-y-6">
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
 <div className="flex justify-between items-center">
 <h3 className="font-bold text-slate-900 flex items-center gap-2">
 <MessageSquare className="w-5 h-5 text-blue-600" /> Tích hợp SMS OTP & Zalo ZNS
 </h3>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Zalo ZNS Config */}
 <div className="border border-slate-200 rounded-lg p-5 hover:border-blue-400 transition-colors">
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
 <input type="text" defaultValue="2938475928374928" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-900 font-mono" />
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Zalo App ID</label>
 <input type="text" defaultValue="142345234523" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-900 font-mono" />
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Access Token</label>
 <div className="flex gap-2">
 <input type="password" defaultValue="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-slate-900 font-mono" />
 <button className="px-3 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 text-sm font-bold text-slate-700">Đồng bộ</button>
 </div>
 <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Token sẽ hết hạn vào 20:00 25/04/2026. Bật auto-refresh để tự làm mới.</p>
 </div>
 </div>
 <button className="w-full mt-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm">
 Kiểm tra kết nối ZNS
 </button>
 </div>

 {/* SMS OTP Config */}
 <div className="border border-slate-200 rounded-lg p-5 hover:border-emerald-400 transition-colors">
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
 <select className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
 <option>eSMS.vn</option>
 <option>VietGuys</option>
 <option>FPT SMS</option>
 <option>Viettel MKT</option>
 </select>
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Brandname đăng ký</label>
 <input type="text" placeholder="Ví dụ: V-ECOM" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">API Key</label>
 <input type="password" placeholder="Nhập API Key..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono" />
 </div>
 <div>
 <label className="text-xs font-bold text-slate-700 block mb-1">Secret Key</label>
 <input type="password" placeholder="Nhập Secret..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 font-mono" />
 </div>
 </div>
 </div>
 <button className="w-full mt-6 py-2.5 bg-slate-100 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors">
 Lưu thiết lập SMS
 </button>
 </div>
 </div>
 
 <div className="bg-slate-100 border border-slate-200 rounded-lg p-5 mt-6">
 <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Zap className="w-4 h-4" /> Kịch bản Gửi tin (Triggers)</h4>
 <p className="text-sm text-orange-800 mb-4">Cấu hình các sự kiện hệ thống tự động gọi API ZNS/SMS để thông báo chăm sóc khách hàng.</p>
 <div className="space-y-3">
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer">
 <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-400 focus:ring-orange-600" />
 <span className="text-sm font-medium text-slate-800 flex-1">Nhắn mã OTP xác thực khi đăng nhập/đổi mật khẩu</span>
 <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded">Ưu tiên: SMS OTP</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer">
 <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded border-slate-400 focus:ring-orange-600" />
 <span className="text-sm font-medium text-slate-800 flex-1">Gửi Zalo ZNS xác nhận Đặt hàng thành công</span>
 <span className="text-[10px] font-bold text-blue-600 bg-[#EAE7DF] px-2 py-1 rounded">Template: ZNS_ORDER_01</span>
 </label>
 <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer">
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
 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
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
 className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Nội dung thông báo (hỗ trợ văn bản)</label>
 <textarea 
 rows={4} 
 placeholder="Chi tiết thông báo..." 
 value={notiMessage}
 onChange={(e) => setNotiMessage(e.target.value)}
 className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-y"
 />
 </div>

 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Đối tượng nhận thông báo</label>
 <select className="w-full p-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white cursor-pointer mb-2">
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

 <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
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
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
 <div className="space-y-4">
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5">Tiêu đề Popup</label>
 <input 
 type="text" 
 placeholder="VD: Khuyến Mãi Hè 2024" 
 value={popupTitle}
 onChange={(e) => setPopupTitle(e.target.value)}
 className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5">Nội dung / Mô tả</label>
 <textarea 
 placeholder="Nhập nội dung hiển thị trong popup..." 
 value={popupDesc}
 rows={2}
 onChange={(e) => setPopupDesc(e.target.value)}
 className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] resize-y" 
 />
 </div>
 <div>
 <label className="block text-xs font-bold text-slate-500 mb-1.5">Hình ảnh (URL hoặc upload)</label>
 <input 
 type="text" 
 placeholder="https://example.com/banner.jpg" 
 value={popupImage}
 onChange={(e) => setPopupImage(e.target.value)}
 className="w-full p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
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
 className="w-1/3 p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 <input 
 type="text" 
 placeholder="Link (URL)" 
 value={popupCtaLink}
 onChange={(e) => setPopupCtaLink(e.target.value)}
 className="flex-1 p-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]" 
 />
 </div>
 </div>
 </div>
 
 <div className="bg-slate-50 border border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center min-h-[200px] relative">
 <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest absolute top-2 right-2">Xem trước</div>
 <div className="w-full max-w-[240px] bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden mt-4">
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
      <div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-600" /> Phân loại & Cấu hình Hàng hóa
        </h3>
        <p className="text-sm text-slate-600 mb-4">Quản lý các loại mặt hàng, định mức dự trữ, đơn vị tính, và các thuộc tính lưu kho (SKU/Barcode).</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-900">Danh mục Nhóm Hàng hóa</h4>
              <button className="text-xs text-blue-600 font-bold hover:underline">+ Thêm nhóm</button>
            </div>
            <div className="space-y-2">
              {['Nguyên vật liệu (Raw Materials)', 'Thành phẩm (Finished Goods)', 'Bán thành phẩm (WIP)', 'Hàng hóa thương mại (Trading Goods)'].map((type, i) => (
                <div key={i} className="flex justify-between items-center bg-white p-3 border border-slate-200 rounded-lg">
                  <span className="text-sm font-medium">{type}</span>
                  <button className="text-slate-500 hover:text-slate-700"><Edit2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
            <h4 className="font-bold text-slate-950 mb-4">Phương pháp Quản lý Kho</h4>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/50">
                <input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" defaultChecked />
                <span className="text-sm font-medium">Bình quan gia quyền (Weighted Average)</span>
              </label>
              <label className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100/50">
                <input type="radio" name="inventory_method" className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Nhập trước xuất trước (FIFO)</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

	{activeTab === 'saas_subscription' && (
		<div className="animate-in fade-in duration-350 space-y-7">
			{/* Gói hiện tại và thông báo chúc mừng */}
			<div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-6 text-white relative overflow-hidden shadow-sm">
				<div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
				<div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

				<div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
					<div className="space-y-2">
						<div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-semibold uppercase tracking-wider">
							<Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400" /> Bản Quyền SaaS Enterprise
						</div>
						<h3 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
							VComm Enterprise ERP
						</h3>
						<p className="text-slate-300 text-sm max-w-xl leading-relaxed">
							Doanh nghiệp của bạn đang vận hành trên cụm máy chủ đám mây chuyên dụng với hiệu năng tối đa, không giới hạn quyền năng quản trị.
						</p>
					</div>
					<div className="bg-white/10 backdrop-blur-md rounded-lg p-5 border border-white/10 flex flex-col items-center shrink-0 w-full md:w-auto text-center">
						<span className="text-[10px] text-slate-300 uppercase tracking-widest font-semibold">Chu kỳ thanh toán tiếp theo</span>
						<span className="text-2xl font-black text-amber-300 mt-1">20 / 06 / 2026</span>
						<span className="text-[11px] text-slate-400 mt-1">Số tiền: 15,000,000đ / Năm (Trực động)</span>
					</div>
				</div>
			</div>

			{/* Grid của hạn mức và Cụm Tenants */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Cột Trái: Hạn mức Hệ thống (SaaS Quotas) */}
				<div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-300 shadow-xs space-y-6">
					<div>
						<h4 className="font-bold text-slate-900 flex items-center gap-2">
							<CreditCard className="w-5 h-5 text-blue-600" /> Hạn mức Tài nguyên SaaS (Resource Quotas)
						</h4>
						<p className="text-xs text-slate-500 mt-0.5">Các thông số giới hạn dịch vụ dựa theo gói đăng ký hiện tại.</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{[
							{ title: 'Nhân viên hệ thống (Staff)', current: 45, max: 100, unit: 'Tài khoản', percent: 45, color: 'from-blue-500 to-indigo-600' },
							{ title: 'API Webhooks & Events', current: 30420, max: 100000, unit: 'Yêu cầu / Tháng', percent: 30.4, color: 'from-purple-500 to-pink-600' },
							{ title: 'Danh mục Sản phẩm (PIM)', current: 842, max: 5000, unit: 'Sản phẩm lưu trữ', percent: 16.8, color: 'from-emerald-500 to-teal-600' },
							{ title: 'Dung lượng đám mây (Storage)', current: 1.2, max: 50, unit: 'GB lưu trữ media', percent: 2.4, color: 'from-amber-500 to-orange-600' }
						].map((quota, idx) => (
							<div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
								<div className="flex justify-between items-start mb-2">
									<span className="text-xs font-bold text-slate-800 uppercase tracking-tight">{quota.title}</span>
									<span className="text-[11px] font-mono text-slate-500">
										{quota.current.toLocaleString()} / {quota.max.toLocaleString()} {quota.unit}
									</span>
								</div>
								<div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
									<div 
										className={"h-full bg-linear-to-r " + quota.color + " rounded-full transition-all duration-500"}
										style={{ width: `${quota.percent}%` }}
									/>
								</div>
								<div className="flex justify-between items-center mt-1.5 text-[10px] text-slate-400 font-semibold">
									<span>Đã dùng: {quota.percent}%</span>
									<span className="text-slate-500">Còn lại: {(100 - quota.percent).toFixed(1)}%</span>
								</div>
							</div>
						))}
					</div>

					<div className="p-4 bg-blue-50 border border-blue-150 rounded-lg flex items-start gap-3">
						<AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
						<div className="text-xs leading-relaxed text-blue-800">
							<span className="font-bold">Mở rộng hạn mức linh hoạt:</span> Hệ thống SaaS được thiết kế để mở rộng tài nguyên tự động. Khi chạm ngưỡng 90% dung lượng hoặc giới hạn, quản trị viên có thể bấm đề xuất mua thêm gói lẻ hoặc đăng ký nâng thêm gói Enterprise Plus trực tiếp để tránh gián đoạn dịch vụ.
						</div>
					</div>
				</div>

				{/* Cột Phải: Cấu hình Tenant & Cloud Node */}
				<div className="bg-white p-6 rounded-lg border border-slate-300 shadow-xs space-y-6">
					<div>
						<h4 className="font-bold text-slate-900 flex items-center gap-2">
							<Database className="w-5 h-5 text-indigo-600" /> Hệ thống Tenant & Nodes
						</h4>
						<p className="text-xs text-slate-500 mt-0.5">Thông tin máy chủ cô lập dữ liệu cho Doanh nghiệp.</p>
					</div>

					<div className="space-y-4">
						<div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
							<div className="flex justify-between items-center text-xs">
								<span className="text-slate-500">Mã định danh Tenant ID</span>
								<span className="font-mono font-bold text-slate-800">tenant-vcomm-prod-01</span>
							</div>
							<div className="flex justify-between items-center text-xs">
								<span className="text-slate-500">Phân vùng CSDL (Schema)</span>
								<span className="bg-indigo-100 text-indigo-700 font-mono text-[10px] font-bold px-2 py-0.5 border border-indigo-250 rounded">Isolate DB Node</span>
							</div>
							<div className="flex justify-between items-center text-xs">
								<span className="text-slate-500">Vị trí địa lý (Region)</span>
								<span className="text-slate-800 font-medium">Asia-Southeast1 (Singapore)</span>
							</div>
							<div className="flex justify-between items-center text-xs">
								<span className="text-slate-500">Uptime Đám Mây</span>
								<span className="text-emerald-600 font-bold flex items-center gap-1">
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 99.99% Uptime
								</span>
							</div>
						</div>

						<div className="border border-slate-200 rounded-lg p-4 space-y-3">
							<span className="text-xs font-bold text-slate-800 uppercase tracking-widest block font-mono">Sao lưu Đám mây (Cloud Backups)</span>
							
							<div className="space-y-2">
								<label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Đám mây Lưu trữ</label>
								<select 
									value={backupCloud} 
									onChange={e => setBackupCloud(e.target.value as any)}
									className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
								>
									<option value="gdrive">Google Drive</option>
									<option value="dropbox">Dropbox</option>
									<option value="aws_s3">Amazon S3</option>
								</select>
							</div>

							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-2">
									<label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Tần suất</label>
									<select 
										value={backupFrequency} 
										onChange={e => setBackupFrequency(e.target.value as any)}
										className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
									>
										<option value="daily">Hàng ngày</option>
										<option value="weekly">Hàng tuần</option>
										<option value="monthly">Hàng tháng</option>
									</select>
								</div>
								<div className="space-y-2">
									<label className="block text-[10px] font-bold text-slate-550 uppercase tracking-wider">Giờ sao lưu</label>
									<select 
										value={backupHour} 
										onChange={e => setBackupHour(e.target.value)}
										className="w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
									>
										<option value="00:00">00:00 AM</option>
										<option value="02:00">02:00 AM</option>
										<option value="04:00">04:00 AM</option>
										<option value="12:00">12:00 PM</option>
									</select>
								</div>
							</div>

							<div className="space-y-1.5 pt-1">
								<span className="text-[10px] text-slate-450 font-medium">Trạng thái tự động:</span>
								<div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-605">
									<span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
									Đã kích hoạt ({backupCloud === 'gdrive' ? 'Google Drive' : backupCloud === 'dropbox' ? 'Dropbox' : 'AWS S3'})
								</div>
							</div>

							<div className="flex gap-2 pt-2">
								<button 
									type="button"
									onClick={() => {
										setIsRunningBackup(true);
										setTimeout(() => {
											setIsRunningBackup(false);
											addNotification('Sao lưu đám mây', `Đã đẩy bản sao lưu lên ${backupCloud.toUpperCase()} thành công!`);
										}, 1500);
									}}
									disabled={isRunningBackup}
									className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition duration-150 shadow-xs cursor-pointer disabled:opacity-50"
								>
									{isRunningBackup ? 'Đang sao lưu...' : 'Sao lưu ngay'}
								</button>
								<button 
									type="button"
									onClick={() => alert('Đang tải bản sao lưu cấu hình hệ thống và CSDL hiện tại...')} 
									className="py-2 px-3 bg-slate-100 hover:bg-slate-200 border border-slate-250 text-slate-800 text-xs font-bold rounded-lg transition duration-150 shadow-xs cursor-pointer"
								>
									<Download className="w-3.5 h-3.5" />
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Gói dịch vụ so sánh (Subscription Plans Simulator) */}
			<div className="bg-white p-6 rounded-lg border border-slate-300 shadow-xs space-y-6">
				<div>
					<h4 className="font-bold text-slate-900 flex items-center gap-2">
						<Sparkles className="w-5 h-5 text-amber-500" /> Các gói dịch vụ SaaS Toàn Diện (SaaS Pricing Matrix)
					</h4>
					<p className="text-xs text-slate-500 mt-0.5">So sánh tính năng giữa các gói giải pháp SaaS để quản lý phân quyền tính năng trong doanh nghiệp.</p>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
					{[
						{ 
							name: 'Starter Trial', 
							price: 'Miễn phí', 
							period: '/ Trọn đời',
							monthlyEquiv: 'Trải nghiệm miễn phí',
							desc: 'Dành cho doanh nghiệp siêu nhỏ trải nghiệm vận hành cơ bản.',
							features: ['Bộ nhớ 1GB Cloud', 'Phân quyền tối đa 3 nhân sự', 'Mở rộng 1 chi nhánh duy nhất', 'Hạn mức PIM: 100 sản phẩm', 'Không hỗ trợ API kết nối', 'Không hỗ trợ Custom Domain'],
							active: false,
							btnText: 'Hạ gói về Starter',
							isCorporate: false,
							highlight: false,
							tag: 'DÙNG THỬ',
							borderColor: 'group-hover:border-slate-350',
							gradient: 'from-slate-50 border border-slate-200'
						},
						{ 
							name: 'Professional', 
							price: '5.000.000đ', 
							period: '/ Năm',
							monthlyEquiv: 'Chỉ khoảng 416.000đ / tháng',
							desc: 'Doanh nghiệp SMEs đang tăng trưởng và cần mở rộng chi nhánh.',
							features: ['Bộ nhớ 10GB Cloud SSD tản mát', 'Phân quyền 15 nhân sự cấp cao', 'Mở rộng lên đến 3 chi nhánh', 'Hạn mức PIM: 1,000 sản phẩm', 'Mở khoá cổng API tích hợp', 'Tích hợp 1 Custom Domain riêng'],
							active: false,
							btnText: 'Nâng Cấp Ngay Pro',
							isCorporate: false,
							highlight: true,
							tag: 'BÁN CHẠY NHẤT',
							borderColor: 'group-hover:border-blue-400',
							gradient: 'from-blue-50/20 via-white to-white border border-blue-200 shadow-sm shadow-blue-50/50'
						},
						{ 
							name: 'Enterprise ERP', 
							price: '15.000.050đ', 
							period: '/ Năm',
							monthlyEquiv: 'Chỉ khoảng 1.250.000đ / tháng',
							desc: 'Bản đầy đủ cao cấp dành cho mô hình chuỗi phân phối đa kênh.',
							features: ['Bộ nhớ 50GB Cloud SSD tốc độ cao', 'Phân quyền 100 nhân sự toàn chuỗi', 'Không giới hạn số lượng chi nhánh', 'Hạn mức PIM: 5,000 sản phẩm', 'Mở khoá đầy đủ Webhooks & API', 'Tích hợp Custom Domain & Subdomains'],
							active: true,
							btnText: 'Gói Đang Sử Dụng',
							isCorporate: false,
							highlight: false,
							tag: 'GÓI DOANH NGHIỆP',
							borderColor: 'group-hover:border-emerald-500',
							gradient: 'from-emerald-50/25 via-white to-white border-2 border-emerald-500 shadow-sm shadow-emerald-100/30'
						},
						{ 
							name: 'Custom Corporate', 
							price: 'Thoả thuận', 
							period: ' / Dự án',
							monthlyEquiv: 'Tư vấn giải pháp riêng biệt',
							desc: 'Dành riêng cho tập đoàn cực lớn, tùy chỉnh sâu nghiệp vụ CSDL.',
							features: ['Hạ tầng Bare-metal biệt lập', 'Không giới hạn số lượng nhân viên', 'Không giới hạn danh mục sản phẩm', 'Hỗ trợ kỹ thuật 24/7 SLA 99.99%', 'Tích hợp trực tiếp SAP/Oracle song song', 'Hỗ trợ cấu trúc CSDL độc lập'],
							active: false,
							btnText: 'Tư vấn Chuyên Gia',
							isCorporate: true,
							highlight: false,
							tag: 'DÙNG RIÊNG',
							borderColor: 'group-hover:border-amber-400',
							gradient: 'from-amber-50/15 via-white to-white border border-slate-200 hover:border-slate-350'
						}
					].map((plan, idx) => (
						<div 
							key={idx} 
							className={`group relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 ${plan.gradient}  hover:shadow-sm`}
						>
							{/* Badge tags */}
							{plan.active ? (
								<div className="absolute top-0 right-0">
									<div className="flex items-center gap-1.5 bg-emerald-600 text-white text-[9px] uppercase tracking-widest font-extrabold py-1.5 px-4 rounded-bl-2xl shadow-xs">
										<span className="flex h-1.5 w-1.5 relative">
											<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
											<span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-100"></span>
										</span>
										{plan.tag}
									</div>
								</div>
							) : plan.highlight ? (
								<div className="absolute top-0 right-0">
									<div className="flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[9px] uppercase tracking-widest font-extrabold py-1.5 px-4 rounded-bl-2xl shadow-xs">
										<Zap className="w-2.5 h-2.5 animate-pulse" /> {plan.tag}
									</div>
								</div>
							) : (
								<div className="absolute top-3 right-4">
									<span className="text-[9px] uppercase tracking-wider font-extrabold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md border border-slate-200">
										{plan.tag}
									</span>
								</div>
							)}

							<div>
								{/* Card header */}
								<span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">PRO-SaaS NODE</span>
								<h5 className="font-extrabold text-slate-900 text-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-700 transition-colors">
									{plan.name}
								</h5>
								
								<div className="mt-3 flex items-baseline gap-1">
									<span className={`text-xl font-black ${plan.active ? 'text-emerald-600' : plan.highlight ? 'text-blue-600' : 'text-slate-900'} tracking-tight`}>
										{plan.price}
									</span>
									<span className="text-xs text-slate-400 font-semibold">{plan.period}</span>
								</div>
								
								<span className="text-[11px] text-slate-400 font-semibold italic block mt-0.5">
									{plan.monthlyEquiv}
								</span>

								<p className="text-xs text-slate-500 mt-3 leading-relaxed min-h-[48px] border-b border-dashed border-slate-150 pb-3">
									{plan.desc}
								</p>

								{/* Features section */}
								<div className="mt-4 space-y-2 flex-grow">
									<span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Đặc quyền cấp bậc:</span>
									<ul className="space-y-2">
										{plan.features.map((feat, fidx) => {
											const isBanned = feat.startsWith('Không');
											return (
												<li key={fidx} className="flex items-start gap-2 text-xs leading-snug">
													{isBanned ? (
														<X className="w-3.5 h-3.5 text-slate-350 shrink-0 mt-0.5" />
													) : (
														<Check className={`w-3.5 h-3.5 ${plan.active ? 'text-emerald-500' : plan.highlight ? 'text-blue-500' : 'text-indigo-500'} shrink-0 mt-0.5`} />
													)}
													<span className={isBanned ? 'text-slate-400 line-through' : 'text-slate-600'}>
														{feat}
													</span>
												</li>
											);
										})}
									</ul>
								</div>
							</div>

							{/* Button CTA with micro interactions */}
							<button 
								className={`w-full mt-8 py-3 rounded-lg text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 group-hover:shadow-sm cursor-pointer ${
									plan.active 
										? 'bg-emerald-500/10 text-emerald-700 border border-dashed border-emerald-300 hover:bg-emerald-500/15 cursor-default' 
										: plan.highlight
											? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow-blue-500/25 active:scale-95'
											: plan.isCorporate
												? 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-slate-900/10 active:scale-95'
												: 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-150 hover:border-slate-300 active:scale-95'
								}`}
								onClick={() => {
									if (!plan.active) {
										alert(`Hệ thống mô phỏng Sandbox: Bạn đã gửi yêu cầu chuyển đổi lên gói "${plan.name}". Kỹ sư giải pháp của chúng tôi sẽ liên hệ phê duyệt sớm nhất.`);
									}
								}}
							>
								{plan.active ? (
									<>
										<CheckCircle2 className="w-4 h-4 text-emerald-600" />
										<span>{plan.btnText}</span>
									</>
								) : (
									<>
										<span>{plan.btnText}</span>
										<ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
									</>
								)}
							</button>
						</div>
					))}
				</div>
			</div>

			{/* Lịch sử hoá đơn & và Custom Domains đại lý */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Danh sách hoá đơn */}
				<div className="bg-white p-6 rounded-lg border border-slate-300 shadow-xs space-y-4">
					<div>
						<h4 className="font-bold text-slate-900 flex items-center gap-2">
							<FileText className="w-5 h-5 text-indigo-600" /> Bản kê Hoá đơn Thuê bao SaaS
						</h4>
						<p className="text-xs text-slate-500 mt-0.5">Lịch sử thanh toán định kỳ cho tài nguyên SaaS và giấy phép sử dụng.</p>
					</div>

					<div className="overflow-x-auto border border-slate-200 rounded-lg">
						<table className="w-full text-left text-xs border-collapse whitespace-nowrap">
							<thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
								<tr>
									<th className="p-3">Mã hoá đơn</th>
									<th className="p-3">Ngày lập</th>
									<th className="p-3">Số tiền</th>
									<th className="p-3">Trạng thái</th>
									<th className="p-3 text-right">Hành động</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{[
									{ id: 'INV-2026-001', date: '21/05/2026', amt: '15,000,000đ', pMethod: 'MoMo Corp', status: 'Đã thanh toán' },
									{ id: 'INV-2025-002', date: '20/06/2025', amt: '15,000,000đ', pMethod: 'ZaloPay Business', status: 'Đã thanh toán' },
									{ id: 'INV-2024-003', date: '19/06/2024', amt: '15,000,000đ', pMethod: 'Chuyển khoản Bank', status: 'Đã thanh toán' }
								].map((invoice, i) => (
									<tr key={i} className="hover:bg-slate-50/50">
										<td className="p-3 font-mono font-bold text-slate-800">{invoice.id}</td>
										<td className="p-3 text-slate-500">{invoice.date}</td>
										<td className="p-3 text-slate-900 font-bold">{invoice.amt}</td>
										<td className="p-3">
											<span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-150 rounded">
												{invoice.status}
											</span>
										</td>
										<td className="p-3 text-right">
											<button onClick={() => alert('Đang tải hóa đơn VAT bản PDF...')} className="text-blue-600 hover:underline font-bold cursor-pointer">PDF 💾</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* DNS Custom Domain For Tenants */}
				<div className="bg-white p-6 rounded-lg border border-slate-300 shadow-xs space-y-4">
					<div>
						<h4 className="font-bold text-slate-900 flex items-center gap-2">
							<Globe className="w-5 h-5 text-indigo-600" /> Tên miền đại lý & Cài đặt DNS
						</h4>
						<p className="text-xs text-slate-500 mt-0.5">Trỏ tên miền thương hiệu riêng của doanh nghiệp về trung tâm phân phối SaaS.</p>
					</div>

					<div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
						<div className="text-xs font-semibold text-slate-700 uppercase tracking-wider font-mono">Hướng dẫn cấu hình DNS:</div>
						<p className="text-xs text-slate-650 leading-relaxed">
							Tại trang quản trị nhà đăng ký tên miền của bạn (Mắt Bão, Pavietnam, Cloudflare, v.v.), hãy cấu hình bản ghi sau để kích hoạt SSL tự động:
						</p>
						<div className="bg-white border border-slate-200 rounded-lg p-3 text-xs font-mono space-y-1">
							<div><span className="text-slate-400">Loại bản ghi (Type):</span> <span className="font-bold text-blue-600">CNAME</span></div>
							<div><span className="text-slate-400">Tên (Name / Host):</span> <span className="font-bold text-slate-800">erp</span> hoặc <span className="font-bold text-slate-800">@</span></div>
							<div><span className="text-slate-400">Giá trị (Points to):</span> <span className="font-bold text-emerald-600 font-semibold">saas.vcommerp.com</span></div>
							<div><span className="text-slate-400">TTL:</span> <span className="font-bold text-slate-800">3600 (1 hour)</span></div>
						</div>

						<div className="pt-2 flex items-center justify-between text-xs font-medium border-t border-slate-200">
							<span className="text-slate-500">Trạng thái kết nối</span>
							<span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded flex items-center gap-1 border border-blue-150">
								<span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> Đang trỏ: erp.vcom.vn
							</span>
						</div>
					</div>
				</div>
			</div>

						{/* Phân tích An ninh AI (AI Security Monitor) */}
			<div className="bg-white p-6 rounded-lg border border-slate-300 shadow-xs space-y-6 mb-6">
				<div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 pb-4">
					<div className="space-y-1">
						<h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
							<Sparkles className="w-5 h-5 text-indigo-650 fill-indigo-100 animate-pulse" /> Phân tích An ninh Hệ thống AI (AI Security Audit Monitor)
						</h4>
						<p className="text-xs text-slate-500 mt-0.5">Trí tuệ nhân tạo VComm AI tự động kiểm duyệt và phát hiện hành vi bất thường trong log truy cập tenant.</p>
					</div>
					<button 
						type="button"
						onClick={runAiSecurityScan}
						disabled={isScanningAiLogs}
						className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg flex items-center gap-2 cursor-pointer shadow-xs transition duration-150"
					>
						{isScanningAiLogs ? (
							<>
								<RefreshCw className="w-3.5 h-3.5 animate-spin" />
								<span>AI Đang Quét...</span>
							</>
						) : (
							<>
								<ShieldCheck className="w-3.5 h-3.5" />
								<span>Chạy Quét An Ninh AI</span>
							</>
						)}
					</button>
				</div>

				{isScanningAiLogs ? (
					<div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
						<span className="w-8 h-8 rounded-full border-3 border-slate-200 border-t-indigo-600 animate-spin"></span>
						<p className="font-bold text-slate-700 animate-pulse">VComm AI đang phân tích dữ liệu log và địa chỉ IP lạ...</p>
						<p className="text-slate-400 text-[10px]">Quá trình kiểm soát Zero-Trust có thể mất vài giây.</p>
					</div>
				) : (
					<div className="space-y-4 animate-in fade-in duration-300">
						{/* Cảnh báo Nguy hại (Critical Alert) */}
						<div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-4 shadow-2xs">
							<div className="p-2 bg-rose-100 text-rose-700 rounded-lg shrink-0">
								<AlertCircle className="w-5 h-5" />
							</div>
							<div className="space-y-2 flex-1 min-w-0">
								<div className="flex items-center justify-between gap-2">
									<span className="text-xs font-bold text-rose-800 uppercase tracking-wider bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-250">
										Cảnh báo nguy hại (Critical)
									</span>
									<span className="text-[10px] text-rose-500 font-mono font-semibold">02:14 AM (Hôm nay)</span>
								</div>
								<p className="text-xs font-semibold text-slate-800 leading-relaxed">
									Thay đổi quyền hạn vai trò đột ngột: Tài khoản nhân viên <code className="font-mono bg-white/70 px-1.5 py-0.5 rounded text-rose-700 border border-rose-100">nv_nhan@vcomm.vn</code> được nâng cấp lên nhóm vai trò <code className="font-mono bg-white/70 px-1.5 py-0.5 rounded text-rose-700 border border-rose-100">Siêu quản trị (Super Admin)</code> bởi IP lạ <code className="font-mono text-slate-700">113.161.42.99</code>.
								</p>
								<div className="bg-white/80 p-3 rounded-lg border border-rose-150/50 space-y-1.5">
									<span className="text-[10px] uppercase font-bold text-indigo-650 flex items-center gap-1 tracking-wider">
										<Sparkles className="w-3.5 h-3.5 fill-indigo-100" /> AI Đề xuất khắc phục:
									</span>
									<p className="text-[11px] text-slate-600 leading-relaxed">
										1. Hệ thống đã tự động **khóa tạm thời** phiên đăng nhập của tài khoản <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">nv_nhan@vcomm.vn</code>. <br />
										2. Yêu cầu Super Admin xác thực OTP qua số điện thoại đăng ký pháp nhân để khôi phục trạng thái. <br />
										3. Kích hoạt chính sách bảo mật bắt buộc cấu hình xác thực 2 yếu tố (2FA/MFA) cho toàn bộ tài khoản Admin.
									</p>
								</div>
							</div>
						</div>

						{/* Cảnh báo Rủi ro (Warning Alert) */}
						<div className="p-4 bg-amber-50 border border-amber-250 rounded-lg flex items-start gap-4 shadow-2xs">
							<div className="p-2 bg-amber-100 text-amber-700 rounded-lg shrink-0">
								<AlertCircle className="w-5 h-5" />
							</div>
							<div className="space-y-2 flex-1 min-w-0">
								<div className="flex items-center justify-between gap-2">
									<span className="text-xs font-bold text-amber-800 uppercase tracking-wider bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-250">
										Cảnh báo rủi ro (Warning)
									</span>
									<span className="text-[10px] text-amber-600 font-mono font-semibold">18:45 PM (Hôm qua)</span>
								</div>
								<p className="text-xs font-semibold text-slate-805 leading-relaxed">
									Tải xuống dữ liệu CRM dung lượng lớn: Tài khoản kế toán <code className="font-mono bg-white/70 px-1.5 py-0.5 rounded text-amber-700 border border-amber-100">acc_accountant@vcomm.vn</code> tải xuống danh sách 1,200 khách hàng VIP (CRM) từ địa chỉ IP nước ngoài <code className="font-mono text-slate-700">198.51.100.4</code> (Unknown Cloud Provider).
								</p>
								<div className="bg-white/80 p-3 rounded-lg border border-amber-150/50 space-y-1.5">
									<span className="text-[10px] uppercase font-bold text-indigo-650 flex items-center gap-1 tracking-wider">
										<Sparkles className="w-3.5 h-3.5 fill-indigo-100" /> AI Đề xuất khắc phục:
									</span>
									<p className="text-[11px] text-slate-600 leading-relaxed">
										1. Xác thực giao dịch tải tệp với nhân sự kế toán qua kênh liên lạc trực tiếp nội bộ. <br />
										2. Định cấu hình giới hạn số lượng khách hàng xuất CRM tối đa 100 dòng cho mỗi yêu cầu trên tài khoản không có cờ Super Admin.
									</p>
								</div>
							</div>
						</div>
					</div>
				)}
			</div>

{/* GIAI ĐOẠN 2: Lịch sử Giám sát Đăng nhập Admin (Admin Audit Logs Container) */}
			<div className="bg-white p-6 rounded-lg border border-slate-300 shadow-xs space-y-4">
				<div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
					<div>
						<h4 className="font-bold text-slate-900 flex items-center gap-2 text-base">
							<ShieldCheck className="w-5 h-5 text-emerald-600" /> Giám sát Truy cập Admin (Security Audit Logs)
						</h4>
						<p className="text-xs text-slate-500 mt-0.5">Lịch sử đăng nhập chi tiết của các tài khoản Quản trị thuộc phân vùng Doanh nghiệp (Zero-Trust isolation).</p>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-widest font-mono">
							Active Node: Singapore
						</span>
					</div>
				</div>

				{loadingAuditLogs ? (
					<div className="py-6 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
						<span className="w-5 h-5 rounded-full border-2 border-slate-300 border-t-emerald-600 animate-spin"></span>
						Đang truy xuất nhật ký truy cập...
					</div>
				) : adminAuditLogs.length === 0 ? (
					<div className="py-6 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs leading-relaxed">
						Chưa ghi nhận sự kiện truy cập hành động nào của tài khoản Admin tại tenant này.
					</div>
				) : (
					<div className="overflow-x-auto border border-slate-200 rounded-lg">
						<table className="w-full text-left text-xs border-collapse min-w-[700px]">
							<thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
								<tr>
									<th className="p-3">Thời gian</th>
									<th className="p-3">Email quản trị</th>
									<th className="p-3">Hành động</th>
									<th className="p-3">Trạng thái</th>
									<th className="p-3">Địa chỉ IP</th>
									<th className="p-3">Trình duyệt</th>
									<th className="p-3 text-right">Phân vùng ID</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{adminAuditLogs.map((log) => {
									const formattedDate = new Date(log.timestamp).toLocaleString('vi-VN', {
										hour: '2-digit',
										minute: '2-digit',
										second: '2-digit',
										day: '2-digit',
										month: '2-digit',
										year: 'numeric'
									});
									return (
										<tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
											<td className="p-3 font-mono text-slate-500 flex items-center gap-1.5">
												<Clock className="w-3.5 h-3.5 text-slate-400" /> {formattedDate}
											</td>
											<td className="p-3 font-semibold text-slate-800">{log.email}</td>
											<td className="p-3">
												<span className={cn(
													"px-2 py-0.5 rounded text-[10px] font-bold border",
													log.action?.includes('Failed') 
														? "bg-rose-50 text-rose-700 border-rose-150" 
														: log.action === 'Logout' 
															? "bg-slate-50 text-slate-700 border-slate-200" 
															: "bg-emerald-50 text-emerald-700 border-emerald-150"
												)}>
													{log.action}
												</span>
											</td>
											<td className="p-3 font-bold">
												<span className={log.status === 'Success' ? 'text-emerald-600' : 'text-rose-600'}>
													● {log.status}
												</span>
											</td>
											<td className="p-3 font-mono text-slate-600">{log.ipAddress || '127.0.0.1'}</td>
											<td className="p-3 text-slate-500 truncate max-w-[120px]" title={log.userAgent}>{log.browser || 'Unknown'}</td>
											<td className="p-3 text-right font-mono font-bold text-slate-400">{log.tenantId}</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	)}



	{activeTab === 'ipos_licenses' && (
		<IPosLicensesPanel />
	)}

	{activeTab === 'chart_of_accounts' && (
		<div className="animate-in fade-in duration-300 space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-4">
					<div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
						<div>
							<h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
								<FileText className="w-5 h-5 text-indigo-600" /> Danh mục Hệ thống Tài khoản (Chart of Accounts)
							</h3>
							<p className="text-xs text-slate-555 mt-0.5 font-medium">Quản lý danh sách tài khoản kế toán cấp chi tiết dùng để định khoản các giao dịch.</p>
						</div>
						<div className="flex items-center gap-2 shrink-0">
							<button 
								type="button"
								onClick={() => {
									alert('Excel Template: Tải xuống file excel mẫu COA_Schema_Template.xlsx thành công.');
								}}
								className="px-3 py-2 bg-slate-50 hover:bg-slate-105 text-slate-705 text-xs font-bold rounded-lg border border-slate-250 flex items-center gap-1.5 cursor-pointer transition border-0"
							>
								<Download className="w-3.5 h-3.5" />
								<span>File mẫu</span>
							</button>
							<button 
								type="button"
								onClick={() => {
									const newAcc: AccountItem = { code: '11212', name: 'Tiền gửi Ngân hàng Vietcombank', type: 'Asset', parentCode: '112', isLeaf: true, isActive: true };
									if (coaList.some(c => c.code === newAcc.code)) {
										addNotification('Import COA', 'Hệ thống đã nhận diện COA trùng khớp. Không thêm bản ghi trùng.');
									} else {
										setCoaList(prev => [...prev, newAcc]);
										addNotification('Import COA', 'Nhập thành công tài khoản chi tiết 11212 từ Excel template!');
									}
								}}
								className="px-3 py-2 bg-slate-50 hover:bg-slate-105 text-slate-705 text-xs font-bold rounded-lg border border-slate-250 flex items-center gap-1.5 cursor-pointer transition border-0"
							>
								<Upload className="w-3.5 h-3.5" />
								<span>Import Excel</span>
							</button>
							<button 
								type="button"
								onClick={() => {
									const json = JSON.stringify(coaList, null, 2);
									const blob = new Blob([json], { type: 'application/json' });
									const url = URL.createObjectURL(blob);
									const a = document.createElement('a');
									a.href = url;
									a.download = `VCOMM_COA_EXPORT_${new Date().toISOString().slice(0,10)}.json`;
									a.click();
									addNotification('Export COA', 'Xuất danh mục tài khoản thành công!');
								}}
								className="px-3 py-2 bg-slate-50 hover:bg-slate-105 text-slate-705 text-xs font-bold rounded-lg border border-slate-250 flex items-center gap-1.5 cursor-pointer transition border-0"
							>
								<Download className="w-3.5 h-3.5" />
								<span>Export</span>
							</button>
						</div>
					</div>

					<div className="overflow-x-auto border border-slate-200 rounded-lg">
						<table className="w-full text-left text-xs border-collapse min-w-[600px]">
							<thead className="bg-slate-50 text-slate-650 font-bold border-b border-slate-200">
								<tr>
									<th className="p-3">Số hiệu tài khoản</th>
									<th className="p-3">Tên tài khoản</th>
									<th className="p-3">Tính chất</th>
									<th className="p-3">Cấp bậc</th>
									<th className="p-3">Hạch toán</th>
									<th className="p-3">Trạng thái</th>
									<th className="p-3 text-right">Thao tác</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{coaList.map((account) => (
									<tr key={account.code} className="hover:bg-slate-50/50 transition-colors">
										<td className="p-3 font-mono font-bold text-slate-800">{account.code}</td>
										<td className="p-3 text-slate-705 font-semibold">{account.name}</td>
										<td className="p-3">
											<span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
												account.type === 'Asset' ? 'bg-blue-50 text-blue-700 border-blue-150' :
												account.type === 'Liability' ? 'bg-amber-50 text-amber-705 border-amber-150' :
												account.type === 'Equity' ? 'bg-purple-50 text-purple-700 border-purple-150' :
												account.type === 'Revenue' ? 'bg-emerald-50 text-emerald-700 border-emerald-150' :
												'bg-rose-50 text-rose-700 border-rose-150'
											}`}>
												{account.type === 'Asset' ? 'Tài sản' :
												 account.type === 'Liability' ? 'Nợ phải trả' :
												 account.type === 'Equity' ? 'Vốn chủ sở hữu' :
												 account.type === 'Revenue' ? 'Doanh thu' : 'Chi phí'}
											</span>
										</td>
										<td className="p-3 text-slate-550">{account.parentCode ? `Tài khoản con (${account.parentCode})` : 'Tài khoản tổng hợp'}</td>
										<td className="p-3">
											{account.isLeaf ? (
												<span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold rounded">
													Cấp tài khoản lá
												</span>
											) : (
												<span className="px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold rounded">
													Tài khoản tổng hợp
												</span>
											)}
										</td>
										<td className="p-3">
											<span className={`font-bold ${account.isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
												{account.isActive ? '● Đang hoạt động' : '○ Tạm dừng'}
											</span>
										</td>
										<td className="p-3 text-right">
											<button 
												type="button"
												onClick={() => {
													setCoaList(prev => prev.map(c => c.code === account.code ? { ...c, isActive: !c.isActive } : c));
													addNotification('Tài khoản', `Đã đổi trạng thái tài khoản ${account.code}`);
												}}
												className="text-xs text-blue-600 font-bold hover:underline cursor-pointer border-0 bg-transparent"
											>
												{account.isActive ? 'Khóa' : 'Kích hoạt'}
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				<div className="space-y-6">
					{/* Card thêm mới tài khoản */}
					<div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-4">
						<div>
							<h4 className="font-bold text-slate-900 flex items-center gap-2">
								<Plus className="w-5 h-5 text-indigo-650" /> Thêm tài khoản mới
							</h4>
							<p className="text-xs text-slate-500 mt-0.5">Thêm mới tài khoản cấp lá để hạch toán nghiệp vụ.</p>
						</div>

						{coaError && (
							<div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 leading-relaxed font-semibold">
								⚠️ {coaError}
							</div>
						)}

						<div className="space-y-3">
							<div className="space-y-1">
								<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mã tài khoản *</label>
								<input 
									type="text" 
									value={newCoa.code} 
									onChange={e => setNewCoa(prev => ({ ...prev, code: e.target.value }))}
									placeholder="Ví dụ: 11211, 11115"
									className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên tài khoản *</label>
								<input 
									type="text" 
									value={newCoa.name} 
									onChange={e => setNewCoa(prev => ({ ...prev, name: e.target.value }))}
									placeholder="Ví dụ: Tiền VNĐ tại Techcombank"
									className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
								/>
							</div>

							<div className="grid grid-cols-2 gap-2">
								<div className="space-y-1">
									<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tính chất</label>
									<select 
										value={newCoa.type} 
										onChange={e => setNewCoa(prev => ({ ...prev, type: e.target.value as any }))}
										className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-bold"
									>
										<option value="Asset">Tài sản</option>
										<option value="Liability">Nợ phải trả</option>
										<option value="Equity">Vốn chủ sở hữu</option>
										<option value="Revenue">Doanh thu</option>
										<option value="Expense">Chi phí</option>
									</select>
								</div>
								<div className="space-y-1">
									<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tài khoản mẹ</label>
									<select 
										value={newCoa.parentCode || ''} 
										onChange={e => setNewCoa(prev => ({ ...prev, parentCode: e.target.value }))}
										className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
									>
										<option value="">Không có</option>
										{coaList.filter(c => !c.parentCode).map(c => (
											<option key={c.code} value={c.code}>{c.code} - {c.name}</option>
										))}
									</select>
								</div>
							</div>

							<button 
								type="button"
								onClick={handleCreateCoa}
								className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition cursor-pointer border-0"
							>
								Lưu tài khoản
							</button>
						</div>
					</div>

					{/* Card ánh xạ tài khoản thuế */}
					<div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-4">
						<div>
							<h4 className="font-bold text-slate-900 flex items-center gap-2">
								<Settings className="w-5 h-5 text-indigo-650" /> Ánh xạ tài khoản thuế
							</h4>
							<p className="text-xs text-slate-500 mt-0.5 font-medium">Mặc định tài khoản định khoản thuế đầu vào/đầu ra.</p>
						</div>

						<div className="space-y-3">
							<div className="space-y-1">
								<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thuế GTGT đầu vào được khấu trừ</label>
								<select 
									value={taxMappings.inputTaxAccount} 
									onChange={e => setTaxMappings(prev => ({ ...prev, inputTaxAccount: e.target.value }))}
									className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
								>
									{coaList.filter(c => c.isLeaf && c.code.startsWith('133')).map(c => (
										<option key={c.code} value={c.code}>{c.code} - {c.name}</option>
									))}
								</select>
							</div>

							<div className="space-y-1">
								<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Thuế GTGT đầu ra phải nộp (Bán hàng)</label>
								<select 
									value={taxMappings.outputTaxAccount} 
									onChange={e => setTaxMappings(prev => ({ ...prev, outputTaxAccount: e.target.value }))}
									className="w-full p-2.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
								>
									{coaList.filter(c => c.isLeaf && c.code.startsWith('333')).map(c => (
										<option key={c.code} value={c.code}>{c.code} - {c.name}</option>
									))}
								</select>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)}

	{activeTab === 'workflow_rules' && (
		<div className="animate-in fade-in duration-300 space-y-6">
			<div className="bg-white p-6 rounded-lg border border-slate-300 shadow-sm space-y-6">
				<div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-4">
					<div>
						<h3 className="font-bold text-slate-900 flex items-center gap-2 text-base">
							<Zap className="w-5 h-5 text-amber-500 fill-amber-100" /> Quy trình Tự động hóa Không mã (No-Code Workflows)
						</h3>
						<p className="text-xs text-slate-555 mt-0.5 font-medium">Thiết lập các logic hành động tự động IF-AND-THEN để gửi tin nhắn Zalo/SMS hoặc hạch toán kế toán.</p>
					</div>
					<button 
						type="button"
						onClick={() => setShowAddWorkflowModal(true)}
						className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs transition border-0 animate-in fade-in"
					>
						<Plus className="w-4 h-4" />
						<span>Tạo quy trình mới</span>
					</button>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{workflowRules.map((rule) => (
						<div key={rule.id} className={`p-5 rounded-lg border transition-all duration-300 flex flex-col justify-between min-h-[200px] ${
							rule.isActive ? 'bg-white border-slate-300 shadow-xs' : 'bg-slate-50/50 border-slate-200 opacity-70'
						}`}>
							<div className="space-y-4">
								<div className="flex justify-between items-start gap-2">
									<h4 className="font-bold text-slate-900 text-xs leading-snug">{rule.name}</h4>
									<button 
										type="button"
										onClick={() => {
											setWorkflowRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r));
											addNotification('Quy trình', `Đã ${rule.isActive ? 'tạm dừng' : 'kích hoạt'} quy trình "${rule.name}"`);
										}}
										className={`w-9 h-5 rounded-full p-0.5 transition duration-200 cursor-pointer shrink-0 border-0 ${rule.isActive ? 'bg-emerald-500' : 'bg-slate-200'}`}
									>
										<div className={`w-4 h-4 bg-white rounded-full transition-transform duration-200 ${rule.isActive ? 'translate-x-4' : 'translate-x-0'}`}></div>
									</button>
								</div>

								<div className="space-y-1.5 font-mono text-[10.5px]">
									<div className="flex items-center gap-1.5">
										<span className="bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded border border-blue-200">IF</span>
										<span className="text-slate-700 truncate font-semibold">{
											rule.trigger === 'order_created' ? 'Đơn hàng mới tạo' :
											rule.trigger === 'stock_low' ? 'Sản phẩm hết hàng' :
											'Hóa đơn quyết toán tạm ứng'
										}</span>
									</div>
									<div className="flex items-center gap-1.5">
										<span className="bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-250">AND</span>
										<span className="text-slate-700 truncate font-semibold">{
											rule.condition === 'total_amount > 20000000' ? 'Giá trị > 20,000,000đ' :
											rule.condition === 'inventory_qty < 10' ? 'Số lượng tồn kho < 10' :
											'Thiếu mã số thuế đối tượng lẻ'
										}</span>
									</div>
									<div className="flex items-center gap-1.5">
										<span className="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded border border-emerald-250">THEN</span>
										<span className="text-slate-700 truncate font-semibold">{
											rule.action === 'send_zalo_zns' ? 'Gửi Zalo ZNS KH' :
											rule.action === 'send_push_admin' ? 'Bắn Push cho Admin' :
											'Chặn hạch toán đối tượng lẻ'
										}</span>
									</div>
								</div>
							</div>

							<div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-4">
								<span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
									Quy trình {rule.isActive ? 'Đang chạy' : 'Đang Tắt'}
								</span>
								<button 
									type="button"
									onClick={() => {
										setWorkflowRules(prev => prev.filter(r => r.id !== rule.id));
										addNotification('Quy trình', `Đã xóa quy trình "${rule.name}"`);
									}}
									className="text-[10px] text-red-500 font-bold hover:underline cursor-pointer border-0 bg-transparent"
								>
									Xóa
								</button>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Modal thêm Workflow Rule */}
			{showAddWorkflowModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
					<div className="bg-white w-full max-w-md rounded-lg shadow-sm border border-slate-300 overflow-hidden animate-in zoom-in-95 duration-200">
						<div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50/50">
							<div className="flex items-center gap-3">
								<Zap className="w-5 h-5 text-amber-500 fill-amber-100" />
								<h3 className="text-sm font-extrabold text-slate-950">Tạo quy trình tự động mới</h3>
							</div>
							<button type="button" onClick={() => setShowAddWorkflowModal(false)} className="p-2 hover:bg-slate-100 rounded-full cursor-pointer border-0 bg-transparent">
								<X className="w-4 h-4 text-slate-500" />
							</button>
						</div>

						<div className="p-6 space-y-4">
							<div className="space-y-1">
								<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tên quy trình</label>
								<input 
									type="text" 
									value={newWorkflow.name} 
									onChange={e => setNewWorkflow(prev => ({ ...prev, name: e.target.value }))}
									placeholder="Ví dụ: Gửi SMS khi sản phẩm hết hàng"
									className="w-full p-2.5 border border-slate-250 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20"
								/>
							</div>

							<div className="space-y-1">
								<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">IF (Sự kiện kích hoạt)</label>
								<select 
									value={newWorkflow.trigger} 
									onChange={e => setNewWorkflow(prev => ({ ...prev, trigger: e.target.value }))}
									className="w-full p-2.5 border border-slate-250 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20"
								>
									<option value="order_created">Đơn hàng mới tạo (Order Created)</option>
									<option value="stock_low">Sản phẩm hết hàng (Stock Low)</option>
									<option value="invoice_draft">Hóa đơn quyết toán tạm ứng (Invoice Draft)</option>
								</select>
							</div>

							<div className="space-y-1">
								<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">AND (Bộ lọc điều kiện)</label>
								<select 
									value={newWorkflow.condition} 
									onChange={e => setNewWorkflow(prev => ({ ...prev, condition: e.target.value }))}
									className="w-full p-2.5 border border-slate-250 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20"
								>
									<option value="total_amount > 20000000">Giá trị đơn hàng &gt; 20,000,000đ</option>
									<option value="inventory_qty < 10">Số lượng tồn kho dưới &lt; 10 sản phẩm</option>
									<option value="tax_code_missing = true">Thiếu mã số thuế đối tượng lẻ</option>
								</select>
							</div>

							<div className="space-y-1">
								<label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">THEN (Hành động phản hồi)</label>
								<select 
									value={newWorkflow.action} 
									onChange={e => setNewWorkflow(prev => ({ ...prev, action: e.target.value }))}
									className="w-full p-2.5 border border-slate-250 rounded-lg text-xs bg-white focus:ring-2 focus:ring-blue-500/20"
								>
									<option value="send_zalo_zns">Gửi tin Zalo ZNS cho Khách hàng</option>
									<option value="send_push_admin">Gửi thông báo Push đến Admin</option>
									<option value="block_bookkeeping">Chặn hạch toán tự động</option>
								</select>
							</div>
						</div>

						<div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end gap-2">
							<button 
								type="button"
								onClick={() => setShowAddWorkflowModal(false)}
								className="px-4 py-2 border border-slate-300 text-slate-700 bg-white text-xs font-bold rounded-lg hover:bg-slate-100 cursor-pointer border-0"
							>
								Hủy
							</button>
							<button 
								type="button"
								onClick={handleCreateWorkflow}
								disabled={!newWorkflow.name}
								className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg cursor-pointer border-0 animate-in fade-in"
							>
								Lưu Quy trình
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)}
  </div>
  </div>
  </div>

  {showAddJobTitleModal && (
    <Modal
      isOpen={showAddJobTitleModal}
      onClose={() => { setShowAddJobTitleModal(false); setEditingJobTitle(null); }}
      title={editingJobTitle ? 'Chỉnh sửa Chức danh' : 'Thêm Chức danh mới'}
      maxWidth="lg"
      onConfirm={handleSaveJobTitle}
      confirmText="Lưu Chức danh"
      confirmDisabled={!newJobTitle.name || !newJobTitle.department}
      confirmButtonClass="bg-blue-600 hover:bg-slate-800 text-white"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">Tên chức danh <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            value={newJobTitle.name || ''} 
            onChange={e => setNewJobTitle({...newJobTitle, name: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-sm"
            placeholder="VD: Trưởng phòng Marketing"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-800 mb-1">Phòng ban <span className="text-red-500">*</span></label>
          <select 
            value={newJobTitle.department || ''} 
            onChange={e => setNewJobTitle({...newJobTitle, department: e.target.value})}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-sm"
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
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-sm"
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
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600/20 text-sm min-h-[100px]"
            placeholder="Mô tả ngắn gọn chức năng, nhiệm vụ..."
          />
        </div>
      </div>
    </Modal>
  )}

  {/* Fee Management Modal */}
  {showFeeModal && (
    <Modal
      title={editingFee ? 'Chỉnh sửa loại phí' : 'Thêm loại phí mới'}
      icon={<BadgeDollarSign className="w-5 h-5 text-blue-600" />}
      isOpen={showFeeModal}
      maxWidth="lg"
      onClose={() => setShowFeeModal(false)}
      onConfirm={() => {
        if (editingFee) {
          setSystemFees(systemFees.map(f => f.id === editingFee.id ? { ...newFee as SystemFee, id: f.id } : f));
          logAction('Settings.Fees', 'UPDATE', `Cập nhật loại phí: ${newFee.name}`);
        } else {
          setSystemFees([...systemFees, { ...newFee as SystemFee, id: `sys-${Date.now()}`, isActive: true }]);
          logAction('Settings.Fees', 'CREATE', `Thêm mới loại phí: ${newFee.name}`);
        }
        setShowFeeModal(false);
        addNotification('Đã cập nhật cấu hình', `Loại phí ${newFee.name} đã được lưu thành công.`);
      }}
      confirmText={editingFee ? 'Cập nhật' : 'Xác nhận Thêm'}
    >
      <div className="space-y-6">
        {/* Fee Name */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tên loại phí</label>
          <input 
            type="text" 
            value={newFee.name || ''}
            onChange={(e) => setNewFee({ ...newFee, name: e.target.value })}
            placeholder="VD: Phí vận hành kho, Phí thanh toán..."
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:border-slate-900 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">Loại phí</label>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button 
                onClick={() => setNewFee({ ...newFee, type: 'percentage' })}
                className={cn("flex-1 py-2 text-xs font-bold rounded-md transition-all", newFee.type === 'percentage' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
              >
                Phần trăm (%)
              </button>
              <button 
                onClick={() => setNewFee({ ...newFee, type: 'fixed' })}
                className={cn("flex-1 py-2 text-xs font-bold rounded-md transition-all", newFee.type === 'fixed' ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800")}
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
                className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-4 pr-10 py-2.5 text-sm font-bold focus:border-slate-900 outline-none"
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
                    "flex-1 p-3 rounded-lg border-2 cursor-pointer transition-all flex items-center gap-3",
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
                    let next;
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
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:border-slate-900 outline-none resize-none"
          />
        </div>
      </div>
    </Modal>
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


// ==========================================================
// IPOS LICENSE MANAGEMENT PANEL COMPONENT
// ==========================================================
function IPosLicensesPanel() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any | null>(null);

  // iPOS Cashier Accounts States
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Modal Form States
  const [formStoreName, setFormStoreName] = useState('');
  const [formLicenseType, setFormLicenseType] = useState('SaaS Premium');
  const [formCustomDomain, setFormCustomDomain] = useState('');
  const [formApiToken, setFormApiToken] = useState('');
  const [formMaxRegisters, setFormMaxRegisters] = useState(5);
  const [formExpiresAt, setFormExpiresAt] = useState('2027-12-31');
  const [formStatus, setFormStatus] = useState('Hoạt động');

  useEffect(() => {
    fetchLicenses();
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const response = await fetch('/api/ipos/accounts');
      const data = await response.json();
      if (data.status === 'success') {
        setAccounts(data.accounts);
      }
    } catch (e) {
      console.error('Failed to load iPOS accounts:', e);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleApproveAccount = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn phê duyệt tài khoản thu ngân này?')) return;
    try {
      const response = await fetch('/api/ipos/accounts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('Đã phê duyệt tài khoản thành công!');
        fetchAccounts();
      } else {
        alert(data.message || 'Phê duyệt thất bại.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ.');
    }
  };

  const handleRejectAccount = async (userId: string) => {
    if (!confirm('Bạn có chắc chắn muốn từ chối tài khoản này?')) return;
    try {
      const response = await fetch('/api/ipos/accounts/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      const data = await response.json();
      if (data.status === 'success') {
        alert('Đã từ chối tài khoản!');
        fetchAccounts();
      } else {
        alert(data.message || 'Từ chối thất bại.');
      }
    } catch (e) {
      console.error(e);
      alert('Lỗi kết nối máy chủ.');
    }
  };

  const fetchLicenses = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ipos/licenses');
      const data = await response.json();
      if (data.status === 'success') {
        setLicenses(data.licenses);
      }
    } catch (e) {
      console.error('Failed to load licenses:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingLicense(null);
    setFormStoreName('');
    setFormLicenseType('SaaS Premium');
    setFormCustomDomain('');
    setFormApiToken(generateToken());
    setFormMaxRegisters(5);
    setFormExpiresAt('2027-12-31');
    setFormStatus('Hoạt động');
    setShowModal(true);
  };

  const handleOpenEditModal = (lic: any) => {
    setEditingLicense(lic);
    setFormStoreName(lic.storeName);
    setFormLicenseType(lic.licenseType);
    setFormCustomDomain(lic.customDomain || '');
    setFormApiToken(lic.apiToken);
    setFormMaxRegisters(lic.maxRegisters || 5);
    setFormExpiresAt(lic.expiresAt.substring(0, 10));
    setFormStatus(lic.statusLabel);
    setShowModal(true);
  };

  const generateToken = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let rand = '';
    for (let i = 0; i < 16; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
    return `vcomm_live_ipos_key_${rand}`;
  };

  const handleSaveLicense = async () => {
    if (!formStoreName.trim() || !formApiToken.trim()) {
      alert('Vui lòng nhập tên chi nhánh và khóa Token.');
      return;
    }

    let updatedLicenses = [...licenses];
    const newExpiresAt = formExpiresAt.includes(' ') ? formExpiresAt : `${formExpiresAt} 23:59:59`;

    if (editingLicense) {
      updatedLicenses = updatedLicenses.map(l => {
        if (l.id === editingLicense.id) {
          return {
            ...l,
            storeName: formStoreName,
            licenseType: formLicenseType,
            customDomain: formCustomDomain,
            apiToken: formApiToken,
            maxRegisters: Number(formMaxRegisters),
            expiresAt: newExpiresAt,
            statusLabel: formStatus
          };
        }
        return l;
      });
    } else {
      const newLicense = {
        id: `LIC-${Math.floor(1000 + Math.random() * 9000)}`,
        storeId: `ST-${Math.floor(10 + Math.random() * 89)}`,
        storeName: formStoreName,
        licenseType: formLicenseType,
        customDomain: formCustomDomain,
        apiToken: formApiToken,
        maxRegisters: Number(formMaxRegisters),
        expiresAt: newExpiresAt,
        statusLabel: formStatus
      };
      updatedLicenses.push(newLicense);
    }

    try {
      const response = await fetch('/api/ipos/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenses: updatedLicenses })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setLicenses(updatedLicenses);
        setShowModal(false);
      } else {
        alert('Lưu bản quyền thất bại.');
      }
    } catch (e) {
      console.error('Failed to save license:', e);
      alert('Đã xảy ra lỗi khi kết nối máy chủ.');
    }
  };

  const handleDeleteLicense = async (licId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bản quyền này? Kết nối từ cửa hàng này sẽ bị cắt.')) {
      return;
    }

    const updatedLicenses = licenses.filter(l => l.id !== licId);
    try {
      const response = await fetch('/api/ipos/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenses: updatedLicenses })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setLicenses(updatedLicenses);
      }
    } catch (e) {
      console.error('Failed to delete license:', e);
    }
  };

  const filteredLicenses = licenses.filter(l => 
    l.storeName.toLowerCase().includes(search.toLowerCase()) ||
    (l.customDomain || '').toLowerCase().includes(search.toLowerCase()) ||
    l.apiToken.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-350 space-y-6">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-300 rounded-lg p-6 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <Tablet className="w-5 h-5 text-blue-600" />
            Danh sách Bản quyền & Chi nhánh iPOS
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Cấp phép sử dụng cho từng chi nhánh, cấu hình tên miền riêng và cấp khoá API Token xác thực.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-2 transition-all shrink-0 cursor-pointer border-0"
        >
          <Plus className="w-4 h-4" /> Cấp bản quyền mới
        </button>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Tìm theo tên chi nhánh, tên miền hoặc token..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-slate-300 focus:border-blue-500 rounded-lg outline-none transition-all placeholder:text-slate-400 bg-white"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
          <button
            onClick={fetchLicenses}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-all cursor-pointer bg-white"
            title="Làm mới"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* License Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-bold">Đang tải dữ liệu...</span>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm font-bold">Không tìm thấy bản quyền nào</p>
              <p className="text-xs mt-1">Vui lòng bấm nút cấp bản quyền mới ở trên để bắt đầu.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-[80px]">Mã ID</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Chi nhánh / Cửa hàng</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Gói SaaS</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Tên miền riêng</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Khóa API Token</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Hạn sử dụng</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-[100px]">Trạng thái</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-[120px] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredLicenses.map((lic) => (
                  <tr key={lic.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4 text-xs font-mono font-bold text-slate-600">{lic.id}</td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-slate-800">{lic.storeName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Mã: {lic.storeId}</p>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                        lic.licenseType === 'SaaS Premium' 
                          ? "bg-blue-50 border-blue-200 text-blue-700" 
                          : "bg-slate-50 border-slate-200 text-slate-700"
                      )}>
                        {lic.licenseType}
                      </span>
                    </td>
                    <td className="p-4">
                      {lic.customDomain ? (
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                          <Link2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {lic.customDomain}
                        </span>
                      ) : (
                        <span className="text-xs italic text-slate-400">Mặc định</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 max-w-[150px]">
                        <code className="text-xs text-slate-600 font-mono truncate" title={lic.apiToken}>{lic.apiToken}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(lic.apiToken);
                            alert('Đã sao chép token thành công!');
                          }}
                          className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent"
                          title="Sao chép"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-xs font-semibold text-slate-700">{lic.expiresAt.substring(0, 10)}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Máy POS: Max {lic.maxRegisters || 5}</p>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block text-center",
                        lic.statusLabel === 'Hoạt động' 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : lic.statusLabel === 'Tạm dừng'
                            ? "bg-amber-50 text-amber-700 border border-amber-100"
                            : "bg-rose-50 text-rose-700 border border-rose-100"
                      )}>
                        {lic.statusLabel}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(lic)}
                        className="p-1.5 hover:bg-blue-50 text-slate-500 hover:text-blue-600 rounded-lg transition-all cursor-pointer border-0 bg-transparent"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLicense(lic.id)}
                        className="p-1.5 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-lg transition-all cursor-pointer border-0 bg-transparent"
                        title="Xóa bản quyền"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* iPOS Accounts Approvals Section */}
      <div className="bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden mt-6">
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <Users className="w-5 h-5 text-blue-600" />
            Danh sách Đăng ký Tài khoản iPOS Chờ duyệt
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Phê duyệt nhân viên thu ngân hoặc quản lý cửa hàng đăng ký trực tiếp trên ứng dụng iPOS vệ tinh.
          </p>
        </div>

        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-600">Tài khoản trên hệ thống</span>
          <button
            onClick={fetchAccounts}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-all cursor-pointer bg-white"
            title="Làm mới tài khoản"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          {loadingAccounts ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-bold">Đang tải tài khoản...</span>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm font-bold">Không có tài khoản đăng ký nào</p>
              <p className="text-xs mt-1">Các yêu cầu đăng ký mới từ quầy iPOS sẽ xuất hiện ở đây.</p>
            </div>
          ) : (
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Họ tên / Email</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Số điện thoại</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Cửa hàng đăng ký</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Vai trò</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500">Ngày đăng ký</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-[120px]">Trạng thái</th>
                  <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-[180px] text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((acc) => (
                  <tr key={acc.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="p-4">
                      <p className="text-xs font-bold text-slate-800">{acc.fullName}</p>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5">{acc.email}</p>
                    </td>
                    <td className="p-4 text-xs font-semibold text-slate-700">{acc.phone || 'N/A'}</td>
                    <td className="p-4">
                      <p className="text-xs font-bold text-slate-800">{acc.storeName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{acc.storeAddress}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 bg-slate-50 text-slate-700 capitalize">
                        {acc.role === 'manager' ? 'Quản lý' : 'Thu ngân'}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-slate-600 font-medium">
                      {acc.registeredAt ? new Date(acc.registeredAt).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full inline-block text-center",
                        acc.status === 'approved' 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                          : acc.status === 'rejected'
                            ? "bg-rose-50 text-rose-700 border border-rose-100"
                            : "bg-amber-50 text-amber-700 border border-amber-100"
                      )}>
                        {acc.status === 'approved' ? 'Đã phê duyệt' : acc.status === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                      </span>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-1.5">
                      {acc.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={() => handleApproveAccount(acc.id)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all cursor-pointer border-0"
                          >
                            Phê duyệt
                          </button>
                          <button
                            onClick={() => handleRejectAccount(acc.id)}
                            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all cursor-pointer border-0"
                          >
                            Từ chối
                          </button>
                        </>
                      )}
                      {acc.status !== 'pending_approval' && (
                        <span className="text-[10px] text-slate-400 italic font-medium">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit License Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[9999] animate-in fade-in duration-200 p-4">
          <div className="bg-white border border-slate-300 rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Tablet className="w-5 h-5 text-blue-600" />
                {editingLicense ? 'Chỉnh sửa Bản quyền iPOS' : 'Cấp Bản quyền iPOS Mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 cursor-pointer border-0 bg-transparent"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {/* Store Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Tên Chi nhánh / Cửa hàng</label>
                <input
                  type="text"
                  value={formStoreName}
                  onChange={(e) => setFormStoreName(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg outline-none"
                  placeholder="Ví dụ: VComm Retail - Chi nhánh Hà Nội"
                />
              </div>

              {/* License Type */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Gói Dịch vụ SaaS</label>
                <select
                  value={formLicenseType}
                  onChange={(e) => setFormLicenseType(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg outline-none bg-white"
                >
                  <option value="SaaS Standard">SaaS Standard (Giới hạn máy)</option>
                  <option value="SaaS Premium">SaaS Premium (Đầy đủ tính năng)</option>
                </select>
              </div>

              {/* Custom Domain */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Tên miền riêng (Custom Domain)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formCustomDomain}
                    onChange={(e) => setFormCustomDomain(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 pl-8 pr-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg outline-none"
                    placeholder="Ví dụ: pos.hanoi.brand.vn"
                  />
                  <Globe className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Để trống nếu muốn sử dụng tên miền mặc định của hệ thống.</p>
              </div>

              {/* API Token Key */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Khóa OpenAPI Token</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={formApiToken}
                      onChange={(e) => setFormApiToken(e.target.value)}
                      className="w-full text-xs text-slate-800 font-mono pl-8 pr-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg outline-none"
                      placeholder="vcomm_live_ipos_key_..."
                    />
                    <Key className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <button
                    onClick={() => setFormApiToken(generateToken())}
                    className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer bg-white"
                  >
                    Tạo khóa
                  </button>
                </div>
              </div>

              {/* Max registers & Expiry Date row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Số máy POS tối đa</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formMaxRegisters}
                    onChange={(e) => setFormMaxRegisters(Number(e.target.value))}
                    className="w-full text-xs font-semibold text-slate-800 px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Hết hạn vào ngày</label>
                  <input
                    type="date"
                    value={formExpiresAt}
                    onChange={(e) => setFormExpiresAt(e.target.value)}
                    className="w-full text-xs font-semibold text-slate-800 px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg outline-none bg-white"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-700 block">Trạng thái Bản quyền</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-800 px-3 py-2 border border-slate-300 focus:border-blue-500 rounded-lg outline-none bg-white"
                >
                  <option value="Hoạt động">Hoạt động (Active)</option>
                  <option value="Tạm dừng">Tạm dừng (Suspended)</option>
                  <option value="Hết hạn">Hết hạn (Expired)</option>
                </select>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer bg-white"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveLicense}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer border-0"
              >
                Lưu lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

