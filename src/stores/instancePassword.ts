import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useInstancePasswordStore = defineStore('instancePassword', () => {
  const passwords = ref<Record<string, string>>({})

  function set(instanceId: string, password: string) {
    passwords.value[instanceId] = password
  }

  function get(instanceId: string): string | undefined {
    return passwords.value[instanceId]
  }

  function clear(instanceId: string) {
    delete passwords.value[instanceId]
  }

  return { passwords, set, get, clear }
})
