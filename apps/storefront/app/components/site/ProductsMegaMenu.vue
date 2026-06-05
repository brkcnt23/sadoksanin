<script setup lang="ts">
/**
 * ProductsMegaMenu — full-width ürün panosu.
 *
 * Tema: beyaz zemin, siyah inline SVG ikonlar (CSS currentColor).
 * Yeni: Kategori hover'ında sağda görsel önizleme paneli.
 */

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const route = useRoute()

interface Subcategory {
  label: string
  to: string
}

interface Category {
  label: string
  to: string
  iconPaths: string[]
  iconFills?: string[]
  image?: string
  children: Subcategory[]
}

const categories: Category[] = [
  {
    label: 'Seramik',
    to: '/kategori/seramik',
    iconPaths: [
      'M3 9h18 M3 15h18 M9 3v18 M15 3v18',
      'M3 3h18v18H3z',
    ],
    children: [
      { label: '60 x 120 Seramikler', to: '/kategori/seramik/60x120' },
      { label: '40 x 120 Seramikler', to: '/kategori/seramik/40x120' },
      { label: '30 x 90 Seramikler', to: '/kategori/seramik/30x90' },
      { label: '30 x 60 Seramikler', to: '/kategori/seramik/30x60' },
      { label: '60 x 60 Seramikler', to: '/kategori/seramik/60x60' },
      { label: '45 x 45 Seramikler', to: '/kategori/seramik/45x45' },
      { label: 'Klips & Takozlar', to: '/kategori/seramik/klips' },
      { label: 'Profil & Bordürler', to: '/kategori/seramik/profil' },
    ],
  },
  {
    label: 'Vitrifiye',
    to: '/kategori/vitrifiye',
    iconPaths: [
      'M5 3h11a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8l-3 4v-4a3 3 0 0 1 0-6V3z',
      'M9 9h7',
    ],
    children: [
      { label: 'Klozetler', to: '/kategori/klozetler' },
      { label: 'Asma Klozetler', to: '/kategori/asma-klozet' },
      { label: 'Pisuvarlar', to: '/kategori/pisuvar' },
      { label: 'Lavabolar', to: '/kategori/lavabolar' },
      { label: 'Tezgah Üstü Lavabolar', to: '/kategori/lavabolar-1' },
      { label: 'Engelli Serisi', to: '/kategori/engeli-vitrifiye-serisi' },
      { label: 'Hela Taşları', to: '/kategori/hela-taslari' },
    ],
  },
  {
    label: 'Batarya ve Musluklar',
    to: '/kategori/batarya-ve-musluklar',
    iconPaths: [
      'M12 3v6 M8 9h8 M9 9v3a3 3 0 0 0 6 0V9 M12 15v3 M9 21h6',
    ],
    children: [
      { label: 'Banyo Bataryası', to: '/kategori/banyo-bataryasi' },
      { label: 'Lavabo Bataryası', to: '/kategori/lavabo-bataryasi' },
      { label: 'Eviye (Mutfak) Bataryası', to: '/kategori/evye-mutfak-bataryasi' },
      { label: 'Eviye Setleri', to: '/kategori/eviye-setleri' },
      { label: 'Duş Sistemleri', to: '/kategori/dus-sistemleri' },
      { label: 'Musluklar', to: '/kategori/musluklar' },
    ],
  },
  {
    label: 'Banyo Grubu & Kabin',
    to: '/kategori/banyo-grubu',
    iconPaths: [
      'M4 3h16v18H4z',
      'M12 3v18 M7 12h.01 M17 12h.01',
    ],
    children: [
      { label: 'Banyo Mobilyaları', to: '/kategori/banyo-dolaplari' },
      { label: 'Banyo Dolapları', to: '/kategori/banyo-dolaplari-1' },
      { label: 'Boy Dolapları', to: '/kategori/boy-dolaplari' },
      { label: 'Duş Kabinleri', to: '/kategori/kabin' },
    ],
  },
  {
    label: 'Banyo Aksesuarları',
    to: '/kategori/banyo-aksesuarlari',
    iconPaths: [
      'M3 7h18 M5 7v10 M19 7v10 M3 17h18',
      'M8 11h8 M8 14h8',
    ],
    children: [
      { label: 'Yer Sifonları', to: '/kategori/yer-sifonlari' },
      { label: 'Aksesuar Setleri', to: '/kategori/diger' },
    ],
  },
  {
    label: 'Silikon & Köpük & Sprey Boya',
    to: '/kategori/silikon-kopuk',
    iconPaths: [
      'M9 3h6v4H9z',
      'M8 7h8l-1 14H9L8 7z',
      'M11 11v6',
    ],
    children: [
      { label: 'Silikonlar', to: '/kategori/genel-amacli-silikonlar' },
      { label: 'Mastikler', to: '/kategori/mastikler' },
      { label: 'Köpükler (PU)', to: '/kategori/kopukler-pu' },
      { label: 'Yapıştırıcılar', to: '/kategori/yapistiricilar' },
      { label: 'Sprey Boyalar', to: '/kategori/sprey-boyalar' },
      { label: 'Multispreyler', to: '/kategori/multispreyler' },
      { label: 'Yardımcı Ürünler', to: '/kategori/yardimci-urunler' },
    ],
  },
  {
    label: 'Yapı Kimyasalları',
    to: '/kategori/alci-alci-plaka',
    iconPaths: [
      'M5 8h14l-2 12H7L5 8z',
      'M8 8a4 4 0 0 1 8 0',
      'M9 13h6',
    ],
    children: [
      { label: 'Alçı-Sıva-İzolasyon', to: '/kategori/alci-siva-izolasyon' },
      { label: 'Fayans Yapıştırıcı', to: '/kategori/fayans-yapistirici' },
      { label: 'Derz Dolgular', to: '/kategori/derz-dolgular' },
    ],
  },
  {
    label: 'RTRMAX',
    to: '/kategori/rtrmax',
    iconPaths: [
      'M20 12L12 20 3 11V3h8l9 9z',
      'M7 7h.01',
    ],
    children: [
      { label: 'Tüm RTRMAX Ürünleri', to: '/kategori/rtrmax' },
    ],
  },
  {
    label: 'İnsört Ürünler',
    to: '/kategori/insort-urunler',
    iconPaths: [
      'M12 3v4 M12 17v4 M3 12h4 M17 12h4',
      'M5.6 5.6l2.8 2.8 M15.6 15.6l2.8 2.8 M5.6 18.4l2.8-2.8 M15.6 8.4l2.8-2.8',
      'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z',
    ],
    children: [
      { label: 'Tüm İnsört Ürünler', to: '/kategori/insort-urunler' },
    ],
  },
]

// ── Hover tracking for right-side image preview ──
const hoveredIndex = ref<number | null>(null)
const previewImage = ref<string | null>(null)
// Geçiş animasyonu için ayrı bir ref (fade efektini yönetmek için)
const showPreview = ref(false)
let previewTimer: ReturnType<typeof setTimeout> | null = null

function onCategoryEnter(index: number) {
  if (previewTimer) clearTimeout(previewTimer)
  hoveredIndex.value = index
  // Kategori görselini belirle
  const cat = categories[index]
  if (cat) {
    previewImage.value = categoryImages.value[cat.label] || null
  }
  // Küçük bir gecikmeyle animasyonu tetikle
  requestAnimationFrame(() => {
    showPreview.value = true
  })
}

function onCategoryLeave() {
  previewTimer = setTimeout(() => {
    hoveredIndex.value = null
    showPreview.value = false
  }, 150)
}

// ── Kategori görselleri ──
// API'den rastgele ürün görselleri çekip kategorilere atıyoruz
const categoryImages = ref<Record<string, string>>({})

async function fetchCategoryImages() {
  try {
    const api = useApi()
    const data = await api.get<any>('/products', { limit: 50 })
    // API'den dönen yapı: { data: [...], total: N } veya direkt array
    const products = Array.isArray(data) ? data : (data?.data || data?.items || [])

    if (!Array.isArray(products) || products.length === 0) return

    // Her kategoriye bir ürün görseli ata (farklı ürünler)
    const used = new Set<number>()
    const catNames = categories.map(c => c.label)

    for (let i = 0; i < catNames.length; i++) {
      const idx = i < products.length ? i : i % products.length
      if (used.has(idx)) continue
      used.add(idx)
      const product = products[idx]
      if (!product) continue

      // Ürün görselini al — farklı alan adlarını dene
      const img =
        product.primaryImage ||
        product.image ||
        product.imageUrl ||
        (Array.isArray(product.images) ? product.images[0] : product.images) ||
        ''
      if (img && typeof img === 'string') {
        categoryImages.value[catNames[i]] = img
      }
    }
  } catch {
    // Sessiz hata — görseller olmadan da menü çalışır
  }
}

onMounted(() => {
  fetchCategoryImages()
})

// ── Outside click & ESC handling ──
const panelRef = ref<HTMLElement | null>(null)

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}

function onClickOutside(e: MouseEvent) {
  if (!props.open) return
  const target = e.target as HTMLElement
  if (target.closest('[data-mega-trigger]')) return
  if (panelRef.value && !panelRef.value.contains(target)) {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('click', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeyDown)
  document.removeEventListener('click', onClickOutside)
  if (previewTimer) clearTimeout(previewTimer)
})

// Route değişince kapan
watch(() => route.fullPath, () => {
  if (props.open) emit('close')
})

// Body scroll lock
watch(() => props.open, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
  if (!open) {
    hoveredIndex.value = null
    showPreview.value = false
  }
})
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="open"
      ref="panelRef"
      class="absolute left-0 right-0 top-full z-30 max-h-[calc(100vh-5rem)] overflow-y-auto border-t border-ink-100 bg-white shadow-2xl"
      role="dialog"
      aria-label="Ürünler"
    >
      <div class="container-x py-8 lg:py-10">
        <!-- Header -->
        <div class="mb-8 flex items-end justify-between border-b border-ink-100 pb-4">
          <h2 class="font-display text-2xl font-bold text-primary-900 lg:text-3xl">
            Ürünler &amp; Uygulamalar
          </h2>
          <button
            type="button"
            class="grid h-10 w-10 place-items-center rounded-full text-ink-500 hover:bg-ink-50 hover:text-primary-900 transition-colors"
            aria-label="Kapat"
            @click="emit('close')"
          >
            <Icon name="lucide:x" class="h-5 w-5" />
          </button>
        </div>

        <!-- Ana içerik: sol kategori grid + sağ görsel panel -->
        <div class="flex gap-8">
          <!-- Sol: Kategori grid -->
          <div class="flex-1 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div
              v-for="(cat, i) in categories"
              :key="cat.to"
              class="flex flex-col gap-3"
              @mouseenter="onCategoryEnter(i)"
              @mouseleave="onCategoryLeave"
            >
              <!-- Kategori başlığı + ikon -->
              <NuxtLink
                :to="cat.to"
                class="group flex items-center gap-3 text-primary-900 transition-colors hover:text-accent-600"
                @click="emit('close')"
              >
                <span
                  class="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg border border-ink-200 bg-white text-ink-900 transition-all duration-200 group-hover:border-accent-500 group-hover:text-accent-600 group-hover:shadow-sm"
                  :class="{ 'border-accent-400 text-accent-600 shadow-sm scale-105': hoveredIndex === i }"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.6"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="h-7 w-7"
                    aria-hidden="true"
                  >
                    <path
                      v-for="(d, j) in cat.iconPaths"
                      :key="j"
                      :d="d"
                    />
                  </svg>
                </span>
                <span class="flex items-center gap-1 text-base font-semibold tracking-tight">
                  {{ cat.label }}
                  <Icon
                    name="lucide:arrow-right"
                    class="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                  />
                </span>
              </NuxtLink>

              <!-- Alt kategoriler -->
              <ul v-if="cat.children.length" class="flex flex-col gap-1.5">
                <li
                  v-for="child in cat.children"
                  :key="child.to"
                >
                  <NuxtLink
                    :to="child.to"
                    class="text-sm text-ink-600 transition-colors hover:text-primary-900 hover:underline underline-offset-2"
                    @click="emit('close')"
                  >
                    {{ child.label }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>

          <!-- Sağ: Görsel önizleme paneli (desktop only) -->
          <div class="hidden xl:block w-72 flex-shrink-0">
            <div class="sticky top-8">
              <Transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 translate-x-4 scale-95"
                enter-to-class="opacity-100 translate-x-0 scale-100"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-x-0 scale-100"
                leave-to-class="opacity-0 -translate-x-4 scale-95"
              >
                <div
                  v-if="showPreview && previewImage"
                  class="overflow-hidden rounded-2xl border border-ink-100 bg-ink-50 shadow-card"
                >
                  <img
                    :src="previewImage"
                    :alt="hoveredIndex !== null ? categories[hoveredIndex]?.label : ''"
                    class="h-64 w-full object-cover"
                    loading="lazy"
                  />
                  <div class="p-4">
                    <p class="text-sm font-semibold text-primary-900">
                      {{ hoveredIndex !== null ? categories[hoveredIndex]?.label : '' }}
                    </p>
                    <NuxtLink
                      v-if="hoveredIndex !== null"
                      :to="categories[hoveredIndex]?.to"
                      class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
                      @click="emit('close')"
                    >
                      Tümünü Gör
                      <Icon name="lucide:arrow-right" class="h-3 w-3" />
                    </NuxtLink>
                  </div>
                </div>

                <!-- Görsel yoksa placeholder -->
                <div
                  v-else-if="showPreview && !previewImage"
                  class="overflow-hidden rounded-2xl border border-ink-100 bg-gradient-to-br from-ink-50 to-primary-50 p-8"
                >
                  <div class="flex flex-col items-center justify-center h-48 text-center gap-3">
                    <Icon name="lucide:image" class="h-12 w-12 text-ink-300" />
                    <p class="text-sm text-ink-500">
                      {{ hoveredIndex !== null ? categories[hoveredIndex]?.label : 'Kategori' }}
                    </p>
                    <span class="text-xs text-ink-400">Görsel yakında eklenecek</span>
                  </div>
                </div>
              </Transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
