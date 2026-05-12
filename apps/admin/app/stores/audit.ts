/**
 * Audit log — every admin-initiated mutation is recorded.
 * Capped at 1000 entries client-side; backend keeps the canonical record.
 */
import { defineStore } from 'pinia'
import type { AuditLogEntry } from '~/types'
import { storage, uid } from '~/utils/storage'

const MAX_ENTRIES = 1000

interface State {
  items: AuditLogEntry[]
  loaded: boolean
  filter: { entity: string | null; action: string | null; actorId: string | null }
}

export const useAuditStore = defineStore('audit', {
  state: (): State => ({
    items: [],
    loaded: false,
    filter: { entity: null, action: null, actorId: null },
  }),

  getters: {
    filtered(s): AuditLogEntry[] {
      let list = s.items
      if (s.filter.entity) list = list.filter((e) => e.entity === s.filter.entity)
      if (s.filter.action) list = list.filter((e) => e.action === s.filter.action)
      if (s.filter.actorId) list = list.filter((e) => e.actorId === s.filter.actorId)
      return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },
    distinctActions: (s) => Array.from(new Set(s.items.map((e) => e.action))).sort(),
    distinctEntities: (s) => Array.from(new Set(s.items.map((e) => e.entity))).sort(),
  },

  actions: {
    load() {
      this.items = storage.read<AuditLogEntry[]>('audit-log', [])
      this.loaded = true
    },

    persist() {
      // cap before persisting
      if (this.items.length > MAX_ENTRIES) this.items = this.items.slice(0, MAX_ENTRIES)
      storage.write('audit-log', this.items)
    },

    setFilter<K extends keyof State['filter']>(key: K, v: State['filter'][K]) {
      this.filter[key] = v
    },

    log(
      action: string,
      entity: string,
      entityId: string,
      diff?: Record<string, { from: unknown; to: unknown }>,
    ) {
      // resolve current actor lazily to avoid composables-in-store gymnastics
      let actorId = '0'
      let actorEmail = 'system'
      try {
        if (import.meta.client) {
          const raw = localStorage.getItem('admin-user')
          if (raw) {
            const u = JSON.parse(raw)
            actorId = u.id ?? '0'
            actorEmail = u.email ?? 'system'
          }
        }
      } catch {
        /* ignore */
      }

      this.items.unshift({
        id: uid('audit'),
        actorId,
        actorEmail,
        action,
        entity,
        entityId,
        diff,
        createdAt: new Date().toISOString(),
      })
      this.persist()
    },
  },
})
