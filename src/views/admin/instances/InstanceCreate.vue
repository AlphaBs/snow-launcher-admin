<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import adminClient from '@/api/adminClient'

const router = useRouter()
const id = ref('')
const plainPassword = ref('')
const error = ref('')

async function handleCreate() {
  error.value = ''
  const { response } = await adminClient.POST('/api/v1/snowfrost/instances', {
    body: {
      id: id.value,
      plainPassword: plainPassword.value,
      schema: {},
      data: {},
    },
  })
  if (response.ok) {
    router.push('/admin/instances')
  } else if (response.status === 409) {
    error.value = '이미 존재하는 인스턴스 ID입니다.'
  } else {
    error.value = '인스턴스 생성에 실패했습니다.'
  }
}
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">인스턴스 생성</h1>
    <form class="bg-white p-6 rounded shadow max-w-md" @submit.prevent="handleCreate">
      <div v-if="error" class="mb-4 text-red-600 text-sm">{{ error }}</div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">인스턴스 ID</label>
        <input
          v-model="id"
          type="text"
          required
          class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="mb-6">
        <label class="block text-sm font-medium mb-1">비밀번호</label>
        <input
          v-model="plainPassword"
          type="password"
          required
          class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="flex gap-2">
        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          생성
        </button>
        <button
          type="button"
          class="px-4 py-2 rounded border hover:bg-gray-50"
          @click="router.push('/admin/instances')"
        >
          취소
        </button>
      </div>
    </form>
  </div>
</template>
