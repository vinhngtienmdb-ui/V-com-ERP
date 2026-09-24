import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Folders, 
  Users, 
  BarChart3, 
  Mail, 
  ShieldAlert, 
  Settings as SettingsIcon, 
  Clock, 
  Trash2, 
  ChevronRight, 
  Edit3, 
  Copy, 
  Check, 
  Plus, 
  Search, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Smartphone, 
  CheckCircle2, 
  XCircle, 
  Save, 
  AlertTriangle,
  Building,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Server,
  Key,
  Sliders,
  Truck,
  CreditCard,
  Receipt,
  Warehouse,
  Percent,
  Utensils,
  Headphones,
  DollarSign,
  Globe,
  Package,
  Calendar,
  Maximize2,
  Minimize2,
  Activity,
  Cpu,
  Database,
  HardDrive,
  Wifi
} from 'lucide-react';
import { cn } from '../lib/utils';
import { safeLocalStorage } from '../lib/storage';

interface CompanyInfo {
  fullName: string;
  shortName: string;
  businessType: string;
  taxCode: string;
  companyCode: string;
  foundedDate: string;
  licenseNumber: string;
  licenseDate: string;
  licensePlace: string;
  legalRepresentative: string;
  legalTitle: string;
  address: string;
  phone: string;
  fax: string;
  email: string;
  website: string;
  operatingModel: 'company' | 'conglomerate';
}

interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  branch: string;
  status: 'active' | 'locked';
  lastLogin: string;
}

interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  userCount: number;
  isSystem?: boolean;
}

export function SystemAdministration() {
  const navigate = useNavigate();

  // Full-width workspace mode toggle
  const [isFullWidthWorkspace, setIsFullWidthWorkspace] = useState(false);

  // Active Main Tab on Left Sidebar
  const [activeTab, setActiveTab] = useState<
    'company' | 'categories' | 'rbac' | 'usage' | 'mail' | 'security' | 'general' | 'modules' | 'audit' | 'trash' | 'system_health'
  >('company');

  // RBAC Sub-tabs
  const [rbacSubTab, setRbacSubTab] = useState<'users' | 'roles' | 'matrix' | 'branches'>('users');

  // Modules Sub-tabs
  const [moduleSubTab, setModuleSubTab] = useState<
    'orders' | 'finance' | 'invoices' | 'warehouse' | 'promotions' | 'fnb' | 'hr' | 'cskh'
  >('orders');

  // Copied & Save states
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveGeneralSuccess, setSaveGeneralSuccess] = useState(false);
  const [saveModuleSuccess, setSaveModuleSuccess] = useState(false);

  // Company Information matching user request: Công ty CP Thương mại điện tử VComm
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = safeLocalStorage.getItem('vcomm_company_profile');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (!parsed.fullName.includes('LUCKY SHOPPING')) {
          return parsed;
        }
      } catch (e) { /* fallback */ }
    }
    return {
      fullName: 'CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐIỆN TỬ VCOMM',
      shortName: 'Công ty CP Thương mại điện tử VComm',
      businessType: 'Doanh nghiệp Cổ phần',
      taxCode: '0318914439',
      companyCode: 'vcomm_corp',
      foundedDate: '15/08/2023',
      licenseNumber: '0318914439',
      licenseDate: '15/08/2023',
      licensePlace: 'Sở Kế hoạch và Đầu tư TP. Hồ Chí Minh',
      legalRepresentative: 'Nguyễn Tiến Vĩnh',
      legalTitle: 'Tổng Giám đốc',
      address: 'Tòa nhà VComm Tower, 2 Hải Triều - Phường Bến Nghé - Quận 1 - TP. Hồ Chí Minh',
      phone: '0988795908',
      fax: '-',
      email: 'contact@vcomm.vn',
      website: 'https://vcomm.vn',
      operatingModel: 'company',
    };
  });

  // Global General Settings State
  const [generalSettings, setGeneralSettings] = useState(() => {
    const saved = safeLocalStorage.getItem('vcomm_general_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      systemName: 'VComm ERP',
      ecommerceName: 'VComm Commerce',
      slogan: 'Nền tảng Quản trị Doanh nghiệp & Thương mại điện tử Hợp nhất',
      currency: 'VND',
      currencySymbol: '₫',
      vXuRate: 1, // 1 V-Xu = 1 VND
      timezone: 'GMT+7 (Asia/Ho_Chi_Minh)',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      language: 'vi',
      fiscalYearStartMonth: 1,
      closingDay: 5,
      sessionTimeout: 60, // phút
      require2FA: true,
      maxLoginAttempts: 5,
      enableSoundNotification: true,
      telegramWebhook: 'https://api.telegram.org/bot123456/sendMessage'
    };
  });

  // Per-Module Dedicated Settings State
  const [moduleSettings, setModuleSettings] = useState(() => {
    const saved = safeLocalStorage.getItem('vcomm_module_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      // 1. Orders & 3PL
      orders: {
        autoDispatch: true,
        defaultCarrier: 'ghn',
        defaultPrintSize: 'A6', // A6 | K80
        maskPhoneNumber: true,
        shippingInstruction: 'CHOXEMHANGKHONGTHU',
        allowBatchPrint: true
      },
      // 2. Finance & Payment
      finance: {
        bankCode: 'MB',
        accountNumber: '0988795908',
        accountName: 'CONG TY CP THUONG MAI DIEN TU VCOMM',
        sepayApiKey: 'SEPAY_LIVE_KEY_8839210',
        vXuReimburseRate: 100, // %
        escrowHoldPeriod: 'T+7', // T+3 | T+7 | DELIVERED
        autoReimburseThreshold: 5000000,
        accountReceivable: '131',
        accountPayable: '331',
        accountRevenue: '511',
        accountLoyaltyExpense: '641',
        accountBank: '1121'
      },
      // 3. E-Invoice & E-Tax
      invoices: {
        provider: 'misa_meinvoice', // misa_meinvoice | vnpt | viettel
        taxCode: '0318914439',
        templateCode: '1C26TBB',
        invoiceSeries: 'C26TAA',
        autoIssueOnDelivered: true,
        hsmSignType: 'CLOUD_HSM',
        vatTaxRate: 1.0, // 1% VAT
        personalIncomeTaxRate: 0.5 // 0.5% TNCN
      },
      // 4. Warehouse & SCM
      warehouse: {
        defaultWarehouse: 'WH-HCM-01',
        safetyStockThreshold: 20,
        allowNegativeStock: false,
        smartRoutingRule: 'PROXIMITY_FIRST', // PROXIMITY_FIRST | STOCK_MAX_FIRST
        barcodeFormat: 'CODE_128',
        autoCreatePurchaseOrder: true
      },
      // 5. Promotions & Flash Sale
      promotions: {
        maxVouchersPerOrder: 2,
        flashSaleSlots: ['00:00 - 09:00', '09:00 - 12:00', '12:00 - 18:00', '18:00 - 24:00'],
        buyerCashbackVXuRate: 1.0, // 1%
        sellerPlatformFeeRate: 3.5 // 3.5%
      },
      // 6. F&B E-Menu
      fnb: {
        enableTableQR: true,
        kdsAlertMinutes: 15,
        vatRate: 8, // 8%
        allowCashPayment: true,
        autoPrintOrderToKitchen: true
      },
      // 7. HR & Attendance
      hr: {
        gpsRadiusMeters: 50,
        allowedLateMinutes: 15,
        standardWorkDays: 26,
        socialInsuranceCompanyRate: 17.5,
        socialInsuranceEmployeeRate: 8.0,
        healthInsuranceRate: 1.5,
        unemploymentInsuranceRate: 1.0
      },
      // 8. CSKH VoIP
      cskh: {
        sipServer: 'sip.vcomm.vn:5060',
        slaHours: 4,
        zaloOaId: '283918293819283',
        enableVoIPRecording: true,
        screenPopOnCall: true
      }
    };
  });

  const handleSaveGeneral = () => {
    safeLocalStorage.setItem('vcomm_general_settings', JSON.stringify(generalSettings));
    setSaveGeneralSuccess(true);
    setTimeout(() => setSaveGeneralSuccess(false), 3000);
  };

  const handleSaveModules = () => {
    safeLocalStorage.setItem('vcomm_module_settings', JSON.stringify(moduleSettings));
    setSaveModuleSuccess(true);
    setTimeout(() => setSaveModuleSuccess(false), 3000);
  };

  // Mock User Accounts for RBAC
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([
    {
      id: 'usr-1',
      username: 'admin',
      fullName: 'Nguyễn Tiến Vĩnh',
      email: 'vinh.nguyen@luckyshopapp.vn',
      phone: '0988795908',
      role: 'Siêu quản trị (Super Admin)',
      branch: 'Trụ sở chính TP. Hồ Chí Minh',
      status: 'active',
      lastLogin: 'Vừa xong'
    },
    {
      id: 'usr-2',
      username: 'ketoan_truong',
      fullName: 'Trần Thị Mai',
      email: 'mai.tran@luckyshopapp.vn',
      phone: '0912345678',
      role: 'Kế toán trưởng (TT99)',
      branch: 'Trụ sở chính TP. Hồ Chí Minh',
      status: 'active',
      lastLogin: '14/09/2026 10:15'
    },
    {
      id: 'usr-3',
      username: 'thukho_fbl',
      fullName: 'Lê Hoàng Long',
      email: 'long.le@luckyshopapp.vn',
      phone: '0934567890',
      role: 'Quản lý Kho WMS FBL',
      branch: 'Kho Tổng Miền Nam - KCN Tân Bình',
      status: 'active',
      lastLogin: '14/09/2026 09:30'
    },
    {
      id: 'usr-4',
      username: 'cskh_lead',
      fullName: 'Phạm Thu Thảo',
      email: 'thao.pham@luckyshopapp.vn',
      phone: '0978901234',
      role: 'Trưởng nhóm CSKH & V-Xu',
      branch: 'Chi nhánh Hà Nội',
      status: 'active',
      lastLogin: '13/09/2026 18:00'
    },
    {
      id: 'usr-5',
      username: 'seller_manager',
      fullName: 'Vũ Đức Thịnh',
      email: 'thinh.vu@luckyshopapp.vn',
      phone: '0989012345',
      role: 'Điều phối Đơn hàng TMĐT',
      branch: 'Trụ sở chính TP. Hồ Chí Minh',
      status: 'active',
      lastLogin: '14/09/2026 08:45'
    }
  ]);

  // Roles list
  const [roleDefinitions, setRoleDefinitions] = useState<RoleDefinition[]>([
    { id: 'super_admin', name: 'Siêu quản trị (Super Admin)', description: 'Toàn quyền cấu hình, tài chính, phân quyền và dữ liệu hệ thống', userCount: 1, isSystem: true },
    { id: 'accountant', name: 'Kế toán trưởng (TT99)', description: 'Quản lý sổ cái kép Thông tư 99, khấu trừ thuế, đối soát COD và duyệt lệnh chi', userCount: 2, isSystem: true },
    { id: 'wms_lead', name: 'Quản lý Kho WMS', description: 'Điều phối nhập/xuất kho, in tem vận đơn 3PL A6 và quản lý Multi-WMS', userCount: 3 },
    { id: 'order_coordinator', name: 'Điều phối Đơn hàng TMĐT', description: 'Đẩy đơn sang GHN/GHTK, xử lý hủy đơn, khiếu nại và Smart Order Routing', userCount: 4 },
    { id: 'cskh_specialist', name: 'Chuyên viên CSKH & Hotline', description: 'Trực tổng đài VoIP, Omni-chat Zalo/Facebook và hỗ trợ V-Xu', userCount: 5 },
    { id: 'seller_partner', name: 'Đối tác Nhà bán (3P Seller)', description: 'Chỉ truy cập Kênh Người Bán, đăng sản phẩm và in phiếu xuất kho', userCount: 120 },
  ]);

  // Search in RBAC
  const [userSearch, setUserSearch] = useState('');

  const copyCompanyCode = () => {
    navigator.clipboard.writeText(companyInfo.companyCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveCompany = () => {
    safeLocalStorage.setItem('vcomm_company_profile', JSON.stringify(companyInfo));
    setIsEditingCompany(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const toggleUserStatus = (id: string) => {
    setUserAccounts(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'active' ? 'locked' : 'active' };
      }
      return u;
    }));
  };

  return (
    <div className={cn(
      "flex h-full min-h-[calc(100vh-3rem)] bg-slate-100 font-sans text-slate-800 transition-all duration-300",
      isFullWidthWorkspace ? "-m-4 md:-m-6 lg:-m-8 p-0" : "-m-4 md:-m-6 lg:-m-8"
    )}>
      
      {/* ================= LEFT SIDEBAR (CONFIG MENUS) ================= */}
      <aside className={cn(
        "bg-white border-r border-slate-200 shrink-0 flex flex-col justify-between select-none shadow-xs transition-all duration-300",
        isFullWidthWorkspace ? "w-60" : "w-64"
      )}>
        <div className="py-3">
          <div className="px-4 pb-3 border-b border-slate-100 mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Cấu hình hệ thống
            </span>
            <button
              onClick={() => setIsFullWidthWorkspace(!isFullWidthWorkspace)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1 text-[10px] font-semibold"
              title={isFullWidthWorkspace ? "Thu gọn màn hình làm việc" : "Mở rộng tối đa màn hình làm việc"}
            >
              {isFullWidthWorkspace ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-blue-600" />
                  <span className="text-blue-600">Thu gọn</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mở rộng</span>
                </>
              )}
            </button>
          </div>

          <nav className="space-y-0.5 px-2">
            {/* 1. Thông tin công ty */}
            <button
              onClick={() => setActiveTab('company')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                activeTab === 'company'
                  ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Building2 className={cn("w-4 h-4", activeTab === 'company' ? "text-blue-600" : "text-slate-400")} />
                <span>Thông tin công ty</span>
              </div>
            </button>

            {/* 2. Quản lý danh mục */}
            <button
              onClick={() => setActiveTab('categories')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                activeTab === 'categories'
                  ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Folders className={cn("w-4 h-4", activeTab === 'categories' ? "text-blue-600" : "text-slate-400")} />
                <span>Quản lý danh mục</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* 3. Phân quyền */}
            <button
              onClick={() => setActiveTab('rbac')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                activeTab === 'rbac'
                  ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Users className={cn("w-4 h-4", activeTab === 'rbac' ? "text-blue-600" : "text-slate-400")} />
                <span>Phân quyền</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* 4. Tình hình sử dụng */}
            <button
              onClick={() => setActiveTab('usage')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                activeTab === 'usage'
                  ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className={cn("w-4 h-4", activeTab === 'usage' ? "text-blue-600" : "text-slate-400")} />
                <span>Tình hình sử dụng</span>
              </div>
            </button>

            {/* 5. Cấu hình mail server */}
            <button
              onClick={() => setActiveTab('mail')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                activeTab === 'mail'
                  ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Mail className={cn("w-4 h-4", activeTab === 'mail' ? "text-blue-600" : "text-slate-400")} />
                <span>Cấu hình mail server</span>
              </div>
            </button>

            {/* 6. Bảo mật nâng cao */}
            <button
              onClick={() => setActiveTab('security')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                activeTab === 'security'
                  ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className={cn("w-4 h-4", activeTab === 'security' ? "text-blue-600" : "text-slate-400")} />
                <span>Bảo mật nâng cao</span>
              </div>
            </button>

            {/* 7. Thiết lập chung */}
            <button
              onClick={() => setActiveTab('general')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                activeTab === 'general'
                  ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <SettingsIcon className={cn("w-4 h-4", activeTab === 'general' ? "text-blue-600" : "text-slate-400")} />
                <span>Thiết lập chung</span>
              </div>
            </button>

            {/* 8. Cấu hình từng Module */}
            <button
              onClick={() => setActiveTab('modules')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                activeTab === 'modules'
                  ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Sliders className={cn("w-4 h-4", activeTab === 'modules' ? "text-blue-600" : "text-slate-400")} />
                <span>Cấu hình Module</span>
              </div>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-1.5 py-0.5 rounded-md">8</span>
            </button>

            {/* 8. Nhật ký hoạt động */}
            <button
              onClick={() => setActiveTab('audit')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                activeTab === 'audit'
                  ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Clock className={cn("w-4 h-4", activeTab === 'audit' ? "text-blue-600" : "text-slate-400")} />
                <span>Nhật ký hoạt động</span>
              </div>
            </button>

            {/* 9. Thùng rác */}
            <button
              onClick={() => setActiveTab('trash')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                activeTab === 'trash'
                  ? "bg-blue-50 text-blue-700 font-bold shadow-2xs"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Trash2 className={cn("w-4 h-4", activeTab === 'trash' ? "text-blue-600" : "text-slate-400")} />
                <span>Thùng rác</span>
              </div>
            </button>

            {/* 10. Sức khỏe Hạ tầng & Server */}
            <button
              onClick={() => setActiveTab('system_health')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                activeTab === 'system_health'
                  ? "bg-emerald-50 text-emerald-700 font-bold shadow-2xs border border-emerald-200"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className="flex items-center gap-3">
                <Activity className={cn("w-4 h-4", activeTab === 'system_health' ? "text-emerald-600" : "text-slate-400")} />
                <span>Hạ tầng & Sức khỏe</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Hệ thống ổn định" />
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Phiên bản ERP 2026.3</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Trực tuyến" />
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <main className={cn(
        "flex-1 overflow-y-auto bg-slate-50/70 transition-all duration-300",
        isFullWidthWorkspace ? "p-4 lg:p-6 w-full max-w-none" : "p-6 lg:p-8"
      )}>
        
        {/* ================= TAB 1: THÔNG TIN CÔNG TY ================= */}
        {activeTab === 'company' && (
          <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-200">
            
            {/* Header with Title & Edit Button */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Thông tin công ty</h1>
                <p className="text-xs text-slate-500 mt-0.5">Quản lý hồ sơ pháp lý, mã số thuế và thông tin tổ chức</p>
              </div>

              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Đã lưu thành công!
                  </span>
                )}

                {isEditingCompany ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingCompany(false)}
                      className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-white transition-all cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSaveCompany}
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Lưu lại
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditingCompany(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-lg text-xs font-semibold shadow-xs hover:bg-slate-50 transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Chỉnh sửa</span>
                  </button>
                )}
              </div>
            </div>

            {/* Top Company Banner Card */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0 shadow-2xs">
                {/* Red Shopping Cart Logo matching screenshot */}
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-sm">
                  <span className="text-lg font-black tracking-tighter">🛒</span>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  {companyInfo.fullName}
                </h2>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 font-medium">
                  <span>MST: <strong className="text-slate-800 font-bold">{companyInfo.taxCode}</strong></span>
                  <span>•</span>
                  <span>Mã DN: <strong className="text-slate-800 font-mono">{companyInfo.companyCode}</strong></span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Đã xác thực pháp lý
                  </span>
                </div>
              </div>
            </div>

            {/* 4 Cards Grid (2x2 Layout matching screenshot) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Card 1: Thông tin chi tiết */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">Thông tin chi tiết</h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Tên đầy đủ</label>
                    {isEditingCompany ? (
                      <input 
                        type="text" 
                        value={companyInfo.fullName}
                        onChange={e => setCompanyInfo({ ...companyInfo, fullName: e.target.value })}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold"
                      />
                    ) : (
                      <p className="font-bold text-slate-800">{companyInfo.fullName}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Tên viết tắt</label>
                      <p className="font-semibold text-slate-800">{companyInfo.shortName}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Loại hình kinh doanh</label>
                      <p className="font-semibold text-slate-800">{companyInfo.businessType}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Mã số thuế</label>
                      <p className="font-bold text-slate-800 font-mono">{companyInfo.taxCode}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Mã công ty</label>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 font-mono">{companyInfo.companyCode}</span>
                        <button 
                          onClick={copyCompanyCode}
                          className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                          title="Sao chép mã"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Ngày thành lập</label>
                    <p className="font-medium text-slate-800">{companyInfo.foundedDate}</p>
                  </div>
                </div>
              </div>

              {/* Card 2: Đăng ký kinh doanh */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Folders className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-sm font-bold text-slate-800">Đăng ký kinh doanh</h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Mã số ĐKKD</label>
                      <p className="font-bold text-slate-800 font-mono">{companyInfo.licenseNumber}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Ngày cấp</label>
                      <p className="font-medium text-slate-800">{companyInfo.licenseDate}</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Nơi cấp</label>
                    <p className="font-medium text-slate-800">{companyInfo.licensePlace}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Người đại diện pháp luật</label>
                      <p className="font-bold text-slate-800">{companyInfo.legalRepresentative}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Chức danh</label>
                      <p className="font-semibold text-slate-800">{companyInfo.legalTitle}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Thông tin liên hệ */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Mail className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-800">Thông tin liên hệ</h3>
                </div>

                <div className="space-y-3.5 text-xs">
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Địa chỉ trụ sở chính</label>
                    <p className="font-medium text-slate-800">{companyInfo.address}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Điện thoại</label>
                      <p className="font-semibold text-slate-800 font-mono">{companyInfo.phone}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Fax</label>
                      <p className="text-slate-500">{companyInfo.fax}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Email</label>
                      <p className="font-semibold text-blue-600">{companyInfo.email}</p>
                    </div>
                    <div>
                      <label className="text-slate-400 block text-[11px] mb-1">Website</label>
                      <p className="font-semibold text-blue-600">{companyInfo.website}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Mô hình hoạt động */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <SettingsIcon className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-800">Mô hình hoạt động</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block text-[11px] mb-1">Mô hình</label>
                    <p className="font-bold text-slate-800 capitalize">
                      {companyInfo.operatingModel === 'company' ? 'Công ty đơn lẻ' : 'Mô hình tập đoàn'}
                    </p>
                  </div>

                  <div className="pt-1">
                    <button
                      onClick={() => navigate('/org')}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>Chuyển thành mô hình tập đoàn</span>
                    </button>
                  </div>

                  {/* Warning Callout Box matching screenshot */}
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 leading-relaxed mt-3">
                    <strong>Lưu ý:</strong> Sau khi chuyển đổi sang mô hình <strong>Tập đoàn</strong>, bạn cần thiết lập Thông tin chung, Cơ cấu tổ chức (Công ty mẹ – con – liên kết), Phân quyền ở cấp Tập đoàn.
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 3: PHÂN QUYỀN (RBAC) ================= */}
        {activeTab === 'rbac' && (
          <div className="max-w-6xl mx-auto space-y-5 animate-in fade-in duration-200">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Phân quyền & Quản lý người dùng</h1>
                <p className="text-xs text-slate-500 mt-0.5">Phân quyền theo vai trò (RBAC), kiểm soát quyền đọc/ghi/duyệt từng phân hệ</p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Tạo vai trò mới</span>
                </button>

                <button 
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm người dùng</span>
                </button>
              </div>
            </div>

            {/* Sub-tabs for RBAC */}
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setRbacSubTab('users')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  rbacSubTab === 'users' ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-white hover:text-slate-900"
                )}
              >
                Người dùng & Tài khoản ({userAccounts.length})
              </button>

              <button
                onClick={() => setRbacSubTab('roles')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  rbacSubTab === 'roles' ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-white hover:text-slate-900"
                )}
              >
                Vai trò & Chức danh ({roleDefinitions.length})
              </button>

              <button
                onClick={() => setRbacSubTab('matrix')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  rbacSubTab === 'matrix' ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-white hover:text-slate-900"
                )}
              >
                Ma trận quyền hạn phân hệ
              </button>

              <button
                onClick={() => setRbacSubTab('branches')}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  rbacSubTab === 'branches' ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-white hover:text-slate-900"
                )}
              >
                Phân quyền theo Chi nhánh / Kho
              </button>
            </div>

            {/* Sub-tab 1: Users List */}
            {rbacSubTab === 'users' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* Table search & filter */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
                  <div className="relative w-72">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      placeholder="Tìm kiếm theo tên, email, vai trò..." 
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="text-xs text-slate-500">
                    Hiển thị <strong>{userAccounts.length}</strong> nhân sự được cấp quyền
                  </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                        <th className="py-3 px-4">Nhân sự</th>
                        <th className="py-3 px-4">Vai trò phân quyền</th>
                        <th className="py-3 px-4">Chi nhánh / Đơn vị</th>
                        <th className="py-3 px-4">Đăng nhập gần nhất</th>
                        <th className="py-3 px-4 text-center">Trạng thái</th>
                        <th className="py-3 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userAccounts
                        .filter(u => u.fullName.toLowerCase().includes(userSearch.toLowerCase()) || u.role.toLowerCase().includes(userSearch.toLowerCase()))
                        .map(user => (
                        <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                                {user.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-slate-800">{user.fullName}</p>
                                <p className="text-[11px] text-slate-400 font-mono">{user.email}</p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 font-semibold text-[11px]">
                              <ShieldCheck className="w-3 h-3 text-blue-600" />
                              {user.role}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-slate-600 font-medium">
                            {user.branch}
                          </td>

                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                            {user.lastLogin}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                              user.status === 'active' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                            )}>
                              {user.status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => toggleUserStatus(user.id)}
                              className={cn(
                                "text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer",
                                user.status === 'active' ? "text-rose-600 hover:bg-rose-50" : "text-emerald-600 hover:bg-emerald-50"
                              )}
                            >
                              {user.status === 'active' ? 'Khóa' : 'Mở khóa'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Roles List */}
            {rbacSubTab === 'roles' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roleDefinitions.map(role => (
                  <div key={role.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <h3 className="font-bold text-sm text-slate-800">{role.name}</h3>
                      </div>
                      {role.isSystem && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-md">
                          Hệ thống
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{role.description}</p>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">
                        <strong>{role.userCount}</strong> người dùng đang gán
                      </span>
                      <button className="text-blue-600 hover:underline font-bold">
                        Chỉnh sửa quyền
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sub-tab 3: Permission Matrix */}
            {rbacSubTab === 'matrix' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">Ma trận Phân quyền Đa tầng RBAC (Enterprise Security Matrix)</h3>
                    <p className="text-slate-500 text-xs mt-0.5">Xác lập ranh giới dữ liệu và các hành vi (Actions) cho từng vai trò chức danh nghiệp vụ</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => alert('Đã đặt lại quyền hạn về mặc định theo chuẩn ISO 27001')}
                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-xs"
                    >
                      Khôi phục chuẩn
                    </button>
                    <button
                      onClick={() => alert('Đã lưu thành công Ma trận Phân quyền RBAC!')}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-blue-500/20"
                    >
                      Lưu ma trận
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-bold text-[11px]">
                      <tr>
                        <th className="p-3.5 border-r border-slate-200">Phân hệ / Module</th>
                        <th className="p-3.5 text-center border-r border-slate-200">Siêu quản trị</th>
                        <th className="p-3.5 text-center border-r border-slate-200">Kế toán trưởng</th>
                        <th className="p-3.5 text-center border-r border-slate-200">Quản lý Kho FBL</th>
                        <th className="p-3.5 text-center border-r border-slate-200">Trưởng nhóm Sale</th>
                        <th className="p-3.5 text-center">CSKH & Helpdesk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { name: 'Đơn hàng TMĐT (eCommerce Core)', acts: ['Xem', 'Tạo', 'Sửa', 'Xóa', 'Duyệt', 'Xuất Excel'], def: [true, true, true, true, false] },
                        { name: 'Tài chính & Sổ cái Kế toán (TT99)', acts: ['Xem sổ cái', 'Bút toán', 'Duyệt chi VietQR', 'Ký HĐĐT'], def: [true, true, false, false, false] },
                        { name: 'Kho hàng Multi-WMS & Vận hành', acts: ['Xem tồn kho', 'Nhập PO', 'Xuất chuyển kho', 'Kiểm kê'], def: [true, false, true, false, false] },
                        { name: 'Nhân sự, Tiền lương & Đánh giá KPI', acts: ['Xem hồ sơ', 'Chấm công GPS', 'Tính lương', 'Duyệt KPI'], def: [true, true, false, true, false] },
                        { name: 'IT Helpdesk & Hỗ trợ kỹ thuật', acts: ['Tiếp nhận ticket', 'Đổi SLA P1', 'Cấp bản quyền', 'Audit'], def: [true, false, false, false, true] },
                        { name: 'Cấu hình Hệ thống & RBAC Admin', acts: ['Sửa công ty', 'Phân quyền', 'Cấu hình mail', 'Xem logs'], def: [true, false, false, false, false] },
                      ].map((item, mIdx) => (
                        <tr key={mIdx} className="hover:bg-slate-50/70">
                          <td className="p-3.5 font-bold text-slate-800 border-r border-slate-200">
                            <div>{item.name}</div>
                            <div className="text-[10px] font-normal text-slate-400 mt-0.5">
                              Hành vi: {item.acts.join(', ')}
                            </div>
                          </td>
                          {item.def.map((hasAccess, rIdx) => (
                            <td key={rIdx} className="p-3.5 text-center border-r border-slate-200 last:border-r-0">
                              <label className="inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  defaultChecked={hasAccess}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                                />
                              </label>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100 text-slate-600 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>Mọi thao tác thay đổi phân quyền sẽ được ghi lại trong <strong>Nhật ký hoạt động (Audit Logs)</strong> và có hiệu lực ngay lập tức sau 1 phút mà không cần người dùng đăng xuất.</span>
                </div>
              </div>
            )}

            {/* Sub-tab 4: Branches */}
            {rbacSubTab === 'branches' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 text-xs">
                <h3 className="font-bold text-slate-800">Phân quyền phạm vi dữ liệu theo Chi nhánh & Điểm bán</h3>
                <p className="text-slate-500">Người dùng chỉ được xem và xử lý đơn hàng/kho hàng thuộc chi nhánh được chỉ định:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="font-bold text-slate-800">Trụ sở chính TP. Hồ Chí Minh</p>
                    <p className="text-slate-400 text-[11px] mt-1">Toàn quyền xem dữ liệu tổng</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="font-bold text-slate-800">Chi nhánh Hà Nội</p>
                    <p className="text-slate-400 text-[11px] mt-1">Giới hạn khu vực Miền Bắc</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <p className="font-bold text-slate-800">Kho Tổng Tân Bình</p>
                    <p className="text-slate-400 text-[11px] mt-1">Chỉ dữ liệu kho vật lý</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* ================= OTHER TABS (FALLBACK / SYSTEM CONFIGS) ================= */}
        {activeTab === 'categories' && (
          <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in">
            <h2 className="text-base font-bold text-slate-900">Quản lý danh mục ngành hàng & Phí sàn</h2>
            <p className="text-xs text-slate-500">Cấu hình danh mục ngành hàng TMĐT, tỷ lệ hoa hồng và biểu phí sàn.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {['Điện tử & Công nghệ', 'Thời trang & Phụ kiện', 'Mỹ phẩm & Làm đẹp', 'Bách hóa & Tiêu dùng', 'F&B Nhà hàng'].map((c, i) => (
                <div key={i} className="p-3 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{c}</span>
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded">Active</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'usage' && (
          <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in">
            <h2 className="text-base font-bold text-slate-900">Tình hình sử dụng tài nguyên hệ thống</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500">Dung lượng Database</p>
                <p className="text-lg font-bold text-slate-900 mt-1">2.4 GB / 50 GB</p>
                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                  <div className="bg-blue-600 h-1.5 rounded-full w-[5%]" />
                </div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500">Đơn hàng TMĐT / Tháng</p>
                <p className="text-lg font-bold text-slate-900 mt-1">15,420 đơn</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500">Tài khoản nhân sự</p>
                <p className="text-lg font-bold text-slate-900 mt-1">5 / 50 User</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-slate-500">Bản quyền phần mềm</p>
                <p className="text-lg font-bold text-emerald-600 mt-1">Enterprise Vĩnh viễn</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'mail' && (
          <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in">
            <h2 className="text-base font-bold text-slate-900">Cấu hình Mail Server (SMTP)</h2>
            <p className="text-xs text-slate-500">Cấu hình gửi email tự động xác nhận đơn hàng, OTP và thông báo hệ thống.</p>
            <div className="max-w-xl space-y-3 text-xs">
              <div>
                <label className="text-slate-500 block mb-1">SMTP Host</label>
                <input type="text" defaultValue="smtp.gmail.com" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-500 block mb-1">SMTP Port</label>
                  <input type="text" defaultValue="587" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="text-slate-500 block mb-1">Encryption</label>
                  <input type="text" defaultValue="TLS" className="w-full px-3 py-1.5 border border-slate-300 rounded-lg" />
                </div>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg text-xs">
                Gửi email thử nghiệm
              </button>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in">
            <h2 className="text-base font-bold text-slate-900">Bảo mật nâng cao & Giám sát</h2>
            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">Xác thực 2 yếu tố (2FA / OTP)</p>
                  <p className="text-slate-400">Yêu cầu mã OTP khi đăng nhập từ thiết bị lạ</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
              </label>
              <label className="flex items-center justify-between p-3 border border-slate-200 rounded-xl">
                <div>
                  <p className="font-bold text-slate-800">Tự động hết hạn phiên làm việc (Session Timeout)</p>
                  <p className="text-slate-400">Đăng xuất sau 60 phút không có thao tác</p>
                </div>
                <input type="checkbox" defaultChecked className="rounded text-blue-600" />
              </label>
            </div>
          </div>
        )}

        {/* ================= TAB 7: THIẾT LẬP CHUNG (GLOBAL SETTINGS) ================= */}
        {activeTab === 'general' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cấu hình Cài đặt chung</h1>
                <p className="text-xs text-slate-500 mt-0.5">Thiết lập các tham số vận hành áp dụng thống nhất cho toàn bộ hệ thống VComm ERP</p>
              </div>

              <div className="flex items-center gap-3">
                {saveGeneralSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Đã lưu cài đặt chung thành công!
                  </span>
                )}
                <button
                  onClick={handleSaveGeneral}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lưu Cài Đặt Chung
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              {/* Card 1: Thương hiệu & Nhận diện */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Thương hiệu & Tên hệ thống</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Tên hệ thống ERP</label>
                    <input
                      type="text"
                      value={generalSettings.systemName}
                      onChange={e => setGeneralSettings({ ...generalSettings, systemName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Tên nền tảng eCommerce chính liên kết</label>
                    <input
                      type="text"
                      value={generalSettings.ecommerceName}
                      onChange={e => setGeneralSettings({ ...generalSettings, ecommerceName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Khẩu hiệu / Slogan</label>
                    <input
                      type="text"
                      value={generalSettings.slogan}
                      onChange={e => setGeneralSettings({ ...generalSettings, slogan: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Tiền tệ & Điểm thưởng V-Xu */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Định dạng Tiền tệ & Điểm V-Xu</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Đồng tiền cơ sở</label>
                      <input
                        type="text"
                        value={generalSettings.currency}
                        disabled
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Ký hiệu tiền tệ</label>
                      <input
                        type="text"
                        value={generalSettings.currencySymbol}
                        onChange={e => setGeneralSettings({ ...generalSettings, currencySymbol: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/60">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-emerald-900">Tỷ lệ quy đổi điểm V-Xu</span>
                      <span className="font-mono font-black text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200">1 V-Xu = 1 VND</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      Quỹ Loyalty VComm hoàn tiền mặt 100% cho Shop/Đối tác iPOS qua lệnh chi hộ VietQR tự động khi người mua tiêu điểm.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Thời gian, Múi giờ & Ngôn ngữ */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Clock className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Thời gian, Múi giờ & Định dạng</h3>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Múi giờ hệ thống</label>
                    <select
                      value={generalSettings.timezone}
                      onChange={e => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="GMT+7 (Asia/Ho_Chi_Minh)">GMT+7 (Asia/Ho_Chi_Minh - Giờ chuẩn Việt Nam)</option>
                      <option value="GMT+8 (Asia/Singapore)">GMT+8 (Asia/Singapore)</option>
                      <option value="GMT+0 (UTC)">GMT+0 (UTC/London)</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Định dạng ngày</label>
                      <select
                        value={generalSettings.dateFormat}
                        onChange={e => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (Chuẩn VN)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (Chuẩn ISO)</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY (Chuẩn US)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Ngôn ngữ mặc định</label>
                      <select
                        value={generalSettings.language}
                        onChange={e => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="vi">Tiếng Việt (Mặc định)</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 4: Năm tài chính & Khóa sổ */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Năm tài chính & Kỳ khóa sổ kế toán</h3>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Bắt đầu năm tài chính</label>
                      <select
                        value={generalSettings.fiscalYearStartMonth}
                        onChange={e => setGeneralSettings({ ...generalSettings, fiscalYearStartMonth: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value={1}>Tháng 1 (Dương lịch)</option>
                        <option value={4}>Tháng 4</option>
                        <option value={7}>Tháng 7</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-600 font-semibold block mb-1">Ngày khóa sổ hàng tháng</label>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Ngày</span>
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={generalSettings.closingDay}
                          onChange={e => setGeneralSettings({ ...generalSettings, closingDay: Number(e.target.value) })}
                          className="w-20 px-3 py-2 border border-slate-200 rounded-xl text-center font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <span className="text-slate-500">hàng tháng</span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-[11px] text-amber-800 leading-relaxed">
                    Sau ngày khóa sổ, hệ thống sẽ tự động ngăn chặn sửa đổi hoặc hủy các chứng từ thu chi, hóa đơn và đơn hàng phát sinh trong kỳ trước.
                  </div>
                </div>
              </div>

              {/* Card 5: Phiên làm việc & Thông báo hệ thống */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4 md:col-span-2">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-blue-600" />
                  <h3 className="font-bold text-slate-900 text-sm">Chính sách Phiên đăng nhập & Kênh thông báo</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Hết hạn phiên (Session Timeout)</label>
                    <select
                      value={generalSettings.sessionTimeout}
                      onChange={e => setGeneralSettings({ ...generalSettings, sessionTimeout: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value={15}>15 phút</option>
                      <option value={30}>30 phút</option>
                      <option value={60}>60 phút (Khuyến nghị)</option>
                      <option value={480}>8 tiếng (Hết ngày làm việc)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Xác thực 2 yếu tố (2FA OTP)</label>
                    <select
                      value={generalSettings.require2FA ? 'true' : 'false'}
                      onChange={e => setGeneralSettings({ ...generalSettings, require2FA: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="true">Bắt buộc đối với Ban Quản trị & Kế toán</option>
                      <option value="false">Tùy chọn cho người dùng</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-600 font-semibold block mb-1">Chuông báo âm thanh đơn mới</label>
                    <select
                      value={generalSettings.enableSoundNotification ? 'true' : 'false'}
                      onChange={e => setGeneralSettings({ ...generalSettings, enableSoundNotification: e.target.value === 'true' })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      <option value="true">Bật âm thanh báo động (Chime)</option>
                      <option value="false">Tắt âm thanh</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 8: CẤU HÌNH TỪNG MODULE (PER-MODULE SETTINGS) ================= */}
        {activeTab === 'modules' && (
          <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">Cấu hình Cài đặt theo từng Module</h1>
                <p className="text-xs text-slate-500 mt-0.5">Thiết lập các tham số nghiệp vụ chuyên sâu cho từng phân hệ trong hệ sinh thái VComm</p>
              </div>

              <div className="flex items-center gap-3">
                {saveModuleSuccess && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4" /> Đã lưu cấu hình module thành công!
                  </span>
                )}
                <button
                  onClick={handleSaveModules}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Lưu Cấu Hình Module
                </button>
              </div>
            </div>

            {/* Sub-tabs Pills across 8 modules */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-200 custom-scrollbar">
              {[
                { id: 'orders', label: 'Đơn hàng & 3PL', icon: Truck, color: 'text-rose-600' },
                { id: 'finance', label: 'Tài chính & VietQR', icon: CreditCard, color: 'text-emerald-600' },
                { id: 'invoices', label: 'Hóa đơn & Thuế', icon: Receipt, color: 'text-blue-600' },
                { id: 'warehouse', label: 'Kho hàng WMS', icon: Warehouse, color: 'text-indigo-600' },
                { id: 'promotions', label: 'Khuyến mại & Flash Sale', icon: Percent, color: 'text-amber-600' },
                { id: 'fnb', label: 'Nhà hàng F&B E-Menu', icon: Utensils, color: 'text-orange-600' },
                { id: 'hr', label: 'Nhân sự & Chấm công', icon: Users, color: 'text-violet-600' },
                { id: 'cskh', label: 'CSKH & VoIP', icon: Headphones, color: 'text-pink-600' },
              ].map(tab => {
                const Icon = tab.icon;
                const active = moduleSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setModuleSubTab(tab.id as any)}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer",
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", active ? "text-amber-400" : tab.color)} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Module Sub-tab 1: Orders & 3PL */}
            {moduleSubTab === 'orders' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Cấu hình Đơn hàng TMĐT & Điều phối 3PL</h3>
                    <p className="text-slate-500 text-[11px]">Quản lý cơ chế tự động cấp mã vận đơn và in tem nhãn giao hàng</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-bold text-[10px]">Nền tảng chính</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-xl space-y-3">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">Tự động đẩy đơn sang 3PL (Auto-dispatch)</p>
                        <p className="text-slate-500 text-[11px]">Tự động xin mã vận đơn ngay khi khách đặt hàng thành công</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={moduleSettings.orders.autoDispatch}
                        onChange={e => setModuleSettings({
                          ...moduleSettings,
                          orders: { ...moduleSettings.orders, autoDispatch: e.target.checked }
                        })}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </label>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-xl space-y-3">
                    <label className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-900">Ẩn số điện thoại người nhận (PDPD)</p>
                        <p className="text-slate-500 text-[11px]">Che 4 số giữa SĐT trên tem in theo Nghị định 13/2023/NĐ-CP</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={moduleSettings.orders.maskPhoneNumber}
                        onChange={e => setModuleSettings({
                          ...moduleSettings,
                          orders: { ...moduleSettings.orders, maskPhoneNumber: e.target.checked }
                        })}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                    </label>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Hãng vận chuyển 3PL mặc định</label>
                    <select
                      value={moduleSettings.orders.defaultCarrier}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        orders: { ...moduleSettings.orders, defaultCarrier: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                    >
                      <option value="ghn">⚡ Giao Hàng Nhanh (GHN Express)</option>
                      <option value="ghtk">🚚 Giao Hàng Tiết Kiệm (GHTK)</option>
                      <option value="viettel_post">🔴 Viettel Post</option>
                      <option value="jt_express">📦 J&T Express</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Khổ tem in vận đơn mặc định</label>
                    <select
                      value={moduleSettings.orders.defaultPrintSize}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        orders: { ...moduleSettings.orders, defaultPrintSize: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                    >
                      <option value="A6">Decal nhiệt A6 (100x150mm - Chuẩn TMĐT)</option>
                      <option value="K80">Khổ cuộn K80 (80mm - In nhiệt máy POS)</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-slate-700 font-bold block mb-1">Chỉ dẫn giao hàng in trên tem</label>
                    <select
                      value={moduleSettings.orders.shippingInstruction}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        orders: { ...moduleSettings.orders, shippingInstruction: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                    >
                      <option value="CHOXEMHANGKHONGTHU">CHO XEM HÀNG, KHÔNG CHO THỬ</option>
                      <option value="CHOKHEMHANG">CHO XEM HÀNG VÀ THỬ HÀNG</option>
                      <option value="KHONGCHOXEMHANG">KHÔNG CHO XEM HÀNG</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Module Sub-tab 2: Finance & Payment */}
            {moduleSubTab === 'finance' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Cấu hình Tài chính & Cổng thanh toán VietQR</h3>
                  <p className="text-slate-500 text-[11px]">Tích hợp tài khoản ngân hàng thụ hưởng Napas247, SePay và hạch toán Thông tư 99</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Ngân hàng thụ hưởng VietQR</label>
                    <input
                      type="text"
                      value={moduleSettings.finance.bankCode}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        finance: { ...moduleSettings.finance, bankCode: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Số tài khoản nhận tiền</label>
                    <input
                      type="text"
                      value={moduleSettings.finance.accountNumber}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        finance: { ...moduleSettings.finance, accountNumber: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Tên chủ tài khoản</label>
                    <input
                      type="text"
                      value={moduleSettings.finance.accountName}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        finance: { ...moduleSettings.finance, accountName: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl uppercase font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Thời gian giữ tiền ví Escrow</label>
                    <select
                      value={moduleSettings.finance.escrowHoldPeriod}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        finance: { ...moduleSettings.finance, escrowHoldPeriod: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="T+3">T+3 ngày (Shop Uy Tín / Mall)</option>
                      <option value="T+7">T+7 ngày (Chuẩn chính sách đổi trả sàn)</option>
                      <option value="DELIVERED">Ngay khi giao hàng thành công (DELIVERED)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Tỷ lệ hoàn tiền mặt V-Xu (%)</label>
                    <input
                      type="number"
                      value={moduleSettings.finance.vXuReimburseRate}
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-100 font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Mã API Token SePay</label>
                    <input
                      type="password"
                      value={moduleSettings.finance.sepayApiKey}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        finance: { ...moduleSettings.finance, sepayApiKey: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-2">Hệ thống Tài khoản Kế toán ngầm định (Thông tư 99/2025/TT-BTC)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-[11px]">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Doanh thu TMĐT</span>
                      <strong className="text-slate-800">TK {moduleSettings.finance.accountRevenue}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Chi phí Loyalty V-Xu</span>
                      <strong className="text-rose-700">TK {moduleSettings.finance.accountLoyaltyExpense}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Phải trả Seller</span>
                      <strong className="text-slate-800">TK {moduleSettings.finance.accountPayable}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Phải thu Khách hàng</span>
                      <strong className="text-slate-800">TK {moduleSettings.finance.accountReceivable}</strong>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Tiền gửi Ngân hàng</span>
                      <strong className="text-emerald-700">TK {moduleSettings.finance.accountBank}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Module Sub-tab 3: Invoices & Tax */}
            {moduleSubTab === 'invoices' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Cấu hình Hóa đơn điện tử & Khấu trừ thuế sàn</h3>
                  <p className="text-slate-500 text-[11px]">Adapter VComm Invoice, VNPT Invoice và khấu trừ thuế theo Nghị định 91 & 126</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Nhà cung cấp Hóa đơn điện tử</label>
                    <select
                      value={moduleSettings.invoices.provider}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        invoices: { ...moduleSettings.invoices, provider: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                    >
                      <option value="misa_meinvoice">VComm Invoice API</option>
                      <option value="vnpt">VNPT Invoice API</option>
                      <option value="viettel">Viettel Cyberbill</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Ký hiệu mẫu hóa đơn</label>
                    <input
                      type="text"
                      value={moduleSettings.invoices.templateCode}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        invoices: { ...moduleSettings.invoices, templateCode: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Ký hiệu hóa đơn</label>
                    <input
                      type="text"
                      value={moduleSettings.invoices.invoiceSeries}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        invoices: { ...moduleSettings.invoices, invoiceSeries: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 md:col-span-3">
                    <h4 className="font-bold text-slate-900 mb-2">Quy định Khấu trừ Thuế Sàn TMĐT đối với Seller Cá nhân (Nghị định 91/2022/NĐ-CP)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                        <div>
                          <span className="font-bold text-slate-800">Tỷ lệ Thuế GTGT khấu trừ</span>
                          <span className="text-[10px] text-slate-400 block">Trích trên tổng doanh thu đơn hàng hoàn tất</span>
                        </div>
                        <span className="font-mono font-black text-blue-700 bg-blue-50 px-2 py-1 rounded">1.0%</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200">
                        <div>
                          <span className="font-bold text-slate-800">Tỷ lệ Thuế TNCN khấu trừ</span>
                          <span className="text-[10px] text-slate-400 block">Trích trên tổng doanh thu đơn hàng hoàn tất</span>
                        </div>
                        <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2 py-1 rounded">0.5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Module Sub-tab 4: Warehouse & SCM */}
            {moduleSubTab === 'warehouse' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Cấu hình Chuỗi cung ứng Multi-WMS & Mua hàng</h3>
                  <p className="text-slate-500 text-[11px]">Quản lý định tuyến kho hàng thông minh, ngưỡng an toàn và quy tắc xuất hàng</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Kho xuất hàng mặc định</label>
                    <select
                      value={moduleSettings.warehouse.defaultWarehouse}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        warehouse: { ...moduleSettings.warehouse, defaultWarehouse: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                    >
                      <option value="WH-HCM-01">Kho Tổng FBL Tân Bình (TP. Hồ Chí Minh)</option>
                      <option value="WH-HN-01">Kho Tổng FBL Cầu Giấy (Hà Nội)</option>
                      <option value="WH-DN-01">Kho Vệ tinh Đà Nẵng</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Thuật toán Smart Order Routing</label>
                    <select
                      value={moduleSettings.warehouse.smartRoutingRule}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        warehouse: { ...moduleSettings.warehouse, smartRoutingRule: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-semibold"
                    >
                      <option value="PROXIMITY_FIRST">Ưu tiên kho gần địa chỉ khách hàng nhất</option>
                      <option value="STOCK_MAX_FIRST">Ưu tiên kho có số lượng tồn dồi dào nhất</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Ngưỡng cảnh báo tồn an toàn (Safety Stock)</label>
                    <input
                      type="number"
                      value={moduleSettings.warehouse.safetyStockThreshold}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        warehouse: { ...moduleSettings.warehouse, safetyStockThreshold: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div className="p-3 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-800">Cho phép xuất âm kho</p>
                      <p className="text-slate-500 text-[11px]">Bật khi cho phép đặt hàng trước (Pre-order)</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={moduleSettings.warehouse.allowNegativeStock}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        warehouse: { ...moduleSettings.warehouse, allowNegativeStock: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Module Sub-tab 5: Promotions */}
            {moduleSubTab === 'promotions' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Cấu hình Khuyến mại, Flash Sale & Phí Sàn</h3>
                  <p className="text-slate-500 text-[11px]">Thiết lập chính sách voucher, chiết khấu và khung giờ vàng</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Tối đa số Voucher/Đơn</label>
                    <input
                      type="number"
                      value={moduleSettings.promotions.maxVouchersPerOrder}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        promotions: { ...moduleSettings.promotions, maxVouchersPerOrder: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Tỷ lệ tích điểm V-Xu cho Người mua (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={moduleSettings.promotions.buyerCashbackVXuRate}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        promotions: { ...moduleSettings.promotions, buyerCashbackVXuRate: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Phí hoa hồng sàn thu của Seller 3P (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={moduleSettings.promotions.sellerPlatformFeeRate}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        promotions: { ...moduleSettings.promotions, sellerPlatformFeeRate: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold text-indigo-600"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Module Sub-tab 6: F&B E-Menu */}
            {moduleSubTab === 'fnb' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Cấu hình Phân hệ Nhà hàng F&B & Thực Đơn E-Menu</h3>
                  <p className="text-slate-500 text-[11px]">Quản lý mã QR gọi món tại bàn, màn hình bếp KDS và thuế suất ăn uống</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-200 rounded-xl flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">Cho phép quét mã QR gọi món tại bàn</p>
                      <p className="text-slate-500 text-[11px]">Khách hàng dùng camera điện thoại quét mã mở E-Menu gọi món tức thì</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={moduleSettings.fnb.enableTableQR}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        fnb: { ...moduleSettings.fnb, enableTableQR: e.target.checked }
                      })}
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Cảnh báo thời gian chế biến bếp KDS (Phút)</label>
                    <input
                      type="number"
                      value={moduleSettings.fnb.kdsAlertMinutes}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        fnb: { ...moduleSettings.fnb, kdsAlertMinutes: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Thuế suất VAT ngành F&B ẩm thực</label>
                    <select
                      value={moduleSettings.fnb.vatRate}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        fnb: { ...moduleSettings.fnb, vatRate: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                    >
                      <option value={8}>8% (Nghị định giảm thuế kích cầu)</option>
                      <option value={10}>10% (Thuế suất chuẩn)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Module Sub-tab 7: HR & Attendance */}
            {moduleSubTab === 'hr' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Cấu hình Nhân sự, Chấm công FaceID/GPS & BHXH</h3>
                  <p className="text-slate-500 text-[11px]">Tham số quản lý ca làm việc, định vị GPS và chế độ bảo hiểm</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Bán kính GPS chấm công (Mét)</label>
                    <input
                      type="number"
                      value={moduleSettings.hr.gpsRadiusMeters}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        hr: { ...moduleSettings.hr, gpsRadiusMeters: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Thời gian đi muộn cho phép (Phút)</label>
                    <input
                      type="number"
                      value={moduleSettings.hr.allowedLateMinutes}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        hr: { ...moduleSettings.hr, allowedLateMinutes: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Ngày công chuẩn trong tháng</label>
                    <select
                      value={moduleSettings.hr.standardWorkDays}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        hr: { ...moduleSettings.hr, standardWorkDays: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white font-bold"
                    >
                      <option value={26}>26 ngày công (Nghỉ Chủ Nhật)</option>
                      <option value={24}>24 ngày công (Nghỉ Thứ 7 & CN)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Module Sub-tab 8: CSKH & VoIP */}
            {moduleSubTab === 'cskh' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5 text-xs">
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-sm">Cấu hình Tổng đài CSKH VoIP & Omni-chat</h3>
                  <p className="text-slate-500 text-[11px]">Thông số SIP Trunk gọi trực tiếp WebRTC và cam kết SLA phản hồi</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Máy chủ SIP Server WebRTC</label>
                    <input
                      type="text"
                      value={moduleSettings.cskh.sipServer}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        cskh: { ...moduleSettings.cskh, sipServer: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Thời gian cam kết xử lý khiếu nại (SLA Giờ)</label>
                    <input
                      type="number"
                      value={moduleSettings.cskh.slaHours}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        cskh: { ...moduleSettings.cskh, slaHours: Number(e.target.value) }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-bold"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-slate-700 font-bold block mb-1">Zalo Official Account ID (Omni-chat)</label>
                    <input
                      type="text"
                      value={moduleSettings.cskh.zaloOaId}
                      onChange={e => setModuleSettings({
                        ...moduleSettings,
                        cskh: { ...moduleSettings.cskh, zaloOaId: e.target.value }
                      })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in">
            <h2 className="text-base font-bold text-slate-900">Nhật ký hoạt động (Audit Log)</h2>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="py-2.5 flex items-center justify-between">
                <span>[14/09/2026 11:45] <strong>admin</strong> đã cập nhật thông tin công ty.</span>
                <span className="text-slate-400 font-mono">118.69.182.10</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span>[14/09/2026 11:20] <strong>seller_manager</strong> đẩy đơn hàng #DH-2026 sang GHN.</span>
                <span className="text-slate-400 font-mono">118.69.182.10</span>
              </div>
              <div className="py-2.5 flex items-center justify-between">
                <span>[14/09/2026 10:15] <strong>ketoan_truong</strong> đối soát lệnh hoàn tiền V-Xu.</span>
                <span className="text-slate-400 font-mono">14.161.22.8</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trash' && (
          <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-in fade-in">
            <h2 className="text-base font-bold text-slate-900">Thùng rác & Bản ghi đã xóa tạm</h2>
            <p className="text-xs text-slate-500">Các bản ghi bị xóa sẽ được lưu trữ 30 ngày trước khi xóa vĩnh viễn.</p>
            <div className="p-8 text-center text-slate-400 text-xs">
              <Trash2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              Thùng rác hiện đang trống.
            </div>
          </div>
        )}

        {/* TAB 10: SỨC KHỎE HẠ TẦNG & SERVER MONITOR */}
        {activeTab === 'system_health' && (
          <div className="w-full space-y-6 animate-in fade-in">
            {/* Top Overview Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Tất cả các dịch vụ đang hoạt động bình thường (Operational)
                </div>
                <h2 className="text-xl font-black">Giám Sát Hạ Tầng & Sức Khỏe Máy Chủ</h2>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  Theo dõi thời gian thực tải CPU, bộ nhớ RAM, độ trễ truy vấn Database và trạng thái các cụm Microservices của VComm Enterprise.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-white/10 px-4 py-2.5 rounded-xl text-center border border-white/10">
                  <div className="text-xs text-slate-300">Uptime SLA 30 ngày</div>
                  <div className="text-xl font-black text-emerald-400">99.98%</div>
                </div>
                <div className="bg-white/10 px-4 py-2.5 rounded-xl text-center border border-white/10">
                  <div className="text-xs text-slate-300">Độ trễ trung bình</div>
                  <div className="text-xl font-black text-indigo-300">18 ms</div>
                </div>
              </div>
            </div>

            {/* Hardware Resources Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Tải CPU (16 Cores)</span>
                  <Cpu className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">28.4%</div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '28.4%' }}></div>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Tần số: 3.6 GHz</span>
                  <span>Nhiệt độ: 48°C</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Bộ nhớ RAM (ECC)</span>
                  <HardDrive className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">12.4 / 32 GB</div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '38.7%' }}></div>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Sử dụng: 38.7%</span>
                  <span>Bộ đệm Cache: 4.2 GB</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">NVMe SSD Storage</span>
                  <Database className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">420 GB / 1 TB</div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '42%' }}></div>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>Còn trống: 580 GB</span>
                  <span>Đọc/Ghi: 3.2 GB/s</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Lưu lượng Mạng</span>
                  <Wifi className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-black text-slate-900">145.2 Mbps</div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '22%' }}></div>
                </div>
                <div className="text-[11px] text-slate-400 flex justify-between">
                  <span>In: 62 Mbps</span>
                  <span>Out: 83.2 Mbps</span>
                </div>
              </div>
            </div>

            {/* Microservices Connectivity Status Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Trạng Thái Cụm Dịch Vụ Microservices</h3>
                  <p className="text-xs text-slate-500">Kiểm tra kết nối và độ trễ phản hồi thời gian thực</p>
                </div>
                <button
                  onClick={() => alert('Đã kiểm tra sức khỏe cụm dịch vụ: Tất cả 6 endpoints phản hồi dưới 30ms')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Kiểm tra lại
                </button>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {[
                  { service: 'VComm ERP Core API (NestJS Cluster)', port: '5000', latency: '12 ms', status: 'Hoạt động tốt', uptime: '99.99%', host: 'internal://srv-core-01' },
                  { service: 'Supabase PostgreSQL & Row Level Security', port: '5432', latency: '24 ms', status: 'Hoạt động tốt', uptime: '99.98%', host: 'db.supabase.co' },
                  { service: 'Firebase Realtime Event Stream', port: '443', latency: '18 ms', status: 'Hoạt động tốt', uptime: '99.95%', host: 'firebasedatabase.app' },
                  { service: 'Redis Caching & Session Storage', port: '6379', latency: '2 ms', status: 'Hoạt động tốt', uptime: '100%', host: 'redis-cluster.internal' },
                  { service: 'Cổng Viettel/VNPT Hóa Đơn Điện Tử HSM', port: '443', latency: '45 ms', status: 'Hoạt động tốt', uptime: '99.92%', host: 'einvoice.vcomm.vn' },
                  { service: 'Cổng Thanh Toán SePay & VietQR Webhook', port: '443', latency: '32 ms', status: 'Hoạt động tốt', uptime: '99.97%', host: 'webhook.vcomm.vn' }
                ].map((item, idx) => (
                  <div key={idx} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      <div>
                        <div className="font-bold text-slate-800">{item.service}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{item.host}:{item.port}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-right">
                        <span className="font-mono font-bold text-indigo-600">{item.latency}</span>
                        <div className="text-[10px] text-slate-400">Độ trễ phản hồi</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-emerald-600">{item.uptime}</span>
                        <div className="text-[10px] text-slate-400">Tỷ lệ khả dụng</div>
                      </div>
                      <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] border border-emerald-200">
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
