<script setup lang="ts">
/**
 * ProductsMegaMenu — full-width ürün panosu.
 *
 * Özellikler:
 * - Kategori hover → o kategorinin görseli
 * - Sub kategori hover → kendi görseli + ölçü çizgileri (width/height varsa)
 * - Her kategori ve sub kategori için farklı görsel (API'den çekilir)
 * - Görseller kolayca değiştirilebilir (image alanını güncelle yeter)
 */

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const route = useRoute()

// ── Data structures ──────────────────────────────────────────

interface Subcategory {
  label: string
  to: string
  /** Görsel URL — boşsa API'den otomatik atanır, elle değiştirilebilir */
  image?: string
  /** Ölçü çizgisi için genişlik (örn: 60) */
  width?: number
  /** Ölçü çizgisi için yükseklik (örn: 120) */
  height?: number
  /** Ölçü birimi (default: cm) */
  unit?: string
}

interface Category {
  label: string
  to: string
  /** Parent kategori slug'ı — sub kategoriler bu slug üzerinden filtreleme yapar */
  slug: string
  iconPaths: string[]
  iconFills?: string[]
  /** Ana kategori görseli — boşsa API'den otomatik atanır */
  image?: string
  children: Subcategory[]
}

/**
 * Sub kategori linklerini oluşturur: parent kategori sayfasına gider + arama filtresi ekler.
 * Örn: "60 x 120 Seramikler" → /kategori/seramik?ara=60x120
 */
function subTo(parentSlug: string, label: string): string {
  // Label'dan arama terimi çıkar: "60 x 120 Seramikler" → "60 x 120"
  const cleaned = label
    .replace(/seramikler/gi, '')
    .replace(/tüm\s*/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
  const searchTerm = cleaned || label
  return `/kategori/${parentSlug}?ara=${encodeURIComponent(searchTerm)}`
}

const categories: Category[] = [
  {
    label: 'Seramik',
    to: '/kategori/seramik',
    slug: 'seramik',
    iconPaths: [
      'M3 9h18 M3 15h18 M9 3v18 M15 3v18',
      'M3 3h18v18H3z',
    ],
    children: [
      { label: '60 x 120 Seramikler', to: subTo('seramik', '60 x 120 Seramikler'), width: 60, height: 120, unit: 'cm' },
      { label: '40 x 120 Seramikler', to: subTo('seramik', '40 x 120 Seramikler'), width: 40, height: 120, unit: 'cm' },
      { label: '30 x 90 Seramikler', to: subTo('seramik', '30 x 90 Seramikler'), width: 30, height: 90, unit: 'cm' },
      { label: '30 x 60 Seramikler', to: subTo('seramik', '30 x 60 Seramikler'), width: 30, height: 60, unit: 'cm' },
      { label: '60 x 60 Seramikler', to: subTo('seramik', '60 x 60 Seramikler'), width: 60, height: 60, unit: 'cm' },
      { label: '45 x 45 Seramikler', to: subTo('seramik', '45 x 45 Seramikler'), width: 45, height: 45, unit: 'cm' },
      { label: 'Klips & Takozlar', to: subTo('seramik', 'Klips & Takozlar') },
      { label: 'Profil & Bordürler', to: subTo('seramik', 'Profil & Bordürler') },
    ],
  },
  {
    label: 'Vitrifiye',
    to: '/kategori/vitrifiye',
    slug: 'vitrifiye',
    iconPaths: [
      'M5 3h11a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H8l-3 4v-4a3 3 0 0 1 0-6V3z',
      'M9 9h7',
    ],
    children: [
      { label: 'Klozetler', to: subTo('vitrifiye', 'Klozet') },
      { label: 'Asma Klozetler', to: subTo('vitrifiye', 'Asma Klozet') },
      { label: 'Pisuvarlar', to: subTo('vitrifiye', 'Pisuvar') },
      { label: 'Lavabolar', to: subTo('vitrifiye', 'Lavabo') },
      { label: 'Tezgah Üstü Lavabolar', to: subTo('vitrifiye', 'Tezgah Üstü') },
      { label: 'Engelli Serisi', to: subTo('vitrifiye', 'Engelli') },
      { label: 'Hela Taşları', to: subTo('vitrifiye', 'Hela Taşı') },
    ],
  },
  {
    label: 'Batarya ve Musluklar',
    to: '/kategori/batarya-ve-musluklar',
    slug: 'batarya-ve-musluklar',
    iconPaths: [
      'M12 3v6 M8 9h8 M9 9v3a3 3 0 0 0 6 0V9 M12 15v3 M9 21h6',
    ],
    children: [
      { label: 'Banyo Bataryası', to: subTo('batarya-ve-musluklar', 'Banyo Bataryası') },
      { label: 'Lavabo Bataryası', to: subTo('batarya-ve-musluklar', 'Lavabo Bataryası') },
      { label: 'Eviye (Mutfak) Bataryası', to: subTo('batarya-ve-musluklar', 'Eviye') },
      { label: 'Eviye Setleri', to: subTo('batarya-ve-musluklar', 'Eviye Set') },
      { label: 'Duş Sistemleri', to: subTo('batarya-ve-musluklar', 'Duş') },
      { label: 'Musluklar', to: subTo('batarya-ve-musluklar', 'Musluk') },
    ],
  },
  {
    label: 'Banyo Grubu & Kabin',
    to: '/kategori/banyo-grubu',
    slug: 'banyo-grubu',
    iconPaths: [
      'M4 3h16v18H4z',
      'M12 3v18 M7 12h.01 M17 12h.01',
    ],
    children: [
      { label: 'Banyo Mobilyaları', to: subTo('banyo-grubu', 'Banyo Mobilya') },
      { label: 'Banyo Dolapları', to: subTo('banyo-grubu', 'Banyo Dolap') },
      { label: 'Boy Dolapları', to: subTo('banyo-grubu', 'Boy Dolap') },
      { label: 'Duş Kabinleri', to: subTo('banyo-grubu', 'Duş Kabin') },
    ],
  },
  {
    label: 'Banyo Aksesuarları',
    to: '/kategori/banyo-aksesuarlari',
    slug: 'banyo-aksesuarlari',
    iconPaths: [
      'M3 7h18 M5 7v10 M19 7v10 M3 17h18',
      'M8 11h8 M8 14h8',
    ],
    children: [
      { label: 'Yer Sifonları', to: subTo('banyo-aksesuarlari', 'Yer Sifon') },
      { label: 'Aksesuar Setleri', to: subTo('banyo-aksesuarlari', 'Aksesuar Set') },
    ],
  },
  {
    label: 'Silikon & Köpük & Sprey Boya',
    to: '/kategori/silikon-kopuk',
    slug: 'silikon-kopuk',
    iconPaths: [
      'M9 3h6v4H9z',
      'M8 7h8l-1 14H9L8 7z',
      'M11 11v6',
    ],
    children: [
      { label: 'Silikonlar', to: subTo('silikon-kopuk', 'Silikon') },
      { label: 'Mastikler', to: subTo('silikon-kopuk', 'Mastik') },
      { label: 'Köpükler (PU)', to: subTo('silikon-kopuk', 'Köpük') },
      { label: 'Yapıştırıcılar', to: subTo('silikon-kopuk', 'Yapıştırıcı') },
      { label: 'Sprey Boyalar', to: subTo('silikon-kopuk', 'Sprey Boya') },
      { label: 'Multispreyler', to: subTo('silikon-kopuk', 'Multisprey') },
      { label: 'Yardımcı Ürünler', to: subTo('silikon-kopuk', 'Yardımcı') },
    ],
  },
  {
    label: 'Yapı Kimyasalları',
    to: '/kategori/alci-alci-plaka',
    slug: 'alci-alci-plaka',
    iconPaths: [
      'M5 8h14l-2 12H7L5 8z',
      'M8 8a4 4 0 0 1 8 0',
      'M9 13h6',
    ],
    children: [
      { label: 'Alçı-Sıva-İzolasyon', to: subTo('alci-alci-plaka', 'Alçı') },
      { label: 'Fayans Yapıştırıcı', to: subTo('alci-alci-plaka', 'Fayans Yapıştırıcı') },
      { label: 'Derz Dolgular', to: subTo('alci-alci-plaka', 'Derz') },
    ],
  },
  {
    label: 'RTRMAX',
    to: '/kategori/rtrmax',
    slug: 'rtrmax',
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
    slug: 'insort-urunler',
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

// ── Görsel mapping — her entry (kategori + sub) için benzersiz key ──
// Key format: "Cat:Seramik" veya "Sub:Seramik:60x120"
type PreviewEntry = {
  type: 'category' | 'subcategory'
  label: string
  to: string
  width?: number
  height?: number
  unit?: string
}

const hoveredEntry = ref<PreviewEntry | null>(null)
const previewImage = ref<string | null>(null)
const showPreview = ref(false)
let previewTimer: ReturnType<typeof setTimeout> | null = null

function onCategoryEnter(catIndex: number) {
  if (previewTimer) clearTimeout(previewTimer)
  const cat = categories[catIndex]
  if (!cat) return

  hoveredEntry.value = {
    type: 'category',
    label: cat.label,
    to: cat.to,
  }
  // Önce varsa manuel image, yoksa API'den atanan
  previewImage.value = cat.image || allImages.value[`Cat:${cat.label}`] || null
  requestAnimationFrame(() => { showPreview.value = true })
}

function onSubcategoryEnter(catIndex: number, subIndex: number) {
  if (previewTimer) clearTimeout(previewTimer)
  const cat = categories[catIndex]
  const sub = cat?.children[subIndex]
  if (!sub) return

  hoveredEntry.value = {
    type: 'subcategory',
    label: sub.label,
    to: sub.to,
    width: sub.width,
    height: sub.height,
    unit: sub.unit || 'cm',
  }
  // Sub kategori görseli: manuel > API'den atanan > parent kategorinin görseli
  previewImage.value =
    sub.image ||
    allImages.value[`Sub:${cat.label}:${sub.label}`] ||
    cat.image ||
    allImages.value[`Cat:${cat.label}`] ||
    null
  requestAnimationFrame(() => { showPreview.value = true })
}

function onAnyLeave() {
  previewTimer = setTimeout(() => {
    hoveredEntry.value = null
    showPreview.value = false
  }, 150)
}

// ── Görsel havuzu — her entry için benzersiz görsel ──
const allImages = ref<Record<string, string>>({})

async function fetchAllImages() {
  try {
    const api = useApi()
    const data = await api.get<any>('/products', { limit: 100 })
    const products: any[] = Array.isArray(data) ? data : (data?.data || data?.items || [])
    if (!products.length) return

    // Görseli olan ürünleri topla
    const imgs: string[] = []
    for (const p of products) {
      const img = p.primaryImage || p.image || p.imageUrl ||
        (Array.isArray(p.images) ? p.images[0] : p.images) || ''
      if (img && typeof img === 'string' && !imgs.includes(img)) {
        imgs.push(img)
      }
    }
    if (!imgs.length) return

    let imgIdx = 0
    const used = new Set<string>()

    // Her kategori + her sub kategori için benzersiz görsel ata
    for (const cat of categories) {
      // Ana kategori
      const catKey = `Cat:${cat.label}`
      if (imgIdx < imgs.length) {
        allImages.value[catKey] = imgs[imgIdx]
        used.add(imgs[imgIdx])
        imgIdx++
      }

      // Sub kategoriler
      for (const sub of cat.children) {
        const subKey = `Sub:${cat.label}:${sub.label}`
        // Bir sonraki farklı görseli bul
        let next = imgs[imgIdx % imgs.length]
        let tries = 0
        while (used.has(next) && tries < imgs.length) {
          imgIdx++
          next = imgs[imgIdx % imgs.length]
          tries++
        }
        allImages.value[subKey] = next
        used.add(next)
        imgIdx++
      }
    }
  } catch { /* sessiz */ }
}

onMounted(() => { fetchAllImages() })

// ── Outside click & ESC ──
const panelRef = ref<HTMLElement | null>(null)

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}
function onClickOutside(e: MouseEvent) {
  if (!props.open) return
  const target = e.target as HTMLElement
  if (target.closest('[data-mega-trigger]')) return
  if (panelRef.value && !panelRef.value.contains(target)) emit('close')
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

watch(() => route.fullPath, () => { if (props.open) emit('close') })
watch(() => props.open, (open) => {
  if (typeof document === 'undefined') return
  document.body.style.overflow = open ? 'hidden' : ''
  if (!open) { hoveredEntry.value = null; showPreview.value = false }
})

// ── Hesaplanan: ölçü çizgisi gösterilsin mi? ──
const showDimensions = computed(() =>
  hoveredEntry.value?.type === 'subcategory' &&
  hoveredEntry.value?.width != null &&
  hoveredEntry.value?.height != null
)
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

        <!-- Ana içerik: sol grid + sağ panel -->
        <div class="flex gap-8">
          <!-- Sol: Kategori grid -->
          <div class="flex-1 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div
              v-for="(cat, ci) in categories"
              :key="cat.to"
              class="flex flex-col gap-3"
            >
              <!-- Ana kategori başlığı -->
              <NuxtLink
                :to="cat.to"
                class="group flex items-center gap-3 text-primary-900 transition-colors hover:text-accent-600"
                @mouseenter="onCategoryEnter(ci)"
                @mouseleave="onAnyLeave"
                @click="emit('close')"
              >
                <span
                  class="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg border border-ink-200 bg-white text-ink-900 transition-all duration-200 group-hover:border-accent-500 group-hover:text-accent-600 group-hover:shadow-sm"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"
                       stroke-linecap="round" stroke-linejoin="round" class="h-7 w-7" aria-hidden="true">
                    <path v-for="(d, j) in cat.iconPaths" :key="j" :d="d" />
                  </svg>
                </span>
                <span class="flex items-center gap-1 text-base font-semibold tracking-tight">
                  {{ cat.label }}
                  <Icon name="lucide:arrow-right"
                        class="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </span>
              </NuxtLink>

              <!-- Sub kategoriler -->
              <ul v-if="cat.children.length" class="flex flex-col gap-1.5">
                <li v-for="(sub, si) in cat.children" :key="sub.to">
                  <NuxtLink
                    :to="sub.to"
                    class="text-sm text-ink-600 transition-colors hover:text-primary-900 hover:underline underline-offset-2"
                    @mouseenter="onSubcategoryEnter(ci, si)"
                    @mouseleave="onAnyLeave"
                    @click="emit('close')"
                  >
                    {{ sub.label }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </div>

          <!-- Sağ: Görsel önizleme paneli (desktop only) -->
          <div class="hidden xl:block w-80 flex-shrink-0">
            <div class="sticky top-8">
              <Transition
                enter-active-class="transition-all duration-300 ease-out"
                enter-from-class="opacity-0 translate-x-4 scale-95"
                enter-to-class="opacity-100 translate-x-0 scale-100"
                leave-active-class="transition-all duration-200 ease-in"
                leave-from-class="opacity-100 translate-x-0 scale-100"
                leave-to-class="opacity-0 -translate-x-4 scale-95"
              >
                <!-- Görselli panel -->
                <div
                  v-if="showPreview && previewImage"
                  class="overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-card"
                >
                  <!-- Görsel + ölçü çizgileri -->
                  <div class="relative" :class="showDimensions ? 'pt-8 pr-10' : ''">
                    <!-- ═══ Ölçü çizgileri (teknik çizim stili) ═══ -->
                    <Transition name="dimension">
                      <template v-if="showDimensions">
                        <!-- ▸ Üst yatay çizgi — genişlik -->
                        <div class="absolute top-2 left-2 right-10 flex items-center gap-1.5">
                          <!-- Sol ok başı -->
                          <div class="h-4 w-px bg-accent-500 flex-shrink-0" />
                          <!-- Çizgi -->
                          <div class="h-px flex-1 bg-accent-400/60" />
                          <!-- Sağ ok başı -->
                          <div class="h-4 w-px bg-accent-500 flex-shrink-0" />
                          <!-- Ölçü yazısı -->
                          <span class="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-bold text-accent-600 whitespace-nowrap tracking-tight bg-white/80 px-1 rounded">
                            {{ hoveredEntry?.width }} {{ hoveredEntry?.unit }}
                          </span>
                        </div>

                        <!-- ▸ Sağ dikey çizgi — yükseklik -->
                        <div class="absolute top-2 right-4 bottom-2 flex flex-col items-center gap-1.5">
                          <!-- Üst ok başı -->
                          <div class="h-px w-4 bg-accent-500 flex-shrink-0" />
                          <!-- Çizgi -->
                          <div class="w-px flex-1 bg-accent-400/60" />
                          <!-- Alt ok başı -->
                          <div class="h-px w-4 bg-accent-500 flex-shrink-0" />
                          <!-- Ölçü yazısı -->
                          <span class="absolute right-6 top-1/2 -translate-y-1/2 text-[11px] font-bold text-accent-600 whitespace-nowrap tracking-tight bg-white/80 px-1 rounded">
                            {{ hoveredEntry?.height }} {{ hoveredEntry?.unit }}
                          </span>
                        </div>
                      </template>
                    </Transition>

                    <!-- Ürün görseli -->
                    <img
                      :src="previewImage"
                      :alt="hoveredEntry?.label || ''"
                      class="w-full object-cover rounded-lg transition-all duration-300"
                      :class="showDimensions ? 'h-48' : 'h-64'"
                      loading="lazy"
                    />
                  </div>

                  <!-- Alt bilgi -->
                  <div class="px-4 pb-4">
                    <p class="text-sm font-semibold text-primary-900">
                      {{ hoveredEntry?.label }}
                    </p>
                    <p v-if="hoveredEntry?.type === 'subcategory'" class="text-xs text-ink-400 mt-0.5">
                      {{ categories.find(c => c.children.some(s => s.label === hoveredEntry?.label))?.label }}
                    </p>
                    <NuxtLink
                      v-if="hoveredEntry"
                      :to="hoveredEntry.to"
                      class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-accent-600 hover:text-accent-700 transition-colors"
                      @click="emit('close')"
                    >
                      Tümünü Gör
                      <Icon name="lucide:arrow-right" class="h-3 w-3" />
                    </NuxtLink>
                  </div>
                </div>

                <!-- Placeholder (görsel yoksa) -->
                <div
                  v-else-if="showPreview && !previewImage"
                  class="overflow-hidden rounded-2xl border border-ink-100 bg-gradient-to-br from-ink-50 to-primary-50 p-8"
                >
                  <div class="flex flex-col items-center justify-center h-56 text-center gap-3">
                    <Icon name="lucide:image" class="h-12 w-12 text-ink-300" />
                    <p class="text-sm font-medium text-ink-500">{{ hoveredEntry?.label || 'Kategori' }}</p>
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

<style scoped>
/* Ölçü çizgisi draw-in animasyonu */
.dimension-enter-active {
  transition: opacity 0.4s ease-out;
}
.dimension-leave-active {
  transition: opacity 0.15s ease-in;
}
.dimension-enter-from,
.dimension-leave-to {
  opacity: 0;
}
</style>
