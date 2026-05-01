<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { logout, getUser } = useAuth()
const currentUser = getUser()

if (!currentUser) {
  navigateTo('/giris')
}

const user = ref(currentUser || {
  ad: 'Ahmet',
  soyad: 'Yılmaz',
  email: 'ahmet.yilmaz@example.com',
  telefon: '0539 654 17 20',
  sehir: 'İstanbul',
  adres: 'Test Caddesi No: 5',
  createdAt: '2024-06-15',
})

const isEditing = ref(false)
const editForm = ref({ ...user.value })

const startEdit = () => {
  isEditing.value = true
  editForm.value = { ...user.value }
}

const saveChanges = () => {
  user.value = { ...editForm.value }
  isEditing.value = false
}

const cancelEdit = () => {
  isEditing.value = false
}

const handleLogout = () => {
  logout()
  navigateTo('/giris')
}

const navItems = [
  { icon: 'lucide:user', label: 'Profil Bilgileri', to: '/hesabim', active: true },
  { icon: 'lucide:package', label: 'Siparişlerim', to: '/siparislerim', active: false },
  { icon: 'lucide:heart', label: 'Favori Ürünler', to: '/favori-urunler', active: false },
  { icon: 'lucide:log-out', label: 'Çıkış Yap', action: handleLogout, active: false },
]
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 lg:py-16">
    <div class="px-6 lg:px-12 mx-auto max-w-7xl">
      <!-- Page Header -->
      <div class="mb-12">
        <h1 class="text-4xl font-bold text-primary-900 mb-2">Hesap Yönetimi</h1>
        <p class="text-ink-600">Profil bilgilerinizi düzenleyin ve siparişlerinizi takip edin</p>
      </div>

      <div class="grid lg:grid-cols-4 gap-6">
        <!-- Sidebar Navigation -->
        <aside class="lg:col-span-1">
          <div class="bg-white rounded-xl shadow-md overflow-hidden sticky top-24">
            <!-- User Card -->
            <div class="bg-gradient-to-r from-primary-900 to-accent-600 text-white p-6 text-center">
              <div class="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold mx-auto mb-4">
                {{ user.ad.charAt(0) }}{{ user.soyad.charAt(0) }}
              </div>
              <h3 class="font-bold text-lg">{{ user.ad }} {{ user.soyad }}</h3>
              <p class="text-white/80 text-sm mt-1">{{ user.email }}</p>
              <p class="text-white/60 text-xs mt-3">
                Üye: {{ new Date(user.createdAt).toLocaleDateString('tr-TR') }}
              </p>
            </div>

            <!-- Navigation Menu -->
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

              <!-- Logout Button -->
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
          <!-- Profile Card -->
          <div class="bg-white rounded-xl shadow-md overflow-hidden">
            <!-- Header Section -->
            <div class="bg-gradient-to-r from-primary-50 to-accent-50 p-6 border-b border-ink-100 flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold text-primary-900">Profil Bilgileri</h2>
                <p class="text-ink-600 text-sm mt-1">Kişisel bilgilerinizi güncelleyin</p>
              </div>
              <div class="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
                <Icon name="lucide:user" class="h-6 w-6 text-primary-900" />
              </div>
            </div>

            <!-- Content -->
            <div class="p-8">
              <!-- View Mode -->
              <form v-if="!isEditing" class="space-y-8">
                <!-- Name Section -->
                <div class="grid sm:grid-cols-2 gap-8">
                  <div class="pb-6 border-b border-ink-100">
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Adı</p>
                    <p class="text-lg font-semibold text-primary-900">{{ user.ad }}</p>
                  </div>
                  <div class="pb-6 border-b border-ink-100">
                    <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Soyadı</p>
                    <p class="text-lg font-semibold text-primary-900">{{ user.soyad }}</p>
                  </div>
                </div>

                <!-- Contact Section -->
                <div class="border-t border-ink-100 pt-8">
                  <h3 class="text-sm font-bold text-primary-900 uppercase tracking-wider mb-6">İletişim Bilgileri</h3>
                  <div class="grid sm:grid-cols-2 gap-8">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Email</p>
                      <p class="text-lg font-semibold text-primary-900">{{ user.email }}</p>
                    </div>
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Telefon</p>
                      <p class="text-lg font-semibold text-primary-900">{{ user.telefon }}</p>
                    </div>
                  </div>
                </div>

                <!-- Address Section -->
                <div class="border-t border-ink-100 pt-8">
                  <h3 class="text-sm font-bold text-primary-900 uppercase tracking-wider mb-6">Adres Bilgileri</h3>
                  <div class="grid sm:grid-cols-2 gap-8">
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Şehir</p>
                      <p class="text-lg font-semibold text-primary-900">{{ user.sehir }}</p>
                    </div>
                    <div>
                      <p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-2">Adres</p>
                      <p class="text-lg font-semibold text-primary-900">{{ user.adres }}</p>
                    </div>
                  </div>
                </div>

                <!-- Action Button -->
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
              </form>

              <!-- Edit Mode -->
              <form v-else @submit.prevent="saveChanges" class="space-y-6">
                <div class="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-semibold text-primary-900 mb-2">Adı</label>
                    <input
                      v-model="editForm.ad"
                      type="text"
                      class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-primary-900 mb-2">Soyadı</label>
                    <input
                      v-model="editForm.soyad"
                      type="text"
                      class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    />
                  </div>
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
                    v-model="editForm.telefon"
                    type="tel"
                    class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                </div>

                <div class="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-semibold text-primary-900 mb-2">Şehir</label>
                    <input
                      v-model="editForm.sehir"
                      type="text"
                      class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-primary-900 mb-2">Adres</label>
                    <input
                      v-model="editForm.adres"
                      type="text"
                      class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div class="flex gap-4 pt-6 border-t border-ink-100">
                  <button
                    @click="saveChanges"
                    type="button"
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
