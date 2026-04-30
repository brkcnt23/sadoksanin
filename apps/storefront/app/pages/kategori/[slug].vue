<script setup lang="ts">
interface Product {
  id: string
  name: string
  category: string
  brand: string
  isSponsored?: boolean
  imageUrl: string
}

// Category name mapping
const categoryNames: Record<string, string> = {
  seramik: 'Seramik',
  vitrifiye: 'Vitrifiye',
  rtrmax: 'RTRMAX',
  'banyo-grubu': 'Banyo Grubu & Kabin',
  'banyo-aksesuarlari': 'Banyo Aksesuarları',
  'batarya-ve-musluklar': 'Batarya ve Musluklar',
  'silikon-kopuk': 'Silikon & Köpük & Sprey Boya',
  'alci-alci-plaka': 'Yapı Kimyasalları',
  'insort-urunler': 'İnsört Ürünler',
}

const failedImages = ref<Record<string, boolean>>({})

const allProducts = ref<Product[]>([
  {
    id: '1',
    name: '60 x 120 Seramik - Beyaz Mat',
    category: 'seramik',
    brand: 'Seramik Üretici A',
    imageUrl: 'https://images.unsplash.com/photo-1584622181563-430f63602d4b?w=400&h=400&fit=crop',
  },
  {
    id: '2',
    name: '60 x 120 Seramik - Gri Parlak',
    category: 'seramik',
    brand: 'Seramik Üretici B',
    imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=400&fit=crop',
  },
  {
    id: '3',
    name: '40 x 120 Seramik - Antrasit',
    category: 'seramik',
    brand: 'Seramik Üretici A',
    isSponsored: true,
    imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop',
  },
  {
    id: '4',
    name: '30 x 60 Seramik - Krem',
    category: 'seramik',
    brand: 'Seramik Üretici C',
    imageUrl: 'https://images.unsplash.com/photo-1557821552-17105176677c?w=400&h=400&fit=crop',
  },
  {
    id: '5',
    name: 'Standart Klozet - Beyaz',
    category: 'vitrifiye',
    brand: 'Vitrifiye Üretici A',
    imageUrl: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=400&h=400&fit=crop',
  },
  {
    id: '6',
    name: 'Asma Klozet - Modern',
    category: 'vitrifiye',
    brand: 'Vitrifiye Üretici B',
    isSponsored: true,
    imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=400&fit=crop',
  },
  {
    id: '7',
    name: 'Lavabo - Standart',
    category: 'vitrifiye',
    brand: 'Vitrifiye Üretici A',
    imageUrl: 'https://images.unsplash.com/photo-1584622181563-430f63602d4b?w=400&h=400&fit=crop',
  },
])

const selectedBrands = ref<string[]>([])
const showOnlySponsored = ref(false)

// Get slug from route params - no composables, pure function
const getSlug = (slug: string | string[] | undefined): string => {
  if (Array.isArray(slug)) return slug[0] || ''
  return slug || ''
}

// Get category title from slug
const getCategoryTitle = (slug: string): string => {
  return categoryNames[slug] || slug
}

// Filter products
const getFilteredProducts = (slug: string): Product[] => {
  return allProducts.value.filter(product => {
    if (product.category !== slug) return false
    if (selectedBrands.value.length > 0 && !selectedBrands.value.includes(product.brand)) {
      return false
    }
    if (showOnlySponsored.value && !product.isSponsored) return false
    return true
  })
}

// Get unique brands
const getUniqueBrands = (slug: string): string[] => {
  const brands = new Set(getFilteredProducts(slug).map(p => p.brand))
  return Array.from(brands).sort()
}

const handleImageError = (productId: string) => {
  failedImages.value[productId] = true
}

const toggleBrand = (brand: string) => {
  const idx = selectedBrands.value.indexOf(brand)
  if (idx > -1) {
    selectedBrands.value.splice(idx, 1)
  } else {
    selectedBrands.value.push(brand)
  }
}

const toggleSponsored = () => {
  showOnlySponsored.value = !showOnlySponsored.value
}

const clearFilters = () => {
  selectedBrands.value = []
  showOnlySponsored.value = false
}

const orderViaWhatsApp = (product: Product, slug: string, categoryTitle: string) => {
  const phoneNumber = '905396541720'
  const productPageUrl = `${window.location.origin}/kategori/${slug}#${product.id}`

  const message = `*${product.name}* hakkında bilgi istiyorum

Marka: ${product.brand}
Kategori: ${categoryTitle}
${product.isSponsored ? '⭐ Sponsor Ürün\n' : ''}
Ürün Linki: ${productPageUrl}

Detaylı bilgi için lütfen iletişime geçiniz.`

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank')
}
</script>

<template>
  <!-- No composables needed - use $route global directly -->
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white">
    <!-- Hero Section -->
    <section class="relative py-16 lg:py-20 bg-gradient-to-r from-primary-900 via-primary-800 to-accent-600 overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 -left-40 w-80 h-80 bg-white rounded-full blur-3xl" />
        <div class="absolute bottom-0 -right-40 w-80 h-80 bg-white rounded-full blur-3xl" />
      </div>

      <div class="relative px-6 lg:px-12 mx-auto max-w-5xl">
        <h1 class="text-4xl lg:text-5xl font-bold text-white mb-3">
          {{ getCategoryTitle(getSlug($route.params.slug)) }}
        </h1>
        <p class="text-white/80 text-lg">
          {{ getFilteredProducts(getSlug($route.params.slug)).length }} ürün listeleniyor
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-12 lg:py-16">
      <div class="px-6 lg:px-12 mx-auto max-w-6xl">
        <div class="grid lg:grid-cols-4 gap-8">
          <!-- Sidebar Filters -->
          <aside class="lg:col-span-1">
            <div class="bg-white rounded-xl shadow-md p-6 sticky top-[120px]">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-bold text-primary-900">Filtreler</h2>
                <button
                  v-if="selectedBrands.length > 0 || showOnlySponsored"
                  @click="clearFilters"
                  type="button"
                  class="text-xs text-accent-600 hover:text-accent-700 font-semibold"
                >
                  Temizle
                </button>
              </div>

              <!-- Sponsor Ürünler Filter -->
              <div class="mb-6 pb-6 border-b border-ink-100">
                <label class="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    :checked="showOnlySponsored"
                    @change="toggleSponsored"
                    class="w-4 h-4 rounded border-primary-200 text-accent-600 focus:ring-accent-500"
                  />
                  <span class="text-sm font-medium text-ink-700 group-hover:text-primary-900">
                    Sponsor Ürünler
                  </span>
                </label>
              </div>

              <!-- Markalar Filter -->
              <div>
                <h3 class="text-sm font-bold text-primary-900 mb-4 uppercase tracking-wide">
                  Markalar
                </h3>
                <div class="space-y-3">
                  <label
                    v-for="brand in getUniqueBrands(getSlug($route.params.slug))"
                    :key="brand"
                    class="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedBrands.includes(brand)"
                      @change="toggleBrand(brand)"
                      class="w-4 h-4 rounded border-primary-200 text-accent-600 focus:ring-accent-500"
                    />
                    <span class="text-sm text-ink-700 group-hover:text-primary-900">
                      {{ brand }}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </aside>

          <!-- Product Grid -->
          <div class="lg:col-span-3">
            <div v-if="getFilteredProducts(getSlug($route.params.slug)).length > 0" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <article
                v-for="product in getFilteredProducts(getSlug($route.params.slug))"
                :key="product.id"
                class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <!-- Image Container -->
                <div class="relative h-64 bg-gradient-to-br from-ink-100 to-ink-200 overflow-hidden flex items-center justify-center">
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
                  <div v-if="product.isSponsored" class="absolute top-3 right-3 bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    ⭐ Sponsor
                  </div>
                </div>

                <!-- Product Info -->
                <div class="p-4">
                  <p class="text-xs text-ink-500 uppercase tracking-wide mb-2">
                    {{ product.brand }}
                  </p>
                  <h3 class="text-sm font-bold text-primary-900 mb-4 line-clamp-2">
                    {{ product.name }}
                  </h3>

                  <!-- WhatsApp Order Button -->
                  <button
                    @click="orderViaWhatsApp(product, getSlug($route.params.slug), getCategoryTitle(getSlug($route.params.slug)))"
                    type="button"
                    class="w-full bg-gradient-to-r from-primary-900 to-accent-600 text-white font-bold py-2.5 rounded-lg hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Icon name="lucide:message-circle" class="h-4 w-4" />
                    WhatsApp Sipariş
                  </button>
                </div>
              </article>
            </div>

            <!-- Empty State -->
            <div v-else class="py-20 text-center">
              <Icon name="lucide:inbox" class="h-16 w-16 text-ink-300 mx-auto mb-4" />
              <h3 class="text-xl font-bold text-primary-900 mb-2">Ürün Bulunamadı</h3>
              <p class="text-ink-600 mb-6">
                Seçili filtrelerinize uygun ürün yok. Filtreleri değiştirmeyi deneyiniz.
              </p>
              <button
                @click="clearFilters"
                type="button"
                class="inline-flex items-center gap-2 bg-primary-900 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-800 transition-colors"
              >
                <Icon name="lucide:rotate-ccw" class="h-4 w-4" />
                Filtreleri Temizle
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 lg:py-20 bg-white/50">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <div class="bg-gradient-to-r from-primary-900 to-accent-600 rounded-2xl p-8 lg:p-12 text-center max-w-3xl mx-auto">
          <h2 class="text-3xl lg:text-4xl font-bold text-white mb-4">
            Daha Fazla Bilgi İstiyor musunuz?
          </h2>
          <p class="text-white/80 text-lg mb-8">
            Ürünlerimiz hakkında detaylı bilgi için bize WhatsApp veya telefonla ulaşın
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+905396541720"
              class="inline-flex items-center justify-center gap-2 bg-white text-primary-900 px-8 py-3 rounded-lg font-bold hover:bg-accent-50 transition-colors"
            >
              <Icon name="lucide:phone" class="w-5 h-5" />
              0539 654 17 20
            </a>
            <a
              href="https://wa.me/905396541720"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center justify-center gap-2 bg-accent-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-accent-600 transition-colors"
            >
              <Icon name="lucide:message-circle" class="w-5 h-5" />
              WhatsApp Mesaj
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
