import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { safeLocalStorage } from './lib/storage';
import nexhubProducts from './constants/nexhub_products.json';

import { MisaTopBar } from './components/MisaTopBar';
import { CommandPalette } from './components/CommandPalette';
import { cn } from './lib/utils';
import { lazyWithRetry } from './lib/lazyWithRetry';

const Dashboard = lazyWithRetry(() => import('./components/Dashboard'), 'Dashboard');
const Home = lazyWithRetry(() => import('./components/Home'), 'Home');
const Orders = lazyWithRetry(() => import('./components/Orders'), 'Orders');
const PIM = lazyWithRetry(() => import('./components/PIM'), 'PIM');
const SellerManagement = lazyWithRetry(() => import('./components/Sellers'), 'SellerManagement');
const Customers = lazyWithRetry(() => import('./components/Customers'), 'Customers');
const Marketing = lazyWithRetry(() => import('./components/Marketing'), 'Marketing');
const FlashSale = lazyWithRetry(() => import('./components/FlashSale'), 'FlashSale');
const AffiliateManagement = lazyWithRetry(() => import('./components/Affiliate'), 'AffiliateManagement');
const WarehouseModule = lazyWithRetry(() => import('./components/Warehouse'), 'WarehouseModule');
const Procurement = lazyWithRetry(() => import('./components/Procurement'), 'Procurement');
const Finance = lazyWithRetry(() => import('./components/Finance'), 'Finance');
const SettlementManagement = lazyWithRetry(() => import('./components/Settlement'), 'SettlementManagement');
const HumanResources = lazyWithRetry(() => import('./components/HR'), 'HumanResources');
const Performance = lazyWithRetry(() => import('./components/Performance'), 'Performance');
const Workspace = lazyWithRetry(() => import('./components/Workspace'), 'Workspace');
const AnalyticsBI = lazyWithRetry(() => import('./components/AnalyticsBI'), 'AnalyticsBI');
const ExecutiveCockpit = lazyWithRetry(() => import('./components/ExecutiveCockpit'), 'ExecutiveCockpit');
const SalesManagement = lazyWithRetry(() => import('./components/Sales'), 'SalesManagement');
const LoyaltyManagement = lazyWithRetry(() => import('./components/Loyalty'), 'LoyaltyManagement');
const SettingsPage = lazyWithRetry(() => import('./components/SystemAdministration'), 'SystemAdministration');
const UserProfile = lazyWithRetry(() => import('./components/UserProfile'), 'UserProfile');
const WalletHub = lazyWithRetry(() => import('./components/Wallet'), 'WalletHub');
const LiveCommerce = lazyWithRetry(() => import('./components/LiveCommerce'), 'LiveCommerce');
const AdManager = lazyWithRetry(() => import('./components/AdManager'), 'AdManager');
const Compliance = lazyWithRetry(() => import('./components/Compliance'), 'Compliance');
const SellerFinance = lazyWithRetry(() => import('./components/SellerFinance'), 'SellerFinance');
const SocialCommerce = lazyWithRetry(() => import('./components/SocialCommerce'), 'SocialCommerce');
const OmniChat = lazyWithRetry(() => import('./components/OmniChat'), 'OmniChat');
const WorkflowHub = lazyWithRetry(() => import('./components/WorkflowHub'), 'WorkflowHub');
const AIOperations = lazyWithRetry(() => import('./components/AIOperations'), 'AIOperations');
const AIPredictions = lazyWithRetry(() => import('./components/AIPredictions'), 'AIPredictions');
const ErpCopilot = lazyWithRetry(() => import('./components/ErpCopilot'), 'ErpCopilot');
const OrgStructure = lazyWithRetry(() => import('./components/OrgStructure'), 'OrgStructure');
const EMenu = lazyWithRetry(() => import('./components/EMenu'), 'EMenu');
const CustomerService = lazyWithRetry(() => import('./components/CustomerService'), 'CustomerService');
const RequestHub = lazyWithRetry(() => import('./components/RequestHub'), 'RequestHub');
const ContractManager = lazyWithRetry(() => import('./components/ContractManager'), 'ContractManager');
const DocumentManager = lazyWithRetry(() => import('./components/DocumentManager'), 'DocumentManager');
const DocHub = lazyWithRetry(() => import('./components/DocHub'), 'DocHub');
const SignatureHub = lazyWithRetry(() => import('./components/SignatureHub'), 'SignatureHub');
const VCommSupermarket = lazyWithRetry(() => import('./components/VCommSupermarket'), 'VCommSupermarket');
const DeviceLeasing = lazyWithRetry(() => import('./components/DeviceLeasing'), 'DeviceLeasing');
const AssetManagement = lazyWithRetry(() => import('./components/AssetManagement'), 'AssetManagement');
const SupplierPortal = lazyWithRetry(() => import('./components/SupplierPortal'), 'SupplierPortal');
const MailClient = lazyWithRetry(() => import('./components/MailClient'), 'MailClient');
const EmployeeDirectory = lazyWithRetry(() => import('./components/EmployeeDirectory'), 'EmployeeDirectory');
const TaxPIT = lazyWithRetry(() => import('./components/TaxPIT'), 'TaxPIT');
const OKRManagement = lazyWithRetry(() => import('./components/OKRManagement'), 'OKRManagement');
const RecruitmentPipeline = lazyWithRetry(() => import('./components/RecruitmentPipeline'), 'RecruitmentPipeline');
const InvoiceManager = lazyWithRetry(() => import('./components/InvoiceManager'), 'InvoiceManager');
const SellerCredit = lazyWithRetry(() => import('./components/SellerCredit'), 'SellerCredit');
const QuickNotes = lazyWithRetry(() => import('./components/QuickNotes'), 'QuickNotes');
const StorefrontManager = lazyWithRetry(() => import('./components/StorefrontManager'), 'StorefrontManager');
const EmployeeSelfService = lazyWithRetry(() => import('./components/ESS'), 'EmployeeSelfService');
const AttendanceApp = lazyWithRetry(() => import('./components/AttendanceApp'), 'AttendanceApp');
const PayrollApp = lazyWithRetry(() => import('./components/PayrollApp'), 'PayrollApp');
const EmployeesApp = lazyWithRetry(() => import('./components/EmployeesApp'), 'EmployeesApp');
const InsuranceApp = lazyWithRetry(() => import('./components/InsuranceApp'), 'InsuranceApp');
const LaborCompliance = lazyWithRetry(() => import('./components/LaborCompliance'), 'LaborCompliance');
const ITHelpdesk = lazyWithRetry(() => import('./components/ITHelpdesk'), 'ITHelpdesk');
const LMSManagement = lazyWithRetry(() => import('./components/LMSManagement'), 'LMSManagement');


import { useAuth } from './context/AuthContext';
import { useSepayListener } from './hooks/useSepayListener';
import { StoreProvider } from './context/StoreContext';
import { StoreSelector } from './components/StoreSelector';
import { LoginPage } from './components/LoginPage';
import { LoadingScreen } from './components/LoadingScreen';
import { AccessDenied } from './components/AccessDenied';
import { ErrorBoundary } from './components/ErrorBoundary';
import { supabase } from './lib/supabase';
import { useNotifications } from './context/NotificationContext';
import { EntityProvider } from './context/EntityContext';
import { UniversalEntityPeekDrawer } from './components/ui/design-system';

function AppLayout() {
  const location = useLocation();
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const { addNotification } = useNotifications();
  
  // Start SePay Webhook event polling globally
  useSepayListener();

  React.useEffect(() => {
    let isMounted = true;
    let ordersChannel: any = null;
    let stockChannel: any = null;

    try {
      // 1. Listen for new orders on Supabase Realtime
      ordersChannel = supabase
        .channel(`realtime-orders-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            if (!isMounted) return;
            console.log('[Realtime] New order received:', payload.new);
            const order = payload.new;
            addNotification(
              'Đơn hàng mới',
              `Đơn hàng ${order.id || ''} trị giá ${Number(order.total || 0).toLocaleString('vi-VN')}đ đã được tạo.`
            );
          }
        )
        .subscribe((status, err) => {
          if (err && isMounted) {
            console.warn('[Realtime ordersChannel warning]', err);
          }
        });

      // 2. Listen for safety stock alerts on warehouse_stock
      stockChannel = supabase
        .channel(`realtime-stock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'warehouse_stock' },
          (payload) => {
            if (!isMounted) return;
            const stock = payload.new;
            const quantity = Number(stock.quantity || 0);
            const safetyStock = Number(stock.safety_stock || 0);
            if (quantity < safetyStock) {
              console.log('[Realtime] Low stock warning:', stock);
              addNotification(
                'Cảnh báo tồn kho',
                `Sản phẩm "${stock.product_name || stock.product_id}" có lượng tồn kho (${quantity}) thấp hơn ngưỡng an toàn (${safetyStock}).`
              );
            }
          }
        )
        .subscribe((status, err) => {
          if (err && isMounted) {
            console.warn('[Realtime stockChannel warning]', err);
          }
        });
    } catch (e) {
      console.warn('[Realtime] Subscription initialization warning:', e);
    }

    return () => {
      isMounted = false;
      // Tránh đóng kênh khi WebSocket handshake đang trong giai đoạn CONNECTING (gây ra WebSocket closed without opened)
      setTimeout(() => {
        try {
          if (ordersChannel) supabase.removeChannel(ordersChannel);
          if (stockChannel) supabase.removeChannel(stockChannel);
        } catch {
          // ignore unmount cleanup warnings
        }
      }, 500);
    };
  }, [addNotification]);

  React.useEffect(() => {
    // Seed offline-first Firestore localStorage mock caches if not present or outdated
    const seedLocalStorageDemoData = () => {
      const CUSTOMERS_DATA = [
        {
          id: 'CUST-001',
          name: 'Thời Trang H&M Vietnam',
          email: 'hm@vietnam.com',
          phone: '0987654321',
          walletBalance: 25000000,
          promoBalance: 3000000,
          totalSpent: 45000000,
          orderCount: 12,
          points: 1250,
          status: 'active',
          segment: 'core',
          rfmScore: { recency: 5, frequency: 5, monetary: 4 },
          activities: [
            { id: 'act_1', type: 'purchase', title: 'Đơn hàng sỉ quần áo nam', description: 'Đã hoàn thành giao dịch sỉ thời trang thu đông trị giá 45M.', date: '2026-05-15', status: 'Hoàn thành' },
            { id: 'act_2', type: 'consultation', title: 'Tư vấn hạn mức tín dụng', description: 'Tư vấn đăng ký hạn mức vay B2B Seller và giải ngân sớm.', date: '2026-05-10', status: 'Hoàn thành' }
          ]
        },
        {
          id: 'CUST-002',
          name: 'Gia Dụng LockLock',
          email: 'locklock@vietnam.com',
          phone: '0912345678',
          walletBalance: 1500000,
          promoBalance: 200000,
          totalSpent: 18000000,
          orderCount: 5,
          points: 180,
          status: 'active',
          segment: 'potential',
          rfmScore: { recency: 4, frequency: 3, monetary: 3 },
          activities: [
            { id: 'act_3', type: 'purchase', title: 'Đơn hàng mua sắm đồ gia dụng', description: 'Đã giao thành công bộ hộp cơm giữ nhiệt.', date: '2026-05-20', status: 'Hoàn thành' }
          ]
        },
        {
          id: 'CUST-003',
          name: 'Mỹ Phẩm Coco Lux',
          email: 'cocolux@vietnam.com',
          phone: '0900112233',
          walletBalance: 12500000,
          promoBalance: 4500000,
          totalSpent: 85000000,
          orderCount: 22,
          points: 3400,
          status: 'active',
          segment: 'core',
          rfmScore: { recency: 5, frequency: 5, monetary: 5 },
          activities: [
            { id: 'act_4', type: 'purchase', title: 'Mua sắm mỹ phẩm sỉ đợt 3', description: 'Hoàn thành đơn hàng son môi và kem chống nắng thương hiệu.', date: '2026-06-01', status: 'Hoàn thành' }
          ]
        }
      ];

      const LEASES_DATA = [
        {
          id: 'LEAS-001',
          phone: '0987654321',
          email: 'hm@vietnam.com',
          deviceModel: 'iPhone 15 Pro Max 256GB (Knox MDM)',
          devicePrice: 35000000,
          upfrontFee: 7000000,
          monthlyFee: 2800000,
          durationMonths: 12,
          knoxStatus: 'normal',
          status: 'active',
          installments: [
            { periodNum: 1, amount: 2800000, dueDate: '2026-04-05', status: 'paid' },
            { periodNum: 2, amount: 2800000, dueDate: '2026-05-05', status: 'paid' },
            { periodNum: 3, amount: 2800000, dueDate: '2026-06-05', status: 'unpaid' }
          ]
        },
        {
          id: 'LEAS-002',
          phone: '0912345678',
          email: 'locklock@vietnam.com',
          deviceModel: 'iPad Pro 11-inch M2 (Knox MDM)',
          devicePrice: 24000000,
          upfrontFee: 4800000,
          monthlyFee: 1900000,
          durationMonths: 12,
          knoxStatus: 'warning',
          status: 'late',
          installments: [
            { periodNum: 1, amount: 1900000, dueDate: '2026-04-10', status: 'paid' },
            { periodNum: 2, amount: 1900000, dueDate: '2026-05-10', status: 'overdue' }
          ]
        }
      ];

      const TRANSACTIONS_DATA = [
        {
          id: 'TX-HM-01',
          date: '2026-06-01',
          description: 'Thanh toán công nợ Thời Trang H&M Vietnam',
          category: 'Thu tiền khách B2B',
          accountingObjectCode: 'CUST-001',
          debitAccount: '1121',
          creditAccount: '131',
          type: 'income',
          amount: 150000000
        },
        {
          id: 'TX-HM-02',
          date: '2026-05-15',
          description: 'Chi giải ngân thanh toán sớm cho Thời Trang H&M Vietnam',
          category: 'Chi trả B2B',
          accountingObjectCode: 'CUST-001',
          debitAccount: '1388',
          creditAccount: '1121',
          type: 'expense',
          amount: 120000000
        },
        {
          id: 'TX-LL-01',
          date: '2026-05-25',
          description: 'Thu tiền bán hàng Gia Dụng LockLock',
          category: 'Thu tiền mặt',
          accountingObjectCode: 'CUST-002',
          debitAccount: '1111',
          creditAccount: '131',
          type: 'income',
          amount: 18000000
        }
      ];

      const PRODUCTS_DATA = [
        ...nexhubProducts
      ];

      const checkAndSeed = (key: string, dataArray: any[]) => {
        const cached = safeLocalStorage.getItem(key);
        const needsSeed = !cached || 
          (key === 'fs_cache_docs_customers' && !cached.includes('CUST-001')) ||
          (key === 'fs_cache_docs_device_leases' && !cached.includes('LEAS-001')) ||
          (key === 'fs_cache_docs_finance_transactions' && !cached.includes('TX-HM-01')) ||
          (key === 'fs_cache_docs_products' && !cached.includes('1073131895'));
          
        if (needsSeed) {
          const docsData = dataArray.map(item => ({
            id: item.id,
            data: item
          }));
          safeLocalStorage.setItem(key, JSON.stringify(docsData));
          console.log(`[Demo-Seeding] Seeded ${key} to localStorage successfully.`);
        }
      };

      checkAndSeed('fs_cache_docs_customers', CUSTOMERS_DATA);
      checkAndSeed('fs_cache_docs_device_leases', LEASES_DATA);
      checkAndSeed('fs_cache_docs_finance_transactions', TRANSACTIONS_DATA);
      checkAndSeed('fs_cache_docs_products', PRODUCTS_DATA);
    };

    seedLocalStorageDemoData();

    const defaultFavicon = `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='8' height='4' x='8' y='2' rx='1' ry='1'/><path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/><path d='M9 12h6'/><path d='M9 16h6'/></svg>`;
    const savedFavicon = safeLocalStorage.getItem('system-favicon') || defaultFavicon;
    const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (faviconLink) {
      faviconLink.href = savedFavicon;
    } else {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = savedFavicon;
      document.head.appendChild(link);
    }
  }, []);

  const isHomePage = location.pathname === '/';
  const isWorkspaceLikePage = ['/omnichat', '/chat', '/operations', '/bi'].includes(location.pathname);

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans bg-slate-900">
      {!isHomePage && <MisaTopBar onOpenCommandPalette={() => setIsCommandPaletteOpen(true)} />}
      <main className={cn(
        "min-w-0 relative",
        isHomePage 
          ? "h-screen w-screen overflow-hidden" 
          : isWorkspaceLikePage
            ? "flex-1 overflow-hidden bg-slate-100"
            : "flex-1 overflow-y-auto bg-slate-100 custom-scrollbar"
      )}>
        <div className={cn(
          "h-full w-full", 
          isHomePage 
            ? "" 
            : isWorkspaceLikePage 
              ? "p-2 sm:p-2.5 overflow-hidden flex flex-col" 
              : "p-4 md:p-6 lg:p-8"
        )}>
          <ErrorBoundary>
            <Suspense fallback={<LoadingScreen />}>
            <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/orders" element={<Orders />} />
    <Route path="/pim" element={<PIM />} />
    <Route path="/sellers" element={<SellerManagement />} />
    <Route path="/marketing" element={<Marketing />} />
    <Route path="/flash-sale" element={<FlashSale />} />
    <Route path="/affiliate" element={<AffiliateManagement />} />
    <Route path="/customers" element={<Customers />} />
    <Route path="/cskh" element={<CustomerService />} />
    <Route path="/scm" element={<Procurement />} />
    <Route path="/warehouse" element={<WarehouseModule />} />
    <Route path="/finance" element={<Finance />} />
    <Route path="/settlement" element={<SettlementManagement />} />
    <Route path="/hr" element={<HumanResources />} />
    <Route path="/performance" element={<Performance />} />
    <Route path="/workspace" element={<Workspace />} />
    <Route path="/bi" element={<ExecutiveCockpit />} />
    <Route path="/operations" element={<ExecutiveCockpit />} />
    <Route path="/sales" element={<SalesManagement />} />
    <Route path="/loyalty" element={<LoyaltyManagement />} />
    <Route path="/wallet" element={<WalletHub />} />
    <Route path="/live" element={<LiveCommerce />} />
    <Route path="/ads" element={<AdManager />} />
    <Route path="/compliance" element={<Compliance />} />
    <Route path="/seller-finance" element={<SellerFinance />} />
    <Route path="/social" element={<SocialCommerce />} />
    <Route path="/workflow" element={<WorkflowHub />} />
    <Route path="/contracts" element={<ContractManager />} />
    <Route path="/sales-contracts" element={<ContractManager defaultTab="quotes" />} />
    <Route path="/documents" element={<DocumentManager />} />
    <Route path="/official-dispatch" element={<DocumentManager />} />
    <Route path="/dochub" element={<DocHub />} />
    <Route path="/risk-management" element={<Compliance />} />
    <Route path="/signature" element={<SignatureHub />} />
    <Route path="/ai-ops" element={<AIOperations />} />
    <Route path="/ai-predictions" element={<AIPredictions />} />
    <Route path="/org" element={<OrgStructure />} />
    <Route path="/vcomm-supermarket" element={<VCommSupermarket />} />
    <Route path="/device-leasing" element={<DeviceLeasing />} />
    <Route path="/assets" element={<AssetManagement />} />
    <Route path="/analytics" element={<AnalyticsBI />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/profile" element={<UserProfile />} />
    <Route path="/e-menu" element={<EMenu />} />
    <Route path="/omnichat" element={<OmniChat />} />
    <Route path="/chat" element={<OmniChat />} />
    <Route path="/mail" element={<MailClient />} />
    <Route path="/procurement" element={<Procurement />} />
    <Route path="/supplier-portal" element={<SupplierPortal />} />
    <Route path="/directory" element={<EmployeeDirectory />} />
    <Route path="/tax-pit" element={<TaxPIT />} />
    <Route path="/okr" element={<OKRManagement />} />
    <Route path="/recruitment" element={<RecruitmentPipeline />} />
    <Route path="/invoices" element={<InvoiceManager />} />
    <Route path="/seller-credit" element={<SellerCredit />} />
    <Route path="/notes" element={<QuickNotes />} />
    <Route path="/storefront" element={<StorefrontManager />} />
    <Route path="/attendance" element={<AttendanceApp />} />
    <Route path="/payroll" element={<PayrollApp />} />
    <Route path="/employees" element={<EmployeesApp />} />
    <Route path="/insurance" element={<InsuranceApp />} />
    <Route path="/labor-compliance" element={<LaborCompliance />} />
    <Route path="/ess" element={<EmployeeSelfService />} />
    <Route path="/it-helpdesk" element={<ITHelpdesk />} />
    <Route path="/lms" element={<LMSManagement />} />
    <Route path="*" element={<Dashboard />} />
  </Routes>
  </Suspense>        
        </ErrorBoundary>
          <Suspense fallback={null}>
            <ErrorBoundary fallback={null}>
              <ErpCopilot />
            </ErrorBoundary>
          </Suspense>
        </div>
      </main>
      {isCommandPaletteOpen && (
        <CommandPalette onClose={() => setIsCommandPaletteOpen(false)} />
      )}
      <UniversalEntityPeekDrawer />
    </div>
  );
}

function AppContent() {
  const { user, loading, isStaff } = useAuth();
  
  // Public E-Menu and Supplier Portal routes bypass standard staff-only authentication checks
  const isPublicEMenu = window.location.pathname.startsWith('/emenu/');
  const isSupplierPortal = window.location.pathname.startsWith('/supplier-portal');

  if (isPublicEMenu) {
    return (
      <Router>
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/emenu/:tableId" element={<EMenu />} />
            </Routes>
          </Suspense>        
        </ErrorBoundary>
      </Router>
    );
  }

  if (isSupplierPortal) {
    return (
      <Router>
        <ErrorBoundary>
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/supplier-portal" element={<SupplierPortal />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </Router>
    );
  }

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginPage />;
  if (!isStaff) return <AccessDenied />;

  return (
    <Router>
      <EntityProvider>
        <AppLayout />
      </EntityProvider>
    </Router>
  );
}

import { PreferencesProvider } from './context/PreferencesContext';
import { NotificationProvider } from './context/NotificationContext';

export default function App() {
  return (
  <PreferencesProvider>
  <NotificationProvider>
  <StoreProvider>
  <AppContent />
  </StoreProvider>
  </NotificationProvider>
  </PreferencesProvider>
  );
}
