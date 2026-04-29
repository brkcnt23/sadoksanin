<script setup lang="ts">
const { toasts, dismiss } = useToast()

const variantStyle = (v: string) => {
  switch (v) {
    case 'success': return 'border-emerald-300 bg-emerald-50 text-emerald-900'
    case 'warning': return 'border-amber-300 bg-amber-50 text-amber-900'
    case 'error':   return 'border-red-300 bg-red-50 text-red-900'
    default:        return 'border-primary-200 bg-white text-ink-900'
  }
}

const variantIcon = (v: string) => {
  switch (v) {
    case 'success': return 'lucide:check-circle-2'
    case 'warning': return 'lucide:alert-triangle'
    case 'error':   return 'lucide:x-circle'
    default:        return 'lucide:info'
  }
}

const variantIconColor = (v: string) => {
  switch (v) {
    case 'success': return 'text-emerald-600'
    case 'warning': return 'text-amber-600'
    case 'error':   return 'text-red-600'
    default:        return 'text-primary-700'
  }
}
</script>

<template>
  <div class="fixed top-6 right-6 z-[60] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
    <TransitionGroup
      tag="div"
      class="flex flex-col gap-3"
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-x-6"
      enter-to-class="opacity-100 translate-x-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-x-0"
      leave-to-class="opacity-0 translate-x-6"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="pointer-events-auto rounded-lg border shadow-elevated overflow-hidden"
        :class="variantStyle(t.variant)"
      >
        <div class="flex items-start gap-3 p-4">
          <Icon :name="variantIcon(t.variant)" :class="['h-5 w-5 mt-0.5 shrink-0', variantIconColor(t.variant)]" />
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold leading-snug">{{ t.title }}</p>
            <p v-if="t.description" class="mt-1 text-sm leading-relaxed opacity-80">
              {{ t.description }}
            </p>
          </div>
          <button
            type="button"
            class="shrink-0 -mr-1 -mt-1 h-7 w-7 grid place-items-center rounded-md hover:bg-black/5"
            @click="dismiss(t.id)"
          >
            <Icon name="lucide:x" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>
