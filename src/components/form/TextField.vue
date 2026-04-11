<script setup lang="ts">
defineProps<{
  label: string
  modelValue: string
  description?: string
  required?: boolean
  maxLength?: number
  minLength?: number
  pattern?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <p v-if="description" class="text-xs text-gray-500 mb-1">{{ description }}</p>
    <input
      type="text"
      :value="modelValue"
      :required="required"
      :maxlength="maxLength"
      :minlength="minLength"
      :pattern="pattern"
      class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </div>
</template>
