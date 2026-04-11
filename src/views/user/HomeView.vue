<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const instanceId = ref('')

function go() {
  const id = instanceId.value.trim()
  if (id) {
    router.push(`/instances/${id}`)
  }
}
</script>

<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <form @submit.prevent="go" class="w-full max-w-md space-y-4">
      <h1 class="text-2xl font-bold text-center">인스턴스 조회</h1>
      <div class="flex gap-2">
        <input
          v-model="instanceId"
          type="text"
          placeholder="인스턴스 ID 입력"
          class="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          :disabled="!instanceId.trim()"
        >
          이동
        </button>
      </div>
    </form>
  </div>
</template>
