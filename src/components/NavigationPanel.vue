<script setup lang="ts">
import type { NavigationState } from '@/services/NavigationSession'
import type { LocationError } from '@/services/LocationTracker'

const { isNavigating, state, error } = defineProps<{
  isNavigating: boolean
  state: NavigationState | null
  error: LocationError | null
}>()

const emit = defineEmits<{
  start: []
  stop: []
}>()

const formatSpeed = (kmh: number | null): string => {
  if (kmh === null) return '—'
  return `${Math.round(kmh)} km/h`
}
</script>

<template>
  <!-- Go button -->
  <div
    v-if="!isNavigating"
    class="absolute bottom-8 left-4 right-4 z-10 sm:left-auto sm:right-4 sm:w-64"
  >
    <button
      class="w-full rounded-xl bg-blue-500 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-blue-600 active:scale-[0.98]"
      @click="emit('start')"
    >
      Go
    </button>
  </div>

  <!-- Navigation panel -->
  <div v-else class="absolute bottom-8 left-4 right-4 z-10">
    <!-- Error -->
    <div
      v-if="error"
      class="mb-3 rounded-xl bg-red-500/90 px-4 py-3 text-sm text-white backdrop-blur"
    >
      {{ error.message }}
    </div>

    <!-- Stats -->
    <div
      class="flex items-center justify-between rounded-xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur dark:bg-gray-900/90"
    >
      <div>
        <div class="text-xs text-gray-500">Speed</div>
        <div class="text-xl font-semibold dark:text-white">
          {{ formatSpeed(state?.speedKmh ?? null) }}
        </div>
      </div>
      <div class="text-center">
        <div class="text-xs text-gray-500">Accuracy</div>
        <div class="text-lg dark:text-white">
          {{ state ? `±${Math.round(state.accuracyM)}m` : '—' }}
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs text-gray-500">Heading</div>
        <div class="text-lg dark:text-white">
          {{ state?.headingDeg !== null ? `${Math.round(state?.headingDeg ?? 0)}°` : '—' }}
        </div>
      </div>
      <button
        class="ml-4 rounded-lg bg-red-500 px-5 py-2 font-medium text-white transition-all hover:bg-red-600"
        @click="emit('stop')"
      >
        Stop
      </button>
    </div>
  </div>
</template>
