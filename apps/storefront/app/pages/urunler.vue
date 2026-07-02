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
const { isAuthenticated } = useAuth()

const route = useRoute()
const cartNotification = ref('')
const config = useRuntimeConfig()

// ─── Category Tree from API ────────────────────────────────────────────────
interface CatNode { id: string; name: string; slug: string; children: CatNode[]; _count?: { products: number } }
const categoryTree = ref<CatNode[]>([])
const expandedParents = ref<Record<string, boolean>>({})

async function loadCategories() {
  try {
    const base = config.public.apiBase?.replace(/\/+$/, '') || ''
    const res = await $fetch<CatNode[]>(`${base}/products/categories`)
    categoryTree.value = res.filter(c => (c._count?.products || 0) > 0 || (c.children?.length || 0) > 0)
  } catch { /* kategori ağacı yüklenemezse boş kalır */ }
}

// ─── State ───────────────────────────────────────────────────────────────
const selectedCategoryIds = ref<string[]>([])
const selectedBrands = ref<string[]>([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(20)
const failedImages = ref<Record<string, boolean>>({})

const allProducts = computed(() => list())

// ─── Filtering ───────────────────────────────────────────────────────────
const norm = (s: string) => (s || '').toLowerCase().replace(/[\s.\-_]+/g, '')

const filteredProducts = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  const queryNorm = norm(query)

  let result = allProducts.value.filter(product => {
    // Search
    if (query) {
      const matches =
        norm(product.name).includes(queryNorm) ||
        norm(product.brand).includes(queryNorm) ||
        (product.sku ? norm(product.sku).includes(queryNorm) : false) ||
        (product.description ? norm(product.description).includes(queryNorm) : false) ||
        norm(product.category).includes(queryNorm)
      if (!matches) return false
    }
    // Category filter by ID or name
    if (selectedCategoryIds.value.length > 0) {
      const matches = selectedCategoryIds.value.some(id => {
        // Find this category and all its descendants
        const findNode = (nodes: CatNode[], targetId: string): CatNode | null => {
          for (const n of nodes) {
            if (n.id === targetId) return n
            const found = findNode(n.children || [], targetId)
            if (found) return found
          }
          return null
        }
        const node = findNode(categoryTree.value, id)
        if (!node) return product.categoryId === id || product.category === id
        // Check if product is in this category or any of its children
        const childIds = new Set<string>()
        const collectIds = (n: CatNode) => { childIds.add(n.id); (n.children || []).forEach(collectIds) }
        collectIds(node)
        return childIds.has(product.categoryId || '') || product.category === node.name
      })
      if (!matches) return false
    }
    // Brand filter
    if (selectedBrands.value.length > 0 && !selectedBrands.value.includes(product.brand)) return false
    return true
  })

  return result
})

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage.value))
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  return filteredProducts.value.slice(start, start + itemsPerPage.value)
})

// ─── Actions ─────────────────────────────────────────────────────────────
const toggleCategory = (catId: string, parentId?: string) => {
  // If clicking parent with children, toggle expand
  if (parentId === undefined) {
    const node = categoryTree.value.find(c => c.id === catId)
    if (node && (node.children?.length || 0) > 0) {
      expandedParents.value[catId] = !expandedParents.value[catId]
      return
    }
  }
  const idx = selectedCategoryIds.value.indexOf(catId)
  if (idx > -1) selectedCategoryIds.value.splice(idx, 1)
  else {
    // Single select per parent group
    if (parentId) {
      const parent = categoryTree.value.find(c => c.id === parentId)
      if (parent) {
        const childIds = new Set((parent.children || []).map(c => c.id))
        selectedCategoryIds.value = selectedCategoryIds.value.filter(id => !childIds.has(id))
      }
    }
    selectedCategoryIds.value.push(catId)
  }
  currentPage.value = 1
}

const toggleBrand = (brand: string) => {
  const idx = selectedBrands.value.indexOf(brand)
  if (idx > -1) selectedBrands.value.splice(idx, 1)
  else selectedBrands.value.push(brand)
  currentPage.value = 1
}

const clearFilters = () => {
  selectedCategoryIds.value = []
  selectedBrands.value = []
  searchQuery.value = ''
  currentPage.value = 1
}

// ─── Watch URL ────────────────────────────────────────────────────────────
watch(() => route.query.ara, (q) => {
  if (typeof q === 'string') searchQuery.value = q
})

// ─── Mount ───────────────────────────────────────────────────────────────
onMounted(async () => {
  if (!allProducts.value.length) await load()
  await loadCategories()
  await loadOrders()
  if (typeof route.query.ara === 'string') searchQuery.value = route.query.ara
})

useHead({ title: 'Ürünler | SADÖKSAN İnşaat' })
</script>

<template>
  <div class="min-h-screen bg-ink-50">
    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-ink-900">Ürünler</h1>
        <p class="text-ink-500 text-sm mt-1">{{ filteredProducts.length }} ürün listeleniyor</p>
      </div>

      <div class="flex flex-col lg:flex-row gap-6">
        <!-- Sidebar Filters -->
        <aside class="lg:w-64 shrink-0">
          <div class="bg-white rounded-xl border border-ink-200 p-4 space-y-5 sticky top-20">
            <!-- Search -->
            <div>
              <label class="block text-xs font-semibold text-ink-700 mb-2 uppercase tracking-wider">Ara</label>
              <div class="relative">
                <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input v-model="searchQuery" type="text" placeholder="Ürün, marka, SKU..." class="w-full pl-9 pr-3 py-2 border border-ink-300 rounded-lg text-sm" @input="currentPage = 1" />
              </div>
            </div>

            <!-- Categories -->
            <div>
              <label class="block text-xs font-semibold text-ink-700 mb-2 uppercase tracking-wider">Kategoriler</label>
              <div class="space-y-0.5 max-h-80 overflow-y-auto">
                <div v-for="cat in categoryTree" :key="cat.id">
                  <!-- Parent -->
                  <button
                    @click="toggleCategory(cat.id)"
                    :class="['w-full text-left px-2 py-1.5 rounded text-sm flex items-center justify-between transition-colors',
                      selectedCategoryIds.includes(cat.id) ? 'bg-primary-100 text-primary-800 font-medium' : 'text-ink-600 hover:bg-ink-100']"
                  >
                    <span>{{ cat.name }}</span>
                    <span class="flex items-center gap-1">
                      <span class="text-xs text-ink-400">{{ cat._count?.products || 0 }}</span>
                      <Icon v-if="(cat.children?.length || 0) > 0"
                        :name="expandedParents[cat.id] ? 'lucide:chevron-down' : 'lucide:chevron-right'"
                        class="w-3.5 h-3.5 text-ink-400" />
                    </span>
                  </button>
                  <!-- Children -->
                  <div v-if="expandedParents[cat.id] && (cat.children?.length || 0) > 0" class="ml-3 border-l-2 border-ink-100 pl-2 space-y-0.5">
                    <button
                      v-for="child in cat.children" :key="child.id"
                      @click="toggleCategory(child.id, cat.id)"
                      :class="['w-full text-left px-2 py-1 rounded text-sm transition-colors',
                        selectedCategoryIds.includes(child.id) ? 'bg-primary-100 text-primary-800 font-medium' : 'text-ink-500 hover:bg-ink-100']"
                    >
                      {{ child.name }}
                      <span class="text-xs text-ink-400 ml-1">({{ child._count?.products || 0 }})</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Brands -->
            <div>
              <label class="block text-xs font-semibold text-ink-700 mb-2 uppercase tracking-wider">Markalar</label>
              <div class="space-y-0.5 max-h-48 overflow-y-auto">
                <button
                  v-for="brand in [...new Set(allProducts.map(p => p.brand).filter(Boolean))].sort()" :key="brand"
                  @click="toggleBrand(brand)"
                  :class="['w-full text-left px-2 py-1.5 rounded text-sm transition-colors',
                    selectedBrands.includes(brand) ? 'bg-primary-100 text-primary-800 font-medium' : 'text-ink-600 hover:bg-ink-100']"
                >
                  {{ brand }}
                </button>
              </div>
            </div>

            <!-- Clear -->
            <button v-if="selectedCategoryIds.length > 0 || selectedBrands.length > 0 || searchQuery"
              @click="clearFilters"
              class="w-full py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium">
              Filtreleri Temizle
            </button>
          </div>
        </aside>

        <!-- Product Grid -->
        <main class="flex-1 min-w-0">
          <!-- Loading -->
          <div v-if="loading && allProducts.length === 0" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div v-for="i in 8" :key="i" class="bg-white rounded-xl border border-ink-200 p-4 animate-pulse">
              <div class="aspect-square bg-ink-100 rounded-lg mb-3" />
              <div class="h-4 bg-ink-100 rounded w-3/4 mb-2" />
              <div class="h-4 bg-ink-100 rounded w-1/2" />
            </div>
          </div>

          <!-- Error -->
          <div v-else-if="error" class="text-center py-12">
            <Icon name="lucide:alert-circle" class="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p class="text-ink-700 font-medium">Ürünler yüklenemedi</p>
            <button @click="load()" class="mt-3 text-primary-600 text-sm font-medium">Tekrar Dene</button>
          </div>

          <!-- Empty -->
          <div v-else-if="filteredProducts.length === 0" class="text-center py-12">
            <Icon name="lucide:search" class="w-12 h-12 text-ink-300 mx-auto mb-3" />
            <p class="text-ink-700 font-medium">Aramanızla eşleşen ürün bulunamadı</p>
            <button @click="clearFilters" class="mt-3 text-primary-600 text-sm font-medium">Filtreleri Temizle</button>
          </div>

          <!-- Products -->
          <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <ProductCard
              v-for="product in paginatedProducts" :key="product.id"
              :product="product"
              :failed-images="failedImages"
            />
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex justify-center mt-8 gap-1">
            <button
              v-for="p in totalPages" :key="p"
              @click="currentPage = p"
              :class="['px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                currentPage === p ? 'bg-primary-600 text-white' : 'bg-white text-ink-600 hover:bg-ink-100 border border-ink-200']"
            >{{ p }}</button>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
