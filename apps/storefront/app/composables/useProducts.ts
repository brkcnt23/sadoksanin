/**
 * Product catalog — fetches from NestJS API /products
 * Caches locally with fallback to hardcoded data during development
 */

import { ref } from 'vue'
// import { useApi } from './useApi'

export interface Product {
  id: string
  slug: string
  name: string
  brand: string
  category: string
  /** B2C taban fiyatı (TL) */
  price: number
  image: string
  inStock: boolean
  stockCount: number
  badges?: string[]
  sku?: string
  description?: string
}

// Fallback data for development if API is down
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'p-001',
    slug: 'akgun-60x120n-everest-beige',
    name: '60X120N PK LF EVEREST BEIGE 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 320,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/124/ekran-goruntusu-2026-01-28-133503_min.png',
    inStock: true,
    stockCount: 45,
    sku: '9110',
    description: 'Premium seramik kaplama, 60x120 cm, mat finish',
  },
  {
    id: 'p-002',
    slug: 'akgun-60x120n-navas-siyah',
    name: '60X120N PK LF NAVAS SIYAH 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 315,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/111/ekran-goruntusu-2026-01-28-124911_min.png',
    inStock: true,
    stockCount: 38,
    sku: '9097',
    description: 'Siyah seramik kaplama, 60x120 cm, premium kalite',
  },
  {
    id: 'p-003',
    slug: 'akgun-60x120n-loft-gri',
    name: '60X120N PK LF LOFT GRI 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 325,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/070/loft_min.png',
    inStock: true,
    stockCount: 52,
    sku: '9057',
    description: 'Gri tonlu loft tarzı seramik, 60x120 cm',
  },
  {
    id: 'p-004',
    slug: 'akgun-60x120n-galaxy-siyah',
    name: '60X120N PK LF GALAXY SIYAH 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 330,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/069/gll_min.png',
    inStock: true,
    stockCount: 28,
    sku: '9056',
    description: 'Galaxy koleksiyonu, siyah renkli seramik',
  },
  {
    id: 'p-005',
    slug: 'akgun-60x120n-durban-anthracite',
    name: '60X120N PK LF DURBAN ANTHRACITE 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 310,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/068/durbn_min.png',
    inStock: true,
    stockCount: 35,
    sku: '9055',
    description: 'Durban serisi, antrasit renkli seramik',
  },
  {
    id: 'p-006',
    slug: 'akgun-60x120n-neo-cal-gold',
    name: '60X120N PK LF NEO CAL GOLD 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 340,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/580/ekran-goruntusu-2025-08-09-161047_min.jpg',
    inStock: true,
    stockCount: 22,
    sku: '8938',
    description: 'Kalahari altın tonlu, premium seramik',
    badges: ['Premium'],
  },
  {
    id: 'p-007',
    slug: 'akgun-61x61-cement-antrst',
    name: '61X61 KR MT CEMENT ANTRST 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 285,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/680/ekran-goruntusu-2026-03-04-150222_min.png',
    inStock: true,
    stockCount: 60,
    sku: '9176',
    description: 'Kare format seramik, 61x61 cm, cement görünüm',
  },
  {
    id: 'p-008',
    slug: 'akgun-60x120n-navas-acik-gri',
    name: '60X120N PK LF NAVAS ACIK GRI 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 312,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/146/ekran-goruntusu-2026-02-13-150924_min.png',
    inStock: true,
    stockCount: 41,
    sku: '9131',
    description: 'Açık gri Navas seramik, 60x120 cm',
  },
  {
    id: 'p-009',
    slug: 'akgun-60x120n-loft-bone',
    name: '60X120N PK LF LOFT BONE 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 328,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/145/ekran-goruntusu-2026-02-13-151043_min.png',
    inStock: true,
    stockCount: 33,
    sku: '9130',
    description: 'Loft serisi, kemik tonlu seramik',
  },
  {
    id: 'p-010',
    slug: 'akgun-60x120n-armani',
    name: '60X120N PK LF ARMANI 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 335,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/143/ekran-goruntusu-2026-02-13-154739_min.png',
    inStock: true,
    stockCount: 25,
    sku: '9128',
    description: 'Armani koleksiyonu, şık seramik kaplama',
  },
  {
    id: 'p-011',
    slug: 'akgun-60x120n-durban-grey',
    name: '60X120N PK LF DURBAN GREY 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 312,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/121/ekran-goruntusu-2026-01-28-133012_min.png',
    inStock: true,
    stockCount: 39,
    sku: '9107',
    description: 'Durban serisi, gri renkli premium seramik',
  },
  {
    id: 'p-012',
    slug: 'akgun-60x120n-roud-siyah',
    name: '60X120N PK LF ROUD SIYAH 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 320,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/120/hzo581fd-1_min.jpg',
    inStock: true,
    stockCount: 30,
    sku: '9106',
    description: 'Roud koleksiyonu, siyah seramik',
  },
  {
    id: 'p-013',
    slug: 'akgun-60x120n-monta-white',
    name: '60X120N PK LF MONTA WHITE 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 305,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/119/ekran-goruntusu-2026-02-11-150613_min.png',
    inStock: true,
    stockCount: 48,
    sku: '9105',
    description: 'Monta koleksiyonu, beyaz seramik kaplama',
  },
  {
    id: 'p-014',
    slug: 'akgun-60x120n-neo-assos-nero',
    name: '60X120N PK LF NEO ASSOS NERO 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 332,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/118/ekran-goruntusu-2026-01-28-130216_min.png',
    inStock: true,
    stockCount: 26,
    sku: '9104',
    description: 'Neo Assos seri, nero siyah seramik',
  },
  {
    id: 'p-015',
    slug: 'akgun-60x120n-afel-night',
    name: '60X120N PK LF AFEL NIGHT 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 328,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/115/ekran-goruntusu-2026-02-23-115455_min.png',
    inStock: true,
    stockCount: 34,
    sku: '9101',
    description: 'Afel night koleksiyonu, koyu seramik',
    badges: ['Yeni'],
  },
  {
    id: 'p-016',
    slug: 'akgun-60x120n-everest-grey',
    name: '60X120N PK MT EVEREST GREY 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 318,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/997/ekran-alintisi-1_min.JPG',
    inStock: true,
    stockCount: 42,
    sku: '8980',
    description: 'Everest serisi, gri mat seramik',
  },
  {
    id: 'p-017',
    slug: 'akgun-60x120n-everest-anthracite',
    name: '60X120N PK MT EVEREST ANTHRACITE 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 320,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/996/ekran-alintisi-1_min.JPG',
    inStock: true,
    stockCount: 36,
    sku: '8979',
    description: 'Everest serisi, antrasit mat seramik',
  },
  {
    id: 'p-018',
    slug: 'akgun-60x120n-neo-assos-grey',
    name: '60X120N PK LF NEO ASSOS GREY 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 330,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/994/ekran-alintisi-1_min.JPG',
    inStock: true,
    stockCount: 29,
    sku: '8977',
    description: 'Neo Assos serisi, gri seramik',
  },
  {
    id: 'p-019',
    slug: 'akgun-60x120n-marmol-antrst',
    name: '60X120N PK LF MARMOL ANTRST 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 335,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/993/ekran-alintisi-1_min.JPG',
    inStock: true,
    stockCount: 23,
    sku: '8976',
    description: 'Marmol koleksiyonu, antrasit seramik',
  },
  {
    id: 'p-020',
    slug: 'akgun-60x120n-marmol-bone',
    name: '60X120N PK LF MARMOL BONE 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 333,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/992/ekran-alintisi-1_min.JPG',
    inStock: true,
    stockCount: 27,
    sku: '8975',
    description: 'Marmol koleksiyonu, kemik tonlu seramik',
  },
  {
    id: 'p-021',
    slug: 'akgun-60x120n-statuario-classic',
    name: '60X120N PK LF STATUARIO CLASSIC 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 340,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/671/ekran-alintisi-1_min.JPG',
    inStock: true,
    stockCount: 20,
    sku: '8955',
    description: 'Statuario klasik, premium beyaz seramik',
    badges: ['Premium'],
  },
  {
    id: 'p-022',
    slug: 'akgun-60x120n-portoro-siyah',
    name: '60X120N PK LF PORTORO SIYAH 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 345,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/670/ekran-alintisi-1_min.JPG',
    inStock: true,
    stockCount: 18,
    sku: '8954',
    description: 'Portoro serisi, siyah premium seramik',
  },
  {
    id: 'p-023',
    slug: 'akgun-60x120n-carrara-beyaz',
    name: '60X120N PK LF CARRARA BEYAZ 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 338,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/667/ekran-alintisi-1_min.JPG',
    inStock: true,
    stockCount: 31,
    sku: '8951',
    description: 'Carrara mermer etkili, beyaz premium seramik',
  },
  {
    id: 'p-024',
    slug: 'akgun-60x120n-durban-white',
    name: '60X120N PK LF DURBAN WHITE 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 310,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/666/ekran-alintisi-1_min.JPG',
    inStock: true,
    stockCount: 44,
    sku: '8950',
    description: 'Durban serisi, beyaz seramik kaplama',
  },
  {
    id: 'p-025',
    slug: 'akgun-60x120n-cement-gri',
    name: '60X120N PK MT CEMENT GRI 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 295,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/469/cement-gri_min.png',
    inStock: true,
    stockCount: 55,
    sku: '8906',
    description: 'Cement etkili, gri mat seramik',
    badges: ['İndirim'],
  },
  {
    id: 'p-026',
    slug: 'akgun-60x120n-neo-pulpis-light',
    name: '60X120N PK LF NEO PULPIS LIGHT 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 315,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/468/ekran-alintisi_min.JPG',
    inStock: true,
    stockCount: 32,
    sku: '8905',
    description: 'Neo Pulpis serisi, açık ton seramik',
  },
  {
    id: 'p-027',
    slug: 'akgun-60x120n-cement-antrst',
    name: '60X120N PK MT CEMENT ANTRST 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 297,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/467/ekran-goruntusu-2026-03-04-150222_min.png',
    inStock: true,
    stockCount: 50,
    sku: '8904',
    description: 'Cement etkili, antrasit mat seramik',
  },
  {
    id: 'p-028',
    slug: 'akgun-60x120n-neo-pulpis-nero',
    name: '60X120N PK LF NEO PULPIS NERO 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 320,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/330/ekran-alintisi-1_min.JPG',
    inStock: true,
    stockCount: 24,
    sku: '8804',
    description: 'Neo Pulpis serisi, siyah seramik',
  },
  {
    id: 'p-029',
    slug: 'akgun-60x120n-neo-cal-silver',
    name: '60X120N PK LF NEO CAL SILVER 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 338,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/328/neo-calacatta_min.png',
    inStock: true,
    stockCount: 19,
    sku: '8802',
    description: 'Kalahari gümüş tonlu, premium seramik',
    badges: ['Premium'],
  },
  {
    id: 'p-030',
    slug: 'akgun-60x120n-neo-pulpis-grey',
    name: '60x120N PK LF NEO PULPIS GREY 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    price: 318,
    image: 'https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/329/pulpis_min.png',
    inStock: true,
    stockCount: 37,
    sku: '8803',
    description: 'Neo Pulpis serisi, gri seramik',
  },
]

/**
 * Maps NestJS Product (Prisma schema) → storefront Product shape.
 * Backend ships richer fields (basePrice, displayStock, taxRate, …) that
 * the catalog UI doesn't need; we project to the lean local interface.
 */
interface ApiProduct {
  id: string
  sku?: string
  name: string
  brand: string
  category: string
  basePrice: number
  description?: string | null
  displayStock?: number
  visible?: boolean
}

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const mapApiProduct = (p: ApiProduct): Product => ({
  id: p.id,
  slug: slugify(`${p.brand}-${p.name}`),
  name: p.name,
  brand: p.brand,
  category: p.category,
  price: p.basePrice,
  image: '', // TODO: wire product image once asset migration lands
  inStock: (p.displayStock ?? 0) > 0,
  stockCount: p.displayStock ?? 0,
  sku: p.sku,
  description: p.description ?? undefined,
})

export const useProducts = () => {
  const products = ref<Product[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  let fetched = false

  /**
   * Loads catalog from /products (public endpoint, no auth required).
   * On failure, falls back to local fixtures so the UI never sees an empty
   * catalog during dev — log a warning, surface the error in `error.value`.
   */
  const load = async () => {
    if (fetched || loading.value) return

    loading.value = true
    error.value = null

    try {
      const api = useApi()
      const response = await api.get<{ products: ApiProduct[]; total: number }>('/products', {
        limit: 1000,
      })
      products.value = response.products.map(mapApiProduct)
      fetched = true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Ürünler yüklenemedi'
      console.warn('[useProducts] API load failed, using fallback fixtures:', err)
      products.value = FALLBACK_PRODUCTS
      fetched = true
    } finally {
      loading.value = false
    }
  }

  const list = () => products.value

  const featured = (limit = 8) => products.value.filter((p) => p.badges?.includes('Premium')).slice(0, limit)

  const byBrand = (brand: string) => products.value.filter((p) => p.brand === brand)

  const byCategory = (category: string) => products.value.filter((p) => p.category === category)

  const findBySlug = (slug: string) => products.value.find((p) => p.slug === slug)

  const findById = (id: string) => products.value.find((p) => p.id === id)

  const inStock = () => products.value.filter((p) => p.inStock)

  const search = (query: string) => {
    const q = query.toLowerCase()
    return products.value.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
    )
  }

  return { list, featured, byBrand, byCategory, findBySlug, findById, inStock, search, load, loading, error }
}
