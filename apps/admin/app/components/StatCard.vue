<script setup lang="ts">
interface Props {
  label: string
  value: string | number
  icon: string
  trend?: { value: number; label: string }
  color?: 'blue' | 'amber' | 'green' | 'red' | 'purple' | 'slate'
}

const props = withDefaults(defineProps<Props>(), { color: 'blue' })

const palette: Record<NonNullable<Props['color']>, { bg: string; fg: string }> = {
  blue: { bg: 'bg-blue-50', fg: 'text-blue-600' },
  amber: { bg: 'bg-amber-50', fg: 'text-amber-600' },
  green: { bg: 'bg-emerald-50', fg: 'text-emerald-600' },
  red: { bg: 'bg-red-50', fg: 'text-red-600' },
  purple: { bg: 'bg-violet-50', fg: 'text-violet-600' },
  slate: { bg: 'bg-slate-100', fg: 'text-slate-600' },
}
</script>

<template>
  <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{{ label }}</p>
        <p class="text-2xl font-bold text-slate-900 mt-1.5 truncate">{{ value }}</p>
        <p
          v-if="trend"
          class="text-xs mt-1.5 flex items-center gap-1"
          :class="trend.value >= 0 ? 'text-emerald-600' : 'text-red-600'"
        >
          <Icon :name="trend.value >= 0 ? 'lucide:trending-up' : 'lucide:trending-down'" class="w-3 h-3" />
          {{ trend.value >= 0 ? '+' : '' }}{{ trend.value }}% — {{ trend.label }}
        </p>
      </div>
      <div :class="['p-2.5 rounded-lg shrink-0', palette[props.color].bg]">
        <Icon :name="icon" :class="['w-5 h-5', palette[props.color].fg]" />
      </div>
    </div>
  </div>
</template>
