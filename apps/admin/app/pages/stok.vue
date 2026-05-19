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
  </div>
</template>
