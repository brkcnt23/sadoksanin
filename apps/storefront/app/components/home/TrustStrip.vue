<script setup lang="ts">
const items = [
  {
    icon: 'lucide:truck',
    title: 'Türkiye Geneli Sevkiyat',
    desc: '24-72 saat içinde lojistik partner ile teslimat.',
  },
  {
    icon: 'lucide:shield-check',
    title: 'Yetkili Distribütörlük',
    desc: 'Roca, VitrA, Selen, NSK için resmi yetkili bayi.',
  },
  {
    icon: 'lucide:headset',
    title: 'Bayi Destek Hattı',
    desc: 'Mesai içi 30 dakika içinde dönüş garantisi.',
  },
  {
    icon: 'lucide:badge-percent',
    title: 'Bayi Özel Fiyatlar',
    desc: 'Kademeli iskonto, lojistik şehre göre hesaplanır.',
  },
]
</script>

<template>
  <section class="border-y border-ink-100 bg-ink-50">
    <div class="container-x py-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="flex items-start gap-4"
      >
        <div class="h-11 w-11 rounded-md bg-primary-900 text-accent-500 grid place-items-center shrink-0">
          <Icon :name="item.icon" class="h-5 w-5" />
        </div>
        <div>
          <p class="text-sm font-bold text-ink-900">{{ item.title }}</p>
          <p class="mt-1 text-xs text-ink-600 leading-relaxed">{{ item.desc }}</p>
        </div>
      </div>
    </div>
  </section>
</template>
