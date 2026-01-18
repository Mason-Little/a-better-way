/**
 * Routes Store
 * Manages the application's route data using a singleton state pattern.
 */

import { ref } from 'vue'

import type { Route } from '@/entities'
import { useAvoidanceStore } from '@/stores/avoidanceStore'
import { useMapStore } from '@/stores/mapStore'
import { evaluateRoutes } from '@/utils/evaluation'
import { findStopSigns } from '@/utils/stop-sign/finder'

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

  // Sort routes by total calculated time (base + penalty) low to high
  routes.value.sort((a, b) => {
    const timeA = a.evaluation?.totalAvoidanceScore ?? 0
    const timeB = b.evaluation?.totalAvoidanceScore ?? 0
    return timeA - timeB
  })
}

/**
 * Add routes, deduplicating by polyline
 */
function setRoutes(newRoutes: Route[]): boolean {
  const addedRoutes: Route[] = []

  // Create a map of existing polylines to routes for quick lookup
  const polylineToRoute = new Map<string, Route>()
  for (const r of routes.value) {
    if (r.sections[0]?.polyline) {
      polylineToRoute.set(r.sections[0].polyline, r)
    }
  }

  for (const newRoute of newRoutes) {
    const polyline = newRoute.sections[0]?.polyline
    if (!polyline) continue

    if (polylineToRoute.has(polyline)) {
      // Route exists: Merge avoidInput
      const existingRoute = polylineToRoute.get(polyline)!

      if (newRoute.avoidInput) {
        if (!existingRoute.avoidInput) {
          existingRoute.avoidInput = { segments: [], stopSignBoxes: [] }
        }

        // Merge segments
        const inputsMerged = existingRoute.avoidInput
        const existingSegments = new Set(inputsMerged.segments)
        let segmentsAdded = 0
        newRoute.avoidInput.segments.forEach((segId) => {
          if (!existingSegments.has(segId)) {
            inputsMerged.segments.push(segId)
            existingSegments.add(segId)
            segmentsAdded++
          }
        })

        // Merge stopSignBoxes
        const existingBoxesStr = new Set(
          inputsMerged.stopSignBoxes.map((b) => `${b.north},${b.south},${b.east},${b.west}`),
        )
        let boxesAdded = 0
        newRoute.avoidInput.stopSignBoxes.forEach((box) => {
          const key = `${box.north},${box.south},${box.east},${box.west}`
          if (!existingBoxesStr.has(key)) {
            inputsMerged.stopSignBoxes.push(box)
            existingBoxesStr.add(key)
            boxesAdded++
          }
        })

        if (segmentsAdded > 0 || boxesAdded > 0) {
          console.log(
            `[RoutesStore] Merged ${segmentsAdded} segments and ${boxesAdded} stop signs into existing route`,
          )
        }
      }
    } else {
      // New distinct route
      addedRoutes.push(newRoute)
      // Add to map to handle duplicates within the same batch
      polylineToRoute.set(polyline, newRoute)
    }
  }

  if (addedRoutes.length === 0) {
    return false
  }

  routes.value.push(...addedRoutes)
  const { drawRoutes } = useMapStore()
  drawRoutes({ routes: routes.value })

  // Scan for stop signs in background for newly added routes
  findStopSigns(addedRoutes).then((results) => {
    if (results.length > 0) {
      console.log(`[RoutesStore] Found ${results.length} stop signs`)
      const { addStopSigns } = useAvoidanceStore()
      addStopSigns(results.map((r) => r.stopSign))
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
