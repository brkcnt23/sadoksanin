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
const api = useApi()

onMounted(() => {
  if (!orders.loaded) orders.load()
  if (!dealers.loaded) dealers.load()
  if (!products.loaded) products.load()
  if (!stock.loaded) stock.load()
  if (!settings.loaded) settings.load()
  loadAuditFeed()
  loadFreshness()
})

const pendingOrders = computed(() =>
  orders.items
    .filter((o) => o.status === 'PENDING_APPROVAL')
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

// ── Pending order aging ──
const pendingByAge = computed(() => {
  const now = Date.now()
  const groups = { '24s': 0, '48s': 0, '72s': 0, '72s+': 0 }
  orders.items
    .filter((o) => o.status === 'PENDING_APPROVAL')
    .forEach((o) => {
      const age = now - new Date(o.createdAt).getTime()
      const hours = age / 3600000
      if (hours < 24) groups['24s']++
      else if (hours < 48) groups['48s']++
      else if (hours < 72) groups['72s']++
      else groups['72s+']++
    })
  return groups
})

// ── Revenue chart (last 7 days, CSS bars) ──
const revenueChart = computed(() => {
  const days: { label: string; revenue: number }[] = []
  const now = new Date()
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const end = new Date(d)
    end.setHours(23, 59, 59, 999)
    const rev = orders.items
      .filter((o) => {
        const t = new Date(o.createdAt).getTime()
        return t >= d.getTime() && t <= end.getTime() && o.status !== 'cancelled' && o.status !== 'rejected'
      })
      .reduce((s, o) => s + o.total, 0)
    days.push({
      label: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
      revenue: rev,
    })
  }
  const maxRev = Math.max(...days.map((d) => d.revenue), 1)
  return days.map((d) => ({ ...d, pct: (d.revenue / maxRev) * 100 }))
})

const criticalStock = computed(() => products.items.filter((p) => p.displayStock <= (p.minimumStock || 5)).length)
const lowStock = computed(() => products.items.filter((p) => (p as any).middleStock && p.displayStock > (p.minimumStock || 0) && p.displayStock <= (p as any).middleStock).length)
const pendingDealers = computed(() => dealers.items.filter((d) => (d as any).status === 'PENDING' || (d as any).status === 'pending').length)

// ── Recent audit feed ──
const auditFeed = ref<any[]>([])
async function loadAuditFeed() {
  try {
    const result = await api.get<{ items: any[] }>('/admin/audit', { limit: 8 })
    auditFeed.value = result.items ?? []
  } catch { /* silent */ }
}

// ── Netsis veri tazeliği ──
// Netsis bağlantısı koptuğunda site çalışmaya devam eder ama stok/fiyat
// donar; Netsis'te biten mal sitede "var" görünür. Bu bant o durumu
// panelden görünür kılar.
interface DataFreshness {
  status: 'fresh' | 'warning' | 'stale' | 'never'
  daysStale: number | null
  message: string
  lastSync: string | null
}
const freshness = ref<DataFreshness | null>(null)
async function loadFreshness() {
  try {
    freshness.value = await api.get<DataFreshness>('/netsis/data-freshness')
  } catch { /* silent — uyarı bandı yoksa panel yine çalışsın */ }
}
const showFreshnessAlert = computed(
  () => freshness.value && freshness.value.status !== 'fresh',
)
const freshnessStyle = computed(() => {
  const s = freshness.value?.status
  if (s === 'stale' || s === 'never') {
    return { box: 'bg-red-50 border-red-300 text-red-800', icon: 'lucide:alert-triangle' }
  }
  return { box: 'bg-amber-50 border-amber-300 text-amber-800', icon: 'lucide:clock-alert' }
})

const approve = (id: string) => {
  const u = auth.getUser()
  if (!u) return
  orders.approve(id, u.id)
}

const orderStatusBadge = (s: string) => {
  const m: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'; label: string }> = {
    'PENDING_APPROVAL': { variant: 'warning', label: 'Onay Bekliyor' },
    approved: { variant: 'info', label: 'Onaylandı' },
    preparing: { variant: 'info', label: 'Hazırlanıyor' },
    shipped: { variant: 'purple', label: 'Sevk Edildi' },
    completed: { variant: 'success', label: 'Tamamlandı' },
    cancelled: { variant: 'neutral', label: 'İptal' },
    rejected: { variant: 'danger', label: 'Reddedildi' },
  }
  return m[s] ?? { variant: 'neutral', label: s }
}

const auditActionLabel = (a: string) => {
  const labels: Record<string, string> = {
    'order.approve': 'Sipariş onayladı',
    'order.reject': 'Sipariş reddetti',
    'order.cancel': 'Sipariş iptal etti',
    'order.ship': 'Sevkiyat yapıldı',
    'dealer.approve': 'Bayi onayladı',
    'dealer.reject': 'Bayi reddetti',
    'product.update': 'Ürün güncelledi',
    'stock.sync': 'Stok senkronize etti',
    'notify.send': 'Bildirim gönderdi',
  }
  return labels[a] ?? a
}

const formatTimeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Az önce'
  if (mins < 60) return `${mins}dk önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}s önce`
  return `${Math.floor(hours / 24)}g önce`
}

// ── Quick Test Order ──
const quickTestRunning = ref(false)

async function quickTestOrder() {
  if (quickTestRunning.value) return
  quickTestRunning.value = true

  try {
    if (!products.loaded) await products.load()

    const product = products.items.find((p) => p.displayStock > 0 && p.purchasable)
    if (!product) {
      useToast().push('Stokta satın alınabilir ürün bulunamadı', 'error')
      return
    }

    const order = await api.post<any>('/orders', {
      items: [{ productId: product.id, quantity: 1, unitPrice: product.basePrice, taxRate: product.taxRate ?? 0.2 }],
      customerType: 'B2C',
      shippingCity: 'İstanbul',
      shippingAddress: 'Test Adres, No: 1, İstanbul',
      paymentMethod: 'CREDIT_CARD',
    })

    await api.post(`/orders/${order.id}/pay`, {
      cardNumber: '4111111111111111',
      expiry: '12/28',
      cvv: '123',
      cardHolder: 'Test Kart',
    })

    await orders.load()
    await stock.load()
    useToast().push(`✅ Hızlı test siparişi oluşturuldu: ${order.orderNo || order.id}`, 'success')
  } catch (err: any) {
    useToast().push(err?.message || 'Test siparişi başarısız', 'error')
  } finally {
    quickTestRunning.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Netsis veri tazeliği uyarısı — stok/fiyat donmuşsa görünür -->
    <div
      v-if="showFreshnessAlert"
      class="border rounded-lg px-4 py-3 flex items-start gap-3"
      :class="freshnessStyle.box"
    >
      <Icon :name="freshnessStyle.icon" class="w-5 h-5 shrink-0 mt-0.5" />
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm">Netsis stok verisi güncel değil</p>
        <p class="text-sm mt-0.5">{{ freshness?.message }}</p>
        <p v-if="freshness?.status === 'stale' || freshness?.status === 'never'" class="text-xs mt-1.5 opacity-90">
          Fabrika bağlantısı kopuk olabilir. Bu süre boyunca stoğu tükenen ürünler
          sitede "stokta var" görünmeye devam eder.
        </p>
      </div>
    </div>

    <!-- Intro Banner (toggleable from settings) -->
    <IntroBanner v-if="settings.data.introEnabled" />

    <!-- Hero Section -->
    <DashboardHero
      :stats="[
        { label: 'Toplam Sipariş', value: orders.items.length, icon: 'lucide:package' },
        { label: 'Onay Bekleyen', value: orders.pendingCount, icon: 'lucide:clock' },
        { label: 'Bugünkü Ciro', value: formatPrice(todayRevenue), icon: 'lucide:trending-up' },
      ]"
    />

    <!-- Quick Actions -->
    <QuickActionCards />

    <!-- Quick Test Order Card -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 -mt-2">
      <button
        @click="quickTestOrder"
        :disabled="quickTestRunning"
        class="w-full bg-white rounded-2xl border border-purple-200/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Icon
              :name="quickTestRunning ? 'lucide:loader-2' : 'lucide:flask-conical'"
              :class="['w-5 h-5 text-white', quickTestRunning && 'animate-spin']"
            />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-semibold text-ink-900 group-hover:text-purple-900 transition-colors">Hızlı Test Siparişi</h3>
            <p class="text-sm text-ink-500 mt-0.5">Tek tıkla B2C test siparişi oluştur</p>
          </div>
        </div>
      </button>
    </div>

    <!-- Stats Grid -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <div class="bg-white rounded-xl border border-ink-200 p-4 text-center hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group">
        <div class="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2 group-hover:bg-blue-200 transition-colors">
          <Icon name="lucide:package" class="w-5 h-5 text-blue-600" />
        </div>
        <p class="text-2xl font-bold text-ink-900">{{ orders.items.length }}</p>
        <p class="text-xs text-ink-500">Toplam Sipariş</p>
      </div>
      <div class="bg-white rounded-xl border border-ink-200 p-4 text-center hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group">
        <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-2 group-hover:bg-amber-200 transition-colors">
          <Icon name="lucide:clock" class="w-5 h-5 text-amber-600" />
        </div>
        <p class="text-2xl font-bold text-ink-900">{{ orders.pendingCount }}</p>
        <p class="text-xs text-ink-500">Onay Bekleyen</p>
      </div>
      <div class="bg-white rounded-xl border border-ink-200 p-4 text-center hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group">
        <div class="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2 group-hover:bg-emerald-200 transition-colors">
          <Icon name="lucide:trending-up" class="w-5 h-5 text-emerald-600" />
        </div>
        <p class="text-2xl font-bold text-ink-900">{{ formatPrice(todayRevenue) }}</p>
        <p class="text-xs text-ink-500">Bugünkü Ciro</p>
      </div>
      <div class="bg-white rounded-xl border border-ink-200 p-4 text-center hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group">
        <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center mx-auto mb-2 group-hover:bg-purple-200 transition-colors">
          <Icon name="lucide:users" class="w-5 h-5 text-purple-600" />
        </div>
        <p class="text-2xl font-bold text-ink-900">{{ dealers.activeCount }}</p>
        <p class="text-xs text-ink-500">Aktif Bayi</p>
      </div>
      <div class="bg-white rounded-xl border border-ink-200 p-4 text-center hover:shadow-md hover:border-red-200 transition-all cursor-pointer group">
        <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center mx-auto mb-2 group-hover:bg-red-200 transition-colors">
          <Icon name="lucide:alert-circle" class="w-5 h-5 text-red-600" />
        </div>
        <p class="text-2xl font-bold text-ink-900">{{ products.lowStockCount + products.outOfStockCount }}</p>
        <p class="text-xs text-ink-500">Stok Uyarısı</p>
      </div>
      <div class="bg-white rounded-xl border border-ink-200 p-4 text-center hover:shadow-md hover:border-amber-200 transition-all cursor-pointer group">
        <div class="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-2 group-hover:bg-amber-200 transition-colors">
          <Icon name="lucide:user-plus" class="w-5 h-5 text-amber-600" />
        </div>
        <p class="text-2xl font-bold text-ink-900">{{ pendingDealers }}</p>
        <p class="text-xs text-ink-500">Bayi Başvurusu</p>
      </div>
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
        <!-- Pending Order Aging -->
        <div class="bg-white rounded-xl border border-ink-200 p-5">
          <h3 class="font-semibold text-ink-900 mb-4 text-sm">Bekleyen Sipariş Yaşlanma</h3>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-ink-600">Son 24 saat</span>
              <span class="font-semibold" :class="pendingByAge['24s'] > 0 ? 'text-emerald-600' : 'text-ink-400'">{{ pendingByAge['24s'] }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-ink-600">24-48 saat</span>
              <span class="font-semibold" :class="pendingByAge['48s'] > 0 ? 'text-amber-600' : 'text-ink-400'">{{ pendingByAge['48s'] }}</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-ink-600">48-72 saat</span>
              <span class="font-semibold" :class="pendingByAge['72s'] > 0 ? 'text-orange-600' : 'text-ink-400'">{{ pendingByAge['72s'] }}</span>
            </div>
            <div class="flex items-center justify-between text-sm pt-2 border-t border-ink-100">
              <span class="text-ink-600 font-medium">72 saat +</span>
              <span class="font-bold" :class="pendingByAge['72s+'] > 0 ? 'text-red-600' : 'text-ink-400'">{{ pendingByAge['72s+'] }}</span>
            </div>
          </div>
        </div>

        <!-- Critical Alerts -->
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

    <!-- Revenue Chart + Activity Feed -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Revenue Chart (CSS-only bar chart) -->
      <div class="bg-white rounded-xl border border-ink-200 p-5">
        <h3 class="font-semibold text-ink-900 mb-4 text-sm flex items-center gap-2">
          <Icon name="lucide:bar-chart-3" class="w-4 h-4 text-primary-600" />
          7 Günlük Ciro
        </h3>
        <div class="flex items-end justify-between gap-2 h-40 px-2">
          <div
            v-for="(day, i) in revenueChart"
            :key="i"
            class="flex-1 flex flex-col items-center gap-1 h-full justify-end"
          >
            <span class="text-[10px] font-semibold text-ink-700">{{ formatPrice(day.revenue) }}</span>
            <div
              class="w-full rounded-t-md bg-gradient-to-t from-primary-600 to-primary-400 transition-all duration-500 min-h-[4px]"
              :style="{ height: Math.max(day.pct, 4) + '%' }"
            />
            <span class="text-[10px] text-ink-500 mt-1">{{ day.label }}</span>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-500">
          <span>Toplam: <strong class="text-ink-900">{{ formatPrice(revenueChart.reduce((s, d) => s + d.revenue, 0)) }}</strong></span>
          <span>Ort: <strong class="text-ink-900">{{ formatPrice(Math.round(revenueChart.reduce((s, d) => s + d.revenue, 0) / 7)) }}</strong></span>
        </div>
      </div>

      <!-- Activity Feed -->
      <div class="bg-white rounded-xl border border-ink-200 p-5">
        <h3 class="font-semibold text-ink-900 mb-4 text-sm flex items-center gap-2">
          <Icon name="lucide:activity" class="w-4 h-4 text-primary-600" />
          Son İşlemler
        </h3>
        <div v-if="auditFeed.length > 0" class="space-y-3 max-h-[220px] overflow-y-auto">
          <div
            v-for="entry in auditFeed"
            :key="entry.id"
            class="flex items-start gap-3 text-sm"
          >
            <div class="w-2 h-2 rounded-full mt-1.5 shrink-0"
              :class="{
                'bg-emerald-500': entry.action?.includes('approve') || entry.action?.includes('ship'),
                'bg-red-500': entry.action?.includes('reject') || entry.action?.includes('cancel'),
                'bg-blue-500': entry.action?.includes('update') || entry.action?.includes('create'),
                'bg-amber-500': entry.action?.includes('sync') || entry.action?.includes('send'),
                'bg-ink-400': true,
              }"
            />
            <div class="flex-1 min-w-0">
              <p class="text-ink-700">
                <span class="font-medium text-ink-900">{{ entry.email ?? 'Sistem' }}</span>
                <span class="text-ink-500"> — {{ auditActionLabel(entry.action) }}</span>
              </p>
              <p class="text-xs text-ink-400">{{ entry.entity }}{{ entry.entityId ? ' #' + entry.entityId.slice(-6) : '' }}</p>
            </div>
            <span class="text-xs text-ink-400 shrink-0">{{ formatTimeAgo(entry.createdAt) }}</span>
          </div>
        </div>
        <p v-else class="text-sm text-ink-400 text-center py-8">Henüz işlem kaydı yok</p>
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
