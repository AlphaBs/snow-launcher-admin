<script setup lang="ts">
import { computed, ref } from 'vue'
import type { KnownFieldMap } from '@/knownFields'

const props = defineProps<{
  modelValue: Record<string, unknown>
  knownFields?: KnownFieldMap
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Record<string, unknown>]
}>()

const properties = computed(() => {
  return (props.modelValue.properties ?? {}) as Record<string, Record<string, unknown>>
})

const sortedKeys = computed(() => {
  const keys = Object.keys(properties.value)
  if (!props.knownFields) return keys
  const kf = props.knownFields
  const known = keys.filter((k) => k in kf).sort((a, b) => (kf[b]?.index ?? 0) - (kf[a]?.index ?? 0))
  const unknown = keys.filter((k) => !(k in kf))
  return [...known, ...unknown]
})

function fieldLabel(key: string): string {
  const kf = props.knownFields?.[key]
  return kf ? `${kf.displayName} (${key})` : key
}

function fieldDescription(key: string): string | undefined {
  return props.knownFields?.[key]?.description
}

function typeLabel(schema: Record<string, unknown>): string {
  const t = schema.type
  if (Array.isArray(t)) return t.join(' | ')
  if (t === 'array') {
    const items = schema.items as Record<string, unknown> | undefined
    return items?.type ? `array<${items.type}>` : 'array'
  }
  return String(t ?? 'unknown')
}

function updateProperties(newProps: Record<string, Record<string, unknown>>) {
  emit('update:modelValue', { ...props.modelValue, properties: newProps })
}

function removeField(key: string) {
  if (!confirm(`"${key}" 필드를 삭제하시겠습니까?`)) return
  const copy = { ...properties.value }
  delete copy[key]
  updateProperties(copy)
}

const newFieldName = ref('')
const newFieldType = ref('string')

const typeOptions = [
  { value: 'string', label: '문자열' },
  { value: '["string","null"]', label: '문자열 (nullable)' },
  { value: 'integer', label: '정수' },
  { value: 'number', label: '숫자' },
  { value: 'boolean', label: '불리언' },
  { value: 'array_string', label: '문자열 배열' },
]

function addField() {
  const name = newFieldName.value.trim()
  if (!name || name in properties.value) return

  let schema: Record<string, unknown>
  const t = newFieldType.value
  if (t === '["string","null"]') {
    schema = { type: ['string', 'null'] }
  } else if (t === 'array_string') {
    schema = { type: 'array', items: { type: 'string' } }
  } else {
    schema = { type: t }
  }

  updateProperties({ ...properties.value, [name]: schema })
  newFieldName.value = ''
}
</script>

<template>
  <div class="space-y-2">
    <div
      v-for="key in sortedKeys"
      :key="key"
      class="flex items-center gap-3 bg-gray-50 rounded px-4 py-3"
    >
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium">{{ fieldLabel(key) }}</div>
        <p v-if="fieldDescription(key)" class="text-xs text-gray-500">{{ fieldDescription(key) }}</p>
      </div>
      <span class="text-xs text-gray-400 font-mono">{{ properties[key] ? typeLabel(properties[key]) : '' }}</span>
      <button
        type="button"
        class="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="필드 삭제"
        @click="removeField(key)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div v-if="sortedKeys.length === 0" class="text-sm text-gray-500">
      등록된 스키마 필드가 없습니다.
    </div>

    <div class="flex gap-2 items-end pt-2 border-t">
      <div class="flex-1">
        <label class="block text-xs text-gray-500 mb-1">새 필드 이름</label>
        <input
          v-model="newFieldName"
          type="text"
          class="w-full border rounded px-3 py-1.5 text-sm"
          placeholder="필드 이름"
          @keyup.enter="addField"
        />
      </div>
      <div>
        <label class="block text-xs text-gray-500 mb-1">타입</label>
        <select v-model="newFieldType" class="border rounded px-2 py-1.5 text-sm">
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
</template>
