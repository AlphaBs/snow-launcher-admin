<script setup lang="ts">
import { useCounterStore } from '@/stores/counter'

const counter = useCounterStore()
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold mb-4">Home</h1>
    <p class="mb-2">Count: {{ counter.count }}</p>
    <button
      class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      @click="counter.increment"
    >
      Increment
    </button>
  </div>
</template>
