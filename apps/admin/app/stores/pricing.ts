/**
 * Pricing store — logistics rules + dealer pricing overrides + regional pricing.
 */
import { defineStore } from 'pinia'
import type { LogisticsRule, DealerPricingOverride, RegionalPricingSurcharge, ProvincePricingSurcharge } from '~/types'
import { storage, uid } from '~/utils/storage'
import { REGIONS, type RegionKey, getRegionByProvince } from '~/utils/regions'

interface State {
  rules: LogisticsRule[]
  overrides: DealerPricingOverride[]
  regionalSurcharges: RegionalPricingSurcharge[]
  provinceSurcharges: ProvincePricingSurcharge[]
  loaded: boolean
}

export const usePricingStore = defineStore('pricing', {
  state: (): State => ({
    rules: [],
    overrides: [],
    regionalSurcharges: [],
    provinceSurcharges: [],
    loaded: false,
  }),

  getters: {
    activeRules: (s) => s.rules.filter((r) => r.active),
    cityToRegion(s): Record<string, string> {
      const map: Record<string, string> = {}
      s.rules.forEach((r) => r.cities.forEach((c) => (map[c] = r.region)))
      return map
    },
  },

  actions: {
    load() {
      this.rules = storage.read<LogisticsRule[]>('logistics-rules', [])
      this.overrides = storage.read<DealerPricingOverride[]>('pricing-overrides', [])
      this.regionalSurcharges = storage.read<RegionalPricingSurcharge[]>('regional-surcharges', [])
      this.provinceSurcharges = storage.read<ProvincePricingSurcharge[]>('province-surcharges', [])

      // Seed default data if empty
      if (this.rules.length === 0 || this.regionalSurcharges.length === 0) {
        this.seedDefaults()
      }

      this.loaded = true
    },

    seedDefaults() {
      const now = new Date().toISOString()

      // Seed regional pricing surcharges (7 regions)
      if (this.regionalSurcharges.length === 0) {
        const regionalDefaults: RegionalPricingSurcharge[] = [
          {
            id: uid('rs'),
            regionKey: 'Marmara',
            surcharge: 50,
            description: 'Marmara Bölgesi - Temel ek ücret',
            active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: uid('rs'),
            regionKey: 'Ege',
            surcharge: 75,
            description: 'Ege Bölgesi - Temel ek ücret',
            active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: uid('rs'),
            regionKey: 'IcAnadolu',
            surcharge: 100,
            description: 'İç Anadolu Bölgesi - Temel ek ücret',
            active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: uid('rs'),
            regionKey: 'Akdeniz',
            surcharge: 100,
            description: 'Akdeniz Bölgesi - Temel ek ücret',
            active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: uid('rs'),
            regionKey: 'Karadeniz',
            surcharge: 125,
            description: 'Karadeniz Bölgesi - Temel ek ücret',
            active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: uid('rs'),
            regionKey: 'DoguAnadolu',
            surcharge: 150,
            description: 'Doğu Anadolu Bölgesi - Temel ek ücret',
            active: true,
            createdAt: now,
            updatedAt: now,
          },
          {
            id: uid('rs'),
            regionKey: 'GuneyDoguAnadolu',
            surcharge: 125,
            description: 'Güneydoğu Anadolu Bölgesi - Temel ek ücret',
            active: true,
            createdAt: now,
            updatedAt: now,
          },
        ]
        this.regionalSurcharges = regionalDefaults
      }

      this.persist()
    },

    persist() {
      storage.write('logistics-rules', this.rules)
      storage.write('pricing-overrides', this.overrides)
      storage.write('regional-surcharges', this.regionalSurcharges)
      storage.write('province-surcharges', this.provinceSurcharges)
    },

    /**
     * Calculate the final price quote for a (product, dealer/anonymous, city, qty) tuple.
     */
    quote(opts: {
      basePrice: number
      taxRate: number
      m2PerUnit?: number
      quantity: number
      city?: string
      dealerId?: string
      productId?: string
    }) {
      let unitPrice = opts.basePrice

      // Dealer-specific override?
      if (opts.dealerId && opts.productId) {
        const ov = this.overrides.find(
          (o) =>
            o.dealerId === opts.dealerId &&
            o.productId === opts.productId &&
            new Date(o.validFrom).getTime() <= Date.now() &&
            (!o.validUntil || new Date(o.validUntil).getTime() > Date.now()),
        )
        if (ov) unitPrice = ov.customPrice
      }

      const subtotal = unitPrice * opts.quantity
      const tax = subtotal * opts.taxRate

      // Logistics — only when shipping city is known and rule active
      let logistics = 0
      if (opts.city) {
        const rule = this.rules.find((r) => r.active && r.cities.includes(opts.city!))
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

    upsertRule(input: Partial<LogisticsRule> & { id?: string }) {
      const now = new Date().toISOString()
      if (input.id) {
        const idx = this.rules.findIndex((r) => r.id === input.id)
        if (idx >= 0) {
          this.rules[idx] = { ...this.rules[idx]!, ...input, updatedAt: now } as LogisticsRule
        }
      } else {
        this.rules.push({
          id: uid('lg'),
          region: input.region ?? 'custom',
          cities: input.cities ?? [],
          baseSurcharge: input.baseSurcharge ?? 0,
          perKgSurcharge: input.perKgSurcharge ?? 0,
          perM2Surcharge: input.perM2Surcharge ?? 0,
          freeShippingThreshold: input.freeShippingThreshold,
          active: input.active ?? true,
          createdAt: now,
          updatedAt: now,
        })
      }
      this.persist()
    },

    removeRule(id: string) {
      this.rules = this.rules.filter((r) => r.id !== id)
      this.persist()
    },

    addOverride(input: Omit<DealerPricingOverride, 'id' | 'createdAt' | 'updatedAt'>) {
      const now = new Date().toISOString()
      this.overrides.push({ ...input, id: uid('ov'), createdAt: now, updatedAt: now })
      this.persist()
    },

    removeOverride(id: string) {
      this.overrides = this.overrides.filter((o) => o.id !== id)
      this.persist()
    },

    upsertRegionalSurcharge(input: Partial<RegionalPricingSurcharge> & { id?: string; regionKey: string }) {
      const now = new Date().toISOString()
      if (input.id) {
        const idx = this.regionalSurcharges.findIndex((r) => r.id === input.id)
        if (idx >= 0) {
          this.regionalSurcharges[idx] = { ...this.regionalSurcharges[idx]!, ...input, updatedAt: now } as RegionalPricingSurcharge
        }
      } else {
        this.regionalSurcharges.push({
          id: uid('rs'),
          regionKey: input.regionKey,
          surcharge: input.surcharge ?? 0,
          description: input.description ?? '',
          active: input.active ?? true,
          createdAt: now,
          updatedAt: now,
        })
      }
      this.persist()
    },

    upsertProvinceSurcharge(input: Partial<ProvincePricingSurcharge> & { id?: string; province: string }) {
      const now = new Date().toISOString()
      if (input.id) {
        const idx = this.provinceSurcharges.findIndex((p) => p.id === input.id)
        if (idx >= 0) {
          this.provinceSurcharges[idx] = { ...this.provinceSurcharges[idx]!, ...input, updatedAt: now } as ProvincePricingSurcharge
        }
      } else {
        this.provinceSurcharges.push({
          id: uid('ps'),
          province: input.province,
          surcharge: input.surcharge ?? 0,
          description: input.description ?? '',
          active: input.active ?? true,
          createdAt: now,
          updatedAt: now,
        })
      }
      this.persist()
    },

    removeRegionalSurcharge(id: string) {
      this.regionalSurcharges = this.regionalSurcharges.filter((r) => r.id !== id)
      this.persist()
    },

    removeProvinceSurcharge(id: string) {
      this.provinceSurcharges = this.provinceSurcharges.filter((p) => p.id !== id)
      this.persist()
    },

    /**
     * Get effective surcharge for a province: province override OR regional default
     */
    getProvinceSurcharge(province: string): ProvincePricingSurcharge | RegionalPricingSurcharge | null {
      // Check for province-specific override first
      const provinceSurcharge = this.provinceSurcharges.find((p) => p.province === province && p.active)
      if (provinceSurcharge) return provinceSurcharge

      // Fall back to regional surcharge
      const regionKey = getRegionByProvince(province)
      if (regionKey) {
        return this.regionalSurcharges.find((r) => r.regionKey === regionKey && r.active) ?? null
      }

      return null
    },
  },
})
