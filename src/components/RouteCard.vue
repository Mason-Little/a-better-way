<script setup lang="ts">
import { computed } from 'vue'

import type { Route } from '@/entities'

const {
  route,
  index,
  selected = false,
} = defineProps<{
  route: Route
  index: number
  selected?: boolean
}>()

const emit = defineEmits<{
  select: []
}>()

// Get summary from first section
const summary = computed(() => route.sections[0]?.summary)

// Format duration as "X min" or "X hr Y min"
const formattedDuration = computed(() => {
  const seconds = summary.value?.duration ?? 0
  const minutes = Math.round(seconds / 60)

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`
  }
  return `${minutes} min`
})

// Format distance as "X.X km" or "X.X mi"
const formattedDistance = computed(() => {
  const meters = summary.value?.length ?? 0
  const km = meters / 1000
  return `${km.toFixed(1)} km`
})

// Calculate if this route has traffic delay
const hasTrafficDelay = computed(() => {
  const baseDuration = summary.value?.baseDuration ?? 0
  const duration = summary.value?.duration ?? 0
  return duration > baseDuration * 1.1 // More than 10% delay
})

const trafficDelayMinutes = computed(() => {
  const baseDuration = summary.value?.baseDuration ?? 0
  const duration = summary.value?.duration ?? 0
  return Math.round((duration - baseDuration) / 60)
})
</script>

<template>
  <button
    @click="emit('select')"
    class="route-card flex-shrink-0 snap-center rounded-xl border-2 p-4 transition-all duration-200"
    :class="
      selected
        ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-md'
    "
    style="min-width: 160px"
  >
    <!-- Route Number Badge -->
    <div class="mb-2 flex items-center justify-between">
      <span
        class="rounded-full px-2.5 py-0.5 text-xs font-bold"
        :class="selected ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'"
      >
        Route {{ index + 1 }}
      </span>
      <span
        v-if="hasTrafficDelay && trafficDelayMinutes > 0"
        class="text-xs font-medium text-orange-500"
      >
        +{{ trafficDelayMinutes }} min
      </span>
    </div>

    <!-- Duration -->
    <div class="mb-1 text-xl font-bold" :class="selected ? 'text-blue-700' : 'text-gray-800'">
      {{ formattedDuration }}
    </div>

    <!-- Distance -->
    <div class="text-sm" :class="selected ? 'text-blue-600' : 'text-gray-500'">
      {{ formattedDistance }}
    </div>
  </button>
</template>
