<script setup lang="ts">
const route = useRoute()
const slug = computed(() => {
  const s = route.params.slug
  return Array.isArray(s) ? s[0] || '' : s || ''
})
await navigateTo(`/urunler?kategori=${slug.value}`, { replace: true })
</script>

<template>
  <div class="min-h-screen flex items-center justify-center">
    <p class="text-ink-600">Yonlendiriliyor...</p>
  </div>
</template>
