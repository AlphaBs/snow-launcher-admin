<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const serverId = ref('')

function go() {
  const id = serverId.value.trim()
  if (id) {
    router.push(`/admin/servers/${id}`)
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-screen">
    <form @submit.prevent="go" class="w-full max-w-md space-y-4">
      <h1 class="text-2xl font-bold text-center">서버 조회</h1>
      <div class="flex gap-2">
        <input
          v-model="serverId"
          type="text"
          placeholder="서버 ID 입력"
          class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          :disabled="!serverId.trim()"
        >
          이동
        </button>
      </div>
    </form>
  </div>
</template>
