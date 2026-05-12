<script setup lang="ts">
const { enableDealer, isDealer, dealer } = useDealer()
const { push: pushToast } = useToast()
const { featured } = useProducts()
const { getUser, isAuthenticated } = useAuth()

useHead({ title: 'Bayi Paneli — Sadoksan' })

const currentUser = getUser()

// Redirect if not authenticated or not a dealer
watchEffect(() => {
  if (!isAuthenticated.value || currentUser?.role !== 'DEALER') {
    navigateTo('/bayilik/giris')
  }
})

// Enable dealer mode from real auth user data
onMounted(() => {
  if (!isDealer.value && currentUser) {
    enableDealer({
      id: currentUser.id,
      code: `BYI-${currentUser.id.slice(0, 4).toUpperCase()}`,
      companyName: currentUser.name || 'Bayi',
      city: (currentUser as any).city || 'Bilinmiyor',
      logisticsSurcharge: 40,
    })
  }

  pushToast({
    variant: 'info',
    title: 'Bayi modu aktif',
    description: `Lokasyon: ${dealer.value?.city ?? 'Bilinmiyor'} — fiyatlara +${dealer.value?.logisticsSurcharge ?? 40} TL lojistik bedeli uygulanacaktır.`,
    duration: 8000,
  })
})

const featuredItems = featured(8)

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)

const statusColor = (s: string) => {
  if (s === 'Onay Bekleniyor') return 'bg-amber-50 text-amber-800 border-amber-200'
  if (s === 'Sevk Edildi') return 'bg-blue-50 text-blue-800 border-blue-200'
  return 'bg-emerald-50 text-emerald-800 border-emerald-200'
}
</script>

<template>
  <div v-if="isAuthenticated && currentUser?.role === 'DEALER'">
    <!-- Welcome -->
    <section class="bg-gradient-to-b from-primary-950 to-primary-900 text-white pt-14 pb-32">
      <div class="container-x">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p class="eyebrow text-accent-400">Bayi Paneli</p>
            <h1 class="mt-3 font-display text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Hoşgeldiniz, {{ currentUser?.name }}
            </h1>
            <p class="mt-3 text-ink-300 max-w-xl">
              Email: {{ currentUser?.email }} —
              {{ dealer?.city || (currentUser as any)?.city || 'Bilinmiyor' }} lokasyonu üzerinden
              <span class="text-accent-400 font-semibold">+{{ dealer?.logisticsSurcharge ?? 40 }} TL</span>
              lojistik bedeli uygulanmaktadır.
            </p>
          </div>
          <div class="flex flex-wrap gap-3">
            <button class="btn-accent">
              <Icon name="lucide:plus" class="h-4 w-4" />
              Yeni Sipariş
            </button>
            <button class="btn border border-white/20 text-white hover:bg-white/10">
              <Icon name="lucide:download" class="h-4 w-4" />
              Cari Ekstre
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick actions -->
    <section class="py-16 -mt-20">
      <div class="container-x grid md:grid-cols-3 gap-5">
        <a
          v-for="(a, i) in [
            { icon: 'lucide:file-text', title: 'Cari Ekstresi', desc: 'Geçmiş hesap hareketleri ve bakiye raporu', cta: 'Görüntüle' },
            { icon: 'lucide:download', title: 'Stok & Fiyat Listesi', desc: 'Tüm ürünleri Excel olarak indirin', cta: 'İndir' },
            { icon: 'lucide:headset', title: 'Bayi Destek', desc: 'Müşteri temsilciniz ile doğrudan iletişim', cta: 'İletişim' },
          ]"
          :key="i"
          href="#"
          class="group rounded-xl border border-ink-100 bg-white p-7 hover:border-primary-300 hover:shadow-card transition-all"
        >
          <div
            class="h-11 w-11 grid place-items-center rounded-md bg-primary-50 text-primary-900 group-hover:bg-primary-900 group-hover:text-accent-500 transition-colors"
          >
            <Icon :name="a.icon" class="h-5 w-5" />
          </div>
          <h3 class="mt-5 font-display text-lg font-bold text-ink-900">{{ a.title }}</h3>
          <p class="mt-2 text-sm text-ink-600 leading-relaxed">{{ a.desc }}</p>
          <span
            class="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-900"
          >
            {{ a.cta }}
            <Icon name="lucide:arrow-right" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </a>
      </div>
    </section>

    <!-- Featured with dealer pricing -->
    <section class="py-16 md:py-20 bg-ink-50">
      <div class="container-x">
        <div class="flex items-end justify-between gap-6 flex-wrap">
          <div class="max-w-2xl">
            <p class="eyebrow">Bayi Fiyatlandırması</p>
            <h2 class="mt-3 heading-lg">Lokasyonunuza özel fiyatlar</h2>
            <p class="mt-4 lead">
              Aşağıdaki fiyatlar {{ dealer?.city || (currentUser as any)?.city || 'bulunduğunuz' }} lokasyonu için
              <span class="font-semibold text-accent-700">+{{ dealer?.logisticsSurcharge ?? 40 }} TL lojistik bedeli</span>
              eklenmiş haldedir.
            </p>
          </div>
          <NuxtLink to="/urunler" class="btn-ghost text-primary-900">
            Tüm Katalog
            <Icon name="lucide:arrow-right" class="h-4 w-4" />
          </NuxtLink>
        </div>

        <div class="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          <ProductCard v-for="p in featuredItems" :key="p.id" :product="p" />
        </div>
      </div>
    </section>
  </div>
</template>
