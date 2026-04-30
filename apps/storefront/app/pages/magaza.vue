<script setup lang="ts">
definePageMeta({
  title: 'Mağazamız | SADÖKSAN İnşaat',
  description: 'SADÖKSAN İnşaat Malzemeleri mağazası, showroom ve ürün ekibi hakkında bilgi edinin.',
})

const currentImageIndex = ref(0)

const images = [
  { label: 'Mağaza Vitrini', src: '/magazagorsel1.jpeg', bg: 'from-blue-400 to-blue-600' },
  { label: 'İç Dekorasyon', src: '/magazagorsel2.jpeg', bg: 'from-purple-400 to-purple-600' },
  { label: 'Ürün Alanı', src: '/magazagorsel3.jpeg', bg: 'from-indigo-400 to-indigo-600' },
]

const currentImage = computed(() => images[currentImageIndex.value])

const nextImage = () => {
  currentImageIndex.value = (currentImageIndex.value + 1) % images.length
}

const prevImage = () => {
  currentImageIndex.value = (currentImageIndex.value - 1 + images.length) % images.length
}

// Auto-advance images every 5 seconds
onMounted(() => {
  const interval = setInterval(() => {
    nextImage()
  }, 5000)

  onUnmounted(() => clearInterval(interval))
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white">
    <!-- Hero Section -->
    <section class="relative h-96 bg-gradient-to-r from-primary-900 via-primary-800 to-accent-600 overflow-hidden">
      <div class="absolute inset-0 opacity-10">
        <div class="absolute top-0 -left-40 w-80 h-80 bg-white rounded-full blur-3xl" />
        <div class="absolute bottom-0 -right-40 w-80 h-80 bg-white rounded-full blur-3xl" />
      </div>

      <div class="relative h-full flex items-center justify-center px-6 lg:px-12">
        <div class="text-center max-w-4xl">
          <h1 class="text-5xl lg:text-6xl font-bold text-white mb-4">
            Mağazamız
          </h1>
          <p class="text-xl text-white/80">
            SADÖKSAN İnşaat Malzemeleri — Doğu Anadolu'nun En Güvenilir Adı
          </p>
        </div>
      </div>
    </section>

    <!-- Image Carousel -->
    <section class="py-12 lg:py-16">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <div class="relative bg-white rounded-2xl shadow-2xl overflow-hidden group">
          <!-- Main Slide -->
          <div class="relative h-96 lg:h-[500px] overflow-hidden">
            <Transition
              name="fade"
              mode="out-in"
            >
              <img
                v-if="currentImage?.src"
                :key="currentImageIndex"
                :src="currentImage.src"
                :alt="currentImage.label"
                class="w-full h-full object-cover"
              />
            </Transition>

            <!-- Counter Badge -->
            <div class="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
              {{ currentImageIndex + 1 }} / {{ images.length }}
            </div>
          </div>

          <!-- Navigation Buttons -->
          <button
            @click="prevImage"
            class="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-primary-900 p-3 rounded-full shadow-lg transition-all hover:scale-110"
            aria-label="Önceki resim"
          >
            <Icon name="lucide:chevron-left" class="w-6 h-6" />
          </button>
          <button
            @click="nextImage"
            class="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white text-primary-900 p-3 rounded-full shadow-lg transition-all hover:scale-110"
            aria-label="Sonraki resim"
          >
            <Icon name="lucide:chevron-right" class="w-6 h-6" />
          </button>

          <!-- Thumbnail Navigation -->
          <div class="flex gap-3 p-4 bg-gradient-to-r from-primary-900/5 to-accent-600/5">
            <button
              v-for="(image, index) in images"
              :key="index"
              @click="currentImageIndex = index"
              :class="[
                'relative flex-1 h-20 rounded-lg border-2 transition-all',
                `bg-gradient-to-br ${image.bg}`,
                currentImageIndex === index
                  ? 'border-accent-500 shadow-lg'
                  : 'border-primary-200 opacity-60 hover:opacity-80'
              ]"
            >
              <span class="text-xs font-bold text-white/80">{{ image.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Store Info Grid -->
    <section class="py-16 lg:py-20 bg-white/50">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <h2 class="text-4xl font-bold text-primary-900 mb-12 text-center">
          Neden SADÖKSAN?
        </h2>

        <div class="grid md:grid-cols-3 gap-8">
          <!-- Card 1 -->
          <div class="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
            <div class="w-16 h-16 bg-accent-100 rounded-lg flex items-center justify-center mb-6">
              <Icon name="lucide:award" class="w-8 h-8 text-accent-600" />
            </div>
            <h3 class="text-xl font-bold text-primary-900 mb-3">
              23 Yıllık Tecrübe
            </h3>
            <p class="text-ink-600 leading-relaxed">
              1999'dan beri inşaat malzemeleri sektöründe güvenilir hizmet sunuyoruz. Doğu Anadolu'nun en kaliteli marka olma unvanını taşıyoruz.
            </p>
          </div>

          <!-- Card 2 -->
          <div class="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
            <div class="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center mb-6">
              <Icon name="lucide:package-check" class="w-8 h-8 text-primary-600" />
            </div>
            <h3 class="text-xl font-bold text-primary-900 mb-3">
              Kaliteli Ürünler
            </h3>
            <p class="text-ink-600 leading-relaxed">
              Dünya standartlarındaki inşaat malzemeleri ve aksesuarları en uygun fiyatlarla sunuyoruz. Her ürün kalite kontrolünden geçer.
            </p>
          </div>

          <!-- Card 3 -->
          <div class="bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2">
            <div class="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Icon name="lucide:truck" class="w-8 h-8 text-blue-600" />
            </div>
            <h3 class="text-xl font-bold text-primary-900 mb-3">
              Hızlı Teslimat
            </h3>
            <p class="text-ink-600 leading-relaxed">
              Sipariş aldığımız ürünleri hızlı ve güvenli şekilde teslim ediyoruz. İade, değişim ve iade işlemlerimiz sorunsuz gerçekleşir.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Contact CTA -->
    <section class="py-16 lg:py-20">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <div class="bg-gradient-to-r from-primary-900 to-accent-600 rounded-2xl p-8 lg:p-12 text-center max-w-3xl mx-auto">
          <h2 class="text-3xl lg:text-4xl font-bold text-white mb-4">
            Bize Ziyaret Edin
          </h2>
          <p class="text-white/80 text-lg mb-8">
            Mağazamızda yüz yüze hizmet almak için bize uğrayabilir, ürünlerimizi görebilir ve uzman ekibimiz ile danışabilirsiniz.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+904422424259"
              class="inline-flex items-center justify-center gap-2 bg-white text-primary-900 px-8 py-3 rounded-lg font-bold hover:bg-accent-50 transition-colors"
            >
              <Icon name="lucide:phone" class="w-5 h-5" />
              0442 242 42 59
            </a>
            <a
              href="https://wa.me/905396541720"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center justify-center gap-2 bg-accent-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-accent-600 transition-colors"
            >
              <Icon name="lucide:message-circle" class="w-5 h-5" />
              WhatsApp İletişim
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.6s ease-in-out;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
