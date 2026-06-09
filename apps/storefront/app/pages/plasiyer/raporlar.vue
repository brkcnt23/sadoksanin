<template>
  <div class="min-h-screen bg-ink-50 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <NuxtLink to="/plasiyer" class="text-primary-600 hover:text-primary-800 text-sm mb-4 inline-flex items-center gap-1">
        <Icon name="lucide:arrow-left" class="w-4 h-4" /> Panele Dön
      </NuxtLink>
      <h1 class="text-3xl font-bold text-ink-900 mb-2">Satış Raporlarım</h1>
      <p class="text-ink-600 mb-8">Performans ve ciro istatistikleriniz</p>

      <!-- Date Filter -->
      <div class="flex gap-3 mb-6">
        <input v-model="dateFrom" type="date" class="px-3 py-2 border border-ink-300 rounded-lg text-sm" />
        <input v-model="dateTo" type="date" class="px-3 py-2 border border-ink-300 rounded-lg text-sm" />
        <button @click="loadReports" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Getir</button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl border border-ink-200 p-5">
          <p class="text-ink-500 text-sm">Toplam Proforma</p>
          <p class="text-2xl font-bold text-primary-600">{{ dashboard?.totalProformas || 0 }}</p>
        </div>
        <div class="bg-white rounded-xl border border-ink-200 p-5">
          <p class="text-ink-500 text-sm">Onaylanan</p>
          <p class="text-2xl font-bold text-green-600">{{ dashboard?.approvedCount || 0 }}</p>
        </div>
        <div class="bg-white rounded-xl border border-ink-200 p-5">
          <p class="text-ink-500 text-sm">Toplam Ciro</p>
          <p class="text-2xl font-bold text-primary-600">{{ formatTL(dashboard?.totalAmount || 0) }}</p>
        </div>
        <div class="bg-white rounded-xl border border-ink-200 p-5">
          <p class="text-ink-500 text-sm">Dönüşüm Oranı</p>
          <p class="text-2xl font-bold text-amber-600">%{{ dashboard?.conversionRate || 0 }}</p>
        </div>
      </div>

      <!-- Sales Table -->
      <div class="bg-white rounded-xl border border-ink-200 p-6">
        <h2 class="font-semibold text-ink-900 mb-4">Satış Detayı</h2>
        <div v-if="loading" class="text-center py-8">Yükleniyor...</div>
        <div v-else-if="!salesData.length" class="text-center py-8 text-ink-500">Veri bulunamadı</div>
        <table v-else class="w-full text-sm">
          <thead class="bg-ink-100">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-ink-700">Dönem</th>
              <th class="px-4 py-3 text-right font-medium text-ink-700">Proforma</th>
              <th class="px-4 py-3 text-right font-medium text-ink-700">Ciro (TL)</th>
              <th class="px-4 py-3 text-right font-medium text-ink-700">Ortalama (TL)</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-ink-100">
              <td class="px-4 py-3 text-ink-900">Seçili Dönem</td>
              <td class="px-4 py-3 text-right text-ink-600">{{ salesData.length }}</td>
              <td class="px-4 py-3 text-right text-ink-600">{{ formatTL(salesData.reduce((s: number, x: any) => s + (x.totalAmount || 0), 0)) }}</td>
              <td class="px-4 py-3 text-right text-ink-600">{{ formatTL(salesData.length ? salesData.reduce((s: number, x: any) => s + (x.totalAmount || 0), 0) / salesData.length : 0) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({ middleware: 'plasiyer' })

const toast = useToast()
const loading = ref(true)
const dateFrom = ref('')
const dateTo = ref('')
const salesData = ref<any[]>([])
const dashboard = ref<any>(null)

const formatTL = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(v || 0)

const apiFetch = async (path: string) => {
  const token = localStorage.getItem('user-token')
  const base = useRuntimeConfig().public.apiBase.replace(/\/+$/, '')
  const res = await fetch(`${base}/api${path}`, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

const loadReports = async () => {
  loading.value = true
  try {
    let path = '/reports/plasiyer-sales'
    if (dateFrom.value) path += `?from=${dateFrom.value}`
    if (dateTo.value) path += `${dateFrom.value ? '&' : '?'}to=${dateTo.value}`
    salesData.value = await apiFetch(path)
    let dashPath = '/reports/plasiyer-dashboard'
    if (dateFrom.value) dashPath += `?from=${dateFrom.value}`
    if (dateTo.value) dashPath += `${dateFrom.value ? '&' : '?'}to=${dateTo.value}`
    const dash = await apiFetch(dashPath)
    dashboard.value = (dash || [])[0] || {}
  } catch (e: any) { toast.push(`Hata: ${e.message}`, 'error') }
  loading.value = false
}

onMounted(() => loadReports())
</script>
