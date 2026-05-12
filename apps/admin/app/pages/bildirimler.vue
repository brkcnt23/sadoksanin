<script setup lang="ts">
import { formatRelative } from '~/utils/storage'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Bildirimler | Sadöksan Admin',
})

const notifications = useNotificationsStore()
const products = useProductsStore()
const settings = useSettingsStore()

onMounted(() => {
  if (!notifications.loaded) notifications.load()
  if (!products.loaded) products.load()
  if (!settings.loaded) settings.load()
})

const sendForProduct = async (productId: string) => {
  const count = await notifications.sendForProduct(productId)
  alert(`${count} bildirim gönderildi (${settings.data.whatsappRecipient} & e-posta)`)
}

const groupedByProduct = computed(() => {
  const map = new Map<string, { productName: string; count: number }>()
  notifications.items
    .filter((n) => n.status === 'pending')
    .forEach((n) => {
      const cur = map.get(n.productId)
      if (cur) cur.count += 1
      else map.set(n.productId, { productName: n.productName, count: 1 })
    })
  return [...map.entries()].map(([productId, v]) => ({ productId, ...v }))
})

const statusBadge = (s: 'pending' | 'notified' | 'cancelled') => {
  const m = {
    pending: { variant: 'warning' as const, label: 'Bekliyor' },
    notified: { variant: 'success' as const, label: 'Gönderildi' },
    cancelled: { variant: 'neutral' as const, label: 'İptal' },
  }
  return m[s]
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="Bildirim Talepleri"
      :description="`Stoksuz ürünler için müşterilerin haberdar olma talepleri. WhatsApp: ${settings.data.whatsappRecipient}`"
    />

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Bekleyen" :value="notifications.pendingCount" icon="lucide:bell" color="amber" />
      <StatCard
        label="Gönderilen"
        :value="notifications.items.filter((n) => n.status === 'notified').length"
        icon="lucide:bell-ring"
        color="green"
      />
      <StatCard label="Toplam" :value="notifications.items.length" icon="lucide:list" color="slate" />
    </div>

    <!-- Grouped by product -->
    <div v-if="groupedByProduct.length > 0" class="bg-white rounded-xl border border-slate-200">
      <div class="px-5 py-4 border-b border-slate-200">
        <h3 class="font-semibold text-slate-900">Ürün Bazında Bekleyenler</h3>
      </div>
      <div class="divide-y divide-slate-100">
        <div
          v-for="g in groupedByProduct"
          :key="g.productId"
          class="px-5 py-3 flex items-center justify-between"
        >
          <div>
            <p class="font-medium text-slate-900 text-sm">{{ g.productName }}</p>
            <p class="text-xs text-slate-500">{{ g.count }} kişi bekliyor</p>
          </div>
          <button
            @click="sendForProduct(g.productId)"
            class="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md flex items-center gap-1.5"
          >
            <Icon name="lucide:send" class="w-3.5 h-3.5" />
            Hepsine Bildirim Gönder
          </button>
        </div>
      </div>
    </div>

    <!-- All requests -->
    <div class="bg-white rounded-xl border border-slate-200">
      <div class="px-5 py-4 border-b border-slate-200">
        <h3 class="font-semibold text-slate-900">Tüm Talepler</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50 border-b border-slate-200 text-left">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase">Ürün</th>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase">Müşteri</th>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase">Tür</th>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase">Kanal</th>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase">Durum</th>
              <th class="px-5 py-3 text-xs font-semibold text-slate-700 uppercase">Tarih</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            <tr v-for="n in notifications.filtered" :key="n.id" class="hover:bg-slate-50">
              <td class="px-5 py-3 text-sm text-slate-900 truncate max-w-xs">{{ n.productName }}</td>
              <td class="px-5 py-3 text-sm">
                <p class="text-slate-700">{{ n.email ?? n.phone }}</p>
              </td>
              <td class="px-5 py-3">
                <StatusBadge :variant="n.isDealer ? 'purple' : 'info'" :label="n.isDealer ? 'Bayi' : 'B2C'" />
              </td>
              <td class="px-5 py-3 text-xs text-slate-600">{{ n.channel ?? '—' }}</td>
              <td class="px-5 py-3"><StatusBadge v-bind="statusBadge(n.status)" /></td>
              <td class="px-5 py-3 text-xs text-slate-500">{{ formatRelative(n.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="notifications.filtered.length === 0" icon="lucide:bell-off" title="Bildirim talebi yok" />
      </div>
    </div>
  </div>
</template>
