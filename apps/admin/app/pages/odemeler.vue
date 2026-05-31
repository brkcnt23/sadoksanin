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
  try { transfers.value = await api.get<BankTransfer[]>(`/orders/admin/bank-transfers?status=${filter.value}`) } catch { /* */ }
  loading.value = false
}

watch(filter, load)
onMounted(load)

const approve = async (t: BankTransfer) => {
  try { await api.post(`/orders/${t.orderId}/bank-transfer/approve`); toast.push?.('Havale onaylandı', 'success'); load() }
  catch { toast.push?.('Onaylama başarısız', 'error') }
}

const reject = async (t: BankTransfer) => {
  const reason = prompt('Ret sebebi:')
  if (!reason) return
  try { await api.post(`/orders/${t.orderId}/bank-transfer/reject`, { reason }); toast.push?.('Reddedildi', 'success'); load() }
  catch { toast.push?.('Reddetme başarısız', 'error') }
}

const statusBadge = (s: string) => {
  const m: Record<string, { v: string; l: string }> = {
    PENDING: { v: 'warning', l: 'Bekliyor' },
    APPROVED: { v: 'success', l: 'Onaylandı' },
    REJECTED: { v: 'danger', l: 'Reddedildi' },
  }
  return m[s] || { v: 'neutral', l: s }
}
const vBadge = (v: string) => {
  const m: Record<string, string> = { warning: 'bg-amber-100 text-amber-800', success: 'bg-green-100 text-green-800', danger: 'bg-red-100 text-red-800', neutral: 'bg-ink-100 text-ink-600' }
  return m[v] || m.neutral
}
const formatTL = (n: number) => new Intl.NumberFormat('tr-TR').format(n)
const formatDate = (d: string) => new Date(d).toLocaleDateString('tr-TR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="Ödemeler" description="Havale bildirimleri ve ödeme kayıtları." />

    <div class="bg-white rounded-xl border border-ink-200">
      <div class="px-5 py-4 border-b border-ink-200 flex items-center gap-4">
        <h3 class="font-semibold text-ink-900 flex items-center gap-2"><Icon name="lucide:banknote" class="w-4 h-4 text-primary-600" /> Havale Bildirimleri</h3>
        <select v-model="filter" class="px-2.5 py-1.5 border border-ink-300 rounded-md text-sm bg-white">
          <option value="PENDING">Bekleyenler</option>
          <option value="APPROVED">Onaylananlar</option>
          <option value="REJECTED">Reddedilenler</option>
          <option value="">Tümü</option>
        </select>
      </div>

      <div v-if="loading" class="p-8 text-center text-ink-500">Yükleniyor...</div>

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
            <td class="px-5 py-3 text-sm font-mono font-medium text-ink-900">{{ t.order?.orderNo || t.orderId.slice(0, 12) }}<br/><span class="text-xs text-ink-400">₺{{ formatTL(t.order?.total || 0) }}</span></td>
            <td class="px-5 py-3 text-sm text-ink-700">{{ t.senderName }}<br/><span class="text-xs text-ink-400">{{ t.user?.email }}</span></td>
            <td class="px-5 py-3 text-sm text-ink-700">{{ t.bank }}</td>
            <td class="px-5 py-3 text-sm font-bold text-ink-900 text-right">₺{{ formatTL(t.amount) }}</td>
            <td class="px-5 py-3"><span :class="['inline-flex px-2 py-0.5 rounded-full text-xs font-medium', vBadge(statusBadge(t.status).v)]">{{ statusBadge(t.status).l }}</span></td>
            <td class="px-5 py-3">
              <div v-if="t.status === 'PENDING'" class="flex gap-1">
                <button @click="approve(t)" class="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">Onayla</button>
                <button @click="reject(t)" class="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md">Reddet</button>
              </div>
              <span v-else-if="t.status === 'REJECTED'" class="text-xs text-red-600">{{ t.rejectionReason || '—' }}</span>
              <span v-else class="text-xs text-green-600">✓</span>
            </td>
          </tr>
        </tbody>
      </table>
      <EmptyState v-else icon="lucide:banknote" title="Havale bildirimi bulunamadı" />
    </div>
  </div>
</template>
