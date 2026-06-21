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

// Password dialog
const password = ref('')
const passwordInput = ref('')
const showPasswordDialog = ref(false)
const passwordDialogResolve = ref<(() => void) | null>(null)

function openPasswordDialog(): Promise<void> {
  passwordInput.value = ''
  showPasswordDialog.value = true
  return new Promise((resolve) => {
    passwordDialogResolve.value = resolve
  })
}

function confirmPassword() {
  password.value = passwordInput.value
  showPasswordDialog.value = false
  passwordDialogResolve.value?.()
  passwordDialogResolve.value = null
}

async function requirePassword() {
  await openPasswordDialog()
}

onMounted(async () => {
  await openPasswordDialog()
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
      header: { 'X-Instance-Password': password.value },
    },
    body: data.value,
  })
  if (response.ok) {
    dataMessage.value = '저장되었습니다.'
  } else if (response.status === 401 || response.status === 403) {
    await requirePassword()
    dataSaving.value = false
    return saveData()
  } else {
    dataMessage.value = '저장에 실패했습니다.'
  }
  dataSaving.value = false
}
</script>

<template>
  <!-- Password Dialog -->
  <Teleport to="body">
    <div
      v-if="showPasswordDialog"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h2 class="text-lg font-semibold mb-4">인스턴스 비밀번호 입력</h2>
        <input
          v-model="passwordInput"
          type="password"
          placeholder="비밀번호"
          class="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @keyup.enter="confirmPassword"
          autofocus
        />
        <button
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          @click="confirmPassword"
        >
          확인
        </button>
      </div>
    </div>
  </Teleport>

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
          :no-structure-edit="true"
          :known-fields="knownFields"
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
            <span v-if="dataMessage" class="text-sm" :class="dataMessage === '저장되었습니다.' ? 'text-green-600' : 'text-red-600'">
              {{ dataMessage }}
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
          :password="password"
          :data="data ?? undefined"
          @auth-error="requirePassword"
        />
      </section>
    </div>
  </div>
</template>
