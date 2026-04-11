<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import adminClient from '@/api/adminClient'

const channels = ref<string[]>([])
const loading = ref(true)

onMounted(async () => {
  const { data } = await adminClient.GET('/api/v1/channels')
  if (data) channels.value = data
  loading.value = false
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">채널</h1>
      <RouterLink
        to="/admin/channels/new"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        채널 생성
      </RouterLink>
    </div>
    <div v-if="loading" class="text-gray-500">불러오는 중...</div>
    <div v-else-if="channels.length === 0" class="text-gray-500">채널이 없습니다.</div>
    <ul v-else class="space-y-2">
      <li v-for="id in channels" :key="id">
        <RouterLink
          :to="`/admin/channels/${id}`"
          class="block bg-white p-4 rounded shadow hover:shadow-md"
        >
          {{ id }}
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
