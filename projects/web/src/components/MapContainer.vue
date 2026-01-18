<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

import { useMapStore } from '@/stores/mapStore'
import { useDebugOverlay } from '@/composables/useDebugOverlay'
import { createMap, type MapInstance } from '@/lib/here-sdk'

const mapContainer = ref<HTMLDivElement>()
const mapStore = useMapStore()
const debug = useDebugOverlay()

let mapInstance: MapInstance | null = null

onMounted(() => {
  if (!mapContainer.value) return

  mapInstance = createMap({
    container: mapContainer.value,
    tilt: 25,
    heading: 0,
    interactive: true,
    showControls: false,
  })

  mapStore.register(mapInstance)
  debug.init(mapInstance.map)
})

onUnmounted(() => {
  debug.dispose()
  mapStore.unregister()
  mapInstance?.dispose()
  mapInstance = null
})

defineExpose({
  getMap: () => mapInstance?.map,
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
}
</style>
