<script setup lang="ts">
const { categories } = useCatalog()
const items = categories()
</script>

<template>
  <section class="py-20 md:py-28">
    <div class="container-x">
      <div class="flex items-end justify-between gap-6 flex-wrap">
        <div class="max-w-2xl">
          <p class="eyebrow">Kategoriler</p>
          <h2 class="mt-3 heading-lg">Aradığınız her şey, tek tedarikçide</h2>
          <p class="mt-4 lead">
            4.500+ ürün ile inşaat malzemeleri, banyo, sıhhi tesisat ve daha fazlası — projenize özel kapsamlı ürün gamı.
          </p>
        </div>
        <NuxtLink to="/urunler" class="btn-ghost text-primary-900">
          Tüm Kategoriler
          <Icon name="lucide:arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>

      <div class="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <NuxtLink
          v-for="(c, i) in items"
          :key="c.slug"
          :to="`/kategori/${c.slug}`"
          class="group relative aspect-[4/3] overflow-hidden rounded-xl bg-ink-100"
          :class="{ 'lg:col-span-2': i === 0 || i === 5 }"
        >
          <img
            :src="c.image"
            :alt="c.name"
            class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-primary-950 via-primary-950/40 to-transparent" />

          <div class="absolute bottom-0 left-0 right-0 p-6 md:p-7">
            <p class="text-[11px] uppercase tracking-[0.18em] font-semibold text-accent-400">
              {{ c.productCount.toLocaleString('tr-TR') }} ürün
            </p>
            <h3 class="mt-2 font-display text-2xl md:text-3xl font-bold text-white">
              {{ c.name }}
            </h3>
            <p class="mt-1.5 text-sm text-ink-300 max-w-sm">{{ c.description }}</p>

            <span class="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
              Kategoriye git
              <Icon name="lucide:arrow-right" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
