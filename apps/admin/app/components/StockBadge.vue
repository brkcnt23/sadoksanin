<script setup lang="ts">
interface Props {
  displayStock: number
  minimumStock?: number
  middleStock?: number
  showLabel?: boolean
}
const props = withDefaults(defineProps<Props>(), { minimumStock: 5, middleStock: 20, showLabel: true })

const status = computed(() => {
  if (props.displayStock <= 0) return { variant: 'danger', label: 'Stoksuz', icon: 'lucide:alert-circle' }
  if (props.displayStock <= (props.minimumStock || 5)) return { variant: 'warning', label: 'Kritik', icon: 'lucide:alert-triangle' }
  if (props.displayStock <= (props.middleStock || 20)) return { variant: 'amber', label: 'Azalan', icon: 'lucide:trending-down' }
  return { variant: 'success', label: 'Yeterli', icon: 'lucide:check-circle' }
})
</script>

<template>
  <div class="inline-flex items-center gap-1.5">
    <span :class="['inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset', {
      'bg-red-100 text-red-800 ring-red-200': status.variant === 'danger',
      'bg-amber-100 text-amber-800 ring-amber-200': status.variant === 'warning' || status.variant === 'amber',
      'bg-emerald-100 text-emerald-800 ring-emerald-200': status.variant === 'success',
    }]">
      <Icon :name="status.icon" class="w-3 h-3" />
      <span v-if="showLabel">{{ status.label }}</span>
      <span> ({{ displayStock }})</span>
    </span>
  </div>
</template>
