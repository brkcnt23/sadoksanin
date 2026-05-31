<script setup lang="ts">
const props = defineProps<{ mode: 'entry' | 'exit' }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const productsStore = useProductsStore()
const stock = useStockStore()
const toast = useToast()

const productId = ref('')
const quantity = ref<number | null>(null)
const note = ref('')
const exitType = ref<'MANUAL_EXIT' | 'DAMAGE_LOSS'>('MANUAL_EXIT')
const saving = ref(false)
const search = ref('')

const filteredProducts = computed(() => {
  if (!search.value) return productsStore.items.slice(0, 50)
  const q = search.value.toLowerCase()
  return productsStore.items
    .filter((p: any) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
    .slice(0, 50)
})

const selectedProduct = computed(() => productsStore.items.find((p: any) => p.id === productId.value))
const maxStock = computed(() => selectedProduct.value?.netsisStock ?? 0)
const canSave = computed(() =>
  productId.value &&
  quantity.value && quantity.value > 0 &&
  (props.mode === 'entry' || quantity.value <= maxStock.value) &&
  note.value.length >= 10 &&
  !saving.value
)

const save = async () => {
  if (!canSave.value || !quantity.value) return
  saving.value = true
  try {
    if (props.mode === 'entry') {
      await stock.manualEntry(productId.value, quantity.value, note.value)
      toast.push?.('Stok girişi yapıldı', 'success')
    } else {
      await stock.manualExit(productId.value, quantity.value, exitType.value, note.value)
      toast.push?.('Stok çıkışı yapıldı', 'success')
    }
    productsStore.loaded = false
    await productsStore.load()
    emit('saved')
    emit('close')
  } catch (err: any) {
    toast.push?.(err.message || 'İşlem başarısız', 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/30" @click="emit('close')" />
    <div class="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
      <h3 class="font-semibold text-lg text-ink-900 mb-4">
        {{ mode === 'entry' ? 'Stok Girişi' : 'Stok Çıkışı' }}
      </h3>

      <div class="space-y-4">
        <div v-if="mode === 'exit'">
          <label class="block text-sm font-medium text-ink-700 mb-1">Çıkış Tipi</label>
          <select v-model="exitType" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm">
            <option value="MANUAL_EXIT">Manuel Çıkış</option>
            <option value="DAMAGE_LOSS">Fire / Hasar / Kayıp</option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Ürün</label>
          <input
            v-model="search"
            type="text"
            placeholder="SKU veya ürün adı ile ara..."
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm mb-2"
          />
          <select v-model="productId" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" size="6">
            <option v-for="p in filteredProducts" :key="p.id" :value="p.id">
              {{ p.sku }} — {{ p.name }} ({{ p.netsisStock }} {{ p.unit }})
            </option>
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">
            Miktar
            <span v-if="selectedProduct" class="text-ink-400">({{ selectedProduct.unit }})</span>
            <span v-if="mode === 'exit' && selectedProduct" class="text-ink-400 ml-1">
              — Max: {{ maxStock }}
            </span>
          </label>
          <input v-model.number="quantity" type="number" min="1" :max="mode === 'exit' ? maxStock : undefined"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm"
            :class="{ 'border-red-400': quantity && mode === 'exit' && quantity > maxStock }" />
          <p v-if="quantity && mode === 'exit' && quantity > maxStock" class="text-xs text-red-500 mt-1">
            Mevcut stoktan fazla çıkış yapılamaz
          </p>
        </div>

        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Açıklama (min 10 karakter)</label>
          <textarea v-model="note" rows="3" maxlength="500"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm resize-none"
            :class="{ 'border-red-400': note && note.length < 10 }" />
          <p class="text-xs text-ink-400 mt-1 text-right">{{ note.length }}/500</p>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button @click="emit('close')" class="px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 rounded-md">
          İptal
        </button>
        <button @click="save" :disabled="!canSave"
          class="px-4 py-2 text-sm font-medium text-white rounded-md"
          :class="canSave ? 'bg-primary-600 hover:bg-primary-700' : 'bg-ink-300 cursor-not-allowed'">
          {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
        </button>
      </div>
    </div>
  </div>
</template>
