<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api = useApi()

interface DealerCrm {
  id: string
  name: string
  company: string
  contactPerson: string
  phone: string
  city: string
  region: string
  status: string
  cariBalance: number
  creditLimit: number
  totalOrders: number
  totalRevenue: number
  lastOrderAt?: string
  approvedAt?: string
}

function riskLevel(d: DealerCrm): { color: string; label: string; pct: number } {
  if (!d.creditLimit || d.creditLimit <= 0) return { color: 'bg-ink-100 text-ink-600', label: 'Limit Yok', pct: 0 }
  const pct = Math.round((Math.abs(d.cariBalance) / d.creditLimit) * 100)
  if (pct >= 100) return { color: 'bg-red-100 text-red-700', label: `%${pct} — Aşıldı!`, pct }
  if (pct >= 80) return { color: 'bg-red-100 text-red-700', label: `%${pct}`, pct }
  if (pct >= 50) return { color: 'bg-amber-100 text-amber-700', label: `%${pct}`, pct }
  return { color: 'bg-emerald-100 text-emerald-700', label: `%${pct}`, pct }
}

function daysSinceLastOrder(d: DealerCrm): number | null {
  if (!d.lastOrderAt) return null
  return Math.floor((Date.now() - new Date(d.lastOrderAt).getTime()) / 86400000)
}

const dealers = ref<DealerCrm[]>([])
const loading = ref(true)
const search = ref('')
const regionFilter = ref('')
const selectedDealer = ref<DealerCrm | null>(null)
const showPremiumModal = ref(false)

const regionOptions = ['Marmara', 'Ege', 'IcAnadolu', 'Akdeniz', 'Karadeniz', 'DoguAnadolu', 'GuneyDoguAnadolu']

const filteredDealers = computed(() => {
  let list = dealers.value
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter((d) =>
      d.company.toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      d.contactPerson.toLowerCase().includes(q) ||
      d.city.toLowerCase().includes(q),
    )
  }
  if (regionFilter.value) {
    list = list.filter((d) => d.region === regionFilter.value)
  }
  return list
})

const totalStats = computed(() => ({
  totalDealers: dealers.value.length,
  activeDealers: dealers.value.filter((d) => d.status === 'ACTIVE').length,
  totalRevenue: dealers.value.reduce((s, d) => s + d.totalRevenue, 0),
  totalOrders: dealers.value.reduce((s, d) => s + d.totalOrders, 0),
}))

async function load() {
  loading.value = true
  try {
    dealers.value = await api.get<DealerCrm[]>('/api/dealer/admin/list')
  } catch {
    // Fallback — try the dealers store pattern
    try {
      const raw = await api.get<any[]>('/api/dealer/list')
      dealers.value = raw.map((d: any) => ({
        id: d.id,
        name: d.name ?? d.contactPerson ?? '',
        company: d.company ?? '',
        contactPerson: d.contactPerson ?? '',
        phone: d.phone ?? '',
        city: d.city ?? '',
        region: d.region ?? 'Marmara',
        status: d.status ?? 'ACTIVE',
        cariBalance: d.cariBalance ?? 0,
        creditLimit: d.creditLimit ?? 0,
        totalOrders: d.totalOrders ?? 0,
        totalRevenue: d.totalRevenue ?? 0,
        lastOrderAt: d.lastOrderAt,
        approvedAt: d.approvedAt,
      }))
    } catch {
      dealers.value = []
    }
  }
  loading.value = false
}

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)

const formatDate = (d?: string) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR')
}

const statusLabel = (s: string) => {
  const labels: Record<string, string> = {
    ACTIVE: 'Aktif', PENDING: 'Onay Bekliyor', INACTIVE: 'Pasif', REJECTED: 'Reddedildi',
  }
  return labels[s] ?? s
}

const statusClass = (s: string) => {
  const classes: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700', PENDING: 'bg-amber-100 text-amber-700',
    INACTIVE: 'bg-slate-100 text-slate-600', REJECTED: 'bg-red-100 text-red-700',
  }
  return classes[s] ?? 'bg-slate-100'
}

function openPremium() {
  showPremiumModal.value = true
}

onMounted(load)
</script>

<template>
  <div class="p-6 max-w-7xl mx-auto">
    <PageHeader title="CRM — Müşteri İlişkileri" description="Bayi portföyü, iletişim takibi ve satış fırsatları">
      <template #actions>
        <button class="btn-primary px-4 py-2 rounded-lg text-sm font-semibold bg-primary-900 text-white hover:bg-primary-800" @click="openPremium">
          <Icon name="lucide:crown" class="h-4 w-4 mr-1 inline" />
          Premium'a Yükselt
        </button>
      </template>
    </PageHeader>

    <!-- Stats Row -->
    <div class="grid grid-cols-4 gap-4 mt-6">
      <StatCard label="Toplam Bayi" :value="totalStats.totalDealers" icon="lucide:building-2" color="blue" />
      <StatCard label="Aktif Bayi" :value="totalStats.activeDealers" icon="lucide:user-check" color="green" />
      <StatCard label="Toplam Ciro" :value="formatTL(totalStats.totalRevenue)" icon="lucide:banknote" color="amber" />
      <StatCard label="Toplam Sipariş" :value="totalStats.totalOrders" icon="lucide:package" color="purple" />
    </div>

    <!-- Filters -->
    <div class="mt-6 flex flex-wrap gap-3">
      <input
        v-model="search"
        type="text"
        placeholder="Bayi, şirket veya şehir ara..."
        class="flex-1 min-w-[250px] rounded-lg border border-ink-200 px-4 py-2 text-sm"
      />
      <select v-model="regionFilter" class="rounded-lg border border-ink-200 px-3 py-2 text-sm">
        <option value="">Tüm Bölgeler</option>
        <option v-for="r in regionOptions" :key="r" :value="r">{{ r }}</option>
      </select>
    </div>

    <!-- Dealer Table -->
    <div class="mt-4 bg-white rounded-xl border border-ink-200 overflow-hidden">
      <table class="w-full text-sm">
        <thead class="bg-ink-50 text-ink-500 text-xs uppercase tracking-wider">
          <tr>
            <th class="text-left px-4 py-3">Bayi</th>
            <th class="text-left px-4 py-3">İletişim</th>
            <th class="text-left px-4 py-3">Bölge</th>
            <th class="text-right px-4 py-3">Cari Bakiye</th>
            <th class="text-center px-4 py-3">Risk</th>
            <th class="text-center px-4 py-3">Sipariş</th>
            <th class="text-right px-4 py-3">Ciro</th>
            <th class="text-left px-4 py-3">Son İşlem</th>
            <th class="text-center px-4 py-3">Durum</th>
            <th class="text-center px-4 py-3">Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="dealer in filteredDealers"
            :key="dealer.id"
            class="border-t border-ink-100 hover:bg-ink-50/50 transition-colors cursor-pointer"
            @click="selectedDealer = dealer"
          >
            <td class="px-4 py-3">
              <p class="font-semibold text-ink-900">{{ dealer.company }}</p>
              <p class="text-xs text-ink-500">{{ dealer.name }}</p>
            </td>
            <td class="px-4 py-3">
              <p class="text-xs text-ink-700">{{ dealer.contactPerson }}</p>
              <p class="text-xs text-ink-500">{{ dealer.phone }}</p>
            </td>
            <td class="px-4 py-3 text-xs">
              <p>{{ dealer.city }}</p>
              <p class="text-ink-400">{{ dealer.region }}</p>
            </td>
            <td class="px-4 py-3 text-right">
              <span class="font-semibold" :class="dealer.cariBalance < 0 ? 'text-red-600' : 'text-emerald-600'">
                {{ formatTL(Math.abs(dealer.cariBalance)) }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" :class="riskLevel(dealer).color">
                {{ riskLevel(dealer).label }}
              </span>
              <div v-if="riskLevel(dealer).pct > 0" class="mt-1 w-full bg-ink-200 rounded-full h-1.5">
                <div
                  class="h-1.5 rounded-full transition-all"
                  :class="{
                    'bg-emerald-500': riskLevel(dealer).pct < 50,
                    'bg-amber-500': riskLevel(dealer).pct >= 50 && riskLevel(dealer).pct < 80,
                    'bg-red-500': riskLevel(dealer).pct >= 80,
                  }"
                  :style="{ width: Math.min(riskLevel(dealer).pct, 100) + '%' }"
                />
              </div>
            </td>
            <td class="px-4 py-3 text-center font-semibold">{{ dealer.totalOrders }}</td>
            <td class="px-4 py-3 text-right font-semibold text-ink-900">{{ formatTL(dealer.totalRevenue) }}</td>
            <td class="px-4 py-3 text-xs text-ink-500">{{ formatDate(dealer.lastOrderAt) }}</td>
            <td class="px-4 py-3 text-center">
              <span :class="['inline-flex px-2 py-0.5 rounded-full text-xs font-semibold', statusClass(dealer.status)]">
                {{ statusLabel(dealer.status) }}
              </span>
            </td>
            <td class="px-4 py-3 text-center">
              <button
                class="text-amber-600 hover:text-amber-800 text-xs font-semibold transition-colors"
                @click.stop="openPremium"
              >
                <Icon name="lucide:lock" class="h-3 w-3 inline mr-1" />
                Detay
              </button>
            </td>
          </tr>
          <tr v-if="filteredDealers.length === 0 && !loading">
            <td colspan="10" class="px-4 py-12 text-center text-ink-400">
              Henüz bayi bulunmuyor.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Premium Upsell Modal -->
    <Modal v-if="showPremiumModal" size="md" title="CRM Premium Özellikleri" @close="showPremiumModal = false">
      <div class="p-6 space-y-6">
        <div class="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
          <div class="flex items-center gap-2 mb-3">
            <Icon name="lucide:crown" class="h-6 w-6 text-amber-600" />
            <h3 class="text-lg font-bold text-amber-800">CRM Premium Paketi</h3>
          </div>
          <p class="text-sm text-amber-700 mb-4">
            Bayi ilişkilerinizi profesyonel seviyeye taşıyın. Aşağıdaki özelliklerle portföyünüzü büyütün.
          </p>
        </div>

        <div class="space-y-3">
          <h4 class="font-semibold text-ink-900">Premium Özellikler:</h4>
          <div class="space-y-2">
            <div class="flex items-center gap-3 text-sm text-ink-600">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span><strong>Detaylı bayi profili</strong> — İletişim geçmişi, notlar, görev takibi</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-ink-600">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span><strong>Satış fırsatı (pipeline) yönetimi</strong> — Aşamalı takip: Potansiyel → Teklif → Görüşme → Kazanıldı</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-ink-600">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span><strong>Otomatik hatırlatmalar</strong> — Sipariş vermeyen bayi uyarısı, cari limit aşımı</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-ink-600">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span><strong>Excel dışa aktarım</strong> — Tüm bayi verilerini Excel'e aktarma</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-ink-600">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span><strong>WhatsApp entegrasyonu</strong> — Tek tıkla bayiye WhatsApp mesajı gönderme</span>
            </div>
            <div class="flex items-center gap-3 text-sm text-ink-600">
              <Icon name="lucide:check-circle" class="h-5 w-5 text-emerald-500 flex-shrink-0" />
              <span><strong>Performans raporları</strong> — Bayi bazlı aylık/yıllık karşılaştırmalı raporlar</span>
            </div>
          </div>
        </div>

        <div class="bg-ink-50 rounded-lg p-4 text-center">
          <p class="text-lg font-bold text-primary-900">Aylık ₺499 <span class="text-sm font-normal text-ink-500">+ KDV</span></p>
          <p class="text-xs text-ink-500 mt-1">İlk 14 gün ücretsiz deneme</p>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-between p-4 border-t border-ink-100">
          <button class="px-4 py-2 text-sm text-ink-500 hover:bg-ink-50 rounded-lg transition-colors" @click="showPremiumModal = false">
            Şimdilik Geç
          </button>
          <button class="px-6 py-2 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold transition-colors" @click="showPremiumModal = false">
            Ücretsiz Dene
          </button>
        </div>
      </template>
    </Modal>

    <!-- Quick Dealer Detail (Basic) -->
    <Modal v-if="selectedDealer" size="lg" :title="selectedDealer.company" @close="selectedDealer = null">
      <div class="p-6 space-y-4">
        <div class="grid grid-cols-3 gap-4">
          <div>
            <p class="text-xs text-ink-500 mb-1">Yetkili Kişi</p>
            <p class="font-semibold text-ink-900">{{ selectedDealer.name }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500 mb-1">İletişim</p>
            <p class="font-semibold text-ink-900">{{ selectedDealer.contactPerson }}</p>
            <p class="text-xs text-ink-500">{{ selectedDealer.phone }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500 mb-1">Lokasyon</p>
            <p class="font-semibold text-ink-900">{{ selectedDealer.city }} / {{ selectedDealer.region }}</p>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-4 pt-4 border-t border-ink-100">
          <div>
            <p class="text-xs text-ink-500 mb-1">Cari Bakiye</p>
            <p class="text-xl font-bold" :class="selectedDealer.cariBalance < 0 ? 'text-red-600' : 'text-emerald-600'">
              {{ formatTL(Math.abs(selectedDealer.cariBalance)) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-ink-500 mb-1">Toplam Sipariş</p>
            <p class="text-xl font-bold text-ink-900">{{ selectedDealer.totalOrders }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500 mb-1">Toplam Ciro</p>
            <p class="text-xl font-bold text-ink-900">{{ formatTL(selectedDealer.totalRevenue) }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500 mb-1">Son Sipariş</p>
            <p class="text-xl font-bold text-ink-900">{{ formatDate(selectedDealer.lastOrderAt) }}</p>
          </div>
        </div>

        <!-- Upsell block -->
        <div
          class="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
          @click="selectedDealer = null; showPremiumModal = true"
        >
          <div>
            <p class="font-semibold text-amber-800">Detaylı CRM verilerini görmek ister misiniz?</p>
            <p class="text-sm text-amber-600">İletişim geçmişi, notlar, satış fırsatları ve daha fazlası</p>
          </div>
          <button class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1">
            <Icon name="lucide:crown" class="h-4 w-4" />
            Premium
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>
