<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <main class="p-6">
      <div class="w-full max-w-6xl mx-auto">
        <RouterView />
      </div>
    </main>
  </div>
</template>
