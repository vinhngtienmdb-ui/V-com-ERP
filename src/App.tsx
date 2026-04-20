import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
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
import { useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { StoreSelector } from './components/StoreSelector';
import { LoginPage } from './components/LoginPage';
import { LoadingScreen } from './components/LoadingScreen';
import { AccessDenied } from './components/AccessDenied';

function AppLayout() {
  const location = useLocation();
  const isIPos = location.pathname === '/ipos';

  if (isIPos) {
    return (
      <div className="h-screen w-screen bg-slate-50 overflow-hidden">
        <Routes>
          <Route path="/ipos" element={<IPosModule />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto h-full">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/pim" element={<PIM />} />
              <Route path="/sellers" element={<SellerManagement />} />
              <Route path="/marketing" element={<Marketing />} />
              <Route path="/flash-sale" element={<FlashSale />} />
              <Route path="/affiliate" element={<AffiliateManagement />} />
              <Route path="/customers" element={<Customers />} />
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
              <Route path="/omnichat" element={<OmniChat />} />
              <Route path="/workflow" element={<WorkflowHub />} />
              <Route path="/ai-ops" element={<AIOperations />} />
              <Route path="/org" element={<OrgStructure />} />
              <Route path="/analytics" element={<AnalyticsBI />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
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
        <Routes>
          <Route path="/emenu/:tableId" element={<EMenu />} />
        </Routes>
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

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
