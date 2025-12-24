<script setup lang="ts">
const { variant = 'primary', disabled = false } = defineProps<{
  label?: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}>()
</script>

<template>
  <button
    :disabled="disabled"
    class="inline-flex cursor-pointer items-center justify-center rounded-md border-none px-4 py-2 font-medium font-sans transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60"
    :class="{
      'bg-blue-500 text-white hover:bg-blue-600 disabled:hover:bg-blue-500': variant === 'primary',
      'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:hover:bg-gray-200':
        variant === 'secondary',
      'bg-red-500 text-white hover:bg-red-600 disabled:hover:bg-red-500': variant === 'danger',
    }"
  >
    <slot>{{ label }}</slot>
  </button>
</template>
