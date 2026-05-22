<script setup lang="ts">
import { formatPrice, formatDate, formatRelative } from '~/utils/storage'
import type { Order, OrderStatus } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Siparişler | Sadöksan Admin',
})

const orders = useOrdersStore()
const auth = useAdminAuth()

onMounted(() => {
  if (!orders.loaded) orders.load()
})

const detail = ref<Order | null>(null)
const actingIds = ref<Set<string>>(new Set())
const selectedIds = ref<Set<string>>(new Set())

const pendingOnly = computed(() =>
  orders.paginated.filter((o) => o.status === 'pending-approval'),
)

const allSelected = computed(() =>
  pendingOnly.value.length > 0 && pendingOnly.value.every((o) => selectedIds.value.has(o.id)),
)

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(pendingOnly.value.map((o) => o.id))
  }
}

function toggleSelect(id: string) {
  const next = new Set(selectedIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedIds.value = next
}

async function bulkApprove() {
  const u = auth.getUser()
  if (!u) return
  if (!confirm(`${selectedIds.value.size} sipariş onaylansın mı?`)) return

  for (const id of selectedIds.value) {
    actingIds.value.add(id)
    try { await orders.approve(id, u.id) } catch { /* continue */ }
    actingIds.value.delete(id)
  }
  selectedIds.value = new Set()
}

async function bulkReject() {
  const u = auth.getUser()
  if (!u) return
  const reason = prompt(`${selectedIds.value.size} sipariş için red sebebi:`)
  if (!reason) return

  for (const id of selectedIds.value) {
    actingIds.value.add(id)
    try { await orders.reject(id, u.id, reason) } catch { /* continue */ }
    actingIds.value.delete(id)
  }
  selectedIds.value = new Set()
}

const orderStatusBadge = (s: OrderStatus) => {
  const m: Record<OrderStatus, { variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'; label: string }> = {
    'pending-approval': { variant: 'warning', label: 'Onay Bekliyor' },
    approved: { variant: 'info', label: 'Onaylandı' },
    preparing: { variant: 'info', label: 'Hazırlanıyor' },
    shipped: { variant: 'purple', label: 'Sevk Edildi' },
    completed: { variant: 'success', label: 'Tamamlandı' },
    cancelled: { variant: 'neutral', label: 'İptal' },
    rejected: { variant: 'danger', label: 'Reddedildi' },
  }
  return m[s]
}

const approve = async (o: Order) => {
  const u = auth.getUser()
  if (!u) return

  actingIds.value.add(o.id)
  try {
    await orders.approve(o.id, u.id)
  } finally {
    actingIds.value.delete(o.id)
  }
}

const orderHistory = ref<any[]>([])

watch(detail, async (newVal) => {
  if (!newVal) { orderHistory.value = []; return }
  try {
    const { useApi } = await import('~/composables/useApi')
    const api = useApi()
    orderHistory.value = await api.get<any[]>(`/orders/${newVal.id}/history`)
  } catch { orderHistory.value = [] }
})

const statusLabel2 = (s: string) => {
  const labels: Record<string, string> = {
    PENDING_APPROVAL: 'Onay Bekliyor', APPROVED: 'Onaylandı', SHIPPED: 'Kargoya Verildi',
    COMPLETED: 'Tamamlandı', CANCELLED: 'İptal Edildi', REJECTED: 'Reddedildi',
  }
  return labels[s] ?? s
}

const formatTimeAgo2 = (d: string) => {
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Az önce'
  if (mins < 60) return `${mins}dk önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}s önce`
  return `${Math.floor(hours / 24)}g önce`
}

const reject = async (o: Order) => {
  const u = auth.getUser()
  if (!u) return
  const reason = prompt('Red sebebi:')
  if (!reason) return

  actingIds.value.add(o.id)
  try {
    await orders.reject(o.id, u.id, reason)
  } finally {
    actingIds.value.delete(o.id)
  }
}

const triggerInvoice = async (o: Order) => {
  if (!confirm(`${o.orderNo} için Alneo e-fatura kesilsin mi?`)) return

  actingIds.value.add(o.id)
  try {
    await orders.triggerEInvoice(o.id)
    alert('E-fatura talebi Alneo\'ya gönderildi')
  } finally {
    actingIds.value.delete(o.id)
  }
}
</script>

<template>
  <div class="space-y-5">
    <!-- Error Banner -->
    <div v-if="orders.error" class="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center justify-between">
      <div>{{ orders.error }}</div>
      <button @click="orders.error = null" class="text-red-600 hover:text-red-800 font-medium">Kapat</button>
    </div>

    <!-- Loading Skeleton -->
    <div v-if="orders.loading && !orders.loaded" class="space-y-3">
      <div class="h-12 bg-ink-200 rounded-lg animate-pulse"></div>
      <div class="h-64 bg-ink-200 rounded-lg animate-pulse"></div>
    </div>

    <PageHeader
      v-else
      title="Siparişler"
      :description="`${orders.items.length} sipariş — ${orders.pendingCount} onay bekliyor`"
    />

    <template v-if="!orders.loading || orders.loaded">
      <!-- Filters -->
      <div class="bg-white rounded-xl border border-ink-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="relative">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -tranink-y-1/2 w-4 h-4 text-ink-400" />
          <input
            :value="orders.search"
            @input="orders.setSearch(($event.target as HTMLInputElement).value)"
            type="text"
            placeholder="Sipariş no, müşteri, cari..."
            class="w-full pl-9 pr-3 py-2 border border-ink-300 rounded-md text-sm"
          />
        </div>
        <select
          :value="orders.filter.status"
          @change="orders.setFilter('status', ($event.target as HTMLSelectElement).value as 'all' | OrderStatus)"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="all">Tüm Durumlar</option>
          <option value="pending-approval">Onay Bekliyor</option>
          <option value="approved">Onaylandı</option>
          <option value="preparing">Hazırlanıyor</option>
          <option value="shipped">Sevk Edildi</option>
          <option value="completed">Tamamlandı</option>
          <option value="cancelled">İptal</option>
          <option value="rejected">Reddedildi</option>
        </select>
        <select
          :value="orders.filter.customerType"
          @change="orders.setFilter('customerType', ($event.target as HTMLSelectElement).value as 'all' | 'B2C' | 'B2B')"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="all">Tüm Türler</option>
          <option value="B2C">B2C</option>
          <option value="B2B">B2B</option>
        </select>
        <input
          :value="orders.filter.dateFrom ?? ''"
          @change="orders.setFilter('dateFrom', ($event.target as HTMLInputElement).value || null)"
          type="date"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm"
        />
      </div>
    </div>

    <!-- Bulk Action Bar -->
    <div
      v-if="selectedIds.size > 0"
      class="bg-primary-900 text-white rounded-xl p-4 flex items-center justify-between shadow-lg sticky top-4 z-10"
    >
      <p class="font-semibold text-sm">{{ selectedIds.size }} sipariş seçildi</p>
      <div class="flex gap-2">
        <button
          @click="bulkApprove"
          class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-semibold transition-colors"
        >
          Toplu Onayla
        </button>
        <button
          @click="bulkReject"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-colors"
        >
          Toplu Reddet
        </button>
        <button
          @click="selectedIds = new Set()"
          class="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-semibold transition-colors"
        >
          Seçimi Temizle
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-ink-200 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-ink-50 border-b border-ink-200 text-left">
            <tr>
              <th class="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  :checked="allSelected"
                  class="rounded border-ink-300"
                  @change="toggleSelectAll"
                />
              </th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase">Sipariş No</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase">Müşteri</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase">Ürün</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase">Tutar</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase">Durum</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase">E-Fatura</th>
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase">Tarih</th>
              <th class="px-4 py-3 w-32"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr v-for="o in orders.paginated" :key="o.id" class="hover:bg-ink-50" :class="{ 'bg-primary-50': selectedIds.has(o.id) }">
              <td class="px-4 py-3">
                <input
                  v-if="o.status === 'pending-approval'"
                  type="checkbox"
                  :checked="selectedIds.has(o.id)"
                  class="rounded border-ink-300"
                  @change="toggleSelect(o.id)"
                />
              </td>
                <p class="font-mono text-sm font-medium text-ink-900">{{ o.orderNo }}</p>
                <StatusBadge
                  :variant="o.customerType === 'B2C' ? 'info' : 'purple'"
                  :label="o.customerType"
                />
              </td>
              <td class="px-4 py-3 text-sm">
                <p class="text-ink-900 truncate max-w-xs">{{ o.customerName }}</p>
                <p v-if="o.dealerCariNo" class="text-xs text-ink-500 font-mono">{{ o.dealerCariNo }}</p>
              </td>
              <td class="px-4 py-3 text-sm text-ink-600">{{ o.lines.length }} kalem</td>
              <td class="px-4 py-3 text-sm font-bold text-ink-900">{{ formatPrice(o.total) }}</td>
              <td class="px-4 py-3"><StatusBadge v-bind="orderStatusBadge(o.status)" /></td>
              <td class="px-4 py-3 text-xs">
                <span v-if="o.eInvoiceNo" class="font-mono text-ink-700">{{ o.eInvoiceNo }}</span>
                <span v-else class="text-ink-400">—</span>
              </td>
              <td class="px-4 py-3 text-xs text-ink-500 whitespace-nowrap">{{ formatRelative(o.createdAt) }}</td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <button
                  @click="detail = o"
                  class="p-1.5 text-ink-500 hover:bg-ink-100 hover:text-primary-600 rounded-md"
                  title="Detay"
                >
                  <Icon name="lucide:eye" class="w-4 h-4" />
                </button>
                <button
                  v-if="o.status === 'pending-approval'"
                  @click="approve(o)"
                  :disabled="actingIds.has(o.id)"
                  class="p-1.5 text-ink-500 hover:bg-emerald-50 hover:text-emerald-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Onayla"
                >
                  <Icon :name="actingIds.has(o.id) ? 'lucide:loader-2' : 'lucide:check'" class="w-4 h-4" :class="actingIds.has(o.id) && 'animate-spin'" />
                </button>
                <button
                  v-if="o.status === 'pending-approval'"
                  @click="reject(o)"
                  :disabled="actingIds.has(o.id)"
                  class="p-1.5 text-ink-500 hover:bg-red-50 hover:text-red-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reddet"
                >
                  <Icon :name="actingIds.has(o.id) ? 'lucide:loader-2' : 'lucide:x'" class="w-4 h-4" :class="actingIds.has(o.id) && 'animate-spin'" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <EmptyState
          v-if="orders.paginated.length === 0"
          icon="lucide:inbox"
          title="Sipariş bulunamadı"
          description="Filtreleri sıfırlayın."
        />
      </div>

      <div v-if="orders.filtered.length > 0" class="px-4 border-t border-ink-200">
        <Pagination
          :page="orders.page"
          :total-pages="orders.totalPages"
          :total="orders.filtered.length"
          :page-size="orders.pageSize"
          @change="orders.setPage"
        />
      </div>
    </div>

    <!-- Detail modal -->
    <Modal :open="detail !== null" :title="`Sipariş Detayı — ${detail?.orderNo}`" size="lg" @close="detail = null">
      <div v-if="detail" class="p-6 space-y-5">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-ink-500 uppercase tracking-wider">Müşteri</p>
            <p class="font-medium text-ink-900 mt-0.5">{{ detail.customerName }}</p>
            <p v-if="detail.dealerCariNo" class="text-xs text-ink-500 font-mono">{{ detail.dealerCariNo }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500 uppercase tracking-wider">Sevkiyat</p>
            <p class="font-medium text-ink-900 mt-0.5">{{ detail.shippingCity }}</p>
            <p class="text-xs text-ink-500">{{ detail.shippingAddress }}</p>
          </div>
          <div>
            <p class="text-xs text-ink-500 uppercase tracking-wider">Durum</p>
            <div class="mt-0.5"><StatusBadge v-bind="orderStatusBadge(detail.status)" /></div>
          </div>
          <div>
            <p class="text-xs text-ink-500 uppercase tracking-wider">Tarih</p>
            <p class="font-medium text-ink-900 mt-0.5">{{ formatDate(detail.createdAt) }}</p>
          </div>
        </div>

        <div>
          <h4 class="font-semibold text-ink-900 mb-2 text-sm">Kalemler</h4>
          <table class="w-full text-sm">
            <thead class="bg-ink-50">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-semibold text-ink-700 uppercase">Ürün</th>
                <th class="px-3 py-2 text-right text-xs font-semibold text-ink-700 uppercase">Adet</th>
                <th class="px-3 py-2 text-right text-xs font-semibold text-ink-700 uppercase">Birim</th>
                <th class="px-3 py-2 text-right text-xs font-semibold text-ink-700 uppercase">Toplam</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr v-for="l in detail.lines" :key="l.id">
                <td class="px-3 py-2">
                  <p class="text-ink-900">{{ l.productName }}</p>
                  <p class="text-xs text-ink-500 font-mono">{{ l.sku }}</p>
                </td>
                <td class="px-3 py-2 text-right">{{ l.quantity }}</td>
                <td class="px-3 py-2 text-right">{{ formatPrice(l.unitPrice) }}</td>
                <td class="px-3 py-2 text-right font-medium">{{ formatPrice(l.total) }}</td>
              </tr>
            </tbody>
            <tfoot class="border-t-2 border-ink-200">
              <tr>
                <td colspan="3" class="px-3 py-1.5 text-right text-xs text-ink-600">Ara Toplam</td>
                <td class="px-3 py-1.5 text-right font-medium">{{ formatPrice(detail.subtotal) }}</td>
              </tr>
              <tr>
                <td colspan="3" class="px-3 py-1.5 text-right text-xs text-ink-600">KDV</td>
                <td class="px-3 py-1.5 text-right font-medium">{{ formatPrice(detail.tax) }}</td>
              </tr>
              <tr>
                <td colspan="3" class="px-3 py-1.5 text-right text-xs text-ink-600">Lojistik</td>
                <td class="px-3 py-1.5 text-right font-medium">{{ formatPrice(detail.logisticsSurcharge) }}</td>
              </tr>
              <tr>
                <td colspan="3" class="px-3 py-2 text-right text-sm font-semibold text-ink-900">Toplam</td>
                <td class="px-3 py-2 text-right font-bold text-emerald-600">{{ formatPrice(detail.total) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div v-if="detail.notes" class="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <p class="text-xs font-semibold text-amber-900 mb-1">Müşteri Notu</p>
          <p class="text-sm text-amber-800">{{ detail.notes }}</p>
        </div>

        <!-- Status Timeline -->
        <div class="border-t border-ink-100 pt-4">
          <h4 class="font-semibold text-ink-900 mb-3 text-sm flex items-center gap-2">
            <Icon name="lucide:clock" class="w-4 h-4 text-primary-600" />
            Durum Geçmişi
          </h4>
          <div class="space-y-0 pl-4 border-l-2 border-ink-200">
            <div
              v-for="entry in orderHistory"
              :key="entry.id"
              class="relative pl-6 pb-4 last:pb-0"
            >
              <div
                class="absolute left-[-6px] top-1 w-3 h-3 rounded-full border-2"
                :class="{
                  'bg-amber-400 border-amber-400': entry.status === 'PENDING_APPROVAL',
                  'bg-blue-400 border-blue-400': entry.status === 'APPROVED',
                  'bg-purple-400 border-purple-400': entry.status === 'SHIPPED',
                  'bg-emerald-400 border-emerald-400': entry.status === 'COMPLETED',
                  'bg-red-400 border-red-400': entry.status === 'CANCELLED' || entry.status === 'REJECTED',
                  'bg-ink-300 border-ink-300': true,
                }"
              />
              <p class="text-sm font-medium text-ink-900">{{ statusLabel2(entry.status) }}</p>
              <p v-if="entry.note" class="text-xs text-ink-500 mt-0.5">{{ entry.note }}</p>
              <div class="flex items-center gap-2 mt-0.5">
                <span v-if="entry.actorEmail" class="text-xs text-ink-400">{{ entry.actorEmail }}</span>
                <span class="text-xs text-ink-400">{{ formatTimeAgo2(entry.createdAt) }}</span>
              </div>
            </div>
            <div v-if="orderHistory.length === 0" class="text-xs text-ink-400 py-2 pl-6">
              Henüz kayıt yok
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-between">
          <button
            v-if="detail && !detail.eInvoiceNo"
            @click="detail && triggerInvoice(detail)"
            class="px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-md flex items-center gap-2"
          >
            <Icon name="lucide:file-text" class="w-4 h-4" />
            E-Fatura Kes
          </button>
          <span v-else class="text-xs text-ink-500">
            <Icon name="lucide:check-circle" class="w-3.5 h-3.5 inline text-emerald-600" />
            E-Fatura: {{ detail?.eInvoiceNo }}
          </span>
          <div class="flex gap-2">
            <button
              v-if="detail?.status === 'pending-approval'"
              @click="detail && reject(detail); detail = null"
              class="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
            >
              Reddet
            </button>
            <button
              v-if="detail?.status === 'pending-approval'"
              @click="detail && approve(detail); detail = null"
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
    </template>
  </div>
</template>
