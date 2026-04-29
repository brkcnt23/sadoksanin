export default defineNuxtConfig({
  ssr: true,
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
    '@nuxt/icon',
    '@vueuse/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'tr' },
      title: 'Sadoksan — Banyo & Sıhhi Tesisat Distribütörlüğü',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '23 yılı aşkın deneyimle banyo, sıhhi tesisat ve yapı malzemeleri distribütörlüğü. Roca, NSK, Selen, Fleko, Monza yetkili bayisi.' },
        { name: 'theme-color', content: '#0B1E3F' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap' },
      ],
    },
  },
  image: {
    domains: ['images.unsplash.com'],
    format: ['webp', 'avif'],
  },
  devtools: { enabled: true },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  nitro: {
    compressPublicAssets: true,
  },
})
