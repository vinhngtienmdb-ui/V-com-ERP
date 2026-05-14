import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
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
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
