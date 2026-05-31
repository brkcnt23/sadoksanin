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
</script>

<template>
  <div class="min-h-screen bg-white py-12 lg:py-16">
    <div class="container-x max-w-3xl">
      <div v-if="error" class="text-center py-20">
        <Icon name="lucide:alert-circle" class="h-12 w-12 text-ink-300 mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-ink-900 mb-2">Sayfa Bulunamadı</h1>
        <p class="text-ink-500 mb-6">Aradığınız sayfa mevcut değil veya kaldırılmış.</p>
        <NuxtLink to="/" class="text-accent-600 hover:text-accent-700 font-semibold">Ana Sayfaya Dön</NuxtLink>
      </div>

      <article v-else-if="page">
        <h1 class="text-3xl font-bold text-primary-900 mb-8">{{ page.title }}</h1>
        <div class="prose prose-ink max-w-none" v-html="page.content" />
      </article>

      <div v-else class="text-center py-20">
        <Icon name="lucide:loader" class="h-8 w-8 text-accent-500 animate-spin mx-auto mb-4" />
        <p class="text-ink-500">Yükleniyor...</p>
      </div>
    </div>
  </div>
</template>
