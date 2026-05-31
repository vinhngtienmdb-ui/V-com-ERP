import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { safeLocalStorage } from './lib/storage';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Home } from './components/Home';
import { Orders } from './components/Orders';
import { PIM } from './components/PIM';
import { SellerManagement } from './components/Sellers';
import { Customers } from './components/Customers';
import { Marketing } from './components/Marketing';
import { FlashSale } from './components/FlashSale';
import { AffiliateManagement } from './components/Affiliate';
import { WarehouseModule } from './components/Warehouse';
import { Procurement } from './components/Procurement';
import { Finance } from './components/Finance';
import { SettlementManagement } from './components/Settlement';
import { HumanResources } from './components/HR';
import { Performance } from './components/Performance';
import { Workspace } from './components/Workspace';
import { AnalyticsBI } from './components/AnalyticsBI';
import { SalesManagement } from './components/Sales';
import { LoyaltyManagement } from './components/Loyalty';
import { SettingsPage } from './components/Settings';
import { UserProfile } from './components/UserProfile';
import { WalletHub } from './components/Wallet';
import { LiveCommerce } from './components/LiveCommerce';
import { AdManager } from './components/AdManager';
import { Compliance } from './components/Compliance';
import { SellerFinance } from './components/SellerFinance';
import { SocialCommerce } from './components/SocialCommerce';
import { OmniChat } from './components/OmniChat';
import { WorkflowHub } from './components/WorkflowHub';
import { AIOperations } from './components/AIOperations';
import { AIChatBot } from './components/AIChatBot';
import { OrgStructure } from './components/OrgStructure';
import { IPosModule } from './components/IPos';
import { EMenu } from './components/EMenu';
import { CustomerService } from './components/CustomerService';
import { RequestHub } from './components/RequestHub';
import { ContractManager } from './components/ContractManager';
import { DocumentManager } from './components/DocumentManager';
import { SignatureHub } from './components/SignatureHub';
import { VCommSupermarket } from './components/VCommSupermarket';
import { DeviceLeasing } from './components/DeviceLeasing';

import { IPosSettings } from './components/IPosSettings';

import { useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { StoreSelector } from './components/StoreSelector';
import { LoginPage } from './components/LoginPage';
import { LoadingScreen } from './components/LoadingScreen';
import { AccessDenied } from './components/AccessDenied';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppLayout() {
  const location = useLocation();

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
  <div className="flex h-screen bg-slate-50 overflow-hidden">
  <Sidebar />
  <div className="flex-1 flex flex-col min-w-0">
  <Header />
  <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
  <div className="max-w-7xl mx-auto h-full col-span-12">
  <ErrorBoundary>
  
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
  
            <Routes>
  <Route path="/emenu/:tableId" element={<EMenu />} />
  </Routes>
          
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
