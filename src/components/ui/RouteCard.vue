<script setup lang="ts">
import type { Route } from '@tomtom-org/maps-sdk/core'
import { computed } from 'vue'

const {
  route,
  active = false,
  index,
} = defineProps<{
  route: Route
  active?: boolean
  index: number
}>()

const emit = defineEmits<{
  select: []
}>()

const travelTime = computed(() => {
  const seconds = route.properties.summary.travelTimeInSeconds
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.round((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes} min`
})

const distance = computed(() => {
  const meters = route.properties.summary.lengthInMeters
  const km = meters / 1000
  if (km >= 100) {
    return `${Math.round(km)} km`
  }
  return `${km.toFixed(1)} km`
})

const trafficDelay = computed(() => {
  const seconds = route.properties.summary.trafficDelayInSeconds
  if (seconds === 0) return null
  const minutes = Math.round(seconds / 60)
  return `+${minutes} min`
})

const trafficSeverity = computed(() => {
  const seconds = route.properties.summary.trafficDelayInSeconds
  if (seconds === 0) return 'none'
  if (seconds < 300) return 'low' // < 5 min
  if (seconds < 900) return 'medium' // < 15 min
  return 'high'
})
</script>

<template>
  <button
    @click="emit('select')"
    class="group relative flex min-w-[140px] cursor-pointer flex-col gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200"
    :class="{
      'border-blue-500 bg-blue-50 shadow-md shadow-blue-200': active,
      'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm': !active,
    }"
  >
    <!-- Route number badge -->
    <div
      class="absolute -top-2 -left-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold"
      :class="{
        'bg-blue-500 text-white': active,
        'bg-gray-200 text-gray-600': !active,
      }"
    >
      {{ index + 1 }}
    </div>

    <!-- Travel time -->
    <div class="text-lg font-semibold text-gray-900">{{ travelTime }}</div>

    <!-- Distance -->
    <div class="text-sm text-gray-500">{{ distance }}</div>

    <!-- Traffic delay indicator -->
    <div
      v-if="trafficDelay"
      class="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      :class="{
        'bg-green-100 text-green-700': trafficSeverity === 'low',
        'bg-yellow-100 text-yellow-700': trafficSeverity === 'medium',
        'bg-red-100 text-red-700': trafficSeverity === 'high',
      }"
    >
      <span
        class="h-1.5 w-1.5 rounded-full"
        :class="{
          'bg-green-500': trafficSeverity === 'low',
          'bg-yellow-500': trafficSeverity === 'medium',
          'bg-red-500': trafficSeverity === 'high',
        }"
      />
      {{ trafficDelay }}
    </div>

    <!-- No traffic badge -->
    <div
      v-else
      class="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"
    >
      <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" />
      No delays
    </div>
  </button>
</template>
