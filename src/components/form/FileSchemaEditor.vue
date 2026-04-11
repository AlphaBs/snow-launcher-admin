<script setup lang="ts">
import { computed, ref } from 'vue'

const props = defineProps<{
  modelValue: { fields?: Record<string, { maxSizeBytes?: number }> }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { fields?: Record<string, { maxSizeBytes?: number }> }]
}>()

const fields = computed(() => props.modelValue.fields ?? {})

function updateField(name: string, maxSizeBytes: number | null) {
  const updated = { ...fields.value, [name]: { maxSizeBytes: maxSizeBytes ?? undefined } }
  emit('update:modelValue', { ...props.modelValue, fields: updated })
}

function removeField(name: string) {
  if (!confirm(`"${name}" 필드를 삭제하시겠습니까?`)) return
  const copy = { ...fields.value }
  delete copy[name]
  emit('update:modelValue', { ...props.modelValue, fields: copy })
}

const newFieldName = ref('')

function addField() {
  const name = newFieldName.value.trim()
  if (!name || name in fields.value) return
  const updated = { ...fields.value, [name]: { maxSizeBytes: 0 } }
  emit('update:modelValue', { ...props.modelValue, fields: updated })
  newFieldName.value = ''
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return '제한 없음'
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(field, name) in fields"
      :key="name"
      class="flex items-center gap-3 bg-gray-50 rounded px-4 py-3"
    >
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium">{{ name }}</div>
      </div>
      <div class="flex items-center gap-2">
        <label class="text-xs text-gray-500 whitespace-nowrap">최대 크기 (바이트)</label>
        <input
          type="number"
          :value="field.maxSizeBytes ?? 0"
          min="0"
          class="w-32 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="updateField(String(name), Number(($event.target as HTMLInputElement).value) || null)"
        />
        <span class="text-xs text-gray-400 w-20">{{ formatBytes(field.maxSizeBytes) }}</span>
      </div>
      <button
        type="button"
        class="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        title="필드 삭제"
        @click="removeField(String(name))"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div v-if="Object.keys(fields).length === 0" class="text-sm text-gray-500">
      등록된 파일 필드가 없습니다.
    </div>

    <div class="flex gap-2 items-end pt-2 border-t">
      <div class="flex-1">
        <label class="block text-xs text-gray-500 mb-1">새 파일 필드 이름</label>
        <input
          v-model="newFieldName"
          type="text"
          class="w-full border rounded px-3 py-1.5 text-sm"
          placeholder="필드 이름"
          @keyup.enter="addField"
        />
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
