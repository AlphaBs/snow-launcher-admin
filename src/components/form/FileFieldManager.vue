<script setup lang="ts">
import { ref, computed } from 'vue'
import client from '@/api/client'
import adminClient from '@/api/adminClient'

const props = defineProps<{
  modelValue: { fields?: Record<string, { maxSizeBytes?: number }> }
  instanceId: string
  password?: string
  admin?: boolean
  data?: Record<string, unknown>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: { fields?: Record<string, { maxSizeBytes?: number }> }]
  'auth-error': []
}>()

const apiClient = computed(() => props.admin ? adminClient : client)

const fields = computed(() => props.modelValue.fields ?? {})

// Schema mutations
function updateMaxSize(name: string, maxSizeBytes: number | null) {
  const updated = { ...fields.value, [name]: { maxSizeBytes: maxSizeBytes ?? undefined } }
  emit('update:modelValue', { ...props.modelValue, fields: updated })
}

function removeField(name: string) {
  if (!confirm(`"${name}" 파일 필드를 삭제하시겠습니까?`)) return
  const copy = { ...fields.value }
  delete copy[name]
  emit('update:modelValue', { ...props.modelValue, fields: copy })
}

const newFieldName = ref('')
function addField() {
  const name = newFieldName.value.trim()
  if (!name || name in fields.value) return
  emit('update:modelValue', { ...props.modelValue, fields: { ...fields.value, [name]: { maxSizeBytes: 0 } } })
  newFieldName.value = ''
}

// Upload state
const uploading = ref<Record<string, boolean>>({})
const messages = ref<Record<string, { text: string; ok: boolean }>>({})

function setMessage(field: string, text: string, ok: boolean) {
  messages.value = { ...messages.value, [field]: { text, ok } }
}
function clearMessage(field: string) {
  const copy = { ...messages.value }
  delete copy[field]
  messages.value = copy
}

function formatBytes(bytes: number | undefined): string {
  if (!bytes) return ''
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${bytes} B`
}

async function computeMD5(buffer: ArrayBuffer): Promise<string> {
  const { default: SparkMD5 } = await import('spark-md5')
  const spark = new SparkMD5.ArrayBuffer()
  spark.append(buffer)
  return spark.end()
}

async function handleFileSelect(fieldName: string, event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const maxSize = fields.value[fieldName]?.maxSizeBytes
  if (maxSize && file.size > maxSize) {
    setMessage(fieldName, `파일 크기가 제한(${formatBytes(maxSize)})을 초과합니다.`, false)
    input.value = ''
    return
  }
  if (!props.admin && !props.password) {
    setMessage(fieldName, '인스턴스 비밀번호를 먼저 입력해주세요.', false)
    input.value = ''
    return
  }

  uploading.value = { ...uploading.value, [fieldName]: true }
  clearMessage(fieldName)

  try {
    const buffer = await file.arrayBuffer()
    const md5 = await computeMD5(buffer)
    const { data: presignData, response: presignRes } = await apiClient.value.POST(
      '/api/v1/snowfrost/instances/{instanceId}/files/{fieldName}/presign',
      {
        params: {
          path: { instanceId: props.instanceId, fieldName },
          header: { 'X-Instance-Password': props.password ?? '' },
        },
        body: { md5, contentType: file.type || 'application/octet-stream', sizeBytes: file.size },
      },
    )

    if (presignRes.status === 403) { emit('auth-error'); return }
    if (!presignRes.ok && presignRes.status !== 204) { setMessage(fieldName, `Presign 실패: ${presignRes.status}`, false); return }

    if (presignRes.status === 200 && presignData) {
      const presign = presignData as Record<string, unknown>
      const uploadHeaders: Record<string, string> = {}
      if (presign.headers && typeof presign.headers === 'object') {
        for (const [k, v] of Object.entries(presign.headers as Record<string, string>)) uploadHeaders[k] = v
      }
      const uploadRes = await fetch(presign.url as string, {
        method: (presign.method as string) || 'PUT',
        headers: uploadHeaders,
        body: buffer,
      })
      if (!uploadRes.ok) { setMessage(fieldName, `업로드 실패: ${uploadRes.status}`, false); return }
    }

    const { data: commitData, response: commitRes } = await apiClient.value.POST(
      '/api/v1/snowfrost/instances/{instanceId}/files/{fieldName}/commit',
      {
        params: {
          path: { instanceId: props.instanceId, fieldName },
          header: { 'X-Instance-Password': props.password ?? '' },
        },
        body: { md5 },
      },
    )

    if (commitRes.ok) {
      const url = (commitData as Record<string, unknown>)?.url as string | undefined
      setMessage(fieldName, url ? `업로드 완료: ${url}` : '업로드 완료', true)
    } else {
      setMessage(fieldName, `커밋 실패: ${commitRes.status}`, false)
    }
  } catch (e) {
    setMessage(fieldName, `오류: ${e}`, false)
  } finally {
    uploading.value = { ...uploading.value, [fieldName]: false }
    input.value = ''
  }
}

async function handleDeleteFile(fieldName: string) {
  if (!confirm(`"${fieldName}" 파일을 삭제하시겠습니까?`)) return
  if (!props.admin && !props.password) { setMessage(fieldName, '인스턴스 비밀번호를 먼저 입력해주세요.', false); return }

  uploading.value = { ...uploading.value, [fieldName]: true }
  clearMessage(fieldName)

  try {
    const { response } = await apiClient.value.DELETE(
      '/api/v1/snowfrost/instances/{instanceId}/files/{fieldName}',
      {
        params: {
          path: { instanceId: props.instanceId, fieldName },
          header: { 'X-Instance-Password': props.password ?? '' },
        },
      },
    )
    if (response.ok) setMessage(fieldName, '파일이 삭제되었습니다.', true)
    else if (response.status === 403) { emit('auth-error'); return }
    else setMessage(fieldName, `삭제 실패: ${response.status}`, false)
  } finally {
    uploading.value = { ...uploading.value, [fieldName]: false }
  }
}
</script>

<template>
  <div class="space-y-3">
    <div v-if="Object.keys(fields).length === 0" class="text-sm text-gray-500">
      등록된 파일 필드가 없습니다.
    </div>

    <div
      v-for="(field, name) in fields"
      :key="name"
      class="bg-gray-50 rounded px-4 py-3 space-y-2"
    >
      <!-- Header: name + admin controls + remove -->
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium">{{ name }}</span>
        <span v-if="field.maxSizeBytes" class="text-xs text-gray-400">
          최대 {{ formatBytes(field.maxSizeBytes) }}
        </span>
        <div v-if="admin" class="flex items-center gap-2 ml-auto">
          <label class="text-xs text-gray-500">최대 크기 (바이트)</label>
          <input
            type="number"
            :value="field.maxSizeBytes ?? 0"
            min="0"
            class="w-28 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            @input="updateMaxSize(String(name), Number(($event.target as HTMLInputElement).value) || null)"
          />
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
      </div>

      <!-- Preview -->
      <div v-if="data?.[String(name)]" class="space-y-1">
        <img
          :src="String(data[String(name)])"
          :alt="String(name)"
          class="max-h-40 rounded border"
        />
        <a
          :href="String(data[String(name)])"
          target="_blank"
          class="text-xs text-blue-500 hover:underline break-all"
        >{{ data[String(name)] }}</a>
      </div>
      <div v-else class="text-xs text-gray-400">파일 없음</div>

      <!-- Upload + delete file -->
      <div class="flex items-center gap-3">
        <input
          type="file"
          class="text-sm"
          :disabled="uploading[String(name)]"
          @change="handleFileSelect(String(name), $event)"
        />
        <button
          type="button"
          class="text-xs text-red-500 hover:text-red-700 whitespace-nowrap"
          :disabled="uploading[String(name)]"
          @click="handleDeleteFile(String(name))"
        >
          파일 삭제
        </button>
        <span v-if="uploading[String(name)]" class="text-xs text-gray-500">업로드 중...</span>
      </div>

      <!-- Message -->
      <p
        v-if="messages[String(name)]"
        class="text-xs"
        :class="messages[String(name)]!.ok ? 'text-green-600' : 'text-red-600'"
      >
        {{ messages[String(name)]!.text }}
      </p>
    </div>

    <!-- Add field (admin only) -->
    <div v-if="admin" class="flex gap-2 items-end pt-2 border-t">
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

    <p v-if="!admin && !password" class="text-xs text-gray-500">
      파일 업로드/삭제를 위해 인스턴스 비밀번호를 입력해주세요.
    </p>
  </div>
</template>
