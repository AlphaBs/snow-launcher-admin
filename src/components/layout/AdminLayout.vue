<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

function logout() {
  auth.logout()
}
</script>

<template>
  <div class="flex min-h-screen">
    <aside class="w-56 bg-gray-900 text-gray-200 flex flex-col sticky top-0 h-screen overflow-y-auto">
      <div class="p-4 text-lg font-bold border-b border-gray-700">
        Snow Admin
      </div>
      <nav class="flex-1 p-2 space-y-1">
        <RouterLink
          to="/admin/servers"
          class="block px-3 py-2 rounded hover:bg-gray-700"
          active-class="bg-gray-700 text-white"
        >
          서버
        </RouterLink>
        <RouterLink
          to="/admin/instances"
          class="block px-3 py-2 rounded hover:bg-gray-700"
          active-class="bg-gray-700 text-white"
        >
          인스턴스
        </RouterLink>
        <RouterLink
          to="/admin/channels"
          class="block px-3 py-2 rounded hover:bg-gray-700"
          active-class="bg-gray-700 text-white"
        >
          채널
        </RouterLink>
      </nav>
      <div class="p-2 border-t border-gray-700">
        <RouterLink
          v-if="!auth.isAuthenticated"
          to="/admin/login"
          class="block w-full px-3 py-2 text-left rounded hover:bg-gray-700 text-gray-400"
        >
          로그인
        </RouterLink>
        <button
          v-else
          class="w-full px-3 py-2 text-left rounded hover:bg-gray-700 text-gray-400"
          @click="logout"
        >
          로그아웃
        </button>
      </div>
    </aside>
    <main class="flex-1 bg-gray-50 p-6">
      <RouterView />
    </main>
  </div>
</template>
