<script setup lang="ts">
const { isDealer } = useDealer()
const { loadUser } = useAuth()

onMounted(() => {
  loadUser()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-white">
    <SiteDealerBanner v-if="isDealer" />
    <SiteHeader />
    <!-- SiteCategoryNav kaldırıldı: yerini Header içindeki SiteProductsMegaMenu aldı.
         Component dosyası yedek olarak components/site/CategoryNav.vue'da duruyor. -->
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <SiteToast />
    <SitePopupDisplay />
  </div>
</template>
