<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({
  title: 'Bayi Üyeliği - Kayıt Ol | SADÖKSAN İnşaat',
  description: 'Bayi olarak kayıt olun. Distribütör ağımıza katılın.',
})

interface FormData {
  ad: string
  soyad: string
  email: string
  sifre: string
  cinsiyet: 'erkek' | 'kadin' | 'belirtme'
  telefon: string
  isletmeAdi: string
}

interface FormErrors {
  [key: string]: string
}

const showPassword = ref(false)
const loading = ref(false)
const success = ref(false)
const serverError = ref('')

const formData = ref<FormData>({
  ad: '',
  soyad: '',
  email: '',
  sifre: '',
  cinsiyet: 'belirtme',
  telefon: '',
  isletmeAdi: '',
})

const errors = ref<FormErrors>({})

const isFormValid = computed(() => {
  return (
    formData.value.ad.trim() &&
    formData.value.soyad.trim() &&
    formData.value.email.trim() &&
    formData.value.sifre.trim() &&
    formData.value.telefon.trim() &&
    formData.value.isletmeAdi.trim() &&
    Object.keys(errors.value).length === 0
  )
})

const validateField = (field: keyof FormData) => {
  const value = formData.value[field]
  const newErrors = { ...errors.value }

  switch (field) {
    case 'ad':
    case 'soyad':
      if (!value.trim()) {
        newErrors[field] = 'Bu alan zorunludur'
      } else if (value.trim().length < 2) {
        newErrors[field] = 'En az 2 karakter olmalıdır'
      } else {
        delete newErrors[field]
      }
      break

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
      } else if (value.length < 6) {
        newErrors[field] = 'En az 6 karakter olmalıdır'
      } else {
        delete newErrors[field]
      }
      break

    case 'telefon':
      if (!value.trim()) {
        newErrors[field] = 'Bu alan zorunludur'
      } else if (!/^[0-9\s\-\(\)]{10,}$/.test(value.replace(/\s/g, ''))) {
        newErrors[field] = 'Geçerli bir telefon numarası girin'
      } else {
        delete newErrors[field]
      }
      break

    case 'isletmeAdi':
      if (!value.trim()) {
        newErrors[field] = 'Bu alan zorunludur'
      } else if (value.trim().length < 3) {
        newErrors[field] = 'En az 3 karakter olmalıdır'
      } else {
        delete newErrors[field]
      }
      break
  }

  errors.value = newErrors
}

const handlePhoneInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/[^\d]/g, '')

  if (value.length > 11) {
    value = value.slice(0, 11)
  }

  if (value.length > 0) {
    if (value.length <= 3) {
      input.value = value
    } else if (value.length <= 6) {
      input.value = `${value.slice(0, 3)} ${value.slice(3)}`
    } else if (value.length <= 9) {
      input.value = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6)}`
    } else {
      input.value = `${value.slice(0, 3)} ${value.slice(3, 6)} ${value.slice(6, 9)} ${value.slice(9)}`
    }
  }

  formData.value.telefon = input.value
}

const handleSubmit = async () => {
  if (!isFormValid.value) {
    Object.keys(formData.value).forEach((key) => {
      validateField(key as keyof FormData)
    })
    return
  }

  loading.value = true
  serverError.value = ''

  try {
    // TODO: Integrate with actual API
    // const response = await $fetch('/api/dealers/register', {
    //   method: 'POST',
    //   body: formData.value,
    // })

    // Simulated delay for demo
    await new Promise((resolve) => setTimeout(resolve, 1500))

    success.value = true
    window.scrollTo({ top: 0, behavior: 'smooth' })

    setTimeout(() => {
      navigateTo('/giris')
    }, 2000)
  } catch (error: any) {
    serverError.value = error?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyin.'
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  navigateTo('/bayilik')
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 lg:py-16">
    <div class="px-6 lg:px-12 mx-auto max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <img
          src="/img/logo/headerlogo.png"
          alt="Sadöksan İnşaat"
          class="h-12 w-auto object-contain brightness-0 invert mx-auto mb-4"
        />
        <h1 class="text-2xl font-bold text-primary-900">Yeni Bayi Üyeliği</h1>
        <p class="text-ink-500 mt-2">Distribütör ağımıza katılın</p>
      </div>

      <!-- Success Message -->
      <transition name="fade">
        <div v-if="success" class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex gap-3">
            <Icon name="lucide:check-circle" class="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p class="font-semibold text-green-900">Kayıt başarılı!</p>
              <p class="text-sm text-green-800 mt-1">
                Başvurunuz incelenmiştir. Giriş sayfasına yönlendiriliyorsunuz...
              </p>
            </div>
          </div>
        </div>
      </transition>

      <!-- Error Message -->
      <transition name="fade">
        <div v-if="serverError" class="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex gap-3">
            <Icon name="lucide:alert-circle" class="h-5 w-5 text-red-600 flex-shrink-0" />
            <div>
              <p class="font-semibold text-red-900">Hata</p>
              <p class="text-sm text-red-800 mt-1">{{ serverError }}</p>
            </div>
          </div>
        </div>
      </transition>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="bg-white rounded-xl shadow-md p-8 space-y-4">
        <!-- Name Row -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-semibold text-primary-900 mb-2">
              Adı <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.ad"
              type="text"
              placeholder="Adınız"
              @blur="validateField('ad')"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              :class="{ 'border-red-500': errors.ad }"
            />
            <p v-if="errors.ad" class="text-xs text-red-500 mt-1">{{ errors.ad }}</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-primary-900 mb-2">
              Soyadı <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.soyad"
              type="text"
              placeholder="Soyadınız"
              @blur="validateField('soyad')"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              :class="{ 'border-red-500': errors.soyad }"
            />
            <p v-if="errors.soyad" class="text-xs text-red-500 mt-1">{{ errors.soyad }}</p>
          </div>
        </div>

        <!-- Business Name -->
        <div>
          <label class="block text-sm font-semibold text-primary-900 mb-2">
            İşletme Adı <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.isletmeAdi"
            type="text"
            placeholder="Şirket / işletme adı"
            @blur="validateField('isletmeAdi')"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            :class="{ 'border-red-500': errors.isletmeAdi }"
          />
          <p v-if="errors.isletmeAdi" class="text-xs text-red-500 mt-1">{{ errors.isletmeAdi }}</p>
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-semibold text-primary-900 mb-2">
            Email <span class="text-red-500">*</span>
          </label>
          <input
            v-model="formData.email"
            type="email"
            placeholder="email@ornek.com"
            @blur="validateField('email')"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            :class="{ 'border-red-500': errors.email }"
          />
          <p v-if="errors.email" class="text-xs text-red-500 mt-1">{{ errors.email }}</p>
        </div>

        <!-- Phone -->
        <div>
          <label class="block text-sm font-semibold text-primary-900 mb-2">
            Cep Telefonu <span class="text-red-500">*</span>
          </label>
          <input
            type="tel"
            placeholder="(5XX) XXX XX XX"
            @input="handlePhoneInput"
            @blur="validateField('telefon')"
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            :class="{ 'border-red-500': errors.telefon }"
          />
          <p v-if="errors.telefon" class="text-xs text-red-500 mt-1">{{ errors.telefon }}</p>
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
              placeholder="En az 6 karakter"
              @blur="validateField('sifre')"
              class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
              :class="{ 'border-red-500': errors.sifre }"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-ink-700"
            >
              <Icon
                :name="showPassword ? 'lucide:eye-off' : 'lucide:eye'"
                class="h-5 w-5"
              />
            </button>
          </div>
          <p v-if="errors.sifre" class="text-xs text-red-500 mt-1">{{ errors.sifre }}</p>
        </div>

        <!-- Gender -->
        <div>
          <label class="block text-sm font-semibold text-primary-900 mb-3">Cinsiyet</label>
          <div class="flex gap-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="formData.cinsiyet"
                type="radio"
                value="erkek"
                class="w-4 h-4"
              />
              <span class="text-sm text-ink-600">Erkek</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="formData.cinsiyet"
                type="radio"
                value="kadin"
                class="w-4 h-4"
              />
              <span class="text-sm text-ink-600">Kadın</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="formData.cinsiyet"
                type="radio"
                value="belirtme"
                class="w-4 h-4"
              />
              <span class="text-sm text-ink-600">Belirtmek istemiyor</span>
            </label>
          </div>
        </div>

        <!-- Terms -->
        <div class="space-y-2 pt-2">
          <label class="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" class="w-4 h-4 mt-1 flex-shrink-0" required />
            <span class="text-xs text-ink-600">
              Ödeme ve sipariş işlemleri hakkında beni bilgilendir
            </span>
          </label>

          <label class="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" class="w-4 h-4 mt-1 flex-shrink-0" required />
            <span class="text-xs text-ink-600">
              Bayi sözleşmesini okudum ve kabul ediyorum
            </span>
          </label>

          <label class="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" class="w-4 h-4 mt-1 flex-shrink-0" required />
            <span class="text-xs text-ink-600">
              <NuxtLink to="/yasal/kisisel-veriler" class="text-accent-600 hover:underline">
                Kişisel verilerin işlenmesi
              </NuxtLink>
              hakkında bilgilendirilme metnini okudum
            </span>
          </label>
        </div>

        <!-- Buttons -->
        <div class="flex gap-4 pt-6">
          <button
            type="button"
            @click="handleCancel"
            :disabled="loading"
            class="flex-1 px-4 py-3 bg-ink-100 hover:bg-ink-200 text-ink-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            İptal
          </button>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="flex-1 px-4 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="!loading">Kayıt Ol</span>
            <span v-else class="flex items-center gap-2">
              <Icon name="lucide:loader" class="h-4 w-4 animate-spin" />
              Kaydediliyor...
            </span>
          </button>
        </div>

        <!-- Login Link -->
        <p class="text-center text-sm text-ink-600 pt-4">
          Zaten hesabınız var mı?
          <NuxtLink to="/giris" class="text-accent-600 hover:text-accent-700 font-semibold">
            Giriş yapın
          </NuxtLink>
        </p>
      </form>

      <!-- Footer Note -->
      <p class="text-center text-xs text-ink-500 mt-6">
        Başvurunuz yöneticiler tarafından incelenecektir.<br />
        Onaylandıktan sonra giriş yapabileceğiniz hesabınız aktif hale getirilecektir.
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
