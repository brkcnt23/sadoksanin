<script setup lang="ts">
const props = defineProps<{
  stats: Array<{ label: string; value: string | number; icon: string }>
}>()

const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-900 via-primary-800 to-accent-700 p-6 lg:p-8">
    <!-- Decorative background elements -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute -top-20 -right-20 w-80 h-80 bg-white rounded-full blur-3xl" />
      <div class="absolute -bottom-20 -left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
    </div>

    <div class="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <p class="text-primary-200 text-sm font-medium">{{ today }}</p>
        <h1 class="text-2xl lg:text-3xl font-bold text-white mt-1">Sadöksan Yönetim Paneli</h1>
        <p class="text-primary-200/80 text-sm mt-2 max-w-md">Siparişleri yönetin, ürün kataloğunu güncelleyin, bayi ve stok durumunu takip edin.</p>
      </div>

      <!-- Quick Stats Row -->
      <div class="flex gap-3 lg:gap-5">
        <div v-for="stat in stats.slice(0, 3)" :key="stat.label" class="text-center">
          <div class="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-1.5">
            <Icon :name="stat.icon" class="w-6 h-6 text-white" />
          </div>
          <p class="text-white font-bold text-lg lg:text-xl">{{ stat.value }}</p>
          <p class="text-primary-200 text-xs">{{ stat.label }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
