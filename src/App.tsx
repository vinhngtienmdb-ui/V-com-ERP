import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Home } from './components/Home';
import { LoginPage } from './components/LoginPage';
import { LoadingScreen } from './components/LoadingScreen';
import { AccessDenied } from './components/AccessDenied';
import { AIChatBot } from './components/AIChatBot';
import { RequireRole } from './components/RequireRole';

import { useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { NotificationProvider } from './context/NotificationContext';

// ── Lazy-loaded modules ─────────────────────────────────────────────────────
// Mỗi module một chunk riêng → bundle khởi tạo giảm mạnh (IPos.tsx một mình
// đã 6091 dòng; HR.tsx 2786; Settings.tsx 2496; PIM.tsx 1572).
const Dashboard           = React.lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const Orders              = React.lazy(() => import('./components/Orders').then(m => ({ default: m.Orders })));
const PIM                 = React.lazy(() => import('./components/PIM').then(m => ({ default: m.PIM })));
const SellerManagement    = React.lazy(() => import('./components/Sellers').then(m => ({ default: m.SellerManagement })));
const Customers           = React.lazy(() => import('./components/Customers').then(m => ({ default: m.Customers })));
const Marketing           = React.lazy(() => import('./components/Marketing').then(m => ({ default: m.Marketing })));
const FlashSale           = React.lazy(() => import('./components/FlashSale').then(m => ({ default: m.FlashSale })));
const AffiliateManagement = React.lazy(() => import('./components/Affiliate').then(m => ({ default: m.AffiliateManagement })));
const WarehouseModule     = React.lazy(() => import('./components/Warehouse').then(m => ({ default: m.WarehouseModule })));
const Procurement         = React.lazy(() => import('./components/Procurement').then(m => ({ default: m.Procurement })));
const Finance             = React.lazy(() => import('./components/Finance').then(m => ({ default: m.Finance })));
const SettlementManagement= React.lazy(() => import('./components/Settlement').then(m => ({ default: m.SettlementManagement })));
const HumanResources      = React.lazy(() => import('./components/HR').then(m => ({ default: m.HumanResources })));
const Performance         = React.lazy(() => import('./components/Performance').then(m => ({ default: m.Performance })));
const Workspace           = React.lazy(() => import('./components/Workspace').then(m => ({ default: m.Workspace })));
const AnalyticsBI         = React.lazy(() => import('./components/AnalyticsBI').then(m => ({ default: m.AnalyticsBI })));
const SalesManagement     = React.lazy(() => import('./components/Sales').then(m => ({ default: m.SalesManagement })));
const LoyaltyManagement   = React.lazy(() => import('./components/Loyalty').then(m => ({ default: m.LoyaltyManagement })));
const SettingsPage        = React.lazy(() => import('./components/Settings').then(m => ({ default: m.SettingsPage })));
const UserProfile         = React.lazy(() => import('./components/UserProfile').then(m => ({ default: m.UserProfile })));
const WalletHub           = React.lazy(() => import('./components/Wallet').then(m => ({ default: m.WalletHub })));
const LiveCommerce        = React.lazy(() => import('./components/LiveCommerce').then(m => ({ default: m.LiveCommerce })));
const AdManager           = React.lazy(() => import('./components/AdManager').then(m => ({ default: m.AdManager })));
const Compliance          = React.lazy(() => import('./components/Compliance').then(m => ({ default: m.Compliance })));
const SellerFinance       = React.lazy(() => import('./components/SellerFinance').then(m => ({ default: m.SellerFinance })));
const SocialCommerce      = React.lazy(() => import('./components/SocialCommerce').then(m => ({ default: m.SocialCommerce })));
const WorkflowHub         = React.lazy(() => import('./components/WorkflowHub').then(m => ({ default: m.WorkflowHub })));
const AIOperations        = React.lazy(() => import('./components/AIOperations').then(m => ({ default: m.AIOperations })));
const OrgStructure        = React.lazy(() => import('./components/OrgStructure').then(m => ({ default: m.OrgStructure })));
const IPosModule          = React.lazy(() => import('./components/IPos').then(m => ({ default: m.IPosModule })));
const EMenu               = React.lazy(() => import('./components/EMenu').then(m => ({ default: m.EMenu })));
const CustomerService     = React.lazy(() => import('./components/CustomerService').then(m => ({ default: m.CustomerService })));
const RequestHub          = React.lazy(() => import('./components/RequestHub').then(m => ({ default: m.RequestHub })));
const ContractManager     = React.lazy(() => import('./components/ContractManager').then(m => ({ default: m.ContractManager })));
const DocumentManager     = React.lazy(() => import('./components/DocumentManager').then(m => ({ default: m.DocumentManager })));
const SignatureHub        = React.lazy(() => import('./components/SignatureHub').then(m => ({ default: m.SignatureHub })));
const IPosSettings        = React.lazy(() => import('./components/IPosSettings').then(m => ({ default: m.IPosSettings })));

// Bọc nhanh các route nhạy cảm. Server vẫn enforce qua firestore.rules
// (custom claims) — đây là UX guard để không hiển thị nội dung "rỗng do permission denied".
const Manager  = ['admin', 'director', 'manager'] as const;
const FinOps   = ['admin', 'director', 'manager'] as const; // /finance
const HROnly   = ['admin', 'director'] as const;            // /hr, /settlement, /seller-finance
const AdminOnly = ['admin'] as const;                       // /settings, /signature

function AppLayout() {
  const location = useLocation();
  const isIPos = location.pathname === '/ipos';

  React.useEffect(() => {
    const savedFavicon = localStorage.getItem('system-favicon');
    if (savedFavicon) {
      const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (faviconLink) {
        faviconLink.href = savedFavicon;
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = savedFavicon;
        document.head.appendChild(link);
      }
    }
  }, []);

  if (isIPos) {
    return (
      <div className="h-screen w-screen bg-slate-50 overflow-hidden">
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/ipos" element={<IPosModule />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
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

              {/* ── Tài chính & nhân sự — chặn client + rules server-side ── */}
              <Route path="/finance"        element={<RequireRole roles={[...FinOps]}><Finance /></RequireRole>} />
              <Route path="/settlement"     element={<RequireRole roles={[...HROnly]}><SettlementManagement /></RequireRole>} />
              <Route path="/seller-finance" element={<RequireRole roles={[...HROnly]}><SellerFinance /></RequireRole>} />
              <Route path="/wallet"         element={<RequireRole roles={[...FinOps]}><WalletHub /></RequireRole>} />
              <Route path="/hr"             element={<RequireRole roles={[...HROnly]}><HumanResources /></RequireRole>} />
              <Route path="/performance"    element={<RequireRole roles={[...Manager]}><Performance /></RequireRole>} />
              <Route path="/compliance"     element={<RequireRole roles={[...Manager]}><Compliance /></RequireRole>} />
              <Route path="/signature"      element={<RequireRole roles={[...AdminOnly]}><SignatureHub /></RequireRole>} />
              <Route path="/settings"       element={<RequireRole roles={[...AdminOnly]}><SettingsPage /></RequireRole>} />
              <Route path="/ipos-settings"  element={<RequireRole roles={[...AdminOnly]}><IPosSettings /></RequireRole>} />
              <Route path="/contracts"      element={<RequireRole roles={[...Manager]}><ContractManager /></RequireRole>} />
              <Route path="/documents"      element={<RequireRole roles={[...Manager]}><DocumentManager /></RequireRole>} />

              {/* ── Mở cho mọi staff ── */}
              <Route path="/workspace"   element={<Workspace />} />
              <Route path="/bi"          element={<AnalyticsBI />} />
              <Route path="/sales"       element={<SalesManagement />} />
              <Route path="/loyalty"     element={<LoyaltyManagement />} />
              <Route path="/live"        element={<LiveCommerce />} />
              <Route path="/ads"         element={<AdManager />} />
              <Route path="/social"      element={<SocialCommerce />} />
              <Route path="/workflow"    element={<WorkflowHub />} />
              <Route path="/requests"    element={<RequestHub />} />
              <Route path="/ai-ops"      element={<AIOperations />} />
              <Route path="/org"         element={<OrgStructure />} />
              <Route path="/analytics"   element={<AnalyticsBI />} />
              <Route path="/profile"     element={<UserProfile />} />
              <Route path="*"            element={<Dashboard />} />
            </Routes>
          </Suspense>
          <AIChatBot />
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
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/emenu/:tableId" element={<EMenu />} />
          </Routes>
        </Suspense>
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
    <PreferencesProvider>
      <NotificationProvider>
        <StoreProvider>
          <AppContent />
        </StoreProvider>
      </NotificationProvider>
    </PreferencesProvider>
  );
}
