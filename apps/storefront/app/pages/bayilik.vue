<script setup lang="ts">
// Bayi başvuruları kapatıldı — tüm bayiler admin tarafından manuel oluşturuluyor.
definePageMeta({
  title: 'Bayi Programı | SADÖKSAN İnşaat',
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-ink-50">
    <div class="text-center max-w-md mx-auto p-8">
      <Icon name="lucide:building-2" class="w-16 h-16 mx-auto text-ink-300 mb-4" />
      <h1 class="text-xl font-bold text-ink-900 mb-2">Bayi Başvuruları</h1>
      <p class="text-ink-500">
        Bayi kayıtları şu anda sadece yetkili satış temsilcilerimiz tarafından oluşturulmaktadır.
        Bayi olmak için lütfen bizimle iletişime geçin.
      </p>
    </div>
  </div>
</template>
