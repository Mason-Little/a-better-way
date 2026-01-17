<script setup lang="ts">
import { reactive, ref } from 'vue'

import { useMapStore } from '@/stores/mapStore'
import { useRoutesStore } from '@/stores/routesStore'
import { searchPlaces, type SearchResult } from '@/lib/here-sdk/search'
import { getBetterWayRoutes } from '@/utils/routing'
import RouteCarousel from '@/components/RouteCarousel.vue'
import BetterButton from '@/components/ui/BetterButton.vue'
import BetterInput from '@/components/ui/BetterInput.vue'
import LocationSearchInput from '@/components/ui/LocationSearchInput.vue'
import TrafficToleranceSlider from '@/components/ui/TrafficToleranceSlider.vue'

// ─────────────────────────────────────────────────────────────────────────────
// Store Access
// ─────────────────────────────────────────────────────────────────────────────

const { isLoadingRoutes, trafficEnabled, toggleTraffic } = useMapStore()
const { routes, clearRoutes } = useRoutesStore()

// ─────────────────────────────────────────────────────────────────────────────
// Form State
// ─────────────────────────────────────────────────────────────────────────────

const startLocation = reactive({
  address: '',
  coordinates: { lat: 0, lng: 0 },
})

const endLocation = reactive({
  address: '',
  coordinates: { lat: 0, lng: 0 },
})

const startSearchRef = ref<InstanceType<typeof LocationSearchInput> | null>(null)
const endSearchRef = ref<InstanceType<typeof LocationSearchInput> | null>(null)

const routeEtaMargin = ref<number>(10)
const jamThreshold = ref<number>(5)

// ─────────────────────────────────────────────────────────────────────────────
// Event Handlers
// ─────────────────────────────────────────────────────────────────────────────

const emit = defineEmits<{
  go: []
}>()

async function handleFindRoutes() {
  isLoadingRoutes.value = true
  try {
    await getBetterWayRoutes(
      startLocation.coordinates,
      endLocation.coordinates,
      routeEtaMargin.value * 60,
      jamThreshold.value,
    )
  } catch (error) {
    console.error('[RouteTile] Failed to find better routes:', error)
  } finally {
    isLoadingRoutes.value = false
  }
}

function handleStartSelect(suggestion: SearchResult) {
  startLocation.coordinates = suggestion.position
}

function handleEndSelect(suggestion: SearchResult) {
  endLocation.coordinates = suggestion.position
}

async function handleStartSearch(query: string) {
  try {
    const results = await searchPlaces(query)
    startSearchRef.value?.setSuggestions(results)
  } catch (error) {
    console.error('[RouteTile] Search failed:', error)
  }
}

async function handleEndSearch(query: string) {
  try {
    const results = await searchPlaces(query)
    endSearchRef.value?.setSuggestions(results)
  } catch (error) {
    console.error('[RouteTile] Search failed:', error)
  }
}
</script>

<template>
  <div
    class="route-tile-card relative z-10 w-full max-w-md rounded-3xl border border-white/50 bg-white/80 p-6 shadow-2xl shadow-blue-900/20 backdrop-blur-2xl transition-all duration-500"
  >
    <!-- Header -->
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
      <!-- Start Location Input -->
      <LocationSearchInput
        ref="startSearchRef"
        v-model="startLocation.address"
        placeholder="Start location"
        label="From"
        @search="handleStartSearch"
        @select="handleStartSelect"
      />

      <!-- End Location Input -->
      <LocationSearchInput
        ref="endSearchRef"
        v-model="endLocation.address"
        placeholder="Destination"
        label="To"
        @search="handleEndSearch"
        @select="handleEndSelect"
      />

      <!-- ETA Margin Input -->
      <BetterInput
        v-model.number="routeEtaMargin"
        placeholder="ETA margin"
        label="ETA margin (minutes)"
      />

      <!-- Traffic Tolerance Slider -->
      <TrafficToleranceSlider v-model="jamThreshold" class="mt-2" />

      <!-- Route Results -->
      <RouteCarousel />

      <!-- Action Buttons -->
      <div class="mt-2 grid grid-cols-2 gap-3">
        <BetterButton variant="ghost" size="md" @click="clearRoutes">Clear</BetterButton>
        <BetterButton
          v-if="!routes.length"
          variant="primary"
          size="md"
          @click="handleFindRoutes"
          :disabled="!startLocation.coordinates.lat || !endLocation.coordinates.lat"
        >
          Find Route
        </BetterButton>
        <BetterButton v-else variant="primary" size="md" @click="emit('go')">Go</BetterButton>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
