<script setup lang="ts">
interface Props {
  title: string
  description?: string
}
defineProps<Props>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">{{ title }}</h1>
      <p v-if="description" class="text-sm text-slate-500 mt-1">{{ description }}</p>
    </div>
    <div class="flex items-center gap-2 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
