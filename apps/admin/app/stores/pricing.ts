/**
 * Pricing store — logistics rules + regional/province surcharges.
 * Backed by /api/admin/pricing API endpoints.
 */
import { defineStore } from 'pinia'
import type { RegionKey } from '~/utils/regions'
import { getRegionByProvince } from '~/utils/regions'

interface RegionalSurcharge {
  id: string
  regionKey: string
  surcharge: number
  description?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

interface ProvinceSurcharge {
  id: string
  province: string
  surcharge: number
  description?: string
  active: boolean
  createdAt: string
  updatedAt: string
}

interface LogisticsRuleItem {
  id: string
  region: string
  cities: string[]
  baseSurcharge: number
  perKgSurcharge: number
  perM2Surcharge: number
  freeShippingThreshold?: number
  active: boolean
  createdAt: string
  updatedAt: string
}

interface State {
  rules: LogisticsRuleItem[]
  regionalSurcharges: RegionalSurcharge[]
  provinceSurcharges: ProvinceSurcharge[]
  loaded: boolean
}

export const usePricingStore = defineStore('pricing', {
  state: (): State => ({
    rules: [],
    regionalSurcharges: [],
    provinceSurcharges: [],
    loaded: false,
  }),

  getters: {
    activeRules: (s) => s.rules.filter((r) => r.active),
  },

  actions: {
    async load() {
      try {
        const { useApi } = await import('~/composables/useApi')
        const api = useApi()
        const [regional, province, logistics] = await Promise.all([
          api.get<RegionalSurcharge[]>('/admin/pricing/regional'),
          api.get<ProvinceSurcharge[]>('/admin/pricing/province'),
          api.get<LogisticsRuleItem[]>('/admin/pricing/logistics'),
        ])
        this.regionalSurcharges = regional || []
        this.provinceSurcharges = province || []
        this.rules = logistics || []
      } catch {
        /* silent */
      }
      this.loaded = true
    },

    async upsertRule(input: Partial<LogisticsRuleItem> & { region: string }) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      const created = await api.post<LogisticsRuleItem>('/admin/pricing/logistics', input)
      const idx = this.rules.findIndex((r) => r.id === created.id)
      if (idx >= 0) this.rules[idx] = created
      else this.rules.push(created)
    },

    async removeRule(id: string) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      await api.delete(`/admin/pricing/logistics/${id}`)
      this.rules = this.rules.filter((r) => r.id !== id)
    },

    async upsertRegional(input: { regionKey: string; surcharge: number; description?: string; active?: boolean }) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      const created = await api.post<RegionalSurcharge>('/admin/pricing/regional', input)
      const idx = this.regionalSurcharges.findIndex((r) => r.id === created.id)
      if (idx >= 0) this.regionalSurcharges[idx] = created
      else this.regionalSurcharges.push(created)
    },

    async removeRegional(regionKey: string) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      await api.delete(`/admin/pricing/regional/${regionKey}`)
      this.regionalSurcharges = this.regionalSurcharges.filter((r) => r.regionKey !== regionKey)
    },

    async upsertProvince(input: { province: string; surcharge: number; description?: string; active?: boolean }) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      const created = await api.post<ProvinceSurcharge>('/admin/pricing/province', input)
      const idx = this.provinceSurcharges.findIndex((p) => p.id === created.id)
      if (idx >= 0) this.provinceSurcharges[idx] = created
      else this.provinceSurcharges.push(created)
    },

    async removeProvince(province: string) {
      const { useApi } = await import('~/composables/useApi')
      const api = useApi()
      await api.delete(`/admin/pricing/province/${province}`)
      this.provinceSurcharges = this.provinceSurcharges.filter((p) => p.province !== province)
    },

    getProvinceSurcharge(province: string): ProvinceSurcharge | RegionalSurcharge | null {
      const provinceSurcharge = this.provinceSurcharges.find(
        (p) => p.province === province && p.active,
      )
      if (provinceSurcharge) return provinceSurcharge

      const regionKey = getRegionByProvince(province)
      if (regionKey) {
        return this.regionalSurcharges.find((r) => r.regionKey === regionKey && r.active) ?? null
      }
      return null
    },

    quote(opts: {
      basePrice: number
      taxRate: number
      m2PerUnit?: number
      quantity: number
      city?: string
      productId?: string
    }) {
      const unitPrice = opts.basePrice
      const subtotal = unitPrice * opts.quantity
      const tax = subtotal * opts.taxRate

      let logistics = 0
      if (opts.city) {
        const rule = this.rules.find((r) => r.active && r.cities.includes(opts.city))
        if (rule) {
          if (rule.freeShippingThreshold && subtotal + tax >= rule.freeShippingThreshold) {
            logistics = 0
          } else {
            const m2 = (opts.m2PerUnit ?? 0) * opts.quantity
            logistics = rule.baseSurcharge + rule.perM2Surcharge * m2
          }
        }
      }

      return { unitPrice, subtotal, tax, logistics, total: subtotal + tax + logistics }
    },
  },
})
