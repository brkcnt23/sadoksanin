<script setup lang="ts">
import { ref } from 'vue'
import { formatDate } from '~/utils/storage'
import type { Popup } from '~/types'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Popup & Kampanya | Sadöksan Admin',
})

const popups = usePopupsStore()
const dealers = useDealersStore()

const showEditModal = ref(false)
const selectedPopup = ref<Popup | undefined>()

onMounted(() => {
  if (!popups.loaded) popups.load()
  if (!dealers.loaded) dealers.load()
})

const audienceLabel = (a: Popup['audience']) =>
  ({ all: 'Tümü', b2c: 'B2C', b2b: 'B2B', 'dealer-specific': 'Bayi Bazlı' })[a]

const isLive = (p: Popup) =>
  p.active && new Date(p.startsAt).getTime() <= Date.now() && new Date(p.endsAt).getTime() > Date.now()

const openCreateModal = () => {
  selectedPopup.value = undefined
  showEditModal.value = true
}

const openEditModal = (popup: Popup) => {
  selectedPopup.value = popup
  showEditModal.value = true
}

const handleSavePopup = (data: Partial<Popup>) => {
  popups.upsert(data)
}

const confirmDelete = (title: string) => window.confirm(`${title} silinsin mi?`)
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="Popup & Kampanya"
      description="Storefront ve bayi paneline özel duyuru/kampanya yayını."
    >
      <template #actions>
        <button
          @click="openCreateModal"
          class="px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md flex items-center gap-2"
        >
          <Icon name="lucide:plus" class="w-4 h-4" />
          Yeni Popup
        </button>
      </template>
    </PageHeader>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Toplam Popup" :value="popups.items.length" icon="lucide:megaphone" color="blue" />
      <StatCard label="Aktif Yayında" :value="popups.activeNow.length" icon="lucide:play-circle" color="green" />
      <StatCard
        label="Toplam Görüntülenme"
        :value="popups.items.reduce((s, p) => s + p.impressions, 0).toLocaleString('tr-TR')"
        icon="lucide:eye"
        color="purple"
      />
    </div>

    <div v-if="popups.items.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div v-for="p in popups.items" :key="p.id" class="bg-white rounded-xl border border-ink-200 p-5">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div class="min-w-0 flex-1">
            <h3 class="font-semibold text-ink-900 truncate">{{ p.title }}</h3>
            <div class="flex items-center gap-2 mt-1.5">
              <StatusBadge :variant="isLive(p) ? 'success' : 'neutral'" :label="isLive(p) ? 'Yayında' : 'Pasif'" />
              <StatusBadge variant="info" :label="audienceLabel(p.audience)" />
            </div>
          </div>
          <button
            @click="popups.toggle(p.id)"
            :class="[
              'relative inline-flex h-5 w-9 rounded-full transition-colors shrink-0',
              p.active ? 'bg-primary-600' : 'bg-ink-300',
            ]"
          >
            <span
              :class="[
                'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
                p.active ? 'tranink-x-4' : 'tranink-x-0.5',
              ]"
            />
          </button>
        </div>
        <div class="text-sm text-ink-600 line-clamp-2" v-html="p.body" />
        <dl class="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-ink-100 text-xs">
          <div>
            <dt class="text-ink-500">Başlangıç</dt>
            <dd class="font-medium text-ink-700 mt-0.5">{{ formatDate(p.startsAt, { hour: undefined, minute: undefined }) }}</dd>
          </div>
          <div>
            <dt class="text-ink-500">Bitiş</dt>
            <dd class="font-medium text-ink-700 mt-0.5">{{ formatDate(p.endsAt, { hour: undefined, minute: undefined }) }}</dd>
          </div>
          <div>
            <dt class="text-ink-500">CTR</dt>
            <dd class="font-medium text-ink-700 mt-0.5">
              {{ p.impressions > 0 ? ((p.clicks / p.impressions) * 100).toFixed(1) : '0' }}%
            </dd>
          </div>
        </dl>
        <div class="mt-3 flex items-center justify-end gap-1">
          <button
            @click="openEditModal(p)"
            class="px-2.5 py-1 text-xs font-medium text-ink-700 hover:bg-ink-100 rounded"
          >
            Düzenle
          </button>
          <button
            @click="confirmDelete(p.title) && popups.remove(p.id)"
            class="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
    <EmptyState v-else icon="lucide:megaphone" title="Henüz popup oluşturulmadı" />
  </div>

  <!-- Popup Edit Modal -->
  <PopupsPopupEditModal
    :popup="selectedPopup"
    :is-open="showEditModal"
    @save="handleSavePopup"
    @close="showEditModal = false"
  />
</template>
