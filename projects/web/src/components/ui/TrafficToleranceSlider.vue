<script setup lang="ts">
import { computed } from 'vue'

const model = defineModel<number>({ required: true })

const {
  min = 1,
  max = 10,
  step = 1,
} = defineProps<{
  min?: number
  max?: number
  step?: number
}>()

// Computed description for jam threshold
const description = computed(() => {
  const level = model.value
  if (level <= 2) return 'Aggressive: Avoid even slight slowdowns'
  if (level <= 4) return 'Sensitive: Avoid light traffic (jam 3+)'
  if (level <= 6) return 'Balanced: Avoid moderate congestion (jam 5+)'
  if (level <= 8) return 'Relaxed: Avoid heavy traffic only (jam 7+)'
  return 'Minimal: Only avoid near-standstill (jam 9+)'
})
</script>

<template>
  <div
    class="rounded-2xl border border-white/40 bg-white/40 p-5 backdrop-blur-lg transition-all hover:bg-white/50"
  >
    <div class="flex items-center justify-between mb-3">
      <h3 class="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
        Traffic Tolerance
      </h3>
      <div
        class="flex items-center gap-1.5 rounded-full bg-white/50 px-2 py-0.5 ring-1 ring-black/5"
      >
        <span class="text-xs font-bold text-blue-600">{{ model }}</span>
        <span class="text-[10px] font-medium text-gray-400">/ {{ max }}</span>
      </div>
    </div>
    <input
      v-model.number="model"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      class="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-gray-200/50 accent-blue-600 hover:accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
    />
    <p class="mt-2 text-xs text-gray-500 italic">
      {{ description }}
    </p>
  </div>
</template>
