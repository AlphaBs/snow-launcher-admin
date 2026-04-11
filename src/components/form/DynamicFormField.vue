<script setup lang="ts">
import { computed } from 'vue'
import TextField from './TextField.vue'
import NumberField from './NumberField.vue'
import CheckboxField from './CheckboxField.vue'
import SelectField from './SelectField.vue'
import ArrayField from './ArrayField.vue'

const props = defineProps<{
  label: string
  modelValue: unknown
  schema?: Record<string, unknown>
  required?: boolean
  description?: string
}>()

defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const fieldType = computed(() => {
  // Schema-based detection
  if (props.schema?.type) {
    const t = props.schema.type as string
    if (t === 'string' && Array.isArray(props.schema.enum)) return 'select'
    if (t === 'string') return 'string'
    if (t === 'number' || t === 'integer') return 'number'
    if (t === 'boolean') return 'boolean'
    if (t === 'array') return 'array'
  }

  // Value-based detection (free schema)
  const v = props.modelValue
  if (typeof v === 'boolean') return 'boolean'
  if (typeof v === 'number') return 'number'
  if (Array.isArray(v)) return 'array'
  return 'string'
})

const description = computed(() => props.description ?? props.schema?.description as string | undefined)
</script>

<template>
  <TextField
    v-if="fieldType === 'string'"
    :label="label"
    :model-value="String(modelValue ?? '')"
    :description="description"
    :required="required"
    :max-length="(schema?.maxLength as number)"
    :min-length="(schema?.minLength as number)"
    :pattern="(schema?.pattern as string)"
    @update:model-value="$emit('update:modelValue', $event)"
  />
  <NumberField
    v-else-if="fieldType === 'number'"
    :label="label"
    :model-value="modelValue as number | null"
    :description="description"
    :required="required"
    :min="(schema?.minimum as number)"
    :max="(schema?.maximum as number)"
    @update:model-value="$emit('update:modelValue', $event)"
  />
  <CheckboxField
    v-else-if="fieldType === 'boolean'"
    :label="label"
    :model-value="Boolean(modelValue)"
    :description="description"
    @update:model-value="$emit('update:modelValue', $event)"
  />
  <SelectField
    v-else-if="fieldType === 'select'"
    :label="label"
    :model-value="String(modelValue ?? '')"
    :options="(schema?.enum as string[]) ?? []"
    :description="description"
    :required="required"
    @update:model-value="$emit('update:modelValue', $event)"
  />
  <ArrayField
    v-else-if="fieldType === 'array'"
    :label="label"
    :model-value="(modelValue as unknown[]) ?? []"
    :item-schema="(schema?.items as Record<string, unknown>)"
    :description="description"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>
