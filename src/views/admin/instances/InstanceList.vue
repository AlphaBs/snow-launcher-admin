<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import adminClient from '@/api/adminClient'

const instances = ref<string[]>([])
const loading = ref(true)

onMounted(async () => {
  const { data } = await adminClient.GET('/api/v1/snowfrost/instances')
  if (data) instances.value = data
  loading.value = false
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">인스턴스</h1>
      <RouterLink
        to="/admin/instances/new"
        class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        인스턴스 생성
      </RouterLink>
    </div>
    <div v-if="loading" class="text-gray-500">불러오는 중...</div>
    <div v-else-if="instances.length === 0" class="text-gray-500">인스턴스가 없습니다.</div>
    <ul v-else class="space-y-2">
      <li v-for="id in instances" :key="id">
        <RouterLink
          :to="`/admin/instances/${id}`"
          class="block bg-white p-4 rounded shadow hover:shadow-md"
        >
          {{ id }}
        </RouterLink>
      </li>
    </ul>
  </div>
</template>
