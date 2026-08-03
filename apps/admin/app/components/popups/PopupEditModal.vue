<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { PopupItem } from '~/stores/popups'

interface Props {
  popup?: PopupItem
  isOpen: boolean
}

interface Emits {
  (e: 'close'): void
  (e: 'save', data: Partial<PopupItem> & { id?: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
})

const emit = defineEmits<Emits>()

const dealers = useDealersStore()

// NOT: Alan adları backend/Prisma Popup modeliyle birebir aynı olmalı
// (bodyHtml, ctaText, isActive, startDate, endDate, audience BÜYÜK HARF).
// Eskiden ~/types'daki farklı-isimli Popup tipi kullanılıyordu (body,
// ctaLabel, active, startsAt/endsAt, audience küçük harf) — bu yüzden
// popup oluşturma/güncelleme backend'e hiçbir zaman doğru veri
// göndermiyordu (Prisma enum hatası veya sessizce boş/pasif kayıt).
const form = ref({
  title: '',
  bodyHtml: '',
  imageUrl: '',
  ctaText: '',
  ctaUrl: '',
  audience: 'ALL' as PopupItem['audience'],
  dealerIds: [] as string[],
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0],
  isActive: false,
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
          bodyHtml: props.popup.bodyHtml || '',
          imageUrl: props.popup.imageUrl || '',
          ctaText: props.popup.ctaText || '',
          ctaUrl: props.popup.ctaUrl || '',
          audience: props.popup.audience,
          dealerIds: props.popup.dealerIds || [],
          startDate: props.popup.startDate ? props.popup.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
          endDate: props.popup.endDate ? props.popup.endDate.split('T')[0] : new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0],
          isActive: props.popup.isActive,
        }
      } else {
        // Create mode: reset to defaults
        form.value = {
          title: '',
          bodyHtml: '',
          imageUrl: '',
          ctaText: '',
          ctaUrl: '',
          audience: 'ALL',
          dealerIds: [],
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 86_400_000).toISOString().split('T')[0],
          isActive: false,
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

  if (!form.value.bodyHtml.trim()) {
    errors.value.bodyHtml = 'İçerik gerekli'
  }

  if (!form.value.startDate) {
    errors.value.startDate = 'Başlangıç tarihi gerekli'
  }

  if (!form.value.endDate) {
    errors.value.endDate = 'Bitiş tarihi gerekli'
  }

  if (form.value.startDate && form.value.endDate && form.value.startDate >= form.value.endDate) {
    errors.value.endDate = 'Bitiş tarihi başlangıç tarihinden sonra olmalı'
  }

  if (form.value.audience === 'SPECIFIC_DEALER' && form.value.dealerIds.length === 0) {
    errors.value.dealerIds = 'En az bir bayi seçilmeli'
  }

  return Object.keys(errors.value).length === 0
}

const handleSave = async () => {
  if (!validate()) return

  loading.value = true
  try {
    const payload: Partial<PopupItem> & { id?: string } = {
      title: form.value.title,
      bodyHtml: form.value.bodyHtml,
      imageUrl: form.value.imageUrl || undefined,
      ctaText: form.value.ctaText || undefined,
      ctaUrl: form.value.ctaUrl || undefined,
      audience: form.value.audience,
      dealerIds: form.value.audience === 'SPECIFIC_DEALER' ? form.value.dealerIds : undefined,
      startDate: form.value.startDate ? new Date(form.value.startDate).toISOString() : new Date().toISOString(),
      endDate: form.value.endDate ? new Date(form.value.endDate).toISOString() : new Date().toISOString(),
      isActive: form.value.isActive,
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
          <div class="sticky top-0 bg-white border-b border-ink-200 px-6 py-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-ink-900">
              {{ popup ? 'Popup Düzenle' : 'Yeni Popup' }}
            </h2>
            <button @click="handleClose" class="text-ink-400 hover:text-ink-600">
              <Icon name="lucide:x" class="w-5 h-5" />
            </button>
          </div>

          <!-- Form -->
          <div class="p-6 space-y-5">
            <!-- Title -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">Başlık *</label>
              <input
                v-model="form.title"
                type="text"
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. Yaz Kampanyası"
              />
              <p v-if="errors.title" class="text-xs text-red-600 mt-1">{{ errors.title }}</p>
            </div>

            <!-- Body (Rich Text) -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">İçerik (HTML) *</label>
              <textarea
                v-model="form.bodyHtml"
                rows="4"
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="<p>Kampanya açıklaması...</p>"
              />
              <p v-if="errors.bodyHtml" class="text-xs text-red-600 mt-1">{{ errors.bodyHtml }}</p>
            </div>

            <!-- Image URL -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">Görsel</label>

              <!-- Kare önizleme + yükleme alanı. Popup'ta görsel kare (1:1)
                   gösterildiği için buradaki önizleme de kare tutuluyor;
                   yönetici tam olarak ne görüneceğini görür. -->
              <div v-if="form.imageUrl" class="mb-3">
                <div class="relative w-40 h-40 rounded-lg overflow-hidden border border-ink-200 bg-ink-50">
                  <img :src="form.imageUrl" alt="Popup görseli" class="w-full h-full object-cover" />
                  <button
                    type="button"
                    class="absolute top-1.5 right-1.5 w-7 h-7 grid place-items-center rounded-full bg-white/90 hover:bg-white text-ink-600 hover:text-red-600 shadow-sm"
                    title="Görseli kaldır"
                    @click="form.imageUrl = ''"
                  >
                    <Icon name="lucide:x" class="w-4 h-4" />
                  </button>
                </div>
                <p class="text-[11px] text-ink-500 mt-1.5">Kare (1:1) gösterilir</p>
              </div>

              <UiImageUploadZone
                v-else
                :model-value="[]"
                label=""
                :multiple="false"
                @update:model-value="(urls) => (form.imageUrl = urls[0] || '')"
              />

              <!-- Dilerseniz dosya yüklemek yerine dış bir adres de verebilirsiniz -->
              <input
                v-model="form.imageUrl"
                type="url"
                class="w-full mt-2 px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="veya görsel adresi yapıştırın: https://..."
              />
            </div>

            <!-- CTA -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-ink-700 mb-1.5">Düğme Metni</label>
                <input
                  v-model="form.ctaText"
                  type="text"
                  class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Daha Fazla"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-ink-700 mb-1.5">Düğme Linki</label>
                <input
                  v-model="form.ctaUrl"
                  type="url"
                  class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="https://..."
                />
              </div>
            </div>

            <!-- Audience -->
            <div>
              <label class="block text-sm font-medium text-ink-700 mb-1.5">Hedef Kitle *</label>
              <select
                v-model="form.audience"
                class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">Tüm Kullanıcılar</option>
                <option value="B2C">Sadece B2C (Perakende)</option>
                <option value="B2B">Sadece B2B (Toptan)</option>
                <option value="SPECIFIC_DEALER">Seçili Bayiler</option>
              </select>
            </div>

            <!-- Dealer Selection (conditional) -->
            <div v-if="form.audience === 'SPECIFIC_DEALER'">
              <label class="block text-sm font-medium text-ink-700 mb-1.5">Bayiler *</label>
              <div class="space-y-2">
                <div class="relative">
                  <div class="flex flex-wrap gap-2 p-2 border border-ink-300 rounded-lg bg-ink-50 min-h-10">
                    <span
                      v-for="dealerId in form.dealerIds"
                      :key="dealerId"
                      class="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium"
                    >
                      {{ dealers.items.find((d) => d.id === dealerId)?.name || dealerId }}
                      <button type="button" @click="form.dealerIds = form.dealerIds.filter((id) => id !== dealerId)">
                        <Icon name="lucide:x" class="w-3 h-3" />
                      </button>
                    </span>
                  </div>
                </div>

                <!-- Dealer dropdown -->
                <div class="border border-ink-300 rounded-lg max-h-40 overflow-y-auto">
                  <button
                    v-for="dealer in dealers.items"
                    :key="dealer.id"
                    type="button"
                    :class="[
                      'w-full text-left px-3 py-2 text-sm hover:bg-ink-100 border-b border-ink-100 last:border-b-0',
                      form.dealerIds.includes(dealer.id) ? 'bg-primary-50' : '',
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
                        class="w-4 h-4 rounded border-ink-300"
                      />
                      <span class="font-medium">{{ dealer.name }}</span>
                      <span class="text-xs text-ink-500">{{ dealer.city }}</span>
                    </div>
                  </button>
                </div>
              </div>
              <p v-if="errors.dealerIds" class="text-xs text-red-600 mt-1">{{ errors.dealerIds }}</p>
            </div>

            <!-- Dates -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-ink-700 mb-1.5">Başlangıç Tarihi *</label>
                <input
                  v-model="form.startDate"
                  type="date"
                  class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p v-if="errors.startDate" class="text-xs text-red-600 mt-1">{{ errors.startDate }}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-ink-700 mb-1.5">Bitiş Tarihi *</label>
                <input
                  v-model="form.endDate"
                  type="date"
                  class="w-full px-3 py-2 border border-ink-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p v-if="errors.endDate" class="text-xs text-red-600 mt-1">{{ errors.endDate }}</p>
              </div>
            </div>

            <!-- Active toggle -->
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium text-ink-700">Aktif Yayında</label>
              <button
                type="button"
                @click="form.isActive = !form.isActive"
                :class="[
                  'relative inline-flex h-5 w-9 rounded-full transition-colors',
                  form.isActive ? 'bg-primary-600' : 'bg-ink-300',
                ]"
              >
                <span
                  :class="[
                    'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    form.isActive ? 'translate-x-4' : 'translate-x-0.5',
                  ]"
                />
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="sticky bottom-0 bg-ink-50 border-t border-ink-200 px-6 py-4 flex items-center justify-end gap-3">
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
