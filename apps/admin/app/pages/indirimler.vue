<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api = useApi()
const toast = useToast()

interface Discount {
  id: string
  type: 'PRODUCT' | 'CATEGORY' | 'BRAND'
  targetId: string
  targetName: string
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT'
  value: number
  isActive: boolean
  validFrom: string
  validUntil?: string
  createdAt: string
}

const items = ref<Discount[]>([])
const loading = ref(true)
const showModal = ref(false)
const editing = ref<Discount | null>(null)

const form = ref({
  type: 'PRODUCT' as 'PRODUCT' | 'CATEGORY' | 'BRAND',
  targetId: '',
  targetName: '',
  discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
  value: 0,
  validUntil: '',
})

const typeLabels: Record<string, string> = { PRODUCT: 'Ürün', CATEGORY: 'Kategori', BRAND: 'Marka' }
const kindLabels: Record<string, string> = { PERCENTAGE: 'Yüzde (%)', FIXED_AMOUNT: 'Sabit Tutar (TL)' }

async function load() {
  loading.value = true
  try {
    items.value = await api.get<Discount[]>('/discounts')
  } catch { /* silent */ }
  loading.value = false
}

function openCreate() {
  editing.value = null
  form.value = { type: 'PRODUCT', targetId: '', targetName: '', discountType: 'PERCENTAGE', value: 0, validUntil: '' }
  showModal.value = true
}

async function handleSave() {
  try {
    if (editing.value) {
      await api.patch(`/discounts/${editing.value.id}`, {
        isActive: form.value.validUntil ? undefined : undefined,
        value: form.value.value,
        validUntil: form.value.validUntil || undefined,
      })
      toast.push?.('İndirim güncellendi', 'success')
    } else {
      await api.post('/discounts', form.value)
      toast.push?.('İndirim oluşturuldu', 'success')
    }
    showModal.value = false
    await load()
  } catch (e: any) {
    toast.push?.(e.message || 'Hata oluştu', 'error')
  }
}

async function toggleActive(item: Discount) {
  try {
    await api.patch(`/discounts/${item.id}`, { isActive: !item.isActive })
    item.isActive = !item.isActive
  } catch { /* silent */ }
}

async function removeDiscount(id: string) {
  if (!confirm('İndirimi silmek istediğinize emin misiniz?')) return
  try {
    await api.delete(`/discounts/${id}`)
    items.value = items.value.filter((d) => d.id !== id)
    toast.push?.('İndirim silindi', 'success')
  } catch { /* silent */ }
}

function formatValue(item: Discount) {
  if (item.discountType === 'PERCENTAGE') return `%${item.value}`
  return `${item.value.toFixed(2)} TL`
}

const formatDate = (d?: string) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('tr-TR')
}

onMounted(load)
</script>

<template>
  <div class="p-6 max-w-6xl mx-auto">
    <PageHeader title="İndirim Yönetimi" description="Ürün, kategori ve marka bazlı indirim kampanyaları">
      <template #actions>
        <button class="btn-primary px-4 py-2 rounded-lg text-sm font-semibold" @click="openCreate">
          + Yeni İndirim
        </button>
      </template>
    </PageHeader>

    <!-- Table -->
    <div class="mt-6 bg-white rounded-xl border border-ink-200 overflow-hidden">
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
          <tr
            v-for="item in items"
            :key="item.id"
            class="border-t border-ink-100 hover:bg-ink-50/50 transition-colors"
          >
            <td class="px-4 py-3">
              <span
                class="inline-flex px-2 py-0.5 rounded text-xs font-semibold"
                :class="{
                  'bg-blue-100 text-blue-700': item.type === 'PRODUCT',
                  'bg-purple-100 text-purple-700': item.type === 'CATEGORY',
                  'bg-amber-100 text-amber-700': item.type === 'BRAND',
                }"
              >
                {{ typeLabels[item.type] }}
              </span>
            </td>
            <td class="px-4 py-3 font-medium text-ink-900">{{ item.targetName }}</td>
            <td class="px-4 py-3">
              <span class="font-semibold text-green-700">{{ formatValue(item) }}</span>
            </td>
            <td class="px-4 py-3 text-ink-500 text-xs">
              {{ formatDate(item.validFrom) }} → {{ formatDate(item.validUntil) }}
            </td>
            <td class="px-4 py-3 text-center">
              <button
                class="relative inline-flex h-6 w-10 items-center rounded-full transition-colors"
                :class="item.isActive ? 'bg-green-500' : 'bg-ink-300'"
                @click="toggleActive(item)"
              >
                <span
                  class="inline-block h-4 w-4 rounded-full bg-white transition-transform"
                  :class="item.isActive ? 'translate-x-5' : 'translate-x-1'"
                />
              </button>
            </td>
            <td class="px-4 py-3 text-right">
              <button
                class="text-red-500 hover:text-red-700 text-xs font-medium transition-colors"
                @click="removeDiscount(item.id)"
              >
                Sil
              </button>
            </td>
          </tr>
          <tr v-if="items.length === 0 && !loading">
            <td colspan="6" class="px-4 py-12 text-center text-ink-400">
              Henüz hiç indirim tanımlanmamış.
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Modal -->
    <Modal v-if="showModal" size="md" :title="editing ? 'İndirim Düzenle' : 'Yeni İndirim'" @close="showModal = false">
      <div class="space-y-4 p-4">
        <!-- Type -->
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">İndirim Türü</label>
          <select v-model="form.type" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm">
            <option value="PRODUCT">Ürün Bazlı</option>
            <option value="CATEGORY">Kategori Bazlı</option>
            <option value="BRAND">Marka Bazlı</option>
          </select>
        </div>

        <!-- Target ID -->
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">
            {{ form.type === 'PRODUCT' ? 'Ürün ID' : form.type === 'CATEGORY' ? 'Kategori Slug' : 'Marka Slug' }}
          </label>
          <input
            v-model="form.targetId"
            type="text"
            class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
            :placeholder="form.type === 'PRODUCT' ? 'örn: cmpe05n4l00015lo8qgogqskg' : 'örn: seramik'"
          />
        </div>

        <!-- Target Name (display) -->
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Görünen Ad</label>
          <input v-model="form.targetName" type="text" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" placeholder="örn: AKGÜN Seramik" />
        </div>

        <!-- Discount Kind -->
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">İndirim Tipi</label>
          <select v-model="form.discountType" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm">
            <option value="PERCENTAGE">Yüzde (%)</option>
            <option value="FIXED_AMOUNT">Sabit Tutar (TL)</option>
          </select>
        </div>

        <!-- Value -->
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">
            {{ form.discountType === 'PERCENTAGE' ? 'Yüzde Değeri' : 'Tutar (TL)' }}
          </label>
          <input
            v-model.number="form.value"
            type="number"
            class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm"
            :placeholder="form.discountType === 'PERCENTAGE' ? '20' : '100'"
            min="0"
          />
        </div>

        <!-- Valid Until -->
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Bitiş Tarihi (opsiyonel)</label>
          <input v-model="form.validUntil" type="date" class="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm" />
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3 p-4 border-t border-ink-100">
          <button class="px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 rounded-lg transition-colors" @click="showModal = false">
            İptal
          </button>
          <button class="px-4 py-2 text-sm bg-primary-900 text-white rounded-lg hover:bg-primary-800 transition-colors font-semibold" @click="handleSave">
            {{ editing ? 'Güncelle' : 'Oluştur' }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>
