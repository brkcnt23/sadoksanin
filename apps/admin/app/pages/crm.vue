<script setup lang="ts">
definePageMeta({ middleware: 'auth', title: 'CRM | Sadoksan Admin' })

const api = useApi()
const toast = useToast()
const dealersStore = useDealersStore()
const ordersStore = useOrdersStore()
const auditStore = useAuditStore()

interface DealerCrm {
  id: string; name: string; company: string; contactPerson: string
  phone: string; city: string; region: string; status: string
  cariBalance: number; creditLimit: number; totalOrders: number
  totalRevenue: number; lastOrderAt?: string; approvedAt?: string
  email?: string; address?: string; taxNo?: string; taxOffice?: string
}

function riskLevel(d: DealerCrm) {
  if (!d.creditLimit || d.creditLimit <= 0) return { color: 'bg-ink-100 text-ink-600', label: 'Limit Yok', pct: 0 }
  const pct = Math.round((Math.abs(d.cariBalance) / d.creditLimit) * 100)
  if (pct >= 100) return { color: 'bg-red-100 text-red-700', label: `%${pct} — Aşıldı!`, pct }
  if (pct >= 80) return { color: 'bg-red-100 text-red-700', label: `%${pct}`, pct }
  if (pct >= 50) return { color: 'bg-amber-100 text-amber-700', label: `%${pct}`, pct }
  return { color: 'bg-emerald-100 text-emerald-700', label: `%${pct}`, pct }
}

const dealers = ref<DealerCrm[]>([])
const loading = ref(true)
const search = ref('')
const regionFilter = ref('')
const selectedDealer = ref<DealerCrm | null>(null)
const detailTab = ref<'overview' | 'orders' | 'activity' | 'notes'>('overview')
const dealerOrders = ref<any[]>([])
const dealerActivity = ref<any[]>([])
const dealerNotes = ref<{ text: string; date: string }[]>([])
const newNote = ref('')
const detailLoading = ref(false)

const regionOptions = ['Marmara', 'Ege', 'IcAnadolu', 'Akdeniz', 'Karadeniz', 'DoguAnadolu', 'GuneyDoguAnadolu']

const filteredDealers = computed(() => {
  let list = dealers.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(d => d.company.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.contactPerson.toLowerCase().includes(q) || d.city.toLowerCase().includes(q))
  }
  if (regionFilter.value) list = list.filter(d => d.region === regionFilter.value)
  return list
})

const totalStats = computed(() => ({
  totalDealers: dealers.value.length,
  activeDealers: dealers.value.filter(d => d.status === 'ACTIVE').length,
  totalRevenue: dealers.value.reduce((s, d) => s + d.totalRevenue, 0),
  totalOrders: dealers.value.reduce((s, d) => s + d.totalOrders, 0),
}))

async function load() {
  loading.value = true
  try {
    dealers.value = await api.get<DealerCrm[]>('/dealer/admin/list') || []
  } catch { dealers.value = [] }
  loading.value = false
}

async function openDetail(dealer: DealerCrm) {
  selectedDealer.value = dealer
  detailTab.value = 'overview'
  detailLoading.value = true
  dealerOrders.value = []
  dealerActivity.value = []
  dealerNotes.value = JSON.parse(localStorage.getItem(`crm-notes-${dealer.id}`) || '[]')

  try {
    const [ordersRaw, activityRaw] = await Promise.all([
      api.get<any[]>('/orders/admin/pending?limit=500').catch(() => []),
      api.get<any[]>('/admin/audit', { limit: 50 }).catch(() => []),
    ])
    dealerOrders.value = (ordersRaw || []).filter((o: any) =>
      (o.dealerId === dealer.id) || (o.customerName && dealer.company && o.customerName.includes(dealer.company))
    ).slice(0, 20)
    dealerActivity.value = (activityRaw || []).filter((a: any) =>
      a.entity === 'Dealer' || (a.entityId && a.entityId === dealer.id) || (a.user && dealer.name && a.user.includes(dealer.name))
    ).slice(0, 30)
  } catch { /* keep defaults */ }
  detailLoading.value = false
}

function addNote() {
  if (!newNote.value.trim() || !selectedDealer.value) return
  const note = { text: newNote.value.trim(), date: new Date().toISOString() }
  dealerNotes.value.unshift(note)
  localStorage.setItem(`crm-notes-${selectedDealer.value.id}`, JSON.stringify(dealerNotes.value))
  newNote.value = ''
  toast.push('Not eklendi', 'success')
}

function deleteNote(idx: number) {
  dealerNotes.value.splice(idx, 1)
  if (selectedDealer.value) localStorage.setItem(`crm-notes-${selectedDealer.value.id}`, JSON.stringify(dealerNotes.value))
  toast.push('Not silindi', 'info')
}

function daysSince(d?: string): number | null {
  if (!d) return null
  return Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
}

const formatTL = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)
const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('tr-TR') : '—'
const formatDateTime = (d?: string) => d ? new Date(d).toLocaleString('tr-TR') : '—'

const statusLabel = (s: string) => ({ ACTIVE: 'Aktif', PENDING: 'Onay Bekliyor', INACTIVE: 'Pasif', REJECTED: 'Reddedildi' } as any)[s] ?? s
const statusVariant = (s: string) => ({ ACTIVE: 'success', PENDING: 'warning', INACTIVE: 'neutral', REJECTED: 'danger' } as any)[s] ?? 'neutral'

const orderStatusLabel = (s: string) => ({ pending_approval: 'Onay Bekliyor', approved: 'Onaylandı', preparing: 'Hazırlanıyor', shipped: 'Sevk Edildi', completed: 'Tamamlandı', cancelled: 'İptal', rejected: 'Reddedildi' } as any)[s] ?? s
const orderStatusVariant = (s: string) => ({ pending_approval: 'warning', approved: 'info', preparing: 'info', shipped: 'purple', completed: 'success', cancelled: 'neutral', rejected: 'danger' } as any)[s] ?? 'neutral'

onMounted(() => { load(); auditStore.load(1) })
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="CRM — Bayi İlişkileri" description="Bayi portföyü, sipariş takibi ve iletişim yönetimi" />

    <!-- Stats Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Toplam Bayi" :value="totalStats.totalDealers" icon="lucide:building-2" color="blue" />
      <StatCard label="Aktif Bayi" :value="totalStats.activeDealers" icon="lucide:user-check" color="green" />
      <StatCard label="Toplam Ciro" :value="formatTL(totalStats.totalRevenue)" icon="lucide:banknote" color="amber" />
      <StatCard label="Toplam Sipariş" :value="totalStats.totalOrders" icon="lucide:package" color="purple" />
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3">
      <div class="relative flex-1 min-w-[250px]">
        <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input v-model="search" type="text" placeholder="Bayi, şirket veya şehir ara..." class="w-full pl-9 pr-4 py-2 rounded-lg border border-ink-200 text-sm" />
      </div>
      <select v-model="regionFilter" class="rounded-lg border border-ink-200 px-3 py-2 text-sm bg-white">
        <option value="">Tüm Bölgeler</option>
        <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-xl border border-ink-200 p-8 text-center text-ink-500">Yükleniyor...</div>

    <!-- Dealer Table -->
    <div v-else class="bg-white rounded-xl border border-ink-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-ink-50 text-ink-500 text-xs uppercase tracking-wider">
            <tr>
              <th class="text-left px-4 py-3">Bayi / Firma</th>
              <th class="text-left px-4 py-3 hidden md:table-cell">İletişim</th>
              <th class="text-left px-4 py-3 hidden lg:table-cell">Bölge</th>
              <th class="text-right px-4 py-3">Cari</th>
              <th class="text-center px-4 py-3 hidden md:table-cell">Risk</th>
              <th class="text-center px-4 py-3">Sipariş</th>
              <th class="text-right px-4 py-3 hidden lg:table-cell">Ciro</th>
              <th class="text-center px-4 py-3">Durum</th>
              <th class="text-center px-4 py-3 w-24">Detay</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in filteredDealers" :key="d.id" class="border-t border-ink-100 hover:bg-ink-50/50">
              <td class="px-4 py-3">
                <p class="font-semibold text-ink-900">{{ d.company }}</p>
                <p class="text-xs text-ink-500">{{ d.name }}</p>
              </td>
              <td class="px-4 py-3 hidden md:table-cell">
                <p class="text-xs text-ink-700">{{ d.contactPerson }}</p>
                <p class="text-xs text-ink-500">{{ d.phone }}</p>
              </td>
              <td class="px-4 py-3 text-xs hidden lg:table-cell">{{ d.city }}<br><span class="text-ink-400">{{ d.region }}</span></td>
              <td class="px-4 py-3 text-right">
                <span class="font-semibold text-sm" :class="d.cariBalance < 0 ? 'text-red-600' : 'text-emerald-600'">{{ formatTL(Math.abs(d.cariBalance)) }}</span>
              </td>
              <td class="px-4 py-3 text-center hidden md:table-cell">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" :class="riskLevel(d).color">{{ riskLevel(d).label }}</span>
                <div v-if="riskLevel(d).pct > 0" class="mt-1 w-full bg-ink-200 rounded-full h-1.5 max-w-[80px] mx-auto">
                  <div class="h-1.5 rounded-full" :class="{ 'bg-emerald-500': riskLevel(d).pct < 50, 'bg-amber-500': riskLevel(d).pct >= 50 && riskLevel(d).pct < 80, 'bg-red-500': riskLevel(d).pct >= 80 }" :style="{ width: Math.min(riskLevel(d).pct, 100) + '%' }" />
                </div>
              </td>
              <td class="px-4 py-3 text-center font-semibold">{{ d.totalOrders }}</td>
              <td class="px-4 py-3 text-right font-semibold text-ink-900 hidden lg:table-cell">{{ formatTL(d.totalRevenue) }}</td>
              <td class="px-4 py-3 text-center"><StatusBadge :variant="statusVariant(d.status)" :label="statusLabel(d.status)" /></td>
              <td class="px-4 py-3 text-center">
                <button @click="openDetail(d)" class="p-1.5 text-ink-500 hover:bg-primary-50 hover:text-primary-600 rounded-md transition-colors" title="Detay">
                  <Icon name="lucide:eye" class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <tr v-if="filteredDealers.length === 0">
              <td colspan="9" class="px-4 py-12 text-center text-ink-400">Bayi bulunamadı.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Dealer Detail Drawer -->
    <div v-if="selectedDealer" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-black/30" @click="selectedDealer = null" />
      <div class="relative w-full max-w-2xl bg-white shadow-xl flex flex-col h-full overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-4 border-b border-ink-200 shrink-0">
          <div>
            <h3 class="font-semibold text-lg text-ink-900">{{ selectedDealer.company }}</h3>
            <p class="text-sm text-ink-500">{{ selectedDealer.name }} · {{ selectedDealer.city }}</p>
          </div>
          <button @click="selectedDealer = null" class="p-1.5 hover:bg-ink-100 rounded-md"><Icon name="lucide:x" class="w-5 h-5 text-ink-500" /></button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-ink-200 shrink-0">
          <button v-for="t in [{k:'overview',l:'Genel'},{k:'orders',l:'Siparişler'},{k:'activity',l:'Hareketler'},{k:'notes',l:'Notlar'}]" :key="t.k" @click="detailTab = t.k" :class="['flex-1 py-3 text-sm font-medium transition-colors border-b-2', detailTab === t.k ? 'border-primary-600 text-primary-600' : 'border-transparent text-ink-500 hover:text-ink-700']">{{ t.l }}</button>
        </div>

        <!-- Tab Content -->
        <div class="flex-1 overflow-y-auto p-5 space-y-4">
          <div v-if="detailLoading" class="text-center py-12 text-ink-400">Yükleniyor...</div>

          <!-- Genel -->
          <template v-else-if="detailTab === 'overview'">
            <div class="grid grid-cols-2 gap-4">
              <div class="bg-ink-50 rounded-lg p-4">
                <p class="text-xs text-ink-500 mb-1">Yetkili Kişi</p>
                <p class="font-semibold text-ink-900">{{ selectedDealer.name }}</p>
              </div>
              <div class="bg-ink-50 rounded-lg p-4">
                <p class="text-xs text-ink-500 mb-1">İletişim</p>
                <p class="font-semibold text-ink-900">{{ selectedDealer.contactPerson }}</p>
                <p class="text-sm text-ink-600">{{ selectedDealer.phone }}</p>
                <p v-if="selectedDealer.email" class="text-sm text-ink-600">{{ selectedDealer.email }}</p>
              </div>
              <div class="bg-ink-50 rounded-lg p-4">
                <p class="text-xs text-ink-500 mb-1">Lokasyon</p>
                <p class="font-semibold text-ink-900">{{ selectedDealer.city }} / {{ selectedDealer.region }}</p>
              </div>
              <div class="bg-ink-50 rounded-lg p-4">
                <p class="text-xs text-ink-500 mb-1">Durum</p>
                <StatusBadge :variant="statusVariant(selectedDealer.status)" :label="statusLabel(selectedDealer.status)" />
              </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="bg-white border border-ink-200 rounded-lg p-4 text-center">
                <p class="text-xs text-ink-500 mb-1">Cari Bakiye</p>
                <p class="text-xl font-bold" :class="selectedDealer.cariBalance < 0 ? 'text-red-600' : 'text-emerald-600'">{{ formatTL(Math.abs(selectedDealer.cariBalance)) }}</p>
              </div>
              <div class="bg-white border border-ink-200 rounded-lg p-4 text-center">
                <p class="text-xs text-ink-500 mb-1">Kredi Limiti</p>
                <p class="text-xl font-bold text-ink-900">{{ formatTL(selectedDealer.creditLimit) }}</p>
              </div>
              <div class="bg-white border border-ink-200 rounded-lg p-4 text-center">
                <p class="text-xs text-ink-500 mb-1">Toplam Sipariş</p>
                <p class="text-xl font-bold text-ink-900">{{ selectedDealer.totalOrders }}</p>
              </div>
              <div class="bg-white border border-ink-200 rounded-lg p-4 text-center">
                <p class="text-xs text-ink-500 mb-1">Toplam Ciro</p>
                <p class="text-xl font-bold text-primary-600">{{ formatTL(selectedDealer.totalRevenue) }}</p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="bg-ink-50 rounded-lg p-3">
                <p class="text-xs text-ink-500">Son Sipariş</p>
                <p class="font-semibold text-ink-900">{{ formatDate(selectedDealer.lastOrderAt) }}</p>
                <p v-if="daysSince(selectedDealer.lastOrderAt) !== null" class="text-xs" :class="(daysSince(selectedDealer.lastOrderAt) ?? 0) > 30 ? 'text-red-600' : 'text-ink-500'">{{ daysSince(selectedDealer.lastOrderAt) }} gün önce</p>
              </div>
              <div class="bg-ink-50 rounded-lg p-3">
                <p class="text-xs text-ink-500">Onay Tarihi</p>
                <p class="font-semibold text-ink-900">{{ formatDate(selectedDealer.approvedAt) }}</p>
              </div>
            </div>
          </template>

          <!-- Siparişler -->
          <template v-else-if="detailTab === 'orders'">
            <div v-if="dealerOrders.length === 0" class="text-center py-12 text-ink-400">
              <Icon name="lucide:package" class="w-10 h-10 mx-auto mb-3 text-ink-300" />
              <p>Bu bayiye ait sipariş bulunamadı.</p>
            </div>
            <div v-else class="space-y-2">
              <div v-for="o in dealerOrders" :key="o.id" class="bg-white border border-ink-200 rounded-lg p-4 hover:border-primary-300 transition-colors">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <p class="font-mono font-semibold text-ink-900 text-sm">{{ o.orderNo }}</p>
                    <StatusBadge :variant="orderStatusVariant(o.status)" :label="orderStatusLabel(o.status)" />
                  </div>
                  <p class="font-bold text-ink-900">{{ formatTL(o.total || 0) }}</p>
                </div>
                <div class="flex items-center gap-4 mt-2 text-xs text-ink-500">
                  <span>{{ o.lines?.length || 0 }} kalem</span>
                  <span>{{ formatDate(o.createdAt) }}</span>
                  <span v-if="o.eInvoiceNo" class="text-emerald-600">E-Fatura: {{ o.eInvoiceNo }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- Hareketler -->
          <template v-else-if="detailTab === 'activity'">
            <div v-if="dealerActivity.length === 0" class="text-center py-12 text-ink-400">
              <Icon name="lucide:activity" class="w-10 h-10 mx-auto mb-3 text-ink-300" />
              <p>Henüz hareket kaydı bulunamadı.</p>
            </div>
            <div v-else class="space-y-3">
              <div class="flex flex-col pl-4 border-l-2 border-ink-200">
                <div v-for="a in dealerActivity" :key="a.id" class="relative pl-6 pb-3 last:pb-0">
                  <div class="absolute left-[-6px] top-1 w-3 h-3 rounded-full bg-primary-500 border-2 border-white" />
                  <p class="text-sm font-medium text-ink-900">{{ a.action || 'İşlem' }}</p>
                  <p v-if="a.diff" class="text-xs text-ink-500 mt-0.5 font-mono truncate max-w-md">{{ a.diff }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span v-if="a.user" class="text-xs text-ink-400">{{ a.user }}</span>
                    <span class="text-xs text-ink-400">{{ formatDateTime(a.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Notlar -->
          <template v-else-if="detailTab === 'notes'">
            <div class="flex gap-2 mb-4">
              <input v-model="newNote" @keyup.enter="addNote" placeholder="Yeni not..." class="flex-1 px-3 py-2 border border-ink-300 rounded-lg text-sm" />
              <button @click="addNote" :disabled="!newNote.trim()" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50">Ekle</button>
            </div>
            <div v-if="dealerNotes.length === 0" class="text-center py-12 text-ink-400">
              <Icon name="lucide:sticky-note" class="w-10 h-10 mx-auto mb-3 text-ink-300" />
              <p>Henüz not eklenmedi.</p>
            </div>
            <div v-else class="space-y-2">
              <div v-for="(n, i) in dealerNotes" :key="i" class="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start justify-between">
                <div class="flex-1">
                  <p class="text-sm text-ink-800">{{ n.text }}</p>
                  <p class="text-xs text-ink-400 mt-1">{{ formatDateTime(n.date) }}</p>
                </div>
                <button @click="deleteNote(i)" class="p-1 text-ink-400 hover:text-red-600 transition-colors"><Icon name="lucide:trash-2" class="w-4 h-4" /></button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
