<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import { registerMap, unregisterMap } from '@/stores/mapStore'
import { createMap, type MapInstance } from '@/lib/here-sdk'

const mapContainer = ref<HTMLDivElement>()
let mapInstance: MapInstance | null = null

onMounted(() => {
  if (!mapContainer.value) return

  mapInstance = createMap({
    container: mapContainer.value,
    zoom: 15,
    tilt: 25,
    heading: 0,
    interactive: true,
    showControls: false,
  })

  // Register map with store for route rendering
  registerMap(mapInstance.map)
})

onUnmounted(() => {
  // Unregister from store first
  unregisterMap()

  mapInstance?.dispose()
  mapInstance = null
})

// Expose map instance for parent components
defineExpose({
  getMap: () => mapInstance?.map,
  getInstance: () => mapInstance,
})
</script>

<template>
  <div ref="mapContainer" class="map-container" />
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1),
    0 0 0 1px rgb(255 255 255 / 0.05);
}
</style>
