/**
 * Forex & Currency pricing store
 * Manages exchange rates and currency-based product pricing
 */
import { defineStore } from 'pinia'
import { storage, uid } from '~/utils/storage'

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CHF' | 'AED'
export type ExchangeRateSource = 'TCMB' | 'manual'

export interface ExchangeRate {
  id: string
  currency: Currency
  rate: number // TRY equivalent: 1 USD = 32.50 TRY
  source: ExchangeRateSource
  liveRate?: number // From TCMB/external API
  manualOverride?: number // User set rate (takes precedence over live)
  lastUpdated: string
}

export interface ProductCurrencyPrice {
  id: string
  productId: string
  currency: Currency
  price: number // Price in foreign currency
  createdAt: string
  updatedAt: string
}

interface State {
  exchangeRates: ExchangeRate[]
  productCurrencyPrices: ProductCurrencyPrice[]
  loaded: boolean
}

export const useForexStore = defineStore('forex', {
  state: (): State => ({
    exchangeRates: [],
    productCurrencyPrices: [],
    loaded: false,
  }),

  getters: {
    /**
     * Get effective exchange rate for currency (manual override or live rate)
     */
    getExchangeRate: (s) => (currency: Currency) => {
      const rate = s.exchangeRates.find((r) => r.currency === currency)
      if (!rate) return null
      return {
        currency,
        rate: rate.manualOverride ?? rate.liveRate ?? rate.rate,
        isManualOverride: !!rate.manualOverride,
        source: rate.source,
      }
    },

    /**
     * Get all supported currencies
     */
    supportedCurrencies: (s): Currency[] => {
      return [...new Set(s.exchangeRates.map((r) => r.currency))]
    },
  },

  actions: {
    load() {
      this.exchangeRates = storage.read<ExchangeRate[]>('exchange-rates', [])
      this.productCurrencyPrices = storage.read<ProductCurrencyPrice[]>('product-currency-prices', [])

      // Seed default exchange rates if empty
      if (this.exchangeRates.length === 0) {
        this.seedDefaultRates()
      }

      this.loaded = true
    },

    seedDefaultRates() {
      const now = new Date().toISOString()
      const defaultRates: ExchangeRate[] = [
        {
          id: uid('er'),
          currency: 'USD',
          rate: 32.5, // 1 USD = 32.50 TRY (default)
          liveRate: 32.5,
          source: 'manual',
          lastUpdated: now,
        },
        {
          id: uid('er'),
          currency: 'EUR',
          rate: 35.0,
          liveRate: 35.0,
          source: 'manual',
          lastUpdated: now,
        },
        {
          id: uid('er'),
          currency: 'GBP',
          rate: 41.0,
          liveRate: 41.0,
          source: 'manual',
          lastUpdated: now,
        },
        {
          id: uid('er'),
          currency: 'CHF',
          rate: 38.0,
          liveRate: 38.0,
          source: 'manual',
          lastUpdated: now,
        },
        {
          id: uid('er'),
          currency: 'AED',
          rate: 8.85,
          liveRate: 8.85,
          source: 'manual',
          lastUpdated: now,
        },
      ]
      this.exchangeRates = defaultRates
      this.persist()
    },

    persist() {
      storage.write('exchange-rates', this.exchangeRates)
      storage.write('product-currency-prices', this.productCurrencyPrices)
    },

    /**
     * Update live exchange rate (from TCMB API call)
     */
    updateLiveRate(currency: Currency, rate: number) {
      const idx = this.exchangeRates.findIndex((r) => r.currency === currency)
      if (idx >= 0 && this.exchangeRates[idx]) {
        this.exchangeRates[idx]!.liveRate = rate
        this.exchangeRates[idx]!.lastUpdated = new Date().toISOString()
        this.persist()
      }
    },

    /**
     * Set manual exchange rate override
     */
    setManualRate(currency: Currency, rate: number) {
      const idx = this.exchangeRates.findIndex((r) => r.currency === currency)
      if (idx >= 0 && this.exchangeRates[idx]) {
        this.exchangeRates[idx]!.manualOverride = rate
        this.exchangeRates[idx]!.lastUpdated = new Date().toISOString()
        this.persist()
      }
    },

    /**
     * Clear manual override (use live rate)
     */
    clearManualRate(currency: Currency) {
      const idx = this.exchangeRates.findIndex((r) => r.currency === currency)
      if (idx >= 0 && this.exchangeRates[idx]) {
        this.exchangeRates[idx]!.manualOverride = undefined
        this.exchangeRates[idx]!.lastUpdated = new Date().toISOString()
        this.persist()
      }
    },

    /**
     * Add or update product currency price
     */
    setProductCurrencyPrice(productId: string, currency: Currency, price: number) {
      const idx = this.productCurrencyPrices.findIndex((p) => p.productId === productId && p.currency === currency)
      const now = new Date().toISOString()

      if (idx >= 0 && this.productCurrencyPrices[idx]) {
        this.productCurrencyPrices[idx]!.price = price
        this.productCurrencyPrices[idx]!.updatedAt = now
      } else {
        this.productCurrencyPrices.push({
          id: uid('pcp'),
          productId,
          currency,
          price,
          createdAt: now,
          updatedAt: now,
        })
      }
      this.persist()
    },

    /**
     * Get product currency price
     */
    getProductCurrencyPrice(productId: string, currency: Currency): number | null {
      const price = this.productCurrencyPrices.find((p) => p.productId === productId && p.currency === currency)
      return price?.price ?? null
    },

    /**
     * Convert currency price to TRY
     */
    convertToTRY(price: number, currency: Currency): number | null {
      const rate = this.getExchangeRate(currency)
      if (!rate) return null
      return price * rate.rate
    },

    /**
     * Get all products with currency pricing
     */
    getProductsWithCurrencyPricing(): string[] {
      return [...new Set(this.productCurrencyPrices.map((p) => p.productId))]
    },

    /**
     * Apply exchange rate to all products with currency pricing
     */
    applyRateToAllProducts(currency: Currency, rate: number) {
      this.setManualRate(currency, rate)
      // After applying, prices in TRY will automatically recalculate using new rate
    },

    /**
     * Fetch live rates from open exchange rate API or alternative sources
     */
    async fetchLiveRatesFromTCMB() {
      try {
        // Using exchangerate-api.com (free tier) or alternative
        const response = await fetch('https://api.exchangerate-api.com/v4/latest/TRY')
        const data = await response.json()

        if (data.rates) {
          const currencyMap: Record<string, string> = {
            USD: 'USD',
            EUR: 'EUR',
            GBP: 'GBP',
            CHF: 'CHF',
            AED: 'AED',
          }

          for (const [currency, code] of Object.entries(currencyMap)) {
            if (data.rates[code]) {
              // Convert from USD/EUR/etc per TRY to TRY per USD/EUR/etc
              const rate = 1 / data.rates[code]
              if (!isNaN(rate) && rate > 0) {
                this.updateLiveRate(currency as Currency, rate)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching live rates:', error)
        // Fallback: try to fetch from alternative source
        this.fetchLiveRatesAlternative()
      }
    },

    /**
     * Alternative rate fetching from backup source
     */
    async fetchLiveRatesAlternative() {
      try {
        // Backup source
        const response = await fetch('https://api.frankfurter.app/latest?from=TRY')
        const data = await response.json()

        if (data.rates) {
          const currencyMap: Record<string, string> = {
            USD: 'USD',
            EUR: 'EUR',
            GBP: 'GBP',
            CHF: 'CHF',
            AED: 'AED',
          }

          for (const [currency, code] of Object.entries(currencyMap)) {
            if (data.rates[code]) {
              const rate = 1 / data.rates[code]
              if (!isNaN(rate) && rate > 0) {
                this.updateLiveRate(currency as Currency, rate)
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching from alternative source:', error)
      }
    },

    /**
     * Auto-refresh live rates periodically
     */
    startAutoRefresh(intervalMinutes: number = 15) {
      // Fetch immediately
      this.fetchLiveRatesFromTCMB()

      // Then refresh periodically
      const intervalMs = intervalMinutes * 60 * 1000
      if (typeof window !== 'undefined') {
        setInterval(() => {
          this.fetchLiveRatesFromTCMB()
        }, intervalMs)
      }
    },
  },
})
