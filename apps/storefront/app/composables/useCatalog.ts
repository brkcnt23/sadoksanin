/**
 * Kategori ve marka master data — API'den çeker.
 * Gerçek ürün verilerinden türetilir (distinct category/brand).
 */

export interface Category {
  slug: string
  name: string
  description: string
  image: string
  productCount: number
}

export interface Brand {
  slug: string
  name: string
  tagline?: string
}

const CATEGORY_META: Record<string, { description: string; image: string }> = {
  'Seramik': { description: '60×120, 40×120, 30×90 ve daha fazlası', image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=900&q=80' },
  'Vitrifiye': { description: 'Klozet, lavabo, rezervuar ve set ürünleri', image: 'https://images.unsplash.com/photo-1564540583246-934409427776?auto=format&fit=crop&w=900&q=80' },
  'Batarya ve Musluklar': { description: 'Banyo, mutfak, eviye bataryaları ve musluklar', image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=900&q=80' },
  'Banyo Grubu & Kabin': { description: 'Banyo dolapları, boy dolapları ve duş kabinleri', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80' },
  'Banyo Aksesuarları': { description: 'Havluluk, sabunluk, askı ve sifonlar', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80' },
  'RTRMAX': { description: 'Profesyonel el aletleri ve ekipmanlar', image: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=900&q=80' },
  'Silikon & Köpük & Sprey Boya': { description: 'Silikon, mastik, köpük ve yapıştırıcılar', image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=900&q=80' },
  'Yapı Kimyasalları': { description: 'Alçı, sıva, izolasyon ve yapıştırıcılar', image: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=900&q=80' },
  'İnsört Ürünler': { description: 'İnşaat insört ve ankraj ürünleri', image: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=900&q=80' },
  'Banyo Grubu&Kabin': { description: 'Banyo dolapları, boy dolapları ve duş kabinleri', image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80' },
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 've')
    .replace(/[^a-z0-9ğüşıöç\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export const useCatalog = () => {
  const categories = useState<Category[]>('catalog.categories', () => [])
  const brands = useState<Brand[]>('catalog.brands', () => [])
  const loaded = useState('catalog.loaded', () => false)

  const fetchCatalog = async () => {
    if (loaded.value) return

    try {
      const api = useApi()
      const [catRes, brandRes] = await Promise.all([
        api.get<{ categories: string[] }>('/products/filters/categories'),
        api.get<{ brands: string[] }>('/products/filters/brands'),
      ])

      const catNames: string[] = catRes.categories || []
      const brandNames: string[] = brandRes.brands || []

      const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toLocaleUpperCase('tr-TR'))

      categories.value = catNames.map((name) => ({
        slug: slugify(name),
        name: titleCase(name),
        description: CATEGORY_META[name]?.description || '',
        image: CATEGORY_META[name]?.image || 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=900&q=80',
        productCount: 0,
      }))

      brands.value = brandNames.map((name) => ({
        slug: slugify(name),
        name,
      }))

      loaded.value = true
    } catch {
      // API offline — boş bırak, UI fallback gösterir
    }
  }

  // Fetch on first call (non-blocking)
  if (import.meta.client) {
    fetchCatalog()
  }

  return {
    categories: readonly(categories),
    brands: readonly(brands),
    fetchCatalog,
  }
}
