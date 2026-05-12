<script setup lang="ts">
import { ref } from 'vue'
import type { ProductVariation } from '~/types'

interface Props {
  variations: ProductVariation[]
}

interface Emits {
  (e: 'update', variations: ProductVariation[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Note: No stores needed, all data is passed via props/emits

const newVar = ref({
  name: '',
  label: '',
  attributes: {} as Record<string, string>,
  price: '',
})

const editingId = ref<string | null>(null)
const editForm = ref<Partial<ProductVariation>>({})

const errors = ref<Record<string, string>>({})

// Generate a simple ID for new variations
const generateId = () => `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const addVariation = () => {
  errors.value = {}

  if (!newVar.value.name.trim()) {
    errors.value.name = 'Varyasyon adı gerekli (örn. "Renk")'
  }

  if (!newVar.value.label.trim()) {
    errors.value.label = 'Varyasyon değeri gerekli (örn. "Kırmızı")'
  }

  if (Object.keys(errors.value).length > 0) return

  const variation: ProductVariation = {
    id: generateId(),
    sku: `${newVar.value.name.toLowerCase()}-${newVar.value.label.toLowerCase()}`,
    label: newVar.value.label,
    attributes: { [newVar.value.name]: newVar.value.label },
    price: newVar.value.price ? Number(newVar.value.price) : undefined,
  } as ProductVariation

  emit('update', [...props.variations, variation])

  // Reset form
  newVar.value = {
    name: '',
    label: '',
    attributes: {},
    price: '',
  }
}

const startEdit = (variation: ProductVariation) => {
  editingId.value = variation.id
  editForm.value = { ...variation }
}

const cancelEdit = () => {
  editingId.value = null
  editForm.value = {}
}

const saveEdit = () => {
  if (!editingId.value) return

  const updated = props.variations.map((v) => (v.id === editingId.value ? { ...v, ...editForm.value } : v))
  emit('update', updated as ProductVariation[])

  cancelEdit()
}

const removeVariation = (id: string) => {
  emit('update', props.variations.filter((v) => v.id !== id))
}

// Format price for display
const formatPrice = (price?: number) => {
  if (!price) return '—'
  return price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}
</script>

<template>
  <div class="space-y-4">
    <h4 class="text-sm font-medium text-slate-900">Varyasyonlar</h4>

    <!-- Existing Variations Table -->
    <div v-if="variations.length > 0" class="overflow-x-auto border border-slate-200 rounded-lg">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr>
            <th class="px-4 py-2 text-xs font-semibold text-slate-700 text-left uppercase">Adı</th>
            <th class="px-4 py-2 text-xs font-semibold text-slate-700 text-left uppercase">Değeri</th>
            <th class="px-4 py-2 text-xs font-semibold text-slate-700 text-left uppercase">SKU</th>
            <th class="px-4 py-2 text-xs font-semibold text-slate-700 text-left uppercase">Fiyat Override</th>
            <th class="px-4 py-2 text-xs font-semibold text-slate-700 text-left uppercase">İşlemler</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          <tr v-for="(v, i) in variations" :key="v.id" class="hover:bg-slate-50">
            <td v-if="editingId === v.id" class="px-4 py-3">
              <input
                v-model="editForm.label"
                type="text"
                placeholder="Renk"
                class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              />
            </td>
            <td v-else class="px-4 py-3 text-sm font-medium text-slate-900">
              {{ Object.keys(v.attributes)[0] || 'Custom' }}
            </td>

            <td v-if="editingId === v.id" class="px-4 py-3">
              <input
                v-model="editForm.label"
                type="text"
                placeholder="Kırmızı"
                class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              />
            </td>
            <td v-else class="px-4 py-3 text-sm text-slate-700">{{ v.label }}</td>

            <td class="px-4 py-3 text-xs text-slate-500 font-mono">{{ v.sku }}</td>

            <td v-if="editingId === v.id" class="px-4 py-3">
              <input
                v-model.number="editForm.price"
                type="number"
                step="0.01"
                min="0"
                placeholder="—"
                class="w-full px-2 py-1 text-xs border border-slate-300 rounded"
              />
            </td>
            <td v-else class="px-4 py-3 text-sm text-slate-700">{{ formatPrice(v.price) }}</td>

            <td class="px-4 py-3 flex gap-1">
              <button
                v-if="editingId === v.id"
                @click="saveEdit"
                class="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
              >
                Kaydet
              </button>
              <button
                v-else
                @click="startEdit(v)"
                class="px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded"
              >
                Düzenle
              </button>

              <button
                v-if="editingId === v.id"
                @click="cancelEdit"
                class="px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded"
              >
                İptal
              </button>
              <button
                v-else
                @click="removeVariation(v.id)"
                class="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
              >
                Sil
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Add New Variation -->
    <div class="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
      <p class="text-xs font-medium text-slate-700">Yeni Varyasyon Ekle</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <input
            v-model="newVar.name"
            type="text"
            placeholder="Varyasyon Adı (örn. Renk)"
            class="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p v-if="errors.name" class="text-xs text-red-600 mt-0.5">{{ errors.name }}</p>
        </div>

        <div>
          <input
            v-model="newVar.label"
            type="text"
            placeholder="Değer (örn. Kırmızı)"
            class="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p v-if="errors.label" class="text-xs text-red-600 mt-0.5">{{ errors.label }}</p>
        </div>

        <div>
          <input
            v-model="newVar.price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Fiyat Override (İsteğe Bağlı)"
            class="w-full px-3 py-2 border border-slate-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          @click="addVariation"
          class="px-3 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded"
        >
          Ekle
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="variations.length === 0 && !Object.values(newVar).some((v) => v)" class="text-center py-4">
      <Icon name="lucide:layers" class="w-6 h-6 text-slate-300 mx-auto mb-2" />
      <p class="text-xs text-slate-500">Varyasyon yok (örn. renk, beden)</p>
    </div>
  </div>
</template>
