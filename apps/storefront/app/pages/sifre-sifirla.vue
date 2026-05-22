<script setup lang="ts">
definePageMeta({
  title: 'Yeni Şifre | Sadöksan',
})

const route = useRoute()
const password = ref('')
const passwordConfirm = ref('')
const showPassword = ref(false)
const loading = ref(false)
const success = ref(false)
const error = ref('')

const token = computed(() => (route.query.token as string) || '')

const handleSubmit = async () => {
  if (!password.value || password.value.length < 6) {
    error.value = 'Şifre en az 6 karakter olmalıdır'
    return
  }
  if (password.value !== passwordConfirm.value) {
    error.value = 'Şifreler eşleşmiyor'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const api = useApi()
    await api.post('/auth/reset-password', {
      token: token.value,
      password: password.value,
    })

    success.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Şifre sıfırlama başarısız. Bağlantı süresi dolmuş olabilir.'
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
        <h1 class="text-2xl font-bold text-primary-900">Yeni Şifre</h1>
        <p class="text-ink-500 mt-2">Yeni şifrenizi belirleyin.</p>
      </div>

      <div v-if="success" class="bg-white rounded-xl shadow-md p-8 text-center">
        <Icon name="lucide:check-circle" class="h-12 w-12 text-green-600 mx-auto mb-4" />
        <h2 class="text-lg font-semibold text-primary-900 mb-2">Şifre Değiştirildi</h2>
        <p class="text-ink-600 text-sm mb-6">Yeni şifrenizle giriş yapabilirsiniz.</p>
        <NuxtLink
          to="/giris"
          class="inline-block px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors"
        >
          Giriş Yap
        </NuxtLink>
      </div>

      <form v-else-if="token" @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-md p-8 space-y-5">
        <div v-if="error" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {{ error }}
        </div>

        <div>
          <label class="block text-sm font-semibold text-primary-900 mb-2">Yeni Şifre</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="En az 6 karakter"
              class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 transition-colors"
              :disabled="loading"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500"
            >
              <Icon :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'" class="h-5 w-5" />
            </button>
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-primary-900 mb-2">Şifre Tekrar</label>
          <input
            v-model="passwordConfirm"
            type="password"
            placeholder="Şifrenizi tekrar girin"
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
          {{ loading ? 'Kaydediliyor...' : 'Şifreyi Değiştir' }}
        </button>
      </form>

      <div v-else class="bg-white rounded-xl shadow-md p-8 text-center">
        <Icon name="lucide:alert-circle" class="h-12 w-12 text-amber-600 mx-auto mb-4" />
        <h2 class="text-lg font-semibold text-primary-900 mb-2">Geçersiz Bağlantı</h2>
        <p class="text-ink-600 text-sm mb-6">Şifre sıfırlama bağlantısı geçersiz veya eksik.</p>
        <NuxtLink
          to="/sifremi-unuttum"
          class="text-accent-600 hover:text-accent-700 font-semibold"
        >
          Yeni bağlantı isteyin
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
