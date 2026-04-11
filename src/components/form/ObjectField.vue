<script setup lang="ts">
import DynamicFormField from './DynamicFormField.vue'

const props = defineProps<{
  label: string
  modelValue: Record<string, unknown>
  schema?: Record<string, unknown>
  description?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

function updateField(key: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function getPropertySchema(key: string): Record<string, unknown> | undefined {
  const properties = props.schema?.properties as Record<string, Record<string, unknown>> | undefined
  return properties?.[key]
}

function getRequiredFields(): string[] {
  const req = props.schema?.required
  return Array.isArray(req) ? req : []
}
</script>

<template>
  <div>
    <label v-if="label" class="block text-sm font-medium mb-1">{{ label }}</label>
    <p v-if="description" class="text-xs text-gray-500 mb-2">{{ description }}</p>
    <div class="space-y-3 pl-4 border-l-2 border-gray-200">
      <DynamicFormField
        v-for="(value, key) in modelValue"
        :key="key"
        :label="(getPropertySchema(String(key))?.title as string) || String(key)"
        :model-value="value"
        :schema="getPropertySchema(String(key))"
        :required="getRequiredFields().includes(String(key))"
        @update:model-value="updateField(String(key), $event)"
      />
    </div>
  </div>
</template>
