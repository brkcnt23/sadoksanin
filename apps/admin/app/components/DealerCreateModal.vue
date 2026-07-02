<script setup lang="ts">
import { PROVINCES } from '~/utils/turkish-provinces'

interface Props {
  open: boolean
  /** Pre-fill mode: 'test' = auto-fill with test data, undefined = empty form */
  mode?: 'test'
  /** User role: 'DEALER' (default) or 'PLASIYER' */
  userRole?: 'DEALER' | 'PLASIYER'
}
const props = withDefaults(defineProps<Props>(), { userRole: 'DEALER' })
const emit = defineEmits<{ close: [] }>()

const api = useApi()
const toast = useToast()
const dealers = useDealersStore()

// ─── Form State ───────────────────────────────────────────────
const company = ref('')
const taxNo = ref('')
const taxOffice = ref('')
const contactPerson = ref('')
const email = ref('')
const phone = ref('')
const password = ref('')
const city = ref('İstanbul')
const address = ref('')
const cariNo = ref('')
const creditLimit = ref<number>(0)
const role = computed(() => props.userRole)

// ─── UI State ─────────────────────────────────────────────────
type Step = 'form' | 'submitting' | 'done' | 'error'
const step = ref<Step>('form')
const errorMessage = ref('')
const createdDealer = ref<{ id: string; email: string; name: string } | null>(null)

// ─── Computed ─────────────────────────────────────────────────
const formValid = computed(() => {
  if (!email.value.trim() || !email.value.includes('@')) return false
  if (!password.value || password.value.length < 4) return false
  if (!contactPerson.value.trim()) return false
  if (role.value === 'DEALER') {
    if (!company.value.trim()) return false
    if (!taxNo.value.trim()) return false
    if (!phone.value.trim()) return false
    if (!cariNo.value.trim()) return false
  }
  return true
})

const isDealer = computed(() => role.value === 'DEALER')
const isPlasiyer = computed(() => role.value === 'PLASIYER')

// ─── Submit ───────────────────────────────────────────────────
async function submit() {
  if (!formValid.value || step.value === 'submitting') return
  step.value = 'submitting'
  errorMessage.value = ''

  try {
    const body: any = {
      email: email.value.trim(),
      password: password.value,
      name: contactPerson.value.trim(),
      role: role.value,
      phone: phone.value.trim(),
      city: city.value,
      address: address.value.trim(),
      company: company.value.trim(),
      contactPerson: contactPerson.value.trim(),
      taxNo: taxNo.value.trim(),
      taxOffice: taxOffice.value.trim(),
      cariNo: cariNo.value.trim(),
    }

    const result = await api.post<any>('/auth/admin-create-user', body)
    createdDealer.value = result

    // Set credit limit if > 0 via a second call or direct DB update
    // For now, we set it directly in the created dealer
    if (creditLimit.value > 0 && result.id) {
      try {
        // Find the dealer record by userId and update credit limit
        await api.patch(`/dealer/${result.id}/credit-limit`, { creditLimit: creditLimit.value })
      } catch {
        // Non-critical — credit limit can be set later
      }
    }

    await dealers.load()
    step.value = 'done'
    toast.push(`✅ Bayi oluşturuldu: ${company.value}`, 'success')
  } catch (err: any) {
    step.value = 'error'
    errorMessage.value = err?.message || 'Bayi oluşturulamadı'
    toast.push(`❌ ${errorMessage.value}`, 'error')
  }
}

function reset() {
  step.value = 'form'
  errorMessage.value = ''
  createdDealer.value = null
}

function fillTest() {
  const ts = Date.now().toString(36).slice(-4)
  contactPerson.value = isPlasiyer.value ? `Test Plasiyer ${ts}` : `Test Yetkili ${ts}`
  email.value = isPlasiyer.value ? `test-plasiyer-${ts}@test.com` : `test-bayi-${ts}@test.com`
  password.value = 'test123'
  phone.value = `05${Math.floor(Math.random() * 900000000) + 100000000}`
  city.value = 'İstanbul'
  if (isDealer.value) {
    company.value = `Test Bayi ${ts} İnşaat`
    taxNo.value = `${Math.floor(Math.random() * 90000000000) + 10000000000}`
    taxOffice.value = 'İstanbul'
    address.value = `Test Adres, No: ${Math.floor(Math.random() * 100) + 1}, İstanbul`
    cariNo.value = `120.01.${String(Math.floor(Math.random() * 9000) + 1000)}`
    creditLimit.value = 50000
  }
}

// Fill test data on open if in test mode
watch(() => props.open, (v) => {
  if (v) {
    reset()
    if (props.mode === 'test') {
      fillTest()
    }
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div class="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Header -->
          <header class="px-6 py-4 border-b border-ink-200 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <Icon
                :name="mode === 'test' ? 'lucide:flask-conical' : isPlasiyer ? 'lucide:user-plus' : 'lucide:building-2'"
                :class="['w-5 h-5', mode === 'test' ? 'text-purple-600' : isPlasiyer ? 'text-indigo-600' : 'text-blue-600']"
              />
              <h3 class="font-semibold text-ink-900">
                {{ mode === 'test' ? (isPlasiyer ? 'Test Plasiyer Oluştur' : 'Test Bayi Oluştur') : (isPlasiyer ? 'Yeni Plasiyer Oluştur' : 'Yeni Bayi Oluştur') }}
              </h3>
            </div>
            <button
              @click="emit('close')"
              class="p-1.5 hover:bg-ink-100 rounded-md text-ink-500 transition-colors"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </header>

          <!-- Body -->
          <div class="flex-1 overflow-auto p-6">
            <!-- Done -->
            <div v-if="step === 'done'" class="text-center py-8">
              <div class="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center">
                <Icon name="lucide:check-circle" class="w-10 h-10 text-emerald-600" />
              </div>
              <p class="mt-4 text-lg font-semibold text-ink-900">{{ isPlasiyer ? 'Plasiyer başarıyla oluşturuldu!' : 'Bayi başarıyla oluşturuldu!' }}</p>
              <p class="mt-1 text-ink-500">
                {{ isPlasiyer ? contactPerson : company }} — {{ createdDealer?.email }}
              </p>
              <p class="text-sm text-ink-400 mt-1">
                {{ isPlasiyer ? 'Plasiyer hesabı oluşturuldu, giriş yapabilir.' : 'Bayi doğrudan AKTİF olarak oluşturuldu, giriş yapabilir.' }}
              </p>
              <div class="mt-6 flex justify-center gap-3">
                <button
                  @click="emit('close'); reset()"
                  class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>

            <!-- Submitting -->
            <div v-else-if="step === 'submitting'" class="text-center py-12">
              <Icon name="lucide:loader-2" class="w-10 h-10 animate-spin mx-auto text-blue-600" />
              <p class="mt-4 text-ink-700 font-medium">Bayi oluşturuluyor...</p>
            </div>

            <!-- Error -->
            <div v-else-if="step === 'error'" class="text-center py-8">
              <div class="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <Icon name="lucide:alert-circle" class="w-10 h-10 text-red-600" />
              </div>
              <p class="mt-4 text-lg font-semibold text-red-700">Hata</p>
              <p class="mt-1 text-ink-500 max-w-md mx-auto">{{ errorMessage }}</p>
              <div class="mt-6 flex justify-center gap-3">
                <button @click="step = 'form'" class="px-5 py-2.5 bg-ink-100 hover:bg-ink-200 text-ink-700 text-sm font-semibold rounded-lg">Geri Dön</button>
                <button @click="emit('close'); reset()" class="px-5 py-2.5 bg-ink-700 hover:bg-ink-800 text-white text-sm font-semibold rounded-lg">Kapat</button>
              </div>
            </div>

            <!-- Form -->
            <div v-else class="space-y-5">
              <!-- Firma Bilgileri (sadece bayi) -->
              <fieldset v-if="isDealer" class="border border-ink-200 rounded-lg p-4">
                <legend class="text-sm font-semibold text-ink-700 px-2">Firma Bilgileri</legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="col-span-2">
                    <label class="block text-xs text-ink-500 mb-0.5">Firma Adı <span class="text-red-500">*</span></label>
                    <input v-model="company" type="text" placeholder="ABC İnşaat Ltd. Şti." class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">Vergi No <span class="text-red-500">*</span></label>
                    <input v-model="taxNo" type="text" maxlength="11" placeholder="12345678901" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm font-mono" />
                  </div>
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">Vergi Dairesi</label>
                    <input v-model="taxOffice" type="text" placeholder="İstanbul" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
                  </div>
                </div>
              </fieldset>

              <!-- Yetkili Bilgileri -->
              <fieldset class="border border-ink-200 rounded-lg p-4">
                <legend class="text-sm font-semibold text-ink-700 px-2">Yetkili & Giriş Bilgileri</legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">Yetkili Ad Soyad <span class="text-red-500">*</span></label>
                    <input v-model="contactPerson" type="text" placeholder="Ahmet Yılmaz" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">Telefon <span class="text-red-500">*</span></label>
                    <input v-model="phone" type="text" placeholder="0532 123 4567" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">E-posta (giriş için) <span class="text-red-500">*</span></label>
                    <input v-model="email" type="email" placeholder="bayi@firma.com" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">Şifre <span class="text-red-500">*</span></label>
                    <div class="relative">
                      <input v-model="password" type="text" placeholder="En az 4 karakter" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm font-mono" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">Şehir</label>
                    <select v-model="city" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm bg-white">
                      <option v-for="c in PROVINCES" :key="c" :value="c">{{ c }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">Adres</label>
                    <input v-model="address" type="text" placeholder="Açık adres..." class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
                  </div>
                </div>
              </fieldset>

              <!-- Finansal Bilgiler (sadece bayi) -->
              <fieldset v-if="isDealer" class="border border-ink-200 rounded-lg p-4">
                <legend class="text-sm font-semibold text-ink-700 px-2">Finansal & Netsis</legend>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">Cari No (Netsis) <span class="text-red-500">*</span></label>
                    <input v-model="cariNo" type="text" placeholder="120.01.0001" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm font-mono" />
                  </div>
                  <div>
                    <label class="block text-xs text-ink-500 mb-0.5">Kredi Limiti (₺)</label>
                    <input v-model.number="creditLimit" type="number" min="0" step="1000" placeholder="0 = limitsiz" class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm" />
                  </div>
                </div>
              </fieldset>

              <!-- Test badge -->
              <div v-if="mode === 'test'" class="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center gap-2 text-sm text-purple-700">
                <Icon name="lucide:flask-conical" class="w-4 h-4 shrink-0" />
                Test verisi otomatik dolduruldu. Dilersen değiştirip kaydedebilirsin.
              </div>
            </div>
          </div>

          <!-- Footer -->
          <footer
            v-if="step === 'form'"
            class="px-6 py-4 border-t border-ink-200 bg-ink-50 shrink-0 flex justify-between items-center"
          >
            <div class="text-xs text-ink-400">
              <span class="text-red-500">*</span> zorunlu alanlar
            </div>
            <div class="flex gap-3">
              <button
                @click="emit('close')"
                class="px-4 py-2.5 bg-white border border-ink-300 text-ink-700 text-sm font-medium rounded-lg hover:bg-ink-50 transition-colors"
              >
                İptal
              </button>
              <button
                v-if="mode !== 'test'"
                @click="fillTest()"
                class="px-4 py-2.5 bg-purple-50 border border-purple-200 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2"
              >
                <Icon name="lucide:flask-conical" class="w-3.5 h-3.5" />
                Test Verisi Doldur
              </button>
              <button
                @click="submit"
                :disabled="!formValid"
                :class="[
                  'px-5 py-2.5 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2',
                  formValid
                    ? mode === 'test'
                      ? 'bg-purple-600 hover:bg-purple-700'
                      : isPlasiyer ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-ink-300 cursor-not-allowed',
                ]"
              >
                <Icon :name="mode === 'test' ? 'lucide:flask-conical' : isPlasiyer ? 'lucide:user-plus' : 'lucide:building-2'" class="w-4 h-4" />
                {{ mode === 'test' ? (isPlasiyer ? 'Test Plasiyer Oluştur' : 'Test Bayi Oluştur') : (isPlasiyer ? 'Plasiyer Oluştur' : 'Bayi Oluştur') }}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
