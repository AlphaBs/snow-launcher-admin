<script setup lang="ts">
defineProps<{
  label: string
  modelValue: number | null
  description?: string
  required?: boolean
  min?: number
  max?: number
}>()

defineEmits<{
  'update:modelValue': [value: number | null]
}>()

function parse(e: Event) {
  const v = (e.target as HTMLInputElement).value
  return v === '' ? null : Number(v)
}
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium mb-1">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>
    <p v-if="description" class="text-xs text-gray-500 mb-1">{{ description }}</p>
    <input
      type="number"
      :value="modelValue ?? ''"
      :required="required"
      :min="min"
      :max="max"
      class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      @input="$emit('update:modelValue', parse($event))"
    />
  </div>
</template>
