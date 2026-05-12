/**
 * Turkish regions (7 bölge) with province mappings
 */

export const REGIONS = {
  'Marmara': {
    name: 'Marmara Bölgesi',
    provinces: [
      'İstanbul',
      'Edirne',
      'Kırklareli',
      'Tekirdağ',
      'Çanakkale',
      'Balıkesir',
      'Bursa',
      'Bilecik',
      'Yalova',
      'Kocaeli',
      'Sakarya',
    ],
  },
  'IcAnadolu': {
    name: 'İç Anadolu Bölgesi',
    provinces: [
      'Ankara',
      'Konya',
      'Kayseri',
      'Eskişehir',
      'Sivas',
      'Kırıkkale',
      'Karaman',
      'Kırşehir',
      'Niğde',
      'Nevşehir',
      'Yozgat',
      'Çankırı',
      'Çorum',
    ],
  },
  'Ege': {
    name: 'Ege Bölgesi',
    provinces: [
      'İzmir',
      'Aydın',
      'Muğla',
      'Denizli',
      'Manisa',
      'Uşak',
      'Kütahya',
      'Afyonkarahisar',
    ],
  },
  'Akdeniz': {
    name: 'Akdeniz Bölgesi',
    provinces: [
      'Antalya',
      'Adana',
      'Mersin',
      'Hatay',
      'Kahramanmaraş',
      'Burdur',
      'Isparta',
      'İçel',
    ],
  },
  'Karadeniz': {
    name: 'Karadeniz Bölgesi',
    provinces: [
      'Trabzon',
      'Ordu',
      'Samsun',
      'Sinop',
      'Amasya',
      'Artvin',
      'Bartın',
      'Bayburt',
      'Bolu',
      'Çorum',
      'Düzce',
      'Giresun',
      'Gümüşhane',
      'Karabük',
      'Kastamonu',
      'Rize',
      'Tokat',
      'Zonguldak',
    ],
  },
  'DoguAnadolu': {
    name: 'Doğu Anadolu Bölgesi',
    provinces: [
      'Erzurum',
      'Malatya',
      'Van',
      'Erzincan',
      'Elâzığ',
      'Tunceli',
      'Bingöl',
      'Ağrı',
      'Ardahan',
      'Bitlis',
      'Hakkari',
      'Iğdır',
      'Kars',
      'Muş',
    ],
  },
  'GuneyDoguAnadolu': {
    name: 'Güneydoğu Anadolu Bölgesi',
    provinces: [
      'Gaziantep',
      'Diyarbakır',
      'Mardin',
      'Batman',
      'Adıyaman',
      'Siirt',
      'Şırnak',
      'Kilis',
    ],
  },
} as const

export type RegionKey = keyof typeof REGIONS

/**
 * Get region key by province name
 */
export function getRegionByProvince(province: string): RegionKey | null {
  for (const [key, region] of Object.entries(REGIONS)) {
    if (region && region.provinces.some((p) => p === province)) {
      return key as RegionKey
    }
  }
  return null
}

/**
 * Get region name by province
 */
export function getRegionNameByProvince(province: string): string | null {
  const key = getRegionByProvince(province)
  return key ? REGIONS[key].name : null
}

/**
 * Get all provinces for a region
 */
export function getProvincesByRegion(regionKey: RegionKey): string[] {
  return [...REGIONS[regionKey].provinces]
}

/**
 * Get region display info
 */
export function getRegionInfo(regionKey: RegionKey) {
  return REGIONS[regionKey]
}
