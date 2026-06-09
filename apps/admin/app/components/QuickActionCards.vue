<script setup lang="ts">
interface ActionCard {
  title: string
  description: string
  icon: string
  to: string
  color: string
}

const props = withDefaults(defineProps<{
  cards?: ActionCard[]
}>(), {
  cards: () => [
    { title: 'Yeni Ürün', description: 'Kataloğa ürün ekleyin', icon: 'lucide:package-plus', to: '/urunler', color: 'from-primary-600 to-primary-800' },
    { title: 'Siparişler', description: 'Bekleyen siparişleri yönetin', icon: 'lucide:clipboard-list', to: '/siparisler', color: 'from-amber-500 to-orange-600' },
    { title: 'Raporlar', description: 'Satış ve stok raporları', icon: 'lucide:bar-chart-3', to: '/raporlar', color: 'from-emerald-500 to-teal-700' },
    { title: 'Bayiler', description: 'Bayi başvuruları ve yönetimi', icon: 'lucide:users', to: '/bayiler', color: 'from-violet-500 to-purple-700' },
  ],
})
</script>

<template>
  <div class="grid [grid-template-areas:'stack'] place-items-center py-4">
    <NuxtLink
      v-for="(card, index) in cards"
      :key="card.to"
      :to="card.to"
      class="[grid-area:stack] w-full max-w-xs bg-white rounded-2xl border border-ink-200/60 p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 cursor-pointer group"
      :style="{
        transform: `translateX(${index * 16}px) translateY(${index * 10}px)`,
        zIndex: cards.length - index,
      }"
    >
      <div class="flex items-start gap-4">
        <div :class="`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`">
          <Icon :name="card.icon" class="w-5 h-5 text-white" />
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-ink-900 group-hover:text-primary-900 transition-colors">{{ card.title }}</h3>
          <p class="text-sm text-ink-500 mt-0.5">{{ card.description }}</p>
        </div>
        <Icon name="lucide:arrow-right" class="w-4 h-4 text-ink-300 group-hover:text-primary-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
      </div>
    </NuxtLink>
  </div>
</template>
