/**
 * Notify-when-available store — subscriber list, manual trigger.
 */
import { defineStore } from 'pinia'
import type { NotifyRequest } from '~/types'
import { storage } from '~/utils/storage'
import { useAuditStore } from './audit'

interface State {
  items: NotifyRequest[]
  loaded: boolean
  filter: { status: 'all' | 'pending' | 'notified' | 'cancelled'; productId: string | null }
}

export const useNotificationsStore = defineStore('notifications', {
  state: (): State => ({
    items: [],
    loaded: false,
    filter: { status: 'all', productId: null },
  }),

  getters: {
    pendingCount: (s) => s.items.filter((n) => n.status === 'pending').length,
    filtered(s): NotifyRequest[] {
      let list = s.items
      if (s.filter.status !== 'all') list = list.filter((n) => n.status === s.filter.status)
      if (s.filter.productId) list = list.filter((n) => n.productId === s.filter.productId)
      return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    pendingByProduct(s): Record<string, number> {
      const map: Record<string, number> = {}
      s.items
        .filter((n) => n.status === 'pending')
        .forEach((n) => (map[n.productId] = (map[n.productId] ?? 0) + 1))
      return map
    },
  },

  actions: {
    load() {
      this.items = storage.read<NotifyRequest[]>('notify-requests', [])
      this.loaded = true
    },

    persist() {
      storage.write('notify-requests', this.items)
    },

    setFilter<K extends keyof State['filter']>(key: K, v: State['filter'][K]) {
      this.filter[key] = v
    },

    /**
     * Send notifications for all pending requests on a product.
     * Stub: real impl POSTs to /notifications/send (which routes to email/whatsapp).
     */
    async sendForProduct(productId: string) {
      const pending = this.items.filter((n) => n.productId === productId && n.status === 'pending')
      const now = new Date().toISOString()
      pending.forEach((n) => {
        const idx = this.items.findIndex((x) => x.id === n.id)
        if (idx >= 0) {
          this.items[idx] = { ...this.items[idx]!, status: 'notified', notifiedAt: now, updatedAt: now }
        }
      })
      this.persist()
      useAuditStore().log('notify.send', 'Product', productId, { count: { from: 0, to: pending.length } })
      return pending.length
    },

    cancel(id: string) {
      const idx = this.items.findIndex((n) => n.id === id)
      if (idx === -1) return
      this.items[idx] = {
        ...this.items[idx]!,
        status: 'cancelled',
        updatedAt: new Date().toISOString(),
      }
      this.persist()
    },
  },
})
