import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import * as Sentry from '@sentry/react';
// Self-host Inter (weights phổ biến) — tự fallback nếu thiếu Vietnamese subset.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';

// Sentry: chỉ bật khi có DSN + môi trường production.
// VITE_SENTRY_DSN = lấy từ Sentry Project Settings.
const SENTRY_DSN = (import.meta as any).env?.VITE_SENTRY_DSN;
if (SENTRY_DSN && (import.meta as any).env?.PROD) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: 'production',
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,    // 10% trace
    replaysSessionSampleRate: 0, // không session replay (privacy)
    replaysOnErrorSampleRate: 0.1,
    release: (import.meta as any).env?.VITE_RELEASE ?? 'dev',
  });
}

createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <AuthProvider>
 <App />
 </AuthProvider>
 </StrictMode>,
);
