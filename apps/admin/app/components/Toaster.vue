<template>
  <Teleport to="body">
    <div
      v-if="toasts.length"
      class="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      <TransitionGroup name="toast">
        <div
          v-for="t in toasts"
          :key="t.id"
          class="pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg bg-white animate-in slide-in-from-right-2"
          :class="{
            'border-green-200': t.type === 'success',
            'border-red-200': t.type === 'error',
            'border-blue-200': t.type === 'info',
            'border-amber-200': t.type === 'warning',
          }"
        >
          <Icon
            :name="iconMap[t.type]"
            class="w-5 h-5 shrink-0 mt-0.5"
            :class="{
              'text-green-600': t.type === 'success',
              'text-red-600': t.type === 'error',
              'text-blue-600': t.type === 'info',
              'text-amber-600': t.type === 'warning',
            }"
          />
          <span class="flex-1 text-sm text-ink-800 leading-snug">{{ t.message }}</span>
          <button
            class="shrink-0 p-0.5 hover:bg-ink-100 rounded transition-colors -mt-0.5 -mr-1"
            @click="dismiss(t.id)"
          >
            <Icon name="lucide:x" class="w-4 h-4 text-ink-400" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
const { toasts, dismiss } = useToast()

const iconMap: Record<string, string> = {
  success: 'lucide:circle-check',
  error: 'lucide:circle-x',
  info: 'lucide:info',
  warning: 'lucide:triangle-alert',
}
</script>

<style scoped>
.toast-enter-active {
  transition: all 0.25s ease-out;
}
.toast-leave-active {
  transition: all 0.2s ease-in;
}
.toast-enter-from {
  opacity: 0;
  transform: translateX(1rem);
}
.toast-leave-to {
  opacity: 0;
  transform: translateX(2rem);
}
</style>
