<script setup lang="ts">
import { formatNumber, formatRelative, formatDate } from '~/utils/storage'
import { getStockStatusAndInfo } from '~/utils/stock-status'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Stok | Sadöksan Admin',
})

const stock = useStockStore()
const products = useProductsStore()

onMounted(() => {
  if (!stock.loaded) stock.load()
  if (!products.loaded) products.load()
})

const reservationFilter = ref<'all' | 'active' | 'released' | 'fulfilled'>('active')
const reservations = computed(() => {
  const list =
    reservationFilter.value === 'all'
      ? stock.reservations
      : stock.reservations.filter((r) => r.status === reservationFilter.value)
  return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

// Products with warning or critical status
const warningAndCriticalStock = computed(() => {
  return products.items
    .filter((p) => {
      const status = getStockStatusAndInfo(p.displayStock, p.minimumStock, p.middleStock)
      return status.status === 'red' || status.status === 'orange'
    })
    .sort((a, b) => a.displayStock - b.displayStock)
})

const lowStock = computed(() =>
  warningAndCriticalStock.value.filter((p) => {
    const status = getStockStatusAndInfo(p.displayStock, p.minimumStock, p.middleStock)
    return status.status === 'orange' // Middle warning zone
  }),
)

const outOfStock = computed(() =>
  warningAndCriticalStock.value.filter((p) => {
    const status = getStockStatusAndInfo(p.displayStock, p.minimumStock, p.middleStock)
    return status.status === 'red' // Critical zone
  }),
)

const reservationBadge = (s: 'active' | 'released' | 'fulfilled') => {
  const m = {
    active: { variant: 'warning' as const, label: 'Aktif' },
    released: { variant: 'neutral' as const, label: 'Serbest' },
    fulfilled: { variant: 'success' as const, label: 'Tamamlandı' },
  }
  return m[s]
}

// ─── Ürün Stok Tablosu State ──────────────────────────────────────────
const stockSearch = ref('')
const stockCatFilter = ref('')
const stockStatusFilter = ref<'all' | 'in-stock' | 'low' | 'out'>('all')
const stockPage = ref(1)
const pageSize = 25

const stockFiltered = computed(() => {
  let list = products.items
  const q = stockSearch.value.toLowerCase()
  if (q) list = list.filter((p: any) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  if (stockCatFilter.value) list = list.filter((p: any) => p.category === stockCatFilter.value)
  if (stockStatusFilter.value !== 'all') {
    list = list.filter((p: any) => {
      const status = getStockStatusAndInfo(p.displayStock, p.minimumStock, p.middleStock)
      if (stockStatusFilter.value === 'in-stock') return status.status === 'green'
      if (stockStatusFilter.value === 'low') return status.status === 'orange'
      return status.status === 'red'
    })
  }
  return list
})

const stockPaginated = computed(() => {
  const start = (stockPage.value - 1) * pageSize
  return stockFiltered.value.slice(start, start + pageSize)
})

const stockTotalPages = computed(() => Math.max(1, Math.ceil(stockFiltered.value.length / pageSize)))

// ─── Modal/Drawer State ───────────────────────────────────────────────
const showMovementDrawer = ref(false)
const drawerProduct = ref<any>(null)
const showManualModal = ref<'entry' | 'exit' | null>(null)
const showCountAdjust = ref(false)

const openMovements = (product: any) => {
  drawerProduct.value = product
  showMovementDrawer.value = true
}

const onModalSaved = () => {
  stockPage.value = 1
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="Stok Yönetimi"
      description="Netsis stok eşitlemesi, rezervasyonlar ve görünür stok hesaplaması."
    >
      <template #actions>
        <button
          @click="stock.triggerSync()"
          :disabled="stock.syncStatus.status === 'running'"
          class="px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md flex items-center gap-2 disabled:opacity-50"
        >
          <Icon
            :name="stock.syncStatus.status === 'running' ? 'lucide:loader-2' : 'lucide:refresh-cw'"
            :class="['w-4 h-4', stock.syncStatus.status === 'running' && 'animate-spin']"
          />
          Şimdi Senkronize Et
        </button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Toplam Ürün" :value="products.items.length" icon="lucide:boxes" color="blue" />
      <StatCard
        label="Aktif Rezervasyon"
        :value="formatNumber(stock.totalReservedUnits)"
        icon="lucide:lock"
        color="amber"
      />
      <StatCard label="Orta Uyarı (Turuncu)" :value="lowStock.length" icon="lucide:trending-down" color="amber" />
      <StatCard label="Kritik (Kırmızı)" :value="outOfStock.length" icon="lucide:alert-circle" color="red" />
    </div>

    <!-- Sync detail -->
    <div class="bg-white rounded-xl border border-ink-200 p-5">
      <h3 class="font-semibold text-ink-900 mb-4 flex items-center gap-2">
        <Icon name="lucide:refresh-cw" class="w-4 h-4 text-primary-600" />
        Netsis Senkronizasyon Durumu
      </h3>
      <dl class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <dt class="text-xs text-ink-500 uppercase tracking-wider">Son Eşitleme</dt>
          <dd class="font-medium text-ink-900 mt-1">
            {{ stock.syncStatus.lastSyncAt ? formatRelative(stock.syncStatus.lastSyncAt) : 'Hiç' }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-ink-500 uppercase tracking-wider">Eşitlenen Ürün</dt>
          <dd class="font-medium text-ink-900 mt-1">{{ formatNumber(stock.syncStatus.productsSynced) }}</dd>
        </div>
        <div>
          <dt class="text-xs text-ink-500 uppercase tracking-wider">Hata</dt>
          <dd
            class="font-medium mt-1"
            :class="stock.syncStatus.errors > 0 ? 'text-red-600' : 'text-ink-900'"
          >
            {{ stock.syncStatus.errors }}
          </dd>
        </div>
        <div>
          <dt class="text-xs text-ink-500 uppercase tracking-wider">Sonraki Eşitleme</dt>
          <dd class="font-medium text-ink-900 mt-1">
            {{ stock.syncStatus.nextScheduledAt ? formatDate(stock.syncStatus.nextScheduledAt) : '—' }}
          </dd>
        </div>
      </dl>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Low stock (orange - middle warning) -->
      <div class="bg-white rounded-xl border border-ink-200">
        <div class="px-5 py-4 border-b border-ink-200 bg-orange-50">
          <h3 class="font-semibold text-ink-900 flex items-center gap-2">
            <Icon name="lucide:alert-triangle" class="w-4 h-4 text-orange-600" />
            Orta Uyarı (Turuncu) — Minimum ve Orta Stok Arasında
          </h3>
        </div>
        <div v-if="lowStock.length > 0" class="divide-y divide-ink-100">
          <div v-for="p in lowStock" :key="p.id" class="px-5 py-3 flex items-center justify-between bg-orange-50">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-sm text-ink-900 truncate">{{ p.name }}</p>
              <p class="text-xs text-ink-500 font-mono">{{ p.sku }} · Min: {{ p.minimumStock }}{{ p.middleStock ? ` / Ort: ${p.middleStock}` : '' }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="font-bold text-orange-600">{{ p.displayStock }}</p>
              <p class="text-xs text-ink-500">{{ p.unit }}</p>
            </div>
          </div>
        </div>
        <EmptyState v-else icon="lucide:check-circle" title="Düşük stoklu ürün yok" />
      </div>

      <!-- Out of stock (red - critical) -->
      <div class="bg-white rounded-xl border border-ink-200">
        <div class="px-5 py-4 border-b border-ink-200 bg-red-50">
          <h3 class="font-semibold text-ink-900 flex items-center gap-2">
            <Icon name="lucide:alert-circle" class="w-4 h-4 text-red-600" />
            Kritik Stok (Kırmızı) — Minimum Stokun Altında
          </h3>
        </div>
        <div v-if="outOfStock.length > 0" class="divide-y divide-ink-100">
          <div v-for="p in outOfStock" :key="p.id" class="px-5 py-3 flex items-center justify-between bg-red-50">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-sm text-ink-900 truncate">{{ p.name }}</p>
              <p class="text-xs text-ink-500 font-mono">
                {{ p.sku }} · Mevcut: {{ p.displayStock }} · Min: {{ p.minimumStock }}{{ p.middleStock ? ` / Ort: ${p.middleStock}` : '' }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="font-bold text-red-600 text-lg">{{ p.displayStock }}</p>
              <p class="text-xs text-ink-500">{{ p.unit }}</p>
            </div>
          </div>
        </div>
        <EmptyState v-else icon="lucide:check-circle" title="Stoksuz ürün yok" />
      </div>
    </div>

    <!-- Reservations -->
    <div class="bg-white rounded-xl border border-ink-200">
      <div class="px-5 py-4 border-b border-ink-200 flex items-center justify-between">
        <h3 class="font-semibold text-ink-900 flex items-center gap-2">
          <Icon name="lucide:lock" class="w-4 h-4 text-primary-600" />
          Rezervasyonlar
        </h3>
        <select
          v-model="reservationFilter"
          class="px-2.5 py-1.5 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="active">Aktif</option>
          <option value="released">Serbest</option>
          <option value="fulfilled">Tamamlanan</option>
          <option value="all">Tümü</option>
        </select>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-ink-50 border-b border-ink-200 text-left">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Ürün</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Sipariş</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Bayi</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Miktar</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Durum</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Oluşturuldu</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr v-for="r in reservations" :key="r.id" class="hover:bg-ink-50">
              <td class="px-5 py-3 text-sm text-ink-900 truncate max-w-xs">{{ r.productName }}</td>
              <td class="px-5 py-3 text-sm font-mono text-ink-700">{{ r.orderNo }}</td>
              <td class="px-5 py-3 text-sm text-ink-700">{{ r.dealerName ?? '—' }}</td>
              <td class="px-5 py-3 text-sm font-semibold text-ink-900">{{ formatNumber(r.quantity) }}</td>
              <td class="px-5 py-3"><StatusBadge v-bind="reservationBadge(r.status)" /></td>
              <td class="px-5 py-3 text-xs text-ink-500">{{ formatRelative(r.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="reservations.length === 0" icon="lucide:lock-open" title="Rezervasyon yok" />
      </div>
    </div>

    <!-- Stok Durumu Tablosu -->
    <div class="bg-white rounded-xl border border-ink-200">
      <div class="px-5 py-4 border-b border-ink-200 flex items-center justify-between flex-wrap gap-3">
        <h3 class="font-semibold text-ink-900 flex items-center gap-2">
          <Icon name="lucide:boxes" class="w-4 h-4 text-primary-600" />
          Stok Durumu
        </h3>
        <div class="flex items-center gap-2 flex-wrap">
          <button @click="showManualModal = 'entry'" class="px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center gap-1.5">
            <Icon name="lucide:plus" class="w-3.5 h-3.5" /> Stok Girişi
          </button>
          <button @click="showManualModal = 'exit'" class="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md flex items-center gap-1.5">
            <Icon name="lucide:minus" class="w-3.5 h-3.5" /> Stok Çıkışı
          </button>
          <button @click="showCountAdjust = true" class="px-3 py-1.5 text-sm font-medium text-ink-700 bg-ink-100 hover:bg-ink-200 rounded-md flex items-center gap-1.5">
            <Icon name="lucide:scale" class="w-3.5 h-3.5" /> Sayım Düzelt
          </button>
        </div>
      </div>

      <div class="px-5 py-3 border-b border-ink-100 flex items-center gap-3 flex-wrap">
        <input v-model="stockSearch" type="text" placeholder="SKU veya ürün adı ara..."
          class="px-3 py-1.5 border border-ink-300 rounded-md text-sm w-56" />
        <select v-model="stockCatFilter" class="px-2.5 py-1.5 border border-ink-300 rounded-md text-sm">
          <option value="">Tüm Kategoriler</option>
          <option v-for="c in products.categories" :key="c" :value="c">{{ c }}</option>
        </select>
        <select v-model="stockStatusFilter" class="px-2.5 py-1.5 border border-ink-300 rounded-md text-sm">
          <option value="all">Tüm Durumlar</option>
          <option value="in-stock">Stokta Var</option>
          <option value="low">Düşük Stok</option>
          <option value="out">Stokta Yok</option>
        </select>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-ink-50 border-b border-ink-200 text-left">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">SKU</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Ürün</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Kategori</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Birim</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Netsis</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Bekleyen</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Rezerve</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Display</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Durum</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Aksiyon</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr v-for="p in stockPaginated" :key="p.id" class="hover:bg-ink-50">
              <td class="px-5 py-3 text-sm font-mono text-ink-700">{{ p.sku }}</td>
              <td class="px-5 py-3 text-sm text-ink-900 max-w-xs truncate">{{ p.name }}</td>
              <td class="px-5 py-3 text-sm text-ink-600">{{ p.category }}</td>
              <td class="px-5 py-3 text-sm text-ink-600">{{ p.unit }}</td>
              <td class="px-5 py-3 text-sm font-semibold text-ink-900">{{ formatNumber(p.netsisStock) }}</td>
              <td class="px-5 py-3 text-sm text-ink-600">{{ formatNumber(p.netsisPendingQuantity) }}</td>
              <td class="px-5 py-3 text-sm text-ink-600">{{ formatNumber(p.reservedStock) }}</td>
              <td class="px-5 py-3 text-sm font-bold text-ink-900">{{ formatNumber(p.displayStock) }}</td>
              <td class="px-5 py-3">
                <span :class="['inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                  getStockStatusAndInfo(p.displayStock, p.minimumStock, p.middleStock).status === 'green' ? 'bg-green-100 text-green-700' :
                  getStockStatusAndInfo(p.displayStock, p.minimumStock, p.middleStock).status === 'orange' ? 'bg-orange-100 text-orange-700' :
                  'bg-red-100 text-red-700']">
                  {{ getStockStatusAndInfo(p.displayStock, p.minimumStock, p.middleStock).label }}
                </span>
              </td>
              <td class="px-5 py-3">
                <button @click="openMovements(p)" class="px-2.5 py-1 text-xs font-medium text-primary-700 hover:bg-primary-50 rounded-md">
                  Hareketler
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="stockFiltered.length === 0" icon="lucide:boxes" title="Ürün bulunamadı" />
      </div>

      <div v-if="stockTotalPages > 1" class="px-5 py-3 border-t border-ink-100 flex items-center justify-between">
        <span class="text-xs text-ink-500">{{ stockFiltered.length }} ürün · {{ stockTotalPages }} sayfa</span>
        <div class="flex items-center gap-1">
          <button :disabled="stockPage <= 1" @click="stockPage--"
            class="px-2 py-1 text-sm border border-ink-300 rounded hover:bg-ink-50 disabled:opacity-30">Geri</button>
          <span class="px-2 text-sm text-ink-700">{{ stockPage }} / {{ stockTotalPages }}</span>
          <button :disabled="stockPage >= stockTotalPages" @click="stockPage++"
            class="px-2 py-1 text-sm border border-ink-300 rounded hover:bg-ink-50 disabled:opacity-30">İleri</button>
        </div>
      </div>
    </div>

    <!-- Modals & Drawers -->
    <StockMovementDrawer
      v-if="showMovementDrawer && drawerProduct"
      :product-id="drawerProduct.id"
      :product-name="drawerProduct.name"
      :product-sku="drawerProduct.sku"
      :current-stock="drawerProduct.displayStock"
      :unit="drawerProduct.unit"
      @close="showMovementDrawer = false"
    />

    <ManualStockModal
      v-if="showManualModal"
      :mode="showManualModal"
      @close="showManualModal = null"
      @saved="onModalSaved"
    />

    <CountAdjustModal
      v-if="showCountAdjust"
      @close="showCountAdjust = false"
      @saved="onModalSaved"
    />
  </div>
</template>
