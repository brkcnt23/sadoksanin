<script setup lang="ts">
const stats = [
  { value: '23+', label: 'Yıllık Tecrübe' },
  { value: '50+', label: 'Marka' },
  { value: '4.000+', label: 'Ürün' },
  { value: '300+', label: 'Bayi' },
]
</script>

<template>
  <section class="relative overflow-hidden bg-gradient-to-b from-primary-900 via-primary-800 to-accent-600 text-white py-20 lg:py-28">
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
        <span class="text-accent-400">Premium işçilik,</span><br />
        <span class="text-accent-500">profesyonel</span> tedarik.
      </h1>

      <!-- Description -->
      <p class="text-lg text-white/80 max-w-2xl mb-8 leading-relaxed">
        1.500 m² showroom, 4.500+ ürün ve 300+ bayi ağı ile inşaat malzemeleri, banyo, sıhhi tesisat ve yapı çözümlerinde uçtan uca ortağınız.
      </p>

      <!-- CTA Buttons -->
      <div class="flex flex-wrap gap-4 mb-12">
        <NuxtLink
          to="/urunler"
          class="inline-flex items-center gap-2 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-bold rounded-lg transition-colors"
        >
          Ürünleri Keşfet
          <Icon name="lucide:arrow-right" class="h-4 w-4" />
        </NuxtLink>
        <NuxtLink
          to="/bayilik"
          class="inline-flex items-center gap-2 px-6 py-3 border-2 border-white/40 hover:border-white text-white font-bold rounded-lg transition-colors"
        >
          Bayimiz Ol
        </NuxtLink>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div v-for="stat in stats" :key="stat.label">
          <div class="text-4xl md:text-5xl font-extrabold text-accent-500 mb-2">
            {{ stat.value }}
          </div>
          <div class="text-xs uppercase tracking-wider text-white/70">
            {{ stat.label }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
