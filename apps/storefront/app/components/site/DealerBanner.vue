<script setup lang="ts">
const { dealer, disableDealer } = useDealer()

const formatTL = (n: number) =>
  new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n)
</script>

<template>
  <div
    v-if="dealer"
    class="bg-primary-950 text-white border-b border-primary-800"
  >
    <div class="container-x flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 py-2.5 text-xs">
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-500 text-primary-950 font-bold uppercase tracking-wider">
          <Icon name="lucide:badge-check" class="h-3 w-3" />
          Bayi Modu
        </span>
        <span class="font-semibold">{{ dealer.companyName }}</span>
        <span class="hidden md:inline text-ink-300">•</span>
        <span class="hidden md:inline text-ink-300">
          Lokasyon: <span class="text-accent-400 font-semibold">{{ dealer.city }}</span>
        </span>
        <span class="hidden md:inline text-ink-300">•</span>
        <span class="hidden md:inline text-ink-300">
          Lojistik bedeli: <span class="text-accent-400 font-semibold">+{{ formatTL(dealer.logisticsSurcharge) }} TL</span>
        </span>
      </div>
      <button
        type="button"
        @click="disableDealer"
        class="text-ink-300 hover:text-white inline-flex items-center gap-1 underline-offset-2 hover:underline"
      >
        <Icon name="lucide:log-out" class="h-3.5 w-3.5" />
        Bayi modundan çık
      </button>
    </div>
  </div>
</template>
