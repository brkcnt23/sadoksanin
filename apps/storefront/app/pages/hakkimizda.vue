<script setup lang="ts">
definePageMeta({
  title: 'Hakkımızda | SADÖKSAN İnşaat',
  description: 'SADÖKSAN İnşaat Malzemeleri — 23 yıllık deneyim, güvenilir hizmet ve kaliteli ürünler.',
})

const stats = [
  {
    label: 'Yıllık Tecrübe',
    value: '23+',
    icon: 'lucide:calendar',
  },
  {
    label: 'Memnun Müşteri',
    value: '5000+',
    icon: 'lucide:users',
  },
  {
    label: 'Ürün Çeşidi',
    value: '4000+',
    icon: 'lucide:package',
  },
  {
    label: 'Bayi Sayısı',
    value: '300+',
    icon: 'lucide:store',
  },
]

const values = [
  {
    title: 'Dürüstlük',
    description: 'Müşterilerimize karşı her daim dürüst ve şeffaf bir yaklaşım benimsiyoruz.',
    icon: 'lucide:handshake',
  },
  {
    title: 'Kalite',
    description: 'Dünya standartlarındaki ürünleri hassasiyetle seçerek sunuyoruz.',
    icon: 'lucide:award',
  },
  {
    title: 'Hız',
    description: 'Siparişlerinizi hızlı ve güvenli şekilde teslimat ederiz.',
    icon: 'lucide:zap',
  },
  {
    title: 'Empati',
    description: 'Müşteri memnuniyeti bizim en temel amacı ve ilkemizdir.',
    icon: 'lucide:heart',
  },
  {
    title: 'Gelişim',
    description: 'Sektördeki yenilikleri takip ederek hizmetlerimizi geliştiririz.',
    icon: 'lucide:trending-up',
  },
  {
    title: 'Güven',
    description: 'Uzun yıllar boyunca kazandığımız itibarın dayandığı temeldir.',
    icon: 'lucide:shield',
  },
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white">
    <!-- Hero Section -->
    <section class="relative py-20 lg:py-28 bg-gradient-to-r from-primary-900 via-primary-800 to-accent-600 overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 -left-40 w-80 h-80 bg-white rounded-full blur-3xl" />
        <div class="absolute bottom-0 -right-40 w-80 h-80 bg-white rounded-full blur-3xl" />
      </div>

      <div class="relative px-6 lg:px-12 mx-auto max-w-5xl">
        <h1 class="text-5xl lg:text-6xl font-bold text-white mb-6">
          Hakkımızda
        </h1>
        <p class="text-xl text-white/80 max-w-2xl">
          SADÖKSAN İnşaat Malzemeleri — Doğu Anadolu'nun en güvenilir inşaat malzemeleri tedarikçisi
        </p>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="py-12 lg:py-16 -mt-8 relative z-10">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            v-for="(stat, index) in stats"
            :key="index"
            class="bg-white rounded-xl p-6 shadow-lg text-center hover:shadow-2xl transition-all hover:-translate-y-1"
          >
            <div class="inline-flex items-center justify-center w-12 h-12 bg-accent-100 rounded-lg mb-4">
              <Icon :name="stat.icon" class="w-6 h-6 text-accent-600" />
            </div>
            <div class="text-3xl lg:text-4xl font-bold text-primary-900 mb-2">
              {{ stat.value }}
            </div>
            <p class="text-sm lg:text-base text-ink-600">{{ stat.label }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <div class="prose prose-lg max-w-none">
          <!-- Intro -->
          <div class="mb-12 p-8 bg-primary-50 rounded-2xl border-l-4 border-accent-600">
            <p class="text-lg text-primary-900 font-semibold leading-relaxed">
              SADÖKSAN İnşaat Malzemeleri, 19 Temmuz 2000 yılında kurularak başladığımız girişimcilik serüvenini, toptancılık ve e-ticaret ile güçlendirmiş bir kuruluştur. Sunduğumuz kullanıcı öncelikli stratejilerimiz ve ayrıcalıklı müşteri portföyü ile değerini paha biçilemez şekilde ikiye katlayarak, marka değerimizi hassasiyetle zirveye taşımayı başardık.
            </p>
          </div>

          <!-- Main Text -->
          <div class="space-y-6 text-ink-700 leading-relaxed">
            <p>
              Dünya standartlarını göz önünde bulundurarak çözüm ve güven içerikli ilkemiz ile yola çıktığımız bu serüvende; otorite rayından çıkmayarak, istikrarlı şekilde sayısız müşteriyle bulunduğumuz ticaret alanında <strong>Doğu Anadolu'nun en iyi ve en kaliteli marka sahipliğini</strong> yapmış durumdayız.
            </p>

            <p>
              Kuruluşundan günümüze süregelen <strong>profesyonellik, empati odaklı yaklaşım, dürüstlük ve gelişime açık bakış açımız</strong> ile istikrarlı büyüme sergileyerek, ticaret dünyasında saygın bir konuma yükselmeye hak kazandık. Markamız; inşaat malzemesi sektörü alanında en kaliteli ürünleri, tüketiciye en uygun fiyat ile sunma amacıyla kurulmuş olup, geride bıraktığımız 23 yıl boyunca da, sektörde yaklaşımımızı aynı titizlik dâhilinde korumaya devam etmekteyiz.
            </p>

            <div class="bg-accent-50 p-6 rounded-lg border-l-4 border-accent-600 my-8">
              <h3 class="font-bold text-lg text-primary-900 mb-3">Müşteri Memnuniyeti Taahhüdü</h3>
              <p>
                Markamız üzerinden gerçekleştirdiğiniz tüm alışverişlerinizde; <strong>mağduriyet içermeyen, hızlı teslimat, iptal/iade/değişim bilinci</strong> ile yaklaşımını sağlayan personel kadromuz ile en keyifli ticaret deneyimini yaşamayı mümkün kılıyoruz.
              </p>
            </div>

            <p>
              Sektördeki son gelişmeleri ve kullanıcı alanındaki güncel talepleri takip ederek, çağdaş düzeydeki teknolojiyle buluşturduğumuz web adresimiz (sadoksaninsaat.com.tr) üzerinden, en iyi ekip arkadaşlarımız ve güçlü profesyonel idari yönetimimiz ile takibini gerçekleştirerek, tüketici haklarını en iyi şekilde yaşamanızı sağlıyoruz.
            </p>
          </div>

          <!-- Mission -->
          <div class="mt-12 p-8 bg-gradient-to-r from-primary-900 to-primary-800 rounded-2xl text-white">
            <h3 class="text-2xl font-bold mb-4">Hedefimiz</h3>
            <p class="text-white/90 leading-relaxed">
              Kullanıcı deneyimi ile e-ticaret camiasında <strong>"ziyaretçi memnuniyeti en yüksek"</strong> konumuna ulaşarak, halkın takdirini kazanmak ve sitemizden sorunsuz, mutlu tüketici konumunda ayrılmanızı sağlamak.
            </p>
          </div>

          <!-- Vision -->
          <div class="mt-8 p-8 bg-gradient-to-r from-accent-600 to-accent-700 rounded-2xl text-white">
            <h3 class="text-2xl font-bold mb-4">Vizyonumuz</h3>
            <p class="text-white/90 leading-relaxed">
              Örnek nitelikle misyonunu genişleterek, projelerini hayata geçirmeye devam eden markamız, standartların üstünde kaliteyle öncülük ederek, birçok memnuniyet beraberinde başarılı işlere imzasını atarak başarısına başarı katacak, güçlü kadro dâhilinde sorun odaklı çalışma prensibi ile organizasyonel şekilde sizin memnuniyetinizi sağlamaya devam edecektir.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Values Section -->
    <section class="py-16 lg:py-20 bg-white/50">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <h2 class="text-4xl font-bold text-primary-900 mb-4 text-center">
          Değerlerimiz
        </h2>
        <p class="text-center text-ink-600 mb-12 text-lg max-w-3xl mx-auto">
          SADÖKSAN İnşaat Malzemeleri, bu ilkeler üzerine kurulmuş ve geliştirilmiştir
        </p>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div
            v-for="(value, index) in values"
            :key="index"
            class="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2"
          >
            <div class="inline-flex items-center justify-center w-14 h-14 bg-accent-100 rounded-lg mb-6">
              <Icon :name="value.icon" class="w-7 h-7 text-accent-600" />
            </div>
            <h3 class="text-xl font-bold text-primary-900 mb-3">
              {{ value.title }}
            </h3>
            <p class="text-ink-600 leading-relaxed">
              {{ value.description }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 lg:py-20">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <div class="bg-gradient-to-r from-primary-900 to-accent-600 rounded-2xl p-8 lg:p-12 text-center max-w-3xl mx-auto">
          <h2 class="text-3xl lg:text-4xl font-bold text-white mb-4">
            Bu Serüvene Katılın
          </h2>
          <p class="text-white/80 text-lg mb-8">
            SADÖKSAN İnşaat Malzemeleri'nden tüm ihtiyaçlarınız için güvenilir ve kaliteli çözümler alın.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <NuxtLink
              to="/"
              class="inline-flex items-center justify-center gap-2 bg-white text-primary-900 px-8 py-3 rounded-lg font-bold hover:bg-accent-50 transition-colors"
            >
              <Icon name="lucide:shopping-bag" class="w-5 h-5" />
              Ürünlerimizi Keşfedin
            </NuxtLink>
            <NuxtLink
              to="/magaza"
              class="inline-flex items-center justify-center gap-2 bg-accent-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-accent-600 transition-colors"
            >
              <Icon name="lucide:map-pin" class="w-5 h-5" />
              Mağazamızı Ziyaret Edin
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
