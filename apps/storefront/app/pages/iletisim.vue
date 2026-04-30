<script setup lang="ts">
definePageMeta({
  title: 'İletişim | SADÖKSAN İnşaat',
  description: 'SADÖKSAN İnşaat Malzemeleri — İletişim bilgileri, adres ve mesaj formu.',
})

const formData = reactive({
  name: '',
  email: '',
  phone: '',
  subject: '',
  message: '',
})

const isSubmitting = ref(false)
const submitSuccess = ref(false)

const contactInfo = [
  {
    icon: 'lucide:map-pin',
    label: 'Adres',
    value: 'KAZIMKARABEKİR MAH. DEMİRCİLER CAD. NO:10 YAKUTİYE/ERZURUM',
    href: 'https://maps.google.com/maps?q=KAZIMKARABEK%C4%B0R+MAH.+DEM%C4%B0RC%C4%B0LER+CAD+10',
  },
  {
    icon: 'lucide:phone',
    label: 'Telefon',
    value: '0539 654 17 20',
    href: 'tel:+905396541720',
  },
  {
    icon: 'lucide:phone-forwarded',
    label: 'Telefon 2',
    value: '0442 242 42 59',
    href: 'tel:+904422424259',
  },
  {
    icon: 'lucide:mail',
    label: 'E-mail',
    value: 'info@sadoksaninsaat.com.tr',
    href: 'mailto:info@sadoksaninsaat.com.tr',
  },
  {
    icon: 'lucide:printer',
    label: 'Fax',
    value: '0442 242 42 59',
    href: null,
  },
]

const submitForm = async () => {
  isSubmitting.value = true
  try {
    // Burada API'ye POST yapılacak
    // await $fetch('/api/contact', { method: 'POST', body: formData })

    // Şimdilik simüle edildi
    await new Promise(resolve => setTimeout(resolve, 1500))
    submitSuccess.value = true

    // Reset form
    formData.name = ''
    formData.email = ''
    formData.phone = ''
    formData.subject = ''
    formData.message = ''

    // Success mesajını 3 saniye sonra gizle
    setTimeout(() => {
      submitSuccess.value = false
    }, 3000)
  } finally {
    isSubmitting.value = false
  }
}
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
          İletişim
        </h1>
        <p class="text-xl text-white/80 max-w-2xl">
          Sorularınız, önerileriniz ve iş birliği teklifleri için bize ulaşın
        </p>
      </div>
    </section>

    <!-- Main Content -->
    <section class="py-16 lg:py-20">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <div class="grid lg:grid-cols-5 gap-12">
          <!-- Left Column - Contact Info -->
          <div class="lg:col-span-2 space-y-6">
            <h2 class="text-3xl font-bold text-primary-900 mb-8">
              Bize Ulaşın
            </h2>

            <!-- Info Cards -->
            <div class="space-y-4">
              <a
                v-for="(info, index) in contactInfo"
                :key="index"
                :href="info.href || 'javascript:void(0)'"
                :class="[
                  'block p-6 rounded-xl border-2 transition-all',
                  info.href
                    ? 'border-primary-200 hover:border-accent-500 hover:shadow-lg hover:-translate-y-1 bg-white cursor-pointer'
                    : 'border-primary-100 bg-primary-50'
                ]"
              >
                <div class="flex items-start gap-4">
                  <div class="flex-shrink-0">
                    <div class="flex items-center justify-center h-12 w-12 rounded-lg bg-accent-100">
                      <Icon :name="info.icon" class="h-6 w-6 text-accent-600" />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-semibold text-ink-600 uppercase tracking-wide">
                      {{ info.label }}
                    </p>
                    <p class="mt-2 text-base text-primary-900 font-medium break-words">
                      {{ info.value }}
                    </p>
                  </div>
                </div>
              </a>
            </div>

            <!-- Company Info Card -->
            <div class="mt-8 p-6 bg-gradient-to-br from-primary-900 to-primary-800 rounded-xl text-white">
              <h3 class="font-bold text-lg mb-4">Şirket Bilgileri</h3>
              <div class="space-y-3 text-sm">
                <div>
                  <p class="text-white/70">Vergi No</p>
                  <p class="font-semibold">7360673934</p>
                </div>
                <div>
                  <p class="text-white/70">Vergi Dairesi</p>
                  <p class="font-semibold">KAZIMKARABEKİR</p>
                </div>
                <div>
                  <p class="text-white/70">Yetkili Kişi</p>
                  <p class="font-semibold">BURAK BUZDAĞLI</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column - Contact Form -->
          <div class="lg:col-span-3">
            <div class="bg-white rounded-2xl shadow-lg p-8 lg:p-10">
              <h2 class="text-2xl font-bold text-primary-900 mb-8">
                Mesaj Gönder
              </h2>

              <!-- Success Message -->
              <Transition
                enter-active-class="transition duration-300 ease-out"
                enter-from-class="opacity-0 -translate-y-2"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition duration-200 ease-in"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-2"
              >
                <div v-if="submitSuccess" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                  <Icon name="lucide:check-circle" class="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p class="font-semibold text-green-900">Mesajınız gönderildi!</p>
                    <p class="text-sm text-green-700 mt-1">En kısa sürede size geri dönüş yapacağız.</p>
                  </div>
                </div>
              </Transition>

              <!-- Form -->
              <form @submit.prevent="submitForm" class="space-y-6">
                <!-- Name -->
                <div>
                  <label for="name" class="block text-sm font-semibold text-primary-900 mb-2">
                    Adı Soyadı <span class="text-accent-600">*</span>
                  </label>
                  <input
                    v-model="formData.name"
                    type="text"
                    id="name"
                    required
                    placeholder="Tam adınız"
                    class="w-full px-4 py-3 rounded-lg border-2 border-primary-100 focus:border-accent-500 focus:outline-none transition-colors bg-white"
                  />
                </div>

                <!-- Email -->
                <div>
                  <label for="email" class="block text-sm font-semibold text-primary-900 mb-2">
                    E-mail <span class="text-accent-600">*</span>
                  </label>
                  <input
                    v-model="formData.email"
                    type="email"
                    id="email"
                    required
                    placeholder="ornek@email.com"
                    class="w-full px-4 py-3 rounded-lg border-2 border-primary-100 focus:border-accent-500 focus:outline-none transition-colors bg-white"
                  />
                </div>

                <!-- Phone -->
                <div>
                  <label for="phone" class="block text-sm font-semibold text-primary-900 mb-2">
                    Telefon <span class="text-accent-600">*</span>
                  </label>
                  <input
                    v-model="formData.phone"
                    type="tel"
                    id="phone"
                    required
                    placeholder="(5XX) XXX XX XX"
                    class="w-full px-4 py-3 rounded-lg border-2 border-primary-100 focus:border-accent-500 focus:outline-none transition-colors bg-white"
                  />
                </div>

                <!-- Subject -->
                <div>
                  <label for="subject" class="block text-sm font-semibold text-primary-900 mb-2">
                    Konu <span class="text-accent-600">*</span>
                  </label>
                  <input
                    v-model="formData.subject"
                    type="text"
                    id="subject"
                    required
                    placeholder="Mesajınızın konusu"
                    class="w-full px-4 py-3 rounded-lg border-2 border-primary-100 focus:border-accent-500 focus:outline-none transition-colors bg-white"
                  />
                </div>

                <!-- Message -->
                <div>
                  <label for="message" class="block text-sm font-semibold text-primary-900 mb-2">
                    Mesaj <span class="text-accent-600">*</span>
                  </label>
                  <textarea
                    v-model="formData.message"
                    id="message"
                    required
                    placeholder="Mesajınızı buraya yazın..."
                    rows="6"
                    class="w-full px-4 py-3 rounded-lg border-2 border-primary-100 focus:border-accent-500 focus:outline-none transition-colors bg-white resize-none"
                  />
                </div>

                <!-- Submit Button -->
                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="w-full bg-gradient-to-r from-primary-900 to-accent-600 text-white font-bold py-3 rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Icon v-if="!isSubmitting" name="lucide:send" class="h-5 w-5" />
                  <span v-if="!isSubmitting">Gönder</span>
                  <span v-else class="flex items-center gap-2">
                    <span class="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Gönderiliyor...
                  </span>
                </button>
              </form>

              <!-- Privacy Info -->
              <p class="mt-6 text-xs text-ink-500 text-center">
                Gönderdiğiniz bilgiler güvenle saklanacak ve sadece iletişim amaçlı kullanılacaktır.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 lg:py-20 bg-white/50">
      <div class="px-6 lg:px-12 mx-auto max-w-5xl">
        <div class="text-center">
          <h2 class="text-3xl font-bold text-primary-900 mb-4">
            Hızlı İletişim
          </h2>
          <p class="text-ink-600 mb-8 max-w-2xl mx-auto">
            Acil konular için doğrudan WhatsApp üzerinden bize ulaşabilirsiniz
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+905396541720"
              class="inline-flex items-center justify-center gap-2 bg-primary-900 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-800 transition-colors"
            >
              <Icon name="lucide:phone" class="w-5 h-5" />
              0539 654 17 20
            </a>
            <a
              href="https://wa.me/905396541720"
              target="_blank"
              rel="noopener"
              class="inline-flex items-center justify-center gap-2 bg-accent-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-accent-600 transition-colors"
            >
              <Icon name="lucide:message-circle" class="w-5 h-5" />
              WhatsApp Mesaj
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
