<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'

const model = defineModel<string | number>({ default: '' })

const {
  placeholder = '',
  label,
  debounce = 300,
} = defineProps<{
  label?: string
  placeholder?: string
  debounce?: number
}>()

const emit = defineEmits<{
  search: [query: string]
}>()

// Only emit search on actual user input, debounced
const debouncedSearch = useDebounceFn((value: string) => {
  emit('search', value)
}, debounce)

const handleInput = (event: Event) => {
  const value = (event.target as HTMLInputElement).value
  model.value = value
  debouncedSearch(value)
}
</script>

<template>
  <div class="w-full">
    <label
      v-if="label"
      class="mb-1.5 block text-xs font-semibold tracking-wide text-gray-500 uppercase"
    >
      {{ label }}
    </label>
    <input
      :value="model"
      @input="handleInput"
      :placeholder="placeholder"
      class="w-full rounded-xl border border-gray-200/50 bg-white/50 px-4 py-3 text-gray-900 shadow-sm backdrop-blur-md transition-all duration-300 placeholder:text-gray-400 hover:bg-white/80 hover:shadow-md focus:border-blue-500/50 focus:bg-white/90 focus:ring-4 focus:ring-blue-500/10 active:scale-[0.99]"
    />
  </div>
</template>
