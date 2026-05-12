<script setup lang="ts">
interface Props {
  page: number
  totalPages: number
  total: number
  pageSize: number
}
const props = defineProps<Props>()
const emit = defineEmits<{ change: [page: number] }>()

const range = computed(() => {
  const max = 7
  const pages: (number | '…')[] = []
  if (props.totalPages <= max) {
    for (let i = 1; i <= props.totalPages; i++) pages.push(i)
    return pages
  }
  const left = Math.max(2, props.page - 1)
  const right = Math.min(props.totalPages - 1, props.page + 1)
  pages.push(1)
  if (left > 2) pages.push('…')
  for (let i = left; i <= right; i++) pages.push(i)
  if (right < props.totalPages - 1) pages.push('…')
  pages.push(props.totalPages)
  return pages
})

const start = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.pageSize + 1))
const end = computed(() => Math.min(props.page * props.pageSize, props.total))
</script>

<template>
  <div class="flex items-center justify-between px-1 py-2">
    <p class="text-sm text-slate-600">
      <span class="font-medium">{{ start }}-{{ end }}</span> / {{ total }}
    </p>
    <div class="flex items-center gap-1">
      <button
        :disabled="page === 1"
        @click="emit('change', page - 1)"
        class="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Icon name="lucide:chevron-left" class="w-4 h-4" />
      </button>
      <button
        v-for="(p, i) in range"
        :key="i"
        :disabled="p === '…'"
        @click="typeof p === 'number' && emit('change', p)"
        :class="[
          'min-w-[2rem] h-8 px-2 rounded-md text-sm font-medium',
          p === page ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100',
          p === '…' ? 'cursor-default' : '',
        ]"
      >
        {{ p }}
      </button>
      <button
        :disabled="page === totalPages"
        @click="emit('change', page + 1)"
        class="p-1.5 rounded-md text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Icon name="lucide:chevron-right" class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>
