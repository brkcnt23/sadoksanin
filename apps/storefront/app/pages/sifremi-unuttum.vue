<script setup lang="ts">
definePageMeta({
  title: 'Şifremi Unuttum | Sadöksan',
})

const email = ref('')
const loading = ref(false)
const sent = ref(false)
const error = ref('')

const handleSubmit = async () => {
  if (!email.value.trim()) {
    error.value = 'Email adresi zorunludur'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const api = useApi()
    const result = await api.post<{ message: string; resetUrl?: string }>('/auth/forgot-password', {
      email: email.value.trim(),
    })

    sent.value = true
    // Dev only: log reset URL for testing
    if (result.resetUrl) {
      console.log('Reset URL:', result.resetUrl)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Bir hata oluştu'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white flex items-center justify-center py-12 px-6">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <img
          src="/img/logo/headerlogo.png"
          alt="Sadöksan"
          class="h-12 w-auto object-contain brightness-0 invert mx-auto mb-4"
        />
        <h1 class="text-2xl font-bold text-primary-900">Şifremi Unuttum</h1>
        <p class="text-ink-500 mt-2">Email adresinizi girin, şifre sıfırlama bağlantısı gönderelim.</p>
      </div>

      <div v-if="sent" class="bg-white rounded-xl shadow-md p-8 text-center">
        <Icon name="lucide:mail-check" class="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 class="text-lg font-semibold text-primary-900 mb-2">Kontrol Edin</h2>
        <p class="text-ink-600 text-sm">
          Şifre sıfırlama bağlantısı <strong>{{ email }}</strong> adresine gönderildi.
        </p>
        <NuxtLink
          to="/giris"
          class="inline-block mt-6 text-accent-600 hover:text-accent-700 font-semibold"
        >
          Giriş sayfasına dön
        </NuxtLink>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-md p-8 space-y-5">
        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {{ error }}
        </div>

        <div>
          <label class="block text-sm font-semibold text-primary-900 mb-2">Email Adresiniz</label>
          <input
            v-model="email"
            type="email"
            placeholder="email@ornek.com"
            class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 transition-colors"
            :disabled="loading"
          />
        </div>

        <button
          type="submit"
          :disabled="loading"
          class="w-full px-4 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Icon v-if="loading" name="lucide:loader" class="h-4 w-4 animate-spin" />
          {{ loading ? 'Gönderiliyor...' : 'Şifre Sıfırlama Bağlantısı Gönder' }}
        </button>

        <p class="text-center text-sm text-ink-600 pt-4">
          <NuxtLink to="/giris" class="text-accent-600 hover:text-accent-700 font-semibold">
            Giriş sayfasına dön
          </NuxtLink>
        </p>
      </form>
    </div>
  </div>
</template>
