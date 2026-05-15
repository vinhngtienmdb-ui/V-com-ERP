import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // env vẫn được load để các plugin Vite khác có thể đọc trong tương lai (eg. VITE_*).
  loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    // KHÔNG nhúng GEMINI_API_KEY vào client bundle — gọi qua /api/ai/chat (server-only).
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Split vendor chunks để giảm initial bundle + tận dụng cache giữa các deploy.
      // Mục tiêu: initial chunk < 250 KB gzipped.
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (id.includes('react-router-dom') || id.includes('/react-dom/') || id.includes('/react/')) {
              return 'react-vendor';
            }
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('recharts')) return 'charts';
            if (id.includes('motion')) return 'motion';
            if (id.includes('react-grid-layout') || id.includes('reactflow') || id.includes('react-virtuoso')) {
              return 'data-viz';
            }
            if (id.includes('@google/genai')) return 'ai-sdk';
            if (id.includes('html5-qrcode')) return 'scanner';
            if (id.includes('lucide-react')) return 'icons';
            return 'vendor';
          },
        },
      },
      // Cảnh báo chunk > 600 KB (tăng từ 500 default cho phù hợp với app ERP lớn).
      chunkSizeWarningLimit: 600,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
