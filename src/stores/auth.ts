import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', () => {
  const credentials = ref<string | null>(localStorage.getItem('admin_credentials'))

  const isAuthenticated = computed(() => credentials.value !== null)

  function login(serverId: string, password: string) {
    const encoded = btoa(new TextEncoder().encode(`${serverId}:${password}`).reduce((s, b) => s + String.fromCharCode(b), ''))
    credentials.value = encoded
    localStorage.setItem('admin_credentials', encoded)
  }

  function logout() {
    credentials.value = null
    localStorage.removeItem('admin_credentials')
  }

  return { credentials, isAuthenticated, login, logout }
})
