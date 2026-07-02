<script setup lang="ts">
import type { Product } from '~/types'

interface Props {
  open: boolean
  product: Product | null // null = create
}
const props = defineProps<Props>()
const emit = defineEmits<{ close: []; saved: [product: Product] }>()

const products = useProductsStore()

const empty = (): Product => ({
  id: '',
  netsisCode: '',
  sku: '',
  name: '',
  brand: 'AKGÜN',
  category: '',
  description: '',
  images: [],
  basePrice: 0,
  taxRate: 0.2,
  unit: 'm²',
  visible: true,
  purchasable: true,
  netsisStock: 0,
  reservedStock: 0,
  displayStock: 0,
  lastNetsisSync: new Date().toISOString(),
  syncStatus: 'never',
  variations: [],
  minimumStock: 0,
  middleStock: undefined,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

const form = ref<Product>(empty())

watch(
  () => [props.open, props.product],
  () => {
    if (props.open) {
      form.value = props.product ? { ...props.product } : empty()
    }
  },
  { immediate: true },
)

const saving = ref(false)
const error = ref<string | null>(null)

// Cascading category select
const selectedParent = ref('')
const selectedSubCategoryId = ref<string | null>(null)
const subcategories = computed(() => {
  if (!selectedParent.value) return []
  const parent = products.allCategories.find((c) => c.name === selectedParent.value)
  return parent?.children || []
})

// Initialize selectedParent from existing category value
watch(
  () => [props.open, products.allCategories] as const,
  ([isOpen, categories]) => {
    if (isOpen && categories.length > 0 && props.product?.category) {
      // Find which parent contains this category
      for (const parent of categories) {
        if (parent.name === props.product.category) {
          selectedParent.value = parent.name
          return
        }
        if (parent.children?.some((c) => c.name === props.product.category)) {
          selectedParent.value = parent.name
          // Set sub-category if product has a sub-category assigned
          const child = parent.children.find((c) => c.name === props.product!.category)
          if (child) selectedSubCategoryId.value = child.id
          return
        }
      }
    } else if (isOpen && !props.product) {
      selectedParent.value = ''
      selectedSubCategoryId.value = null
    }
  },
  { immediate: true },
)

// Varyasyonları backend ile senkronize et (create/update/delete diff)
const syncVariations = async (productId: string) => {
  const original = props.product?.variations || []
  const current = form.value.variations || []
  const originalIds = new Set(original.map((v) => v.id))
  const currentIds = new Set(current.map((v) => v.id))

  // Silinenler: orijinalde var, şimdi yok
  for (const v of original) {
    if (!currentIds.has(v.id)) {
      await products.deleteVariation(productId, v.id)
    }
  }

  // Yeni eklenenler (id 'var-' ile başlıyor = client-generated temp id) ve değişenler
  for (const v of current) {
    const isNew = v.id.startsWith('var-') || !originalIds.has(v.id)
    const payload = {
      sku: v.sku,
      label: v.label,
      attributes: v.attributes,
      price: v.price,
      stock: v.stock,
      images: v.images || [],
    }
    if (isNew) {
      await products.createVariation(productId, payload)
    } else {
      const orig = original.find((o) => o.id === v.id)
      const changed =
        !orig ||
        orig.label !== v.label ||
        orig.price !== v.price ||
        orig.stock !== v.stock ||
        JSON.stringify(orig.attributes) !== JSON.stringify(v.attributes) ||
        JSON.stringify(orig.images || []) !== JSON.stringify(v.images || [])
      if (changed) {
        await products.updateVariation(productId, v.id, payload)
      }
    }
  }
}

const save = async () => {
  if (!form.value.name.trim() || !form.value.sku.trim()) {
    error.value = 'Ürün adı ve SKU zorunludur'
    return
  }
  // minimumStock is required
  if (form.value.minimumStock === undefined || form.value.minimumStock === null) {
    error.value = 'Minimum stok seviyesi zorunludur!'
    return
  }

  saving.value = true
  error.value = null

  try {
    let productId: string
    if (props.product) {
      // Update existing product
      const updated = await products.update(props.product.id, {
        name: form.value.name,
        sku: form.value.sku,
        netsisCode: form.value.netsisCode,
        brand: form.value.brand,
        category: form.value.category,
        categoryId: (form.value as any).categoryId || undefined,
        basePrice: form.value.basePrice,
        taxRate: form.value.taxRate,
        unit: form.value.unit,
        netsisStock: form.value.netsisStock,
        minimumStock: form.value.minimumStock,
        middleStock: form.value.middleStock,
        description: form.value.description,
        visible: form.value.visible,
        purchasable: form.value.purchasable,
        imageUrl: form.value.images?.[0] || undefined,
        images: form.value.images?.length ? JSON.stringify(form.value.images) : undefined,
      })
      productId = updated.id
    } else {
      // Create new product
      const created = await products.create({
        name: form.value.name,
        sku: form.value.sku,
        netsisCode: form.value.netsisCode || form.value.sku,
        brand: form.value.brand,
        category: form.value.category,
        categoryId: (form.value as any).categoryId || undefined,
        basePrice: form.value.basePrice,
        taxRate: form.value.taxRate,
        unit: form.value.unit,
        netsisStock: form.value.netsisStock,
        minimumStock: form.value.minimumStock,
        middleStock: form.value.middleStock,
        description: form.value.description,
        visible: form.value.visible,
        purchasable: form.value.purchasable,
        imageUrl: form.value.images?.[0] || undefined,
        images: form.value.images?.length ? JSON.stringify(form.value.images) : undefined,
      })
      productId = created.id
    }

    await syncVariations(productId)

    emit('saved', form.value)
    emit('close')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Bir hata oluştu'
    console.error('Save failed:', err)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Modal :open="open" :title="product ? 'Ürünü Düzenle' : 'Yeni Ürün'" size="lg" @close="emit('close')">
    <div class="p-6 space-y-5">
      <!-- Error Message -->
      <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
        {{ error }}
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Ürün Adı *</label>
          <input
            v-model="form.name"
            type="text"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">SKU *</label>
          <input
            v-model="form.sku"
            type="text"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Netsis Kodu</label>
          <input
            v-model="form.netsisCode"
            type="text"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Marka</label>
          <select
            v-model="form.brand"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Marka Seçin</option>
            <option v-for="b in products.allBrands" :key="b" :value="b">{{ b }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Kategori</label>
          <select
            v-model="selectedParent"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 mb-2"
            @change="form.category = ''; selectedSubCategoryId = null; (form as any).categoryId = undefined"
          >
            <option value="">Ana Kategori Seçin</option>
            <option v-for="c in products.allCategories" :key="c.id" :value="c.name">{{ c.name }}</option>
          </select>
          <select
            v-if="selectedParent && subcategories.length > 0"
            v-model="selectedSubCategoryId"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            @change="(e: any) => { const child = subcategories.find(c => c.id === e.target.value); if (child) { form.category = child.name; (form as any).categoryId = child.id; } }"
          >
            <option value="">Alt Kategori Seçin</option>
            <option v-for="child in subcategories" :key="child.id" :value="child.name">{{ child.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Birim</label>
          <select
            v-model="form.unit"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option>m²</option>
            <option>adet</option>
            <option>kg</option>
            <option>m³</option>
            <option>kutu</option>
            <option>paket</option>
            <option>koli</option>
            <option>takım</option>
            <option>set</option>
            <option>torba</option>
            <option>metre</option>
            <option>litre</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Birim Fiyat (KDV Hariç)</label>
          <input
            v-model.number="form.basePrice"
            type="number"
            step="0.01"
            min="0"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">KDV Oranı</label>
          <select
            v-model.number="form.taxRate"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option :value="0">%0</option>
            <option :value="0.01">%1</option>
            <option :value="0.1">%10</option>
            <option :value="0.2">%20</option>
          </select>
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Netsis Stok</label>
          <input
            v-model.number="form.netsisStock"
            type="number"
            min="0"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Rezerve (Bekleyen Sipariş)</label>
          <input
            :value="form.reservedStock"
            type="number"
            disabled
            class="w-full px-3 py-2 border border-ink-200 bg-ink-50 rounded-md text-sm text-ink-500"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Minimum Stok Seviyesi * <span class="text-red-600">(Zorunlu)</span></label>
          <input
            v-model.number="form.minimumStock"
            type="number"
            min="0"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="Kırmızı uyarı (kritik) için eşik..."
          />
          <p class="text-xs text-ink-500 mt-1">Bu seviye altında kırmızı uyarı görülür</p>
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Orta Stok Seviyesi <span class="text-ink-400">(İsteğe Bağlı)</span></label>
          <input
            v-model.number="form.middleStock"
            type="number"
            min="0"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            placeholder="Turuncu uyarı (orta) için eşik..."
          />
          <p class="text-xs text-ink-500 mt-1">Bu seviye ve minimum arasında turuncu uyarı görülür. Boş bırakılırsa sadece kırmızı/yeşil olur</p>
        </div>
      </div>

      <div>
        <label class="block text-xs font-medium text-ink-700 mb-1">Açıklama</label>
        <textarea
          v-model="form.description"
          rows="2"
          class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-ink-200">
        <label class="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-ink-200 cursor-pointer hover:bg-ink-50">
          <input v-model="form.visible" type="checkbox" class="w-4 h-4 rounded text-primary-600" />
          <div class="flex-1">
            <p class="text-sm font-medium text-ink-900">Katalogda Görünsün</p>
            <p class="text-xs text-ink-500">Storefront'ta listelensin mi?</p>
          </div>
        </label>
        <label class="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-ink-200 cursor-pointer hover:bg-ink-50">
          <input v-model="form.purchasable" type="checkbox" class="w-4 h-4 rounded text-primary-600" />
          <div class="flex-1">
            <p class="text-sm font-medium text-ink-900">Sepete Eklenebilir</p>
            <p class="text-xs text-ink-500">Müşteri satın alabilsin mi?</p>
          </div>
        </label>
      </div>

      <!-- Image Upload -->
      <div class="pt-4 border-t border-ink-200">
        <UiImageUploadZone
          :model-value="form.images"
          label="Ürün Görselleri"
          @update:model-value="(images) => (form.images = images)"
        />
      </div>

      <!-- Variations Editor -->
      <div class="pt-4 border-t border-ink-200">
        <ProductsProductVariationEditor
          :variations="form.variations"
          @update="(vars) => (form.variations = vars)"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <button
          @click="emit('close')"
          :disabled="saving"
          class="px-4 py-2 text-sm font-medium text-ink-700 hover:bg-ink-100 rounded-md disabled:opacity-50"
        >
          İptal
        </button>
        <button
          @click="save"
          :disabled="saving"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md disabled:opacity-50"
        >
          <span v-if="saving" class="inline-block mr-2">⏳</span>
          {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
        </button>
      </div>
    </template>
  </Modal>
</template>
