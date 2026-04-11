<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: unknown
}>()

const emit = defineEmits<{
  'update:modelValue': [value: unknown]
}>()

const text = ref(JSON.stringify(props.modelValue, null, 2))
const parseError = ref('')

watch(() => props.modelValue, (v) => {
  const newText = JSON.stringify(v, null, 2)
  if (newText !== text.value) {
    text.value = newText
    parseError.value = ''
  }
})

function handleInput(e: Event) {
  const raw = (e.target as HTMLTextAreaElement).value
  text.value = raw
  try {
    const parsed = JSON.parse(raw)
    parseError.value = ''
    emit('update:modelValue', parsed)
  } catch {
    parseError.value = '올바르지 않은 JSON 형식입니다'
  }
}
</script>

<template>
  <div>
    <textarea
      :value="text"
      class="w-full h-64 border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      :class="{ 'border-red-500': parseError }"
      @input="handleInput"
    />
    <p v-if="parseError" class="text-xs text-red-500 mt-1">{{ parseError }}</p>
  </div>
</template>
