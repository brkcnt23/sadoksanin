<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  title: 'Siparişlerim | SADÖKSAN',
  middleware: 'auth',
})

interface OrderLineItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
  product?: { id: string; name: string; brand: string; imageUrl?: string }
}

interface StatusHistoryEntry {
  id: string
  status: string
  note?: string
  actorEmail?: string
  createdAt: string
}

interface ApiOrder {
  id: string
  orderNo: string
  status: string
  customerType: string
  subtotal: number
  tax: number
  logisticsSurcharge: number
  total: number
  paymentMethod?: string
  paymentStatus?: string
  notes?: string
  trackingNumber?: string
  cargoCompany?: string
  lines: OrderLineItem[]
  createdAt: string
}

const api = useApi()
const { isAuthenticated } = useAuth()

const orders = ref<ApiOrder[]>([])
const loading = ref(true)
const selectedOrder = ref<ApiOrder | null>(null)
const orderHistory = ref<StatusHistoryEntry[]>([])
const loadingDetail = ref(false)

// Toast
const toastMsg = ref('')
const toastType = ref<'success' | 'error'>('success')
function showToast(msg: string, type: 'success' | 'error' = 'success') {
  toastMsg.value = msg
  toastType.value = type
  setTimeout(() => { toastMsg.value = '' }, 4000)
}

// İptal
const showCancelModal = ref(false)
const cancelReason = ref('')
const cancelling = ref(false)

// Havale bildirim
const showBankTransferModal = ref(false)
const bankTransferForm = ref({ bank: '', amount: 0, senderName: '', note: '' })
const submittingTransfer = ref(false)

async function loadOrders() {
  if (!isAuthenticated.value) { navigateTo('/giris'); return }
  loading.value = true
  try { orders.value = await api.get<ApiOrder[]>('/orders') } catch { orders.value = [] }
  loading.value = false
}

async function openOrderDetail(order: ApiOrder) {
  selectedOrder.value = order
  loadingDetail.value = true
  try {
    const [detail, history] = await Promise.all([
      api.get<ApiOrder>(`/orders/${order.id}`),
      api.get<StatusHistoryEntry[]>(`/orders/${order.id}/history`),
    ])
    selectedOrder.value = detail
    orderHistory.value = history || []
  } catch { orderHistory.value = [] }
  loadingDetail.value = false
}

const statusLabel = (s: string) => ({
  PENDING_APPROVAL: 'Onay Bekliyor', APPROVED: 'Onaylandı', PREPARING: 'Hazırlanıyor',
  READY_TO_SHIP: 'Kargoya Hazır', SHIPPED: 'Kargoda', DELIVERED: 'Teslim Edildi',
  COMPLETED: 'Tamamlandı', CANCELLED: 'İptal Edildi', REJECTED: 'Reddedildi',
} as Record<string, string>)[s] || s

const statusColor = (s: string) => ({
  PENDING_APPROVAL: 'bg-amber-50 text-amber-800 border-amber-200',
  APPROVED: 'bg-blue-50 text-blue-800 border-blue-200',
  PREPARING: 'bg-purple-50 text-purple-800 border-purple-200',
  READY_TO_SHIP: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  SHIPPED: 'bg-cyan-50 text-cyan-800 border-cyan-200',
  DELIVERED: 'bg-teal-50 text-teal-800 border-teal-200',
  COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  CANCELLED: 'bg-red-50 text-red-800 border-red-200',
  REJECTED: 'bg-red-50 text-red-800 border-red-200',
} as Record<string, string>)[s] || 'bg-ink-50 text-ink-700 border-ink-200'

const statusStepOrder = ['PENDING_APPROVAL', 'APPROVED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'COMPLETED']

const timelineSteps = computed(() => {
  const s = selectedOrder.value?.status || 'PENDING_APPROVAL'
  if (s === 'CANCELLED' || s === 'REJECTED') {
    const effective = s === 'CANCELLED' ? 'APPROVED' : 'PENDING_APPROVAL'
    return statusStepOrder.map(key => ({
      key, label: statusLabel(key),
      active: statusStepOrder.indexOf(key) <= statusStepOrder.indexOf(effective),
      current: false,
    }))
  }
  const curIdx = statusStepOrder.indexOf(s)
  return statusStepOrder.map(key => ({
    key, label: statusLabel(key),
    active: statusStepOrder.indexOf(key) <= curIdx,
    current: statusStepOrder.indexOf(key) === curIdx,
  }))
})

const canCancel = computed(() => ['PENDING_APPROVAL','APPROVED','PREPARING'].includes(selectedOrder.value?.status||''))
const canReturn = computed(() => ['COMPLETED','DELIVERED'].includes(selectedOrder.value?.status||''))
const canBankTransfer = computed(() => selectedOrder.value?.paymentMethod === 'BANK_TRANSFER' && selectedOrder.value?.paymentStatus !== 'PAID')

async function handleCancel() {
  if (!cancelReason.value.trim()) return
  cancelling.value = true
  try {
    await api.post(`/orders/${selectedOrder.value!.id}/cancel`, { reason: cancelReason.value })
    showToast('Sipariş iptal talebi iletildi.')
    showCancelModal.value = false; cancelReason.value = ''
    await loadOrders(); selectedOrder.value = null
  } catch (e: any) { showToast(e?.response?.data?.message || 'İptal edilemedi.', 'error') }
  cancelling.value = false
}

async function handleBankTransfer() {
  if (!bankTransferForm.value.bank || !bankTransferForm.value.amount) return
  submittingTransfer.value = true
  try {
    await api.post(`/orders/${selectedOrder.value!.id}/bank-transfer`, bankTransferForm.value)
    showToast('Havale bildirimi iletildi. Onay bekleniyor.')
    showBankTransferModal.value = false
  } catch (e: any) { showToast(e?.response?.data?.message || 'Hata oluştu.', 'error') }
  submittingTransfer.value = false
}

const fp = (p: number) => `₺${p.toLocaleString('tr-TR')}`
const fd = (d: string) => new Date(d).toLocaleDateString('tr-TR')
const fdt = (d: string) => new Date(d).toLocaleString('tr-TR', { day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit' })

onMounted(loadOrders)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 lg:py-16">
    <div class="px-6 lg:px-12 mx-auto max-w-4xl">
      <!-- Toast -->
      <div v-if="toastMsg" :class="['fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-white font-medium', toastType === 'success' ? 'bg-emerald-600' : 'bg-red-600']">
        {{ toastMsg }}
      </div>

      <div class="mb-12">
        <h1 class="text-4xl font-bold text-primary-900 mb-2">Siparişlerim</h1>
        <p class="text-ink-600">Geçmiş ve aktif siparişlerinizi görüntüleyin</p>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Sidebar -->
        <aside class="lg:col-span-1">
          <nav class="space-y-2">
            <NuxtLink to="/bayi" class="block px-4 py-3 rounded-lg text-primary-900 hover:bg-ink-50 transition-colors">
              <Icon name="lucide:user" class="inline h-4 w-4 mr-2" />Profil Bilgileri
            </NuxtLink>
            <NuxtLink to="/siparislerim" class="block px-4 py-3 rounded-lg bg-accent-100 text-accent-700 font-medium border border-accent-200">
              <Icon name="lucide:package" class="inline h-4 w-4 mr-2" />Siparişlerim
            </NuxtLink>
            <NuxtLink to="/favori-urunler" class="block px-4 py-3 rounded-lg text-primary-900 hover:bg-ink-50 transition-colors">
              <Icon name="lucide:heart" class="inline h-4 w-4 mr-2" />Favori Ürünler
            </NuxtLink>
          </nav>
        </aside>

        <!-- Orders -->
        <div class="lg:col-span-2">
          <div v-if="loading" class="text-center py-12 text-ink-400">
            <Icon name="lucide:loader-2" class="h-8 w-8 mx-auto animate-spin mb-2" />Yükleniyor...
          </div>

          <div v-else-if="orders.length > 0" class="space-y-4">
            <div v-for="order in orders" :key="order.id" class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer" @click="openOrderDetail(order)">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="font-semibold text-primary-900">{{ order.orderNo }}</h3>
                  <p class="text-sm text-ink-500 mt-1">{{ fd(order.createdAt) }}</p>
                </div>
                <span :class="['inline-flex px-3 py-1 rounded-full text-xs font-semibold border', statusColor(order.status)]">
                  {{ statusLabel(order.status) }}
                </span>
              </div>
              <div class="border-t border-ink-100 pt-4 flex justify-between items-end">
                <div>
                  <p class="text-sm text-ink-600">{{ order.lines?.length ?? 0 }} ürün</p>
                  <p v-if="order.paymentMethod" class="text-xs text-ink-500 mt-1">
                    {{ order.paymentMethod === 'CREDIT_CARD' ? '💳 Kredi Kartı' : order.paymentMethod === 'BANK_TRANSFER' ? '🏦 Havale' : '' }}
                  </p>
                </div>
                <p class="text-lg font-bold text-primary-900">{{ fp(order.total) }}</p>
              </div>
            </div>
          </div>

          <div v-else class="bg-white rounded-xl shadow-md p-12 text-center">
            <Icon name="lucide:inbox" class="h-16 w-16 text-ink-300 mx-auto mb-4" />
            <h3 class="text-xl font-bold text-primary-900 mb-2">Sipariş bulunamadı</h3>
            <p class="text-ink-600 mb-6">Henüz bir sipariş vermemişsiniz.</p>
            <NuxtLink to="/urunler" class="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors">
              <Icon name="lucide:shopping-cart" class="h-4 w-4" />Ürünleri Keşfet
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- ORDER DETAIL MODAL -->
      <div v-if="selectedOrder" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50" @click="selectedOrder = null">
        <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto" @click.stop>
          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-ink-100 p-6 flex items-center justify-between z-10">
            <div>
              <h2 class="text-2xl font-bold text-primary-900">{{ selectedOrder.orderNo }}</h2>
              <p class="text-sm text-ink-500">{{ fd(selectedOrder.createdAt) }}</p>
            </div>
            <button @click="selectedOrder = null" class="text-ink-500 hover:text-ink-700 p-1"><Icon name="lucide:x" class="h-6 w-6" /></button>
          </div>

          <div class="p-6 space-y-6">
            <!-- STATUS TIMELINE -->
            <div>
              <h3 class="font-semibold text-primary-900 mb-4">Sipariş Durumu</h3>
              <div class="flex items-center justify-between">
                <div v-for="(step, i) in timelineSteps" :key="step.key" class="flex-1 flex flex-col items-center relative">
                  <!-- Connector line -->
                  <div v-if="i > 0" class="absolute right-1/2 top-4 w-full h-0.5 -translate-y-1/2" :class="step.active ? 'bg-accent-500' : 'bg-ink-200'" />
                  <!-- Circle -->
                  <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold relative z-10 border-2', step.current ? 'bg-accent-500 border-accent-600 text-white' : step.active ? 'bg-accent-100 border-accent-500 text-accent-700' : 'bg-ink-50 border-ink-200 text-ink-400']">
                    <Icon v-if="step.active && !step.current" name="lucide:check" class="h-4 w-4" />
                    <span v-else-if="step.current">{{ i + 1 }}</span>
                    <span v-else>{{ i + 1 }}</span>
                  </div>
                  <span :class="['text-[10px] mt-1 text-center leading-tight', step.current ? 'text-accent-700 font-semibold' : step.active ? 'text-ink-600' : 'text-ink-400']">
                    {{ step.label }}
                  </span>
                </div>
              </div>
            </div>

            <!-- STATÜ GEÇMİŞİ (history) -->
            <div v-if="orderHistory.length > 0" class="border-t border-ink-100 pt-4">
              <h3 class="font-semibold text-primary-900 mb-3">Durum Geçmişi</h3>
              <div class="space-y-2">
                <div v-for="h in orderHistory" :key="h.id" class="flex items-start gap-3 text-sm">
                  <div class="w-2 h-2 rounded-full bg-accent-500 mt-1.5 shrink-0" />
                  <div class="flex-1">
                    <p class="text-primary-900 font-medium">{{ statusLabel(h.status) }}</p>
                    <p class="text-ink-500 text-xs">{{ fdt(h.createdAt) }}<span v-if="h.note"> — {{ h.note }}</span><span v-if="h.actorEmail"> ({{ h.actorEmail }})</span></p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Order Meta -->
            <div class="grid sm:grid-cols-3 gap-4 border-t border-ink-100 pt-4">
              <div>
                <p class="text-xs text-ink-500">Tarih</p><p class="font-semibold text-primary-900 text-sm">{{ fd(selectedOrder.createdAt) }}</p>
              </div>
              <div>
                <p class="text-xs text-ink-500">Durum</p>
                <span :class="['inline-flex px-2 py-0.5 rounded-full text-xs font-semibold border', statusColor(selectedOrder.status)]">{{ statusLabel(selectedOrder.status) }}</span>
              </div>
              <div>
                <p class="text-xs text-ink-500">Ödeme</p>
                <p class="font-semibold text-primary-900 text-sm">
                  {{ selectedOrder.paymentMethod === 'CREDIT_CARD' ? 'Kredi Kartı' : selectedOrder.paymentMethod === 'BANK_TRANSFER' ? 'Havale' : '—' }}
                  <span v-if="selectedOrder.paymentStatus" :class="['ml-1 text-xs', selectedOrder.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600']">
                    ({{ selectedOrder.paymentStatus === 'PAID' ? 'Ödendi' : 'Bekliyor' }})
                  </span>
                </p>
              </div>
            </div>

            <!-- Kargo Takip -->
            <div v-if="selectedOrder.trackingNumber" class="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <p class="text-sm font-semibold text-cyan-900 mb-1">🚚 Kargo Takip</p>
              <p class="text-sm text-cyan-800">{{ selectedOrder.cargoCompany || 'Kargo' }} — <span class="font-mono font-semibold">{{ selectedOrder.trackingNumber }}</span></p>
            </div>

            <!-- Order Lines -->
            <div class="border-t border-ink-100 pt-4">
              <h3 class="font-semibold text-primary-900 mb-4">Sipariş Kalemleri</h3>
              <div class="space-y-3">
                <div v-for="line in selectedOrder.lines" :key="line.id" class="flex items-center justify-between pb-3 border-b border-ink-100">
                  <div>
                    <p class="font-medium text-primary-900">{{ line.product?.name ?? line.productId }}</p>
                    <p class="text-sm text-ink-600">{{ line.quantity }} × {{ fp(line.unitPrice) }}</p>
                  </div>
                  <p class="font-semibold text-primary-900">{{ fp(line.total) }}</p>
                </div>
              </div>
            </div>

            <!-- Totals -->
            <div class="border-t border-ink-100 pt-4 space-y-1 text-sm">
              <div class="flex justify-between"><span class="text-ink-600">Ara Toplam</span><span class="text-primary-900">{{ fp(selectedOrder.subtotal) }}</span></div>
              <div v-if="selectedOrder.logisticsSurcharge" class="flex justify-between"><span class="text-ink-600">Kargo</span><span class="text-primary-900">{{ fp(selectedOrder.logisticsSurcharge) }}</span></div>
              <div v-if="selectedOrder.tax" class="flex justify-between"><span class="text-ink-600">KDV</span><span class="text-primary-900">{{ fp(selectedOrder.tax) }}</span></div>
              <div class="flex justify-between border-t border-ink-100 pt-2 mt-2"><span class="text-lg font-bold text-primary-900">Toplam</span><span class="text-2xl font-bold text-accent-600">{{ fp(selectedOrder.total) }}</span></div>
            </div>

            <!-- ACTIONS -->
            <div class="border-t border-ink-100 pt-4 flex gap-3 flex-wrap">
              <!-- Cancel -->
              <button v-if="canCancel" @click="showCancelModal = true" class="px-4 py-2.5 border border-red-200 text-red-700 hover:bg-red-50 font-medium rounded-lg transition-colors text-sm">
                <Icon name="lucide:x-circle" class="inline h-4 w-4 mr-1" />İptal Talebi
              </button>
              <!-- Bank Transfer -->
              <button v-if="canBankTransfer" @click="showBankTransferModal = true; bankTransferForm.amount = selectedOrder!.total" class="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors text-sm">
                <Icon name="lucide:banknote" class="inline h-4 w-4 mr-1" />Havale Bildirimi Yap
              </button>
              <!-- WhatsApp Support -->
              <a :href="`https://wa.me/905396541720?text=Merhaba, ${selectedOrder.orderNo} nolu siparişim hakkında bilgi almak istiyorum.`" target="_blank" rel="noopener" class="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition-colors text-sm">
                <Icon name="lucide:message-circle" class="inline h-4 w-4 mr-1" />WhatsApp Destek
              </a>
              <button @click="selectedOrder = null" class="px-4 py-2.5 border border-ink-200 text-primary-900 hover:bg-ink-50 font-medium rounded-lg transition-colors text-sm ml-auto">
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- CANCEL MODAL -->
      <div v-if="showCancelModal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
        <div class="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <h3 class="text-lg font-bold text-primary-900 mb-4">Sipariş İptal Talebi</h3>
          <p class="text-sm text-ink-600 mb-4">{{ selectedOrder?.orderNo }} nolu siparişi iptal etmek istediğinize emin misiniz?</p>
          <textarea v-model="cancelReason" placeholder="İptal sebebi (zorunlu)" rows="3" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent" />
          <div class="flex gap-3 justify-end">
            <button @click="showCancelModal = false; cancelReason = ''" class="px-4 py-2 border border-ink-200 text-primary-900 rounded-lg text-sm hover:bg-ink-50">Vazgeç</button>
            <button @click="handleCancel" :disabled="cancelling || !cancelReason.trim()" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {{ cancelling ? 'İptal ediliyor...' : 'İptal Talebi Gönder' }}
            </button>
          </div>
        </div>
      </div>

      <!-- BANK TRANSFER MODAL -->
      <div v-if="showBankTransferModal" class="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60]">
        <div class="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <h3 class="text-lg font-bold text-primary-900 mb-4">Havale Bildirimi</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-primary-900 mb-1">Banka</label>
              <select v-model="bankTransferForm.bank" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-accent-500">
                <option value="" disabled>Seçiniz</option>
                <option value="Ziraat Bankası">Ziraat Bankası</option>
                <option value="İş Bankası">İş Bankası</option>
                <option value="Garanti BBVA">Garanti BBVA</option>
                <option value="Yapı Kredi">Yapı Kredi</option>
                <option value="Akbank">Akbank</option>
                <option value="Vakıfbank">Vakıfbank</option>
                <option value="Halkbank">Halkbank</option>
                <option value="Albaraka">Albaraka</option>
                <option value="Kuveyt Türk">Kuveyt Türk</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-900 mb-1">Ödenen Tutar (₺)</label>
              <input v-model.number="bankTransferForm.amount" type="number" step="0.01" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-accent-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-900 mb-1">Gönderen Ad Soyad</label>
              <input v-model="bankTransferForm.senderName" type="text" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-accent-500" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-900 mb-1">Not (opsiyonel)</label>
              <input v-model="bankTransferForm.note" type="text" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-accent-500" />
            </div>
          </div>
          <div class="flex gap-3 justify-end mt-6">
            <button @click="showBankTransferModal = false" class="px-4 py-2 border border-ink-200 text-primary-900 rounded-lg text-sm hover:bg-ink-50">Vazgeç</button>
            <button @click="handleBankTransfer" :disabled="submittingTransfer || !bankTransferForm.bank || !bankTransferForm.amount" class="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
              {{ submittingTransfer ? 'Gönderiliyor...' : 'Bildirimi Gönder' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
