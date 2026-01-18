<script setup lang="ts">
import { reactive, ref } from 'vue'

import type { SearchResult } from '@/entities'
import { useMapStore } from '@/stores/mapStore'
import { useRoutesStore } from '@/stores/routesStore'
import { searchPlaces } from '@/lib/here-sdk/search'
import { findBetterRoutes } from '@/utils/routing'
import RouteCarousel from '@/components/RouteCarousel.vue'
import BetterButton from '@/components/ui/BetterButton.vue'
import BetterInput from '@/components/ui/BetterInput.vue'
import LocationSearchInput from '@/components/ui/LocationSearchInput.vue'
import TrafficToleranceSlider from '@/components/ui/TrafficToleranceSlider.vue'

const mapStore = useMapStore()
const routesStore = useRoutesStore()

const startLocation = reactive({
  address: '',
  coords: { lat: 0, lng: 0 },
})

const endLocation = reactive({
  address: '',
  coords: { lat: 0, lng: 0 },
})

const startSearchRef = ref<InstanceType<typeof LocationSearchInput> | null>(null)
const endSearchRef = ref<InstanceType<typeof LocationSearchInput> | null>(null)

const etaMargin = ref(10)
const jamThreshold = ref(5)

const emit = defineEmits<{ go: [] }>()

async function handleFindRoutes() {
  mapStore.isLoading = true
  try {
    await findBetterRoutes(
      startLocation.coords,
      endLocation.coords,
      etaMargin.value * 60,
      jamThreshold.value,
    )
  } catch (e) {
    console.error('[RouteTile] Route search failed:', e)
  } finally {
    mapStore.isLoading = false
  }
}

async function handleStartSearch(query: string) {
  const results = await searchPlaces(query)
  startSearchRef.value?.setSuggestions(results)
}

async function handleEndSearch(query: string) {
  const results = await searchPlaces(query)
  endSearchRef.value?.setSuggestions(results)
}
</script>

<template>
  <div
    class="route-tile-card relative z-10 w-full max-w-md rounded-3xl border border-white/50 bg-white/80 p-6 shadow-2xl shadow-blue-900/20 backdrop-blur-2xl transition-all duration-500"
  >
    <div class="mb-4 flex items-center justify-between">
      <h2 class="text-lg font-bold text-gray-800">Plan your trip</h2>
      <div class="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600">
        Best Route
      </div>
    </div>

    <div class="relative flex flex-col gap-4">
      <LocationSearchInput
        ref="startSearchRef"
        v-model="startLocation.address"
        placeholder="Start location"
        label="From"
        @search="handleStartSearch"
        @select="(s: SearchResult) => (startLocation.coords = s.position)"
      />

      <LocationSearchInput
        ref="endSearchRef"
        v-model="endLocation.address"
        placeholder="Destination"
        label="To"
        @search="handleEndSearch"
        @select="(s: SearchResult) => (endLocation.coords = s.position)"
      />

      <BetterInput v-model.number="etaMargin" label="ETA margin (minutes)" />

      <TrafficToleranceSlider v-model="jamThreshold" class="mt-2" />

      <RouteCarousel />

      <div class="mt-2 grid grid-cols-2 gap-3">
        <BetterButton variant="ghost" size="md" @click="routesStore.clear">Clear</BetterButton>
        <BetterButton
          v-if="!routesStore.routes.length"
          variant="primary"
          size="md"
          @click="handleFindRoutes"
          :disabled="!startLocation.coords.lat || !endLocation.coords.lat"
        >
          Find Route
        </BetterButton>
        <BetterButton v-else variant="primary" size="md" @click="emit('go')">Go</BetterButton>
      </div>
    </div>
  </div>
</template>
