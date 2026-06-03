<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatPrice } from '~/utils/storage'
import { applyCurrencyFormatting } from '~/utils/excel-format'
import type { Currency, ExchangeRate } from '~/stores/forex'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Döviz & Kur Yönetimi | Sadöksan Admin',
})

const forex = useForexStore()
const products = useProductsStore()

// Pagination for products table
const forexPage = ref(1)
const forexPageSize = ref(30)
const forexPaginated = computed(() => {
  const start = (forexPage.value - 1) * forexPageSize.value
  return [...products.items].slice(start, start + forexPageSize.value)
})
const forexTotalPages = computed(() => Math.ceil(products.items.length / forexPageSize.value))

onMounted(() => {
  if (!forex.loaded) forex.load()
  if (!products.loaded) products.load()

  // Start auto-refresh of live rates every 15 minutes
  forex.startAutoRefresh(15)
})

// Exchange rate editing
const editingCurrencyId = ref<string | null>(null)
const editingRateValue = ref(0)

const startEditRate = (rate: ExchangeRate) => {
  editingCurrencyId.value = rate.id
  editingRateValue.value = rate.manualOverride ?? rate.liveRate ?? rate.rate
}

const saveRate = (rateId: string, currency: Currency) => {
  const rate = forex.exchangeRates.find((r) => r.id === rateId)
  if (rate && editingRateValue.value > 0) {
    forex.setManualRate(currency, editingRateValue.value)
    editingCurrencyId.value = null
  }
}

const cancelEditRate = () => {
  editingCurrencyId.value = null
}

const clearManualRate = (currency: Currency) => {
  forex.clearManualRate(currency)
}

// Apply rate to all products
const showApplyModal = ref(false)
const applyModalData = ref({
  currency: 'USD' as Currency,
  rate: 0,
})

const openApplyModal = (currency: Currency) => {
  const rate = forex.exchangeRates.find((r) => r.currency === currency)
  if (rate) {
    applyModalData.value.currency = currency
    applyModalData.value.rate = rate.manualOverride ?? rate.liveRate ?? rate.rate
    showApplyModal.value = true
  }
}

const applyRateToAll = () => {
  if (applyModalData.value.rate > 0) {
    forex.applyRateToAllProducts(applyModalData.value.currency, applyModalData.value.rate)
    showApplyModal.value = false
  }
}

// Currency pricing modal
const showCurrencyPricingModal = ref(false)
const selectedProduct = ref('')
const selectedCurrency = ref('USD' as Currency)
const currencyPrice = ref(0)

const openCurrencyPricingModal = (productId?: string, currency?: Currency) => {
  if (productId) {
    selectedProduct.value = productId
    selectedCurrency.value = currency || 'USD'
    const price = forex.getProductCurrencyPrice(productId, selectedCurrency.value)
    currencyPrice.value = price ?? 0
  }
  showCurrencyPricingModal.value = true
}

const saveCurrencyPrice = () => {
  if (selectedProduct.value && currencyPrice.value >= 0) {
    forex.setProductCurrencyPrice(selectedProduct.value, selectedCurrency.value, currencyPrice.value)
    showCurrencyPricingModal.value = false
    selectedProduct.value = ''
    currencyPrice.value = 0
  }
}

const getProductName = (productId: string) => {
  return products.items.find((p) => p.id === productId)?.name || 'Bilinmeyen Ürün'
}

const convertedPrice = computed(() => {
  const rate = forex.getExchangeRate(selectedCurrency.value)
  if (!rate || currencyPrice.value <= 0) return null
  return forex.convertToTRY(currencyPrice.value, selectedCurrency.value)
})

// Live rate fetching controls
const isRefreshing = ref(false)

const refreshLiveRates = async () => {
  isRefreshing.value = true
  try {
    await forex.fetchLiveRatesFromTCMB()
  } finally {
    isRefreshing.value = false
  }
}

// Excel export functions
const exportExchangeRates = async () => {
  const XLSX = await import('xlsx')
  const rows = forex.exchangeRates.map((rate) => ({
    'Döviz': rate.currency,
    'Canlı Kur': rate.liveRate ?? 0,
    'Manuel Kur': rate.manualOverride ?? '—',
    'Mevcut Kur': rate.manualOverride ?? rate.liveRate ?? rate.rate,
    'Kaynak': rate.source,
    'Son Güncelleme': new Date(rate.lastUpdated).toLocaleString('tr-TR'),
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  applyCurrencyFormatting(ws, Object.keys(rows[0] || {}))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Döviz Kurları')
  XLSX.writeFile(wb, `sadoksan-doviz-kurları-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

const exportProductCurrencyPrices = async () => {
  const XLSX = await import('xlsx')
  const rows = forex.productCurrencyPrices.map((pcp) => {
    const product = products.items.find((p) => p.id === pcp.productId)
    return {
      'Ürün Adı': product?.name || 'Bilinmeyen',
      'SKU': product?.sku || '—',
      'Döviz': pcp.currency,
      'Döviz Fiyatı': pcp.price,
      'TRY Karşılığı': forex.convertToTRY(pcp.price, pcp.currency as Currency) ?? 0,
      'Güncelleme Tarihi': new Date(pcp.updatedAt).toLocaleString('tr-TR'),
    }
  })
  const ws = XLSX.utils.json_to_sheet(rows)
  applyCurrencyFormatting(ws, Object.keys(rows[0] || {}))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Ürün Döviz Fiyatları')
  XLSX.writeFile(wb, `sadoksan-urun-doviz-fiyatlari-${new Date().toISOString().slice(0, 10)}.xlsx`)
}

</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="Döviz & Kur Yönetimi"
      description="Canlı döviz kurları, manuel kur override'ları ve ürün fiyatlandırması."
    />

    <!-- Live Rate Refresh Toolbar -->
    <div class="bg-white rounded-xl border border-ink-200 p-4">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p class="text-sm font-medium text-ink-900">Canlı Döviz Kurları</p>
          <p class="text-xs text-ink-500 mt-1">Türkiye Merkez Bankası (TCMB) verilerine dayalı</p>
        </div>
        <div class="flex gap-2 flex-wrap">
          <button
            @click="refreshLiveRates"
            :disabled="isRefreshing"
            class="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Icon name="lucide:refresh-cw" :class="['w-4 h-4', { 'animate-spin': isRefreshing }]" />
            {{ isRefreshing ? 'Yükleniyor...' : 'Kurları Yenile' }}
          </button>
          <button
            @click="exportExchangeRates"
            class="px-4 py-2 bg-ink-600 text-white text-sm font-medium rounded-lg hover:bg-ink-700 flex items-center gap-2"
          >
            <Icon name="lucide:download" class="w-4 h-4" />
            Kurları İndir
          </button>
          <button
            @click="exportProductCurrencyPrices"
            class="px-4 py-2 bg-ink-600 text-white text-sm font-medium rounded-lg hover:bg-ink-700 flex items-center gap-2"
          >
            <Icon name="lucide:download" class="w-4 h-4" />
            Ürün Fiyatlarını İndir
          </button>
        </div>
      </div>
    </div>

    <!-- Exchange Rates Management -->
    <div class="bg-white rounded-xl border border-ink-200">
      <div class="px-5 py-4 border-b border-ink-200 bg-gradient-to-r from-primary-50 to-transparent">
        <h3 class="font-semibold text-ink-900 flex items-center gap-2">
          <Icon name="lucide:trending-up" class="w-4 h-4 text-primary-600" />
          Döviz Kurları (TRY Karşılığı)
        </h3>
        <p class="text-xs text-ink-500 mt-1">
          Canlı kurlar otomatik güncellenebilir. Manuel kur belirlediğinizde, o kur kullanılır.
        </p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-ink-50 border-b border-ink-200">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Döviz</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Canlı Kur</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Manuel Kur</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Mevcut Kur</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Son Güncelleme</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr v-for="rate in forex.exchangeRates" :key="rate.id" class="hover:bg-ink-50">
              <td class="px-5 py-3 text-sm font-semibold text-ink-900">{{ rate.currency }}</td>
              <td class="px-5 py-3 text-sm text-ink-700">
                {{ rate.liveRate ? `₺${rate.liveRate.toFixed(2)}` : '—' }}
              </td>
              <td class="px-5 py-3 text-sm font-medium" :class="rate.manualOverride ? 'text-emerald-700' : 'text-ink-500'">
                {{ rate.manualOverride ? `₺${rate.manualOverride.toFixed(2)}` : '—' }}
              </td>
              <td v-if="editingCurrencyId === rate.id" class="px-5 py-3">
                <input
                  v-model.number="editingRateValue"
                  type="number"
                  step="0.01"
                  min="0"
                  class="w-full px-2 py-1 border border-ink-300 rounded text-sm"
                />
              </td>
              <td v-else class="px-5 py-3 text-sm font-bold text-ink-900">
                ₺{{ (rate.manualOverride ?? rate.liveRate ?? rate.rate).toFixed(2) }}
              </td>
              <td class="px-5 py-3 text-xs text-ink-500">
                {{ new Date(rate.lastUpdated).toLocaleString('tr-TR') }}
              </td>
              <td class="px-5 py-3 flex gap-1">
                <button
                  v-if="editingCurrencyId === rate.id"
                  @click="saveRate(rate.id, rate.currency)"
                  class="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
                >
                  Kaydet
                </button>
                <button
                  v-else
                  @click="startEditRate(rate)"
                  class="px-2 py-1 text-xs font-medium text-ink-700 hover:bg-ink-200 rounded"
                >
                  Düzenle
                </button>
                <button
                  v-if="editingCurrencyId === rate.id"
                  @click="cancelEditRate"
                  class="px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-200 rounded"
                >
                  İptal
                </button>
                <button
                  v-if="rate.manualOverride && editingCurrencyId !== rate.id"
                  @click="clearManualRate(rate.currency)"
                  class="px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded"
                  title="Canlı kura geri dön"
                >
                  Canlı Kura Dön
                </button>
                <button
                  v-if="editingCurrencyId !== rate.id"
                  @click="openApplyModal(rate.currency)"
                  class="px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded"
                  title="Bu kurı tüm ürünlere uygula"
                >
                  Tümüne Uygula
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Products with Currency Pricing -->
    <div class="bg-white rounded-xl border border-ink-200">
      <div class="px-5 py-4 border-b border-ink-200 bg-gradient-to-r from-emerald-50 to-transparent">
        <h3 class="font-semibold text-ink-900 flex items-center gap-2">
          <Icon name="lucide:package" class="w-4 h-4 text-emerald-600" />
          Ürün Döviz Fiyatlandırması
        </h3>
        <p class="text-xs text-ink-500 mt-1">Belirli ürünlere döviz cinsinden fiyat atayın. Sistem otomatik TRY'ye çevirir.</p>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-ink-50 border-b border-ink-200">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Ürün</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Temel Fiyat (TRY)</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Döviz Fiyatları</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr v-for="product in forexPaginated" :key="product.id" class="hover:bg-ink-50">
              <td class="px-5 py-3 text-sm font-medium text-ink-900">{{ product.name }}</td>
              <td class="px-5 py-3 text-sm text-ink-700">{{ formatPrice(product.basePrice) }}</td>
              <td class="px-5 py-3 text-xs text-ink-600">
                <span
                  v-for="(currency, idx) in forex.supportedCurrencies"
                  :key="currency"
                  class="inline-block mr-2"
                >
                  {{ currency }}: {{ forex.getProductCurrencyPrice(product.id, currency) ? forex.getProductCurrencyPrice(product.id, currency) : '—' }}
                  <span v-if="forex.getProductCurrencyPrice(product.id, currency)" class="text-ink-400">
                    (≈ {{ formatPrice(forex.convertToTRY(forex.getProductCurrencyPrice(product.id, currency)!, currency) || 0) }})
                  </span>
                </span>
              </td>
              <td class="px-5 py-3">
                <button
                  @click="openCurrencyPricingModal(product.id)"
                  class="px-2.5 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded"
                >
                  Fiyat Ekle/Düzenle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <EmptyState v-if="forexPaginated.length === 0 && products.loaded" icon="lucide:package" title="Ürün bulunamadı" />
    </div>

    <!-- Product pagination -->
    <div v-if="forexTotalPages > 1" class="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-ink-200">
      <p class="text-sm text-ink-500">{{ products.items.length }} ürün, sayfa {{ forexPage }}/{{ forexTotalPages }}</p>
      <div class="flex gap-2">
        <button @click="forexPage = Math.max(1, forexPage - 1)" :disabled="forexPage <= 1" class="px-3 py-1.5 text-sm border border-ink-200 rounded-md hover:bg-ink-50 disabled:opacity-50">Önceki</button>
        <button @click="forexPage = Math.min(forexTotalPages, forexPage + 1)" :disabled="forexPage >= forexTotalPages" class="px-3 py-1.5 text-sm border border-ink-200 rounded-md hover:bg-ink-50 disabled:opacity-50">Sonraki</button>
      </div>
    </div>

    <!-- Apply Rate Modal -->
    <Modal :open="showApplyModal" size="sm" title="Kur Tüm Ürünlere Uygula" @close="showApplyModal = false">
      <div class="p-4 space-y-4">
        <p class="text-sm text-ink-600">{{ applyModalData.currency }} kurunu (₺{{ applyModalData.rate.toFixed(2) }}) tüm ürünlere uygulayacaksınız.</p>
        <input v-model.number="applyModalData.rate" type="number" step="0.01" min="0" class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm" />
      </div>
      <template #footer>
        <div class="flex justify-end gap-2 p-4 border-t border-ink-100">
          <button @click="showApplyModal = false" class="px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 rounded-lg">İptal</button>
          <button @click="applyRateToAll" class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg">Uygula</button>
        </div>
      </template>
    </Modal>

    <!-- Currency Pricing Modal -->
    <Modal :open="showCurrencyPricingModal" size="md" title="Döviz Fiyat Ekle/Düzenle" @close="showCurrencyPricingModal = false">
      <div class="p-4 space-y-4">
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Ürün</label>
          <select v-model="selectedProduct" class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm bg-white">
            <option value="">Seçiniz</option>
            <option v-for="p in products.items" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Döviz Tipi</label>
          <select v-model="selectedCurrency" class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm bg-white">
            <option v-for="curr in forex.supportedCurrencies" :key="curr" :value="curr">{{ curr }}</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-ink-700 mb-1">Fiyat ({{ selectedCurrency }})</label>
          <input v-model.number="currencyPrice" type="number" step="0.01" min="0" class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm" />
        </div>
        <div v-if="convertedPrice !== null" class="p-3 bg-ink-50 rounded-lg">
          <p class="text-xs text-ink-600">TRY Karşılığı</p>
          <p class="text-lg font-bold text-ink-900">{{ formatPrice(convertedPrice) }}</p>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2 p-4 border-t border-ink-100">
          <button @click="showCurrencyPricingModal = false" class="px-4 py-2 text-sm text-ink-600 hover:bg-ink-50 rounded-lg">İptal</button>
          <button @click="saveCurrencyPrice" class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">Kaydet</button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
