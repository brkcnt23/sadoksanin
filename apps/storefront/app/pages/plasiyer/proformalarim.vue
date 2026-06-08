<template>
  <div class="min-h-screen bg-ink-50 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <NuxtLink to="/plasiyer" class="text-primary-600 hover:text-primary-800 text-sm mb-4 inline-flex items-center gap-1">
        <Icon name="lucide:arrow-left" class="w-4 h-4" /> Panele Dön
      </NuxtLink>
      <h1 class="text-3xl font-bold text-ink-900 mb-2">Proformalarım</h1>
      <p class="text-ink-600 mb-8">Oluşturduğunuz tüm proformalar</p>

      <!-- Filters -->
      <div class="flex gap-4 mb-6">
        <select v-model="filterStatus" class="px-4 py-2 border border-ink-300 rounded-lg text-sm">
          <option value="">Tümü</option>
          <option value="draft">Taslak</option>
          <option value="pending_approval">Onay Bekleyen</option>
          <option value="approved">Onaylanan</option>
          <option value="rejected">Reddedilen</option>
        </select>
      </div>

      <div v-if="loading" class="text-center py-12 text-ink-500">Yükleniyor...</div>
      <div v-else-if="filtered.length === 0" class="bg-white rounded-xl border border-ink-200 p-8 text-center text-ink-500">
        Proforma bulunamadı
      </div>
      <div v-else class="bg-white rounded-xl border border-ink-200 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-ink-100 border-b border-ink-200">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-ink-700">No</th>
              <th class="px-4 py-3 text-left font-medium text-ink-700">Müşteri</th>
              <th class="px-4 py-3 text-right font-medium text-ink-700">Tutar</th>
              <th class="px-4 py-3 text-left font-medium text-ink-700">Durum</th>
              <th class="px-4 py-3 text-left font-medium text-ink-700">Tarih</th>
              <th class="px-4 py-3 text-center font-medium text-ink-700">İşlem</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtered" :key="p.id" class="border-b border-ink-100 hover:bg-ink-50">
              <td class="px-4 py-3 font-medium text-ink-900">{{ p.proformaNumber }}</td>
              <td class="px-4 py-3 text-ink-600">{{ p.customerName }}</td>
              <td class="px-4 py-3 text-right text-ink-600">{{ formatTL(p.totalAmount) }}</td>
              <td class="px-4 py-3">
                <span :class="statusBadge(p.status)" class="px-2 py-1 rounded text-xs font-medium">{{ statusLabel(p.status) }}</span>
              </td>
              <td class="px-4 py-3 text-ink-500 text-xs">{{ formatDate(p.createdAt) }}</td>
              <td class="px-4 py-3 text-center">
                <button v-if="p.status === 'approved'" @click="downloadProforma(p.id)" class="text-primary-600 hover:text-primary-800 text-sm font-medium">
                  <Icon name="lucide:download" class="w-4 h-4 inline" /> İndir
                </button>
                <span v-else-if="p.status === 'rejected'" class="text-xs text-red-600" :title="p.rejectionReason">
                  Red: {{ (p.rejectionReason || '').slice(0, 30) }}...
                </span>
                <span v-else-if="p.status === 'pending_approval'" class="text-xs text-amber-600">Onay bekliyor</span>
                <span v-else class="text-xs text-ink-400">Taslak</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

definePageMeta({ middleware: 'auth' })

const toast = useToast()
const loading = ref(true)
const proformas = ref<any[]>([])
const filterStatus = ref('')

const filtered = computed(() => filterStatus.value ? proformas.value.filter(p => p.status === filterStatus.value) : proformas.value)

const statusLabel = (s: string) => ({ draft: 'Taslak', pending_approval: 'Onay Bekliyor', approved: 'Onaylandı', rejected: 'Reddedildi' } as any)[s] || s
const statusBadge = (s: string) => ({ draft: 'bg-ink-100 text-ink-700', pending_approval: 'bg-amber-100 text-amber-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' } as any)[s] || ''

const formatTL = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(v || 0)
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('tr-TR') : '-'

const apiFetch = async (path: string, opts: RequestInit = {}) => {
  const token = localStorage.getItem('auth-token') || localStorage.getItem('admin-token')
  const base = useRuntimeConfig().public.apiBase.replace(/\/+$/, '')
  const res = await fetch(`${base}/api${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const downloadProforma = async (id: string) => {
  try {
    const token = localStorage.getItem('auth-token') || localStorage.getItem('admin-token')
    const base = useRuntimeConfig().public.apiBase.replace(/\/+$/, '')
    const res = await fetch(`${base}/api/proforma/${id}/download`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any
      throw new Error(err.message || 'İndirme başarısız')
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `proforma-${id}.pdf`; a.click()
    URL.revokeObjectURL(url)
    toast.push('Proforma indirildi', 'success')
  } catch (e: any) { toast.push(e.message, 'error') }
}

onMounted(async () => {
  try {
    proformas.value = await apiFetch('/proforma/my')
  } catch (e: any) { toast.push(`Yükleme hatası: ${e.message}`, 'error') }
  loading.value = false
})
</script>
