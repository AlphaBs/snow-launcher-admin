<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import adminClient from '@/api/adminClient'
import client from '@/api/client'
import DynamicForm from '@/components/form/DynamicForm.vue'
import { knownFields } from '@/knownFields'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const id = route.params.id as string

const server = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const saving = ref(false)
const message = ref('')
const serverPassword = ref('')

onMounted(async () => {
  const { data } = await client.GET('/servers/{id}', { params: { path: { id } } })
  if (data) server.value = data as Record<string, unknown>
  loading.value = false
})

async function handleSave() {
  if (!server.value) return
  if (!serverPassword.value) {
    message.value = '서버 비밀번호를 입력해주세요.'
    return
  }
  saving.value = true
  message.value = ''
  const { response } = await client.PUT('/servers/{id}', {
    params: { path: { id } },
    body: { ...server.value, plainPassword: serverPassword.value },
  })
  if (response.ok) {
    message.value = '저장되었습니다.'
  } else if (response.status === 403) {
    message.value = '비밀번호가 올바르지 않습니다.'
  } else {
    message.value = '저장에 실패했습니다.'
  }
  saving.value = false
}

async function handleDelete() {
  if (!confirm(`서버 "${id}"을(를) 삭제하시겠습니까?`)) return
  await adminClient.DELETE('/servers/{id}', { params: { path: { id } } })
  router.push('/admin/servers')
}

</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">서버: {{ id }}</h1>
      <button
        v-if="auth.isAuthenticated"
        class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        @click="handleDelete"
      >
        삭제
      </button>
    </div>

    <div v-if="loading" class="text-gray-500">불러오는 중...</div>
    <div v-else-if="!server" class="text-gray-500">서버를 찾을 수 없습니다.</div>
    <div v-else class="space-y-6">
      <!-- Data (free schema) -->
      <section class="bg-white p-6 rounded shadow">
        <h2 class="text-lg font-semibold mb-3">데이터</h2>
        <DynamicForm v-model="server" :no-structure-edit="true" :known-fields="knownFields" />
        <div class="mt-4 space-y-3">
          <div class="max-w-sm">
            <label class="block text-sm font-medium mb-1">서버 비밀번호</label>
            <input
              v-model="serverPassword"
              type="password"
              class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-center gap-4">
            <button
              class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              :disabled="saving"
              @click="handleSave"
            >
              {{ saving ? '저장 중...' : '저장' }}
            </button>
            <span v-if="message" class="text-sm" :class="message === '저장되었습니다.' ? 'text-green-600' : 'text-red-600'">
              {{ message }}
            </span>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>
