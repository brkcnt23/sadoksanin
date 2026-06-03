<script setup lang="ts">
import { formatDate } from '~/utils/storage'

definePageMeta({ layout: 'default', middleware: 'auth', title: 'Denetim Kaydı | Sadöksan Admin' })

const audit = useAuditStore()
const toast = useToast()
const search = ref('')
const dateFrom = ref('')
const dateTo = ref('')

onMounted(() => { if (!audit.loaded) audit.load() })

const actionLabels: Record<string, string> = {
  'order.transition': 'Sipariş Durumu Değişti', 'order.approve': 'Sipariş Onaylandı',
  'order.reject': 'Sipariş Reddedildi', 'order.einvoice.submit': 'E-Fatura Kesildi',
  'dealer.approve': 'Bayi Onaylandı', 'dealer.reject': 'Bayi Reddedildi',
  'dealer.status': 'Bayi Durumu Değişti', 'product.update': 'Ürün Güncellendi',
  'stock.sync': 'Stok Senkronize Edildi', 'notify.send': 'Bildirim Gönderildi',
  'settings.update': 'Ayar Güncellendi',
}

const renderDiff = (diff?: Record<string, { from: unknown; to: unknown }>) => {
  if (!diff) return ''
  return Object.entries(diff).map(([k, v]) => `${k}: ${JSON.stringify(v.from)} → ${JSON.stringify(v.to)}`).join(' | ')
}

const filtered = computed(() => {
  let list = audit.items
  if (search.value) {
    const q = search.value.toLowerCase()
    list = list.filter(e =>
      (e.action && actionLabels[e.action]?.toLowerCase().includes(q)) ||
      (e.entity && e.entity.toLowerCase().includes(q)) ||
      (e.actorEmail && e.actorEmail.toLowerCase().includes(q)) ||
      (e.diff && renderDiff(e.diff).toLowerCase().includes(q))
    )
  }
  if (dateFrom.value) list = list.filter(e => new Date(e.createdAt) >= new Date(dateFrom.value))
  if (dateTo.value) list = list.filter(e => new Date(e.createdAt) <= new Date(dateTo.value + 'T23:59:59'))
  return list
})

function exportExcel() {
  try {
    const XLSX = (window as any).XLSX
    if (!XLSX) { toast.push('Excel kütüphanesi yüklenemedi', 'error'); return }
    const data = filtered.value.map(e => ({
      Tarih: formatDate(e.createdAt),
      Kullanıcı: e.actorEmail || '',
      Eylem: actionLabels[e.action] || e.action || '',
      Varlık: `${e.entity || ''}#${e.entityId || ''}`,
      Değişiklik: renderDiff(e.diff),
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Denetim')
    XLSX.writeFile(wb, `denetim-kaydi-${new Date().toISOString().slice(0, 10)}.xlsx`)
    toast.push('Dışa aktarıldı', 'success')
  } catch { toast.push('Dışa aktarma başarısız', 'error') }
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="Denetim Kaydı" description="Yönetici tarafından yapılan tüm değişiklikler kayıt altındadır.">
      <template #actions>
        <button @click="exportExcel" class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors">
          <Icon name="lucide:download" class="w-4 h-4" /> Excel
        </button>
      </template>
    </PageHeader>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-ink-200 p-4">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
        <select :value="audit.filter.entity ?? ''" @change="audit.setFilter('entity', ($event.target as HTMLSelectElement).value || null)" class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white">
          <option value="">Tüm Varlıklar</option>
          <option v-for="e in audit.distinctEntities" :key="e" :value="e">{{ e }}</option>
        </select>
        <select :value="audit.filter.action ?? ''" @change="audit.setFilter('action', ($event.target as HTMLSelectElement).value || null)" class="px-3 py-2 border border-ink-300 rounded-md text-sm bg-white">
          <option value="">Tüm Eylemler</option>
          <option v-for="a in audit.distinctActions" :key="a" :value="a">{{ actionLabels[a] ?? a }}</option>
        </select>
        <input v-model="dateFrom" type="date" class="px-3 py-2 border border-ink-300 rounded-md text-sm" placeholder="Başlangıç" />
        <input v-model="dateTo" type="date" class="px-3 py-2 border border-ink-300 rounded-md text-sm" placeholder="Bitiş" />
        <div class="relative">
          <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
          <input v-model="search" type="text" placeholder="Değişiklik içinde ara..." class="w-full pl-9 pr-3 py-2 border border-ink-300 rounded-md text-sm" />
        </div>
      </div>
    </div>

    <!-- Table -->
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
            <tr v-for="e in filtered" :key="e.id" class="hover:bg-ink-50">
              <td class="px-5 py-3 text-xs text-ink-600 whitespace-nowrap">{{ formatDate(e.createdAt) }}</td>
              <td class="px-5 py-3 text-sm text-ink-700">{{ e.actorEmail }}</td>
              <td class="px-5 py-3 text-sm font-medium text-ink-900">{{ actionLabels[e.action] ?? e.action }}</td>
              <td class="px-5 py-3 text-xs text-ink-600 font-mono">{{ e.entity }}#{{ e.entityId }}</td>
              <td class="px-5 py-3 text-xs text-ink-600 font-mono max-w-md truncate">{{ renderDiff(e.diff) }}</td>
            </tr>
          </tbody>
        </table>
        <EmptyState v-if="filtered.length === 0" icon="lucide:scroll" title="Denetim kaydı yok" description="Filtreleri değiştirmeyi deneyin." />
      </div>

      <!-- Pagination -->
      <div v-if="audit.totalPages > 1" class="px-4 border-t border-ink-200">
        <Pagination :page="audit.page" :total-pages="audit.totalPages" :total="audit.total" :page-size="50" @change="audit.load" />
      </div>
    </div>
  </div>
</template>
