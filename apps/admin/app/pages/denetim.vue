<script setup lang="ts">
import { formatDate } from '~/utils/storage'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Denetim Kaydı | Sadöksan Admin',
})

const audit = useAuditStore()

onMounted(() => {
  if (!audit.loaded) audit.load()
})

const actionLabels: Record<string, string> = {
  'order.transition': 'Sipariş Durumu Değişti',
  'order.approve': 'Sipariş Onaylandı',
  'order.reject': 'Sipariş Reddedildi',
  'order.einvoice.submit': 'E-Fatura Kesildi',
  'dealer.approve': 'Bayi Onaylandı',
  'dealer.reject': 'Bayi Reddedildi',
  'dealer.status': 'Bayi Durumu Değişti',
  'product.update': 'Ürün Güncellendi',
  'stock.sync': 'Stok Senkronize Edildi',
  'notify.send': 'Bildirim Gönderildi',
  'settings.update': 'Ayar Güncellendi',
}

const renderDiff = (diff?: Record<string, { from: unknown; to: unknown }>) => {
  if (!diff) return ''
  return Object.entries(diff)
    .map(([k, v]) => `${k}: ${JSON.stringify(v.from)} → ${JSON.stringify(v.to)}`)
    .join(' | ')
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="Denetim Kaydı"
      description="Yönetici tarafından yapılan tüm değişiklikler kayıt altındadır."
    />

    <div class="bg-white rounded-xl border border-ink-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <select
          :value="audit.filter.entity ?? ''"
          @change="audit.setFilter('entity', ($event.target as HTMLSelectElement).value || null)"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="">Tüm Varlıklar</option>
          <option v-for="e in audit.distinctEntities" :key="e" :value="e">{{ e }}</option>
        </select>
        <select
          :value="audit.filter.action ?? ''"
          @change="audit.setFilter('action', ($event.target as HTMLSelectElement).value || null)"
          class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
        >
          <option value="">Tüm Eylemler</option>
          <option v-for="a in audit.distinctActions" :key="a" :value="a">{{ actionLabels[a] ?? a }}</option>
        </select>
      </div>
    </div>

    <div class="bg-white rounded-xl border border-ink-200">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-ink-50 border-b border-ink-200 text-left">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Tarih</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Kullanıcı</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Eylem</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Varlık</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Değişiklik</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr v-for="e in audit.filtered" :key="e.id" class="hover:bg-ink-50">
              <td class="px-5 py-3 text-xs text-ink-600 whitespace-nowrap">{{ formatDate(e.createdAt) }}</td>
              <td class="px-5 py-3 text-sm text-ink-700">{{ e.actorEmail }}</td>
              <td class="px-5 py-3 text-sm font-medium text-ink-900">{{ actionLabels[e.action] ?? e.action }}</td>
              <td class="px-5 py-3 text-xs text-ink-600 font-mono">{{ e.entity }}#{{ e.entityId }}</td>
              <td class="px-5 py-3 text-xs text-ink-600 font-mono max-w-md truncate">{{ renderDiff(e.diff) }}</td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="audit.filtered.length === 0" icon="lucide:scroll" title="Denetim kaydı yok" />
      </div>
    </div>
  </div>
</template>
