<script setup lang="ts">
interface Props {
  searchPlaceholder?: string
  showSearch?: boolean
  showDateRange?: boolean
}
const props = withDefaults(defineProps<Props>(), { showSearch: true, showDateRange: false, searchPlaceholder: 'Ara...' })

const search = defineModel<string>('search', { default: '' })
const dateFrom = defineModel<string>('dateFrom', { default: '' })
const dateTo = defineModel<string>('dateTo', { default: '' })
</script>

<template>
  <div class="bg-white rounded-xl border border-ink-200 p-4">
    <div class="flex flex-wrap items-center gap-3">
      <div v-if="showSearch" class="relative flex-1 min-w-[200px] max-w-sm">
        <Icon name="lucide:search" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input v-model="search" type="text" :placeholder="searchPlaceholder" class="w-full pl-9 pr-3 py-2 border border-ink-300 rounded-lg text-sm bg-white" />
      </div>
      <div v-if="showDateRange" class="flex items-center gap-2">
        <input v-model="dateFrom" type="date" class="px-3 py-2 border border-ink-300 rounded-lg text-sm bg-white" />
        <span class="text-ink-400 text-sm">→</span>
        <input v-model="dateTo" type="date" class="px-3 py-2 border border-ink-300 rounded-lg text-sm bg-white" />
      </div>
      <slot name="extra" />
    </div>
  </div>
</template>
