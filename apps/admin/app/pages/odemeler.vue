<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth', title: 'Ödemeler | Sadöksan Admin' })

const api = useApi()
const toast = useToast()

interface BankTransfer {
  id: string; orderId: string; bank: string; amount: number; senderName: string
  note?: string; status: string; rejectionReason?: string; createdAt: string
  order?: { orderNo: string; total: number }
  user?: { name: string; email: string }
}

const transfers = ref<BankTransfer[]>([])
const loading = ref(true)
const filter = ref('PENDING')

const load = async () => {
  loading.value = true
  try { transfers.value = await api.get<BankTransfer[]>(`/orders/admin/bank-transfers?status=${filter.value}`) || [] } catch { /* */ }
  loading.value = false
}

watch(filter, load)
onMounted(load)

const pendingCount = computed(() => transfers.value.filter(t => t.status === 'PENDING').length)
const approvedCount = computed(() => transfers.value.filter(t => t.status === 'APPROVED').length)
const pendingAmount = computed(() => transfers.value.filter(t => t.status === 'PENDING').reduce((s, t) => s + t.amount, 0))
const approvedAmount = computed(() => transfers.value.filter(t => t.status === 'APPROVED').reduce((s, t) => s + t.amount, 0))
const totalAmount = computed(() => transfers.value.reduce((s, t) => s + t.amount, 0))

const approve = async (t: BankTransfer) => {
  try { await api.post(`/orders/${t.orderId}/bank-transfer/approve`); toast.push('Havale onaylandı', 'success'); load() }
  catch { toast.push('Onaylama başarısız', 'error') }
}

const rejectTarget = ref<BankTransfer | null>(null)
const rejectReason = ref('')
const rejectOpen = ref(false)

const openReject = (t: BankTransfer) => { rejectTarget.value = t; rejectReason.value = ''; rejectOpen.value = true }
const doReject = async () => {
  if (!rejectReason.value.trim() || !rejectTarget.value) return
  try {
    await api.post(`/orders/${rejectTarget.value.orderId}/bank-transfer/reject`, { reason: rejectReason.value })
    toast.push('Reddedildi', 'success')
    rejectOpen.value = false
    load()
  } catch { toast.push('Reddetme başarısız', 'error') }
}

const statusVariant = (s: string) => ({ PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' } as any)[s] ?? 'neutral'
const statusLabel = (s: string) => ({ PENDING: 'Bekliyor', APPROVED: 'Onaylandı', REJECTED: 'Reddedildi' } as any)[s] ?? s

const formatTL = (n: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(n)
const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="Ödemeler" description="Havale bildirimleri ve ödeme kayıtları" />

    <!-- Stats -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Bekleyen Havale" :value="pendingCount" icon="lucide:clock" color="amber" />
      <StatCard label="Bekleyen Tutar" :value="formatTL(pendingAmount)" icon="lucide:banknote" color="amber" />
      <StatCard label="Onaylanan" :value="approvedCount" icon="lucide:circle-check" color="green" />
      <StatCard label="Toplam Tutar" :value="formatTL(totalAmount)" icon="lucide:wallet" color="blue" />
    </div>

    <!-- Filter -->
    <div class="bg-white rounded-xl border border-ink-200">
      <div class="px-5 py-4 border-b border-ink-200 flex items-center gap-4">
        <h3 class="font-semibold text-ink-900 flex items-center gap-2">
          <Icon name="lucide:banknote" class="w-4 h-4 text-primary-600" /> Havale Bildirimleri
        </h3>
        <select v-model="filter" class="px-2.5 py-1.5 border border-ink-300 rounded-md text-sm bg-white">
          <option value="PENDING">Bekleyenler</option>
          <option value="APPROVED">Onaylananlar</option>
          <option value="REJECTED">Reddedilenler</option>
          <option value="">Tümü</option>
        </select>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="p-12 text-center">
        <div class="h-48 bg-ink-100 rounded-lg animate-pulse" />
      </div>

      <!-- Table -->
      <table v-else-if="transfers.length > 0" class="w-full">
        <thead class="bg-ink-50 border-b border-ink-200 text-left">
          <tr>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Tarih</th>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Sipariş</th>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Gönderen</th>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Banka</th>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase text-right">Tutar</th>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Durum</th>
            <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Aksiyon</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-100">
          <tr v-for="t in transfers" :key="t.id" class="hover:bg-ink-50">
            <td class="px-5 py-3 text-xs text-ink-500 whitespace-nowrap">{{ formatDate(t.createdAt) }}</td>
            <td class="px-5 py-3 text-sm font-mono font-medium text-ink-900">
              {{ t.order?.orderNo || t.orderId.slice(0, 12) }}<br/>
              <span class="text-xs text-ink-400">{{ formatTL(t.order?.total || 0) }}</span>
            </td>
            <td class="px-5 py-3 text-sm text-ink-700">{{ t.senderName }}<br/><span class="text-xs text-ink-400">{{ t.user?.email || '' }}</span></td>
            <td class="px-5 py-3 text-sm text-ink-700">{{ t.bank }}</td>
            <td class="px-5 py-3 text-sm font-bold text-ink-900 text-right">{{ formatTL(t.amount) }}</td>
            <td class="px-5 py-3"><StatusBadge :variant="statusVariant(t.status)" :label="statusLabel(t.status)" /></td>
            <td class="px-5 py-3">
              <div v-if="t.status === 'PENDING'" class="flex gap-1">
                <button @click="approve(t)" class="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">Onayla</button>
                <button @click="openReject(t)" class="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">Reddet</button>
              </div>
              <span v-else-if="t.status === 'REJECTED'" class="text-xs text-red-600">{{ t.rejectionReason || '—' }}</span>
              <span v-else class="text-xs text-green-600 flex items-center gap-1"><Icon name="lucide:check" class="w-3.5 h-3.5" /> Onaylandı</span>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-else icon="lucide:banknote" title="Havale bildirimi bulunamadı" />
    </div>

    <!-- Reject Modal -->
    <ConfirmModal
      :open="rejectOpen"
      title="Havale Bildirimini Reddet"
      :message="`Bu havale bildirimini reddetmek istediğinize emin misiniz?`"
      confirm-label="Reddet"
      variant="danger"
      @confirm="doReject"
      @close="rejectOpen = false"
    >
      <div class="mb-4">
        <label class="block text-sm font-medium text-ink-700 mb-1">Ret Sebebi *</label>
        <input v-model="rejectReason" type="text" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" placeholder="Reddetme sebebini yazın..." />
      </div>
    </ConfirmModal>
  </div>
</template>
