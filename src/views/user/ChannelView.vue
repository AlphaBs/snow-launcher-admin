<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import client from '@/api/client'

const route = useRoute()
const channelId = route.params.id as string
const channel = ref<Record<string, unknown> | null>(null)
const loading = ref(true)

onMounted(async () => {
  const { data } = await client.GET('/api/v1/channels/{channelId}', {
    params: { path: { channelId } },
  })
  if (data) channel.value = data as Record<string, unknown>
  loading.value = false
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">채널: {{ channelId }}</h1>
    <div v-if="loading" class="text-gray-500">불러오는 중...</div>
    <div v-else-if="!channel" class="text-gray-500">채널을 찾을 수 없습니다.</div>
    <div v-else class="bg-white p-6 rounded shadow">
      <pre class="text-sm overflow-auto">{{ JSON.stringify(channel, null, 2) }}</pre>
    </div>
  </div>
</template>
