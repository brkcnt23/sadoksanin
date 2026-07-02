<script setup lang="ts">
import { ref, computed } from 'vue'
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

const generateId = () => `var-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

const slugify = (str: string) =>
  str
    .toString()
    .trim()
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

// ═══════════════════════════════════════════════════════════════════
// Hızlı Ekle (tek varyasyon, tek özellik)
// ═══════════════════════════════════════════════════════════════════

const newVar = ref({
  name: '',
  label: '',
  attributes: {} as Record<string, string>,
  price: '',
  images: [] as string[],
})

const quickErrors = ref<Record<string, string>>({})

const addVariation = () => {
  quickErrors.value = {}

  if (!newVar.value.name.trim()) {
    quickErrors.value.name = 'Varyasyon adı gerekli (örn. "Renk")'
  }
  if (!newVar.value.label.trim()) {
    quickErrors.value.label = 'Varyasyon değeri gerekli (örn. "Kırmızı")'
  }
  if (Object.keys(quickErrors.value).length > 0) return

  const variation: ProductVariation = {
    id: generateId(),
    sku: `${slugify(newVar.value.name)}-${slugify(newVar.value.label)}`,
    label: newVar.value.label,
    attributes: { [newVar.value.name]: newVar.value.label },
    price: newVar.value.price ? Number(newVar.value.price) : undefined,
    stock: 0,
    images: newVar.value.images.length ? [...newVar.value.images] : undefined,
  } as ProductVariation

  emit('update', [...props.variations, variation])

  newVar.value = { name: '', label: '', attributes: {}, price: '', images: [] }
}

// ═══════════════════════════════════════════════════════════════════
// Varyant Tipi Tanımla + Grid ile Toplu Üret
// ═══════════════════════════════════════════════════════════════════

interface Axis {
  id: string
  name: string
  valuesText: string // virgülle ayrılmış, kullanıcı yazarken kolay
}

const axes = ref<Axis[]>([])
const presetNames = ['Renk', 'Ebat', 'Desen', 'Özel']

const addAxis = (presetName?: string) => {
  axes.value.push({
    id: generateId(),
    name: presetName && presetName !== 'Özel' ? presetName : '',
    valuesText: '',
  })
}

const removeAxis = (id: string) => {
  axes.value = axes.value.filter((a) => a.id !== id)
}

// Her eksenin değer listesi (virgülle ayrılmış metinden)
const axisValues = (axis: Axis) =>
  axis.valuesText
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)

const validAxes = computed(() => axes.value.filter((a) => a.name.trim() && axisValues(a).length > 0))

// Kartezyen çarpım: [{Renk:[Kırmızı,Mavi]},{Ebat:[60x60,60x120]}] -> 4 kombinasyon
const combinations = computed(() => {
  if (validAxes.value.length === 0) return []
  return validAxes.value.reduce<Record<string, string>[]>(
    (acc, axis) => {
      const values = axisValues(axis)
      const result: Record<string, string>[] = []
      for (const combo of acc) {
        for (const val of values) {
          result.push({ ...combo, [axis.name]: val })
        }
      }
      return result
    },
    [{}],
  )
})

const existingComboKeys = computed(
  () => new Set(props.variations.map((v) => JSON.stringify(Object.entries(v.attributes).sort()))),
)

const newCombosCount = computed(
  () => combinations.value.filter((c) => !existingComboKeys.value.has(JSON.stringify(Object.entries(c).sort())))
    .length,
)

const generateVariants = () => {
  if (combinations.value.length === 0) return

  const baseSku = props.variations.length ? '' : '' // ürün SKU'su modal'dan gelmiyor, sadece attribute slug kullanılır
  const toAdd: ProductVariation[] = []

  for (const combo of combinations.value) {
    const key = JSON.stringify(Object.entries(combo).sort())
    if (existingComboKeys.value.has(key)) continue // zaten var, atla (mükerrer oluşturma)

    const label = Object.values(combo).join(' / ')
    const sku = Object.entries(combo)
      .map(([, v]) => slugify(v))
      .join('-')

    toAdd.push({
      id: generateId(),
      sku: baseSku + sku,
      label,
      attributes: combo,
      price: undefined,
      stock: 0,
      images: undefined,
    } as ProductVariation)
  }

  if (toAdd.length === 0) return
  emit('update', [...props.variations, ...toAdd])

  // Eksen tanımlarını temizle (varyantlar oluşturuldu)
  axes.value = []
}

// ═══════════════════════════════════════════════════════════════════
// Mevcut varyasyonlar: düzenle / sil
// ═══════════════════════════════════════════════════════════════════

const editingId = ref<string | null>(null)
const editForm = ref<Partial<ProductVariation>>({})

const startEdit = (variation: ProductVariation) => {
  editingId.value = variation.id
  editForm.value = { ...variation, images: variation.images ? [...variation.images] : [] }
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

const formatPrice = (price?: number) => {
  if (!price) return '—'
  return price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })
}

const attributeBadges = (v: ProductVariation) => Object.entries(v.attributes || {})
</script>

<template>
  <div class="space-y-5">
    <h4 class="text-sm font-medium text-ink-900">Varyasyonlar</h4>

    <!-- ═══ Mevcut Varyasyonlar Tablosu ═══ -->
    <div v-if="variations.length > 0" class="overflow-x-auto border border-ink-200 rounded-lg">
      <table class="w-full text-sm">
        <thead class="bg-ink-50 border-b border-ink-200">
          <tr>
            <th class="px-3 py-2 text-xs font-semibold text-ink-700 text-left uppercase">Görsel</th>
            <th class="px-3 py-2 text-xs font-semibold text-ink-700 text-left uppercase">Özellikler</th>
            <th class="px-3 py-2 text-xs font-semibold text-ink-700 text-left uppercase">SKU</th>
            <th class="px-3 py-2 text-xs font-semibold text-ink-700 text-left uppercase">Fiyat Override</th>
            <th class="px-3 py-2 text-xs font-semibold text-ink-700 text-left uppercase">Stok</th>
            <th class="px-3 py-2 text-xs font-semibold text-ink-700 text-left uppercase">İşlemler</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-ink-100">
          <template v-for="v in variations" :key="v.id">
            <tr class="hover:bg-ink-50">
              <td class="px-3 py-3">
                <div class="flex items-center gap-1">
                  <img
                    v-if="v.images?.length"
                    :src="v.images[0]"
                    class="w-8 h-8 rounded object-cover border border-ink-200"
                  />
                  <span v-if="v.images?.length" class="text-xs text-ink-400">{{ v.images.length }}</span>
                  <span v-else class="text-xs text-ink-300">—</span>
                </div>
              </td>

              <td class="px-3 py-3">
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="[k, val] in attributeBadges(v)"
                    :key="k"
                    class="inline-block px-1.5 py-0.5 text-xs bg-ink-100 text-ink-700 rounded"
                  >
                    {{ k }}: {{ val }}
                  </span>
                </div>
              </td>

              <td class="px-3 py-3 text-xs text-ink-500 font-mono">{{ v.sku }}</td>

              <td v-if="editingId === v.id" class="px-3 py-3">
                <input
                  v-model.number="editForm.price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="—"
                  class="w-24 px-2 py-1 text-xs border border-ink-300 rounded"
                />
              </td>
              <td v-else class="px-3 py-3 text-sm text-ink-700">{{ formatPrice(v.price) }}</td>

              <td v-if="editingId === v.id" class="px-3 py-3">
                <input
                  v-model.number="editForm.stock"
                  type="number"
                  min="0"
                  class="w-20 px-2 py-1 text-xs border border-ink-300 rounded"
                />
              </td>
              <td v-else class="px-3 py-3 text-sm text-ink-700">{{ v.stock ?? 0 }}</td>

              <td class="px-3 py-3">
                <div class="flex gap-1">
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
                    class="px-2 py-1 text-xs font-medium text-ink-700 hover:bg-ink-200 rounded"
                  >
                    Düzenle
                  </button>

                  <button
                    v-if="editingId === v.id"
                    @click="cancelEdit"
                    class="px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-200 rounded"
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
                </div>
              </td>
            </tr>
            <!-- Düzenleme modunda: görsel yükleme satırı -->
            <tr v-if="editingId === v.id" class="bg-ink-50">
              <td colspan="6" class="px-3 py-3">
                <UiImageUploadZone
                  :model-value="editForm.images"
                  label="Varyasyon Görselleri"
                  @update:model-value="(imgs) => (editForm.images = imgs)"
                />
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center py-4 border border-dashed border-ink-200 rounded-lg">
      <Icon name="lucide:layers" class="w-6 h-6 text-ink-300 mx-auto mb-2" />
      <p class="text-xs text-ink-500">Henüz varyasyon yok</p>
    </div>

    <!-- ═══ Varyant Tipi Tanımla + Grid ile Toplu Üret ═══ -->
    <div class="bg-primary-50/40 border border-primary-200 rounded-lg p-4 space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold text-ink-800">🧩 Varyant Tipi Tanımla (Toplu Oluştur)</p>
      </div>
      <p class="text-xs text-ink-500">
        Önce özellik ekle (örn. Renk, Ebat), her özelliğe değerleri virgülle yaz. Sistem tüm kombinasyonları otomatik oluşturur.
      </p>

      <!-- Preset butonlar -->
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="p in presetNames"
          :key="p"
          @click="addAxis(p)"
          class="px-2.5 py-1 text-xs font-medium text-primary-700 bg-white border border-primary-300 rounded-full hover:bg-primary-100"
        >
          + {{ p }}
        </button>
      </div>

      <!-- Tanımlı eksenler -->
      <div v-if="axes.length > 0" class="space-y-2">
        <div v-for="axis in axes" :key="axis.id" class="flex items-center gap-2 bg-white border border-ink-200 rounded-md p-2">
          <input
            v-model="axis.name"
            type="text"
            placeholder="Özellik adı (örn. Renk)"
            class="w-32 flex-shrink-0 px-2 py-1.5 text-xs border border-ink-300 rounded"
          />
          <input
            v-model="axis.valuesText"
            type="text"
            placeholder="Değerler, virgülle ayır (örn. Kırmızı, Mavi, Yeşil)"
            class="flex-1 px-2 py-1.5 text-xs border border-ink-300 rounded"
          />
          <button @click="removeAxis(axis.id)" class="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded flex-shrink-0">
            ✕
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between gap-3 pt-1">
        <p v-if="validAxes.length > 0" class="text-xs text-ink-600">
          <strong>{{ combinations.length }}</strong> kombinasyon
          <span v-if="newCombosCount !== combinations.length">
            (<strong class="text-primary-700">{{ newCombosCount }}</strong> yeni, {{ combinations.length - newCombosCount }} zaten mevcut)
          </span>
          oluşturulacak
        </p>
        <p v-else class="text-xs text-ink-400">Özellik ekleyip değer gir</p>

        <button
          @click="generateVariants"
          :disabled="newCombosCount === 0"
          class="px-3 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          Varyantları Oluştur
        </button>
      </div>
    </div>

    <!-- ═══ Hızlı Ekle (tek varyasyon) ═══ -->
    <div class="bg-ink-50 border border-ink-200 rounded-lg p-4 space-y-3">
      <p class="text-xs font-medium text-ink-700">Hızlı Ekle (Tek / Özel Varyasyon)</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <input
            v-model="newVar.name"
            type="text"
            placeholder="Varyasyon Adı (örn. Renk)"
            class="w-full px-3 py-2 border border-ink-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p v-if="quickErrors.name" class="text-xs text-red-600 mt-0.5">{{ quickErrors.name }}</p>
        </div>

        <div>
          <input
            v-model="newVar.label"
            type="text"
            placeholder="Değer (örn. Kırmızı)"
            class="w-full px-3 py-2 border border-ink-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <p v-if="quickErrors.label" class="text-xs text-red-600 mt-0.5">{{ quickErrors.label }}</p>
        </div>

        <div>
          <input
            v-model="newVar.price"
            type="number"
            step="0.01"
            min="0"
            placeholder="Fiyat Override (İsteğe Bağlı)"
            class="w-full px-3 py-2 border border-ink-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <button
          @click="addVariation"
          class="px-3 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded"
        >
          Ekle
        </button>
      </div>

      <UiImageUploadZone
        :model-value="newVar.images"
        label="Varyasyon Görselleri (İsteğe Bağlı)"
        @update:model-value="(imgs) => (newVar.images = imgs)"
      />
    </div>
  </div>
</template>
