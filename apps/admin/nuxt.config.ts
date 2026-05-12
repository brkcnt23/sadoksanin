export default defineNuxtConfig({
  ssr: false, // Admin panel as SPA — no SEO concerns, faster TTFB.
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@pinia/nuxt',
  ],
  icon: {
    serverBundle: 'local',
    clientBundle: {
      // Bake icons used in the build into the bundle for offline/dev speed
      scan: true,
      sizeLimitKb: 512,
    },
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.ADMIN_API_BASE || 'http://localhost:3001',
    },
  },
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: false, // Use IDE + pnpm type-check instead.
  },
  app: {
    head: {
      title: 'Sadöksan Yönetim Paneli',
      htmlAttrs: { lang: 'tr' },
    },
  },
  // HMR + watch config'i environment'a göre farklılaştırılmış:
  // - Docker (IN_DOCKER=true)  → explicit polling + dış WS portu (24679 host map'li)
  // - Lokal `pnpm dev`          → Vite default (ws aynı server portunda)
  // Aksi takdirde lokal dev'de "WebSocket closed without opened" patlıyor çünkü
  // 24679 hiçbir yere bind değil.
  vite: {
    server: {
      watch: process.env.IN_DOCKER === 'true'
        ? { usePolling: true, interval: 1000 }
        : undefined,
      hmr: process.env.IN_DOCKER === 'true'
        ? { protocol: 'ws', host: 'localhost', port: 24679, clientPort: 24679 }
        : undefined,
      fs: {
        strict: false,
      },
    },
    optimizeDeps: {
      include: ['axios', 'pinia'],
    },
  },
})
