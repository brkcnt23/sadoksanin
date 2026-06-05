<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()

const { data: page, error } = await useFetch(`/cms/pages/${route.params.slug}`, {
  baseURL: config.public.apiBase,
  key: `cms-page-${route.params.slug}`,
})

useHead({
  title: () => (page.value as any)?.seoTitle || (page.value as any)?.title || 'Sayfa',
  meta: [{ name: 'description', content: (page.value as any)?.seoMeta || '' }],
})

// CMS'ten gelen tarihi formatla
const lastUpdated = computed(() => {
  const d = (page.value as any)?.updatedAt
  if (!d) return ''
  return new Date(d).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })
})
</script>

<template>
  <!-- Hata -->
  <div v-if="error" class="min-h-screen bg-ink-50/50 flex items-center justify-center">
    <div class="text-center py-20 px-6">
      <div class="w-16 h-16 bg-red-100 rounded-2xl grid place-items-center mx-auto mb-4">
        <Icon name="lucide:alert-circle" class="h-8 w-8 text-red-500" />
      </div>
      <h1 class="text-2xl font-bold text-primary-900 mb-2">Sayfa Bulunamadı</h1>
      <p class="text-ink-500 mb-6">Aradığınız sayfa mevcut değil veya kaldırılmış.</p>
      <NuxtLink to="/" class="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-900 text-white rounded-xl font-semibold hover:bg-primary-800 transition-colors">
        <Icon name="lucide:home" class="h-4 w-4" />
        Ana Sayfaya Dön
      </NuxtLink>
    </div>
  </div>

  <!-- Loading -->
  <div v-else-if="!page" class="min-h-screen bg-ink-50/50 flex items-center justify-center">
    <div class="flex items-center gap-3 text-ink-500">
      <Icon name="lucide:loader" class="h-5 w-5 animate-spin" />
      Yükleniyor...
    </div>
  </div>

  <!-- Sayfa içeriği -->
  <SiteInfoPage
    v-else
    :title="page.title"
    :description="page.description || page.seoMeta || ''"
    :content="page.content"
    :last-updated="lastUpdated"
  />
</template>
