/**
 * Stock store — Netsis sync, reservations via API.
 * Critical formula: displayStock = netsisStock - sum(active reservations)
 */
import { defineStore } from 'pinia'

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
  syncStatus: StockSyncStatus
  loaded: boolean
}

export const useStockStore = defineStore('stock', {
  state: (): State => ({
    reservations: [],
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
        // Fetch existing reservations via orders API
        // Sync status from netsis
        const status = await api.get<StockSyncStatus>('/netsis/status/stock')
        this.syncStatus = status
      } catch {
        /* silent — not critical if netsis isn't configured */
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
  },
})
