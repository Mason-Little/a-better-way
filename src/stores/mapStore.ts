/**
 * Map Store
 * Manages the shared map instance and route rendering
 */

import { ref, shallowRef } from 'vue'

import type { MapViewOptions, RoutingResult } from '@/entities'
import { RouteRenderer } from '@/lib/here-sdk/routeRenderer'

// Re-export type for convenience
export type { MapViewOptions }

// ─────────────────────────────────────────────────────────────────────────────
// Shared State
// ─────────────────────────────────────────────────────────────────────────────

/** The shared HERE Map instance */
const map = shallowRef<H.Map | null>(null)

/** The route renderer instance */
const routeRenderer = shallowRef<RouteRenderer | null>(null)

/** Currently displayed routes result */
const currentRoutes = ref<RoutingResult | null>(null)

/** Currently selected route index */
const selectedRouteIndex = ref(0)

/** Loading state for route calculation */
const isLoadingRoutes = ref(false)

// ─────────────────────────────────────────────────────────────────────────────
// Map Management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register the map instance (call from MapContainer onMounted)
 */
export function registerMap(mapInstance: H.Map): void {
  map.value = mapInstance
  routeRenderer.value = new RouteRenderer(mapInstance)
  console.log('[MapStore] Map registered, route renderer initialized')
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
  currentRoutes.value = null
  selectedRouteIndex.value = 0
  console.log('[MapStore] Map unregistered')
}

/**
 * Get the current map instance
 */
export function getMap(): H.Map | null {
  return map.value
}

// ─────────────────────────────────────────────────────────────────────────────
// Route Rendering
// ─────────────────────────────────────────────────────────────────────────────

/** Draw routes on the map */
export function drawRoutes(result: RoutingResult, selectIndex = 0): void {
  if (!routeRenderer.value) {
    console.warn('[MapStore] No route renderer available - map not initialized')
    return
  }

  currentRoutes.value = result
  selectedRouteIndex.value = selectIndex
  routeRenderer.value.drawRoutes(result, selectIndex)
  console.log(`[MapStore] Drew ${result.routes.length} routes, selected index ${selectIndex}`)
}

/** Select a different route by index */
export function selectRoute(index: number): void {
  if (!routeRenderer.value) {
    console.warn('[MapStore] No route renderer available')
    return
  }

  if (!currentRoutes.value || index >= currentRoutes.value.routes.length) {
    console.warn(`[MapStore] Invalid route index: ${index}`)
    return
  }

  selectedRouteIndex.value = index
  routeRenderer.value.setSelectedRoute(index)
  console.log(`[MapStore] Selected route ${index}`)
}

/**
 * Clear all routes from the map
 */
export function clearRoutes(): void {
  if (routeRenderer.value) {
    routeRenderer.value.clearRoutes()
  }
  currentRoutes.value = null
  selectedRouteIndex.value = 0
  console.log('[MapStore] Routes cleared')
}

// ─────────────────────────────────────────────────────────────────────────────
// Camera Control
// ─────────────────────────────────────────────────────────────────────────────

/** Update the map camera view */
export function setMapView(options: MapViewOptions): void {
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
export function getMapView(): MapViewOptions | null {
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
    currentRoutes,
    selectedRouteIndex,
    isLoadingRoutes,

    // Actions
    registerMap,
    unregisterMap,
    getMap,
    drawRoutes,
    selectRoute,
    clearRoutes,

    // Camera control
    setMapView,
    getMapView,
  }
}
