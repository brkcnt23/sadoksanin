<script setup lang="ts">
interface Props {
  amount: number
  currency?: string
  bold?: boolean
  sign?: boolean
}
const props = withDefaults(defineProps<Props>(), { currency: 'TRY', bold: false, sign: false })

const formatted = computed(() => {
  const n = Math.abs(props.amount)
  const f = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: props.currency,
    minimumFractionDigits: 2,
  }).format(n)
  if (props.sign && props.amount < 0) return `−${f}`
  return props.amount < 0 ? `−${f}` : f
})

const colorClass = computed(() => {
  if (props.amount > 0) return 'text-emerald-600'
  if (props.amount < 0) return 'text-red-600'
  return 'text-ink-600'
})
</script>

<template>
  <span :class="['tabular-nums', colorClass, { 'font-semibold': bold }]">{{ formatted }}</span>
</template>
