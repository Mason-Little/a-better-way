/**
 * Map Store
 * Manages the shared map instance and route rendering
 */

import { ref, shallowRef } from 'vue'

import type { MapViewOptions, RoutingResult } from '@/entities'
import { RouteRenderer } from '@/lib/here-sdk/routeRenderer'

// ─────────────────────────────────────────────────────────────────────────────
// Shared State
// ─────────────────────────────────────────────────────────────────────────────

/** The shared HERE Map instance */
const map = shallowRef<H.Map | null>(null)

/** The default layers collection */
const defaultLayers = shallowRef<H.service.Platform.DefaultLayers | null>(null)

/** The route renderer instance */
const routeRenderer = shallowRef<RouteRenderer | null>(null)

/** Loading state for route calculation */
const isLoadingRoutes = ref(false)

/** Traffic layer enabled state */
const trafficEnabled = ref(false)

// ─────────────────────────────────────────────────────────────────────────────
// Map Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register the map instance (call from MapContainer onMounted)
 */
export function registerMap(instance: {
  map: H.Map
  layers: H.service.Platform.DefaultLayers
}): void {
  map.value = instance.map
  defaultLayers.value = instance.layers
  routeRenderer.value = new RouteRenderer(instance.map)

  // Restore traffic state if needed
  if (trafficEnabled.value) {
    enableTraffic()
  }

  console.log('[MapStore] Map registered, renderers initialized')
}

/**
 * Unregister the map instance (call from MapContainer onUnmounted)
 */
export function unregisterMap(): void {
  if (routeRenderer.value) {
    routeRenderer.value.clearRoutes()
    routeRenderer.value = null
  }
  map.value = null
  defaultLayers.value = null
  trafficEnabled.value = false
  console.log('[MapStore] Map unregistered')
}

/**
 * Get the current map instance
 */
function getMap(): H.Map | null {
  return map.value
}

// ─────────────────────────────────────────────────────────────────────────────
// specific Traffic Management
// ─────────────────────────────────────────────────────────────────────────────

/** Enable traffic layer */
function enableTraffic(): void {
  if (!map.value || !defaultLayers.value) return

  // Traffic layers are under vector.traffic, not vector.normal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trafficLayer = (defaultLayers.value.vector as any).traffic.map
  map.value.addLayer(trafficLayer)
  trafficEnabled.value = true
  console.log('[MapStore] Traffic layer enabled')
}

/** Disable traffic layer */
function disableTraffic(): void {
  if (!map.value || !defaultLayers.value) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trafficLayer = (defaultLayers.value.vector as any).traffic.map
  map.value.removeLayer(trafficLayer)
  trafficEnabled.value = false
  console.log('[MapStore] Traffic disabled')
}

/** Toggle traffic layer */
function toggleTraffic(): void {
  if (trafficEnabled.value) {
    disableTraffic()
  } else {
    enableTraffic()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Rendering
// ─────────────────────────────────────────────────────────────────────────────

/** Draw routes on the map */
function drawRoutes(result: RoutingResult, selectIndex = 0): void {
  if (!routeRenderer.value) {
    console.warn('[MapStore] No route renderer available - map not initialized')
    return
  }

  routeRenderer.value.drawRoutes(result, selectIndex)
  console.log(`[MapStore] Drew ${result.routes.length} routes, selected index ${selectIndex}`)
}

/** Set the selected route on the map renderer */
function setSelectedRouteOnMap(index: number): void {
  if (!routeRenderer.value) {
    console.warn('[MapStore] No route renderer available')
    return
  }

  routeRenderer.value.setSelectedRoute(index)
}

/** Clear routes from the map */
function clearRoutesFromMap(): void {
  if (routeRenderer.value) {
    routeRenderer.value.clearRoutes()
  }
  console.log('[MapStore] Routes cleared from map')
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera Control
// ─────────────────────────────────────────────────────────────────────────────

/** Update the map camera view */
function setMapView(options: MapViewOptions): void {
  if (!map.value) {
    console.warn('[MapStore] No map available')
    return
  }

  const { center, zoom, heading, tilt, animate = true } = options

  if (animate) {
    // Use lookAt for animated transitions
    const currentViewModel = map.value.getViewModel()
    const currentLookAtData = currentViewModel.getLookAtData()

    map.value.getViewModel().setLookAtData(
      {
        position: center ?? currentLookAtData.position,
        zoom: zoom ?? currentLookAtData.zoom,
        heading: heading ?? currentLookAtData.heading,
        tilt: tilt ?? currentLookAtData.tilt,
      },
      animate,
    )
  } else {
    // Direct updates without animation
    if (center) {
      map.value.setCenter(center)
    }
    if (zoom !== undefined) {
      map.value.setZoom(zoom)
    }
    // Note: heading and tilt require setLookAtData even without animation
    if (heading !== undefined || tilt !== undefined) {
      const currentViewModel = map.value.getViewModel()
      const currentLookAtData = currentViewModel.getLookAtData()
      currentViewModel.setLookAtData({
        position: center ?? currentLookAtData.position,
        zoom: zoom ?? currentLookAtData.zoom,
        heading: heading ?? currentLookAtData.heading,
        tilt: tilt ?? currentLookAtData.tilt,
      })
    }
  }

  console.log('[MapStore] Map view updated:', options)
}

/**
 * Get the current map view state
 */
function getMapView(): MapViewOptions | null {
  if (!map.value) {
    return null
  }

  const lookAtData = map.value.getViewModel().getLookAtData()
  return {
    center: lookAtData.position
      ? { lat: lookAtData.position.lat, lng: lookAtData.position.lng }
      : undefined,
    zoom: lookAtData.zoom,
    heading: lookAtData.heading,
    tilt: lookAtData.tilt,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composable Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Composable for accessing map store state and actions
 */
export function useMapStore() {
  return {
    // Reactive state
    map,
    isLoadingRoutes,

    // Actions
    registerMap,
    unregisterMap,
    getMap,
    drawRoutes,
    setSelectedRouteOnMap,
    clearRoutesFromMap,

    // Camera control
    setMapView,
    getMapView,

    // Traffic
    trafficEnabled,
    enableTraffic,
    disableTraffic,
    toggleTraffic,
  }
}
