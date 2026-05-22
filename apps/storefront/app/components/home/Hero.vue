<script setup lang="ts">
const hero = ref<{
  headline: string
  subheading: string
  imageUrl: string | null
  ctaText: string
  ctaLink: string
  secondaryCtaText: string | null
  secondaryCtaLink: string | null
  stats: any[]
} | null>(null)

const defaultStats = [
  { value: '23+', label: 'Yıllık Tecrübe' },
  { value: '50+', label: 'Marka' },
  { value: '4.000+', label: 'Ürün' },
  { value: '300+', label: 'Bayi' },
]

const stats = computed(() => {
  if (hero.value?.stats && Array.isArray(hero.value.stats)) return hero.value.stats
  return defaultStats
})

// Fetch hero content from CMS API
if (import.meta.client) {
  try {
    const api = useApi()
    const data = await api.get<any>('/cms/hero')
    hero.value = data
  } catch {
    // Use defaults if API unavailable
  }
}
</script>

<template>
  <section
    class="relative overflow-hidden text-white py-20 lg:py-28"
    :class="hero?.imageUrl ? '' : 'bg-gradient-to-b from-primary-900 via-primary-800 to-accent-600'"
    :style="hero?.imageUrl ? { background: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.5)), url(${hero.imageUrl}) center/cover no-repeat` } : {}"
  >
    <!-- Decorative background elements -->
    <div class="absolute inset-0 opacity-20">
      <div class="absolute top-0 -left-40 w-80 h-80 bg-white rounded-full blur-3xl" />
      <div class="absolute bottom-0 -right-40 w-80 h-80 bg-white rounded-full blur-3xl" />
    </div>

    <!-- Content -->
    <div class="relative px-6 lg:px-12 mx-auto max-w-5xl">
      <!-- Eyebrow -->
      <p class="text-accent-400 text-sm font-semibold uppercase tracking-wide mb-4">
        İnşaat Malzemeleri Distribütörü
      </p>

      <!-- Main Heading -->
      <h1 class="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight text-white mb-6">
        <span class="text-accent-400">{{ hero?.headline?.split(',')[0] || 'Premium işçilik,' }}</span><br v-if="hero?.headline?.includes(',')" />
        <span class="text-accent-500">{{ hero?.headline?.split(',')[1]?.trim() || 'profesyonel tedarik.' }}</span>
      </h1>

      <!-- Description -->
      <p class="text-lg text-white/80 max-w-2xl mb-8 leading-relaxed">
        {{ hero?.subheading || '1.500 m² showroom, 4.500+ ürün ve 300+ bayi ağı ile inşaat malzemeleri, banyo, sıhhi tesisat ve yapı çözümlerinde uçtan uca ortağınız.' }}
      </p>

      <!-- CTA Buttons -->
      <div class="flex flex-wrap gap-4 mb-12">
        <NuxtLink
          :to="hero?.ctaLink || '/urunler'"
          class="btn bg-accent-500 hover:bg-accent-600 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg transition-all active:scale-95"
        >
          {{ hero?.ctaText || 'Ürünleri Keşfedin' }}
          <Icon name="lucide:arrow-right" class="ml-2 h-5 w-5" />
        </NuxtLink>
        <NuxtLink
          :to="hero?.secondaryCtaLink || '/bayilik'"
          class="btn border-2 border-white/40 hover:bg-white/10 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all"
        >
          {{ hero?.secondaryCtaText || 'Bayi Olun' }}
          <Icon name="lucide:phone" class="ml-2 h-5 w-5" />
        </NuxtLink>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl">
        <div v-for="s in stats" :key="s.label" class="text-center">
          <div class="text-3xl md:text-4xl font-extrabold text-accent-400">{{ s.value }}</div>
          <div class="text-sm text-white/70 mt-1">{{ s.label }}</div>
        </div>
      </div>
    </div>
  </section>
</template>
