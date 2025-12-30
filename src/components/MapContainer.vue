<script setup lang="ts">
import { onMounted, onUnmounted, ref, shallowRef } from 'vue'

const mapContainer = ref<HTMLDivElement | null>(null)
const mapInstance = shallowRef<H.Map | null>(null)
const platform = shallowRef<H.service.Platform | null>(null)
const behavior = shallowRef<H.mapevents.Behavior | null>(null)
const ui = shallowRef<H.ui.UI | null>(null)
const routePolyline = shallowRef<H.map.Polyline | null>(null)

// Squamish, BC coordinates
const INITIAL_CENTER = { lat: 49.7016, lng: -123.1558 }
const INITIAL_ZOOM = 12

const drawRoute = (coordinates: Array<{ lat: number; lng: number }>) => {
  if (!mapInstance.value) return

  // Clear existing route first
  clearRoute()

  // Create LineString from coordinates
  const lineString = new H.geo.LineString()
  for (const coord of coordinates) {
    lineString.pushPoint(coord)
  }

  // Create polyline with styling
  routePolyline.value = new H.map.Polyline(lineString, {
    style: {
      strokeColor: '#2563eb',
      lineWidth: 5,
    },
  })

  mapInstance.value.addObject(routePolyline.value)
}

const drawRouteFromEncoded = (encodedPolyline: string) => {
  if (!mapInstance.value) return

  clearRoute()

  const lineString = H.geo.LineString.fromFlexiblePolyline(encodedPolyline)
  routePolyline.value = new H.map.Polyline(lineString, {
    style: {
      strokeColor: '#2563eb',
      lineWidth: 5,
    },
  })

  mapInstance.value.addObject(routePolyline.value)
}

const clearRoute = () => {
  if (routePolyline.value && mapInstance.value) {
    mapInstance.value.removeObject(routePolyline.value)
    routePolyline.value = null as unknown as H.map.Polyline
  }
}

onMounted(() => {
  if (!mapContainer.value) return

  const apiKey = import.meta.env.VITE_HERE_API_KEY
  if (!apiKey || apiKey === 'your_here_api_key_here') {
    console.error('[MapContainer] HERE API key not configured')
    return
  }

  // Initialize HERE platform
  platform.value = new H.service.Platform({ apikey: apiKey })
  const defaultLayers = platform.value.createDefaultLayers()

  // Initialize map
  mapInstance.value = new H.Map(mapContainer.value, defaultLayers.vector.normal.map, {
    center: INITIAL_CENTER,
    zoom: INITIAL_ZOOM,
    pixelRatio: window.devicePixelRatio || 1,
  })

  // Enable map interaction (pan, zoom)
  const mapEvents = new H.mapevents.MapEvents(mapInstance.value)
  behavior.value = new H.mapevents.Behavior(mapEvents)

  // Add default UI (zoom buttons, etc.)
  ui.value = H.ui.UI.createDefault(mapInstance.value, defaultLayers)

  // Handle window resize
  window.addEventListener('resize', handleResize)
})

const handleResize = () => {
  if (mapInstance.value) {
    mapInstance.value.getViewModel().setLookAtData({
      position: mapInstance.value.getCenter(),
      zoom: mapInstance.value.getZoom(),
    })
  }
}

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  behavior.value?.dispose()
  ui.value?.dispose()
  mapInstance.value?.dispose()
})

defineExpose({
  drawRoute,
  drawRouteFromEncoded,
  clearRoute,
})
</script>

<template>
  <div ref="mapContainer" class="h-full w-full"></div>
</template>
