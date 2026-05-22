/**
 * Notify-when-available store — backed by /api/admin/notifications API.
 */
import { defineStore } from 'pinia'

interface NotifyItem {
  id: string
  productId: string
  userId: string
  channel: string
  status: 'pending' | 'notified' | 'cancelled'
  createdAt: string
  notifiedAt?: string
  product?: { id: string; name: string; displayStock: number; netsisStock: number }
  user?: { id: string; email: string; name: string; phone?: string }
}

interface State {
  items: NotifyItem[]
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
    filtered(s): NotifyItem[] {
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
    async load() {
      try {
        const { useApi } = await import('~/composables/useApi')
        const api = useApi()
        this.items = await api.get<NotifyItem[]>('/api/admin/notifications')
      } catch {
        /* silent */
      }
      this.loaded = true
    },

    setFilter<K extends keyof State['filter']>(key: K, v: State['filter'][K]) {
      this.filter[key] = v
    },

    async sendForProduct(productId: string) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      const result = await api.post<{ sent: number; total: number }>(
        `/api/admin/notifications/send/${productId}`,
      )
      // Reload to get updated statuses
      await this.load()
      return result
    },

    async cancel(id: string) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      await api.delete(`/api/admin/notifications/${id}`)
      const idx = this.items.findIndex((n) => n.id === id)
      if (idx >= 0) this.items[idx] = { ...this.items[idx]!, status: 'cancelled' }
    },
  },
})
