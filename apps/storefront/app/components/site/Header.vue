<script setup lang="ts">
const { isDealer, dealer } = useDealer()
const route = useRoute()

const nav = [
  { label: 'Anasayfa', to: '/' },
  { label: 'Ürünler', to: '/urunler' },
  { label: 'Markalar', to: '/markalar' },
  { label: 'Bayilik', to: '/bayilik' },
  { label: 'Hakkımızda', to: '/hakkimizda' },
  { label: 'İletişim', to: '/iletisim' },
]

const mobileOpen = ref(false)
const scrolled = ref(false)

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
      <NuxtLink to="/" class="flex items-baseline gap-2 group">
        <span class="font-display text-2xl font-extrabold tracking-tight text-primary-900 group-hover:text-primary-800 transition-colors">
          Sadöksan
        </span>
        <span class="hidden sm:block text-[10px] font-semibold uppercase tracking-[0.22em] text-accent-600">
          inşaat
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

        <NuxtLink
          v-if="!isDealer"
          to="/bayi"
          class="hidden md:inline-flex btn-outline h-10 px-4 text-xs"
        >
          <Icon name="lucide:user-cog" class="h-4 w-4" />
          Bayi Girişi
        </NuxtLink>

        <div
          v-else
          class="hidden md:flex items-center gap-2 px-3 h-10 rounded-md bg-primary-900 text-white"
        >
          <Icon name="lucide:badge-check" class="h-4 w-4 text-accent-400" />
          <span class="text-xs font-semibold">{{ dealer?.code }}</span>
          <span class="text-[10px] uppercase tracking-wider text-accent-400">
            {{ dealer?.city }}
          </span>
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
          <NuxtLink to="/bayi" class="btn-outline mt-2 justify-start">
            <Icon name="lucide:user-cog" class="h-4 w-4" />
            Bayi Girişi
          </NuxtLink>
        </div>
      </div>
    </Transition>
  </header>
</template>
