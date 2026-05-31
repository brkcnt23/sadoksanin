<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'
import { useApi } from '~/composables/useApi'
import { useToast } from '~/composables/useToast'
import { useDealer } from '~/composables/useDealer'
import { useDealerApi } from '~/composables/useDealerApi'

definePageMeta({
  middleware: 'auth',
  title: 'Hesap Ayarları | Sadöksan',
})

const { getUser, isAuthenticated, logout } = useAuth()
const { push: pushToast } = useToast()
const { dealer } = useDealer()
const { getDealerInfo } = useDealerApi()
const api = useApi()

watchEffect(() => { if (!isAuthenticated.value) navigateTo('/giris') })

const currentUser = computed(() => getUser())

// ─── Dealer Info ──────────────────────────────────────────────────────
const dealerInfo = ref<any>(null)
onMounted(async () => { try { dealerInfo.value = await getDealerInfo() } catch { /* */ } })

// ─── Profil ───────────────────────────────────────────────────────────
const isEditingProfile = ref(false)
const profileForm = ref<Record<string, string>>({})
const profileSaving = ref(false)
const profileError = ref('')

const startEditProfile = () => {
  const u = getUser(); if (!u) return
  profileForm.value = { name: u.name || '', phone: (u as any).phone || '', city: (u as any).city || '', address: (u as any).address || '' }
  isEditingProfile.value = true
}

const saveProfile = async () => {
  profileSaving.value = true; profileError.value = ''
  try {
    const updated = await api.patch('/auth/me', { name: profileForm.value.name, phone: profileForm.value.phone, city: profileForm.value.city, address: profileForm.value.address })
    const { user } = useAuth(); if (user.value) user.value = { ...user.value, ...updated }
    isEditingProfile.value = false
    pushToast({ variant: 'success', title: 'Profil güncellendi', duration: 3000 })
  } catch (err: any) { profileError.value = err.message || 'Güncelleme başarısız' }
  finally { profileSaving.value = false }
}

// ─── Şifre ────────────────────────────────────────────────────────────
const showPasswordForm = ref(false)
const passwordForm = ref({ current: '', newPw: '', confirm: '' })
const passwordSaving = ref(false)
const passwordError = ref('')
const passwordSuccess = ref(false)

const changePassword = async () => {
  passwordError.value = ''; passwordSuccess.value = false
  if (passwordForm.value.newPw.length < 6) { passwordError.value = 'Yeni şifre en az 6 karakter olmalı'; return }
  if (passwordForm.value.newPw !== passwordForm.value.confirm) { passwordError.value = 'Şifreler eşleşmiyor'; return }
  passwordSaving.value = true
  try {
    await api.patch('/auth/password', { currentPassword: passwordForm.value.current, newPassword: passwordForm.value.newPw })
    passwordSuccess.value = true
    passwordForm.value = { current: '', newPw: '', confirm: '' }
    pushToast({ variant: 'success', title: 'Şifre güncellendi', duration: 3000 })
  } catch (err: any) { passwordError.value = err.message || 'Şifre değiştirilemedi' }
  finally { passwordSaving.value = false }
}

// ─── Adresler ─────────────────────────────────────────────────────────
interface Address { id: string; title: string; address: string; city: string; district?: string | null; isDefault: boolean }
const addresses = ref<Address[]>([])
const addrLoading = ref(false)
const showAddrForm = ref(false)
const editingAddrId = ref<string | null>(null)
const addrForm = ref({ title: '', address: '', city: '', district: '', isDefault: false })
const addrError = ref('')

const fetchAddresses = async () => { addrLoading.value = true; try { addresses.value = await api.get<Address[]>('/auth/addresses') } catch { /* */ } finally { addrLoading.value = false } }

const openNew = () => { editingAddrId.value = null; addrForm.value = { title: '', address: '', city: '', district: '', isDefault: false }; addrError.value = ''; showAddrForm.value = true }
const openEdit = (a: Address) => { editingAddrId.value = a.id; addrForm.value = { title: a.title, address: a.address, city: a.city, district: a.district || '', isDefault: a.isDefault }; addrError.value = ''; showAddrForm.value = true }

const saveAddr = async () => {
  addrError.value = ''
  try {
    if (editingAddrId.value) await api.patch(`/auth/addresses/${editingAddrId.value}`, addrForm.value)
    else await api.post('/auth/addresses', addrForm.value)
    showAddrForm.value = false; await fetchAddresses()
    pushToast({ variant: 'success', title: editingAddrId.value ? 'Adres güncellendi' : 'Adres eklendi', duration: 3000 })
  } catch (err: any) { addrError.value = err.message || 'Kaydetme başarısız' }
}

const deleteAddr = async (id: string) => { try { await api.delete(`/auth/addresses/${id}`); await fetchAddresses(); pushToast({ variant: 'success', title: 'Adres silindi', duration: 3000 }) } catch { /* */ } }

onMounted(() => fetchAddresses())

const handleLogout = () => { logout(); navigateTo('/giris') }
</script>

<template>
  <div v-if="isAuthenticated" class="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 lg:py-16">
    <div class="container-x max-w-4xl">
      <div class="flex items-center gap-4 mb-10">
        <NuxtLink to="/bayi" class="p-2 hover:bg-ink-100 rounded-lg transition-colors">
          <Icon name="lucide:arrow-left" class="h-5 w-5 text-ink-600" />
        </NuxtLink>
        <div>
          <h1 class="text-3xl font-bold text-primary-900">Hesap Ayarları</h1>
          <p class="text-ink-500 text-sm mt-1">{{ currentUser?.email }}</p>
        </div>
      </div>

      <div class="space-y-6">
        <!-- Profil Kartı -->
        <div class="bg-white rounded-xl border border-ink-100 shadow-card overflow-hidden">
          <div class="bg-gradient-to-r from-primary-50 to-accent-50 p-6 border-b border-ink-100 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-primary-900">Profil Bilgileri</h2>
              <p class="text-ink-500 text-sm">Firma ve iletişim bilgileriniz</p>
            </div>
            <button v-if="!isEditingProfile" @click="startEditProfile" class="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg text-sm flex items-center gap-2">
              <Icon name="lucide:edit-2" class="h-4 w-4" /> Düzenle
            </button>
          </div>

          <div class="p-6">
            <div v-if="!isEditingProfile" class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">Firma</p><p class="text-base font-semibold text-primary-900">{{ dealerInfo?.company || dealer?.companyName || '—' }}</p></div>
              <div><p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">Yetkili Kişi</p><p class="text-base font-semibold text-primary-900">{{ currentUser?.name || '—' }}</p></div>
              <div><p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">E-posta</p><p class="text-base font-semibold text-primary-900">{{ currentUser?.email || '—' }}</p></div>
              <div><p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">Telefon</p><p class="text-base font-semibold text-primary-900">{{ (currentUser as any)?.phone || '—' }}</p></div>
              <div><p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">Şehir</p><p class="text-base font-semibold text-primary-900">{{ (currentUser as any)?.city || '—' }}</p></div>
              <div><p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">Cari No</p><p class="text-base font-semibold text-primary-900 font-mono">{{ dealerInfo?.cariNo || dealer?.code || '—' }}</p></div>
              <div><p class="text-xs font-semibold uppercase tracking-wider text-ink-500 mb-1">Bayi Durumu</p><span class="inline-flex px-2.5 py-1 rounded-md border text-xs font-semibold bg-blue-50 text-blue-800 border-blue-200">Aktif Bayi</span></div>
            </div>

            <form v-else @submit.prevent="saveProfile" class="space-y-4">
              <div v-if="profileError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ profileError }}</div>
              <div><label class="block text-sm font-semibold text-primary-900 mb-1">Ad Soyad</label><input v-model="profileForm.name" type="text" class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500" /></div>
              <div><label class="block text-sm font-semibold text-primary-900 mb-1">Telefon</label><input v-model="profileForm.phone" type="tel" class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500" /></div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div><label class="block text-sm font-semibold text-primary-900 mb-1">Şehir</label><input v-model="profileForm.city" type="text" class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500" /></div>
                <div><label class="block text-sm font-semibold text-primary-900 mb-1">Adres</label><input v-model="profileForm.address" type="text" class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500" /></div>
              </div>
              <div class="flex gap-3 pt-4 border-t border-ink-100">
                <button type="submit" :disabled="profileSaving" class="px-6 py-3 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50"><Icon :name="profileSaving ? 'lucide:loader' : 'lucide:check'" :class="['h-4 w-4', profileSaving && 'animate-spin']" />{{ profileSaving ? 'Kaydediliyor...' : 'Kaydet' }}</button>
                <button @click="isEditingProfile = false" type="button" :disabled="profileSaving" class="px-6 py-3 border border-ink-200 text-primary-900 hover:bg-ink-50 font-semibold rounded-lg disabled:opacity-50">İptal</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Şifre Kartı -->
        <div class="bg-white rounded-xl border border-ink-100 shadow-card overflow-hidden">
          <div class="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 border-b border-ink-100 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-primary-900">Şifre & Güvenlik</h2>
              <p class="text-ink-500 text-sm">Şifrenizi değiştirin</p>
            </div>
            <button v-if="!showPasswordForm" @click="showPasswordForm = true; passwordSuccess = false" class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg text-sm flex items-center gap-2">
              <Icon name="lucide:lock" class="h-4 w-4" /> Şifre Değiştir
            </button>
          </div>
          <div class="p-6">
            <div v-if="passwordSuccess" class="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800">Şifreniz başarıyla güncellendi.</div>
            <form v-else-if="showPasswordForm" @submit.prevent="changePassword" class="space-y-4">
              <div v-if="passwordError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{{ passwordError }}</div>
              <div><label class="block text-sm font-semibold text-primary-900 mb-1">Mevcut Şifre</label><input v-model="passwordForm.current" type="password" class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
              <div><label class="block text-sm font-semibold text-primary-900 mb-1">Yeni Şifre</label><input v-model="passwordForm.newPw" type="password" placeholder="En az 6 karakter" class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
              <div><label class="block text-sm font-semibold text-primary-900 mb-1">Yeni Şifre (Tekrar)</label><input v-model="passwordForm.confirm" type="password" class="w-full px-4 py-3 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
              <div class="flex gap-3">
                <button type="submit" :disabled="passwordSaving" class="px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg flex items-center gap-2 disabled:opacity-50"><Icon :name="passwordSaving ? 'lucide:loader' : 'lucide:check'" :class="['h-4 w-4', passwordSaving && 'animate-spin']" />{{ passwordSaving ? 'Güncelleniyor...' : 'Güncelle' }}</button>
                <button @click="showPasswordForm = false; passwordError = ''" type="button" class="px-6 py-3 border border-ink-200 text-primary-900 hover:bg-ink-50 font-semibold rounded-lg">İptal</button>
              </div>
            </form>
            <p v-else class="text-ink-400 text-sm">Şifreniz güvende. Düzenli olarak değiştirmeniz önerilir.</p>
          </div>
        </div>

        <!-- Adres Kartı -->
        <div class="bg-white rounded-xl border border-ink-100 shadow-card overflow-hidden">
          <div class="bg-gradient-to-r from-accent-50 to-primary-50 p-6 border-b border-ink-100 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold text-primary-900">Adres Defteri</h2>
              <p class="text-ink-500 text-sm">Teslimat adresleriniz</p>
            </div>
            <button v-if="!showAddrForm" @click="openNew" class="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white font-semibold rounded-lg text-sm flex items-center gap-2">
              <Icon name="lucide:plus" class="h-4 w-4" /> Yeni Adres
            </button>
          </div>
          <div class="p-6">
            <div v-if="showAddrForm" class="border border-accent-200 rounded-xl p-6 bg-accent-50/50 mb-6">
              <h3 class="font-bold text-primary-900 mb-4">{{ editingAddrId ? 'Adresi Düzenle' : 'Yeni Adres Ekle' }}</h3>
              <div v-if="addrError" class="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">{{ addrError }}</div>
              <div class="grid sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold mb-1">Başlık</label>
                  <select v-model="addrForm.title" class="w-full px-3 py-2.5 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500">
                    <option value="">Seçiniz</option><option value="Depo">Depo</option><option value="Şantiye">Şantiye</option><option value="Ofis">Ofis</option><option value="Diğer">Diğer</option>
                  </select>
                </div>
                <div><label class="block text-sm font-semibold mb-1">Şehir</label><input v-model="addrForm.city" type="text" class="w-full px-3 py-2.5 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500" /></div>
                <div><label class="block text-sm font-semibold mb-1">İlçe</label><input v-model="addrForm.district" type="text" class="w-full px-3 py-2.5 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500" /></div>
                <div class="flex items-end"><label class="flex items-center gap-2 cursor-pointer px-3 py-2.5"><input type="checkbox" v-model="addrForm.isDefault" /><span class="text-sm">Varsayılan</span></label></div>
                <div class="sm:col-span-2"><label class="block text-sm font-semibold mb-1">Açık Adres</label><textarea v-model="addrForm.address" rows="2" class="w-full px-3 py-2.5 border border-ink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"></textarea></div>
              </div>
              <div class="flex gap-3 mt-4">
                <button @click="saveAddr" :disabled="!addrForm.title || !addrForm.city || !addrForm.address" class="px-5 py-2.5 bg-accent-500 hover:bg-accent-600 disabled:opacity-40 text-white font-semibold rounded-lg text-sm">Kaydet</button>
                <button @click="showAddrForm = false" class="px-5 py-2.5 border border-ink-200 hover:bg-ink-50 font-semibold rounded-lg text-sm">İptal</button>
              </div>
            </div>

            <div v-if="addrLoading" class="text-center py-8"><Icon name="lucide:loader" class="h-5 w-5 animate-spin mx-auto mb-2" />Yükleniyor...</div>
            <div v-else-if="addresses.length === 0 && !showAddrForm" class="text-center py-10">
              <Icon name="lucide:map-pin" class="h-10 w-10 text-ink-300 mx-auto mb-3" />
              <p class="text-ink-500 font-medium">Henüz kayıtlı adres yok</p>
            </div>
            <div v-else-if="addresses.length > 0" class="space-y-3">
              <div v-for="a in addresses" :key="a.id" class="border rounded-xl p-4" :class="a.isDefault ? 'border-accent-300 bg-accent-50/30' : 'border-ink-100 hover:border-ink-200'">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1"><h4 class="font-bold text-primary-900">{{ a.title }}</h4><span v-if="a.isDefault" class="text-xs bg-accent-100 text-accent-700 px-2 py-0.5 rounded-full">Varsayılan</span></div>
                    <p class="text-ink-700 text-sm">{{ a.address }}</p>
                    <p class="text-ink-500 text-xs mt-1">{{ [a.district, a.city].filter(Boolean).join(' / ') }}</p>
                  </div>
                  <div class="flex gap-1"><button @click="openEdit(a)" class="p-2 hover:text-accent-600 hover:bg-accent-50 rounded-lg"><Icon name="lucide:edit-2" class="h-4 w-4" /></button><button @click="deleteAddr(a.id)" class="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg"><Icon name="lucide:trash-2" class="h-4 w-4" /></button></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Çıkış -->
        <div class="text-center pt-4 pb-8">
          <button @click="handleLogout" class="px-6 py-3 border border-red-200 text-red-700 hover:bg-red-50 font-semibold rounded-lg flex items-center gap-2 mx-auto">
            <Icon name="lucide:log-out" class="h-4 w-4" /> Çıkış Yap
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
