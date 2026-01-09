<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

import { useMapStore } from '@/stores/mapStore'
import { useRoutesStore } from '@/stores/routesStore'
import { searchPlaces, type SearchResult } from '@/lib/here-sdk/search'
import { getBetterWayRoutes } from '@/utils/routing'
import RouteCarousel from '@/components/RouteCarousel.vue'
import BetterButton from '@/components/ui/BetterButton.vue'
import BetterDropdown from '@/components/ui/BetterDropdown.vue'
import BetterInput from '@/components/ui/BetterInput.vue'

const { isLoadingRoutes, trafficEnabled, toggleTraffic } = useMapStore()
const { routes, clearRoutes } = useRoutesStore()

const startLocation = reactive({
  address: '',
  coordinates: {
    lat: 0,
    lng: 0,
  },
})
const endLocation = reactive({
  address: '',
  coordinates: {
    lat: 0,
    lng: 0,
  },
})
const startSuggestions = ref<SearchResult[]>([])
const endSuggestions = ref<SearchResult[]>([])
const RouteEtaMargin = ref<number>(10)

// Traffic Avoidance Settings - jamThreshold uses HERE's jam factor (0-10 scale)
const jamThreshold = ref<number>(5)

// Computed description for jam threshold
const jamThresholdDescription = computed(() => {
  const level = jamThreshold.value
  if (level <= 2) return 'Aggressive: Avoid even slight slowdowns'
  if (level <= 4) return 'Sensitive: Avoid light traffic (jam 3+)'
  if (level <= 6) return 'Balanced: Avoid moderate congestion (jam 5+)'
  if (level <= 8) return 'Relaxed: Avoid heavy traffic only (jam 7+)'
  return 'Minimal: Only avoid near-standstill (jam 9+)'
})

const emit = defineEmits<{
  go: []
}>()

const handleSearch = async () => {
  isLoadingRoutes.value = true
  try {
    await getBetterWayRoutes(
      startLocation.coordinates,
      endLocation.coordinates,
      RouteEtaMargin.value * 60,
      jamThreshold.value,
    )
  } catch (error) {
    console.error('Failed to find better routes:', error)
  } finally {
    isLoadingRoutes.value = false
  }
}

const handleStartSelect = (suggestion: SearchResult) => {
  startLocation.address = suggestion.address
  startLocation.coordinates = suggestion.position
  startSuggestions.value = []
}

const handleEndSelect = (suggestion: SearchResult) => {
  endLocation.address = suggestion.address
  endLocation.coordinates = suggestion.position
  endSuggestions.value = []
}

// Only called on actual user input (not programmatic changes)
const handleStartSearch = async (query: string) => {
  if (query.length < 2) {
    startSuggestions.value = []
    return
  }
  try {
    startSuggestions.value = await searchPlaces(query)
  } catch (error) {
    console.error('Search failed:', error)
  }
}

const handleEndSearch = async (query: string) => {
  if (query.length < 2) {
    endSuggestions.value = []
    return
  }
  try {
    endSuggestions.value = await searchPlaces(query)
  } catch (error) {
    console.error('Search failed:', error)
  }
}
</script>

<template>
  <div
    class="route-tile-card relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl shadow-blue-900/10 ring-1 ring-black/5 backdrop-blur-xl"
  >
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-bold text-gray-800">Plan your trip</h2>
      <div class="flex items-center gap-3">
        <button
          @click="toggleTraffic"
          class="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors"
          :class="
            trafficEnabled
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          "
        >
          <div
            class="h-2 w-2 rounded-full"
            :class="trafficEnabled ? 'bg-green-500' : 'bg-gray-400'"
          />
          Traffic
        </button>
        <div class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
          Best Route
        </div>
      </div>
    </div>

    <div class="relative flex flex-col gap-4">
      <!-- Start Input -->
      <BetterInput
        v-model="startLocation.address"
        placeholder="Start location"
        label="From"
        @search="handleStartSearch"
      />
      <BetterDropdown
        v-if="startSuggestions.length > 0"
        :suggestions="startSuggestions"
        @select="handleStartSelect"
      />
      <!-- End Input -->
      <BetterInput
        v-model="endLocation.address"
        placeholder="Destination"
        label="To"
        @search="handleEndSearch"
      />
      <BetterDropdown
        v-if="endSuggestions.length > 0"
        :suggestions="endSuggestions"
        @select="handleEndSelect"
      />
      <BetterInput
        v-model.number="RouteEtaMargin"
        placeholder="ETA margin"
        label="ETA margin"
        type="number"
      />

      <!-- Traffic Avoidance Settings -->
      <div class="mt-2 rounded-xl bg-gray-50/80 p-4 ring-1 ring-gray-200/60">
        <div class="flex items-center justify-between mb-2">
          <h3 class="text-xs font-semibold tracking-wide text-gray-600 uppercase">
            Traffic Tolerance
          </h3>
          <span class="text-xs font-semibold text-blue-600"> {{ jamThreshold }}/10 </span>
        </div>
        <input
          v-model.number="jamThreshold"
          type="range"
          min="1"
          max="10"
          step="1"
          class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <p class="mt-2 text-xs text-gray-500 italic">
          {{ jamThresholdDescription }}
        </p>
      </div>

      <RouteCarousel />

      <!-- Actions -->
      <div class="mt-2 grid grid-cols-2 gap-3">
        <BetterButton variant="ghost" size="md" @click="clearRoutes"> clear </BetterButton>
        <BetterButton
          v-if="!routes.length"
          variant="primary"
          size="md"
          @click="handleSearch"
          :disabled="!startLocation || !endLocation"
        >
          Find Route
        </BetterButton>
        <BetterButton v-else variant="primary" size="md" @click="emit('go')"> Go </BetterButton>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
