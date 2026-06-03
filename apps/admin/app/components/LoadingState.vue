<script setup lang="ts">
interface Props {
  type?: 'skeleton' | 'spinner' | 'table'
  rows?: number
}
const props = withDefaults(defineProps<Props>(), { type: 'spinner', rows: 5 })
</script>

<template>
  <div v-if="type === 'spinner'" class="flex items-center justify-center py-12">
    <div class="flex flex-col items-center gap-3">
      <div class="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      <p class="text-sm text-ink-500">Yükleniyor...</p>
    </div>
  </div>

  <div v-else-if="type === 'skeleton'" class="space-y-4 p-4">
    <div v-for="i in rows" :key="i" class="flex items-center gap-4">
      <div class="h-10 w-10 rounded-lg bg-ink-100 animate-pulse shrink-0" />
      <div class="flex-1 space-y-2">
        <div class="h-4 bg-ink-100 rounded animate-pulse" :style="{ width: `${60 + Math.random() * 30}%` }" />
        <div class="h-3 bg-ink-100 rounded animate-pulse w-2/3" />
      </div>
    </div>
  </div>

  <div v-else-if="type === 'table'" class="p-4 space-y-3">
    <div class="flex gap-4 mb-4">
      <div class="h-8 w-32 bg-ink-100 rounded animate-pulse" />
      <div class="h-8 w-48 bg-ink-100 rounded animate-pulse" />
    </div>
    <div class="h-10 bg-ink-100 rounded animate-pulse" />
    <div v-for="i in rows" :key="i" class="h-12 bg-ink-50 rounded animate-pulse" :style="{ width: `${85 + Math.random() * 15}%` }" />
  </div>
</template>
