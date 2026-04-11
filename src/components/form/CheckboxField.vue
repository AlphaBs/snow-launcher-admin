<script setup lang="ts">
defineProps<{
  label: string
  modelValue: boolean
  description?: string
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<template>
  <div>
    <label class="flex items-center gap-2">
      <input
        type="checkbox"
        :checked="modelValue"
        class="rounded"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
      />
      <span class="text-sm font-medium">{{ label }}</span>
    </label>
    <p v-if="description" class="text-xs text-gray-500 ml-6">{{ description }}</p>
  </div>
</template>
