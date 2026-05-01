<script setup lang="ts">
interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
}

interface Order {
  id: string
  date: string
  items: OrderItem[]
  total: number
  status: 'Beklemede' | 'Hazırlanıyor' | 'Sevk Edildi' | 'Tamamlandı'
}

const orders = ref<Order[]>([
  {
    id: 'SİP-2026-01',
    date: '2026-04-25',
    items: [
      { id: '1', name: '60x120 Seramik - Beyaz Mat', quantity: 5, price: 450 },
      { id: '2', name: 'Standart Klozet - Beyaz', quantity: 2, price: 890 },
    ],
    total: 4330,
    status: 'Sevk Edildi',
  },
  {
    id: 'SİP-2026-02',
    date: '2026-04-20',
    items: [
      { id: '3', name: 'Asma Klozet - Modern', quantity: 1, price: 1200 },
    ],
    total: 1200,
    status: 'Tamamlandı',
  },
  {
    id: 'SİP-2026-03',
    date: '2026-04-15',
    items: [
      { id: '4', name: '30x60 Seramik - Krem', quantity: 10, price: 380 },
      { id: '5', name: 'Lavabo - Standart', quantity: 3, price: 550 },
    ],
    total: 5250,
    status: 'Tamamlandı',
  },
])

const selectedOrder = ref<Order | null>(null)

const statusColor = (status: string) => {
  if (status === 'Beklemede') return 'bg-amber-50 text-amber-800 border-amber-200'
  if (status === 'Hazırlanıyor') return 'bg-blue-50 text-blue-800 border-blue-200'
  if (status === 'Sevk Edildi') return 'bg-sky-50 text-sky-800 border-sky-200'
  return 'bg-emerald-50 text-emerald-800 border-emerald-200'
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(price)
}
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
          <div v-if="orders.length > 0" class="space-y-4">
            <div
              v-for="order in orders"
              :key="order.id"
              class="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              @click="selectedOrder = order"
            >
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="font-semibold text-primary-900">{{ order.id }}</h3>
                  <p class="text-sm text-ink-500 mt-1">
                    {{ new Date(order.date).toLocaleDateString('tr-TR') }}
                  </p>
                </div>
                <span
                  :class="[
                    'inline-flex px-3 py-1 rounded-full text-xs font-semibold border',
                    statusColor(order.status),
                  ]"
                >
                  {{ order.status }}
                </span>
              </div>

              <div class="border-t border-ink-100 pt-4">
                <p class="text-sm text-ink-600 mb-2">{{ order.items.length }} ürün</p>
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
            <h2 class="text-2xl font-bold text-primary-900">{{ selectedOrder.id }}</h2>
            <button
              @click="selectedOrder = null"
              class="text-ink-500 hover:text-ink-700"
            >
              <Icon name="lucide:x" class="h-6 w-6" />
            </button>
          </div>

          <div class="p-6 space-y-6">
            <!-- Order Info -->
            <div class="grid sm:grid-cols-2 gap-6">
              <div>
                <p class="text-sm text-ink-600 mb-1">Sipariş Tarihi</p>
                <p class="font-semibold text-primary-900">
                  {{ new Date(selectedOrder.date).toLocaleDateString('tr-TR') }}
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
                  {{ selectedOrder.status }}
                </span>
              </div>
            </div>

            <!-- Order Items -->
            <div class="border-t border-ink-100 pt-6">
              <h3 class="font-semibold text-primary-900 mb-4">Sipariş Detayları</h3>
              <div class="space-y-3">
                <div
                  v-for="item in selectedOrder.items"
                  :key="item.id"
                  class="flex items-center justify-between pb-3 border-b border-ink-100"
                >
                  <div>
                    <p class="font-medium text-primary-900">{{ item.name }}</p>
                    <p class="text-sm text-ink-600">Adet: {{ item.quantity }}</p>
                  </div>
                  <p class="font-semibold text-primary-900">
                    {{ formatPrice(item.price) }}
                  </p>
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
