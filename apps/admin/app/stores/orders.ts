/**
 * Orders store — list, approve/reject, e-document trigger.
 * Wired to NestJS API: /orders/admin/pending, /orders/:id/approve, /orders/:id/reject
 */
import { defineStore } from 'pinia'
import type { Order, OrderStatus, CustomerType } from '~/types'
import { useAuditStore } from './audit'

interface State {
  items: Order[]
  loading: boolean
  loaded: boolean
  search: string
  filter: {
    status: 'all' | OrderStatus
    customerType: 'all' | CustomerType
    dateFrom: string | null
    dateTo: string | null
    dealerId: string | null
  }
  page: number
  pageSize: number
  error: string | null
}

export const useOrdersStore = defineStore('orders', {
  state: (): State => ({
    items: [],
    loading: false,
    loaded: false,
    search: '',
    filter: { status: 'all', customerType: 'all', dateFrom: null, dateTo: null, dealerId: null },
    page: 1,
    pageSize: 25,
    error: null,
  }),

  getters: {
    pendingCount: (s) => s.items.filter((o) => o.status === 'pending-approval').length,

    filtered(s): Order[] {
      const q = s.search.trim().toLowerCase()
      let list = s.items
      if (q)
        list = list.filter(
          (o) =>
            o.orderNo.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            (o.dealerCariNo ?? '').toLowerCase().includes(q),
        )
      if (s.filter.status !== 'all') list = list.filter((o) => o.status === s.filter.status)
      if (s.filter.customerType !== 'all') list = list.filter((o) => o.customerType === s.filter.customerType)
      if (s.filter.dealerId) list = list.filter((o) => o.dealerId === s.filter.dealerId)
      if (s.filter.dateFrom) {
        const from = new Date(s.filter.dateFrom).getTime()
        list = list.filter((o) => new Date(o.createdAt).getTime() >= from)
      }
      if (s.filter.dateTo) {
        const to = new Date(s.filter.dateTo).getTime() + 86_400_000
        list = list.filter((o) => new Date(o.createdAt).getTime() < to)
      }
      return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },

    paginated(): Order[] {
      const start = (this.page - 1) * this.pageSize
      return this.filtered.slice(start, start + this.pageSize)
    },

    totalPages(): number {
      return Math.max(1, Math.ceil(this.filtered.length / this.pageSize))
    },

    totalRevenue: (s) =>
      s.items.filter((o) => o.status !== 'cancelled' && o.status !== 'rejected').reduce((sum, o) => sum + o.total, 0),

    revenueByType: (s) => ({
      b2c: s.items.filter((o) => o.customerType === 'B2C' && o.status !== 'cancelled').reduce((a, b) => a + b.total, 0),
      b2b: s.items.filter((o) => o.customerType === 'B2B' && o.status !== 'cancelled').reduce((a, b) => a + b.total, 0),
    }),
  },

  actions: {
    async load() {
      if (this.loaded) return

      this.loading = true
      this.error = null

      try {
        const api = useApi()
        // Load all pending + recent orders
        const response = await api.get<{ orders: Order[]; total: number }>('/orders/admin/all', {
          limit: 500,
        })
        this.items = (response.orders || []).map((o: any) => ({
          ...o,
          dealerName: o.dealer?.company || o.dealer?.name || '',
          dealerCariNo: o.dealer?.cariNo || o.dealerCariNo || '',
          dealerCity: o.dealer?.city || '',
          customerName: o.customer?.name || o.user?.name || o.customerName || '',
        }))
        this.loaded = true
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Siparişler yüklenemedi'
        console.error('Orders load failed:', err)
      } finally {
        this.loading = false
      }
    },

    findById(id: string) {
      return this.items.find((o) => o.id === id) ?? null
    },

    setSearch(q: string) {
      this.search = q
      this.page = 1
    },

    setFilter<K extends keyof State['filter']>(key: K, v: State['filter'][K]) {
      this.filter[key] = v
      this.page = 1
    },

    setPage(p: number) {
      this.page = Math.max(1, Math.min(p, this.totalPages))
    },

    updateOrder(id: string, order: Order) {
      const idx = this.items.findIndex((o) => o.id === id)
      if (idx !== -1) {
        this.items[idx] = order
      }
      useAuditStore().log('order.update', 'Order', id)
    },

    async approve(id: string, adminId: string) {
      try {
        const api = useApi()
        const updated = await api.post<Order>(`/orders/${id}/approve`)
        this.updateOrder(id, updated)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Onaylama başarısız'
        console.error('Approve failed:', err)
      }
    },

    async reject(id: string, adminId: string, reason: string) {
      try {
        const api = useApi()
        const updated = await api.post<Order>(`/orders/${id}/reject`, { reason })
        this.updateOrder(id, updated)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Reddetme başarısız'
        console.error('Reject failed:', err)
      }
    },

    async cancel(id: string, reason: string) {
      try {
        const api = useApi()
        const updated = await api.post<Order>(`/orders/${id}/cancel`, { reason })
        this.updateOrder(id, updated)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'İptal başarısız'
        console.error('Cancel failed:', err)
      }
    },

    async markShipped(id: string) {
      try {
        const api = useApi()
        const updated = await api.post<Order>(`/orders/${id}/ship`)
        this.updateOrder(id, updated)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'Sevk etme başarısız'
        console.error('Ship failed:', err)
      }
    },

    /**
     * Trigger Alneo e-invoice generation. POSTs to /alneo/invoice/:orderId.
     */
    async triggerEInvoice(id: string) {
      try {
        const api = useApi()
        const updated = await api.post<Order>(`/alneo/invoice/${id}`)
        this.updateOrder(id, updated)
      } catch (err) {
        this.error = err instanceof Error ? err.message : 'E-fatura oluşturma başarısız'
        console.error('E-invoice trigger failed:', err)
      }
    },
  },
})
