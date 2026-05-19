<script setup lang="ts">
interface Props {
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'
  label: string
  icon?: string
}
const props = defineProps<Props>()

const palette: Record<Props['variant'], string> = {
  success: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  warning: 'bg-amber-100 text-amber-800 ring-amber-200',
  danger: 'bg-red-100 text-red-800 ring-red-200',
  info: 'bg-primary-100 text-primary-800 ring-primary-200',
  neutral: 'bg-ink-100 text-ink-700 ring-ink-200',
  purple: 'bg-violet-100 text-violet-800 ring-violet-200',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset',
      palette[props.variant],
    ]"
  >
    <Icon v-if="icon" :name="icon" class="w-3 h-3" />
    {{ label }}
  </span>
</template>
