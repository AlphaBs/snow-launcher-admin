<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen">
    <nav class="bg-gray-800 text-white p-4">
      <div class="max-w-7xl mx-auto flex gap-4">
        <RouterLink to="/" class="hover:text-gray-300">Home</RouterLink>
        <RouterLink to="/about" class="hover:text-gray-300">About</RouterLink>
      </div>
    </nav>

    <main class="max-w-7xl mx-auto p-4">
      <RouterView />
    </main>
  </div>
</template>
