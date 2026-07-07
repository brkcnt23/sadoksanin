<script setup lang="ts">
import { useCart } from '~/composables/useCart'
import { useDealer } from '~/composables/useDealer'
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'

definePageMeta({
  title: 'Sepetim | SADÖKSAN',
})

const { items, calculateTotals, removeItem, updateQuantity, clear, placeOrder, loadCart } = useCart()
const { isDealer, dealer } = useDealer()
const { getIsAuthenticated, getUser } = useAuth()
const { push: pushToast } = useToast()

const isLoading = ref(false)
const checkoutStep = ref<'cart' | 'complete'>('cart')
const lastOrder = ref<any>(null)
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

  // Bayi için şehir/adres bilgisini dealer profilinden otomatik al
  if (userIsDealer.value && dealer.value) {
    shippingCity.value = dealer.value.city || ''
    shippingAddress.value = dealer.value.address || dealer.value.company || ''
  }

  // Direkt siparişi onaya gönder, ödeme ekranı yok
  await handlePlaceOrder()
}

const userIsDealer = computed(() => getUser()?.role === 'DEALER')

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

const handlePlaceOrder = async () => {
  if (!shippingCity.value || !shippingAddress.value) {
    pushToast({ variant: 'error', title: 'Eksik bilgi', description: 'Lütfen şehir ve adres bilgilerini girin', duration: 4000 })
    return
  }

  isLoading.value = true

  try {
    // Resolve dealer ID: prefer from useDealer, fallback to API call
    let resolvedDealerId = dealer.value?.id
    if (userIsDealer.value && !resolvedDealerId) {
      try {
        const api = useApi()
        const info = await api.get<any>('/dealer/profile')
        resolvedDealerId = info?.id
      } catch {}
    }

    const order = await placeOrder({
      customerType: userIsDealer.value ? 'B2B' : 'B2C',
      shippingCity: shippingCity.value,
      shippingAddress: shippingAddress.value,
      dealerId: userIsDealer.value ? resolvedDealerId : undefined,
      notes: orderNotes.value || undefined,
      promoCode: promoApplied.value ? promoCodeInput.value : undefined,
    })

    if (order) {
      lastOrder.value = order
      checkoutStep.value = 'complete'
      const isDealerOrder = userIsDealer.value
      pushToast({
        variant: 'success',
        title: 'Sipariş alındı!',
        description: isDealerOrder
          ? `${order.orderNo} numaralı siparişiniz onay bekliyor.`
          : `${order.orderNo} numaralı siparişiniz tamamlandı.`,
        duration: 4000,
      })
      // Auto-redirect after short delay
      setTimeout(() => {
        navigateTo(isDealerOrder ? '/bayi' : '/siparislerim')
      }, 2500)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Sipariş oluşturma başarısız oldu'
    pushToast({ variant: 'error', title: 'Sipariş hatası', description: msg, duration: 5000 })
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
                    <div class="flex items-center gap-1 bg-ink-100 rounded-lg p-1">
                      <button
                        @click="updateQuantity(item.productId, Math.max(1, item.quantity - 1))"
                        type="button"
                        class="h-8 w-8 flex items-center justify-center hover:bg-ink-200 rounded transition-colors font-bold text-lg"
                      >
                        −
                      </button>
                      <input
                        :value="item.quantity"
                        @change="updateQuantity(item.productId, parseInt(($event.target as HTMLInputElement).value) || 1)"
                        type="number"
                        min="1"
                        class="w-14 text-center font-semibold bg-white border border-ink-200 rounded py-1 text-sm"
                      />
                      <button
                        @click="updateQuantity(item.productId, item.quantity + 1)"
                        type="button"
                        class="h-8 w-8 flex items-center justify-center hover:bg-ink-200 rounded transition-colors font-bold text-lg"
                      >
                        +
                      </button>
                    </div>

                    <!-- Price & Remove -->
                    <div class="text-right">
                      <p class="text-lg font-bold text-accent-600">
                        ₺{{ (item.product.basePrice * item.quantity).toLocaleString('tr-TR') }}
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

              <div v-if="promoApplied" class="flex justify-between text-sm">
                <span class="text-green-600">İndirim ({{ promoCodeInput }})</span>
                <span class="font-semibold text-green-600">−₺{{ promoDiscount.toLocaleString('tr-TR') }}</span>
              </div>
            </div>

            <!-- Promosyon Kodu -->
            <div class="py-4 border-b border-ink-100">
              <p class="text-xs font-semibold text-ink-700 uppercase tracking-wider mb-2">Promosyon Kodu</p>
              <div class="flex gap-2">
                <input
                  v-model="promoCodeInput"
                  type="text"
                  placeholder="Kodu girin"
                  class="flex-1 px-3 py-2 border border-ink-200 rounded-lg text-sm uppercase focus:ring-2 focus:ring-primary-500"
                  :disabled="promoApplied"
                  @keydown.enter.prevent="applyPromoCode"
                />
                <button
                  v-if="!promoApplied"
                  @click="applyPromoCode"
                  type="button"
                  class="px-3 py-2 bg-accent-600 text-white rounded-lg text-sm font-medium hover:bg-accent-700 whitespace-nowrap"
                >
                  Uygula
                </button>
                <button
                  v-else
                  @click="removePromoCode"
                  type="button"
                  class="px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 whitespace-nowrap"
                >
                  Kaldır
                </button>
              </div>
              <p v-if="promoError" class="text-red-600 text-xs mt-2">{{ promoError }}</p>
              <p v-if="promoApplied" class="text-green-600 text-xs mt-2">{{ promoCodeInput }} kodu uygulandı</p>
            </div>

            <div class="mb-6 pt-6">
              <div class="flex justify-between items-center mb-2">
                <span class="font-semibold text-primary-900">Toplam</span>
                <span class="text-3xl font-bold text-accent-600">
                  ₺{{ (totals.total - (promoApplied ? promoDiscount : 0)).toLocaleString('tr-TR') }}
                </span>
              </div>

              <p class="text-xs text-ink-600 mt-2">
                <Icon name="lucide:info" class="h-3 w-3 inline mr-1" />
                {{ userIsDealer ? 'Bayi Modu: Sipariş onay beklemede' : 'Sipariş onaylandıktan sonra hazırlanacaktır' }}
              </p>
            </div>

            <!-- B2C: dealer olmayan kullanıcılar için teslimat bilgisi -->
            <div v-if="!userIsDealer" class="mb-6 space-y-3">
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

            <div class="mb-6">
              <label class="block text-sm font-medium text-ink-700 mb-1">Sipariş Notu (İsteğe Bağlı)</label>
              <textarea v-model="orderNotes" rows="2" class="w-full px-3 py-2 border border-ink-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500" placeholder="Eklemek istediğiniz not..."></textarea>
            </div>

            <button
              @click="handleCheckout"
              :disabled="isLoading"
              type="button"
              class="w-full bg-gradient-to-r from-primary-900 to-accent-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Icon v-if="isLoading" name="lucide:loader" class="h-5 w-5 inline mr-2 animate-spin" />
              <Icon v-else name="lucide:check-circle" class="h-5 w-5 inline mr-2" />
              {{ isLoading ? 'İşleniyor...' : 'Siparişi Onayla' }}
            </button>
          </div>
        </aside>
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
