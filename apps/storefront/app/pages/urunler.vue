<script setup lang="ts">
import type { Product as CatalogProduct } from '~/composables/useProducts'
import { useProducts } from '~/composables/useProducts'
import { useDealer } from '~/composables/useDealer'
import { useCart } from '~/composables/useCart'
import { useStock } from '~/composables/useStock'

const { list, load, loading, error } = useProducts()
const { computePrice } = useDealer()
const { addItem } = useCart()
const { getStockStatus, getStockLabel, getStockColor, getAvailableStock, loadOrders } = useStock()

const route = useRoute()
const cartNotification = ref('')

onMounted(async () => {
  // Pre-select category from URL query param
  const qKategori = route.query.kategori
  if (qKategori && typeof qKategori === 'string') {
    selectedCategories.value = [qKategori.toLowerCase()]
  }
  await load()
  loadOrders()
})

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

const allProducts = computed(() => list())

const selectedCategories = ref<string[]>([])
const selectedBrands = ref<string[]>([])
const showOnlySponsored = ref(false)
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(20)
const itemsPerPageOptions = [10, 20, 50, 100]

const getFilteredProducts = (): CatalogProduct[] => {
  const query = searchQuery.value.toLowerCase().trim()

  return allProducts.value.filter(product => {
    // Search filter: match name, brand, or sku
    if (query) {
      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query) ||
        (product.sku?.toLowerCase().includes(query) ?? false) ||
        (product.description?.toLowerCase().includes(query) ?? false)
      if (!matchesSearch) return false
    }

    // Category filter
    if (selectedCategories.value.length > 0 && !selectedCategories.value.includes(product.category.toLowerCase())) {
      return false
    }

    // Brand filter
    if (selectedBrands.value.length > 0 && !selectedBrands.value.includes(product.brand)) {
      return false
    }

    // Premium filter
    if (showOnlySponsored.value && !product.badges?.includes('Premium')) return false

    return true
  })
}

const filteredProducts = computed(() => getFilteredProducts())

const totalPages = computed(() => {
  return Math.ceil(filteredProducts.value.length / itemsPerPage.value)
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredProducts.value.slice(start, end)
})

const getUniqueCategories = (): Array<{ slug: string; name: string }> => {
  const cats = new Set(allProducts.value.map(p => p.category.toLowerCase()))
  return Array.from(cats)
    .sort()
    .map(slug => ({ slug, name: categoryNames[slug] || slug }))
}

const getUniqueBrands = (): string[] => {
  const brands = new Set(getFilteredProducts().map(p => p.brand))
  return Array.from(brands).sort()
}

const handleImageError = (productId: string) => {
  failedImages.value[productId] = true
}

const toggleCategory = (category: string) => {
  const idx = selectedCategories.value.indexOf(category)
  if (idx > -1) {
    selectedCategories.value.splice(idx, 1)
  } else {
    selectedCategories.value.push(category)
  }
  currentPage.value = 1
}

const toggleBrand = (brand: string) => {
  const idx = selectedBrands.value.indexOf(brand)
  if (idx > -1) {
    selectedBrands.value.splice(idx, 1)
  } else {
    selectedBrands.value.push(brand)
  }
  currentPage.value = 1
}

const toggleSponsored = () => {
  showOnlySponsored.value = !showOnlySponsored.value
  currentPage.value = 1
}

const clearFilters = () => {
  selectedCategories.value = []
  selectedBrands.value = []
  showOnlySponsored.value = false
  searchQuery.value = ''
  currentPage.value = 1
}

const addToCart = (product: CatalogProduct) => {
  addItem(product, 1)
  cartNotification.value = `${product.name} sepete eklendi`
  setTimeout(() => {
    cartNotification.value = ''
  }, 2000)
}

const orderViaWhatsApp = (product: CatalogProduct) => {
  const phoneNumber = '905396541720'
  const productPageUrl = `${window.location.origin}/urunler#${product.id}`
  const categoryLower = product.category.toLowerCase()
  const categoryName = categoryNames[categoryLower] || product.category

  const message = `*${product.name}* hakkında bilgi istiyorum

Marka: ${product.brand}
Kategori: ${categoryName}
Fiyat: ₺${product.price}
${product.badges?.includes('Premium') ? '⭐ Premium Ürün\n' : ''}
Ürün Linki: ${productPageUrl}

Detaylı bilgi için lütfen iletişime geçiniz.`

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white">
    <!-- Hero Section -->
    <section class="relative py-16 lg:py-20 bg-gradient-to-r from-primary-900 via-primary-800 to-accent-600 overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 -left-40 w-80 h-80 bg-white rounded-full blur-3xl" />
        <div class="absolute bottom-0 -right-40 w-80 h-80 bg-white rounded-full blur-3xl" />
      </div>

      <div class="relative px-6 lg:px-12 mx-auto max-w-5xl">
        <h1 class="text-4xl lg:text-5xl font-bold text-white mb-3">
          Ürün Kataloğu
        </h1>
        <p class="text-white/80 text-lg">
          {{ filteredProducts.length }} ürün bulundu
        </p>
      </div>
    </section>

    <!-- Error Banner -->
    <div v-if="error" class="bg-red-50 border-l-4 border-red-500 p-4 mx-6 lg:mx-12 mt-4">
      <div class="flex">
        <Icon name="lucide:alert-circle" class="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
        <div>
          <p class="text-red-800 font-semibold">Ürün yüklemesi başarısız oldu</p>
          <p class="text-red-700 text-sm mt-1">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <section class="py-12 lg:py-16">
      <div class="px-6 lg:px-12 mx-auto max-w-7xl">
        <!-- Loading State -->
        <div v-if="loading && allProducts.length === 0" class="grid lg:grid-cols-4 gap-8">
          <aside class="lg:col-span-1">
            <div class="bg-white rounded-xl shadow-md p-6">
              <div class="h-8 bg-gray-200 rounded mb-4 animate-pulse" />
              <div class="space-y-3">
                <div class="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div class="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
              </div>
            </div>
          </aside>
          <div class="lg:col-span-3">
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div v-for="i in 6" :key="i" class="bg-white rounded-xl overflow-hidden shadow-md">
                <div class="h-64 bg-gray-200 animate-pulse" />
                <div class="p-4 space-y-3">
                  <div class="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div class="h-8 bg-gray-200 rounded animate-pulse" />
                  <div class="h-10 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div v-else class="grid lg:grid-cols-4 gap-8">
          <!-- Sidebar Filters -->
          <aside class="lg:col-span-1">
            <div class="bg-white rounded-xl shadow-md p-6 sticky top-[140px]">
              <div class="flex items-center justify-between mb-6">
                <h2 class="text-lg font-bold text-primary-900">Filtreler</h2>
                <button
                  v-if="selectedCategories.length > 0 || selectedBrands.length > 0 || showOnlySponsored || searchQuery"
                  @click="clearFilters"
                  type="button"
                  class="text-xs text-accent-600 hover:text-accent-700 font-semibold"
                >
                  Temizle
                </button>
              </div>

              <!-- Search Filter -->
              <div class="mb-6 pb-6 border-b border-ink-100">
                <div class="relative">
                  <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Ürün ara..."
                    class="w-full px-3 py-2.5 pl-9 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                  <Icon name="lucide:search" class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-400" />
                  <button
                    v-if="searchQuery"
                    @click="searchQuery = ''"
                    type="button"
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-ink-400 hover:text-ink-600"
                  >
                    <Icon name="lucide:x" class="h-4 w-4" />
                  </button>
                </div>
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

              <!-- Kategoriler Filter -->
              <div class="mb-6 pb-6 border-b border-ink-100">
                <h3 class="text-sm font-bold text-primary-900 mb-4 uppercase tracking-wide">
                  Kategoriler
                </h3>
                <div class="space-y-3">
                  <label
                    v-for="cat in getUniqueCategories()"
                    :key="cat.slug"
                    class="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      :checked="selectedCategories.includes(cat.slug)"
                      @change="toggleCategory(cat.slug)"
                      class="w-4 h-4 rounded border-primary-200 text-accent-600 focus:ring-accent-500"
                    />
                    <span class="text-sm text-ink-700 group-hover:text-primary-900">
                      {{ cat.name }}
                    </span>
                  </label>
                </div>
              </div>

              <!-- Markalar Filter -->
              <div>
                <h3 class="text-sm font-bold text-primary-900 mb-4 uppercase tracking-wide">
                  Markalar
                </h3>
                <div class="space-y-3">
                  <label
                    v-for="brand in getUniqueBrands()"
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
            <!-- Items Per Page Selector -->
            <div class="flex items-center justify-between mb-6 pb-6 border-b border-ink-100">
              <div class="flex items-center gap-3">
                <label class="text-sm font-medium text-primary-900">Sayfa başına:</label>
                <select
                  v-model.number="itemsPerPage"
                  class="px-3 py-2 border border-ink-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent-500"
                >
                  <option v-for="opt in itemsPerPageOptions" :key="opt" :value="opt">
                    {{ opt }} ürün
                  </option>
                </select>
              </div>
              <p class="text-sm text-ink-600">
                Toplam: <span class="font-semibold">{{ filteredProducts.length }}</span> ürün
              </p>
            </div>

            <template v-if="filteredProducts.length > 0">
            <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <article
                v-for="product in paginatedProducts"
                :key="product.id"
                class="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group"
              >
                <!-- Image Container -->
                <div class="relative h-64 bg-gradient-to-br from-ink-100 to-ink-200 overflow-hidden flex items-center justify-center">
                  <template v-if="!failedImages[product.id]">
                    <img
                      :src="product.image"
                      :alt="product.name"
                      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      @error="handleImageError(product.id)"
                      loading="lazy"
                    />
                  </template>
                  <template v-else>
                    <div class="flex flex-col items-center justify-center w-full h-full">
                      <Icon name="lucide:image" class="h-12 w-12 text-ink-400 mb-2" />
                      <p class="text-xs text-ink-500 text-center px-4">{{ product.name }}</p>
                    </div>
                  </template>
                  <!-- Stock Status Badge -->
                  <div
                    class="absolute bottom-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold text-white"
                    :class="{
                      'bg-green-600': getStockColor(getStockStatus(product)) === 'green',
                      'bg-amber-600': getStockColor(getStockStatus(product)) === 'amber',
                      'bg-blue-600': getStockColor(getStockStatus(product)) === 'blue',
                      'bg-red-600': getStockColor(getStockStatus(product)) === 'red',
                    }"
                  >
                    {{ getStockLabel(getStockStatus(product)) }}
                  </div>

                  <!-- Premium Badge -->
                  <div v-if="product.badges?.includes('Premium')" class="absolute top-3 right-3 bg-accent-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    ⭐ Premium
                  </div>

                  <!-- Out of Stock Overlay -->
                  <div v-if="getStockStatus(product) === 'out-of-stock'" class="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span class="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Stokta Yok</span>
                  </div>
                </div>

                <!-- Product Info -->
                <div class="p-4">
                  <p class="text-xs text-ink-500 uppercase tracking-wide mb-2">
                    {{ product.brand }}
                  </p>
                  <h3 class="text-sm font-bold text-primary-900 mb-3 line-clamp-2">
                    {{ product.name }}
                  </h3>

                  <!-- Price Display -->
                  <div class="mb-4 pb-4 border-b border-ink-100">
                    <p class="text-2xl font-bold text-accent-600">
                      ₺{{ computePrice(product.price).total.toLocaleString('tr-TR') }}
                    </p>
                    <p v-if="computePrice(product.price).isDealer" class="text-xs text-ink-600 mt-1">
                      Taban: ₺{{ product.price }} + ₺{{ computePrice(product.price).surcharge }} lojistik
                    </p>
                    <p class="text-xs text-ink-500 mt-2">
                      <Icon name="lucide:package" class="h-3 w-3 inline mr-1" />
                      {{ getAvailableStock(product) }} adet mevcut
                    </p>
                  </div>

                  <!-- Action Buttons -->
                  <div class="space-y-2">
                    <button
                      @click="addToCart(product)"
                      type="button"
                      :disabled="getStockStatus(product) === 'out-of-stock'"
                      class="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold py-2.5 rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Icon name="lucide:shopping-cart" class="h-4 w-4" />
                      Sepete Ekle
                    </button>
                    <button
                      @click="orderViaWhatsApp(product)"
                      type="button"
                      :disabled="getStockStatus(product) === 'out-of-stock'"
                      class="w-full bg-gradient-to-r from-primary-900 to-accent-600 text-white font-bold py-2 rounded-lg hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      <Icon name="lucide:message-circle" class="h-4 w-4" />
                      WhatsApp Sipariş
                    </button>
                  </div>
                </div>
              </article>
            </div>

            <!-- Pagination Controls -->
            <div v-if="totalPages > 1" class="mt-12 flex items-center justify-center gap-2">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-4 py-2 border border-ink-200 rounded-lg text-sm font-medium text-primary-900 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Önceki
              </button>

              <div class="flex gap-1">
                <button
                  v-for="page in totalPages"
                  :key="page"
                  @click="currentPage = page"
                  :class="[
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    currentPage === page
                      ? 'bg-accent-500 text-white'
                      : 'border border-ink-200 text-primary-900 hover:bg-ink-50'
                  ]"
                >
                  {{ page }}
                </button>
              </div>

              <button
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-4 py-2 border border-ink-200 rounded-lg text-sm font-medium text-primary-900 hover:bg-ink-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Sonraki →
              </button>
            </div>
            </template>

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
