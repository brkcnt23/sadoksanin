<script setup lang="ts">
const route = useRoute()
const slug = computed(() => {
  const s = route.params.slug
  return Array.isArray(s) ? s[0] || '' : s || ''
})

// Sub kategori arama filtresini de aktar: /kategori/seramik?ara=60x120
const searchParam = computed(() => {
  const ara = route.query.ara
  return ara && typeof ara === 'string' ? `&ara=${encodeURIComponent(ara)}` : ''
})

await navigateTo(`/urunler?kategori=${slug.value}${searchParam.value}`, { replace: true })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-ink-600">Yonlendiriliyor...</p>
  </div>
</template>
