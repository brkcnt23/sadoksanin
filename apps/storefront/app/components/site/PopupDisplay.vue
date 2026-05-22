<script setup lang="ts">
/**
 * PopupDisplay — Shows active popups/campaigns based on user role/identity.
 * Respects showOnce via localStorage. Tracks impressions and clicks.
 */
import { ref, onMounted, watch } from 'vue'

const { isAuthenticated, user } = useAuth()
const { isDealer, dealer } = useDealer()

interface PopupData {
  id: string
  title: string
  bodyHtml?: string
  imageUrl?: string
  ctaText?: string
  ctaUrl?: string
  audience: string
  dealerIds: string[]
  showOnce: boolean
}

const popup = ref<PopupData | null>(null)
const visible = ref(false)

const STORAGE_KEY = 'sdksn-closed-popups'

function isDismissed(id: string): boolean {
  if (!import.meta.client) return true
  try {
    const closed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    return !!closed[id]
  } catch {
    return false
  }
}

function markDismissed(id: string) {
  if (!import.meta.client) return
  try {
    const closed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
    closed[id] = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(closed))
  } catch {
    /* ignore */
  }
}

async function trackImpression(id: string) {
  try {
    await $fetch(`/api/admin/popups/${id}/impression`, { method: 'POST' })
  } catch {
    /* non-critical */
  }
}

async function trackClick(id: string) {
  try {
    await $fetch(`/api/admin/popups/${id}/click`, { method: 'POST' })
  } catch {
    /* non-critical */
  }
}

async function fetchPopup() {
  try {
    const data = await $fetch<PopupData[]>('/api/admin/popups/active', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth-token') ?? ''}`,
      },
    })
    if (Array.isArray(data) && data.length > 0) {
      // Pick the first active popup that hasn't been dismissed
      for (const p of data) {
        if (!p.showOnce || !isDismissed(p.id)) {
          popup.value = p
          visible.value = true
          trackImpression(p.id)
          return
        }
      }
    }
  } catch {
    /* No popup available or API unreachable — silent */
  }
}

function close() {
  visible.value = false
  if (popup.value?.showOnce) {
    markDismissed(popup.value.id)
  }
}

function handleCta() {
  if (popup.value?.ctaUrl) {
    trackClick(popup.value.id)
    navigateTo(popup.value.ctaUrl)
    close()
  }
}

// Watch for auth state changes to re-fetch popup
watch(() => isAuthenticated.value, () => {
  fetchPopup()
})

onMounted(() => {
  // Small delay so auth hydrates first
  setTimeout(fetchPopup, 500)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="popup">
      <div
        v-if="visible && popup"
        class="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="popup.title"
        @click.self="close"
      >
        <div class="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
          <!-- Close button -->
          <button
            class="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-500 hover:text-gray-800 transition-colors shadow-sm"
            aria-label="Kapat"
            @click="close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- Image -->
          <img
            v-if="popup.imageUrl"
            :src="popup.imageUrl"
            :alt="popup.title"
            class="w-full h-48 object-cover"
          />

          <!-- Content -->
          <div class="p-6">
            <h3 class="text-xl font-bold text-gray-900 mb-2">
              {{ popup.title }}
            </h3>
            <div
              v-if="popup.bodyHtml"
              class="text-gray-600 text-sm leading-relaxed mb-6 prose prose-sm max-w-none"
              v-html="popup.bodyHtml"
            />

            <!-- CTA -->
            <button
              v-if="popup.ctaText"
              class="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl transition-colors"
              @click="handleCta"
            >
              {{ popup.ctaText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.popup-enter-active { transition: opacity 0.2s ease; }
.popup-leave-active { transition: opacity 0.15s ease; }
.popup-enter-from,
.popup-leave-to { opacity: 0; }
</style>
