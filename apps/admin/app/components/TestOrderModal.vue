<script setup lang="ts">
import { formatPrice } from '~/utils/storage'
import { PROVINCES } from '~/utils/turkish-provinces'
import type { Product, Dealer } from '~/types'

interface Props {
  open: boolean
}
const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const api = useApi()
const toast = useToast()
const orders = useOrdersStore()
const products = useProductsStore()
const dealers = useDealersStore()

// ─── Form State ───────────────────────────────────────────────
const customerType = ref<'B2C' | 'B2B'>('B2C')
const dealerId = ref<string | null>(null)
const dealerSearch = ref('')
const selectedItems = ref<Array<{ productId: string; name: string; quantity: number; unitPrice: number; taxRate: number }>>([
  { productId: '', name: '', quantity: 1, unitPrice: 0, taxRate: 0.2 },
])
const shippingCity = ref('İstanbul')
const shippingAddress = ref('Test Adres, No: 1, İstanbul')
const cardNumber = ref('4111 1111 1111 1111')
const cardExpiry = ref('12/28')
const cardCvv = ref('123')
const cardHolder = ref('Test Kart')

const formatCardNumber = (e: Event) => {
  const input = e.target as HTMLInputElement
  let val = input.value.replace(/\D/g, '').slice(0, 16)
  cardNumber.value = val.replace(/(.{4})/g, '$1 ').trim()
}
const formatCardExpiry = (e: Event) => {
  const input = e.target as HTMLInputElement
  let val = input.value.replace(/\D/g, '')
  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4)
  cardExpiry.value = val
}

// ─── UI State ─────────────────────────────────────────────────
type Step = 'form' | 'creating' | 'paying' | 'done' | 'error'
const step = ref<Step>('form')
const submitting = ref(false)
const createdOrderNo = ref('')
const createdOrderId = ref('')
const paymentMessage = ref('')
const errorMessage = ref('')

// ─── Data ─────────────────────────────────────────────────────
const availableProducts = computed(() =>
  products.items.filter((p) => p.displayStock > 0 && p.purchasable),
)

const filteredDealers = computed(() => {
  const q = dealerSearch.value.trim().toLowerCase()
  if (!q) return dealers.items.filter((d) => d.status === 'active')
  return dealers.items.filter(
    (d) =>
      d.status === 'active' &&
      (d.name.toLowerCase().includes(q) ||
        d.cariNo.toLowerCase().includes(q) ||
        d.contactPerson.toLowerCase().includes(q)),
  )
})

const totalAmount = computed(() =>
  selectedItems.value.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
)

const formValid = computed(() => {
  if (customerType.value === 'B2B' && !dealerId.value) return false
  if (selectedItems.value.some((i) => !i.productId || i.quantity < 1)) return false
  if (!shippingCity.value || !shippingAddress.value.trim()) return false
  if (!cardNumber.value.trim() || !cardExpiry.value.trim() || !cardCvv.value.trim()) return false
  return true
})

// ─── Helpers ──────────────────────────────────────────────────
function updateProduct(index: number) {
  const item = selectedItems.value[index]
  const product = products.items.find((p) => p.id === item.productId)
  if (product) {
    item.name = product.name
    item.unitPrice = product.basePrice
    item.taxRate = product.taxRate ?? 0.2
    if (item.quantity > product.displayStock) {
      item.quantity = Math.max(1, product.displayStock)
    }
  }
}

function addItem() {
  selectedItems.value.push({ productId: '', name: '', quantity: 1, unitPrice: 0, taxRate: 0.2 })
}

function removeItem(index: number) {
  if (selectedItems.value.length > 1) {
    selectedItems.value.splice(index, 1)
  }
}

function selectDealer(d: Dealer) {
  dealerId.value = d.id
  dealerSearch.value = d.name
}

// ─── Submit ───────────────────────────────────────────────────
async function submit() {
  if (!formValid.value || submitting.value) return
  submitting.value = true
  errorMessage.value = ''

  try {
    // Ensure data is loaded
    if (!products.loaded) await products.load()
    if (!dealers.loaded) await dealers.load()

    // Step 1: Create order
    step.value = 'creating'
    const orderPayload = {
      items: selectedItems.value.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate,
      })),
      customerType: customerType.value,
      shippingCity: shippingCity.value,
      shippingAddress: shippingAddress.value.trim(),
      paymentMethod: 'CREDIT_CARD',
      ...(customerType.value === 'B2B' && dealerId.value ? { dealerId: dealerId.value } : {}),
    }

    const order = await api.post<any>('/orders', orderPayload)
    createdOrderNo.value = order.orderNo || order.id
    createdOrderId.value = order.id

    // Step 2: Pay
    step.value = 'paying'
    const payResult = await api.post<any>(`/orders/${order.id}/pay`, {
      cardNumber: cardNumber.value.replace(/\s/g, ''),
      expiry: cardExpiry.value,
      cvv: cardCvv.value,
      cardHolder: cardHolder.value,
    })

    paymentMessage.value = payResult.paymentMessage || 'Ödeme alındı.'

    // Refresh store
    await orders.load()

    step.value = 'done'
    toast.push(`✅ Test siparişi oluşturuldu: ${createdOrderNo.value}`, 'success')
  } catch (err: any) {
    step.value = 'error'
    errorMessage.value = err?.message || 'Beklenmeyen bir hata oluştu'
    toast.push(`❌ ${errorMessage.value}`, 'error')
  } finally {
    submitting.value = false
  }
}

function reset() {
  step.value = 'form'
  errorMessage.value = ''
  paymentMessage.value = ''
  createdOrderNo.value = ''
  createdOrderId.value = ''
}

// Reset when modal opens
watch(() => props.open, (v) => {
  if (v) {
    reset()
    // Pre-fill first product if available
    if (products.items.length > 0 && !selectedItems.value[0].productId) {
      const first = products.items.find((p) => p.displayStock > 0 && p.purchasable)
      if (first) {
        selectedItems.value[0] = {
          productId: first.id,
          name: first.name,
          quantity: 1,
          unitPrice: first.basePrice,
          taxRate: first.taxRate ?? 0.2,
        }
      }
    }
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Header -->
          <header class="px-6 py-4 border-b border-ink-200 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <Icon name="lucide:flask-conical" class="w-5 h-5 text-purple-600" />
              <h3 class="font-semibold text-ink-900">Test Siparişi Oluştur</h3>
            </div>
            <button
              @click="emit('close')"
              class="p-1.5 hover:bg-ink-100 rounded-md text-ink-500 transition-colors"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </header>

          <!-- Body -->
          <div class="flex-1 overflow-auto p-6">
            <!-- Step: Done -->
            <div v-if="step === 'done'" class="text-center py-8">
              <div class="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                <Icon name="lucide:check-circle" class="w-10 h-10 text-emerald-600" />
              </div>
              <p class="mt-4 text-lg font-semibold text-ink-900">Test siparişi başarıyla oluşturuldu!</p>
              <p class="mt-1 text-ink-500">
                Sipariş No: <span class="font-mono font-bold text-ink-900">{{ createdOrderNo }}</span>
              </p>
              <p class="text-sm text-ink-400 mt-1">{{ paymentMessage }}</p>
              <div class="mt-6 flex justify-center gap-3">
                <button
                  @click="emit('close'); reset()"
                  class="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>

            <!-- Step: Creating / Paying -->
            <div v-else-if="step === 'creating' || step === 'paying'" class="text-center py-12">
              <Icon name="lucide:loader-2" class="w-10 h-10 animate-spin mx-auto text-purple-600" />
              <p class="mt-4 text-ink-700 font-medium">
                {{ step === 'creating' ? 'Sipariş oluşturuluyor...' : 'Ödeme işleniyor...' }}
              </p>
              <p class="text-sm text-ink-400 mt-1">Bu işlem birkaç saniye sürebilir</p>
            </div>

            <!-- Step: Error -->
            <div v-else-if="step === 'error'" class="text-center py-8">
              <div class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Icon name="lucide:alert-circle" class="w-10 h-10 text-red-600" />
              </div>
              <p class="mt-4 text-lg font-semibold text-red-700">Hata Oluştu</p>
              <p class="mt-1 text-ink-500 max-w-md mx-auto">{{ errorMessage }}</p>
              <div class="mt-6 flex justify-center gap-3">
                <button
                  @click="step = 'form'"
                  class="px-5 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-semibold rounded-lg transition-colors"
                >
                  Geri Dön
                </button>
                <button
                  @click="emit('close'); reset()"
                  class="px-5 py-2.5 bg-ink-700 hover:bg-ink-800 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>

            <!-- Step: Form -->
            <div v-else class="space-y-6">
              <!-- 1. Customer Type -->
              <div>
                <label class="block text-sm font-medium text-ink-700 mb-2">Müşteri Tipi</label>
                <div class="flex gap-2">
                  <button
                    @click="customerType = 'B2C'"
                    :class="[
                      'px-4 py-2 rounded-lg text-sm font-semibold transition-colors border',
                      customerType === 'B2C'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-ink-200 text-ink-600 hover:bg-ink-50',
                    ]"
                  >
                    B2C (Bireysel)
                  </button>
                  <button
                    @click="customerType = 'B2B'"
                    :class="[
                      'px-4 py-2 rounded-lg text-sm font-semibold transition-colors border',
                      customerType === 'B2B'
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-white border-ink-200 text-ink-600 hover:bg-ink-50',
                    ]"
                  >
                    B2B (Bayi)
                  </button>
                </div>
              </div>

              <!-- 2. Dealer (B2B only) -->
              <div v-if="customerType === 'B2B'">
                <label class="block text-sm font-medium text-ink-700 mb-1">
                  Bayi <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="dealerSearch"
                  type="text"
                  placeholder="Bayi adı, cari no veya yetkili ile ara..."
                  class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm"
                />
                <div
                  v-if="dealerSearch && filteredDealers.length > 0"
                  class="mt-1 max-h-40 overflow-y-auto border border-ink-200 rounded-md bg-white shadow-sm"
                >
                  <div
                    v-for="d in filteredDealers"
                    :key="d.id"
                    @click="selectDealer(d)"
                    :class="[
                      'px-3 py-2 cursor-pointer text-sm hover:bg-ink-50 transition-colors border-b border-ink-100 last:border-0',
                      dealerId === d.id ? 'bg-amber-50 text-amber-800 font-medium' : 'text-ink-700',
                    ]"
                  >
                    <div>{{ d.name }}</div>
                    <div class="text-xs text-ink-400">Cari: {{ d.cariNo }} — {{ d.contactPerson }}</div>
                  </div>
                </div>
                <div
                  v-if="dealerSearch && filteredDealers.length === 0"
                  class="mt-1 text-xs text-ink-400 px-1"
                >
                  Bayi bulunamadı
                </div>
                <div v-if="dealerId" class="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-md px-3 py-1.5 text-sm text-amber-800">
                  <Icon name="lucide:check" class="w-4 h-4" />
                  Seçili bayi: {{ dealers.items.find(d => d.id === dealerId)?.name }}
                  <button @click="dealerId = null; dealerSearch = ''" class="ml-auto text-amber-600 hover:text-amber-800">
                    <Icon name="lucide:x" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- 3. Products -->
              <div>
                <label class="block text-sm font-medium text-ink-700 mb-2">Ürünler</label>
                <div class="space-y-2">
                  <div
                    v-for="(item, i) in selectedItems"
                    :key="i"
                    class="flex gap-2 items-start"
                  >
                    <select
                      v-model="item.productId"
                      @change="updateProduct(i)"
                      class="flex-1 px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
                    >
                      <option value="" disabled>Ürün seçin...</option>
                      <option
                        v-for="p in availableProducts"
                        :key="p.id"
                        :value="p.id"
                      >
                        {{ p.name }} ({{ p.sku }}) — Stok: {{ p.displayStock }}
                      </option>
                    </select>
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      class="w-20 px-3 py-2 border border-ink-300 rounded-md text-sm text-center"
                    />
                    <span class="w-28 text-right py-2 text-sm text-ink-600 font-mono">
                      {{ item.unitPrice > 0 ? formatPrice(item.quantity * item.unitPrice) : '—' }}
                    </span>
                    <button
                      v-if="selectedItems.length > 1"
                      @click="removeItem(i)"
                      class="p-2 text-ink-400 hover:text-red-600 transition-colors"
                    >
                      <Icon name="lucide:trash-2" class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <button
                  @click="addItem"
                  class="mt-2 text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                >
                  <Icon name="lucide:plus" class="w-3.5 h-3.5" />
                  Ürün Ekle
                </button>
              </div>

              <!-- 4. Shipping -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-ink-700 mb-1">Şehir</label>
                  <select
                    v-model="shippingCity"
                    class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
                  >
                    <option v-for="c in PROVINCES" :key="c" :value="c">{{ c }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-ink-700 mb-1">Adres</label>
                  <input
                    v-model="shippingAddress"
                    type="text"
                    class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm"
                  />
                </div>
              </div>

              <!-- 5. Card Info -->
              <fieldset class="border border-ink-200 rounded-lg p-4">
                <legend class="text-sm font-medium text-ink-700 px-2">
                  <Icon name="lucide:credit-card" class="w-4 h-4 inline mr-1" />
                  Kart Bilgileri (Test)
                </legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="col-span-2">
                    <label class="block text-xs text-ink-500 mb-0.5">Kart Numarası</label>
                    <input
                      :value="cardNumber"
                      @input="formatCardNumber"
                      type="text"
                      maxlength="19"
                      placeholder="0000 0000 0000 0000"
                      class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">Son Kullanma Tarihi</label>
                    <input
                      :value="cardExpiry"
                      @input="formatCardExpiry"
                      type="text"
                      maxlength="5"
                      placeholder="AA/YY"
                      class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">CVV</label>
                    <input
                      v-model="cardCvv"
                      type="text"
                      maxlength="4"
                      placeholder="123"
                      class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm font-mono"
                    />
                  </div>
                  <div class="col-span-2">
                    <label class="block text-xs text-ink-500 mb-0.5">Kart Üzerindeki İsim</label>
                    <input
                      v-model="cardHolder"
                      type="text"
                      placeholder="Test Kart"
                      class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm"
                    />
                  </div>
                </div>
                <p class="mt-2 text-xs text-ink-400">
                  Herhangi bir kart numarası kabul edilir. Demo kart (4111...) B2B siparişleri otomatik onaylar.
                </p>
              </fieldset>

              <!-- Total -->
              <div class="bg-ink-50 rounded-lg p-4 flex justify-between items-center">
                <span class="text-sm font-medium text-ink-600">Toplam Tutar</span>
                <span class="text-lg font-bold text-ink-900 font-mono">{{ formatPrice(totalAmount) }}</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <footer
            v-if="step === 'form'"
            class="px-6 py-4 border-t border-ink-200 bg-ink-50 shrink-0 flex justify-end gap-3"
          >
            <button
              @click="emit('close')"
              class="px-4 py-2.5 bg-white border border-ink-300 text-ink-700 text-sm font-medium rounded-lg hover:bg-ink-50 transition-colors"
            >
              İptal
            </button>
            <button
              @click="submit"
              :disabled="!formValid || submitting"
              class="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2"
            >
              <Icon name="lucide:flask-conical" class="w-4 h-4" />
              {{ submitting ? 'Gönderiliyor...' : 'Test Siparişi Oluştur ve Öde' }}
            </button>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
