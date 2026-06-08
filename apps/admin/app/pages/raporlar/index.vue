<template>
  <div class="min-h-screen bg-ink-50 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-ink-900 mb-2">Raporlar</h1>
      <p class="text-ink-600 mb-8">Satış, stok, bayi ve plasiyer raporları</p>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div v-for="card in kpiCards" :key="card.label" class="bg-white rounded-xl border border-ink-200 p-5">
          <p class="text-ink-500 text-sm">{{ card.label }}</p>
          <p class="text-2xl font-bold mt-1" :class="card.color">{{ card.value }}</p>
        </div>
      </div>

      <!-- Report Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div v-for="report in reports" :key="report.id"
          @click="activeReport = report.id"
          :class="['bg-white rounded-xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg',
            activeReport === report.id ? 'border-primary-500 shadow-md' : 'border-ink-200']">
          <div class="flex items-center gap-3 mb-3">
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center', report.bgColor]">
              <Icon :name="report.icon" class="w-5 h-5" :class="report.iconColor" />
            </div>
            <h3 class="font-semibold text-ink-900">{{ report.title }}</h3>
          </div>
          <p class="text-sm text-ink-500 mb-4">{{ report.desc }}</p>
          <span :class="['px-2 py-1 rounded text-xs font-medium', report.badgeColor]">{{ report.badge }}</span>
        </div>
      </div>

      <!-- Active Report Detail -->
      <div v-if="activeReport" class="bg-white rounded-xl border border-ink-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-bold text-ink-900">{{ activeReportTitle }}</h2>
          <div class="flex gap-3">
            <input v-model="dateFrom" type="date" class="px-3 py-2 border border-ink-300 rounded-lg text-sm" />
            <input v-model="dateTo" type="date" class="px-3 py-2 border border-ink-300 rounded-lg text-sm" />
            <button @click="loadReport" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Getir</button>
            <button @click="exportCSV" class="border border-ink-300 text-ink-700 px-4 py-2 rounded-lg text-sm hover:bg-ink-50">CSV</button>
          </div>
        </div>

        <LoadingState v-if="reportLoading" type="table" />
        <div v-else-if="reportData.length === 0" class="text-center py-12 text-ink-500">Veri bulunamadı</div>
        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-ink-100 border-b border-ink-200">
              <tr>
                <th v-for="col in activeColumns" :key="col" class="px-4 py-3 text-left font-medium text-ink-700">{{ col }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, i) in reportData" :key="i" class="border-b border-ink-100 hover:bg-ink-50">
                <td v-for="col in activeColumns" :key="col" class="px-4 py-3 text-ink-600">
                  <span v-if="col === 'Seviye' || col === 'Risk'">
                    <span :class="levelBadgeClass(row[col])" class="px-2 py-1 rounded text-xs font-medium">{{ row[col] }}</span>
                  </span>
                  <span v-else-if="col.includes('Tutar') || col.includes('TL') || col.includes('Limit') || col.includes('Bakiye')">
                    {{ formatTL(row[col]) }}
                  </span>
                  <span v-else>{{ row[col] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ layout: 'default', middleware: 'auth' })

const toast = useToast()
const activeReport = ref<string | null>(null)
const reportLoading = ref(false)
const reportData = ref<any[]>([])
const dateFrom = ref('')
const dateTo = ref('')

const kpiCards = ref([
  { label: 'Toplam Sipariş', value: '...', color: 'text-primary-600' },
  { label: 'Kritik Stok', value: '...', color: 'text-red-600' },
  { label: 'Aktif Bayi', value: '...', color: 'text-green-600' },
  { label: 'Plasiyer', value: '...', color: 'text-amber-600' },
])

const reports = [
  { id: 'plasiyer-sales', title: 'Plasiyer Satış', desc: 'Plasiyer bazlı ciro ve proforma istatistikleri', icon: 'lucide:user-check', bgColor: 'bg-amber-100', iconColor: 'text-amber-600', badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700' },
  { id: 'order-pipeline', title: 'Sipariş Pipeline', desc: 'Siparişlerin durum dağılımı ve tutarları', icon: 'lucide:bar-chart-3', bgColor: 'bg-blue-100', iconColor: 'text-blue-600', badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700' },
  { id: 'dealer-risk', title: 'Bayi Risk Skoru', desc: 'Kredi kullanımı, iptal oranı, aktivite', icon: 'lucide:shield-alert', bgColor: 'bg-red-100', iconColor: 'text-red-600', badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700' },
  { id: 'critical-stock', title: 'Kritik Stok', desc: 'Minimum seviyenin altındaki ürünler', icon: 'lucide:package-warning', bgColor: 'bg-orange-100', iconColor: 'text-orange-600', badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700' },
  { id: 'slow-moving', title: 'Hareketsiz Stok', desc: 'Uzun süredir satılmayan ürünler', icon: 'lucide:package-x', bgColor: 'bg-purple-100', iconColor: 'text-purple-600', badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700' },
  { id: 'credit-usage', title: 'Kredi Limiti', desc: 'Bayi kredi limiti kullanım yüzdeleri', icon: 'lucide:credit-card', bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600', badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700' },
  { id: 'plasiyer-dashboard', title: 'Plasiyer Dashboard', desc: 'Plasiyer performans KPIları', icon: 'lucide:layout-dashboard', bgColor: 'bg-green-100', iconColor: 'text-green-600', badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700' },
  { id: 'plasiyers', title: 'Plasiyer Listesi', desc: 'Tüm plasiyerler ve istatistikleri', icon: 'lucide:users', bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600', badge: 'Yönetim', badgeColor: 'bg-blue-100 text-blue-700' },
]

const reportMeta: Record<string, any> = {
  'plasiyer-sales': { endpoint: '/reports/plasiyer-sales', cols: ['Plasiyer', 'Email', 'Proforma', 'Toplam Tutar (TL)', 'Ortalama Tutar (TL)'], fields: ['plasiyerName', 'plasiyerEmail', 'proformaCount', 'totalAmount', 'averageAmount'] },
  'order-pipeline': { endpoint: '/reports/order-pipeline', cols: ['Durum', 'Sipariş Sayısı', 'Toplam Tutar (TL)'], fields: ['status', 'count', 'totalAmount'] },
  'dealer-risk': { endpoint: '/reports/dealer-risk', cols: ['Bayi', 'Cari No', 'Şehir', 'Kredi Kullanım %', 'İptal %', 'Risk Skor', 'Risk'], fields: ['dealerName', 'cariNo', 'city', 'creditUsagePct', 'cancelRate', 'riskScore', 'riskLevel'] },
  'critical-stock': { endpoint: '/reports/critical-stock', cols: ['SKU', 'Ürün', 'Stok', 'Minimum', 'Açık', 'Seviye'], fields: ['sku', 'name', 'currentStock', 'minimumStock', 'deficit', 'level'] },
  'slow-moving': { endpoint: '/reports/slow-moving-stock', cols: ['SKU', 'Ürün', 'Marka', 'Stok', 'Stok Değeri (TL)', 'Son Satış (Gün)', 'Seviye'], fields: ['sku', 'name', 'brand', 'currentStock', 'stockValue', 'daysSinceLastSale', 'level'] },
  'credit-usage': { endpoint: '/reports/credit-usage', cols: ['Bayi', 'Cari No', 'Limit (TL)', 'Bakiye (TL)', 'Kullanım %', 'Seviye'], fields: ['company', 'cariNo', 'creditLimit', 'currentBalance', 'usagePct', 'level'] },
  'plasiyer-dashboard': { endpoint: '/reports/plasiyer-dashboard', cols: ['Plasiyer', 'Proforma', 'Onaylı', 'Bekleyen', 'Red', 'Ciro (TL)', 'Dönüşüm %'], fields: ['plasiyerName', 'totalProformas', 'approvedCount', 'pendingCount', 'rejectedCount', 'totalAmount', 'conversionRate'] },
  'plasiyers': { endpoint: '/reports/plasiyers', cols: ['Ad', 'Email', 'Telefon', 'Proforma', 'Onaylı', 'Bekleyen'], fields: ['name', 'email', 'phone', 'totalProformas', 'approvedProformas', 'pendingProformas'] },
}

const activeReportTitle = computed(() => reports.find(r => r.id === activeReport.value)?.title || '')
const activeColumns = computed(() => reportMeta[activeReport.value || '']?.cols || [])

const levelBadgeClass = (val: string) => {
  if (!val) return ''
  const v = String(val).toLowerCase()
  if (v === 'critical' || v === 'high' || v === 'dead' || v === 'blocked') return 'bg-red-100 text-red-700'
  if (v === 'warning' || v === 'medium' || v === 'slow' || v === 'watch') return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

const formatTL = (val: number) => {
  if (!val && val !== 0) return '-'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(val)
}

const apiFetch = async (path: string) => {
  const token = localStorage.getItem('admin-token')
  const base = useRuntimeConfig().public.apiBase.replace(/\/+$/, '')
  const res = await fetch(`${base}/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const loadReport = async () => {
  if (!activeReport.value) return
  reportLoading.value = true
  try {
    const meta = reportMeta[activeReport.value]
    let path = meta.endpoint
    if (dateFrom.value) path += `?from=${dateFrom.value}`
    if (dateTo.value) path += `${dateFrom.value ? '&' : '?'}to=${dateTo.value}`

    let data = await apiFetch(path)

    // Handle nested responses
    if (activeReport.value === 'critical-stock') {
      data = [...(data.critical || []).map((d: any) => ({ ...d, level: 'CRITICAL' })), ...(data.warning || []).map((d: any) => ({ ...d, level: 'WARNING' }))]
    }

    reportData.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    toast.push(`Hata: ${e.message}`, 'error')
  }
  reportLoading.value = false
}

const exportCSV = () => {
  if (!reportData.value.length) return
  const meta = reportMeta[activeReport.value || '']
  const cols = meta?.cols || []
  const fields = meta?.fields || []
  let csv = cols.join(',') + '\n'
  for (const row of reportData.value) {
    csv += fields.map((f: string) => `"${String(row[f] ?? '').replace(/"/g, '""')}"`).join(',') + '\n'
  }
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `${activeReport.value}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click(); URL.revokeObjectURL(url)
}

// Load KPIs on mount
onMounted(async () => {
  try {
    const [pipeline, stock, risk, plasiyers] = await Promise.all([
      apiFetch('/reports/order-pipeline'),
      apiFetch('/reports/critical-stock'),
      apiFetch('/reports/dealer-risk'),
      apiFetch('/reports/plasiyers'),
    ])
    const totalOrders = (pipeline || []).reduce((s: number, x: any) => s + x.count, 0)
    kpiCards.value[0].value = String(totalOrders)
    kpiCards.value[1].value = String(stock?.summary?.criticalCount || 0)
    kpiCards.value[2].value = String((risk || []).length)
    kpiCards.value[3].value = String((plasiyers || []).length)
  } catch {}
})
</script>
