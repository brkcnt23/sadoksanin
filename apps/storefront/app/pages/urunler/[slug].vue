<script setup lang="ts">
import type { Product } from '~/composables/useProducts'
import { useProducts } from '~/composables/useProducts'
import { useAuth } from '~/composables/useAuth'
import { useCart } from '~/composables/useCart'
import { useToast } from '~/composables/useToast'

const route = useRoute()
const { load, findBySlug, byBrand } = useProducts()
const { isAuthenticated } = useAuth()
const { addItem } = useCart()
const { push: pushToast } = useToast()

const handleAddToCart = (p: Product) => {
  addItem(p, 1)
  pushToast({ variant: 'success', title: 'Sepete eklendi', description: p.name, duration: 2500 })
}

const runtimeConfig = useRuntimeConfig()
const whatsAppPhone = runtimeConfig.public.whatsAppPhone || ''

const whatsAppNotifyUrl = (p: Product) => {
  const productUrl = `https://${typeof window !== 'undefined' ? window.location.host : ''}/urunler/${p.slug}`
  const msg = `Merhaba, stokta olmayan şu ürün geldiğinde bilgi almak istiyorum:\nÜrün: ${p.name}\nStok Kodu: ${p.sku || p.id}\nLink: ${productUrl}`
  return `https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(msg)}`
}

const whatsAppOrderUrl = (p: Product) => {
  const productUrl = `https://${typeof window !== 'undefined' ? window.location.host : ''}/urunler/${p.slug}`
  const msg = `Merhaba, şu ürün hakkında bilgi almak istiyorum:\nÜrün: ${p.name}\nStok Kodu: ${p.sku || p.id}\nLink: ${productUrl}`
  return `https://wa.me/${whatsAppPhone}?text=${encodeURIComponent(msg)}`
}

const product = ref<Product | null>(null)
const relatedProducts = ref<Product[]>([])
const selectedVariantId = ref<string | null>(null)
const selectedVariant = computed(() => {
  if (!selectedVariantId.value) return null
  return (product.value as any)?.variations?.find((v: any) => v.id === selectedVariantId.value) || null
})
const displayPrice = computed(() => selectedVariant.value?.price || product.value?.price || 0)
const displayStock = computed(() => selectedVariant.value?.stock ?? (product.value?.inStock ? product.value?.stockCount : 0))

onMounted(async () => {
  await load()
  product.value = findBySlug(route.params.slug as string) ?? null

  if (product.value) {
    const current = product.value
    relatedProducts.value = byBrand(current.brand)
      .filter(p => p.id !== current.id)
      .slice(0, 4)
  }
})
</script>

<template>
  <div class="min-h-screen bg-white py-12">
    <div class="max-w-7xl mx-auto px-6">
      <!-- Loading -->
      <div v-if="!product" class="text-center py-20">
        <p class="text-lg text-gray-600">Ürün yükleniyor...</p>
      </div>

      <!-- Product Found -->
      <div v-else>
        <div class="grid lg:grid-cols-2 gap-12">
          <!-- Image -->
          <div class="bg-gray-100 rounded-lg h-96 flex items-center justify-center">
            <img
              v-if="product.image"
              :src="product.image"
              :alt="product.name"
              class="h-full object-contain"
            />
            <span v-else class="text-gray-400">Görsel yok</span>
          </div>

          <!-- Info -->
          <div>
            <p class="text-sm text-gray-600 mb-2">{{ product.brand }}</p>
            <h1 class="text-3xl font-bold mb-4">{{ product.name }}</h1>

            <!-- Price (auth required) -->
            <template v-if="isAuthenticated">
              <p class="text-3xl text-accent-600 font-bold mb-2">₺{{ displayPrice.toLocaleString('tr-TR') }}</p>
              <span v-if="selectedVariant" class="text-sm text-ink-500">Seçilen: {{ selectedVariant.label }}</span>
            </template>
            <NuxtLink v-else to="/giris" class="block text-lg text-accent-600 hover:text-accent-700 font-semibold mb-6">
              Fiyat Görmek İçin Giriş Yapın →
            </NuxtLink>

            <!-- Varyant Seçimi -->
            <div v-if="(product as any).variations?.length > 0" class="mb-6">
              <p class="text-sm font-semibold text-ink-700 mb-2">Varyant Seçiniz</p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="v in (product as any).variations" :key="v.id"
                  @click="selectedVariantId = v.id"
                  :class="['px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    selectedVariantId === v.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-ink-700 border-ink-200 hover:border-primary-300']"
                >
                  {{ v.label }}
                  <span class="text-xs ml-1 opacity-70">{{ v.price ? '₺' + v.price : '' }}</span>
                </button>
              </div>
            </div>

            <p class="text-gray-700 mb-8">{{ product.description }}</p>


            <!-- Sepete Ekle (stok varsa) -->
            <button
              v-if="isAuthenticated && product.inStock"
              @click="handleAddToCart(product)"
              class="w-full bg-accent-500 text-white py-3 rounded-lg font-bold mb-4"
            >
              Sepete Ekle
            </button>

            <!-- Gelince Haber Ver (stok yoksa, WhatsApp tanımlıysa) -->
            <a
              v-if="isAuthenticated && !product.inStock && whatsAppPhone"
              :href="whatsAppNotifyUrl(product)"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full bg-green-600 text-white py-3 rounded-lg font-bold mb-4 block text-center hover:bg-green-700"
            >
              Gelince Haber Ver (WhatsApp)
            </a>

            <!-- Stok yok ama WhatsApp tanımlı değil -->
            <p
              v-if="isAuthenticated && !product.inStock && !whatsAppPhone"
              class="w-full bg-ink-100 text-ink-500 py-3 rounded-lg font-bold mb-4 block text-center text-sm"
            >
              Stokta Yok
            </p>

            <NuxtLink
              v-else-if="!isAuthenticated"
              to="/giris"
              class="w-full bg-ink-100 text-ink-700 py-3 rounded-lg font-bold mb-4 block text-center"
            >
              Sepete Eklemek İçin Giriş Yapın
            </NuxtLink>

            <!-- WhatsApp Sipariş (sadece numara tanımlıysa) -->
            <a
              v-if="whatsAppPhone"
              :href="whatsAppOrderUrl(product)"
              target="_blank"
              rel="noopener noreferrer"
              class="w-full border-2 border-green-600 text-green-700 py-3 rounded-lg font-bold mb-4 block text-center hover:bg-green-50"
            >
              WhatsApp ile Sipariş Ver
            </a>
          </div>
        </div>

        <!-- Related Products -->
        <div v-if="relatedProducts.length > 0" class="mt-16">
          <h2 class="text-2xl font-bold mb-6">Aynı Markadan Diğer Ürünler</h2>
          <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <NuxtLink
              v-for="related in relatedProducts"
              :key="related.id"
              :to="`/urunler/${related.slug}`"
              class="bg-white border rounded-lg p-4 hover:shadow-lg transition"
            >
              <div class="bg-gray-100 h-40 rounded mb-4 flex items-center justify-center">
                <img v-if="related.image" :src="related.image" :alt="related.name" class="h-full object-contain" />
              </div>
              <h3 class="font-bold mb-2">{{ related.name }}</h3>
              <p class="text-accent-600 font-bold">₺{{ related.price }}</p>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
