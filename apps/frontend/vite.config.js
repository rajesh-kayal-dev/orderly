import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'gateway-api-middleware',
      async configureServer(server) {
        const { createGatewayApp } = await import('../gateway/src/app.ts');
        const gateway = createGatewayApp();
        server.middlewares.use('/api', (req, res, next) => {
          gateway(req, res, next);
        });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    modulePreload: {
      polyfill: false,
    },
  },
});
