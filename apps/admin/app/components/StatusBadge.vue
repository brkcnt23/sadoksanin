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
  info: 'bg-blue-100 text-blue-800 ring-blue-200',
  neutral: 'bg-slate-100 text-slate-700 ring-slate-200',
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
