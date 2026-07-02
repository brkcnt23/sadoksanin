<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  modelValue?: string[] // Array of image URLs (data: or http)
  label?: string
  multiple?: boolean
}

interface Emits {
  (e: 'update:modelValue', urls: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Resimler',
  multiple: true,
})

const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const isLoading = ref(false)
const errors = ref<string[]>([])

const imageUrls = computed(() => props.modelValue || [])

// File validation
const validateFile = (file: File): string | null => {
  const maxSize = 20 * 1024 * 1024 // 20MB (backend limitiyle eşit)
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

  if (!allowedTypes.includes(file.type)) {
    return 'Sadece JPG, PNG, WebP ve AVIF formatları destekleniyor'
  }

  if (file.size > maxSize) {
    return 'Dosya boyutu 20MB\'dan küçük olmalı'
  }

  return null
}

// Read file as data URL
const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Could not read file'))
      }
    }
    reader.onerror = () => reject(new Error('File read error'))
    reader.readAsDataURL(file)
  })
}

// Process files
const processFiles = async (files: FileList | null) => {
  if (!files || files.length === 0) return

  errors.value = []
  isLoading.value = true

  try {
    const newUrls: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files.item(i)
      if (!file) continue
      const error = validateFile(file)

      if (error) {
        errors.value.push(`${file.name}: ${error}`)
        continue
      }

      try {
        const dataUrl = await readFileAsDataUrl(file)
        newUrls.push(dataUrl)
      } catch (e) {
        errors.value.push(`${file.name}: Dosya okunamadı`)
      }
    }

    // Update model
    const allUrls = props.multiple ? [...(imageUrls.value || []), ...newUrls] : newUrls
    emit('update:modelValue', allUrls)

    // Clear input
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } finally {
    isLoading.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  processFiles(target.files)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = true
}

const handleDragLeave = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  event.stopPropagation()
  isDragging.value = false

  processFiles(event.dataTransfer?.files || null)
}

const removeImage = (index: number) => {
  const updated = (imageUrls.value || []).filter((_: string, i: number) => i !== index)
  emit('update:modelValue', updated)
}

const setPrimary = (index: number) => {
  const urls = [...(imageUrls.value || [])]
  const removed = urls.splice(index, 1)[0]
  if (removed) {
    emit('update:modelValue', [removed, ...urls])
  }
}

const openBrowse = () => {
  fileInput.value?.click()
}
</script>

<template>
  <div class="space-y-4">
    <label class="block text-sm font-medium text-ink-700">{{ label }}</label>

    <!-- Drag-drop zone -->
    <div
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
      :class="[
        'relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
        isDragging ? 'border-primary-500 bg-primary-50' : 'border-ink-300 bg-ink-50 hover:border-ink-400',
      ]"
    >
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        :multiple="multiple"
        class="hidden"
        @change="handleFileSelect"
      />

      <div @click="openBrowse" class="cursor-pointer">
        <Icon name="lucide:upload-cloud" class="w-8 h-8 text-ink-400 mx-auto mb-2" />
        <p class="text-sm font-medium text-ink-900">Görselleri buraya sürükle veya tıkla</p>
        <p class="text-xs text-ink-500 mt-1">JPG, PNG, WebP — en fazla 5MB</p>
      </div>
    </div>

    <!-- Error messages -->
    <div v-if="errors.length > 0" class="space-y-1">
      <p v-for="(error, i) in errors" :key="i" class="text-xs text-red-600">⚠️ {{ error }}</p>
    </div>

    <!-- Image previews -->
    <div v-if="imageUrls.length > 0" class="space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-xs font-medium text-ink-700">{{ imageUrls.length }} Görsel</p>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <div v-for="(url, i) in imageUrls" :key="i" class="relative group">
          <div class="relative w-full aspect-square rounded-lg overflow-hidden border border-ink-200 bg-ink-100">
            <img :src="url" :alt="`Image ${i + 1}`" class="w-full h-full object-cover" />

            <!-- Primary badge -->
            <div
              v-if="i === 0"
              class="absolute top-1 left-1 px-2 py-1 bg-primary-600 text-white text-xs font-semibold rounded"
            >
              Ana
            </div>

            <!-- Hover overlay -->
            <div class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
              <button
                v-if="i > 0"
                @click="setPrimary(i)"
                class="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700"
                title="Ana görsel yap"
              >
                <Icon name="lucide:star" class="w-4 h-4" />
              </button>
              <button
                @click="removeImage(i)"
                class="p-2 bg-red-600 text-white rounded-full hover:bg-red-700"
                title="Sil"
              >
                <Icon name="lucide:trash-2" class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex items-center gap-2 text-sm text-ink-600">
      <div class="w-4 h-4 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
      Görsel yükleniyor...
    </div>
  </div>
</template>
