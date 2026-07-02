<script setup lang="ts">
import { formatPrice, formatDate, formatRelative } from '~/utils/storage'
import type { Order, OrderStatus } from '~/types'
import TestOrderModal from '~/components/TestOrderModal.vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Siparişler | Sadöksan Admin',
})

const orders = useOrdersStore()
const auth = useAdminAuth()
const showTestModal = ref(false)

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

const orderStatusBadge = (s: string) => {
  const key = (s || '').toLowerCase()
  const m: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'; label: string }> = {
    'pending_approval': { variant: 'warning', label: 'Onay Bekliyor' },
    approved: { variant: 'info', label: 'Onaylandı' },
    preparing: { variant: 'info', label: 'Hazırlanıyor' },
    shipped: { variant: 'purple', label: 'Sevk Edildi' },
    completed: { variant: 'success', label: 'Tamamlandı' },
    cancelled: { variant: 'neutral', label: 'İptal' },
    rejected: { variant: 'danger', label: 'Reddedildi' },
    returned: { variant: 'neutral', label: 'İade' },
    return_requested: { variant: 'warning', label: 'İade Talebi' },
  }
  return m[key] || { variant: 'neutral' as const, label: s || 'Bilinmiyor' }
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

const toast = useToast()

async function approveAllPending() {
  const u = auth.getUser()
  if (!u) return
  const pending = orders.items.filter((o) => o.status === 'pending-approval')
  if (pending.length === 0) { toast.push('Onay bekleyen sipariş yok', 'info'); return }
  if (!confirm(`${pending.length} sipariş onaylansın mı?`)) return

  let ok = 0
  for (const o of pending) {
    try { await orders.approve(o.id, u.id); ok++ } catch { /* skip */ }
  }
  toast.push(`${ok}/${pending.length} sipariş onaylandı`, 'success')
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
    >
      <template #actions>
        <div class="flex gap-2">
          <button
            v-if="orders.pendingCount > 0"
            @click="approveAllPending"
            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="lucide:check-check" class="w-4 h-4" />
            Tümünü Onayla ({{ orders.pendingCount }})
          </button>
          <button
            @click="showTestModal = true"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="lucide:flask-conical" class="w-4 h-4" />
            Test Siparişi
          </button>
        </div>
      </template>
    </PageHeader>

    <template v-if="!orders.loading || orders.loaded">
      <!-- Filters -->
      <div class="bg-white rounded-xl border border-ink-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="relative">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
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
              <th class="px-4 py-3 text-xs font-semibold text-ink-700 uppercase">Bayi</th>
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
              <td class="px-4 py-3">
                <p class="font-mono text-sm font-medium text-ink-900">{{ o.orderNo }}</p>
                <StatusBadge
                  :variant="o.customerType === 'B2C' ? 'info' : 'purple'"
                  :label="o.customerType"
                />
              </td>
              <td class="px-4 py-3 text-sm">
                <p class="text-ink-900 truncate max-w-[180px] font-medium">{{ o.dealerName || o.customerName }}</p>
                <p v-if="o.dealerCariNo" class="text-xs text-ink-400 font-mono">{{ o.dealerCariNo }}</p>
                <p v-if="o.dealerCity" class="text-[10px] text-ink-400">{{ o.dealerCity }}</p>
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

    <!-- Order Detail Drawer -->
    <OrderDetailDrawer
      v-if="detail"
      :order="detail"
      :order-id="detail.id"
      @close="detail = null"
      @action="detail = null; orders.load()"
    />

    <!-- Test Order Modal -->
    <TestOrderModal
      :open="showTestModal"
      @close="showTestModal = false"
    />
    </template>
  </div>
</template>
