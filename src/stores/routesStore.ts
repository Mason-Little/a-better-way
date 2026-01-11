/**
 * Routes Store
 * Manages the application's route data using a singleton state pattern.
 */

import { ref } from 'vue'

import type { Route } from '@/entities'
import { useAvoidanceStore } from '@/stores/avoidanceStore'
import { useMapStore } from '@/stores/mapStore'
import { evaluateRoutes } from '@/utils/evaluation'
import { findStopSigns } from '@/utils/stoplight/finder'

// ─────────────────────────────────────────────────────────────────────────────
// Shared State
// ─────────────────────────────────────────────────────────────────────────────

/** The shared list of routes */
const routes = ref<Route[]>([])

/** Currently selected route index */
const selectedRouteIndex = ref(0)

// ─────────────────────────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate all routes against current avoidance zones
 */
function evaluateAllRoutes(): void {
  const { trafficSegments, stopSignBoxes } = useAvoidanceStore()

  if (routes.value.length === 0) return

  const results = evaluateRoutes(routes.value, trafficSegments.value, stopSignBoxes.value)

  // Assign evaluation results directly to routes
  for (const route of routes.value) {
    const evaluation = results.get(route.id)
    if (evaluation) {
      route.evaluation = evaluation
    }
  }
}

/**
 * Add routes, deduplicating by polyline
 */
function setRoutes(newRoutes: Route[]): boolean {
  const existingPolylines = new Set(routes.value.map((r) => r.sections[0]?.polyline))
  const uniqueNewRoutes = newRoutes.filter((r) => !existingPolylines.has(r.sections[0]?.polyline))

  if (uniqueNewRoutes.length === 0) {
    return false
  }

  routes.value.push(...uniqueNewRoutes)
  const { drawRoutes } = useMapStore()
  drawRoutes({ routes: routes.value })

  // Scan for stop signs in background
  findStopSigns(uniqueNewRoutes).then((results) => {
    if (results.length > 0) {
      console.log(`[RoutesStore] Found ${results.length} stop signs`)
      const { addStopSignBoxes } = useAvoidanceStore()
      addStopSignBoxes(results.map((r) => r.avoidZone))
    }
  })

  return true
}

/**
 * Clear all routes
 */
function clearRoutes() {
  const { clearRoutesFromMap } = useMapStore()
  const { clearAll } = useAvoidanceStore()
  routes.value = []
  selectedRouteIndex.value = 0
  clearRoutesFromMap()
  clearAll()
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

    // Actions
    setRoutes,
    clearRoutes,
    selectRoute,
    evaluateAllRoutes,
  }
}
