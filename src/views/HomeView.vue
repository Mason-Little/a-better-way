<script setup lang="ts">
import { ref } from 'vue'
import MapContainer from '../components/MapContainer.vue'
import NavigationPanel from '../components/NavigationPanel.vue'
import { getRoute } from '@/lib/here/routing'

const mapRef = ref<InstanceType<typeof MapContainer> | null>(null)
const isLoading = ref(false)

const handleRoute = async (
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
) => {
  isLoading.value = true

  try {
    const result = await getRoute(origin, destination)
    if (result) {
      mapRef.value?.drawRoute(result.coordinates)
    }
  } finally {
    isLoading.value = false
  }
}

const handleClear = () => {
  mapRef.value?.clearRoute()
}
</script>

<template>
  <main class="relative h-screen w-screen">
    <MapContainer ref="mapRef" />
    <NavigationPanel :is-loading="isLoading" @route="handleRoute" @clear="handleClear" />
  </main>
</template>
