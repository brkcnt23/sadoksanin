<script setup lang="ts">
interface Props {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'primary'
}
const props = withDefaults(defineProps<Props>(), {
  confirmLabel: 'Onayla',
  cancelLabel: 'İptal',
  variant: 'primary',
})
const emit = defineEmits<{ close: []; confirm: [] }>()

const variantStyles: Record<string, string> = {
  danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  warning: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
  primary: 'bg-primary-600 hover:bg-primary-700 focus:ring-primary-500',
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40" @click="emit('close')" />
      <div class="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-lg font-semibold text-ink-900 mb-2">{{ title }}</h3>
        <p class="text-sm text-ink-600 mb-6">{{ message }}</p>
        <div class="flex justify-end gap-3">
          <button @click="emit('close')" class="px-4 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50 rounded-lg transition-colors">{{ cancelLabel }}</button>
          <button @click="emit('confirm')" :class="['px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2', variantStyles[variant]]">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
