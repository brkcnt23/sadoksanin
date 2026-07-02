<script setup lang="ts">
const activeTab = ref('overview')

const tabs = [
  { id: 'overview', label: 'Genel Bakış', icon: 'lucide:eye' },
  { id: 'modules', label: 'Modüller', icon: 'lucide:box' },
  { id: 'reports', label: 'Raporlama', icon: 'lucide:bar-chart-3' },
  { id: 'integration', label: 'Entegrasyon', icon: 'lucide:link' },
]
</script>

<template>
  <div class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
          <Icon name="lucide:building-2" class="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 class="text-lg font-bold text-white">Sadoksan ERP Sistemi</h2>
          <p class="text-xs text-slate-400">B2B İnşaat Malzemeleri Yönetim Sistemi — v1.0</p>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <div class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span class="text-xs text-slate-400">Tüm servisler çalışıyor</span>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex border-b border-slate-700/50 bg-slate-800/50 px-4">
      <button
        v-for="tab in tabs" :key="tab.id"
        @click="activeTab = tab.id"
        :class="[
          'px-4 py-3 text-sm font-medium transition-colors border-b-2 flex items-center gap-2',
          activeTab === tab.id
            ? 'text-white border-blue-500 bg-slate-800/50'
            : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-600',
        ]"
      >
        <Icon :name="tab.icon" class="w-4 h-4" />
        {{ tab.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="p-6">

      <!-- OVERVIEW -->
      <div v-if="activeTab === 'overview'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            <p class="text-2xl font-bold text-white">18</p>
            <p class="text-xs text-slate-400 mt-1">Aktif Modül</p>
          </div>
          <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            <p class="text-2xl font-bold text-white">6</p>
            <p class="text-xs text-slate-400 mt-1">Docker Servisi</p>
          </div>
          <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30">
            <p class="text-2xl font-bold text-white">35</p>
            <p class="text-xs text-slate-400 mt-1">Veritabanı Tablosu</p>
          </div>
        </div>

        <div class="space-y-4 text-sm text-slate-300 leading-relaxed">
          <p>
            Bu sistem, <span class="text-white font-medium">B2B inşaat malzemeleri tedarik zinciri</span> için özel olarak tasarlanmış
            entegre bir yönetim platformudur. Nuxt 4, NestJS 11 ve PostgreSQL 15 üzerine inşa edilmiştir.
            Tüm bileşenler Docker konteynerlerinde izole çalışır.
          </p>
          <p>
            Sistem üç ana rolde çalışır: <span class="text-amber-300">Admin</span> (fabrika yönetimi),
            <span class="text-blue-300">Bayi</span> (B2B müşteri paneli),
            <span class="text-green-300">Plasiyer</span> (saha satış temsilcisi).
            Her rolün erişim yetkileri RBAC ile katı şekilde ayrılmıştır.
          </p>
          <p>
            Bu panel (<code class="text-xs bg-slate-700 px-1.5 py-0.5 rounded">/sadoksan-panel</code>)
            fabrika operasyonlarının yönetildiği merkezdir. Ürün kataloğu, stok takibi, sipariş onay akışı,
            bayi yönetimi, fiyatlandırma, proforma onayı ve raporlama buradan yürütülür.
          </p>
        </div>
      </div>

      <!-- MODULES -->
      <div v-if="activeTab === 'modules'" class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div v-for="m in modules" :key="m.name" class="flex items-start gap-3 bg-slate-800/30 rounded-lg p-3 border border-slate-700/20">
          <div :class="['w-8 h-8 rounded-lg flex items-center justify-center shrink-0', m.color]">
            <Icon :name="m.icon" class="w-4 h-4 text-white" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-white">{{ m.name }}</p>
              <span v-if="m.status === 'ready'" class="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Aktif" />
              <span v-else-if="m.status === 'pending'" class="w-1.5 h-1.5 rounded-full bg-amber-400" title="Hazır, entegrasyon bekleniyor" />
              <span v-else class="w-1.5 h-1.5 rounded-full bg-slate-500" title="Planlandı" />
            </div>
            <p class="text-xs text-slate-400 mt-0.5">{{ m.desc }}</p>
          </div>
        </div>
      </div>

      <!-- REPORTS -->
      <div v-if="activeTab === 'reports'" class="space-y-4">
        <p class="text-sm text-slate-300">
          Sistemde <span class="text-white font-medium">8 canlı rapor</span> bulunmaktadır. Tüm raporlar
          gerçek zamanlı veritabanı sorgularıyla oluşturulur, CSV olarak dışa aktarılabilir.
          Tarih aralığı filtresi tüm raporlarda ortaktır.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div v-for="r in reportList" :key="r.name" class="flex items-center gap-2 bg-slate-800/30 rounded-lg px-3 py-2 text-xs">
            <Icon :name="r.icon" class="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span class="text-slate-300">{{ r.name }}</span>
            <span class="text-slate-500 ml-auto">{{ r.formula }}</span>
          </div>
        </div>
      </div>

      <!-- INTEGRATION -->
      <div v-if="activeTab === 'integration'" class="space-y-4">
        <p class="text-sm text-slate-300">
          Sistem dış servislerle entegrasyona hazırdır. Her entegrasyon modülü kodu yazılmış olup,
          ilgili API bilgileri girildiğinde aktif hale gelir.
        </p>
        <div class="space-y-2">
          <div v-for="i in integrations" :key="i.name" class="flex items-center justify-between bg-slate-800/30 rounded-lg px-4 py-3">
            <div class="flex items-center gap-3">
              <Icon :name="i.icon" class="w-5 h-5" :class="i.ready ? 'text-emerald-400' : 'text-slate-500'" />
              <div>
                <p class="text-sm font-medium text-white">{{ i.name }}</p>
                <p class="text-xs text-slate-400">{{ i.desc }}</p>
              </div>
            </div>
            <span :class="['text-xs px-2 py-0.5 rounded-full font-medium',
              i.ready ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
              'bg-amber-500/10 text-amber-400 border border-amber-500/20']">
              {{ i.ready ? 'Kod Hazır' : 'API Bekleniyor' }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script lang="ts">
const modules = [
  { name: 'Ürün Yönetimi', desc: 'CRUD, varyant, kategori ağacı, marka, Excel import/export, 285 ürün', icon: 'lucide:boxes', color: 'bg-blue-600', status: 'ready' },
  { name: 'Stok Takibi', desc: 'Netsis stok + rezervasyon + display stok, manuel giriş/çıkış, hareket logu', icon: 'lucide:warehouse', color: 'bg-amber-600', status: 'ready' },
  { name: 'Sipariş Yönetimi', desc: 'Tam yaşam döngüsü: onay → hazırlık → sevk → tamamlanma, kredi limit kontrolü', icon: 'lucide:package', color: 'bg-emerald-600', status: 'ready' },
  { name: 'Bayi Yönetimi', desc: 'Profil, cari hesap, risk skoru, kredi limiti, onay akışı', icon: 'lucide:users', color: 'bg-indigo-600', status: 'ready' },
  { name: 'Plasiyer Sistemi', desc: 'Proforma oluşturma, onay akışı, PDF indirme, performans raporları', icon: 'lucide:briefcase', color: 'bg-green-600', status: 'ready' },
  { name: 'Proforma Motoru', desc: 'Python Flask + ReportLab PDF, uluslararası/yerel şablon, görsel gömme', icon: 'lucide:file-text', color: 'bg-orange-600', status: 'ready' },
  { name: 'Fiyatlandırma', desc: '5 katmanlı: override → grup iskontosu → indirim → bölgesel → liste fiyatı', icon: 'lucide:wallet', color: 'bg-purple-600', status: 'ready' },
  { name: 'Raporlama', desc: '8 canlı rapor: satış, pipeline, risk, stok, kredi, plasiyer performans', icon: 'lucide:bar-chart-3', color: 'bg-cyan-600', status: 'ready' },
  { name: 'Denetim Logu', desc: 'Tüm kritik işlemler kayıt altında, immutable, filtrelenebilir', icon: 'lucide:scroll-text', color: 'bg-slate-600', status: 'ready' },
  { name: 'CMS & İçerik', desc: 'Kurumsal sayfalar, site ayarları, bakım modu, SEO meta', icon: 'lucide:globe', color: 'bg-teal-600', status: 'ready' },
  { name: 'İndirim & Promosyon', desc: 'Ürün/kategori/marka bazlı indirim, promo kod validasyonu', icon: 'lucide:percent', color: 'bg-rose-600', status: 'ready' },
  { name: 'Popup & Kampanya', desc: 'Hedef kitle bazlı kampanya popupları, gösterim/tıklama takibi', icon: 'lucide:megaphone', color: 'bg-pink-600', status: 'ready' },
  { name: 'Döviz Kurları', desc: 'TCMB/manuel kur takibi, ürün bazında çoklu para birimi fiyatlandırma', icon: 'lucide:coins', color: 'bg-yellow-600', status: 'ready' },
  { name: 'Netsis ERP', desc: 'NetOpenX REST: OAuth2, ürün/stok/cari sync, 8 endpoint hazır', icon: 'lucide:database', color: 'bg-red-600', status: 'pending' },
  { name: 'Alneo E-Fatura', desc: 'E-fatura, e-arşiv, e-irsaliye entegrasyonu', icon: 'lucide:file-check', color: 'bg-gray-600', status: 'pending' },
  { name: 'Ödeme Entegrasyonu', desc: 'Sanal POS (iyzico/PayTR) ve havale/EFT onay sistemi', icon: 'lucide:banknote', color: 'bg-lime-600', status: 'partial' },
  { name: 'E-posta Bildirim', desc: 'Sipariş durumu, şifre sıfırlama, bayi onay — SMTP hazır', icon: 'lucide:mail', color: 'bg-sky-600', status: 'ready' },
  { name: 'Favori & Stok Habercisi', desc: 'Favori ürün listesi, stok gelince WhatsApp bildirimi', icon: 'lucide:heart', color: 'bg-red-500', status: 'ready' },
]

const reportList = [
  { name: 'Plasiyer Satış Raporu', icon: 'lucide:user-check', formula: 'SUM(onaylı proforma tutarı) / COUNT' },
  { name: 'Sipariş Pipeline', icon: 'lucide:bar-chart-3', formula: 'COUNT + SUM(status bazında gruplu)' },
  { name: 'Bayi Risk Skoru', icon: 'lucide:shield-alert', formula: 'Kredi%×40 + İptal%×30 + Gün×0.5' },
  { name: 'Kritik Stok', icon: 'lucide:package-warning', formula: 'displayStock ≤ minimumStock' },
  { name: 'Hareketsiz Stok', icon: 'lucide:package-x', formula: 'Son satıştan bugüne geçen gün' },
  { name: 'Kredi Limiti Kullanımı', icon: 'lucide:credit-card', formula: '(cariBalance / creditLimit) × 100' },
  { name: 'Plasiyer Dashboard', icon: 'lucide:layout-dashboard', formula: 'Dönüşüm = Onaylı / Toplam Proforma' },
  { name: 'Plasiyer Listesi', icon: 'lucide:users', formula: 'PLASIYER rolü + proforma sayıları' },
]

const integrations = [
  { name: 'Netsis ERP', desc: 'NetOpenX REST API — ürün, stok, cari hesap senkronizasyonu', icon: 'lucide:database', ready: true },
  { name: 'Alneo E-Fatura', desc: 'E-fatura, e-arşiv, e-irsaliye — sipariş tamamlanınca otomatik kesim', icon: 'lucide:file-check', ready: false },
  { name: 'Canmail SMTP', desc: 'E-posta bildirimleri — şifre sıfırlama, sipariş durumu, bayi onayı', icon: 'lucide:mail', ready: true },
  { name: 'Sanal POS', desc: 'iyzico / PayTR — kredi kartı ile online ödeme', icon: 'lucide:banknote', ready: false },
  { name: 'WhatsApp Business', desc: 'Stok habercisi, sipariş bildirimi, proforma paylaşımı', icon: 'lucide:message-circle', ready: false },
]
</script>
