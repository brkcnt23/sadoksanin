/**
 * Audit log — backed by /api/admin/audit API.
 */
import { defineStore } from 'pinia'

interface AuditLogItem {
  id: string
  userId?: string
  email?: string
  action: string
  entity: string
  entityId: string
  oldValue?: string
  newValue?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
}

interface State {
  items: AuditLogItem[]
  total: number
  page: number
  totalPages: number
  loaded: boolean
  filter: { entity: string | null; action: string | null; userId: string | null }
}

export const useAuditStore = defineStore('audit', {
  state: (): State => ({
    items: [],
    total: 0,
    page: 1,
    totalPages: 1,
    loaded: false,
    filter: { entity: null, action: null, userId: null },
  }),

  getters: {
    distinctActions: (s) => Array.from(new Set(s.items.map((e) => e.action))).sort(),
    distinctEntities: (s) => Array.from(new Set(s.items.map((e) => e.entity))).sort(),
  },

  actions: {
    async load(page = 1) {
      try {
        const { useApi } = await import('~/composables/useApi')
        const api = useApi()
        const params: Record<string, string | number> = { page, limit: 50 }
        if (this.filter.entity) params.entity = this.filter.entity
        if (this.filter.action) params.action = this.filter.action
        if (this.filter.userId) params.userId = this.filter.userId

        const result = await api.get<{
          items: AuditLogItem[]
          total: number
          page: number
          totalPages: number
        }>('/api/admin/audit', params)

        this.items = result.items
        this.total = result.total
        this.page = result.page
        this.totalPages = result.totalPages
      } catch {
        // Silent fail
      }
      this.loaded = true
    },

    setFilter<K extends keyof State['filter']>(key: K, v: State['filter'][K]) {
      this.filter[key] = v
    },

    async log(action: string, entity: string, entityId: string) {
      try {
        const { useApi } = await import('~/composables/useApi')
        const api = useApi()
        await api.post('/api/admin/audit/log', { action, entity, entityId })
      } catch {
        /* non-critical — don't break the caller */
      }
    },
  },
})
