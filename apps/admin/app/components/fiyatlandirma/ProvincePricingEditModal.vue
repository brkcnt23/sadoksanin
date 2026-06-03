<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ProvincePricingSurcharge } from '~/types'

interface Props {
  province?: string
  isOpen: boolean
  existingSurcharge?: ProvincePricingSurcharge
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: Partial<ProvincePricingSurcharge> & { province: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const form = ref({
  province: '',
  surcharge: 0,
  description: '',
  active: true,
})

const loading = ref(false)
const errors = ref<Record<string, string>>({})

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      if (props.existingSurcharge) {
        form.value = {
          province: props.existingSurcharge.province,
          surcharge: props.existingSurcharge.surcharge,
          description: props.existingSurcharge.description || '',
          active: props.existingSurcharge.active,
        }
      } else if (props.province) {
        form.value = {
          province: props.province,
          surcharge: 0,
          description: '',
          active: true,
        }
      }
      errors.value = {}
    }
  },
  { immediate: true },
)

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.province) {
    errors.value.province = 'İl seçilmeli'
  }

  if (typeof form.value.surcharge !== 'number' || form.value.surcharge < 0) {
    errors.value.surcharge = 'Ücret 0 veya daha büyük olmalı'
  }

  return Object.keys(errors.value).length === 0
}

const handleSave = async () => {
  if (!validate()) return

  loading.value = true
  try {
    const payload: Partial<ProvincePricingSurcharge> & { province: string } = {
      province: form.value.province,
      surcharge: form.value.surcharge,
      description: form.value.description,
      active: form.value.active,
    }

    if (props.existingSurcharge?.id) {
      payload.id = props.existingSurcharge.id
    }

    emit('save', payload)
    await nextTick()
    emit('close')
  } finally {
    loading.value = false
  }
}

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg max-w-md w-full">
          <!-- Header -->
          <div class="border-b border-ink-200 px-6 py-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-ink-900">
              {{ existingSurcharge ? 'İl Fiyatlandırmasını Düzenle' : 'Yeni İl Fiyatlandırması' }}
            </h2>
            <button @click="handleClose" class="text-ink-400 hover:text-ink-600">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>

          <!-- Form -->
          <div class="p-6 space-y-4">
            <!-- Province -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">İl Adı *</label>
              <input
                v-model="form.province"
                type="text"
                placeholder="örn. Aydın"
                disabled
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm bg-ink-100 text-ink-600"
              />
              <p v-if="errors.province" class="text-xs text-red-600 mt-1">{{ errors.province }}</p>
            </div>

            <!-- Surcharge -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">Ek Ücret (₺) *</label>
              <input
                v-model.number="form.surcharge"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p v-if="errors.surcharge" class="text-xs text-red-600 mt-1">{{ errors.surcharge }}</p>
              <p class="text-xs text-ink-500 mt-1">Bu ücret, bölge fiyatını override eder.</p>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">Açıklama (İsteğe Bağlı)</label>
              <input
                v-model="form.description"
                type="text"
                placeholder="örn. Aydın ili özel fiyat"
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <!-- Active toggle -->
            <div class="flex items-center justify-between pt-2">
              <label class="text-sm font-medium text-ink-700">Aktif</label>
              <button
                type="button"
                @click="form.active = !form.active"
                :class="[
                  'relative inline-flex h-5 w-9 rounded-full transition-colors',
                  form.active ? 'bg-primary-600' : 'bg-ink-300',
                ]"
              >
                <span
                  :class="[
                    'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    form.active ? 'translate-x-4' : 'translate-x-0.5',
                  ]"
                />
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="bg-ink-50 border-t border-ink-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              @click="handleClose"
              class="px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-300 rounded-lg hover:bg-ink-50"
            >
              İptal
            </button>
            <button
              @click="handleSave"
              :disabled="loading"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {{ loading ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
