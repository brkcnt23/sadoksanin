<template>
  <div class="min-h-screen bg-ink-50 py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <NuxtLink to="/plasiyer" class="text-primary-600 hover:text-primary-800 text-sm mb-4 inline-flex items-center gap-1">
        <Icon name="lucide:arrow-left" class="w-4 h-4" /> Panele Dön
      </NuxtLink>
      <h1 class="text-3xl font-bold text-ink-900 mb-2">Yeni Proforma</h1>
      <p class="text-ink-600 mb-8">Ürün seçin, müşteri bilgisi girin ve onaya gönderin. Fiyatlar otomatik hesaplanır.</p>

      <div class="bg-white rounded-xl border border-ink-200 p-6 mb-6">
        <h2 class="font-semibold text-ink-900 mb-4">Müşteri Bilgisi</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-ink-700 mb-1">Müşteri Adı *</label>
            <input v-model="customerName" class="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Firma adı" />
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-700 mb-1">Telefon</label>
            <input v-model="customerPhone" class="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="05XX XXX XX XX" />
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-700 mb-1">Şehir</label>
            <input v-model="customerCity" class="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="İstanbul" />
          </div>
          <div>
            <label class="block text-sm font-medium text-ink-700 mb-1">Adres</label>
            <input v-model="customerAddress" class="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-primary-500" placeholder="Açık adres" />
          </div>
        </div>
      </div>

      <!-- Products -->
      <div class="bg-white rounded-xl border border-ink-200 p-6 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="font-semibold text-ink-900">Ürünler</h2>
          <button @click="showProductSearch = !showProductSearch" class="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center gap-1">
            <Icon name="lucide:plus" class="w-4 h-4" /> Ürün Ekle
          </button>
        </div>

        <!-- Product Search -->
        <div v-if="showProductSearch" class="mb-4 p-4 bg-ink-50 rounded-lg">
          <input v-model="productSearch" @input="searchProducts" class="w-full px-4 py-2 border border-ink-300 rounded-lg mb-3" placeholder="Ürün adı veya SKU ara..." />
          <div v-if="searchResults.length" class="space-y-2 max-h-60 overflow-y-auto">
            <div v-for="p in searchResults" :key="p.sku"
              @click="addItem(p)"
              class="flex items-center justify-between p-3 bg-white rounded-lg border border-ink-100 hover:border-primary-300 cursor-pointer">
              <div>
                <p class="font-medium text-ink-900">{{ p.name }}</p>
                <p class="text-xs text-ink-500">{{ p.sku }} · {{ p.brand }} · {{ formatTL(p.basePrice) }}</p>
              </div>
              <Icon name="lucide:plus-circle" class="w-5 h-5 text-primary-600" />
            </div>
          </div>
        </div>

        <!-- Item List -->
        <div v-if="items.length === 0" class="text-center py-8 text-ink-500">Henüz ürün eklenmedi</div>
        <table v-else class="w-full text-sm">
          <thead class="bg-ink-100">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-ink-700">Ürün</th>
              <th class="px-4 py-3 text-right font-medium text-ink-700">Birim Fiyat</th>
              <th class="px-4 py-3 text-right font-medium text-ink-700">Adet</th>
              <th class="px-4 py-3 text-right font-medium text-ink-700">Toplam</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, i) in items" :key="i" class="border-b border-ink-100">
              <td class="px-4 py-3 text-ink-900">{{ item.description }}</td>
              <td class="px-4 py-3 text-right text-ink-500">{{ formatTL(item.price) }}</td>
              <td class="px-4 py-3 text-right">
                <input v-model.number="item.quantity" type="number" min="1" class="w-20 text-right px-2 py-1 border border-ink-300 rounded" />
              </td>
              <td class="px-4 py-3 text-right font-medium text-ink-900">{{ formatTL(item.quantity * item.price) }}</td>
              <td class="px-4 py-3 text-right">
                <button @click="items.splice(i, 1)" class="text-red-500 hover:text-red-700"><Icon name="lucide:trash-2" class="w-4 h-4" /></button>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="items.length" class="text-right mt-4 text-lg font-bold text-ink-900">
          Toplam: {{ formatTL(items.reduce((s, i) => s + i.quantity * i.price, 0)) }}
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-4">
        <button @click="saveDraft" :disabled="saving" class="flex-1 bg-ink-600 hover:bg-ink-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50">
          {{ saving ? 'Kaydediliyor...' : 'Taslak Olarak Kaydet' }}
        </button>
        <button @click="submitForApproval" :disabled="saving || items.length === 0 || !customerName" class="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50">
          Onaya Gönder
        </button>
      </div>
      <p class="text-xs text-ink-400 mt-2 text-center">
        ⚠️ Fiyatlar sistem tarafından belirlenir, değiştirilemez. Proforma admin onayından sonra indirilebilir.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({ middleware: 'auth' })

const toast = useToast()
const router = useRouter()

const customerName = ref('')
const customerPhone = ref('')
const customerCity = ref('')
const customerAddress = ref('')
const items = ref<any[]>([])
const saving = ref(false)
const showProductSearch = ref(false)
const productSearch = ref('')
const searchResults = ref<any[]>([])

const formatTL = (v: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 0 }).format(v || 0)

const apiFetch = async (path: string, opts: RequestInit = {}) => {
  const token = localStorage.getItem('auth-token') || localStorage.getItem('admin-token')
  const base = useRuntimeConfig().public.apiBase.replace(/\/+$/, '')
  const res = await fetch(`${base}/api${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...opts.headers },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || `HTTP ${res.status}`)
  return res.json()
}

const searchProducts = async () => {
  const q = productSearch.value.trim()
  if (q.length < 2) { searchResults.value = []; return }
  try {
    const data = await apiFetch(`/proforma/products/search?q=${encodeURIComponent(q)}&limit=10`)
    searchResults.value = (data || []).map((p: any) => ({
      sku: p.sku, description: p.name, brand: p.brand || '', price: p.basePrice, imageUrl: p.imageUrl || '',
    }))
  } catch {}
}

const addItem = (p: any) => {
  items.value.push({ sku: p.sku, description: p.description, brand: p.brand, price: p.price, quantity: 1, imageUrl: p.imageUrl })
  showProductSearch.value = false
  productSearch.value = ''
  searchResults.value = []
}

const saveDraft = async () => {
  if (!customerName.value) { toast.push('Müşteri adı zorunludur', 'error'); return }
  saving.value = true
  try {
    const draft = await apiFetch('/proforma/create', {
      method: 'POST',
      body: JSON.stringify({ templateType: 'LOCAL', customer: customerName.value, items: items.value }),
    })
    toast.push('Taslak kaydedildi', 'success')
    router.push('/plasiyer')
  } catch (e: any) { toast.push(e.message, 'error') }
  saving.value = false
}

const submitForApproval = async () => {
  if (!customerName.value) { toast.push('Müşteri adı zorunludur', 'error'); return }
  if (items.value.length === 0) { toast.push('En az bir ürün ekleyin', 'error'); return }
  saving.value = true
  try {
    const draft = await apiFetch('/proforma/create', {
      method: 'POST',
      body: JSON.stringify({ templateType: 'LOCAL', customer: customerName.value, items: items.value }),
    })
    await apiFetch(`/proforma/${draft.id}/submit`, { method: 'PATCH' })
    toast.push('Proforma onaya gönderildi!', 'success')
    router.push('/plasiyer/proformalarim')
  } catch (e: any) { toast.push(e.message, 'error') }
  saving.value = false
}
</script>
