<script setup lang="ts">
interface Product {
  id: string
  name: string
  brand: string
  category: string
  price: number
  imageUrl: string
  isInStock: boolean
}

const favorites = ref<Product[]>([
  {
    id: '1',
    name: '60 x 120 Seramik - Beyaz Mat',
    brand: 'Seramik Üretici A',
    category: 'Seramik',
    price: 450,
    imageUrl: 'https://images.unsplash.com/photo-1584622181563-430f63602d4b?w=400&h=400&fit=crop',
    isInStock: true,
  },
  {
    id: '6',
    name: 'Asma Klozet - Modern',
    brand: 'Vitrifiye Üretici B',
    category: 'Vitrifiye',
    price: 1200,
    imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=400&fit=crop',
    isInStock: true,
  },
  {
    id: '3',
    name: '40 x 120 Seramik - Antrasit',
    brand: 'Seramik Üretici A',
    category: 'Seramik',
    price: 520,
    imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop',
    isInStock: false,
  },
])

const failedImages = ref<Record<string, boolean>>({})

const handleImageError = (productId: string) => {
  failedImages.value[productId] = true
}

const removeFavorite = (productId: string) => {
  const idx = favorites.value.findIndex(p => p.id === productId)
  if (idx > -1) {
    favorites.value.splice(idx, 1)
  }
}

const orderViaWhatsApp = (product: Product) => {
  const phoneNumber = '905396541720'
  const message = `*${product.name}* hakkında bilgi istiyorum

Marka: ${product.brand}
Kategori: ${product.category}
Fiyat: ${new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(product.price)}

Detaylı bilgi için lütfen iletişime geçiniz.`

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank')
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price)
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 lg:py-16">
    <div class="px-6 lg:px-12 mx-auto max-w-4xl">
      <!-- Page Header -->
      <div class="mb-12">
        <h1 class="text-4xl font-bold text-primary-900 mb-2">Favori Ürünler</h1>
        <p class="text-ink-600">Beğendiğiniz ürünleriniz</p>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Sidebar Navigation -->
        <aside class="lg:col-span-1">
          <nav class="space-y-2">
            <NuxtLink
              to="/hesabim"
              class="block px-4 py-3 rounded-lg text-primary-900 hover:bg-ink-50 transition-colors"
            >
              <Icon name="lucide:user" class="inline h-4 w-4 mr-2" />
              Profil Bilgileri
            </NuxtLink>
            <NuxtLink
              to="/siparislerim"
              class="block px-4 py-3 rounded-lg text-primary-900 hover:bg-ink-50 transition-colors"
            >
              <Icon name="lucide:package" class="inline h-4 w-4 mr-2" />
              Siparişlerim
            </NuxtLink>
            <NuxtLink
              to="/favori-urunler"
              class="block px-4 py-3 rounded-lg bg-accent-100 text-accent-700 font-medium border border-accent-200"
            >
              <Icon name="lucide:heart" class="inline h-4 w-4 mr-2" />
              Favori Ürünler
            </NuxtLink>
            <button
              class="w-full text-left px-4 py-3 rounded-lg text-primary-900 hover:bg-ink-50 transition-colors"
            >
              <Icon name="lucide:log-out" class="inline h-4 w-4 mr-2" />
              Çıkış Yap
            </button>
          </nav>
        </aside>

        <!-- Favorites Grid -->
        <div class="lg:col-span-2">
          <div v-if="favorites.length > 0" class="grid sm:grid-cols-2 gap-6">
            <article
              v-for="product in favorites"
              :key="product.id"
              class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group relative"
            >
              <!-- Remove Button -->
              <button
                @click="removeFavorite(product.id)"
                class="absolute top-3 right-3 z-10 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full transition-colors"
              >
                <Icon name="lucide:x" class="h-5 w-5" />
              </button>

              <!-- Image Container -->
              <div class="relative h-48 bg-gradient-to-br from-ink-100 to-ink-200 overflow-hidden flex items-center justify-center">
                <template v-if="!failedImages[product.id]">
                  <img
                    :src="product.imageUrl"
                    :alt="product.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    @error="handleImageError(product.id)"
                  />
                </template>
                <template v-else>
                  <div class="flex flex-col items-center justify-center w-full h-full">
                    <Icon name="lucide:image" class="h-12 w-12 text-ink-400 mb-2" />
                    <p class="text-xs text-ink-500 text-center px-4">{{ product.name }}</p>
                  </div>
                </template>
                <div
                  v-if="!product.isInStock"
                  class="absolute inset-0 bg-black/40 flex items-center justify-center"
                >
                  <span class="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold">Stok Tükendi</span>
                </div>
              </div>

              <!-- Product Info -->
              <div class="p-4">
                <p class="text-xs text-ink-500 uppercase tracking-wide mb-1">{{ product.brand }}</p>
                <h3 class="text-sm font-bold text-primary-900 mb-2 line-clamp-2">
                  {{ product.name }}
                </h3>
                <p class="text-xs text-ink-500 mb-3">{{ product.category }}</p>

                <div class="mb-4">
                  <p class="text-lg font-bold text-accent-600">
                    {{ formatPrice(product.price) }}
                  </p>
                </div>

                <!-- Buttons -->
                <div class="flex gap-2">
                  <button
                    @click="orderViaWhatsApp(product)"
                    :disabled="!product.isInStock"
                    class="flex-1 bg-gradient-to-r from-primary-900 to-accent-600 text-white font-bold py-2 rounded-lg hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-sm"
                  >
                    <Icon name="lucide:message-circle" class="h-3 w-3" />
                    Sipariş
                  </button>
                </div>
              </div>
            </article>
          </div>

          <!-- Empty State -->
          <div v-else class="bg-white rounded-xl shadow-md p-12 text-center">
            <Icon name="lucide:heart" class="h-16 w-16 text-ink-300 mx-auto mb-4" />
            <h3 class="text-xl font-bold text-primary-900 mb-2">Favori ürün bulunamadı</h3>
            <p class="text-ink-600 mb-6">Beğendiğiniz ürünleri favorilere ekleyin.</p>
            <NuxtLink
              to="/urunler"
              class="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Icon name="lucide:shopping-cart" class="h-4 w-4" />
              Ürünleri Keşfet
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
