<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { enableDealer, isDealer, dealer } = useDealer()
const { push: pushToast } = useToast()
const { featured } = useProducts()
const { getUser, isAuthenticated, loadUser } = useAuth()
const { getDealerInfo, getCariTransactions, getProformas, downloadProforma, downloadStockReport } = useDealerApi()

useHead({ title: 'Bayi Paneli — Sadöksan' })

if (import.meta.client) {
  loadUser()
}

const currentUser = computed(() => getUser())
const isDealerRole = computed(() => currentUser.value?.role === 'DEALER')

watchEffect(() => {
  if (!isAuthenticated.value) {
    navigateTo('/giris')
  }
})

// Dealer data from real API
const dashboard = ref({
  cariBalance: 0,
  pendingOrders: 0,
  monthlyOrderCount: 0,
  monthlyOrderTotal: 0,
  creditLimit: 0,
})

const recentOrders = ref<any[]>([])
const cariHistory = ref<any[]>([])
const proformas = ref<any[]>([])
const dealerInfo = ref<any>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const activeTab = ref('cari')
const downloadingReport = ref<string | null>(null)
const downloadingProforma = ref<string | null>(null)

const dealerTabs = [
  { id: 'cari', label: 'İşlemler', icon: 'lucide:credit-card' },
  { id: 'raporlar', label: 'Raporlar', icon: 'lucide:bar-chart-3' },
  { id: 'proformalar', label: 'Proformalar', icon: 'lucide:file-text' },
  { id: 'bilgiler', label: 'Bilgilerim', icon: 'lucide:user' },
] as const

const customerTabs = [
  { id: 'siparisler', label: 'Siparişlerim', icon: 'lucide:package' },
  { id: 'favoriler', label: 'Favorilerim', icon: 'lucide:heart' },
  { id: 'bilgiler', label: 'Bilgilerim', icon: 'lucide:user' },
] as const

const tabs = computed(() => isDealerRole.value ? dealerTabs : customerTabs)

const loadDashboard = async () => {
  loading.value = true
  error.value = null

  if (!isDealerRole.value) {
    loading.value = false
    return
  }

  try {
    const [info, cari, proformaList] = await Promise.all([
      getDealerInfo(),
      getCariTransactions(),
      getProformas(),
    ])

    dealerInfo.value = info
    cariHistory.value = cari || []
    proformas.value = proformaList || []

    dashboard.value.cariBalance = info?.cariBalance || 0
    dashboard.value.creditLimit = info?.creditLimit || 0

    if (cari?.length) {
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const monthlyTxns = cari.filter((t: any) => new Date(t.date) >= monthStart)
      dashboard.value.monthlyOrderCount = monthlyTxns.length
      dashboard.value.monthlyOrderTotal = monthlyTxns.reduce((s: number, t: any) => s + Math.abs(t.amount || 0), 0)

      const pending = cari.filter((t: any) => t.status === 'PENDING_APPROVAL' || t.status === 'Onay Bekleniyor')
      dashboard.value.pendingOrders = pending.length

      recentOrders.value = cari.slice(0, 8).map((t: any) => ({
        id: t.id?.slice(0, 12) || '—',
        date: t.date ? new Date(t.date).toLocaleDateString('tr-TR') : '—',
        items: t.items || 1,
        total: Math.abs(t.amount || 0),
        status: t.status === 'PENDING_APPROVAL' ? 'Onay Bekleniyor' : t.status === 'SHIPPED' ? 'Sevk Edildi' : t.type === 'debit' ? 'Tamamlandı' : 'İşlem',
      }))
    }
  } catch (err: any) {
    error.value = err?.message || 'Veriler yüklenemedi'
    pushToast({ variant: 'error', title: 'Yükleme hatası', description: error.value })
  }
  loading.value = false
}

onMounted(async () => {
  await loadDashboard()

  const u = getUser()

  if (isDealerRole.value && !isDealer.value && u) {
    const info = dealerInfo.value
    enableDealer({
      id: info?.id || u.id,
      code: info?.cariNo || `BYI-${u.id.slice(0, 4).toUpperCase()}`,
      companyName: info?.company || u.name || 'Bayi',
      city: info?.city || 'Bilinmiyor',
      logisticsSurcharge: 40,
    })
    pushToast({
      variant: 'info',
      title: 'Bayi modu aktif',
      description: `Lokasyon: ${info?.city || 'Bilinmiyor'} — fiyatlara +40 TL lojistik bedeli uygulanacaktır.`,
      duration: 6000,
    })
  }
})

const featuredItems = featured(8)

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }).format(value)

const formatDate = (date: Date): string =>
  new Intl.DateTimeFormat('tr-TR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)

const statusColor = (s: string) => {
  if (s === 'Onay Bekleniyor') return 'bg-amber-50 text-amber-800 border-amber-200'
  if (s === 'Sevk Edildi') return 'bg-blue-50 text-blue-800 border-blue-200'
  return 'bg-emerald-50 text-emerald-800 border-emerald-200'
}

const proformaStatusClass = (status: string) => {
  if (status === 'sent') return 'bg-emerald-50 text-emerald-800 border-emerald-200'
  if (status === 'accepted') return 'bg-blue-50 text-blue-800 border-blue-200'
  return 'bg-amber-50 text-amber-800 border-amber-200'
}

const proformaStatusLabel = (status: string) => {
  if (status === 'sent') return 'Gönderildi'
  if (status === 'accepted') return 'Kabul Edildi'
  return 'Taslak'
}

const downloadReport = async (reportType: 'monthly' | 'yearly' | 'invoice' | 'stock' | 'detailed') => {
  downloadingReport.value = reportType
  try {
    const reportLabels: Record<string, string> = {
      monthly: 'Aylik-Raporu',
      yearly: 'Yillik-Raporu',
      invoice: 'Fatura-Raporu',
      stock: 'Stok-Raporu',
      detailed: 'Detayli-Rapor',
    }
    const blob = await downloadStockReport(reportType)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportLabels[reportType]}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    pushToast({ variant: 'success', title: 'Rapor indirildi', duration: 4000 })
  } catch (err: any) {
    pushToast({ variant: 'error', title: 'Rapor indirilemedi', description: err?.message || 'Bilinmeyen hata' })
  } finally {
    downloadingReport.value = null
  }
}

const downloadProformaFile = async (id: string) => {
  downloadingProforma.value = id
  try {
    const blob = await downloadProforma(id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proforma-${id}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
    pushToast({ variant: 'success', title: 'Proforma indirildi', duration: 4000 })
  } catch (err: any) {
    pushToast({ variant: 'error', title: 'Proforma indirilemedi', description: err?.message || 'Bilinmeyen hata' })
  } finally {
    downloadingProforma.value = null
  }
}
</script>

<template>
  <div v-if="isAuthenticated">
    <!-- Hero -->
    <section class="bg-gradient-to-b from-primary-950 to-primary-900 text-white pt-12 pb-24">
      <div class="container-x">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p class="eyebrow text-accent-400">{{ isDealerRole ? 'Bayi Paneli' : 'Hesabım' }}</p>
            <h1 class="mt-2 font-display text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Hoşgeldiniz, {{ isDealerRole ? (dealer?.companyName || currentUser?.name) : currentUser?.name }}
            </h1>
            <p v-if="isDealerRole" class="mt-2 text-ink-300 max-w-xl text-sm">
              {{ dealer?.city || (currentUser as any)?.city || 'Bilinmiyor' }} lokasyonu —
              <span class="text-accent-400 font-semibold">+{{ dealer?.logisticsSurcharge ?? 40 }} TL</span>
              lojistik bedeli uygulanmaktadır.
            </p>
            <p v-else class="mt-2 text-ink-300 max-w-xl text-sm">
              Siparişlerinizi ve favorilerinizi buradan takip edebilirsiniz.
            </p>
          </div>
          <div class="flex gap-3">
            <NuxtLink to="/urunler" class="btn-accent inline-flex items-center gap-2">
              <Icon name="lucide:plus" class="h-4 w-4" />
              Yeni Sipariş
            </NuxtLink>
            <NuxtLink to="/hesabim" class="btn border border-white/20 text-white hover:bg-white/10 inline-flex items-center gap-2">
              <Icon name="lucide:settings" class="h-4 w-4" />
              Ayarlar
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- KPI Cards -->
    <section class="-mt-16 pb-8">
      <!-- Dealer KPIs -->
      <div v-if="isDealerRole" class="container-x grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="rounded-xl bg-white border border-ink-100 p-5 shadow-card">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Cari Bakiye</p>
            <Icon name="lucide:wallet" class="h-5 w-5 text-accent-500" />
          </div>
          <p class="mt-2 font-display text-xl md:text-2xl font-extrabold text-primary-950">
            {{ formatTL(dashboard.cariBalance) }} <span class="text-sm text-ink-500 font-medium">TL</span>
          </p>
          <p class="mt-0.5 text-xs text-ink-500">
            Limit: {{ formatTL(dashboard.creditLimit) }} TL
          </p>
        </div>
        <div class="rounded-xl bg-white border border-ink-100 p-5 shadow-card">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Onay Bekleyen</p>
            <Icon name="lucide:clock" class="h-5 w-5 text-amber-500" />
          </div>
          <p class="mt-2 font-display text-xl md:text-2xl font-extrabold text-primary-950">
            {{ dashboard.pendingOrders }}
          </p>
          <p class="mt-0.5 text-xs text-ink-500">sipariş onayda</p>
        </div>
        <div class="rounded-xl bg-white border border-ink-100 p-5 shadow-card">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Bu Ay İşlem</p>
            <Icon name="lucide:package" class="h-5 w-5 text-primary-700" />
          </div>
          <p class="mt-2 font-display text-xl md:text-2xl font-extrabold text-primary-950">
            {{ dashboard.monthlyOrderCount }}
          </p>
          <p class="mt-0.5 text-xs text-ink-500">adet işlem</p>
        </div>
        <div class="rounded-xl bg-white border border-ink-100 p-5 shadow-card">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Aylık Hacim</p>
            <Icon name="lucide:trending-up" class="h-5 w-5 text-emerald-500" />
          </div>
          <p class="mt-2 font-display text-xl md:text-2xl font-extrabold text-primary-950">
            {{ formatTL(dashboard.monthlyOrderTotal) }} <span class="text-sm text-ink-500 font-medium">TL</span>
          </p>
        </div>
      </div>
      <!-- Customer KPIs -->
      <div v-else class="container-x grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div class="rounded-xl bg-white border border-ink-100 p-5 shadow-card">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Siparişlerim</p>
            <Icon name="lucide:package" class="h-5 w-5 text-primary-700" />
          </div>
          <p class="mt-2 font-display text-xl md:text-2xl font-extrabold text-primary-950">—</p>
          <NuxtLink to="/siparislerim" class="mt-1 text-xs text-accent-600 hover:text-accent-700 font-semibold inline-block">
            Tümünü gör →
          </NuxtLink>
        </div>
        <div class="rounded-xl bg-white border border-ink-100 p-5 shadow-card">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Favorilerim</p>
            <Icon name="lucide:heart" class="h-5 w-5 text-red-500" />
          </div>
          <p class="mt-2 font-display text-xl md:text-2xl font-extrabold text-primary-950">—</p>
          <NuxtLink to="/favori-urunler" class="mt-1 text-xs text-accent-600 hover:text-accent-700 font-semibold inline-block">
            Tümünü gör →
          </NuxtLink>
        </div>
        <div class="rounded-xl bg-white border border-ink-100 p-5 shadow-card">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Sepetim</p>
            <Icon name="lucide:shopping-cart" class="h-5 w-5 text-accent-500" />
          </div>
          <p class="mt-2 font-display text-xl md:text-2xl font-extrabold text-primary-950">—</p>
          <NuxtLink to="/sepet" class="mt-1 text-xs text-accent-600 hover:text-accent-700 font-semibold inline-block">
            Sepete git →
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Tab Bar -->
    <div class="border-b border-ink-200 bg-white sticky top-0 z-10">
      <div class="container-x">
        <div class="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0 scrollbar-hide">
          <div class="flex gap-0 min-w-max lg:min-w-0">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              @click="activeTab = tab.id"
              class="flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-[1px]"
              :class="activeTab === tab.id
                ? 'text-accent-700 border-accent-500 bg-accent-50/50'
                : 'text-ink-500 border-transparent hover:text-primary-900 hover:border-ink-300'"
            >
              <Icon :name="tab.icon" class="h-4 w-4 shrink-0" />
              {{ tab.label }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Content -->
    <section class="py-10">
      <div class="container-x">
        <!-- Error Banner -->
        <div v-if="error" class="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl">
          <div class="flex gap-3">
            <Icon name="lucide:alert-circle" class="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-semibold text-red-900">Veri yükleme hatası</p>
              <p class="text-sm text-red-800 mt-1">{{ error }}</p>
              <button @click="loadDashboard" class="mt-3 text-sm font-semibold text-red-700 hover:text-red-800 underline">
                Tekrar dene
              </button>
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex items-center justify-center py-20">
          <div class="flex flex-col items-center gap-3">
            <Icon name="lucide:loader" class="h-8 w-8 text-accent-500 animate-spin" />
            <p class="text-sm text-ink-500">Veriler yükleniyor...</p>
          </div>
        </div>

        <template v-else>
          <!-- DEALER: Tab 1: İşlemler -->
          <div v-if="isDealerRole && activeTab === 'cari'" class="animate-fade-up">
            <div v-if="cariHistory.length === 0" class="text-center py-16">
              <Icon name="lucide:inbox" class="h-12 w-12 text-ink-300 mx-auto mb-4" />
              <p class="text-ink-500 font-medium">Henüz işlem bulunmuyor</p>
              <NuxtLink to="/urunler" class="mt-3 inline-block text-sm text-accent-600 hover:text-accent-700 font-semibold">
                Sipariş vermeye başlayın →
              </NuxtLink>
            </div>
            <div v-else class="overflow-hidden rounded-xl border border-ink-100 bg-white">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-600">
                    <tr>
                      <th class="px-5 py-3 font-semibold">Tarih</th>
                      <th class="px-5 py-3 font-semibold">İşlem Türü</th>
                      <th class="px-5 py-3 font-semibold">Açıklama</th>
                      <th class="px-5 py-3 font-semibold text-right">Tutar</th>
                      <th class="px-5 py-3 font-semibold text-right">Bakiye</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-ink-100">
                    <tr v-for="t in cariHistory" :key="t.id" class="hover:bg-ink-50/60">
                      <td class="px-5 py-3 text-ink-600 text-xs whitespace-nowrap">{{ formatDate(new Date(t.date)) }}</td>
                      <td class="px-5 py-3">
                        <span class="inline-flex px-2 py-0.5 rounded-md border text-[11px] font-semibold" :class="t.type === 'debit' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'">
                          {{ t.type === 'debit' ? 'Alış' : 'Ödeme' }}
                        </span>
                      </td>
                      <td class="px-5 py-3 text-ink-600 text-xs max-w-[200px] truncate">{{ t.description || '—' }}</td>
                      <td class="px-5 py-3 text-right font-semibold text-xs whitespace-nowrap" :class="t.type === 'debit' ? 'text-red-600' : 'text-emerald-600'">
                        {{ t.type === 'debit' ? '-' : '+' }}{{ formatCurrency(t.amount) }}
                      </td>
                      <td class="px-5 py-3 text-right font-semibold text-ink-900 text-xs whitespace-nowrap">{{ formatCurrency(t.balance) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- DEALER: Tab 2: Raporlar -->
          <div v-if="isDealerRole && activeTab === 'raporlar'" class="animate-fade-up">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div v-for="r in [
                { id: 'monthly' as const, title: 'Aylık Rapor', desc: 'Bu ayın gelir/gider detayları', icon: 'lucide:calendar' },
                { id: 'yearly' as const, title: 'Yıllık Rapor', desc: 'Yıl boyunca tüm işlemleriniz', icon: 'lucide:bar-chart-3' },
                { id: 'invoice' as const, title: 'Fatura Raporu', desc: 'Tüm faturalarınızın dökümü', icon: 'lucide:file-text' },
                { id: 'stock' as const, title: 'Stok & Fiyat', desc: 'Güncel stok ve fiyat listesi', icon: 'lucide:package' },
                { id: 'detailed' as const, title: 'Detaylı Rapor', desc: 'Ürün bazlı tüm sipariş dökümü', icon: 'lucide:list' },
              ]" :key="r.id" class="rounded-xl bg-white border border-ink-100 p-5 shadow-card hover:shadow-elevated transition-shadow">
                <div class="flex items-center gap-3 mb-3">
                  <div class="h-10 w-10 rounded-lg bg-accent-50 flex items-center justify-center">
                    <Icon :name="r.icon" class="h-5 w-5 text-accent-600" />
                  </div>
                  <div>
                    <h3 class="font-semibold text-primary-900">{{ r.title }}</h3>
                    <p class="text-xs text-ink-500">{{ r.desc }}</p>
                  </div>
                </div>
                <button
                  @click="downloadReport(r.id)"
                  :disabled="downloadingReport !== null"
                  class="mt-1 w-full btn-accent text-xs"
                >
                  <Icon :name="downloadingReport === r.id ? 'lucide:loader' : 'lucide:download'" :class="[downloadingReport === r.id ? 'animate-spin' : '', 'h-4 w-4']" />
                  {{ downloadingReport === r.id ? 'İndiriliyor...' : 'İndir (CSV)' }}
                </button>
              </div>
            </div>
          </div>

          <!-- DEALER: Tab 3: Proformalar -->
          <div v-if="isDealerRole && activeTab === 'proformalar'" class="animate-fade-up">
            <div v-if="proformas.length === 0" class="text-center py-16">
              <Icon name="lucide:file-text" class="h-12 w-12 text-ink-300 mx-auto mb-4" />
              <p class="text-ink-500 font-medium">Henüz proforma bulunmuyor</p>
              <p class="text-xs text-ink-400 mt-1">Size gönderilen proformalar burada listelenecektir.</p>
            </div>
            <div v-else class="overflow-hidden rounded-xl border border-ink-100 bg-white">
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead class="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-600">
                    <tr>
                      <th class="px-5 py-3 font-semibold">Proforma No</th>
                      <th class="px-5 py-3 font-semibold">Tarih</th>
                      <th class="px-5 py-3 font-semibold text-right">Tutar</th>
                      <th class="px-5 py-3 font-semibold">Durum</th>
                      <th class="px-5 py-3 font-semibold text-center">İşlem</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-ink-100">
                    <tr v-for="p in proformas" :key="p.id" class="hover:bg-ink-50/60">
                      <td class="px-5 py-3 font-mono text-xs font-semibold text-primary-900">{{ p.proformaNumber }}</td>
                      <td class="px-5 py-3 text-ink-600 text-xs whitespace-nowrap">{{ formatDate(new Date(p.generatedAt)) }}</td>
                      <td class="px-5 py-3 text-right font-semibold text-ink-900 text-xs whitespace-nowrap">{{ formatCurrency(Number(p.totalAmount)) }}</td>
                      <td class="px-5 py-3">
                        <span class="inline-flex px-2 py-0.5 rounded-md border text-[11px] font-semibold" :class="proformaStatusClass(p.status)">
                          {{ proformaStatusLabel(p.status) }}
                        </span>
                      </td>
                      <td class="px-5 py-3 text-center">
                        <button
                          @click="downloadProformaFile(p.id)"
                          :disabled="downloadingProforma === p.id"
                          class="inline-flex items-center gap-1.5 text-accent-600 hover:text-accent-700 font-semibold text-xs transition-colors disabled:opacity-50"
                        >
                          <Icon :name="downloadingProforma === p.id ? 'lucide:loader' : 'lucide:download'" :class="[downloadingProforma === p.id ? 'animate-spin' : '', 'h-3.5 w-3.5']" />
                          {{ downloadingProforma === p.id ? 'İndiriliyor...' : 'PDF İndir' }}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- CUSTOMER: Tab 1: Siparişlerim -->
          <div v-if="!isDealerRole && activeTab === 'siparisler'" class="animate-fade-up">
            <div class="text-center py-16">
              <Icon name="lucide:package" class="h-12 w-12 text-ink-300 mx-auto mb-4" />
              <p class="text-ink-500 font-medium">Henüz siparişiniz bulunmuyor</p>
              <NuxtLink to="/urunler" class="mt-3 inline-block text-sm text-accent-600 hover:text-accent-700 font-semibold">
                Ürünlere göz atın →
              </NuxtLink>
            </div>
          </div>

          <!-- CUSTOMER: Tab 2: Favorilerim -->
          <div v-if="!isDealerRole && activeTab === 'favoriler'" class="animate-fade-up">
            <div class="text-center py-16">
              <Icon name="lucide:heart" class="h-12 w-12 text-ink-300 mx-auto mb-4" />
              <p class="text-ink-500 font-medium">Henüz favori ürününüz bulunmuyor</p>
              <NuxtLink to="/urunler" class="mt-3 inline-block text-sm text-accent-600 hover:text-accent-700 font-semibold">
                Ürünleri keşfedin →
              </NuxtLink>
            </div>
          </div>

          <!-- SHARED: Bilgilerim (both roles) -->
          <div v-if="activeTab === 'bilgiler'" class="animate-fade-up">
            <div class="max-w-2xl">
              <div class="rounded-xl bg-white border border-ink-100 p-8 shadow-card">
                <div v-if="isDealerRole" class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Bayi Adı</p>
                    <p class="text-lg font-semibold text-primary-900">{{ dealerInfo?.name || dealer?.companyName || currentUser?.name || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Şirket</p>
                    <p class="text-lg font-semibold text-primary-900">{{ dealerInfo?.company || dealer?.companyName || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Cari Hesap No</p>
                    <p class="text-lg font-semibold text-primary-900 font-mono">{{ dealerInfo?.id?.slice(0, 12) || dealer?.code || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Telefon</p>
                    <p class="text-lg font-semibold text-primary-900">{{ dealerInfo?.phone || (currentUser as any)?.phone || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Şehir</p>
                    <p class="text-lg font-semibold text-primary-900">{{ dealerInfo?.city || dealer?.city || (currentUser as any)?.city || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Bölge</p>
                    <p class="text-lg font-semibold text-primary-900">{{ dealerInfo?.region || (currentUser as any)?.region || '—' }}</p>
                  </div>
                </div>
                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Ad Soyad</p>
                    <p class="text-lg font-semibold text-primary-900">{{ currentUser?.name || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">E-posta</p>
                    <p class="text-lg font-semibold text-primary-900">{{ currentUser?.email || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Telefon</p>
                    <p class="text-lg font-semibold text-primary-900">{{ (currentUser as any)?.phone || '—' }}</p>
                  </div>
                  <div>
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Rol</p>
                    <p class="text-lg font-semibold text-primary-900">{{ currentUser?.role === 'DEALER' ? 'Bayi' : 'Müşteri' }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="py-16 md:py-20 bg-ink-50">
      <div class="container-x">
        <div class="flex items-end justify-between gap-6 flex-wrap">
          <div class="max-w-2xl">
            <p class="eyebrow">{{ isDealerRole ? 'Bayi Fiyatlandırması' : 'Öne Çıkan Ürünler' }}</p>
            <h2 class="mt-3 heading-lg">{{ isDealerRole ? 'Lokasyonunuza özel fiyatlar' : 'En çok tercih edilenler' }}</h2>
            <p v-if="isDealerRole" class="mt-4 lead">
              Aşağıdaki fiyatlar {{ dealer?.city || (currentUser as any)?.city || 'bulunduğunuz' }} lokasyonu için
              <span class="font-semibold text-accent-700">+{{ dealer?.logisticsSurcharge ?? 40 }} TL lojistik bedeli</span>
              eklenmiş haldedir.
            </p>
          </div>
          <NuxtLink to="/urunler" class="btn-ghost text-primary-900">
            Tüm Katalog
            <Icon name="lucide:arrow-right" class="h-4 w-4" />
          </NuxtLink>
        </div>

        <div class="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <ProductCard v-for="p in featuredItems" :key="p.id" :product="p" />
        </div>
      </div>
    </section>
  </div>
</template>
