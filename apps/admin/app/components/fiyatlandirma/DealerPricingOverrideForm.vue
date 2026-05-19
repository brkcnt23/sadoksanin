<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatPrice } from '~/utils/storage'
import type { DealerPricingOverride } from '~/types'

const pricing = usePricingStore()
const products = useProductsStore()
const dealers = useDealersStore()

onMounted(() => {
  if (!pricing.loaded) pricing.load()
  if (!products.loaded) products.load()
  if (!dealers.loaded) dealers.load()
})

// Form state for adding new override
const form = ref({
  dealerId: '',
  productId: '',
  customPrice: '',
  reason: '',
})

const errors = ref<Record<string, string>>({})
const loading = ref(false)

// Filter overrides: show only active (current date between validFrom and validUntil)
const activeOverrides = computed(() => {
  const now = Date.now()
  return pricing.overrides.filter((o) => {
    const validFrom = new Date(o.validFrom).getTime()
    const validUntil = o.validUntil ? new Date(o.validUntil).getTime() : Infinity
    return validFrom <= now && validUntil > now
  })
})

// Validation
const validate = (): boolean => {
  errors.value = {}

  if (!form.value.dealerId) {
    errors.value.dealerId = 'Bayi seçilmeli'
  }

  if (!form.value.productId) {
    errors.value.productId = 'Ürün seçilmeli'
  }

  if (!form.value.customPrice || isNaN(Number(form.value.customPrice))) {
    errors.value.customPrice = 'Fiyat gerekli ve sayı olmalı'
  }

  if (Number(form.value.customPrice) < 0) {
    errors.value.customPrice = 'Fiyat negatif olamaz'
  }

  // Check for duplicate (same dealer + product)
  if (form.value.dealerId && form.value.productId) {
    const duplicate = activeOverrides.value.find(
      (o) => o.dealerId === form.value.dealerId && o.productId === form.value.productId,
    )
    if (duplicate) {
      errors.value.productId = 'Bu bayi ve ürün için zaten bir istisna var'
    }
  }

  return Object.keys(errors.value).length === 0
}

const handleAdd = async () => {
  if (!validate()) return

  loading.value = true
  try {
    pricing.addOverride({
      dealerId: form.value.dealerId,
      productId: form.value.productId,
      customPrice: Number(form.value.customPrice),
      validFrom: new Date().toISOString(),
      validUntil: undefined,
      reason: form.value.reason,
    })

    // Reset form
    form.value = {
      dealerId: '',
      productId: '',
      customPrice: '',
      reason: '',
    }
    errors.value = {}
  } finally {
    loading.value = false
  }
}

const handleRemove = (id: string) => {
  if (confirm('Bu istisna silinsin mi?')) {
    pricing.removeOverride(id)
  }
}

// Get product name by ID
const getProductName = (productId: string) => {
  return products.items.find((p) => p.id === productId)?.name || 'Bilinmeyen Ürün'
}

// Get dealer name by ID
const getDealerName = (dealerId: string) => {
  return dealers.items.find((d) => d.id === dealerId)?.name || 'Bilinmeyen Bayi'
}
</script>

<template>
  <div class="bg-white rounded-xl border border-ink-200 overflow-hidden">
    <div class="px-5 py-4 border-b border-ink-200">
      <h3 class="font-semibold text-ink-900 flex items-center gap-2">
        <Icon name="lucide:user-cog" class="w-4 h-4 text-primary-600" />
        Bayi Bazlı Fiyat İstisnaları
      </h3>
    </div>

    <div class="p-5 space-y-6">
      <!-- Existing Overrides Table -->
      <div v-if="activeOverrides.length > 0">
        <h4 class="text-sm font-medium text-ink-900 mb-3">Mevcut İstisnalar</h4>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-ink-50 border-b border-ink-200 text-left">
              <tr>
                <th class="px-4 py-2 font-semibold text-xs text-ink-700 uppercase">Bayi</th>
                <th class="px-4 py-2 font-semibold text-xs text-ink-700 uppercase">Ürün</th>
                <th class="px-4 py-2 font-semibold text-xs text-ink-700 uppercase">Özel Fiyat</th>
                <th class="px-4 py-2 font-semibold text-xs text-ink-700 uppercase">Neden</th>
                <th class="px-4 py-2 font-semibold text-xs text-ink-700 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr v-for="override in activeOverrides" :key="override.id" class="hover:bg-ink-50">
                <td class="px-4 py-2 text-sm font-medium text-ink-900">{{ getDealerName(override.dealerId) }}</td>
                <td class="px-4 py-2 text-sm text-ink-700">{{ getProductName(override.productId) }}</td>
                <td class="px-4 py-2 text-sm font-semibold text-ink-900">{{ formatPrice(override.customPrice) }}</td>
                <td class="px-4 py-2 text-xs text-ink-600">{{ override.reason || '—' }}</td>
                <td class="px-4 py-2">
                  <button
                    @click="handleRemove(override.id)"
                    class="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                  >
                    Sil
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-6 pt-6 border-t border-ink-200" />
      </div>

      <!-- Add New Override Form -->
      <div>
        <h4 class="text-sm font-medium text-ink-900 mb-4">Yeni İstisna Ekle</h4>
        <div class="space-y-4">
          <!-- Dealer Selection -->
          <div>
            <label class="block text-sm font-medium text-ink-700 mb-1.5">Bayi *</label>
            <select
              v-model="form.dealerId"
              class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Bayi seçiniz</option>
              <option v-for="d in dealers.items" :key="d.id" :value="d.id">{{ d.name }} ({{ d.city }})</option>
            </select>
            <p v-if="errors.dealerId" class="text-xs text-red-600 mt-1">{{ errors.dealerId }}</p>
          </div>

          <!-- Product Selection -->
          <div>
            <label class="block text-sm font-medium text-ink-700 mb-1.5">Ürün *</label>
            <select
              v-model="form.productId"
              class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="">Ürün seçiniz</option>
              <option v-for="p in products.items" :key="p.id" :value="p.id">
                {{ p.name }} — {{ formatPrice(p.basePrice) }}
              </option>
            </select>
            <p v-if="errors.productId" class="text-xs text-red-600 mt-1">{{ errors.productId }}</p>
          </div>

          <!-- Custom Price -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">Özel Fiyat (₺) *</label>
              <input
                v-model="form.customPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p v-if="errors.customPrice" class="text-xs text-red-600 mt-1">{{ errors.customPrice }}</p>
            </div>

            <!-- Reason -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">Neden (İsteğe Bağlı)</label>
              <input
                v-model="form.reason"
                type="text"
                placeholder="örn. Toplu sipariş indirimi"
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <!-- Add Button -->
          <div class="pt-2">
            <button
              @click="handleAdd"
              :disabled="loading"
              class="w-full px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {{ loading ? 'Ekleniyor...' : 'İstisna Ekle' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="activeOverrides.length === 0" class="text-center py-8">
        <Icon name="lucide:user-cog" class="w-12 h-12 text-ink-300 mx-auto mb-3" />
        <p class="text-sm text-ink-500">Henüz aktif fiyat istisnası yok</p>
      </div>
    </div>
  </div>
</template>
