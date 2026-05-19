<script setup lang="ts">
interface Props {
  open: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}
const props = withDefaults(defineProps<Props>(), { size: 'md' })
const emit = defineEmits<{ close: [] }>()

const sizes: Record<NonNullable<Props['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
  '2xl': 'max-w-7xl',
}

const handleKey = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.open) emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKey))
onUnmounted(() => window.removeEventListener('keydown', handleKey))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
        @click.self="emit('close')"
      >
        <div
          :class="['bg-white rounded-xl shadow-xl w-full overflow-hidden flex flex-col max-h-[90vh]', sizes[props.size]]"
        >
          <header
            v-if="title"
            class="px-6 py-4 border-b border-ink-200 flex items-center justify-between shrink-0"
          >
            <h3 class="font-semibold text-ink-900">{{ title }}</h3>
            <button
              @click="emit('close')"
              class="p-1.5 hover:bg-ink-100 rounded-md text-ink-500 transition-colors"
            >
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </header>
          <div class="flex-1 overflow-auto">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="px-6 py-4 border-t border-ink-200 bg-ink-50 shrink-0">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
