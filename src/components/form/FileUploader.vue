<script setup lang="ts">
import { ref, computed } from 'vue'
import client from '@/api/client'
import adminClient from '@/api/adminClient'

const props = defineProps<{
  instanceId: string
  fileSchema: { fields?: Record<string, { maxSizeBytes?: number }> }
  password?: string
  admin?: boolean
}>()

const apiClient = computed(() => props.admin ? adminClient : client)

const fields = computed(() => props.fileSchema.fields ?? {})

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
  // Simple MD5 using SubtleCrypto is not available (no MD5 support)
  // Use a minimal implementation via crypto
  // Actually, we'll compute it using a different approach
  // We can use the fact that we need hex MD5
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
    // 1. Presign
    const { data: presignData, response: presignRes } = await apiClient.value.POST(
      '/api/v1/snowfrost/instances/{instanceId}/files/{fieldName}/presign',
      {
        params: {
          path: { instanceId: props.instanceId, fieldName },
          header: { 'X-Instance-Password': props.password ?? '' },
        },
        body: {
          md5,
          contentType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
        },
      },
    )

    if (presignRes.status === 403) {
      setMessage(fieldName, '비밀번호가 올바르지 않습니다.', false)
      return
    }

    if (!presignRes.ok && presignRes.status !== 204) {
      setMessage(fieldName, `Presign 실패: ${presignRes.status}`, false)
      return
    }

    // 2. Upload to presigned URL (skip if 204 = already exists)
    if (presignRes.status === 200 && presignData) {
      const presign = presignData as Record<string, unknown>
      const uploadUrl = presign.url as string
      const uploadMethod = (presign.method as string) || 'PUT'
      const uploadHeaders: Record<string, string> = {}
      if (presign.headers && typeof presign.headers === 'object') {
        for (const [k, v] of Object.entries(presign.headers as Record<string, string>)) {
          uploadHeaders[k] = v
        }
      }

      const uploadRes = await fetch(uploadUrl, {
        method: uploadMethod,
        headers: uploadHeaders,
        body: buffer,
      })

      if (!uploadRes.ok) {
        setMessage(fieldName, `업로드 실패: ${uploadRes.status}`, false)
        return
      }
    }

    // 3. Commit
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

async function handleDelete(fieldName: string) {
  if (!confirm(`"${fieldName}" 파일을 삭제하시겠습니까?`)) return
  if (!props.admin && !props.password) {
    setMessage(fieldName, '인스턴스 비밀번호를 먼저 입력해주세요.', false)
    return
  }

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

    if (response.ok) {
      setMessage(fieldName, '파일이 삭제되었습니다.', true)
    } else if (response.status === 403) {
      setMessage(fieldName, '비밀번호가 올바르지 않습니다.', false)
    } else {
      setMessage(fieldName, `삭제 실패: ${response.status}`, false)
    }
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
      <div class="flex items-center justify-between">
        <div>
          <span class="text-sm font-medium">{{ name }}</span>
          <span v-if="field.maxSizeBytes" class="text-xs text-gray-400 ml-2">
            최대 {{ formatBytes(field.maxSizeBytes) }}
          </span>
        </div>
        <button
          type="button"
          class="text-xs text-red-500 hover:text-red-700"
          :disabled="uploading[String(name)]"
          @click="handleDelete(String(name))"
        >
          파일 삭제
        </button>
      </div>
      <div class="flex items-center gap-2">
        <input
          type="file"
          class="text-sm"
          :disabled="uploading[String(name)]"
          @change="handleFileSelect(String(name), $event)"
        />
        <span v-if="uploading[String(name)]" class="text-xs text-gray-500">업로드 중...</span>
      </div>
      <p
        v-if="messages[String(name)]"
        class="text-xs"
        :class="messages[String(name)]!.ok ? 'text-green-600' : 'text-red-600'"
      >
        {{ messages[String(name)]!.text }}
      </p>
    </div>
  </div>
</template>
