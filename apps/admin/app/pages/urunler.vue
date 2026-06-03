<script setup lang="ts">
import type { Product } from '~/types'
import { formatNumber, formatPrice, formatRelative } from '~/utils/storage'
import { getStockStatusAndInfo } from '~/utils/stock-status'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Ürünler | Sadöksan Admin',
})

const products = useProductsStore()
const stock = useStockStore()
const api = useApi()
const toast = useToast()

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

const showBulkPrice = ref(false)
const bulkForm = ref({ target: 'category' as 'category' | 'brand', targetValue: '', type: 'percentage' as 'percentage' | 'fixed', value: 0 })
const bulkLoading = ref(false)

async function doBulkPrice() {
  if (!bulkForm.value.targetValue.trim()) return
  bulkLoading.value = true
  try {
    const result = await api.post('/products/admin/bulk-price', bulkForm.value)
    toast.push(`${result.updated} ürün güncellendi`, 'success')
    showBulkPrice.value = false
    await products.load()
  } catch (e: any) {
    toast.push(e.message || 'Hata oluştu', 'error')
  }
  bulkLoading.value = false
}

const exportCsv = async () => {
  try {
    await products.exportProducts()
  } catch (err) {
    console.error('Export failed:', err)
    toast.push('Dışa aktarma başarısız', 'error')
  }
}

const importCsv = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  try {
    const result = await products.importProducts(file)
    toast.push(`${result.created} eklendi, ${result.updated} güncellendi${result.errors.length ? `, ${result.errors.length} hata` : ''}`, 'success')
  } catch (err) {
    console.error('Import failed:', err)
    toast.push('İçe aktarma başarısız', 'error')
  }
}
const getProductImage = (p: any): string => {
  return (p as any).imageUrl || ((p as any).images?.[0]) || ''
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
      <div class="h-12 bg-ink-200 rounded-lg animate-pulse"></div>
      <div class="h-64 bg-ink-200 rounded-lg animate-pulse"></div>
    </div>

    <PageHeader
      v-else
      title="Ürünler"
      :description="`${products.items.length} kayıt — ${products.outOfStockCount} stoksuz, ${products.lowStockCount} düşük stok`"
    >
      <template #actions>
        <button
          @click="exportCsv"
          class="px-3 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-300 rounded-md hover:bg-ink-50 flex items-center gap-2"
        >
          <Icon name="lucide:download" class="w-4 h-4" />
          CSV İndir
        </button>
        <button
          @click="showBulkPrice = true"
          class="px-3 py-2 text-sm font-medium text-white bg-amber-600 border border-amber-600 rounded-md hover:bg-amber-700 flex items-center gap-2"
        >
          <Icon name="lucide:percent" class="w-4 h-4" />
          Toplu Fiyat
        </button>
        <label class="px-3 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-300 rounded-md hover:bg-ink-50 flex items-center gap-2 cursor-pointer">
          <Icon name="lucide:upload" class="w-4 h-4" />
          CSV Yükle
          <input type="file" accept=".csv" class="hidden" @change="importCsv" />
        </label>
        <button
          @click="stock.triggerSync()"
          :disabled="stock.syncStatus.status === 'running'"
          class="px-3 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-300 rounded-md hover:bg-ink-50 flex items-center gap-2 disabled:opacity-50"
        >
          <Icon
            :name="stock.syncStatus.status === 'running' ? 'lucide:loader-2' : 'lucide:refresh-cw'"
            :class="['w-4 h-4', stock.syncStatus.status === 'running' && 'animate-spin']"
          />
          Netsis Senkronize Et
        </button>
        <button
          @click="openCreate"
          class="px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md flex items-center gap-2"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          Yeni Ürün
        </button>
      </template>
    </PageHeader>

    <template v-if="!products.loading || products.loaded">
      <!-- Filters -->
      <div class="bg-white rounded-xl border border-ink-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div class="lg:col-span-2 relative">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            :value="products.search"
            @input="products.setSearch(($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="Ürün adı, SKU, Netsis kodu..."
            class="w-full pl-9 pr-3 py-2 border border-ink-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          :value="products.filter.category ?? ''"
          @change="products.setFilter('category', ($event.target as HTMLSelectElement).value || null)"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="">Tüm Kategoriler</option>
          <option v-for="c in products.categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <select
          :value="products.filter.visibility"
          @change="products.setFilter('visibility', ($event.target as HTMLSelectElement).value as 'all' | 'visible' | 'hidden')"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="all">Görünürlük: Tümü</option>
          <option value="visible">Görünür</option>
          <option value="hidden">Gizli</option>
        </select>
        <select
          :value="products.filter.purchasable"
          @change="products.setFilter('purchasable', ($event.target as HTMLSelectElement).value as 'all' | 'yes' | 'no')"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="all">Satılabilirlik: Tümü</option>
          <option value="yes">Satılabilir</option>
          <option value="no">Satılamaz</option>
        </select>
        <select
          :value="products.filter.stock"
          @change="products.setFilter('stock', ($event.target as HTMLSelectElement).value as 'all' | 'in-stock' | 'low' | 'out')"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="all">Stok: Tümü</option>
          <option value="in-stock">Stokta</option>
          <option value="low">Düşük (&lt;=5)</option>
          <option value="out">Stoksuz</option>
        </select>
      </div>

      <div
        v-if="selected.size > 0"
        class="mt-3 pt-3 border-t border-ink-200 flex items-center gap-2 flex-wrap"
      >
        <span class="text-sm text-ink-600 mr-2">{{ selected.size }} ürün seçili</span>
        <button @click="bulkVisible(true)" class="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md">Görünür Yap</button>
        <button @click="bulkVisible(false)" class="px-2.5 py-1 text-xs font-medium text-ink-700 bg-ink-100 hover:bg-ink-200 rounded-md">Gizle</button>
        <button @click="bulkPurchasable(true)" class="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md">Satışa Aç</button>
        <button @click="bulkPurchasable(false)" class="px-2.5 py-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-md">Satışa Kapat</button>
        <button @click="bulkDelete" class="px-2.5 py-1 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md">Sil</button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-ink-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-ink-50 border-b border-ink-200 text-left">
            <tr>
              <th class="px-4 py-3 w-10">
                <input type="checkbox" :checked="allChecked" @change="toggleAll" class="rounded text-primary-600" />
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase tracking-wider w-14">Görsel</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase tracking-wider cursor-pointer" @click="products.setSort('name')">Ürün</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase tracking-wider cursor-pointer" @click="products.setSort('basePrice')">Fiyat</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase tracking-wider cursor-pointer" @click="products.setSort('displayStock')">Stok</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase tracking-wider">Sync</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase tracking-wider">Görünür</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase tracking-wider">Satılır</th>
              <th class="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr v-for="p in products.paginated" :key="p.id" class="hover:bg-ink-50">
              <td class="px-4 py-3">
                <input type="checkbox" :checked="selected.has(p.id)" @change="toggleOne(p.id)" class="rounded text-primary-600" />
              </td>
              <td class="px-4 py-3">
                <div class="w-10 h-10 rounded border border-ink-200 bg-ink-100 overflow-hidden flex-shrink-0">
                  <img
                    v-if="getProductImage(p)"
                    :src="getProductImage(p)"
                    :alt="p.name"
                    class="w-full h-full object-cover"
                    @error="$event.target.style.display='none'"
                  />
                  <div v-else class="w-full h-full flex items-center justify-center text-ink-400">
                    <Icon name="lucide:image" class="h-4 w-4" />
                  </div>
                </div>
              </td>
              <td class="px-4 py-3">
                <p class="font-medium text-ink-900 text-sm truncate max-w-xs">{{ p.name }}</p>
                <p class="text-xs text-ink-500 font-mono mt-0.5">{{ p.sku }} · {{ p.brand }} · {{ p.category }}</p>
              </td>
              <td class="px-4 py-3 text-sm">
                <p class="font-semibold text-ink-900">{{ formatPrice(p.basePrice) }}</p>
                <p class="text-xs text-ink-500">{{ p.unit }} · KDV %{{ (p.taxRate * 100).toFixed(0) }}</p>
              </td>
              <td class="px-4 py-3 text-sm">
                <p :class="['font-bold', getStockColor(p)]">{{ formatNumber(p.displayStock) }}</p>
                <p class="text-xs text-ink-500">
                  {{ p.netsisStock }} − {{ p.reservedStock }} rez. | Min: {{ p.minimumStock }}{{ p.middleStock ? ` / Ort: ${p.middleStock}` : '' }}
                </p>
              </td>
              <td class="px-4 py-3">
                <StatusBadge v-bind="syncBadge(p.syncStatus)" />
                <p class="text-xs text-ink-500 mt-1">{{ formatRelative(p.lastNetsisSync) }}</p>
              </td>
              <td class="px-4 py-3">
                <button
                  @click="toggleProductVisible(p.id)"
                  :disabled="selected.has(p.id)"
                  :class="[
                    'relative inline-flex h-5 w-9 rounded-full transition-colors',
                    p.visible ? 'bg-primary-600' : 'bg-ink-300',
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
                    p.purchasable ? 'bg-emerald-600' : 'bg-ink-300',
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
                <button @click="openEdit(p)" class="p-1.5 text-ink-500 hover:bg-ink-100 hover:text-primary-600 rounded-md" title="Düzenle">
                  <Icon name="lucide:pencil" class="w-4 h-4" />
                </button>
                <button
                  @click="confirmAndDeleteProduct(p.id, p.name)"
                  class="p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600 rounded-md"
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

      <div v-if="products.filtered.length > 0" class="px-4 border-t border-ink-200">
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

    <!-- Bulk Price Modal -->
    <Modal v-if="showBulkPrice" size="md" title="Toplu Fiyat Güncelleme" @close="showBulkPrice = false">
      <div class="p-4 space-y-4">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-ink-700 mb-1">Hedef</label>
            <select v-model="bulkForm.target" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm">
              <option value="category">Kategori</option>
              <option value="brand">Marka</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-700 mb-1">Değer</label>
            <input
              v-model="bulkForm.targetValue"
              type="text"
              class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
              :placeholder="bulkForm.target === 'category' ? 'örn: Seramik' : 'örn: AKGÜN'"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-sm font-medium text-ink-700 mb-1">İşlem Tipi</label>
            <select v-model="bulkForm.type" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm">
              <option value="percentage">Yüzde (%)</option>
              <option value="fixed">Sabit Tutar (TL)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-700 mb-1">
              {{ bulkForm.type === 'percentage' ? 'Zam Oranı (%)' : 'Tutar Değişimi (TL)' }}
            </label>
            <input v-model.number="bulkForm.value" type="number" step="any" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" placeholder="15" />
            <p class="text-xs text-ink-400 mt-1">
              {{ bulkForm.type === 'percentage' ? '+%15 = %15 zam, -%10 = %10 indirim' : '+50 = 50TL zam, -20 = 20TL indirim' }}
            </p>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3 p-4 border-t border-ink-100">
          <button class="px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 rounded-lg" @click="showBulkPrice = false">
            İptal
          </button>
          <button
            class="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold disabled:opacity-50"
            :disabled="bulkLoading"
            @click="doBulkPrice"
          >
            {{ bulkLoading ? 'Güncelleniyor...' : 'Toplu Güncelle' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>
