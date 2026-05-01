<script setup lang="ts">
const { enableDealer, isDealer, dealer } = useDealer()
const { push: pushToast } = useToast()
const { featured } = useProducts()

useHead({ title: 'Bayi Paneli — Sadoksan' })

const featuredItems = featured(8)

// /bayi açıldığında bayi modunu aç ve toast göster.
onMounted(() => {
  if (!isDealer.value) {
    enableDealer({
      id: 'd-2034',
      code: 'BYI-2034',
      companyName: 'Yıldız Yapı Market Ltd.',
      city: 'Erzincan',
      logisticsSurcharge: 40,
    })
  }

  pushToast({
    variant: 'info',
    title: 'Bayi modu aktif',
    description: `Lokasyon: ${dealer.value?.city ?? 'Erzincan'} — fiyatlara +${dealer.value?.logisticsSurcharge ?? 40} TL lojistik bedeli uygulanacaktır.`,
    duration: 8000,
  })
})

// Mock cari & sipariş verileri
const summary = {
  cariBalance: 124530,
  pendingOrders: 3,
  monthlyOrderCount: 18,
  monthlyOrderTotal: 487200,
}

const recentOrders = [
  { id: 'SP-2026-04781', date: '28.04.2026', items: 12, total: 18420, status: 'Onay Bekleniyor' },
  { id: 'SP-2026-04752', date: '24.04.2026', items: 7,  total: 9650,  status: 'Sevk Edildi' },
  { id: 'SP-2026-04711', date: '19.04.2026', items: 24, total: 41200, status: 'Tamamlandı' },
  { id: 'SP-2026-04688', date: '14.04.2026', items: 5,  total: 6890,  status: 'Tamamlandı' },
]

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)

const statusColor = (s: string) => {
  if (s === 'Onay Bekleniyor') return 'bg-amber-50 text-amber-800 border-amber-200'
  if (s === 'Sevk Edildi') return 'bg-blue-50 text-blue-800 border-blue-200'
  return 'bg-emerald-50 text-emerald-800 border-emerald-200'
}
</script>

<template>
  <div>
    <!-- Welcome -->
    <section class="bg-gradient-to-b from-primary-950 to-primary-900 text-white pt-14 pb-32">
      <div class="container-x">
        <div class="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p class="eyebrow text-accent-400">Bayi Paneli</p>
            <h1 class="mt-3 font-display text-4xl md:text-5xl font-extrabold tracking-tight text-white">
              Hoşgeldiniz, {{ dealer?.companyName }}
            </h1>
            <p class="mt-3 text-ink-300 max-w-xl">
              Bayi kodunuz <span class="text-accent-400 font-semibold">{{ dealer?.code }}</span> —
              {{ dealer?.city }} lokasyonu üzerinden
              <span class="text-accent-400 font-semibold">+{{ dealer?.logisticsSurcharge }} TL</span>
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

    <!-- KPI cards -->
    <section class="-mt-20 pb-12">
      <div class="container-x grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="rounded-xl bg-white border border-ink-100 p-6 shadow-card">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Cari Bakiye</p>
            <Icon name="lucide:wallet" class="h-5 w-5 text-accent-500" />
          </div>
          <p class="mt-3 font-display text-2xl md:text-3xl font-extrabold text-primary-950">
            {{ formatTL(summary.cariBalance) }} <span class="text-base text-ink-500 font-medium">TL</span>
          </p>
          <p class="mt-1 text-xs text-ink-500">Borç bakiye</p>
        </div>

        <div class="rounded-xl bg-white border border-ink-100 p-6 shadow-card">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Onay Bekleyen</p>
            <Icon name="lucide:clock" class="h-5 w-5 text-amber-500" />
          </div>
          <p class="mt-3 font-display text-2xl md:text-3xl font-extrabold text-primary-950">
            {{ summary.pendingOrders }}
          </p>
          <p class="mt-1 text-xs text-ink-500">sipariş onayda</p>
        </div>

        <div class="rounded-xl bg-white border border-ink-100 p-6 shadow-card">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Bu Ay Sipariş</p>
            <Icon name="lucide:package" class="h-5 w-5 text-primary-700" />
          </div>
          <p class="mt-3 font-display text-2xl md:text-3xl font-extrabold text-primary-950">
            {{ summary.monthlyOrderCount }}
          </p>
          <p class="mt-1 text-xs text-ink-500">aktif sipariş</p>
        </div>

        <div class="rounded-xl bg-white border border-ink-100 p-6 shadow-card">
          <div class="flex items-center justify-between">
            <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Aylık Hacim</p>
            <Icon name="lucide:trending-up" class="h-5 w-5 text-emerald-500" />
          </div>
          <p class="mt-3 font-display text-2xl md:text-3xl font-extrabold text-primary-950">
            {{ formatTL(summary.monthlyOrderTotal) }} <span class="text-base text-ink-500 font-medium">TL</span>
          </p>
          <p class="mt-1 text-xs text-emerald-600 font-medium">+12% geçen aya göre</p>
        </div>
      </div>
    </section>

    <!-- Recent orders -->
    <section class="pb-16">
      <div class="container-x">
        <div class="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p class="eyebrow">Sipariş Geçmişi</p>
            <h2 class="mt-3 heading-md">Son siparişleriniz</h2>
          </div>
          <NuxtLink to="/bayi/siparisler" class="btn-ghost text-primary-900">
            Tüm Siparişler
            <Icon name="lucide:arrow-right" class="h-4 w-4" />
          </NuxtLink>
        </div>

        <div class="mt-8 overflow-hidden rounded-xl border border-ink-100 bg-white">
          <table class="w-full text-sm">
            <thead class="bg-ink-50 text-left text-xs uppercase tracking-wider text-ink-600">
              <tr>
                <th class="px-6 py-4 font-semibold">Sipariş No</th>
                <th class="px-6 py-4 font-semibold">Tarih</th>
                <th class="px-6 py-4 font-semibold text-center">Kalem</th>
                <th class="px-6 py-4 font-semibold text-right">Tutar</th>
                <th class="px-6 py-4 font-semibold">Durum</th>
                <th class="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-ink-100">
              <tr v-for="o in recentOrders" :key="o.id" class="hover:bg-ink-50/60">
                <td class="px-6 py-4 font-mono text-xs font-semibold text-primary-900">
                  {{ o.id }}
                </td>
                <td class="px-6 py-4 text-ink-600">{{ o.date }}</td>
                <td class="px-6 py-4 text-center text-ink-700">{{ o.items }}</td>
                <td class="px-6 py-4 text-right font-semibold text-ink-900">
                  {{ formatTL(o.total) }} TL
                </td>
                <td class="px-6 py-4">
                  <span
                    class="inline-flex px-2.5 py-1 rounded-md border text-xs font-semibold"
                    :class="statusColor(o.status)"
                  >
                    {{ o.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button class="text-ink-500 hover:text-primary-900">
                    <Icon name="lucide:chevron-right" class="h-4 w-4" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
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
              Aşağıdaki fiyatlar {{ dealer?.city }} lokasyonu için
              <span class="font-semibold text-accent-700">+{{ dealer?.logisticsSurcharge }} TL lojistik bedeli</span>
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

    <!-- Quick actions -->
    <section class="py-16">
      <div class="container-x">
        <div class="grid md:grid-cols-3 gap-5">
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
            <div class="h-11 w-11 grid place-items-center rounded-md bg-primary-50 text-primary-900 group-hover:bg-primary-900 group-hover:text-accent-500 transition-colors">
              <Icon :name="a.icon" class="h-5 w-5" />
            </div>
            <h3 class="mt-5 font-display text-lg font-bold text-ink-900">{{ a.title }}</h3>
            <p class="mt-2 text-sm text-ink-600 leading-relaxed">{{ a.desc }}</p>
            <span class="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-900">
              {{ a.cta }}
              <Icon name="lucide:arrow-right" class="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </a>
        </div>
      </div>
    </section>
  </div>
</template>
