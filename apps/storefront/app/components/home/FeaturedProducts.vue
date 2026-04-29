<script setup lang="ts">
const { featured } = useProducts()
const items = featured(8)
</script>

<template>
  <section class="py-20 md:py-28 bg-ink-50">
    <div class="container-x">
      <div class="flex items-end justify-between gap-6 flex-wrap">
        <div class="max-w-2xl">
          <p class="eyebrow">Öne Çıkan Ürünler</p>
          <h2 class="mt-3 heading-lg">Profesyonellerin tercihi</h2>
          <p class="mt-4 lead">
            Yetkili distribütör olarak ana markalardan en çok tercih edilen ürünler.
          </p>
        </div>
        <NuxtLink to="/urunler" class="btn-ghost text-primary-900">
          Tümünü Gör
          <Icon name="lucide:arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>

      <div class="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        <ProductCard v-for="p in items" :key="p.id" :product="p" />
      </div>
    </div>
  </section>
</template>
