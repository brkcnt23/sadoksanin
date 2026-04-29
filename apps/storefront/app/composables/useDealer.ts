/**
 * Dealer mode state.
 * Mock implementation — gerçek auth yokken /bayi rotası bunu doğrudan açar.
 * Backend bağlanınca: bu state JWT claim'lerinden hidrate edilecek.
 *
 * useState() Nuxt'ta SSR-safe shared state sağlar (per-request).
 */

export interface DealerInfo {
  id: string
  companyName: string
  city: string
  /** TL cinsinden ürün başına lojistik bedeli */
  logisticsSurcharge: number
  /** Görüntüleme amaçlı bayi kodu */
  code: string
}

export const useDealer = () => {
  const dealer = useState<DealerInfo | null>('dealer', () => null)

  const isDealer = computed(() => dealer.value !== null)

  const enableDealer = (info: DealerInfo) => {
    dealer.value = info
  }

  const disableDealer = () => {
    dealer.value = null
  }

  /**
   * Bir ürün fiyatını bayi moduna göre hesaplar.
   * Bayi modunda taban fiyat + lojistik bedeli döner.
   */
  const computePrice = (basePrice: number) => {
    if (!dealer.value) {
      return {
        total: basePrice,
        base: basePrice,
        surcharge: 0,
        isDealer: false,
      }
    }
    return {
      total: basePrice + dealer.value.logisticsSurcharge,
      base: basePrice,
      surcharge: dealer.value.logisticsSurcharge,
      isDealer: true,
    }
  }

  return {
    dealer,
    isDealer,
    enableDealer,
    disableDealer,
    computePrice,
  }
}
