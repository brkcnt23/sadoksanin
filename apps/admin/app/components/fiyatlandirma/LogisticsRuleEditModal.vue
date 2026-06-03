<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { LogisticsRule } from '~/types'
import { formatPrice } from '~/utils/storage'

interface Props {
  rule?: LogisticsRule
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: Partial<LogisticsRule>): void
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

const emit = defineEmits<Emits>()

// Note: No stores needed, all data is passed via props/emits

// Form state
const form = ref({
  baseSurcharge: 0,
  perKgSurcharge: 0,
  perM2Surcharge: 0,
  freeShippingThreshold: '' as string | number,
  active: true,
})

const loading = ref(false)
const errors = ref<Record<string, string>>({})

// Reset form when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.rule) {
      form.value = {
        baseSurcharge: props.rule.baseSurcharge,
        perKgSurcharge: props.rule.perKgSurcharge,
        perM2Surcharge: props.rule.perM2Surcharge,
        freeShippingThreshold: props.rule.freeShippingThreshold || '',
        active: props.rule.active,
      }
      errors.value = {}
    }
  },
  { immediate: true },
)

// Validation
const validate = (): boolean => {
  errors.value = {}

  if (typeof form.value.baseSurcharge !== 'number' || form.value.baseSurcharge < 0) {
    errors.value.baseSurcharge = 'Sabit ücret 0 veya daha büyük olmalı'
  }

  if (typeof form.value.perKgSurcharge !== 'number' || form.value.perKgSurcharge < 0) {
    errors.value.perKgSurcharge = 'KG başına ücret 0 veya daha büyük olmalı'
  }

  if (typeof form.value.perM2Surcharge !== 'number' || form.value.perM2Surcharge < 0) {
    errors.value.perM2Surcharge = 'm² başına ücret 0 veya daha büyük olmalı'
  }

  if (form.value.freeShippingThreshold !== '' && form.value.freeShippingThreshold !== null) {
    const val = Number(form.value.freeShippingThreshold)
    if (isNaN(val) || val < 0) {
      errors.value.freeShippingThreshold = 'Ücretsiz gönderim eşiği 0 veya daha büyük olmalı'
    }
  }

  return Object.keys(errors.value).length === 0
}

const handleSave = async () => {
  if (!validate()) return

  loading.value = true
  try {
    const payload: Partial<LogisticsRule> = {
      id: props.rule!.id,
      baseSurcharge: form.value.baseSurcharge,
      perKgSurcharge: form.value.perKgSurcharge,
      perM2Surcharge: form.value.perM2Surcharge,
      freeShippingThreshold:
        form.value.freeShippingThreshold !== '' ? Number(form.value.freeShippingThreshold) : undefined,
      active: form.value.active,
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
      <div v-if="isOpen && rule" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-lg max-w-xl w-full">
          <!-- Header -->
          <div class="border-b border-ink-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-ink-900">{{ rule.region }}</h2>
              <p class="text-xs text-ink-500 mt-1">
                {{ rule.cities.join(', ') }}
              </p>
            </div>
            <button @click="handleClose" class="text-ink-400 hover:text-ink-600">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>

          <!-- Form -->
          <div class="p-6 space-y-4">
            <!-- Base Surcharge -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">Sabit Nakliye Ücreti (₺) *</label>
              <input
                v-model.number="form.baseSurcharge"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p v-if="errors.baseSurcharge" class="text-xs text-red-600 mt-1">{{ errors.baseSurcharge }}</p>
            </div>

            <!-- Per KG Surcharge -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">KG Başına Ücret (₺) *</label>
              <input
                v-model.number="form.perKgSurcharge"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p v-if="errors.perKgSurcharge" class="text-xs text-red-600 mt-1">{{ errors.perKgSurcharge }}</p>
            </div>

            <!-- Per M2 Surcharge -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">m² Başına Ücret (₺) *</label>
              <input
                v-model.number="form.perM2Surcharge"
                type="number"
                step="0.01"
                min="0"
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p v-if="errors.perM2Surcharge" class="text-xs text-red-600 mt-1">{{ errors.perM2Surcharge }}</p>
            </div>

            <!-- Free Shipping Threshold -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">Ücretsiz Nakliye Eşiği (₺) (İsteğe Bağlı)</label>
              <input
                v-model="form.freeShippingThreshold"
                type="number"
                step="0.01"
                min="0"
                placeholder="Boş bırakınız: sınır yok"
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p class="text-xs text-ink-500 mt-1">
                Bu eşikin üzerindeki siparişler nakliye ücretsiz (0 TL)
              </p>
              <p v-if="errors.freeShippingThreshold" class="text-xs text-red-600 mt-1">
                {{ errors.freeShippingThreshold }}
              </p>
            </div>

            <!-- Preview -->
            <div class="bg-ink-50 border border-ink-200 rounded-lg p-4 space-y-2">
              <p class="text-xs font-medium text-ink-700">Örnekler:</p>
              <div class="text-xs text-ink-600 space-y-1">
                <p>
                  • 100₺ arası ürün: {{ formatPrice(form.baseSurcharge + form.perKgSurcharge * 10) }} (sabit +
                  10kg)
                </p>
                <p>
                  • 5m² ürün: {{ formatPrice(form.baseSurcharge + form.perM2Surcharge * 5) }} (sabit + 5m²)
                </p>
                <p v-if="form.freeShippingThreshold">
                  • {{ formatPrice(Number(form.freeShippingThreshold)) }} üzeri: ÜCRETSIZ
                </p>
              </div>
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
