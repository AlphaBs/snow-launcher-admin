<script setup lang="ts">
import { ref, computed } from 'vue'
import DynamicFormField from './DynamicFormField.vue'
import JsonEditor from './JsonEditor.vue'
import type { KnownFieldMap } from '@/knownFields'

const props = defineProps<{
  modelValue: Record<string, unknown>
  schema?: Record<string, unknown>
  noStructureEdit?: boolean
  knownFields?: KnownFieldMap
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
  'update:schema': [value: Record<string, unknown>]
}>()

const jsonMode = ref(false)

const properties = computed(() => {
  return props.schema?.properties as Record<string, Record<string, unknown>> | undefined
})

const requiredFields = computed(() => {
  const req = props.schema?.required
  return Array.isArray(req) ? (req as string[]) : []
})

function sortByKnownFields(keys: string[]): string[] {
  if (!props.knownFields) return keys
  const kf = props.knownFields
  const known = keys.filter((k) => k in kf).sort((a, b) => (kf[b]?.index ?? 0) - (kf[a]?.index ?? 0))
  const unknown = keys.filter((k) => !(k in kf))
  return [...known, ...unknown]
}

const allSortedKeys = computed(() => {
  const keys = properties.value
    ? Object.keys(properties.value)
    : Object.keys(props.modelValue)
  return sortByKnownFields(keys)
})

function fieldLabel(key: string): string {
  const kf = props.knownFields?.[key]
  if (kf) return `${kf.displayName} (${key})`
  const title = properties.value?.[key]?.title as string | undefined
  return title || key
}

function fieldDescription(key: string): string | undefined {
  return props.knownFields?.[key]?.description ?? (properties.value?.[key]?.description as string | undefined)
}

function fieldTypeLabel(key: string): string | undefined {
  const prop = properties.value?.[key]
  if (!prop) return undefined
  const t = prop.type
  if (Array.isArray(t)) return t.join(' | ')
  if (t === 'array') {
    const items = prop.items as Record<string, unknown> | undefined
    return items?.type ? `array<${items.type}>` : 'array'
  }
  return String(t ?? '')
}

function updateField(key: string, value: unknown) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

// Add / remove fields
const newKey = ref('')
const newType = ref('string')

const typeOptions = properties.value
  ? [
      { value: 'string', label: '문자열' },
      { value: '["string","null"]', label: '문자열 (nullable)' },
      { value: 'integer', label: '정수' },
      { value: 'number', label: '숫자' },
      { value: 'boolean', label: '불리언' },
      { value: 'array_string', label: '문자열 배열' },
    ]
  : [
      { value: 'string', label: '문자열' },
      { value: 'number', label: '숫자' },
      { value: 'boolean', label: '불리언' },
      { value: 'array', label: '배열' },
    ]

function typeToSchema(t: string): Record<string, unknown> {
  if (t === '["string","null"]') return { type: ['string', 'null'] }
  if (t === 'array_string') return { type: 'array', items: { type: 'string' } }
  return { type: t }
}

function typeToDefault(t: string): unknown {
  if (t === 'string' || t === '["string","null"]') return ''
  if (t === 'number' || t === 'integer') return 0
  if (t === 'boolean') return false
  if (t === 'array' || t === 'array_string') return []
  return ''
}

function addField() {
  const name = newKey.value.trim()
  if (!name || name in props.modelValue) return

  emit('update:modelValue', {
    ...props.modelValue,
    [name]: typeToDefault(newType.value),
  })

  if (properties.value) {
    const newProps = { ...properties.value, [name]: typeToSchema(newType.value) }
    emit('update:schema', { ...props.schema, properties: newProps })
  }

  newKey.value = ''
}

function removeField(key: string) {
  if (!confirm(`"${key}" 필드를 삭제하시겠습니까?`)) return
  const dataCopy = { ...props.modelValue }
  delete dataCopy[key]
  emit('update:modelValue', dataCopy)

  if (properties.value) {
    const propsCopy = { ...properties.value }
    delete propsCopy[key]
    emit('update:schema', { ...props.schema, properties: propsCopy })
  }
}

const isFreeSchema = computed(() => !properties.value)
</script>

<template>
  <div>
    <div class="flex items-center justify-end mb-3">
      <button
        type="button"
        class="text-sm text-gray-500 hover:text-gray-700"
        @click="jsonMode = !jsonMode"
      >
        {{ jsonMode ? '폼 모드' : 'JSON 모드' }}
      </button>
    </div>

    <JsonEditor
      v-if="jsonMode"
      :model-value="modelValue"
      @update:model-value="$emit('update:modelValue', $event as Record<string, unknown>)"
    />

    <div v-else class="space-y-4">
      <div v-for="key in allSortedKeys" :key="key">
        <div class="flex items-center gap-1 mb-0.5">
          <span class="text-sm font-medium">{{ fieldLabel(key) }}</span>
          <span v-if="fieldTypeLabel(key)" class="text-xs text-gray-400 font-mono">{{ fieldTypeLabel(key) }}</span>
          <button
            v-if="!noStructureEdit"
            type="button"
            class="p-0.5 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="필드 삭제"
            @click="removeField(key)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <p v-if="fieldDescription(key)" class="text-xs text-gray-500 mb-1">{{ fieldDescription(key) }}</p>
        <DynamicFormField
          label=""
          :model-value="modelValue[key]"
          :schema="properties?.[key]"
          :required="requiredFields.includes(key)"
          @update:model-value="updateField(key, $event)"
        />
      </div>

      <!-- Add field -->
      <div v-if="!noStructureEdit" class="flex gap-2 items-end pt-2 border-t">
        <div class="flex-1">
          <label class="block text-xs text-gray-500 mb-1">새 필드 이름</label>
          <input
            v-model="newKey"
            type="text"
            class="w-full border rounded px-3 py-1.5 text-sm"
            placeholder="키"
            @keyup.enter="addField"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 mb-1">타입</label>
          <select v-model="newType" class="border rounded px-2 py-1.5 text-sm">
            <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </div>
        <button
          type="button"
          class="bg-gray-200 px-3 py-1.5 rounded text-sm hover:bg-gray-300"
          @click="addField"
        >
          추가
        </button>
      </div>
    </div>
  </div>
</template>
