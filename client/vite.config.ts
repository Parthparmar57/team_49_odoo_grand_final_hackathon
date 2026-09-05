import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy: any) => {
          proxy.on('error', (_err: any, _req: any, res: any) => {
            // Suppress noisy ECONNREFUSED during server restarts and return clean 503
            if (res && typeof res.writeHead === 'function' && !res.headersSent) {
              try {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Backend service unavailable or restarting' }));
              } catch (_) {}
            }
          });
        },
      },
    },
  },
});
