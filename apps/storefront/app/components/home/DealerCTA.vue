<script setup lang="ts">
const benefits = [
  'Bayi özel iskonto kademeleri',
  'Cari hesap görüntüleme ve ekstre indirme',
  'Lojistik şehrine göre otomatik fiyatlandırma',
  'Sipariş onay & sevkiyat takibi',
  'E-fatura/e-irsaliye otomasyonu',
  '7/24 ürün kataloğu erişimi',
]
</script>

<template>
  <section class="py-20 md:py-28">
    <div class="container-x">
      <div class="relative overflow-hidden rounded-2xl bg-primary-950 text-white">
        <!-- Background -->
        <div class="absolute inset-0 opacity-30">
          <img
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80"
            alt=""
            class="h-full w-full object-cover"
          />
        </div>
        <div class="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-950/95 to-primary-950/60" />
        <div class="absolute inset-0 bg-grid-overlay" />

        <div class="relative grid lg:grid-cols-2 gap-12 p-10 md:p-14 lg:p-16">
          <div>
            <p class="eyebrow text-accent-400">Bayilik</p>
            <h2 class="mt-3 font-display text-3xl md:text-5xl font-extrabold leading-tight tracking-tight">
              Sadoksan ailesine<br />
              <span class="text-accent-500">katılın.</span>
            </h2>
            <p class="mt-5 max-w-md text-base text-ink-300 leading-relaxed">
              300+ bayimizden biri olun. Online bayi paneli ile sipariş, fiyatlandırma ve cari yönetimi tek noktada.
            </p>

            <div class="mt-9 flex flex-wrap items-center gap-3">
              <NuxtLink to="/bayilik" class="btn-accent">
                Bayilik Başvurusu
                <Icon name="lucide:arrow-right" class="h-4 w-4" />
              </NuxtLink>
              <NuxtLink
                to="/bayi"
                class="btn border border-white/20 text-white hover:bg-white/10"
              >
                <Icon name="lucide:eye" class="h-4 w-4" />
                Bayi Panelini Önizle
              </NuxtLink>
            </div>
          </div>

          <div>
            <ul class="grid sm:grid-cols-2 gap-3">
              <li
                v-for="(b, i) in benefits"
                :key="i"
                class="flex items-start gap-3 rounded-lg bg-white/5 border border-white/10 p-4"
              >
                <Icon name="lucide:check" class="h-5 w-5 mt-0.5 text-accent-500 shrink-0" />
                <span class="text-sm leading-snug">{{ b }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
