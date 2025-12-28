<script setup lang="ts">
const { disabled = false, variant = 'default' } = defineProps<{
  disabled?: boolean
  variant?: 'default' | 'primary'
}>()
</script>

<template>
  <button
    :disabled="disabled"
    class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border-none transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
    :class="{
      'bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-95': variant === 'default',
      'bg-blue-500 text-white hover:bg-blue-600 active:scale-95': variant === 'primary',
    }"
  >
    <slot />
  </button>
</template>
