<script setup lang="ts">
interface Action {
  label: string
  icon?: string
  variant?: 'primary' | 'danger' | 'neutral'
  disabled?: boolean
  action: () => void
}
interface Props {
  actions: Action[]
  size?: 'sm' | 'md'
}
const props = withDefaults(defineProps<Props>(), { size: 'md' })

const btnClass = (a: Action) => {
  const size = props.size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
  const base = `inline-flex items-center gap-1 font-medium rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${size}`
  if (a.variant === 'danger') return `${base} text-red-700 hover:bg-red-50`
  if (a.variant === 'neutral') return `${base} text-ink-600 hover:bg-ink-100`
  return `${base} text-primary-700 hover:bg-primary-50`
}
</script>

<template>
  <div class="flex items-center gap-1">
    <button v-for="a in actions" :key="a.label" :disabled="a.disabled" :class="btnClass(a)" @click="a.action">
      <Icon v-if="a.icon" :name="a.icon" class="w-3.5 h-3.5" />
      {{ a.label }}
    </button>
  </div>
</template>
