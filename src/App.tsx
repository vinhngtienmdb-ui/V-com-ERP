import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { safeLocalStorage } from './lib/storage';
import nexhubProducts from './constants/nexhub_products.json';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
const Dashboard = React.lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const Home = React.lazy(() => import('./components/Home').then(m => ({ default: m.Home })));
const Orders = React.lazy(() => import('./components/Orders').then(m => ({ default: m.Orders })));
const PIM = React.lazy(() => import('./components/PIM').then(m => ({ default: m.PIM })));
const SellerManagement = React.lazy(() => import('./components/Sellers').then(m => ({ default: m.SellerManagement })));
const Customers = React.lazy(() => import('./components/Customers').then(m => ({ default: m.Customers })));
const Marketing = React.lazy(() => import('./components/Marketing').then(m => ({ default: m.Marketing })));
const FlashSale = React.lazy(() => import('./components/FlashSale').then(m => ({ default: m.FlashSale })));
const AffiliateManagement = React.lazy(() => import('./components/Affiliate').then(m => ({ default: m.AffiliateManagement })));
const WarehouseModule = React.lazy(() => import('./components/Warehouse').then(m => ({ default: m.WarehouseModule })));
const Procurement = React.lazy(() => import('./components/Procurement').then(m => ({ default: m.Procurement })));
const Finance = React.lazy(() => import('./components/Finance').then(m => ({ default: m.Finance })));
const SettlementManagement = React.lazy(() => import('./components/Settlement').then(m => ({ default: m.SettlementManagement })));
const HumanResources = React.lazy(() => import('./components/HR').then(m => ({ default: m.HumanResources })));
const Performance = React.lazy(() => import('./components/Performance').then(m => ({ default: m.Performance })));
const Workspace = React.lazy(() => import('./components/Workspace').then(m => ({ default: m.Workspace })));
const AnalyticsBI = React.lazy(() => import('./components/AnalyticsBI').then(m => ({ default: m.AnalyticsBI })));
const SalesManagement = React.lazy(() => import('./components/Sales').then(m => ({ default: m.SalesManagement })));
const LoyaltyManagement = React.lazy(() => import('./components/Loyalty').then(m => ({ default: m.LoyaltyManagement })));
const SettingsPage = React.lazy(() => import('./components/Settings').then(m => ({ default: m.SettingsPage })));
const UserProfile = React.lazy(() => import('./components/UserProfile').then(m => ({ default: m.UserProfile })));
const WalletHub = React.lazy(() => import('./components/Wallet').then(m => ({ default: m.WalletHub })));
const LiveCommerce = React.lazy(() => import('./components/LiveCommerce').then(m => ({ default: m.LiveCommerce })));
const AdManager = React.lazy(() => import('./components/AdManager').then(m => ({ default: m.AdManager })));
const Compliance = React.lazy(() => import('./components/Compliance').then(m => ({ default: m.Compliance })));
const SellerFinance = React.lazy(() => import('./components/SellerFinance').then(m => ({ default: m.SellerFinance })));
const SocialCommerce = React.lazy(() => import('./components/SocialCommerce').then(m => ({ default: m.SocialCommerce })));
const OmniChat = React.lazy(() => import('./components/OmniChat').then(m => ({ default: m.OmniChat })));
const WorkflowHub = React.lazy(() => import('./components/WorkflowHub').then(m => ({ default: m.WorkflowHub })));
const AIOperations = React.lazy(() => import('./components/AIOperations').then(m => ({ default: m.AIOperations })));
const AIChatBot = React.lazy(() => import('./components/AIChatBot').then(m => ({ default: m.AIChatBot })));
const OrgStructure = React.lazy(() => import('./components/OrgStructure').then(m => ({ default: m.OrgStructure })));
const IPosModule = React.lazy(() => import('./components/IPos').then(m => ({ default: m.IPosModule })));
const EMenu = React.lazy(() => import('./components/EMenu').then(m => ({ default: m.EMenu })));
const CustomerService = React.lazy(() => import('./components/CustomerService').then(m => ({ default: m.CustomerService })));
const RequestHub = React.lazy(() => import('./components/RequestHub').then(m => ({ default: m.RequestHub })));
const ContractManager = React.lazy(() => import('./components/ContractManager').then(m => ({ default: m.ContractManager })));
const DocumentManager = React.lazy(() => import('./components/DocumentManager').then(m => ({ default: m.DocumentManager })));
const SignatureHub = React.lazy(() => import('./components/SignatureHub').then(m => ({ default: m.SignatureHub })));
const VCommSupermarket = React.lazy(() => import('./components/VCommSupermarket').then(m => ({ default: m.VCommSupermarket })));
const DeviceLeasing = React.lazy(() => import('./components/DeviceLeasing').then(m => ({ default: m.DeviceLeasing })));

const IPosSettings = React.lazy(() => import('./components/IPosSettings').then(m => ({ default: m.IPosSettings })));

import { useAuth } from './context/AuthContext';
import { useSepayListener } from './hooks/useSepayListener';
import { StoreProvider } from './context/StoreContext';
import { StoreSelector } from './components/StoreSelector';
import { LoginPage } from './components/LoginPage';
import { LoadingScreen } from './components/LoadingScreen';
import { AccessDenied } from './components/AccessDenied';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppLayout() {
  const location = useLocation();
  
  // Start SePay Webhook event polling globally
  useSepayListener();

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
        {
          id: 'PRD-IP15PM',
          name: 'iPhone 15 Pro Max 256GB - VN/A',
          sku: 'APP-IP15PM-256',
          price: 34990000,
          costPrice: 31000000,
          hiddenCosts: 0,
          margin: 11.4,
          profit: 3990000,
          stock: 45,
          category: 'Thiết bị số',
          brand: 'Apple',
          sellerName: 'VComm Electronics',
          status: 'in_stock',
          image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80',
          weight: '221',
          dimensions: '159.9 x 76.7 x 8.25'
        },
        {
          id: 'PRD-MBA-M2',
          name: 'MacBook Air M2 13.6" 8CPU 8GPU 8GB/256GB',
          sku: 'APP-MBA-M2-8-256',
          price: 26490000,
          costPrice: 23500000,
          hiddenCosts: 0,
          margin: 11.2,
          profit: 2990000,
          stock: 20,
          category: 'Thiết bị số',
          brand: 'Apple',
          sellerName: 'VComm Electronics',
          status: 'in_stock',
          image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
          weight: '1240',
          dimensions: '304.1 x 215 x 11.3'
        },
        {
          id: 'PRD-MX-MINI',
          name: 'Bàn phím cơ không dây Logitech MX Mechanical Mini',
          sku: 'LOG-MX-MECH-MINI',
          price: 3590000,
          costPrice: 2800000,
          hiddenCosts: 0,
          margin: 22,
          profit: 790000,
          stock: 120,
          category: 'Phụ kiện',
          brand: 'Logitech',
          sellerName: 'VComm Accessories',
          status: 'in_stock',
          image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&q=80',
          weight: '612',
          dimensions: '312.6 x 131.5 x 26.1'
        },
        {
          id: 'PRD-MX-3S',
          name: 'Chuột không dây Logitech MX Master 3S',
          sku: 'LOG-MX-MASTER-3S',
          price: 2590000,
          costPrice: 1900000,
          hiddenCosts: 0,
          margin: 26.6,
          profit: 690000,
          stock: 85,
          category: 'Phụ kiện',
          brand: 'Logitech',
          sellerName: 'VComm Accessories',
          status: 'pending_approval',
          image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=400&q=80',
          weight: '141',
          dimensions: '124.9 x 84.3 x 51'
        },
        {
          id: 'PRD-SONY-2470',
          name: 'Sony FE 24-70mm f/2.8 GM II',
          sku: 'SONY-SEL2470GM2',
          price: 45990000,
          costPrice: 40000000,
          hiddenCosts: 0,
          margin: 13,
          profit: 5990000,
          stock: 8,
          category: 'Nhiếp ảnh',
          brand: 'Sony',
          sellerName: 'Camera Pro Studio',
          status: 'in_stock',
          image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
          weight: '695',
          dimensions: '87.8 x 119.9 x 87.8'
        },
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

  return (
  <div className="flex h-screen bg-slate-50 overflow-hidden erp-modernized">
  <Sidebar />
  <div className="flex-1 flex flex-col min-w-0">
  <Header />
  <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
  <div className="max-w-7xl mx-auto h-full col-span-12">
  <ErrorBoundary>
  <Suspense fallback={<LoadingScreen />}>
            <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/ipos" element={<IPosModule />} />
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
    <Route path="/bi" element={<AnalyticsBI />} />
    <Route path="/sales" element={<SalesManagement />} />
    <Route path="/loyalty" element={<LoyaltyManagement />} />
    <Route path="/wallet" element={<WalletHub />} />
    <Route path="/live" element={<LiveCommerce />} />
    <Route path="/ads" element={<AdManager />} />
    <Route path="/compliance" element={<Compliance />} />
    <Route path="/seller-finance" element={<SellerFinance />} />
    <Route path="/social" element={<SocialCommerce />} />
    <Route path="/workflow" element={<WorkflowHub />} />
    <Route path="/requests" element={<RequestHub />} />
    <Route path="/contracts" element={<ContractManager />} />
    <Route path="/documents" element={<DocumentManager />} />
    <Route path="/signature" element={<SignatureHub />} />
    <Route path="/ipos-settings" element={<IPosSettings />} />
    <Route path="/ai-ops" element={<AIOperations />} />
    <Route path="/org" element={<OrgStructure />} />
    <Route path="/vcomm-supermarket" element={<VCommSupermarket />} />
    <Route path="/device-leasing" element={<DeviceLeasing />} />
    <Route path="/analytics" element={<AnalyticsBI />} />
    <Route path="/settings" element={<SettingsPage />} />
    <Route path="/profile" element={<UserProfile />} />
    <Route path="*" element={<Dashboard />} />
  </Routes>
  </Suspense>        
        </ErrorBoundary>
  <AIChatBot />
  </div>
  </main>
  </div>
  </div>
  );
}

function AppContent() {
  const { user, loading, isStaff } = useAuth();
  
  // Public E-Menu route bypasses auth
  const isPublicEMenu = window.location.pathname.startsWith('/emenu/');

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

  if (loading) return <LoadingScreen />;
  if (!user) return <LoginPage />;
  if (!isStaff) return <AccessDenied />;

  return (
  <Router>
  <AppLayout />
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
