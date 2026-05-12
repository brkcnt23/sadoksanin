<script setup lang="ts">
import { formatPrice, formatDate } from '~/utils/storage'
import { applyCurrencyFormatting } from '~/utils/excel-format'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Raporlar | Sadöksan Admin',
})

const orders = useOrdersStore()
const dealers = useDealersStore()
const products = useProductsStore()

onMounted(() => {
  if (!orders.loaded) orders.load()
  if (!dealers.loaded) dealers.load()
  if (!products.loaded) products.load()
})

// Date range
const range = ref<'7d' | '30d' | '90d' | 'all'>('30d')

const filteredOrders = computed(() => {
  if (range.value === 'all') return orders.items
  const days = { '7d': 7, '30d': 30, '90d': 90 }[range.value]
  const cutoff = Date.now() - days * 86_400_000
  return orders.items.filter((o) => new Date(o.createdAt).getTime() >= cutoff)
})

const summary = computed(() => {
  const list = filteredOrders.value.filter((o) => o.status !== 'cancelled' && o.status !== 'rejected')
  const revenue = list.reduce((s, o) => s + o.total, 0)
  const tax = list.reduce((s, o) => s + o.tax, 0)
  const b2c = list.filter((o) => o.customerType === 'B2C')
  const b2b = list.filter((o) => o.customerType === 'B2B')
  return {
    orderCount: list.length,
    revenue,
    tax,
    b2cCount: b2c.length,
    b2bCount: b2b.length,
    b2cRevenue: b2c.reduce((s, o) => s + o.total, 0),
    b2bRevenue: b2b.reduce((s, o) => s + o.total, 0),
    avgOrder: list.length > 0 ? revenue / list.length : 0,
  }
})

const dailySales = computed(() => {
  const map = new Map<string, { date: string; orderCount: number; revenue: number }>()
  filteredOrders.value
    .filter((o) => o.status !== 'cancelled' && o.status !== 'rejected')
    .forEach((o) => {
      const day = o.createdAt.slice(0, 10)
      const cur = map.get(day) ?? { date: day, orderCount: 0, revenue: 0 }
      cur.orderCount += 1
      cur.revenue += o.total
      map.set(day, cur)
    })
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date))
})

const dealerPerformance = computed(() => {
  return dealers.items
    .filter((d) => d.totalOrders > 0)
    .map((d) => ({
      ...d,
      avgOrderValue: d.totalOrders > 0 ? d.totalRevenue / d.totalOrders : 0,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
})

const exportSales = async () => {
  const XLSX = await import('xlsx')
  const wb = XLSX.utils.book_new()

  // Summary
  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Sadöksan Satış Raporu'],
    ['Tarih Aralığı', range.value],
    ['Oluşturuldu', new Date().toLocaleString('tr-TR')],
    [],
    ['Sipariş Sayısı', summary.value.orderCount],
    ['Toplam Ciro', summary.value.revenue],
    ['KDV', summary.value.tax],
    ['Ortalama Sipariş', summary.value.avgOrder],
    [],
    ['B2C Sipariş', summary.value.b2cCount],
    ['B2C Ciro', summary.value.b2cRevenue],
    ['B2B Sipariş', summary.value.b2bCount],
    ['B2B Ciro', summary.value.b2bRevenue],
  ])
  XLSX.utils.book_append_sheet(wb, summarySheet, 'Özet')

  // Daily
  const dailyData = dailySales.value.map((d) => ({ Tarih: d.date, 'Sipariş Sayısı': d.orderCount, Ciro: d.revenue }))
  const dailySheet = XLSX.utils.json_to_sheet(dailyData)
  applyCurrencyFormatting(dailySheet, Object.keys(dailyData[0] || {}))
  XLSX.utils.book_append_sheet(wb, dailySheet, 'Günlük')

  // Orders
  const ordersData = filteredOrders.value.map((o) => ({
    'Sipariş No': o.orderNo,
    Tarih: o.createdAt,
    Müşteri: o.customerName,
    Tür: o.customerType,
    Cari: o.dealerCariNo ?? '',
    Şehir: o.shippingCity,
    'Kalem': o.lines.length,
    'Ara Toplam': o.subtotal,
    KDV: o.tax,
    Lojistik: o.logisticsSurcharge,
    Toplam: o.total,
    Durum: o.status,
    'E-Fatura No': o.eInvoiceNo ?? '',
  }))
  const ordersSheet = XLSX.utils.json_to_sheet(ordersData)
  applyCurrencyFormatting(ordersSheet, Object.keys(ordersData[0] || {}))
  XLSX.utils.book_append_sheet(wb, ordersSheet, 'Siparişler')

  XLSX.writeFile(wb, `sadoksan-satis-raporu-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const exportDealerPerf = async () => {
  const XLSX = await import('xlsx')
  const rows = dealerPerformance.value.map((d) => ({
    Bayi: d.name,
    Cari: d.cariNo,
    Şehir: d.city,
    Bölge: d.region,
    'Sipariş Sayısı': d.totalOrders,
    'Toplam Ciro': d.totalRevenue,
    'Ortalama Sipariş': d.avgOrderValue,
    Bakiye: d.cariBalance,
    'Kredi Limiti': d.creditLimit,
    Durum: d.status,
    'Son Sipariş': d.lastOrderAt ?? '',
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  applyCurrencyFormatting(ws, Object.keys(rows[0] || {}))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Bayi Performansı')
  XLSX.writeFile(wb, `sadoksan-bayi-performans-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const exportStockSnapshot = async () => {
  const XLSX = await import('xlsx')
  const rows = products.items.map((p) => ({
    SKU: p.sku,
    'Netsis Kodu': p.netsisCode,
    'Ürün Adı': p.name,
    Marka: p.brand,
    Kategori: p.category,
    'Birim Fiyat': p.basePrice,
    KDV: p.taxRate,
    'Netsis Stok': p.netsisStock,
    'Rezerve': p.reservedStock,
    'Görünür Stok': p.displayStock,
    Birim: p.unit,
    Görünür: p.visible,
    Satılabilir: p.purchasable,
    'Sync Durumu': p.syncStatus,
    'Son Sync': p.lastNetsisSync,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  applyCurrencyFormatting(ws, Object.keys(rows[0] || {}))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Stok Snapshot')
  XLSX.writeFile(wb, `sadoksan-stok-${new Date().toISOString().slice(0, 10)}.xlsx`)
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="Raporlar"
      description="Satış, bayi performansı, stok snapshot raporları — Excel export destekli."
    >
      <template #actions>
        <select
          v-model="range"
          class="px-3 py-2 border border-slate-300 rounded-md text-sm bg-white"
        >
          <option value="7d">Son 7 Gün</option>
          <option value="30d">Son 30 Gün</option>
          <option value="90d">Son 90 Gün</option>
          <option value="all">Tüm Zamanlar</option>
        </select>
      </template>
    </PageHeader>

    <!-- Summary -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard label="Sipariş Sayısı" :value="summary.orderCount" icon="lucide:package" color="blue" />
      <StatCard label="Toplam Ciro" :value="formatPrice(summary.revenue)" icon="lucide:trending-up" color="green" />
      <StatCard label="KDV" :value="formatPrice(summary.tax)" icon="lucide:receipt" color="purple" />
      <StatCard
        label="Ortalama Sipariş"
        :value="formatPrice(summary.avgOrder)"
        icon="lucide:bar-chart-3"
        color="amber"
      />
    </div>

    <!-- Reports grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <button
        @click="exportSales"
        class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm hover:border-blue-300 transition text-left group"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="p-2.5 rounded-lg bg-blue-50 group-hover:bg-blue-100">
            <Icon name="lucide:trending-up" class="w-5 h-5 text-blue-600" />
          </div>
          <Icon name="lucide:download" class="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
        </div>
        <h3 class="font-semibold text-slate-900">Satış Raporu</h3>
        <p class="text-sm text-slate-500 mt-1">
          Tarih aralığında satışlar, günlük döküm, tüm sipariş detayları.
        </p>
      </button>

      <button
        @click="exportDealerPerf"
        class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm hover:border-blue-300 transition text-left group"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="p-2.5 rounded-lg bg-violet-50 group-hover:bg-violet-100">
            <Icon name="lucide:users" class="w-5 h-5 text-violet-600" />
          </div>
          <Icon name="lucide:download" class="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
        </div>
        <h3 class="font-semibold text-slate-900">Bayi Performansı</h3>
        <p class="text-sm text-slate-500 mt-1">
          Bayi bazında ciro, sipariş sayısı, ortalama sepet, cari durum.
        </p>
      </button>

      <button
        @click="exportStockSnapshot"
        class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm hover:border-blue-300 transition text-left group"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="p-2.5 rounded-lg bg-emerald-50 group-hover:bg-emerald-100">
            <Icon name="lucide:warehouse" class="w-5 h-5 text-emerald-600" />
          </div>
          <Icon name="lucide:download" class="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
        </div>
        <h3 class="font-semibold text-slate-900">Stok / Fiyat Snapshot</h3>
        <p class="text-sm text-slate-500 mt-1">
          Tüm ürünlerin anlık stok ve fiyat bilgisi (bayi paylaşımına uygun).
        </p>
      </button>
    </div>

    <!-- Daily sales -->
    <div class="bg-white rounded-xl border border-slate-200">
      <div class="px-5 py-4 border-b border-slate-200">
        <h3 class="font-semibold text-slate-900">Günlük Satışlar</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200 text-left">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase">Tarih</th>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase text-right">Sipariş</th>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase text-right">Ciro</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="d in dailySales" :key="d.date" class="hover:bg-slate-50">
              <td class="px-5 py-2.5 text-sm text-slate-700">{{ formatDate(d.date, { hour: undefined, minute: undefined }) }}</td>
              <td class="px-5 py-2.5 text-sm font-medium text-slate-900 text-right">{{ d.orderCount }}</td>
              <td class="px-5 py-2.5 text-sm font-semibold text-slate-900 text-right">{{ formatPrice(d.revenue) }}</td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="dailySales.length === 0" icon="lucide:bar-chart-3" title="Bu aralıkta veri yok" />
      </div>
    </div>

    <!-- Dealer performance -->
    <div class="bg-white rounded-xl border border-slate-200">
      <div class="px-5 py-4 border-b border-slate-200">
        <h3 class="font-semibold text-slate-900">Bayi Performansı</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200 text-left">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase">Bayi</th>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase text-right">Sipariş</th>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase text-right">Ciro</th>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase text-right">Ort. Sepet</th>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase text-right">Bakiye</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="d in dealerPerformance" :key="d.id" class="hover:bg-slate-50">
              <td class="px-5 py-2.5">
                <p class="text-sm font-medium text-slate-900">{{ d.name }}</p>
                <p class="text-xs text-slate-500">{{ d.city }}</p>
              </td>
              <td class="px-5 py-2.5 text-sm text-slate-900 text-right">{{ d.totalOrders }}</td>
              <td class="px-5 py-2.5 text-sm font-semibold text-slate-900 text-right">{{ formatPrice(d.totalRevenue) }}</td>
              <td class="px-5 py-2.5 text-sm text-slate-700 text-right">{{ formatPrice(d.avgOrderValue) }}</td>
              <td class="px-5 py-2.5 text-sm text-right" :class="d.cariBalance < 0 ? 'text-red-600' : 'text-emerald-600'">
                {{ formatPrice(d.cariBalance) }}
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="dealerPerformance.length === 0" icon="lucide:users" title="Bayi sipariş verisi yok" />
      </div>
    </div>
  </div>
</template>
