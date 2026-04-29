<script setup lang="ts">
const props = defineProps<{ error: { statusCode: number; message: string } }>()
const handleHome = () => clearError({ redirect: '/' })
</script>

<template>
  <div class="min-h-screen grid place-items-center bg-ink-50 px-6">
    <div class="text-center max-w-md">
      <p class="font-display text-7xl font-extrabold text-primary-900">{{ props.error.statusCode }}</p>
      <h1 class="mt-4 heading-md">Aradığınız sayfa bulunamadı</h1>
      <p class="mt-3 text-ink-600">
        Bu sayfa demo aşamasında henüz yayında değil. Anasayfaya dönerek devam edebilirsiniz.
      </p>
      <button class="btn-primary mt-8" @click="handleHome">
        Anasayfaya Dön
      </button>
    </div>
  </div>
</template>
