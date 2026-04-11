<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import adminClient from '@/api/adminClient'

const auth = useAuthStore()
const router = useRouter()

const serverId = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  if (!serverId.value || !password.value) {
    error.value = '서버 ID와 비밀번호를 입력하세요.'
    return
  }
  loading.value = true
  error.value = ''
  auth.login(serverId.value, password.value)
  const { response } = await adminClient.GET('/servers')
  if (response.ok) {
    router.push('/admin/servers')
  } else {
    auth.logout()
    error.value = '로그인에 실패했습니다.'
  }
  loading.value = false
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100">
    <form
      class="bg-white p-8 rounded-lg shadow-md w-full max-w-sm"
      @submit.prevent="handleLogin"
    >
      <h1 class="text-2xl font-bold mb-6 text-center">관리자 로그인</h1>
      <div v-if="error" class="mb-4 text-red-600 text-sm">{{ error }}</div>
      <div class="mb-4">
        <label class="block text-sm font-medium mb-1">서버 ID</label>
        <input
          v-model="serverId"
          type="text"
          class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div class="mb-6">
        <label class="block text-sm font-medium mb-1">비밀번호</label>
        <input
          v-model="password"
          type="password"
          class="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        :disabled="loading"
      >
        {{ loading ? '로그인 중...' : '로그인' }}
      </button>
    </form>
  </div>
</template>
