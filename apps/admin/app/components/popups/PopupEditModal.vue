<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Popup } from '~/types'

interface Props {
  popup?: Popup
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: Partial<Popup>): void
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

const emit = defineEmits<Emits>()

const dealers = useDealersStore()

const form = ref({
  title: '',
  body: '',
  imageUrl: '',
  ctaLabel: '',
  ctaUrl: '',
  audience: 'all' as Popup['audience'],
  dealerIds: [] as string[],
  startsAt: new Date().toISOString().split('T')[0],
  endsAt: new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0],
  active: false,
})

const loading = ref(false)
const errors = ref<Record<string, string>>({})

onMounted(() => {
  if (!dealers.loaded) dealers.load()
})

// Reset form when modal opens/closes
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      if (props.popup) {
        // Edit mode: populate from existing popup
        form.value = {
          title: props.popup.title,
          body: props.popup.body,
          imageUrl: props.popup.imageUrl || '',
          ctaLabel: props.popup.ctaLabel || '',
          ctaUrl: props.popup.ctaUrl || '',
          audience: props.popup.audience,
          dealerIds: props.popup.dealerIds || [],
          startsAt: props.popup.startsAt.split('T')[0],
          endsAt: props.popup.endsAt.split('T')[0],
          active: props.popup.active,
        }
      } else {
        // Create mode: reset to defaults
        form.value = {
          title: '',
          body: '',
          imageUrl: '',
          ctaLabel: '',
          ctaUrl: '',
          audience: 'all',
          dealerIds: [],
          startsAt: new Date().toISOString().split('T')[0],
          endsAt: new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0],
          active: false,
        }
      }
      errors.value = {}
    }
  },
  { immediate: true },
)

// Validation
const validate = (): boolean => {
  errors.value = {}

  if (!form.value.title.trim()) {
    errors.value.title = 'Başlık gerekli'
  }

  if (!form.value.body.trim()) {
    errors.value.body = 'İçerik gerekli'
  }

  if (!form.value.startsAt) {
    errors.value.startsAt = 'Başlangıç tarihi gerekli'
  }

  if (!form.value.endsAt) {
    errors.value.endsAt = 'Bitiş tarihi gerekli'
  }

  if (form.value.startsAt && form.value.endsAt && form.value.startsAt >= form.value.endsAt) {
    errors.value.endsAt = 'Bitiş tarihi başlangıç tarihinden sonra olmalı'
  }

  if (form.value.audience === 'dealer-specific' && form.value.dealerIds.length === 0) {
    errors.value.dealerIds = 'En az bir bayi seçilmeli'
  }

  return Object.keys(errors.value).length === 0
}

const handleSave = async () => {
  if (!validate()) return

  loading.value = true
  try {
    const payload: Partial<Popup> = {
      title: form.value.title,
      body: form.value.body,
      imageUrl: form.value.imageUrl || undefined,
      ctaLabel: form.value.ctaLabel || undefined,
      ctaUrl: form.value.ctaUrl || undefined,
      audience: form.value.audience,
      dealerIds: form.value.audience === 'dealer-specific' ? form.value.dealerIds : undefined,
      startsAt: form.value.startsAt ? new Date(form.value.startsAt).toISOString() : new Date().toISOString(),
      endsAt: form.value.endsAt ? new Date(form.value.endsAt).toISOString() : new Date().toISOString(),
      active: form.value.active,
    }

    if (props.popup?.id) {
      payload.id = props.popup.id
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
        <div class="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <!-- Header -->
          <div class="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-slate-900">
              {{ popup ? 'Popup Düzenle' : 'Yeni Popup' }}
            </h2>
            <button @click="handleClose" class="text-slate-400 hover:text-slate-600">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>

          <!-- Form -->
          <div class="p-6 space-y-5">
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Başlık *</label>
              <input
                v-model="form.title"
                type="text"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. Yaz Kampanyası"
              />
              <p v-if="errors.title" class="text-xs text-red-600 mt-1">{{ errors.title }}</p>
            </div>

            <!-- Body (Rich Text) -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">İçerik (HTML) *</label>
              <textarea
                v-model="form.body"
                rows="4"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="<p>Kampanya açıklaması...</p>"
              />
              <p v-if="errors.body" class="text-xs text-red-600 mt-1">{{ errors.body }}</p>
            </div>

            <!-- Image URL -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Görsel URL</label>
              <input
                v-model="form.imageUrl"
                type="url"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
            </div>

            <!-- CTA -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Düğme Metni</label>
                <input
                  v-model="form.ctaLabel"
                  type="text"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Daha Fazla"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Düğme Linki</label>
                <input
                  v-model="form.ctaUrl"
                  type="url"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <!-- Audience -->
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Hedef Kitle *</label>
              <select
                v-model="form.audience"
                class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tüm Kullanıcılar</option>
                <option value="b2c">Sadece B2C (Perakende)</option>
                <option value="b2b">Sadece B2B (Toptan)</option>
                <option value="dealer-specific">Seçili Bayiler</option>
              </select>
            </div>

            <!-- Dealer Selection (conditional) -->
            <div v-if="form.audience === 'dealer-specific'">
              <label class="block text-sm font-medium text-slate-700 mb-1.5">Bayiler *</label>
              <div class="space-y-2">
                <div class="relative">
                  <div class="flex flex-wrap gap-2 p-2 border border-slate-300 rounded-lg bg-slate-50 min-h-10">
                    <span
                      v-for="dealerId in form.dealerIds"
                      :key="dealerId"
                      class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium"
                    >
                      {{ dealers.items.find((d) => d.id === dealerId)?.name || dealerId }}
                      <button type="button" @click="form.dealerIds = form.dealerIds.filter((id) => id !== dealerId)">
                        <Icon name="lucide:x" class="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                </div>

                <!-- Dealer dropdown -->
                <div class="border border-slate-300 rounded-lg max-h-40 overflow-y-auto">
                  <button
                    v-for="dealer in dealers.items"
                    :key="dealer.id"
                    type="button"
                    :class="[
                      'w-full text-left px-3 py-2 text-sm hover:bg-slate-100 border-b border-slate-100 last:border-b-0',
                      form.dealerIds.includes(dealer.id) ? 'bg-blue-50' : '',
                    ]"
                    @click="
                      form.dealerIds.includes(dealer.id)
                        ? (form.dealerIds = form.dealerIds.filter((id) => id !== dealer.id))
                        : form.dealerIds.push(dealer.id)
                    "
                  >
                    <div class="flex items-center gap-2">
                      <input
                        type="checkbox"
                        :checked="form.dealerIds.includes(dealer.id)"
                        class="w-4 h-4 rounded border-slate-300"
                      />
                      <span class="font-medium">{{ dealer.name }}</span>
                      <span class="text-xs text-slate-500">{{ dealer.city }}</span>
                    </div>
                  </button>
                </div>
              </div>
              <p v-if="errors.dealerIds" class="text-xs text-red-600 mt-1">{{ errors.dealerIds }}</p>
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Başlangıç Tarihi *</label>
                <input
                  v-model="form.startsAt"
                  type="date"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p v-if="errors.startsAt" class="text-xs text-red-600 mt-1">{{ errors.startsAt }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Bitiş Tarihi *</label>
                <input
                  v-model="form.endsAt"
                  type="date"
                  class="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p v-if="errors.endsAt" class="text-xs text-red-600 mt-1">{{ errors.endsAt }}</p>
              </div>
            </div>

            <!-- Active toggle -->
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-slate-700">Aktif Yayında</label>
              <button
                type="button"
                @click="form.active = !form.active"
                :class="[
                  'relative inline-flex h-5 w-9 rounded-full transition-colors',
                  form.active ? 'bg-blue-600' : 'bg-slate-300',
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
          <div class="sticky bottom-0 bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-end gap-3">
            <button
              @click="handleClose"
              class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              İptal
            </button>
            <button
              @click="handleSave"
              :disabled="loading"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
