<template>
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between h-16 items-center">
          <div class="font-bold text-xl">Sadoksan</div>
          <div>Storefront</div>
        </div>
      </div>
    </nav>
    <main class="max-w-7xl mx-auto">
      <slot />
    </main>
  </div>
</template>
