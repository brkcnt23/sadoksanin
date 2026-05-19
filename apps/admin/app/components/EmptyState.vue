<script setup lang="ts">
interface Props {
  icon?: string
  title: string
  description?: string
}
withDefaults(defineProps<Props>(), { icon: 'lucide:inbox' })
</script>

<template>
  <div class="text-center py-12 px-4">
    <Icon :name="icon" class="w-12 h-12 text-ink-300 mx-auto mb-3" />
    <p class="font-medium text-ink-700">{{ title }}</p>
    <p v-if="description" class="text-sm text-ink-500 mt-1">{{ description }}</p>
    <slot />
  </div>
</template>
