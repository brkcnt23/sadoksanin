/** Kategori ve marka master data. Mock — sonradan API'den çekilecek. */

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
  /** Tek satır marka logosu — şu an metin tabanlı sergileyeceğiz. */
  tagline?: string
}

const CATEGORIES: Category[] = [
  {
    slug: 'bataryalar',
    name: 'Bataryalar',
    description: 'Lavabo, banyo, eviye ve termostatik bataryalar',
    image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=900&q=80',
    productCount: 642,
  },
  {
    slug: 'vitrifiye',
    name: 'Vitrifiye',
    description: 'Klozet, lavabo, rezervuar ve set ürünleri',
    image: 'https://images.unsplash.com/photo-1564540583246-934409427776?auto=format&fit=crop&w=900&q=80',
    productCount: 384,
  },
  {
    slug: 'dus-sistemleri',
    name: 'Duş Sistemleri',
    description: 'Termostatik, ankastre ve set duş sistemleri',
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=900&q=80',
    productCount: 218,
  },
  {
    slug: 'banyo-aksesuarlari',
    name: 'Banyo Aksesuarları',
    description: 'Havluluk, sabunluk, askı, etajer',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80',
    productCount: 1124,
  },
  {
    slug: 'banyo-mobilyasi',
    name: 'Banyo Mobilyası',
    description: 'Lavabo dolapları, aynalı üst dolaplar, boy dolaplar',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80',
    productCount: 296,
  },
  {
    slug: 'sihhi-tesisat',
    name: 'Sıhhi Tesisat',
    description: 'Boru, fitting, vana, sayaç ve tesisat ekipmanları',
    image: 'https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=900&q=80',
    productCount: 1356,
  },
]

const BRANDS: Brand[] = [
  { slug: 'roca', name: 'Roca', tagline: 'Yetkili Distribütör' },
  { slug: 'vitra', name: 'VitrA' },
  { slug: 'nsk', name: 'NSK' },
  { slug: 'selen', name: 'Selen', tagline: 'Yetkili Distribütör' },
  { slug: 'fleko', name: 'Fleko' },
  { slug: 'monza', name: 'Monza' },
  { slug: 'eca', name: 'Eca' },
  { slug: 'artema', name: 'Artema' },
  { slug: 'kale', name: 'Kale' },
  { slug: 'serel', name: 'Serel' },
  { slug: 'ercos', name: 'Ercos' },
  { slug: 'creavit', name: 'Creavit' },
]

export const useCatalog = () => ({
  categories: () => CATEGORIES,
  brands: () => BRANDS,
})
