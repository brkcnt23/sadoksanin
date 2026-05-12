<script setup lang="ts">
import { useAdminAuth } from '~/composables/useAdminAuth'

definePageMeta({
  layout: false, // Custom layout for login
})

const { login } = useAdminAuth()

const email = ref('admin@admin.com')
const password = ref('asd123')
const isLoading = ref(false)
const error = ref('')

const handleLogin = async () => {
  isLoading.value = true
  error.value = ''

  try {
    console.log('🔍 Login attempt:', { email: email.value })
    const result = await login(email.value, password.value)
    console.log('✅ Login result:', result)

    if (result.success) {
      console.log('🚀 Navigating to /')
      await navigateTo('/')
    } else {
      console.log('❌ Login failed:', result.error)
      error.value = result.error || 'Giriş başarısız'
    }
  } catch (err) {
    console.error('💥 Login error:', err)
    error.value = 'Bir hata oluştu'
  } finally {
    isLoading.value = false
  }
}

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleLogin()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
    <!-- Background Pattern -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute top-0 -left-40 w-80 h-80 bg-white rounded-full blur-3xl" />
      <div class="absolute bottom-0 -right-40 w-80 h-80 bg-white rounded-full blur-3xl" />
    </div>

    <!-- Login Card -->
    <div class="relative w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
        <!-- Logo -->
        <div class="text-center mb-8">
          <h1 class="text-3xl font-bold text-gray-900 mb-2">Sadöksan</h1>
          <p class="text-gray-600">Yönetim Paneli</p>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-4">
          <!-- Email Input -->
          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
              Email Adresi
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              placeholder="admin@admin.com"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
              @keypress="handleKeyPress"
              :disabled="isLoading"
            />
          </div>

          <!-- Password Input -->
          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              placeholder="••••••••"
              required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-colors"
              @keypress="handleKeyPress"
              :disabled="isLoading"
            />
          </div>

          <!-- Remember Me -->
          <div class="flex items-center">
            <input
              id="remember"
              type="checkbox"
              class="w-4 h-4 border border-gray-300 rounded focus:ring-blue-600"
              :disabled="isLoading"
            />
            <label for="remember" class="ml-2 text-sm text-gray-600">
              Beni hatırla
            </label>
          </div>

          <!-- Login Button -->
          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-lg hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Giriş Yapılıyor...' : 'Giriş Yap' }}
          </button>
        </form>

        <!-- Spacer -->

        <!-- Dev Info -->
        <div class="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p class="text-xs text-blue-700 font-medium mb-2">Geliştirme Hesabı:</p>
          <p class="text-xs text-blue-600 font-mono">admin@admin.com</p>
          <p class="text-xs text-blue-600 font-mono">asd123</p>
        </div>

        <!-- Footer -->
        <div class="mt-8 text-center">
          <p class="text-sm text-gray-600">
            © 2026 Sadöksan. Tüm Hakları Saklıdır.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
