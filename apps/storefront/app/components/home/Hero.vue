<script setup lang="ts">
const stats = [
  { value: '23+',   label: 'Yıllık Tecrübe' },
  { value: '50+',   label: 'Marka' },
  { value: '4.000+', label: 'Ürün' },
  { value: '300+',  label: 'Bayi' },
]

// ── Mouse → Canvas dot repulsion ─────────────────────
const heroRef  = ref<HTMLElement>()
const dotLogoRef = ref<InstanceType<typeof SiteDotLogo>>()

function onMouseMove(e: MouseEvent) {
  dotLogoRef.value?.setMouse(e.clientX, e.clientY)
}
function onMouseLeave() {
  dotLogoRef.value?.clearMouse()
}
</script>

<template>
  <section
    ref="heroRef"
    class="relative overflow-hidden bg-primary-950 text-white"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <!-- Background image -->
    <div class="absolute inset-0">
      <img
        src="https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=2000&q=85"
        alt=""
        class="h-full w-full object-cover opacity-40"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-950/85 to-primary-950/40" />
      <div class="absolute inset-0 bg-grid-overlay opacity-50" />
    </div>

    <!-- Dot logo — Canvas, mouse repulsion hero section'dan geliyor -->
    <div class="absolute right-0 top-0 bottom-0 pointer-events-none hidden lg:block"
         style="width: 52vw; max-width: 720px; opacity: 0.28;">
      <SiteDotLogo ref="dotLogoRef" :ambient="true" />
    </div>

    <div class="relative container-x pt-24 pb-28 lg:pt-32 lg:pb-36 grid lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-7">
        <p class="reveal eyebrow text-accent-400">Banyo &amp; Yapı Malzemeleri Distribütörü</p>

        <h1 class="reveal reveal-delay-1 mt-5 font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.02] tracking-tightest text-white">
          Premium banyo,<br />
          <span class="text-accent-500">profesyonel</span> tedarik.
        </h1>

        <p class="reveal reveal-delay-2 mt-7 max-w-xl text-lg text-ink-300 leading-relaxed">
          1.500 m² showroom, 4.000'i aşkın stok kalemi ve Türkiye geneli 300'ü aşkın bayi ağı ile
          banyo, sıhhi tesisat ve yapı malzemelerinde uçtan uca çözüm ortağınız.
        </p>

        <div class="reveal reveal-delay-3 mt-9 flex flex-wrap items-center gap-4">
          <NuxtLink to="/urunler" class="btn-accent">
            Ürünleri Keşfet
            <Icon name="lucide:arrow-right" class="h-4 w-4" />
          </NuxtLink>
          <NuxtLink
            to="/bayilik"
            class="btn border border-white/20 text-white hover:bg-white/10"
          >
            Bayimiz Ol
          </NuxtLink>
        </div>

        <dl class="reveal reveal-delay-4 mt-14 grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-6 max-w-2xl">
          <div v-for="s in stats" :key="s.label">
            <dt class="text-3xl md:text-4xl font-display font-extrabold text-accent-500">
              {{ s.value }}
            </dt>
            <dd class="mt-1 text-xs uppercase tracking-wider text-ink-400">
              {{ s.label }}
            </dd>
          </div>
        </dl>
      </div>

      <!-- Floating product card -->
      <div class="hidden lg:block lg:col-span-5 reveal reveal-delay-3">
        <div class="relative">
          <div class="absolute -inset-4 bg-accent-500/20 blur-3xl rounded-full" />
          <div class="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm">
            <img
              src="https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=85"
              alt="Sento Asma Klozet Seti"
              class="w-full aspect-[4/5] object-cover"
            />
            <div class="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-5 backdrop-blur">
              <p class="text-[10px] uppercase tracking-[0.2em] font-semibold text-accent-600">
                VitrA — Yetkili Distribütör
              </p>
              <p class="mt-1 font-display text-lg font-bold text-primary-950">
                Sento Asma Klozet Seti
              </p>
              <div class="mt-2 flex items-baseline justify-between">
                <p class="text-2xl font-display font-extrabold text-primary-950">
                  7.890 <span class="text-sm font-medium text-ink-500">TL</span>
                </p>
                <span class="text-xs text-emerald-600 font-medium">Stokta 8 adet</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
