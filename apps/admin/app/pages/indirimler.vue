<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api = useApi()
const toast = useToast()
const productsStore = useProductsStore()

interface Discount {
  id: string; type: 'PRODUCT' | 'CATEGORY' | 'BRAND'
  targetId: string; targetName: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number; isActive: boolean
  validFrom: string; validUntil?: string; createdAt: string
}

const items = ref<Discount[]>([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref<Discount | null>(null)
const targetSearch = ref('')

const form = ref({
  type: 'PRODUCT' as 'PRODUCT' | 'CATEGORY' | 'BRAND',
  targetId: '', targetName: '',
  discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
  value: 0, validUntil: '',
})

const typeLabels: Record<string, string> = { PRODUCT: 'Ürün', CATEGORY: 'Kategori', BRAND: 'Marka' }

// Autocomplete options based on form.type
const productOptions = computed(() => {
  const q = targetSearch.value.toLowerCase()
  return productsStore.items.filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)).slice(0, 50)
})

const categoryOptions = computed(() => {
  const q = targetSearch.value.toLowerCase()
  const cats = productsStore.categories || []
  // Flatten category tree
  function flatten(c: any[]): { id: string; name: string }[] {
    return c.flatMap(cat => [{ id: cat.id || cat.slug || cat.name, name: cat.name }, ...flatten(cat.children || [])])
  }
  const flat = flatten(cats)
  return flat.filter(c => c.name.toLowerCase().includes(q)).slice(0, 30)
})

const brandOptions = computed(() => {
  const q = targetSearch.value.toLowerCase()
  const brands = productsStore.brands || []
  return brands.filter((b: any) => b.name?.toLowerCase().includes(q)).slice(0, 30)
})

const showDropdown = ref(false)

function selectTarget(id: string, name: string) {
  form.value.targetId = id
  form.value.targetName = name
  targetSearch.value = name
  showDropdown.value = false
}

async function load() {
  loading.value = true
  try { items.value = await api.get<Discount[]>('/discounts') } catch { /* */ }
  loading.value = false
}

function openCreate() {
  editing.value = null
  form.value = { type: 'PRODUCT', targetId: '', targetName: '', discountType: 'PERCENTAGE', value: 0, validUntil: '' }
  targetSearch.value = ''
  showDropdown.value = false
  showModal.value = true
}

async function handleSave() {
  if (!form.value.targetId || !form.value.targetName) {
    toast.push('Lütfen bir hedef seçin', 'warning'); return
  }
  try {
    if (editing.value) {
      await api.patch(`/discounts/${editing.value.id}`, {
        value: form.value.value,
        validUntil: form.value.validUntil || undefined,
      })
      toast.push('İndirim güncellendi', 'success')
    } else {
      await api.post('/discounts', form.value)
      toast.push('İndirim oluşturuldu', 'success')
    }
    showModal.value = false
    await load()
  } catch (e: any) {
    toast.push(e.message || 'Hata oluştu', 'error')
  }
}

async function toggleActive(item: Discount) {
  try {
    await api.patch(`/discounts/${item.id}`, { isActive: !item.isActive })
    item.isActive = !item.isActive
  } catch { /* */ }
}

async function removeDiscount(id: string) {
  if (!confirm('İndirimi silmek istediğinize emin misiniz?')) return
  try {
    await api.delete(`/discounts/${id}`)
    items.value = items.value.filter(d => d.id !== id)
    toast.push('İndirim silindi', 'success')
  } catch { /* */ }
}

function formatValue(item: Discount) {
  if (item.discountType === 'PERCENTAGE') return `%${item.value}`
  return `${item.value.toFixed(2)} TL`
}

const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('tr-TR') : '—'

// Load product data for autocomplete
onMounted(async () => {
  await Promise.all([load(), productsStore.load().catch(() => {})])
})
</script>

<template>
  <div class="space-y-5">
    <PageHeader title="İndirim Yönetimi" description="Ürün, kategori ve marka bazlı indirim kampanyaları">
      <template #actions>
        <button class="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors" @click="openCreate">
          <Icon name="lucide:plus" class="w-4 h-4" /> Yeni İndirim
        </button>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-xl border border-ink-200 p-12 text-center text-ink-500">Yükleniyor...</div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-ink-200 overflow-hidden overflow-x-auto">
      <table class="w-full text-sm">
        <thead class="bg-ink-50 text-ink-500 text-xs uppercase tracking-wider">
          <tr>
            <th class="text-left px-4 py-3">Tür</th>
            <th class="text-left px-4 py-3">Hedef</th>
            <th class="text-left px-4 py-3">İndirim</th>
            <th class="text-left px-4 py-3">Geçerlilik</th>
            <th class="text-center px-4 py-3">Aktif</th>
            <th class="text-right px-4 py-3">İşlem</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id" class="border-t border-ink-100 hover:bg-ink-50/50">
            <td class="px-4 py-3">
              <StatusBadge
                :variant="item.type === 'PRODUCT' ? 'info' : item.type === 'CATEGORY' ? 'purple' : 'warning'"
                :label="typeLabels[item.type]"
              />
            </td>
            <td class="px-4 py-3 font-medium text-ink-900">{{ item.targetName }}</td>
            <td class="px-4 py-3"><span class="font-semibold text-green-700">{{ formatValue(item) }}</span></td>
            <td class="px-4 py-3 text-ink-500 text-xs">{{ formatDate(item.validFrom) }} → {{ formatDate(item.validUntil) }}</td>
            <td class="px-4 py-3 text-center">
              <button class="relative inline-flex h-6 w-10 items-center rounded-full transition-colors" :class="item.isActive ? 'bg-green-500' : 'bg-ink-300'" @click="toggleActive(item)">
                <span class="inline-block h-4 w-4 rounded-full bg-white transition-transform" :class="item.isActive ? 'translate-x-5' : 'translate-x-1'" />
              </button>
            </td>
            <td class="px-4 py-3 text-right">
              <button class="text-red-500 hover:text-red-700 text-xs font-medium transition-colors" @click="removeDiscount(item.id)">Sil</button>
            </td>
          </tr>
          <tr v-if="items.length === 0">
            <td colspan="6" class="px-4 py-12 text-center text-ink-400">Henüz hiç indirim tanımlanmamış.</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create/Edit Modal -->
    <Modal v-if="showModal" size="md" :title="editing ? 'İndirim Düzenle' : 'Yeni İndirim'" @close="showModal = false">
      <div class="space-y-4 p-4">
        <!-- Type -->
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">İndirim Türü</label>
          <select v-model="form.type" @change="targetSearch = ''; form.targetId = ''; form.targetName = ''; showDropdown = false" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm bg-white">
            <option value="PRODUCT">Ürün Bazlı</option>
            <option value="CATEGORY">Kategori Bazlı</option>
            <option value="BRAND">Marka Bazlı</option>
          </select>
        </div>

        <!-- Target search with autocomplete -->
        <div class="relative">
          <label class="block text-sm font-medium text-ink-700 mb-1">
            {{ form.type === 'PRODUCT' ? 'Ürün Ara' : form.type === 'CATEGORY' ? 'Kategori Ara' : 'Marka Ara' }}
          </label>
          <input
            v-model="targetSearch"
            @focus="showDropdown = true"
            @input="showDropdown = true"
            type="text"
            class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
            :placeholder="form.type === 'PRODUCT' ? 'Ürün adı veya SKU ile arayın...' : form.type === 'CATEGORY' ? 'Kategori adı ile arayın...' : 'Marka adı ile arayın...'"
          />
          <!-- Dropdown -->
          <div v-if="showDropdown && targetSearch" class="absolute z-20 w-full mt-1 bg-white border border-ink-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <template v-if="form.type === 'PRODUCT'">
              <div v-for="p in productOptions" :key="p.id" @click="selectTarget(p.id, p.name)" class="flex items-center justify-between px-3 py-2 hover:bg-ink-50 cursor-pointer text-sm">
                <span class="text-ink-900">{{ p.name }}</span>
                <span class="text-xs text-ink-400 font-mono">{{ p.sku }}</span>
              </div>
            </template>
            <template v-else-if="form.type === 'CATEGORY'">
              <div v-for="c in categoryOptions" :key="c.id" @click="selectTarget(c.id, c.name)" class="px-3 py-2 hover:bg-ink-50 cursor-pointer text-sm text-ink-900">{{ c.name }}</div>
            </template>
            <template v-else>
              <div v-for="b in brandOptions" :key="b.id || b.name" @click="selectTarget(b.id || b.name, b.name)" class="px-3 py-2 hover:bg-ink-50 cursor-pointer text-sm text-ink-900">{{ b.name }}</div>
            </template>
            <div v-if="(form.type === 'PRODUCT' && productOptions.length === 0) || (form.type === 'CATEGORY' && categoryOptions.length === 0) || (form.type === 'BRAND' && brandOptions.length === 0)" class="px-3 py-3 text-center text-xs text-ink-400">Sonuç bulunamadı</div>
          </div>
          <!-- Selected indicator -->
          <p v-if="form.targetName && !showDropdown" class="mt-1 text-xs text-emerald-600 flex items-center gap-1">
            <Icon name="lucide:check-circle" class="w-3.5 h-3.5" /> Seçildi: {{ form.targetName }}
          </p>
        </div>

        <!-- Discount Kind -->
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">İndirim Tipi</label>
          <select v-model="form.discountType" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm bg-white">
            <option value="PERCENTAGE">Yüzde (%)</option>
            <option value="FIXED_AMOUNT">Sabit Tutar (TL)</option>
          </select>
        </div>

        <!-- Value -->
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">{{ form.discountType === 'PERCENTAGE' ? 'Yüzde Değeri' : 'Tutar (TL)' }}</label>
          <input v-model.number="form.value" type="number" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" :placeholder="form.discountType === 'PERCENTAGE' ? '20' : '100'" min="0" />
        </div>

        <!-- Valid Until -->
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Bitiş Tarihi (opsiyonel)</label>
          <input v-model="form.validUntil" type="date" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3 p-4 border-t border-ink-100">
          <button class="px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 rounded-lg transition-colors" @click="showModal = false">İptal</button>
          <button class="px-4 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold" @click="handleSave">{{ editing ? 'Güncelle' : 'Oluştur' }}</button>
        </div>
      </template>
    </Modal>
  </div>
</template>
