<script setup lang="ts">
import { ref, computed } from 'vue'
import { formatPrice } from '~/utils/storage'
import { PROVINCES } from '~/utils/turkish-provinces'
import { REGIONS, getRegionNameByProvince } from '~/utils/regions'
import { exportAllSurchargesToCSV, downloadCSV, parseCSV } from '~/utils/excel'
import type { LogisticsRule, RegionalPricingSurcharge, ProvincePricingSurcharge } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Fiyat & Lojistik | Sadöksan Admin',
})

const pricing = usePricingStore()
const products = useProductsStore()
const dealers = useDealersStore()

onMounted(() => {
  if (!pricing.loaded) pricing.load()
  if (!products.loaded) products.load()
  if (!dealers.loaded) dealers.load()
})

// Tab management
const activeTab = ref<'fiyat' | 'lojistik'>('fiyat')

// Modals
const showRuleEditModal = ref(false)
const selectedRule = ref<LogisticsRule | undefined>()

// Pricing editing state
const editingRegionalId = ref<string | null>(null)
const editingRegionalData = ref<Partial<RegionalPricingSurcharge> | null>(null)

const editingProvinceId = ref<string | null>(null)
const editingProvinceData = ref<Partial<ProvincePricingSurcharge> | null>(null)

// Regional pricing edit functions
const startEditRegional = (surcharge: RegionalPricingSurcharge) => {
  editingRegionalId.value = surcharge.id
  editingRegionalData.value = { ...surcharge }
}

const saveRegional = () => {
  if (editingRegionalData.value) {
    pricing.upsertRegionalSurcharge({
      id: editingRegionalId.value || undefined,
      regionKey: editingRegionalData.value.regionKey || '',
      surcharge: editingRegionalData.value.surcharge,
      description: editingRegionalData.value.description,
      active: editingRegionalData.value.active,
    })
  }
  editingRegionalId.value = null
  editingRegionalData.value = null
}

const cancelEditRegional = () => {
  editingRegionalId.value = null
  editingRegionalData.value = null
}

// Province pricing edit functions
const startEditProvince = (surcharge: ProvincePricingSurcharge) => {
  editingProvinceId.value = surcharge.id
  editingProvinceData.value = { ...surcharge }
}

const saveProvince = () => {
  if (editingProvinceData.value) {
    pricing.upsertProvinceSurcharge({
      id: editingProvinceId.value || undefined,
      province: editingProvinceData.value.province || '',
      surcharge: editingProvinceData.value.surcharge,
      description: editingProvinceData.value.description,
      active: editingProvinceData.value.active,
    })
  }
  editingProvinceId.value = null
  editingProvinceData.value = null
}

const cancelEditProvince = () => {
  editingProvinceId.value = null
  editingProvinceData.value = null
}

// Province pricing modal
const showProvinceEditModal = ref(false)
const selectedProvince = ref<string | null>(null)
const selectedProvinceSurcharge = ref<ProvincePricingSurcharge | undefined>()

const openProvinceEditModal = (province: string) => {
  selectedProvince.value = province
  selectedProvinceSurcharge.value = pricing.provinceSurcharges.find((p) => p.province === province)
  showProvinceEditModal.value = true
}

const handleSaveProvinceSurcharge = (data: Partial<ProvincePricingSurcharge> & { province: string }) => {
  pricing.upsertProvinceSurcharge({
    id: selectedProvinceSurcharge.value?.id,
    ...data,
  })
  selectedProvince.value = null
  selectedProvinceSurcharge.value = undefined
}

// Logistics modal functions
const openRuleEditModal = (rule: LogisticsRule) => {
  selectedRule.value = rule
  showRuleEditModal.value = true
}

const handleSaveRule = (data: Partial<LogisticsRule>) => {
  pricing.upsertRule(data)
}

// Get region name by key
const getRegionName = (regionKey: string): string => {
  const region = Object.values(REGIONS).find((r) => Object.keys(REGIONS)[Object.values(REGIONS).indexOf(r)] === regionKey)
  return region?.name || regionKey
}

// Get effective surcharge for province (province override or regional default)
const getEffectiveProvinceSurcharge = (province: string): ProvincePricingSurcharge | RegionalPricingSurcharge | null => {
  return pricing.getProvinceSurcharge(province)
}

// Get regional surcharge for province
const getRegionalSurcharge = (province: string) => {
  const regionKey = Object.keys(REGIONS).find((key) => {
    const region = REGIONS[key as keyof typeof REGIONS]
    return region && region.provinces && region.provinces.some((p) => p === province)
  }) as keyof typeof REGIONS | undefined
  if (regionKey) {
    return pricing.regionalSurcharges.find((r) => r.regionKey === regionKey)
  }
  return null
}

// Get province override if exists
const getProvinceSurchargeOverride = (province: string) => {
  return pricing.provinceSurcharges.find((p) => p.province === province)
}

// Add new province surcharge
const newProvinceSurcharge = ref({
  province: '',
  surcharge: 0,
  description: '',
})

const addNewProvinceSurcharge = () => {
  if (!newProvinceSurcharge.value.province) return

  pricing.upsertProvinceSurcharge({
    province: newProvinceSurcharge.value.province,
    surcharge: newProvinceSurcharge.value.surcharge,
    description: newProvinceSurcharge.value.description,
    active: true,
  })

  newProvinceSurcharge.value = { province: '', surcharge: 0, description: '' }
}

// Export/Import functionality
const fileInput = ref<HTMLInputElement | null>(null)

const exportAllSurcharges = () => {
  const csv = exportAllSurchargesToCSV(pricing.regionalSurcharges, pricing.provinceSurcharges)
  downloadCSV(csv, `sadoksan-fiyatlandirma-${new Date().toISOString().split('T')[0]}.csv`)
}

const exportRegionalOnly = () => {
  const csv = `Bölge Adı,Ek Ücret (₺),Açıklama,Aktif\n${pricing.regionalSurcharges.map(r => `"${REGIONS[r.regionKey as keyof typeof REGIONS]?.name || r.regionKey}","${r.surcharge}","${r.description}","${r.active ? 'EVET' : 'HAYIR'}"`).join('\n')}`
  downloadCSV(csv, `sadoksan-bolge-fiyatlandirma-${new Date().toISOString().split('T')[0]}.csv`)
}

const exportProvinceOnly = () => {
  const csv = `İl Adı,Ek Ücret (₺),Açıklama,Aktif\n${pricing.provinceSurcharges.map(p => `"${p.province}","${p.surcharge}","${p.description}","${p.active ? 'EVET' : 'HAYIR'}"`).join('\n')}`
  downloadCSV(csv, `sadoksan-il-fiyatlandirma-${new Date().toISOString().split('T')[0]}.csv`)
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileImport = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const csv = e.target?.result as string
    try {
      const lines = csv.split('\n').filter(line => line.trim())
      let currentSection = ''
      let headerLine = true

      for (const line of lines) {
        if (line.includes('=== BÖLGE BAZLI')) {
          currentSection = 'regional'
          headerLine = true
          continue
        }
        if (line.includes('=== İL BAZLI')) {
          currentSection = 'province'
          headerLine = true
          continue
        }

        if (headerLine && (currentSection === 'regional' || currentSection === 'province')) {
          headerLine = false
          continue
        }

        if (!line.trim() || !currentSection) continue

        // Parse CSV line (handle quoted fields)
        const fields = line.match(/(".*?"|[^,]*)/g) || []
        const cleaned = fields.map(f => f.replace(/^"|"$/g, '').trim()).filter(f => f)

        if (currentSection === 'regional' && cleaned.length >= 2) {
          const regionName = cleaned[0] || ''
          const surcharge = cleaned[1] ? parseFloat(cleaned[1]) : 0
          const description = cleaned[2] || ''
          const active = cleaned[3]?.toUpperCase() === 'EVET'

          // Find region key by name
          const regionKey = Object.entries(REGIONS).find(([, r]) => r.name === regionName)?.[0]
          if (regionKey && !isNaN(surcharge)) {
            pricing.upsertRegionalSurcharge({
              regionKey: regionKey as keyof typeof REGIONS,
              surcharge,
              description,
              active,
            })
          }
        }

        if (currentSection === 'province' && cleaned.length >= 2) {
          const province = cleaned[0] || ''
          const surcharge = cleaned[1] ? parseFloat(cleaned[1]) : 0
          const description = cleaned[2] || ''
          const active = cleaned[3]?.toUpperCase() === 'EVET'

          if (province && PROVINCES.some((p) => p === province) && !isNaN(surcharge)) {
            pricing.upsertProvinceSurcharge({
              province,
              surcharge,
              description,
              active,
            })
          }
        }
      }

      // Reset file input
      target.value = ''
    } catch (error) {
      console.error('CSV import error:', error)
      alert('CSV dosyası işlenirken hata oluştu. Lütfen formatı kontrol edin.')
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="Fiyat & Lojistik"
      description="Bölgesel ve il bazlı fiyatlandırma, nakliye ücretleri ve hesaplayıcı."
    />

    <!-- Tab Navigation -->
    <div class="flex gap-2 border-b border-ink-200">
      <button
        @click="activeTab = 'fiyat'"
        :class="[
          'px-4 py-3 font-medium text-sm border-b-2 transition',
          activeTab === 'fiyat'
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-ink-600 hover:text-ink-900',
        ]"
      >
        <Icon name="lucide:dollar-sign" class="w-4 h-4 inline mr-2" />
        Fiyatlandırma
      </button>
      <button
        @click="activeTab = 'lojistik'"
        :class="[
          'px-4 py-3 font-medium text-sm border-b-2 transition',
          activeTab === 'lojistik'
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-ink-600 hover:text-ink-900',
        ]"
      >
        <Icon name="lucide:truck" class="w-4 h-4 inline mr-2" />
        Lojistik
      </button>
    </div>

    <!-- FIYATLANDIRMA TAB -->
    <div v-if="activeTab === 'fiyat'" class="space-y-5">
      <!-- Export/Import Toolbar -->
      <div class="bg-white rounded-xl border border-ink-200 p-4">
        <div class="flex items-center justify-between flex-wrap gap-3">
          <div class="text-sm font-medium text-ink-700">Dışa Aktar / İçe Aktar</div>
          <div class="flex gap-2 flex-wrap">
            <button
              @click="exportAllSurcharges"
              class="px-3 py-2 bg-primary-600 text-white text-xs font-medium rounded-lg hover:bg-primary-700 flex items-center gap-2"
            >
              <Icon name="lucide:download" class="w-4 h-4" />
              Tümünü İndir (CSV)
            </button>
            <button
              @click="exportRegionalOnly"
              class="px-3 py-2 bg-ink-600 text-white text-xs font-medium rounded-lg hover:bg-ink-700 flex items-center gap-2"
            >
              <Icon name="lucide:download" class="w-4 h-4" />
              Bölgeleri İndir
            </button>
            <button
              @click="exportProvinceOnly"
              class="px-3 py-2 bg-ink-600 text-white text-xs font-medium rounded-lg hover:bg-ink-700 flex items-center gap-2"
            >
              <Icon name="lucide:download" class="w-4 h-4" />
              İlleri İndir
            </button>
            <button
              @click="triggerFileInput"
              class="px-3 py-2 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 flex items-center gap-2"
            >
              <Icon name="lucide:upload" class="w-4 h-4" />
              CSV Yükle
            </button>
            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              style="display: none"
              @change="handleFileImport"
            />
          </div>
        </div>
      </div>

      <!-- Bölge Bazlı Fiyatlandırma -->
      <div class="bg-white rounded-xl border border-ink-200">
        <div class="px-5 py-4 border-b border-ink-200 bg-gradient-to-r from-primary-50 to-transparent">
          <h3 class="font-semibold text-ink-900 flex items-center gap-2">
            <Icon name="lucide:map" class="w-4 h-4 text-primary-600" />
            Bölge Bazlı Fiyatlandırma (7 Bölge)
          </h3>
          <p class="text-xs text-ink-500 mt-1">Her bölgenin temel ek ücretini ayarlayın. İl bazlı override varsa, o kullanılır.</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-ink-50 border-b border-ink-200">
              <tr>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Bölge Adı</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Ek Ücret (₺)</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Açıklama</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Durum</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr v-for="surcharge in pricing.regionalSurcharges" :key="surcharge.id" class="hover:bg-ink-50">
                <td class="px-5 py-3 text-sm font-medium text-ink-900">
                  {{ REGIONS[surcharge.regionKey as keyof typeof REGIONS]?.name || surcharge.regionKey }}
                </td>
                <td v-if="editingRegionalId === surcharge.id" class="px-5 py-3">
                  <input
                    v-model.number="editingRegionalData!.surcharge"
                    type="number"
                    step="0.01"
                    class="w-full px-2 py-1 border border-ink-300 rounded text-sm"
                  />
                </td>
                <td v-else class="px-5 py-3 text-sm font-semibold text-ink-900">{{ formatPrice(surcharge.surcharge) }}</td>
                <td v-if="editingRegionalId === surcharge.id" class="px-5 py-3">
                  <input
                    v-model="editingRegionalData!.description"
                    type="text"
                    class="w-full px-2 py-1 border border-ink-300 rounded text-sm"
                  />
                </td>
                <td v-else class="px-5 py-3 text-xs text-ink-600">{{ surcharge.description }}</td>
                <td class="px-5 py-3">
                  <StatusBadge :variant="surcharge.active ? 'success' : 'neutral'" :label="surcharge.active ? 'Aktif' : 'Pasif'" />
                </td>
                <td class="px-5 py-3 flex gap-1">
                  <button
                    v-if="editingRegionalId === surcharge.id"
                    @click="saveRegional"
                    class="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
                  >
                    Kaydet
                  </button>
                  <button
                    v-else
                    @click="startEditRegional(surcharge)"
                    class="px-2 py-1 text-xs font-medium text-ink-700 hover:bg-ink-200 rounded"
                  >
                    Düzenle
                  </button>
                  <button
                    v-if="editingRegionalId === surcharge.id"
                    @click="cancelEditRegional"
                    class="px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-200 rounded"
                  >
                    İptal
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- İl Bazlı Fiyatlandırma -->
      <div class="bg-white rounded-xl border border-ink-200">
        <div class="px-5 py-4 border-b border-ink-200 bg-gradient-to-r from-emerald-50 to-transparent">
          <h3 class="font-semibold text-ink-900 flex items-center gap-2">
            <Icon name="lucide:map-pin" class="w-4 h-4 text-emerald-600" />
            İl Bazlı Fiyatlandırma Overrides (81 İl)
          </h3>
          <p class="text-xs text-ink-500 mt-1">Belirli iller için bölge fiyatını override etmek istiyorsanız, burada özel fiyat belirleyin.</p>
        </div>

        <!-- Add new province surcharge -->
        <div class="px-5 py-4 border-b border-ink-200 bg-ink-50">
          <p class="text-xs font-medium text-ink-700 mb-3">Yeni İl Özeli Fiyat Ekle</p>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
            <select
              v-model="newProvinceSurcharge.province"
              class="px-3 py-2 border border-ink-300 rounded-lg text-sm bg-white"
            >
              <option value="">İl Seçiniz</option>
              <option v-for="p in PROVINCES" :key="p" :value="p" :disabled="getProvinceSurchargeOverride(p) !== undefined">
                {{ p }} {{ getProvinceSurchargeOverride(p) ? '(zaten var)' : '' }}
              </option>
            </select>
            <input
              v-model.number="newProvinceSurcharge.surcharge"
              type="number"
              step="0.01"
              placeholder="Ek Ücret (₺)"
              class="px-3 py-2 border border-ink-300 rounded-lg text-sm"
            />
            <input
              v-model="newProvinceSurcharge.description"
              type="text"
              placeholder="Açıklama (isteğe bağlı)"
              class="px-3 py-2 border border-ink-300 rounded-lg text-sm"
            />
            <button
              @click="addNewProvinceSurcharge"
              :disabled="!newProvinceSurcharge.province"
              class="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium text-sm"
            >
              Ekle
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-ink-50 border-b border-ink-200">
              <tr>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">İl Adı</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Bölge</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Bölge Fiyatı (₺)</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">İl Override (₺)</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">Açıklama</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 text-left uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr v-for="province in PROVINCES" :key="province" :class="{ 'bg-emerald-50': getProvinceSurchargeOverride(province) }">
                <td class="px-5 py-3 text-sm font-medium text-ink-900">{{ province }}</td>
                <td class="px-5 py-3 text-xs text-ink-600">
                  {{ getRegionNameByProvince(province) || '—' }}
                </td>
                <td class="px-5 py-3 text-xs text-ink-700">
                  {{ formatPrice(getRegionalSurcharge(province)?.surcharge ?? 0) }}
                </td>
                <td v-if="editingProvinceId === getProvinceSurchargeOverride(province)?.id" class="px-5 py-3">
                  <input
                    v-model.number="editingProvinceData!.surcharge"
                    type="number"
                    step="0.01"
                    class="w-full px-2 py-1 border border-ink-300 rounded text-sm"
                  />
                </td>
                <td v-else class="px-5 py-3 text-sm font-semibold" :class="getProvinceSurchargeOverride(province) ? 'text-emerald-700' : 'text-ink-500'">
                  {{ getProvinceSurchargeOverride(province) ? formatPrice(getProvinceSurchargeOverride(province)!.surcharge) : '—' }}
                </td>
                <td v-if="editingProvinceId === getProvinceSurchargeOverride(province)?.id" class="px-5 py-3">
                  <input
                    v-model="editingProvinceData!.description"
                    type="text"
                    class="w-full px-2 py-1 border border-ink-300 rounded text-sm"
                  />
                </td>
                <td v-else class="px-5 py-3 text-xs text-ink-600">
                  {{ getProvinceSurchargeOverride(province)?.description || '—' }}
                </td>
                <td class="px-5 py-3 flex gap-1">
                  <template v-if="getProvinceSurchargeOverride(province)">
                    <button
                      v-if="editingProvinceId === getProvinceSurchargeOverride(province)?.id"
                      @click="saveProvince"
                      class="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded"
                    >
                      Kaydet
                    </button>
                    <button
                      v-else
                      @click="startEditProvince(getProvinceSurchargeOverride(province)!)"
                      class="px-2 py-1 text-xs font-medium text-ink-700 hover:bg-ink-200 rounded"
                    >
                      Düzenle
                    </button>
                    <button
                      v-if="editingProvinceId === getProvinceSurchargeOverride(province)?.id"
                      @click="cancelEditProvince"
                      class="px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-200 rounded"
                    >
                      İptal
                    </button>
                    <button
                      v-else
                      @click="pricing.removeProvinceSurcharge(getProvinceSurchargeOverride(province)!.id)"
                      class="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
                    >
                      Sil
                    </button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- LOJİSTİK TAB -->
    <div v-if="activeTab === 'lojistik'" class="space-y-5">
      <!-- Bölgesel Lojistik Kuralları -->
      <div class="bg-white rounded-xl border border-ink-200">
        <div class="px-5 py-4 border-b border-ink-200 bg-gradient-to-r from-amber-50 to-transparent">
          <h3 class="font-semibold text-ink-900 flex items-center gap-2">
            <Icon name="lucide:truck" class="w-4 h-4 text-amber-600" />
            Bölgesel Lojistik Kuralları
          </h3>
          <p class="text-xs text-ink-500 mt-1">Sabit ücret, KG başına ve m² başına nakliye ücretlerini belirleyin.</p>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-ink-50 border-b border-ink-200 text-left">
              <tr>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Bölge</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Sabit Ücret</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">m² Başına</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Ücretsiz Eşik</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Durum</th>
                <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">İşlemler</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr v-for="r in pricing.rules" :key="r.id" class="hover:bg-ink-50">
                <td class="px-5 py-3 text-sm font-medium text-ink-900">{{ r.region }}</td>
                <td class="px-5 py-3 text-sm font-semibold text-ink-900">{{ formatPrice(r.baseSurcharge) }}</td>
                <td class="px-5 py-3 text-sm text-ink-700">{{ formatPrice(r.perM2Surcharge) }}</td>
                <td class="px-5 py-3 text-sm text-ink-700">
                  {{ r.freeShippingThreshold ? formatPrice(r.freeShippingThreshold) : '—' }}
                </td>
                <td class="px-5 py-3">
                  <StatusBadge
                    :variant="r.active ? 'success' : 'neutral'"
                    :label="r.active ? 'Aktif' : 'Pasif'"
                  />
                </td>
                <td class="px-5 py-3">
                  <button
                    @click="openRuleEditModal(r)"
                    class="px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-100 rounded"
                  >
                    Düzenle
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <EmptyState v-if="pricing.rules.length === 0" icon="lucide:truck" title="Lojistik kuralı yok" />
      </div>
    </div>

    <!-- Logistics Rule Edit Modal -->
    <FiyatlandirmaLogisticsRuleEditModal
      :rule="selectedRule"
      :is-open="showRuleEditModal"
      @save="handleSaveRule"
      @close="showRuleEditModal = false"
    />
  </div>
</template>

<style scoped>
/* Tab indicator animation */
.border-b-2 {
  transition: all 0.3s ease;
}
</style>
