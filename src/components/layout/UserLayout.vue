<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen">
    <nav class="bg-white border-b px-6 py-3 flex items-center gap-6">
      <span class="font-bold text-lg">Snow Launcher</span>
      <RouterLink to="/" class="text-gray-600 hover:text-gray-900">홈</RouterLink>
    </nav>
    <main class="max-w-4xl mx-auto p-6">
      <RouterView />
    </main>
  </div>
</template>
