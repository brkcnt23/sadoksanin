/**
 * Product store — list, filter, edit, sync.
 * Wired to NestJS API: /products/admin/all, /products/:id/visibility, etc.
 * Fallback products for development (until backend is ready)
 */
import { defineStore } from 'pinia'
import type { Product } from '~/types'

// Fallback products for development
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 'p-001',
    netsisCode: '9110',
    sku: '9110',
    name: '60X120N PK LF EVEREST BEIGE 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    description: 'Premium seramik kaplama, 60x120 cm, mat finish',
    images: ['https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/124/ekran-goruntusu-2026-01-28-133503_min.png'],
    basePrice: 320,
    taxRate: 0.2,
    unit: 'adet',
    visible: true,
    purchasable: true,
    netsisStock: 45,
    reservedStock: 0,
    displayStock: 45,
    lastNetsisSync: new Date().toISOString(),
    syncStatus: 'synced',
    variations: [],
    minimumStock: 10,
    middleStock: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-002',
    netsisCode: '9097',
    sku: '9097',
    name: '60X120N PK LF NAVAS SIYAH 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    description: 'Siyah seramik kaplama, 60x120 cm, premium kalite',
    images: ['https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/111/ekran-goruntusu-2026-01-28-124911_min.png'],
    basePrice: 315,
    taxRate: 0.2,
    unit: 'adet',
    visible: true,
    purchasable: true,
    netsisStock: 38,
    reservedStock: 0,
    displayStock: 38,
    lastNetsisSync: new Date().toISOString(),
    syncStatus: 'synced',
    variations: [],
    minimumStock: 10,
    middleStock: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-003',
    netsisCode: '9057',
    sku: '9057',
    name: '60X120N PK LF LOFT GRI 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    description: 'Gri tonlu loft tarzı seramik, 60x120 cm',
    images: ['https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/070/loft_min.png'],
    basePrice: 325,
    taxRate: 0.2,
    unit: 'adet',
    visible: true,
    purchasable: true,
    netsisStock: 52,
    reservedStock: 0,
    displayStock: 52,
    lastNetsisSync: new Date().toISOString(),
    syncStatus: 'synced',
    variations: [],
    minimumStock: 10,
    middleStock: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-004',
    netsisCode: '9056',
    sku: '9056',
    name: '60X120N PK LF GALAXY SIYAH 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    description: 'Galaxy koleksiyonu, siyah renkli seramik',
    images: ['https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/069/gll_min.png'],
    basePrice: 330,
    taxRate: 0.2,
    unit: 'adet',
    visible: true,
    purchasable: true,
    netsisStock: 28,
    reservedStock: 0,
    displayStock: 28,
    lastNetsisSync: new Date().toISOString(),
    syncStatus: 'synced',
    variations: [],
    minimumStock: 10,
    middleStock: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'p-005',
    netsisCode: '9055',
    sku: '9055',
    name: '60X120N PK LF DURBAN ANTHRACITE 1.K SR',
    brand: 'AKGÜN',
    category: 'Seramik',
    description: 'Durban serisi, antrasit renkli seramik',
    images: ['https://www.sadoksaninsaat.com.tr/idea/nf/44/myassets/products/068/durbn_min.png'],
    basePrice: 310,
    taxRate: 0.2,
    unit: 'adet',
    visible: true,
    purchasable: true,
    netsisStock: 35,
    reservedStock: 0,
    displayStock: 35,
    lastNetsisSync: new Date().toISOString(),
    syncStatus: 'synced',
    variations: [],
    minimumStock: 10,
    middleStock: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

interface State {
  items: Product[]
  loading: boolean
  loaded: boolean
  search: string
  filter: {
    category: string | null
    visibility: 'all' | 'visible' | 'hidden'
    purchasable: 'all' | 'yes' | 'no'
    syncStatus: 'all' | 'synced' | 'pending' | 'error' | 'never'
    stock: 'all' | 'in-stock' | 'low' | 'out'
  }
  sort: { key: keyof Product; dir: 'asc' | 'desc' }
  page: number
  pageSize: number
  error: string | null
}

export const useProductsStore = defineStore('products', {
  state: (): State => ({
    items: [],
    loading: false,
    loaded: false,
    search: '',
    filter: { category: null, visibility: 'all', purchasable: 'all', syncStatus: 'all', stock: 'all' },
    sort: { key: 'name', dir: 'asc' },
    page: 1,
    pageSize: 25,
    error: null,
  }),

  getters: {
    categories: (s) => Array.from(new Set(s.items.map((p) => p.category))).sort(),

    filtered(s): Product[] {
      const q = s.search.trim().toLowerCase()
      let list = s.items

      if (q) {
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.netsisCode.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q),
        )
      }
      if (s.filter.category) list = list.filter((p) => p.category === s.filter.category)
      if (s.filter.visibility !== 'all')
        list = list.filter((p) => (s.filter.visibility === 'visible' ? p.visible : !p.visible))
      if (s.filter.purchasable !== 'all')
        list = list.filter((p) => (s.filter.purchasable === 'yes' ? p.purchasable : !p.purchasable))
      if (s.filter.syncStatus !== 'all') list = list.filter((p) => p.syncStatus === s.filter.syncStatus)
      if (s.filter.stock !== 'all') {
        list = list.filter((p) => {
          if (s.filter.stock === 'in-stock') return p.displayStock > (p.minimumStock || 5)
          if (s.filter.stock === 'low') return p.displayStock > 0 && p.displayStock <= (p.minimumStock || 5)
          return p.displayStock === 0
        })
      }

      const { key, dir } = s.sort
      const sign = dir === 'asc' ? 1 : -1
      list = [...list].sort((a, b) => {
        const av = a[key] as unknown
        const bv = b[key] as unknown
        if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sign
        return String(av).localeCompare(String(bv), 'tr') * sign
      })
      return list
    },

    paginated(): Product[] {
      const start = (this.page - 1) * this.pageSize
      return this.filtered.slice(start, start + this.pageSize)
    },

    totalPages(): number {
      return Math.max(1, Math.ceil(this.filtered.length / this.pageSize))
    },

    lowStockCount: (s) => s.items.filter((p) => p.displayStock > 0 && p.displayStock <= (p.minimumStock || 5)).length,
    outOfStockCount: (s) => s.items.filter((p) => p.displayStock === 0).length,
  },

  actions: {
    async load() {
      if (this.loaded) return

      this.loading = true
      this.error = null

      try {
        const api = useApi()
        // Try to fetch from API; fallback to mock data if unavailable
        try {
          const response = await api.get<{ products: Product[]; total: number }>('/products/admin/all', {
            limit: 10000, // Load all for admin panel filtering
          })
          this.items = response.products
        } catch (apiErr) {
          // Fallback to mock data during development
          console.warn('API unavailable, using fallback products:', apiErr)
          this.items = FALLBACK_PRODUCTS
        }
        this.loaded = true
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Ürünler yüklenemedi'
        console.error('Products load failed:', err)
        // Use fallback as last resort
        this.items = FALLBACK_PRODUCTS
        this.loaded = true
      } finally {
        this.loading = false
      }
    },

    setSearch(q: string) {
      this.search = q
      this.page = 1
    },

    setFilter<K extends keyof State['filter']>(key: K, value: State['filter'][K]) {
      this.filter[key] = value
      this.page = 1
    },

    setSort(key: keyof Product) {
      if (this.sort.key === key) this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc'
      else {
        this.sort.key = key
        this.sort.dir = 'asc'
      }
    },

    setPage(p: number) {
      this.page = Math.max(1, Math.min(p, this.totalPages))
    },

    async toggleVisible(id: string) {
      const p = this.items.find((x) => x.id === id)
      if (!p) return

      try {
        const api = useApi()
        const updated = await api.post<Product>(`/products/${id}/visibility`, {
          visible: !p.visible,
        })
        // Update local state
        const idx = this.items.findIndex((x) => x.id === id)
        if (idx !== -1) {
          this.items[idx] = updated
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Güncellenemedi'
        console.error('Toggle visibility failed:', err)
      }
    },

    async togglePurchasable(id: string) {
      const p = this.items.find((x) => x.id === id)
      if (!p) return

      try {
        const api = useApi()
        const updated = await api.post<Product>(`/products/${id}/purchasable`, {
          purchasable: !p.purchasable,
        })
        // Update local state
        const idx = this.items.findIndex((x) => x.id === id)
        if (idx !== -1) {
          this.items[idx] = updated
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Güncellenemedi'
        console.error('Toggle purchasable failed:', err)
      }
    },

    async updateStockThresholds(id: string, minimumStock: number, middleStock?: number) {
      try {
        const api = useApi()
        const updated = await api.post<Product>(`/products/${id}/stock-thresholds`, {
          minimumStock,
          middleStock,
        })
        // Update local state
        const idx = this.items.findIndex((x) => x.id === id)
        if (idx !== -1) {
          this.items[idx] = updated
        }
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Stok eşik değerleri güncellenemedi'
        console.error('Update stock thresholds failed:', err)
      }
    },

    async bulkUpdate(ids: string[], patch: { visible?: boolean; purchasable?: boolean }) {
      try {
        const api = useApi()
        const updates = await Promise.all(
          ids.map(async (id) => {
            if (patch.visible !== undefined) {
              return api.post<Product>(`/products/${id}/visibility`, { visible: patch.visible })
            } else if (patch.purchasable !== undefined) {
              return api.post<Product>(`/products/${id}/purchasable`, { purchasable: patch.purchasable })
            }
          }),
        )

        // Update local items
        updates.forEach((updated) => {
          if (updated) {
            const idx = this.items.findIndex((x) => x.id === updated.id)
            if (idx !== -1) {
              this.items[idx] = updated
            }
          }
        })
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Toplu güncellenemedi'
        console.error('Bulk update failed:', err)
      }
    },

    async remove(id: string) {
      // Future: implement delete endpoint
      this.items = this.items.filter((p) => p.id !== id)
    },
  },
})
