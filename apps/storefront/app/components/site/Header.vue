<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, navigateTo } from '#app'
import { useDealer } from '~/composables/useDealer'
import { useAuth } from '~/composables/useAuth'
import { useCart } from '~/composables/useCart'
import { useDealerApi } from '~/composables/useDealerApi'

const { isDealer, disableDealer } = useDealer()
const { isAuthenticated, getUser, logout } = useAuth()
const { items, loadCart } = useCart()
const { downloadStockReport } = useDealerApi()

const raporOpen = ref(false)
const searchQuery = ref('')

const doSearch = () => {
  const q = searchQuery.value.trim()
  if (q) {
    navigateTo(`/urunler?search=${encodeURIComponent(q)}`)
  } else if (searchQuery.value === '') {
    // Focus the input if empty
    const input = document.querySelector<HTMLInputElement>('.md\\:flex input[type="text"]')
    input?.focus()
  }
  searchQuery.value = ''
}

const downloadReport = async (type: string) => {
  try {
    const reportLabels: Record<string, string> = {
      monthly: 'Aylik-Raporu',
      yearly: 'Yillik-Raporu',
      invoice: 'Fatura-Raporu',
      stock: 'Stok-Raporu',
      detailed: 'Detayli-Rapor',
    }
    const blob = await downloadStockReport(type as any)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportLabels[type] || 'Rapor'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch {
    // silent
  }
  raporOpen.value = false
}
const route = useRoute()

const cartCount = ref(0)

onMounted(() => {
  loadCart()
  cartCount.value = items.value.length
})

watch(() => items.value.length, (newLength) => {
  cartCount.value = newLength
})

// Nav: "Ürünler" artık link değil, mega-menu trigger.
interface NavItem {
  label: string
  to?: string
  trigger?: 'mega'
}

const nav: NavItem[] = [
  { label: 'Anasayfa', to: '/' },
  { label: 'Ürünler', trigger: 'mega' },
  { label: 'Mağazamız', to: '/magaza' },
  { label: 'Bayilik', to: '/giris' },
  { label: 'Hakkımızda', to: '/hakkimizda' },
  { label: 'İletişim', to: '/iletisim' },
]

const mobileOpen = ref(false)
const scrolled = ref(false)
const megaOpen = ref(false)
const megaLocked = ref(false)
// Mobile drawer içinde "Ürünler" accordion'u
const mobileProductsOpen = ref(false)

// Mega-menu mobile kategorileri için referans (ProductsMegaMenu ile sync)
const mobileCategories = [
  { label: 'Seramik', to: '/kategori/seramik' },
  { label: 'Vitrifiye', to: '/kategori/vitrifiye' },
  { label: 'Batarya ve Musluklar', to: '/kategori/batarya-ve-musluklar' },
  { label: 'Banyo Grubu & Kabin', to: '/kategori/banyo-grubu' },
  { label: 'Banyo Aksesuarları', to: '/kategori/banyo-aksesuarlari' },
  { label: 'Silikon & Köpük & Sprey Boya', to: '/kategori/silikon-kopuk' },
  { label: 'Yapı Kimyasalları', to: '/kategori/alci-alci-plaka' },
  { label: 'RTRMAX', to: '/kategori/rtrmax' },
  { label: 'İnsört Ürünler', to: '/kategori/insort-urunler' },
]

const handleDealerLogout = () => {
  disableDealer()
  logout()
  navigateTo('/')
}

const handleLogout = () => {
  logout()
  navigateTo('/')
}

const onScroll = () => {
  if (typeof window !== 'undefined') scrolled.value = window.scrollY > 8
}

const toggleMega = () => {
  if (megaOpen.value) {
    megaOpen.value = false
    megaLocked.value = false
  } else {
    megaOpen.value = true
    megaLocked.value = true
  }
}

const onMegaClose = () => {
  megaOpen.value = false
  megaLocked.value = false
}

const onNavMouseLeave = () => {
  if (!megaLocked.value) {
    megaOpen.value = false
  }
}

const onMegaTriggerEnter = () => {
  if (!megaOpen.value) megaOpen.value = true
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('scroll', onScroll)
})

watch(() => route.fullPath, () => {
  mobileOpen.value = false
  megaOpen.value = false
  megaLocked.value = false
  mobileProductsOpen.value = false
})
</script>

<template>
  <header
    class="sticky top-0 z-40 w-full transition-all duration-300"
    :class="scrolled ? 'bg-white/95 backdrop-blur shadow-soft border-b border-ink-100' : 'bg-white border-b border-transparent'"
  >
    <div class="container-x flex h-20 items-center justify-between gap-8">
      <!-- Logo -->
      <NuxtLink to="/" class="flex flex-col gap-0.5 group">
        <div class="flex items-baseline gap-2">
          <span class="font-display text-2xl font-extrabold tracking-tight text-primary-900 group-hover:text-primary-800 transition-colors">
            Sadöksan
          </span>
          <span class="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-600">
            inşaat
          </span>
        </div>
        <span class="hidden lg:block text-xs font-medium text-ink-600 group-hover:text-primary-900 transition-colors tracking-tight">
          Premium işçilik, profesyonel tedarik
        </span>
      </NuxtLink>

      <!-- Desktop nav -->
      <nav class="hidden lg:flex items-center gap-1" @mouseleave="onNavMouseLeave">
        <template v-for="item in nav" :key="item.label">
          <!-- Mega-menu tetik butonu (click + hover) -->
          <button
            v-if="item.trigger === 'mega'"
            type="button"
            data-mega-trigger
            class="px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1"
            :class="megaOpen ? 'text-primary-900 bg-ink-50' : 'text-ink-700 hover:text-primary-900'"
            :aria-expanded="megaOpen"
            aria-haspopup="true"
            @click="toggleMega"
            @mouseenter="onMegaTriggerEnter"
          >
            {{ item.label }}
            <Icon
              name="lucide:chevron-down"
              class="h-4 w-4 transition-transform"
              :class="megaOpen ? 'rotate-180' : ''"
            />
          </button>
          <!-- Standart link -->
          <NuxtLink
            v-else-if="item.to"
            :to="item.to"
            class="px-4 py-2 text-sm font-medium text-ink-700 hover:text-primary-900 rounded-md transition-colors relative"
            active-class="text-primary-900"
          >
            {{ item.label }}
          </NuxtLink>
        </template>
      </nav>

      <!-- Right cluster -->
      <div class="flex items-center gap-2">
        <div class="hidden md:flex items-center gap-1">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Ürün ara..."
            class="h-10 w-0 focus:w-48 px-0 focus:px-3 rounded-md border border-transparent focus:border-ink-200 bg-transparent focus:bg-ink-50 text-sm text-ink-900 placeholder-ink-400 outline-none transition-all duration-300"
            @keydown.enter="doSearch"
          />
          <button
            type="button"
            class="h-10 w-10 inline-flex items-center justify-center rounded-md text-ink-600 hover:bg-ink-50 hover:text-primary-900 transition-colors"
            aria-label="Ara"
            @click="doSearch"
          >
            <Icon name="lucide:search" class="h-5 w-5" />
          </button>
        </div>

        <button
          type="button"
          class="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-600 hover:bg-ink-50 hover:text-primary-900 transition-colors relative"
          aria-label="Favoriler"
        >
          <Icon name="lucide:heart" class="h-5 w-5" />
        </button>

        <NuxtLink
          to="/sepet"
          class="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-600 hover:bg-ink-50 hover:text-primary-900 transition-colors relative"
          aria-label="Sepet"
        >
          <Icon name="lucide:shopping-bag" class="h-5 w-5" />
          <span
            v-if="cartCount > 0"
            class="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 rounded-full bg-accent-500 text-[10px] font-bold text-primary-950 grid place-items-center"
          >
            {{ cartCount }}
          </span>
        </NuxtLink>

        <div class="hidden md:flex items-center gap-2">
          <template v-if="isDealer">
            <NuxtLink
              to="/bayi"
              class="inline-flex btn-outline h-10 px-4 text-xs"
            >
              <Icon name="lucide:layout-dashboard" class="h-4 w-4" />
              Bayi Paneli
            </NuxtLink>
            <!-- Raporlar dropdown -->
            <div class="relative">
              <button
                @click="raporOpen = !raporOpen"
                class="inline-flex btn-outline h-10 px-4 text-xs items-center gap-1.5"
              >
                <Icon name="lucide:download" class="h-4 w-4" />
                Raporlar
                <Icon :name="raporOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="h-3 w-3" />
              </button>
              <div
                v-if="raporOpen"
                class="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-ink-100 shadow-card py-2 z-50"
                @click.self="raporOpen = false"
              >
                <button @click="downloadReport('monthly')" class="w-full text-left px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 flex items-center gap-2">
                  <Icon name="lucide:calendar" class="h-4 w-4 text-ink-400" />
                  Aylık Rapor
                </button>
                <button @click="downloadReport('yearly')" class="w-full text-left px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 flex items-center gap-2">
                  <Icon name="lucide:bar-chart-3" class="h-4 w-4 text-ink-400" />
                  Yıllık Rapor
                </button>
                <button @click="downloadReport('invoice')" class="w-full text-left px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 flex items-center gap-2">
                  <Icon name="lucide:file-text" class="h-4 w-4 text-ink-400" />
                  Fatura Raporu
                </button>
                <div class="border-t border-ink-100 my-1"></div>
                <button @click="downloadReport('stock')" class="w-full text-left px-4 py-2.5 text-sm text-ink-700 hover:bg-ink-50 flex items-center gap-2">
                  <Icon name="lucide:package" class="h-4 w-4 text-ink-400" />
                  Stok & Fiyat Raporu
                </button>
              </div>
            </div>
            <button
              @click="handleDealerLogout"
              class="inline-flex btn-outline h-10 px-4 text-xs text-red-600 hover:bg-red-50 border-red-200"
            >
              <Icon name="lucide:log-out" class="h-4 w-4" />
              Bayi Çıkışı
            </button>
          </template>
          <template v-else-if="isAuthenticated">
            <NuxtLink
              to="/bayi"
              class="inline-flex btn-outline h-10 px-4 text-xs"
            >
              <Icon name="lucide:user" class="h-4 w-4" />
              {{ getUser()?.name?.split(' ')[0] || 'Hesabım' }}
            </NuxtLink>
            <button
              @click="handleLogout"
              class="inline-flex btn-outline h-10 px-4 text-xs text-red-600 hover:bg-red-50 border-red-200"
            >
              <Icon name="lucide:log-out" class="h-4 w-4" />
              Çıkış
            </button>
          </template>
          <template v-else>
            <NuxtLink
              to="/giris"
              class="inline-flex btn-accent h-10 px-5 text-xs"
            >
              <Icon name="lucide:log-in" class="h-4 w-4" />
              Bayi Girişi
            </NuxtLink>
          </template>
        </div>

        <button
          class="lg:hidden h-10 w-10 grid place-items-center rounded-md hover:bg-ink-50"
          @click="mobileOpen = !mobileOpen"
          aria-label="Menü"
        >
          <Icon :name="mobileOpen ? 'lucide:x' : 'lucide:menu'" class="h-5 w-5" />
        </button>
      </div>
    </div>

    <!-- Desktop mega-menu (full-width panel) -->
    <SiteProductsMegaMenu :open="megaOpen" @close="onMegaClose" />

    <!-- Mobile drawer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="mobileOpen" class="lg:hidden border-t border-ink-100 bg-white max-h-[calc(100vh-5rem)] overflow-y-auto">
        <div class="container-x py-4 flex flex-col gap-1">
          <template v-for="item in nav" :key="item.label">
            <!-- Ürünler accordion (mobile) -->
            <div v-if="item.trigger === 'mega'" class="flex flex-col">
              <button
                type="button"
                class="flex items-center justify-between px-3 py-3 text-sm font-medium text-ink-700 hover:bg-ink-50 rounded-md"
                @click="mobileProductsOpen = !mobileProductsOpen"
              >
                <span>{{ item.label }}</span>
                <Icon
                  name="lucide:chevron-down"
                  class="h-4 w-4 transition-transform"
                  :class="mobileProductsOpen ? 'rotate-180' : ''"
                />
              </button>
              <Transition
                enter-active-class="transition duration-150 ease-out"
                enter-from-class="opacity-0 -translate-y-1 max-h-0"
                enter-to-class="opacity-100 translate-y-0 max-h-[800px]"
                leave-active-class="transition duration-100 ease-in"
                leave-from-class="opacity-100 max-h-[800px]"
                leave-to-class="opacity-0 max-h-0"
              >
                <ul v-if="mobileProductsOpen" class="ml-3 flex flex-col gap-1 border-l border-ink-100 pl-3 py-1">
                  <li v-for="cat in mobileCategories" :key="cat.to">
                    <NuxtLink
                      :to="cat.to"
                      class="block py-2 text-sm text-ink-600 hover:text-primary-900 transition-colors"
                    >
                      {{ cat.label }}
                    </NuxtLink>
                  </li>
                </ul>
              </Transition>
            </div>
            <NuxtLink
              v-else-if="item.to"
              :to="item.to"
              class="px-3 py-3 text-sm font-medium text-ink-700 hover:bg-ink-50 rounded-md"
              active-class="bg-primary-50 text-primary-900"
            >
              {{ item.label }}
            </NuxtLink>
          </template>
          <template v-if="isDealer">
            <div class="flex flex-col gap-2 mt-2">
              <NuxtLink to="/bayi" class="btn-outline justify-start">
                <Icon name="lucide:layout-dashboard" class="h-4 w-4" />
                Bayi Paneli
              </NuxtLink>
              <button
                @click="handleDealerLogout"
                class="w-full btn-outline justify-start text-red-600 hover:bg-red-50 border-red-200"
              >
                <Icon name="lucide:log-out" class="h-4 w-4" />
                Bayi Çıkışı
              </button>
            </div>
          </template>
          <template v-else-if="isAuthenticated">
            <div class="flex flex-col gap-2 mt-2">
              <NuxtLink to="/bayi" class="btn-outline justify-start">
                <Icon name="lucide:user" class="h-4 w-4" />
                {{ getUser()?.name || 'Hesabım' }}
              </NuxtLink>
              <button
                @click="handleLogout"
                class="w-full btn-outline justify-start text-red-600 hover:bg-red-50 border-red-200"
              >
                <Icon name="lucide:log-out" class="h-4 w-4" />
                Çıkış
              </button>
            </div>
          </template>
          <template v-else>
            <div class="flex flex-col gap-2 mt-2">
              <NuxtLink to="/giris" class="btn-accent justify-center">
                <Icon name="lucide:log-in" class="h-4 w-4" />
                Bayi Girişi
              </NuxtLink>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </header>
</template>
