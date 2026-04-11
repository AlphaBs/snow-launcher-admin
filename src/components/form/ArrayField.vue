<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  modelValue: unknown[]
  itemSchema?: Record<string, unknown>
  description?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown[]]
}>()

const text = computed({
  get() {
    return props.modelValue.map(String).join('\n')
  },
  set(value: string) {
    const items = value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line !== '')
    emit('update:modelValue', items)
  },
})
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium mb-1">{{ label }}</label>
    <p v-if="description" class="text-xs text-gray-500 mb-2">{{ description }}</p>
    <textarea
      v-model="text"
      rows="8"
      class="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
      placeholder="한 줄에 하나씩 입력"
    />
  </div>
</template>
