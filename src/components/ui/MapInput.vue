<script setup lang="ts">
import { useDebounceFn } from '@vueuse/core'
import MapDropdown from './MapDropdown.vue'
import type { SearchOption } from '@/types/search'

const { modelValue, label, placeholder, type, id, options } = defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  type?: string
  id?: string
  options?: SearchOption[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  select: [option: SearchOption]
}>()

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}

const debouncedUpdateValue = useDebounceFn(updateValue, 500)

const handleOptionSelect = (option: SearchOption) => {
  emit('select', option)
}
</script>

<template>
  <div class="relative flex w-full flex-col gap-1">
    <label v-if="label" :for="id" class="text-sm font-medium text-gray-700">
      {{ label }}
    </label>
    <input
      :id="id"
      :type="type || 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      class="w-full rounded-md border border-gray-300 px-3 py-2 text-base transition-colors duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
      autocomplete="off"
      @input="debouncedUpdateValue"
    />
    <MapDropdown
      v-if="options && options.length > 0"
      :options="options"
      @select="handleOptionSelect"
    />
  </div>
</template>
