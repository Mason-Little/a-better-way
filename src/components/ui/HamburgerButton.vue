<script setup lang="ts">
defineProps<{
  label?: string
}>()

const emit = defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    @click="emit('click')"
    class="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg transition-all hover:shadow-xl active:scale-95"
    :aria-label="label ?? 'Open menu'"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class="h-6 w-6 text-gray-700"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="2"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>
</template>
