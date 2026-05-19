<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  title: 'Hesabım | Sadöksan İnşaat',
  description: 'Hesap bilgilerinizi yönetin.',
})

const { logout, getUser, isAuthenticated } = useAuth()

// Redirect if not authenticated (after hydration attempt)
watchEffect(() => {
  if (!isAuthenticated.value) {
    navigateTo('/giris')
  }
})

const navItems = [
  { icon: 'lucide:user', label: 'Profil Bilgileri', to: '/hesabim', active: true },
  { icon: 'lucide:package', label: 'Siparişlerim', to: '/siparislerim', active: false },
  { icon: 'lucide:heart', label: 'Favori Ürünler', to: '/favori-urunler', active: false },
  { icon: 'lucide:log-out', label: 'Çıkış Yap', action: 'logout', active: false },
]

const handleLogout = () => {
  logout()
  navigateTo('/giris')
}

const isEditing = ref(false)
const editForm = ref<Record<string, string>>({})

const startEdit = () => {
  const u = getUser()
  if (!u) return
  editForm.value = {
    name: u.name || '',
    email: u.email || '',
    phone: (u as any).phone || '',
    city: (u as any).city || '',
    address: (u as any).address || '',
  }
  isEditing.value = true
}

const saveChanges = () => {
  // TODO: API call to update profile — PATCH /auth/me
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}

const initials = computed(() => {
  const u = getUser()
  if (!u?.name) return '?'
  return u.name
    .split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 lg:py-16">
    <div class="px-6 lg:px-12 mx-auto max-w-7xl">
      <div class="mb-12">
        <h1 class="text-4xl font-bold text-primary-900 mb-2">Hesap Yönetimi</h1>
        <p class="text-ink-600">Profil bilgilerinizi düzenleyin ve siparişlerinizi takip edin</p>
      </div>

      <div class="grid lg:grid-cols-4 gap-6">
        <!-- Sidebar Navigation -->
        <aside class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-md overflow-hidden sticky top-24">
            <div class="bg-gradient-to-r from-primary-900 to-accent-600 text-white p-6 text-center">
              <div
                class="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mx-auto mb-4"
              >
                {{ initials }}
              </div>
              <h3 class="font-bold text-lg">{{ getUser()?.name || 'Kullanıcı' }}</h3>
              <p class="text-white/80 text-sm mt-1">{{ getUser()?.email }}</p>
            </div>

            <nav class="p-4 space-y-2">
              <NuxtLink
                v-for="(item, idx) in navItems.slice(0, 3)"
                :key="idx"
                :to="item.to"
                class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all"
                :class="
                  item.active
                    ? 'bg-accent-100 text-accent-700 border border-accent-200'
                    : 'text-primary-900 hover:bg-ink-50 border border-transparent'
                "
              >
                <Icon :name="item.icon" class="h-5 w-5" />
                <span>{{ item.label }}</span>
              </NuxtLink>

              <!-- Dealer Dashboard Button (Only for DEALER users) -->
              <NuxtLink
                v-if="getUser()?.role === 'DEALER'"
                to="/dealer"
                class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-primary-900 hover:bg-blue-50 border border-transparent hover:border-blue-200 bg-blue-50/50"
              >
                <Icon name="lucide:chart-line" class="h-5 w-5 text-blue-600" />
                <span class="text-blue-700">Dashboard</span>
              </NuxtLink>

              <button
                @click="handleLogout"
                class="w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-primary-900 hover:bg-red-50 border border-transparent transition-all"
              >
                <Icon name="lucide:log-out" class="h-5 w-5" />
                <span>Çıkış Yap</span>
              </button>
            </nav>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="lg:col-span-3">
          <div class="bg-white rounded-xl shadow-md overflow-hidden">
            <div
              class="bg-gradient-to-r from-primary-50 to-accent-50 p-6 border-b border-ink-100 flex items-center justify-between"
            >
              <div>
                <h2 class="text-2xl font-bold text-primary-900">Profil Bilgileri</h2>
                <p class="text-ink-600 text-sm mt-1">Kişisel bilgilerinizi güncelleyin</p>
              </div>
              <div class="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <Icon name="lucide:user" class="h-6 w-6 text-primary-900" />
              </div>
            </div>

            <div class="p-8">
              <!-- View Mode -->
              <div v-if="!isEditing" class="space-y-8">
                <div class="pb-6 border-b border-ink-100">
                  <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Ad Soyad</p>
                  <p class="text-lg font-semibold text-primary-900">{{ getUser()?.name || '-' }}</p>
                </div>

                <div class="border-t border-ink-100 pt-8">
                  <h3 class="text-sm font-bold text-primary-900 uppercase tracking-wider mb-6">
                    İletişim Bilgileri
                  </h3>
                  <div class="grid sm:grid-cols-2 gap-8">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Email</p>
                      <p class="text-lg font-semibold text-primary-900">{{ getUser()?.email || '-' }}</p>
                    </div>
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Telefon</p>
                      <p class="text-lg font-semibold text-primary-900">
                        {{ (getUser() as any)?.phone || '-' }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="border-t border-ink-100 pt-8">
                  <h3 class="text-sm font-bold text-primary-900 uppercase tracking-wider mb-6">Adres Bilgileri</h3>
                  <div class="grid sm:grid-cols-2 gap-8">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Şehir</p>
                      <p class="text-lg font-semibold text-primary-900">
                        {{ (getUser() as any)?.city || '-' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Adres</p>
                      <p class="text-lg font-semibold text-primary-900">
                        {{ (getUser() as any)?.address || '-' }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="border-t border-ink-100 pt-8">
                  <div class="flex items-center gap-3">
                    <span
                      class="inline-flex px-2.5 py-1 rounded-md border text-xs font-semibold"
                      :class="
                        getUser()?.role === 'DEALER'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      "
                    >
                      {{ getUser()?.role === 'DEALER' ? 'Bayi' : 'Müşteri' }}
                    </span>
                  </div>
                </div>

                <div class="border-t border-ink-100 pt-8">
                  <button
                    @click="startEdit"
                    type="button"
                    class="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Icon name="lucide:edit-2" class="h-4 w-4" />
                    Düzenle
                  </button>
                </div>
              </div>

              <!-- Edit Mode -->
              <form v-else @submit.prevent="saveChanges" class="space-y-6">
                <div>
                  <label class="block text-sm font-semibold text-primary-900 mb-2">Ad Soyad</label>
                  <input
                    v-model="editForm.name"
                    type="text"
                    class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-primary-900 mb-2">Email</label>
                  <input
                    v-model="editForm.email"
                    type="email"
                    class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label class="block text-sm font-semibold text-primary-900 mb-2">Telefon</label>
                  <input
                    v-model="editForm.phone"
                    type="tel"
                    class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                </div>

                <div class="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-semibold text-primary-900 mb-2">Şehir</label>
                    <input
                      v-model="editForm.city"
                      type="text"
                      class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-primary-900 mb-2">Adres</label>
                    <input
                      v-model="editForm.address"
                      type="text"
                      class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div class="flex gap-4 pt-6 border-t border-ink-100">
                  <button
                    type="submit"
                    class="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Icon name="lucide:check" class="h-4 w-4" />
                    Kaydet
                  </button>
                  <button
                    @click="cancelEdit"
                    type="button"
                    class="px-6 py-3 border border-ink-200 text-primary-900 hover:bg-ink-50 font-semibold rounded-lg transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
