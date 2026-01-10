/**
 * Map Store
 * Manages the shared map instance and route rendering
 */

import { ref, shallowRef } from 'vue'

import type { BoundingBox, MapViewOptions, RoutingResult } from '@/entities'
import { useDebugStore } from '@/stores/debugStore'
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

/** Debug bounding box instance */
const debugBoundingBox = shallowRef<H.map.Rect | null>(null)

/** Traffic segments group */
const trafficSegmentsGroup = shallowRef<H.map.Group | null>(null)

/** Stop signs group */
const stopSignsGroup = shallowRef<H.map.Group | null>(null)

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
}

/**
 * Unregister the map instance (call from MapContainer onUnmounted)
 */
export function unregisterMap(): void {
  if (routeRenderer.value) {
    routeRenderer.value.clearRoutes()
    routeRenderer.value = null
  }
  clearTrafficSegments()
  map.value = null
  defaultLayers.value = null
  trafficEnabled.value = false
  clearDebugBoundingBox()
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
}

/** Disable traffic layer */
function disableTraffic(): void {
  if (!map.value || !defaultLayers.value) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const trafficLayer = (defaultLayers.value.vector as any).traffic.map
  map.value.removeLayer(trafficLayer)
  trafficEnabled.value = false
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Debug Rendering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Draw a debug bounding box on the map
 */
function drawDebugBoundingBox(bbox: BoundingBox): void {
  const { isDev, features } = useDebugStore()

  // Only draw in dev mode and if feature is enabled
  if (!isDev.value || !features.showTrafficBoundingBox) {
    clearDebugBoundingBox()
    return
  }

  if (!map.value) {
    console.warn('[MapStore] No map available to draw debug bbox')
    return
  }

  // clear existing box first
  clearDebugBoundingBox()

  const rect = new H.map.Rect(new H.geo.Rect(bbox.north, bbox.west, bbox.south, bbox.east), {
    style: {
      strokeColor: 'rgba(255, 0, 0, 0.7)', // Red stroke
      lineWidth: 2,
      fillColor: 'rgba(255, 0, 0, 0.1)', // Light red fill
    },
  })

  map.value.addObject(rect)
  debugBoundingBox.value = rect
}

/**
 * Clear the debug bounding box from the map
 */
function clearDebugBoundingBox(): void {
  if (debugBoundingBox.value && map.value) {
    map.value.removeObject(debugBoundingBox.value)
  }
  debugBoundingBox.value = null
}

/**
 * Draw traffic segments for debugging/visualization
 */
function drawTrafficSegments(segments: { shape?: { lat: number; lng: number }[] }[]): void {
  const { isDev, features } = useDebugStore()

  if (!isDev.value || !features.showTrafficSegments) {
    clearTrafficSegments()
    return
  }

  if (!map.value) {
    return
  }

  clearTrafficSegments()

  const group = new H.map.Group()

  segments.forEach((seg) => {
    if (!seg.shape || seg.shape.length < 2) return

    const lineString = new H.geo.LineString()
    seg.shape.forEach((pt) => lineString.pushPoint(pt))

    const polyline = new H.map.Polyline(lineString, {
      style: {
        lineWidth: 4,
        strokeColor: 'rgba(255, 0, 0, 0.7)', // Red
        lineDash: [2, 2],
      },
    })

    group.addObject(polyline)
  })

  // Add group to map
  map.value.addObject(group)
  trafficSegmentsGroup.value = group
}

/**
 * Clear traffic segments
 */
function clearTrafficSegments(): void {
  if (trafficSegmentsGroup.value && map.value) {
    map.value.removeObject(trafficSegmentsGroup.value)
  }
  trafficSegmentsGroup.value = null
}

/**
 * Draw stop signs on the map
 */
function drawStopSigns(boxes: BoundingBox[]): void {
  const { isDev, features } = useDebugStore()

  if (!isDev.value || !features.showStopSigns) {
    clearStopSigns()
    return
  }

  if (!map.value) return

  clearStopSigns()

  const group = new H.map.Group()

  boxes.forEach((box) => {
    // Calculate center of the bounding box for the marker
    const centerLat = (box.north + box.south) / 2
    const centerLng = (box.east + box.west) / 2

    // Create a DOM marker with a "STOP" sign style
    const domIcon = new H.map.DomIcon(
      `<div style="
        background-color: #cc0000;
        color: white;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 2px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        font-weight: bold;
        font-size: 10px;
        font-family: sans-serif;
      ">STOP</div>`,
    )

    const marker = new H.map.DomMarker({ lat: centerLat, lng: centerLng }, { icon: domIcon })
    group.addObject(marker)
  })

  map.value.addObject(group)
  stopSignsGroup.value = group
}

/**
 * Clear stop signs
 */
function clearStopSigns(): void {
  if (stopSignsGroup.value && map.value) {
    map.value.removeObject(stopSignsGroup.value)
  }
  stopSignsGroup.value = null
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
    drawDebugBoundingBox,
    clearDebugBoundingBox,
    drawTrafficSegments,
    clearTrafficSegments,
    drawStopSigns,
    clearStopSigns,

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
