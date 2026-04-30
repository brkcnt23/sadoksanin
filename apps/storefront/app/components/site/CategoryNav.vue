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
    children: [
      { label: 'Klozetler', to: '/kategori/klozetler' },
      { label: 'Arkadan/Alttan Çıkışlı Klozetler', to: '/kategori/arkadan-alttan-cikisli-klozetler' },
      { label: 'Asma Klozetler', to: '/kategori/asma-klozet' },
      { label: 'Duvara Dayalı Klozetler', to: '/kategori/duvara-dayali-klozetler' },
      { label: 'Pisuvarlar', to: '/kategori/pisuvar' },
      { label: 'Lavabolar', to: '/kategori/lavabolar' },
      { label: 'Etajerli', to: '/kategori/etajerli' },
      { label: 'Lavabo Yarım Ayak & Tam Ayak', to: '/kategori/lavabo-yarim-ayak-tam-ayak' },
      { label: 'Tezgah Üstü & Tezgah Altı Lavabolar', to: '/kategori/lavabolar-1' },
      { label: 'Engelli Serisi', to: '/kategori/engeli-vitrifiye-serisi' },
      { label: 'Hela Taşları', to: '/kategori/hela-taslari' },
    ],
  },
  {
    label: 'RTRMAX',
    to: '/kategori/rtrmax',
    children: [],
  },
  {
    label: 'Banyo Grubu & Kabin',
    to: '/kategori/banyo-grubu',
    children: [
      { label: 'Banyo Mobilyaları', to: '/kategori/banyo-dolaplari' },
      { label: 'Banyo Dolapları', to: '/kategori/banyo-dolaplari-1' },
      { label: 'Boy Dolapları', to: '/kategori/boy-dolaplari' },
      { label: 'Kabin', to: '/kategori/kabin' },
    ],
  },
  {
    label: 'Banyo Aksesuarları',
    to: '/kategori/banyo-aksesuarlari',
    children: [
      { label: 'Diğer', to: '/kategori/diger' },
      { label: 'Yer Sifonları', to: '/kategori/yer-sifonlari' },
    ],
  },
  {
    label: 'Batarya ve Musluklar',
    to: '/kategori/batarya-ve-musluklar',
    children: [
      { label: 'Banyo Bataryası', to: '/kategori/banyo-bataryasi' },
      { label: 'Duş Sistemleri', to: '/kategori/dus-sistemleri' },
      { label: 'Eviye (mutfak) Bataryası', to: '/kategori/evye-mutfak-bataryasi' },
      { label: 'Eviye Setleri', to: '/kategori/eviye-setleri' },
      { label: 'Lavabo Bataryası', to: '/kategori/lavabo-bataryasi' },
      { label: 'Musluklar', to: '/kategori/musluklar' },
    ],
  },
  {
    label: 'Silikon & Köpük & Sprey Boya',
    to: '/kategori/silikon-kopuk',
    children: [
      { label: 'Silikonlar', to: '/kategori/genel-amacli-silikonlar' },
      { label: 'Mastikler', to: '/kategori/mastikler' },
      { label: 'Köpükler (Pu)', to: '/kategori/kopukler-pu' },
      { label: 'Yapıştırıcılar', to: '/kategori/yapistiricilar' },
      { label: 'Diğer Ürünler', to: '/kategori/multispreyler' },
      { label: 'Sprey Boyalar', to: '/kategori/sprey-boyalar' },
      { label: 'Yardımcı Ürünler', to: '/kategori/yardimci-urunler' },
    ],
  },
  {
    label: 'Yapı Kimyasalları',
    to: '/kategori/alci-alci-plaka',
    children: [
      { label: 'Alçı-Sıva-İzolasyon', to: '/kategori/alci-siva-izolasyon' },
      { label: 'Fayans Yapıştırıcı & Derz Dolgusu', to: '/kategori/fayans-yapistirici' },
      { label: 'Derz Dolgular', to: '/kategori/derz-dolgular' },
      { label: 'Fayans Yapıştırıcılar', to: '/kategori/fayans-yapistiricilar' },
    ],
  },
  {
    label: 'İnsört Ürünler',
    to: '/kategori/insort-urunler',
    children: [],
  },
]

// Click ile pinned
const pinned = ref<number | null>(null)
// Hover ile temporary
const hovered = ref<number | null>(null)
// Dropdown göster mi? pinned varsa hep, yoksa hovered varsa
const activeIndex = computed(() => pinned.value ?? hovered.value)
const activeCategory = computed(() => {
  const index = activeIndex.value
  return index === null ? null : categories[index] ?? null
})

const lastCategory = computed(() => categories[categories.length - 1])

// LeaveTimeout: gap'de close'ı delay'le
let leaveTimeout: ReturnType<typeof setTimeout> | null = null

function onCategoryClick(index: number) {
  const category = categories[index]
  if (!category || category.children.length === 0) {
    pinned.value = null
    return
  }
  // Toggle: click ise permanent
  pinned.value = pinned.value === index ? null : index
  // Timeout'u temizle çünkü artık pinned'ız
  if (leaveTimeout) clearTimeout(leaveTimeout)
}

function onMouseEnter(index: number) {
  // Timeout'u temizle — hovering başladı
  if (leaveTimeout) clearTimeout(leaveTimeout)
  hovered.value = index
}

function onMouseLeave() {
  // Timeout ile delay'le: 100ms'de hovered = null
  // (button-to-panel gap varsa panel'e giriş timeout'u clear'layacak)
  leaveTimeout = setTimeout(() => {
    hovered.value = null
    leaveTimeout = null
  }, 100)
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
  if (leaveTimeout) clearTimeout(leaveTimeout)
})
function onOutsideClick(e: MouseEvent) {
  if (navRef.value && !navRef.value.contains(e.target as Node)) {
    pinned.value = null
    hovered.value = null
    if (leaveTimeout) clearTimeout(leaveTimeout)
  }
}
</script>

<template>
  <nav
    ref="navRef"
    class="sticky top-[64px] lg:top-[80px] z-30 w-full bg-primary-900 shadow-md"
  >
    <!-- Kategori butonları -->
    <div class="flex items-center justify-between gap-2 overflow-x-auto px-3 py-2 scrollbar-none lg:items-stretch lg:justify-start lg:gap-0 lg:px-0 lg:py-0">
      <!-- Normal Categories -->
      <div class="flex items-center gap-2 overflow-x-auto scrollbar-none lg:items-stretch lg:gap-0">
        <button
          v-for="(cat, i) in categories.slice(0, -1)"
          :key="cat.to"
          type="button"
          class="flex-shrink-0 rounded-full border border-white/10 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors whitespace-nowrap lg:rounded-none lg:border-x-0 lg:border-t-0 lg:px-4 lg:py-3 lg:text-xs lg:border-b-2"
          :class="[
            activeIndex === i
              ? 'bg-white text-primary-900 border-white lg:border-accent-500'
              : 'text-white/90 hover:text-white hover:bg-primary-800 border-white/10 lg:border-transparent'
          ]"
          @click="onCategoryClick(i)"
          @mouseenter="onMouseEnter(i)"
          @mouseleave="onMouseLeave"
        >
          {{ cat.label }}
        </button>
      </div>

      <!-- İnsört Ürünler (Special - Right aligned) -->
      <button
        v-if="lastCategory"
        type="button"
        class="flex-shrink-0 rounded-full border-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition-colors whitespace-nowrap lg:rounded-none lg:border-x-0 lg:border-t-0 lg:px-4 lg:py-3 lg:text-xs"
        :class="[
          activeIndex === categories.length - 1
            ? 'bg-accent-500 text-white border-accent-500 lg:border-accent-500'
            : 'bg-accent-500/20 text-accent-500 border-accent-500 hover:bg-accent-500/30'
        ]"
        @click="onCategoryClick(categories.length - 1)"
        @mouseenter="onMouseEnter(categories.length - 1)"
        @mouseleave="onMouseLeave"
      >
        {{ lastCategory.label }}
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
        v-if="activeIndex !== null && activeCategory && activeCategory.children.length > 0"
        class="absolute left-0 right-0 max-h-[65vh] overflow-y-auto bg-white border-t border-ink-100 shadow-lg"
        @mouseenter="onMouseEnter(activeIndex!)"
        @mouseleave="onMouseLeave"
      >
        <div class="container-x py-4 lg:py-5">
          <!-- Kategori başlığı (link) -->
          <NuxtLink
            :to="activeCategory.to"
            class="inline-flex items-center gap-1.5 mb-4 text-sm font-bold text-primary-900 hover:text-accent-600 transition-colors"
            @click="pinned = null"
          >
            {{ activeCategory.label }}
            <Icon name="lucide:arrow-right" class="h-4 w-4" />
            <span class="text-xs font-normal text-ink-500">— Tümünü Görüntüle</span>
          </NuxtLink>

          <!-- Alt kategoriler -->
          <ul class="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-2">
            <li
              v-for="child in activeCategory.children"
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
