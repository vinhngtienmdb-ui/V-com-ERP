import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { NotificationProvider } from './context/NotificationContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoadingScreen } from './components/LoadingScreen';

// Eagerly loaded — required for every authenticated session
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LoginPage } from './components/LoginPage';
import { AccessDenied } from './components/AccessDenied';
import { Breadcrumb } from './components/Breadcrumb';
import { ShortcutsModal } from './components/ShortcutsModal';

// Lazy-loaded route components
const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const Home = lazy(() => import('./components/Home').then(m => ({ default: m.Home })));
const Orders = lazy(() => import('./components/Orders').then(m => ({ default: m.Orders })));
const PIM = lazy(() => import('./components/PIM').then(m => ({ default: m.PIM })));
const SellerManagement = lazy(() => import('./components/Sellers').then(m => ({ default: m.SellerManagement })));
const Customers = lazy(() => import('./components/Customers').then(m => ({ default: m.Customers })));
const Marketing = lazy(() => import('./components/Marketing').then(m => ({ default: m.Marketing })));
const FlashSale = lazy(() => import('./components/FlashSale').then(m => ({ default: m.FlashSale })));
const AffiliateManagement = lazy(() => import('./components/Affiliate').then(m => ({ default: m.AffiliateManagement })));
const WarehouseModule = lazy(() => import('./components/Warehouse').then(m => ({ default: m.WarehouseModule })));
const Procurement = lazy(() => import('./components/Procurement').then(m => ({ default: m.Procurement })));
const Finance = lazy(() => import('./components/Finance').then(m => ({ default: m.Finance })));
const SettlementManagement = lazy(() => import('./components/Settlement').then(m => ({ default: m.SettlementManagement })));
const HumanResources = lazy(() => import('./components/HR').then(m => ({ default: m.HumanResources })));
const Performance = lazy(() => import('./components/Performance').then(m => ({ default: m.Performance })));
const Workspace = lazy(() => import('./components/Workspace').then(m => ({ default: m.Workspace })));
const AnalyticsBI = lazy(() => import('./components/AnalyticsBI').then(m => ({ default: m.AnalyticsBI })));
const SalesManagement = lazy(() => import('./components/Sales').then(m => ({ default: m.SalesManagement })));
const LoyaltyManagement = lazy(() => import('./components/Loyalty').then(m => ({ default: m.LoyaltyManagement })));
const SettingsPage = lazy(() => import('./components/Settings').then(m => ({ default: m.SettingsPage })));
const UserProfile = lazy(() => import('./components/UserProfile').then(m => ({ default: m.UserProfile })));
const WalletHub = lazy(() => import('./components/Wallet').then(m => ({ default: m.WalletHub })));
const LiveCommerce = lazy(() => import('./components/LiveCommerce').then(m => ({ default: m.LiveCommerce })));
const AdManager = lazy(() => import('./components/AdManager').then(m => ({ default: m.AdManager })));
const Compliance = lazy(() => import('./components/Compliance').then(m => ({ default: m.Compliance })));
const SellerFinance = lazy(() => import('./components/SellerFinance').then(m => ({ default: m.SellerFinance })));
const SocialCommerce = lazy(() => import('./components/SocialCommerce').then(m => ({ default: m.SocialCommerce })));
const OmniChat = lazy(() => import('./components/OmniChat').then(m => ({ default: m.OmniChat })));
const WorkflowHub = lazy(() => import('./components/WorkflowHub').then(m => ({ default: m.WorkflowHub })));
const AIOperations = lazy(() => import('./components/AIOperations').then(m => ({ default: m.AIOperations })));
const AIChatBot = lazy(() => import('./components/AIChatBot').then(m => ({ default: m.AIChatBot })));
const OrgStructure = lazy(() => import('./components/OrgStructure').then(m => ({ default: m.OrgStructure })));
const IPosModule = lazy(() => import('./components/IPos').then(m => ({ default: m.IPosModule })));
const EMenu = lazy(() => import('./components/EMenu').then(m => ({ default: m.EMenu })));
const CustomerService = lazy(() => import('./components/CustomerService').then(m => ({ default: m.CustomerService })));
const RequestHub = lazy(() => import('./components/RequestHub').then(m => ({ default: m.RequestHub })));
const ContractManager = lazy(() => import('./components/ContractManager').then(m => ({ default: m.ContractManager })));
const DocumentManager = lazy(() => import('./components/DocumentManager').then(m => ({ default: m.DocumentManager })));
const SignatureHub = lazy(() => import('./components/SignatureHub').then(m => ({ default: m.SignatureHub })));
const IPosSettings = lazy(() => import('./components/IPosSettings').then(m => ({ default: m.IPosSettings })));

const RouteFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
  </div>
);

function RequireRole({ roles, children }: { roles: string[]; children: React.ReactNode }) {
  const { staffInfo, loading } = useAuth();
  if (loading) return <RouteFallback />;
  if (!staffInfo || !roles.includes(staffInfo.role)) return <AccessDenied />;
  return <>{children}</>;
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isIPos = location.pathname === '/ipos';
  const [showShortcuts, setShowShortcuts] = React.useState(false);

  // G+* navigation shortcuts
  React.useEffect(() => {
    let gPressed = false;
    let gTimer: ReturnType<typeof setTimeout>;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;
      if (e.key === '?') { setShowShortcuts(s => !s); return; }
      if (e.key === 'g' || e.key === 'G') {
        gPressed = true;
        gTimer = setTimeout(() => { gPressed = false; }, 1000);
        return;
      }
      if (gPressed) {
        clearTimeout(gTimer);
        gPressed = false;
        const map: Record<string, string> = { d: '/dashboard', o: '/orders', p: '/pim', c: '/customers', f: '/finance', s: '/settings', h: '/hr', w: '/warehouse' };
        const dest = map[e.key.toLowerCase()];
        if (dest) navigate(dest);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  React.useEffect(() => {
    const savedFavicon = localStorage.getItem('system-favicon');
    if (!savedFavicon) return;
    // Only allow data URIs or same-origin URLs to prevent open redirect via favicon
    const isSafe = savedFavicon.startsWith('data:image/') || savedFavicon.startsWith('/');
    if (!isSafe) return;

    let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = savedFavicon;
  }, []);

  if (isIPos) {
    return (
      <div className="h-screen w-screen bg-slate-50 overflow-hidden">
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/ipos" element={<IPosModule />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--surface-0)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white border-l border-[#E5E7EB]">
        <Header />
        <main className="flex-1 overflow-y-auto px-5 pt-4 pb-8 custom-scrollbar bg-[#F9FAFB]">
          <div className="max-w-[1600px] mx-auto h-full">
            <Breadcrumb />
            <ErrorBoundary>
              <Suspense fallback={<RouteFallback />}>
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
                  <Route path="/finance" element={<RequireRole roles={['admin','manager','director']}><Finance /></RequireRole>} />
                  <Route path="/settlement" element={<RequireRole roles={['admin','director']}><SettlementManagement /></RequireRole>} />
                  <Route path="/hr" element={<RequireRole roles={['admin','director']}><HumanResources /></RequireRole>} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/workspace" element={<Workspace />} />
                  <Route path="/bi" element={<AnalyticsBI />} />
                  <Route path="/analytics" element={<AnalyticsBI />} />
                  <Route path="/sales" element={<SalesManagement />} />
                  <Route path="/loyalty" element={<LoyaltyManagement />} />
                  <Route path="/wallet" element={<WalletHub />} />
                  <Route path="/live" element={<LiveCommerce />} />
                  <Route path="/ads" element={<AdManager />} />
                  <Route path="/compliance" element={<Compliance />} />
                  <Route path="/seller-finance" element={<SellerFinance />} />
                  <Route path="/social" element={<SocialCommerce />} />
                  <Route path="/omni" element={<OmniChat />} />
                  <Route path="/workflow" element={<WorkflowHub />} />
                  <Route path="/requests" element={<RequestHub />} />
                  <Route path="/contracts" element={<ContractManager />} />
                  <Route path="/documents" element={<DocumentManager />} />
                  <Route path="/signature" element={<SignatureHub />} />
                  <Route path="/ipos-settings" element={<IPosSettings />} />
                  <Route path="/ai-ops" element={<AIOperations />} />
                  <Route path="/org" element={<OrgStructure />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/profile" element={<UserProfile />} />
                  <Route path="*" element={<Dashboard />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
            <Suspense fallback={null}>
              <AIChatBot />
            </Suspense>
          </div>
        </main>
      </div>
      {showShortcuts && <ShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}

function AppContent() {
  const { user, loading, isStaff } = useAuth();

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
    <ErrorBoundary>
      <PreferencesProvider>
        <NotificationProvider>
          <StoreProvider>
            <AppContent />
          </StoreProvider>
        </NotificationProvider>
      </PreferencesProvider>
    </ErrorBoundary>
  );
}
