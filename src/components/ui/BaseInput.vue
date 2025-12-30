<script setup lang="ts">
const model = defineModel<string>({ default: '' })

const { placeholder = '', label } = defineProps<{
  label?: string
  placeholder?: string
}>()
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
      v-model="model"
      :placeholder="placeholder"
      class="w-full px-4 py-3 text-gray-800 bg-white/80 backdrop-blur-sm border border-gray-300/60 rounded-xl shadow-sm outline-none transition-all duration-200 placeholder:text-gray-400 hover:border-gray-400 hover:bg-white/95 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/15"
    />
  </div>
</template>
