<script setup lang="ts">
/**
 * InfoPage — Hukuki sayfalar ve CMS içerik sayfaları için ortak layout.
 *
 * Özellikler:
 * - Hero section + breadcrumb
 * - Mobilde accordion, desktop'ta sticky olan içindekiler (TOC)
 * - Temiz tipografi, kart bazlı içerik
 * - v-html güvenli render (CMS'ten gelen HTML)
 */

defineProps<{
  title: string
  description?: string
  content?: string       // HTML içerik (CMS v-html için)
  lastUpdated?: string   // opsiyonel son güncelleme tarihi
}>()

// İçindekiler (h2/h3 başlıklarından otomatik çıkar)
const tocExpanded = ref(false)
const activeSection = ref('')

// Scroll spy için
onMounted(() => {
  if (typeof window === 'undefined') return
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      }
    },
    { rootMargin: '-80px 0px -60% 0px' },
  )
  document.querySelectorAll('h2[id], h3[id]').forEach((el) => observer.observe(el))
  return () => observer.disconnect()
})
</script>

<template>
  <div class="min-h-screen bg-ink-50/50">

    <!-- Hero -->
    <section class="relative py-14 lg:py-20 bg-gradient-to-r from-primary-900 via-primary-800 to-accent-600 overflow-hidden">
      <div class="absolute inset-0 opacity-[0.07]">
        <div class="absolute -top-20 -left-20 w-60 h-60 bg-white rounded-full blur-3xl" />
        <div class="absolute -bottom-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
      </div>
      <div class="relative px-6 lg:px-12 mx-auto max-w-6xl">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-white/50 text-xs mb-4 font-medium">
          <NuxtLink to="/" class="hover:text-white/80 transition-colors">Anasayfa</NuxtLink>
          <Icon name="lucide:chevron-right" class="h-3 w-3" />
          <span class="text-white/70">{{ title }}</span>
        </nav>
        <h1 class="text-3xl lg:text-4xl font-bold text-white">{{ title }}</h1>
        <p v-if="description" class="mt-3 text-white/70 text-base max-w-2xl">{{ description }}</p>
      </div>
    </section>

    <!-- Content area -->
    <section class="py-10 lg:py-14">
      <div class="px-6 lg:px-12 mx-auto max-w-6xl">
        <div class="flex gap-10">

          <!-- Sidebar: İçindekiler (desktop) -->
          <aside class="hidden lg:block w-56 flex-shrink-0">
            <div class="sticky top-24">
              <h4 class="text-xs font-bold text-ink-400 uppercase tracking-wider mb-4">İçindekiler</h4>
              <nav class="flex flex-col gap-1 border-l-2 border-ink-200">
                <a
                  v-for="h in []"
                  :key="h"
                  class="block pl-3 py-1 text-sm transition-colors border-l-2 -ml-0.5"
                  :class="activeSection === h ? 'border-accent-500 text-accent-600 font-semibold' : 'border-transparent text-ink-500 hover:text-primary-900'"
                  :href="`#${h}`"
                >{{ h }}</a>
              </nav>
              <div class="mt-6 p-3 rounded-lg bg-white border border-ink-100">
                <p class="text-xs text-ink-500 leading-relaxed">
                  <Icon name="lucide:info" class="h-3 w-3 inline mr-1 text-accent-500" />
                  Bu sayfa <strong>SADÖKSAN İnşaat</strong> yasal bilgilendirme sayfasıdır.
                </p>
              </div>
            </div>
          </aside>

          <!-- Ana içerik -->
          <div class="flex-1 min-w-0">
            <div class="bg-white rounded-2xl shadow-card border border-ink-100 overflow-hidden">

              <!-- Son güncelleme -->
              <div v-if="lastUpdated" class="px-6 lg:px-10 py-3 bg-ink-50/50 border-b border-ink-100 flex items-center gap-2">
                <Icon name="lucide:clock" class="h-3.5 w-3.5 text-ink-400" />
                <span class="text-xs text-ink-500">Son güncelleme: {{ lastUpdated }}</span>
              </div>

              <!-- Mobil TOC toggle -->
              <div class="lg:hidden px-6 py-3 border-b border-ink-100">
                <button
                  type="button"
                  class="flex items-center gap-2 text-sm font-medium text-primary-900 w-full"
                  @click="tocExpanded = !tocExpanded"
                >
                  <Icon name="lucide:list" class="h-4 w-4" />
                  İçindekiler
                  <Icon :name="tocExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="h-4 w-4 ml-auto" />
                </button>
              </div>

              <!-- İçerik -->
              <div class="px-6 lg:px-10 py-8 lg:py-10">
                <article
                  class="prose prose-ink max-w-none
                    prose-headings:text-primary-900 prose-headings:font-bold prose-headings:tracking-tight
                    prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-ink-100
                    prose-h3:text-lg prose-h3:mt-8 prose-h3:mb-3
                    prose-p:text-ink-700 prose-p:leading-relaxed
                    prose-a:text-accent-600 prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-primary-900
                    prose-li:text-ink-700 prose-li:leading-relaxed
                    prose-ul:my-4 prose-ol:my-4
                    prose-blockquote:border-l-accent-500 prose-blockquote:bg-accent-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic
                    prose-table:border prose-table:border-ink-200 prose-th:bg-ink-50 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2
                  "
                  v-html="content"
                />

                <!-- Slotsuz kullanım için default slot -->
                <slot />
              </div>
            </div>

            <!-- Alt CTA -->
            <div class="mt-8 text-center">
              <p class="text-sm text-ink-500 mb-3">Başka bir sorunuz mu var?</p>
              <div class="flex items-center justify-center gap-3 flex-wrap">
                <NuxtLink
                  to="/iletisim"
                  class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-ink-200 rounded-xl text-sm font-medium text-primary-900 hover:border-accent-300 hover:text-accent-600 transition-colors shadow-sm"
                >
                  <Icon name="lucide:mail" class="h-4 w-4" />
                  İletişime Geçin
                </NuxtLink>
                <a
                  href="https://wa.me/905396541720"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-accent-500 rounded-xl text-sm font-medium text-white hover:bg-accent-600 transition-colors shadow-sm"
                >
                  <Icon name="lucide:message-circle" class="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
