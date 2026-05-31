<script setup lang="ts">
interface Props {
  modelValue: string
  options: string[]
  placeholder?: string
  label?: string
  creatable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Seçin veya yazın...',
  creatable: true,
})

const emit = defineEmits<{ (e: 'update:modelValue', v: string): void; (e: 'create', v: string): void }>()

const search = ref('')
const open = ref(false)
const wrapper = ref<HTMLElement | null>(null)

// When modelValue changes externally, sync search
watch(
  () => props.modelValue,
  (v) => {
    search.value = v
  },
  { immediate: true },
)

const filtered = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return props.options.slice(0, 50)
  return props.options.filter((o) => o.toLowerCase().includes(q)).slice(0, 30)
})

const exactMatch = computed(() => {
  const q = search.value.trim()
  if (!q) return false
  return props.options.some((o) => o.toLowerCase() === q.toLowerCase())
})

const select = (value: string) => {
  search.value = value
  emit('update:modelValue', value)
  open.value = false
}

const createNew = () => {
  const value = search.value.trim()
  if (!value) return
  emit('update:modelValue', value)
  emit('create', value)
  open.value = false
}

const onFocus = () => {
  open.value = true
}

const onBlur = () => {
  // Delay close to allow click on dropdown items
  setTimeout(() => {
    open.value = false
    // Restore original value if no selection made
    search.value = props.modelValue
  }, 200)
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (!exactMatch.value && props.creatable && search.value.trim()) {
      createNew()
    } else if (filtered.value.length > 0) {
      select(filtered.value[0])
    }
    open.value = false
  }
  if (e.key === 'Escape') {
    open.value = false
    search.value = props.modelValue
  }
}

// Close on click outside
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (e: MouseEvent) => {
  if (wrapper.value && !wrapper.value.contains(e.target as Node)) {
    open.value = false
    search.value = props.modelValue
  }
}
</script>

<template>
  <div ref="wrapper" class="relative">
    <label v-if="label" class="block text-xs font-medium text-ink-700 mb-1">{{ label }}</label>
    <div class="relative">
      <Icon
        name="lucide:search"
        class="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-400 pointer-events-none"
      />
      <input
        v-model="search"
        type="text"
        :placeholder="placeholder"
        class="w-full pl-9 pr-8 py-2 border border-ink-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
      />
      <!-- Clear / dropdown toggle -->
      <button
        v-if="search"
        type="button"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-ink-400 hover:text-ink-600 rounded"
        @mousedown.prevent="search = ''; emit('update:modelValue', '')"
      >
        <Icon name="lucide:x" class="w-3.5 h-3.5" />
      </button>
      <Icon
        v-else
        name="lucide:chevron-down"
        class="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none"
      />
    </div>

    <!-- Dropdown -->
    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 scale-95 -translate-y-1"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-if="open"
        class="absolute z-50 mt-1 w-full bg-white border border-ink-200 rounded-lg shadow-lg overflow-hidden max-h-56 overflow-y-auto"
      >
        <!-- Empty state -->
        <div
          v-if="filtered.length === 0 && !creatable"
          class="px-3 py-3 text-xs text-ink-400 text-center"
        >
          Sonuç bulunamadı
        </div>

        <!-- Options -->
        <button
          v-for="option in filtered"
          :key="option"
          type="button"
          class="w-full text-left px-3 py-2 text-sm hover:bg-primary-50 hover:text-primary-700 transition-colors flex items-center gap-2"
          :class="{ 'bg-primary-50 text-primary-700 font-medium': option.toLowerCase() === modelValue.toLowerCase() }"
          @mousedown.prevent="select(option)"
        >
          <Icon
            v-if="option.toLowerCase() === modelValue.toLowerCase()"
            name="lucide:check"
            class="w-3.5 h-3.5 text-primary-600 flex-shrink-0"
          />
          <span v-else class="w-3.5 flex-shrink-0" />
          {{ option }}
        </button>

        <!-- Create new option -->
        <div v-if="creatable && search.trim() && !exactMatch" class="border-t border-ink-100">
          <button
            type="button"
            class="w-full text-left px-3 py-2.5 text-sm text-primary-600 hover:bg-primary-50 transition-colors flex items-center gap-2 font-medium"
            @mousedown.prevent="createNew"
          >
            <Icon name="lucide:plus-circle" class="w-4 h-4 flex-shrink-0" />
            "<span class="font-semibold truncate max-w-48">{{ search.trim() }}</span>" oluştur
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
