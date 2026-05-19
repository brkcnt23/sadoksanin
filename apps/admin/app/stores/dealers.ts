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
    async load() {
      try {
  const api = useApi()
        const data = await api.get<any[]>('/dealer/admin/list')
        // Map API response to admin Dealer type
        this.items = data.map((d: any) => ({
          id: d.id,
          name: d.company || d.name,
          contactPerson: d.contactPerson || d.contactName,
          email: d.user?.email || '',
          phone: d.phone || '',
          cariNo: d.cariNo || '',
          cariValidated: d.cariValidated ?? false,
          taxNo: d.taxNo || '',
          taxOffice: d.taxOffice || '',
          city: d.city || '',
          region: d.region || '',
          address: d.address || '',
          status: (d.status?.toLowerCase() || 'pending') as DealerStatus,
          cariBalance: d.cariBalance ?? 0,
          creditLimit: d.creditLimit ?? 0,
          totalOrders: d.totalOrders ?? 0,
          totalRevenue: d.totalRevenue ?? 0,
          lastOrderAt: d.lastOrderAt || undefined,
          approvedBy: d.approvedBy || undefined,
          approvedAt: d.approvedAt || undefined,
          rejectionReason: d.rejectionReason || undefined,
          createdAt: d.createdAt || new Date().toISOString(),
          updatedAt: d.updatedAt || new Date().toISOString(),
        }))
        this.loaded = true
      } catch (err) {
        console.error('Failed to load dealers from API, falling back to localStorage:', err)
        this.items = storage.read<Dealer[]>('dealers', [])
        this.loaded = true
      }
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

    async validateCari(cariNo: string): Promise<{ valid: boolean; reason?: string; balance?: number }> {
      try {
  const api = useApi()
        return await api.post('/dealer/validate-cari', { cariNo })
      } catch {
        // Fallback to mock validation
        if (/^120\.01\.\d{4}$/.test(cariNo)) {
          return { valid: true, balance: -Math.floor(Math.random() * 50_000) }
        }
        return { valid: false, reason: 'Netsis cari hesabı bulunamadı' }
      }
    },

    async approve(id: string, adminId: string) {
      try {
  const api = useApi()
        await api.patch(`/dealer/${id}/approve`)
        await this.load() // Reload from API
      } catch (err) {
        // Fallback: local update
        const d = this.findById(id)
        if (!d) return
        const idx = this.items.findIndex((x) => x.id === id)
        this.items[idx] = { ...d, status: 'active', cariValidated: true, approvedBy: adminId, approvedAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        this.persist()
      }
      useAuditStore().log('dealer.approve', 'Dealer', id)
    },

    async reject(id: string, adminId: string, reason: string) {
      try {
  const api = useApi()
        await api.patch(`/dealer/${id}/reject`, { reason })
        await this.load()
      } catch (err) {
        const d = this.findById(id)
        if (!d) return
        const idx = this.items.findIndex((x) => x.id === id)
        this.items[idx] = { ...d, status: 'rejected', approvedBy: adminId, rejectionReason: reason, updatedAt: new Date().toISOString() }
        this.persist()
      }
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
