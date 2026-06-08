<template>
  <div class="min-h-screen bg-ink-50 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-3xl font-bold text-ink-900 mb-2">Plasiyer Paneli</h1>
      <p class="text-ink-600 mb-8">Hoş geldiniz, {{ userName }}</p>

      <!-- KPI Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl border border-ink-200 p-5">
          <p class="text-ink-500 text-sm">Toplam Proforma</p>
          <p class="text-2xl font-bold text-primary-600">{{ stats.totalProformas }}</p>
        </div>
        <div class="bg-white rounded-xl border border-ink-200 p-5">
          <p class="text-ink-500 text-sm">Onay Bekleyen</p>
          <p class="text-2xl font-bold text-amber-600">{{ stats.pendingCount }}</p>
        </div>
        <div class="bg-white rounded-xl border border-ink-200 p-5">
          <p class="text-ink-500 text-sm">Onaylanan</p>
          <p class="text-2xl font-bold text-green-600">{{ stats.approvedCount }}</p>
        </div>
        <div class="bg-white rounded-xl border border-ink-200 p-5">
          <p class="text-ink-500 text-sm">Toplam Ciro</p>
          <p class="text-2xl font-bold text-primary-600">{{ formatTL(stats.totalAmount) }}</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <NuxtLink to="/plasiyer/proforma" class="bg-primary-600 hover:bg-primary-700 text-white rounded-xl p-6 flex items-center gap-4 transition-all hover:shadow-lg">
          <Icon name="lucide:file-plus" class="w-8 h-8" />
          <div><p class="font-semibold text-lg">Yeni Proforma</p><p class="text-primary-100 text-sm">Ürün seç, müşteri ekle, onaya gönder</p></div>
        </NuxtLink>
        <NuxtLink to="/plasiyer/proformalarim" class="bg-white border-2 border-ink-200 hover:border-primary-300 rounded-xl p-6 flex items-center gap-4 transition-all">
          <Icon name="lucide:file-text" class="w-8 h-8 text-ink-600" />
          <div><p class="font-semibold text-ink-900">Proformalarım</p><p class="text-ink-500 text-sm">Tüm proformalarını görüntüle</p></div>
        </NuxtLink>
        <NuxtLink to="/plasiyer/raporlar" class="bg-white border-2 border-ink-200 hover:border-primary-300 rounded-xl p-6 flex items-center gap-4 transition-all">
          <Icon name="lucide:bar-chart-3" class="w-8 h-8 text-ink-600" />
          <div><p class="font-semibold text-ink-900">Satış Raporlarım</p><p class="text-ink-500 text-sm">Performans ve ciro raporları</p></div>
        </NuxtLink>
      </div>

      <!-- Recent Proformas -->
      <div class="bg-white rounded-xl border border-ink-200 p-6">
        <h2 class="text-lg font-semibold text-ink-900 mb-4">Son Proformalar</h2>
        <div v-if="loading" class="text-center py-8 text-ink-500">Yükleniyor...</div>
        <div v-else-if="recentProformas.length === 0" class="text-center py-8 text-ink-500">
          Henüz proforma oluşturmadınız.
        </div>
        <table v-else class="w-full text-sm">
          <thead class="bg-ink-100 border-b border-ink-200">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-ink-700">No</th>
              <th class="px-4 py-3 text-left font-medium text-ink-700">Müşteri</th>
              <th class="px-4 py-3 text-right font-medium text-ink-700">Tutar</th>
              <th class="px-4 py-3 text-left font-medium text-ink-700">Durum</th>
              <th class="px-4 py-3 text-left font-medium text-ink-700">Tarih</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in recentProformas" :key="p.id" class="border-b border-ink-100 hover:bg-ink-50">
              <td class="px-4 py-3 font-medium text-ink-900">{{ p.proformaNumber }}</td>
              <td class="px-4 py-3 text-ink-600">{{ p.customerName }}</td>
              <td class="px-4 py-3 text-right text-ink-600">{{ formatTL(p.totalAmount) }}</td>
              <td class="px-4 py-3">
                <span :class="statusBadge(p.status)" class="px-2 py-1 rounded text-xs font-medium">{{ statusLabel(p.status) }}</span>
              </td>
              <td class="px-4 py-3 text-ink-500 text-xs">{{ formatDate(p.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ middleware: 'auth' })

const toast = useToast()
const userName = ref('')
const loading = ref(true)
const stats = ref({ totalProformas: 0, pendingCount: 0, approvedCount: 0, totalAmount: 0 })
const recentProformas = ref<any[]>([])

const statusLabel = (s: string) => ({ draft: 'Taslak', pending_approval: 'Onay Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' } as any)[s] || s
const statusBadge = (s: string) => ({
  draft: 'bg-ink-100 text-ink-700', pending_approval: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700',
} as any)[s] || 'bg-ink-100 text-ink-700'

const formatTL = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(v || 0)
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR') : '-'

const apiFetch = async (path: string) => {
  const token = localStorage.getItem('auth-token') || localStorage.getItem('admin-token')
  const base = useRuntimeConfig().public.apiBase.replace(/\/+$/, '')
  const res = await fetch(`${base}/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

onMounted(async () => {
  try {
    // Auth'dan kullanıcı bilgisi
    const me = await apiFetch('/auth/me')
    userName.value = me?.name || me?.email || ''

    // Proformalarım
    const proformas = await apiFetch('/proforma/my')
    recentProformas.value = (proformas || []).slice(0, 10)
    stats.value.totalProformas = recentProformas.value.length
    stats.value.pendingCount = recentProformas.value.filter((p: any) => p.status === 'pending_approval').length
    stats.value.approvedCount = recentProformas.value.filter((p: any) => p.status === 'approved').length
    stats.value.totalAmount = recentProformas.value
      .filter((p: any) => p.status === 'approved')
      .reduce((s: number, p: any) => s + Number(p.totalAmount || 0), 0)
  } catch (e: any) {
    toast.push(`Yükleme hatası: ${e.message}`, 'error')
  }
  loading.value = false
})
</script>
