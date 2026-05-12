/**
 * Popups store — campaigns, dealer-specific announcements.
 */
import { defineStore } from 'pinia'
import type { Popup } from '~/types'
import { storage, uid } from '~/utils/storage'

interface State {
  items: Popup[]
  loaded: boolean
}

export const usePopupsStore = defineStore('popups', {
  state: (): State => ({ items: [], loaded: false }),

  getters: {
    activeNow: (s) => {
      const now = Date.now()
      return s.items.filter(
        (p) => p.active && new Date(p.startsAt).getTime() <= now && new Date(p.endsAt).getTime() > now,
      )
    },
  },

  actions: {
    load() {
      this.items = storage.read<Popup[]>('popups', [])
      this.loaded = true
    },

    persist() {
      storage.write('popups', this.items)
    },

    upsert(input: Partial<Popup> & { id?: string }) {
      const now = new Date().toISOString()
      if (input.id) {
        const idx = this.items.findIndex((p) => p.id === input.id)
        if (idx >= 0) this.items[idx] = { ...this.items[idx]!, ...input, updatedAt: now } as Popup
      } else {
        this.items.unshift({
          id: uid('pop'),
          title: input.title ?? 'Yeni Popup',
          body: input.body ?? '',
          imageUrl: input.imageUrl,
          ctaLabel: input.ctaLabel,
          ctaUrl: input.ctaUrl,
          audience: input.audience ?? 'all',
          dealerIds: input.dealerIds ?? [],
          startsAt: input.startsAt ?? now,
          endsAt: input.endsAt ?? new Date(Date.now() + 7 * 86_400_000).toISOString(),
          active: input.active ?? false,
          showOnceKey: input.showOnceKey,
          impressions: 0,
          clicks: 0,
          createdAt: now,
          updatedAt: now,
        })
      }
      this.persist()
    },

    toggle(id: string) {
      const p = this.items.find((x) => x.id === id)
      if (!p) return
      p.active = !p.active
      p.updatedAt = new Date().toISOString()
      this.persist()
    },

    remove(id: string) {
      this.items = this.items.filter((p) => p.id !== id)
      this.persist()
    },
  },
})
