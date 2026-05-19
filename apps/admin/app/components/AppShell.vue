<script setup lang="ts">
const route = useRoute()
const { logout, getUser } = useAdminAuth()
const settings = useSettingsStore()
const orders = useOrdersStore()
const dealers = useDealersStore()
const notifications = useNotificationsStore()

const currentUser = computed(() => getUser())

interface NavItem {
  label: string
  icon: string
  to: string
  badge?: () => number
}

const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Operasyon',
    items: [
      { label: 'Dashboard', icon: 'lucide:layout-dashboard', to: '/' },
      { label: 'Siparişler', icon: 'lucide:package', to: '/siparisler', badge: () => orders.pendingCount },
      { label: 'Bayiler', icon: 'lucide:users', to: '/bayiler', badge: () => dealers.pendingCount },
    ],
  },
  {
    title: 'Katalog',
    items: [
      { label: 'Ürünler', icon: 'lucide:boxes', to: '/urunler' },
      { label: 'Stok', icon: 'lucide:warehouse', to: '/stok' },
      { label: 'Fiyat & Lojistik', icon: 'lucide:wallet', to: '/fiyatlandirma' },
    ],
  },
  {
    title: 'Pazarlama',
    items: [
      { label: 'Popup & Kampanya', icon: 'lucide:megaphone', to: '/popup' },
      { label: 'Bildirimler', icon: 'lucide:bell', to: '/bildirimler', badge: () => notifications.pendingCount },
    ],
  },
  {
    title: 'Yönetim',
    items: [
      { label: 'Proforma', icon: 'lucide:file-text', to: '/proforma' },
      { label: 'Raporlar', icon: 'lucide:bar-chart-3', to: '/raporlar' },
      { label: 'Denetim Kaydı', icon: 'lucide:scroll-text', to: '/denetim' },
      { label: 'Ayarlar', icon: 'lucide:settings', to: '/ayarlar' },
    ],
  },
]

const isActive = (to: string) => {
  if (to === '/') return route.path === '/'
  return route.path === to || route.path.startsWith(to + '/')
}

const activeLabel = computed(() => {
  for (const g of navGroups) {
    const found = g.items.find((i) => isActive(i.to))
    if (found) return found.label
  }
  return 'Yönetim'
})

const handleLogout = () => {
  logout()
  navigateTo('/sadoksanadmin')
}
</script>

<template>
  <div class="min-h-screen bg-ink-50 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-ink-200 sticky top-0 h-screen flex flex-col shrink-0">
      <div class="px-6 py-5 border-b border-ink-100">
        <h1 class="text-lg font-bold text-ink-900">{{ settings.data.siteName }}</h1>
        <p class="text-xs text-ink-500 mt-0.5">Yönetim Paneli</p>
      </div>

      <nav class="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <div v-for="group in navGroups" :key="group.title">
          <p class="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">{{ group.title }}</p>
          <div class="space-y-1">
            <NuxtLink
              v-for="item in group.items"
              :key="item.to"
              :to="item.to"
              :class="[
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive(item.to)
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-ink-700 hover:bg-ink-50',
              ]"
            >
              <Icon :name="item.icon" class="w-4 h-4 shrink-0" />
              <span class="flex-1 truncate">{{ item.label }}</span>
              <span
                v-if="item.badge && item.badge() > 0"
                class="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white min-w-[1.25rem] text-center"
              >
                {{ item.badge() }}
              </span>
            </NuxtLink>
          </div>
        </div>
      </nav>

      <div class="p-3 border-t border-ink-100 space-y-2">
        <div class="px-3 py-2 rounded-lg bg-ink-50">
          <p class="text-xs font-medium text-ink-700 truncate">{{ currentUser?.name }}</p>
          <p class="text-[11px] text-ink-500 truncate">{{ currentUser?.email }}</p>
        </div>
        <button
          @click="handleLogout"
          class="w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-2 justify-center"
        >
          <Icon name="lucide:log-out" class="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 flex flex-col min-w-0">
      <header class="bg-white border-b border-ink-200 px-8 py-3.5 sticky top-0 z-10">
        <div class="flex items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-ink-900 truncate">{{ activeLabel }}</h2>

          <div class="flex items-center gap-2">
            <div
              v-if="settings.data.maintenanceMode"
              class="px-3 py-1.5 rounded-md bg-amber-100 text-amber-800 text-xs font-medium flex items-center gap-1.5"
            >
              <Icon name="lucide:wrench" class="w-3.5 h-3.5" />
              Bakım Modu Aktif
            </div>
            <NuxtLink
              to="/bildirimler"
              class="relative p-2 hover:bg-ink-100 rounded-lg transition-colors"
            >
              <Icon name="lucide:bell" class="w-5 h-5 text-ink-600" />
              <span
                v-if="notifications.pendingCount > 0"
                class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
              />
            </NuxtLink>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-auto">
        <div class="p-6 lg:p-8 max-w-[1600px]">
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>
