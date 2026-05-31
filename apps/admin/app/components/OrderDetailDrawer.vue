<script setup lang="ts">
import { formatPrice, formatDate, formatRelative } from '~/utils/storage'
import type { Order } from '~/types'

const props = defineProps<{ order: Order; orderId: string }>()
const emit = defineEmits<{ close: []; action: [type: string, data?: any] }>()

const api = useApi()
const orders = useOrdersStore()
const toast = useToast()

const history = ref<any[]>([])
const loading = ref(true)
const adminNote = ref('')
const trackingNo = ref('')
const cargoCompany = ref('')
const saving = ref(false)

onMounted(async () => {
  try { history.value = await api.get<any[]>(`/orders/${props.orderId}/history`) } catch { /* */ }
  loading.value = false
})

const statusBadge = (s: string) => {
  const m: Record<string, { variant: string; label: string }> = {
    PENDING_APPROVAL: { variant: 'warning', label: 'Onay Bekliyor' },
    APPROVED: { variant: 'info', label: 'Onaylandı' },
    PREPARING: { variant: 'info', label: 'Hazırlanıyor' },
    AWAITING_SUPPLY: { variant: 'warning', label: 'Tedarik Bekleniyor' },
    READY_TO_SHIP: { variant: 'purple', label: 'Kargoya Hazır' },
    SHIPPED: { variant: 'purple', label: 'Kargoya Verildi' },
    DELIVERED: { variant: 'success', label: 'Teslim Edildi' },
    COMPLETED: { variant: 'success', label: 'Tamamlandı' },
    CANCELLED: { variant: 'neutral', label: 'İptal Edildi' },
    REJECTED: { variant: 'danger', label: 'Reddedildi' },
    RETURN_REQUESTED: { variant: 'warning', label: 'İade Talebi' },
    RETURNED: { variant: 'neutral', label: 'İade Tamamlandı' },
  }
  return m[s] || { variant: 'neutral', label: s }
}

const statusLabel = (s: string) => {
  const labels: Record<string, string> = {
    PENDING_APPROVAL: 'Onay Bekliyor', APPROVED: 'Onaylandı', PREPARING: 'Hazırlanıyor',
    AWAITING_SUPPLY: 'Tedarik Bekleniyor', READY_TO_SHIP: 'Kargoya Hazır', SHIPPED: 'Kargoya Verildi',
    DELIVERED: 'Teslim Edildi', COMPLETED: 'Tamamlandı', CANCELLED: 'İptal Edildi',
    REJECTED: 'Reddedildi', RETURN_REQUESTED: 'İade Talebi', RETURNED: 'İade Tamamlandı',
  }
  return labels[s] || s
}

const paymentBadge = (s?: string) => {
  if (!s) return { variant: 'neutral', label: 'Bekliyor' }
  const m: Record<string, { variant: string; label: string }> = {
    PENDING: { variant: 'warning', label: 'Bekliyor' },
    PAID: { variant: 'success', label: 'Ödendi' },
    FAILED: { variant: 'danger', label: 'Başarısız' },
  }
  return m[s] || { variant: 'neutral', label: s }
}

const vBadge = (v: string) => {
  const m: Record<string, string> = {
    warning: 'bg-amber-100 text-amber-800', info: 'bg-blue-100 text-blue-800',
    purple: 'bg-purple-100 text-purple-800', success: 'bg-green-100 text-green-800',
    danger: 'bg-red-100 text-red-800', neutral: 'bg-ink-100 text-ink-600',
  }
  return m[v] || m.neutral
}

async function doApprove() {
  saving.value = true
  try { await orders.approve(props.orderId, (orders as any)._userId || ''); emit('action', 'approved'); toast.push?.('Onaylandı', 'success') }
  catch { toast.push?.('Onaylama başarısız', 'error') }
  finally { saving.value = false }
}

async function doReject() {
  const reason = prompt('Red sebebi:')
  if (!reason) return
  saving.value = true
  try { await orders.reject(props.orderId, (orders as any)._userId || '', reason); emit('action', 'rejected'); toast.push?.('Reddedildi', 'success') }
  catch { toast.push?.('Reddetme başarısız', 'error') }
  finally { saving.value = false }
}

async function doStatusChange(status: string) {
  saving.value = true
  try {
    await api.patch(`/orders/${props.orderId}/status`, { status })
    emit('action', status); toast.push?.(`Durum: ${statusLabel(status)}`, 'success')
  } catch { toast.push?.('Durum değiştirilemedi', 'error') }
  finally { saving.value = false }
}

async function doShip() {
  if (!trackingNo.value) { toast.push?.('Kargo takip no gerekli', 'error'); return }
  saving.value = true
  try {
    await api.post(`/orders/${props.orderId}/ship`, { trackingNumber: trackingNo.value, cargoCompany: cargoCompany.value || 'Kargo' })
    emit('action', 'SHIPPED'); toast.push?.('Kargoya verildi', 'success')
  } catch { toast.push?.('Sevk başarısız', 'error') }
  finally { saving.value = false }
}

async function doCancel() {
  const reason = prompt('İptal sebebi:')
  if (!reason) return
  saving.value = true
  try { await api.post(`/orders/${props.orderId}/cancel`, { reason }); emit('action', 'CANCELLED'); toast.push?.('İptal edildi', 'success') }
  catch { toast.push?.('İptal başarısız', 'error') }
  finally { saving.value = false }
}

async function doAddNote() {
  if (!adminNote.value.trim()) return
  saving.value = true
  try { await api.post(`/orders/${props.orderId}/notes`, { note: adminNote.value }); adminNote.value = ''; toast.push?.('Not eklendi', 'success') }
  catch { toast.push?.('Not eklenemedi', 'error') }
  finally { saving.value = false }
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
</script>

<template>
  <div class="fixed inset-0 z-50 flex justify-end">
    <div class="absolute inset-0 bg-black/30" @click="emit('close')" />
    <div class="relative w-full max-w-xl bg-white shadow-xl flex flex-col h-full overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-ink-200 shrink-0 sticky top-0 bg-white z-10">
        <div>
          <h3 class="font-semibold text-ink-900">{{ order.orderNo }}</h3>
          <p class="text-xs text-ink-500">{{ formatDate(order.createdAt) }}</p>
        </div>
        <button @click="emit('close')" class="p-1.5 hover:bg-ink-100 rounded-md"><Icon name="lucide:x" class="w-5 h-5 text-ink-500" /></button>
      </div>

      <div v-if="loading" class="p-8 text-center text-ink-500">Yükleniyor...</div>

      <div v-else class="flex-1 space-y-4 p-5">
        <!-- Status + Type -->
        <div class="flex items-center gap-3">
          <span :class="['inline-flex px-3 py-1 rounded-full text-sm font-semibold', vBadge(statusBadge(order.status).variant)]">{{ statusBadge(order.status).label }}</span>
          <span class="text-xs text-ink-500">{{ order.customerType === 'B2B' ? 'B2B Bayi' : 'B2C Müşteri' }}</span>
          <span :class="['inline-flex px-2 py-0.5 rounded-full text-xs font-medium', vBadge(paymentBadge(order.paymentStatus).variant)]">{{ paymentBadge(order.paymentStatus).label }}</span>
        </div>

        <!-- Müşteri Bilgisi -->
        <div class="bg-ink-50 rounded-lg p-4">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Müşteri</h4>
          <p class="font-medium text-ink-900">{{ (order as any).customer?.name || (order as any).dealer?.name || '—' }}</p>
          <p class="text-sm text-ink-600">{{ (order as any).customer?.email || '—' }}</p>
          <p v-if="(order as any).dealer?.cariNo" class="text-xs text-ink-500 mt-1">Cari: {{ (order as any).dealer.cariNo }}</p>
        </div>

        <!-- Adresler -->
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-ink-50 rounded-lg p-3">
            <p class="text-xs font-semibold text-ink-500 mb-1">Teslimat</p>
            <p class="text-sm text-ink-700">{{ order.shippingAddress || '—' }}</p>
          </div>
          <div class="bg-ink-50 rounded-lg p-3">
            <p class="text-xs font-semibold text-ink-500 mb-1">Şehir</p>
            <p class="text-sm text-ink-700">{{ order.shippingCity || '—' }}</p>
          </div>
        </div>

        <!-- Ürün Listesi -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Ürünler</h4>
          <div class="border border-ink-200 rounded-lg overflow-hidden">
            <table class="w-full text-sm">
              <thead class="bg-ink-50 text-left"><tr><th class="px-3 py-2 text-xs font-semibold">Ürün</th><th class="px-3 py-2 text-xs font-semibold text-right">Birim Fiyat</th><th class="px-3 py-2 text-xs font-semibold text-center">Adet</th><th class="px-3 py-2 text-xs font-semibold text-right">Toplam</th></tr></thead>
              <tbody class="divide-y divide-ink-100">
                <tr v-for="(line, i) in (order as any).lines" :key="i">
                  <td class="px-3 py-2 text-ink-900 text-xs">{{ (line as any).product?.name || line.productId }}</td>
                  <td class="px-3 py-2 text-right font-mono text-xs">₺{{ formatPrice(line.unitPrice) }}</td>
                  <td class="px-3 py-2 text-center text-xs">{{ line.quantity }}</td>
                  <td class="px-3 py-2 text-right font-semibold text-xs">₺{{ formatPrice(line.total) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Fiyat Özeti -->
        <div class="bg-ink-50 rounded-lg p-4 text-sm space-y-1">
          <div class="flex justify-between"><span class="text-ink-500">Ara Toplam</span><span>₺{{ formatPrice(order.subtotal) }}</span></div>
          <div v-if="order.logisticsSurcharge" class="flex justify-between"><span class="text-ink-500">Lojistik</span><span>₺{{ formatPrice(order.logisticsSurcharge) }}</span></div>
          <div class="flex justify-between"><span class="text-ink-500">KDV</span><span>₺{{ formatPrice(order.tax) }}</span></div>
          <div v-if="order.discountAmount" class="flex justify-between text-green-600"><span>İndirim</span><span>-₺{{ formatPrice(order.discountAmount) }}</span></div>
          <div class="flex justify-between font-bold text-ink-900 border-t border-ink-200 pt-2 mt-1"><span>Genel Toplam</span><span class="text-lg">₺{{ formatPrice(order.total) }}</span></div>
        </div>

        <!-- Ödeme -->
        <div class="bg-ink-50 rounded-lg p-3">
          <p class="text-xs font-semibold text-ink-500 mb-1">Ödeme: {{ order.paymentMethod || 'Belirtilmemiş' }}</p>
        </div>

        <!-- Kargo -->
        <div v-if="order.status === 'APPROVED' || order.status === 'PREPARING' || order.status === 'READY_TO_SHIP'" class="border border-ink-200 rounded-lg p-4">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">Kargo Bilgisi</h4>
          <div class="flex gap-2 mb-2">
            <input v-model="cargoCompany" placeholder="Kargo firması" class="flex-1 px-3 py-2 border border-ink-300 rounded-md text-sm" />
            <input v-model="trackingNo" placeholder="Takip no" class="flex-1 px-3 py-2 border border-ink-300 rounded-md text-sm" />
          </div>
          <button @click="doShip" :disabled="saving" class="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50">Kargoya Ver</button>
        </div>
        <div v-else-if="order.trackingNumber" class="bg-ink-50 rounded-lg p-3">
          <p class="text-xs text-ink-500">{{ order.cargoCompany }}: <span class="font-mono font-semibold text-ink-900">{{ order.trackingNumber }}</span></p>
        </div>

        <!-- Admin Not -->
        <div class="border border-ink-200 rounded-lg p-4">
          <h4 class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Admin Notu</h4>
          <div class="flex gap-2">
            <input v-model="adminNote" @keyup.enter="doAddNote" placeholder="Not ekle..." class="flex-1 px-3 py-2 border border-ink-300 rounded-md text-sm" />
            <button @click="doAddNote" :disabled="!adminNote.trim() || saving" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50">Ekle</button>
          </div>
        </div>

        <!-- Durum Geçmişi -->
        <div>
          <h4 class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-3">Durum Geçmişi</h4>
          <div v-if="history.length === 0" class="text-sm text-ink-400">Geçmiş bulunamadı</div>
          <div v-else class="space-y-3">
            <div v-for="h in history" :key="h.id" class="flex gap-3">
              <div class="flex flex-col items-center">
                <div class="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1.5" />
                <div class="w-0.5 flex-1 bg-ink-200" />
              </div>
              <div class="flex-1 pb-3">
                <p class="text-sm font-medium text-ink-900">{{ statusLabel(h.status) }}</p>
                <p v-if="h.note" class="text-xs text-ink-500 mt-0.5">{{ h.note }}</p>
                <p class="text-xs text-ink-400 mt-0.5">{{ h.actorEmail || 'Sistem' }} · {{ formatTimeAgo(h.createdAt) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- E-Doküman -->
        <div v-if="order.eInvoiceNo || order.eArchiveNo || order.eIrsaliyeNo" class="bg-ink-50 rounded-lg p-3 text-sm space-y-1">
          <p v-if="order.eInvoiceNo" class="text-ink-700">E-Fatura: <span class="font-mono font-semibold">{{ order.eInvoiceNo }}</span> <span :class="['text-xs', order.eInvoiceStatus === 'ACCEPTED' ? 'text-green-600' : 'text-amber-600']">{{ order.eInvoiceStatus }}</span></p>
          <p v-if="order.eArchiveNo" class="text-ink-700">E-Arşiv: <span class="font-mono font-semibold">{{ order.eArchiveNo }}</span></p>
          <p v-if="order.eIrsaliyeNo" class="text-ink-700">E-İrsaliye: <span class="font-mono font-semibold">{{ order.eIrsaliyeNo }}</span></p>
        </div>
      </div>

      <!-- Aksiyon Bar -->
      <div class="border-t border-ink-200 p-4 bg-ink-50 shrink-0 sticky bottom-0 flex flex-wrap gap-2">
        <button v-if="order.status === 'PENDING_APPROVAL'" @click="doApprove" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50">Onayla</button>
        <button v-if="order.status === 'PENDING_APPROVAL'" @click="doReject" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-50">Reddet</button>
        <button v-if="order.status === 'APPROVED'" @click="doStatusChange('PREPARING')" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50">Hazırlanıyor</button>
        <button v-if="order.status === 'PREPARING'" @click="doStatusChange('READY_TO_SHIP')" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md disabled:opacity-50">Kargoya Hazır</button>
        <button v-if="order.status === 'SHIPPED'" @click="doStatusChange('COMPLETED')" :disabled="saving" class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md disabled:opacity-50">Teslim Edildi</button>
        <button v-if="order.status !== 'CANCELLED' && order.status !== 'COMPLETED'" @click="doCancel" :disabled="saving" class="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md disabled:opacity-50">İptal Et</button>
      </div>
    </div>
  </div>
</template>
