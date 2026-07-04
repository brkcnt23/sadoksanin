<script setup lang="ts">
import { formatPrice, formatRelative } from '~/utils/storage'
import type { Dealer, DealerStatus } from '~/types'
import DealerCreateModal from '~/components/DealerCreateModal.vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Bayiler | Sadöksan Admin',
})

const dealers = useDealersStore()
const auth = useAdminAuth()
const api = useApi()
const toast = useToast()
const showCreateModal = ref(false)
const showTestCreateModal = ref(false)
const editingCredit = ref<{ id: string; value: number } | null>(null)

onMounted(() => {
  if (!dealers.loaded) dealers.load()
  loadCarts()
})

// ── Bayi Sepetleri (aktif/terkedilen) ──────────────────────────────────────
interface DealerCart {
  dealerId: string
  dealerName: string
  city: string
  itemCount: number
  totalValue: number
  lastUpdatedAt: string
  daysSinceUpdate: number
  isAbandoned: boolean
  items: { productName: string; sku: string; quantity: number }[]
}
const dealerCarts = ref<DealerCart[]>([])
const loadingCarts = ref(true)
const cartsExpanded = ref(false)
const loadCarts = async () => {
  loadingCarts.value = true
  try {
    dealerCarts.value = await api.get<DealerCart[]>('/dealer/carts')
  } catch (e) {
    console.warn('Sepetler yüklenemedi:', e)
  } finally {
    loadingCarts.value = false
  }
}
const cartAgeLabel = (d: DealerCart) => {
  if (d.daysSinceUpdate < 1) return { label: 'Bugün', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
  if (d.daysSinceUpdate <= 3) return { label: `${d.daysSinceUpdate} gün önce`, color: 'text-amber-700 bg-amber-50 border-amber-200' }
  return { label: `${d.daysSinceUpdate} gün — Terkedilmiş`, color: 'text-red-700 bg-red-50 border-red-200' }
}

const detail = ref<Dealer | null>(null)
const cariCheck = ref<{ loading: boolean; result: { valid: boolean; reason?: string; balance?: number } | null }>({
  loading: false,
  result: null,
})

const validateCari = async (d: Dealer) => {
  cariCheck.value = { loading: true, result: null }
  const result = await dealers.validateCari(d.cariNo)
  cariCheck.value = { loading: false, result }
  if (result.valid) {
    dealers.update(d.id, { cariValidated: true })
  }
}

const approve = (d: Dealer) => {
  const u = auth.getUser()
  if (!u) return
  if (!d.cariValidated) {
    if (!confirm('Cari hesap doğrulanmadı. Yine de onaylansın mı?')) return
  }
  dealers.approve(d.id, u.id)
  detail.value = null
}

const reject = (d: Dealer) => {
  const u = auth.getUser()
  if (!u) return
  const reason = prompt('Red sebebi:')
  if (!reason) return
  dealers.reject(d.id, u.id, reason)
  detail.value = null
}

const setStatus = (d: Dealer, s: DealerStatus) => {
  if (!confirm(`Durum "${s}" olarak değiştirilsin mi?`)) return
  dealers.setStatus(d.id, s)
}

async function saveCreditLimit() {
  if (!editingCredit.value) return
  try {
    await api.patch(`/dealer/${editingCredit.value.id}/credit-limit`, {
      creditLimit: editingCredit.value.value,
    })
    toast.push('Kredi limiti güncellendi', 'success')
    await dealers.load()
    editingCredit.value = null
  } catch (err: any) {
    toast.push(err?.message || 'Güncelleme başarısız', 'error')
  }
}

const statusBadge = (s: DealerStatus) => {
  const m: Record<DealerStatus, { variant: 'success' | 'warning' | 'danger' | 'neutral' | 'info'; label: string }> = {
    active: { variant: 'success', label: 'Aktif' },
    pending: { variant: 'warning', label: 'Onay Bekliyor' },
    inactive: { variant: 'neutral', label: 'Pasif' },
    rejected: { variant: 'danger', label: 'Reddedildi' },
  }
  return m[s]
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="Bayiler"
      :description="`${dealers.items.length} bayi — ${dealers.activeCount} aktif, ${dealers.pendingCount} onay bekliyor`"
    >
      <template #actions>
        <div class="flex gap-2">
          <button
            @click="showTestCreateModal = true"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="lucide:flask-conical" class="w-4 h-4" />
            Test Bayi
          </button>
          <button
            @click="showCreateModal = true"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="lucide:building-2" class="w-4 h-4" />
            Yeni Bayi
          </button>
        </div>
      </template>
    </PageHeader>

    <!-- Bayi Sepetleri (Aktif / Terkedilen) -->
    <div class="bg-white rounded-xl border border-ink-200">
      <button
        @click="cartsExpanded = !cartsExpanded"
        class="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div class="flex items-center gap-2">
          <Icon name="lucide:shopping-cart" class="w-4 h-4 text-ink-500" />
          <h3 class="font-semibold text-ink-900">Bayi Sepetleri</h3>
          <span class="text-xs text-ink-500">({{ dealerCarts.length }} dolu sepet{{ dealerCarts.filter(d => d.isAbandoned).length ? `, ${dealerCarts.filter(d => d.isAbandoned).length} terkedilmiş` : '' }})</span>
        </div>
        <Icon :name="cartsExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="w-4 h-4 text-ink-400" />
      </button>
      <div v-if="cartsExpanded" class="border-t border-ink-100">
        <div v-if="loadingCarts" class="p-5 text-sm text-ink-500">Yükleniyor...</div>
        <EmptyState v-else-if="dealerCarts.length === 0" icon="lucide:shopping-cart" title="Dolu sepet yok" />
        <div v-else class="divide-y divide-ink-100">
          <div v-for="d in dealerCarts" :key="d.dealerId" class="px-5 py-3 flex items-center justify-between gap-3">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-sm text-ink-900">{{ d.dealerName }} <span class="text-ink-400 font-normal">· {{ d.city }}</span></p>
              <p class="text-xs text-ink-500">{{ d.itemCount }} adet ürün · {{ formatPrice(d.totalValue) }}</p>
            </div>
            <span :class="['inline-flex px-2.5 py-1 rounded-full text-xs font-medium border shrink-0', cartAgeLabel(d).color]">
              {{ cartAgeLabel(d).label }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-ink-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="relative">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input
            :value="dealers.search"
            @input="dealers.setSearch(($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="Bayi adı, cari, vergi no, e-posta..."
            class="w-full pl-9 pr-3 py-2 border border-ink-300 rounded-md text-sm"
          />
        </div>
        <select
          :value="dealers.filter.status"
          @change="dealers.setFilter('status', ($event.target as HTMLSelectElement).value as 'all' | DealerStatus)"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="active">Aktif</option>
          <option value="pending">Onay Bekliyor</option>
          <option value="inactive">Pasif</option>
          <option value="rejected">Reddedildi</option>
        </select>
        <select
          :value="dealers.filter.region ?? ''"
          @change="dealers.setFilter('region', ($event.target as HTMLSelectElement).value || null)"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="">Tüm Bölgeler</option>
          <option v-for="r in dealers.regions" :key="r" :value="r" class="capitalize">{{ r }}</option>
        </select>
        <select
          :value="dealers.filter.city ?? ''"
          @change="dealers.setFilter('city', ($event.target as HTMLSelectElement).value || null)"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="">Tüm Şehirler</option>
          <option v-for="c in dealers.cities" :key="c" :value="c">{{ c }}</option>
        </select>
      </div>
    </div>

    <!-- Grid -->
    <div v-if="dealers.filtered.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="d in dealers.filtered"
        :key="d.id"
        class="bg-white rounded-xl border border-ink-200 p-5 hover:shadow-sm transition-shadow flex flex-col"
      >
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="min-w-0 flex-1">
            <h3 class="font-semibold text-ink-900 truncate">{{ d.name }}</h3>
            <p class="text-xs text-ink-500 mt-0.5">{{ d.contactPerson }} · {{ d.city }}</p>
          </div>
          <div class="flex items-center gap-2">
            <span :class="['px-2 py-0.5 rounded text-xs font-bold',
              d.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' :
              d.riskLevel === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
              'bg-green-100 text-green-700']">
              {{ d.riskScore || 0 }}
            </span>
            <StatusBadge v-bind="statusBadge(d.status)" />
          </div>
        </div>

        <div class="space-y-1.5 mb-4 pb-4 border-b border-ink-100 text-sm">
          <div class="flex justify-between">
            <span class="text-ink-500">Cari</span>
            <span class="font-mono text-ink-700 flex items-center gap-1">
              {{ d.cariNo }}
              <Icon
                v-if="d.cariValidated"
                name="lucide:check-circle"
                class="w-3.5 h-3.5 text-emerald-600"
                title="Doğrulanmış"
              />
              <Icon
                v-else
                name="lucide:alert-circle"
                class="w-3.5 h-3.5 text-amber-500"
                title="Doğrulanmamış"
              />
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-500">Bakiye</span>
            <span :class="['font-medium', d.cariBalance < 0 ? 'text-red-600' : 'text-emerald-600']">
              {{ formatPrice(d.cariBalance) }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-500">Kredi Limiti</span>
            <span class="font-medium text-ink-700">{{ formatPrice(d.creditLimit) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-ink-500">Sipariş / Ciro</span>
            <span class="font-medium text-ink-700">{{ d.totalOrders }} / {{ formatPrice(d.totalRevenue) }}</span>
          </div>
        </div>

        <div class="flex gap-2 mt-auto">
          <button
            @click="detail = d; cariCheck = { loading: false, result: null }"
            class="flex-1 px-3 py-1.5 text-xs font-medium text-ink-700 bg-ink-100 hover:bg-ink-200 rounded-md"
          >
            Detay
          </button>
          <button
            v-if="d.status === 'pending'"
            @click="approve(d)"
            class="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
          >
            Onayla
          </button>
        </div>
      </div>
    </div>
    <EmptyState v-else icon="lucide:users" title="Bayi bulunamadı" />

    <!-- Detail modal -->
    <Modal
      :open="detail !== null"
      :title="`Bayi Detayı — ${detail?.name}`"
      size="lg"
      @close="detail = null"
    >
      <div v-if="detail" class="p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-ink-500 uppercase tracking-wider">İletişim</p>
            <p class="font-medium text-ink-900 mt-0.5">{{ detail.contactPerson }}</p>
            <p class="text-xs text-ink-500">{{ detail.email }} · {{ detail.phone }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500 uppercase tracking-wider">Vergi</p>
            <p class="font-mono text-sm text-ink-900 mt-0.5">{{ detail.taxNo }}</p>
            <p class="text-xs text-ink-500">{{ detail.taxOffice }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500 uppercase tracking-wider">Adres</p>
            <p class="text-sm text-ink-900 mt-0.5">{{ detail.address }}</p>
            <p class="text-xs text-ink-500 capitalize">{{ detail.city }} · {{ detail.region }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500 uppercase tracking-wider">Cari Hesap</p>
            <p class="font-mono text-sm text-ink-900 mt-0.5">{{ detail.cariNo }}</p>
            <button
              @click="validateCari(detail)"
              :disabled="cariCheck.loading"
              class="text-xs text-primary-600 hover:text-primary-700 font-medium mt-1 flex items-center gap-1 disabled:opacity-50"
            >
              <Icon
                :name="cariCheck.loading ? 'lucide:loader-2' : 'lucide:check-circle'"
                :class="['w-3.5 h-3.5', cariCheck.loading && 'animate-spin']"
              />
              Netsis ile Doğrula
            </button>
            <p
              v-if="cariCheck.result"
              :class="['text-xs mt-1', cariCheck.result.valid ? 'text-emerald-600' : 'text-red-600']"
            >
              {{ cariCheck.result.valid ? '✓ Geçerli cari hesap' : `✗ ${cariCheck.result.reason}` }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4 p-4 bg-ink-50 rounded-lg">
          <div>
            <p class="text-xs text-ink-500">Bakiye</p>
            <p :class="['font-bold text-lg', detail.cariBalance < 0 ? 'text-red-600' : 'text-emerald-600']">
              {{ formatPrice(detail.cariBalance) }}
            </p>
            <p class="text-xs text-ink-400 mt-0.5">{{ detail.cariBalance < 0 ? 'Borçlu' : 'Alacaklı' }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500">Kredi Limiti</p>
            <div v-if="editingCredit && editingCredit.id === detail.id" class="flex items-center gap-2 mt-1">
              <input
                v-model.number="editingCredit.value"
                type="number"
                min="0"
                step="1000"
                class="w-32 px-2 py-1 border border-ink-300 rounded text-sm font-mono"
                @keyup.enter="saveCreditLimit()"
              />
              <button @click="saveCreditLimit()" class="p-1 text-emerald-600 hover:text-emerald-700" title="Kaydet">
                <Icon name="lucide:check" class="w-4 h-4" />
              </button>
              <button @click="editingCredit = null" class="p-1 text-ink-400 hover:text-red-600" title="İptal">
                <Icon name="lucide:x" class="w-4 h-4" />
              </button>
            </div>
            <div v-else class="flex items-center gap-2">
              <p class="font-bold text-lg text-ink-900">{{ formatPrice(detail.creditLimit) }}</p>
              <button
                @click="editingCredit = { id: detail.id, value: detail.creditLimit }"
                class="p-0.5 text-ink-400 hover:text-blue-600 transition-colors"
                title="Düzenle"
              >
                <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div>
            <p class="text-xs text-ink-500">Toplam Ciro</p>
            <p class="font-bold text-lg text-ink-900">{{ formatPrice(detail.totalRevenue) }}</p>
            <p class="text-xs text-ink-400 mt-0.5">{{ detail.totalOrders }} sipariş</p>
          </div>
        </div>

        <div v-if="detail.lastOrderAt" class="text-xs text-ink-500">
          Son sipariş: {{ formatRelative(detail.lastOrderAt) }}
        </div>
        <div v-if="detail.rejectionReason" class="p-3 bg-red-50 border border-red-200 rounded-md">
          <p class="text-xs font-semibold text-red-900 mb-1">Red Sebebi</p>
          <p class="text-sm text-red-800">{{ detail.rejectionReason }}</p>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <div class="flex gap-2">
            <button
              v-if="detail && detail.status === 'active'"
              @click="detail && setStatus(detail, 'inactive')"
              class="px-3 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 rounded-md"
            >
              Pasifleştir
            </button>
            <button
              v-if="detail && detail.status === 'inactive'"
              @click="detail && setStatus(detail, 'active')"
              class="px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-md"
            >
              Aktifleştir
            </button>
          </div>
          <div class="flex gap-2">
            <button
              v-if="detail?.status === 'pending'"
              @click="detail && reject(detail)"
              class="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
            >
              Reddet
            </button>
            <button
              v-if="detail?.status === 'pending'"
              @click="detail && approve(detail)"
              class="px-3 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md"
            >
              Onayla
            </button>
            <button
              @click="detail = null"
              class="px-3 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 rounded-md"
            >
              Kapat
            </button>
          </div>
        </div>
      </template>
    </Modal>

    <!-- Create Dealer Modals -->
    <DealerCreateModal
      :open="showCreateModal"
      @close="showCreateModal = false"
    />
    <DealerCreateModal
      :open="showTestCreateModal"
      mode="test"
      @close="showTestCreateModal = false"
    />
  </div>
</template>
