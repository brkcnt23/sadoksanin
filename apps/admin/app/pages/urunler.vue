<script setup lang="ts">
import type { Product } from '~/types'
import { formatNumber, formatPrice, formatRelative } from '~/utils/storage'
import { getStockStatusAndInfo } from '~/utils/stock-status'
import { applyCurrencyFormatting } from '~/utils/excel-format'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Ürünler | Sadöksan Admin',
})

const products = useProductsStore()
const stock = useStockStore()

onMounted(() => {
  if (!products.loaded) products.load()
  if (!stock.loaded) stock.load()
})

const editing = ref<Product | null>(null)
const formOpen = ref(false)
const selected = ref<Set<string>>(new Set())
const updatingIds = ref<Set<string>>(new Set())

const openCreate = () => {
  editing.value = null
  formOpen.value = true
}
const openEdit = (p: Product) => {
  editing.value = p
  formOpen.value = true
}

const toggleAll = (e: Event) => {
  const checked = (e.target as HTMLInputElement).checked
  if (checked) selected.value = new Set(products.paginated.map((p) => p.id))
  else selected.value = new Set()
}
const toggleOne = (id: string) => {
  if (selected.value.has(id)) selected.value.delete(id)
  else selected.value.add(id)
  selected.value = new Set(selected.value)
}

const allChecked = computed(
  () => products.paginated.length > 0 && products.paginated.every((p) => selected.value.has(p.id)),
)

const bulkVisible = async (visible: boolean) => {
  await products.bulkUpdate([...selected.value], { visible })
  selected.value = new Set()
}
const bulkPurchasable = async (purchasable: boolean) => {
  await products.bulkUpdate([...selected.value], { purchasable })
  selected.value = new Set()
}
const bulkDelete = () => {
  if (!confirm(`${selected.value.size} ürünü silmek istediğinize emin misiniz?`)) return
  ;[...selected.value].forEach((id) => products.remove(id))
  selected.value = new Set()
}

const exportXlsx = async () => {
  const XLSX = await import('xlsx')
  const rows = products.filtered.map((p) => ({
    'SKU': p.sku,
    'Netsis Kodu': p.netsisCode,
    'Ürün Adı': p.name,
    'Marka': p.brand,
    'Kategori': p.category,
    'Birim': p.unit,
    'Birim Fiyat': p.basePrice,
    'KDV': `%${(p.taxRate * 100).toFixed(0)}`,
    'Netsis Stok': p.netsisStock,
    'Rezerve': p.reservedStock,
    'Görünür Stok': p.displayStock,
    'Minimum Stok': p.minimumStock,
    'Orta Stok': p.middleStock ?? '—',
    'Görünür': p.visible ? 'Evet' : 'Hayır',
    'Satılabilir': p.purchasable ? 'Evet' : 'Hayır',
    'Son Sync': p.lastNetsisSync,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)

  // Apply currency formatting to price columns
  applyCurrencyFormatting(ws, Object.keys(rows[0] || {}))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ürünler')
  XLSX.writeFile(wb, `sadoksan-urunler-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const getStockColor = (product: Product): string => {
  const info = getStockStatusAndInfo(product.displayStock, product.minimumStock, product.middleStock)
  return info.color
}

const syncBadge = (s: Product['syncStatus']) => {
  const map: Record<Product['syncStatus'], { variant: 'success' | 'warning' | 'danger' | 'neutral'; label: string }> = {
    synced: { variant: 'success', label: 'Senkronize' },
    pending: { variant: 'warning', label: 'Bekliyor' },
    error: { variant: 'danger', label: 'Hata' },
    never: { variant: 'neutral', label: 'Eşitlenmedi' },
  }
  return map[s]
}

const toggleProductVisible = async (id: string) => {
  updatingIds.value.add(id)
  try {
    await products.toggleVisible(id)
  } finally {
    updatingIds.value.delete(id)
  }
}

const toggleProductPurchasable = async (id: string) => {
  updatingIds.value.add(id)
  try {
    await products.togglePurchasable(id)
  } finally {
    updatingIds.value.delete(id)
  }
}

const confirmAndDeleteProduct = (id: string, name: string) => {
  if (window.confirm(`${name} silinsin mi?`)) {
    products.remove(id)
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Error Banner -->
    <div v-if="products.error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
      <div>{{ products.error }}</div>
      <button @click="products.error = null" class="text-red-600 hover:text-red-800 font-medium">Kapat</button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="products.loading && !products.loaded" class="space-y-3">
      <div class="h-12 bg-slate-200 rounded-lg animate-pulse"></div>
      <div class="h-64 bg-slate-200 rounded-lg animate-pulse"></div>
    </div>

    <PageHeader
      v-else
      title="Ürünler"
      :description="`${products.items.length} kayıt — ${products.outOfStockCount} stoksuz, ${products.lowStockCount} düşük stok`"
    >
      <template #actions>
        <button
          @click="exportXlsx"
          class="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2"
        >
          <Icon name="lucide:download" class="w-4 h-4" />
          Excel İndir
        </button>
        <button
          @click="stock.triggerSync()"
          :disabled="stock.syncStatus.status === 'running'"
          class="px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 flex items-center gap-2 disabled:opacity-50"
        >
          <Icon
            :name="stock.syncStatus.status === 'running' ? 'lucide:loader-2' : 'lucide:refresh-cw'"
            :class="['w-4 h-4', stock.syncStatus.status === 'running' && 'animate-spin']"
          />
          Netsis Senkronize Et
        </button>
        <button
          @click="openCreate"
          class="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          Yeni Ürün
        </button>
      </template>
    </PageHeader>

    <template v-if="!products.loading || products.loaded">
      <!-- Filters -->
      <div class="bg-white rounded-xl border border-slate-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div class="lg:col-span-2 relative">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            :value="products.search"
            @input="products.setSearch(($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="Ürün adı, SKU, Netsis kodu..."
            class="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          :value="products.filter.category ?? ''"
          @change="products.setFilter('category', ($event.target as HTMLSelectElement).value || null)"
          class="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
        >
          <option value="">Tüm Kategoriler</option>
          <option v-for="c in products.categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <select
          :value="products.filter.visibility"
          @change="products.setFilter('visibility', ($event.target as HTMLSelectElement).value as 'all' | 'visible' | 'hidden')"
          class="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
        >
          <option value="all">Görünürlük: Tümü</option>
          <option value="visible">Görünür</option>
          <option value="hidden">Gizli</option>
        </select>
        <select
          :value="products.filter.purchasable"
          @change="products.setFilter('purchasable', ($event.target as HTMLSelectElement).value as 'all' | 'yes' | 'no')"
          class="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
        >
          <option value="all">Satılabilirlik: Tümü</option>
          <option value="yes">Satılabilir</option>
          <option value="no">Satılamaz</option>
        </select>
        <select
          :value="products.filter.stock"
          @change="products.setFilter('stock', ($event.target as HTMLSelectElement).value as 'all' | 'in-stock' | 'low' | 'out')"
          class="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
        >
          <option value="all">Stok: Tümü</option>
          <option value="in-stock">Stokta</option>
          <option value="low">Düşük (&lt;=5)</option>
          <option value="out">Stoksuz</option>
        </select>
      </div>

      <div
        v-if="selected.size > 0"
        class="mt-3 pt-3 border-t border-slate-200 flex items-center gap-2 flex-wrap"
      >
        <span class="text-sm text-slate-600 mr-2">{{ selected.size }} ürün seçili</span>
        <button @click="bulkVisible(true)" class="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md">Görünür Yap</button>
        <button @click="bulkVisible(false)" class="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md">Gizle</button>
        <button @click="bulkPurchasable(true)" class="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md">Satışa Aç</button>
        <button @click="bulkPurchasable(false)" class="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md">Satışa Kapat</button>
        <button @click="bulkDelete" class="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md">Sil</button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200 text-left">
            <tr>
              <th class="px-4 py-3 w-10">
                <input type="checkbox" :checked="allChecked" @change="toggleAll" class="rounded text-blue-600" />
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer" @click="products.setSort('name')">Ürün</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer" @click="products.setSort('basePrice')">Fiyat</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider cursor-pointer" @click="products.setSort('displayStock')">Stok</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Sync</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Görünür</th>
              <th class="px-4 py-3 text-xs font-semibold text-slate-700 uppercase tracking-wider">Satılır</th>
              <th class="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="p in products.paginated" :key="p.id" class="hover:bg-slate-50">
              <td class="px-4 py-3">
                <input type="checkbox" :checked="selected.has(p.id)" @change="toggleOne(p.id)" class="rounded text-blue-600" />
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-slate-900 text-sm truncate max-w-xs">{{ p.name }}</p>
                <p class="text-xs text-slate-500 font-mono mt-0.5">{{ p.sku }} · {{ p.brand }} · {{ p.category }}</p>
              </td>
              <td class="px-4 py-3 text-sm">
                <p class="font-semibold text-slate-900">{{ formatPrice(p.basePrice) }}</p>
                <p class="text-xs text-slate-500">{{ p.unit }} · KDV %{{ (p.taxRate * 100).toFixed(0) }}</p>
              </td>
              <td class="px-4 py-3 text-sm">
                <p :class="['font-bold', getStockColor(p)]">{{ formatNumber(p.displayStock) }}</p>
                <p class="text-xs text-slate-500">
                  {{ p.netsisStock }} − {{ p.reservedStock }} rez. | Min: {{ p.minimumStock }}{{ p.middleStock ? ` / Ort: ${p.middleStock}` : '' }}
                </p>
              </td>
              <td class="px-4 py-3">
                <StatusBadge v-bind="syncBadge(p.syncStatus)" />
                <p class="text-xs text-slate-500 mt-1">{{ formatRelative(p.lastNetsisSync) }}</p>
              </td>
              <td class="px-4 py-3">
                <button
                  @click="toggleProductVisible(p.id)"
                  :disabled="selected.has(p.id)"
                  :class="[
                    'relative inline-flex h-5 w-9 rounded-full transition-colors',
                    p.visible ? 'bg-blue-600' : 'bg-slate-300',
                    selected.has(p.id) && 'opacity-50 cursor-not-allowed',
                  ]"
                >
                  <span
                    :class="[
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                      p.visible ? 'translate-x-4' : 'translate-x-0.5',
                    ]"
                  />
                </button>
              </td>
              <td class="px-4 py-3">
                <button
                  @click="toggleProductPurchasable(p.id)"
                  :disabled="selected.has(p.id)"
                  :class="[
                    'relative inline-flex h-5 w-9 rounded-full transition-colors',
                    p.purchasable ? 'bg-emerald-600' : 'bg-slate-300',
                    selected.has(p.id) && 'opacity-50 cursor-not-allowed',
                  ]"
                >
                  <span
                    :class="[
                      'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                      p.purchasable ? 'translate-x-4' : 'translate-x-0.5',
                    ]"
                  />
                </button>
              </td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <button @click="openEdit(p)" class="p-1.5 text-slate-500 hover:bg-slate-100 hover:text-blue-600 rounded-md" title="Düzenle">
                  <Icon name="lucide:pencil" class="w-4 h-4" />
                </button>
                <button
                  @click="confirmAndDeleteProduct(p.id, p.name)"
                  class="p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-md"
                  title="Sil"
                >
                  <Icon name="lucide:trash-2" class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState
          v-if="products.paginated.length === 0"
          icon="lucide:package-x"
          title="Ürün bulunamadı"
          description="Filtreleri sıfırlayın veya yeni ürün ekleyin."
        />
      </div>

      <div v-if="products.filtered.length > 0" class="px-4 border-t border-slate-200">
        <Pagination
          :page="products.page"
          :total-pages="products.totalPages"
          :total="products.filtered.length"
          :page-size="products.pageSize"
          @change="products.setPage"
        />
      </div>
    </div>
    </template>

    <ProductsProductFormModal :open="formOpen" :product="editing" @close="formOpen = false" />
  </div>
</template>
