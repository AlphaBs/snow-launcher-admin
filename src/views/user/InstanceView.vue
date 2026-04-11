<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import client from '@/api/client'

const route = useRoute()
const instanceId = route.params.id as string
const instance = ref<Record<string, unknown> | null>(null)
const loading = ref(true)

onMounted(async () => {
  const { data } = await client.GET('/api/v1/snowfrost/instances/{instanceId}', {
    params: { path: { instanceId } },
  })
  if (data) instance.value = data as Record<string, unknown>
  loading.value = false
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h1 class="text-2xl font-bold">인스턴스: {{ instanceId }}</h1>
      <RouterLink
        :to="`/instances/${instanceId}/edit`"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        데이터 편집
      </RouterLink>
    </div>
    <div v-if="loading" class="text-gray-500">불러오는 중...</div>
    <div v-else-if="!instance" class="text-gray-500">인스턴스를 찾을 수 없습니다.</div>
    <div v-else class="bg-white p-6 rounded shadow">
      <pre class="text-sm overflow-auto">{{ JSON.stringify(instance, null, 2) }}</pre>
    </div>
  </div>
</template>
