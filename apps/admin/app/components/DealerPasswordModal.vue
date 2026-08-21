<script setup lang="ts">
/**
 * Bayiye giriş şifresi atama modalı.
 *
 * Netsis'ten aktarılan bayilere import sırasında rastgele şifre verildi ve
 * hiçbir yere kaydedilmedi; SMTP de bağlı değil. Bu yüzden bayinin hesabına
 * erişmesinin tek yolu yöneticinin buradan şifre atayıp telefonla iletmesi.
 *
 * Şifre yalnızca atandığı anda bir kez gösterilir — sunucu bcrypt hash'i
 * saklar, düz metni saklamaz.
 */
interface Props {
  open: boolean
  dealer: { id: string; company?: string; name?: string; cariNo?: string } | null
}
const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const api = useApi()
const toast = useToast()

type Mode = 'auto' | 'manual'
type Step = 'form' | 'submitting' | 'done'

const mode = ref<Mode>('auto')
const manualPassword = ref('')
const step = ref<Step>('form')
const result = ref<{ cariNo: string; company: string; password: string } | null>(null)
const errorMessage = ref('')

const dealerLabel = computed(
  () => props.dealer?.company || props.dealer?.name || 'Bayi',
)

const canSubmit = computed(() => {
  if (step.value === 'submitting') return false
  if (mode.value === 'manual') return manualPassword.value.trim().length >= 6
  return true
})

// Modal her açıldığında sıfırla — önceki bayinin şifresi ekranda kalmasın.
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      mode.value = 'auto'
      manualPassword.value = ''
      step.value = 'form'
      result.value = null
      errorMessage.value = ''
    }
  },
)

async function submit() {
  if (!props.dealer || !canSubmit.value) return
  step.value = 'submitting'
  errorMessage.value = ''

  try {
    const body = mode.value === 'manual' ? { password: manualPassword.value.trim() } : {}
    result.value = await api.patch(`/dealer/${props.dealer.id}/password`, body)
    step.value = 'done'
    toast.push('Şifre atandı', 'success')
  } catch (err: any) {
    errorMessage.value = err?.message || 'Şifre atanamadı'
    step.value = 'form'
  }
}

async function copyCredentials() {
  if (!result.value) return
  const text = `Kullanıcı adı: ${result.value.cariNo}\nŞifre: ${result.value.password}`
  try {
    await navigator.clipboard.writeText(text)
    toast.push('Giriş bilgileri kopyalandı', 'success')
  } catch {
    toast.push('Kopyalanamadı — elle seçip kopyalayın', 'error')
  }
}
</script>

<template>
  <Modal :open="open" title="Bayi Şifresi Ata" size="md" @close="emit('close')">
    <div class="space-y-4">
      <!-- Hedef bayi -->
      <div class="rounded-lg bg-ink-50 px-3 py-2">
        <p class="text-sm font-medium text-ink-900">{{ dealerLabel }}</p>
        <p class="text-xs text-ink-500 font-mono">
          Kullanıcı adı: {{ dealer?.cariNo || '—' }}
        </p>
      </div>

      <!-- ADIM: form -->
      <template v-if="step !== 'done'">
        <div class="space-y-2">
          <label class="flex items-start gap-2 cursor-pointer">
            <input v-model="mode" type="radio" value="auto" class="mt-1" />
            <span>
              <span class="text-sm font-medium text-ink-900">Şifre üret</span>
              <span class="block text-xs text-ink-500">
                Telefonda okunabilir 8 karakter — karışan harfler (O/0, I/l) kullanılmaz.
              </span>
            </span>
          </label>

          <label class="flex items-start gap-2 cursor-pointer">
            <input v-model="mode" type="radio" value="manual" class="mt-1" />
            <span>
              <span class="text-sm font-medium text-ink-900">Kendim yazayım</span>
              <span class="block text-xs text-ink-500">En az 6 karakter.</span>
            </span>
          </label>
        </div>

        <input
          v-if="mode === 'manual'"
          v-model="manualPassword"
          type="text"
          autocomplete="off"
          placeholder="Yeni şifre"
          class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm font-mono"
          @keyup.enter="submit()"
        />

        <p v-if="errorMessage" class="text-sm text-red-600">{{ errorMessage }}</p>

        <p class="text-xs text-ink-500">
          Bayinin mevcut şifresi geçersiz olur. Yeni şifre bu ekranda
          <strong>bir kez</strong> gösterilir.
        </p>
      </template>

      <!-- ADIM: sonuç -->
      <template v-else-if="result">
        <div class="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
          <div>
            <p class="text-xs text-emerald-800">Kullanıcı adı</p>
            <p class="font-mono text-base font-semibold text-emerald-900">
              {{ result.cariNo }}
            </p>
          </div>
          <div>
            <p class="text-xs text-emerald-800">Şifre</p>
            <p class="font-mono text-base font-semibold tracking-wider text-emerald-900">
              {{ result.password }}
            </p>
          </div>
        </div>

        <p class="text-xs text-ink-500">
          Bu şifre bir daha gösterilmez. Bayiye iletin; bayi giriş yaptıktan sonra
          profil ekranından kendi şifresini belirleyebilir.
        </p>
      </template>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <button
          v-if="step !== 'done'"
          class="px-4 py-2 text-sm text-ink-600 hover:text-ink-900"
          @click="emit('close')"
        >
          Vazgeç
        </button>
        <button
          v-if="step !== 'done'"
          :disabled="!canSubmit"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="submit()"
        >
          {{ step === 'submitting' ? 'Atanıyor…' : 'Şifreyi Ata' }}
        </button>

        <template v-else>
          <button
            class="px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50"
            @click="copyCredentials()"
          >
            Kopyala
          </button>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-ink-900 rounded-lg hover:bg-ink-800"
            @click="emit('close')"
          >
            Kapat
          </button>
        </template>
      </div>
    </template>
  </Modal>
</template>
