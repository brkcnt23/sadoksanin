<script setup lang="ts">
import { formatPrice, formatDate, formatRelative } from '~/utils/storage'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Dashboard | Sadöksan Admin',
})

const orders = useOrdersStore()
const dealers = useDealersStore()
const products = useProductsStore()
const stock = useStockStore()
const settings = useSettingsStore()
const auth = useAdminAuth()

onMounted(() => {
  if (!orders.loaded) orders.load()
  if (!dealers.loaded) dealers.load()
  if (!products.loaded) products.load()
  if (!stock.loaded) stock.load()
  if (!settings.loaded) settings.load()
})

const pendingOrders = computed(() =>
  orders.items
    .filter((o) => o.status === 'pending-approval')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8),
)

const recentOrders = computed(() =>
  [...orders.items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8),
)

const todayRevenue = computed(() => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  return orders.items
    .filter((o) => new Date(o.createdAt) >= start && o.status !== 'cancelled' && o.status !== 'rejected')
    .reduce((s, o) => s + o.total, 0)
})

const approve = (id: string) => {
  const u = auth.getUser()
  if (!u) return
  orders.approve(id, u.id)
}

const orderStatusBadge = (s: string) => {
  const m: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'; label: string }> = {
    'pending-approval': { variant: 'warning', label: 'Onay Bekliyor' },
    approved: { variant: 'info', label: 'Onaylandı' },
    preparing: { variant: 'info', label: 'Hazırlanıyor' },
    shipped: { variant: 'purple', label: 'Sevk Edildi' },
    completed: { variant: 'success', label: 'Tamamlandı' },
    cancelled: { variant: 'neutral', label: 'İptal' },
    rejected: { variant: 'danger', label: 'Reddedildi' },
  }
  return m[s] ?? { variant: 'neutral', label: s }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Stats -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <StatCard
        label="Toplam Sipariş"
        :value="orders.items.length"
        icon="lucide:package"
        color="blue"
      />
      <StatCard
        label="Onay Bekleyen"
        :value="orders.pendingCount"
        icon="lucide:clock"
        color="amber"
      />
      <StatCard
        label="Bugünkü Ciro"
        :value="formatPrice(todayRevenue)"
        icon="lucide:trending-up"
        color="green"
      />
      <StatCard
        label="Aktif Bayi"
        :value="dealers.activeCount"
        icon="lucide:users"
        color="purple"
      />
      <StatCard
        label="Düşük/Stoksuz"
        :value="`${products.lowStockCount + products.outOfStockCount}`"
        icon="lucide:alert-circle"
        color="red"
      />
    </div>

    <!-- Sync banner -->
    <div
      v-if="stock.syncStatus.lastSyncAt"
      class="bg-white rounded-xl border border-ink-200 p-4 flex items-center justify-between"
    >
      <div class="flex items-center gap-3">
        <div
          :class="[
            'w-2 h-2 rounded-full',
            stock.syncStatus.status === 'success'
              ? 'bg-emerald-500'
              : stock.syncStatus.status === 'running'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-red-500',
          ]"
        />
        <div>
          <p class="text-sm font-medium text-ink-900">
            Netsis Senkronizasyon — Son: {{ formatRelative(stock.syncStatus.lastSyncAt) }}
          </p>
          <p class="text-xs text-ink-500">
            {{ stock.syncStatus.productsSynced }} ürün ·
            {{ stock.syncStatus.errors }} hata ·
            {{ (stock.syncStatus.lastSyncDuration / 1000).toFixed(1) }}s ·
            Sonraki: {{ stock.syncStatus.nextScheduledAt ? formatDate(stock.syncStatus.nextScheduledAt) : '—' }}
          </p>
        </div>
      </div>
      <button
        @click="stock.triggerSync()"
        :disabled="stock.syncStatus.status === 'running'"
        class="px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-md flex items-center gap-1.5 disabled:opacity-50"
      >
        <Icon
          :name="stock.syncStatus.status === 'running' ? 'lucide:loader-2' : 'lucide:refresh-cw'"
          :class="['w-4 h-4', stock.syncStatus.status === 'running' && 'animate-spin']"
        />
        Şimdi Senkronize Et
      </button>
    </div>

    <!-- Main content grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Pending approvals -->
      <div class="lg:col-span-2 bg-white rounded-xl border border-ink-200">
        <div class="px-5 py-4 border-b border-ink-200 flex items-center justify-between">
          <h3 class="font-semibold text-ink-900 flex items-center gap-2">
            <Icon name="lucide:clock" class="w-4 h-4 text-amber-600" />
            Onay Bekleyen Siparişler
          </h3>
          <NuxtLink to="/siparisler" class="text-xs font-medium text-primary-600 hover:text-primary-700">Tümü →</NuxtLink>
        </div>

        <div v-if="pendingOrders.length > 0" class="divide-y divide-ink-100">
          <div v-for="order in pendingOrders" :key="order.id" class="p-4 hover:bg-ink-50 flex items-center gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="font-mono text-sm font-semibold text-ink-900">{{ order.orderNo }}</p>
                <StatusBadge variant="purple" :label="order.customerType" />
              </div>
              <p class="text-sm text-ink-700 mt-0.5 truncate">{{ order.customerName }}</p>
              <p class="text-xs text-ink-500 mt-0.5">
                {{ order.lines.length }} ürün · {{ formatRelative(order.createdAt) }}
              </p>
            </div>
            <div class="text-right shrink-0">
              <p class="font-bold text-ink-900">{{ formatPrice(order.total) }}</p>
              <div class="flex gap-1 mt-1.5">
                <NuxtLink
                  :to="`/siparisler/${order.id}`"
                  class="px-2.5 py-1 text-xs font-medium text-ink-700 bg-ink-100 hover:bg-ink-200 rounded"
                >
                  Detay
                </NuxtLink>
                <button
                  @click="approve(order.id)"
                  class="px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded"
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        </div>

        <EmptyState
          v-else
          icon="lucide:inbox"
          title="Onay bekleyen sipariş yok"
          description="Tüm siparişler işlenmiş durumda."
        />
      </div>

      <!-- Side widgets -->
      <div class="space-y-4">
        <div class="bg-white rounded-xl border border-ink-200 p-5">
          <h3 class="font-semibold text-ink-900 mb-4 text-sm">Sipariş Türü</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-ink-600">B2C (Bireysel)</span>
              <span class="font-semibold text-ink-900">
                {{ orders.items.filter((o) => o.customerType === 'B2C').length }}
              </span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-ink-600">B2B (Bayi)</span>
              <span class="font-semibold text-ink-900">
                {{ orders.items.filter((o) => o.customerType === 'B2B').length }}
              </span>
            </div>
            <div class="pt-3 border-t border-ink-100 space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-ink-500">B2C Ciro</span>
                <span class="font-medium text-ink-700">{{ formatPrice(orders.revenueByType.b2c) }}</span>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-ink-500">B2B Ciro</span>
                <span class="font-medium text-ink-700">{{ formatPrice(orders.revenueByType.b2b) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-ink-200 p-5">
          <h3 class="font-semibold text-ink-900 mb-4 text-sm">Kritik Uyarılar</h3>
          <div class="space-y-2">
            <NuxtLink
              v-if="dealers.pendingCount > 0"
              to="/bayiler"
              class="flex items-center gap-3 p-2.5 rounded-md bg-amber-50 hover:bg-amber-100"
            >
              <Icon name="lucide:user-plus" class="w-4 h-4 text-amber-700 shrink-0" />
              <span class="text-sm text-amber-900 flex-1">{{ dealers.pendingCount }} bayi başvurusu</span>
              <Icon name="lucide:chevron-right" class="w-4 h-4 text-amber-700" />
            </NuxtLink>
            <NuxtLink
              v-if="products.outOfStockCount > 0"
              to="/urunler"
              class="flex items-center gap-3 p-2.5 rounded-md bg-red-50 hover:bg-red-100"
            >
              <Icon name="lucide:alert-circle" class="w-4 h-4 text-red-700 shrink-0" />
              <span class="text-sm text-red-900 flex-1">{{ products.outOfStockCount }} ürün stoksuz</span>
              <Icon name="lucide:chevron-right" class="w-4 h-4 text-red-700" />
            </NuxtLink>
            <NuxtLink
              v-if="products.lowStockCount > 0"
              to="/urunler"
              class="flex items-center gap-3 p-2.5 rounded-md bg-amber-50 hover:bg-amber-100"
            >
              <Icon name="lucide:trending-down" class="w-4 h-4 text-amber-700 shrink-0" />
              <span class="text-sm text-amber-900 flex-1">{{ products.lowStockCount }} ürün düşük stok</span>
              <Icon name="lucide:chevron-right" class="w-4 h-4 text-amber-700" />
            </NuxtLink>
            <NuxtLink
              v-if="settings.data.maintenanceMode"
              to="/ayarlar"
              class="flex items-center gap-3 p-2.5 rounded-md bg-orange-50 hover:bg-orange-100"
            >
              <Icon name="lucide:wrench" class="w-4 h-4 text-orange-700 shrink-0" />
              <span class="text-sm text-orange-900 flex-1">Bakım modu aktif</span>
              <Icon name="lucide:chevron-right" class="w-4 h-4 text-orange-700" />
            </NuxtLink>
            <p
              v-if="dealers.pendingCount === 0 && products.outOfStockCount === 0 && products.lowStockCount === 0 && !settings.data.maintenanceMode"
              class="text-sm text-ink-500 text-center py-3"
            >
              Aktif uyarı yok
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent orders -->
    <div class="bg-white rounded-xl border border-ink-200">
      <div class="px-5 py-4 border-b border-ink-200">
        <h3 class="font-semibold text-ink-900 flex items-center gap-2">
          <Icon name="lucide:history" class="w-4 h-4 text-primary-600" />
          Son Siparişler
        </h3>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-ink-50 border-b border-ink-200 text-left">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Sipariş No</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Müşteri</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Tür</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Tutar</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Durum</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Tarih</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr v-for="o in recentOrders" :key="o.id" class="hover:bg-ink-50">
              <td class="px-5 py-3 font-mono text-sm font-medium text-ink-900">{{ o.orderNo }}</td>
              <td class="px-5 py-3 text-sm text-ink-700 truncate max-w-xs">{{ o.customerName }}</td>
              <td class="px-5 py-3">
                <StatusBadge :variant="o.customerType === 'B2C' ? 'info' : 'purple'" :label="o.customerType" />
              </td>
              <td class="px-5 py-3 text-sm font-semibold text-ink-900">{{ formatPrice(o.total) }}</td>
              <td class="px-5 py-3"><StatusBadge v-bind="orderStatusBadge(o.status)" /></td>
              <td class="px-5 py-3 text-xs text-ink-500">{{ formatRelative(o.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="recentOrders.length === 0" icon="lucide:inbox" title="Henüz sipariş yok" />
      </div>

      <div class="px-5 py-3 border-t border-ink-200 text-center">
        <NuxtLink to="/siparisler" class="text-primary-600 hover:text-primary-700 font-medium text-sm">
          Tüm Siparişleri Görüntüle →
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
