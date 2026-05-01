<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, navigateTo } from '#app'
import { useDealer } from '~/composables/useDealer'

const { isDealer, disableDealer } = useDealer()
const route = useRoute()

const nav = [
  { label: 'Anasayfa', to: '/' },
  { label: 'Ürünler', to: '/urunler' },
  { label: 'Mağazamız', to: '/magaza' },
  { label: 'Bayilik', to: '/bayilik' },
  { label: 'Hakkımızda', to: '/hakkimizda' },
  { label: 'İletişim', to: '/iletisim' },
]

const mobileOpen = ref(false)
const scrolled = ref(false)

const handleDealerLogout = () => {
  disableDealer()
  navigateTo('/')
}

const onScroll = () => {
  if (typeof window !== 'undefined') scrolled.value = window.scrollY > 8
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') window.removeEventListener('scroll', onScroll)
})

watch(() => route.fullPath, () => (mobileOpen.value = false))
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
      <nav class="hidden lg:flex items-center gap-1">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="px-4 py-2 text-sm font-medium text-ink-700 hover:text-primary-900 rounded-md transition-colors relative"
          active-class="text-primary-900"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>

      <!-- Right cluster -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-600 hover:bg-ink-50 hover:text-primary-900 transition-colors"
          aria-label="Ara"
        >
          <Icon name="lucide:search" class="h-5 w-5" />
        </button>

        <button
          type="button"
          class="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-600 hover:bg-ink-50 hover:text-primary-900 transition-colors relative"
          aria-label="Favoriler"
        >
          <Icon name="lucide:heart" class="h-5 w-5" />
        </button>

        <button
          type="button"
          class="hidden md:inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-600 hover:bg-ink-50 hover:text-primary-900 transition-colors relative"
          aria-label="Sepet"
        >
          <Icon name="lucide:shopping-bag" class="h-5 w-5" />
          <span class="absolute -right-0.5 -top-0.5 h-4 min-w-4 px-1 rounded-full bg-accent-500 text-[10px] font-bold text-primary-950 grid place-items-center">
            0
          </span>
        </button>

        <div class="hidden md:flex items-center gap-2">
          <template v-if="!isDealer">
            <NuxtLink
              to="/giris"
              class="inline-flex btn-outline h-10 px-4 text-xs"
            >
              <Icon name="lucide:user" class="h-4 w-4" />
              Üye Girişi
            </NuxtLink>
            <NuxtLink
              to="/bayi"
              class="inline-flex btn-outline h-10 px-4 text-xs"
            >
              <Icon name="lucide:user-cog" class="h-4 w-4" />
              Bayi Girişi
            </NuxtLink>
          </template>
          <template v-else>
            <button
              @click="handleDealerLogout"
              class="inline-flex btn-outline h-10 px-4 text-xs text-red-600 hover:bg-red-50 border-red-200"
            >
              <Icon name="lucide:log-out" class="h-4 w-4" />
              Bayi Çıkışı
            </button>
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

    <!-- Mobile drawer -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="mobileOpen" class="lg:hidden border-t border-ink-100 bg-white">
        <div class="container-x py-4 flex flex-col gap-1">
          <NuxtLink
            v-for="item in nav"
            :key="item.to"
            :to="item.to"
            class="px-3 py-3 text-sm font-medium text-ink-700 hover:bg-ink-50 rounded-md"
            active-class="bg-primary-50 text-primary-900"
          >
            {{ item.label }}
          </NuxtLink>
          <template v-if="!isDealer">
            <div class="flex flex-col gap-2 mt-2">
              <NuxtLink to="/giris" class="btn-outline justify-start">
                <Icon name="lucide:user" class="h-4 w-4" />
                Üye Girişi
              </NuxtLink>
              <NuxtLink to="/bayi" class="btn-outline justify-start">
                <Icon name="lucide:user-cog" class="h-4 w-4" />
                Bayi Girişi
              </NuxtLink>
            </div>
          </template>
          <template v-else>
            <button
              @click="handleDealerLogout"
              class="w-full mt-2 btn-outline justify-start text-red-600 hover:bg-red-50 border-red-200"
            >
              <Icon name="lucide:log-out" class="h-4 w-4" />
              Bayi Çıkışı
            </button>
          </template>
        </div>
      </div>
    </Transition>
  </header>
</template>
