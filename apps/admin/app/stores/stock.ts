/**
 * Stock store — Netsis sync, reservations, displayable stock.
 *
 * Critical formula:
 *   displayStock = netsisStock - sum(active reservations)
 */
import { defineStore } from 'pinia'
import type { StockReservation, StockSyncStatus } from '~/types'
import { storage, uid } from '~/utils/storage'
import { useProductsStore } from './products'
import { useAuditStore } from './audit'

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
    activeReservations: (s) => s.reservations.filter((r) => r.status === 'active'),
    totalReservedUnits: (s) =>
      s.reservations.filter((r) => r.status === 'active').reduce((sum, r) => sum + r.quantity, 0),
  },

  actions: {
    load() {
      this.reservations = storage.read<StockReservation[]>('stock-reservations', [])
      this.syncStatus = storage.read<StockSyncStatus>('stock-sync-status', this.syncStatus)
      this.loaded = true
    },

    persist() {
      storage.write('stock-reservations', this.reservations)
      storage.write('stock-sync-status', this.syncStatus)
    },

    reservationsForProduct(productId: string): StockReservation[] {
      return this.reservations.filter((r) => r.productId === productId && r.status === 'active')
    },

    create(input: Omit<StockReservation, 'id' | 'createdAt' | 'updatedAt'>) {
      const reservation: StockReservation = {
        ...input,
        id: uid('rsv'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      this.reservations.unshift(reservation)
      this.persist()
      this.recomputeProductDisplayStock(input.productId)
      return reservation
    },

    releaseForOrder(orderId: string) {
      const affectedProducts = new Set<string>()
      this.reservations = this.reservations.map((r) => {
        if (r.orderId === orderId && r.status === 'active') {
          affectedProducts.add(r.productId)
          return { ...r, status: 'released', updatedAt: new Date().toISOString() }
        }
        return r
      })
      this.persist()
      affectedProducts.forEach((id) => this.recomputeProductDisplayStock(id))
    },

    fulfillForOrder(orderId: string) {
      const affectedProducts = new Set<string>()
      this.reservations = this.reservations.map((r) => {
        if (r.orderId === orderId && r.status === 'active') {
          affectedProducts.add(r.productId)
          return { ...r, status: 'fulfilled', updatedAt: new Date().toISOString() }
        }
        return r
      })
      this.persist()
      // After fulfillment Netsis stock decreases too — outside our concern, sync handles it
    },

    /**
     * Keeps the product's reservedStock + displayStock fields fresh.
     */
    recomputeProductDisplayStock(productId: string) {
      const products = useProductsStore()
      const reserved = this.reservations
        .filter((r) => r.productId === productId && r.status === 'active')
        .reduce((s, r) => s + r.quantity, 0)
      const p = products.items.find((x) => x.id === productId)
      if (!p) return
      ;(products as any).update(productId, { reservedStock: reserved, netsisStock: p.netsisStock })
    },

    /**
     * Trigger Netsis sync. Stub: real impl POSTs to /netsis/sync.
     */
    async triggerSync() {
      this.syncStatus = { ...this.syncStatus, status: 'running' }
      const start = Date.now()
      await new Promise((r) => setTimeout(r, 1500))
      // Simulate small drift in stock
      const products = useProductsStore()
      products.items.forEach((p) => {
        if (p.syncStatus !== 'error') {
          const drift = Math.floor(Math.random() * 10) - 4
          ;(products as any).update(p.id, {
            netsisStock: Math.max(0, p.netsisStock + drift),
            lastNetsisSync: new Date().toISOString(),
            syncStatus: 'synced',
          })
        }
      })
      this.syncStatus = {
        lastSyncAt: new Date().toISOString(),
        lastSyncDuration: Date.now() - start,
        productsSynced: products.items.length,
        errors: products.items.filter((p) => p.syncStatus === 'error').length,
        status: 'success',
        nextScheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      }
      this.persist()
      useAuditStore().log('stock.sync', 'StockSync', 'manual')
    },
  },
})
