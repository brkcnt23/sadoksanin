<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
import { useCart } from '~/composables/useCart'

const props = defineProps<{ product: Product }>()
const emit = defineEmits<{ added: [] }>()

const { isDealer, computePrice } = useDealer()
const { isAuthenticated } = useAuth()
const { addItem } = useCart()
const api = useApi()

// İndirim varsa indirimli fiyat üzerinden hesapla (bayi lojistik bedeli
// indirimli fiyata eklenir), yoksa taban fiyat aynen kullanılır.
const effectivePrice = computed(() => props.product.discountedPrice ?? props.product.price)
const hasDiscount = computed(() =>
  !!props.product.discount && effectivePrice.value < props.product.price,
)
const price = computed(() => computePrice(effectivePrice.value))
const isFavorited = ref(false)
const favLoading = ref(false)

// Check favorite status on mount if authenticated
onMounted(async () => {
  if (isAuthenticated.value) {
    try {
      const res = await api.get<{ favorited: boolean }>(`/favorites/${props.product.id}`)
      isFavorited.value = res.favorited
    } catch { /* silent */ }
  }
})

const toggleFavorite = async () => {
  if (!isAuthenticated.value || favLoading.value) return
  favLoading.value = true
  try {
    if (isFavorited.value) {
      await api.delete(`/favorites/${props.product.id}`)
      isFavorited.value = false
    } else {
      await api.post(`/favorites/${props.product.id}`)
      isFavorited.value = true
    }
  } catch { /* silent */ }
  finally { favLoading.value = false }
}

const handleAddToCart = () => {
  addItem(props.product, 1)
  emit('added')
}

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)

const notifyViaWhatsApp = () => {
  const phone = '905396541720'
  const msg = `Merhaba,\n\nBu ürün hakkında bilgi almak istiyorum:\n\nÜrün: ${props.product.name}\nStok Kodu: ${props.product.sku ?? props.product.id}\nMarka: ${props.product.brand}\n\nStok durumu ve satın alma hakkında bilgilendirir misiniz?`
  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
}

// ─── Stok gelince haber ver ────────────────────────────────────────────────
// Kayıt backend'e düşer (NotifyRequest); ürün stoğa girdiğinde panelden
// "Haber Ver" ile bekleyen taleplere bildirim gönderilir.
const notifyState = ref<'idle' | 'saving' | 'done' | 'error'>('idle')

const requestStockNotify = async () => {
  if (!isAuthenticated.value || notifyState.value === 'saving') return
  notifyState.value = 'saving'
  try {
    await api.post('/admin/notifications', {
      productId: props.product.id,
      channel: 'email',
    })
    notifyState.value = 'done'
  } catch {
    // Kayıt oluşmazsa müşteri boşta kalmasın: WhatsApp'tan talep iletsin
    notifyState.value = 'error'
    notifyViaWhatsApp()
    setTimeout(() => { notifyState.value = 'idle' }, 2500)
  }
}
</script>

<template>
  <article
    class="group relative flex flex-col rounded-xl border border-ink-200 bg-white shadow-sm overflow-hidden transition-all duration-300 hover:border-primary-200 hover:shadow-card"
  >
    <!-- Image -->
    <NuxtLink :to="`/urunler/${product.slug}`" class="relative aspect-[4/5] bg-ink-50 overflow-hidden block">
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.name"
        loading="lazy"
        @error="($event.target as HTMLImageElement).style.display = 'none'"
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <!-- Görsel yoksa yer tutucu (görsel varsa üstüne binmemesi için v-if şart) -->
      <div v-if="!product.image" class="absolute inset-0 flex flex-col items-center justify-center text-ink-300">
        <Icon name="lucide:package-open" class="h-12 w-12 mb-2 opacity-40" />
        <p class="text-xs text-ink-400 text-center px-4 leading-tight">{{ product.name }}</p>
      </div>

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
          v-if="!product.purchasable"
          class="inline-flex px-2 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-bold uppercase tracking-wider"
        >
          Yakında
        </span>
        <span
          v-else-if="!product.inStock"
          class="inline-flex px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider"
        >
          Stokta Yok
        </span>
      </div>

      <!-- Quick action: Favorite -->
      <button
        v-if="isAuthenticated"
        type="button"
        class="absolute top-3 right-3 h-9 w-9 grid place-items-center rounded-full bg-white/90 backdrop-blur transition-colors opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 duration-300"
        :class="isFavorited ? 'text-red-500 hover:bg-red-50' : 'text-ink-700 hover:bg-accent-500 hover:text-primary-950'"
        :aria-label="isFavorited ? 'Favoriden çıkar' : 'Favoriye ekle'"
        :disabled="favLoading"
        @click.stop.prevent="toggleFavorite"
      >
        <Icon :name="isFavorited ? 'lucide:heart' : 'lucide:heart'" class="h-4 w-4" :class="{ 'fill-red-500': isFavorited }" />
      </button>
    </NuxtLink>

    <!-- Body -->
    <div class="flex-1 flex flex-col p-4">
      <p class="text-[11px] font-semibold uppercase tracking-wider text-accent-600">
        {{ product.brand }}
      </p>
      <NuxtLink :to="`/urunler/${product.slug}`" class="mt-1 text-sm font-semibold text-ink-900 line-clamp-2 leading-snug hover:text-primary-700">
        {{ product.name }}
      </NuxtLink>
      <p v-if="product.sku" class="mt-0.5 text-[10px] text-ink-400 font-mono">{{ product.sku }}</p>

      <!-- Price -->
      <div class="mt-auto pt-4 flex items-end justify-between gap-2">
        <div v-if="isAuthenticated">
          <div v-if="hasDiscount" class="flex items-center gap-1">
            <span class="text-[9px] font-bold text-white bg-red-600 px-1.5 py-0.5 rounded">İNDİRİM</span>
            <span class="text-[10px] text-ink-400 line-through">{{ formatTL(product.price) }} TL</span>
          </div>
          <div class="flex items-baseline gap-1.5">
            <span class="text-lg font-bold" :class="hasDiscount ? 'text-red-600' : 'text-primary-950'">
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
        <div v-else class="flex flex-col">
          <NuxtLink to="/giris" class="text-sm font-semibold text-accent-600 hover:text-accent-700">
            Fiyat Görmek İçin Giriş Yapın
          </NuxtLink>
        </div>

        <!-- Add to cart (auth required, satın alınabilir ve stokta) -->
        <button
          v-if="isAuthenticated && product.purchasable && product.inStock"
          type="button"
          class="h-9 w-9 grid place-items-center rounded-md bg-primary-900 text-white hover:bg-primary-800 transition-colors"
          aria-label="Sepete ekle"
          @click="handleAddToCart"
        >
          <Icon name="lucide:shopping-bag" class="h-4 w-4" />
        </button>

        <!-- Stokta yok / yakında → gelince haber ver -->
        <button
          v-else-if="isAuthenticated"
          type="button"
          :disabled="notifyState === 'saving' || notifyState === 'done'"
          class="h-9 px-3 inline-flex items-center gap-1 rounded-md text-xs font-semibold transition-colors disabled:cursor-default"
          :class="notifyState === 'done'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : notifyState === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-green-600 hover:bg-green-700 text-white'"
          :aria-label="notifyState === 'done' ? 'Haber verileceksiniz' : 'Gelince haber ver'"
          :title="notifyState === 'done' ? 'Ürün stoğa girdiğinde bilgilendirileceksiniz' : 'Stoğa girince haber verelim'"
          @click="requestStockNotify"
        >
          <Icon
            :name="notifyState === 'done' ? 'lucide:bell-ring' : notifyState === 'saving' ? 'lucide:loader-2' : 'lucide:bell'"
            class="h-4 w-4"
            :class="{ 'animate-spin': notifyState === 'saving' }"
          />
          <span>
            {{ notifyState === 'done' ? 'Eklendi' : notifyState === 'error' ? 'Tekrar Dene' : 'Haber Ver' }}
          </span>
        </button>
        <NuxtLink
          v-else
          to="/giris"
          class="h-9 px-3 grid place-items-center rounded-md border border-ink-200 text-ink-600 hover:bg-ink-50 text-xs font-medium transition-colors"
        >
          Giriş
        </NuxtLink>
      </div>
    </div>
  </article>
</template>
