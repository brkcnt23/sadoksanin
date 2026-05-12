/**
 * Dealers store — onboarding/approval, cari validation, suspension.
 */
import { defineStore } from 'pinia'
import type { Dealer, DealerStatus } from '~/types'
import { storage, uid } from '~/utils/storage'
import { useAuditStore } from './audit'

interface State {
  items: Dealer[]
  loaded: boolean
  search: string
  filter: { status: 'all' | DealerStatus; region: string | null }
}

export const useDealersStore = defineStore('dealers', {
  state: (): State => ({
    items: [],
    loaded: false,
    search: '',
    filter: { status: 'all', region: null },
  }),

  getters: {
    pendingCount: (s) => s.items.filter((d) => d.status === 'pending').length,
    activeCount: (s) => s.items.filter((d) => d.status === 'active').length,

    filtered(s): Dealer[] {
      const q = s.search.trim().toLowerCase()
      let list = s.items
      if (q)
        list = list.filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.cariNo.toLowerCase().includes(q) ||
            d.contactPerson.toLowerCase().includes(q) ||
            d.email.toLowerCase().includes(q) ||
            d.taxNo.includes(q),
        )
      if (s.filter.status !== 'all') list = list.filter((d) => d.status === s.filter.status)
      if (s.filter.region) list = list.filter((d) => d.region === s.filter.region)
      return list
    },

    regions: (s) => Array.from(new Set(s.items.map((d) => d.region))).sort(),
  },

  actions: {
    load() {
      this.items = storage.read<Dealer[]>('dealers', [])
      this.loaded = true
    },

    persist() {
      storage.write('dealers', this.items)
    },

    findById(id: string) {
      return this.items.find((d) => d.id === id) ?? null
    },

    setSearch(q: string) {
      this.search = q
    },

    setFilter<K extends keyof State['filter']>(key: K, v: State['filter'][K]) {
      this.filter[key] = v
    },

    /**
     * Validate dealer's claimed cari no against Netsis.
     * Stub: real impl calls NestJS netsis module synchronously.
     */
    async validateCari(cariNo: string): Promise<{ valid: boolean; reason?: string; balance?: number }> {
      await new Promise((r) => setTimeout(r, 600)) // simulate network
      // Mock: anything matching pattern 120.01.NNNN is valid
      if (/^120\.01\.\d{4}$/.test(cariNo)) {
        return { valid: true, balance: -Math.floor(Math.random() * 50_000) }
      }
      return { valid: false, reason: 'Netsis cari hesabı bulunamadı' }
    },

    approve(id: string, adminId: string) {
      const d = this.findById(id)
      if (!d) return
      const idx = this.items.findIndex((x) => x.id === id)
      this.items[idx] = {
        ...d,
        status: 'active',
        cariValidated: true,
        approvedBy: adminId,
        approvedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      this.persist()
      useAuditStore().log('dealer.approve', 'Dealer', id)
    },

    reject(id: string, adminId: string, reason: string) {
      const d = this.findById(id)
      if (!d) return
      const idx = this.items.findIndex((x) => x.id === id)
      this.items[idx] = {
        ...d,
        status: 'rejected',
        approvedBy: adminId,
        rejectionReason: reason,
        updatedAt: new Date().toISOString(),
      }
      this.persist()
      useAuditStore().log('dealer.reject', 'Dealer', id, { reason: { from: '', to: reason } })
    },

    setStatus(id: string, status: DealerStatus) {
      const d = this.findById(id)
      if (!d) return
      const idx = this.items.findIndex((x) => x.id === id)
      const prev = d.status
      this.items[idx] = { ...d, status, updatedAt: new Date().toISOString() }
      this.persist()
      useAuditStore().log('dealer.status', 'Dealer', id, { status: { from: prev, to: status } })
    },

    update(id: string, patch: Partial<Dealer>) {
      const idx = this.items.findIndex((x) => x.id === id)
      if (idx === -1) return
      this.items[idx] = { ...this.items[idx]!, ...patch, updatedAt: new Date().toISOString() }
      this.persist()
    },

    create(input: Omit<Dealer, 'id' | 'createdAt' | 'updatedAt'>) {
      const created: Dealer = {
        ...input,
        id: uid('dlr'),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      this.items.unshift(created)
      this.persist()
      return created
    },
  },
})
