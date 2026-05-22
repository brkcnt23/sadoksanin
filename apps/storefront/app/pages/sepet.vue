<script setup lang="ts">
import { useCart } from '~/composables/useCart'
import { useDealer } from '~/composables/useDealer'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'

definePageMeta({
  title: 'Sepetim | SADÖKSAN',
})

const { items, calculateTotals, removeItem, updateQuantity, clear, placeOrder, loadCart } = useCart()
const { isDealer, dealer } = useDealer()
const { getIsAuthenticated, getUser } = useAuth()

const isLoading = ref(false)
const checkoutStep = ref<'cart' | 'review' | 'complete'>('cart')
const lastOrder = ref<any>(null)
const paymentMethod = ref<'bank-transfer' | 'credit-card' | 'installment'>('bank-transfer')
const cardForm = ref({ cardNumber: '', expiry: '', cvv: '', cardHolder: '' })

const formatExpiry = (e: Event) => {
  const input = e.target as HTMLInputElement
  let val = input.value.replace(/\D/g, '')
  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4)
  cardForm.value.expiry = val
}
const checkoutError = ref<string | null>(null)
const shippingCity = ref('')
const shippingAddress = ref('')
const orderNotes = ref('')
const promoCodeInput = ref('')
const promoApplied = ref(false)
const promoDiscount = ref(0)
const promoError = ref<string | null>(null)

const turkishProvinces = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Amasya','Ankara','Antalya','Artvin','Aydın','Balıkesir',
  'Bilecik','Bingöl','Bitlis','Bolu','Burdur','Bursa','Çanakkale','Çankırı','Çorum','Denizli',
  'Diyarbakır','Edirne','Elazığ','Erzincan','Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari',
  'Hatay','Isparta','Mersin','İstanbul','İzmir','Kars','Kastamonu','Kayseri','Kırklareli','Kırşehir',
  'Kocaeli','Konya','Kütahya','Malatya','Manisa','Kahramanmaraş','Mardin','Muğla','Muş','Nevşehir',
  'Niğde','Ordu','Rize','Sakarya','Samsun','Siirt','Sinop','Sivas','Tekirdağ','Tokat',
  'Trabzon','Tunceli','Şanlıurfa','Uşak','Van','Yozgat','Zonguldak','Aksaray','Bayburt','Karaman',
  'Kırıkkale','Batman','Şırnak','Bartın','Ardahan','Iğdır','Yalova','Karabük','Kilis','Osmaniye','Düzce',
]

onMounted(() => {
  loadCart()
})

const totals = computed(() => {
  const surcharge = isDealer.value && dealer.value ? dealer.value.logisticsSurcharge : 0
  return calculateTotals(surcharge)
})

const handleCheckout = async () => {
  if (!getIsAuthenticated()) {
    navigateTo('/giris')
    return
  }

  if (items.value.length === 0) {
    alert('Sepetiniz boş')
    return
  }

  checkoutError.value = null
  checkoutStep.value = 'review'
}

const applyPromoCode = async () => {
  promoError.value = null
  if (!promoCodeInput.value.trim()) return

  try {
    const api = useApi()
    const result = await api.post<{ valid: boolean; discountAmount: number; finalTotal: number; message?: string }>('/promo/validate', {
      code: promoCodeInput.value.trim().toUpperCase(),
      orderTotal: totals.value.subtotal,
      isDealer: isDealer.value,
    })
    if (result.valid) {
      promoApplied.value = true
      promoDiscount.value = result.discountAmount
    } else {
      promoError.value = result.message || 'Geçersiz promosyon kodu'
    }
  } catch (err) {
    promoError.value = 'Promosyon kodu kontrol edilemedi'
  }
}

const removePromoCode = () => {
  promoApplied.value = false
  promoDiscount.value = 0
  promoCodeInput.value = ''
  promoError.value = null
}

const userIsDealer = computed(() => getUser()?.role === 'DEALER')

const handlePlaceOrder = async () => {
  if (!shippingCity.value || !shippingAddress.value) {
    checkoutError.value = 'Lütfen şehir ve adres bilgilerini girin'
    return
  }

  isLoading.value = true
  checkoutError.value = null

  try {
    // Resolve dealer ID: prefer from useDealer, fallback to API call
    let resolvedDealerId = dealer.value?.id
    if (userIsDealer.value && !resolvedDealerId) {
      try {
        const api = useApi()
        const info = await api.get<any>('/api/dealer/profile')
        resolvedDealerId = info?.id
      } catch {}
    }

    const order = await placeOrder({
      customerType: userIsDealer.value ? 'B2B' : 'B2C',
      shippingCity: shippingCity.value,
      shippingAddress: shippingAddress.value,
      dealerId: userIsDealer.value ? resolvedDealerId : undefined,
      promoCode: promoApplied.value ? promoCodeInput.value : undefined,
      notes: orderNotes.value || undefined,
      paymentMethod: paymentMethod.value,
    })

    if (order) {
      // If credit card, auto-pay via mock endpoint
      if (paymentMethod.value === 'credit-card') {
        try {
          const api = useApi()
          const paidOrder = await api.post(`/orders/${order.id}/pay`, cardForm.value)
          lastOrder.value = paidOrder
        } catch {
          lastOrder.value = order
        }
      } else {
        lastOrder.value = order
      }
      checkoutStep.value = 'complete'
    }
  } catch (err) {
    checkoutError.value = err instanceof Error ? err.message : 'Sipariş oluşturma başarısız oldu'
    console.error('Order error:', err)
  } finally {
    isLoading.value = false
  }
}

const handleContinueShopping = () => {
  navigateTo('/urunler')
}

const handleOrderHistory = () => {
  navigateTo('/siparislerim')
}

const handleClearCart = () => {
  if (confirm('Sepeti temizlemek istediğinize emin misiniz?')) {
    clear()
    checkoutStep.value = 'cart'
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 lg:py-16">
    <div class="px-6 lg:px-12 mx-auto max-w-6xl">
      <!-- Page Header -->
      <div class="mb-12">
        <h1 class="text-4xl font-bold text-primary-900 mb-2">Alışveriş Sepeti</h1>
        <p class="text-ink-600">
          {{ items.length === 0 ? 'Sepetiniz boş' : `${items.length} ürün` }}
        </p>
      </div>

      <!-- Empty Cart State -->
      <div v-if="items.length === 0 && checkoutStep === 'cart'" class="text-center py-20">
        <Icon name="lucide:shopping-cart" class="h-24 w-24 text-ink-300 mx-auto mb-6" />
        <h2 class="text-2xl font-bold text-primary-900 mb-3">Sepetiniz Boş</h2>
        <p class="text-ink-600 mb-8">Ürün eklemek için ürün sayfasını ziyaret edin</p>
        <NuxtLink
          to="/urunler"
          class="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
        >
          <Icon name="lucide:arrow-left" class="h-5 w-5" />
          Ürünlere Dön
        </NuxtLink>
      </div>

      <!-- Cart Items -->
      <div v-else-if="checkoutStep === 'cart'" class="grid lg:grid-cols-3 gap-8">
        <!-- Items List -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-xl shadow-md overflow-hidden">
            <div class="p-6 border-b border-ink-100">
              <h2 class="text-xl font-bold text-primary-900">Ürünler</h2>
            </div>

            <div class="divide-y divide-ink-100">
              <div
                v-for="item in items"
                :key="item.productId"
                class="p-6 flex gap-6 hover:bg-ink-50 transition-colors"
              >
                <!-- Product Image -->
                <div class="flex-shrink-0 w-24 h-24 bg-ink-100 rounded-lg overflow-hidden">
                  <img
                    :src="item.product.image"
                    :alt="item.product.name"
                    class="w-full h-full object-cover"
                  />
                </div>

                <!-- Product Info -->
                <div class="flex-grow">
                  <h3 class="font-semibold text-primary-900 mb-1">{{ item.product.name }}</h3>
                  <p class="text-sm text-ink-600 mb-3">{{ item.product.brand }}</p>

                  <div class="flex items-center justify-between">
                    <!-- Quantity Control -->
                    <div class="flex items-center gap-3 bg-ink-100 rounded-lg p-2">
                      <button
                        @click="updateQuantity(item.productId, item.quantity - 1)"
                        type="button"
                        class="h-8 w-8 flex items-center justify-center hover:bg-ink-200 rounded transition-colors"
                      >
                        −
                      </button>
                      <span class="w-8 text-center font-semibold">{{ item.quantity }}</span>
                      <button
                        @click="updateQuantity(item.productId, item.quantity + 1)"
                        type="button"
                        class="h-8 w-8 flex items-center justify-center hover:bg-ink-200 rounded transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <!-- Price & Remove -->
                    <div class="text-right">
                      <p class="text-lg font-bold text-accent-600">
                        ₺{{ (item.product.price * item.quantity).toLocaleString('tr-TR') }}
                      </p>
                      <button
                        @click="removeItem(item.productId)"
                        type="button"
                        class="text-xs text-red-600 hover:text-red-700 font-semibold mt-2"
                      >
                        Kaldır
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-6 bg-ink-50 flex justify-between">
              <button
                @click="handleClearCart"
                type="button"
                class="text-red-600 hover:text-red-700 font-semibold text-sm"
              >
                <Icon name="lucide:trash-2" class="h-4 w-4 inline mr-2" />
                Sepeti Temizle
              </button>
              <NuxtLink
                to="/urunler"
                class="text-accent-600 hover:text-accent-700 font-semibold text-sm"
              >
                <Icon name="lucide:plus" class="h-4 w-4 inline mr-2" />
                Daha Fazla Ürün Ekle
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <aside class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-md p-6 sticky top-[140px]">
            <h2 class="text-xl font-bold text-primary-900 mb-6">Sipariş Özeti</h2>

            <div class="space-y-4 pb-6 border-b border-ink-100">
              <div class="flex justify-between text-sm">
                <span class="text-ink-600">Ürün Toplamı ({{ totals.quantity }})</span>
                <span class="font-semibold text-primary-900">
                  ₺{{ totals.subtotal.toLocaleString('tr-TR') }}
                </span>
              </div>

              <div v-if="isDealer && totals.dealerSurcharge > 0" class="flex justify-between text-sm">
                <span class="text-ink-600">Lojistik Bedeli</span>
                <span class="font-semibold text-primary-900">
                  ₺{{ totals.dealerSurcharge.toLocaleString('tr-TR') }}
                </span>
              </div>
            </div>

            <div class="mb-6 pt-6">
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold text-primary-900">Toplam</span>
                <span class="text-3xl font-bold text-accent-600">
                  ₺{{ totals.total.toLocaleString('tr-TR') }}
                </span>
              </div>

              <p v-if="isDealer" class="text-xs text-ink-600 mt-2">
                <Icon name="lucide:info" class="h-3 w-3 inline mr-1" />
                Bayi Modu: Sipariş onay beklemede
              </p>
              <p v-else class="text-xs text-ink-600 mt-2">
                <Icon name="lucide:info" class="h-3 w-3 inline mr-1" />
                Müşteri Modu: Hemen sipariş tamamlanır
              </p>
            </div>

            <button
              @click="handleCheckout"
              type="button"
              class="w-full bg-gradient-to-r from-primary-900 to-accent-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all active:scale-95"
            >
              <Icon name="lucide:arrow-right" class="h-5 w-5 inline mr-2" />
              Ödemeye Geç
            </button>
          </div>
        </aside>
      </div>

      <!-- Review Step -->
      <div v-else-if="checkoutStep === 'review'" class="max-w-2xl mx-auto">
        <!-- Error Banner -->
        <div v-if="checkoutError" class="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded">
          <div class="flex">
            <Icon name="lucide:alert-circle" class="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-red-800 font-semibold">Sipariş oluşturma hatası</p>
              <p class="text-red-700 text-sm mt-1">{{ checkoutError }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-md p-8">
          <h2 class="text-2xl font-bold text-primary-900 mb-6">Siparişi Onayla</h2>

          <!-- Shipping Info -->
          <div class="mb-8 pb-8 border-b border-ink-100">
            <h3 class="font-semibold text-primary-900 mb-4">Teslimat Bilgileri</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-ink-700 mb-1">Şehir *</label>
                <select v-model="shippingCity" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500">
                  <option value="">Şehir Seçiniz</option>
                  <option v-for="province in turkishProvinces" :key="province" :value="province">{{ province }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-ink-700 mb-1">Adres *</label>
                <textarea v-model="shippingAddress" rows="2" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="Teslimat adresinizi yazın"></textarea>
              </div>
            </div>
          </div>

          <!-- Order Notes -->
          <div class="mb-8 pb-8 border-b border-ink-100">
            <h3 class="font-semibold text-primary-900 mb-4">Sipariş Notu (İsteğe Bağlı)</h3>
            <textarea
              v-model="orderNotes"
              rows="3"
              class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 max-w-lg"
              placeholder="Siparişinizle ilgili eklemek istediğiniz bir not varsa yazabilirsiniz..."
            ></textarea>
          </div>

          <!-- Promo Code -->
          <div class="mb-8 pb-8 border-b border-ink-100">
            <h3 class="font-semibold text-primary-900 mb-4">Promosyon Kodu</h3>
            <div class="flex gap-2 max-w-md">
              <input
                v-model="promoCodeInput"
                type="text"
                placeholder="Kodu girin"
                class="flex-1 px-3 py-2 border border-ink-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-primary-500"
                :disabled="promoApplied"
                @keydown.enter.prevent
              />
              <button
                v-if="!promoApplied"
                @click="applyPromoCode"
                class="px-4 py-2 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700"
              >
                Uygula
              </button>
              <button
                v-else
                @click="removePromoCode"
                class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
              >
                Kaldır
              </button>
            </div>
            <p v-if="promoError" class="text-red-600 text-sm mt-2">{{ promoError }}</p>
            <p v-if="promoApplied" class="text-green-600 text-sm mt-2">
              {{ promoCodeInput }} kodu uygulandı — {{ promoDiscount }} TL indirim
            </p>
          </div>

          <!-- Payment Method -->
          <div class="mb-8 pb-8 border-b border-ink-100">
            <h3 class="font-semibold text-primary-900 mb-4">Ödeme Yöntemi</h3>
            <div class="space-y-3">
              <label class="flex items-center p-4 border-2 border-ink-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors" :class="{ 'border-accent-600 bg-accent-50': paymentMethod === 'bank-transfer' }">
                <input
                  v-model="paymentMethod"
                  type="radio"
                  value="bank-transfer"
                  class="w-4 h-4 text-accent-600"
                />
                <span class="ml-3">
                  <p class="font-semibold text-primary-900">Banka Transferi</p>
                  <p class="text-sm text-ink-600">Siparişiniz onaylandıktan sonra</p>
                </span>
              </label>
              <label class="flex items-center p-4 border-2 border-ink-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors" :class="{ 'border-accent-600 bg-accent-50': paymentMethod === 'credit-card' }">
                <input
                  v-model="paymentMethod"
                  type="radio"
                  value="credit-card"
                  class="w-4 h-4 text-accent-600"
                />
                <span class="ml-3">
                  <p class="font-semibold text-primary-900">Kredi Kartı</p>
                  <p class="text-sm text-ink-600">Test kart bilgilerini girin</p>
                </span>
              </label>
              <!-- Card details form -->
              <div v-if="paymentMethod === 'credit-card'" class="ml-8 p-4 bg-ink-50 rounded-lg border border-ink-100 space-y-3 animate-fade-up">
                <div>
                  <label class="block text-xs font-semibold text-primary-900 mb-1">Kart Numarası</label>
                  <input v-model="cardForm.cardNumber" type="text" maxlength="19" placeholder="4111 1111 1111 1111" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-accent-500 focus:border-transparent" />
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs font-semibold text-primary-900 mb-1">Son Kullanma</label>
                    <input :value="cardForm.expiry" @input="formatExpiry" type="text" maxlength="5" placeholder="AA/YY" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-accent-500 focus:border-transparent" />
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-primary-900 mb-1">CVV</label>
                    <input v-model="cardForm.cvv" type="text" maxlength="4" placeholder="123" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-accent-500 focus:border-transparent" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-primary-900 mb-1">Kart Üzerindeki İsim</label>
                  <input v-model="cardForm.cardHolder" type="text" placeholder="Ad Soyad" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-accent-500 focus:border-transparent" />
                </div>
              </div>
              <label v-if="!isDealer" class="flex items-center p-4 border-2 border-ink-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors" :class="{ 'border-accent-600 bg-accent-50': paymentMethod === 'installment' }">
                <input
                  v-model="paymentMethod"
                  type="radio"
                  value="installment"
                  class="w-4 h-4 text-accent-600"
                />
                <span class="ml-3">
                  <p class="font-semibold text-primary-900">Taksit</p>
                  <p class="text-sm text-ink-600">Kredi kartı ile 3-12 ay taksit imkanı</p>
                </span>
              </label>
            </div>
          </div>

          <div class="mb-8 pb-8 border-b border-ink-100">
            <h3 class="font-semibold text-primary-900 mb-4">Ürünler</h3>
            <div class="space-y-3">
              <div v-for="item in items" :key="item.productId" class="flex justify-between text-sm">
                <span class="text-ink-700">
                  {{ item.product.name }} × {{ item.quantity }}
                </span>
                <span class="font-semibold text-primary-900">
                  ₺{{ (item.product.price * item.quantity).toLocaleString('tr-TR') }}
                </span>
              </div>
            </div>
          </div>

          <div class="mb-8 pb-8 border-b border-ink-100">
            <div class="space-y-3">
              <div class="flex justify-between text-sm">
                <span class="text-ink-600">Ürün Toplamı</span>
                <span class="font-semibold">₺{{ totals.subtotal.toLocaleString('tr-TR') }}</span>
              </div>
              <div v-if="isDealer && totals.dealerSurcharge > 0" class="flex justify-between text-sm">
                <span class="text-ink-600">Lojistik Bedeli</span>
                <span class="font-semibold">₺{{ totals.dealerSurcharge.toLocaleString('tr-TR') }}</span>
              </div>
            </div>
          </div>

          <div class="mb-8">
            <div class="flex justify-between items-center">
              <span class="text-lg font-bold text-primary-900">Toplam Tutar</span>
              <span class="text-3xl font-bold text-accent-600">
                ₺{{ totals.total.toLocaleString('tr-TR') }}
              </span>
            </div>
            <p v-if="isDealer" class="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg mt-4">
              <Icon name="lucide:alert-circle" class="h-4 w-4 inline mr-2" />
              Bayi olarak siparişiniz yönetim onayı bekleyecektir.
            </p>
            <p v-else class="text-sm text-green-700 bg-green-50 p-3 rounded-lg mt-4">
              <Icon name="lucide:check-circle" class="h-4 w-4 inline mr-2" />
              Siparişiniz hemen tamamlanacaktır.
            </p>
          </div>

          <div class="flex gap-4">
            <button
              @click="checkoutStep = 'cart'"
              type="button"
              class="flex-1 px-6 py-3 border border-ink-200 text-primary-900 font-semibold rounded-lg hover:bg-ink-50 transition-colors"
            >
              Geri Dön
            </button>
            <button
              @click="handlePlaceOrder"
              :disabled="isLoading"
              type="button"
              class="flex-1 px-6 py-3 bg-gradient-to-r from-primary-900 to-accent-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Icon v-if="isLoading" name="lucide:loader" class="h-5 w-5 animate-spin" />
              <span v-if="!isLoading">Siparişi Onayla</span>
              <span v-else>İşleniyor...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Complete Step -->
      <div v-else-if="checkoutStep === 'complete' && lastOrder" class="max-w-2xl mx-auto">
        <div class="bg-white rounded-xl shadow-md p-8 text-center">
          <div class="mb-6">
            <Icon name="lucide:check-circle" class="h-20 w-20 text-green-600 mx-auto" />
          </div>

          <h2 class="text-3xl font-bold text-green-600 mb-3">
            {{ lastOrder.status === 'completed' ? 'Sipariş Tamamlandı' : 'Sipariş Alındı' }}
          </h2>

          <p class="text-ink-600 mb-8">
            {{
              lastOrder.status === 'completed'
                ? 'Siparişiniz başarıyla tamamlanmıştır.'
                : 'Bayi siparişiniz alındı, yakında onaylanacaktır.'
            }}
          </p>

          <div class="bg-ink-50 rounded-lg p-6 mb-8 text-left">
            <p class="text-sm text-ink-600 mb-2">Sipariş No:</p>
            <p class="text-2xl font-bold text-primary-900 mb-6">{{ lastOrder.id }}</p>

            <div class="space-y-3 border-t border-ink-200 pt-6">
              <div class="flex justify-between text-sm">
                <span class="text-ink-600">Ürün Sayısı</span>
                <span class="font-semibold">{{ lastOrder.items.length }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-ink-600">Toplam Tutar</span>
                <span class="font-semibold">₺{{ lastOrder.total.toLocaleString('tr-TR') }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-ink-600">Tarih</span>
                <span class="font-semibold">
                  {{ new Date(lastOrder.createdAt).toLocaleDateString('tr-TR') }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row gap-4">
            <button
              @click="handleContinueShopping"
              type="button"
              class="flex-1 px-6 py-3 border border-accent-500 text-accent-600 font-semibold rounded-lg hover:bg-accent-50 transition-colors"
            >
              <Icon name="lucide:shopping-bag" class="h-5 w-5 inline mr-2" />
              Alışverişe Devam Et
            </button>
            <button
              @click="handleOrderHistory"
              type="button"
              class="flex-1 px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Icon name="lucide:history" class="h-5 w-5 inline mr-2" />
              Siparişlerimi Gör
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
