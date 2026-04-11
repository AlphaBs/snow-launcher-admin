<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import adminClient from '@/api/adminClient'
import client from '@/api/client'
import DynamicForm from '@/components/form/DynamicForm.vue'
import FileFieldManager from '@/components/form/FileFieldManager.vue'
import { knownFields } from '@/knownFields'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const instanceId = route.params.id as string

const instance = ref<Record<string, unknown> | null>(null)
const schema = ref<Record<string, unknown> | null>(null)
const data = ref<Record<string, unknown> | null>(null)
const fileSchema = ref<Record<string, unknown> | null>(null)
const loading = ref(true)

onMounted(async () => {
  const [instRes, schemaRes, dataRes, fsRes] = await Promise.all([
    client.GET('/api/v1/snowfrost/instances/{instanceId}', { params: { path: { instanceId } } }),
    client.GET('/api/v1/snowfrost/instances/{instanceId}/schema', { params: { path: { instanceId } } }),
    client.GET('/api/v1/snowfrost/instances/{instanceId}/data', { params: { path: { instanceId } } }),
    client.GET('/api/v1/snowfrost/instances/{instanceId}/fileSchema', { params: { path: { instanceId } } }),
  ])
  if (instRes.data) instance.value = instRes.data as Record<string, unknown>
  if (schemaRes.data) schema.value = schemaRes.data as Record<string, unknown>
  if (dataRes.data) data.value = dataRes.data as Record<string, unknown>
  fileSchema.value = (fsRes.data ?? { fields: {} }) as Record<string, unknown>
  loading.value = false
})

async function handleDelete() {
  if (!confirm(`인스턴스 "${instanceId}"을(를) 삭제하시겠습니까?`)) return
  await adminClient.DELETE('/api/v1/snowfrost/instances/{instanceId}', {
    params: { path: { instanceId } },
  })
  router.push('/admin/instances')
}

// Schema update
const schemaSaving = ref(false)
const schemaMessage = ref('')

async function saveSchema() {
  if (!schema.value || !data.value) return
  schemaSaving.value = true
  schemaMessage.value = ''
  const { response } = await adminClient.PUT('/api/v1/snowfrost/instances/{instanceId}/schema', {
    params: { path: { instanceId } },
    body: { schema: schema.value, data: data.value },
  })
  schemaMessage.value = response.ok ? '스키마가 저장되었습니다.' : '스키마 저장에 실패했습니다.'
  schemaSaving.value = false
}

// Data update
const dataSaving = ref(false)
const dataMessage = ref('')

async function saveData() {
  if (!data.value) return
  dataSaving.value = true
  dataMessage.value = ''
  const { response } = await adminClient.PUT('/api/v1/snowfrost/instances/{instanceId}', {
    params: {
      path: { instanceId },
      header: { 'X-Instance-Password': '' },
    },
    body: data.value,
  })
  if (response.ok) {
    dataMessage.value = '저장되었습니다.'
  } else {
    dataMessage.value = '저장에 실패했습니다.'
  }
  dataSaving.value = false
}

// FileSchema update
const fsSaving = ref(false)
const fsMessage = ref('')

async function saveFileSchema() {
  if (!fileSchema.value) return
  fsSaving.value = true
  fsMessage.value = ''
  const { response } = await adminClient.PUT('/api/v1/snowfrost/instances/{instanceId}/fileSchema', {
    params: { path: { instanceId } },
    body: fileSchema.value as { fields?: Record<string, { maxSizeBytes?: number }> },
  })
  fsMessage.value = response.ok ? '파일 스키마가 저장되었습니다.' : '실패했습니다.'
  fsSaving.value = false
}

// Password change
const newPassword = ref('')
const pwMessage = ref('')

async function changePassword() {
  if (!newPassword.value) return
  pwMessage.value = ''
  const { response } = await adminClient.POST('/api/v1/snowfrost/instances/{instanceId}/changePassword', {
    params: { path: { instanceId } },
    body: { plainPassword: newPassword.value },
  })
  pwMessage.value = response.ok ? '비밀번호가 변경되었습니다.' : '실패했습니다.'
  newPassword.value = ''
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">인스턴스: {{ instanceId }}</h1>
      <button
        v-if="auth.isAuthenticated"
        class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        @click="handleDelete"
      >
        삭제
      </button>
    </div>

    <div v-if="loading" class="text-gray-500">불러오는 중...</div>

    <div v-else class="space-y-6">
      <!-- Data -->
      <section class="bg-white p-6 rounded shadow">
        <h2 class="text-lg font-semibold mb-3">데이터</h2>
        <DynamicForm
          v-if="data !== null"
          v-model="data"
          :schema="schema ?? undefined"
          :no-structure-edit="!auth.isAuthenticated"
          :known-fields="knownFields"
          @update:schema="schema = $event"
        />
        <div class="mt-4">
          <div class="flex items-center gap-4 flex-wrap">
            <button
              class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              :disabled="dataSaving"
              @click="saveData"
            >
              {{ dataSaving ? '저장 중...' : '데이터 저장' }}
            </button>
            <button
              v-if="auth.isAuthenticated"
              class="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50"
              :disabled="schemaSaving"
              @click="saveSchema"
            >
              {{ schemaSaving ? '저장 중...' : '스키마 + 데이터 저장' }}
            </button>
            <span v-if="dataMessage" class="text-sm" :class="dataMessage === '저장되었습니다.' ? 'text-green-600' : 'text-red-600'">
              {{ dataMessage }}
            </span>
            <span v-if="schemaMessage" class="text-sm" :class="schemaMessage.includes('저장') ? 'text-green-600' : 'text-red-600'">
              {{ schemaMessage }}
            </span>
          </div>
        </div>
      </section>

      <!-- Files -->
      <section v-if="fileSchema !== null" class="bg-white p-6 rounded shadow">
        <h2 class="text-lg font-semibold mb-3">파일</h2>
        <FileFieldManager
          :model-value="fileSchema as { fields?: Record<string, { maxSizeBytes?: number }> }"
          :instance-id="instanceId"
          :admin="auth.isAuthenticated"
          :data="data ?? undefined"
          @update:model-value="fileSchema = $event as Record<string, unknown>"
        />
        <div v-if="auth.isAuthenticated" class="flex items-center gap-4 mt-3">
          <button
            class="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900 disabled:opacity-50"
            :disabled="fsSaving"
            @click="saveFileSchema"
          >
            {{ fsSaving ? '저장 중...' : '파일 스키마 저장' }}
          </button>
          <span v-if="fsMessage" class="text-sm" :class="fsMessage.includes('저장') ? 'text-green-600' : 'text-red-600'">
            {{ fsMessage }}
          </span>
        </div>
      </section>

      <!-- Change Password (admin only) -->
      <section v-if="auth.isAuthenticated" class="bg-white p-6 rounded shadow">
        <h2 class="text-lg font-semibold mb-3">비밀번호 변경</h2>
        <div class="flex gap-2 items-end">
          <input
            v-model="newPassword"
            type="password"
            placeholder="새 비밀번호"
            class="border rounded px-3 py-2 max-w-sm"
          />
          <button
            class="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-900"
            @click="changePassword"
          >
            변경
          </button>
        </div>
        <p v-if="pwMessage" class="text-sm mt-2" :class="pwMessage.includes('변경') ? 'text-green-600' : 'text-red-600'">
          {{ pwMessage }}
        </p>
      </section>
    </div>
  </div>
</template>
