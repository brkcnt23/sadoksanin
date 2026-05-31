<script setup lang="ts">
import { formatNumber, formatRelative } from '~/utils/storage'

const props = defineProps<{
  productId: string
  productName: string
  productSku: string
  currentStock: number
  unit: string
}>()

const emit = defineEmits<{ close: [] }>()

const stock = useStockStore()
const movements = ref<any[]>([])
const loading = ref(false)
const typeFilter = ref('')
const total = ref(0)

const typeLabels: Record<string, string> = {
  MANUAL_ENTRY: 'Manuel Giriş',
  MANUAL_EXIT: 'Manuel Çıkış',
  ORDER_RESERVE: 'Sipariş Rezerve',
  ORDER_FULFILL: 'Sipariş Sevk',
  ORDER_CANCEL: 'Sipariş İptal',
  RETURN_RESTOCK: 'İade Stok',
  COUNT_ADJUST: 'Sayım Dz.',
  DAMAGE_LOSS: 'Fire/Hasar',
}

const typeBadge = (t: string) => {
  const m: Record<string, { variant: 'success' | 'warning' | 'error' | 'info' | 'neutral' }> = {
    MANUAL_ENTRY: { variant: 'success' },
    MANUAL_EXIT: { variant: 'error' },
    ORDER_RESERVE: { variant: 'info' },
    ORDER_FULFILL: { variant: 'neutral' },
    ORDER_CANCEL: { variant: 'warning' },
    RETURN_RESTOCK: { variant: 'success' },
    COUNT_ADJUST: { variant: 'info' },
    DAMAGE_LOSS: { variant: 'error' },
  }
  return m[t] ?? { variant: 'neutral' }
}

const load = async () => {
  loading.value = true
  try {
    const result = await stock.fetchMovements(props.productId, {
      type: typeFilter.value || undefined,
      limit: 100,
    })
    movements.value = result.movements
    total.value = result.total
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(typeFilter, load)
</script>

<template>
  <div class="fixed inset-0 z-50 flex justify-end">
    <div class="absolute inset-0 bg-black/30" @click="emit('close')" />
    <div class="relative w-full max-w-xl bg-white shadow-xl flex flex-col h-full">
      <div class="flex items-center justify-between px-5 py-4 border-b border-ink-200 shrink-0">
        <div class="min-w-0">
          <h3 class="font-semibold text-ink-900 truncate">{{ productName }}</h3>
          <p class="text-xs text-ink-500 font-mono">
            {{ productSku }} · Mevcut: {{ formatNumber(currentStock) }} {{ unit }}
          </p>
        </div>
        <button @click="emit('close')" class="p-1.5 hover:bg-ink-100 rounded-md shrink-0">
          <Icon name="lucide:x" class="w-5 h-5 text-ink-500" />
        </button>
      </div>

      <div class="px-5 py-3 border-b border-ink-100 shrink-0">
        <select v-model="typeFilter" class="px-2.5 py-1.5 border border-ink-300 rounded-md text-sm bg-white w-full">
          <option value="">Tüm İşlemler</option>
          <option v-for="(label, key) in typeLabels" :key="key" :value="key">{{ label }}</option>
        </select>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div v-if="loading" class="p-8 text-center text-ink-500">Yükleniyor...</div>
        <table v-else-if="movements.length > 0" class="w-full">
          <thead class="bg-ink-50 border-b border-ink-200 text-left sticky top-0">
            <tr>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Tarih</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">İşlem</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Miktar</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Eski→Yeni</th>
              <th class="px-5 py-3 text-xs font-semibold text-ink-700 uppercase">Kullanıcı</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-100">
            <tr v-for="m in movements" :key="m.id" class="hover:bg-ink-50">
              <td class="px-5 py-3 text-xs text-ink-500">{{ formatRelative(m.createdAt) }}</td>
              <td class="px-5 py-3">
                <span :class="['inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                  typeBadge(m.type).variant === 'success' ? 'bg-green-100 text-green-700' :
                  typeBadge(m.type).variant === 'error' ? 'bg-red-100 text-red-700' :
                  typeBadge(m.type).variant === 'warning' ? 'bg-orange-100 text-orange-700' :
                  typeBadge(m.type).variant === 'info' ? 'bg-blue-100 text-blue-700' :
                  'bg-ink-100 text-ink-700']">
                  {{ typeLabels[m.type] ?? m.type }}
                </span>
              </td>
              <td class="px-5 py-3 text-sm font-semibold" :class="m.quantity > 0 ? 'text-green-600' : 'text-red-600'">
                {{ m.quantity > 0 ? '+' : '' }}{{ formatNumber(m.quantity) }}
              </td>
              <td class="px-5 py-3 text-sm text-ink-700 font-mono">
                {{ formatNumber(m.oldStock) }}→{{ formatNumber(m.newStock) }}
              </td>
              <td class="px-5 py-3 text-xs text-ink-500">
                {{ m.user?.email ?? 'Sistem' }}
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="p-8 text-center text-ink-400 text-sm">Hareket bulunamadı</div>
      </div>
    </div>
  </div>
</template>
