<script setup lang="ts">
const route = useRoute()

const categories = [
  {
    label: 'Seramik',
    to: '/kategori/seramik',
    children: [
      { label: '60 x 120 Seramikler', to: '/kategori/seramik/60x120' },
      { label: '40 x 120 Seramikler', to: '/kategori/seramik/40x120' },
      { label: '30 x 90 Seramikler', to: '/kategori/seramik/30x90' },
      { label: '30 x 60 Seramikler', to: '/kategori/seramik/30x60' },
      { label: '61 x 61 Seramikler', to: '/kategori/seramik/61x61' },
      { label: '60 x 60 Seramikler', to: '/kategori/seramik/60x60' },
      { label: '45 x 45 Seramikler', to: '/kategori/seramik/45x45' },
      { label: '20 x 120 Seramikler', to: '/kategori/seramik/20x120' },
      { label: '15 x 60 Seramikler', to: '/kategori/seramik/15x60' },
      { label: 'Uygulama Destek Ürünleri', to: '/kategori/seramik/destek' },
      { label: 'Seramik Derz Artıkları', to: '/kategori/seramik/derz' },
      { label: 'Seramik Klips & Takozlar', to: '/kategori/seramik/klips' },
      { label: 'Seramik Profil Çıta & Bordürler', to: '/kategori/seramik/profil' },
    ],
  },
  {
    label: 'Vitrifiye',
    to: '/kategori/vitrifiye',
    children: [],
  },
  {
    label: 'RTRMAX',
    to: '/kategori/rtrmax',
    children: [],
  },
  {
    label: 'Banyo Grubu & Kabin',
    to: '/kategori/banyo-grubu-kabin',
    children: [],
  },
  {
    label: 'Banyo Aksesuarları',
    to: '/kategori/banyo-aksesuarlari',
    children: [],
  },
  {
    label: 'Batarya ve Musluklar',
    to: '/kategori/batarya-musluklar',
    children: [],
  },
  {
    label: 'Silikon & Köpük & Sprey Boya',
    to: '/kategori/silikon-kopuk-sprey',
    children: [],
  },
  {
    label: 'İnsört Ürünler',
    to: '/kategori/insort',
    children: [],
  },
  {
    label: 'Yapı Kimyasalları',
    to: '/kategori/yapi-kimyasallari',
    children: [],
  },
]

// Pinned: tıklanmış kategori index'i, null = hiçbiri
const pinned = ref<number | null>(null)
// Hovered: mouse üzerinde olan kategori index'i
const hovered = ref<number | null>(null)

// Dropdown hangi kategori için açık?
const activeIndex = computed(() => pinned.value ?? hovered.value)

function onCategoryClick(index: number) {
  if (categories[index].children.length === 0) {
    pinned.value = null
    return
  }
  // Aynı kategori → toggle (kapat)
  pinned.value = pinned.value === index ? null : index
}

function onMouseEnter(index: number) {
  hovered.value = index
}

function onMouseLeave() {
  hovered.value = null
}

// Route değişince pinned'ı temizle
watch(() => route.fullPath, () => { pinned.value = null })

// Dışarı tıklanınca pinned'ı temizle
const navRef = ref<HTMLElement | null>(null)
onMounted(() => {
  document.addEventListener('click', onOutsideClick)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onOutsideClick)
})
function onOutsideClick(e: MouseEvent) {
  if (navRef.value && !navRef.value.contains(e.target as Node)) {
    pinned.value = null
  }
}
</script>

<template>
  <nav
    ref="navRef"
    class="sticky top-[80px] z-30 w-full bg-primary-900 shadow-md"
  >
    <!-- Kategori butonları -->
    <div class="flex items-stretch justify-center overflow-x-auto scrollbar-none">
      <button
        v-for="(cat, i) in categories"
        :key="cat.to"
        type="button"
        class="flex-shrink-0 px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors whitespace-nowrap border-b-2"
        :class="[
          activeIndex === i
            ? 'bg-white text-primary-900 border-accent-500'
            : 'text-white/90 hover:text-white hover:bg-primary-800 border-transparent'
        ]"
        @click="onCategoryClick(i)"
        @mouseenter="onMouseEnter(i)"
        @mouseleave="onMouseLeave"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- Dropdown paneli -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="activeIndex !== null && categories[activeIndex].children.length > 0"
        class="absolute left-0 right-0 bg-white border-t border-ink-100 shadow-lg"
        @mouseenter="onMouseEnter(activeIndex!)"
        @mouseleave="onMouseLeave"
      >
        <div class="container-x py-5">
          <!-- Kategori başlığı (link) -->
          <NuxtLink
            :to="categories[activeIndex!].to"
            class="inline-flex items-center gap-1.5 mb-4 text-sm font-bold text-primary-900 hover:text-accent-600 transition-colors"
            @click="pinned = null"
          >
            {{ categories[activeIndex!].label }}
            <Icon name="lucide:arrow-right" class="h-4 w-4" />
            <span class="text-xs font-normal text-ink-500">— Tümünü Görüntüle</span>
          </NuxtLink>

          <!-- Alt kategoriler -->
          <ul class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-2">
            <li
              v-for="child in categories[activeIndex!].children"
              :key="child.to"
            >
              <NuxtLink
                :to="child.to"
                class="text-sm text-ink-700 hover:text-primary-900 hover:underline underline-offset-2 transition-colors"
                @click="pinned = null"
              >
                {{ child.label }}
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </nav>
</template>
