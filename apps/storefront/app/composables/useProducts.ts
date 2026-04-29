/**
 * Mock catalog. Backend gelene kadar tek source of truth burası.
 * Bayi modu fiyat hesabı useDealer.computePrice() üzerinden yapılır.
 */

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
}

const PRODUCTS: Product[] = [
  {
    id: 'p-001',
    slug: 'roca-victoria-lavabo-bataryasi',
    name: 'Victoria Lavabo Bataryası',
    brand: 'Roca',
    category: 'Bataryalar',
    price: 2490,
    image: 'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    stockCount: 24,
    badges: ['Yeni'],
  },
  {
    id: 'p-002',
    slug: 'vitra-sento-asma-klozet-set',
    name: 'Sento Asma Klozet Seti',
    brand: 'VitrA',
    category: 'Vitrifiye',
    price: 7890,
    image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    stockCount: 8,
    badges: ['Çok Satan'],
  },
  {
    id: 'p-003',
    slug: 'nsk-cobalt-yarim-boy-lavabo',
    name: 'Cobalt Yarım Boy Lavabo',
    brand: 'NSK',
    category: 'Vitrifiye',
    price: 1290,
    image: 'https://images.unsplash.com/photo-1631889993959-41b4e9c6e3c5?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    stockCount: 41,
  },
  {
    id: 'p-004',
    slug: 'selen-berlin-dus-sistemi-termostatik',
    name: 'Berlin Termostatik Duş Sistemi',
    brand: 'Selen',
    category: 'Duş Sistemleri',
    price: 5490,
    image: 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    stockCount: 12,
    badges: ['Premium'],
  },
  {
    id: 'p-005',
    slug: 'fleko-aria-banyo-bataryasi',
    name: 'Aria Banyo Bataryası',
    brand: 'Fleko',
    category: 'Bataryalar',
    price: 1890,
    image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80&hue=20',
    inStock: true,
    stockCount: 33,
  },
  {
    id: 'p-006',
    slug: 'monza-lyra-lavabo-bataryasi',
    name: 'Lyra Lavabo Bataryası',
    brand: 'Monza',
    category: 'Bataryalar',
    price: 1290,
    image: 'https://images.unsplash.com/photo-1565182999561-18d7dc61c393?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    stockCount: 56,
  },
  {
    id: 'p-007',
    slug: 'eca-mia-eviye-bataryasi',
    name: 'Mia Eviye Bataryası',
    brand: 'Eca',
    category: 'Bataryalar',
    price: 950,
    image: 'https://images.unsplash.com/photo-1620916297397-a4a5402a3c6c?auto=format&fit=crop&w=800&q=80',
    inStock: true,
    stockCount: 78,
    badges: ['İndirim'],
  },
  {
    id: 'p-008',
    slug: 'artema-a4-asma-klozet',
    name: 'A4 Rim-Ex Asma Klozet',
    brand: 'Artema',
    category: 'Vitrifiye',
    price: 4290,
    image: 'https://images.unsplash.com/photo-1564540583246-934409427776?auto=format&fit=crop&w=800&q=80',
    inStock: false,
    stockCount: 0,
  },
]

export const useProducts = () => {
  const list = () => PRODUCTS

  const featured = (limit = 8) => PRODUCTS.slice(0, limit)

  const byBrand = (brand: string) => PRODUCTS.filter((p) => p.brand === brand)

  const byCategory = (category: string) => PRODUCTS.filter((p) => p.category === category)

  const findBySlug = (slug: string) => PRODUCTS.find((p) => p.slug === slug)

  return { list, featured, byBrand, byCategory, findBySlug }
}
