<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { createMap, type MapInstance } from '@/lib/here-sdk'

const mapContainer = ref<HTMLDivElement>()
let mapInstance: MapInstance | null = null

onMounted(() => {
  if (!mapContainer.value) return

  mapInstance = createMap({
    container: mapContainer.value,
    center: { lat: 37.7749, lng: -122.4194 },
    zoom: 15,
    tilt: 25,
    heading: 0,
    interactive: true,
    showControls: false,
  })
})

onUnmounted(() => {
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

/* Override HERE Maps UI styling for modern look */
:deep(.H_ui) {
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    sans-serif;
}

:deep(.H_zoom) {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow:
    0 4px 12px rgb(0 0 0 / 0.15),
    0 0 0 1px rgb(0 0 0 / 0.05);
  overflow: hidden;
}

:deep(.H_zoom .H_btn) {
  background: transparent;
  border: none;
  transition: background-color 0.15s ease;
}

:deep(.H_zoom .H_btn:hover) {
  background: rgba(0, 0, 0, 0.05);
}

:deep(.H_zoom .H_btn:active) {
  background: rgba(0, 0, 0, 0.1);
}

:deep(.H_scalebar) {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  color: #374151;
}
</style>
