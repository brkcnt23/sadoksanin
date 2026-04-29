<script setup lang="ts">
const { brands } = useCatalog()
const items = brands()
// Marquee için seti iki kere render ediyoruz
const doubled = [...items, ...items]
</script>

<template>
  <section class="py-16 border-y border-ink-100 bg-white">
    <div class="container-x">
      <div class="text-center max-w-2xl mx-auto">
        <p class="eyebrow">Markalarımız</p>
        <h2 class="mt-3 heading-md">Yetkili distribütörü olduğumuz markalar</h2>
      </div>
    </div>

    <div class="mt-10 overflow-hidden relative">
      <div class="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
      <div class="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

      <div class="marquee-track gap-12 px-6">
        <div
          v-for="(b, i) in doubled"
          :key="`${b.slug}-${i}`"
          class="shrink-0 flex flex-col items-center justify-center min-w-[180px] h-24 rounded-lg border border-ink-100 bg-white px-8 group hover:border-primary-200 hover:shadow-soft transition-all"
        >
          <span class="font-display text-2xl font-extrabold text-ink-700 group-hover:text-primary-900 tracking-tight transition-colors">
            {{ b.name }}
          </span>
          <span
            v-if="b.tagline"
            class="mt-1 text-[9px] uppercase tracking-[0.2em] font-semibold text-accent-600"
          >
            {{ b.tagline }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
