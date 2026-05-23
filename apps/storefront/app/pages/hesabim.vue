<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'

definePageMeta({
  title: 'Hesap Ayarları | Sadöksan İnşaat',
  description: 'Hesap bilgilerinizi yönetin.',
  middleware: 'auth',
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

const isSaving = ref(false)
const saveError = ref('')

const saveChanges = async () => {
  isSaving.value = true
  saveError.value = ''

  try {
    const api = useApi()
    const updated = await api.patch<{ id: string; name: string; email: string; phone?: string; city?: string; address?: string }>('/auth/me', {
      name: editForm.value.name,
      phone: editForm.value.phone,
      city: editForm.value.city,
      address: editForm.value.address,
    })

    // Refresh user state with updated data
    const { user } = useAuth()
    if (user.value) {
      user.value = { ...user.value, ...updated }
    }

    isEditing.value = false
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Güncelleme başarısız'
  } finally {
    isSaving.value = false
  }
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

// ─── Address Management ────────────────────────────────────────────────
interface Address {
  id: string
  title: string
  address: string
  city: string
  district?: string | null
  isDefault: boolean
}

const addresses = ref<Address[]>([])
const addressLoading = ref(false)
const showAddressForm = ref(false)
const editingAddressId = ref<string | null>(null)
const addressForm = ref({ title: '', address: '', city: '', district: '', isDefault: false })
const addressError = ref('')

const fetchAddresses = async () => {
  addressLoading.value = true
  try {
    const api = useApi()
    addresses.value = await api.get<Address[]>('/auth/addresses')
  } catch { /* ignore */ }
  finally { addressLoading.value = false }
}

const openNewAddress = () => {
  editingAddressId.value = null
  addressForm.value = { title: '', address: '', city: '', district: '', isDefault: false }
  addressError.value = ''
  showAddressForm.value = true
}

const openEditAddress = (addr: Address) => {
  editingAddressId.value = addr.id
  addressForm.value = {
    title: addr.title,
    address: addr.address,
    city: addr.city,
    district: addr.district || '',
    isDefault: addr.isDefault,
  }
  addressError.value = ''
  showAddressForm.value = true
}

const saveAddress = async () => {
  addressError.value = ''
  const api = useApi()
  try {
    if (editingAddressId.value) {
      await api.patch(`/auth/addresses/${editingAddressId.value}`, addressForm.value)
    } else {
      await api.post('/auth/addresses', addressForm.value)
    }
    showAddressForm.value = false
    await fetchAddresses()
  } catch (err: any) {
    addressError.value = err instanceof Error ? err.message : 'Kaydetme başarısız'
  }
}

const deleteAddress = async (id: string) => {
  const api = useApi()
  try {
    await api.delete(`/auth/addresses/${id}`)
    await fetchAddresses()
  } catch { /* ignore */ }
}

// Load addresses on mount
onMounted(() => {
  fetchAddresses()
})
</script>

<template>
  <div class="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 lg:py-16">
    <div class="px-6 lg:px-12 mx-auto max-w-7xl">
      <div class="mb-12">
        <h1 class="text-4xl font-bold text-primary-900 mb-2">Hesap Ayarları</h1>
        <p class="text-ink-600">Profil bilgilerinizi düzenleyin</p>
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
                v-for="(item, idx) in navItems.filter(i => !i.action)"
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

              <!-- Bayi Paneli (Only for DEALER users) -->
              <NuxtLink
                v-if="getUser()?.role === 'DEALER'"
                to="/bayi"
                class="flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all text-primary-900 hover:bg-accent-50 border border-transparent hover:border-accent-200 bg-accent-50/50"
              >
                <Icon name="lucide:layout-dashboard" class="h-5 w-5 text-accent-600" />
                <span class="text-accent-700">Bayi Paneli</span>
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
                <div v-if="saveError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {{ saveError }}
                </div>

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
                    disabled
                    class="w-full px-4 py-3 border border-ink-200 rounded-lg bg-ink-50 text-ink-500"
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
                    :disabled="isSaving"
                    class="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <Icon :name="isSaving ? 'lucide:loader' : 'lucide:check'" :class="['h-4 w-4', isSaving && 'animate-spin']" />
                    {{ isSaving ? 'Kaydediliyor...' : 'Kaydet' }}
                  </button>
                  <button
                    @click="cancelEdit"
                    type="button"
                    :disabled="isSaving"
                    class="px-6 py-3 border border-ink-200 text-primary-900 hover:bg-ink-50 font-semibold rounded-lg transition-colors disabled:opacity-50"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Adres Defteri -->
          <div class="bg-white rounded-xl shadow-md overflow-hidden mt-6">
            <div class="bg-gradient-to-r from-accent-50 to-primary-50 p-6 border-b border-ink-100 flex items-center justify-between">
              <div>
                <h2 class="text-2xl font-bold text-primary-900">Adres Defteri</h2>
                <p class="text-ink-600 text-sm mt-1">Teslimat adreslerinizi yönetin</p>
              </div>
              <div class="flex items-center gap-3">
                <span v-if="addresses.length" class="text-xs text-ink-500">{{ addresses.length }} adres</span>
                <button
                  v-if="!showAddressForm"
                  @click="openNewAddress"
                  class="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <Icon name="lucide:plus" class="h-4 w-4" />
                  Yeni Adres
                </button>
              </div>
            </div>

            <div class="p-8">
              <!-- Address Form -->
              <div v-if="showAddressForm" class="border border-accent-200 rounded-xl p-6 bg-accent-50/50 mb-6">
                <h3 class="font-bold text-primary-900 mb-4">
                  {{ editingAddressId ? 'Adresi Düzenle' : 'Yeni Adres Ekle' }}
                </h3>
                <div v-if="addressError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                  {{ addressError }}
                </div>
                <div class="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-semibold text-primary-900 mb-1">Başlık</label>
                    <select
                      v-model="addressForm.title"
                      class="w-full px-3 py-2.5 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                    >
                      <option value="">Seçiniz</option>
                      <option value="Ev">Ev</option>
                      <option value="İş">İş</option>
                      <option value="Depo">Depo</option>
                      <option value="Şantiye">Şantiye</option>
                      <option value="Diğer">Diğer</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-primary-900 mb-1">Şehir</label>
                    <input
                      v-model="addressForm.city"
                      type="text"
                      placeholder="İstanbul"
                      class="w-full px-3 py-2.5 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-semibold text-primary-900 mb-1">İlçe</label>
                    <input
                      v-model="addressForm.district"
                      type="text"
                      placeholder="Kadıköy"
                      class="w-full px-3 py-2.5 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                    />
                  </div>
                  <div class="flex items-end">
                    <label class="flex items-center gap-2 cursor-pointer px-3 py-2.5">
                      <input type="checkbox" v-model="addressForm.isDefault" class="rounded border-ink-300 text-accent-500" />
                      <span class="text-sm text-ink-700">Varsayılan adres</span>
                    </label>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-sm font-semibold text-primary-900 mb-1">Açık Adres</label>
                    <textarea
                      v-model="addressForm.address"
                      rows="2"
                      placeholder="Mahalle, sokak, bina no, apartman no..."
                      class="w-full px-3 py-2.5 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                    ></textarea>
                  </div>
                </div>
                <div class="flex gap-3 mt-4">
                  <button
                    @click="saveAddress"
                    :disabled="!addressForm.title || !addressForm.city || !addressForm.address"
                    class="px-5 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white font-semibold rounded-lg text-sm transition-colors"
                  >
                    Kaydet
                  </button>
                  <button
                    @click="showAddressForm = false"
                    class="px-5 py-2.5 border border-ink-200 text-ink-700 hover:bg-ink-50 font-semibold rounded-lg text-sm transition-colors"
                  >
                    İptal
                  </button>
                </div>
              </div>

              <!-- Address List -->
              <div v-if="addressLoading" class="text-center py-8 text-ink-500">
                <Icon name="lucide:loader" class="h-5 w-5 animate-spin mx-auto mb-2" />
                Yükleniyor...
              </div>

              <div v-else-if="addresses.length === 0 && !showAddressForm" class="text-center py-12">
                <Icon name="lucide:map-pin" class="h-12 w-12 text-ink-300 mx-auto mb-3" />
                <p class="text-ink-600 font-medium">Henüz kayıtlı adresiniz yok</p>
                <p class="text-ink-400 text-sm mt-1">Siparişlerinizde kullanmak için adres ekleyin</p>
              </div>

              <div v-else-if="addresses.length > 0" class="space-y-3">
                <div
                  v-for="addr in addresses"
                  :key="addr.id"
                  class="border rounded-xl p-5 transition-all"
                  :class="addr.isDefault ? 'border-accent-300 bg-accent-50/30' : 'border-ink-100 hover:border-ink-200'"
                >
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                      <div class="flex items-center gap-2 mb-1">
                        <h4 class="font-bold text-primary-900">{{ addr.title }}</h4>
                        <span v-if="addr.isDefault" class="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full font-medium">Varsayılan</span>
                      </div>
                      <p class="text-ink-700 text-sm">{{ addr.address }}</p>
                      <p class="text-ink-500 text-xs mt-1">
                        {{ [addr.district, addr.city].filter(Boolean).join(' / ') }}
                      </p>
                    </div>
                    <div class="flex items-center gap-1 shrink-0">
                      <button
                        @click="openEditAddress(addr)"
                        class="p-2 text-ink-400 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-colors"
                        title="Düzenle"
                      >
                        <Icon name="lucide:edit-2" class="h-4 w-4" />
                      </button>
                      <button
                        @click="deleteAddress(addr.id)"
                        class="p-2 text-ink-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Sil"
                      >
                        <Icon name="lucide:trash-2" class="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
