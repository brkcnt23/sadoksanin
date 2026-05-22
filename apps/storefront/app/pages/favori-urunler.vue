<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

interface FavoriteProduct {
  id: string
  productId: string
  product: {
    id: string
    name: string
    brand: string
    category: string
    basePrice: number
    imageUrl?: string
    displayStock: number
  }
}

const api = useApi()
const { isAuthenticated } = useAuth()

const favorites = ref<FavoriteProduct[]>([])
const loading = ref(true)
const failedImages = ref<Record<string, boolean>>({})

async function loadFavorites() {
  if (!isAuthenticated.value) return
  loading.value = true
  try {
    const res = await api.get<{ favorites: FavoriteProduct[]; total: number }>('/favorites', { limit: 100 })
    favorites.value = res.favorites
  } catch {
    favorites.value = []
  }
  loading.value = false
}

async function removeFavorite(productId: string) {
  try {
    await api.delete(`/favorites/${productId}`)
    favorites.value = favorites.value.filter((f) => f.productId !== productId)
  } catch { /* silent */ }
}

const handleImageError = (productId: string) => {
  failedImages.value[productId] = true
}

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

onMounted(loadFavorites)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 lg:py-16">
    <div class="px-6 lg:px-12 mx-auto max-w-4xl">
      <div class="mb-12">
        <h1 class="text-4xl font-bold text-primary-900 mb-2">Favori Ürünler</h1>
        <p class="text-ink-600">Beğendiğiniz ürünleriniz</p>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Sidebar -->
        <aside class="lg:col-span-1">
          <nav class="space-y-2">
            <NuxtLink to="/hesabim" class="block px-4 py-3 rounded-lg text-primary-900 hover:bg-ink-50 transition-colors">
              <Icon name="lucide:user" class="inline h-4 w-4 mr-2" /> Profil Bilgileri
            </NuxtLink>
            <NuxtLink to="/siparislerim" class="block px-4 py-3 rounded-lg text-primary-900 hover:bg-ink-50 transition-colors">
              <Icon name="lucide:package" class="inline h-4 w-4 mr-2" /> Siparişlerim
            </NuxtLink>
            <NuxtLink to="/favori-urunler" class="block px-4 py-3 rounded-lg bg-accent-100 text-accent-700 font-medium border border-accent-200">
              <Icon name="lucide:heart" class="inline h-4 w-4 mr-2" /> Favori Ürünler
            </NuxtLink>
          </nav>
        </aside>

        <!-- Favorites Grid -->
        <div class="lg:col-span-2">
          <!-- Loading -->
          <div v-if="loading" class="text-center py-12 text-ink-400">
            <Icon name="lucide:loader-2" class="h-8 w-8 mx-auto animate-spin mb-2" />
            Yükleniyor...
          </div>

          <!-- Favorites -->
          <div v-else-if="favorites.length > 0" class="grid sm:grid-cols-2 gap-6">
            <article
              v-for="fav in favorites"
              :key="fav.id"
              class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group relative"
            >
              <button
                @click="removeFavorite(fav.productId)"
                class="absolute top-3 right-3 z-10 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
                aria-label="Favoriden çıkar"
              >
                <Icon name="lucide:x" class="h-5 w-5" />
              </button>

              <div class="relative h-48 bg-gradient-to-br from-ink-100 to-ink-200 overflow-hidden flex items-center justify-center">
                <template v-if="fav.product.imageUrl && !failedImages[fav.product.id]">
                  <img
                    :src="fav.product.imageUrl"
                    :alt="fav.product.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    @error="handleImageError(fav.product.id)"
                  />
                </template>
                <template v-else>
                  <div class="flex flex-col items-center justify-center w-full h-full">
                    <Icon name="lucide:image" class="h-12 w-12 text-ink-400 mb-2" />
                    <p class="text-xs text-ink-500 text-center px-4">{{ fav.product.name }}</p>
                  </div>
                </template>
                <div v-if="fav.product.displayStock <= 0" class="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span class="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">Stok Tükendi</span>
                </div>
              </div>

              <div class="p-4">
                <p class="text-xs text-ink-500 uppercase tracking-wide mb-1">{{ fav.product.brand }}</p>
                <h3 class="text-sm font-bold text-primary-900 mb-2 line-clamp-2">{{ fav.product.name }}</h3>
                <p class="text-xs text-ink-500 mb-3">{{ fav.product.category }}</p>
                <div class="mb-4">
                  <p class="text-lg font-bold text-accent-600">{{ formatTL(fav.product.basePrice) }}</p>
                </div>
                <NuxtLink
                  :to="`/urunler/${fav.product.id}`"
                  class="block text-center flex-1 bg-gradient-to-r from-primary-900 to-accent-600 text-white font-bold py-2 rounded-lg hover:shadow-lg transition-all active:scale-95 text-sm"
                >
                  Ürünü Görüntüle
                </NuxtLink>
              </div>
            </article>
          </div>

          <!-- Empty State -->
          <div v-else class="bg-white rounded-xl shadow-md p-12 text-center">
            <Icon name="lucide:heart" class="h-16 w-16 text-ink-300 mx-auto mb-4" />
            <h3 class="text-xl font-bold text-primary-900 mb-2">Favori ürün bulunamadı</h3>
            <p class="text-ink-600 mb-6">Beğendiğiniz ürünleri favorilere ekleyin.</p>
            <NuxtLink to="/urunler" class="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              <Icon name="lucide:shopping-cart" class="h-4 w-4" /> Ürünleri Keşfet
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
