<template>
  <section class="py-20 md:py-28 bg-white">
    <div class="container-x grid lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-5 relative">
        <div class="aspect-[4/5] rounded-xl overflow-hidden bg-ink-100">
          <img
            src="https://images.unsplash.com/photo-1581094271901-8022df4466f9?auto=format&fit=crop&w=1200&q=85"
            alt="Sadoksan showroom"
            class="h-full w-full object-cover"
          />
        </div>
        <div class="hidden md:block absolute -bottom-6 -right-6 max-w-[260px] rounded-xl bg-accent-500 text-primary-950 p-6 shadow-elevated">
          <p class="font-display text-4xl font-extrabold">23+</p>
          <p class="mt-1 text-sm font-semibold uppercase tracking-wider">Yıllık Tecrübe</p>
          <p class="mt-2 text-xs leading-relaxed">2003'ten beri profesyonel banyo &amp; tesisat tedarikçisi.</p>
        </div>
      </div>

      <div class="lg:col-span-7">
        <p class="eyebrow">Hakkımızda</p>
        <h2 class="mt-3 heading-lg">
          Sadoksan, banyo ve tesisat alanında<br />
          <span class="text-accent-600">güvenilir tedarik ortağı.</span>
        </h2>
        <p class="mt-6 lead">
          2003'te Aksaray'da kurulduğumuz günden bu yana sektörün önde gelen markalarının yetkili
          distribütörlüğünü üstleniyoruz. 1.500 m² showroom, 2.500 m² depo ve 35 kişilik teknik
          ekibimizle Türkiye geneli bayi ağımıza kesintisiz hizmet sunuyoruz.
        </p>

        <div class="mt-8 grid sm:grid-cols-2 gap-5">
          <div class="rounded-lg border border-ink-100 p-5">
            <Icon name="lucide:building-2" class="h-6 w-6 text-primary-900" />
            <p class="mt-3 text-base font-bold text-ink-900">Profesyonel Showroom</p>
            <p class="mt-1 text-sm text-ink-600">1.500 m²'lik teşhir alanında 2.000+ uygulamalı ürün.</p>
          </div>
          <div class="rounded-lg border border-ink-100 p-5">
            <Icon name="lucide:warehouse" class="h-6 w-6 text-primary-900" />
            <p class="mt-3 text-base font-bold text-ink-900">Hızlı Sevkiyat</p>
            <p class="mt-1 text-sm text-ink-600">2.500 m² stoklu depo ile 24-72 saat teslimat.</p>
          </div>
        </div>

        <NuxtLink to="/hakkimizda" class="mt-9 inline-flex btn-outline">
          Daha Fazla Bilgi
          <Icon name="lucide:arrow-right" class="h-4 w-4" />
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
