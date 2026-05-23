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

const product = ref<Product | null>(null)
const relatedProducts = ref<Product[]>([])

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
              <p class="text-3xl text-accent-600 font-bold mb-6">₺{{ product.price.toLocaleString('tr-TR') }}</p>
            </template>
            <NuxtLink v-else to="/giris" class="block text-lg text-accent-600 hover:text-accent-700 font-semibold mb-6">
              Fiyat Görmek İçin Giriş Yapın →
            </NuxtLink>

            <p class="text-gray-700 mb-8">{{ product.description }}</p>


            <button
              v-if="isAuthenticated"
              @click="handleAddToCart(product)"
              class="w-full bg-accent-500 text-white py-3 rounded-lg font-bold mb-4"
            >
              Sepete Ekle
            </button>
            <NuxtLink
              v-else
              to="/giris"
              class="w-full bg-ink-100 text-ink-700 py-3 rounded-lg font-bold mb-4 block text-center"
            >
              Sepete Eklemek İçin Giriş Yapın
            </NuxtLink>

            <button class="w-full border-2 border-gray-300 py-3 rounded-lg font-bold">
              WhatsApp Siparişi
            </button>
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
