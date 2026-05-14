import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
// Self-host Inter (weights phổ biến) — tự fallback nếu thiếu Vietnamese subset.
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';

createRoot(document.getElementById('root')!).render(
 <StrictMode>
 <AuthProvider>
 <App />
 </AuthProvider>
 </StrictMode>,
);
