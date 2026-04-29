<script setup lang="ts">
const { isDealer } = useDealer()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <SiteDealerBanner v-if="isDealer" />
    <SiteHeader />
    <SiteCategoryNav />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <SiteToast />
  </div>
</template>
