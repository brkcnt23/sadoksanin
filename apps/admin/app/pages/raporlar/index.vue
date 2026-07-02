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
          :class="['bg-white rounded-xl border-2 p-6 transition-all hover:shadow-lg flex flex-col',
            activeReport === report.id ? 'border-primary-500 shadow-md' : 'border-ink-200']">
          <!-- Header -->
          <div class="flex items-center gap-3 mb-3">
            <div :class="['w-10 h-10 rounded-lg flex items-center justify-center shrink-0', report.bgColor]">
              <Icon :name="report.icon" class="w-5 h-5" :class="report.iconColor" />
            </div>
            <div>
              <h3 class="font-semibold text-ink-900">{{ report.title }}</h3>
              <span :class="['px-2 py-0.5 rounded text-xs font-medium', report.badgeColor]">{{ report.badge }}</span>
            </div>
          </div>

          <!-- Description -->
          <p class="text-sm text-ink-500 mb-3">{{ report.desc }}</p>

          <!-- Formula / Calculation Method -->
          <div class="bg-ink-50 rounded-lg p-3 mb-4 text-xs text-ink-600 flex-1">
            <p class="font-semibold text-ink-700 mb-1">📐 Nasıl Hesaplanır?</p>
            <p class="leading-relaxed">{{ report.formula }}</p>
          </div>

          <!-- Buttons -->
          <div class="flex gap-2 mt-auto">
            <button @click="activeReport = report.id; loadReport()"
              class="flex-1 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors">
              Detaylı Rapor
            </button>
            <button @click="previewReport(report.id)"
              class="px-3 py-2 border border-ink-300 text-ink-700 text-sm font-medium rounded-lg hover:bg-ink-50 transition-colors flex items-center gap-1.5">
              <Icon name="lucide:eye" class="w-3.5 h-3.5" />
              Önizle
            </button>
          </div>
        </div>
      </div>

      <!-- Active Report Detail -->
      <div v-if="activeReport" class="bg-white rounded-xl border border-ink-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-ink-900">{{ activeReportTitle }}</h2>
            <p class="text-sm text-ink-500 mt-1">{{ activeReportFormula }}</p>
          </div>
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
                  <span v-else-if="col.includes('Tutar') || col.includes('TL') || col.includes('Limit') || col.includes('Bakiye') || col.includes('Değer') || col.includes('Ciro')">
                    {{ formatTL(row[col]) }}
                  </span>
                  <span v-else-if="col.includes('%') || col.includes('Dönüşüm')">
                    {{ typeof row[col] === 'number' ? '%' + row[col].toFixed(1) : row[col] }}
                  </span>
                  <span v-else>{{ row[col] }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Preview Modal -->
      <Modal :open="previewOpen" :title="`Önizleme — ${previewTitle}`" size="xl" @close="previewOpen = false">
        <div v-if="previewData.length > 0" class="p-6">
          <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-800">
            <p class="font-semibold mb-1">📐 Hesaplama Yöntemi</p>
            <p>{{ previewFormula }}</p>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-ink-100 border-b border-ink-200">
                <tr>
                  <th v-for="col in previewCols" :key="col" class="px-3 py-2 text-left font-medium text-ink-700 text-xs">{{ col }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in previewData" :key="i" class="border-b border-ink-100 hover:bg-ink-50">
                  <td v-for="col in previewCols" :key="col" class="px-3 py-2 text-ink-600 text-xs">
                    <span v-if="col === 'Seviye' || col === 'Risk'">
                      <span :class="levelBadgeClass(row[col])" class="px-1.5 py-0.5 rounded text-xs font-medium">{{ row[col] }}</span>
                    </span>
                    <span v-else-if="col.includes('Tutar') || col.includes('TL') || col.includes('Limit') || col.includes('Bakiye') || col.includes('Değer') || col.includes('Ciro')">
                      {{ formatTL(row[col]) }}
                    </span>
                    <span v-else-if="col.includes('%') || col.includes('Dönüşüm')">
                      {{ typeof row[col] === 'number' ? '%' + row[col].toFixed(1) : row[col] }}
                    </span>
                    <span v-else>{{ row[col] }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div v-else class="p-6 text-center text-ink-500">
          <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin mx-auto mb-2" />
          Yükleniyor...
        </div>
        <template #footer>
          <div class="flex justify-between items-center">
            <span class="text-xs text-ink-400">Örnek veri — gerçek veriler için "Detaylı Rapor"u kullanın</span>
            <button @click="previewOpen = false" class="px-4 py-2 bg-ink-700 hover:bg-ink-800 text-white text-sm font-medium rounded-lg">Kapat</button>
          </div>
        </template>
      </Modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Modal from '~/components/Modal.vue'

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
  {
    id: 'plasiyer-sales', title: 'Plasiyer Satış', icon: 'lucide:user-check', bgColor: 'bg-amber-100', iconColor: 'text-amber-600',
    badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700',
    desc: 'Plasiyer bazlı ciro ve proforma istatistikleri',
    formula: 'Onaylanmış proformalar plasiyer bazında gruplanır. Ciro = SUM(proforma.totalAmount). Ortalama = Ciro / Proforma Sayısı. Dönüşüm = Onaylı / Toplam Proforma.',
    sampleData: [
      { plasiyerName: 'Ahmet Satış', plasiyerEmail: 'ahmet@test.com', proformaCount: 24, totalAmount: 186000, averageAmount: 7750 },
      { plasiyerName: 'Mehmet Temsilci', plasiyerEmail: 'mehmet@test.com', proformaCount: 18, totalAmount: 142500, averageAmount: 7917 },
      { plasiyerName: 'Ayşe Pazarlama', plasiyerEmail: 'ayse@test.com', proformaCount: 31, totalAmount: 253000, averageAmount: 8161 },
    ],
  },
  {
    id: 'order-pipeline', title: 'Sipariş Pipeline', icon: 'lucide:bar-chart-3', bgColor: 'bg-blue-100', iconColor: 'text-blue-600',
    badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700',
    desc: 'Siparişlerin durum dağılımı ve tutarları',
    formula: 'Tüm siparişler status alanına göre gruplanır. Her durum için: COUNT(id) ve SUM(total) hesaplanır. Pipeline sırası: PENDING_APPROVAL → APPROVED → PREPARING → SHIPPED → COMPLETED. İptal edilenler CANCELLED olarak ayrı gösterilir.',
    sampleData: [
      { status: 'PENDING_APPROVAL', count: 5, totalAmount: 42000 },
      { status: 'APPROVED', count: 8, totalAmount: 68000 },
      { status: 'PREPARING', count: 3, totalAmount: 25000 },
      { status: 'SHIPPED', count: 12, totalAmount: 96000 },
      { status: 'COMPLETED', count: 45, totalAmount: 380000 },
      { status: 'CANCELLED', count: 2, totalAmount: 15000 },
    ],
  },
  {
    id: 'dealer-risk', title: 'Bayi Risk Skoru', icon: 'lucide:shield-alert', bgColor: 'bg-red-100', iconColor: 'text-red-600',
    badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700',
    desc: 'Kredi kullanımı, iptal oranı, aktivite bazlı risk analizi',
    formula: 'Risk Skoru (0-100) = KrediKullanım% × 40 + İptalOranı% × 30 + HareketsizlikGün × 0.5 (max 30). KrediKullanım% = cariBalance / creditLimit. İptalOranı = iptal edilen / toplam sipariş (son 180 gün). Skor ≥ 70 → YÜKSEK risk, 40-69 → ORTA, < 40 → DÜŞÜK.',
    sampleData: [
      { dealerName: 'ABC İnşaat', cariNo: '120.01.0001', city: 'İstanbul', creditUsagePct: 85, cancelRate: 12, riskScore: 72, riskLevel: 'YÜKSEK' },
      { dealerName: 'XYZ Yapı', cariNo: '120.01.0002', city: 'Ankara', creditUsagePct: 45, cancelRate: 5, riskScore: 38, riskLevel: 'DÜŞÜK' },
      { dealerName: '123 Ticaret', cariNo: '120.01.0003', city: 'İzmir', creditUsagePct: 62, cancelRate: 8, riskScore: 55, riskLevel: 'ORTA' },
    ],
  },
  {
    id: 'critical-stock', title: 'Kritik Stok', icon: 'lucide:package-warning', bgColor: 'bg-orange-100', iconColor: 'text-orange-600',
    badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700',
    desc: 'Minimum seviyenin altındaki ürünler',
    formula: 'displayStock ≤ minimumStock → 🔴 KRİTİK. displayStock ≤ middleStock → 🟡 UYARI. Açık = minimumStock - displayStock (kaç adet eksik). Stok değeri = displayStock × basePrice. displayStock = netsisStock - netsisPendingQuantity - reservedStock.',
    sampleData: [
      { sku: '9097', name: '60X120 Navas Siyah Seramik', currentStock: 5, minimumStock: 10, deficit: 5, level: 'KRİTİK' },
      { sku: 'VTR-103', name: 'Ventuno Duvara Sıfır Klozet', currentStock: 2, minimumStock: 8, deficit: 6, level: 'KRİTİK' },
      { sku: 'BAT-6135', name: 'Visia Plus Kuğu Lavabo Bataryası', currentStock: 8, minimumStock: 15, deficit: 7, level: 'UYARI' },
    ],
  },
  {
    id: 'slow-moving', title: 'Hareketsiz Stok', icon: 'lucide:package-x', bgColor: 'bg-purple-100', iconColor: 'text-purple-600',
    badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700',
    desc: 'Uzun süredir satılmayan ürünler',
    formula: 'Son sipariş tarihi bugünden çıkarılır. 90+ gün → 🟡 YAVAŞ, 180+ gün → 🟠 HAREKETSİZ, 365+ gün → 🔴 ÖLÜ STOK. Stok Değeri = displayStock × basePrice. Sadece displayStock > 0 olan ürünler listelenir.',
    sampleData: [
      { sku: 'INS-006', name: 'M6 Hafif Yük İnsörtü 35mm', brand: 'FISCHER', currentStock: 800, stockValue: 4000, daysSinceLastSale: 210, level: 'HAREKETSİZ' },
      { sku: 'RTR-8719', name: 'Benzinli Ağaç Motoru 57 CC', brand: 'RTRMAX', currentStock: 5, stockValue: 24000, daysSinceLastSale: 95, level: 'YAVAŞ' },
      { sku: 'SLK-3522', name: 'Soudal Ultra Dayanıklı Silikon', brand: 'SOUDAL', currentStock: 45, stockValue: 11250, daysSinceLastSale: 380, level: 'ÖLÜ STOK' },
    ],
  },
  {
    id: 'credit-usage', title: 'Kredi Limiti', icon: 'lucide:credit-card', bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600',
    badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700',
    desc: 'Bayi kredi limiti kullanım yüzdeleri',
    formula: 'Kullanım% = (cariBalance / creditLimit) × 100. creditLimit = 0 → limitsiz. Kullanım ≥ %90 → 🔴 BLOKE (yeni sipariş açılamaz). %75-89 → 🟡 UYARI. <%75 → 🟢 NORMAL. Bakiye negatifse bayi borçlu demektir.',
    sampleData: [
      { company: 'ABC İnşaat Ltd.', cariNo: '120.01.0001', creditLimit: 100000, currentBalance: 92000, usagePct: 92, level: 'BLOKE' },
      { company: 'XYZ Yapı Malz.', cariNo: '120.01.0002', creditLimit: 75000, currentBalance: 58000, usagePct: 77, level: 'UYARI' },
      { company: 'Marmara Ticaret', cariNo: '120.01.0004', creditLimit: 50000, currentBalance: 15000, usagePct: 30, level: 'NORMAL' },
    ],
  },
  {
    id: 'plasiyer-dashboard', title: 'Plasiyer Dashboard', icon: 'lucide:layout-dashboard', bgColor: 'bg-green-100', iconColor: 'text-green-600',
    badge: 'Hemen', badgeColor: 'bg-green-100 text-green-700',
    desc: 'Plasiyer performans KPIları',
    formula: 'Plasiyer bazında: Toplam Proforma, Onaylı, Bekleyen, Reddedilen sayıları. Ciro = SUM(onaylı proforma totalAmount). Dönüşüm% = (Onaylı / Toplam Proforma) × 100. Ortalama = Ciro / Onaylı sayısı.',
    sampleData: [
      { plasiyerName: 'Ahmet Satış', totalProformas: 30, approvedCount: 24, pendingCount: 4, rejectedCount: 2, totalAmount: 186000, conversionRate: 80.0 },
      { plasiyerName: 'Ayşe Pazarlama', totalProformas: 38, approvedCount: 31, pendingCount: 5, rejectedCount: 2, totalAmount: 253000, conversionRate: 81.6 },
    ],
  },
  {
    id: 'plasiyers', title: 'Plasiyer Listesi', icon: 'lucide:users', bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600',
    badge: 'Yönetim', badgeColor: 'bg-blue-100 text-blue-700',
    desc: 'Tüm plasiyerler ve istatistikleri',
    formula: 'PLASIYER rolündeki kullanıcılar listelenir. Her biri için oluşturduğu proforma sayıları (toplam, onaylı, bekleyen) sayılır. Plasiyer = admin tarafından oluşturulan satış temsilcisi.',
    sampleData: [
      { name: 'Ahmet Satış', email: 'ahmet@test.com', phone: '0532 111 2233', totalProformas: 30, approvedProformas: 24, pendingProformas: 4 },
      { name: 'Ayşe Pazarlama', email: 'ayse@test.com', phone: '0533 444 5566', totalProformas: 38, approvedProformas: 31, pendingProformas: 5 },
    ],
  },
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
const activeReportFormula = computed(() => reports.find(r => r.id === activeReport.value)?.formula || '')
const activeColumns = computed(() => reportMeta[activeReport.value || '']?.cols || [])

// ─── Preview Modal ───────────────────────────────────────────
const previewOpen = ref(false)
const previewTitle = ref('')
const previewFormula = ref('')
const previewData = ref<any[]>([])
const previewCols = ref<string[]>([])

function previewReport(reportId: string) {
  const report = reports.find(r => r.id === reportId)
  if (!report) return
  const meta = reportMeta[reportId]
  previewTitle.value = report.title
  previewFormula.value = report.formula
  previewCols.value = meta?.cols || []
  previewOpen.value = true
  // Simulate loading then show sample data
  previewData.value = []
  setTimeout(() => {
    previewData.value = (report as any).sampleData || []
  }, 400)
}

// ─── Level Badge ──────────────────────────────────────────────
const levelBadgeClass = (val: string) => {
  if (!val) return ''
  const v = String(val).toLowerCase()
  if (['critical', 'yüksek', 'high', 'dead', 'blocked', 'bloke', 'hareketsiz', 'ölü stok'].includes(v)) return 'bg-red-100 text-red-700'
  if (['warning', 'medium', 'slow', 'watch', 'uyari', 'yavaş', 'orta'].includes(v)) return 'bg-amber-100 text-amber-700'
  return 'bg-green-100 text-green-700'
}

const formatTL = (val: number) => {
  if (!val && val !== 0) return '-'
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(val)
}

// ─── API ──────────────────────────────────────────────────────
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

    if (activeReport.value === 'critical-stock') {
      data = [...(data.critical || []).map((d: any) => ({ ...d, level: 'KRİTİK' })), ...(data.warning || []).map((d: any) => ({ ...d, level: 'UYARI' }))]
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
  } catch { /* KPI'lar yüklenemezse boş kalır */ }
})
</script>
