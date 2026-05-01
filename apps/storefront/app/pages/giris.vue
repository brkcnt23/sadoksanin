<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  title: 'Bayi Girişi | SADÖKSAN İnşaat',
  description: 'Bayi hesabınıza giriş yapın.',
})

const { login } = useAuth()

interface FormData {
  email: string
  sifre: string
  beniBaba: boolean
}

interface FormErrors {
  [key: string]: string
}

const showPassword = ref(false)
const loading = ref(false)
const serverError = ref('')

const formData = ref<FormData>({
  email: '',
  sifre: '',
  beniBaba: false,
})

const errors = ref<FormErrors>({})

const isFormValid = computed(() => {
  return (
    formData.value.email.trim() &&
    formData.value.sifre &&
    Object.keys(errors.value).length === 0
  )
})

const validateField = (field: keyof Omit<FormData, 'beniBaba'>) => {
  const value = formData.value[field]
  const newErrors = { ...errors.value }

  switch (field) {
    case 'email':
      if (!value.trim()) {
        newErrors[field] = 'Bu alan zorunludur'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        newErrors[field] = 'Geçerli bir email adresi girin'
      } else {
        delete newErrors[field]
      }
      break

    case 'sifre':
      if (!value) {
        newErrors[field] = 'Bu alan zorunludur'
      } else {
        delete newErrors[field]
      }
      break
  }

  errors.value = newErrors
}

const handleSubmit = async () => {
  validateField('email')
  validateField('sifre')

  if (!isFormValid.value) {
    return
  }

  loading.value = true
  serverError.value = ''

  try {
    const result = await login(formData.value.email, formData.value.sifre)

    if (result.success) {
      // Simulated delay for demo
      await new Promise((resolve) => setTimeout(resolve, 1000))
      navigateTo('/hesabim')
    } else {
      serverError.value = result.error || 'Email veya şifre hatalı. Lütfen tekrar deneyin.'
    }
  } catch (error: any) {
    serverError.value = 'Bir hata oluştu. Lütfen tekrar deneyin.'
  } finally {
    loading.value = false
  }
}

const handleForgotPassword = () => {
  // TODO: Implement forgot password flow
  navigateTo('/sifremi-unuttum')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 lg:py-24 flex items-center">
    <div class="px-6 lg:px-12 mx-auto max-w-md w-full">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img
          src="/img/logo/headerlogo.png"
          alt="Sadöksan İnşaat"
          class="h-12 w-auto object-contain brightness-0 invert mx-auto mb-4"
        />
        <h1 class="text-2xl font-bold text-primary-900">Bayi Girişi</h1>
        <p class="text-ink-500 mt-2">Hesabınıza giriş yapın</p>
      </div>

      <!-- Demo Credentials -->
      <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p class="text-xs font-semibold text-blue-900 mb-2">Demo Kimlik Bilgileri:</p>
        <p class="text-xs text-blue-800">Email: <code class="font-mono font-bold">test@test.com</code></p>
        <p class="text-xs text-blue-800">Şifre: <code class="font-mono font-bold">asd123</code></p>
      </div>

      <!-- Error Message -->
      <transition name="fade">
        <div v-if="serverError" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex gap-3">
            <Icon name="lucide:alert-circle" class="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p class="font-semibold text-red-900">Giriş Başarısız</p>
              <p class="text-sm text-red-800 mt-1">{{ serverError }}</p>
            </div>
          </div>
        </div>
      </transition>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-md p-8 space-y-5">
        <!-- Email -->
        <div>
          <label class="block text-sm font-semibold text-primary-900 mb-2">
            Email Adresiniz <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.email"
            type="email"
            placeholder="email@ornek.com"
            @blur="validateField('email')"
            @input="() => errors.email && validateField('email')"
            class="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 transition"
            :class="{ 'border-red-500 focus:ring-red-500': errors.email }"
          />
          <p v-if="errors.email" class="text-xs text-red-500 mt-1.5">{{ errors.email }}</p>
        </div>

        <!-- Password -->
        <div>
          <label class="block text-sm font-semibold text-primary-900 mb-2">
            Şifre <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              v-model="formData.sifre"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Şifrenizi girin"
              @blur="validateField('sifre')"
              @input="() => errors.sifre && validateField('sifre')"
              class="w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 transition"
              :class="{ 'border-red-500 focus:ring-red-500': errors.sifre }"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-700 transition"
            >
              <Icon
                :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
                class="h-5 w-5"
              />
            </button>
          </div>
          <p v-if="errors.sifre" class="text-xs text-red-500 mt-1.5">{{ errors.sifre }}</p>
        </div>

        <!-- Remember Me -->
        <label class="flex items-center gap-3 cursor-pointer">
          <input
            v-model="formData.beniBaba"
            type="checkbox"
            class="w-4 h-4 accent-accent-500"
          />
          <span class="text-sm text-ink-600">Beni hatırla</span>
        </label>

        <!-- Submit Button -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full px-4 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
        >
          <span v-if="!loading">Giriş Yap</span>
          <span v-else class="flex items-center gap-2">
            <Icon name="lucide:loader" class="h-4 w-4 animate-spin" />
            Giriş yapılıyor...
          </span>
        </button>

        <!-- Forgot Password Link -->
        <div class="text-center pt-2">
          <button
            type="button"
            @click="handleForgotPassword"
            class="text-sm text-accent-600 hover:text-accent-700 font-semibold transition"
          >
            Şifremi Unuttum?
          </button>
        </div>
      </form>

      <!-- Divider -->
      <div class="relative my-8">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-ink-200"></div>
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-2 bg-white text-ink-600">veya</span>
        </div>
      </div>

      <!-- Registration Link -->
      <div class="bg-primary-50 rounded-xl p-6 text-center">
        <p class="text-sm text-ink-600 mb-3">
          Henüz bayi hesabınız yok mu?
        </p>
        <NuxtLink
          to="/uye-ol"
          class="inline-block w-full px-4 py-3 bg-primary-100 hover:bg-primary-200 text-primary-900 font-semibold rounded-lg transition-colors"
        >
          Yeni Üyelik Oluştur
        </NuxtLink>
      </div>

      <!-- Back to Program -->
      <div class="text-center mt-6">
        <NuxtLink
          to="/bayilik"
          class="text-sm text-accent-600 hover:text-accent-700 font-semibold transition flex items-center justify-center gap-1"
        >
          <Icon name="lucide:arrow-left" class="h-4 w-4" />
          Bayi Programı
        </NuxtLink>
      </div>

      <!-- Help Text -->
      <p class="text-center text-xs text-ink-500 mt-8">
        Giriş yapamıyor musunuz?
        <a href="https://wa.me/905396541720" target="_blank" rel="noopener" class="text-accent-600 hover:text-accent-700 font-semibold">
          WhatsApp'tan iletişime geçin
        </a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
