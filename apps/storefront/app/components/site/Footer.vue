<script setup lang="ts">
const { brands } = useCatalog()
const { categories } = useCatalog()
const year = new Date().getFullYear()
</script>

<template>
  <footer class="bg-primary-950 text-ink-300 mt-24">
    <div class="container-x py-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
      <div>
        <NuxtLink to="/" class="flex items-center gap-3 group">
          <img
            src="/img/logo/headerlogo.png"
            alt="Sadöksan İnşaat"
            class="h-12 w-auto object-contain brightness-0 invert"
          />
          <div class="flex flex-col leading-tight">
            <span class="font-display text-xl font-extrabold tracking-tight text-white group-hover:text-accent-400 transition-colors uppercase">
              Sadöksan
            </span>
            <span class="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent-500">
              İnşaat
            </span>
          </div>
        </NuxtLink>
        <p class="mt-4 text-sm leading-relaxed text-ink-400 max-w-xs">
          Banyo, sıhhi tesisat ve yapı malzemeleri distribütörlüğünde güvenilir çözüm ortağınız.
          Türkiye geneli 300'ü aşkın bayi ağı.
        </p>
        <div class="mt-6 flex items-center gap-3">
          <a
            v-for="(s, i) in [
              { icon: 'lucide:instagram', href: '#' },
              { icon: 'lucide:facebook', href: '#' },
              { icon: 'lucide:youtube', href: '#' },
            ]"
            :key="i"
            :href="s.href"
            class="h-9 w-9 grid place-items-center rounded-md bg-white/5 hover:bg-accent-500 hover:text-primary-950 transition-colors"
          >
            <Icon :name="s.icon" class="h-4 w-4" />
          </a>
          <!-- WhatsApp -->
          <a
            href="https://wa.me/905396541720"
            target="_blank"
            rel="noopener"
            class="h-9 w-9 grid place-items-center rounded-md bg-white/5 hover:bg-[#25D366] hover:text-white transition-colors"
            aria-label="WhatsApp"
          >
            <Icon name="lucide:message-circle" class="h-4 w-4" />
          </a>
        </div>
      </div>

      <div>
        <h4 class="text-sm font-semibold uppercase tracking-wider text-white">Kategoriler</h4>
        <ul class="mt-5 space-y-2.5 text-sm">
          <li v-for="c in categories().slice(0, 6)" :key="c.slug">
            <NuxtLink :to="`/kategori/${c.slug}`" class="hover:text-accent-400 transition-colors">
              {{ c.name }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <h4 class="text-sm font-semibold uppercase tracking-wider text-white">Markalar</h4>
        <ul class="mt-5 grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
          <li v-for="b in brands().slice(0, 8)" :key="b.slug">
            <NuxtLink :to="`/marka/${b.slug}`" class="hover:text-accent-400 transition-colors">
              {{ b.name }}
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div>
        <h4 class="text-sm font-semibold uppercase tracking-wider text-white">İletişim</h4>
        <ul class="mt-5 space-y-3.5 text-sm">
          <li class="flex gap-3">
            <Icon name="lucide:map-pin" class="h-4 w-4 mt-0.5 text-accent-500 shrink-0" />
            <span>
              Kazım Karabekir Paşa Mah.<br />
              Demirciler Cad. No: 10<br />
              Yakutiye / Erzurum
            </span>
          </li>
          <li class="flex gap-3">
            <Icon name="lucide:phone" class="h-4 w-4 mt-0.5 text-accent-500 shrink-0" />
            <a href="tel:+904422424259" class="hover:text-white">0442 242 42 59</a>
          </li>
          <li class="flex gap-3">
            <Icon name="lucide:message-circle" class="h-4 w-4 mt-0.5 text-accent-500 shrink-0" />
            <a href="https://wa.me/905396541720" target="_blank" rel="noopener" class="hover:text-white">
              0539 654 17 20
            </a>
          </li>
          <li class="flex gap-3">
            <Icon name="lucide:mail" class="h-4 w-4 mt-0.5 text-accent-500 shrink-0" />
            <a href="mailto:info@sadoksaninsaat.com.tr" class="hover:text-white">info@sadoksaninsaat.com.tr</a>
          </li>
        </ul>
      </div>
    </div>

    <!-- Payment Methods & Security -->
    <div class="border-t border-white/5">
      <div class="container-x py-8">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8">
          <!-- Payment Methods -->
          <div>
            <h5 class="text-xs font-semibold uppercase tracking-wider text-white mb-4">Güvenli Ödeme Yöntemleri</h5>
            <div class="flex items-center gap-3">
              <div class="h-8 px-2 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white">VISA</div>
              <div class="h-8 px-2 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white">MC</div>
              <div class="h-8 px-2 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white">BONUS</div>
              <div class="h-8 px-2 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white">WORLD</div>
              <div class="h-8 px-2 bg-white/10 rounded flex items-center justify-center text-[10px] font-bold text-white">AXESS</div>
            </div>
          </div>

          <!-- Security -->
          <div>
            <h5 class="text-xs font-semibold uppercase tracking-wider text-white mb-4">🔒 Güvenlik</h5>
            <div class="flex items-center gap-3">
              <div class="flex flex-col text-[10px] text-ink-400">
                <span class="font-semibold text-white">256-bit SSL</span>
                <span>Şifreleme Sertifikası</span>
              </div>
            </div>
            <p class="text-xs text-ink-400 mt-3 leading-relaxed">
              Tüm verileriniz 256-bit SSL şifreleme ile korunmaktadır. Kredi kartı bilgileriniz hiçbir zaman sunucularımızda saklanmaz.
            </p>
          </div>

          <!-- Platform -->
          <div>
            <h5 class="text-xs font-semibold uppercase tracking-wider text-white mb-4">Platform</h5>
            <p class="text-xs text-ink-400 leading-relaxed">
              Platform by <a href="#" class="text-accent-400 hover:text-white transition-colors font-semibold">Burak Can®</a>
            </p>
            <p class="text-xs text-ink-500 mt-3">
              Teknoloji ve tasarım çözümleri
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Legal Links -->
    <div class="border-t border-white/5">
      <div class="container-x py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-500">
        <p>© {{ year }} Sadöksan İnşaat. Tüm hakları saklıdır.</p>
        <div class="flex flex-wrap items-center gap-4 md:gap-6">
          <NuxtLink to="/yasal/mesafeli-satis" class="hover:text-white">Mesafeli Satış Sözleşmesi</NuxtLink>
          <NuxtLink to="/yasal/gizlilik" class="hover:text-white">Gizlilik Politikası</NuxtLink>
          <NuxtLink to="/yasal/tuketici-haklari" class="hover:text-white">Tüketici Hakları</NuxtLink>
          <NuxtLink to="/yasal/kisisel-veriler" class="hover:text-white">Kişisel Veriler</NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>
