<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import client from '@/api/client'
import { useInstancePasswordStore } from '@/stores/instancePassword'
import DynamicForm from '@/components/form/DynamicForm.vue'
import { knownFields } from '@/knownFields'

const route = useRoute()
const instanceId = route.params.id as string
const passwordStore = useInstancePasswordStore()

const schema = ref<Record<string, unknown> | null>(null)
const data = ref<Record<string, unknown> | null>(null)
const password = ref(passwordStore.get(instanceId) ?? '')
const loading = ref(true)
const saving = ref(false)
const message = ref('')

onMounted(async () => {
  const [schemaRes, dataRes] = await Promise.all([
    client.GET('/api/v1/snowfrost/instances/{instanceId}/schema', {
      params: { path: { instanceId } },
    }),
    client.GET('/api/v1/snowfrost/instances/{instanceId}/data', {
      params: { path: { instanceId } },
    }),
  ])
  if (schemaRes.data) schema.value = schemaRes.data as Record<string, unknown>
  if (dataRes.data) data.value = dataRes.data as Record<string, unknown>
  loading.value = false
})

async function handleSave() {
  if (!password.value) {
    message.value = '비밀번호를 입력해주세요.'
    return
  }
  saving.value = true
  message.value = ''
  passwordStore.set(instanceId, password.value)

  const { response } = await client.PUT('/api/v1/snowfrost/instances/{instanceId}', {
    params: {
      path: { instanceId },
      header: { 'X-Instance-Password': password.value },
    },
    body: data.value,
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
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">인스턴스 편집: {{ instanceId }}</h1>

    <div v-if="loading" class="text-gray-500">불러오는 중...</div>
    <div v-else class="space-y-4">
      <div class="bg-white p-6 rounded shadow">
        <label class="block text-sm font-medium mb-1">인스턴스 비밀번호</label>
        <input
          v-model="password"
          type="password"
          class="border rounded px-3 py-2 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div class="bg-white p-6 rounded shadow">
        <h2 class="text-lg font-semibold mb-3">데이터</h2>
        <DynamicForm
          v-if="data !== null"
          v-model="data"
          :schema="schema ?? undefined"
          :known-fields="knownFields"
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
  </div>
</template>
