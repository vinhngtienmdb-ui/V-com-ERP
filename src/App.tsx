import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { safeLocalStorage } from './lib/storage';

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
