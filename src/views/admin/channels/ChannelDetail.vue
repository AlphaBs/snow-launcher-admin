<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import adminClient from '@/api/adminClient'
import client from '@/api/client'

const route = useRoute()
const router = useRouter()
const channelId = route.params.id as string

const channel = ref<Record<string, unknown> | null>(null)
const users = ref<string[]>([])
const loading = ref(true)

const newInstanceId = ref('')
const newUserId = ref('')

onMounted(async () => {
  const [channelRes, usersRes] = await Promise.all([
    client.GET('/api/v1/channels/{channelId}', { params: { path: { channelId } } }),
    adminClient.GET('/api/v1/channels/{channelId}/users', { params: { path: { channelId } } }),
  ])
  if (channelRes.data) channel.value = channelRes.data as Record<string, unknown>
  if (usersRes.data) users.value = usersRes.data
  loading.value = false
})

async function handleDelete() {
  if (!confirm(`채널 "${channelId}"을(를) 삭제하시겠습니까?`)) return
  await adminClient.DELETE('/api/v1/channels/{channelId}', { params: { path: { channelId } } })
  router.push('/admin/channels')
}

async function addInstance() {
  if (!newInstanceId.value) return
  await adminClient.POST('/api/v1/channels/{channelId}/instances', {
    params: { path: { channelId } },
    body: { instanceId: newInstanceId.value },
  })
  newInstanceId.value = ''
  location.reload()
}

async function removeInstance(instanceId: string) {
  await adminClient.DELETE('/api/v1/channels/{channelId}/instances/{instanceId}', {
    params: { path: { channelId, instanceId } },
  })
  location.reload()
}

async function addUser() {
  if (!newUserId.value) return
  await adminClient.POST('/api/v1/channels/{channelId}/users', {
    params: { path: { channelId } },
    body: { userId: newUserId.value },
  })
  newUserId.value = ''
  const { data } = await adminClient.GET('/api/v1/channels/{channelId}/users', {
    params: { path: { channelId } },
  })
  if (data) users.value = data
}

async function removeUser(userId: string) {
  await adminClient.DELETE('/api/v1/channels/{channelId}/users/{userId}', {
    params: { path: { channelId, userId } },
  })
  users.value = users.value.filter((u) => u !== userId)
}

const visibilitySaving = ref(false)

async function toggleVisibility() {
  if (!channel.value) return
  const newIsPublic = !channel.value.isPublic
  visibilitySaving.value = true
  const { response } = await adminClient.PUT('/api/v1/channels/{channelId}', {
    params: { path: { channelId } },
    body: { isPublic: newIsPublic },
  })
  if (response.ok) {
    channel.value = { ...channel.value, isPublic: newIsPublic }
  }
  visibilitySaving.value = false
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">채널: {{ channelId }}</h1>
      <button
        class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        @click="handleDelete"
      >
        삭제
      </button>
    </div>

    <div v-if="loading" class="text-gray-500">불러오는 중...</div>
    <div v-else-if="!channel" class="text-gray-500">채널을 찾을 수 없습니다.</div>
    <div v-else class="space-y-6">
      <!-- Channel Info -->
      <section class="bg-white p-6 rounded shadow">
        <h2 class="text-lg font-semibold mb-3">정보</h2>
        <div class="flex items-center gap-3 mb-3">
          <span class="text-sm font-medium">공개 상태:</span>
          <span
            class="px-2 py-0.5 rounded text-xs font-semibold"
            :class="channel.isPublic ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'"
          >
            {{ channel.isPublic ? 'Public' : 'Private' }}
          </span>
          <button
            class="text-sm px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
            :disabled="visibilitySaving"
            @click="toggleVisibility"
          >
            {{ channel.isPublic ? 'Private으로 변경' : 'Public으로 변경' }}
          </button>
        </div>
        <div class="text-sm text-gray-500 space-y-1">
          <p>생성: {{ channel.createdAt }}</p>
          <p>수정: {{ channel.updatedAt }}</p>
        </div>
      </section>

      <!-- Instances -->
      <section class="bg-white p-6 rounded shadow">
        <h2 class="text-lg font-semibold mb-3">인스턴스</h2>
        <ul class="space-y-1 mb-3">
          <li
            v-for="inst in (channel.instances as any[] || [])"
            :key="inst.id"
            class="flex items-center justify-between py-1"
          >
            <span>{{ inst.id }}</span>
            <button class="text-red-500 text-sm hover:underline" @click="removeInstance(inst.id)">
              제거
            </button>
          </li>
        </ul>
        <div class="flex gap-2">
          <input
            v-model="newInstanceId"
            placeholder="인스턴스 ID"
            class="border rounded px-3 py-1 flex-1"
          />
          <button class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" @click="addInstance">
            추가
          </button>
        </div>
      </section>

      <!-- Users -->
      <section class="bg-white p-6 rounded shadow">
        <h2 class="text-lg font-semibold mb-3">허용된 사용자</h2>
        <ul class="space-y-1 mb-3">
          <li v-for="u in users" :key="u" class="flex items-center justify-between py-1">
            <span>{{ u }}</span>
            <button class="text-red-500 text-sm hover:underline" @click="removeUser(u)">
              제거
            </button>
          </li>
        </ul>
        <div class="flex gap-2">
          <input
            v-model="newUserId"
            placeholder="사용자 ID"
            class="border rounded px-3 py-1 flex-1"
          />
          <button class="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700" @click="addUser">
            추가
          </button>
        </div>
      </section>
    </div>
  </div>
</template>
