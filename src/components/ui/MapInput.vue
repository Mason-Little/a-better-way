<script setup lang="ts">
const { modelValue, label, placeholder, type, id } = defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  type?: string
  id?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const updateValue = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="flex w-full flex-col gap-1">
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
      @input="updateValue"
    />
  </div>
</template>
