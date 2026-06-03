<template>
  <div class="min-h-screen bg-ink-50 py-8 px-4">
    <div class="max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-ink-900">Proforma Yönetimi</h1>
          <p class="text-ink-600 mt-2">Proforma faturalarını oluştur ve yönet</p>
        </div>
        <button
          @click="showCreateForm = true"
          class="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2"
        >
          <Icon name="lucide:plus" class="w-4 h-4" /> Yeni Proforma
        </button>
      </div>

      <!-- Error Alert -->
      <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6">
        {{ error }}
      </div>

      <!-- Loading State -->
      <div v-if="loading && allProformas.length === 0" class="bg-white rounded-xl border border-ink-200 p-8 text-center">
        <p class="text-ink-600">Proformalar yükleniyor...</p>
      </div>

      <!-- Tabs -->
      <div v-if="!loading || allProformas.length > 0" class="bg-white rounded-xl border border-ink-200 mb-6">
        <div class="flex border-b border-ink-200">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex-1 py-4 px-6 font-medium text-center transition-all',
              activeTab === tab.id
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                : 'text-ink-600 hover:text-ink-900'
            ]"
          >
            {{ tab.label }} ({{ getTabCount(tab.id) }})
          </button>
        </div>

        <!-- Proforma Listesi -->
        <div class="p-6">
          <!-- Search & Filter -->
          <div class="flex gap-4 mb-6">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Proforma No, Müşteri Adı..."
              class="flex-1 px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <select
              v-model="filterStatus"
              class="px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="sent">Gönderildi</option>
              <option value="accepted">Kabul Edildi</option>
            </select>
          </div>

          <!-- Tablo -->
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-ink-100 border-b border-ink-200">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-ink-700">Proforma No</th>
                  <th class="px-4 py-3 text-left font-medium text-ink-700">Müşteri</th>
                  <th class="px-4 py-3 text-left font-medium text-ink-700">Şablon</th>
                  <th class="px-4 py-3 text-left font-medium text-ink-700">Tarih</th>
                  <th class="px-4 py-3 text-right font-medium text-ink-700">Tutar</th>
                  <th class="px-4 py-3 text-left font-medium text-ink-700">Durum</th>
                  <th class="px-4 py-3 text-center font-medium text-ink-700">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="proforma in filteredProformas" :key="proforma.id" class="border-b border-ink-100 hover:bg-ink-50">
                  <td class="px-4 py-3 font-medium text-ink-900">{{ proforma.proformaNumber }}</td>
                  <td class="px-4 py-3 text-ink-600">
                    <div>{{ proforma.customerName }}</div>
                    <div class="text-xs text-ink-400">{{ proforma.customerCity }}</div>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="[
                      'px-2 py-1 rounded text-xs font-medium',
                      proforma.templateType === 'LOCAL'
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-purple-100 text-purple-700'
                    ]">
                      {{ proforma.templateType }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-ink-600">{{ formatDate(new Date(proforma.generatedAt)) }}</td>
                  <td class="px-4 py-3 text-right font-medium text-ink-900">{{ formatCurrency(Number(proforma.totalAmount)) }}</td>
                  <td class="px-4 py-3">
                    <span :class="[
                      'px-3 py-1 rounded-full text-xs font-medium',
                      proforma.status === 'sent' ? 'bg-green-100 text-green-700' :
                      proforma.status === 'accepted' ? 'bg-primary-100 text-primary-700' :
                      'bg-yellow-100 text-yellow-700'
                    ]">
                      {{ statusLabel(proforma.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex justify-center gap-2">
                      <button
                        @click="viewProforma(proforma)"
                        class="text-primary-600 hover:text-primary-800 text-sm font-medium"
                        title="Görüntüle"
                      >
                        <Icon name="lucide:eye" class="w-4 h-4" />
                      </button>
                      <button
                        v-if="proforma.status === 'draft'"
                        @click="editProforma(proforma)"
                        class="text-amber-600 hover:text-amber-800 text-sm font-medium"
                        title="Düzenle"
                      >
                        <Icon name="lucide:edit-2" class="w-4 h-4" />
                      </button>
                      <button
                        v-if="proforma.status === 'draft'"
                        @click="sendProformaHandler(proforma.id)"
                        class="text-green-600 hover:text-green-800 text-sm font-medium"
                        title="Gönder"
                      >
                        <Icon name="lucide:send" class="w-4 h-4" />
                      </button>
                      <button
                        @click="downloadProformaHandler(proforma.id)"
                        class="text-purple-600 hover:text-purple-800 text-sm font-medium"
                        title="İndir"
                      >
                        <Icon name="lucide:download" class="w-4 h-4" />
                      </button>
                      <button
                        v-if="proforma.status !== 'accepted'"
                        @click="deleteProformaHandler(proforma.id)"
                        class="text-red-600 hover:text-red-800 text-sm font-medium"
                        title="Sil"
                      >
                        <Icon name="lucide:trash-2" class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredProformas.length === 0" class="border-b border-ink-100">
                  <td colspan="7" class="px-4 py-8 text-center text-ink-500">
                    Proforma bulunamadı
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between mt-6">
            <p class="text-sm text-ink-600">
              Toplam: <strong>{{ allProformas.length }}</strong> proforma
            </p>
            <div class="flex gap-2">
              <button class="px-3 py-1 border border-ink-300 rounded hover:bg-ink-100">← Önceki</button>
              <button class="px-3 py-1 border border-primary-500 bg-primary-50 text-primary-600 rounded">1</button>
              <button class="px-3 py-1 border border-ink-300 rounded hover:bg-ink-100">Sonraki →</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Detay Görüntüleme Modalı -->
      <div v-if="showDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
          <!-- Modal Header -->
          <div class="sticky top-0 bg-ink-700 text-white px-6 py-4 flex items-center justify-between z-10">
            <div>
              <h2 class="text-xl font-bold">{{ selectedProforma?.proformaNumber }}</h2>
              <p class="text-sm opacity-80">{{ formatDate(new Date(selectedProforma?.generatedAt)) }}</p>
            </div>
            <button @click="closeDetailModal" class="text-2xl hover:opacity-80">&times;</button>
          </div>

          <div v-if="detailLoading" class="p-8 text-center text-ink-500">Yükleniyor...</div>

          <div v-else-if="selectedProforma" class="p-6 space-y-6">
            <!-- Status & Template -->
            <div class="flex items-center gap-4">
              <span :class="[
                'px-3 py-1 rounded-full text-xs font-medium',
                selectedProforma.status === 'sent' ? 'bg-green-100 text-green-700' :
                selectedProforma.status === 'accepted' ? 'bg-primary-100 text-primary-700' :
                'bg-yellow-100 text-yellow-700'
              ]">
                {{ statusLabel(selectedProforma.status) }}
              </span>
              <span :class="[
                'px-3 py-1 rounded-full text-xs font-medium',
                selectedProforma.templateType === 'LOCAL' ? 'bg-primary-100 text-primary-700' : 'bg-purple-100 text-purple-700'
              ]">
                {{ selectedProforma.templateType === 'LOCAL' ? 'Yerel' : 'Uluslararası' }}
              </span>
            </div>

            <!-- Müşteri Bilgileri -->
            <div class="grid grid-cols-2 gap-6">
              <div class="bg-ink-50 p-4 rounded-lg">
                <h3 class="text-sm font-semibold text-ink-700 mb-2">Müşteri Bilgileri</h3>
                <p class="text-sm font-medium">{{ selectedProforma.customerName }}</p>
                <p class="text-sm text-ink-600">{{ selectedProforma.customerAddress || 'Adres belirtilmemiş' }}</p>
                <p class="text-sm text-ink-600">{{ selectedProforma.customerCity }}</p>
                <p class="text-sm text-ink-600" v-if="selectedProforma.customerPhone">{{ selectedProforma.customerPhone }}</p>
                <p class="text-sm text-ink-600" v-if="selectedProforma.customerEmail">{{ selectedProforma.customerEmail }}</p>
              </div>
              <div class="bg-ink-50 p-4 rounded-lg">
                <h3 class="text-sm font-semibold text-ink-700 mb-2">Firma Bilgileri</h3>
                <p class="text-sm font-medium">{{ selectedProforma.companyName }}</p>
                <p class="text-sm text-ink-600">{{ selectedProforma.companyAddress || 'Adres belirtilmemiş' }}</p>
                <p class="text-sm text-ink-600" v-if="selectedProforma.companyPhone">{{ selectedProforma.companyPhone }}</p>
                <p class="text-sm text-ink-600" v-if="selectedProforma.companyEmail">{{ selectedProforma.companyEmail }}</p>
              </div>
            </div>

            <!-- Ürünler Tablosu -->
            <div>
              <h3 class="text-sm font-semibold text-ink-700 mb-2">Ürünler</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-sm border border-ink-200 rounded-lg">
                  <thead class="bg-ink-100">
                    <tr>
                      <th class="px-3 py-2 text-left font-medium text-ink-700">SKU</th>
                      <th class="px-3 py-2 text-left font-medium text-ink-700">Açıklama</th>
                      <th class="px-3 py-2 text-right font-medium text-ink-700">Adet</th>
                      <th class="px-3 py-2 text-right font-medium text-ink-700">Birim Fiyat</th>
                      <th class="px-3 py-2 text-right font-medium text-ink-700">Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in selectedProforma.items" :key="item.id" class="border-t border-ink-100">
                      <td class="px-3 py-2 font-mono text-xs">{{ item.sku }}</td>
                      <td class="px-3 py-2">{{ item.description }}</td>
                      <td class="px-3 py-2 text-right">{{ item.quantity }}</td>
                      <td class="px-3 py-2 text-right">{{ formatCurrency(Number(item.unitPrice)) }}</td>
                      <td class="px-3 py-2 text-right font-medium">{{ formatCurrency(Number(item.lineTotal)) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Toplam -->
            <div class="bg-ink-50 p-4 rounded-lg">
              <div class="flex justify-between text-sm">
                <span>Ara Toplam:</span>
                <span>{{ formatCurrency(Number(selectedProforma.subtotal)) }}</span>
              </div>
              <div class="flex justify-between text-sm mt-1">
                <span>Kargo:</span>
                <span>{{ formatCurrency(Number(selectedProforma.shipping)) }}</span>
              </div>
              <div class="flex justify-between text-sm mt-1">
                <span>Vergi:</span>
                <span>{{ formatCurrency(Number(selectedProforma.tax)) }}</span>
              </div>
              <div class="flex justify-between font-bold text-lg mt-2 pt-2 border-t border-ink-300">
                <span>Toplam:</span>
                <span class="text-primary-600">{{ formatCurrency(Number(selectedProforma.totalAmount)) }}</span>
              </div>
            </div>

            <!-- PDF Preview -->
            <div v-if="pdfBlobUrl" class="border border-ink-200 rounded-lg overflow-hidden">
              <h3 class="text-sm font-semibold text-ink-700 px-4 pt-4">PDF Önizleme</h3>
              <iframe :src="pdfBlobUrl" class="w-full" style="height: 500px; border: none;" />
            </div>
            <div v-else class="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-lg text-sm">
              PDF önizleme şu anda kullanılamıyor. Python servisinin çalıştığından emin olun.
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-3 justify-end pt-4 border-t border-ink-200">
              <button
                v-if="selectedProforma.status === 'draft'"
                @click="sendProformaHandler(selectedProforma.id); closeDetailModal()"
                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium text-sm"
              >
                Gönder
              </button>
              <button
                @click="downloadProformaHandler(selectedProforma.id)"
                class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm"
              >
                PDF İndir
              </button>
              <button
                @click="closeDetailModal"
                class="px-4 py-2 border border-ink-300 rounded-lg font-medium text-sm hover:bg-ink-50"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Oluşturma Formu Modal -->
      <div v-if="showCreateForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
          <!-- Modal Header -->
          <div class="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 flex items-center justify-between">
            <h2 class="text-xl font-bold">Yeni Proforma Oluştur</h2>
            <button @click="showCreateForm = false" class="text-2xl hover:opacity-80"><Icon name="lucide:x" class="w-5 h-5" /></button>
          </div>

          <!-- Modal Content -->
          <div class="p-6 space-y-6">
            <!-- Şablon Seçimi -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-3">Şablon Türü</label>
              <div class="grid grid-cols-2 gap-4">
                <button
                  @click="newProforma.templateType = 'LOCAL'"
                  :class="[
                    'p-4 border-2 rounded-lg text-center font-medium transition-all',
                    newProforma.template === 'LOCAL'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-ink-200 hover:border-ink-300'
                  ]"
                >
                  Yerel (LOCAL)
                </button>
                <button
                  @click="newProforma.templateType = 'INTERNATIONAL'"
                  :class="[
                    'p-4 border-2 rounded-lg text-center font-medium transition-all',
                    newProforma.template === 'INTERNATIONAL'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-ink-200 hover:border-ink-300'
                  ]"
                >
                  Uluslararası (INTL)
                </button>
              </div>
            </div>

            <!-- Müşteri Seçimi -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-2">Müşteri</label>
              <select v-model="newProforma.customer" class="w-full px-4 py-2 border border-ink-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                <option value="">Müşteri Seç...</option>
                <option v-for="dealer in dealers" :key="dealer.id" :value="dealer.company">
                  {{ dealer.company }} — {{ dealer.city }}
                </option>
              </select>
            </div>

            <!-- Ürünler -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-2">Ürünler Ekle</label>

              <!-- Product search bar (autocomplete) -->
              <div class="relative mb-4">
                <input
                  v-model="productSearchQuery"
                  type="text"
                  placeholder="Ürün ara (SKU, isim veya marka) — seçince satıra eklenir"
                  class="w-full px-4 py-2.5 border-2 border-primary-200 rounded-lg text-sm focus:border-primary-500 focus:outline-none"
                  @focus="productSearchOpen = true"
                  @keydown.escape="productSearchOpen = false"
                />
                <div
                  v-if="productSearchOpen && (productSearchResults.length > 0 || productSearchLoading || productSearchQuery.trim())"
                  class="absolute z-30 left-0 right-0 mt-1 bg-white border border-ink-200 rounded-lg max-h-64 overflow-y-auto"
                >
                  <div v-if="productSearchLoading" class="px-4 py-3 text-sm text-ink-500">
                    Aranıyor…
                  </div>
                  <button
                    v-for="product in productSearchResults"
                    :key="product.id"
                    type="button"
                    @click="addProductFromSearch(product)"
                    class="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-primary-50 border-b border-ink-100 last:border-b-0"
                  >
                    <div class="w-10 h-10 rounded bg-ink-100 flex-shrink-0 overflow-hidden">
                      <img v-if="product.imageUrl" :src="product.imageUrl" class="w-full h-full object-cover" alt="" />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-sm font-medium text-ink-900 truncate">{{ product.name }}</div>
                      <div class="text-xs text-ink-500">
                        {{ product.sku }} · {{ product.brand }} · {{ formatCurrency(product.basePrice) }}
                      </div>
                    </div>
                  </button>
                  <div
                    v-if="!productSearchLoading && productSearchResults.length === 0 && productSearchQuery.trim()"
                    class="px-4 py-3 text-sm text-ink-500"
                  >
                    Eşleşen ürün yok. Aşağıdan manuel ekleyebilirsiniz.
                  </div>
                </div>
              </div>

              <p class="text-xs text-ink-500 mb-2">
                Listede yoksa "Manuel Ekle" ile elle giriş yapabilirsiniz. SKU'yu yazıp Tab'a basınca veritabanı görseli otomatik gelir.
              </p>

              <!-- Column header row -->
              <div class="grid grid-cols-[5rem_1fr_3rem] gap-3 items-center px-3 py-2 bg-ink-100 rounded-t-lg border border-ink-200 text-xs font-semibold text-ink-600 uppercase tracking-wide">
                <div>Görsel</div>
                <div class="grid grid-cols-12 gap-2">
                  <div class="col-span-3">SKU</div>
                  <div class="col-span-5">Ürün Adı / Açıklama</div>
                  <div class="col-span-2 text-right">Adet</div>
                  <div class="col-span-2 text-right">Birim Fiyat</div>
                </div>
                <div></div>
              </div>

              <div class="space-y-2 border border-t-0 border-ink-200 rounded-b-lg p-2 bg-white">
                <div
                  v-for="(item, idx) in newProforma.items"
                  :key="idx"
                  class="grid grid-cols-[5rem_1fr_3rem] gap-3 items-start p-2 bg-ink-50 border border-ink-200 rounded-lg"
                >
                  <!-- Image thumbnail + upload -->
                  <div class="flex-shrink-0">
                    <div
                      class="w-20 h-20 rounded border-2 border-dashed border-ink-300 bg-white flex items-center justify-center overflow-hidden relative"
                    >
                      <img
                        v-if="item.imageUrl"
                        :src="item.imageUrl"
                        alt="Ürün görseli"
                        class="w-full h-full object-cover"
                      />
                      <span v-else class="text-ink-400 text-[10px] text-center px-1">Görsel yok</span>
                      <button
                        v-if="item.imageUrl"
                        type="button"
                        @click="clearImage(item)"
                        class="absolute top-0 right-0 bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-bl text-xs leading-none hover:bg-red-600"
                        title="Görseli kaldır"
                      >
                        <Icon name="lucide:x" class="w-5 h-5" />
                      </button>
                    </div>
                    <label
                      class="block mt-1 text-center text-[11px] text-primary-600 hover:text-primary-800 cursor-pointer"
                    >
                      {{ item.imageSource === 'manual' ? 'Değiştir' : 'Yükle' }}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        class="hidden"
                        @change="handleImageUpload(item, $event)"
                      />
                    </label>
                    <p
                      v-if="item.imageSource"
                      class="text-[10px] text-center mt-0.5"
                      :class="item.imageSource === 'manual' ? 'text-amber-600' : 'text-green-600'"
                    >
                      {{ item.imageSource === 'manual' ? 'Manuel' : 'Katalog' }}
                    </p>
                  </div>

                  <!-- Form fields -->
                  <div class="grid grid-cols-12 gap-2">
                    <input
                      v-model="item.sku"
                      placeholder="SKU"
                      class="col-span-3 px-2 py-2 border border-ink-300 rounded text-sm"
                      @blur="onSkuCommit(item)"
                      @keydown.enter.prevent="onSkuCommit(item)"
                    />
                    <input
                      v-model="item.description"
                      placeholder="Açıklama"
                      class="col-span-5 px-2 py-2 border border-ink-300 rounded text-sm"
                    />
                    <input
                      v-model.number="item.quantity"
                      type="number"
                      min="1"
                      placeholder="Adet"
                      class="col-span-2 px-2 py-2 border border-ink-300 rounded text-sm text-right"
                    />
                    <input
                      v-model.number="item.price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Fiyat"
                      class="col-span-2 px-2 py-2 border border-ink-300 rounded text-sm text-right"
                    />
                  </div>

                  <button
                    type="button"
                    @click="newProforma.items.splice(idx, 1)"
                    :disabled="newProforma.items.length === 1"
                    class="flex-shrink-0 text-red-600 hover:text-red-800 disabled:text-ink-300 disabled:cursor-not-allowed text-lg self-center"
                    title="Satırı sil"
                  >
                    <Icon name="lucide:trash-2" class="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  @click="newProforma.items.push(blankItem())"
                  class="text-primary-600 hover:text-primary-800 text-sm font-medium px-2 py-1"
                >
                  + Manuel Ekle
                </button>
              </div>
            </div>

            <!-- Toplam -->
            <div class="bg-ink-50 p-4 rounded-lg">
              <div class="flex justify-between font-bold text-lg">
                <span>Toplam:</span>
                <span class="text-primary-600">{{ formatCurrency(calculateTotal()) }}</span>
              </div>
            </div>

            <!-- Error message -->
            <div v-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {{ error }}
            </div>

            <!-- Buttons -->
            <div class="flex gap-3 justify-end">
              <button
                @click="showCreateForm = false"
                :disabled="loading"
                class="px-6 py-2 border border-ink-300 rounded-lg font-medium hover:bg-ink-50 disabled:opacity-50"
              >
                İptal
              </button>
              <button
                @click="createProformaHandler"
                :disabled="loading"
                class="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {{ loading ? 'Kaydediliyor...' : 'Taslak Olarak Kaydet' }}
              </button>
              <button
                @click="createAndSendProformaHandler"
                :disabled="loading"
                class="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {{ loading ? 'İşleniyor...' : 'Oluştur & Gönder' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { ProductSearchResult } from '~/composables/useProformaApi'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Proforma | Sadöksan Admin',
})

interface NewProformaItem {
  sku: string
  description: string
  quantity: number
  price: number
  /** Manual upload (data:image/...) or auto-fetched product image; null = no image */
  imageUrl: string | null
  /** UI hint: where the current image came from */
  imageSource: 'manual' | 'product' | null
}

const activeTab = ref('all')
const showCreateForm = ref(false)
const searchQuery = ref('')
const filterStatus = ref('')
const loading = ref(false)
const error = ref<string | null>(null)

// Detail modal state
const showDetailModal = ref(false)
const selectedProforma = ref<any>(null)
const detailLoading = ref(false)
const pdfBlobUrl = ref<string | null>(null)

const { createProforma, createAndSendProforma, getProformas, sendProforma, downloadProforma, deleteProforma, getProductImage, searchProducts, getDealers, getProforma } = useProformaApi()

// Configurable upload limits (kept generous; PDF embedding downsizes anyway)
const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2 MB hard limit on raw upload
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const tabs = [
  { id: 'all', label: 'Tüm Proformalar', count: 0 },
  { id: 'draft', label: 'Taslaklar', count: 0 },
  { id: 'sent', label: 'Gönderilen', count: 0 },
  { id: 'accepted', label: 'Kabul Edilen', count: 0 }
]

const getTabCount = (tabId: string): number => {
  if (tabId === 'all') return allProformas.value.length
  return allProformas.value.filter(p => p.status === tabId).length
}

const blankItem = (): NewProformaItem => ({
  sku: '',
  description: '',
  quantity: 1,
  price: 0,
  imageUrl: null,
  imageSource: null,
})

const newProforma = ref<{
  templateType: 'LOCAL' | 'INTERNATIONAL'
  customer: string
  items: NewProformaItem[]
}>({
  templateType: 'LOCAL',
  customer: '',
  items: [blankItem()],
})

const allProformas = ref<any[]>([])
const dealers = ref<{ id: string; name: string; company: string; city: string; phone: string; cariNo: string }[]>([])

// Product search state for the autocomplete in the creation modal
const productSearchQuery = ref('')
const productSearchOpen = ref(false)
const productSearchLoading = ref(false)
const productSearchResults = ref<ProductSearchResult[]>([])
let productSearchTimer: ReturnType<typeof setTimeout> | null = null

const filteredProformas = computed(() => {
  return allProformas.value.filter(p => {
    const matchesSearch = !searchQuery.value ||
      p.proformaNumber.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      p.customerName.toLowerCase().includes(searchQuery.value.toLowerCase())

    const matchesStatus = !filterStatus.value || p.status === filterStatus.value

    const matchesTab = activeTab.value === 'all' || p.status === activeTab.value

    return matchesSearch && matchesStatus && matchesTab
  })
})

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

const statusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Taslak',
    sent: 'Gönderildi',
    accepted: 'Kabul Edildi'
  }
  return labels[status] || status
}

const calculateTotal = (): number => {
  return newProforma.value.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)
}

// Image handling --------------------------------------------------------------

/** Read a File into a data:image/...;base64 URI (browser-side, no upload roundtrip). */
const fileToDataUri = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Dosya okunamadı'))
    reader.readAsDataURL(file)
  })

/** Handle manual image upload for a specific item. Validates type + size. */
const handleImageUpload = async (item: NewProformaItem, event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  // Always clear the input so re-selecting the same file still triggers change
  target.value = ''

  if (!file) return

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    error.value = 'Sadece JPEG, PNG veya WebP görseller yüklenebilir'
    return
  }
  if (file.size > MAX_IMAGE_BYTES) {
    error.value = `Görsel çok büyük (max ${MAX_IMAGE_BYTES / 1024 / 1024} MB)`
    return
  }

  try {
    item.imageUrl = await fileToDataUri(file)
    item.imageSource = 'manual'
    error.value = null
  } catch (err: any) {
    error.value = err?.message || 'Görsel okunamadı'
  }
}

/** Auto-fetch product image from DB when SKU is committed (blur or Enter).
 *  Skipped when a manual upload is already in place — manual always wins. */
const onSkuCommit = async (item: NewProformaItem) => {
  const sku = item.sku?.trim()
  if (!sku) return
  if (item.imageSource === 'manual') return // honor manual override

  const product = await getProductImage(sku)
  if (product) {
    // Pre-fill description if empty
    if (!item.description) {
      item.description = product.name
    }
    if (product.imageUrl) {
      item.imageUrl = product.imageUrl
      item.imageSource = 'product'
    }
  }
}

/** Clear image for an item (drops manual upload, falls back to DB on next blur). */
const clearImage = (item: NewProformaItem) => {
  item.imageUrl = null
  item.imageSource = null
}

// Product search --------------------------------------------------------------

/** Debounced product search triggered by input */
watch(productSearchQuery, (q) => {
  if (productSearchTimer) clearTimeout(productSearchTimer)
  if (!q?.trim()) {
    productSearchResults.value = []
    productSearchOpen.value = false
    return
  }
  productSearchTimer = setTimeout(async () => {
    productSearchLoading.value = true
    productSearchOpen.value = true
    try {
      productSearchResults.value = await searchProducts(q, 10)
    } finally {
      productSearchLoading.value = false
    }
  }, 300)
})

/** Add a product from search results into the form items */
const addProductFromSearch = (product: ProductSearchResult) => {
  // Replace first empty row if it exists
  const emptyIdx = newProforma.value.items.findIndex((i) => !i.sku && !i.description)
  if (emptyIdx >= 0) {
    newProforma.value.items[emptyIdx] = {
      sku: product.sku,
      description: product.name,
      quantity: 1,
      price: product.basePrice,
      imageUrl: product.imageUrl,
      imageSource: product.imageUrl ? 'product' : null,
    }
  } else {
    newProforma.value.items.push({
      sku: product.sku,
      description: product.name,
      quantity: 1,
      price: product.basePrice,
      imageUrl: product.imageUrl,
      imageSource: product.imageUrl ? 'product' : null,
    })
  }
  productSearchQuery.value = ''
  productSearchOpen.value = false
}

// Load proformas and dealers on page mount
onMounted(async () => {
  await Promise.all([loadProformas(), loadDealers()])
})

const loadDealers = async () => {
  try {
    dealers.value = await getDealers()
  } catch (err: any) {
    console.error('Error loading dealers:', err)
  }
}

const loadProformas = async () => {
  loading.value = true
  error.value = null
  try {
    const data = await getProformas()
    allProformas.value = data || []
  } catch (err: any) {
    error.value = err.message || 'Proformalar yüklenemedi'
    console.error('Error loading proformas:', err)
  } finally {
    loading.value = false
  }
}

/** Strip UI-only fields (imageSource) before sending to API. */
const itemsForApi = () =>
  newProforma.value.items
    .filter((item) => item.sku && item.description)
    .map(({ sku, description, quantity, price, imageUrl }) => ({
      sku,
      description,
      quantity,
      price,
      imageUrl: imageUrl ?? undefined,
    }))

const createProformaHandler = async () => {
  loading.value = true
  error.value = null
  try {
    const items = itemsForApi()
    if (items.length === 0) {
      error.value = 'En az bir ürün eklemelisiniz'
      loading.value = false
      return
    }

    await createProforma({
      templateType: newProforma.value.templateType,
      customer: newProforma.value.customer,
      items,
    })

    // Reload list
    await loadProformas()
    showCreateForm.value = false

    // Reset form
    newProforma.value = {
      templateType: 'LOCAL',
      customer: '',
      items: [blankItem()],
    }

    toast.push('Proforma taslak olarak kaydedildi', 'success')
  } catch (err: any) {
    error.value = err.message || 'Proforma oluşturulamadı'
    console.error('Error creating proforma:', err)
  } finally {
    loading.value = false
  }
}

const createAndSendProformaHandler = async () => {
  loading.value = true
  error.value = null
  try {
    const items = itemsForApi()
    if (items.length === 0) {
      error.value = 'En az bir ürün eklemelisiniz'
      loading.value = false
      return
    }

    await createAndSendProforma({
      templateType: newProforma.value.templateType,
      customer: newProforma.value.customer,
      items,
    })

    // Reload list
    await loadProformas()
    showCreateForm.value = false

    // Reset form
    newProforma.value = {
      templateType: 'LOCAL',
      customer: '',
      items: [blankItem()],
    }

    toast.push('Proforma oluşturuldu ve gönderildi', 'success')
  } catch (err: any) {
    error.value = err.message || 'Proforma oluşturulamadı'
    console.error('Error creating and sending proforma:', err)
  } finally {
    loading.value = false
  }
}

const viewProforma = async (proforma: any) => {
  detailLoading.value = true
  showDetailModal.value = true
  pdfBlobUrl.value = null
  error.value = null

  try {
    // Fetch full proforma details with items
    const detail = await getProforma(proforma.id)
    selectedProforma.value = detail

    // Try to load PDF for preview
    try {
      const blob = await downloadProforma(proforma.id)
      pdfBlobUrl.value = URL.createObjectURL(blob)
    } catch {
      // PDF preview unavailable — user can still see details
      pdfBlobUrl.value = null
    }
  } catch (err: any) {
    error.value = 'Proforma detayları yüklenemedi'
    selectedProforma.value = proforma // fallback to list data
  } finally {
    detailLoading.value = false
  }
}

const closeDetailModal = () => {
  showDetailModal.value = false
  if (pdfBlobUrl.value) {
    URL.revokeObjectURL(pdfBlobUrl.value)
    pdfBlobUrl.value = null
  }
  selectedProforma.value = null
}

const editProforma = (proforma: any) => {
  console.log('Proforma düzenle:', proforma)
  toast.push('Düzenleme özelliği henüz eklenmedi', 'info')
}

const sendProformaHandler = async (id: string) => {
  loading.value = true
  error.value = null
  try {
    await sendProforma(id)
    await loadProformas()
    toast.push('Proforma müşteriye gönderildi', 'success')
  } catch (err: any) {
    error.value = err.message || 'Proforma gönderilemedi'
    console.error('Error sending proforma:', err)
  } finally {
    loading.value = false
  }
}

const downloadProformaHandler = async (id: string) => {
  loading.value = true
  error.value = null
  try {
    const blob = await downloadProforma(id)
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

const deleteProformaHandler = async (id: string) => {
  if (confirm('Bu proformayı silmek istediğinize emin misiniz?')) {
    loading.value = true
    error.value = null
    try {
      await deleteProforma(id)
      await loadProformas()
      toast.push('Proforma silindi', 'success')
    } catch (err: any) {
      error.value = err.message || 'Proforma silinemedi'
      console.error('Error deleting proforma:', err)
    } finally {
      loading.value = false
    }
  }
}
</script>

<style scoped>
button {
  transition: all 0.3s ease;
}
</style>
