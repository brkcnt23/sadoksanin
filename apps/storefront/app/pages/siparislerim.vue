<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  title: 'Siparişlerim | SADÖKSAN',
  middleware: 'auth',
})

interface OrderLineItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  taxRate: number
  total: number
  product?: { id: string; name: string; brand: string; imageUrl?: string }
}

interface ApiOrder {
  id: string
  orderNo: string
  status: string
  customerType: string
  subtotal: number
  tax: number
  logisticsSurcharge: number
  total: number
  paymentMethod?: string
  paymentStatus?: string
  notes?: string
  lines: OrderLineItem[]
  createdAt: string
}

const api = useApi()
const { isAuthenticated } = useAuth()

const orders = ref<ApiOrder[]>([])
const loading = ref(true)
const selectedOrder = ref<ApiOrder | null>(null)

async function loadOrders() {
  if (!isAuthenticated.value) {
    navigateTo('/giris')
    return
  }
  loading.value = true
  try {
    orders.value = await api.get<ApiOrder[]>('/orders')
  } catch {
    orders.value = []
  }
  loading.value = false
}

const statusLabel = (status: string) => {
  const labels: Record<string, string> = {
    PENDING_APPROVAL: 'Onay Bekliyor',
    APPROVED: 'Onaylandı',
    PREPARING: 'Hazırlanıyor',
    SHIPPED: 'Kargoda',
    COMPLETED: 'Tamamlandı',
    CANCELLED: 'İptal Edildi',
    REJECTED: 'Reddedildi',
  }
  return labels[status] || status
}

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    PENDING_APPROVAL: 'bg-amber-50 text-amber-800 border-amber-200',
    APPROVED: 'bg-blue-50 text-blue-800 border-blue-200',
    PREPARING: 'bg-purple-50 text-purple-800 border-purple-200',
    SHIPPED: 'bg-cyan-50 text-cyan-800 border-cyan-200',
    COMPLETED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    CANCELLED: 'bg-red-50 text-red-800 border-red-200',
    REJECTED: 'bg-red-50 text-red-800 border-red-200',
  }
  return colors[status] || 'bg-ink-50 text-ink-700 border-ink-200'
}

const formatPrice = (price: number) => {
  return `₺${price.toLocaleString('tr-TR')}`
}

onMounted(loadOrders)
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 lg:py-16">
    <div class="px-6 lg:px-12 mx-auto max-w-4xl">
      <!-- Page Header -->
      <div class="mb-12">
        <h1 class="text-4xl font-bold text-primary-900 mb-2">Siparişlerim</h1>
        <p class="text-ink-600">Geçmiş ve aktif siparişlerinizi görüntüleyin</p>
      </div>

      <div class="grid lg:grid-cols-3 gap-8">
        <!-- Sidebar Navigation -->
        <aside class="lg:col-span-1">
          <nav class="space-y-2">
            <NuxtLink
              to="/hesabim"
              class="block px-4 py-3 rounded-lg text-primary-900 hover:bg-ink-50 transition-colors"
            >
              <Icon name="lucide:user" class="inline h-4 w-4 mr-2" />
              Profil Bilgileri
            </NuxtLink>
            <NuxtLink
              to="/siparislerim"
              class="block px-4 py-3 rounded-lg bg-accent-100 text-accent-700 font-medium border border-accent-200"
            >
              <Icon name="lucide:package" class="inline h-4 w-4 mr-2" />
              Siparişlerim
            </NuxtLink>
            <NuxtLink
              to="/favori-urunler"
              class="block px-4 py-3 rounded-lg text-primary-900 hover:bg-ink-50 transition-colors"
            >
              <Icon name="lucide:heart" class="inline h-4 w-4 mr-2" />
              Favori Ürünler
            </NuxtLink>
            <button
              class="w-full text-left px-4 py-3 rounded-lg text-primary-900 hover:bg-ink-50 transition-colors"
            >
              <Icon name="lucide:log-out" class="inline h-4 w-4 mr-2" />
              Çıkış Yap
            </button>
          </nav>
        </aside>

        <!-- Orders List -->
        <div class="lg:col-span-2">
          <!-- Loading -->
          <div v-if="loading" class="text-center py-12 text-ink-400">
            <Icon name="lucide:loader-2" class="h-8 w-8 mx-auto animate-spin mb-2" />
            Yükleniyor...
          </div>

          <div v-else-if="orders.length > 0" class="space-y-4">
            <div
              v-for="order in orders"
              :key="order.id"
              class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              @click="selectedOrder = order"
            >
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="font-semibold text-primary-900">{{ order.orderNo }}</h3>
                  <p class="text-sm text-ink-500 mt-1">
                    {{ new Date(order.createdAt).toLocaleDateString('tr-TR') }}
                  </p>
                </div>
                <span
                  :class="[
                    'inline-flex px-3 py-1 rounded-full text-xs font-semibold border',
                    statusColor(order.status),
                  ]"
                >
                  {{ statusLabel(order.status) }}
                </span>
              </div>

              <div class="border-t border-ink-100 pt-4">
                <p class="text-sm text-ink-600 mb-2">{{ order.lines?.length ?? 0 }} ürün</p>
                <p class="text-lg font-bold text-primary-900">
                  {{ formatPrice(order.total) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="bg-white rounded-xl shadow-md p-12 text-center">
            <Icon name="lucide:inbox" class="h-16 w-16 text-ink-300 mx-auto mb-4" />
            <h3 class="text-xl font-bold text-primary-900 mb-2">Sipariş bulunamadı</h3>
            <p class="text-ink-600 mb-6">Henüz bir sipariş vermemişsiniz.</p>
            <NuxtLink
              to="/urunler"
              class="inline-flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <Icon name="lucide:shopping-cart" class="h-4 w-4" />
              Ürünleri Keşfet
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Order Detail Modal -->
      <div
        v-if="selectedOrder"
        class="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
        @click="selectedOrder = null"
      >
        <div
          class="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          @click.stop
        >
          <div class="sticky top-0 bg-white border-b border-ink-100 p-6 flex items-center justify-between">
            <h2 class="text-2xl font-bold text-primary-900">{{ selectedOrder.orderNo }}</h2>
            <button
              @click="selectedOrder = null"
              class="text-ink-500 hover:text-ink-700"
            >
              <Icon name="lucide:x" class="h-6 w-6" />
            </button>
          </div>

          <div class="p-6 space-y-6">
            <!-- Order Info -->
            <div class="grid sm:grid-cols-3 gap-6">
              <div>
                <p class="text-sm text-ink-600 mb-1">Sipariş Tarihi</p>
                <p class="font-semibold text-primary-900">
                  {{ new Date(selectedOrder.createdAt).toLocaleDateString('tr-TR') }}
                </p>
              </div>
              <div>
                <p class="text-sm text-ink-600 mb-1">Durumu</p>
                <span
                  :class="[
                    'inline-flex px-3 py-1 rounded-full text-xs font-semibold border',
                    statusColor(selectedOrder.status),
                  ]"
                >
                  {{ statusLabel(selectedOrder.status) }}
                </span>
              </div>
              <div>
                <p class="text-sm text-ink-600 mb-1">Ödeme</p>
                <p class="font-semibold text-primary-900 text-sm">
                  {{ selectedOrder.paymentMethod === 'CREDIT_CARD' ? 'Kredi Kartı' : selectedOrder.paymentMethod === 'BANK_TRANSFER' ? 'Havale' : '—' }}
                </p>
              </div>
            </div>

            <!-- Order Lines -->
            <div class="border-t border-ink-100 pt-6">
              <h3 class="font-semibold text-primary-900 mb-4">Sipariş Kalemleri</h3>
              <div class="space-y-3">
                <div
                  v-for="line in selectedOrder.lines"
                  :key="line.id"
                  class="flex items-center justify-between pb-3 border-b border-ink-100"
                >
                  <div>
                    <p class="font-medium text-primary-900">{{ line.product?.name ?? line.productId }}</p>
                    <p class="text-sm text-ink-600">Adet: {{ line.quantity }} × {{ formatPrice(line.unitPrice) }}</p>
                  </div>
                  <p class="font-semibold text-primary-900">{{ formatPrice(line.total) }}</p>
                </div>
              </div>
            </div>

            <!-- Total -->
            <div class="border-t border-ink-100 pt-6 flex items-center justify-between">
              <p class="text-lg font-bold text-primary-900">Toplam:</p>
              <p class="text-2xl font-bold text-accent-600">
                {{ formatPrice(selectedOrder.total) }}
              </p>
            </div>

            <!-- Actions -->
            <div class="border-t border-ink-100 pt-6 flex gap-4">
              <a
                href="https://wa.me/905396541720"
                target="_blank"
                rel="noopener"
                class="flex-1 flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                <Icon name="lucide:message-circle" class="h-4 w-4" />
                WhatsApp Destek
              </a>
              <button
                @click="selectedOrder = null"
                class="flex-1 px-6 py-3 border border-ink-200 text-primary-900 hover:bg-ink-50 font-semibold rounded-lg transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
