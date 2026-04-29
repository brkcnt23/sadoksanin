export default defineNuxtConfig({
  ssr: false, // Admin panel as SPA
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      apiBase: process.env.ADMIN_API_BASE || 'http://localhost:3001',
    },
  },
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: true,
  },
})
