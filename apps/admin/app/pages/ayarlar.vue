<script setup lang="ts">
const toast = useToast()

definePageMeta({
  layout: 'default',
  middleware: 'auth',
  title: 'Ayarlar | Sadöksan Admin',
})

const settings = useSettingsStore()

onMounted(() => {
  if (!settings.loaded) settings.load()
})

const form = ref({ ...settings.data })

watch(
  () => settings.data,
  (v) => {
    form.value = { ...v }
  },
  { deep: true },
)

const save = () => {
  settings.save({ ...form.value })
  toast.push('Ayarlar kaydedildi', 'success')
}

const toggleMaintenance = () => {
  settings.toggleMaintenance()
  form.value.maintenanceMode = settings.data.maintenanceMode
}
</script>

<template>
  <div class="space-y-5 max-w-4xl">
    <PageHeader title="Ayarlar" description="Sistem geneli yapılandırma ve entegrasyon parametreleri." />

    <!-- Maintenance -->
    <div class="bg-white rounded-xl border border-ink-200 p-5">
      <div class="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 class="font-semibold text-ink-900 flex items-center gap-2">
            <Icon name="lucide:wrench" class="w-4 h-4 text-amber-600" />
            Bakım Modu
          </h3>
          <p class="text-sm text-ink-500 mt-1">
            Aktifken storefront ziyaretçilere bakım sayfası gösterir. Yöneticiler erişmeye devam edebilir.
          </p>
        </div>
        <button
          @click="toggleMaintenance"
          :class="[
            'relative inline-flex h-6 w-11 rounded-full transition-colors shrink-0',
            settings.data.maintenanceMode ? 'bg-amber-600' : 'bg-ink-300',
          ]"
        >
          <span
            :class="[
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
              settings.data.maintenanceMode ? 'translate-x-5' : 'translate-x-0.5',
            ]"
          />
        </button>
      </div>
      <div>
        <label class="block text-xs font-medium text-ink-700 mb-1">Bakım Mesajı</label>
        <textarea
          v-model="form.maintenanceMessage"
          rows="2"
          class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm"
        />
      </div>
      <label class="flex items-center gap-2 mt-3">
        <input v-model="form.maintenanceAllowAdmins" type="checkbox" class="rounded text-primary-600" />
        <span class="text-sm text-ink-700">Adminler bakım sırasında erişebilsin</span>
      </label>
    </div>

    <!-- Intro Banner Toggle -->
    <div class="bg-white rounded-xl border border-ink-200 p-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="font-semibold text-ink-900 flex items-center gap-2">
            <Icon name="lucide:presentation" class="w-4 h-4 text-indigo-600" />
            Dashboard Tanıtım Panosu
          </h3>
          <p class="text-sm text-ink-500 mt-1">
            Dashboard'un üst kısmında sistem modülleri, raporlama yapısı ve entegrasyon durumu hakkında bilgi panosu gösterir.
          </p>
        </div>
        <button
          @click="settings.save({ introEnabled: !settings.data.introEnabled })"
          :class="[
            'relative inline-flex h-6 w-11 rounded-full transition-colors shrink-0',
            settings.data.introEnabled ? 'bg-indigo-600' : 'bg-ink-300',
          ]"
        >
          <span
            :class="[
              'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
              settings.data.introEnabled ? 'translate-x-5' : 'translate-x-0.5',
            ]"
          />
        </button>
      </div>
    </div>

    <!-- Notifications -->
    <div class="bg-white rounded-xl border border-ink-200 p-5">
      <h3 class="font-semibold text-ink-900 flex items-center gap-2 mb-4">
        <Icon name="lucide:bell" class="w-4 h-4 text-primary-600" />
        Bildirim Kanalları
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">WhatsApp Alıcı (Serpil)</label>
          <input
            v-model="form.whatsappRecipient"
            type="text"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm font-mono"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Varsayılan Kanal</label>
          <select
            v-model="form.notifyChannelDefault"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
          >
            <option value="email">E-Posta</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="both">Her İkisi</option>
          </select>
        </div>
        <label class="flex items-center gap-2 col-span-full">
          <input v-model="form.cartReminderEnabled" type="checkbox" class="rounded text-primary-600" />
          <span class="text-sm text-ink-700">Sepet hatırlatıcı e-postaları aktif</span>
        </label>
        <div v-if="form.cartReminderEnabled">
          <label class="block text-xs font-medium text-ink-700 mb-1">Hatırlatma Aralığı (saat)</label>
          <input
            v-model.number="form.cartReminderHours"
            type="number"
            min="1"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm"
          />
        </div>
      </div>
    </div>

    <!-- Integrations -->
    <div class="bg-white rounded-xl border border-ink-200 p-5">
      <h3 class="font-semibold text-ink-900 flex items-center gap-2 mb-4">
        <Icon name="lucide:plug-zap" class="w-4 h-4 text-primary-600" />
        Entegrasyonlar
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Netsis Sync Aralığı</label>
          <select
            v-model="form.netsisSyncInterval"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
          >
            <option value="hourly">Saatlik</option>
            <option value="30min">30 Dakikada Bir</option>
            <option value="event-driven">Olay Tabanlı (Webhook)</option>
          </select>
          <p class="text-xs text-amber-700 mt-1">
            <Icon name="lucide:alert-triangle" class="w-3 h-3 inline" />
            Saatlik altı önerilir — overselling riski.
          </p>
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Alneo E-Fatura Tetikleyici</label>
          <select
            v-model="form.alneoTrigger"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm bg-white"
          >
            <option value="order-placed">Sipariş Verildiğinde</option>
            <option value="order-paid">Ödeme Onaylandığında</option>
            <option value="order-shipped">Sevk Edildiğinde</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Branding -->
    <div class="bg-white rounded-xl border border-ink-200 p-5">
      <h3 class="font-semibold text-ink-900 flex items-center gap-2 mb-4">
        <Icon name="lucide:palette" class="w-4 h-4 text-primary-600" />
        Marka & İletişim
      </h3>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">Site Adı</label>
          <input
            v-model="form.siteName"
            type="text"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-ink-700 mb-1">İletişim E-posta</label>
          <input
            v-model="form.contactEmail"
            type="email"
            class="w-full px-3 py-2 border border-ink-300 rounded-md text-sm"
          />
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2">
      <button
        @click="form = { ...settings.data }"
        class="px-4 py-2 text-sm font-medium text-ink-700 bg-white border border-ink-300 rounded-md hover:bg-ink-50"
      >
        Sıfırla
      </button>
      <button
        @click="save"
        class="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md flex items-center gap-2"
      >
        <Icon name="lucide:save" class="w-4 h-4" />
        Kaydet
      </button>
    </div>
  </div>
</template>
