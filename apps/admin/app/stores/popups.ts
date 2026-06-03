/**
 * Popups store — campaigns, dealer-specific announcements.
 * Backed by /api/admin/popups API endpoints.
 */
import { defineStore } from 'pinia'

interface PopupItem {
  id: string
  title: string
  bodyHtml?: string
  imageUrl?: string
  ctaText?: string
  ctaUrl?: string
  audience: 'ALL' | 'B2C' | 'B2B' | 'SPECIFIC_DEALER'
  dealerIds: string[]
  isActive: boolean
  showOnce: boolean
  startDate?: string
  endDate?: string
  impressions: number
  clicks: number
  createdAt: string
  updatedAt: string
}

interface State {
  items: PopupItem[]
  loaded: boolean
}

export const usePopupsStore = defineStore('popups', {
  state: (): State => ({ items: [], loaded: false }),

  getters: {
    activeNow: (s) => {
      const now = Date.now()
      return s.items.filter(
        (p) =>
          p.isActive &&
          (!p.startDate || new Date(p.startDate).getTime() <= now) &&
          (!p.endDate || new Date(p.endDate).getTime() > now),
      )
    },
  },

  actions: {
    async load() {
      try {
        const { useApi } = await import('~/composables/useApi')
        const api = useApi()
        this.items = await api.get<PopupItem[]>('/admin/popups') || []
      } catch {
        // Silent fail — items stay as []
      }
      this.loaded = true
    },

    async upsert(input: Partial<PopupItem> & { id?: string }) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()

      if (input.id) {
        const updated = await api.patch<PopupItem>(`/admin/popups/${input.id}`, input)
        const idx = this.items.findIndex((p) => p.id === input.id)
        if (idx >= 0) this.items[idx] = updated
        else this.items.unshift(updated)
      } else {
        const created = await api.post<PopupItem>('/admin/popups', input)
        this.items.unshift(created)
      }
    },

    async toggle(id: string) {
      const p = this.items.find((x) => x.id === id)
      if (!p) return
      const updated = await this.upsert({ id, isActive: !p.isActive })
    },

    async remove(id: string) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      await api.delete(`/admin/popups/${id}`)
      this.items = this.items.filter((p) => p.id !== id)
    },
  },
})
