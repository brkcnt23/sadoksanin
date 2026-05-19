<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-2">Bayi Paneli</h1>
        <p class="text-gray-600">Cari hesabınız ve raporlarınız</p>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg">
        {{ error }}
      </div>

      <!-- Loading State -->
      <div v-if="loading && cariHistory.length === 0" class="bg-white rounded-lg shadow p-8 text-center">
        <p class="text-gray-600">Veriler yükleniyor...</p>
      </div>

      <!-- Cari Hesap Widget -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Toplam Bakiye -->
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Toplam Bakiye</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ formatCurrency(dealerBalance) }}</p>
              <p class="text-xs text-gray-400 mt-1" :class="dealerBalance < 0 ? 'text-red-500' : 'text-green-500'">
                {{ dealerBalance < 0 ? 'Borçlu' : 'Alacaklı' }}
              </p>
            </div>
            <div class="text-4xl text-blue-500">💰</div>
          </div>
        </div>

        <!-- Aylık Alış -->
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Aylık Alış</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ formatCurrency(monthlyPurchase) }}</p>
              <p class="text-xs text-green-600 mt-1">+12% geçen aya göre</p>
            </div>
            <div class="text-4xl text-green-500">📈</div>
          </div>
        </div>

        <!-- Kredi Limiti -->
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-600 text-sm font-medium">Kredi Limiti</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">{{ formatCurrency(creditLimit) }}</p>
              <div class="w-full bg-gray-200 rounded-full h-2 mt-3">
                <div class="bg-purple-500 h-2 rounded-full" :style="{ width: creditUsedPercent + '%' }"></div>
              </div>
              <p class="text-xs text-gray-500 mt-1">{{ creditUsedPercent }}% kullanılıyor</p>
            </div>
            <div class="text-4xl text-purple-500">💳</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow-lg overflow-hidden">
        <div class="flex border-b border-gray-200">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex-1 py-4 px-6 font-medium text-center transition-all',
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900'
            ]"
          >
            <span class="mr-2">{{ tab.icon }}</span>
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab Content -->
        <div class="p-6">
          <!-- Cari Hesap Detayı -->
          <div v-if="activeTab === 'cari'" class="space-y-4">
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th class="px-4 py-3 text-left font-medium text-gray-700">Tarih</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-700">İşlem Türü</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-700">Açıklama</th>
                    <th class="px-4 py-3 text-right font-medium text-gray-700">Tutar</th>
                    <th class="px-4 py-3 text-right font-medium text-gray-700">Bakiye</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="transaction in cariHistory" :key="transaction.id" class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-3 text-gray-900">{{ formatDate(new Date(transaction.date)) }}</td>
                    <td class="px-4 py-3">
                      <span :class="[
                        'px-3 py-1 rounded-full text-xs font-medium',
                        transaction.type === 'debit' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                      ]">
                        {{ transaction.type === 'debit' ? 'Alış' : 'Ödeme' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-gray-600">{{ transaction.description }}</td>
                    <td class="px-4 py-3 text-right font-medium" :class="transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'">
                      {{ transaction.type === 'debit' ? '-' : '+' }}{{ formatCurrency(transaction.amount) }}
                    </td>
                    <td class="px-4 py-3 text-right font-medium text-gray-900">{{ formatCurrency(transaction.balance) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Raporlar -->
          <div v-if="activeTab === 'raporlar'" class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Aylık Rapor -->
              <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-gray-900">Aylık Rapor</h3>
                    <p class="text-sm text-gray-600 mt-1">Geliri/Gideri detaylı rapor</p>
                  </div>
                  <div class="text-2xl">📊</div>
                </div>
                <button @click="downloadReport('monthly')" :disabled="loading" class="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium text-sm disabled:opacity-50">
                  {{ loading ? 'İndiriliyor...' : 'İndir (Excel)' }}
                </button>
              </div>

              <!-- Yıllık Rapor -->
              <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-gray-900">Yıllık Rapor</h3>
                    <p class="text-sm text-gray-600 mt-1">Yıl boyunca işlemleriniz</p>
                  </div>
                  <div class="text-2xl">📈</div>
                </div>
                <button @click="downloadReport('yearly')" :disabled="loading" class="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium text-sm disabled:opacity-50">
                  {{ loading ? 'İndiriliyor...' : 'İndir (Excel)' }}
                </button>
              </div>

              <!-- Fatura Raporu -->
              <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-gray-900">Fatura Raporu</h3>
                    <p class="text-sm text-gray-600 mt-1">Tüm faturalarınız</p>
                  </div>
                  <div class="text-2xl">🧾</div>
                </div>
                <button @click="downloadReport('invoice')" :disabled="loading" class="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium text-sm disabled:opacity-50">
                  {{ loading ? 'İndiriliyor...' : 'İndir (Excel)' }}
                </button>
              </div>

              <!-- Stok Raporu -->
              <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-gray-900">Stok & Fiyat</h3>
                    <p class="text-sm text-gray-600 mt-1">Güncel stok ve fiyat listesi</p>
                  </div>
                  <div class="text-2xl">📦</div>
                </div>
                <button @click="downloadReport('stock')" :disabled="loading" class="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded font-medium text-sm disabled:opacity-50">
                  {{ loading ? 'İndiriliyor...' : 'İndir (Excel)' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Proformalar -->
          <div v-if="activeTab === 'proformalar'" class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p class="text-sm text-blue-800">
                💡 Size gönderilen proformaları burada görebilirsiniz. İndirmek veya görüntülemek için tıklayın.
              </p>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th class="px-4 py-3 text-left font-medium text-gray-700">Proforma No</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-700">Tarih</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-700">Tutar</th>
                    <th class="px-4 py-3 text-left font-medium text-gray-700">Durum</th>
                    <th class="px-4 py-3 text-center font-medium text-gray-700">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="proforma in proformas" :key="proforma.id" class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="px-4 py-3 font-medium text-gray-900">{{ proforma.proformaNumber }}</td>
                    <td class="px-4 py-3 text-gray-600">{{ formatDate(new Date(proforma.generatedAt)) }}</td>
                    <td class="px-4 py-3 font-medium text-gray-900">{{ formatCurrency(Number(proforma.totalAmount)) }}</td>
                    <td class="px-4 py-3">
                      <span :class="[
                        'px-3 py-1 rounded-full text-xs font-medium',
                        proforma.status === 'sent' ? 'bg-green-100 text-green-700' :
                        proforma.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      ]">
                        {{ proforma.status === 'sent' ? 'Gönderildi' : proforma.status === 'accepted' ? 'Kabul Edildi' : 'Taslak' }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-center">
                      <button @click="downloadProforma(proforma.id)" :disabled="loading" class="text-blue-600 hover:text-blue-800 font-medium text-sm disabled:opacity-50">
                        📥 {{ loading ? 'İndiriliyor...' : 'İndir' }}
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Bilgilerim -->
          <div v-if="activeTab === 'bilgiler'" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Bayi Adı</label>
                <input type="text" :value="dealerInfo.name" disabled class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Şirket</label>
                <input type="text" :value="dealerInfo.company" disabled class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Cari Hesap No</label>
                <input type="text" :value="dealerInfo.cariNo" disabled class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                <input type="text" :value="dealerInfo.phone" disabled class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Şehir</label>
                <input type="text" :value="dealerInfo.city" disabled class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Bölge</label>
                <input type="text" :value="dealerInfo.region" disabled class="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-900" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const activeTab = ref('cari')
const loading = ref(false)
const error = ref<string | null>(null)

const { getCariTransactions, getProformas, downloadProforma: downloadProformaAPI, getDealerInfo, downloadStockReport } = useDealerApi()

const tabs = [
  { id: 'cari', label: 'Cari Hesap', icon: '💳' },
  { id: 'raporlar', label: 'Raporlar', icon: '📊' },
  { id: 'proformalar', label: 'Proformalar', icon: '📄' },
  { id: 'bilgiler', label: 'Bilgilerim', icon: '👤' }
]

// Reactive data
const dealerBalance = ref(0)
const monthlyPurchase = ref(0)
const creditLimit = ref(0)
const creditUsedPercent = ref(0)

const dealerInfo = ref<any>({
  name: 'Yükleniyor...',
  company: '',
  cariNo: '',
  phone: '',
  city: '',
  region: ''
})

const cariHistory = ref<any[]>([])
const proformas = ref<any[]>([])

// Load dealer data on mount
onMounted(async () => {
  await loadDealerData()
})

const loadDealerData = async () => {
  loading.value = true
  error.value = null
  try {
    const [infoResponse, cariResponse, proformasResponse] = await Promise.all([
      getDealerInfo(),
      getCariTransactions(),
      getProformas()
    ])

    dealerInfo.value = infoResponse
    cariHistory.value = cariResponse
    proformas.value = proformasResponse

    // Calculate dashboard metrics
    dealerBalance.value = infoResponse.cariBalance
    creditLimit.value = infoResponse.creditLimit
    creditUsedPercent.value = Math.round((Math.abs(dealerBalance.value) / creditLimit.value) * 100)

    // Calculate monthly purchase from cari history (sum of debits)
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    monthlyPurchase.value = cariResponse
      .filter(t => {
        const date = new Date(t.date)
        return (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear &&
          t.type === 'debit'
        )
      })
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0)
  } catch (err: any) {
    error.value = err.message || 'Veriler yüklenemedi'
    console.error('Error loading dealer data:', err)
  } finally {
    loading.value = false
  }
}

// Methods
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(value)
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)
}

const downloadReport = async (reportType: 'monthly' | 'yearly' | 'invoice' | 'stock') => {
  loading.value = true
  error.value = null
  try {
    const reportLabels: Record<string, string> = {
      monthly: 'Aylık Raporu',
      yearly: 'Yıllık Raporu',
      invoice: 'Fatura Raporu',
      stock: 'Stok Raporu'
    }
    const blob = await downloadStockReport(reportType)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${reportLabels[reportType]}-${new Date().toISOString().split('T')[0]}.xlsx`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    error.value = err.message || 'Rapor indirilemedi'
    console.error('Error downloading report:', err)
  } finally {
    loading.value = false
  }
}

const downloadProforma = async (id: string) => {
  loading.value = true
  error.value = null
  try {
    const blob = await downloadProformaAPI(id)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `proforma-${id}.pdf`
    a.click()
    window.URL.revokeObjectURL(url)
  } catch (err: any) {
    error.value = err.message || 'Proforma indirilemedi'
    console.error('Error downloading proforma:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Smooth transitions */
button {
  transition: all 0.3s ease;
}

button:active {
  transform: scale(0.98);
}
</style>
