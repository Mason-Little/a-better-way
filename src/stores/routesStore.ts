/**
 * Routes Store
 * Manages the application's route data using a singleton state pattern.
 */

import { ref } from 'vue'

import type { BoundingBox, FlowResponse, PrioritizedSegment, Route } from '@/entities'
import { useMapStore } from '@/stores/mapStore'

// ─────────────────────────────────────────────────────────────────────────────
// Shared State
// ─────────────────────────────────────────────────────────────────────────────

/** The shared list of routes */
const routes = ref<Route[]>([])

/** Currently selected route index */
const selectedRouteIndex = ref(0)

/** Accumulated traffic segments to avoid (with priority info) */
const avoidSegments = ref<PrioritizedSegment[]>([])

/** Accumulated stop sign bounding boxes to avoid */
const avoidStopSignBoxes = ref<BoundingBox[]>([])

/** Bounding box covering all cached traffic data */
const trafficCoverageBbox = ref<BoundingBox | null>(null)

/** Cached traffic flow response */
const cachedTrafficFlow = ref<FlowResponse | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add routes, deduplicating by polyline
 */
function setRoutes(newRoutes: Route[]): boolean {
  const existingPolylines = new Set(routes.value.map((r) => r.sections[0]?.polyline))
  const uniqueNewRoutes = newRoutes.filter((r) => !existingPolylines.has(r.sections[0]?.polyline))

  if (uniqueNewRoutes.length < newRoutes.length) {
  }

  if (uniqueNewRoutes.length === 0) {
    return false
  }

  routes.value.push(...uniqueNewRoutes)
  const { drawRoutes } = useMapStore()
  drawRoutes({ routes: routes.value })
  return true
}

/**
 * Clear all routes
 */
function clearRoutes() {
  const { clearRoutesFromMap } = useMapStore()
  routes.value = []
  selectedRouteIndex.value = 0
  clearRoutesFromMap()
  clearAvoidZones()
}

/**
 * Select a different route by index
 */
function selectRoute(index: number) {
  if (index < 0 || index >= routes.value.length) {
    console.warn(`[RoutesStore] Invalid route index: ${index}`)
    return
  }

  const { setSelectedRouteOnMap } = useMapStore()
  selectedRouteIndex.value = index
  setSelectedRouteOnMap(index)
}

/**
 * Add traffic segments to avoid (merges with existing, dedupes by ID)
 */
function addAvoidSegments(segments: PrioritizedSegment[]) {
  const existingIds = new Set(avoidSegments.value.map((s) => s.id))
  const newSegments = segments.filter((s) => !existingIds.has(s.id))
  avoidSegments.value.push(...newSegments)
}

/**
 * Add stop sign bounding boxes to avoid
 */
function addAvoidStopSignBoxes(boxes: BoundingBox[]) {
  avoidStopSignBoxes.value.push(...boxes)
}

/**
 * Get cleaned segment IDs, sorted by priority and limited to max
 */
function getCleanedSegments(maxSegments = 250): string[] {
  const seen = new Set<string>()
  const sorted = [...avoidSegments.value].sort((a, b) => b.priority - a.priority) // Higher priority (edges) first
  const unique = sorted.filter((s) => !seen.has(s.id) && seen.add(s.id))
  const limited = unique.slice(0, maxSegments)
  return limited.map((s) => s.id)
}

/**
 * Clear all avoid zones
 */
function clearAvoidZones() {
  avoidSegments.value = []
  avoidStopSignBoxes.value = []
}

/**
 * Get the current traffic coverage bounding box
 */
function getTrafficCoverageBbox(): BoundingBox | null {
  return trafficCoverageBbox.value
}

/**
 * Set the traffic coverage bounding box
 */
function setTrafficCoverageBbox(bbox: BoundingBox): void {
  trafficCoverageBbox.value = bbox
}

/**
 * Get cached traffic flow data
 */
function getCachedTrafficFlow(): FlowResponse | null {
  return cachedTrafficFlow.value
}

/**
 * Set cached traffic flow data
 */
function setCachedTrafficFlow(flow: FlowResponse | null): void {
  cachedTrafficFlow.value = flow
}

/**
 * Clear traffic cache (bbox and flow data)
 */
function clearTrafficCache(): void {
  trafficCoverageBbox.value = null
  cachedTrafficFlow.value = null
}

// ─────────────────────────────────────────────────────────────────────────────
// Composable Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Composable for accessing routes store state and actions
 */
export function useRoutesStore() {
  return {
    // State
    routes,
    selectedRouteIndex,
    avoidSegments,
    avoidStopSignBoxes,
    trafficCoverageBbox,
    cachedTrafficFlow,

    // Actions
    setRoutes,
    clearRoutes,
    selectRoute,
    addAvoidSegments,
    addAvoidStopSignBoxes,
    getCleanedSegments,
    clearAvoidZones,
    getTrafficCoverageBbox,
    setTrafficCoverageBbox,
    getCachedTrafficFlow,
    setCachedTrafficFlow,
    clearTrafficCache,
  }
}
