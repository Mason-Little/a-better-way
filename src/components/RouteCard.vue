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

// Check if this is an "optimized" route (iteration > 0)
const isOptimized = computed(() => (route.iteration ?? 0) > 0)

// Format duration as "X min" or "X hr Y min"
const formattedDuration = computed(() => {
  const seconds = summary.value?.duration ?? 0
  const minutes = Math.round(seconds / 60)

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }
  return `${minutes} min`
})

// Format distance
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

// Evaluation badge visibility
const hasTrafficIntersections = computed(
  () => (route.evaluation?.intersectingTrafficSegments ?? 0) > 0,
)
const hasStopSignIntersections = computed(
  () => (route.evaluation?.intersectingStopSignBoxes ?? 0) > 0,
)
</script>

<template>
  <button
    @click="emit('select')"
    class="group relative flex min-w-[180px] flex-col justify-between overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 sm:min-w-[200px]"
    :class="[
      selected
        ? 'border-blue-500/50 bg-blue-50/80 shadow-[0_8px_24px_-4px_rgba(59,130,246,0.25)] ring-1 ring-blue-500/20 backdrop-blur-xl'
        : 'border-white/40 bg-white/40 shadow-sm hover:border-white/60 hover:bg-white/60 hover:shadow-lg hover:shadow-black/5 backdrop-blur-lg',
    ]"
  >
    <!-- Background Gradient for Selected -->
    <div
      v-if="selected"
      class="absolute inset-0 -z-10 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-100 transition-opacity duration-500"
    />

    <!-- Header -->
    <div class="mb-3 flex w-full items-start justify-between">
      <div class="flex flex-col gap-1">
        <span
          class="text-[10px] font-bold tracking-wider uppercase"
          :class="selected ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'"
        >
          Route {{ index + 1 }}
        </span>

        <!-- Iteration Indicator -->
        <div v-if="isOptimized" class="flex items-center gap-1.5">
          <div class="relative h-1.5 w-1.5">
            <span
              class="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"
            ></span>
            <span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
          </div>
          <span
            class="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-[10px] font-bold text-transparent"
          >
            Iter {{ route.iteration }}
          </span>
        </div>
      </div>

      <!-- Traffic Badge -->
      <div
        v-if="hasTrafficDelay"
        class="flex items-center gap-1 rounded-full bg-orange-500/10 px-2 py-0.5"
      >
        <span class="block h-1 w-1 rounded-full bg-orange-500" />
        <span class="text-[10px] font-bold text-orange-600">+{{ trafficDelayMinutes }}m</span>
      </div>
    </div>

    <!-- Evaluation Badges -->
    <div
      v-if="hasTrafficIntersections || hasStopSignIntersections"
      class="mb-2 flex flex-wrap gap-1.5"
    >
      <!-- Traffic Segments Badge -->
      <div
        v-if="hasTrafficIntersections"
        class="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5"
        :title="`Passes through ${route.evaluation?.intersectingTrafficSegments} traffic segment(s)`"
      >
        <span class="text-[10px]">🚦</span>
        <span class="text-[10px] font-bold text-red-600">{{
          route.evaluation?.intersectingTrafficSegments
        }}</span>
      </div>

      <!-- Stop Signs Badge -->
      <div
        v-if="hasStopSignIntersections"
        class="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5"
        :title="`Passes through ${route.evaluation?.intersectingStopSignBoxes} stop sign zone(s)`"
      >
        <span class="text-[10px]">🛑</span>
        <span class="text-[10px] font-bold text-amber-600">{{
          route.evaluation?.intersectingStopSignBoxes
        }}</span>
      </div>
    </div>

    <!-- Main Stats -->
    <div class="space-y-0.5">
      <div
        class="text-2xl font-black tracking-tight transition-colors"
        :class="selected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'"
      >
        {{ formattedDuration }}
      </div>
      <div class="flex items-center gap-2 text-xs font-medium text-gray-500">
        <span>{{ formattedDistance }}</span>
        <span class="h-1 w-1 rounded-full bg-gray-300"></span>
        <span>Fastest</span>
      </div>
    </div>
  </button>
</template>
