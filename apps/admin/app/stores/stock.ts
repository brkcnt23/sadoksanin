/**
 * Stock store — Netsis sync, reservations, stock movements via API.
 * Formula: displayStock = netsisStock - netsisPendingQuantity - active reservations
 */
import { defineStore } from 'pinia'

interface StockMovement {
  id: string
  productId: string
  type: string
  quantity: number
  oldStock: number
  newStock: number
  userId?: string
  user?: { email: string; name: string }
  product?: { sku: string; name: string; unit: string }
  referenceType?: string
  referenceId?: string
  note?: string
  createdAt: string
}

interface StockReservation {
  id: string
  orderId: string
  productId: string
  quantity: number
  status: 'ACTIVE' | 'RELEASED' | 'FULFILLED'
  createdAt: string
  updatedAt: string
}

interface StockSyncStatus {
  lastSyncAt: string | null
  lastSyncDuration: number
  productsSynced: number
  errors: number
  status: 'idle' | 'running' | 'success' | 'error'
  nextScheduledAt: string | null
}

interface State {
  reservations: StockReservation[]
  movements: StockMovement[]
  syncStatus: StockSyncStatus
  loaded: boolean
}

export const useStockStore = defineStore('stock', {
  state: (): State => ({
    reservations: [],
    movements: [],
    syncStatus: {
      lastSyncAt: null,
      lastSyncDuration: 0,
      productsSynced: 0,
      errors: 0,
      status: 'idle',
      nextScheduledAt: null,
    },
    loaded: false,
  }),

  getters: {
    activeReservations: (s) => s.reservations.filter((r) => r.status === 'ACTIVE'),
    totalReservedUnits: (s) =>
      s.reservations.filter((r) => r.status === 'ACTIVE').reduce((sum, r) => sum + r.quantity, 0),
  },

  actions: {
    async load() {
      try {
        const { useApi } = await import('~/composables/useApi')
        const api = useApi()
        const status = await api.get<StockSyncStatus>('/netsis/status/stock')
        this.syncStatus = status
      } catch {
        /* silent */
      }
      this.loaded = true
    },

    async triggerSync() {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      this.syncStatus = { ...this.syncStatus, status: 'running' }
      try {
        const result = await api.post<StockSyncStatus>('/netsis/sync/stock')
        this.syncStatus = result
      } catch {
        this.syncStatus = { ...this.syncStatus, status: 'error', errors: 1 }
      }
    },

    async fetchMovements(productId: string, params?: { type?: string; startDate?: string; endDate?: string; limit?: number; offset?: number }) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      const result = await api.get<{ movements: StockMovement[]; total: number }>('/api/admin/stock/movements', {
        productId,
        ...(params || {}),
      } as any)
      this.movements = result.movements
      return result
    },

    async manualEntry(productId: string, quantity: number, note: string) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      return api.post<StockMovement>('/api/admin/stock/entry', { productId, quantity, note })
    },

    async manualExit(productId: string, quantity: number, type: string, note: string) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      return api.post<StockMovement>('/api/admin/stock/exit', { productId, quantity, type, note })
    },

    async countAdjust(productId: string, actualCount: number, note: string) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      return api.post<StockMovement>('/api/admin/stock/count-adjust', { productId, actualCount, note })
    },
  },
})
