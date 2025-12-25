<script setup lang="ts">
import { ref } from 'vue'
import MapButton from '@/components/ui/MapButton.vue'
import MapInput from '@/components/ui/MapInput.vue'
import { searchAddress } from '@/utils/search'
import { getRoute } from '@/utils/routing'
import type { SearchOption } from '@/types/search'
import type { Route } from '@tomtom-org/maps-sdk/core'

const emit = defineEmits<{
  (e: 'route-calculated', route: Route): void
}>()

const startLocation = ref('')
const endLocation = ref('')
const startLocationOptions = ref<SearchOption[]>([])
const endLocationOptions = ref<SearchOption[]>([])
const startCoordinates = ref<[number, number] | null>(null)
const endCoordinates = ref<[number, number] | null>(null)

const handleRoute = async () => {
  if (!startCoordinates.value || !endCoordinates.value) {
    console.warn('Start or end coordinates missing')
    return
  }

  const route = await getRoute(startCoordinates.value, endCoordinates.value)
  if (route) {
    emit('route-calculated', route)
  }
}

const handleStartLocationChange = async (value: string) => {
  startLocation.value = value
  startCoordinates.value = null // Reset coordinates on input change
  startLocationOptions.value = await searchAddress(value)
}

const handleEndLocationChange = async (value: string) => {
  endLocation.value = value
  endCoordinates.value = null // Reset coordinates on input change
  endLocationOptions.value = await searchAddress(value)
}

const handleStartOptionSelect = (option: SearchOption) => {
  startLocation.value = option.label
  startCoordinates.value = option.coordinates
  startLocationOptions.value = []
}

const handleEndOptionSelect = (option: SearchOption) => {
  endLocation.value = option.label
  endCoordinates.value = option.coordinates
  endLocationOptions.value = []
}
</script>

<template>
  <div class="w-full max-w-[400px] rounded-xl bg-white p-6 shadow-lg">
    <h2 class="mt-0 mb-6 text-xl font-semibold text-gray-900">Get Directions</h2>
    <div class="flex flex-col gap-4">
      <MapInput
        v-model="startLocation"
        label="Start Location"
        placeholder="Enter start location"
        id="start-location"
        @update:modelValue="handleStartLocationChange"
        :options="startLocationOptions"
        @select="handleStartOptionSelect"
      />

      <MapInput
        v-model="endLocation"
        label="Destination"
        placeholder="Enter destination"
        id="end-location"
        @update:modelValue="handleEndLocationChange"
        :options="endLocationOptions"
        @select="handleEndOptionSelect"
      />

      <MapButton variant="primary" @click="handleRoute" class="mt-2 w-full">
        Get Directions
      </MapButton>
    </div>
  </div>
</template>
