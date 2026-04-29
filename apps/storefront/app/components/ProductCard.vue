<script setup lang="ts">
import type { Product } from '~/composables/useProducts'

const props = defineProps<{ product: Product }>()

const { isDealer, computePrice } = useDealer()
const price = computed(() => computePrice(props.product.price))

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)
</script>

<template>
  <article
    class="group relative flex flex-col rounded-xl border border-ink-100 bg-white overflow-hidden transition-all duration-300 hover:border-ink-200 hover:shadow-card"
  >
    <!-- Image -->
    <div class="relative aspect-[4/5] bg-ink-50 overflow-hidden">
      <img
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <!-- Badges -->
      <div class="absolute top-3 left-3 flex flex-col gap-1.5">
        <span
          v-for="b in product.badges"
          :key="b"
          class="inline-flex px-2 py-0.5 rounded-md bg-primary-900 text-white text-[10px] font-bold uppercase tracking-wider"
        >
          {{ b }}
        </span>
        <span
          v-if="!product.inStock"
          class="inline-flex px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider"
        >
          Stokta Yok
        </span>
      </div>

      <!-- Quick action -->
      <button
        type="button"
        class="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-white/90 backdrop-blur text-ink-700 hover:bg-accent-500 hover:text-primary-950 transition-colors opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 duration-300"
        aria-label="Favoriye ekle"
      >
        <Icon name="lucide:heart" class="h-4 w-4" />
      </button>
    </div>

    <!-- Body -->
    <div class="flex-1 flex flex-col p-4">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-accent-600">
        {{ product.brand }}
      </p>
      <h3 class="mt-1 text-sm font-semibold text-ink-900 line-clamp-2 leading-snug">
        {{ product.name }}
      </h3>

      <!-- Price -->
      <div class="mt-auto pt-4 flex items-end justify-between gap-2">
        <div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-lg font-bold text-primary-950">
              {{ formatTL(price.total) }}
              <span class="text-xs font-medium text-ink-500">TL</span>
            </span>
          </div>
          <p
            v-if="isDealer && price.surcharge > 0"
            class="mt-0.5 text-[10px] font-medium text-accent-700"
          >
            {{ formatTL(price.base) }} + {{ formatTL(price.surcharge) }} TL lojistik
          </p>
          <p
            v-else-if="product.inStock"
            class="mt-0.5 text-[10px] text-emerald-600 font-medium"
          >
            Stokta {{ product.stockCount }} adet
          </p>
        </div>

        <button
          type="button"
          :disabled="!product.inStock"
          class="h-9 w-9 grid place-items-center rounded-md bg-primary-900 text-white hover:bg-primary-800 disabled:bg-ink-200 disabled:text-ink-400 transition-colors"
          aria-label="Sepete ekle"
        >
          <Icon name="lucide:shopping-bag" class="h-4 w-4" />
        </button>
      </div>
    </div>
  </article>
</template>
