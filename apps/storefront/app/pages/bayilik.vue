<script setup lang="ts">
import type SiteDotLogo from '../components/site/DotLogo.vue'

definePageMeta({
  title: 'Bayi Programı | SADÖKSAN İnşaat',
  description: 'Distribütör ağımıza katılın. Bayi olmak için şartlar ve avantajlar',
})

const heroRef = ref<HTMLElement>()
const dotLogoRef = ref<InstanceType<typeof SiteDotLogo>>()

function onMouseMove(e: MouseEvent) {
  dotLogoRef.value?.setMouse(e.clientX, e.clientY)
}

function onMouseLeave() {
  dotLogoRef.value?.clearMouse()
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white">
    <!-- Hero Section -->
    <section
      ref="heroRef"
      class="relative overflow-hidden bg-primary-950 text-white py-20 lg:py-28"
      @mousemove="onMouseMove"
      @mouseleave="onMouseLeave"
    >
      <!-- Background -->
      <div class="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=2000&q=85"
          alt=""
          class="h-full w-full object-cover opacity-40"
        />
        <div class="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-950/85 to-primary-950/40" />
      </div>

      <!-- Dot logo -->
      <div class="absolute inset-0 pointer-events-none block opacity-25 sm:opacity-30 lg:opacity-30">
        <SiteDotLogo ref="dotLogoRef" :ambient="true" />
      </div>

      <div class="relative px-6 lg:px-12 mx-auto max-w-5xl text-center">
        <h1 class="text-4xl lg:text-6xl font-bold text-white mb-6">
          Distribütör Ağımıza Katılın
        </h1>
        <p class="text-white/80 text-lg lg:text-xl max-w-2xl mx-auto">
          Türkiye'nin en güvenilir banyo, sıhhi tesisat ve yapı malzemeleri dağıtıcısı olarak, biz de başarılı bayilerimiz ile büyüyoruz.
        </p>
      </div>
    </section>

    <!-- Why Become a Dealer -->
    <section class="py-16 lg:py-24">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <h2 class="text-3xl lg:text-4xl font-bold text-primary-900 text-center mb-4">
          Bayi Olmak Neden Avantajlı?
        </h2>
        <p class="text-ink-600 text-center mb-12 text-lg">
          30 yıllık deneyim ve 300+ bayi ağı ile destekliyoruz
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Card 1 -->
          <div class="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
            <div class="h-12 w-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="lucide:percent" class="h-6 w-6 text-accent-600" />
            </div>
            <h3 class="text-xl font-bold text-primary-900 mb-3">Rekabetçi Fiyatlandırma</h3>
            <p class="text-ink-600 leading-relaxed">
              Hacimsel satın alım avantajı ile rekabetçi bayi fiyatlarından yararlanın. Bölgesel fiyat destekleri ve dönemsel kampanyalar.
            </p>
          </div>

          <!-- Card 2 -->
          <div class="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
            <div class="h-12 w-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="lucide:truck" class="h-6 w-6 text-accent-600" />
            </div>
            <h3 class="text-xl font-bold text-primary-900 mb-3">Hızlı Lojistik Destek</h3>
            <p class="text-ink-600 leading-relaxed">
              Erzurum merkezli depo ile hızlı teslimat. Türkiye geneli kargo anlaşmaları ve bölgesel lojistik desteği.
            </p>
          </div>

          <!-- Card 3 -->
          <div class="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
            <div class="h-12 w-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="lucide:headphones" class="h-6 w-6 text-accent-600" />
            </div>
            <h3 class="text-xl font-bold text-primary-900 mb-3">Teknik & Satış Destek</h3>
            <p class="text-ink-600 leading-relaxed">
              Deneyimli satış temsilcileri, ürün eğitimleri ve bayi forumları. Başarınız için adanmış destek ekibi.
            </p>
          </div>

          <!-- Card 4 -->
          <div class="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
            <div class="h-12 w-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="lucide:target" class="h-6 w-6 text-accent-600" />
            </div>
            <h3 class="text-xl font-bold text-primary-900 mb-3">Pazarlama Materyalleri</h3>
            <p class="text-ink-600 leading-relaxed">
              Kataloglar, dijital assetler, ve promosyon materyalleri. Ürün tanıtım kampanyalarında ortaklık fırsatları.
            </p>
          </div>

          <!-- Card 5 -->
          <div class="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
            <div class="h-12 w-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="lucide:trending-up" class="h-6 w-6 text-accent-600" />
            </div>
            <h3 class="text-xl font-bold text-primary-900 mb-3">Büyüme Fırsatları</h3>
            <p class="text-ink-600 leading-relaxed">
              Yeni ürün kategorilerine erken erişim. Eksklusif ve sınırlı stok ürünlerde öncelik.
            </p>
          </div>

          <!-- Card 6 -->
          <div class="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow">
            <div class="h-12 w-12 bg-accent-100 rounded-lg flex items-center justify-center mb-4">
              <Icon name="lucide:shield-check" class="h-6 w-6 text-accent-600" />
            </div>
            <h3 class="text-xl font-bold text-primary-900 mb-3">Garantili Ürün Kalitesi</h3>
            <p class="text-ink-600 leading-relaxed">
              Tüm ürünlerde orijinallik garantisi. Kusurlu veya hatalı ürünlerde anında değişim.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Requirements Section -->
    <section class="py-16 lg:py-24 bg-gradient-to-r from-primary-50 to-accent-50">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <h2 class="text-3xl lg:text-4xl font-bold text-primary-900 text-center mb-4">
          Bayi Olmak İçin Şartlar
        </h2>

        <div class="max-w-3xl mx-auto space-y-6 mt-12">
          <!-- Requirement 1 -->
          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <div class="flex items-center justify-center h-8 w-8 rounded-full bg-accent-500 text-white font-bold text-sm">
                1
              </div>
            </div>
            <div>
              <h3 class="text-lg font-bold text-primary-900 mb-2">Aktif Ticari İşletme</h3>
              <p class="text-ink-600">
                Türkiye'de kayıtlı ve aktif olarak faaliyet gösteren inşaat malzemeleri, banyo, tesisat veya ilgili alan ticari işletmesi olmalıdır.
              </p>
            </div>
          </div>

          <!-- Requirement 2 -->
          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <div class="flex items-center justify-center h-8 w-8 rounded-full bg-accent-500 text-white font-bold text-sm">
                2
              </div>
            </div>
            <div>
              <h3 class="text-lg font-bold text-primary-900 mb-2">Uygun Depolama & Satış Alanı</h3>
              <p class="text-ink-600">
                Ürünleri depolayabileceği ve satıyabileceği uygun bir fiziki mekan veya satış noktası olmalıdır.
              </p>
            </div>
          </div>

          <!-- Requirement 3 -->
          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <div class="flex items-center justify-center h-8 w-8 rounded-full bg-accent-500 text-white font-bold text-sm">
                3
              </div>
            </div>
            <div>
              <h3 class="text-lg font-bold text-primary-900 mb-2">Minimum Sipariş Kapasitesi</h3>
              <p class="text-ink-600">
                Bölgeye göre değişen minimum siparişi karşılayabilecek finansal kapasiteye sahip olmalıdır.
              </p>
            </div>
          </div>

          <!-- Requirement 4 -->
          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <div class="flex items-center justify-center h-8 w-8 rounded-full bg-accent-500 text-white font-bold text-sm">
                4
              </div>
            </div>
            <div>
              <h3 class="text-lg font-bold text-primary-900 mb-2">Ödeme Disiplini</h3>
              <p class="text-ink-600">
                Belirlenen ödeme şartlarına uyma konusunda güvenilirlik ve disiplin gösterebilmesi beklenir.
              </p>
            </div>
          </div>

          <!-- Requirement 5 -->
          <div class="flex gap-4">
            <div class="flex-shrink-0">
              <div class="flex items-center justify-center h-8 w-8 rounded-full bg-accent-500 text-white font-bold text-sm">
                5
              </div>
            </div>
            <div>
              <h3 class="text-lg font-bold text-primary-900 mb-2">Müşteri Hizmetleri Standartları</h3>
              <p class="text-ink-600">
                Sadöksan İnşaat'ın marka değerini yansıtacak şekilde müşterilerine hizmet vermesi beklenir.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-16 lg:py-24">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Stat 1 -->
          <div class="text-center">
            <div class="text-4xl lg:text-5xl font-bold text-accent-500 mb-2">300+</div>
            <p class="text-ink-600 font-semibold">Aktif Bayi</p>
            <p class="text-sm text-ink-500 mt-1">Türkiye genelinde</p>
          </div>

          <!-- Stat 2 -->
          <div class="text-center">
            <div class="text-4xl lg:text-5xl font-bold text-accent-500 mb-2">30+</div>
            <p class="text-ink-600 font-semibold">Yıl Deneyim</p>
            <p class="text-sm text-ink-500 mt-1">Sektöre adanmış</p>
          </div>

          <!-- Stat 3 -->
          <div class="text-center">
            <div class="text-4xl lg:text-5xl font-bold text-accent-500 mb-2">4000+</div>
            <p class="text-ink-600 font-semibold">Ürün Çeşidi</p>
            <p class="text-sm text-ink-500 mt-1">Tüm kategorilerde</p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 lg:py-24 bg-gradient-to-r from-primary-900 via-primary-800 to-accent-600">
      <div class="px-6 lg:px-12 mx-auto max-w-3xl text-center">
        <h2 class="text-3xl lg:text-4xl font-bold text-white mb-6">
          Başvuruya Hazır Mısınız?
        </h2>
        <p class="text-white/80 text-lg mb-8">
          Hemen kayıt olun veya mevcut hesabınız varsa giriş yapın.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <NuxtLink
            to="/bayilik/uye-ol"
            class="px-8 py-4 bg-accent-500 hover:bg-accent-600 text-white font-bold rounded-lg transition-colors text-center"
          >
            Yeni Bayi Olmak İstiyorum
          </NuxtLink>
          <NuxtLink
            to="/bayilik/giris"
            class="px-8 py-4 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition-colors border border-white/30 text-center"
          >
            Zaten Bayiyim - Giriş Yap
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Contact Section -->
    <section class="py-16 lg:py-24">
      <div class="px-6 lg:px-12 mx-auto max-w-3xl">
        <div class="bg-gradient-to-br from-accent-50 to-primary-50 rounded-xl p-8 lg:p-12 border border-accent-200">
          <h2 class="text-2xl font-bold text-primary-900 mb-6 text-center">
            Sorularınız mı var?
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="flex gap-3">
              <Icon name="lucide:phone" class="h-6 w-6 text-accent-600 flex-shrink-0 mt-1" />
              <div>
                <p class="font-semibold text-primary-900">Telefon</p>
                <a href="tel:+904422424259" class="text-accent-600 hover:text-accent-700">
                  0442 242 42 59
                </a>
              </div>
            </div>

            <div class="flex gap-3">
              <Icon name="lucide:message-circle" class="h-6 w-6 text-accent-600 flex-shrink-0 mt-1" />
              <div>
                <p class="font-semibold text-primary-900">WhatsApp</p>
                <a href="https://wa.me/905396541720" target="_blank" rel="noopener" class="text-accent-600 hover:text-accent-700">
                  0539 654 17 20
                </a>
              </div>
            </div>

            <div class="flex gap-3">
              <Icon name="lucide:mail" class="h-6 w-6 text-accent-600 flex-shrink-0 mt-1" />
              <div>
                <p class="font-semibold text-primary-900">E-posta</p>
                <a href="mailto:info@sadoksaninsaat.com.tr" class="text-accent-600 hover:text-accent-700">
                  info@sadoksaninsaat.com.tr
                </a>
              </div>
            </div>

            <div class="flex gap-3">
              <Icon name="lucide:map-pin" class="h-6 w-6 text-accent-600 flex-shrink-0 mt-1" />
              <div>
                <p class="font-semibold text-primary-900">Adres</p>
                <p class="text-ink-600 text-sm">
                  Kazım Karabekir Paşa Mah.<br />
                  Demirciler Cad. No: 10<br />
                  Yakutiye / Erzurum
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
